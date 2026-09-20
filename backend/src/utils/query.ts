import { z } from 'zod';

export const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().trim().max(200).optional(),
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

export function parseSort(
  sort: string | undefined,
  allowedFields: readonly string[],
  fallback: Record<string, 'asc' | 'desc'>,
): Record<string, 'asc' | 'desc'> {
  if (!sort) return fallback;
  const desc = sort.startsWith('-');
  const field = desc ? sort.slice(1) : sort;
  if (!allowedFields.includes(field)) return fallback;
  return { [field]: desc ? 'desc' : 'asc' };
}

export function getPaginationMeta(total: number, page: number, limit: number) {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNextPage: page * limit < total,
    hasPrevPage: page > 1,
  };
}