import { Router } from 'express';
import { ContentStatus } from '@prisma/client';
import { prisma } from '../config/database.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

/** ต้องตั้งใน .env ตอน production เป็นโดเมนจริงของเว็บไซต์ */
function siteUrl(): string {
  return process.env.SITE_URL?.replace(/\/$/, '') ?? 'https://tcom.rtc.ac.th';
}

const STATIC_PATHS = [
  '/', '/about', '/programs', '/courses', '/teachers', '/students',
  '/projects', '/activities', '/news', '/facilities', '/gallery', '/contact',
];

function xmlEscape(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * GET /sitemap.xml
 * รวมหน้า static กับ URL ของเนื้อหาที่เผยแพร่แล้วทั้งหมด
 * ให้เครื่องมือค้นหาไล่เก็บได้ครบโดยไม่ต้องพึ่งการเชื่อมลิงก์ภายใน
 */
router.get(
  '/sitemap.xml',
  asyncHandler(async (_req, res) => {
    const base = siteUrl();
    const alive = { deletedAt: null, status: ContentStatus.PUBLISHED };

    const [news, activities, projects, facilities, albums] = await Promise.all([
      prisma.news.findMany({ where: alive, select: { slug: true, updatedAt: true } }),
      prisma.activity.findMany({ where: alive, select: { slug: true, updatedAt: true } }),
      prisma.project.findMany({ where: alive, select: { slug: true, updatedAt: true } }),
      prisma.facility.findMany({
        where: { deletedAt: null, isVisible: true },
        select: { slug: true, updatedAt: true },
      }),
      prisma.album.findMany({
        where: { deletedAt: null, isPublished: true },
        select: { slug: true, updatedAt: true },
      }),
    ]);

    const urls: { loc: string; lastmod: Date; priority: string }[] = [
      ...STATIC_PATHS.map((p) => ({ loc: p, lastmod: new Date(), priority: p === '/' ? '1.0' : '0.7' })),
      ...news.map((n) => ({ loc: `/news/${n.slug}`, lastmod: n.updatedAt, priority: '0.6' })),
      ...activities.map((a) => ({ loc: `/activities/${a.slug}`, lastmod: a.updatedAt, priority: '0.5' })),
      ...projects.map((p) => ({ loc: `/projects/${p.slug}`, lastmod: p.updatedAt, priority: '0.5' })),
      ...facilities.map((f) => ({ loc: `/facilities/${f.slug}`, lastmod: f.updatedAt, priority: '0.4' })),
      ...albums.map((a) => ({ loc: `/gallery/${a.slug}`, lastmod: a.updatedAt, priority: '0.4' })),
    ];

    const body = urls
      .map(
        (u) => `  <url>
    <loc>${xmlEscape(base + u.loc)}</loc>
    <lastmod>${u.lastmod.toISOString().slice(0, 10)}</lastmod>
    <priority>${u.priority}</priority>
  </url>`,
      )
      .join('\n');

    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.send(
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>`,
    );
  }),
);

/** GET /robots.txt — อนุญาตทุก path สาธารณะ กันเฉพาะ /admin และ /api */
router.get('/robots.txt', (_req, res) => {
  res.set('Content-Type', 'text/plain; charset=utf-8');
  res.send(
    `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api\n\nSitemap: ${siteUrl()}/sitemap.xml\n`,
  );
});

export default router;
