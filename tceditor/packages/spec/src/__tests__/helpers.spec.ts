import * as z from "zod";
import type { RichTextFeature, RichTextNode } from "@tzuchi/tceditor/rules";
import { choice, image, link, richText, slot, style, token } from "../helpers";
import type { SlotRule } from "../meta";
import { toJsonSchema } from "../json-schema";
import { kitchenSinkSpec } from "../__fixtures__/test-specs";

const OPTIONS = {
  target: "draft-2020-12",
  io: "input",
  reused: "inline",
  cycles: "ref",
} as const;

/** The JSON Schema of one field, as it appears inside a props object. */
const fieldSchema = (schema: z.ZodType) =>
  (
    z.toJSONSchema(z.strictObject({ f: schema }), OPTIONS) as unknown as {
      properties: { f: Record<string, unknown> };
    }
  ).properties.f;

const issuesOf = (schema: z.ZodType, value: unknown) => {
  const result = z
    .strictObject({ f: schema })
    .safeParse(value === undefined ? {} : { f: value });

  return result.success
    ? []
    : result.error.issues.map((issue) => ({
        code: issue.code,
        path: issue.path,
        ...("params" in issue && issue.params ? { params: issue.params } : {}),
      }));
};

const KITCHEN_SINK = toJsonSchema(kitchenSinkSpec) as {
  properties: Record<string, Record<string, unknown>>;
};

describe("choice, style and token", () => {
  it("emit an enum and keep the helper meta under the author's meta", () => {
    expect(KITCHEN_SINK.properties.tone).toEqual({
      default: "calm",
      title: "色調",
      "x-labels": {
        calm: "沉穩",
        bright: "明亮",
        dark: "深色",
        warm: "暖色",
        cool: "冷色",
      },
      type: "string",
      enum: ["calm", "bright", "dark", "warm", "cool"],
    });
    expect(KITCHEN_SINK.properties.size).toMatchObject({
      enum: ["sm", "md", "lg"],
      "x-style": { component: "button", key: "size" },
      "x-labels": { sm: "小", md: "中", lg: "大" },
    });
    expect(KITCHEN_SINK.properties.space).toMatchObject({
      enum: ["16", "32"],
      "x-token": { group: "space" },
    });
  });

  it("parse only the listed values", () => {
    const size = style("button", "size", ["sm", "md"]);

    expect(size.parse("md")).toBe("md");
    expect(issuesOf(size, "xl")).toEqual([
      { code: "invalid_value", path: ["f"] },
    ]);
  });

  it("reject empty or duplicate values", () => {
    expect(() => choice([""])).toThrow(TypeError);
    expect(() => choice(["a", "a"])).toThrow("duplicate value");
    expect(() => style("", "size", ["sm"])).toThrow(TypeError);
    expect(() => token("", ["16"])).toThrow(TypeError);
  });
});

describe("link", () => {
  const UNSAFE = [
    "javascript:alert(1)",
    "JaVaScRiPt:alert(1)",
    " javascript:alert(1)",
    "java\tscript:alert(1)",
    "&#106;avascript:alert(1)",
    "data:text/html,<b>x</b>",
    "vbscript:msgbox(1)",
  ];

  it("emits the required link as a non-empty string with an empty default", () => {
    expect(KITCHEN_SINK.properties.href).toEqual({
      "x-link": { optional: false },
      "x-lost-checks": ["safe-href"],
      title: "連結網址",
      default: "",
      type: "string",
      minLength: 1,
      maxLength: 2048,
    });
  });

  it("emits the optional link without minLength", () => {
    expect(KITCHEN_SINK.properties.moreHref).toEqual({
      default: "",
      "x-link": { optional: true },
      "x-lost-checks": ["safe-href"],
      title: "更多連結",
      type: "string",
      maxLength: 2048,
    });
  });

  it("accepts http, https, mailto, tel and relative links", () => {
    for (const href of [
      "/register",
      "https://tzuchi.org.tw",
      "http://example.org/a?b#c",
      "mailto:info@tzuchi.org.tw",
      "tel:+886-3-856-1825",
      "#top",
    ]) {
      expect(issuesOf(link(), href)).toEqual([]);
      expect(issuesOf(link({ optional: true }), href)).toEqual([]);
    }
  });

  it.each(UNSAFE)("rejects %j with the unsafe_href code", (href) => {
    const expected = [
      { code: "custom", path: ["f"], params: { code: "unsafe_href" } },
    ];

    expect(issuesOf(link(), href)).toEqual(expected);
    expect(issuesOf(link({ optional: true }), href)).toEqual(expected);
  });

  it("reports a missing or empty required link once, as too_small", () => {
    expect(issuesOf(link(), undefined)).toEqual([
      { code: "too_small", path: ["f"] },
    ]);
    expect(issuesOf(link(), "")).toEqual([{ code: "too_small", path: ["f"] }]);
  });

  it("reports a link over 2,048 characters once, as too_big", () => {
    const long = `/${"a".repeat(2048)}`;

    expect(issuesOf(link(), long)).toEqual([{ code: "too_big", path: ["f"] }]);
    expect(issuesOf(link({ optional: true }), long)).toEqual([
      { code: "too_big", path: ["f"] },
    ]);
    expect(issuesOf(link(), `/${"a".repeat(2047)}`)).toEqual([]);
  });

  it("lets the optional link be empty or missing", () => {
    const schema = z.strictObject({ f: link({ optional: true }) });

    expect(schema.parse({})).toEqual({ f: "" });
    expect(schema.parse({ f: "" })).toEqual({ f: "" });
  });

  it("leaves the message to the caller's error map", () => {
    const result = z
      .strictObject({ f: link() })
      .safeParse({ f: "javascript:alert(1)" }, { error: () => "自訂訊息" });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("自訂訊息");
  });
});

describe("richText", () => {
  const bodyOnly = () => richText({ features: ["bold", "link"] });

  const collect = (nodes: RichTextNode[] | undefined, out: RichTextNode[]) => {
    for (const node of nodes ?? []) {
      out.push(node);
      collect(node.content, out);
    }

    return out;
  };

  const INPUT = {
    type: "doc",
    content: [
      {
        type: "heading",
        attrs: { level: 2, textAlign: "center" },
        content: [{ type: "text", text: "標題" }],
      },
      {
        type: "paragraph",
        attrs: { textAlign: "right" },
        content: [
          { type: "text", text: "粗", marks: [{ type: "bold" }] },
          { type: "text", text: "斜", marks: [{ type: "italic" }] },
          {
            type: "text",
            text: "壞連結",
            marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }],
          },
          {
            type: "text",
            text: "好連結",
            marks: [{ type: "link", attrs: { href: "https://tzuchi.org.tw" } }],
          },
        ],
      },
      {
        type: "blockquote",
        content: [
          { type: "paragraph", content: [{ type: "text", text: "引言" }] },
        ],
      },
      { type: "evil", content: [{ type: "text", text: "怪" }] },
    ],
    evil: true,
  };

  it("emits an object with the features and the lost check", () => {
    expect(fieldSchema(bodyOnly())).toEqual({
      type: "object",
      properties: { type: { type: "string", const: "doc" } },
      required: ["type"],
      additionalProperties: {},
      "x-richtext": { features: ["bold", "link"] },
      "x-lost-checks": ["richtext-normalize"],
    });
  });

  it("normalizes, then keeps only the listed features", () => {
    const output = bodyOnly().parse(INPUT);
    const nodes = collect(output.content, []);

    expect(Object.keys(output)).toEqual(["type", "content"]);
    // The heading and the blockquote become paragraphs, the unknown node keeps
    // its text.
    expect(output.content?.map((node) => node.type)).toEqual([
      "paragraph",
      "paragraph",
      "paragraph",
      "paragraph",
    ]);
    expect(
      [...new Set(nodes.map((node) => node.type))].sort((a, b) =>
        a.localeCompare(b)
      )
    ).toEqual(["paragraph", "text"]);
    // italic and the unsafe link are dropped, so their texts merge.
    expect(output.content?.[1].content).toEqual([
      { type: "text", marks: [{ type: "bold" }], text: "粗" },
      { type: "text", text: "斜壞連結" },
      {
        type: "text",
        marks: [
          {
            type: "link",
            attrs: {
              href: "https://tzuchi.org.tw",
              target: "_blank",
              rel: "noopener noreferrer nofollow",
              class: null,
              title: null,
            },
          },
        ],
        text: "好連結",
      },
    ]);
    expect(
      nodes
        .filter((node) => node.type === "text")
        .map((node) => node.text)
        .join("")
    ).toBe("標題粗斜壞連結好連結引言怪");
  });

  it("removes text alignment, leaving no attrs", () => {
    const output = bodyOnly().parse(INPUT);

    // The shape an editor without TextAlign emits: textAlign is removed, and
    // so is the attrs object it leaves empty.
    for (const node of output.content ?? []) {
      expect(node).not.toHaveProperty("attrs");
    }
  });

  it("keeps a document it has already cleaned as it is", () => {
    const once = bodyOnly().parse(INPUT);

    expect(bodyOnly().parse(once)).toEqual(once);
  });

  it("keeps the test spec's default body on a second parse", () => {
    // .default() skips .overwrite(), so the default must already be clean.
    const once = kitchenSinkSpec.props.parse(kitchenSinkSpec.examples[0].props);

    expect(once.body).toStrictEqual({
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "內文" }] },
      ],
    });
    expect(kitchenSinkSpec.props.parse(once)).toEqual(once);
  });

  it("rejects strings and documents of another type", () => {
    expect(issuesOf(bodyOnly(), "<b>legacy</b>")).toEqual([
      { code: "invalid_type", path: ["f"] },
    ]);
    expect(issuesOf(bodyOnly(), { type: "paragraph" })).toEqual([
      { code: "invalid_value", path: ["f", "type"] },
    ]);
  });

  it("rejects unknown or duplicate features", () => {
    expect(() =>
      richText({ features: ["bold", "italics" as RichTextFeature] })
    ).toThrow(TypeError);
    expect(() => richText({ features: ["bold", "bold"] })).toThrow(
      "duplicate feature"
    );
  });
});

describe("slot", () => {
  it("emits an array of { type, props } items with an empty default", () => {
    expect(KITCHEN_SINK.properties.content).toEqual({
      default: [],
      "x-slot": { allow: ["Leaf"] },
      title: "內容",
      type: "array",
      items: {
        type: "object",
        properties: {
          type: { type: "string" },
          props: {
            type: "object",
            propertyNames: { type: "string" },
            additionalProperties: {},
          },
        },
        required: ["type", "props"],
        additionalProperties: false,
      },
    });
  });

  it("defaults to a new empty array and passes child props through", () => {
    const schema = z.strictObject({ content: slot({ allow: ["Leaf"] }) });
    const first = schema.parse({});
    const child = { type: "Leaf", props: { id: "a", text: "x" } };
    const parsed = schema.parse({ content: [child] });

    expect(first).toEqual({ content: [] });
    expect(schema.parse({}).content).not.toBe(first.content);
    expect(parsed.content).toEqual([child]);
    expect(parsed.content[0].props).not.toBe(child.props);
  });

  it("rejects other keys on a child", () => {
    expect(
      issuesOf(slot({ allow: ["Leaf"] }), [
        { type: "Leaf", props: {}, readOnly: {} },
      ])
    ).toEqual([{ code: "unrecognized_keys", path: ["f", 0] }]);
  });

  it("needs exactly one non-empty allow or disallow list", () => {
    expect(() =>
      slot({ allow: ["Leaf"], disallow: ["Box"] } as unknown as SlotRule)
    ).toThrow(TypeError);
    expect(() => slot({} as SlotRule)).toThrow(TypeError);
    expect(() => slot({ allow: [] })).toThrow(TypeError);
    expect(() => slot({ disallow: [""] })).toThrow(TypeError);
  });

  it("copies the rule", () => {
    const allow = ["Leaf"];
    const schema = slot({ allow });

    allow.push("Box");
    expect(fieldSchema(schema)["x-slot"]).toEqual({ allow: ["Leaf"] });
  });
});

describe("image", () => {
  it("emits a strict object with the incomplete default", () => {
    expect(KITCHEN_SINK.properties.picture).toEqual({
      "x-image": true,
      "x-lost-checks": ["alt-required"],
      title: "圖片",
      default: { assetId: "", alt: "", decorative: false },
      type: "object",
      properties: {
        assetId: {
          type: "string",
          pattern: "^[A-Za-z0-9_-]{1,64}$",
          title: "圖片",
        },
        alt: { type: "string", maxLength: 200, title: "替代文字" },
        decorative: { type: "boolean", title: "裝飾用圖片" },
      },
      required: ["assetId", "alt", "decorative"],
      additionalProperties: false,
    });
  });

  it("fails a missing image at assetId and alt", () => {
    expect(issuesOf(image(), undefined)).toEqual([
      { code: "invalid_format", path: ["f", "assetId"] },
      { code: "custom", path: ["f", "alt"], params: { code: "alt_required" } },
    ]);
  });

  it("requires alt text unless the image is decorative", () => {
    expect(
      issuesOf(image(), { assetId: "demo-1", alt: "示意圖", decorative: false })
    ).toEqual([]);
    expect(
      issuesOf(image(), { assetId: "demo-1", alt: "", decorative: true })
    ).toEqual([]);
    expect(
      issuesOf(image(), { assetId: "demo-1", alt: "  ", decorative: false })
    ).toEqual([
      { code: "custom", path: ["f", "alt"], params: { code: "alt_required" } },
    ]);
  });

  it("checks the asset id, the alt length and unknown keys", () => {
    expect(
      issuesOf(image(), { assetId: "bad id!", alt: "a", decorative: false })
    ).toEqual([{ code: "invalid_format", path: ["f", "assetId"] }]);
    expect(
      issuesOf(image(), {
        assetId: "a".repeat(65),
        alt: "a",
        decorative: false,
      })
    ).toEqual([{ code: "invalid_format", path: ["f", "assetId"] }]);
    expect(
      issuesOf(image(), {
        assetId: "demo-1",
        alt: "字".repeat(201),
        decorative: false,
      })
    ).toEqual([{ code: "too_big", path: ["f", "alt"] }]);
    expect(
      issuesOf(image(), {
        assetId: "demo-1",
        alt: "a",
        decorative: false,
        src: "https://evil.example",
      })
    ).toEqual([{ code: "unrecognized_keys", path: ["f"] }]);
  });
});
