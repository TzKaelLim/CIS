# 03 元件規則：優化、新增和完成的條件

這份規定怎麼「優化」或「新增」一個元件，以及做到什麼程度才算完成。依據：整體規格第 8 節、`docs/component-roadmap.md`。

規則編號 R-C-xx。

- **優化**：HeroUI 已經「部分對應」的元件，在它的基礎上補齊或延伸。
- **新增**：HeroUI 完全沒有的元件，加進 kit。
- 只調整 HeroUI 元件在慈濟主題下的外觀、不加新行為的，照現在的做法改 `heroui/styles/themes/tzuchi/components/<元件名>.css`，不算路線圖上的「優化」，但第 4 節的建造規則一樣適用。

## 1. 先有路線圖的一列

- R-C-01　每一個要優化或新增的元件，都要先是 `docs/component-roadmap.md` 裡的一列（同內容的 `docs/component-roadmap.json` 也有）。不在路線圖上的，Claude 先停下來問專案負責人，由一個 PR 把它加進路線圖，再動手。
- R-C-02　路線圖現有的 73 列一列都不刪；重複的項目（例如 R-035 與 R-034、R-068 與 R-067）保留，並註明和哪一列重複。每一列的編號固定不變（換階段也不改）；新加的項目從 R-074 往後編，不重用編號。
- R-C-03　路線圖的 `.md` 和 `.json` 在同一個 PR 裡一起改，內容一致。怎麼檢查：人工檢查，機器檢查尚未實作（建議日後在 `scripts/` 加一個比對兩個檔案的檢查）。
- R-C-04　**待辦清單**的意思是：已經列入、決定日後要做，但**還沒有開始**，也不排進目前的批次。要開始做待辦清單上的一項，先開一個 PR，把那一列移到第一批或第二批，由專案負責人核可（暫定，見 `01-co-editing-sop.md` 第 1 節）；合併之後才開工。移動一列時，一起更新 `.md` 第 3 節的數量表、各節標題的項目數，和 `.json` 的 `counts`。
- R-C-05　動工前仍要做三級判斷（`02-design-rules.md` 第 7 節）。路線圖上的每一項都照專案負責人「接近的就優化、沒有就添加」的決定做成 kit 的元件；內部可以直接用 Tailwind 工具類別實作的（路線圖第 10 節），做成很薄的一層元件，Tailwind 是實作方式，不是取代元件。某一項想改成「不做元件」，要由專案負責人決定，並在路線圖那一列註明。

## 2. 動手的順序

1. **找到路線圖的那一列**，確認它在第一批或第二批（待辦清單的先照 R-C-04 移出來）。
2. **三級判斷**：照 `02-design-rules.md` 第 7 節問清楚，寫進 PR。
3. **美編（設計）先提供視覺設計**（R-C-06）。新元件的視覺設計一律先由美編（設計）提供並核可（核可分工暫定，見 `01-co-editing-sop.md` 第 1 節），才開始實作；優化會改變外觀的，也一樣。這段期間路線圖的狀態是「設計中」。
4. **設計核可後才實作**，狀態改成「實作中」。
5. **實作的 PR** 裡，照第 5 節的完成條件做完，並在同一個 PR 裡把路線圖的狀態改成「已完成」（R-C-07）；PR 合併時就完成了。

狀態只有四種：未開始、設計中、實作中、已完成。每次改狀態都照 SOP 開 PR。

## 3. 元件放哪裡〔提案，待工程確認〕

`heroui/` 是 vendored 的 HeroUI v3.2.6 原始碼（Apache-2.0），不能變成我們自己元件的家：它的每一處修改都要標 `LOCAL CHANGE` 並列進 `heroui/NOTICE.md`，日後才能照 `heroui/MAINTAINING.md` 比對上游、手動挑選修正。`packages/components`、`packages/react` 是凍結的舊 Lit 元件，也不能放新東西。所以整體規格第 8.5 節（S-64 到 S-66）和路線圖第 11 節提議：

- R-C-08　**新增的元件**放在新的套件 `packages/ui`（套件名稱暫定 `@tzuchi/ui`，`private`）。每個元件一個資料夾，參考 HeroUI 的元件資料夾慣例（HeroUI 本身把 React 元件放在 `heroui/react`、樣式放在 `heroui/styles`，分成兩個套件；本提案放在同一個套件）：

  ```
  packages/ui/
    src/components/<元件名>/
      <元件名>.tsx          React 元件，以 @heroui/react 的元件或 react-aria-components 為底
      <元件名>.styles.ts    tailwind-variants 的 tv()，定義變體
      <元件名>.stories.tsx  Storybook 的 stories
      index.ts
    styles/components/<元件名>.css
  ```

  元件名用小寫英文和連字號（例如 `carousel`、`metadata-list`）；class 名稱加我們自己的前綴（例如 `tc-ui-carousel`），不和 HeroUI 的 class 撞名。Storybook 用同一個（`heroui/storybook`），要改兩處，都是 `LOCAL CHANGE`、都要列進 `heroui/NOTICE.md`：`.storybook/main.ts` 的 `getStories()` 加上 `packages/ui` 的 stories 路徑；`heroui/storybook/styles/globals.css` 加上指向 `packages/ui/src` 的 `@source`（今天它只掃 `heroui/react/src/components`，`packages/ui` 用到的 Tailwind class 才會被編譯），並 `@import` `packages/ui/styles` 的 CSS。使用 kit 的網站也要在自己的 Tailwind 設定對 `@tzuchi/ui` 加 `@source`，並載入它的 CSS。

- R-C-09　**優化 HeroUI 的元件**（加變體、零件或行為；只調整外觀的不算優化，見本檔開頭），依序選第一個做得到的方法：
  1. 在 `packages/ui` 做一個包裝或延伸的元件，裡面組合 HeroUI 的元件，用我們自己的名稱匯出。HeroUI 原本的元件、屬性和變體保持不動。
  2. 只有在外面真的做不到時（例如 HeroUI 的錯誤、HeroUI 沒有開放的介面），才在 `heroui/` 裡改，標 `LOCAL CHANGE` 並列入 `heroui/NOTICE.md`，PR 寫清楚為什麼包一層做不到；這類 PR 一定要工程核可。原則上不在 `heroui/` 裡新增 variant。
- R-C-10　**這個位置確認之前**，Claude 不自己建立 `packages/ui`，也不把新元件放進 `heroui/` 或凍結的 Lit 套件；遇到要新增元件時，先停下來問工程。

## 4. 建造規則

- R-C-11　**token**：元件需要自己的 token 時，加在 `packages/tokens/src/component/<元件名>.tokens.json`，每個 token 只定義一次（R-D-08）。網站可能想改的值（顏色、圓角、間距等）都做成元件 token，第一級的差異才有地方覆寫。顏色類的元件 token 指向語意色。
- R-C-12　**顏色**：元件的 CSS 顏色只讀 HeroUI 的主題變數（例如 `--accent`、`--surface`）或 `generate.mjs` 產生的 `--tzuchi-*` 變數，不直接讀 `--tc-color-*` 或顏色類的元件 token（否則在 `tzuchi-dark` 下會拿到淺色值；規則寫在 `heroui/styles/themes/tzuchi/components/index.css` 開頭）。和色彩模式無關的值（間距、圓角、字級、動態）可以直接讀 `--tc-*`。需要新的顏色時，在 `generate.mjs` 加對應的 `--tzuchi-*` 變數（改 `heroui/`，先問工程）。
- R-C-13　**變體**：依用途命名、每個選項 4 到 5 個值以內（超過時照 R-D-23 停下來問）、用過不改名不刪除（R-D-21 到 R-D-23）。優化的元件保留 HeroUI 原本的屬性和變體名稱。
- R-C-14　**狀態**：互動元素都有 hover、focus（看得到的焦點框）、disabled，以及適用的 pressed、invalid、loading 狀態；慈濟主題的焦點樣式照 `DESIGN-LANGUAGE.md`。
- R-C-15　**鍵盤**：所有互動都能只用鍵盤完成（Tab 移動、Enter／Space 啟動、Esc 關閉彈出層、方向鍵在清單和輪播裡移動等適用的操作）。
- R-C-16　**標籤**：所有互動元素和表單欄位都有可讀的名稱或標籤；只有圖示的按鈕要有給螢幕閱讀器的文字標籤。
- R-C-17　**每一種組合都正常**：在每一個主題 × 每一個色彩模式下都正常，文字和背景的對比至少 4.5:1（算法見 R-D-14）。今天正式的主題只有 Default，所以是 HeroUI 慈濟主題的淺色（`tzuchi`）和深色（`tzuchi-dark`）都要看過。
- R-C-18　**介面文字**：元件內建的文字（預設標籤、提示、按鈕文字）用繁體中文（台灣用語）。
- R-C-19　**不發出第三方請求**：不從外部載入字型、圖示、圖片、腳本或樣式；範例圖片放在 repo 裡。
- R-C-20　**相依套件**：用 workspace 和 lockfile 裡已有的套件；需要新的外部套件時先問工程，版本要發布滿 14 天，寫精確版本（R-S-26）。
- R-C-21　**不複製**：不為某個網站複製一份元件（R-D-31）。凍結的 Lit 元件（`tc-*`）只當參考，不修改、不搬進來直接用。

## 5. 完成的條件

一個優化或新增的元件，下面每一項都做到才算完成。「怎麼檢查」寫的是今天能用的方法。

| 編號 | 條件 | 怎麼檢查 |
| --- | --- | --- |
| R-C-30 | PR 寫明屬於哪一級（第三級才是新元件）和理由 | 人工檢查（PR 範本的「屬於哪一級」） |
| R-C-31 | 程式放在第 3 節的位置；改到 `heroui/` 的地方都有 `LOCAL CHANGE` 註解，並列入 `heroui/NOTICE.md` | 人工檢查，機器檢查尚未實作 |
| R-C-32 | 顏色只來自主題變數；需要的元件 token 在 `packages/tokens/src/component/` 定義一次 | `pnpm --filter @tzuchi/tokens test`；`git add` 之後跑 `pnpm run heroui:theme && git diff --exit-code -- heroui/styles/themes/tzuchi/variables.css`；顏色來源：人工檢查 |
| R-C-33 | 變體依用途命名，每個選項 4 到 5 個值以內 | 人工檢查 |
| R-C-34 | 狀態（hover、focus、disabled 等）、鍵盤操作和標籤都做到 | 人工檢查；Storybook 的 `@storybook/addon-a11y` 可以幫忙看，但不是必須通過的關卡 |
| R-C-35 | 在每一個主題 × 色彩模式下都正常，對比至少 4.5:1 | Claude 照 R-D-14 算出對比，寫進 PR；畫面：人工檢查，機器檢查尚未實作 |
| R-C-36 | Storybook 每個變體各有一個 story，並涵蓋適用的主要狀態（停用、錯誤、載入中等） | `pnpm run heroui:storybook:build` 能建置；涵蓋程度：人工檢查 |
| R-C-37 | 手冊有這個元件的頁面。新版手冊進 repo 之前：在現有手冊 `apps/docs` 加這個元件的頁面，至少有「預覽」「用法」和「給工程師」（連到 Storybook），標題註明「（暫時版面）」，並在路線圖那一列的備註寫「手冊頁待新版手冊補齊」。新版手冊進 repo 之後，照 `04-handbook-rules.md` 第 4 節補齊 | 人工檢查；手冊能建置（R-S-11） |
| R-C-38 | 介面文字用繁體中文；不發出任何第三方請求 | 人工檢查，機器檢查尚未實作 |
| R-C-39 | 路線圖那一列的狀態，在同一個 PR 裡改成「已完成」（`.md` 和 `.json` 都改） | 人工檢查 |
| R-C-40 | SOP 步驟 3 的檢查全部通過 | `pnpm --filter @tzuchi/tokens test`、`pnpm run test:scripts`、`pnpm lint`、`pnpm run heroui:storybook:build`、手冊的建置（R-S-11），以及改到的套件的 `typecheck` |
| R-C-41 | 優化的元件：HeroUI 原本的用法不受影響（原本的 stories 在慈濟主題和 HeroUI 原廠外觀下都和以前一樣） | 人工檢查（在 Storybook 比對） |
| R-C-42 | 照 `01-co-editing-sop.md` 第 1 節核可（暫定：外觀由美編（設計），程式由工程；待決定 Q2） | PR 上的核可 |
