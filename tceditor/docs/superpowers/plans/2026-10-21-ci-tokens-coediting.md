# CI 設計規範（design tokens）共編機制 第一階段 實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** tokens 只有一個來源：uikit 的 DTCG JSON。設計理念手冊和 HeroUI 元件樣品室從它產生，部署在同一個網址；tceditor 透過受保護的同步跟上。另外建好「先棄用、後移除」的改名保護，讓第二階段套用子鈞的命名規範時，兩個 repo 都不會出現衝突。

**Architecture:** 18 個 task，分兩個里程碑。
- **1a（Task 1–12）：上線。**
  - uikit 依序開 4 個 MR：整理與共編規則、Style Dictionary 升級、token 清單與使用端掃描、手冊與組站。
  - tceditor 在分支 `ci-tokens/1a` 上，依序做換來源、sync 強化、Style Dictionary 跟版，並隨 uikit 的合併逐步同步。
- **1b（Task 13–18）：改名保護。**
  - uikit 開 1 個 MR：別名、棄用、名稱登記、規則 1–6。
  - tceditor 在分支 `ci-tokens/1b` 上做永久代號、新檢查、主題名稱集中。
  - 最後兩邊一起做改名演練。
- 每個 uikit MR 都由人合併（檢查點 H1–H5）。合併之前，不做依賴它的 task。

**Tech Stack:**
- uikit：pnpm 10.26.1、turbo、Style Dictionary 5.x（≥ 5.5.5）、Astro 7、Starlight 0.42、Storybook 10.6.0（HeroUI）、`node:test`、GitLab CI、Cloudflare Pages（wrangler 4.136.1）。
- tceditor：pnpm 10.26.1、Jest 29、`node:test`、puppeteer 24.43.1。
- 使用者電腦的 Node 是 26.7.0。

**Spec:** `docs/superpowers/specs/2026-10-21-ci-tokens-coediting-design.md`（2026-10-21 核准，§13 A–E 全部採用建議）。調查和審查報告在 `~/Desktop/projects/ci-tokens-briefing/research/`，不在 repo 裡，執行時可以參考。

## 執行方式與檢查點

**兩個作業目錄**
- uikit：`~/Desktop/projects/tzuchi-uikit`，從 tcgitlab clone，2026-10-21 時在 `spike/heroui-v3`。
- tceditor：本 repo 的主目錄，分支 `ci-tokens/1a`、`ci-tokens/1b`，都從 `tzuchi/main` 開。

**uikit 的 MR**
- 每個 MR 一條分支，從最新的 `origin/main` 開。MR1 例外：從 `origin/spike/heroui-v3` 開，目標是 `main`。
- 開 MR 的指令：`git push -u origin <branch> -o merge_request.create -o merge_request.target=main -o merge_request.title="<title>"`。

**檢查點（H1–H5）**
- 推出 MR 後就停下，向使用者回報 MR 網址，等使用者說「已合併」。
- 收到後先 `git -C ~/Desktop/projects/tzuchi-uikit fetch origin`，再做下一個依賴它的 task。
- subagent-driven-development 在檢查點上不得自行繼續。檢查點屬於 skill 所說「需要先問的、repo 以外的副作用」。

| 檢查點 | 在哪個 task 之後 | 要人做的事 |
|---|---|---|
| H1 | Task 3（MR1） | 見 Task 3 最後一步 |
| H2 | Task 5（MR2） | 合併 |
| H3 | Task 8（MR3） | 合併 |
| H4 | Task 11（MR4） | 合併，並確認 Production 網址 |
| H5 | Task 14（MR5） | 子鈞確認 shadow 的前後截圖，再合併 |

**tceditor 分支合併回 `tzuchi/main`**
- 里程碑時，在 `pnpm verify` 全部通過後，經使用者同意才合併（Task 12、17 的最後一步）。

**順序**
- Task 1 → 2 → 3 →〔H1〕→ 4 → 5 →〔H2〕→ 6 → 7 → 8 →〔H3〕→ 9 → 10 → 11 →〔H4〕→ 12 →（里程碑 1a）→ 13 → 14 →〔H5〕→ 15 → 16 → 17 → 18 →（里程碑 1b）。
- Task 15、16 不依賴 MR5 的合併，可以在等待 H5 時先做。但它們讀的 `deprecated` 欄位，要等 Task 17 同步之後才會有真實資料。

## Global Constraints

- **uikit 的寫入範圍**：只能寫 `~/Desktop/projects/tzuchi-uikit`。`~/Desktop/Personal/CISwebsite`、`~/Desktop/Personal/CISwebsite-heroui-spike`、`~/Desktop/projects/puck-tzuchi-poc` 唯讀。
- **Claude 的權限**：只推功能分支、開 MR。不合併，不 push 到 `main` 或任何共用分支，不從 shell 執行 `wrangler`，不執行任何 `publish`。
- **14 天規則**：新加入或升級的套件必須發布滿 14 天，`minimumReleaseAge: 20160`，兩個 repo 都設。
  - 用精確版本。
  - 安全修正不滿 14 天時，只能用 `minimumReleaseAgeExclude` 指定精確版本，並由宇軒核可，註解寫上 GHSA 編號。
- **版本下限**：
  - Style Dictionary ≥ 5.5.5，兩個 repo 用同一個精確版本；
  - astro ≥ 7.2.8，它帶的 vite ≥ 8.3.3；
  - HeroUI Storybook 的 vite 是 7.3.7；
  - sharp 用 `overrides` 寫 `"sharp@<0.35.5": "0.35.5"`。
- **`packages/tokens` 的 import 限制**：只能 import `style-dictionary`、`style-dictionary/utils` 和 Node 內建模組，因為 tceditor 的 sync 會用 tceditor 的 Style Dictionary 執行 `build.mjs`、`check.mjs`。
- **本機伺服器**：
  - 只綁 127.0.0.1，開之前用 `lsof -nP -iTCP:<port> -sTCP:LISTEN` 檢查；
  - 只用 PID 停掉自己開的程序，不用 `pkill`、`killall`；
  - 不碰 3000 埠和它的程序；
  - uikit 的手冊用 4321，元件樣品室用 6007；tceditor 依它的 CLAUDE.md。
- **手冊**：
  - 零第三方請求；
  - 不載入 `tokens.css`，原始碼不可出現 `var(--tc-`；
  - 不放人名、主機名或內部流程（規格 R6）。
- **HeroUI**：每一處修改都標 `LOCAL CHANGE`，並列入 `heroui/NOTICE.md`。
- **tceditor**：
  - 照它的 `CLAUDE.md`：`pnpm verify` 是閘門，`CHANGELOG.md` 每項使用者看得到的變更記一行；
  - 以使用者資料當鍵的查表一律用 `Object.prototype.hasOwnProperty.call`。
- **Commit**：
  - uikit 用英文 conventional commits 加 scope；tceditor 用 Angular 風格。
  - 兩邊結尾都加 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`。
  - 只依路徑 stage 自己改的檔案。
- **金鑰**：任何 `.env`、CI 變數和登入資訊都不讀、不印、不 commit。
- **`node --test`**：一律用引號括住的 glob，例如 `node --test "test/*.test.mjs"`。Node 26 的 `node --test <目錄>` 會把目錄當成模組載入而失敗。
- **uikit 的 commit 訊息和 MR 標題不可含 `publish` 這個字。** `.claude/settings.json` 的 deny 規則 `Bash(* publish*)` 會擋下整個指令（Task 2）。
- **tceditor 主目錄不可用破壞性的 git 指令**：`git reset --hard`、`git checkout .`、`git restore .`、`git clean`、`git stash` 都不准用。開始 Task 1 之前，規格和本計畫已經 commit 到 `tzuchi/main`。uikit 只有 Task 18 的演練分支可以 `git reset --hard`，執行前要先跑 `git status --short`，確認只有演練造成的變更。
- **Astro 的指令一律經過 `scripts/dev/astro.mjs` 或 `scripts/dev/docs.mjs`**（Task 2）。這兩支腳本會設好 `ASTRO_TELEMETRY_DISABLED=1` 和 `ASTRO_DISABLE_UPDATE_CHECK=true`。`apps/docs` 的 `build`、`dev` script 也透過它們執行，本機、CI 和共編者的電腦都不會送出遙測（規格 §8），Windows 也能用。
- **每次 tceditor 同步 uikit 之後、跑任何測試或建置之前**：先執行 `git diff --stat -- vendor/uikit/heroui/styles/src`。有 JS 或 TS 的變更時，先看過 diff；看不懂或有疑慮就停下來回報使用者。這些程式會在 jest、`next build` 和 Storybook 建置時，以使用者的權限執行，權限模式管不到。

## 共用介面

各 task 之間的約定。名稱、形狀和預設值照這裡寫，不要自行改名。

**清單 `packages/tokens/dist/tokens.list.json`**（Task 7 產生；Task 10、12、13、15、16 讀取）

```ts
type TokenList = { schemaVersion: 1; prefix: "tc"; package: { name: string; version: string }; tokens: TokenEntry[] } // 鍵依此順序，tokens 依 id 用 code unit 排序
type TokenEntry = {
  id: string;            // "color.brand.primary"
  cssVar: string;        // "--tc-color-brand-primary"
  type: string;          // 繼承群組 $type 之後的實際型別，不可是 null
  layer: "primitive" | "semantic" | "component";
  hasDarkOverride: boolean; // 這個變數在 tokens.css 的深色區塊有宣告（含 Task 13 的深色別名行）
  source: string;        // 相對 packages/tokens 的 posix 路徑，例如 "src/semantic/color.tokens.json"
  description: string | null;
  light: ModeValue; dark: ModeValue;
  deprecated: null | { message: string; replacedBy: string; since: string }; // replacedBy 是 id；1a 一律 null
} // 鍵依此順序
type ModeValue = { value: string /* 解出來的 CSS 值 */; css: string /* tokens.css 的宣告內容 */; chain: string[] /* 追過的 id，不含自己 */ }
```

**`packages/tokens/naming-rules.json`**
- 1a（Task 8）：`{ "version": 1, "exceptions": string[], "consumers": { "varRefs": string[], "bareNames": string[], "noVar": string[] } }`。
- 1b（Task 14）：再加 `segment`、`layers`、`deprecated` 三個鍵，形狀見 Task 14。
- `loadNamingRules` 拒絕未知的鍵。

**`packages/tokens/lint-tokens.mjs`**
- `node lint-tokens.mjs [--root <uikit 根目錄>] [--base <git ref>]`。
  - `--root` 預設是腳本所在目錄往上兩層，可以是絕對路徑；
  - `--base` 預設 `origin/main`；
  - 未知參數印出用法，exit 1。
- 每個問題印一行 `rule <N> <error|warning> <file>[:<line>] <message>`，沒有檔案時印 `-`。最後一行是 `lint-tokens：<n> 個錯誤、<m> 個警告`。
- 退出碼：
  - 0：通過；
  - 1：有任何錯誤；
  - 3：只有規則 7 的棄用警告。
- 規則 8（1b）只印一行 `rule 8 report …`，不影響退出碼。
- `Issue = { rule: number; severity: "error" | "warning"; file?: string /* 相對 uikit 根目錄 */; line?: number; message: string }`。

**`packages/tokens/token-names.json`**（1b，Task 14）
- `{ "version": 1, "names": { "<cssVar>": "active" | "deprecated" | "removed" } }`，鍵排序。
- commit 進 repo，由 `build.mjs` 重寫，Prettier 不碰。

**棄用的寫法**
- `$value: "{新id}"`、`$deprecated: "<說明>"`、`$extensions["tw.org.tzuchi"] = { "replacedBy": "<新id>", "since": "YYYY-MM-DD" }`。

**tceditor**
- `scripts/uikit/sync-uikit.mjs`：
  - `UIKIT_REPOSITORY = "tzuchi/tzuchi-uikit"`；
  - `--dir` 預設 `../tzuchi-uikit`；
  - `--branch` 預設 `origin/main`，其他值一律要加 `--allow-branch`；
  - `SOURCE.json` 新增欄位 `styleDictionary`。
- `packages/blocks`：
  - `SPACE_CODES` 和 `BREAKPOINT_VARS` 放在 `src/token-classes.ts`；
  - `src/themes.json = { "light": "tzuchi", "dark": "tzuchi-dark" }`，以 `@tzuchi/tceditor-blocks/themes.json` 匯出。

## glab 的用法

Task 3、11 用 `glab` 寫 MR 說明、看 CI 狀態、檢查 `.gitlab-ci.yml`。這些指令一律單獨一行執行，不和其他指令用 `&&` 串在一起。用之前先確認它已登入 tcgitlab：

```bash
glab auth status --hostname tcgitlab.tzuchi-org.tw >/dev/null 2>&1
```

不要印出它的輸出。沒有登入時：
- 跳過 `glab ci lint`。`.gitlab-ci.yml` 的語法由 MR 的 pipeline 驗證。
- MR 說明寫在 scratchpad 的檔案裡，在檢查點把完整路徑交給使用者，請使用者貼到 MR。
- CI 狀態請使用者在 MR 頁面確認。

## 與規格的差異（主控者的裁定）

| # | 規格 | 計畫 | 理由 |
|---|---|---|---|
| 1 | §5.2：`check.mjs` 拿清單比對 `variables.css` | Task 7 改用測試裡一個獨立的 CSS 解析器，逐筆比對清單和 `dist/tokens.css`；`variables.css` 仍由 CI 的 `git diff --exit-code` 把關 | `generate.mjs` 一被 import 就會寫檔，測試裡沒辦法呼叫它 |
| 2 | §6.1：預設 `origin/main`，其他分支要加參數 | Task 4 連本機的 `main` 也要加 `--allow-branch` | 本機 `main` 可能有沒推上去、沒經過審查的 commit |
| 3 | §5.2：別名輸出（`lib/output-references.mjs`）屬於 1b | Task 7 在 1a 就建立這個檔，把兩個設定共用的述詞搬進去，內容不變；Task 13 只改函式 | 清單的 `css` 欄位和 `tokens.css` 必須用同一套規則 |
| 4 | §5.2：`noVar` 在 1a | MR3（Task 8）先留空，Task 10 改寫手冊時才加 `apps/docs/src/**` | MR3 合併時，手冊原始碼還有 12 處 `var(--tc-` |
| 5 | §5.3：基礎 7 頁 | Task 10 做 8 頁，多一頁「其他基礎值」（`opacity`、`focus-ring`、`z`），`size` 併入「間距與尺寸」 | 每個 primitive 根群組都要有頁面；漏掉時手冊建置會失敗 |
| 6 | §5.4：公開版拿掉 react-scan；logo 改相對路徑 | Task 3 整個移除 react-scan；logo 改成文字，刪掉 `heroui/storybook/public/` | 少一個建置參數和測試路徑；repo 裡沒有慈濟的 logo |
| 7 | §12：1b 的 MR 附 shadow 的前後截圖 | Task 13 另外做對照頁，再加上手冊的深色欄；HeroUI 樣品室的截圖只當對照組 | HeroUI 主題和 tceditor 都沒有讀這 9 個變數，樣品室的截圖前後會一樣 |
| 8 | §5.3：`site` 是 Production 網址 | Task 9 寫死 `https://tzuchi-uikit.pages.dev`，`check-site` 的 `OWN_ORIGINS` 用同一個值 | staging 已停用，不需要用環境變數傳入 |
| 9 | §6.1：權限模式只包住 `build.mjs`、`check.mjs` | Task 4 另外把 `scan-options.mjs` 的 import 階段也放進權限模式；sync 之後先看 `heroui/styles/src` 的 diff（Global Constraints） | 它會在 sync 程序裡 import uikit 的程式；複審實測發現這個缺口 |
| 10 | §5.2：「hasDarkOverride 的變數都在深色區塊」（單向） | Task 7 改成雙向；Task 13 讓深色別名行也標成 `hasDarkOverride: true` | 深色區塊多出沒標記的變數，表示清單和 CSS 不一致 |

## Review Focus

這五種情況是規格隱含、容易出事，但原本沒有測試涵蓋的。最可能發生的排在前面，每一項都已在負責的 task 加上測試。

1. **共編者沒先 `git fetch`，分支落後 main。** 規則 6 只回報「先 rebase 到 main」，不報一串假的「名稱消失」。測試：Task 14 `registry.test.mjs` 的「分支沒有 rebase」。
2. **同一個 id 在兩個非深色檔案各定義一次。** Style Dictionary 會讓後者悄悄蓋掉前者，規則 2 必須報錯，並指出兩個檔案。測試：Task 14 `rule 2 rejects the same id defined in two non-theme files`。
3. **`$description` 含中文、`}` 或引號。** 清單的 JSON 要正確，`check.mjs` 切 `:root` 區塊時不能被 `}` 截斷。測試：Task 7 夾具 `color.brand.surface` 的說明，以及 `check.mjs` 先去掉註解再切區塊。
4. **本機預覽的埠已被占用，包括別人監聽在 `0.0.0.0`、`::` 或 `::1`。** 啟動腳本要直接停止並說明原因，不可以換到別的埠（例如 tceditor 的 6008）。測試：Task 2 的 `checkPortFree` 測試（涵蓋四種監聽位址），以及 Step 6 的實際重複啟動。
5. **共編者用 Windows。** 啟動腳本不靠 shell 的環境變數前綴，也不用 `lsof` 或 `.bin`，改用 `spawn(process.execPath, …)` 傳入 `env`。測試：Task 2 的 `resolveBin` 測試，以及 root scripts 一律是 `node scripts/dev/*.mjs`。

---

## 里程碑 1a：上線

### Task 1: sync 換來源（§14 第 0 步）

目的：`pnpm sync:uikit` 改讀 tcgitlab 的 `tzuchi/tzuchi-uikit`（本機 `../tzuchi-uikit`），用同一個 commit `2b5a6781` 證明換來源後快照完全相同。不必等 uikit 合併。

**執行位置**：`/Users/kaellim/Desktop/projects/puck`，從 `tzuchi/main` 開分支 `ci-tokens/1a`（`git switch -c ci-tokens/1a tzuchi/main`）。uikit 只用 `git archive` 讀取。

**設計決定**：
- 只改 `UIKIT_REPOSITORY` 和 `--dir` 預設值（規格 §6.1「換來源的驗證」）。`--branch` 預設和其他行為留到 Task 4，所以這次要明確帶 `--branch origin/spike/heroui-v3`：新 clone 的本地分支只有 `spike/heroui-v3`，`origin/spike/heroui-v3` 也指向 `2b5a6781`，`merge-base --is-ancestor` 接受 remote ref（`scripts/uikit/sync-uikit.mjs:223-236`）。
- 預期差異有三處，不是兩處：`SOURCE.json` 的 `repository`、`branch`，以及 `packages/blocks/generated/uikit-options.json:3` 的 `source.repository`（`scan-options.mjs:91` 從 `SOURCE.json` 抄過去）。390 個檔案的雜湊、`removed` 的 72 筆都不變。其他差異就停下來回報。
- 文件（`CLAUDE.md:44,224`、`README.md:142`、`vendor/uikit/README.md`）在 Task 12 一起改。

**Files:**
- Modify: `scripts/uikit/sync-uikit.mjs:7`（Usage 註解）、`:29`、`:190`、`:198`
- Modify: `scripts/uikit/uikit.test.mjs:84`
- Regenerated: `vendor/uikit/SOURCE.json`、`packages/blocks/generated/uikit-options.json`

**Interfaces:**
- Consumes：uikit clone `/Users/kaellim/Desktop/projects/tzuchi-uikit`，`origin/spike/heroui-v3` = `2b5a6781f4a4180346550f7b5255126dafb8be85`。
- Produces：`UIKIT_REPOSITORY = "tzuchi/tzuchi-uikit"`；`parseCli` 的 `dir` 預設 `"../tzuchi-uikit"`。

- [ ] **Step 1: 改測試**
```js
// scripts/uikit/uikit.test.mjs:84
assert.equal(source.repository, "tzuchi/tzuchi-uikit");
```
- [ ] **Step 2: 跑測試，確認失敗**
Run: `node --test scripts/uikit/uikit.test.mjs`
Expected: FAIL，`SOURCE.json names the full commit…` 回報 `'puck-tzuchi-poc' !== 'tzuchi/tzuchi-uikit'`，其他 5 個測試通過。
- [ ] **Step 3: 改來源**
`sync-uikit.mjs`：`UIKIT_REPOSITORY = "tzuchi/tzuchi-uikit"`；`dir` 預設 `"../tzuchi-uikit"`；Usage 註解與錯誤訊息改成 `pnpm sync:uikit -- --commit <sha> [--dir ../tzuchi-uikit] [--branch spike/heroui-v3]`。
- [ ] **Step 4: 用新 clone 同步同一個 commit**
```bash
git -C ../tzuchi-uikit rev-parse origin/spike/heroui-v3   # 2b5a6781f4a4180346550f7b5255126dafb8be85
pnpm sync:uikit -- --commit 2b5a6781 --branch origin/spike/heroui-v3
git diff --stat && git diff vendor/uikit/SOURCE.json packages/blocks/generated/uikit-options.json
```
Expected：最後一行 `sync:uikit: vendor/uikit is tzuchi/tzuchi-uikit@2b5a6781f4a4180346550f7b5255126dafb8be85 (2026-09-22T12:34:45+08:00): 390 files, 72 removed; uikit-options.json lists 84 tv functions`。diff 只有 `"repository"`、`"branch": "origin/spike/heroui-v3"` 和 uikit-options 的 `"repository"` 三行，外加 Step 1、3 的兩個腳本。
- [ ] **Step 5: 跑測試，確認通過**
Run: `node --test scripts/uikit/uikit.test.mjs && pnpm turbo run test --filter=@tzuchi/tceditor-blocks`
Expected：node:test 6 pass；blocks 的 jest 全部通過（`uikit-whitelist.spec.ts` 讀新的 uikit-options）。
- [ ] **Step 6: Commit**
```bash
git add scripts/uikit/sync-uikit.mjs scripts/uikit/uikit.test.mjs vendor/uikit/SOURCE.json packages/blocks/generated/uikit-options.json
git commit -m "build: read the uikit snapshot from tzuchi/tzuchi-uikit" -m "sync:uikit now defaults to ../tzuchi-uikit, the clone of tcgitlab tzuchi/tzuchi-uikit, and records that repository. Re-syncing 2b5a6781 from the new clone changes only the recorded repository and branch; every file hash is the same." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 2: uikit 的 repo 整理與共編規則

目的：MR1 的前半。取消追蹤 `.pnpm-store/` 和 Astro 快取，把套件設成 private，加 14 天規則和 Node 下限，凍結 Lit（root 的 build、test 不再包含它），寫好給 Claude 的規則（`CLAUDE.md`、`.claude/settings.json`）、給共編者的指南和 MR 範本，再加兩支跨平台的本機啟動腳本（規格 §5.1 第 1–6 項、§5.6、§4.3）。

**執行位置**：`~/Desktop/projects/tzuchi-uikit`，分支 `chore/coediting-setup`，從 `origin/spike/heroui-v3` 開（目標 `main`，由 Task 3 推出）。

**設計決定**：
- **Lit 凍結的範圍**：`packages/components`、`packages/react`、`apps/storybook`、`apps/demo-html`。root 的 `build`、`test`、`verify:pkg` 從「排除 `heroui/*`」改成白名單 `--filter=@tzuchi/tokens`。`apps/docs` 這時還依賴 `@tzuchi/components`（`apps/docs/package.json:11`），turbo 的 `^build` 會把 Lit 一起拉進來，所以手冊先不放進 root build，由 Task 9 拿掉依賴後再加回。`typecheck`（`tsc -b`）只參照兩個 Lit 套件（`tsconfig.json:3`），維持原樣，不列入必跑檢查。
- **Prettier 會檢查新檔**：`pnpm lint` 是 `eslint . && prettier --check .`（`package.json:14`），`.prettierignore` 只排除 `docs/**` 和 `heroui/**`。所以 `CLAUDE.md`、`CONTRIBUTING.md`、MR 範本、`.claude/settings.json`、`scripts/dev/*.mjs` 都要跑過 `prettier --write`（單引號、100 欄，`.prettierrc.json`）。
- **`private` 寫在 package.json，JSON 不能加註解**：HeroUI 兩個 package.json 的 `LOCAL CHANGE` 只記在 `heroui/NOTICE.md`。前例是 `NOTICE.md:135` 的 `storybook/package.json`。
- **啟動腳本不用 `lsof`、不用 `.bin`**：Windows 兩者都沒有（tceditor 的 `apps/storybook/scripts/storybook.mjs:22-28` 用 `lsof`，`:19` 用 `.bin`）。改用 `net` 試著在 127.0.0.1 監聽來判斷埠，並用 `process.execPath` 執行套件 `bin` 指向的 JS 檔。Storybook 另外加 `--exact-port`，第二道防線。手冊的第二道防線（`vite.server.strictPort`）屬於 Task 9。
- **`docs.mjs` 先跑主題 CSS**：`apps/docs/scripts/theme-css.mjs` 存在時（Task 10 才建立），先用 node 執行它，失敗就停止。因為腳本是直接呼叫 astro，不經過 `apps/docs` 的 `dev` script。
- **deny 規則 `Bash(* publish*)` 會擋下任何含「 publish」的指令**，包括 commit 訊息和 `-o merge_request.title=`。`CLAUDE.md` 寫明：uikit 的 commit 訊息和 MR 標題不用 publish 這個字。

**Files:**
- Modify: `.gitignore:13`（檔尾加 `.astro/`、`site/`、`.claude/settings.local.json`、`heroui/storybook/.home/`）
- Untrack: `.pnpm-store/`（17,656 檔）、`apps/docs/.astro/`（5 檔）
- Modify: `package.json:7`（`"node": ">=22.22.0"`）、`:11,13,16`（白名單 filter）、`:19`（改呼叫啟動腳本），並加 `docs:dev`、`test:scripts`
- Modify: `pnpm-workspace.yaml:13`（檔尾加 `minimumReleaseAge`）
- Modify: `packages/tokens/package.json:2`、`packages/components/package.json:2`、`packages/react/package.json:2`（`name` 後加 `"private": true`）
- Modify: `heroui/react/package.json:2,25-27`、`heroui/styles/package.json:2,61-63`（加 `private`，刪 `publishConfig`）
- Modify: `heroui/NOTICE.md:110`（在 **Storybook** 之前加 **Packages** 一組）
- Modify: `docs/superpowers/specs/2026-06-15-tzuchi-uikit-design-system-design.md:10`（表格後加修正說明）
- Create: `CLAUDE.md`、`.claude/settings.json`、`CONTRIBUTING.md`、`.gitlab/merge_request_templates/Default.md`
- Create: `scripts/dev/lib.mjs`、`scripts/dev/storybook.mjs`、`scripts/dev/docs.mjs`、`scripts/dev/astro.mjs`
- Test: `scripts/dev/lib.test.mjs`

**Interfaces:**
- Consumes：無。
- Produces：
  - root scripts：`"heroui:storybook": "node scripts/dev/storybook.mjs"`、`"docs:dev": "node scripts/dev/docs.mjs"`、`"test:scripts": "node --test \"scripts/**/*.test.mjs\""`（Task 3、11 的 CI 會跑它）。
  - `scripts/dev/astro.mjs <astro 的參數…>`：不檢查埠，用 `spawnSync(process.execPath, [resolveBin(apps/docs, 'astro', 'astro'), ...args], { env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1', ASTRO_DISABLE_UPDATE_CHECK: 'true', ASTRO_DEV_BACKGROUND: '0' }, cwd: apps/docs, stdio: 'inherit' })`，以子程序的結束碼結束。Task 9、10 的 `apps/docs` `build` script 透過它執行 astro。
  - `scripts/dev/lib.mjs`：`HOST = '127.0.0.1'`；`checkPortFree(port, host = HOST) → Promise<boolean>`；`resolveBin(pkgDir, pkg, bin) → string`（讀 `<pkgDir>/node_modules/<pkg>/package.json` 的 `bin`，`bin` 可以是字串或物件，回傳絕對路徑；找不到就丟出 `Error('找不到 <pkg>，請先執行 pnpm install')`）；`launch({ name, cwd, port, pkg, bin, args, env }) → Promise<never>`。
  - `CLAUDE.md` 的「推之前必跑的檢查」一節，由 Task 8、11、14 各自補上新的指令。

- [ ] **Step 1: 開分支、安裝**
Run: `git -C ~/Desktop/projects/tzuchi-uikit fetch origin && git -C ~/Desktop/projects/tzuchi-uikit switch -c chore/coediting-setup origin/spike/heroui-v3 && cd ~/Desktop/projects/tzuchi-uikit && pnpm install --frozen-lockfile`
Expected：`HEAD` 在 `2b5a6781`，install 成功。

- [ ] **Step 2: 取消追蹤快取並 commit**
`.gitignore` 檔尾加上 `.astro/`、`site/`、`.claude/settings.local.json` 三行。
```bash
git rm -r --cached -q .pnpm-store apps/docs/.astro
git add .gitignore
git commit -m "chore: stop tracking the pnpm store and the Astro cache" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
Expected：`git ls-files .pnpm-store apps/docs/.astro | wc -l` 是 `0`，磁碟上的檔案還在。

- [ ] **Step 3: 套件 private、engines、14 天規則、凍結 Lit**
- `pnpm-workspace.yaml` 檔尾：
```yaml
# 新版本要發布滿 14 天（20160 分鐘）才會被選用，防範被植入惡意程式的新版。
# 只在本機更新 lockfile 時把關；CI 用 --frozen-lockfile 不重新檢查，審 MR 要看 lockfile 的 diff。
# 安全修正不滿 14 天時，用 minimumReleaseAgeExclude 指定精確版本，由宇軒核可並註明 GHSA 編號。
minimumReleaseAge: 20160
```
- root scripts：`"build": "turbo run build --filter=@tzuchi/tokens"`，`test`、`verify:pkg` 照同樣寫法。`heroui:storybook`、`docs:dev`、`test:scripts` 在 Step 5 才加。
- 五個套件加 `"private": true`。`heroui/react`、`heroui/styles` 刪掉整個 `publishConfig`。
- `corepack use pnpm@10.26.1`：讓 root 的 `packageManager` 帶上 `+sha512.…`，corepack 下載 pnpm 時會驗證雜湊（規格 §8）。`pnpm-lock.yaml` 不應改變。
- `NOTICE.md` 新增 **Packages**：`- **Changed** \`react/package.json\`, \`styles/package.json\` — \`"private": true\` and no \`publishConfig.access: public\`, so \`changeset publish\` cannot push them to npmjs.org. JSON has no comments, so this entry is the LOCAL CHANGE record.`
Run: `pnpm install --frozen-lockfile && pnpm build && pnpm test`
Expected：install 不改 `pnpm-lock.yaml`（`git diff --quiet pnpm-lock.yaml`）；turbo 只列出 `@tzuchi/tokens`，兩個指令都通過。
```bash
git add package.json pnpm-workspace.yaml packages/tokens/package.json packages/components/package.json packages/react/package.json heroui/react/package.json heroui/styles/package.json heroui/NOTICE.md
git commit -m "chore: make the packages private, require Node 22.22 and freeze Lit out of the root tasks" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 4: 寫會失敗的測試（`scripts/dev/lib.test.mjs`）**
```js
test('checkPortFree is false while another server listens on the port', async () => {
  const server = net.createServer().listen(0, '127.0.0.1');
  await once(server, 'listening');
  assert.equal(await checkPortFree(server.address().port), false);
  server.close();
});
test('checkPortFree is true for a port nobody listens on', async () => { /* 先 listen(0) 取得埠號再 close */ assert.equal(await checkPortFree(port), true); });
for (const host of ['0.0.0.0', '::', '::1']) test(`checkPortFree is false while a server listens on ${host}`, async (t) => {
  // 這台電腦不支援 IPv6 時用 t.skip()
  const server = net.createServer().listen(0, host); await once(server, 'listening');
  assert.equal(await checkPortFree(server.address().port), false); server.close();
});
test('resolveBin returns the JS entry of the Storybook CLI', () => {
  const file = resolveBin(join(root, 'heroui/storybook'), 'storybook', 'storybook');
  assert.ok(isAbsolute(file) && existsSync(file));
});
test('resolveBin names pnpm install when the package is missing', () => {
  assert.throws(() => resolveBin(root, 'no-such-package', 'x'), /pnpm install/);
});
```
Run: `node --test scripts/dev/lib.test.mjs`　Expected：FAIL，`Cannot find module '…/scripts/dev/lib.mjs'`。

- [ ] **Step 5: 實作三支腳本，加 root scripts**
- root scripts 加 `heroui:storybook`（取代 `package.json:19`）、`docs:dev`、`test:scripts`，內容見 Interfaces。
- `checkPortFree(port)`：macOS 的 libuv 會設 `SO_REUSEADDR`，別人監聽在萬用位址或 `::1` 時，綁 `127.0.0.1` 仍會成功。所以只用「試著綁定」判斷不夠：先對 `127.0.0.1` 和 `::1` 各試一次 `net.connect`（逾時 300 ms），任何一個連得上就算占用；兩個都連不上，再試著在 `127.0.0.1` 監聽一次。
- `lib.mjs`：`launch` 依序 (1) `checkPortFree(port)` 為 false 時印「埠 <port> 已被占用，所以沒有啟動<name>。請先停掉占用它的程序（如果是你開的），再重跑一次。」並 `process.exit(1)`；(2) `spawn(process.execPath, [resolveBin(cwd, pkg, bin), ...args], { cwd, stdio: 'inherit', env: { ...process.env, ...env } })`；(3) 把 `SIGINT`、`SIGTERM` 轉給子程序，以子程序的結束碼結束。
- `storybook.mjs`：`launch({ name: '元件樣品室', cwd: <root>/heroui/storybook, port: 6007, pkg: 'storybook', bin: 'storybook', args: ['dev', '--host', HOST, '--port', '6007', '--exact-port', '--no-open', '--ci', '--no-version-updates'], env: { STORYBOOK_DISABLE_TELEMETRY: '1', HOME: <root>/heroui/storybook/.home, USERPROFILE: <root>/heroui/storybook/.home } })`。Storybook CLI 會寫 `~/.storybook/settings.json`，uikit 以外的路徑不可寫，所以和 tceditor 的 `apps/storybook/scripts/storybook.mjs` 一樣把 `HOME` 指到 repo 裡被忽略的 `.home/`。
- `docs.mjs`：`theme-css.mjs` 存在時先 `spawnSync(process.execPath, [它], { cwd: apps/docs, stdio: 'inherit' })`，結束碼不是 0 就照樣退出；接著 `launch({ name: '手冊', cwd: <root>/apps/docs, port: 4321, pkg: 'astro', bin: 'astro', args: ['dev', '--host', HOST, '--port', '4321'], env: { ASTRO_TELEMETRY_DISABLED: '1', ASTRO_DISABLE_UPDATE_CHECK: 'true', ASTRO_DEV_BACKGROUND: '0' } })`。`ASTRO_DEV_BACKGROUND=0`：Astro 7 偵測到 AI coding agent 時會把 `astro dev` 放到背景、脫離 shell，就無法照規則用 PID 停掉（調查報告 phase1-astro §1.2）。
- `<root>` 由 `fileURLToPath(new URL('../..', import.meta.url))` 算出，不依賴 cwd。

- [ ] **Step 6: 跑測試，並實際啟動一次**
Run: `pnpm run test:scripts`　Expected：4 個測試 PASS。
先確認 `lsof -nP -iTCP:6007 -sTCP:LISTEN` 沒有輸出，再在背景直接跑 `node scripts/dev/storybook.mjs`（不經過 pnpm，記下的 PID 才是啟動腳本本身），記下 PID。`curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:6007/` 回 `200`，`lsof` 只顯示 `127.0.0.1:6007`。這時再跑一次 `node scripts/dev/storybook.mjs`，要以 1 結束，並印出「埠 6007 已被占用」。用 `kill <PID>` 停掉，再用 `lsof` 確認 6007 已經釋放。`~/.storybook/settings.json` 的修改時間沒有變。手冊的啟動腳本不在這裡實際啟動：現在的 astro 5.18.2 有 critical 漏洞，留到 Task 10 升級之後再驗證。
```bash
pnpm exec prettier --write scripts/dev package.json
git add scripts/dev package.json .gitignore
git commit -m "feat(scripts): add local preview launchers bound to 127.0.0.1" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 7: 共編規則與指南**
- `.claude/settings.json`（精確內容）：
```json
{
  "permissions": {
    "deny": ["Bash(wrangler *)", "Bash(npx wrangler *)", "Bash(npx -y wrangler*)", "Bash(npx wrangler@*)", "Bash(pnpm exec wrangler*)", "Bash(pnpm dlx wrangler*)", "Bash(* publish*)", "Bash(pkill *)", "Bash(killall *)"],
    "ask": ["Bash(git push*)"]
  }
}
```
- `CLAUDE.md`（繁體中文；節次照規格 §5.6 的 10 條）：
  1. 地圖：`packages/tokens`（唯一來源）、`heroui/`（vendored HeroUI 和慈濟主題）、`heroui/storybook`、`apps/docs`、`scripts/ci`、`scripts/dev`、凍結的 Lit 四個目錄；常用指令。
  2. 流程：`git fetch` → 從 `origin/main` 開 `tokens/<主題>` 或 `docs/<主題>` → 檢查 → commit → `git push -u origin <branch> -o merge_request.create -o merge_request.target=main -o merge_request.title="…"`。絕不 push 到 `main`、絕不合併；合併前先 rebase 到 `main`。MR 說明用白話寫「改了什麼、哪些畫面會變、要看哪幾頁」。
  3. 絕對不做：從 shell 執行 `wrangler`（引 `docs/superpowers/specs/2026-09-22-gitlab-ci-cloudflare-staging-design.md`）；`changeset publish`、`npm publish`、`pnpm publish`；讀、印或 commit 任何 `.env`、CI 變數或登入資訊；碰這個 repo 以外的目錄。commit 訊息和 MR 標題不用 publish 這個字（deny 規則會擋）。
  4. 推之前必跑：`pnpm --filter @tzuchi/tokens test`；`pnpm run heroui:theme && git diff --exit-code -- heroui/styles/themes/tzuchi/variables.css`；`pnpm run test:scripts`；`pnpm lint`；改到 `heroui/` 時加跑 `pnpm run heroui:storybook:build`。本機預覽只用 `pnpm run heroui:storybook`、`pnpm run docs:dev`；開之前先檢查埠；只用 PID 停掉自己開的程序，不用 `pkill`、`killall`；不碰 3000 埠。
  5. 1b 完成之前，不改名、不刪 token，有需要先問使用者或宇軒。
  6. HeroUI `tv` variant 名稱（例如 Button 的 `primary`、`secondary`、`outline`）會存進 tceditor 的頁面資料，不可改名或移除。
  7. 主題只能設在 `<html>`。
  8. 手冊零第三方請求；元件樣品室不可新增外部資源。
  9. vendored HeroUI 照 `heroui/NOTICE.md`：每處修改都標 `LOCAL CHANGE`，並列入清單。
  10. `drill/*` 分支不可 push。
  另外：Lit 四個目錄凍結，不修改。
- `CONTRIBUTING.md`（繁體中文）：角色和核可（子鈞核可 token、宇軒核可工程，Claude 不合併）；電腦準備（tcgitlab 帳號、Node 22.22 以上，建議 24，2026-10-28 後可用 26、`corepack enable pnpm`、Claude Code）；第一次 `pnpm install`，再 `pnpm --filter @tzuchi/tokens build`（手冊要讀 `dist/`）；一次修改的流程（規格 §4.2 第 1–8 步，由共編者的角度寫）；本機預覽（`pnpm run docs:dev` → http://127.0.0.1:4321、`pnpm run heroui:storybook` → http://127.0.0.1:6007，兩者分開跑，所以本機手冊上的 `/storybook/` 連結會失效）；Windows 也用同樣的指令。
- `.gitlab/merge_request_templates/Default.md`：
```markdown
## 改了什麼

## 哪些畫面會變、要看哪幾頁

## 檢查

- [ ] 本機跑過 CLAUDE.md「推之前必跑的檢查」
- [ ] 改到 token：子鈞已看過預覽
- [ ] 改到建置或 CI：宇軒已看過

## 合併之後

- [ ] 合併的人通知 tceditor 維護者同步 tceditor（`pnpm sync:uikit`）
```
- 設計規格的修正說明（`2026-06-15-…-design.md` 的表格後）：`> **2026-10-21 修正：** Lit Web Components（packages/components、packages/react、apps/storybook、apps/demo-html）已凍結：程式留在 repo、不再修改，root 的 build 和 test 不再包含它們。元件的方向改為 heroui/ 的 HeroUI v3 加上慈濟主題，元件樣品室是 heroui/storybook。本文以 Lit 為單一來源的段落，以此修正為準。共編機制見 tceditor repo 的 docs/superpowers/specs/2026-10-21-ci-tokens-coediting-design.md。`
Run: `pnpm exec prettier --write CLAUDE.md CONTRIBUTING.md .gitlab .claude && pnpm lint`
Expected：`pnpm lint` 以 0 結束，沒有新的 warning。

- [ ] **Step 8: Commit**
```bash
git add CLAUDE.md CONTRIBUTING.md .claude/settings.json .gitlab/merge_request_templates/Default.md docs/superpowers/specs/2026-06-15-tzuchi-uikit-design-system-design.md
git commit -m "docs: add the co-editing rules, the contributor guide and the MR template" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
Expected：`git status --short` 沒有輸出；`git log --oneline origin/spike/heroui-v3..` 有 4 個 commit。

### Task 3: HeroUI 元件樣品室的快速修正與授權檔，推出 MR1

目的：MR1 的後半。合併後第一條 main pipeline 就會把 Storybook 部署到 Production，所以第一次公開的必須是修正過的版本：預設慈濟主題、沒有 HeroUI 品牌、沒有 Google Fonts 和 react-scan、刪掉會呼叫外部 API 的 3 個 story、附上 Apache-2.0 授權檔，並把 vite 升到 7.3.7（規格 §5.4「1a 快速修正」1–6 項、§5.1 第 7 項）。最後推出 MR1，停在檢查點 H1。

**執行位置**：`~/Desktop/projects/tzuchi-uikit`，分支 `chore/coediting-setup`（接著 Task 2）。

**設計決定**：
- **logo 改成文字，刪掉 `public/`**：repo 裡沒有慈濟的 logo 檔（`git ls-files | grep -i logo` 只有 HeroUI 的三個）。`styles/theme.ts:60,94` 的 `brandTitle` 改成純文字「慈濟元件樣品室」，刪掉 `public/` 的 `logo-dark.svg`、`logo-light.svg` 和 HeroUI 的 `favicon.svg`，並從 `main.ts:43-49` 拿掉兩個 `staticDirs`。Storybook 因此改用它內建的 favicon。這樣也一併解決 §5.4「搬到子路徑」裡 logo 用絕對路徑的問題，Task 11 只需要驗證。
- **react-scan 整個拿掉，不分公開版和本機版**：它只是效能除錯工具，卻要 `dangerouslyForceRunInProduction`（`addons/react-scan/decorator.tsx:60`）和絕對路徑的 `<script src="/react-scan/…">`（`preview-head.html:20`）。分成兩個版本，就要多一個 build 參數和一個測試路徑。
- **預設主題**：把 `THEME_VALUES` 重排成 `["tzuchi", "tzuchi-dark", "light", "dark"]`，`DEFAULT_THEME = THEME_VALUES[0]` 不用改，manager（`addons/theme/manager.ts:14,53`）和 docs container 都跟著變。`preview.tsx:57-59` 的 `initialGlobals` 原本只放 react-scan，改成明確寫入主題。
- **vite 用 override**：只有 `heroui/storybook/package.json:44` 宣告 vite，但 lockfile 裡 HeroUI 的 vitest、plugin-react 等 peer 都解析到 `vite@7.3.5`（`pnpm-lock.yaml:142,154,184…`）。只改 package.json，舊版可能還留在 lockfile，所以在 `pnpm-workspace.yaml` 加 `overrides`。
- **刪 story 時一起刪掉只剩它們在用的 import**：`useAsyncList`、`Spinner`，以及 combo-box 和 select 的 `Collection`、`ListBoxLoadMoreItem`（只在這 3 個 story 裡用到，已用 grep 確認），不然 HeroUI 的 lint 會報 unused。`@react-stately/data` 這個 devDependency 保留，不動 HeroUI 的依賴。
- **授權檔只在 CI 複製**（規格 §5.4 第 5 項）：本機 build 不會有，Welcome 頁的連結在本機會 404，可以接受。

**Files:**
- Modify: `heroui/storybook/.storybook/addons/theme/constants.ts:6-40`
- Modify: `heroui/storybook/.storybook/preview.tsx:5-7,42,50,57-59`
- Delete: `heroui/storybook/.storybook/addons/react-scan/`（3 個檔）、`heroui/storybook/public/`（3 個檔）
- Modify: `heroui/storybook/.storybook/main.ts:4,12-13,43-49`
- Modify: `heroui/storybook/.storybook/preview-head.html:1-6,20,27-29`
- Modify: `heroui/storybook/.storybook/globals.css:9-11`
- Modify: `heroui/storybook/.storybook/welcome.mdx`（整頁改寫）
- Modify: `heroui/storybook/.storybook/styles/theme.ts:60,94`
- Modify: `heroui/storybook/package.json`（`vite` 改成 `7.3.7`，刪掉 `react-scan`）、`pnpm-workspace.yaml`、`pnpm-lock.yaml`
- Modify: `heroui/react/src/components/autocomplete/autocomplete.stories.tsx:5,22,1104-1177`
- Modify: `heroui/react/src/components/combo-box/combo-box.stories.tsx:5,19,21,597-660`
- Modify: `heroui/react/src/components/select/select.stories.tsx:5,17,19,904-953`
- Modify: `heroui/NOTICE.md:110-135`、`.gitlab-ci.yml:83-90`

**Interfaces:**
- Consumes：Task 2 的 `test:scripts`、`chore/coediting-setup` 分支。
- Produces：CI build job 會在 `storybook-static/` 放 `LICENSE`、`NOTICE.md`，並在出現 `swapi.py4e.com`、`pokeapi.co` 時失敗（Task 11 保留這兩步）。Storybook 沒有任何 `/` 開頭的自有資源路徑（Task 11 的 `check-site` 會檢查）。

- [ ] **Step 1: 主題、react-scan、字型**
- `constants.ts`：照設計決定重排，`THEME_OPTIONS` 的順序跟著改；`LOCAL CHANGE` 註解改成「Tzu Chi themes first; the gallery opens in "tzuchi"」。
- `preview.tsx`：刪掉 react-scan 的 import、decorator 和 global type；`initialGlobals: { [THEME_GLOBAL_TYPE_ID]: DEFAULT_THEME }`，從 `./addons/theme/constants` import，加 `// LOCAL CHANGE:` 說明。
- `main.ts`：刪掉 `reactScanDist`、`createRequire` 和整個 `staticDirs`，加 `// LOCAL CHANGE:` 註解。
- `preview-head.html`：刪掉 Google Fonts 的三個 `<link>` 和 react-scan 的 `<script>`；`<style>` 的字型清單拿掉 `Inter,`；檔首加 `<!-- LOCAL CHANGE: … -->`。`globals.css:9-11` 同樣拿掉 `Inter,`，並在既有的 `LOCAL CHANGE` 註解區塊補一句。
- `git rm -r heroui/storybook/.storybook/addons/react-scan heroui/storybook/public`。

- [ ] **Step 2: 品牌**
- `theme.ts` 兩處改成 `brandTitle: "慈濟元件樣品室",`，上方加 `// LOCAL CHANGE: text title; HeroUI's logo image (an absolute /logo-*.svg path) removed.`
- `welcome.mdx` 改寫：保留 `<Meta title="Welcome" />`，`import` 只留 `Meta`；檔首加 `{/* LOCAL CHANGE: … */}`。內容：標題「慈濟元件樣品室」；一段說明「以 HeroUI v3 為基礎、套用慈濟 design tokens 的元件展示；預設是『慈濟 Tzu Chi』主題，可在工具列的 Theme 切換」；一行授權說明「包含 HeroUI（Apache-2.0）的修改版本，授權全文與修改清單見 `<a href="./LICENSE" target="_blank" rel="noopener">LICENSE</a>`、`<a href="./NOTICE.md" target="_blank" rel="noopener">NOTICE.md</a>`」。不放 heroui.com、GitHub、Discord 連結和建置日期。

- [ ] **Step 3: 刪掉 3 個呼叫外部 API 的 story**
- autocomplete：刪掉 `:1104` 的 `interface Pokemon {` 到 `AsynchronousFiltering` 結尾的 `};`（`:1177`），以及 `:5`、`:22` 的 import。
- combo-box：刪掉 `:597-660`（`interface Character` 到 `AsynchronousLoading` 的 `};`），以及 `:5` 的 import、`:19` 整行、`:21` 的 import。
- select：刪掉 `:904-953`（`interface Pokemon` 到 `AsynchronousLoading` 的 `};`），以及 `:5`、`:17`、`:19` 的 import。
- 三處都在原位置留一行 `// LOCAL CHANGE: <Export> removed — it fetched swapi.py4e.com / pokeapi.co (see heroui/NOTICE.md).`

- [ ] **Step 4: vite 7.3.7 與 lockfile**
`heroui/storybook/package.json`：`"vite": "7.3.7"`，刪掉 `"react-scan"`。`pnpm-workspace.yaml` 加：
```yaml
overrides:
  # GHSA-587h-7wmj-h5pm（high）、GHSA-r825-w8mm-5pxw：vite 7.3.5 的漏洞，7.3.7（2026-10-06 發布）修正。
  # HeroUI 的 vitest 等 peer 也解析到 vite 7，用 override 讓 lockfile 只剩 7.3.7。
  'vite@>=7.0.0 <7.3.7': '7.3.7'
```
Run: `pnpm install && grep -c 'vite@7.3.5' pnpm-lock.yaml; grep -c 'react-scan' pnpm-lock.yaml`
Expected：install 沒有 `minimumReleaseAge` 的錯誤，兩個 grep 都印 `0`。

- [ ] **Step 5: NOTICE.md**
`NOTICE.md` 會隨樣品室公開（`/storybook/NOTICE.md`）。所以先把第 137–149 行那段內部流程的說明（例如「synced from the main checkout's uncommitted work」「designers should confirm」）改寫成只描述修改的內容。接著在 **Storybook** 一組加 `Changed` 或 `Removed` 條目：`constants.ts` 和 `preview.tsx`（預設主題）；`addons/react-scan/`、`main.ts` 的 `staticDirs`、`preview-head.html` 的 react-scan script 和 `react-scan` 依賴（Removed）；`preview-head.html`、`.storybook/globals.css`（不載 Google Fonts Inter）；`styles/theme.ts`（文字標題）；`public/`（HeroUI logo 和 favicon，Removed）；`welcome.mdx`（改寫成慈濟樣品室的說明，取代原本 welcome.mdx 的那一條；Task 2 在前面插入了 **Packages**，所以用內容定位，不用行號）；`package.json`（vite 7.3.7）。另外新增 **Stories** 一組：`Removed` 三個 export，寫明檔案和原因。

- [ ] **Step 6: CI 的授權檔和外部 API 檢查**
在 `.gitlab-ci.yml` build job 的 `pnpm --filter @tzuchi/tokens test`（`:84`）之後加 `- pnpm run test:scripts`；在 `test -f …/index.html`（`:90`）之後加：
```yaml
    # 這兩個網域只出現在已刪掉的 3 個 story（會把讀者打的字送出去），重新出現就擋下。
    # 要在複製 NOTICE.md 之前檢查：NOTICE.md 自己會寫出這兩個網域。
    - >-
      if grep -rlE 'swapi\.py4e\.com|pokeapi\.co' heroui/storybook/storybook-static;
      then echo '出現呼叫外部 API 的 story，見 heroui/NOTICE.md'; exit 1; fi
    # Apache-2.0 §4：公開的樣品室附上 HeroUI 的授權和修改清單
    - cp heroui/LICENSE heroui/NOTICE.md heroui/storybook/storybook-static/
```

- [ ] **Step 7: 驗證**
Run: `pnpm --filter @heroui/storybook lint && pnpm --filter @heroui/react lint && pnpm --filter @heroui/react typecheck && pnpm lint`
Expected：全部以 0 結束。
Run（glab 已登入時，單獨一行）：`glab ci lint .gitlab-ci.yml`　Expected：`CI/CD YAML is valid`。
Run: `pnpm run heroui:storybook:build && grep -rlE 'swapi\.py4e\.com|pokeapi\.co|fonts\.googleapis|react-scan|logo-dark' heroui/storybook/storybook-static; grep -lE '(src|href)="/[^/]' heroui/storybook/storybook-static/*.html`
Expected：build 成功，兩個 grep 都沒有輸出。
用 `node scripts/dev/storybook.mjs`（記下 PID）開 http://127.0.0.1:6007（用瀏覽器工具，或請共編者開）：工具列的 Theme 顯示「慈濟 Tzu Chi」，選單前兩項是慈濟主題；Welcome 是中文說明，沒有 HeroUI logo；網路請求裡沒有 `fonts.googleapis.com`、`fonts.gstatic.com`。看完用 PID 停掉。

- [ ] **Step 8: Commit**
```bash
git add heroui/storybook heroui/react/src/components/autocomplete/autocomplete.stories.tsx heroui/react/src/components/combo-box/combo-box.stories.tsx heroui/react/src/components/select/select.stories.tsx heroui/NOTICE.md pnpm-workspace.yaml pnpm-lock.yaml .gitlab-ci.yml
git commit -m "fix(heroui): open the gallery in the Tzu Chi theme without HeroUI branding or third-party calls" -m "Default theme tzuchi; no Google Fonts, react-scan or HeroUI logo; remove the three stories that call swapi.py4e.com and pokeapi.co; vite 7.3.7 (GHSA-587h-7wmj-h5pm, GHSA-r825-w8mm-5pxw); CI ships LICENSE and NOTICE.md with the build." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 9: 推出 MR1**
```bash
git push -u origin chore/coediting-setup -o merge_request.create -o merge_request.target=main -o merge_request.title="chore: set up co-editing and fix the public Storybook"
```
glab 已登入時，單獨執行 `glab mr update chore/coediting-setup --description "$(cat <scratchpad>/mr1.md)"`；沒登入就在 H1 把 `mr1.md` 的完整路徑交給使用者。
`mr1.md` 用白話寫：改了什麼（Task 2、3 的項目）、哪些畫面會變（樣品室預設慈濟主題、Welcome、字型改用系統字）、要看哪幾頁，以及下面 H1 的清單。
Run（glab 已登入時）：`glab ci status --branch chore/coediting-setup`　Expected：`build` 和 `deploy:not-protected` 都是 passed。沒登入時請使用者在 MR 頁面確認。

- [ ] **Step 10: 檢查點 H1：停下，回報 MR 網址，請使用者（或宇軒）做以下的事，完成後告知**
1. Settings → Merge requests：合併方式選「Fast-forward merge」，勾選「Pipelines must succeed」（1b 的規則 6 需要）。
2. Settings → Repository → Protected branches：`main` 設成「Allowed to push：No one」，「Allowed to merge」依 §13 H（建議只給宇軒）。
3. 合併 MR1。spike 的 11 個 commit 會一起進 main，可以 fast-forward。
4. 確認 main pipeline 的 `deploy:production` 是綠的，打開 Environments → production 的網址（應為 `https://tzuchi-uikit.pages.dev`）：根目錄是 Storybook，預設慈濟主題，沒有 HeroUI 的 logo；`/LICENSE` 回 200。到 Task 11 合併之前，根目錄暫時是 Storybook（規格 R1）。
5. 把 `spike/heroui-v3` 移出 Protected branches，或刪掉這條分支。
6. Cloudflare 後台 → Workers & Pages → `tzuchi-uikit` → Deployments：刪除 `staging` 分支的所有舊 Preview 部署，因為裡面有 Google Fonts、HeroUI 品牌和會送出讀者輸入的 stories。
7. 轉給宇軒（不擋後續 task）：
   - §5.5 的 CI 金鑰 environment scope 實測，結果出來後更正 `docs/superpowers/specs/2026-09-22-gitlab-ci-cloudflare-staging-design.md` 或 `.gitlab-ci.yml` 註解的其中一邊；
   - 開啟「Use separate caches for protected branches」；
   - build job 的 cache 拿掉 `.corepack/`（`packageManager` 已在 Task 2 加上雜湊）。

收到「MR1 已合併」後才做 Task 4、5。

### Task 4: sync 強化（§14 第 2 步）

目的：sync 只接受 uikit `origin/main` 上的 commit，在 Node 權限模式裡執行 uikit 的 `build.mjs`／`check.mjs`，並檢查 Style Dictionary 版本一致、build 產物存在、build 沒改到受追蹤的檔案。Style Dictionary 還在 4.4.0。

**執行位置**：`/Users/kaellim/Desktop/projects/puck`，分支 `ci-tokens/1a`。前提：MR1（Task 3）已合併，`git -C ../tzuchi-uikit merge-base --is-ancestor 2b5a6781 origin/main` 回 0。

**設計決定**：
- 權限旗標（Node 24 起 `--permission` 為穩定版；目錄授權涵蓋整個子樹，已在 Node 26.7.0 + SD 4.4.0 實測 build 與 `check.mjs` 通過、`tokens.css` 與 vendor 逐位元組相同）：
  `node --permission --allow-fs-read=<work> --allow-fs-read=<repo>/node_modules/.pnpm --allow-fs-write=<work> <script>`。不給 `--allow-child-process`、`--allow-worker`、`--allow-addons`、`--allow-net`。所有路徑先 `realpathSync`：權限檢查逐字比對，macOS 的 `tmpdir()` 是 `/var` → `/private/var` 的 symlink。
- 只授權 `.pnpm`，不授權整個 `node_modules`：`node_modules/@tzuchi/tceditor -> ../../packages/core` 這類相對 symlink 讓 `node_modules/@tzuchi/tceditor/../../.env` 字面上留在授權範圍、實際讀到 repo 根目錄（`spec-rereview.md` 必改 1）。sync 另外在授權前掃 `.pnpm` 深度 4 以內的 symlink，有任何一個解析到 `.pnpm` 外面（或斷掉）就拒絕執行；目前 2,891 個 symlink 都在裡面（實測 0.4 秒）。
- 子程序的 `env` 設成 `{}`：去掉使用者的秘密環境變數，也去掉 `NODE_OPTIONS`（它能塞進 `--allow-fs-read=*`）。
- 暫存目錄維持 repo 內的 `vendor/.sync-uikit-*`（`sync-uikit.mjs:243`），但改由 `work/node_modules/style-dictionary`（絕對路徑 symlink，指向 `realpath(<repo>/node_modules/style-dictionary)`）解析套件。`tree/` 裡的 symlink 早就被 `listFiles` 拒絕（`sync-uikit.mjs:97-99`）。
- sync 不執行 `git fetch`（維持「只讀 uikit」），由操作者先 fetch。Node < 25 擋不住網路，sync 在 stderr 印一行警告。
- **工作樹裡任何 symlink 都拒絕**（複審實測的逃逸路徑）：現在的 `listFiles` 先略過 `OS_FILES`（`.DS_Store`，`sync-uikit.mjs:80,89`），才檢查檔案類型（`:93-99`）。所以 uikit commit 裡被追蹤、名為 `.DS_Store` 的 symlink 會被解開到 `<work>`。它字面上在授權範圍內，實際卻指到家目錄，可以讀也可以寫。
  - 改成先判斷類型，只有 `isFile()`、`isDirectory()` 才繼續，其他類型不論名稱一律丟錯；`OS_FILES` 只略過一般檔案。
  - `prepareSandbox` 在授權前，對整個 `<work>` 做不限深度的掃描。除了它自己建立的 `node_modules/style-dictionary`，任何 symlink 都拒絕。
- **`scan-options.mjs` 的 import 也進權限模式**：它用 esbuild 打包 vendored 的 `heroui/styles/src`，再在 sync 程序裡 `import()`（`scripts/uikit/scan-options.mjs:47-58`），等於以使用者的權限執行 uikit 的程式。
  - 改成父程序只打包（esbuild 不執行程式碼），由 `runSandboxed` 開子程序 import 打包結果，把 options 以 JSON 印到 stdout。
  - 子程序只能讀 bundle 所在的目錄和 `.pnpm`，不可寫，`env: {}`。
- **`changedFiles` 的檢查放在 `build.mjs` 之後、`check.mjs` 之前**：登記檔過期時，先報「build 改到了受追蹤的檔案」，不會被 `check.mjs` 的其他錯誤蓋掉。
- `runSandboxed` 用 `spawnSync`，`timeout: 120_000`、`maxBuffer` 足夠放下 options 的 JSON。權限模式不限制送訊號（`process.kill`），這個殘留風險靠「只接受 main 上的 commit」和 MR 審查，寫進 tceditor 的 `CLAUDE.md`（Task 12）。
- `lockedStyleDictionaryVersion` 去掉 `(…)` 之後必須符合 `^\d+\.\d+\.\d+$`，否則丟錯：版本來自共編者能改的 lockfile，不可以是網址、`npm:` 或 `link:`。
- `parseCli` 回傳新建的普通物件：`parseArgs` 的 `values` 沒有原型，`node:assert/strict` 的 `deepEqual` 會判定不相等。
- 只接受 `origin/main`，不接受本機的 `main`：本機 `main` 可能有沒推上去、沒經過審查的 commit（主控者裁定，比共用介面更嚴）。`uikit.test.mjs` 要求 `source.branch` 是 `origin/main`：用 `--allow-branch` 同步的快照會讓 `pnpm test` 失敗，所以進不了 `tzuchi/main`。

**Files:**
- Modify: `scripts/uikit/scan-options.mjs:47-58`（import 改由沙箱子程序執行）
- Modify: `scripts/uikit/sync-uikit.mjs:1-8`（說明）、`:59-68`（後面加 `REQUIRED_BUILD_OUTPUTS`）、`:185-203`（`parseCli` 匯出並加旗標）、`:205-332`（`syncUikit` 流程）、`:346-354`（結果訊息）
- Test: `scripts/uikit/uikit.test.mjs`

**Interfaces:**
- Consumes：uikit commit 的 `pnpm-lock.yaml`（`importers['packages/tokens'].devDependencies['style-dictionary'].version`，例如 `4.4.0(tslib@2.8.1)`）；`<repo>/node_modules/style-dictionary/package.json`。
- Produces（全部從 `sync-uikit.mjs` 匯出）：
  - `ALLOWED_BRANCHES = ["origin/main"]`；`REQUIRED_BUILD_OUTPUTS = ["packages/tokens/dist/tokens.css"]`
  - `parseCli(argv) → { dir, commit, branch, allowBranch }`，預設 `"../tzuchi-uikit"`、`"origin/main"`、`false`（旗標 `--allow-branch`）
  - `assertBranchAllowed(branch, allowBranch) → void`（不允許時丟 Error，訊息含 `--allow-branch`）
  - `lockedStyleDictionaryVersion(lockText) → string`（去掉 `(…)`；找不到時丟 Error，訊息含 `packages/tokens`）
  - `installedStyleDictionaryVersion(repoRoot) → string`
  - `escapingSymlinks(dir, maxDepth = 4) → string[]`（相對路徑，排序）
  - `hashTree(dir) → Record<string, string>`；`changedFiles(before, after, ignorePrefix = "packages/tokens/dist/") → string[]`
  - `listFiles(dir) → string[]`（匯出；遇到一般檔案和目錄以外的類型就丟錯）
  - `prepareSandbox({ work, repoRoot }) → { readable: string[], writable: string[] }`（建 symlink、掃 `.pnpm` 和整個 `<work>`、回傳 realpath）
  - `runSandboxed(script, { cwd, sandbox, args = [] }) → string`（回傳 stdout；非 0 結束或逾時丟 Error）
  - `scripts/uikit/scan-options.mjs`：`scanUikitOptions(repoRoot)` 簽名不變，內部改成「打包 → `runSandboxed` 印出 JSON → 解析」
  - `SOURCE.json` 新欄位 `styleDictionary`，位置在 `commitDate` 和 `removed` 之間。

- [ ] **Step 1: 寫會失敗的測試**（`uikit.test.mjs`，import 上列名稱）
```js
test("sync:uikit defaults to uikit's origin/main", () => {
  assert.deepEqual(parseCli(["--", "--commit", "abc"]), { dir: "../tzuchi-uikit", commit: "abc", branch: "origin/main", allowBranch: false });
  assert.doesNotThrow(() => assertBranchAllowed("origin/main", false));
  assert.throws(() => assertBranchAllowed("main", false), /--allow-branch/);
  assert.throws(() => assertBranchAllowed("origin/spike/heroui-v3", false), /--allow-branch/);
  assert.doesNotThrow(() => assertBranchAllowed("origin/spike/heroui-v3", true));
});
test("the style-dictionary version comes from the packages/tokens importer", () => {
  const lock = "importers:\n  .:\n    devDependencies:\n      style-dictionary:\n        specifier: 9.0.0\n        version: 9.0.0\n  packages/tokens:\n    devDependencies:\n      style-dictionary:\n        specifier: ^4.3.0\n        version: 4.4.0(tslib@2.8.1)\n\npackages:\n";
  assert.equal(lockedStyleDictionaryVersion(lock), "4.4.0");
  assert.throws(() => lockedStyleDictionaryVersion(lock.replace("  packages/tokens:", "  apps/docs:")), /packages\/tokens/);
});
test("changedFiles ignores the tokens dist only", () => {
  assert.deepEqual(changedFiles({ a: "1", c: "1", "packages/tokens/dist/x": "1" }, { a: "2", d: "1", "packages/tokens/dist/x": "2" }), ["a", "c", "d"]);
});
test("SOURCE.json records the root style-dictionary and a commit on main", () => {
  assert.equal(source.styleDictionary, readJson(join(repoRoot, "package.json")).devDependencies["style-dictionary"]);
  assert.equal(source.styleDictionary, installedStyleDictionaryVersion(repoRoot));
  assert.ok(ALLOWED_BRANCHES.includes(source.branch), source.branch);
  for (const path of REQUIRED_BUILD_OUTPUTS) assert.ok(path in source.files, path);
});
```
另加 `test("sync:uikit runs uikit scripts without access outside the sandbox", …)`，在 `realpathSync(mkdtempSync(join(tmpdir(), "uikit-sandbox-")))` 下建假 repo：
- `.env`（`SECRET=fake`）、`packages/ws/index.js`、`node_modules/ws -> ../packages/ws`（相對 symlink，模擬工作區連結）；
- `node_modules/.pnpm/style-dictionary@0.0.0/node_modules/style-dictionary/{package.json,index.js}`（`export default "sd"`）、同一層的 `dep -> ../../dep@1.0.0/node_modules/dep`；
- `node_modules/style-dictionary -> .pnpm/style-dictionary@0.0.0/node_modules/style-dictionary`；
- `vendor/.sync-uikit-test/tree/packages/tokens/probe.mjs`：import `style-dictionary`；逐一 `readFileSync` 下列路徑並記錄 `error.code`：`<repo>/.env`、`<repo>/node_modules/ws/../../.env`、`<work>/node_modules/style-dictionary/../../../.env`、`<repo>/node_modules/.pnpm/style-dictionary@0.0.0/node_modules/dep/../../../../.env`；`execFileSync("true")`；`writeFileSync("<repo>/pwned")`；Node ≥ 25 時 `net.connect(9, "127.0.0.1")`；`Object.keys(process.env)`；結果寫到 `dist/report.json`。

probe 另外呼叫 `symlinkSync("/", "<work>/x")` 和 `linkSync("<repo>/.env", "<work>/y")`，記錄 `error.code`。

斷言：`report.import === "sd"`；四個讀取、child、write、symlink、link 都是 `"ERR_ACCESS_DENIED"`；`report.env` 是 `[]`；`existsSync("<repo>/pwned") === false`；Node ≥ 25 時 `report.net === "ERR_ACCESS_DENIED"`。再在 `.pnpm` 下加 `escape -> ../../packages/ws`，`assert.deepEqual(escapingSymlinks(<store>), ["escape"])`，`prepareSandbox` 丟出含 `escape` 的 Error。

再加兩個測試：
- `test("listFiles rejects a tracked .DS_Store that is a symlink", …)`：在 mkdtemp 裡建 `packages/tokens/.DS_Store -> <mkdtemp 外的目錄>`，`assert.throws(() => listFiles(dir), /\.DS_Store/)`。
- `test("the uikit-options import runs in the sandbox", …)`：打包一個頂層會 `readFileSync("<repo>/.env")` 的假模組，經由 `runSandboxed` import，斷言 stderr 含 `ERR_ACCESS_DENIED`、丟出 Error。
- [ ] **Step 2: 跑測試，確認失敗**
Run: `node --test scripts/uikit/uikit.test.mjs`
Expected: FAIL，`parseCli` 等名稱不存在（SyntaxError: does not provide an export named 'parseCli'）。
- [ ] **Step 3: 實作**（`sync-uikit.mjs`）
`syncUikit({ dir, commit, branch, allowBranch })` 依序：`assertBranchAllowed` → `rev-parse`、ancestor 檢查（現有）→ `git show <sha>:pnpm-lock.yaml` 取版本，和 `installedStyleDictionaryVersion` 不同就丟 `uikit <sha> builds its tokens with style-dictionary <a>, tceditor has <b>; upgrade the root devDependency first` → archive、`REMOVE_RULES`、`listFiles`（新的類型檢查）、`REQUIRED_FILES`（現有）→ `before = hashTree(tree)` → `prepareSandbox` → `runSandboxed` 跑 `build.mjs` → `changedFiles(before, hashTree(tree))` 非空就丟 `the tokens build changed tracked files: …` → `runSandboxed` 跑 `check.mjs` → 缺 `REQUIRED_BUILD_OUTPUTS` 就丟 → 其後照舊（`scanUikitOptions` 已改成沙箱版）。結果訊息改成 `… (<commitDate>), style-dictionary <v>: <n> files, …`。
- [ ] **Step 4: 跑測試，確認新測試通過**
Run: `node --test scripts/uikit/uikit.test.mjs`
Expected：只剩 `SOURCE.json records the root style-dictionary…` 失敗（`SOURCE.json` 還沒有 `styleDictionary`）。
- [ ] **Step 5: 在權限模式下重新同步並驗證拒絕路徑**
```bash
git -C ../tzuchi-uikit fetch origin
pnpm sync:uikit -- --commit 2b5a6781
git diff --stat vendor packages/blocks/generated
pnpm sync:uikit -- --commit 2b5a6781 --branch origin/spike/heroui-v3; echo "exit $?"
```
Expected：第一次結尾 `… style-dictionary 4.4.0: 390 files, 72 removed; uikit-options.json lists 84 tv functions`，diff 只有 `SOURCE.json` 的 `"branch": "origin/main"` 和新的 `"styleDictionary": "4.4.0"`；第二次印 `sync:uikit failed: … --allow-branch …`、`exit 1`，`git status` 沒有新變更。
- [ ] **Step 6: 全部檢查**
Run: `node --test scripts/uikit/uikit.test.mjs && pnpm exec prettier --check scripts/uikit && pnpm verify`
Expected：node:test 全部 pass；prettier `All matched files use Prettier code style!`；`pnpm verify` 結束碼 0。
- [ ] **Step 7: Commit**
```bash
git add scripts/uikit/sync-uikit.mjs scripts/uikit/uikit.test.mjs vendor/uikit/SOURCE.json
git commit -m "build: sync uikit only from main and build its tokens in a Node permission sandbox" -m "sync:uikit takes commits on uikit's origin/main unless --allow-branch is passed, runs build.mjs and check.mjs with --permission (read: the sandbox and node_modules/.pnpm; write: the sandbox; no child processes, an empty environment), refuses a different style-dictionary version than uikit's lockfile, a build that changes tracked files or misses dist/tokens.css, and records the version in SOURCE.json." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 5: Style Dictionary 升級（uikit，MR2）

目的：把 `packages/tokens` 的 Style Dictionary 從 4.4.0（GHSA-vj5c-m527-mpff，high，4.x 沒有修正版）升到「實作當天已發布滿 14 天、而且 ≥ 5.5.5 的最新 5.x」，釘成精確版本，並證明 `dist/tokens.css` 沒有變（規格 §5.2、R3）。

**執行位置**：uikit，分支 `chore/style-dictionary-5`，在 H1 之後從最新的 `origin/main` 開。

**設計決定**：
- **選版規則**：只看 `x.y.z` 正式版（不含 `-rc`），條件是 `5.5.5 ≤ 版本 < 6`，而且 npm `time` 早於「現在減 14 天」，取其中最大的。依 2026-10-21 查到的發布時間：10-24 之前是 5.6.0，10-24 到 10-29 是 5.6.1（10-10 發布），10-30 起是 5.7.0（10-16 發布）。Task 2 設的 `minimumReleaseAge: 20160` 也會讓 pnpm 拒絕太新的版本，所以這是雙重把關。
- **程式不用改**：`build.mjs:8-14` 用的 `new StyleDictionary`、`cleanAllPlatforms`、`buildAllPlatforms`，以及 `style-dictionary.dark.config.mjs:1,30-35` 用的 `hooks.formats` 和 `formattedVariables`，在 4.4.0 和 5.x 都有，參數也相同。依調查報告，uikit 全部 336 個參照都指向 token，不受 5.0 的破壞性變更影響。只把 `style-dictionary.config.mjs:2` 註解裡的「v4」改成「v5」。
- **`engines`**：Style Dictionary 5 要求 Node `>=22.0.0`，所以 `packages/tokens/package.json` 加上 `"engines": { "node": ">=22.0.0" }`。root 的 `engines` 由 Task 2 依 Astro 的版本設定，不在這裡改。
- **預期的輸出差異**：5.6.x 的 `tokens.css` 位元組完全相同。5.7.x 只有兩行改變：`--tc-motion-duration-fast: 150ms` 變成 `0.15s`，`--tc-motion-duration-base: 200ms` 變成 `0.2s`（來源是 `src/primitive/scale.tokens.json:47-51`；5.7 的 `time/seconds` 也處理 `duration`）。`tokens.js` 和 `tokens.d.ts` 的差異寫進 MR 說明：5.4.0 起型別宣告改用 tuple，屬於格式變化。只要有一個 token 的值改了，就算格式以外的差異。
- **CI 不用改**：`.gitlab-ci.yml:84` 的 `pnpm --filter @tzuchi/tokens test` 和 `:86-87` 的主題同步檢查照舊。

**Files:**
- Modify: `packages/tokens/package.json:20-23`（`devDependencies` 的 `style-dictionary` 改成精確版本；在 `files` 之後加 `engines`）
- Modify: `packages/tokens/style-dictionary.config.mjs:2`（註解）
- Modify: `pnpm-lock.yaml`（`importers['packages/tokens']`，`:430-437`；`style-dictionary@4.4.0` 的 `packages`，`:6985`；`snapshots`，`:15278`）

**Interfaces:**
- Consumes：Task 2 的 `pnpm-workspace.yaml` `minimumReleaseAge: 20160`。
- Produces：精確版本 `V`，寫在 `packages/tokens/package.json` 和 `pnpm-lock.yaml` 的 `importers['packages/tokens'].devDependencies['style-dictionary'].version`。Task 6 的 tceditor 要釘成同一個 `V`，sync 的版本檢查也讀這個欄位。

- [ ] **Step 1: 開分支，記錄升級前的產物**
```bash
git -C ~/Desktop/projects/tzuchi-uikit fetch origin
cd ~/Desktop/projects/tzuchi-uikit && git switch -c chore/style-dictionary-5 origin/main
grep -n "minimumReleaseAge" pnpm-workspace.yaml          # 必須看到 minimumReleaseAge: 20160
pnpm install --frozen-lockfile && pnpm --filter @tzuchi/tokens test
rm -rf "${SCRATCH:?}/sd-baseline" && cp -R packages/tokens/dist "${SCRATCH:?}/sd-baseline"
```
`$SCRATCH` 是執行者這個 session 的 scratchpad 目錄。Expected：`tokens check OK (light + dark)`。

- [ ] **Step 2: 選版本 `V`**
```bash
npm view style-dictionary time --json | node -e '
const t = JSON.parse(require("fs").readFileSync(0, "utf8")), cut = Date.now() - 14 * 864e5;
const n = (v) => v.split(".").map(Number), ge = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
const ok = Object.keys(t).filter((v) => /^5\.\d+\.\d+$/.test(v) && Date.parse(t[v]) <= cut && ge(n(v), [5, 5, 5]) >= 0);
ok.sort((a, b) => ge(n(a), n(b))); console.log(ok.at(-1), t[ok.at(-1)]);'
```
Expected：印出一個版本和它的發布時間，例如 `5.6.1 2026-10-10T11:53:26.988Z`。沒有輸出就停下來回報。

- [ ] **Step 3: 升級**
```bash
pnpm --filter @tzuchi/tokens add -D -E style-dictionary@V
```
接著手動加上 `engines`，並修改 `style-dictionary.config.mjs:2` 的註解。
Expected：`package.json` 寫成 `"style-dictionary": "V"`，沒有 `^`，`pnpm` 沒有出現 minimumReleaseAge 的錯誤。`grep -c "style-dictionary@4" pnpm-lock.yaml` 是 `0`。

- [ ] **Step 4: 建置並比對**
```bash
pnpm --filter @tzuchi/tokens test
cmp "$SCRATCH/sd-baseline/tokens.css" packages/tokens/dist/tokens.css && echo IDENTICAL
diff "$SCRATCH/sd-baseline/tokens.css" packages/tokens/dist/tokens.css
diff "$SCRATCH/sd-baseline/tokens.js" packages/tokens/dist/tokens.js; diff "$SCRATCH/sd-baseline/tokens.d.ts" packages/tokens/dist/tokens.d.ts
pnpm run heroui:theme && git diff --exit-code -- heroui/styles/themes/tzuchi/variables.css
```
Expected：
- 5.6.x：印出 `IDENTICAL`。
- 5.7.x：`diff` 只有 `--tc-motion-duration-fast` 和 `--tc-motion-duration-base` 這兩行，而且是在 `:root` 區塊裡。
- `variables.css` 沒有 diff。
- `tokens.js` 和 `tokens.d.ts` 的差異只有格式，沒有任何值改變。

出現其他差異就停下來，不 commit，把 diff 回報給主控者。

- [ ] **Step 5: Commit、推分支、開 MR2，到檢查點 H2**
```bash
git add packages/tokens/package.json packages/tokens/style-dictionary.config.mjs pnpm-lock.yaml
git commit -m "build(tokens): upgrade style-dictionary to V

4.4.0 is affected by GHSA-vj5c-m527-mpff (high) and has no 4.x fix; 5.5.5
completes the fix (GHSA-5pgh-4v89-hfqj, GHSA-cr3w-v879-f973). V was released
more than 14 days ago. dist/tokens.css is byte-identical
<或：differs only in the two motion durations, 150ms -> 0.15s and 200ms -> 0.2s>.
Style Dictionary 5 needs Node 22.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push -u origin chore/style-dictionary-5 -o merge_request.create -o merge_request.target=main -o merge_request.title="build(tokens): upgrade Style Dictionary to V"
```
在 MR 說明用白話寫三件事：為什麼升級（資安）、畫面完全不會變（或者只有兩個動畫時間換了寫法，效果等價）、`tokens.js`／`tokens.d.ts` 的差異摘要。**停在這裡**，回報 MR 網址，以及 `V` 和 Step 4 的比對結果（Task 6 要用），等使用者說已合併（H2）。

### Task 6: Style Dictionary 跟版、14 天規則、CSS 遠端網址測試、同步（§14 第 4 步）

目的：root 的 `style-dictionary` 跟 uikit MR2 用同一個精確版本，tceditor 也加 14 天規則，`packages/blocks` 新增 CSS 遠端網址測試，然後同步到 MR2 合併後的 commit，並在 SD 5 下重測權限模式。

**執行位置**：`/Users/kaellim/Desktop/projects/puck`，分支 `ci-tokens/1a`。前提：Task 4 完成、MR2（Task 5）已合併。

**設計決定**：
- 版本以 uikit `origin/main` 的 lockfile 為準（和 sync 的檢查同一個來源），記為 `V`；R3 要求 ≥ 5.5.5。
- `minimumReleaseAge: 20160` 先加、再裝 SD，讓這次安裝就受規則管（pnpm 10.26.1 支援，v10.16 起）。
- `ignoredBuiltDependencies` 的 `style-dictionary` 和 `@bundled-es-modules/glob`（`pnpm-workspace.yaml:31-35`）先拿掉：SD 5 把 `patch-package` 從 `postinstall` 移到 `prepare`，pnpm 不跑依賴的 `prepare`。若 `pnpm install` 仍列出 `Ignored build scripts: …style-dictionary…`，就把該項放回，註解改寫成實際原因。
- CSS 遠端網址測試放在 `packages/blocks`：它的 turbo inputs 已含 `vendor/uikit/**`（`turbo.json:50-58`），放在 core 會在同步後重播舊快取。regex 照抄 `packages/core/__tests__/css-imports.spec.ts:29`。目前 168 個 CSS 檔（vendor 166、blocks 2）都沒有遠端參照，所以測試另外斷言 regex 會抓到四種寫法、而且真的掃到了 `tokens.css`，避免空跑。
- 同步的停止條件：`dist/tokens.css` 用 5.6.x 必須不變；用 5.7.x 只能有 `--tc-motion-duration-fast`、`--tc-motion-duration-base` 兩行（`150ms` → `0.15s`、`200ms` → `0.2s`）。`tokens.js`、`tokens.d.ts` 的差異可以接受（tceditor 只 import `tokens.css`，`packages/blocks/styles.css:4`），但要在 commit 訊息寫出來。

**Files:**
- Modify: `pnpm-workspace.yaml:9`（後面加 `minimumReleaseAge`）、`:31-35`
- Modify: `package.json:31`、`pnpm-lock.yaml`
- Modify: `CLAUDE.md:249`（Dependencies 一節）
- Create: `packages/blocks/src/__tests__/css-remote-urls.spec.ts`
- Regenerated: `vendor/uikit/**`、`packages/blocks/generated/uikit-options.json`

**Interfaces:**
- Consumes：uikit `origin/main` 的 `pnpm-lock.yaml`；Task 4 的 sync。
- Produces：root `devDependencies["style-dictionary"] = V`（精確）；`SOURCE.json` 的 `"styleDictionary": V`。

- [ ] **Step 1: 寫 CSS 遠端網址測試**
```ts
/** @jest-environment node */
// Same pattern as packages/core/__tests__/css-imports.spec.ts: these files reach the public page
const remoteReference = /(?:url\(\s*|@import\s+)["']?(?:https?:)?\/\//i;
it("recognises remote references", () => {
  for (const css of ['@import "https://x/a.css";', "@import url(//x/a.css);", 'a{background:url("https://x/a.png")}', "a{background:url( //x/a.png)}"]) expect(remoteReference.test(css)).toBe(true);
  for (const css of ['@import "./a.css";', "a{background:url(data:image/png;base64,AA==)}", "/* see https://x */"]) expect(remoteReference.test(css)).toBe(false);
});
it("vendor/uikit and the blocks' CSS reference no remote URL", () => {
  const files = [...collectCss(join(repoRoot, "vendor/uikit")), ...collectCss(packageRoot)]; // skips node_modules, dist outside vendor
  expect(files).toContain(join(repoRoot, "vendor/uikit/packages/tokens/dist/tokens.css"));
  expect(files.filter((file) => remoteReference.test(readFileSync(file, "utf8")))).toEqual([]);
});
```
`collectCss(dir)` 跳過名為 `node_modules` 的目錄；`packageRoot` 底下另外跳過 `dist`；vendor 底下不跳 `dist`（tokens 的 `dist/` 是快照的一部分）。
- [ ] **Step 2: 跑測試**
Run: `pnpm turbo run test --filter=@tzuchi/tceditor-blocks -- src/__tests__/css-remote-urls.spec.ts`
Expected：2 passed。暫時把第一個陣列加入 `"a{}"`，確認 `recognises remote references` 失敗，再改回。
- [ ] **Step 3: 14 天規則與升級**
`pnpm-workspace.yaml` 在 `autoInstallPeers` 後加：
```yaml
# Supply-chain mitigation: resolve only versions published at least 14 days
# (20,160 minutes) ago, transitive ones included, as the uikit repo does. It
# applies when pnpm writes the lockfile; --frozen-lockfile installs never re-check.
minimumReleaseAge: 20160
```
```bash
git -C ../tzuchi-uikit fetch origin
V=$(git -C ../tzuchi-uikit show origin/main:pnpm-lock.yaml | awk '/^  packages\/tokens:/{f=1} f&&/^      style-dictionary:/{g=1} g&&/version:/{sub(/\(.*/,"",$2);print $2;exit}')
echo "$V"   # 5.6.0 以上
[[ "$V" =~ ^5\.[0-9]+\.[0-9]+$ ]] || { echo "unexpected style-dictionary version: $V"; exit 1; }   # 也必須等於 Task 5 回報的 V
pnpm add -D -w --save-exact "style-dictionary@$V"
```
再刪掉 `pnpm-workspace.yaml:31-35` 那兩項及其註解，跑 `pnpm install`。
Expected：`package.json:31` 是 `"style-dictionary": "<V>"`；`pnpm ls style-dictionary --depth 0` 顯示 `<V>`；install 輸出沒有 `Ignored build scripts`。
- [ ] **Step 4: 同步到 MR2 的 commit（SD 5 下重測權限模式）**
```bash
M2=$(git -C ../tzuchi-uikit rev-parse origin/main)
pnpm sync:uikit -- --commit "$M2"
git diff --stat vendor packages/blocks/generated && git diff vendor/uikit/packages/tokens/dist/tokens.css
```
Expected：
- sync 在權限模式下結束碼 0（`.pnpm` 掃描沒有逃出的 symlink），結尾含 `style-dictionary <V>`；
- `tokens.css` 依設計決定的停止條件；
- 其餘 diff 只在這些地方：
  - `SOURCE.json`；
  - `heroui/NOTICE.md`、`heroui/styles/package.json`、`packages/tokens/package.json`（MR1 的 private 設定與 MR2 的升級）；
  - `packages/tokens/style-dictionary.config.mjs`（Task 5 的註解 v4 → v5）；
  - `tokens.js`、`tokens.d.ts`；
  - `packages/blocks/generated/uikit-options.json`，只有 `source.commit` 改變。
- 超出就停下來回報。

接著照 Global Constraints 執行 `git diff --stat -- vendor/uikit/heroui/styles/src`，預期沒有輸出。
- [ ] **Step 5: 文件**
`CLAUDE.md:249` 的 Dependencies 一節，在 `New dependencies use exact versions` 之前加：`pnpm-workspace.yaml` sets `minimumReleaseAge: 20160`, as the uikit repo does: pnpm resolves only versions published at least 14 days ago, transitive ones included. It applies when the lockfile is written, so review lockfile diffs; a security fix younger than that goes into `minimumReleaseAgeExclude` as an exact version with its GHSA id in a comment.
- [ ] **Step 6: 全部檢查**
Run: `node --test scripts/uikit/uikit.test.mjs && pnpm verify`
Expected：全部 pass；`audit:gate` 不再列出 `style-dictionary@4.4.0 GHSA-vj5c-m527-mpff`。
- [ ] **Step 7: Commit**（兩個 commit）
```bash
git add packages/blocks/src/__tests__/css-remote-urls.spec.ts
git commit -m "test(blocks): reject remote URLs in the vendored uikit CSS and the blocks' CSS" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git add pnpm-workspace.yaml package.json pnpm-lock.yaml CLAUDE.md vendor/uikit packages/blocks/generated/uikit-options.json
git commit -m "build: upgrade style-dictionary to <V> with uikit and resolve only 14-day-old versions" -m "Fixes GHSA-vj5c-m527-mpff (4.4.0). vendor/uikit is synced to uikit <M2 短 sha> in the permission sandbox; <寫出 tokens.css／tokens.js／tokens.d.ts 的實際差異>." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 7: token 清單與 `check.mjs`（uikit，MR3 之一）

目的：`build.mjs` 產生 `dist/tokens.list.json`。每個 CSS 變數一筆，列出它在亮色和深色模式下宣告的內容、解出來的值和參照鏈。`check.mjs` 加上規格 §5.2 的前三項斷言。另外用一個獨立的 CSS 解析器做測試，逐筆比對清單和 `tokens.css`（規格 §5.2）。

**執行位置**：uikit，分支 `feat/tokens-list`，在 H2 之後從最新的 `origin/main` 開。Task 8 接著在同一條分支上做。

**設計決定**：
- **清單的值以 `tokens.css` 實際輸出的內容為準，不是 JSON 的參照。** 每筆的 `css` 由 `createPropertyFormatter`（`style-dictionary/utils`，4.4.0 和 5.x 都有）產生，參數和 `css/variables` 相同：`format: 'css'`、`usesDtcg: true`、同一個 `outputReferences`、`formatting: { commentStyle: 'none' }`。這樣它和 `tokens.css` 的宣告一定一致。
  - 鏈只跟著「整個值就是 `var(--tc-…)`」的宣告往下追。`tokens.css` 的 273 個 `var()` 現在都屬於這種。
  - shadow 和 typography 關掉了 `outputReferences`（`style-dictionary.config.mjs:29`），所以 `modal.shadow` 在 JSON 裡是 `{elevation.4}`，CSS 卻是攤平的亮色值。清單照 CSS 記錄：深色值仍然是亮色值、鏈是空的。這正是 1b 別名輸出要修的問題，Task 13 改了之後，清單會自動跟著變。
- **共用 `outputReferences`**：把兩個設定裡的這個述詞（`style-dictionary.config.mjs:29`、`style-dictionary.dark.config.mjs:20`）搬到新檔 `lib/output-references.mjs`，兩個設定和 `token-list.mjs` 都 import 它。規格 §5.2 已經把 1b 的別名輸出放在這個檔名，Task 13 直接改這個函式即可。
- **深色的解析方式**：宣告表的規則是「深色模式下，有深色覆寫的變數用深色宣告，其餘用亮色宣告」，然後沿著 `var()` 往下追。演算法見 Step 3。深色覆寫的判斷和 `style-dictionary.dark.config.mjs:24-26` 相同：`filePath` 換成 `/` 之後包含 `/themes/dark/`。
- **其他欄位**：
  - `id` 是 `path.join('.')`，`cssVar` 是 `--` 加上 `token.name`；
  - `source` 是 `filePath` 相對 `packages/tokens` 的 posix 路徑；
  - `layer` 取 `source` 裡 `src/` 的下一段（primitive、semantic 或 component），其他值一律丟錯誤；
  - `description` 是 `$description`，沒有就是 `null`；
  - `deprecated` 在 1a 一律是 `null`（Task 13 才填）。
- **位元組固定**：依 `id` 排序時用 code unit 比較（`a < b`），不用 `localeCompare`，結果才不會隨系統語系改變。每筆的鍵依 TokenEntry 定義的順序建立，不放時間戳。
- **以下情況直接丟錯誤，build 失敗**：兩個 token 的 `cssVar` 相同；深色覆寫的 `id` 在亮色裡不存在；`var()` 指向不存在的變數；參照形成循環；值裡有 `var(` 但不是單一的 `var()`。
- **測試裁定**：規格 §5.2 第 4 項要用清單比對 `variables.css`。但 `generate.mjs` 一被 import 就會寫檔（`generate.mjs:159, 257`），測試裡沒辦法呼叫它。所以改用測試自己的迷你解析器：直接讀 `dist/tokens.css` 的第一個 `:root {` 區塊和 `[data-theme="dark"] {` 區塊，沿 `var()` 解出每個變數的亮暗值，再和清單逐筆比對。`variables.css` 本身由 CI 現有的 `git diff --exit-code`（`.gitlab-ci.yml:86-87`）把關。
- **`test` script 改用 glob**：介面原本寫的是 `node --test test/`，但在 Node 26.7.0 實測，`node --test test/` 會把目錄當成模組載入，結果 `Cannot find module …/test`。所以改成 `node --test "test/*.test.mjs"`。加引號是讓 Node 自己展開 glob，Windows 也能用；`test/fixtures/` 和 `test/helpers/` 不會被當成測試執行。

**Files:**
- Create: `packages/tokens/lib/output-references.mjs`、`packages/tokens/lib/token-list.mjs`
- Create: `packages/tokens/test/token-list.test.mjs`、`packages/tokens/test/helpers/css-tokens.mjs`
- Create: `packages/tokens/test/fixtures/list/src/primitive/color.tokens.json`、`…/primitive/elevation.tokens.json`、`…/semantic/color.tokens.json`、`…/component/button.tokens.json`、`…/themes/dark/color.tokens.json`、`packages/tokens/test/fixtures/list/orphan/themes/dark/ghost.tokens.json`
- Modify: `packages/tokens/build.mjs:1-4`（import）、`:20` 之後（寫清單）
- Modify: `packages/tokens/check.mjs:88` 之後（三項斷言）
- Modify: `packages/tokens/style-dictionary.config.mjs:29`、`packages/tokens/style-dictionary.dark.config.mjs:20`（改成 import 共用的述詞）
- Modify: `packages/tokens/package.json` 的 `exports` 和 `scripts.test` 兩個鍵（Task 2、5 已讓行號移動，用鍵定位）
- Modify: `.prettierignore`（加 `packages/tokens/test/fixtures/**`，夾具要保持原樣）

**Interfaces:**
- Produces：
  - `outputReferences(token) → boolean`（`lib/output-references.mjs`）：目前的內容是 `token.$type !== 'typography' && token.$type !== 'shadow'`。
  - `createTokenList({ light, dark, pkg }) → TokenList`；`stringifyTokenList(list) → string`（`lib/token-list.mjs`）。形狀照共用介面的 TokenList、TokenEntry 和 ModeValue。
  - `dist/tokens.list.json`；`package.json` 的 `exports["./tokens.list.json"]` 指向 `"./dist/tokens.list.json"`。
  - 測試輔助（`test/helpers/css-tokens.mjs`）：
    - `parseTokensCss(css) → { light: Map<cssVar, string>, dark: Map<cssVar, string> }`，去掉行尾的 `/** … */`；
    - `resolveCss(light, dark | null, cssVar) → { value, css, chain: cssVar[] }`。

- [ ] **Step 1: 寫會失敗的測試**（`test/token-list.test.mjs`）
```js
const sd = async (src) => new StyleDictionary({ source: src, log: { verbosity: 'silent' },
  platforms: { css: { transformGroup: 'css', prefix: 'tc' } } }).getPlatformTokens('css');
const F = 'test/fixtures/list', pkg = { name: 'x', version: '0.0.0' };
const LIGHT = ['primitive', 'semantic', 'component'].map((l) => `${F}/src/${l}/*.tokens.json`);
const DARK = [`${F}/src/primitive/*.tokens.json`, `${F}/src/themes/dark/*.tokens.json`];
test('dark values follow overrides through component aliases', async () => {
  const list = createTokenList({ light: await sd(LIGHT), dark: await sd(DARK), pkg });
  assert.deepEqual(Object.keys(list), ['schemaVersion', 'prefix', 'package', 'tokens']);
  assert.equal(list.schemaVersion, 1); assert.equal(list.prefix, 'tc'); assert.deepEqual(list.package, pkg);
  assert.deepEqual(list.tokens.map((t) => t.id), ['button.bg', 'button.shadow', 'color.blue.300', 'color.blue.900', 'color.brand.primary', 'color.brand.surface', 'elevation.1']);
  assert.deepEqual(Object.keys(list.tokens[0]), ['id', 'cssVar', 'type', 'layer', 'hasDarkOverride', 'source', 'description', 'light', 'dark', 'deprecated']);
  assert.equal(list.tokens[5].description, '右括號 } 和 "引號"');
  const bg = list.tokens[0];
  assert.deepEqual(bg.light, { value: '#1b2d58', css: 'var(--tc-color-brand-primary)', chain: ['color.brand.primary', 'color.blue.900'] });
  assert.deepEqual(bg.dark, { value: '#a9c2ea', css: 'var(--tc-color-brand-primary)', chain: ['color.brand.primary', 'color.blue.300'] });
  assert.equal(bg.hasDarkOverride, false); assert.equal(bg.layer, 'component');
  assert.equal(list.tokens[1].dark.css, list.tokens[1].light.css); assert.deepEqual(list.tokens[1].dark.chain, []);
  const brand = list.tokens[4];
  assert.equal(brand.hasDarkOverride, true); assert.equal(brand.description, '主色');
  assert.equal(brand.source, 'test/fixtures/list/src/semantic/color.tokens.json'); assert.equal(brand.deprecated, null);
  assert.equal(stringifyTokenList(list), JSON.stringify(list, null, 2) + '\n');
});
test('a dark override of an unknown token throws', async () => {
  const light = await sd(LIGHT), dark = await sd([...DARK, `${F}/orphan/themes/dark/*.tokens.json`]);
  assert.throws(() => createTokenList({ light, dark, pkg }), /color\.ghost/);
});
test('tokens.list.json matches every declaration of dist/tokens.css', () => {
  const { light, dark } = parseTokensCss(readFileSync(new URL('../dist/tokens.css', import.meta.url), 'utf8'));
  const list = JSON.parse(readFileSync(new URL('../dist/tokens.list.json', import.meta.url), 'utf8'));
  const idOf = new Map(list.tokens.map((t) => [t.cssVar, t.id]));
  assert.equal(list.tokens.length, light.size);
  for (const t of list.tokens) for (const [mode, d] of [['light', null], ['dark', dark]]) {
    const r = resolveCss(light, d, t.cssVar);
    assert.deepEqual(t[mode], { value: r.value, css: r.css, chain: r.chain.map((v) => idOf.get(v)) }, `${t.cssVar} ${mode}`);
  }
  const by = (v) => list.tokens.find((t) => t.cssVar === v);
  assert.deepEqual(by('--tc-color-brand-primary').dark, { value: '#a9c2ea', css: 'var(--tc-color-blue-300)', chain: ['color.blue.300'] });
  assert.deepEqual(by('--tc-tooltip-bg').dark.chain, ['color.text.default', 'color.gray.100']);
  assert.equal(by('--tc-modal-shadow').dark.value, '0px 12px 28px 0px #00000029'); // CSS 攤平，1b 前只有亮色
  assert.equal(list.tokens.filter((t) => t.hasDarkOverride).length, dark.size);
});
```
夾具內容：
- primitive：`color.blue.900` 是 `#1B2D58`，`color.blue.300` 是 `#A9C2EA`；`elevation.1` 的 `$type` 是 shadow，物件值；
- semantic：`color.brand.primary` 是 `{color.blue.900}`，`$description` 是「主色」；`color.brand.surface` 是 `{color.blue.300}`，`$description` 是 `右括號 } 和 "引號"`（Review Focus 3：說明含 `}` 和引號，清單與 `check.mjs` 的區塊切割都不能出錯）；
- component：`button.bg` 是 `{color.brand.primary}`；`button.shadow` 的 `$type` 是 shadow，值是 `{elevation.1}`；
- themes/dark：`color.brand.primary` 是 `{color.blue.300}`；
- orphan：`color.ghost` 是 `{color.blue.300}`。

- [ ] **Step 2: 跑測試，確認失敗**
Run: `cd packages/tokens && node --test "test/*.test.mjs"`
Expected: FAIL，`Cannot find module '…/lib/token-list.mjs'`。

- [ ] **Step 3: 實作 `createTokenList` 和 `stringifyTokenList`（`lib/token-list.mjs`），以及測試輔助**
- `decl(mode, v)`：如果 `mode === 'dark'` 而且深色宣告表有 `v`，用深色宣告；否則用亮色宣告。
- 兩張宣告表都把 `createPropertyFormatter({ outputReferences, dictionary: <該模式的 dictionary>, format: 'css', usesDtcg: true, formatting: { commentStyle: 'none' } })(token)` 的輸出，用 `/^\s*(--[\w-]+):\s*(.*);\s*$/` 拆開。深色表只收深色覆寫的 token。
```
resolve(cssVar, mode): css = decl(mode, cssVar); cur = css; chain = []; seen = {cssVar}
  while cur 整個符合 /^var\((--tc-[\w-]+)\)$/ → ref：
    ref 在 seen 裡 → 丟出循環錯誤；ref 不在亮色表 → 丟出「參照不存在」
    chain.push(idOf(ref)); seen.add(ref); cur = decl(mode, ref)
  cur 裡還有 'var(' → 丟出「不支援部分參照」
  return { value: cur, css, chain }
```
- `test/helpers/css-tokens.mjs` 用同樣的追法，只是輸入改成 `parseTokensCss` 解出來的兩張表。`chain` 回傳 cssVar，不轉成 id。

- [ ] **Step 4: 接進 build、check 和 package.json**
- `build.mjs`：在 `:20` 之後讀 `package.json` 的 `name` 和 `version`，呼叫 `createTokenList({ light: await base.getPlatformTokens('css'), dark: await dark.getPlatformTokens('css'), pkg })`，用 `stringifyTokenList` 寫到 `dist/tokens.list.json`。
- 兩個設定改成 `import { outputReferences } from './lib/output-references.mjs'`。
- `check.mjs` 在 `:88` 之後加三項斷言，失敗時都呼叫既有的 `fail()`：
  1. `list.tokens.length` 等於第一個 `:root {` 區塊裡 `/^\s*--tc-[\w-]+\s*:/gm` 的數目（2b5a6781 是 398）；
  2. 每個 `cssVar` 在 `:root` 區塊裡都有 `${cssVar}:` 的宣告；
  3. `hasDarkOverride` 的集合等於 `[data-theme="dark"] {` 區塊宣告的變數集合（目前是 22 個）。這裡做成雙向比對：深色區塊多出一個沒標記的變數，也算失敗。
  - 切區塊之前先把 `/* … */`、`/** … */` 註解換成空白：`$description` 會變成行尾註解，裡面的 `}` 會讓「找第一個 `}`」的切法提早結束（`heroui/NOTICE.md:208-209` 記過 `generate.mjs` 有同樣的弱點）。
- `package.json`：在 `exports` 加 `"./tokens.list.json": "./dist/tokens.list.json"`；`"test"` 改成 `node build.mjs && node check.mjs && node --test \"test/*.test.mjs\"`。

- [ ] **Step 5: 跑測試，確認通過**
Run: `pnpm exec prettier --write packages/tokens .prettierignore && pnpm --filter @tzuchi/tokens test && node -e 'const l=require("./packages/tokens/dist/tokens.list.json");console.log(l.tokens.length)' && pnpm run heroui:theme && git diff --exit-code -- heroui/styles/themes/tzuchi/variables.css && pnpm lint`
Expected：
- `tokens check OK (light + dark)`，`node --test` 顯示 `fail 0`；
- 清單筆數印出 `398`；
- `variables.css` 沒有 diff，`pnpm lint` 通過。

再跑一次 build，用 `cmp` 比對兩次的 `dist/tokens.list.json`，結果必須相同。

- [ ] **Step 6: Commit**
```bash
git add packages/tokens/lib/output-references.mjs packages/tokens/lib/token-list.mjs packages/tokens/build.mjs packages/tokens/check.mjs packages/tokens/style-dictionary.config.mjs packages/tokens/style-dictionary.dark.config.mjs packages/tokens/package.json packages/tokens/test .prettierignore
git commit -m "feat(tokens): emit dist/tokens.list.json with light and dark values

Each entry records what tokens.css declares in light and dark mode and the
var() chain it resolves through. check.mjs asserts the list matches
tokens.css. node --test runs test/*.test.mjs as a glob: Node 26 does not
accept a directory.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 8: `naming-rules.json` 與 `lint-tokens` 規則 7（uikit，MR3 之二）

目的：新增 `lint-tokens.mjs`，在 1a 先做規則 7（使用端掃描）。主題 CSS 的 `var(--tc-*)`，以及 `generate.mjs` 字串裡的 `--tc-*`，都必須是清單裡存在的變數；用到已棄用的名稱只算警告；`noVar` 列的檔案不可出現 `var(--tc-`（規格 §5.2、§3.1 C2、C3）。做完後推 MR3。

**執行位置**：uikit，分支 `feat/tokens-list`，接在 Task 7 之後。

**設計決定**：
- **名稱的來源是 `dist/tokens.list.json`**，不重新跑 Style Dictionary。`lint-tokens.mjs` 讀 `<root>/packages/tokens/dist/tokens.list.json`，檔案不在就印 `rule 7 error packages/tokens/dist/tokens.list.json 找不到清單，先執行 node build.mjs`，然後 exit 1。所以 `lint` script 執行前要先 build；Task 11 的 CI 也要先 build 再 lint。
- **掃描的方式（`lib/lint/scan.mjs`）**：
  - `varRefs`（CSS）：先把 `/* … */` 換成等長的空白，保留換行，行號才不會跑掉；再找 `/var\(\s*(--tc-[A-Za-z0-9_-]+)/g`。
  - `bareNames`（JS）：用一個狀態機找出字串字面值 `'…'`、`"…"`、`` `…` ``，略過 `//` 和 `/* */` 註解。`${…}` 用堆疊處理，所以樣板字串裡的巢狀樣板也掃得到。字串內容裡用 `/--tc-[A-Za-z0-9_-]*[A-Za-z0-9_]/g` 找名稱。
    - 不辨識正規表示式字面值。`generate.mjs:167, 181` 的兩個正規表示式不含引號或註解符號，掃描不受影響，正規表示式裡的 `--tc-[` 也不算名稱。
    - 註解裡的撇號（例如 `generate.mjs:67` 的 `tc-input's`）會在註解狀態下被略過。
  - `noVar`：找原始文字裡的 `var(--tc-`，只略過 `/* … */` 和 `<!-- … -->`（包括 MDX 的 `{/* */}`）。程式碼區塊不算註解，這點和 Task 10 的假設一致。
- **glob**：用 `fs.globSync(pattern, { cwd: root })`。Node 22.17 起是穩定 API；Node 24 和 26 都有。路徑換成 `/` 之後排序。任何一個 pattern 沒有對到檔案就算錯誤，這樣檔案搬走時，檢查不會悄悄失效。
- **1a 的 `naming-rules.json`**：
  ```json
  { "version": 1, "exceptions": ["--tc-breadcrumb-item-gap"],
    "consumers": { "varRefs": ["heroui/styles/themes/tzuchi/**/*.css"],
                   "bareNames": ["heroui/styles/themes/tzuchi/generate.mjs"], "noVar": [] } }
  ```
  - `noVar` 先留空：`apps/docs/src` 目前有 12 處 `var(--tc-`，分布在 6 個檔案，放進來規則 7 就會失敗。Task 10 改寫手冊時才加 `"apps/docs/src/**"`。
  - `--tc-breadcrumb-item-gap` 是 Lit 元件的公開屬性，目前只出現在 `components/breadcrumbs.css:70-71` 的註解裡。依指示保留，也當作 exceptions 的範例。
  - `loadNamingRules` 拒絕未知的鍵，避免拼錯鍵名讓檢查失效。Task 14 要把 `segment`、`layers`、`deprecated` 加進允許的鍵。
- **目前 repo 的結果（唯讀推估）**：
  - 主題 CSS 去掉註解後，`var()` 讀到 103 個不同的名稱；`generate.mjs` 的字串裡有 28 個名稱。
  - 這兩組都在 2b5a6781 的 `tokens.css` 的 398 個變數裡（拿 tceditor `vendor/uikit/packages/tokens/dist/tokens.css` 比對）。
  - 不是 token 的 `--tc-*`（例如 `--tc-breadcrumb-item-gap`、`--tc-color-*`）都只出現在註解裡。
  - 預期 0 個錯誤、0 個警告，exit 0。
- **只掃 1a 範圍**：`packages/components`（Lit，已凍結）、`apps/storybook`、`apps/demo-html` 不掃。`check.mjs` 也不放進 `bareNames`：它的字串裡有 `'var(--tc-color-'`（`check.mjs:60`），會被誤報。而且它寫死的名稱一旦不存在，build 本身就會失敗。

**Files:**
- Create: `packages/tokens/naming-rules.json`、`packages/tokens/lint-tokens.mjs`
- Create: `packages/tokens/lib/lint/rules-file.mjs`、`lib/lint/scan.mjs`、`lib/lint/consumers.mjs`、`lib/lint/report.mjs`
- Create: `packages/tokens/test/lint-scan.test.mjs`、`test/lint-consumers.test.mjs`、`test/lint-cli.test.mjs`
- Create: `packages/tokens/test/fixtures/consumers/theme/ok.css`、`theme/bad.css`、`gen.mjs`、`docs/page.mdx`
- Modify: `packages/tokens/package.json:15-19`（加 `"lint": "node lint-tokens.mjs"`）
- Modify: `eslint.config.js:6-17`（`ignores` 加 `'packages/tokens/test/fixtures/**'`）

**Interfaces:**
- Consumes：Task 7 的 `dist/tokens.list.json`（`cssVar`、`id`、`deprecated.replacedBy`）。
- Produces：
  - `loadNamingRules(root) → NamingRules`（`rules-file.mjs`）；
  - `stripComments(text, kinds) → string`，`kinds` 是 `'css'` 或 `'markup'`，換掉的部分保留換行；
  - `scanJsStrings(source) → Array<{ start, end }>`；
  - `lineOf(text, offset) → number`（`scan.mjs`）；
  - `checkConsumers({ root, rules, list }) → Issue[]`（`consumers.mjs`）；
  - `formatIssue(issue) → string`、`exitCodeFor(issues) → 0 | 1 | 3`（`report.mjs`）。輸出格式是 `rule <N> <severity> <file>[:<line>] <message>`，沒有 `file` 時印 `-`。
  - CLI 照共用介面：`--base` 在 1a 只接受、不使用；未知參數印用法，exit 1。最後一行印 `lint-tokens：<n> 個錯誤、<m> 個警告`。

- [ ] **Step 1: 寫會失敗的測試**
```js
// lint-consumers.test.mjs：root = test/fixtures/consumers，list 寫在測試裡：
// --tc-a（正常）、--tc-old（deprecated: { message: '改用 a', replacedBy: 'a', since: '2026-11-15' }）
const rules = (c) => ({ version: 1, exceptions: ['--tc-ext'], consumers: { varRefs: [], bareNames: [], noVar: [], ...c } });
test('ok.css: comments, exceptions and existing names pass', () =>
  assert.deepEqual(checkConsumers({ root, list, rules: rules({ varRefs: ['theme/ok.css'] }) }), []));
test('bad.css: missing is an error, deprecated a warning', () => {
  const r = checkConsumers({ root, list, rules: rules({ varRefs: ['theme/bad.css'] }) });
  assert.deepEqual(r.map((i) => [i.rule, i.severity, i.file, i.line]), [[7, 'error', 'theme/bad.css', 3], [7, 'warning', 'theme/bad.css', 5]]);
  assert.match(r[0].message, /--tc-missing-name/); assert.match(r[1].message, /改用 --tc-a/);
});
test('gen.mjs: only names inside strings, including nested templates', () =>
  assert.deepEqual(checkConsumers({ root, list, rules: rules({ bareNames: ['gen.mjs'] }) }).map((i) => i.line), [6, 8]));
test('noVar: var(--tc- outside comments is an error', () =>
  assert.deepEqual(checkConsumers({ root, list, rules: rules({ noVar: ['docs/**'] }) }).map((i) => [i.file, i.line]), [['docs/page.mdx', 2]]));
test('a pattern that matches no file is an error', () =>
  assert.match(checkConsumers({ root, list, rules: rules({ varRefs: ['nope/**/*.css'] }) })[0].message, /nope\/\*\*\/\*\.css/));
const warn7 = { rule: 7, severity: 'warning', message: 'w' }, err7 = { rule: 7, severity: 'error', message: 'e' };
test('exitCodeFor', () => { assert.equal(exitCodeFor([]), 0); assert.equal(exitCodeFor([warn7]), 3); assert.equal(exitCodeFor([warn7, err7]), 1); });
// lint-cli.test.mjs：mkdtempSync(join(tmpdir(), 'lint-')) 裡寫 packages/tokens/naming-rules.json、
// packages/tokens/dist/tokens.list.json、theme/x.css，再 spawnSync(process.execPath, [LINT, '--root', dir])
//   x.css = 'a { color: var(--tc-a); }\n'          → status 0
//   x.css = 'a { color: var(--tc-old); }\n'        → status 3，stdout 包含 'rule 7 warning theme/x.css:1 '
//   x.css = 'a {}\nb { color: var(--tc-nope); }\n' → status 1，stdout 包含 'rule 7 error theme/x.css:2 '
//   沒有 dist/tokens.list.json                     → status 1
// lint-scan.test.mjs：stripComments 保留換行（多行註解之後的 lineOf 不變）；
//   scanJsStrings 能處理跳脫的引號 "a\"b"，以及 `${`x${'y'}`}` 的巢狀樣板
```
夾具內容（行號要和斷言對上）：
- `theme/ok.css`：第 1 行 `/* var(--tc-missing)\n` 跨到第 2 行才結束；之後是 `var(--tc-a)` 和 `var(--tc-ext)`。
- `theme/bad.css`：第 3 行 `var(--tc-missing-name)`，第 5 行 `var(--tc-old)`。
- `gen.mjs`：
  - 第 1 行 `// it's --tc-in-line-comment`；
  - 第 2 行 `/* "--tc-in-block-comment" */`；
  - 第 3 行 `const re = /(--tc-[\w-]+):/g;`；
  - 第 5 行 `'--tc-a'`；
  - 第 6 行 `"var(--tc-missing-in-string)"`；
  - 第 8 行是巢狀樣板，裡面有 `var(--tc-nested-missing)`。
- `docs/page.mdx`：第 1 行 `{/* var(--tc-a) */}`，第 2 行 `` `var(--tc-a)` ``。

- [ ] **Step 2: 跑測試，確認失敗**
Run: `cd packages/tokens && node --test "test/lint-*.test.mjs"`
Expected: FAIL，`Cannot find module '…/lib/lint/consumers.mjs'`。

- [ ] **Step 3: 實作 `lib/lint/*.mjs` 和 `lint-tokens.mjs`，寫 `naming-rules.json`**
- `checkConsumers` 依 `varRefs`、`bareNames`、`noVar` 的順序跑，每組裡的檔案依路徑排序。
  - 名稱在 `exceptions` 裡就略過。
  - 名稱不在清單裡：error，訊息是 `<name> 不是 token（tokens.list.json 沒有這個變數）；不是 token 的名稱要列進 naming-rules.json 的 exceptions`。
  - 名稱的 `deprecated` 不是 `null`：warning，訊息是 `<name> 已棄用，改用 <replacedBy 對到的 cssVar>`。
  - `noVar` 命中：error，訊息是 `手冊不載入 tokens.css，不可寫 var(--tc-…)；改讀 tokens.list.json`。
- `exitCodeFor`：只要有 error 就回傳 1；沒有 error 但有規則 7 的 warning，回傳 3；其他回傳 0。
- `lint-tokens.mjs`：`--root` 預設是 `fileURLToPath(new URL('../..', import.meta.url))`，給了就相對 cwd 解析。依序讀規則檔和清單，跑 `[checkConsumers]`（Task 14 再把規則 1–6、8 加進這個陣列），逐行印出 `formatIssue`，最後印統計，再用 `process.exit(exitCodeFor(issues))` 結束。
- `naming-rules.json` 的內容照「設計決定」。
- uikit `CLAUDE.md` 的「推之前必跑的檢查」加一行：`pnpm --filter @tzuchi/tokens build && node packages/tokens/lint-tokens.mjs`（直接呼叫 node，才看得到退出碼 3）。

- [ ] **Step 4: 跑測試和真實 repo，確認通過**
Run: `pnpm exec prettier --write packages/tokens eslint.config.js CLAUDE.md && pnpm --filter @tzuchi/tokens test && pnpm --filter @tzuchi/tokens build && node packages/tokens/lint-tokens.mjs; echo "exit=$?"; pnpm lint`
Expected：`fail 0`；lint 最後一行是 `lint-tokens：0 個錯誤、0 個警告`，`exit=0`；`pnpm lint` 通過。

- [ ] **Step 5: Commit、推分支、開 MR3，到檢查點 H3**
```bash
git add packages/tokens/naming-rules.json packages/tokens/lint-tokens.mjs packages/tokens/lib/lint packages/tokens/test packages/tokens/package.json eslint.config.js CLAUDE.md
git commit -m "feat(tokens): add lint-tokens with the consumer scan (rule 7)

Every var(--tc-*) in the Tzu Chi theme CSS and every --tc-* string in
generate.mjs must name a variable of tokens.list.json; deprecated names are
warnings (exit 3). naming-rules.json lists the non-token exceptions and the
scanned paths.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push -u origin feat/tokens-list -o merge_request.create -o merge_request.target=main -o merge_request.title="feat(tokens): token list and consumer scan (lint-tokens rule 7)"
```
MR 說明用白話寫：
- 新的清單檔是什麼，手冊和 tceditor 都會讀它；
- `lint-tokens` 會擋下哪些錯誤；
- 畫面完全不會變。

**停在這裡**，回報 MR 網址，等使用者說已合併（H3）。

### Task 9: 手冊升級（Astro 7／Starlight 0.42）與移除 Lit

目的：把 `apps/docs` 升到 Astro 7 和 Starlight 0.42（修掉 astro 5.18.2 的 critical 和 sharp 的 high），設定改成可以公開的樣子，移除 Lit 元件頁和它們的元件，root 的 build 和 test 不再碰凍結的 Lit 套件。token 頁的改寫在 Task 10。

**執行位置**：uikit，分支 `feat/handbook`（H3 之後從最新的 `origin/main` 開；Task 10、11 接在同一條分支上）。

**設計決定**：
- **先刪 Lit 頁，再升級。** 22 個元件頁和 `Demo.astro`（`apps/docs/src/components/Demo.astro:11-13` 在瀏覽器 import `@tzuchi/components`）、`PropsTable.astro`（`:4` 讀 `@tzuchi/components/custom-elements.json`）都依賴 Lit 的 build；先刪掉，升級時就不必讓它們在 Astro 7 下編譯。
- **`theming.mdx` 在本 task 只做最小修改**：拿掉 `Demo` 的 import（`:6`）、`<tc-theme-toggle>` 的連結（`:29`，它指向被刪的頁面）和 `<Demo>`／`:::tip` 區塊（`:31-42`）。其餘改寫和搬家在 Task 10。
- **Lit 排除的是 4 個套件，不是 3 個。** `@tzuchi/components`、`@tzuchi/react`、`@tzuchi/storybook`（`apps/storybook`），加上 `@tzuchi/demo-html`：它的 `test`（`apps/demo-html/smoke.mjs:6-8`）讀 `packages/components/dist`，而 `turbo.json` 的 `test` 依賴 `^build`。只排除前 3 個的話，turbo 仍會為 demo-html 建 `@tzuchi/components`。
- **root 的 build、test 沿用 Task 2 的白名單**：Task 2 已改成 `--filter=@tzuchi/tokens`，這裡加上 `--filter=@tzuchi/docs`。白名單不用引號，Windows 的 cmd 也沒有單引號的問題；Lit 四個套件（`@tzuchi/components`、`@tzuchi/react`、`@tzuchi/storybook`、`@tzuchi/demo-html`）自然不在範圍內。
- **`sharp` 不留在 `apps/docs`**：astro 7 會把 `sharp ^0.35.4` 當 optionalDependency 帶進來，所以只用 `overrides` 釘下限。現在 lockfile 的 `sharp@0.33.5` 和 `0.34.5`（`pnpm-lock.yaml:6765,6769`）都只來自 astro 5.18.2 和 `apps/docs`，升級後只會剩 `0.35.5`。
- **`site` 寫死 `https://tzuchi-uikit.pages.dev`**：Pages 專案 `tzuchi-uikit` 的網域已經確定（`docs/superpowers/specs/2026-09-22-gitlab-ci-cloudflare-staging-design.md:4` 的 staging 是 `staging.tzuchi-uikit.pages.dev`）。staging 不再更新（規格 R1），所以不從環境變數傳入。
- **側欄的「元件樣品室」用 `link: '/storybook/'`**，不用 `slug`：那一頁不在 Starlight 的 collection 裡，用 `slug` 會讓 build 失敗。

**Files:**
- Delete: `apps/docs/src/content/docs/components/`（22 個 `.mdx`）、`apps/docs/src/components/Demo.astro`、`apps/docs/src/components/PropsTable.astro`
- Modify: `apps/docs/src/content/docs/foundations/theming.mdx:6,29,31-42`
- Modify: `apps/docs/src/content/docs/index.mdx:1-18`（全部改寫）
- Modify: `apps/docs/package.json:5-18`
- Modify: `apps/docs/astro.config.mjs:5-19`
- Modify: `pnpm-workspace.yaml`（在 Task 3 建立的 `overrides:` 底下加一項；不可再寫第二個 `overrides:` 鍵，YAML 的重複鍵會讓 pnpm 解析失敗）
- Modify: `package.json:11,13`（root 的 `build`、`test`）；選到 astro 7.4.x 時還有 `:7`
- Modify: `pnpm-lock.yaml`（由 pnpm 產生）

**Interfaces:**
- Consumes：Task 2 的 `minimumReleaseAge: 20160`、`engines.node`、`.gitignore` 的 `.astro/`，以及 `apps/docs/.astro/` 已經取消追蹤。
- Produces：`@tzuchi/docs` 的 `build` 輸出 `apps/docs/dist/`（有 `index.html` 和 `404.html`）；`astro.config.mjs` 的 `site = 'https://tzuchi-uikit.pages.dev'`；root 的 `build`、`test` 只涵蓋 `@tzuchi/tokens`、`@tzuchi/docs`。

- [ ] **Step 1: 刪除 Lit 頁和元件，修改 `theming.mdx` 和 `index.mdx`**
```bash
git rm -r -q apps/docs/src/content/docs/components apps/docs/src/components/Demo.astro apps/docs/src/components/PropsTable.astro
```
`theming.mdx` 照「設計決定」刪掉三處。`index.mdx` 改寫成以下三段，frontmatter 的 `title` 保留，`description` 改成「慈濟入口網的設計規範手冊：design tokens 與元件樣品室。」：
  1. 這份手冊是什麼：慈濟入口網的設計規範，頁面上的數值都由 design tokens 產生。
  2. 規範的來源：uikit repo 的 `packages/tokens`（DTCG JSON）是唯一來源。手冊和[元件樣品室](/storybook/)由同一次建置產生，合併到 main 後自動重建。token 的名稱和值由美編核可，建置和部署由工程維護。
  3. 從左側的「基礎」開始瀏覽。

  不寫 Lit、不寫人名、不放 `:::note` 或「之後補上」這類占位。
- [ ] **Step 2: 確認沒有 Lit 殘留**
Run: `git grep -nE '<tc-|@tzuchi/components|picsum' -- apps/docs/src`
Expected: 沒有輸出（`apps/docs/package.json` 的依賴在 Step 4 移除）。
- [ ] **Step 3: 依 14 天規則選版本**
```bash
PICK='const re=new RegExp(process.argv[1]);const cut=Date.now()-14*864e5;const t=JSON.parse(require("fs").readFileSync(0));const n=(v)=>v.split(".").map(Number);const cmp=(a,b)=>n(a)[0]-n(b)[0]||n(a)[1]-n(b)[1]||n(a)[2]-n(b)[2];const ok=Object.keys(t).filter((v)=>re.test(v)&&Date.parse(t[v])<=cut).sort(cmp);console.log(ok.at(-1),t[ok.at(-1)])'
npm view astro time --json | node -e "$PICK" '^7\.\d+\.\d+$'
npm view @astrojs/starlight time --json | node -e "$PICK" '^0\.42\.\d+$'
```
依版本號（不是發布時間）取滿 14 天的最大版本。以 10-21 查到的資料：10-22 起是 astro `7.3.8` 加 Starlight `0.42.6`；10-29 起 astro `7.4.0`；11-02 起 `7.4.1`。用指令印出的版本，記為 `<A>`、`<S>`。`npm view @astrojs/starlight@<S> peerDependencies` 的 `astro` 範圍必須包含 `<A>`（0.42.x 是 `^7.2.10`）。
- [ ] **Step 4: 改依賴和 overrides**
```bash
pnpm --filter @tzuchi/docs remove @tzuchi/components sharp
pnpm --filter @tzuchi/docs add -D --save-exact astro@<A> @astrojs/starlight@<S>
```
在 `pnpm-workspace.yaml` 既有的 `overrides:`（Task 3 建立）底下加一項：
```yaml
  # GHSA-wq5f-xc86-pv6w（sharp < 0.35.5，librsvg）。astro 7 把 sharp ^0.35.4 當 optionalDependency
  # 帶進來；apps/docs 沒有影像，不直接依賴 sharp。
  'sharp@<0.35.5': '0.35.5'
```
`<A>` 是 7.4.x 時，root `package.json:7` 的 `engines.node` 必須是 `">=22.22.0"`（Task 2 已經設的話就不動）。再跑一次 `pnpm install`。
Expected: pnpm 沒有出現 `minimumReleaseAge` 的錯誤。有的話表示版本不滿 14 天，回 Step 3。
- [ ] **Step 5: 檢查 lockfile**
Run: `grep -nE "^  '?(sharp|vite|astro|@astrojs/starlight)@[0-9]" pnpm-lock.yaml | sed -E "s/^[0-9]+:  '?//; s/[(:].*//" | sort -u`
Expected（scoped 套件在 lockfile 裡帶引號，每個版本在 `packages:` 和 `snapshots:` 各出現一次，所以先去重）:
  - `sharp@` 只有 `0.35.5`；`astro@<A>`、`@astrojs/starlight@<S>` 各一行；
  - 每個 `vite@8.` 都 ≥ `8.3.3`。如果出現 8.3.3 以下的 8.x，在既有的 `overrides:` 底下再加 `'vite@>=8.0.0 <8.3.3': '8.3.3'`，註解寫 `GHSA-587h-7wmj-h5pm、GHSA-r825-w8mm-5pxw（vite 8.3.0–8.3.2）`，然後重跑 `pnpm install` 和本步驟。
- [ ] **Step 6: 改 `astro.config.mjs`**
```js
export default defineConfig({
  site: 'https://tzuchi-uikit.pages.dev',
  devToolbar: { enabled: false },
  server: { host: '127.0.0.1', port: 4321 },
  vite: { server: { strictPort: true } }, // 埠被占用時直接失敗，不自動換埠（規格 §4.3 的第二道防線）
  integrations: [
    starlight({
      title: '慈濟入口網 UIKit',
      description: '慈濟入口網的設計規範手冊：design tokens 與元件樣品室',
      locales: { root: { label: '繁體中文', lang: 'zh-TW' } },
      sidebar: [
        { label: '基礎', items: [{ autogenerate: { directory: 'foundations' } }] },
        { label: '元件樣品室', link: '/storybook/' },
      ],
    }),
  ],
});
```
`customCss` 整個拿掉（R5：手冊不載入 `tokens.css`）。`apps/docs/package.json` 的 scripts 改成 `"dev": "node ../../scripts/dev/docs.mjs"`、`"build": "node ../../scripts/dev/astro.mjs build"`、`"preview": "node ../../scripts/dev/astro.mjs preview --host 127.0.0.1 --port 4321"`。透過 Task 2 的腳本執行，遙測和更新檢查才會在每台電腦上都關掉。
- [ ] **Step 7: 建置手冊**
Run: `pnpm --filter @tzuchi/docs build && find apps/docs/dist -name index.html | wc -l && test -f apps/docs/dist/404.html`
Expected: build 成功，`index.html` 有 4 個（26 頁減掉 22 個元件頁：首頁、colors、theming、typography），`404.html` 存在。如果新編譯器拒絕自我關閉的非 void 標籤（`ColorSwatches.astro:29` 的 `<div … />`、`ThemeSwatches.astro:57,61` 的 `<span … />`），改成成對標籤再建一次。
Run: `grep -rlE '<tc-|@tzuchi/components|picsum\.photos' apps/docs/dist; git grep -nE '<tc-|@tzuchi/components' -- apps/docs`
Expected: 兩個指令都沒有輸出。
- [ ] **Step 8: root 的 build 和 test 排除 Lit**
`package.json:11,13` 改成：
```json
"build": "turbo run build --filter=@tzuchi/tokens --filter=@tzuchi/docs",
"test": "turbo run test --filter=@tzuchi/tokens --filter=@tzuchi/docs",
```
Run: `pnpm build && pnpm test`
Expected: turbo 印出的 `Packages in Scope` 只有 `@tzuchi/docs` 和 `@tzuchi/tokens`；兩個指令都以 0 結束。
- [ ] **Step 9: Commit**
```bash
git add apps/docs/src apps/docs/package.json apps/docs/astro.config.mjs pnpm-workspace.yaml pnpm-lock.yaml package.json
git commit -m "build(docs): upgrade the handbook to Astro <A> and Starlight <S> and drop the Lit pages

Removes the 22 Lit component pages with Demo and PropsTable, pins sharp
to 0.35.5 (GHSA-wq5f-xc86-pv6w), sets the zh-TW locale, the site URL and
the items sidebar, stops loading tokens.css, and leaves the frozen Lit
packages out of the root build and test.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 10: 手冊的 token 頁與手冊主題

目的：手冊只讀 `@tzuchi/tokens/tokens.list.json`。基礎、深色主題、元件 tokens 的表格和色票都由清單產生，命名規範頁寫 1a 版；手冊自己的主色和字型也從清單的靜態值產生。手冊原始碼不再出現 `var(--tc-`。

**執行位置**：uikit，分支 `feat/handbook`（接在 Task 9 之後）。

**設計決定**：
- **純函式和讀檔分開。** `src/lib/token-groups.ts` 只有型別和純函式，不 import 任何東西，所以 `node --test` 能靠 Node 的型別去除直接載入它。`src/lib/tokens.ts` 才 import JSON（Node 不帶 `with { type: 'json' }` 載不到，Vite 可以）。
- **每個 primitive／semantic 的根群組都要有頁面。** 清單的根群組有 13 個 primitive（`color`、`elevation`、`space`、`radius`、`size`、`opacity`、`focus-ring`、`motion`、`z`、`breakpoint`、`container`、`font`、`line-height`）和 2 個 semantic（`color`、`typography`）。規格列的 7 頁放不下 `size`、`opacity`、`focus-ring`、`z`，所以 `size` 併入「間距與尺寸」，另外三個放第 8 頁「其他基礎值」。`tokens.ts` 載入時，有沒分到頁面的根群組就丟錯，美編新增根群組時手冊建置會失敗，不會漏顯示。
- **手冊主題的對應**（R5，Starlight 的 `:root` 是深色，`:root[data-theme='light']` 是亮色；未分層的 CSS 會贏過 Starlight 的 `@layer starlight.*`）：

  | Starlight 變數 | 亮色取 | 深色取 |
  |---|---|---|
  | `--sl-color-accent-low` | `color.brand.surface` 的 `light.value` | `color.brand.surface` 的 `dark.value` |
  | `--sl-color-accent` | `color.brand.primary-hover` 的 `light.value` | `color.brand.surface-hover` 的 `dark.value` |
  | `--sl-color-accent-high` | `color.brand.primary` 的 `light.value` | `color.brand.primary` 的 `dark.value` |
  | `--sl-font` | `font.family.base` 的 `light.value` | 同左 |
- **深色欄的底色也從清單取。** `ThemeSwatches.astro:101-102` 寫死的 `#1c1c1e`／`#f2f2f2`，改成 `color.surface.default`、`color.text.default` 的 `dark.value`。
- **手冊不再手抄數值。** `colors.mdx:17`（`#1B2D58`）和 `theming.mdx:64-71` 的色碼、對比值都刪掉，串接示例（`theming.mdx:48-52`，含 `var(--tc-`）改成用 `TokenTable` 顯示 `button.filled.bg` 的亮暗參照鏈。
- **`var(--tc-` 在程式碼區塊裡也不能寫。** 規則 7 的 `noVar` 只略過註解，MDX 的程式碼區塊不算註解。要說明串接就寫 CSS 變數名和箭頭。
- **`theming.mdx` 搬到 `src/content/docs/theming.mdx`**，網址變成 `/theming/`；手冊還沒公開，不需要轉址。

**Files:**
- Create: `apps/docs/src/lib/token-groups.ts`、`apps/docs/src/lib/tokens.ts`、`apps/docs/scripts/theme-css.mjs`
- Create: `apps/docs/src/components/TokenTable.astro`、`TokenMeta.astro`、`ComponentTokens.astro`
- Create: `apps/docs/src/content/docs/foundations/{spacing,radius,elevation,motion,layout,other}.mdx`、`apps/docs/src/content/docs/component-tokens.mdx`、`apps/docs/src/content/docs/naming.mdx`
- Modify: `apps/docs/src/components/ColorSwatches.astro:1-58`、`ThemeSwatches.astro:1-111`、`TypeScale.astro:1-42`（全部改寫）
- Modify: `apps/docs/src/content/docs/foundations/colors.mdx:1-18`、`typography.mdx:1-14`；`git mv` `foundations/theming.mdx` → `theming.mdx` 並改寫
- Modify: `apps/docs/astro.config.mjs`（Task 9 的版本）、`apps/docs/package.json` scripts、`.gitignore`、`packages/tokens/naming-rules.json`（`consumers.noVar`）
- Test: `apps/docs/test/fixture.mjs`、`apps/docs/test/token-groups.test.mjs`、`apps/docs/test/theme-css.test.mjs`

**Interfaces:**
- Consumes：Task 7 的 `TokenList`／`TokenEntry`／`ModeValue`（`@tzuchi/tokens/tokens.list.json`）；Task 8 的 `naming-rules.json` 和 `pnpm --filter @tzuchi/tokens lint`。
- Produces（`token-groups.ts`）：`type Layer`、`interface ModeValue`、`interface TokenEntry`、`interface TokenList`（照 Task 7 的形狀手寫）；`FOUNDATION_GROUPS: Record<'colors'|'typography'|'spacing'|'radius'|'elevation'|'motion'|'layout'|'other', readonly string[]>`；`assertTokenList(raw: unknown): TokenList`；`tokensIn(list, roots: string | readonly string[], layer?: Layer): TokenEntry[]`；`byId(list, id: string): TokenEntry`；`darkOverrides(list): TokenEntry[]`；`componentGroups(list): { name: string; tokens: TokenEntry[] }[]`；`chainText(mode: ModeValue): string`；`unassignedFoundationTokens(list): TokenEntry[]`。
- Produces（`tokens.ts`）：`tokenList: TokenList`，並轉出 `token-groups.ts` 的全部名稱。
- Produces（`theme-css.mjs`）：`THEME_MAP`、`renderThemeCss(list) → string`；直接執行時寫 `apps/docs/src/styles/tokens-theme.css`（git 忽略）。
- Produces（`apps/docs/package.json`）：`"theme": "node scripts/theme-css.mjs"`、`"dev": "node ../../scripts/dev/docs.mjs"`（它會先跑 `theme-css.mjs`）、`"build": "node scripts/theme-css.mjs && node ../../scripts/dev/astro.mjs build"`、`"test": "node --test \"test/*.test.mjs\""`。

- [ ] **Step 1: 寫會失敗的測試**

兩個測試檔共用 `apps/docs/test/fixture.mjs` 的 `fx`：一份欄位齊全的 `TokenList`，tokens 依 id 排序是
`button.filled.bg`、`button.radius`（component，`source: "src/component/button.tokens.json"`）、`color.blue.900`（primitive）、`color.brand.primary`（semantic，亮 `#1b2d58`、暗 `#a9c2ea`）、`color.brand.primary-hover`（亮 `#30559f`）、`color.brand.surface`（亮 `#e8eefe`、暗 `#1b2d58`）、`color.brand.surface-hover`（暗 `#30559f`）、`colorful.x`（primitive）、`font.family.base`（primitive，值 `'Noto Sans TC', sans-serif`）、`shadow-x.a`（primitive）。
```js
// apps/docs/test/token-groups.test.mjs
test("tokensIn 依整段根群組和層篩選，依 id 排序", () => {
  assert.deepEqual(tokensIn(fx, "color", "primitive").map((t) => t.id), ["color.blue.900"]);
  assert.equal(tokensIn(fx, "color").length, 5); // colorful.x 不算 color
  assert.deepEqual(tokensIn(fx, ["font", "shadow-x"]).map((t) => t.id), ["font.family.base", "shadow-x.a"]);
});
test("componentGroups 依 source 的檔名分組", () => {
  assert.deepEqual(componentGroups(fx).map((g) => [g.name, g.tokens.length]), [["button", 2]]);
});
test("chainText 用箭頭連接參照鏈", () => {
  assert.equal(chainText({ value: "#1b2d58", css: "", chain: ["color.brand.primary", "color.blue.900"] }), "color.brand.primary → color.blue.900");
  assert.equal(chainText({ value: "#fff", css: "#fff", chain: [] }), "");
});
test("沒有頁面的根群組會被找出來，component 層不算", () => {
  assert.deepEqual(unassignedFoundationTokens(fx).map((t) => t.id), ["colorful.x", "shadow-x.a"]);
});
test("byId 找不到時丟錯", () => assert.throws(() => byId(fx, "color.nope"), /color\.nope/));
test("assertTokenList 拒絕不是 schemaVersion 1 的清單", () => assert.throws(() => assertTokenList({ schemaVersion: 2, tokens: [] }), /schemaVersion/));
test("實際的清單每個根群組都有頁面", () => {
  const real = JSON.parse(readFileSync(new URL("../../../packages/tokens/dist/tokens.list.json", import.meta.url)));
  assert.deepEqual(unassignedFoundationTokens(real), []);
});
// apps/docs/test/theme-css.test.mjs
test("renderThemeCss 用清單的靜態值寫出亮暗兩組", () => {
  const css = renderThemeCss(fx);
  assert.match(css, /:root\[data-theme='light'\] \{[^}]*--sl-color-accent-high: #1b2d58;/);
  assert.match(css, /:root \{[^}]*--sl-color-accent-high: #a9c2ea;/);
  assert.match(css, /--sl-font: 'Noto Sans TC', sans-serif;/);
  assert.equal(css.includes("var(--tc-"), false);
});
test("對應到的 token 不存在時丟錯並指出 id", () => {
  assert.throws(() => renderThemeCss({ ...fx, tokens: fx.tokens.filter((t) => t.id !== "color.brand.surface") }), /color\.brand\.surface/);
});
```
- [ ] **Step 2: 跑測試，確認失敗**
Run: `pnpm --filter @tzuchi/tokens build && node --test "apps/docs/test/*.test.mjs"`
Expected: FAIL，`Cannot find module …/src/lib/token-groups.ts` 和 `…/scripts/theme-css.mjs`。
- [ ] **Step 3: 實作 `token-groups.ts`、`tokens.ts`、`theme-css.mjs`**
  - `FOUNDATION_GROUPS = { colors: ["color"], typography: ["font", "line-height", "typography"], spacing: ["space", "size"], radius: ["radius"], elevation: ["elevation"], motion: ["motion"], layout: ["breakpoint", "container"], other: ["opacity", "focus-ring", "z"] }`。
  - 根群組是 `id.split(".")[0]`；`unassignedFoundationTokens` 只看 `layer !== "component"`。`componentGroups` 的 `name` 是 `source` 去掉 `src/component/` 和 `.tokens.json`，依 `name` 排序。
  - `tokens.ts`：`tokenList = assertTokenList(raw)`；`unassignedFoundationTokens(tokenList)` 不是空的就 `throw new Error("手冊沒有頁面顯示這些 token：<id 清單>。請在 apps/docs/src/lib/token-groups.ts 的 FOUNDATION_GROUPS 加上它們的根群組。")`。
  - `theme-css.mjs`：`THEME_MAP` 照「設計決定」的表；`renderThemeCss` 第一行寫註解「由 scripts/theme-css.mjs 從 @tzuchi/tokens/tokens.list.json 產生，不要手改」。直接執行時用 `import.meta.resolve("@tzuchi/tokens/tokens.list.json")` 找清單，找不到就印「先執行 pnpm --filter @tzuchi/tokens build」並 `exit 1`；`mkdirSync` 之後寫檔。
- [ ] **Step 4: 跑測試，確認通過**
Run: `node --test "apps/docs/test/*.test.mjs"`
Expected: PASS，9 個測試。
- [ ] **Step 5: 改寫元件**
  - `TokenMeta.astro`（props `token`）：`description`，以及 `deprecated` 不是 `null` 時的「已棄用，改用 `<replacedBy 的 cssVar>`」。
  - `TokenTable.astro`（props `tokens`、`preview?: "bar" | "radius"`）：欄位是名稱（`cssVar`，下面小字 `id` 和 `TokenMeta`）、亮色、深色、參照鏈。亮暗兩欄都顯示 `value` 和 `chainText`；`hasDarkOverride` 是 `false` 時深色欄寫「同亮色」。預覽依 `type`：`color` 畫色塊（`background`）、`shadow` 畫方塊（`box-shadow`）、`typography` 用 `font` 寫一行範例字；`preview` 指定時畫長條（`inline-size`）或圓角方塊（`border-radius`）。值一律來自清單，寫在行內 `style`。
  - `ColorSwatches.astro`：`tokensIn(tokenList, "color", "primitive")` 的色票格，每格是色塊、`cssVar`、`light.value` 和 `TokenMeta`。
  - `ThemeSwatches.astro`：`tokensIn(tokenList, "color", "semantic")`，每列是名稱和 `TokenMeta`、亮色（色塊、值、參照鏈）、深色（同），深色欄的底色和字色照「設計決定」。
  - `TypeScale.astro`：`tokensIn(tokenList, "typography", "semantic")`，每列是 `cssVar`、`TokenMeta`、用 `font: <light.value>` 畫的「慈濟 Tzu Chi — 大愛無國界」，以及值。
  - `ComponentTokens.astro`：頁首列出每個元件的錨點連結，接著每個 `componentGroups` 一段 `<h2 id={name}>` 加 `TokenTable`。
- [ ] **Step 6: 寫頁面和設定**
  - `foundations/` 8 頁，frontmatter 用 `sidebar.order` 1–8：`colors`（色彩：`ColorSwatches`、`ThemeSwatches`）、`typography`（字體與字級：`TypeScale`、`font`／`line-height` 的 `TokenTable`）、`spacing`（間距與尺寸：`space` 用 `preview="bar"`、`size`）、`radius`（圓角，`preview="radius"`）、`elevation`（陰影）、`motion`（動態）、`layout`（斷點與容器：`tokensIn(tokenList, ["breakpoint", "container"], "primitive")`）、`other`（其他基礎值）。每頁一兩句說明，不寫數值。
  - `theming.mdx`（深色主題）：兩套主題、在 `<html>` 設 `data-theme` 的方式（保留 `:17-25` 的 selector 範例，註解「15 個語意色覆寫」改成「語意色和陰影的覆寫」，不寫個數）、「主題只能設在 `<html>`」和理由（元件 token 在 `:root` 宣告，參照在那裡就解析完；設在內層元素只會換掉語意色本身）、`<TokenTable tokens={darkOverrides(tokenList)} />`，以及 `button.filled.bg` 的串接示例 `<TokenTable tokens={[byId(tokenList, "button.filled.bg")]} />`。
  - `component-tokens.mdx`（元件 tokens）：`<ComponentTokens />`。`naming.mdx`（命名規範，1a 手寫）：id 是 JSON 路徑用 `.` 連接，CSS 變數是 `--tc-` 加上用 `-` 連接的 id（例：`color.brand.primary` → `--tc-color-brand-primary`）；三層和各自的資料夾（component 層的根群組等於檔名）；深色只覆寫 `src/themes/dark/` 裡的語意色和陰影；用 `{id}` 參照。
  - `astro.config.mjs`：加 `customCss: ['./src/styles/tokens-theme.css']`；`sidebar` 改成 `基礎`（autogenerate `foundations`）、`{ label: '深色主題', slug: 'theming' }`、`{ label: '元件 tokens', slug: 'component-tokens' }`、`{ label: '元件樣品室', link: '/storybook/' }`、`{ label: '命名規範', slug: 'naming' }`。
  - `apps/docs/package.json` 的 scripts 照 Interfaces；`.gitignore` 加 `apps/docs/src/styles/tokens-theme.css`；`packages/tokens/naming-rules.json` 的 `consumers.noVar` 必須包含 `"apps/docs/src/**"`（Task 8 沒放就在這裡加）。
- [ ] **Step 7: 驗證**
Run: `git grep -n 'var(--tc-' -- apps/docs/src; pnpm --filter @tzuchi/tokens lint; echo "exit=$?"`
Expected: `git grep` 沒有輸出；`exit=0`。
Run: `pnpm --filter @tzuchi/docs build && find apps/docs/dist -name index.html | wc -l`
Expected: build 成功，`index.html` 有 12 個（首頁、8 個基礎、深色主題、元件 tokens、命名規範）。
Run: `node -e 'const fs=require("fs"),p=require("path");const l=JSON.parse(fs.readFileSync("packages/tokens/dist/tokens.list.json"));let h="";(function w(d){for(const f of fs.readdirSync(d)){const x=p.join(d,f);fs.statSync(x).isDirectory()?w(x):x.endsWith(".html")&&(h+=fs.readFileSync(x,"utf8"))}})("apps/docs/dist");const m=l.tokens.filter(t=>!h.includes(t.cssVar));console.log(l.tokens.length,"tokens; missing:",m.map(t=>t.cssVar))'`
Expected: `missing: []`，清單的每個 token 都出現在手冊上。
Run: `pnpm exec prettier --write apps/docs packages/tokens/naming-rules.json && pnpm exec prettier --check apps/docs .gitignore && pnpm exec eslint apps/docs`
Expected: 都通過。再在背景直接跑 `node scripts/dev/docs.mjs`（記下 PID），在 127.0.0.1:4321 開起來，切換亮暗主題，確認色票、深色欄和手冊主色都正確。再跑一次 `node scripts/dev/docs.mjs`，要以 1 結束並印出「埠 4321 已被占用」（Task 2 留到這裡驗證）。看完用 PID 停掉，用 `lsof` 確認 4321 已釋放。
- [ ] **Step 8: Commit**
```bash
git add apps/docs .gitignore packages/tokens/naming-rules.json
git commit -m "feat(docs): render the token pages and the handbook theme from tokens.list.json

The foundations, dark theme and component token pages read only the
token list; the swatches no longer rebuild names from the DTCG sources,
the accent colours and font come from the list's static values, and no
handbook source uses var(--tc-*).

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 11: Storybook 搬到子路徑、組站與檢查、CI（build／tokens:lint／deploy），推出 MR4

目的：手冊放在網站根目錄，HeroUI 元件樣品室放在 `/storybook/`，由同一條 pipeline 建置、檢查並部署（規格 R1、§5.4「搬到子路徑」、§5.5）。組站腳本列出所有會發出請求的外部網址，手冊必須是零。`lint-tokens` 拆成獨立的 job，只有棄用警告時不擋部署。最後推出 MR4，停在檢查點 H4。

**執行位置**：`~/Desktop/projects/tzuchi-uikit`，分支 `feat/handbook`（Task 9 從 MR3 合併後的 `origin/main` 開，接著 Task 10）。

**設計決定**：
- **logo 已在 Task 3 改成文字**（`styles/theme.ts` 不再有 `/logo-*.svg`），所以這裡只驗證，不改 `theme.ts`。
- **外部網址的判定**（`checkSite` 的 `kind`）：
  - `src`：HTML 的 `src=`、`srcset=`；JS 裡 JSX 編譯後的 `src:"…"`（HeroUI stories 的 122＋18 張外部圖片就是這種寫法）。
  - `link`：`<link … href=…>`。`<a href>` 是連結，不會發出請求，不算。
  - `css`：`url(…)`、`@import`。
  - `fetch`、`import`：JS 的 `fetch(`、`import(`，參數以字串或樣板字串開頭。
  - `iconify`：出現 `api.iconify.design`、`api.simplesvg.com`、`api.unisvg.com` 的檔案。Iconify 的請求網址是執行時才組出來的，上面的寫法都比對不到（規格 §5.4 列的 42 個檔）。
  - 只算 `http:`、`https:` 和 `//` 開頭的網址。主機是 `www.w3.org`（XML／SVG 命名空間），或在 `OWN_ORIGINS` 裡的，不算外部。
- **`OWN_ORIGINS = ['https://tzuchi-uikit.pages.dev']`**：要和 Task 9 在 `astro.config.mjs` 設的 `site` 一致（Starlight 會把 `site` 寫進 canonical 和 sitemap）。
- **分區**：`site/storybook/` 底下算 storybook，其餘算 docs。docs 有任何外部網址就是錯誤；storybook 的只列出來（§13 D 決定先保留）。只有 `site/storybook/**/*.html` 檢查 `src="/`、`href="/`（含單引號），手冊本來就用根路徑。
- **tokens:lint 直接呼叫 node**：`pnpm --filter … run` 遇到失敗時，可能把子程序的結束碼統一成 1（`ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL`，未實測），這樣 3 就傳不出來，`allow_failure: exit_codes: [3]` 也就失效。lint 前先 build tokens，因為規則 7 需要知道有哪些 token。這個 job 只讀 cache（`policy: pull`），避免兩個平行的 job 同時寫同一個 cache key。
- **ESLint 9 的 flat config 不讀 `.gitignore`**：在本機組過站之後，`eslint .` 會去掃 `site/**` 的 JS。所以把 `site/**` 加進 `eslint.config.js` 的 ignores。Prettier 3 會讀 `.gitignore`，`site/` 已在 Task 2 加進去，不用另外處理。
- `deploy:staging` 照舊保留（規格「其餘照舊」）。H1 之後已經沒有受保護的非 main 分支，它不會再執行；只更新檔首的註解。

**Files:**
- Create: `scripts/ci/assemble-site.mjs`、`scripts/ci/check-site.mjs`
- Test: `scripts/ci/assemble-site.test.mjs`、`scripts/ci/check-site.test.mjs`
- Modify: `.gitlab-ci.yml`：檔首註解、`build:` job、`.deploy:` 範本的 `needs` 和 `pages deploy heroui/storybook/storybook-static` 那一行，並在 build 之後新增 `tokens:lint` job。Task 3 已在 build job 插入幾行，所以用 job 名稱和指令內容定位，不用 2b5a6781 的行號
- Modify: `package.json`（scripts 加 `site:assemble`、`site:check`）、`eslint.config.js:6`（加 `'site/**'`）
- Modify: `heroui/storybook/.storybook/welcome.mdx`（加手冊連結）、`heroui/NOTICE.md`
- Modify: `CLAUDE.md`（「推之前必跑的檢查」）
- Modify: `docs/superpowers/specs/2026-09-22-gitlab-ci-cloudflare-staging-design.md:1-19`

**Interfaces:**
- Consumes：
  - Task 9、10：`pnpm --filter @tzuchi/docs build` 產生 `apps/docs/dist/`，裡面有 `index.html`、`404.html`，dev／build script 會先跑 `theme-css.mjs`。
  - Task 7、8：`pnpm --filter @tzuchi/tokens test`（build、check、`node --test`）、`packages/tokens/lint-tokens.mjs --root <dir>`（結束碼 0／1／3）。
  - Task 2：`test:scripts`。Task 3：授權檔的複製和外部 API 檢查。
- Produces：
  - `assembleSite({ docsDir, storybookDir, outDir }) → void`：先刪掉 `outDir`，把 `docsDir` 複製到 `outDir`，把 `storybookDir` 複製到 `outDir/storybook`。任一輸入不存在，或 `docsDir` 已經有 `storybook/`，就丟出錯誤。CLI：`node scripts/ci/assemble-site.mjs`，預設 `apps/docs/dist`、`heroui/storybook/storybook-static`、`site`，都相對於 repo 根目錄。
  - `checkSite(siteDir, { maxFiles = 15000, ownOrigins = OWN_ORIGINS } = {}) → { errors: string[], external: Array<{ area: 'docs'|'storybook', file, kind, url }> }`；`findExternalRequests(text, ext) → Array<{ kind, url }>`；`OWN_ORIGINS`。CLI：`node scripts/ci/check-site.mjs site`，依區、主機、kind 分組印出外部網址和次數，`errors` 不是空的就 exit 1。
  - root scripts：`"site:assemble": "node scripts/ci/assemble-site.mjs"`、`"site:check": "node scripts/ci/check-site.mjs site"`。

- [ ] **Step 1: 寫會失敗的測試**
每個測試用 `mkdtempSync(join(tmpdir(), 'site-'))` 建一個網站，`makeSite(files)` 依 `{ 相對路徑: 內容 }` 寫入檔案。`base` 是 `{ 'index.html': '<html></html>', '404.html': '', 'storybook/index.html': '<script src="./sb-manager/runtime.js"></script>' }`。
```js
test('a minimal site passes', () => {
  const r = checkSite(makeSite(base));
  assert.deepEqual(r, { errors: [], external: [] });
});
test('missing 404.html is an error', () => {
  const { ['404.html']: _, ...rest } = base;
  assert.ok(checkSite(makeSite(rest)).errors.some((e) => e.includes('404.html')));
});
test('a root-relative path in storybook HTML is an error, in docs HTML it is not', () => {
  const r = checkSite(makeSite({ ...base, 'index.html': '<link rel="stylesheet" href="/_astro/a.css">', 'storybook/iframe.html': "<script src='/react-scan/x.js'></script>" }));
  assert.equal(r.errors.length, 1);
  assert.ok(r.errors[0].includes('storybook/iframe.html'));
});
test('an external stylesheet in the handbook is an error', () => {
  const r = checkSite(makeSite({ ...base, 'index.html': '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter">' }));
  assert.deepEqual(r.external, [{ area: 'docs', file: 'index.html', kind: 'link', url: 'https://fonts.googleapis.com/css2?family=Inter' }]);
  assert.equal(r.errors.length, 1);
});
test('external images in storybook JS are listed but pass', () => {
  const r = checkSite(makeSite({ ...base, 'storybook/assets/a.js': 'x={src:"https://img.heroui.chat/image/avatar?w=400"}' }));
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.external.map((e) => [e.area, e.kind]), [['storybook', 'src']]);
});
test('anchors, XML namespaces and the own origin are not requests', () => {
  assert.deepEqual(findExternalRequests('<a href="https://example.com">x</a><svg xmlns="http://www.w3.org/2000/svg"></svg><img src="https://tzuchi-uikit.pages.dev/a.png">', '.html'), []);
});
test('CSS url() and @import are found', () => {
  assert.deepEqual(findExternalRequests('@import "https://a.example/x.css"; .b{background:url(//b.example/y.png)}', '.css').map((e) => e.url), ['https://a.example/x.css', '//b.example/y.png']);
});
test('JS fetch() and import() are found', () => {
  const found = findExternalRequests('fetch(`https://swapi.py4e.com/api/people/?search=${q}`);import("https://esm.sh/x")', '.js');
  assert.deepEqual(found.map((e) => e.kind), ['fetch', 'import']);
  assert.ok(found[0].url.startsWith('https://swapi.py4e.com/'));
});
test('Iconify API hosts are listed', () => {
  assert.deepEqual(findExternalRequests('const h=["https://api.iconify.design","https://api.simplesvg.com"]', '.js').map((e) => e.kind), ['iconify', 'iconify']);
});
test('the file count limit is an error', () => {
  assert.ok(checkSite(makeSite(base), { maxFiles: 3 }).errors.some((e) => e.includes('3')));
});
// assemble-site.test.mjs
test('assembleSite puts the handbook at the root and Storybook under storybook/', () => { /* assert existsSync(out/index.html) && existsSync(out/storybook/index.html) */ });
test('assembleSite removes files left from an earlier run', () => { /* 先在 outDir 放 stale.txt，assert !existsSync(out/stale.txt) */ });
test('assembleSite refuses a handbook build that already has storybook/', () => { assert.throws(() => assembleSite(…), /storybook/); });
```
Run: `node --test "scripts/ci/*.test.mjs"`　Expected：FAIL，`Cannot find module '…/scripts/ci/check-site.mjs'`。

- [ ] **Step 2: 實作 `assemble-site.mjs`、`check-site.mjs`**
- 只用 `node:fs`、`node:path`、`node:url`。CLI 只在 `import.meta.url === pathToFileURL(process.argv[1]).href` 時執行。
- `checkSite` 用 `readdirSync(siteDir, { recursive: true })` 列出檔案。只讀 `.html`、`.css`、`.js`、`.mjs`，其他類型只計數。
- 錯誤訊息：`缺少 <path>`、`檔案數 <n> 已達上限 <max>`、`<file>: 用了根路徑 <match>，搬到 /storybook/ 後會失效`、`手冊有外部請求：<url>（<file>）`。
- URL 取到第一個空白、引號、反引號、`)`、`<`、`>` 或 `$` 為止。
- 根目錄的 `package.json` 加 `site:assemble`、`site:check`；`eslint.config.js:6` 的 ignores 加 `'site/**'`。

- [ ] **Step 3: 跑測試，確認通過**
Run: `pnpm run test:scripts`　Expected：`scripts/dev` 和 `scripts/ci` 的測試全部 PASS。

- [ ] **Step 4: CI**
- build job 的 `variables` 加 `ASTRO_TELEMETRY_DISABLED: '1'`、`ASTRO_DISABLE_UPDATE_CHECK: 'true'`。`script` 依序是：tokens test → `test:scripts` → `heroui:theme` 和 `git diff --exit-code` → Storybook build、`test -f`、外部 API 檢查、`cp` 授權檔（Task 3 的順序：先檢查再複製 NOTICE.md）→ `pnpm --filter @tzuchi/docs build` → `pnpm --filter @tzuchi/docs test` → `pnpm run site:assemble` → `pnpm run site:check`。`artifacts` 改成 `name: site-$CI_COMMIT_SHORT_SHA`、`paths: [site/]`。
- 新增 job：
```yaml
tokens:lint:
  stage: build
  interruptible: true
  timeout: 10 minutes
  variables:
    npm_config_store_dir: $CI_PROJECT_DIR/.pnpm-store
  cache:
    key: pnpm-store-v1
    paths: [.pnpm-store/] # 不放 .corepack/：規格 §5.5，避免共用 cache 換掉 pnpm 執行檔
    policy: pull
  before_script:
    - corepack enable pnpm
    - corepack install
    - pnpm install --frozen-lockfile --filter @tzuchi/tokens
  script:
    - pnpm --filter @tzuchi/tokens build
    # 直接呼叫 node：exit 3（只有棄用警告）要原樣傳給 allow_failure
    - node packages/tokens/lint-tokens.mjs --root "$CI_PROJECT_DIR"
  allow_failure:
    exit_codes: [3]
```
- `.deploy` 的 `needs` 改成 `[build, tokens:lint]`；`pages deploy heroui/storybook/storybook-static` 改成 `pages deploy site`。
- 檔首註解改寫：build 的流程、`site/` 的結構（根目錄是手冊，`/storybook/` 是樣品室）、tokens:lint 的結束碼。「目前只有 spike/heroui-v3」改成「目前沒有」。「不放進來的」那段刪掉 docs。
- `welcome.mdx` 加一行「設計規範見 `<a href="../" target="_top">設計理念手冊</a>`」，`NOTICE.md` 的 welcome 條目同步更新。
- `CLAUDE.md` 的「推之前必跑的檢查」加上：改到手冊或 Storybook 時，跑 `pnpm --filter @tzuchi/docs build && pnpm --filter @tzuchi/docs test && pnpm run heroui:storybook:build && pnpm run site:assemble && pnpm run site:check`。
- `2026-09-22-…-design.md`：在檔首狀態之後加一段「2026-10 更新」：手冊（`apps/docs`）現在也會部署，在根目錄；Storybook 搬到 `/storybook/`；staging 已停用，spike 已解除保護；tokens:lint 是獨立的 job。原本「非目標」裡的「docs：不部署」改成刪除線並附註。

- [ ] **Step 5: 本機完整跑一次 CI 的 build**
Run: `pnpm --filter @tzuchi/tokens test && pnpm run heroui:storybook:build && cp heroui/LICENSE heroui/NOTICE.md heroui/storybook/storybook-static/ && pnpm --filter @tzuchi/docs build && pnpm run site:assemble && pnpm run site:check`
Expected：exit 0；輸出的 docs 外部請求是 0；storybook 列出 `heroui-assets.nyc3.cdn.digitaloceanspaces.com`、`img.heroui.chat`，以及 `iconify`。
Run: `node packages/tokens/lint-tokens.mjs --root "$PWD"; echo $?`　Expected：`0`。
Run: `pnpm exec prettier --write scripts/ci package.json eslint.config.js CLAUDE.md; grep -rn '/logo-' heroui/storybook/.storybook; pnpm lint`　Expected：grep 沒有輸出，`pnpm lint` 以 0 結束。
Run（glab 已登入時，單獨一行）：`glab ci lint .gitlab-ci.yml`　Expected：`CI/CD YAML is valid`。
先確認 `lsof -nP -iTCP:4330 -sTCP:LISTEN` 沒有輸出，再在背景執行 `python3 -I -m http.server 4330 --bind 127.0.0.1 --directory site`（`-I`：不從目前目錄載入模組），記下 PID。打開 http://127.0.0.1:4330/：是手冊，元件章節連到 `/storybook/`。打開 http://127.0.0.1:4330/storybook/：Storybook 載入，預設是慈濟主題，Welcome 的手冊連結回到根目錄。檢查完 `kill <PID>`。

- [ ] **Step 6: Commit**
```bash
git add scripts/ci package.json eslint.config.js .gitlab-ci.yml heroui/storybook/.storybook/welcome.mdx heroui/NOTICE.md CLAUDE.md docs/superpowers/specs/2026-09-22-gitlab-ci-cloudflare-staging-design.md
git commit -m "ci: deploy the handbook at the root and Storybook under /storybook/ with site checks" -m "assemble-site and check-site build and check site/ (required pages, file count, root-relative paths in Storybook, external requests: none allowed in the handbook); tokens:lint runs on its own and only deprecation warnings (exit 3) are allowed to fail; Astro telemetry is off in CI." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 7: 推出 MR4**（標題不可含 publish，見 Task 2）
```bash
git push -u origin feat/handbook -o merge_request.create -o merge_request.target=main -o merge_request.title="feat: the design handbook and the component gallery on one site"
```
glab 已登入時，單獨執行 `glab mr update feat/handbook --description "$(cat <scratchpad>/mr4.md)"`；沒登入就在 H4 把 `mr4.md` 的完整路徑交給使用者。
`mr4.md` 寫明：Task 9–11 改了什麼；Production 的根目錄會從 Storybook 換成手冊，Storybook 搬到 `/storybook/`；要看哪幾頁；pipeline 的外部網址清單在 build job 的 log 裡。
Run（glab 已登入時）：`glab ci status --branch feat/handbook`　Expected：`build`、`tokens:lint`、`deploy:not-protected` 都是 passed。沒登入時請使用者在 MR 頁面確認。

- [ ] **Step 8: 檢查點 H4：停下，回報 MR 網址，請使用者合併；合併後由 Claude 確認以下各項，結果回報使用者**
1. main pipeline 全綠，`deploy:production` 部署的是 `site/`。
2. `curl -sI https://tzuchi-uikit.pages.dev/storybook` 回 301 或 308，`location` 指向 `/storybook/`。
3. `/`、`/storybook/`、`/storybook/LICENSE`、`/storybook/NOTICE.md` 都回 200；`/` 的 `<title>` 是手冊的標題；`/no-such-page` 回 404，內容是手冊的 404 頁。
4. build job 的 log 裡，docs 的外部請求是 0。
收到使用者確認後，才做 Task 12。

### Task 12: 同步到 1a 最終版、文件、1a 驗收（§14 第 7 步）

目的：sync 要求清單，同步到 MR4 合併後的 uikit main，更新 §6.3 的 1a 文件，完成 §9.2 中 Claude 能做的驗收，列出要人做的項目，經使用者同意把 `ci-tokens/1a` 合併回 `tzuchi/main`。

**執行位置**：`/Users/kaellim/Desktop/projects/puck`，分支 `ci-tokens/1a`。前提：MR3、MR4 已合併，Production pipeline 已部署。

**設計決定**：
- `packages/tokens/test/`（Task 7、8 的 node:test 和夾具）會被既有的 `(^|\/)(__tests__|tests?)\/` 規則（`sync-uikit.mjs:54-55`）刪掉並記進 `removed`；只改註解，不改規則。`lib/`、`lint-tokens.mjs`、`naming-rules.json` 照常 vendor，sync 不執行 `lint-tokens.mjs`（它需要 `git`，權限模式不准開子程序）。
- 驗收腳本放在 git 忽略的 `.superpowers/plan-work/ci-tokens/acceptance/`，從 repo 內執行才解析得到 root 的 `puppeteer`。Production 網址取自 uikit main 的 `apps/docs/astro.config.mjs` 的 `site`（Task 10/11 設定），不猜。
- 樣品室依 §13 D 只檢查外部網域落在允許清單內。
- 合併用 fast-forward（`tzuchi/main` 從來沒有 merge commit）。

**Files:**
- Modify: `scripts/uikit/sync-uikit.mjs`：`REMOVE_RULES` 裡 `// Stories and tests` 那條規則的註解、`REQUIRED_FILES`、`REQUIRED_BUILD_OUTPUTS`（Task 4 已讓行號移動，用名稱定位）
- Modify: `scripts/uikit/uikit.test.mjs:101`、`:126-153`
- Modify: `CLAUDE.md:44,223-224`、`README.md:10,142`、`vendor/uikit/README.md`、`docs/superpowers/specs/2026-10-12-s2-block-spec-design.md`（§18 表尾）、`docs/superpowers/specs/2026-10-08-tzuchi-puck-roadmap.md`（§3 表尾）、`CHANGELOG.md:60` 之後
- Create（git 忽略）：`.superpowers/plan-work/ci-tokens/acceptance/requests.mjs`、`…/acceptance/1a-report.md`

**Interfaces:**
- Consumes：`@tzuchi/tokens/tokens.list.json`（Task 7 的 `TokenList`，`schemaVersion: 1`）、`lint-tokens.mjs` 的退出碼（Task 8）、Production 網址。
- Produces：`REQUIRED_BUILD_OUTPUTS = ["packages/tokens/dist/tokens.css", "packages/tokens/dist/tokens.list.json"]`；`REQUIRED_FILES` 加 `"packages/tokens/lib/token-list.mjs"`、`"packages/tokens/lib/output-references.mjs"`（兩個 Style Dictionary 設定都 import 後者，Task 7）。

- [ ] **Step 1: 寫會失敗的測試**
`uikit.test.mjs:101` 的清單改成 `["tokens.css", "tokens.js", "tokens.d.ts", "tokens.list.json"]`，並加：
```js
assert.deepEqual(REQUIRED_BUILD_OUTPUTS, ["packages/tokens/dist/tokens.css", "packages/tokens/dist/tokens.list.json"]);
const list = readJson(join(vendorDir, "packages/tokens/dist/tokens.list.json"));
assert.equal(list.schemaVersion, 1);
assert.equal(list.prefix, "tc");
```
`REMOVE_RULES` 測試的「移除」清單加 `packages/tokens/test/token-list.test.mjs`、`packages/tokens/test/fixtures/basic/src/primitive/color.tokens.json`；「保留」清單加 `packages/tokens/lib/token-list.mjs`、`packages/tokens/lib/output-references.mjs`、`packages/tokens/lint-tokens.mjs`、`packages/tokens/naming-rules.json`。
- [ ] **Step 2: 跑測試，確認失敗**
Run: `node --test scripts/uikit/uikit.test.mjs`
Expected：FAIL，`tokens.list.json` 不在 `source.files`，`REQUIRED_BUILD_OUTPUTS` 只有一項。
- [ ] **Step 3: 實作**
`REQUIRED_BUILD_OUTPUTS` 加 `"packages/tokens/dist/tokens.list.json"`；`REQUIRED_FILES` 加 `"packages/tokens/lib/token-list.mjs"`、`"packages/tokens/lib/output-references.mjs"`；`:54` 註解改成 `// Stories and tests, such as the node:test files and fixtures of packages/tokens/test/ (they need the uikit checkout and are never run here)`。
- [ ] **Step 4: 同步到 MR4 合併後的 main**
```bash
git -C ../tzuchi-uikit fetch origin && M4=$(git -C ../tzuchi-uikit rev-parse origin/main)
pnpm sync:uikit -- --commit "$M4"
git diff --stat vendor packages/blocks/generated
```
接著照 Global Constraints 執行 `git diff --stat -- vendor/uikit/heroui/styles/src`，預期沒有輸出。
Expected：結束碼 0；`SOURCE.json` 的 `removed` 多出 `packages/tokens/test/**`；新增 `packages/tokens/dist/tokens.list.json`、`lib/token-list.mjs`、`lib/output-references.mjs`、`lint-tokens.mjs`、`lib/lint/*.mjs`、`naming-rules.json`；`dist/tokens.css` 和 Task 6 相同。`tokens.css` 有變時，用 `git -C ../tzuchi-uikit log <Task 6 的 M2>..$M4 -- packages/tokens/src` 找出原因寫進 commit 訊息。然後 `node --test scripts/uikit/uikit.test.mjs` 全部 pass。
- [ ] **Step 5: 文件**（照 §6.3 1a；確切寫法）
  - `CLAUDE.md:44`：`pnpm sync:uikit -- --commit <sha>   # refresh vendor/uikit and generated/uikit-options.json from a commit on uikit's origin/main`；`:223` 的 "from uikit's `spike/heroui-v3` branch" 改成 "from the `main` branch of uikit (tcgitlab `tzuchi/tzuchi-uikit`)"。
  - `CLAUDE.md:224` 改寫為：`--dir` 預設 `../tzuchi-uikit`、`--branch` 預設 `origin/main`（其他分支要加 `--allow-branch`，`pnpm test` 拒絕這種快照）；sync 不 fetch；版本檢查（uikit lockfile 的 `packages/tokens` 與 root 的 style-dictionary 必須相同，記在 `SOURCE.json` 的 `styleDictionary`）；權限模式的確切旗標、`env: {}`、只授權 `node_modules/.pnpm` 的理由；`REQUIRED_BUILD_OUTPUTS` 與「build 不可改到 `dist/` 以外的檔案」。新增一條「After a uikit MR merges」：`git -C ../tzuchi-uikit fetch origin` → 在 `ci-tokens/*` 或其他分支跑 `pnpm sync:uikit -- --commit $(git -C ../tzuchi-uikit rev-parse origin/main)` → 看 `git diff`，特別是 `git diff --stat -- vendor/uikit/heroui/styles/src`（這些程式會在 jest、`next build` 和 Storybook 建置時以使用者的權限執行，權限模式管不到，有變更就先看過）→ `pnpm verify` → commit `vendor/uikit` 與 `uikit-options.json` → 經使用者同意合併。另外寫明殘留風險：權限模式擋不住送訊號（`process.kill`），也沒有限制記憶體，這部分靠「只接受 main 上的 commit」和 MR 審查。
  - `README.md:10`、`:142` 和 `vendor/uikit/README.md:3,8,24,27-38,40`：同樣的來源、預設分支、九個步驟（多了版本檢查、權限模式、build 產物、受追蹤檔案檢查），`:40` 改寫成「style-dictionary 與 uikit 相同（`SOURCE.json` 的 `styleDictionary`），≥ 5.5.5；R3 提到的兩則 advisory 只在 Style Dictionary 自己的 repo 公告，`pnpm audit` 查不到，要人工追蹤」。
  - S2 §18 表尾加：`| 33 | §12 | sync:uikit 的來源改為 tcgitlab 的 tzuchi/tzuchi-uikit（本機 ../tzuchi-uikit），只接受 origin/main 上的 commit（其他分支要加 --allow-branch）；uikit 的 build.mjs、check.mjs 在 Node 權限模式下執行；uikit 與 tceditor 的 style-dictionary 必須是同一個精確版本（記在 SOURCE.json 的 styleDictionary），兩邊一起升到 <V> | CI 設計規範共編第一階段（2026-10-21-ci-tokens-coediting-design.md §6.1、§6.2）；4.4.0 有 GHSA-vj5c-m527-mpff |`（表格內容加反引號，與既有列一致）。
  - 路線圖 §3 表尾加：`| CT | CI 設計規範共編 | 設計 tokens 以 uikit 為唯一來源；手冊與 HeroUI 元件樣品室公開上線（1a）；改名保護（1b） | S2 | 1a 完成（<Step 5 當天的日期>）。規格見 2026-10-21-ci-tokens-coediting-design.md |`。
  - `CHANGELOG.md` 在第 60 行之後加四條：sync 的來源與 `--allow-branch`；權限模式與三項新檢查；style-dictionary 升到 `<V>`（GHSA-vj5c-m527-mpff）並加 `minimumReleaseAge`；`packages/blocks` 的 CSS 遠端網址測試。
- [ ] **Step 6: 自動驗收（§9.2 第 2、3、4、5、7 項）**
`requests.mjs <prodUrl> <out.json>`：讀 `<prod>/sitemap-index.xml` 的每個子 sitemap，取所有 `<loc>`（拿不到就收首頁所有 `a[href^="/"]`）；puppeteer 逐頁 `goto(..., { waitUntil: "networkidle0" })`，記錄每個 request 與 response 狀態；再讀 `<prod>/storybook/index.json`，逐一開 `type === "docs"` 的 `iframe.html?viewMode=docs&id=<id>`。另抽 10 筆清單 token（排序後索引 `Math.floor(i * n / 10)`），在對應 token 頁找出 `cssVar`，比對頁面上的亮色、深色值等於清單的 `light.value`、`dark.value`。退出碼 1 的條件：手冊有任何 origin 不同的請求或任何 ≥ 400 的回應；樣品室出現允許清單 `heroui-assets.nyc3.cdn.digitaloceanspaces.com`、`img.heroui.chat`、`api.iconify.design`、`api.simplesvg.com`、`api.unisvg.com` 以外的網域，或出現 `fonts.googleapis.com`、`swapi.py4e.com`、`pokeapi.co`；抽查不符；樣品室 iframe 的 `<html data-theme>` 不是 `tzuchi`。
```bash
PROD=$(git -C ../tzuchi-uikit show origin/main:apps/docs/astro.config.mjs | sed -n "s/.*site: *['\"]\([^'\"]*\)['\"].*/\1/p")
[ "$PROD" = "https://tzuchi-uikit.pages.dev" ] || { echo "unexpected site: $PROD"; exit 1; }   # 裁定 8
node .superpowers/plan-work/ci-tokens/acceptance/requests.mjs "$PROD" .superpowers/plan-work/ci-tokens/acceptance/requests.json; echo "exit $?"
curl -sI "$PROD/storybook" | grep -iE '^(HTTP|location)'
git -C ../tzuchi-uikit show origin/main:pnpm-lock.yaml | grep -E "^  '?(sharp|vite|astro)@"
```
Expected：`exit 0`；`/storybook` 回 3xx，`location: /storybook/`；`sharp@0.35.5` 以上，astro 帶的 `vite@8.x` ≥ 8.3.3，樣品室的 `vite@7.3.7`。
第 7 項（本機拋棄式分支，不推）：
```bash
cd ../tzuchi-uikit && git status --short && git switch -c drill/lint-missing origin/main && pnpm install --frozen-lockfile && pnpm --filter @tzuchi/tokens build
printf '\n.drill { color: var(--tc-drill-missing); }\n' >> heroui/styles/themes/tzuchi/components/button.css
(cd packages/tokens && node lint-tokens.mjs); echo "exit $?"
git restore heroui/styles/themes/tzuchi/components/button.css && git switch - && git branch -D drill/lint-missing
```
Expected：`git status --short` 在切分支前沒有輸出；印出 `rule 7 error heroui/styles/themes/tzuchi/components/button.css:<行> …--tc-drill-missing…`（必須看到這個名稱，不能只看退出碼：清單不存在時也是 1），`exit 1`；指令和 Task 11 的 `tokens:lint` job 的 script 相同（不同就照 job 的寫法跑）。
- [ ] **Step 7: 全部檢查**
Run: `pnpm verify`
Expected：結束碼 0；`node -p 'require("./vendor/uikit/SOURCE.json").repository'` 印 `tzuchi/tzuchi-uikit`。結果和 Step 6 的輸出寫進 `.superpowers/plan-work/ci-tokens/acceptance/1a-report.md`。
- [ ] **Step 8: Commit**
```bash
git add scripts/uikit/sync-uikit.mjs scripts/uikit/uikit.test.mjs vendor/uikit packages/blocks/generated/uikit-options.json
git commit -m "build: require the uikit token list and sync uikit <M4 短 sha>" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git add CLAUDE.md README.md CHANGELOG.md docs/superpowers/specs/2026-10-12-s2-block-spec-design.md docs/superpowers/specs/2026-10-08-tzuchi-puck-roadmap.md
git commit -m "docs: document the uikit sync from tzuchi/tzuchi-uikit main" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
（`vendor/uikit/README.md` 隨第一個 commit 一起進去。）
- [ ] **Step 9: 給使用者的人工驗收清單，並請求合併**
停下來，回報 `1a-report.md` 的結果，並請使用者（或宇軒）完成：
1. tcgitlab 上 uikit main 的 pipeline 全綠（含 `tokens:lint`）；Production 根目錄是手冊、`/storybook/` 是預設慈濟主題、看不到 HeroUI 的 logo 和品牌（§9.2 第 1 項的目視部分）。
2. 在乾淨的電腦上照 uikit 的 `CONTRIBUTING.md` 從 clone 做到開出 MR（§9.2 第 6 項）。
3. §5.1「合併後由人做」都已完成：`spike/heroui-v3` 移出保護或刪除、staging 舊部署已刪、`main` 的 push／merge 權限、「Pipelines must succeed」、fast-forward 合併。
4. 同意把 `ci-tokens/1a` 合併回 `tzuchi/main`。
- [ ] **Step 10: 使用者同意後合併**
```bash
git switch tzuchi/main && git merge --ff-only ci-tokens/1a
```
不能 fast-forward（`tzuchi/main` 有新 commit）時：`git switch ci-tokens/1a && git rebase tzuchi/main && pnpm verify`，通過後**再問一次使用者**，同意了才 `--ff-only` 合併。不 push（tceditor 沒有遠端）。

**里程碑 1a 完成。** 回報使用者：手冊和 HeroUI 元件樣品室已公開上線，以及 Task 12 的驗收結果。區塊樣品室的公開屬於規格 §13 C 的另一個小階段，不在本計畫。

---

## 里程碑 1b：改名保護

### Task 13: 別名輸出與棄用標記

目的：純別名一律輸出 `var()`，讓舊名在深色模式下跟著新名變；`$deprecated` 會往下傳、會寫進 CSS 註解和清單；目標有深色覆寫的棄用別名，在深色區塊也多一行。現有名稱不改，預期的 CSS 差異只有 9 個 shadow 別名。

**執行位置**：uikit。H4 已合併、Task 12 完成（里程碑 1a）之後；專案已設成 fast-forward 合併（§13 H，由人設定）。分支 `feat/rename-protection`：`git fetch origin && git switch -c feat/rename-protection origin/main`。Task 14 接著在同一條分支上做。

**設計決定**：
- 純別名的判斷看 `token.original.$value`，它是 SD 解析前的原始值（研究 phase1-style-dictionary §3.2）。數字別名現在已經輸出 `var()`（`style-dictionary.config.mjs:29` 只排除 typography 和 shadow），typography 沒有純別名，所以只有 9 個 shadow 會變。它們的名稱和預期的新值：`--tc-card-elevation`、`--tc-article-card-elevation`、`--tc-book-card-elevation` → `var(--tc-elevation-1)`；三者的 `-hover` → `var(--tc-elevation-3)`；`--tc-navbar-drawer-elevation`、`--tc-tooltip-shadow` → `var(--tc-elevation-2)`；`--tc-modal-shadow` → `var(--tc-elevation-4)`（舊值見 tceditor `vendor/uikit/packages/tokens/dist/tokens.css:152-224`）。
- HeroUI 主題 CSS 沒有讀這 9 個變數，只在註解提到（`heroui/styles/themes/tzuchi/components/card.css:16`、`modal.css:68`），讀它們的只有凍結的 Lit 元件（`packages/components/src/card/…styles.ts`）。所以 `variables.css` 不變，HeroUI 樣品室的畫面也不會變；真正看得到變化的是手冊的深色值，以及下面 Step 7 的對照頁。
- 棄用註解寫成 `已棄用：改用 <replacedBy 的 id>`，不用 `$deprecated` 字串：SD 會把 `$description` 裡的 `{…}` 解成值（`badge.tokens.json:6` 的 `{radius.full}` 輸出成 `tokens.css:154` 的 `9999px`）。
- 深色的別名行由 `build.mjs` 傳進深色設定（`createDarkConfig({ aliases })`），不把 semantic 和 component 加進深色 build 的 source。加進去的話，同一個 id 會出現兩次（`themes/dark` 和 `semantic` 都有 `color.brand.primary`）。
- 測試在 fixture 目錄裡 `process.chdir` 之後，用兩份正式設定和 `formatPlatform('css')` 產生 CSS，不寫檔。`node --test` 每個檔案各開一個程序，所以 `chdir` 不會互相影響。

**Files:**
- Modify: `packages/tokens/lib/output-references.mjs`（Task 7 建立）
- Create: `packages/tokens/lib/deprecation.mjs`
- Create: `packages/tokens/test/output-references.test.mjs`、`packages/tokens/test/deprecation.test.mjs`
- Create: `packages/tokens/test/fixtures/deprecation/src/{primitive/base,semantic/color,component/card,themes/dark/color,themes/dark/elevation}.tokens.json`
- Modify: `packages/tokens/style-dictionary.config.mjs:29`（並加上 `hooks.preprocessors`、`preprocessors`）
- Modify: `packages/tokens/style-dictionary.dark.config.mjs:20`、`:64-79`（改成工廠函式）
- Modify: `packages/tokens/build.mjs`（Task 7 版）、`packages/tokens/lib/token-list.mjs`（Task 7 寫 `deprecated: null` 和 `hasDarkOverride` 的地方）
- Modify: `packages/tokens/test/token-list.test.mjs`（Task 7 的兩個斷言，見 Step 2）

**Interfaces:**
- Consumes：Task 7 的 `createTokenList({ light, dark, pkg })`、`TokenEntry`；Task 7 的 `build.mjs` 已經對兩個實例呼叫 `getPlatformTokens('css')`。
- Produces：
  - `outputReferences(token) → boolean`、`PURE_REFERENCE`（`/^\{[^{}]+\}$/`）（`lib/output-references.mjs`）
  - `EXTENSION_KEY = "tw.org.tzuchi"`；`deprecationInfo(node, inherited?) → null | { message, replacedBy, since }`；`deprecationNote(info) → string`；`deprecationPreprocessor(tree) → tree`（註冊名 `tc/deprecation`）；`stripDeprecationNote(description, info) → string | null`；`deprecatedDarkAliases({ light, dark }) → { name, target }[]`，依 `name` 排序（`lib/deprecation.mjs`）
  - `createDarkConfig({ aliases = [] } = {})`，default export 仍是 `createDarkConfig()`
  - `createTokenList({ light, dark, pkg, darkAliases = [] })`：`darkAliases` 是 `deprecatedDarkAliases` 的結果。這些舊名的 `hasDarkOverride` 為 `true`，深色宣告是 `var(<target>)`，深色值沿 target 解析。這樣 `hasDarkOverride` 仍然等於「在 `tokens.css` 深色區塊有宣告」，Task 7 的 `check.mjs` 雙向比對不必改（共用介面）。
  - 清單的 `deprecated` 改成實際值；`description` 去掉棄用前綴。

- [ ] **Step 1: 留下「改之前」的產物**
Run: `pnpm --filter @tzuchi/tokens build && mkdir -p ~/Desktop/projects/puck/.superpowers/plan-work/ci-tokens/shadow && cp packages/tokens/dist/tokens.{css,js,list.json} ~/Desktop/projects/puck/.superpowers/plan-work/ci-tokens/shadow/`，然後把三個檔名加上 `before.` 前綴。接著照 Step 7 的方法拍「改之前」的截圖。

- [ ] **Step 2: 寫 fixture 和會失敗的測試**
fixture 的內容：
- primitive：`color.blue.900`=`#1b2d58`、`color.blue.300`=`#a9c2ea`（群組 `$type: color`）；`elevation.1` 是 shadow `{color:"#0000001a",offsetX:"0px",offsetY:"1px",blur:"2px",spread:"0px"}`。
- semantic：`color.accent.default`=`{color.blue.900}`；`color.brand.primary`=`{color.accent.default}`，加 `$deprecated: "改用 {color.accent.default}"` 和 `$extensions["tw.org.tzuchi"]={replacedBy:"color.accent.default",since:"2026-11-15"}`；群組 `color.legacy` 設 `$deprecated: "整組改用 color.accent"`，子 token `surface`=`{color.accent.default}`，`$description: "舊的底色"`，`$extensions` 同上；`color.legacy.keep`=`{color.blue.900}`，設 `$deprecated: false`。
- component `card.elevation`：`$type: shadow`、`{elevation.1}`。
- 深色：`color.accent.default`=`{color.blue.300}`；`elevation.1` 的 color 是 `#00000059`。
```js
test("pure aliases of any type output var()", () => {
  assert.equal(outputReferences({ $type: "shadow", original: { $value: "{elevation.1}" } }), true);
  assert.equal(outputReferences({ $type: "shadow", original: { $value: { color: "#000", offsetX: "0px", offsetY: "1px", blur: "2px", spread: "0px" } } }), false);
  assert.equal(outputReferences({ $type: "typography", original: { $value: { fontSize: "{font.size.16}" } } }), false);
  assert.equal(outputReferences({ $type: "dimension", original: { $value: "calc({space.4} * 2)" } }), true);
});
test("group $deprecated reaches children unless they opt out", () => {
  const t = deprecationPreprocessor(structuredClone(fixtureSemanticTree));
  assert.equal(t.color.legacy.surface.$deprecated, "整組改用 color.accent");
  assert.equal(t.color.legacy.surface.$description, "已棄用：改用 color.accent.default。舊的底色");
  assert.equal(t.color.legacy.keep.$deprecated, false);
});
test("light CSS marks deprecated aliases and keeps shadow aliases as var()", async () => {
  // light = (await new StyleDictionary(baseConfig).formatPlatform("css"))[0].output，cwd = fixture
  assert.match(light, /--tc-color-brand-primary: var\(--tc-color-accent-default\); \/\*\* 已棄用：改用 color\.accent\.default \*\//);
  assert.match(light, /--tc-card-elevation: var\(--tc-elevation-1\);/);
});
test("dark block aliases deprecated names whose target has a dark override", async () => {
  assert.deepEqual(deprecatedDarkAliases({ light: lightTokens, dark: darkTokens }), [
    { name: "--tc-color-brand-primary", target: "--tc-color-accent-default" },
    { name: "--tc-color-legacy-surface", target: "--tc-color-accent-default" },
  ]);
  assert.equal(darkCss.match(/--tc-color-brand-primary: var\(--tc-color-accent-default\);/g).length, 2); // [data-theme] 和 @media 各一次
  assert.doesNotMatch(darkCss, /--tc-card-elevation/);
});
test("dark alias lines are marked hasDarkOverride, so check.mjs stays two-way", () => {
  // list = createTokenList({ light, dark, pkg, darkAliases })，darkCss = 夾具建出的深色區塊
  const declared = new Set([...darkCss.matchAll(/^\s*(--tc-[\w-]+):/gm)].map((m) => m[1]));
  assert.deepEqual(new Set(list.tokens.filter((t) => t.hasDarkOverride).map((t) => t.cssVar)), declared);
  assert.deepEqual(byId(list, "color.brand.primary").dark, { value: "#a9c2ea", css: "var(--tc-color-accent-default)", chain: ["color.accent.default", "color.blue.300"] });
});
test("the token list carries deprecation and the plain description", () => {
  const e = byId(list, "color.legacy.surface");
  assert.deepEqual(e.deprecated, { message: "整組改用 color.accent", replacedBy: "color.accent.default", since: "2026-11-15" });
  assert.equal(e.description, "舊的底色");
  assert.equal(byId(list, "card.elevation").dark.value, "0px 1px 2px 0px #00000059");
});
```
- [ ] **Step 3: 跑測試，確認失敗**
Task 7 的 `test/token-list.test.mjs` 同時改兩個斷言，它們描述的正是這次要修的行為：
- 真實清單 `--tc-modal-shadow` 的深色值改成 `{ value: '0px 12px 28px 0px #00000099', css: 'var(--tc-elevation-4)', chain: ['elevation.4'] }`（`deepEqual` 整個 `dark`）；
- 夾具 `button.shadow` 的深色 `chain` 改成 `['elevation.1']`，`css` 是 `var(--tc-elevation-1)`。

Run: `cd packages/tokens && node --test "test/*.test.mjs"`
Expected: FAIL，`deprecation.mjs` 不存在，`outputReferences` 對 shadow 純別名仍回傳 false，Task 7 那兩個改過的斷言也失敗。

- [ ] **Step 4: 實作**
- `outputReferences`：原始值是字串，而且符合 `PURE_REFERENCE` 時回傳 true；其他情況照舊，`$type` 不是 typography 也不是 shadow 才回傳 true。兩份設定都改 import 它。
- `deprecationPreprocessor`：深度優先走過整棵樹，帶著上層的 `$deprecated`；子節點自己的 `$deprecated`（包括 `false`）優先。被棄用的 token 寫回 `$deprecated`，`$description` 改成 `deprecationNote(info)`，原本有說明的話接 `。<原說明>`。`deprecationNote`：有 `replacedBy` 時是 `已棄用：改用 <replacedBy>`，否則是 `已棄用`。`message` 是 `$deprecated` 字串；值是 `true` 時用 `"已棄用"`。
- 基礎設定加上 `hooks: { preprocessors: { "tc/deprecation": deprecationPreprocessor } }` 和 `preprocessors: ["tc/deprecation"]`，深色設定也加。
- `createDarkConfig({ aliases })`：`darkThemeFormat` 在 `decls` 後面，依序加上 `${name}: var(${target});`。
- `build.mjs` 的順序：亮色 build → `light = getPlatformTokens` → 用 `createDarkConfig()` 建探測實例取 `dark` → `aliases = deprecatedDarkAliases({ light, dark })` → `new StyleDictionary(createDarkConfig({ aliases })).buildAllPlatforms()` → 接上 `_dark.css` → 寫清單。
- `deprecatedDarkAliases`：挑出被棄用、原始值是純參照，而且參照目標的 id 在 `dark.allTokens` 中 `filePath` 含 `/themes/dark/` 的 token。
- `token-list.mjs`：`deprecated: deprecationInfo(token.original)`，`description: stripDeprecationNote(token.$description, deprecated)`；`darkAliases` 照 Interfaces 併入深色宣告表。`build.mjs` 把 `aliases` 傳給 `createTokenList`。

- [ ] **Step 5: 跑測試，確認通過**
Run: `pnpm --filter @tzuchi/tokens test`
Expected: PASS，最後一行是 `tokens check OK (light + dark)` 之後 node:test 的 `# fail 0`。

- [ ] **Step 6: 確認真實輸出只有 9 行改變**
Run: `S=~/Desktop/projects/puck/.superpowers/plan-work/ci-tokens/shadow; diff <(sort "${S:?}/before.tokens.css") <(sort packages/tokens/dist/tokens.css); cmp "${S:?}/before.tokens.js" packages/tokens/dist/tokens.js; pnpm run heroui:theme && git diff --exit-code -- heroui/styles/themes/tzuchi/variables.css`
Expected：diff 正好 9 個 `<` 和 9 個 `>`，都是上面那 9 個名稱，而且新值符合設計決定列的對應；`cmp` 沒有輸出；`git diff` 以 0 結束。另外用不排序的 `diff` 看行的位置有沒有移動，有移動就寫進 MR 說明。有其他差異就停下來查（規格 §5.2）。

- [ ] **Step 7: 拍子鈞確認用的前後截圖**
- 截圖存在 `…/ci-tokens/shadow/{before,after}/`。
- 用 tceditor 的 puppeteer 寫 `…/shadow/shots.mjs`，用 `createRequire("/Users/kaellim/Desktop/projects/puck/package.json")` 載入 puppeteer。
- 拍三種畫面：
  1. **對照頁** `…/shadow/compare.html`（只在 Step 7 拍）：左右兩欄分別載入 `before.tokens.css` 和新的 `tokens.css`，各畫 9 個 `box-shadow: var(<名稱>)` 的方塊，在 `<html data-theme="light">` 和 `data-theme="dark"` 下各拍一張。
  2. **手冊**：Task 10 的元件 tokens 頁（card、modal、tooltip），用 `pnpm docs:dev`（4321）開。
  3. **樣品室**（對照組，預期前後相同）：用 `pnpm heroui:storybook`（6007）開，拍 `iframe.html?id=components-layout-card--default&globals=heroui-theme:tzuchi-dark`，以及 `components-overlays-modal--default`（先點開觸發按鈕再拍）。
- 伺服器照 Global Constraints 啟動和停止。

- [ ] **Step 8: Commit**
```bash
pnpm exec prettier --write packages/tokens && pnpm lint
git add packages/tokens/lib/output-references.mjs packages/tokens/lib/deprecation.mjs packages/tokens/lib/token-list.mjs packages/tokens/style-dictionary.config.mjs packages/tokens/style-dictionary.dark.config.mjs packages/tokens/build.mjs packages/tokens/test/output-references.test.mjs packages/tokens/test/deprecation.test.mjs packages/tokens/test/token-list.test.mjs packages/tokens/test/fixtures/deprecation
git commit -m "feat(tokens): emit var() for every pure alias and mark deprecated tokens

The 9 shadow aliases now follow the dark elevation scale.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 14: 名稱登記、規則 1–6 與 8、手冊命名規範頁 → MR5

目的：
- build 產生並 commit `token-names.json`；
- `lint-tokens` 加上規則 1–6 和規則 8 的統計；
- 規則檔補上命名規則，手冊的命名規範頁改由規則檔產生；
- CLAUDE.md 第 5 條換成 1b 版；
- 推 MR5。

**執行位置**：uikit，分支 `feat/rename-protection`（接續 Task 13）。

**設計決定**：
- 「消失」的名稱由 build 自動標成 `removed`：`computeTokenNames` 讀上一版登記檔，現在不存在的名稱都改成 `removed`。規則 6 只比對 `origin/main` 的登記檔和工作目錄的登記檔。允許的轉換：新名稱、`active→deprecated`、`deprecated→removed`、`deprecated→active`。其他轉換都是錯誤，名稱從登記檔消失也是。
- 規則 6 另外用記憶體重算一次登記檔，和磁碟上的比對，過期就報錯。這是讓本機也能抓到；CI 由 build job 的 `git diff` 擋（規格審查 feasibility #4）。
- 規則 1–5 讀原始 JSON，不讀 SD 的結果，因為要報 `file:line`。行號由一個小掃描器取得：逐字掃描，追蹤字串（含跳脫）、目前行號和鍵的堆疊，遇到 `"key":` 就記下這個路徑的行號。
- 型別：token 自己或群組的 `$type`；沒有的話（semantic 色和深色覆寫都沒寫 `$type`，`semantic/color.tokens.json:4`），沿純參照用目標的型別。
- 規則檔用現有的命名填，跑真實的 tokens 一定要零錯誤。`container` 同時是 primitive（`scale.tokens.json:73`）和 component（`component/container.tokens.json`）的根群組，列在 `sharedRoots`。

**Files:**
- Create: `packages/tokens/lib/token-names.mjs`、`packages/tokens/lib/lint/json-lines.mjs`、`packages/tokens/lib/lint/sources.mjs`、`packages/tokens/lib/lint/naming.mjs`（規則 1–5、8）、`packages/tokens/lib/lint/registry.mjs`（規則 6）
- Create: `packages/tokens/test/naming.test.mjs`、`packages/tokens/test/registry.test.mjs`、`packages/tokens/token-names.json`（由 build 產生）
- Create: `apps/docs/src/components/NamingRules.astro`
- Modify:
  - `packages/tokens/naming-rules.json`（Task 8 版，加三個鍵）
  - `packages/tokens/lint-tokens.mjs`（Task 8 版）
  - `packages/tokens/build.mjs`
  - `packages/tokens/package.json`：`exports` 加 `"./naming-rules.json": "./naming-rules.json"`
  - `.prettierignore`：加 `packages/tokens/token-names.json`
  - `.gitlab-ci.yml`：build job 裡既有的那行 `git diff --exit-code -- heroui/styles/themes/tzuchi/variables.css` 後面加上 ` packages/tokens/token-names.json`
  - `packages/tokens/test/lint-cli.test.mjs`（Task 8 版）：CLI 現在也跑規則 1–6，暫存的 root 要先 `git init` 並 commit，並放一個最小的 `packages/tokens/src/primitive/color.tokens.json`；CLI 改帶 `--base HEAD`（不是 `origin/<b>` 就不 fetch；`ls-tree` 找不到登記檔就略過規則 6）。另加一個情況：`packages/tokens/src` 底下沒有任何來源檔時，status 1，訊息含 `src`。
  - `apps/docs/src/content/docs/naming.mdx`（Task 10 建的命名規範頁，路徑以 Task 10 為準）
  - `CLAUDE.md` 第 5 條

**Interfaces:**
- Consumes：Task 7 的 `TokenList`（`dist/tokens.list.json`）；Task 8 的 `lint-tokens.mjs` CLI、`Issue`、退出碼規則；Task 13 的 `deprecationInfo`。
- Produces：
  - `computeTokenNames({ previous, list }) → { version: 1, names }`；`stringifyTokenNames(reg) → string`（鍵排序，`JSON.stringify(…, null, 2) + "\n"`）；`compareTokenNames(base, current) → { name, from, to }[]`（`lib/token-names.mjs`）
  - `keyLines(text) → Map<string, number>`
  - `parseTokenSources(files: { file, text }[], rules) → SourceToken[]`；`loadTokenSources(root, rules)`
  - `SourceToken = { id, file, line, layer: "primitive"|"semantic"|"component"|"theme"|null, root, fileRoot, type, value, refs, description, deprecated }`
  - `rule1…rule5(sources, rules) → Issue[]`；`descriptionStats(sources) → { total, missing }`
  - `checkRegistry({ root, base, list, git? }) → Promise<Issue[]>`
  - naming-rules.json 加上的三個鍵：
    - `"segment": { "pattern": "^[a-z0-9]+(-[a-z0-9]+)*$" }`
    - `"layers"`：
      - `primitive: { label: "基礎值", dir: "src/primitive", roots: ["color","elevation","space","radius","size","opacity","focus-ring","motion","z","breakpoint","container","font","line-height"], description }`
      - `semantic: { label: "語意", dir: "src/semantic", roots: ["color","typography"], description }`
      - `component: { label: "元件", dir: "src/component", rootEqualsFileName: true, sharedRoots: ["container"], description }`
    - `"deprecated": { "sincePattern": "^\\d{4}-\\d{2}-\\d{2}$" }`

- [ ] **Step 1: 寫會失敗的測試**
```js
test("rule 1 flags a non-kebab segment with its line", () => {
  const s = parseTokenSources([{ file: "packages/tokens/src/primitive/color.tokens.json", text: '{\n  "color": {\n    "blueDark": { "$type": "color", "$value": "#000" }\n  }\n}' }], rules);
  assert.deepEqual(rule1(s, rules).map((i) => [i.rule, i.severity, i.line]), [[1, "error", 3]]);
});
test("rule 2: component root must equal the file name; container may be shared", …); // root "btn" in button.tokens.json → 1 個錯誤；primitive 和 component 都有 container → 0 個
test("rule 2 rejects the same id defined in two non-theme files", …); // Review Focus 2：color.blue.900 同時寫在 primitive/color 和 primitive/extra → 1 個錯誤，指出兩個檔案；Style Dictionary 只會讓後者覆蓋前者
test("rule 3 rejects dark overrides of missing or deprecated tokens", …);       // 2 個錯誤
test("rule 4 rejects bad aliases", …); // 6 個 fixture 各報 1 個：值不是單一參照、replacedBy ≠ 參照、目標已棄用、型別不同、層不同、沒有 since
test("rule 5 rejects references to deprecated tokens", …);
test("the real tokens pass rules 1-5 and every token is counted", () => {
  const s = loadTokenSources(uikitRoot, realRules);
  for (const r of [rule1, rule2, rule3, rule4, rule5]) assert.deepEqual(r(s, realRules), []);
  assert.equal(descriptionStats(s).total, s.length);
});
test("registry transitions", () => {
  assert.deepEqual(compareTokenNames({ "--tc-a": "active" }, {}).map((v) => v.to), [null]);
  assert.equal(compareTokenNames({ "--tc-a": "active" }, { "--tc-a": "removed" }).length, 1);
  assert.equal(compareTokenNames({ "--tc-a": "removed" }, { "--tc-a": "active" }).length, 1);
  assert.equal(compareTokenNames({ "--tc-a": "active", "--tc-b": "deprecated" }, { "--tc-a": "deprecated", "--tc-b": "removed" }).length, 0);
});
test("computeTokenNames keeps removed names and sorts keys", () => {
  const reg = computeTokenNames({ previous: { version: 1, names: { "--tc-z": "active" } }, list: { tokens: [{ cssVar: "--tc-a", deprecated: null }] } });
  assert.equal(stringifyTokenNames(reg), '{\n  "version": 1,\n  "names": {\n    "--tc-a": "active",\n    "--tc-z": "removed"\n  }\n}\n');
});
```
`registry.test.mjs` 在 `mkdtemp` 裡用 `git init --bare` 建本機的 origin 和 clone，commit 時加 `-c user.name=t -c user.email=t@example.invalid`：
- main 上沒有登記檔 → `[]`；
- 分支沒有 rebase（HEAD 不包含 `origin/main`）→ 只有 1 個 issue，訊息含「先 rebase 到 main」；
- origin 的網址不存在 → 1 個錯誤，訊息含「無法取得 origin/main」；
- 工作目錄的登記檔和重算結果不同 → 1 個錯誤，訊息含「token-names.json 過期」；
- `active` 的名稱直接被移除 → 1 個錯誤，`line` 是那個名稱在檔案裡的行。

- [ ] **Step 2: 跑測試，確認失敗**
Run: `cd packages/tokens && node --test "test/*.test.mjs"`
Expected: FAIL，`Cannot find module '../lib/token-names.mjs'`。

- [ ] **Step 3: 實作規則 1–5、8 和登記檔**
- 規則 2：同一個 id 只能在一個非 `src/themes/` 的檔案定義，重複時報錯並列出兩個檔案（Style Dictionary 合併時後者會悄悄覆蓋前者）。primitive 和 semantic 的根群組必須在 `roots` 裡。component 的根群組必須等於檔名；如果它也是 primitive 或 semantic 的根群組，必須列在 `sharedRoots`。不在任何一層目錄、也不在 `src/themes/` 的檔案報錯。
- 規則 3 只看 `layer === "theme"` 的 token。
- 規則 4 對每個被棄用的非 theme token，逐項檢查以下各點，每一項各報一個 issue：值是單一參照 `{x}`；`replacedBy === x`；`x` 存在而且沒有被棄用；型別相同；層相同；`since` 符合 `sincePattern`。
- 規則 5 用 `refs`，也就是 `$value` 裡所有 `{…}`，包括複合值裡面的。
- `build.mjs` 寫完清單之後，讀上一版的 `token-names.json`（沒有就是 `null`），再寫回 `stringifyTokenNames(computeTokenNames({ previous, list }))`。

- [ ] **Step 4: 實作規則 6（`checkRegistry`）**
依序執行：
1. `base` 是 `origin/<b>` 時，執行 `git fetch --no-tags origin +refs/heads/<b>:refs/remotes/origin/<b>`。失敗就回傳錯誤「無法取得 origin/<b>」。
2. `git merge-base --is-ancestor <base> HEAD`：
   - 結果是 1，而且 `git rev-parse --is-shallow-repository` 是 `true` 時，執行 `git fetch --no-tags --deepen=50 origin`，最多 5 次，每次之後重新判斷；
   - 最後仍然不包含時，只回傳 `rule 6 error … HEAD 不包含 <base>，先 rebase 到 main`；
   - 其他退出碼一律回傳錯誤。
3. `git ls-tree --name-only <base> -- packages/tokens/token-names.json` 沒有輸出時，回傳 `[]`；指令失敗時回傳錯誤。
4. 用 `git show <base>:packages/tokens/token-names.json` 取出基準，先檢查是否過期，再跑 `compareTokenNames`。
`lint-tokens.mjs` 在規則 7 之前依序呼叫規則 1–6。規則 8 印一行 `rule 8 report packages/tokens/src: <missing>/<total> 個 token 沒有 $description`，不影響退出碼。

- [ ] **Step 5: 跑測試和真實的檢查**
Run: `pnpm --filter @tzuchi/tokens test && pnpm --filter @tzuchi/tokens lint; echo "exit $?"`
Expected：
- 測試 `# fail 0`；
- lint 沒有任何 `rule 1`～`rule 7` 的行，有一行 `rule 8 report packages/tokens/src: 410/420 個 token 沒有 $description`，最後是 `exit 0`（main 上還沒有登記檔，規則 6 略過）。
`git status --short packages/tokens` 只多出 `token-names.json`：420 個 token 中 398 個不同的名稱，全部是 `active`。

- [ ] **Step 6: 手冊的命名規範頁**
- `NamingRules.astro` import `@tzuchi/tokens/naming-rules.json`，畫出三部分：
  - 名稱片段規則（`segment.pattern`）；
  - 每一層一列：`label`、`description`、`dir`，以及允許的根群組。component 那一列顯示「根群組等於檔名」和 `sharedRoots` 例外。
  - 棄用寫法：`since` 格式，以及 `$extensions["tw.org.tzuchi"]`。
- 命名規範頁手寫的層級表換成 `<NamingRules />`，頁上的說明改成 1b 的規則（先棄用、後移除）。
Run: `pnpm --filter @tzuchi/docs build && grep -c "focus-ring" apps/docs/dist/naming/index.html && ! grep -rn "var(--tc-" apps/docs/src`
Expected：build 成功，`grep -c` 至少 1，最後一個 `grep` 沒有輸出。

- [ ] **Step 7: CLAUDE.md 第 5 條換成 1b 版，「推之前必跑的檢查」加上：規則 6 需要先 `git fetch origin` 並 rebase 到 main**
整條換成：
「5. **不可直接刪除或改名 token。** 新增或改名都要符合 `packages/tokens/naming-rules.json`。改名分兩個 MR：(甲) 新增新名；舊名的 `$value` 改成 `{新id}`，加上 `$deprecated` 和 `$extensions["tw.org.tzuchi"] = { replacedBy, since: "YYYY-MM-DD" }`；其他 token 的 `{舊id}` 參照、深色覆寫、`generate.mjs` 的對照表、主題 CSS（含 `var(--tc-舊名)`）、`check.mjs`、手冊用到的固定 id（`apps/docs/scripts/theme-css.mjs` 的 `THEME_MAP` 等）都改用新名；`lint-tokens` 不可有錯誤或警告（規則 8 的統計除外）。(乙) 使用者確認 tceditor 已經同步到甲之後才能移除舊名，MR 說明要附 tceditor `vendor/uikit/SOURCE.json` 的 commit；build 會把舊名標成 `removed`。`removed` 的名稱永遠不可再用。改過 tokens 一定要跑 build，並把 `token-names.json` 一起 commit。」

- [ ] **Step 8: 整體檢查**
Run: `pnpm exec prettier --write packages/tokens apps/docs CLAUDE.md && pnpm --filter @tzuchi/tokens test && pnpm run heroui:theme && git diff --exit-code -- heroui/styles/themes/tzuchi/variables.css packages/tokens/token-names.json && pnpm lint`
Expected：全部以 0 結束。

- [ ] **Step 9: Commit**
```bash
git add packages/tokens/lib/token-names.mjs packages/tokens/lib/lint/json-lines.mjs packages/tokens/lib/lint/sources.mjs packages/tokens/lib/lint/naming.mjs packages/tokens/lib/lint/registry.mjs packages/tokens/test/naming.test.mjs packages/tokens/test/registry.test.mjs packages/tokens/test/lint-cli.test.mjs packages/tokens/token-names.json packages/tokens/naming-rules.json packages/tokens/lint-tokens.mjs packages/tokens/build.mjs packages/tokens/package.json .prettierignore .gitlab-ci.yml
git commit -m "feat(tokens): add the token name registry and naming rules 1-6

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git add apps/docs/src/components/NamingRules.astro apps/docs/src/content/docs/naming.mdx CLAUDE.md
git commit -m "docs: generate the naming rules page and switch CLAUDE.md to the rename procedure

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 10: rebase、推 MR5，停在檢查點 H5**
Run: `git fetch origin && git rebase origin/main`，重跑 Step 8。接著：
`git push -u origin feat/rename-protection -o merge_request.create -o merge_request.target=main -o merge_request.title="feat(tokens): rename protection (aliases, deprecation, name registry)"`
- MR 說明用白話寫：
  - 9 個 shadow 別名在深色模式下改用加強過的陰影；
  - HeroUI 樣品室的畫面不變；
  - 合併條件是子鈞確認截圖。
- 停下來，向使用者回報：
  - MR 網址；
  - `…/ci-tokens/shadow/` 裡前後截圖的完整路徑（push option 無法附檔，請使用者貼到 MR 給子鈞看）。
- 等使用者說「已合併」，才做依賴 MR5 的 Task 17。

### Task 15: 永久代號 `SPACE_CODES` 與 `tokenClass` 查表（tceditor）

目的：頁面存的間距值（`"16"`～`"64"`）改成永久代號，由 `SPACE_CODES` 對到 CSS 變數。美編改名時，只改表的右邊和 `blocks.css`，頁面資料、契約、目錄和版本都不動（規格 R2、§6.4、§6.5 前四列）。

**執行位置**：tceditor 主目錄，分支 `ci-tokens/1b`。1a 合併後，從 `tzuchi/main` 開：`git switch -c ci-tokens/1b tzuchi/main`。不依賴 MR5，可以在等 H5 時先做。

**設計決定**：
- 規格檔、`generated/**`、stories 和編輯器欄位快照都不改。代號就是現在的 enum 值；`x-token` 本來就不進契約（`packages/spec/src/convert/contract.ts:27`）。
- `tokenClass` 先用 `Object.prototype.hasOwnProperty.call(SPACE_CODES, value)` 判斷，class 名稱再取自表的鍵，不取自輸入值。原本的 regex（`token-classes.ts:26,37`）會讓 `"20"` 產生沒有 CSS 的 `tcb-py-20`。
- 「代號只增不減」要用欄位路徑比對：契約沒有 `x-token`，所以從現在的規格用 `eachField` 找出 `x-token` 欄位的 `path`，再到 `generated/schemas/<Type>.v*.json` 的同一個路徑讀 `enum`。路徑在舊版本不存在時跳過，因為那個欄位是後來才加的。
- 棄用名單讀 vendor 的清單 `vendor/uikit/packages/tokens/dist/tokens.list.json`（1a 的 Task 12 已同步進來，`deprecated` 一律是 `null`），不另外解析 `tokens.css`。
- `blocks.css` 的 7 個 token class 內容不變（`blocks.css:38-64`），只改 `:36` 的註解。

**Files:**
- Modify: `packages/blocks/src/token-classes.ts:1-5,25-39`
- Modify: `packages/blocks/src/blocks.css:36`（註解改成 `Space code classes (SPACE_CODES in token-classes.ts): py 16/32/48/64, gap 16/24/32`）
- Create: `packages/blocks/src/__tests__/__helpers__/token-list.ts`
- Test: `packages/blocks/src/__tests__/styles.spec.ts:55-92`

**Interfaces:**
- Consumes：清單格式 `TokenList`／`TokenEntry`（Task 7）；`eachField`、`fieldPathKey`、`toJsonSchema`（`@tzuchi/tceditor-spec`）；`readSnapshots`（`src/generate/disk.ts:5`）；`SNAPSHOT_FILE_PATTERN`（`src/generate/contracts.ts:20`）。
- Produces：
  - `export const SPACE_CODES = { "16": "--tc-space-16", "24": "--tc-space-24", "32": "--tc-space-32", "48": "--tc-space-48", "64": "--tc-space-64" } as const;`
  - `export type SpaceCode = keyof typeof SPACE_CODES;`
  - `tokenClass(group: "space", purpose: TokenPurpose, value: string): string`，簽名不變。
  - 測試輔助 `__helpers__/token-list.ts`：`interface TokenEntry`（照 Task 7 的欄位）、`export const tokensByVar: ReadonlyMap<string, TokenEntry>`，以及 `export function variableProblem(cssVar: string): string | null`。後者在清單沒有這個變數時回傳 `"<cssVar> is not in tokens.list.json"`，已棄用時回傳 `"<cssVar> is deprecated: use <替代的 cssVar>"`，正常時回傳 `null`。Task 16 也會用。

- [ ] **Step 1: 寫會失敗的測試**

改 `styles.spec.ts:55-59`：
```ts
it("maps only the codes of SPACE_CODES to tcb- classes", () => {
  expect(tokenClass("space", "padding-y", "48")).toBe("tcb-py-48");
  expect(tokenClass("space", "gap", "24")).toBe("tcb-gap-24");
  for (const value of ["24 tcb-page", "20", "048", "", "__proto__", "constructor", "toString", "hasOwnProperty", "valueOf"]) {
    expect(tokenClass("space", "gap", value)).toBe("");
  }
});
```
改 `:71-92` 的 `it.each`：
- 刪掉 `:84` 的 `tokensCss` 斷言；
- 加 `expect(Object.prototype.hasOwnProperty.call(SPACE_CODES, value)).toBe(true)` 和 `expect(variableProblem(SPACE_CODES[value as SpaceCode])).toBeNull()`；
- `:88` 改成 `var(${SPACE_CODES[value as SpaceCode]})`；
- `:83` 的註解改成 `// A token() value is a permanent code (S2 §18 #34)`。

新增兩個測試：
```ts
it("maps every code to a token variable that exists and is not deprecated", () => {
  const problems = Object.entries(SPACE_CODES).flatMap(([code, cssVar]) => {
    const problem = variableProblem(cssVar);
    if (problem !== null) return [`${code}: ${problem}`];
    return tokensByVar.get(cssVar)?.type === "dimension" ? [] : [`${code}: ${cssVar} is not a dimension`];
  });
  expect(problems).toEqual([]);
  // every tcb-py-*/tcb-gap-* class in blocks.css is named after a code and reads that code's variable
  expect(codeClassProblems(blocksCss)).toEqual([]);
});

it("keeps every code that any data contract version allows", () => {
  // walks blockSpecs (deprecated blocks included) × generated/schemas/<Type>.v*.json
  expect(checkedValues).toBeGreaterThanOrEqual(7); // Section.paddingY 4 + Columns.gap 3
  expect(missing).toEqual([]); // "<file> <fieldPathKey(path)>: <value>"
});
```
- `codeClassProblems(css)` 寫在測試檔：以 `/\.tcb-(py|gap)-([^\s{]+) \{\n  ([a-z-]+): var\((--[A-Za-z0-9_-]+)\);\n\}/g` 掃描。前綴取自 `TOKEN_CLASS_PURPOSES` 的 `prefix`，不寫死。每個 class 都要符合三件事：`$2` 是 `SPACE_CODES` 自己的鍵、`$3` 等於該用途的 `property`、`$4` 等於 `SPACE_CODES[$2]`。另外要求至少找到 7 個 class。
- `enumAt(schema: unknown, path: readonly string[]): string[]` 也寫在測試檔：`"[]"` 走 `items`，其他走 `properties[segment]`，一律用 `hasOwnProperty`；路徑不存在時回傳 `[]`。

- [ ] **Step 2: 跑測試，確認失敗**
Run: `pnpm --filter @tzuchi/tceditor-blocks test src/__tests__/styles.spec.ts`
Expected: FAIL。`SPACE_CODES` 和 `__helpers__/token-list` 還不存在，TS 編譯錯誤。

- [ ] **Step 3: 寫 `__helpers__/token-list.ts`**
- 載入時用 `readFileSync(join(__dirname, "../../../../../vendor/uikit/packages/tokens/dist/tokens.list.json"))` 讀清單。
- `schemaVersion !== 1` 時丟出 `tokens.list.json schemaVersion <n>, expected 1`。
- 用 `new Map(tokens.map((t) => [t.cssVar, t]))` 建 `tokensByVar`。
- 已棄用時，用 `deprecated.replacedBy` 找出替代 id 的 `cssVar`，放進訊息。

- [ ] **Step 4: 實作 `SPACE_CODES`、`SpaceCode` 和新的 `tokenClass`（`token-classes.ts`）**
- 刪掉 `TOKEN_VALUE`。
- 表的上方照規格 §6.4 寫註解：`// 代號一旦出現在任何版本的規格裡就永遠保留；美編改名時只改右邊的變數名`。
- 檔頭註解（`:1-5`）補一句：the stored values are permanent codes, mapped to variables only here。
- 鍵的取法：`(Object.keys(SPACE_CODES) as SpaceCode[]).find((code) => code === value)`。

- [ ] **Step 5: 跑測試，確認通過**
Run: `pnpm --filter @tzuchi/tceditor-blocks test && pnpm --filter @tzuchi/tceditor-blocks typecheck && pnpm --filter @tzuchi/tceditor-blocks lint`
Expected: 全部 PASS。`render.spec.tsx`（choice 欄位設成 `"script"`）、`editor-fields.spec.ts` 的快照，以及 `generated.spec.ts` 都沒有變動。

- [ ] **Step 6: Commit**
```bash
git add packages/blocks/src/token-classes.ts packages/blocks/src/blocks.css packages/blocks/src/__tests__/styles.spec.ts packages/blocks/src/__tests__/__helpers__/token-list.ts
git commit -m "feat(blocks): store space values as permanent codes mapped by SPACE_CODES

tokenClass accepts only the own keys of SPACE_CODES and builds the class
from the table's key. styles.spec checks that every code maps to an
existing, non-deprecated dimension token, that every code class reads its
code's variable, and that every code of every contract version is kept.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 16: `styles.spec.ts` 其他檢查與主題名稱集中（tceditor）

目的：補上規格 §6.5 剩下的檢查，包括不可用到棄用變數、HeroUI 主題變數存在、亮暗值相同、斷點常數。另外把主題名稱集中到 `themes.json`（§6.6）。

**執行位置**：tceditor 主目錄，分支 `ci-tokens/1b`，接在 Task 15 之後。

**設計決定**：
- 「只用 primitive 色」原本用寫死的色名 regex（`styles.spec.ts:113-121`），改成查清單：`blocks.css` 用到的每個 `--tc-color-*`，`light.value` 都要等於 `dark.value`。
- HeroUI 主題變數只檢查 `vendor/uikit/heroui/styles/themes/tzuchi/variables.css`：某條規則的選擇器清單含 `[data-theme="<名稱>"]`，那條規則宣告的變數就算這個主題有定義。
  - `:17-18` 是亮暗共用的規則，`:28` 是亮色，`:72` 是深色。
  - 這個檔是平的，沒有巢狀 at-rule。輔助函式遇到 `@` 就丟錯，免得解析錯了還誤判通過。
- `themes.json` 的深色名稱必須以 `-dark` 結尾，因為 HeroUI 預設的深色底色靠 `[data-theme$="-dark"]` 選到（`vendor/uikit/heroui/styles/themes/default/variables.css:192-196`，LOCAL CHANGE；規格 §11 第 3 步）。
- `.mjs` 腳本用 `JSON.parse(readFileSync(fileURLToPath(new URL(…, import.meta.url))))` 讀 `themes.json`，不用 `import … with { type: "json" }`，因為 Prettier 2.8.8 解析不了 import attributes。
- TS 端透過套件匯出 `@tzuchi/tceditor-blocks/themes.json` import。showcase 已開 `resolveJsonModule`（`apps/showcase/tsconfig.json`），Storybook 要另外加。
- 公開頁 `app/(public)/layout.tsx` import 的是純 JSON，不碰 `PUBLIC_IMPORTS`（`eslint.config.mjs:174-205`）的任何一條規則；`check:public-bundle` 掃的是瀏覽器端 chunk，layout 是伺服器元件。
- `packages/blocks/styles.css` 的 `themes/tzuchi` 路徑留到第二階段（規格 §6.6 最後一點）。

**Files:**
- Create: `packages/blocks/src/themes.json`，內容 `{ "light": "tzuchi", "dark": "tzuchi-dark" }`
- Create: `packages/blocks/src/__tests__/__helpers__/theme-css.ts`
- Modify: `packages/blocks/package.json:17`（`exports` 加 `"./themes.json": "./src/themes.json"`）
- Modify: `packages/blocks/src/token-classes.ts`（新增 `BREAKPOINT_VARS`）
- Modify: `packages/blocks/src/blocks.css:7-10,131-133`（註解：顏色規則改成「亮暗值相同，styles.spec.ts 檢查」；斷點註解改指 `BREAKPOINT_VARS.tablet`）
- Modify: `apps/showcase/app/(public)/layout.tsx:2,10`
- Modify: `apps/showcase/app/(editor)/activity/edit/client.tsx:11-12,39`
- Modify: `apps/storybook/.storybook/preview.tsx:2-4,27-28`
- Modify: `apps/storybook/tsconfig.json`（`compilerOptions` 加 `"resolveJsonModule": true`）
- Modify: `scripts/storybook-smoke.mjs:27-28`
- Modify: `scripts/storybook-smoke.test.mjs:8-14,42,55,150,155,159,187`
- Modify: `scripts/e2e/showcase-smoke.mjs:20-29,234`
- Test: `packages/blocks/src/__tests__/styles.spec.ts`（Task 15 已讓行號移動；用測試名稱定位：`reads only token variables that the vendored tokens define`、`stacks the columns below the tokens' tablet breakpoint`、`uses only primitive --tc-color-* tokens (semantic ones flip in OS dark mode)`）

**Interfaces:**
- Consumes：Task 15 的 `variableProblem`、`tokensByVar`。
- Produces：
  - `export const BREAKPOINT_VARS = { tablet: "--tc-breakpoint-tablet" } as const;`（`token-classes.ts`）
  - `themes.json`：`{ light: string; dark: string }`，以 `@tzuchi/tceditor-blocks/themes.json` 匯出。
  - `themeVariables(css: string, theme: string): Set<string>`（`__helpers__/theme-css.ts`）
  - `scripts/storybook-smoke.mjs` 改成 `export const EXPECTED_THEME`、`export const SWITCHED_THEME`，值取自 `themes.json`。

- [ ] **Step 1: 寫會失敗的測試（`styles.spec.ts`）**
```ts
it("reads no deprecated token variable", () => {
  expect(usedVariables.filter((n) => n.startsWith("--tc-")).map(variableProblem).filter(Boolean)).toEqual([]);
});
it("reads only --tc-color-* tokens whose light and dark values are equal", () => {
  const colors = usedVariables.filter((n) => n.startsWith("--tc-color-"));
  expect(colors.length).toBeGreaterThan(0);
  expect(colors.filter((n) => { const t = tokensByVar.get(n); return !t || t.light.value !== t.dark.value; })).toEqual([]);
});
describe("themes", () => {
  // themes = JSON.parse(readFileSync(join(packageRoot, "src", "themes.json"), "utf8"))
  it("names a light theme and a dark theme ending in -dark", () => {
    expect(Object.keys(themes).sort()).toEqual(["dark", "light"]);
    for (const name of Object.values(themes)) expect(name).toMatch(/^[a-z][a-z0-9-]*$/);
    expect(themes.dark.endsWith("-dark")).toBe(true);
  });
  it.each(["light", "dark"])("the vendored Tzu Chi theme selects the %s theme", (mode) => {
    expect(variablesCss).toContain(`[data-theme="${themes[mode]}"]`);
  });
  it("defines every HeroUI variable blocks.css reads in both themes", () => {
    const hero = usedVariables.filter((n) => !n.startsWith("--tc-"));
    expect(hero.length).toBeGreaterThan(0); // today --focus, --border, --default, --default-foreground, --warning
    expect({ light: hero.filter((n) => !themeVariables(variablesCss, themes.light).has(n)),
             dark: hero.filter((n) => !themeVariables(variablesCss, themes.dark).has(n)) }).toEqual({ light: [], dark: [] });
  });
});
```
- 刪掉 `uses only primitive --tc-color-* tokens …` 這個測試，由「亮暗值相同」取代。
- `stacks the columns below the tokens' tablet breakpoint` 的 regex 改用 `new RegExp(`${BREAKPOINT_VARS.tablet}:\\s*(\\d+)px;`)`，其他斷言不變。

`scripts/storybook-smoke.test.mjs` 加：
```js
test("the smoke test takes its theme names from themes.json", () => {
  const themes = JSON.parse(readFileSync(new URL("../packages/blocks/src/themes.json", import.meta.url), "utf8"));
  assert.deepEqual({ light: EXPECTED_THEME, dark: SWITCHED_THEME }, themes);
});
```
`:42,55,187` 的 `"tzuchi"` 改成 `EXPECTED_THEME`。`:150,155,159` 改成用 `EXPECTED_THEME`、`SWITCHED_THEME` 組的樣板字串，訊息內容不變。

- [ ] **Step 2: 跑測試，確認失敗**
Run: `pnpm --filter @tzuchi/tceditor-blocks test src/__tests__/styles.spec.ts; node --test scripts/storybook-smoke.test.mjs`
Expected: FAIL。`BREAKPOINT_VARS`、`themes.json` 和 `theme-css` 還不存在，`storybook-smoke.mjs` 也還沒匯出 `EXPECTED_THEME`。

- [ ] **Step 3: 實作**
- 建立 `themes.json`、`BREAKPOINT_VARS`，並在 `package.json` 加 export。
- `themeVariables`：
  1. 先去掉 `/* … */` 註解，剩下的內容有 `@` 就丟錯；
  2. 以 `/([^{}]+)\{([^{}]*)\}/g` 逐條取出規則；
  3. 選擇器以 `,` 切開、trim 之後，含有 `[data-theme="${theme}"]` 的規則，收集它主體裡的 `/(--[A-Za-z0-9_-]+)\s*:/g`。
- 6 個使用端：
  - `layout.tsx`：`import themes from "@tzuchi/tceditor-blocks/themes.json"`，`data-theme={themes.light}`；
  - `client.tsx:39`：`themes.light`；
  - `preview.tsx`：`DEFAULT_THEME = themes.light`，items 的 value 改用 `themes.light`、`themes.dark`，中文 title 不變；
  - `storybook-smoke.mjs`：從 `../packages/blocks/src/themes.json` 讀出 `{ light, dark }`，再 `export const EXPECTED_THEME = light`、`export const SWITCHED_THEME = dark`；
  - `showcase-smoke.mjs`：從 `../../packages/blocks/src/themes.json` 讀，`:234` 改成 `theme === THEMES.light`。

- [ ] **Step 4: 跑測試，確認通過**
Run: `pnpm --filter @tzuchi/tceditor-blocks test && node --test scripts/storybook-smoke.test.mjs && node --check scripts/e2e/showcase-smoke.mjs && pnpm typecheck && pnpm lint`
Expected: 全部 PASS。

- [ ] **Step 5: 確認 bundle 和 Storybook**
Run: `pnpm build && pnpm check:public-bundle && pnpm storybook:smoke`
Expected: 都以 0 結束。`storybook:smoke` 的主題切換仍然回報 `--accent` 在兩個主題下不同。
Run: `git grep -n -e '"tzuchi"' -e 'tzuchi-dark' -- 'apps/**/*.ts' 'apps/**/*.tsx' 'scripts/*.mjs' 'scripts/**/*.mjs'`
Expected: 沒有輸出。README 由 Task 17 改，不在這個 grep 的範圍裡。

- [ ] **Step 6: Commit**
```bash
git add packages/blocks/src/themes.json packages/blocks/package.json packages/blocks/src/token-classes.ts packages/blocks/src/blocks.css packages/blocks/src/__tests__/styles.spec.ts packages/blocks/src/__tests__/__helpers__/theme-css.ts "apps/showcase/app/(public)/layout.tsx" "apps/showcase/app/(editor)/activity/edit/client.tsx" apps/storybook/.storybook/preview.tsx apps/storybook/tsconfig.json scripts/storybook-smoke.mjs scripts/storybook-smoke.test.mjs scripts/e2e/showcase-smoke.mjs
git commit -m "feat(blocks): keep the theme names in themes.json and check theme variables

The showcase, the block Storybook and both smoke tests read the theme names
from packages/blocks/src/themes.json. styles.spec checks that blocks.css
reads no deprecated token, only colour tokens whose light and dark values
match, and HeroUI variables that the Tzu Chi theme defines in both themes.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 17: 同步到 1b 版、文件、合併回 `tzuchi/main`（tceditor）

目的：把 vendor 同步到 MR5 合併後的 uikit，更新 1b 的文件（規格 §6.3）。`pnpm verify` 通過後，經使用者同意把 `ci-tokens/1b` 合併回 `tzuchi/main`。

**執行位置**：tceditor 主目錄，分支 `ci-tokens/1b`。必須在 H5（MR5 已合併）之後。

**設計決定**：
- `REQUIRED_FILES`（`scripts/uikit/sync-uikit.mjs`，用名稱定位）加入 `packages/tokens/token-names.json` 和 `packages/tokens/lib/deprecation.mjs`（兩個 Style Dictionary 設定都 import 它，Task 13）。之後同步到沒有登記檔的舊 commit 會被拒絕，做法和 Task 12 加 `lib/token-list.mjs` 相同。
- 預期 vendor 會有這些變化：
  - `tokens.css` 的 9 個 shadow 別名改成 `var(--tc-elevation-N)`；
  - 清單裡同樣這 9 筆的 `css`、`chain` 和 `dark.value` 改變；
  - 新增 `token-names.json`、`lib/output-references.mjs`、`lib/deprecation.mjs`、`lib/lint/*`；
  - `test/` 依 `REMOVE_RULES` 刪除，記進 `SOURCE.json` 的 `removed`。
  - `heroui/**` 和 `uikit-options.json` 都不該變；變了就停下來查。
- 這 9 個變數，vendor 的慈濟主題和 `blocks.css` 都沒有用 `var()` 讀取（2026-10-21 用 grep 查過），所以區塊的外觀不變。CHANGELOG 照實寫。
- Style Dictionary 的版本由 sync 檢查。MR5 如果改了版本，sync 會拒絕執行；這時停下來，回報使用者，不要自行升級。

**Files:**
- Modify: `scripts/uikit/sync-uikit.mjs`（`REQUIRED_FILES`）
- Test: `scripts/uikit/uikit.test.mjs`
- Modify（sync 產生）：`vendor/uikit/**`、`packages/blocks/generated/uikit-options.json`（預期不變）
- Modify: `docs/superpowers/specs/2026-10-12-s2-block-spec-design.md`（§18 表格的最後一列之後，加 #34）
- Modify: `CLAUDE.md`：
  - Blocks 一節 `styles.css` 那一點的 `The theme is …`（10-21 在 `:162`）；
  - 新增區塊第 3 步（`:168`）；
  - `Stored values`（`:184`）；
  - `token(group, values)`（`:193`）；
  - Security 的 `No inline styles`（`:246`）；
  - Vendored uikit 一節：登記檔，以及改名時的跟進。
  - Task 12 會讓這些行號移動，以內容定位。
- Modify: `packages/spec/README.md:84`、`packages/spec/src/helpers.ts:146-150`
- Modify: `packages/blocks/README.md:80,106,130,139-140`、`apps/showcase/README.md:26`、`apps/storybook/README.md:27`、`vendor/uikit/README.md`
- Modify: `CHANGELOG.md`（`### Changes from Puck v0.23.0` 清單的末尾，加 3 行）

**Interfaces:**
- Consumes：
  - Task 4 的 sync 預設值：`--dir ../tzuchi-uikit`、`--branch origin/main`；
  - Task 14 的 `token-names.json`（`{ version: 1, names: { "<cssVar>": "active"|"deprecated"|"removed" } }`）；
  - Task 15、16 的成果。
- Produces：`tzuchi/main` 上的 1b 版。Task 18 從這裡開演練分支。

- [ ] **Step 1: 寫會失敗的測試（`scripts/uikit/uikit.test.mjs`）**
```js
test("the name registry marks every variable of tokens.css active or deprecated", () => {
  const registry = readJson(join(vendorDir, "packages/tokens/token-names.json"));
  const tokensCss = readFileSync(join(vendorDir, "packages/tokens/dist/tokens.css"), "utf8");
  assert.equal(registry.version, 1);
  const declared = [...new Set([...tokensCss.matchAll(/^\s*(--tc-[A-Za-z0-9-]+):/gm)].map((m) => m[1]))];
  assert.ok(declared.length > 400);
  assert.deepEqual(declared.filter((name) => !["active", "deprecated"].includes(registry.names[name])), []);
});
```
同時把 `packages/tokens/token-names.json`、`packages/tokens/lib/deprecation.mjs` 加進 `REQUIRED_FILES`。
Run: `node --test scripts/uikit/uikit.test.mjs`
Expected: FAIL，`ENOENT … token-names.json`。vendor 還是 1a 版。

- [ ] **Step 2: 確認來源**
Run: `git -C ../tzuchi-uikit fetch origin && git -C ../tzuchi-uikit cat-file -e origin/main:packages/tokens/token-names.json && git -C ../tzuchi-uikit rev-parse origin/main`
Expected: 以 0 結束，印出 MR5 合併後的 sha（記為 `<sha>`）。

- [ ] **Step 3: 同步**
Run: `pnpm sync:uikit -- --commit <sha>`
Expected: 以 0 結束。
Run: `git diff --stat -- vendor/uikit/heroui/styles/src`
Expected: 沒有輸出（Global Constraints；有輸出就先看過再繼續）。
Run: `git diff --stat -- vendor/uikit packages/blocks/generated/uikit-options.json`
Expected: 只有「設計決定」列出的路徑，加上 `SOURCE.json`。
Run: `git diff -U0 vendor/uikit/packages/tokens/dist/tokens.css | grep '^[-+]  --'`
Expected: 剛好 9 對，`+` 那一行是 `var(--tc-elevation-[1-4])`。
Run: `grep -rnE 'var\(--tc-(card|article-card|book-card|navbar-drawer)-elevation|var\(--tc-(modal|tooltip)-shadow' vendor/uikit/heroui packages/blocks/src`
Expected: 沒有輸出。有輸出的話，CHANGELOG 第 3 行要寫出深色模式下的變化。

- [ ] **Step 4: 跑測試，確認通過**
Run: `node --test scripts/uikit/uikit.test.mjs && pnpm --filter @tzuchi/tceditor-blocks test`
Expected: PASS，包括 Task 15、16 的「沒有棄用」和「亮暗值相同」。

- [ ] **Step 5: Commit 同步**
```bash
git add scripts/uikit/sync-uikit.mjs scripts/uikit/uikit.test.mjs vendor/uikit packages/blocks/generated/uikit-options.json
git commit -m "build: sync vendor/uikit to <short sha> with the token name registry

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 6: 更新文件**

S2 §18 加 #34：
```
| 34 | §4.2、§4.4、§8.6、§8.7 | `token()` 的值是永久代號，不是 token 名稱：頁面存的 `"16"`～`"64"` 由 `packages/blocks/src/token-classes.ts` 的 `SPACE_CODES` 對到 CSS 變數。這張表只增不減；uikit 改名時只改表的右邊和 `blocks.css`，資料、契約、MCP 目錄和版本號都不變 | CI tokens 共編設計（`2026-10-21-ci-tokens-coediting-design.md` R2、§6.4）：美編改名不可讓已存的頁面失效 |
```

CLAUDE.md：
- `:184` 改成：`Stored values are permanent codes for shared design concepts ("32"), which SPACE_CODES in packages/blocks/src/token-classes.ts maps to token variables (only add codes; a uikit rename changes only the variable), and uikit values for component styles ("primary"); …`
- `:193` 改成：`token(group, values)` 的值是永久代號；`tokenClass()` 只接受 `SPACE_CODES` 自己的鍵，其他一律回傳 `""`。
- `:168`：值必須是 `SPACE_CODES` 的代號，class 讀 `var(<那個代號的變數>)`。`styles.spec.ts` 另外檢查：各版本契約的代號都在表裡；變數存在、沒有棄用（讀 `vendor/uikit/packages/tokens/dist/tokens.list.json`）。
- `:246`：顏色改成「亮暗值相同的 `--tc-color-*`」，由 `styles.spec.ts` 檢查。
- `:162`：主題名稱放在 `packages/blocks/src/themes.json`（`@tzuchi/tceditor-blocks/themes.json`），亮色主題設在 `<html data-theme>`。
- Vendored uikit 一節：
  - 加上 `token-names.json`，以及 `REQUIRED_FILES` 要求它存在；
  - 加上 uikit 改名後的跟進方式：同步到 MR 甲，「沒有棄用」測試失敗時，在同一個變更裡改 `SPACE_CODES` 和 `blocks.css`。

其他文件：
- `helpers.ts:146-150` 的 JSDoc：`Options that are permanent codes for a design token shared across components, for example token("space", ["16", "32"]). The package that renders the blocks maps each code to a CSS variable (packages/blocks: SPACE_CODES), so renaming a token never changes stored data. Records x-token: { group }.`
- `packages/spec/README.md:84` 寫同樣的意思（中文）。
- `packages/blocks/README.md`：
  - `:106`：`tokenClass()` 和 `SPACE_CODES`；
  - `:130`：第 4 步的代號規則；
  - `:139-140`：顏色規則；
  - `:80`：主題名稱和 `themes.json`。
- `apps/showcase/README.md:26`、`apps/storybook/README.md:27`：主題名稱取自 `themes.json`。
- `vendor/uikit/README.md`：加上 `token-names.json`。

CHANGELOG 加 3 行：
```
* the space values that pages store (`"16"` to `"64"` in `Section`'s `paddingY` and `Columns`' `gap`) are permanent codes: `SPACE_CODES` in `packages/blocks/src/token-classes.ts` maps each to its `--tc-space-*` variable, so renaming a token changes only that table and `blocks.css`, never stored pages; `tokenClass` accepts only the table's own keys and returns `""` for anything else (such as `"20"`, `"__proto__"` or `"constructor"`), and the blocks tests check that every code of every data contract version is in the table and maps to an existing token that is not deprecated
* the theme names `tzuchi` and `tzuchi-dark` live only in `packages/blocks/src/themes.json` (`@tzuchi/tceditor-blocks/themes.json`), which the showcase, the block Storybook and the smoke tests read; the blocks tests check that the vendored Tzu Chi theme selects both names and defines in both every HeroUI variable `blocks.css` reads, and that every `--tc-color-*` token `blocks.css` reads has the same light and dark value
* `vendor/uikit` is synced to `<short sha>` of `tzuchi/tzuchi-uikit`, which adds the token name registry `packages/tokens/token-names.json` (`pnpm sync:uikit` now refuses a commit without it); the 9 shadow aliases of the card, article card, book card, modal, tooltip and navbar drawer tokens now read `var(--tc-elevation-N)` and so follow the dark elevation values, but neither the blocks nor the Tzu Chi theme read them, so the blocks look the same
```

- [ ] **Step 7: 跑閘門**
Run: `pnpm gen:blocks && git status --short packages/blocks`
Expected: 沒有輸出。改 JSDoc 不會影響產生的檔案。
Run: `pnpm verify`
Expected: 以 0 結束（`audit:gate` 需要網路）。

- [ ] **Step 8: Commit 文件**
```bash
git add docs/superpowers/specs/2026-10-12-s2-block-spec-design.md CLAUDE.md CHANGELOG.md packages/spec/README.md packages/spec/src/helpers.ts packages/blocks/README.md apps/showcase/README.md apps/storybook/README.md vendor/uikit/README.md
git commit -m "docs: record the permanent space codes, themes.json and the name registry

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 9: 經使用者同意，合併回 `tzuchi/main`**
- 回報 `git log --oneline tzuchi/main..ci-tokens/1b` 和 `pnpm verify` 的結果，問使用者是否合併。沒有得到明確同意就停在這裡。
- 同意後：
  - Run：`git switch tzuchi/main && git merge --ff-only ci-tokens/1b && git log --oneline -1`
  - Expected：HEAD 是 Step 8 的 commit。
  - `--ff-only` 失敗，表示 `tzuchi/main` 已經前進。這時先 `git switch ci-tokens/1b && git rebase tzuchi/main`，重跑 `pnpm verify`，再問一次。

### Task 18: 改名演練（兩個 repo）

目的：照規格 §7 實際走一次改名，確認每一項檢查都在預期的那一步觸發，也只在那一步觸發（規格 §9.3）。演練分支不推、不合併，做完就刪掉。

**執行位置**：
- uikit：`~/Desktop/projects/tzuchi-uikit`，本機分支 `drill/rename`，從 MR5 合併後的 `origin/main` 開。
- tceditor：分支 `drill/rename`，從 Task 17 合併後的 `tzuchi/main` 開。

**設計決定**：
- **演練兩個名稱**（新名只是示範，不代表子鈞的規範）：
  - `color.brand.primary` → `color.accent.default`：驗證 uikit 這一側。它被 20 個檔案共 33 處 `{color.brand.primary}` 參照，也有深色覆寫、`generate.mjs` 的對照表、`check.mjs` 寫死的名稱，以及手冊 `theme-css.mjs` 的 `THEME_MAP`。
  - `space.32` → `space.lg`：驗證 tceditor 這一側。uikit 有 `src/component/container.tokens.json` 的 `{space.32}`，主題 CSS 有 6 個檔共 18 行的 `--tc-space-32`（含註解）。tceditor 有 `SPACE_CODES["32"]` 和 `blocks.css` 的 3 處（`:21`、`.tcb-py-32`、`.tcb-gap-32`）。
- **先做正確的「MR 甲」（commit A），再在 A 上逐一製造違規。** 每個違規做完就還原，所以每一步只會觸發一條規則。如果在還沒改完參照時就製造違規，規則 3、5 會同時觸發，無法證明「只在那一步」。
- **tceditor 的同步要用演練分支的 commit**，所以帶 `--branch drill/rename --allow-branch`（Task 4）。這種快照會讓 `uikit.test.mjs` 的「`SOURCE.json` 的 branch 必須是 `origin/main`」失敗，這正是它保護 `tzuchi/main` 的方式。所以這裡不跑 `pnpm verify`，改跑不含那項的子集，並確認那一項確實失敗。不可修改那個測試或 `ALLOWED_BRANCHES`。
- **tceditor 的演練變更 commit 在 `drill/rename` 上**（本機，不推），最後用 `git branch -D` 刪掉。不用 `reset --hard`、`checkout .`、`stash`（Global Constraints）。
- **uikit 的還原**：
  - 改到的單一檔案用 `git restore <檔案>`；
  - 退一個 commit 用 `git reset --hard HEAD~1`，執行前先跑 `git status --short`，確認只有演練造成的變更。
- 每一步都把指令、退出碼和關鍵輸出記進 `.superpowers/plan-work/ci-tokens/drill.md`（git 忽略）。

**Files:** 只改兩個 repo 的 `drill/rename` 分支；`.superpowers/plan-work/ci-tokens/drill.md`。

**Interfaces:**
- Consumes：
  - `lint-tokens.mjs` 的規則 1–7、`--base`、退出碼（Task 8、14）；
  - build 寫入的 `token-names.json`（Task 14）；
  - 深色別名行和 `hasDarkOverride`（Task 13）；
  - sync 的 `--allow-branch` 和「build 不可改到受追蹤的檔案」（Task 4）；
  - `SPACE_CODES`、`variableProblem` 和 `styles.spec.ts` 的新測試（Task 15、16）。
- Produces：`drill.md`。

uikit 的 lint 指令一律是 `cd packages/tokens && node build.mjs && node check.mjs && node lint-tokens.mjs --base <base>; echo "exit $?"`，以下簡稱 `LINT <base>`。build 或 check 失敗時，不能把 lint 的結果算成演練通過。

- [ ] **Step 1: 準備**
  - uikit：`git status --short` 沒有輸出，再 `git fetch origin && git switch -c drill/rename origin/main && pnpm install --frozen-lockfile`。
  - tceditor：`git status --short` 沒有輸出，再 `git switch -c drill/rename tzuchi/main`。
  - Run：`LINT origin/main`。
  - Expected：`exit 0`，只有一行 `rule 8 report`。

- [ ] **Step 2: 違規 1：跳過棄用直接刪除（規則 6）**
  - 從 `dist/tokens.list.json` 挑一個同時符合以下條件的 token，記為 `X`：
    - `layer` 是 `primitive`，`hasDarkOverride` 是 `false`；
    - `git grep -F '{<id>}' -- packages/tokens/src` 沒有輸出；
    - `git grep -F -- '<cssVar>' -- heroui packages/tokens/check.mjs apps/docs` 沒有輸出。
  - 刪掉它，commit 到本機。
  - Run：`LINT origin/main`
  - Expected：
    - build 和 check 都成功，`token-names.json` 裡的 `X` 變成 `removed`；
    - `exit 1`，而且只有一行錯誤：`rule 6 error`，指出 `X` 從 `active` 直接變成 `removed`。
  - 確認 `git status --short` 只有 `packages/tokens/token-names.json`（build 改的），再 `git reset --hard HEAD~1`。

- [ ] **Step 3: 正確的 MR 甲（commit A，§7 第 1 步）**
  - `color.brand.primary`：
    - 在 `src/semantic/color.tokens.json` 新增 `color.accent.default = {color.blue.900}`；
    - `color.brand.primary` 改成 `{color.accent.default}`，加上 `$deprecated: "改用 {color.accent.default}"` 和 `$extensions["tw.org.tzuchi"] = { "replacedBy": "color.accent.default", "since": "<今天>" }`；
    - `src/**` 其他 33 處 `{color.brand.primary}` 改成 `{color.accent.default}`；
    - `src/themes/dark/color.tokens.json` 的覆寫改到 `color.accent.default`；
    - `generate.mjs` 的對照表、`check.mjs` 寫死的名稱、`apps/docs/scripts/theme-css.mjs` 的 `THEME_MAP` 都改用新名。
  - `space.32`：
    - 在 `src/primitive/scale.tokens.json` 新增 `space.lg = "32px"`；
    - `space.32` 改成 `{space.lg}` 的棄用別名，欄位照上面；
    - `container.tokens.json` 的 `{space.32}` 改成 `{space.lg}`；
    - 主題 CSS 6 個檔裡的 `--tc-space-32` 全部改成 `--tc-space-lg`，包括註解。
  - Run：`LINT origin/main && cd ../.. && pnpm run heroui:theme && git diff --stat -- heroui/styles/themes/tzuchi/variables.css`
  - Expected：
    - `exit 0`；
    - `dist/tokens.css` 的 `:root` 有 `--tc-color-brand-primary: var(--tc-color-accent-default);` 和 `--tc-space-32: var(--tc-space-lg);`；
    - 深色區塊有 `--tc-color-brand-primary: var(--tc-color-accent-default);`（Task 13 的深色別名行）；
    - `check.mjs` 通過，深色區塊的變數集合仍等於 `hasDarkOverride` 的集合；
    - `token-names.json` 的兩個舊名是 `deprecated`、新名是 `active`；
    - `variables.css` 若有差異，就一起 commit。
  - 把以上全部 commit 成 A，記下 sha。

- [ ] **Step 4: 在 A 上逐一製造違規，每項做完就用 `git restore` 還原**

| 違規 | 做法 | Expected |
|---|---|---|
| 2：別名接別名（規則 4） | `src/semantic/color.tokens.json` 加 `color.brand.main = {color.brand.primary}`，並標成棄用 | `exit 1`，只有 `rule 4 error`，指出 `color.brand.main` |
| 3：沒棄用的 token 參照棄用的（規則 5） | 加 `color.brand.extra = {color.brand.primary}`，不標棄用 | `exit 1`，只有 `rule 5 error` |
| 4：手寫的深色覆寫用了舊名（規則 3） | `src/themes/dark/color.tokens.json` 再加一個 `color.brand.primary` 的覆寫 | 兩種結果都算抓到，記下實際是哪一種：(a) `exit 1`，只有 `rule 3 error`；(b) build 或 `check.mjs` 先失敗，指出 `--tc-color-brand-primary` 在深色區塊重複宣告（手寫覆寫加上自動產生的別名行） |
| 5：主題 CSS 讀到不存在的名稱（規則 7） | `heroui/styles/themes/tzuchi/components/button.css` 加一行 `.drill { margin: var(--tc-not-a-token, 1px); }` | `exit 1`，只有 `rule 7 error`，指出 `button.css` 和行號（這一行有 fallback，瀏覽器裡不會壞，正是規則 7 要抓的「悄悄壞掉」） |
| 6：主題 CSS 用了棄用的名稱（規則 7 警告） | `button.css` 加一行 `.drill { margin: var(--tc-space-32); }` | `exit 3`，只有 `rule 7 warning` |

每一項都跑 `LINT origin/main`，記下結果，再用 `git restore <檔案>` 還原。

- [ ] **Step 5: 違規 7：uikit 的登記檔過期（build 的 diff 和 sync 的檢查）**
  - 在 A 上執行 `git show origin/main:packages/tokens/token-names.json > packages/tokens/token-names.json`，commit 成 A′。
  - Run：`cd packages/tokens && node build.mjs && git diff --exit-code -- token-names.json; echo "exit $?"`
  - Expected：`exit 1`，CI 的 build job 會在這裡失敗。
  - 在 tceditor 執行：`pnpm sync:uikit -- --branch drill/rename --allow-branch --commit <A′>`
  - Expected：sync 拒絕，訊息是 `the tokens build changed tracked files: packages/tokens/token-names.json`。`vendor/uikit` 沒有任何變更（`git status --short` 沒有輸出）。
  - uikit：`git restore packages/tokens/token-names.json`，確認 `git status --short` 沒有輸出，再 `git reset --hard HEAD~1` 回到 A。

- [ ] **Step 6: tceditor 同步到 A（§7 第 3 步）**
  - Run：`pnpm sync:uikit -- --branch drill/rename --allow-branch --commit <A>`，接著 `git diff --stat -- vendor/uikit/heroui/styles/src`。
  - Expected：sync 以 0 結束；`heroui/styles/src` 沒有差異。
  - Run：`pnpm --filter @tzuchi/tceditor-blocks test src/__tests__/styles.spec.ts`
  - Expected：失敗，而且只有以下兩項：
    - `maps every code to a token variable that exists and is not deprecated`，訊息是 `32: --tc-space-32 is deprecated: use --tc-space-lg`；
    - `reads no deprecated token variable`，指出 `blocks.css` 讀 `--tc-space-32`。
  - 違規 8（代號只增不減）：暫時刪掉 `SPACE_CODES` 的 `"32"`，`keeps every code that any data contract version allows` 失敗。之後還原這個鍵。
  - 修正：
    - `SPACE_CODES["32"]` 改成 `"--tc-space-lg"`；
    - `blocks.css` 所有 `var(--tc-space-32)` 改成 `var(--tc-space-lg)`，目前在 `:21`、`.tcb-py-32`、`.tcb-gap-32` 三處。
  - Run：`pnpm --filter @tzuchi/tceditor-blocks test && pnpm typecheck && pnpm build && pnpm check:public-bundle`
  - Expected：全部通過。代號 `"32"`、頁面資料、契約都沒有改。
  - Run：`node --test scripts/uikit/uikit.test.mjs`
  - Expected：只有 `SOURCE.json records the root style-dictionary and a commit on main` 一項失敗，原因是 `branch` 是 `drill/rename`。這是保護 `tzuchi/main` 的設計。
  - commit 到 tceditor 的 `drill/rename`（本機）。

- [ ] **Step 7: MR 乙：移除舊名（§7 第 4 步）**
  - uikit：在 A 上刪掉 `color.brand.primary` 和 `space.32` 兩個舊名，commit 成 B。
  - Run：`LINT <A>`
  - Expected：`exit 0`。兩個舊名在 A 上已經是 `deprecated`，`token-names.json` 把它們標成 `removed`。
  - Run：`LINT origin/main`
  - Expected：`exit 1`，`rule 6 error` 指出兩個舊名從 `active` 直接變成 `removed`。這證明「先棄用、後移除」必須分成兩次合併。
  - tceditor：`pnpm sync:uikit -- --branch drill/rename --allow-branch --commit <B>`，再跑 Step 6 的子集指令。
  - Expected：全部通過，因為 Step 6 已經換成新名。`uikit.test.mjs` 仍只有那一項失敗。
  - commit 到 tceditor 的 `drill/rename`。

- [ ] **Step 8: 清理與紀錄**
  - uikit：確認 `git status --short` 沒有輸出，`git switch -` 回原分支，再 `git branch -D drill/rename`。
  - tceditor：確認 `git status --short` 沒有輸出，`git switch tzuchi/main`，再 `git branch -D drill/rename`。之後 `git status --short` 沒有輸出，`git diff tzuchi/main --stat -- vendor/uikit` 也沒有輸出。
  - 在 `drill.md` 列一張表，每一列是：違規 → 預期由誰抓到 → 實際結果。
    - 違規 1–7 和違規 8 都要列；
    - 再加兩列：Step 3 的 `exit 0`，以及 Step 6 修正後的通過。
  - 任何一項和預期不同，就停下來回報使用者，不進入里程碑 1b。

**里程碑 1b 完成。** 回報使用者：改名保護已建好，演練結果在 `.superpowers/plan-work/ci-tokens/drill.md`。等子鈞的命名規範到了，就可以開始第二階段（規格 §11）。
