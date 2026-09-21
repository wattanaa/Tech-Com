import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { fadeUp, viewportOnce } from '@/animations/variants';

/**
 * หุ้มเนื้อหาให้ค่อย ๆ ปรากฏเมื่อเลื่อนมาถึง (เล่นครั้งเดียว)
 * เริ่มจากสถานะที่มองเห็นอยู่แล้ว ไม่ค้างที่ opacity 0 — และ motion จะเคารพ prefers-reduced-motion เอง
 */
export function Reveal({
  children,
  delay = 0,
  className,
  as = 'div',
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: 'div' | 'li' | 'section' | 'article';
}) {
  const MotionTag = motion[as];
  return (
    <MotionTag
      className={className}
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      transition={{ delay }}
    >
      {children}
    </MotionTag>
  );
}
