import type { Config } from 'tailwindcss';

/**
 * DESIGN SYSTEM — token กลางของทั้งเว็บไซต์
 * สีอ่านจาก CSS variable เพื่อให้ Dark Mode สลับได้โดยไม่ต้อง duplicate class
 * ทุก component ต้องใช้ token จากที่นี่ ห้ามใส่ค่าสีดิบใน component
 */
const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#EEF6FF',
          100: '#D9EAFF',
          200: '#BCDAFF',
          300: '#8EC3FF',
          400: '#0A84FF',
          500: '#007AFF',
          600: '#0063D6',
          700: '#0057B8',
          800: '#00458F',
          900: '#003268',
        },
        cyan: { 400: '#3FC9EC', 500: '#1FB6E0', 600: '#1494B8' },
        surface: 'rgb(var(--c-surface) / <alpha-value>)',
        canvas: 'rgb(var(--c-canvas) / <alpha-value>)',
        ink: {
          DEFAULT: 'rgb(var(--c-ink) / <alpha-value>)',
          muted: 'rgb(var(--c-ink-muted) / <alpha-value>)',
          subtle: 'rgb(var(--c-ink-subtle) / <alpha-value>)',
        },
        hairline: 'rgb(var(--c-border) / <alpha-value>)',
        success: '#0E9C63',
        warning: '#C77A0C',
        danger: '#D8394A',
      },
      fontFamily: {
        display: ['"IBM Plex Sans Thai"', '"Noto Sans Thai"', 'system-ui', 'sans-serif'],
        sans: ['"Noto Sans Thai"', '"IBM Plex Sans Thai"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        sm: '10px',
        DEFAULT: '14px',
        lg: '20px',
        xl: '28px',
      },
      boxShadow: {
        soft: '0 1px 2px rgb(10 40 90 / 0.06), 0 2px 8px rgb(10 40 90 / 0.05)',
        card: '0 4px 12px rgb(10 40 90 / 0.08), 0 16px 40px rgb(10 40 90 / 0.07)',
        float: '0 12px 28px rgb(10 40 90 / 0.12), 0 40px 80px rgb(10 40 90 / 0.10)',
        glow: '0 6px 18px rgb(10 132 255 / 0.28)',
      },
      backdropBlur: { glass: '18px' },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-9px)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
        float: 'float 7s ease-in-out infinite',
        shimmer: 'shimmer 1.6s infinite',
      },
    },
  },
  plugins: [],
};

export default config;
