import type * as z from "zod";
import type { AnyBlockSpec, PageRootSpec } from "../define";
import { eachField, toJsonSchema, type JsonSchema } from "../json-schema";
import { slotLocations, type SlotLocation } from "../slots";

/** A list field (not a slot) and its maximum number of items. */
export type ListField = { path: readonly string[]; maxItems: number };

/** What the validator needs to know about a block spec or the page root spec. */
export type Entry = {
  /** The block type; undefined for the page root */
  blockType: string | undefined;
  label: string;
  props: z.ZodObject;
  schema: JsonSchema;
  slots: readonly SlotLocation[];
  /** Paths of the rich text fields, "[]" standing for array items */
  richText: readonly (readonly string[])[];
  /** The list fields with a maximum, outer lists before the lists in their items */
  lists: readonly ListField[];
};

export type BlockEntry = Entry & { blockType: string; deprecated: boolean };

const richTextPaths = (schema: JsonSchema) => {
  const paths: (readonly string[])[] = [];

  eachField(schema, ({ path, node }) => {
    if (node["x-richtext"] !== undefined) paths.push(path);
  });

  return paths;
};

// eachField visits a list before the fields of its items
const listFields = (schema: JsonSchema) => {
  const lists: ListField[] = [];

  eachField(schema, ({ path, node }) => {
    if (
      node.type === "array" &&
      node["x-slot"] === undefined &&
      typeof node.maxItems === "number"
    ) {
      lists.push({ path, maxItems: node.maxItems });
    }
  });

  return lists;
};

export function blockEntry(spec: AnyBlockSpec): BlockEntry {
  const schema = toJsonSchema(spec);

  return {
    blockType: spec.type,
    deprecated: spec.deprecated,
    label: spec.label,
    props: spec.props,
    schema,
    slots: slotLocations(spec),
    richText: richTextPaths(schema),
    lists: listFields(schema),
  };
}

export function rootEntry(spec: PageRootSpec): Entry {
  const schema = toJsonSchema(spec);
  let hasSlot = false;

  eachField(schema, ({ node }) => {
    if (node["x-slot"] !== undefined) hasSlot = true;
  });

  // The validator only walks the blocks of `content`; blocks in a root slot
  // would be stored without being checked.
  if (hasSlot) {
    throw new TypeError("The page root spec must not have slot fields");
  }

  return {
    blockType: undefined,
    label: spec.label,
    props: spec.props,
    schema,
    slots: [],
    richText: richTextPaths(schema),
    lists: listFields(schema),
  };
}

/** Looks a block type up by own property, so "constructor" and "__proto__" are unknown. */
export const lookupEntry = (
  registry: Readonly<Record<string, BlockEntry>>,
  type: string
): BlockEntry | undefined =>
  Object.prototype.hasOwnProperty.call(registry, type)
    ? registry[type]
    : undefined;
