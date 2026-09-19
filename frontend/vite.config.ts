import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    port: 5173,
    // เรียก /api ผ่าน proxy ระหว่าง dev เพื่อให้ cookie เป็น same-origin ไม่ติดปัญหา SameSite
    proxy: {
      '/api': { target: 'http://localhost:4000', changeOrigin: true },
      '/uploads': { target: 'http://localhost:4000', changeOrigin: true },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        // แยก bundle เพื่อให้หน้าแรกโหลดเฉพาะที่จำเป็น
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          query: ['@tanstack/react-query', 'axios'],
          motion: ['motion'],
          charts: ['recharts'],
        },
      },
    },
  },
});
