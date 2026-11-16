import * as z from "zod";
import { defineBlockSpec, style } from "@tzuchi/tceditor-spec";
import type { BlockProps } from "@tzuchi/tceditor-spec";

export const tagListSpec = defineBlockSpec({
  type: "TagList",
  label: "標籤列",
  category: "內容",
  description: "一排簡短的標籤，例如活動的類別或對象。",
  version: 1,
  props: z.strictObject({
    tags: z
      .array(
        z.strictObject({
          label: z.string().min(1).max(20).meta({ title: "標籤文字" }),
        })
      )
      .min(1)
      .max(10)
      .default(() => [{ label: "志工" }, { label: "環保" }])
      .meta({ title: "標籤", "x-item-label": "{label}" }),
    color: style("chip", "color", ["default", "accent", "success"])
      .default("default")
      .meta({
        title: "顏色",
        "x-labels": { default: "預設", accent: "強調", success: "成功" },
      }),
    variant: style("chip", "variant", ["secondary", "soft"])
      .default("secondary")
      .meta({
        title: "樣式",
        "x-labels": { secondary: "次要", soft: "柔和" },
      }),
  }),
  examples: [
    { name: "只用預設值", props: {} },
    {
      name: "強調、柔和",
      props: {
        tags: [{ label: "親子" }, { label: "戶外" }, { label: "免費參加" }],
        color: "accent",
        variant: "soft",
      },
    },
  ],
});

export type TagListProps = BlockProps<typeof tagListSpec>;
