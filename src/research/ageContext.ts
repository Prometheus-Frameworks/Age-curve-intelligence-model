import { POSITIONS } from "../config/positions.js";
import type {
  AgeBandStage,
  AgeCurveRelativeStatus,
  AgeTrajectoryScoresByPosition,
  ModifierBucket,
  PositionAgeTrajectoryScore
} from "../types/research.js";
import type {
  AgeCurveStatus,
  CareerStage,
  RankAdjustmentPolicy,
  ReliabilityTier,
  TiberAgeContextArtifact,
  TiberAgeContextPlayer
} from "../types/ageContext.js";
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
  return "unknown";
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

function determinePolicy(score: PositionAgeTrajectoryScore, reliability: ReliabilityTier, suppressReasons: string[]): RankAdjustmentPolicy {
  const warningCount = score.flags.filter((flag) => flag.severity === "warning").length;

  if (reliability === "unknown" || warningCount >= 2 || suppressReasons.includes("insufficient_component_data")) {
    return "none";
  }

  if (reliability === "low") {
    return "display_only";
  }

  if (score.ageCurveStatus === "ahead" && score.ageBandStage !== "decline-zone") {
    return "dynasty_only";
  }

  return "display_only";
}

function determineModifier(
  score: PositionAgeTrajectoryScore,
  rankAdjustmentPolicy: RankAdjustmentPolicy
): { bucket: ModifierBucket; magnitude: number | null } {
  if (rankAdjustmentPolicy !== "dynasty_only") {
    return { bucket: "neutral", magnitude: null };
  }

  if (score.ageBandStage === "decline-zone" && score.ageCurveStatus === "behind") {
    return { bucket: "fade", magnitude: -0.08 };
  }

  if (score.ageCurveStatus === "ahead") {
    return { bucket: "boost", magnitude: 0.05 };
  }

  if (score.ageCurveStatus === "behind") {
    return { bucket: "caution", magnitude: -0.04 };
  }

  return { bucket: "neutral", magnitude: 0 };
}

function buildSummary(player: TiberAgeContextPlayer): string {
  const roleClause = player.displayOnly ? "display-only context" : player.scoringEligible ? "scoring-eligible context" : "suppressed context";
  const reasonClause = player.suppressReasons.length > 0 ? ` due to ${player.suppressReasons.join(", ")}` : "";

  return `${player.age.toFixed(1)}-year-old ${player.position} in ${player.careerStage.replace("_", " ")}, ${player.ageCurveStatus.replace(
    "_",
    " "
  )}, ${player.reliabilityTier} reliability, ${roleClause}${reasonClause}.`;
}

function toPlayer(score: PositionAgeTrajectoryScore, generatedAt: string): TiberAgeContextPlayer {
  const reliabilityTier = toReliabilityTier(score);
  const suppressReasons = buildSuppressReasons(score, reliabilityTier);
  const rankAdjustmentPolicy = determinePolicy(score, reliabilityTier, suppressReasons);
  const modifier = determineModifier(score, rankAdjustmentPolicy);

  const scoringEligible = rankAdjustmentPolicy === "dynasty_only";
  const displayOnly = rankAdjustmentPolicy === "display_only";

  const player: TiberAgeContextPlayer = {
    playerId: score.playerId,
    playerName: score.playerName,
    season: score.season,
    position: score.position,
    age: score.age,
    careerStage: toCareerStage(score.ageBandStage),
    ageCurveStatus: toAgeCurveStatus(score.ageCurveStatus),
    ageCurveDelta: score.ageCurveDelta,
    // PR13 contract integrity: do not present non-percentile scores as percentiles.
    peerPercentile: null,
    reliabilityTier,
    hasWarningFlag: score.flags.some((flag) => flag.severity === "warning"),
    warningFlags: score.flags.map((flag) => flag.code),
    suppressReasons,
    scoringEligible,
    displayOnly,
    suppressFromRanking: rankAdjustmentPolicy === "none",
    rankAdjustmentPolicy,
    recommendedModifierBucket: modifier.bucket,
    modifierMagnitude: modifier.magnitude,
    modifierIsProvisional: true,
    modifierNonAuthoritativeReason: "Modifier magnitude is provisional, non-calibrated, and non-authoritative in PR1.",
    summary: "",
    provenance: {
      sourceArtifact: "age_trajectory_scores_by_position.json",
      generatedAt
    }
  };

  player.summary = buildSummary(player);
  return player;
}

export function buildTiberAgeContextArtifact(scoresByPosition: AgeTrajectoryScoresByPosition): TiberAgeContextArtifact {
  const generatedAt = new Date().toISOString();
  const players = POSITIONS.flatMap((position) => scoresByPosition[position] ?? []).map((score) => toPlayer(score, generatedAt));

  return {
    artifactVersion: TIBER_AGE_CONTEXT_ARTIFACT_VERSION,
    modelVersion: TIBER_AGE_CONTEXT_MODEL_VERSION,
    calibrationVersion: "none_pr1",
    modifierStatus: "provisional_non_authoritative",
    generatedAt,
    scope: "age_context_only",
    provenance: {
      module: "Age-curve-intelligence-model",
      ownership: {
        owns: ["career stage", "age-curve-relative context", "guardrail metadata"],
        doesNotOwn: ["projections", "rankings", "standalone valuation"]
      },
      notes: [
        "Age context only: no projections, rankings, or valuation authority.",
        "rankAdjustmentPolicy is constrained to none/display_only/dynasty_only in PR1.",
        "full_context is intentionally excluded in PR1."
      ]
    },
    players
  };
}
