import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import type { HomepageSection } from '@/types';
import { useSettings } from '@/hooks/useSiteData';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { GlassCard } from '@/components/ui/GlassCard';
import { ContactForm } from '@/components/ContactForm';
import { Reveal } from '@/components/ui/Reveal';

/** ติดต่อแผนก — ข้อมูลติดต่อ (จากการตั้งค่า) คู่กับฟอร์มติดต่อ */
export function ContactSection({ section }: { section: HomepageSection }) {
  const { contact } = useSettings();

  const rows = [
    contact?.address && { icon: MapPin, label: 'ที่อยู่', value: contact.address },
    contact?.phone && { icon: Phone, label: 'โทรศัพท์', value: contact.phone },
    contact?.email && { icon: Mail, label: 'อีเมล', value: contact.email },
    contact?.officeHours && { icon: Clock, label: 'เวลาทำการ', value: contact.officeHours },
  ].filter(Boolean) as { icon: typeof MapPin; label: string; value: string }[];

  return (
    <section className="bg-surface/40">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <SectionHeader eyebrow="Contact" title={section.title ?? 'ติดต่อแผนกวิชา'} description={section.subtitle ?? undefined} center />
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Reveal>
            <GlassCard padding="lg" className="flex h-full flex-col gap-5">
              {rows.length === 0 && (
                <p className="text-sm text-ink-muted">ข้อมูลการติดต่อจะแสดงเมื่อผู้ดูแลกรอกในระบบหลังบ้าน</p>
              )}
              {rows.map((r) => (
                <div key={r.label} className="flex gap-3.5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-sm bg-brand-500/[0.10] text-brand-500">
                    <r.icon className="size-5" aria-hidden />
                  </span>
                  <div>
                    <p className="font-display text-[13px] font-semibold">{r.label}</p>
                    <p className="text-[13px] leading-relaxed text-ink-muted">{r.value}</p>
                  </div>
                </div>
              ))}
              {contact?.mapEmbedUrl && (
                <iframe
                  src={contact.mapEmbedUrl}
                  title="แผนที่วิทยาลัย"
                  className="mt-1 h-48 w-full rounded-sm border border-hairline/15"
                  loading="lazy"
                />
              )}
            </GlassCard>
          </Reveal>
          <Reveal delay={0.1}>
            <ContactForm />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
