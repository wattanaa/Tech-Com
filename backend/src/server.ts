import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { disconnectDatabase, pingDatabase } from './config/database.js';

async function bootstrap(): Promise<void> {
  const db = await pingDatabase();
  if (!db.ok) {
    logger.error('เชื่อมต่อฐานข้อมูลไม่สำเร็จ — ตรวจ DATABASE_URL และสั่ง npm run db:up');
    process.exit(1);
  }
  logger.info(`เชื่อมต่อฐานข้อมูลสำเร็จ (${db.latencyMs} ms)`);

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    logger.info(`TCOM API พร้อมใช้งานที่ http://localhost:${env.PORT}/api/v1  [${env.NODE_ENV}]`);
  });

  /** ปิดระบบอย่างนุ่มนวล — หยุดรับ request ใหม่ รอที่ค้างอยู่ให้จบ แล้วค่อยตัด DB */
  const shutdown = (signal: string) => {
    logger.info(`ได้รับสัญญาณ ${signal} — กำลังปิดระบบ`);
    server.close(async () => {
      await disconnectDatabase();
      logger.info('ปิดระบบเรียบร้อย');
      process.exit(0);
    });
    setTimeout(() => {
      logger.error('ปิดระบบไม่ทันเวลา — บังคับปิด');
      process.exit(1);
    }, 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'พบ unhandled promise rejection');
  });
  process.on('uncaughtException', (err) => {
    logger.fatal({ err }, 'พบ uncaught exception — ปิดระบบ');
    process.exit(1);
  });
}

void bootstrap();
