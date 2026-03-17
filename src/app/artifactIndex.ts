import { access, readdir, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import { join } from "node:path";
import type { Position } from "../config/positions.js";
import type {
  AgeCurveByPosition,
  AgePeakWindowsByPosition,
  AgeSummaryReport,
  AgeTrajectoryScoresByPosition,
  PositionAgeTrajectoryScore,
  TiberAgeModifierArtifact,
  ValidationReport
} from "../types/research.js";
import { readLatestRunMetadata } from "./latestRunMetadata.js";

const RESEARCH_ARTIFACT_NAMES = [
  "age_curves_by_position.json",
  "age_summary_report.json",
  "age_peak_windows_by_position.json",
  "age_trajectory_scores_by_position.json",
  "tiber_age_modifiers.json"
] as const;

interface LatestArtifacts {
  ageCurves: AgeCurveByPosition;
  ageSummary: AgeSummaryReport;
  peakWindows: AgePeakWindowsByPosition;
  trajectoryScores: AgeTrajectoryScoresByPosition;
  ageModifiers: TiberAgeModifierArtifact;
}

async function readJsonIfExists<T>(artifactDir: string, fileName: string): Promise<T | null> {
  const filePath = join(artifactDir, fileName);
  try {
    await access(filePath, constants.R_OK);
  } catch {
    return null;
  }

  const content = await readFile(filePath, "utf-8");
  return JSON.parse(content) as T;
}

export async function listArtifacts(artifactDir: string): Promise<string[]> {
  try {
    const files = await readdir(artifactDir);
    return files.filter((file) => file.endsWith(".json") || file.endsWith(".csv")).sort();
  } catch {
    return [];
  }
}

export async function hasResearchArtifacts(artifactDir: string): Promise<boolean> {
  const artifactNames = await listArtifacts(artifactDir);
  return RESEARCH_ARTIFACT_NAMES.every((name) => artifactNames.includes(name));
}

export async function readLatestArtifacts(artifactDir: string): Promise<LatestArtifacts | null> {
  const ageCurves = await readJsonIfExists<AgeCurveByPosition>(artifactDir, "age_curves_by_position.json");
  const ageSummary = await readJsonIfExists<AgeSummaryReport>(artifactDir, "age_summary_report.json");
  const peakWindows = await readJsonIfExists<AgePeakWindowsByPosition>(artifactDir, "age_peak_windows_by_position.json");
  const trajectoryScores = await readJsonIfExists<AgeTrajectoryScoresByPosition>(artifactDir, "age_trajectory_scores_by_position.json");
  const ageModifiers = await readJsonIfExists<TiberAgeModifierArtifact>(artifactDir, "tiber_age_modifiers.json");

  if (!ageCurves || !ageSummary || !peakWindows || !trajectoryScores || !ageModifiers) {
    return null;
  }

  return { ageCurves, ageSummary, peakWindows, trajectoryScores, ageModifiers };
}

export async function readLatestValidation(artifactDir: string): Promise<ValidationReport | null> {
  return readJsonIfExists<ValidationReport>(artifactDir, "validation_report.json");
}

export async function buildResultsSummary(artifactDir: string) {
  const data = await readLatestArtifacts(artifactDir);
  if (!data) {
    return null;
  }

  const totalIncludedRows = data.ageSummary.positions.reduce((sum, p) => sum + p.totalIncludedSeasons, 0);
  const positionsCovered = data.ageSummary.positions.filter((p) => p.totalIncludedSeasons > 0).map((p) => p.position);
  const artifactNames = await listArtifacts(artifactDir);
  const validation = await readLatestValidation(artifactDir);
  const latestRunMetadata = await readLatestRunMetadata(artifactDir);

  return {
    generatedAt: data.ageSummary.generatedAt,
    includedRowCount: totalIncludedRows,
    positionsCovered,
    artifacts: artifactNames,
    latestRunMetadata,
    validation: validation
      ? {
          generatedAt: validation.generatedAt,
          passedCases: validation.passedCases,
          failedCases: validation.failedCases,
          totalCases: validation.totalCases,
          failures: validation.results
            .filter((result) => !result.pass)
            .map((result) => ({
              caseName: result.caseName,
              mismatchExplanations: result.mismatchExplanations
            }))
        }
      : null
  };
}

export async function buildPositionSummary(artifactDir: string, position: Position) {
  const data = await readLatestArtifacts(artifactDir);
  if (!data) {
    return null;
  }

  const scores = (data.trajectoryScores[position] ?? []).filter((row) => row.ageTrajectoryScore !== null);
  const sorted = [...scores].sort((a, b) => (b.ageTrajectoryScore as number) - (a.ageTrajectoryScore as number));
  const topPlayers = sorted.slice(0, 5);
  const bottomPlayers = sorted.slice(-5).reverse();

  const modifierCounts = (data.ageModifiers.rows || []).filter((row) => row.position === position).reduce<Record<string, number>>((acc, row) => {
    acc[row.recommendedModifierBucket] = (acc[row.recommendedModifierBucket] ?? 0) + 1;
    return acc;
  }, {});

  const playerRows = sorted.map((row) => {
    const modifier = data.ageModifiers.rows.find((m) => m.playerId === row.playerId && m.season === row.season);
    return {
      playerId: row.playerId,
      playerName: row.playerName,
      season: row.season,
      age: row.age,
      ageTrajectoryScore: row.ageTrajectoryScore,
      ageCurveStatus: row.ageCurveStatus,
      ageBandStage: row.ageBandStage,
      recommendedModifierBucket: modifier?.recommendedModifierBucket ?? "neutral"
    };
  });

  return {
    position,
    ageCurves: data.ageCurves[position] ?? [],
    peakWindows: data.peakWindows[position] ?? [],
    topPlayers,
    bottomPlayers,
    playerRows,
    modifierBucketCounts: modifierCounts
  };
}

export async function listLatestPlayers(artifactDir: string) {
  const data = await readLatestArtifacts(artifactDir);
  if (!data) {
    return null;
  }

  const allRows = Object.values(data.trajectoryScores).flat();
  const latestByPlayer = new Map<string, PositionAgeTrajectoryScore>();

  for (const row of allRows) {
    const existing = latestByPlayer.get(row.playerId);
    if (!existing || row.season > existing.season) {
      latestByPlayer.set(row.playerId, row);
    }
  }

  return [...latestByPlayer.values()]
    .map((row) => ({
      playerId: row.playerId,
      playerName: row.playerName,
      season: row.season,
      position: row.position
    }))
    .sort((a, b) => a.playerName.localeCompare(b.playerName));
}

function matchesPlayerQuery(row: PositionAgeTrajectoryScore, playerId: string, season?: number): boolean {
  if (row.playerId !== playerId) {
    return false;
  }
  if (typeof season === "number") {
    return row.season === season;
  }
  return true;
}

export async function findPlayerResult(artifactDir: string, playerId: string, season?: number) {
  const data = await readLatestArtifacts(artifactDir);
  if (!data) {
    return null;
  }

  const allRows = Object.values(data.trajectoryScores).flat();
  const matches = allRows.filter((row) => matchesPlayerQuery(row, playerId, season));

  const bestMatch = matches.sort((a, b) => b.season - a.season)[0];
  if (!bestMatch) {
    return undefined;
  }

  const modifier = data.ageModifiers.rows.find((row) => row.playerId === bestMatch.playerId && row.season === bestMatch.season);

  return {
    playerName: bestMatch.playerName,
    playerId: bestMatch.playerId,
    season: bestMatch.season,
    age: bestMatch.age,
    position: bestMatch.position,
    ageTrajectoryScore: bestMatch.ageTrajectoryScore,
    ageCurveStatus: bestMatch.ageCurveStatus,
    ageCurveDelta: bestMatch.ageCurveDelta,
    ageBandStage: bestMatch.ageBandStage,
    flags: bestMatch.flags,
    productionReason: bestMatch.productionReason,
    roleReason: bestMatch.roleReason,
    efficiencyReason: bestMatch.efficiencyReason,
    overallReasonSummary: bestMatch.overallReasonSummary,
    recommendedModifierBucket: modifier?.recommendedModifierBucket ?? null,
    modifierMagnitude: modifier?.modifierMagnitude ?? null
  };
}
