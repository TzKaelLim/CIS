# @tzuchi/tceditor-spec

撰寫 tceditor 區塊規格的工具：以 zod 4.6.5 宣告每個區塊的 props，再由同一份規格產生 JSON Schema、編輯器欄位、Storybook 控制項、MCP 元件目錄與整頁驗證器。

這個套件是 `private`，以原始碼提供（`exports` 指向 `.ts`），沒有 build 步驟。只依賴 `zod` 與 `@tzuchi/tceditor/rules`，不依賴 React 與 uikit。

```ts
import * as z from "zod";
import { defineBlockSpec, link } from "@tzuchi/tceditor-spec";

export const buttonSpec = defineBlockSpec({
  type: "Button",
  label: "按鈕",
  category: "互動",
  description: "導向其他頁面或網站的按鈕。",
  version: 1,
  props: z.strictObject({
    label: z
      .string()
      .min(1)
      .max(40)
      .default("立即報名")
      .meta({ title: "按鈕文字" }),
    href: link().meta({ title: "連結網址" }),
  }),
  examples: [{ name: "主要按鈕", props: { href: "/register" } }],
});
```

寫法規則見設計規格 `docs/superpowers/specs/2026-10-12-s2-block-spec-design.md` 第 4.3 節，由 `checkSpecRules` 與 ESLint 檢查。
