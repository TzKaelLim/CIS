// Builds the uikit options snapshot, packages/blocks/generated/uikit-options.json:
// for every tailwind-variants (tv) function that the vendored @heroui/styles
// exports, the options of each variant and the default options. The block
// tests compare the style() whitelists of the block specs against it.
//
// Usage: node scripts/uikit/scan-options.mjs (pnpm sync:uikit runs it last)
import { build } from "esbuild";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const UIKIT_OPTIONS_PATH =
  "packages/blocks/generated/uikit-options.json";

const STYLES_DIR = "vendor/uikit/heroui/styles";
const SOURCE_JSON = "vendor/uikit/SOURCE.json";
const SUFFIX = "Variants";

const byKey = ([a], [b]) => (a < b ? -1 : a > b ? 1 : 0);

/**
 * Bundles vendor/uikit/heroui/styles/src/index.ts with esbuild, imports it and
 * reads the `variants` and `defaultVariants` that tailwind-variants attaches to
 * every tv function. Keys are the export names without "Variants" (the first
 * argument of style() in the block specs); keys and option lists are sorted,
 * and every option is a string, the way tailwind-variants keys boolean
 * variants ("false", "true").
 */
export async function scanUikitOptions(repoRoot) {
  const source = JSON.parse(readFileSync(join(repoRoot, SOURCE_JSON), "utf8"));
  const stylesPackage = JSON.parse(
    readFileSync(join(repoRoot, STYLES_DIR, "package.json"), "utf8")
  );
  const outDir = mkdtempSync(join(tmpdir(), "tceditor-uikit-options-"));

  try {
    const outfile = join(outDir, "styles.mjs");

    await build({
      entryPoints: [join(repoRoot, STYLES_DIR, "src/index.ts")],
      bundle: true,
      format: "esm",
      platform: "node",
      outfile,
      logLevel: "silent",
      // Don't look for tsconfig.json files: the vendored source needs none
      tsconfigRaw: {},
    });

    const styles = await import(pathToFileURL(outfile).href);
    const components = [];

    for (const [name, fn] of Object.entries(styles)) {
      // tv functions carry their configuration; tv and cn themselves do not
      if (typeof fn !== "function" || !("variants" in fn)) continue;

      if (!name.endsWith(SUFFIX) || name === SUFFIX) {
        throw new Error(
          `${name} is a tv() export of @heroui/styles whose name does not end in "${SUFFIX}"`
        );
      }

      const variants = Object.entries(fn.variants ?? {})
        .map(([key, options]) => [key, Object.keys(options).sort()])
        .sort(byKey);
      const defaultVariants = Object.entries(fn.defaultVariants ?? {})
        .filter(([, value]) => value !== undefined && value !== null)
        .map(([key, value]) => [key, String(value)])
        .sort(byKey);

      components.push([
        name.slice(0, -SUFFIX.length),
        {
          export: name,
          variants: Object.fromEntries(variants),
          defaultVariants: Object.fromEntries(defaultVariants),
        },
      ]);
    }

    return {
      source: {
        repository: source.repository,
        commit: source.commit,
        package: stylesPackage.name,
      },
      components: Object.fromEntries(components.sort(byKey)),
    };
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
}

/** Writes the snapshot with 2-space indentation and a trailing newline. */
export function writeUikitOptions(repoRoot, options) {
  const file = join(repoRoot, UIKIT_OPTIONS_PATH);

  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(options, null, 2)}\n`);

  return file;
}

// Node runs the real path of a symlinked script, so compare real paths
const isMain =
  process.argv[1] !== undefined &&
  realpathSync(process.argv[1]) ===
    realpathSync(fileURLToPath(import.meta.url));

if (isMain) {
  const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");
  const options = await scanUikitOptions(repoRoot);

  writeUikitOptions(repoRoot, options);
  console.log(
    `${UIKIT_OPTIONS_PATH}: ${
      Object.keys(options.components).length
    } tv functions of ${options.source.package} at ${options.source.commit}`
  );
}
