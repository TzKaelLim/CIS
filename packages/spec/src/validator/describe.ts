import type * as z from "zod";
import type { JsonSchema } from "../json-schema";
import type { IssueCode } from "./issues";
import { MESSAGES, type ValueKind, type ValueProblem } from "./messages";
import type { Entry } from "./registry";
import { hasOwn, isRecord, type Segment } from "./values";

/** What a zod issue path points at in the JSON Schema of the props. */
export type FieldAt = {
  /** The issue path; a path into a rich text document stops at its field */
  path: Segment[];
  /** Field titles joined with "／"; "" for the props object itself */
  field: string;
  node: JsonSchema | undefined;
  /** True for the assetId of an image() value */
  imageId: boolean;
};

const toSegment = (key: PropertyKey): Segment =>
  typeof key === "symbol" ? String(key) : key;

const isWholeValue = (node: JsonSchema) =>
  node["x-richtext"] !== undefined || node["x-slot"] !== undefined;

export function fieldAt(
  schema: JsonSchema,
  path: readonly PropertyKey[]
): FieldAt {
  const titles: string[] = [];
  const segments: Segment[] = [];
  let node: JsonSchema | undefined = schema;
  let parent: JsonSchema | undefined;

  for (const key of path) {
    if (node !== undefined && isWholeValue(node)) break;

    const segment = toSegment(key);

    segments.push(segment);
    parent = node;

    if (typeof segment === "number") {
      node = node && isRecord(node.items) ? node.items : undefined;
    } else {
      const properties: unknown = node?.properties;
      const child =
        isRecord(properties) && hasOwn(properties, segment)
          ? properties[segment]
          : undefined;

      node = isRecord(child) ? child : undefined;
      titles.push(
        node !== undefined && typeof node.title === "string"
          ? node.title
          : segment
      );
    }
  }

  const imageId =
    parent?.["x-image"] !== undefined &&
    segments[segments.length - 1] === "assetId";

  // "No image chosen" is about the image field, not its assetId
  if (imageId) titles.pop();

  return { path: segments, field: titles.join("／"), node, imageId };
}

/** The parts of a zod issue (raw or final) that the validator reads. */
export type ZodIssueLike = {
  code: string;
  path?: readonly PropertyKey[];
  input?: unknown;
  expected?: string;
  origin?: string;
  minimum?: number | bigint;
  maximum?: number | bigint;
  inclusive?: boolean;
  values?: readonly unknown[];
  keys?: readonly string[];
  params?: Record<string, unknown>;
};

export type Classified =
  | {
      code: Extract<IssueCode, "unknown_prop" | "unsafe_href" | "alt_required">;
    }
  | { code: "invalid_value"; problem: ValueProblem };

const MAX_SHOWN_BOUND = Number.MAX_SAFE_INTEGER;

const rangeOf = (
  node: JsonSchema | undefined
): readonly [number, number] | undefined => {
  const minimum = node?.minimum;
  const maximum = node?.maximum;

  return typeof minimum === "number" &&
    typeof maximum === "number" &&
    Math.abs(minimum) < MAX_SHOWN_BOUND &&
    Math.abs(maximum) < MAX_SHOWN_BOUND
    ? [minimum, maximum]
    : undefined;
};

const typeProblem = (
  expected: string | undefined,
  node: JsonSchema | undefined
): ValueProblem => {
  const kinds: Record<string, ValueKind> = {
    string: "text",
    boolean: "boolean",
    array: "list",
    object: "object",
    record: "object",
  };

  if (expected === "number" || expected === "int") {
    return {
      kind: "type",
      expected:
        expected === "int" || node?.type === "integer" ? "integer" : "number",
      range: rangeOf(node),
    };
  }

  const kind =
    expected !== undefined && hasOwn(kinds, expected)
      ? kinds[expected]
      : undefined;

  return kind ? { kind: "type", expected: kind } : { kind: "other" };
};

const optionLabel = (value: unknown, node: JsonSchema | undefined) => {
  const labels: unknown = node?.["x-labels"];
  const text = String(value);

  if (isRecord(labels) && hasOwn(labels, text)) {
    const label = labels[text];

    if (typeof label === "string") return `${label}（${text}）`;
  }

  return text;
};

const valueProblem = (issue: ZodIssueLike, at: FieldAt): ValueProblem => {
  const { node } = at;

  if (at.imageId) {
    return issue.input === "" || issue.input === undefined
      ? { kind: "no-image" }
      : { kind: "image-id" };
  }

  if (node?.["x-richtext"] !== undefined) {
    return { kind: "type", expected: "richtext" };
  }

  if (node?.["x-slot"] !== undefined) {
    return { kind: "type", expected: "slot" };
  }

  switch (issue.code) {
    case "invalid_type":
      if (issue.input === undefined) return { kind: "required" };
      if (node?.["x-image"] !== undefined) {
        return { kind: "type", expected: "image" };
      }
      return typeProblem(issue.expected, node);
    case "too_small": {
      const minimum = Number(issue.minimum);

      if (issue.origin === "string" || issue.origin === "array") {
        return {
          kind: "too-short",
          minimum,
          unit: issue.origin === "string" ? "字" : "項",
        };
      }

      return {
        kind: "too-small",
        minimum,
        inclusive: issue.inclusive !== false,
      };
    }
    case "too_big": {
      const maximum = Number(issue.maximum);

      if (issue.origin === "string" || issue.origin === "array") {
        return {
          kind: "too-long",
          maximum,
          unit: issue.origin === "string" ? "字" : "項",
        };
      }

      return { kind: "too-big", maximum, inclusive: issue.inclusive !== false };
    }
    case "invalid_value":
      return {
        kind: "choice",
        options: (issue.values ?? []).map((value) => optionLabel(value, node)),
      };
    case "invalid_format":
      return { kind: "format" };
    default:
      return { kind: "other" };
  }
};

/** Maps a zod issue to an IssueCode (spec §6.2, contract C.2). */
export function classify(issue: ZodIssueLike, at: FieldAt): Classified {
  if (issue.code === "unrecognized_keys") return { code: "unknown_prop" };

  if (issue.code === "custom") {
    const tag = issue.params?.code;

    if (tag === "unsafe_href" || tag === "alt_required") return { code: tag };
  }

  return { code: "invalid_value", problem: valueProblem(issue, at) };
}

/** The Chinese message for a zod issue; used as the per-call error map. */
export function describeIssue(entry: Entry, issue: ZodIssueLike): string {
  const at = fieldAt(entry.schema, issue.path ?? []);
  const place = { label: entry.label, field: at.field };
  const classified = classify(issue, at);

  switch (classified.code) {
    case "invalid_value":
      return MESSAGES.invalid_value({ ...place, problem: classified.problem });
    case "unsafe_href":
      return MESSAGES.unsafe_href(place);
    case "alt_required":
      return MESSAGES.alt_required(place);
    case "unknown_prop":
      // The validator reports one issue per key and builds those messages itself
      return MESSAGES.unknown_prop({ ...place, key: issue.keys?.[0] ?? "" });
  }
}

/** A zod error map bound to one block; zod calls it when issues are read. */
export const errorMapFor =
  (entry: Entry) =>
  (issue: z.core.$ZodRawIssue): string =>
    describeIssue(entry, issue);
