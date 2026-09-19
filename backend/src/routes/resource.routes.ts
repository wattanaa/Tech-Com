import { Router } from 'express';
import type { ResourceConfig } from '../resources/types.js';
import { createResourceService } from '../services/resource.service.js';
import { createResourceController } from '../controllers/resource.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { authGuard } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/rbac.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { listQuerySchema } from '../utils/pagination.js';
import { changeStatusSchema } from '../validators/common.js';

/**
 * สร้าง router ของ 1 entity จากค่าใน ResourceConfig
 *
 * แยกเป็นสองชุด:
 *   public  — อ่านอย่างเดียว ไม่ต้องล็อกอิน เห็นเฉพาะที่เผยแพร่แล้ว
 *   admin   — ต้องล็อกอินและมีสิทธิ์ตรงตามการกระทำทุกครั้ง
 *
 * ทุก route ที่เปลี่ยนข้อมูลต้องผ่าน requirePermission เสมอ
 * ไม่มีข้อยกเว้น แม้จะเป็นการกระทำที่ดูไม่มีพิษภัย
 */
export function buildResourceRouters(config: ResourceConfig) {
  const service = createResourceService(config);
  const controller = createResourceController(service);
  const p = config.permission;

  // ── หน้าเว็บสาธารณะ ────────────────────────────────────────
  const publicRouter = Router();

  publicRouter.get(
    '/',
    validate(listQuerySchema, 'query'),
    asyncHandler(controller.listPublic),
  );
  publicRouter.get('/:identifier', asyncHandler(controller.getPublic));

  // ── หลังบ้าน ───────────────────────────────────────────────
  const adminRouter = Router();
  adminRouter.use(authGuard);

  adminRouter.get(
    '/',
    requirePermission(`${p}:read`),
    validate(listQuerySchema, 'query'),
    asyncHandler(controller.listAdmin),
  );
  adminRouter.get('/:id', requirePermission(`${p}:read`), asyncHandler(controller.getAdmin));

  adminRouter.post(
    '/',
    requirePermission(`${p}:create`),
    validate(config.createSchema),
    asyncHandler(controller.create),
  );

  adminRouter.put(
    '/:id',
    requirePermission(`${p}:update`),
    validate(config.updateSchema),
    asyncHandler(controller.update),
  );

  adminRouter.delete(
    '/:id',
    requirePermission(`${p}:delete`),
    asyncHandler(controller.remove),
  );

  // เปลี่ยนสถานะแยกจากการแก้ไข เพราะต้องตรวจเส้นทาง workflow และสิทธิ์เผยแพร่ต่างหาก
  if (config.hasStatus) {
    adminRouter.patch(
      '/:id/status',
      requirePermission(`${p}:update`),
      validate(changeStatusSchema),
      asyncHandler(controller.changeStatus),
    );
  }

  if (config.versioned) {
    adminRouter.get(
      '/:id/versions',
      requirePermission(`${p}:read`),
      asyncHandler(controller.listVersions),
    );
    adminRouter.get(
      '/:id/versions/compare',
      requirePermission(`${p}:read`),
      asyncHandler(controller.compareVersions),
    );
    adminRouter.post(
      '/:id/versions/:version/restore',
      requirePermission(`${p}:update`),
      asyncHandler(controller.restoreVersion),
    );
  }

  return { publicRouter, adminRouter, service };
}
