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
 * full_context must never be emitted in PR1.
 */
export const RANK_ADJUSTMENT_POLICY_VALUES = ["none", "display_only", "dynasty_only"] as const;
export type RankAdjustmentPolicy = (typeof RANK_ADJUSTMENT_POLICY_VALUES)[number];

/**
 * Contract-level modifier bucket enum.
 * More precise than the internal research ModifierBucket.
 */
export const MODIFIER_BUCKET_VALUES = [
  "no_adjustment",
  "small_boost",
  "small_caution",
  "moderate_caution",
  "fade",
  "unknown",
] as const;
export type ModifierBucket = (typeof MODIFIER_BUCKET_VALUES)[number];

/**
 * Scope metadata: what this module owns and does not own.
 * Downstream consumers must respect these boundaries.
 */
export interface TiberAgeContextScope {
  module: "tiber_age_context";
  owns: string[];
  doesNotOwn: string[];
}

/**
 * Artifact-level provenance: data lineage for the full run.
 */
export interface TiberAgeContextArtifactProvenance {
  sourceDataset: string;
  runId: string;
  calibrationVersion: string;
  modifierStatus: "provisional";
}

/**
 * Player-level provenance: data lineage for a single player record.
 */
export interface TiberAgeContextPlayerProvenance {
  baselineSource: string | null;
  peerGroupSize: number | null;
  runId: string;
  sourceArtifactNames: string[];
}

export interface TiberAgeContextPlayer {
  playerId: string;
  playerName: string;
  season: number;
  position: Position;
  age: number;

  /**
   * Lifecycle phase only.
   * Answers: where is the player in the expected career arc?
   * Orthogonal to ageCurveStatus.
   */
  careerStage: CareerStage;

  /**
   * Relative-to-expectation status only.
   * Answers: is the player ahead of / on / behind age-position expectation?
   * Orthogonal to careerStage.
   */
  ageCurveStatus: AgeCurveStatus;

  ageCurveDelta: number | null;
  peerPercentile: number | null;

  reliabilityTier: ReliabilityTier;
  warningFlags: string[];
  suppressReasons: string[];
  scoringEligible: boolean;
  displayOnly: boolean;

  /**
   * Explicit downstream usage guardrail.
   * PR1 must never emit "full_context".
   */
  rankAdjustmentPolicy: RankAdjustmentPolicy;

  /**
   * Contract-level modifier bucket (more precise than internal research bucket).
   */
  modifierBucket: ModifierBucket;

  /**
   * Provisional only in PR1. Non-authoritative until historical calibration lands.
   * Must not be treated as a validated ranking delta.
   */
  modifierMagnitude: number | null;

  /** Always true in PR1. Literal type enforces this at compile time. */
  modifierIsProvisional: true;

  /**
   * Deterministic, template-based explanation only.
   * Must not be LLM-authored.
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
