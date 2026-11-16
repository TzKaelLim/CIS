/**
 * Rich text is stored as Tiptap (ProseMirror) JSON. These types describe the
 * shape only; use normalizeRichText to turn untrusted input into a document
 * that contains nothing but the supported nodes, marks and attributes.
 */
export type RichTextMark = {
  type: string;
  attrs?: Record<string, unknown>;
};

export type RichTextNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: RichTextNode[];
  marks?: RichTextMark[];
  text?: string;
};

export type RichTextDoc = RichTextNode & { type: "doc" };
