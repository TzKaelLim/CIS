import * as z from "zod";
import { defineBlockSpec } from "../../define";
import { choice, image, link, richText, slot } from "../../helpers";
import type { JsonSchema } from "../../json-schema";
import { kitchenSinkSpec } from "../../__fixtures__/test-specs";
import { diffContracts, toDataContract } from "../contract";

/** 第 1 版的欄位；每個測試只改其中一個。 */
const baseShape = {
  text: z.string().min(1).max(10).default("字").meta({ title: "文字" }),
  tone: choice(["a", "b"])
    .default("a")
    .meta({ title: "色調", "x-labels": { a: "甲", b: "乙" } }),
  count: z.number().int().min(0).max(5).default(0).meta({ title: "數量" }),
  href: link({ optional: true }).meta({ title: "連結" }),
  body: richText({ features: ["bold", "link"] }).meta({ title: "內文" }),
  content: slot({ allow: ["Leaf", "Box"] }).meta({ title: "內容" }),
  rest: slot({ disallow: ["Pair", "Box"] }).meta({ title: "其他" }),
  items: z
    .array(
      z.strictObject({ label: z.string().max(20).meta({ title: "名稱" }) })
    )
    .max(5)
    .default(() => [])
    .meta({ title: "項目" }),
};

const probe = (shape: z.core.$ZodLooseShape) =>
  defineBlockSpec({
    type: "Probe",
    label: "探針",
    category: "測試",
    description: "契約比對用的測試區塊。",
    version: 1,
    props: z.strictObject(shape),
    examples: [{ name: "預設", props: {} }],
  });

const base = toDataContract(probe(baseShape));
const changed = (shape: z.core.$ZodLooseShape) =>
  toDataContract(probe({ ...baseShape, ...shape }));
const without = (key: keyof typeof baseShape) => {
  const shape: z.core.$ZodLooseShape = { ...baseShape };
  delete shape[key];
  return toDataContract(probe(shape));
};
const kinds = (previous: JsonSchema, next: JsonSchema) =>
  diffContracts(previous, next).map((item) => `${item.path} ${item.kind}`);

describe("toDataContract", () => {
  it("drops labels, descriptions, examples, defaults and editor-only keys", () => {
    const contract = toDataContract(kitchenSinkSpec);
    const text = JSON.stringify(contract);
    for (const key of [
      "$schema",
      '"title":"',
      '"description":"',
      '"examples"',
      '"default"',
      '"deprecated"',
      "x-labels",
      "x-item-label",
      "x-inline",
      "x-field",
      "x-style",
      "x-token",
    ]) {
      expect(text).not.toContain(key);
    }
    const properties = contract.properties as Record<string, JsonSchema>;
    // 欄位名稱 title 不是 meta 的 title，必須保留
    expect(properties.title).toEqual({
      maxLength: 40,
      minLength: 1,
      type: "string",
    });
    expect(properties.href).toEqual({
      maxLength: 2048,
      minLength: 1,
      type: "string",
      "x-link": { optional: false },
      "x-lost-checks": ["safe-href"],
    });
    expect(properties.content["x-slot"]).toEqual({ allow: ["Leaf"] });
    expect(properties.body["x-richtext"]).toEqual({
      features: ["bold", "link"],
    });
    expect(Object.keys(properties)).toEqual(Object.keys(properties).sort());
  });

  it("ignores option order, labels, titles and defaults", () => {
    expect(
      changed({
        tone: choice(["b", "a"]).default("b").meta({ title: "改過的標籤" }),
        content: slot({ allow: ["Box", "Leaf"] }).meta({ title: "內容" }),
      })
    ).toEqual(base);
    expect(
      changed({
        text: z
          .string()
          .min(1)
          .max(10)
          .default("另一個預設值")
          .meta({ title: "新標題", description: "新說明" }),
      })
    ).toEqual(base);
  });
});

describe("diffContracts", () => {
  it("finds nothing between identical contracts", () => {
    expect(diffContracts(base, base)).toEqual([]);
    const kitchen = toDataContract(kitchenSinkSpec);
    expect(diffContracts(kitchen, structuredClone(kitchen))).toEqual([]);
  });

  it("accepts compatible changes", () => {
    const compatible = changed({
      text: z.string().min(0).max(20).default("字").meta({ title: "文字" }),
      tone: choice(["a", "b", "c"]).default("a").meta({ title: "色調" }),
      content: slot({ allow: ["Leaf", "Box", "Pair"] }).meta({ title: "內容" }),
      rest: slot({ disallow: ["Pair"] }).meta({ title: "其他" }),
      body: richText({ features: ["bold", "link", "italic"] }).meta({
        title: "內文",
      }),
      extraOptional: z.string().optional().meta({ title: "選填" }),
      extraDefaulted: z.boolean().default(false).meta({ title: "有預設值" }),
    });
    expect(diffContracts(base, compatible)).toEqual([]);
  });

  it("reports a removed property", () => {
    expect(kinds(base, without("count"))).toEqual(["count removed-property"]);
  });

  it("reports a changed type", () => {
    expect(
      kinds(
        base,
        changed({ text: z.number().default(1).meta({ title: "文字" }) })
      )
    ).toEqual(["text type-changed"]);
    expect(
      kinds(
        base,
        changed({
          count: z.number().min(0).max(5).default(0).meta({ title: "數量" }),
        })
      )
    ).toEqual([]);
  });

  it("reports a removed enum value", () => {
    expect(
      kinds(
        base,
        changed({ tone: choice(["a"]).default("a").meta({ title: "色調" }) })
      )
    ).toEqual(["tone enum-value-removed"]);
  });

  it("reports tightened limits", () => {
    expect(
      kinds(
        base,
        changed({
          text: z
            .string()
            .min(2)
            .max(10)
            .default("字字")
            .meta({ title: "文字" }),
        })
      )
    ).toEqual(["text limit-tightened"]);
    expect(
      kinds(
        base,
        changed({
          items: z
            .array(
              z.strictObject({
                label: z.string().max(10).meta({ title: "名稱" }),
              })
            )
            .max(3)
            .default(() => [])
            .meta({ title: "項目" }),
        })
      )
    ).toEqual(["items limit-tightened", "items[].label limit-tightened"]);
  });

  it("compares multipleOf by divisibility", () => {
    const step = (value: number) =>
      toDataContract(
        probe({
          ...baseShape,
          count: z
            .number()
            .int()
            .min(0)
            .max(5)
            .multipleOf(value)
            .default(0)
            .meta({ title: "數量" }),
        })
      );
    // 舊值都是 2 的倍數，不一定是 4 的倍數；反過來則一定是
    expect(kinds(step(2), step(4))).toEqual(["count limit-tightened"]);
    expect(kinds(step(4), step(2))).toEqual([]);
    expect(kinds(base, step(2))).toEqual(["count limit-tightened"]);
  });

  it("reports a changed pattern", () => {
    expect(
      kinds(
        base,
        changed({
          text: z
            .string()
            .min(1)
            .max(10)
            .regex(/^[a-z]+$/)
            .default("a")
            .meta({ title: "文字" }),
        })
      )
    ).toEqual(["text pattern-changed"]);
  });

  it("reports a new required property", () => {
    expect(
      kinds(base, changed({ need: z.string().meta({ title: "必填" }) }))
    ).toEqual(["need new-required"]);
    expect(
      kinds(base, changed({ href: link().meta({ title: "連結" }) }))
    ).toEqual(["href limit-tightened"]);
  });

  it("reports a new required link or image, whose default fails", () => {
    expect(
      kinds(base, changed({ cta: link().meta({ title: "按鈕連結" }) }))
    ).toEqual(["cta new-required"]);
    expect(
      kinds(base, changed({ photo: image().meta({ title: "照片" }) }))
    ).toEqual(["photo new-required"]);
    expect(
      kinds(
        base,
        changed({ more: link({ optional: true }).meta({ title: "更多" }) })
      )
    ).toEqual([]);
    // 清單項目裡新增必填連結，舊的項目同樣會被拒絕
    expect(
      kinds(
        base,
        changed({
          items: z
            .array(
              z.strictObject({
                label: z.string().max(20).meta({ title: "名稱" }),
                href: link().meta({ title: "網址" }),
              })
            )
            .max(5)
            .default(() => [])
            .meta({ title: "項目" }),
        })
      )
    ).toEqual(["items[].href new-required"]);
  });

  it("reports a narrowed slot", () => {
    expect(
      kinds(
        base,
        changed({ content: slot({ allow: ["Leaf"] }).meta({ title: "內容" }) })
      )
    ).toEqual(["content slot-narrowed"]);
    expect(
      kinds(
        base,
        changed({
          rest: slot({ disallow: ["Pair", "Box", "Leaf"] }).meta({
            title: "其他",
          }),
        })
      )
    ).toEqual(["rest slot-narrowed"]);
    expect(
      kinds(
        base,
        changed({
          content: slot({ disallow: ["Box"] }).meta({ title: "內容" }),
        })
      )
    ).toEqual(["content slot-narrowed"]);
    expect(
      kinds(
        base,
        changed({ rest: slot({ allow: ["Leaf"] }).meta({ title: "其他" }) })
      )
    ).toEqual(["rest slot-narrowed"]);
  });

  it("reports removed richtext features", () => {
    expect(
      kinds(
        base,
        changed({
          body: richText({ features: ["bold"] }).meta({ title: "內文" }),
        })
      )
    ).toEqual(["body richtext-features-removed"]);
  });

  it("reports an object that became strict", () => {
    const loose = structuredClone(base);
    loose.additionalProperties = true;
    expect(kinds(loose, base)).toEqual([" strictness-changed"]);
    expect(kinds(base, loose)).toEqual([]);
  });

  it("reports a changed field kind", () => {
    expect(
      kinds(base, changed({ text: link().meta({ title: "文字" }) }))
    ).toEqual(["text kind-changed"]);
    expect(
      kinds(
        base,
        changed({ text: choice(["字"]).default("字").meta({ title: "文字" }) })
      )
    ).toEqual(["text kind-changed"]);
    // 反過來（選項 → 任意文字）只是放寬
    expect(
      kinds(
        base,
        changed({ tone: z.string().default("a").meta({ title: "色調" }) })
      )
    ).toEqual([]);
    expect(
      kinds(
        base,
        changed({
          content: z
            .array(
              z.strictObject({
                type: z.string(),
                props: z.record(z.string(), z.unknown()),
              })
            )
            .default(() => [])
            .meta({ title: "內容" }),
        })
      )
    ).toEqual(["content kind-changed"]);
  });

  it("describes each break", () => {
    expect(
      diffContracts(
        base,
        changed({
          text: z.string().min(1).max(5).default("字").meta({ title: "文字" }),
        })
      )
    ).toEqual([
      { path: "text", kind: "limit-tightened", detail: "maxLength 10 → 5" },
    ]);
  });
});
