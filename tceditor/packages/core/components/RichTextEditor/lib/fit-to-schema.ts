import { defaultBlockAt } from "@tiptap/core";
import type { NodeType, Schema } from "@tiptap/pm/model";
import { fitRichTextToTypes } from "../../../lib/richtext/fit-to-types";
import { markMapping, nodeMapping } from "../../../lib/richtext/render";
import type { RichTextDoc } from "../../../lib/richtext/types";

/**
 * The text block of an editor's schema that takes the text of paragraphs,
 * headings and code blocks the schema lacks: the paragraph, or else the first
 * text block the document accepts. A field can only turn paragraph off
 * together with listItem, and then that is a code block or a heading.
 *
 * Not `topNodeType.contentMatch.defaultType` or `createAndFill()`: without a
 * paragraph the first block type can be a blockquote, which holds no text and
 * which createAndFill fills with blockquotes until the stack overflows.
 */
export const defaultTextblock = (schema: Schema): NodeType | null =>
  schema.nodes.paragraph ?? defaultBlockAt(schema.topNodeType.contentMatch);

/**
 * Whether the schema's paragraphs or headings can be aligned. When only one
 * of them can (`textAlign: { types: ["heading"] }`), alignment is kept: the
 * editor ignores it on the other type, and clearing it would lose it on the
 * type that has it.
 */
const hasTextAlign = (schema: Schema): boolean =>
  ["paragraph", "heading"].some((name) => {
    const attrs = schema.nodes[name]?.spec.attrs;

    return Boolean(
      attrs && Object.prototype.hasOwnProperty.call(attrs, "textAlign")
    );
  });

/**
 * Fits a normalized document (see normalizeRichText) to the schema of a
 * richtext field's editor, with fitRichTextToTypes. A field can turn parts of
 * the PuckRichText schema off, for example `options: { bold: false }`, and
 * Tiptap replaces a document that contains a node or mark type its schema
 * lacks with an empty one, so the next edit would overwrite the stored value.
 * Like Tiptap's HTML parser, this keeps the text instead: see
 * fitRichTextToTypes for the rules. Text blocks the schema lacks become its
 * defaultTextblock.
 */
export function fitToSchema(doc: RichTextDoc, schema: Schema): RichTextDoc {
  return fitRichTextToTypes(doc, {
    nodes: Object.keys(schema.nodes),
    marks: Object.keys(schema.marks),
    textblock: defaultTextblock(schema)?.name ?? null,
    textAlign: hasTextAlign(schema),
  });
}

/**
 * Node and mark types in an editor's schema that the shared renderer does
 * not render, usually added through `field.tiptap.extensions`.
 */
export const findUnrenderableTypes = (schema: Schema): string[] => [
  ...Object.keys(schema.nodes).filter((type) => !(type in nodeMapping)),
  ...Object.keys(schema.marks).filter((type) => !(type in markMapping)),
];
