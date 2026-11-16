// Bundles the page validator (the 8 block specs, packages/spec's validator,
// zod and @tzuchi/tceditor/rules) into dist/validator.edge.mjs: one ES module
// with no imports, for the Edge Function in S3 (spec §6.4). Needs core's dist
// (turbo builds core first). `pnpm check:edge` checks the result.
//
// Usage: node scripts/build-edge.mjs (the package's "build" script)
import { build } from "esbuild";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const packageDir = join(dirname(fileURLToPath(import.meta.url)), "..");

const result = await build({
  absWorkingDir: packageDir,
  entryPoints: ["src/validator.ts"],
  outfile: "dist/validator.edge.mjs",
  bundle: true,
  format: "esm",
  platform: "neutral",
  target: "es2022",
  minify: true,
  // "neutral" sets no main fields and no platform conditions. Every package
  // in the bundle has an exports map, which esbuild reads with the "import"
  // and "default" conditions: zod resolves to its ESM index.js and
  // @tzuchi/tceditor/rules to core's dist/rules.mjs (see the metafile). The
  // empty list keeps esbuild from adding the "module" condition.
  mainFields: ["module", "main"],
  conditions: [],
  metafile: true,
  logLevel: "warning",
});

// Kept next to the bundle: `pnpm check:edge` reads its imports, and
// https://esbuild.github.io/analyze/ shows what takes up the size
writeFileSync(
  join(packageDir, "dist/validator.edge.meta.json"),
  `${JSON.stringify(result.metafile, null, 2)}\n`
);
