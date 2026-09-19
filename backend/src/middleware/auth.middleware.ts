import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../config/database.js';
import { ApiError } from '../utils/ApiError.js';
import type { AuthUser } from '../types/express.js';

/**
 * โหลดผู้ใช้จาก session แล้วแนบไว้ที่ req.user
 * ไม่ปฏิเสธ request ที่ไม่ได้ล็อกอิน — ใช้กับ route สาธารณะที่อยากรู้ว่าใครเปิดดูอยู่
 */
export async function attachUser(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.session?.userId;
    if (!userId) return next();

    const user = await prisma.user.findFirst({
      where: { id: userId, isActive: true, deletedAt: null },
      include: { role: { include: { permissions: { include: { permission: true } } } } },
    });

    // บัญชีถูกปิดหรือลบไปแล้วหลังจากล็อกอิน — ทำลาย session ทิ้งทันที
    if (!user) {
      req.session.destroy(() => undefined);
      return next();
    }

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      roleName: user.role.name,
      roleLevel: user.role.level,
      permissions: user.role.permissions.map((rp) => rp.permission.key),
    };
    req.user = authUser;
    next();
  } catch (err) {
    next(err);
  }
}

/** ต้องล็อกอินแล้วเท่านั้น — ใช้กับทุก route ใต้ /admin */
export function authGuard(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    next(ApiError.unauthorized('กรุณาเข้าสู่ระบบก่อนใช้งาน'));
    return;
  }
  next();
}
