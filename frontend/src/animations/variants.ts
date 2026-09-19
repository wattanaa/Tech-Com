import type { Variants, Transition } from 'motion/react';

/**
 * Motion token กลาง — ทุก animation ในเว็บไซต์ต้อง import จากที่นี่
 * เพื่อให้จังหวะและความเร็วสอดคล้องกันทั้งระบบ
 */
export const easing = {
  smooth: [0.22, 1, 0.36, 1],
  gentle: [0.4, 0, 0.2, 1],
} as const;

export const duration = {
  fast: 0.2,
  base: 0.45,
  slow: 0.7,
} as const;

export const transitions: Record<string, Transition> = {
  smooth: { duration: duration.base, ease: easing.smooth },
  fast: { duration: duration.fast, ease: easing.gentle },
  spring: { type: 'spring', stiffness: 320, damping: 30 },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: transitions.smooth },
};

export const fadeDown: Variants = {
  hidden: { opacity: 0, y: -18 },
  visible: { opacity: 1, y: 0, transition: transitions.smooth },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: transitions.smooth },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: transitions.smooth },
};

export const blurReveal: Variants = {
  hidden: { opacity: 0, filter: 'blur(10px)', y: 12 },
  visible: { opacity: 1, filter: 'blur(0px)', y: 0, transition: { duration: duration.slow, ease: easing.smooth } },
};

/** ใช้กับ container ที่มีลูกหลายตัว ให้ลูกทยอยปรากฏ */
export const stagger = (delayChildren = 0.05, staggerChildren = 0.08): Variants => ({
  hidden: {},
  visible: { transition: { delayChildren, staggerChildren } },
});

/** ใช้กับ scroll reveal — เล่นครั้งเดียวเมื่อเลื่อนมาถึง */
export const viewportOnce = { once: true, margin: '-80px' } as const;

/** เปลี่ยนหน้าแบบนุ่มนวล ใช้กับ <AnimatePresence> ที่ระดับ route */
export const pageTransition: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: transitions.smooth },
  exit: { opacity: 0, y: -8, transition: transitions.fast },
};
