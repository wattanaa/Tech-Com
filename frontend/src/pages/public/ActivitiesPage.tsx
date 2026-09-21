import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getActivities } from '@/api/public';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { PageHero } from '@/components/common/PageHero';
import { Pagination } from '@/components/ui/Pagination';
import { ResultGrid } from '@/components/ResultGrid';
import { ActivityCard } from '@/components/cards';

/** หน้ารวมกิจกรรม — แบ่งหน้า เรียงตามวันที่ล่าสุด */
export default function ActivitiesPage() {
  useDocumentTitle('กิจกรรม');
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ['activities', { page }],
    queryFn: () => getActivities({ page, limit: 8, sortBy: 'startDate', order: 'desc' }),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <PageHero
        title="กิจกรรม"
        description="กิจกรรมการเรียน การอบรม การแข่งขัน และกิจกรรมของแผนกวิชา"
        breadcrumb={[{ label: 'กิจกรรม' }]}
      />
      <div className="mx-auto max-w-6xl px-4 py-12">
        <ResultGrid query={query} renderItem={(a) => <ActivityCard activity={a} />} cols={2} />
        {query.data && <Pagination page={page} totalPages={query.data.meta.totalPages} onChange={setPage} />}
      </div>
    </>
  );
}
