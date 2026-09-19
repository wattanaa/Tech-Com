import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError.js';
import { PERMISSIONS, ROLE_LEVEL } from '../config/constants.js';

/**
 * ด่านตรวจสิทธิ์ — ต้องมีทุก route ที่เปลี่ยนแปลงข้อมูล
 *
 * ข้อสำคัญ: การซ่อนปุ่มใน Frontend เป็นเรื่องของประสบการณ์ผู้ใช้เท่านั้น
 * ไม่ใช่มาตรการความปลอดภัย ใครก็ยิง API ตรงได้ การตรวจจริงต้องอยู่ตรงนี้
 */
export function requirePermission(...required: string[]) {
  // ตรวจตั้งแต่ตอน boot ว่าสะกดชื่อสิทธิ์ถูก — ผิดแล้วรู้ทันที ไม่ใช่ไปเจอตอนผู้ใช้กดใช้งาน
  for (const key of required) {
    if (!(key in PERMISSIONS)) {
      throw new Error(`ไม่รู้จักสิทธิ์ "${key}" — ตรวจ src/config/constants.ts`);
    }
  }

  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(ApiError.unauthorized());
      return;
    }
    const granted = required.every((key) => req.user!.permissions.includes(key));
    if (!granted) {
      next(ApiError.forbidden('บัญชีของคุณไม่มีสิทธิ์ดำเนินการนี้'));
      return;
    }
    next();
  };
}

/** จำกัดเฉพาะ SUPER_ADMIN — ใช้กับการจัดการผู้ใช้และการกู้คืนข้อมูล */
export function requireSuperAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    next(ApiError.unauthorized());
    return;
  }
  if (req.user.roleLevel < ROLE_LEVEL.SUPER_ADMIN) {
    next(ApiError.forbidden('เฉพาะผู้ดูแลระบบสูงสุดเท่านั้นที่ดำเนินการนี้ได้'));
    return;
  }
  next();
}

/** ตรวจว่าผู้ใช้มีสิทธิ์หรือไม่ โดยไม่ขัดจังหวะ request — ใช้ตัดสินใจภายใน service */
export function can(req: Request, permission: string): boolean {
  return req.user?.permissions.includes(permission) ?? false;
}
