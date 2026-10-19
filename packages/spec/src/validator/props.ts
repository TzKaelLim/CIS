import { classify, errorMapFor, fieldAt } from "./describe";
import { formatPathText, type IssueList } from "./issues";
import { MESSAGES } from "./messages";
import type { Entry } from "./registry";
import { isRichTextChanged } from "./richtext";
import {
  copyRecord,
  eachValueAt,
  isRecord,
  replaceAt,
  valueAt,
  type Segment,
  type UnknownRecord,
} from "./values";

const emptySlot = (found: unknown) => (Array.isArray(found) ? [] : found);

/**
 * Returns `value` with every list field cut to one item more than its
 * maximum; `value` is not changed. zod still reports the list as too long,
 * but neither zod nor the walk goes through the items past that one, so a
 * 2 MB list of a million items costs no more than a short one. checkSpecRules
 * ("object-arrays") requires a maximum on every list field.
 */
export function capLists(entry: Entry, value: unknown): unknown {
  let capped = value;

  for (const list of entry.lists) {
    const keep = list.maxItems + 1;

    capped = replaceAt(capped, list.path, (found) =>
      Array.isArray(found) && found.length > keep ? found.slice(0, keep) : found
    );
  }

  return capped;
}

/**
 * Checks props with the spec's zod schema (spec §6.2 #8, #9, #12) and returns
 * the parsed props with defaults filled, or undefined when there are errors.
 *
 * - `props.id` is taken out first (block schemas do not declare it).
 * - Lists longer than their maximum are cut first (capLists).
 * - Slot arrays are emptied first: the blocks inside them are checked one by
 *   one by the walk, so zod only checks that each slot is an array.
 * - zod gets a null-prototype copy, so an own "__proto__" key is reported as
 *   an unknown prop like any other key.
 */
export function checkProps(
  entry: Entry,
  props: UnknownRecord,
  base: Segment[],
  errors: IssueList,
  omitId: boolean
): UnknownRecord | undefined {
  let input = capLists(entry, copyRecord(props, omitId ? "id" : undefined));

  for (const slot of entry.slots) {
    input = replaceAt(input, slot.path, emptySlot);
  }

  const result = entry.props.safeParse(input, { error: errorMapFor(entry) });

  if (result.success) {
    return isRecord(result.data) ? result.data : undefined;
  }

  const reported = new Set<string>();

  // Reading `issues` runs the error map, while `entry` is still in scope.
  for (const issue of result.error.issues) {
    if (errors.full) break;

    const at = fieldAt(entry.schema, issue.path);

    if (issue.code === "unrecognized_keys") {
      for (const key of issue.keys) {
        if (errors.full) break;

        errors.add(
          "unknown_prop",
          [...base, ...at.path, key],
          MESSAGES.unknown_prop({ label: entry.label, field: at.field, key }),
          entry.blockType
        );
      }
      continue;
    }

    const path = [...base, ...at.path];
    const pathText = formatPathText(path);

    // One issue per field: zod also runs the safe-link check on an empty
    // required link, but "不能空白" is the message that helps.
    if (reported.has(pathText)) continue;
    reported.add(pathText);

    errors.add(classify(issue, at).code, path, issue.message, entry.blockType);
  }

  return undefined;
}

/** Adds a richtext_cleaned notice for every rich text field that cleaning changed (spec §6.2 #11). */
export function richTextNotices(
  entry: Entry,
  props: UnknownRecord,
  parsed: UnknownRecord,
  base: Segment[],
  notices: IssueList
): void {
  for (const fieldPath of entry.richText) {
    eachValueAt(props, fieldPath, (before, path) => {
      // Missing values got the default; other non-objects failed in zod
      if (!isRecord(before)) return;

      if (isRichTextChanged(before, valueAt(parsed, path))) {
        notices.add(
          "richtext_cleaned",
          [...base, ...path],
          MESSAGES.richtext_cleaned({
            label: entry.label,
            field: fieldAt(entry.schema, path).field,
          }),
          entry.blockType
        );
      }
    });
  }
}
