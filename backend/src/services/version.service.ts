import type { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '../config/database.js';
import { ApiError } from '../utils/ApiError.js';

type TxClient = Prisma.TransactionClient | PrismaClient;

/** จำนวนเวอร์ชันที่เก็บต่อ 1 รายการ — เกินกว่านี้จะลบตัวเก่าสุดทิ้ง */
const MAX_VERSIONS_PER_ENTITY = 30;

/**
 * เก็บภาพรวมของข้อมูลทั้งก้อนก่อนถูกแก้ไข
 * เรียกภายในทรานแซกชันเดียวกับการแก้ข้อมูลเสมอ
 */
export async function createVersion(
  tx: TxClient,
  params: {
    entity: string;
    entityId: string;
    snapshot: unknown;
    changedById?: string | null;
    note?: string;
  },
): Promise<number> {
  const latest = await tx.contentVersion.findFirst({
    where: { entity: params.entity, entityId: params.entityId },
    orderBy: { version: 'desc' },
    select: { version: true },
  });

  const version = (latest?.version ?? 0) + 1;

  await tx.contentVersion.create({
    data: {
      entity: params.entity,
      entityId: params.entityId,
      version,
      snapshot: JSON.parse(JSON.stringify(params.snapshot)) as Prisma.InputJsonValue,
      changedById: params.changedById ?? null,
      note: params.note ?? null,
    },
  });

  // ตัดเวอร์ชันเก่าที่เกินเพดานออก ไม่ให้ตารางโตไม่จำกัด
  if (version > MAX_VERSIONS_PER_ENTITY) {
    await tx.contentVersion.deleteMany({
      where: {
        entity: params.entity,
        entityId: params.entityId,
        version: { lte: version - MAX_VERSIONS_PER_ENTITY },
      },
    });
  }

  return version;
}

export async function listVersions(entity: string, entityId: string) {
  return prisma.contentVersion.findMany({
    where: { entity, entityId },
    orderBy: { version: 'desc' },
    select: {
      id: true,
      version: true,
      note: true,
      createdAt: true,
      changedBy: { select: { id: true, name: true } },
    },
  });
}

export async function getVersion(entity: string, entityId: string, version: number) {
  const found = await prisma.contentVersion.findUnique({
    where: { entity_entityId_version: { entity, entityId, version } },
  });
  if (!found) throw ApiError.notFound('ไม่พบเวอร์ชันที่ต้องการ');
  return found;
}

/** เทียบสองเวอร์ชัน คืนเฉพาะฟิลด์ที่ต่างกัน สำหรับหน้าจอเปรียบเทียบใน Admin */
export async function compareVersions(
  entity: string,
  entityId: string,
  from: number,
  to: number,
) {
  const [a, b] = await Promise.all([
    getVersion(entity, entityId, from),
    getVersion(entity, entityId, to),
  ]);

  const snapA = a.snapshot as Record<string, unknown>;
  const snapB = b.snapshot as Record<string, unknown>;
  const fields: Record<string, { from: unknown; to: unknown }> = {};

  for (const key of new Set([...Object.keys(snapA), ...Object.keys(snapB)])) {
    if (JSON.stringify(snapA[key]) === JSON.stringify(snapB[key])) continue;
    fields[key] = { from: snapA[key] ?? null, to: snapB[key] ?? null };
  }

  return { from: a.version, to: b.version, fields };
}
