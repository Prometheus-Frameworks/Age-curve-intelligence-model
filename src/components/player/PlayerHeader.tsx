import type { Position } from '../../types';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';

export interface PlayerHeaderProps {
  name: string;
  position: Position;
  team: string;
  age: number;
  trajectoryScore: number;
  avatarUrl?: string;
  peakWindow: [number, number];
}

const positionColors: Record<Position, string> = {
  QB: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  RB: 'bg-green-500/20 text-green-300 border-green-500/30',
  WR: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  TE: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
};

export function PlayerHeader({ name, position, team, age, trajectoryScore, avatarUrl, peakWindow }: PlayerHeaderProps) {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const inPeak = age >= peakWindow[0] && age <= peakWindow[1];

  return (
    <Card className="flex items-center justify-between gap-6">
      <div className="flex items-center gap-4">
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} className="h-[60px] w-[60px] rounded-full object-cover" />
        ) : (
          <div className="grid h-[60px] w-[60px] place-items-center rounded-full bg-slate-700 text-white">{initials}</div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-white">{name}</h1>
          <p className="text-sm text-slate-400">
            {position} • {team} • Age {age}
          </p>
          <div className="mt-2 flex gap-2">
            <Badge className={positionColors[position]}>{position}</Badge>
            {inPeak ? <Badge variant="success">In Peak Window</Badge> : <Badge variant="warning">Outside Peak</Badge>}
          </div>
        </div>
      </div>
      <div className="text-right">
        <p className="font-mono text-4xl font-bold text-cyan-300">{trajectoryScore.toFixed(1)}</p>
        <p className="text-xs uppercase tracking-wider text-slate-500">Trajectory Score</p>
      </div>
    </Card>
  );
}
