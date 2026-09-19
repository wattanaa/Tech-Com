import { Router } from 'express';
import { NavLocation } from '@prisma/client';
import { prisma } from '../config/database.js';
import { validate } from '../middleware/validate.middleware.js';
import { authGuard } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/rbac.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendCreated, sendNoContent, sendSuccess } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import {
  createNavigationSchema,
  updateNavigationSchema,
} from '../validators/cms.validators.js';
import { reorderSchema } from '../validators/site.validators.js';
import { writeAuditLog } from '../services/audit.service.js';

const publicRouter = Router();
const adminRouter = Router();

const childrenSelect = {
  select: {
    id: true,
    label: true,
    href: true,
    icon: true,
    order: true,
    target: true,
  },
} as const;

/** GET /api/v1/navigation?location=HEADER — เมนูที่เปิดแสดงอยู่ พร้อมเมนูย่อย */
publicRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const location =
      String(req.query.location).toUpperCase() === 'FOOTER'
        ? NavLocation.FOOTER
        : NavLocation.HEADER;

    const items = await prisma.navigationItem.findMany({
      where: { location, isVisible: true, parentId: null },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        label: true,
        href: true,
        icon: true,
        order: true,
        target: true,
        children: { ...childrenSelect, where: { isVisible: true }, orderBy: { order: 'asc' } },
      },
    });
    sendSuccess(res, items);
  }),
);

// ── หลังบ้าน ────────────────────────────────────────────────
adminRouter.use(authGuard);

adminRouter.get(
  '/',
  requirePermission('homepage:read'),
  asyncHandler(async (_req, res) => {
    const items = await prisma.navigationItem.findMany({
      where: { parentId: null },
      orderBy: [{ location: 'asc' }, { order: 'asc' }],
      include: { children: { orderBy: { order: 'asc' } } },
    });
    sendSuccess(res, items);
  }),
);

adminRouter.post(
  '/',
  requirePermission('navigation:update'),
  validate(createNavigationSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as Record<string, unknown>;

    // เมนูย่อยซ้อนได้ชั้นเดียว — ลึกกว่านั้นผู้ใช้หาเมนูไม่เจอและทำให้ mobile ใช้งานยาก
    if (body.parentId) {
      const parent = await prisma.navigationItem.findUnique({
        where: { id: String(body.parentId) },
        select: { parentId: true },
      });
      if (!parent) throw ApiError.badRequest('ไม่พบเมนูหลักที่เลือก');
      if (parent.parentId) throw ApiError.badRequest('เมนูย่อยซ้อนได้เพียงชั้นเดียว');
    }

    const created = await prisma.navigationItem.create({ data: body as never });
    await writeAuditLog(req, {
      action: 'CREATE',
      entity: 'NavigationItem',
      entityId: created.id,
      after: created,
    });
    sendCreated(res, created);
  }),
);

adminRouter.put(
  '/:id',
  requirePermission('navigation:update'),
  validate(updateNavigationSchema),
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    const before = await prisma.navigationItem.findUnique({ where: { id } });
    if (!before) throw ApiError.notFound('ไม่พบเมนูที่ต้องการแก้ไข');

    const body = req.body as Record<string, unknown>;
    if (body.parentId === id) throw ApiError.badRequest('เมนูเป็นเมนูหลักของตัวเองไม่ได้');

    const updated = await prisma.navigationItem.update({ where: { id }, data: body as never });
    await writeAuditLog(req, {
      action: 'UPDATE',
      entity: 'NavigationItem',
      entityId: id,
      before,
      after: updated,
    });
    sendSuccess(res, updated);
  }),
);

adminRouter.delete(
  '/:id',
  requirePermission('navigation:update'),
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    const before = await prisma.navigationItem.findUnique({
      where: { id },
      include: { _count: { select: { children: true } } },
    });
    if (!before) throw ApiError.notFound('ไม่พบเมนูที่ต้องการลบ');

    // ลบเมนูหลักแล้วเมนูย่อยจะหายตามไปด้วย (Cascade) จึงเตือนให้ผู้ดูแลรู้ตัวก่อน
    if (before._count.children > 0 && req.query.force !== 'true') {
      throw ApiError.conflict(
        `เมนูนี้มีเมนูย่อยอยู่ ${before._count.children} รายการ ` +
          'การลบจะทำให้เมนูย่อยหายไปด้วย หากยืนยันให้ส่ง ?force=true',
      );
    }

    await prisma.navigationItem.delete({ where: { id } });
    await writeAuditLog(req, {
      action: 'DELETE',
      entity: 'NavigationItem',
      entityId: id,
      before,
    });
    sendNoContent(res);
  }),
);

/** จัดลำดับเมนูใหม่หลังลากวาง — บันทึกทั้งชุดในทรานแซกชันเดียว */
adminRouter.patch(
  '/reorder',
  requirePermission('navigation:update'),
  validate(reorderSchema),
  asyncHandler(async (req, res) => {
    const { items } = req.body as { items: { id: string; order: number }[] };

    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        await tx.navigationItem.update({ where: { id: item.id }, data: { order: item.order } });
      }
      await writeAuditLog(
        req,
        { action: 'UPDATE', entity: 'NavigationItem', note: 'จัดลำดับเมนูใหม่' },
        tx,
      );
    });

    sendSuccess(res, { updated: items.length });
  }),
);

export { publicRouter as navigationPublicRouter, adminRouter as navigationAdminRouter };
