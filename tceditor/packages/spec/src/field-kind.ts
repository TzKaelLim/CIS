import type { JsonSchema } from "./json-schema";

export type FieldKind =
  | "text"
  | "textarea"
  | "number"
  | "choice"
  | "boolean"
  | "link"
  | "richtext"
  | "array"
  | "object"
  | "slot"
  | "image";

const hasOwn = (value: object, key: string): boolean =>
  Object.prototype.hasOwnProperty.call(value, key);

/**
 * The field kind of a JSON Schema property (spec §4.2). Checked in this
 * order: x-slot, x-image, x-richtext, x-link, enum, string with
 * x-field "textarea", string, integer or number, boolean, array, object.
 * Throws a TypeError for anything else, for example a nullable field.
 */
export function fieldKindOf(node: JsonSchema): FieldKind {
  if (hasOwn(node, "x-slot")) return "slot";
  if (hasOwn(node, "x-image")) return "image";
  if (hasOwn(node, "x-richtext")) return "richtext";
  if (hasOwn(node, "x-link")) return "link";
  if (Array.isArray(node.enum)) return "choice";

  switch (node.type) {
    case "string":
      return node["x-field"] === "textarea" ? "textarea" : "text";
    case "integer":
    case "number":
      return "number";
    case "boolean":
      return "boolean";
    case "array":
      return "array";
    case "object":
      return "object";
  }

  throw new TypeError(
    `fieldKindOf: unsupported schema node with type ${JSON.stringify(
      node.type
    )}`
  );
}
