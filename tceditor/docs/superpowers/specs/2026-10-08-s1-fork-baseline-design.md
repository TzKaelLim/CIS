# S1：Fork 基線與開發基礎設施（設計規格）

- 日期：2026-10-08
- 狀態：已核准（2026-10-09 依實作計畫的驗證結果修訂，見 §12）
- 實作計畫：`docs/superpowers/plans/2026-10-09-s1-fork-baseline.md`
- 上層文件：`2026-10-08-tzuchi-puck-roadmap.md`
- 依據：`puck-audit/REPORT.md`（§1 資安、§5 相容性），以及其中引用的子報告

## 1. 目標

完成之後，會有一個以 Puck `v0.23.0` 為基線、由我方掌控的編輯器 **tceditor**，具備以下條件：

1. 函式庫本身已確認的資安問題都修好。其中最重要的 richtext stored XSS，要從資料格式上根除（F1），而且預覽與正式頁面的呈現完全一致。
2. 移除與我方無關的套件、範例、上游發佈流程。
3. 工具鏈改為 pnpm，與 tzuchi-uikit 一致；在本機可以一鍵驗證。
4. 有一套自架的 Supabase 開發環境，和現有的 tciam stack 互不干擾。

**不在 S1 範圍內**：
- 資料表與 API 設計（S3）、元件 schema（S2）、效能改造（S5）、大型依賴升級（S6）。
- 遠端 repo 與 CI 平台的決定（等使用者決定 GitLab 等平台後再處理）。

## 2. 分支與遠端

- 從 tag `v0.23.0`（b4204f09）建立分支 **`tzuchi/main`**，作為 fork 的主線。
- 現有的 `main` 不動，保留為上游的參考鏡像，日後用來查看差異或個別移植修正。
- remote `origin` 改名為 `upstream`，只用於參考，絕不推送。我方遠端（如 GitLab）確定後，再新增為 `origin`。
- commit 一律使用 Angular 風格的 conventional commits。

## 3. 套件與 repo 結構

### 3.1 改名與版本

產品名稱定為 **tceditor**，套件名稱不再出現 puck。

| 項目 | 原本 | 改為 |
|---|---|---|
| 核心套件名 | `@puckeditor/core` | `@tzuchi/tceditor` |
| heading 外掛 | `@puckeditor/plugin-heading-analyzer` | `@tzuchi/tceditor-plugin-heading-analyzer` |
| CSS export | `./puck.css`、`./no-external.css` | `./tceditor.css`（F6 之後已不含外部字型，只需一個） |
| 版本 | `0.23.0` | 從 `0.1.0` 重新起算。來源版本（Puck v0.23.0）記錄在 `NOTICE` 與 `CHANGELOG` |

- 改名的目的是避免與 npm 上的官方套件混淆，並防範 dependency confusion。
- repo 內所有 import（demo、外掛、tsconfig paths）一併改名。
- **對外 API 識別名稱暫不改名**，例如 `<Puck>`、`usePuck`、`Config` 型別、CSS class 前綴、`data-puck-*` 屬性。理由：
  - 改名牽涉數百處，風險高，又和 S1 的目標無關。
  - 保留原名，上游文件才能繼續當作參考。
  
  日後若要全面改名，另立子專案處理。
- S1 不發佈到任何 registry。tzuchi-uikit 如何使用這個套件，在 S2 決定。

### 3.2 移除

| 移除 | 原因 |
|---|---|
| `recipes/*`（四個，含 AI 版） | 範例預設零驗證（評估報告 #6），AI 版依賴 Puck Cloud。我方應用在 S3 自建 |
| `packages/create-puck-app` | 用來產生上述 recipes，預設啟用 AI |
| `packages/field-contentful` | 用不到 |
| `packages/plugin-emotion-cache` | HeroUI 採用 Tailwind，不需要 Emotion |
| `.github/`（workflows、dependabot、範本） | 上游的 GitHub 與 npm 發佈流程。CI 待遠端確定後重建 |
| `lerna.json`、`scripts/publish.sh`、release 相關 scripts | 上游的 npm 發佈流程 |
| demo 的第三方分析（Plausible）與外部字型（rsms.me） | 不送資料給第三方 |
| `CODE_OF_CONDUCT.md` | 上游社群守則，唯一的通報管道是 Puck 的 Discord；tceditor 是內部專案 |

### 3.3 保留

- `packages/core`、`packages/plugin-heading-analyzer`、`packages/tsconfig`、`packages/tsup-config`、`packages/eslint-config-custom`。
- `apps/demo`：開發用 playground，也是 smoke test 的目標。
- `scripts/e2e`。
- `apps/docs`：保留作為參考文件，但**移出 workspace 與建置**，不再維護它的網站。

### 3.4 授權

- 根目錄保留原 `LICENSE`（MIT，The Puck Contributors），並新增 `NOTICE`，註明本專案衍生自 Puck v0.23.0 及其授權。
- `packages/core` 的發佈內容（`files`）加入 `LICENSE` 與 `NOTICE`，修正評估報告 sec-supply-15 指出的缺漏。

## 4. 工具鏈：yarn 1 改為 pnpm

`v0.23.0` 使用 `yarn@1.22.19`，有 `yarn.lock` 與 `resolutions`。

1. 以 `pnpm import` 由 `yarn.lock` 產生 `pnpm-lock.yaml`，**保留 0.23.0 原本解析到的版本**，不順便升級。唯一例外是第 5 項的 tiptap。
2. 新增 `pnpm-workspace.yaml`。`packages` 不含 recipes 與 docs。
3. 以 pnpm 10 語法的 `onlyBuiltDependencies`（`esbuild`、`puppeteer`）與 `ignoredBuiltDependencies`（`@parcel/watcher`、`sharp`、`unrs-resolver`）控制 lifecycle script，只放必要項目。上游 main 的 `allowBuilds` 是 pnpm 11 語法。
4. 把 `resolutions` 改寫為 `overrides`。
5. 漏洞把關改用 `pnpm audit:gate`（`scripts/audit-gate.mjs`）：只有「隨 `packages/core`、`packages/plugin-heading-analyzer` 出貨的套件版本」有 advisory 時才失敗，其餘（demo、開發工具）只列出不阻擋。原因是 v0.23.0 的依賴圖約有 70 筆 advisory，多數在 demo 與開發工具，raw `pnpm audit --prod` 無法以少量 overrides 清零。
   - core 的 runtime 依賴有 GHSA-j95f-988m-3j2f、GHSA-cp6q-959q-f8rh、GHSA-c8x8-7fp4-3x9w，因此 tiptap 整組由 3.23.4 升到 **3.31.4**，並寫成精確版本（tiptap 各套件以精確版本互相宣告 peer，無法只用 override 拉高 `@tiptap/core`）。
   - 仍需要的 `overrides` 每一項都註明 GHSA 編號。
6. 根目錄的 `packageManager` 設為目前使用的 pnpm 版本，`engines.node` 設為 `>=24`（只影響開發環境）。`packages/core` 給使用端的 `engines` 維持 `>=20`。
7. 刪除 `yarn.lock` 與 `.yarnrc`。
8. 新增根目錄 script **`pnpm verify`**，依序執行 test、typecheck、lint、format:check、build、check:bundle（F1 的轉換入口加入後）、audit:gate。
9. demo 的 `dev`／`start` 只綁 `127.0.0.1`。

## 5. 移植上游的 bug 修正

使用 `git cherry-pick -x`，記錄來源。衝突不小時，改為參考原 commit 手動重做。

| commit | 內容 | 理由 |
|---|---|---|
| 6a396a5d | 切換視窗後，卡住的修飾鍵不再誤觸快捷鍵 | 評估報告：0.23.0 單按 z 會觸發 Undo |
| 90665dfb | Chrome 翻譯造成當機 | 穩定性 |
| 9e917a39 | inline text 欄位 hover 時版面位移 | UI 缺陷 |

其餘 commit 不移植：新功能，以及 pnpm 遷移與相依修補（由 §4 自己做）。

## 6. 函式庫層資安修補

### F1. richtext 改存結構化 JSON，全程使用同一個靜態渲染器（修 High：sec-render-01／sec-data-01，連帶處理 sec-render-02、sec-render-03）

**問題**：
- 0.23.0 的 richtext 以 HTML 字串儲存（`RichTextEditor/lib/use-synced-editor.ts:65` 呼叫 `editor.getHTML()`）。
- 渲染時有兩條路徑：
  - 正常路徑：lazy 載入 tiptap，用 `generateJSON`／`generateHTML` 正規化，伺服器端靠 happy-dom。
  - 暫時畫面：`RenderFallback.tsx:13`、`EditorFallback.tsx:24` 直接把原始 HTML 交給 `dangerouslySetInnerHTML`。
- 兩條路徑的輸出不同，暫時畫面又不安全。若只在暫時畫面加過濾器，仍然是兩套規則，**無法保證預覽與正式頁面一致**。

**作法**：消除「兩條路徑」本身。
1. **儲存格式改為 tiptap JSON**（ProseMirror document）。
   - 編輯器的 `onUpdate` 改用 `editor.getJSON()`。
   - richtext 欄位的值型別改為 `RichTextDoc`（仍接受舊的字串值）。
2. **所有顯示處都用同一個靜態渲染器**，直接把 JSON 轉成 React 元素。
   - 涵蓋公開頁（RSC、SSR、CSR）、編輯器畫布在 tiptap 載入前、欄位預覽。
   - 優先採用官方的 `@tiptap/static-renderer`（`./json/react`，3.31.4，以 node 與 mark 的 mapping 渲染 JSON，不需要 editor 也不需要 DOM）。
   - mapping 只涵蓋 PuckRichText 預設 schema：
     - node：`doc`、`paragraph`、`heading`（1–6）、`bulletList`、`orderedList`、`listItem`、`blockquote`、`codeBlock`、`horizontalRule`、`hardBreak`、`text`。
     - mark：`bold`、`italic`、`underline`、`strike`、`code`、`link`。
     - 屬性：`textAlign`。
3. **移除 lazy 與 Suspense 的暫時畫面**，因為渲染器輕量，可以同步渲染。
   - richtext 渲染路徑不再有任何 `dangerouslySetInnerHTML`。
   - `RenderFallback` 與 `EditorFallback` 改為呼叫同一個渲染器。
   - 編輯時仍 lazy 載入 tiptap 編輯器；載入前看到的就是最終呈現。
4. **屬性在 mapping 層驗證**：
   - `link.href` 只允許 `http`、`https`、`mailto`、`tel` 與相對路徑，不合格就不輸出連結。
   - `textAlign` 只允許 `left`、`center`、`right`、`justify`。
   - link 的 `class` 一律清除，`rel` 去掉 `opener`（防止 reverse tabnabbing）。
   - 不認得的 node 或 mark 一律不輸出（只保留其中的文字）。
   - 編輯器建立連結時也套用同一個 `isSafeHref` 規則；tiptap 預設允許的 `ftp:`、`sms:`、`callto:` 等協定不再能建立連結。
   - 渲染器依完整的預設 schema 渲染，不依欄位的 `options` 過濾；`options` 只影響編輯器。
   - `tiptap.extensions` 新增的 node 與 mark 不會被渲染，重新開啟編輯器時也會被移除（開發模式會警告）。需要新型別時，在 mapping 加上對應的渲染與驗證。
5. **相容舊的 HTML 字串**：
   - 渲染時若遇到字串，一律當作純文字段落輸出，由 React escape，渲染期不解析 HTML。編輯器也把舊字串當純文字載入，與公開頁一致；因此上線前要先執行轉換工具。
   - 轉換工具是套件入口 `@tzuchi/tceditor/richtext-migrate`（`richTextHtmlToJson`、`migrateRichTextInData`），在伺服器端以 tiptap 的 `generateJSON` 轉換既有資料，只有這個入口使用 happy-dom。
6. **渲染器以獨立模組對外匯出**（`renderRichText`、`normalizeRichText`、`isSafeHref`、`textToRichText`、`RichTextContent` 與型別），S2 的 schema、S3 的寫入驗證、S4 的 MCP 都會重用。mapping 物件本身是否公開，留待 S2 決定。
   - 寫入端只需要驗證 JSON 結構（node 與 mark 型別、屬性、深度上限），不必淨化 HTML。

**實作前的 spike（第一步）**：確認以下三點。
- `@tiptap/static-renderer/json/react` 的 API 能產出與 tiptap `getHTML()` 等價的標記。
- 公開頁的 bundle 增量 ≤ 10 KB gzip。
- 不依賴 DOM，可在 RSC 與 edge 執行。

任一項不符時，改採**自建的 JSON → React 渲染器**。schema 固定且小，預估約 150 行、零依賴，設計與保證完全相同。

**效果**：

| 面向 | 結果 |
|---|---|
| 預覽一致性 | 編輯器、預覽、公開頁使用同一個渲染器，輸出必然相同；沒有閃動，也沒有「暫時畫面」 |
| 資安 | 不再有 HTML 字串進入 DOM；文字由 React escape；屬性在 mapping 層驗證。XSS（#1）、CSS 注入（sec-render-03）、深層巢狀強制走不安全 fallback（sec-render-02）一併消失 |
| 效能與相容 | 伺服器端不再需要 happy-dom（perf B8：每個欄位 0.68–2.03 ms；CJS 下必定失敗）；edge runtime 也可以渲染 richtext（評估報告 §5.2 的不相容問題消失） |
| 後端與 LLM | 資料是結構化 JSON，可以用 schema 嚴格驗證；MCP 和 LLM 產出的內容可預測 |

**代價與限制**：
- 儲存格式改變。PoC 既有的 HTML 內容要用轉換工具轉一次。
- 日後新增 tiptap extension（例如圖片或表格）時，要同時在 mapping 加上對應的渲染與屬性驗證。這是刻意設計的明確擴充點。
- `happy-dom` 與 `@tiptap/html` 留在 `dependencies`，但只被轉換入口使用；`pnpm check:bundle` 保證主入口與 RSC 入口的打包結果不引用它們。路線圖 S6 的「happy-dom → static-renderer」因此提前在 S1 完成。

### F2. JSON 深度與大小上限（取代原本的 try/catch 方案）

- 渲染器對 JSON 巢狀深度設上限（預設 100 層）。超過的部分只輸出文字，不遞迴渲染。
- 文件大小上限交給 S3 的寫入驗證處理。

### F3. `mapFields`／`walkTree` 的 O(n²) 合併（sec-data-02）

- reduce 搭配 spread 的寫法改用 `Object.fromEntries`。不用 `Object.assign` 或 `acc[k] = v`，因為遇到 `__proto__` key 會呼叫 setter 而改到原型。
- 對外行為不變。

### F4. 原型成員名稱造成崩潰（sec-data-05）

- 元件型別查找改用自有屬性檢查：helper `lookupComponentConfig`（`lib/lookup-component-config.ts`），以 `Object.prototype.hasOwnProperty.call` 實作（core 的 TypeScript lib 不含 `Object.hasOwn`）。涵蓋 Render、ServerRender、SlotRender、DropZone、store、permissions、insert、`group-zones-by-component`、`migrate`、`transformProps`、`build-layer-tree` 等讀取點。
- 找不到的型別沿用既有的 "No configuration for {type}" 行為。
- `walkAppState` 建立的 `nodes` 與 `zones` 索引改用 `Object.create(null)`，避免 id 是 `__proto__` 時汙染原型。

### F5. CSP nonce 支援（sec-supply-11）

- `<Puck>` 新增選用的 `nonce` prop。
- `use-inject-css` 在主文件與 iframe 注入的 `<style>` 都帶上這個 nonce；其他執行期注入點（dnd-kit 的 `StyleInjector`、放下動畫的 `<style>`、tiptap 的 `injectNonce`）也一併帶上。
- 鏡像進 iframe 的樣式，只在原樣式本來就帶同一個 nonce 時才設定。
- 沒有傳入時，行為與現在相同。

### F6. 預設 CSS 不再載入外部字型

- `bundle/index.css` 移除 `@import url("https://rsms.me/inter/inter.css")`。
- 字型由宿主應用或設計系統自行提供。
- 只保留單一 CSS export `./tceditor.css`，見 §3.1。

### F7. 依賴整理

- 移除宣告了卻未使用的 `deep-diff`、`react-hotkeys-hook`、`@dnd-kit/helpers`（已在 v0.23.0 以 `git grep` 確認沒有 import）。
- 把實際有使用、卻未宣告的 `classnames` 補進 `dependencies`。

## 7. 開發基礎設施：自架 Supabase（`tceditor`）

- **位置**：`infra/supabase/`。
- **基底**：與 tciam 相同的官方 self-host Docker 設定，ref `a4be1674911d863d55d351d245fba8e83b62dc76`，以 Envoy 作為 gateway。
- **隔離**：
  - compose 專案名 `tceditor`，所有 container 以 `tceditor-` 開頭。
  - volume 與網路由專案名自動隔離。
  - 所有 host port 只綁 `127.0.0.1`。
- **不含 logs 子系統**（Logflare、Vector），以節省資源。
- **Port 規劃**：避開 tciam 的 3100、3300、5433、6544、8100、8101、9100，以及開發常用的 3000、5190–5191、6006–6007。

  | 服務 | host port |
  |---|---|
  | API gateway（API 與 Studio 共用，Studio 以 basic auth 保護） | 127.0.0.1:8200（官方 Envoy 只有一個 listener，不使用 8201） |
  | Postgres（Supavisor session 模式） | 127.0.0.1:5434 |
  | Postgres（transaction pooler） | 127.0.0.1:6545 |

  啟動前以 `lsof` 再確認一次這些 port 沒有被佔用。
- **祕密**：JWT secret、anon key、service key、Postgres 密碼以官方工具產生，寫在 `.env`。`.env` 列入 gitignore，repo 只提交 `.env.example`。
- **開發設定**：S1 不含寄信服務，Auth 設為 email 自動確認。S3 再決定是否串接 tciam SSO。
- **腳本**：`infra/supabase/setup-env.sh`、`up.sh`、`down.sh`、`reset.sh`（共用函式在 `lib.sh`）。`reset.sh` 只清除 `tceditor` 自己的 container、volume 與資料目錄。
- **URL**：`API_EXTERNAL_URL` 為 `http://127.0.0.1:8200/auth/v1`；`SUPABASE_PUBLIC_URL` 與 `SITE_URL` 為 `http://127.0.0.1:8200`。
- **授權**：vendored 的官方檔案為 Apache-2.0，`infra/supabase/LICENSE` 附全文。

## 8. 文件

- `CLAUDE.md` 改寫成 fork 版：
  - 依 0.23.0 的結構更新。例如 props 管線位於 `lib/use-slots.tsx` 等處，而不是 main 才有的 `lib/props/*`。
  - 更新套件名，改為 pnpm 指令。
  - 加入資安規則：
    - 禁止新增 `dangerouslySetInnerHTML`。
    - richtext 只以 JSON 儲存，並由共用渲染器輸出。
    - 新增 tiptap extension 時，必須同時加上渲染 mapping 與屬性驗證。
    - 元件型別查找使用 `lookupComponentConfig`；執行期注入的 `<style>` 要帶 nonce。
- `README.md` 改寫為 fork 的說明：來源、差異、如何驗證、如何啟動 Supabase。
- `CONTRIBUTING.md`、`apps/demo/README.md` 改寫，移除上游專屬內容。

## 9. 測試計畫

1. 既有的 jest 測試全部通過。
2. **F1 spike 結果**（實作的第一步）：記錄 `@tiptap/static-renderer/json/react` 的 API 驗證結果、bundle 增量，以及在 RSC 與 edge 的可用性，並據此決定採用它或自建渲染器。
3. **XSS 回歸測試集**，新增在 `packages/core` 的 `__tests__`：
   - 惡意輸入分為兩類：
     - 竄改過的 JSON：`link.href` 為 `javascript:` 及其編碼變形、`data:`；`textAlign` 為 CSS 注入字串；未知的 node 與 mark；attrs 帶 `on*` 或 `style`。
     - 舊格式的 HTML 字串：評估報告 gap-v0230-sec 的 12 種 payload，加上 `iframe srcdoc`、`svg onload`。
   - 每種都以 `renderToString`（伺服器端）與 jsdom 中的 client render 兩種方式，送進共用渲染器、編輯器畫布與 `<Render>`。
   - 斷言輸出中沒有可執行的 script、`on*` 屬性、`javascript:` 或 `data:` URL、不在 mapping 內的元素；HTML 字串一律被當作純文字。
   - 以 `git grep dangerouslySetInnerHTML` 確認 richtext 路徑已不再使用它。
4. **一致性測試**：
   - 拿編輯器產生的典型內容（標題、清單、連結、對齊、粗斜體、程式碼、引言、換行），比對兩邊的輸出：
     - 共用渲染器的 `renderToString` 輸出。
     - tiptap `getHTML()` 的輸出。
   - 正規化後兩者必須相同。
   - 確認編輯器畫布在 tiptap 載入前、載入後的 DOM 相同，沒有閃動。
5. **轉換工具**：HTML 經過 `@tzuchi/tceditor/richtext-migrate` 轉成 JSON 之後再渲染，結果應與原本正常路徑的輸出相同。
6. F2：深度 5,000 的 JSON 不會拋錯，也不會 stack overflow；超過上限的部分只輸出文字。
7. **SSR 不需要 happy-dom**：在沒有安裝 happy-dom 的情況下，`renderToString(<Render>)` 能正常輸出 richtext。
8. F3：10,000 個 key 的 props 經過 `mapFields`，在本機上低於 200 ms。
9. F4：`type` 或 id 為 `constructor`、`__proto__` 的資料不會讓 Render 或編輯器崩潰，也不會汙染 `Object.prototype`。
10. F5：傳入 `nonce` 時，注入的 `<style>` 都帶有該值。
11. `pnpm verify` 全部通過；`apps/demo` 能在本機啟動，可以拖放與編輯 richtext（以 puppeteer 自動驗證，並保留人工步驟）。
12. Supabase：
   - `tceditor` 的所有 container 都是 healthy。
   - `http://127.0.0.1:8200/rest/v1/`：不帶 key 回 401；anon key 讀根路徑回 403（官方 RBAC 只讓 service_role 讀 OpenAPI 根路徑）；service_role 讀根路徑回 200；anon 讀暫時建立的資料表回 200。
   - Studio 可以開啟。
   - 同一時間 tciam stack 的狀態不變（`docker compose ls` 顯示 running(17)）。

## 10. 驗收標準

- [ ] `tzuchi/main` 從 `v0.23.0` 建立；`upstream` remote 設定完成；`main` 未被修改。
- [ ] 套件已改名為 `@tzuchi/tceditor`，版本為 `0.1.0`；§3.2 的項目已移除；`LICENSE` 與 `NOTICE` 就位。
- [ ] 已改用 pnpm，`pnpm verify` 全綠。
- [ ] 三個上游修正已移植，或已重做並記錄來源。
- [ ] F1 的 spike 已有結論；F1–F7 完成，§9 的測試全部通過；richtext 渲染路徑中已沒有 `dangerouslySetInnerHTML`。
- [ ] `tceditor` Supabase 可以啟動與停止，不影響 tciam。
- [ ] `CLAUDE.md` 與 `README.md` 已更新。

## 11. 風險

| 風險 | 緩解 |
|---|---|
| `pnpm import` 的結果和 yarn 解析的版本有差異 | 比對主要 runtime 依賴的解析版本，並跑完整測試 |
| cherry-pick 產生衝突 | 改為手動重做，並記錄來源 commit |
| 改名漏改某處，造成 build 失敗 | 用 `git grep "@puckeditor"` 確認全部改完 |
| Docker 資源不足（4 CPU／16 GB，已有 tciam 的 17 個 container） | 不啟用 logs 子系統；觀察 `docker stats` |
| `@tiptap/static-renderer` 的 API 或體積不符需求 | spike 先行；不符時改用自建的 JSON → React 渲染器（約 150 行、零依賴） |
| 共用渲染器與 tiptap `getHTML()` 的輸出有差異 | 第 4 項一致性測試把關 |
| 舊 HTML 資料在轉換前被當作純文字顯示 | 上線前先執行轉換工具；PoC 資料量小 |

## 12. 修訂紀錄

**2026-10-09**：實作計畫在暫存 worktree 實測後，使用者核准以下 10 項與原規格不同的做法，本文件已就地修訂：

1. `verify` 以 `audit:gate` 取代 raw `pnpm audit --prod`（§4 第 5、8 項）。
2. tiptap 整組升到 3.31.4（§4 第 1、5 項）。
3. demo 的 `dev`／`start` 只綁 `127.0.0.1`（§4 第 9 項）。
4. 編輯器也把舊 HTML 字串當純文字（F1 第 5 點）。
5. 渲染器不依欄位 `options` 過濾（F1 第 4 點）。
6. `tiptap.extensions` 新增的型別不渲染、重新開啟編輯器時會被移除（F1 第 4 點）。
7. 連結協定收緊為 `isSafeHref`（F1 第 4 點）。
8. Supabase gateway 只綁 8200（§7）。
9. anon key 讀 `/rest/v1/` 根路徑回 403（§9 第 12 項）。
10. 刪除 `CODE_OF_CONDUCT.md`（§3.2）。

其餘實作細節的差異（例如 F3 改用 `Object.fromEntries`、F4 以 `hasOwnProperty.call` 實作、F5 涵蓋的額外注入點、轉換入口的位置），也已同步寫入上文；完整清單見實作計畫開頭的「與規格的差異」。

