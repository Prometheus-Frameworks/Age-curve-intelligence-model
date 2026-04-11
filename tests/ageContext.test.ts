import test from "node:test";
import assert from "node:assert/strict";

import { buildTiberAgeContextArtifact } from "../src/research/ageContext.js";
import type { PositionAgeTrajectoryScore, RuleFlag, AgeTrajectoryScoresByPosition } from "../src/types/research.js";

function makeFlags(flags: Array<Pick<RuleFlag, "code" | "severity">>): RuleFlag[] {
  return flags.map((flag) => ({
    code: flag.code,
    severity: flag.severity,
    label: flag.code,
    message: flag.code
  }));
}

function makeScore(overrides: Partial<PositionAgeTrajectoryScore> = {}): PositionAgeTrajectoryScore {
  return {
    playerId: "p1",
    playerName: "Test Player",
    position: "RB",
    season: 2024,
    age: 24.2,
    componentCount: 3,
    totalWeight: 1,
    ageTrajectoryScore: 0.15,
    ageCurveDelta: 0.11,
    ageCurveStatus: "ahead",
    ageBandStage: "peak-window",
    flags: [],
    productionReason: "base",
    roleReason: "base",
    efficiencyReason: "base",
    overallReasonSummary: "base",
    interpretation: "base",
    components: [],
    ...overrides
  };
}

function build(scores: PositionAgeTrajectoryScore[]) {
  const byPosition: AgeTrajectoryScoresByPosition = {
    QB: [],
    RB: scores,
    WR: [],
    TE: []
  };

  const artifact = buildTiberAgeContextArtifact(byPosition);
  return artifact.players[0];
}

test("low reliability never emits dynasty_only", () => {
  const player = build([
    makeScore({
      componentCount: 1,
      flags: makeFlags([{ code: "stability_warning", severity: "warning" }])
    })
  ]);

  assert.equal(player.reliabilityTier, "low");
  assert.notEqual(player.rankAdjustmentPolicy, "dynasty_only");
  assert.equal(player.scoringEligible, false);
});

test("unknown reliability never emits dynasty_only", () => {
  const player = build([
    makeScore({
      componentCount: 0,
      ageTrajectoryScore: null,
      ageCurveDelta: null,
      ageCurveStatus: null
    })
  ]);

  assert.equal(player.reliabilityTier, "unknown");
  assert.equal(player.rankAdjustmentPolicy, "none");
  assert.equal(player.scoringEligible, false);
});

test("unknown age-curve status never emits dynasty_only", () => {
  const player = build([
    makeScore({
      ageCurveStatus: null
    })
  ]);

  assert.equal(player.ageCurveStatus, "unknown");
  assert.notEqual(player.rankAdjustmentPolicy, "dynasty_only");
  assert.equal(player.rankAdjustmentPolicy, "none");
});

test("insufficient component data triggers hard suppression", () => {
  const player = build([
    makeScore({
      componentCount: 1,
      flags: makeFlags([{ code: "insufficient_component_data", severity: "warning" }])
    })
  ]);

  assert.ok(player.suppressReasons.includes("insufficient_component_data"));
  assert.equal(player.rankAdjustmentPolicy, "none");
  assert.equal(player.scoringEligible, false);
});

test("warning burden downgrades policy conservatively", () => {
  const player = build([
    makeScore({
      flags: makeFlags([
        { code: "low_peer_sample", severity: "warning" },
        { code: "stability_warning", severity: "warning" }
      ])
    })
  ]);

  assert.ok(player.suppressReasons.includes("warning_burden"));
  assert.equal(player.rankAdjustmentPolicy, "none");
  assert.equal(player.displayOnly, false);
});

test("clean medium/high cases can emit dynasty_only", () => {
  const player = build([
    makeScore({
      componentCount: 2,
      flags: []
    })
  ]);

  assert.ok(["medium", "high"].includes(player.reliabilityTier));
  assert.equal(player.rankAdjustmentPolicy, "dynasty_only");
  assert.equal(player.scoringEligible, true);
  assert.equal(player.displayOnly, false);
});

test("scoringEligible/displayOnly remain consistent with rankAdjustmentPolicy", () => {
  const nonePlayer = build([
    makeScore({
      ageCurveStatus: null,
      ageCurveDelta: null,
      ageTrajectoryScore: null
    })
  ]);

  assert.equal(nonePlayer.rankAdjustmentPolicy, "none");
  assert.equal(nonePlayer.scoringEligible, false);
  assert.equal(nonePlayer.displayOnly, false);

  const displayOnlyPlayer = build([
    makeScore({
      componentCount: 2,
      flags: makeFlags([{ code: "low_peer_sample", severity: "warning" }])
    })
  ]);

  assert.equal(displayOnlyPlayer.rankAdjustmentPolicy, "display_only");
  assert.equal(displayOnlyPlayer.scoringEligible, false);
  assert.equal(displayOnlyPlayer.displayOnly, true);

  const dynastyPlayer = build([
    makeScore({
      componentCount: 3,
      flags: []
    })
  ]);

  assert.equal(dynastyPlayer.rankAdjustmentPolicy, "dynasty_only");
  assert.equal(dynastyPlayer.scoringEligible, true);
  assert.equal(dynastyPlayer.displayOnly, false);
});

test("summary output is deterministic for identical inputs", () => {
  const score = makeScore({ componentCount: 3, flags: [] });
  const byPosition: AgeTrajectoryScoresByPosition = {
    QB: [],
    RB: [score],
    WR: [],
    TE: []
  };

  const first = buildTiberAgeContextArtifact(byPosition).players[0];
  const second = buildTiberAgeContextArtifact(byPosition).players[0];

  assert.equal(first.summary, second.summary);
});
