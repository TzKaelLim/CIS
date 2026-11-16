import { testBlocks, testRoot } from "../../__fixtures__/test-specs";
import { createPageValidator, type ValidateResult } from "../index";

export const validator = createPageValidator({
  blocks: testBlocks,
  root: testRoot,
});

export type TestNode = { type: string; props: Record<string, unknown> };

export const page = (
  content: unknown[],
  extra: Record<string, unknown> = {}
): Record<string, unknown> => ({
  root: { props: { title: "測試頁" } },
  content,
  ...extra,
});

export const leaf = (id: string, text = "葉"): TestNode => ({
  type: "Leaf",
  props: { id, text },
});

export const box = (id: string, content: unknown[] = []): TestNode => ({
  type: "Box",
  props: { id, content },
});

export const pair = (id: string, columns: unknown[][]): TestNode => ({
  type: "Pair",
  props: { id, columns: columns.map((content) => ({ content })) },
});

/** The required KitchenSink fields, filled in */
export const FILLED = {
  href: "/register",
  picture: { assetId: "demo-1", alt: "示意圖", decorative: false },
};

export const kitchenSink = (
  id: string,
  props: Record<string, unknown> = {}
): TestNode => ({ type: "KitchenSink", props: { id, ...FILLED, ...props } });

/** A chain of `levels` blocks: Boxes, with a Leaf as the deepest block. */
export const chain = (levels: number): TestNode => {
  let node = leaf(`n${levels}`);

  for (let level = levels - 1; level >= 1; level--) {
    node = box(`n${level}`, [node]);
  }

  return node;
};

/** The path of the deepest block of chain(levels) at content[0]. */
export const chainPath = (levels: number): (string | number)[] => {
  const path: (string | number)[] = ["content", 0];

  for (let level = 2; level <= levels; level++) {
    path.push("props", "content", 0);
  }

  return path;
};

/**
 * The JSON text of page([chain(levels)]), built as a string: a page tens of
 * thousands of levels deep needs no recursive JSON.stringify.
 */
export const chainPageJson = (levels: number): string => {
  const boxes: string[] = [];

  for (let level = 1; level < levels; level++) {
    boxes.push(`{"type":"Box","props":{"id":"n${level}","content":[`);
  }

  const deepest = `{"type":"Leaf","props":{"id":"n${levels}","text":"葉"}}`;

  return `{"root":{"props":{"title":"測試頁"}},"content":[${boxes.join(
    ""
  )}${deepest}${"]}}".repeat(levels - 1)}]}`;
};

/** [pathText, code] of every error, or [] when the page passed. */
export const errorsOf = (result: ValidateResult): [string, string][] =>
  result.ok ? [] : result.errors.map((issue) => [issue.pathText, issue.code]);

/** Builds a JSON text of exactly `bytes` UTF-8 bytes, mostly 3-byte Chinese text. */
export const jsonOfBytes = (bytes: number): string => {
  const head = '{"root":{"props":{"title":"';
  const tail = '"}},"content":[]}';
  const room = bytes - head.length - tail.length;
  const chinese = Math.floor(room / 3);

  return head + "中".repeat(chinese) + "a".repeat(room - chinese * 3) + tail;
};

/** What the editor emits (Review Focus #1): zones {}, uuid ids, no root id, getJSON() rich text. */
export const editorPage = (): Record<string, unknown> => ({
  root: { props: { title: "淨灘活動", description: "" } },
  content: [
    {
      type: "KitchenSink",
      props: {
        id: "KitchenSink-1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed",
        title: "一起去淨灘",
        note: "",
        count: 3,
        tone: "calm",
        size: "md",
        space: "16",
        enabled: true,
        href: "https://example.org/register",
        moreHref: "",
        body: {
          type: "doc",
          content: [
            {
              type: "paragraph",
              attrs: { textAlign: null },
              content: [
                { type: "text", text: "報名請按" },
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
                  text: "這裡",
                },
              ],
            },
            {
              type: "paragraph",
              content: [
                { type: "text", marks: [{ type: "bold" }], text: "免費" },
              ],
            },
          ],
        },
        items: [{ label: "一" }],
        group: { caption: "", level: 0 },
        content: [
          {
            type: "Leaf",
            props: {
              id: "Leaf-0d3c8a59-5f0e-4b7a-9a43-2f6b1c7e9d10",
              text: "子",
            },
          },
        ],
        picture: { assetId: "demo-1", alt: "海灘", decorative: false },
      },
    },
    {
      type: "Pair",
      props: {
        id: "Pair-7c9e6679-7425-40de-944b-e07fc1f90ae7",
        columns: [
          {
            content: [
              {
                type: "Box",
                props: {
                  id: "Box-16fd2706-8baf-433b-82eb-8c7fada847da",
                  content: [
                    {
                      type: "Leaf",
                      props: {
                        id: "Leaf-886313e1-3b8a-5372-9b90-0c9aee199e5d",
                        text: "左",
                      },
                    },
                  ],
                },
              },
            ],
          },
          { content: [] },
        ],
      },
    },
  ],
  zones: {},
});
