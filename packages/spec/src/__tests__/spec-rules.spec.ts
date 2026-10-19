import * as z from "zod";
import {
  fitRichTextToTypes,
  richTextFeaturesToTypes,
  textToRichText,
} from "@tzuchi/tceditor/rules";
import type { RichTextFeature } from "@tzuchi/tceditor/rules";
import { defineBlockSpec, definePageRoot } from "../define";
import type { AnyBlockSpec, PageRootSpec } from "../define";
import { choice, image, link, richText, slot } from "../helpers";
import {
  FIELD_NAME_PATTERN,
  RESERVED_FIELD_NAMES,
  checkSpecRules,
} from "../spec-rules";
import type { SpecRuleId, SpecRuleViolation } from "../spec-rules";
import {
  boxSpec,
  leafSpec,
  pairSpec,
  testBlocks,
  testRoot,
} from "../__fixtures__/test-specs";

/** A block that skips defineBlockSpec's checks, for the rules it would catch first. */
const rawBlock = (
  type: string,
  props: z.ZodObject,
  examples: AnyBlockSpec["examples"] = [{ name: "x", props: {} }]
): AnyBlockSpec => ({
  kind: "block",
  type,
  label: "測試",
  category: "測試",
  description: "",
  version: 1,
  deprecated: false,
  props,
  examples,
});

const block = (type: string, shape: z.core.$ZodLooseShape) =>
  rawBlock(type, z.strictObject(shape));

const emptyRoot = definePageRoot({ props: z.strictObject({}) });

const check = (
  blocks: readonly AnyBlockSpec[],
  root: PageRootSpec = emptyRoot
) => checkSpecRules({ blocks: [leafSpec, ...blocks], root });

const pick = (violations: SpecRuleViolation[], rule: SpecRuleId) =>
  violations
    .filter((violation) => violation.rule === rule)
    .map(({ type, path }) => ({ type, path }));

const title = (text: string) => z.string().meta({ title: text });

/** Meta that GlobalMeta's types forbid, as plain JavaScript could still pass it. */
const forged = (meta: Record<string, unknown>) => meta as z.GlobalMeta;

/** A rich text default in richText()'s output shape. */
const fitted = (text: string, features: readonly RichTextFeature[]) =>
  fitRichTextToTypes(textToRichText(text), richTextFeaturesToTypes(features));

/** A list of { label } items, the shape of TagList. */
const labelList = (itemLabel: string, item: z.core.$ZodLooseShape) =>
  z
    .array(z.strictObject(item))
    .max(3)
    .default(() => [])
    .meta({ title: "項目", "x-item-label": itemLabel });

describe("checkSpecRules", () => {
  it("accepts the test specs", () => {
    expect(checkSpecRules({ blocks: testBlocks, root: testRoot })).toEqual([]);
  });

  it("exports the field name rules", () => {
    expect(RESERVED_FIELD_NAMES).toEqual([
      "id",
      "puck",
      "editMode",
      "children",
      "key",
      "ref",
    ]);
    expect(FIELD_NAME_PATTERN.test(`a${"b".repeat(63)}`)).toBe(true);
    expect(FIELD_NAME_PATTERN.test(`a${"b".repeat(64)}`)).toBe(false);
  });

  // One negative case per rule; the Record makes tsc fail when a rule id is added without a case.
  const cases: Record<
    SpecRuleId,
    () => {
      violations: SpecRuleViolation[];
      expected: { type: string; path: string };
    }
  > = {
    "type-name": () => ({
      violations: check([block("my-block", { a: title("a") })]),
      expected: { type: "my-block", path: "" },
    }),
    "unique-type": () => ({
      violations: check([leafSpec]),
      expected: { type: "Leaf", path: "" },
    }),
    "root-object": () => ({
      violations: check([
        rawBlock(
          "Referenced",
          z.strictObject({ a: title("a") }).meta({ id: "Shared" })
        ),
      ]),
      expected: { type: "Referenced", path: "" },
    }),
    "no-ref": () => ({
      violations: check([
        block("Shared", {
          a: z.string().meta({ id: "SharedText", title: "a" }),
        }),
      ]),
      expected: { type: "Shared", path: "a" },
    }),
    "strict-objects": () => ({
      violations: check([
        block("Loose", {
          group: z.object({ a: title("a") }).meta({ title: "群組" }),
        }),
      ]),
      expected: { type: "Loose", path: "group" },
    }),
    "object-arrays": () => ({
      violations: check([
        block("Tags", { tags: z.array(z.string()).meta({ title: "標籤" }) }),
      ]),
      expected: { type: "Tags", path: "tags" },
    }),
    "title-required": () => ({
      violations: check([
        block("Untitled", {
          items: z
            .array(z.strictObject({ label: z.string() }))
            .meta({ title: "項目" }),
        }),
      ]),
      expected: { type: "Untitled", path: "items[].label" },
    }),
    "field-name": () => ({
      violations: check([block("BadName", { "has space": title("a") })]),
      expected: { type: "BadName", path: "has space" },
    }),
    "reserved-name": () => ({
      violations: check(
        [],
        definePageRoot({ props: z.strictObject({ children: title("子") }) })
      ),
      expected: { type: "root", path: "children" },
    }),
    "meta-keys": () => ({
      violations: check([
        block("Typo", {
          tone: z
            .enum(["a", "b"])
            .meta({ title: "色調", "x-lables": { a: "甲", b: "乙" } }),
        }),
      ]),
      expected: { type: "Typo", path: "tone" },
    }),
    "slot-shape": () => ({
      violations: check([boxSpec, block("Text", { content: title("內容") })]),
      expected: { type: "Text", path: "content" },
    }),
    "slot-targets": () => ({
      violations: check([
        block("Ghostly", {
          content: slot({ allow: ["Ghost"] }).meta({ title: "內容" }),
        }),
      ]),
      expected: { type: "Ghostly", path: "content" },
    }),
    "example-count": () => ({
      violations: check([rawBlock("NoExample", z.strictObject({}), [])]),
      expected: { type: "NoExample", path: "" },
    }),
    defaults: () => ({
      violations: check([
        block("BadDefault", {
          text: z
            .string()
            .max(5)
            .default("太長的預設文字")
            .meta({ title: "文字" }),
        }),
      ]),
      expected: { type: "BadDefault", path: "text" },
    }),
    "item-label": () => ({
      violations: check([
        block("Typo", {
          items: labelList("{lable}", { label: title("名稱") }),
        }),
      ]),
      expected: { type: "Typo", path: "items" },
    }),
  };

  it.each(Object.keys(cases) as SpecRuleId[])("reports %s", (rule) => {
    const { violations, expected } = cases[rule]();

    expect(pick(violations, rule)).toContainEqual(expected);
    for (const violation of violations) {
      expect(typeof violation.message).toBe("string");
      expect(violation.message).not.toBe("");
    }
  });

  it("names the misspelled meta key", () => {
    const [violation] = check([
      block("Typo", {
        tone: z
          .enum(["a"])
          .default("a")
          .meta({ title: "色調", "x-lables": { a: "甲" } }),
      }),
    ]);

    expect(violation).toEqual({
      rule: "meta-keys",
      type: "Typo",
      path: "tone",
      message: '"x-lables" is not an allowed JSON Schema keyword or meta key',
    });
  });

  it("rejects keywords that specs may not produce", () => {
    const violations = check([
      block("Odd", {
        email: z.email().meta({ title: "電子郵件" }),
        maybe: z.union([z.string(), z.number().int()]).meta({ title: "或許" }),
      }),
    ]);

    expect(pick(violations, "meta-keys")).toEqual(
      expect.arrayContaining([
        { type: "Odd", path: "email" },
        { type: "Odd", path: "maybe" },
      ])
    );
  });

  it("reports a root $ref as both root-object and no-ref", () => {
    const violations = check([
      rawBlock(
        "Referenced",
        z
          .strictObject({ a: z.string().default("").meta({ title: "a" }) })
          .meta({ id: "Shared" })
      ),
    ]);

    expect(violations.map((violation) => violation.rule).sort()).toEqual([
      "no-ref",
      "no-ref",
      "root-object",
    ]);
  });

  it("flags records and loose objects", () => {
    const violations = check([
      block("Records", {
        map: z.record(z.string(), z.string()).meta({ title: "對照" }),
        loose: z.looseObject({ a: title("a") }).meta({ title: "鬆" }),
      }),
    ]);

    expect(pick(violations, "strict-objects")).toEqual([
      { type: "Records", path: "map" },
      { type: "Records", path: "loose" },
    ]);
  });

  it("requires a maximum on every list, but not on slots", () => {
    const violations = check([
      block("Lists", {
        tags: z
          .array(z.strictObject({ label: title("名稱") }))
          .default(() => [])
          .meta({ title: "標籤" }),
        rows: z
          .array(
            z.strictObject({
              cells: z
                .array(z.strictObject({ text: title("文字") }))
                .meta({ title: "格" }),
              content: slot({ allow: ["Leaf"] }).meta({ title: "內容" }),
            })
          )
          .max(3)
          .default(() => [])
          .meta({ title: "列" }),
      }),
    ]);

    expect(violations).toEqual([
      {
        rule: "object-arrays",
        type: "Lists",
        path: "tags",
        message: "lists need a maximum: add .max(n)",
      },
      {
        rule: "object-arrays",
        type: "Lists",
        path: "rows[].cells",
        message: "lists need a maximum: add .max(n)",
      },
    ]);
  });

  it("requires a title on fields at every level", () => {
    const violations = check([
      block("Untitled", {
        note: z.string().default(""),
        group: z
          .strictObject({ caption: z.string().default("") })
          .meta({ title: "群組" }),
      }),
    ]);

    expect(pick(violations, "title-required")).toEqual([
      { type: "Untitled", path: "note" },
      { type: "Untitled", path: "group.caption" },
    ]);
  });

  it.each(["id", "puck", "editMode", "children", "key", "ref"])(
    "reserves %s at every level",
    (name) => {
      const violations = check([
        block("Reserved", {
          group: z.strictObject({ [name]: title("x") }).meta({ title: "群組" }),
        }),
      ]);

      expect(pick(violations, "reserved-name")).toEqual([
        { type: "Reserved", path: `group.${name}` },
      ]);
    }
  );

  it("checks that slot names keep one structure across blocks", () => {
    const otherColumns = block("Grid", {
      columns: z
        .array(
          z.strictObject({
            body: slot({ allow: ["Leaf"] }).meta({ title: "內容" }),
          })
        )
        .meta({ title: "欄" }),
    });
    const sameColumns = block("Trio", {
      columns: z
        .array(
          z.strictObject({
            content: slot({ allow: ["Leaf"] }).meta({ title: "內容" }),
            note: title("備註"),
          })
        )
        .meta({ title: "欄" }),
    });

    expect(pick(check([pairSpec, otherColumns]), "slot-shape")).toEqual([
      { type: "Grid", path: "columns" },
    ]);
    expect(pick(check([pairSpec, sameColumns]), "slot-shape")).toEqual([]);
  });

  it("only accepts x-slot on a slot() array", () => {
    const violations = check([
      block("FakeSlot", {
        content: z
          .string()
          .meta(forged({ title: "內容", "x-slot": { allow: ["Leaf"] } })),
      }),
    ]);

    expect(pick(violations, "slot-shape")).toContainEqual({
      type: "FakeSlot",
      path: "content",
    });
  });

  it("rejects JSON Schema keywords set through .meta()", () => {
    const violations = check([
      block("Override", {
        group: z
          .object({ a: title("a") })
          .meta({ title: "群組", additionalProperties: false }),
        count: z.string().meta({ title: "數量", type: "number" }),
      }),
    ]);

    expect(pick(violations, "meta-keys")).toEqual([
      { type: "Override", path: "group" },
      { type: "Override", path: "count" },
    ]);
  });

  it("rejects nullable fields and unions of JSON types", () => {
    const violations = check([
      block("Nullable", {
        a: z.string().nullable().meta({ title: "a" }),
        b: z.union([z.string(), z.number()]).meta({ title: "b" }),
      }),
    ]);

    expect(pick(violations, "meta-keys")).toEqual([
      { type: "Nullable", path: "a" },
      { type: "Nullable", path: "b" },
    ]);
  });

  it.each(["constructor", "toString", "valueOf", "hasOwnProperty"])(
    "reserves the Object.prototype name %s",
    (name) => {
      expect(
        pick(check([block("Proto", { [name]: title("x") })]), "reserved-name")
      ).toEqual([{ type: "Proto", path: name }]);
    }
  );

  it("leaves x-link, x-image, x-richtext and x-lost-checks to the helpers", () => {
    const violations = check([
      block("Forged", {
        picture: z.string().meta(forged({ title: "圖片", "x-image": true })),
        body: z
          .strictObject({ type: z.literal("doc").meta({ title: "類型" }) })
          .meta(
            forged({ title: "內文", "x-richtext": { features: ["bold"] } })
          ),
        href: link().meta(
          forged({ title: "連結", "x-lost-checks": ["alt-required"] })
        ),
        note: z
          .string()
          .meta(forged({ title: "備註", "x-lost-checks": ["safe-href"] })),
      }),
    ]);

    expect(pick(violations, "meta-keys")).toEqual([
      { type: "Forged", path: "picture" },
      { type: "Forged", path: "body" },
      { type: "Forged", path: "href" },
      { type: "Forged", path: "note" },
    ]);
  });

  it("checks slot targets in the root too", () => {
    const root = definePageRoot({
      props: z.strictObject({
        content: slot({ disallow: ["Missing"] }).meta({ title: "內容" }),
      }),
    });

    expect(pick(check([], root), "slot-targets")).toEqual([
      { type: "root", path: "content" },
    ]);
  });

  it("accepts a block defined with defineBlockSpec that follows the rules", () => {
    const ok = defineBlockSpec({
      type: "Fine",
      label: "好",
      category: "測試",
      description: "",
      version: 1,
      props: z.strictObject({
        text: z.string().max(20).default("").meta({ title: "文字" }),
      }),
      examples: [{ name: "x", props: { text: "a" } }],
    });

    expect(check([ok])).toEqual([]);
  });

  describe("helper-only meta", () => {
    it("reports helper keys copied onto a schema that no helper made", () => {
      const violations = check([
        block("FakeLink", {
          href: z
            .string()
            .max(2048)
            .default("")
            .meta(
              forged({
                title: "連結",
                "x-link": { optional: true },
                "x-lost-checks": ["safe-href"],
              })
            ),
          items: z
            .array(
              z.strictObject({
                picture: z
                  .strictObject({
                    assetId: title("圖片"),
                    alt: title("替代文字"),
                    decorative: z.boolean().meta({ title: "裝飾用圖片" }),
                  })
                  .meta(
                    forged({
                      title: "圖片",
                      "x-image": true,
                      "x-lost-checks": ["alt-required"],
                    })
                  ),
              })
            )
            .max(3)
            .default(() => [])
            .meta({ title: "項目" }),
        }),
      ]);

      expect(pick(violations, "meta-keys")).toEqual([
        { type: "FakeLink", path: "href" },
        { type: "FakeLink", path: "items[].picture" },
      ]);
    });

    it("reports helper keys whose values were changed", () => {
      const violations = check([
        block("Changed", {
          body: richText({ features: ["bold"] })
            .default(() => fitted("內文", ["bold"]))
            .meta(
              forged({
                title: "內文",
                "x-richtext": { features: ["bold", "heading"] },
              })
            ),
          href: link().meta(
            forged({ title: "連結", "x-link": { optional: true } })
          ),
          content: slot({ allow: ["Leaf"] }).meta(
            forged({ title: "內容", "x-slot": { disallow: ["Leaf"] } })
          ),
          picture: image().meta(forged({ title: "圖片", "x-image": false })),
        }),
      ]);

      expect(pick(violations, "meta-keys")).toEqual([
        { type: "Changed", path: "body" },
        { type: "Changed", path: "href" },
        { type: "Changed", path: "content" },
        { type: "Changed", path: "picture" },
      ]);
    });

    it("names the helper keys that differ", () => {
      const [violation] = check([
        block("Changed", {
          href: link().meta(
            forged({ title: "連結", "x-link": { optional: true } })
          ),
        }),
      ]);

      expect(violation.rule).toBe("meta-keys");
      expect(violation.message).toContain("x-link");
      expect(violation.message).not.toContain("x-lost-checks");
    });

    it("accepts the author's meta, defaults and descriptions on helpers", () => {
      expect(
        check([
          block("Decorated", {
            more: link({ optional: true })
              .default("/about")
              .describe("選填的連結")
              .meta({ title: "更多連結", description: "選填" }),
            href: link().describe("必填的連結").meta({ title: "連結網址" }),
            body: richText({ features: ["bold"] })
              .default(() => fitted("內文", ["bold"]))
              .describe("內文")
              .meta({ title: "內文" }),
            content: slot({ allow: ["Leaf"] })
              .describe("放置區")
              .meta({ title: "內容" }),
            picture: image().describe("圖片").meta({ title: "圖片" }),
            links: z
              .array(z.strictObject({ href: link().meta({ title: "網址" }) }))
              .max(3)
              .default(() => [])
              .meta({ title: "連結清單" }),
          }),
        ])
      ).toEqual([]);
    });
  });

  describe("defaults", () => {
    const headingDoc = () => ({
      type: "doc" as const,
      content: [
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "標題" }],
        },
      ],
    });

    const shapes: [string, z.core.$ZodLooseShape, string][] = [
      [
        "a rich text default that richText() would change",
        {
          body: richText({ features: ["bold"] })
            .default(headingDoc)
            .meta({ title: "內文" }),
        },
        "body",
      ],
      [
        "an unsafe link default",
        {
          href: link({ optional: true })
            .default("javascript:alert(1)")
            .meta({ title: "連結" }),
        },
        "href",
      ],
      [
        "a default over the field's limit",
        {
          text: z
            .string()
            .max(5)
            .default("太長的預設文字")
            .meta({ title: "文字" }),
        },
        "text",
      ],
      [
        "an incomplete object default",
        {
          group: z
            .strictObject({
              caption: z.string().max(40).default("").meta({ title: "說明" }),
              level: z
                .number()
                .int()
                .min(0)
                .max(3)
                .default(0)
                .meta({ title: "層級" }),
            })
            // zod types the default as the output, which has both fields
            .default(
              () => ({ caption: "" } as { caption: string; level: number })
            )
            .meta({ title: "群組" }),
        },
        "group",
      ],
      [
        "a .prefault() that fails",
        { text: z.string().min(1).prefault("").meta({ title: "文字" }) },
        "text",
      ],
      [
        "a top-level field without a default",
        { text: z.string().max(5).meta({ title: "文字" }) },
        "text",
      ],
      [
        "a default on a required link()",
        { href: link().default("/about").meta({ title: "連結" }) },
        "href",
      ],
      [
        "link() wrapped in .optional()",
        { href: link().optional().meta({ title: "連結" }) },
        "href",
      ],
      [
        "link() wrapped in .nullable()",
        { href: link().nullable().meta({ title: "連結" }) },
        "href",
      ],
      [
        "image() wrapped in .optional()",
        { picture: image().optional().meta({ title: "圖片" }) },
        "picture",
      ],
      [
        "image() wrapped in .nullable()",
        { picture: image().nullable().meta({ title: "圖片" }) },
        "picture",
      ],
      [
        "a default inside list items that fails",
        {
          items: z
            .array(
              z.strictObject({
                label: z
                  .string()
                  .min(1)
                  .max(20)
                  .default("")
                  .meta({ title: "名稱" }),
              })
            )
            .max(3)
            .default(() => [])
            .meta({ title: "項目" }),
        },
        "items[].label",
      ],
      [
        "image() made optional inside a group",
        {
          group: z
            .strictObject({
              picture: image().optional().meta({ title: "圖片" }),
            })
            .default(() => ({}))
            .meta({ title: "群組" }),
        },
        "group.picture",
      ],
    ];

    it.each(shapes)("reports %s", (_name, shape, path) => {
      expect(pick(check([block("Defaults", shape)]), "defaults")).toEqual([
        { type: "Defaults", path },
      ]);
    });

    it("checks the fields of the page root", () => {
      const root = definePageRoot({
        props: z.strictObject({
          title: z
            .string()
            .min(1)
            .max(80)
            .default("")
            .meta({ title: "頁面標題" }),
        }),
      });

      expect(pick(check([], root), "defaults")).toEqual([
        { type: "root", path: "title" },
      ]);
    });

    it("accepts required link() and image(), and item fields without a default", () => {
      expect(
        check([
          block("Required", {
            href: link().meta({ title: "連結網址" }),
            picture: image().meta({ title: "圖片" }),
            items: z
              .array(
                z.strictObject({
                  label: z.string().min(1).max(20).meta({ title: "名稱" }),
                  href: link().meta({ title: "網址" }),
                })
              )
              .max(3)
              .default(() => [{ label: "一", href: "/one" }])
              .meta({ title: "項目" }),
          }),
        ])
      ).toEqual([]);
    });
  });

  describe("lists", () => {
    it.each([
      ["image()", image()],
      ["richText()", richText({ features: [] })],
      ["link()", link()],
      ["slot()", slot({ allow: ["Leaf"] })],
    ] as const)("rejects %s as a list item", (_name, item) => {
      const violations = check([
        block("HelperList", {
          items: z
            .array(item as z.ZodType)
            .max(3)
            .default(() => [])
            .meta({ title: "項目" }),
        }),
      ]);

      expect(pick(violations, "object-arrays")).toEqual([
        { type: "HelperList", path: "items" },
      ]);
    });

    it("checks the fields that x-item-label names", () => {
      const violations = check([
        block("Labels", {
          good: labelList("第 {n} 項：{label}（{count}，{tone}，{href}）", {
            label: title("名稱"),
            count: z.number().int().min(0).max(9).meta({ title: "數量" }),
            tone: choice(["a", "b"]).meta({ title: "色調" }),
            href: link().meta({ title: "網址" }),
          }),
          plain: labelList("項目", { label: title("名稱") }),
          spaced: labelList("{ label } {}", { label: title("名稱") }),
          typo: labelList("{lable}", { label: title("名稱") }),
          flag: labelList("{label}{on}", {
            label: title("名稱"),
            on: z.boolean().meta({ title: "開啟" }),
          }),
          body: labelList("{body}", {
            body: richText({ features: [] }).meta({ title: "內文" }),
          }),
          group: labelList("{inner}", {
            inner: z.strictObject({ a: title("a") }).meta({ title: "內層" }),
          }),
        }),
      ]);

      expect(pick(violations, "item-label")).toEqual([
        { type: "Labels", path: "typo" },
        { type: "Labels", path: "flag" },
        { type: "Labels", path: "body" },
        { type: "Labels", path: "group" },
      ]);
    });

    it("reports x-item-label on a field that is not a list", () => {
      const violations = check([
        block("NotList", {
          text: z
            .string()
            .default("")
            .meta({ title: "文字", "x-item-label": "{n}" }),
        }),
      ]);

      expect(pick(violations, "item-label")).toEqual([
        { type: "NotList", path: "text" },
      ]);
    });
  });

  it("rejects number bounds and steps that the editor fields ignore", () => {
    const violations = check([
      block("Numbers", {
        step: z
          .number()
          .int()
          .min(0)
          .max(100)
          .multipleOf(5)
          .default(0)
          .meta({ title: "間隔" }),
        above: z.number().gt(0).max(10).default(1).meta({ title: "大於" }),
        below: z.number().min(0).lt(10).default(1).meta({ title: "小於" }),
        plain: z
          .number()
          .int()
          .min(0)
          .max(10)
          .default(0)
          .meta({ title: "數量" }),
      }),
    ]);

    expect(pick(violations, "meta-keys")).toEqual([
      { type: "Numbers", path: "step" },
      { type: "Numbers", path: "above" },
      { type: "Numbers", path: "below" },
    ]);
  });
});
