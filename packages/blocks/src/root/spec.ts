import * as z from "zod";
import { definePageRoot } from "@tzuchi/tceditor-spec";
import type { BlockProps } from "@tzuchi/tceditor-spec";

export const pageRootSpec = definePageRoot({
  props: z.strictObject({
    title: z.string().min(1).max(80).default("未命名頁面").meta({
      title: "頁面標題",
      description: "顯示在瀏覽器分頁與搜尋結果。",
    }),
    description: z.string().max(160).default("").meta({
      title: "頁面說明",
      description: "搜尋結果中標題下方的說明文字。",
      "x-field": "textarea",
    }),
  }),
});

export type PageRootProps = BlockProps<typeof pageRootSpec>;
