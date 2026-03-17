interface PlayerListItem {
  playerId: string;
  playerName: string;
  season: number;
  position: string;
}

interface PositionRow {
  playerId: string;
  playerName: string;
  season: number;
  age: number;
  ageTrajectoryScore: number;
  ageCurveStatus: string | null;
  ageBandStage: string;
  recommendedModifierBucket: string;
  overallReasonSummary?: string;
}

const runForm = document.querySelector<HTMLFormElement>("#run-form")!;
const fileInput = document.querySelector<HTMLInputElement>("#input-file")!;
const runValidationInput = document.querySelector<HTMLInputElement>("#run-validation")!;
const runStatus = document.querySelector<HTMLElement>("#run-status")!;
const summaryEl = document.querySelector<HTMLElement>("#summary")!;
const positionSelect = document.querySelector<HTMLSelectElement>("#position-select")!;
const positionResultsEl = document.querySelector<HTMLElement>("#position-results")!;
const playerForm = document.querySelector<HTMLFormElement>("#player-form")!;
const playerNameInput = document.querySelector<HTMLInputElement>("#player-name")!;
const playerIdInput = document.querySelector<HTMLInputElement>("#player-id")!;
const playerSeasonInput = document.querySelector<HTMLInputElement>("#player-season")!;
const playerOptions = document.querySelector<HTMLDataListElement>("#player-options")!;
const playerResultsEl = document.querySelector<HTMLElement>("#player-results")!;
const artifactList = document.querySelector<HTMLUListElement>("#artifact-list")!;

let players: PlayerListItem[] = [];
let currentPositionRows: PositionRow[] = [];
let currentPositionSort: keyof PositionRow = "ageTrajectoryScore";
let currentPositionSortDir: "asc" | "desc" = "desc";

function setMessage(el: HTMLElement, message: string, level: "error" | "success" | "info" = "info") {
  el.className = level === "info" ? "status" : `status ${level}`;
  el.textContent = message;
}

function formatMetric(value: number | null | undefined, digits = 2) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "Data unavailable";
  }
  return value.toFixed(digits);
}

function formatText(value: string | null | undefined, fallback = "Data unavailable") {
  const clean = value?.trim();
  return clean ? clean : fallback;
}

function prettyLabel(value: string | null | undefined, fallback = "Data unavailable") {
  if (!value) {
    return fallback;
  }
  return value
    .split("-")
    .map((part) => (part ? `${part[0].toUpperCase()}${part.slice(1)}` : part))
    .join(" ");
}

function card(label: string, value: string | number) {
  return `<div class="card"><div class="label">${label}</div><div>${value}</div></div>`;
}

function badge(value: string | null | undefined, type: "status" | "stage" | "bucket") {
  if (!value) {
    return `<span class="chip chip-muted">Data unavailable</span>`;
  }
  return `<span class="chip chip-${type} chip-${value}">${prettyLabel(value)}</span>`;
}

function playerSummaryLine(row: PositionRow) {
  const status = row.ageCurveStatus ?? "on";
  const stage = row.ageBandStage;
  const bucket = row.recommendedModifierBucket;

  const statusText = status === "ahead" ? "Ahead of age curve" : status === "behind" ? "Behind historical age peers" : "On age curve";
  const stageText =
    stage === "pre-peak"
      ? "pre-peak profile"
      : stage === "peak-window"
        ? "in peak window"
        : stage === "decline-zone"
          ? "already in decline zone"
          : "post-peak profile";
  const bucketText =
    bucket === "boost"
      ? "with strong signals"
      : bucket === "fade"
        ? "with cautionary signals"
        : bucket === "caution"
          ? "with mixed evidence"
          : "with balanced signals";

  return `${statusText}, ${stageText}, ${bucketText}.`;
}

function renderSummary(payload: any) {
  if (payload?.error) {
    summaryEl.innerHTML = `<div class="error">${payload.error}</div>`;
    return;
  }

  const meta = payload.latestRunMetadata;
  const validation = payload.validation;
  const overallStatus = !validation
    ? "Validation has not run yet"
    : validation.failedCases === 0
      ? "Validation passed"
      : "Validation needs review";

  const failures = (validation?.failures ?? []) as Array<{ caseName: string; mismatchExplanations?: string[] }>;

  summaryEl.innerHTML = `
    <div class="grid summary-grid">
      ${card("Latest upload", formatText(meta?.lastUploadedFileName, "Data unavailable"))}
      ${card("Last run", formatText(meta?.lastRunTimestamp, "Data unavailable"))}
      ${card("Rows included", meta?.includedRowCount ?? payload.includedRowCount ?? 0)}
      ${card("Rows in input", meta?.inputRowCount ?? "Data unavailable")}
      ${card("Positions covered", (payload.positionsCovered ?? []).join(", ") || "Data unavailable")}
    </div>
    <div class="validation-panel ${validation?.failedCases === 0 ? "ok" : "warn"}">
      <h3>Validation summary</h3>
      <div class="validation-status">${overallStatus}</div>
      <div class="validation-stats">
        <span>Total cases: <strong>${validation?.totalCases ?? 0}</strong></span>
        <span>Passed: <strong>${validation?.passedCases ?? 0}</strong></span>
        <span>Failed: <strong>${validation?.failedCases ?? 0}</strong></span>
      </div>
      ${failures.length > 0 ? `<ul>${failures.map((failure) => `<li><strong>${failure.caseName}:</strong> ${(failure.mismatchExplanations ?? ["Mismatch found."]).join(" ")}</li>`).join("")}</ul>` : "<p>No validation mismatches.</p>"}
      <details><summary>Show raw data</summary><pre>${JSON.stringify(payload, null, 2)}</pre></details>
    </div>
  `;
}

function applyPositionTable() {
  const statusFilter = (document.querySelector<HTMLSelectElement>("#filter-status")?.value ?? "all").toLowerCase();
  const stageFilter = (document.querySelector<HTMLSelectElement>("#filter-stage")?.value ?? "all").toLowerCase();
  const bucketFilter = (document.querySelector<HTMLSelectElement>("#filter-bucket")?.value ?? "all").toLowerCase();

  const filtered = currentPositionRows.filter((row) => {
    if (statusFilter !== "all" && (row.ageCurveStatus ?? "").toLowerCase() !== statusFilter) {
      return false;
    }
    if (stageFilter !== "all" && row.ageBandStage.toLowerCase() !== stageFilter) {
      return false;
    }
    if (bucketFilter !== "all" && row.recommendedModifierBucket.toLowerCase() !== bucketFilter) {
      return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const dir = currentPositionSortDir === "asc" ? 1 : -1;
    const av = a[currentPositionSort];
    const bv = b[currentPositionSort];
    if (typeof av === "number" && typeof bv === "number") {
      return (av - bv) * dir;
    }
    return String(av).localeCompare(String(bv)) * dir;
  });

  const tbody = sorted
    .map(
      (row) => `<tr data-player-id="${row.playerId}" data-season="${row.season}">
      <td><strong>${row.playerName}</strong></td>
      <td>${row.season}</td>
      <td>${row.age}</td>
      <td>${formatMetric(row.ageTrajectoryScore)}</td>
      <td>${badge(row.ageCurveStatus, "status")}</td>
      <td>${badge(row.ageBandStage, "stage")}</td>
      <td>${badge(row.recommendedModifierBucket, "bucket")}</td>
      <td>${playerSummaryLine(row)}</td>
    </tr>`
    )
    .join("");

  const tableBody = document.querySelector<HTMLElement>("#position-player-table-body");
  const countEl = document.querySelector<HTMLElement>("#position-counts");
  if (countEl) {
    countEl.innerHTML = `Rows loaded: <strong>${currentPositionRows.length}</strong> · After filters: <strong>${sorted.length}</strong>`;
  }

  if (tableBody) {
    tableBody.innerHTML = tbody || `<tr><td colspan="8">No players match current filters</td></tr>`;
  }

  document.querySelectorAll("#position-player-table-body tr[data-player-id]").forEach((row) => {
    row.addEventListener("click", async () => {
      const playerId = (row as HTMLElement).dataset.playerId ?? "";
      const season = (row as HTMLElement).dataset.season ?? "";
      playerIdInput.value = playerId;
      playerSeasonInput.value = season;
      const match = players.find((p) => p.playerId === playerId);
      if (match) {
        playerNameInput.value = match.playerName;
      }
      await fetchAndRenderPlayer(playerId, season);
    });
  });
}

function renderPosition(payload: any) {
  if (payload?.error) {
    positionResultsEl.innerHTML = `<div class="error">${payload.error}</div>`;
    return;
  }

  currentPositionRows = payload.playerRows ?? [];

  positionResultsEl.innerHTML = `
    <div class="row filters-row">
      <label>Status <select id="filter-status"><option value="all">All</option><option value="ahead">Ahead of curve</option><option value="on">On curve</option><option value="behind">Behind curve</option></select></label>
      <label>Stage <select id="filter-stage"><option value="all">All</option><option value="pre-peak">Pre-peak</option><option value="peak-window">Peak window</option><option value="post-peak">Post-peak</option><option value="decline-zone">Decline zone</option></select></label>
      <label>Bucket <select id="filter-bucket"><option value="all">All</option><option value="boost">Boost</option><option value="neutral">Neutral</option><option value="caution">Caution</option><option value="fade">Fade</option></select></label>
      <button id="clear-filters" type="button">Clear filters</button>
    </div>
    <div id="position-counts" class="subtle"></div>
    <table class="table table-clickable">
      <thead><tr>
        <th data-sort="playerName">Player</th>
        <th data-sort="season">Season</th>
        <th data-sort="age">Age</th>
        <th data-sort="ageTrajectoryScore">Trajectory</th>
        <th>Status</th><th>Stage</th><th>Bucket</th><th>Summary</th>
      </tr></thead>
      <tbody id="position-player-table-body"></tbody>
    </table>
    <details><summary>Show raw data</summary><pre>${JSON.stringify(payload, null, 2)}</pre></details>
  `;

  ["#filter-status", "#filter-stage", "#filter-bucket"].forEach((selector) => {
    document.querySelector(selector)?.addEventListener("change", applyPositionTable);
  });

  document.querySelector<HTMLButtonElement>("#clear-filters")?.addEventListener("click", () => {
    (document.querySelector("#filter-status") as HTMLSelectElement).value = "all";
    (document.querySelector("#filter-stage") as HTMLSelectElement).value = "all";
    (document.querySelector("#filter-bucket") as HTMLSelectElement).value = "all";
    applyPositionTable();
  });

  document.querySelectorAll("th[data-sort]").forEach((th) => {
    th.addEventListener("click", () => {
      const key = (th as HTMLElement).dataset.sort as keyof PositionRow;
      if (currentPositionSort === key) {
        currentPositionSortDir = currentPositionSortDir === "asc" ? "desc" : "asc";
      } else {
        currentPositionSort = key;
        currentPositionSortDir = key === "playerName" ? "asc" : "desc";
      }
      applyPositionTable();
    });
  });

  applyPositionTable();
}

function renderPlayer(payload: any) {
  if (payload?.error) {
    playerResultsEl.innerHTML = `<div class="error">${payload.error}</div>`;
    return;
  }

  const flags = (payload.flags ?? []) as Array<{ label: string; severity: "info" | "warning" }>;
  const flagMarkup =
    flags.length > 0
      ? flags.map((flag) => `<li><span class="badge">${flag.label}</span>${flag.severity === "warning" ? " <span class=\"muted\">Limited evidence</span>" : ""}</li>`).join("")
      : "<li>Data unavailable</li>";

  playerResultsEl.innerHTML = `
    <div class="player-header">
      <h3>${formatText(payload.playerName, "Unknown player")}</h3>
      <div class="subtle">${formatText(payload.position, "Data unavailable")} · Age ${payload.age ?? "Data unavailable"} · Season ${payload.season ?? "Data unavailable"}</div>
      <div class="row">
        ${badge(payload.ageCurveStatus, "status")}
        ${badge(payload.ageBandStage, "stage")}
        ${badge(payload.recommendedModifierBucket, "bucket")}
      </div>
    </div>

    <h4>Core metrics</h4>
    <div class="grid">
      ${card("Age trajectory score", formatMetric(payload.ageTrajectoryScore))}
      ${card("Age curve delta", formatMetric(payload.ageCurveDelta))}
      ${card("Modifier magnitude", formatMetric(payload.modifierMagnitude, 3))}
    </div>

    <h4>Research interpretation</h4>
    <div class="card"><strong>Overall</strong><div>${formatText(payload.overallReasonSummary, "Not enough sample yet")}</div></div>
    <div class="card"><strong>Production</strong><div>${formatText(payload.productionReason, "Not enough sample yet")}</div></div>
    <div class="card"><strong>Role</strong><div>${formatText(payload.roleReason, "Not enough sample yet")}</div></div>
    <div class="card"><strong>Efficiency</strong><div>${formatText(payload.efficiencyReason, "Not enough sample yet")}</div></div>

    <h4>Flags</h4>
    <ul>${flagMarkup}</ul>

    <details>
      <summary>Show raw data</summary>
      <div class="subtle">Player ID: ${formatText(payload.playerId)}</div>
      <pre>${JSON.stringify(payload, null, 2)}</pre>
    </details>
  `;
}

async function loadSummary() {
  const response = await fetch("/api/results/summary");
  const payload = await response.json();
  renderSummary(payload);
}

function artifactLabel(name: string) {
  if (name.includes("summary")) return "summary";
  if (name.includes("curve")) return "curves";
  if (name.includes("score")) return "scores";
  if (name.includes("modifier")) return "modifiers";
  if (name.includes("validation")) return "validation";
  if (name.includes("latest_run_metadata")) return "latest run metadata";
  return "artifact";
}

async function loadArtifacts() {
  const response = await fetch("/api/artifacts");
  const payload = await response.json();
  artifactList.innerHTML = "";

  const artifacts: string[] = payload.artifacts ?? [];
  if (artifacts.length === 0) {
    artifactList.innerHTML = "<li>No artifacts available.</li>";
    return;
  }

  for (const artifact of artifacts) {
    const li = document.createElement("li");
    li.innerHTML = `<span class="artifact-tag">${artifactLabel(artifact)}</span> <a href="/api/artifacts/${artifact}">${artifact}</a>`;
    artifactList.appendChild(li);
  }
}

async function loadPlayers() {
  const response = await fetch("/api/results/players");
  const payload = await response.json();
  playerOptions.innerHTML = "";

  if (!response.ok) {
    players = [];
    playerNameInput.placeholder = "Run research to load players";
    return;
  }

  players = payload.players ?? [];
  for (const player of players) {
    const option = document.createElement("option");
    option.value = player.playerName;
    option.label = `${player.playerName} (${player.position}, ${player.season})`;
    playerOptions.appendChild(option);
  }
}

async function fetchAndRenderPlayer(playerId: string, season?: string) {
  const params = new URLSearchParams({ playerId });
  if (season) {
    params.set("season", season);
  }
  const response = await fetch(`/api/results/player?${params.toString()}`);
  const payload = await response.json();
  renderPlayer(payload);
}

playerNameInput.addEventListener("input", () => {
  const match = players.find((player) => player.playerName.toLowerCase() === playerNameInput.value.toLowerCase().trim());
  playerIdInput.value = match?.playerId ?? "";
  if (match) {
    playerSeasonInput.value = String(match.season);
  }
});

runForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const file = fileInput.files?.[0];
  if (!file) {
    setMessage(runStatus, "Select a file before running research.", "error");
    return;
  }

  setMessage(runStatus, `Running pipeline for ${file.name}...`);
  try {
    const runResponse = await fetch("/api/run/research", {
      method: "POST",
      headers: { "x-upload-filename": file.name },
      body: file
    });
    const runPayload = await runResponse.json();

    if (!runResponse.ok) {
      setMessage(runStatus, `Research failure: ${runPayload.error ?? "Unknown error"}`, "error");
      return;
    }

    if (runValidationInput.checked) {
      setMessage(runStatus, "Research complete. Running validation...");
      const validationResponse = await fetch("/api/run/validation", { method: "POST" });
      const validationPayload = await validationResponse.json();
      if (!validationResponse.ok) {
        setMessage(runStatus, `Validation failed to run: ${validationPayload.error ?? "Unknown error"}`, "error");
      } else {
        setMessage(runStatus, `Run succeeded for ${file.name}. Included ${runPayload.result?.includedRows ?? 0}/${runPayload.result?.inputRows ?? 0} rows.`, "success");
      }
    } else {
      setMessage(runStatus, `Run succeeded for ${file.name}. Included ${runPayload.result?.includedRows ?? 0}/${runPayload.result?.inputRows ?? 0} rows.`, "success");
    }

    await loadSummary();
    await loadArtifacts();
    await loadPlayers();
  } catch (error) {
    setMessage(runStatus, `Pipeline failed: ${error instanceof Error ? error.message : String(error)}`, "error");
  }
});

document.querySelector<HTMLButtonElement>("#refresh-summary")!.addEventListener("click", async () => {
  await loadSummary();
});

document.querySelector<HTMLButtonElement>("#load-position")!.addEventListener("click", async () => {
  const position = positionSelect.value;
  const response = await fetch(`/api/results/position/${position}`);
  const payload = await response.json();
  renderPosition(payload);
});

playerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const playerId = playerIdInput.value.trim();
  const season = playerSeasonInput.value.trim();

  if (!playerId) {
    playerResultsEl.innerHTML = '<div class="status">Select a player to inspect the model output.</div>';
    return;
  }

  await fetchAndRenderPlayer(playerId, season);
});

document.querySelector<HTMLButtonElement>("#refresh-artifacts")!.addEventListener("click", async () => {
  await loadArtifacts();
});

playerResultsEl.innerHTML = '<div class="status">Select a player to inspect the model output.</div>';

void loadSummary();
void loadArtifacts();
void loadPlayers();
