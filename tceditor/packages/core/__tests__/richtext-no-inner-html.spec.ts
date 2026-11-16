/** Tests that no rich text code path writes raw HTML into the DOM */
import fs from "fs";
import path from "path";

const packageRoot = path.resolve(__dirname, "..");

const richTextSources = [
  "components/RichTextEditor",
  "components/AutoField/fields/RichtextField",
  "lib/richtext",
  "lib/field-transforms",
];

const collectSources = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(dir, entry.name);

    if (entry.isDirectory()) return collectSources(entryPath);

    return /\.tsx?$/.test(entry.name) && !/\.spec\.tsx?$/.test(entry.name)
      ? [entryPath]
      : [];
  });

describe("rich text sources", () => {
  it("never use dangerouslySetInnerHTML", () => {
    const offenders = richTextSources
      .flatMap((dir) => collectSources(path.join(packageRoot, dir)))
      .filter((file) =>
        fs.readFileSync(file, "utf8").includes("dangerouslySetInnerHTML")
      )
      .map((file) => path.relative(packageRoot, file));

    expect(offenders).toEqual([]);
  });
});
