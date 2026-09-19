import { z } from 'zod';
import { PAGINATION } from '../config/constants.js';

/**
 * Query parameter มาตรฐานของทุก list endpoint
 * บังคับเพดาน limit ไว้ที่ 100 — ไม่มีทางที่ client จะขอข้อมูลทั้งตารางในครั้งเดียว
 * (ข้อกำหนด Availability: ไม่มี unbounded query)
 */
export const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(PAGINATION.DEFAULT_PAGE),
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(PAGINATION.MAX_LIMIT)
    .default(PAGINATION.DEFAULT_LIMIT),
  search: z.string().trim().max(200).optional(),
  /** ใส่ - นำหน้าเพื่อเรียงจากมากไปน้อย เช่น -publishedAt */
  sort: z.string().trim().max(60).optional(),
  status: z.string().trim().max(30).optional(),
  categoryId: z.string().trim().max(40).optional(),
  programId: z.string().trim().max(40).optional(),
  type: z.string().trim().max(30).optional(),
  year: z.coerce.number().int().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export type ListQuery = z.infer<typeof listQuerySchema>;

export interface SortOrder {
  [field: string]: 'asc' | 'desc';
}

/**
 * แปลง "-publishedAt" เป็น { publishedAt: 'desc' }
 * ยอมเฉพาะฟิลด์ที่อยู่ใน allowedFields เพื่อกันการเรียงด้วยฟิลด์ที่ไม่ควรเปิดเผย
 */
export function parseSort(
  sort: string | undefined,
  allowedFields: readonly string[],
  fallback: SortOrder,
): SortOrder {
  if (!sort) return fallback;
  const desc = sort.startsWith('-');
  const field = desc ? sort.slice(1) : sort;
  if (!allowedFields.includes(field)) return fallback;
  return { [field]: desc ? 'desc' : 'asc' };
}

export function getSkip(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * สร้างเงื่อนไขค้นหาแบบ OR หลายฟิลด์ ไม่สนตัวพิมพ์เล็กใหญ่
 * ใช้ contains ของ Prisma ซึ่ง parameterized อยู่แล้ว — ไม่มีช่องให้ SQL injection
 */
export function buildSearchFilter(
  search: string | undefined,
  fields: readonly string[],
): { OR: Record<string, { contains: string; mode: 'insensitive' }>[] } | undefined {
  if (!search || fields.length === 0) return undefined;
  return {
    OR: fields.map((field) => ({ [field]: { contains: search, mode: 'insensitive' as const } })),
  };
}
