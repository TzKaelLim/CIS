import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";

import { collectFiles, findForbidden } from "./check-bundle-imports.mjs";

const dist = mkdtempSync(join(tmpdir(), "check-bundle-imports-"));
after(() => rmSync(dist, { recursive: true, force: true }));

const write = (name, source) => writeFileSync(join(dist, name), source);

// index.mjs -> shared.mjs (static) -> lazy.mjs (dynamic)
// index.js  -> cjs-chunk.js (require)
// rsc.mjs   -> side-effect.mjs (bare import)
// migrate.mjs is not reachable from any entry
write("index.mjs", 'import { a } from "./shared.mjs";\nexport { a };\n');
write("shared.mjs", 'export const a = () => import("./lazy.mjs");\n');
write("lazy.mjs", 'import { generateJSON } from "@tiptap/html";\n');
write("index.js", 'const chunk = require("./cjs-chunk.js");\n');
write("cjs-chunk.js", 'module.exports = require("happy-dom");\n');
write("rsc.mjs", 'import "./side-effect.mjs";\nimport React from "react";\n');
write("side-effect.mjs", "globalThis.x = 1;\n");
write("rsc.js", 'require("react");\n');
write("migrate.mjs", 'import "happy-dom";\n');

test("collectFiles follows static, dynamic, bare and require imports", () => {
  assert.deepEqual(collectFiles(dist, "index.mjs").sort(), [
    "index.mjs",
    "lazy.mjs",
    "shared.mjs",
  ]);
  assert.deepEqual(collectFiles(dist, "index.js").sort(), [
    "cjs-chunk.js",
    "index.js",
  ]);
  assert.deepEqual(collectFiles(dist, "rsc.mjs").sort(), [
    "rsc.mjs",
    "side-effect.mjs",
  ]);
});

test("findForbidden reports reachable files that mention a forbidden package", () => {
  assert.deepEqual(findForbidden(dist), [
    { entry: "index.mjs", file: "lazy.mjs", name: "@tiptap/html" },
    { entry: "index.js", file: "cjs-chunk.js", name: "happy-dom" },
  ]);
});

test("findForbidden ignores files no entry reaches", () => {
  assert.deepEqual(findForbidden(dist, ["rsc.mjs", "rsc.js"]), []);
});
