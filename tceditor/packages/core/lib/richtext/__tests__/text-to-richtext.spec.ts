import { textToRichText } from "../text-to-richtext";

describe("textToRichText", () => {
  it("wraps text in a single paragraph", () => {
    expect(textToRichText("Hello world")).toEqual({
      type: "doc",
      content: [
        {
          type: "paragraph",
          attrs: { textAlign: null },
          content: [{ type: "text", text: "Hello world" }],
        },
      ],
    });
  });

  it("keeps HTML as literal text", () => {
    const html = '<p>Hi</p><img src=x onerror="alert(1)">';

    expect(textToRichText(html).content?.[0].content).toEqual([
      { type: "text", text: html },
    ]);
  });

  it("keeps line breaks inside the text", () => {
    expect(textToRichText("a\nb").content?.[0].content).toEqual([
      { type: "text", text: "a\nb" },
    ]);
  });

  it("returns an empty document for an empty string", () => {
    expect(textToRichText("")).toEqual({ type: "doc", content: [] });
  });
});
