import { generateHTML, generateJSON } from "@tiptap/html";
import { renderToStaticMarkup } from "react-dom/server.node";
import { PuckRichText } from "../../../components/RichTextEditor/extension";
import { richTextHtmlToJson } from "../html-to-json";
import { renderRichText } from "../render";
import { allTypicalContent } from "../__helpers__/fixtures";
import { isSameDom, tiptapHtml } from "../__helpers__/dom";

// Parse with jsdom here (the browser build); html-to-json.server.spec.ts runs
// the real server build with happy-dom.
jest.mock("@tiptap/html/server", () => jest.requireActual("@tiptap/html"));

/** What v0.23.0's RichTextRender showed for a stored string. */
const legacyRender = (content: string) => {
  if (!content) return "";

  const extensions = [PuckRichText];
  const json = /<\/?[a-z][\s\S]*>/i.test(content)
    ? generateJSON(content, extensions)
    : {
        type: "doc",
        content: [
          { type: "paragraph", content: [{ type: "text", text: content }] },
        ],
      };

  return generateHTML(json, extensions);
};

const legacyContent: Record<string, string> = {
  "editor output": tiptapHtml(allTypicalContent),
  "demo default": "<h2>Heading</h2><p>Body</p>",
  "styled markup": `<h2 style="text-align: center">Title</h2><p><strong>bold</strong> <em>it</em> <u>u</u> <a href="https://example.com" target="_blank" rel="noopener noreferrer nofollow">link</a></p><ul><li><p>item</p></li></ul><blockquote><p>q</p></blockquote>`,
  "markup outside the schema": `<p>hi</p><img src=x onerror="alert(1)"><table><tr><td>cell</td></tr></table>`,
  "unsafe link": `<p><a href="javascript:alert(1)">x</a></p>`,
  "CSS injection": `<p style="text-align: center; background: url(//evil.example)">x</p>`,
  "plain text": "Plain text & more",
  empty: "",
};

describe("richTextHtmlToJson", () => {
  it.each(Object.keys(legacyContent))(
    "renders %s the way v0.23.0 did",
    (name) => {
      const html = legacyContent[name];
      const actual = renderToStaticMarkup(
        <>{renderRichText(richTextHtmlToJson(html))}</>
      );
      const expected = legacyRender(html);

      expect({ same: isSameDom(actual, expected), actual, expected }).toEqual({
        same: true,
        actual,
        expected,
      });
    }
  );
});
