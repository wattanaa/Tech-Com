import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

/** ปุ่มสลับโหมดสว่าง/มืด */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolved, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label={resolved === 'dark' ? 'เปลี่ยนเป็นโหมดสว่าง' : 'เปลี่ยนเป็นโหมดมืด'}
      className={`grid size-9 place-items-center rounded-sm border border-hairline/15 bg-surface/60 text-ink-muted transition-colors hover:border-hairline/30 hover:text-brand-500 ${className ?? ''}`}
    >
      {resolved === 'dark' ? <Sun className="size-[18px]" aria-hidden /> : <Moon className="size-[18px]" aria-hidden />}
    </button>
  );
}
