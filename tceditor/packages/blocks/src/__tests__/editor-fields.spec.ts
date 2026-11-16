import type { ArrayField } from "@tzuchi/tceditor";
import { demoAssetSource } from "../demo-assets";
import { createEditorConfig } from "../editor-config";
import { blockSpecs } from "../specs";

const config = createEditorConfig({ assets: demoAssetSource });

/** JSON with every function (render, getItemSummary, the image picker) as "[Function]". */
const asJson = (value: unknown): unknown =>
  JSON.parse(
    JSON.stringify(value, (_key, item: unknown) =>
      typeof item === "function" ? "[Function]" : item
    )
  );

/** The getItemSummary of a list field, applied to the first default item. */
const firstItemSummary = (type: string, name: string) => {
  const { fields, defaultProps } = config.components[type];
  const items: unknown = defaultProps?.[name];

  if (fields?.[name]?.type !== "array" || !Array.isArray(items)) {
    throw new TypeError(`${type}.${name} is not a list field`);
  }

  const field = fields[name] as ArrayField;

  return field.getItemSummary?.(items[0], 0);
};

describe("editor fields of every block (spec §13.1)", () => {
  it.each(blockSpecs.map((spec) => spec.type))("%s", (type) => {
    const { fields, defaultProps } = config.components[type];

    expect(asJson({ fields, defaultProps })).toMatchSnapshot();
  });

  it("page root", () => {
    const { fields, defaultProps } = config.root ?? {};

    expect(asJson({ fields, defaultProps })).toMatchSnapshot();
  });

  it("summarises list items with the x-item-label templates", () => {
    expect(firstItemSummary("TagList", "tags")).toBe("志工");
    expect(firstItemSummary("Columns", "columns")).toBe("第 1 欄");
  });
});
