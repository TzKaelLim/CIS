import * as z from "zod";
import { defineBlockSpec, style } from "@tzuchi/tceditor-spec";
import type { BlockProps } from "@tzuchi/tceditor-spec";

export const headingSpec = defineBlockSpec({
  type: "Heading",
  label: "標題",
  category: "文字",
  description:
    "頁面或段落的標題。層級同時決定 HTML 標籤（h1–h4），一頁通常只放一個標題 1。",
  version: 1,
  props: z.strictObject({
    text: z
      .string()
      .min(1)
      .max(120)
      .default("標題文字")
      .meta({ title: "標題文字", "x-inline": true }),
    level: style("typography", "type", ["h1", "h2", "h3", "h4"])
      .default("h2")
      .meta({
        title: "層級",
        "x-labels": { h1: "標題 1", h2: "標題 2", h3: "標題 3", h4: "標題 4" },
      }),
    align: style("typography", "align", ["start", "center", "end"])
      .default("start")
      .meta({
        title: "對齊",
        "x-labels": { start: "靠左", center: "置中", end: "靠右" },
      }),
  }),
  examples: [
    { name: "只用預設值", props: {} },
    {
      name: "置中的頁面主標題",
      props: { text: "2026 年淨灘活動", level: "h1", align: "center" },
    },
  ],
});

export type HeadingProps = BlockProps<typeof headingSpec>;
