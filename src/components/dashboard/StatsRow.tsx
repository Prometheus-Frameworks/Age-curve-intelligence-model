import { Card } from '../ui/Card';

interface StatItem {
  label: string;
  value: string;
  delta?: string;
}

interface StatsRowProps {
  stats: StatItem[];
}

export function StatsRow({ stats }: StatsRowProps) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="p-5">
          <p className="text-xs uppercase tracking-wider text-slate-500">{stat.label}</p>
          <p className="mt-2 font-mono text-2xl font-bold text-white">{stat.value}</p>
          {stat.delta ? <p className="mt-1 text-sm text-cyan-300">{stat.delta}</p> : null}
        </Card>
      ))}
    </div>
  );
}
