// Pure helpers for scripts/audit-gate.mjs. They live in their own module so
// they can be unit tested without running `pnpm audit`.
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { basename, dirname, join } from "node:path";

// Workspace projects that we publish. A vulnerable package that ships with one
// of them fails the gate. Findings anywhere else (apps/demo, build and lint
// tooling) are printed but do not fail it.
export const GATED_IMPORTERS = [
  "packages/core",
  "packages/plugin-heading-analyzer",
];

// devDependencies that the tsup build bundles into dist (tsup only leaves
// dependencies, peerDependencies and tsup-config's `external` list out of the
// bundle), so they ship with the package even though `pnpm audit --prod`
// skips them. Keep this in sync with what production code imports.
export const BUNDLED_DEV_DEPENDENCIES = {
  "packages/core": ["css-box-model", "lucide-react"],
};

const SEVERITY_ORDER = ["critical", "high", "moderate", "low", "info"];

const readManifest = (dir) =>
  JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));

// Node's lookup: <dir>/node_modules/<name> for `from` and each of its parents.
// pnpm installs every dependency as a symlink in such a folder.
function resolvePackageDir(from, name) {
  for (let dir = from; ; dir = dirname(dir)) {
    if (basename(dir) !== "node_modules") {
      const candidate = join(dir, "node_modules", name);
      if (existsSync(join(candidate, "package.json"))) {
        return realpathSync(candidate);
      }
    }
    if (dirname(dir) === dir) return null;
  }
}

// Every "<name>@<version>" that installs with the project at `projectDir`:
// its dependencies and optionalDependencies, the `bundledDev`
// devDependencies, and everything those depend on. Peer dependencies are the
// consumer's to install and are not followed. Needs `pnpm install` first.
export function shippedPackages(projectDir, bundledDev = []) {
  const manifest = readManifest(projectDir);
  for (const name of bundledDev) {
    if (!Object.hasOwn(manifest.devDependencies ?? {}, name)) {
      throw new Error(
        `${name} is listed in BUNDLED_DEV_DEPENDENCIES but is not a devDependency of ${projectDir}`
      );
    }
  }

  const shipped = new Set();
  const visited = new Set();

  function visitDependencies(dir, pkg) {
    const optional = Object.keys(pkg.optionalDependencies ?? {});
    for (const name of Object.keys(pkg.dependencies ?? {})) {
      visit(dir, name, optional.includes(name));
    }
    for (const name of optional) visit(dir, name, true);
  }

  function visit(from, name, optional) {
    const dir = resolvePackageDir(from, name);
    if (dir === null) {
      if (optional) return;
      throw new Error(`Cannot find ${name} from ${from}. Run pnpm install.`);
    }
    if (visited.has(dir)) return;
    visited.add(dir);
    const pkg = readManifest(dir);
    shipped.add(`${pkg.name}@${pkg.version}`);
    visitDependencies(dir, pkg);
  }

  visitDependencies(projectDir, manifest);
  for (const name of bundledDev) visit(projectDir, name, false);
  return shipped;
}

// `pnpm audit --json` lists each vulnerable version once, with a single
// representative path taken from whichever workspace project reaches it first
// (for example "apps__demo>next>@swc/helpers>tslib" even when packages/core
// ships the same tslib). So a finding is gated when its package version ships
// with a published package, whatever path pnpm happened to print.
export function collectFindings(report, shipped) {
  if (
    !report ||
    typeof report !== "object" ||
    report.error ||
    !report.advisories ||
    typeof report.advisories !== "object"
  ) {
    throw new Error(
      `Unexpected pnpm audit output: ${JSON.stringify(report).slice(0, 500)}`
    );
  }

  const findings = [];
  for (const advisory of Object.values(report.advisories)) {
    for (const finding of advisory.findings ?? []) {
      for (const path of finding.paths ?? []) {
        findings.push({
          path,
          module: advisory.module_name,
          version: finding.version,
          severity: advisory.severity,
          id: advisory.github_advisory_id ?? String(advisory.id),
          title: advisory.title,
          gated: shipped.has(`${advisory.module_name}@${finding.version}`),
        });
      }
    }
  }
  return findings;
}

const severityRank = (severity) => {
  const rank = SEVERITY_ORDER.indexOf(severity);
  return rank === -1 ? SEVERITY_ORDER.length : rank;
};

export function sortFindings(findings) {
  return [...findings].sort(
    (a, b) =>
      severityRank(a.severity) - severityRank(b.severity) ||
      a.module.localeCompare(b.module) ||
      a.id.localeCompare(b.id) ||
      a.path.localeCompare(b.path)
  );
}
