import * as z from "zod";
import {
  fitRichTextToTypes,
  isRichTextFeature,
  isSafeHref,
  normalizeRichText,
  richTextFeaturesToTypes,
} from "@tzuchi/tceditor/rules";
import type { RichTextDoc, RichTextFeature } from "@tzuchi/tceditor/rules";
import { JSON_SCHEMA_OPTIONS, deepFreeze } from "./json-schema";
import type { JsonSchema } from "./json-schema";
import type { HelperMeta, SlotRule } from "./meta";

/** Longest link, in characters. */
export const LINK_MAX_LENGTH = 2048;
/** Asset ids, as stored in image values. */
export const ASSET_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
/** Longest image alt text, in characters. */
export const IMAGE_ALT_MAX_LENGTH = 200;

export type ImageValue = { assetId: string; alt: string; decorative: boolean };
export type SlotItem = { type: string; props: Record<string, unknown> };

type EnumValues = readonly [string, ...string[]];
type EnumOf<V extends EnumValues> = z.ZodEnum<{ [K in V[number]]: K }>;

/** The schema of a slot item: the page validator checks the child itself. */
export type SlotItemSchema = z.ZodObject<
  { type: z.ZodString; props: z.ZodRecord<z.ZodString, z.ZodUnknown> },
  z.core.$strict
>;
export type SlotSchema = z.ZodDefault<z.ZodArray<SlotItemSchema>>;
export type ImageSchema = z.ZodPrefault<
  z.ZodObject<
    { assetId: z.ZodString; alt: z.ZodString; decorative: z.ZodBoolean },
    z.core.$strict
  >
>;
export type RichTextSchema = z.ZodType<RichTextDoc, RichTextDoc>;

const fail = (helper: string, message: string): never => {
  throw new TypeError(`${helper}(): ${message}`);
};

/**
 * The meta that each helper wrote, in a registry that only this module can
 * add to. checkSpecRules compares it with the JSON Schema, so helper-only
 * keys that a cast put in .meta() are reported even when they look right.
 */
const helperRegistry = z.registry<HelperMeta>();

/**
 * Sets the helper-only meta on a helper's schema. GlobalMeta types these keys
 * as never, so this casts; the registry keeps its own frozen copy.
 */
function withHelperMeta<S extends z.ZodType>(schema: S, meta: HelperMeta): S {
  const result = schema.meta(meta as z.GlobalMeta) as S;

  helperRegistry.add(result, deepFreeze(JSON.parse(JSON.stringify(meta))));

  return result;
}

/**
 * The helper-only meta of a schema that slot(), richText(), image() or link()
 * returned, or of a copy that .meta() or .describe() made of it; undefined for
 * any other schema, including a wrapper that the author added, such as
 * .optional() or .default(). Internal: checkSpecRules uses it.
 */
export const helperMetaOf = (schema: z.core.$ZodType): HelperMeta | undefined =>
  helperRegistry.get(schema);

/**
 * The JSON Schema of a props object with only the meta that the helpers
 * wrote (JSON_SCHEMA_OPTIONS otherwise). Internal: checkSpecRules compares
 * its helper-only keys with toJsonSchema's.
 */
export const toHelperJsonSchema = (props: z.ZodObject): JsonSchema =>
  z.toJSONSchema(props, {
    ...JSON_SCHEMA_OPTIONS,
    metadata: helperRegistry,
  }) as JsonSchema;

function enumOf<const V extends EnumValues>(
  helper: string,
  values: V
): EnumOf<V> {
  if (!Array.isArray(values) || values.length === 0) {
    fail(helper, "needs at least one value");
  }
  for (const value of values) {
    if (typeof value !== "string" || value === "") {
      fail(helper, "values must be non-empty strings");
    }
  }
  if (new Set(values).size !== values.length) {
    fail(helper, `duplicate value in ${JSON.stringify(values)}`);
  }

  return z.enum(values);
}

/** A fixed set of options, for example an image ratio. Add the labels with `x-labels`. */
export function choice<const V extends EnumValues>(values: V): EnumOf<V> {
  return enumOf("choice", values);
}

/**
 * Options picked from a uikit component's style variants, for example
 * style("button", "variant", ["primary", "outline"]). Records
 * `x-style: { component, key }`; the blocks tests check the options against
 * the uikit snapshot.
 */
export function style<const V extends EnumValues>(
  component: string,
  key: string,
  values: V
): EnumOf<V> {
  if (component === "" || key === "") {
    fail("style", "component and key must not be empty");
  }

  return enumOf("style", values).meta({ "x-style": { component, key } });
}

/**
 * Options that name a design token shared across components, for example
 * token("space", ["16", "32"]) for --tc-space-16 and --tc-space-32. Records
 * `x-token: { group }`.
 */
export function token<const V extends EnumValues>(
  group: string,
  values: V
): EnumOf<V> {
  if (group === "") fail("token", "group must not be empty");

  return enumOf("token", values).meta({ "x-token": { group } });
}

const unsafeHref = { params: { code: "unsafe_href" } };

/**
 * A link: at most 2,048 characters that isSafeHref accepts (http, https,
 * mailto, tel and relative URLs). The required version rejects "" and uses
 * `.prefault("")`, so a page that leaves the link out fails on this field
 * instead of passing with an empty link. The optional version accepts "" (no
 * link) and defaults to it.
 *
 * Length errors stop the checks (`abort`), so "" only reports too_small and
 * a 3,000-character value only too_big. An unsafe value reports a "custom"
 * issue with `params: { code: "unsafe_href" }` and no message: the page
 * validator writes the message.
 */
export function link(options?: {
  optional?: false;
}): z.ZodPrefault<z.ZodString>;
export function link(options: { optional: true }): z.ZodDefault<z.ZodString>;
export function link(
  options: { optional?: boolean } = {}
): z.ZodPrefault<z.ZodString> | z.ZodDefault<z.ZodString> {
  const optional = options.optional === true;
  const meta: HelperMeta = {
    "x-link": { optional },
    "x-lost-checks": ["safe-href"],
  };

  if (optional) {
    return withHelperMeta(
      z
        .string()
        .max(LINK_MAX_LENGTH, { abort: true })
        .refine((value) => value === "" || isSafeHref(value), unsafeHref)
        .default(""),
      meta
    );
  }

  return withHelperMeta(
    z
      .string()
      .min(1, { abort: true })
      .max(LINK_MAX_LENGTH, { abort: true })
      .refine((value) => isSafeHref(value), unsafeHref)
      .prefault(""),
    meta
  );
}

/**
 * Rich text stored as Tiptap JSON. The value goes through normalizeRichText,
 * then fitRichTextToTypes with the listed features: anything else, including
 * text alignment, becomes plain text. paragraph, text and doc are always on.
 * A string is rejected (convert legacy HTML with richtext-migrate first), so
 * zod agrees with the JSON Schema's `type: "object"`.
 *
 * zod returns a `.default()` value as it is, without this cleanup, so a
 * default must already be in the output shape (checkSpecRules, rule
 * "defaults"):
 * `.default(() => fitRichTextToTypes(textToRichText("…"), richTextFeaturesToTypes(features)))`.
 */
export function richText(options: {
  features: readonly RichTextFeature[];
}): RichTextSchema {
  const features = [...(options?.features ?? [])];

  for (const feature of features) {
    if (!isRichTextFeature(feature)) {
      fail("richText", `unknown feature ${JSON.stringify(feature)}`);
    }
  }
  if (new Set(features).size !== features.length) {
    fail("richText", `duplicate feature in ${JSON.stringify(features)}`);
  }

  const types = richTextFeaturesToTypes(features);
  // The cast gives z.output = RichTextDoc; without it zod infers the
  // looseObject shape { type: "doc"; [k: string]: unknown }.
  const schema = z
    .looseObject({ type: z.literal("doc") })
    .overwrite((value) =>
      fitRichTextToTypes(normalizeRichText(value), types)
    ) as unknown as RichTextSchema;

  return withHelperMeta(schema, {
    "x-richtext": { features },
    "x-lost-checks": ["richtext-normalize"],
  });
}

const validateSlotRule = (rule: SlotRule): SlotRule => {
  const value = rule as Partial<Record<"allow" | "disallow", unknown>>;
  const hasAllow =
    value !== null && typeof value === "object" && "allow" in value;
  const hasDisallow =
    value !== null && typeof value === "object" && "disallow" in value;

  if (hasAllow === hasDisallow) {
    fail("slot", "pass exactly one of allow and disallow");
  }

  const names = hasAllow ? value.allow : value.disallow;

  if (
    !Array.isArray(names) ||
    names.length === 0 ||
    names.some((name) => typeof name !== "string" || name === "")
  ) {
    fail("slot", "the list needs at least one block type name");
  }

  return hasAllow
    ? { allow: [...(names as string[])] }
    : { disallow: [...(names as string[])] };
};

/**
 * A slot: an array of `{ type, props }` children, empty by default. The page
 * validator checks each child with its own block spec and the allow or
 * disallow rule (`x-slot`). The names must be registered block types
 * (checkSpecRules, rule "slot-targets").
 */
export function slot(rule: SlotRule): SlotSchema {
  const xSlot = validateSlotRule(rule);
  const item: SlotItemSchema = z.strictObject({
    type: z.string(),
    props: z.record(z.string(), z.unknown()),
  });

  return withHelperMeta(
    z.array(item).default(() => []),
    { "x-slot": xSlot }
  );
}

/**
 * An image: `{ assetId, alt, decorative }`. assetId must match
 * ASSET_ID_PATTERN (S2 does not check that the asset exists), alt has at most
 * 200 characters, and alt must not be blank unless decorative is true (a
 * "custom" issue at `alt` with `params: { code: "alt_required" }`). The
 * default is deliberately incomplete and goes through `.prefault()`, so a page
 * that leaves the image out fails at `assetId`.
 */
export function image(): ImageSchema {
  return withHelperMeta(
    z
      .strictObject({
        assetId: z.string().regex(ASSET_ID_PATTERN).meta({ title: "圖片" }),
        alt: z.string().max(IMAGE_ALT_MAX_LENGTH).meta({ title: "替代文字" }),
        decorative: z.boolean().meta({ title: "裝飾用圖片" }),
      })
      .refine((value) => value.decorative || value.alt.trim() !== "", {
        path: ["alt"],
        params: { code: "alt_required" },
      })
      .prefault(() => ({ assetId: "", alt: "", decorative: false })),
    { "x-image": true, "x-lost-checks": ["alt-required"] }
  );
}
