import assert from "node:assert/strict";
import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, test } from "node:test";

import {
  BUNDLED_DEV_DEPENDENCIES,
  collectFindings,
  GATED_IMPORTERS,
  shippedPackages,
  sortFindings,
} from "./audit-gate-lib.mjs";

// A small pnpm-style install: every package lives in node_modules/.pnpm and
// is reached through symlinks, like `pnpm install` lays it out.
const root = mkdtempSync(join(tmpdir(), "audit-gate-"));
after(() => rmSync(root, { recursive: true, force: true }));

const store = (id, name) =>
  join(root, "node_modules/.pnpm", id, "node_modules", name);

const writePackage = (dir, manifest) => {
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify(manifest));
};

const link = (target, path) => {
  mkdirSync(dirname(path), { recursive: true });
  symlinkSync(target, path, "dir");
};

writePackage(store("a@1.0.0", "a"), {
  name: "a",
  version: "1.0.0",
  dependencies: { b: "^2.0.0" },
  optionalDependencies: { "not-installed": "^1.0.0" },
  peerDependencies: { react: "*" },
});
link(
  store("b@2.0.0", "b"),
  join(root, "node_modules/.pnpm/a@1.0.0/node_modules/b")
);
writePackage(store("b@2.0.0", "b"), { name: "b", version: "2.0.0" });
writePackage(store("@scope+c@3.0.0", "@scope/c"), {
  name: "@scope/c",
  version: "3.0.0",
  dependencies: { b: "^2.0.0" },
});
link(
  store("b@2.0.0", "b"),
  join(root, "node_modules/.pnpm/@scope+c@3.0.0/node_modules/b")
);
writePackage(store("icons@0.1.0", "icons"), {
  name: "icons",
  version: "0.1.0",
});
writePackage(store("jest@1.0.0", "jest"), { name: "jest", version: "1.0.0" });
writePackage(store("react@19.0.0", "react"), {
  name: "react",
  version: "19.0.0",
});
writePackage(store("b@2.5.0", "b"), { name: "b", version: "2.5.0" });

const project = join(root, "packages/lib");
writePackage(project, {
  name: "lib",
  version: "0.0.0",
  dependencies: { a: "1.0.0", "b-alias": "npm:b@2.5.0", "@scope/c": "3.0.0" },
  devDependencies: { icons: "0.1.0", jest: "1.0.0" },
  peerDependencies: { react: "*" },
});
link(store("a@1.0.0", "a"), join(project, "node_modules/a"));
link(store("b@2.5.0", "b"), join(project, "node_modules/b-alias"));
link(
  store("@scope+c@3.0.0", "@scope/c"),
  join(project, "node_modules/@scope/c")
);
link(store("icons@0.1.0", "icons"), join(project, "node_modules/icons"));
link(store("jest@1.0.0", "jest"), join(project, "node_modules/jest"));
link(store("react@19.0.0", "react"), join(project, "node_modules/react"));

const broken = join(root, "packages/broken");
writePackage(broken, {
  name: "broken",
  version: "0.0.0",
  dependencies: { ghost: "1.0.0" },
});

test("the gate covers the published packages", () => {
  assert.deepEqual(GATED_IMPORTERS, [
    "packages/core",
    "packages/plugin-heading-analyzer",
  ]);
  assert.deepEqual(BUNDLED_DEV_DEPENDENCIES, {
    "packages/core": ["css-box-model", "lucide-react"],
  });
});

test("shippedPackages follows dependencies through pnpm symlinks", () => {
  assert.deepEqual([...shippedPackages(project)].sort(), [
    "@scope/c@3.0.0",
    "a@1.0.0",
    "b@2.0.0",
    "b@2.5.0",
  ]);
});

test("shippedPackages adds the devDependencies that the build bundles", () => {
  const shipped = shippedPackages(project, ["icons"]);
  assert.equal(shipped.has("icons@0.1.0"), true);
  assert.equal(shipped.has("jest@1.0.0"), false);
  assert.equal(shipped.has("react@19.0.0"), false);
});

test("shippedPackages rejects a bundled entry that is not a devDependency", () => {
  assert.throws(
    () => shippedPackages(project, ["left-pad"]),
    /left-pad is listed in BUNDLED_DEV_DEPENDENCIES but is not a devDependency/
  );
});

test("shippedPackages fails when a dependency is not installed", () => {
  assert.throws(() => shippedPackages(broken), /Cannot find ghost/);
});

// Shape copied from real `pnpm audit --json` output (pnpm 10.26). pnpm reports
// one representative path per vulnerable version, taken from whichever
// workspace project reaches the package first.
const report = {
  actions: [],
  muted: [],
  metadata: {
    vulnerabilities: { info: 0, low: 0, moderate: 2, high: 1, critical: 1 },
  },
  advisories: {
    1241270: {
      id: 1241270,
      github_advisory_id: "GHSA-c8x8-7fp4-3x9w",
      module_name: "prosemirror-view",
      severity: "high",
      title:
        "ProseMirror has a XSS vulnerability in prosemirror-view's paste handling",
      findings: [
        {
          version: "1.41.8",
          paths: ["packages__core>@tiptap/pm>prosemirror-view"],
        },
      ],
    },
    1240609: {
      id: 1240609,
      github_advisory_id: "GHSA-vcvr-r3jv-pc5j",
      module_name: "next",
      severity: "critical",
      title: "Next.js advisory",
      findings: [{ version: "16.2.6", paths: ["apps__demo>next"] }],
    },
    1130709: {
      id: 1130709,
      github_advisory_id: "GHSA-fxqj-rqcc-2cmp",
      module_name: "postcss",
      severity: "moderate",
      title: "PostCSS advisory",
      findings: [
        { version: "8.4.31", paths: ["apps__demo>next>postcss"] },
        { version: "8.5.14", paths: ["packages__tsup-config>postcss"] },
      ],
    },
    1: {
      id: 1,
      github_advisory_id: "GHSA-test-test-test",
      module_name: "tslib",
      severity: "moderate",
      title: "Shared dependency advisory",
      findings: [
        { version: "2.8.1", paths: ["apps__demo>next>@swc/helpers>tslib"] },
      ],
    },
  },
};

const shipped = new Set(["prosemirror-view@1.41.8", "tslib@2.8.1"]);

test("collectFindings emits one finding per path", () => {
  const findings = collectFindings(report, shipped);
  assert.equal(findings.length, 5);
  assert.deepEqual(
    findings.find((finding) => finding.module === "prosemirror-view"),
    {
      path: "packages__core>@tiptap/pm>prosemirror-view",
      module: "prosemirror-view",
      version: "1.41.8",
      severity: "high",
      id: "GHSA-c8x8-7fp4-3x9w",
      title:
        "ProseMirror has a XSS vulnerability in prosemirror-view's paste handling",
      gated: true,
    }
  );
});

test("collectFindings gates by package version, not by the reported path", () => {
  const gated = collectFindings(report, shipped)
    .filter((finding) => finding.gated)
    .map((finding) => `${finding.module}@${finding.version}`);
  assert.deepEqual(gated.sort(), ["prosemirror-view@1.41.8", "tslib@2.8.1"]);
});

test("collectFindings accepts a clean report", () => {
  assert.deepEqual(
    collectFindings({ advisories: {}, metadata: {} }, shipped),
    []
  );
});

test("collectFindings rejects output that is not an audit report", () => {
  assert.throws(
    () =>
      collectFindings(
        { error: { code: "ERR_PNPM_AUDIT_BAD_RESPONSE" } },
        shipped
      ),
    /Unexpected pnpm audit output/
  );
  assert.throws(
    () => collectFindings(null, shipped),
    /Unexpected pnpm audit output/
  );
  assert.throws(
    () => collectFindings({}, shipped),
    /Unexpected pnpm audit output/
  );
});

test("sortFindings orders by severity, then module, then advisory", () => {
  assert.deepEqual(
    sortFindings(collectFindings(report, shipped)).map(
      (finding) => `${finding.severity} ${finding.module}@${finding.version}`
    ),
    [
      "critical next@16.2.6",
      "high prosemirror-view@1.41.8",
      "moderate postcss@8.4.31",
      "moderate postcss@8.5.14",
      "moderate tslib@2.8.1",
    ]
  );
});
