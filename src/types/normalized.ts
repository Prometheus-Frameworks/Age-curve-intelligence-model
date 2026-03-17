import type { Position } from "../config/positions.js";

export interface NormalizedPlayerSeasonRow {
  playerId: string;
  playerName: string;
  season: number;
  age: number;
  position: Position;
  team?: string | null;

  games: number | null;
  fantasyPointsTotal: number | null;
  fantasyPointsPerGame: number | null;

  snaps: number | null;
  snapSharePct: number | null;

  carries: number | null;
  targets: number | null;
  touchesPerGame: number | null;
  carriesPerGame: number | null;
  targetsPerGame: number | null;

  rushSharePct: number | null;
  targetSharePct: number | null;
  routeParticipationPct: number | null;

  rushYardsPerGame: number | null;
  recYardsPerGame: number | null;
  passYardsPerGame: number | null;

  ypc: number | null;
  ypr: number | null;

  totalTds: number | null;
  boomPct: number | null;
  fpStdDev: number | null;
  xfpDiff: number | null;
}
