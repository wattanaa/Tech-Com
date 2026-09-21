import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

/** หัวข้อของแต่ละ section — eyebrow + หัวข้อ + คำอธิบาย และปุ่มมุมขวา (ถ้ามี) */
export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  center = false,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  center?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'mb-8 flex gap-4',
        center ? 'flex-col items-center text-center' : 'flex-wrap items-end justify-between',
        className,
      )}
    >
      <div className={cn(center && 'max-w-2xl')}>
        {eyebrow && (
          <p className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-brand-500">
            {eyebrow}
          </p>
        )}
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
        {description && <p className="mt-2 text-sm text-ink-muted sm:text-[15px]">{description}</p>}
      </div>
      {action}
    </div>
  );
}
