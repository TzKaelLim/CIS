"use client";

import type { Config } from "@tzuchi/tceditor";
import { toDefaultProps, toPuckFields } from "@tzuchi/tceditor-spec";
import type { AnyBlockSpec } from "@tzuchi/tceditor-spec";
import type { AssetSource } from "./asset-source";
import { createImagePickerField } from "./image/editor";
import { createRenderConfig } from "./render-config";
import { CATEGORIES, blockSpecs, pageRootSpec } from "./specs";

/**
 * The editor's categories (spec §7.3): CATEGORIES in order, each holding the
 * blocks whose `category` is its title, then the hidden "deprecated"
 * category. Deprecated blocks go only there: a category with
 * `visible: false` hides them from the block list and keeps them out of
 * "other", while pages that already use them can still edit them.
 */
export function editorCategories(
  blocks: readonly AnyBlockSpec[]
): NonNullable<Config["categories"]> {
  return Object.fromEntries([
    ...CATEGORIES.map((category) => [
      category.key,
      {
        title: category.title,
        components: blocks
          .filter(
            (spec) => !spec.deprecated && spec.category === category.title
          )
          .map((spec) => spec.type),
      },
    ]),
    [
      "deprecated",
      {
        title: "已停用",
        visible: false,
        components: blocks
          .filter((spec) => spec.deprecated)
          .map((spec) => spec.type),
      },
    ],
  ]);
}

/**
 * The Puck config for <Puck> (spec §7.3): createRenderConfig's components
 * (the same render as the public page) plus fields, default props,
 * categories and the page root's fields. Create it once (module scope or
 * useMemo): Puck memoises custom fields by their render function.
 */
export function createEditorConfig(options: { assets: AssetSource }): Config {
  const base = createRenderConfig({ assets: options.assets });
  const image = createImagePickerField(options.assets);

  const components = Object.fromEntries(
    blockSpecs.map((spec) => [
      spec.type,
      {
        ...base.components[spec.type],
        fields: toPuckFields(spec, { image }),
        defaultProps: toDefaultProps(spec),
      },
    ])
  );

  return {
    components,
    categories: editorCategories(blockSpecs),
    root: {
      ...base.root,
      fields: toPuckFields(pageRootSpec),
      defaultProps: toDefaultProps(pageRootSpec),
    },
  };
}
