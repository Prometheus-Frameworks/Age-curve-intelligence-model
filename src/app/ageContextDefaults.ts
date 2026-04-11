import type {
  ModifierBucket,
  Pr1AllowedRankAdjustmentPolicy,
  ReliabilityTier,
  TiberAgeContextScope
} from "../types/ageContext.js";

export const DEFAULT_TIBER_AGE_CONTEXT_SCOPE: TiberAgeContextScope = {
  module: "tiber_age_context",
  owns: ["career_stage_classification", "relative_age_curve_status", "warning_flags", "provisional_modifier_context"],
  doesNotOwn: ["rankings", "projections", "standalone_player_valuation", "standalone_trade_recommendations"]
};

export const DEFAULT_LOW_CONFIDENCE_POLICY: Pr1AllowedRankAdjustmentPolicy = "display_only";
export const DEFAULT_SUPPRESSED_POLICY: Pr1AllowedRankAdjustmentPolicy = "none";
export const DEFAULT_ALLOWED_POLICY: Pr1AllowedRankAdjustmentPolicy = "dynasty_only";

export const DEFAULT_RELIABILITY_TIER: ReliabilityTier = "unknown";
export const DEFAULT_MODIFIER_BUCKET: ModifierBucket = "no_adjustment";
