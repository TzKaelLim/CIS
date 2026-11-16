import { ComponentData } from "../types";
import { deepEqual } from "fast-equals";

export const getChanged = (
  newItem: Omit<Partial<ComponentData<any>>, "type"> | undefined,
  oldItem: Omit<Partial<ComponentData<any>>, "type"> | null | undefined
) => {
  if (!newItem) {
    return {};
  }

  const newItemProps = newItem.props || {};
  const oldItemProps = oldItem?.props || {};

  // One pass, and "__proto__" stays an own key (see flatten in map-fields.ts)
  return Object.fromEntries(
    Object.keys(newItemProps).map((item): [string, boolean] => [
      item,
      !deepEqual(oldItemProps[item], newItemProps[item]),
    ])
  );
};
