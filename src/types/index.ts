export type Position = 'QB' | 'RB' | 'WR' | 'TE';

export type PipelineStep = 'idle' | 'uploading' | 'processing' | 'validating' | 'complete';

export interface AgeCurvePoint {
  age: number;
  value: number;
}

export interface PositionCurve {
  position: Position;
  color: string;
  data: AgeCurvePoint[];
}

export interface PlayerProfile {
  id: string;
  name: string;
  position: Position;
  team: string;
  age: number;
  trajectoryScore: number;
  currentProduction: number;
  ageModifier: number;
  peerPercentile: number;
  declineRisk: 'low' | 'medium' | 'high';
  curve: AgeCurvePoint[];
  peakWindow: [number, number];
}

export interface Artifact {
  name: string;
  type: 'curves' | 'scores' | 'summary' | 'validation' | 'modifiers' | 'metadata';
  size: string;
  generatedAt: string;
  url: string;
}

export interface ValidationResult {
  totalCases: number;
  passedCases: number;
  failedCases: number;
  failures: Array<{
    test: string;
    error: string;
  }>;
}

export interface PeerPlayer {
  name: string;
  age: number;
  production: number;
  trajectory: 'rising' | 'stable' | 'decline';
  percentile: number;
  isCurrentPlayer?: boolean;
}
