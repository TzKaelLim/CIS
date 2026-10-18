import * as z from "zod";
import { BLOCK_TYPE_PATTERN } from "./define";
import type { AnyBlockSpec, PageRootSpec } from "./define";
import {
  JSON_SCHEMA_OPTIONS,
  eachField,
  fieldPathKey,
  isJsonSchemaNode,
  toJsonSchema,
} from "./json-schema";
import type { JsonSchema } from "./json-schema";
import { META_KEYS } from "./meta";
import type { LostCheck } from "./meta";

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
  | "example-count";

export type SpecRuleViolation = {
  rule: SpecRuleId;
  /** The block type, or "root" for the page root. */
  type: string;
  /** Where in the props schema, e.g. "columns[].content"; "" for the spec itself. */
  path: string;
  message: string;
};

export const RESERVED_FIELD_NAMES = [
  "id",
  "puck",
  "editMode",
  "children",
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
  "exclusiveMinimum",
  "exclusiveMaximum",
  "multipleOf",
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

/** The key that link(), image() and richText() write, the check they list in x-lost-checks and their JSON type. */
const HELPER_KEYS: readonly (readonly [string, LostCheck, string])[] = [
  ["x-link", "safe-href", "string"],
  ["x-image", "alt-required", "object"],
  ["x-richtext", "richtext-normalize", "object"],
];

const hasOwn = (value: object, key: string): boolean =>
  Object.prototype.hasOwnProperty.call(value, key);

const childPath = (path: string, segment: string) =>
  path === "" ? segment : `${path}.${segment}`;

const sameJson = (a: unknown, b: unknown) =>
  JSON.stringify(a) === JSON.stringify(b);

type Report = (rule: SpecRuleId, path: string, message: string) => void;

/**
 * x-link, x-image, x-richtext and x-lost-checks come from link(), image() and
 * richText() only (GlobalMeta types them as never): a node carries at most one
 * of the three helper keys, with the helper's JSON type and exactly the
 * helper's lost check.
 */
function checkHelperKeys(node: JsonSchema, path: string, report: Report) {
  const helpers = HELPER_KEYS.filter(([key]) => hasOwn(node, key));

  if (helpers.length === 0 && !hasOwn(node, "x-lost-checks")) return;

  const [helper] = helpers;

  if (
    helpers.length !== 1 ||
    node.type !== helper[2] ||
    !sameJson(node["x-lost-checks"], [helper[1]])
  ) {
    report(
      "meta-keys",
      path,
      "x-link, x-image, x-richtext and x-lost-checks are written by link(), image() and richText(); do not set them in .meta()"
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
    if (REF_KEYS.indexOf(key) === -1 && !ALLOWED_KEYS.has(key)) {
      report(
        "meta-keys",
        path,
        `"${key}" is not an allowed JSON Schema keyword or meta key`
      );
    }
  }

  // .nullable() and unions of plain types give type: ["string", "null"].
  if (Array.isArray(node.type)) {
    report(
      "meta-keys",
      path,
      "a field has one JSON type: nullable fields and unions are not allowed"
    );
  }

  checkHelperKeys(node, path, report);

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

  if (
    node.type === "array" &&
    !(isJsonSchemaNode(node.items) && node.items.type === "object")
  ) {
    report(
      "object-arrays",
      path,
      'arrays must hold objects, e.g. [{ label: "志工" }] instead of ["志工"]'
    );
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

/**
 * Checks the writing rules of spec §4.3 on a set of block specs and the page
 * root: type names, unique types, props that convert to an inline
 * `type: "object"` schema, strict objects (except the slot item's props and
 * rich text), arrays of objects only, a title on every field, field names and
 * reserved names (including Object.prototype's), keys limited to
 * SCHEMA_KEYWORDS and META_KEYS with .meta() adding META_KEYS only, one JSON
 * type per node, helper-only keys left to the helpers, the same structure for
 * every field name that holds slots (rule 8), slot rules that name registered
 * blocks, and at least one example.
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
