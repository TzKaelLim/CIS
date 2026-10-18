import { isSafeHref } from "./is-safe-href";
import { textToRichText } from "./text-to-richtext";
import type { RichTextDoc, RichTextMark, RichTextNode } from "./types";

/** Nodes nested deeper than this are reduced to their text. */
export const RICHTEXT_MAX_DEPTH = 100;

type UnknownRecord = Record<string, unknown>;

/** Which children a parent node accepts. */
type Context = "block" | "list" | "inline" | "code";

const BLOCK_TYPES = new Set([
  "paragraph",
  "heading",
  "blockquote",
  "bulletList",
  "orderedList",
  "codeBlock",
  "horizontalRule",
]);

// ProseMirror keeps the marks of a node sorted by schema rank. This is the
// rank order of the PuckRichText schema (link has priority 1000).
const MARK_ORDER = ["link", "bold", "code", "italic", "strike", "underline"];

const TEXT_ALIGNS = new Set(["left", "center", "right", "justify"]);
const ORDERED_LIST_TYPES = new Set(["1", "a", "A", "i", "I"]);
const LINK_TARGETS = new Set(["_blank", "_self", "_parent", "_top"]);
const LINK_REL = /^[a-z]+( [a-z]+)*$/i;
const CODE_LANGUAGE = /^[A-Za-z0-9_+#.-]{1,64}$/;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const attrsOf = (value: UnknownRecord): UnknownRecord =>
  isRecord(value.attrs) ? value.attrs : {};

export const isTextAlign = (value: unknown): value is string =>
  typeof value === "string" && TEXT_ALIGNS.has(value);

// rel="opener" gives a page that the link opens in a new tab access to this
// page through window.opener (reverse tabnabbing), so that link type is
// dropped. Every other link type only describes the link.
const linkRel = (rel: unknown): string | null => {
  if (typeof rel !== "string" || !LINK_REL.test(rel)) return null;

  const types = rel
    .split(" ")
    .filter((type) => type.toLowerCase() !== "opener");

  return types.length > 0 ? types.join(" ") : null;
};

// Nodes whose text starts and ends a line when extractText joins texts
const LINE_TYPES = new Set([...BLOCK_TYPES, "listItem"]);

// Pushed onto the stack of extractText after the children of a LINE_TYPES
// node. Data can never contain this object.
const LINE_END = {};

/**
 * Collects the text of a subtree. Uses an explicit stack instead of recursion
 * so that it works for any depth. The texts of different blocks (paragraphs,
 * headings, list items and so on) are joined with a line break, so "a" and
 * "b" in two paragraphs become "a\nb" and not "ab". There is no line break
 * before the first text or after the last one.
 */
export function extractText(value: unknown): string {
  const parts: string[] = [];
  const stack: unknown[] = [value];
  const seen = new Set<unknown>();
  // A block started or ended since the last text
  let newLine = false;

  const add = (text: string) => {
    if (text === "") return;
    if (newLine && parts.length > 0) parts.push("\n");

    newLine = false;
    parts.push(text);
  };

  while (stack.length > 0) {
    const node = stack.pop();

    if (node === LINE_END) {
      newLine = true;
      continue;
    }

    if (!isRecord(node) || seen.has(node)) continue;

    seen.add(node);

    if (node.type === "text") {
      if (typeof node.text === "string") add(node.text);
    } else if (node.type === "hardBreak") {
      add("\n");
    } else if (Array.isArray(node.content)) {
      if (typeof node.type === "string" && LINE_TYPES.has(node.type)) {
        newLine = true;
        stack.push(LINE_END);
      }

      for (let i = node.content.length - 1; i >= 0; i--) {
        stack.push(node.content[i]);
      }
    }
  }

  return parts.join("");
}

const paragraph = (content: RichTextNode[]): RichTextNode => ({
  type: "paragraph",
  attrs: { textAlign: null },
  content,
});

/** Wraps text so that it fits where the original node was. */
const textFallback = (text: string, context: Context): RichTextNode | null => {
  if (text === "") return null;

  const node: RichTextNode = { type: "text", text };

  if (context === "block") return paragraph([node]);
  if (context === "list")
    return { type: "listItem", content: [paragraph([node])] };

  return node;
};

const fits = (type: string, context: Context) => {
  if (context === "block") return BLOCK_TYPES.has(type);
  if (context === "list") return type === "listItem";
  if (context === "inline") return type === "text" || type === "hardBreak";

  return type === "text";
};

const withContent = (node: RichTextNode, content: RichTextNode[]) =>
  content.length > 0 ? { ...node, content } : node;

const normalizeMark = (
  type: string,
  attrs: UnknownRecord
): RichTextMark | null => {
  switch (type) {
    case "bold":
    case "code":
    case "italic":
    case "strike":
    case "underline":
      return { type };
    case "link": {
      if (!isSafeHref(attrs.href)) return null;

      const { target, rel, title } = attrs;

      return {
        type,
        attrs: {
          href: attrs.href,
          target:
            target === undefined
              ? "_blank"
              : typeof target === "string" && LINK_TARGETS.has(target)
              ? target
              : null,
          rel:
            rel === undefined ? "noopener noreferrer nofollow" : linkRel(rel),
          // Classes are dropped: they could pull in the host page's styles
          class: null,
          title: typeof title === "string" ? title : null,
        },
      };
    }
    default:
      return null;
  }
};

const normalizeMarks = (value: unknown): RichTextMark[] => {
  if (!Array.isArray(value)) return [];

  const byType = new Map<string, RichTextMark>();

  for (const mark of value) {
    if (!isRecord(mark) || typeof mark.type !== "string") continue;
    if (byType.has(mark.type)) continue;

    const normalized = normalizeMark(mark.type, attrsOf(mark));

    if (normalized) byType.set(mark.type, normalized);
  }

  const marks: RichTextMark[] = [];

  for (const type of MARK_ORDER) {
    const mark = byType.get(type);

    if (mark) marks.push(mark);
  }

  return marks;
};

type Walk = {
  maxDepth: number;
  ancestors: Set<unknown>;
};

// normalizeNode recurses once per level, so the limit is what keeps it from
// overflowing the stack. A caller can only lower it: anything that is not a
// non-negative integer falls back to the default, and larger values are capped.
const toMaxDepth = (value: unknown): number =>
  typeof value === "number" && Number.isInteger(value) && value >= 0
    ? Math.min(value, RICHTEXT_MAX_DEPTH)
    : RICHTEXT_MAX_DEPTH;

function normalizeChildren(
  value: unknown,
  context: Context,
  depth: number,
  walk: Walk
): RichTextNode[] {
  if (!Array.isArray(value)) return [];

  const children: RichTextNode[] = [];

  for (const child of value) {
    const node = normalizeNode(child, context, depth, walk);

    if (node) children.push(node);
  }

  return children;
}

function normalizeNode(
  value: unknown,
  context: Context,
  depth: number,
  walk: Walk
): RichTextNode | null {
  if (!isRecord(value) || walk.ancestors.has(value)) return null;

  const type = typeof value.type === "string" ? value.type : "";

  if (depth > walk.maxDepth || !fits(type, context)) {
    return textFallback(extractText(value), context);
  }

  walk.ancestors.add(value);

  try {
    return normalizeKnownNode(type, value, context, depth, walk);
  } finally {
    walk.ancestors.delete(value);
  }
}

function normalizeKnownNode(
  type: string,
  value: UnknownRecord,
  context: Context,
  depth: number,
  walk: Walk
): RichTextNode | null {
  const attrs = attrsOf(value);
  const children = (childContext: Context) =>
    normalizeChildren(value.content, childContext, depth + 1, walk);

  switch (type) {
    case "text": {
      if (typeof value.text !== "string" || value.text === "") return null;

      const marks = context === "code" ? [] : normalizeMarks(value.marks);

      return marks.length > 0
        ? { type, marks, text: value.text }
        : { type, text: value.text };
    }
    case "hardBreak": {
      const marks = normalizeMarks(value.marks);

      return marks.length > 0 ? { type, marks } : { type };
    }
    case "horizontalRule":
      return { type };
    case "paragraph":
      return withContent(
        {
          type,
          attrs: {
            textAlign: isTextAlign(attrs.textAlign) ? attrs.textAlign : null,
          },
        },
        children("inline")
      );
    case "heading": {
      const { level } = attrs;

      return withContent(
        {
          type,
          attrs: {
            textAlign: isTextAlign(attrs.textAlign) ? attrs.textAlign : null,
            level:
              typeof level === "number" &&
              Number.isInteger(level) &&
              level >= 1 &&
              level <= 6
                ? level
                : 1,
          },
        },
        children("inline")
      );
    }
    case "blockquote":
    case "listItem":
      return withContent({ type }, children("block"));
    case "bulletList":
      return withContent({ type }, children("list"));
    case "orderedList": {
      const { start, type: listType } = attrs;

      return withContent(
        {
          type,
          attrs: {
            start:
              typeof start === "number" && Number.isSafeInteger(start)
                ? start
                : 1,
            type:
              typeof listType === "string" && ORDERED_LIST_TYPES.has(listType)
                ? listType
                : null,
          },
        },
        children("list")
      );
    }
    case "codeBlock": {
      const { language } = attrs;

      return withContent(
        {
          type,
          attrs: {
            language:
              typeof language === "string" && CODE_LANGUAGE.test(language)
                ? language
                : null,
          },
        },
        children("code")
      );
    }
    default:
      return null;
  }
}

/**
 * Turns any value into a rich text document that contains only the nodes,
 * marks and attributes of the PuckRichText schema:
 *
 * - A string becomes a plain text paragraph. HTML is never parsed.
 * - Unknown or misplaced nodes and marks are reduced to their text.
 * - Attributes are checked one by one; invalid values fall back to defaults,
 *   and links with an unsafe href are removed.
 * - Nodes nested deeper than `maxDepth` are reduced to their text.
 *   `maxDepth` defaults to RICHTEXT_MAX_DEPTH and can only be lowered: a
 *   value that is not a non-negative integer is ignored, and a larger one is
 *   capped at RICHTEXT_MAX_DEPTH. `options` may be null or undefined.
 * - Text taken from several blocks keeps a line break between the blocks.
 *
 * Valid output of an editor with the default options (editor.getJSON()) is
 * returned unchanged; paragraphs and headings without attrs (an editor without
 * text alignment) get textAlign null.
 */
export function normalizeRichText(
  value: unknown,
  options?: { maxDepth?: number } | null
): RichTextDoc {
  if (typeof value === "string") return textToRichText(value);

  if (!isRecord(value)) return { type: "doc", content: [] };

  const isDoc = value.type === "doc";
  const walk: Walk = {
    maxDepth: toMaxDepth(options?.maxDepth),
    ancestors: new Set(isDoc ? [value] : []),
  };
  const content = isDoc ? value.content : [value];

  return {
    type: "doc",
    content: normalizeChildren(content, "block", 1, walk),
  };
}
