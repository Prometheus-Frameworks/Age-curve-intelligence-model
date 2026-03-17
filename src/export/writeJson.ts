import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

export async function writeJson(outDir: string, fileName: string, payload: unknown): Promise<string> {
  await mkdir(outDir, { recursive: true });
  const path = join(outDir, fileName);
  await writeFile(path, JSON.stringify(payload, null, 2), "utf8");
  return path;
}
