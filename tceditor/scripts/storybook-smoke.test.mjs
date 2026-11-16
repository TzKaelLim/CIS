import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import http from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import {
  checkIndex,
  chineseTexts,
  createStaticServer,
  kebab,
  pageProblems,
} from "./storybook-smoke.mjs";

const catalog = {
  blocks: [
    { type: "Button", label: "按鈕", examples: [{}, {}] },
    { type: "TagList", label: "標籤列", examples: [{}] },
  ],
};

const docs = (id, title) => ({ id: `${id}--docs`, type: "docs", title });
const story = (id) => ({ id, type: "story" });

const completeIndex = [
  docs("blocks-button", "區塊/按鈕"),
  story("blocks-button--default"),
  story("blocks-button--example-1"),
  story("blocks-button--example-2"),
  docs("blocks-tag-list", "區塊/標籤列"),
  story("blocks-tag-list--default"),
  story("blocks-tag-list--example-1"),
];

// What readPage() returns for a story that rendered in the Tzu Chi theme.
const renderedStory = {
  events: ["storyPrepared", "storyRendered", "storyFinished"],
  args: { label: "立即報名", href: "/join" },
  bodyClass: "sb-show-main sb-main-padded",
  errorMessage: "",
  theme: "tzuchi",
  lang: "zh-Hant",
  accent: "#1b2d58",
  unthemedAccent: "oklch(0.6204 0.195 253.83)",
  rootText: "立即報名",
  rootAttributes: [],
  rootElements: 1,
  docsTitle: null,
  docsStories: 0,
  docsErrors: [],
};
const storyOptions = {
  viewMode: "story",
  theme: "tzuchi",
  title: "區塊/按鈕",
};

test("kebab turns a block type into its story id segment", () => {
  assert.equal(kebab("Button"), "button");
  assert.equal(kebab("TagList"), "tag-list");
});

test("checkIndex accepts every block with its docs page, default and examples", () => {
  assert.deepEqual(checkIndex(completeIndex, catalog), []);
});

test("checkIndex reports a missing block, example story and wrong title", () => {
  const entries = completeIndex
    .filter((entry) => !entry.id.startsWith("blocks-tag-list"))
    .filter((entry) => entry.id !== "blocks-button--example-2")
    .map((entry) =>
      entry.type === "docs" ? { ...entry, title: "區塊/Button" } : entry
    );

  assert.deepEqual(checkIndex(entries, catalog), [
    'Button: title is "區塊/Button", expected "區塊/按鈕"',
    "Button: 2 stories, expected at least 3 (default + 2 examples)",
    "TagList: no docs entry blocks-tag-list--docs",
    "TagList: no story blocks-tag-list--default",
    "TagList: 0 stories, expected at least 2 (default + 1 examples)",
    "2 stories in total, expected at least 5",
  ]);
});

test("checkIndex reports an empty index (a wrong stories glob)", () => {
  const problems = checkIndex([], catalog);
  assert.equal(
    problems[0],
    "index.json has no entries: check the stories glob in apps/storybook/.storybook/main.ts"
  );
  assert.equal(problems.length, 8);
});

test("chineseTexts collects Chinese strings except image alt texts", () => {
  assert.deepEqual(
    chineseTexts({
      title: " 慈濟 ",
      items: [{ label: "環保" }, { label: "English only" }],
      image: { src: "/demo-assets/demo-1.svg", alt: "志工" },
      count: 3,
      empty: null,
    }),
    ["慈濟", "環保"]
  );
});

test("pageProblems accepts a story that shows its text in the theme", () => {
  assert.deepEqual(pageProblems(renderedStory, storyOptions), {
    problems: [],
    note: 'shows "立即報名"',
  });
});

test("pageProblems reports error events and the Storybook error screen", () => {
  const { problems } = pageProblems(
    {
      ...renderedStory,
      events: ["storyPrepared", "storyThrewException", "storyErrored"],
      bodyClass: "sb-show-errordisplay",
      errorMessage: "boom",
      rootText: "",
      rootElements: 0,
    },
    storyOptions
  );

  assert.deepEqual(problems, [
    "Storybook event storyErrored",
    "Storybook event storyThrewException",
    "Storybook error screen: boom",
    'none of the texts in the args is shown: "立即報名"',
  ]);
});

test("pageProblems reports a theme whose stylesheet is missing or does not match", () => {
  assert.deepEqual(
    pageProblems(
      { ...renderedStory, accent: "", unthemedAccent: "" },
      storyOptions
    ).problems,
    ["the theme stylesheet is not applied: --accent is empty on <html>"]
  );
  assert.deepEqual(
    pageProblems(
      { ...renderedStory, accent: renderedStory.unthemedAccent },
      storyOptions
    ).problems,
    [
      'data-theme="tzuchi" does not change --accent (oklch(0.6204 0.195 253.83)): no theme rule matches it',
    ]
  );
  assert.deepEqual(
    pageProblems(
      { ...renderedStory, theme: "tzuchi-dark", lang: "" },
      storyOptions
    ).problems,
    [
      "<html data-theme> is tzuchi-dark, not tzuchi",
      '<html lang> is "", not zh-Hant',
    ]
  );
});

test("pageProblems needs a rendered root when the args have no Chinese text", () => {
  const noText = { ...renderedStory, args: { columns: 2 }, rootText: "" };

  assert.deepEqual(pageProblems({ ...noText, rootElements: 0 }, storyOptions), {
    problems: ["#storybook-root is empty"],
    note: "",
  });
  assert.deepEqual(pageProblems(noText, storyOptions), {
    problems: [],
    note: "rendered (no Chinese text in the args)",
  });
});

test("pageProblems checks the docs heading, its stories and inline errors", () => {
  const docsPage = {
    ...renderedStory,
    events: ["docsRendered", "storyFinished"],
    args: null,
    rootText: "",
    docsTitle: "按鈕",
    docsStories: 4,
  };
  const options = { viewMode: "docs", theme: "tzuchi", title: "區塊/按鈕" };

  assert.deepEqual(pageProblems(docsPage, options), {
    problems: [],
    note: '"按鈕", 4 stories',
  });
  assert.deepEqual(
    pageProblems(
      {
        ...docsPage,
        docsTitle: "Button",
        docsStories: 0,
        docsErrors: ["Error: boom\n  at render"],
      },
      options
    ).problems,
    [
      'docs heading is "Button", not "按鈕"',
      "docs page shows no stories",
      "story error on the docs page: Error: boom at render",
    ]
  );
});

test("createStaticServer serves the build and refuses paths outside it", async () => {
  const dir = mkdtempSync(join(tmpdir(), "storybook-smoke-"));
  const root = join(dir, "static");
  mkdirSync(join(root, "demo-assets"), { recursive: true });
  writeFileSync(join(root, "index.html"), "<p>index</p>");
  writeFileSync(join(root, "demo-assets", "demo-1.svg"), "<svg/>");
  writeFileSync(join(dir, "secret.txt"), "secret");
  const server = createStaticServer(root);
  await new Promise((done) => server.listen(0, "127.0.0.1", done));
  const { port } = server.address();
  const get = (path) =>
    new Promise((done, reject) => {
      http
        .get({ host: "127.0.0.1", port, path }, (res) => {
          let body = "";
          res.setEncoding("utf8");
          res.on("data", (chunk) => (body += chunk));
          res.on("end", () =>
            done({
              status: res.statusCode,
              type: res.headers["content-type"],
              body,
            })
          );
        })
        .on("error", reject);
    });

  try {
    assert.deepEqual(await get("/"), {
      status: 200,
      type: "text/html; charset=utf-8",
      body: "<p>index</p>",
    });
    assert.equal((await get("/demo-assets/demo-1.svg")).type, "image/svg+xml");
    assert.equal((await get("/favicon.ico")).status, 204);
    assert.equal((await get("/missing.svg")).status, 404);
    assert.equal((await get("/demo-assets")).status, 404);
    assert.equal((await get("/..%2fsecret.txt")).status, 403);
    assert.equal((await get("/%E0%A4%A")).status, 400);
  } finally {
    server.closeAllConnections();
    await new Promise((done) => server.close(done));
    rmSync(dir, { recursive: true, force: true });
  }
});
