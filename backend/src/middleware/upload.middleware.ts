import multer from 'multer';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * รับไฟล์ไว้ในหน่วยความจำก่อน ไม่เขียนลงดิสก์ทันที
 *
 * เหตุผล: ต้องตรวจเนื้อไฟล์จริงและแปลงไฟล์ใหม่ก่อน
 * ถ้าเขียนลงดิสก์ก่อนตรวจ เท่ากับมีไฟล์ที่ยังไม่ผ่านการตรวจสอบวางอยู่บนเซิร์ฟเวอร์
 * แม้จะเพียงชั่วครู่ก็เป็นช่องโหว่
 */
export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.maxUploadBytes,
    files: 10,
    fields: 20,
  },
  fileFilter: (_req, file, cb) => {
    if (!env.allowedMimeTypes.includes(file.mimetype)) {
      cb(
        ApiError.badRequest(
          `ไม่รองรับไฟล์ชนิด ${file.mimetype} — รองรับเฉพาะ ${env.allowedMimeTypes.join(', ')}`,
        ),
      );
      return;
    }
    cb(null, true);
  },
});

/** แปลง error ของ multer เป็น ApiError ให้ผู้ใช้อ่านรู้เรื่อง */
export function handleUploadError(err: unknown): never {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      throw ApiError.payloadTooLarge(
        `ไฟล์ใหญ่เกิน ${env.MAX_UPLOAD_SIZE_MB} MB กรุณาย่อขนาดก่อนอัปโหลด`,
      );
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      throw ApiError.badRequest('อัปโหลดได้สูงสุดครั้งละ 10 ไฟล์');
    }
    throw ApiError.badRequest('อัปโหลดไฟล์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
  }
  throw err;
}
