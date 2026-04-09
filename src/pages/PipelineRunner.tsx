import { useMemo } from 'react';
import { PipelineStateCard } from '../components/pipeline/PipelineStateCard';
import { usePipeline } from '../hooks/usePipeline';

const STATES = ['idle', 'uploading', 'processing', 'validating', 'complete'] as const;

export function PipelineRunner() {
  const { state, progress, runPipeline, reset } = usePipeline();

  const activeIdx = useMemo(() => STATES.indexOf(state), [state]);

  return (
    <main className="min-h-screen space-y-4 bg-[#0a0a0f] p-6 text-white">
      <h1 className="text-2xl font-bold">Pipeline Runner</h1>
      {STATES.map((s, i) => (
        <PipelineStateCard
          key={s}
          state={i < activeIdx ? 'complete' : i === activeIdx ? s : 'idle'}
          title={s[0].toUpperCase() + s.slice(1)}
          subtitle={i < activeIdx ? 'Completed' : i === activeIdx ? 'In progress' : 'Pending'}
          progress={i === activeIdx ? progress : i < activeIdx ? 1 : 0}
          actionLabel={i === 0 ? 'Run' : i === STATES.length - 1 ? 'Reset' : undefined}
          onAction={i === 0 ? () => runPipeline(new File(['demo'], 'mock.csv')) : i === STATES.length - 1 ? reset : undefined}
        />
      ))}
    </main>
  );
}
