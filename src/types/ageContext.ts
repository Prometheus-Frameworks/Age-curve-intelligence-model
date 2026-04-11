import type { Position } from "../config/positions.js";

export const TIBER_AGE_CONTEXT_ARTIFACT_VERSION = "tiber_age_context_v1" as const;
export const TIBER_AGE_CONTEXT_MODEL_VERSION = "age-context-v1" as const;

export const CAREER_STAGE_VALUES = ["pre_peak", "peak_window", "post_peak", "decline_zone", "unknown"] as const;
export type CareerStage = (typeof CAREER_STAGE_VALUES)[number];

export const AGE_CURVE_STATUS_VALUES = ["ahead", "on_curve", "behind", "unknown"] as const;
export type AgeCurveStatus = (typeof AGE_CURVE_STATUS_VALUES)[number];

export const RELIABILITY_TIER_VALUES = ["high", "medium", "low", "unknown"] as const;
export type ReliabilityTier = (typeof RELIABILITY_TIER_VALUES)[number];

export const RANK_ADJUSTMENT_POLICY_VALUES = ["none", "display_only", "dynasty_only", "trade_context_only", "full_context"] as const;
export type RankAdjustmentPolicy = (typeof RANK_ADJUSTMENT_POLICY_VALUES)[number];

export const PR1_ALLOWED_RANK_ADJUSTMENT_POLICIES = ["none", "display_only", "dynasty_only"] as const;
export type Pr1AllowedRankAdjustmentPolicy = (typeof PR1_ALLOWED_RANK_ADJUSTMENT_POLICIES)[number];

export const MODIFIER_BUCKET_VALUES = ["no_adjustment", "small_boost", "small_caution", "moderate_caution", "fade", "unknown"] as const;
export type ModifierBucket = (typeof MODIFIER_BUCKET_VALUES)[number];

export interface TiberAgeContextScope {
  module: "tiber_age_context";
  owns: string[];
  doesNotOwn: string[];
}

export interface TiberAgeContextArtifactProvenance {
  sourceDataset: string;
  runId: string;
  calibrationVersion: string;
  modifierStatus: "provisional";
}

export interface TiberAgeContextPlayerProvenance {
  baselineSource?: string | null;
  peerGroupSize?: number | null;
  runId: string;
  sourceArtifactNames?: string[];
}

export interface TiberAgeContextPlayer {
  playerId: string;
  playerName: string;
  season: number;
  position: Position;
  age: number | null;

  /**
   * Lifecycle phase only; semantically orthogonal to ageCurveStatus.
   */
  careerStage: CareerStage;
  /**
   * Relative-to-expectation only; semantically orthogonal to careerStage.
   */
  ageCurveStatus: AgeCurveStatus;

  ageCurveDelta: number | null;
  peerPercentile: number | null;

  reliabilityTier: ReliabilityTier;
  warningFlags: string[];
  suppressReasons: string[];

  /**
   * PR1 downstream guardrail: must be one of none|display_only|dynasty_only.
   */
  rankAdjustmentPolicy: Pr1AllowedRankAdjustmentPolicy;

  modifierBucket: ModifierBucket;
  /**
   * Provisional and non-authoritative until calibration lands.
   */
  modifierMagnitude: number | null;
  modifierIsProvisional: true;

  scoringEligible: boolean;
  displayOnly: boolean;

  /**
   * Deterministic, template-based summary only (no freeform generation).
   */
  summary: string;

  provenance: TiberAgeContextPlayerProvenance;
}

export interface TiberAgeContextArtifact {
  artifactVersion: typeof TIBER_AGE_CONTEXT_ARTIFACT_VERSION;
  modelVersion: typeof TIBER_AGE_CONTEXT_MODEL_VERSION;
  generatedAt: string;
  scope: TiberAgeContextScope;
  provenance: TiberAgeContextArtifactProvenance;
  players: TiberAgeContextPlayer[];
}
