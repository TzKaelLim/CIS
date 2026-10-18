import * as z from "zod";
import type { AnyBlockSpec, PageRootSpec } from "./define";

/** The zod JSON Schema settings for the editor, Storybook and the MCP catalog (spec §5.1). */
export const JSON_SCHEMA_OPTIONS = {
  target: "draft-2020-12",
  io: "input",
  reused: "inline",
  cycles: "ref",
} as const;

export type JsonSchema = { [keyword: string]: unknown };

export type FieldVisit = {
  /** Field names from the props root; "[]" stands for "every item", e.g. ["columns", "[]", "content"]. */
  path: readonly string[];
  name: string;
  node: JsonSchema;
  /** Whether the object that holds this field lists it in `required`. */
  parentRequired: boolean;
};

const hasOwn = (value: object, key: string): boolean =>
  Object.prototype.hasOwnProperty.call(value, key);

export const isJsonSchemaNode = (value: unknown): value is JsonSchema =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function deepFreeze<T>(value: T): T {
  if (typeof value === "object" && value !== null && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const key of Object.keys(value)) {
      deepFreeze((value as Record<string, unknown>)[key]);
    }
  }

  return value;
}

const cache = new WeakMap<z.ZodObject, JsonSchema>();

/**
 * The JSON Schema of a spec's props (JSON_SCHEMA_OPTIONS). Cached per props
 * schema and deeply frozen: callers that need to change it must structuredClone
 * it first.
 */
export function toJsonSchema(spec: AnyBlockSpec | PageRootSpec): JsonSchema {
  const cached = cache.get(spec.props);

  if (cached) return cached;

  const schema = deepFreeze(
    z.toJSONSchema(spec.props, JSON_SCHEMA_OPTIONS) as JsonSchema
  );

  cache.set(spec.props, schema);

  return schema;
}

/** Joins a field path for messages and keys: ["columns", "[]", "content"] → "columns[].content". */
export function fieldPathKey(path: readonly string[]): string {
  let key = "";

  for (const segment of path) {
    key += segment === "[]" ? "[]" : key === "" ? segment : `.${segment}`;
  }

  return key;
}

/** Slot, rich text and image fields are leaves: their inner schema is not made of fields. */
const isLeafField = (node: JsonSchema): boolean =>
  hasOwn(node, "x-slot") ||
  hasOwn(node, "x-richtext") ||
  hasOwn(node, "x-image");

function eachProperty(
  object: JsonSchema,
  prefix: readonly string[],
  visit: (field: FieldVisit) => void
) {
  const { properties } = object;

  if (!isJsonSchemaNode(properties)) return;

  const required = Array.isArray(object.required) ? object.required : [];

  for (const name of Object.keys(properties)) {
    const node = properties[name];

    if (!isJsonSchemaNode(node)) continue;

    const path = [...prefix, name];

    visit({ path, name, node, parentRequired: required.indexOf(name) !== -1 });

    if (isLeafField(node)) continue;

    if (node.type === "object") {
      eachProperty(node, path, visit);
    } else if (
      node.type === "array" &&
      isJsonSchemaNode(node.items) &&
      node.items.type === "object"
    ) {
      eachProperty(node.items, [...path, "[]"], visit);
    }
  }
}

/**
 * Visits every field depth-first in property order: the root's properties,
 * the properties of object fields and of the items of array fields. Slot,
 * rich text and image fields are visited but not entered.
 */
export function eachField(
  schema: JsonSchema,
  visit: (field: FieldVisit) => void
): void {
  eachProperty(schema, [], visit);
}
