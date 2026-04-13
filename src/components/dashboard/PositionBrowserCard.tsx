import { Card } from '../ui/Card';
import type { Position, PositionPlayerRow } from '../../lib/apiClient';

type SortColumn = 'playerName' | 'season' | 'age' | 'ageTrajectoryScore' | 'recommendedModifierBucket';

interface PositionBrowserCardProps {
  positions: Position[];
  activePosition: Position;
  onChangePosition: (position: Position) => void;
  filterText: string;
  onChangeFilterText: (value: string) => void;
  loadingPosition: boolean;
  positionError: string | null;
  filteredRows: PositionPlayerRow[];
  selectedPlayerKey: string | null;
  onSelectPlayer: (playerId: string, season: number) => void;
  sortColumn: SortColumn;
  sortDirection: 'asc' | 'desc';
  onToggleSort: (column: SortColumn) => void;
  scoreText: (value: number | null) => string;
}

function sortIndicator(column: SortColumn, sortColumn: SortColumn, sortDirection: 'asc' | 'desc') {
  if (column !== sortColumn) return '';
  return sortDirection === 'asc' ? ' ↑' : ' ↓';
}

export function PositionBrowserCard({
  positions,
  activePosition,
  onChangePosition,
  filterText,
  onChangeFilterText,
  loadingPosition,
  positionError,
  filteredRows,
  selectedPlayerKey,
  onSelectPlayer,
  sortColumn,
  sortDirection,
  onToggleSort,
  scoreText,
}: PositionBrowserCardProps) {
  return (
    <Card className="space-y-4 h-full">
      <div className="flex items-center justify-between gap-3" style={{ flexWrap: 'wrap' }}>
        <h2 className="text-lg font-bold">Position browser</h2>
        <p className="text-xs text-slate-400">Select a row to open contextual profile</p>
      </div>
      <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
        {positions.map((position) => (
          <button
            key={position}
            onClick={() => onChangePosition(position)}
            style={position === activePosition ? { borderColor: '#22d3ee', color: '#fff', background: '#0f2430' } : undefined}
          >
            {position}
          </button>
        ))}
      </div>
      <input
        className="w-full"
        placeholder="Filter by name, player ID, or season"
        value={filterText}
        onChange={(event) => onChangeFilterText(event.target.value)}
      />
      {loadingPosition ? <p className="text-sm text-slate-400">Loading {activePosition} results…</p> : null}
      {positionError ? <p className="text-sm text-red-200">{positionError}</p> : null}
      {!loadingPosition && !positionError && filteredRows.length === 0 ? <p className="text-sm text-slate-400">No rows match this filter.</p> : null}
      {filteredRows.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm browser-table">
            <thead>
              <tr className="text-left text-slate-400">
                <th><button onClick={() => onToggleSort('playerName')}>Player{sortIndicator('playerName', sortColumn, sortDirection)}</button></th>
                <th><button onClick={() => onToggleSort('season')}>Season{sortIndicator('season', sortColumn, sortDirection)}</button></th>
                <th><button onClick={() => onToggleSort('age')}>Age{sortIndicator('age', sortColumn, sortDirection)}</button></th>
                <th><button onClick={() => onToggleSort('ageTrajectoryScore')}>Trajectory{sortIndicator('ageTrajectoryScore', sortColumn, sortDirection)}</button></th>
                <th>Status</th>
                <th>Age band</th>
                <th><button onClick={() => onToggleSort('recommendedModifierBucket')}>Modifier bucket{sortIndicator('recommendedModifierBucket', sortColumn, sortDirection)}</button></th>
                <th>Reason summary</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => {
                const rowKey = `${row.playerId}-${row.season}`;
                const isSelected = selectedPlayerKey === rowKey;
                return (
                  <tr
                    key={rowKey}
                    className={isSelected ? 'is-selected' : undefined}
                    style={{ cursor: 'pointer' }}
                    onClick={() => onSelectPlayer(row.playerId, row.season)}
                    aria-selected={isSelected}
                  >
                    <td className="font-medium">{row.playerName}</td>
                    <td>{row.season}</td>
                    <td>{row.age}</td>
                    <td>{scoreText(row.ageTrajectoryScore)}</td>
                    <td>{row.ageCurveStatus}</td>
                    <td>{row.ageBandStage}</td>
                    <td>{row.recommendedModifierBucket}</td>
                    <td className="table-reason">{row.overallReasonSummary}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </Card>
  );
}
