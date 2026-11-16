import type { AnyBlockSpec } from "../define";
import { fieldKindOf } from "../field-kind";
import { toJsonSchema, type JsonSchema } from "../json-schema";
import { toDefaultProps } from "./puck-fields";
import {
  RADIO_MAX_OPTIONS,
  enumValues,
  numberBound,
  optionLabel,
  propertiesOf,
  titleOf,
} from "./schema-utils";

/** Storybook argTypes 的子集合。刻意不 import Storybook 的型別，讓 spec 不依賴 Storybook。 */
export type ArgTypeSpec = {
  name: string;
  description?: string;
  control:
    | false
    | {
        type:
          | "text"
          | "number"
          | "range"
          | "boolean"
          | "radio"
          | "select"
          | "object";
        min?: number;
        max?: number;
        step?: number;
        labels?: Record<string, string>;
      };
  options?: readonly string[];
  table?: { category?: string; defaultValue?: { summary: string } };
};

type Control = Exclude<ArgTypeSpec["control"], false>;

function numberControl(node: JsonSchema): Control {
  const min = numberBound(node, "minimum");
  const max = numberBound(node, "maximum");
  const control: Control = {
    type: min !== undefined && max !== undefined ? "range" : "number",
  };
  if (min !== undefined) control.min = min;
  if (max !== undefined) control.max = max;
  if (typeof node.multipleOf === "number") {
    control.step = node.multipleOf;
  } else if (node.type === "integer") {
    control.step = 1;
  } else if (min !== undefined && max !== undefined) {
    // Storybook 的 range 預設 step 為 1，小數範圍要自己給
    control.step = (max - min) / 100;
  }
  return control;
}

function toArgType(name: string, node: JsonSchema): ArgTypeSpec {
  const argType: ArgTypeSpec = { name: titleOf(node, name), control: false };
  if (typeof node.description === "string") {
    argType.description = node.description;
  }
  switch (fieldKindOf(node)) {
    case "text":
    case "textarea":
    case "link":
      argType.control = { type: "text" };
      break;
    case "number":
      argType.control = numberControl(node);
      break;
    case "choice": {
      const values = enumValues(node).map(String);
      argType.options = values;
      argType.control = {
        type: values.length <= RADIO_MAX_OPTIONS ? "radio" : "select",
        labels: Object.fromEntries(
          values.map((value) => [value, optionLabel(node, value)])
        ),
      };
      break;
    }
    case "boolean":
      argType.control = { type: "boolean" };
      break;
    case "array":
    case "object":
      argType.control = { type: "object" };
      break;
    case "richtext":
    case "slot":
    case "image":
      argType.control = false;
      break;
  }
  const value = node.default;
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    argType.table = { defaultValue: { summary: JSON.stringify(value) } };
  }
  return argType;
}

/** 依規格產生 Storybook 的 argTypes（規格 §4.2 最右欄、§5.3）。key 與規格的欄位名稱相同。 */
export function toArgTypes(spec: AnyBlockSpec): Record<string, ArgTypeSpec> {
  return Object.fromEntries(
    Object.entries(propertiesOf(toJsonSchema(spec))).map(([name, node]) => [
      name,
      toArgType(name, node),
    ])
  );
}

/** story 的 args：規格的預設值（與 toDefaultProps 相同）。 */
export function toStoryArgs(spec: AnyBlockSpec): Record<string, unknown> {
  return toDefaultProps(spec);
}
