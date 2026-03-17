import type { Position } from "../config/positions.js";

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
