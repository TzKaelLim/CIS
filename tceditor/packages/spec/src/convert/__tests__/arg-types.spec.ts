import * as z from "zod";
import { defineBlockSpec } from "../../define";
import { toJsonSchema } from "../../json-schema";
import { kitchenSinkSpec, pairSpec } from "../../__fixtures__/test-specs";
import { toArgTypes, toStoryArgs } from "../arg-types";
import { toDefaultProps } from "../puck-fields";

describe("toArgTypes", () => {
  it("maps every field kind of KitchenSink", () => {
    expect(toArgTypes(kitchenSinkSpec)).toEqual({
      title: {
        name: "標題",
        control: { type: "text" },
        table: { defaultValue: { summary: '"標題"' } },
      },
      note: {
        name: "備註",
        control: { type: "text" },
        table: { defaultValue: { summary: '""' } },
      },
      count: {
        name: "數量",
        control: { type: "range", min: 1, max: 10, step: 1 },
        table: { defaultValue: { summary: "3" } },
      },
      tone: {
        name: "色調",
        options: ["calm", "bright", "dark", "warm", "cool"],
        control: {
          type: "select",
          labels: {
            calm: "沉穩",
            bright: "明亮",
            dark: "深色",
            warm: "暖色",
            cool: "冷色",
          },
        },
        table: { defaultValue: { summary: '"calm"' } },
      },
      size: {
        name: "大小",
        options: ["sm", "md", "lg"],
        control: { type: "radio", labels: { sm: "小", md: "中", lg: "大" } },
        table: { defaultValue: { summary: '"md"' } },
      },
      space: {
        name: "間距",
        options: ["16", "32"],
        control: { type: "radio", labels: { "16": "小", "32": "大" } },
        table: { defaultValue: { summary: '"16"' } },
      },
      enabled: {
        name: "啟用",
        control: { type: "boolean" },
        table: { defaultValue: { summary: "true" } },
      },
      href: {
        name: "連結網址",
        control: { type: "text" },
        table: { defaultValue: { summary: '""' } },
      },
      moreHref: {
        name: "更多連結",
        control: { type: "text" },
        table: { defaultValue: { summary: '""' } },
      },
      body: { name: "內文", control: false },
      items: { name: "項目", control: { type: "object" } },
      group: { name: "群組", control: { type: "object" } },
      content: { name: "內容", control: false },
      picture: { name: "圖片", control: false },
    });
  });

  it("uses range only when both ends are bounded", () => {
    const numbers = defineBlockSpec({
      type: "Numbers",
      label: "數字",
      category: "測試",
      description: "上下限不同的數字。",
      version: 1,
      props: z.strictObject({
        both: z.number().min(0).max(1).default(0.5).meta({ title: "兩端" }),
        floor: z.number().int().min(0).default(0).meta({ title: "下限" }),
        whole: z.number().int().default(0).meta({ title: "整數" }),
        fives: z
          .number()
          .int()
          .min(0)
          .max(100)
          .multipleOf(5)
          .default(0)
          .meta({ title: "五的倍數" }),
      }),
      examples: [{ name: "預設", props: {} }],
    });
    const argTypes = toArgTypes(numbers);
    // Storybook 的 range 預設 step 為 1，小數範圍要自己給
    expect(argTypes.both.control).toEqual({
      type: "range",
      min: 0,
      max: 1,
      step: 0.01,
    });
    expect(argTypes.fives.control).toEqual({
      type: "range",
      min: 0,
      max: 100,
      step: 5,
    });
    expect(argTypes.floor.control).toEqual({
      type: "number",
      min: 0,
      step: 1,
    });
    expect(argTypes.whole.control).toEqual({ type: "number", step: 1 });
  });

  it("copies the field description", () => {
    const described = defineBlockSpec({
      type: "Described",
      label: "說明",
      category: "測試",
      description: "欄位有 description。",
      version: 1,
      props: z.strictObject({
        text: z
          .string()
          .default("")
          .meta({ title: "文字", description: "顯示在按鈕上" }),
      }),
      examples: [{ name: "預設", props: {} }],
    });
    expect(toArgTypes(described).text.description).toBe("顯示在按鈕上");
  });

  it("uses the spec field names as keys", () => {
    expect(Object.keys(toArgTypes(pairSpec))).toEqual(["columns"]);
    expect(Object.keys(toArgTypes(kitchenSinkSpec))).toEqual(
      Object.keys(toJsonSchema(kitchenSinkSpec).properties as object)
    );
  });
});

describe("toStoryArgs", () => {
  it("equals the default props", () => {
    expect(toStoryArgs(kitchenSinkSpec)).toEqual(
      toDefaultProps(kitchenSinkSpec)
    );
    expect(toStoryArgs(pairSpec)).toEqual({
      columns: [{ content: [] }, { content: [] }],
    });
  });
});
