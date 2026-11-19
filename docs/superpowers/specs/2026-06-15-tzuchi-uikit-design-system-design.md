# 慈濟入口網 UIKit / Design System — 設計規格（Design Spec）

| 項目 | 內容 |
|---|---|
| 文件日期 | 2026-06-15 |
| 狀態 | Draft v2（已納入多視角對抗式審查的 66 項發現，待使用者審閱） |
| 設計來源（Source of Truth） | Figma file `ZcL0ToWIu44xQqBfnUKcDr`，page `01 Components`（node `2257:9115`） |
| 本規格範圍 | 整體架構、Monorepo、Design Tokens、元件層、React 交付、純 HTML、Storybook、測試、治理，以及 Milestone 1（地基 + 5 核心元件）詳細規格 |
| 後續產物 | 經使用者審閱確認後 → `writing-plans` 產出逐步實作計畫 |

> **2026-10-21 修正：** Lit Web Components（packages/components、packages/react、apps/storybook、apps/demo-html）已凍結：程式留在 repo、不再修改，root 的 build 和 test 不再包含它們。元件的方向改為 heroui/ 的 HeroUI v3 加上慈濟主題，元件樣品室是 heroui/storybook。本文以 Lit 為單一來源的段落，以此修正為準。共編機制見 tceditor repo 的 docs/superpowers/specs/2026-10-21-ci-tokens-coediting-design.md。

> 本文件為設計系統的「合約」。Token 層與元件 API 一旦定案，即為各套件的對外承諾。

### Figma 來源節點對照（page `01 Components` / `2257:9115` 之下的 frames）

| 區塊 | Figma frame | node id |
|---|---|---|
| Typography | 01 入口網-Typography | `2257:9118` |
| Color Guidance | 02 入口網-Color Guidance | `2257:9143` |
| Elevation | 03 入口網-Elevation | `2257:9262`（卡片 `2257:9266`） |
| Elements / Icons | 04 入口網-Elements | `2257:9270` |
| Icon buttons | 05 入口網-Icon buttons | `2257:9321` |
| Buttons | 07 入口網-Buttons | `2257:9353`（symbol set `2257:9357`） |
| Cards | 09 入口網-Cards | `2257:9435` |
| Tabs | 10 入口網-Tabs | `2257:9456` |
| Input | 14 入口網-input | `2266:4995` |
| Input calendar | 15 入口網-input calendar | `2266:5022` |

> 「0X 入口網-…」皆為 `01 Components` 這一頁上的並排 frame；數字僅為設計師的排序前綴，非不同頁面。

---

## 1. 背景與目標

### 1.1 背景
慈濟入口網已在 Figma 完成完整 design system。前端目前以 **React 與純手寫 HTML** 兩種方式消費 UI，缺乏統一、可重用、有文件、有測試的元件庫，導致樣式與互動重複實作、難以維護與對齊設計。

### 1.2 目標
1. 一套「**寫一次、多框架可用**」的元件庫，第一優先支援 **純 HTML** 與 **React**。
2. 以 **Design Tokens** 為地基，所有視覺值集中管理、可主題化，元件不寫死任何值。
3. 提供 **Components cookbook**（Storybook）作為開發、測試與文件中心。
4. 對齊 Figma 既有設計。
5. 採 **業界標準工程實踐**：monorepo、TypeScript、自動化測試、無障礙、語意化版本、套件健檢。

### 1.3 非目標
- 本期不實作 Figma 全部元件；M1 僅做地基 + 5 元件。
- 不提供 Vue / Svelte / Angular wrapper（架構保留擴充點）。
- 不實作完整 datepicker（Input Calendar 僅做視覺與 trailing icon 結構）。
- 不實作深色主題（但 token 輸出格式須現在就選對，以保留可能性）。
- 本期 SSR 為「文件 + CSR-safe 約束」，不交付完整 Next.js SSR/hydration（列 M3）。

---

## 2. 核心決策（已定案）

| 決策 | 選擇 | 理由 |
|---|---|---|
| 元件單一來源 | **Lit Web Components** | 原生 Custom Elements，HTML 一等公民、無 runtime；任何框架可消費。 |
| 純 HTML 使用 | 手寫靜態 HTML / demo（CDN bundle 或 import map） | 單一 `<script>` 即用，無需 build。 |
| React 交付 | `@lit/react` wrapper（**所有 React 版本皆必需**） | React 19 native on-prop **不會**把 `onTcChange` 對到 `tc-change`；wrapper 是唯一正確路徑。 |
| 表單控件 | **Form-Associated Custom Elements（ElementInternals）** | Shadow DOM 內原生控件不會自動參與 `<form>`；FACE 是唯一正解。 |
| Cookbook | **Storybook ^9（web-components-vite）+ Vitest addon** | SB9 以 Vitest addon（browser mode）跑 story 級互動 + a11y。 |
| 套件管理 | **pnpm monorepo（workspace）+ `tsc -b` project references** | 分離關注點、跨套件型別與建置順序由 reference graph 強制。 |
| 模組格式 | **ESM-only**（不出 CJS） | 2026 新套件的標準；簡化 exports/types。 |
| 元件前綴 | `tc-`（Tzu Chi） | 例 `<tc-button>`；JS property camelCase；React prop camelCase。 |
| npm scope | `@tzuchi/` | scope 可調整，元件前綴固定。 |
| Token 格式 | **DTCG-only**（`$value`/`$type`/`{alias}`），**Style Dictionary v4**，`outputReferences: true` | 標準格式；保留主題化的 var() 串接。 |
| 版本管理 | **Changesets**（access public、ignore private apps） | monorepo 語意化版本標準。 |
| 樣式封裝 | **Shadow DOM + CSS Custom Properties + `delegatesFocus`** | 封裝且可主題化；焦點可穿透。 |

> Style Dictionary 版本固定 **v4**；§5.1 記錄 v4 的 dimension 行為與處理方式（issue #1398）。

---

## 3. 系統架構

### 3.1 四層金字塔

```
   docs 層   │ Storybook（cookbook）        │ 目錄、controls、autodocs、a11y、Foundations
   交付層    │ @tzuchi/react（wrappers）    │ React 用，CEM 生成；'use client'
   元件層    │ @tzuchi/components（Lit）    │ <tc-*> Web Components（單一來源）+ CEM
   地基層    │ @tzuchi/tokens（DTCG）       │ Figma 抽出的 design tokens
```

### 3.2 資料流與相依方向

```
Figma → *.tokens.json（DTCG）
      → Style Dictionary（outputReferences:true）→ tokens.css / tokens.js+.d.ts / tailwind.preset.cjs
      → @tzuchi/components（Lit，CSS 只用 var(--tc-*)，含 fallback）
      → cem analyze → custom-elements.json
            ├─→ @tzuchi/react（generate.ts 讀 CEM → wrapper + EventName 型別）
            ├─→ Storybook（setCustomElementsManifest → autodocs；argTypes 另行撰寫）
            └─→ apps/demo-html（CDN bundle / import map）
```

**單向相依**：`tokens ← components ← react / storybook / demo`。**不得反向相依**，並以 lint 機制強制（§4.3、§11）。

---

## 4. Monorepo 結構與建置

```
CISwebsite/
├─ packages/
│  ├─ tokens/        @tzuchi/tokens     — DTCG JSON + Style Dictionary
│  ├─ components/    @tzuchi/components — Lit Web Components + CEM（含 CDN bundle）
│  └─ react/         @tzuchi/react      — @lit/react wrapper（自動生成）
├─ apps/
│  ├─ storybook/     @tzuchi/storybook（private）— cookbook
│  └─ demo-html/     @tzuchi/demo-html（private）— 純 HTML demo
├─ pnpm-workspace.yaml
├─ tsconfig.base.json   composite:true、useDefineForClassFields:false、experimentalDecorators:true
├─ turbo.json           build dependsOn ['^build'] + outputs（快取與順序）
├─ .changeset/config.json   access:public、ignore 私有 apps
└─ package.json
```

### 4.1 套件職責、相依與分類

| 套件 | 對外匯出 | `dependencies` | `peerDependencies` |
|---|---|---|---|
| `@tzuchi/tokens` | `tokens.css`、`tokens.js`+`.d.ts`、`./tailwind`（.cjs） | — | — |
| `@tzuchi/components` | per-component subpath + class-only subpath + bundle + `./cdn` + `custom-elements.json` | `lit ^3`（library build 設 `external`，僅 CDN build 內嵌） | — |
| `@tzuchi/react` | per-component React 元件 + 型別（皆 `'use client'`） | `@tzuchi/components`（workspace:*） | `react`、`react-dom`（`^18 \|\| ^19`）、`@lit/react`、`lit ^3`（peer，與 components 共用單一 Lit 實例） |
| `apps/storybook` | —（private） | — | — |
| `apps/demo-html` | —（private） | — | — |

> `lit` 在 `@tzuchi/components` 為 `dependencies` 但 library build `external`（消費者 bundler 去重單一 Lit）；在 `@tzuchi/react` 為 `peerDependencies`（避免雙份 Lit registry → `customElements.define` 重複定義崩潰）。

### 4.2 建置目標分離（關鍵）
`@tzuchi/components` 產出**兩種不相容的 build**，不得用單一 Vite build 含混：

1. **Library build（npm 用）**：`rollupOptions.external: [/^lit/]`，保留 bare `lit` import；以 `build.lib.entry` 顯式具名 entry（每元件一個 + 一個 `base` 共用 chunk + barrel），`entryFileNames: '[name].js'` 保證檔名穩定；`TcElement`/共用 mixin 透過 manualChunks 落在**單一** shared chunk，不重複進每個 entry。
2. **CDN build（純 HTML 用）**：`external: []`，**內嵌 Lit**，單檔 ESM 輸出 `dist/cdn/tc-components.js`；僅由 `unpkg`/`jsdelivr` 路徑或 `./cdn` subpath 暴露，**不**進一般 `exports` 主路徑。

### 4.3 `exports` / `sideEffects` / 型別
- **`exports` map**：每個 subpath 條件區塊 `types` 排第一、`default` 最後；`"type": "module"`；ESM-only（不出 `require`）。
  ```jsonc
  "./button": { "types": "./dist/button.d.ts", "default": "./dist/button.js" },          // 自動註冊 <tc-button>
  "./button/class": { "types": "./dist/TcButton.d.ts", "default": "./dist/TcButton.js" }, // 純 class，不註冊
  "./cdn": { "default": "./dist/cdn/tc-components.js" },
  "./custom-elements.json": "./custom-elements.json"
  ```
- **`sideEffects` 用 allowlist**（不可用 boolean）：`["**/*.css", "**/*-define.js", "./dist/cdn/*"]`，只讓「註冊檔」與 CSS 保留 side-effect，其餘 tree-shakable。每元件提供「自動註冊 entry（`*-define`）」與「純 class entry」兩種形狀；React wrapper import 純 class，不觸發全域註冊。
- **型別**：以 **`tsc -b`（project references）** 跨套件 emit，順序由 reference graph 決定；`declarationMap:true`（跳轉回原始碼）。vite-plugin-dts 僅用於確認可 bundle 內部相依的 leaf build。

### 4.4 建置順序（機器強制）
- 每個消費套件以 `workspace:*` 宣告對生產套件的相依 → `pnpm -r` topo 排序。
- 每套件 `build` 內部自行 sequence：`@tzuchi/tokens` = `style-dictionary build`；`@tzuchi/components` = `tsc -b` → `vite build`（library）→ `vite build`（cdn）→ `cem analyze`；`@tzuchi/react` = `generate.ts`（讀 CEM）→ `tsc -b`。
- 以 **Turborepo**（`turbo.json`：`build.dependsOn: ['^build']` + outputs 快取）統一順序與 CI 加速；CI 跑一次 clean `node_modules` + clean `dist` 的 build 煙霧測試。

### 4.5 共用工具鏈
TypeScript strict · pnpm 9+ / Node 20 LTS+ · ESLint（`lit` plugin + `import/no-restricted-paths` 強制相依方向）+ Prettier · Style Dictionary v4 · Changesets。

---

## 5. Design Tokens（`@tzuchi/tokens`）

### 5.1 格式與管線（DTCG 規則）
- **DTCG-only**：`$value` / `$type` / 別名 `{group.name}`；拒絕 legacy `value`/`type`（不可混用）。
- `$type` 宣告於 **group 層**（最近共同祖先），不逐 token 重複。
- 以 **Style Dictionary v4** 編譯，`outputReferences: true`，CSS 輸出 `var()` 串接（primitive→semantic→component），**主題化才會生效**（否則 alias 被解析成字面 hex，覆寫 `:root` 無效）。
- **Dimension 策略**：v4 對 `$type:"dimension"` 的物件值有 issue #1398（會拆成 `--x-value`/`--x-unit` 兩個變數）。本專案採**字串 dimension**（`"$value": "16px"`，已知 v4 解法，技術上偏離 DTCG 物件形）以確保輸出單一 `--tc-space-16: 16px`。此決策記錄於此並加 schema 驗證。
- 輸出：`dist/tokens.css`（`:root{…}`）、`dist/tokens.js` + `dist/tokens.d.ts`（編譯後，非原始 .ts）、`dist/tailwind.preset.cjs`（Tailwind v3 JS preset，僅曝 semantic/component 層；列選用，依 §5.10）。
- 加入 **DTCG schema 驗證**步驟，malformed token 在 CI fail。

### 5.2 三層 token 模型與引用規則
1. **Primitive**：純色票/數值，無語意。`color.blue.900`、`font.size.46`。
2. **Semantic**：描述用途，指向 primitive。`color.brand.primary`、`color.text.default`。
3. **Component**：元件專屬，指向 semantic。`button.filled.bg`、`input.border.focused`。

**引用規則**：元件 CSS 只允許引用 **component 或 semantic** 層；且每個被引用 token 都要有**內聯 fallback**（如 `var(--tc-button-radius, var(--tc-radius-md, 8px))`），確保缺 `tokens.css` 也不至於完全裸樣式。

### 5.3 命名慣例
- CSS 變數前綴 `--tc-`，層級以 `-` 串接：`--tc-color-brand-primary`、`--tc-typography-heading-1-font-size`、`--tc-elevation-2`、`--tc-radius-md`、`--tc-space-16`、`--tc-focus-ring-color`。
- **色彩 ramp 規則（單一規則）**：所有色彩家族（含中性灰）一律用 `color.<hue>.<step>`，step 為 **50（最淺）→ 900（最深）** 的明度階。保留 Figma 原名做追溯欄位。
- 字級用 px-值命名 primitive（`font.size.46`），語意層用角色命名 composite（`typography.heading-1`）。
- 間距用 px-值命名（`space.16`），明示為 4px 基底刻度。

### 5.4 Color — Primitive（取自 Figma，重新命名為 hue ramp）

**Brand（Primary 系，Figma「Primary / Light1–3」）**

| token | hex | Figma |
|---|---|---|
| `color.blue.900` | `#1B2D58` | Primary |
| `color.blue.700` | `#30559F` | Primary - Light1 |
| `color.blue.500` | `#4F7BBE` | Primary - Light2 |
| `color.blue.400` | `#587291` | Primary - Light3（偏灰藍，沿用同家族） |

**Feedback 基色（修正 §舊版的 primitive/semantic 撞名）**

| token | hex | Figma |
|---|---|---|
| `color.red.500` | `#D4494F` | Error |
| `color.green.600` | `#168967` | Success |

**Neutral（Gray，10 階 + White，依明度配 50–900）**

| token | hex | Figma | | token | hex | Figma |
|---|---|---|---|---|---|---|
| `color.gray.900` | `#333333` | Gray1 | | `color.gray.400` | `#B3B3B3` | Gray6 |
| `color.gray.800` | `#4F4F4F` | Gray2 | | `color.gray.300` | `#BDBDBD` | Gray7 |
| `color.gray.700` | `#828282` | Gray3 | | `color.gray.200` | `#E0E0E0` | Gray8 |
| `color.gray.600` | `#8D8D8D` | Gray4 | | `color.gray.100` | `#F2F2F2` | Gray9 |
| `color.gray.500` | `#95969B` | Gray5 | | `color.gray.50` | `#F8F8F8` | Gray10 |
| | | | | `color.white` | `#FFFFFF` | White |

> 待實作核對：Figma 灰階多個相近值（#8D8D8D/#95969B、#B3B3B3/#BDBDBD）是否確為刻意區分；於 token 落地時對 Figma 逐一驗證。

**Extended / Accent（Figma「Secondary 1–12」，重命名為 hue 家族；M1 不被元件消費，標記 M2+ 保留）**

| token | hex | Figma | | token | hex | Figma |
|---|---|---|---|---|---|---|
| `color.teal.300` | `#77C9DA` | Secondary1 | | `color.gray-blue.600` | `#4C5364` | Secondary6 |
| `color.teal.400` | `#5DB0C5` | Secondary2 | | `color.teal.350` | `#5DC5C4` | Secondary7 |
| `color.orange.400` | `#E57F5F` | Secondary3 | | `color.teal.200` | `#B5D2CD` | Secondary8 |
| `color.amber.400` | `#E4AF49` | Secondary4 | | `color.teal.100` | `#D6EAE7` | Secondary9 |
| `color.green.400` | `#64BFA4` | Secondary5 | | `color.teal.50` | `#F1FAF9` | Secondary10 |
| `color.blue.100` | `#E8EEFE` | Secondary11 | | `color.blue.200` | `#D1DEFF` | Secondary12 |

> 這 12 色為延伸調色盤；M1 元件不直接引用（依 §5.2 元件不得用 primitive）。若 M1 某處需要，須先建立對應 semantic alias。

### 5.5 Color — Semantic（完整、定案，非示例）

| semantic token | → 指向 | 用途 |
|---|---|---|
| `color.brand.primary` | `{color.blue.900}` | 主要品牌色（filled 按鈕底、重點） |
| `color.brand.primary-hover` | `{color.blue.700}` | 主品牌 hover |
| `color.brand.surface` | `{color.blue.100}` | tonal 底色 |
| `color.brand.surface-hover` | `{color.blue.200}` | tonal hover 底 |
| `color.text.default` | `{color.gray.900}` | 主要文字 |
| `color.text.muted` | `{color.gray.700}` | 次要/說明文字 |
| `color.text.disabled` | `{color.gray.400}` | 停用文字 |
| `color.text.on-brand` | `{color.white}` | 品牌底上的文字 |
| `color.surface.default` | `{color.white}` | 卡片/輸入框底 |
| `color.surface.subtle` | `{color.gray.50}` | 次級面 |
| `color.border.default` | `{color.gray.300}` | 一般邊框 |
| `color.border.strong` | `{color.gray.700}` | 強調邊框 |
| `color.border.focus` | `{color.blue.500}` | 焦點環 |
| `color.feedback.error` | `{color.red.500}` | 錯誤 |
| `color.feedback.success` | `{color.green.600}` | 成功 |

### 5.6 Typography
**Primitive**
- `font.family.base`：DTCG `fontFamily`（array 形）`["Noto Sans TC", "system-ui", "-apple-system", "PingFang TC", "Microsoft JhengHei", "sans-serif"]`。
- `font.weight.regular = 400`、`font.weight.medium = 500`、`font.weight.bold = 700`。
- `font.size.{46,34,26,24,20,16}`（px 字串）。
- `line-height.{tight:1.3, snug:1.4, normal:1.5, relaxed:1.6}`（待對齊 Figma 行高 → §16 清單）。
- `letter-spacing.normal = "0"`。

**Semantic（DTCG `typography` composite，五鍵齊全）** — 對應 Figma：

| token | size | weight | line-height | Figma |
|---|---|---|---|---|
| `typography.heading-1` | 46 | bold | tight | H1 |
| `typography.heading-2` | 34 | bold | tight | H2 |
| `typography.heading-3` | 26 | bold | snug | H3 |
| `typography.heading-4` | 24 | bold | snug | H4 |
| `typography.title` | 20 | bold | normal | Title |
| `typography.subtitle` | 16 | bold | normal | Subtitle |
| `typography.body` | 16 | regular | relaxed | Body |
| `typography.tab-lg` | 34 | medium | normal | Tab Button-lg |
| `typography.tab-sm` | 20 | medium | normal | Tab Button-sm |

範例：
```jsonc
"typography": { "$type": "typography", "heading-1": { "$value": {
  "fontFamily": "{font.family.base}", "fontSize": "{font.size.46}",
  "fontWeight": "{font.weight.bold}", "lineHeight": "{line-height.tight}",
  "letterSpacing": "{letter-spacing.normal}" } } }
```
> Style Dictionary 的 typography→CSS shorthand transform 會略過 lineHeight/letterSpacing；本專案以**自訂 format 輸出拆分子變數**（`--tc-typography-heading-1-font-size` 等），元件分別引用。

### 5.7 Elevation（DTCG `shadow` 物件，非字串）
4 階，`$type:"shadow"`，`$value` 為結構物件。**精確值須在 build 前自 Figma 抽出**（§16），以下為待覆蓋的暫定：
```jsonc
"elevation": { "$type": "shadow",
  "1": { "$value": { "color": "#0000001a", "offsetX": "0px", "offsetY": "1px", "blur": "2px", "spread": "0px" } },
  "2": { "$value": { "color": "#0000001a", "offsetX": "0px", "offsetY": "2px", "blur": "6px", "spread": "0px" } },
  "3": { "$value": { "color": "#0000001f", "offsetX": "0px", "offsetY": "6px", "blur": "16px", "spread": "0px" } },
  "4": { "$value": { "color": "#00000029", "offsetX": "0px", "offsetY": "12px", "blur": "28px", "spread": "0px" } } }
```

### 5.8 其他必備類別（M1 元件實際需要）
- **Spacing**：`space.{4,8,12,16,20,24,32,40,48,64}`（px 字串）。**4px 基底刻度（8px 為主要節奏）**。
- **Radius**：`radius.{none:0, sm:"4px", md:"8px", lg:"16px", full:"9999px"}`（對齊 Figma → §16）。
- **Focus ring**：`focus-ring.color → {color.border.focus}`、`focus-ring.width:"2px"`、`focus-ring.offset:"2px"`。
- **Opacity**：`opacity.disabled:0.38`、`opacity.hover-overlay:0.08`。
- **Size**：`size.icon.{sm:"20px",md:"32px",lg:"40px"}`（對應 Figma icon 三尺寸）、`size.control.{md:"48px",lg:"64px"}`（icon-button）。
- **Motion**：`motion.duration.{fast:"150ms",base:"200ms"}`、`motion.easing.standard:"cubic-bezier(0.2,0,0,1)"`。
- **Z-index**：`z.{base:0,dropdown:1000,sticky:1100,overlay:1200,modal:1300,popover:1400,toast:1500}`（為 M2/M3 dropdown/calendar 預留）。
- **Breakpoint**：`breakpoint.{mobile:"0px",tablet:"768px",desktop:"1024px"}`（Tabs web/mobile 分界依此）。

### 5.9 Component tokens — 以 `tc-button` 完整示範（其餘元件比照列名）
```
button.radius              → {radius.md}
button.disabled-opacity    → {opacity.disabled}
button.focus-ring-color    → {focus-ring.color}
button.filled.bg           → {color.brand.primary}
button.filled.bg-hover     → {color.brand.primary-hover}
button.filled.fg           → {color.text.on-brand}
button.outlined.bg         → transparent
button.outlined.bg-hover   → {color.brand.surface}
button.outlined.border     → {color.brand.primary}
button.outlined.fg         → {color.brand.primary}
button.tonal.bg            → {color.brand.surface}
button.tonal.bg-hover      → {color.brand.surface-hover}
button.tonal.fg            → {color.brand.primary}
```
> 其餘 4 元件（icon-button、input、card、tabs）的 component token 於 §12（M1 任務）依此模式逐一枚舉並落地；驗收要求「無寫死值」（§13、§11 lint）。

### 5.10 主題化
- 換主題 = 在 `:root` 或容器覆寫 **semantic** 層 CSS 變數（因 `outputReferences:true`，component→semantic→primitive 的 var() 串接會 cascade）。
- 深色模式（非本期）將以 `[data-theme="dark"]` **重指 semantic alias**（第二份 token set）實作，不覆寫 primitive。token 輸出格式現在就選對以保留此能力。

### 5.11 Tailwind preset（選用）
若保留：固定 **Tailwind v3 JS preset**，以自訂 Style Dictionary format 生成，只曝 semantic/component 層（不曝 primitive），透過 `./tailwind` 的 `require` 條件提供；否則自 M1 移除。

---

## 6. 元件層（`@tzuchi/components`）

### 6.1 基底與慣例
- 全部繼承 `TcElement extends LitElement`（共用 reset、`defineElement` 註冊輔助、共用工具）。
- **變體以 reflected boolean/enum attribute 表達**，且**每個變體 attribute 必有對應的 Lit reactive property**（`type:Boolean/String, reflect:true`），確保 React wrapper 總是以 property 設值，避免 React false-prop 省略歧義。
- **內容以 slot 提供**；具名 slot（`start`/`end`/`icon`/`media`/`footer` 等）。
- **互動以 Custom Event 對外**：命名 `tc-<action>`；一律 `composed: true`，`bubbles` **逐事件決定**（傳遞型動作如 `tc-tab-change` 用 true；值變更型如 `tc-input` 預設 false 或明確記錄），避免巢狀元件 phantom 捕捉。每個事件以具型別的 `CustomEvent` 子類定義，`detail` 結構化。

### 6.2 樣式與狀態實作規則
- Shadow DOM；`static styles` 內 CSS 僅引用 `var(--tc-*)`（component/semantic 層）**並帶 fallback**，不寫死值。
- hover/focus/active 用原生偽類（`:hover`、`:focus-visible`、`:active`）對應 Figma 狀態；`:focus-visible` 焦點環用 `--tc-focus-ring-*` token。
- **disabled** 一律以**停用內部原生控件**（`<button disabled>` / `<input disabled>`）+ ElementInternals `ariaDisabled` 實作，**禁用 `pointer-events:none` 走捷徑**（避免焦點卡死與 SR 誤報）；host 攔截/重導 disabled 時的雜散 click。
- **SSR-safe 撰寫**（即使 SSR 延後）：constructor/connectedCallback 在首次 render 前不存取 DOM/量測、守衛 `window`/`document`；class 模組無 side-effect。

### 6.3 表單控件 — Form-Associated Custom Elements（強制規則）
任何參與 `<form>` 的元件（`tc-input`、`tc-button[type=submit|reset]`）**必須**：
- `static formAssociated = true`；`#internals = this.attachInternals()`。
- 於 input/change 呼叫 `this.#internals.setFormValue(value)`。
- 以 `setValidity()` 反映 `required`/`invalid`（連動 `aria-invalid`）。
- 實作 `formResetCallback`/`formStateRestoreCallback`/`formDisabledCallback`。
- `tc-button` 的 submit/reset 透過 `this.#internals.form?.requestSubmit()/reset()`（shadow 內的原生 `<button type=submit>` **不會**提交外層 light-DOM form）。
- 2026 瀏覽器普遍支援，無需 polyfill（Safari 早期版本若需支援，列相容性備註）。

### 6.4 焦點委派與跨 shadow 標示
- `tc-input`、`tc-icon-button`、interactive `tc-card` 以 `attachShadow({ mode:'open', delegatesFocus:true })`（或覆寫 `focus()`）讓外部 `.focus()` 與 label 點擊能聚焦內部控件。
- **外部 `<label for>` 無法跨 shadow 邊界指向內部 input** → `tc-input` 以**內建 label**（slot/property）或 `ElementInternals` ARIAMixin（`ariaLabelledByElements`）關聯；helper/error 訊息渲染於 shadow 內並以 `aria-describedby`（同 root 內）關聯。文件明示此限制。

### 6.5 註冊與重複定義守衛
- 提供 `defineElement(tag, ctor)`：先 `customElements.get(tag)` 判斷，已存在則 no-op（並於版本不符時 warn）。避免雙載/HMR 時 `define` 重複拋錯。

### 6.6 CEM 授權契約（重要：不是自動抽出）
- CEM 的 `cssParts` / `cssProperties` / `slots` / `events` **只**來自手寫 JSDoc 標籤。每個元件 class **必須**標註 `@slot`、`@csspart`、`@cssprop`、`@event`（含事件 `type`），這些標籤即是 parts/vars/slots/events 的**單一真實來源**，餵給 React wrapper、autodocs、VS Code custom-data。
- 加 lint 規則：模板中出現的 `part="x"` 若無對應 `@csspart` 則 fail。
- 每元件**枚舉公開的 `::part` 與 component CSS 變數**（見 §11），避免主題 API 漂移。

### 6.7 匯出與進入點
- 每元件兩種 entry：自動註冊（`@tzuchi/components/button`，內含 `defineElement`）與純 class（`@tzuchi/components/button/class`）。
- 整包 barrel（註冊全部）僅供 CDN bundle；文件警告：從 barrel import 會破壞 per-component tree-shaking。
- 純 HTML 用 `./cdn` 單檔（內嵌 Lit）。

---

## 7. React 交付層（`@tzuchi/react`）

### 7.1 wrapper 是所有 React 版本的必需路徑
- React 19 native on-prop 取 `on` 之後的字面字串為事件型別（僅辨識 `Capture`），**不做** camel→kebab 轉換：`onTcChange` 會監聽名為 `TcChange` 的事件，**永遠對不到** `tc-change`。故 `@lit/react` wrapper（含顯式 events map）在 **React 18 與 19 皆必需**，非選用。§16 風險表據此修正。
- wrapper 同時處理 React <19 的「設 attribute 而非 property」問題（`value`/`disabled`/物件型 props 才能正確 round-trip）。

### 7.2 生成器契約（`generate.ts` 讀 CEM）
- 對每個 CEM event：React prop = `'on' + PascalCase(kebab)`（`tc-change`→`onTcChange`，`tc-tab-change`→`onTcTabChange`），並 emit `events: { onTcChange: 'tc-change' as EventName<TcChangeEvent> }` 的型別轉換；event detail 因此具型別。
- 元件須為每個事件宣告具型別的 `CustomEvent` 子類，CEM analyzer 擷取其 `type.text` 供 cast。
- **原生事件碰撞**：曝露原生 `click` 的元件保留 React 內建 `onClick`，不再包一層。
- import 元件**純 class**（不觸發全域註冊）。
- 屬性命名：HTML kebab（`full-width`）↔ JS/Lit property camelCase（`fullWidth`）↔ React prop camelCase（`fullWidth`）。

### 7.3 'use client' 與 SSR
- `src/generated/` 每個檔與 `src/index.ts` **首行 `'use client'`**。
- SSR 是**硬性錯誤非 FOUC**：在 Next.js RSC/SSR 直接 import 會 `HTMLElement/window is not defined` 拋錯。M1 基線：以 `next/dynamic(() => import(...), { ssr:false })` 消費；真正 SSR/hydration（`@lit-labs/ssr-react`、`@lit-labs/nextjs`、defer-hydration）列 M3。
- `:not(:defined)` 僅用於 CSR 的 FOUC 遮罩，**非** SSR 解法。

### 7.4 受控輸入契約
- `tc-input` 的 `value` 為真 property 並鏡射至內部 `<input>`；`tc-input` 事件每次鍵入即派發，使 React 受控用法（`value` + `onTcInput`）可行。提供受控的 Storybook React story 鎖定 IME/游標行為；明示是否支援非受控（`defaultValue`）。

### 7.5 生成產物的新鮮度
- CI gate：跑 `cem analyze` + `generate.ts` 後 `git diff --exit-code` 檢查 `custom-elements.json` 與 `src/generated/`，過期即 fail（或 gitignore 生成物、build 時必重生）。生成器版本戳記以利追溯。

---

## 8. 純 HTML 消費（`apps/demo-html`）

```html
<!-- A. 無 build：CDN 單檔（內嵌 Lit）+ tokens.css -->
<link rel="stylesheet" href="/tokens.css">
<script type="module" src="https://cdn.jsdelivr.net/npm/@tzuchi/components/dist/cdn/tc-components.js"></script>
<tc-button variant="filled">送出</tc-button>

<!-- B. import map（用 bare 'lit' 但無 bundler） -->
<script type="importmap">{ "imports": { "lit": "https://esm.sh/lit@3" } }</script>
<script type="module">import '@tzuchi/components/button';</script>
```
- `demo-html` 為手寫 `index.html`，同時使用 M1 的 5 元件，作為「Pure HTML 路徑可跑」驗收證據。
- 文件說明 `tokens.css` 引入與 semantic 變數覆寫主題的方法。

---

## 9. Storybook Cookbook（`apps/storybook`）

- **固定 Storybook ^9**，框架 `@storybook/web-components-vite`。
- `.storybook/preview`：`import customElements from '../../packages/components/custom-elements.json'` → `setCustomElementsManifest(...)`；全域 decorator 注入 `tokens.css`；開 `autodocs`。
- **argTypes 非自動**：CEM 只填 autodocs 表，controls 需逐 story 撰寫 `argTypes`（select/radio/boolean + options）（或用 CEM→argTypes helper）。
- **a11y addon（axe）**：須設定**穿透 shadow root**（否則零違規是假綠）；a11y dev 面板不等於 CI a11y。
- **互動測試**：以 **Vitest addon（browser mode）** 跑 story 級 play function + a11y；@web/test-runner 跑低階單元（§10）。
- React stories：`@tzuchi/react` wrapper 渲染同一批 custom element，無需另一 renderer，驗證兩條交付路徑。
- **Foundations 區塊**：自 tokens 渲染色票表（含 hex）、字級表、Elevation、間距/圓角 scale。

---

## 10. 測試與品質（Testing & QA / CI gates）

| 類型 | 工具 | 範圍 |
|---|---|---|
| 元件單元 | `@web/test-runner` + `@open-wc/testing` | 屬性反映、slot 渲染、事件派發 |
| 互動（play） | Storybook Vitest addon（browser mode） | 鍵盤導覽、roving tabindex、hover/focus |
| 表單參與 | 同上 + 真實 `<form>` | FormData 含值、submit/reset、validity |
| 無障礙 | axe（穿透 shadow）+ Storybook a11y | 每元件違規為 0（含 missing-label 失敗案例） |
| RTL / i18n / CJK | 測 `dir=rtl` 與 Noto Sans TC | logical 屬性、CJK 字型 |
| 型別 | `tsc -b --noEmit` | 全 monorepo |
| 套件健檢 | **`publint` + `@arethetypeswrong/cli --pack`** | exports/types map 正確 |
| CDN 煙霧 | headless 載入 `dist/cdn/tc-components.js` | 無 bare `lit` 漏出、`tc-button` upgrade |
| 安裝消費 | pack tarball → 裝進 fixture app → import + type-check | exports 端到端 |
| 無寫死值 | stylelint/ESLint 規則（禁 `*.styles.ts` 出現 hex/px 字面） | 背書「皆來自 token」 |
| 相依方向 | `import/no-restricted-paths`（或 dependency-cruiser） | 強制單向相依 |
| 視覺回歸 | Chromatic/Playwright（選用，後續） | 視覺差異 |

CI 必過閘門：lint（含相依方向 + 無寫死值）→ `tsc -b` → 單元/互動/a11y/表單 → publint/attw → CDN 煙霧 → clean build 煙霧。

---

## 11. 元件規格 — Milestone 1（5 元件 + 支援用 tc-icon）

> 各元件須含：JSDoc（`@slot`/`@csspart`/`@cssprop`/`@event`）、CEM entry、React wrapper、Storybook story（argTypes + autodocs + a11y 0）、單元/互動測試、HTML demo 使用、exports entry、樣式全 token 化、對 Figma 視覺核對。公開 `::part` 與 CSS 變數逐元件枚舉。

### 11.1 `tc-button`（Figma `2257:9353`）
- attributes/properties：`variant`（`filled|outlined|tonal`，預設 filled）、`type`（`button|submit|reset`，預設 button）、`disabled`、`full-width`（↔ `fullWidth`）。
- slots：default（標籤）、`start`、`end`。parts：`base`。CSS 變數：`--tc-button-radius` 等（§5.9 枚舉）。
- events：原生 `click`（disabled 時不觸發，由停用內部 `<button>` 實現）。
- **表單**：`type=submit|reset` 時為 form-associated（§6.3），以 internals `form.requestSubmit()/reset()`。
- a11y：內含原生 `<button>`；`:focus-visible` 焦點環。

### 11.2 `tc-icon-button`（Figma `2257:9321`）
- attributes：`variant`（`tonal|filled`，預設 tonal）、`size`（`md=48|lg=64`）、`disabled`、`label`（**必填**）。
- slots：default（放 `tc-icon`）。
- a11y：`label` 缺失時**渲染不出可存取名稱即為錯誤**——`label` 為必填 property；缺失時 dev 拋警並由 axe 的 missing-label 案例證明失敗模式（非僅 console.warn 帶過）。

### 11.3 `tc-input`（Figma `2266:4995`；trailing icon 取自 `2266:5022`）
- properties：`value`、`placeholder`、`type`（`text|email|password|number|search|tel`）、`name`、`disabled`、`readonly`、`required`、`invalid`、`label`、`helper-text`、`error-text`。
- slots：`prefix`、`suffix`（icon，如 calendar/search/clear）。
- events：`tc-input`（每次輸入，`detail:{value}`，`bubbles:false`）、`tc-change`（commit/blur，`detail:{value}`）。明示二者相對原生事件的觸發時機；`value` 為 property。
- **表單**：form-associated（§6.3）；focus 委派 + 跨 shadow label（§6.4）。
- a11y：內部原生 `<input>`；label/helper/error 渲染於 shadow 內並關聯。

### 11.4 `tc-card`（Figma `2257:9435`）
- attributes：`variant`（`elevated|outlined`，預設 elevated，elevated 用 `elevation` token）、`interactive`、`href`。
- slots：`media`、`headline`、default、`footer`（動作區）。
- **巢狀互動規則**：`href` → 整卡為單一 `<a>`（stretched-link 模式，讓 `footer` 內的按鈕/連結仍可獨立操作且不巢狀於 `<a>`）；`interactive`（無 href）→ host 派發 click 並可聚焦。**禁止** focusable 卡片包住其他 focusable 控件造成巢狀互動違規；文件明示優先序與限制。
- a11y：interactive 可鍵盤聚焦 + Enter 觸發。

### 11.5 `tc-tabs` + `tc-tab`（Figma `2257:9456`）
- `tc-tabs`（`role=tablist`）：`variant`（`web|mobile`，預設 web）、`value`（目前選取）。event `tc-tab-change`（`detail:{value}`，`bubbles:true`）。
- `tc-tab`（`role=tab`）：`value`（必填）、`disabled`（以 **`aria-disabled`** 表示，非原生 disabled，使其仍可被 roving tabindex 巡覽）、`selected`（容器管理，`aria-selected`）。slots：default、`icon`。
- **方向鍵與 orientation**：依 `variant` 設 `aria-orientation`（web 水平→左右鍵；mobile 若為垂直堆疊→設 `vertical` 並上下鍵；若 mobile 仍為水平則維持左右鍵）；Home/End 跳首尾。
- **tabpanel**：M1 `tc-tabs` 僅管理 tablist；以 `aria-controls` 指向**消費者提供**的 panel id（文件明示 panel wiring 為消費者責任），不內建 `tc-tabpanel`（列 M2 視需求）。
- **M1 樣式範圍**：Figma 多種 `Style=`（tonal / tool bar / gray / dark-blue…）中，M1 僅落地 **web default + tonal** 兩種；其餘記錄並排 M2。

### 11.6 `tc-icon`（支援元件，Figma `2257:9270`）
- attributes：`name`、`size`（`sm=20|md=32|lg=40`，對應 `size.icon.*`）。
- 實作：M1 內聯 SVG / sprite 提供核心子集（search、close、arrow、calendar 等 icon-button/input/tabs 所需）；完整圖示庫列 M2。

---

## 12. Milestone 範圍與驗收

### 12.1 M1 分兩階段（降低工具鏈風險）
- **M1a — 管線打通（reference component）**：monorepo 骨架 + `@tzuchi/tokens` 全套（含 §5.4–5.9 + §16 抽值）+ `tc-button` 端到端（Lit + CEM JSDoc + React wrapper + Storybook story/argTypes/a11y + HTML demo + 全 CI 閘門 publint/attw/CDN 煙霧/clean build）。
- **M1b — 其餘元件**：在已驗證管線上完成 `tc-icon`、`tc-icon-button`、`tc-input`（FACE）、`tc-card`、`tc-tabs`/`tc-tab`，各補齊 component token、JSDoc、wrapper、story、測試。

### 12.2 驗收標準
- [ ] `pnpm build`（clean）全套件成功；順序由 project references / Turborepo 強制。
- [ ] tokens 值**與 Figma 抽取值一致**（§16 清單全數回填，非僅「build 成功」）。
- [ ] 5 元件（+tc-icon）各有 Storybook story + autodocs + a11y（穿透 shadow）0 違規（含 missing-label 失敗案例）。
- [ ] 單元 + 互動 + 表單參與 + RTL/CJK 測試全綠；鍵盤與事件覆蓋。
- [ ] `apps/demo-html` 無 build（CDN 單檔 + tokens.css）正確渲染並可互動、可表單提交。
- [ ] React demo 用 `@tzuchi/react` wrapper 在 React 18 與 19 皆正常（含受控 `tc-input`）。
- [ ] `tsc -b`、ESLint（含相依方向 + 無寫死值）、publint、attw 全綠。
- [ ] 每元件對 Figma 對應 frame 視覺核對簽核（顏色/間距/陰影/圓角）。
- [ ] 生成物（CEM、React wrapper）非過期（`git diff --exit-code`）。

### 12.3 後續 Milestones
- **M2**：Chips、Radio、Checkbox、Dropdown、Pagination、Link、完整 Tabs 樣式、完整圖示庫、（視需求）`tc-tabpanel`。
- **M3**：Input Calendar 完整日曆、深色主題、SSR/Next.js（`@lit-labs/ssr-react`/`nextjs`、defer-hydration）、視覺回歸（Chromatic）、scoped custom element registry（多實例嵌入）。
- **M4**：Vue / Svelte / Angular wrapper（自 CEM 生成）、對外品牌化 docs site。

---

## 13. 命名與慣例

- 元件 `tc-<name>`（kebab）；React `Tc<Name>`（Pascal）。
- 屬性映射規則：**HTML attribute kebab-case ↔ JS/Lit property camelCase ↔ React prop camelCase**（`full-width` ↔ `fullWidth`）；所有變體 attribute 須有對應 reactive property。
- Custom Event `tc-<action>`；React prop `onTc<Action>`；`composed:true`，`bubbles` 逐事件。
- CSS 變數 `--tc-<category>-<name>`；CSS part 語意命名（`base`/`control`/`label`/`prefix`/`suffix`）。
- 檔案：每元件一資料夾，`tc-<name>.ts`、`tc-<name>.styles.ts`、`tc-<name>-define.ts`（註冊）、`index.ts`。
- Token 檔 `*.tokens.json`，依 primitive/semantic/component 分檔。
- 色彩 ramp `color.<hue>.<50–900>`；字級 primitive `font.size.<px>`、語意 `typography.<role>`；間距 `space.<px>`。

---

## 14. 治理（Governance）

- **版本與發佈（Versioning & Release）**：Changesets；0.x 階段不保證 API 穩定（breaking 可在 minor）；1.0 後遵循 semver。公開 API 範圍 = 各套件 `exports` 所列 subpath + CEM 所載 attribute/property/slot/event/part/cssprop。`.changeset/config.json`：`access:"public"`、`ignore` 私有 apps、tokens 獨立版本、components+react 可 `linked`。釋出流程：clean build →（重生 CEM/wrapper）→ `changeset version` → commit → `changeset publish`。
- **瀏覽器支援矩陣**：常青版 Chrome/Edge/Firefox/Safari（最近 2 版）；需 Custom Elements v1、Shadow DOM、ElementInternals、`:focus-visible`（皆 2023+ baseline）；不支援 IE。
- **貢獻流程（Contribution）**：feature branch → PR → 必過 CI 閘門（§10）→ review；文件含「如何端到端新增一個元件」步驟。
- **Definition of Done（每元件）**：Lit 實作 + 樣式全 token 化 + （表單控件）FACE + JSDoc 四標籤 + CEM entry + React wrapper 生成 + Storybook story(argTypes/autodocs/a11y 0) + 單元/互動/(表單)測試 + 鍵盤 + 對 Figma 視覺核對 + exports entry + HTML demo 可用。
- **RTL / i18n**：一律用 CSS logical 屬性（`margin-inline`、`padding-inline`、`inset-inline`）；支援 `dir=rtl`；CJK 字型；不硬編 LTR 方向。
- **效能預算**：每元件 entry（不含 Lit）gzip 目標 ≤ 5KB；共用 Lit 約 ~5KB；核心 5 元件 + Lit 之 CDN bundle 目標記錄並於 CI 監測。
- **License**：發佈用 `@tzuchi/*` 套件須具 `license` 欄；預設 `UNLICENSED`（內部）；若開源改 MIT（需組織決定）。

---

## 15. 風險與取捨（已修正）

| 風險 | 影響 | 緩解 |
|---|---|---|
| React 各版本對 kebab custom event 無法 native 監聽 | React 事件失效 | `@tzuchi/react` wrapper 為**所有版本**必需路徑（§7.1） |
| Shadow DOM 內表單控件不參與 `<form>` | 表單壞掉 | 強制 FACE / ElementInternals（§6.3） |
| SSR import 即 crash（非 FOUC） | Next.js 構建失敗 | `'use client'` + `next/dynamic{ssr:false}` 基線；真 SSR 列 M3（§7.3） |
| Shadow DOM 下 ARIA IDREF / label 跨界失效 | a11y 壞 | label/helper/error 渲染於 shadow 內 + `delegatesFocus`（§6.4） |
| CDN 與 library build 外部化需求相反 | 載入失敗/雙份 Lit | 兩種 build 分離（§4.2） |
| `sideEffects` 與 tree-shaking 衝突 | 元件不註冊或無法搖樹 | allowlist + `*-define` 檔（§4.3） |
| Figma 精確值（陰影/行高/圓角/字型）未在 metadata | 視覺對齊 | §16 抽值清單列為 build 前置任務 |
| Tabs 樣式/圖示庫龐大 | 範圍膨脹 | M1 限定 web default+tonal、核心 icon 子集 |
| 重複 `customElements.define` | 雙載崩潰 | `defineElement` 守衛（§6.5） |

---

## 16. Build 前置：須自 Figma 抽取的精確值（M1a 任務，含驗收）

以 `get_design_context` / `get_screenshot` 自對應 node 抽取並回填 token，**作為 M1a 的前置任務與驗收項**（非註腳）：
- Elevation 1–4 的精確 shadow（node `2257:9266`）。
- 9 個 typography 角色的行高（node `2257:9118`）。
- Radius：按鈕/卡片/輸入框/chip 圓角（各對應 frame）。
- 確切 `font.family.base`（授權字型；影響行高與 composite 值）。
- 按鈕等內距/控件高度（對齊 Figma，映射至 `space.*`，不直接照搬非刻度值如 70px）。

---

## 17. 已決事項與假設

- npm scope `@tzuchi/`；元件前綴 `tc-`（固定）。
- M1 元件 = Button / Icon Button / Input / Card / Tabs（+ 支援 `tc-icon`），分 M1a（tokens + button 端到端）/ M1b（其餘）。
- 保留 Changesets；ESM-only；Style Dictionary v4（`outputReferences:true`、字串 dimension）。
- `@tzuchi/react` wrapper 為所有 React 版本必需；支援 React 18 & 19；SSR 列 M3。
- 表單控件採 FACE；色彩採 `color.<hue>.<50–900>` 單一命名規則；feedback 用 `color.red.500`/`color.green.600` primitive。
- Elevation/行高/圓角/字型精確值依 §16 在 build 前抽取回填。
- 本期不含深色主題、其他框架 wrapper、對外 docs site、完整圖示庫、完整日曆、完整 SSR。

---

*本文件為設計規格（spec）。經使用者審閱確認後，將以 `writing-plans` 產出逐步實作計畫。*
