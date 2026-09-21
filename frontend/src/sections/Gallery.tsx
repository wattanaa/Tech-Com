import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { GalleryImage, HomepageSection } from '@/types';
import { getAlbums } from '@/api/public';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { MediaImage } from '@/components/ui/MediaImage';
import { Lightbox } from '@/components/ui/Lightbox';
import { SkeletonGrid, ErrorState, EmptyState } from '@/components/ui/feedback';
import { Reveal } from '@/components/ui/Reveal';

/** คลังภาพหน้าแรก — รวมภาพจากทุกอัลบั้มมาแสดงเป็นตาราง เปิดดูขยายได้ */
export function GallerySection({ section }: { section: HomepageSection }) {
  const limit = (section.config.limit as number) ?? 8;
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['albums'],
    queryFn: getAlbums,
    staleTime: 5 * 60_000,
  });
  const [active, setActive] = useState<number | null>(null);

  const images: GalleryImage[] = useMemo(
    () => (data ?? []).flatMap((a) => a.images).slice(0, limit),
    [data, limit],
  );

  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <SectionHeader eyebrow="Gallery" title={section.title ?? 'คลังภาพกิจกรรม'} description={section.subtitle ?? undefined} center />
      {isPending && <SkeletonGrid count={8} cols={4} />}
      {isError && <ErrorState onRetry={() => void refetch()} />}
      {data && images.length === 0 && <EmptyState message="ยังไม่มีภาพในคลัง" />}
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((img, i) => (
            <Reveal key={img.id} delay={Math.min(i * 0.04, 0.24)}>
              <button
                onClick={() => setActive(i)}
                className="group block aspect-square w-full overflow-hidden rounded-lg"
                aria-label={img.caption ?? 'เปิดดูภาพ'}
              >
                <MediaImage media={img.media} alt={img.caption ?? 'ภาพกิจกรรม'} thumb className="transition-transform duration-500 group-hover:scale-110" />
              </button>
            </Reveal>
          ))}
        </div>
      )}
      <Lightbox images={images} index={active} onClose={() => setActive(null)} onNavigate={setActive} />
    </section>
  );
}
