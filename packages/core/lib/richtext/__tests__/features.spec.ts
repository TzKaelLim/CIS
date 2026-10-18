import fs from "fs";
import path from "path";
import { getSchema } from "@tiptap/core";
import { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { PuckRichText } from "../../../components/RichTextEditor/extension";
import { fitToSchema } from "../../../components/RichTextEditor/lib/fit-to-schema";
import { stableStringify } from "../stable-stringify";
import {
  isRichTextFeature,
  RICHTEXT_FEATURES,
  RichTextFeature,
  richTextFeaturesToOptions,
  richTextFeaturesToTypes,
} from "../features";
import { fitRichTextToTypes } from "../fit-to-types";
import { allTypicalContent, typicalContent } from "../__helpers__/fixtures";

// The features of the S2 Paragraph block
const PARAGRAPH_FEATURES: RichTextFeature[] = [
  "bold",
  "italic",
  "link",
  "bulletList",
  "orderedList",
  "hardBreak",
];

/** Every subset of RICHTEXT_FEATURES (4,096) */
const allFeatureSets = (): RichTextFeature[][] =>
  Array.from({ length: 2 ** RICHTEXT_FEATURES.length }, (_, bits) =>
    RICHTEXT_FEATURES.filter((_, index) => bits & (1 << index))
  );

const schemaFor = (features: readonly RichTextFeature[]) =>
  getSchema([PuckRichText.configure(richTextFeaturesToOptions(features))]);

describe("features.ts", () => {
  it("only imports types", () => {
    const source = fs.readFileSync(
      path.join(__dirname, "../features.ts"),
      "utf8"
    );

    expect(source.match(/^import .*$/gm)).toEqual([
      'import type { RichTextTypes } from "./fit-to-types";',
    ]);
  });
});

describe("RICHTEXT_FEATURES", () => {
  it("lists the 12 features of richText()", () => {
    expect(RICHTEXT_FEATURES).toEqual([
      "bold",
      "italic",
      "underline",
      "strike",
      "code",
      "link",
      "bulletList",
      "orderedList",
      "blockquote",
      "heading",
      "horizontalRule",
      "hardBreak",
    ]);
  });
});

describe("isRichTextFeature", () => {
  it.each(RICHTEXT_FEATURES)("accepts %s", (feature) => {
    expect(isRichTextFeature(feature)).toBe(true);
  });

  it.each([
    "paragraph",
    "codeBlock",
    "listItem",
    "textAlign",
    "Bold",
    "__proto__",
    "constructor",
    "toString",
    "",
    1,
    null,
    undefined,
    ["bold"],
  ])("rejects %p", (value) => {
    expect(isRichTextFeature(value)).toBe(false);
  });
});

describe.each([
  ["richTextFeaturesToOptions", richTextFeaturesToOptions],
  ["richTextFeaturesToTypes", richTextFeaturesToTypes],
])("%s", (_, convert) => {
  it.each(["paragraph", "codeBlock", "textAlign", "__proto__", "constructor"])(
    "throws a TypeError for the unknown feature %j",
    (feature) => {
      expect(() => convert(["bold", feature as RichTextFeature])).toThrow(
        TypeError
      );
    }
  );

  it("throws a TypeError when the features are not an array", () => {
    expect(() =>
      convert("bold" as unknown as readonly RichTextFeature[])
    ).toThrow(TypeError);
  });

  it("ignores repeated features", () => {
    expect(convert(["bold", "bold"])).toEqual(convert(["bold"]));
  });
});

describe("richTextFeaturesToOptions", () => {
  it("turns off every other feature, code blocks and text alignment", () => {
    expect(richTextFeaturesToOptions(PARAGRAPH_FEATURES)).toEqual({
      underline: false,
      strike: false,
      code: false,
      blockquote: false,
      heading: false,
      horizontalRule: false,
      codeBlock: false,
      textAlign: false,
    });
  });

  it("turns off list items when there is no list feature", () => {
    expect(richTextFeaturesToOptions([])).toEqual({
      bold: false,
      italic: false,
      underline: false,
      strike: false,
      code: false,
      link: false,
      bulletList: false,
      orderedList: false,
      blockquote: false,
      heading: false,
      horizontalRule: false,
      hardBreak: false,
      codeBlock: false,
      listItem: false,
      textAlign: false,
    });
  });
});

describe("richTextFeaturesToTypes", () => {
  it("allows the types of the features, with paragraphs and no alignment", () => {
    expect(richTextFeaturesToTypes(PARAGRAPH_FEATURES)).toEqual({
      nodes: [
        "bulletList",
        "doc",
        "hardBreak",
        "listItem",
        "orderedList",
        "paragraph",
        "text",
      ],
      marks: ["bold", "italic", "link"],
      textblock: "paragraph",
      textAlign: false,
    });
  });
});

describe("consistency with the editor, for all 4,096 feature sets", () => {
  it("gives the node and mark types of the editor's schema, without text alignment", () => {
    const mismatches = allFeatureSets().filter((features) => {
      const schema = schemaFor(features);
      const types = richTextFeaturesToTypes(features);

      return (
        stableStringify(Object.keys(schema.nodes).sort()) !==
          stableStringify(types.nodes) ||
        stableStringify(Object.keys(schema.marks).sort()) !==
          stableStringify(types.marks) ||
        ["paragraph", "heading"].some((name) =>
          Object.prototype.hasOwnProperty.call(
            schema.nodes[name]?.spec.attrs ?? {},
            "textAlign"
          )
        )
      );
    });

    expect(mismatches).toEqual([]);
  });

  it("fits documents like the editor does, in the form the editor loads", () => {
    const documents = [allTypicalContent, ...Object.values(typicalContent)];
    const mismatches: string[] = [];

    for (const features of allFeatureSets()) {
      const schema = schemaFor(features);
      const types = richTextFeaturesToTypes(features);

      documents.forEach((document, index) => {
        const fitted = fitRichTextToTypes(document, types);
        const result = stableStringify(fitted);
        // What the editor's getJSON() gives after loading the result
        const loaded = ProseMirrorNode.fromJSON(schema, fitted).toJSON();

        if (
          result !== stableStringify(fitToSchema(document, schema)) ||
          result !== stableStringify(loaded)
        ) {
          mismatches.push(`${features.join(",")} / document ${index}`);
        }
      });
    }

    expect(mismatches).toEqual([]);
  });
});
