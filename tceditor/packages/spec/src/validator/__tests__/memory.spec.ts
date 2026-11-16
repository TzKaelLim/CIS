import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { DEFAULT_LIMITS } from "../index";

// tsx is a root devDependency (gen:blocks and check:edge load TypeScript
// with it too); Node finds it in the root node_modules.
const TSX = pathToFileURL(require.resolve("tsx")).href;
const CHILD = join(__dirname, "../__helpers__/validate-large-page.ts");

// Edge runtimes give an isolate 128 to 256 MB. Comparing rich text through
// canonical copies and stableStringify needed more than 256 MB here.
const HEAP_MB = 96;

type Outline = { bytes: number; nodes: number; ok: boolean; codes: string[] };

/** Runs the helper in a child process whose heap is HEAP_MB. */
function validateInSmallHeap(shape: string): Outline {
  const child = spawnSync(
    process.execPath,
    [`--max-old-space-size=${HEAP_MB}`, "--import", TSX, CHILD, shape],
    { encoding: "utf8", timeout: 60_000 }
  );

  if (child.status !== 0) {
    throw new Error(
      `The child exited with ${child.status ?? child.signal}:\n${(
        child.stderr ?? ""
      ).slice(0, 2000)}`
    );
  }

  return JSON.parse(child.stdout) as Outline;
}

describe("the validator's memory on a 2 MB page", () => {
  it.each([
    ["empty nodes, which cleaning removes", "empty", ["richtext_cleaned"]],
    ["empty paragraphs, which need no cleaning", "paragraphs", []],
  ])(
    `validates rich text of very many %s within a ${HEAP_MB} MB heap`,
    (_, shape, codes) => {
      const outline = validateInSmallHeap(shape);

      expect(outline).toEqual({
        bytes: expect.any(Number),
        nodes: expect.any(Number),
        ok: true,
        codes,
      });
      expect(outline.bytes).toBeLessThanOrEqual(DEFAULT_LIMITS.maxBytes);
      expect(outline.bytes).toBeGreaterThan(DEFAULT_LIMITS.maxBytes - 2048);
      expect(outline.nodes).toBeGreaterThan(90_000);
    },
    60_000
  );
});
