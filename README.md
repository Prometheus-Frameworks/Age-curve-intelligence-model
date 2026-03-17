# Age-curve-intelligence-model

This repo is a standalone model lab for age-based fantasy football research, now with a thin hostable MVP app layer.

## PR-5 MVP scope

PR-5 adds the first interaction layer around the existing pipeline (no auth, no DB, no jobs):
- upload CSV/JSON exports
- run research pipeline
- optionally run validation
- browse summary, position, and player outputs
- download generated artifacts

All existing model logic remains script-driven and reusable.

## Data source

Upstream data comes from Tiber Data Lab exports.

Supported input formats:
- `.csv`
- `.json`

## Run the hostable MVP app

1. Install dependencies:
   ```bash
   npm install
   ```
2. Build TypeScript:
   ```bash
   npm run build
   ```
3. Start server:
   ```bash
   npm run start
   ```

For local development without a build step:
```bash
npm run dev
```

Then open `http://localhost:3000`.

### Using the app

1. Upload a `.csv` or `.json` export on the Run section.
2. Click **Run pipeline** (optionally enable validation checkbox).
3. Review:
   - Results overview (included rows, positions covered, validation status)
   - Position browser (curves, peak windows, top/bottom trajectory scores, modifier buckets)
   - Player search (player detail + reasons + modifier info)
4. Download artifacts from the Artifacts section.

## API routes

- `POST /api/run/research`
  - body: raw file bytes
  - header: `x-upload-filename: your-file.csv|json`
- `POST /api/run/validation`
- `GET /api/artifacts`
- `GET /api/artifacts/:name`
- `GET /api/results/summary`
- `GET /api/results/position/:position`
- `GET /api/results/player?playerId=...&season=...`

## Keep existing CLI scripts

Research:
```bash
npm run research:run -- --input ./sample-data/tiber-export.json
```

Validation:
```bash
npm run validation:run
```

## Artifacts

Research writes these files into `/artifacts`:
- `age_curves_by_position.json`
- `age_metric_averages_by_position.json`
- `age_summary_report.json`
- `age_correlations_by_position.json`
- `age_peak_windows_by_position.json`
- `player_age_peer_profiles_by_position.json`
- `age_trajectory_scores_by_position.json`
- `tiber_reintegration_player_scores.json`
- `tiber_age_modifiers.json`

Validation writes:
- `validation_report.json`

## Guardrails

- No auth, DB, or background workers in this MVP.
- App reads generated artifacts for browsing and downloads.
- Existing model and research logic remain explicit and source-of-truth.
