import type { Position } from "../config/positions.js";

export const TIBER_AGE_CONTEXT_ARTIFACT_VERSION = "tiber_age_context_v1" as const;
export const TIBER_AGE_CONTEXT_MODEL_VERSION = "age-context-v1" as const;

/**
 * Lifecycle-only stage label (orthogonal to ageCurveStatus).
 * This represents where the player is in an age phase, not performance quality.
 */
export const CAREER_STAGE_VALUES = ["pre_peak", "peak_window", "post_peak", "decline_zone", "unknown"] as const;
export type CareerStage = (typeof CAREER_STAGE_VALUES)[number];

/**
 * Relative-to-curve label (orthogonal to careerStage).
 * This represents performance vs age expectation, not lifecycle phase.
 */
export const AGE_CURVE_STATUS_VALUES = ["ahead", "on_curve", "behind", "unknown"] as const;
export type AgeCurveStatus = (typeof AGE_CURVE_STATUS_VALUES)[number];

export const RELIABILITY_TIER_VALUES = ["high", "medium", "low", "unknown"] as const;
export type ReliabilityTier = (typeof RELIABILITY_TIER_VALUES)[number];

/**
 * PR1 guardrail: only conservative downstream policy values are allowed.
 */
export const RANK_ADJUSTMENT_POLICY_VALUES = ["none", "display_only", "dynasty_only"] as const;
export type RankAdjustmentPolicy = (typeof RANK_ADJUSTMENT_POLICY_VALUES)[number];

export interface TiberAgeContextProvenance {
  sourceArtifact: string;
  generatedAt: string;
}

export interface TiberAgeContextPlayer {
  playerId: string;
  playerName: string;
  season: number;
  position: Position;
  age: number;

  // Age-context semantics (orthogonal fields)
  careerStage: CareerStage;
  ageCurveStatus: AgeCurveStatus;
  ageCurveDelta: number | null;

  reliabilityTier: ReliabilityTier;
  hasWarningFlag: boolean;
  warningFlags: string[];
  suppressFromRanking: boolean;

  rankAdjustmentPolicy: RankAdjustmentPolicy;

  recommendedModifierBucket: "boost" | "neutral" | "caution" | "fade";
  modifierMagnitude: number;
  modifierIsProvisional: true;
  modifierNonAuthoritativeReason: string;

  summary: string;
  provenance: TiberAgeContextProvenance;
}

export interface TiberAgeContextArtifact {
  artifactVersion: typeof TIBER_AGE_CONTEXT_ARTIFACT_VERSION;
  modelVersion: typeof TIBER_AGE_CONTEXT_MODEL_VERSION;
  generatedAt: string;
  scope: "age_context_only";
  provenance: {
    module: "Age-curve-intelligence-model";
    notes: string[];
  };
  players: TiberAgeContextPlayer[];
}
