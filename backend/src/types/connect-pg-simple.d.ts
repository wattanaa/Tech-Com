/**
 * connect-pg-simple ไม่มี type มาให้ในตัว
 * ประกาศเท่าที่โปรเจกต์นี้ใช้จริง เพื่อให้ tsc ผ่านโดยไม่ต้องปิด strict
 */
declare module 'connect-pg-simple' {
  import type session from 'express-session';

  interface PgStoreOptions {
    pool?: unknown;
    conString?: string;
    conObject?: Record<string, unknown>;
    tableName?: string;
    schemaName?: string;
    createTableIfMissing?: boolean;
    ttl?: number;
    pruneSessionInterval?: number | false;
    errorLog?: (...args: unknown[]) => void;
  }

  function connectPgSimple(s: typeof session): new (options?: PgStoreOptions) => session.Store;

  export = connectPgSimple;
}
