import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import type { Data } from "@tzuchi/tceditor";

/** The published page, inside the data directory. */
export const ACTIVITY_FILE_NAME = "activity.json";

/**
 * Where published pages are stored: `SHOWCASE_DATA_DIR` (resolved against the
 * working directory) or `.data` in the working directory. `pnpm dev:showcase`,
 * `next start` and jest all run in `apps/showcase`, so the default is
 * `apps/showcase/.data` (gitignored).
 */
export function getDataDir(): string {
  const fromEnv = process.env.SHOWCASE_DATA_DIR;

  return fromEnv ? resolve(fromEnv) : join(process.cwd(), ".data");
}

/** The sample activity page shown until something is published. */
export function getPresetPath(): string {
  return join(process.cwd(), "content", "activity.preset.json");
}

export type ActivitySource = "published" | "preset";

const isNotFound = (error: unknown) =>
  typeof error === "object" &&
  error !== null &&
  (error as { code?: unknown }).code === "ENOENT";

/**
 * Reads the published page, or the preset while nothing is published. The
 * publish API validated the published file before writing it, and a test
 * validates the preset, so neither is validated again here.
 */
export async function readActivity(options: {
  dataDir: string;
  presetPath: string;
}): Promise<{ data: Data; source: ActivitySource }> {
  try {
    const raw = await readFile(
      join(options.dataDir, ACTIVITY_FILE_NAME),
      "utf8"
    );

    return { data: JSON.parse(raw) as Data, source: "published" };
  } catch (error) {
    if (!isNotFound(error)) throw error;
  }

  const raw = await readFile(options.presetPath, "utf8");

  return { data: JSON.parse(raw) as Data, source: "preset" };
}

/** readActivity with the default locations. */
export function loadActivity() {
  return readActivity({ dataDir: getDataDir(), presetPath: getPresetPath() });
}
