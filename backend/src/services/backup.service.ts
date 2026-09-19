import { spawn } from 'node:child_process';
import { mkdir, stat, unlink } from 'node:fs/promises';
import path from 'node:path';
import { BackupStatus, BackupType } from '@prisma/client';
import { prisma } from '../config/database.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

/**
 * สำรองและกู้คืนข้อมูล
 *
 * ใช้ pg_dump / pg_restore ผ่าน spawn แบบส่ง argument เป็น array
 * ไม่ประกอบเป็นสตริงคำสั่งเดียว จึงไม่มีช่องให้แทรกคำสั่งเพิ่ม (command injection)
 */

/** รันคำสั่งภายนอกแล้วรอผล — ไม่ผ่าน shell เด็ดขาด */
function run(command: string, args: string[], envVars: NodeJS.ProcessEnv = {}): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env: { ...process.env, ...envVars },
      shell: false,
    });

    let stderr = '';
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on('error', (err) => {
      reject(
        err.message.includes('ENOENT')
          ? new Error(`ไม่พบคำสั่ง ${command} บนเซิร์ฟเวอร์ — ต้องติดตั้ง postgresql-client ก่อน`)
          : err,
      );
    });

    child.on('close', (code) => {
      if (code === 0) resolve(stderr);
      else reject(new Error(stderr.slice(-1_000) || `${command} จบการทำงานด้วยรหัส ${code}`));
    });
  });
}

/** แยกส่วนประกอบจาก DATABASE_URL เพื่อส่งให้ pg_dump เป็น argument แยกกัน */
function parseDatabaseUrl() {
  const url = new URL(env.DATABASE_URL);
  return {
    host: url.hostname,
    port: url.port || '5432',
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ''),
  };
}

export async function createBackup(userId: string, type: BackupType = BackupType.DATABASE) {
  const dir = path.resolve(env.BACKUP_DIR);
  await mkdir(dir, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `tcom-${type.toLowerCase()}-${stamp}.dump`;
  const filepath = path.join(dir, filename);

  const record = await prisma.backup.create({
    data: {
      filename,
      path: filepath,
      type,
      status: BackupStatus.RUNNING,
      createdById: userId,
    },
  });

  // ทำงานเบื้องหลัง ไม่ให้ผู้ใช้ค้างรอหน้าจอจนหมดเวลา
  void (async () => {
    try {
      const db = parseDatabaseUrl();
      await run(
        'pg_dump',
        [
          '--host', db.host,
          '--port', db.port,
          '--username', db.user,
          '--dbname', db.database,
          '--format', 'custom',
          '--no-owner',
          '--no-privileges',
          '--file', filepath,
        ],
        { PGPASSWORD: db.password },
      );

      const info = await stat(filepath);
      await prisma.backup.update({
        where: { id: record.id },
        data: {
          status: BackupStatus.SUCCESS,
          size: BigInt(info.size),
          completedAt: new Date(),
        },
      });
      logger.info({ backupId: record.id, size: info.size }, 'สำรองข้อมูลสำเร็จ');
    } catch (err) {
      await prisma.backup.update({
        where: { id: record.id },
        data: {
          status: BackupStatus.FAILED,
          note: err instanceof Error ? err.message.slice(0, 500) : 'ไม่ทราบสาเหตุ',
          completedAt: new Date(),
        },
      });
      logger.error({ err, backupId: record.id }, 'สำรองข้อมูลล้มเหลว');
    }
  })();

  return record;
}

/**
 * กู้คืนข้อมูลจากไฟล์สำรอง
 *
 * คำเตือน: ข้อมูลปัจจุบันจะถูกเขียนทับทั้งหมด
 * จึงสำรองข้อมูลปัจจุบันไว้ก่อนเสมอ เผื่อไฟล์ที่กู้มามีปัญหา
 */
export async function restoreBackup(backupId: string, userId: string) {
  const backup = await prisma.backup.findUnique({ where: { id: backupId } });
  if (!backup) throw ApiError.notFound('ไม่พบไฟล์สำรองที่ต้องการ');
  if (backup.status !== BackupStatus.SUCCESS) {
    throw ApiError.badRequest('ไฟล์สำรองนี้สร้างไม่สำเร็จ จึงกู้คืนไม่ได้');
  }

  // ตรวจว่าเส้นทางยังอยู่ในโฟลเดอร์สำรองจริง กัน path traversal จากข้อมูลที่ถูกแก้ในฐานข้อมูล
  const base = path.resolve(env.BACKUP_DIR);
  const target = path.resolve(backup.path);
  if (!target.startsWith(base)) {
    throw ApiError.badRequest('เส้นทางไฟล์สำรองไม่ถูกต้อง');
  }
  await stat(target).catch(() => {
    throw ApiError.notFound('ไฟล์สำรองหายไปจากเซิร์ฟเวอร์');
  });

  // สำรองสถานะปัจจุบันก่อนเขียนทับ
  await createBackup(userId, BackupType.DATABASE);

  const db = parseDatabaseUrl();
  await run(
    'pg_restore',
    [
      '--host', db.host,
      '--port', db.port,
      '--username', db.user,
      '--dbname', db.database,
      '--clean',
      '--if-exists',
      '--no-owner',
      '--no-privileges',
      target,
    ],
    { PGPASSWORD: db.password },
  );

  logger.warn({ backupId, userId }, 'กู้คืนฐานข้อมูลจากไฟล์สำรอง');
}

export async function deleteBackup(backupId: string) {
  const backup = await prisma.backup.findUnique({ where: { id: backupId } });
  if (!backup) throw ApiError.notFound('ไม่พบไฟล์สำรองที่ต้องการลบ');

  const base = path.resolve(env.BACKUP_DIR);
  const target = path.resolve(backup.path);
  if (target.startsWith(base)) await unlink(target).catch(() => undefined);

  await prisma.backup.delete({ where: { id: backupId } });
}
