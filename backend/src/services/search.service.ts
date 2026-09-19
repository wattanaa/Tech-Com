import { ContentStatus } from '@prisma/client';
import { prisma } from '../config/database.js';

export interface SearchGroup {
  type: string;
  label: string;
  count: number;
  items: { id: string; title: string; subtitle?: string | null; href: string }[];
}

/** จำนวนผลลัพธ์สูงสุดต่อหนึ่งประเภท — ผู้ใช้กด "ดูทั้งหมด" เพื่อไปหน้ารายการเต็ม */
const PER_GROUP = 5;

const like = (q: string) => ({ contains: q, mode: 'insensitive' as const });

/**
 * ค้นหาทั่วทั้งเว็บไซต์ แล้วจัดกลุ่มผลลัพธ์ตามประเภทข้อมูล
 *
 * ยิงหลาย query พร้อมกันด้วย Promise.all เพราะแต่ละตารางไม่เกี่ยวข้องกัน
 * รวมเวลาจึงเท่ากับ query ที่ช้าที่สุด ไม่ใช่ผลรวมของทุก query
 */
export async function globalSearch(query: string): Promise<{
  query: string;
  total: number;
  groups: SearchGroup[];
}> {
  const q = query.trim();
  if (q.length < 2) return { query: q, total: 0, groups: [] };

  const published = { status: ContentStatus.PUBLISHED, deletedAt: null };

  const [news, activities, projects, courses, teachers, facilities, albums] = await Promise.all([
    prisma.news.findMany({
      where: { ...published, OR: [{ title: like(q) }, { excerpt: like(q) }, { content: like(q) }] },
      select: { id: true, title: true, slug: true, excerpt: true },
      take: PER_GROUP,
      orderBy: { publishedAt: 'desc' },
    }),
    prisma.activity.findMany({
      where: { ...published, OR: [{ title: like(q) }, { description: like(q) }] },
      select: { id: true, title: true, slug: true, location: true },
      take: PER_GROUP,
      orderBy: { startDate: 'desc' },
    }),
    prisma.project.findMany({
      where: { ...published, OR: [{ name: like(q) }, { description: like(q) }] },
      select: { id: true, name: true, slug: true, year: true },
      take: PER_GROUP,
      orderBy: { year: 'desc' },
    }),
    prisma.course.findMany({
      where: {
        deletedAt: null,
        isVisible: true,
        OR: [{ name: like(q) }, { code: like(q) }, { description: like(q) }],
      },
      select: { id: true, name: true, code: true, credits: true },
      take: PER_GROUP,
      orderBy: { code: 'asc' },
    }),
    prisma.teacher.findMany({
      where: {
        deletedAt: null,
        isVisible: true,
        OR: [{ firstName: like(q) }, { lastName: like(q) }, { position: like(q) }],
      },
      select: { id: true, prefix: true, firstName: true, lastName: true, position: true },
      take: PER_GROUP,
      orderBy: { order: 'asc' },
    }),
    prisma.facility.findMany({
      where: { deletedAt: null, isVisible: true, OR: [{ name: like(q) }, { description: like(q) }] },
      select: { id: true, name: true, slug: true, location: true },
      take: PER_GROUP,
      orderBy: { order: 'asc' },
    }),
    prisma.album.findMany({
      where: { deletedAt: null, isPublished: true, OR: [{ name: like(q) }, { description: like(q) }] },
      select: { id: true, name: true, slug: true, description: true },
      take: PER_GROUP,
      orderBy: { eventDate: 'desc' },
    }),
  ]);

  const groups: SearchGroup[] = [
    {
      type: 'news',
      label: 'ข่าวประชาสัมพันธ์',
      count: news.length,
      items: news.map((n) => ({
        id: n.id,
        title: n.title,
        subtitle: n.excerpt,
        href: `/news/${n.slug}`,
      })),
    },
    {
      type: 'activities',
      label: 'กิจกรรม',
      count: activities.length,
      items: activities.map((a) => ({
        id: a.id,
        title: a.title,
        subtitle: a.location,
        href: `/activities/${a.slug}`,
      })),
    },
    {
      type: 'projects',
      label: 'ผลงานนักศึกษา',
      count: projects.length,
      items: projects.map((p) => ({
        id: p.id,
        title: p.name,
        subtitle: `ปีการศึกษา ${p.year}`,
        href: `/projects/${p.slug}`,
      })),
    },
    {
      type: 'courses',
      label: 'รายวิชา',
      count: courses.length,
      items: courses.map((c) => ({
        id: c.id,
        title: c.name,
        subtitle: `${c.code} · ${c.credits} หน่วยกิต`,
        href: `/courses/${c.code}`,
      })),
    },
    {
      type: 'teachers',
      label: 'ครูและบุคลากร',
      count: teachers.length,
      items: teachers.map((t) => ({
        id: t.id,
        title: `${t.prefix}${t.firstName} ${t.lastName}`,
        subtitle: t.position,
        href: `/teachers/${t.id}`,
      })),
    },
    {
      type: 'facilities',
      label: 'ห้องปฏิบัติการ',
      count: facilities.length,
      items: facilities.map((f) => ({
        id: f.id,
        title: f.name,
        subtitle: f.location,
        href: `/facilities/${f.slug}`,
      })),
    },
    {
      type: 'gallery',
      label: 'คลังภาพ',
      count: albums.length,
      items: albums.map((a) => ({
        id: a.id,
        title: a.name,
        subtitle: a.description,
        href: `/gallery/${a.slug}`,
      })),
    },
  ].filter((g) => g.count > 0);

  return { query: q, total: groups.reduce((sum, g) => sum + g.count, 0), groups };
}
