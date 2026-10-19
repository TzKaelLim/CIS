import type {
  ArrayField,
  Field,
  Fields,
  NumberField,
  SlotField,
} from "@tzuchi/tceditor";
import { richTextFeaturesToOptions } from "@tzuchi/tceditor/rules";
import type { RichTextFeature } from "@tzuchi/tceditor/rules";
import type * as z from "zod";
import type { AnyBlockSpec, PageRootSpec } from "../define";
import { fieldKindOf } from "../field-kind";
import { toJsonSchema, type JsonSchema } from "../json-schema";
import {
  RADIO_MAX_OPTIONS,
  enumValues,
  hasOwn,
  isSchemaObject,
  numberBound,
  optionLabel,
  propertiesOf,
  titleOf,
} from "./schema-utils";

export type FieldFactories = {
  /** 產生圖片欄位（Puck 的 custom 欄位）。name 是欄位名稱，label 是欄位的 title。 */
  image?: (ctx: { name: string; label: string }) => Field;
};

/** x-item-label 樣板中的 {欄位名} 與 {n}。 */
const ITEM_LABEL_PLACEHOLDER = /\{([A-Za-z][A-Za-z0-9_-]{0,63})\}/g;

/**
 * 依 x-item-label 樣板產生清單項目的摘要：{n} 代入從 1 起算的序號，
 * {欄位名} 代入項目的自有屬性（只接受字串與數字）。結果為空字串時改用「第 n 項」。
 */
export function formatItemLabel(
  template: string,
  item: unknown,
  index: number | undefined
): string {
  const label = template
    .replace(ITEM_LABEL_PLACEHOLDER, (_placeholder, key: string) => {
      if (key === "n") return index === undefined ? "" : String(index + 1);
      if (typeof item !== "object" || item === null || !hasOwn(item, key)) {
        return "";
      }
      const value = (item as Record<string, unknown>)[key];
      return typeof value === "string" || typeof value === "number"
        ? String(value)
        : "";
    })
    .replace(/\s+/g, " ")
    .trim();
  if (label === "" && index !== undefined) return `第 ${index + 1} 項`;
  return label;
}

/** 物件 schema 中有 default 的欄位，值深拷貝。 */
function defaultsOf(node: JsonSchema): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(propertiesOf(node))
      .filter(([, property]) => hasOwn(property, "default"))
      .map(([name, property]) => [name, structuredClone(property.default)])
  );
}

function featuresOf(node: JsonSchema, where: string): RichTextFeature[] {
  const richtext = node["x-richtext"];
  if (
    !isSchemaObject(richtext) ||
    !Array.isArray(richtext.features) ||
    !richtext.features.every((feature) => typeof feature === "string")
  ) {
    throw new TypeError(`${where}: x-richtext must be { features: string[] }`);
  }
  return richtext.features as RichTextFeature[];
}

function numberField(node: JsonSchema, label: string): NumberField {
  const field: NumberField = { type: "number", label };
  const min = numberBound(node, "minimum");
  const max = numberBound(node, "maximum");
  if (min !== undefined) field.min = min;
  if (max !== undefined) field.max = max;
  if (node.type === "integer") field.step = 1;
  return field;
}

function choiceField(node: JsonSchema, label: string): Field {
  const options = enumValues(node).map((value) => ({
    label: optionLabel(node, value),
    value,
  }));
  return options.length <= RADIO_MAX_OPTIONS
    ? { type: "radio", label, options }
    : { type: "select", label, options };
}

function slotField(node: JsonSchema, label: string, where: string): SlotField {
  const rule = node["x-slot"];
  if (isSchemaObject(rule) && Array.isArray(rule.allow)) {
    return { type: "slot", label, allow: rule.allow.map(String) };
  }
  if (isSchemaObject(rule) && Array.isArray(rule.disallow)) {
    return { type: "slot", label, disallow: rule.disallow.map(String) };
  }
  throw new TypeError(`${where}: x-slot must be { allow } or { disallow }`);
}

function arrayField(
  node: JsonSchema,
  label: string,
  where: string,
  factories: FieldFactories
): ArrayField {
  const items = node.items;
  if (!isSchemaObject(items) || fieldKindOf(items) !== "object") {
    throw new TypeError(`${where}: array items must be objects`);
  }
  const field: ArrayField = {
    type: "array",
    label,
    arrayFields: fieldsOf(items, `${where}[]`, factories),
  };
  if (typeof node.minItems === "number") field.min = node.minItems;
  if (typeof node.maxItems === "number") field.max = node.maxItems;
  const itemDefaults = defaultsOf(items);
  if (Object.keys(itemDefaults).length > 0) {
    field.defaultItemProps = () => structuredClone(itemDefaults);
  }
  const template = node["x-item-label"];
  if (typeof template === "string") {
    field.getItemSummary = (item, index) =>
      formatItemLabel(template, item, index);
  }
  return field;
}

function toField(
  node: JsonSchema,
  name: string,
  where: string,
  factories: FieldFactories
): Field {
  const label = titleOf(node, name);
  const inline = node["x-inline"] === true;
  switch (fieldKindOf(node)) {
    case "text":
      return inline
        ? { type: "text", label, contentEditable: true }
        : { type: "text", label };
    case "textarea":
      return inline
        ? { type: "textarea", label, contentEditable: true }
        : { type: "textarea", label };
    case "link":
      return { type: "text", label };
    case "number":
      return numberField(node, label);
    case "choice":
      return choiceField(node, label);
    case "boolean":
      return {
        type: "radio",
        label,
        options: [
          { label: "是", value: true },
          { label: "否", value: false },
        ],
      };
    case "richtext":
      return {
        type: "richtext",
        label,
        contentEditable: true,
        options: richTextFeaturesToOptions(featuresOf(node, where)),
      };
    case "array":
      return arrayField(node, label, where, factories);
    case "object":
      return {
        type: "object",
        label,
        objectFields: fieldsOf(node, where, factories),
      };
    case "slot":
      return slotField(node, label, where);
    case "image":
      if (!factories.image) {
        throw new TypeError(
          `toPuckFields: "${where}" is an image field; pass factories.image`
        );
      }
      return factories.image({ name, label });
  }
}

function fieldsOf(
  node: JsonSchema,
  where: string,
  factories: FieldFactories
): Record<string, Field> {
  return Object.fromEntries(
    Object.entries(propertiesOf(node)).map(([name, property]) => [
      name,
      toField(property, name, `${where}.${name}`, factories),
    ])
  );
}

/** 依規格的 JSON Schema 產生 Puck 的 fields（規格 §4.2、§5.2）。 */
export function toPuckFields<S extends AnyBlockSpec | PageRootSpec>(
  spec: S,
  factories: FieldFactories = {}
): Fields<z.output<S["props"]>> {
  const owner = spec.kind === "block" ? spec.type : "root";
  return fieldsOf(toJsonSchema(spec), owner, factories) as Fields<
    z.output<S["props"]>
  >;
}

/** 規格的預設值（JSON Schema 的 default，含 prefault），深拷貝後回傳。 */
export function toDefaultProps<S extends AnyBlockSpec | PageRootSpec>(
  spec: S
): Partial<z.output<S["props"]>> {
  return defaultsOf(toJsonSchema(spec)) as Partial<z.output<S["props"]>>;
}
