import { testBlocks, testRoot } from "../../__fixtures__/test-specs";
import { buildPageShellSchema } from "../../convert/page-shell";
import { toJsonSchema } from "../../json-schema";
import { exampleToPageData } from "../../page-data";
import {
  createDualLayerOracle,
  type DualLayerCase,
} from "../__helpers__/dual-layer";
import {
  box,
  chain,
  editorPage,
  kitchenSink,
  leaf,
  page,
  pair,
  validator,
} from "../__helpers__/pages";

// The rules live in __helpers__/dual-layer.ts, shared with the blocks'
// dual-layer.spec.ts; this file only brings the test specs and the corpus.
const { ajvAccepts, lostCheckCodes, zodOnlyAccepts, zodOnlyRejects } =
  createDualLayerOracle({
    blocks: testBlocks.map((spec) => ({
      type: spec.type,
      props: toJsonSchema(spec),
    })),
    root: toJsonSchema(testRoot),
    shell: buildPageShellSchema({ blocks: testBlocks }),
    specs: testBlocks,
  });

type AnyRecord = Record<string, unknown>;

const sink = (props: AnyRecord) => page([kitchenSink("k", props)]);

const corpus: DualLayerCase[] = [
  ...testBlocks.flatMap((spec) =>
    spec.examples.map((example, index) => ({
      name: `example ${spec.type} ${example.name}`,
      input: exampleToPageData(spec, index),
    }))
  ),
  { name: "editor output", input: editorPage() },
  {
    name: "missing props and slots",
    input: page([
      { type: "Leaf", props: { id: "l" } },
      { type: "Box", props: { id: "b" } },
      { type: "Pair", props: { id: "p", columns: [{}, {}] } },
      kitchenSink("k"),
    ]),
  },
  {
    name: "rich text to clean",
    input: sink({
      body: {
        type: "doc",
        content: [
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "標" }],
          },
        ],
      },
    }),
  },
  { name: "32 levels", input: page([chain(32)]) },
  { name: "40 Chinese characters", input: sink({ title: "慈".repeat(40) }) },
  // zod 4.6.5 and Ajv both count code points: 20 emoji are 40 UTF-16 units
  { name: "20 emoji", input: page([leaf("l", "😀".repeat(20))]) },
  { name: "unknown prop", input: sink({ foo: 1 }) },
  { name: "title too long", input: sink({ title: "慈".repeat(41) }) },
  { name: "21 emoji", input: page([leaf("l", "😀".repeat(21))]) },
  { name: "unknown option", input: sink({ tone: "loud" }) },
  { name: "number too big", input: sink({ count: 11 }) },
  { name: "rich text as a string", input: sink({ body: "<p>x</p>" }) },
  {
    name: "unknown type",
    input: page([{ type: "Button", props: { id: "a" } }]),
  },
  { name: "id root", input: page([leaf("root")]) },
  { name: "legacy zones", input: page([], { zones: { "b:content": [] } }) },
  {
    name: "defaults only",
    input: page([{ type: "KitchenSink", props: { id: "k" } }]),
  },
  {
    name: "bad assetId",
    input: sink({
      picture: { assetId: "bad id", alt: "x", decorative: false },
    }),
  },
  { name: "extra block key", input: page([{ ...leaf("a"), zones: {} }]) },
  { name: "javascript: link", input: sink({ href: "javascript:alert(1)" }) },
  {
    name: "missing alt",
    input: sink({ picture: { assetId: "a", alt: " ", decorative: false } }),
  },
  { name: "duplicate id", input: page([leaf("a"), leaf("a")]) },
  {
    name: "not allowed here",
    input: page([pair("p", [[pair("q", [[], []])], []])]),
  },
  { name: "33 levels", input: page([chain(33)]) },
  {
    name: "5,001 blocks",
    input: page(Array.from({ length: 5001 }, (_, i) => leaf(`l${i}`))),
  },
];

describe("dual-layer consistency (spec §13.1)", () => {
  it("never accepts with zod what Ajv rejects", () => {
    expect(zodOnlyAccepts(corpus, validator.validatePage)).toEqual([]);
  });

  it("only rejects what Ajv accepts for x-lost-checks and whole-page rules", () => {
    const { seen, unexpected } = zodOnlyRejects(corpus, validator.validatePage);

    expect(lostCheckCodes).toEqual(["alt_required", "unsafe_href"]);
    expect(unexpected).toEqual([]);
    expect(seen).toEqual([
      "alt_required",
      "duplicate_id",
      "not_allowed_here",
      "too_deep",
      "too_many_blocks",
      "unsafe_href",
    ]);
  });

  it("rejects with both layers everything else in the corpus", () => {
    const bothReject = corpus
      .filter(({ input }) => {
        const result = validator.validatePage(structuredClone(input));

        return !result.ok && !ajvAccepts(input);
      })
      .map(({ name }) => name);

    expect(bothReject).toEqual([
      "unknown prop",
      "title too long",
      "21 emoji",
      "unknown option",
      "number too big",
      "rich text as a string",
      "unknown type",
      "id root",
      "legacy zones",
      "defaults only",
      "bad assetId",
      "extra block key",
    ]);
  });

  it("stores data the shell accepts when the input has readOnly", () => {
    const input = page([
      { ...box("b", [leaf("l")]), readOnly: { content: true } },
    ]);
    const result = validator.validatePage(input);

    expect(result.ok && JSON.stringify(result.data)).not.toMatch(/readOnly/);
    expect(result.ok && ajvAccepts(result.data)).toBe(true);
  });
});
