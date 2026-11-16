import * as z from "zod";
import {
  fitRichTextToTypes,
  richTextFeaturesToTypes,
  textToRichText,
} from "@tzuchi/tceditor/rules";
import { defineBlockSpec, definePageRoot } from "../define";
import { choice, image, link, richText, slot, style, token } from "../helpers";

/** 只有一段文字。 */
export const leafSpec = defineBlockSpec({
  type: "Leaf",
  label: "葉",
  category: "測試",
  description: "只有一段文字的測試區塊。",
  version: 1,
  props: z.strictObject({
    text: z.string().min(1).max(20).default("葉子").meta({ title: "文字" }),
  }),
  examples: [{ name: "預設", props: {} }],
});

/** 可以無限巢狀（用來做 33 層與 5,001 個區塊的反例）。 */
export const boxSpec = defineBlockSpec({
  type: "Box",
  label: "盒子",
  category: "測試",
  description: "可以無限巢狀的測試區塊。",
  version: 1,
  props: z.strictObject({
    content: slot({ allow: ["Box", "Leaf"] }).meta({ title: "內容" }),
  }),
  examples: [
    {
      name: "含一片葉子",
      props: { content: [{ type: "Leaf", props: { text: "葉" } }] },
    },
  ],
});

/** 清單裡的放置區（Columns 的測試版）。 */
export const pairSpec = defineBlockSpec({
  type: "Pair",
  label: "兩欄",
  category: "測試",
  description: "清單裡放置區的測試區塊。",
  version: 1,
  props: z.strictObject({
    columns: z
      .array(
        z.strictObject({
          content: slot({ disallow: ["Pair"] }).meta({ title: "內容" }),
        })
      )
      .min(2)
      .max(3)
      .default(() => [{ content: [] }, { content: [] }])
      .meta({ title: "欄", "x-item-label": "第 {n} 欄" }),
  }),
  examples: [
    {
      name: "兩欄各一片葉子",
      props: {
        columns: [
          { content: [{ type: "Leaf", props: { text: "左" } }] },
          { content: [{ type: "Leaf", props: { text: "右" } }] },
        ],
      },
    },
  ],
});

/** 涵蓋 11 種欄位。href 與 picture 的預設值刻意不完整（和 Button、Image 一樣）。 */
export const kitchenSinkSpec = defineBlockSpec({
  type: "KitchenSink",
  label: "全欄位",
  category: "測試",
  description: "涵蓋 11 種欄位的測試區塊。",
  version: 1,
  props: z.strictObject({
    title: z
      .string()
      .min(1)
      .max(40)
      .default("標題")
      .meta({ title: "標題", "x-inline": true }),
    note: z
      .string()
      .max(200)
      .default("")
      .meta({ title: "備註", "x-field": "textarea" }),
    count: z.number().int().min(1).max(10).default(3).meta({ title: "數量" }),
    tone: choice(["calm", "bright", "dark", "warm", "cool"])
      .default("calm")
      .meta({
        title: "色調",
        "x-labels": {
          calm: "沉穩",
          bright: "明亮",
          dark: "深色",
          warm: "暖色",
          cool: "冷色",
        },
      }),
    size: style("button", "size", ["sm", "md", "lg"])
      .default("md")
      .meta({ title: "大小", "x-labels": { sm: "小", md: "中", lg: "大" } }),
    space: token("space", ["16", "32"])
      .default("16")
      .meta({ title: "間距", "x-labels": { "16": "小", "32": "大" } }),
    enabled: z.boolean().default(true).meta({ title: "啟用" }),
    href: link().meta({ title: "連結網址" }),
    moreHref: link({ optional: true }).meta({ title: "更多連結" }),
    // zod 的 .default() 不經過 .overwrite()，所以預設值要先清理成 richText() 的輸出形狀
    body: richText({ features: ["bold", "link"] })
      .default(() =>
        fitRichTextToTypes(
          textToRichText("內文"),
          richTextFeaturesToTypes(["bold", "link"])
        )
      )
      .meta({ title: "內文" }),
    items: z
      .array(
        z.strictObject({
          label: z.string().min(1).max(20).meta({ title: "名稱" }),
        })
      )
      .min(1)
      .max(5)
      .default(() => [{ label: "一" }])
      .meta({ title: "項目", "x-item-label": "{label}" }),
    group: z
      .strictObject({
        caption: z.string().max(40).default("").meta({ title: "說明" }),
        level: z
          .number()
          .int()
          .min(0)
          .max(3)
          .default(0)
          .meta({ title: "層級" }),
      })
      .default(() => ({ caption: "", level: 0 }))
      .meta({ title: "群組" }),
    content: slot({ allow: ["Leaf"] }).meta({ title: "內容" }),
    picture: image().meta({ title: "圖片" }),
  }),
  examples: [
    {
      name: "填好必填欄位",
      props: {
        href: "/register",
        picture: { assetId: "demo-1", alt: "示意圖", decorative: false },
        content: [{ type: "Leaf", props: { text: "子" } }],
      },
    },
  ],
});

export const testBlocks = [
  kitchenSinkSpec,
  boxSpec,
  leafSpec,
  pairSpec,
] as const;

export const testRoot = definePageRoot({
  props: z.strictObject({
    title: z
      .string()
      .min(1)
      .max(80)
      .default("未命名頁面")
      .meta({ title: "頁面標題" }),
    description: z
      .string()
      .max(160)
      .default("")
      .meta({ title: "頁面說明", "x-field": "textarea" }),
  }),
});
