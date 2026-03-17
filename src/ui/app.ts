const runForm = document.querySelector<HTMLFormElement>("#run-form")!;
const fileInput = document.querySelector<HTMLInputElement>("#input-file")!;
const runValidationInput = document.querySelector<HTMLInputElement>("#run-validation")!;
const runStatus = document.querySelector<HTMLElement>("#run-status")!;
const summaryEl = document.querySelector<HTMLElement>("#summary")!;
const positionSelect = document.querySelector<HTMLSelectElement>("#position-select")!;
const positionResultsEl = document.querySelector<HTMLElement>("#position-results")!;
const playerForm = document.querySelector<HTMLFormElement>("#player-form")!;
const playerResultsEl = document.querySelector<HTMLElement>("#player-results")!;
const artifactList = document.querySelector<HTMLUListElement>("#artifact-list")!;

function renderJson(target: Element, value: unknown) {
  target.textContent = JSON.stringify(value, null, 2);
}

async function loadSummary() {
  const response = await fetch("/api/results/summary");
  const payload = await response.json();
  renderJson(summaryEl, payload);
}

async function loadArtifacts() {
  const response = await fetch("/api/artifacts");
  const payload = await response.json();
  artifactList.innerHTML = "";

  for (const artifact of payload.artifacts ?? []) {
    const li = document.createElement("li");
    const link = document.createElement("a");
    link.href = `/api/artifacts/${artifact}`;
    link.textContent = artifact;
    li.appendChild(link);
    artifactList.appendChild(li);
  }
}

runForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const file = fileInput.files?.[0];
  if (!file) {
    runStatus.textContent = "Select a file first.";
    return;
  }

  runStatus.textContent = "Running research...";
  const runResponse = await fetch("/api/run/research", {
    method: "POST",
    headers: { "x-upload-filename": file.name },
    body: file
  });
  const runPayload = await runResponse.json();

  if (!runResponse.ok) {
    runStatus.textContent = `Research failed: ${runPayload.error ?? "Unknown error"}`;
    return;
  }

  if (runValidationInput.checked) {
    const validationResponse = await fetch("/api/run/validation", { method: "POST" });
    const validationPayload = await validationResponse.json();
    runPayload.validation = validationPayload;
  }

  renderJson(runStatus, runPayload);
  await loadSummary();
  await loadArtifacts();
});

document.querySelector<HTMLButtonElement>("#refresh-summary")!.addEventListener("click", async () => {
  await loadSummary();
});

document.querySelector<HTMLButtonElement>("#load-position")!.addEventListener("click", async () => {
  const position = positionSelect.value;
  const response = await fetch(`/api/results/position/${position}`);
  const payload = await response.json();
  renderJson(positionResultsEl, payload);
});

playerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const playerId = (document.querySelector<HTMLInputElement>("#player-id")!.value || "").trim();
  const season = (document.querySelector<HTMLInputElement>("#player-season")!.value || "").trim();

  const params = new URLSearchParams({ playerId });
  if (season) {
    params.set("season", season);
  }

  const response = await fetch(`/api/results/player?${params.toString()}`);
  const payload = await response.json();
  renderJson(playerResultsEl, payload);
});

document.querySelector<HTMLButtonElement>("#refresh-artifacts")!.addEventListener("click", async () => {
  await loadArtifacts();
});

void loadSummary();
void loadArtifacts();
