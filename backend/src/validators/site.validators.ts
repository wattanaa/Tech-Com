import { z } from 'zod';
import {
  cuid,
  emailField,
  optionalCuid,
  optionalText,
  phoneField,
  stringArray,
  thaiText,
  toUpdateSchema,
} from './common.js';

// ─────────────────────────────  ห้องปฏิบัติการ  ─────────────────────────────

const facilityShape = {
  name: thaiText('ชื่อห้อง', 3, 200),
  description: thaiText('รายละเอียดห้อง', 10, 3_000),
  computerCount: z.number().int().min(0).max(999).default(0),
  software: stringArray(30),
  equipment: stringArray(30),
  location: optionalText(200),
  order: z.number().int().min(0).max(999).default(0),
  isVisible: z.boolean().default(true),
  coverImageId: optionalCuid,
};

export const createFacilitySchema = z.object(facilityShape);
export const updateFacilitySchema = toUpdateSchema(facilityShape);

// ──────────────────────────────  อัลบั้มภาพ  ──────────────────────────────

const albumShape = {
  name: thaiText('ชื่ออัลบั้ม', 3, 200),
  description: optionalText(1_000),
  eventDate: z.coerce.date().nullish(),
  isPublished: z.boolean().default(false),
  order: z.number().int().min(0).max(999).default(0),
  coverImageId: optionalCuid,
};

export const createAlbumSchema = z.object(albumShape);
export const updateAlbumSchema = toUpdateSchema(albumShape);

/** เพิ่มภาพเข้าอัลบั้มทีละหลายไฟล์ */
export const addGalleryImagesSchema = z.object({
  mediaIds: z.array(cuid).min(1, 'กรุณาเลือกภาพอย่างน้อย 1 ภาพ').max(50),
});

export const updateGalleryImageSchema = z.object({
  caption: optionalText(300),
});

/** จัดลำดับภาพใหม่หลังลากวาง */
export const reorderSchema = z.object({
  items: z
    .array(z.object({ id: cuid, order: z.number().int().min(0).max(9_999) }))
    .min(1, 'ไม่มีรายการให้จัดลำดับ')
    .max(500),
});

// ───────────────────────────────  หมวดหมู่  ───────────────────────────────

const categoryShape = {
  name: thaiText('ชื่อหมวดหมู่', 1, 100),
  slug: z
    .string()
    .trim()
    .min(1, 'กรุณากรอก slug')
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'slug ใส่ได้เฉพาะ a-z ตัวเลข และขีดกลาง'),
  type: z.enum(['NEWS', 'ACTIVITY', 'PROJECT']),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'สีต้องอยู่ในรูปแบบ #RRGGBB')
    .default('#007AFF'),
  order: z.number().int().min(0).max(999).default(0),
};

export const createCategorySchema = z.object(categoryShape);
export const updateCategorySchema = toUpdateSchema(categoryShape);

// ────────────────────────────  ฟอร์มติดต่อแผนก  ────────────────────────────

export const contactMessageSchema = z.object({
  name: thaiText('ชื่อ-สกุล', 2, 150),
  email: emailField,
  phone: phoneField,
  subject: thaiText('หัวข้อเรื่อง', 3, 200),
  message: thaiText('ข้อความ', 10, 3_000),
  /** ช่องล่อ bot — ผู้ใช้จริงมองไม่เห็นจึงต้องว่างเสมอ */
  website: z.string().max(0, 'ตรวจพบการส่งข้อความอัตโนมัติ').optional(),
});
