import * as z from "zod";
import { textToRichText } from "@tzuchi/tceditor/rules";
import { defineBlockSpec, slot, token } from "@tzuchi/tceditor-spec";
import type { BlockProps } from "@tzuchi/tceditor-spec";

export const columnsSpec = defineBlockSpec({
  type: "Columns",
  label: "多欄",
  category: "版面",
  description:
    "把內容分成 2 到 3 欄並排；畫面寬度小於 768px 時改成上下排列。刪除一欄時，那一欄的內容會一起刪除。",
  version: 1,
  props: z.strictObject({
    columns: z
      .array(
        z.strictObject({
          content: slot({
            allow: [
              "Heading",
              "Paragraph",
              "Button",
              "Card",
              "TagList",
              "Image",
            ],
          }).meta({ title: "內容" }),
        })
      )
      .min(2)
      .max(3)
      .default(() => [{ content: [] }, { content: [] }])
      .meta({ title: "欄", "x-item-label": "第 {n} 欄" }),
    gap: token("space", ["16", "24", "32"])
      .default("24")
      .meta({
        title: "欄距",
        "x-labels": { "16": "小", "24": "中", "32": "大" },
      }),
  }),
  examples: [
    {
      name: "兩欄：圖片與說明",
      props: {
        columns: [
          {
            content: [
              {
                type: "Image",
                props: {
                  image: {
                    assetId: "demo-1",
                    alt: "志工在海灘上撿拾垃圾",
                    decorative: false,
                  },
                  ratio: "4:3",
                },
              },
            ],
          },
          {
            content: [
              { type: "Heading", props: { text: "一起守護海岸", level: "h3" } },
              {
                type: "Paragraph",
                props: {
                  body: textToRichText("每一次彎腰，都讓海灘更乾淨一點。"),
                },
              },
              {
                type: "TagList",
                props: { tags: [{ label: "環保" }, { label: "戶外" }] },
              },
            ],
          },
        ],
      },
    },
  ],
});

export type ColumnsProps = BlockProps<typeof columnsSpec>;
