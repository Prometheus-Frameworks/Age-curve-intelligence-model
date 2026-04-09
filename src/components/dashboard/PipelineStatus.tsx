import { motion } from 'framer-motion';
import type { PipelineStep } from '../../types';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';
import { cn } from '../ui/utils';

export interface PipelineStatusProps {
  currentStep: PipelineStep;
  uploadProgress?: number;
  processStep?: number;
  totalProcessSteps?: number;
  validationPassed?: number;
  validationTotal?: number;
  lastRunFile?: string;
  lastRunTimestamp?: string;
}

type StepId = Exclude<PipelineStep, 'idle'>;

const orderedSteps: StepId[] = ['uploading', 'processing', 'validating', 'complete'];

function getStepStatus(currentStep: PipelineStep, step: StepId): 'complete' | 'active' | 'pending' {
  const currentIndex = currentStep === 'idle' ? -1 : orderedSteps.indexOf(currentStep as StepId);
  const stepIndex = orderedSteps.indexOf(step);

  if (stepIndex < currentIndex) return 'complete';
  if (stepIndex === currentIndex) return 'active';
  return 'pending';
}

export function PipelineStatus(props: PipelineStatusProps) {
  const details: Record<StepId, string> = {
    uploading: `${props.uploadProgress ?? 0}% uploaded`,
    processing: `Step ${props.processStep ?? 0}/${props.totalProcessSteps ?? 5}`,
    validating: `${props.validationPassed ?? 0}/${props.validationTotal ?? 0} tests`,
    complete: props.lastRunTimestamp ?? 'Ready',
  };

  return (
    <Card className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Pipeline Status</h2>
          <p className="text-sm text-slate-400">{props.lastRunFile ? `Last file: ${props.lastRunFile}` : 'Awaiting upload'}</p>
        </div>
        <span className="text-xs uppercase tracking-wider text-slate-500">State: {props.currentStep}</span>
      </div>
      <div className="flex items-start justify-between gap-3">
        {orderedSteps.map((step, i) => {
          const status = getStepStatus(props.currentStep, step);
          return (
            <div key={step} className="flex flex-1 items-center gap-2">
              <div className="flex flex-col items-center text-center">
                <motion.div
                  className={cn(
                    'relative flex h-10 w-10 items-center justify-center rounded-full border text-white',
                    status === 'complete' && 'border-green-400 bg-green-500',
                    status === 'active' && 'border-cyan-400 bg-cyan-500',
                    status === 'pending' && 'border-[#1f1f2e] bg-gray-800 text-slate-500',
                  )}
                  animate={status === 'active' ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                  transition={{ repeat: status === 'active' ? Infinity : 0, duration: 1.2 }}
                >
                  <Icon name={status === 'complete' ? 'complete' : step} className="h-4 w-4" />
                </motion.div>
                <span className="mt-2 text-sm font-medium capitalize text-white">{step.replace('ing', '')}</span>
                <span className="text-xs text-slate-500">{details[step]}</span>
              </div>
              {i < orderedSteps.length - 1 ? <div className="mt-5 h-px flex-1 bg-[#1f1f2e]" /> : null}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
