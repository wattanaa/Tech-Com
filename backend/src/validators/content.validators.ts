import { z } from 'zod';
import {
  optionalCuid,
  optionalText,
  stringArray,
  thaiText,
  toUpdateSchema,
  urlField,
} from './common.js';

// ───────────────────────────  ข่าวประชาสัมพันธ์  ───────────────────────────

const newsShape = {
  title: thaiText('หัวข้อข่าว', 5, 250),
  excerpt: thaiText('สรุปย่อ', 10, 500),
  content: thaiText('เนื้อหาข่าว', 20, 50_000),
  categoryId: optionalCuid,
  coverImageId: optionalCuid,
  isPinned: z.boolean().default(false),
};

export const createNewsSchema = z.object(newsShape);
export const updateNewsSchema = toUpdateSchema(newsShape);

// ───────────────────────────────  กิจกรรม  ───────────────────────────────

const activityShape = {
  title: thaiText('ชื่อกิจกรรม', 5, 250),
  description: thaiText('รายละเอียดย่อ', 10, 500),
  content: z.string().trim().max(50_000).nullish(),
  startDate: z.coerce.date({ errorMap: () => ({ message: 'กรุณาระบุวันที่เริ่มกิจกรรม' }) }),
  endDate: z.coerce.date().nullish(),
  location: optionalText(250),
  categoryId: optionalCuid,
  coverImageId: optionalCuid,
};

export const createActivitySchema = z
  .object(activityShape)
  .refine((v) => !v.endDate || v.endDate >= v.startDate, {
    message: 'วันที่สิ้นสุดต้องไม่มาก่อนวันที่เริ่ม',
    path: ['endDate'],
  });

export const updateActivitySchema = toUpdateSchema(activityShape);

// ─────────────────────────────  ผลงานนักศึกษา  ─────────────────────────────

const projectShape = {
  name: thaiText('ชื่อผลงาน', 5, 250),
  description: thaiText('รายละเอียดผลงาน', 10, 5_000),
  year: z
    .number()
    .int()
    .min(2500, 'ปีการศึกษาต้องเป็นปี พ.ศ.')
    .max(2700, 'ปีการศึกษาไม่ถูกต้อง'),
  technologies: stringArray(15),
  demoUrl: urlField,
  githubUrl: urlField,
  award: optionalText(250),
  categoryId: optionalCuid,
  advisorId: optionalCuid,
  coverImageId: optionalCuid,
  /** รายชื่อนักศึกษาเจ้าของผลงาน */
  memberIds: z.array(z.string().cuid()).max(10).default([]),
};

export const createProjectSchema = z.object(projectShape);
export const updateProjectSchema = toUpdateSchema(projectShape);
