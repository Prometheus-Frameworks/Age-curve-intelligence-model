import { useMemo, useState } from 'react';
import type { PositionCurve } from '../../types';
import { Card } from '../ui/Card';

export interface AgeCurvePreviewProps {
  curves: PositionCurve[];
}

const WIDTH = 840;
const HEIGHT = 220;
const PADDING = 28;

export function AgeCurvePreview({ curves }: AgeCurvePreviewProps) {
  const [hover, setHover] = useState<{ x: number; y: number; label: string } | null>(null);

  const scale = useMemo(() => {
    const minAge = 21;
    const maxAge = 31;
    return {
      x: (age: number) => PADDING + ((age - minAge) / (maxAge - minAge)) * (WIDTH - PADDING * 2),
      y: (value: number) => HEIGHT - PADDING - value * (HEIGHT - PADDING * 2),
    };
  }, []);

  const peaks = useMemo(
    () =>
      curves.map((curve) =>
        curve.data.reduce((best, point) => (point.value > best.value ? point : best), curve.data[0]),
      ),
    [curves],
  );

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">Age Curve Preview</h3>
        <div className="flex gap-3 text-xs">
          {curves.map((c) => (
            <span key={c.position} className="inline-flex items-center gap-1 text-slate-400">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} />
              {c.position}
            </span>
          ))}
        </div>
      </div>
      <div className="relative overflow-x-auto">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-[220px] w-full min-w-[700px]">
          {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
            <line
              key={tick}
              x1={PADDING}
              y1={scale.y(tick)}
              x2={WIDTH - PADDING}
              y2={scale.y(tick)}
              stroke="#1f1f2e"
              strokeDasharray="4 4"
            />
          ))}
          {curves.map((curve) => {
            const d = curve.data
              .map((point, i) => `${i === 0 ? 'M' : 'L'} ${scale.x(point.age).toFixed(2)} ${scale.y(point.value).toFixed(2)}`)
              .join(' ');
            return <path key={curve.position} d={d} fill="none" stroke={curve.color} strokeWidth={2.5} strokeLinecap="round" />;
          })}
          {peaks.map((peak, i) => {
            const curve = curves[i];
            if (!peak || !curve) return null;
            return (
              <circle
                key={`${curve.position}-${peak.age}`}
                cx={scale.x(peak.age)}
                cy={scale.y(peak.value)}
                r={4}
                fill={curve.color}
                onMouseEnter={() =>
                  setHover({ x: scale.x(peak.age), y: scale.y(peak.value), label: `${curve.position} peak: ${peak.value.toFixed(2)}` })
                }
                onMouseLeave={() => setHover(null)}
              />
            );
          })}
        </svg>
        {hover ? (
          <div
            className="pointer-events-none absolute rounded bg-[#0a0a0f] px-2 py-1 text-xs text-slate-200 border border-[#1f1f2e]"
            style={{ left: hover.x - 40, top: hover.y - 36 }}
          >
            {hover.label}
          </div>
        ) : null}
      </div>
    </Card>
  );
}
