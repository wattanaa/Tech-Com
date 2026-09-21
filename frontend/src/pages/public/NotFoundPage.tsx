import { Link } from 'react-router-dom';
import { Home, Compass } from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

/** หน้า 404 — ไม่พบหน้าที่ต้องการ */
export default function NotFoundPage() {
  useDocumentTitle('ไม่พบหน้าที่ต้องการ');
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-5 px-4 text-center">
      <div className="grid size-20 place-items-center rounded-2xl bg-brand-500/[0.10] text-brand-500">
        <Compass className="size-10" aria-hidden />
      </div>
      <div>
        <p className="font-mono text-5xl font-bold text-brand-500">404</p>
        <h1 className="mt-2 font-display text-xl font-bold">ไม่พบหน้าที่ต้องการ</h1>
        <p className="mt-2 text-sm text-ink-muted">หน้าที่คุณกำลังมองหาอาจถูกย้ายหรือไม่มีอยู่แล้ว</p>
      </div>
      <Link
        to="/"
        className="inline-flex h-11 items-center gap-2 rounded-lg bg-gradient-to-br from-brand-400 to-brand-700 px-6 font-display text-sm font-semibold text-white shadow-glow"
      >
        <Home className="size-4" aria-hidden /> กลับหน้าแรก
      </Link>
    </div>
  );
}
