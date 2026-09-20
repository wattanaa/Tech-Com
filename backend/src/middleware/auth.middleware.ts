import { Request, Response, NextFunction } from 'express';
import { RoleName } from '@prisma/client';

// ตรวจสอบว่า Login หรือยัง
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session || !(req.session as any).userId) {
    return res.status(401).json({ success: false, message: 'กรุณาเข้าสู่ระบบก่อนใช้งาน' });
  }
  next();
};

// ตรวจสอบ Role (RBAC)
export const requireRole = (allowedRoles: RoleName[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = (req.session as any)?.role as RoleName;
    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({ success: false, message: 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้' });
    }
    next();
  };
};