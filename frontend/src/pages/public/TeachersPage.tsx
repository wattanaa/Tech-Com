import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { TeacherType } from '@/types';
import { getTeachers } from '@/api/public';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { PageHero } from '@/components/common/PageHero';
import { ResultGrid } from '@/components/ResultGrid';
import { TeacherCard } from '@/components/cards';
import { cn } from '@/utils/cn';

const TABS: { key: 'ALL' | TeacherType; label: string }[] = [
  { key: 'ALL', label: 'ทั้งหมด' },
  { key: 'HEAD', label: 'หัวหน้าแผนก' },
  { key: 'TEACHER', label: 'ครูผู้สอน' },
  { key: 'STAFF', label: 'บุคลากร' },
];

/** หน้ารวมบุคลากร — กรองตามประเภท (หัวหน้าแผนก / ครู / บุคลากร) */
export default function TeachersPage() {
  useDocumentTitle('ครูและบุคลากร');
  const [tab, setTab] = useState<'ALL' | TeacherType>('ALL');

  const query = useQuery({ queryKey: ['teachers', 'all'], queryFn: () => getTeachers({ limit: 100 }) });

  const filtered = query.data
    ? { ...query.data, items: query.data.items.filter((t) => tab === 'ALL' || t.type === tab) }
    : query.data;

  return (
    <>
      <PageHero
        title="ครูและบุคลากร"
        description="คณะครูและบุคลากรของแผนกวิชาเทคโนโลยีคอมพิวเตอร์"
        breadcrumb={[{ label: 'บุคลากร' }]}
      >
        <div className="glass inline-flex gap-1 rounded-lg p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'rounded-sm px-3.5 py-1.5 text-[13px] font-medium transition-colors',
                tab === t.key ? 'bg-gradient-to-br from-brand-400 to-brand-700 text-white shadow-glow' : 'text-ink-muted hover:text-brand-500',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </PageHero>

      <div className="mx-auto max-w-6xl px-4 py-12">
        <ResultGrid query={{ ...query, data: filtered } as typeof query} renderItem={(t) => <TeacherCard teacher={t} />} cols={4} emptyMessage="ไม่มีบุคลากรในกลุ่มนี้" />
      </div>
    </>
  );
}
