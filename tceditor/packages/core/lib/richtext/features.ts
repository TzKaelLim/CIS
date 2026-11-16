import type { RichTextTypes } from "./fit-to-types";

/**
 * The richtext features a block spec can turn on with
 * `richText({ features })`. Paragraphs, text and the document itself are
 * always on, so stored text never loses the block that holds it.
 */
export const RICHTEXT_FEATURES = [
  "bold",
  "italic",
  "underline",
  "strike",
  "code",
  "link",
  "bulletList",
  "orderedList",
  "blockquote",
  "heading",
  "horizontalRule",
  "hardBreak",
] as const;

export type RichTextFeature = (typeof RICHTEXT_FEATURES)[number];

/**
 * The richtext field `options` for a list of features. Every value is false,
 * so the type is assignable to the field's `options` without importing the
 * editor (see features.type-check.ts).
 */
export type RichTextFeatureOptions = Partial<
  Record<RichTextFeature | "codeBlock" | "listItem" | "textAlign", false>
>;

const FEATURES: ReadonlySet<string> = new Set(RICHTEXT_FEATURES);

// Features that are marks; the others are nodes
const MARK_FEATURES: ReadonlySet<RichTextFeature> = new Set([
  "bold",
  "italic",
  "underline",
  "strike",
  "code",
  "link",
]);

export function isRichTextFeature(value: unknown): value is RichTextFeature {
  return typeof value === "string" && FEATURES.has(value);
}

/** The features as a set; throws a TypeError for anything that is not a feature. */
const toFeatureSet = (
  features: readonly RichTextFeature[]
): ReadonlySet<RichTextFeature> => {
  if (!Array.isArray(features)) {
    throw new TypeError("Richtext features must be an array");
  }

  for (const feature of features) {
    if (!isRichTextFeature(feature)) {
      throw new TypeError(
        `Unknown richtext feature "${String(
          feature
        )}". Features are ${RICHTEXT_FEATURES.join(", ")}.`
      );
    }
  }

  return new Set(features);
};

/**
 * The `options` of a richtext field that offers exactly these features:
 * every other feature is false, and so are codeBlock and textAlign, which are
 * not features, and listItem when there is no list feature (Tiptap keeps
 * listItem otherwise). Throws a TypeError for an unknown feature.
 */
export function richTextFeaturesToOptions(
  features: readonly RichTextFeature[]
): RichTextFeatureOptions {
  const enabled = toFeatureSet(features);
  const options: RichTextFeatureOptions = {
    codeBlock: false,
    textAlign: false,
  };

  for (const feature of RICHTEXT_FEATURES) {
    if (!enabled.has(feature)) options[feature] = false;
  }

  if (!enabled.has("bulletList") && !enabled.has("orderedList")) {
    options.listItem = false;
  }

  return options;
}

/**
 * The node and mark types of a richtext field with these features, for
 * fitRichTextToTypes. They are the types of the Tiptap schema built from
 * richTextFeaturesToOptions(features), sorted by name. Text blocks the
 * features lack become paragraphs, and textAlign is removed, as in the
 * field's editor. Throws a TypeError for an unknown feature.
 */
export function richTextFeaturesToTypes(
  features: readonly RichTextFeature[]
): Required<RichTextTypes> {
  const enabled = toFeatureSet(features);
  const nodes = ["doc", "paragraph", "text"];
  const marks: string[] = [];

  for (const feature of RICHTEXT_FEATURES) {
    if (enabled.has(feature)) {
      (MARK_FEATURES.has(feature) ? marks : nodes).push(feature);
    }
  }

  if (enabled.has("bulletList") || enabled.has("orderedList")) {
    nodes.push("listItem");
  }

  return {
    nodes: nodes.sort(),
    marks: marks.sort(),
    textblock: "paragraph",
    textAlign: false,
  };
}
