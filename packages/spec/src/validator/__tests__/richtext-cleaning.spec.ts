import { errorsOf, kitchenSink, page, validator } from "../__helpers__/pages";
import type { ValidateResult } from "../index";

const paragraph = (content: unknown[], textAlign: string | null = null) =>
  textAlign === null
    ? { type: "paragraph", content }
    : { type: "paragraph", attrs: { textAlign }, content };

const text = (value: string, marks?: unknown[]) =>
  marks ? { type: "text", marks, text: value } : { type: "text", text: value };

const doc = (...content: unknown[]) => ({ type: "doc", content });

const withBody = (body: unknown): ValidateResult =>
  validator.validatePage(page([kitchenSink("k", { body })]));

/** The cleaned body and the paths of the notices. */
const clean = (body: unknown) => {
  const result = withBody(body);

  if (!result.ok) throw new Error(JSON.stringify(result.errors, null, 2));

  return {
    body: result.data.content[0].props.body,
    notices: result.notices.map((notice) => [
      notice.pathText,
      notice.code,
      notice.blockType,
    ]),
  };
};

const NOTICE = [["content[0].props.body", "richtext_cleaned", "KitchenSink"]];

describe("rich text cleaning (spec §6.2 #11)", () => {
  it("keeps the text of an unknown node", () => {
    expect(
      clean(
        doc({
          type: "mention",
          attrs: { id: "u1" },
          content: [text("@志工")],
        })
      )
    ).toEqual({ body: doc(paragraph([text("@志工")])), notices: NOTICE });
  });

  it("turns a heading the field does not allow into a paragraph", () => {
    expect(
      clean(
        doc({
          type: "heading",
          attrs: { textAlign: null, level: 2 },
          content: [text("活動說明")],
        })
      )
    ).toEqual({ body: doc(paragraph([text("活動說明")])), notices: NOTICE });
  });

  it("keeps only the text of a javascript: link", () => {
    expect(
      clean(
        doc(
          paragraph([
            text("點我", [
              { type: "link", attrs: { href: "javascript:alert(1)" } },
            ]),
          ])
        )
      )
    ).toEqual({ body: doc(paragraph([text("點我")])), notices: NOTICE });
  });

  it("removes text alignment", () => {
    expect(clean(doc(paragraph([text("置中")], "center")))).toEqual({
      body: doc(paragraph([text("置中")])),
      notices: NOTICE,
    });
  });

  it("removes a mark the field does not allow", () => {
    expect(clean(doc(paragraph([text("斜體", [{ type: "italic" }])])))).toEqual(
      {
        body: doc(paragraph([text("斜體")])),
        notices: NOTICE,
      }
    );
  });

  it("flattens rich text nested far too deep", () => {
    let node: unknown = paragraph([text("底")]);

    for (let i = 0; i < 10_000; i++) {
      node = { type: "blockquote", content: [node] };
    }

    expect(clean(doc(node))).toEqual({
      body: doc(paragraph([text("底")])),
      notices: NOTICE,
    });
  });

  it("does not report editor output that needs no cleaning", () => {
    const link = {
      type: "link",
      attrs: {
        href: "https://example.org",
        target: "_blank",
        rel: "noopener noreferrer nofollow",
        class: null,
        title: null,
      },
    };

    // Without attrs (TextAlign is off in this field) and with a null textAlign
    for (const body of [
      doc(paragraph([text("粗", [{ type: "bold" }]), text("連結", [link])])),
      doc({
        type: "paragraph",
        attrs: { textAlign: null },
        content: [text("attrs 只有 null")],
      }),
      doc({ type: "paragraph" }),
      { type: "doc" },
    ]) {
      expect(clean(body).notices).toEqual([]);
    }
  });

  it("notes a link that only had its default attributes filled in", () => {
    expect(
      clean(
        doc(
          paragraph([text("報名", [{ type: "link", attrs: { href: "/x" } }])])
        )
      )
    ).toEqual({
      body: doc(
        paragraph([
          text("報名", [
            {
              type: "link",
              attrs: {
                href: "/x",
                target: "_blank",
                rel: "noopener noreferrer nofollow",
                class: null,
                title: null,
              },
            },
          ]),
        ])
      ),
      notices: NOTICE,
    });
  });

  it("uses the default without a notice when the field is missing", () => {
    const result = validator.validatePage(page([kitchenSink("k")]));

    expect(result.ok && result.notices).toEqual([]);
  });

  it.each([
    ["a string", "<p>舊的 HTML</p>"],
    ["another node", paragraph([text("段落")])],
    ["an array", [paragraph([text("段落")])]],
    ["null", null],
  ])("rejects %s instead of cleaning it", (_, body) => {
    expect(errorsOf(withBody(body))).toEqual([
      ["content[0].props.body", "invalid_value"],
    ]);
  });
});
