import type { AgeCurvePoint } from '../../types';
import { Card } from '../ui/Card';

export interface AgeCurveChartProps {
  playerData: AgeCurvePoint[];
  positionAverage: AgeCurvePoint[];
  currentAge: number;
  peakWindow: [number, number];
}

const WIDTH = 840;
const HEIGHT = 280;
const PAD = 30;

export function AgeCurveChart({ playerData, positionAverage, currentAge, peakWindow }: AgeCurveChartProps) {
  const x = (age: number) => PAD + ((age - 21) / 10) * (WIDTH - PAD * 2);
  const y = (value: number) => HEIGHT - PAD - value * (HEIGHT - PAD * 2);

  const playerPath = playerData.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(p.age)} ${y(p.value)}`).join(' ');
  const avgPath = positionAverage.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(p.age)} ${y(p.value)}`).join(' ');
  const current = playerData.find((p) => p.age === currentAge) ?? playerData[playerData.length - 1];

  return (
    <Card>
      <h3 className="mb-3 text-lg font-bold text-white">Player vs Position Curve</h3>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-[280px] w-full">
        <rect x={x(peakWindow[0])} y={PAD} width={x(peakWindow[1]) - x(peakWindow[0])} height={HEIGHT - PAD * 2} fill="#22c55e22" />
        <path d={avgPath} fill="none" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" />
        <path d={playerPath} fill="none" stroke="#06b6d4" strokeWidth={3} />
        <line x1={x(currentAge)} y1={PAD} x2={x(currentAge)} y2={HEIGHT - PAD} stroke="#3b82f6" strokeDasharray="4 4" />
        <circle cx={x(current.age)} cy={y(current.value)} r={5} fill="#06b6d4" />
      </svg>
    </Card>
  );
}
