# @tzuchi/tceditor-spec

撰寫區塊規格的工具。每個區塊只有一份 zod 規格（zod 4.6.5），本套件把它轉成 Puck 的欄位、Storybook 的 argTypes、MCP 元件目錄、資料庫外殼 schema 與資料契約，並提供整頁驗證器。轉換器只讀 zod 輸出的 JSON Schema（2020-12）與 `x-*` 擴充欄位。

- 純 TypeScript，不依賴 React 與 uikit；執行期只 import `zod` 與 `@tzuchi/tceditor/rules`（`@tzuchi/tceditor` 主入口只有 `import type`）。測試以外的檔案由 ESLint 檢查這一點，`ajv` 也只能在測試裡用。
- 以原始碼提供（`exports` 指向 `.ts`），沒有 build 步驟，標為 `private`，monorepo 內以 `workspace:*` 取用。
- 設計規格：`docs/superpowers/specs/2026-10-12-s2-block-spec-design.md`，第 18 節的更正優先於前文。8 個實際的區塊在 `packages/blocks`。

## 匯出

| 入口                              | 內容                                                                                                                                                                          |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@tzuchi/tceditor-spec`           | `defineBlockSpec`、`definePageRoot`、輔助函式、轉換器、`checkSpecRules`、`toJsonSchema`、`exampleToPageData` 與型別，以及驗證器入口的全部名稱                                 |
| `@tzuchi/tceditor-spec/validator` | `createPageValidator`、`DEFAULT_LIMITS`、`NODE_ID_PATTERN`、`ISSUE_CODES`、`formatPathText` 與型別 `Issue`、`IssueCode`、`PageValidator`、`ValidateResult`、`ValidatorLimits` |

驗證器入口只 import zod、`@tzuchi/tceditor/rules` 與本套件的內部模組，不含轉換器，所以可以單獨打包成 Edge 單檔（`packages/blocks/dist/validator.edge.mjs`）。

## 寫一份規格

```ts
import * as z from "zod";
import { defineBlockSpec, link, style } from "@tzuchi/tceditor-spec";

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
    variant: style("button", "variant", ["primary", "secondary", "outline"])
      .default("primary")
      .meta({
        title: "樣式",
        "x-labels": { primary: "主要", secondary: "次要", outline: "外框" },
      }),
    fullWidth: z.boolean().default(false).meta({ title: "滿版寬度" }),
  }),
  examples: [
    { name: "主要按鈕", props: { label: "立即報名", href: "/register" } },
  ],
});
```

- zod 一律寫成 `import * as z from "zod"`（ESLint 檢查）。其他寫法會讓 esbuild 打包全部語系，Edge 單檔會超過 60 KB。不要 import `zod/v4/locales/*`、不要用 `z.locales`，也不要呼叫 `z.config` 或 `z.core.config`。
- 頁面根節點用 `definePageRoot({ label?, version?, props })` 宣告，`label` 預設「頁面」，`version` 預設 1。根節點的資料契約和區塊一樣分版本，相容修改時把 `version` 加 1。
- 寫法規則的完整清單在 `CLAUDE.md` 的 Spec rules：`checkSpecRules` 檢查規格本身，ESLint 檢查 `packages/blocks/src/` 底下名為 `spec.ts` 的檔案（規則由 `scripts/eslint-rules.test.mjs` 鎖住），文字用中文則是慣例，只靠 review。重點：
  - 物件一律 `z.strictObject`；每個欄位只有一種 JSON 型別（不用 `.nullable()` 與 union）。
  - 清單的項目是 `z.strictObject({...})`，不能直接放輔助函式的值：圖片清單寫成 `z.array(z.strictObject({ image: image() }))`。清單一定要有 `.max()`（`object-arrays` 規則：驗證器只檢查到清單上限多 1 項，所以它的工作量受上限約束，與頁面中清單欄位的長度無關；富文字文件的工作量與記憶體則和文件的大小成正比，受 2 MB 的上限約束）。
  - `.meta()` 放在鏈的最後、只呼叫一次；每個欄位都要有 `title`（慣例是中文）。
  - 不宣告 `id`，欄位名稱也不得是 `puck`、`editMode`、`children`（Puck 傳給畫面的 props）、`key`、`ref`（React 不交給元件），或 `constructor`、`toString` 這類 `Object.prototype` 的名稱。
  - `spec.ts` 不用 `.refine()`、`.transform()`、`.slugify()`、`.with()`、`.apply()` 這類 JSON Schema 表達不了或會悄悄改值的方法，也不用 `z.stringbool()`、`z.codec()`；數字只用 `.int()`、`.min()`、`.max()` 限制（不用 `.gt()`、`.positive()`、`.multipleOf()` 這類寫法，`checkSpecRules` 也拒絕它們產生的 `multipleOf`、`exclusiveMinimum`、`exclusiveMaximum`）。
  - 預設值（`defaults` 規則）：zod 不驗證、不清理 `.default()` 的值，所以每個頂層欄位都要有預設值，而且再驗證一次必須通過、結果不變。富文字的預設值要先整理成輸出形狀：`.default(() => fitRichTextToTypes(textToRichText("…"), richTextFeaturesToTypes(features)))`；物件的預設值要寫齊每個欄位。群組與清單項目裡的欄位可以沒有預設值，有的話一樣檢查。物件與陣列的預設值寫成函式，因為 zod 只複製預設值的第一層；ESLint 會擋下直接傳入陣列或物件字面值的寫法，但擋不到存在變數裡的值。

## 欄位種類

| 種類   | 寫法                                                            | 存進資料庫的值                 | 編輯器欄位                            | Storybook 控制項                  |
| ------ | --------------------------------------------------------------- | ------------------------------ | ------------------------------------- | --------------------------------- |
| 短文字 | `z.string()`；加 `"x-inline": true` 可在畫布上直接編輯          | 字串                           | `text`                                | text                              |
| 長文字 | `z.string()` 加 `"x-field": "textarea"`                         | 字串                           | `textarea`                            | text                              |
| 數字   | `z.number().int().min().max()`                                  | 數字                           | `number`                              | 兩端都有界時用 range，否則 number |
| 單選   | `choice([...])`、`style(...)` 或 `token(...)`，加 `x-labels`    | 字串                           | 4 個選項以內用 `radio`，否則 `select` | radio 或 select，帶中文標籤       |
| 是／否 | `z.boolean()`                                                   | 布林                           | `radio`（是／否）                     | boolean                           |
| 連結   | `link()`；選填用 `link({ optional: true })`                     | 字串                           | `text`                                | text                              |
| 富文字 | `richText({ features: [...] })`                                 | Tiptap JSON（`RichTextDoc`）   | `richtext`，`contentEditable: true`   | 不提供，由範例 story 呈現         |
| 清單   | `z.array(z.strictObject({...})).min().max()`，加 `x-item-label` | 物件陣列                       | `array`                               | object                            |
| 群組   | `z.strictObject({...})`                                         | 物件                           | `object`                              | object                            |
| 放置區 | `slot({ allow: [...] })` 或 `slot({ disallow: [...] })`         | `{ type, props }` 陣列         | `slot`                                | 不提供，由範例 story 帶入子區塊   |
| 圖片   | `image()`                                                       | `{ assetId, alt, decorative }` | `custom`（由編輯器層提供挑選介面）    | 不提供，由範例 story 呈現         |

## 輔助函式

| 函式                            | 說明                                                                                                                                                                                                 |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `choice(values)`                | 一般的固定選項，例如圖片比例                                                                                                                                                                         |
| `style(component, key, values)` | 從 uikit 元件的樣式選項挑白名單，在 meta 記下 `x-style`。選項是否存在由 `packages/blocks` 的測試對照 `generated/uikit-options.json`                                                                  |
| `token(group, values)`          | 跨元件共用的設計概念，值是 `@tzuchi/tokens` 的名稱，例如 `token("space", ["16", "32"])` 對應 `--tc-space-16`、`--tc-space-32`                                                                        |
| `link(options?)`                | 最長 2,048 字元（`LINK_MAX_LENGTH`），必須通過 `isSafeHref`（只接受 http、https、mailto、tel 與站內路徑）。必填版本不接受空字串；選填版本的空字串表示沒有連結                                        |
| `richText({ features })`        | `features` 取自 `RICHTEXT_FEATURES`；`doc`、`paragraph`、`text` 永遠開放，段落對齊永遠關閉。值會先經 `normalizeRichText`，再依 `features` 過濾。字串值會被拒絕，舊 HTML 先用 `richtext-migrate` 轉換 |
| `slot(rule)`                    | `allow` 與 `disallow` 只能擇一，名稱必須是已登記的區塊類型；預設空陣列                                                                                                                               |
| `image()`                       | `assetId` 符合 `ASSET_ID_PATTERN`（`^[A-Za-z0-9_-]{1,64}$`）；`alt` 最多 200 字（`IMAGE_ALT_MAX_LENGTH`），`decorative` 為 `false` 時不得為空。只檢查格式，不檢查素材是否存在                        |

必填的 `link()` 與 `image()` 用 `.prefault()`：新加入的按鈕與圖片的預設值刻意不完整，要在編輯器填好網址、選好圖片才能發布。規格本身不呼叫 `.prefault()`（ESLint 檢查）。`checkSpecRules` 不允許在任何一層替必填的 `link()`、`image()` 另給 `.default()`，或包上 `.optional()`、`.nullable()`，因為目錄與資料契約仍會把它們當成必填：選填連結用 `link({ optional: true })`，`image()` 沒有選填版本。

## `x-*` 擴充欄位

| key             | 誰寫         | 說明                                                                                                                                                                         |
| --------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `x-labels`      | 規格         | 選項的中文名稱，例如 `{ primary: "主要" }`。只用在畫面，不存進資料庫                                                                                                         |
| `x-inline`      | 規格         | `true`：短文字可在畫布上直接編輯                                                                                                                                             |
| `x-field`       | 規格         | `"textarea"`：長文字                                                                                                                                                         |
| `x-item-label`  | 規格         | 清單項目的摘要樣板：`{欄位名}` 代入項目的欄位值，`{n}` 代入從 1 起算的序號，例如 `"第 {n} 欄"`。只能放在清單上，`{欄位名}` 必須是項目中的文字或數字欄位（`item-label` 規則） |
| `x-style`       | `style()`    | `{ component, key }`                                                                                                                                                         |
| `x-token`       | `token()`    | `{ group }`                                                                                                                                                                  |
| `x-slot`        | `slot()`     | `{ allow }` 或 `{ disallow }`                                                                                                                                                |
| `x-richtext`    | `richText()` | `{ features }`                                                                                                                                                               |
| `x-image`       | `image()`    | `true`                                                                                                                                                                       |
| `x-link`        | `link()`     | `{ optional }`                                                                                                                                                               |
| `x-lost-checks` | 輔助函式     | 只有 zod 驗證器會做的檢查：`safe-href`、`alt-required`、`richtext-normalize`                                                                                                 |

`x-slot`、`x-richtext`、`x-image`、`x-link`、`x-lost-checks` 在 `GlobalMeta` 裡宣告成 `never`，規格在 `.meta()` 寫了就編譯失敗；輔助函式以 `HelperMeta` 寫入。`GlobalMeta` 有 index signature，拼錯的 key 照樣能編譯，所以 `checkSpecRules` 會確認 JSON Schema 只出現 `META_KEYS` 列出的 key，而且 `.meta()` 沒有加入或改寫 JSON Schema 的關鍵字（例如 `type`、`additionalProperties`）。型別轉換可以繞過 `never`，所以輔助函式另外把自己寫的 meta 登記在 `helpers.ts` 模組內的 zod registry；`checkSpecRules` 以這個 registry 再產生一份 JSON Schema，逐節點比對這 5 個 key：多出、缺少或值不同（例如改了 `x-richtext.features` 或 `x-link.optional`）都會回報 `meta-keys`。

## 轉換器

| 函式                                      | 產物                                                                                                                                         |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `toJsonSchema(spec)`                      | JSON Schema（`JSON_SCHEMA_OPTIONS`：`draft-2020-12`、`io: "input"`、`reused: "inline"`）。結果有快取並深層凍結，要修改時先 `structuredClone` |
| `toPuckFields(spec, factories?)`          | Puck 的 `fields`，型別是 `Fields<z.output<…>>`。有圖片欄位時必須提供 `factories.image`                                                       |
| `toDefaultProps(spec)`                    | Puck 的 `defaultProps`（取自 schema 的預設值，深拷貝）                                                                                       |
| `toArgTypes(spec)`、`toStoryArgs(spec)`   | Storybook 的 argTypes 與預設 args，不依賴 Storybook 的型別                                                                                   |
| `buildCatalog({ blocks, root })`          | MCP 元件目錄（`CATALOG_VERSION` 為 1）                                                                                                       |
| `buildPageShellSchema({ blocks })`        | 資料庫外殼 schema（draft-07，不用 `oneOf`／`anyOf`／`allOf`，放置區依欄位名稱辨認）                                                          |
| `toDataContract(spec)`、`diffContracts()` | 區塊或頁面根節點的資料契約，以及兩版契約之間的不相容差異                                                                                     |
| `checkSpecRules({ blocks, root })`        | 規格寫法檢查，回傳 `SpecRuleViolation[]`                                                                                                     |
| `exampleToPageData(spec, index)`          | 把一個範例變成只含這個區塊的頁面，並補上決定性的 id（stories 與測試使用）                                                                    |

## 整頁驗證器

```ts
import * as z from "zod";
import { definePageRoot } from "@tzuchi/tceditor-spec";
import { createPageValidator } from "@tzuchi/tceditor-spec/validator";
import { buttonSpec } from "./button-spec";

const pageRootSpec = definePageRoot({
  props: z.strictObject({
    title: z
      .string()
      .min(1)
      .max(80)
      .default("未命名頁面")
      .meta({ title: "頁面標題" }),
  }),
});

const validator = createPageValidator({
  blocks: [buttonSpec],
  root: pageRootSpec,
});

export function save(rawBody: string) {
  const result = validator.validatePageJson(rawBody);

  if (!result.ok) {
    // result.errors：{ path, pathText, blockType, code, message }[]
    return { status: 422, errors: result.errors };
  }
  // 只存 result.data：已補齊預設值、清理過富文字，大小也在上限內。
  // result.notices 是清理的提示。字串可能含 \u0000 與不成對的 surrogate，
  // Postgres 的 jsonb 會拒收：寫進 jsonb 之前要拒絕或替換它們
  return { status: 200, data: result.data, notices: result.notices };
}
```

- `createPageValidator` 建立時先跑 `checkSpecRules`，規格有問題就拋出錯誤。
- 上限（`DEFAULT_LIMITS`，可用 `limits` 覆寫）：原始資料 2,097,152 bytes（以 UTF-8 計，在解析 JSON 之前檢查）、巢狀 32 層（頂層區塊是第 1 層）、5,000 個區塊、最多回報 100 筆。只有 `validatePageJson` 會量大小，所以收到請求內容的程式要用它，不要自己 `JSON.parse` 之後再呼叫 `validatePage`。它也量回傳的 `data`（`JSON.stringify` 之後）：補上的預設值與清理時補齊的連結屬性會讓資料變大，超過上限同樣回 `too_large`，所以存下的資料再送一次一定通過。
- 驗證器不依頁面的深度遞迴（2 MB 的 JSON 可以寫出約 4 萬層）：以明確的 stack 走訪區塊，超過 32 層的區塊不再進入，也從不複製整頁。測試 `stops at level 33 of a 30,000-level page without overflowing the stack` 確認這一點。比較富文字有沒有被清理（`isRichTextChanged`）時同時走訪送來的與清理後的文件，不複製、遇到第一個差異就停止，所以不會因為節點很多而多用記憶體；`memory.spec.ts` 在 heap 只有 96 MB 的子 process 裡驗證由大量極小節點組成的 2 MB 頁面。
- id 符合 `NODE_ID_PATTERN`（`^[A-Za-z0-9_-]{1,64}$`），不是 `root`，整頁不重複。
- 富文字是唯一會被修正的欄位：先 `normalizeRichText`，再依欄位的 `features` 過濾；內容真的改變時才記一筆 `richtext_cleaned` 提示。比較時忽略值為 `null` 的屬性與空的 `attrs`、`content`、`marks`，所以編輯器送出的內容與 `textToRichText` 的結果不會產生提示。其他問題一律拒絕。
- `path` 指向出錯的位置：`unknown_type` 是 `<節點>.type`；`not_allowed_here` 是子區塊本身；`invalid_id` 與 `duplicate_id` 是 `<節點>.props.id`（重複時回報第二次出現的那一個）；`legacy_zones` 是 `zones`；富文字內部的問題截到欄位本身。同一個路徑只回報一筆，所以維持預設值的圖片欄位有兩筆：`<欄位>.assetId`（`invalid_value`）與 `<欄位>.alt`（`alt_required`）。
- 中文訊息在呼叫時以參數傳入，不修改 zod 的全域設定。訊息會說出區塊名稱、欄位名稱與允許的值，例如「按鈕的『連結網址』只接受 http、https、mailto、tel 或站內路徑。」。`code` 與 `path` 是穩定的機器可讀欄位，訊息的措辭之後可能調整。

| `code`             | 意義                                                               |
| ------------------ | ------------------------------------------------------------------ |
| `too_large`        | 原始資料，或補上預設值、清理富文字之後的資料超過 2 MB              |
| `invalid_json`     | 不是合法的 JSON                                                    |
| `invalid_shape`    | 頂層、`root` 或節點的結構不對，例如多出 `type`、`props` 以外的欄位 |
| `legacy_zones`     | 使用舊的 DropZone `zones` 格式（只接受空物件）                     |
| `unknown_type`     | 未登記的區塊類型（包括 `constructor`、`__proto__`）                |
| `invalid_id`       | `props.id` 不符合規則，或是 `root`                                 |
| `duplicate_id`     | 整頁有重複的 id                                                    |
| `too_deep`         | 放置區巢狀超過 32 層                                               |
| `too_many_blocks`  | 超過 5,000 個區塊                                                  |
| `unknown_prop`     | 未宣告的欄位                                                       |
| `invalid_value`    | 型別、長度、選項或範圍不符                                         |
| `unsafe_href`      | 連結不是 http、https、mailto、tel 或站內路徑                       |
| `alt_required`     | 不是純裝飾的圖片缺少替代文字                                       |
| `not_allowed_here` | 放置區放了不允許的區塊                                             |
| `richtext_cleaned` | （只出現在 `notices`）富文字經過清理                               |

**只有存檔 API 裡的這個驗證器能當把關者。** 編輯器畫面上的限制可以繞過；Ajv、pg_jsonschema 與 MCP SDK 的 JSON Schema 驗證都會放行 `javascript:` 連結，也不會清理富文字。

## 測試

```sh
pnpm --filter @tzuchi/tceditor-spec test
pnpm --filter @tzuchi/tceditor-spec typecheck
```

- jest 與 ts-jest，測試放在 `src/**/__tests__/`。`src/__fixtures__/test-specs.ts` 是測試專用的規格，涵蓋 11 種欄位與 33 層巢狀。
- 本套件經由 `workspace:*` 使用 core 建置後的 `dist`。修改 core 之後，單獨執行本套件的測試前先 `pnpm --filter @tzuchi/tceditor build`；從根目錄執行 `pnpm test` 時 turbo 會先建置。
