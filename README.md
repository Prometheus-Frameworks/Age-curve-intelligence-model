# Age-curve-intelligence-model

This repo is a standalone model lab for age-based fantasy football research.

## Current scope (PR-3)

PR-3 expands the script-driven research outputs to include:
- age-curve smoothing over neighboring ages to reduce noisy single-age spikes
- peer sample confidence metadata attached to every age-peer metric comparison
- plain-English age-curve status (`ahead`, `on`, `behind`) for each player season
- age-band stage classification (`pre-peak`, `peak-window`, `post-peak`, `decline-zone`)
- rule-based anomaly and context flags tied to smoothed baselines and sample reliability
- clean reintegration artifact export for Tiber with player-level scores and flags
- all outputs remain position-specific and fully interpretable (no black-box predictions)

There is no API or frontend yet.

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

## Artifacts

The script writes these files into `/artifacts`:
- `age_curves_by_position.json`
- `age_metric_averages_by_position.json`
- `age_summary_report.json`
- `age_correlations_by_position.json`
- `age_peak_windows_by_position.json`
- `player_age_peer_profiles_by_position.json`
- `age_trajectory_scores_by_position.json`
- `tiber_reintegration_player_scores.json`

## Inclusion logic

Rows are included when:
- `age` exists
- `position` is one of `QB`, `RB`, `WR`, `TE`
- `games >= 4`
- either `fantasyPointsPerGame` or `fantasyPointsTotal` exists

## Guardrails baked into PR-3

- All analytics are computed within each position only.
- Peer percentiles only use same-position, same-age peers.
- Minimum sample checks are enforced and low-sample conditions are surfaced as warnings (not hidden).
- Smoothed age baselines use local neighboring ages to avoid overfitting single-age spikes.
- All flags are deterministic and rule-based (interpretable by design).
- AgeTrajectoryScore remains modular and traceable: each score includes component metrics, weights, weighted contributions, and peer confidence metadata.
