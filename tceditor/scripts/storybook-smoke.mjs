// Opens every entry of the built block Storybook in Chrome and fails when a
// story or docs page errors, a block or story is missing, the Tzu Chi theme
// is not applied, or a page requests anything from another origin. Needs a
// build first (pnpm build builds apps/storybook); it is part of pnpm verify.
//
//   pnpm storybook:smoke
//
// It serves apps/storybook/storybook-static itself on http://127.0.0.1:6008,
// so no Storybook has to be running. Run it with the real HOME: puppeteer
// looks for its browser in ~/.cache/puppeteer. The checks that need no
// browser are exported for scripts/storybook-smoke.test.mjs.
import { spawnSync } from "node:child_process";
import {
  createReadStream,
  existsSync,
  readFileSync,
  realpathSync,
  statSync,
} from "node:fs";
import http from "node:http";
import { dirname, extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const HOST = "127.0.0.1";
const PORT = 6008;
const BASE = `http://${HOST}:${PORT}`;
const EXPECTED_THEME = "tzuchi";
const SWITCHED_THEME = "tzuchi-dark";
const EXPECTED_LANG = "zh-Hant";
const WAIT_MS = 20000;

const CONTENT_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};

// Storybook channel events recorded on every page.
const EVENTS = [
  "storyPrepared",
  "storyRendered",
  "storyFinished",
  "storyErrored",
  "storyMissing",
  "storyThrewException",
  "playFunctionThrewException",
  "docsRendered",
];
const FAILURE_EVENTS = [
  "storyErrored",
  "storyMissing",
  "storyThrewException",
  "playFunctionThrewException",
];
const CHINESE = /[㐀-鿿豈-﫿]/;

function short(text) {
  return String(text).replace(/\s+/g, " ").trim().slice(0, 200);
}

/** "TagList" → "tag-list", the way the generated stories name their meta id. */
export function kebab(type) {
  return type.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

/** Compares index.json with the block catalog; returns the problems found. */
export function checkIndex(entries, catalog) {
  const problems = [];
  if (entries.length === 0) {
    problems.push(
      "index.json has no entries: check the stories glob in apps/storybook/.storybook/main.ts"
    );
  }
  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  const storyIds = entries
    .filter((entry) => entry.type === "story")
    .map((entry) => entry.id);
  let expectedStories = 0;
  for (const block of catalog.blocks) {
    const prefix = `blocks-${kebab(block.type)}`;
    const wanted = 1 + block.examples.length;
    expectedStories += wanted;
    const docs = byId.get(`${prefix}--docs`);
    if (docs?.type !== "docs") {
      problems.push(`${block.type}: no docs entry ${prefix}--docs`);
    } else if (docs.title !== `區塊/${block.label}`) {
      problems.push(
        `${block.type}: title is "${docs.title}", expected "區塊/${block.label}"`
      );
    }
    if (byId.get(`${prefix}--default`)?.type !== "story") {
      problems.push(`${block.type}: no story ${prefix}--default`);
    }
    const count = storyIds.filter((id) => id.startsWith(`${prefix}--`)).length;
    if (count < wanted) {
      problems.push(
        `${block.type}: ${count} stories, expected at least ${wanted} (default + ${block.examples.length} examples)`
      );
    }
  }
  if (storyIds.length < expectedStories) {
    problems.push(
      `${storyIds.length} stories in total, expected at least ${expectedStories}`
    );
  }
  return problems;
}

/**
 * Every string in the story's args that contains Chinese text, except image
 * alt texts: those are not shown while the image is missing or decorative.
 */
export function chineseTexts(value, found = []) {
  if (typeof value === "string") {
    const text = value.trim();
    if (CHINESE.test(text)) found.push(text);
  } else if (Array.isArray(value)) {
    for (const item of value) chineseTexts(item, found);
  } else if (value !== null && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      if (key !== "alt") chineseTexts(item, found);
    }
  }
  return found;
}

/**
 * Judges what readPage() found on one entry; returns the problems and a short
 * note for the table. `theme` is the theme the page was opened with and
 * `title` the entry's title from index.json.
 */
export function pageProblems(info, { viewMode, theme, title }) {
  const problems = [];
  let note = "";
  for (const name of FAILURE_EVENTS) {
    if (info.events.includes(name)) problems.push(`Storybook event ${name}`);
  }
  if (/\bsb-show-(errordisplay|nopreview)\b/.test(info.bodyClass)) {
    problems.push(
      `Storybook error screen: ${short(info.errorMessage) || info.bodyClass}`
    );
  }
  if (info.theme !== theme) {
    problems.push(`<html data-theme> is ${info.theme}, not ${theme}`);
  }
  if (info.lang !== EXPECTED_LANG) {
    problems.push(`<html lang> is "${info.lang}", not ${EXPECTED_LANG}`);
  }
  // The decorator sets data-theme itself, so also check that the theme's CSS
  // applies: --accent must be set, and differ from HeroUI's default theme.
  if (info.accent === "") {
    problems.push(
      "the theme stylesheet is not applied: --accent is empty on <html>"
    );
  } else if (info.accent === info.unthemedAccent) {
    problems.push(
      `data-theme="${theme}" does not change --accent (${info.accent}): no theme rule matches it`
    );
  }

  if (viewMode === "story") {
    const texts = chineseTexts(info.args);
    const shown = [info.rootText, ...info.rootAttributes].join("\n");
    const seen = texts.find((text) => shown.includes(text));
    if (info.args === null) {
      problems.push("no storyPrepared event, so the args are unknown");
    } else if (seen !== undefined) {
      note = `shows "${short(seen).slice(0, 24)}"`;
    } else if (texts.length > 0) {
      problems.push(
        `none of the texts in the args is shown: ${texts
          .slice(0, 3)
          .map((text) => `"${short(text).slice(0, 24)}"`)
          .join(", ")}`
      );
    } else if (info.rootElements === 0) {
      problems.push("#storybook-root is empty");
    } else {
      note = "rendered (no Chinese text in the args)";
    }
  } else {
    const heading = title.split("/").pop();
    if (info.docsTitle !== heading) {
      problems.push(`docs heading is "${info.docsTitle}", not "${heading}"`);
    }
    if (info.docsStories === 0) problems.push("docs page shows no stories");
    for (const text of info.docsErrors) {
      problems.push(`story error on the docs page: ${short(text)}`);
    }
    note = `"${info.docsTitle}", ${info.docsStories} stories`;
  }
  return { problems, note };
}

/**
 * A static file server for the Storybook build. It answers /favicon.ico with
 * 204 (iframe.html links no favicon, so Chrome asks for it) so that every
 * remaining 404 is a real problem, and refuses paths outside `root`.
 */
export function createStaticServer(root) {
  return http.createServer((req, res) => {
    const url = new URL(req.url ?? "/", BASE);
    if (url.pathname === "/favicon.ico") {
      res.writeHead(204).end();
      return;
    }
    let pathname;
    try {
      pathname = decodeURIComponent(url.pathname);
    } catch {
      res.writeHead(400).end();
      return;
    }
    if (pathname.endsWith("/")) pathname += "index.html";
    const file = normalize(join(root, pathname));
    if (!file.startsWith(root + sep)) {
      res.writeHead(403).end();
      return;
    }
    let stat;
    try {
      stat = statSync(file);
    } catch {
      res.writeHead(404).end();
      return;
    }
    if (!stat.isFile()) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, {
      "content-length": stat.size,
      "content-type":
        CONTENT_TYPES[extname(file)] ?? "application/octet-stream",
    });
    createReadStream(file).pipe(res);
  });
}

// The functions below run inside the page (page.evaluate).

function storySettled() {
  const done = ["storyFinished", "storyErrored", "storyMissing"];
  return (window.__smokeEvents ?? []).some((event) =>
    done.includes(event.name)
  );
}

function docsSettled() {
  const events = window.__smokeEvents ?? [];
  if (!events.some((event) => event.name === "docsRendered")) return false;
  const inline = document.querySelectorAll("#storybook-docs .sb-story").length;
  const finished = events.filter((event) => event.name === "storyFinished");
  return inline > 0 && finished.length >= inline;
}

function readPage() {
  const html = document.documentElement;
  const root = document.querySelector("#storybook-root");
  const docs = document.querySelector("#storybook-docs");
  const events = window.__smokeEvents ?? [];
  const attributes = ["alt", "title", "aria-label"];
  const accentOf = () =>
    getComputedStyle(html).getPropertyValue("--accent").trim();
  // --accent without any data-theme (HeroUI's default theme), read by
  // removing the attribute for a moment.
  const theme = html.getAttribute("data-theme");
  const accent = accentOf();
  html.removeAttribute("data-theme");
  const unthemedAccent = accentOf();
  if (theme !== null) html.setAttribute("data-theme", theme);
  return {
    events: events.map((event) => event.name),
    args: events.find((event) => event.name === "storyPrepared")?.args ?? null,
    bodyClass: document.body.className,
    errorMessage: document.querySelector("#error-message")?.textContent ?? "",
    theme,
    lang: html.lang,
    accent,
    unthemedAccent,
    rootText: root?.textContent ?? "",
    rootAttributes: root
      ? [...root.querySelectorAll("[alt], [title], [aria-label]")].flatMap(
          (element) =>
            attributes.map((name) => element.getAttribute(name) ?? "")
        )
      : [],
    rootElements: root?.childElementCount ?? 0,
    docsTitle: docs?.querySelector("h1")?.textContent?.trim() ?? null,
    docsStories: docs ? docs.querySelectorAll(".sb-story").length : 0,
    docsErrors: docs
      ? [...docs.querySelectorAll(".sb-story > pre")].map(
          (element) => element.textContent
        )
      : [],
  };
}

/** The lsof lines for a listener on the port, "" when free, null without lsof. */
function listenerOn(port) {
  const result = spawnSync("lsof", ["-nP", `-iTCP:${port}`, "-sTCP:LISTEN"], {
    encoding: "utf8",
  });
  if (result.error) return null;
  return result.status === 0 ? result.stdout.trim() : "";
}

function listen(server) {
  return new Promise((resolveListen, reject) => {
    server.once("error", reject);
    server.listen(PORT, HOST, () => {
      server.off("error", reject);
      resolveListen();
    });
  });
}

async function checkEntry(browser, entry, theme = EXPECTED_THEME) {
  const problems = [];
  const page = await browser.newPage();
  try {
    await page.setRequestInterception(true);
    page.on("request", (request) => {
      const url = request.url();
      if (
        url.startsWith(`${BASE}/`) ||
        url.startsWith("data:") ||
        url.startsWith("blob:")
      ) {
        request.continue();
      } else {
        problems.push(`request to another origin: ${short(url)}`);
        request.abort();
      }
    });
    page.on("pageerror", (error) =>
      problems.push(`page error: ${short(error.message)}`)
    );
    page.on("console", (message) => {
      if (message.type() === "error") {
        problems.push(`console error: ${short(message.text())}`);
      }
    });
    page.on("response", (response) => {
      if (response.status() >= 400) {
        problems.push(`HTTP ${response.status()}: ${short(response.url())}`);
      }
    });
    await page.evaluateOnNewDocument((names) => {
      window.__smokeEvents = [];
      const timer = setInterval(() => {
        const channel = window.__STORYBOOK_ADDONS_CHANNEL__;
        if (!channel) return;
        clearInterval(timer);
        for (const name of names) {
          channel.on(name, (payload) => {
            window.__smokeEvents.push({
              name,
              args: name === "storyPrepared" ? payload?.args ?? null : null,
            });
          });
        }
      }, 5);
    }, EVENTS);

    const viewMode = entry.type === "docs" ? "docs" : "story";
    const globals = theme === EXPECTED_THEME ? "" : `&globals=theme:${theme}`;
    const pageUrl = `${BASE}/iframe.html?id=${encodeURIComponent(
      entry.id
    )}&viewMode=${viewMode}${globals}`;
    let response;
    try {
      response = await page.goto(pageUrl, {
        waitUntil: "load",
        timeout: WAIT_MS,
      });
    } catch (error) {
      problems.push(`could not load ${pageUrl}: ${short(error.message)}`);
      return { problems, note: "", accent: "" };
    }
    if (!response || response.status() >= 400) {
      problems.push(
        `could not load ${pageUrl}: HTTP ${response?.status() ?? "no response"}`
      );
      return { problems, note: "", accent: "" };
    }
    const settled = await page
      .waitForFunction(viewMode === "docs" ? docsSettled : storySettled, {
        timeout: WAIT_MS,
      })
      .then(
        () => true,
        () => false
      );
    if (!settled) {
      problems.push(`not rendered within ${WAIT_MS / 1000} s`);
    }
    // Let trailing console errors arrive.
    await new Promise((resolveWait) => setTimeout(resolveWait, 300));
    const info = await page.evaluate(readPage);
    const judged = pageProblems(info, { viewMode, theme, title: entry.title });
    problems.push(...judged.problems);
    return { problems, note: judged.note, accent: info.accent };
  } finally {
    await page.close();
  }
}

function printTable(rows) {
  const width = Math.max(...rows.map((row) => row.id.length));
  console.log(`${"entry".padEnd(width)}  type     ms  result`);
  for (const row of rows) {
    const result = row.problems.length === 0 ? "ok  " : "FAIL";
    console.log(
      `${row.id.padEnd(width)}  ${row.type.padEnd(5)}  ${String(
        row.ms
      ).padStart(5)}  ${result}  ${row.note}`
    );
    for (const problem of row.problems) console.log(`    - ${problem}`);
  }
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

async function main() {
  const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const staticDir = join(repoRoot, "apps", "storybook", "storybook-static");
  const catalogFile = join(
    repoRoot,
    "packages",
    "blocks",
    "generated",
    "catalog.json"
  );

  if (!existsSync(join(staticDir, "index.json"))) {
    fail(
      "apps/storybook/storybook-static/index.json is missing. Run pnpm build first."
    );
  }
  // A failed build still writes the manager and index.json, but no preview.
  if (!existsSync(join(staticDir, "iframe.html"))) {
    fail(
      "apps/storybook/storybook-static/iframe.html is missing: the last Storybook build failed. Run pnpm build again."
    );
  }
  if (!existsSync(catalogFile)) {
    fail(
      "packages/blocks/generated/catalog.json is missing. Run pnpm gen:blocks first."
    );
  }
  const catalog = JSON.parse(readFileSync(catalogFile, "utf8"));

  const listener = listenerOn(PORT);
  if (listener) {
    fail(
      `Port ${PORT} is already in use:\n${listener}\nStop that process first.`
    );
  }
  const server = createStaticServer(staticDir);
  try {
    await listen(server);
  } catch (error) {
    fail(`Cannot listen on ${BASE}: ${error.message}`);
  }

  const { default: puppeteer } = await import("puppeteer");
  let browser;
  let failures = 0;
  try {
    const index = await (await fetch(`${BASE}/index.json`)).json();
    const entries = Object.values(index.entries ?? {}).sort((a, b) =>
      a.id < b.id ? -1 : a.id > b.id ? 1 : 0
    );
    const indexProblems = checkIndex(entries, catalog);
    for (const problem of indexProblems) console.log(`index.json: ${problem}`);
    failures += indexProblems.length;

    browser = await puppeteer.launch({ headless: true });
    const rows = [];
    for (const entry of entries) {
      const started = Date.now();
      const result = await checkEntry(browser, entry);
      rows.push({
        id: entry.id,
        type: entry.type,
        ms: Date.now() - started,
        ...result,
      });
      if (result.problems.length > 0) failures += 1;
    }
    if (rows.length > 0) printTable(rows);

    // The toolbar's dark theme: open the first story again with it.
    const first = rows.find((row) => row.type === "story");
    if (first) {
      const entry = entries.find((item) => item.id === first.id);
      const dark = await checkEntry(browser, entry, SWITCHED_THEME);
      if (dark.accent !== "" && dark.accent === first.accent) {
        dark.problems.push(
          `--accent is ${dark.accent} in both ${EXPECTED_THEME} and ${SWITCHED_THEME}`
        );
      }
      console.log(
        `theme switch (${first.id}, ${SWITCHED_THEME}): ${
          dark.problems.length === 0 ? "ok" : "FAIL"
        }`
      );
      for (const problem of dark.problems) console.log(`    - ${problem}`);
      if (dark.problems.length > 0) failures += 1;
    }

    const stories = rows.filter((row) => row.type === "story").length;
    const failed = rows.filter((row) => row.problems.length > 0).length;
    console.log(
      `${catalog.blocks.length} blocks, ${
        rows.length
      } entries (${stories} stories, ${
        rows.length - stories
      } docs pages): ${failed} failed, ${
        indexProblems.length
      } index.json problems`
    );
  } finally {
    await browser?.close();
    server.closeAllConnections();
    await new Promise((resolveClose) => server.close(resolveClose));
  }

  if (failures > 0) fail("storybook:smoke FAILED");
  console.log("storybook:smoke OK");
}

// Node runs the real path of a symlinked script, so compare real paths.
const isMain =
  process.argv[1] !== undefined &&
  realpathSync(process.argv[1]) ===
    realpathSync(fileURLToPath(import.meta.url));

if (isMain) await main();
