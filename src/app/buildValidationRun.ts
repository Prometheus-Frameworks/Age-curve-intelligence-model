import { writeJson } from "../export/writeJson.js";
import { runValidationSuite } from "../research/validation.js";
import { buildValidationSummary, readLatestRunMetadata, writeLatestRunMetadata } from "./latestRunMetadata.js";

export async function buildValidationRun(outDir: string) {
  const report = runValidationSuite();
  await writeJson(outDir, "validation_report.json", report);

  const metadata = await readLatestRunMetadata(outDir);
  if (metadata) {
    await writeLatestRunMetadata(outDir, {
      ...metadata,
      generatedAt: new Date().toISOString(),
      validationRan: true,
      validationSummary: buildValidationSummary(report)
    });
  }

  return report;
}
