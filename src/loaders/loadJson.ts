import { readFile } from "node:fs/promises";
import type { RawPlayerSeasonRow } from "../types/raw.js";

export async function loadJson(filePath: string): Promise<RawPlayerSeasonRow[]> {
  const raw = await readFile(filePath, "utf8");
  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error("Expected JSON export to be an array of rows.");
  }

  return parsed as RawPlayerSeasonRow[];
}
