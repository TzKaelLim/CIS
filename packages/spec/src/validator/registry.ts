import type * as z from "zod";
import type { AnyBlockSpec, PageRootSpec } from "../define";
import { eachField, toJsonSchema, type JsonSchema } from "../json-schema";
import { slotLocations, type SlotLocation } from "../slots";

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
};

export type BlockEntry = Entry & { blockType: string; deprecated: boolean };

const richTextPaths = (schema: JsonSchema) => {
  const paths: (readonly string[])[] = [];

  eachField(schema, ({ path, node }) => {
    if (node["x-richtext"] !== undefined) paths.push(path);
  });

  return paths;
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
