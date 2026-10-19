import {
  buildCatalog,
  buildPageShellSchema,
  toDataContract,
} from "@tzuchi/tceditor-spec";
import { blockSpecs, pageRootSpec } from "../specs";
import { snapshotFileName } from "./contracts";
import { renderStoryFile, storyFilePath } from "./stories";

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

/** Every file gen:blocks writes, sorted by path. */
export function generateFiles(): GeneratedFile[] {
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
        contents: renderStoryFile(spec),
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
