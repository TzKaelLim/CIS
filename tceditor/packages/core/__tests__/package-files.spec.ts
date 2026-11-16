/** Tests that the published packages ship the license and attribution files */
import fs from "fs";
import path from "path";

const repoRoot = path.resolve(__dirname, "../../..");

const readFile = (...segments: string[]) =>
  fs.readFileSync(path.join(repoRoot, ...segments), "utf8");

// The plugin has no test runner of its own, so its package is checked here too.
describe.each(["packages/core", "packages/plugin-heading-analyzer"])(
  "%s",
  (packageDir) => {
    it("lists LICENSE and NOTICE in files", () => {
      const manifest = JSON.parse(readFile(packageDir, "package.json"));

      expect(manifest.files).toEqual(["dist", "LICENSE", "NOTICE"]);
    });

    it.each(["LICENSE", "NOTICE"])("has a copy of the root %s", (fileName) => {
      expect(readFile(packageDir, fileName)).toBe(readFile(fileName));
    });
  }
);
