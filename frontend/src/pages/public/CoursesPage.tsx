import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getCourses } from '@/api/public';
import { useDebounce } from '@/hooks/useDebounce';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { PageHero } from '@/components/common/PageHero';
import { SearchInput } from '@/components/ui/SearchInput';
import { Pagination } from '@/components/ui/Pagination';
import { ResultGrid } from '@/components/ResultGrid';
import { CourseCard } from '@/components/cards';

/** หน้ารวมรายวิชา — ค้นหา + แบ่งหน้า */
export default function CoursesPage() {
  useDocumentTitle('รายวิชา');
  const [page, setPage] = useState(1);
  const [rawSearch, setRawSearch] = useState('');
  const search = useDebounce(rawSearch);

  const query = useQuery({
    queryKey: ['courses', { page, search }],
    queryFn: () => getCourses({ page, limit: 12, search, sortBy: 'code', order: 'asc' }),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <PageHero
        title="รายวิชาที่เปิดสอน"
        description="รายวิชาในหลักสูตร ปวช. และ ปวส. สาขาเทคโนโลยีคอมพิวเตอร์"
        breadcrumb={[{ label: 'รายวิชา' }]}
      >
        <SearchInput
          value={rawSearch}
          onChange={(v) => { setRawSearch(v); setPage(1); }}
          placeholder="ค้นหาจากรหัสหรือชื่อวิชา…"
          className="max-w-md"
        />
      </PageHero>

      <div className="mx-auto max-w-6xl px-4 py-12">
        <ResultGrid query={query} renderItem={(c) => <CourseCard course={c} />} cols={3} />
        {query.data && <Pagination page={page} totalPages={query.data.meta.totalPages} onChange={setPage} />}
      </div>
    </>
  );
}
