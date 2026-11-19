import { getSchema } from "@tiptap/core";
import { PuckRichText, PuckRichTextOptions } from "../extension";

/** The node types of a field's schema that have a textAlign attribute */
const alignedTypes = (options?: Partial<PuckRichTextOptions>) => {
  const schema = getSchema([PuckRichText.configure(options)]);

  return ["paragraph", "heading"].filter((name) =>
    Object.prototype.hasOwnProperty.call(
      schema.nodes[name]?.spec.attrs ?? {},
      "textAlign"
    )
  );
};

describe("PuckRichText", () => {
  describe("textAlign option", () => {
    it("aligns paragraphs and headings by default", () => {
      expect(alignedTypes()).toEqual(["paragraph", "heading"]);
      expect(alignedTypes({})).toEqual(["paragraph", "heading"]);
    });

    it("removes text alignment when it is false", () => {
      expect(alignedTypes({ textAlign: false })).toEqual([]);
    });

    it("uses the types the field sets", () => {
      expect(alignedTypes({ textAlign: { types: ["heading"] } })).toEqual([
        "heading",
      ]);
    });

    it("keeps the default types when the field sets other text align options", () => {
      expect(
        alignedTypes({ textAlign: { alignments: ["left", "center"] } })
      ).toEqual(["paragraph", "heading"]);
    });
  });
});
