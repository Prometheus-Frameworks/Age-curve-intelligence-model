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
import { logger } from "../utils/logger.js";

interface CliArgs {
  input?: string;
  outDir: string;
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = { outDir: "./artifacts" };

  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--input") {
      args.input = argv[i + 1];
      i += 1;
    } else if (argv[i] === "--outDir") {
      args.outDir = argv[i + 1] ?? args.outDir;
      i += 1;
    }
  }

  return args;
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

async function main() {
  const { input, outDir } = parseArgs(process.argv.slice(2));

  if (!input) {
    throw new Error("Missing required --input argument.");
  }

  const rawRows = await loadInput(input);
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

  logger.info(`Research completed. Input rows: ${rawRows.length}, included rows: ${validRows.length}.`);
}

main().catch((error) => {
  logger.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
