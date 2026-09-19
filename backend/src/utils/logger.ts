import pino from 'pino';
import { env } from '../config/env.js';

/**
 * Log ฝั่ง server เท่านั้น — ไม่มีอะไรจากที่นี่ถูกส่งไปหา client
 * dev: อ่านง่ายด้วย pino-pretty · production: JSON สำหรับระบบเก็บ log
 */
export const logger = pino({
  level: env.isProd ? 'info' : 'debug',
  redact: {
    paths: [
      'req.headers.cookie',
      'req.headers.authorization',
      'req.body.password',
      'req.body.currentPassword',
      'req.body.newPassword',
      'passwordHash',
      '*.passwordHash',
    ],
    censor: '[ซ่อนไว้]',
  },
  transport: env.isProd
    ? undefined
    : {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:HH:MM:ss',
          ignore: 'pid,hostname',
        },
      },
});
