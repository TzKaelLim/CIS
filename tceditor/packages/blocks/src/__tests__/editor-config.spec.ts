/** @jest-environment node */
import type { Config, CustomField } from "@tzuchi/tceditor";
import { toDefaultProps } from "@tzuchi/tceditor-spec";
import type { ImageValue } from "@tzuchi/tceditor-spec";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { demoAssetSource } from "../demo-assets";
import { createEditorConfig, editorCategories } from "../editor-config";
import { createRenderConfig } from "../render-config";
import { CATEGORIES, blockSpecs, pageRootSpec } from "../specs";

const editorConfig = createEditorConfig({ assets: demoAssetSource });
const renderConfig = createRenderConfig({ assets: demoAssetSource });
const blockCases = blockSpecs.map((spec) => [spec.type, spec] as const);

/** Server-renders a config's image field widget with an empty value. */
function imageWidget(config: Config): string {
  const field = config.components.Image.fields?.image as
    | CustomField<ImageValue>
    | undefined;
  if (field?.type !== "custom") throw new Error("expected a custom field");
  return renderToStaticMarkup(
    createElement(field.render, {
      field,
      name: "image",
      id: "image",
      value: { assetId: "", alt: "", decorative: false },
      onChange: () => {},
    })
  );
}

describe("createRenderConfig and createEditorConfig", () => {
  it("register every block of blockSpecs, in order", () => {
    const types = blockSpecs.map((spec) => spec.type);
    expect(Object.keys(renderConfig.components)).toEqual(types);
    expect(Object.keys(editorConfig.components)).toEqual(types);
  });

  it.each(blockCases)(
    "%s: fields cover exactly the spec's props, with its label and defaults",
    (type, spec) => {
      const component = editorConfig.components[type];
      expect(component.label).toBe(spec.label);
      expect(Object.keys(component.fields ?? {}).sort()).toEqual(
        Object.keys(spec.props.shape).sort()
      );
      expect(component.defaultProps).toEqual(toDefaultProps(spec));
      expect(renderConfig.components[type].label).toBe(spec.label);
    }
  );

  it("uses the image picker for the image field", () => {
    expect(editorConfig.components.Image.fields?.image?.label).toBe("圖片");
    const picker = imageWidget(editorConfig);
    expect(picker).toContain("正在載入圖片…");
    expect(picker).toContain("替代文字");
    // The render config's image field draws nothing
    expect(imageWidget(renderConfig)).toBe("");
  });

  it("puts every block in the category its spec names", () => {
    const categories = editorConfig.categories ?? {};
    const keys = Object.keys(categories);
    expect(keys).toEqual([
      ...CATEGORIES.map((category) => category.key),
      "deprecated",
    ]);
    expect(categories).toEqual(editorCategories(blockSpecs));
    for (const category of CATEGORIES) {
      expect(categories[category.key].title).toBe(category.title);
    }
    expect(categories.deprecated).toMatchObject({
      title: "已停用",
      visible: false,
    });
    for (const spec of blockSpecs) {
      const holders = keys.filter((key) =>
        (categories[key].components ?? []).includes(spec.type)
      );
      const expected = spec.deprecated
        ? "deprecated"
        : CATEGORIES.find((category) => category.title === spec.category)?.key;
      expect([spec.type, holders]).toEqual([spec.type, [expected]]);
    }
  });

  it("moves a deprecated block to the hidden category and nowhere else", () => {
    const categories = editorCategories(
      blockSpecs.map((spec) =>
        spec.type === "Image" ? { ...spec, deprecated: true } : spec
      )
    );
    expect(categories.deprecated).toEqual({
      title: "已停用",
      visible: false,
      components: ["Image"],
    });
    const shown = CATEGORIES.flatMap(
      (category) => categories[category.key].components ?? []
    );
    expect(shown).not.toContain("Image");
    expect([...shown].sort()).toEqual(
      blockSpecs
        .map((spec) => spec.type)
        .filter((type) => type !== "Image")
        .sort()
    );
  });

  it("gives the page root its fields and defaults", () => {
    expect(Object.keys(editorConfig.root?.fields ?? {})).toEqual(
      Object.keys(pageRootSpec.props.shape)
    );
    expect(editorConfig.root?.defaultProps).toEqual(
      toDefaultProps(pageRootSpec)
    );
    expect(typeof editorConfig.root?.render).toBe("function");
    expect(renderConfig.root?.fields).toBeUndefined();
  });
});
