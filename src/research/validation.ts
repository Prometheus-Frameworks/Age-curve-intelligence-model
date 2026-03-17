import { VALIDATION_CASES } from "../config/validationCases.js";
import type { NormalizedPlayerSeasonRow } from "../types/normalized.js";
import type { ValidationCaseResult, ValidationReport } from "../types/research.js";
import type { Position } from "../config/positions.js";
import { buildAgeCurvesByPosition } from "./ageCurves.js";
import { buildAgeTrajectoryScoresByPosition, buildPeakWindowsByPosition } from "./ageAnalytics.js";

function baseRow(overrides: Partial<NormalizedPlayerSeasonRow>): NormalizedPlayerSeasonRow {
  return {
    playerId: "p",
    playerName: "Player",
    season: 2024,
    age: 25,
    position: "WR",
    games: 17,
    fantasyPointsTotal: 200,
    fantasyPointsPerGame: 12,
    snaps: 700,
    snapSharePct: 0.75,
    carries: 0,
    targets: 100,
    touchesPerGame: 6,
    carriesPerGame: 0,
    targetsPerGame: 6,
    rushSharePct: 0,
    targetSharePct: 0.2,
    routeParticipationPct: 0.85,
    rushYardsPerGame: 0,
    recYardsPerGame: 65,
    passYardsPerGame: 0,
    ypc: 0,
    ypr: 11,
    totalTds: 8,
    boomPct: 0.2,
    fpStdDev: 5,
    xfpDiff: 0,
    ...overrides
  };
}

function buildPeers(position: Position, age: number, count: number, fantasyPointsPerGame: number): NormalizedPlayerSeasonRow[] {
  return Array.from({ length: count }, (_, i) =>
    baseRow({
      playerId: `${position}_peer_${age}_${i}`,
      playerName: `${position} peer ${i}`,
      position,
      age,
      season: 2024,
      fantasyPointsPerGame,
      fantasyPointsTotal: fantasyPointsPerGame * 17,
      carriesPerGame: position === "RB" ? 12 : 1,
      targetsPerGame: position === "QB" ? 0 : 5,
      targetSharePct: position === "QB" ? 0 : 0.16,
      routeParticipationPct: position === "RB" ? 0.4 : 0.75,
      rushSharePct: position === "RB" ? 0.5 : 0.05,
      rushYardsPerGame: position === "QB" ? 22 : position === "RB" ? 50 : 5,
      recYardsPerGame: position === "WR" || position === "TE" ? 55 : 18,
      passYardsPerGame: position === "QB" ? 240 : 0,
      ypc: position === "RB" ? 4.1 : 0,
      ypr: position === "WR" || position === "TE" ? 10.5 : 0,
      xfpDiff: position === "QB" ? 0.2 : 0
    })
  );
}

function buildValidationRows(): NormalizedPlayerSeasonRow[] {
  const rows: NormalizedPlayerSeasonRow[] = [];
  for (const age of [21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31]) {
    rows.push(...buildPeers("WR", age, 12, 11 + (age <= 26 ? 1.5 : -0.7 * (age - 26))));
    rows.push(...buildPeers("RB", age, 12, 12 + (age <= 24 ? 1.2 : -1.3 * (age - 24))));
    rows.push(...buildPeers("TE", age, 12, 8 + (age <= 27 ? 0.8 : -0.4 * (age - 27))));
    rows.push(...buildPeers("QB", age, 12, 15 + (age <= 28 ? 0.6 : -0.3 * (age - 28))));
  }

  rows.push(baseRow({ playerId: "case_wr_elite_aging", playerName: "Elite Aging WR", position: "WR", age: 31, fantasyPointsPerGame: 14.4, targetsPerGame: 8.3, targetSharePct: 0.3, recYardsPerGame: 89 }));
  rows.push(baseRow({ playerId: "case_rb_fragile_aging", playerName: "Fragile Aging RB", position: "RB", age: 29, fantasyPointsPerGame: 4.8, carriesPerGame: 7, rushSharePct: 0.22, ypc: 3.4 }));
  rows.push(baseRow({ playerId: "case_wr_young_breakout", playerName: "Young Breakout WR", position: "WR", age: 21, fantasyPointsPerGame: 13.8, targetsPerGame: 8, targetSharePct: 0.28 }));
  rows.push(baseRow({ playerId: "case_te_late_breakout", playerName: "Late Breakout TE", position: "TE", age: 29, fantasyPointsPerGame: 7.0, targetsPerGame: 6.8, targetSharePct: 0.22, routeParticipationPct: 0.85 }));
  rows.push(baseRow({ playerId: "case_qb_rushing_outlier", playerName: "Rushing Outlier QB", position: "QB", age: 27, fantasyPointsPerGame: 17.6, passYardsPerGame: 235, rushYardsPerGame: 58, xfpDiff: 1.5, targetsPerGame: 0, targetSharePct: 0 }));
  rows.push(baseRow({ playerId: "case_rb_young_behind", playerName: "Young Behind RB", position: "RB", age: 21, fantasyPointsPerGame: 8.6, carriesPerGame: 8, rushSharePct: 0.25, ypc: 3.6 }));
  rows.push(baseRow({ playerId: "case_qb_stable_veteran", playerName: "Stable Veteran QB", position: "QB", age: 31, fantasyPointsPerGame: 14.0, passYardsPerGame: 228, rushYardsPerGame: 16 }));

  rows.push(
    baseRow({ playerId: "case_te_low_sample", playerName: "Low Sample TE", position: "TE", age: 20, fantasyPointsPerGame: 9.1, targetsPerGame: 5.5 }),
    baseRow({ playerId: "te_low_1", playerName: "TE low 1", position: "TE", age: 20, fantasyPointsPerGame: 8.8 }),
    baseRow({ playerId: "te_low_2", playerName: "TE low 2", position: "TE", age: 20, fantasyPointsPerGame: 8.4 })
  );

  return rows;
}

export function runValidationSuite(): ValidationReport {
  const rows = buildValidationRows();
  const ageCurves = buildAgeCurvesByPosition(rows);
  const peakWindows = buildPeakWindowsByPosition(rows);
  const trajectoryScores = buildAgeTrajectoryScoresByPosition(rows, ageCurves, peakWindows);
  const allScores = Object.values(trajectoryScores).flat();

  const results: ValidationCaseResult[] = VALIDATION_CASES.map((testCase) => {
    const actual = allScores.find((score) => score.playerId === testCase.playerId);
    if (!actual) {
      return {
        caseName: testCase.caseName,
        pass: false,
        expected: testCase.expectation,
        actual: {
          ageCurveStatus: null,
          ageBandStage: "pre-peak",
          hasWarningFlag: true,
          flagCodes: ["missing_case_player"],
          overallReasonSummary: "Missing validation player."
        },
        mismatchExplanations: ["No trajectory score generated for validation player."]
      };
    }

    const mismatchExplanations: string[] = [];
    const hasWarningFlag = actual.flags.some((flag) => flag.severity === "warning");
    const flagCodes = actual.flags.map((flag) => flag.code);

    if (testCase.expectation.expectedAgeCurveStatus !== undefined && testCase.expectation.expectedAgeCurveStatus !== actual.ageCurveStatus) {
      mismatchExplanations.push(`Expected ageCurveStatus ${testCase.expectation.expectedAgeCurveStatus}, got ${actual.ageCurveStatus}.`);
    }
    if (testCase.expectation.expectedAgeBandStage && testCase.expectation.expectedAgeBandStage !== actual.ageBandStage) {
      mismatchExplanations.push(`Expected ageBandStage ${testCase.expectation.expectedAgeBandStage}, got ${actual.ageBandStage}.`);
    }
    if (typeof testCase.expectation.expectWarningFlag === "boolean" && testCase.expectation.expectWarningFlag !== hasWarningFlag) {
      mismatchExplanations.push(`Expected hasWarningFlag ${testCase.expectation.expectWarningFlag}, got ${hasWarningFlag}.`);
    }
    if (testCase.expectation.expectedFlagCodes) {
      for (const code of testCase.expectation.expectedFlagCodes) {
        if (!flagCodes.includes(code)) {
          mismatchExplanations.push(`Expected flag code ${code} was not present.`);
        }
      }
    }
    if (testCase.expectation.expectedThemes) {
      const summary = `${actual.overallReasonSummary} ${actual.productionReason} ${actual.roleReason} ${actual.efficiencyReason}`.toLowerCase();
      for (const theme of testCase.expectation.expectedThemes) {
        if (!summary.includes(theme.toLowerCase())) {
          mismatchExplanations.push(`Expected interpretation theme "${theme}" not found in reasons.`);
        }
      }
    }

    return {
      caseName: testCase.caseName,
      pass: mismatchExplanations.length === 0,
      expected: testCase.expectation,
      actual: {
        ageCurveStatus: actual.ageCurveStatus,
        ageBandStage: actual.ageBandStage,
        hasWarningFlag,
        flagCodes,
        overallReasonSummary: actual.overallReasonSummary
      },
      mismatchExplanations
    };
  });

  const passedCases = results.filter((result) => result.pass).length;
  return {
    generatedAt: new Date().toISOString(),
    totalCases: results.length,
    passedCases,
    failedCases: results.length - passedCases,
    results
  };
}
