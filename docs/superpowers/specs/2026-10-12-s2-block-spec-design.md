# S2：元件規格（唯一 schema）與示範區塊（設計規格）

- 日期：2026-10-12
- 狀態：已核准（2026-10-12）；2026-10-18 更正第 12 節的 HeroUI 授權；2026-10-19 實作完成
- 實作計畫：`docs/superpowers/plans/2026-10-19-s2-block-spec.md`
- 上層文件：`2026-10-08-tzuchi-puck-roadmap.md`
- 依據：
  - S2 探索彙整與 7 項技術驗證（2026-10-09 至 10-10）。本文引用的實測數字都來自這些驗證，必要的結果已直接寫進本文。
  - 2026-10-10 至 10-12 與使用者的問答（第 2 節）與四段設計確認。

## 1. 目標

完成之後：

1. **每個區塊只有一份規格**（zod）。編輯器欄位、Storybook、MCP 元件目錄、存檔驗證器都從這份規格產生，中文標籤只寫一次。
2. **有 8 個可以上線品質的示範區塊**，畫面用 tzuchi uikit 的 HeroUI 線元件，套用慈濟主題。
3. **有一個示範站**，可以在編輯器拼出活動頁、按發布、在公開頁看到由伺服器產生的 HTML。它同時用來展示 tceditor 能做到哪裡（使用者：「目前我想知道的是 puck 可做到什麼地步」）。
4. **S3（後端）與 S4（MCP）需要的東西都已備妥**：可在 Edge Function 執行的單檔驗證器、資料庫用的外殼 schema、MCP 元件目錄。

**假設（使用者沒有更正，列在這裡供確認）**：公開頁需要被搜尋引擎收錄，所以公開頁由伺服器產生完整 HTML。

**成功標準**：

- 新增一個區塊只需要寫「規格」和「畫面」兩個檔，在區塊清單登記一行，再執行 `pnpm gen:blocks`；編輯器包裝檔只在需要時才寫。
- 規格、stories、MCP 目錄、uikit 選項之間只要有一處不一致，`pnpm verify` 就會失敗。
- 帶有 `javascript:` 連結、未宣告欄位、不允許的巢狀，或超過上限的頁面資料，一定會被驗證器拒絕，錯誤訊息會標出位置並用中文說明。
- 公開頁不會載入任何編輯器程式碼。

## 2. 已定案的決策

| # | 問題 | 決定 | 日期 |
|---|---|---|---|
| S2-D1 | 第一個用途 | 活動頁、專題頁這類單頁，以通用區塊為主 | 10-10 |
| S2-D2 | 區塊畫面用哪套元件 | tzuchi uikit 的 HeroUI 線（`spike/heroui-v3`，也就是 staging.tzuchi-uikit.pages.dev 那套） | 10-11 |
| S2-D3 | 區塊放哪個 repo | 全部放在 tceditor：規格、畫面、編輯器設定、驗證器、MCP 目錄、區塊 Storybook。uikit 不依賴 tceditor | 10-11 |
| S2-D4 | 多語 | 每個語言一份頁面。區塊規格不含多語結構；頁面之間的翻譯關聯留給 S3 | 10-11 |
| S2-D5 | 編輯者能動多少樣式 | 白名單：只開放明確列出的選項，新選項由工程師加入 | 10-11 |
| S2-D6 | 誰寫、誰檢查規格 | 工程師用 zod 撰寫；設計師在區塊 Storybook 檢查中文標籤、選項順序和預設值 | 10-12 |
| S2-D7 | 規格改版 | 只允許相容修改。不相容的修改改成新增區塊類型（例如「按鈕 v2」），舊類型從選單隱藏，保留到沒有頁面使用為止。規格預留 `version`，日後真的需要時才加升級程式 | 10-12 |
| S2-D8 | 範圍 | 示範區塊加示範頁，不做其他區塊。原本列的「區段／多欄」拆成兩個區塊，共 8 個 | 10-12 |
| S2-D9 | 規格格式 | 路線 A：以 zod v4 為唯一來源；轉換器只讀 zod 輸出的 JSON Schema（2020-12）加 `x-*` 擴充欄位 | 10-12 |
| S2-D10 | 編輯器介面 | 新增子專案 S7「編輯器視覺改版」，排在 S2 之後，只改視覺 | 10-12 |
| S2-D11 | 「符合 Storybook 規格」 | (1) stories 用 CSF3，Storybook 版本與 uikit 相同，可以掛進 uikit 的 Storybook；(2) 白名單的每個選項都必須存在於 uikit 元件中，由自動檢查保證 | 10-12 |

## 3. 架構

```
                 每個區塊一份規格（zod）
                          │
           ┌──────────────┼────────────────┐
           ▼              ▼                ▼
      JSON Schema     zod 驗證器      區塊畫面（uikit 元件）
    （中文標籤、選項、     │                 │
      預設值）            │          ┌──────┴──────┐
    │      │      │       │          ▼             ▼
    ▼      ▼      ▼       ▼       編輯器預覽      公開頁
  編輯器 Storybook MCP  存檔 API   （iframe）   （伺服器產生 HTML）
  欄位   stories   目錄  （S3）、
                        MCP 寫入（S4）
```

### 3.1 repo 內的位置

| 位置 | 套件名稱 | 新增或修改 | 負責什麼 |
|---|---|---|---|
| `packages/core` | `@tzuchi/tceditor` | 小幅修改 | 新增不含 React 的入口 `@tzuchi/tceditor/rules`，並修正既有問題（第 11 節） |
| `packages/spec` | `@tzuchi/tceditor-spec` | 新增 | 撰寫規格的工具、四個轉換器、整頁驗證器。純 TypeScript，不依賴 React，也不依賴 uikit |
| `packages/blocks` | `@tzuchi/tceditor-blocks` | 新增 | 8 個區塊、頁面根節點規格、編輯器與公開頁的 Puck 設定、產生的檔案、樣式 |
| `apps/storybook` | `@tzuchi/tceditor-storybook` | 新增 | 區塊專用的 Storybook |
| `apps/showcase` | `@tzuchi/tceditor-showcase` | 新增 | 示範站：編輯器、發布 API、公開頁 |
| `vendor/uikit` | — | 新增 | 從 uikit 指定 commit 複製來的 HeroUI 線套件快照（第 12 節） |
| `apps/demo` | `demo` | **不動** | 既有的 Puck 示範與冒煙測試 |

- 兩個新套件（spec、blocks）與兩個新 app 都是 `private`、版本 `0.1.0`。兩個套件以原始碼形式提供（`exports` 指向 `.ts`），由使用端轉譯，和 apps/demo 使用 core 的方式相同。只有驗證器另外打包成單檔（第 6.4 節）。
- 示範站沒有放進 apps/demo，原因有兩個：HeroUI 需要 Tailwind 的全域樣式，會改變既有 demo 的外觀；公開頁需要自己的根 layout，才能把 `data-theme` 放在 `<html>` 上。分開之後，既有 demo 和它的冒煙測試完全不受影響。
- `pnpm-workspace.yaml` 加入 `apps/showcase` 與 `apps/storybook`。

### 3.2 依賴方向

```
vendor/uikit（HeroUI 線快照）
        ▲
packages/blocks ──► packages/spec ──► @tzuchi/tceditor/rules（core）
        ▲                                   ▲
apps/showcase、apps/storybook ──────────────┘（也使用 core 的 Puck、Render）
```

- `packages/spec` 只依賴 `zod` 與 `@tzuchi/tceditor/rules`。
- uikit 不需要做任何修改，也不依賴 tceditor。

### 3.3 每個區塊的檔案

```
packages/blocks/src/<區塊>/
  spec.ts               規格（zod）。不得 import React、uikit 或 core 的主入口
  view.tsx              畫面。只接收依規格欄位挑出的 props
  editor.tsx            （選用）編輯器專用的包裝或自訂欄位介面
  <Block>.stories.tsx   由產生器產生，不可手改
```

`render` 函式不用每個區塊各寫一份：`createRenderConfig()` 依規格自動把 props 對應到畫面（第 7.1 節）。

## 4. 規格的寫法

### 4.1 範例

```ts
export const buttonSpec = defineBlockSpec({
  type: "Button",
  label: "按鈕",
  category: "互動",
  description: "導向其他頁面或網站的按鈕。",
  version: 1,
  props: z.strictObject({
    label: z.string().min(1).max(40).default("立即報名")
      .meta({ title: "按鈕文字" }),
    href: link().meta({ title: "連結網址" }),
    variant: style("button", "variant", ["primary", "secondary", "outline"])
      .default("primary")
      .meta({ title: "樣式", "x-labels": { primary: "主要", secondary: "次要", outline: "外框" } }),
    size: style("button", "size", ["sm", "md", "lg"])
      .default("md")
      .meta({ title: "大小", "x-labels": { sm: "小", md: "中", lg: "大" } }),
    fullWidth: z.boolean().default(false).meta({ title: "滿版寬度" }),
  }),
  examples: [
    { name: "主要按鈕", props: { label: "立即報名", href: "/register" } },
    { name: "外框、滿版", props: { label: "了解更多", href: "/about", variant: "outline", fullWidth: true } },
  ],
});
```

`defineBlockSpec` 的欄位：

| 欄位 | 規則 |
|---|---|
| `type` | 區塊類型名稱，存進頁面資料。符合 `^[A-Z][A-Za-z0-9]{0,63}$`，不得是 `root` |
| `label`、`category`、`description` | 中文。顯示在編輯器、Storybook 和 MCP 目錄；`description` 最多 4,096 字元 |
| `version` | 正整數，從 1 開始（第 4.6 節） |
| `deprecated` | 選用，預設 `false`。設為 `true` 時從編輯器選單隱藏，MCP 目錄也會標示不可新增；既有頁面仍能顯示與編輯 |
| `props` | `z.strictObject(...)`，寫法規則見第 4.3 節 |
| `examples` | 至少一個。每個範例都必須通過驗證；用來產生 stories，也放進 MCP 目錄 |

頁面根節點（頁面標題、說明）用同樣的寫法，以 `definePageRoot()` 宣告（第 8.9 節）。

### 4.2 欄位種類

共 11 種。最右兩欄是轉換器的對應結果。

| 種類 | 寫法 | 存進資料庫的值 | 編輯器欄位 | Storybook 控制項 |
|---|---|---|---|---|
| 短文字 | `z.string()`；加 `"x-inline": true` 可在畫布上直接編輯 | 字串 | `text`（`x-inline` 時 `contentEditable: true`） | text |
| 長文字 | `z.string()` 加 `"x-field": "textarea"` | 字串 | `textarea` | text |
| 數字 | `z.number().int().min().max()` | 數字 | `number`（min、max、step） | 兩端都有界時用 range，否則 number |
| 單選 | `choice([...])`、`style(...)` 或 `token(...)`，加 `x-labels` | 字串 | 4 個選項以內用 `radio`，否則 `select` | radio 或 select，帶中文標籤 |
| 是／否 | `z.boolean()` | 布林 | `radio`（是／否）。fork 沒有 checkbox 欄位 | boolean |
| 連結網址 | `link()`；選填用 `link({ optional: true })` | 字串 | `text` | text |
| 富文字 | `richText({ features: [...] })` | Tiptap JSON（`RichTextDoc`） | `richtext`，`contentEditable: true`，只開放列出的功能 | 不提供，改用範例 story 呈現 |
| 清單 | `z.array(z.strictObject({...})).min().max()`，加 `x-item-label` | 物件陣列 | `array`（min、max、`getItemSummary`） | object |
| 群組 | `z.strictObject({...})` | 物件 | `object` | object |
| 放置區 | `slot({ allow: [...] })` 或 `slot({ disallow: [...] })` | 區塊陣列 | `slot` | 不提供（slot 由範例 story 帶入子區塊） |
| 圖片 | `image()` | `{ assetId, alt, decorative }` | `custom`，挑選介面由編輯器層提供 | 不提供，改用範例 story 呈現 |

輔助函式的細節：

- **`link()`**：字串，最長 2,048 字元，必須通過 `isSafeHref`（只接受 http、https、mailto、tel 與站內路徑）。必填版本不接受空字串；選填版本的空字串表示「沒有連結」。
- **`richText({ features })`**：`features` 可以列 `bold`、`italic`、`underline`、`strike`、`code`、`link`、`bulletList`、`orderedList`、`blockquote`、`heading`、`horizontalRule`、`hardBreak`。`paragraph`、`text`、`doc` 永遠開放，不能關閉，避免 B-01 那類資料遺失。值會先經過 `normalizeRichText`，再依 `features` 過濾（第 6.2 節），寫法是 `.overwrite()`，不能用 `.transform()`，因為 `.transform()` 會讓 JSON Schema 輸出失敗。
- **`slot()`**：值是 `{ type, props }` 外殼的陣列，子區塊由整頁驗證器逐層檢查。`allow` 與 `disallow` 只能擇一，名稱必須是已登記的區塊類型。
- **`image()`**：`assetId` 符合 `^[A-Za-z0-9_-]{1,64}$`；`alt` 最多 200 字元；`decorative` 為 `false` 時 `alt` 去掉空白後不得為空。S2 只檢查 `assetId` 的格式，不檢查媒體是否存在（媒體庫是 S3 的範圍）。
- **`choice(values)`**：一般的固定選項，例如圖片比例。
- **`style(component, key, values)`**：從 uikit 元件的樣式選項中挑白名單，例如 `style("button", "variant", [...])`。它只在 meta 記下 `x-style: { component, key }`；選項是否真的存在，由第 5.5 節的自動檢查負責。
- **`token(group, values)`**：跨元件共用的設計概念，值用 `@tzuchi/tokens` 的名稱，例如間距 `token("space", ["16", "32"])` 對應 `--tc-space-16`、`--tc-space-32`。

### 4.3 寫法規則（違反時測試會失敗）

1. **`.meta()` 一律放在鏈的最後**，例如 `.default()` 要寫在 `.meta()` 之前。meta 放在中間時，經過 `.optional()`、`.nullable()`、`.pipe()` 之後會遺失或位移（技術驗證實測）。
2. 每個 schema 只呼叫一次 `.meta()`。重複呼叫時，後一次會整個蓋掉前一次的同名 key。
3. **物件一律用 `z.strictObject`**，讓 zod、Ajv 與資料庫對「多出來的欄位」有同樣的判斷（一律拒絕）。
4. **陣列一律是物件陣列**。Puck 的 array 欄位不接受字串陣列，例如標籤寫成 `[{ label: "志工" }]`。
5. **區塊根節點不掛 `.meta({ id })`**。掛了之後，輸出的根節點會變成 `$ref`，MCP 會丟掉或攤平這個工具。
6. meta 只能放 `title`、`description`、`examples`、`deprecated` 和 `x-*`，值必須是 JSON。中文選項名稱統一放在 `x-labels`。
7. **欄位名稱**符合 `^[A-Za-z][A-Za-z0-9_-]{0,63}$`，也就是 Puck 命名限制與 MCP key 規則的交集。不得使用 `id`、`puck`、`editMode`、`children` 這幾個保留字。
8. **含有放置區的欄位，名稱全頁保留**：同一個名稱在所有區塊裡都必須是同樣的結構。例如 `content` 一律是放置區，`columns` 一律是「每項含一個 `content` 放置區」的清單。資料庫的外殼 schema 是依名稱辨認放置區的（第 6.5 節）。
9. **`spec.ts` 不得直接使用 JSON Schema 表達不了的方法**，例如 `.refine()`、`.superRefine()`、`.overwrite()`、`.transform()`、`.trim()`。需要時寫成 `packages/spec` 的輔助函式，並在 meta 的 `x-lost-checks` 列出這些規則，讓 MCP 與資料庫端知道伺服器會另外檢查。`link()`、`richText()`、`image()` 已內建。由 ESLint 檢查。
10. 每個欄位都要有 `title`。

`x-*` 擴充欄位用 zod 的 `GlobalMeta` 宣告型別，寫錯名稱會在編譯時報錯。

### 4.4 存進資料庫的值

- 跨元件共用的概念（間距、寬度、字級）用 tokens 的名稱，例如 `"32"`。
- 元件自己的樣式用 uikit 的值，例如按鈕的 `"primary"`。
- 中文名稱（「主要」）只用在畫面顯示，不存進資料庫。

### 4.5 白名單的初版原則

- **寧少勿多**：之後新增選項是相容修改，移除選項卻是不相容修改（第 4.6 節）。所以初版只開放確定要用的選項。
- 第 8 節列的白名單是工程師的初版，由設計師在 Storybook 檢查後調整。
- uikit 元件有、但沒有開放的選項，要在 `packages/blocks/src/style-decisions.ts` 寫下不開放的理由（第 5.5 節）。

### 4.6 版本與相容修改

- **相容修改**（版本號加 1）：新增有預設值的欄位、放寬上下限、新增選項、新增 `allow` 的區塊類型。
- **不必改版本號**：修改中文標籤、說明、範例或選項順序。這些不影響存進資料庫的值。
- **不相容修改**（禁止）：移除欄位或選項、改名、改型別、收緊上下限、新增沒有預設值的必填欄位、移除 `allow` 的區塊類型。需要這類修改時，改成新增區塊類型，舊類型設 `deprecated: true`。
- 每個版本都會存一份「資料契約」快照（`packages/blocks/generated/schemas/<type>.v<version>.json`），也就是去掉標籤、說明、範例之後的輸入 schema，選項當作集合比較。契約變了但版本號沒變，或者兩版之間出現不相容的差異，測試就會失敗（第 13.1 節）。
- **頁面資料不記錄版本號。** 因為只允許相容修改，舊資料永遠符合最新規格。`version` 目前只出現在規格與 MCP 目錄，留給日後需要升級程式時使用。

## 5. 四種產物

編輯器欄位、Storybook stories、MCP 目錄在本節說明；第四種產物「驗證器」在第 6 節。

### 5.1 JSON Schema 的輸出設定

| 用途 | 設定 |
|---|---|
| 編輯器、Storybook、MCP | `target: "draft-2020-12"`、`io: "input"`、`reused: "inline"`、`cycles: "ref"` |
| 資料庫外殼 | 不用 zod 的輸出，由產生器自己產生 draft-07 schema（第 6.5 節） |

不用 `reused: "ref"`（產生的名稱不穩定），也不用 OpenAPI 3.0 格式。`io: "input"` 讓有預設值的欄位不會被標成必填。

### 5.2 編輯器欄位

- `toPuckFields(spec)` 讀 JSON Schema，依第 4.2 節的表格產生 Puck 的 `fields`；`defaultProps` 取自 schema 的 `default`。
- 型別用 `satisfies Fields<Props>` 接上（`Props` 是 `z.output<typeof spec.props>`），所以欄位名稱寫錯會編譯失敗。fork 的 `Fields<Props>` 只檢查欄位名稱，欄位型別的對應由轉換器的測試保證。
- 編輯器在執行時才從規格算出欄位，所以編輯器會載入 zod（約 28 KB gzip）。公開頁不會載入 zod。

### 5.3 Storybook stories

- `pnpm gen:blocks` 為每個區塊產生 `<Block>.stories.tsx`，格式是標準 CSF3：
  - `title: "區塊/按鈕"`，並指定 ASCII 的 `id: "blocks-button"`，story 的 export 名稱也用 ASCII。這樣 story 網址穩定，掛進 uikit 時也不會有編碼問題。
  - `args` 是規格的預設值，`argTypes` 由 `toArgTypes(spec)` 產生，包含中文標籤、選項和上下限。
  - 一個「預設」story，加上每個 `examples` 各一個 story。
  - `parameters.docs.description.component` 取自 `description`；開啟 autodocs。
- story 用 tceditor 的 `<Render>` 渲染一個只有這個區塊的頁面。因此 Storybook 顯示的結果和公開頁完全相同，放置區的子區塊也能透過範例帶入。

### 5.4 MCP 元件目錄

`packages/blocks/generated/catalog.json`，給 S4 使用：

```json
{
  "catalogVersion": 1,
  "blocks": [
    {
      "type": "Button",
      "label": "按鈕",
      "category": "互動",
      "description": "導向其他頁面或網站的按鈕。",
      "version": 1,
      "deprecated": false,
      "props": { "type": "object", "properties": { "...": "..." }, "additionalProperties": false },
      "slots": {},
      "examples": [{ "name": "主要按鈕", "props": { "label": "立即報名", "href": "/register" } }]
    }
  ],
  "root": { "props": { "type": "object", "...": "..." } }
}
```

- `props` 是 JSON Schema 2020-12，根節點一律是 `type: "object"`，沒有 `oneOf`、`anyOf`、`allOf`，也沒有 `$ref`。
- 移除 `x-puck`、`x-storybook` 這類只給編輯器或 Storybook 用的擴充欄位；保留 `x-labels` 與 `x-lost-checks`，讓 AI 知道選項的意思和伺服器會另外檢查哪些規則。
- `slots` 列出每個放置區允許的區塊類型，已經把 `allow`／`disallow` 展開成明確的清單。
- 寫入工具的設計（一次操作一個節點、id 由伺服器產生）是 S4 的範圍，S2 只提供目錄與驗證器。

### 5.5 自動檢查

| # | 檢查 | 失敗條件 |
|---|---|---|
| 1 | 產生的檔案是否同步 | 重新執行 `pnpm gen:blocks` 的結果和 repo 裡的檔案不同（stories、目錄、外殼 schema、schema 快照） |
| 2 | 白名單是否存在於 uikit | 規格開放的選項不在 uikit 選項快照中，例如 uikit 刪掉或改名了某個選項 |
| 3 | uikit 是否有新選項 | 規格用到的樣式 key 出現新選項，但既沒有開放，也沒有在 `style-decisions.ts` 寫下不開放的理由 |
| 4 | 三種產物的欄位是否一致 | 編輯器欄位、Storybook 控制項、MCP 目錄的欄位名稱和規格不完全相同 |

uikit 選項快照是 `packages/blocks/generated/uikit-options.json`，由同步腳本掃描 vendor 裡 `@heroui/styles` 的樣式定義產生（做法與 PoC 的 `tvRegistry` 相同）。測試會重新掃描一次，確認快照和 vendor 一致。

## 6. 存檔驗證與資安

### 6.1 原則

**只有存檔 API 裡的 zod 驗證器能當把關者。** 技術驗證證實其他三層都擋不住：

- 編輯器畫面上的限制，直接送出頁面資料就能繞過。
- 資料庫的 JSON Schema 檢查只能做大致結構。完整檢查在大頁面上會耗盡記憶體（2026-10-10 在共用 Docker VM 上造成全域 OOM），而且無法中斷。
- 只要經過 JSON Schema，`isSafeHref` 和富文字清理就會消失：Ajv、pg_jsonschema、MCP SDK 的 Ajv 驗證器都會放行 `javascript:` 連結。

### 6.2 整頁驗證器

`createPageValidator({ blocks, root })` 產生 `validatePage(data)` 與 `validatePageJson(raw)`。`@tzuchi/tceditor-blocks/validator` 匯出已綁定 8 個區塊的版本。

檢查依下列順序進行，錯誤會全部收集起來，而不是遇到第一個就停：

| # | 檢查 | 不合格時 |
|---|---|---|
| 1 | 原始資料最多 2 MB（2,097,152 bytes，以 UTF-8 計算），在解析 JSON 之前檢查 | 拒絕 |
| 2 | 必須是合法的 JSON | 拒絕 |
| 3 | 頂層只能有 `root`、`content`、`zones`；`root` 必須是 `{ props }`；`zones` 必須不存在或是空物件（不接受舊的 DropZone 格式） | 拒絕 |
| 4 | 每個節點只能有 `type`、`props`；`readOnly` 會被移除，因為它由伺服器計算 | 其他欄位拒絕 |
| 5 | `type` 必須是已登記的區塊。查表只看自有屬性，所以 `constructor`、`__proto__` 這類名稱會被拒絕 | 拒絕 |
| 6 | `props.id` 符合 `^[A-Za-z0-9_-]{1,64}$`、不是 `root`，而且整頁不重複 | 拒絕 |
| 7 | 放置區巢狀最多 32 層；整頁最多 5,000 個區塊。走訪不用遞迴，避免堆疊溢位 | 拒絕 |
| 8 | 每個區塊的 props 用該區塊的 zod schema 檢查：型別、長度、選項、未宣告的欄位、連結網址、圖片的替代文字 | 拒絕 |
| 9 | 缺少的欄位用預設值補齊後再存，因為公開頁的 `<Render>` 不會補預設值 | 補齊 |
| 10 | 放置區只能放允許的區塊（重用 core 的 `isComponentAllowed`） | 拒絕 |
| 11 | 富文字先經 `normalizeRichText`，再依欄位的 `features` 過濾：不認得或沒開放的格式變成純文字，危險連結只保留文字 | 清理後存，並記一筆提示 |
| 12 | 根節點的 props 用頁面根節點規格檢查 | 拒絕 |

- **富文字採用清理，其他欄位直接拒絕。** AI 產生的內容和舊網站轉進來的資料常有細微差異，全部拒絕會太嚴格；其他欄位出錯通常是真的有問題。
- 最多回報 100 筆錯誤，避免回應過大。

回傳格式：

```ts
type Issue = {
  path: (string | number)[];   // 從頁面根節點起算，例如 ["content", 0, "props", "href"]
  pathText: string;            // "content[0].props.href"
  blockType?: string;          // "Button"
  code: IssueCode;
  message: string;             // 中文，例如「按鈕的『連結網址』只接受 http、https、mailto、tel 或站內路徑。」
};

type ValidateResult =
  | { ok: true; data: Data; notices: Issue[] }   // data 已補齊預設值、清理過富文字
  | { ok: false; errors: Issue[] };
```

- `code` 的值：`too_large`、`invalid_json`、`invalid_shape`、`legacy_zones`、`unknown_type`、`invalid_id`、`duplicate_id`、`too_deep`、`too_many_blocks`、`unknown_prop`、`invalid_value`、`unsafe_href`、`alt_required`、`not_allowed_here`、`richtext_cleaned`（只出現在 `notices`）。
- 中文訊息要說出區塊名稱、欄位名稱，以及允許的值或範圍。zod 預設訊息（例如「expected string, received undefined」）不夠讓 AI 修正，所以每種 `code` 都有自己的訊息。中文訊息只在驗證器呼叫時以參數傳入，不修改 zod 的全域設定。

### 6.3 版本鎖定

- `zod` 鎖在 **4.6.5**（不加 `^`），並用 pnpm `overrides` 讓所有依賴都用同一份。原因：多份 zod 會透過 `globalThis` 共用設定，而且 patch 版也曾移除 API。`pnpm-workspace.yaml` 的這筆 override 要附註原因。

### 6.4 給 Edge Function 的單檔驗證器

- `packages/blocks` 用 esbuild 打包出 `dist/validator.edge.mjs`：單一 ESM 檔，內含 zod、`@tzuchi/tceditor/rules` 與 8 個區塊的規格。
- 自動檢查：
  - 檔案不能 import 任何外部模組，也不能出現 `react`、`@tiptap`、`node:` 字樣。
  - gzip 後不超過 60 KB。技術驗證中單一區塊的驗證器約 28 KB，超過門檻通常代表誤把畫面或編輯器程式打包進來。
  - 用同一組測試資料跑原始碼版與打包版，結果必須相同。
- 在真正的 Supabase edge-runtime 上執行，是 S3 的工作。

### 6.5 資料庫用的外殼 schema

- `packages/blocks/generated/page-shell.draft07.json`，給 S3 以 pg_jsonschema 做第二道防線。
- 只檢查結構：`content` 是陣列、每個節點的 `type` 在已登記的清單內、`props.id` 是符合規則的字串、放置區（依第 4.3 節保留的名稱辨認）裡是節點陣列。
- **不使用 `oneOf`／`anyOf`**，也不依區塊類型分別檢查 props。這是為了避免遞迴組合子造成的記憶體爆炸。
- S2 只用 Ajv（draft-07）測試。在 Postgres 上的測試留到 S3，並且要在有記憶體上限的拋棄式 container 裡進行。

### 6.6 防止公開頁載入編輯器

公開頁只要從 `@tzuchi/tceditor` 主入口 import 任何執行期的值，就會多載入約 170–240 KB（gzip）的編輯器程式。防範方式：

- ESLint `no-restricted-imports`（允許 `import type`）：
  - `spec.ts`：不得 import `react`、`@heroui/*`、`@tzuchi/tceditor`（主入口）。
  - `view.tsx`、`render-config.ts` 與示範站的公開頁：不得 import `@tzuchi/tceditor` 主入口，只能用 `@tzuchi/tceditor/rsc` 與 `@tzuchi/tceditor/rules`。
  - import `@heroui/react` 的檔案必須以 `'use client'` 開頭。
- 建置產物掃描：示範站 build 之後，掃描公開頁 `/activity` 的瀏覽器端 chunk，不得出現編輯器才有的標記字串。同時掃描 `/activity/edit` 當對照組，確認那個標記確實存在，以免掃描本身失效卻誤判通過。

## 7. 區塊畫面與編輯器整合

### 7.1 畫面

- 每個 `view.tsx` 只接收「依規格欄位名稱挑出」的 props，**不把 Puck 的 props 整包展開傳入**，因為裡面有函式（例如 `renderDropZone`），會讓伺服器渲染失敗。
- `createRenderConfig({ blocks, views, assets })` 自動處理：
  - 放置區：把 Puck 的 slot 渲染成 `children` 類型的 ReactNode 傳給畫面。
  - 富文字：由 core 的共用渲染器轉成 ReactNode。
  - 圖片：用 `assets.get(assetId)` 換成 `{ src, width, height }`，在伺服器端完成。
  - 編輯器中可以直接編輯的文字欄位，在編輯器裡會是 ReactNode，所以畫面要接受 `ReactNode`。
- 畫面使用 `@heroui/react` 元件時，檔案必須是 `'use client'`。只用 `@heroui/styles` 樣式函式、不需要互動的畫面可以不加，公開頁因此少送 JavaScript。
- **按鈕輸出 `<a href>`**，樣式用 uikit 的 `buttonVariants`（和 Button 元件是同一份樣式）。uikit 的 Button 是 `<button>`，用來觸發動作，不能用來導覽，也不利於搜尋引擎。
- 間距等 token 值轉成 CSS class（例如 `.tcb-pad-32`），不用 inline style，以便公開頁採用嚴格的 CSP。

### 7.2 樣式與主題

- `packages/blocks/styles.css` 依序載入：Tailwind → `@heroui/styles` → `@tzuchi/tokens/tokens.css` → 慈濟主題，並用 `@source` 指向 vendor 裡的 HeroUI 元件與區塊畫面。示範站與 Storybook 都只 import 這一個檔。
- 主題屬性放在 `<html data-theme="tzuchi">`。只放在外層 div 時，Modal 這類 portal 到 body 的元件會失去主題。
- 不載入外部字型或 CDN（tceditor 的資安規則禁止第三方請求）。慈濟主題的字型來自 tokens 的 `--tc-font-family-base`（`'Noto Sans TC', system-ui, …`），沒有安裝 Noto Sans TC 的裝置會改用系統字型，不會發出外部請求。uikit 的 Storybook 從 Google Fonts 載入 Inter，區塊 Storybook 不沿用這個做法。是否把 Noto Sans TC 打包進來，留給 S7 與公開站一起決定。

### 7.3 編輯器設定

`createEditorConfig({ assets })` 回傳給 `<Puck>` 用的 `Config`：

- `components`：每個區塊的 `label`、`fields`、`defaultProps`、`render`。`render` 與公開頁共用，`editor.tsx` 有包裝時才套用包裝。
- `categories`：文字（標題、段落）、互動（按鈕）、內容（卡片、標籤列、圖片）、版面（區段、多欄），另有一個隱藏的分類放 `deprecated` 區塊。
- `root`：頁面標題與說明的欄位。
- 「圖片」欄位用自訂欄位介面（`editor.tsx`），從 `assets` 列出可選的圖片：

```ts
type Asset = { id: string; src: string; width: number; height: number; label: string };
type AssetSource = {
  list(): Promise<Asset[]>;
  get(id: string): Asset | undefined;
};
```

- S2 的 `AssetSource` 是示範站內附的 6 張圖；S3 換成媒體庫，介面不變。
- `get` 是同步函式，因為公開頁在渲染途中查圖。S3 的做法是渲染前先一次查出這頁用到的所有圖片，再提供同步的 `get`。
- 公開頁的 `createRenderConfig` 也接收同一個 `AssetSource`（只用到 `get`）。

## 8. 八個示範區塊

「白名單」欄列的是初版，由設計師在 Storybook 檢查後調整（第 4.5 節）。

### 8.1 標題 `Heading`（分類：文字）

| 欄位 | 種類 | 規則與預設值 |
|---|---|---|
| `text` 標題文字 | 短文字，可在畫布上直接編輯 | 1–120 字，預設「標題文字」 |
| `level` 層級 | `style("typography", "type", ["h1", "h2", "h3", "h4"])` | 預設 `h2`；同時決定 HTML 標籤 |
| `align` 對齊 | `style("typography", "align", ["start", "center", "end"])` | 預設 `start`（靠左／置中／靠右） |

畫面：uikit Typography 樣式。

### 8.2 段落 `Paragraph`（分類：文字）

| 欄位 | 種類 | 規則與預設值 |
|---|---|---|
| `body` 內文 | 富文字，可在畫布上直接編輯；開放 `bold`、`italic`、`link`、`bulletList`、`orderedList`、`hardBreak` | 預設一段「請輸入內文。」 |
| `align` 對齊 | 同標題 | 預設 `start` |

畫面：core 的共用富文字渲染器，外層套 Typography 的內文樣式。富文字本身的段落對齊功能不開放，以免和區塊的 `align` 重複。

### 8.3 按鈕 `Button`（分類：互動）

| 欄位 | 種類 | 規則與預設值 |
|---|---|---|
| `label` 按鈕文字 | 短文字 | 1–40 字，預設「立即報名」 |
| `href` 連結網址 | 連結網址（必填） | 預設空字串，所以新加入的按鈕要填網址才能發布 |
| `variant` 樣式 | `style("button", "variant", ["primary", "secondary", "outline"])` | 預設 `primary` |
| `size` 大小 | `style("button", "size", ["sm", "md", "lg"])` | 預設 `md` |
| `fullWidth` 滿版寬度 | 是／否 | 預設否 |

uikit 的 `variant` 另有 `danger`、`danger-soft`、`ghost`、`tertiary`，初版不開放，理由寫在 `style-decisions.ts`。

### 8.4 卡片 `Card`（分類：內容）

| 欄位 | 種類 | 規則與預設值 |
|---|---|---|
| `title` 標題 | 短文字 | 1–80 字，預設「卡片標題」 |
| `summary` 摘要 | 長文字 | 最多 200 字，預設空白 |
| `href` 連結網址 | 連結網址（選填） | 填寫時，標題變成連結 |
| `variant` 樣式 | `style("card", "variant", ["default", "secondary"])` | 預設 `default` |
| `content` 內容 | 放置區，`allow`：段落、按鈕、標籤列、圖片 | 預設空 |

畫面：uikit Card。

### 8.5 標籤列 `TagList`（分類：內容）

| 欄位 | 種類 | 規則與預設值 |
|---|---|---|
| `tags` 標籤 | 清單，每項 `{ label }`（1–20 字），1–10 項 | 預設「志工」「環保」；清單項目以 `label` 顯示 |
| `color` 顏色 | `style("chip", "color", ["default", "accent", "success"])` | 預設 `default` |
| `variant` 樣式 | `style("chip", "variant", ["secondary", "soft"])` | 預設 `secondary` |

畫面：uikit Chip。

### 8.6 區段 `Section`（分類：版面）

| 欄位 | 種類 | 規則與預設值 |
|---|---|---|
| `background` 背景 | `style("surface", "variant", ["transparent", "default", "secondary"])` | 預設 `transparent`（無背景） |
| `paddingY` 上下留白 | `token("space", ["16", "32", "48", "64"])` | 預設 `48` |
| `content` 內容 | 放置區，`disallow`：區段（區段裡不能再放區段） | 預設空 |

畫面：uikit Surface。

### 8.7 多欄 `Columns`（分類：版面）

| 欄位 | 種類 | 規則與預設值 |
|---|---|---|
| `columns` 欄 | 清單，每項 `{ content }`，`content` 是放置區；2–3 項 | 預設 2 欄；清單項目顯示為「第 1 欄」「第 2 欄」 |
| `columns[].content` | 放置區，`allow`：標題、段落、按鈕、卡片、標籤列、圖片 | 預設空 |
| `gap` 欄距 | `token("space", ["16", "24", "32"])` | 預設 `24` |

- 用「欄位清單，每欄一個放置區」，而不是「欄數」加固定的放置區。這樣刪掉一欄時，裡面的內容會明確地一起刪除，不會留下看不見的資料。
- 寬度小於 768px（tokens 的 tablet 斷點）時改成上下排列。

### 8.8 圖片 `Image`（分類：內容）

| 欄位 | 種類 | 規則與預設值 |
|---|---|---|
| `image` 圖片 | 圖片（`assetId`、`alt` 替代文字、`decorative` 純裝飾） | 預設尚未選圖，所以要選圖才能發布 |
| `ratio` 比例 | `choice(["auto", "16:9", "4:3", "1:1"])` | 預設 `auto`（原始比例）；其他比例以裁切填滿 |
| `caption` 圖說 | 短文字 | 最多 120 字，預設空白 |

- 畫面輸出 `<figure>`、`<img>`（帶 `width`、`height` 與 `loading="lazy"`）和 `<figcaption>`。純裝飾的圖片輸出 `alt=""`。
- 還沒選圖時（編輯器與 Storybook）顯示「尚未選擇圖片」的占位框；圖片編號查不到時顯示「圖片已不存在」。兩種情況都不讓頁面出錯。

### 8.9 頁面根節點

| 欄位 | 種類 | 規則與預設值 |
|---|---|---|
| `title` 頁面標題 | 短文字 | 1–80 字，預設「未命名頁面」；輸出成 `<title>` |
| `description` 頁面說明 | 長文字 | 最多 160 字，預設空白；輸出成 meta description |

## 9. 區塊 Storybook（`apps/storybook`）

- 版本與 uikit 相同：`storybook`、`@storybook/react-vite`、`@storybook/addon-docs`、`@storybook/addon-a11y` 都鎖 **10.6.0**；`vite` 7.3.5；Tailwind 4.3.3（`@tailwindcss/vite`）。
- 設定：
  - `typescript.reactDocgen: false`。argTypes 一律由規格產生，docgen 讀不到中文標籤與預設值。
  - `core.disableTelemetry: true`。
  - stories 來源：`packages/blocks/src/**/*.stories.tsx`。
  - 工具列提供主題切換（慈濟／慈濟深色），預設慈濟主題，設定在 `<html data-theme>`。
  - 示範圖片從示範站的 `public/demo-assets` 以 `staticDirs` 提供（第 10.4 節）。
- **Storybook CLI 會寫入使用者目錄的 `~/.storybook/settings.json`**，所以 `pnpm storybook`、`pnpm storybook:build` 都透過包裝腳本執行：`HOME` 指向 `apps/storybook/.home`（gitignored），並設 `STORYBOOK_DISABLE_TELEMETRY=1`。
- `pnpm storybook` 在 `127.0.0.1:6007` 啟動。uikit 的 Storybook 慣用 6006，所以兩者可以同時開。
- **掛進 uikit 的 Storybook**（由使用者決定何時在 uikit 加入，S2 不修改 uikit）：

  ```ts
  // uikit：heroui/storybook/.storybook/main.ts 的 config 加上
  refs: {
    tceditor: {
      title: "tceditor 區塊",
      url: "http://127.0.0.1:6007", // 本機開發用；區塊 Storybook 部署後改成正式網址
    },
  },
  ```

  區塊 Storybook 部署到 Cloudflare Pages 這類靜態主機時，要允許 uikit 的網域跨域讀取 `index.json` 與 `iframe.html`（CORS）。部署位置要等使用者決定 repo 與 CI 平台後再處理。

## 10. 示範站（`apps/showcase`）

### 10.1 頁面與 API

| 路徑 | 說明 |
|---|---|
| `/activity/edit` | 編輯器。開啟時載入已發布的頁面；還沒有時載入預先排好的範例活動頁 |
| `/activity` | 公開頁。伺服器端用 `@tzuchi/tceditor/rsc` 的 `<Render>` 產生 HTML，`<title>` 與說明取自頁面根節點 |
| `GET /api/activity` | 回傳目前的頁面資料 |
| `POST /api/activity` | 發布：先跑驗證器，通過才存檔 |

- 開發伺服器綁 `127.0.0.1:3010`（`pnpm dev:showcase`），和 demo 一樣不對外開放。
- 公開頁與編輯器各有自己的根 layout：公開頁的 `<html lang="zh-Hant" data-theme="tzuchi">`；編輯器透過 `overrides.iframe` 在預覽 iframe 的 `<html>` 設定同樣的主題。

### 10.2 發布 API（模擬 S3 的存檔 API）

- 只接受 `Content-Type: application/json` 與同源請求（檢查 `Origin`），以防其他網站從瀏覽器對本機送出請求。
- 讀取請求內容時，超過 2 MB 就停止並回 413。
- 驗證失敗回 **422** 與 `{ errors: Issue[] }`；成功回 200 與 `{ notices }`，並把補齊、清理後的資料寫入 `apps/showcase/.data/activity.json`（gitignored）。寫入時先寫暫存檔再改名，避免寫到一半的檔案。
- 要還原成範例頁，刪除這個檔即可。
- S3 會把這個 API 換成 Supabase 的 Edge Function，驗證器與錯誤格式不變。

### 10.3 編輯器中的錯誤顯示

- 用 Puck 的 plugin 機制新增「發布檢查」面板，列出每筆錯誤的區塊名稱、欄位名稱與中文說明。
- 點一筆錯誤，就用 `getSelectorForId` 選取出錯的區塊，右側面板會跳到那個區塊的欄位。

### 10.4 示範內容

- **範例活動頁**（`apps/showcase/content/activity.preset.json`）：8 個區塊都用上，包含區段裡的多欄、多欄裡的卡片、卡片裡的按鈕與標籤列。範例本身也要通過驗證（有測試）。
- **6 張示範圖**：在 repo 內自行繪製的 SVG（幾何圖形與色塊，不含外部素材），涵蓋橫式、直式、正方形，用來展示比例裁切。不連到任何外部網站。
  - 檔案放在 `apps/showcase/public/demo-assets/`；Storybook 以 `staticDirs` 指向同一個資料夾。
  - 圖片清單（編號、尺寸、說明）定義在 `packages/blocks/src/demo-assets.ts`，示範站與 Storybook 共用。測試確認清單裡的每個檔案都存在，尺寸也相符。

### 10.5 能力展示對照

示範站要讓人看得出 tceditor 能做到哪裡：

| 能力 | 在示範站的哪裡 |
|---|---|
| 拖放、複製、刪除、調整順序 | 編輯器 |
| 放置區巢狀與限制（allow／disallow） | 區段、卡片、多欄 |
| 清單裡的放置區 | 多欄的每一欄 |
| 在畫布上直接編輯文字與富文字 | 標題、段落 |
| 欄位種類 | 11 種中的 9 種。數字與群組沒有適合的示範區塊，由轉換器的單元測試涵蓋 |
| 自訂欄位介面 | 圖片挑選器 |
| plugin | 「發布檢查」面板；既有的 heading-analyzer 外掛（標題大綱） |
| 手機、平板、桌面預覽 | `viewports` 設成 tokens 的斷點：375、768、1024 px |
| 伺服器端產生公開頁、公開頁不含編輯器 | `/activity` |
| 發布時的伺服器驗證與錯誤定位 | 發布 API 與「發布檢查」面板 |
| 規格產生 Storybook | 區塊 Storybook |

沒有展示、要等後續子專案的能力：權限與角色、媒體庫、中文編輯器介面、草稿與審核。

## 11. core 的修改

### 11.1 新入口 `@tzuchi/tceditor/rules`

不含 React 的規則入口，給驗證器、S3 與 S4 重用，避免規則被複製成第二份：

- `normalizeRichText`、`isSafeHref`、`textToRichText`、`RICHTEXT_MAX_DEPTH`、`RichTextDoc` 型別
- `fitRichTextToTypes(doc, types)`：新的純函式，依允許的節點與格式類型過濾富文字。由 `components/RichTextEditor/lib/fit-to-schema.ts` 的邏輯抽出，改為接收類型清單，不再需要 Tiptap 的 schema 物件。編輯器原本的 `fitToSchema` 改成呼叫它，傳入 Tiptap schema 的類型清單與預設 textblock（B-01 的修法），所以兩邊共用同一份實作。
- `richTextFeaturesToTypes(features)`：把 `richText()` 的功能清單轉成允許的類型。測試要確認：對每種功能組合，結果與編輯器用同樣選項建出的 Tiptap schema 相同。驗證器用這兩個函式過濾富文字。
- `isComponentAllowed`（目前在 `lib/data/is-component-allowed.ts`，只有 import type）

規定：

- 新增 `bundle/rules.ts`、`package.json` 的 `exports`／`typesVersions`、tsup 的建置入口。
- `check:bundle` 的 `ENTRIES` 加入 `rules.mjs` 與 `rules.js`；`rules` 入口另外要求不能 import `react`、`react-dom`、`@tiptap/*` 和 `node:*`。
- 新 subpath 屬於公開 API 變更，要在 `CHANGELOG.md` 記錄，並更新 `CLAUDE.md` 的入口說明。

### 11.2 先修的既有問題

在定義區塊欄位之前完成：

| # | 問題 | 修法 |
|---|---|---|
| B-01 | 設定 `options.paragraph: false` 時舊內容被丟掉，載入空文件，下次編輯會覆蓋原值 | 依 backlog 的建議：改用 schema 的預設 textblock，空文件改用 `createAndFill()`，補測試，並修正 CHANGELOG 的說法。另外，`richText()` 輔助函式本身不允許關閉 paragraph |
| A-11 | `migrateRichTextInData` 會略過只由 `resolveFields` 加入的 richtext 欄位 | 加選用參數 `getFields(item)`，在 JSDoc 註明限制，補測試 |
| A-19 | `normalizeRichText(value, null)` 會拋 `TypeError` | `options ?? {}`，補測試 |
| B-02 | `extractText` 把不同段落的文字直接相接（"a"、"b" 變成 "ab"） | 段落之間插入換行，補測試。驗證器會用它清理 AI 送來的富文字，所以一併修 |
| — | richtext 的 `contentEditable` 預設值不一致：`getRichTextTransform` 把未設定視為 `true`，`InlineEditorWrapper` 卻視為 `false`；上游文件寫的是預設 `false`。上游 v0.23.0 與 main 都一樣 | 統一成文件寫的 `false`，補測試，並在 CHANGELOG 記錄。段落區塊明確設定 `true` |

## 12. uikit 的取用方式

使用者在第 3 題同意「S2 期間用本機路徑連到 uikit 的 `spike/heroui-v3`」。實作時改成「從本機 uikit repo 複製指定 commit 的快照」，原因如下：

- uikit 的 `heroui/react/node_modules` 裡有自己的 React。直接用 `link:` 指向 uikit 目錄時，打包工具會從 uikit 那邊載入第二份 React，Hook 會失效。
- 快照固定在一個 commit，不受 uikit 工作目錄裡尚未 commit 的修改影響。
- repo 本身就能完整建置與測試，不需要另外準備 uikit。技術驗證的 HeroUI 公開頁實驗也是用這種方式成功的。

做法：

- `vendor/uikit/SOURCE.json` 記錄來源：repo、分支 `spike/heroui-v3`、完整 commit（目前是 `2b5a6781`）、每個檔案的 sha256。
- `pnpm sync:uikit -- --dir ../puck-tzuchi-poc --commit <sha>`：
  - 用 `git archive` 取出指定 commit 的 `heroui/react`、`heroui/styles`、`packages/tokens`。這是唯讀操作，不修改 uikit repo。
  - 去掉 stories、測試與建置腳本，保留 `heroui/LICENSE` 與 `heroui/NOTICE.md`。HeroUI 原始碼的授權是 Apache-2.0（`LICENSE` 檔）；`@heroui/*` 的 `package.json` 雖然寫 MIT，但兩者以 `LICENSE` 檔為準。Apache-2.0 第 4 條要求保留授權檔與 NOTICE，並註明修改過的內容，所以 `SOURCE.json` 要列出去掉了哪些檔案。
  - 用 uikit 的 `build.mjs` 建出 tokens（`style-dictionary` 鎖在 uikit 使用的 4.4.0，只當作 root 的 devDependency）。
  - 重新產生 `uikit-options.json` 快照。
- 快照 commit 進 repo，不得手改；測試會比對 `SOURCE.json` 的雜湊。Prettier、ESLint 和 Jest 都略過 `vendor/`。
- `packages/blocks` 以 `link:` 指向 `vendor/uikit` 底下的三個套件，並自行宣告 HeroUI 的執行期依賴（`react-aria-components` 1.21.1、`tailwind-variants` 3.3.1 等，版本與 uikit 的 lockfile 相同）。測試要確認整個 repo 只有一份 React。
- **S3 部署之前**改成從 GitLab Package Registry 安裝 uikit 套件（第 3 題的決定），屆時刪除 `vendor/uikit`。

## 13. 測試與驗收

### 13.1 自動測試

除了最後一項的冒煙測試之外，全部納入 `pnpm verify`：

| 範圍 | 內容 |
|---|---|
| 規格寫法 | 每個區塊的根節點是沒有 `$ref` 的 `type: "object"`；每層物件都是 `additionalProperties: false`；每個欄位都有 `title`；欄位名稱與保留字規則；放置區名稱的結構一致；`spec.ts` 沒有直接使用 refine 類方法（ESLint） |
| 轉換器 | 每個區塊的編輯器欄位、argTypes、MCP 目錄條目做快照測試；另用測試專用的規格涵蓋 11 種欄位（包括示範區塊沒用到的數字與群組）；`satisfies Fields<Props>` 的型別測試，另附一個寫錯欄位名稱、應該編譯失敗的反例 |
| 驗證器（正例） | 範例活動頁、每個區塊的 examples 都要通過。只用預設值時，除了按鈕與圖片都要通過；按鈕與圖片的預設值刻意不完整，必須分別在 `href` 與 `image.assetId` 得到錯誤 |
| 驗證器（反例） | 每一項都要得到預期的 `code` 與 `path`：多種寫法的 `javascript:` 連結、未宣告的欄位、未登記的類型（含 `constructor`、`__proto__`）、重複或不合法的 id、33 層巢狀、5,001 個區塊、2 MB 加 1 byte、舊的 `zones`、放置區放了不允許的區塊、缺替代文字 |
| 富文字清理 | 帶有不認得的節點、沒開放的格式（例如標題）或危險連結的富文字，會被清理並產生 `richtext_cleaned` 提示 |
| 雙層一致性 | 同一組測試資料同時跑 zod 驗證器、Ajv 2020-12（區塊 schema）與 Ajv draft-07（外殼 schema）：「zod 接受、Ajv 拒絕」必須是 0 筆；反方向只允許 `x-lost-checks` 列出的情況 |
| uikit 白名單 | 第 5.5 節的第 2、3 項；快照與 vendor 一致；vendor 檔案雜湊與 `SOURCE.json` 一致 |
| 相容性 | 規格沒有改版本號卻改了 schema 時失敗；版本之間出現第 4.6 節列的不相容差異時失敗 |
| 產生的檔案 | 第 5.5 節的第 1、4 項 |
| Edge 單檔 | 第 6.4 節的三項檢查 |
| core | `rules` 入口沒有禁止的 import；`richTextFeaturesToTypes` 與 Tiptap schema 一致；`fitRichTextToTypes` 與編輯器的過濾結果一致；B-01、A-11、A-19、B-02 與 `contentEditable` 的測試 |
| Storybook | 在隔離的 `HOME` 下 build；用 puppeteer 逐一開啟每個 story 的 iframe（伺服器綁 `127.0.0.1:6008`），不得有頁面錯誤、console error 或 Storybook 的錯誤畫面 |
| 示範站 | build 成功；第 6.6 節的公開頁產物掃描；發布 API 的 422、413、跨來源拒絕、成功寫檔 |
| 單一 React | 整個 repo 解析出的 `react` 只有一份 |
| 冒煙測試（`pnpm smoke`，需先啟動 demo 與示範站，不在 `pnpm verify` 內） | 既有 demo 的流程不變；新增示範站流程：把 8 個區塊各拖一個進頁面、填好必填欄位、發布，再確認 `/activity` 的 HTML 含有這些內容 |

### 13.2 其他要更新的地方

- `pnpm typecheck` 與 `pnpm lint` 涵蓋兩個新套件與兩個新 app。
- `audit:gate` 把 `@tzuchi/tceditor-spec`、`@tzuchi/tceditor-blocks` 的執行期依賴視為會出貨的依賴，因為公開頁會用到它們。
- `CLAUDE.md`：新套件與 app、新指令（`gen:blocks`、`sync:uikit`、`dev:showcase`、`storybook`）、區塊三檔規則、規格寫法規則、`rules` 入口。
- `CHANGELOG.md`：core 的修改。

### 13.3 驗收標準

1. `pnpm verify` 通過；`pnpm smoke` 在 demo 與示範站都啟動時通過。
2. 在 `/activity/edit` 能用 8 個區塊拼出頁面、發布，並在 `/activity` 看到相同的內容。檢視原始 HTML 就看得到文字與連結。
3. 發布不合格的頁面時，「發布檢查」面板列出中文錯誤，點錯誤會選取出錯的區塊。
4. 區塊 Storybook 的每個區塊都有中文控制面板、文件頁與範例，預設是慈濟主題。
5. `dist/validator.edge.mjs`、`generated/page-shell.draft07.json`、`generated/catalog.json` 都已產生並通過檢查，可以交給 S3 與 S4。

## 14. 不在 S2 範圍

| 項目 | 由誰負責 |
|---|---|
| 存檔 API、資料庫、媒體庫、登入 | S3 |
| 驗證器在 Supabase edge-runtime 上的實測；外殼 schema 在 Postgres 上的測試 | S3 |
| MCP server、寫入工具 | S4 |
| 編輯器的視覺風格與中文介面 | S7 |
| 編輯時的即時欄位驗證（S2 只在發布時檢查） | 待排 |
| 舊資料的自動升級機制 | 第 7 題決定先不做，只預留 `version` |
| 其他區塊（資訊網2.0 的文章卡、書卡等） | 之後依需求另立 |
| uikit 那邊的任何修改，包括掛載區塊 Storybook | 使用者決定（第 9 節附上設定） |
| 區塊 Storybook 的部署 | 等 repo 與 CI 平台決定後 |

## 15. 交給後續子專案的東西

| 交付物 | 給誰 | 內容 |
|---|---|---|
| `@tzuchi/tceditor-blocks/validator`、`dist/validator.edge.mjs` | S3、S4 | 整頁驗證器；錯誤格式見第 6.2 節 |
| `generated/page-shell.draft07.json` | S3 | 資料庫外殼 schema。欄位要 `NOT NULL`（pg_jsonschema 遇到 NULL 會讓 CHECK 通過）；收緊規則時用 `NOT VALID` 再另外驗證既有資料 |
| `generated/catalog.json` | S4 | MCP 元件目錄 |
| `AssetSource` 介面 | S3 | 媒體庫要實作的介面 |
| 上限：2 MB、32 層、5,000 個區塊 | S3、S4 | API 層必須在資料庫之前擋下 |
| 「頁面資料不記錄版本號」的約定 | S3 | 第 4.6 節 |
| 驗證器放行 `\u0000` 與不成對的 surrogate | S3 | 通過驗證的資料的字串可能含這兩種字元（JSON 允許），Postgres `jsonb` 會拒收；寫進 `jsonb` 之前要拒絕（最好在驗證器加檢查，回 422）或替換 |

## 16. 風險

| 風險 | 因應 |
|---|---|
| HeroUI 線在 uikit 還是未合併的 spike 分支，之後可能改名或改結構 | 快照固定 commit；更新時跑 `sync:uikit`，第 5.5 節的檢查會指出受影響的選項 |
| zod 的 patch 版也可能移除 API | 鎖 4.6.5，升級時另外驗證 |
| Next 的 App Router 實際使用 React canary；伺服器端直接 import `@heroui/react` 的寫法只在 Turbopack 能 build，webpack 會失敗 | 示範站固定 Next 版本，升級時重跑測試；第 6.6 節的 lint 規則要求 import `@heroui/react` 的檔案都是 `'use client'`，從源頭避開這種寫法 |
| 公開頁多出約 37 KB 的 JS 與約 63 KB 的 HeroUI CSS（gzip） | S2 先接受並記錄大小；CSS 依元件拆分留待日後 |
| Tailwind 的基礎樣式可能影響編輯器介面 | Tailwind 的基礎樣式在 `@layer base`，優先度低於編輯器的樣式；冒煙測試會檢查編輯器能正常操作 |
| uikit 的原始碼在 tceditor 的 TypeScript 設定下可能型別錯誤 | 為 vendor 使用與 uikit 相同的編譯設定；必要時只對 vendor 放寬 |
| 沒有安裝 Noto Sans TC 的裝置，畫面字型和設計稿不同 | 第 7.2 節：S2 先用系統字型備援，打包字型與否和 S7 一起決定 |
| 中文錯誤訊息是否足以讓 AI 自行修正 | S4 實測後調整訊息；`code` 與 `path` 是穩定的機器可讀欄位 |

## 17. 建議的實作順序

每一步結束時 `pnpm verify` 都要通過。

1. core：第 11.2 節的修正，以及 `@tzuchi/tceditor/rules` 入口。
2. `vendor/uikit` 與同步腳本、uikit 選項快照。
3. `packages/spec`：輔助函式、寫法規則檢查、四個轉換器、整頁驗證器（先用測試專用的規格）。
4. `packages/blocks`：8 個區塊、頁面根節點、`gen:blocks` 與產生的檔案、第 5.5 節的檢查、Edge 單檔。
5. `apps/storybook`：設定、隔離 HOME 的包裝腳本、逐一開啟 story 的檢查。
6. `apps/showcase`：編輯器、發布 API、公開頁、「發布檢查」面板、範例頁與示範圖、產物掃描、冒煙測試。
7. 文件：`CLAUDE.md`、`CHANGELOG.md`、各套件的 README。

## 18. 實作前更正（2026-10-18）

撰寫實作計畫前，依實際程式碼與實測（`.superpowers/plan-work/s2/facts/`，git 忽略）做了下列更正。本節與前文衝突時，以本節為準。

| # | 位置 | 更正 | 原因 |
|---|---|---|---|
| 1 | §4.1、§6.2 #6 | 區塊 `type` 改為 `^[A-Z][A-Za-z0-9]{0,26}$`（最多 27 字元） | 編輯器產生的 id 是 `<type>-<uuid>`，長度是 type 加 37，而 id 上限是 64 |
| 2 | §4.3 最後一行 | `GlobalMeta` 只檢查已宣告 key 的值型別；拼錯的 key 改由測試檢查（JSON Schema 只能出現允許的 meta key） | zod 的 `JSONSchemaMeta` 有 index signature，拼錯的 key 編譯時不會報錯 |
| 3 | §4.2、§8.3、§8.8 | 必填的 `link()` 與 `image()` 用 `.prefault()`；物件與陣列的預設值一律寫成函式 | `.default()` 不驗證預設值，而且只做淺拷貝 |
| 4 | §5.2 | `Fields<Props>` 會檢查欄位名稱與必填欄位是否存在，不檢查欄位型別 | tsc 實測 |
| 5 | §5.3 | stories 改用 `@tzuchi/tceditor/rsc` 的 `Render` | client `Render` 會在根節點多包一層 `<div>`，RSC 版的輸出才和公開頁相同 |
| 6 | §6.3 | override 寫成 `"zod@^4": "4.6.5"` | 不帶範圍會把 puppeteer 依賴（chromium-bidi）的 zod 3 也改成 zod 4，使它的錯誤處理壞掉 |
| 7 | §6.4 | 只能用 `import * as z from "zod"`，由 ESLint 強制 | `import { z }` 會讓 esbuild 打包全部語系，Edge 單檔變成約 93 KB（gzip） |
| 8 | §4.3 rule 7、§5.4、§6.2 #8 | 區塊 schema 不宣告 `id`。驗證器先取出 `props.id`、單獨檢查，再用區塊 schema 檢查其餘 props；catalog 以 `nodeIdPattern` 說明 id 規則 | 規則 7 把 `id` 列為保留字，strictObject 會把它當成未宣告欄位 |
| 9 | §7.2 | CSS 順序改為 tokens → `@heroui/styles` → `@heroui/styles/themes/tzuchi/index.css`（不包 layer），不另外 import `tailwindcss` | `@heroui/styles` 本身就 import Tailwind，另外 import 會輸出兩份 preflight |
| 10 | §8.2、§11.1、§11.2 | 修正 `extension.ts` 的 spread 順序，讓 `options.textAlign` 生效；類型過濾加入 `textAlign`；`richText()` 一律關閉對齊，驗證器清理時移除對齊屬性 | 原本的 spread 順序讓預設值蓋掉使用者設定，段落區塊無法關閉對齊，renderer 還會輸出 inline style |
| 11 | §9 | 區塊 Storybook 的開發 port 改為 6010，`refs` 的 url 改為 `http://127.0.0.1:6010`；`viteFinal` 加入 `@vitejs/plugin-react` 與 `@tailwindcss/vite` | uikit 根目錄的 script 與 S1 的 port 慣例都用了 6007；Storybook 10 的 react-vite 不會自動處理 sibling 套件的 JSX |
| 12 | §11.1 | rules 入口用另一份沒有 react `inject` 的 tsup 設定建置；`check:bundle` 比對 `node:` 時改比對 import／require 的寫法；`isComponentAllowed` 改用本地型別；另外匯出 `richTextFeaturesToOptions`、`RICHTEXT_FEATURES`、`isRichTextFeature`、`stableStringify` 與 `RichTextTypes` | 共用設定會把 React 注入每個入口；esbuild 的 CJS 產物固定帶一行含 `node:` 的註解；轉換器需要和編輯器相同的功能對應 |
| 13 | §11.2 B-01 | 預設 textblock 改用 `@tiptap/core` 的 `defaultBlockAt(schema.topNodeType.contentMatch)`；改用 codeBlock 承接時只放純文字 | `contentMatch.defaultType` 實測得到 `blockquote`，`createAndFill()` 會 stack overflow |
| 14 | §3.1、§12 | 只 vendor `heroui/styles` 與 `packages/tokens`（加上 `heroui/LICENSE`、`heroui/NOTICE.md`），不 vendor 也不連結 `heroui/react`；8 個區塊都只用 `@heroui/styles` 的 tv 函式畫出一般 HTML 元素 | 這 8 個區塊都不需要互動元件；不用 `@heroui/react` 就不必帶入 react-aria 等執行期依賴，公開頁也不送元件的 JS。之後需要互動元件時再加入 |
| 15 | §12 | `vendor/uikit/packages/tokens/dist/` 以 `.gitignore` 的否定規則重新納入 | 根目錄的 `dist` 規則會把建好的 tokens 忽略掉 |
| 16 | §13.1、§17 | 需要 build 產物的檢查（Edge 單檔、公開頁產物掃描、Storybook 逐一開 story）是 root script，排在 `verify` 的 `pnpm build` 之後；§5.5 #1「產生的檔案是否同步」改由 blocks 的 jest 測試檢查 | `verify` 先跑測試後 build |
| 17 | §5.5 | uikit 選項快照用 esbuild 打包 vendor 的 `@heroui/styles` 原始碼，再讀每個 tv 函式的 `variants` | PoC 的 `tvRegistry` 不在 uikit 的指定 commit 中 |
| 18 | §4.2、§8.5、§8.7 | `x-item-label` 是樣板字串：`{欄位名}` 代入項目的欄位值，`{n}` 代入從 1 起算的序號（TagList 用 `"{label}"`，Columns 用 `"第 {n} 欄"`） | 多欄要顯示「第 1 欄」，不是欄位值 |
| 19 | §10.1 | 公開頁與編輯器用 route group `(public)`、`(editor)` 各自有根 layout；編輯器根 layout 的 `<html>` 不設 `data-theme` | host 的 `data-theme` 會蓋掉 `overrides.iframe` 在預覽 iframe 設的值 |
| 20 | §10.2 | 同源檢查比對 `Origin` 與 `Host` 標頭 | `next start -H 127.0.0.1` 下 `req.url` 仍是 `localhost` |
| 21 | §6.2 #7 | 巢狀層數：頂層區塊是第 1 層，放在第 n 層區塊放置區裡的區塊是第 n+1 層；第 33 層回報 `too_deep` | 原文沒有定義起算點 |
| 22 | §13.1 | 示範站冒煙測試是獨立的 `scripts/e2e/showcase-smoke.mjs`，失敗時以非 0 結束；`pnpm smoke` 依序執行既有測試與它 | 既有的 `smoke()` 永遠不會失敗 |
| 23 | §11.2 A-11 | `migrateRichTextInData(data, config, options?)`，`options.getFields?: (item, ctx: { isRoot }) => Fields \| undefined`，必須是同步函式 | `resolveFields` 可能是非同步，轉換工具是同步的 |
| 24 | §4.2 | `richText()` 的底層是 `z.looseObject({ type: z.literal("doc") })`，字串值會被拒絕；舊 HTML 先用 `richtext-migrate` 轉換 | 與 JSON Schema 的 `type: "object"` 一致，雙層一致性測試才成立 |
| 25 | §13.1 雙層一致性 | 「Ajv 接受、zod 拒絕」的允許清單除了 x-lost-checks 對應的 `unsafe_href`、`alt_required`，另含整頁規則 `duplicate_id`、`not_allowed_here`、`too_deep`、`too_many_blocks`；外殼 schema 檢查的是驗證器的輸出，區塊 props 則同時檢查輸入與輸出 | 外殼 schema 依 §6.5 只檢查結構，id 重複、放置規則與層數上限都無法用它表達 |
| 26 | §6.4 | `check:edge` 的「不得出現 `node:`」只比對引入 `node:` 模組的寫法，與 `check:bundle` 共用同一個 regex（`NODE_IMPORT`） | 驗證器走訪 JSON Schema 時用 `{ node }` 物件，壓縮後的產物會出現 `node:` 這個物件 key，比對子字串會誤判 |
| 27 | §7.2 | `packages/blocks/styles.css` 只需要 `@source "./src"`，不需要指向 vendor | `@heroui/styles` 的 class 來自它自己的 CSS 檔，由 Tailwind 透過 `@import` 編譯；S2 沒有使用 `heroui/react` 的元件原始碼（第 14 項） |
| 28 | §1、§3.3、§7.1 | §7.1 的 `createRenderConfig({ blocks, views, assets })` 改名為 `buildRenderConfig`，依規格的 JSON Schema 自動把 props 對應到畫面；`createRenderConfig({ assets })` 是它套用全部區塊規格與 `views` 表的版本。新增區塊要在區塊清單與 `views` 表各登記一行；少了畫面時 `tsc` 會失敗 | 區塊規格清單不能 import React（驗證器要用它），所以畫面要另外登記；用型別檢查保證兩份清單一致 |
| 29 | §4.1、§4.6 | 頁面根節點也有 `version`（`definePageRoot({ version })`，預設 1）與資料契約快照 `generated/schemas/Root.v<version>.json`，和區塊一起受相容性檢查；根節點不能改用新類型，所以只允許相容修改。快照以 JSON 內容比對，只差排版的已 commit 快照照原樣保留 | 最終審查 F06：根節點原本沒有資料契約，收緊標題長度或新增沒有預設值的欄位都不會被擋，已存的頁面卻會在下次發布時被拒絕 |
| 30 | §6.2 #9、§7.1 | `buildRenderConfig` 把 props 交給畫面之前，以規格 JSON Schema 的預設值補上缺少（或為 `undefined`、`null`）的欄位，頂層與清單項目、群組裡都一樣；`<Render>` 本身仍不補。畫面不得以資料決定 HTML 元素（Heading 的 `level` 經固定對照表，其他值畫成 `h2`） | 最終審查 F05、F01：相容修改之前存下的頁面缺少新欄位時，公開頁會拋錯；未經驗證的資料可以讓伺服器輸出 `<script>` |
| 31 | §4.3、§4.6、§13.1 | `checkSpecRules` 另外檢查下列寫法規則：(1) 保留字是 `id`、`puck`、`editMode`、`children`、`key`、`ref`，取代 §4.3 規則 7 的清單。(2) 新規則 `defaults`：頂層欄位一律要有預設值，只寫 `.optional()` 不算；必填的 `link()`、`image()` 例外，但不得另給 `.default()`，也不得包 `.optional()`、`.nullable()`；任何一層的預設值都必須再驗證一次通過，而且結果不變。群組與清單項目裡的欄位可以沒有預設值，也可以是 `.optional()`。(3) 新規則 `item-label`：`x-item-label` 只能放在物件清單上，placeholder 只能是 `{n}` 或項目中的文字、數字欄位。(4) 清單項目不得直接是輔助函式的值，要包成 `z.strictObject`（`object-arrays`）。(5) 數字只用 `.int()`、`.min()`、`.max()`；`multipleOf`、`exclusiveMinimum`、`exclusiveMaximum` 不在 `SCHEMA_KEYWORDS` 裡，出現就回報 `meta-keys`。(6) `x-slot`、`x-richtext`、`x-image`、`x-link`、`x-lost-checks` 必須與輔助函式記在 `helpers.ts` 私有 registry 的 meta 完全相同，逐節點比對。(7) 輔助函式必須維持原樣：只有 `.meta()`、`.describe()` 的副本與輔助函式回傳的 schema 共用同一個 `_zod.def`。所以加了 `.overwrite()`、`.refine()`、`.check()` 的副本會回報 `meta-keys`；從 props 物件到輔助函式之間，外層有 `.catch()`、pipe（`.transform()`、`.pipe()`、`z.preprocess()`），或有清單長度以外的檢查，也會回報 `meta-keys` | 最終審查 F02、F03、F12、F14、F24–F26 與複審的殘留項目：React 不把 `key`、`ref` 交給元件；zod 不驗證 `.default()` 的值，只有 `.optional()` 的欄位在舊頁面會是 `undefined`，相容修改卻不會被擋；編輯器只會代入文字與數字欄位；編輯器欄位不理會 step 與開區間；型別轉換可以繞過 `GlobalMeta` 的 `never`；zod 的檢查副本會經由 `_zod.parent` 繼承 registry 的 meta，JSON Schema 看不出差別，例如 `link({ optional: true }).overwrite(() => "javascript:…")` 會讓驗證器存下 `javascript:` 連結。ESLint 只檢查名為 `spec.ts` 的檔案，所以這些規則也要由 `checkSpecRules` 檢查 |
| 32 | §11.1 | `normalizeRichText` 遇到同時帶 `code` 與其他 mark 的 text 或 hardBreak 時只保留 `code`，所以編輯器、公開頁與驗證器看到的都是只有 `code` 的文字 | Tiptap 的 code mark 是 `excludes: "_"`：編輯器替文字加上 code 時會移除其他 mark，替 code 文字加其他 mark 則不會生效。竄改的 `[bold, code]` 會讓 schema 的 `check()` 拋出 `Invalid collection of marks`（最終審查 Group A 的範圍外發現） |
