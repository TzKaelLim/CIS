import { RICHTEXT_MAX_DEPTH } from "@tzuchi/tceditor/rules";
import { isRichTextChanged } from "../richtext";

const text = (value: string, marks?: unknown[]) =>
  marks ? { type: "text", marks, text: value } : { type: "text", text: value };

const link = (href: string, extra: Record<string, unknown> = {}) => ({
  type: "link",
  attrs: { href, ...extra },
});

const doc = (...content: unknown[]) => ({ type: "doc", content });

/** `levels` blockquotes around a paragraph */
const nested = (levels: number): unknown => {
  let node: unknown = { type: "paragraph", content: [text("底")] };

  for (let level = 0; level < levels; level++) {
    node = { type: "blockquote", content: [node] };
  }

  return doc(node);
};

describe("isRichTextChanged", () => {
  it("finds no change in the same document, whatever the key order", () => {
    const before = doc({
      type: "paragraph",
      content: [text("報名", [link("/x", { target: "_blank" })])],
    });
    const after = {
      content: [
        {
          content: [
            {
              text: "報名",
              marks: [
                { attrs: { target: "_blank", href: "/x" }, type: "link" },
              ],
              type: "text",
            },
          ],
          type: "paragraph",
        },
      ],
      type: "doc",
    };

    expect(isRichTextChanged(before, after)).toBe(false);
    expect(isRichTextChanged(after, before)).toBe(false);
  });

  it("ignores null attributes and empty attrs, content and marks", () => {
    const bare = doc({ type: "paragraph", content: [text("a")] });

    for (const before of [
      doc({
        type: "paragraph",
        attrs: { textAlign: null },
        content: [text("a")],
      }),
      doc({ type: "paragraph", attrs: {}, content: [text("a")] }),
      doc({ type: "paragraph", marks: [], content: [text("a", [])] }),
      doc({ type: "paragraph", content: [text("a")] }, ...[]),
    ]) {
      expect(isRichTextChanged(before, bare)).toBe(false);
      expect(isRichTextChanged(bare, before)).toBe(false);
    }

    expect(
      isRichTextChanged(
        doc({ type: "paragraph", content: [] }),
        doc({ type: "paragraph" })
      )
    ).toBe(false);
    expect(
      isRichTextChanged(
        doc(text("a", [link("/x", { class: null, title: null })])),
        doc(text("a", [link("/x")]))
      )
    ).toBe(false);
  });

  it("keeps attributes that are not null, and attrs or content that are not empty", () => {
    const bare = { type: "paragraph" };

    for (const before of [
      { type: "paragraph", attrs: { textAlign: "center" } },
      { type: "paragraph", attrs: { textAlign: false } },
      { type: "paragraph", attrs: null },
      { type: "paragraph", attrs: [] },
      { type: "paragraph", content: {} },
      { type: "paragraph", content: [text("a")] },
      { type: "paragraph", marks: [{ type: "bold" }] },
      // Inside attrs, an empty array is a value like any other
      { type: "paragraph", attrs: { content: [] } },
    ]) {
      expect(isRichTextChanged(before, bare)).toBe(true);
      expect(isRichTextChanged(bare, before)).toBe(true);
    }
  });

  it.each([
    ["changed text", doc(text("a")), doc(text("b"))],
    ["a removed node", doc(text("a"), text("b")), doc(text("a"))],
    ["a removed mark", doc(text("a", [{ type: "bold" }])), doc(text("a"))],
    [
      "a cleaned link",
      doc(text("a", [link("javascript:alert(1)")])),
      doc(text("a")),
    ],
    [
      "a filled-in attribute",
      doc(text("a", [link("/x")])),
      doc(text("a", [link("/x", { target: "_blank" })])),
    ],
    ["a changed type", { type: "heading" }, { type: "paragraph" }],
    ["a record and an array", { type: "doc", content: {} }, doc()],
    ["a number and a string", { level: 1 }, { level: "1" }],
    ["a value and a missing one", { type: "doc" }, undefined],
  ])("finds %s", (_, before, after) => {
    expect(isRichTextChanged(before, after)).toBe(true);
    expect(isRichTextChanged(after, before)).toBe(true);
  });

  it("treats values as JSON does", () => {
    // JSON writes them as null
    expect(isRichTextChanged([undefined, NaN], [null, null])).toBe(false);
    // JSON leaves them out of a record
    expect(
      isRichTextChanged({ type: "doc", x: undefined }, { type: "doc" })
    ).toBe(false);
    // JSON.stringify throws
    expect(isRichTextChanged({ level: BigInt(1) }, { level: BigInt(1) })).toBe(
      true
    );
  });

  it("counts a document too deep or cyclic to compare as changed", () => {
    // normalizeRichText keeps RICHTEXT_MAX_DEPTH levels, which still compare
    expect(
      isRichTextChanged(nested(RICHTEXT_MAX_DEPTH), nested(RICHTEXT_MAX_DEPTH))
    ).toBe(false);
    expect(
      isRichTextChanged(
        nested(2 * RICHTEXT_MAX_DEPTH),
        nested(2 * RICHTEXT_MAX_DEPTH)
      )
    ).toBe(true);

    const cyclic: { type: string; content: unknown[] } = {
      type: "doc",
      content: [],
    };

    cyclic.content.push(cyclic);

    expect(isRichTextChanged(cyclic, cyclic)).toBe(true);
  });

  it("stops at the first difference", () => {
    let reads = 0;
    const unread = {};

    Object.defineProperty(unread, "type", {
      enumerable: true,
      get: () => {
        reads++;
        return "paragraph";
      },
    });

    expect(
      isRichTextChanged(
        doc({ type: "heading" }, unread),
        doc({ type: "paragraph" }, { type: "paragraph" })
      )
    ).toBe(true);
    expect(reads).toBe(0);
  });

  it("counts a getter that throws as a change", () => {
    const broken = {};

    Object.defineProperty(broken, "type", {
      enumerable: true,
      get: () => {
        throw new Error("broken");
      },
    });

    expect(isRichTextChanged(doc(broken), doc({ type: "paragraph" }))).toBe(
      true
    );
  });
});
