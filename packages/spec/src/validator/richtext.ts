import { RICHTEXT_MAX_DEPTH, stableStringify } from "@tzuchi/tceditor/rules";
import { isRecord, type UnknownRecord } from "./values";

// Nodes and their content arrays alternate, plus marks and attrs below the
// deepest node that normalizeRichText keeps.
const DEPTH_LIMIT = 2 * RICHTEXT_MAX_DEPTH + 8;

/**
 * A copy for comparison only: attributes that are null and empty attrs,
 * content and marks are left out, because they carry no meaning. The editor
 * leaves attributes out when an extension (such as TextAlign) is off, and
 * normalizeRichText writes them as null.
 */
function canonical(value: unknown, depth: number): unknown {
  if (depth > DEPTH_LIMIT) {
    throw new RangeError("Rich text is nested too deeply to compare");
  }

  if (Array.isArray(value)) {
    return value.map((item: unknown) => canonical(item, depth + 1));
  }

  if (!isRecord(value)) return value;

  const result: UnknownRecord = Object.create(null);

  for (const key of Object.keys(value)) {
    const item = value[key];

    if (key === "attrs" && isRecord(item)) {
      const attrs: UnknownRecord = Object.create(null);

      for (const name of Object.keys(item)) {
        if (item[name] !== null) attrs[name] = canonical(item[name], depth + 2);
      }

      if (Object.keys(attrs).length > 0) result[key] = attrs;
    } else if (
      (key === "content" || key === "marks") &&
      Array.isArray(item) &&
      item.length === 0
    ) {
      continue;
    } else {
      result[key] = canonical(item, depth + 1);
    }
  }

  return result;
}

/**
 * True when cleaning changed the meaning of a rich text value: a node, a
 * mark, a link or an attribute was removed or changed. Values too deep or
 * cyclic to compare count as changed (normalizeRichText flattens them).
 */
export function isRichTextChanged(before: unknown, after: unknown): boolean {
  try {
    return (
      stableStringify(canonical(before, 0)) !==
      stableStringify(canonical(after, 0))
    );
  } catch {
    return true;
  }
}
