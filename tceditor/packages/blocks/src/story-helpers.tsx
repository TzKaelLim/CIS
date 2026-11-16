import { exampleToPageData } from "@tzuchi/tceditor-spec";
import type { AnyBlockSpec, PageData } from "@tzuchi/tceditor-spec";
import { demoAssetSource } from "./demo-assets";
import { createRenderConfig } from "./render-config";
import { blockSpecs } from "./specs";
import { validatePage } from "./validator";

/** The config every generated story renders with: the public page's config and the demo images. */
export const storyConfig = createRenderConfig({ assets: demoAssetSource });

const specsByType: Record<string, AnyBlockSpec> = Object.create(null);

for (const spec of blockSpecs) specsByType[spec.type] = spec;

/**
 * A page that holds one block with the story's args as its props.
 *
 * Ids come from exampleToPageData, so the block and the blocks in its slots
 * get the same stable ids an example would get. When the page passes the
 * validator, its output is used: it fills in the defaults that the nested
 * blocks of an example usually leave out, as publishing does. Otherwise (a
 * block that is not ready to publish yet, such as a new Button without a link,
 * or args edited in the Controls panel) the props are rendered as given.
 */
export function storyPage(
  type: string,
  args: Record<string, unknown>
): PageData {
  const spec = type in specsByType ? specsByType[type] : undefined;

  if (!spec) throw new TypeError(`storyPage: unknown block type "${type}"`);

  const page = exampleToPageData(
    { ...spec, examples: [{ name: "story", props: args }] },
    0
  );
  const result = validatePage(page);

  return result.ok ? result.data : page;
}
