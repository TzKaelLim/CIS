import * as z from "zod";
import { defineBlockSpec, link, style } from "@tzuchi/tceditor-spec";
import type { BlockProps } from "@tzuchi/tceditor-spec";

export const buttonSpec = defineBlockSpec({
  type: "Button",
  label: "按鈕",
  category: "互動",
  description:
    "導向其他頁面或網站的按鈕。新加入的按鈕沒有連結網址，填好網址才能發布。",
  version: 1,
  props: z.strictObject({
    label: z
      .string()
      .min(1)
      .max(40)
      .default("立即報名")
      .meta({ title: "按鈕文字" }),
    href: link().meta({
      title: "連結網址",
      description: "必填。只接受 http、https、mailto、tel 或站內路徑。",
    }),
    variant: style("button", "variant", ["primary", "secondary", "outline"])
      .default("primary")
      .meta({
        title: "樣式",
        "x-labels": { primary: "主要", secondary: "次要", outline: "外框" },
      }),
    size: style("button", "size", ["sm", "md", "lg"])
      .default("md")
      .meta({ title: "大小", "x-labels": { sm: "小", md: "中", lg: "大" } }),
    fullWidth: z.boolean().default(false).meta({ title: "滿版寬度" }),
  }),
  examples: [
    { name: "主要按鈕", props: { label: "立即報名", href: "/register" } },
    {
      name: "外框、滿版",
      props: {
        label: "了解更多",
        href: "/about",
        variant: "outline",
        fullWidth: true,
      },
    },
  ],
});

export type ButtonProps = BlockProps<typeof buttonSpec>;
