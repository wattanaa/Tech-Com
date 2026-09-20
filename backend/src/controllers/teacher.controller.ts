import { Request, Response, NextFunction } from 'express';
import { PrismaClient, Prisma, TeacherType } from '@prisma/client';
import { listQuerySchema } from '../utils/query.js';

const prisma = new PrismaClient();

export async function getTeachers(req: Request, res: Response, next: NextFunction) {
  try {
    const q = listQuerySchema.parse(req.query);
    const where: Prisma.TeacherWhereInput = {
      deletedAt: null,
      isVisible: true,
      ...(q.type ? { type: q.type as TeacherType } : {}),
      ...(q.search
        ? {
            OR: [
              { firstName: { contains: q.search, mode: 'insensitive' } },
              { lastName: { contains: q.search, mode: 'insensitive' } },
              { position: { contains: q.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const teachers = await prisma.teacher.findMany({
      where,
      orderBy: [{ type: 'asc' }, { order: 'asc' }],
      include: {
        photo: { select: { url: true, alt: true } },
        courses: { include: { course: { select: { code: true, name: true } } } },
      },
    });

    return res.json({ success: true, data: teachers });
  } catch (err) {
    next(err);
  }
}