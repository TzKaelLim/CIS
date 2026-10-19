import {
  BLOCK_TYPE_PATTERN,
  checkSpecRules,
  eachField,
  toJsonSchema,
} from "@tzuchi/tceditor-spec";
import type { AnyBlockSpec, JsonSchema } from "@tzuchi/tceditor-spec";
import { NODE_ID_PATTERN } from "@tzuchi/tceditor-spec/validator";
import { CATEGORIES, blockSpecs, pageRootSpec } from "../specs";
import { blockTypes } from "../validator";

/** Each top-level field's JSON Schema `default` (prefault included). */
const defaultsOf = (spec: AnyBlockSpec | typeof pageRootSpec) => {
  const properties = toJsonSchema(spec).properties as Record<
    string,
    JsonSchema
  >;

  return Object.fromEntries(
    Object.keys(properties).map((name) => [name, properties[name].default])
  );
};

describe("block specs", () => {
  it("registers the 8 blocks in editor order", () => {
    const types = blockSpecs.map((spec) => spec.type);
    // spec §8; a block added later may go anywhere in the list
    const demoBlocks = [
      "Heading",
      "Paragraph",
      "Button",
      "Card",
      "TagList",
      "Section",
      "Columns",
      "Image",
    ];

    expect(types.filter((type) => demoBlocks.includes(type))).toEqual(
      demoBlocks
    );
    expect(blockTypes).toEqual(types);
  });

  it("follows the spec writing rules", () => {
    expect(checkSpecRules({ blocks: blockSpecs, root: pageRootSpec })).toEqual(
      []
    );
  });

  it("uses type names that fit the ids the editor generates", () => {
    for (const { type } of blockSpecs) {
      expect(type).toMatch(BLOCK_TYPE_PATTERN);
      // The editor's ids are `${type}-${uuid}`: the type plus 37 characters
      expect(type.length + 37).toBeLessThanOrEqual(64);
      expect(`${type}-${crypto.randomUUID()}`).toMatch(NODE_ID_PATTERN);
    }
  });

  it("puts every block in one of the editor categories", () => {
    const titles: readonly string[] = CATEGORIES.map(({ title }) => title);
    const categoryOf = Object.fromEntries(
      blockSpecs.map((spec) => [spec.type, spec.category])
    );

    for (const spec of blockSpecs) {
      expect([spec.type, titles.includes(spec.category)]).toEqual([
        spec.type,
        true,
      ]);
    }
    // spec §7.3; a block added later only has to name one of the categories
    expect(categoryOf).toMatchObject({
      Heading: "文字",
      Paragraph: "文字",
      Button: "互動",
      Card: "內容",
      TagList: "內容",
      Image: "內容",
      Section: "版面",
      Columns: "版面",
    });
    expect(CATEGORIES.map(({ key }) => key)).toEqual([
      "text",
      "interactive",
      "content",
      "layout",
    ]);
  });

  it("has a positive integer version, a boolean deprecated flag and a description", () => {
    for (const spec of blockSpecs) {
      // A compatible change raises `version` and a retired block sets
      // `deprecated: true`, so neither is pinned to its first value
      expect(Number.isInteger(spec.version)).toBe(true);
      expect(spec.version).toBeGreaterThanOrEqual(1);
      expect(typeof spec.deprecated).toBe("boolean");
      expect(spec.description.length).toBeGreaterThan(0);
      expect(spec.description.length).toBeLessThanOrEqual(4096);
      expect(spec.examples.length).toBeGreaterThan(0);
    }
  });

  it("labels every option of every choice field", () => {
    for (const spec of blockSpecs) {
      eachField(toJsonSchema(spec), ({ path, node }) => {
        if (!Array.isArray(node.enum)) return;

        const field = `${spec.type}.${path.join(".")}`;
        const labels = (node["x-labels"] ?? {}) as Record<string, string>;

        // The field name is part of the expectation so a failure names it
        expect([field, Object.keys(labels).sort()]).toEqual([
          field,
          [...(node.enum as string[])].sort(),
        ]);
        for (const value of node.enum as string[]) {
          expect([field, value, labels[value]]).toEqual([
            field,
            value,
            expect.stringMatching(/\S/),
          ]);
        }
      });
    }
  });

  it("uses the defaults of spec §8", () => {
    const byType = new Map<string, unknown>(
      blockSpecs.map((spec) => [spec.type, defaultsOf(spec)])
    );
    const [heading, paragraph, button, card, tagList, section, columns, image] =
      [
        "Heading",
        "Paragraph",
        "Button",
        "Card",
        "TagList",
        "Section",
        "Columns",
        "Image",
      ].map((type) => byType.get(type));

    expect(heading).toEqual({ text: "標題文字", level: "h2", align: "start" });
    expect(paragraph).toEqual({
      // The text of spec §8 in the shape richText() stores: textAlign is off,
      // so the paragraph has no attrs, as in the editor's getJSON()
      body: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "請輸入內文。" }],
          },
        ],
      },
      align: "start",
    });
    expect(button).toEqual({
      label: "立即報名",
      href: "",
      variant: "primary",
      size: "md",
      fullWidth: false,
    });
    expect(card).toEqual({
      title: "卡片標題",
      summary: "",
      href: "",
      variant: "default",
      content: [],
    });
    expect(tagList).toEqual({
      tags: [{ label: "志工" }, { label: "環保" }],
      color: "default",
      variant: "secondary",
    });
    expect(section).toEqual({
      background: "transparent",
      paddingY: "48",
      content: [],
    });
    expect(columns).toEqual({
      columns: [{ content: [] }, { content: [] }],
      gap: "24",
    });
    expect(image).toEqual({
      image: { assetId: "", alt: "", decorative: false },
      ratio: "auto",
      caption: "",
    });
    expect(defaultsOf(pageRootSpec)).toEqual({
      title: "未命名頁面",
      description: "",
    });
    expect(pageRootSpec.label).toBe("頁面");
  });
});
