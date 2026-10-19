import { join } from "node:path";
import prettier from "prettier";
import { blockSpecs } from "../../specs";
import {
  GENERATED_HEADER,
  blockFolder,
  renderStoryFile,
  storyFilePath,
  storyId,
} from "../stories";

describe("story files", () => {
  it("names folders, files and ids after the block type", () => {
    expect(blockFolder("TagList")).toBe("tag-list");
    expect(blockFolder("Button")).toBe("button");

    const tagList = blockSpecs.find((spec) => spec.type === "TagList");

    expect(tagList && storyFilePath(tagList)).toBe(
      "src/tag-list/TagList.stories.tsx"
    );
    expect(tagList && storyId(tagList)).toBe("blocks-tag-list");
  });

  it.each(blockSpecs.map((spec) => [spec.type, spec] as const))(
    "%s: CSF3 with the spec's title, defaults, argTypes and examples",
    (_type, spec) => {
      const source = renderStoryFile(spec);

      expect(source.startsWith(`${GENERATED_HEADER}\n`)).toBe(true);
      expect(source).toContain(
        'import { Render } from "@tzuchi/tceditor/rsc";'
      );
      expect(source).toContain(
        `title: ${JSON.stringify(`區塊/${spec.label}`)},`
      );
      expect(source).toContain(`id: "${storyId(spec)}",`);
      expect(source).toContain('tags: ["autodocs"],');
      expect(source).toContain(
        `data={storyPage(${JSON.stringify(spec.type)}, args)}`
      );
      expect(source).toContain('export const Default = { name: "預設" };');

      const exported = [...source.matchAll(/^export const (\w+) =/gm)].map(
        (match) => match[1]
      );

      expect(exported).toEqual([
        "Default",
        ...spec.examples.map((_example, index) => `Example${index + 1}`),
      ]);

      for (const example of spec.examples) {
        expect(source).toContain(`name: ${JSON.stringify(example.name)}`);
      }

      const filepath = join(__dirname, "../../..", storyFilePath(spec));

      expect(
        prettier.format(source, {
          ...prettier.resolveConfig.sync(filepath),
          filepath,
        })
      ).toBe(source);
    }
  );
});
