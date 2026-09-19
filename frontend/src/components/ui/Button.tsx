import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

type Variant = 'primary' | 'ghost' | 'outline' | 'danger' | 'subtle';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-gradient-to-br from-brand-400 to-brand-700 text-white shadow-glow hover:shadow-[0_10px_26px_rgb(10_132_255_/_0.38)]',
  ghost: 'glass text-ink hover:border-hairline/25',
  outline: 'border border-hairline/25 bg-transparent text-ink hover:bg-brand-500/[0.08]',
  danger: 'bg-danger text-white hover:bg-danger/90',
  subtle: 'bg-brand-500/[0.10] text-brand-500 hover:bg-brand-500/[0.16]',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-[13px] rounded-sm gap-1.5',
  md: 'h-11 px-5 text-sm rounded gap-2',
  lg: 'h-13 px-7 text-base rounded-lg gap-2.5',
};

/**
 * ปุ่มมาตรฐานของระบบ
 * ระหว่างกำลังทำงานจะถูก disable อัตโนมัติ เพื่อกันผู้ใช้กดซ้ำจนเกิดข้อมูลซ้ำในฐานข้อมูล
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={cn(
        'inline-flex items-center justify-center font-display font-semibold whitespace-nowrap',
        'transition-[box-shadow,background-color,transform] duration-200 ease-smooth',
        'disabled:cursor-not-allowed disabled:opacity-55',
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    >
      {isLoading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : leftIcon}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
}
