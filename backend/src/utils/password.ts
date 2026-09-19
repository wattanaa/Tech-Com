import argon2 from 'argon2';

/**
 * พารามิเตอร์ตามคำแนะนำ OWASP Password Storage Cheat Sheet สำหรับ Argon2id
 * memoryCost 19 MiB ทำให้การไล่เดารหัสด้วย GPU แพงขึ้นมาก
 * ขณะที่ผู้ใช้จริงรอเพียงเสี้ยววินาทีต่อการล็อกอินหนึ่งครั้ง
 */
const OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} as const;

export function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, OPTIONS);
}

/**
 * ตรวจรหัสผ่าน — คืน false แทนการโยน error เมื่อ hash เสีย
 * เพื่อไม่ให้ข้อความผิดพลาดบอกใบ้ว่าบัญชีนั้นมีอยู่จริงหรือไม่
 */
export async function verifyPassword(hash: string, plain: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain);
  } catch {
    return false;
  }
}

/** ตรวจว่า hash เก่าควรอัปเกรดพารามิเตอร์หรือยัง — เรียกหลังล็อกอินสำเร็จ */
export function needsRehash(hash: string): boolean {
  try {
    return argon2.needsRehash(hash, OPTIONS);
  } catch {
    return false;
  }
}
