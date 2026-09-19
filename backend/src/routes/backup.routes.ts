import { Router } from 'express';
import { BackupType } from '@prisma/client';
import { prisma } from '../config/database.js';
import { authGuard } from '../middleware/auth.middleware.js';
import { requireSuperAdmin, requirePermission } from '../middleware/rbac.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { buildMeta, sendCreated, sendNoContent, sendSuccess } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { createBackup, deleteBackup, restoreBackup } from '../services/backup.service.js';
import { writeAuditLog } from '../services/audit.service.js';

const router = Router();
router.use(authGuard, requirePermission('backup:manage'), requireSuperAdmin);

/** BigInt แปลงเป็น JSON ตรง ๆ ไม่ได้ จึงแปลงเป็นตัวเลขก่อนส่งออก */
function serialize(row: { size: bigint }) {
  return { ...row, size: Number(row.size) };
}

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const items = await prisma.backup.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { createdBy: { select: { id: true, name: true } } },
    });
    sendSuccess(res, items.map(serialize), 200, buildMeta(1, 50, items.length));
  }),
);

/** POST /api/v1/admin/backups — สั่งสำรองข้อมูลทันที (ทำงานเบื้องหลัง) */
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const record = await createBackup(req.user!.id, BackupType.DATABASE);
    await writeAuditLog(req, {
      action: 'CREATE',
      entity: 'Backup',
      entityId: record.id,
      note: 'สั่งสำรองข้อมูล',
    });
    sendCreated(res, {
      ...serialize(record),
      message: 'เริ่มสำรองข้อมูลแล้ว ระบบจะอัปเดตสถานะให้เมื่อเสร็จสิ้น',
    });
  }),
);

/**
 * POST /api/v1/admin/backups/:id/restore
 * เขียนทับข้อมูลทั้งหมด จึงบังคับให้ยืนยันด้วยการพิมพ์ข้อความยืนยันมาด้วย
 * กันการกดพลาดจากหน้าจอที่ปุ่มอยู่ใกล้กัน
 */
router.post(
  '/:id/restore',
  asyncHandler(async (req, res) => {
    const confirm = String((req.body as { confirm?: string })?.confirm ?? '');
    if (confirm !== 'ยืนยันการกู้คืน') {
      throw ApiError.badRequest(
        'การกู้คืนจะเขียนทับข้อมูลปัจจุบันทั้งหมด กรุณาพิมพ์ "ยืนยันการกู้คืน" เพื่อยืนยัน',
      );
    }

    const id = String(req.params.id);
    await writeAuditLog(req, {
      action: 'RESTORE',
      entity: 'Backup',
      entityId: id,
      note: 'เริ่มกู้คืนฐานข้อมูล',
    });
    await restoreBackup(id, req.user!.id);

    sendSuccess(res, {
      message: 'กู้คืนข้อมูลเรียบร้อยแล้ว แนะนำให้ออกจากระบบแล้วเข้าใหม่อีกครั้ง',
    });
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    await deleteBackup(id);
    await writeAuditLog(req, { action: 'DELETE', entity: 'Backup', entityId: id });
    sendNoContent(res);
  }),
);

export default router;
