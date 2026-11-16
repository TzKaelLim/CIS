/** Tests the public API of the React-free @tzuchi/tceditor/rules entry */
import * as rules from "../bundle/rules";

describe("rules entry", () => {
  it("exports exactly the rules API", () => {
    expect(Object.keys(rules).sort()).toEqual([
      "RICHTEXT_FEATURES",
      "RICHTEXT_MAX_DEPTH",
      "fitRichTextToTypes",
      "isComponentAllowed",
      "isRichTextFeature",
      "isSafeHref",
      "normalizeRichText",
      "richTextFeaturesToOptions",
      "richTextFeaturesToTypes",
      "stableStringify",
      "textToRichText",
    ]);
  });
});
