import { normalizeRichText, RICHTEXT_MAX_DEPTH } from "../normalize";
import {
  allTypicalContent,
  deepBlockquotes,
  doc,
  typicalContent,
} from "../__helpers__/fixtures";
import { canonicalize } from "../__helpers__/dom";
import type { RichTextNode } from "../types";

const p = (...content: RichTextNode[]): RichTextNode =>
  content.length
    ? { type: "paragraph", attrs: { textAlign: null }, content }
    : { type: "paragraph", attrs: { textAlign: null } };

const t = (text: string): RichTextNode => ({ type: "text", text });

describe("normalizeRichText", () => {
  describe("valid editor output", () => {
    it("fixtures are in the canonical editor.getJSON() shape", () => {
      expect(canonicalize(allTypicalContent)).toEqual(allTypicalContent);
    });

    it.each(Object.keys(typicalContent))("returns %s unchanged", (name) => {
      const value = typicalContent[name];

      expect(normalizeRichText(value)).toEqual(value);
    });

    it("fills in the default attributes Tiptap would add", () => {
      expect(
        normalizeRichText({
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "x",
                  marks: [{ type: "link", attrs: { href: "https://a.test" } }],
                },
              ],
            },
            { type: "heading", content: [t("h")] },
            { type: "orderedList", content: [{ type: "listItem" }] },
            { type: "codeBlock", content: [t("c")] },
          ],
        })
      ).toEqual({
        type: "doc",
        content: [
          {
            type: "paragraph",
            attrs: { textAlign: null },
            content: [
              {
                type: "text",
                text: "x",
                marks: [
                  {
                    type: "link",
                    attrs: {
                      href: "https://a.test",
                      target: "_blank",
                      rel: "noopener noreferrer nofollow",
                      class: null,
                      title: null,
                    },
                  },
                ],
              },
            ],
          },
          {
            type: "heading",
            attrs: { textAlign: null, level: 1 },
            content: [t("h")],
          },
          {
            type: "orderedList",
            attrs: { start: 1, type: null },
            content: [{ type: "listItem" }],
          },
          { type: "codeBlock", attrs: { language: null }, content: [t("c")] },
        ],
      });
    });

    it("sorts marks into schema order and drops duplicates", () => {
      expect(
        normalizeRichText(
          doc({
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "x",
                marks: [
                  { type: "italic" },
                  { type: "bold" },
                  { type: "italic" },
                  { type: "underline" },
                ],
              },
            ],
          })
        ).content?.[0].content?.[0].marks
      ).toEqual([{ type: "bold" }, { type: "italic" }, { type: "underline" }]);
    });
  });

  describe("non-document input", () => {
    it("treats a string as plain text", () => {
      expect(normalizeRichText("<p>Hello</p>")).toEqual(
        doc(p(t("<p>Hello</p>")))
      );
    });

    it.each([undefined, null, 1, true, [], ""])(
      "returns an empty document for %p",
      (value) => {
        expect(normalizeRichText(value)).toEqual({ type: "doc", content: [] });
      }
    );

    it("wraps a lone block node in a document", () => {
      expect(
        normalizeRichText({ type: "paragraph", content: [t("x")] })
      ).toEqual(doc(p(t("x"))));
    });
  });

  describe("unknown and misplaced content", () => {
    it("keeps only the text of unknown nodes", () => {
      expect(
        normalizeRichText(
          doc(
            {
              type: "image",
              attrs: { src: "x", onerror: "alert(1)" },
              content: [t("caption")],
            },
            p(t("a "), { type: "mention", content: [t("@b")] })
          )
        )
      ).toEqual(doc(p(t("caption")), p(t("a "), t("@b"))));
    });

    it.each(["constructor", "__proto__", "toString", "hasOwnProperty"])(
      "treats the type %j as unknown",
      (type) => {
        expect(normalizeRichText(doc({ type, content: [t("x")] }))).toEqual(
          doc(p(t("x")))
        );
      }
    );

    it.each([1, null, {}, ["paragraph"]])(
      "treats a non-string type (%p) as unknown",
      (type) => {
        expect(
          normalizeRichText({
            type: "doc",
            content: [{ type, content: [t("x")] }],
          })
        ).toEqual(doc(p(t("x"))));
      }
    );

    it("drops nodes that have no text", () => {
      expect(
        normalizeRichText(doc({ type: "video" } as RichTextNode, p()))
      ).toEqual(doc(p()));
    });

    it("drops unknown marks and keeps the text", () => {
      expect(
        normalizeRichText(
          doc({
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "x",
                marks: [
                  { type: "textStyle", attrs: { color: "red" } },
                  { type: "__proto__" },
                  { type: "bold" },
                ],
              },
            ],
          })
        )
      ).toEqual(doc(p({ type: "text", text: "x", marks: [{ type: "bold" }] })));
    });

    it("flattens block nodes inside a paragraph to text", () => {
      expect(
        normalizeRichText(doc(p(t("a"), p(t("b")) as RichTextNode)))
      ).toEqual(doc(p(t("a"), t("b"))));
    });

    it("wraps text that sits directly in a block container", () => {
      expect(normalizeRichText(doc(t("loose")))).toEqual(doc(p(t("loose"))));
    });

    it("wraps list children that are not list items", () => {
      expect(
        normalizeRichText(doc({ type: "bulletList", content: [p(t("x"))] }))
      ).toEqual(
        doc({
          type: "bulletList",
          content: [{ type: "listItem", content: [p(t("x"))] }],
        })
      );
    });

    it("strips marks and nodes other than text from code blocks", () => {
      expect(
        normalizeRichText(
          doc({
            type: "codeBlock",
            attrs: { language: "ts" },
            content: [
              { type: "text", text: "a", marks: [{ type: "bold" }] },
              { type: "hardBreak" },
              t("b"),
            ],
          })
        )
      ).toEqual(
        doc({
          type: "codeBlock",
          attrs: { language: "ts" },
          content: [t("a"), t("\n"), t("b")],
        })
      );
    });

    it("drops empty and non-string text", () => {
      expect(
        normalizeRichText(
          doc(
            p(
              t(""),
              { type: "text" },
              { type: "text", text: 1 } as unknown as RichTextNode,
              t("ok")
            )
          )
        )
      ).toEqual(doc(p(t("ok"))));
    });
  });

  describe("attributes", () => {
    it("drops attributes that are not part of the schema", () => {
      expect(
        normalizeRichText(
          doc({
            type: "paragraph",
            attrs: {
              textAlign: "center",
              style: "color:red",
              onclick: "alert(1)",
              class: "x",
            },
            content: [t("x")],
          })
        )
      ).toEqual(doc({ ...p(t("x")), attrs: { textAlign: "center" } }));
    });

    it.each([
      "center; background:url(//evil.example)",
      "CENTER",
      "start",
      1,
      {},
    ])("rejects textAlign %p", (textAlign) => {
      expect(
        normalizeRichText(
          doc({ type: "paragraph", attrs: { textAlign }, content: [t("x")] })
        )
      ).toEqual(doc(p(t("x"))));
    });

    it.each([0, 7, 2.5, "2", null])(
      "falls back to level 1 for heading level %p",
      (level) => {
        expect(
          normalizeRichText(
            doc({ type: "heading", attrs: { level }, content: [t("x")] })
          ).content?.[0].attrs
        ).toEqual({ textAlign: null, level: 1 });
      }
    );

    it("validates ordered list start and type", () => {
      const attrsFor = (attrs: Record<string, unknown>) =>
        normalizeRichText(doc({ type: "orderedList", attrs })).content?.[0]
          .attrs;

      expect(attrsFor({ start: 5, type: "I" })).toEqual({
        start: 5,
        type: "I",
      });
      expect(attrsFor({ start: "5", type: "disc" })).toEqual({
        start: 1,
        type: null,
      });
      expect(attrsFor({ start: 1.5, type: "1" })).toEqual({
        start: 1,
        type: "1",
      });
    });

    it.each(["js onclick=alert(1)", 'a"b', "x".repeat(65), 1])(
      "rejects code block language %p",
      (language) => {
        expect(
          normalizeRichText(
            doc({ type: "codeBlock", attrs: { language }, content: [t("x")] })
          ).content?.[0].attrs
        ).toEqual({ language: null });
      }
    );

    describe("links", () => {
      const linkOf = (attrs: Record<string, unknown>) =>
        normalizeRichText(
          doc({
            type: "paragraph",
            content: [
              { type: "text", text: "x", marks: [{ type: "link", attrs }] },
            ],
          })
        ).content?.[0].content?.[0];

      it.each([
        "javascript:alert(1)",
        "JAVASCRIPT:alert(1)",
        " javascript:alert(1)",
        "\u0001javascript:alert(1)",
        "&#106;avascript:alert(1)",
        "data:text/html,<script>alert(1)</script>",
        "vbscript:msgbox(1)",
        undefined,
        42,
      ])("removes the link when href is %p and keeps the text", (href) => {
        expect(linkOf({ href })).toEqual(t("x"));
      });

      it("keeps only valid link attributes", () => {
        expect(
          linkOf({
            href: "https://example.com",
            target: "evil-frame",
            rel: 'noopener" onclick="alert(1)',
            class: "fixed inset-0",
            title: "Example",
            onclick: "alert(1)",
            style: "position:fixed",
          })?.marks
        ).toEqual([
          {
            type: "link",
            attrs: {
              href: "https://example.com",
              target: null,
              rel: null,
              class: null,
              title: "Example",
            },
          },
        ]);
      });

      it("drops rel opener, so a page opened in a new tab cannot reach this one", () => {
        const relOf = (rel: string) =>
          linkOf({ href: "https://example.com", target: "_blank", rel })
            ?.marks?.[0].attrs?.rel;

        expect(
          ["opener", "OPENER", "noopener opener", "opener noreferrer"].map(
            relOf
          )
        ).toEqual([null, null, "noopener", "noreferrer"]);
      });
    });
  });

  describe("depth limit", () => {
    it("keeps nodes up to maxDepth and turns deeper ones into text", () => {
      expect(normalizeRichText(deepBlockquotes(5), { maxDepth: 3 })).toEqual(
        doc({
          type: "blockquote",
          content: [
            {
              type: "blockquote",
              content: [{ type: "blockquote", content: [p(t("deep"))] }],
            },
          ],
        })
      );
    });

    it("defaults to RICHTEXT_MAX_DEPTH (100)", () => {
      expect(RICHTEXT_MAX_DEPTH).toBe(100);

      let node: RichTextNode | undefined = normalizeRichText(
        deepBlockquotes(5000)
      );
      let blockquotes = 0;

      while (node?.content?.[0]?.type === "blockquote") {
        blockquotes++;
        node = node.content[0];
      }

      expect(blockquotes).toBe(RICHTEXT_MAX_DEPTH);
      expect(node?.content).toEqual([p(t("deep"))]);
    });

    it("extracts the text of a very deep subtree without recursion", () => {
      expect(
        normalizeRichText(deepBlockquotes(100_000, "bottom"), { maxDepth: 0 })
      ).toEqual(doc(p(t("bottom"))));
    });

    it("stops at cycles", () => {
      const node: RichTextNode = { type: "blockquote", content: [] };
      node.content!.push(node, p(t("x")));

      expect(normalizeRichText(doc(node))).toEqual(
        doc({ type: "blockquote", content: [p(t("x"))] })
      );
    });
  });
});
