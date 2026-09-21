import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

/** ป้ายกำกับเล็ก ๆ — ใช้กับหมวดหมู่ แท็ก และสถานะ รองรับสีเฉพาะหมวด */
export function Badge({
  children,
  color,
  className,
}: {
  children: ReactNode;
  /** hex ของหมวดหมู่ ถ้าไม่ระบุใช้สีน้ำเงินหลัก */
  color?: string;
  className?: string;
}) {
  const style = color
    ? { color, backgroundColor: `${color}1a`, borderColor: `${color}33` }
    : undefined;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-semibold',
        !color && 'border-brand-500/20 bg-brand-500/[0.10] text-brand-500',
        className,
      )}
      style={style}
    >
      {children}
    </span>
  );
}
