/** @jest-environment node */
import type { ComponentData, Config, Data, Fields } from "../../../types";
import {
  migrateRichTextInData,
  type MigrateRichTextOptions,
} from "../migrate-data";

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

describe("migrateRichTextInData with options.getFields", () => {
  // Dynamic shows its richtext field "extra" only through resolveFields, so
  // the static fields in config do not list it
  const richFields: Fields = {
    mode: { type: "text" },
    extra: { type: "richtext" },
  };

  const dynamicConfig: Config = {
    ...config,
    components: {
      ...config.components,
      Dynamic: {
        fields: { mode: { type: "text" } },
        resolveFields: (data) =>
          data.props.mode === "rich" ? richFields : { mode: { type: "text" } },
        render: () => null,
      },
    },
  };

  // The synchronous counterpart of the resolveFields functions above
  const getFields: MigrateRichTextOptions["getFields"] = (item, { isRoot }) => {
    if (isRoot) return { ...config.root?.fields, outro: { type: "richtext" } };

    const component = item as ComponentData;

    return component.type === "Dynamic" && component.props.mode === "rich"
      ? richFields
      : undefined;
  };

  const dynamicData: Data = {
    root: { props: { intro: "<p>Intro</p>", outro: "<p>Outro</p>" } },
    content: [
      {
        type: "Dynamic",
        props: { id: "dynamic-1", mode: "rich", extra: "<p>Extra</p>" },
      },
      {
        type: "Dynamic",
        props: { id: "dynamic-2", mode: "plain", extra: "<p>plain stays</p>" },
      },
      {
        type: "Card",
        props: {
          id: "card-1",
          body: "<p>Body</p>",
          children: [
            {
              type: "Dynamic",
              props: { id: "dynamic-3", mode: "rich", extra: "<p>Nested</p>" },
            },
          ],
        },
      },
    ],
    zones: {
      "card-1:legacy": [
        {
          type: "Dynamic",
          props: { id: "dynamic-4", mode: "rich", extra: "<p>In a zone</p>" },
        },
      ],
    },
  };

  it("skips fields that only resolveFields adds when getFields is not given", () => {
    const migrated = migrateRichTextInData(dynamicData, dynamicConfig);

    expect(migrated.root.props?.intro).toEqual(json("Intro"));
    expect(migrated.root.props?.outro).toBe("<p>Outro</p>");
    expect(migrated.content[0].props.extra).toBe("<p>Extra</p>");
  });

  it("converts the fields that getFields returns in the root, slots and zones", () => {
    expect(
      migrateRichTextInData(dynamicData, dynamicConfig, { getFields })
    ).toEqual({
      root: { props: { intro: json("Intro"), outro: json("Outro") } },
      content: [
        {
          type: "Dynamic",
          props: { id: "dynamic-1", mode: "rich", extra: json("Extra") },
        },
        {
          type: "Dynamic",
          props: {
            id: "dynamic-2",
            mode: "plain",
            extra: "<p>plain stays</p>",
          },
        },
        {
          type: "Card",
          props: {
            id: "card-1",
            body: json("Body"),
            children: [
              {
                type: "Dynamic",
                props: { id: "dynamic-3", mode: "rich", extra: json("Nested") },
              },
            ],
          },
        },
      ],
      zones: {
        "card-1:legacy": [
          {
            type: "Dynamic",
            props: { id: "dynamic-4", mode: "rich", extra: json("In a zone") },
          },
        ],
      },
    });
  });

  it("calls getFields once for the root and once for every component", () => {
    const calls: string[] = [];

    migrateRichTextInData(
      {
        ...dynamicData,
        // A type that config does not list, and that is an Object.prototype
        // member, is passed to getFields like any other
        content: [
          ...dynamicData.content,
          { type: "constructor", props: { id: "proto-1" } },
        ],
      },
      dynamicConfig,
      {
        getFields: (item, { isRoot }) => {
          calls.push(isRoot ? "root" : (item as ComponentData).props.id);
          return undefined;
        },
      }
    );

    expect(calls).toEqual([
      "root",
      "dynamic-1",
      "dynamic-2",
      "card-1",
      "dynamic-3",
      "proto-1",
      "dynamic-4",
    ]);
  });

  it("uses what getFields returns instead of the static fields", () => {
    const migrated = migrateRichTextInData(
      {
        root: { props: { intro: "<p>Intro</p>" } },
        content: [
          { type: "Card", props: { id: "card-1", body: "<p>Body</p>" } },
        ],
      },
      config,
      { getFields: () => ({}) }
    );

    expect(migrated.root.props?.intro).toBe("<p>Intro</p>");
    expect(migrated.content[0].props.body).toBe("<p>Body</p>");
  });

  it("throws when getFields returns a promise", () => {
    // What a caller gets by wrapping an async resolveFields; the cast stands
    // for a plain JS caller, since the type only allows synchronous results
    const getFieldsAsync = (() =>
      Promise.resolve(
        richFields
      )) as unknown as MigrateRichTextOptions["getFields"];

    expect(() =>
      migrateRichTextInData(dynamicData, dynamicConfig, {
        getFields: getFieldsAsync,
      })
    ).toThrow("options.getFields must be synchronous");
  });
});
