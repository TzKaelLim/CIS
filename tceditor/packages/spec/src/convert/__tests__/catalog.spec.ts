import Ajv2020 from "ajv/dist/2020";
import * as z from "zod";
import { defineBlockSpec } from "../../define";
import { link, slot } from "../../helpers";
import { toJsonSchema, type JsonSchema } from "../../json-schema";
import { X_KEYS } from "../../meta";
import {
  boxSpec,
  kitchenSinkSpec,
  leafSpec,
  pairSpec,
  testBlocks,
  testRoot,
} from "../../__fixtures__/test-specs";
import { CATALOG_VERSION, buildCatalog } from "../catalog";

/** 在任意 JSON 值裡找出名為 keys 的 key，回傳它們的路徑。 */
function findKeys(
  value: unknown,
  keys: readonly string[],
  path = ""
): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) =>
      findKeys(item, keys, `${path}[${index}]`)
    );
  }
  if (typeof value === "object" && value !== null) {
    return Object.entries(value).flatMap(([key, child]) => [
      ...(keys.includes(key) ? [`${path}.${key}`] : []),
      ...findKeys(child, keys, `${path}.${key}`),
    ]);
  }
  return [];
}

const oldSpec = defineBlockSpec({
  type: "Old",
  label: "舊區塊",
  category: "測試",
  description: "已停用的測試區塊。",
  version: 1,
  deprecated: true,
  props: z.strictObject({
    text: z.string().default("").meta({ title: "文字" }),
  }),
  examples: [{ name: "預設", props: {} }],
});

const holderSpec = defineBlockSpec({
  type: "Holder",
  label: "容器",
  category: "測試",
  description: "允許清單裡有停用區塊的測試區塊。",
  version: 1,
  props: z.strictObject({
    content: slot({ allow: ["Old", "Leaf"] }).meta({ title: "內容" }),
  }),
  examples: [{ name: "預設", props: {} }],
});

describe("buildCatalog", () => {
  const catalog = buildCatalog({ blocks: testBlocks, root: testRoot });

  it("has the catalog header and the validator limits", () => {
    expect(CATALOG_VERSION).toBe(1);
    expect(catalog.catalogVersion).toBe(1);
    expect(catalog.nodeIdPattern).toBe("^[A-Za-z0-9_-]{1,64}$");
    expect(catalog.limits).toEqual({
      maxBytes: 2097152,
      maxDepth: 32,
      maxBlocks: 5000,
    });
  });

  it("lists the blocks in registration order with their metadata", () => {
    expect(catalog.blocks.map((block) => block.type)).toEqual([
      "KitchenSink",
      "Box",
      "Leaf",
      "Pair",
    ]);
    const { props, slots, examples, ...meta } = catalog.blocks[0];
    expect(meta).toEqual({
      type: "KitchenSink",
      label: "全欄位",
      category: "測試",
      description: "涵蓋 11 種欄位的測試區塊。",
      version: 1,
      deprecated: false,
    });
    expect(Object.keys(props.properties as object)).toEqual([
      "title",
      "note",
      "count",
      "tone",
      "size",
      "space",
      "enabled",
      "href",
      "moreHref",
      "body",
      "items",
      "group",
      "content",
      "picture",
    ]);
    expect(slots).toEqual({ content: ["Leaf"] });
    expect(examples).toEqual(kitchenSinkSpec.examples);
  });

  it("has no $ref, oneOf, anyOf or allOf and an object root", () => {
    expect(findKeys(catalog, ["$ref", "oneOf", "anyOf", "allOf"])).toEqual([]);
    for (const block of catalog.blocks) {
      expect(block.props.type).toBe("object");
      expect(block.props.additionalProperties).toBe(false);
    }
    expect(catalog.root.props.type).toBe("object");
  });

  it("marks the required link and image as required, since their defaults fail", () => {
    expect(catalog.blocks[0].props.required).toEqual(["href", "picture"]);
    expect(toJsonSchema(kitchenSinkSpec).required).toBeUndefined();
    const withList = buildCatalog({
      blocks: [
        defineBlockSpec({
          type: "Links",
          label: "連結清單",
          category: "測試",
          description: "清單項目裡有必填連結。",
          version: 1,
          props: z.strictObject({
            links: z
              .array(
                z.strictObject({
                  text: z.string().default("").meta({ title: "文字" }),
                  href: link().meta({ title: "網址" }),
                  more: link({ optional: true }).meta({ title: "更多" }),
                })
              )
              .default(() => [])
              .meta({ title: "連結" }),
          }),
          examples: [{ name: "預設", props: {} }],
        }),
      ],
      root: testRoot,
    });
    const links = withList.blocks[0].props.properties as Record<
      string,
      { items: JsonSchema }
    >;
    expect(withList.blocks[0].props.required).toBeUndefined();
    expect(links.links.items.required).toEqual(["href"]);
  });

  it("strips the editor-only keys and keeps the ones AI needs", () => {
    expect(
      findKeys(catalog, [
        "$schema",
        "x-inline",
        "x-field",
        "x-item-label",
        "x-style",
        "x-token",
        "x-slot",
      ])
    ).toEqual([]);
    const properties = catalog.blocks[0].props.properties as Record<
      string,
      Record<string, unknown>
    >;
    expect(properties.title).toEqual({
      default: "標題",
      title: "標題",
      type: "string",
      minLength: 1,
      maxLength: 40,
    });
    expect(properties.tone["x-labels"]).toEqual({
      calm: "沉穩",
      bright: "明亮",
      dark: "深色",
      warm: "暖色",
      cool: "冷色",
    });
    expect(properties.href["x-lost-checks"]).toEqual(["safe-href"]);
    expect(properties.href["x-link"]).toEqual({ optional: false });
    expect(properties.body["x-richtext"]).toEqual({
      features: ["bold", "link"],
    });
    expect(properties.body["x-lost-checks"]).toEqual(["richtext-normalize"]);
    expect(properties.picture["x-image"]).toBe(true);
    expect(properties.picture["x-lost-checks"]).toEqual(["alt-required"]);
    // 規格本身的 JSON Schema 不受影響（它是凍結、共用的）
    const original = toJsonSchema(kitchenSinkSpec).properties as Record<
      string,
      Record<string, unknown>
    >;
    expect(original.size["x-style"]).toEqual({
      component: "button",
      key: "size",
    });
  });

  it("expands slot rules into explicit lists", () => {
    expect(catalog.blocks.map((block) => block.slots)).toEqual([
      { content: ["Leaf"] },
      { content: ["Box", "Leaf"] },
      {},
      { "columns[].content": ["KitchenSink", "Box", "Leaf"] },
    ]);
  });

  it("leaves deprecated blocks out of every slot list but keeps them in blocks", () => {
    const withOld = buildCatalog({
      blocks: [...testBlocks, oldSpec, holderSpec],
      root: testRoot,
    });
    const byType = Object.fromEntries(
      withOld.blocks.map((block) => [block.type, block])
    );
    expect(byType.Old.deprecated).toBe(true);
    expect(byType.Pair.slots).toEqual({
      "columns[].content": ["KitchenSink", "Box", "Leaf", "Holder"],
    });
    expect(byType.Holder.slots).toEqual({ content: ["Leaf"] });
  });

  it("copies examples verbatim without filling defaults", () => {
    expect(catalog.blocks[2].examples).toEqual([{ name: "預設", props: {} }]);
    expect(catalog.blocks[3].examples).toEqual(pairSpec.examples);
    expect(catalog.blocks[3].examples[0].props).not.toBe(
      pairSpec.examples[0].props
    );
  });

  it("describes the page root", () => {
    expect(catalog.root).toEqual({
      label: "頁面",
      props: {
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
            type: "string",
            maxLength: 160,
          },
        },
        additionalProperties: false,
      },
    });
  });

  it("is plain JSON", () => {
    expect(JSON.parse(JSON.stringify(catalog))).toEqual(catalog);
  });

  it("compiles under Ajv 2020-12 strict mode with the x-* keywords registered", () => {
    const ajv = new Ajv2020({ strict: true, allErrors: true });
    ajv.addVocabulary([...X_KEYS]);
    for (const block of catalog.blocks) {
      const validate = ajv.compile(block.props);
      for (const example of block.examples) {
        expect(validate(example.props)).toBe(true);
      }
    }
    expect(ajv.compile(catalog.root.props)({ title: "首頁" })).toBe(true);
    // 沒有 useDefaults 的 Ajv 也知道 href 與 picture 不能省略
    expect(ajv.compile(catalog.blocks[0].props)({})).toBe(false);
    const leaf = ajv.compile(catalog.blocks[2].props);
    expect(leaf({ text: "" })).toBe(false);
    expect(leaf({ text: "葉", extra: 1 })).toBe(false);
    expect(leaf({})).toBe(true);
  });

  it("refuses a spec whose JSON Schema needs anyOf", () => {
    const nullable = defineBlockSpec({
      type: "Nullable",
      label: "可為空",
      category: "測試",
      description: "nullable 的物件會產生 anyOf。",
      version: 1,
      props: z.strictObject({
        group: z
          .strictObject({ text: z.string().meta({ title: "文字" }) })
          .nullable()
          .default(null)
          .meta({ title: "群組" }),
      }),
      examples: [{ name: "預設", props: {} }],
    });
    expect(() =>
      buildCatalog({ blocks: [leafSpec, boxSpec, nullable], root: testRoot })
    ).toThrow(/Nullable props use .*anyOf/);
  });
});
