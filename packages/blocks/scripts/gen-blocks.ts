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
import { generateFiles, planGeneration } from "../src/generate/files";
import { blockSpecs } from "../src/specs";

// process.argv[1] is this script's path under tsx in both module formats
const packageDir = resolve(dirname(process.argv[1]), "..");

const read = (path: string): string | null => {
  const target = join(packageDir, path);

  return existsSync(target) ? readFileSync(target, "utf8") : null;
};

// planGeneration (src/generate/files.ts, tested in files.spec.ts) decides
// everything; this script only carries it out.
const files = generateFiles(packageDir);
const plan = planGeneration({
  files,
  problems: checkContracts(
    blockSpecs,
    readSnapshots(join(packageDir, "generated/schemas"))
  ),
  read,
  storyFiles: findStoryFiles(packageDir),
});

if (!plan.ok) {
  console.error("gen:blocks: nothing written; fix the specs first:");
  for (const problem of plan.problems) {
    console.error(`  ${describeContractProblem(problem)}`);
  }
  process.exit(1);
}

for (const file of plan.write) {
  const target = join(packageDir, file.path);

  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, file.contents);
  console.log(`gen:blocks: wrote ${file.path}`);
}

for (const path of plan.keep) {
  console.warn(
    `gen:blocks: ${path} differs from a fresh snapshot in formatting only; snapshots never change once committed, so restore it from git`
  );
}

for (const path of plan.remove) {
  rmSync(join(packageDir, path));
  console.log(`gen:blocks: deleted ${path} (its block is gone)`);
}

for (const path of plan.foreign) {
  console.warn(
    `gen:blocks: ${path} was not generated; stories are generated from the specs, so remove it`
  );
}

console.log(
  `gen:blocks: ${files.length} files checked, ${plan.write.length} written, ${plan.remove.length} deleted`
);
