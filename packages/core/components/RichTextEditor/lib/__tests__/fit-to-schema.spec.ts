import { getSchema, Mark, Node } from "@tiptap/core";
import type { Schema } from "@tiptap/pm/model";
import { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { PuckRichText, PuckRichTextOptions } from "../../extension";
import {
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
