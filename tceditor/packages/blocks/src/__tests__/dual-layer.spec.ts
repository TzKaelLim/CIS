import { readFileSync } from "node:fs";
import { join } from "node:path";
import { exampleToPageData } from "@tzuchi/tceditor-spec";
import type { Catalog, JsonSchema } from "@tzuchi/tceditor-spec";
// The dual-layer rules shared with packages/spec's own dual-layer.spec.ts, by
// relative path: they are test code, outside the spec package's exports.
import {
  createDualLayerOracle,
  type DualLayerCase,
} from "../../../spec/src/validator/__helpers__/dual-layer";
import cases from "../__fixtures__/validator-cases.json";
import { blockSpecs } from "../specs";
import { validatePage } from "../validator";

// The generated files exactly as S3 (the shell, in Postgres) and S4 (the
// catalog, over MCP) receive them; generated.spec.ts keeps them in sync.
const readGenerated = (name: string): unknown =>
  JSON.parse(readFileSync(join(__dirname, "../../generated", name), "utf8"));
const catalog = readGenerated("catalog.json") as Catalog;

const { ajvAccepts, lostCheckCodes, zodOnlyAccepts, zodOnlyRejects } =
  createDualLayerOracle({
    blocks: catalog.blocks,
    root: catalog.root.props,
    shell: readGenerated("page-shell.draft07.json") as JsonSchema,
    specs: blockSpecs,
  });

const page = (content: unknown[]) => ({ root: { props: {} }, content });

const corpus: DualLayerCase[] = [
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
  ...(cases as DualLayerCase[]).map(({ name, input }) => ({
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

describe("dual-layer consistency with the generated files (spec §13.1)", () => {
  it("never accepts with zod what Ajv rejects", () => {
    expect(zodOnlyAccepts(corpus, validatePage)).toEqual([]);
  });

  it("only rejects what Ajv accepts for x-lost-checks and whole-page rules", () => {
    const { seen, unexpected } = zodOnlyRejects(corpus, validatePage);

    expect(lostCheckCodes).toEqual(["alt_required", "unsafe_href"]);
    expect(unexpected).toEqual([]);
    // the corpus reaches every rule that only the zod validator checks,
    // except depth and block count (Task 9 covers them with test specs)
    expect(seen).toEqual([
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
