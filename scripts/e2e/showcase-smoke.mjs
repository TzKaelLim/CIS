// Showcase smoke test (spec §13.1): starting from an empty page, drags each of
// the 8 blocks into the editor, fills the required fields, types a paragraph
// in the richtext field editor, publishes, and checks that the publish API
// returned no notices and that the server-rendered /activity HTML contains
// the blocks.
//
// Needs the showcase running on http://127.0.0.1:3010 (pnpm dev:showcase, or
// pnpm --filter @tzuchi/tceditor-showcase build, then … start). Set
// SHOWCASE_URL to test another address.
//
// Publishing replaces the showcase's published page. The script backs up
// <data dir>/activity.json first and puts it back at the end (or deletes the
// file again when there was none), also when it is stopped with Ctrl-C or a
// signal. The data dir is SHOWCASE_DATA_DIR resolved against apps/showcase, or
// apps/showcase/.data: run the script with the same SHOWCASE_DATA_DIR as the
// server. Before publishing, the script checks that the server serves that
// file (or the preset, when there is none) and stops otherwise.
//
// Exits with 1 on any failure.
import {
  existsSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { constants } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { dragAndDrop } from "./utils/drag-and-drop.mjs";
import { getBox } from "./utils/get-box.mjs";
import { pause } from "./utils/pause.mjs";
import { setup } from "./utils/setup.mjs";

const BASE = process.env.SHOWCASE_URL ?? "http://127.0.0.1:3010";
const SHOWCASE_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../apps/showcase"
);
const DATA_FILE = join(
  process.env.SHOWCASE_DATA_DIR
    ? resolve(SHOWCASE_DIR, process.env.SHOWCASE_DATA_DIR)
    : join(SHOWCASE_DIR, ".data"),
  "activity.json"
);
// What the server serves while nothing is published (lib/activity-store.ts).
const PRESET_FILE = join(SHOWCASE_DIR, "content/activity.preset.json");
const TIMEOUT = 15_000;

// The published page before the test, read once: restore() writes it back,
// and run() compares against it.
const backup = existsSync(DATA_FILE) ? readFileSync(DATA_FILE) : null;

// The header button's text: core's dictionary key "header-publish".
const PUBLISH_LABEL = "Publish";

const ROOT_ZONE = '[data-testid="dropzone:root:default-zone"]';
const BUTTON_HREF = "/activity/smoke-register";
const IMAGE_ALT = "冒煙測試圖片";
const PARAGRAPH_TEXT = "冒煙測試段落";

// The Paragraph's richtext field in the right sidebar: a Tiptap editor, so
// the published body is what Tiptap's getJSON() returns (Review Focus #1).
const RICHTEXT_FIELD = '.ProseMirror[contenteditable="true"]';

// The image picker (packages/blocks/src/image/editor.tsx) shows every asset
// as a button with its thumbnail, above a text input for the alt text.
const IMAGE_PICKER_DEMO_1 = 'button:has(img[src="/demo-assets/demo-1.svg"])';

// Blocks without drop zones first. Every block after the first is dropped at
// the top edge of the page's drop zone, so none lands inside a drop zone of
// a block already on the page.
const BLOCKS = [
  "Heading",
  "Paragraph",
  "Button",
  "TagList",
  "Image",
  "Card",
  "Columns",
  "Section",
];

// The defaults of the blocks (packages/blocks/src/*/spec.ts), the values this
// script types, and the classes of the blocks without text
// (packages/blocks/src/*/view.tsx), as they must appear in the public HTML.
const EXPECTED_HTML = [
  "<title>未命名頁面</title>",
  "標題文字",
  PARAGRAPH_TEXT,
  "立即報名",
  `href="${BUTTON_HREF}"`,
  "卡片標題",
  "志工",
  "環保",
  " tcb-section",
  "tcb-columns tcb-columns--2",
  'src="/demo-assets/demo-1.svg"',
  `alt="${IMAGE_ALT}"`,
];

class SmokeError extends Error {}

const check = (condition, message) => {
  if (!condition) throw new SmokeError(message);
};

async function waitFor(description, probe) {
  const start = Date.now();

  for (;;) {
    const value = await probe();

    if (value) return value;
    if (Date.now() - start > TIMEOUT) {
      throw new SmokeError(`Timed out waiting for ${description}`);
    }

    await pause(200);
  }
}

/** Reads the preview iframe's document (the canvas). */
const inFrame = (page, read) => page.evaluate(read).catch(() => null);

/** Number of blocks on the canvas. */
const countBlocks = (page) =>
  inFrame(
    page,
    () =>
      document
        .querySelector("#preview-frame")
        ?.contentDocument?.querySelectorAll("[data-puck-component]").length ?? 0
  );

/** Collects the block types of a page, including blocks inside slots. */
function blockTypes(value, found = []) {
  if (Array.isArray(value)) {
    for (const item of value) blockTypes(item, found);
  } else if (typeof value === "object" && value !== null) {
    if (typeof value.type === "string" && typeof value.props === "object") {
      found.push(value.type);
    }

    for (const item of Object.values(value)) blockTypes(item, found);
  }

  return found;
}

/**
 * The fields of the selected block. Puck renders them twice, in the right
 * sidebar and in a hidden mobile panel, so pick the visible copy.
 */
const visible = (page, selector) =>
  waitFor(`a visible ${selector}`, async () => {
    for (const handle of await page.$$(selector)) {
      if (await handle.isVisible()) return handle;
    }

    return null;
  });

/** The text input closest to `element`: the image picker's alt text box. */
const nearestTextInput = async (element) =>
  (
    await element.evaluateHandle((start) => {
      for (let node = start.parentElement; node; node = node.parentElement) {
        const input = node.querySelector('input[type="text"]');

        if (input) return input;
      }

      return null;
    })
  ).asElement();

async function typeText(input, text) {
  await input.click({ count: 3 });
  await input.type(text);
  // Puck applies field changes asynchronously.
  await pause(500);
}

async function run() {
  let current;

  try {
    current = await fetch(`${BASE}/api/activity`);
  } catch {
    throw new SmokeError(
      `The showcase is not reachable at ${BASE}. Start it first (pnpm dev:showcase).`
    );
  }

  check(current.ok, `GET ${BASE}/api/activity returned ${current.status}`);

  const before = backup === null ? "" : backup.toString("utf8");

  // Only DATA_FILE is restored, so publish only when the server reads the same
  // data dir: it must serve DATA_FILE, or the preset while there is none.
  // Otherwise publishing would replace a page this script cannot put back.
  const expectedFile = backup === null ? PRESET_FILE : DATA_FILE;
  const expected = JSON.parse(
    backup === null ? readFileSync(PRESET_FILE, "utf8") : before
  );

  check(
    JSON.stringify(await current.json()) === JSON.stringify(expected),
    `${BASE}/api/activity does not serve ${expectedFile}, so the server uses another data dir; nothing was published. Start the server with the same SHOWCASE_DATA_DIR as this script`
  );

  // Open a blank page first, so that page errors thrown while the editor
  // loads, hydrates and mounts are collected too.
  const { browser, page } = await setup("about:blank");
  const pageErrors = [];

  page.on("pageerror", (error) => pageErrors.push(error.message));

  try {
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`${BASE}/activity/edit?blank=1`);
    await waitFor("the editor canvas", () => getBox(page, ROOT_ZONE));
    check((await countBlocks(page)) === 0, "?blank=1 did not start empty");

    const theme = await inFrame(page, () =>
      document
        .querySelector("#preview-frame")
        ?.contentDocument?.documentElement.getAttribute("data-theme")
    );

    check(theme === "tzuchi", `the canvas has data-theme=${theme}`);

    for (const [index, type] of BLOCKS.entries()) {
      const source = `[data-testid="drawer-item:${type}"]`;

      await waitFor(`the ${type} drawer item`, () => getBox(page, source));
      await dragAndDrop(
        page,
        source,
        ROOT_ZONE,
        index === 0 ? undefined : "top"
      );
      await waitFor(`the ${type} block on the canvas`, async () =>
        (await countBlocks(page)) >= index + 1 ? true : null
      );
      console.log(` ├ dropped ${type}`);

      // A new block is selected, so its fields are in the right sidebar.
      if (type === "Paragraph") {
        await typeText(await visible(page, RICHTEXT_FIELD), PARAGRAPH_TEXT);
      }

      if (type === "Button") {
        await typeText(await visible(page, 'input[name="href"]'), BUTTON_HREF);
      }

      if (type === "Image") {
        const asset = await visible(page, IMAGE_PICKER_DEMO_1);

        await asset.click();
        await pause(500);

        const alt = await nearestTextInput(asset);

        check(alt !== null, "the image picker has no alt text input");
        await typeText(alt, IMAGE_ALT);
      }
    }

    check(
      (await countBlocks(page)) === BLOCKS.length,
      `expected ${
        BLOCKS.length
      } blocks on the canvas, found ${await countBlocks(page)}`
    );

    // Awaited together, so a click that fails first does not leave the
    // response promise to reject unhandled.
    const [response] = await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url() === `${BASE}/api/activity` && r.request().method() === "POST",
        { timeout: TIMEOUT }
      ),
      page.locator(`::-p-text(${PUBLISH_LABEL})`).click(),
    ]);

    check(
      response.status() === 200,
      `publish returned ${response.status()}: ${await response.text()}`
    );

    // The validator had nothing to clean in what the editor sent.
    const { notices } = await response.json();

    check(
      Array.isArray(notices) && notices.length === 0,
      `publish returned notices: ${JSON.stringify(notices)}`
    );
    console.log(" ├ published (POST /api/activity 200, no notices)");
    await page.waitForSelector(
      '[data-testid="publish-check"][data-status="published"]',
      { visible: true, timeout: TIMEOUT }
    );
    console.log(" ├ 發布檢查: 沒有錯誤");

    const after = existsSync(DATA_FILE) ? readFileSync(DATA_FILE, "utf8") : "";

    check(
      after !== before && after.includes(BUTTON_HREF),
      `${DATA_FILE} did not receive the page; start the server with the same SHOWCASE_DATA_DIR as this script`
    );

    const stored = await (await fetch(`${BASE}/api/activity`)).json();
    const storedTypes = [...new Set(blockTypes(stored.content))].sort();

    check(
      JSON.stringify(storedTypes) === JSON.stringify([...BLOCKS].sort()),
      `published block types: ${storedTypes.join(", ")}`
    );

    const html = await (await fetch(`${BASE}/activity`)).text();
    const missing = EXPECTED_HTML.filter((text) => !html.includes(text));

    check(missing.length === 0, `/activity HTML lacks: ${missing.join(" | ")}`);
    console.log(" ├ /activity shows the 8 blocks");
    check(pageErrors.length === 0, `page errors: ${pageErrors.join(" | ")}`);
  } finally {
    await browser.close();
  }
}

/** Puts the published page back the way it was before the test. */
function restore() {
  if (backup === null) {
    rmSync(DATA_FILE, { force: true });
    return;
  }

  const temporary = `${DATA_FILE}.smoke-restore`;

  writeFileSync(temporary, backup);
  renameSync(temporary, DATA_FILE);
}

// Ctrl-C or a signal skips the finally below, so restore here too. Puppeteer
// closes Chrome on process exit. A signal that arrives after the publish
// request is sent but before the server has written the file is not covered:
// restore() runs first and the server's write lands after it (a window of a
// few milliseconds).
for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) {
  process.once(signal, () => {
    restore();
    process.exit(128 + constants.signals[signal]);
  });
}

try {
  await run();
  console.log("✅ Showcase smoke test passed.");
} catch (error) {
  console.error(`❌ Showcase smoke test failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  restore();
}
