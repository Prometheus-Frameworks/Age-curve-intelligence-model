import type { Position } from "../config/positions.js";
import type { MetricKey } from "../config/metrics.js";

export interface AgePoint {
  age: number;
  seasonCount: number;
  avgFantasyPointsTotal: number | null;
  avgFantasyPointsPerGame: number | null;
  smoothedAvgFantasyPointsTotal: number | null;
  smoothedAvgFantasyPointsPerGame: number | null;
  smoothingSampleSize: number;
  smoothingRadius: number;
  lowSampleWarning: boolean;
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

export type PeerSampleConfidence = "low" | "medium" | "high";

export interface PeerSampleMetadata {
  peerSampleSize: number;
  minPeerSampleRequired: number;
  confidenceTier: PeerSampleConfidence;
  isReliableSample: boolean;
  reliabilityGap: number;
}

export interface AgePeerMetricPercentile {
  metric: MetricKey;
  value: number;
  percentile: number | null;
  peerSample: PeerSampleMetadata;
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
  percentile: number;
  weight: number;
  weightedContribution: number;
  peerSample: PeerSampleMetadata;
}

export type AgeCurveRelativeStatus = "ahead" | "on" | "behind";

export type AgeBandStage = "pre-peak" | "peak-window" | "post-peak" | "decline-zone";

export interface CurveStatusThresholds {
  ahead: number;
  behind: number;
  anomaly: number;
}

export interface RuleFlag {
  code: string;
  label: string;
  message: string;
  severity: "info" | "warning";
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
  ageCurveDelta: number | null;
  ageCurveStatus: AgeCurveRelativeStatus | null;
  ageBandStage: AgeBandStage;
  flags: RuleFlag[];
  productionReason: string;
  roleReason: string;
  efficiencyReason: string;
  overallReasonSummary: string;
  interpretation: string;
  components: ScoreComponent[];
}

export type AgeTrajectoryScoresByPosition = Record<Position, PositionAgeTrajectoryScore[]>;

export interface TiberReintegrationRow {
  playerId: string;
  playerName: string;
  season: number;
  age: number;
  position: Position;
  ageTrajectoryScore: number | null;
  ageCurveStatus: AgeCurveRelativeStatus | null;
  ageCurveDelta: number | null;
  ageBandStage: AgeBandStage;
  interpretation: string;
  productionReason: string;
  roleReason: string;
  efficiencyReason: string;
  overallReasonSummary: string;
  flagCodes: string[];
  hasWarningFlag: boolean;
  componentCount: number;
}

export interface TiberReintegrationArtifact {
  generatedAt: string;
  rows: TiberReintegrationRow[];
}

export type ModifierBucket = "boost" | "neutral" | "caution" | "fade";

export interface TiberAgeModifierRow {
  playerId: string;
  season: number;
  age: number;
  position: Position;
  ageTrajectoryScore: number | null;
  ageCurveStatus: AgeCurveRelativeStatus | null;
  ageCurveDelta: number | null;
  ageBandStage: AgeBandStage;
  hasWarningFlag: boolean;
  flagCodes: string[];
  recommendedModifierBucket: ModifierBucket;
  modifierMagnitude: number;
}

export interface TiberAgeModifierArtifact {
  generatedAt: string;
  rows: TiberAgeModifierRow[];
}

export interface ValidationCaseExpectation {
  expectedAgeCurveStatus?: AgeCurveRelativeStatus | null;
  expectedAgeBandStage?: AgeBandStage;
  expectWarningFlag?: boolean;
  expectedFlagCodes?: string[];
  expectedThemes?: string[];
}

export interface ValidationCase {
  caseName: string;
  description: string;
  playerId: string;
  playerName: string;
  expectation: ValidationCaseExpectation;
}

export interface ValidationCaseResult {
  caseName: string;
  pass: boolean;
  expected: ValidationCaseExpectation;
  actual: {
    ageCurveStatus: AgeCurveRelativeStatus | null;
    ageBandStage: AgeBandStage;
    hasWarningFlag: boolean;
    flagCodes: string[];
    overallReasonSummary: string;
  };
  mismatchExplanations: string[];
}

export interface ValidationReport {
  generatedAt: string;
  totalCases: number;
  passedCases: number;
  failedCases: number;
  results: ValidationCaseResult[];
}

export interface LatestRunMetadata {
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
}
