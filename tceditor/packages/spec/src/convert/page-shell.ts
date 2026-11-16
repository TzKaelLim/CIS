import type { AnyBlockSpec } from "../define";
import { eachField, toJsonSchema, type JsonSchema } from "../json-schema";
import { NODE_ID_PATTERN } from "../limits";
import { slotLocations } from "../slots";
import { hasOwn, isSchemaObject } from "./schema-utils";

const NODE_LIST = { $ref: "#/definitions/nodeList" };

/** 清單裡放置區的項目定義名稱，例如 columns → "item_columns"。 */
const itemDefinition = (name: string) => `item_${name}`;

/**
 * 產生資料庫用的外殼 schema（draft-07，規格 §6.5）。
 * - 只檢查結構：content 是節點陣列、type 是已登記的區塊、props.id 符合格式且不是 "root"、
 *   放置區（依欄位名稱辨認，規格 §4.3 rule 8）裡是節點陣列。不依區塊類型檢查其他 props。
 * - 不用 oneOf/anyOf/allOf；每個 $ref 單獨成一個物件（draft-07 會忽略 $ref 旁邊的關鍵字）。
 * - 只支援兩種放置區位置：區塊的直接欄位（例如 content），以及物件清單項目裡的欄位（例如 columns[].content）。
 */
export function buildPageShellSchema(input: {
  blocks: readonly AnyBlockSpec[];
}): JsonSchema {
  if (input.blocks.length === 0) {
    throw new TypeError("buildPageShellSchema: no blocks");
  }
  const directSlots = new Set<string>();
  const slotLists = new Map<string, Set<string>>();
  for (const spec of input.blocks) {
    for (const location of slotLocations(spec)) {
      const [name, marker, inner] = location.path;
      if (location.path.length === 1) {
        directSlots.add(name);
      } else if (location.path.length === 3 && marker === "[]") {
        const inners = slotLists.get(name) ?? new Set<string>();
        inners.add(inner);
        slotLists.set(name, inners);
      } else {
        throw new TypeError(
          `buildPageShellSchema: ${spec.type} has a slot at "${location.key}"; only a direct prop or a prop of an array item can be a slot`
        );
      }
    }
  }
  for (const name of directSlots) {
    if (slotLists.has(name)) {
      throw new TypeError(
        `buildPageShellSchema: "${name}" is a slot in one block and a list of slots in another (spec §4.3 rule 8)`
      );
    }
  }
  // 外殼依名稱辨認放置區（規格 §4.3 rule 8），所以同名的欄位在其他區塊也必須是同樣的結構，
  // 否則那些區塊的合格資料會被外殼拒絕
  for (const spec of input.blocks) {
    eachField(toJsonSchema(spec), ({ path, node }) => {
      const [name, marker, inner] = path;
      const isSlot = hasOwn(node, "x-slot");
      const clash = (where: string, problem: string) =>
        new TypeError(
          `buildPageShellSchema: ${spec.type}.${where} ${problem}, but another block uses "${where}" for slots (spec §4.3 rule 8)`
        );
      if (path.length === 1 && directSlots.has(name) && !isSlot) {
        throw clash(name, "is not a slot");
      }
      if (
        path.length === 1 &&
        slotLists.has(name) &&
        !(
          node.type === "array" &&
          isSchemaObject(node.items) &&
          node.items.type === "object"
        )
      ) {
        throw clash(name, "is not a list of objects");
      }
      if (
        path.length === 3 &&
        marker === "[]" &&
        (slotLists.get(name)?.has(inner) ?? false) &&
        !isSlot
      ) {
        throw clash(`${name}[].${inner}`, "is not a slot");
      }
    });
  }

  const slotNames = [...directSlots, ...slotLists.keys()].sort();
  const props: JsonSchema = {
    type: "object",
    required: ["id"],
    additionalProperties: true,
    properties: Object.fromEntries([
      [
        "id",
        {
          type: "string",
          pattern: NODE_ID_PATTERN.source,
          not: { const: "root" },
        },
      ],
      ...slotNames.map((name) => [
        name,
        directSlots.has(name)
          ? { ...NODE_LIST }
          : {
              type: "array",
              items: { $ref: `#/definitions/${itemDefinition(name)}` },
            },
      ]),
    ]),
  };
  const itemDefinitions = [...slotLists.keys()].sort().map((name) => [
    itemDefinition(name),
    {
      type: "object",
      additionalProperties: true,
      properties: Object.fromEntries(
        [...(slotLists.get(name) ?? [])]
          .sort()
          .map((inner) => [inner, { ...NODE_LIST }])
      ),
    },
  ]);

  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    title: "tceditor page shell",
    type: "object",
    required: ["root", "content"],
    additionalProperties: false,
    properties: {
      root: {
        type: "object",
        required: ["props"],
        additionalProperties: false,
        properties: { props: { type: "object" } },
      },
      content: { ...NODE_LIST },
      zones: { type: "object", maxProperties: 0 },
    },
    definitions: Object.fromEntries([
      ["nodeList", { type: "array", items: { $ref: "#/definitions/node" } }],
      [
        "node",
        {
          type: "object",
          required: ["type", "props"],
          additionalProperties: false,
          properties: {
            type: {
              type: "string",
              enum: input.blocks.map((spec) => spec.type),
            },
            props: { $ref: "#/definitions/props" },
          },
        },
      ],
      ["props", props],
      ...itemDefinitions,
    ]),
  };
}
