import { mkdir } from "node:fs/promises";
import { join } from "node:path";

const defaultArtifactDir = join(process.cwd(), "artifacts");
const defaultUploadDir = join(process.cwd(), "tmp", "uploads");

export function resolveStoragePaths() {
  return {
    artifactDir: process.env.ARTIFACT_DIR?.trim() || defaultArtifactDir,
    uploadDir: process.env.UPLOAD_DIR?.trim() || defaultUploadDir
  };
}

export async function ensureStorageDirs() {
  const { artifactDir, uploadDir } = resolveStoragePaths();
  await mkdir(artifactDir, { recursive: true });
  await mkdir(uploadDir, { recursive: true });
  return { artifactDir, uploadDir };
}

