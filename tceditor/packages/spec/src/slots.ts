import type { AnyBlockSpec } from "./define";
import { eachField, fieldPathKey, toJsonSchema } from "./json-schema";
import type { SlotRule } from "./meta";

export type SlotLocation = {
  /** Field path, e.g. ["columns", "[]", "content"]. */
  path: readonly string[];
  /** The path as a string, e.g. "content" or "columns[].content". */
  key: string;
  rule: SlotRule;
};

/** Every slot of a block, in field order (read from the JSON Schema's `x-slot`). */
export function slotLocations(spec: AnyBlockSpec): readonly SlotLocation[] {
  const locations: SlotLocation[] = [];

  eachField(toJsonSchema(spec), ({ path, node }) => {
    if (Object.prototype.hasOwnProperty.call(node, "x-slot")) {
      locations.push({
        path,
        key: fieldPathKey(path),
        rule: node["x-slot"] as SlotRule,
      });
    }
  });

  return Object.freeze(locations);
}
