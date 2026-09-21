import { Search, X } from 'lucide-react';
import { cn } from '@/utils/cn';

/** ช่องค้นหาแบบมีไอคอนและปุ่มล้าง */
export function SearchInput({
  value,
  onChange,
  placeholder = 'ค้นหา…',
  className,
  autoFocus,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}) {
  return (
    <div className={cn('glass flex items-center gap-2.5 rounded-lg px-4 py-2.5', className)}>
      <Search className="size-4 shrink-0 text-ink-subtle" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus={autoFocus}
        aria-label={placeholder}
        className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-subtle"
      />
      {value && (
        <button onClick={() => onChange('')} aria-label="ล้างคำค้นหา" className="text-ink-subtle hover:text-ink">
          <X className="size-4" aria-hidden />
        </button>
      )}
    </div>
  );
}
