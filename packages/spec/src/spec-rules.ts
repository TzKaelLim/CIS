import * as z from "zod";
import { stableStringify } from "@tzuchi/tceditor/rules";
import { BLOCK_TYPE_PATTERN } from "./define";
import type { AnyBlockSpec, PageRootSpec } from "./define";
import { helperMetaOf, toHelperJsonSchema } from "./helpers";
import {
  JSON_SCHEMA_OPTIONS,
  eachField,
  fieldPathKey,
  isJsonSchemaNode,
  toJsonSchema,
} from "./json-schema";
import type { JsonSchema } from "./json-schema";
import { ITEM_LABEL_PLACEHOLDER, META_KEYS } from "./meta";
import type { HelperMeta } from "./meta";

export type SpecRuleId =
  | "type-name"
  | "unique-type"
  | "root-object"
  | "no-ref"
  | "strict-objects"
  | "object-arrays"
  | "title-required"
  | "field-name"
  | "reserved-name"
  | "meta-keys"
  | "slot-shape"
  | "slot-targets"
  | "example-count"
  | "defaults"
  | "item-label";

export type SpecRuleViolation = {
  rule: SpecRuleId;
  /** The block type, or "root" for the page root. */
  type: string;
  /** Where in the props schema, e.g. "columns[].content"; "" for the spec itself. */
  path: string;
  message: string;
};

/**
 * Props that Puck passes to every view (id, puck, editMode; children on the
 * root) or that React keeps out of a component's props (key, and ref outside
 * React 19 function components).
 */
export const RESERVED_FIELD_NAMES = [
  "id",
  "puck",
  "editMode",
  "children",
  "key",
  "ref",
] as const;

/** The intersection of Puck's field names and MCP's property key rules. */
export const FIELD_NAME_PATTERN = /^[A-Za-z][A-Za-z0-9_-]{0,63}$/;

/**
 * JSON Schema keywords that zod emits for the constructs a spec may use.
 * Anything else on a schema node (a misspelled meta key, `anyOf` from a union,
 * `format` from `z.email()`, …) breaks the "meta-keys" rule, and so does one of
 * these keywords when .meta() sets it.
 */
export const SCHEMA_KEYWORDS = [
  "$schema",
  "type",
  "properties",
  "required",
  "additionalProperties",
  "items",
  "enum",
  "const",
  "default",
  "minLength",
  "maxLength",
  "pattern",
  "minimum",
  "maximum",
  "minItems",
  "maxItems",
  "propertyNames",
] as const;

const ALLOWED_KEYS = new Set<string>([...SCHEMA_KEYWORDS, ...META_KEYS]);
const META_KEY_SET = new Set<string>(META_KEYS);
const REF_KEYS = ["$ref", "$defs", "definitions"];
const NESTED_KEYS = ["additionalProperties", "propertyNames"];
const LIST_KEYS = ["anyOf", "oneOf", "allOf", "prefixItems"];
const RESERVED = new Set<string>(RESERVED_FIELD_NAMES);
/** Number keywords that zod emits for .gt(), .lt(), .positive(), .multipleOf() and the like. */
const NUMBER_KEYWORDS = new Set([
  "exclusiveMinimum",
  "exclusiveMaximum",
  "multipleOf",
]);

/** The keys that only slot(), richText(), image() and link() write (HelperMeta). */
const HELPER_META_KEYS: readonly (keyof HelperMeta)[] = [
  "x-slot",
  "x-richtext",
  "x-image",
  "x-link",
  "x-lost-checks",
];
/** The keys that mark a node as the value of a helper. */
const HELPER_NODE_KEYS = ["x-slot", "x-richtext", "x-image", "x-link"];

/** zod wrappers that keep the schema they wrap in def.innerType. */
const WRAPPER_TYPES = new Set([
  "optional",
  "nullable",
  "default",
  "prefault",
  "nonoptional",
  "readonly",
  "catch",
]);

const hasOwn = (value: object, key: string): boolean =>
  Object.prototype.hasOwnProperty.call(value, key);

const childPath = (path: string, segment: string) =>
  path === "" ? segment : `${path}.${segment}`;

const sameJson = (a: unknown, b: unknown) =>
  JSON.stringify(a) === JSON.stringify(b);

type Report = (rule: SpecRuleId, path: string, message: string) => void;

/**
 * Compares the helper-only keys of a props schema (`actual`, from
 * toJsonSchema) with the ones the helpers wrote (`written`, from
 * toHelperJsonSchema), node by node: a key that no helper wrote, a missing
 * one or a changed value breaks "meta-keys". GlobalMeta types these keys as
 * never, so this catches the ones that a cast put in .meta().
 */
function checkHelperMeta(
  actual: unknown,
  written: unknown,
  path: string,
  report: Report
) {
  if (!isJsonSchemaNode(actual)) return;

  const helper: JsonSchema = isJsonSchemaNode(written) ? written : {};
  const differ = HELPER_META_KEYS.filter(
    (key) =>
      hasOwn(actual, key) !== hasOwn(helper, key) ||
      stableStringify(actual[key]) !== stableStringify(helper[key])
  );

  if (differ.length > 0) {
    report(
      "meta-keys",
      path,
      `${differ.join(
        ", "
      )} must be exactly what slot(), richText(), image() and link() write; do not set ${
        differ.length === 1 ? "it" : "them"
      } in .meta()`
    );
  }

  const child = (key: string): unknown =>
    hasOwn(helper, key) ? helper[key] : undefined;
  const { properties } = actual;
  const helperProperties = child("properties");

  if (isJsonSchemaNode(properties)) {
    for (const name of Object.keys(properties)) {
      checkHelperMeta(
        properties[name],
        isJsonSchemaNode(helperProperties) && hasOwn(helperProperties, name)
          ? helperProperties[name]
          : undefined,
        childPath(path, name),
        report
      );
    }
  }

  checkHelperMeta(actual.items, child("items"), `${path}[]`, report);

  for (const key of NESTED_KEYS) {
    checkHelperMeta(actual[key], child(key), `${path}{${key}}`, report);
  }

  for (const key of LIST_KEYS) {
    const list = actual[key];
    const helperList = child(key);

    if (Array.isArray(list)) {
      list.forEach((item, index) =>
        checkHelperMeta(
          item,
          Array.isArray(helperList) ? helperList[index] : undefined,
          `${path}{${key}[${index}]}`,
          report
        )
      );
    }
  }
}

/**
 * x-item-label goes on a list, and its placeholders name text or number
 * fields of the item (or {n}, the index), because the editor only inserts
 * those.
 */
function checkItemLabel(node: JsonSchema, path: string, report: Report) {
  const template = node["x-item-label"];
  const { items } = node;

  if (
    node.type !== "array" ||
    hasOwn(node, "x-slot") ||
    !isJsonSchemaNode(items) ||
    items.type !== "object"
  ) {
    report("item-label", path, "x-item-label is only valid on a list");

    return;
  }
  if (typeof template !== "string") {
    report("item-label", path, "x-item-label must be a string");

    return;
  }

  const properties = isJsonSchemaNode(items.properties) ? items.properties : {};
  const invalid: string[] = [];

  for (const [placeholder, name] of template.matchAll(ITEM_LABEL_PLACEHOLDER)) {
    if (name === "n") continue;

    const field = hasOwn(properties, name) ? properties[name] : undefined;
    const type = isJsonSchemaNode(field) ? field.type : undefined;

    if (type !== "string" && type !== "number" && type !== "integer") {
      invalid.push(placeholder);
    }
  }

  if (invalid.length > 0) {
    report(
      "item-label",
      path,
      `x-item-label names ${invalid.join(
        ", "
      )}: a placeholder must be {n} or a text or number field of the item`
    );
  }
}

/**
 * Compares a props schema with the one zod generates without any metadata
 * (`bare`): .meta() may only add META_KEYS. It must not add a JSON Schema
 * keyword or change one that zod generates, for example additionalProperties
 * on a z.object or type on a z.string.
 */
function checkMeta(
  withMeta: unknown,
  bare: unknown,
  path: string,
  report: Report
) {
  if (!isJsonSchemaNode(withMeta) || !isJsonSchemaNode(bare)) return;
  // A $ref (from .meta({ id })) is reported by "no-ref".
  if (hasOwn(withMeta, "$ref")) return;

  for (const key of Object.keys(withMeta)) {
    const value = withMeta[key];
    const bareValue = bare[key];

    if (!hasOwn(bare, key)) {
      // Keys outside ALLOWED_KEYS are reported by checkNode.
      if (ALLOWED_KEYS.has(key) && !META_KEY_SET.has(key)) {
        report("meta-keys", path, `.meta() may not set "${key}"`);
      }
    } else if (
      key === "properties" &&
      isJsonSchemaNode(value) &&
      isJsonSchemaNode(bareValue) &&
      sameJson(Object.keys(value), Object.keys(bareValue))
    ) {
      for (const name of Object.keys(value)) {
        checkMeta(value[name], bareValue[name], childPath(path, name), report);
      }
    } else if (
      key === "items" &&
      isJsonSchemaNode(value) &&
      isJsonSchemaNode(bareValue)
    ) {
      checkMeta(value, bareValue, `${path}[]`, report);
    } else if (
      NESTED_KEYS.indexOf(key) !== -1 &&
      isJsonSchemaNode(value) &&
      isJsonSchemaNode(bareValue)
    ) {
      checkMeta(value, bareValue, `${path}{${key}}`, report);
    } else if (
      LIST_KEYS.indexOf(key) !== -1 &&
      Array.isArray(value) &&
      Array.isArray(bareValue) &&
      value.length === bareValue.length
    ) {
      bareValue.forEach((item, index) =>
        checkMeta(value[index], item, `${path}{${key}[${index}]}`, report)
      );
    } else if (!sameJson(value, bareValue)) {
      report("meta-keys", path, `.meta() may not change "${key}"`);
    }
  }
}

function checkSlotNode(
  node: JsonSchema,
  path: string,
  registered: ReadonlySet<string>,
  report: Report
) {
  const items = node.items;
  const shellOk =
    node.type === "array" &&
    isJsonSchemaNode(items) &&
    items.type === "object" &&
    items.additionalProperties === false &&
    isJsonSchemaNode(items.properties) &&
    Object.keys(items.properties).sort().join(",") === "props,type";

  if (!shellOk) {
    report(
      "slot-shape",
      path,
      "x-slot is only valid on the array that slot() creates"
    );
  }

  const rule = node["x-slot"];
  const names = isJsonSchemaNode(rule)
    ? Array.isArray(rule.allow)
      ? rule.allow
      : rule.disallow
    : undefined;

  if (!Array.isArray(names)) {
    report("slot-targets", path, "x-slot needs an allow or disallow list");

    return;
  }

  for (const name of names) {
    if (typeof name !== "string" || !registered.has(name)) {
      report(
        "slot-targets",
        path,
        `slot rule names ${JSON.stringify(
          name
        )}, which is not a registered block type`
      );
    }
  }
}

/**
 * Checks one node of a props schema and the nodes under it, including the
 * ones that are not fields (array items, records, unions), in document order.
 */
function checkNode(
  node: JsonSchema,
  path: string,
  registered: ReadonlySet<string>,
  report: Report
) {
  for (const key of REF_KEYS) {
    if (hasOwn(node, key)) {
      report(
        "no-ref",
        path,
        `${key} is not allowed: remove .meta({ id }) and use inline schemas`
      );
    }
  }

  for (const key of Object.keys(node)) {
    if (REF_KEYS.indexOf(key) !== -1 || ALLOWED_KEYS.has(key)) continue;

    report(
      "meta-keys",
      path,
      NUMBER_KEYWORDS.has(key)
        ? `"${key}" is not allowed: limit numbers with .int(), .min() and .max(), because the editor fields ignore steps and exclusive bounds`
        : `"${key}" is not an allowed JSON Schema keyword or meta key`
    );
  }

  // .nullable() and unions of plain types give type: ["string", "null"].
  if (Array.isArray(node.type)) {
    report(
      "meta-keys",
      path,
      "a field has one JSON type: nullable fields and unions are not allowed"
    );
  }

  if (hasOwn(node, "x-item-label")) checkItemLabel(node, path, report);

  if (hasOwn(node, "x-slot")) {
    // The item shell's props record is open on purpose: the page validator
    // checks each child with its own spec.
    checkSlotNode(node, path, registered, report);

    return;
  }

  // richText() is a looseObject on purpose: zod normalizes the document.
  if (hasOwn(node, "x-richtext")) return;

  if (node.type === "object" && node.additionalProperties !== false) {
    report(
      "strict-objects",
      path,
      "objects must be z.strictObject (additionalProperties: false)"
    );
  }

  const { items } = node;
  const helperItems =
    isJsonSchemaNode(items) &&
    HELPER_NODE_KEYS.some((key) => hasOwn(items, key));

  if (node.type === "array" && helperItems) {
    report(
      "object-arrays",
      path,
      "list items must be z.strictObject({...}): put the helper in a field of the item, e.g. z.array(z.strictObject({ image: image() }))"
    );
  } else if (
    node.type === "array" &&
    !(isJsonSchemaNode(items) && items.type === "object")
  ) {
    report(
      "object-arrays",
      path,
      'arrays must hold objects, e.g. [{ label: "志工" }] instead of ["志工"]'
    );
  } else if (node.type === "array" && typeof node.maxItems !== "number") {
    // The page validator checks a list only up to one item past its maximum,
    // so that a long list in a page costs no more than a short one.
    report("object-arrays", path, "lists need a maximum: add .max(n)");
  }

  const children: [JsonSchema, string][] = [];

  if (isJsonSchemaNode(node.properties)) {
    for (const name of Object.keys(node.properties)) {
      const child = node.properties[name];

      if (isJsonSchemaNode(child))
        children.push([child, childPath(path, name)]);
    }
  }
  if (isJsonSchemaNode(node.items)) children.push([node.items, `${path}[]`]);

  for (const key of ["additionalProperties", "propertyNames"]) {
    const child = node[key];

    if (isJsonSchemaNode(child)) children.push([child, `${path}{${key}}`]);
  }

  for (const key of ["anyOf", "oneOf", "allOf", "prefixItems"]) {
    const list = node[key];

    if (Array.isArray(list)) {
      list.forEach((child, index) => {
        if (isJsonSchemaNode(child)) {
          children.push([child, `${path}{${key}[${index}]}`]);
        }
      });
    }
  }

  for (const [child, childKey] of children) {
    checkNode(child, childKey, registered, report);
  }
}

/** Where the slots are inside a field: "slot", "{name:…}" or "array<{name:…}>"; null when it holds none. */
function slotSignature(node: JsonSchema): string | null {
  if (hasOwn(node, "x-slot")) return "slot";
  if (hasOwn(node, "x-richtext") || hasOwn(node, "x-image")) return null;
  if (node.type === "object") return objectSignature(node);
  if (
    node.type === "array" &&
    isJsonSchemaNode(node.items) &&
    node.items.type === "object"
  ) {
    const inner = objectSignature(node.items);

    return inner === null ? null : `array<${inner}>`;
  }

  return null;
}

function objectSignature(node: JsonSchema): string | null {
  const { properties } = node;

  if (!isJsonSchemaNode(properties)) return null;

  const parts: string[] = [];

  for (const name of Object.keys(properties).sort()) {
    const child = properties[name];
    const signature = isJsonSchemaNode(child) ? slotSignature(child) : null;

    if (signature !== null) parts.push(`${name}:${signature}`);
  }

  return parts.length > 0 ? `{${parts.join(",")}}` : null;
}

type FieldUse = { type: string; path: string; signature: string | null };

type ZodWrapperDef = { type: string; innerType?: z.core.$ZodType };

/**
 * Strips the zod wrappers (.optional(), .default(), …) off a field down to the
 * schema a helper made, or down to the first schema that is not a wrapper.
 */
function unwrapField(field: z.core.$ZodType): {
  schema: z.core.$ZodType;
  wrappers: string[];
  helper: HelperMeta | undefined;
} {
  const wrappers: string[] = [];
  let schema = field;

  for (;;) {
    const helper = helperMetaOf(schema);

    if (helper !== undefined) return { schema, wrappers, helper };

    const def = schema._zod.def as ZodWrapperDef;

    if (!WRAPPER_TYPES.has(def.type) || def.innerType === undefined) {
      return { schema, wrappers, helper };
    }
    wrappers.push(def.type);
    schema = def.innerType;
  }
}

/** The object schema of a group field, or of the items of a list field. */
function nestedShape(
  schema: z.core.$ZodType,
  path: readonly string[]
): [z.core.$ZodShape, string[]] | undefined {
  const def = schema._zod.def;

  if (def.type === "object") {
    return [(def as z.core.$ZodObjectDef).shape, [...path]];
  }
  if (def.type === "array") {
    const item = unwrapField((def as z.core.$ZodArrayDef).element);
    const itemDef = item.schema._zod.def;

    if (item.helper === undefined && itemDef.type === "object") {
      return [(itemDef as z.core.$ZodObjectDef).shape, [...path, "[]"]];
    }
  }

  return undefined;
}

/** safeParse, with a default function or a check that throws counted as a failure. */
const tryParse = (schema: z.core.$ZodType, value: unknown) => {
  try {
    return z.safeParse(schema, value);
  } catch {
    return { success: false as const };
  }
};

/**
 * What is wrong with the default of a field, if anything. A required link()
 * or image() must fail without a value (its .prefault() is incomplete on
 * purpose); every other top-level field needs a default; and a default must
 * pass validation unchanged, because zod returns it as it is.
 */
function defaultProblem(
  field: z.core.$ZodType,
  required: boolean,
  topLevel: boolean
): string | undefined {
  const first = tryParse(field, undefined);

  if (required) {
    return first.success
      ? "a required link() or image() must stay required: do not give it a default (an optional link is link({ optional: true }))"
      : undefined;
  }
  if (!first.success) {
    return topLevel
      ? "needs a default that passes validation (only the required link() and image() may lack one)"
      : undefined;
  }
  if (first.data === undefined) return undefined;

  const expected = stableStringify(first.data);
  const second = tryParse(field, first.data);

  if (!second.success) return "the default does not pass validation";
  if (stableStringify(second.data) !== expected) {
    return "validation changes the default: write it in the shape the field outputs (rich text through fitRichTextToTypes, objects with every field)";
  }

  return undefined;
}

/**
 * The "defaults" rule for the fields of an object schema, then for the fields
 * of its groups and list items. Fields inside groups and list items may lack
 * a default: their object's default holds them.
 */
function checkDefaults(
  shape: z.core.$ZodShape,
  path: readonly string[],
  topLevel: boolean,
  report: Report
) {
  for (const name of Object.keys(shape)) {
    const field = shape[name];
    const fieldPath = [...path, name];
    const key = fieldPathKey(fieldPath);
    const { schema, wrappers, helper } = unwrapField(field);
    const linkOrImage =
      helper !== undefined &&
      (hasOwn(helper, "x-link") || hasOwn(helper, "x-image"));

    if (
      linkOrImage &&
      wrappers.some((type) => type === "optional" || type === "nullable")
    ) {
      report(
        "defaults",
        key,
        "do not wrap link() or image() in .optional() or .nullable(): an optional link is link({ optional: true }), and image() is always required"
      );
      continue;
    }

    const required =
      helper?.["x-image"] === true || helper?.["x-link"]?.optional === false;
    const problem = defaultProblem(field, required, topLevel);

    if (problem !== undefined) report("defaults", key, problem);

    // Slots, rich text, images and links have no fields of their own.
    if (helper !== undefined) continue;

    const nested = nestedShape(schema, fieldPath);

    if (nested) checkDefaults(nested[0], nested[1], false, report);
  }
}

/**
 * Checks the writing rules of spec §4.3 on a set of block specs and the page
 * root: type names, unique types, props that convert to an inline
 * `type: "object"` schema, strict objects (except the slot item's props and
 * rich text), arrays of objects only (not of helper values) and with a
 * maximum (slots excepted), a title on every field, field names and reserved
 * names (including Object.prototype's), keys limited to SCHEMA_KEYWORDS and
 * META_KEYS with .meta() adding META_KEYS only (so no steps or exclusive
 * number bounds), one JSON type per node, helper-only keys exactly as the
 * helpers wrote them, x-item-label placeholders that name text or number
 * fields of the item, the same structure for every field name that holds
 * slots (rule 8), slot rules that name registered blocks, at least one
 * example, and defaults ("defaults": every top-level field has a default
 * except the required link() and image(), which must fail without a value
 * and are never wrapped in .optional() or .nullable(); a default, at any
 * level, passes validation unchanged).
 *
 * It only looks at the specs: "every example passes the page validator" is
 * tested with the validator. A spec that zod cannot convert to JSON Schema
 * (for example z.custom()) makes it throw zod's error.
 */
export function checkSpecRules(input: {
  blocks: readonly AnyBlockSpec[];
  root: PageRootSpec;
}): SpecRuleViolation[] {
  const violations: SpecRuleViolation[] = [];
  const registered = new Set(input.blocks.map((spec) => spec.type));
  const seen = new Set<string>();
  const fieldUses = new Map<string, FieldUse[]>();

  const checkProps = (type: string, spec: AnyBlockSpec | PageRootSpec) => {
    const report: Report = (rule, path, message) =>
      violations.push({ rule, type, path, message });
    const schema = toJsonSchema(spec);

    if (schema.type !== "object" || hasOwn(schema, "$ref")) {
      report(
        "root-object",
        "",
        'props must convert to an inline schema of type "object"'
      );
    }

    checkNode(schema, "", registered, report);
    checkMeta(
      schema,
      z.toJSONSchema(spec.props, {
        ...JSON_SCHEMA_OPTIONS,
        metadata: z.registry(),
      }),
      "",
      report
    );
    checkHelperMeta(schema, toHelperJsonSchema(spec.props), "", report);

    eachField(schema, ({ path, name, node }) => {
      const key = fieldPathKey(path);

      if (typeof node.title !== "string" || node.title.trim() === "") {
        report("title-required", key, `field "${name}" needs a title`);
      }
      if (!FIELD_NAME_PATTERN.test(name)) {
        report(
          "field-name",
          key,
          `field name "${name}" must match ${FIELD_NAME_PATTERN}`
        );
      }
      // Object.prototype names (constructor, toString, …) would read the
      // inherited value when the prop is missing.
      if (RESERVED.has(name) || hasOwn(Object.prototype, name)) {
        report("reserved-name", key, `field name "${name}" is reserved`);
      }

      const uses = fieldUses.get(name) ?? [];

      uses.push({ type, path: key, signature: slotSignature(node) });
      fieldUses.set(name, uses);
    });

    checkDefaults(spec.props.shape, [], true, report);
  };

  for (const spec of input.blocks) {
    const { type } = spec;

    if (
      typeof type !== "string" ||
      !BLOCK_TYPE_PATTERN.test(type) ||
      type === "Root"
    ) {
      violations.push({
        rule: "type-name",
        type: String(type),
        path: "",
        message: `type must match ${BLOCK_TYPE_PATTERN} and must not be "Root"`,
      });
    }
    if (seen.has(type)) {
      violations.push({
        rule: "unique-type",
        type,
        path: "",
        message: `block type "${type}" is registered more than once`,
      });
    }
    seen.add(type);

    if (!Array.isArray(spec.examples) || spec.examples.length === 0) {
      violations.push({
        rule: "example-count",
        type,
        path: "",
        message: "a block needs at least one example",
      });
    }

    checkProps(type, spec);
  }

  checkProps("root", input.root);

  for (const [name, uses] of fieldUses) {
    if (uses.every((use) => use.signature === null)) continue;

    const [first, ...rest] = uses;

    for (const use of rest) {
      if (use.signature !== first.signature) {
        violations.push({
          rule: "slot-shape",
          type: use.type,
          path: use.path,
          message: `field "${name}" holds slots, so it must have the same structure in every block: ${
            first.type
          } (${first.path}) is ${
            first.signature ?? "not a slot"
          }, this one is ${use.signature ?? "not a slot"}`,
        });
      }
    }
  }

  return violations;
}
