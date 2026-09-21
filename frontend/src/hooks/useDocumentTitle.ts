import { useEffect } from 'react';

const SITE = 'แผนกวิชาเทคโนโลยีคอมพิวเตอร์ วิทยาลัยเทคนิคร้อยเอ็ด';

/** ตั้งชื่อหน้าเว็บใน tab ของเบราว์เซอร์ตามหน้าที่กำลังดู */
export function useDocumentTitle(title?: string): void {
  useEffect(() => {
    document.title = title ? `${title} · ${SITE}` : SITE;
  }, [title]);
}
