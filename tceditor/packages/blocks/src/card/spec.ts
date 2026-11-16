import * as z from "zod";
import { textToRichText } from "@tzuchi/tceditor/rules";
import { defineBlockSpec, link, slot, style } from "@tzuchi/tceditor-spec";
import type { BlockProps } from "@tzuchi/tceditor-spec";

export const cardSpec = defineBlockSpec({
  type: "Card",
  label: "卡片",
  category: "內容",
  description:
    "有標題、摘要與內容區的卡片。填了連結網址時，標題會變成連結；內容區可以放段落、按鈕、標籤列與圖片。",
  version: 1,
  props: z.strictObject({
    title: z
      .string()
      .min(1)
      .max(80)
      .default("卡片標題")
      .meta({ title: "標題" }),
    summary: z
      .string()
      .max(200)
      .default("")
      .meta({ title: "摘要", "x-field": "textarea" }),
    href: link({ optional: true }).meta({
      title: "連結網址",
      description:
        "選填。填寫時標題變成連結；只接受 http、https、mailto、tel 或站內路徑。",
    }),
    variant: style("card", "variant", ["default", "secondary"])
      .default("default")
      .meta({
        title: "樣式",
        "x-labels": { default: "預設", secondary: "次要" },
      }),
    content: slot({ allow: ["Paragraph", "Button", "TagList", "Image"] }).meta({
      title: "內容",
    }),
  }),
  examples: [
    {
      name: "含段落與按鈕",
      props: {
        title: "淨灘志工招募",
        summary: "每月第一個週六上午，在福隆海灘集合。",
        href: "/activity",
        content: [
          {
            type: "Paragraph",
            props: {
              body: textToRichText("不需要經驗，現場有志工說明。"),
            },
          },
          {
            type: "Button",
            props: { label: "立即報名", href: "/register", size: "sm" },
          },
        ],
      },
    },
  ],
});

export type CardProps = BlockProps<typeof cardSpec>;
