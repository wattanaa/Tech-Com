import { PrismaClient } from '@prisma/client';
import { env } from './env.js';

/**
 * Prisma client แบบ singleton
 * ใน dev เก็บไว้บน globalThis เพื่อไม่ให้ tsx watch สร้าง connection ใหม่ทุกครั้งที่ reload
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.isDev ? ['warn', 'error'] : ['error'],
  });

if (env.isDev) globalForPrisma.prisma = prisma;

/** ใช้ใน health check — ping ฐานข้อมูลพร้อมวัดเวลาตอบสนอง */
export async function pingDatabase(): Promise<{ ok: boolean; latencyMs: number }> {
  const started = performance.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true, latencyMs: Math.round(performance.now() - started) };
  } catch {
    return { ok: false, latencyMs: Math.round(performance.now() - started) };
  }
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}
