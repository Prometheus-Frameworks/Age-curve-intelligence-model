import type { ReactNode } from 'react';
import { cn } from './utils';

interface BadgeProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'danger';
}

const variantStyles: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  secondary: 'bg-slate-700/40 text-slate-300 border-slate-600',
  success: 'bg-green-500/20 text-green-300 border-green-500/30',
  warning: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  danger: 'bg-red-500/20 text-red-300 border-red-500/30',
};

export function Badge({ children, className, variant = 'default' }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-wider',
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
