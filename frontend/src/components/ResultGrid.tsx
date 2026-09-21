import type { ReactNode } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import type { Paginated } from '@/types';
import { SkeletonGrid, ErrorState, EmptyState } from './ui/feedback';
import { Reveal } from './ui/Reveal';
import { cn } from '@/utils/cn';

/** แสดงผลรายการในหน้า list — จัดการสถานะโหลด/ผิดพลาด/ว่าง/กริด ในที่เดียว */
export function ResultGrid<T extends { id: string }>({
  query,
  renderItem,
  cols = 3,
  emptyMessage = 'ไม่พบข้อมูลที่ค้นหา',
}: {
  query: UseQueryResult<Paginated<T>>;
  renderItem: (item: T) => ReactNode;
  cols?: 1 | 2 | 3 | 4;
  emptyMessage?: string;
}) {
  const { data, isPending, isError, refetch } = query;

  if (isPending) return <SkeletonGrid count={cols * 2} cols={cols} />;
  if (isError) return <ErrorState onRetry={() => void refetch()} />;
  if (!data || data.items.length === 0) return <EmptyState message={emptyMessage} />;

  return (
    <div
      className={cn(
        'grid gap-5',
        cols === 2 && 'sm:grid-cols-2',
        cols === 3 && 'sm:grid-cols-2 lg:grid-cols-3',
        cols === 4 && 'sm:grid-cols-2 lg:grid-cols-4',
      )}
    >
      {data.items.map((item, i) => (
        <Reveal key={item.id} delay={Math.min(i * 0.04, 0.24)}>
          {renderItem(item)}
        </Reveal>
      ))}
    </div>
  );
}
