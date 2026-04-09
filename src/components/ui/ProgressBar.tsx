import { cn } from './utils';

interface ProgressBarProps {
  value: number;
  className?: string;
  active?: boolean;
}

export function ProgressBar({ value, className, active }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(1, value));

  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-[#0a0a0f] border border-[#1f1f2e]', className)}>
      <div
        className={cn(
          'h-full rounded-full bg-cyan-500 transition-all duration-300 ease-out',
          active && 'animate-pulse',
        )}
        style={{ width: `${clamped * 100}%` }}
      />
    </div>
  );
}
