import session from 'express-session';
import ConnectPgSimple from 'connect-pg-simple';

const PgSession = ConnectPgSimple(session);

app.use(
  session({
    store: new PgSession({
      conString: process.env.DATABASE_URL,
      tableName: 'session', // หรือใช้ Session model ของ Prisma
    }),
    name: process.env.SESSION_NAME || 'tcom.sid',
    secret: process.env.SESSION_SECRET || 'secret-key-fallback',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 1 วัน
    },
  })
);