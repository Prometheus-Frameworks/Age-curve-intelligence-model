import type { Position } from "../config/positions.js";
import type { MetricKey } from "../config/metrics.js";

export interface AgePoint {
  age: number;
  seasonCount: number;
  avgFantasyPointsTotal: number | null;
  avgFantasyPointsPerGame: number | null;
}

export interface AgeCurveByPosition {
  [position: string]: AgePoint[];
}

export interface MetricAverageByAge {
  age: number;
  seasonCount: number;
  metrics: Record<string, number | null>;
}

export interface AgeMetricAveragesByPosition {
  [position: string]: MetricAverageByAge[];
}

export interface PositionSummary {
  position: Position;
  totalIncludedSeasons: number;
  ageRange: { min: number | null; max: number | null };
  agesCovered: number[];
}

export interface AgeSummaryReport {
  generatedAt: string;
  positions: PositionSummary[];
}

export interface PositionAgeCorrelation {
  metric: MetricKey;
  sampleSize: number;
  minSampleRequired: number;
  correlation: number | null;
}

export type AgeCorrelationByPosition = Record<Position, PositionAgeCorrelation[]>;

export interface PositionPeakMetric {
  metric: MetricKey;
  minSampleRequired: number;
  peakAge: number | null;
  peakAgeValue: number | null;
  peakWindowStartAge: number | null;
  peakWindowEndAge: number | null;
  peakWindowAverage: number | null;
  peakWindowSampleSize: number;
  byAge: Array<{
    age: number;
    sampleSize: number;
    avgValue: number;
  }>;
}

export type AgePeakWindowsByPosition = Record<Position, PositionPeakMetric[]>;

export interface AgePeerMetricPercentile {
  metric: MetricKey;
  value: number;
  peerSampleSize: number;
  minPeerSampleRequired: number;
  percentile: number | null;
}

export interface PositionPlayerAgePeerProfile {
  playerId: string;
  playerName: string;
  position: Position;
  season: number;
  age: number;
  metrics: AgePeerMetricPercentile[];
}

export type PlayerAgePeerProfileByPosition = Record<Position, PositionPlayerAgePeerProfile[]>;

export interface ScoreComponent {
  metric: MetricKey;
  value: number;
  peerSampleSize: number;
  percentile: number;
  weight: number;
  weightedContribution: number;
}

export interface PositionAgeTrajectoryScore {
  playerId: string;
  playerName: string;
  position: Position;
  season: number;
  age: number;
  componentCount: number;
  totalWeight: number;
  ageTrajectoryScore: number | null;
  components: ScoreComponent[];
}

export type AgeTrajectoryScoresByPosition = Record<Position, PositionAgeTrajectoryScore[]>;
