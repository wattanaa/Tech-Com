import { Router } from 'express';
import { ContentStatus } from '@prisma/client';
import { prisma, pingDatabase } from '../config/database.js';
import { authGuard } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/ApiResponse.js';

const router = Router();
router.use(authGuard);

interface MonthlyRow {
  month: Date;
  count: bigint;
}

/**
 * GET /api/v1/admin/dashboard/stats
 * ข้อมูลทั้งหน้าแดชบอร์ดในคำขอเดียว — หน้าจอจึงไม่ต้องยิงหลายรอบแล้วค่อย ๆ โผล่ทีละส่วน
 */
router.get(
  '/stats',
  asyncHandler(async (_req, res) => {
    const alive = { deletedAt: null };
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11, 1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const [
      newsPublished,
      newsPending,
      activities,
      projects,
      teachers,
      students,
      courses,
      unreadMessages,
      totalViews,
      recentNews,
      recentAudit,
      monthly,
      db,
    ] = await Promise.all([
      prisma.news.count({ where: { ...alive, status: ContentStatus.PUBLISHED } }),
      prisma.news.count({ where: { ...alive, status: ContentStatus.REVIEW } }),
      prisma.activity.count({ where: alive }),
      prisma.project.count({ where: alive }),
      prisma.teacher.count({ where: alive }),
      prisma.student.count({ where: alive }),
      prisma.course.count({ where: alive }),
      prisma.contactMessage.count({ where: { ...alive, isRead: false } }),
      prisma.news.aggregate({ where: alive, _sum: { views: true } }),
      prisma.news.findMany({
        where: alive,
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          views: true,
          publishedAt: true,
          createdAt: true,
          author: { select: { name: true } },
        },
      }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: {
          id: true,
          action: true,
          entity: true,
          entityId: true,
          createdAt: true,
          user: { select: { name: true } },
        },
      }),
      // นับข่าวที่เผยแพร่รายเดือนย้อนหลัง 12 เดือน สำหรับกราฟ
      prisma.$queryRaw<MonthlyRow[]>`
        SELECT date_trunc('month', "publishedAt") AS month, COUNT(*)::bigint AS count
        FROM news
        WHERE "publishedAt" >= ${twelveMonthsAgo}
          AND "deletedAt" IS NULL
          AND status = 'PUBLISHED'
        GROUP BY month
        ORDER BY month ASC
      `,
      pingDatabase(),
    ]);

    sendSuccess(res, {
      cards: {
        newsPublished,
        newsPending,
        activities,
        projects,
        teachers,
        students,
        courses,
        unreadMessages,
        totalViews: totalViews._sum.views ?? 0,
      },
      chart: {
        label: 'ข่าวที่เผยแพร่รายเดือน',
        points: monthly.map((row) => ({
          month: row.month.toISOString().slice(0, 7),
          count: Number(row.count),
        })),
      },
      recentNews,
      recentActivity: recentAudit,
      system: {
        database: db,
        uptimeSeconds: Math.round(process.uptime()),
        memoryMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      },
    });
  }),
);

export default router;
