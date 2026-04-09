import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { extname, join, normalize } from "node:path";
import { buildResearchRun } from "../app/buildResearchRun.js";
import { buildValidationRun } from "../app/buildValidationRun.js";
import { buildPositionSummary, buildResultsSummary, findPlayerResult, listArtifacts, listLatestPlayers } from "../app/artifactIndex.js";
import { POSITIONS } from "../config/positions.js";
import { ensureStorageDirs } from "../config/storage.js";

const port = Number(process.env.PORT ?? "3000");
const builtUiDir = join(process.cwd(), "dist", "ui");

interface StoragePaths {
  artifactDir: string;
  uploadDir: string;
}

function sendJson(res: ServerResponse, status: number, payload: unknown) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(payload));
}

async function readBody(req: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function safeArtifactPath(artifactDir: string, name: string): string | null {
  const cleanName = normalize(name).replace(/^([.][./\\])+/, "");
  if (cleanName.includes("..") || cleanName.startsWith("/")) {
    return null;
  }
  return join(artifactDir, cleanName);
}

async function handleApi(
  req: IncomingMessage,
  res: ServerResponse,
  pathname: string,
  searchParams: URLSearchParams,
  storage: StoragePaths
) {
  if (req.method === "POST" && pathname === "/api/run/research") {
    const fileName = req.headers["x-upload-filename"];
    if (typeof fileName !== "string") {
      sendJson(res, 400, { error: "Missing x-upload-filename header." });
      return;
    }

    const extension = extname(fileName).toLowerCase();
    if (extension !== ".csv" && extension !== ".json") {
      sendJson(res, 400, { error: "Unsupported file type. Upload .csv or .json." });
      return;
    }

    const body = await readBody(req);
    if (body.length === 0) {
      sendJson(res, 400, { error: "Uploaded file body is empty." });
      return;
    }

    const uploadPath = join(storage.uploadDir, `${Date.now()}_${fileName}`);
    await writeFile(uploadPath, body);

    try {
      const result = await buildResearchRun(uploadPath, storage.artifactDir, fileName);
      sendJson(res, 200, { ok: true, result });
    } catch (error) {
      sendJson(res, 500, { ok: false, error: error instanceof Error ? error.message : String(error) });
    }
    return;
  }

  if (req.method === "POST" && pathname === "/api/run/validation") {
    try {
      const report = await buildValidationRun(storage.artifactDir);
      sendJson(res, 200, { ok: report.failedCases === 0, report });
    } catch (error) {
      sendJson(res, 500, { ok: false, error: error instanceof Error ? error.message : String(error) });
    }
    return;
  }

  if (req.method === "GET" && pathname === "/api/artifacts") {
    const artifacts = await listArtifacts(storage.artifactDir);
    sendJson(res, 200, { artifacts });
    return;
  }

  if (req.method === "GET" && pathname.startsWith("/api/artifacts/")) {
    const name = decodeURIComponent(pathname.replace("/api/artifacts/", ""));
    const filePath = safeArtifactPath(storage.artifactDir, name);
    if (!filePath) {
      sendJson(res, 400, { error: "Invalid artifact path." });
      return;
    }

    try {
      await readFile(filePath);
      res.writeHead(200, { "Content-Type": "application/octet-stream", "Content-Disposition": `attachment; filename=\"${name}\"` });
      createReadStream(filePath).pipe(res);
    } catch {
      sendJson(res, 404, { error: `Artifact not found: ${name}` });
    }
    return;
  }

  if (req.method === "GET" && pathname === "/api/results/summary") {
    const summary = await buildResultsSummary(storage.artifactDir);
    if (!summary) {
      sendJson(res, 404, { error: "No run yet. Upload data and run research first." });
      return;
    }
    sendJson(res, 200, summary);
    return;
  }

  if (req.method === "GET" && pathname.startsWith("/api/results/position/")) {
    const position = pathname.replace("/api/results/position/", "").toUpperCase();
    if (!POSITIONS.includes(position as (typeof POSITIONS)[number])) {
      sendJson(res, 400, { error: "Invalid position. Use QB, RB, WR, or TE." });
      return;
    }
    const result = await buildPositionSummary(storage.artifactDir, position as (typeof POSITIONS)[number]);
    if (!result) {
      sendJson(res, 404, { error: "No run yet. Upload data and run research first." });
      return;
    }
    sendJson(res, 200, result);
    return;
  }

  if (req.method === "GET" && pathname === "/api/results/players") {
    const players = await listLatestPlayers(storage.artifactDir);
    if (!players) {
      sendJson(res, 404, { error: "No run yet. Upload data and run research first." });
      return;
    }
    sendJson(res, 200, { players });
    return;
  }

  if (req.method === "GET" && pathname === "/api/results/player") {
    const playerId = (searchParams.get("playerId") ?? "").trim();
    const seasonRaw = (searchParams.get("season") ?? "").trim();
    const season = seasonRaw ? Number(seasonRaw) : undefined;

    if (!playerId) {
      sendJson(res, 400, { error: "Missing playerId query param." });
      return;
    }
    if (seasonRaw && Number.isNaN(season)) {
      sendJson(res, 400, { error: "season must be a number." });
      return;
    }

    const player = await findPlayerResult(storage.artifactDir, playerId, season);
    if (player === null) {
      sendJson(res, 404, { error: "No run yet. Upload data and run research first." });
      return;
    }
    if (player === undefined) {
      sendJson(res, 404, { error: `No player result found for playerId='${playerId}'.` });
      return;
    }
    sendJson(res, 200, player);
    return;
  }

  sendJson(res, 404, { error: "Not found" });
}

function contentType(pathname: string) {
  if (pathname.endsWith(".css")) return "text/css";
  if (pathname.endsWith(".js")) return "text/javascript";
  if (pathname.endsWith(".json")) return "application/json";
  if (pathname.endsWith(".svg")) return "image/svg+xml";
  if (pathname.endsWith(".png")) return "image/png";
  if (pathname.endsWith(".jpg") || pathname.endsWith(".jpeg")) return "image/jpeg";
  if (pathname.endsWith(".woff")) return "font/woff";
  if (pathname.endsWith(".woff2")) return "font/woff2";
  return "text/html";
}

async function handleUi(pathname: string, res: ServerResponse) {
  const target = pathname === "/" ? "index.html" : pathname.replace(/^\//, "");

  try {
    const content = await readFile(join(builtUiDir, target));
    res.writeHead(200, { "Content-Type": contentType(target) });
    res.end(content);
    return;
  } catch {
    // fall through to SPA index fallback
  }

  try {
    const indexHtml = await readFile(join(builtUiDir, "index.html"));
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(indexHtml);
    return;
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("UI not built yet. Run npm run build.");
  }
}

async function main() {
  const storage = await ensureStorageDirs();

  const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? `localhost:${port}`}`);
    if (url.pathname.startsWith("/api/")) {
      await handleApi(req, res, url.pathname, url.searchParams, storage);
      return;
    }
    await handleUi(url.pathname, res);
  });

  server.listen(port, () => {
    console.log(`Age curve MVP running at http://localhost:${port}`);
    console.log(`Persistent storage configured: ARTIFACT_DIR=${storage.artifactDir} UPLOAD_DIR=${storage.uploadDir}`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
