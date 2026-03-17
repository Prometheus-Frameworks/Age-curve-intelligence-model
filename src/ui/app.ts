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

function card(label: string, value: string | number) {
  return `<div class="card"><strong>${label}</strong><div>${value}</div></div>`;
}

function badge(value: string | null | undefined, type: "status" | "stage" | "bucket") {
  if (!value) {
    return "-";
  }
  return `<span class="chip chip-${type} chip-${value}">${value}</span>`;
}

function renderSummary(payload: any) {
  if (payload?.error) {
    summaryEl.innerHTML = `<div class="error">${payload.error}</div>`;
    return;
  }

  const meta = payload.latestRunMetadata;
  const validation = payload.validation;
  const validationPanel = validation
    ? `<div class="validation-panel ${validation.failedCases === 0 ? "ok" : "warn"}">
      <div><strong>Total cases:</strong> ${validation.totalCases}</div>
      <div><strong>Passed:</strong> ${validation.passedCases}</div>
      <div><strong>Failed:</strong> ${validation.failedCases}</div>
      ${validation.failedCases > 0 ? `<ul>${validation.failures.map((failure: any) => `<li><strong>${failure.caseName}</strong>: ${(failure.mismatchExplanations ?? []).join("; ")}</li>`).join("")}</ul>` : "<div>All validation checks passed.</div>"}
    </div>`
    : "<div class='validation-panel'>Validation has not run yet.</div>";

  summaryEl.innerHTML = `
    <div class="grid">
      ${card("Latest file", meta?.lastUploadedFileName ?? "-")}
      ${card("Last run timestamp", meta?.lastRunTimestamp ?? "-")}
      ${card("Included rows", meta?.includedRowCount ?? payload.includedRowCount ?? 0)}
      ${card("Input rows", meta?.inputRowCount ?? "-")}
      ${card("Positions covered", (payload.positionsCovered ?? []).join(", ") || "None")}
    </div>
    <h3>Validation summary</h3>
    ${validationPanel}
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
      <td>${row.playerName}</td><td>${row.season}</td><td>${row.age}</td><td>${row.ageTrajectoryScore.toFixed(2)}</td>
      <td>${badge(row.ageCurveStatus, "status")}</td><td>${badge(row.ageBandStage, "stage")}</td><td>${badge(row.recommendedModifierBucket, "bucket")}</td>
    </tr>`
    )
    .join("");

  const tableBody = document.querySelector<HTMLElement>("#position-player-table-body");
  if (tableBody) {
    tableBody.innerHTML = tbody || `<tr><td colspan="7">No matching players.</td></tr>`;
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
    <div class="row">
      <label>Status <select id="filter-status"><option value="all">all</option><option value="ahead">ahead</option><option value="on">on</option><option value="behind">behind</option></select></label>
      <label>Stage <select id="filter-stage"><option value="all">all</option><option value="pre-peak">pre-peak</option><option value="peak-window">peak-window</option><option value="post-peak">post-peak</option><option value="decline-zone">decline-zone</option></select></label>
      <label>Bucket <select id="filter-bucket"><option value="all">all</option><option value="boost">boost</option><option value="neutral">neutral</option><option value="caution">caution</option><option value="fade">fade</option></select></label>
    </div>
    <table class="table table-clickable">
      <thead><tr>
        <th data-sort="playerName">Player</th>
        <th data-sort="season">Season</th>
        <th data-sort="age">Age</th>
        <th data-sort="ageTrajectoryScore">Trajectory</th>
        <th>Status</th><th>Stage</th><th>Bucket</th>
      </tr></thead>
      <tbody id="position-player-table-body"></tbody>
    </table>
  `;

  ["#filter-status", "#filter-stage", "#filter-bucket"].forEach((selector) => {
    document.querySelector(selector)?.addEventListener("change", applyPositionTable);
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

  const flags = (payload.flags ?? []).map((flag: any) => `<span class="badge">${flag.label}${flag.severity === "warning" ? " ⚠️" : ""}</span>`).join("") || "None";

  playerResultsEl.innerHTML = `
    <div class="grid">
      ${card("Player name", payload.playerName)}
      ${card("Player ID", payload.playerId)}
      ${card("Season", payload.season)}
      ${card("Age", payload.age)}
      ${card("Position", payload.position)}
      ${card("Age trajectory score", payload.ageTrajectoryScore ?? "-")}
      ${card("Age curve status", payload.ageCurveStatus ?? "-")}
      ${card("Age curve delta", payload.ageCurveDelta ?? "-")}
      ${card("Age band stage", payload.ageBandStage ?? "-")}
      ${card("Modifier bucket", payload.recommendedModifierBucket ?? "-")}
      ${card("Modifier magnitude", payload.modifierMagnitude ?? "-")}
    </div>
    <h3>Flags</h3><div>${flags}</div>
    <h3>Reason summaries</h3>
    <div class="card"><strong>Production</strong><div>${payload.productionReason ?? "-"}</div></div>
    <div class="card"><strong>Role</strong><div>${payload.roleReason ?? "-"}</div></div>
    <div class="card"><strong>Efficiency</strong><div>${payload.efficiencyReason ?? "-"}</div></div>
    <div class="card"><strong>Overall</strong><div>${payload.overallReasonSummary ?? "-"}</div></div>
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
    playerResultsEl.innerHTML = `<div class="error">No player found for the provided name.</div>`;
    return;
  }

  await fetchAndRenderPlayer(playerId, season);
});

document.querySelector<HTMLButtonElement>("#refresh-artifacts")!.addEventListener("click", async () => {
  await loadArtifacts();
});

void loadSummary();
void loadArtifacts();
void loadPlayers();
