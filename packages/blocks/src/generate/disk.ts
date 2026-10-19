import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, sep } from "node:path";

/** generated/schemas as file name → parsed JSON (a null-prototype object). */
export function readSnapshots(dir: string): Record<string, unknown> {
  const snapshots: Record<string, unknown> = Object.create(null);

  if (!existsSync(dir)) return snapshots;

  for (const name of readdirSync(dir).sort()) {
    if (name.endsWith(".json")) {
      snapshots[name] = JSON.parse(readFileSync(join(dir, name), "utf8"));
    }
  }

  return snapshots;
}

/** Every *.stories.tsx under packages/blocks/src, as "src/…" paths with "/" separators. */
export function findStoryFiles(packageDir: string): string[] {
  return readdirSync(join(packageDir, "src"), {
    recursive: true,
    encoding: "utf8",
  })
    .filter((path) => path.endsWith(".stories.tsx"))
    .map((path) => `src/${path.split(sep).join("/")}`)
    .sort();
}
