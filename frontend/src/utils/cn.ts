/** รวม class name โดยข้ามค่า falsy — ใช้แทน clsx เพื่อไม่เพิ่ม dependency */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
