import type { NavigationItem } from '@/types';

/** เมนูสำรอง — ใช้เมื่อยังโหลดจาก API ไม่สำเร็จ เพื่อให้เว็บใช้งานได้เสมอ */
export const FALLBACK_NAV: NavigationItem[] = [
  { id: 'n1', label: 'หน้าแรก', href: '/', order: 1 },
  { id: 'n2', label: 'เกี่ยวกับแผนก', href: '/about', order: 2 },
  { id: 'n3', label: 'หลักสูตร', href: '/programs', order: 3 },
  { id: 'n4', label: 'รายวิชา', href: '/courses', order: 4 },
  { id: 'n5', label: 'บุคลากร', href: '/teachers', order: 5 },
  { id: 'n6', label: 'ผลงาน', href: '/projects', order: 6 },
  { id: 'n7', label: 'กิจกรรม', href: '/activities', order: 7 },
  { id: 'n8', label: 'ข่าวสาร', href: '/news', order: 8 },
  { id: 'n9', label: 'ห้องปฏิบัติการ', href: '/facilities', order: 9 },
  { id: 'n10', label: 'คลังภาพ', href: '/gallery', order: 10 },
  { id: 'n11', label: 'ติดต่อ', href: '/contact', order: 11 },
];

export const SITE_NAME = 'เทคโนโลยีคอมพิวเตอร์';
export const COLLEGE_NAME = 'วิทยาลัยเทคนิคร้อยเอ็ด';
