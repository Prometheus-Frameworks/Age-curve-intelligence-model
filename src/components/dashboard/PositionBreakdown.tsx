import type { Position } from '../../types';
import { Card } from '../ui/Card';

interface PositionBreakdownProps {
  items: Array<{ position: Position; players: number; peakAge: number; confidence: number; color: string }>;
}

export function PositionBreakdown({ items }: PositionBreakdownProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.position} className="p-5">
          <p className="text-xs uppercase tracking-wider text-slate-500">{item.position}</p>
          <p className="mt-2 text-xl font-bold text-white">{item.players} Players</p>
          <p className="text-sm text-slate-400">Peak age: {item.peakAge}</p>
          <p className="text-sm" style={{ color: item.color }}>
            Confidence: {(item.confidence * 100).toFixed(0)}%
          </p>
        </Card>
      ))}
    </div>
  );
}
