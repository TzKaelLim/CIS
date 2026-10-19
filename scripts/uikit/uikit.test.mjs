// Checks the vendored uikit snapshot (vendor/uikit, written by pnpm sync:uikit)
// and the uikit options snapshot that the block tests compare against.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, sep } from "node:path";
import { test } from "node:test";

import { scanUikitOptions, UIKIT_OPTIONS_PATH } from "./scan-options.mjs";
import { REMOVE_RULES, unexpectedVendorFiles } from "./sync-uikit.mjs";

const repoRoot = join(import.meta.dirname, "../..");
const vendorDir = join(repoRoot, "vendor/uikit");
const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
const source = readJson(join(vendorDir, "SOURCE.json"));

// Every file under vendor/uikit except the two that describe the snapshot
function vendoredFiles() {
  const entries = readdirSync(vendorDir, {
    recursive: true,
    withFileTypes: true,
  });
  const paths = [];

  for (const entry of entries) {
    const path = relative(vendorDir, join(entry.parentPath, entry.name))
      .split(sep)
      .join("/");

    assert.equal(entry.isSymbolicLink(), false, `${path} is a symlink`);

    // Finder writes .DS_Store files; git ignores them
    if (entry.name === ".DS_Store") continue;

    if (entry.isFile() && path !== "SOURCE.json" && path !== "README.md") {
      paths.push(path);
    }
  }

  return paths.sort();
}

test("every vendored file is listed in SOURCE.json with its sha256", () => {
  const files = vendoredFiles();

  assert.deepEqual(files, Object.keys(source.files));

  const changed = files.filter(
    (path) =>
      createHash("sha256")
        .update(readFileSync(join(vendorDir, path)))
        .digest("hex") !== source.files[path]
  );

  assert.deepEqual(changed, [], "edited by hand? run pnpm sync:uikit");
});

test("uikit-options.json matches a fresh scan of the vendored @heroui/styles", async () => {
  const snapshot = readJson(join(repoRoot, UIKIT_OPTIONS_PATH));

  assert.deepEqual(snapshot, await scanUikitOptions(repoRoot));
  assert.equal(snapshot.source.commit, source.commit);

  for (const name of ["button", "card", "chip", "surface", "typography"]) {
    assert.equal(snapshot.components[name]?.export, `${name}Variants`);
  }
});

test("SOURCE.json names the full commit and lists what was removed", () => {
  assert.match(source.commit, /^[0-9a-f]{40}$/);
  assert.match(
    source.commitDate,
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/
  );
  assert.equal(source.repository, "puck-tzuchi-poc");
  // The branch the commit was checked against (sync:uikit's --branch); any
  // branch will do, as long as it is recorded
  assert.match(source.branch, /^[^\s]+$/);

  // Sorted and free of duplicates, so a re-sync only shows real changes
  assert.deepEqual(source.removed, [...new Set(source.removed)].sort());
  assert.deepEqual(Object.keys(source.files), Object.keys(source.files).sort());

  // Vite cannot build the blocks while this file is present
  assert.ok(source.removed.includes("heroui/styles/tsconfig.json"));

  for (const path of source.removed) {
    assert.equal(existsSync(join(vendorDir, path)), false, path);
  }

  // The tokens are built by the sync and committed with the snapshot
  for (const name of ["tokens.css", "tokens.js", "tokens.d.ts"]) {
    assert.ok(`packages/tokens/dist/${name}` in source.files, name);
  }

  // S2 vendors no heroui/react (spec §18 #14): the blocks use only the tv()
  // functions of @heroui/styles, so public pages ship no component JS
  assert.equal(
    Object.keys(source.files).some((path) => path.startsWith("heroui/react/")),
    false
  );
});

test("the HeroUI license and notice stay with the code", () => {
  assert.match(
    readFileSync(join(vendorDir, "heroui/LICENSE"), "utf8"),
    /^\s*Apache License\s+Version 2\.0, January 2004/
  );
  assert.ok(readFileSync(join(vendorDir, "heroui/NOTICE.md"), "utf8").trim());

  for (const path of ["heroui/LICENSE", "heroui/NOTICE.md"]) {
    assert.ok(path in source.files, path);
    assert.equal(source.removed.includes(path), false, path);
  }
});

test("REMOVE_RULES drop stories, tests and the upstream tooling only", () => {
  const removed = (path) => REMOVE_RULES.some((rule) => rule.test(path));

  for (const path of [
    "heroui/styles/src/components/button/button.stories.tsx",
    "heroui/styles/src/components/button/button.stories.mdx",
    "heroui/styles/src/components/button/button.test.ts",
    "heroui/styles/src/__tests__/button.ts",
    "heroui/styles/tests/setup.mjs",
    "heroui/styles/tsconfig.json",
    "heroui/styles/scripts/build.mjs",
    "heroui/styles/themes/tzuchi/gap-audit/README.md",
  ]) {
    assert.equal(removed(path), true, path);
  }

  for (const path of [
    "heroui/LICENSE",
    "heroui/NOTICE.md",
    "heroui/styles/src/components/button/button.styles.ts",
    "heroui/styles/themes/tzuchi/index.css",
    "heroui/styles/themes/tzuchi/DESIGN-LANGUAGE.md",
    "packages/tokens/build.mjs",
    "packages/tokens/check.mjs",
  ]) {
    assert.equal(removed(path), false, path);
  }
});

test("sync:uikit refuses files outside the snapshot's folders", (t) => {
  const dir = mkdtempSync(join(tmpdir(), "uikit-vendor-"));

  t.after(() => rmSync(dir, { recursive: true, force: true }));

  for (const path of [
    "README.md",
    "SOURCE.json",
    ".DS_Store",
    "heroui/LICENSE",
    "heroui/styles/package.json",
    "packages/tokens/dist/tokens.css",
    // put there by hand: SOURCE.json would list them as part of the snapshot
    "notes.md",
    "extra/x.css",
    "packages.md",
  ]) {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), "");
  }

  assert.deepEqual(unexpectedVendorFiles(dir), [
    "extra/x.css",
    "notes.md",
    "packages.md",
  ]);
  assert.deepEqual(unexpectedVendorFiles(vendorDir), []);
  assert.deepEqual(unexpectedVendorFiles(join(dir, "missing")), []);
});
