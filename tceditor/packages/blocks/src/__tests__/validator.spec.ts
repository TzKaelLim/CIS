import { exampleToPageData } from "@tzuchi/tceditor-spec";
import { textToRichText } from "@tzuchi/tceditor/rules";
import type { RichTextDoc } from "@tzuchi/tceditor/rules";
import cases from "../__fixtures__/validator-cases.json";
import { blockSpecs } from "../specs";
import { validatePage, validatePageJson } from "../validator";
import type { IssueCode, ValidateResult } from "../validator";

type Found = { code: IssueCode; pathText: string };

type Case = {
  name: string;
  input: unknown;
  // notices defaults to [] (scripts/check-edge.mjs reads the same file)
  expect: { ok: true; notices?: Found[] } | { ok: false; errors: Found[] };
};

const byPath = (a: { pathText: string; code: string }, b: typeof a) =>
  a.pathText === b.pathText
    ? a.code.localeCompare(b.code)
    : a.pathText.localeCompare(b.pathText);

const found = (issues: readonly Found[]): Found[] =>
  issues.map(({ code, pathText }) => ({ code, pathText })).sort(byPath);

/** code + pathText of each error or notice, sorted */
const summarize = (result: ValidateResult): Case["expect"] =>
  result.ok
    ? { ok: true, notices: found(result.notices) }
    : { ok: false, errors: found(result.errors) };

const expectOk = (result: ValidateResult) => {
  if (!result.ok) throw new Error(JSON.stringify(result.errors, null, 2));

  return result;
};

const singleBlockPage = (type: string, props: Record<string, unknown>) => ({
  root: { props: {} },
  content: [{ type, props: { id: `${type}-1`, ...props } }],
});

// What the editor stores for a Paragraph that was edited, as editor.getJSON()
// returns it. The Paragraph field turns textAlign off (richTextFeaturesToOptions),
// so Tiptap's paragraphs carry no attrs at all.
const EDITED_BODY: RichTextDoc = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [
        { type: "text", text: "我們在 " },
        { type: "text", marks: [{ type: "bold" }], text: "週六" },
        { type: "text", marks: [{ type: "italic" }], text: " 早上集合，" },
        { type: "hardBreak" },
        { type: "text", text: "報名請看" },
        {
          type: "text",
          marks: [
            {
              type: "link",
              attrs: {
                href: "/register",
                target: "_blank",
                rel: "noopener noreferrer nofollow",
                class: null,
                title: null,
              },
            },
          ],
          text: "活動頁",
        },
      ],
    },
    {
      type: "bulletList",
      content: [
        {
          type: "listItem",
          content: [
            { type: "paragraph", content: [{ type: "text", text: "帶水壺" }] },
          ],
        },
      ],
    },
    {
      type: "orderedList",
      attrs: { start: 1, type: null },
      content: [
        {
          type: "listItem",
          content: [
            { type: "paragraph", content: [{ type: "text", text: "報到！" }] },
          ],
        },
      ],
    },
  ],
};

// textToRichText("請輸入內文。") as the validator stores it: the Paragraph
// body turns textAlign off, so the paragraph loses attrs.textAlign
const STORED_DEFAULT_BODY: RichTextDoc = {
  type: "doc",
  content: [
    { type: "paragraph", content: [{ type: "text", text: "請輸入內文。" }] },
  ],
};

/** A page exactly as <Puck onPublish> hands it over (Review Focus #1). */
const editorPage = () => ({
  root: { props: { title: "淨灘活動", description: "" } },
  content: [
    {
      type: "Heading",
      props: {
        id: "Heading-0b6f8e3a-5c1d-4e2f-9a7b-3c4d5e6f7a8b",
        text: "一起守護海岸",
        level: "h1",
        align: "center",
      },
    },
    {
      type: "Paragraph",
      props: {
        id: "Paragraph-1c2d3e4f-5a6b-4c7d-8e9f-0a1b2c3d4e5f",
        body: EDITED_BODY,
        align: "start",
      },
    },
    {
      type: "Section",
      props: {
        id: "Section-2d3e4f5a-6b7c-4d8e-9f0a-1b2c3d4e5f6a",
        background: "secondary",
        paddingY: "48",
        content: [
          {
            type: "Paragraph",
            props: {
              // Written by textToRichText: the paragraph has textAlign: null
              id: "Paragraph-3e4f5a6b-7c8d-4e9f-8a1b-2c3d4e5f6a7b",
              body: textToRichText("請輸入內文。"),
              align: "start",
            },
          },
          {
            type: "Columns",
            props: {
              id: "Columns-4f5a6b7c-8d9e-4f0a-9b2c-3d4e5f6a7b8c",
              columns: [
                {
                  content: [
                    {
                      type: "Card",
                      props: {
                        id: "Card-5a6b7c8d-9e0f-4a1b-8c3d-4e5f6a7b8c9d",
                        title: "卡片標題",
                        summary: "",
                        href: "",
                        variant: "default",
                        content: [
                          {
                            type: "Button",
                            props: {
                              id: "Button-6b7c8d9e-0f1a-4b2c-9d4e-5f6a7b8c9d0e",
                              label: "立即報名",
                              href: "/register",
                              variant: "primary",
                              size: "md",
                              fullWidth: false,
                            },
                          },
                        ],
                      },
                    },
                  ],
                },
                {
                  content: [
                    {
                      type: "TagList",
                      props: {
                        id: "TagList-7c8d9e0f-1a2b-4c3d-8e5f-6a7b8c9d0e1f",
                        tags: [{ label: "志工" }, { label: "環保" }],
                        color: "default",
                        variant: "secondary",
                      },
                    },
                  ],
                },
              ],
              gap: "24",
            },
          },
        ],
      },
    },
    {
      type: "Image",
      props: {
        id: "Image-8d9e0f1a-2b3c-4d4e-9f6a-7b8c9d0e1f2a",
        image: { assetId: "demo-1", alt: "海灘", decorative: false },
        ratio: "16:9",
        caption: "",
      },
    },
  ],
  zones: {},
});

describe("validatePage with the 8 blocks", () => {
  const examples = blockSpecs.flatMap((spec) =>
    spec.examples.map((example, index) => ({
      name: `${spec.type}: ${example.name}`,
      spec,
      index,
    }))
  );

  it.each(examples)("accepts the example $name", ({ spec, index }) => {
    const result = expectOk(validatePage(exampleToPageData(spec, index)));

    expect(result.notices).toEqual([]);
  });

  it.each(
    blockSpecs
      .map((spec) => spec.type)
      .filter((type) => type !== "Button" && type !== "Image")
  )("accepts a %s that has only an id", (type) => {
    const result = expectOk(validatePage(singleBlockPage(type, {})));

    expect(result.notices).toEqual([]);
    // The filled-in defaults validate to the same data again (Review Focus #1)
    expect(validatePage(structuredClone(result.data))).toEqual(result);
  });

  it("rejects a Button that has only an id at its href", () => {
    expect(summarize(validatePage(singleBlockPage("Button", {})))).toEqual({
      ok: false,
      errors: [{ code: "invalid_value", pathText: "content[0].props.href" }],
    });
  });

  it("rejects an Image that has only an id at its image", () => {
    // image()'s object-level check still runs after the assetId pattern
    // fails, so the empty alt is reported too
    expect(summarize(validatePage(singleBlockPage("Image", {})))).toEqual({
      ok: false,
      errors: [
        { code: "alt_required", pathText: "content[0].props.image.alt" },
        { code: "invalid_value", pathText: "content[0].props.image.assetId" },
      ],
    });
  });

  it("accepts data exactly as the editor emits it", () => {
    const page = editorPage();
    const before = structuredClone(page);
    const result = expectOk(validatePage(page));
    const expected = structuredClone(before.content);
    const section = expected[2].props as {
      content: { props: { body?: RichTextDoc } }[];
    };

    // EDITED_BODY is stored as it is; only the textToRichText body changes
    section.content[0].props.body = STORED_DEFAULT_BODY;

    expect(result.notices).toEqual([]);
    expect(result.data).toEqual({ root: before.root, content: expected });
    // The input is left as it was
    expect(page).toEqual(before);
  });

  it("is idempotent", () => {
    const first = expectOk(validatePage(editorPage()));
    const second = expectOk(validatePage(structuredClone(first.data)));

    expect(second).toEqual(first);
    expect(second.notices).toEqual([]);
  });

  it("fills missing slot arrays inside columns", () => {
    const result = expectOk(
      validatePage({
        root: { props: {} },
        content: [
          {
            type: "Columns",
            props: {
              id: "Columns-1",
              columns: [
                {},
                {
                  content: [
                    {
                      type: "Heading",
                      props: { id: "Heading-1", text: "右欄" },
                    },
                  ],
                },
              ],
            },
          },
          { type: "Card", props: { id: "Card-1", title: "沒有內容的卡片" } },
          { type: "Section", props: { id: "Section-1", content: [] } },
        ],
      })
    );
    const [columns, card, section] = result.data.content;

    expect(columns.props.columns).toEqual([
      { content: [] },
      {
        content: [
          {
            type: "Heading",
            props: {
              id: "Heading-1",
              text: "右欄",
              level: "h2",
              align: "start",
            },
          },
        ],
      },
    ]);
    expect(card.props.content).toEqual([]);
    expect(section.props.content).toEqual([]);
    expect(result.data.root.props).toEqual({
      title: "未命名頁面",
      description: "",
    });
  });

  it("counts the Button label limit in characters, not UTF-8 bytes", () => {
    const label40 = "字".repeat(40);

    expect(new TextEncoder().encode(label40).byteLength).toBe(120);
    expectOk(
      validatePage(singleBlockPage("Button", { label: label40, href: "/a" }))
    );
    expect(
      summarize(
        validatePage(
          singleBlockPage("Button", { label: `${label40}字`, href: "/a" })
        )
      )
    ).toEqual({
      ok: false,
      errors: [{ code: "invalid_value", pathText: "content[0].props.label" }],
    });
  });

  it.each(cases as Case[])(
    "validator-cases.json: $name",
    ({ input, expect: expected }) => {
      const normalized =
        expected.ok === true
          ? { ok: true, notices: found(expected.notices ?? []) }
          : { ok: false, errors: found(expected.errors) };

      expect(summarize(validatePage(input))).toEqual(normalized);
      expect(summarize(validatePageJson(JSON.stringify(input)))).toEqual(
        normalized
      );
    }
  );
});
