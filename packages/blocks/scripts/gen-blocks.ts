// Writes the files generated from the block specs: one story per block, the
// MCP catalog, the database page shell and a data contract snapshot per block
// version. Run from the repo root with `pnpm gen:blocks`; commit the result.
//
// generated.spec.ts and compat.spec.ts fail when these files are out of date.
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import {
  checkContracts,
  describeContractProblem,
} from "../src/generate/contracts";
import { findStoryFiles, readSnapshots } from "../src/generate/disk";
import { generateFiles } from "../src/generate/files";
import { GENERATED_HEADER } from "../src/generate/stories";
import { blockSpecs } from "../src/specs";

// process.argv[1] is this script's path under tsx in both module formats
const packageDir = resolve(dirname(process.argv[1]), "..");

const problems = checkContracts(
  blockSpecs,
  readSnapshots(join(packageDir, "generated/schemas"))
).filter((problem) => problem.kind !== "missing");

if (problems.length > 0) {
  console.error("gen:blocks: nothing written; fix the specs first:");
  for (const problem of problems) {
    console.error(`  ${describeContractProblem(problem)}`);
  }
  process.exit(1);
}

const files = generateFiles();
let written = 0;

for (const file of files) {
  const target = join(packageDir, file.path);
  const current = existsSync(target) ? readFileSync(target, "utf8") : null;

  // Unchanged files are left alone. An existing snapshot can only differ in
  // formatting here: checkContracts above stops on any change to a contract.
  if (current === file.contents) continue;

  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, file.contents);
  written++;
  console.log(`gen:blocks: wrote ${file.path}`);
}

const expected = new Set(files.map((file) => file.path));
let deleted = 0;

for (const path of findStoryFiles(packageDir)) {
  if (expected.has(path)) continue;

  const target = join(packageDir, path);

  if (readFileSync(target, "utf8").startsWith(GENERATED_HEADER)) {
    rmSync(target);
    deleted++;
    console.log(`gen:blocks: deleted ${path} (its block is gone)`);
  } else {
    console.warn(
      `gen:blocks: ${path} was not generated; stories are generated from the specs, so remove it`
    );
  }
}

console.log(
  `gen:blocks: ${files.length} files checked, ${written} written, ${deleted} deleted`
);
