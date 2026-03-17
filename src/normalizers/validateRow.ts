import { MIN_GAMES_FOR_INCLUSION } from "../config/thresholds.js";
import { POSITION_SET } from "../config/positions.js";
import type { NormalizedPlayerSeasonRow } from "../types/normalized.js";

export function validateRow(row: NormalizedPlayerSeasonRow): boolean {
  const hasAge = Number.isFinite(row.age);
  const hasValidPosition = POSITION_SET.has(row.position);
  const meetsGamesThreshold = (row.games ?? 0) >= MIN_GAMES_FOR_INCLUSION;
  const hasFantasyPoints =
    row.fantasyPointsPerGame !== null || row.fantasyPointsTotal !== null;

  return hasAge && hasValidPosition && meetsGamesThreshold && hasFantasyPoints;
}
