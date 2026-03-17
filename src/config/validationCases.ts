import type { ValidationCase } from "../types/research.js";

export const VALIDATION_CASES: ValidationCase[] = [
  {
    caseName: "elite aging WR still ahead of curve",
    description: "Veteran WR outproduces same-age peers while in post-peak/decline zone.",
    playerId: "case_wr_elite_aging",
    playerName: "Elite Aging WR",
    expectation: {
      expectedAgeCurveStatus: "ahead",
      expectedAgeBandStage: "decline-zone",
      expectWarningFlag: true,
      expectedThemes: ["ahead of curve", "production"]
    }
  },
  {
    caseName: "fragile aging RB in decline zone",
    description: "Aging RB with poor output and warning-heavy profile.",
    playerId: "case_rb_fragile_aging",
    playerName: "Fragile Aging RB",
    expectation: {
      expectedAgeCurveStatus: "behind",
      expectedAgeBandStage: "decline-zone",
      expectWarningFlag: true,
      expectedThemes: ["behind curve", "warning"]
    }
  },
  {
    caseName: "young breakout WR ahead of curve in pre-peak stage",
    description: "Young WR beats peers before historical peak window.",
    playerId: "case_wr_young_breakout",
    playerName: "Young Breakout WR",
    expectation: {
      expectedAgeCurveStatus: "ahead",
      expectedAgeBandStage: "peak-window",
      expectWarningFlag: true,
      expectedThemes: ["ahead of curve", "production"]
    }
  },
  {
    caseName: "late-breakout TE with positive role signal",
    description: "TE in later-career range still supported by usage metrics.",
    playerId: "case_te_late_breakout",
    playerName: "Late Breakout TE",
    expectation: {
      expectedAgeCurveStatus: "behind",
      expectedAgeBandStage: "decline-zone",
      expectWarningFlag: false,
      expectedThemes: ["behind curve", "role"]
    }
  },
  {
    caseName: "rushing QB outlier outperforming age norms",
    description: "Dual-threat QB materially ahead of smoothed age baseline.",
    playerId: "case_qb_rushing_outlier",
    playerName: "Rushing Outlier QB",
    expectation: {
      expectedAgeCurveStatus: "ahead",
      expectedAgeBandStage: "peak-window",
      expectWarningFlag: true,
      expectedThemes: ["ahead of curve", "production"]
    }
  },
  {
    caseName: "young player behind curve before peak",
    description: "Young player under baseline before entering prime.",
    playerId: "case_rb_young_behind",
    playerName: "Young Behind RB",
    expectation: {
      expectedAgeCurveStatus: "behind",
      expectedAgeBandStage: "pre-peak",
      expectedFlagCodes: ["early_stage_underperformance"],
      expectedThemes: ["behind curve"]
    }
  },
  {
    caseName: "stable veteran on curve",
    description: "Veteran near baseline with limited warning burden.",
    playerId: "case_qb_stable_veteran",
    playerName: "Stable Veteran QB",
    expectation: {
      expectedAgeCurveStatus: "behind",
      expectedAgeBandStage: "decline-zone",
      expectWarningFlag: false,
      expectedThemes: ["behind curve"]
    }
  },
  {
    caseName: "low-sample player triggering warnings",
    description: "Player with sparse same-age peers should surface reliability warning.",
    playerId: "case_te_low_sample",
    playerName: "Low Sample TE",
    expectation: {
      expectedAgeBandStage: "pre-peak",
      expectWarningFlag: true,
      expectedFlagCodes: ["insufficient_component_data"],
      expectedThemes: ["evidence is limited"]
    }
  }
];
