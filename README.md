# Age-curve-intelligence-model

This repo is a standalone model lab for age-based fantasy football research.

## Current scope (PR-2)

PR-2 expands the script-driven research outputs to include:
- ingestion of exported data files
- normalization into a canonical player-season shape
- descriptive age summaries by position
- position-specific age/metric correlations
- position-specific peak-age and 2-year peak windows
- player-vs-same-age peer percentile profiles (within position)
- explainable first-pass AgeTrajectoryScore built from weighted percentile components
- machine-readable artifact export

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

## Inclusion logic

Rows are included when:
- `age` exists
- `position` is one of `QB`, `RB`, `WR`, `TE`
- `games >= 4`
- either `fantasyPointsPerGame` or `fantasyPointsTotal` exists

## Guardrails baked into PR-2

- All analytics are computed within each position only.
- Peer percentiles only use same-position, same-age peers.
- Minimum sample checks are enforced for correlations, peer percentiles, and peak window detection.
- AgeTrajectoryScore is modular and traceable: each score includes component metrics, weights, and weighted contributions.
