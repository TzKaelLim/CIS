/** Tests when the richtext field transform puts an inline editor on the canvas */
import type { ReactElement } from "react";
import { RichTextContent } from "../../../../components/RichTextEditor/components/RichTextContent";
import type { RichtextField } from "../../../../types";
import { getRichTextTransform } from "../rich-text-transform";

const value = {
  type: "doc",
  content: [{ type: "paragraph", content: [{ type: "text", text: "Hello" }] }],
};

const transform = (field: RichtextField, isReadOnly = false) =>
  getRichTextTransform().richtext!({
    value,
    componentId: "block-1",
    field,
    propName: "body",
    propPath: "body",
    isReadOnly,
  }) as ReactElement<{ content?: unknown }>;

describe("getRichTextTransform", () => {
  it("renders static content when contentEditable is not set", () => {
    const element = transform({ type: "richtext" });

    expect(element.type).toBe(RichTextContent);
    expect(element.props.content).toBe(value);
  });

  it("renders static content when contentEditable is false", () => {
    const element = transform({ type: "richtext", contentEditable: false });

    expect(element.type).toBe(RichTextContent);
  });

  it("renders the inline editor when contentEditable is true", () => {
    const element = transform({ type: "richtext", contentEditable: true });

    expect(element.type).not.toBe(RichTextContent);
    expect((element.type as { displayName?: string }).displayName).toBe(
      "InlineEditorWrapper"
    );
    expect(element.key).toBe("block-1_richtext_body");
  });

  it("renders static content for a read-only field even when contentEditable is true", () => {
    const element = transform(
      { type: "richtext", contentEditable: true },
      true
    );

    expect(element.type).toBe(RichTextContent);
  });
});
