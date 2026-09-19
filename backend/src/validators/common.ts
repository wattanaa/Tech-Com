import { z } from 'zod';

/** ข้อความแจ้งเตือนภาษาไทย ใช้ซ้ำทุก schema ให้เสียงเดียวกันทั้งระบบ */
export const required = (field: string) => `กรุณากรอก${field}`;

export const cuid = z.string().cuid({ message: 'รหัสอ้างอิงไม่ถูกต้อง' });
export const optionalCuid = cuid.nullish();

export const thaiText = (field: string, min = 1, max = 500) =>
  z
    .string()
    .trim()
    .min(min, min > 0 ? required(field) : undefined)
    .max(max, `${field}ต้องยาวไม่เกิน ${max} ตัวอักษร`);

export const optionalText = (max = 500) => z.string().trim().max(max).nullish();

export const urlField = z
  .string()
  .trim()
  .url({ message: 'รูปแบบลิงก์ไม่ถูกต้อง (ต้องขึ้นต้นด้วย https://)' })
  .max(500)
  .nullish()
  .or(z.literal(''));

export const emailField = z
  .string()
  .trim()
  .email({ message: 'รูปแบบอีเมลไม่ถูกต้อง' })
  .max(200);

export const phoneField = z
  .string()
  .trim()
  .max(30)
  .regex(/^[0-9\s\-+()]*$/, { message: 'เบอร์โทรศัพท์ใส่ได้เฉพาะตัวเลขและเครื่องหมาย - + ( )' })
  .nullish();

export const stringArray = (max = 20) =>
  z.array(z.string().trim().min(1).max(120)).max(max).default([]);

export const statusEnum = z.enum(['DRAFT', 'REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED']);

export const changeStatusSchema = z.object({ status: statusEnum });

/** ใช้กับ path parameter ที่ต้องเป็น id */
export const idParamSchema = z.object({ id: cuid });

/**
 * ตัวช่วยสร้าง schema ของ update จาก schema ของ create
 * ทุกฟิลด์กลายเป็น optional และเพิ่ม updatedAt ไว้ตรวจการแก้ทับกัน
 */
export function toUpdateSchema<T extends z.ZodRawShape>(shape: T) {
  return z
    .object(shape)
    .partial()
    .extend({ updatedAt: z.string().datetime().optional() });
}
