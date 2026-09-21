import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getNews } from '@/api/public';
import { useDebounce } from '@/hooks/useDebounce';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { PageHero } from '@/components/common/PageHero';
import { SearchInput } from '@/components/ui/SearchInput';
import { Pagination } from '@/components/ui/Pagination';
import { ResultGrid } from '@/components/ResultGrid';
import { NewsCard } from '@/components/cards';

/** หน้ารวมข่าวประชาสัมพันธ์ — ค้นหา + แบ่งหน้า */
export default function NewsPage() {
  useDocumentTitle('ข่าวประชาสัมพันธ์');
  const [page, setPage] = useState(1);
  const [rawSearch, setRawSearch] = useState('');
  const search = useDebounce(rawSearch);

  const query = useQuery({
    queryKey: ['news', { page, search }],
    queryFn: () => getNews({ page, limit: 9, search, sortBy: 'publishedAt', order: 'desc' }),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <PageHero
        title="ข่าวประชาสัมพันธ์"
        description="ข่าวสารและประกาศจากแผนกวิชาเทคโนโลยีคอมพิวเตอร์"
        breadcrumb={[{ label: 'ข่าวสาร' }]}
      >
        <SearchInput
          value={rawSearch}
          onChange={(v) => { setRawSearch(v); setPage(1); }}
          placeholder="ค้นหาจากหัวข้อหรือเนื้อหาข่าว…"
          className="max-w-md"
        />
      </PageHero>

      <div className="mx-auto max-w-6xl px-4 py-12">
        <ResultGrid query={query} renderItem={(n) => <NewsCard news={n} />} cols={3} />
        {query.data && <Pagination page={page} totalPages={query.data.meta.totalPages} onChange={setPage} />}
      </div>
    </>
  );
}
