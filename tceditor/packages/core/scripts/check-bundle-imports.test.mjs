import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  collectFiles,
  findForbidden,
  NODE_BUILTIN_IMPORT,
  NODE_IMPORT,
  RULES_ENTRIES,
  RULES_FORBIDDEN,
} from "./check-bundle-imports.mjs";

const dist = mkdtempSync(join(tmpdir(), "check-bundle-imports-"));
after(() => rmSync(dist, { recursive: true, force: true }));

const write = (name, source) => writeFileSync(join(dist, name), source);

// esbuild ends every CommonJS file it writes with this comment
const CJS_FOOTER =
  "// Annotate the CommonJS export names for ESM import in node:\n";

// index.mjs -> shared.mjs (static) -> lazy.mjs (dynamic)
// index.js  -> cjs-chunk.js (require)
// rsc.mjs   -> side-effect.mjs (bare import)
// rules.mjs -> rules-chunk.mjs (re-export), which imports React and happy-dom
// rules.js mentions node: only in esbuild's CommonJS comment, and the rules
// type declarations are clean
// migrate.mjs, node-import.mjs and builtin-import.mjs are not reachable from
// any entry
write("index.mjs", 'import { a } from "./shared.mjs";\nexport { a };\n');
write("shared.mjs", 'export const a = () => import("./lazy.mjs");\n');
write("lazy.mjs", 'import { generateJSON } from "@tiptap/html";\n');
write("index.js", 'const chunk = require("./cjs-chunk.js");\n');
write("cjs-chunk.js", 'module.exports = require("happy-dom");\n');
write("rsc.mjs", 'import "./side-effect.mjs";\nimport React from "react";\n');
write("side-effect.mjs", "globalThis.x = 1;\n");
write("rsc.js", 'require("react");\n');
write("rules.mjs", 'export * from "./rules-chunk.mjs";\n');
write(
  "rules-chunk.mjs",
  'import { createElement } from "react";\nimport "happy-dom";\nexport const h = createElement;\n'
);
write("rules.js", `module.exports = {};\n${CJS_FOOTER}`);
write("rules.d.ts", "declare const a: number;\nexport { a };\n");
write("rules.d.mts", "declare const a: number;\nexport { a };\n");
write("migrate.mjs", 'import "happy-dom";\n');
write("node-import.mjs", 'import { readFileSync } from "node:fs";\n');
write("builtin-import.mjs", 'import { createHash } from "crypto";\n');

test("collectFiles follows static, dynamic, bare and require imports and re-exports", () => {
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
  assert.deepEqual(collectFiles(dist, "rules.mjs").sort(), [
    "rules-chunk.mjs",
    "rules.mjs",
  ]);
});

test("findForbidden reports reachable files that mention a forbidden package", () => {
  assert.deepEqual(findForbidden(dist), [
    { entry: "index.mjs", file: "lazy.mjs", name: "@tiptap/html" },
    { entry: "index.js", file: "cjs-chunk.js", name: "happy-dom" },
    { entry: "rules.mjs", file: "rules-chunk.mjs", name: "happy-dom" },
  ]);
});

test("findForbidden ignores files no entry reaches", () => {
  assert.deepEqual(findForbidden(dist, ["rsc.mjs", "rsc.js"]), []);
});

test("the rules check reports React, Tiptap and node: imports", () => {
  assert.deepEqual(findForbidden(dist, RULES_ENTRIES, RULES_FORBIDDEN), [
    { entry: "rules.mjs", file: "rules-chunk.mjs", name: "react" },
  ]);
  assert.deepEqual(
    findForbidden(
      dist,
      ["rsc.js", "index.mjs", "node-import.mjs"],
      RULES_FORBIDDEN
    ),
    [
      { entry: "rsc.js", file: "rsc.js", name: "react" },
      { entry: "index.mjs", file: "lazy.mjs", name: "@tiptap/" },
      {
        entry: "node-import.mjs",
        file: "node-import.mjs",
        name: NODE_IMPORT.name,
      },
    ]
  );
});

test("the rules check ignores node: in esbuild's CommonJS comment", () => {
  assert.match(readFileSync(join(dist, "rules.js"), "utf8"), /node:/);
  assert.deepEqual(findForbidden(dist, ["rules.js"], RULES_FORBIDDEN), []);
});

test("NODE_IMPORT matches only imports and requires of node: modules", () => {
  for (const source of [
    'import { readFileSync } from "node:fs";',
    'export * from "node:fs";',
    'import "node:fs";',
    'const fs = await import("node:fs");',
    "const fs = require('node:fs');",
    'const fs = require ( "node:fs" );',
  ]) {
    assert.ok(NODE_IMPORT.pattern.test(source), source);
  }

  for (const source of [
    CJS_FOOTER,
    'const label = "node: text";',
    'const id = "node:fs";',
  ]) {
    assert.ok(!NODE_IMPORT.pattern.test(source), source);
  }
});

test("the rules check reports imports of Node built-ins without the node: prefix", () => {
  assert.deepEqual(
    findForbidden(dist, ["builtin-import.mjs"], RULES_FORBIDDEN),
    [
      {
        entry: "builtin-import.mjs",
        file: "builtin-import.mjs",
        name: NODE_BUILTIN_IMPORT.name,
      },
    ]
  );
});

test("NODE_BUILTIN_IMPORT matches only imports and requires of Node built-ins", () => {
  for (const source of [
    'import { createHash } from "crypto";',
    'export * from "fs";',
    'import "path";',
    'const fs = await import("fs/promises");',
    "const os = require('os');",
    'const util = require ( "util" );',
    'import type { Buffer } from "buffer";',
  ]) {
    assert.ok(NODE_BUILTIN_IMPORT.pattern.test(source), source);
  }

  for (const source of [
    CJS_FOOTER,
    'import { a } from "./fs.mjs";',
    'import CryptoJS from "crypto-js";',
    'import { join } from "pathe";',
    'import { readFileSync } from "node:fs";',
    'const name = "fs";',
  ]) {
    assert.ok(!NODE_BUILTIN_IMPORT.pattern.test(source), source);
  }
});

// Runs a copy of the CLI through a symlink: the copy in root/pkg/scripts/
// checks root/pkg/dist, and root/link points to root/pkg. `files` replaces the
// clean dist files; null leaves a file out
const runCli = (t, files) => {
  const root = mkdtempSync(join(tmpdir(), "check-bundle-imports-cli-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));

  const pkg = join(root, "pkg");
  mkdirSync(join(pkg, "scripts"), { recursive: true });
  mkdirSync(join(pkg, "dist"));
  copyFileSync(
    fileURLToPath(new URL("./check-bundle-imports.mjs", import.meta.url)),
    join(pkg, "scripts", "check-bundle-imports.mjs")
  );

  const clean = {
    "index.mjs": "export {};\n",
    "rsc.mjs": "export {};\n",
    "rules.mjs": "export {};\n",
    "index.js": `module.exports = {};\n${CJS_FOOTER}`,
    "rsc.js": `module.exports = {};\n${CJS_FOOTER}`,
    "rules.js": `module.exports = {};\n${CJS_FOOTER}`,
    "rules.d.ts": "export {};\n",
    "rules.d.mts": "export {};\n",
  };

  for (const [name, source] of Object.entries({ ...clean, ...files })) {
    if (source !== null) writeFileSync(join(pkg, "dist", name), source);
  }

  const link = join(root, "link");
  symlinkSync(pkg, link, "dir");

  return spawnSync(
    process.execPath,
    [join(link, "scripts", "check-bundle-imports.mjs")],
    { encoding: "utf8" }
  );
};

test("the CLI fails when run through a symlinked path", (t) => {
  const { status, stderr } = runCli(t, {
    "index.mjs": 'import "happy-dom";\n',
  });

  assert.equal(status, 1);
  assert.match(stderr, /check:bundle FAILED/);
});

test("the CLI fails when the rules entry requires React", (t) => {
  const { status, stderr } = runCli(t, { "rules.js": 'require("react");\n' });

  assert.equal(status, 1);
  assert.match(stderr, /rules\.js reaches rules\.js, which mentions react/);
  assert.match(stderr, /check:bundle FAILED: the rules entry/);
});

test("the CLI fails when the rules entry requires a Node built-in", (t) => {
  const { status, stderr } = runCli(t, {
    "rules.js": 'const { createHash } = require("crypto");\n',
  });

  assert.equal(status, 1);
  assert.match(
    stderr,
    /rules\.js reaches rules\.js, which mentions an import of a Node built-in/
  );
  assert.match(stderr, /check:bundle FAILED: the rules entry/);
});

test("the CLI fails when the rules type declarations import React", (t) => {
  const { status, stderr } = runCli(t, {
    "rules.d.ts": 'import { ReactNode } from "react";\nexport {};\n',
  });

  assert.equal(status, 1);
  assert.match(
    stderr,
    /rules\.d\.ts reaches rules\.d\.ts, which mentions react/
  );
});

test("the CLI fails when the rules entry was not built", (t) => {
  const { status, stderr } = runCli(t, { "rules.mjs": null, "rules.js": null });

  assert.equal(status, 1);
  assert.match(stderr, /rules\.mjs, rules\.js not found/);
});

test("the CLI passes a clean build", (t) => {
  const { status, stdout, stderr } = runCli(t, {});

  assert.equal(stderr, "");
  assert.equal(status, 0);
  assert.match(stdout, /check:bundle passed/);
});
