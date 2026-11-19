import { render } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server.node";
import { RichTextContent } from "../../../components/RichTextEditor/components/RichTextContent";
import { RICHTEXT_MAX_DEPTH } from "../normalize";
import { markMapping, nodeMapping, renderRichText } from "../render";
import {
  allTypicalContent,
  deepBlockquotes,
  typicalContent,
} from "../__helpers__/fixtures";
import { isSameDom, tiptapHtml } from "../__helpers__/dom";
import type { RichTextNode } from "../types";

const markupOf = (value: unknown) =>
  renderToStaticMarkup(<>{renderRichText(value)}</>);

const expectSameDom = (actual: string, expected: string) => {
  // Printing both strings makes a failure readable
  expect({ same: isSameDom(actual, expected), actual, expected }).toEqual({
    same: true,
    actual,
    expected,
  });
};

describe("isSameDom", () => {
  it("ignores attribute order and style formatting", () => {
    expect(
      isSameDom(
        '<p style="text-align:center"><a href="/a" rel="r">x</a></p>',
        '<p style="text-align: center;"><a rel="r" href="/a">x</a></p>'
      )
    ).toBe(true);
  });

  it("detects marks that are not merged", () => {
    expect(
      isSameDom(
        "<strong>a</strong><strong><em>b</em></strong>",
        "<strong>a<em>b</em></strong>"
      )
    ).toBe(false);
  });
});

describe("renderRichText", () => {
  describe("matches the HTML Tiptap generates", () => {
    it.each(Object.keys(typicalContent))("for %s", (name) => {
      const value = typicalContent[name];

      expectSameDom(markupOf(value), tiptapHtml(value));
    });

    it("for all typical content in one document", () => {
      expectSameDom(markupOf(allTypicalContent), tiptapHtml(allTypicalContent));
    });
  });

  it("merges adjacent marks the way ProseMirror does", () => {
    expect(markupOf(typicalContent.nestedMarks)).toBe(
      "<p><strong>bold <em>bold italic</em> bold</strong> <strong><em><s><u>all</u></s></em></strong></p>"
    );
  });

  it("renders a string as one escaped text paragraph", () => {
    expect(markupOf("<p>Hello</p>")).toBe("<p>&lt;p&gt;Hello&lt;/p&gt;</p>");
  });

  it.each([undefined, null, "", 1, {}])("renders nothing for %p", (value) => {
    expect(markupOf(value)).toBe("");
  });

  it("uses mappings without a prototype", () => {
    expect(Object.getPrototypeOf(nodeMapping)).toBeNull();
    expect(Object.getPrototypeOf(markMapping)).toBeNull();
  });

  describe("depth limit (F2)", () => {
    it("renders a 5,000-level document on the server, keeping 100 levels", () => {
      const html = markupOf(deepBlockquotes(5000));

      expect(html.match(/<blockquote>/g)).toHaveLength(RICHTEXT_MAX_DEPTH);
      expect(html).toContain("<p>deep</p>");
    });

    it("renders a 5,000-level document on the client", () => {
      const { container } = render(
        <>{renderRichText(deepBlockquotes(5000))}</>
      );

      expect(container.querySelectorAll("blockquote")).toHaveLength(
        RICHTEXT_MAX_DEPTH
      );
      expect(container.textContent).toBe("deep");
    });

    it("renders a 5,000-level list", () => {
      let node: RichTextNode = {
        type: "paragraph",
        content: [{ type: "text", text: "item" }],
      };

      for (let i = 0; i < 5000; i++) {
        node = {
          type: "bulletList",
          content: [{ type: "listItem", content: [node] }],
        };
      }

      const html = markupOf({ type: "doc", content: [node] });

      expect(html.match(/<ul>/g)).toHaveLength(RICHTEXT_MAX_DEPTH / 2);
      expect(html).toContain("item");
    });
  });
});

describe("RichTextContent", () => {
  it("wraps the content in the rich text classes", () => {
    expect(
      renderToStaticMarkup(<RichTextContent content={typicalContent.marks} />)
    ).toBe(
      `<div class="RichTextEditor"><div class="rich-text">${markupOf(
        typicalContent.marks
      )}</div></div>`
    );
  });

  it("does not use hooks, so it can run as a server component", () => {
    expect(() => RichTextContent({ content: allTypicalContent })).not.toThrow();
  });
});
