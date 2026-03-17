import type { Position } from "./positions.js";
import type { NormalizedPlayerSeasonRow } from "../types/normalized.js";

export type MetricKey = keyof NormalizedPlayerSeasonRow;

export const METRICS_BY_POSITION: Record<Position, MetricKey[]> = {
  QB: [
    "fantasyPointsPerGame",
    "passYardsPerGame",
    "rushYardsPerGame",
    "xfpDiff"
  ],
  RB: [
    "fantasyPointsPerGame",
    "carriesPerGame",
    "targetsPerGame",
    "rushSharePct",
    "targetSharePct",
    "ypc",
    "boomPct"
  ],
  WR: [
    "fantasyPointsPerGame",
    "targetsPerGame",
    "targetSharePct",
    "routeParticipationPct",
    "recYardsPerGame",
    "ypr",
    "boomPct"
  ],
  TE: [
    "fantasyPointsPerGame",
    "targetsPerGame",
    "targetSharePct",
    "routeParticipationPct",
    "recYardsPerGame",
    "ypr",
    "boomPct"
  ]
};
