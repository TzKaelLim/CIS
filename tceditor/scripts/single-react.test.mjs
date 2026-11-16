// The repo must resolve a single React: a second copy breaks hooks (spec §13.1).
// pnpm-lock.yaml lists every installed version, so a second react or react-dom
// anywhere in the workspace shows up here.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

const REACT_VERSION = "19.2.6";

const lockfile = readFileSync(
  join(import.meta.dirname, "../pnpm-lock.yaml"),
  "utf8"
);
const packagesStart = lockfile.indexOf("\npackages:\n");
const snapshotsStart = lockfile.indexOf("\nsnapshots:\n");

// Versions in the top-level keys of a lockfile section, such as
// "  react@19.2.6:" or "  react-dom@19.2.6(react@19.2.6):"
const versionsOf = (section, name) =>
  [...section.matchAll(new RegExp(`^  ${name}@([^:(\\s]+)`, "gm"))].map(
    (match) => match[1]
  );

test("pnpm-lock.yaml has a packages and a snapshots section", () => {
  assert.ok(packagesStart !== -1, "no packages: section");
  assert.ok(snapshotsStart > packagesStart, "no snapshots: section");
});

test(`the lockfile has one react and one react-dom, both ${REACT_VERSION}`, () => {
  const packages = lockfile.slice(packagesStart, snapshotsStart);

  assert.deepEqual(versionsOf(packages, "react"), [REACT_VERSION]);
  assert.deepEqual(versionsOf(packages, "react-dom"), [REACT_VERSION]);
});

test(`every react and react-dom snapshot is ${REACT_VERSION}`, () => {
  const snapshots = lockfile.slice(snapshotsStart);

  for (const name of ["react", "react-dom"]) {
    const versions = versionsOf(snapshots, name);

    assert.ok(versions.length > 0, `no ${name} snapshot`);
    assert.deepEqual([...new Set(versions)], [REACT_VERSION], name);
  }
});

// A link: dependency is installed from its own directory, together with any
// node_modules (and React) found there, so only the vendored uikit may be linked
test("link: dependencies point only into vendor/uikit", () => {
  const importers = lockfile.slice(
    lockfile.indexOf("\nimporters:\n"),
    packagesStart
  );
  const targets = [...importers.matchAll(/^ {8}specifier: link:(\S+)$/gm)].map(
    (match) => match[1]
  );

  assert.ok(targets.length > 0, "no link: dependency");

  for (const target of targets) {
    assert.match(target, /^(\.\.\/)+vendor\/uikit\//, target);
  }
});
