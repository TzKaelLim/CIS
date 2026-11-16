import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { blockSpecs } from "../../specs";
import { snapshotFileName } from "../contracts";
import { findStoryFiles } from "../disk";
import { contractSpecs, generateFiles, sameSnapshot } from "../files";

const packageDir = join(__dirname, "../../..");
const files = generateFiles(packageDir);

const readOrNull = (path: string): string | null => {
  const target = join(packageDir, path);

  return existsSync(target) ? readFileSync(target, "utf8") : null;
};

const list = (paths: string[]) => paths.map((path) => `  ${path}`).join("\n");

describe("files generated from the block specs", () => {
  it("match a fresh run of pnpm gen:blocks byte for byte", () => {
    const stale = files
      .filter((file) => file.kind === "regenerate")
      .filter((file) => readOrNull(file.path) !== file.contents)
      .map((file) => file.path);

    if (stale.length > 0) {
      throw new Error(
        `These files are missing or out of date:\n${list(
          stale
        )}\nRun \`pnpm gen:blocks\` and commit the result.`
      );
    }
  });

  it("include an unchanged data contract snapshot for the current version of every block and the page root", () => {
    const snapshots = files.filter((file) => file.kind === "snapshot");
    const missing = snapshots
      .filter((file) => readOrNull(file.path) === null)
      .map((file) => file.path);
    // Compared as JSON: a committed snapshot keeps its formatting
    const changed = snapshots
      .filter((file) => {
        const current = readOrNull(file.path);

        return current !== null && !sameSnapshot(current, file.contents);
      })
      .map((file) => file.path);

    expect(snapshots.map((file) => file.path).sort()).toEqual(
      contractSpecs
        .map((spec) => `generated/schemas/${snapshotFileName(spec)}`)
        .sort()
    );

    if (missing.length > 0) {
      throw new Error(
        `Missing data contract snapshots:\n${list(
          missing
        )}\nRun \`pnpm gen:blocks\` and commit the result.`
      );
    }

    if (changed.length > 0) {
      throw new Error(
        `These snapshots differ from the specs' current data contracts:\n${list(
          changed
        )}\nA snapshot never changes once committed. If a spec's contract changed, bump its version (compatible changes only, see compat.spec.ts) and run \`pnpm gen:blocks\`; otherwise restore the file from git.`
      );
    }
  });

  it("keep the snapshots of every older version", () => {
    const missing = contractSpecs.flatMap((spec) =>
      Array.from(
        { length: spec.version - 1 },
        (_, index) =>
          `generated/schemas/${snapshotFileName({
            ...spec,
            version: index + 1,
          })}`
      ).filter((path) => readOrNull(path) === null)
    );

    if (missing.length > 0) {
      throw new Error(
        `Snapshots of older block versions are missing:\n${list(
          missing
        )}\ngen:blocks cannot recreate them; restore them from git.`
      );
    }
  });

  it("are the only stories in the package", () => {
    const generated = new Set(
      files
        .filter((file) => file.path.endsWith(".stories.tsx"))
        .map((file) => file.path)
    );

    expect(generated.size).toBe(blockSpecs.length);
    expect(
      findStoryFiles(packageDir).filter((path) => !generated.has(path))
    ).toEqual([]);
  });
});
