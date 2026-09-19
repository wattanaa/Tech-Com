import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';
import { ZodError } from 'zod';
import { ApiError } from '../utils/ApiError.js';

type Source = 'body' | 'query' | 'params';

/**
 * ตัวรัน Zod schema ก่อนเข้า controller
 * ค่าที่ผ่านการ parse แล้วจะถูกเขียนทับกลับไปที่ req เพื่อให้ controller ได้ค่าที่ผ่าน transform
 *
 *   router.post('/news', validate(createNewsSchema), newsController.create)
 */
export function validate(schema: ZodSchema, source: Source = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[source]);
      if (source === 'query') {
        // req.query เป็น getter-only ใน Express 5 — เก็บไว้ที่ช่องแยก
        (req as Request & { validatedQuery?: unknown }).validatedQuery = parsed;
      } else {
        req[source] = parsed as never;
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const fields: Record<string, string> = {};
        for (const issue of err.issues) {
          fields[issue.path.join('.') || '_'] = issue.message;
        }
        next(ApiError.validation(fields));
        return;
      }
      next(err);
    }
  };
}
