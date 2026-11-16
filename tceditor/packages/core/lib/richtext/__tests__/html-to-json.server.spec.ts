/** @jest-environment node */
import { generateHTML } from "@tiptap/html/server";
import { PuckRichText } from "../../../components/RichTextEditor/extension";
import { parseRichTextHtml, richTextHtmlToJson } from "../html-to-json";
import { doc, typicalContent } from "../__helpers__/fixtures";

const paragraph = (...content: object[]) => ({
  type: "paragraph",
  attrs: { textAlign: null },
  content,
});

describe("richTextHtmlToJson on the server (happy-dom)", () => {
  it.each(Object.keys(typicalContent).filter((name) => name !== "links"))(
    "turns Tiptap's HTML for %s back into the same JSON",
    (name) => {
      const value = typicalContent[name];

      expect(richTextHtmlToJson(generateHTML(value, [PuckRichText]))).toEqual(
        value
      );
    }
  );

  it("gives links without target or rel Tiptap's defaults", () => {
    expect(richTextHtmlToJson('<p><a href="/about">about</a></p>')).toEqual(
      doc(
        paragraph({
          type: "text",
          text: "about",
          marks: [
            {
              type: "link",
              attrs: {
                href: "/about",
                target: "_blank",
                rel: "noopener noreferrer nofollow",
                class: null,
                title: null,
              },
            },
          ],
        })
      )
    );
  });

  it("drops markup outside the schema", () => {
    expect(
      richTextHtmlToJson(
        `<p>hi</p><img src=x onerror="alert(1)"><script>alert(1)</script>`
      )
    ).toEqual(doc(paragraph({ type: "text", text: "hi" })));
  });

  it("keeps a string without tags as plain text", () => {
    expect(richTextHtmlToJson("a & b")).toEqual(
      doc(paragraph({ type: "text", text: "a & b" }))
    );
  });

  it("drops the alignment of a field without text alignment", () => {
    expect(
      parseRichTextHtml('<p style="text-align: center">x</p>', [
        PuckRichText.configure({ textAlign: false }),
      ])
    ).toEqual(doc(paragraph({ type: "text", text: "x" })));
  });
});
