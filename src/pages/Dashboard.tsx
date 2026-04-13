import { useEffect, useMemo, useState } from 'react';
import { Card } from '../components/ui/Card';
import {
  getArtifacts,
  getPlayerDetail,
  getPlayers,
  getPositionSummary,
  getResultsSummary,
  runResearch,
  runValidation,
  type PlayerDetail,
  type Position,
  type PositionPlayerRow,
  type ResultsSummary,
} from '../lib/apiClient';

const POSITIONS: Position[] = ['QB', 'RB', 'WR', 'TE'];

type SortColumn = 'playerName' | 'season' | 'age' | 'ageTrajectoryScore' | 'recommendedModifierBucket';

function formatUtc(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('en-US', { timeZone: 'UTC' }) + ' UTC';
}

function scoreText(value: number | null) {
  if (value === null) return '—';
  return value.toFixed(3);
}

export function Dashboard() {
  const [summary, setSummary] = useState<ResultsSummary | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [artifacts, setArtifacts] = useState<string[]>([]);
  const [artifactError, setArtifactError] = useState<string | null>(null);
  const [activePosition, setActivePosition] = useState<Position>('QB');
  const [positionRows, setPositionRows] = useState<PositionPlayerRow[]>([]);
  const [positionError, setPositionError] = useState<string | null>(null);
  const [filterText, setFilterText] = useState('');
  const [sortColumn, setSortColumn] = useState<SortColumn>('ageTrajectoryScore');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [playerDetail, setPlayerDetail] = useState<PlayerDetail | null>(null);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [allPlayers, setAllPlayers] = useState<Array<{ playerId: string; playerName: string; season: number; position: Position }>>([]);
  const [playersError, setPlayersError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [actionState, setActionState] = useState<'idle' | 'running-research' | 'running-validation'>('idle');
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingPosition, setLoadingPosition] = useState(true);

  const refreshCoreData = async () => {
    setLoadingSummary(true);
    const [summaryResult, artifactResult, playersResult] = await Promise.allSettled([getResultsSummary(), getArtifacts(), getPlayers()]);

    if (summaryResult.status === 'fulfilled') {
      setSummary(summaryResult.value);
      setSummaryError(null);
    } else {
      setSummary(null);
      setSummaryError(summaryResult.reason instanceof Error ? summaryResult.reason.message : 'Failed to load summary.');
    }

    if (artifactResult.status === 'fulfilled') {
      setArtifacts(artifactResult.value.artifacts);
      setArtifactError(null);
    } else {
      setArtifacts([]);
      setArtifactError(artifactResult.reason instanceof Error ? artifactResult.reason.message : 'Failed to load artifacts.');
    }

    if (playersResult.status === 'fulfilled') {
      setAllPlayers(playersResult.value.players);
      setPlayersError(null);
    } else {
      setAllPlayers([]);
      setPlayersError(playersResult.reason instanceof Error ? playersResult.reason.message : 'Failed to load player list.');
    }

    setLoadingSummary(false);
  };

  useEffect(() => {
    void refreshCoreData();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadPosition = async () => {
      setLoadingPosition(true);
      try {
        const result = await getPositionSummary(activePosition);
        if (cancelled) return;
        setPositionRows(result.playerRows);
        setPositionError(null);
      } catch (error) {
        if (cancelled) return;
        setPositionRows([]);
        setPositionError(error instanceof Error ? error.message : 'Failed to load position results.');
      } finally {
        if (!cancelled) setLoadingPosition(false);
      }
    };

    void loadPosition();
    return () => {
      cancelled = true;
    };
  }, [activePosition]);

  const filteredRows = useMemo(() => {
    const filtered = positionRows.filter((row) => {
      const search = filterText.trim().toLowerCase();
      if (!search) return true;
      return row.playerName.toLowerCase().includes(search) || row.playerId.toLowerCase().includes(search) || String(row.season).includes(search);
    });

    return [...filtered].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      if (typeof aValue === 'number' || aValue === null) {
        const aNumber = aValue ?? Number.NEGATIVE_INFINITY;
        const bNumber = (bValue as number | null) ?? Number.NEGATIVE_INFINITY;
        return sortDirection === 'asc' ? aNumber - bNumber : bNumber - aNumber;
      }

      const cmp = String(aValue).localeCompare(String(bValue));
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [positionRows, filterText, sortColumn, sortDirection]);

  const loadPlayer = async (playerId: string, season: number) => {
    try {
      setPlayerError(null);
      const detail = await getPlayerDetail(playerId, season);
      setPlayerDetail(detail);
    } catch (error) {
      setPlayerDetail(null);
      setPlayerError(error instanceof Error ? error.message : 'Failed to load player detail.');
    }
  };

  const toggleSort = (column: SortColumn) => {
    if (column === sortColumn) {
      setSortDirection((value) => (value === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortColumn(column);
    setSortDirection(column === 'playerName' || column === 'recommendedModifierBucket' ? 'asc' : 'desc');
  };

  const handleRunResearch = async () => {
    if (!selectedFile || actionState !== 'idle') return;
    setActionState('running-research');
    setActionMessage(null);
    try {
      await runResearch(selectedFile);
      setActionMessage(`Research run completed for ${selectedFile.name}.`);
      await refreshCoreData();
      const positionData = await getPositionSummary(activePosition);
      setPositionRows(positionData.playerRows);
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : 'Research run failed.');
    } finally {
      setActionState('idle');
    }
  };

  const handleRunValidation = async () => {
    if (actionState !== 'idle') return;
    setActionState('running-validation');
    setActionMessage(null);
    try {
      await runValidation();
      setActionMessage('Validation completed.');
      await refreshCoreData();
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : 'Validation failed.');
    } finally {
      setActionState('idle');
    }
  };

  return (
    <main className="min-h-screen space-y-6 bg-[#0a0a0f] p-6 text-white">
      <Card className="space-y-2">
        <h1 className="text-lg font-bold">TIBER Age Context v1</h1>
        <p className="text-sm text-slate-300">This module provides age context only. It does not provide rankings, projections, or trade advice.</p>
      </Card>

      <Card className="space-y-4">
        <h2 className="text-lg font-bold">Run controls</h2>
        <div className="flex gap-3 items-center" style={{ flexWrap: 'wrap' }}>
          <input type="file" accept=".csv,.json" onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)} />
          <button onClick={handleRunResearch} disabled={!selectedFile || actionState !== 'idle'}>
            {actionState === 'running-research' ? 'Running research...' : 'Upload + run research'}
          </button>
          <button onClick={handleRunValidation} disabled={actionState !== 'idle'}>
            {actionState === 'running-validation' ? 'Running validation...' : 'Run validation'}
          </button>
        </div>
        {actionMessage ? <p className="text-sm text-slate-300">{actionMessage}</p> : null}
      </Card>

      <Card className="space-y-4">
        <h2 className="text-lg font-bold">Dashboard summary</h2>
        {loadingSummary ? <p className="text-sm text-slate-400">Loading summary…</p> : null}
        {summaryError ? <p className="text-sm text-red-200">{summaryError}</p> : null}
        {summary ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500">Latest run</p>
              <p className="text-sm">{formatUtc(summary.latestRunMetadata?.lastRunTimestamp ?? summary.generatedAt)}</p>
              <p className="text-xs text-slate-400">{summary.latestRunMetadata?.lastUploadedFileName ?? 'Unknown source file'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500">Included rows</p>
              <p className="text-2xl font-mono">{summary.includedRowCount.toLocaleString('en-US')}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500">Positions covered</p>
              <p className="text-sm">{summary.positionsCovered.length ? summary.positionsCovered.join(', ') : 'No positions yet'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500">Validation status</p>
              <p className="text-sm">
                {summary.validation
                  ? `${summary.validation.passedCases}/${summary.validation.totalCases} cases passed`
                  : 'No validation report found'}
              </p>
            </div>
          </div>
        ) : null}
      </Card>

      <Card className="space-y-4">
        <h2 className="text-lg font-bold">Artifacts</h2>
        {artifactError ? <p className="text-sm text-red-200">{artifactError}</p> : null}
        {!artifactError && artifacts.length === 0 ? <p className="text-sm text-slate-400">No artifacts available.</p> : null}
        <p className="text-sm text-slate-300">Artifact count: {artifacts.length}</p>
        <div className="space-y-2">
          {artifacts.map((artifact) => (
            <div key={artifact} className="flex items-center justify-between rounded-lg border p-3">
              <span className="text-sm">{artifact}</span>
              <a href={`/api/artifacts/${encodeURIComponent(artifact)}`} download={artifact}>
                <button>Download</button>
              </a>
            </div>
          ))}
        </div>
      </Card>

      <Card className="space-y-4">
        <h2 className="text-lg font-bold">Position browser</h2>
        <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
          {POSITIONS.map((position) => (
            <button
              key={position}
              onClick={() => setActivePosition(position)}
              style={position === activePosition ? { borderColor: '#22d3ee', color: '#fff' } : undefined}
            >
              {position}
            </button>
          ))}
        </div>
        <input
          className="w-full"
          placeholder="Filter by name, player ID, or season"
          value={filterText}
          onChange={(event) => setFilterText(event.target.value)}
        />
        {loadingPosition ? <p className="text-sm text-slate-400">Loading {activePosition} results…</p> : null}
        {positionError ? <p className="text-sm text-red-200">{positionError}</p> : null}
        {!loadingPosition && !positionError && filteredRows.length === 0 ? <p className="text-sm text-slate-400">No rows match this filter.</p> : null}
        {filteredRows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400">
                  <th><button onClick={() => toggleSort('playerName')}>Player</button></th>
                  <th><button onClick={() => toggleSort('season')}>Season</button></th>
                  <th><button onClick={() => toggleSort('age')}>Age</button></th>
                  <th><button onClick={() => toggleSort('ageTrajectoryScore')}>Trajectory</button></th>
                  <th>Status</th>
                  <th>Age band</th>
                  <th><button onClick={() => toggleSort('recommendedModifierBucket')}>Modifier bucket</button></th>
                  <th>Reason summary</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={`${row.playerId}-${row.season}`} style={{ cursor: 'pointer' }} onClick={() => loadPlayer(row.playerId, row.season)}>
                    <td>{row.playerName}</td>
                    <td>{row.season}</td>
                    <td>{row.age}</td>
                    <td>{scoreText(row.ageTrajectoryScore)}</td>
                    <td>{row.ageCurveStatus}</td>
                    <td>{row.ageBandStage}</td>
                    <td>{row.recommendedModifierBucket}</td>
                    <td>{row.overallReasonSummary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </Card>

      <Card className="space-y-4">
        <h2 className="text-lg font-bold">Player detail</h2>
        {playersError ? <p className="text-sm text-red-200">{playersError}</p> : null}
        <div>
          <label className="text-sm text-slate-400">Quick player picker</label>
          <select
            className="w-full"
            onChange={(event) => {
              const [playerId, seasonText] = event.target.value.split('::');
              if (playerId && seasonText) {
                void loadPlayer(playerId, Number(seasonText));
              }
            }}
            value={playerDetail ? `${playerDetail.playerId}::${playerDetail.season}` : ''}
          >
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
          <div className="grid gap-4 md:grid-cols-2">
            <p><strong>Player:</strong> {playerDetail.playerName}</p>
            <p><strong>Player ID:</strong> {playerDetail.playerId}</p>
            <p><strong>Season:</strong> {playerDetail.season}</p>
            <p><strong>Position:</strong> {playerDetail.position}</p>
            <p><strong>Age:</strong> {playerDetail.age}</p>
            <p><strong>Age trajectory score:</strong> {scoreText(playerDetail.ageTrajectoryScore)}</p>
            <p><strong>Age curve status:</strong> {playerDetail.ageCurveStatus}</p>
            <p><strong>Age curve delta:</strong> {scoreText(playerDetail.ageCurveDelta)}</p>
            <p><strong>Age band stage:</strong> {playerDetail.ageBandStage}</p>
            <p><strong>Modifier bucket:</strong> {playerDetail.recommendedModifierBucket ?? '—'}</p>
            <p><strong>Modifier magnitude:</strong> {scoreText(playerDetail.modifierMagnitude)}</p>
            <div>
              <strong>Flags:</strong>{' '}
              {playerDetail.flags.length ? (
                <span>
                  {playerDetail.flags.map((flag) => `${flag.label} (${flag.code})`).join(', ')}
                </span>
              ) : (
                'None'
              )}
            </div>
            <p><strong>Production reason:</strong> {playerDetail.productionReason}</p>
            <p><strong>Role reason:</strong> {playerDetail.roleReason}</p>
            <p><strong>Efficiency reason:</strong> {playerDetail.efficiencyReason}</p>
            <p><strong>Overall reason summary:</strong> {playerDetail.overallReasonSummary}</p>
          </div>
        ) : null}
      </Card>
    </main>
  );
}
