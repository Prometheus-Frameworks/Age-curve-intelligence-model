import { POSITION_SET, type Position } from "../config/positions.js";
import type { NormalizedPlayerSeasonRow } from "../types/normalized.js";
import type { RawPlayerSeasonRow } from "../types/raw.js";

function getFirst(row: RawPlayerSeasonRow, keys: string[]): unknown {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== "") {
      return row[key];
    }
  }
  return null;
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function toStringValue(value: unknown): string | null {
  if (typeof value !== "string") {
    if (value === null || value === undefined) {
      return null;
    }
    return String(value);
  }
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function toPosition(value: unknown): Position | null {
  const str = toStringValue(value)?.toUpperCase();
  if (!str || !POSITION_SET.has(str)) {
    return null;
  }
  return str as Position;
}

export function normalizePlayerRows(rawRows: RawPlayerSeasonRow[]): NormalizedPlayerSeasonRow[] {
  return rawRows.map((row, index) => {
    const position = toPosition(getFirst(row, ["position", "pos"]));
    const age = toNumber(getFirst(row, ["age"]));

    return {
      playerId: toStringValue(getFirst(row, ["playerId", "player_id", "id"])) ?? `unknown-${index}`,
      playerName: toStringValue(getFirst(row, ["playerName", "player_name", "name"])) ?? "Unknown",
      season: toNumber(getFirst(row, ["season", "year"])) ?? 0,
      age: position ? age ?? Number.NaN : Number.NaN,
      position: position ?? "QB",
      team: toStringValue(getFirst(row, ["team"])) ?? null,

      games: toNumber(getFirst(row, ["games", "g"])),
      fantasyPointsTotal: toNumber(getFirst(row, ["fantasyPointsTotal", "fantasy_points_total", "fp_total"])),
      fantasyPointsPerGame: toNumber(getFirst(row, ["fantasyPointsPerGame", "fantasy_points_per_game", "fppg"])),

      snaps: toNumber(getFirst(row, ["snaps"])),
      snapSharePct: toNumber(getFirst(row, ["snapSharePct", "snap_share_pct"])),

      carries: toNumber(getFirst(row, ["carries", "rush_attempts"])),
      targets: toNumber(getFirst(row, ["targets"])),
      touchesPerGame: toNumber(getFirst(row, ["touchesPerGame", "touches_per_game"])),
      carriesPerGame: toNumber(getFirst(row, ["carriesPerGame", "carries_per_game"])),
      targetsPerGame: toNumber(getFirst(row, ["targetsPerGame", "targets_per_game"])),

      rushSharePct: toNumber(getFirst(row, ["rushSharePct", "rush_share_pct"])),
      targetSharePct: toNumber(getFirst(row, ["targetSharePct", "target_share_pct"])),
      routeParticipationPct: toNumber(getFirst(row, ["routeParticipationPct", "route_participation_pct"])),

      rushYardsPerGame: toNumber(getFirst(row, ["rushYardsPerGame", "rush_yards_per_game"])),
      recYardsPerGame: toNumber(getFirst(row, ["recYardsPerGame", "receiving_yards_per_game", "rec_yards_per_game"])),
      passYardsPerGame: toNumber(getFirst(row, ["passYardsPerGame", "pass_yards_per_game"])),

      ypc: toNumber(getFirst(row, ["ypc", "yards_per_carry"])),
      ypr: toNumber(getFirst(row, ["ypr", "yards_per_reception"])),

      totalTds: toNumber(getFirst(row, ["totalTds", "total_tds"])),
      boomPct: toNumber(getFirst(row, ["boomPct", "boom_pct"])),
      fpStdDev: toNumber(getFirst(row, ["fpStdDev", "fp_std_dev"])),
      xfpDiff: toNumber(getFirst(row, ["xfpDiff", "xfp_diff"]))
    };
  });
}
