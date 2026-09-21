import { useQuery } from '@tanstack/react-query';
import { getFacilities } from '@/api/public';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { PageHero } from '@/components/common/PageHero';
import { ResultGrid } from '@/components/ResultGrid';
import { FacilityCard } from '@/components/cards';

/** หน้ารวมห้องปฏิบัติการ */
export default function FacilitiesPage() {
  useDocumentTitle('ห้องปฏิบัติการ');
  const query = useQuery({ queryKey: ['facilities', 'all'], queryFn: () => getFacilities({ limit: 100 }) });

  return (
    <>
      <PageHero
        title="ห้องปฏิบัติการ"
        description="ห้องปฏิบัติการเฉพาะทางของแผนกวิชา ครอบคลุมทั้งคอมพิวเตอร์ เครือข่าย IoT ปัญญาประดิษฐ์ และมัลติมีเดีย"
        breadcrumb={[{ label: 'ห้องปฏิบัติการ' }]}
      />
      <div className="mx-auto max-w-6xl px-4 py-12">
        <ResultGrid query={query} renderItem={(f) => <FacilityCard facility={f} />} cols={3} />
      </div>
    </>
  );
}
