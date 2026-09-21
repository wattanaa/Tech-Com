import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';
import type { Paginated } from '@/types';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SkeletonGrid, ErrorState, EmptyState } from '@/components/ui/feedback';
import { Reveal } from '@/components/ui/Reveal';
import { cn } from '@/utils/cn';

/** section รายการทั่วไป — ดึงข้อมูล แสดง grid ของการ์ด และปุ่มดูทั้งหมด ใช้ซ้ำกับหลายชนิดเนื้อหา */
export function CollectionSection<T extends { id: string }>({
  eyebrow,
  title,
  subtitle,
  viewAllHref,
  queryKey,
  queryFn,
  renderItem,
  cols = 3,
  tinted = false,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  viewAllHref: string;
  queryKey: unknown[];
  queryFn: () => Promise<Paginated<T>>;
  renderItem: (item: T) => ReactNode;
  cols?: 2 | 3 | 4;
  tinted?: boolean;
}) {
  const { data, isPending, isError, refetch } = useQuery({ queryKey, queryFn, staleTime: 3 * 60_000 });

  const gridCls = cn(
    'grid gap-5',
    cols === 2 && 'sm:grid-cols-2',
    cols === 3 && 'sm:grid-cols-2 lg:grid-cols-3',
    cols === 4 && 'sm:grid-cols-2 lg:grid-cols-4',
  );

  return (
    <section className={cn(tinted && 'bg-surface/40', 'border-y border-transparent')}>
      <div className="mx-auto max-w-6xl px-4 py-16">
        <SectionHeader
          eyebrow={eyebrow}
          title={title}
          description={subtitle}
          action={
            <Link
              to={viewAllHref}
              className="glass inline-flex h-9 items-center gap-2 rounded-sm px-3.5 text-[13px] font-semibold text-ink hover:border-hairline/30"
            >
              ดูทั้งหมด <ArrowRight className="size-4" aria-hidden />
            </Link>
          }
        />

        {isPending && <SkeletonGrid count={cols} cols={cols} />}
        {isError && <ErrorState onRetry={() => void refetch()} />}
        {data && data.items.length === 0 && <EmptyState message="ยังไม่มีข้อมูลในส่วนนี้" />}
        {data && data.items.length > 0 && (
          <div className={gridCls}>
            {data.items.map((item, i) => (
              <Reveal key={item.id} delay={Math.min(i * 0.05, 0.3)}>
                {renderItem(item)}
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
