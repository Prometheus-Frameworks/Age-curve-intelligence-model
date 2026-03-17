import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

export async function writeCsv(outDir: string, fileName: string, csv: string): Promise<string> {
  await mkdir(outDir, { recursive: true });
  const path = join(outDir, fileName);
  await writeFile(path, csv, "utf8");
  return path;
}
