import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import { join } from "node:path";
import { writeJson } from "../export/writeJson.js";
import type { ValidationReport, LatestRunMetadata } from "../types/research.js";

const METADATA_FILE_NAME = "latest_run_metadata.json";

export async function readLatestRunMetadata(artifactDir: string): Promise<LatestRunMetadata | null> {
  const path = join(artifactDir, METADATA_FILE_NAME);
  try {
    await access(path, constants.R_OK);
  } catch {
    return null;
  }

  const json = await readFile(path, "utf-8");
  return JSON.parse(json) as LatestRunMetadata;
}

export async function writeLatestRunMetadata(artifactDir: string, metadata: LatestRunMetadata) {
  await writeJson(artifactDir, METADATA_FILE_NAME, metadata);
}

export function buildValidationSummary(report: ValidationReport) {
  return {
    totalCases: report.totalCases,
    passedCases: report.passedCases,
    failedCases: report.failedCases
  };
}

export const LATEST_RUN_METADATA_FILE_NAME = METADATA_FILE_NAME;
