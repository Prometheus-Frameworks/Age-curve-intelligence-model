import { groupBy } from "../utils/groupBy.js";
import type { NormalizedPlayerSeasonRow } from "../types/normalized.js";

export function bucketRowsByAge(rows: NormalizedPlayerSeasonRow[]): Map<number, NormalizedPlayerSeasonRow[]> {
  return groupBy(rows, (row) => row.age);
}
