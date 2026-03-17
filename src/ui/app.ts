interface PlayerListItem {
  playerId: string;
  playerName: string;
  season: number;
  position: string;
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

function setMessage(el: HTMLElement, message: string, level: "error" | "success" | "info" = "info") {
  el.className = level === "info" ? "status" : `status ${level}`;
  el.textContent = message;
}

function card(label: string, value: string | number) {
  return `<div class="card"><strong>${label}</strong><div>${value}</div></div>`;
}

function renderSummary(payload: any) {
  if (payload?.error) {
    summaryEl.innerHTML = `<div class="error">${payload.error}</div>`;
    return;
  }
  const validation = payload.validation;
  const validationHtml = validation
    ? `${card("Validation passed", validation.passedCases)}${card("Validation failed", validation.failedCases)}${card("Validation total", validation.totalCases)}`
    : `<div>No validation report yet.</div>`;

  const validationFailures = validation?.failures?.length
    ? `<ul>${validation.failures
        .map((failure: any) => `<li><strong>${failure.caseName}</strong>: ${(failure.mismatchExplanations ?? []).join("; ")}</li>`)
        .join("")}</ul>`
    : "<div>No validation mismatches.</div>";

  const artifacts = (payload.artifacts ?? []).length
    ? `<ul>${payload.artifacts.map((artifact: string) => `<li>${artifact}</li>`).join("")}</ul>`
    : "<div>No artifacts generated yet.</div>";


  summaryEl.innerHTML = `
    <div class="grid">
      ${card("Included row count", payload.includedRowCount ?? 0)}
      ${card("Positions covered", (payload.positionsCovered ?? []).join(", ") || "None")}
      ${card("Generated at", payload.generatedAt ?? "-")}
    </div>
    <h3>Validation summary</h3>
    <div class="grid">${validationHtml}</div>
    <h3>Validation failures</h3>
    ${validationFailures}
    <h3>Generated artifacts</h3>
    ${artifacts}
  `;
}

function renderPosition(payload: any) {
  if (payload?.error) {
    positionResultsEl.innerHTML = `<div class="error">${payload.error}</div>`;
    return;
  }

  const curveRows = (payload.ageCurves ?? [])
    .map(
      (row: any) =>
        `<tr><td>${row.age}</td><td>${row.seasonCount}</td><td>${row.avgFantasyPointsPerGame ?? "-"}</td><td>${row.smoothedAvgFantasyPointsPerGame ?? "-"}</td><td>${row.lowSampleWarning ? "yes" : "no"}</td></tr>`
    )
    .join("");

  const topRows = (payload.topPlayers ?? [])
    .map((row: any) => `<li>${row.playerName} (${row.playerId}) - ${row.ageTrajectoryScore}</li>`)
    .join("");
  const bottomRows = (payload.bottomPlayers ?? [])
    .map((row: any) => `<li>${row.playerName} (${row.playerId}) - ${row.ageTrajectoryScore}</li>`)
    .join("");

  const modifierBuckets = Object.entries(payload.modifierBucketCounts ?? {})
    .map(([bucket, count]) => `<li>${bucket}: ${count}</li>`)
    .join("");

  const peakSummary = (payload.peakWindows ?? [])
    .map((w: any) => `${w.metric}: ages ${w.peakWindowStartAge ?? "-"}-${w.peakWindowEndAge ?? "-"} (peak ${w.peakAge ?? "-"})`)
    .join("; ");

  positionResultsEl.innerHTML = `
    <h3>${payload.position} peak window summary</h3>
    <div>${peakSummary || "No position data."}</div>

    <h3>Age curves</h3>
    ${curveRows ? `<table class="table"><thead><tr><th>Age</th><th>Samples</th><th>Avg PPG</th><th>Smoothed Avg PPG</th><th>Low sample</th></tr></thead><tbody>${curveRows}</tbody></table>` : "<div>No position data.</div>"}

    <h3>Top 5 players</h3>
    <ul>${topRows || "<li>No position data.</li>"}</ul>

    <h3>Bottom 5 players</h3>
    <ul>${bottomRows || "<li>No position data.</li>"}</ul>

    <h3>Modifier bucket counts</h3>
    <ul>${modifierBuckets || "<li>No position data.</li>"}</ul>
  `;
}

function renderPlayer(payload: any) {
  if (payload?.error) {
    playerResultsEl.innerHTML = `<div class="error">${payload.error}</div>`;
    return;
  }

  const flags = (payload.flags ?? []).map((flag: any) => `<span class="badge">${flag.label}${flag.severity === "warning" ? " ⚠️" : ""}</span>`).join("") || "None";

  playerResultsEl.innerHTML = `
    <div class="grid">
      ${card("Player", `${payload.playerName} (${payload.playerId})`)}
      ${card("Season", payload.season)}
      ${card("Position", payload.position)}
      ${card("Age", payload.age)}
      ${card("Age Trajectory Score", payload.ageTrajectoryScore ?? "-")}
      ${card("Modifier", `${payload.recommendedModifierBucket ?? "-"} (${payload.modifierMagnitude ?? "-"})`)}
    </div>
    <h3>Flags</h3>
    <div>${flags}</div>
    <h3>Reason summaries</h3>
    <div class="card"><strong>Production</strong><div>${payload.productionReason ?? "-"}</div></div>
    <div class="card"><strong>Role</strong><div>${payload.roleReason ?? "-"}</div></div>
    <div class="card"><strong>Efficiency</strong><div>${payload.efficiencyReason ?? "-"}</div></div>
    <div class="card"><strong>Overall</strong><div>${payload.overallReasonSummary ?? "-"}</div></div>
  `;
}

function renderValidationFromRun(validationPayload: any): string {
  if (!validationPayload?.report) {
    return "Validation did not run.";
  }

  const report = validationPayload.report;
  const failures = (report.results ?? [])
    .filter((testCase: any) => !testCase.pass)
    .map((testCase: any) => `<li>${testCase.caseName}: ${(testCase.mismatchExplanations ?? []).join("; ")}</li>`)
    .join("");

  return `Validation ${report.failedCases === 0 ? "succeeded" : "completed with failures"}: ${report.passedCases}/${report.totalCases} passed.${
    failures ? `<ul>${failures}</ul>` : ""
  }`;
}


async function loadSummary() {
  const response = await fetch("/api/results/summary");
  const payload = await response.json();
  renderSummary(payload);
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
    const link = document.createElement("a");
    const label = artifact.includes("validation") ? "validation" : "research";
    link.href = `/api/artifacts/${artifact}`;
    link.textContent = `Download ${artifact}`;
    li.innerHTML = `<strong>[${label}]</strong> `;
    li.appendChild(link);
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

  setMessage(runStatus, "Upload in progress and running research...");

  const runResponse = await fetch("/api/run/research", {
    method: "POST",
    headers: { "x-upload-filename": file.name },
    body: file
  });
  const runPayload = await runResponse.json();

  if (!runResponse.ok) {
    setMessage(runStatus, `Bad upload or research failure: ${runPayload.error ?? "Unknown error"}`, "error");
    return;
  }

  let validationText = "";
  if (runValidationInput.checked) {
    setMessage(runStatus, "Research complete. Running validation...");
    const validationResponse = await fetch("/api/run/validation", { method: "POST" });
    const validationPayload = await validationResponse.json();
    validationText = ` ${renderValidationFromRun(validationPayload)}`;
  }

  setMessage(
    runStatus,
    `Research complete. Included ${runPayload.result?.includedRows ?? 0} rows from ${runPayload.result?.inputRows ?? 0} input rows.${validationText}`,
    "success"
  );

  await loadSummary();
  await loadArtifacts();
  await loadPlayers();
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

  const params = new URLSearchParams({ playerId });
  if (season) {
    params.set("season", season);
  }

  const response = await fetch(`/api/results/player?${params.toString()}`);
  const payload = await response.json();
  renderPlayer(payload);
});

document.querySelector<HTMLButtonElement>("#refresh-artifacts")!.addEventListener("click", async () => {
  await loadArtifacts();
});

void loadSummary();
void loadArtifacts();
void loadPlayers();
