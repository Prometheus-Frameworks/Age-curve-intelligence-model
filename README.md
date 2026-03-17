# Age-curve-intelligence-model

This repo is a standalone model lab for age-based fantasy football research.

## Current scope (PR-4)

PR-4 improves calibration, trust, and downstream usability with:
- position-specific age-curve status/anomaly thresholds for QB/RB/WR/TE
- position-aware age-band stage classification using peak-window evidence with per-position fallback ages
- deterministic reason summaries (`productionReason`, `roleReason`, `efficiencyReason`, `overallReasonSummary`)
- a curated validation pack with archetype expectations and mismatch diagnostics
- a slim Tiber modifier artifact for conservative downstream scoring adjustments
- all outputs remain explicit, interpretable, and script-driven (no black-box prediction)

There is no API or frontend.

## Data source

Upstream data comes from Tiber Data Lab exports.

Supported input formats:
- `.csv`
- `.json`

## Run research

1. Install dependencies:
   ```bash
   npm install
   ```
2. Run the research script with an input file path:
   ```bash
   npm run research:run -- --input ./sample-data/tiber-export.json
   ```
   Optional flags:
   - `--outDir ./artifacts` (default `./artifacts`)

## Run validation pack

```bash
npm run validation:run
```

Writes:
- `validation_report.json`

## Artifacts

The research script writes these files into `/artifacts`:
- `age_curves_by_position.json`
- `age_metric_averages_by_position.json`
- `age_summary_report.json`
- `age_correlations_by_position.json`
- `age_peak_windows_by_position.json`
- `player_age_peer_profiles_by_position.json`
- `age_trajectory_scores_by_position.json`
- `tiber_reintegration_player_scores.json`
- `tiber_age_modifiers.json`

## Inclusion logic

Rows are included when:
- `age` exists
- `position` is one of `QB`, `RB`, `WR`, `TE`
- `games >= 4`
- either `fantasyPointsPerGame` or `fantasyPointsTotal` exists

## Guardrails

- All analytics are computed within each position only.
- Peer percentiles only use same-position, same-age peers.
- Minimum sample checks are enforced and low-sample conditions are surfaced as warnings (not hidden).
- Rules are deterministic and modular; no model training or hidden weighting.
- Modifier export is bounded and conservative (`boost`, `neutral`, `caution`, `fade`) for downstream adjustments.
