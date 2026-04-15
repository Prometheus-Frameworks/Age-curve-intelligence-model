/**
 * Contract tests for tiber_age_context_v1 artifact.
 *
 * These tests assert structural compliance: every required field is present,
 * every value falls within the allowed set, and cross-record invariants hold.
 * They are intentionally separate from the guardrail/policy tests in
 * ageContext.test.ts, which verify derivation logic.
 *
 * If any test here fails, the artifact is unsafe to emit downstream.
 */
import test from "node:test";
import assert from "node:assert/strict";

import { buildTiberAgeContextArtifact } from "../src/research/ageContext.js";
import {
  CAREER_STAGE_VALUES,
  AGE_CURVE_STATUS_VALUES,
  RELIABILITY_TIER_VALUES,
  RANK_ADJUSTMENT_POLICY_VALUES,
  MODIFIER_BUCKET_VALUES,
  TIBER_AGE_CONTEXT_ARTIFACT_VERSION,
  TIBER_AGE_CONTEXT_MODEL_VERSION,
} from "../src/types/ageContext.js";
import type {
  AgeTrajectoryScoresByPosition,
  PositionAgeTrajectoryScore,
  RuleFlag,
} from "../src/types/research.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFlags(flags: Array<Pick<RuleFlag, "code" | "severity">>): RuleFlag[] {
  return flags.map((f) => ({ code: f.code, severity: f.severity, label: f.code, message: f.code }));
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
    ...overrides,
  };
}

/** Build an artifact from an array of RB scores. */
function buildFrom(scores: PositionAgeTrajectoryScore[], runId = "run_contract_test") {
  const byPosition: AgeTrajectoryScoresByPosition = { QB: [], RB: scores, WR: [], TE: [] };
  return buildTiberAgeContextArtifact(byPosition, runId);
}

/**
 * A fixture that covers all meaningful player states:
 * clean high-reliability, display-only (soft suppressed), hard-suppressed, unknown reliability.
 */
const FIXTURE_SCORES: PositionAgeTrajectoryScore[] = [
  // 1. Clean high-reliability — eligible for dynasty_only
  makeScore({ playerId: "p-clean", playerName: "Clean Player", componentCount: 3, flags: [] }),
  // 2. Soft suppressed — display_only
  makeScore({
    playerId: "p-soft",
    playerName: "Soft Player",
    componentCount: 2,
    flags: makeFlags([{ code: "low_peer_sample", severity: "warning" }]),
  }),
  // 3. Warning burden — hard suppressed (none)
  makeScore({
    playerId: "p-hard",
    playerName: "Hard Player",
    componentCount: 3,
    flags: makeFlags([
      { code: "low_peer_sample", severity: "warning" },
      { code: "stability_warning", severity: "warning" },
    ]),
  }),
  // 4. Unknown reliability — hard suppressed (none)
  makeScore({
    playerId: "p-unknown",
    playerName: "Unknown Player",
    componentCount: 0,
    ageTrajectoryScore: null,
    ageCurveDelta: null,
    ageCurveStatus: null,
  }),
  // 5. Post-peak behind — display_only
  makeScore({
    playerId: "p-postpeak",
    playerName: "Post Peak Player",
    componentCount: 3,
    ageBandStage: "post-peak",
    ageCurveStatus: "behind",
    ageCurveDelta: -0.15,
    flags: [],
  }),
  // 6. Decline zone fade candidate
  makeScore({
    playerId: "p-decline",
    playerName: "Decline Player",
    componentCount: 3,
    ageBandStage: "decline-zone",
    ageCurveStatus: "behind",
    ageCurveDelta: -0.22,
    flags: [],
  }),
];

const FIXTURE_ARTIFACT = buildFrom(FIXTURE_SCORES);

// ---------------------------------------------------------------------------
// Top-level artifact contract
// ---------------------------------------------------------------------------

test("artifact has correct artifactVersion", () => {
  assert.equal(FIXTURE_ARTIFACT.artifactVersion, TIBER_AGE_CONTEXT_ARTIFACT_VERSION);
  assert.equal(FIXTURE_ARTIFACT.artifactVersion, "tiber_age_context_v1");
});

test("artifact has correct modelVersion", () => {
  assert.equal(FIXTURE_ARTIFACT.modelVersion, TIBER_AGE_CONTEXT_MODEL_VERSION);
  assert.equal(FIXTURE_ARTIFACT.modelVersion, "age-context-v1");
});

test("artifact has a valid ISO generatedAt timestamp", () => {
  assert.ok(typeof FIXTURE_ARTIFACT.generatedAt === "string", "generatedAt must be a string");
  const parsed = new Date(FIXTURE_ARTIFACT.generatedAt);
  assert.ok(!isNaN(parsed.getTime()), `generatedAt is not a valid ISO date: ${FIXTURE_ARTIFACT.generatedAt}`);
});

test("artifact scope has correct module and non-empty ownership arrays", () => {
  const { scope } = FIXTURE_ARTIFACT;
  assert.equal(scope.module, "tiber_age_context");
  assert.ok(Array.isArray(scope.owns) && scope.owns.length > 0, "scope.owns must be a non-empty array");
  assert.ok(Array.isArray(scope.doesNotOwn) && scope.doesNotOwn.length > 0, "scope.doesNotOwn must be a non-empty array");
});

test("artifact provenance has required data-lineage fields", () => {
  const { provenance } = FIXTURE_ARTIFACT;
  assert.ok(typeof provenance.sourceDataset === "string" && provenance.sourceDataset.length > 0, "provenance.sourceDataset missing");
  assert.ok(typeof provenance.runId === "string" && provenance.runId.length > 0, "provenance.runId missing");
  assert.ok(typeof provenance.calibrationVersion === "string" && provenance.calibrationVersion.length > 0, "provenance.calibrationVersion missing");
  assert.equal(provenance.modifierStatus, "provisional");
});

test("artifact contains a players array", () => {
  assert.ok(Array.isArray(FIXTURE_ARTIFACT.players), "players must be an array");
  assert.ok(FIXTURE_ARTIFACT.players.length > 0, "players must be non-empty for a non-empty input");
});

// ---------------------------------------------------------------------------
// Per-player field presence (applied to every record in the fixture)
// ---------------------------------------------------------------------------

test("every player has required identity fields", () => {
  for (const player of FIXTURE_ARTIFACT.players) {
    assert.ok(typeof player.playerId === "string" && player.playerId.length > 0, `${player.playerId}: playerId missing`);
    assert.ok(typeof player.playerName === "string" && player.playerName.length > 0, `${player.playerId}: playerName missing`);
    assert.ok(typeof player.season === "number", `${player.playerId}: season must be a number`);
    assert.ok(typeof player.position === "string" && player.position.length > 0, `${player.playerId}: position missing`);
    assert.ok(typeof player.age === "number", `${player.playerId}: age must be a number`);
  }
});

test("every player careerStage is within the allowed set", () => {
  for (const player of FIXTURE_ARTIFACT.players) {
    assert.ok(
      (CAREER_STAGE_VALUES as readonly string[]).includes(player.careerStage),
      `${player.playerId}: careerStage "${player.careerStage}" is not in allowed set`
    );
  }
});

test("every player ageCurveStatus is within the allowed set", () => {
  for (const player of FIXTURE_ARTIFACT.players) {
    assert.ok(
      (AGE_CURVE_STATUS_VALUES as readonly string[]).includes(player.ageCurveStatus),
      `${player.playerId}: ageCurveStatus "${player.ageCurveStatus}" is not in allowed set`
    );
  }
});

test("every player ageCurveDelta is number or null", () => {
  for (const player of FIXTURE_ARTIFACT.players) {
    assert.ok(
      player.ageCurveDelta === null || typeof player.ageCurveDelta === "number",
      `${player.playerId}: ageCurveDelta must be number | null`
    );
  }
});

test("every player peerPercentile is number or null", () => {
  for (const player of FIXTURE_ARTIFACT.players) {
    assert.ok(
      player.peerPercentile === null || typeof player.peerPercentile === "number",
      `${player.playerId}: peerPercentile must be number | null`
    );
  }
});

test("every player reliabilityTier is within the allowed set", () => {
  for (const player of FIXTURE_ARTIFACT.players) {
    assert.ok(
      (RELIABILITY_TIER_VALUES as readonly string[]).includes(player.reliabilityTier),
      `${player.playerId}: reliabilityTier "${player.reliabilityTier}" is not in allowed set`
    );
  }
});

test("every player has warningFlags and suppressReasons as arrays", () => {
  for (const player of FIXTURE_ARTIFACT.players) {
    assert.ok(Array.isArray(player.warningFlags), `${player.playerId}: warningFlags must be an array`);
    assert.ok(Array.isArray(player.suppressReasons), `${player.playerId}: suppressReasons must be an array`);
  }
});

test("every player has boolean scoringEligible and displayOnly", () => {
  for (const player of FIXTURE_ARTIFACT.players) {
    assert.ok(typeof player.scoringEligible === "boolean", `${player.playerId}: scoringEligible must be boolean`);
    assert.ok(typeof player.displayOnly === "boolean", `${player.playerId}: displayOnly must be boolean`);
  }
});

// ---------------------------------------------------------------------------
// rankAdjustmentPolicy — the most critical contract constraint
// ---------------------------------------------------------------------------

test("every player rankAdjustmentPolicy is within the allowed PR1 set", () => {
  for (const player of FIXTURE_ARTIFACT.players) {
    assert.ok(
      (RANK_ADJUSTMENT_POLICY_VALUES as readonly string[]).includes(player.rankAdjustmentPolicy),
      `${player.playerId}: rankAdjustmentPolicy "${player.rankAdjustmentPolicy}" is not in allowed set`
    );
  }
});

test("full_context is never emitted by any player", () => {
  for (const player of FIXTURE_ARTIFACT.players) {
    assert.notEqual(
      player.rankAdjustmentPolicy,
      "full_context",
      `${player.playerId}: full_context must never be emitted in PR1`
    );
  }
});

// ---------------------------------------------------------------------------
// modifierBucket and modifierMagnitude
// ---------------------------------------------------------------------------

test("every player modifierBucket is within the allowed set", () => {
  for (const player of FIXTURE_ARTIFACT.players) {
    assert.ok(
      (MODIFIER_BUCKET_VALUES as readonly string[]).includes(player.modifierBucket),
      `${player.playerId}: modifierBucket "${player.modifierBucket}" is not in allowed set`
    );
  }
});

test("every player modifierMagnitude is number or null", () => {
  for (const player of FIXTURE_ARTIFACT.players) {
    assert.ok(
      player.modifierMagnitude === null || typeof player.modifierMagnitude === "number",
      `${player.playerId}: modifierMagnitude must be number | null`
    );
  }
});

// ---------------------------------------------------------------------------
// modifierIsProvisional — must always be literal true
// ---------------------------------------------------------------------------

test("modifierIsProvisional is always literal true on every player", () => {
  for (const player of FIXTURE_ARTIFACT.players) {
    assert.strictEqual(
      player.modifierIsProvisional,
      true,
      `${player.playerId}: modifierIsProvisional must be literal true`
    );
  }
});

// ---------------------------------------------------------------------------
// summary
// ---------------------------------------------------------------------------

test("every player summary is a non-empty string", () => {
  for (const player of FIXTURE_ARTIFACT.players) {
    assert.ok(typeof player.summary === "string" && player.summary.length > 0, `${player.playerId}: summary must be a non-empty string`);
  }
});

// ---------------------------------------------------------------------------
// Player provenance
// ---------------------------------------------------------------------------

test("every player provenance has required lineage fields", () => {
  for (const player of FIXTURE_ARTIFACT.players) {
    const prov = player.provenance;
    assert.ok(
      prov.baselineSource === null || typeof prov.baselineSource === "string",
      `${player.playerId}: provenance.baselineSource must be string | null`
    );
    assert.ok(
      prov.peerGroupSize === null || typeof prov.peerGroupSize === "number",
      `${player.playerId}: provenance.peerGroupSize must be number | null`
    );
    assert.ok(
      typeof prov.runId === "string" && prov.runId.length > 0,
      `${player.playerId}: provenance.runId must be a non-empty string`
    );
    assert.ok(Array.isArray(prov.sourceArtifactNames), `${player.playerId}: provenance.sourceArtifactNames must be an array`);
  }
});

// ---------------------------------------------------------------------------
// Cross-record invariants
// ---------------------------------------------------------------------------

test("all player runIds match the artifact-level runId", () => {
  const artifactRunId = FIXTURE_ARTIFACT.provenance.runId;
  for (const player of FIXTURE_ARTIFACT.players) {
    assert.equal(
      player.provenance.runId,
      artifactRunId,
      `${player.playerId}: player runId "${player.provenance.runId}" does not match artifact runId "${artifactRunId}"`
    );
  }
});

test("scoringEligible and displayOnly are mutually exclusive", () => {
  for (const player of FIXTURE_ARTIFACT.players) {
    assert.ok(
      !(player.scoringEligible && player.displayOnly),
      `${player.playerId}: scoringEligible and displayOnly cannot both be true`
    );
  }
});

test("suppressed players (rankAdjustmentPolicy=none) are never scoringEligible or displayOnly", () => {
  for (const player of FIXTURE_ARTIFACT.players) {
    if (player.rankAdjustmentPolicy === "none") {
      assert.equal(player.scoringEligible, false, `${player.playerId}: suppressed player must not be scoringEligible`);
      assert.equal(player.displayOnly, false, `${player.playerId}: suppressed player must not be displayOnly`);
    }
  }
});

test("dynasty_only players are always scoringEligible and never displayOnly", () => {
  for (const player of FIXTURE_ARTIFACT.players) {
    if (player.rankAdjustmentPolicy === "dynasty_only") {
      assert.equal(player.scoringEligible, true, `${player.playerId}: dynasty_only player must be scoringEligible`);
      assert.equal(player.displayOnly, false, `${player.playerId}: dynasty_only player must not be displayOnly`);
    }
  }
});

test("display_only players are never scoringEligible", () => {
  for (const player of FIXTURE_ARTIFACT.players) {
    if (player.rankAdjustmentPolicy === "display_only") {
      assert.equal(player.scoringEligible, false, `${player.playerId}: display_only player must not be scoringEligible`);
      assert.equal(player.displayOnly, true, `${player.playerId}: display_only player must have displayOnly=true`);
    }
  }
});

test("non-dynasty_only players never receive a non-neutral modifier bucket", () => {
  for (const player of FIXTURE_ARTIFACT.players) {
    if (player.rankAdjustmentPolicy !== "dynasty_only") {
      assert.equal(
        player.modifierBucket,
        "no_adjustment",
        `${player.playerId}: policy "${player.rankAdjustmentPolicy}" must not emit modifier bucket "${player.modifierBucket}"`
      );
      assert.equal(
        player.modifierMagnitude,
        null,
        `${player.playerId}: policy "${player.rankAdjustmentPolicy}" must not emit a non-null modifierMagnitude`
      );
    }
  }
});
