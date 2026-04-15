# TIBER Age Context v1 — Consumer Guide

This guide is written for engineers integrating `tiber_age_context_v1.json`
into a downstream system (e.g. TIBER-Fantasy). It covers field semantics,
mandatory ingestion gates, and anti-patterns that cause silent misuse.

For repo-level context (ownership scope, deployment, API routes) see the
[README](../README.md).

---

## What this artifact is and is not

**Is:** An age-context layer. It tells you where a player sits in their
career arc and whether they are outperforming, meeting, or underperforming
age expectations. It carries a provisional modifier recommendation and
explicit guardrails on how far downstream systems may apply it.

**Is not:** A ranking engine, a projection system, a standalone valuation
tool, or a trade recommendation surface. Applying this artifact's signals
as if it owned those domains will cause semantic drift.

---

## How to fetch it

```
GET /api/artifacts/tiber_age_context_v1.json
```

Or download via the UI artifacts panel after a research run.

---

## Mandatory ingestion gates

Apply these checks in order before using any player record. Skipping any
gate risks applying suppressed or non-authoritative signals.

### Gate 1 — Artifact version

```ts
if (artifact.artifactVersion !== "tiber_age_context_v1") {
  throw new Error("Unexpected artifact version — halt ingestion");
}
```

Halt if the version does not match. Schema and semantics may change across
versions.

### Gate 2 — Per-player policy check

For each player record, read `rankAdjustmentPolicy` first:

| `rankAdjustmentPolicy` | `scoringEligible` | `displayOnly` | What to do |
|------------------------|-------------------|---------------|------------|
| `none`                 | `false`           | `false`       | Do not use this record. It is suppressed. Log it, skip it. |
| `display_only`         | `false`           | `true`        | Show contextual label only. Do not apply to scoring, rankings, or trade logic. |
| `dynasty_only`         | `true`            | `false`       | Safe for dynasty-context scoring adjustment. Subject to modifier gates below. |

No other values are valid in v1. Treat any other value as a parse error.

### Gate 3 — Modifier provisonality

Before applying `modifierBucket` or `modifierMagnitude` to any score:

```ts
if (!player.modifierIsProvisional) {
  throw new Error("Expected modifierIsProvisional to be true");
}
// modifierMagnitude is non-calibrated. Apply only as a soft dynasty-context
// signal, not as a validated ranking delta.
```

`modifierMagnitude` has not been backtested. It should not be treated as
a reliable point-value adjustment. Use `modifierBucket` as a directional
label; treat `modifierMagnitude` as an indicative order-of-magnitude only.

---

## Field reference

Only the fields relevant to downstream consumption are listed. Fields used
internally by the research pipeline are omitted.

### Top-level artifact fields

| Field | Type | Notes |
|-------|------|-------|
| `artifactVersion` | `"tiber_age_context_v1"` | Check this first. Halt on mismatch. |
| `modelVersion` | `"age-context-v1"` | Internal model identifier. |
| `generatedAt` | ISO 8601 string | Timestamp of the research run that produced this artifact. |
| `scope.module` | `"tiber_age_context"` | Module identifier. |
| `scope.owns` | `string[]` | What this module is authoritative for. |
| `scope.doesNotOwn` | `string[]` | Explicit non-ownership list. Do not infer authority beyond `scope.owns`. |
| `provenance.runId` | `string` | Unique ID for the generating run. Match against player `provenance.runId` to verify cohesion. |
| `provenance.calibrationVersion` | `string` | Currently `"uncalibrated-rule-v1"`. When this changes, modifier semantics may change. |
| `provenance.modifierStatus` | `"provisional"` | Always `"provisional"` in v1. Downstream systems must surface this status to users. |
| `players` | `TiberAgeContextPlayer[]` | Per-player records. |

### Per-player fields

**Identity**

| Field | Type | Notes |
|-------|------|-------|
| `playerId` | `string` | Primary key for matching to your player database. |
| `playerName` | `string` | Display name. |
| `season` | `number` | Season year. |
| `position` | `"QB" \| "RB" \| "WR" \| "TE"` | Position at time of analysis. |
| `age` | `number` | Age in decimal years at the time of the season. |

**Age context (read these together — they are orthogonal)**

| Field | Type | Allowed values | Semantics |
|-------|------|----------------|-----------|
| `careerStage` | `CareerStage` | `pre_peak`, `peak_window`, `post_peak`, `decline_zone`, `unknown` | Lifecycle phase only. Where is the player in the expected career arc for their position? Independent of performance quality. |
| `ageCurveStatus` | `AgeCurveStatus` | `ahead`, `on_curve`, `behind`, `unknown` | Relative-to-expectation only. Is the player outperforming, meeting, or underperforming age expectations for their position? Independent of lifecycle phase. |
| `ageCurveDelta` | `number \| null` | — | Raw delta between player's performance and smoothed age-curve baseline. Positive = ahead. Null if insufficient data. |
| `peerPercentile` | `number \| null` | — | Percentile rank vs. same-age peers. Currently `null` in v1 pending peer-group calibration. |

**Reliability and suppression**

| Field | Type | Allowed values | Notes |
|-------|------|----------------|-------|
| `reliabilityTier` | `ReliabilityTier` | `high`, `medium`, `low`, `unknown` | Confidence in this record's signals. `unknown` means the record is hard-suppressed. |
| `warningFlags` | `string[]` | — | Codes that contributed to reliability downgrade or suppression. Surface to analysts; do not silently discard. |
| `suppressReasons` | `string[]` | — | Explicit reasons this record is suppressed or downgraded. Non-empty means the record is unreliable. |

**Downstream policy**

| Field | Type | Allowed values | Notes |
|-------|------|----------------|-------|
| `rankAdjustmentPolicy` | `RankAdjustmentPolicy` | `none`, `display_only`, `dynasty_only` | **The primary gate.** See the policy table above. |
| `scoringEligible` | `boolean` | — | `true` only when `rankAdjustmentPolicy === "dynasty_only"`. |
| `displayOnly` | `boolean` | — | `true` only when `rankAdjustmentPolicy === "display_only"`. |

**Modifier fields (provisional)**

| Field | Type | Allowed values | Notes |
|-------|------|----------------|-------|
| `modifierBucket` | `ModifierBucket` | `no_adjustment`, `small_boost`, `small_caution`, `moderate_caution`, `fade`, `unknown` | Directional label. Only meaningful when `rankAdjustmentPolicy === "dynasty_only"`. |
| `modifierMagnitude` | `number \| null` | — | Indicative magnitude. **Non-calibrated. Non-authoritative.** Null for non-dynasty_only records. |
| `modifierIsProvisional` | `true` | always `true` | Literal type guard. Assert this before applying any modifier field. |

**Explanation**

| Field | Type | Notes |
|-------|------|-------|
| `summary` | `string` | Deterministic, template-based natural language summary. Safe to surface to users. Not LLM-generated. |

**Provenance**

| Field | Type | Notes |
|-------|------|-------|
| `provenance.runId` | `string` | Must match `artifact.provenance.runId`. |
| `provenance.baselineSource` | `string \| null` | Source artifact for this player's baseline calculation. |
| `provenance.peerGroupSize` | `number \| null` | Size of the peer group used. Currently `null` in v1. |
| `provenance.sourceArtifactNames` | `string[]` | Source artifacts that contributed to this record. |

---

## Semantic definitions

These two fields are frequently confused. They are intentionally orthogonal.

### `careerStage` — lifecycle phase

Describes where the player is in the expected age arc for their position.
This is not a performance judgment.

| Value | Meaning |
|-------|---------|
| `pre_peak` | Player is before the expected peak window for their position. |
| `peak_window` | Player is within the expected peak performance age range. |
| `post_peak` | Player has passed the expected peak window but has not entered measurable decline. |
| `decline_zone` | Player is in the age range where position-specific performance typically declines. |
| `unknown` | Insufficient data to classify. |

### `ageCurveStatus` — relative to expectation

Describes how the player is performing compared to the smoothed age-position
baseline. This is not a lifecycle label.

| Value | Meaning |
|-------|---------|
| `ahead` | Player is outperforming the expected output for their age and position. |
| `on_curve` | Player is performing within expected range. |
| `behind` | Player is underperforming the expected output for their age and position. |
| `unknown` | Insufficient data to classify. |

### Why orthogonality matters

A player can be in any combination of these states:

| `careerStage` | `ageCurveStatus` | Valid? | Example |
|---------------|------------------|--------|---------|
| `peak_window` | `ahead` | Yes | Expected peak, overperforming it |
| `peak_window` | `behind` | Yes | Expected peak, underperforming it |
| `decline_zone` | `ahead` | Yes | Aging player still beating age expectations |
| `decline_zone` | `behind` | Yes | Aging player below age expectations (steepest fade signal) |

Do not conflate them. A player in `decline_zone` is not automatically
`behind`. A player in `peak_window` is not automatically `ahead`.

---

## Modifier semantics

### What the modifier bucket means

`modifierBucket` is a directional recommendation for dynasty-context scoring
adjustments. It is derived from `ageCurveStatus`, `careerStage`, and
`reliabilityTier` combined.

| Bucket | Directional signal |
|--------|-----------|
| `small_boost` | Mild positive age-context signal. Player is ahead of curve. |
| `small_caution` | Mild negative age-context signal. Player is behind curve. |
| `moderate_caution` | Stronger negative signal. |
| `fade` | Strongest negative signal. Player is in decline zone and behind curve. |
| `no_adjustment` | No actionable age-context signal. Do not apply a modifier. |
| `unknown` | Insufficient data to classify. Treat as `no_adjustment`. |

### What the modifier bucket does not mean

- **It is not a validated ranking delta.** `modifierMagnitude` is a
  provisional indicative value only. It has not been backtested against
  historical outcomes.
- **It is not calibrated.** `provenance.calibrationVersion` is
  `"uncalibrated-rule-v1"`. Calibration is a future phase.
- **It does not override your ranking model.** It should be applied as a
  soft contextual signal, not a hard adjustment.

### Safe application pattern

```ts
// Only apply modifier to dynasty_only records
if (player.rankAdjustmentPolicy !== "dynasty_only") return;
if (!player.modifierIsProvisional) throw new Error("Unexpected");

// Use bucket as a directional label — do not use modifierMagnitude as a
// precise point value in calibrated models
const direction = player.modifierBucket;
const indicativeMagnitude = player.modifierMagnitude; // treat as approximate only

// Surface provenance.modifierStatus === "provisional" to users
// who see any modifier-driven adjustment in the UI
```

---

## Anti-patterns

**Do not apply `modifierMagnitude` as a precise ranking adjustment.**
It is indicative and non-calibrated. Use it as a rough order-of-magnitude
signal only. It will be calibrated in a future phase.

**Do not infer ranking authority from this artifact.**
`tiber_age_context_v1.json` does not own rankings, projections, or
standalone player valuation. Using it to drive a ranking output directly
(rather than as a context layer) violates its scope contract.

**Do not merge `careerStage` and `ageCurveStatus` into a single composite.**
They measure different things. A merged "aging score" that conflates lifecycle
phase with relative performance will lose precision and make the signals harder
to explain.

**Do not skip the `rankAdjustmentPolicy` gate.**
A `none` record is suppressed because its signal cannot be trusted. Passing
it through as if it were valid (e.g. treating `suppressReasons` as optional
metadata) will silently corrupt downstream outputs.

**Do not surface `modifierMagnitude` to users without the provisional label.**
`provenance.modifierStatus === "provisional"` must be communicated anywhere
modifier-based adjustments are visible to end users.

**Do not cache this artifact indefinitely.**
`generatedAt` and `provenance.runId` indicate when data was produced. Stale
artifacts should be re-fetched after each new research run.

---

## Future phases

The following fields or behaviors will change in future versions. Downstream
systems should not build logic that assumes their current state is permanent.

| Field / behavior | Current state | Expected change |
|------------------|---------------|-----------------|
| `modifierMagnitude` | Non-calibrated, provisional | Will be calibrated against historical outcome data in a future phase |
| `peerPercentile` | Always `null` | Will be populated once peer-group methodology is validated |
| `provenance.calibrationVersion` | `"uncalibrated-rule-v1"` | Will increment when calibration lands; monitor for changes |
| `rankAdjustmentPolicy` allowed set | `none / display_only / dynasty_only` | `trade_context_only` and `full_context` are reserved for future phases |

Subscribe to this repo or monitor `artifactVersion` and
`provenance.calibrationVersion` to know when breaking changes land.
