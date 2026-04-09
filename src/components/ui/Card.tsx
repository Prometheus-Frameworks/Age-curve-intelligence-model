import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { cn } from './utils';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        'rounded-2xl border border-[#1f1f2e] bg-[#111118] p-6 transition-colors hover:bg-[#1a1a24]',
        className,
      )}
    >
      {children}
    </motion.div>
  );
}
