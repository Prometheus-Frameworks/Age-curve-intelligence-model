import { Card } from '../ui/Card';

interface MetricsGridProps {
  metrics: Array<{ label: string; value: string; tone?: 'neutral' | 'good' | 'bad' }>;
}

export function MetricsGrid({ metrics }: MetricsGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {metrics.map((m) => (
        <Card key={m.label} className="p-5">
          <p className="text-xs uppercase tracking-wider text-slate-500">{m.label}</p>
          <p
            className={`mt-2 font-mono text-2xl font-bold ${
              m.tone === 'good' ? 'text-green-300' : m.tone === 'bad' ? 'text-red-300' : 'text-white'
            }`}
          >
            {m.value}
          </p>
        </Card>
      ))}
    </div>
  );
}
