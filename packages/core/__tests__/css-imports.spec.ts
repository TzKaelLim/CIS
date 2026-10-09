/** Tests that the package's CSS never makes the browser fetch from another origin */
import fs from "fs";
import path from "path";

const packageRoot = path.resolve(__dirname, "..");

const collectCssFiles = (dir: string): string[] => {
  const files: string[] = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === "dist") {
      continue;
    }

    const entryPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectCssFiles(entryPath));
    } else if (entry.name.endsWith(".css")) {
      files.push(entryPath);
    }
  }

  return files;
};

// Matches url(https://…), url("//…"), @import "https://…" and
// @import url(https://…). data: URLs and comments do not match.
const remoteReference = /(?:url\(\s*|@import\s+)["']?(?:https?:)?\/\//i;

describe("package CSS", () => {
  it("does not reference remote URLs", () => {
    const offenders = collectCssFiles(packageRoot)
      .filter((file) => remoteReference.test(fs.readFileSync(file, "utf8")))
      .map((file) => path.relative(packageRoot, file));

    expect(offenders).toEqual([]);
  });
});
