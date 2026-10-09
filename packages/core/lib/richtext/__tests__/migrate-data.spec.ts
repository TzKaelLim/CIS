/** @jest-environment node */
import type { Config, Data } from "../../../types";
import { migrateRichTextInData } from "../migrate-data";

const json = (text: string, tag: "p" | "h2" = "p") => ({
  type: "doc",
  content: [
    tag === "p"
      ? {
          type: "paragraph",
          attrs: { textAlign: null },
          content: [{ type: "text", text }],
        }
      : {
          type: "heading",
          attrs: { textAlign: null, level: 2 },
          content: [{ type: "text", text }],
        },
  ],
});

const config: Config = {
  root: {
    fields: { intro: { type: "richtext" }, title: { type: "text" } },
  },
  components: {
    Card: {
      fields: {
        body: { type: "richtext" },
        caption: { type: "text" },
        items: {
          type: "array",
          arrayFields: { text: { type: "richtext" }, label: { type: "text" } },
        },
        meta: {
          type: "object",
          objectFields: { note: { type: "richtext" } },
        },
        children: { type: "slot" },
      },
      render: () => null,
    },
    Plain: {
      fields: { html: { type: "textarea" } },
      render: () => null,
    },
    Limited: {
      fields: {
        body: { type: "richtext", options: { bold: false, heading: false } },
      },
      render: () => null,
    },
  },
};

const data: Data = {
  root: { props: { intro: "<h2>Intro</h2>", title: "<p>not richtext</p>" } },
  content: [
    {
      type: "Card",
      props: {
        id: "card-1",
        body: "<p>Body</p>",
        caption: "<p>caption stays</p>",
        items: [{ text: "<p>Item</p>", label: "<p>label stays</p>" }],
        meta: { note: "<p>Note</p>" },
        children: [
          {
            type: "Card",
            props: { id: "card-2", body: "<p>Nested</p>" },
          },
        ],
      },
    },
    { type: "Plain", props: { id: "plain-1", html: "<p>textarea stays</p>" } },
    {
      type: "Unknown",
      props: { id: "unknown-1", body: "<p>unknown stays</p>" },
    },
    { type: "constructor", props: { id: "proto-1", body: "<p>stays</p>" } },
  ],
  zones: {
    "card-1:legacy": [
      { type: "Card", props: { id: "card-3", body: "<p>In a zone</p>" } },
    ],
  },
};

describe("migrateRichTextInData", () => {
  it("converts richtext fields everywhere and leaves everything else alone", () => {
    expect(migrateRichTextInData(data, config)).toEqual({
      root: {
        props: { intro: json("Intro", "h2"), title: "<p>not richtext</p>" },
      },
      content: [
        {
          type: "Card",
          props: {
            id: "card-1",
            body: json("Body"),
            caption: "<p>caption stays</p>",
            items: [{ text: json("Item"), label: "<p>label stays</p>" }],
            meta: { note: json("Note") },
            children: [
              { type: "Card", props: { id: "card-2", body: json("Nested") } },
            ],
          },
        },
        {
          type: "Plain",
          props: { id: "plain-1", html: "<p>textarea stays</p>" },
        },
        {
          type: "Unknown",
          props: { id: "unknown-1", body: "<p>unknown stays</p>" },
        },
        { type: "constructor", props: { id: "proto-1", body: "<p>stays</p>" } },
      ],
      zones: {
        "card-1:legacy": [
          { type: "Card", props: { id: "card-3", body: json("In a zone") } },
        ],
      },
    });
  });

  it("does not modify its input", () => {
    const before = JSON.stringify(data);

    migrateRichTextInData(data, config);

    expect(JSON.stringify(data)).toBe(before);
  });

  it("leaves JSON values as they are", () => {
    const migrated = migrateRichTextInData(
      {
        root: { props: {} },
        content: [{ type: "Card", props: { id: "card-1", body: json("x") } }],
      },
      config
    );

    expect(migrated.content[0].props.body).toEqual(json("x"));
  });

  it("parses each field with its own options", () => {
    const migrated = migrateRichTextInData(
      {
        root: { props: {} },
        content: [
          {
            type: "Limited",
            props: {
              id: "limited-1",
              body: "<h2>Title</h2><p><strong>bold</strong> text</p>",
            },
          },
        ],
      },
      config
    );

    expect(migrated.content[0].props.body).toEqual({
      type: "doc",
      content: [json("Title").content[0], json("bold text").content[0]],
    });
  });

  it("keeps a zone named __proto__", () => {
    const migrated = migrateRichTextInData(
      {
        root: { props: {} },
        content: [],
        zones: JSON.parse(
          '{"__proto__": [{"type": "Card", "props": {"id": "card-4", "body": "<p>Proto</p>"}}]}'
        ),
      },
      config
    );

    expect(Object.keys(migrated.zones ?? {})).toEqual(["__proto__"]);
    expect(
      Object.getOwnPropertyDescriptor(migrated.zones, "__proto__")?.value
    ).toEqual([{ type: "Card", props: { id: "card-4", body: json("Proto") } }]);
  });

  it("does not add props that were missing", () => {
    const migrated = migrateRichTextInData(
      { root: {}, content: [{ type: "Card", props: { id: "card-1" } }] },
      config
    );

    expect(migrated.content[0].props).toStrictEqual({ id: "card-1" });
    expect(migrated.root).toStrictEqual({});
    expect(migrated).not.toHaveProperty("zones");
  });
});
