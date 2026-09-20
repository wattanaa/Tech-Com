import { PrismaClient, RoleName, ProgramLevel, ContentStatus } from '@prisma/client';
import argon2 from 'argon2';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const isCoreOnly = process.argv.includes('--core-only');

  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@tcom.ac.th';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  const adminName = process.env.SEED_ADMIN_NAME || 'ผู้ดูแลระบบ';

  if (!adminPassword) {
    throw new Error('ไม่พบตัวแปร SEED_ADMIN_PASSWORD ในไฟล์ .env');
  }

  console.log(' กำลังสร้าง Roles ของระบบ...');
  const superAdminRole = await prisma.role.upsert({
    where: { name: RoleName.SUPER_ADMIN },
    update: {},
    create: {
      name: RoleName.SUPER_ADMIN,
      label: 'ผู้ดูแลระบบสูงสุด',
      level: 100,
    },
  });

  await prisma.role.upsert({
    where: { name: RoleName.ADMIN },
    update: {},
    create: {
      name: RoleName.ADMIN,
      label: 'ผู้ดูแลระบบ',
      level: 50,
    },
  });

  await prisma.role.upsert({
    where: { name: RoleName.EDITOR },
    update: {},
    create: {
      name: RoleName.EDITOR,
      label: 'ผู้แก้ไขเนื้อหา',
      level: 10,
    },
  });

  console.log(' กำลังสร้างผู้ดูแลระบบสูงสุด (Super Admin)...');
  const hashedPassword = await argon2.hash(adminPassword);
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: adminName,
      passwordHash: hashedPassword,
      roleId: superAdminRole.id,
      isActive: true,
    },
  });

  if (!isCoreOnly) {
    console.log(' กำลังสร้างข้อมูลตัวอย่าง (Sample Data)...');

    // 1. หลักสูตรตัวอย่าง
    const program = await prisma.program.upsert({
      where: { code: '30901' },
      update: {},
      create: {
        code: '30901',
        name: 'สาขาวิชาเทคโนโลยีคอมพิวเตอร์',
        nameEn: 'Computer Technology',
        level: ProgramLevel.POR_WOR_SOR,
        duration: '2 ปี',
        description: 'หลักสูตรประกาศนียบัตรวิชาชีพชั้นสูง สาขาวิชาเทคโนโลยีคอมพิวเตอร์',
        skills: ['Software Development', 'Network Administration', 'Database Design'],
      },
    });

    // 2. รายวิชาตัวอย่าง
    await prisma.course.upsert({
      where: { code: '30901-1001' },
      update: {},
      create: {
        code: '30901-1001',
        name: 'การเขียนโปรแกรมคอมพิวเตอร์',
        credits: 3,
        hours: 4,
        theoryHours: 2,
        practiceHours: 2,
        description: 'พื้นฐานการเขียนโปรแกรมและขั้นตอนวิธี',
        programId: program.id,
      },
    });

    // 3. ข่าวประชาสัมพันธ์ตัวอย่าง
    await prisma.news.upsert({
      where: { slug: 'welcome-to-tcom' },
      update: {},
      create: {
        title: 'ยินดีต้อนรับสู่ระบบสารสนเทศ แผนกวิชาเทคโนโลยีคอมพิวเตอร์',
        slug: 'welcome-to-tcom',
        excerpt: 'เปิดใช้งานเว็บไซต์สารสนเทศแผนกวิชาเทคโนโลยีคอมพิวเตอร์ วิทยาลัยเทคนิคร้อยเอ็ด',
        content: '<p>ยินดีต้อนรับคณะครู บุคลากร และนักเรียน นักศึกษา ทุกท่าน</p>',
        status: ContentStatus.PUBLISHED,
        publishedAt: new Date(),
        authorId: adminUser.id,
      },
    });
  }

  console.log(`\n Seed Data เสร็จสมบูรณ์ (${isCoreOnly ? 'Core Only' : 'พร้อมข้อมูลตัวอย่าง'})`);
}

main()
  .catch((e) => {
    console.error('❌ เกิดข้อผิดพลาดขณะ Seed Data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });