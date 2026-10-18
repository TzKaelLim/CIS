import type { AnyBlockSpec } from "./define";

export type BlockNode = {
  type: string;
  props: { id: string } & Record<string, unknown>;
};

export type PageData = {
  root: { props: Record<string, unknown> };
  content: BlockNode[];
};

type Item = { type: string; props: Record<string, unknown> };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isSlotItem = (value: unknown): value is Item =>
  isRecord(value) &&
  Object.keys(value).length === 2 &&
  typeof value.type === "string" &&
  isRecord(value.props);

/** Children are recognised by shape: a non-empty array whose items are all exactly `{ type, props }`. */
const isSlotValue = (value: unknown): value is Item[] =>
  Array.isArray(value) && value.length > 0 && value.every(isSlotItem);

function withIds(
  value: unknown,
  ownerId: string,
  path: readonly (string | number)[]
): unknown {
  if (isSlotValue(value)) {
    return value.map((item, index) => ({
      type: item.type,
      props: nodeProps(item.props, [ownerId, ...path, index].join("-")),
    }));
  }
  if (Array.isArray(value)) {
    return value.map((item, index) => withIds(item, ownerId, [...path, index]));
  }
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        withIds(item, ownerId, [...path, key]),
      ])
    );
  }

  return value;
}

function nodeProps(
  props: Record<string, unknown>,
  id: string
): BlockNode["props"] {
  const rest = Object.fromEntries(
    Object.entries(props)
      .filter(([key]) => key !== "id")
      .map(([key, value]) => [key, withIds(value, id, [key])])
  );

  return { id, ...rest };
}

/**
 * A page that holds only `spec.examples[index]`, with deterministic ids: the
 * block is `${type}-ex${index + 1}`, and a child in a slot is its parent's id,
 * the data path to the slot and the child's index (from 0), joined with "-":
 * "Columns-ex1-columns-0-content-1" is the second child of the first column.
 * An `id` already in a child's props is replaced. The props are copied, not
 * shared with the spec, and defaults are not filled in (the page validator
 * does that).
 */
export function exampleToPageData(
  spec: AnyBlockSpec,
  index: number,
  rootProps: Record<string, unknown> = {}
): PageData {
  const example = Number.isInteger(index) ? spec.examples[index] : undefined;

  if (!example) {
    throw new RangeError(
      `exampleToPageData: ${spec.type} has no example at index ${index}`
    );
  }

  return {
    root: { props: structuredClone(rootProps) },
    content: [
      {
        type: spec.type,
        props: nodeProps(
          example.props as Record<string, unknown>,
          `${spec.type}-ex${index + 1}`
        ),
      },
    ],
  };
}
