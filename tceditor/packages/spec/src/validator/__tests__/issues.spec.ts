import { formatPathText, ISSUE_CODES } from "../index";

describe("issues", () => {
  it("has the issue codes of spec §6.2 in order", () => {
    expect(ISSUE_CODES).toEqual([
      "too_large",
      "invalid_json",
      "invalid_shape",
      "legacy_zones",
      "unknown_type",
      "invalid_id",
      "duplicate_id",
      "too_deep",
      "too_many_blocks",
      "unknown_prop",
      "invalid_value",
      "unsafe_href",
      "alt_required",
      "not_allowed_here",
      "richtext_cleaned",
    ]);
  });

  it.each([
    [["content", 0, "props", "href"], "content[0].props.href"],
    [[], ""],
    [["zones"], "zones"],
    [["content", 3], "content[3]"],
    [
      ["content", 0, "props", "columns", 1, "content", 0],
      "content[0].props.columns[1].content[0]",
    ],
    [["root", "props", "__proto__"], "root.props.__proto__"],
    [["content", 0, "props", "more-href"], "content[0].props.more-href"],
    [["content", 0, "props", "a b"], 'content[0].props["a b"]'],
    [["content", 0, "props", "標題"], 'content[0].props["標題"]'],
  ])("formats %j as %j", (path, text) => {
    expect(formatPathText(path)).toBe(text);
  });
});
