import type { Position } from "./positions.js";
import type { CurveStatusThresholds } from "../types/research.js";

export const MIN_GAMES_FOR_INCLUSION = 4;

export const MIN_CORRELATION_SAMPLE = 12;
export const MIN_PEER_SAMPLE = 8;
export const MIN_PEAK_WINDOW_SAMPLE = 8;

export const HIGH_CONFIDENCE_PEER_SAMPLE = 20;
export const MEDIUM_CONFIDENCE_PEER_SAMPLE = 12;

export const AGE_CURVE_SMOOTHING_RADIUS = 1;

export const CURVE_STATUS_THRESHOLDS_BY_POSITION: Record<Position, CurveStatusThresholds> = {
  QB: { ahead: 0.18, behind: -0.18, anomaly: 0.45 },
  RB: { ahead: 0.1, behind: -0.1, anomaly: 0.28 },
  WR: { ahead: 0.12, behind: -0.12, anomaly: 0.32 },
  TE: { ahead: 0.1, behind: -0.1, anomaly: 0.25 }
};

export const STAGE_FALLBACK_AGES_BY_POSITION: Record<Position, { prePeakMax: number; peakWindowEnd: number; postPeakEnd: number }> = {
  QB: { prePeakMax: 25, peakWindowEnd: 30, postPeakEnd: 33 },
  RB: { prePeakMax: 22, peakWindowEnd: 25, postPeakEnd: 27 },
  WR: { prePeakMax: 23, peakWindowEnd: 27, postPeakEnd: 30 },
  TE: { prePeakMax: 24, peakWindowEnd: 28, postPeakEnd: 31 }
};
