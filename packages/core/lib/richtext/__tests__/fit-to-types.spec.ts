import fs from "fs";
import path from "path";
import { fitRichTextToTypes, RichTextTypes } from "../fit-to-types";
import {
  allTypicalContent,
  doc,
  typicalContent,
} from "../__helpers__/fixtures";
import type { RichTextMark, RichTextNode } from "../types";

/** The types of a richtext field with the default options */
const ALL_TYPES: RichTextTypes = {
  nodes: [
    "blockquote",
    "bulletList",
    "codeBlock",
    "doc",
    "hardBreak",
    "heading",
    "horizontalRule",
    "listItem",
    "orderedList",
    "paragraph",
    "text",
  ],
  marks: ["bold", "code", "italic", "link", "strike", "underline"],
};

const without = (...names: string[]): RichTextTypes => ({
  nodes: ALL_TYPES.nodes.filter((name) => !names.includes(name)),
  marks: ALL_TYPES.marks.filter((name) => !names.includes(name)),
});

const p = (...content: RichTextNode[]): RichTextNode =>
  content.length
    ? { type: "paragraph", attrs: { textAlign: null }, content }
    : { type: "paragraph", attrs: { textAlign: null } };

const t = (text: string, marks?: RichTextMark[]): RichTextNode =>
  marks ? { type: "text", marks, text } : { type: "text", text };

const bold: RichTextMark = { type: "bold" };

const hardBreak: RichTextNode = { type: "hardBreak" };

const heading = (
  level: number,
  text: string,
  textAlign: string | null = null
): RichTextNode => ({
  type: "heading",
  attrs: { textAlign, level },
  content: [t(text)],
});

describe("fitRichTextToTypes", () => {
  it("returns content the types allow unchanged", () => {
    expect(fitRichTextToTypes(allTypicalContent, ALL_TYPES)).toEqual(
      allTypicalContent
    );
  });

  it("does not modify the document it is given", () => {
    const input = JSON.parse(JSON.stringify(allTypicalContent));

    fitRichTextToTypes(input, {
      ...without("paragraph", "heading", "bulletList", "bold", "link"),
      textblock: "codeBlock",
      textAlign: false,
    });

    expect(input).toEqual(allTypicalContent);
  });

  it("turns text blocks the types lack into paragraphs by default", () => {
    expect(
      fitRichTextToTypes(doc(heading(2, "Title", "center")), without("heading"))
    ).toEqual(
      doc({
        type: "paragraph",
        attrs: { textAlign: "center" },
        content: [t("Title")],
      })
    );
  });

  it("drops text blocks by default when the types have no paragraph", () => {
    expect(
      fitRichTextToTypes(
        doc(p(t("a")), heading(2, "Title"), { type: "horizontalRule" }),
        { nodes: ["doc", "horizontalRule", "text"], marks: [] }
      )
    ).toEqual(doc({ type: "horizontalRule" }));
  });

  it("turns text blocks into level 1 headings when textblock is heading", () => {
    expect(
      fitRichTextToTypes(
        doc(
          {
            type: "paragraph",
            attrs: { textAlign: "center" },
            content: [t("a", [bold]), hardBreak, t("b")],
          },
          {
            type: "codeBlock",
            attrs: { language: "js" },
            content: [t("x\ny")],
          }
        ),
        {
          nodes: ["doc", "hardBreak", "heading", "text"],
          marks: ["bold"],
          textblock: "heading",
        }
      )
    ).toEqual(
      doc(
        {
          type: "heading",
          attrs: { textAlign: "center", level: 1 },
          content: [t("a", [bold]), hardBreak, t("b")],
        },
        {
          type: "heading",
          attrs: { textAlign: null, level: 1 },
          content: [t("x\ny")],
        }
      )
    );
  });

  it("turns text blocks into code blocks of plain text when textblock is codeBlock", () => {
    expect(
      fitRichTextToTypes(doc(p(t("a", [bold]), hardBreak, t("b")), p()), {
        nodes: ["codeBlock", "doc", "hardBreak", "text"],
        marks: ["bold"],
        textblock: "codeBlock",
      })
    ).toEqual(
      doc(
        {
          type: "codeBlock",
          attrs: { language: null },
          content: [t("a\nb")],
        },
        { type: "codeBlock", attrs: { language: null } }
      )
    );
  });

  it("drops the text of text blocks when textblock is null", () => {
    expect(
      fitRichTextToTypes(doc(p(t("a")), heading(2, "Title")), {
        ...without("paragraph"),
        textblock: null,
      })
    ).toEqual(doc(heading(2, "Title")));
  });

  it("ignores a textblock the types lack", () => {
    expect(
      fitRichTextToTypes(doc(p(t("a"))), {
        nodes: ["doc", "text"],
        marks: [],
        textblock: "heading",
      })
    ).toEqual(doc());
  });

  it("removes textAlign from paragraphs and headings when textAlign is false", () => {
    expect(
      fitRichTextToTypes(typicalContent.alignment, {
        ...ALL_TYPES,
        textAlign: false,
      })
    ).toEqual(
      doc(
        { type: "paragraph", content: [t("left")] },
        { type: "paragraph", content: [t("center")] },
        { type: "paragraph", content: [t("right")] },
        { type: "paragraph", content: [t("justify")] },
        {
          type: "heading",
          attrs: { level: 2 },
          content: [t("centered heading")],
        }
      )
    );
    expect(
      fitRichTextToTypes(doc(heading(2, "Title", "center"), p()), {
        ...without("heading"),
        textAlign: false,
      })
    ).toEqual(
      doc({ type: "paragraph", content: [t("Title")] }, { type: "paragraph" })
    );
  });

  describe("containers that must have content", () => {
    const hr: RichTextNode = { type: "horizontalRule" };
    const blockquote = (...content: RichTextNode[]): RichTextNode =>
      content.length ? { type: "blockquote", content } : { type: "blockquote" };
    const item = (...content: RichTextNode[]): RichTextNode =>
      content.length ? { type: "listItem", content } : { type: "listItem" };
    const bulletList = (...content: RichTextNode[]): RichTextNode =>
      content.length ? { type: "bulletList", content } : { type: "bulletList" };

    it("drops a blockquote that has nothing left in it", () => {
      expect(
        fitRichTextToTypes(
          doc(p(t("a")), blockquote(hr), blockquote(blockquote(hr), hr)),
          without("horizontalRule")
        )
      ).toEqual(doc(p(t("a"))));
    });

    it("drops empty blockquotes, lists and list items", () => {
      expect(
        fitRichTextToTypes(
          doc(
            blockquote(),
            bulletList(),
            { type: "orderedList", attrs: { start: 1, type: null } },
            bulletList(item(), item()),
            p(t("a"))
          ),
          ALL_TYPES
        )
      ).toEqual(doc(p(t("a"))));
    });

    it("drops list items, and then lists, that have nothing left in them", () => {
      expect(
        fitRichTextToTypes(
          doc(bulletList(item(hr)), bulletList(item(hr), item(p(t("a"))))),
          without("horizontalRule")
        )
      ).toEqual(doc(bulletList(item(p(t("a"))))));
    });

    it("starts a list item with an empty paragraph when its first block is not one", () => {
      expect(
        fitRichTextToTypes(
          doc(bulletList(item(heading(2, "Title"), p(t("a"))), item(hr))),
          ALL_TYPES
        )
      ).toEqual(
        doc(
          bulletList(item(p(), heading(2, "Title"), p(t("a"))), item(p(), hr))
        )
      );
      expect(
        fitRichTextToTypes(doc(bulletList(item(bulletList(item(p(t("a"))))))), {
          ...ALL_TYPES,
          textAlign: false,
        })
      ).toEqual(
        doc(
          bulletList(
            item(
              { type: "paragraph" },
              bulletList(item({ type: "paragraph", content: [t("a")] }))
            )
          )
        )
      );
    });

    it("keeps the blocks of lists when the types have no paragraph", () => {
      expect(
        fitRichTextToTypes(doc(bulletList(item(p(t("a"))), item(p(t("b"))))), {
          nodes: ["bulletList", "doc", "heading", "listItem", "text"],
          marks: [],
          textblock: "heading",
        })
      ).toEqual(
        doc(
          {
            type: "heading",
            attrs: { textAlign: null, level: 1 },
            content: [t("a")],
          },
          {
            type: "heading",
            attrs: { textAlign: null, level: 1 },
            content: [t("b")],
          }
        )
      );
    });
  });

  it("imports nothing but other React-free richtext modules", () => {
    const source = fs.readFileSync(
      path.join(__dirname, "../fit-to-types.ts"),
      "utf8"
    );

    expect(
      Array.from(source.matchAll(/from "([^"]+)"/g), (match) => match[1])
    ).toEqual(["./stable-stringify", "./types"]);
  });
});
