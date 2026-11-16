import * as z from "zod";
import { defineBlockSpec } from "../define";
import {
  JSON_SCHEMA_OPTIONS,
  eachField,
  fieldPathKey,
  toJsonSchema,
} from "../json-schema";
import type { JsonSchema } from "../json-schema";
import {
  kitchenSinkSpec,
  pairSpec,
  testRoot,
} from "../__fixtures__/test-specs";

const visits = (schema: JsonSchema) => {
  const out: {
    key: string;
    name: string;
    required: boolean;
    title: unknown;
  }[] = [];

  eachField(schema, ({ path, name, node, parentRequired }) => {
    out.push({
      key: fieldPathKey(path),
      name,
      required: parentRequired,
      title: node.title,
    });
  });

  return out;
};

describe("toJsonSchema", () => {
  it("uses the spec §5.1 settings", () => {
    expect(JSON_SCHEMA_OPTIONS).toEqual({
      target: "draft-2020-12",
      io: "input",
      reused: "inline",
      cycles: "ref",
    });
    expect(toJsonSchema(testRoot)).toEqual({
      $schema: "https://json-schema.org/draft/2020-12/schema",
      type: "object",
      properties: {
        title: {
          default: "未命名頁面",
          title: "頁面標題",
          type: "string",
          minLength: 1,
          maxLength: 80,
        },
        description: {
          default: "",
          title: "頁面說明",
          "x-field": "textarea",
          type: "string",
          maxLength: 160,
        },
      },
      additionalProperties: false,
    });
  });

  it("returns the same deeply frozen object on every call", () => {
    const schema = toJsonSchema(kitchenSinkSpec);
    const properties = schema.properties as Record<string, JsonSchema>;

    expect(toJsonSchema(kitchenSinkSpec)).toBe(schema);
    expect(Object.isFrozen(schema)).toBe(true);
    expect(Object.isFrozen(properties.items.items)).toBe(true);
    expect(Object.isFrozen(properties.picture.default)).toBe(true);
    expect(() => {
      properties.title = {};
    }).toThrow(TypeError);
  });

  it("lists only the fields without defaults as required", () => {
    const spec = defineBlockSpec({
      type: "Required",
      label: "必填",
      category: "測試",
      description: "",
      version: 1,
      props: z.strictObject({
        name: z.string().meta({ title: "名稱" }),
        note: z.string().default("").meta({ title: "備註" }),
      }),
      examples: [{ name: "x", props: { name: "a" } }],
    });

    expect(toJsonSchema(spec).required).toEqual(["name"]);
    expect(toJsonSchema(kitchenSinkSpec).required).toBeUndefined();
  });
});

describe("eachField", () => {
  it("visits fields depth-first and does not enter slots, rich text or images", () => {
    expect(visits(toJsonSchema(kitchenSinkSpec))).toEqual([
      { key: "title", name: "title", required: false, title: "標題" },
      { key: "note", name: "note", required: false, title: "備註" },
      { key: "count", name: "count", required: false, title: "數量" },
      { key: "tone", name: "tone", required: false, title: "色調" },
      { key: "size", name: "size", required: false, title: "大小" },
      { key: "space", name: "space", required: false, title: "間距" },
      { key: "enabled", name: "enabled", required: false, title: "啟用" },
      { key: "href", name: "href", required: false, title: "連結網址" },
      { key: "moreHref", name: "moreHref", required: false, title: "更多連結" },
      { key: "body", name: "body", required: false, title: "內文" },
      { key: "items", name: "items", required: false, title: "項目" },
      { key: "items[].label", name: "label", required: true, title: "名稱" },
      { key: "group", name: "group", required: false, title: "群組" },
      { key: "group.caption", name: "caption", required: false, title: "說明" },
      { key: "group.level", name: "level", required: false, title: "層級" },
      { key: "content", name: "content", required: false, title: "內容" },
      { key: "picture", name: "picture", required: false, title: "圖片" },
    ]);
  });

  it("gives array items the [] path segment", () => {
    const paths: (readonly string[])[] = [];

    eachField(toJsonSchema(pairSpec), ({ path }) => paths.push(path));
    expect(paths).toEqual([["columns"], ["columns", "[]", "content"]]);
  });

  it("joins paths for messages", () => {
    expect(fieldPathKey(["columns", "[]", "content"])).toBe(
      "columns[].content"
    );
    expect(fieldPathKey(["group", "level"])).toBe("group.level");
    expect(fieldPathKey([])).toBe("");
  });
});
