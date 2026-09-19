import type { Request } from 'express';
import { type Prisma, type PrismaClient, ContentStatus } from '@prisma/client';
import { prisma } from '../config/database.js';
import { ApiError } from '../utils/ApiError.js';
import { buildSearchFilter, getSkip, parseSort, type ListQuery } from '../utils/pagination.js';
import { uniqueSlug } from '../utils/slug.js';
import { writeAuditLog } from './audit.service.js';
import { createVersion } from './version.service.js';
import {
  EDITOR_EDITABLE_STATUSES,
  ROLE_LEVEL,
  WORKFLOW_TRANSITIONS,
} from '../config/constants.js';
import type { ResourceConfig } from '../resources/types.js';

type TxClient = Prisma.TransactionClient;
type Row = Record<string, unknown>;

/**
 * หน้าตาขั้นต่ำของ Prisma delegate ที่ service นี้ใช้
 *
 * Prisma สร้าง type เฉพาะของแต่ละ model ซึ่งเอามาเขียนเป็น generic
 * ที่ครอบคลุมทุก model ไม่ได้ จึงนิยาม interface แคบ ๆ ขึ้นเองแล้วแปลงชนิดที่จุดเดียว
 * ตรงนี้ — เป็นการแปลงชนิดที่เดียวในระบบ และไม่ใช้ any
 */
interface Delegate {
  findMany(args?: unknown): Promise<Row[]>;
  findFirst(args?: unknown): Promise<Row | null>;
  count(args?: unknown): Promise<number>;
  create(args: unknown): Promise<Row>;
  update(args: unknown): Promise<Row>;
}

function delegateOf(client: PrismaClient | TxClient, model: string): Delegate {
  const found = (client as unknown as Record<string, Delegate | undefined>)[model];
  if (!found) throw new Error(`ไม่พบ Prisma model "${model}"`);
  return found;
}

/** สร้างชุดฟังก์ชัน CRUD สำหรับ 1 entity ตามค่าที่กำหนดใน ResourceConfig */
export function createResourceService(config: ResourceConfig) {
  const lookup = config.lookupField ?? (config.hasSlug ? 'slug' : 'id');

  /** เงื่อนไขพื้นฐาน: ไม่เอารายการที่ถูกลบแบบ soft delete */
  const notDeleted = () => (config.softDelete ? { deletedAt: null } : {});

  function buildWhere(query: ListQuery, isPublic: boolean): Record<string, unknown> {
    const where: Record<string, unknown> = { ...notDeleted() };

    const search = buildSearchFilter(query.search, config.searchFields);
    if (search) Object.assign(where, search);

    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.programId) where.programId = query.programId;
    if (query.year !== undefined) where.year = query.year;

    const extra = config.extraFilters?.(query);
    if (extra) Object.assign(where, extra);

    if (isPublic) {
      // หน้าสาธารณะเห็นเฉพาะที่เผยแพร่แล้วเท่านั้น — บังคับที่ backend ไม่ใช่ปล่อยให้ client กรอง
      if (config.hasStatus) where.status = ContentStatus.PUBLISHED;
      if (config.publicWhere) Object.assign(where, config.publicWhere);
    } else if (query.status) {
      where.status = query.status;
    }

    return where;
  }

  return {
    config,

    /** รายการ พร้อม search / filter / sort / pagination */
    async list(query: ListQuery, isPublic: boolean) {
      const db = delegateOf(prisma, config.model);
      const where = buildWhere(query, isPublic);
      const orderBy = parseSort(query.sort, config.sortFields, config.defaultSort);

      const [items, total] = await Promise.all([
        db.findMany({
          where,
          orderBy,
          skip: getSkip(query.page, query.limit),
          take: query.limit,
          include: isPublic ? config.publicInclude : (config.adminInclude ?? config.publicInclude),
        }),
        db.count({ where }),
      ]);

      return { items, total };
    },

    /** รายการเดียว — ค้นด้วย slug/code สำหรับหน้าสาธารณะ หรือ id สำหรับ Admin */
    async getOne(identifier: string, isPublic: boolean) {
      const db = delegateOf(prisma, config.model);

      const where: Record<string, unknown> = {
        ...notDeleted(),
        // Admin ส่ง id มาเสมอ ส่วนหน้าเว็บส่ง slug — ยอมรับทั้งสองแบบเพื่อไม่ต้องมี endpoint ซ้ำ
        OR: lookup === 'id' ? [{ id: identifier }] : [{ [lookup]: identifier }, { id: identifier }],
      };
      if (isPublic) {
        if (config.hasStatus) where.status = ContentStatus.PUBLISHED;
        if (config.publicWhere) Object.assign(where, config.publicWhere);
      }

      const item = await db.findFirst({
        where,
        include: isPublic ? config.publicInclude : (config.adminInclude ?? config.publicInclude),
      });
      if (!item) throw ApiError.notFound(`ไม่พบ${config.label}ที่ต้องการ`);
      return item;
    },

    /** เพิ่มยอดเข้าชม — แยกจาก getOne เพื่อไม่ให้ Admin preview ไปปั่นยอด */
    async incrementViews(id: string) {
      if (!config.hasViews) return;
      const db = delegateOf(prisma, config.model);
      await db.update({ where: { id }, data: { views: { increment: 1 } } }).catch(() => undefined);
    },

    async create(req: Request, input: Record<string, unknown>) {
      const db = delegateOf(prisma, config.model);
      const user = req.user!;

      const data: Record<string, unknown> = {
        ...(config.transformInput ? config.transformInput(input, 'create') : input),
        createdById: user.id,
        updatedById: user.id,
      };

      if (config.hasSlug && config.slugFrom) {
        const source = String(input[config.slugFrom] ?? '');
        data.slug = await uniqueSlug(source, async (candidate) => {
          const existing = await db.findFirst({ where: { slug: candidate }, select: { id: true } });
          return existing !== null;
        });
      }

      // ผู้เขียนที่ไม่มีสิทธิ์เผยแพร่ สร้างได้แค่ฉบับร่างเท่านั้น
      if (config.hasStatus && !user.permissions.includes(`${config.permission}:publish`)) {
        data.status = ContentStatus.DRAFT;
        data.publishedAt = null;
      }

      const created = await prisma.$transaction(async (tx) => {
        const row = await delegateOf(tx, config.model).create({ data });
        if (config.versioned) {
          await createVersion(tx, {
            entity: config.entity,
            entityId: String(row.id),
            snapshot: row,
            changedById: user.id,
            note: 'สร้างใหม่',
          });
        }
        await writeAuditLog(
          req,
          { action: 'CREATE', entity: config.entity, entityId: String(row.id), after: row },
          tx,
        );
        return row;
      });

      return created;
    },

    async update(req: Request, id: string, input: Record<string, unknown>) {
      const db = delegateOf(prisma, config.model);
      const user = req.user!;

      const before = await db.findFirst({ where: { id, ...notDeleted() } });
      if (!before) throw ApiError.notFound(`ไม่พบ${config.label}ที่ต้องการแก้ไข`);

      assertCanEdit(config, user, before);

      // ป้องกันการแก้ทับกัน: client ส่ง updatedAt ที่ตนเห็นกลับมา ถ้าไม่ตรงแปลว่ามีคนแก้ไปก่อนแล้ว
      const clientUpdatedAt = input.updatedAt;
      if (clientUpdatedAt && before.updatedAt instanceof Date) {
        const seen = new Date(String(clientUpdatedAt)).getTime();
        if (seen !== before.updatedAt.getTime()) {
          throw ApiError.conflict(
            'มีผู้อื่นแก้ไขข้อมูลนี้ไปแล้ว กรุณารีเฟรชหน้าจอเพื่อดูข้อมูลล่าสุดก่อนบันทึกอีกครั้ง',
          );
        }
      }
      delete input.updatedAt;

      // ห้ามเปลี่ยนสถานะผ่าน endpoint แก้ไขทั่วไป ต้องผ่าน changeStatus ที่ตรวจ workflow
      delete input.status;
      delete input.publishedAt;
      delete input.views;

      const payload = config.transformInput ? config.transformInput(input, 'update') : input;

      const updated = await prisma.$transaction(async (tx) => {
        const row = await delegateOf(tx, config.model).update({
          where: { id },
          data: { ...payload, updatedById: user.id },
        });
        if (config.versioned) {
          await createVersion(tx, {
            entity: config.entity,
            entityId: id,
            snapshot: before,
            changedById: user.id,
            note: 'ก่อนแก้ไข',
          });
        }
        await writeAuditLog(
          req,
          { action: 'UPDATE', entity: config.entity, entityId: id, before, after: row },
          tx,
        );
        return row;
      });

      return updated;
    },

    /** ลบแบบ soft delete — ข้อมูลยังอยู่ กู้คืนได้ และยังอ้างอิงจาก audit log ได้ */
    async remove(req: Request, id: string) {
      const db = delegateOf(prisma, config.model);
      const user = req.user!;

      const before = await db.findFirst({ where: { id, ...notDeleted() } });
      if (!before) throw ApiError.notFound(`ไม่พบ${config.label}ที่ต้องการลบ`);

      assertCanEdit(config, user, before);

      await prisma.$transaction(async (tx) => {
        if (config.softDelete) {
          await delegateOf(tx, config.model).update({
            where: { id },
            data: { deletedAt: new Date(), updatedById: user.id },
          });
        } else {
          await delegateOf(tx, config.model).update({ where: { id }, data: {} });
        }
        await writeAuditLog(
          req,
          { action: 'DELETE', entity: config.entity, entityId: id, before },
          tx,
        );
      });
    },

    /** เปลี่ยนสถานะตาม Content Workflow — ตรวจทั้งเส้นทางและสิทธิ์ */
    async changeStatus(req: Request, id: string, next: ContentStatus) {
      if (!config.hasStatus) {
        throw ApiError.badRequest(`${config.label}ไม่มีระบบสถานะการเผยแพร่`);
      }
      const db = delegateOf(prisma, config.model);
      const user = req.user!;

      const before = await db.findFirst({ where: { id, ...notDeleted() } });
      if (!before) throw ApiError.notFound(`ไม่พบ${config.label}ที่ต้องการ`);

      const current = String(before.status) as ContentStatus;
      const allowed = WORKFLOW_TRANSITIONS[current] ?? [];
      if (!allowed.includes(next)) {
        throw ApiError.badRequest(
          `เปลี่ยนสถานะจาก ${statusLabel(current)} เป็น ${statusLabel(next)} ไม่ได้ ` +
            `สถานะถัดไปที่เป็นไปได้คือ ${allowed.map(statusLabel).join(' หรือ ') || 'ไม่มี'}`,
        );
      }

      // อนุมัติและเผยแพร่ต้องมีสิทธิ์ publish เท่านั้น
      const needsPublishRight: string[] = [ContentStatus.APPROVED, ContentStatus.PUBLISHED];
      if (
        needsPublishRight.includes(next) &&
        !user.permissions.includes(`${config.permission}:publish`)
      ) {
        throw ApiError.forbidden(
          'บัญชีของคุณส่งเรื่องเข้าตรวจสอบได้ แต่อนุมัติหรือเผยแพร่เองไม่ได้',
        );
      }

      const data: Record<string, unknown> = { status: next, updatedById: user.id };
      if (next === ContentStatus.PUBLISHED && !before.publishedAt) data.publishedAt = new Date();

      const updated = await prisma.$transaction(async (tx) => {
        const row = await delegateOf(tx, config.model).update({ where: { id }, data });
        await writeAuditLog(
          req,
          {
            action: next === ContentStatus.PUBLISHED ? 'PUBLISH' : 'UPDATE',
            entity: config.entity,
            entityId: id,
            before: { status: current },
            after: { status: next },
          },
          tx,
        );
        return row;
      });

      return updated;
    },

    /** กู้คืนข้อมูลจากเวอร์ชันเก่า */
    async restoreVersion(req: Request, id: string, version: number) {
      const user = req.user!;
      const snapshot = await prisma.contentVersion.findUnique({
        where: { entity_entityId_version: { entity: config.entity, entityId: id, version } },
      });
      if (!snapshot) throw ApiError.notFound('ไม่พบเวอร์ชันที่ต้องการกู้คืน');

      const raw = snapshot.snapshot as Record<string, unknown>;
      // ไม่กู้คืนฟิลด์ระบบ — id ต้องคงเดิม เวลาและยอดชมต้องไม่ถูกย้อน
      const { id: _id, createdAt: _c, updatedAt: _u, views: _v, deletedAt: _d, ...restorable } = raw;

      const updated = await prisma.$transaction(async (tx) => {
        const current = await delegateOf(tx, config.model).findFirst({ where: { id } });
        await createVersion(tx, {
          entity: config.entity,
          entityId: id,
          snapshot: current ?? {},
          changedById: user.id,
          note: `ก่อนกู้คืนเป็นเวอร์ชัน ${version}`,
        });
        const row = await delegateOf(tx, config.model).update({
          where: { id },
          data: { ...restorable, updatedById: user.id },
        });
        await writeAuditLog(
          req,
          {
            action: 'RESTORE',
            entity: config.entity,
            entityId: id,
            before: current,
            after: row,
          },
          tx,
        );
        return row;
      });

      return updated;
    },
  };
}

export type ResourceService = ReturnType<typeof createResourceService>;

/**
 * ผู้เขียน (EDITOR) แก้ได้เฉพาะงานของตัวเองที่ยังเป็นฉบับร่างหรือรอตรวจ
 * งานที่เผยแพร่แล้วต้องให้ผู้ดูแลจัดการ เพื่อไม่ให้เนื้อหาบนหน้าเว็บถูกแก้โดยไม่มีใครรู้
 */
function assertCanEdit(
  config: ResourceConfig,
  user: NonNullable<Request['user']>,
  row: Row,
): void {
  if (user.roleLevel > ROLE_LEVEL.EDITOR) return;

  if (config.hasStatus) {
    const status = String(row.status);
    if (!EDITOR_EDITABLE_STATUSES.includes(status)) {
      throw ApiError.forbidden(
        `${config.label}ที่${statusLabel(status)}แล้ว ต้องให้ผู้ดูแลระบบเป็นผู้แก้ไข`,
      );
    }
  }

  if (row.createdById && row.createdById !== user.id) {
    throw ApiError.forbidden(`คุณแก้ไขได้เฉพาะ${config.label}ที่ตนเองเป็นผู้สร้าง`);
  }
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'ฉบับร่าง',
  REVIEW: 'รอตรวจสอบ',
  APPROVED: 'อนุมัติแล้ว',
  PUBLISHED: 'เผยแพร่',
  ARCHIVED: 'เก็บถาวร',
};

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}
