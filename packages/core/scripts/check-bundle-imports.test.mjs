import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

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

test("the CLI fails when run through a symlinked path", (t) => {
  const root = mkdtempSync(join(tmpdir(), "check-bundle-imports-cli-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));

  // root/pkg/scripts/check-bundle-imports.mjs checks root/pkg/dist, and
  // root/link points to root/pkg
  const pkg = join(root, "pkg");
  mkdirSync(join(pkg, "scripts"), { recursive: true });
  mkdirSync(join(pkg, "dist"));
  copyFileSync(
    fileURLToPath(new URL("./check-bundle-imports.mjs", import.meta.url)),
    join(pkg, "scripts", "check-bundle-imports.mjs")
  );
  writeFileSync(join(pkg, "dist", "index.mjs"), 'import "happy-dom";\n');
  writeFileSync(join(pkg, "dist", "rsc.mjs"), "export {};\n");
  writeFileSync(join(pkg, "dist", "index.js"), "module.exports = {};\n");
  writeFileSync(join(pkg, "dist", "rsc.js"), "module.exports = {};\n");

  const link = join(root, "link");
  symlinkSync(pkg, link, "dir");

  const { status, stderr } = spawnSync(
    process.execPath,
    [join(link, "scripts", "check-bundle-imports.mjs")],
    { encoding: "utf8" }
  );

  assert.equal(status, 1);
  assert.match(stderr, /check:bundle FAILED/);
});
