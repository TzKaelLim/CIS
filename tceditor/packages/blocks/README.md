# @tzuchi/tceditor-blocks

tceditor 的 8 個示範區塊與頁面根節點：規格（zod）、畫面、編輯器與公開頁的 Puck 設定、樣式、由規格產生的檔案，以及綁定這 8 個區塊的整頁驗證器。畫面用 uikit HeroUI 線的樣式（`vendor/uikit`），套用慈濟主題。

- 以原始碼提供（`exports` 指向 `.ts`／`.tsx`），標為 `private`，monorepo 內以 `workspace:*` 取用。唯一的建置產物是 Edge 單檔驗證器 `dist/validator.edge.mjs`。
- 撰寫規格的工具與轉換器在 `packages/spec`（見 `packages/spec/README.md`）。寫法規則見 `CLAUDE.md` 的 Blocks and specs。
- 設計規格：`docs/superpowers/specs/2026-10-12-s2-block-spec-design.md` 第 7、8 節，第 18 節的更正優先。

## 區塊

| 類型        | 名稱   | 分類 | 欄位                                                                                                                |
| ----------- | ------ | ---- | ------------------------------------------------------------------------------------------------------------------- |
| `Heading`   | 標題   | 文字 | `text` 標題文字（可在畫布上直接編輯）、`level` 層級（h1–h4，同時決定 HTML 標籤）、`align` 對齊                      |
| `Paragraph` | 段落   | 文字 | `body` 內文（富文字，可在畫布上直接編輯；開放粗體、斜體、連結、項目清單、編號清單、換行）、`align` 對齊             |
| `Button`    | 按鈕   | 互動 | `label` 按鈕文字、`href` 連結網址（必填）、`variant` 樣式、`size` 大小、`fullWidth` 滿版寬度；輸出 `<a href>`       |
| `Card`      | 卡片   | 內容 | `title` 標題、`summary` 摘要、`href` 連結網址（選填，填寫時標題變成連結）、`variant` 樣式、`content` 內容（放置區） |
| `TagList`   | 標籤列 | 內容 | `tags` 標籤（1–10 項）、`color` 顏色、`variant` 樣式                                                                |
| `Section`   | 區段   | 版面 | `background` 背景、`paddingY` 上下留白、`content` 內容（放置區，不能再放區段）                                      |
| `Columns`   | 多欄   | 版面 | `columns` 欄（2–3 欄，每欄一個放置區）、`gap` 欄距；寬度小於 768px 時改成上下排列                                   |
| `Image`     | 圖片   | 內容 | `image` 圖片（素材、替代文字、純裝飾）、`ratio` 比例、`caption` 圖說                                                |

- 卡片的放置區只能放段落、按鈕、標籤列與圖片；多欄的每一欄可以放區段與多欄以外的區塊。
- 頁面根節點（`src/root/`）有 `title` 頁面標題（輸出成 `<title>`）與 `description` 頁面說明（輸出成 meta description）。它和區塊一樣有版本號（`definePageRoot({ version })`）與資料契約。
- 新加入的按鈕沒有網址、新加入的圖片沒有選圖，要填好才能發布。圖片還沒選時顯示「尚未選擇圖片」，素材已不存在時顯示「圖片已不存在」，兩種情況都不會讓頁面出錯。
- 白名單是工程師的初版，由設計師在區塊 Storybook 檢查後調整。uikit 有、但沒有開放的選項，理由寫在 `src/style-decisions.ts`。

## 匯出

| 入口                                                        | 內容                                                                                                       |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `@tzuchi/tceditor-blocks/specs`                             | `blockSpecs`、`pageRootSpec`、`BlockType`、`CATEGORIES` 與各區塊的 Props 型別（例如 `ButtonProps`）        |
| `@tzuchi/tceditor-blocks/validator`                         | `validatePage`、`validatePageJson`、`blockTypes`、`DEFAULT_LIMITS`、`ISSUE_CODES`、`formatPathText` 與型別 |
| `@tzuchi/tceditor-blocks/render`                            | `createRenderConfig({ assets })` 與 `buildRenderConfig`：公開頁與 stories 用的 Puck 設定，可在伺服器端執行 |
| `@tzuchi/tceditor-blocks/editor`                            | `createEditorConfig({ assets })`：編輯器用的 Puck 設定（`'use client'`）                                   |
| `@tzuchi/tceditor-blocks/assets`                            | `Asset`、`AssetSource`、`createStaticAssetSource`                                                          |
| `@tzuchi/tceditor-blocks/demo-assets`                       | `DEMO_ASSETS`、`demoAssetSource`（6 張示範圖）                                                             |
| `@tzuchi/tceditor-blocks/styles.css`                        | 區塊的全部樣式                                                                                             |
| `@tzuchi/tceditor-blocks/generated/catalog.json`            | MCP 元件目錄                                                                                               |
| `@tzuchi/tceditor-blocks/generated/page-shell.draft07.json` | 資料庫外殼 schema                                                                                          |

## 使用方式

公開頁（伺服器元件）。只能從 core 的 `@tzuchi/tceditor/rsc` 與 `@tzuchi/tceditor/rules` 取用執行期的值，否則會載入約 170–240 KB（gzip）的編輯器程式：

```tsx
import type { Data } from "@tzuchi/tceditor";
import { Render } from "@tzuchi/tceditor/rsc";
import { createRenderConfig } from "@tzuchi/tceditor-blocks/render";
import { demoAssetSource } from "@tzuchi/tceditor-blocks/demo-assets";

const config = createRenderConfig({ assets: demoAssetSource });

export function ActivityPage({ data }: { data: Data }) {
  return <Render config={config} data={data} />;
}
```

編輯器（client component）：

```tsx
"use client";

import { Puck, type Data } from "@tzuchi/tceditor";
import { createEditorConfig } from "@tzuchi/tceditor-blocks/editor";
import { demoAssetSource } from "@tzuchi/tceditor-blocks/demo-assets";

const config = createEditorConfig({ assets: demoAssetSource });

export function ActivityEditor({
  data,
  onPublish,
}: {
  data: Data;
  onPublish: (data: Data) => void;
}) {
  return <Puck config={config} data={data} onPublish={onPublish} />;
}
```

- 樣式：在根 layout import `@tzuchi/tceditor-blocks/styles.css`，並在 `<html>` 加上 `data-theme="tzuchi"`。只放在外層 div 時，portal 到 body 的元件會失去主題。`styles.css` 依序載入 `@tzuchi/tokens/tokens.css`、`@heroui/styles`（它本身就是 Tailwind 的入口，不要再另外 import `tailwindcss`）、慈濟主題與 `src/blocks.css`。
- 編輯器頁的 `<html>` 不要設 `data-theme`，預覽 iframe 的主題用 `overrides.iframe` 設定，做法見 `apps/showcase`。
- 圖片：`AssetSource` 的 `get(id)` 是同步函式，因為公開頁在渲染途中查圖；`list()` 給編輯器的圖片挑選器使用。S2 用 `demoAssetSource`（示範站的 6 張圖），S3 的媒體庫實作同一個介面，渲染前先查好整頁用到的圖片。
- 存檔前用 `validatePage(data)` 或 `validatePageJson(raw)` 檢查，只存回傳的 `data`（已補齊預設值）。錯誤格式見 `packages/spec/README.md`。
- `buildRenderConfig` 把 props 交給畫面之前，先用規格的預設值補上缺少的欄位（值是 `undefined` 或 `null` 也算缺少），頂層與清單項目、群組裡的欄位都一樣。所以相容修改新增欄位之前存下的頁面、Storybook 清掉的控制項，畫出來都和補齊預設值的資料相同，不會拋錯；只有清單項目裡缺少的放置區畫成空的。`<Render>` 本身不補預設值。
- 畫面不信任資料：資料裡的值不能直接當成 HTML 元素或標記。要依值選標籤時，經過固定的對照表並給安全的預設（例如 `Heading` 的 `level` 不是 h1–h4 時畫成 `h2`），class 名稱只來自樣式函式、`tokenClass()` 或 `switch`。驗證器之外的資料（例如 S3 的草稿預覽）也可能送進 `<Render>`。

## 檔案

```
packages/blocks/
  styles.css                 apps 只 import 這一個樣式檔
  scripts/gen-blocks.ts      pnpm gen:blocks 的進入點（tsx 執行）
  scripts/build-edge.mjs     以 esbuild 產生 dist/validator.edge.mjs
  generated/                 由腳本產生，不可手改
  src/specs.ts               區塊清單：blockSpecs、pageRootSpec、BlockType、CATEGORIES
  src/<區塊>/spec.ts         規格
  src/<區塊>/view.tsx        畫面（伺服器元件）
  src/<區塊>/<Block>.stories.tsx   由 pnpm gen:blocks 產生
  src/image/editor.tsx       圖片挑選器（編輯器專用的自訂欄位）
  src/root/                  頁面根節點
  src/render-config.tsx      buildRenderConfig、createRenderConfig
  src/views.ts               區塊類型對應的畫面（每個區塊一行）
  src/editor-config.tsx      createEditorConfig
  src/validator.ts           綁定 8 個區塊的驗證器
  src/style-decisions.ts     uikit 有、但不開放的選項與理由
  src/token-classes.ts       tokenClass()：token 值對應的 tcb-* class 名稱
  src/blocks.css             所有 tcb-* class
  src/asset-source.ts        AssetSource
  src/demo-assets.ts         6 張示範圖的清單（檔案在 apps/showcase/public/demo-assets/）
```

### 產生的檔案

| 檔案                                  | 產生方式          | 用途                                                              |
| ------------------------------------- | ----------------- | ----------------------------------------------------------------- |
| `src/<區塊>/<Block>.stories.tsx`      | `pnpm gen:blocks` | 區塊 Storybook 的 stories（CSF3）                                 |
| `generated/catalog.json`              | `pnpm gen:blocks` | MCP 元件目錄，交給 S4                                             |
| `generated/page-shell.draft07.json`   | `pnpm gen:blocks` | 資料庫外殼 schema，交給 S3                                        |
| `generated/schemas/<Type>.v<n>.json`  | `pnpm gen:blocks` | 每個版本的資料契約，用來檢查相容性；頁面根節點是 `Root.v<n>.json` |
| `generated/uikit-options.json`        | `pnpm sync:uikit` | uikit 每個樣式函式的選項快照                                      |
| `dist/validator.edge.mjs`（不進版控） | `pnpm build`      | Edge 單檔驗證器，交給 S3 與 S4                                    |

產生的檔案要 commit。`pnpm test` 會重新產生一次並比對，不一致就失敗；它也會檢查規格、stories、MCP 目錄與編輯器欄位的欄位名稱一致，以及每個 `style()` 選項都存在於 uikit 快照。資料契約每個版本只寫一次（區塊與頁面根節點都是）：`pnpm gen:blocks` 只為新版本寫快照；契約變了卻沒改版本號，或與舊版不相容時，它直接失敗，任何檔案都不寫。已 commit 的快照永遠不改寫，測試以 JSON 內容比對快照，所以產生器的排版改變之後，舊快照照原樣保留，不必處理。

## 新增區塊

1. 寫 `src/<區塊>/spec.ts`：`defineBlockSpec({ type, label, category, description, version: 1, props, examples })`。`category` 用 `CATEGORIES` 的中文名稱之一（文字、互動、內容、版面）。`spec.ts` 不得 import React、`@heroui/*` 或 core 的主入口。
2. 寫 `src/<區塊>/view.tsx`：不加 `'use client'` 的伺服器元件，只接收規格欄位，只用 `@heroui/styles` 的樣式函式與 `tokenClass()` 畫出一般 HTML。可以在畫布上編輯的文字欄位在編輯器裡是 ReactNode，所以 props 型別要接受 `ReactNode`。
3. 在 `src/specs.ts` 的 `blockSpecs` 登記規格，在 `src/views.ts` 的 `views` 登記畫面（函式元件，或 `memo`、`forwardRef`、`lazy` 包起來的元件），各一行；少了畫面時 TypeScript 會失敗。`buildRenderConfig` 依規格自動把 props 交給畫面，編輯器設定、分類與本套件的測試也都依 `blockSpecs` 產生，測試檔不必修改。需要自訂的欄位介面時才寫 `editor.tsx`。
4. 用到 `style()` 時，把 uikit 有、但不開放的選項與理由寫進 `src/style-decisions.ts`。`token()` 欄位的每個值都要在 `src/blocks.css` 有對應的 `tcb-*` class；欄位名稱不是 `paddingY` 或 `gap` 時，還要在 `src/token-classes.ts` 的 `TOKEN_PURPOSES` 寫上它的用途，新的用途要在同一檔的 `TOKEN_CLASS_PURPOSES` 寫上 class 前綴與 CSS 屬性。`styles.spec.ts` 會檢查這些，也檢查 `blocks.css` 用到的每個 `--tc-*` 變數都存在於 vendor 的 tokens。
5. 執行 `pnpm gen:blocks`，commit 產生的 stories 與 `generated/` 檔案。新區塊要在編輯器欄位快照 `src/__tests__/__snapshots__/editor-fields.spec.ts.snap` 加一筆：測試以 `jest --ci` 執行，不會自動寫入，要用下方的 `-u` 指令寫入，連同 `.snap` 一起 commit。最後跑 `pnpm verify`。

修改既有區塊時只允許相容修改：新增有預設值的欄位、放寬上下限、新增選項或允許的區塊要把 `version` 加 1；只改標籤、說明、範例或選項順序不必。不相容的修改改成新增區塊類型，舊類型設 `deprecated: true`。頁面根節點（`src/root/spec.ts`）也一樣要加 `version`，但它無法改用新類型，所以只能做相容修改。

編輯器欄位快照記錄每個區塊與頁面根節點的 `fields` 與 `defaultProps`。改了欄位之後這個測試會失敗：確認 diff 是預期的修改，再執行 `pnpm --filter @tzuchi/tceditor-blocks test -u src/__tests__/editor-fields.spec.ts` 更新快照，連同 `.snap` 一起 commit。

## 樣式

- 不使用 inline style，公開頁才能採用嚴格的 CSP。token 值對應成 `tcb-` 開頭的 class（例如 `tcb-py-48`、`tcb-gap-24`）。
- 顏色只用 HeroUI 的主題變數（例如 `var(--surface)`）或基礎色 token（例如 `--tc-color-blue-900`），不用語意色 `--tc-color-*`：作業系統切換深色模式時，tokens.css 會翻轉語意色。
- 不載入外部字型或 CDN。字型取自 tokens 的 `--tc-font-family-base`，沒有安裝 Noto Sans TC 的裝置會改用系統字型。
- `@heroui/styles` 與 `@tzuchi/tokens` 以 `link:` 指向 `vendor/uikit`。快照不得手改，用 `pnpm sync:uikit` 更新。HeroUI 以 Apache-2.0 授權，見 `vendor/uikit/heroui/LICENSE`。

## Edge 單檔驗證器

`pnpm build` 以 esbuild 把 `src/validator.ts` 打包成 `dist/validator.edge.mjs`：單一 ESM 檔，內含 zod、`@tzuchi/tceditor/rules` 與 8 個區塊的規格，可在 Supabase Edge Function 這類環境直接 import：

```ts
import { validatePageJson } from "./validator.edge.mjs";
```

打包的是 core 已建置的 `dist/rules.mjs`。`pnpm build` 經由 turbo 先重建 core；只建置本套件時要用 `pnpm exec turbo run build --filter=@tzuchi/tceditor-blocks`，它同樣會先建置 core。`pnpm --filter @tzuchi/tceditor-blocks build` 只執行 `scripts/build-edge.mjs`，core 的 `dist` 是什麼版本就打包什麼版本：修改 core（例如 `isSafeHref` 或 normalize）之後若沒有重建，打包出來的仍是舊規則，而 `pnpm check:edge` 抓不到這種情況，因為它比對的原始碼版也讀同一份過期的 core `dist`。

`pnpm check:edge` 確認它不 import 任何外部模組（包括 `node:` 模組）、沒有 `react` 與 `@tiptap` 字樣、gzip 後不超過 60 KB，並用 `src/__fixtures__/validator-cases.json` 與依上限產生的原始輸入（大小、JSON、區塊數）比對它與原始碼版的完整結果（資料、提示與訊息）。案例檔也寫明預期的提示，其中幾筆是需要清理的富文字（不安全的連結、欄位不開放的節點與格式、對齊方式、只寫 href 的連結），所以打包版的富文字清理和原始碼版不同時，檢查會失敗。在真正的 edge-runtime 上執行是 S3 的工作。

## 測試

```sh
pnpm --filter @tzuchi/tceditor-blocks test
pnpm --filter @tzuchi/tceditor-blocks typecheck
```

- jest 與 ts-jest，以 `jest --ci` 執行（不會自動寫入新的快照），測試放在 `src/**/__tests__/`。測試會讀 repo 根目錄的四項：`.prettierrc.json` 與 `.editorconfig`（產生的 stories 依 Prettier 的設定排版後再比對；目前沒有 `.editorconfig`，加上後也會生效）、`vendor/uikit/**` 與 `apps/showcase/public/demo-assets/**`，所以 `turbo.json` 的 `@tzuchi/tceditor-blocks#test` 把這四項列在 `inputs`。`typecheck` 經由 `link:` 檢查 `vendor/uikit` 的 `.ts` 原始檔，所以 `@tzuchi/tceditor-blocks#typecheck` 也把 `vendor/uikit/**` 列在 `inputs`。
- 本套件經由 `workspace:*` 使用 core 建置後的 `dist`。修改 core 之後，單獨執行本套件的測試前先 `pnpm --filter @tzuchi/tceditor build`。
