import type { RichTextFeature } from "@tzuchi/tceditor/rules";

/**
 * The `x-*` keys a spec may put in `.meta()`. Converters read them from the
 * JSON Schema (never from zod objects), and the page validator's Ajv tests
 * register exactly this list as keywords.
 */
export const X_KEYS = [
  "x-labels",
  "x-inline",
  "x-field",
  "x-item-label",
  "x-style",
  "x-token",
  "x-slot",
  "x-richtext",
  "x-image",
  "x-link",
  "x-lost-checks",
] as const;

export type XKey = (typeof X_KEYS)[number];

/** Every key `.meta()` may set. `id` is left out on purpose: it turns the node into a `$ref`. */
export const META_KEYS = [
  "title",
  "description",
  "examples",
  "deprecated",
  ...X_KEYS,
] as const;

export type MetaKey = (typeof META_KEYS)[number];

/**
 * Checks that JSON Schema cannot express. A helper lists the checks it adds in
 * `x-lost-checks`, so the MCP catalog and the database know that only the
 * server-side validator enforces them.
 */
export const LOST_CHECKS = [
  "safe-href",
  "alt-required",
  "richtext-normalize",
] as const;

export type LostCheck = (typeof LOST_CHECKS)[number];

/** A value that survives JSON.stringify unchanged. */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

/** Which block types a slot accepts: either an allow list or a disallow list. */
export type SlotRule = { allow: string[] } | { disallow: string[] };

/**
 * The meta that only slot(), richText(), image() and link() write. The
 * converters and the page validator trust these keys, so GlobalMeta types
 * them as `never`: a spec that writes them in .meta() fails to compile, and
 * checkSpecRules reports the ones that get past the types.
 */
export type HelperMeta = {
  "x-slot"?: SlotRule;
  "x-richtext"?: { features: RichTextFeature[] };
  "x-image"?: true;
  "x-link"?: { optional: boolean };
  "x-lost-checks"?: LostCheck[];
};

// zod's JSONSchemaMeta has an index signature, so this only types the values
// of these keys: a misspelled key still compiles. checkSpecRules catches it
// with the "meta-keys" rule. zod turns other non-JSON meta values into null
// without an error, so `examples` is typed here as well.
declare module "zod" {
  interface GlobalMeta {
    examples?: JsonValue[];
    "x-labels"?: Record<string, string>;
    "x-inline"?: true;
    "x-field"?: "textarea";
    "x-item-label"?: string;
    "x-style"?: { component: string; key: string };
    "x-token"?: { group: string };
    // Written by the helpers only (HelperMeta).
    "x-slot"?: never;
    "x-richtext"?: never;
    "x-image"?: never;
    "x-link"?: never;
    "x-lost-checks"?: never;
  }
}
