import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getProjects } from '@/api/public';
import { useDebounce } from '@/hooks/useDebounce';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { PageHero } from '@/components/common/PageHero';
import { SearchInput } from '@/components/ui/SearchInput';
import { Pagination } from '@/components/ui/Pagination';
import { ResultGrid } from '@/components/ResultGrid';
import { ProjectCard } from '@/components/cards';

/** หน้ารวมผลงานนักศึกษา — ค้นหา + แบ่งหน้า */
export default function ProjectsPage() {
  useDocumentTitle('ผลงานนักศึกษา');
  const [page, setPage] = useState(1);
  const [rawSearch, setRawSearch] = useState('');
  const search = useDebounce(rawSearch);

  const query = useQuery({
    queryKey: ['projects', { page, search }],
    queryFn: () => getProjects({ page, limit: 9, search, sortBy: 'year', order: 'desc' }),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <PageHero
        title="ผลงานนักศึกษา"
        description="โครงงานและสิ่งประดิษฐ์จากนักเรียนนักศึกษาของแผนกวิชา"
        breadcrumb={[{ label: 'ผลงาน' }]}
      >
        <SearchInput
          value={rawSearch}
          onChange={(v) => { setRawSearch(v); setPage(1); }}
          placeholder="ค้นหาผลงาน…"
          className="max-w-md"
        />
      </PageHero>

      <div className="mx-auto max-w-6xl px-4 py-12">
        <ResultGrid query={query} renderItem={(p) => <ProjectCard project={p} />} cols={3} />
        {query.data && <Pagination page={page} totalPages={query.data.meta.totalPages} onChange={setPage} />}
      </div>
    </>
  );
}
