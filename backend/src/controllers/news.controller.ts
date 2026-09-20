import { Request, Response, NextFunction } from 'express';
import { PrismaClient, Prisma, ContentStatus } from '@prisma/client';
import { listQuerySchema, parseSort, getPaginationMeta } from '../utils/query.js';

const prisma = new PrismaClient();
const ALLOWED_SORT = ['publishedAt', 'createdAt', 'views', 'title'] as const;

export async function getNewsList(req: Request, res: Response, next: NextFunction) {
  try {
    const q = listQuerySchema.parse(req.query);
    const skip = (q.page - 1) * q.limit;
    const orderBy = parseSort(q.sort, ALLOWED_SORT, { publishedAt: 'desc' });

    const where: Prisma.NewsWhereInput = {
      deletedAt: null,
      status: ContentStatus.PUBLISHED,
      ...(q.categoryId ? { categoryId: q.categoryId } : {}),
      ...(q.from || q.to ? { publishedAt: { gte: q.from, lte: q.to } } : {}),
      ...(q.search
        ? {
            OR: [
              { title: { contains: q.search, mode: 'insensitive' } },
              { excerpt: { contains: q.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, items] = await prisma.$transaction([
      prisma.news.count({ where }),
      prisma.news.findMany({
        where,
        skip,
        take: q.limit,
        orderBy: [{ isPinned: 'desc' }, orderBy],
        include: {
          category: { select: { id: true, name: true, slug: true, color: true } },
          coverImage: { select: { url: true, alt: true } },
          author: { select: { name: true } },
        },
      }),
    ]);

    return res.json({ success: true, data: items, meta: getPaginationMeta(total, q.page, q.limit) });
  } catch (err) {
    next(err);
  }
}

export async function getNewsBySlug(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug } = req.params;
    const item = await prisma.news.findFirst({
      where: { slug, deletedAt: null, status: ContentStatus.PUBLISHED },
      include: {
        category: true,
        coverImage: true,
        author: { select: { name: true } },
      },
    });

    if (!item) return res.status(404).json({ success: false, message: 'ไม่พบข่าวสาร' });

    await prisma.news.update({ where: { id: item.id }, data: { views: { increment: 1 } } });
    return res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
}