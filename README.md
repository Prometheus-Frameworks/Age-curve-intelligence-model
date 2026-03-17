# Age-curve-intelligence-model

This repo is a standalone model lab for age-based fantasy football research, now with a thin hostable MVP app layer.

## PR-6 MVP scope

PR-6 keeps model logic stable and improves hosted usability + deployment reliability:
- cleaner UI cards/tables instead of raw JSON dumps
- searchable player discovery by name
- better loading/success/error/empty states
- configurable storage paths for artifacts/uploads (Railway-safe)

No auth, DB, jobs, Tiber integration, or model scope expansion were added.

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

## Storage configuration (local + Railway)

The server uses configurable storage directories:
- `ARTIFACT_DIR`: where generated artifacts are written/read
- `UPLOAD_DIR`: where uploaded files are staged

Defaults (when env vars are not set):
- `ARTIFACT_DIR=./artifacts`
- `UPLOAD_DIR=./tmp/uploads`

Directories are created automatically on startup.

### Railway persistent volume guidance

Railway container local filesystem is **not sufficient for persistent artifacts across restarts/redeploys**. Use a mounted volume path and point both storage env vars there.

Example pattern:
- Mount a Railway volume at `/data`
- Set:
  - `ARTIFACT_DIR=/data/artifacts`
  - `UPLOAD_DIR=/data/uploads`

This follows Railway’s common persistence guidance: volumes are the reliable place for files that must survive restart/redeploy cycles.

## Using the app

1. Upload a `.csv` or `.json` export in **Run research**.
2. Click **Run pipeline** (optional: run validation).
3. Review:
   - **Results overview**: included row count, positions covered, validation counts
   - **Position browser**: age-curve table, peak windows, top/bottom players, modifier bucket counts
   - **Player search**: find by name (datalist), then inspect player details, flags, reasons, and modifier
4. Download artifacts from the **Artifacts** section.

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

Validation writes:
- `validation_report.json`

## Guardrails

- No auth, DB, or background workers in this MVP.
- App reads generated artifacts for browsing and downloads.
- Existing model and research logic remain explicit and source-of-truth.
