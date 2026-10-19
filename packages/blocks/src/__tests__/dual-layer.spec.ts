import { readFileSync } from "node:fs";
import { join } from "node:path";
import Ajv from "ajv";
import type { ValidateFunction } from "ajv";
import Ajv2020 from "ajv/dist/2020";
import {
  X_KEYS,
  exampleToPageData,
  slotLocations,
} from "@tzuchi/tceditor-spec";
import type { AnyBlockSpec, Catalog, JsonSchema } from "@tzuchi/tceditor-spec";
import cases from "../__fixtures__/validator-cases.json";
import { blockSpecs } from "../specs";
import { validatePage } from "../validator";
import type { IssueCode } from "../validator";

// The generated files exactly as S3 (the shell, in Postgres) and S4 (the
// catalog, over MCP) receive them; generated.spec.ts keeps them in sync.
const readGenerated = (name: string): unknown =>
  JSON.parse(readFileSync(join(__dirname, "../../generated", name), "utf8"));
const catalog = readGenerated("catalog.json") as Catalog;
const shell = readGenerated("page-shell.draft07.json") as JsonSchema;

// Ajv as S3 and S4 will run it: strict, every x-* keyword registered, and
// defaults filled in like zod does (facts zod-ajv §10.1, gaps #21). Same
// setup and rules as packages/spec/src/validator/__tests__/dual-layer.spec.ts.
const ajv2020 = new Ajv2020({
  strict: true,
  allErrors: true,
  useDefaults: true,
});
ajv2020.addVocabulary([...X_KEYS]);

const propsSchemas = new Map<string, ValidateFunction>(
  catalog.blocks.map((block) => [block.type, ajv2020.compile(block.props)])
);
const rootSchema = ajv2020.compile(catalog.root.props);
const shellSchema = new Ajv({ strict: true, allErrors: true }).compile(shell);
const specs = new Map<string, AnyBlockSpec>(
  blockSpecs.map((spec) => [spec.type, spec])
);

type AnyRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is AnyRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** The values at a slot path such as ["columns", "[]", "content"]. */
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

/** Every block node in a content array, including the ones in slots. */
const blocksOf = (content: unknown): AnyRecord[] => {
  const found: AnyRecord[] = [];
  const queue: unknown[] = [content];

  while (queue.length > 0) {
    const list = queue.pop();

    if (!Array.isArray(list)) continue;

    for (const node of list) {
      if (!isRecord(node) || !isRecord(node.props)) continue;

      found.push(node);

      const spec =
        typeof node.type === "string" ? specs.get(node.type) : undefined;

      for (const slot of spec ? slotLocations(spec) : []) {
        queue.push(...valuesAt(node.props, slot.path));
      }
    }
  }

  return found;
};

/** Each block's props (without id) and the root props against the catalog. */
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

/** The draft-07 shell plus the catalog's per-block schemas. */
const ajvAccepts = (input: unknown): boolean =>
  shellSchema(structuredClone(input)) && propsAccepted(input);

type Case = { name: string; input: unknown };

const page = (content: unknown[]) => ({ root: { props: {} }, content });

const corpus: Case[] = [
  ...blockSpecs.flatMap((spec) =>
    spec.examples.map((example, index) => ({
      name: `example ${spec.type} ${example.name}`,
      input: exampleToPageData(spec, index),
    }))
  ),
  ...blockSpecs.map((spec) => ({
    name: `defaults only ${spec.type}`,
    input: page([{ type: spec.type, props: { id: `${spec.type}-1` } }]),
  })),
  ...(cases as Case[]).map(({ name, input }) => ({
    name: `validator-cases ${name}`,
    input,
  })),
  {
    name: "rich text with an unsafe link and a heading",
    input: page([
      {
        type: "Paragraph",
        props: {
          id: "Paragraph-1",
          body: {
            type: "doc",
            content: [
              {
                type: "heading",
                attrs: { level: 2 },
                content: [{ type: "text", text: "標題" }],
              },
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "連結",
                    marks: [
                      { type: "link", attrs: { href: "javascript:alert(1)" } },
                    ],
                  },
                ],
              },
            ],
          },
        },
      },
    ]),
  },
  {
    name: "unsafe optional link in a card inside columns",
    input: page([
      {
        type: "Columns",
        props: {
          id: "Columns-1",
          columns: [
            {
              content: [
                {
                  type: "Card",
                  props: { id: "Card-1", href: "javascript:alert(1)" },
                },
              ],
            },
            { content: [] },
          ],
        },
      },
    ]),
  },
];

// x-lost-checks entries that the validator reports as a rejection
const LOST_CHECK_CODES: Record<string, IssueCode> = {
  "safe-href": "unsafe_href",
  "alt-required": "alt_required",
};

// Whole-page rules that no JSON Schema layer checks: the shell only checks
// structure (spec §6.5) and the catalog schemas see one block at a time.
const PAGE_RULE_CODES: IssueCode[] = [
  "duplicate_id",
  "not_allowed_here",
  "too_deep",
  "too_many_blocks",
];

/** Codes of the x-lost-checks that the catalog declares anywhere. */
const lostCheckCodes = (): IssueCode[] => {
  const codes = new Set<IssueCode>();
  const stack: unknown[] = [catalog];

  while (stack.length > 0) {
    const node = stack.pop();

    if (Array.isArray(node)) {
      stack.push(...node);
    } else if (isRecord(node)) {
      const checks = node["x-lost-checks"];

      if (Array.isArray(checks)) {
        for (const check of checks) {
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

describe("dual-layer consistency with the generated files (spec §13.1)", () => {
  it("never accepts with zod what Ajv rejects", () => {
    const failures: string[] = [];

    for (const { name, input } of corpus) {
      const result = validatePage(structuredClone(input));

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
      const result = validatePage(structuredClone(input));

      if (result.ok || !ajvAccepts(input)) continue;

      for (const issue of result.errors) {
        seen.add(issue.code);
        if (!allowed.has(issue.code)) unexpected.push(`${name}: ${issue.code}`);
      }
    }

    expect(lostCheckCodes()).toEqual(["alt_required", "unsafe_href"]);
    expect(unexpected).toEqual([]);
    // the corpus reaches every rule that only the zod validator checks,
    // except depth and block count (Task 9 covers them with test specs)
    expect([...seen].sort()).toEqual([
      "alt_required",
      "duplicate_id",
      "not_allowed_here",
      "unsafe_href",
    ]);
  });

  it("covers both outcomes", () => {
    const outcomes = corpus.map(({ input }) => ({
      zod: validatePage(structuredClone(input)).ok,
      ajv: ajvAccepts(input),
    }));

    expect(outcomes.filter((o) => o.zod && o.ajv).length).toBeGreaterThan(10);
    expect(outcomes.filter((o) => !o.zod && !o.ajv).length).toBeGreaterThan(10);
  });
});
