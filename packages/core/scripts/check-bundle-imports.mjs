// Checks that the main and RSC entries of the built package cannot reach
// happy-dom or @tiptap/html. Those two are only for the richtext-migrate entry
// (server-side conversion of legacy HTML), and must never ship to public pages.
//
// Usage: node packages/core/scripts/check-bundle-imports.mjs (after pnpm build)
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const ENTRIES = ["index.mjs", "rsc.mjs", "index.js", "rsc.js"];
export const FORBIDDEN = ["happy-dom", "@tiptap/html"];

// from "./x.mjs", import("./x.mjs"), import "./x.mjs", require("./x.js")
const RELATIVE_IMPORT =
  /(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+|\brequire\s*\(\s*)(["'])(\.{1,2}\/[^"']+\.[cm]?js)\1/g;

/** Every file reachable from `entry` through relative imports, relative to `distDir`. */
export function collectFiles(distDir, entry) {
  const seen = new Set();
  const queue = [resolve(distDir, entry)];

  while (queue.length > 0) {
    const file = queue.pop();

    if (seen.has(file)) continue;

    seen.add(file);

    for (const match of readFileSync(file, "utf8").matchAll(RELATIVE_IMPORT)) {
      queue.push(resolve(dirname(file), match[2]));
    }
  }

  return [...seen].map((file) => relative(distDir, file));
}

/** Lists each reachable file that mentions a forbidden package. */
export function findForbidden(
  distDir,
  entries = ENTRIES,
  forbidden = FORBIDDEN
) {
  const problems = [];

  for (const entry of entries) {
    for (const file of collectFiles(distDir, entry).sort()) {
      const source = readFileSync(join(distDir, file), "utf8");

      for (const name of forbidden) {
        if (source.includes(name)) problems.push({ entry, file, name });
      }
    }
  }

  return problems;
}

const isMain =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  const distDir = resolve(dirname(fileURLToPath(import.meta.url)), "../dist");
  const missing = ENTRIES.filter((entry) => !existsSync(join(distDir, entry)));

  if (missing.length > 0) {
    console.error(
      `check:bundle: ${missing.join(
        ", "
      )} not found in ${distDir}. Run pnpm build first.`
    );
    process.exit(1);
  }

  const problems = findForbidden(distDir);

  if (problems.length > 0) {
    for (const { entry, file, name } of problems) {
      console.error(`${entry} reaches ${file}, which mentions ${name}`);
    }

    console.error(
      `check:bundle FAILED: ${FORBIDDEN.join(
        " and "
      )} must only be used by the richtext-migrate entry.`
    );
    process.exit(1);
  }

  const fileCount = new Set(
    ENTRIES.flatMap((entry) => collectFiles(distDir, entry))
  ).size;

  console.log(
    `check:bundle passed: ${fileCount} files reachable from ${ENTRIES.join(
      ", "
    )} do not mention ${FORBIDDEN.join(" or ")}.`
  );
}
