import { writeJson } from "../export/writeJson.js";
import { runValidationSuite } from "../research/validation.js";

export async function buildValidationRun(outDir: string) {
  const report = runValidationSuite();
  await writeJson(outDir, "validation_report.json", report);
  return report;
}
