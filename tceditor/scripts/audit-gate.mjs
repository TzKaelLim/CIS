// Supply-chain gate. Runs `pnpm audit --json`, prints every advisory and exits
// 1 only when a vulnerable package version ships with a published package
// (GATED_IMPORTERS, including the devDependencies their build bundles). Exits 2
// when the dependency graph or the audit cannot be read, so a registry outage
// never passes silently.
import { spawnSync } from "node:child_process";
import { join } from "node:path";

import {
  BUNDLED_DEV_DEPENDENCIES,
  collectFindings,
  GATED_IMPORTERS,
  shippedPackages,
  sortFindings,
} from "./audit-gate-lib.mjs";

const rootDir = join(import.meta.dirname, "..");
const gatedList = GATED_IMPORTERS.join(", ");

const shipped = new Set();
try {
  for (const importer of GATED_IMPORTERS) {
    const bundledDev = BUNDLED_DEV_DEPENDENCIES[importer] ?? [];
    for (const id of shippedPackages(join(rootDir, importer), bundledDev)) {
      shipped.add(id);
    }
  }
} catch (error) {
  console.error(`audit:gate could not list what ships with ${gatedList}.`);
  console.error(String(error?.message ?? error));
  process.exit(2);
}

const audit = spawnSync("pnpm", ["audit", "--json"], {
  cwd: rootDir,
  encoding: "utf8",
  maxBuffer: 64 * 1024 * 1024,
});

let report;
let findings;
try {
  if (audit.error) throw audit.error;
  report = JSON.parse(audit.stdout);
  findings = collectFindings(report, shipped);
} catch (error) {
  console.error("audit:gate could not read `pnpm audit --json` output.");
  console.error(String(error?.message ?? error));
  if (audit.stderr) console.error(audit.stderr.trim());
  process.exit(2);
}

const blocking = sortFindings(findings.filter((f) => f.gated));
const reported = sortFindings(findings.filter((f) => !f.gated));

console.log(
  `pnpm audit: ${Object.keys(report.advisories).length} advisories, ` +
    `${findings.length} finding path(s). ` +
    `${shipped.size} package versions ship with ${gatedList}.`
);

const print = (heading, list) => {
  console.log(`\n${heading}: ${list.length} finding(s)`);
  for (const f of list) {
    console.log(
      `  ${f.severity.padEnd(8)} ${f.module}@${f.version}  ${f.id}  ${f.title}`
    );
    console.log(`           via ${f.path}`);
  }
};

print("GATED (ships with a published package)", blocking);
print("Reported only (demo and dev tooling)", reported);

console.log("");
if (blocking.length > 0) {
  console.error(
    `audit:gate FAILED: ${blocking.length} finding(s) ship with ${gatedList}.`
  );
  process.exit(1);
}
console.log(
  `audit:gate passed: no advisories affect ${gatedList} ` +
    `(${reported.length} finding path(s) elsewhere are listed above).`
);
