import type { ValidationResult } from '../../types';
import { Card } from '../ui/Card';

interface ValidationPanelProps {
  result: ValidationResult;
}

export function ValidationPanel({ result }: ValidationPanelProps) {
  const pct = result.totalCases ? Math.round((result.passedCases / result.totalCases) * 100) : 0;
  const angle = (pct / 100) * 360;

  return (
    <Card className="space-y-4">
      <h3 className="text-lg font-bold text-white">Validation</h3>
      <div className="flex items-center gap-6">
        <div
          className="grid h-28 w-28 place-items-center rounded-full"
          style={{ background: `conic-gradient(#22c55e ${angle}deg, #1f1f2e ${angle}deg)` }}
        >
          <div className="grid h-20 w-20 place-items-center rounded-full bg-[#111118] text-white">
            <span className="font-mono text-xl">{pct}%</span>
          </div>
        </div>
        <div className="space-y-1 text-sm text-slate-300">
          <p>Passed: {result.passedCases}</p>
          <p>Failed: {result.failedCases}</p>
          <p>Total: {result.totalCases}</p>
        </div>
      </div>
      <div className="space-y-2">
        {result.failures.map((failure) => (
          <div key={failure.test} className="rounded-lg border border-red-400/20 bg-red-500/10 p-3">
            <p className="text-xs uppercase tracking-wider text-red-300">{failure.test}</p>
            <p className="text-sm text-red-200">{failure.error}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
