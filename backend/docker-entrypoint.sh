#!/bin/sh
# ────────────────────────────────────────────────────────────
#  ENTRYPOINT ของ Backend Container
#  ทำงานทุกครั้งที่ container เริ่ม: สร้าง/อัปเดตตาราง → seed → เริ่มเซิร์ฟเวอร์
#  ทั้งหมดเป็น idempotent จึงรันซ้ำได้อย่างปลอดภัย
# ────────────────────────────────────────────────────────────
set -e

echo "▸ รอฐานข้อมูลพร้อมและสร้างตารางจาก schema..."
# db push สร้างตารางจาก schema.prisma โดยตรง — เหมาะกับการ deploy ครั้งแรกที่ยังไม่มี migration
# ลองซ้ำได้สูงสุด 10 ครั้ง เผื่อฐานข้อมูลยังไม่พร้อมตอน container เพิ่งขึ้น
n=0
until npx prisma db push --skip-generate; do
  n=$((n + 1))
  if [ "$n" -ge 10 ]; then
    echo "❌ เชื่อมต่อฐานข้อมูลไม่สำเร็จหลังลอง 10 ครั้ง — ตรวจ DATABASE_URL"
    exit 1
  fi
  echo "  ...ฐานข้อมูลยังไม่พร้อม ลองใหม่ในอีก 3 วินาที ($n/10)"
  sleep 3
done

# SEED_MODE: core (ค่าเริ่มต้น) = เฉพาะข้อมูลแกนระบบ · demo = รวมข้อมูลตัวอย่าง · none = ไม่ seed
case "${SEED_MODE:-core}" in
  none)
    echo "▸ ข้ามการ seed (SEED_MODE=none)"
    ;;
  demo)
    echo "▸ seed ข้อมูลแกนระบบ + ข้อมูลตัวอย่าง"
    npx tsx prisma/seed.ts
    ;;
  *)
    echo "▸ seed เฉพาะข้อมูลแกนระบบ"
    npx tsx prisma/seed.ts --core-only
    ;;
esac

echo "▸ เริ่มเซิร์ฟเวอร์ TCOM API"
exec node dist/server.js
