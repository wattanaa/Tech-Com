import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { validate } from '../middleware/validate.middleware.js';
import { authGuard } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendNoContent, sendSuccess } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import {
  changePasswordSchema,
  loginSchema,
  updateProfileSchema,
} from '../validators/auth.validators.js';
import {
  changePassword,
  getCurrentUser,
  login,
  logout,
} from '../services/auth.service.js';
import { prisma } from '../config/database.js';
import { writeAuditLog } from '../services/audit.service.js';

const router = Router();

/**
 * จำกัดการพยายามล็อกอินต่อ IP — ชั้นป้องกันแรกก่อนถึงการล็อกบัญชีรายคน
 * ทั้งสองชั้นทำงานคู่กัน: ชั้นนี้กันการยิงรัว ชั้นบัญชีกันการเดารหัสของคนคนเดียว
 */
const loginLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
  max: env.LOGIN_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (_req, _res, next) =>
    next(ApiError.tooManyRequests('พยายามเข้าสู่ระบบบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่')),
});

router.post(
  '/login',
  loginLimiter,
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body as { email: string; password: string };
    const user = await login(req, email, password);
    sendSuccess(res, user);
  }),
);

router.post(
  '/logout',
  asyncHandler(async (req, res) => {
    await logout(req);
    res.clearCookie(env.SESSION_NAME);
    sendNoContent(res);
  }),
);

router.get(
  '/me',
  authGuard,
  asyncHandler(async (req, res) => {
    sendSuccess(res, await getCurrentUser(req.user!.id));
  }),
);

router.patch(
  '/profile',
  authGuard,
  validate(updateProfileSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as { name: string; phone?: string | null; avatarId?: string | null };
    const before = await prisma.user.findUnique({ where: { id: req.user!.id } });
    const updated = await prisma.user.update({
      where: { id: req.user!.id },
      data: { name: body.name, phone: body.phone ?? null, avatarId: body.avatarId ?? null },
    });
    await writeAuditLog(req, {
      action: 'UPDATE',
      entity: 'User',
      entityId: req.user!.id,
      before,
      after: updated,
    });
    sendSuccess(res, await getCurrentUser(req.user!.id));
  }),
);

router.patch(
  '/password',
  authGuard,
  validate(changePasswordSchema),
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body as {
      currentPassword: string;
      newPassword: string;
    };
    await changePassword(req, req.user!.id, currentPassword, newPassword);
    sendNoContent(res);
  }),
);

export default router;
