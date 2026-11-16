/** Tests that the richtext API is public in the main and the RSC entry */
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as any).ResizeObserver = ResizeObserverMock;

import * as core from "../bundle/core";
import * as rsc from "../bundle/rsc";

describe.each([
  ["main", core],
  ["rsc", rsc],
])("%s entry", (_, entry) => {
  it("exports the richtext API", () => {
    expect({
      isSafeHref: typeof entry.isSafeHref,
      normalizeRichText: typeof entry.normalizeRichText,
      renderRichText: typeof entry.renderRichText,
      textToRichText: typeof entry.textToRichText,
      RichTextContent: typeof entry.RichTextContent,
      RICHTEXT_MAX_DEPTH: entry.RICHTEXT_MAX_DEPTH,
    }).toEqual({
      isSafeHref: "function",
      normalizeRichText: "function",
      renderRichText: "function",
      textToRichText: "function",
      RichTextContent: "function",
      RICHTEXT_MAX_DEPTH: 100,
    });
  });
});
