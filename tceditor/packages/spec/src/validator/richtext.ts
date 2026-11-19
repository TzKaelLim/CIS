import { RICHTEXT_MAX_DEPTH } from "@tzuchi/tceditor/rules";
import { hasOwn, isRecord, type UnknownRecord } from "./values";

// Nodes and their content arrays alternate, plus marks and attrs below the
// deepest node that normalizeRichText keeps.
const DEPTH_LIMIT = 2 * RICHTEXT_MAX_DEPTH + 8;

/** Values that JSON leaves out of a record and writes as null in an array. */
const isOmitted = (value: unknown): boolean =>
  value === undefined ||
  typeof value === "function" ||
  typeof value === "symbol";

/**
 * Whether `key: value` of a record takes part in the comparison. Attributes
 * that are null and empty attrs, content and marks carry no meaning, because
 * the editor leaves attributes out when an extension (such as TextAlign) is
 * off, and normalizeRichText writes them as null. Inside attrs, only null
 * values are left out. Values that JSON cannot hold never count.
 */
function counts(key: string, value: unknown, inAttrs: boolean): boolean {
  if (isOmitted(value)) return false;
  if (inAttrs) return value !== null;
  if (key === "attrs" && isRecord(value)) return hasAttribute(value);
  if ((key === "content" || key === "marks") && Array.isArray(value)) {
    return value.length > 0;
  }

  return true;
}

function hasAttribute(attrs: UnknownRecord): boolean {
  for (const name of Object.keys(attrs)) {
    if (counts(name, attrs[name], true)) return true;
  }

  return false;
}

/** The number of keys of `record` that take part in the comparison. */
function countKeys(record: UnknownRecord, inAttrs: boolean): number {
  let count = 0;

  for (const key of Object.keys(record)) {
    if (counts(key, record[key], inAttrs)) count++;
  }

  return count;
}

/** A pair of arrays, or of records, whose children are still to compare. */
type Frame =
  | {
      before: readonly unknown[];
      after: readonly unknown[];
      keys: null;
      inAttrs: false;
      next: number;
      /** The depth of the children */
      depth: number;
    }
  | {
      before: UnknownRecord;
      after: UnknownRecord;
      /** The keys of `before`; those that don't count are skipped */
      keys: readonly string[];
      /** The records are the attrs of a node or a mark */
      inAttrs: boolean;
      next: number;
      depth: number;
    };

// JSON writes a number that is not finite as null
const jsonValue = (value: unknown): unknown =>
  typeof value === "number" && !Number.isFinite(value) ? null : value;

// In an array, JSON also writes undefined, functions and symbols as null
const itemValue = (value: unknown): unknown =>
  isOmitted(value) ? null : value;

/**
 * Compares two values without going into their children and returns true
 * when they differ. Two arrays of the same length, or two records with the
 * same keys, are pushed onto `stack` so their children are compared later.
 * `isAttrs` is true when the values are those of an `attrs` key.
 */
function differs(
  before: unknown,
  after: unknown,
  depth: number,
  isAttrs: boolean,
  stack: Frame[]
): boolean {
  if (depth > DEPTH_LIMIT) return true;

  const a = jsonValue(before);
  const b = jsonValue(after);

  // JSON.stringify throws on a bigint
  if (typeof a === "bigint" || typeof b === "bigint") return true;

  // Reached only at the top: record keys with such values don't count, and
  // array items go through itemValue
  if (isOmitted(a) || isOmitted(b)) return isOmitted(a) !== isOmitted(b);

  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
      return true;
    }

    if (a.length > 0) {
      stack.push({
        before: a,
        after: b,
        keys: null,
        inAttrs: false,
        next: 0,
        depth: depth + 1,
      });
    }

    return false;
  }

  if (isRecord(a) || isRecord(b)) {
    if (!isRecord(a) || !isRecord(b)) return true;

    const keys = Object.keys(a);
    let count = 0;

    for (const key of keys) {
      if (!counts(key, a[key], isAttrs)) continue;
      if (!hasOwn(b, key) || !counts(key, b[key], isAttrs)) return true;
      count++;
    }

    if (countKeys(b, isAttrs) !== count) return true;

    if (count > 0) {
      stack.push({
        before: a,
        after: b,
        keys,
        inAttrs: isAttrs,
        next: 0,
        depth: depth + 1,
      });
    }

    return false;
  }

  return a !== b;
}

/**
 * True when cleaning changed the meaning of a rich text value: a node, a
 * mark, a link or an attribute was removed or changed. Values too deep or
 * cyclic to compare count as changed (normalizeRichText flattens them).
 *
 * The comparison ignores attributes that are null, empty attrs, content and
 * marks, and the order of keys. It walks both values together with an
 * explicit stack (at most one frame per level), copies nothing and stops at
 * the first difference, so its memory does not grow with the number of
 * nodes in the document.
 */
export function isRichTextChanged(before: unknown, after: unknown): boolean {
  const stack: Frame[] = [];

  try {
    if (differs(before, after, 0, false, stack)) return true;

    while (stack.length > 0) {
      const frame = stack[stack.length - 1];

      if (frame.keys === null) {
        if (frame.next === frame.before.length) {
          stack.pop();
          continue;
        }

        const index = frame.next++;

        if (
          differs(
            itemValue(frame.before[index]),
            itemValue(frame.after[index]),
            frame.depth,
            false,
            stack
          )
        ) {
          return true;
        }
      } else {
        if (frame.next === frame.keys.length) {
          stack.pop();
          continue;
        }

        const key = frame.keys[frame.next++];
        const value = frame.before[key];

        if (!counts(key, value, frame.inAttrs)) continue;

        if (
          differs(
            value,
            frame.after[key],
            frame.depth,
            !frame.inAttrs && key === "attrs",
            stack
          )
        ) {
          return true;
        }
      }
    }

    return false;
  } catch {
    // A getter or a proxy that throws
    return true;
  }
}
