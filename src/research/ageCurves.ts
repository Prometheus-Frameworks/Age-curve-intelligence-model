import { POSITIONS } from "../config/positions.js";
import { average } from "../utils/math.js";
import { groupBy } from "../utils/groupBy.js";
import { bucketRowsByAge } from "./ageBuckets.js";
import type { NormalizedPlayerSeasonRow } from "../types/normalized.js";
import type { AgeCurveByPosition, AgePoint, AgeMetricAveragesByPosition, MetricAverageByAge } from "../types/research.js";
import { METRICS_BY_POSITION } from "../config/metrics.js";
import { AGE_CURVE_SMOOTHING_RADIUS, MIN_PEER_SAMPLE } from "../config/thresholds.js";

function sortByAge<T extends { age: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.age - b.age);
}

function calculateSmoothedAgePoint(age: number, points: AgePoint[]): Pick<AgePoint, "smoothedAvgFantasyPointsPerGame" | "smoothedAvgFantasyPointsTotal" | "smoothingSampleSize"> {
  const inWindow = points.filter((point) => Math.abs(point.age - age) <= AGE_CURVE_SMOOTHING_RADIUS);
  const smoothingSampleSize = inWindow.reduce((sum, point) => sum + point.seasonCount, 0);

  return {
    smoothedAvgFantasyPointsPerGame: average(inWindow.map((point) => point.avgFantasyPointsPerGame)),
    smoothedAvgFantasyPointsTotal: average(inWindow.map((point) => point.avgFantasyPointsTotal)),
    smoothingSampleSize
  };
}

export function buildAgeCurvesByPosition(rows: NormalizedPlayerSeasonRow[]): AgeCurveByPosition {
  const byPosition = groupBy(rows, (row) => row.position);
  const result: AgeCurveByPosition = {};

  for (const position of POSITIONS) {
    const positionRows = byPosition.get(position) ?? [];
    const byAge = bucketRowsByAge(positionRows);

    const rawPoints: AgePoint[] = Array.from(byAge.entries()).map(([age, ageRows]) => ({
      age,
      seasonCount: ageRows.length,
      avgFantasyPointsTotal: average(ageRows.map((row) => row.fantasyPointsTotal)),
      avgFantasyPointsPerGame: average(ageRows.map((row) => row.fantasyPointsPerGame)),
      smoothedAvgFantasyPointsTotal: null,
      smoothedAvgFantasyPointsPerGame: null,
      smoothingSampleSize: 0,
      smoothingRadius: AGE_CURVE_SMOOTHING_RADIUS,
      lowSampleWarning: ageRows.length < MIN_PEER_SAMPLE
    }));

    const points = rawPoints.map((point) => {
      const smoothed = calculateSmoothedAgePoint(point.age, rawPoints);
      return {
        ...point,
        ...smoothed
      };
    });

    result[position] = sortByAge(points);
  }

  return result;
}

export function buildAgeMetricAveragesByPosition(rows: NormalizedPlayerSeasonRow[]): AgeMetricAveragesByPosition {
  const byPosition = groupBy(rows, (row) => row.position);
  const result: AgeMetricAveragesByPosition = {};

  for (const position of POSITIONS) {
    const metrics = METRICS_BY_POSITION[position];
    const positionRows = byPosition.get(position) ?? [];
    const byAge = bucketRowsByAge(positionRows);

    const metricRows: MetricAverageByAge[] = Array.from(byAge.entries()).map(([age, ageRows]) => {
      const averages = metrics.reduce<Record<string, number | null>>((acc, metric) => {
        acc[metric] = average(ageRows.map((row) => row[metric] as number | null));
        return acc;
      }, {});

      return {
        age,
        seasonCount: ageRows.length,
        metrics: averages
      };
    });

    result[position] = sortByAge(metricRows);
  }

  return result;
}
