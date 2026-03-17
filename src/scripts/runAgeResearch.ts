import { extname } from "node:path";
import { loadCsv } from "../loaders/loadCsv.js";
import { loadJson } from "../loaders/loadJson.js";
import { normalizePlayerRows } from "../normalizers/normalizePlayerRows.js";
import { validateRow } from "../normalizers/validateRow.js";
import { buildAgeCurvesByPosition, buildAgeMetricAveragesByPosition } from "../research/ageCurves.js";
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

  await writeJson(outDir, "age_curves_by_position.json", ageCurves);
  await writeJson(outDir, "age_metric_averages_by_position.json", metricAverages);
  await writeJson(outDir, "age_summary_report.json", summary);

  logger.info(`Research completed. Input rows: ${rawRows.length}, included rows: ${validRows.length}.`);
}

main().catch((error) => {
  logger.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
