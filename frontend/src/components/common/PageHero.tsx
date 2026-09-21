import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

/** ส่วนหัวของหน้าภายใน — ชื่อหน้า + คำอธิบาย + breadcrumb บนพื้นไล่สีอ่อน */
export function PageHero({
  title,
  description,
  breadcrumb,
  children,
}: {
  title: string;
  description?: string;
  breadcrumb?: { label: string; href?: string }[];
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden border-b border-hairline/[0.13]">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(600px 300px at 80% -20%, rgb(10 132 255 / 0.18), transparent 65%), radial-gradient(500px 260px at 0% 0%, rgb(31 182 224 / 0.14), transparent 62%)',
        }}
        aria-hidden
      />
      <div className="relative mx-auto max-w-6xl px-4 pb-10 pt-10">
        <nav className="mb-4 flex flex-wrap items-center gap-1 text-[12px] text-ink-subtle" aria-label="เส้นทาง">
          <Link to="/" className="hover:text-brand-500">หน้าแรก</Link>
          {breadcrumb?.map((b) => (
            <span key={b.label} className="flex items-center gap-1">
              <ChevronRight className="size-3.5" aria-hidden />
              {b.href ? <Link to={b.href} className="hover:text-brand-500">{b.label}</Link> : <span className="text-ink-muted">{b.label}</span>}
            </span>
          ))}
        </nav>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        {description && <p className="mt-3 max-w-2xl text-[15px] text-ink-muted">{description}</p>}
        {children && <div className="mt-6">{children}</div>}
      </div>
    </section>
  );
}
