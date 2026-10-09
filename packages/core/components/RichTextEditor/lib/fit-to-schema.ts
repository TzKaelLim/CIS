import type { Schema } from "@tiptap/pm/model";
import { markMapping, nodeMapping } from "../../../lib/richtext/render";
import type {
  RichTextDoc,
  RichTextMark,
  RichTextNode,
} from "../../../lib/richtext/types";
import { stableStringify } from "./stable-stringify";

/** Which children a parent node accepts. */
type Context = "block" | "list" | "inline";

const withContent = (
  node: RichTextNode,
  content: RichTextNode[]
): RichTextNode => {
  const result: RichTextNode = { type: node.type };

  if (node.attrs) result.attrs = node.attrs;
  if (content.length > 0) result.content = content;

  return result;
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

function fitNode(
  node: RichTextNode,
  context: Context,
  schema: Schema,
  out: RichTextNode[]
) {
  const supported = Boolean(schema.nodes[node.type]);

  if (context === "inline") {
    const marks = (node.marks ?? []).filter((mark) =>
      Boolean(schema.marks[mark.type])
    );

    if (node.type === "hardBreak" && supported) {
      out.push(
        marks.length > 0 ? { type: node.type, marks } : { type: node.type }
      );
    } else {
      // Text, or a hard break the editor lacks
      pushText(out, node.type === "hardBreak" ? "\n" : node.text ?? "", marks);
    }

    return;
  }

  const fitChildren = (childContext: Context) => {
    const children: RichTextNode[] = [];

    for (const child of node.content ?? []) {
      fitNode(child, childContext, schema, children);
    }

    return children;
  };

  switch (node.type) {
    case "paragraph":
    case "heading":
    case "codeBlock": {
      const content = fitChildren("inline");

      if (supported) {
        out.push(withContent(node, content));
      } else if (schema.nodes.paragraph) {
        // A text block the editor lacks becomes a paragraph
        out.push(
          withContent(
            {
              type: "paragraph",
              attrs: { textAlign: node.attrs?.textAlign ?? null },
            },
            content
          )
        );
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
      if (supported && schema.nodes.listItem) {
        out.push(withContent(node, fitChildren("list")));

        return;
      }

      break;
  }

  // A container the editor lacks: keep the blocks inside it
  for (const child of node.content ?? []) {
    fitNode(child, "block", schema, out);
  }
}

/**
 * Fits a normalized document (see normalizeRichText) to the schema of a
 * richtext field's editor. A field can turn parts of the PuckRichText schema
 * off, for example `options: { bold: false }`, and Tiptap replaces a document
 * that contains a node or mark type its schema lacks with an empty one, so the
 * next edit would overwrite the stored value. Like Tiptap's HTML parser, this
 * keeps the text instead:
 *
 * - marks the schema lacks are removed;
 * - a heading or code block becomes a paragraph;
 * - a blockquote or list is replaced by the blocks inside it;
 * - a hard break becomes a line break in the text, and a horizontal rule is
 *   dropped.
 */
export function fitToSchema(doc: RichTextDoc, schema: Schema): RichTextDoc {
  const content: RichTextNode[] = [];

  for (const node of doc.content ?? []) {
    fitNode(node, "block", schema, content);
  }

  return { type: "doc", content };
}

/**
 * Node and mark types in an editor's schema that the shared renderer does
 * not render, usually added through `field.tiptap.extensions`.
 */
export const findUnrenderableTypes = (schema: Schema): string[] => [
  ...Object.keys(schema.nodes).filter((type) => !(type in nodeMapping)),
  ...Object.keys(schema.marks).filter((type) => !(type in markMapping)),
];
