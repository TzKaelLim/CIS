# CI 設計規範（design tokens）共編機制：第一階段（設計規格）

- 日期：2026-10-21
- 狀態：已核准（2026-10-21）。§13 的 A 到 E，使用者全部採用建議（「都照你的建議」）。核准前已依四份交叉審查和一次複審修正，涵蓋事實、可行性、資安和使用者意圖。
- 範圍：兩個 repo
  - uikit：tcgitlab 的 `tzuchi/tzuchi-uikit`，作業目錄 `~/Desktop/projects/tzuchi-uikit`
  - tceditor：本 repo
- 依據：
  - 2026-10-20 給主管的簡報影片（`~/Desktop/projects/ci-tokens-briefing`，不在 repo 裡）。
  - 2026-10-21 與使用者的討論（第 2.1 節）。
  - 同目錄 `research/` 的調查和審查報告。報告不在 repo 裡，本文需要的結論都已寫進來。
- 版本號、檔案數和發布日期都是 2026-10-21 查的。uikit 以 `2b5a6781` 為準，tceditor 以 `2f443584` 為準。

## 0. 結論

- **中間層不是 Markdown。** 唯一的來源是 uikit 裡的 tokens JSON。手冊和樣品室都由程式從它產生，tceditor 則透過同步帶進同一份快照，沒有任何地方手抄數值。
- **第一階段分兩段：**
  - **1a：手冊和 HeroUI 元件樣品室公開上線。** 兩者部署在同一個網址，tokens 一改，CI 會一起重建。
    - 影片裡展示的是 tceditor 的區塊樣品室（8 種區塊）。它要等 §13 C 的小階段才公開、才會自動跟著變。
    - 在那之前，由 Claude 在使用者的電腦上同步。
  - **1b：改名保護。** 有了它，美編改名時兩個 repo 都不會壞掉。
  - **第二階段**才套用子鈞的命名規範。
- **需要使用者回答的問題在 §13。** A 到 E 是使用者的決定，F 到 H 要問主管或宇軒。

## 1. 目標

**1a 完成後：**

1. **tokens 只有一個來源：uikit 的 DTCG JSON。** 設計理念手冊、HeroUI 元件樣品室，以及 tceditor 的區塊（包括編輯器畫布裡的區塊和區塊樣品室），都從它產生。
2. **一次修改，全部跟著變：**
   - uikit 的 MR 合併後，同一條 CI 會重建並部署手冊和 HeroUI 元件樣品室。
   - tceditor 由 Claude 同步，`pnpm verify` 全部通過才合併。
3. **出問題時建置會失敗，不會悄悄壞掉。** 任何地方讀到不存在的 token 名稱，都會讓建置失敗。
4. **三方都能透過 Claude Code 共編。** repo 裡要有三樣東西：
   - 給 Claude 的規則：uikit 的 `CLAUDE.md`，以及防止手滑的權限設定；
   - 給共編者的指南：放在 repo 裡；
   - 手冊上的設計規範頁。

**1b 完成後：**

5. **改名不會造成衝突。**
   - 舊名先留成別名。
   - 名稱要「先棄用、後移除」，由機器檢查。
   - tceditor 頁面資料存的是永久代號，不是變數名。
6. **第二階段只需要填規範、改名字。** 換掉規則檔，照 §7 的程序改名即可，不必再改機制。

編輯器操作介面本身（`packages/core` 的 `--puck-*`）套用 tokens，是路線圖的 S7，不在本文範圍。本文替它預留的東西見 §10。

## 2. 決策

### 2.1 使用者已定案（2026-10-21）

| # | 決策 |
|---|---|
| D1 | 不用 GitBook。設計理念手冊用 uikit 現有的 Starlight 文件站（`apps/docs`），搭配最新的 Astro。版本的實際選法見 §13 A |
| D2 | 三方（美編子鈞、工程宇軒、廠商致遠）都透過 Claude Code 共編，不需要網頁上所見即所得的編輯器 |
| D3 | 主 repo 是 uikit：tokens、命名規範、手冊和 HeroUI 元件樣品室都放在這裡。tceditor 放區塊樣品室和編輯器，由 Claude 同步。兩邊的連接不可有任何衝突 |
| D4 | 變數名稱之後要依子鈞設計的規格調整。先用現有名稱把機制建好，再套用子鈞的規範 |
| D5 | uikit 只在 `~/Desktop/projects/tzuchi-uikit`（從 tcgitlab clone 的新副本）作業。`CISwebsite`、`CISwebsite-heroui-spike` 和 `puck-tzuchi-poc` 維持唯讀 |
| D6 | Claude 推功能分支、開 MR。合併到 main 或其他共用分支，一律由人按 |
| D7 | 以 `spike/heroui-v3` 為基準。`CISwebsite` 裡沒 commit 的修改由使用者自己處理 |
| D8 | 手冊和 Storybook 都部署到 Cloudflare Pages，對外公開 |
| D9 | Node 26 在 2026-10-28 轉為 LTS。使用者的電腦已經是 26.7.0；10-28 之後升到 26 的最新版，再把兩個 repo 的 `engines`、`.nvmrc` 和 CI 映像改成 26。這一步不在第一階段 |

### 2.2 Claude 的裁定（審閱時可以推翻）

| # | 裁定 | 理由 |
|---|---|---|
| R1 | 手冊和 HeroUI 元件樣品室放在同一個 Pages 專案（`tzuchi-uikit`）：手冊在根目錄，Storybook 在 `/storybook/` | 兩邊來自同一個 commit、一次部署，不會一新一舊；互相連結可以用相對路徑。Production 還沒部署過，從 §14 第 1 步到第 6 步之間，Production 的根目錄暫時是 Storybook。staging（`https://staging.tzuchi-uikit.pages.dev`）只由 spike 分支部署；spike 解除保護後就不再更新，也不再使用，舊內容由人在 Cloudflare 後台刪除（§5.1） |
| R2 | tceditor 頁面資料裡存的間距值（`"16"`～`"64"`）改成**永久代號**。代號對應到哪個變數，寫在 tceditor 的對應表。這會推翻 S2「頁面存的就是 token 名稱」的原則 | 美編怎麼改名，舊頁面都不受影響。代號就是現在存的值，所以資料、契約和版本號都不用動（§6.4） |
| R3 | 兩個 repo 的 Style Dictionary 一起升到 5.x。版本要 ≥ 5.5.5，並取實作當天符合 §13 A 的最新版（10-21 是 5.6.0） | 現在的 4.4.0 有 GHSA-vj5c-m527-mpff（high），4.x 沒有修正版。5.4.4 的修正不完整，要到 5.5.5 才補齊（GHSA-5pgh-4v89-hfqj、GHSA-cr3w-v879-f973）。這兩則只在 Style Dictionary 自己的 repo 公告，`pnpm audit` 查不到，只能人工追蹤 |
| R4 | 名稱登記檔（`token-names.json`）加上「先棄用、後移除」的檢查 | 這是保證 tceditor 不會突然少掉變數的關鍵，做法和 tceditor 的資料契約快照相同 |
| R5 | 手冊的色票和數值表用清單裡的**靜態值**，亮色和深色並列。手冊不全域載入 `tokens.css`。手冊自己的主色和字型，也從清單的靜態值產生 | `tokens.css` 的語意色會隨讀者作業系統的深色設定翻轉，也會被 Starlight 的主題切換牽動。美編在手冊上必須看到確定的亮色值和深色值 |
| R6 | 公開的手冊只放設計內容。共編指南、電腦準備、流程和人名都放在 repo 裡（`CONTRIBUTING.md`），只有 tcgitlab 成員看得到 | 手冊對外公開；姓名、廠商身分、主機名和內部流程不該公開 |
| R7 | 美編修改時，預設在本機預覽（只綁 127.0.0.1）。每條分支一個預覽網址延後再做 | 功能分支拿不到 Cloudflare 金鑰。要做分支網址，得先放寬 protected 分支的規則和金鑰範圍 |
| R8 | `.pnpm-store/` 只取消追蹤，不改寫 git 歷史 | 改寫歷史會影響所有已 clone 的人和 protected 分支，換來的只是 repo 小約 85 MiB |
| R9 | DTCG 2025.10 的物件格式（color、dimension、duration）延後遷移 | 要改約 125 個字面值。等第二階段改完名再做，美編才不必看兩次大 diff。Style Dictionary 5.7 起兩種寫法都接受 |
| R10 | 第一階段的跨 repo 同步，由 Claude 在使用者的電腦上做 | tceditor 還沒有遠端（§13 C） |

## 3. 架構

```
            子鈞／宇軒／致遠 ──請 Claude Code 修改──┐
                                                  ▼
┌──────────────── uikit（tcgitlab tzuchi/tzuchi-uikit）──────────────────┐
│ packages/tokens/src/**/*.tokens.json  ← 唯一來源（DTCG）               │
│ packages/tokens/naming-rules.json     ← 命名規則（1b）                 │
│       │ Style Dictionary 5（build.mjs）                                │
│       ├─► dist/tokens.css        CSS 變數（亮色＋深色區塊）             │
│       ├─► dist/tokens.list.json  清單：名稱、亮暗值、參照、棄用（1a）    │
│       └─► token-names.json       名稱登記，commit 進 repo（1b）         │
│                                                                        │
│ heroui/styles/themes/tzuchi   ← generate.mjs 讀 tokens.css             │
│ heroui/storybook              ← HeroUI 元件樣品室（部署到 /storybook/）  │
│ apps/docs（Starlight）        ← 設計理念手冊，讀清單（部署到 /）        │
│ CI：tokens 建置與檢查 → 主題同步 → 樣品室 → 手冊 → 組站 → Cloudflare   │
└────────────────────────────────────────────────────────────────────────┘
                     │ pnpm sync:uikit（Claude，在使用者電腦上）
                     ▼
┌──────────────── tceditor（本 repo，尚無遠端）──────────────────────────┐
│ vendor/uikit：指定 commit 的快照，含清單                                │
│ packages/blocks：blocks.css 讀 --tc-*；SPACE_CODES 把代號對到變數（1b） │
│ apps/storybook：區塊樣品室（影片裡展示的 8 種區塊）                     │
│ apps/showcase：編輯器和公開頁                                          │
└────────────────────────────────────────────────────────────────────────┘
```

### 3.1 連接點與檢查

「衝突」的定義：一邊改了名字或值，另一邊壞掉，或者悄悄變了樣子。

| # | 連接點 | 改名時會出的問題 | 由誰擋下 | 階段 |
|---|---|---|---|---|
| C1 | tokens JSON → `tokens.css` 和清單 | 參照斷掉、名稱撞名、別名接別名 | Style Dictionary 的參照解析；`lint-tokens` 規則 1 到 6 | 1b |
| C2 | tokens → HeroUI 慈濟主題 | `generate.mjs` 對照表寫死 30 個名稱，名稱不在時它本身會失敗。元件覆寫 CSS 讀 77 個 token 名稱，大多帶 fallback：名稱不見時，有 fallback 的退回預設值，沒有的直接失效，兩種都**不會**讓建置失敗 | `lint-tokens` 規則 7（使用端掃描） | 1a |
| C3 | tokens → 手冊 | 現在的色票元件自己拼變數名、讀原始 JSON，名稱一改，頁面就少一項或顯示錯名 | 手冊只讀清單；手冊原始碼不可出現 `var(--tc-` | 1a |
| C4 | uikit → tceditor 的快照 | 兩邊的 Style Dictionary 版本不同，產出的 `tokens.css` 就不同；uikit 的登記檔過期 | `sync:uikit` 檢查版本一致，並檢查 build 沒有改到受追蹤的檔案 | 1a |
| C5 | tceditor `blocks.css` → 19 個 `--tc-*` 和 5 個 HeroUI 主題變數 | 讀到不存在、已棄用，或會隨深色模式翻轉的變數 | `styles.spec.ts`：「存在」是現有檢查；「沒有棄用」「亮暗值相同」「HeroUI 主題變數存在」是新增 | 1b |
| C6 | tceditor 頁面資料 → 間距代號、`style()` 存的 HeroUI variant 名稱 | 已存的頁面再存檔時被拒，或樣式消失 | 間距：`SPACE_CODES`（1b）。variant：uikit 規則禁止改名（§5.6）；如果被改，tceditor 現有的白名單測試會在同步時擋下，tceditor 停在舊快照，等 uikit 還原 | 1a／1b |
| C7 | 主題名稱（`data-theme`）：tokens 用 `dark`，HeroUI 用 `tzuchi`／`tzuchi-dark`，手冊用 Starlight 的 `light`／`dark` | 兩套對不上，部分顏色切到深色不會變 | tceditor 先把主題名稱集中成一份檔案（1b），統一留到第二階段 | 1b／2 |

## 4. 共編流程

### 4.1 角色

| 角色 | 負責 | tcgitlab 角色 |
|---|---|---|
| 子鈞（慈濟美編） | token 的名稱和值、命名規範、手冊的設計理念內容。token 的修改由子鈞核可 | Developer |
| 宇軒（工程） | 建置、CI。工具和 CI 的修改由宇軒核可 | 依 §13 H |
| 致遠（廠商） | 用同一套流程參與共編，具體分工由團隊另訂 | Developer |
| Claude | 修改檔案、在本機跑檢查和預覽、commit、推功能分支、開 MR、同步 tceditor。**不合併、不從 shell 部署、不發佈套件** | 用共編者本人的帳號 |

- 共編者不可以是 Maintainer。Maintainer 能自己把分支設成 protected，就能拿到帳號級的 Cloudflare 金鑰。
- 誰有合併權限，見 §13 H。
- 核可目前只是約定，因為 GitLab 免費版不能強制。tcgitlab 是 Premium 以上的話，可以改用 CODEOWNERS 加必要核可。

### 4.2 一次修改的流程

1. 共編者在自己電腦的 uikit 目錄開 Claude Code，用口語說要改什麼。例如：「把慈濟藍 900 改成 #1A2C56」「新增一個『成功』語意色」。
2. Claude 先 `git fetch`，從最新的 `origin/main` 開分支，名稱用 `tokens/<主題>` 或 `docs/<主題>`。接著依 `CLAUDE.md`（1b 起還有 `naming-rules.json`）修改 JSON，必要時一起更新使用端，例如主題對照表和手冊。
3. Claude 在本機跑檢查：tokens 的建置、`check.mjs`、`lint-tokens` 和測試、主題同步檢查、手冊建置。
4. Claude 用 repo 提供的啟動腳本，在 127.0.0.1 開手冊和元件樣品室的預覽，告訴共編者要看哪幾頁。共編者確認，或請 Claude 再改。
5. Claude commit、推分支，用 `git push -o merge_request.create` 開 MR，不需要額外的工具或權杖。MR 說明用白話寫「改了什麼、哪些畫面會變、要看哪幾頁」。預覽截圖只在共編者的電腦上給共編者看，不附在 MR 上。
6. CI 跑完整的建置和檢查，MR 頁面會顯示這條分支的 pipeline 結果。
7. 核可人看過後，由有合併權限的人合併。專案設定為「Pipelines must succeed」，CI 沒過就不能合併。合併後 main 的 pipeline 部署到 Production。
8. **tceditor 同步：** 每次 uikit 合併後，由使用者請 Claude 在使用者的電腦上同步（§6.1、§7 第 3 步）。uikit 的 MR 範本加一個「合併後通知使用者同步 tceditor」的勾選項。tceditor 上 tcgitlab 之後改成自動（§13 C）。

### 4.3 共編者的電腦和指南

寫在 uikit 的 `CONTRIBUTING.md`，不放公開手冊（R6）。第一次由 Claude 協助安裝。內容：

- 能存取 tcgitlab 的帳號；
- Node 22.22 以上（目前建議 24；2026-10-28 後可以用 26）；
- 用 corepack 安裝 pnpm；
- Claude Code；
- clone 之後先建一次 tokens（清單在 git 忽略的 `dist/` 裡，手冊要讀它）；
- 本機預覽的啟動方式。

本機預覽一律透過 repo 的 Node 啟動腳本，Windows 也能用。腳本負責：

- 只綁 127.0.0.1；
- 埠被占用時直接停止，不自動換埠。手冊用 4321，元件樣品室用 6007；
- 關掉 Astro 的遙測和更新檢查，以及 Storybook 的遙測和版本檢查。

本機的手冊上，`/storybook/` 連結會失效，因為兩邊是分開跑的。這點要寫在指南裡。

## 5. uikit 的變更

每一項標示屬於 1a 或 1b。

### 5.1 整理和規則（1a，第一個 MR）

**做法**

- 這個 MR 從 `spike/heroui-v3` 開分支，目標是 `main`。合併時 spike 的 11 個 commit 會一起進 main（可以 fast-forward，不會有衝突），所以不需要另外合併 spike。
- 合併後，第一條 main pipeline 會自動把 Storybook 部署到 Production。所以 §5.4 的「1a 快速修正」放在**同一個 MR**，第一次公開的就是修正過的版本。
- Cloudflare 的每個部署網址會永久有效，有問題的部署要由人在 Cloudflare 後台刪除。

**內容**

1. 用 `git rm -r --cached` 取消追蹤 `.pnpm-store/`（17,656 個檔）和 `apps/docs/.astro/`，並把 `.astro/`、`site/` 加進 `.gitignore`。
2. 根目錄的 `engines.node` 依選定的 Astro 版本設定（7.4 以上要 `>=22.22.0`）。
3. 依 §13 A 的答案，在 `pnpm-workspace.yaml` 加 `minimumReleaseAge`，附上註解。
4. 把 `@tzuchi/tokens`、`@tzuchi/components`、`@tzuchi/react`、`@heroui/react`、`@heroui/styles` 設成 `"private": true`，並移除 HeroUI 的 `publishConfig.access: public`（標 `LOCAL CHANGE`）。
   - 現在執行 `changeset publish` 會把內部套件發佈到 npmjs.org。
   - S3 設定 GitLab Package Registry 時再調整。
5. 新增根目錄的 `CLAUDE.md`（§5.6）和 `.claude/settings.json`。
   - deny：`Bash(wrangler *)`、`Bash(npx wrangler *)`、`Bash(* publish*)`、`Bash(pkill *)`、`Bash(killall *)`。
   - ask：`Bash(git push *)`，每次 push 都由共編者確認。
   - 這些規則只是防止手滑。Claude Code 只比對指令文字，換個寫法就能繞過，所以它不是安全邊界。真正的保護在別處：
     - main 的保護設定（沒有人能直接 push）；
     - 套件是 `private`；
     - 共編者的電腦上沒有 Cloudflare 金鑰。
6. 新增 `CONTRIBUTING.md`（§4.3）和 MR 範本（含 §4.2 第 8 步的勾選項）。
7. HeroUI Storybook 的 `vite` 從 7.3.5 升到 7.3.7，修正 GHSA-587h-7wmj-h5pm（high）和 GHSA-r825-w8mm-5pxw。7.3.7 在 10-06 發布，已滿 14 天。

**合併後由人做**

- 把 `spike/heroui-v3` 移出 Protected branches，或刪掉這條分支。它允許 force-push，而且拿得到金鑰。
- staging 從此不再更新。在 Cloudflare 後台刪除 `staging` 的舊 Preview 部署：裡面有 Google Fonts、HeroUI 的品牌，以及會送出讀者輸入的 stories。
- `main` 設成「Allowed to push：No one」「Allowed to merge：見 §13 H」。
- 開啟「Pipelines must succeed」，合併方式設成 fast-forward（1b 的規則 6 需要）。

### 5.2 Token 管線（`packages/tokens`）

**升級 Style Dictionary（1a）**

- 依 R3 改成精確版本，`engines.node` 跟著調整，lockfile 一起 commit。
- 用 5.6.x 的話，`dist/tokens.css` 應該**完全不變**。用 5.7.0 的話，duration 那兩行會從 `150ms` 變成 `0.15s`，兩者在 CSS 裡等價。
- 有其他差異就停下來查。

**清單 `dist/tokens.list.json`（1a）**

- 程式放在 `lib/token-list.mjs`，由 `build.mjs` 呼叫。做法是在亮色和深色兩次 build 都呼叫 `getPlatformTokens('css')`，再合併結果。
- 每筆欄位：
  - `id`（例如 `color.brand.primary`）、`cssVar`、`type`；
  - `layer`：primitive、semantic 或 component；
  - `hasDarkOverride`、`source`、`description`；
  - `light` 和 `dark`，各含 `value`、`css`、`chain`（參照鏈）；
  - `deprecated`：1a 一律是 `null`，1b 起可以是 `{ message, replacedBy, since }`。
- 深色值依 CSS 的串接方式重新解析：鏈上遇到有深色覆寫的 token，就改用它的深色版。
- 依 `id` 排序，不放時間戳，同樣的輸入產生同樣的位元組。
- `package.json` 的 `exports` 加上 `./tokens.list.json`。
- 和 tceditor 的相容：tceditor 的 sync 會用 tceditor 自己的 Style Dictionary 在暫存目錄執行 `build.mjs`。所以 `packages/tokens` 底下的程式只能 import `style-dictionary`、`style-dictionary/utils` 和 Node 內建模組。

**`check.mjs` 加的斷言（1a）**

- 清單筆數等於 `tokens.css` 第一個 `:root {` 區塊的變數數。
- 每個 `cssVar` 都在 `tokens.css` 裡。
- `hasDarkOverride` 的變數都在深色區塊裡。
- 已 commit 的 `variables.css` 裡每個 `var(--tc-*)`，用清單解出來的亮色值和深色值，要和它目前寫的值相符。

**檢查腳本 `lint-tokens.mjs`**

只用 Node 內建模組和 Style Dictionary，不增加依賴。退出碼：0 通過、1 有錯誤、3 只有規則 7 的棄用警告。

| # | 規則 | 嚴重度 | 階段 |
|---|---|---|---|
| 7 | **使用端掃描。** 下列地方用到的名稱都必須存在：`heroui/styles/themes/tzuchi/**/*.css` 的 `var(--tc-*)`，以及 `generate.mjs` 裡所有 `--tc-` 開頭的字串（包括沒有用 `var()` 包住的對照表）。少數不是 token 的 `--tc-*`（例如 Lit 元件的公開屬性 `--tc-breadcrumb-item-gap`）列在 `naming-rules.json` 的 `exceptions`。1a 先建立這個檔，裡面只有 `exceptions`，1b 再加入命名規則。`apps/docs/src/**` 不可出現 `var(--tc-`，因為手冊不載入 `tokens.css`。註解裡的名稱不檢查 | 名稱不存在是錯誤；用到已棄用的名稱是警告 | 1a |
| 1 | 名稱的每一段都是 kebab-case | 錯誤 | 1b |
| 2 | 每一層只能用規則檔列出的根群組；component 層的根群組要等於檔名。`container` 同時是 primitive 和 component 的群組，列為例外，第二階段由子鈞決定 | 錯誤 | 1b |
| 3 | 深色覆寫只能覆寫已存在、而且沒有棄用的 token（手寫的覆寫） | 錯誤 | 1b |
| 4 | 棄用的 token 必須符合：`$value` 是單一參照，等於 `replacedBy`；目標存在而且沒有棄用（不能別名接別名）；型別和層都相同；有 `since` | 錯誤 | 1b |
| 5 | 沒有棄用的 token 不可參照已棄用的 token | 錯誤 | 1b |
| 6 | 名稱登記：和 `origin/main` 的 `token-names.json` 比對，`active` 的名稱不可直接消失，`removed` 的名稱不可再用。細節見下方 | 錯誤 | 1b |
| 8 | 缺 `$description`：只輸出統計，不影響退出碼。目前 420 個 token 有 410 個沒寫 | 報告 | 1b |

規則 6 的細節：

- uikit 改用 fast-forward 合併，分支必須先 rebase 到 main 才能合併，所以 `origin/main` 就是分支的起點。
- lint 先確認 HEAD 包含 `origin/main`（必要時加深 fetch）。不包含時直接提示「先 rebase 到 main」，不報其他錯誤。
- main 上沒有登記檔時略過這條，但要用 `git ls-tree` 確定檔案真的不存在。fetch 失敗一律算錯誤。

**名稱登記 `token-names.json`（1b）**

- commit 進 repo，由 build 重新產生。
- 每個曾經出現過的 CSS 變數名都記一筆，狀態是 `active`、`deprecated` 或 `removed`。`removed` 的名稱永久保留。
- 不交給 Prettier 排版（加進 `.prettierignore`）。

**別名輸出（1b）**（`lib/output-references.mjs`）

- 值整個是單一參照的 token（純別名），不分型別一律輸出 `var(--tc-新名)`。
- 這會改到 9 個 shadow 別名的輸出：card、article-card、book-card 各兩個，加上 modal、tooltip、navbar drawer 的陰影。它們從攤平的亮色值變成 `var(--tc-elevation-N)`，在深色模式下會改用加強過的陰影。
- 這修正了 `DESIGN-LANGUAGE.md` 指出的「只有亮色」問題，但畫面會變，要請子鈞確認。tceditor 同步後，vendor 的這 9 行也會變。

**棄用標記（1b）**（`lib/deprecation.mjs`，preprocessor）

- 把群組上的 `$deprecated` 往下傳給每個子 token。
- 在 `$description` 前面加上「已棄用：改用 …」，CSS 註解就會顯示出來。
- 深色 build 對「目標有深色覆寫」的已棄用別名，也輸出一行 `--舊: var(--新)`。這樣主題設在巢狀元素上時，舊名也會跟著變深色。

棄用的寫法：

```json
"primary": {
  "$value": "{color.accent.default}",
  "$deprecated": "改用 {color.accent.default}",
  "$extensions": { "tw.org.tzuchi": { "replacedBy": "color.accent.default", "since": "2026-11-15" } }
}
```

不寫 `removeIn`：uikit 還沒有版本號，移除的時機依 §7 第 4 步決定。

**測試（1a 起）**

- 用 `node:test` 搭配測試夾具（`packages/tokens/test/fixtures/`，不放進正式的 source）。
- 1a 測清單和規則 7；1b 再測別名輸出、CSS 註解，以及規則 1 到 6 各自能抓到違規。
- tceditor 的 sync 會依 `REMOVE_RULES` 刪掉 `test/` 目錄，並記進 `SOURCE.json` 的 `removed`。這沒有問題，但要更新那條規則的註解。

### 5.3 手冊（`apps/docs`，1a）

**版本**

- Astro 7 和 Starlight 0.42，取實作當天符合 §13 A 的最新版。
  - 採用 14 天規則時：10-22 起可以用 astro 7.3.8 加 Starlight 0.42.6；10-29 起可以用 astro 7.4.0；11-02 起可以用 7.4.1。
  - 不採用時，直接用最新版。
- `package.json` 寫精確版本。
- 現在的 astro 5.18.2 有 critical 漏洞（GHSA-26w7-cxv4-gfx2，修在 7.2.8），升級會一起修掉。
- Astro 7 會把 sharp 當成選用依賴帶進來。`apps/docs` 不直接依賴 sharp，改在 `pnpm-workspace.yaml` 的 `overrides` 寫 `"sharp@<0.35.5": "0.35.5"`，並附上 GHSA-wq5f-xc86-pv6w 的註解。
- Astro 帶進來的 vite 要 ≥ 8.3.3，驗收時檢查 lockfile。

**設定**

- 側欄改成 Starlight 0.39 起要求的 `items` 寫法。
- 介面語系設成 `zh-TW`。
- 關掉 dev toolbar。
- 設好 `site`（Production 網址）。
- `customCss` 拿掉 `tokens.css`。
- 手冊的主色和字型，由清單的靜態值產生 Starlight 的 `--sl-color-accent*` 和字型變數（R5）。
- 移除對 `@tzuchi/components` 的依賴。
- CI 和啟動腳本設 `ASTRO_TELEMETRY_DISABLED=1`、`ASTRO_DISABLE_UPDATE_CHECK=true`。Astro 的遙測在 CI 裡也會送出，所以一定要設。

**內容**

| 章節 | 內容 | 來源 |
|---|---|---|
| 首頁 | 這份手冊是什麼、規範的來源、連到元件樣品室。角色只寫職能（美編、工程），不寫姓名 | 手寫。設計理念的正文要等子鈞提供才寫進去，在那之前不放空白的占位文字。現在首頁寫的「以 Lit Web Components 為單一來源」要拿掉 |
| 基礎 | 色彩（基礎色；語意色亮暗並列）、字體與字級、間距、圓角、陰影、動態、斷點與容器 | 全部由清單產生 |
| 深色主題 | 亮暗對照，以及「主題只能設在 `<html>`」的規則 | 由 `theming.mdx` 改寫，拿掉 Lit 範例，改用清單 |
| 元件 tokens | 每個元件的 token 表 | 由清單產生 |
| 元件 | 連到 `/storybook/` | — |
| 命名規範 | 1a 描述現有的命名；1b 起表格由 `naming-rules.json` 產生 | 手寫加產生 |

**token 頁的畫法**

- 每筆顯示：名稱、亮色值、深色值、參照鏈、說明，以及棄用標記和替代名稱。
- 色塊直接用清單的值畫。
- `ColorSwatches`、`ThemeSwatches`、`TypeScale` 改寫成讀清單，不再自己拼名稱或讀原始 JSON。

**移除**（以 §13 B 採用建議為前提）

- Lit 的 22 個元件頁和 `Demo`、`PropsTable` 元件。這些頁用到 `picsum.photos` 的外部圖片，會一起拿掉。
- 驗收時，`apps/docs` 不可再出現 `<tc-` 或 `@tzuchi/components`。

**不放**

- `@heroui/styles`：它帶有 Tailwind preflight，會重設 Starlight 的排版。
- 外部字型、分析碼、CDN。

### 5.4 HeroUI 元件樣品室（`heroui/storybook`）

以下每一項修改都依 `heroui/NOTICE.md` 標 `LOCAL CHANGE`，並列入修改清單。

**1a 快速修正**（放在 §5.1 那個 MR，讓第一次公開的就是修正過的版本）

1. 預設主題改成 `tzuchi`，選單把慈濟的兩個主題排在前面。現在預設是 HeroUI 自己的 `light`（`.storybook/addons/theme/constants.ts`）。
2. Welcome 頁改成慈濟元件樣品室的說明，換掉 HeroUI 的 logo 和 favicon，避免被誤認為 HeroUI 官方網站。
3. 移除 Google Fonts Inter：`preview-head.html` 的 `<link>`、內嵌 `<style>` 的字型清單，以及 `globals.css` 的預設字型。
4. 公開版拿掉 react-scan（效能除錯工具）。它的 `<script src="/react-scan/…">` 用的是絕對路徑，搬到子路徑後會壞掉。
5. build job 建完 Storybook 後，把 `heroui/LICENSE` 和 `heroui/NOTICE.md` 複製進 `storybook-static/`，符合 Apache-2.0 §4。第一次部署就會帶著；第 6 步組站時，它們自然落在 `site/storybook/`。
6. 刪掉 3 個呼叫外部 API 的 story export：
   - `autocomplete` 的 `AsynchronousFiltering`；
   - `combo-box` 的 `AsynchronousLoading`；
   - `select` 的 `AsynchronousLoading`。
   其中兩個會把讀者打的字送到外部。只把它們從側欄藏起來不夠，因為 Docs 頁仍會渲染它們、發出請求。build 後檢查 `storybook-static` 不含 `swapi.py4e.com` 和 `pokeapi.co`。

**1a 搬到子路徑**（和 §5.5 的組站一起做）

- 樣品室主題設定裡的 logo 用的是絕對路徑 `/logo-dark.svg`、`/logo-light.svg`（`.storybook/styles/theme.ts`），要改成相對路徑。
- 組站檢查：`site/storybook/**/*.html` 不可出現 `src="/` 或 `href="/`。
- 驗收時確認 `/storybook`（沒有結尾斜線）會轉到 `/storybook/`。

**第三方資源（待決定，§13 D）**

HeroUI 上游的範例 stories 還會連到外部：
- 從 `heroui-assets.nyc3.cdn.digitaloceanspaces.com`（122 處）和 `img.heroui.chat`（18 處）載圖；
- 透過 Iconify API 抓圖示（42 個檔）。

呼叫外部 API 的 3 個 stories 已在快速修正第 6 項刪掉。

1a 一定要做的：組站時自動列出**會發出請求**的外部網址，結果附在 pipeline 裡，手冊必須是零（§5.5）。

樣品室其餘的外部資源要清到什麼程度，由 §13 D 決定。

### 5.5 CI（`.gitlab-ci.yml`，1a）

**`build` job**

依序：
1. tokens 的建置、`check.mjs` 和測試；
2. 主題同步檢查，維持現行做法；1b 起同一個 `git diff --exit-code` 也檢查 `token-names.json`；
3. 建置 HeroUI Storybook；
4. 建置手冊；
5. 組成 `site/`：手冊放在根目錄，Storybook 放在 `site/storybook/`；
6. 組站檢查：
   - `index.html`、`404.html`、`storybook/index.html` 都存在；
   - 檔案總數低於 15,000（上限是 20,000）；
   - `site/storybook/**/*.html` 不可出現 `src="/` 或 `href="/`。手冊本來就用根路徑，不檢查；
   - 列出**會發出請求**的外部網址：`src=`、`<link href>`、CSS 的 `url()` 和 `@import`、JS 的 `fetch(` 和 `import(`。XML 和 SVG 的命名空間，以及自己的 Production 網域，不算外部網址。手冊有任何一個就失敗。

build job 加上 `ASTRO_TELEMETRY_DISABLED: '1'`，artifact 改成 `site/`。

**`tokens:lint` job**（獨立的 job，和 build 平行）

- 跑 `lint-tokens`。
- 只有這個 job 設 `allow_failure: exit_codes: [3]`：只有棄用警告時顯示橘色，不擋部署；回傳 1（錯誤）時擋下部署。
- 如果放在 build job 裡，回傳 3 會讓後面的建置全部跳過，`site/` 不會產生，部署反而失敗，所以一定要拆開。

**deploy job**

- `needs` 改成 build 和 `tokens:lint`。
- 上傳 `site/`，其餘照舊。

**維持不變**

- 只跑 branch pipeline。MR 頁面顯示的是來源分支的 pipeline 結果。

**金鑰的暴露面（請宇軒處理，§13 G）**

現況：
- `CLOUDFLARE_API_TOKEN` 是群組變數，scope 是 `*`，帳號級 Pages Edit。protected 分支上的**每一個** job 都拿得到，包括會跑上千個套件的 build。
- 一旦外洩，**同一個帳號的所有 Pages 專案**都可能被覆蓋部署。這次 build 又多了 Astro、Starlight 和 Pagefind。

建議做法（GitLab 免費版就有專案層級的 environment scope）：
1. 在 uikit 專案設一個同名、scope 為 `*` 的佔位變數。GitLab 文件寫的是專案變數優先於群組變數，所以 build job 應該拿到佔位值。
2. 另外設 scope 為 `production` 的真值，只有宣告了 `environment` 的 deploy job 拿得到。
3. 先在 tcgitlab 上實測兩件事：
   - build job 拿到的是佔位值；
   - deploy job 拿到的是真值。
4. uikit 自己的 CI 設計文件和 `.gitlab-ci.yml` 的註解寫的是「專案層同名變數蓋不掉群組的 scope `*`」，和上面相反。實測後，依結果更正其中一邊。
5. 實測不成立的話，改成替 uikit 申請獨立的 token 或帳號。

另外建議：
- 開啟「Use separate caches for protected branches」；
- `.corepack/` 不放進共用的 cache；
- `packageManager` 加上 hash。

### 5.6 uikit 的 `CLAUDE.md`（1a）

共編者的電腦上沒有使用者的全域設定，所以這份就是 Claude 唯一的規則。至少包括：

1. **repo 的地圖和常用指令。**
2. **修改流程**（§4.2）：
   - 從 `origin/main` 開分支、推分支、開 MR；
   - 絕不 push 到 main、絕不合併；
   - 合併前先 rebase 到 main（1b 起規則 6 需要）。
3. **絕對不做的事：**
   - 從 shell 執行 `wrangler`（沿用 `docs/superpowers/specs/2026-09-22-gitlab-ci-cloudflare-staging-design.md` 的規定）；
   - `changeset publish`、`npm publish`、`pnpm publish`；
   - 讀取、印出或 commit 任何 `.env`、CI 變數或登入資訊；
   - 碰本 repo 以外的目錄。
4. **推之前必跑的檢查**，以及本機預覽的方式：
   - 用啟動腳本，只綁 127.0.0.1；
   - 開伺服器前先檢查埠；
   - 只用 PID 停掉自己開的程序，不用 `pkill`、`killall`；
   - 不碰 3000 埠。
5. **不可直接刪除或改名 token。**
   - 1a 版：1b 完成之前不改名、不刪 token，有需要先問使用者或宇軒。
   - 1b 起：改名一律照 §7。
6. **HeroUI 的 `tv` variant 名稱**（例如 Button 的 `primary`、`secondary`、`outline`）會存進 tceditor 的頁面資料，不可改名或移除。
7. **主題只能設在 `<html>`。**
8. **第三方請求：** 手冊零第三方請求；元件樣品室依 §13 D 的結果，不可新增外部資源。
9. **vendored HeroUI 的規則**照 `heroui/NOTICE.md`。
10. **演練用的分支**（`drill/*`）不可 push。

## 6. tceditor 的變更

都在一條分支上做，`pnpm verify` 全部通過並經使用者同意後，合併回 `tzuchi/main`。

### 6.1 `pnpm sync:uikit`（1a）

**來源**

- `--dir` 的預設改成 `../tzuchi-uikit`。`SOURCE.json` 的 `repository` 改成 `tzuchi/tzuchi-uikit`。

**分支**

- 預設改成 `origin/main`：只接受已經在 main 上的 commit，也就是已經過 MR 審查的。
- 要同步其他分支，必須多加一個明確的參數。
- 理由：sync 會在使用者的電腦上執行 uikit 的程式，而 uikit 現在有三方共編。

**用 Node 的權限模式執行 uikit 的腳本**

- 可讀：暫存目錄，以及 `<repo>/node_modules/.pnpm`（套件實際存放的位置）。
  - **不可**給整個 `node_modules`。它裡面有指向工作區套件的相對 symlink，例如 `@tzuchi/tceditor -> ../../packages/core`。實測經由 `node_modules/@tzuchi/tceditor/../../` 就能讀到 repo 根目錄的任何檔案，包括 `infra/supabase/docker/.env`。
- sync 在授權前，於暫存目錄建立 `node_modules/style-dictionary`，用**絕對路徑** symlink 指向它的實際位置。
- 可寫：只有暫存目錄。不能開子程序。
- 網路：
  - Node 25 起，開了權限模式而沒給 `--allow-net`，網路也會被擋；sync 不給這個旗標。
  - Node 24 擋不住網路。
- 依實驗，Style Dictionary 4.4.0 在這個設定下可以照常建置，經由 symlink 加 `..` 的三種繞路都被拒絕。升級到 5.x 後要再測一次。
- 測試要在授權範圍外放一個假的 `.env`，確認經由 symlink 加 `..` 讀不到。

**新增的檢查**

- **Style Dictionary 版本一致。**
  - 讀出 uikit 那個 commit 的 `pnpm-lock.yaml` 中 `importers['packages/tokens']` 的 `style-dictionary` 版本，去掉 `(…)` 後綴，和 tceditor root 安裝的版本比對。
  - 不一樣就拒絕執行。
  - 這個版本另外記進 `SOURCE.json`。
- **build 後的產物。**
  - 新增 `REQUIRED_BUILD_OUTPUTS`，在 build **之後**檢查。原有的 `REQUIRED_FILES` 是在 build 之前、對 `git archive` 檢查的，裡面沒有 `dist/`。
  - 第 2 步先只放 `dist/tokens.css`。
  - 第 7 步同步到有清單的 commit 時，再加入 `dist/tokens.list.json`，同時把 `packages/tokens/lib/token-list.mjs` 加進 `REQUIRED_FILES`。
- **build 沒有改到受追蹤的檔案。** 比對 build 前後 `dist/` 以外的檔案。不一樣就表示 uikit 的登記檔過期，拒絕執行。

**換來源的驗證**（§14 第 0 步，不需要等 uikit 合併）

- 只先改來源：`--dir` 的預設值和 `UIKIT_REPOSITORY`。其他 sync 變更還沒加，tceditor 還在 4.4.0。
- 用新 clone 對 `2b5a6781` 跑一次 sync，帶 `--branch origin/spike/heroui-v3`。
- 預期 `SOURCE.json` 只有 `repository` 和 `branch` 兩個欄位改變，其他檔案的雜湊完全相同。

### 6.2 依賴和其他檢查（1a）

- root 的 `style-dictionary` 改成和 uikit 相同的精確版本，lockfile 一起 commit。
- 重新評估 `pnpm-workspace.yaml` 裡和 Style Dictionary 有關的 `ignoredBuiltDependencies`。
- 如果 §13 A 採用 14 天規則：tceditor 的 `pnpm-workspace.yaml` 也加 `minimumReleaseAge`，並寫進 `CLAUDE.md` 的 Dependencies 一節。
- 「CSS 不可引用遠端網址」的測試目前只掃 `packages/core`。在 `packages/blocks` 新增同樣的測試，掃 `vendor/uikit/**/*.css` 和 `packages/blocks/**/*.css`，因為這些 CSS 會進到公開頁。
  - 放在 `packages/blocks`，是因為它的 turbo inputs 已經包含 `vendor/uikit/**`。
  - 放在 core 的話，sync 之後 turbo 會重播舊的快取結果。

### 6.3 文件（1a 和 1b 各自更新）

- **S2 設計第 18 節：**
  - #33：sync 的來源和 Style Dictionary 版本（1a）；
  - #34：`token()` 的值改成永久代號（1b）。
- **`CLAUDE.md` 的 Vendored uikit 一節：** 來源、分支、版本檢查、權限模式，以及「uikit 合併後的跟進流程」。
- **1b 再改：**
  - `CLAUDE.md` 裡「Stored values are token names」和 `token()` 的說明；
  - 新增區塊的第 3 步。
- **其他文件：**
  - `packages/spec/README.md`、`helpers.ts` 中 `token()` 的說明（1b）；
  - `packages/blocks/README.md`；
  - `vendor/uikit/README.md`；
  - 路線圖加一列，指向本文。
- **`CHANGELOG.md`：**
  - sync 的變更；
  - Style Dictionary 升級（修正 GHSA-vj5c-m527-mpff）；
  - 永久代號（1b）；
  - 主題名稱集中（1b）。

### 6.4 永久代號 `SPACE_CODES`（1b）

位置：`packages/blocks/src/token-classes.ts`。

- 代號就是頁面現在存的值，對應到 CSS 變數名。
- 這張表**只能新增，不能刪除**；美編改名時只改右邊的變數名。

```ts
// 代號一旦出現在任何版本的規格裡就永遠保留；美編改名時只改右邊的變數名
export const SPACE_CODES = {
  "16": "--tc-space-16",
  "24": "--tc-space-24",
  "32": "--tc-space-32",
  "48": "--tc-space-48",
  "64": "--tc-space-64",
} as const;
```

**`tokenClass` 的查表規則**

- 只用 `Object.prototype.hasOwnProperty.call(SPACE_CODES, value)` 判斷。
- class 名稱從表的鍵產生，不從輸入值產生。
- 不在表裡的值一律回傳 `""`，包括 `"20"`、`"__proto__"`、`"constructor"`、`"toString"`、`"hasOwnProperty"`。
- 原本用的是 regex，查表比較嚴格。

**其他**

- `blocks.css` 的 class 名稱照舊（`tcb-py-32`），因為它們是用代號命名的。class 裡讀的變數改成表裡的變數，內容不變。
- **規格檔不改。** `SPACE_CODES` 只在畫面層和測試使用，所以資料、資料契約快照、MCP 目錄、編輯器欄位快照和 stories 都不會變，也不用升版本。

### 6.5 `styles.spec.ts` 的調整（1b）

| 測試 | 改法 |
|---|---|
| token 欄位的每個值都有 class | 值必須是 `SPACE_CODES` 的代號；表裡的變數必須存在，而且沒有棄用；class 必須讀 `var(<表裡的變數>)` |
| 新增：每個代號都有對應 | 檢查 `SPACE_CODES` 的**每一筆**，不只是目前規格用到的那些 |
| 新增：代號只增不減 | 從目前的規格找出 `x-token` 欄位的路徑（包括已棄用的區塊），再到 `generated/schemas/` 每個版本的契約讀同一個路徑的 `enum`，確認每個值都在表裡。不相容的修改（刪欄位、換型別）本來就禁止，所以同一個路徑在各版本指的是同一個欄位 |
| `tokenClass` | 加上 §6.4 列出的那些值，都要回傳 `""` |
| 只讀存在的 tokens | 保留。加上「不可用到已棄用的變數」，棄用名單讀 vendor 的清單 |
| 新增：HeroUI 主題變數存在 | `blocks.css` 讀的 5 個變數，必須在 `heroui/styles/themes/tzuchi/variables.css` 的 `tzuchi` 和 `tzuchi-dark` 區塊裡都有定義 |
| 只用 primitive 色 | 寫死的色名 regex 改成檢查清單：`blocks.css` 用到的每個 `--tc-color-*`，亮色值都必須等於深色值。這正是 blocks 需要的性質：不隨模式變 |
| tablet 斷點 | 變數名改由常數提供 |

### 6.6 主題名稱集中（1b）

- 新增 `packages/blocks/src/themes.json`：`{ "light": "tzuchi", "dark": "tzuchi-dark" }`。用 JSON 是因為 TS 和 `.mjs` 腳本都能直接讀。
- 寫死主題名稱的 5 個檔案、8 處，加上 `scripts/storybook-smoke.test.mjs`，都改成讀它：
  - `apps/showcase/app/(public)/layout.tsx`
  - `apps/showcase/app/(editor)/activity/edit/client.tsx`
  - `apps/storybook/.storybook/preview.tsx`
  - `scripts/storybook-smoke.mjs`
  - `scripts/e2e/showcase-smoke.mjs`
- 公開頁會 import 它，所以它不能帶進任何 React 或編輯器的程式碼，要符合 `PUBLIC_IMPORTS` 和 `check:public-bundle`。
- 「vendor 的主題 CSS 必須有 `[data-theme="<名稱>"]`」這個測試放在 `packages/blocks`，因為它的 turbo inputs 已經包含 `vendor/uikit/**`。
- `packages/blocks/styles.css` 裡的主題資料夾路徑 `themes/tzuchi` 留到第二階段一起改。

## 7. 改名程序（1b 建好並演練，第二階段正式使用）

1. **uikit MR 甲：新增新名，舊名改成別名。**
   - 新名依規則新增。
   - 舊名的 `$value` 改成 `{新名}`，加上 `$deprecated` 和 `$extensions`。
   - 深色覆寫檔改用新名。舊名的深色別名由 build 自動輸出。
   - uikit 內部的使用端一起改用新名：`generate.mjs` 的對照表、主題 CSS、`check.mjs` 寫死的名稱，以及 HeroUI Storybook 的主題清單（如果改到主題）。
   - 規則 1 到 7 必須沒有錯誤，也沒有警告。
2. **合併、部署。** 手冊上的舊名顯示為「已棄用：改用 …」。
3. **tceditor 同步到 MR 甲的 commit。**
   - `blocks.css` 或 `SPACE_CODES` 還用舊名時，「不可用到已棄用的變數」測試會失敗，並指出要改的地方。
   - 改完後在同一個變更裡 `pnpm verify` 通過，再合併。
4. **uikit MR 乙：移除舊名。** 必須符合下列所有條件：
   - MR 說明附上 tceditor `vendor/uikit/SOURCE.json` 的 commit，必須在 MR 甲之後；
   - tceditor 的程式和資料都不再用舊名。目前只有使用者的電腦有 tceditor，所以這一點由使用者確認；
   - uikit 內部沒有使用端；
   - 登記檔把舊名標成 `removed`。

為什麼不會衝突：

| 情況 | 結果 |
|---|---|
| tceditor 還沒同步，uikit 已經改名 | tceditor 用的是舊快照，照常運作 |
| tceditor 同步到 MR 甲 | 舊名還在，畫面完全相同；測試要求在同一個變更裡換成新名 |
| tceditor 很久沒同步，直接跳到 MR 乙之後 | 「變數存在」測試會失敗，指出要改的地方。只要改 CSS 和對應表，頁面資料不受影響 |
| 頁面資料 | 存的是代號和 HeroUI variant 名稱，都不會因為 token 改名而改變 |

Lit 凍結期間（§13 B），MR 乙**不顧及** Lit 元件。被移除的名稱可能讓凍結的 Lit 元件失去樣式，這是凍結的代價。

## 8. 安全

- **金鑰：**
  - repo 裡沒有任何金鑰。
  - Claude 不從 shell 部署或發佈。真正擋住這件事的是：共編者的電腦上沒有金鑰、套件是 `private`、main 受保護。`.claude/settings.json` 的規則只是防手滑。
  - CI 金鑰的暴露面和建議做法見 §5.5。
  - 共編者在 tcgitlab 是 Developer，不給 Maintainer（§4.1）。
- **公開內容：**
  - 手冊只放設計內容，不放人名、主機名和內部流程（R6）。
  - 元件樣品室移除 HeroUI 的品牌，並附上授權。
- **第三方請求：**
  - 手冊零第三方請求，組站時自動檢查。
  - 元件樣品室依 §13 D 處理，外部網域清單附在每次 pipeline。
  - CI 和本機都關掉 Astro 和 Storybook 的遙測與更新檢查。
- **已知漏洞：**
  - Style Dictionary ≥ 5.5.5；
  - astro ≥ 7.2.8，它帶的 vite ≥ 8.3.3；
  - sharp ≥ 0.35.5（用 `overrides`）；
  - HeroUI Storybook 的 vite 升到 7.3.7。
  - Style Dictionary 那兩則 advisory 只在它自己的 repo 公告，要人工追蹤（R3）。
- **供應鏈：**
  - 14 天規則（§13 A）只在本機更新 lockfile 時把關。CI 用 `--frozen-lockfile`，不會重新檢查，所以審 MR 時要看 lockfile 的 diff。
  - 安全修正不滿 14 天時，可以用 `minimumReleaseAgeExclude` 指定精確版本，但要由宇軒核可，並在註解寫上 GHSA 編號。
  - CI 用 `npx wrangler@<固定版本>` 和 corepack 下載的 pnpm，不經過 lockfile，不在 14 天規則範圍內。目前靠釘住版本號和 `packageManager` 的 hash 緩解。
- **防誤發佈：** 套件設成 private（§5.1），deny 規則防手滑。
- **同步在使用者電腦上執行 uikit 的程式：**
  - 只接受 main 上的 commit；
  - 用 Node 權限模式執行（§6.1）。使用者的電腦是 Node 26，連網路也會擋。
- **本機伺服器：** 只綁 127.0.0.1，只用 PID 停掉自己開的程序。
- **tceditor 原有的資安規則不變。** `SPACE_CODES` 查表依 tceditor「以使用者資料當鍵」的規則實作（§6.4）。

## 9. 測試與驗收

### 9.1 自動測試

- **uikit：**
  - `node:test` 測清單和規則 7（1a），以及別名、登記檔和規則 1 到 6（1b）；
  - `check.mjs` 的新斷言；
  - CI 的組站檢查。
- **tceditor：**
  - `scripts/uikit/uikit.test.mjs` 涵蓋 sync 的新行為：預設來源、`origin/main`、版本檢查、build 後的產物、build 沒有改到受追蹤的檔案、權限模式；
  - CSS 遠端網址測試的新範圍（1a）；
  - `styles.spec.ts` 的調整（1b）；
  - `pnpm verify` 全部通過。

### 9.2 1a 的驗收

1. uikit 的 main pipeline 全綠。Production 網址的根目錄是手冊，`/storybook/` 是元件樣品室，預設是慈濟主題，沒有 HeroUI 的品牌。
2. 手冊的 token 頁和清單一致：抽查 10 筆，名稱、亮色值和深色值都和 `tokens.css` 相符。
3. 用 puppeteer 打開手冊的每一頁，記錄所有請求：沒有任何第三方請求，也沒有 4xx。元件樣品室依 §13 D 的結果檢查。
4. lockfile 裡的 sharp ≥ 0.35.5、vite 符合 §8。
5. tceditor 同步到 uikit 新的 main 後 `pnpm verify` 全綠，`SOURCE.json` 指向 `tzuchi/tzuchi-uikit`。
6. 由使用者或宇軒在一台乾淨的電腦上，照 `CONTRIBUTING.md` 從 clone 做到開出 MR。
7. 在本機的拋棄式分支上，刻意讓主題 CSS 讀一個不存在的名稱，跑 `lint-tokens`（和 CI 同一組指令），結果以 1 結束。這條分支不推。

### 9.3 1b 的驗收：改名演練

在兩個 repo 的本機**拋棄式分支**（`drill/*`）上，照 §7 走完四步。演練兩個名稱：

- `color.brand.primary`：驗證 uikit 這一側（`generate.mjs`、`check.mjs`、深色覆寫）；
- `space.32`：驗證 tceditor 這一側（`SPACE_CODES`、`blocks.css` 的 token class、「沒有棄用」和「代號只增不減」測試）。

確認每一項檢查都在預期的那一步觸發，也只在那一步觸發：

| 違規 | 由誰抓到 |
|---|---|
| 跳過棄用直接刪除 | 規則 6 |
| 別名接別名 | 規則 4 |
| 手寫的深色覆寫用了舊名 | 規則 3 |
| 主題 CSS 讀到不存在的名稱 | 規則 7 |
| uikit 登記檔過期 | build 的 `git diff` 和 sync 的檢查 |
| tceditor 用到已棄用的變數 | `styles.spec.ts` |

結果記錄在實作計畫的工作區。演練分支不推、不合併，做完就刪掉。

## 10. 不在第一階段

- **編輯器操作介面套用 tokens（路線圖 S7）。** 本文替它預留了兩樣東西：
  - 清單帶有靜態的亮暗值，S7 可以用來產生 `--puck-*` 的對照；
  - S7 會多一個連接點「core → vendor tokens」，屆時加進 §3.1。
- **套用子鈞的命名規範、統一主題名稱**（第二階段，§11）。
- **DTCG 2025.10 物件格式的遷移**（R9），以及 Terrazzo 的對比度檢查。
- **每條分支一個預覽網址**（R7）。
- **GitLab Package Registry 和 changesets 發佈**（S3）。
- **tceditor 上 tcgitlab、自動同步 MR、公開區塊樣品室**，見 §13 C。自動同步建議用 tceditor 的排程 pipeline，不用 uikit 觸發。用 uikit 觸發的話，在 uikit 按合併的人必須在 tceditor 也有合併權限。
- **uikit 的 variant 登記檔**（和 `token-names.json` 類似，保護 HeroUI variant 名稱）。目前靠規則和 tceditor 同步時的白名單測試。
- **從 repo 刪除 Lit 程式碼。** 第一階段只凍結（§13 B）。
- **Storybook 升級、Node 26**（D9），以及**改寫 git 歷史**（R8）。
- **補 `$description`。** 這是子鈞的工作，手冊上會顯示哪些缺了。

## 11. 第二階段預告

1. 子鈞交付命名規範 → 改寫 `naming-rules.json` 和手冊的命名規範頁。
2. 照 §7 分批改名。每一批都是「uikit MR 甲 → tceditor 同步 → uikit MR 乙」。
3. 統一深色主題的名稱。下面這些地方要一起改：
   - tokens 的 `dark`；
   - HeroUI 的 `tzuchi`／`tzuchi-dark`；
   - HeroUI 預設主題的 `$="-dark"` 選擇器（新的深色主題名稱必須保留 `-dark` 結尾，否則會失去 HeroUI 預設深色主題的底色）；
   - uikit Storybook 的 `THEME_VALUES` 和 `isDarkTheme`；
   - 手冊裡 Starlight `light`／`dark` 的對應；
   - tceditor 的 `themes.json` 和 `packages/blocks/styles.css` 的主題路徑。
4. 改名完成後，做 DTCG 2025.10 的格式遷移，並評估 Terrazzo 的對比度檢查。

## 12. 風險

| 風險 | 對策 |
|---|---|
| 一次跨兩個 Astro 大版本，第一次 build 才會冒出語法錯誤 | 手冊很小，Lit 頁移除後要改的更少 |
| Starlight 0.42 要求的瀏覽器版本較新（Safari 17、Chrome 116），會排除較舊的手機 | 讀者是內部人員，可以接受 |
| 兩個 repo 的 Style Dictionary 版本不一致 | sync 的版本檢查（§6.1） |
| CI 金鑰外洩，影響同一個帳號的所有 Pages 專案 | §5.5 的建議做法（§13 G） |
| 第一次合併就部署 Production | 1a 的快速修正放在同一個 MR；有問題的部署由人在 Cloudflare 後台刪除 |
| 9 個 shadow 別名在深色模式下的外觀改變 | 1b 的 MR 附上前後截圖，請子鈞確認 |
| 子鈞的命名規範和現行的分層差很多 | 規則檔和改名程序都不假設名稱的形狀，可以分批進行 |
| tceditor 只在使用者的電腦上，同步取決於使用者記得做 | MR 範本的提醒（§4.2 第 8 步）；長期上 tcgitlab（§13 C） |
| 共編者的電腦環境不一 | 跨平台的啟動腳本、`CONTRIBUTING.md`，以及 1a 驗收第 6 項 |

## 13. 待確認事項

**使用者決定：**

| # | 問題 | 建議 |
|---|---|---|
| A | **「最新」的定義。** 最新的 Astro 是 7.4.1，10-19 才發布。為了防範套件被植入惡意程式，建議只用發布滿 14 天的版本，由 pnpm 自動把關，兩個 repo 都適用 | 採用。10-29 起可以用 astro 7.4.0，11-02 起可以用 7.4.1。Style Dictionary 現在用 5.6.0，10-30 起可以用 5.7.0 |
| B | **Lit 元件。** uikit 實際上已經改走 HeroUI，但手冊和原設計文件還在介紹 Lit | 凍結 Lit：程式留在 repo、不再修改，root 的 build 和 test 排除它。從手冊移除 Lit 元件頁，元件章節改連到 `/storybook/`。原設計文件加一段修正，指向本文。不採用的話，§5.3、§5.4 和 R1 要重寫 |
| C | **影片裡的「元件樣品室」是 tceditor 的區塊樣品室（8 種區塊）。** 它目前只在使用者的電腦上，不公開，也要等 Claude 同步才會跟著變。要公開它、讓它自動跟上，tceditor 要先上 tcgitlab（私人專案）並加 CI | 先做 1a（手冊和 HeroUI 元件樣品室上線）。接著另開一個小階段：tceditor 上 tcgitlab，加上區塊樣品室的部署（另一個 Pages 專案）和排程同步 MR |
| D | **HeroUI 樣品室的上游範例會從外部載入圖片和 Iconify 圖示。** 呼叫外部 API 的 3 個 stories 不論如何都會刪掉，其中 2 個會送出讀者打的字（§5.4） | 1a 先保留圖片和圖示：它們只是展示用，pipeline 會列出清單。之後再換成本地檔案 |
| E | **R2 永久代號**：推翻 S2「頁面存 token 名稱」的原則 | 採用（1b 實作） |

**請主管決定：**

| # | 問題 | 建議 |
|---|---|---|
| F | 廠商（致遠）在 tcgitlab 的帳號、權限和資料政策；子鈞、致遠的 Claude Code 帳號由誰提供；公開手冊的版權說明 | 廠商用 Developer 角色。版權交主管或法務決定。元件樣品室附 HeroUI 的 Apache-2.0 授權 |

**請宇軒或 tcgitlab 管理者處理：**

| # | 問題 | 建議 |
|---|---|---|
| G | CI 金鑰的範圍（§5.5）、protected 分支的 cache 分離 | 照 §5.5 的建議做法實測 |
| H | 誰能合併 main；`main` 的保護設定、「Pipelines must succeed」、fast-forward 合併 | 子鈞核可 token、宇軒核可工程，由宇軒合併。設定照 §5.1 |

## 14. 實作順序

| 順序 | 階段 | repo | 內容 | 依賴 |
|---|---|---|---|---|
| 0 | 1a | tceditor | 換來源的驗證：只改來源（§6.1） | — |
| 1 | 1a | uikit | 整理和規則 MR，從 spike 開分支、目標 main（§5.1），含 Storybook 的快速修正（§5.4） | §13 A、B、D |
| 2 | 1a | tceditor | sync 的其他變更（§6.1）：預設 `origin/main`、權限模式、版本檢查、build 後的產物（只放 `tokens.css`）、受追蹤檔案的檢查。Style Dictionary 還在 4.4.0 | 0；1 合併（`2b5a6781` 要在 main 上） |
| 3 | 1a | uikit | 升級 Style Dictionary（§5.2） | 1 合併；版本滿 14 天（§13 A） |
| 4 | 1a | tceditor | 升級 Style Dictionary、其他檢查（§6.2），同步到 3 的 commit，並重測權限模式 | 2；3 合併 |
| 5 | 1a | uikit | 清單、`naming-rules.json`（只有 `exceptions`）、規則 7、`check.mjs` 的斷言、測試（§5.2） | 3 合併 |
| 6 | 1a | uikit | 手冊升級和改寫（§5.3）；Storybook 搬到子路徑；CI 組站、`tokens:lint` 和部署（§5.4、§5.5） | 5 合併 |
| 7 | 1a | tceditor | `REQUIRED_BUILD_OUTPUTS` 加入清單，同步到 6 的 commit，更新文件（§6.3），完成 1a 驗收（§9.2） | 6 合併 |
| — | **里程碑 1a：手冊和 HeroUI 元件樣品室公開上線。區塊樣品室的公開見 §13 C** | | | |
| 8 | 1b | uikit | 別名輸出、棄用標記、登記檔、規則 1 到 6、測試（§5.2）。合併條件：子鈞確認 shadow 的變化 | 7；fast-forward 合併已開啟（§13 H） |
| 9 | 1b | tceditor | 永久代號、測試、主題名稱集中、文件（§6.3 到 §6.6），同步到 8 的 commit | 8 合併；§13 E |
| 10 | 1b | 兩邊 | 改名演練（§9.3） | 9 |
| — | **里程碑 1b：可以開始第二階段** | | | |

每個 uikit 步驟都是一個 MR，要等人合併後，才能做依賴它的下一步。

## 15. 名詞表

| 名詞 | 意思 |
|---|---|
| token | 一個有名字的設計數值，例如「慈濟藍 900 = #1B2D58」 |
| DTCG | 業界的 token 檔案格式標準（W3C 社群），2025-10 出第一個穩定版 |
| Style Dictionary | 把 token JSON 轉成 CSS 等格式的工具 |
| primitive／semantic／component | token 的三層：基礎值、語意（例如「主色」）、元件專用 |
| 別名、棄用 | 舊名指向新名，標記為「之後會移除」 |
| 參照鏈 | 一個 token 指向另一個，一路追到實際的值 |
| MR | Merge Request，請人審查並合併一批修改 |
| protected 分支 | GitLab 上受保護、只有特定人能推或合併的分支 |
| fast-forward 合併 | 分支必須先接在 main 最新的位置上才能合併 |
| environment scope | 讓 CI 變數只給特定部署環境的 job 使用 |
| `tv` variant | HeroUI 元件的樣式選項名稱，例如按鈕的 `primary` |
| Tailwind preflight | Tailwind 內建的全域樣式重設 |
| GHSA | GitHub 的資安公告編號 |
| LTS | Node 的長期支援版本 |
| 14 天規則 | 套件發布滿 14 天才使用，防範被入侵的新版本 |
