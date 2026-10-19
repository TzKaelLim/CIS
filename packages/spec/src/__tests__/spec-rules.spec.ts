import * as z from "zod";
import { defineBlockSpec, definePageRoot } from "../define";
import type { AnyBlockSpec, PageRootSpec } from "../define";
import { link, slot } from "../helpers";
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
        tone: z.enum(["a"]).meta({ title: "色調", "x-lables": { a: "甲" } }),
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
        z.strictObject({ a: title("a") }).meta({ id: "Shared" })
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

  it.each(["id", "puck", "editMode", "children"])(
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
      props: z.strictObject({ text: title("文字") }),
      examples: [{ name: "x", props: { text: "a" } }],
    });

    expect(check([ok])).toEqual([]);
  });
});
