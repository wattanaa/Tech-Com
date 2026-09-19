import type { NextFunction, Request, RequestHandler, Response } from 'express';

/**
 * ห่อ handler ที่เป็น async เพื่อส่ง error ต่อให้ errorHandler กลาง
 *
 * Express 4 ไม่จับ rejected promise ให้เอง ถ้าลืมห่อแล้วเกิด error
 * request จะค้างจนหมดเวลาโดยไม่มี response และไม่มี log — จึงต้องห่อทุกตัว
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    void fn(req, res, next).catch(next);
  };
}
