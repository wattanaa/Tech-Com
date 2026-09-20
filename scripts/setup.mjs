#!/usr/bin/env node
/**
 * ────────────────────────────────────────────────────────────
 *  ตัวช่วยติดตั้ง / เตรียมระบบให้พร้อมรัน
 *
 *    node scripts/setup.mjs            เตรียมครบทุกอย่าง (env → db → migrate → seed)
 *    node scripts/setup.mjs --quick    เตรียมเฉพาะที่จำเป็นก่อน dev (ไม่ seed)
 *    node scripts/setup.mjs --demo     seed ข้อมูลตัวอย่างด้วย
 *    node scripts/setup.mjs --no-docker  ไม่ยุ่งกับ Docker (ใช้ PostgreSQL ของตัวเอง)
 *
 *  ทุกขั้นตอน idempotent — รันซ้ำกี่ครั้งก็ได้ ไม่ทำข้อมูลเดิมพัง
 * ────────────────────────────────────────────────────────────
 */
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = new Set(process.argv.slice(2));
const QUICK = args.has('--quick');
const DEMO = args.has('--demo');
const USE_DOCKER = !args.has('--no-docker');

const c = {
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
  blue: (s) => `\x1b[36m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
};

const step = (msg) => console.log(`\n${c.blue('▸')} ${c.bold(msg)}`);
const info = (msg) => console.log(`  ${c.dim(msg)}`);
const ok = (msg) => console.log(`  ${c.green('✓')} ${msg}`);
const warn = (msg) => console.log(`  ${c.yellow('!')} ${msg}`);

function die(msg, hint) {
  console.error(`\n${c.red('✗')} ${msg}`);
  if (hint) console.error(`  ${c.dim(hint)}\n`);
  process.exit(1);
}

/** รันคำสั่งแบบเห็น output ตามจริง */
function run(cmd, cmdArgs, opts = {}) {
  const res = spawnSync(cmd, cmdArgs, {
    stdio: opts.quiet ? 'pipe' : 'inherit',
    cwd: opts.cwd ?? root,
    shell: process.platform === 'win32',
    env: { ...process.env, ...opts.env },
  });
  return { code: res.status ?? 1, out: res.stdout?.toString() ?? '' };
}

const has = (cmd, probe = ['--version']) =>
  spawnSync(cmd, probe, { stdio: 'ignore', shell: process.platform === 'win32' }).status === 0;

/* ── 0. ตรวจเวอร์ชัน Node ─────────────────────────────────── */
const nodeMajor = Number(process.versions.node.split('.')[0]);
if (nodeMajor < 20) {
  die(
    `ต้องใช้ Node.js 20 ขึ้นไป (เครื่องนี้คือ ${process.versions.node})`,
    'ติดตั้งใหม่ได้ที่ https://nodejs.org แล้วสั่งคำสั่งเดิมอีกครั้ง',
  );
}

/* ── 1. เตรียมไฟล์ .env ───────────────────────────────────── */
step('ตรวจไฟล์ตั้งค่า (.env)');

/** อ่าน/เขียนค่าใน .env โดยไม่ทำ comment ในไฟล์หาย */
function setEnvValue(file, key, value) {
  const text = readFileSync(file, 'utf8');
  const line = `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, 'm');
  writeFileSync(file, re.test(text) ? text.replace(re, line) : `${text.trimEnd()}\n${line}\n`);
}

function getEnvValue(file, key) {
  const m = readFileSync(file, 'utf8').match(new RegExp(`^${key}=(.*)$`, 'm'));
  return m ? m[1].trim().replace(/^["']|["']$/g, '') : '';
}

function ensureEnvFile(dir) {
  const envPath = path.join(root, dir, '.env');
  const examplePath = path.join(root, dir, '.env.example');
  if (existsSync(envPath)) {
    ok(`${dir}/.env มีอยู่แล้ว`);
    return envPath;
  }
  if (!existsSync(examplePath)) die(`ไม่พบ ${dir}/.env.example`);
  copyFileSync(examplePath, envPath);
  ok(`สร้าง ${dir}/.env จากไฟล์ตัวอย่าง`);
  return envPath;
}

const backendEnv = ensureEnvFile('backend');
ensureEnvFile('frontend');

// SESSION_SECRET ต้องยาว ≥ 32 ตัว ไม่งั้น backend จะไม่ยอม boot — สุ่มให้เลยถ้ายังว่าง
if (getEnvValue(backendEnv, 'SESSION_SECRET').length < 32) {
  setEnvValue(backendEnv, 'SESSION_SECRET', randomBytes(48).toString('hex'));
  ok('สุ่ม SESSION_SECRET ให้อัตโนมัติ');
}

// รหัสผ่านผู้ดูแลตอน seed — สุ่มให้ถ้ายังไม่ตั้ง แล้วแจ้งบนหน้าจอครั้งเดียว
let generatedAdminPassword = null;
if (!getEnvValue(backendEnv, 'SEED_ADMIN_PASSWORD')) {
  generatedAdminPassword = `Tcom-${randomBytes(6).toString('base64url')}`;
  setEnvValue(backendEnv, 'SEED_ADMIN_PASSWORD', generatedAdminPassword);
  ok('ตั้งรหัสผ่านผู้ดูแลเริ่มต้นให้อัตโนมัติ');
}

/* ── 2. เปิดฐานข้อมูล ─────────────────────────────────────── */
const dbUrl = getEnvValue(backendEnv, 'DATABASE_URL');
const isLocalDb = /@(localhost|127\.0\.0\.1)[:/]/.test(dbUrl);
const dockerReady = USE_DOCKER && has('docker', ['compose', 'version']);

step('เตรียมฐานข้อมูล PostgreSQL');

if (!USE_DOCKER) {
  info('ข้าม Docker ตามที่สั่ง — ใช้ PostgreSQL ที่ตั้งค่าไว้ใน DATABASE_URL');
} else if (!isLocalDb) {
  info('DATABASE_URL ชี้ไปเซิร์ฟเวอร์ภายนอก จึงไม่เปิด container ให้');
} else if (!dockerReady) {
  warn('ไม่พบ Docker บนเครื่องนี้');
  info('ถ้ามี PostgreSQL 16 อยู่แล้ว ให้แก้ DATABASE_URL ใน backend/.env ให้ตรง');
  info('ถ้ายังไม่มี ติดตั้ง Docker Desktop จาก https://docker.com แล้วรันคำสั่งนี้ใหม่');
} else {
  run('docker', ['compose', 'up', '-d']);
  process.stdout.write(`  ${c.dim('รอฐานข้อมูลพร้อมรับการเชื่อมต่อ')}`);
  let ready = false;
  for (let i = 0; i < 60; i++) {
    const probe = run('docker', ['compose', 'exec', '-T', 'postgres', 'pg_isready', '-q'], {
      quiet: true,
    });
    if (probe.code === 0) {
      ready = true;
      break;
    }
    process.stdout.write('.');
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1000);
  }
  process.stdout.write('\n');
  if (!ready) {
    die(
      'ฐานข้อมูลยังไม่พร้อมหลังรอ 60 วินาที',
      'ดู log ด้วย: docker compose logs postgres',
    );
  }
  ok('ฐานข้อมูลพร้อมใช้งาน');
}

/* ── 3. สร้าง Prisma Client + ตาราง ───────────────────────── */
step('สร้าง Prisma Client และโครงสร้างตาราง');

const backendDir = path.join(root, 'backend');
if (run('npx', ['prisma', 'generate'], { cwd: backendDir, quiet: true }).code !== 0) {
  die('สร้าง Prisma Client ไม่สำเร็จ', 'ลองสั่ง npm install อีกครั้ง');
}
ok('Prisma Client พร้อม');

// migrate deploy ปลอดภัยกว่า migrate dev ตรงที่ไม่ถามอะไรกลางคัน จึงรันอัตโนมัติได้
if (run('npx', ['prisma', 'migrate', 'deploy'], { cwd: backendDir }).code !== 0) {
  die(
    'สร้างตารางไม่สำเร็จ — มักเกิดจากเชื่อมต่อฐานข้อมูลไม่ได้',
    'ตรวจ DATABASE_URL ใน backend/.env แล้วลองใหม่ด้วย npm run setup',
  );
}
ok('โครงสร้างตารางเป็นปัจจุบัน');

/* ── 4. ใส่ข้อมูลตั้งต้น ──────────────────────────────────── */
if (QUICK) {
  info('โหมด --quick จึงข้ามการ seed');
} else {
  step(DEMO ? 'ใส่ข้อมูลแกนระบบ + ข้อมูลตัวอย่าง' : 'ใส่ข้อมูลแกนระบบ');
  const seedArgs = ['tsx', 'prisma/seed.ts', ...(DEMO ? [] : ['--core-only'])];
  if (run('npx', seedArgs, { cwd: backendDir }).code !== 0) {
    die('ใส่ข้อมูลตั้งต้นไม่สำเร็จ', 'อ่านข้อความผิดพลาดด้านบนประกอบ');
  }
  ok('ข้อมูลตั้งต้นเรียบร้อย');
}

/* ── 5. สรุป ──────────────────────────────────────────────── */
console.log(`\n${c.green('✔')} ${c.bold('ระบบพร้อมใช้งานแล้ว')}`);
if (generatedAdminPassword) {
  console.log(
    `\n  ${c.yellow('บัญชีผู้ดูแลเริ่มต้น')}\n` +
      `    อีเมล    ${getEnvValue(backendEnv, 'SEED_ADMIN_EMAIL')}\n` +
      `    รหัสผ่าน  ${c.bold(generatedAdminPassword)}\n` +
      `  ${c.dim('เก็บไว้ให้ดีและเปลี่ยนทันทีหลังเข้าระบบครั้งแรก (ดูได้ใน backend/.env)')}`,
  );
}
if (!QUICK) {
  console.log(
    `\n  เริ่มระบบด้วย  ${c.bold('npm run dev')}\n` +
      `    เว็บไซต์  http://localhost:5173\n` +
      `    API      http://localhost:4000/api/v1/health\n`,
  );
}
