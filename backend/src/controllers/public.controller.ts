import { Request, Response, NextFunction } from 'express';
import { PrismaClient, Prisma, ContentStatus } from '@prisma/client';
import { listQuerySchema, parseSort, getPaginationMeta } from '../utils/query.js';

const prisma = new PrismaClient();

// Activities
export async function getActivities(req: Request, res: Response, next: NextFunction) {
  try {
    const q = listQuerySchema.parse(req.query);
    const skip = (q.page - 1) * q.limit;
    const orderBy = parseSort(q.sort, ['startDate', 'createdAt'], { startDate: 'desc' });

    const where: Prisma.ActivityWhereInput = {
      deletedAt: null,
      status: ContentStatus.PUBLISHED,
      ...(q.categoryId ? { categoryId: q.categoryId } : {}),
      ...(q.search ? { title: { contains: q.search, mode: 'insensitive' } } : {}),
    };

    const [total, items] = await prisma.$transaction([
      prisma.activity.count({ where }),
      prisma.activity.findMany({
        where,
        skip,
        take: q.limit,
        orderBy,
        include: { coverImage: { select: { url: true } }, category: true },
      }),
    ]);

    return res.json({ success: true, data: items, meta: getPaginationMeta(total, q.page, q.limit) });
  } catch (err) {
    next(err);
  }
}

// Facilities
export async function getFacilities(_req: Request, res: Response, next: NextFunction) {
  try {
    const items = await prisma.facility.findMany({
      where: { deletedAt: null, isVisible: true },
      orderBy: { order: 'asc' },
      include: { coverImage: { select: { url: true } } },
    });
    return res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
}