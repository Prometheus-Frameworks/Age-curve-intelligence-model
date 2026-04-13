import { Card } from '../ui/Card';
import type { PlayerDetail, Position } from '../../lib/apiClient';

interface PlayerDetailCardProps {
  playerDetail: PlayerDetail | null;
  playerError: string | null;
  playersError: string | null;
  allPlayers: Array<{ playerId: string; playerName: string; season: number; position: Position }>;
  onQuickSelect: (value: string) => void;
  scoreText: (value: number | null) => string;
}

function flagClass(severity: 'info' | 'warning') {
  return severity === 'warning' ? 'flag-chip flag-chip-warning' : 'flag-chip flag-chip-info';
}

export function PlayerDetailCard({ playerDetail, playerError, playersError, allPlayers, onQuickSelect, scoreText }: PlayerDetailCardProps) {
  return (
    <Card className="space-y-4 h-full">
      <h2 className="text-lg font-bold">Player detail</h2>
      {playersError ? <p className="text-sm text-red-200">{playersError}</p> : null}
      <div>
        <label className="text-sm text-slate-400">Quick player picker</label>
        <select className="w-full mt-1" onChange={(event) => onQuickSelect(event.target.value)} value={playerDetail ? `${playerDetail.playerId}::${playerDetail.season}` : ''}>
          <option value="">Select a player result</option>
          {allPlayers.map((player) => (
            <option key={`${player.playerId}-${player.season}`} value={`${player.playerId}::${player.season}`}>
              {player.playerName} ({player.position}, {player.season})
            </option>
          ))}
        </select>
      </div>
      {playerError ? <p className="text-sm text-red-200">{playerError}</p> : null}
      {!playerDetail ? <p className="text-sm text-slate-400">Select a row in the position browser to load details.</p> : null}
      {playerDetail ? (
        <div className="space-y-4">
          <div className="detail-hero">
            <p className="text-xs uppercase tracking-wider text-slate-500">Selected profile</p>
            <h3 className="text-xl">{playerDetail.playerName}</h3>
            <p className="text-sm text-slate-300">{playerDetail.position} • {playerDetail.season} • Age {playerDetail.age}</p>
          </div>
          <div className="grid gap-2 md:grid-cols-2 detail-grid">
            <p><strong>Trajectory score:</strong> {scoreText(playerDetail.ageTrajectoryScore)}</p>
            <p><strong>Curve status:</strong> {playerDetail.ageCurveStatus}</p>
            <p><strong>Age band stage:</strong> {playerDetail.ageBandStage}</p>
            <p><strong>Modifier bucket:</strong> {playerDetail.recommendedModifierBucket ?? '—'}</p>
            <p><strong>Modifier magnitude:</strong> {scoreText(playerDetail.modifierMagnitude)}</p>
          </div>
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wider text-slate-500">Flags</p>
            {playerDetail.flags.length ? (
              <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                {playerDetail.flags.map((flag) => (
                  <span key={`${flag.code}-${flag.label}`} className={flagClass(flag.severity)} title={flag.message}>
                    {flag.label} ({flag.code})
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">No flags.</p>
            )}
          </div>
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wider text-slate-500">Context summary</p>
            <p><strong>Overall:</strong> {playerDetail.overallReasonSummary}</p>
            <p><strong>Production:</strong> {playerDetail.productionReason}</p>
            <p><strong>Role:</strong> {playerDetail.roleReason}</p>
            <p><strong>Efficiency:</strong> {playerDetail.efficiencyReason}</p>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
