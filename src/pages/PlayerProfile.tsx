import { AgeCurveChart } from '../components/player/AgeCurveChart';
import { MetricsGrid } from '../components/player/MetricsGrid';
import { PeerComparisonTable } from '../components/player/PeerComparisonTable';
import { PlayerHeader } from '../components/player/PlayerHeader';
import type { AgeCurvePoint, PeerPlayer } from '../types';

const playerCurve: AgeCurvePoint[] = [21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31].map((age, i) => ({
  age,
  value: 0.42 + i * 0.07 - i * i * 0.004,
}));
const positionAverage: AgeCurvePoint[] = [21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31].map((age, i) => ({
  age,
  value: 0.4 + i * 0.06 - i * i * 0.0035,
}));

const peers: PeerPlayer[] = [
  { name: 'A. Monarch', age: 26, production: 0.87, trajectory: 'rising', percentile: 93 },
  { name: 'J. Quill', age: 28, production: 0.81, trajectory: 'stable', percentile: 88 },
  { name: 'C. Vale', age: 29, production: 0.74, trajectory: 'decline', percentile: 77 },
  { name: 'D. Mercer', age: 27, production: 0.84, trajectory: 'rising', percentile: 90, isCurrentPlayer: true },
  { name: 'T. Cross', age: 27, production: 0.79, trajectory: 'stable', percentile: 82 },
];

export function PlayerProfile() {
  return (
    <main className="min-h-screen space-y-6 bg-[#0a0a0f] p-6 text-white">
      <PlayerHeader name="Dorian Mercer" position="WR" team="SF" age={27} trajectoryScore={91.3} peakWindow={[25, 28]} />
      <MetricsGrid
        metrics={[
          { label: 'Current Production', value: '0.84', tone: 'good' },
          { label: 'Age Modifier', value: '+0.06', tone: 'good' },
          { label: 'Peer Percentile', value: '90th', tone: 'good' },
          { label: 'Decline Risk', value: 'Low', tone: 'neutral' },
        ]}
      />
      <AgeCurveChart playerData={playerCurve} positionAverage={positionAverage} currentAge={27} peakWindow={[25, 28]} />
      <PeerComparisonTable peers={peers} currentPlayerName="D. Mercer" />
    </main>
  );
}
