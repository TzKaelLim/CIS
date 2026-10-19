import assert from "node:assert/strict";
import { test } from "node:test";

import { NODE_IMPORT } from "../packages/core/scripts/check-bundle-imports.mjs";
import {
  MODULE_SYNTAX,
  checkRawCodes,
  compareCases,
  compareWithSource,
  findSourceProblems,
  gzipSize,
  metafileImports,
  rawInputs,
  summarize,
} from "./check-edge.mjs";

const labels = (source) =>
  findSourceProblems(source).map((problem) => problem.split(" at ")[0]);

test("findSourceProblems accepts a self-contained minified bundle", () => {
  assert.deepEqual(
    findSourceProblems(
      'var e={node:1,path:[]},t=x.import,n="imports",i="node:fs";function r(o){return o.require}export{r as validatePage};'
    ),
    []
  );
});

test("findSourceProblems finds every form of module syntax", () => {
  assert.deepEqual(labels('import"./a.js";'), ["static import"]);
  assert.deepEqual(labels('import{z as a}from"zod";'), ["static import"]);
  assert.deepEqual(labels('import * as z from "zod";'), ["static import"]);
  assert.deepEqual(labels('let a=await import("./b.js");'), ["dynamic import"]);
  assert.deepEqual(labels('export*from"./a.js";'), ["export from"]);
  assert.deepEqual(labels('export{a as b}from"./a.js";'), ["export from"]);
  assert.deepEqual(labels('var a=require("zod");'), ["require"]);
  // node: modules: the NODE_IMPORT pattern of check:bundle
  assert.equal(
    MODULE_SYNTAX.find(([label]) => label === "node: module")[1],
    NODE_IMPORT.pattern
  );
  assert.deepEqual(labels('import{readFileSync as r}from"node:fs";'), [
    "static import",
    "node: module",
  ]);
  assert.deepEqual(labels('let a=await import("node:fs");'), [
    "dynamic import",
    "node: module",
  ]);
  assert.deepEqual(labels('var a=require("node:fs");'), [
    "require",
    "node: module",
  ]);
  assert.deepEqual(labels('import "node:fs";'), [
    "static import",
    "node: module",
  ]);
  // Minified, with no space after import: still caught as a static import
  assert.deepEqual(labels('import"node:fs";'), ["static import"]);
});

test("findSourceProblems finds React and Tiptap", () => {
  assert.deepEqual(labels('var a="react-dom";'), ['"react"']);
  assert.deepEqual(labels('var a="@tiptap/core";'), ['"@tiptap"']);
});

test("metafileImports lists the imports left in each output", () => {
  assert.deepEqual(
    metafileImports({
      outputs: {
        "dist/a.mjs": {
          imports: [{ path: "zod", kind: "import-statement", external: true }],
        },
        "dist/b.mjs": { imports: [] },
      },
    }),
    ["dist/a.mjs imports zod (import-statement)"]
  );
});

test("gzipSize measures gzip -9", () => {
  assert.ok(gzipSize(Buffer.alloc(100_000)) < 1_000);
  assert.ok(gzipSize(Buffer.from("x")) > 1);
});

test("summarize keeps code and pathText, sorted by path", () => {
  assert.deepEqual(summarize({ ok: true, data: {}, notices: [] }), {
    ok: true,
  });
  assert.deepEqual(
    summarize({
      ok: false,
      errors: [
        { code: "unknown_prop", pathText: "content[1].props.x", message: "…" },
        { code: "invalid_value", pathText: "content[0].props.a", message: "…" },
      ],
    }),
    {
      ok: false,
      errors: [
        { code: "invalid_value", pathText: "content[0].props.a" },
        { code: "unknown_prop", pathText: "content[1].props.x" },
      ],
    }
  );
});

test("compareCases reports each function whose result differs", () => {
  const rejectsEverything = {
    validatePage: () => ({
      ok: false,
      errors: [{ code: "invalid_shape", pathText: "content", message: "" }],
    }),
    validatePageJson: () => ({ ok: true, data: {}, notices: [] }),
  };
  const cases = [
    {
      name: "valid",
      input: { root: { props: {} }, content: [] },
      expect: { ok: true },
    },
    {
      name: "invalid",
      input: { content: 1 },
      expect: {
        ok: false,
        errors: [{ code: "invalid_shape", pathText: "content" }],
      },
    },
  ];

  assert.deepEqual(
    compareCases(rejectsEverything, cases).map(
      ({ name, fn }) => `${name} ${fn}`
    ),
    ["valid validatePage", "invalid validatePageJson"]
  );
});

test("compareWithSource reports results that differ beyond the codes", () => {
  const validator = (data) => ({
    validatePage: () => ({ ok: true, data, notices: [] }),
    validatePageJson: () => ({ ok: true, data, notices: [] }),
  });
  const source = validator({ root: { props: { title: "未命名頁面" } } });
  const bundle = validator({ root: { props: {} } });
  const cases = [
    {
      name: "valid",
      input: { root: { props: {} }, content: [] },
      expect: { ok: true },
    },
  ];
  const raws = [{ name: "raw", raw: "{}", code: null }];

  // The codes agree, so comparing with the expectations finds nothing
  assert.deepEqual(compareCases(bundle, cases), []);
  assert.deepEqual(
    compareWithSource(source, bundle, cases, raws).map(
      ({ name, fn }) => `${name} ${fn}`
    ),
    ["valid validatePage", "valid validatePageJson", "raw validatePageJson"]
  );
  assert.deepEqual(compareWithSource(source, source, cases, raws), []);
});

test("rawInputs builds bodies at the byte and block limits", () => {
  const limits = { maxBytes: 2_097_152, maxBlocks: 5000 };
  const raws = rawInputs(limits);
  const bytes = (raw) =>
    typeof raw === "string" ? new TextEncoder().encode(raw).length : raw.length;

  assert.deepEqual(
    raws.map(({ code }) => code),
    [
      "too_large",
      "too_large",
      null,
      "invalid_json",
      "invalid_json",
      "too_many_blocks",
    ]
  );
  // Over the limit in UTF-8 bytes, under it in characters (Review Focus #2)
  assert.ok(bytes(raws[0].raw) > limits.maxBytes);
  assert.ok(raws[0].raw.length < limits.maxBytes);
  assert.ok(raws[1].raw instanceof Uint8Array);
  assert.equal(bytes(raws[1].raw), bytes(raws[0].raw));
  assert.equal(bytes(raws[2].raw), limits.maxBytes);
  assert.equal(JSON.parse(raws[5].raw).content.length, limits.maxBlocks + 1);
});

test("checkRawCodes reports a result other than the expected code", () => {
  const validator = {
    validatePageJson: (raw) =>
      raw === "{"
        ? {
            ok: false,
            errors: [{ code: "invalid_json", pathText: "", message: "" }],
          }
        : { ok: true, data: {}, notices: [] },
  };

  assert.deepEqual(
    checkRawCodes(validator, [
      { name: "broken", raw: "{", code: "invalid_json" },
      { name: "fine", raw: "{}", code: null },
      { name: "huge", raw: "[]", code: "too_large" },
    ]),
    ['raw input "huge": expected too_large, got ok']
  );
});
