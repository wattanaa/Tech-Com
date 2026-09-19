/**
 * SEED — ข้อมูลตั้งต้นของระบบ
 *
 *   npm run db:seed          ใส่ข้อมูลแกนระบบ + ข้อมูลตัวอย่าง
 *   npm run db:seed -- --core-only    ใส่เฉพาะข้อมูลแกนระบบ (ใช้ตอนขึ้นระบบจริง)
 *
 * ทั้งสคริปต์เป็น idempotent — รันซ้ำได้ ไม่สร้างข้อมูลซ้ำ ไม่ทับค่าที่แก้ไว้แล้ว
 * รหัสผ่านผู้ดูแลอ่านจาก .env เท่านั้น ไม่มีค่า default ในโค้ด
 */
import 'dotenv/config';
import { PrismaClient, RoleName } from '@prisma/client';
import {
  seedRolesAndPermissions,
  seedAdminUser,
  seedHomepageSections,
  seedNavigation,
  seedSiteSettings,
  seedSeoSettings,
} from './seeds/core.js';
import { seedDemoData } from './seeds/demo.js';

const prisma = new PrismaClient();
const coreOnly = process.argv.includes('--core-only');

async function main() {
  console.log('\n═══ เริ่ม seed ข้อมูลตั้งต้น ═══\n');

  const roles = await seedRolesAndPermissions(prisma);
  const superAdminRole = roles.get(RoleName.SUPER_ADMIN);

  const admin = superAdminRole ? await seedAdminUser(prisma, superAdminRole.id) : null;

  await seedHomepageSections(prisma);
  await seedNavigation(prisma);
  await seedSiteSettings(prisma);
  await seedSeoSettings(prisma);

  if (coreOnly) {
    console.log('\n▸ ข้ามข้อมูลตัวอย่าง (--core-only)');
  } else if (!admin) {
    console.warn(
      '\n⚠ ข้ามข้อมูลตัวอย่าง — ต้องมีบัญชีผู้ดูแลก่อน เพราะข่าวทุกชิ้นต้องมีผู้เขียน',
    );
    console.warn('  ตั้ง SEED_ADMIN_EMAIL และ SEED_ADMIN_PASSWORD ใน .env แล้วรันใหม่อีกครั้ง');
  } else {
    await seedDemoData(prisma, admin.id);
  }

  console.log('\n═══ seed เสร็จสมบูรณ์ ═══\n');
}

main()
  .catch((err) => {
    console.error('\n❌ seed ล้มเหลว:', err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
