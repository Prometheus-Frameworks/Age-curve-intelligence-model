import { POSITIONS } from "../config/positions.js";
import { groupBy } from "../utils/groupBy.js";
import type { NormalizedPlayerSeasonRow } from "../types/normalized.js";
import type { AgeSummaryReport } from "../types/research.js";

export function buildAgeSummaryReport(rows: NormalizedPlayerSeasonRow[]): AgeSummaryReport {
  const byPosition = groupBy(rows, (row) => row.position);

  return {
    generatedAt: new Date().toISOString(),
    positions: POSITIONS.map((position) => {
      const positionRows = byPosition.get(position) ?? [];
      const ages = [...new Set(positionRows.map((row) => row.age))].sort((a, b) => a - b);

      return {
        position,
        totalIncludedSeasons: positionRows.length,
        ageRange: {
          min: ages.length ? ages[0] : null,
          max: ages.length ? ages[ages.length - 1] : null
        },
        agesCovered: ages
      };
    })
  };
}
