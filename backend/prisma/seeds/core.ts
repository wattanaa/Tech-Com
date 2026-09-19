/**
 * SEED · ส่วนแกนระบบ
 * บทบาท · สิทธิ์ · บัญชีผู้ดูแล · Section หน้าแรก · เมนู · ตั้งค่าเว็บไซต์ · SEO
 *
 * ทุกฟังก์ชันเป็น idempotent — รันซ้ำได้โดยไม่สร้างข้อมูลซ้ำและไม่ทับค่าที่ผู้ดูแลแก้ไว้แล้ว
 */
import { type PrismaClient, RoleName, NavLocation, SectionType } from '@prisma/client';
import argon2 from 'argon2';
import {
  PERMISSIONS,
  ROLE_LEVEL,
  EDITOR_PERMISSIONS,
  ADMIN_EXCLUDED_PERMISSIONS,
} from '../../src/config/constants.js';

/** พารามิเตอร์ตามคำแนะนำ OWASP สำหรับ Argon2id */
const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} as const;

export async function seedRolesAndPermissions(prisma: PrismaClient) {
  console.log('▸ บทบาทและสิทธิ์');

  const roles = await Promise.all([
    prisma.role.upsert({
      where: { name: RoleName.SUPER_ADMIN },
      update: {},
      create: {
        name: RoleName.SUPER_ADMIN,
        label: 'ผู้ดูแลระบบสูงสุด',
        description: 'เข้าถึงได้ทุกส่วน รวมถึงผู้ใช้งาน สำรองข้อมูล และตั้งค่าระบบ',
        level: ROLE_LEVEL.SUPER_ADMIN,
      },
    }),
    prisma.role.upsert({
      where: { name: RoleName.ADMIN },
      update: {},
      create: {
        name: RoleName.ADMIN,
        label: 'ผู้ดูแลเนื้อหา',
        description: 'จัดการเนื้อหาเว็บไซต์ทั้งหมด แต่ไม่สามารถจัดการผู้ใช้หรือสำรองข้อมูล',
        level: ROLE_LEVEL.ADMIN,
      },
    }),
    prisma.role.upsert({
      where: { name: RoleName.EDITOR },
      update: {},
      create: {
        name: RoleName.EDITOR,
        label: 'ผู้เขียนเนื้อหา',
        description: 'เขียนข่าว กิจกรรม ผลงาน และคลังภาพ ส่งให้ผู้ดูแลตรวจก่อนเผยแพร่',
        level: ROLE_LEVEL.EDITOR,
      },
    }),
  ]);

  const permissions = await Promise.all(
    Object.entries(PERMISSIONS).map(([key, label]) =>
      prisma.permission.upsert({
        where: { key },
        update: { label },
        create: { key, label, group: key.split(':')[0] ?? 'general' },
      }),
    ),
  );

  const byName = new Map(roles.map((r) => [r.name, r]));
  const allKeys = permissions.map((p) => p.key);

  const assignment: Record<RoleName, string[]> = {
    [RoleName.SUPER_ADMIN]: allKeys,
    [RoleName.ADMIN]: allKeys.filter((k) => !ADMIN_EXCLUDED_PERMISSIONS.includes(k)),
    [RoleName.EDITOR]: EDITOR_PERMISSIONS,
  };

  for (const [roleName, keys] of Object.entries(assignment) as [RoleName, string[]][]) {
    const role = byName.get(roleName);
    if (!role) continue;
    for (const key of keys) {
      const permission = permissions.find((p) => p.key === key);
      if (!permission) continue;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      });
    }
    console.log(`  · ${roleName}: ${keys.length} สิทธิ์`);
  }

  return byName;
}

export async function seedAdminUser(prisma: PrismaClient, superAdminRoleId: string) {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  const name = process.env.SEED_ADMIN_NAME ?? 'ผู้ดูแลระบบ';

  if (!email || !password) {
    console.warn(
      '⚠ ข้ามการสร้างบัญชีผู้ดูแล — ยังไม่ได้ตั้ง SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD ใน .env',
    );
    return null;
  }
  if (password.length < 12) {
    throw new Error('SEED_ADMIN_PASSWORD ต้องยาวอย่างน้อย 12 ตัวอักษร');
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`▸ มีบัญชีผู้ดูแล ${email} อยู่แล้ว — ไม่เขียนทับรหัสผ่าน`);
    return existing;
  }

  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash: await argon2.hash(password, ARGON2_OPTIONS),
      roleId: superAdminRoleId,
    },
  });
  console.log(`▸ สร้างบัญชีผู้ดูแล ${email} — เปลี่ยนรหัสผ่านทันทีหลังเข้าระบบครั้งแรก`);
  return user;
}

export async function seedHomepageSections(prisma: PrismaClient) {
  console.log('▸ Section หน้าแรก');

  const sections: { type: SectionType; title: string; order: number; config: object }[] = [
    {
      type: SectionType.HERO,
      title: 'ส่วนหัว',
      order: 1,
      config: {
        badge: 'เปิดรับสมัคร ปวช. / ปวส. ปีการศึกษา 2570',
        heading: 'สร้างทักษะดิจิทัล สร้างนวัตกรรม สร้างอนาคต',
        subheading: 'แผนกวิชาเทคโนโลยีคอมพิวเตอร์ วิทยาลัยเทคนิคร้อยเอ็ด',
        primaryCta: { label: 'ดูหลักสูตร', href: '/programs' },
        secondaryCta: { label: 'เกี่ยวกับแผนก', href: '/about' },
        showGrid: true,
        showGlow: true,
      },
    },
    { type: SectionType.STATISTICS, title: 'สถิติแผนก', order: 2, config: { animate: true } },
    { type: SectionType.ABOUT, title: 'เกี่ยวกับแผนก', order: 3, config: { layout: 'split' } },
    { type: SectionType.PROGRAMS, title: 'หลักสูตรที่เปิดสอน', order: 4, config: { layout: 'grid' } },
    { type: SectionType.COURSES, title: 'รายวิชา', order: 5, config: { limit: 6 } },
    { type: SectionType.TEACHERS, title: 'ครูและบุคลากร', order: 6, config: { limit: 8 } },
    { type: SectionType.PROJECTS, title: 'ผลงานนักศึกษา', order: 7, config: { limit: 6 } },
    { type: SectionType.ACTIVITIES, title: 'กิจกรรม', order: 8, config: { limit: 4 } },
    { type: SectionType.NEWS, title: 'ข่าวประชาสัมพันธ์', order: 9, config: { limit: 3, layout: 'grid' } },
    { type: SectionType.GALLERY, title: 'คลังภาพกิจกรรม', order: 10, config: { limit: 8 } },
    { type: SectionType.FACILITIES, title: 'ห้องปฏิบัติการ', order: 11, config: { layout: 'carousel' } },
    { type: SectionType.CONTACT, title: 'ติดต่อแผนก', order: 12, config: { showMap: true, showForm: true } },
  ];

  for (const s of sections) {
    // ชนิดซ้ำได้ (เพื่อรองรับการทำสำเนา) จึงตรวจก่อนสร้างแทนการ upsert ด้วย type
    const existing = await prisma.homepageSection.findFirst({ where: { type: s.type } });
    if (existing) continue;
    await prisma.homepageSection.create({
      data: { type: s.type, title: s.title, order: s.order, config: s.config },
    });
  }
  console.log(`  · ${sections.length} section`);
}

export async function seedNavigation(prisma: PrismaClient) {
  console.log('▸ เมนูหลัก');

  const existing = await prisma.navigationItem.count({ where: { location: NavLocation.HEADER } });
  if (existing > 0) {
    console.log('  · มีเมนูอยู่แล้ว — ข้าม');
    return;
  }

  const items = [
    { label: 'หน้าแรก', href: '/', order: 1 },
    { label: 'เกี่ยวกับแผนก', href: '/about', order: 2 },
    { label: 'หลักสูตร', href: '/programs', order: 3 },
    { label: 'รายวิชา', href: '/courses', order: 4 },
    { label: 'บุคลากร', href: '/teachers', order: 5 },
    { label: 'ผลงาน', href: '/projects', order: 6 },
    { label: 'กิจกรรม', href: '/activities', order: 7 },
    { label: 'ข่าวสาร', href: '/news', order: 8 },
    { label: 'ห้องปฏิบัติการ', href: '/facilities', order: 9 },
    { label: 'คลังภาพ', href: '/gallery', order: 10 },
    { label: 'ติดต่อ', href: '/contact', order: 11 },
  ];

  await prisma.navigationItem.createMany({
    data: items.map((i) => ({ ...i, location: NavLocation.HEADER })),
  });
  console.log(`  · ${items.length} เมนู`);
}

export async function seedSiteSettings(prisma: PrismaClient) {
  console.log('▸ ตั้งค่าเว็บไซต์');

  const settings = [
    {
      key: 'general',
      group: 'general',
      value: {
        siteName: 'แผนกวิชาเทคโนโลยีคอมพิวเตอร์',
        collegeName: 'วิทยาลัยเทคนิคร้อยเอ็ด',
        tagline: 'สร้างทักษะดิจิทัล สร้างนวัตกรรม สร้างอนาคต',
      },
    },
    {
      key: 'about',
      group: 'about',
      value: {
        history:
          'แผนกวิชาเทคโนโลยีคอมพิวเตอร์ วิทยาลัยเทคนิคร้อยเอ็ด จัดการเรียนการสอนด้านคอมพิวเตอร์และเทคโนโลยีสารสนเทศ ทั้งระดับประกาศนียบัตรวิชาชีพและประกาศนียบัตรวิชาชีพชั้นสูง มุ่งผลิตกำลังคนที่มีสมรรถนะวิชาชีพตรงตามความต้องการของสถานประกอบการ',
        vision:
          'เป็นแผนกวิชาชั้นนำด้านเทคโนโลยีคอมพิวเตอร์ของภาคตะวันออกเฉียงเหนือ ผลิตผู้สำเร็จการศึกษาที่มีทักษะดิจิทัลและคุณธรรม',
        mission: [
          'จัดการเรียนการสอนที่เน้นการปฏิบัติจริงตามมาตรฐานสมรรถนะวิชาชีพ',
          'พัฒนาครูและบุคลากรให้ทันต่อการเปลี่ยนแปลงของเทคโนโลยี',
          'สร้างความร่วมมือกับสถานประกอบการในการจัดการศึกษาระบบทวิภาคี',
          'ส่งเสริมการสร้างนวัตกรรมและสิ่งประดิษฐ์ของนักเรียนนักศึกษา',
          'บริการวิชาการและวิชาชีพแก่ชุมชนและสังคม',
        ],
        strengths: [
          'ห้องปฏิบัติการเฉพาะทาง 5 ห้อง ครอบคลุมทั้งเครือข่าย IoT และปัญญาประดิษฐ์',
          'ครูผู้สอนมีวุฒิตรงสาขาและมีประสบการณ์ในสถานประกอบการ',
          'นักศึกษาฝึกประสบการณ์วิชาชีพในสถานประกอบการทุกคน',
          'ผลงานนักศึกษาได้รับรางวัลระดับภาคและระดับชาติอย่างต่อเนื่อง',
        ],
        goals: [
          'ผู้สำเร็จการศึกษามีงานทำหรือศึกษาต่อไม่น้อยกว่าร้อยละ 90',
          'นักศึกษาผ่านการประเมินมาตรฐานวิชาชีพไม่น้อยกว่าร้อยละ 95',
          'มีผลงานสิ่งประดิษฐ์เข้าประกวดระดับภาคอย่างน้อยปีละ 3 ผลงาน',
        ],
      },
    },
    {
      key: 'contact',
      group: 'contact',
      value: {
        address:
          'วิทยาลัยเทคนิคร้อยเอ็ด ตำบลในเมือง อำเภอเมืองร้อยเอ็ด จังหวัดร้อยเอ็ด 45000',
        phone: '',
        email: '',
        mapEmbedUrl: '',
        officeHours: 'จันทร์ – ศุกร์ เวลา 08.30 – 16.30 น.',
      },
    },
    {
      key: 'social',
      group: 'social',
      value: { facebook: '', youtube: '', line: '', tiktok: '' },
    },
    {
      key: 'footer',
      group: 'footer',
      value: {
        description:
          'แผนกวิชาเทคโนโลยีคอมพิวเตอร์ มุ่งผลิตช่างเทคนิคและนักเทคโนโลยีที่มีสมรรถนะวิชาชีพตรงตามความต้องการของสถานประกอบการ',
        copyright: '© 2569 แผนกวิชาเทคโนโลยีคอมพิวเตอร์ วิทยาลัยเทคนิคร้อยเอ็ด',
        quickLinks: [
          { label: 'หลักสูตร', href: '/programs' },
          { label: 'ข่าวสาร', href: '/news' },
          { label: 'ผลงานนักศึกษา', href: '/projects' },
          { label: 'ติดต่อ', href: '/contact' },
        ],
      },
    },
  ];

  for (const s of settings) {
    await prisma.siteSetting.upsert({ where: { key: s.key }, update: {}, create: s });
  }
  console.log(`  · ${settings.length} กลุ่มการตั้งค่า`);
}

export async function seedSeoSettings(prisma: PrismaClient) {
  console.log('▸ SEO เริ่มต้น');

  const pages = [
    {
      path: '/',
      title: 'แผนกวิชาเทคโนโลยีคอมพิวเตอร์ วิทยาลัยเทคนิคร้อยเอ็ด',
      description:
        'หลักสูตร ปวช. และ ปวส. สาขาเทคโนโลยีคอมพิวเตอร์ ข่าวสาร กิจกรรม และผลงานนักศึกษา',
      keywords: ['เทคโนโลยีคอมพิวเตอร์', 'วิทยาลัยเทคนิคร้อยเอ็ด', 'ปวช', 'ปวส', 'อาชีวศึกษา'],
    },
    {
      path: '/programs',
      title: 'หลักสูตรที่เปิดสอน',
      description: 'หลักสูตรประกาศนียบัตรวิชาชีพและประกาศนียบัตรวิชาชีพชั้นสูง สาขาเทคโนโลยีคอมพิวเตอร์',
      keywords: ['หลักสูตร', 'ปวช', 'ปวส', 'เทคโนโลยีคอมพิวเตอร์'],
    },
    {
      path: '/news',
      title: 'ข่าวประชาสัมพันธ์',
      description: 'ข่าวสารและประกาศจากแผนกวิชาเทคโนโลยีคอมพิวเตอร์',
      keywords: ['ข่าว', 'ประชาสัมพันธ์', 'รับสมัครนักศึกษา'],
    },
    {
      path: '/contact',
      title: 'ติดต่อแผนกวิชา',
      description: 'ที่อยู่ เบอร์โทรศัพท์ และช่องทางติดต่อแผนกวิชาเทคโนโลยีคอมพิวเตอร์',
      keywords: ['ติดต่อ', 'ที่อยู่', 'แผนที่'],
    },
  ];

  for (const p of pages) {
    await prisma.seoSetting.upsert({ where: { path: p.path }, update: {}, create: p });
  }
  console.log(`  · ${pages.length} หน้า`);
}
