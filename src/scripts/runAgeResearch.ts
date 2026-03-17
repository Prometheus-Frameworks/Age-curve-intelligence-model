import { buildResearchRun } from "../app/buildResearchRun.js";
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

async function main() {
  const { input, outDir } = parseArgs(process.argv.slice(2));

  if (!input) {
    throw new Error("Missing required --input argument.");
  }

  const result = await buildResearchRun(input, outDir);
  logger.info(`Research completed. Input rows: ${result.inputRows}, included rows: ${result.includedRows}.`);
}

main().catch((error) => {
  logger.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
