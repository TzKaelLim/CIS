import React, { ReactNode } from "react";
import { ComponentConfig, RichText as RichTextValue } from "@/core/types";
import { WithLayout, withLayout } from "../../components/Layout";
import { Section } from "../../components/Section";

export type RichTextProps = WithLayout<{
  richtext?: RichTextValue;
}>;

const RichTextInner: ComponentConfig<RichTextProps> = {
  fields: {
    richtext: {
      type: "richtext",
    },
  },
  render: ({ richtext }) => {
    // Puck passes richtext fields to render as rendered elements
    return <Section>{richtext as ReactNode}</Section>;
  },
  defaultProps: {
    richtext: {
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { textAlign: null, level: 2 },
          content: [{ type: "text", text: "Heading" }],
        },
        {
          type: "paragraph",
          attrs: { textAlign: null },
          content: [{ type: "text", text: "Body" }],
        },
      ],
    },
  },
};

export const RichText = withLayout(RichTextInner);
