import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import { globalSearch } from '../services/search.service.js';

const router = Router();

const searchQuerySchema = z.object({
  q: z.string().trim().min(2, 'กรุณาพิมพ์คำค้นอย่างน้อย 2 ตัวอักษร').max(100),
});

/** GET /api/v1/search?q=... — ค้นหาทั่วเว็บไซต์ ผลลัพธ์จัดกลุ่มตามประเภท */
router.get(
  '/',
  validate(searchQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const { q } = req.validatedQuery as { q: string };
    sendSuccess(res, await globalSearch(q));
  }),
);

export default router;
