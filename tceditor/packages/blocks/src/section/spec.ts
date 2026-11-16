import * as z from "zod";
import { textToRichText } from "@tzuchi/tceditor/rules";
import { defineBlockSpec, slot, style, token } from "@tzuchi/tceditor-spec";
import type { BlockProps } from "@tzuchi/tceditor-spec";

export const sectionSpec = defineBlockSpec({
  type: "Section",
  label: "區段",
  category: "版面",
  description:
    "把幾個區塊包成一段，可以加背景色與上下留白。區段裡不能再放區段。",
  version: 1,
  props: z.strictObject({
    background: style("surface", "variant", [
      "transparent",
      "default",
      "secondary",
    ])
      .default("transparent")
      .meta({
        title: "背景",
        "x-labels": {
          transparent: "無背景",
          default: "白色",
          secondary: "淺灰",
        },
      }),
    paddingY: token("space", ["16", "32", "48", "64"])
      .default("48")
      .meta({
        title: "上下留白",
        "x-labels": { "16": "小", "32": "中", "48": "大", "64": "特大" },
      }),
    content: slot({ disallow: ["Section"] }).meta({ title: "內容" }),
  }),
  examples: [
    {
      name: "淺灰背景，含標題、段落與按鈕",
      props: {
        background: "secondary",
        content: [
          { type: "Heading", props: { text: "活動資訊", level: "h2" } },
          {
            type: "Paragraph",
            props: {
              body: textToRichText("集合時間為上午八點，活動約三小時。"),
            },
          },
          { type: "Button", props: { label: "立即報名", href: "/register" } },
        ],
      },
    },
  ],
});

export type SectionProps = BlockProps<typeof sectionSpec>;
