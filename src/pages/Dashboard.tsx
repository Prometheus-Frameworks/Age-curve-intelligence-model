import { ArtifactList } from '../components/dashboard/ArtifactList';
import { AgeCurvePreview } from '../components/dashboard/AgeCurvePreview';
import { PipelineStatus } from '../components/dashboard/PipelineStatus';
import { PositionBreakdown } from '../components/dashboard/PositionBreakdown';
import { StatsRow } from '../components/dashboard/StatsRow';
import { ValidationPanel } from '../components/dashboard/ValidationPanel';
import type { Artifact, PositionCurve, ValidationResult } from '../types';

const mockStats = [
  { label: 'Rows Processed', value: '12,842', delta: '+3.2%' },
  { label: 'Players Included', value: '1,276' },
  { label: 'Artifacts Generated', value: '9' },
  { label: 'Pipeline Runtime', value: '4.2s' },
];

const mockCurves: PositionCurve[] = [
  { position: 'QB', color: '#3b82f6', data: [21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31].map((age, i) => ({ age, value: 0.52 + i * 0.04 - i * i * 0.002 })) },
  { position: 'RB', color: '#22c55e', data: [21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31].map((age, i) => ({ age, value: 0.6 + i * 0.05 - i * i * 0.004 })) },
  { position: 'WR', color: '#8b5cf6', data: [21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31].map((age, i) => ({ age, value: 0.48 + i * 0.045 - i * i * 0.003 })) },
  { position: 'TE', color: '#f59e0b', data: [21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31].map((age, i) => ({ age, value: 0.44 + i * 0.04 - i * i * 0.0025 })) },
];

const mockArtifacts: Artifact[] = [
  { name: 'age_curves_by_position.json', type: 'curves', size: '84 KB', generatedAt: '2026-04-09T00:00:00Z', url: '#' },
  { name: 'tiber_age_modifiers.json', type: 'modifiers', size: '19 KB', generatedAt: '2026-04-09T00:00:00Z', url: '#' },
  { name: 'validation_report.json', type: 'validation', size: '8 KB', generatedAt: '2026-04-09T00:00:00Z', url: '#' },
];

const mockValidation: ValidationResult = {
  totalCases: 30,
  passedCases: 27,
  failedCases: 3,
  failures: [
    { test: 'window_consistency', error: 'Peak window overlaps decline onset in WR bucket.' },
    { test: 'modifier_boundaries', error: 'Two RB modifiers exceeded upper threshold.' },
    { test: 'cohort_sample_min', error: 'TE age 31 sample under minimum (n=4).' },
  ],
};

export function Dashboard() {
  return (
    <main className="min-h-screen space-y-6 bg-[#0a0a0f] p-6 text-white">
      <PipelineStatus
        currentStep="validating"
        uploadProgress={100}
        processStep={5}
        totalProcessSteps={5}
        validationPassed={27}
        validationTotal={30}
        lastRunFile="tiber-export-2026-04-09.csv"
        lastRunTimestamp="2026-04-09 00:03 UTC"
      />
      <StatsRow stats={mockStats} />
      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <AgeCurvePreview curves={mockCurves} />
        <ValidationPanel result={mockValidation} />
      </div>
      <PositionBreakdown
        items={[
          { position: 'QB', players: 138, peakAge: 28, confidence: 0.92, color: '#3b82f6' },
          { position: 'RB', players: 295, peakAge: 25, confidence: 0.89, color: '#22c55e' },
          { position: 'WR', players: 412, peakAge: 26, confidence: 0.91, color: '#8b5cf6' },
          { position: 'TE', players: 188, peakAge: 27, confidence: 0.84, color: '#f59e0b' },
        ]}
      />
      <ArtifactList artifacts={mockArtifacts} onDownload={(a) => console.log('download', a)} onPreview={(a) => console.log('preview', a)} />
    </main>
  );
}
