import { useCallback, useState } from 'react';
import type { PipelineStep } from '../types';

function simulateProgress(from: number, to: number, durationMs: number, cb: (v: number) => void): Promise<void> {
  return new Promise((resolve) => {
    const start = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(1, elapsed / durationMs);
      const value = from + (to - from) * pct;
      cb(value);
      if (pct >= 1) {
        clearInterval(timer);
        resolve();
      }
    }, 40);
  });
}

export function usePipeline() {
  const [state, setState] = useState<PipelineStep>('idle');
  const [progress, setProgress] = useState(0);

  const runPipeline = useCallback(async (_file: File) => {
    setState('uploading');
    await simulateProgress(0, 1, 1000, setProgress);

    setState('processing');
    await simulateProgress(0, 1, 2000, setProgress);

    setState('validating');
    await simulateProgress(0, 1, 1000, setProgress);

    setState('complete');
    setProgress(1);
  }, []);

  const reset = useCallback(() => {
    setState('idle');
    setProgress(0);
  }, []);

  return { state, progress, runPipeline, reset };
}
