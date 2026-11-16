import * as z from "zod";
import { defineBlockSpec } from "../define";
import { slot } from "../helpers";
import { exampleToPageData } from "../page-data";
import {
  kitchenSinkSpec,
  leafSpec,
  pairSpec,
} from "../__fixtures__/test-specs";

describe("exampleToPageData", () => {
  it("wraps an example in a page and names the block after its example", () => {
    expect(exampleToPageData(leafSpec, 0)).toEqual({
      root: { props: {} },
      content: [{ type: "Leaf", props: { id: "Leaf-ex1" } }],
    });
  });

  it("names slot children by their path inside array items", () => {
    expect(exampleToPageData(pairSpec, 0).content).toEqual([
      {
        type: "Pair",
        props: {
          id: "Pair-ex1",
          columns: [
            {
              content: [
                {
                  type: "Leaf",
                  props: { id: "Pair-ex1-columns-0-content-0", text: "左" },
                },
              ],
            },
            {
              content: [
                {
                  type: "Leaf",
                  props: { id: "Pair-ex1-columns-1-content-0", text: "右" },
                },
              ],
            },
          ],
        },
      },
    ]);
  });

  it("names nested children from their parent's id and replaces given ids", () => {
    const nestSpec = defineBlockSpec({
      type: "Nest",
      label: "巢",
      category: "測試",
      description: "",
      version: 1,
      props: z.strictObject({
        content: slot({ allow: ["Box", "Leaf"] }).meta({ title: "內容" }),
      }),
      examples: [
        { name: "空", props: {} },
        {
          name: "兩層",
          props: {
            content: [
              { type: "Leaf", props: { id: "given", text: "一" } },
              {
                type: "Box",
                props: { content: [{ type: "Leaf", props: { text: "深" } }] },
              },
            ],
          },
        },
      ],
    });

    expect(exampleToPageData(nestSpec, 1).content[0]).toEqual({
      type: "Nest",
      props: {
        id: "Nest-ex2",
        content: [
          { type: "Leaf", props: { id: "Nest-ex2-content-0", text: "一" } },
          {
            type: "Box",
            props: {
              id: "Nest-ex2-content-1",
              content: [
                {
                  type: "Leaf",
                  props: { id: "Nest-ex2-content-1-content-0", text: "深" },
                },
              ],
            },
          },
        ],
      },
    });
  });

  it("copies the example and the root props", () => {
    const rootProps = { title: "頁" };
    const page = exampleToPageData(kitchenSinkSpec, 0, rootProps);
    const props = page.content[0].props as unknown as {
      picture: { alt: string };
      content: { props: { text: string } }[];
    };

    props.picture.alt = "改過";
    props.content[0].props.text = "改過";
    page.root.props.title = "改過";

    expect(kitchenSinkSpec.examples[0].props.picture).toEqual({
      assetId: "demo-1",
      alt: "示意圖",
      decorative: false,
    });
    expect(kitchenSinkSpec.examples[0].props.content).toEqual([
      { type: "Leaf", props: { text: "子" } },
    ]);
    expect(rootProps).toEqual({ title: "頁" });
    expect(props).toMatchObject({ id: "KitchenSink-ex1", href: "/register" });
  });

  it("throws for a missing example", () => {
    expect(() => exampleToPageData(leafSpec, 1)).toThrow(RangeError);
    expect(() => exampleToPageData(leafSpec, -1)).toThrow(
      "Leaf has no example at index -1"
    );
  });
});
