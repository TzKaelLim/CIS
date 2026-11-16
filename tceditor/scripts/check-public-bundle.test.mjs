import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

import {
  MARKERS as REAL_MARKERS,
  checkPublicBundle,
  listRouteChunks,
} from "./check-public-bundle.mjs";

const SCRIPT = fileURLToPath(
  new URL("./check-public-bundle.mjs", import.meta.url)
);
const MARKERS = [{ name: "the editor", value: "EDITOR_ONLY" }];

const roots = [];
after(() => {
  for (const root of roots) rmSync(root, { recursive: true, force: true });
});

const write = (root, file, text) => {
  mkdirSync(dirname(join(root, file)), { recursive: true });
  writeFileSync(join(root, file), text);
};

const route = (
  root,
  entryKey,
  { main, clientChunks, css, plainCss = false }
) => {
  write(
    root,
    `server/app/${entryKey}/build-manifest.json`,
    JSON.stringify({
      rootMainFiles: main,
      polyfillFiles: ["static/chunks/polyfill.js"],
    })
  );
  // Same shape as Next 16's page_client-reference-manifest.js.
  write(
    root,
    `server/app/${entryKey}_client-reference-manifest.js`,
    "globalThis.__RSC_MANIFEST = globalThis.__RSC_MANIFEST || {};\n" +
      `globalThis.__RSC_MANIFEST[${JSON.stringify(entryKey)}] = ` +
      JSON.stringify({
        clientModules: {
          "[project]/app/x.tsx": {
            id: 1,
            name: "*",
            chunks: clientChunks.map((c) => `/_next/${c}`),
            async: false,
          },
        },
        entryJSFiles: { [`[project]/app/${entryKey}`]: clientChunks },
        entryCSSFiles: {
          [`[project]/app/${entryKey}`]: plainCss
            ? css
            : css.map((path) => ({ path, inlined: false })),
        },
      }) +
      ";\n"
  );
};

/**
 * A fake `.next` directory with both routes. The editor page loads
 * editor.js, which loads lazy.js and lazy.css on demand; `publicExtra` adds
 * text to the public page's client chunk, and `plainCss` lists the public
 * page's stylesheets as plain paths.
 */
function fakeBuild({
  publicExtra = "",
  lazy = "EDITOR_ONLY",
  plainCss = false,
} = {}) {
  const root = mkdtempSync(join(tmpdir(), "check-public-bundle-"));
  roots.push(root);

  write(
    root,
    "app-path-routes-manifest.json",
    JSON.stringify({
      "/(editor)/activity/edit/page": "/activity/edit",
      "/(public)/activity/page": "/activity",
      "/api/activity/route": "/api/activity",
    })
  );
  write(root, "static/chunks/main.js", 'load("static/chunks/runtime.js")');
  write(root, "static/chunks/runtime.js", "runtime");
  write(root, "static/chunks/polyfill.js", "polyfill");
  write(root, "static/chunks/public.js", `public ${publicExtra}`);
  write(
    root,
    "static/chunks/editor.js",
    'e=>t.l("static/chunks/lazy.js"),t.l("static/chunks/lazy.css")'
  );
  write(root, "static/chunks/lazy.js", lazy);
  write(root, "static/chunks/public.css", ".public{color:red}");
  write(root, "static/chunks/editor.css", ".editor{color:red}");
  write(root, "static/chunks/lazy.css", ".lazy{color:red}");
  route(root, "/(public)/activity/page", {
    main: ["static/chunks/main.js"],
    clientChunks: ["static/chunks/public.js"],
    css: ["static/chunks/public.css"],
    plainCss,
  });
  route(root, "/(editor)/activity/edit/page", {
    main: ["static/chunks/main.js"],
    clientChunks: ["static/chunks/editor.js"],
    css: ["static/chunks/editor.css"],
  });

  return root;
}

test("listRouteChunks follows the manifests and chunk references", () => {
  const root = fakeBuild();

  assert.deepEqual(listRouteChunks(root, "/activity"), {
    entryKey: "/(public)/activity/page",
    chunks: [
      "static/chunks/main.js",
      "static/chunks/polyfill.js",
      "static/chunks/public.js",
      "static/chunks/runtime.js",
    ],
    polyfills: ["static/chunks/polyfill.js"],
    css: ["static/chunks/public.css"],
  });

  const control = listRouteChunks(root, "/activity/edit");

  assert.deepEqual(control.chunks, [
    "static/chunks/editor.js",
    "static/chunks/lazy.js",
    "static/chunks/main.js",
    "static/chunks/polyfill.js",
    "static/chunks/runtime.js",
  ]);
  assert.deepEqual(control.css, [
    "static/chunks/editor.css",
    "static/chunks/lazy.css",
  ]);
});

test("listRouteChunks accepts stylesheets listed as plain paths", () => {
  assert.deepEqual(
    listRouteChunks(fakeBuild({ plainCss: true }), "/activity").css,
    ["static/chunks/public.css"]
  );
});

test("listRouteChunks fails clearly when the route has no page", () => {
  const root = fakeBuild();

  write(
    root,
    "app-path-routes-manifest.json",
    JSON.stringify({ "/(editor)/activity/edit/page": "/activity/edit" })
  );
  assert.throws(
    () => checkPublicBundle(root, MARKERS),
    /app-path-routes-manifest\.json has no page for \/activity\./
  );
});

test("measures the public route's JS without the polyfills, and its CSS", () => {
  const root = fakeBuild();
  const gzipped = (...files) =>
    files.reduce(
      (sum, file) =>
        sum + gzipSync(readFileSync(join(root, file)), { level: 9 }).length,
      0
    );

  // main.js 32 + public.js 7 + runtime.js 7 bytes; public.css 18 bytes.
  assert.deepEqual(checkPublicBundle(root, MARKERS).sizes, {
    js: {
      files: 3,
      bytes: 46,
      gzipped: gzipped(
        "static/chunks/main.js",
        "static/chunks/public.js",
        "static/chunks/runtime.js"
      ),
    },
    css: {
      files: 1,
      bytes: 18,
      gzipped: gzipped("static/chunks/public.css"),
    },
  });
});

test("passes when only the editor route contains the markers", () => {
  assert.deepEqual(checkPublicBundle(fakeBuild(), MARKERS).problems, []);
});

test("fails when a marker reaches the public route", () => {
  const { problems } = checkPublicBundle(
    fakeBuild({ publicExtra: 'x=>t.l("static/chunks/lazy.js")' }),
    MARKERS
  );

  assert.deepEqual(problems, [
    '/activity ships the editor: "EDITOR_ONLY" is in static/chunks/lazy.js',
  ]);
});

test("fails when the control route lacks a marker", () => {
  const { problems } = checkPublicBundle(fakeBuild({ lazy: "" }), MARKERS);

  assert.equal(problems.length, 1);
  assert.match(problems[0], /is in no \/activity\/edit chunk/);
});

test("the CLI prints the public route's sizes before the marker report", () => {
  const root = fakeBuild({
    lazy: REAL_MARKERS.map(({ value }) => value).join(" "),
  });
  const { status, stdout } = spawnSync(process.execPath, [SCRIPT, root], {
    encoding: "utf8",
  });
  const { js, css } = checkPublicBundle(root).sizes;
  const lines = stdout.trimEnd().split("\n");

  assert.equal(status, 0);
  assert.deepEqual(lines.slice(0, 2), [
    `check:public-bundle: /activity loads 3 JS files (${js.bytes} bytes, ${js.gzipped} bytes gzipped; nomodule polyfills not counted)`,
    `check:public-bundle: /activity loads 1 CSS file (${css.bytes} bytes, ${css.gzipped} bytes gzipped)`,
  ]);
  assert.equal(lines.length, 6);
  assert.equal(
    lines[5],
    "check:public-bundle passed: /activity ships no editor code."
  );
});

test("the CLI exits 1 and names the chunks when a marker reaches /activity", () => {
  const root = fakeBuild({
    publicExtra: 'x=>t.l("static/chunks/lazy.js")',
    lazy: REAL_MARKERS.map(({ value }) => value).join(" "),
  });
  const { status, stdout, stderr } = spawnSync(
    process.execPath,
    [SCRIPT, root],
    { encoding: "utf8" }
  );

  assert.equal(status, 1);
  // The sizes and the marker report are still printed, but no "passed".
  assert.equal(stdout.trimEnd().split("\n").length, 5);
  assert.doesNotMatch(stdout, /passed/);
  assert.deepEqual(stderr.trimEnd().split("\n"), [
    ...REAL_MARKERS.map(
      ({ name, value }) =>
        `/activity ships ${name}: "${value}" is in static/chunks/lazy.js`
    ),
    "check:public-bundle FAILED",
  ]);
});

test("the CLI fails clearly when the build output is missing", () => {
  const missing = join(tmpdir(), "check-public-bundle-missing", ".next");
  const { status, stderr } = spawnSync(process.execPath, [SCRIPT, missing], {
    encoding: "utf8",
  });

  assert.equal(status, 1);
  assert.match(
    stderr,
    /app-path-routes-manifest\.json not found\. Run pnpm build first\./
  );
});
