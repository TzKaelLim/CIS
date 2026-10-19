import type { JsonSchema } from "../json-schema";

/** 選項數量在這個值以內用 radio，超過用 select（規格 §4.2）。 */
export const RADIO_MAX_OPTIONS = 4;

/** 值是單一 schema 的關鍵字。 */
const SCHEMA_KEYWORDS: readonly string[] = [
  "items",
  "additionalItems",
  "additionalProperties",
  "propertyNames",
  "contains",
  "not",
  "if",
  "then",
  "else",
  "unevaluatedItems",
  "unevaluatedProperties",
];

/** 值是 schema 陣列的關鍵字。 */
const SCHEMA_LIST_KEYWORDS: readonly string[] = [
  "prefixItems",
  "allOf",
  "anyOf",
  "oneOf",
];

/** 值是「名稱 → schema」的關鍵字。名稱是欄位名稱或定義名稱，不是關鍵字。 */
const SCHEMA_MAP_KEYWORDS: readonly string[] = [
  "properties",
  "patternProperties",
  "$defs",
  "definitions",
  "dependentSchemas",
];

export const isSchemaObject = (value: unknown): value is JsonSchema =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const hasOwn = (target: object, key: string): boolean =>
  Object.prototype.hasOwnProperty.call(target, key);

/** 物件 schema 的 properties；沒有時回傳空物件。 */
export function propertiesOf(node: JsonSchema): Record<string, JsonSchema> {
  const properties = node.properties;
  if (!isSchemaObject(properties)) return {};
  return Object.fromEntries(
    Object.entries(properties).filter((entry): entry is [string, JsonSchema] =>
      isSchemaObject(entry[1])
    )
  );
}

export function requiredOf(node: JsonSchema): string[] {
  return Array.isArray(node.required)
    ? node.required.filter((key): key is string => typeof key === "string")
    : [];
}

/**
 * 必填的 link() 與 image()。它們用 .prefault()，在 io "input" 下不列入 required，
 * 預設值（""、assetId ""）卻刻意不合格，所以省略它們的資料會被拒絕。
 */
export function hasFailingDefault(node: JsonSchema): boolean {
  const link = node["x-link"];
  return (
    hasOwn(node, "x-image") || (isSchemaObject(link) && link.optional === false)
  );
}

/** 欄位的中文名稱（meta 的 title），沒有時用欄位名稱。 */
export const titleOf = (node: JsonSchema, name: string): string =>
  typeof node.title === "string" && node.title !== "" ? node.title : name;

/**
 * 數字欄位的上下限。zod 的 int() 沒設上下限時會輸出 ±Number.MAX_SAFE_INTEGER，
 * 這種值視為沒有上下限。
 */
export function numberBound(
  node: JsonSchema,
  keyword: "minimum" | "maximum"
): number | undefined {
  const value = node[keyword];
  return typeof value === "number" &&
    Number.isFinite(value) &&
    Math.abs(value) !== Number.MAX_SAFE_INTEGER
    ? value
    : undefined;
}

export function enumValues(
  node: JsonSchema
): (string | number | boolean | null)[] {
  return Array.isArray(node.enum)
    ? node.enum.filter(
        (value): value is string | number | boolean | null =>
          value === null ||
          ["string", "number", "boolean"].includes(typeof value)
      )
    : [];
}

/** 選項的中文名稱：取 x-labels 的自有屬性，沒有時用值本身。 */
export function optionLabel(
  node: JsonSchema,
  value: string | number | boolean | null
): string {
  const labels = node["x-labels"];
  const key = String(value);
  if (isSchemaObject(labels) && hasOwn(labels, key)) {
    const label = labels[key];
    if (typeof label === "string") return label;
  }
  return key;
}

const escapePointer = (segment: string) =>
  segment.replace(/~/g, "~0").replace(/\//g, "~1");

/**
 * 由下而上重建 schema：先重建每個子 schema，再把重建好的節點交給 rewrite。
 * 只有 schema 位置的物件會交給 rewrite；default、examples、enum、x-* 這類資料值只深拷貝。
 * 不修改輸入（toJsonSchema 的結果是凍結的）。
 */
export function rewriteSchema(
  node: JsonSchema,
  rewrite: (node: JsonSchema) => JsonSchema
): JsonSchema {
  const rebuild = (value: unknown): unknown =>
    isSchemaObject(value)
      ? rewriteSchema(value, rewrite)
      : structuredClone(value);

  return rewrite(
    Object.fromEntries(
      Object.entries(node).map(([keyword, value]) => {
        if (SCHEMA_KEYWORDS.includes(keyword)) {
          return [
            keyword,
            Array.isArray(value) ? value.map(rebuild) : rebuild(value),
          ];
        }
        if (SCHEMA_LIST_KEYWORDS.includes(keyword) && Array.isArray(value)) {
          return [keyword, value.map(rebuild)];
        }
        if (SCHEMA_MAP_KEYWORDS.includes(keyword) && isSchemaObject(value)) {
          return [
            keyword,
            Object.fromEntries(
              Object.entries(value).map(([name, sub]) => [name, rebuild(sub)])
            ),
          ];
        }
        return [keyword, structuredClone(value)];
      })
    )
  );
}

/** 依序走訪每個 schema 節點（含根節點）。pointer 是 JSON Pointer，例如 "/properties/columns/items"。 */
export function walkSchema(
  node: JsonSchema,
  visit: (node: JsonSchema, pointer: string) => void,
  pointer = ""
): void {
  visit(node, pointer);
  for (const [keyword, value] of Object.entries(node)) {
    const here = `${pointer}/${escapePointer(keyword)}`;
    if (
      SCHEMA_KEYWORDS.includes(keyword) ||
      SCHEMA_LIST_KEYWORDS.includes(keyword)
    ) {
      if (isSchemaObject(value)) walkSchema(value, visit, here);
      if (Array.isArray(value)) {
        value.forEach((sub, index) => {
          if (isSchemaObject(sub)) walkSchema(sub, visit, `${here}/${index}`);
        });
      }
    } else if (SCHEMA_MAP_KEYWORDS.includes(keyword) && isSchemaObject(value)) {
      for (const [name, sub] of Object.entries(value)) {
        if (isSchemaObject(sub)) {
          walkSchema(sub, visit, `${here}/${escapePointer(name)}`);
        }
      }
    }
  }
}

/** 回傳 schema 節點中出現指定關鍵字的位置（JSON Pointer）。 */
export function findKeywords(
  node: JsonSchema,
  keywords: readonly string[]
): string[] {
  const found: string[] = [];
  walkSchema(node, (sub, pointer) => {
    for (const keyword of keywords) {
      if (hasOwn(sub, keyword)) {
        found.push(`${pointer}/${escapePointer(keyword)}`);
      }
    }
  });
  return found;
}

/** 回傳去掉指定 key 的新物件。 */
export const omitKeys = (
  node: JsonSchema,
  keys: readonly string[]
): JsonSchema =>
  Object.fromEntries(
    Object.entries(node).filter(([key]) => !keys.includes(key))
  );
