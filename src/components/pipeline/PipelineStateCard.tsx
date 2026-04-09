import { motion } from 'framer-motion';
import type { PipelineStep } from '../../types';
import { ProgressBar } from '../ui/ProgressBar';
import { Icon } from '../ui/Icon';

export interface PipelineStateCardProps {
  state: PipelineStep;
  title: string;
  subtitle: string;
  progress?: number;
  actionLabel?: string;
  onAction?: () => void;
}

const stateColors: Record<PipelineStep, string> = {
  idle: 'border-slate-700',
  uploading: 'border-cyan-500/40',
  processing: 'border-blue-500/40',
  validating: 'border-amber-500/40',
  complete: 'border-green-500/40',
};

export function PipelineStateCard({ state, title, subtitle, progress = 0, actionLabel, onAction }: PipelineStateCardProps) {
  const active = state === 'uploading' || state === 'processing' || state === 'validating';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`rounded-xl border bg-[#111118] p-5 ${stateColors[state]}`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-[#0a0a0f] text-slate-200">
            <Icon name={state} className="h-4 w-4" />
          </div>
          <div>
            <p className="font-semibold text-white">{title}</p>
            <p className="text-sm text-slate-400">{subtitle}</p>
          </div>
        </div>
        {actionLabel && onAction ? (
          <button onClick={onAction} className="rounded-lg bg-cyan-500 px-3 py-1.5 text-sm font-medium text-black hover:bg-cyan-400">
            {actionLabel}
          </button>
        ) : null}
      </div>
      {active ? <ProgressBar className="mt-4" value={progress} active /> : null}
    </motion.div>
  );
}
