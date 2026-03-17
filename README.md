# Age-curve-intelligence-model

This repo is a standalone model lab for age-based fantasy football research.

## Current scope (PR-1)

PR-1 only handles:
- ingestion of exported data files
- normalization into a canonical player-season shape
- descriptive age summaries by position
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

## Inclusion logic

Rows are included when:
- `age` exists
- `position` is one of `QB`, `RB`, `WR`, `TE`
- `games >= 4`
- either `fantasyPointsPerGame` or `fantasyPointsTotal` exists
