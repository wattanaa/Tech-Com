import { useCallback, useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'tcom-theme';

function resolve(mode: ThemeMode): 'light' | 'dark' {
  if (mode !== 'system') return mode;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function readStored(): ThemeMode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
  } catch {
    /* localStorage อาจถูกปิดในโหมดส่วนตัว — ใช้ค่าตามระบบแทน */
  }
  return 'system';
}

/**
 * จัดการธีม 3 สถานะ: สว่าง / มืด / ตามระบบ
 * ค่าจะถูกเขียนลง data-theme ที่ <html> ซึ่ง Tailwind และ CSS variable อ่านต่อ
 */
export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>(readStored);

  useEffect(() => {
    const apply = () => {
      document.documentElement.setAttribute('data-theme', resolve(mode));
    };
    apply();

    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      /* เขียนไม่ได้ก็ไม่เป็นไร ธีมยังทำงานในหน้านี้ */
    }

    if (mode !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [mode]);

  const toggle = useCallback(() => {
    setMode((current) => (resolve(current) === 'dark' ? 'light' : 'dark'));
  }, []);

  return { mode, setMode, toggle, resolved: resolve(mode) };
}
