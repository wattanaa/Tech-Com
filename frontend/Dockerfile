# ────────────────────────────────────────────────────────────
#  FRONTEND IMAGE — TCOM Web
#  Build เว็บด้วย Vite แล้วเสิร์ฟไฟล์ static ผ่าน nginx
#  nginx ทำหน้าที่ proxy /api และ /uploads ไปยัง backend ในเครือข่ายเดียวกัน
# ────────────────────────────────────────────────────────────

# ---- ขั้นที่ 1: build ----
FROM node:20-slim AS build
WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .
# ระหว่าง build ให้ frontend เรียก API แบบ same-origin (/api/v1) แล้วให้ nginx proxy ต่อ
ENV VITE_API_BASE_URL=/api/v1
RUN npm run build

# ---- ขั้นที่ 2: เสิร์ฟด้วย nginx ----
FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -q -O /dev/null http://localhost/ || exit 1
