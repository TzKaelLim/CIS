// Checks what the entries of the built package can reach through relative
// imports:
// - the main, RSC and rules entries must not reach happy-dom or @tiptap/html.
//   Those two are only for the richtext-migrate entry (server-side conversion
//   of legacy HTML), and must never ship to public pages.
// - the rules entry, including its type declarations, must also stay free of
//   React, Tiptap and Node built-in modules (node:fs as well as fs), so
//   validators can bundle it for edge runtimes without React.
//
// Usage: node packages/core/scripts/check-bundle-imports.mjs (after pnpm build)
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { builtinModules } from "node:module";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const ENTRIES = [
  "index.mjs",
  "rsc.mjs",
  "index.js",
  "rsc.js",
  "rules.mjs",
  "rules.js",
];
export const FORBIDDEN = ["happy-dom", "@tiptap/html"];

export const RULES_ENTRIES = [
  "rules.mjs",
  "rules.js",
  "rules.d.ts",
  "rules.d.mts",
];
// esbuild ends every CommonJS file with the comment "// Annotate the CommonJS
// export names for ESM import in node:", so "node:" only counts where a module
// is imported or required
export const NODE_IMPORT = {
  name: "an import of node:*",
  pattern:
    /(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+|\brequire\s*\(\s*)["']node:/,
};
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// The Node built-ins without the node: prefix, such as "fs", "crypto" or
// "fs/promises" (builtinModules of the Node that runs the check). Bundlers
// for edge runtimes resolve them no better than node:fs
export const NODE_BUILTIN_IMPORT = {
  name: "an import of a Node built-in",
  pattern: new RegExp(
    `(?:\\bfrom\\s*|\\bimport\\s*\\(\\s*|\\bimport\\s+|\\brequire\\s*\\(\\s*)(["'])(?:${builtinModules
      .filter((name) => !name.startsWith("node:"))
      .map(escapeRegExp)
      .join("|")})\\1`
  ),
};
export const RULES_FORBIDDEN = [
  "react",
  "react-dom",
  "@tiptap/",
  NODE_IMPORT,
  NODE_BUILTIN_IMPORT,
];

const RULES_DESCRIPTION =
  "import react, react-dom, @tiptap/* or Node built-in modules (node:fs or fs)";

const CHECKS = [
  {
    entries: ENTRIES,
    forbidden: FORBIDDEN,
    reason: `${FORBIDDEN.join(
      " and "
    )} must only be used by the richtext-migrate entry.`,
  },
  {
    entries: RULES_ENTRIES,
    forbidden: RULES_FORBIDDEN,
    reason: `the rules entry must not ${RULES_DESCRIPTION}.`,
  },
];

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

/**
 * Lists each reachable file that mentions a forbidden name. A forbidden entry
 * is a substring, or `{ name, pattern }` to match a regular expression.
 */
export function findForbidden(
  distDir,
  entries = ENTRIES,
  forbidden = FORBIDDEN
) {
  const problems = [];

  for (const entry of entries) {
    for (const file of collectFiles(distDir, entry).sort()) {
      const source = readFileSync(join(distDir, file), "utf8");

      for (const item of forbidden) {
        const found =
          typeof item === "string"
            ? source.includes(item)
            : item.pattern.test(source);

        if (found) {
          problems.push({
            entry,
            file,
            name: typeof item === "string" ? item : item.name,
          });
        }
      }
    }
  }

  return problems;
}

// Node runs the real path of a symlinked script, so compare real paths;
// otherwise running it through a symlink would skip the check and exit 0
const isMain =
  process.argv[1] !== undefined &&
  realpathSync(process.argv[1]) ===
    realpathSync(fileURLToPath(import.meta.url));

if (isMain) {
  const distDir = resolve(dirname(fileURLToPath(import.meta.url)), "../dist");
  const allEntries = [...new Set([...ENTRIES, ...RULES_ENTRIES])];
  const missing = allEntries.filter(
    (entry) => !existsSync(join(distDir, entry))
  );

  if (missing.length > 0) {
    console.error(
      `check:bundle: ${missing.join(
        ", "
      )} not found in ${distDir}. Run pnpm build first.`
    );
    process.exit(1);
  }

  let failed = false;

  for (const { entries, forbidden, reason } of CHECKS) {
    const problems = findForbidden(distDir, entries, forbidden);

    for (const { entry, file, name } of problems) {
      console.error(`${entry} reaches ${file}, which mentions ${name}`);
    }

    if (problems.length > 0) {
      console.error(`check:bundle FAILED: ${reason}`);
      failed = true;
    }
  }

  if (failed) process.exit(1);

  // Count what the message below describes: the files ENTRIES reach
  const fileCount = new Set(
    ENTRIES.flatMap((entry) => collectFiles(distDir, entry))
  ).size;

  console.log(
    `check:bundle passed: ${fileCount} files reachable from ${ENTRIES.join(
      ", "
    )} do not mention ${FORBIDDEN.join(
      " or "
    )}, and the rules entry does not ${RULES_DESCRIPTION}.`
  );
}
