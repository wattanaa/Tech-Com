import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { ApiError } from '../utils/ApiError.js';
import type { ErrorBody } from '../utils/ApiResponse.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

/** 404 สำหรับ route ที่ไม่มีอยู่จริง */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new ApiError(404, 'NOT_FOUND', `ไม่พบปลายทาง ${req.method} ${req.originalUrl}`));
}

/**
 * Global error handler — จุดเดียวที่แปลง error เป็น response
 * กฎเหล็ก: ไม่ส่ง stack trace หรือข้อความจากฐานข้อมูลออกไปหา client เด็ดขาด
 */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const requestId = (req as Request & { id?: string }).id;

  let apiError: ApiError;

  if (err instanceof ApiError) {
    apiError = err;
  } else if (err instanceof ZodError) {
    const fields: Record<string, string> = {};
    for (const issue of err.issues) {
      fields[issue.path.join('.') || '_'] = issue.message;
    }
    apiError = ApiError.validation(fields);
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    apiError = mapPrismaError(err);
  } else {
    apiError = ApiError.internal();
  }

  // log เต็มรูปแบบฝั่ง server — 5xx เป็น error, 4xx เป็น warn
  const logPayload = {
    requestId,
    method: req.method,
    url: req.originalUrl,
    statusCode: apiError.statusCode,
    code: apiError.code,
    err,
  };
  if (apiError.statusCode >= 500) logger.error(logPayload, apiError.message);
  else logger.warn(logPayload, apiError.message);

  const body: ErrorBody = {
    success: false,
    error: {
      code: apiError.code,
      message: apiError.message,
      ...(apiError.fields ? { fields: apiError.fields } : {}),
    },
    ...(requestId ? { requestId } : {}),
  };

  // เปิดเผย stack เฉพาะตอน dev เท่านั้น
  if (!env.isProd && err instanceof Error) {
    (body as ErrorBody & { stack?: string }).stack = err.stack;
  }

  res.status(apiError.statusCode).json(body);
}

/** แปลง error code ของ Prisma เป็นข้อความภาษาไทยที่ผู้ใช้เข้าใจได้ */
function mapPrismaError(err: Prisma.PrismaClientKnownRequestError): ApiError {
  switch (err.code) {
    case 'P2002': {
      const target = (err.meta?.target as string[] | undefined)?.join(', ') ?? 'ข้อมูล';
      return ApiError.conflict(`${target} นี้ถูกใช้งานแล้ว กรุณาใช้ค่าอื่น`);
    }
    case 'P2003':
      return ApiError.conflict('ไม่สามารถดำเนินการได้ เพราะข้อมูลนี้ถูกอ้างอิงอยู่ที่อื่น');
    case 'P2025':
      return ApiError.notFound('ไม่พบข้อมูลที่ต้องการแก้ไขหรือลบ');
    default:
      return ApiError.internal();
  }
}
