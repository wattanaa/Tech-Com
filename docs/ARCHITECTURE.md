# ARCHITECTURE — ระบบเว็บไซต์สารสนเทศ
## แผนกวิชาเทคโนโลยีคอมพิวเตอร์ วิทยาลัยเทคนิคร้อยเอ็ด

> เอกสารสถาปัตยกรรมระบบ (PHASE 0) — จัดทำก่อนเริ่มเขียนโค้ดจริง
> Version 1.0 · 2026-09-19

---

## 1. SYSTEM ARCHITECTURE

### 1.1 ภาพรวมสถาปัตยกรรม

ระบบใช้สถาปัตยกรรมแบบ **Decoupled 3-Tier Architecture** แยก Frontend / Backend / Database
ออกจากกันอย่างชัดเจน เชื่อมต่อกันผ่าน REST API เท่านั้น

```
┌───────────────────────────────────────────────────────────────────────┐
│                          CLIENT TIER (Browser)                        │
│                                                                       │
│   ┌─────────────────────────┐     ┌─────────────────────────────┐     │
│   │   PUBLIC WEBSITE (SPA)  │     │      ADMIN CMS (SPA)        │     │
│   │   React + Vite          │     │      React + Vite           │     │
│   │   / , /news , /courses  │     │      /admin/*               │     │
│   │   Public — ไม่ต้อง Login│     │      Protected — ต้อง Login │     │
│   └───────────┬─────────────┘     └──────────────┬──────────────┘     │
│               │  TanStack Query (cache + retry)  │                    │
└───────────────┼──────────────────────────────────┼────────────────────┘
                │            HTTPS / JSON          │
                │      httpOnly Cookie (session)   │
┌───────────────▼──────────────────────────────────▼────────────────────┐
│                       APPLICATION TIER (Node.js)                      │
│                                                                       │
│   ┌─────────────────────────────────────────────────────────────┐     │
│   │  MIDDLEWARE PIPELINE                                        │     │
│   │  helmet → cors → rateLimit → cookieParser → session →       │     │
│   │  requestId → logger → [route] → errorHandler                │     │
│   └─────────────────────────────────────────────────────────────┘     │
│                                                                       │
│   ROUTES ──▶ VALIDATORS (Zod) ──▶ CONTROLLERS ──▶ SERVICES            │
│                                                       │               │
│                                        ┌──────────────┴────────────┐  │
│                                        │  REPOSITORIES (Prisma)    │  │
│                                        └──────────────┬────────────┘  │
│   Cross-cutting: authGuard · rbacGuard · auditLogger · cache          │
└────────────────────────────────────────────────────────┼──────────────┘
                                                         │ SQL
┌────────────────────────────────────────────────────────▼──────────────┐
│                            DATA TIER                                  │
│   PostgreSQL 16            │  Local/S3 Storage   │  In-Memory Cache   │
│   24 tables + indexes      │  /uploads (media)   │  node-cache (TTL)  │
└───────────────────────────────────────────────────────────────────────┘
```

### 1.2 หลักการออกแบบ (Design Principles)

| หลักการ | การนำไปใช้ |
|---|---|
| **Separation of Concerns** | Controller ไม่แตะ Prisma โดยตรง — ต้องผ่าน Service → Repository |
| **Single Source of Truth** | Type ของ API สร้างจาก Zod schema เดียวกันทั้ง FE/BE (`packages/shared`) |
| **Content-Driven** | ทุกข้อความบนหน้าเว็บอ่านจาก DB ไม่มี hard-code ใน component |
| **Security at Backend** | Frontend ซ่อนปุ่มได้ แต่ Backend ต้องตรวจ permission ทุก request เสมอ |
| **Fail Safe** | Error ทุกชนิดถูกดักที่ `errorHandler` กลาง ไม่ส่ง stack trace ออก client |
| **Soft Delete First** | ข้อมูลสำคัญใช้ `deletedAt` ไม่ลบจริง — กู้คืนได้ |

### 1.3 Request Lifecycle (ตัวอย่าง: Admin แก้ไขข่าว)

```
1. Browser      PUT /api/news/42  { title, content, status }
                Cookie: sid=<httpOnly>
2. helmet       ตั้ง security headers
3. rateLimit    ตรวจ 100 req / 15 min ต่อ IP
4. session      โหลด session จาก store → req.user = { id, role }
5. authGuard    ไม่มี user → 401 UNAUTHORIZED
6. rbacGuard    ตรวจ permission 'news:update' ตาม role → ไม่มี → 403
7. validator    Zod parse req.body → ไม่ผ่าน → 422 พร้อม field errors
8. controller   เรียก newsService.update(42, dto, req.user)
9. service      ├─ BEGIN TRANSACTION
                ├─ อ่านค่าเดิม (สำหรับ diff)
                ├─ ตรวจ workflow: EDITOR แก้ PUBLISHED ไม่ได้
                ├─ newsRepository.update()
                ├─ contentVersionRepository.create()   ← Version History
                ├─ auditLogRepository.create()         ← Audit Log
                └─ COMMIT
10. response    200 { success: true, data: {...} }
11. audit       บันทึก user, action, entity, ip, userAgent, changes
```

---

## 2. TECHNOLOGY STACK

### 2.1 Frontend

| ส่วน | เทคโนโลยี | เหตุผล |
|---|---|---|
| Framework | **React 18** + **TypeScript 5** | Component reuse, type safety |
| Build Tool | **Vite 5** | Dev server เร็ว, code splitting อัตโนมัติ |
| Styling | **Tailwind CSS 3** + CSS Variables | Design token, dark mode, utility-first |
| Animation | **Motion** (framer-motion) | Scroll reveal, page transition, layout animation |
| Icons | **Lucide React** | เส้นบาง สะอาด เข้ากับธีม |
| Form | **React Hook Form** + **Zod** | Validation ฝั่ง client ใช้ schema เดียวกับ backend |
| Data Fetching | **TanStack Query v5** | Cache, retry, optimistic update, pagination |
| Routing | **React Router v6** | Nested route, protected route |
| Drag & Drop | **@dnd-kit** | Homepage Builder, Navigation, Gallery reorder (a11y ดีกว่า react-beautiful-dnd) |
| Chart | **Recharts** | Dashboard analytics |
| Font | **IBM Plex Sans Thai** + **Noto Sans Thai** | รองรับไทยครบ weight |

### 2.2 Backend

| ส่วน | เทคโนโลยี | เหตุผล |
|---|---|---|
| Runtime | **Node.js 20 LTS** | รองรับ ESM, stable |
| Framework | **Express 4** + **TypeScript** | ยืดหยุ่น, middleware ecosystem กว้าง |
| ORM | **Prisma 5** | Type-safe query, migration, relation ชัดเจน |
| Database | **PostgreSQL 16** | ACID, JSONB (เก็บ section config), full-text search |
| Auth | **express-session** + **connect-pg-simple** | Session เก็บใน DB, httpOnly cookie — ปลอดภัยกว่า JWT ใน localStorage |
| Password | **Argon2id** | ทนต่อ GPU attack ดีกว่า bcrypt |
| Validation | **Zod** | Schema เดียวใช้ได้ทั้ง FE/BE |
| Upload | **Multer** + **Sharp** | รับไฟล์ + แปลงเป็น WebP + สร้าง thumbnail |
| Security | **Helmet**, **express-rate-limit**, **csurf** | Header, brute-force, CSRF |
| Log | **Pino** | JSON log เร็ว แยก dev/prod |
| Test | **Vitest** + **Supertest** | Unit + Integration |

### 2.3 เหตุผลที่เลือก Session แทน JWT

| ประเด็น | Session (เลือกใช้) | JWT |
|---|---|---|
| Revoke ทันที | ทำได้ — ลบ record ใน DB | ทำไม่ได้จนกว่าจะหมดอายุ |
| XSS ขโมย token | ไม่ได้ — httpOnly cookie | ได้ ถ้าเก็บใน localStorage |
| Logout ทุกอุปกรณ์ | ทำได้ | ต้องทำ blocklist เพิ่ม |
| เหมาะกับ | เว็บสถานศึกษา (First-party) | Mobile app / Third-party API |

---

## 3. FOLDER STRUCTURE

```
tcom-website/
├── docs/
│   ├── ARCHITECTURE.md              ← เอกสารฉบับนี้
│   ├── API.md                       ← API reference
│   └── SECURITY.md                  ← CIA checklist
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.ts               ตรวจสอบ .env ด้วย Zod ตอน boot
│   │   │   ├── database.ts          Prisma client singleton
│   │   │   ├── session.ts           express-session config
│   │   │   └── constants.ts         ROLES, PERMISSIONS, WORKFLOW
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts           authGuard
│   │   │   ├── rbac.middleware.ts           requirePermission()
│   │   │   ├── validate.middleware.ts       Zod runner
│   │   │   ├── upload.middleware.ts         Multer + file type check
│   │   │   ├── rateLimit.middleware.ts
│   │   │   ├── audit.middleware.ts
│   │   │   └── error.middleware.ts          Global error handler
│   │   ├── routes/
│   │   │   ├── index.ts             รวม router ทั้งหมด
│   │   │   ├── auth.routes.ts
│   │   │   ├── news.routes.ts
│   │   │   ├── teachers.routes.ts
│   │   │   ├── ... (1 ไฟล์ / 1 entity)
│   │   │   └── admin/
│   │   │       ├── homepage.routes.ts
│   │   │       ├── backup.routes.ts
│   │   │       └── audit.routes.ts
│   │   ├── controllers/             รับ req → เรียก service → ส่ง res
│   │   ├── services/                Business logic + transaction
│   │   ├── repositories/            Prisma query เท่านั้น
│   │   ├── validators/              Zod schema ต่อ entity
│   │   ├── utils/
│   │   │   ├── ApiError.ts          Custom error class
│   │   │   ├── ApiResponse.ts       รูปแบบ response มาตรฐาน
│   │   │   ├── password.ts          Argon2 hash/verify
│   │   │   ├── slug.ts              สร้าง slug รองรับภาษาไทย
│   │   │   ├── pagination.ts        parse page/limit/sort
│   │   │   └── logger.ts            Pino
│   │   ├── types/
│   │   ├── app.ts                   สร้าง Express app
│   │   └── server.ts                Entry point + graceful shutdown
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.ts
│   │   └── migrations/
│   ├── uploads/                     ไฟล์ที่อัปโหลด (gitignored)
│   ├── backups/                     ไฟล์ backup (gitignored)
│   ├── tests/
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.ts            Axios instance + interceptor
│   │   │   ├── news.api.ts
│   │   │   └── ... (1 ไฟล์ / 1 entity)
│   │   ├── components/
│   │   │   ├── ui/                  ── Design System (atom) ──
│   │   │   │   ├── GlassCard.tsx
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Input.tsx / Select.tsx / DatePicker.tsx
│   │   │   │   ├── Modal.tsx / Drawer.tsx / ConfirmDialog.tsx
│   │   │   │   ├── DataTable.tsx    (auto card-view บนมือถือ)
│   │   │   │   ├── Toast.tsx / Skeleton.tsx / Loading.tsx
│   │   │   │   ├── EmptyState.tsx / ErrorState.tsx
│   │   │   │   ├── Pagination.tsx / SearchInput.tsx / FilterBar.tsx
│   │   │   │   └── FileUploader.tsx
│   │   │   ├── common/              Navbar, Footer, SectionHeader, ThemeToggle
│   │   │   └── sections/            ── Homepage Section (1:1 กับ DB) ──
│   │   │       ├── HeroSection.tsx
│   │   │       ├── StatisticsSection.tsx
│   │   │       ├── AboutSection.tsx
│   │   │       ├── ... (12 section)
│   │   │       └── registry.ts      Map: sectionType → Component
│   │   ├── features/                ── โค้ดเฉพาะฟีเจอร์ ──
│   │   │   ├── news/
│   │   │   ├── homepage-builder/
│   │   │   ├── media-library/
│   │   │   └── auth/
│   │   ├── layouts/
│   │   │   ├── PublicLayout.tsx
│   │   │   ├── AdminLayout.tsx
│   │   │   └── AuthLayout.tsx
│   │   ├── pages/
│   │   │   ├── public/              HomePage, NewsPage, NewsDetail, ...
│   │   │   └── admin/               Dashboard, NewsList, NewsForm, ...
│   │   ├── hooks/
│   │   │   ├── useAuth.ts / usePermission.ts
│   │   │   ├── useDebounce.ts / useMediaQuery.ts
│   │   │   ├── useTheme.ts / useReducedMotion.ts
│   │   │   └── useScrollReveal.ts
│   │   ├── animations/
│   │   │   ├── variants.ts          fadeUp, fadeIn, scaleIn, stagger
│   │   │   └── transitions.ts       easing + duration token
│   │   ├── services/                auth.service, upload.service
│   │   ├── types/
│   │   ├── utils/
│   │   ├── styles/
│   │   │   └── index.css            @layer base/components + design token
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   ├── .env.example
│   ├── tailwind.config.ts
│   ├── vite.config.ts
│   └── package.json
│
├── packages/
│   └── shared/                      Zod schema + type ที่ FE/BE ใช้ร่วมกัน
│
├── docker-compose.yml               PostgreSQL สำหรับ dev
├── package.json                     npm workspaces + script รวม
└── README.md
```

**กฎการจัดไฟล์:** 1 component = 1 ไฟล์, ไฟล์ไม่เกิน ~250 บรรทัด, ถ้าเกินให้แตกเป็น sub-component

---

## 4. DATABASE ER DIAGRAM

```
                              ┌──────────────┐
                              │    roles     │
                              │ id, name     │
                              │ level        │
                              └──────┬───────┘
                                     │ 1
                                     │
                              ┌──────▼───────┐         ┌───────────────────┐
              ┌───────────────│    users     │────────▶│ role_permissions  │
              │               │ id, email    │  M:N    │ (permissions)     │
              │               │ passwordHash │         └───────────────────┘
              │               │ roleId       │
              │               └──────┬───────┘
              │ createdBy/updatedBy  │ 1
              │ (เกือบทุกตาราง)      │
              │                      ├──────────▶ audit_logs        (N)
              │                      ├──────────▶ content_versions  (N)
              │                      ├──────────▶ notifications     (N)
              │                      ├──────────▶ media             (N)
              │                      ├──────────▶ backups           (N)
              │                      └──────────▶ teachers (1:1 optional)
              │
   ┌──────────┴──────────────────────────────────────────────────┐
   │                      CONTENT ENTITIES                       │
   │                                                             │
   │  ┌────────────┐  1     N  ┌────────────┐                    │
   │  │  programs  │──────────▶│  courses   │                    │
   │  │ ปวช./ปวส.  │           │ รหัสวิชา   │                    │
   │  └────────────┘           └─────┬──────┘                    │
   │                                 │ N                         │
   │                                 │ M:N (course_teachers)     │
   │  ┌────────────┐  1     N        │                           │
   │  │ categories │─────────┐  ┌────▼───────┐                   │
   │  │ (ข่าว/กิจ)  │         │  │  teachers  │                   │
   │  └─────┬──────┘         │  │ ตำแหน่ง    │                   │
   │        │ N              │  └─────┬──────┘                   │
   │   ┌────▼─────┐          │        │ 1                        │
   │   │   news   │          │        │ N  (advisor)             │
   │   │ status   │          │   ┌────▼───────┐                  │
   │   └──────────┘          │   │  projects  │                  │
   │                         │   └────┬───────┘                  │
   │   ┌──────────┐          │        │ M:N                      │
   │   │activities│◀─────────┘   ┌────▼───────┐                  │
   │   └──────────┘              │  students  │                  │
   │                             └────────────┘                  │
   │   ┌────────────┐   1    N   ┌────────────────┐              │
   │   │   albums   │───────────▶│ gallery_images │              │
   │   └────────────┘            └────────┬───────┘              │
   │                                      │ N:1                  │
   │   ┌────────────┐                ┌────▼───────┐              │
   │   │ facilities │───────────────▶│   media    │◀── ทุก entity │
   │   └────────────┘                └────────────┘   อ้าง mediaId│
   └─────────────────────────────────────────────────────────────┘

   ┌─────────────────────────────────────────────────────────────┐
   │                    SITE CONFIGURATION                       │
   │  homepage_sections   (type, order, isVisible, config JSONB) │
   │  navigation_items    (parentId self-relation, order)        │
   │  site_settings       (key-value: footer, contact, social)   │
   │  seo_settings        (path-based: title, description, og)   │
   │  contact_messages    (จาก Contact Form → notification)      │
   └─────────────────────────────────────────────────────────────┘
```

### ความสัมพันธ์หลัก

| จาก | ถึง | ชนิด | หมายเหตุ |
|---|---|---|---|
| users | roles | N:1 | `onDelete: Restrict` |
| roles | permissions | M:N | ผ่าน `role_permissions` |
| programs | courses | 1:N | `onDelete: Restrict` (มีวิชาอยู่ ลบไม่ได้) |
| courses | teachers | M:N | ผ่าน `course_teachers` |
| news | categories | N:1 | `onDelete: SetNull` |
| news | users | N:1 | author, `onDelete: Restrict` |
| albums | gallery_images | 1:N | `onDelete: Cascade` |
| projects | students | M:N | ผ่าน `project_members` |
| ทุก content | media | N:1 | `coverImageId`, `onDelete: SetNull` |
| navigation_items | navigation_items | 1:N | self-relation (เมนูย่อย) |

---

## 5. DATABASE SCHEMA (สรุปโครงสร้าง 24 ตาราง)

### 5.1 ฟิลด์มาตรฐานทุกตาราง

```prisma
id         String    @id @default(cuid())
createdAt  DateTime  @default(now())
updatedAt  DateTime  @updatedAt
```

ตารางเนื้อหาเพิ่ม:
```prisma
createdById String?
updatedById String?
deletedAt   DateTime?   @@index([deletedAt])
```

### 5.2 ตารางและฟิลด์สำคัญ

| # | ตาราง | ฟิลด์สำคัญ | Index / Unique |
|---|---|---|---|
| 1 | `users` | email, passwordHash, name, avatarId, roleId, isActive, lastLoginAt, failedLoginCount, lockedUntil | `@unique(email)`, `@@index([roleId])` |
| 2 | `roles` | name (SUPER_ADMIN/ADMIN/EDITOR), label, level | `@unique(name)` |
| 3 | `permissions` | key (`news:create`), group, label | `@unique(key)` |
| 4 | `role_permissions` | roleId, permissionId | `@@id([roleId, permissionId])` |
| 5 | `teachers` | prefix, firstName, lastName, position, academicRank, specialties[], bio, email, phone, facebook, line, photoId, type, order | `@@index([type, order])` |
| 6 | `students` | studentCode, firstName, lastName, programId, level, classRoom, year, photoId | `@unique(studentCode)` |
| 7 | `programs` | code, name, nameEn, level (POR_WOR_CHOR/POR_WOR_SOR), duration, description, skills[], imageId | `@unique(code)`, `@@index([level])` |
| 8 | `courses` | code, name, credits, hours, theoryHours, practiceHours, description, programId, term, imageId | `@unique(code)`, `@@index([programId])` |
| 9 | `course_teachers` | courseId, teacherId | `@@id([courseId, teacherId])` |
| 10 | `news` | title, slug, excerpt, content, coverImageId, categoryId, authorId, status, publishedAt, views, isPinned | `@unique(slug)`, `@@index([status, publishedAt])` |
| 11 | `categories` | name, slug, type (NEWS/ACTIVITY/PROJECT), color | `@@unique([slug, type])` |
| 12 | `activities` | title, slug, description, content, startDate, endDate, location, categoryId, coverImageId, status | `@@index([startDate])` |
| 13 | `projects` | name, slug, description, year, categoryId, technologies[], coverImageId, demoUrl, githubUrl, advisorId, award, status | `@@index([year, categoryId])` |
| 14 | `project_members` | projectId, studentId, role | `@@id([projectId, studentId])` |
| 15 | `facilities` | name, slug, description, computerCount, software[], equipment[], coverImageId, order | `@@index([order])` |
| 16 | `albums` | name, slug, description, coverImageId, eventDate, isPublished | `@unique(slug)` |
| 17 | `gallery_images` | albumId, mediaId, caption, order | `@@index([albumId, order])` |
| 18 | `media` | filename, originalName, mimeType, size, width, height, url, thumbnailUrl, folder, uploadedById | `@@index([folder, createdAt])` |
| 19 | `contact_messages` | name, email, phone, subject, message, isRead, repliedAt, ipAddress | `@@index([isRead, createdAt])` |
| 20 | `navigation_items` | label, href, icon, parentId, order, isVisible, target, location (HEADER/FOOTER) | `@@index([location, order])` |
| 21 | `homepage_sections` | type, title, subtitle, order, isVisible, config (JSONB) | `@unique(type)`, `@@index([order])` |
| 22 | `site_settings` | key, value (JSONB), group | `@unique(key)` |
| 23 | `seo_settings` | path, title, description, keywords[], ogImageId, canonical | `@unique(path)` |
| 24 | `notifications` | userId, type, title, message, link, isRead, readAt | `@@index([userId, isRead])` |
| 25 | `audit_logs` | userId, action, entity, entityId, changes (JSONB), ipAddress, userAgent | `@@index([entity, entityId])`, `@@index([createdAt])` |
| 26 | `content_versions` | entity, entityId, version, snapshot (JSONB), changedById, note | `@@unique([entity, entityId, version])` |
| 27 | `backups` | filename, type (DATABASE/MEDIA/FULL), size, status, createdById, path | `@@index([createdAt])` |

### 5.3 Enum

```prisma
enum RoleName        { SUPER_ADMIN  ADMIN  EDITOR }
enum ContentStatus   { DRAFT  REVIEW  APPROVED  PUBLISHED  ARCHIVED }
enum ProgramLevel    { POR_WOR_CHOR  POR_WOR_SOR }          // ปวช. / ปวส.
enum TeacherType     { HEAD  TEACHER  STAFF }                // หัวหน้าแผนก/อาจารย์/บุคลากร
enum CategoryType    { NEWS  ACTIVITY  PROJECT }
enum NavLocation     { HEADER  FOOTER }
enum SectionType     { HERO STATISTICS ABOUT PROGRAMS COURSES TEACHERS
                       PROJECTS ACTIVITIES NEWS GALLERY FACILITIES CONTACT }
enum AuditAction     { CREATE UPDATE DELETE LOGIN LOGOUT PUBLISH UNPUBLISH RESTORE }
enum BackupType      { DATABASE  MEDIA  FULL }
enum BackupStatus    { PENDING  RUNNING  SUCCESS  FAILED }
```

### 5.4 ตัวอย่าง `homepage_sections.config` (JSONB)

```jsonc
// type = "HERO"
{
  "badge": "แผนกวิชาเทคโนโลยีคอมพิวเตอร์",
  "heading": "สร้างทักษะดิจิทัล สร้างนวัตกรรม สร้างอนาคต",
  "subheading": "วิทยาลัยเทคนิคร้อยเอ็ด",
  "primaryCta":   { "label": "ดูหลักสูตร",   "href": "/programs" },
  "secondaryCta": { "label": "เกี่ยวกับแผนก", "href": "/about" },
  "backgroundImageId": "cm2x...",
  "showGrid": true, "showGlow": true
}

// type = "NEWS"
{ "limit": 3, "categoryId": null, "layout": "grid", "showViewAll": true }
```

> ใช้ JSONB ทำให้เพิ่ม field ใน section ได้โดยไม่ต้อง migrate ตาราง
> แต่ยังคง validate ด้วย Zod discriminated union ตาม `type` ทุกครั้งที่บันทึก

---

## 6. API ARCHITECTURE

### 6.1 Base & Convention

```
Base URL:  /api/v1
Auth:      Cookie  sid=<httpOnly; Secure; SameSite=Lax>
Format:    application/json
```

**Response Envelope (สำเร็จ)**
```json
{
  "success": true,
  "data": { },
  "meta": { "page": 1, "limit": 12, "total": 48, "totalPages": 4 }
}
```

**Response Envelope (ผิดพลาด)**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "ข้อมูลไม่ถูกต้อง",
    "fields": { "title": "กรุณากรอกหัวข้อข่าว" }
  },
  "requestId": "req_01H..."
}
```

### 6.2 Error Code มาตรฐาน

| HTTP | code | ความหมาย |
|---|---|---|
| 400 | `BAD_REQUEST` | รูปแบบ request ผิด |
| 401 | `UNAUTHORIZED` | ยังไม่ได้เข้าสู่ระบบ / session หมดอายุ |
| 403 | `FORBIDDEN` | เข้าสู่ระบบแล้วแต่ไม่มีสิทธิ์ |
| 404 | `NOT_FOUND` | ไม่พบข้อมูล |
| 409 | `CONFLICT` | ข้อมูลซ้ำ (slug/code/email) |
| 413 | `PAYLOAD_TOO_LARGE` | ไฟล์เกิน 5MB |
| 422 | `VALIDATION_ERROR` | Zod ไม่ผ่าน |
| 429 | `TOO_MANY_REQUESTS` | เกิน rate limit |
| 500 | `INTERNAL_ERROR` | ข้อผิดพลาดภายใน (log เต็ม ส่ง client แค่ข้อความกลาง) |

### 6.3 Query Parameter มาตรฐาน (ทุก List Endpoint)

| Param | ตัวอย่าง | คำอธิบาย |
|---|---|---|
| `page` | `1` | เริ่มที่ 1 |
| `limit` | `12` | สูงสุด 100 |
| `search` | `ปวส` | ค้นหาใน field ที่กำหนด (case-insensitive) |
| `sort` | `-publishedAt` | `-` นำหน้า = DESC |
| `status` | `PUBLISHED` | filter ตาม enum |
| `categoryId` | `cm2x...` | filter ตาม relation |
| `from` / `to` | `2026-01-01` | ช่วงวันที่ |

### 6.4 Endpoint Map

**Auth**
```
POST   /api/v1/auth/login          เข้าสู่ระบบ (rate limit 5/15min)
POST   /api/v1/auth/logout         ออกจากระบบ (ทำลาย session)
GET    /api/v1/auth/me             ข้อมูลผู้ใช้ปัจจุบัน + permissions
PATCH  /api/v1/auth/password       เปลี่ยนรหัสผ่าน (ต้องใส่รหัสเดิม)
```

**Content (รูปแบบเดียวกันทุก entity)** — `news`, `activities`, `projects`, `courses`, `programs`, `teachers`, `students`, `facilities`, `albums`, `categories`
```
GET    /api/v1/news                รายการ (public เห็นเฉพาะ PUBLISHED)
GET    /api/v1/news/:slug          รายละเอียด + เพิ่ม views
POST   /api/v1/news                สร้าง            [auth + news:create]
PUT    /api/v1/news/:id            แก้ไข            [auth + news:update]
DELETE /api/v1/news/:id            Soft delete      [auth + news:delete]
PATCH  /api/v1/news/:id/status     เปลี่ยน workflow [auth + news:publish]
GET    /api/v1/news/:id/versions   ประวัติเวอร์ชัน
POST   /api/v1/news/:id/restore/:v กู้คืนเวอร์ชัน
```

**Site Configuration**
```
GET    /api/v1/homepage/sections           section ที่ visible (public)
GET    /api/v1/admin/homepage/sections     ทั้งหมด รวมที่ซ่อน
PUT    /api/v1/admin/homepage/sections/:id แก้ไข config
PATCH  /api/v1/admin/homepage/reorder      { items:[{id,order}] }  ← Drag&Drop
POST   /api/v1/admin/homepage/sections/:id/duplicate
GET    /api/v1/navigation?location=HEADER
PATCH  /api/v1/admin/navigation/reorder
GET    /api/v1/settings                    footer/contact/social (public)
PUT    /api/v1/admin/settings/:key
GET    /api/v1/seo?path=/news
```

**Media**
```
POST   /api/v1/admin/media/upload          multipart, สูงสุด 10 ไฟล์
GET    /api/v1/admin/media                 search/filter/pagination
DELETE /api/v1/admin/media/:id             ตรวจ reference ก่อนลบ
```

**System**
```
GET    /api/v1/search?q=...                Global search — group ตามประเภท
POST   /api/v1/contact                     ส่งข้อความ (rate limit 3/hour)
GET    /api/v1/admin/dashboard/stats       การ์ดสถิติ + chart
GET    /api/v1/admin/notifications
PATCH  /api/v1/admin/notifications/:id/read
GET    /api/v1/admin/audit-logs            filter user/action/entity/date
GET    /api/v1/admin/backups
POST   /api/v1/admin/backups               Backup Now   [SUPER_ADMIN]
POST   /api/v1/admin/backups/:id/restore   Restore      [SUPER_ADMIN]
GET    /api/v1/health                      { status, db, uptime }
GET    /sitemap.xml   GET /robots.txt
```

### 6.5 Global Search — รูปแบบผลลัพธ์

```json
{
  "success": true,
  "data": {
    "query": "เครือข่าย",
    "total": 14,
    "groups": [
      { "type": "news",     "label": "ข่าวประชาสัมพันธ์", "count": 5, "items": [...] },
      { "type": "courses",  "label": "รายวิชา",          "count": 4, "items": [...] },
      { "type": "teachers", "label": "บุคลากร",          "count": 2, "items": [...] }
    ]
  }
}
```

---

## 7. FRONTEND SITEMAP (Public Website)

```
/                        หน้าแรก — ประกอบจาก homepage_sections ตามลำดับใน DB
│                        Hero · Statistics · About · Programs · Courses
│                        Teachers · Projects · Activities · News · Gallery
│                        Facilities · Contact
│
├── /about               เกี่ยวกับแผนก — ประวัติ วิสัยทัศน์ พันธกิจ จุดเด่น เป้าหมาย
├── /programs            หลักสูตร ปวช. / ปวส.
│   └── /programs/:code  รายละเอียดหลักสูตร + รายวิชาในหลักสูตร
├── /courses             รายวิชา — search / filter / sort / pagination
│   └── /courses/:code   รายละเอียดวิชา + ผู้สอน
├── /teachers            บุคลากร — filter: หัวหน้าแผนก / อาจารย์ / บุคลากร
│   └── /teachers/:id    ประวัติ ความเชี่ยวชาญ ช่องทางติดต่อ
├── /students            นักเรียน นักศึกษา — ผลงาน รางวัล การแข่งขัน
├── /projects            ผลงานนักศึกษา — filter ปี / ประเภท / เทคโนโลยี
│   └── /projects/:slug  รายละเอียด + ทีม + Demo/GitHub
├── /activities          กิจกรรม — filter ประเภท / ช่วงเวลา
│   └── /activities/:slug
├── /news                ข่าวประชาสัมพันธ์ — filter หมวด / ค้นหา
│   └── /news/:slug      เนื้อหาข่าว + นับ views + ข่าวที่เกี่ยวข้อง
├── /facilities          ห้องปฏิบัติการ — Computer/Network/IoT/AI/Multimedia Lab
│   └── /facilities/:slug
├── /gallery             อัลบั้มภาพ
│   └── /gallery/:slug   Lightbox — zoom / next / prev / keyboard
├── /contact             ข้อมูลติดต่อ + แผนที่ + ฟอร์มติดต่อ
├── /search?q=           ผลการค้นหาทั่วเว็บไซต์ (group ตามประเภท)
└── /404                 ไม่พบหน้า
```

**Navigation**
- Desktop: Top Navigation แบบ sticky + glassmorphism (blur เพิ่มเมื่อ scroll)
- Mobile: Hamburger → Drawer เต็มจอ + Bottom Navigation 5 ปุ่มหลัก
- เมนูทั้งหมดอ่านจาก `navigation_items` — Admin แก้ได้โดยไม่แตะโค้ด

---

## 8. ADMIN SITEMAP

```
/admin/login                       เข้าสู่ระบบ (ไม่มี layout sidebar)
│
/admin                             ── Dashboard ──
│   การ์ดสถิติ · กราฟผู้เข้าชม · ข่าวล่าสุด · กิจกรรมล่าสุด · สถานะระบบ
│
├── /admin/homepage                Homepage Builder — Drag & Drop section
│   └── /admin/homepage/:id        แก้ไข config ของ section + Live Preview
├── /admin/navigation              จัดการเมนู Header/Footer — Drag & Drop
│
├── /admin/teachers                รายการบุคลากร
│   ├── /admin/teachers/new
│   └── /admin/teachers/:id/edit
├── /admin/programs                (list / new / :id/edit)
├── /admin/courses                 (list / new / :id/edit)
├── /admin/students                (list / new / :id/edit)
├── /admin/projects                (list / new / :id/edit)
├── /admin/activities              (list / new / :id/edit)
├── /admin/news                    (list / new / :id/edit)
│   └── /admin/news/:id/versions   ประวัติเวอร์ชัน + เปรียบเทียบ + กู้คืน
├── /admin/facilities              (list / new / :id/edit)
├── /admin/gallery                 จัดการอัลบั้ม
│   └── /admin/gallery/:id         อัปโหลดหลายภาพ + จัดลำดับ
├── /admin/media                   Media Library — grid / search / copy URL
├── /admin/messages                ข้อความจากฟอร์มติดต่อ
│
├── /admin/users                   ผู้ใช้งาน + บทบาท        [SUPER_ADMIN]
├── /admin/notifications           ศูนย์การแจ้งเตือน
├── /admin/audit-logs              บันทึกการใช้งาน          [SUPER_ADMIN, ADMIN]
├── /admin/backups                 สำรอง / กู้คืนข้อมูล      [SUPER_ADMIN]
├── /admin/seo                     SEO ต่อหน้า + robots/sitemap
└── /admin/settings                ตั้งค่าเว็บไซต์ / Footer / Social / ติดต่อ
```

**Preview Flow**
```
แก้ไขเนื้อหา → [บันทึกฉบับร่าง] → [ดูตัวอย่าง] → เปิด /preview/news/:id?token=...
                                                  (แสดงหน้าจริง มีแถบ "โหมดตัวอย่าง")
                                                  → [เผยแพร่]
```

---

## 9. CRUD MATRIX (RBAC)

### 9.1 สิทธิ์ตามบทบาท

| Entity / ฟีเจอร์ | SUPER_ADMIN | ADMIN | EDITOR |
|---|:---:|:---:|:---:|
| **News** | C R U D P | C R U D P | C R U **‡** |
| **Activities** | C R U D P | C R U D P | C R U **‡** |
| **Projects** | C R U D P | C R U D P | C R U **‡** |
| **Gallery / Albums** | C R U D | C R U D | C R U |
| **Media Library** | C R U D | C R U D | C R **U*** |
| **Teachers** | C R U D | C R U D | R |
| **Students** | C R U D | C R U D | R |
| **Programs** | C R U D | C R U D | R |
| **Courses** | C R U D | C R U D | R |
| **Facilities** | C R U D | C R U D | R |
| **Categories** | C R U D | C R U D | R |
| **Homepage Builder** | C R U D | — R U — | R |
| **Navigation** | C R U D | — R U — | R |
| **Site Settings / Footer** | C R U D | — R U — | — |
| **SEO** | C R U D | — R U — | — |
| **Contact Messages** | R U D | R U D | R |
| **Users & Roles** | C R U D | — | — |
| **Audit Logs** | R | R | — |
| **Backups / Restore** | C R D + Restore | R | — |
| **Notifications** | R U | R U | R U |

```
C = Create   R = Read   U = Update   D = Delete   P = Publish/Unpublish
‡ = แก้ไขได้เฉพาะสถานะ DRAFT / REVIEW และเฉพาะเนื้อหาที่ตนเองสร้าง
    ส่งเข้า REVIEW ได้ แต่ Publish เองไม่ได้
* = ลบได้เฉพาะไฟล์ที่ตนเองอัปโหลด และต้องไม่ถูกอ้างถึงที่อื่น
```

### 9.2 Permission Key (เก็บในตาราง `permissions`)

```
news:create      news:read      news:update      news:delete      news:publish
activity:*       project:*      gallery:*        media:*
teacher:*        student:*      program:*        course:*         facility:*
homepage:read    homepage:update   navigation:update
settings:update  seo:update     message:read     message:delete
user:manage      audit:read     backup:manage
```

### 9.3 Content Workflow ตามบทบาท

```
   ┌────────┐  EDITOR/ADMIN   ┌────────┐  ADMIN+     ┌──────────┐
   │ DRAFT  │────────────────▶│ REVIEW │────────────▶│ APPROVED │
   └────────┘                 └────┬───┘             └─────┬────┘
        ▲                          │ ADMIN+ ตีกลับ         │ ADMIN+
        └──────────────────────────┘                       ▼
                                                    ┌───────────┐
   ┌──────────┐      ADMIN+ (unpublish)             │ PUBLISHED │
   │ ARCHIVED │◀───────────────────────────────────▶└───────────┘
   └──────────┘      ADMIN+ (archive)
```

**กฎที่บังคับใช้ที่ Backend (ไม่ใช่แค่ซ่อนปุ่ม)**
1. EDITOR เปลี่ยนสถานะเป็น `APPROVED` / `PUBLISHED` ไม่ได้ → 403
2. EDITOR แก้ไขเนื้อหาที่สถานะ `PUBLISHED` / `ARCHIVED` ไม่ได้ → 403
3. เนื้อหาที่ `PUBLISHED` เท่านั้นที่ปรากฏบน Public API
4. ทุกการเปลี่ยนสถานะสร้าง `audit_log` + `content_version` ในทรานแซกชันเดียวกัน

---

## 10. CIA ARCHITECTURE

### 10.1 CONFIDENTIALITY — การรักษาความลับ

| มาตรการ | การนำไปใช้ |
|---|---|
| **Password Hashing** | Argon2id (memoryCost 19MiB, timeCost 2, parallelism 1) — ไม่มี plain text ใน DB/log |
| **Session Security** | `httpOnly` + `secure` (prod) + `sameSite=lax`, เก็บใน PostgreSQL, TTL 8 ชม., rolling |
| **Session Rotation** | สร้าง session id ใหม่ทันทีหลัง login สำเร็จ (กัน session fixation) |
| **RBAC ที่ Backend** | ทุก route มี `requirePermission('...')` — Frontend ซ่อนปุ่มเป็นเพียง UX |
| **Brute-force Protection** | `failedLoginCount` ≥ 5 → `lockedUntil` +15 นาที + rate limit 5 req/15min ต่อ IP |
| **Security Headers** | Helmet: CSP, X-Frame-Options DENY, HSTS, nosniff, Referrer-Policy |
| **CORS** | Whitelist เฉพาะโดเมน frontend จาก `.env` + `credentials: true` |
| **CSRF** | Double-submit token ทุก request ที่เปลี่ยนข้อมูล |
| **Data Minimization** | API ไม่ส่ง `passwordHash`, อีเมล/เบอร์ภายในออก public endpoint |
| **Upload Safety** | ตรวจ magic bytes ไม่ใช่แค่นามสกุล, re-encode ด้วย Sharp, เปลี่ยนชื่อไฟล์เป็น UUID, ตั้ง `Content-Disposition` |
| **Secret Management** | ทุก secret อยู่ใน `.env` เท่านั้น — `.env.example` เก็บเฉพาะ key ว่าง |

### 10.2 INTEGRITY — ความถูกต้องของข้อมูล

| มาตรการ | การนำไปใช้ |
|---|---|
| **Input Validation** | Zod ทุก endpoint (body/query/params) — reject ก่อนถึง service |
| **Sanitization** | HTML จาก rich editor ผ่าน DOMPurify ก่อนบันทึก (กัน stored XSS) |
| **DB Constraints** | `@unique` (email, slug, code), FK `onDelete: Restrict/SetNull/Cascade`, `NOT NULL`, CHECK |
| **Transaction** | `prisma.$transaction` ครอบทุกงานที่แตะหลายตาราง (update + version + audit) |
| **Optimistic Locking** | ส่ง `updatedAt` เดิมกลับมา — ถ้าไม่ตรง → 409 CONFLICT (กันแก้ทับกัน) |
| **Audit Trail** | บันทึก user / action / entity / entityId / changes (before-after diff) / IP / UA / timestamp |
| **Version History** | Snapshot JSONB ทุกครั้งที่แก้ไข — ดู / เปรียบเทียบ / กู้คืนได้ |
| **Soft Delete** | `deletedAt` + query filter กลาง — ข้อมูลไม่หายถาวรจากการกดผิด |
| **Traceability** | `createdById` / `updatedById` ทุกตารางเนื้อหา |

### 10.3 AVAILABILITY — ความพร้อมใช้งาน

| มาตรการ | การนำไปใช้ |
|---|---|
| **Global Error Handler** | จับ error ทุกชนิด → log เต็มฝั่ง server, ส่ง client เฉพาะ code + ข้อความสุภาพ |
| **No Stack Trace to Client** | `NODE_ENV=production` ตัด `stack` ออกจาก response เสมอ |
| **Retry & Timeout** | TanStack Query retry 2 ครั้ง (exponential backoff), Axios timeout 15s |
| **Caching** | Public GET cache ในหน่วยความจำ TTL 60s + `ETag` / `Cache-Control` |
| **Pagination บังคับ** | ทุก list endpoint จำกัด `limit` ≤ 100 — ไม่มี unbounded query |
| **Database Index** | Index ทุก FK, `status+publishedAt`, `deletedAt`, `slug`, `createdAt` |
| **Connection Pool** | Prisma pool + `connect_timeout` — ไม่ให้ connection leak |
| **Image Optimization** | Sharp → WebP + thumbnail 3 ขนาด, `loading="lazy"`, `width/height` กัน CLS |
| **Code Splitting** | `React.lazy` แยก public / admin bundle — หน้าแรกโหลดเฉพาะที่ใช้ |
| **Graceful Degradation** | ทุกหน้ามี `<Skeleton>` ระหว่างโหลด และ `<ErrorState onRetry>` เมื่อล้มเหลว |
| **Health Check** | `GET /api/v1/health` → ตรวจ DB ping + uptime สำหรับ monitoring/uptime robot |
| **Graceful Shutdown** | `SIGTERM` → หยุดรับ request ใหม่ → ปิด Prisma → exit |
| **Backup** | `pg_dump` + tar ของ `/uploads` — ตั้งเวลา + กดสำรองเองได้ + Restore |
| **Rate Limiting** | ป้องกัน DoS ระดับ application ทุก endpoint สาธารณะ |

### 10.4 Threat Model สรุป

| ภัยคุกคาม | การป้องกัน |
|---|---|
| SQL Injection | Prisma parameterized query — ไม่มี raw SQL ที่รับ input ตรง |
| XSS (Stored/Reflected) | DOMPurify + React escape + CSP |
| CSRF | SameSite cookie + CSRF token |
| Session Hijacking | httpOnly + Secure + rotation + HTTPS |
| Broken Access Control | RBAC ตรวจที่ backend ทุก route + ตรวจ ownership ระดับ record |
| Brute Force | Rate limit + account lockout |
| Malicious Upload | Magic bytes + re-encode + ไม่ execute + ชื่อไฟล์สุ่ม |
| Sensitive Data Exposure | Response DTO คัดเฉพาะ field ที่อนุญาต |
| Insufficient Logging | Audit log ทุก action สำคัญ + Pino structured log |

---

## ภาคผนวก — ลำดับการพัฒนา

| Phase | งาน | สถานะ |
|---|---|:---:|
| 0 | Architecture Document | ✅ |
| 1 | Project Setup + Design System + UI Preview | ✅ |
| 2 | Database + Prisma Schema + Seed | ✅ |
| 3 | Backend REST API | ⏳ |
| 4 | Authentication + RBAC | ⏳ |
| 5 | CRUD ทุก Entity | ⏳ |
| 6 | Media Library | ⏳ |
| 7 | CMS (Settings / Navigation / Footer / SEO) | ⏳ |
| 8 | Homepage Builder + Section Builder | ⏳ |
| 9 | Public Website | ⏳ |
| 10 | Admin Dashboard | ⏳ |
| 11 | Animation + Motion Design | ⏳ |
| 12 | CIA Security Hardening | ⏳ |
| 13 | Audit Log | ⏳ |
| 14 | Backup / Restore | ⏳ |
| 15 | SEO + sitemap + robots | ⏳ |
| 16 | Testing | ⏳ |
| 17 | Performance | ⏳ |
| 18 | Deployment | ⏳ |
