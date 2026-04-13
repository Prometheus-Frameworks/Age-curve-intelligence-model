export type Position = 'QB' | 'RB' | 'WR' | 'TE';

export interface ResultsSummary {
  generatedAt: string;
  includedRowCount: number;
  positionsCovered: Position[];
  artifacts: string[];
  latestRunMetadata: {
    generatedAt: string;
    lastUploadedFileName: string;
    lastRunTimestamp: string;
    inputRowCount: number;
    includedRowCount: number;
    validationRan: boolean;
    validationSummary: {
      totalCases: number;
      passedCases: number;
      failedCases: number;
    } | null;
  } | null;
  validation: {
    generatedAt: string;
    passedCases: number;
    failedCases: number;
    totalCases: number;
    failures: Array<{
      caseName: string;
      mismatchExplanations: string[];
    }>;
  } | null;
}

export interface PositionPlayerRow {
  playerId: string;
  playerName: string;
  season: number;
  age: number;
  ageTrajectoryScore: number | null;
  ageCurveStatus: string;
  ageBandStage: string;
  recommendedModifierBucket: string;
  overallReasonSummary: string;
}

export interface PositionSummary {
  position: Position;
  playerRows: PositionPlayerRow[];
}

export interface PlayerDetail {
  playerName: string;
  playerId: string;
  season: number;
  age: number;
  position: Position;
  ageTrajectoryScore: number | null;
  ageCurveStatus: string;
  ageCurveDelta: number | null;
  ageBandStage: string;
  flags: Array<{
    code: string;
    label: string;
    message: string;
    severity: 'info' | 'warning';
  }>;
  productionReason: string;
  roleReason: string;
  efficiencyReason: string;
  overallReasonSummary: string;
  recommendedModifierBucket: string | null;
  modifierMagnitude: number | null;
}

interface ApiErrorPayload {
  error?: string;
}

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  if (!response.ok) {
    let payload: ApiErrorPayload | null = null;
    try {
      payload = (await response.json()) as ApiErrorPayload;
    } catch {
      payload = null;
    }
    throw new Error(payload?.error || `Request failed (${response.status})`);
  }
  return (await response.json()) as T;
}

export function getResultsSummary() {
  return request<ResultsSummary>('/api/results/summary');
}

export function getArtifacts() {
  return request<{ artifacts: string[] }>('/api/artifacts');
}

export function getPositionSummary(position: Position) {
  return request<PositionSummary>(`/api/results/position/${position}`);
}

export function getPlayers() {
  return request<{ players: Array<{ playerId: string; playerName: string; season: number; position: Position }> }>('/api/results/players');
}

export function getPlayerDetail(playerId: string, season?: number) {
  const params = new URLSearchParams({ playerId });
  if (typeof season === 'number') {
    params.set('season', String(season));
  }
  return request<PlayerDetail>(`/api/results/player?${params.toString()}`);
}

export function runResearch(file: File) {
  return request<{ ok: boolean; result: unknown }>('/api/run/research', {
    method: 'POST',
    headers: {
      'x-upload-filename': file.name,
    },
    body: file,
  });
}

export function runValidation() {
  return request<{ ok: boolean; report: unknown }>('/api/run/validation', { method: 'POST' });
}
