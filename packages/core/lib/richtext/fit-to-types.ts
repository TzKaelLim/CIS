import { stableStringify } from "./stable-stringify";
import type { RichTextDoc, RichTextMark, RichTextNode } from "./types";

/**
 * The node and mark types a richtext value may contain, for example the types
 * of a richtext field's editor.
 */
export type RichTextTypes = {
  /** Allowed node types, for example ["doc", "paragraph", "text", "bulletList", "listItem"] */
  nodes: readonly string[];
  /** Allowed mark types, for example ["bold", "link"] */
  marks: readonly string[];
  /**
   * The text block that takes the text of a paragraph, heading or code block
   * whose type is not allowed; null drops that text, and so does a type that
   * `nodes` lacks. Defaults to "paragraph" when `nodes` contains it, and to
   * null otherwise.
   */
  textblock?: string | null;
  /**
   * false removes the textAlign attribute of paragraphs and headings, and
   * their attrs when nothing else is left, which is what an editor without
   * text alignment does. Defaults to true.
   */
  textAlign?: boolean;
};

/** Which children a parent node accepts. */
type Context = "block" | "list" | "inline";

type Allowed = {
  nodes: ReadonlySet<string>;
  marks: ReadonlySet<string>;
  textblock: string | null;
  textAlign: boolean;
};

const withContent = (
  node: RichTextNode,
  content: RichTextNode[]
): RichTextNode => {
  const result: RichTextNode = { type: node.type };

  if (node.attrs) result.attrs = node.attrs;
  if (content.length > 0) result.content = content;

  return result;
};

/**
 * The attributes of a paragraph or heading, without textAlign when it is not
 * allowed (undefined when no other attribute is left).
 */
const textblockAttrs = (
  attrs: RichTextNode["attrs"],
  allowed: Allowed
): RichTextNode["attrs"] => {
  if (
    !attrs ||
    allowed.textAlign ||
    !Object.prototype.hasOwnProperty.call(attrs, "textAlign")
  ) {
    return attrs;
  }

  const rest = Object.fromEntries(
    Object.entries(attrs).filter(([key]) => key !== "textAlign")
  );

  return Object.keys(rest).length > 0 ? rest : undefined;
};

/** Adds text, merging it into the previous text node when the marks match. */
const pushText = (out: RichTextNode[], text: string, marks: RichTextMark[]) => {
  if (text === "") return;

  const last = out[out.length - 1];

  if (
    last?.type === "text" &&
    stableStringify(last.marks ?? []) === stableStringify(marks)
  ) {
    out[out.length - 1] = { ...last, text: `${last.text ?? ""}${text}` };
  } else {
    out.push(
      marks.length > 0 ? { type: "text", marks, text } : { type: "text", text }
    );
  }
};

/** Inline content as one text node without marks; hard breaks become "\n". */
const plainText = (content: RichTextNode[]): RichTextNode[] => {
  const text = content
    .map((node) => (node.type === "hardBreak" ? "\n" : node.text ?? ""))
    .join("");

  return text === "" ? [] : [{ type: "text", text }];
};

/**
 * The block that takes the content of a paragraph, heading or code block whose
 * type is not allowed, or null when there is none.
 */
const replaceTextblock = (
  node: RichTextNode,
  content: RichTextNode[],
  allowed: Allowed
): RichTextNode | null => {
  const textAlign = node.attrs?.textAlign ?? null;

  switch (allowed.textblock) {
    case null:
      return null;
    case "paragraph":
      return withContent(
        {
          type: "paragraph",
          attrs: textblockAttrs({ textAlign }, allowed),
        },
        content
      );
    case "heading":
      return withContent(
        {
          type: "heading",
          attrs: textblockAttrs({ textAlign, level: 1 }, allowed),
        },
        content
      );
    case "codeBlock":
      // A code block only holds text without marks
      return withContent(
        { type: "codeBlock", attrs: { language: null } },
        plainText(content)
      );
    default:
      return withContent({ type: allowed.textblock }, content);
  }
};

function fitNode(
  node: RichTextNode,
  context: Context,
  allowed: Allowed,
  out: RichTextNode[]
) {
  const supported = allowed.nodes.has(node.type);

  if (context === "inline") {
    const marks = (node.marks ?? []).filter((mark) =>
      allowed.marks.has(mark.type)
    );

    if (node.type === "hardBreak" && supported) {
      out.push(
        marks.length > 0 ? { type: node.type, marks } : { type: node.type }
      );
    } else {
      // Text, or a hard break the types lack
      pushText(out, node.type === "hardBreak" ? "\n" : node.text ?? "", marks);
    }

    return;
  }

  const fitChildren = (childContext: Context) => {
    const children: RichTextNode[] = [];

    for (const child of node.content ?? []) {
      fitNode(child, childContext, allowed, children);
    }

    return children;
  };

  switch (node.type) {
    case "paragraph":
    case "heading":
    case "codeBlock": {
      const content = fitChildren("inline");

      if (supported) {
        out.push(
          withContent(
            { type: node.type, attrs: textblockAttrs(node.attrs, allowed) },
            content
          )
        );
      } else {
        const replacement = replaceTextblock(node, content, allowed);

        if (replacement) out.push(replacement);
      }

      return;
    }
    case "horizontalRule":
      if (supported) out.push(node);

      return;
    case "listItem":
      if (context === "list") {
        out.push(withContent(node, fitChildren("block")));

        return;
      }

      break;
    case "blockquote":
      if (supported) {
        out.push(withContent(node, fitChildren("block")));

        return;
      }

      break;
    case "bulletList":
    case "orderedList":
      if (supported && allowed.nodes.has("listItem")) {
        out.push(withContent(node, fitChildren("list")));

        return;
      }

      break;
  }

  // A container the types lack: keep the blocks inside it
  for (const child of node.content ?? []) {
    fitNode(child, "block", allowed, out);
  }
}

/**
 * Fits a normalized document (see normalizeRichText) to a list of allowed
 * node and mark types, keeping as much of the text as the types can hold:
 *
 * - marks the types lack are removed;
 * - a paragraph, heading or code block the types lack becomes a `textblock`
 *   (a paragraph by default; a heading gets level 1, a code block gets the
 *   text without marks), or is dropped when `textblock` is null;
 * - a blockquote or list is replaced by the blocks inside it;
 * - a hard break becomes a line break in the text, and a horizontal rule is
 *   dropped;
 * - with `textAlign: false`, paragraphs and headings lose their textAlign,
 *   and their attrs when nothing else is left.
 *
 * Has no dependencies on React or Tiptap, so servers can use it to apply the
 * same rules as the editor. The input is not modified, but the result can
 * share objects with it.
 */
export function fitRichTextToTypes(
  doc: RichTextDoc,
  types: RichTextTypes
): RichTextDoc {
  const nodes = new Set(types.nodes);
  const textblock =
    types.textblock !== undefined
      ? types.textblock
      : nodes.has("paragraph")
      ? "paragraph"
      : null;
  const allowed: Allowed = {
    nodes,
    marks: new Set(types.marks),
    // A text block the types lack would let it past the types
    textblock: textblock !== null && nodes.has(textblock) ? textblock : null,
    textAlign: types.textAlign !== false,
  };
  const content: RichTextNode[] = [];

  for (const node of doc.content ?? []) {
    fitNode(node, "block", allowed, content);
  }

  return { type: "doc", content };
}
