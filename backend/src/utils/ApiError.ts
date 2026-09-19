/**
 * Error กลางของระบบ — ทุก error ที่ตั้งใจโยนต้องเป็น ApiError
 * errorHandler จะแปลงเป็น response ตามรูปแบบมาตรฐาน
 * error อื่นที่ไม่ใช่ ApiError จะถูกถือเป็น 500 และไม่เปิดเผยรายละเอียดให้ client
 */
export type ErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'PAYLOAD_TOO_LARGE'
  | 'VALIDATION_ERROR'
  | 'TOO_MANY_REQUESTS'
  | 'INTERNAL_ERROR';

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly fields?: Record<string, string>;
  public readonly isOperational = true;

  constructor(
    statusCode: number,
    code: ErrorCode,
    message: string,
    fields?: Record<string, string>,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.fields = fields;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'คำขอไม่ถูกต้อง') {
    return new ApiError(400, 'BAD_REQUEST', message);
  }

  static unauthorized(message = 'กรุณาเข้าสู่ระบบก่อนใช้งาน') {
    return new ApiError(401, 'UNAUTHORIZED', message);
  }

  static forbidden(message = 'คุณไม่มีสิทธิ์ดำเนินการนี้') {
    return new ApiError(403, 'FORBIDDEN', message);
  }

  static notFound(message = 'ไม่พบข้อมูลที่ต้องการ') {
    return new ApiError(404, 'NOT_FOUND', message);
  }

  static conflict(message = 'ข้อมูลนี้มีอยู่แล้วในระบบ') {
    return new ApiError(409, 'CONFLICT', message);
  }

  static payloadTooLarge(message = 'ไฟล์มีขนาดใหญ่เกินกำหนด') {
    return new ApiError(413, 'PAYLOAD_TOO_LARGE', message);
  }

  static validation(fields: Record<string, string>, message = 'ข้อมูลไม่ถูกต้อง') {
    return new ApiError(422, 'VALIDATION_ERROR', message, fields);
  }

  static tooManyRequests(message = 'มีคำขอมากเกินไป กรุณาลองใหม่ในภายหลัง') {
    return new ApiError(429, 'TOO_MANY_REQUESTS', message);
  }

  static internal(message = 'เกิดข้อผิดพลาดภายในระบบ') {
    return new ApiError(500, 'INTERNAL_ERROR', message);
  }
}
