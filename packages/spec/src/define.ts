import type * as z from "zod";

export type BlockExample<P extends z.ZodObject = z.ZodObject> = {
  name: string;
  props: z.input<P>;
};

export type BlockSpec<
  T extends string = string,
  P extends z.ZodObject = z.ZodObject
> = Readonly<{
  kind: "block";
  type: T;
  label: string;
  category: string;
  description: string;
  version: number;
  deprecated: boolean;
  props: P;
  examples: readonly BlockExample<P>[];
}>;

export type AnyBlockSpec = BlockSpec<string, z.ZodObject>;

export type PageRootSpec<P extends z.ZodObject = z.ZodObject> = Readonly<{
  kind: "root";
  label: string;
  props: P;
}>;

export type BlockProps<S extends AnyBlockSpec | PageRootSpec> = z.output<
  S["props"]
>;

/**
 * Block type names. At most 27 characters, because the editor creates ids as
 * `${type}-${uuid}` (type length + 37) and node ids are limited to 64.
 */
export const BLOCK_TYPE_PATTERN = /^[A-Z][A-Za-z0-9]{0,26}$/;

/** Longest allowed `description`, in characters. */
export const DESCRIPTION_MAX_LENGTH = 4096;

const fail = (fn: string, message: string): never => {
  throw new TypeError(`${fn}: ${message}`);
};

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim() !== "";

/** True for a schema built with z.strictObject (an object whose catchall is z.never()). */
const isStrictObject = (schema: unknown): boolean => {
  const def = (
    schema as {
      def?: { type?: unknown; catchall?: { def?: { type?: unknown } } };
    }
  )?.def;

  return def?.type === "object" && def.catchall?.def?.type === "never";
};

/**
 * Declares a block. Checks at definition time that the type name matches
 * BLOCK_TYPE_PATTERN and is not "Root", that label and category are not
 * empty, that the description has at most 4,096 characters, that version is a
 * positive integer, that there is at least one example, and that props is a
 * z.strictObject. Throws a TypeError otherwise. The rules that need the JSON
 * Schema or the other blocks are in checkSpecRules.
 */
export function defineBlockSpec<
  const T extends string,
  P extends z.ZodObject
>(input: {
  type: T;
  label: string;
  category: string;
  description: string;
  version: number;
  deprecated?: boolean;
  props: P;
  examples: readonly [BlockExample<P>, ...BlockExample<P>[]];
}): BlockSpec<T, P> {
  const fn = "defineBlockSpec";
  const { type } = input;

  if (typeof type !== "string" || !BLOCK_TYPE_PATTERN.test(type)) {
    fail(fn, `type ${JSON.stringify(type)} must match ${BLOCK_TYPE_PATTERN}`);
  }
  if (type === "Root") fail(fn, `type "Root" is reserved for the page root`);
  if (!isNonEmptyString(input.label)) {
    fail(fn, `${type}: label must not be empty`);
  }
  if (!isNonEmptyString(input.category)) {
    fail(fn, `${type}: category must not be empty`);
  }
  if (
    typeof input.description !== "string" ||
    input.description.length > DESCRIPTION_MAX_LENGTH
  ) {
    fail(
      fn,
      `${type}: description must be a string of at most ${DESCRIPTION_MAX_LENGTH} characters`
    );
  }
  if (!Number.isInteger(input.version) || input.version < 1) {
    fail(fn, `${type}: version must be a positive integer`);
  }
  if (!isStrictObject(input.props)) {
    fail(fn, `${type}: props must be a z.strictObject`);
  }
  if (!Array.isArray(input.examples) || input.examples.length === 0) {
    fail(fn, `${type}: at least one example is required`);
  }

  return Object.freeze({
    kind: "block",
    type,
    label: input.label,
    category: input.category,
    description: input.description,
    version: input.version,
    deprecated: input.deprecated ?? false,
    props: input.props,
    examples: Object.freeze([...input.examples]),
  });
}

/** Declares the page root (page title, description, …). `label` defaults to "頁面". */
export function definePageRoot<P extends z.ZodObject>(input: {
  label?: string;
  props: P;
}): PageRootSpec<P> {
  const fn = "definePageRoot";
  const label = input.label ?? "頁面";

  if (!isNonEmptyString(label)) fail(fn, "label must not be empty");
  if (!isStrictObject(input.props)) {
    fail(fn, "props must be a z.strictObject");
  }

  return Object.freeze({ kind: "root", label, props: input.props });
}
