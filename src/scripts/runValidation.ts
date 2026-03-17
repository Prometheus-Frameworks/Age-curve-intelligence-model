import { writeJson } from "../export/writeJson.js";
import { runValidationSuite } from "../research/validation.js";
import { logger } from "../utils/logger.js";

async function main() {
  const report = runValidationSuite();
  await writeJson("./artifacts", "validation_report.json", report);
  logger.info(`Validation complete: ${report.passedCases}/${report.totalCases} cases passed.`);
  if (report.failedCases > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  logger.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
