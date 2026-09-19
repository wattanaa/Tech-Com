import 'express';
import 'express-session';

/** ผู้ใช้ที่ผ่านการยืนยันตัวตนแล้ว — ประกอบขึ้นใน authGuard จาก session */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  roleName: 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR';
  roleLevel: number;
  permissions: string[];
}

declare module 'express-session' {
  interface SessionData {
    userId?: string;
    /** เวลาที่ล็อกอิน ใช้ตรวจอายุ session ฝั่ง server */
    loginAt?: number;
  }
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** request id สำหรับไล่ log — ตั้งใน app.ts */
      id?: string;
      user?: AuthUser;
      /** query ที่ผ่าน Zod แล้ว — เก็บแยกเพราะ req.query แก้ไม่ได้ */
      validatedQuery?: unknown;
    }
  }
}
