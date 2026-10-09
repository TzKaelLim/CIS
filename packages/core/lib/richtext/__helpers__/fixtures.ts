import type { RichTextDoc, RichTextNode } from "../types";

const text = (value: string, marks?: RichTextNode["marks"]): RichTextNode =>
  marks ? { type: "text", marks, text: value } : { type: "text", text: value };

const paragraph = (
  content: RichTextNode[],
  textAlign: string | null = null
): RichTextNode =>
  content.length
    ? { type: "paragraph", attrs: { textAlign }, content }
    : { type: "paragraph", attrs: { textAlign } };

const heading = (
  level: number,
  content: RichTextNode[],
  textAlign: string | null = null
): RichTextNode => ({ type: "heading", attrs: { textAlign, level }, content });

const listItem = (...content: RichTextNode[]): RichTextNode => ({
  type: "listItem",
  content,
});

const link = (
  href: string,
  target: string | null = "_blank",
  rel: string | null = "noopener noreferrer nofollow",
  title: string | null = null
) => ({ type: "link", attrs: { href, target, rel, class: null, title } });

export const doc = (...content: RichTextNode[]): RichTextDoc => ({
  type: "doc",
  content,
});

/**
 * Content the PuckRichText editor produces, in the canonical shape of
 * editor.getJSON() (every attribute present, marks in schema order).
 */
export const typicalContent: Record<string, RichTextDoc> = {
  headings: doc(
    heading(1, [text("Heading 1")]),
    heading(2, [text("Heading 2")]),
    heading(3, [text("Heading 3")]),
    heading(4, [text("Heading 4")]),
    heading(5, [text("Heading 5")]),
    heading(6, [text("Heading 6")])
  ),
  alignment: doc(
    paragraph([text("left")], "left"),
    paragraph([text("center")], "center"),
    paragraph([text("right")], "right"),
    paragraph([text("justify")], "justify"),
    heading(2, [text("centered heading")], "center")
  ),
  marks: doc(
    paragraph([
      text("plain "),
      text("bold", [{ type: "bold" }]),
      text(" "),
      text("italic", [{ type: "italic" }]),
      text(" "),
      text("underline", [{ type: "underline" }]),
      text(" "),
      text("strike", [{ type: "strike" }]),
      text(" "),
      text("code", [{ type: "code" }]),
    ])
  ),
  nestedMarks: doc(
    paragraph([
      text("bold ", [{ type: "bold" }]),
      text("bold italic", [{ type: "bold" }, { type: "italic" }]),
      text(" bold", [{ type: "bold" }]),
      text(" "),
      text("all", [
        { type: "bold" },
        { type: "italic" },
        { type: "strike" },
        { type: "underline" },
      ]),
    ])
  ),
  links: doc(
    paragraph([
      text("Visit "),
      text("example", [link("https://example.com")]),
      text(", "),
      text("relative", [link("/about", null, null)]),
      text(", "),
      text("mail", [link("mailto:someone@example.com", "_self", "noopener")]),
      text(" and "),
      text("titled", [link("https://example.com/t", "_blank", null, "Title")]),
    ]),
    paragraph([
      text("link ", [link("https://example.com/a")]),
      text("with bold", [link("https://example.com/a"), { type: "bold" }]),
    ])
  ),
  codeBlocks: doc(
    {
      type: "codeBlock",
      attrs: { language: "js" },
      content: [text('const a = "<b>";\nconsole.log(a);')],
    },
    {
      type: "codeBlock",
      attrs: { language: null },
      content: [text("plain code")],
    }
  ),
  blockquote: doc({
    type: "blockquote",
    content: [paragraph([text("Quoted")]), paragraph([text("Second line")])],
  }),
  orderedLists: doc(
    {
      type: "orderedList",
      attrs: { start: 1, type: null },
      content: [listItem(paragraph([text("one")]))],
    },
    {
      type: "orderedList",
      attrs: { start: 3, type: "a" },
      content: [
        listItem(paragraph([text("three")])),
        listItem(paragraph([text("four")])),
      ],
    }
  ),
  nestedLists: doc({
    type: "bulletList",
    content: [
      listItem(paragraph([text("parent")]), {
        type: "orderedList",
        attrs: { start: 1, type: null },
        content: [
          listItem(paragraph([text("child")]), {
            type: "bulletList",
            content: [listItem(paragraph([text("grandchild")]))],
          }),
        ],
      }),
      listItem(paragraph([text("sibling")])),
    ],
  }),
  hardBreaks: doc(
    paragraph([text("line 1"), { type: "hardBreak" }, text("line 2")]),
    paragraph([
      text("bold", [{ type: "bold" }]),
      { type: "hardBreak", marks: [{ type: "bold" }] },
      text("still bold", [{ type: "bold" }]),
    ])
  ),
  horizontalRule: doc(
    paragraph([text("above")]),
    { type: "horizontalRule" },
    paragraph([text("below")])
  ),
  emptyParagraphs: doc(
    paragraph([]),
    paragraph([text("between")]),
    paragraph([])
  ),
  specialCharacters: doc(
    paragraph([text('<script>alert("x")</script> & "double" \'single\'')])
  ),
};

export const allTypicalContent: RichTextDoc = doc(
  ...Object.values(typicalContent).flatMap((value) => value.content ?? [])
);

/** A chain of `depth` nested blockquotes around a paragraph, built without recursion. */
export const deepBlockquotes = (depth: number, value = "deep"): RichTextDoc => {
  let node: RichTextNode = paragraph([text(value)]);

  for (let i = 0; i < depth; i++) {
    node = { type: "blockquote", content: [node] };
  }

  return doc(node);
};
