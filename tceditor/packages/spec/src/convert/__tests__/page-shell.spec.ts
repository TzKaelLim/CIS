import Ajv from "ajv";
import * as z from "zod";
import { defineBlockSpec } from "../../define";
import { slot } from "../../helpers";
import { exampleToPageData } from "../../page-data";
import {
  boxSpec,
  kitchenSinkSpec,
  leafSpec,
  pairSpec,
  testBlocks,
} from "../../__fixtures__/test-specs";
import { buildPageShellSchema } from "../page-shell";

/** 在任意 JSON 值裡找出所有物件，交給 visit。 */
function eachObject(
  value: unknown,
  visit: (object: Record<string, unknown>) => void
): void {
  if (Array.isArray(value)) {
    value.forEach((item) => eachObject(item, visit));
  } else if (typeof value === "object" && value !== null) {
    visit(value as Record<string, unknown>);
    Object.values(value).forEach((child) => eachObject(child, visit));
  }
}

const NODE_LIST = { $ref: "#/definitions/nodeList" };

describe("buildPageShellSchema", () => {
  const shell = buildPageShellSchema({ blocks: testBlocks });
  const ajv = new Ajv({ strict: true, allErrors: true });
  const validate = ajv.compile(shell);

  const validPage = () => ({
    root: { props: { title: "首頁" } },
    content: [
      ...exampleToPageData(kitchenSinkSpec, 0).content,
      ...exampleToPageData(boxSpec, 0).content,
      ...exampleToPageData(leafSpec, 0).content,
      ...exampleToPageData(pairSpec, 0).content,
    ],
    zones: {},
  });

  const errorsOf = (page: unknown) => {
    expect(validate(page)).toBe(false);
    return (validate.errors ?? []).map(
      (error) => `${error.instancePath} ${error.keyword}`
    );
  };

  it("is the draft-07 shell generalised from the registered slot names", () => {
    expect(shell).toEqual({
      $schema: "http://json-schema.org/draft-07/schema#",
      title: "tceditor page shell",
      type: "object",
      required: ["root", "content"],
      additionalProperties: false,
      properties: {
        root: {
          type: "object",
          required: ["props"],
          additionalProperties: false,
          properties: { props: { type: "object" } },
        },
        content: NODE_LIST,
        zones: { type: "object", maxProperties: 0 },
      },
      definitions: {
        nodeList: { type: "array", items: { $ref: "#/definitions/node" } },
        node: {
          type: "object",
          required: ["type", "props"],
          additionalProperties: false,
          properties: {
            type: {
              type: "string",
              enum: ["KitchenSink", "Box", "Leaf", "Pair"],
            },
            props: { $ref: "#/definitions/props" },
          },
        },
        props: {
          type: "object",
          required: ["id"],
          additionalProperties: true,
          properties: {
            id: {
              type: "string",
              pattern: "^[A-Za-z0-9_-]{1,64}$",
              not: { const: "root" },
            },
            columns: {
              type: "array",
              items: { $ref: "#/definitions/item_columns" },
            },
            content: NODE_LIST,
          },
        },
        item_columns: {
          type: "object",
          additionalProperties: true,
          properties: { content: NODE_LIST },
        },
      },
    });
  });

  it("uses no combinators and keeps every $ref alone in its object", () => {
    eachObject(shell, (object) => {
      for (const keyword of ["oneOf", "anyOf", "allOf"]) {
        expect(keyword in object).toBe(false);
      }
      if ("$ref" in object) expect(Object.keys(object)).toEqual(["$ref"]);
    });
  });

  it("accepts a valid page with or without empty zones", () => {
    expect(validate(validPage())).toBe(true);
    const { zones: _zones, ...withoutZones } = validPage();
    expect(validate(withoutZones)).toBe(true);
  });

  it("rejects unknown block types at every level", () => {
    const page = validPage();
    page.content[0].type = "Nope";
    expect(errorsOf(page)).toEqual(["/content/0/type enum"]);

    const proto = validPage();
    proto.content[1].type = "constructor";
    expect(errorsOf(proto)).toEqual(["/content/1/type enum"]);

    const nested = validPage();
    const columns = nested.content[3].props.columns as {
      content: { type: string }[];
    }[];
    columns[0].content[0].type = "__proto__";
    expect(errorsOf(nested)).toEqual([
      "/content/3/props/columns/0/content/0/type enum",
    ]);

    const inBox = validPage();
    (inBox.content[1].props.content as { type: string }[])[0].type = "Nope";
    expect(errorsOf(inBox)).toEqual(["/content/1/props/content/0/type enum"]);
  });

  it("rejects bad, reserved and missing ids", () => {
    const bad = validPage();
    bad.content[0].props.id = "bad id";
    expect(errorsOf(bad)).toEqual(["/content/0/props/id pattern"]);

    const reserved = validPage();
    reserved.content[0].props.id = "root";
    expect(errorsOf(reserved)).toEqual(["/content/0/props/id not"]);

    const missing = validPage();
    delete (missing.content[2].props as { id?: string }).id;
    expect(errorsOf(missing)).toEqual(["/content/2/props required"]);
  });

  it("rejects legacy zones, extra top-level keys and extra node keys", () => {
    expect(
      errorsOf({ ...validPage(), zones: { "Box-ex1:content": [] } })
    ).toEqual(["/zones maxProperties"]);
    expect(errorsOf({ ...validPage(), extra: 1 })).toEqual([
      " additionalProperties",
    ]);
    const readOnly = validPage();
    Object.assign(readOnly.content[0], { readOnly: {} });
    expect(errorsOf(readOnly)).toEqual(["/content/0 additionalProperties"]);
    expect(
      errorsOf({ ...validPage(), root: { props: {}, title: "x" } })
    ).toEqual(["/root additionalProperties"]);
    expect(errorsOf({ root: { props: {} } })).toEqual([" required"]);
  });

  it("covers every slot name of the registered blocks", () => {
    const panesSpec = defineBlockSpec({
      type: "Panes",
      label: "窗格",
      category: "測試",
      description: "直接欄位與清單項目各有一個放置區。",
      version: 1,
      props: z.strictObject({
        aside: slot({ allow: ["Leaf"] }).meta({ title: "側欄" }),
        panes: z
          .array(
            z.strictObject({
              main: slot({ allow: ["Leaf"] }).meta({ title: "主要" }),
              extra: slot({ allow: ["Leaf"] }).meta({ title: "附加" }),
            })
          )
          .default(() => [])
          .meta({ title: "窗格" }),
      }),
      examples: [{ name: "預設", props: {} }],
    });
    const generalised = buildPageShellSchema({
      blocks: [leafSpec, panesSpec],
    });
    const definitions = generalised.definitions as Record<
      string,
      { properties: Record<string, unknown> }
    >;
    expect(definitions.props.properties).toEqual({
      id: {
        type: "string",
        pattern: "^[A-Za-z0-9_-]{1,64}$",
        not: { const: "root" },
      },
      aside: NODE_LIST,
      panes: { type: "array", items: { $ref: "#/definitions/item_panes" } },
    });
    expect(definitions.item_panes.properties).toEqual({
      extra: NODE_LIST,
      main: NODE_LIST,
    });
    expect(new Ajv({ strict: true }).compile(generalised)).toBeInstanceOf(
      Function
    );
  });

  it("refuses slot names that mean different structures (spec §4.3 rule 8)", () => {
    const listSpec = defineBlockSpec({
      type: "ListOfSlots",
      label: "清單",
      category: "測試",
      description: "把 content 用成清單。",
      version: 1,
      props: z.strictObject({
        content: z
          .array(
            z.strictObject({
              inner: slot({ allow: ["Leaf"] }).meta({ title: "內" }),
            })
          )
          .default(() => [])
          .meta({ title: "內容" }),
      }),
      examples: [{ name: "預設", props: {} }],
    });
    expect(() =>
      buildPageShellSchema({ blocks: [boxSpec, leafSpec, listSpec] })
    ).toThrow('"content" is a slot in one block and a list of slots');
  });

  it("refuses a field that is not a slot but has a slot's name", () => {
    const noteSpec = defineBlockSpec({
      type: "Note",
      label: "備註",
      category: "測試",
      description: "把 content 用成文字。",
      version: 1,
      props: z.strictObject({
        content: z.string().default("").meta({ title: "內容" }),
      }),
      examples: [{ name: "預設", props: {} }],
    });
    expect(() =>
      buildPageShellSchema({ blocks: [boxSpec, leafSpec, noteSpec] })
    ).toThrow('Note.content is not a slot, but another block uses "content"');

    const tagsSpec = defineBlockSpec({
      type: "Tags",
      label: "標籤",
      category: "測試",
      description: "把 columns 用成字串清單。",
      version: 1,
      props: z.strictObject({
        columns: z
          .array(z.string())
          .default(() => [])
          .meta({ title: "標籤" }),
      }),
      examples: [{ name: "預設", props: {} }],
    });
    expect(() =>
      buildPageShellSchema({ blocks: [leafSpec, pairSpec, tagsSpec] })
    ).toThrow("Tags.columns is not a list of objects, but another block");

    const rowsSpec = defineBlockSpec({
      type: "Rows",
      label: "列",
      category: "測試",
      description: "清單項目的 content 是文字。",
      version: 1,
      props: z.strictObject({
        columns: z
          .array(
            z.strictObject({
              content: z.string().default("").meta({ title: "內容" }),
            })
          )
          .default(() => [])
          .meta({ title: "列" }),
      }),
      examples: [{ name: "預設", props: {} }],
    });
    expect(() =>
      buildPageShellSchema({ blocks: [leafSpec, pairSpec, rowsSpec] })
    ).toThrow("Rows.columns[].content is not a slot, but another block uses");
  });

  it("refuses a slot nested in a group", () => {
    const groupSpec = defineBlockSpec({
      type: "Grouped",
      label: "群組",
      category: "測試",
      description: "放置區放在群組裡。",
      version: 1,
      props: z.strictObject({
        group: z
          .strictObject({
            inner: slot({ allow: ["Leaf"] }).meta({ title: "內" }),
          })
          .default(() => ({ inner: [] }))
          .meta({ title: "群組" }),
      }),
      examples: [{ name: "預設", props: {} }],
    });
    expect(() =>
      buildPageShellSchema({ blocks: [leafSpec, groupSpec] })
    ).toThrow(/Grouped has a slot at/);
  });
});
