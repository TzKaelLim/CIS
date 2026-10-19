/** Helpers for reading page data, which is untrusted and may be any value. */

export type Segment = string | number;
export type UnknownRecord = Record<string, unknown>;

export const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const hasOwn = (value: object, key: string): boolean =>
  Object.prototype.hasOwnProperty.call(value, key);

/** Reads an own property only, so "constructor" or "__proto__" never reach the prototype. */
export const own = (value: UnknownRecord, key: string): unknown =>
  hasOwn(value, key) ? value[key] : undefined;

/** A null-prototype copy of the own enumerable properties, optionally without one key. */
export function copyRecord(
  value: UnknownRecord,
  without?: string
): UnknownRecord {
  const copy: UnknownRecord = Object.create(null);

  for (const key of Object.keys(value)) {
    if (key !== without) copy[key] = value[key];
  }

  return copy;
}

/**
 * Calls `visit` for every value at `segments` inside `value`, where "[]"
 * stands for every item of an array, with the concrete path of that value
 * (array indexes as numbers). Missing keys and non-arrays are skipped.
 */
export function eachValueAt(
  value: unknown,
  segments: readonly string[],
  visit: (found: unknown, path: Segment[]) => void,
  index = 0,
  path: Segment[] = []
): void {
  if (index === segments.length) {
    visit(value, path);
    return;
  }

  const segment = segments[index];

  if (segment === "[]") {
    if (!Array.isArray(value)) return;

    value.forEach((item: unknown, i) =>
      eachValueAt(item, segments, visit, index + 1, [...path, i])
    );
    return;
  }

  if (isRecord(value) && hasOwn(value, segment)) {
    eachValueAt(value[segment], segments, visit, index + 1, [...path, segment]);
  }
}

/**
 * Returns `value` with every value at `segments` replaced by `replace(found)`.
 * Only the records and arrays on the way are copied; `value` is not changed.
 */
export function replaceAt(
  value: unknown,
  segments: readonly string[],
  replace: (found: unknown) => unknown,
  index = 0
): unknown {
  if (index === segments.length) return replace(value);

  const segment = segments[index];

  if (segment === "[]") {
    return Array.isArray(value)
      ? value.map((item: unknown) =>
          replaceAt(item, segments, replace, index + 1)
        )
      : value;
  }

  if (!isRecord(value) || !hasOwn(value, segment)) return value;

  const copy = copyRecord(value);

  copy[segment] = replaceAt(value[segment], segments, replace, index + 1);

  return copy;
}

/** Follows a concrete path through validated data. */
export function valueAt(value: unknown, path: readonly Segment[]): unknown {
  let current = value;

  for (const segment of path) {
    if (typeof segment === "number" && Array.isArray(current)) {
      current = current[segment];
    } else if (typeof segment === "string" && isRecord(current)) {
      current = own(current, segment);
    } else {
      return undefined;
    }
  }

  return current;
}

/** Sets a value at a concrete path whose containers already exist. */
export function setAt(
  target: UnknownRecord,
  path: readonly Segment[],
  value: unknown
): void {
  const container = valueAt(target, path.slice(0, -1));
  const key = path[path.length - 1];

  if (typeof key === "number" && Array.isArray(container)) {
    container[key] = value;
  } else if (typeof key === "string" && isRecord(container)) {
    container[key] = value;
  } else {
    throw new Error(`Cannot set a value at ${path.join(".")}`);
  }
}
