import { Request, Response, NextFunction } from 'express';
import { PrismaClient, Prisma, ContentStatus } from '@prisma/client';
import { listQuerySchema, parseSort, getPaginationMeta } from '../utils/query.js';

const prisma = new PrismaClient();

export async function getProjects(req: Request, res: Response, next: NextFunction) {
  try {
    const q = listQuerySchema.parse(req.query);
    const skip = (q.page - 1) * q.limit;
    const orderBy = parseSort(q.sort, ['year', 'name', 'createdAt'], { year: 'desc' });

    const where: Prisma.ProjectWhereInput = {
      deletedAt: null,
      status: ContentStatus.PUBLISHED,
      ...(q.year ? { year: q.year } : {}),
      ...(q.categoryId ? { categoryId: q.categoryId } : {}),
      ...(q.search
        ? {
            OR: [
              { name: { contains: q.search, mode: 'insensitive' } },
              { description: { contains: q.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, items] = await prisma.$transaction([
      prisma.project.count({ where }),
      prisma.project.findMany({
        where,
        skip,
        take: q.limit,
        orderBy,
        include: {
          category: true,
          coverImage: { select: { url: true } },
          advisor: { select: { prefix: true, firstName: true, lastName: true } },
          members: {
            include: {
              student: { select: { studentCode: true, prefix: true, firstName: true, lastName: true } },
            },
          },
        },
      }),
    ]);

    return res.json({ success: true, data: items, meta: getPaginationMeta(total, q.page, q.limit) });
  } catch (err) {
    next(err);
  }
}