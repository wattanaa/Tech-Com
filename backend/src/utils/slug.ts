/**
 * สร้าง slug สำหรับ URL
 *
 * ภาษาไทยไม่มีช่องว่างระหว่างคำและไม่มีรูปแบบถอดเป็นอักษรโรมันที่ตายตัว
 * จึงเก็บอักษรไทยไว้ตามเดิมแล้วให้เบราว์เซอร์เข้ารหัสเอง (percent-encoding)
 * ซึ่งอ่านออกและแชร์ได้ตามปกติ ดีกว่าถอดเสียงแบบเดาที่ได้ผลลัพธ์ไม่แน่นอน
 */
const THAI_RANGE = '฀-๿';

export function slugify(input: string): string {
  return input
    .normalize('NFC')
    .toLowerCase()
    .trim()
    // ตัดวรรณยุกต์ไทยออกเพื่อให้ slug นิ่ง ไม่เปลี่ยนตามการพิมพ์
    .replace(/[็-๎]/g, '')
    .replace(new RegExp(`[^a-z0-9${THAI_RANGE}\\s-]`, 'g'), '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120);
}

/**
 * หา slug ที่ยังไม่ถูกใช้ โดยต่อท้ายด้วย -2 -3 ไปเรื่อย ๆ
 * isTaken ให้ service ส่งเข้ามา เพื่อให้ไฟล์นี้ไม่ต้องรู้จัก Prisma
 */
export async function uniqueSlug(
  base: string,
  isTaken: (slug: string) => Promise<boolean>,
): Promise<string> {
  const root = slugify(base) || 'item';
  let candidate = root;
  let suffix = 1;

  while (await isTaken(candidate)) {
    suffix += 1;
    candidate = `${root}-${suffix}`;
    if (suffix > 200) {
      // กันวนไม่รู้จบในกรณีผิดปกติ
      candidate = `${root}-${Date.now()}`;
      break;
    }
  }
  return candidate;
}
