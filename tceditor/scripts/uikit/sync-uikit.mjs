// Copies the uikit's HeroUI styles and design tokens at a pinned commit into
// vendor/uikit (spec §12), builds the tokens, records the snapshot in
// vendor/uikit/SOURCE.json and regenerates packages/blocks/generated/uikit-options.json.
// The uikit repo is read only through `git archive`, so its working tree and
// any uncommitted change in it are never touched or copied.
//
// Usage: pnpm sync:uikit -- --commit <sha> [--dir ../tzuchi-uikit] [--branch spike/heroui-v3]
// (--dir is resolved from the repo root)
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import { scanUikitOptions, writeUikitOptions } from "./scan-options.mjs";

export const UIKIT_REPOSITORY = "tzuchi/tzuchi-uikit";
export const ARCHIVE_PATHS = [
  "heroui/styles",
  "heroui/LICENSE",
  "heroui/NOTICE.md",
  "packages/tokens",
];

// Archived files left out of the snapshot, each rule with its reason.
// SOURCE.json lists every file that a rule removed, because Apache-2.0 §4 asks
// for the changes made to the HeroUI source to be stated. Every other file is
// copied unchanged.
export const REMOVE_RULES = [
  // Vite's esbuild transform reads the nearest tsconfig.json of every .ts file
  // and fails on this one: it extends @heroui/standard, which is not vendored.
  // tsc and Next.js never read it.
  /^heroui\/styles\/tsconfig\.json$/,
  // Upstream release, lint and dist build tooling. tceditor uses the source
  // through the package's exports and never runs them.
  /^heroui\/styles\/(CHANGELOG\.md|clean-package\.config\.json|eslint\.config\.mjs|rollup\.config\.mjs|scripts\/.*)$/,
  // Working notes of the Tzu Chi theme audit (Markdown), not part of the theme
  /^heroui\/styles\/themes\/tzuchi\/gap-audit\//,
  // Generates variables.css from the built tokens inside the uikit repo
  // (`pnpm heroui:theme` there); the generated variables.css is vendored
  /^heroui\/styles\/themes\/tzuchi\/generate\.mjs$/,
  // Stories and tests (there are none in these paths at 2b5a6781)
  /(^|\/)(__tests__|tests?)\/|\.(stories|test|spec)\.([cm]?[jt]sx?|mdx)$/,
];

// Files that must survive the removal rules
const REQUIRED_FILES = [
  "heroui/LICENSE",
  "heroui/NOTICE.md",
  "heroui/styles/package.json",
  "heroui/styles/index.css",
  "heroui/styles/src/index.ts",
  "packages/tokens/package.json",
  "packages/tokens/build.mjs",
  "packages/tokens/check.mjs",
];

// vendor/uikit files that describe the snapshot rather than belong to it
const SNAPSHOT_META = ["README.md", "SOURCE.json"];

// The top-level folders of the snapshot ("heroui", "packages"), which the sync
// deletes and copies again from the archive
const SNAPSHOT_DIRS = [
  ...new Set(ARCHIVE_PATHS.map((path) => path.split("/")[0])),
];

// Written by macOS Finder and ignored by git, so never part of the snapshot
const OS_FILES = [".DS_Store"];

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");

/** Relative paths ("/"-separated) of every file under `dir`, sorted. */
export function listFiles(dir, prefix = "") {
  const files = [];

  for (const entry of readdirSync(join(dir, prefix), { withFileTypes: true })) {
    if (OS_FILES.includes(entry.name)) continue;

    const path = prefix === "" ? entry.name : `${prefix}/${entry.name}`;

    if (entry.isDirectory()) {
      files.push(...listFiles(dir, path));
    } else if (entry.isFile()) {
      files.push(path);
    } else {
      throw new Error(`${join(dir, path)} is neither a file nor a directory`);
    }
  }

  return files.sort();
}

/** { <path>: <sha256> } for every file of the snapshot, sorted by path. */
export function hashVendorFiles(vendorDir) {
  return Object.fromEntries(
    listFiles(vendorDir)
      .filter((path) => !SNAPSHOT_META.includes(path))
      .map((path) => [
        path,
        createHash("sha256")
          .update(readFileSync(join(vendorDir, path)))
          .digest("hex"),
      ])
  );
}

/**
 * Files under `vendorDir` that are neither SNAPSHOT_META nor inside the
 * SNAPSHOT_DIRS, which the sync rebuilds from scratch. The sync refuses to run
 * while there are any, because it would record them in SOURCE.json as part of
 * the snapshot.
 */
export function unexpectedVendorFiles(vendorDir) {
  if (!existsSync(vendorDir)) return [];

  return listFiles(vendorDir).filter(
    (path) =>
      !SNAPSHOT_META.includes(path) &&
      !SNAPSHOT_DIRS.some((dir) => path.startsWith(`${dir}/`))
  );
}

/** Removes the directories under `dir` that hold no file. */
function removeEmptyDirs(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;

    const child = join(dir, entry.name);

    removeEmptyDirs(child);

    if (readdirSync(child).length === 0) rmdirSync(child);
  }
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: "utf8", ...options });

  if (result.error) throw result.error;

  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(" ")} exited with ${result.status}\n${
        result.stderr ?? ""
      }`
    );
  }

  return (result.stdout ?? "").trim();
}

const git = (uikitDir, args) => run("git", ["-C", uikitDir, ...args]);

/** Throws when .gitignore hides a snapshot file: the hash test would pass
 * here and fail in every fresh clone, which never gets the file. */
function assertCommittable(paths) {
  const result = spawnSync("git", ["-C", repoRoot, "check-ignore", "--stdin"], {
    input: paths.map((path) => `vendor/uikit/${path}`).join("\n"),
    encoding: "utf8",
  });

  if (result.status === 0) {
    throw new Error(
      `.gitignore hides ${result.stdout.trim().split("\n").join(", ")}`
    );
  }

  if (result.status !== 1) {
    throw new Error(`git check-ignore failed: ${result.stderr}`);
  }
}

function parseCli(argv) {
  // pnpm passes the "--" of `pnpm sync:uikit -- --commit …` through
  const { values } = parseArgs({
    args: argv.filter((arg) => arg !== "--"),
    options: {
      dir: { type: "string", default: "../tzuchi-uikit" },
      commit: { type: "string" },
      branch: { type: "string", default: "spike/heroui-v3" },
    },
  });

  if (values.commit === undefined) {
    throw new Error(
      "Usage: pnpm sync:uikit -- --commit <sha> [--dir ../tzuchi-uikit] [--branch spike/heroui-v3]"
    );
  }

  return values;
}

export async function syncUikit({ dir, commit, branch }) {
  const uikitDir = resolve(repoRoot, dir);
  const vendorDir = join(repoRoot, "vendor/uikit");
  const unexpected = unexpectedVendorFiles(vendorDir);

  if (unexpected.length > 0) {
    throw new Error(
      `vendor/uikit holds files that are not part of the snapshot: ${unexpected.join(
        ", "
      )}. Move or delete them first; only ${SNAPSHOT_META.join(
        " and "
      )} are kept next to ${SNAPSHOT_DIRS.map((name) => `${name}/`).join(
        " and "
      )}.`
    );
  }

  const sha = git(uikitDir, ["rev-parse", "--verify", `${commit}^{commit}`]);
  const onBranch = spawnSync("git", [
    "-C",
    uikitDir,
    "merge-base",
    "--is-ancestor",
    sha,
    branch,
  ]);

  if (onBranch.status !== 0) {
    throw new Error(
      `${sha} is not on the branch ${branch} of ${uikitDir} (pass --branch if it is on another branch)`
    );
  }

  const commitDate = git(uikitDir, ["log", "-1", "--format=%cI", sha]);

  // Staged inside the repo, so the tokens build finds the root style-dictionary,
  // and finished there before the previous snapshot is touched
  mkdirSync(join(repoRoot, "vendor"), { recursive: true });
  const work = mkdtempSync(join(repoRoot, "vendor", ".sync-uikit-"));
  const removed = [];

  try {
    // 1. Read the pinned commit only, never the working tree
    const tarball = join(work, "uikit.tar");
    const tree = join(work, "tree");

    git(
      uikitDir,
      ["archive", "--format=tar", "-o", tarball, sha, "--"].concat(
        ARCHIVE_PATHS
      )
    );
    mkdirSync(tree);
    run("tar", ["-x", "-f", tarball, "-C", tree]);

    // 2. Drop the files that the snapshot leaves out
    for (const path of listFiles(tree)) {
      if (REMOVE_RULES.some((rule) => rule.test(path))) {
        rmSync(join(tree, path));
        removed.push(path);
      }
    }

    removeEmptyDirs(tree);

    const missing = REQUIRED_FILES.filter(
      (path) => !existsSync(join(tree, path))
    );

    if (missing.length > 0) {
      throw new Error(`${sha} has no ${missing.join(", ")}`);
    }

    // 3. Build the tokens with the root style-dictionary. The configs resolve
    //    their source and output paths from the working directory.
    for (const script of ["build.mjs", "check.mjs"]) {
      run(process.execPath, [script], {
        cwd: join(tree, "packages/tokens"),
        stdio: "inherit",
      });
    }

    // 4. Refuse files that git would not commit
    assertCommittable(listFiles(tree));

    // 5. Replace the previous snapshot: heroui/ and packages/ are rebuilt
    //    from the tree, README.md is kept and SOURCE.json is rewritten below
    rmSync(join(vendorDir, "heroui"), { recursive: true, force: true });
    rmSync(join(vendorDir, "packages"), { recursive: true, force: true });
    mkdirSync(vendorDir, { recursive: true });
    cpSync(join(tree, "heroui"), join(vendorDir, "heroui"), {
      recursive: true,
    });
    cpSync(join(tree, "packages"), join(vendorDir, "packages"), {
      recursive: true,
    });
  } finally {
    rmSync(work, { recursive: true, force: true });
  }

  // 6. Record the snapshot: same input, same bytes (no time of the sync)
  const files = hashVendorFiles(vendorDir);

  // vendor/uikit now holds only the tree checked in step 4 (any other file
  // was refused at the start), so this checks the copy that SOURCE.json lists
  assertCommittable(Object.keys(files));

  const source = {
    repository: UIKIT_REPOSITORY,
    branch,
    commit: sha,
    commitDate,
    removed: removed.sort(),
    files,
  };

  writeFileSync(
    join(vendorDir, "SOURCE.json"),
    `${JSON.stringify(source, null, 2)}\n`
  );

  // 7. Regenerate the uikit options snapshot from the new source
  const options = await scanUikitOptions(repoRoot);

  writeUikitOptions(repoRoot, options);

  return { source, options };
}

// Node runs the real path of a symlinked script, so compare real paths
const isMain =
  process.argv[1] !== undefined &&
  realpathSync(process.argv[1]) ===
    realpathSync(fileURLToPath(import.meta.url));

if (isMain) {
  try {
    const { source, options } = await syncUikit(
      parseCli(process.argv.slice(2))
    );

    console.log(
      `sync:uikit: vendor/uikit is ${source.repository}@${source.commit} (${
        source.commitDate
      }): ${Object.keys(source.files).length} files, ${
        source.removed.length
      } removed; uikit-options.json lists ${
        Object.keys(options.components).length
      } tv functions`
    );
  } catch (error) {
    console.error(`sync:uikit failed: ${error?.message ?? error}`);
    process.exit(1);
  }
}
