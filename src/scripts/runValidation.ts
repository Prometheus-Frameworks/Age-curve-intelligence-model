import { buildValidationRun } from "../app/buildValidationRun.js";
import { logger } from "../utils/logger.js";

async function main() {
  const report = await buildValidationRun("./artifacts");
  logger.info(`Validation complete: ${report.passedCases}/${report.totalCases} cases passed.`);
  if (report.failedCases > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  logger.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
