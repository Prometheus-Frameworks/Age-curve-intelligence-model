import {
  DEFAULT_ALLOWED_POLICY,
  DEFAULT_LOW_CONFIDENCE_POLICY,
  DEFAULT_SUPPRESSED_POLICY
} from "./ageContextDefaults.js";
import type { Pr1AllowedRankAdjustmentPolicy, ReliabilityTier } from "../types/ageContext.js";

export function deriveRankAdjustmentPolicy(input: {
  reliabilityTier: ReliabilityTier;
  warningCount: number;
  hasInsufficientData: boolean;
  ageCurveStatusKnown: boolean;
  stage: "pre-peak" | "peak-window" | "post-peak" | "decline-zone";
  curveStatus: "ahead" | "on" | "behind" | null;
}): Pr1AllowedRankAdjustmentPolicy {
  if (input.reliabilityTier === "unknown" || input.hasInsufficientData || !input.ageCurveStatusKnown || input.warningCount >= 2) {
    return DEFAULT_SUPPRESSED_POLICY;
  }

  if (input.reliabilityTier === "low") {
    return DEFAULT_LOW_CONFIDENCE_POLICY;
  }

  if (input.curveStatus === "ahead" && input.stage !== "decline-zone") {
    return DEFAULT_ALLOWED_POLICY;
  }

  return DEFAULT_LOW_CONFIDENCE_POLICY;
}
