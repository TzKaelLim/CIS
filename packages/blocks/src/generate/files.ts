import {
  buildCatalog,
  buildPageShellSchema,
  toDataContract,
} from "@tzuchi/tceditor-spec";
import { blockSpecs, pageRootSpec } from "../specs";
import { snapshotFileName, type ContractProblem } from "./contracts";
import { GENERATED_HEADER, renderStoryFile, storyFilePath } from "./stories";

export type GeneratedFile = {
  /** Relative to packages/blocks, with "/" separators. */
  path: string;
  contents: string;
  /**
   * "regenerate": gen:blocks rewrites it whenever the specs change.
   * "snapshot": a data contract, written once per block version and never changed.
   */
  kind: "regenerate" | "snapshot";
};

/** How every generated JSON file is written. */
export function jsonFile(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

/**
 * Every file gen:blocks writes, sorted by path. `packageDir` is the absolute
 * path of packages/blocks (see renderStoryFile).
 */
export function generateFiles(packageDir: string): GeneratedFile[] {
  const files: GeneratedFile[] = [
    {
      path: "generated/catalog.json",
      contents: jsonFile(
        buildCatalog({ blocks: blockSpecs, root: pageRootSpec })
      ),
      kind: "regenerate",
    },
    {
      path: "generated/page-shell.draft07.json",
      contents: jsonFile(buildPageShellSchema({ blocks: blockSpecs })),
      kind: "regenerate",
    },
  ];

  for (const spec of blockSpecs) {
    files.push(
      {
        path: storyFilePath(spec),
        contents: renderStoryFile(spec, packageDir),
        kind: "regenerate",
      },
      {
        path: `generated/schemas/${snapshotFileName(spec)}`,
        contents: jsonFile(toDataContract(spec)),
        kind: "snapshot",
      }
    );
  }

  return files.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
}

/** What gen:blocks does; it changes nothing on disk when `ok` is false. */
export type GenerationPlan =
  | {
      ok: false;
      /** The contract problems that stop it: every kind but "missing". */
      problems: ContractProblem[];
    }
  | {
      ok: true;
      /** Files that are missing or out of date. */
      write: GeneratedFile[];
      /**
       * Committed snapshots that differ from a fresh one. checkContracts found
       * no contract change, so only the formatting differs: they are never
       * rewritten, and generated.spec.ts asks to restore them from git.
       */
      keep: string[];
      /** Stories with GENERATED_HEADER whose block is gone. */
      remove: string[];
      /** Other stories, which gen:blocks never deletes. */
      foreign: string[];
    };

/**
 * Decides what gen:blocks writes and deletes, without touching the disk.
 * `read` returns a file's contents (path relative to packages/blocks) or null
 * when it does not exist; `storyFiles` is findStoryFiles(packageDir).
 */
export function planGeneration(input: {
  files: readonly GeneratedFile[];
  problems: readonly ContractProblem[];
  read: (path: string) => string | null;
  storyFiles: readonly string[];
}): GenerationPlan {
  const problems = input.problems.filter(
    (problem) => problem.kind !== "missing"
  );

  if (problems.length > 0) return { ok: false, problems };

  const write: GeneratedFile[] = [];
  const keep: string[] = [];

  for (const file of input.files) {
    const current = input.read(file.path);

    if (current === file.contents) continue;

    if (file.kind === "snapshot" && current !== null) {
      keep.push(file.path);
    } else {
      write.push(file);
    }
  }

  const expected = new Set(input.files.map((file) => file.path));
  const remove: string[] = [];
  const foreign: string[] = [];

  for (const path of input.storyFiles) {
    if (expected.has(path)) continue;

    if ((input.read(path) ?? "").startsWith(GENERATED_HEADER)) {
      remove.push(path);
    } else {
      foreign.push(path);
    }
  }

  return { ok: true, write, keep, remove, foreign };
}
