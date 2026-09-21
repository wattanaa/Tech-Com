import { Target, Eye, CheckCircle2, Flag, ListChecks } from 'lucide-react';
import { useSettings } from '@/hooks/useSiteData';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { PageHero } from '@/components/common/PageHero';
import { GlassCard } from '@/components/ui/GlassCard';
import { Reveal } from '@/components/ui/Reveal';

/** หน้าเกี่ยวกับแผนก — ประวัติ วิสัยทัศน์ พันธกิจ จุดเด่น เป้าหมาย (อ่านจากการตั้งค่า) */
export default function AboutPage() {
  useDocumentTitle('เกี่ยวกับแผนก');
  const { about } = useSettings();

  return (
    <>
      <PageHero
        title="เกี่ยวกับแผนกวิชา"
        description="แผนกวิชาเทคโนโลยีคอมพิวเตอร์ วิทยาลัยเทคนิคร้อยเอ็ด"
        breadcrumb={[{ label: 'เกี่ยวกับแผนก' }]}
      />
      <div className="mx-auto flex max-w-4xl flex-col gap-10 px-4 py-12">
        <Reveal>
          <section>
            <h2 className="font-display text-xl font-bold">ประวัติแผนกวิชา</h2>
            <p className="mt-3 text-[15px] leading-loose text-ink-muted">
              {about?.history ??
                'แผนกวิชาเทคโนโลยีคอมพิวเตอร์ จัดการเรียนการสอนด้านคอมพิวเตอร์และเทคโนโลยีสารสนเทศ ทั้งระดับ ปวช. และ ปวส. มุ่งผลิตกำลังคนที่มีสมรรถนะวิชาชีพตรงตามความต้องการของสถานประกอบการ'}
            </p>
          </section>
        </Reveal>

        <div className="grid gap-5 sm:grid-cols-2">
          <Reveal>
            <GlassCard padding="lg" className="flex h-full flex-col gap-3">
              <Eye className="size-6 text-brand-500" aria-hidden />
              <h3 className="font-display text-base font-semibold">วิสัยทัศน์</h3>
              <p className="text-[14px] leading-relaxed text-ink-muted">
                {about?.vision ?? 'เป็นแผนกวิชาชั้นนำด้านเทคโนโลยีคอมพิวเตอร์ของภาคตะวันออกเฉียงเหนือ'}
              </p>
            </GlassCard>
          </Reveal>
          <Reveal delay={0.1}>
            <GlassCard padding="lg" className="flex h-full flex-col gap-3">
              <Target className="size-6 text-brand-500" aria-hidden />
              <h3 className="font-display text-base font-semibold">พันธกิจ</h3>
              <ul className="flex flex-col gap-2 text-[14px] text-ink-muted">
                {(about?.mission ?? ['จัดการเรียนการสอนที่เน้นการปฏิบัติจริงตามมาตรฐานสมรรถนะวิชาชีพ']).map((m) => (
                  <li key={m} className="flex gap-2"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-500" aria-hidden /> {m}</li>
                ))}
              </ul>
            </GlassCard>
          </Reveal>
        </div>

        {about?.strengths && about.strengths.length > 0 && (
          <Reveal>
            <ListBlock icon={ListChecks} title="จุดเด่นของแผนกวิชา" items={about.strengths} tone="success" />
          </Reveal>
        )}
        {about?.goals && about.goals.length > 0 && (
          <Reveal>
            <ListBlock icon={Flag} title="เป้าหมาย" items={about.goals} tone="brand" />
          </Reveal>
        )}
      </div>
    </>
  );
}

function ListBlock({
  icon: Icon,
  title,
  items,
  tone,
}: {
  icon: typeof Flag;
  title: string;
  items: string[];
  tone: 'success' | 'brand';
}) {
  return (
    <section>
      <h2 className="flex items-center gap-2.5 font-display text-xl font-bold">
        <Icon className="size-6 text-brand-500" aria-hidden /> {title}
      </h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {items.map((s) => (
          <li key={s} className="flex gap-2.5 text-[14px] text-ink-muted">
            <CheckCircle2 className={`mt-0.5 size-5 shrink-0 ${tone === 'success' ? 'text-success' : 'text-brand-500'}`} aria-hidden /> {s}
          </li>
        ))}
      </ul>
    </section>
  );
}
