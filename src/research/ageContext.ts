import { POSITIONS } from "../config/positions.js";
import { DEFAULT_MODIFIER_BUCKET, DEFAULT_RELIABILITY_TIER, DEFAULT_TIBER_AGE_CONTEXT_SCOPE } from "../app/ageContextDefaults.js";
import { deriveRankAdjustmentPolicy } from "../app/deriveRankAdjustmentPolicy.js";
import { formatAgeContextSummary } from "../app/formatAgeContextSummary.js";
import type { AgeBandStage, AgeCurveRelativeStatus, AgeTrajectoryScoresByPosition, PositionAgeTrajectoryScore } from "../types/research.js";
import type { AgeCurveStatus, CareerStage, ModifierBucket, ReliabilityTier, TiberAgeContextArtifact, TiberAgeContextPlayer } from "../types/ageContext.js";
import { TIBER_AGE_CONTEXT_ARTIFACT_VERSION, TIBER_AGE_CONTEXT_MODEL_VERSION } from "../types/ageContext.js";

function toCareerStage(stage: AgeBandStage): CareerStage {
  if (stage === "pre-peak") return "pre_peak";
  if (stage === "peak-window") return "peak_window";
  if (stage === "post-peak") return "post_peak";
  if (stage === "decline-zone") return "decline_zone";
  return "unknown";
}

function toAgeCurveStatus(status: AgeCurveRelativeStatus | null): AgeCurveStatus {
  if (status === "ahead") return "ahead";
  if (status === "behind") return "behind";
  if (status === "on") return "on_curve";
  return "unknown";
}

function toReliabilityTier(score: PositionAgeTrajectoryScore): ReliabilityTier {
  if (score.componentCount >= 3 && !score.flags.some((flag) => flag.code === "low_peer_sample")) {
    return "high";
  }
  if (score.componentCount >= 2) {
    return "medium";
  }
  if (score.componentCount >= 1) {
    return "low";
  }
  return DEFAULT_RELIABILITY_TIER;
}

function buildSuppressReasons(score: PositionAgeTrajectoryScore, reliability: ReliabilityTier): string[] {
  const reasons: string[] = [];
  const warningFlags = score.flags.filter((flag) => flag.severity === "warning");

  if (reliability === "unknown") {
    reasons.push("unknown_reliability");
  } else if (reliability === "low") {
    reasons.push("low_reliability");
  }

  if (warningFlags.length >= 2) {
    reasons.push("warning_burden");
  }

  if (warningFlags.some((flag) => flag.code === "insufficient_component_data")) {
    reasons.push("insufficient_component_data");
  }

  if (score.ageCurveStatus === null) {
    reasons.push("unknown_age_curve_status");
  }

  return reasons;
}

function determineModifier(
  score: PositionAgeTrajectoryScore,
  rankAdjustmentPolicy: TiberAgeContextPlayer["rankAdjustmentPolicy"]
): { bucket: ModifierBucket; magnitude: number | null } {
  if (rankAdjustmentPolicy !== "dynasty_only") {
    return { bucket: DEFAULT_MODIFIER_BUCKET, magnitude: null };
  }

  if (score.ageBandStage === "decline-zone" && score.ageCurveStatus === "behind") {
    return { bucket: "fade", magnitude: -0.08 };
  }

  if (score.ageCurveStatus === "ahead") {
    return { bucket: "small_boost", magnitude: 0.05 };
  }

  if (score.ageCurveStatus === "behind") {
    return { bucket: "small_caution", magnitude: -0.04 };
  }

  return { bucket: DEFAULT_MODIFIER_BUCKET, magnitude: 0 };
}

function toPlayer(score: PositionAgeTrajectoryScore, runId: string): TiberAgeContextPlayer {
  const reliabilityTier = toReliabilityTier(score);
  const suppressReasons = buildSuppressReasons(score, reliabilityTier);
  const warningFlags = score.flags.map((flag) => flag.code);
  const rankAdjustmentPolicy = deriveRankAdjustmentPolicy({
    reliabilityTier,
    warningCount: score.flags.filter((flag) => flag.severity === "warning").length,
    hasInsufficientData: suppressReasons.includes("insufficient_component_data"),
    ageCurveStatusKnown: score.ageCurveStatus !== null,
    stage: score.ageBandStage,
    curveStatus: score.ageCurveStatus
  });
  const modifier = determineModifier(score, rankAdjustmentPolicy);

  const player: TiberAgeContextPlayer = {
    playerId: score.playerId,
    playerName: score.playerName,
    season: score.season,
    position: score.position,
    age: score.age,
    careerStage: toCareerStage(score.ageBandStage),
    ageCurveStatus: toAgeCurveStatus(score.ageCurveStatus),
    ageCurveDelta: score.ageCurveDelta,
    peerPercentile: null,
    reliabilityTier,
    warningFlags,
    suppressReasons,
    rankAdjustmentPolicy,
    modifierBucket: modifier.bucket,
    modifierMagnitude: modifier.magnitude,
    modifierIsProvisional: true,
    scoringEligible: rankAdjustmentPolicy === "dynasty_only",
    displayOnly: rankAdjustmentPolicy === "display_only",
    summary: "",
    provenance: {
      baselineSource: "age_trajectory_scores_by_position.json",
      peerGroupSize: score.componentCount,
      runId,
      sourceArtifactNames: ["age_trajectory_scores_by_position.json", "tiber_age_modifiers.json"]
    }
  };

  player.summary = formatAgeContextSummary({
    age: player.age,
    position: player.position,
    careerStage: player.careerStage,
    ageCurveStatus: player.ageCurveStatus,
    reliabilityTier: player.reliabilityTier,
    warningFlags: player.warningFlags,
    rankAdjustmentPolicy: player.rankAdjustmentPolicy,
    modifierBucket: player.modifierBucket
  });

  return player;
}

export function buildTiberAgeContextArtifact(scoresByPosition: AgeTrajectoryScoresByPosition): TiberAgeContextArtifact {
  const generatedAt = new Date().toISOString();
  const runId = `age-context-${generatedAt}`;
  const players = POSITIONS.flatMap((position) => scoresByPosition[position] ?? []).map((score) => toPlayer(score, runId));

  return {
    artifactVersion: TIBER_AGE_CONTEXT_ARTIFACT_VERSION,
    modelVersion: TIBER_AGE_CONTEXT_MODEL_VERSION,
    generatedAt,
    scope: DEFAULT_TIBER_AGE_CONTEXT_SCOPE,
    provenance: {
      sourceDataset: "tiber_data_lab_export",
      runId,
      calibrationVersion: "none_pr1",
      modifierStatus: "provisional"
    },
    players
  };
}
