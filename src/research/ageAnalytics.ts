import { METRICS_BY_POSITION, type MetricKey } from "../config/metrics.js";
import { POSITIONS, type Position } from "../config/positions.js";
import {
  MIN_CORRELATION_SAMPLE,
  MIN_PEAK_WINDOW_SAMPLE,
  MIN_PEER_SAMPLE
} from "../config/thresholds.js";
import type { NormalizedPlayerSeasonRow } from "../types/normalized.js";
import type {
  AgeCorrelationByPosition,
  AgePeakWindowsByPosition,
  AgeTrajectoryScoresByPosition,
  PlayerAgePeerProfileByPosition,
  PositionAgeCorrelation,
  PositionAgeTrajectoryScore,
  PositionPeakMetric,
  PositionPlayerAgePeerProfile,
  ScoreComponent
} from "../types/research.js";
import { groupBy } from "../utils/groupBy.js";

interface NumericSample {
  age: number;
  metricValue: number;
}

function toNumeric(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function sortByAge<T extends { age: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.age - b.age);
}

function pearsonCorrelation(samples: NumericSample[]): number | null {
  const n = samples.length;
  if (n < 2) {
    return null;
  }

  let sumX = 0;
  let sumY = 0;
  let sumXX = 0;
  let sumYY = 0;
  let sumXY = 0;

  for (const sample of samples) {
    const x = sample.age;
    const y = sample.metricValue;
    sumX += x;
    sumY += y;
    sumXX += x * x;
    sumYY += y * y;
    sumXY += x * y;
  }

  const numerator = n * sumXY - sumX * sumY;
  const denominatorX = n * sumXX - sumX * sumX;
  const denominatorY = n * sumYY - sumY * sumY;
  const denominator = Math.sqrt(denominatorX * denominatorY);

  if (!Number.isFinite(denominator) || denominator <= 0) {
    return null;
  }

  return numerator / denominator;
}

function percentileRank(value: number, peerValues: number[]): number {
  if (peerValues.length === 0) {
    return 50;
  }

  let less = 0;
  let equal = 0;
  for (const peerValue of peerValues) {
    if (peerValue < value) {
      less += 1;
    } else if (peerValue === value) {
      equal += 1;
    }
  }

  return ((less + 0.5 * equal) / peerValues.length) * 100;
}

function buildPositionSamples(
  positionRows: NormalizedPlayerSeasonRow[],
  metric: MetricKey
): NumericSample[] {
  const samples: NumericSample[] = [];

  for (const row of positionRows) {
    const metricValue = toNumeric(row[metric] as number | null);
    if (metricValue === null) {
      continue;
    }

    samples.push({ age: row.age, metricValue });
  }

  return samples;
}

function calculateTrajectoryScore(
  row: NormalizedPlayerSeasonRow,
  metrics: MetricKey[],
  sameAgeRows: NormalizedPlayerSeasonRow[]
): PositionAgeTrajectoryScore {
  const components: ScoreComponent[] = [];
  let weightedTotal = 0;
  let weightSum = 0;

  for (const metric of metrics) {
    const value = toNumeric(row[metric] as number | null);
    if (value === null) {
      continue;
    }

    const peerValues = sameAgeRows
      .map((peer) => toNumeric(peer[metric] as number | null))
      .filter((peerValue): peerValue is number => peerValue !== null);

    if (peerValues.length < MIN_PEER_SAMPLE) {
      continue;
    }

    const percentile = percentileRank(value, peerValues);
    const weight = metric === "fantasyPointsPerGame" ? 2 : 1;

    components.push({
      metric,
      value,
      peerSampleSize: peerValues.length,
      percentile,
      weight,
      weightedContribution: percentile * weight
    });

    weightedTotal += percentile * weight;
    weightSum += weight;
  }

  return {
    playerId: row.playerId,
    playerName: row.playerName,
    position: row.position,
    season: row.season,
    age: row.age,
    componentCount: components.length,
    totalWeight: weightSum,
    ageTrajectoryScore: weightSum > 0 ? weightedTotal / weightSum : null,
    components
  };
}

export function buildAgeCorrelationsByPosition(rows: NormalizedPlayerSeasonRow[]): AgeCorrelationByPosition {
  const byPosition = groupBy(rows, (row) => row.position);
  const result = {} as AgeCorrelationByPosition;

  for (const position of POSITIONS) {
    const positionRows = byPosition.get(position) ?? [];
    const correlations: PositionAgeCorrelation[] = [];

    for (const metric of METRICS_BY_POSITION[position]) {
      const samples = buildPositionSamples(positionRows, metric);
      const correlation = samples.length >= MIN_CORRELATION_SAMPLE ? pearsonCorrelation(samples) : null;

      correlations.push({
        metric,
        sampleSize: samples.length,
        minSampleRequired: MIN_CORRELATION_SAMPLE,
        correlation
      });
    }

    result[position] = correlations;
  }

  return result;
}

export function buildPeakWindowsByPosition(rows: NormalizedPlayerSeasonRow[]): AgePeakWindowsByPosition {
  const byPosition = groupBy(rows, (row) => row.position);
  const result = {} as AgePeakWindowsByPosition;

  for (const position of POSITIONS) {
    const positionRows = byPosition.get(position) ?? [];
    const peakMetrics: PositionPeakMetric[] = [];

    for (const metric of METRICS_BY_POSITION[position]) {
      const byAge = groupBy(positionRows, (row) => row.age);
      const ageSummaries = Array.from(byAge.entries())
        .map(([age, ageRows]) => {
          const numericValues = ageRows
            .map((row) => toNumeric(row[metric] as number | null))
            .filter((value): value is number => value !== null);

          if (numericValues.length === 0) {
            return null;
          }

          const average = numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length;
          return {
            age,
            sampleSize: numericValues.length,
            avgValue: average
          };
        })
        .filter((summary): summary is { age: number; sampleSize: number; avgValue: number } => summary !== null)
        .sort((a, b) => a.age - b.age);

      const eligibleAges = ageSummaries.filter((ageSummary) => ageSummary.sampleSize >= MIN_PEAK_WINDOW_SAMPLE);

      let peakAge: number | null = null;
      let peakAgeValue: number | null = null;

      if (eligibleAges.length > 0) {
        const best = eligibleAges.reduce((top, current) => (current.avgValue > top.avgValue ? current : top));
        peakAge = best.age;
        peakAgeValue = best.avgValue;
      }

      let peakWindowStartAge: number | null = null;
      let peakWindowEndAge: number | null = null;
      let peakWindowAverage: number | null = null;
      let peakWindowSampleSize = 0;

      for (let index = 0; index < eligibleAges.length - 1; index += 1) {
        const current = eligibleAges[index];
        const next = eligibleAges[index + 1];

        if (next.age !== current.age + 1) {
          continue;
        }

        const combinedSample = current.sampleSize + next.sampleSize;
        if (combinedSample < MIN_PEAK_WINDOW_SAMPLE * 2) {
          continue;
        }

        const combinedAvg =
          (current.avgValue * current.sampleSize + next.avgValue * next.sampleSize) / combinedSample;

        if (peakWindowAverage === null || combinedAvg > peakWindowAverage) {
          peakWindowStartAge = current.age;
          peakWindowEndAge = next.age;
          peakWindowAverage = combinedAvg;
          peakWindowSampleSize = combinedSample;
        }
      }

      peakMetrics.push({
        metric,
        minSampleRequired: MIN_PEAK_WINDOW_SAMPLE,
        peakAge,
        peakAgeValue,
        peakWindowStartAge,
        peakWindowEndAge,
        peakWindowAverage,
        peakWindowSampleSize,
        byAge: ageSummaries
      });
    }

    result[position] = peakMetrics;
  }

  return result;
}

export function buildPlayerAgePeerProfilesByPosition(rows: NormalizedPlayerSeasonRow[]): PlayerAgePeerProfileByPosition {
  const byPosition = groupBy(rows, (row) => row.position);
  const result = {} as PlayerAgePeerProfileByPosition;

  for (const position of POSITIONS) {
    const metrics = METRICS_BY_POSITION[position];
    const positionRows = byPosition.get(position) ?? [];
    const ageBuckets = groupBy(positionRows, (row) => row.age);

    const profiles: PositionPlayerAgePeerProfile[] = positionRows.map((row) => {
      const sameAgeRows = ageBuckets.get(row.age) ?? [];
      const metricPercentiles = metrics
        .map((metric) => {
          const value = toNumeric(row[metric] as number | null);
          if (value === null) {
            return null;
          }

          const peerValues = sameAgeRows
            .map((peer) => toNumeric(peer[metric] as number | null))
            .filter((peerValue): peerValue is number => peerValue !== null);

          if (peerValues.length < MIN_PEER_SAMPLE) {
            return {
              metric,
              value,
              peerSampleSize: peerValues.length,
              minPeerSampleRequired: MIN_PEER_SAMPLE,
              percentile: null
            };
          }

          return {
            metric,
            value,
            peerSampleSize: peerValues.length,
            minPeerSampleRequired: MIN_PEER_SAMPLE,
            percentile: percentileRank(value, peerValues)
          };
        })
        .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

      return {
        playerId: row.playerId,
        playerName: row.playerName,
        position,
        season: row.season,
        age: row.age,
        metrics: metricPercentiles
      };
    });

    result[position] = sortByAge(profiles);
  }

  return result;
}

export function buildAgeTrajectoryScoresByPosition(rows: NormalizedPlayerSeasonRow[]): AgeTrajectoryScoresByPosition {
  const byPosition = groupBy(rows, (row) => row.position);
  const result = {} as AgeTrajectoryScoresByPosition;

  for (const position of POSITIONS) {
    const metrics = METRICS_BY_POSITION[position];
    const positionRows = byPosition.get(position) ?? [];
    const ageBuckets = groupBy(positionRows, (row) => row.age);

    const scores: PositionAgeTrajectoryScore[] = positionRows.map((row) => {
      const sameAgeRows = ageBuckets.get(row.age) ?? [];
      return calculateTrajectoryScore(row, metrics, sameAgeRows);
    });

    result[position] = sortByAge(scores);
  }

  return result;
}
