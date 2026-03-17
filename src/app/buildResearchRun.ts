import { extname } from "node:path";
import { loadCsv } from "../loaders/loadCsv.js";
import { loadJson } from "../loaders/loadJson.js";
import { normalizePlayerRows } from "../normalizers/normalizePlayerRows.js";
import { validateRow } from "../normalizers/validateRow.js";
import { buildAgeCurvesByPosition, buildAgeMetricAveragesByPosition } from "../research/ageCurves.js";
import {
  buildAgeCorrelationsByPosition,
  buildAgeTrajectoryScoresByPosition,
  buildPeakWindowsByPosition,
  buildPlayerAgePeerProfilesByPosition,
  buildTiberAgeModifierArtifact,
  buildTiberReintegrationArtifact
} from "../research/ageAnalytics.js";
import { buildAgeSummaryReport } from "../research/summaries.js";
import { writeJson } from "../export/writeJson.js";

const RESEARCH_ARTIFACTS = [
  "age_curves_by_position.json",
  "age_metric_averages_by_position.json",
  "age_summary_report.json",
  "age_correlations_by_position.json",
  "age_peak_windows_by_position.json",
  "player_age_peer_profiles_by_position.json",
  "age_trajectory_scores_by_position.json",
  "tiber_reintegration_player_scores.json",
  "tiber_age_modifiers.json"
] as const;

export interface ResearchRunResult {
  inputRows: number;
  includedRows: number;
  artifacts: string[];
}

async function loadInput(inputPath: string) {
  const extension = extname(inputPath).toLowerCase();
  if (extension === ".json") {
    return loadJson(inputPath);
  }
  if (extension === ".csv") {
    return loadCsv(inputPath);
  }
  throw new Error(`Unsupported input format: ${extension}`);
}

export async function buildResearchRun(inputPath: string, outDir: string): Promise<ResearchRunResult> {
  const rawRows = await loadInput(inputPath);
  const normalized = normalizePlayerRows(rawRows);
  const validRows = normalized.filter(validateRow);

  const ageCurves = buildAgeCurvesByPosition(validRows);
  const metricAverages = buildAgeMetricAveragesByPosition(validRows);
  const summary = buildAgeSummaryReport(validRows);
  const correlations = buildAgeCorrelationsByPosition(validRows);
  const peakWindows = buildPeakWindowsByPosition(validRows);
  const playerAgeProfiles = buildPlayerAgePeerProfilesByPosition(validRows);
  const trajectoryScores = buildAgeTrajectoryScoresByPosition(validRows, ageCurves, peakWindows);
  const tiberReintegration = buildTiberReintegrationArtifact(trajectoryScores);
  const tiberAgeModifiers = buildTiberAgeModifierArtifact(trajectoryScores);

  await writeJson(outDir, "age_curves_by_position.json", ageCurves);
  await writeJson(outDir, "age_metric_averages_by_position.json", metricAverages);
  await writeJson(outDir, "age_summary_report.json", summary);
  await writeJson(outDir, "age_correlations_by_position.json", correlations);
  await writeJson(outDir, "age_peak_windows_by_position.json", peakWindows);
  await writeJson(outDir, "player_age_peer_profiles_by_position.json", playerAgeProfiles);
  await writeJson(outDir, "age_trajectory_scores_by_position.json", trajectoryScores);
  await writeJson(outDir, "tiber_reintegration_player_scores.json", tiberReintegration);
  await writeJson(outDir, "tiber_age_modifiers.json", tiberAgeModifiers);

  return {
    inputRows: rawRows.length,
    includedRows: validRows.length,
    artifacts: [...RESEARCH_ARTIFACTS]
  };
}
