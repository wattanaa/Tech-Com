import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';

/** แถบแบ่งหน้า — แสดงเลขหน้ารอบ ๆ หน้าปัจจุบันและปุ่มก่อนหน้า/ถัดไป */
export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages: number[] = [];
  const from = Math.max(1, page - 2);
  const to = Math.min(totalPages, from + 4);
  for (let i = Math.max(1, to - 4); i <= to; i++) pages.push(i);

  const btn =
    'grid h-9 min-w-9 place-items-center rounded-sm border border-hairline/20 px-2 font-mono text-[13px] transition-colors hover:border-brand-500/40 disabled:opacity-40 disabled:hover:border-hairline/20';

  return (
    <nav className="mt-8 flex items-center justify-center gap-1.5" aria-label="แบ่งหน้า">
      <button className={btn} onClick={() => onChange(page - 1)} disabled={page <= 1} aria-label="หน้าก่อนหน้า">
        <ChevronLeft className="size-4" aria-hidden />
      </button>
      {pages[0]! > 1 && <span className="px-1 text-ink-subtle">…</span>}
      {pages.map((p) => (
        <button
          key={p}
          className={cn(btn, p === page && 'border-transparent bg-gradient-to-br from-brand-400 to-brand-700 text-white shadow-glow')}
          onClick={() => onChange(p)}
          aria-current={p === page ? 'page' : undefined}
        >
          {p}
        </button>
      ))}
      {pages[pages.length - 1]! < totalPages && <span className="px-1 text-ink-subtle">…</span>}
      <button className={btn} onClick={() => onChange(page + 1)} disabled={page >= totalPages} aria-label="หน้าถัดไป">
        <ChevronRight className="size-4" aria-hidden />
      </button>
    </nav>
  );
}
