import { useQuery } from '@tanstack/react-query';
import { getPrograms } from '@/api/public';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { PageHero } from '@/components/common/PageHero';
import { ResultGrid } from '@/components/ResultGrid';
import { ProgramCard } from '@/components/cards';

/** หน้ารวมหลักสูตร ปวช. / ปวส. */
export default function ProgramsPage() {
  useDocumentTitle('หลักสูตรที่เปิดสอน');
  const query = useQuery({ queryKey: ['programs', 'all'], queryFn: () => getPrograms({ limit: 100 }) });

  return (
    <>
      <PageHero
        title="หลักสูตรที่เปิดสอน"
        description="หลักสูตรประกาศนียบัตรวิชาชีพ (ปวช.) และประกาศนียบัตรวิชาชีพชั้นสูง (ปวส.) สาขาเทคโนโลยีคอมพิวเตอร์"
        breadcrumb={[{ label: 'หลักสูตร' }]}
      />
      <div className="mx-auto max-w-6xl px-4 py-12">
        <ResultGrid query={query} renderItem={(p) => <ProgramCard program={p} />} cols={2} />
      </div>
    </>
  );
}
