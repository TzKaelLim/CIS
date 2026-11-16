import type { ArrayField, Field } from "@tzuchi/tceditor";
import * as z from "zod";
import { defineBlockSpec } from "../../define";
import {
  boxSpec,
  kitchenSinkSpec,
  leafSpec,
  pairSpec,
  testRoot,
} from "../../__fixtures__/test-specs";
import { toDefaultProps, toPuckFields } from "../puck-fields";

const imageField: Field = {
  type: "custom",
  label: "圖片",
  render: () => {
    throw new Error("not rendered in this test");
  },
};

const arrayFieldOf = (field: Field | undefined): ArrayField => {
  if (field?.type !== "array") throw new Error("expected an array field");
  return field as ArrayField;
};

describe("toPuckFields", () => {
  it("maps every field kind of KitchenSink", () => {
    const image = jest.fn(() => imageField);
    const fields = toPuckFields(kitchenSinkSpec, { image });

    expect(fields).toEqual({
      title: { type: "text", label: "標題", contentEditable: true },
      note: { type: "textarea", label: "備註" },
      count: { type: "number", label: "數量", min: 1, max: 10, step: 1 },
      tone: {
        type: "select",
        label: "色調",
        options: [
          { label: "沉穩", value: "calm" },
          { label: "明亮", value: "bright" },
          { label: "深色", value: "dark" },
          { label: "暖色", value: "warm" },
          { label: "冷色", value: "cool" },
        ],
      },
      size: {
        type: "radio",
        label: "大小",
        options: [
          { label: "小", value: "sm" },
          { label: "中", value: "md" },
          { label: "大", value: "lg" },
        ],
      },
      space: {
        type: "radio",
        label: "間距",
        options: [
          { label: "小", value: "16" },
          { label: "大", value: "32" },
        ],
      },
      enabled: {
        type: "radio",
        label: "啟用",
        options: [
          { label: "是", value: true },
          { label: "否", value: false },
        ],
      },
      href: { type: "text", label: "連結網址" },
      moreHref: { type: "text", label: "更多連結" },
      body: {
        type: "richtext",
        label: "內文",
        contentEditable: true,
        options: {
          italic: false,
          underline: false,
          strike: false,
          code: false,
          bulletList: false,
          orderedList: false,
          blockquote: false,
          heading: false,
          horizontalRule: false,
          hardBreak: false,
          codeBlock: false,
          listItem: false,
          textAlign: false,
        },
      },
      items: {
        type: "array",
        label: "項目",
        min: 1,
        max: 5,
        arrayFields: { label: { type: "text", label: "名稱" } },
        getItemSummary: expect.any(Function),
      },
      group: {
        type: "object",
        label: "群組",
        objectFields: {
          caption: { type: "text", label: "說明" },
          level: { type: "number", label: "層級", min: 0, max: 3, step: 1 },
        },
      },
      content: { type: "slot", label: "內容", allow: ["Leaf"] },
      picture: imageField,
    });
    expect(image).toHaveBeenCalledTimes(1);
    expect(image).toHaveBeenCalledWith({ name: "picture", label: "圖片" });
  });

  it("maps Box, Leaf, Pair and the page root", () => {
    expect(toPuckFields(boxSpec)).toEqual({
      content: { type: "slot", label: "內容", allow: ["Box", "Leaf"] },
    });
    expect(toPuckFields(leafSpec)).toEqual({
      text: { type: "text", label: "文字" },
    });
    expect(toPuckFields(pairSpec)).toEqual({
      columns: {
        type: "array",
        label: "欄",
        min: 2,
        max: 3,
        arrayFields: {
          content: { type: "slot", label: "內容", disallow: ["Pair"] },
        },
        defaultItemProps: expect.any(Function),
        getItemSummary: expect.any(Function),
      },
    });
    expect(toPuckFields(testRoot)).toEqual({
      title: { type: "text", label: "頁面標題" },
      description: { type: "textarea", label: "頁面說明" },
    });
  });

  it("summarises array items with the x-item-label template", () => {
    const columns = arrayFieldOf(toPuckFields(pairSpec).columns);
    expect(columns.getItemSummary?.({ content: [] }, 0)).toBe("第 1 欄");
    expect(columns.getItemSummary?.({ content: [] }, 1)).toBe("第 2 欄");
    expect(columns.getItemSummary?.({ content: [] })).toBe("第 欄");

    const items = arrayFieldOf(
      toPuckFields(kitchenSinkSpec, { image: () => imageField }).items
    );
    expect(items.getItemSummary?.({ label: "志工" }, 0)).toBe("志工");
    expect(items.getItemSummary?.({ label: "" }, 2)).toBe("第 3 項");
    expect(items.getItemSummary?.({}, 0)).toBe("第 1 項");
    // 只讀項目自己的屬性，不會讀到 Object.prototype
    const tricky = defineBlockSpec({
      type: "Tricky",
      label: "測試",
      category: "測試",
      description: "x-item-label 指到 Object.prototype 的名稱。",
      version: 1,
      props: z.strictObject({
        rows: z
          .array(
            z.strictObject({
              label: z.string().default("").meta({ title: "名稱" }),
            })
          )
          .default(() => [])
          .meta({ title: "列", "x-item-label": "{constructor}{label}" }),
      }),
      examples: [{ name: "預設", props: {} }],
    });
    const rows = arrayFieldOf(toPuckFields(tricky).rows);
    expect(rows.getItemSummary?.({ label: "甲" }, 0)).toBe("甲");
  });

  it("builds fresh default item props from the item schema", () => {
    const columns = arrayFieldOf(toPuckFields(pairSpec).columns);
    const make = columns.defaultItemProps as (index: number) => unknown;
    const first = make(0);
    expect(first).toEqual({ content: [] });
    expect(make(1)).not.toBe(first);
  });

  it("copies the slot rule so the editor can never mutate the spec", () => {
    const fields = toPuckFields(boxSpec);
    const content = fields.content as { allow?: string[] };
    content.allow?.push("Pair");
    expect(toPuckFields(boxSpec).content).toEqual({
      type: "slot",
      label: "內容",
      allow: ["Box", "Leaf"],
    });
  });

  it("requires an image factory when the spec has an image field", () => {
    expect(() => toPuckFields(kitchenSinkSpec)).toThrow(TypeError);
    expect(() => toPuckFields(kitchenSinkSpec)).toThrow(
      'toPuckFields: "KitchenSink.picture" is an image field; pass factories.image'
    );
  });

  it("treats zod's safe-integer bounds as no bounds", () => {
    const numbers = defineBlockSpec({
      type: "Numbers",
      label: "數字",
      category: "測試",
      description: "沒有上下限的數字。",
      version: 1,
      props: z.strictObject({
        whole: z.number().int().default(0).meta({ title: "整數" }),
        ratio: z.number().default(1.5).meta({ title: "比例" }),
        floor: z.number().int().min(0).default(0).meta({ title: "下限" }),
      }),
      examples: [{ name: "預設", props: {} }],
    });
    expect(toPuckFields(numbers)).toEqual({
      whole: { type: "number", label: "整數", step: 1 },
      ratio: { type: "number", label: "比例" },
      floor: { type: "number", label: "下限", min: 0, step: 1 },
    });
  });
});

describe("toDefaultProps", () => {
  it("returns every default, including the prefaulted href and picture", () => {
    expect(toDefaultProps(kitchenSinkSpec)).toEqual({
      title: "標題",
      note: "",
      count: 3,
      tone: "calm",
      size: "md",
      space: "16",
      enabled: true,
      href: "",
      moreHref: "",
      // fixture 的預設值已依 bold、link 清理：textAlign 被移除，段落沒有 attrs
      body: {
        type: "doc",
        content: [
          { type: "paragraph", content: [{ type: "text", text: "內文" }] },
        ],
      },
      items: [{ label: "一" }],
      group: { caption: "", level: 0 },
      content: [],
      picture: { assetId: "", alt: "", decorative: false },
    });
    expect(toDefaultProps(pairSpec)).toEqual({
      columns: [{ content: [] }, { content: [] }],
    });
    expect(toDefaultProps(boxSpec)).toEqual({ content: [] });
    expect(toDefaultProps(leafSpec)).toEqual({ text: "葉子" });
    expect(toDefaultProps(testRoot)).toEqual({
      title: "未命名頁面",
      description: "",
    });
  });

  it("deep-clones, so changing one result never changes the next", () => {
    const first = toDefaultProps(kitchenSinkSpec);
    if (!first.items || !first.group) throw new Error("missing defaults");
    expect(Object.isFrozen(first.group)).toBe(false);
    first.items[0].label = "改過";
    first.group.level = 3;
    const second = toDefaultProps(kitchenSinkSpec);
    expect(second.items).toEqual([{ label: "一" }]);
    expect(second.group).toEqual({ caption: "", level: 0 });
  });
});
