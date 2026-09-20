import { Request, Response, NextFunction } from 'express';
import { PrismaClient, Prisma, ProgramLevel } from '@prisma/client';
import { listQuerySchema, parseSort, getPaginationMeta } from '../utils/query.js';

const prisma = new PrismaClient();

// --- Programs ---
export async function getPrograms(req: Request, res: Response, next: NextFunction) {
  try {
    const q = listQuerySchema.parse(req.query);
    const where: Prisma.ProgramWhereInput = {
      deletedAt: null,
      isVisible: true,
      ...(q.type ? { level: q.type as ProgramLevel } : {}),
      ...(q.search
        ? {
            OR: [
              { code: { contains: q.search, mode: 'insensitive' } },
              { name: { contains: q.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const items = await prisma.program.findMany({
      where,
      orderBy: { order: 'asc' },
      include: { image: { select: { url: true, alt: true } } },
    });

    return res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
}

// --- Courses ---
export async function getCourses(req: Request, res: Response, next: NextFunction) {
  try {
    const q = listQuerySchema.parse(req.query);
    const skip = (q.page - 1) * q.limit;
    const orderBy = parseSort(q.sort, ['code', 'name', 'credits'], { code: 'asc' });

    const where: Prisma.CourseWhereInput = {
      deletedAt: null,
      isVisible: true,
      ...(q.programId ? { programId: q.programId } : {}),
      ...(q.search
        ? {
            OR: [
              { code: { contains: q.search, mode: 'insensitive' } },
              { name: { contains: q.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, items] = await prisma.$transaction([
      prisma.course.count({ where }),
      prisma.course.findMany({
        where,
        skip,
        take: q.limit,
        orderBy,
        include: {
          program: { select: { code: true, name: true, level: true } },
          image: { select: { url: true, alt: true } },
        },
      }),
    ]);

    return res.json({ success: true, data: items, meta: getPaginationMeta(total, q.page, q.limit) });
  } catch (err) {
    next(err);
  }
}