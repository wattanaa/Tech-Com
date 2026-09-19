import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface GlassCardProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  /** strong = ทึบขึ้น อ่านง่ายขึ้น ใช้กับการ์ดที่มีข้อความเยอะ */
  variant?: 'default' | 'strong';
  /** ยกขึ้นเล็กน้อยเมื่อชี้เมาส์ — ใช้กับการ์ดที่คลิกได้เท่านั้น */
  interactive?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  as?: ElementType;
}

const paddingMap = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-7',
} as const;

/**
 * พื้นผิวกระจกมาตรฐานของระบบ — การ์ด กล่องสถิติ แผงฟอร์ม ใช้ตัวนี้ทั้งหมด
 * ห้ามเขียน backdrop-blur เองใน component อื่น เพื่อให้ความโปร่งเท่ากันทั้งเว็บไซต์
 */
export function GlassCard({
  children,
  variant = 'default',
  interactive = false,
  padding = 'md',
  as: Tag = 'div',
  className,
  ...rest
}: GlassCardProps) {
  return (
    <Tag
      className={cn(
        variant === 'strong' ? 'glass-strong' : 'glass',
        'rounded-lg',
        paddingMap[padding],
        interactive &&
          'transition-[transform,box-shadow] duration-300 ease-smooth hover:-translate-y-1 hover:shadow-card',
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}
