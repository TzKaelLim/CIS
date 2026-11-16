import type { AnyBlockSpec, PageRootSpec } from "../define";
import { fieldKindOf } from "../field-kind";
import { toJsonSchema, type JsonSchema } from "../json-schema";
import {
  hasFailingDefault,
  hasOwn,
  isSchemaObject,
  omitKeys,
  propertiesOf,
  requiredOf,
  rewriteSchema,
} from "./schema-utils";

/** 契約不含的 key：中文標籤、說明、範例、預設值與只影響編輯器或畫面的 x-*（規格 §4.6）。 */
const CONTRACT_STRIPPED_KEYS = [
  "$schema",
  "title",
  "description",
  "examples",
  "default",
  "deprecated",
  "x-labels",
  "x-item-label",
  "x-inline",
  "x-field",
  "x-style",
  "x-token",
];

const compareJson = (a: unknown, b: unknown) => {
  const left = JSON.stringify(a);
  const right = JSON.stringify(b);
  return left < right ? -1 : left > right ? 1 : 0;
};

const sortedStrings = (value: unknown): unknown =>
  Array.isArray(value) ? [...value].sort(compareJson) : value;

/** 值是「集合」的地方一律排序，順序改變不算契約改變。 */
function canonicalNode(node: JsonSchema): JsonSchema {
  const result = omitKeys(node, CONTRACT_STRIPPED_KEYS);
  if (Array.isArray(result.enum)) result.enum = sortedStrings(result.enum);
  if (Array.isArray(result.required)) {
    result.required = sortedStrings(result.required);
  }
  const slot = result["x-slot"];
  if (isSchemaObject(slot)) {
    result["x-slot"] = Object.fromEntries(
      Object.entries(slot).map(([key, names]) => [key, sortedStrings(names)])
    );
  }
  const richtext = result["x-richtext"];
  if (isSchemaObject(richtext)) {
    result["x-richtext"] = {
      ...richtext,
      features: sortedStrings(richtext.features),
    };
  }
  if (Array.isArray(result["x-lost-checks"])) {
    result["x-lost-checks"] = sortedStrings(result["x-lost-checks"]);
  }
  return result;
}

function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  if (isSchemaObject(value)) {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, sortKeysDeep(value[key])])
    );
  }
  return value;
}

/**
 * 區塊或頁面根節點的資料契約：規格 JSON Schema 去掉標籤、說明、範例、預設值後的結構，
 * enum、required、x-slot、x-richtext.features、x-lost-checks 排序，物件 key 排序（規格 §4.6）。
 */
export function toDataContract(spec: AnyBlockSpec | PageRootSpec): JsonSchema {
  return sortKeysDeep(
    rewriteSchema(toJsonSchema(spec), canonicalNode)
  ) as JsonSchema;
}

export type ContractBreak = {
  /** 欄位路徑，例如 "count"、"group.level"、"columns[].content"；根節點是 "" */
  path: string;
  kind:
    | "removed-property"
    | "type-changed"
    | "enum-value-removed"
    | "limit-tightened"
    | "pattern-changed"
    | "new-required"
    | "slot-narrowed"
    | "richtext-features-removed"
    | "strictness-changed"
    | "kind-changed";
  detail: string;
};

/** 下限類關鍵字：數值變大或新出現時算收緊。 */
const LOWER_LIMITS = [
  "minLength",
  "minimum",
  "exclusiveMinimum",
  "minItems",
  "minProperties",
];
/** 上限類關鍵字：數值變小或新出現時算收緊。 */
const UPPER_LIMITS = [
  "maxLength",
  "maximum",
  "exclusiveMaximum",
  "maxItems",
  "maxProperties",
];

const join = (path: string, key: string) =>
  path === "" ? key : `${path}.${key}`;

const kindOf = (node: JsonSchema): string => {
  try {
    return fieldKindOf(node);
  } catch {
    return "unknown";
  }
};

const typesOf = (node: JsonSchema): string[] =>
  typeof node.type === "string"
    ? [node.type]
    : Array.isArray(node.type)
    ? node.type.map(String)
    : [];

/** next 的 type 是否涵蓋 previous 的每個 type（integer 被 number 涵蓋；沒有 type 表示不限）。 */
function typesCovered(previous: string[], next: string[]): boolean {
  if (next.length === 0) return true;
  if (previous.length === 0) return false;
  return previous.every(
    (type) =>
      next.includes(type) || (type === "integer" && next.includes("number"))
  );
}

const valuesOf = (node: JsonSchema): unknown[] | undefined =>
  Array.isArray(node.enum)
    ? node.enum
    : hasOwn(node, "const")
    ? [node.const]
    : undefined;

const stringList = (value: unknown): string[] =>
  Array.isArray(value) ? value.map(String) : [];

function compareValues(
  previous: JsonSchema,
  next: JsonSchema,
  path: string,
  out: ContractBreak[]
) {
  const before = valuesOf(previous);
  const after = valuesOf(next);
  if (after === undefined) return;
  if (before === undefined) {
    out.push({
      path,
      kind: "limit-tightened",
      detail: `now restricted to ${JSON.stringify(after)}`,
    });
    return;
  }
  for (const value of before) {
    if (!after.some((candidate) => compareJson(candidate, value) === 0)) {
      out.push({
        path,
        kind: "enum-value-removed",
        detail: `${JSON.stringify(value)} removed`,
      });
    }
  }
}

function compareLimits(
  previous: JsonSchema,
  next: JsonSchema,
  path: string,
  out: ContractBreak[]
) {
  const check = (
    keyword: string,
    tighter: (a: number, b: number) => boolean
  ) => {
    const before = previous[keyword];
    const after = next[keyword];
    if (typeof after !== "number") return;
    if (typeof before !== "number" || tighter(after, before)) {
      const from = typeof before === "number" ? String(before) : "(none)";
      out.push({
        path,
        kind: "limit-tightened",
        detail: `${keyword} ${from} → ${after}`,
      });
    }
  };
  for (const keyword of LOWER_LIMITS) check(keyword, (a, b) => a > b);
  for (const keyword of UPPER_LIMITS) check(keyword, (a, b) => a < b);
  // 舊值都是 b 的倍數；只有 b 也是 a 的倍數時，舊值才全都是 a 的倍數
  check("multipleOf", (a, b) => b % a !== 0);
  if (next.uniqueItems === true && previous.uniqueItems !== true) {
    out.push({ path, kind: "limit-tightened", detail: "uniqueItems added" });
  }
}

function comparePatterns(
  previous: JsonSchema,
  next: JsonSchema,
  path: string,
  out: ContractBreak[]
) {
  for (const keyword of ["pattern", "format"]) {
    const before = previous[keyword];
    const after = next[keyword];
    if (after !== undefined && after !== before) {
      const from = before === undefined ? "(none)" : JSON.stringify(before);
      out.push({
        path,
        kind: "pattern-changed",
        detail: `${keyword} ${from} → ${JSON.stringify(after)}`,
      });
    }
  }
}

function compareSlots(
  previous: JsonSchema,
  next: JsonSchema,
  path: string,
  out: ContractBreak[]
) {
  const before = previous["x-slot"];
  const after = next["x-slot"];
  if (!isSchemaObject(before) || !isSchemaObject(after)) return;
  const narrowed = (detail: string) =>
    out.push({ path, kind: "slot-narrowed", detail });
  if (hasOwn(before, "allow") && hasOwn(after, "allow")) {
    const removed = stringList(before.allow).filter(
      (type) => !stringList(after.allow).includes(type)
    );
    if (removed.length > 0) narrowed(`no longer allows ${removed.join(", ")}`);
  } else if (hasOwn(before, "disallow") && hasOwn(after, "disallow")) {
    const added = stringList(after.disallow).filter(
      (type) => !stringList(before.disallow).includes(type)
    );
    if (added.length > 0) narrowed(`now disallows ${added.join(", ")}`);
  } else if (hasOwn(before, "allow") && hasOwn(after, "disallow")) {
    const blocked = stringList(before.allow).filter((type) =>
      stringList(after.disallow).includes(type)
    );
    if (blocked.length > 0) narrowed(`now disallows ${blocked.join(", ")}`);
  } else {
    narrowed("changed from disallow to allow");
  }
}

function compareRichText(
  previous: JsonSchema,
  next: JsonSchema,
  path: string,
  out: ContractBreak[]
) {
  const before = previous["x-richtext"];
  const after = next["x-richtext"];
  if (!isSchemaObject(before) || !isSchemaObject(after)) return;
  const removed = stringList(before.features).filter(
    (feature) => !stringList(after.features).includes(feature)
  );
  if (removed.length > 0) {
    out.push({
      path,
      kind: "richtext-features-removed",
      detail: `removed ${removed.join(", ")}`,
    });
  }
}

function compareObjects(
  previous: JsonSchema,
  next: JsonSchema,
  path: string,
  out: ContractBreak[]
) {
  const before = propertiesOf(previous);
  const after = propertiesOf(next);
  for (const key of Object.keys(before)) {
    if (!hasOwn(after, key)) {
      out.push({
        path: join(path, key),
        kind: "removed-property",
        detail: "property removed",
      });
    }
  }
  const wasRequired = requiredOf(previous);
  for (const key of requiredOf(next)) {
    if (!wasRequired.includes(key)) {
      out.push({
        path: join(path, key),
        kind: "new-required",
        detail: hasOwn(before, key)
          ? "existing property became required"
          : "new required property without a default",
      });
    }
  }
  // 必填的 link() 與 image() 不在 required 裡（prefault），預設值卻不合格
  for (const key of Object.keys(after)) {
    if (
      !hasOwn(before, key) &&
      !requiredOf(next).includes(key) &&
      hasFailingDefault(after[key])
    ) {
      out.push({
        path: join(path, key),
        kind: "new-required",
        detail: "new required link or image; its default does not pass",
      });
    }
  }
  if (
    next.additionalProperties === false &&
    previous.additionalProperties !== false
  ) {
    out.push({
      path,
      kind: "strictness-changed",
      detail: "additional properties are no longer allowed",
    });
  }
  for (const key of Object.keys(before)) {
    if (hasOwn(after, key)) {
      compareNode(before[key], after[key], join(path, key), out);
    }
  }
}

function compareNode(
  previous: JsonSchema,
  next: JsonSchema,
  path: string,
  out: ContractBreak[]
): void {
  const typesBefore = typesOf(previous);
  const typesAfter = typesOf(next);
  if (!typesCovered(typesBefore, typesAfter)) {
    out.push({
      path,
      kind: "type-changed",
      detail: `${typesBefore.join("|") || "any"} → ${typesAfter.join("|")}`,
    });
    return;
  }
  const kindBefore = kindOf(previous);
  const kindAfter = kindOf(next);
  // choice → text 只是拿掉選項限制（放寬），其餘種類改變一律不相容
  if (
    kindBefore !== kindAfter &&
    !(kindBefore === "choice" && kindAfter === "text")
  ) {
    out.push({
      path,
      kind: "kind-changed",
      detail: `${kindBefore} → ${kindAfter}`,
    });
    return;
  }
  compareValues(previous, next, path, out);
  compareLimits(previous, next, path, out);
  comparePatterns(previous, next, path, out);
  compareSlots(previous, next, path, out);
  compareRichText(previous, next, path, out);
  compareObjects(previous, next, path, out);
  if (isSchemaObject(previous.items) && isSchemaObject(next.items)) {
    compareNode(previous.items, next.items, `${path}[]`, out);
  }
}

/**
 * 比較兩版資料契約，列出「舊資料在新版會被拒絕」的不相容差異（規格 §4.6）。
 * 新增選填或有合格預設值的欄位、放寬上下限、新增選項、新增 allow 的類型都不算；
 * 新增必填的 link() 或 image() 算（預設值不合格）。
 */
export function diffContracts(
  previous: JsonSchema,
  next: JsonSchema
): ContractBreak[] {
  const breaks: ContractBreak[] = [];
  compareNode(previous, next, "", breaks);
  return breaks;
}
