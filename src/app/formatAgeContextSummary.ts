import type {
  AgeCurveStatus,
  CareerStage,
  ModifierBucket,
  Pr1AllowedRankAdjustmentPolicy,
  ReliabilityTier
} from "../types/ageContext.js";

function labelCareerStage(stage: CareerStage): string {
  switch (stage) {
    case "pre_peak":
      return "pre-peak";
    case "peak_window":
      return "peak window";
    case "post_peak":
      return "post-peak";
    case "decline_zone":
      return "decline zone";
    default:
      return "unknown stage";
  }
}

function labelAgeCurveStatus(status: AgeCurveStatus): string {
  switch (status) {
    case "ahead":
      return "ahead of age curve";
    case "on_curve":
      return "on age curve";
    case "behind":
      return "behind age curve";
    default:
      return "unknown age-curve status";
  }
}

function labelModifier(bucket: ModifierBucket, policy: Pr1AllowedRankAdjustmentPolicy): string {
  if (policy === "none") return "no downstream adjustment";
  if (policy === "display_only") return "display-only context";

  switch (bucket) {
    case "small_boost":
      return "small provisional dynasty boost";
    case "small_caution":
      return "small provisional dynasty caution";
    case "moderate_caution":
      return "moderate provisional dynasty caution";
    case "fade":
      return "provisional dynasty fade";
    case "no_adjustment":
    case "unknown":
    default:
      return "no downstream adjustment";
  }
}

export function formatAgeContextSummary(input: {
  age: number | null;
  position: string;
  careerStage: CareerStage;
  ageCurveStatus: AgeCurveStatus;
  reliabilityTier: ReliabilityTier;
  warningFlags: string[];
  rankAdjustmentPolicy: Pr1AllowedRankAdjustmentPolicy;
  modifierBucket: ModifierBucket;
}): string {
  const ageLabel = input.age == null ? "Unknown-age" : `${input.age.toFixed(1)}-year-old`;
  const stageLabel = labelCareerStage(input.careerStage);
  const statusLabel = labelAgeCurveStatus(input.ageCurveStatus);
  const modifierLabel = labelModifier(input.modifierBucket, input.rankAdjustmentPolicy);
  const warningClause = input.warningFlags.length > 0 ? `, warning flags: ${input.warningFlags.join(", ")}` : "";

  return `${ageLabel} ${input.position} in ${stageLabel}, ${statusLabel}, ${input.reliabilityTier} reliability${warningClause}, ${modifierLabel}.`;
}
