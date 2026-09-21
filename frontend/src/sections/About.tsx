import { Link } from 'react-router-dom';
import { Target, Eye, CheckCircle2, ArrowRight } from 'lucide-react';
import type { HomepageSection } from '@/types';
import { useSettings } from '@/hooks/useSiteData';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { GlassCard } from '@/components/ui/GlassCard';
import { Reveal } from '@/components/ui/Reveal';

/** เกี่ยวกับแผนก — ประวัติ วิสัยทัศน์ และจุดเด่น อ่านจากการตั้งค่าที่แก้ได้ในหลังบ้าน */
export function AboutSection({ section }: { section: HomepageSection }) {
  const { about } = useSettings();
  const strengths = about?.strengths ?? [];

  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <SectionHeader
        eyebrow="About"
        title={section.title ?? 'เกี่ยวกับแผนกวิชา'}
        description={section.subtitle ?? undefined}
        action={
          <Link
            to="/about"
            className="glass inline-flex h-9 items-center gap-2 rounded-sm px-3.5 text-[13px] font-semibold text-ink hover:border-hairline/30"
          >
            อ่านเพิ่มเติม <ArrowRight className="size-4" aria-hidden />
          </Link>
        }
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Reveal>
          <p className="text-[15px] leading-loose text-ink-muted">
            {about?.history ??
              'แผนกวิชาเทคโนโลยีคอมพิวเตอร์ จัดการเรียนการสอนด้านคอมพิวเตอร์และเทคโนโลยีสารสนเทศ มุ่งผลิตกำลังคนที่มีสมรรถนะวิชาชีพตรงตามความต้องการของสถานประกอบการ'}
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <GlassCard padding="md" className="flex flex-col gap-2">
              <Eye className="size-5 text-brand-500" aria-hidden />
              <h3 className="font-display text-sm font-semibold">วิสัยทัศน์</h3>
              <p className="text-[13px] leading-relaxed text-ink-muted">
                {about?.vision ?? 'เป็นแผนกวิชาชั้นนำด้านเทคโนโลยีคอมพิวเตอร์ของภาคตะวันออกเฉียงเหนือ'}
              </p>
            </GlassCard>
            <GlassCard padding="md" className="flex flex-col gap-2">
              <Target className="size-5 text-brand-500" aria-hidden />
              <h3 className="font-display text-sm font-semibold">พันธกิจ</h3>
              <p className="text-[13px] leading-relaxed text-ink-muted">
                {about?.mission?.[0] ?? 'จัดการเรียนการสอนที่เน้นการปฏิบัติจริงตามมาตรฐานสมรรถนะวิชาชีพ'}
              </p>
            </GlassCard>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <GlassCard padding="lg" variant="strong" className="h-full">
            <h3 className="font-display text-base font-semibold">จุดเด่นของแผนกวิชา</h3>
            <ul className="mt-4 flex flex-col gap-3.5">
              {(strengths.length > 0 ? strengths : [
                'ห้องปฏิบัติการเฉพาะทางครอบคลุมทั้งเครือข่าย IoT และปัญญาประดิษฐ์',
                'ครูผู้สอนมีวุฒิตรงสาขาและมีประสบการณ์ในสถานประกอบการ',
                'นักศึกษาฝึกประสบการณ์วิชาชีพในสถานประกอบการทุกคน',
                'ผลงานนักศึกษาได้รับรางวัลระดับภาคและระดับชาติอย่างต่อเนื่อง',
              ]).map((s) => (
                <li key={s} className="flex gap-3 text-[14px] text-ink-muted">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-hidden />
                  {s}
                </li>
              ))}
            </ul>
          </GlassCard>
        </Reveal>
      </div>
    </section>
  );
}
