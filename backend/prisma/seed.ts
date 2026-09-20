import { PrismaClient, RoleName, CategoryType, ContentStatus, TeacherType, ProgramLevel } from '@prisma/client';
import bcrypt from 'bcrypt'; // หรือ argon2 ตามที่โปรเจกต์ใช้

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 เริ่มต้นการ Seed ข้อมูล...');

  // 1. สร้าง Roles เริ่มต้น
  const superAdminRole = await prisma.role.upsert({
    where: { name: RoleName.SUPER_ADMIN },
    update: {},
    create: {
      name: RoleName.SUPER_ADMIN,
      label: 'ผู้ดูแลระบบสูงสุด',
      level: 1,
      description: 'สิทธิ์สูงสุดในระบบ',
    },
  });

  await prisma.role.upsert({
    where: { name: RoleName.ADMIN },
    update: {},
    create: {
      name: RoleName.ADMIN,
      label: 'ผู้ดูแลระบบ',
      level: 2,
    },
  });

  // 2. สร้าง User เริ่มต้น (Admin)
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@123456';
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const adminUser = await prisma.user.upsert({
    where: { email: process.env.SEED_ADMIN_EMAIL || 'admin@tcom.rtc.ac.th' },
    update: {},
    create: {
      email: process.env.SEED_ADMIN_EMAIL || 'admin@tcom.rtc.ac.th',
      name: process.env.SEED_ADMIN_NAME || 'ผู้ดูแลระบบ',
      passwordHash,
      roleId: superAdminRole.id,
      isActive: true,
    },
  });

  // 3. หมวดหมู่ข่าว/กิจกรรมเริ่มต้น
  const defaultCategory = await prisma.category.upsert({
    where: { slug_type: { slug: 'general', type: CategoryType.NEWS } },
    update: {},
    create: {
      name: 'ข่าวประชาสัมพันธ์ทั่วไป',
      slug: 'general',
      type: CategoryType.NEWS,
      color: '#0284c7',
    },
  });

  // 4. ข่าวตัวอย่าง
  await prisma.news.upsert({
    where: { slug: 'welcome-tcom' },
    update: {},
    create: {
      title: 'ยินดีต้อนรับสู่เว็บไซต์แผนกวิชาเทคโนโลยีคอมพิวเตอร์',
      slug: 'welcome-tcom',
      excerpt: 'เปิดตัวเว็บไซต์ใหม่อย่างเป็นทางการสำหรับการเรียนการสอนและประชาสัมพันธ์',
      content: '<p>เว็บไซต์แผนกวิชาเทคโนโลยีคอมพิวเตอร์ วิทยาลัยเทคนิคร้อยเอ็ด พร้อมให้บริการแล้ว</p>',
      status: ContentStatus.PUBLISHED,
      publishedAt: new Date(),
      authorId: adminUser.id,
      categoryId: defaultCategory.id,
    },
  });

  console.log('✅ Seed ข้อมูลตัวอย่างเรียบร้อยแล้ว!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });