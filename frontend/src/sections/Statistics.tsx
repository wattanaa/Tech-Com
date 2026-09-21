import { useQueries } from '@tanstack/react-query';
import { GraduationCap, Users, BookOpen, Award } from 'lucide-react';
import type { HomepageSection } from '@/types';
import { getCourses, getPrograms, getProjects, getTeachers } from '@/api/public';
import { StatCounter } from '@/components/ui/StatCounter';
import { Reveal } from '@/components/ui/Reveal';

/** แถบสถิติ — นับจำนวนจริงจากฐานข้อมูลผ่าน meta.total ของแต่ละ endpoint */
export function StatisticsSection({ section }: { section: HomepageSection }) {
  const results = useQueries({
    queries: [
      { queryKey: ['stat', 'teachers'], queryFn: () => getTeachers({ limit: 1 }), staleTime: 5 * 60_000 },
      { queryKey: ['stat', 'programs'], queryFn: () => getPrograms({ limit: 1 }), staleTime: 5 * 60_000 },
      { queryKey: ['stat', 'courses'], queryFn: () => getCourses({ limit: 1 }), staleTime: 5 * 60_000 },
      { queryKey: ['stat', 'projects'], queryFn: () => getProjects({ limit: 1 }), staleTime: 5 * 60_000 },
    ],
  });

  const items = [
    { icon: Users, label: 'ครูและบุคลากร', value: results[0].data?.meta.total ?? 0 },
    { icon: GraduationCap, label: 'หลักสูตรที่เปิดสอน', value: results[1].data?.meta.total ?? 0 },
    { icon: BookOpen, label: 'รายวิชา', value: results[2].data?.meta.total ?? 0 },
    { icon: Award, label: 'ผลงานนักศึกษา', value: results[3].data?.meta.total ?? 0 },
  ];

  return (
    <section className="mx-auto -mt-4 max-w-6xl px-4">
      <Reveal>
        <div className="glass grid grid-cols-2 gap-2 rounded-xl p-5 shadow-card sm:gap-4 lg:grid-cols-4">
          {items.map((it) => (
            <div key={it.label} className="flex flex-col items-center gap-2 px-2 py-3 text-center">
              <span className="grid size-11 place-items-center rounded-sm bg-brand-500/[0.10] text-brand-500">
                <it.icon className="size-5" aria-hidden />
              </span>
              <span className="font-display text-3xl font-bold tracking-tight">
                <StatCounter value={it.value} />
              </span>
              <span className="text-[13px] text-ink-muted">{it.label}</span>
            </div>
          ))}
        </div>
      </Reveal>
      {section.subtitle && <p className="mt-3 text-center text-sm text-ink-subtle">{section.subtitle}</p>}
    </section>
  );
}
