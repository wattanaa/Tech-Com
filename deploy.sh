#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════
#  deploy.sh — ตั้งค่าและ deploy TCOM ด้วยคำสั่งเดียว
#
#    ./deploy.sh
#
#  สคริปต์นี้จะ:
#   1. สร้างไฟล์ .env จากตัวอย่างให้ ถ้ายังไม่มี
#   2. สุ่ม SESSION_SECRET ให้อัตโนมัติ
#   3. ถามรหัสผ่านฐานข้อมูลและรหัสผู้ดูแล ถ้ายังไม่ได้ตั้ง
#   4. build และเปิดระบบทั้งหมดด้วย Docker Compose
# ════════════════════════════════════════════════════════════════
set -euo pipefail
cd "$(dirname "$0")"

green() { printf '\033[0;32m%s\033[0m\n' "$1"; }
yellow() { printf '\033[0;33m%s\033[0m\n' "$1"; }
red() { printf '\033[0;31m%s\033[0m\n' "$1"; }

# ── ตรวจว่ามี Docker ──
if ! command -v docker >/dev/null 2>&1; then
  red "ไม่พบ Docker — กรุณาติดตั้ง Docker ก่อน: https://docs.docker.com/get-docker/"
  exit 1
fi
if ! docker compose version >/dev/null 2>&1; then
  red "ไม่พบ Docker Compose (v2) — กรุณาอัปเดต Docker ให้เป็นเวอร์ชันล่าสุด"
  exit 1
fi

# ── ฟังก์ชันช่วยตั้งค่าใน .env ──
set_env() {
  local key="$1" value="$2"
  if grep -q "^${key}=" .env; then
    # ใช้ | เป็นตัวคั่นกัน / ในค่าชนกับ sed
    sed -i.bak "s|^${key}=.*|${key}=${value}|" .env && rm -f .env.bak
  else
    printf '%s=%s\n' "$key" "$value" >>.env
  fi
}
get_env() { grep -m1 "^$1=" .env 2>/dev/null | cut -d= -f2- || true; }

# ── สร้าง .env ถ้ายังไม่มี ──
if [ ! -f .env ]; then
  cp .env.prod.example .env
  green "สร้างไฟล์ .env จากตัวอย่างแล้ว"
fi

# ── สุ่ม SESSION_SECRET ถ้ายังว่าง ──
if [ -z "$(get_env SESSION_SECRET)" ]; then
  SECRET="$(openssl rand -hex 48 2>/dev/null || head -c48 /dev/urandom | od -An -tx1 | tr -d ' \n')"
  set_env SESSION_SECRET "$SECRET"
  green "สุ่ม SESSION_SECRET ให้อัตโนมัติแล้ว"
fi

# ── รหัสผ่านฐานข้อมูล ──
DBPASS="$(get_env POSTGRES_PASSWORD)"
if [ -z "$DBPASS" ] || [ "$DBPASS" = "เปลี่ยนรหัสผ่านนี้ให้ปลอดภัย" ]; then
  DBPASS="$(openssl rand -hex 16 2>/dev/null || date +%s | sha256sum | head -c32)"
  set_env POSTGRES_PASSWORD "$DBPASS"
  green "สุ่มรหัสผ่านฐานข้อมูลให้อัตโนมัติแล้ว"
fi

# ── รหัสผู้ดูแลระบบ ──
if [ -z "$(get_env SEED_ADMIN_PASSWORD)" ]; then
  yellow "ยังไม่ได้ตั้งรหัสผ่านผู้ดูแลระบบ (ต้องยาวอย่างน้อย 12 ตัวอักษร)"
  while :; do
    printf "  กรอกรหัสผ่านผู้ดูแล: "
    read -r ADMINPASS
    if [ "${#ADMINPASS}" -ge 12 ]; then break; fi
    red "  สั้นเกินไป ต้องอย่างน้อย 12 ตัวอักษร"
  done
  set_env SEED_ADMIN_PASSWORD "$ADMINPASS"
  green "บันทึกรหัสผ่านผู้ดูแลแล้ว"
fi

# ── build และเปิดระบบ ──
green "\n▸ กำลัง build และเปิดระบบทั้งหมด (ครั้งแรกอาจใช้เวลาหลายนาที)..."
docker compose -f docker-compose.prod.yml up -d --build

WEB_PORT="$(get_env WEB_PORT)"; WEB_PORT="${WEB_PORT:-80}"
green "\n✓ เปิดระบบเรียบร้อย"
echo   "  เว็บไซต์:  http://localhost:${WEB_PORT}/"
echo   "  ผู้ดูแล:   $(get_env SEED_ADMIN_EMAIL)"
echo   ""
echo   "  ดู log:    docker compose -f docker-compose.prod.yml logs -f"
echo   "  ปิดระบบ:   docker compose -f docker-compose.prod.yml down"
yellow "  อย่าลืมเปลี่ยนรหัสผ่านผู้ดูแลหลังเข้าระบบครั้งแรก"
