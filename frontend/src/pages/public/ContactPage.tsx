import { MapPin, Phone, Mail, Clock, Facebook, Youtube } from 'lucide-react';
import { useSettings } from '@/hooks/useSiteData';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { PageHero } from '@/components/common/PageHero';
import { GlassCard } from '@/components/ui/GlassCard';
import { ContactForm } from '@/components/ContactForm';
import { Reveal } from '@/components/ui/Reveal';

/** หน้าติดต่อ — ข้อมูลติดต่อ แผนที่ และฟอร์มติดต่อ */
export default function ContactPage() {
  useDocumentTitle('ติดต่อแผนกวิชา');
  const { contact, social } = useSettings();

  const rows = [
    contact?.address && { icon: MapPin, label: 'ที่อยู่', value: contact.address },
    contact?.phone && { icon: Phone, label: 'โทรศัพท์', value: contact.phone },
    contact?.email && { icon: Mail, label: 'อีเมล', value: contact.email },
    contact?.officeHours && { icon: Clock, label: 'เวลาทำการ', value: contact.officeHours },
  ].filter(Boolean) as { icon: typeof MapPin; label: string; value: string }[];

  return (
    <>
      <PageHero
        title="ติดต่อแผนกวิชา"
        description="สอบถามข้อมูล การรับสมัคร หรือขอความอนุเคราะห์ต่าง ๆ ได้ที่ช่องทางด้านล่าง"
        breadcrumb={[{ label: 'ติดต่อ' }]}
      />
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-12 lg:grid-cols-[0.9fr_1.1fr]">
        <Reveal>
          <GlassCard padding="lg" className="flex h-full flex-col gap-5">
            {rows.length === 0 && <p className="text-sm text-ink-muted">ข้อมูลการติดต่อจะแสดงเมื่อผู้ดูแลกรอกในระบบหลังบ้าน</p>}
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
            {(social?.facebook || social?.youtube) && (
              <div className="flex gap-2.5 border-t border-hairline/[0.13] pt-4">
                {social.facebook && (
                  <a href={social.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook"
                    className="grid size-9 place-items-center rounded-sm border border-hairline/15 text-ink-muted hover:border-brand-500/40 hover:text-brand-500">
                    <Facebook className="size-[18px]" aria-hidden />
                  </a>
                )}
                {social.youtube && (
                  <a href={social.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube"
                    className="grid size-9 place-items-center rounded-sm border border-hairline/15 text-ink-muted hover:border-brand-500/40 hover:text-brand-500">
                    <Youtube className="size-[18px]" aria-hidden />
                  </a>
                )}
              </div>
            )}
            {contact?.mapEmbedUrl && (
              <iframe src={contact.mapEmbedUrl} title="แผนที่วิทยาลัย" className="mt-1 h-56 w-full rounded-sm border border-hairline/15" loading="lazy" />
            )}
          </GlassCard>
        </Reveal>
        <Reveal delay={0.1}>
          <ContactForm />
        </Reveal>
      </div>
    </>
  );
}
