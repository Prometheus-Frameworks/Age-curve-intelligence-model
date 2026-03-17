# Age-curve-intelligence-model

This repo is a standalone model lab for age-based fantasy football research, with a thin hostable app layer for upload/run/validation/result browsing.

## PR-7 scope

PR-7 keeps model logic stable while improving durability + interaction quality:
- explicit persistent storage behavior for Railway deploys
- `latest_run_metadata.json` persisted with each run
- position browsing upgraded to sortable/filterable player tables
- click-through player detail from position results
- clearer run/validation/artifact UX for hosted use

No auth, database, background jobs, framework migration, or new analytics/model scope are introduced.

## Data source

Upstream data comes from Tiber Data Lab exports.

Supported input formats:
- `.csv`
- `.json`

## Run the app

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start in local dev watch mode:
   ```bash
   npm run dev
   ```

Or run production-style:
```bash
npm run build
npm run start
```

Then open `http://localhost:3000`.

## Railway persistence (explicit)

The server always uses these environment variables for file storage:
- `ARTIFACT_DIR`
- `UPLOAD_DIR`

If not set (local dev defaults):
- `ARTIFACT_DIR=./artifacts`
- `UPLOAD_DIR=./tmp/uploads`

On startup, missing directories are created automatically.

### Why mounted storage matters

Railway ephemeral container filesystem does not reliably preserve uploaded files and generated artifacts across redeploys/restarts.

If uploads/artifacts matter after redeploy, mount a persistent volume and point both directories to that mount.

### Railway mounted volume example

Mount volume at `/data` and set:
- `ARTIFACT_DIR=/data/artifacts`
- `UPLOAD_DIR=/data/uploads`

This keeps uploads and artifacts durable across restart/redeploy cycles.

## Latest run metadata artifact

Each research run writes:
- `latest_run_metadata.json`

It tracks:
- last uploaded file name
- last run timestamp
- input row count
- included row count
- whether validation ran
- validation pass/fail/total counts (when available)

The summary endpoint/UI uses this metadata so the homepage reflects the latest run state after deployment restarts.

## Using the app

1. Upload a `.csv` or `.json` export in **Run research**.
2. Click **Run pipeline** (optionally run validation).
3. Review:
   - **Results overview**: latest file, last run timestamp, included/input rows, validation summary
   - **Position browser**: sortable/filterable player research table with status/stage/modifier badges
   - **Player search**: manual lookup still supported, and row click-through auto-loads details
4. Download artifacts from the **Artifacts** section (labeled for quick scanning).

## API routes

- `POST /api/run/research`
  - body: raw file bytes
  - header: `x-upload-filename: your-file.csv|json`
- `POST /api/run/validation`
- `GET /api/artifacts`
- `GET /api/artifacts/:name`
- `GET /api/results/summary`
- `GET /api/results/position/:position`
- `GET /api/results/players`
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

Research writes these files into `ARTIFACT_DIR`:
- `age_curves_by_position.json`
- `age_metric_averages_by_position.json`
- `age_summary_report.json`
- `age_correlations_by_position.json`
- `age_peak_windows_by_position.json`
- `player_age_peer_profiles_by_position.json`
- `age_trajectory_scores_by_position.json`
- `tiber_reintegration_player_scores.json`
- `tiber_age_modifiers.json`
- `latest_run_metadata.json`

Validation writes:
- `validation_report.json`

## Guardrails

- No auth, DB, or background workers.
- App reads generated artifacts for browsing and downloads.
- Existing model and research logic remain source-of-truth.
