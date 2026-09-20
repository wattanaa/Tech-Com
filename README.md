# ระบบเว็บไซต์สารสนเทศ — แผนกวิชาเทคโนโลยีคอมพิวเตอร์
### วิทยาลัยเทคนิคร้อยเอ็ด

เว็บไซต์แบบ Full-Stack ประกอบด้วย **เว็บไซต์สาธารณะ** และ **ระบบจัดการเนื้อหา (Admin CMS)**
ที่ใช้ฐานข้อมูลเดียวกันผ่าน REST API — เนื้อหาทุกส่วนบนหน้าเว็บแก้ไขได้จากหลังบ้าน
โดยไม่ต้องแก้ Source Code

---

## 🚀 นำขึ้นใช้งานจริงด้วยคำสั่งเดียว

มี Docker อยู่แล้ว? ติดตั้งทั้งระบบ (ฐานข้อมูล + API + เว็บ) ได้ในคำสั่งเดียว

```bash
git clone https://github.com/wattanaa/TCOM.git && cd TCOM
./deploy.sh
```

สคริปต์จะสุ่มค่าความปลอดภัยให้อัตโนมัติ ถามแค่รหัสผ่านผู้ดูแล แล้วสร้างตาราง +
ใส่ข้อมูลตั้งต้นให้เอง จากนั้นเปิดเว็บที่ **http://localhost/** ได้ทันที

ไม่มี server เป็นของตนเอง? deploy ขึ้นคลาวด์ฟรีผ่าน Render ได้ในไม่กี่คลิก —
ดูทั้ง 3 ทางเลือกใน **[คู่มือ Deploy (docs/DEPLOY.md)](docs/DEPLOY.md)**

---

## สถานะการพัฒนา

| Phase | งาน | สถานะ |
|---|---|:---:|
| 0 | เอกสารสถาปัตยกรรม ([docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)) | ✅ |
| 1 | Project Setup · Design System · UI Preview | ✅ |
| 2 | Database + Prisma Schema ครบทุกตาราง + Demo Data | ✅ |
| 3 | Backend REST API | ⏳ |
| 4 | Authentication + RBAC | ⏳ |
| 5–18 | CRUD · Media · CMS · Homepage Builder · Public Site · Dashboard · Security | ⏳ |
| — | **Deployment** — Docker / Render / Manual ([docs/DEPLOY.md](docs/DEPLOY.md)) | ✅ |

### ฐานข้อมูล (PHASE 2)

27 ตาราง · 11 enum · ความสัมพันธ์ 15 ชุด — ดู ER Diagram และคำอธิบายทุกตารางได้ใน
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) หัวข้อ 4–5

**ข้อมูลตัวอย่าง** ที่ `npm run db:seed` สร้างให้ (เป็นข้อมูลสมมติทั้งหมด)

| ข้อมูล | จำนวน | ข้อมูล | จำนวน |
|---|:---:|---|:---:|
| ครูและบุคลากร | 5 | ผลงานนักศึกษา | 6 |
| หลักสูตร | 2 | ห้องปฏิบัติการ | 5 |
| รายวิชา | 6 | อัลบั้ม / ภาพในคลัง | 3 / 20 |
| นักศึกษา | 10 | หมวดหมู่ | 11 |
| ข่าวประชาสัมพันธ์ | 6 | ข้อความติดต่อ | 3 |
| กิจกรรม | 6 | Section หน้าแรก | 12 |

ภาพตัวอย่างถูกสร้างเป็นไฟล์ SVG ลงใน `backend/uploads/demo/` ตอน seed
จึงเปิดดูบนหน้าเว็บได้จริงทันทีโดยไม่ต้องหาไฟล์ภาพมาใส่เอง

> **ตอนขึ้นระบบจริง** ให้ล้างข้อมูลตัวอย่างด้วย `npm run db:reset`
> แล้วสั่ง `npm run db:seed -- --core-only` เพื่อใส่เฉพาะข้อมูลแกนระบบ
> จากนั้นกรอกข้อมูลจริงผ่าน Admin

---

## เทคโนโลยีที่ใช้

**Frontend** React 18 · TypeScript · Vite · Tailwind CSS · Motion · TanStack Query · React Hook Form + Zod · dnd-kit · Lucide

**Backend** Node.js 20 · Express · TypeScript · Prisma · PostgreSQL 16 · Argon2id · express-session · Helmet · Pino

---

## ติดตั้งและเริ่มใช้งาน

### สิ่งที่ต้องมีก่อน

- Node.js 20 ขึ้นไป
- Docker (สำหรับรัน PostgreSQL) หรือ PostgreSQL 16 ที่ติดตั้งไว้แล้ว

### ขั้นตอน

```bash
npm install     # ติดตั้ง dependency ทั้งหมด (backend + frontend)
npm run dev     # เตรียมทุกอย่างให้เอง แล้วเริ่มระบบ
```

`npm run dev` จะทำ 4 อย่างนี้ให้อัตโนมัติก่อนเริ่มเซิร์ฟเวอร์ และรันซ้ำได้เสมอโดยไม่ทำข้อมูลเดิมพัง

1. สร้าง `backend/.env` และ `frontend/.env` จากไฟล์ตัวอย่าง ถ้ายังไม่มี
2. สุ่ม `SESSION_SECRET` และรหัสผ่านผู้ดูแลเริ่มต้นให้ (แสดงบนหน้าจอครั้งแรกครั้งเดียว)
3. เปิด PostgreSQL ผ่าน Docker แล้ว**รอจนฐานข้อมูลพร้อมจริง**
4. สร้าง Prisma Client และ migrate ตารางให้เป็นปัจจุบัน

อยากได้ข้อมูลตัวอย่างสำหรับทดลองใช้งานด้วย ให้สั่งครั้งเดียวก่อน

```bash
npm run setup:demo
```

> **ไม่มี Docker?** ติดตั้ง PostgreSQL 16 เองแล้วแก้ `DATABASE_URL` ใน `backend/.env`
> ให้ตรงกับเครื่อง จากนั้นสั่ง `npm run setup -- --no-docker` ได้ตามปกติ

| บริการ | ที่อยู่ |
|---|---|
| เว็บไซต์ | http://localhost:5173 |
| API | http://localhost:4000/api/v1 |
| ตรวจสถานะระบบ | http://localhost:4000/api/v1/health |
| Prisma Studio | `npm run db:studio` |

> เปิด http://localhost:5173 แล้วหน้าจอต้องแสดงสถานะ **API Server ทำงานปกติ**
> และ **ฐานข้อมูล PostgreSQL เชื่อมต่อแล้ว** จึงถือว่าติดตั้งสำเร็จ

---

## คำสั่งที่ใช้บ่อย

| คำสั่ง | ทำอะไร |
|---|---|
| `npm run dev` | เตรียมระบบให้พร้อม แล้วรัน API และเว็บพร้อมกัน |
| `npm run setup` | เตรียม .env + ฐานข้อมูล + ตาราง + ข้อมูลแกนระบบ |
| `npm run setup:demo` | เหมือน setup แต่ใส่ข้อมูลตัวอย่างให้ด้วย |
| `npm run fresh` | ล้างฐานข้อมูลแล้วติดตั้งใหม่ทั้งหมดพร้อมข้อมูลตัวอย่าง |
| `npm run dev:api` / `npm run dev:web` | รันแยกทีละฝั่ง |
| `npm run build` | build ทั้งสองฝั่งสำหรับ production |
| `npm run db:migrate` | สร้าง / ปรับโครงสร้างฐานข้อมูล |
| `npm run db:seed` | ใส่ข้อมูลตั้งต้น (รันซ้ำได้ ไม่สร้างข้อมูลซ้ำ) |
| `npm run db:studio` | เปิดหน้าจัดการฐานข้อมูลของ Prisma |
| `npm run db:reset` | ล้างฐานข้อมูลแล้วสร้างใหม่ (ข้อมูลหายทั้งหมด) |

---

## โครงสร้างโปรเจกต์

```
tcom-website/
├── docs/
│   ├── ARCHITECTURE.md      สถาปัตยกรรม · ER Diagram · API · CRUD Matrix · CIA
│   └── ui-preview.html      ตัวอย่างหน้าจอ 4 หน้าหลัก
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma    27 ตาราง · 11 enum
│   │   ├── seed.ts          ตัวเรียกหลัก (รองรับ --core-only)
│   │   ├── seeds/core.ts    บทบาท · สิทธิ์ · ผู้ดูแล · Section · เมนู · ตั้งค่า · SEO
│   │   ├── seeds/demo.ts    ข้อมูลตัวอย่างทั้งหมด (ข้อมูลสมมติ)
│   │   └── migrations/
│   └── src/
│       ├── config/          env · database · constants (permission, workflow)
│       ├── middleware/       error · validate · auth · rbac · upload
│       ├── routes/          1 ไฟล์ต่อ 1 entity
│       ├── controllers/     รับ request → เรียก service
│       ├── services/        business logic + transaction
│       ├── repositories/    Prisma query เท่านั้น
│       ├── validators/      Zod schema
│       └── utils/           ApiError · ApiResponse · logger
└── frontend/
    └── src/
        ├── api/             axios client + interceptor
        ├── components/ui/   Design System — GlassCard · Button · DataTable …
        ├── components/sections/  Section ของหน้าแรก (1 ต่อ 1 กับฐานข้อมูล)
        ├── features/        โค้ดเฉพาะฟีเจอร์ (news · homepage-builder · media)
        ├── animations/      motion token กลาง
        ├── hooks/           useTheme · useAuth · usePermission · useDebounce
        └── styles/          design token + utility กลาง
```

---

## ความปลอดภัย (CIA)

**Confidentiality** — รหัสผ่านเข้ารหัสด้วย Argon2id · session เก็บใน httpOnly cookie ·
ตรวจสิทธิ์ (RBAC) ที่ Backend ทุกเส้นทาง · Helmet · CORS whitelist · rate limit · ล็อกบัญชีเมื่อกรอกผิดเกิน 5 ครั้ง

**Integrity** — ตรวจข้อมูลด้วย Zod ทุก endpoint · constraint และ foreign key ในฐานข้อมูล ·
ทุกงานที่แตะหลายตารางอยู่ใน transaction · เก็บ audit log และ version history · soft delete

**Availability** — global error handler ไม่ส่ง stack trace ออกไปหาผู้ใช้ · retry + timeout ·
cache · pagination บังคับ · index ครบ · health check · graceful shutdown · สำรองข้อมูล

> รายละเอียดทั้งหมดอยู่ใน [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) หัวข้อ 10

---

## ข้อควรระวัง

- **ห้าม commit ไฟล์ `.env`** เข้า git — มีเฉพาะ `.env.example` เท่านั้นที่อยู่ใน repository
- รหัสผ่านผู้ดูแลระบบมาจาก `.env` เท่านั้น ไม่มีค่า default ในโค้ด
  และควรเปลี่ยนทันทีหลังเข้าสู่ระบบครั้งแรก
- โฟลเดอร์ `backend/uploads/` และ `backend/backups/` ไม่ถูกเก็บใน git
  ตอน deploy ต้องตั้งค่าให้ persist แยกต่างหาก
