// Checks that the showcase's public page (/activity) ships none of the
// editor's browser code (spec §6.6). It lists the browser chunks of each
// route in the Turbopack `next build` output and searches them for strings
// that only the editor contains. /activity/edit is the control: every marker
// must be found there, or the scan itself is broken. It also prints the size
// of the JS and CSS that /activity loads, for the record (spec §16); the
// sizes are not checked.
//
// Usage: node scripts/check-public-bundle.mjs [<.next dir>] (after pnpm build)
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { gzipSync } from "node:zlib";

export const PUBLIC_ROUTE = "/activity";
export const CONTROL_ROUTE = "/activity/edit";

export const MARKERS = [
  // A dictionary key that only the editor header uses (core lib/dictionary.ts);
  // minifiers keep string literals.
  { name: "the editor", value: "header-toggle-leftsidebar" },
  // A class name of the blocks' image picker (packages/blocks/src/image/
  // editor.tsx), an editor-only client component; minifiers keep it as a
  // string. It needs neither the editor header nor zod.
  { name: "the image picker", value: "tcb-picker-option" },
  // The global config key of zod 4 (zod/v4/core/core.js). The editor config
  // reaches zod through the block specs; the public page must not.
  { name: "zod", value: "__zod_globalConfig" },
];

const CHUNK_REFERENCE = /static\/chunks\/[A-Za-z0-9_~.-]+\.(?:js|css)/g;

const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));

/**
 * The browser files of an App Router page in a Turbopack build: the
 * bootstrap and polyfill files, the page's client components, the
 * stylesheets of its layouts and page, and every file those load later
 * (async chunks are only referenced inside chunks). `chunks` are the
 * JavaScript files, `polyfills` the ones of them that only browsers without
 * ES modules load (`nomodule`), and `css` the stylesheets.
 */
export function listRouteChunks(nextDir, urlPath) {
  const routesFile = join(nextDir, "app-path-routes-manifest.json");

  if (!existsSync(routesFile)) {
    throw new Error(`${routesFile} not found. Run pnpm build first.`);
  }

  const routes = readJson(routesFile);
  const entryKey = Object.keys(routes).find(
    (key) => routes[key] === urlPath && key.endsWith("/page")
  );

  if (!entryKey) {
    throw new Error(`${routesFile} has no page for ${urlPath}.`);
  }

  const files = new Set();
  const buildManifest = readJson(
    join(nextDir, "server/app", entryKey, "build-manifest.json")
  );

  for (const file of [
    ...buildManifest.rootMainFiles,
    ...buildManifest.polyfillFiles,
  ]) {
    files.add(file);
  }

  // The client reference manifest is a script that assigns
  // globalThis.__RSC_MANIFEST[entryKey].
  const sandbox = { self: {} };
  sandbox.globalThis = sandbox.self;
  vm.runInNewContext(
    readFileSync(
      join(nextDir, "server/app", `${entryKey}_client-reference-manifest.js`),
      "utf8"
    ),
    sandbox
  );

  const manifest = sandbox.self.__RSC_MANIFEST?.[entryKey];

  if (!manifest) {
    throw new Error(`No client reference manifest for ${entryKey}.`);
  }

  for (const list of Object.values(manifest.entryJSFiles ?? {})) {
    for (const file of list) files.add(file);
  }

  for (const clientModule of Object.values(manifest.clientModules ?? {})) {
    for (const chunk of clientModule.chunks) {
      files.add(chunk.replace(/^\/_next\//, ""));
    }
  }

  // Next 16 lists { path, inlined } objects; plain paths are accepted too.
  for (const list of Object.values(manifest.entryCSSFiles ?? {})) {
    for (const entry of list) {
      files.add(typeof entry === "string" ? entry : entry.path);
    }
  }

  const queue = [...files];

  while (queue.length > 0) {
    const file = queue.pop();
    const path = join(nextDir, file);

    if (!file.endsWith(".js") || !existsSync(path)) continue;

    for (const [reference] of readFileSync(path, "utf8").matchAll(
      CHUNK_REFERENCE
    )) {
      if (!files.has(reference)) {
        files.add(reference);
        queue.push(reference);
      }
    }
  }

  const existing = [...files]
    .filter((file) => existsSync(join(nextDir, file)))
    .sort();
  const chunks = existing.filter((file) => file.endsWith(".js"));

  if (chunks.length === 0) {
    throw new Error(`No browser chunks found for ${urlPath} in ${nextDir}.`);
  }

  return {
    entryKey,
    chunks,
    polyfills: chunks.filter((file) =>
      buildManifest.polyfillFiles.includes(file)
    ),
    css: existing.filter((file) => file.endsWith(".css")),
  };
}

/** The number of files and their total size, raw and gzipped at level 9. */
export function measureFiles(nextDir, files) {
  let bytes = 0;
  let gzipped = 0;

  for (const file of files) {
    const content = readFileSync(join(nextDir, file));

    bytes += content.length;
    gzipped += gzipSync(content, { level: 9 }).length;
  }

  return { files: files.length, bytes, gzipped };
}

/** The chunks that contain `marker`. */
export function findMarker(nextDir, chunks, marker) {
  return chunks.filter((file) =>
    readFileSync(join(nextDir, file), "utf8").includes(marker)
  );
}

/**
 * Scans both routes; returns the public route's sizes, one report line per
 * marker and the problems. The sizes are what a browser with ES modules
 * downloads; they are recorded, never a problem.
 */
export function checkPublicBundle(nextDir, markers = MARKERS) {
  const publicRoute = listRouteChunks(nextDir, PUBLIC_ROUTE);
  const controlRoute = listRouteChunks(nextDir, CONTROL_ROUTE);
  const report = [];
  const problems = [];

  for (const { name, value } of markers) {
    const leaked = findMarker(nextDir, publicRoute.chunks, value);
    const control = findMarker(nextDir, controlRoute.chunks, value);

    report.push(
      `"${value}" (${name}): ${PUBLIC_ROUTE} ${leaked.length}/${publicRoute.chunks.length} chunks, ` +
        `${CONTROL_ROUTE} ${control.length}/${controlRoute.chunks.length} chunks`
    );

    if (leaked.length > 0) {
      problems.push(
        `${PUBLIC_ROUTE} ships ${name}: "${value}" is in ${leaked.join(", ")}`
      );
    }

    if (control.length === 0) {
      problems.push(
        `"${value}" is in no ${CONTROL_ROUTE} chunk, so the scan cannot see ${name}; update MARKERS`
      );
    }
  }

  const sizes = {
    js: measureFiles(
      nextDir,
      publicRoute.chunks.filter((file) => !publicRoute.polyfills.includes(file))
    ),
    css: measureFiles(nextDir, publicRoute.css),
  };

  return { sizes, report, problems };
}

const describeSize = (kind, { files, bytes, gzipped }, note = "") =>
  `check:public-bundle: ${PUBLIC_ROUTE} loads ${files} ${kind} file${
    files === 1 ? "" : "s"
  } (${bytes} bytes, ${gzipped} bytes gzipped${note})`;

// Node runs the real path of a symlinked script, so compare real paths.
const isMain =
  process.argv[1] !== undefined &&
  realpathSync(process.argv[1]) ===
    realpathSync(fileURLToPath(import.meta.url));

if (isMain) {
  const nextDir = resolve(
    process.argv[2] ??
      join(dirname(fileURLToPath(import.meta.url)), "../apps/showcase/.next")
  );

  try {
    const { sizes, report, problems } = checkPublicBundle(nextDir);

    console.log(
      describeSize("JS", sizes.js, "; nomodule polyfills not counted")
    );
    console.log(describeSize("CSS", sizes.css));
    for (const line of report) console.log(line);

    if (problems.length > 0) {
      for (const problem of problems) console.error(problem);
      console.error("check:public-bundle FAILED");
      process.exit(1);
    }

    console.log(
      `check:public-bundle passed: ${PUBLIC_ROUTE} ships no editor code.`
    );
  } catch (error) {
    console.error(`check:public-bundle FAILED: ${error.message}`);
    process.exit(1);
  }
}
