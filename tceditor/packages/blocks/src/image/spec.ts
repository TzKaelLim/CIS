import * as z from "zod";
import { choice, defineBlockSpec, image } from "@tzuchi/tceditor-spec";
import type { BlockProps } from "@tzuchi/tceditor-spec";

export const imageSpec = defineBlockSpec({
  type: "Image",
  label: "圖片",
  category: "內容",
  description:
    "一張圖片，可加圖說。新加入的圖片還沒選圖；選好圖並填寫替代文字（純裝飾的圖片除外）才能發布。",
  version: 1,
  props: z.strictObject({
    image: image().meta({
      title: "圖片",
      description: "替代文字給看不到圖片的讀者使用；純裝飾的圖片可以留空。",
    }),
    ratio: choice(["auto", "16:9", "4:3", "1:1"])
      .default("auto")
      .meta({
        title: "比例",
        description: "原始比例以外的比例，會裁切圖片填滿。",
        "x-labels": {
          auto: "原始比例",
          "16:9": "16:9",
          "4:3": "4:3",
          "1:1": "1:1",
        },
      }),
    caption: z.string().max(120).default("").meta({ title: "圖說" }),
  }),
  examples: [
    {
      name: "寬幅圖片與圖說",
      props: {
        image: {
          assetId: "demo-1",
          alt: "志工在海灘上撿拾垃圾",
          decorative: false,
        },
        ratio: "16:9",
        caption: "2025 年福隆淨灘活動",
      },
    },
    {
      name: "純裝飾圖片",
      props: {
        image: { assetId: "demo-3", alt: "", decorative: true },
        ratio: "1:1",
      },
    },
  ],
});

export type ImageProps = BlockProps<typeof imageSpec>;
