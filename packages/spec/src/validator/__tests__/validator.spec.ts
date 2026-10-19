import * as z from "zod";
import { leafSpec, testBlocks, testRoot } from "../../__fixtures__/test-specs";
import { definePageRoot } from "../../define";
import { slot } from "../../helpers";
import * as specPackage from "../../index";
import { exampleToPageData } from "../../page-data";
import {
  box,
  chain,
  chainPageJson,
  chainPath,
  editorPage,
  errorsOf,
  FILLED,
  jsonOfBytes,
  kitchenSink,
  leaf,
  page,
  pair,
  validator,
} from "../__helpers__/pages";
import {
  createPageValidator,
  DEFAULT_LIMITS,
  formatPathText,
  ISSUE_CODES,
  NODE_ID_PATTERN,
  type ValidateResult,
} from "../index";

type Accepted = Extract<ValidateResult, { ok: true }>;

const accepted = (result: ValidateResult): Accepted => {
  if (!result.ok) {
    throw new Error(
      `Expected the page to pass:\n${JSON.stringify(result.errors, null, 2)}`
    );
  }

  return result;
};

const leaves = (count: number, text = "葉") =>
  Array.from({ length: count }, (_, i) => leaf(`l${i}`, text));

describe("createPageValidator", () => {
  it("uses the limits of spec §6.2", () => {
    expect(DEFAULT_LIMITS).toEqual({
      maxBytes: 2_097_152,
      maxDepth: 32,
      maxBlocks: 5000,
      maxIssues: 100,
    });
    expect(NODE_ID_PATTERN.source).toBe("^[A-Za-z0-9_-]{1,64}$");
  });

  it("is exported from the package root", () => {
    expect(specPackage.createPageValidator).toBe(createPageValidator);
    expect(specPackage.DEFAULT_LIMITS).toBe(DEFAULT_LIMITS);
    expect(specPackage.NODE_ID_PATTERN).toBe(NODE_ID_PATTERN);
    expect(specPackage.ISSUE_CODES).toBe(ISSUE_CODES);
    expect(specPackage.formatPathText).toBe(formatPathText);
  });

  it("lists the block types in registration order", () => {
    expect(validator.blockTypes).toEqual([
      "KitchenSink",
      "Box",
      "Leaf",
      "Pair",
    ]);
  });

  it("throws when the specs break the authoring rules", () => {
    expect(() =>
      createPageValidator({ blocks: [leafSpec, leafSpec], root: testRoot })
    ).toThrow(/unique-type/);
  });

  it("rejects limits that are not positive integers", () => {
    expect(() =>
      createPageValidator({
        blocks: testBlocks,
        root: testRoot,
        limits: { maxDepth: 0 },
      })
    ).toThrow(TypeError);
    expect(() =>
      createPageValidator({
        blocks: testBlocks,
        root: testRoot,
        limits: { maxIssues: 1.5 },
      })
    ).toThrow("limits.maxIssues must be a positive integer, got 1.5");
  });

  it("throws when the page root spec has a slot field", () => {
    expect(() =>
      createPageValidator({
        blocks: testBlocks,
        root: definePageRoot({
          props: z.strictObject({
            content: slot({ allow: ["Leaf"] }).meta({ title: "內容" }),
          }),
        }),
      })
    ).toThrow("The page root spec must not have slot fields");
  });
});

describe("valid pages", () => {
  const examples = testBlocks.flatMap((spec) =>
    spec.examples.map((example, index) => ({
      spec,
      index,
      number: index + 1,
      name: example.name,
    }))
  );

  it.each(examples)(
    "accepts example $number of $spec.type ($name)",
    ({ spec, index }) => {
      const result = accepted(
        validator.validatePage(exampleToPageData(spec, index))
      );

      expect(result.notices).toEqual([]);
      expect(result.data.content[0].type).toBe(spec.type);
    }
  );

  it("accepts data exactly as the editor emits it", () => {
    const input = editorPage();
    const result = accepted(validator.validatePage(input));

    expect(result.notices).toEqual([]);
    expect(Object.keys(result.data)).toEqual(["root", "content"]);
    expect(result.data.root).toEqual({
      props: { title: "淨灘活動", description: "" },
    });
    expect(result.data.content.map((node) => node.props.id)).toEqual([
      "KitchenSink-1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed",
      "Pair-7c9e6679-7425-40de-944b-e07fc1f90ae7",
    ]);
    // TextAlign is off in this field: the null textAlign of the first
    // paragraph is removed, without a notice, and no paragraph gets attrs
    expect(result.data.content[0].props.body).toEqual({
      type: "doc",
      content: [
        {
          type: "paragraph",
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
          content: [{ type: "text", marks: [{ type: "bold" }], text: "免費" }],
        },
      ],
    });
  });

  it("is idempotent", () => {
    const pages = [
      editorPage(),
      ...testBlocks.flatMap((spec) =>
        spec.examples.map((_, index) => exampleToPageData(spec, index))
      ),
    ];

    for (const input of pages) {
      const first = accepted(validator.validatePage(input));
      const second = accepted(validator.validatePage(first.data));

      expect(second.data).toEqual(first.data);
      expect(second.notices).toEqual([]);
    }
  });

  it("fills missing props with their defaults", () => {
    const result = accepted(
      validator.validatePage(
        page([
          { type: "Leaf", props: { id: "l" } },
          { type: "Box", props: { id: "b" } },
          { type: "Pair", props: { id: "p", columns: [{}, { content: [] }] } },
          { type: "Pair", props: { id: "p2" } },
          kitchenSink("k"),
        ])
      )
    );
    const [leafNode, boxNode, pairNode, defaultPair, sink] =
      result.data.content;

    expect(leafNode.props).toEqual({ id: "l", text: "葉子" });
    expect(boxNode.props).toEqual({ id: "b", content: [] });
    expect(pairNode.props).toEqual({
      id: "p",
      columns: [{ content: [] }, { content: [] }],
    });
    expect(defaultPair.props).toEqual({
      id: "p2",
      columns: [{ content: [] }, { content: [] }],
    });
    expect(sink.props).toEqual({
      id: "k",
      title: "標題",
      note: "",
      count: 3,
      tone: "calm",
      size: "md",
      space: "16",
      enabled: true,
      href: "/register",
      moreHref: "",
      body: {
        type: "doc",
        content: [
          { type: "paragraph", content: [{ type: "text", text: "內文" }] },
        ],
      },
      items: [{ label: "一" }],
      group: { caption: "", level: 0 },
      content: [],
      picture: FILLED.picture,
    });
    expect(result.data.root.props).toEqual({
      title: "測試頁",
      description: "",
    });
  });

  it("removes readOnly and returns new objects", () => {
    const input = page([
      { ...leaf("a"), readOnly: { text: true } },
      box("b", [{ ...leaf("c"), readOnly: {} }]),
    ]);
    (input.root as Record<string, unknown>).readOnly = { title: true };
    const before = JSON.stringify(input);
    const result = accepted(validator.validatePage(input));

    expect(JSON.stringify(input)).toBe(before);
    expect(result.data).toEqual({
      root: { props: { title: "測試頁", description: "" } },
      content: [
        { type: "Leaf", props: { id: "a", text: "葉" } },
        { type: "Box", props: { id: "b", content: [leaf("c")] } },
      ],
    });
    expect(result.data.content[0]).not.toBe((input.content as unknown[])[0]);

    // Changing the output must not change the defaults of later pages
    const filled = accepted(validator.validatePage(page([kitchenSink("k")])));
    (filled.data.content[0].props.items as { label: string }[]).push({
      label: "改",
    });
    const again = accepted(validator.validatePage(page([kitchenSink("k")])));
    expect(again.data.content[0].props.items).toEqual([{ label: "一" }]);
  });

  it("keeps text that looks like a character reference as plain text", () => {
    const title = "&#x6A;avascript:alert(1)";
    const result = accepted(
      validator.validatePage(page([kitchenSink("k", { title })]))
    );

    expect(result.data.content[0].props.title).toBe(title);
  });

  it("accepts 32 levels, 5,000 blocks and ids of 64 characters", () => {
    expect(errorsOf(validator.validatePage(page([chain(32)])))).toEqual([]);
    expect(errorsOf(validator.validatePage(page(leaves(5000))))).toEqual([]);
    expect(
      errorsOf(validator.validatePage(page([leaf("a".repeat(64))])))
    ).toEqual([]);
  });

  it("accepts a block that a slot allows", () => {
    expect(
      errorsOf(
        validator.validatePage(
          page([
            box("b1", [box("b2", [leaf("l1")])]),
            kitchenSink("k", { content: [leaf("l2")] }),
            pair("p", [[box("b3")], [kitchenSink("k2")]]),
          ])
        )
      )
    ).toEqual([]);
  });
});

describe("invalid pages", () => {
  it.each([
    "javascript:alert(1)",
    "JAVASCRIPT:alert(1)",
    "JaVaScRiPt:alert(1)",
    "   javascript:alert(1)",
    "java\tscript:alert(1)",
    "java\nscript:alert(1)",
    "&#x6A;avascript:alert(1)",
    "jav&#x09;ascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "vbscript:msgbox(1)",
  ])("rejects the link %j", (href) => {
    expect(
      errorsOf(validator.validatePage(page([kitchenSink("k", { href })])))
    ).toEqual([["content[0].props.href", "unsafe_href"]]);
    expect(
      errorsOf(
        validator.validatePage(page([kitchenSink("k", { moreHref: href })]))
      )
    ).toEqual([["content[0].props.moreHref", "unsafe_href"]]);
  });

  it("rejects an unknown prop", () => {
    expect(
      errorsOf(validator.validatePage(page([kitchenSink("k", { foo: 1 })])))
    ).toEqual([["content[0].props.foo", "unknown_prop"]]);
    expect(
      errorsOf(
        validator.validatePage(
          page([kitchenSink("k", { group: { caption: "", level: 0, x: 1 } })])
        )
      )
    ).toEqual([["content[0].props.group.x", "unknown_prop"]]);
  });

  it.each(["Button", "constructor", "__proto__", "toString", "hasOwnProperty"])(
    "rejects the unknown type %j",
    (type) => {
      const json = `{"root":{"props":{}},"content":[{"type":${JSON.stringify(
        type
      )},"props":{"id":"a"}}]}`;

      expect(errorsOf(validator.validatePageJson(json))).toEqual([
        ["content[0].type", "unknown_type"],
      ]);
    }
  );

  it("rejects duplicate ids, also across slots", () => {
    expect(
      errorsOf(validator.validatePage(page([leaf("a"), leaf("a")])))
    ).toEqual([["content[1].props.id", "duplicate_id"]]);
    expect(
      errorsOf(validator.validatePage(page([box("a", [leaf("a")])])))
    ).toEqual([["content[0].props.content[0].props.id", "duplicate_id"]]);
  });

  it.each([
    ["root", "root"],
    ["empty", ""],
    ["65 characters", "a".repeat(65)],
    ["a space", "has space"],
    ["Chinese", "標題"],
    ["a number", 5],
  ])("rejects an id that is %s", (_, id) => {
    expect(
      errorsOf(
        validator.validatePage(
          page([{ type: "Leaf", props: { id, text: "葉" } }])
        )
      )
    ).toEqual([["content[0].props.id", "invalid_id"]]);
  });

  it("rejects a block without an id", () => {
    expect(
      errorsOf(validator.validatePage(page([{ type: "Leaf", props: {} }])))
    ).toEqual([["content[0].props.id", "invalid_id"]]);
  });

  it("rejects 33 levels of nesting", () => {
    expect(errorsOf(validator.validatePage(page([chain(33)])))).toEqual([
      [formatPathText(chainPath(33)), "too_deep"],
    ]);
  });

  it("stops at level 33 of a 30,000-level page without overflowing the stack", () => {
    // Spec §6.2 #7: no recursion over the page. Recursing into the whole
    // page, or copying it recursively, throws a RangeError at this depth.
    expect(chainPageJson(3)).toBe(JSON.stringify(page([chain(3)])));

    const json = chainPageJson(30_000);
    const expected = [[formatPathText(chainPath(33)), "too_deep"]];

    expect(new TextEncoder().encode(json).byteLength).toBeLessThan(
      DEFAULT_LIMITS.maxBytes
    );
    expect(errorsOf(validator.validatePageJson(json))).toEqual(expected);
    expect(errorsOf(validator.validatePage(JSON.parse(json)))).toEqual(
      expected
    );
  });

  it("rejects 5,001 blocks", () => {
    expect(errorsOf(validator.validatePage(page(leaves(5001))))).toEqual([
      ["content[5000]", "too_many_blocks"],
    ]);
  });

  it("rejects 2 MB + 1 byte", () => {
    const json = jsonOfBytes(2_097_153);

    expect(errorsOf(validator.validatePageJson(json))).toEqual([
      ["", "too_large"],
    ]);
    expect(
      errorsOf(validator.validatePageJson(new TextEncoder().encode(json)))
    ).toEqual([["", "too_large"]]);
  });

  it("rejects the legacy zones format", () => {
    expect(
      errorsOf(
        validator.validatePage(
          page([box("b")], { zones: { "b:content": [leaf("l")] } })
        )
      )
    ).toEqual([["zones", "legacy_zones"]]);
    expect(errorsOf(validator.validatePage(page([], { zones: [] })))).toEqual([
      ["zones", "invalid_shape"],
    ]);
  });

  it("rejects a block that the slot does not allow", () => {
    expect(
      errorsOf(
        validator.validatePage(
          page([kitchenSink("k", { content: [box("b")] })])
        )
      )
    ).toEqual([["content[0].props.content[0]", "not_allowed_here"]]);
    expect(
      errorsOf(
        validator.validatePage(page([pair("p", [[pair("q", [[], []])], []])]))
      )
    ).toEqual([["content[0].props.columns[0].content[0]", "not_allowed_here"]]);
  });

  it("requires alt text unless the image is decorative", () => {
    const withImage = (picture: unknown) =>
      errorsOf(validator.validatePage(page([kitchenSink("k", { picture })])));

    expect(withImage({ assetId: "a", alt: "", decorative: false })).toEqual([
      ["content[0].props.picture.alt", "alt_required"],
    ]);
    expect(withImage({ assetId: "a", alt: "   ", decorative: false })).toEqual([
      ["content[0].props.picture.alt", "alt_required"],
    ]);
    expect(withImage({ assetId: "a", alt: "", decorative: true })).toEqual([]);
  });

  it("reports the deliberately incomplete defaults at href and the image", () => {
    expect(
      errorsOf(
        validator.validatePage(
          page([{ type: "KitchenSink", props: { id: "k" } }])
        )
      )
    ).toEqual([
      ["content[0].props.href", "invalid_value"],
      ["content[0].props.picture.assetId", "invalid_value"],
      ["content[0].props.picture.alt", "alt_required"],
    ]);
  });

  it.each([
    ["null", null, [["", "invalid_shape"]]],
    ["an array", [], [["", "invalid_shape"]]],
    ["no root", { content: [] }, [["root", "invalid_shape"]]],
    [
      "an extra top-level key",
      { root: { props: {} }, content: [], extra: 1 },
      [["extra", "invalid_shape"]],
    ],
    [
      "an extra root key",
      { root: { props: {}, type: "root" }, content: [] },
      [["root.type", "invalid_shape"]],
    ],
    [
      "root without props",
      { root: {}, content: [] },
      [["root.props", "invalid_shape"]],
    ],
    ["no content", { root: { props: {} } }, [["content", "invalid_shape"]]],
    [
      "content that is not an array",
      { root: { props: {} }, content: {} },
      [["content", "invalid_shape"]],
    ],
    [
      "a block that is not an object",
      page([5]),
      [["content[0]", "invalid_shape"]],
    ],
    [
      "an extra block key",
      page([{ ...leaf("a"), zones: {} }]),
      [["content[0].zones", "invalid_shape"]],
    ],
    [
      "a block without type",
      page([{ props: { id: "a" } }]),
      [["content[0].type", "invalid_shape"]],
    ],
    [
      "a block without props",
      page([{ type: "Leaf" }]),
      [["content[0].props", "invalid_shape"]],
    ],
    [
      "a slot item that is not a block",
      page([box("b", [5])]),
      [["content[0].props.content[0]", "invalid_shape"]],
    ],
    [
      "a slot that is not an array",
      page([{ type: "Box", props: { id: "b", content: "x" } }]),
      [["content[0].props.content", "invalid_value"]],
    ],
  ])("rejects %s", (_, input, expected) => {
    expect(errorsOf(validator.validatePage(input))).toEqual(expected);
  });

  it("rejects input that is not JSON", () => {
    expect(errorsOf(validator.validatePageJson("{"))).toEqual([
      ["", "invalid_json"],
    ]);
    expect(
      errorsOf(validator.validatePageJson(new Uint8Array([0x7b, 0xff, 0x7d])))
    ).toEqual([["", "invalid_json"]]);
    expect(
      errorsOf(validator.validatePageJson(5 as unknown as string))
    ).toEqual([["", "invalid_json"]]);
  });

  it("ignores a leading byte order mark, in a string as in bytes", () => {
    const encoder = new TextEncoder();
    const json = `﻿${JSON.stringify(page([leaf("l")]))}`;
    const twice = `﻿${json}`;

    expect(errorsOf(validator.validatePageJson(json))).toEqual([]);
    expect(errorsOf(validator.validatePageJson(encoder.encode(json)))).toEqual(
      []
    );
    // Only one, at the start
    expect(errorsOf(validator.validatePageJson(twice))).toEqual([
      ["", "invalid_json"],
    ]);
    expect(errorsOf(validator.validatePageJson(encoder.encode(twice)))).toEqual(
      [["", "invalid_json"]]
    );
  });

  it("collects every error in the order of spec §6.2", () => {
    expect(
      errorsOf(
        validator.validatePage({
          root: { props: { title: "" } },
          content: [
            kitchenSink("k", { title: "" }),
            { type: "Unknown", props: { id: "u" } },
            leaf("root"),
          ],
          zones: { a: [] },
        })
      )
    ).toEqual([
      ["zones", "legacy_zones"],
      ["content[1].type", "unknown_type"],
      ["content[2].props.id", "invalid_id"],
      ["content[0].props.title", "invalid_value"],
      ["root.props.title", "invalid_value"],
    ]);
  });

  it("stops at maxIssues and truncates", () => {
    const result = validator.validatePage(page(leaves(150, "")));

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toHaveLength(100);
    expect(result.errors[0].pathText).toBe("content[0].props.text");
    expect(result.errors[99].pathText).toBe("content[99].props.text");

    const small = createPageValidator({
      blocks: testBlocks,
      root: testRoot,
      limits: { maxIssues: 3 },
    });

    expect(errorsOf(small.validatePage(page(leaves(10, ""))))).toHaveLength(3);
  });
});

describe("long arrays", () => {
  /** An array whose items are made when read, with the indexes that were read. */
  const lazyArray = (length: number, item: (index: number) => unknown) => {
    const read = new Set<number>();
    const items = new Proxy(new Array<unknown>(length).fill(null), {
      get(target, key, receiver) {
        if (typeof key === "string" && /^\d+$/.test(key)) {
          read.add(Number(key));

          return item(Number(key));
        }

        return Reflect.get(target, key, receiver);
      },
    });

    return { items, read };
  };

  it("reads only the blocks that it reports on", () => {
    const content = lazyArray(1_000_000, () => 1);
    const slot = lazyArray(1_000_000, () => 1);
    const top = errorsOf(validator.validatePage(page(content.items)));
    const inSlot = errorsOf(
      validator.validatePage(page([box("b", slot.items)]))
    );

    expect(top).toHaveLength(100);
    expect(top[99]).toEqual(["content[99]", "invalid_shape"]);
    expect(content.read.size).toBe(100);
    expect(inSlot).toHaveLength(100);
    expect(inSlot[99]).toEqual([
      "content[0].props.content[99]",
      "invalid_shape",
    ]);
    expect(slot.read.size).toBe(100);
  });

  it("stops at the block over maxBlocks without reading the rest of the slot", () => {
    const slot = lazyArray(1_000_000, (index) => leaf(`l${index}`));

    // The Box is the first block, so its child 4999 is block 5,001
    expect(
      errorsOf(validator.validatePage(page([box("b", slot.items)])))
    ).toEqual([["content[0].props.content[4999]", "too_many_blocks"]]);
    expect(slot.read.size).toBe(5000);
  });

  it("checks a list only up to one item past its maximum", () => {
    const items = lazyArray(1_000_000, () => 0);
    const result = validator.validatePage(
      page([kitchenSink("k", { items: items.items })])
    );
    const six = validator.validatePage(
      page([
        kitchenSink("k", {
          items: Array.from({ length: 6 }, () => ({ label: "一" })),
        }),
      ])
    );

    expect(errorsOf(result)).toEqual([
      ...[0, 1, 2, 3, 4, 5].map((index) => [
        `content[0].props.items[${index}]`,
        "invalid_value",
      ]),
      ["content[0].props.items", "invalid_value"],
    ]);
    expect(items.read.size).toBe(6);
    // The message still names the maximum of 5 items
    expect(errorsOf(six)).toEqual([
      ["content[0].props.items", "invalid_value"],
    ]);
    expect(!result.ok && result.errors[6].message).toBe(
      !six.ok && six.errors[0].message
    );
  });

  it("walks the slots in a list only up to one item past its maximum", () => {
    const columns = Array.from({ length: 10 }, (_, index) => [
      { type: "Ghost", props: { id: `g${index}` } },
    ]);

    expect(
      errorsOf(validator.validatePage(page([pair("p", columns)])))
    ).toEqual([
      ...[0, 1, 2, 3].map((index) => [
        `content[0].props.columns[${index}].content[0].type`,
        "unknown_type",
      ]),
      ["content[0].props.columns", "invalid_value"],
    ]);
  });

  it("checks a 2 MB list of a million items like a short one", () => {
    const json = JSON.stringify(
      page([kitchenSink("k", { items: [] })])
    ).replace('"items":[]', `"items":[${"0,".repeat(999_999)}0]`);

    expect(new TextEncoder().encode(json).byteLength).toBeLessThan(
      DEFAULT_LIMITS.maxBytes
    );
    expect(errorsOf(validator.validatePageJson(json))).toHaveLength(7);
  });
});

describe("Review Focus", () => {
  it("measures the 2 MB limit in UTF-8 bytes", () => {
    const encoder = new TextEncoder();
    const atLimit = jsonOfBytes(2_097_152);
    const over = jsonOfBytes(2_097_153);

    expect(encoder.encode(atLimit).byteLength).toBe(2_097_152);
    expect(atLimit.length).toBeLessThan(800_000);
    // Not too large: it fails later, because the title is too long
    expect(errorsOf(validator.validatePageJson(atLimit))).toEqual([
      ["root.props.title", "invalid_value"],
    ]);
    expect(
      errorsOf(validator.validatePageJson(encoder.encode(atLimit)))
    ).toEqual([["root.props.title", "invalid_value"]]);
    expect(errorsOf(validator.validatePageJson(over))).toEqual([
      ["", "too_large"],
    ]);

    // About 700,000 Chinese characters: fewer than 2,097,152 characters, but
    // about 2.1 MB in UTF-8
    const chinese = JSON.stringify(page([], {})).replace(
      "測試頁",
      "中".repeat(700_000)
    );

    expect(chinese.length).toBeLessThan(2_097_152);
    expect(errorsOf(validator.validatePageJson(chinese))).toEqual([
      ["", "too_large"],
    ]);

    // Text limits count characters, not bytes
    expect(
      errorsOf(
        validator.validatePage(
          page([kitchenSink("k", { title: "慈".repeat(40) })])
        )
      )
    ).toEqual([]);
    expect(
      errorsOf(
        validator.validatePage(
          page([kitchenSink("k", { title: "慈".repeat(41) })])
        )
      )
    ).toEqual([["content[0].props.title", "invalid_value"]]);
  });

  it("rejects prototype keys at every level without polluting Object.prototype", () => {
    const prototypeKeys = Object.getOwnPropertyNames(Object.prototype).sort();
    const json = `{
      "root": { "props": { "title": "頁", "__proto__": { "polluted": "root" } } },
      "content": [
        {
          "type": "KitchenSink",
          "props": {
            "id": "k",
            "href": "/x",
            "__proto__": { "polluted": "props" },
            "items": [{ "label": "一", "__proto__": { "polluted": "item" } }],
            "group": { "caption": "", "level": 0, "prototype": { "polluted": "group" } },
            "picture": { "assetId": "a", "alt": "b", "decorative": false, "constructor": { "polluted": "image" } },
            "content": [
              { "type": "Leaf", "props": { "id": "l", "text": "子", "constructor": { "prototype": { "polluted": "child" } } } }
            ]
          }
        }
      ]
    }`;
    const result = validator.validatePageJson(json);

    expect(errorsOf(result).sort()).toEqual(
      [
        ["content[0].props.__proto__", "unknown_prop"],
        ["content[0].props.items[0].__proto__", "unknown_prop"],
        ["content[0].props.group.prototype", "unknown_prop"],
        ["content[0].props.picture.constructor", "unknown_prop"],
        ["content[0].props.content[0].props.constructor", "unknown_prop"],
        ["root.props.__proto__", "unknown_prop"],
      ].sort()
    );
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    expect(Object.getOwnPropertyNames(Object.prototype).sort()).toEqual(
      prototypeKeys
    );

    // Inside rich text the keys are cleaned away instead
    const cleaned = accepted(
      validator.validatePageJson(
        `{"root":{"props":{}},"content":[{"type":"KitchenSink","props":{"id":"k","href":"/x","picture":{"assetId":"a","alt":"b","decorative":false},"body":{"type":"doc","__proto__":{"polluted":1},"content":[{"type":"paragraph","constructor":{"polluted":2},"content":[{"type":"text","text":"字"}]}]}}}]}`
      )
    );

    expect(cleaned.notices.map((notice) => notice.pathText)).toEqual([
      "content[0].props.body",
    ]);
    expect(JSON.stringify(cleaned.data)).not.toMatch(
      /__proto__|constructor|polluted/
    );
    expect(Object.getPrototypeOf(cleaned.data.content[0].props)).toBe(
      Object.prototype
    );
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });
});
