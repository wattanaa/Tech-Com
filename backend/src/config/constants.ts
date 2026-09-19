/**
 * ค่าคงที่กลางของระบบ — permission, workflow, pagination
 * ทุกที่ที่ต้องอ้างถึงสิทธิ์ให้ import จากไฟล์นี้ ห้ามพิมพ์สตริงเอง
 */

export const PERMISSION_GROUPS = [
  'news',
  'activity',
  'project',
  'gallery',
  'media',
  'teacher',
  'student',
  'program',
  'course',
  'facility',
  'homepage',
  'navigation',
  'settings',
  'seo',
  'message',
  'user',
  'audit',
  'backup',
] as const;

export type PermissionGroup = (typeof PERMISSION_GROUPS)[number];

/** รายการสิทธิ์ทั้งหมดในระบบ พร้อมชื่อภาษาไทยสำหรับแสดงในหน้าจัดการผู้ใช้ */
export const PERMISSIONS: Record<string, string> = {
  'news:create': 'เพิ่มข่าว',
  'news:read': 'ดูข่าว',
  'news:update': 'แก้ไขข่าว',
  'news:delete': 'ลบข่าว',
  'news:publish': 'เผยแพร่ข่าว',

  'activity:create': 'เพิ่มกิจกรรม',
  'activity:read': 'ดูกิจกรรม',
  'activity:update': 'แก้ไขกิจกรรม',
  'activity:delete': 'ลบกิจกรรม',
  'activity:publish': 'เผยแพร่กิจกรรม',

  'project:create': 'เพิ่มผลงาน',
  'project:read': 'ดูผลงาน',
  'project:update': 'แก้ไขผลงาน',
  'project:delete': 'ลบผลงาน',
  'project:publish': 'เผยแพร่ผลงาน',

  'gallery:create': 'เพิ่มอัลบั้มภาพ',
  'gallery:read': 'ดูคลังภาพ',
  'gallery:update': 'แก้ไขคลังภาพ',
  'gallery:delete': 'ลบภาพ',

  'media:create': 'อัปโหลดไฟล์',
  'media:read': 'ดูคลังไฟล์',
  'media:update': 'แก้ไขข้อมูลไฟล์',
  'media:delete': 'ลบไฟล์',

  'teacher:create': 'เพิ่มบุคลากร',
  'teacher:read': 'ดูบุคลากร',
  'teacher:update': 'แก้ไขบุคลากร',
  'teacher:delete': 'ลบบุคลากร',

  'student:create': 'เพิ่มนักศึกษา',
  'student:read': 'ดูนักศึกษา',
  'student:update': 'แก้ไขนักศึกษา',
  'student:delete': 'ลบนักศึกษา',

  'program:create': 'เพิ่มหลักสูตร',
  'program:read': 'ดูหลักสูตร',
  'program:update': 'แก้ไขหลักสูตร',
  'program:delete': 'ลบหลักสูตร',

  'course:create': 'เพิ่มรายวิชา',
  'course:read': 'ดูรายวิชา',
  'course:update': 'แก้ไขรายวิชา',
  'course:delete': 'ลบรายวิชา',

  'facility:create': 'เพิ่มห้องปฏิบัติการ',
  'facility:read': 'ดูห้องปฏิบัติการ',
  'facility:update': 'แก้ไขห้องปฏิบัติการ',
  'facility:delete': 'ลบห้องปฏิบัติการ',

  'homepage:read': 'ดูการจัดวางหน้าแรก',
  'homepage:update': 'จัดวางหน้าแรก',
  'navigation:update': 'จัดการเมนู',
  'settings:update': 'แก้ไขตั้งค่าเว็บไซต์',
  'seo:update': 'แก้ไข SEO',

  'message:read': 'ดูข้อความติดต่อ',
  'message:delete': 'ลบข้อความติดต่อ',

  'user:manage': 'จัดการผู้ใช้งานและสิทธิ์',
  'audit:read': 'ดูบันทึกการใช้งาน',
  'backup:manage': 'สำรองและกู้คืนข้อมูล',
};

export const ROLE_LEVEL = {
  EDITOR: 10,
  ADMIN: 50,
  SUPER_ADMIN: 100,
} as const;

/** สิทธิ์ของ EDITOR — เนื้อหาที่สร้างเองเท่านั้น และเผยแพร่เองไม่ได้ */
export const EDITOR_PERMISSIONS = [
  'news:create', 'news:read', 'news:update',
  'activity:create', 'activity:read', 'activity:update',
  'project:create', 'project:read', 'project:update',
  'gallery:create', 'gallery:read', 'gallery:update',
  'media:create', 'media:read', 'media:update',
  'teacher:read', 'student:read', 'program:read', 'course:read',
  'facility:read', 'homepage:read', 'message:read',
];

/** สิทธิ์ของ ADMIN — จัดการเนื้อหาได้ทั้งหมด แต่ไม่แตะผู้ใช้/สำรองข้อมูล */
export const ADMIN_EXCLUDED_PERMISSIONS = ['user:manage', 'backup:manage'];

/** เส้นทางที่อนุญาตของ Content Workflow — ใช้ตรวจที่ service ทุกครั้งก่อนเปลี่ยนสถานะ */
export const WORKFLOW_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['REVIEW', 'ARCHIVED'],
  REVIEW: ['DRAFT', 'APPROVED'],
  APPROVED: ['REVIEW', 'PUBLISHED'],
  PUBLISHED: ['ARCHIVED'],
  ARCHIVED: ['DRAFT', 'PUBLISHED'],
};

/** สถานะที่ EDITOR แก้ไขเนื้อหาได้ */
export const EDITOR_EDITABLE_STATUSES = ['DRAFT', 'REVIEW'];

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 12,
  MAX_LIMIT: 100,
} as const;

export const ACCOUNT_LOCK = {
  MAX_FAILED_ATTEMPTS: 5,
  LOCK_MINUTES: 15,
} as const;
