import type { Request } from 'express';
import type { AuditAction, Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';

type TxClient = Prisma.TransactionClient | PrismaClient;

export interface AuditInput {
  action: AuditAction;
  entity: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
  note?: string;
}

/** ฟิลด์ที่ห้ามหลุดเข้า audit log เด็ดขาด */
const REDACTED_FIELDS = new Set(['passwordHash', 'password', 'currentPassword', 'newPassword']);

/**
 * เทียบค่าเก่ากับค่าใหม่ เก็บเฉพาะฟิลด์ที่เปลี่ยนจริง
 * ไม่เก็บทั้งก้อนเพราะ log จะบวมและอ่านยากเวลาต้องสืบย้อน
 */
export function diff(before: unknown, after: unknown): Prisma.JsonObject | undefined {
  if (!isRecord(before) || !isRecord(after)) return undefined;

  const changes: Prisma.JsonObject = {};
  for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
    if (REDACTED_FIELDS.has(key)) continue;
    const a = before[key];
    const b = after[key];
    if (JSON.stringify(a) === JSON.stringify(b)) continue;
    changes[key] = {
      before: toJsonValue(a),
      after: toJsonValue(b),
    } as Prisma.JsonObject;
  }
  return Object.keys(changes).length > 0 ? changes : undefined;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function toJsonValue(v: unknown): Prisma.JsonValue {
  if (v === undefined) return null;
  if (v instanceof Date) return v.toISOString();
  if (v === null || ['string', 'number', 'boolean'].includes(typeof v)) {
    return v as Prisma.JsonValue;
  }
  return JSON.parse(JSON.stringify(v)) as Prisma.JsonValue;
}

/**
 * บันทึกร่องรอยการใช้งาน
 *
 * รับ tx เข้ามาได้ เพื่อให้ log ถูกบันทึกในทรานแซกชันเดียวกับการแก้ข้อมูล
 * ถ้าธุรกรรมล้มเหลว log ก็ต้องหายไปด้วย ไม่งั้นจะมีบันทึกของสิ่งที่ไม่เคยเกิดขึ้น
 *
 * การเขียน log ล้มเหลวจะไม่ทำให้ request ล้ม — แต่ต้องขึ้น error log ให้เห็น
 */
export async function writeAuditLog(
  req: Request,
  input: AuditInput,
  tx: TxClient = prisma,
): Promise<void> {
  try {
    const changes = diff(input.before, input.after);
    await tx.auditLog.create({
      data: {
        userId: req.user?.id ?? null,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? null,
        changes: changes ?? undefined,
        ipAddress: req.ip ?? null,
        userAgent: req.get('user-agent')?.slice(0, 500) ?? null,
      },
    });
  } catch (err) {
    logger.error({ err, entity: input.entity, action: input.action }, 'บันทึก audit log ไม่สำเร็จ');
  }
}
