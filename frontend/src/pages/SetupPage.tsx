import { useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { Cpu, Database, Moon, RefreshCw, Server, Sun, TriangleAlert } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/hooks/useTheme';
import { get } from '@/api/client';
import { fadeUp, stagger, transitions } from '@/animations/variants';

interface HealthPayload {
  status: 'ok' | 'degraded';
  uptimeSeconds: number;
  timestamp: string;
  database: { connected: boolean; latencyMs: number };
  memoryMb: number;
}

/** ขั้นตอนถัดไปของโปรเจกต์ — แยก phase ออกจากคำอธิบายเพื่อไม่ให้เลขซ้ำกับป้ายหน้าแถว */
const NEXT_STEPS = [
  { phase: 2, title: 'เพิ่มตารางเนื้อหาทั้งหมดใน Prisma schema พร้อม migration และข้อมูลตัวอย่าง' },
  { phase: 3, title: 'สร้าง REST API ครบทุก entity พร้อม search / filter / sort / pagination' },
  { phase: 4, title: 'ระบบเข้าสู่ระบบ session และ RBAC ตรวจสิทธิ์ที่ backend ทุกเส้นทาง' },
] as const;

/**
 * หน้าตรวจสถานะระบบของ PHASE 1
 * มีไว้ยืนยัน 3 อย่าง: Frontend build ผ่าน · เรียก API ได้ · ฐานข้อมูลเชื่อมต่อแล้ว
 * จะถูกแทนที่ด้วยหน้าแรกจริงใน PHASE 9
 */
export default function SetupPage() {
  const { resolved, toggle } = useTheme();
  const { data, isPending, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['health'],
    queryFn: () => get<HealthPayload>('/health'),
    refetchInterval: 30_000,
  });

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col justify-center px-4 py-10 sm:px-6">
      <motion.div variants={stagger()} initial="hidden" animate="visible" className="flex flex-col gap-5">
        <motion.header
          variants={fadeUp}
          className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3"
        >
          <div className="flex min-w-0 items-center gap-3.5">
            <div className="grid size-11 shrink-0 place-items-center rounded bg-gradient-to-br from-brand-400 to-brand-700 text-white shadow-glow">
              <Cpu className="size-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-brand-500">
                Phase 1 · Project Setup
              </p>
              <h1 className="truncate text-lg font-bold tracking-tight sm:text-xl">
                แผนกวิชาเทคโนโลยีคอมพิวเตอร์
              </h1>
              <p className="truncate text-sm text-ink-muted">วิทยาลัยเทคนิคร้อยเอ็ด</p>
            </div>
          </div>
          <Button variant="ghost" size="xs" onClick={toggle} aria-label="สลับโหมดสว่างและมืด">
            {resolved === 'dark' ? <Sun className="size-3.5" aria-hidden /> : <Moon className="size-3.5" aria-hidden />}
            {resolved === 'dark' ? 'โหมดสว่าง' : 'โหมดมืด'}
          </Button>
        </motion.header>

        <motion.div variants={fadeUp}>
          <GlassCard padding="none">
            <div className="flex items-center gap-3 border-b border-hairline/[0.13] px-5 py-3">
              <Server className="size-4 shrink-0 text-brand-500" aria-hidden />
              <h2 className="min-w-0 flex-1 truncate font-display text-sm font-semibold">สถานะระบบ</h2>
              <Button
                variant="subtle"
                size="xs"
                onClick={() => void refetch()}
                isLoading={isFetching}
                leftIcon={<RefreshCw className="size-3.5" aria-hidden />}
              >
                ตรวจใหม่
              </Button>
            </div>

            {isPending && (
              <div className="flex flex-col gap-3 p-5" aria-live="polite" aria-busy="true">
                <div className="skeleton h-5 w-2/5" />
                <div className="skeleton h-5 w-3/5" />
                <div className="skeleton h-5 w-1/3" />
                <span className="sr-only">กำลังตรวจสอบสถานะระบบ</span>
              </div>
            )}

            {isError && (
              <div className="flex flex-col items-start gap-3 p-5" role="alert">
                <div className="flex items-center gap-2.5 text-warning">
                  <TriangleAlert className="size-5 shrink-0" aria-hidden />
                  <p className="font-display text-sm font-semibold">ยังเชื่อมต่อ API ไม่ได้</p>
                </div>
                <p className="text-sm text-ink-muted">{(error as Error).message}</p>
                <p className="font-mono text-xs leading-relaxed text-ink-subtle">
                  เปิดเทอร์มินัลใหม่แล้วสั่ง <span className="text-brand-500">npm run dev</span>
                  {' '}อีกครั้ง — สคริปต์จะเปิดฐานข้อมูลและสร้างตารางให้เอง
                </p>
                <Button variant="outline" size="xs" onClick={() => void refetch()}>
                  ลองอีกครั้ง
                </Button>
              </div>
            )}

            {data && (
              <dl className="divide-y divide-hairline/[0.13]">
                <StatusRow
                  icon={<Server className="size-4" aria-hidden />}
                  label="API Server"
                  value={`ทำงานปกติ · ${formatUptime(data.uptimeSeconds)}`}
                  ok
                />
                <StatusRow
                  icon={<Database className="size-4" aria-hidden />}
                  label="ฐานข้อมูล PostgreSQL"
                  value={
                    data.database.connected
                      ? `เชื่อมต่อแล้ว · ${data.database.latencyMs} ms`
                      : 'เชื่อมต่อไม่ได้'
                  }
                  ok={data.database.connected}
                />
                <StatusRow
                  icon={<Cpu className="size-4" aria-hidden />}
                  label="หน่วยความจำที่ใช้"
                  value={`${data.memoryMb} MB`}
                  ok
                />
              </dl>
            )}
          </GlassCard>
        </motion.div>

        <motion.div variants={fadeUp} transition={transitions.smooth}>
          <GlassCard>
            <h2 className="font-display text-sm font-semibold">ขั้นตอนถัดไป</h2>
            <ol className="mt-3 flex flex-col gap-2.5 text-sm text-ink-muted">
              {NEXT_STEPS.map(({ phase, title }) => (
                <li key={phase} className="flex gap-3">
                  <span className="mt-px grid size-5 shrink-0 place-items-center rounded-[6px] bg-brand-500/[0.12] font-mono text-[10px] font-medium text-brand-500">
                    {phase}
                  </span>
                  <span className="min-w-0 leading-relaxed">{title}</span>
                </li>
              ))}
            </ol>
          </GlassCard>
        </motion.div>
      </motion.div>
    </main>
  );
}

function StatusRow({
  icon,
  label,
  value,
  ok,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  ok: boolean;
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-3">
      <span className="shrink-0 text-ink-subtle">{icon}</span>
      <dt className="min-w-0 flex-1 truncate text-sm text-ink-muted">{label}</dt>
      <dd className="flex shrink-0 items-center gap-2 font-mono text-xs tabular-nums">
        <span className={`size-2 shrink-0 rounded-full ${ok ? 'bg-success' : 'bg-danger'}`} aria-hidden />
        <span className={ok ? '' : 'text-danger'}>{value}</span>
      </dd>
    </div>
  );
}

function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds} วินาที`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} นาที`;
  const hours = Math.floor(minutes / 60);
  return `${hours} ชั่วโมง ${minutes % 60} นาที`;
}
