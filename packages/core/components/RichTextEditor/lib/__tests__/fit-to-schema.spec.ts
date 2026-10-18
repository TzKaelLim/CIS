import { getSchema, Mark, Node } from "@tiptap/core";
import { Document } from "@tiptap/extension-document";
import { Heading } from "@tiptap/extension-heading";
import { Paragraph } from "@tiptap/extension-paragraph";
import { Text } from "@tiptap/extension-text";
import type { Schema } from "@tiptap/pm/model";
import { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { PuckRichText, PuckRichTextOptions } from "../../extension";
import {
  defaultTextblock,
  findUnrenderableTypes,
  fitToSchema as fitToSchemaUnchecked,
} from "../fit-to-schema";
import {
  allTypicalContent,
  doc,
  typicalContent,
} from "../../../../lib/richtext/__helpers__/fixtures";
import type {
  RichTextDoc,
  RichTextMark,
  RichTextNode,
} from "../../../../lib/richtext/types";

/** Also checks that the editor would load the result exactly as it is. */
const fitToSchema = (value: RichTextDoc, schema: Schema) => {
  const result = fitToSchemaUnchecked(value, schema);

  expect(ProseMirrorNode.fromJSON(schema, result).toJSON()).toEqual(result);

  return result;
};

const schemaWith = (options: Partial<PuckRichTextOptions>) =>
  getSchema([PuckRichText.configure(options)]);

const p = (...content: RichTextNode[]): RichTextNode => ({
  type: "paragraph",
  attrs: { textAlign: null },
  content,
});

const t = (text: string, marks?: RichTextMark[]): RichTextNode =>
  marks ? { type: "text", marks, text } : { type: "text", text };

describe("fitToSchema", () => {
  it("returns content the schema supports unchanged", () => {
    expect(fitToSchema(allTypicalContent, getSchema([PuckRichText]))).toEqual(
      allTypicalContent
    );
  });

  it("removes marks the schema lacks and merges the text", () => {
    expect(
      fitToSchema(
        typicalContent.marks,
        schemaWith({ bold: false, code: false })
      )
    ).toEqual(
      doc(
        p(
          t("plain bold "),
          t("italic", [{ type: "italic" }]),
          t(" "),
          t("underline", [{ type: "underline" }]),
          t(" "),
          t("strike", [{ type: "strike" }]),
          t(" code")
        )
      )
    );
  });

  it("removes links when the schema has no link mark", () => {
    expect(
      fitToSchema(typicalContent.links, schemaWith({ link: false }))
    ).toEqual(
      doc(
        p(t("Visit example, relative, mail and titled")),
        p(t("link "), t("with bold", [{ type: "bold" }]))
      )
    );
  });

  it("turns headings and code blocks into paragraphs", () => {
    expect(
      fitToSchema(
        doc(
          {
            type: "heading",
            attrs: { textAlign: "center", level: 2 },
            content: [t("Title", [{ type: "italic" }])],
          },
          {
            type: "codeBlock",
            attrs: { language: "js" },
            content: [t("a"), t("\n"), t("b")],
          }
        ),
        schemaWith({ heading: false, codeBlock: false })
      )
    ).toEqual(
      doc(
        {
          type: "paragraph",
          attrs: { textAlign: "center" },
          content: [t("Title", [{ type: "italic" }])],
        },
        p(t("a\nb"))
      )
    );
  });

  it("keeps the blocks inside blockquotes and lists the schema lacks", () => {
    const schema = schemaWith({ blockquote: false, bulletList: false });

    expect(fitToSchema(typicalContent.blockquote, schema)).toEqual(
      doc(p(t("Quoted")), p(t("Second line")))
    );
    expect(fitToSchema(typicalContent.nestedLists, schema)).toEqual(
      doc(
        p(t("parent")),
        {
          type: "orderedList",
          attrs: { start: 1, type: null },
          content: [
            { type: "listItem", content: [p(t("child")), p(t("grandchild"))] },
          ],
        },
        p(t("sibling"))
      )
    );
  });

  it("turns hard breaks into line breaks and drops horizontal rules", () => {
    const schema = schemaWith({ hardBreak: false, horizontalRule: false });

    expect(fitToSchema(typicalContent.hardBreaks, schema)).toEqual(
      doc(p(t("line 1\nline 2")), p(t("bold\nstill bold", [{ type: "bold" }])))
    );
    expect(fitToSchema(typicalContent.horizontalRule, schema)).toEqual(
      doc(p(t("above")), p(t("below")))
    );
  });
});

describe("fitToSchema without paragraphs", () => {
  // Tiptap's listItem requires paragraph, so a field can turn paragraph off
  // only together with listItem
  const content = doc(
    p(
      t("plain "),
      t("bold", [{ type: "bold" }]),
      { type: "hardBreak" },
      t("end")
    ),
    p(),
    {
      type: "heading",
      attrs: { textAlign: null, level: 2 },
      content: [t("Title")],
    }
  );

  it("uses the paragraph as the text block when the schema has one", () => {
    expect(defaultTextblock(getSchema([PuckRichText]))?.name).toBe("paragraph");
  });

  it("turns paragraphs into code blocks of plain text when the first text block is a code block", () => {
    const schema = schemaWith({ paragraph: false, listItem: false });

    expect(defaultTextblock(schema)?.name).toBe("codeBlock");
    expect(fitToSchema(content, schema)).toEqual(
      doc(
        {
          type: "codeBlock",
          attrs: { language: null },
          content: [t("plain bold\nend")],
        },
        { type: "codeBlock", attrs: { language: null } },
        {
          type: "heading",
          attrs: { textAlign: null, level: 2 },
          content: [t("Title")],
        }
      )
    );
  });

  it("turns paragraphs into level 1 headings when the first text block is a heading", () => {
    const schema = schemaWith({
      paragraph: false,
      listItem: false,
      blockquote: false,
      codeBlock: false,
    });

    expect(defaultTextblock(schema)?.name).toBe("heading");
    expect(fitToSchema(content, schema)).toEqual(
      doc(
        {
          type: "heading",
          attrs: { textAlign: null, level: 1 },
          content: [
            t("plain "),
            t("bold", [{ type: "bold" }]),
            { type: "hardBreak" },
            t("end"),
          ],
        },
        { type: "heading", attrs: { textAlign: null, level: 1 } },
        {
          type: "heading",
          attrs: { textAlign: null, level: 2 },
          content: [t("Title")],
        }
      )
    );
  });

  it("drops text blocks only when the schema has no text block at all", () => {
    const schema = schemaWith({
      paragraph: false,
      listItem: false,
      codeBlock: false,
      heading: false,
    });

    expect(defaultTextblock(schema)).toBeNull();
    // Unchecked: ProseMirror's toJSON leaves out an empty content array
    expect(fitToSchemaUnchecked(content, schema)).toEqual(doc());
  });
});

describe("fitToSchema without text alignment", () => {
  it("removes textAlign from paragraphs and headings", () => {
    const schema = getSchema([Document, Paragraph, Heading, Text]);

    // Checked: the editor loads the result exactly as it is
    expect(fitToSchema(typicalContent.alignment, schema)).toEqual(
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
  });
});

describe("findUnrenderableTypes", () => {
  it("finds nothing in the default schema", () => {
    expect(findUnrenderableTypes(getSchema([PuckRichText]))).toEqual([]);
  });

  it("finds the node and mark types that extensions add", () => {
    const Callout = Node.create({
      name: "callout",
      group: "block",
      content: "inline*",
    });
    const Highlight = Mark.create({ name: "highlight" });

    expect(
      findUnrenderableTypes(getSchema([PuckRichText, Callout, Highlight]))
    ).toEqual(["callout", "highlight"]);
  });
});
