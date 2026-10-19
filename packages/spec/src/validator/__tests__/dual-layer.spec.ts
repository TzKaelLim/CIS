import Ajv, { type ValidateFunction } from "ajv";
import Ajv2020 from "ajv/dist/2020";
import { testBlocks, testRoot } from "../../__fixtures__/test-specs";
import { buildPageShellSchema } from "../../convert/page-shell";
import { toJsonSchema, type JsonSchema } from "../../json-schema";
import { X_KEYS } from "../../meta";
import { exampleToPageData } from "../../page-data";
import { slotLocations } from "../../slots";
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
import type { IssueCode } from "../index";

// Ajv the way S3 and S4 will run it: strict, every x-* keyword registered,
// defaults filled in like zod does (facts zod-ajv §10.1, gaps #21).
const ajv2020 = new Ajv2020({
  strict: true,
  allErrors: true,
  useDefaults: true,
});
ajv2020.addVocabulary([...X_KEYS]);

const compile = (schema: JsonSchema): ValidateFunction =>
  ajv2020.compile(structuredClone(schema));

const propsSchemas = new Map<string, ValidateFunction>(
  testBlocks.map((spec) => [spec.type, compile(toJsonSchema(spec))])
);
const rootSchema = compile(toJsonSchema(testRoot));
const shellSchema = new Ajv({ strict: true, allErrors: true }).compile(
  buildPageShellSchema({ blocks: testBlocks })
);
const specs = new Map<string, (typeof testBlocks)[number]>(
  testBlocks.map((spec) => [spec.type, spec])
);

type AnyRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is AnyRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const valuesAt = (value: unknown, segments: readonly string[]): unknown[] => {
  let found = [value];

  for (const segment of segments) {
    found = found.flatMap((item) =>
      segment === "[]"
        ? Array.isArray(item)
          ? item
          : []
        : isRecord(item) && segment in item
        ? [item[segment]]
        : []
    );
  }

  return found;
};

const blocksOf = (content: unknown, out: AnyRecord[] = []): AnyRecord[] => {
  if (!Array.isArray(content)) return out;

  for (const node of content) {
    if (!isRecord(node) || !isRecord(node.props)) continue;

    out.push(node);

    const spec =
      typeof node.type === "string" ? specs.get(node.type) : undefined;

    for (const slot of spec ? slotLocations(spec) : []) {
      for (const children of valuesAt(node.props, slot.path)) {
        blocksOf(children, out);
      }
    }
  }

  return out;
};

/** Per-block props (without id) and root props against the 2020-12 schemas, as MCP sees them. */
const propsAccepted = (input: unknown): boolean => {
  const data: unknown = structuredClone(input);

  if (!isRecord(data) || !isRecord(data.root)) return false;
  if (!rootSchema(data.root.props)) return false;

  return blocksOf(data.content).every((node) => {
    const check =
      typeof node.type === "string" ? propsSchemas.get(node.type) : undefined;
    const props = { ...(node.props as AnyRecord) };

    delete props.id;

    return check !== undefined && check(props);
  });
};

/** The draft-07 shell plus the per-block schemas. */
const ajvAccepts = (input: unknown): boolean =>
  shellSchema(structuredClone(input)) && propsAccepted(input);

type Case = { name: string; input: unknown };

const sink = (props: AnyRecord) => page([kitchenSink("k", props)]);

const corpus: Case[] = [
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

// x-lost-checks entries that the validator reports as a rejection
const LOST_CHECK_CODES: Record<string, IssueCode> = {
  "safe-href": "unsafe_href",
  "alt-required": "alt_required",
};

// Whole-page rules that no JSON Schema layer checks: the shell only checks
// structure (spec §6.5) and per-block schemas see one block at a time.
const PAGE_RULE_CODES: IssueCode[] = [
  "duplicate_id",
  "not_allowed_here",
  "too_deep",
  "too_many_blocks",
];

const lostCheckCodes = (): IssueCode[] => {
  const codes = new Set<IssueCode>();
  const stack: unknown[] = [...testBlocks, testRoot].map((spec) =>
    toJsonSchema(spec)
  );

  while (stack.length > 0) {
    const node = stack.pop();

    if (Array.isArray(node)) {
      stack.push(...node);
    } else if (isRecord(node)) {
      const checks = node["x-lost-checks"];

      if (Array.isArray(checks)) {
        for (const check of checks) {
          // Own keys only: "constructor" in {} is true
          if (
            typeof check === "string" &&
            Object.prototype.hasOwnProperty.call(LOST_CHECK_CODES, check)
          ) {
            codes.add(LOST_CHECK_CODES[check]);
          }
        }
      }

      stack.push(...Object.values(node));
    }
  }

  return [...codes].sort();
};

describe("dual-layer consistency (spec §13.1)", () => {
  it("never accepts with zod what Ajv rejects", () => {
    const failures: string[] = [];

    for (const { name, input } of corpus) {
      const result = validator.validatePage(structuredClone(input));

      if (!result.ok) continue;

      // MCP checks the block props it sends; the database checks what is stored
      if (!propsAccepted(input)) failures.push(`${name}: input props`);
      if (!ajvAccepts(result.data)) failures.push(`${name}: stored data`);
    }

    expect(failures).toEqual([]);
  });

  it("only rejects what Ajv accepts for x-lost-checks and whole-page rules", () => {
    const allowed = new Set<IssueCode>([
      ...lostCheckCodes(),
      ...PAGE_RULE_CODES,
    ]);
    const seen = new Set<IssueCode>();
    const unexpected: string[] = [];

    for (const { name, input } of corpus) {
      const result = validator.validatePage(structuredClone(input));

      if (result.ok || !ajvAccepts(input)) continue;

      for (const issue of result.errors) {
        seen.add(issue.code);
        if (!allowed.has(issue.code)) unexpected.push(`${name}: ${issue.code}`);
      }
    }

    expect(lostCheckCodes()).toEqual(["alt_required", "unsafe_href"]);
    expect(unexpected).toEqual([]);
    expect([...seen].sort()).toEqual([
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
