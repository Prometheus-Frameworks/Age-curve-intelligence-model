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

type SuppressionTier = "none" | "soft" | "hard";

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

function deriveReliabilityTier(score: PositionAgeTrajectoryScore): ReliabilityTier {
  const warningCount = score.flags.filter((flag) => flag.severity === "warning").length;
  const hasLowPeerSample = score.flags.some((flag) => flag.code === "low_peer_sample");
  const hasInsufficientComponentData = score.flags.some((flag) => flag.code === "insufficient_component_data");
  const hasUnknownAgeCurveStatus = score.ageCurveStatus === null;
  const hasMissingCriticalScoreInput = score.ageTrajectoryScore === null || score.ageCurveDelta === null;

  if (score.componentCount <= 0 || hasInsufficientComponentData || hasUnknownAgeCurveStatus || hasMissingCriticalScoreInput) {
    return "unknown";
  }

  if (score.componentCount <= 1 || warningCount >= 2) {
    return "low";
  }

  if (score.componentCount >= 3 && warningCount === 0 && !hasLowPeerSample) {
    return "high";
  }

  return "medium";
}

function deriveSuppressReasons(score: PositionAgeTrajectoryScore, reliability: ReliabilityTier): string[] {
  const reasons: string[] = [];
  const warningFlags = score.flags.filter((flag) => flag.severity === "warning");
  const hasLowPeerSample = score.flags.some((flag) => flag.code === "low_peer_sample");
  const hasInsufficientComponentData =
    score.flags.some((flag) => flag.code === "insufficient_component_data") || score.componentCount < 2;

  if (reliability === "unknown") {
    reasons.push("unknown_reliability");
  } else if (reliability === "low") {
    reasons.push("low_reliability");
  }

  if (warningFlags.length >= 2) {
    reasons.push("warning_burden");
  }

  if (hasInsufficientComponentData) {
    reasons.push("insufficient_component_data");
  }

  if (hasLowPeerSample) {
    reasons.push("low_peer_sample");
  }

  if (score.ageCurveStatus === null) {
    reasons.push("unknown_age_curve_status");
  }

  if (score.ageTrajectoryScore === null || score.ageCurveDelta === null) {
    reasons.push("critical_input_missing");
  }

  return reasons;
}

function deriveSuppressionTier(reliability: ReliabilityTier, suppressReasons: string[]): SuppressionTier {
  if (
    reliability === "unknown" ||
    suppressReasons.includes("unknown_age_curve_status") ||
    suppressReasons.includes("insufficient_component_data") ||
    suppressReasons.includes("warning_burden") ||
    suppressReasons.includes("critical_input_missing")
  ) {
    return "hard";
  }

  if (reliability === "low" || suppressReasons.includes("low_peer_sample")) {
    return "soft";
  }

  return "none";
}

function deriveRankAdjustmentPolicy(
  score: PositionAgeTrajectoryScore,
  reliability: ReliabilityTier,
  suppressionTier: SuppressionTier
): RankAdjustmentPolicy {
  if (suppressionTier === "hard") {
    return "none";
  }

  if (suppressionTier === "soft" || reliability === "low" || reliability === "unknown" || score.ageCurveStatus === null) {
    return "display_only";
  }

  if (score.ageCurveStatus === "ahead" && score.ageBandStage !== "decline-zone") {
    return "dynasty_only";
  }

  return "display_only";
}

function deriveEligibility(rankAdjustmentPolicy: RankAdjustmentPolicy): { scoringEligible: boolean; displayOnly: boolean } {
  return {
    scoringEligible: rankAdjustmentPolicy === "dynasty_only",
    displayOnly: rankAdjustmentPolicy === "display_only"
  };
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

function formatAgeContextSummary(player: TiberAgeContextPlayer): string {
  const roleClause = player.displayOnly ? "display-only context" : player.scoringEligible ? "scoring-eligible context" : "suppressed context";
  const reasonClause = player.suppressReasons.length > 0 ? ` due to ${player.suppressReasons.join(", ")}` : "";

  return `${player.age.toFixed(1)}-year-old ${player.position} in ${player.careerStage.replace("_", " ")}, ${player.ageCurveStatus.replace(
    "_",
    " "
  )}, ${player.reliabilityTier} reliability, ${roleClause}${reasonClause}.`;
}

function toPlayer(score: PositionAgeTrajectoryScore, generatedAt: string): TiberAgeContextPlayer {
  const reliabilityTier = deriveReliabilityTier(score);
  const suppressReasons = deriveSuppressReasons(score, reliabilityTier);
  const suppressionTier = deriveSuppressionTier(reliabilityTier, suppressReasons);
  const rankAdjustmentPolicy = deriveRankAdjustmentPolicy(score, reliabilityTier, suppressionTier);
  const modifier = determineModifier(score, rankAdjustmentPolicy);
  const { scoringEligible, displayOnly } = deriveEligibility(rankAdjustmentPolicy);

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

  player.summary = formatAgeContextSummary(player);
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
