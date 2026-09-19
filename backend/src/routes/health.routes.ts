import { Router } from 'express';
import { pingDatabase } from '../config/database.js';
import { sendSuccess } from '../utils/ApiResponse.js';

const router = Router();

/**
 * GET /api/v1/health
 * ใช้โดยระบบ monitoring / uptime robot และหน้าสถานะระบบใน Admin Dashboard
 * ตอบ 503 เมื่อฐานข้อมูลติดต่อไม่ได้ เพื่อให้ระบบภายนอกรู้ว่ายังไม่พร้อมให้บริการ
 */
router.get('/', async (_req, res) => {
  const db = await pingDatabase();
  const payload = {
    status: db.ok ? ('ok' as const) : ('degraded' as const),
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    database: { connected: db.ok, latencyMs: db.latencyMs },
    memoryMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
  };
  sendSuccess(res, payload, db.ok ? 200 : 503);
});

export default router;
