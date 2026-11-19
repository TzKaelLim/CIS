import type { RichTextDoc } from "./types";

/**
 * Wraps plain text in a document with a single paragraph. The text is never
 * parsed, so HTML tags stay literal text. An empty string gives an empty
 * document.
 */
export function textToRichText(text: string): RichTextDoc {
  if (text === "") return { type: "doc", content: [] };

  return {
    type: "doc",
    content: [
      {
        type: "paragraph",
        attrs: { textAlign: null },
        content: [{ type: "text", text }],
      },
    ],
  };
}
