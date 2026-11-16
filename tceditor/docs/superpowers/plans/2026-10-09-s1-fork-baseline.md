# S1：Fork 基線與開發基礎設施 實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `tzuchi/main` 上把 Puck v0.23.0 變成由我方掌控、以 pnpm 管理、已修補函式庫層資安問題（richtext 改存 JSON 並共用一個靜態渲染器）、可一鍵 `pnpm verify` 驗證的編輯器 `@tzuchi/tceditor`，並備妥與 tciam 隔離的自架 Supabase 開發環境。

**Architecture:** 依序執行 14 個 task。Task 1–4 建立工具鏈、改名、整理 CSS 與依賴、移植上游修正；Task 5–9 把 richtext 改為 Tiptap JSON，`lib/richtext/` 提供正規化（`normalizeRichText`）與以 `@tiptap/static-renderer` 為基礎的同步渲染器（`renderRichText`、`RichTextContent`），編輯器、載入前畫面、預覽與公開頁（CSR、SSR、RSC）都走這一條路徑，舊 HTML 一律當純文字，轉換工具獨立成 `@tzuchi/tceditor/richtext-migrate`。Task 10–12 修 F3（O(n²) 合併）、F4（原型成員名稱）、F5（CSP nonce）；Task 13 在 `infra/supabase/` 以官方 compose 加 override 建立 `tceditor` stack；Task 14 改寫文件並做最終驗收。

**Tech Stack:** pnpm 10.26.1 workspace、turbo 2.9、Node 26（開發；`engines` ≥ 24）、React 19、Next.js 16.2.6（demo）、TypeScript 5.9、tsup／esbuild、Jest 29（ts-jest、jsdom 26）、`node:test`、Prettier 2、ESLint 9、Tiptap 3.31.4（含 `@tiptap/static-renderer`、`@tiptap/html`、happy-dom 20 只供轉換入口）、`@dnd-kit` 0.4.0、zustand 5、Docker 29 + Compose 2.40（Supabase self-host，ref `a4be1674911d863d55d351d245fba8e83b62dc76`，Envoy gateway）、zsh。

**Spec:** `docs/superpowers/specs/2026-10-08-s1-fork-baseline-design.md`（S1 設計規格）；上層路線圖為 `docs/superpowers/specs/2026-10-08-tzuchi-puck-roadmap.md`（決策 D1–D8 與子專案 S1–S6）。

**執行前準備：**
- 下方「與規格的差異」中標示 **需使用者確認** 的 10 個項目，使用者已於 2026-10-09 全部核准（含第 26 項刪除 `CODE_OF_CONDUCT.md`），規格也已就地修訂（規格 §12）。執行時不需要再詢問。
- 本計畫文件若放在 `docs/superpowers/plans/`，請先單獨 commit（例如 `docs: add S1 implementation plan`）再開始 Task 1；否則各 task 的 `git status --short` 都會多一行 `?? docs/superpowers/plans/…`。Task 1 Step 1 已註明 commit 計畫後 `git diff --stat v0.23.0 HEAD` 會多 1 個檔案。
- 所有 task 依編號順序在主工作目錄 `/Users/kaellim/Desktop/projects/puck`（分支 `tzuchi/main`）執行；每個 task 的 Step 1 都會檢查上一個 task 的最後一個 commit。需要網路的步驟：Task 1 的 `pnpm import`／`pnpm install`、每次 `audit:gate`、Task 13 的 GitHub sparse clone。

## Global Constraints

- 套件名：`@tzuchi/tceditor`（`packages/core`）、`@tzuchi/tceditor-plugin-heading-analyzer`；版本 `0.1.0`；兩者 `"private": true`。S1 不發佈到任何 registry。
- CSS export 只保留 `"./tceditor.css"`（對應 `dist/index.css`），移除 no-external 入口；`bundle/index.css` 不得 `@import url("https://rsms.me/inter/inter.css")`，套件 CSS 不得引用任何遠端網址。
- 對外 API 識別名（`<Puck>`、`usePuck`、`Config`、CSS class 前綴、`data-puck-*`）不改名。
- 從 tag `v0.23.0`（`b4204f09`）建立的 `tzuchi/main` 是 fork 主線；`main` 不動（`49b529b4`）；remote `origin` 改名為 `upstream`，push URL 設為 `no_push`，絕不推送。
- commit 使用 Angular 風格的 conventional commits（英文）；`git add` 一律列出路徑，Task 14 之前不得用 `git add -A`（根目錄有未追蹤的 `CLAUDE.md`）。
- 根目錄 `packageManager` 為 `"pnpm@10.26.1"`；根目錄 `engines.node` 為 `>=24`（`.nvmrc` 為 `24`）；`packages/core` 給使用端的 `engines` 維持 `>=20`。
- `pnpm-workspace.yaml`（pnpm 10 語法）：`packages: ["apps/demo", "packages/*"]`、`shamefullyHoist: true`、`autoInstallPeers: true`、`onlyBuiltDependencies: [esbuild, puppeteer]`、`ignoredBuiltDependencies: ["@parcel/watcher", sharp, unrs-resolver]`、`overrides: { yaml: ">=2.8.3" }`；每個 override 都要註明 GHSA 編號。`apps/docs` 留在 repo 作參考，但不在 workspace、不參與建置。
- 內部互相引用一律 `"workspace:*"`。
- 根目錄 scripts：`build`、`dev`、`lint`、`format`、`format:check`、`test`、`smoke`、`typecheck`、`audit:gate`、`verify`；Task 8 起另有 `check:bundle`。
- `verify`（Task 1–7）＝ `pnpm test && pnpm typecheck && pnpm lint && pnpm format:check && pnpm build && pnpm audit:gate`；Task 8 起 ＝ `pnpm test && pnpm typecheck && pnpm lint && pnpm format:check && pnpm build && pnpm check:bundle && pnpm audit:gate`。
- `typecheck` ＝ `pnpm --filter ./packages/core typecheck` ＝ `tsc -p tsconfig.typecheck.json`，排除 `dist`、`build`、`node_modules`、`**/__tests__/**`、`**/__helpers__/**`、`**/*.spec.ts`、`**/*.spec.tsx`、`tsup.config.ts`、`jest.config.ts`。
- `format`／`format:check` 的範圍是 `"**/*.{ts,tsx,mjs,md,mdx,css}"`；`.prettierignore` 含 `CHANGELOG.md`、`dist/`、`.next/`、`build/`、`docs/superpowers/`，Task 13 起再加 `infra/supabase/docker/`。
- `audit:gate` 只在「隨 `packages/core`、`packages/plugin-heading-analyzer` 出貨的套件版本」有 advisory 時失敗（exit 1），讀不到依賴圖或 audit 結果時 exit 2；`BUNDLED_DEV_DEPENDENCIES` 為 `{ "packages/core": ["css-box-model", "lucide-react"] }`，production 程式碼 import 新的 devDependency 時必須同步更新。
- 所有 `@tiptap/*` 解析為 `3.31.4`，`packages/core/package.json` 寫成不帶 `^` 的精確版本；`@tiptap/static-renderer` 版本必須精確等於 lockfile 解析出的 `@tiptap/core`（`3.31.4`）。
- richtext 目錄 `packages/core/lib/richtext/`：`types.ts`（`RichTextMark`、`RichTextNode`、`RichTextDoc = RichTextNode & { type: "doc" }`）、`is-safe-href.ts`（`isSafeHref(href: unknown): href is string`）、`normalize.ts`（`RICHTEXT_MAX_DEPTH = 100`；`normalizeRichText(value: unknown, options?: { maxDepth?: number }): RichTextDoc`）、`text-to-richtext.ts`（`textToRichText(text: string): RichTextDoc`）、`render.tsx`（`renderRichText(value: unknown): ReactNode`）、`index.ts`（barrel）。
- `isSafeHref` 只允許 `http`、`https`、`mailto`、`tel` 與相對路徑；拒絕 `javascript:`、`data:`、`vbscript:` 及其大小寫、空白、控制字元、實體編碼變形。
- `normalizeRichText`：字串一律變成純文字段落、不解析 HTML；未知 node／mark 只保留文字；屬性逐一驗證（`textAlign` 只允許 `left`、`center`、`right`、`justify`；不合格的 link 不輸出連結；link 的 `class` 清成 `null`、`rel` 去掉 `opener`）；超過深度 100 只輸出文字，文字擷取不得遞迴。
- mapping 只涵蓋 PuckRichText 預設 schema：node `doc`、`paragraph`、`heading`（1–6）、`bulletList`、`orderedList`、`listItem`、`blockquote`、`codeBlock`、`horizontalRule`、`hardBreak`、`text`；mark `bold`、`italic`、`underline`、`strike`、`code`、`link`；`nodeMapping`／`markMapping` 是 null-prototype 物件，並提供 `unhandledNode`／`unhandledMark`。
- `RichTextContent({ content }: { content: unknown })` 位於 `components/RichTextEditor/components/RichTextContent.tsx`，輸出 `<div className={getClassName()}><div className="rich-text">…</div></div>`，不得使用 hooks。
- richtext 渲染路徑不得出現 `dangerouslySetInnerHTML`（`__tests__/richtext-no-inner-html.spec.ts` 把關）；richtext 欄位的儲存格式是 `editor.getJSON()` 的 Tiptap JSON。
- 轉換入口：`lib/richtext/html-to-json.ts` 的 `richTextHtmlToJson(html: string): RichTextDoc`、`lib/richtext/migrate-data.ts` 的 `migrateRichTextInData<T extends Data>(data: T, config: Config): T`、`bundle/richtext-migrate.ts`、package export `"./richtext-migrate"`；`@tiptap/html` 與 happy-dom 只供這個入口使用，主入口與 RSC 入口的打包結果不得引用它們（`packages/core/scripts/check-bundle-imports.mjs`，接進 `verify` 的 `check:bundle`）。
- 公開頁初始 chunk 的增量 ≤ 10 KB gzip（實測約 +2.1 KB）。
- F4 helper：`packages/core/lib/lookup-component-config.ts` 的 `lookupComponentConfig(config: Config, type: string | undefined | null): Config["components"][string] | undefined`（可指派給 `ComponentConfig | undefined`），以 `Object.prototype.hasOwnProperty.call` 實作；core 的有效 TypeScript lib 是 ES2015 加 ES2020，**不得在 core 原始碼使用 `Object.hasOwn`**（TS2550）。
- 以使用者資料（id、zone compound、props key）為 key 的物件用 `Object.create(null)` 或 `Object.fromEntries` 建立，不得在一般物件上 spread 累加或以 `acc[k] = v` 寫入。
- F5：`PuckProps.nonce?: string`；`AppStore.nonce?: string`；`useInjectUiCss(nonce?: string)`；`useInjectIframeCss(targetDocument?: Document, nonce?: string)`；`AutoFrameProps.nonce?: string`；鏡像進 iframe 的 `<style>` 只在原樣式本來就帶同一個 nonce 時才設定；沒有傳入 `nonce` 時 DOM 輸出與 v0.23.0 相同。
- Supabase：位於 `infra/supabase/`；官方 `supabase/supabase` repo 的 `docker/` 目錄，ref `a4be1674911d863d55d351d245fba8e83b62dc76`，逐字 vendored；compose 專案名 `tceditor`；所有 container 以 `tceditor-` 開頭，realtime 加網路別名 `realtime-dev.supabase-realtime`；host port 只綁 `127.0.0.1`：API gateway `8200`→容器 `8000`、Postgres session `5434`→`5432`、transaction pooler `6545`→`6543`；不含 logs 子系統；`.env` 不進版控；腳本 `infra/supabase/up.sh`、`down.sh`、`reset.sh`（另有 `setup-env.sh`、`lib.sh`）。
- 避開 tciam 的 port 3100、3300、5433、6544、8100、8101、9100，以及開發常用的 3000、5190–5191、6006–6007；啟動前以 `lsof` 確認 port 沒有被佔用。
- 不得操作 tciam、tcdata、weekly、en、odoo 等既有 stack；只能 kill 自己以 `$!` 記下的 PID，不得 `pkill`／`killall`／依名稱比對。
- demo 的 `dev`／`start` 只綁 `127.0.0.1`（`next dev -H 127.0.0.1`、`next start -H 127.0.0.1`）；demo 不得從第三方網域載入字型、樣式或腳本。
- `CHANGELOG.md` 頂端的 `## tceditor 0.1.0 (unreleased)` → `### Changes from Puck v0.23.0` 是條列清單；Task 10 起新的一行一律插在清單後的空行與 `## [0.23.0]` 之前。
- 在 zsh 中迴圈變數不得命名為 `path` 或 `status`；在 linked worktree 中執行會呼叫 turbo 的指令前先 `export TURBO_CACHE_DIR="$PWD/.turbo/cache"`（Task 1 必須在主工作目錄執行）。

## Review Focus

全域審查從規格推導、但原本沒有任何 task 的測試涵蓋、最可能讓使用者踩到的 5 種情況。對應的測試已補進擁有那段程式碼的 task，並在暫存 worktree 依計畫重播驗證過；第 1–4 項的 jest 測試也確認在該 task 改動前的實作下會失敗（紅燈輸出已寫進各 task）：

1. **richtext 放在 `array`／`object` 欄位裡**（S2 的卡片列表、FAQ 等常見結構），其中混有舊 HTML 字串 → 預期：`<Render>` 與 RSC 的 `ServerRender` 對每一個巢狀值都以共用渲染器輸出 `.RichTextEditor > .rich-text`，舊字串顯示為純文字。測試：Task 6 `components/Render/__tests__/index.spec.tsx` 的 `renders richtext inside array and object fields`（`Render`、`ServerRender` 各一）。
2. **Next.js 在伺服器端渲染公開頁、瀏覽器再 hydrate** → 預期：沒有 hydration mismatch、沒有 recoverable error 或 `console.error`，hydrate 前後 DOM 完全相同（不閃動）。測試：Task 6 同檔的 `hydrates the server-rendered page without a mismatch`。
3. **內容存進 Postgres `jsonb` 再讀回（key 依長度重排），以同一份內容回到編輯器** → 預期：編輯器視為同一份內容，不呼叫 `setContent` 重設文件，游標與選取不跳動。測試：Task 7 `components/RichTextEditor/__tests__/editor.spec.tsx` 的 `keeps its document when the same content comes back with reordered keys`。
4. **竄改或 LLM 產生的 JSON 中，link 帶 `target: "_blank"` 與 `rel: "opener"`**（reverse tabnabbing）→ 預期：輸出的 `rel` 不含 `opener`，其餘連結類型保留，全被去掉時為 `null`。原實作會原樣輸出 `rel="opener"`，所以 Task 5 的 `normalize.ts` 新增 `linkRel`。測試：Task 5 `lib/richtext/__tests__/normalize.spec.ts` 的 `drops rel opener, so a page opened in a new tab cannot reach this one`。
5. **Supabase stack 已在執行時再跑一次 `infra/supabase/up.sh`**（例如 Docker Desktop 重開後，container 依 `restart: unless-stopped` 自動恢復）→ 預期：exit 0，不把 stack 自己佔用的 8200／5434／6545 判為「被別人佔用」，11 個 container 不重建也不重啟。測試：Task 13 Step 19 追加的檢查（以真正的 `tceditor` stack 驗證後已 `reset.sh --yes` 清除）。

## 與規格的差異

各片段的偏離彙整如下。標示 **需使用者確認** 的項目會改變規格的明文要求或使用者可見的行為，請在執行前確認；其餘是實作細節或規格未明說之處。

**Task 1（工具鏈）**
1. **需使用者確認**：`verify` 的最後一步用 `pnpm audit:gate` 取代規格 §4.5／§4.8 的 raw `pnpm audit --prod`。v0.23.0 的依賴圖約有 70 筆 advisory，其中 demo 的 `next@16.2.6` 有 3 筆 critical（修補版 16.3.6），其餘多是 eslint、jest、puppeteer 等開發工具；以少量 overrides 無法清零，硬升 next 又違反 §4.1「不順便升級」。gate 依「套件版本是否隨發佈套件出貨」判斷（`pnpm audit` 每個漏洞版本只印一條代表路徑，依路徑判斷會漏報），其餘只列出不阻擋。
2. **需使用者確認**：tiptap 整組由 3.23.4 升到 3.31.4 並釘成精確版本（規格 §4.1 要求不升級）。原因：core 的 runtime 依賴有 GHSA-j95f-988m-3j2f、GHSA-cp6q-959q-f8rh、GHSA-c8x8-7fp4-3x9w，tiptap 各套件以精確版本互相宣告 peer，無法只用 override 拉高 `@tiptap/core`。規格 F1 寫的 static-renderer 版本本來就是 3.31.4，所以兩者一致。
3. 規格 §4.3 的 `allowBuilds` 是 pnpm 11 語法；pnpm 10 改用 `onlyBuiltDependencies`／`ignoredBuiltDependencies`。
4. **需使用者確認**：demo 的 `dev`／`start` 只綁 `127.0.0.1`（規格未列），避免帶 critical advisory 的 next 伺服器暴露在區網。
5. 其他：`resolutions` 只搬 `yaml`（其餘已不在依賴圖中）；`.nvmrc` 改為 24；`.prettierignore` 加入 `dist/`、`.next/`、`build/`、`docs/superpowers/`；`tsconfig.typecheck.json` 另排除 `__helpers__`；刪除指向不存在模組的 `components/RichTextEditor/index.ts`（TS2307）；audit gate 拆成 `audit-gate-lib.mjs`、`audit-gate.mjs` 與 `node:test` 測試，根目錄 `test` 一併執行；`CLAUDE.md` 只補兩個空行並備份到 `.git/tceditor-backup/CLAUDE.md.pre-task01`。

**Task 2–3（改名、CSS、依賴）**
6. `LICENSE`、`NOTICE` 以檔案副本提交到兩個套件目錄，並以 `package-files.spec.ts` 確保與根目錄相同；`turbo.json` 為 `@tzuchi/tceditor#test` 加上 `inputs`，避免快取重播。
7. 兩個套件標成 `"private": true`，移除 `repository`、`bugs`、`homepage`（遠端未定，不編造網址）。
8. `README.md`、`CONTRIBUTING.md` 只改含 `@puckeditor` 的行，整份改寫在 Task 14；安裝指令改為 `pnpm add … --workspace`，避免 dependency confusion。
9. `"./dist/index.css"` export 一併移除；demo 的 `apps/demo/app/styles.css` 也移除 rsms.me 字型（規格 F6 只點名函式庫，依 §3.2「不送資料給第三方」一併處理）。
10. F7 不新增 jest 測試，以 `git grep` 與 `dist` 檢查（`classnames` 由打包進 bundle 改為外部依賴）驗證。

**Task 5–9（richtext）**
11. **需使用者確認**：編輯器對舊 HTML 字串也當純文字（與公開頁一致）。代價：轉換前在編輯器修改舊資料，會把標籤文字存成內容，所以上線前要先跑轉換工具（規格 §11 已列此風險）。
12. 轉換工具是套件入口 `@tzuchi/tceditor/richtext-migrate`，不是規格 F1 第 5 點的 `scripts/richtext-html-to-json`；`@tiptap/html` 與 happy-dom 留在 `dependencies`（規格寫降為 devDependency），改以 `check:bundle` 保證只有這個入口使用。CJS 版需要 Node ≥ 22.12（`require(esm)`）。
13. `migrateRichTextInData` 使用專用走訪函式，不用 `mapFields`／`walkTree`（會補預設 slot、加入 `undefined` key、遇未知元件丟錯）。
14. 公開型別 `RichText` 改為 `RichTextDoc | string | ReactNode`（規格寫 `JSONContent`），在 render 中使用時要寫 `as ReactNode`。
15. link 的 `class` 一律清成 `null`、`rel` 去掉 `opener`（規格只點名 `href` 與 `textAlign`）；`isSafeHref` 拒絕含字元參照（`&#…`、`&name;`）的 href，副作用是 `?a=1&amp;b=2` 這類 href 會被移除連結（保留文字）。
16. **需使用者確認**：欄位的 `options` 只影響編輯器，渲染器不依 `options` 過濾（公開頁依完整預設 schema 渲染）。
17. **需使用者確認**：`tiptap.extensions` 新增的 node／mark 不會渲染，重新開啟編輯器時也會被移除（開發模式會警告，CHANGELOG 列為 breaking）。
18. **需使用者確認**：編輯器的連結規則收緊為 `isSafeHref`，Tiptap 預設允許的 `ftp:`、`sms:`、`callto:` 等協定不能再建立連結。
19. 其他：規格 §9 第 4 項的一致性 oracle 用 `generateHTML(json, [PuckRichText])`（同為 ProseMirror `DOMSerializer` 輸出），另以 `EditorFallback` 對照載入後的編輯器；`textToRichText` 不拆行；`EditorFallback` 直接呼叫 `renderRichText`（避免多包一層 `.RichTextEditor`）；core 與 demo 的 tsconfig 新增 `paths`、jest 的 `transformIgnorePatterns` 加入 happy-dom；規格 §9 第 11 項的手動驗證在 Task 14 以 puppeteer 自動化。

**Task 10–12（F3–F5）**
20. F3 改用 `Object.fromEntries`，不用規格寫的「`Object.assign` 或賦值」（後兩者遇到 `__proto__` key 會呼叫 setter）。
21. F4 用 `Object.prototype.hasOwnProperty.call`，不用規格舉例的 `Object.hasOwn`（TS2550）；`lookupComponentConfig` 回傳 `Config["components"][string] | undefined`；另外修了測試抓到的同類問題（`build-layer-tree` 的 `getZonesByParent`、`migrate` 的兩個累加器、`migrateDynamicZonesForComponent` 與 `transformProps` 的查表）。行為變化：`insert` 遇到沒有設定的 type 不再拋 TypeError；`walkTree` 遇到 slot 內原型成員名稱的 type 會拋 `Could not find component config`。
22. F5 範圍比規格字面多三處：dnd-kit 的 `StyleInjector`、放下動畫的 hide `<style>`、Tiptap 的 `<style data-tiptap-style>`（`injectNonce`）；store snapshot 多一行 `"nonce": undefined`。已知限制：AutoFrame 以 `setAttribute` 同步 html／body 的 `style` 屬性，受 `style-src-attr` 管制，nonce 無法放行。

**Task 13（Supabase）**
23. **需使用者確認**：只綁 `127.0.0.1:8200`，不使用規格的 `8201`（官方 Envoy 只有一個 listener，Studio 也走 8200 並以 basic auth 保護）。
24. **需使用者確認**：規格 §9 第 12 項「以 anon key 呼叫 `/rest/v1/` 回應正常」改為：不帶 key 401、anon 讀根路徑 403（官方 RBAC 只讓 service_role 讀 OpenAPI 根路徑）、service_role 200、anon 讀暫時資料表 200。
25. 其他：`API_EXTERNAL_URL` 含 `/auth/v1`；`.supabase-version` 以 `git add -f` 提交；新增 `setup-env.sh`、`lib.sh`、`.gitignore`、`README.md`、`LICENSE`（Apache-2.0 全文），`.prettierignore` 加入 vendored 目錄；session 模式另設 `POSTGRES_HOST_PORT=5434`；只產生 HS256 傳統金鑰；Task 13 結束時 stack 為停止狀態（資料保留）。

**Task 14（文件與驗收）**
26. **需使用者確認**：刪除 `CODE_OF_CONDUCT.md`（不在規格 §3.2 的移除清單；唯一的通報管道是 Puck 的 Discord）。不同意時，依 Task 14 開頭列出的 Step 10、11、17、21 修改後再執行；那條路徑未驗證。
27. `CLAUDE.md` 由未追蹤改為受版控（原檔另備份到 `.git/tceditor-backup/CLAUDE.md.pre-task14`）；另外改寫 `CONTRIBUTING.md`、`apps/demo/README.md`（規格 §8 只點名 `CLAUDE.md` 與 `README.md`）；Supabase 驗收沿用 Task 13 已驗證的指令。

**全域審查**
28. 依 Review Focus 補上 5 項檢查（Task 5 改了 `normalize.ts`），連帶更新 Task 5–9、12、14 的測試數與 commit 統計；Task 1 Step 18 的備份改放 `.git/tceditor-backup/`；Task 9 Step 5 的 zsh 迴圈變數改名；Task 10、12 的起點 commit 改為明確訊息；Task 11 Step 31 的預期輸出改為依序執行後的實際結果。
29. 規格文件已於 2026-10-09 依上述偏離就地修訂（§4、§6 F1–F5、§7、§8、§9、新增 §12 修訂紀錄）。

## Task 總覽

所有 task 依序執行，後一個 task 的 Step 1 會確認前一個 task 的最後一個 commit。最後一欄是該 task 完成後 `pnpm verify` 的 jest 基準（suite／測試／snapshot），全域審查從 `refs/tceditor-plan/task04` 依 Task 5–12 的計畫重播得到相同數字。

| # | 名稱 | 主要檔案 | 相依 | 完成後 jest 基準 |
|---|---|---|---|---|
| 1 | 工具鏈基線 | `package.json`、`pnpm-workspace.yaml`、`pnpm-lock.yaml`、`turbo.json`、`scripts/audit-gate*.mjs`、`packages/core/tsconfig.typecheck.json`、`packages/core/jest.config.ts`；刪除 `recipes/`、`create-puck-app`、`field-contentful`、`plugin-emotion-cache`、`.github/`、yarn 與 lerna 檔案 | —（起點 `284c74ba`） | 50／267／19，`node:test` 10 |
| 2 | 改名為 tceditor 與授權 | 兩個套件的 `package.json`、`NOTICE`、套件內的 `LICENSE`／`NOTICE`、demo 的 `package.json`／`tsconfig.json`／`next.config.js`、`packages/core/__tests__/package-files.spec.ts`、`CHANGELOG.md` | 1 | 51／273／19 |
| 3 | CSS 與依賴整理（F6、F7） | `packages/core/bundle/index.css`、刪除 `bundle/no-external.*`、`packages/core/package.json`、`apps/demo/app/styles.css`、`packages/core/__tests__/css-imports.spec.ts` | 2 | 52／275／19 |
| 4 | 移植上游修正 | cherry-pick `6a396a5d`、`90665dfb`、`9e917a39`（`lib/use-hotkey.ts`、AutoFrame、DraggableComponent、Puck Layout／Preview、InlineTextField CSS） | 3 | 53／283／19 |
| 5 | richtext 核心模組 | `packages/core/lib/richtext/*`、`components/RichTextEditor/components/RichTextContent.tsx`、`packages/core/tsconfig.json`（`paths`）、`@tiptap/static-renderer` | 4 | 58／458／19 |
| 6 | 渲染路徑改用共用渲染器 | `components/RichTextEditor/lib/use-richtext-props.tsx`、`lib/field-transforms/default-transforms/rich-text-transform.tsx`、`bundle/core.ts`、`bundle/rsc.tsx`、刪除 `Render.tsx`／`RenderFallback.tsx`、`apps/demo/tsconfig.json` | 5 | 60／556／19 |
| 7 | 編輯器改存 JSON | `components/RichTextEditor/lib/use-synced-editor.ts`、`fit-to-schema.ts`、`stable-stringify.ts`、`extension.ts`、`types.ts`、`components/EditorFallback.tsx` | 6 | 65／608／19 |
| 8 | HTML→JSON 轉換入口與打包檢查 | `lib/richtext/html-to-json.ts`、`lib/richtext/migrate-data.ts`、`bundle/richtext-migrate.ts`、`packages/core/scripts/check-bundle-imports.mjs`、根目錄 `package.json`（`check:bundle`、`verify`） | 7 | 68／637／19，`node:test` 13 |
| 9 | demo 資料改為 JSON | `packages/core/types/API/index.ts`（`RichText`）、`apps/demo/config/blocks/{RichText,Hero}/*`、`apps/demo/config/initial-data.ts` | 8 | 68／637／19 |
| 10 | F3 O(n²) | `lib/data/map-fields.ts`、`lib/data/walk-tree.ts`、`lib/get-changed.ts` | 9 | 71／644／19 |
| 11 | F4 原型成員名稱 | `lib/lookup-component-config.ts`、`ServerRender`、`SlotRender/server.tsx`、`DropZone`、`lib/data/walk-app-state.ts`、`store/index.ts`、`store/slices/permissions.ts`、`reducer/actions/insert.ts`、`lib/migrate.ts`、`lib/transform-props.ts`、`lib/group-zones-by-component.ts`、`build-layer-tree.ts` | 10（`map-fields.ts` 接在 Task 10 之後） | 75／666／19 |
| 12 | F5 CSP nonce | `lib/use-inject-css.ts`、`components/AutoFrame/index.tsx`、`store/index.ts`、`components/Puck/index.tsx`、Layout／Preview、`components/DragDropContext/*`、`lib/dnd/drop-animation.ts`、`use-synced-editor.ts` | 11（`use-synced-editor.ts` 接在 Task 7 之後） | 80／691／19 |
| 13 | 自架 Supabase | `infra/supabase/docker/`（vendored）、`docker-compose.tceditor.yml`、`setup-env.sh`、`lib.sh`、`up.sh`、`down.sh`、`reset.sh`、`README.md`、`LICENSE`、`.prettierignore` | 12（程式碼只依賴 Task 1） | 不變 |
| 14 | 文件與最終驗證 | `CLAUDE.md`（納入版控）、`README.md`、`CONTRIBUTING.md`、`apps/demo/README.md`、`CHANGELOG.md`、刪除 `CODE_OF_CONDUCT.md`；乾淨 clone 驗證、puppeteer 端對端、§10 驗收 | 1–13 | 80／691／19 |

---

### Task 1: 工具鏈基線

目的：把 `tzuchi/main` 從 v0.23.0 的 yarn 1 + lerna 結構，整理成 pnpm workspace，移除規格 §3.2 列出的上游內容，並建立 `pnpm verify`（test → typecheck → lint → format:check → build → audit:gate）。完成後所有指令在主工作目錄都能一次跑綠，共 8 個 commit。

**執行位置**：本 task 必須直接在主工作目錄 `/Users/kaellim/Desktop/projects/puck`（分支 `tzuchi/main`）執行，**不要建立 git worktree**。原因有二：Step 3–4 的盤點與刪除清單是依主工作目錄現有的 gitignored 殘留物寫的；turbo 2.9 在 linked worktree 中預設會把快取寫進主 checkout 的 `.turbo/cache`。若因故必須在 worktree 中執行，請略過 Step 3–4（改用 `git status --ignored --porcelain` 自行確認沒有殘留物），並在每次執行會呼叫 turbo 的指令（`pnpm test`、`pnpm lint`、`pnpm build`、`pnpm verify`）之前，先執行 `export TURBO_CACHE_DIR="$PWD/.turbo/cache"`（`.turbo` 已在 `.gitignore` 中）。

commit 時一律**明確列出路徑**，不要用 `git add -A`，因為根目錄有未追蹤、不屬於本 task 的 `CLAUDE.md`。

**規格偏離（請 orchestrator 先向使用者確認第 1、2、4 項）：**
1. `verify` 的最後一步用 `pnpm audit:gate`，取代規格 §4.5／§4.8 寫的 raw `pnpm audit --prod`。v0.23.0 的依賴圖中，`pnpm audit` 約有 70 筆 advisory。其中 `apps/demo` 的 `next@16.2.6` 有 3 筆 critical（GHSA-2xp9-vwfh-vxw4、GHSA-p293-qw3h-jr36、GHSA-vcvr-r3jv-pc5j，修補版為 16.3.6），其餘大多來自 eslint、jest、puppeteer 等開發工具。這些用最少量的 overrides 無法清零，而硬升 next 又違反 §4.1「不順便升級」。因此 gate 只在「會隨發佈套件出貨的套件版本」有 advisory 時失敗，其他 advisory 全部列出、不阻擋。
2. tiptap 整組升到 3.31.4，並釘成精確版本。規格 §4.1 要求不順便升級，§4.5 要求以 overrides 修補，但 core 有 3 筆 advisory，而 tiptap 各套件彼此以精確版本宣告 peer，無法只用 override 拉高 `@tiptap/core`。
3. 規格 §4.3 寫的 `allowBuilds` 是上游 main（pnpm 11）的設定。依共同介面，本 task 改用 pnpm 10 的 `onlyBuiltDependencies`／`ignoredBuiltDependencies`。
4. 新增項目（規格未列）：`apps/demo` 的 `dev`／`start` 改為只綁 `127.0.0.1`（Step 21–23），避免帶有上述 critical advisory 的 next 伺服器暴露在區網。規格 §9.11 的本機手動測試照常使用 `http://localhost:3000`，不受影響。

**Files:**
- Delete:
  - `recipes/`（`next`、`next-ai`、`react-router`、`react-router-ai`）
  - `packages/create-puck-app/`、`packages/field-contentful/`、`packages/plugin-emotion-cache/`
  - `.github/`（workflows、dependabot、ISSUE_TEMPLATE、pull_request_template）
  - `lerna.json`、`.npmrc`、`.yarnrc`、`yarn.lock`
  - `scripts/publish.sh`、`scripts/create-changelog.js`、`scripts/get-unstable-version.js`
  - `packages/core/components/RichTextEditor/index.ts`（`export * from "./Editor"` 指向不存在的模組，tsc 報 TS2307）
- Create:
  - `pnpm-workspace.yaml`
  - `pnpm-lock.yaml`（由 `pnpm import` 產生，之後由 `pnpm install` 維護）
  - `packages/core/tsconfig.typecheck.json`
  - `scripts/audit-gate-lib.mjs`、`scripts/audit-gate.mjs`
- Modify:
  - `package.json`（根目錄）、`.nvmrc`、`.prettierignore`、`turbo.json`
  - `apps/demo/app/layout.tsx`、`apps/demo/package.json`
  - `packages/core/package.json`、`packages/core/jest.config.ts`
  - `packages/plugin-heading-analyzer/package.json`、`packages/tsup-config/package.json`
  - 未追蹤、不 commit：`CLAUDE.md`（只補兩個空行以通過 `format:check`，修改前先備份到 `.git/tceditor-backup/CLAUDE.md.pre-task01`，見 Step 18；Task 14 會改寫此檔）
- Test:
  - `scripts/audit-gate-lib.test.mjs`（新增，`node:test`，10 個測試）
  - 既有的 `packages/core` jest 測試（50 suites／267 tests／19 snapshots）

**Interfaces:**
- Consumes：無。起點是 `tzuchi/main` 上的 `284c74ba`（= tag `v0.23.0` 加上只新增 `docs/superpowers/` 規格文件的 commit）。
- Produces（後續 task 依賴）：
  - 根目錄 `package.json` scripts（完整字串）：
    - `"build": "turbo run build"`、`"dev": "turbo run dev --filter=demo"`、`"lint": "turbo run lint"`
    - `"format:check": "prettier --check \"**/*.{ts,tsx,mjs,md,mdx,css}\""`、`"format": "prettier --write \"**/*.{ts,tsx,mjs,md,mdx,css}\""`。`.mjs` 在檢查範圍內，所以後續新增的 `.mjs`（例如 Task 8 的 `packages/core/scripts/check-bundle-imports.mjs`）都必須符合 Prettier。`.js`、`.json`、`.yaml` 不在範圍內。
    - `"smoke": "node scripts/e2e/smoke.mjs"`
    - `"test": "turbo run test && node --test scripts/audit-gate-lib.test.mjs"`
    - `"typecheck": "pnpm --filter ./packages/core typecheck"`（用路徑 filter，Task 2 改套件名不受影響）
    - `"audit:gate": "node scripts/audit-gate.mjs"`
    - `"verify": "pnpm test && pnpm typecheck && pnpm lint && pnpm format:check && pnpm build && pnpm audit:gate"`（Task 8 在這串之中加入 `pnpm check:bundle`）
  - `apps/demo/package.json` scripts：`"dev": "next dev -H 127.0.0.1"`、`"start": "next start -H 127.0.0.1"`。後續 task 一律用 `http://localhost:3000` 或 `http://127.0.0.1:3000` 開 demo，區網 IP 連不上。`pnpm smoke` 用的 `http://localhost:3000` 不受影響。
  - `packages/core/package.json` scripts 新增 `"typecheck": "tsc -p tsconfig.typecheck.json"`；`prepare` 改為 `"pnpm build"`（每次 `pnpm install` 都會建置 core 與 plugin 的 `dist`）。
  - `packages/core/tsconfig.typecheck.json`：繼承 `./tsconfig.json`，`noEmit`、`types: ["node"]`，排除 `dist`、`build`、`node_modules`、`**/__tests__/**`、`**/__helpers__/**`、`**/*.spec.ts`、`**/*.spec.tsx`、`tsup.config.ts`、`jest.config.ts`。後續 task 在 `packages/core` 新增的 production 檔案自動納入型別檢查；放在 `__tests__/` 的測試不納入。
  - `pnpm-workspace.yaml`：`packages: ["apps/demo", "packages/*"]`、`shamefullyHoist: true`、`autoInstallPeers: true`、`onlyBuiltDependencies: [esbuild, puppeteer]`、`ignoredBuiltDependencies: ["@parcel/watcher", sharp, unrs-resolver]`、`overrides: { yaml: ">=2.8.3" }`。後續新增 override 時，每一項都要註明 GHSA 編號。
  - 內部依賴一律 `workspace:*`（`@puckeditor/core`、`eslint-config-custom`、`tsconfig`、`tsup-config`）。
  - `scripts/audit-gate-lib.mjs` 匯出：
    - `GATED_IMPORTERS: string[]`：`["packages/core", "packages/plugin-heading-analyzer"]`，以目錄判斷，與套件名無關。
    - `BUNDLED_DEV_DEPENDENCIES: Record<string, string[]>`：`{ "packages/core": ["css-box-model", "lucide-react"] }`。
    - `shippedPackages(projectDir: string, bundledDev?: string[]): Set<string>`：回傳 `"<name>@<version>"` 集合。
    - `collectFindings(report: object, shipped: Set<string>): Finding[]`
    - `sortFindings(findings: Finding[]): Finding[]`
  - `audit:gate` 的行為：執行一次完整的 `pnpm audit --json`（含 devDependencies）。只要 advisory 的 `<module>@<version>` 屬於 `GATED_IMPORTERS` 會出貨的套件集合，就判為 GATED。這個集合包含 `dependencies`、`optionalDependencies`、`BUNDLED_DEV_DEPENDENCIES`，以及它們的遞移依賴，不含 peer。判斷依據是套件版本，**不看** pnpm 印出的路徑。結束碼：0 表示通過，1 表示有 GATED finding，2 表示讀不到依賴圖或 audit 結果。執行前需要先 `pnpm install`。
  - **維護規則**：tsup 只把 `dependencies`、`peerDependencies` 與 tsup-config 的 `external` 清單排除在 bundle 之外。後續 task 若讓 `packages/core` 或 plugin 的 production 程式碼 import 新的 devDependency（它會被打包進 `dist`），或把現有項目移出 devDependencies，都必須同步更新 `BUNDLED_DEV_DEPENDENCIES`，以及 `scripts/audit-gate-lib.test.mjs` 中斷言該常數的測試。可用 Step 29 的指令重新盤點。清單中的名稱若已不是 devDependency，gate 會以 exit 2 失敗。
  - `pnpm-lock.yaml`：所有 `@tiptap/*` 都解析為 **3.31.4**（23 個套件）。`packages/core/package.json` 的 20 個 `@tiptap/*` 寫成精確的 `"3.31.4"`，不帶 `^`。`prosemirror-view` ≥ 1.42.3（驗證時為 1.42.6；執行時若 registry 有更新的 patch，pnpm 會解析到較新版本），`happy-dom` 20.9.0。Task 5 新增 `@tiptap/static-renderer` 時，也必須寫成精確的 `"3.31.4"`。
  - `packages/core/jest.config.ts` 的 `transformIgnorePatterns` 已能處理 `node_modules/.pnpm/...` 路徑。
  - git remote：`upstream`（fetch 指向 GitHub 上游，push URL 為 `no_push`，無法推送）。
  - **刻意不改**（交給 Task 2）：套件名仍是 `@puckeditor/core`、`@puckeditor/plugin-heading-analyzer`，版本仍是 `0.23.0`；根目錄 `name` 仍是 `puck-repo`；`README.md`、`CONTRIBUTING.md`、`apps/demo/README.md` 中的 yarn 與 create-puck-app 字樣留給 Task 14。

- [ ] **Step 1: 確認起點**

```sh
cd /Users/kaellim/Desktop/projects/puck
git branch --show-current
git status --short
git merge-base --is-ancestor v0.23.0 HEAD && echo "based on v0.23.0"
git diff --stat v0.23.0 HEAD | tail -1
```

預期輸出：

```
tzuchi/main
?? CLAUDE.md
based on v0.23.0
 2 files changed, 318 insertions(+)
```

`git diff --stat v0.23.0 HEAD` 只能列出 `docs/superpowers/` 底下的檔案（若實作計畫本身也已 commit，檔案數會多 1）。若有其他差異或未 commit 的修改，先停下來確認。

- [ ] **Step 2: remote `origin` 改名為 `upstream`，並停用 push**

```sh
git remote rename origin upstream
git remote set-url --push upstream no_push
git remote -v
git config branch.main.remote
```

預期輸出：

```
upstream	https://github.com/puckeditor/puck.git (fetch)
upstream	no_push (push)
upstream
```

`git remote rename` 會一併把 `refs/remotes/origin/*` 改成 `refs/remotes/upstream/*`，並更新 `main` 的追蹤設定。之後若誤下 `git push upstream`，會得到 `fatal: 'no_push' does not appear to be a git repository`。

- [ ] **Step 3: 盤點主工作目錄中的 gitignored 殘留物（唯讀）**

```sh
git status --ignored --porcelain
/usr/bin/find . -name node_modules -prune -o -name ".env*" -print
```

預期輸出（前者；順序可能不同）：

```
?? CLAUDE.md
!! .turbo/
!! apps/demo/.next/
!! apps/demo/.turbo/
!! apps/demo/next-env.d.ts
!! apps/demo/node_modules/
!! apps/docs/.next/
!! apps/docs/.turbo/
!! apps/docs/next-env.d.ts
!! apps/docs/node_modules/
!! apps/docs/public/sitemap.xml
!! node_modules/
!! packages/core/.turbo/
!! packages/core/README.md
!! packages/core/dist/
!! packages/core/node_modules/
!! packages/create-puck-app/node_modules/
!! packages/eslint-config-custom/node_modules/
!! packages/field-contentful/.turbo/
!! packages/field-contentful/dist/
!! packages/field-contentful/node_modules/
!! packages/plugin-emotion-cache/.turbo/
!! packages/plugin-emotion-cache/dist/
!! packages/plugin-emotion-cache/node_modules/
!! packages/plugin-heading-analyzer/.turbo/
!! packages/plugin-heading-analyzer/dist/
!! packages/plugin-heading-analyzer/node_modules/
!! packages/tsconfig/node_modules/
!! packages/tsup-config/node_modules/
!! recipes/next-ai/.next/
!! recipes/next-ai/.turbo/
!! recipes/next-ai/next-env.d.ts
!! recipes/next-ai/node_modules/
!! recipes/next/.next/
!! recipes/next/.turbo/
!! recipes/next/next-env.d.ts
!! recipes/next/node_modules/
!! recipes/react-router-ai/.turbo/
!! recipes/react-router-ai/build/
!! recipes/react-router-ai/node_modules/
!! recipes/react-router/.turbo/
!! recipes/react-router/build/
!! recipes/react-router/node_modules/
```

後者預期只有兩個「已追蹤」的範例檔，會在 Step 5 隨 `recipes/` 一起以 `git rm` 移除：

```
./recipes/next-ai/.env.example
./recipes/react-router-ai/.env.example
```

這些 `!!` 項目是舊 `main` 分支（pnpm）安裝與建置留下的 `node_modules`、`dist`、`.next`、`.turbo`、`next-env.d.ts`、`build`，以及舊 `prepare` 複製的 `packages/core/README.md` 與 docs 建置產生的 `apps/docs/public/sitemap.xml`。若實際清單多出上面沒有的項目，逐一判斷，**任何 `.env`、`.env.*` 都不可刪**。

- [ ] **Step 4: 刪除 Step 3 盤點出的殘留物**

只刪下列精確路徑（不要用 `git clean -x`，它會連 `.env` 一起刪）：

```sh
rm -rf \
  .turbo \
  apps/demo/.next \
  apps/demo/.turbo \
  apps/demo/next-env.d.ts \
  apps/demo/node_modules \
  apps/docs/.next \
  apps/docs/.turbo \
  apps/docs/next-env.d.ts \
  apps/docs/node_modules \
  apps/docs/public/sitemap.xml \
  node_modules \
  packages/core/.turbo \
  packages/core/README.md \
  packages/core/dist \
  packages/core/node_modules \
  packages/create-puck-app/node_modules \
  packages/eslint-config-custom/node_modules \
  packages/field-contentful/.turbo \
  packages/field-contentful/dist \
  packages/field-contentful/node_modules \
  packages/plugin-emotion-cache/.turbo \
  packages/plugin-emotion-cache/dist \
  packages/plugin-emotion-cache/node_modules \
  packages/plugin-heading-analyzer/.turbo \
  packages/plugin-heading-analyzer/dist \
  packages/plugin-heading-analyzer/node_modules \
  packages/tsconfig/node_modules \
  packages/tsup-config/node_modules \
  recipes/next-ai/.next \
  recipes/next-ai/.turbo \
  recipes/next-ai/next-env.d.ts \
  recipes/next-ai/node_modules \
  recipes/next/.next \
  recipes/next/.turbo \
  recipes/next/next-env.d.ts \
  recipes/next/node_modules \
  recipes/react-router-ai/.turbo \
  recipes/react-router-ai/build \
  recipes/react-router-ai/node_modules \
  recipes/react-router/.turbo \
  recipes/react-router/build \
  recipes/react-router/node_modules
git status --ignored --porcelain
```

預期輸出：只剩一行

```
?? CLAUDE.md
```

- [ ] **Step 5: 移除規格 §3.2 的上游內容**

```sh
git rm -r -q recipes packages/create-puck-app packages/field-contentful packages/plugin-emotion-cache .github lerna.json scripts/publish.sh scripts/create-changelog.js scripts/get-unstable-version.js .npmrc
for p in recipes packages/create-puck-app packages/field-contentful packages/plugin-emotion-cache .github lerna.json .npmrc; do test -e "$p" && echo "still exists: $p"; done; echo checked
git ls-files packages scripts | cut -d/ -f1-2 | sort -u
git diff --cached --shortstat
```

預期輸出：

```
checked
packages/core
packages/eslint-config-custom
packages/plugin-heading-analyzer
packages/tsconfig
packages/tsup-config
scripts/e2e
 114 files changed, 3442 deletions(-)
```

若出現 `still exists: …`，表示該目錄裡還有 Step 3 沒列到的 ignored 檔案，回到 Step 3 檢查。

確認沒有其他程式還引用被刪的套件：

```sh
git grep -n -E "create-puck-app|field-contentful|plugin-emotion-cache|recipes/" -- . ':!CHANGELOG.md' ':!apps/docs' ':!docs/superpowers'
```

預期只剩說明文件（Task 14 會改寫）與根目錄 `package.json` 的 `workspaces`（Step 9 會整個改寫）：

```
README.md:37:npm i @puckeditor/core --save # or npx create-puck-app my-app
README.md:87:Use `create-puck-app` to quickly spin up a a pre-configured app based on our provided [recipes](https://github.com/puckeditor/puck/tree/main/recipes):
README.md:90:npx create-puck-app my-app
README.md:95:- [**next**](https://github.com/puckeditor/puck/tree/main/recipes/next): Next.js example, using App Router and static page generation
README.md:96:- [**react-router**](https://github.com/puckeditor/puck/tree/main/recipes/react-router): React Router v7 app example, using dynamic routes to create pages at any level
apps/demo/README.md:16:npx create-puck-app my-app
package.json:36:    "recipes/*",
```

- [ ] **Step 6: Commit**

```sh
git commit -m "chore: remove upstream recipes, scaffolder, unused packages and release tooling"
git status --short
```

預期：commit 成功，`git status --short` 只剩 `?? CLAUDE.md`。

- [ ] **Step 7: 移除 demo 的 Plausible 分析**

把 `apps/demo/app/layout.tsx` 整個改成：

```tsx
import "./styles.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div>{children}</div>
      </body>
    </html>
  );
}
```

確認：

```sh
git grep -n -i plausible -- apps/demo || echo "no plausible"
```

預期輸出：`no plausible`

- [ ] **Step 8: Commit**

```sh
git add apps/demo/app/layout.tsx
git commit -m "chore(demo): remove Plausible analytics"
```

預期：`1 file changed, 9 deletions(-)`。

- [ ] **Step 9: 改寫根目錄 `package.json`**

整個檔案改成下列內容（移除 `workspaces`、`resolutions`、release／version／changelog scripts，以及 `conventional-changelog-angular`、`conventional-recommended-bump`、`lerna`、`standard-changelog`、`rimraf`；`asciichart`、`puppeteer` 是 `scripts/e2e` 用的，保留；`format`／`format:check` 的 glob 加入 `mjs`，讓 `scripts/` 底下的 `.mjs` 也受檢查）：

```json
{
  "private": true,
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev --filter=demo",
    "lint": "turbo run lint",
    "format:check": "prettier --check \"**/*.{ts,tsx,mjs,md,mdx,css}\"",
    "format": "prettier --write \"**/*.{ts,tsx,mjs,md,mdx,css}\"",
    "smoke": "node scripts/e2e/smoke.mjs",
    "test": "turbo run test"
  },
  "devDependencies": {
    "asciichart": "^1.5.25",
    "eslint": "^9.0.0",
    "eslint-config-custom": "workspace:*",
    "prettier": "^2.5.1",
    "puppeteer": "^24.8.2",
    "turbo": "^2.5.8"
  },
  "name": "puck-repo",
  "packageManager": "pnpm@10.26.1",
  "version": "0.23.0",
  "engines": {
    "node": ">=24.0.0"
  }
}
```

- [ ] **Step 10: 內部依賴改為 `workspace:*`，`prepare` 改用 pnpm**

`packages/core/package.json`：

原始片段：

```json
    "test": "jest",
    "prepare": "cp ../../README.md . && yarn build",
    "postpublish": "rm README.md"
  },
```

替換為：

```json
    "test": "jest",
    "prepare": "pnpm build"
  },
```

同一個檔案的 `devDependencies` 中，下列三行逐一替換（每行在檔案中只出現一次）：

| 原始（逐字） | 替換為 |
|---|---|
| `    "eslint-config-custom": "*",` | `    "eslint-config-custom": "workspace:*",` |
| `    "tsconfig": "*",` | `    "tsconfig": "workspace:*",` |
| `    "tsup-config": "*",` | `    "tsup-config": "workspace:*",` |

`packages/plugin-heading-analyzer/package.json`：

| 原始（逐字） | 替換為 |
|---|---|
| `    "prepare": "yarn build"` | `    "prepare": "pnpm build"` |
| `    "@puckeditor/core": "^0.23.0",` | `    "@puckeditor/core": "workspace:*",` |
| `    "eslint-config-custom": "*",` | `    "eslint-config-custom": "workspace:*",` |
| `    "tsconfig": "*",` | `    "tsconfig": "workspace:*",` |
| `    "tsup-config": "*",` | `    "tsup-config": "workspace:*",` |

`packages/tsup-config/package.json`：

| 原始（逐字） | 替換為 |
|---|---|
| `    "tsconfig": "*",` | `    "tsconfig": "workspace:*",` |

`apps/demo/package.json`：

| 原始（逐字） | 替換為 |
|---|---|
| `    "@puckeditor/core": "*",` | `    "@puckeditor/core": "workspace:*",` |
| `    "eslint-config-custom": "*",` | `    "eslint-config-custom": "workspace:*",` |

確認沒有遺漏：

```sh
git grep -n -E '": "\*"|yarn' -- package.json apps/demo/package.json 'packages/*/package.json'
```

預期：沒有輸出（exit code 1）。

- [ ] **Step 11: 新增 `pnpm-workspace.yaml`，更新 `turbo.json`、`.nvmrc`、`.prettierignore`**

`pnpm-workspace.yaml`（新檔）：

```yaml
# apps/docs stays in the repo as reference material only; it is not part of
# the workspace, the install or the build.
packages:
  - "apps/demo"
  - "packages/*"

shamefullyHoist: true
autoInstallPeers: true

# Supply-chain mitigation: pnpm 10 only runs dependency lifecycle scripts for
# packages listed in onlyBuiltDependencies. Keep this list minimal.
onlyBuiltDependencies:
  - esbuild # installs/verifies the platform binary used by tsup (core/plugin builds)
  - puppeteer # downloads Chromium for the e2e smoke test (pnpm smoke)

# Install scripts we deliberately skip. Each one only builds from source when
# the prebuilt optional binary is missing. Listing them here silences pnpm's
# "Ignored build scripts" warning.
ignoredBuiltDependencies:
  - "@parcel/watcher" # via sass (next, typescript-plugin-css-modules)
  - sharp # via next; the demo does not use next/image
  - unrs-resolver # via eslint-config-next's import resolver

# pnpm ignores package.json `resolutions`; v0.23.0's yarn resolutions that still
# apply to the dependency graph are carried over here.
overrides:
  # GHSA-48c2-rrv3-qjmp. Also keeps postcss-load-config on yaml@2.9.0, the
  # version yarn resolved for v0.23.0.
  yaml: ">=2.8.3"
```

`turbo.json` 整個改成（`globalEnv` 只留 `NODE_ENV`；其餘是 Plausible 與 docs／Vercel 部署用的變數）：

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "globalEnv": ["NODE_ENV"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "lint": {},
    "test": {},
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

`.nvmrc` 整個改成：

```
24
```

`.prettierignore` 整個改成（`dist/`、`.next/`、`build/` 是建置產物；`docs/superpowers/` 是規格與計畫文件，其中的中文表格不適合交給 Prettier 重排；`/.nx/workspace-data` 隨 lerna 移除）：

```
CHANGELOG.md

# Generated build output (not source; Prettier does not read .gitignore)
dist/
.next/
build/

# Design specs and implementation plans are working documents, not shipped docs
docs/superpowers/
```

- [ ] **Step 12: 由 `yarn.lock` 產生 `pnpm-lock.yaml`**

```sh
pnpm --version
pnpm import
test -f pnpm-lock.yaml && echo "lockfile created"
```

預期輸出：第一行 `10.26.1`；`pnpm import` 約 1 分鐘（需要網路），結尾為：

```
 WARN  3 deprecated subdependencies found: glob@7.2.3, inflight@1.0.6, whatwg-encoding@3.1.1
 WARN  Issues with peer dependencies found
packages/plugin-heading-analyzer
└─┬ react-from-json 0.8.0
  ├── ✕ unmet peer react@"^15.0.0 || ^16.0.0 || ^17.0.0 || ^18.0.0": found 19.2.6
  └── ✕ unmet peer react-dom@"^15.0.0 || ^16.0.0 || ^17.0.0 || ^18.0.0": found 19.2.6
```

（中間可能夾雜 `WARN Request took …ms` 與 `deprecated` 警告，都不影響結果；react-from-json 的 peer 警告是 v0.23.0 原本就有的。）最後一行是 `lockfile created`。

`pnpm import` 的結果不完全固定：`snapshots` 中 `eslint-plugin-import@2.32.0` 的 peer 後綴可能是短寫法（`…(eslint-import-resolver-typescript@3.10.1)(eslint@9.39.4)`），也可能是長寫法（`…(eslint-import-resolver-typescript@3.10.1(eslint-plugin-import@2.32.0(…)(eslint@9.39.4))(eslint@9.39.4))(eslint@9.39.4)`），連跑幾次可能得到不同的一種。兩種寫法等價，都能通過 `--frozen-lockfile`，也不影響 Step 13 的比對；到 Step 36 之後會收斂成同一份 lockfile。可以用下面的指令看拿到的是哪一種，Step 36 與 Step 38 的預期輸出會依此分成兩種：

```sh
grep -c "^  eslint-plugin-import@2.32.0(@typescript-eslint/parser@8.59.3(eslint@9.39.4)(typescript@5.9.3))(eslint-import-resolver-typescript@3.10.1)(eslint@9.39.4):$" pnpm-lock.yaml
```

輸出 `1` 表示短寫法，`0` 表示長寫法（輸出 `0` 時 grep 的 exit code 是 1，屬正常）。

- [ ] **Step 13: 比對 pnpm 與 yarn 解析出的版本**

規格 §4.1 要求保留 v0.23.0 原本解析到的版本。用下面的一次性腳本比對（不存檔）：

```sh
python3 - yarn.lock pnpm-lock.yaml <<'EOF'
import collections, re, sys

yarn = collections.defaultdict(set)
names = None
for line in open(sys.argv[1]):
    line = line.rstrip("\n")
    if line and not line.startswith((" ", "#")) and line.endswith(":"):
        names = set()
        for spec in line[:-1].split(","):
            spec = spec.strip().strip('"')
            if "@npm:" in spec:
                spec = spec.split("@npm:", 1)[1]
            names.add(spec[: spec.rindex("@")])
    elif line.startswith("  version ") and names:
        for name in names:
            yarn[name].add(line.split('"')[1])
        names = None

lock = open(sys.argv[2]).read()
packages = lock.split("\npackages:\n", 1)[1].split("\nsnapshots:\n", 1)[0]
total = 0
for m in re.finditer(r"^  '?(@?[^@\s']+)@([^':(]+)", packages, re.M):
    total += 1
    name, version = m.groups()
    if version not in yarn.get(name, set()):
        print("NOT IN yarn.lock:", name, version, sorted(yarn.get(name, set())))
print("pnpm-lock packages:", total)
EOF
```

預期輸出：

```
NOT IN yarn.lock: react-is 19.3.0 ['16.13.1', '17.0.2', '18.3.1', '19.2.6']
pnpm-lock packages: 1014
```

唯一的差異是 `pretty-format@30`（jest 的 dev-only 依賴）以 npm alias `react-is-19@npm:react-is@^19.2.5` 宣告的套件；`pnpm import` 無法對應 alias，改從 registry 解析（19.2.6 → 19.3.0，若 registry 有更新的 19.x patch，這裡的版本也會跟著變）。可以接受。若出現其他套件，表示 import 沒有沿用 yarn 的解析，先停下來查原因。

- [ ] **Step 14: 移除 yarn 檔案並安裝**

```sh
git rm -q yarn.lock .yarnrc
pnpm install --frozen-lockfile
```

預期輸出（節錄）：

```
Scope: all 7 workspace projects
Lockfile is up to date, resolution step is skipped
Packages: +871
...
packages/core prepare$ pnpm build
packages/plugin-heading-analyzer prepare$ pnpm build
Done in …s using pnpm v10.26.1
```

可能出現 `esbuild … postinstall$ node install.js` 與 `puppeteer postinstall$ node install.mjs`（第一次會下載 Chromium 到 `~/.cache/puppeteer`）。**不應**出現 `Ignored build scripts` 的警告框；若出現，表示 `pnpm-workspace.yaml` 的 `onlyBuiltDependencies`／`ignoredBuiltDependencies` 沒寫對。

- [ ] **Step 15: 執行測試，確認 jest 在 pnpm 的目錄結構下失敗**

```sh
pnpm test
```

預期：失敗。輸出包含

```
@puckeditor/core:test: Test Suites: 6 failed, 44 passed, 50 total
@puckeditor/core:test: Tests:       1 failed, 244 passed, 245 total
```

以及

```
    SyntaxError: Unexpected token 'export'
      at Object.<anonymous> (../../node_modules/.pnpm/@dnd-kit+state@0.4.0/node_modules/@dnd-kit/state/dist/index.js:104:28)
```

原因：pnpm 的實體路徑是 `node_modules/.pnpm/<name>@<ver>/node_modules/<name>`，`transformIgnorePatterns` 的 negative lookahead 只看 `/node_modules/` 後面的第一段，`.pnpm` 不在白名單內，所以 `@dnd-kit` 的 ESM 沒被轉譯。

- [ ] **Step 16: 修正 `packages/core/jest.config.ts`**

原始片段：

```ts
    "/node_modules/(?!(?:@preact/signals-core|@preact/signals-react|@dnd-kit)/)",
```

替換為（與上游 main 相同的做法）：

```ts
    "/node_modules/(?!(?:\\.pnpm|@preact/signals-core|@preact/signals-react|@dnd-kit)/)",
```

- [ ] **Step 17: 再跑測試，確認通過**

```sh
pnpm test
```

預期輸出包含：

```
@puckeditor/core:test: Test Suites: 50 passed, 50 total
@puckeditor/core:test: Tests:       267 passed, 267 total
@puckeditor/core:test: Snapshots:   19 passed, 19 total
 Tasks:    1 successful, 1 total
```

（測試輸出中的 `console.error`／`console.warn` 堆疊是既有測試刻意觸發的，不是失敗。）

- [ ] **Step 18: lint 與 format:check**

```sh
pnpm lint
```

預期：exit code 0，結尾為

```
demo:lint: ✖ 8 problems (0 errors, 8 warnings)
@puckeditor/core:lint: ✖ 4 problems (0 errors, 4 warnings)
 Tasks:    3 successful, 3 total
```

（warnings 都是 v0.23.0 原有的 unused eslint-disable 與 exhaustive-deps，不在本 task 處理。）

主工作目錄有一個未追蹤的 `CLAUDE.md`，Prettier 也會檢查它，而它目前有兩處清單前少了空行。這是使用者的檔案、不在版控中，所以只有在它不符合 Prettier 時才處理：先備份，再用 Prettier 補空行，最後確認只新增了空行、沒有刪除任何內容（Task 14 會改寫此檔）。備份放在 `.git/tceditor-backup/` 裡：不會被追蹤，也不會像 `$TMPDIR` 那樣被 macOS 定期清掉；備份已存在時不覆蓋，所以重跑本步驟不會用改過的內容蓋掉原檔：

```sh
BACKUP="$(git rev-parse --git-common-dir)/tceditor-backup/CLAUDE.md.pre-task01"
if [ -f CLAUDE.md ] && ! pnpm exec prettier --check CLAUDE.md > /dev/null 2>&1; then
  mkdir -p "$(dirname "$BACKUP")"
  test -e "$BACKUP" && echo "backup exists, kept" || cp CLAUDE.md "$BACKUP"
  pnpm exec prettier --write CLAUDE.md
  git diff --no-index --numstat "$BACKUP" CLAUDE.md | cut -f1,2
  git diff --no-index -U0 "$BACKUP" CLAUDE.md | grep -E '^[-+]' | grep -v -E '^(\+\+\+|---) ' | sort | uniq -c
fi
pnpm format:check
```

預期輸出（`prettier --write` 那行的毫秒數會不同）：

```
CLAUDE.md 28ms
2	0
   2 +
```

接著是 `pnpm format:check` 的結尾：

```
Checking formatting...
All matched files use Prettier code style!
```

`2	0` 表示新增 2 行、刪除 0 行。`   2 +` 表示新增的 2 行都是空行。若 `CLAUDE.md` 已被使用者改過，新增的行數可能不同，但刪除必須是 0，`uniq -c` 也只能出現 `+` 這一種；否則用備份 `cp "$(git rev-parse --git-common-dir)/tceditor-backup/CLAUDE.md.pre-task01" CLAUDE.md` 還原後停下來確認。若 `CLAUDE.md` 本來就符合 Prettier（例如重跑本步驟時），`if` 區塊不會有輸出，也不會建立或改動備份。若印出 `backup exists, kept`，表示之前已備份過原檔，這次的 diff 是和那份原檔比較。備份檔 `.git/tceditor-backup/CLAUDE.md.pre-task01` 之後都不刪除，由使用者決定如何處理。

- [ ] **Step 19: build（含 apps/demo 的 next build）**

```sh
pnpm build
```

預期：exit code 0，輸出包含

```
demo:build: ✓ Compiled successfully in …s
demo:build: Route (app)
demo:build: ┌ ƒ /
demo:build: ├ ○ /_not-found
demo:build: ├ ƒ /[...puckPath]
demo:build: ├ ƒ /custom-ui/[...puckPath]
demo:build: ├ ○ /rsc
demo:build: └ ƒ /runtime-css-debug
 Tasks:    3 successful, 3 total
```

（plugin-heading-analyzer 的 DTS 階段會印出 `"Context" is not exported by "node_modules/@types/react/index.d.ts"`，這是 v0.23.0 原有的警告，不影響建置。）

- [ ] **Step 20: Commit**

```sh
git add package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json .nvmrc .prettierignore \
  apps/demo/package.json packages/core/package.json packages/core/jest.config.ts \
  packages/plugin-heading-analyzer/package.json packages/tsup-config/package.json
git status --short
git commit -m "build: migrate from yarn 1 to pnpm" -m "Generate pnpm-lock.yaml with pnpm import so the versions resolved for v0.23.0 are kept, and drop apps/docs from the workspace."
```

`git status --short` 預期（commit 前）：

```
M  .nvmrc
M  .prettierignore
D  .yarnrc
M  apps/demo/package.json
M  package.json
M  packages/core/jest.config.ts
M  packages/core/package.json
M  packages/plugin-heading-analyzer/package.json
M  packages/tsup-config/package.json
A  pnpm-lock.yaml
A  pnpm-workspace.yaml
M  turbo.json
D  yarn.lock
?? CLAUDE.md
```

預期 commit 結果：`13 files changed`。

- [ ] **Step 21: 確認 demo 目前監聽所有網卡**

`apps/demo` 依賴的 `next@16.2.6` 有 3 筆 critical advisory（見開頭的「規格偏離」第 1 項），而 `next dev`／`next start` 預設監聽所有網卡，同一個區網的機器都連得到。先確認現況（需要 Step 19 的 `.next` 建置結果）。

先確認 port 3217 沒有被占用：

```sh
lsof -nP -iTCP:3217 -sTCP:LISTEN || echo "port 3217 is free"
```

預期輸出：`port 3217 is free`。若被占用，把下面腳本中的 `3217` 全部換成另一個空的 port。

下面的腳本在背景啟動 `pnpm --filter demo start`，等它可以連線後，印出監聽位址並以 `localhost` 與 `127.0.0.1` 各發一次請求，最後只停止自己啟動的那一組程序。`set -m` 讓背景工作自成一個 process group，`kill -- -$pid` 會同時停掉 pnpm 與它底下的 next，不會動到其他程序：

```sh
bash -s <<'EOF'
set -m
PORT=3217 pnpm --filter demo start > "${TMPDIR:-/tmp}/tceditor-demo-start.log" 2>&1 &
pid=$!
curl -s -o /dev/null --retry 30 --retry-connrefused --retry-delay 1 http://127.0.0.1:3217/
grep -E "Local:|Network:" "${TMPDIR:-/tmp}/tceditor-demo-start.log"
lsof -nP -iTCP:3217 -sTCP:LISTEN | awk 'NR > 1 { print "listen", $9 }' | sort -u
curl -s -o /dev/null -w "http://localhost:3217/edit %{http_code}\n" http://localhost:3217/edit
curl -s -o /dev/null -w "http://127.0.0.1:3217/ %{http_code}\n" http://127.0.0.1:3217/
kill -TERM -- "-$pid"
wait "$pid" 2>/dev/null
lsof -nP -iTCP:3217 -sTCP:LISTEN > /dev/null || echo "stopped"
EOF
```

預期輸出（`Network:` 後面是本機的區網 IP，各機器不同）：

```
- Local:         http://localhost:3217
- Network:       http://192.168.0.101:3217
listen *:3217
http://localhost:3217/edit 200
http://127.0.0.1:3217/ 200
stopped
```

`listen *:3217` 表示監聽所有網卡。

- [ ] **Step 22: demo 的 `dev`／`start` 只綁 `127.0.0.1`**

`apps/demo/package.json`：

原始片段：

```json
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
```

替換為：

```json
    "dev": "next dev -H 127.0.0.1",
    "build": "next build",
    "start": "next start -H 127.0.0.1",
```

再執行一次 Step 21 的同一段 `bash -s <<'EOF' … EOF` 腳本（內容完全相同）。

預期輸出：

```
- Local:         http://127.0.0.1:3217
- Network:       http://127.0.0.1:3217
listen 127.0.0.1:3217
http://localhost:3217/edit 200
http://127.0.0.1:3217/ 200
stopped
```

只監聽 loopback，用 `localhost` 開啟仍然正常（curl 與瀏覽器連 `::1` 被拒後會改連 `127.0.0.1`）。`next dev` 使用同一個 `-H` 選項。

- [ ] **Step 23: Commit**

```sh
git add apps/demo/package.json
git commit -m "chore(demo): bind dev and start servers to 127.0.0.1" -m "The demo depends on next 16.2.6, which has open critical advisories (GHSA-2xp9-vwfh-vxw4, GHSA-p293-qw3h-jr36, GHSA-vcvr-r3jv-pc5j). Listening on loopback only keeps the dev and start servers off the local network."
git status --short
```

預期：`1 file changed, 2 insertions(+), 2 deletions(-)`；`git status --short` 只剩 `?? CLAUDE.md`。

- [ ] **Step 24: 新增 `packages/core/tsconfig.typecheck.json` 與 typecheck scripts**

`packages/core/tsconfig.typecheck.json`（新檔）：

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": true,
    "types": ["node"]
  },
  "exclude": [
    "dist",
    "build",
    "node_modules",
    "**/__tests__/**",
    "**/__helpers__/**",
    "**/*.spec.ts",
    "**/*.spec.tsx",
    "tsup.config.ts",
    "jest.config.ts"
  ]
}
```

`__helpers__` 也要排除：`reducer/actions/__helpers__/index.tsx` 只給測試用，裡面直接使用 `jest`、`expect`、`beforeEach` 全域。

`packages/core/package.json`：

原始片段：

```json
    "test": "jest",
    "prepare": "pnpm build"
```

替換為：

```json
    "test": "jest",
    "typecheck": "tsc -p tsconfig.typecheck.json",
    "prepare": "pnpm build"
```

根目錄 `package.json`：

原始片段：

```json
    "test": "turbo run test"
  },
```

替換為：

```json
    "test": "turbo run test",
    "typecheck": "pnpm --filter ./packages/core typecheck"
  },
```

- [ ] **Step 25: 執行 typecheck，確認失敗**

```sh
pnpm typecheck
```

預期：失敗（exit code 2），錯誤只有一行：

```
components/RichTextEditor/index.ts(1,15): error TS2307: Cannot find module './Editor' or its corresponding type declarations.
```

- [ ] **Step 26: 刪除失效的 barrel，再跑 typecheck**

先確認沒有人 import 這個 barrel：

```sh
git grep -n -E "from ['\"][^'\"]*/RichTextEditor['\"]" -- packages apps/demo
```

預期：沒有輸出。

```sh
git rm -q packages/core/components/RichTextEditor/index.ts
pnpm typecheck
echo "exit=$?"
```

預期輸出結尾：

```
> tsc -p tsconfig.typecheck.json

exit=0
```

- [ ] **Step 27: 確認測試與建置不受影響**

```sh
pnpm test 2>&1 | grep -E "Test Suites:|Tests:"
pnpm build 2>&1 | grep -E "Tasks:"
```

預期：

```
@puckeditor/core:test: Test Suites: 50 passed, 50 total
@puckeditor/core:test: Tests:       267 passed, 267 total
 Tasks:    3 successful, 3 total
```

- [ ] **Step 28: Commit**

```sh
git add package.json packages/core/package.json packages/core/tsconfig.typecheck.json
git commit -m "build: add typecheck script for core" -m "Remove components/RichTextEditor/index.ts, which re-exported a ./Editor module that does not exist (TS2307)."
```

預期：`4 files changed, 21 insertions(+), 2 deletions(-)`（含已用 `git rm` 暫存的刪除）。

- [ ] **Step 29: 盤點會被打包進 `dist` 的 devDependencies（唯讀）**

tsup 只把 `dependencies`、`peerDependencies` 與 `packages/tsup-config` 的 `external` 清單排除在 bundle 之外。production 程式碼 import 的 devDependency 會被打包進 `dist`、隨套件發佈，但 `pnpm audit --prod` 不會檢查它。列出兩個要發佈的套件中，被 production 程式碼 import 的 devDependency：

```sh
for dir in packages/core packages/plugin-heading-analyzer; do
  for dep in $(node -p "Object.keys(require('./$dir/package.json').devDependencies).join('\n')"); do
    git grep -q -E "(from|import|import\(|require\() *['\"]$dep(/[^'\"]*)?['\"]" -- "$dir" \
      ":!$dir/**/__tests__/**" ":!$dir/**/__helpers__/**" ":!$dir/**/*.spec.*" \
      ":!$dir/tsup.config.ts" ":!$dir/jest.config.ts" && echo "$dir: $dep"
  done
done
grep -c "lucide-react v0.468.0" packages/core/dist/index.js
grep -o "node_modules/css-box-model/dist/[a-z.-]*" packages/core/dist/index.js | sort -u
```

預期輸出：

```
packages/core: css-box-model
packages/core: lucide-react
packages/plugin-heading-analyzer: @puckeditor/core
1
node_modules/css-box-model/dist/css-box-model.esm.js
```

`lucide-react` 與 `css-box-model` 確實被打包進 core 的 `dist`（後兩行），所以要列入 `BUNDLED_DEV_DEPENDENCIES`。plugin 的 `@puckeditor/core` 在 tsup-config 的 `external` 清單中，不會被打包，所以不列入。

- [ ] **Step 30: 寫 audit gate 判斷函式的失敗測試**

設計重點（2026-10-09 以 pnpm 10.26.1 實測）：
- `pnpm audit --json` 對每個有漏洞的版本**只印一條代表路徑**，取自第一個走到該套件的 workspace 專案（實測 `.` 先於 `packages/eslint-config-custom`，`packages/core` 先於 `packages/tsup-config`）。例如在同一份 lockfile 上，`postcss@8.5.14` 在 `pnpm audit --prod` 中印成 `packages__tsup-config>postcss`，不帶 `--prod` 時卻印成 `packages__core>postcss`。又如 `tslib@2.8.1` 同時隨 core 出貨（經由 `@dnd-kit/*`）並被 demo 使用（經由 `next`），若它有 advisory，路徑可能只印成 `apps__demo>next>@swc/helpers>tslib`。因此 gate **不能依路徑判斷**，而是改用套件版本：先從 `node_modules` 算出會隨發佈套件出貨的 `<name>@<version>` 集合，再看每筆 finding 的 `<module>@<version>` 是否在集合中。
- 集合包含 `dependencies`、`optionalDependencies`，加上 `BUNDLED_DEV_DEPENDENCIES`，以及它們的遞移依賴。peer 依賴由使用端安裝，不列入。
- 被打包的 devDependency（例如 `css-box-model` 的依賴 `tiny-invariant`）不會出現在 `pnpm audit --prod` 中，所以 gate 執行不帶 `--prod` 的完整 `pnpm audit --json`。

`scripts/audit-gate-lib.test.mjs`（新檔）：

```js
import assert from "node:assert/strict";
import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, test } from "node:test";

import {
  BUNDLED_DEV_DEPENDENCIES,
  collectFindings,
  GATED_IMPORTERS,
  shippedPackages,
  sortFindings,
} from "./audit-gate-lib.mjs";

// A small pnpm-style install: every package lives in node_modules/.pnpm and
// is reached through symlinks, like `pnpm install` lays it out.
const root = mkdtempSync(join(tmpdir(), "audit-gate-"));
after(() => rmSync(root, { recursive: true, force: true }));

const store = (id, name) =>
  join(root, "node_modules/.pnpm", id, "node_modules", name);

const writePackage = (dir, manifest) => {
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify(manifest));
};

const link = (target, path) => {
  mkdirSync(dirname(path), { recursive: true });
  symlinkSync(target, path, "dir");
};

writePackage(store("a@1.0.0", "a"), {
  name: "a",
  version: "1.0.0",
  dependencies: { b: "^2.0.0" },
  optionalDependencies: { "not-installed": "^1.0.0" },
  peerDependencies: { react: "*" },
});
link(
  store("b@2.0.0", "b"),
  join(root, "node_modules/.pnpm/a@1.0.0/node_modules/b")
);
writePackage(store("b@2.0.0", "b"), { name: "b", version: "2.0.0" });
writePackage(store("@scope+c@3.0.0", "@scope/c"), {
  name: "@scope/c",
  version: "3.0.0",
  dependencies: { b: "^2.0.0" },
});
link(
  store("b@2.0.0", "b"),
  join(root, "node_modules/.pnpm/@scope+c@3.0.0/node_modules/b")
);
writePackage(store("icons@0.1.0", "icons"), {
  name: "icons",
  version: "0.1.0",
});
writePackage(store("jest@1.0.0", "jest"), { name: "jest", version: "1.0.0" });
writePackage(store("react@19.0.0", "react"), {
  name: "react",
  version: "19.0.0",
});
writePackage(store("b@2.5.0", "b"), { name: "b", version: "2.5.0" });

const project = join(root, "packages/lib");
writePackage(project, {
  name: "lib",
  version: "0.0.0",
  dependencies: { a: "1.0.0", "b-alias": "npm:b@2.5.0", "@scope/c": "3.0.0" },
  devDependencies: { icons: "0.1.0", jest: "1.0.0" },
  peerDependencies: { react: "*" },
});
link(store("a@1.0.0", "a"), join(project, "node_modules/a"));
link(store("b@2.5.0", "b"), join(project, "node_modules/b-alias"));
link(
  store("@scope+c@3.0.0", "@scope/c"),
  join(project, "node_modules/@scope/c")
);
link(store("icons@0.1.0", "icons"), join(project, "node_modules/icons"));
link(store("jest@1.0.0", "jest"), join(project, "node_modules/jest"));
link(store("react@19.0.0", "react"), join(project, "node_modules/react"));

const broken = join(root, "packages/broken");
writePackage(broken, {
  name: "broken",
  version: "0.0.0",
  dependencies: { ghost: "1.0.0" },
});

test("the gate covers the published packages", () => {
  assert.deepEqual(GATED_IMPORTERS, [
    "packages/core",
    "packages/plugin-heading-analyzer",
  ]);
  assert.deepEqual(BUNDLED_DEV_DEPENDENCIES, {
    "packages/core": ["css-box-model", "lucide-react"],
  });
});

test("shippedPackages follows dependencies through pnpm symlinks", () => {
  assert.deepEqual([...shippedPackages(project)].sort(), [
    "@scope/c@3.0.0",
    "a@1.0.0",
    "b@2.0.0",
    "b@2.5.0",
  ]);
});

test("shippedPackages adds the devDependencies that the build bundles", () => {
  const shipped = shippedPackages(project, ["icons"]);
  assert.equal(shipped.has("icons@0.1.0"), true);
  assert.equal(shipped.has("jest@1.0.0"), false);
  assert.equal(shipped.has("react@19.0.0"), false);
});

test("shippedPackages rejects a bundled entry that is not a devDependency", () => {
  assert.throws(
    () => shippedPackages(project, ["left-pad"]),
    /left-pad is listed in BUNDLED_DEV_DEPENDENCIES but is not a devDependency/
  );
});

test("shippedPackages fails when a dependency is not installed", () => {
  assert.throws(() => shippedPackages(broken), /Cannot find ghost/);
});

// Shape copied from real `pnpm audit --json` output (pnpm 10.26). pnpm reports
// one representative path per vulnerable version, taken from whichever
// workspace project reaches the package first.
const report = {
  actions: [],
  muted: [],
  metadata: {
    vulnerabilities: { info: 0, low: 0, moderate: 2, high: 1, critical: 1 },
  },
  advisories: {
    1241270: {
      id: 1241270,
      github_advisory_id: "GHSA-c8x8-7fp4-3x9w",
      module_name: "prosemirror-view",
      severity: "high",
      title:
        "ProseMirror has a XSS vulnerability in prosemirror-view's paste handling",
      findings: [
        {
          version: "1.41.8",
          paths: ["packages__core>@tiptap/pm>prosemirror-view"],
        },
      ],
    },
    1240609: {
      id: 1240609,
      github_advisory_id: "GHSA-vcvr-r3jv-pc5j",
      module_name: "next",
      severity: "critical",
      title: "Next.js advisory",
      findings: [{ version: "16.2.6", paths: ["apps__demo>next"] }],
    },
    1130709: {
      id: 1130709,
      github_advisory_id: "GHSA-fxqj-rqcc-2cmp",
      module_name: "postcss",
      severity: "moderate",
      title: "PostCSS advisory",
      findings: [
        { version: "8.4.31", paths: ["apps__demo>next>postcss"] },
        { version: "8.5.14", paths: ["packages__tsup-config>postcss"] },
      ],
    },
    1: {
      id: 1,
      github_advisory_id: "GHSA-test-test-test",
      module_name: "tslib",
      severity: "moderate",
      title: "Shared dependency advisory",
      findings: [
        { version: "2.8.1", paths: ["apps__demo>next>@swc/helpers>tslib"] },
      ],
    },
  },
};

const shipped = new Set(["prosemirror-view@1.41.8", "tslib@2.8.1"]);

test("collectFindings emits one finding per path", () => {
  const findings = collectFindings(report, shipped);
  assert.equal(findings.length, 5);
  assert.deepEqual(
    findings.find((finding) => finding.module === "prosemirror-view"),
    {
      path: "packages__core>@tiptap/pm>prosemirror-view",
      module: "prosemirror-view",
      version: "1.41.8",
      severity: "high",
      id: "GHSA-c8x8-7fp4-3x9w",
      title:
        "ProseMirror has a XSS vulnerability in prosemirror-view's paste handling",
      gated: true,
    }
  );
});

test("collectFindings gates by package version, not by the reported path", () => {
  const gated = collectFindings(report, shipped)
    .filter((finding) => finding.gated)
    .map((finding) => `${finding.module}@${finding.version}`);
  assert.deepEqual(gated.sort(), ["prosemirror-view@1.41.8", "tslib@2.8.1"]);
});

test("collectFindings accepts a clean report", () => {
  assert.deepEqual(
    collectFindings({ advisories: {}, metadata: {} }, shipped),
    []
  );
});

test("collectFindings rejects output that is not an audit report", () => {
  assert.throws(
    () =>
      collectFindings(
        { error: { code: "ERR_PNPM_AUDIT_BAD_RESPONSE" } },
        shipped
      ),
    /Unexpected pnpm audit output/
  );
  assert.throws(
    () => collectFindings(null, shipped),
    /Unexpected pnpm audit output/
  );
  assert.throws(
    () => collectFindings({}, shipped),
    /Unexpected pnpm audit output/
  );
});

test("sortFindings orders by severity, then module, then advisory", () => {
  assert.deepEqual(
    sortFindings(collectFindings(report, shipped)).map(
      (finding) => `${finding.severity} ${finding.module}@${finding.version}`
    ),
    [
      "critical next@16.2.6",
      "high prosemirror-view@1.41.8",
      "moderate postcss@8.4.31",
      "moderate postcss@8.5.14",
      "moderate tslib@2.8.1",
    ]
  );
});
```

```sh
node --test scripts/audit-gate-lib.test.mjs
```

預期：失敗，輸出包含

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/Users/kaellim/Desktop/projects/puck/scripts/audit-gate-lib.mjs' imported from /Users/kaellim/Desktop/projects/puck/scripts/audit-gate-lib.test.mjs
ℹ fail 1
```

- [ ] **Step 31: 實作 `scripts/audit-gate-lib.mjs`**

```js
// Pure helpers for scripts/audit-gate.mjs. They live in their own module so
// they can be unit tested without running `pnpm audit`.
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { basename, dirname, join } from "node:path";

// Workspace projects that we publish. A vulnerable package that ships with one
// of them fails the gate. Findings anywhere else (apps/demo, build and lint
// tooling) are printed but do not fail it.
export const GATED_IMPORTERS = [
  "packages/core",
  "packages/plugin-heading-analyzer",
];

// devDependencies that the tsup build bundles into dist (tsup only leaves
// dependencies, peerDependencies and tsup-config's `external` list out of the
// bundle), so they ship with the package even though `pnpm audit --prod`
// skips them. Keep this in sync with what production code imports.
export const BUNDLED_DEV_DEPENDENCIES = {
  "packages/core": ["css-box-model", "lucide-react"],
};

const SEVERITY_ORDER = ["critical", "high", "moderate", "low", "info"];

const readManifest = (dir) =>
  JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));

// Node's lookup: <dir>/node_modules/<name> for `from` and each of its parents.
// pnpm installs every dependency as a symlink in such a folder.
function resolvePackageDir(from, name) {
  for (let dir = from; ; dir = dirname(dir)) {
    if (basename(dir) !== "node_modules") {
      const candidate = join(dir, "node_modules", name);
      if (existsSync(join(candidate, "package.json"))) {
        return realpathSync(candidate);
      }
    }
    if (dirname(dir) === dir) return null;
  }
}

// Every "<name>@<version>" that installs with the project at `projectDir`:
// its dependencies and optionalDependencies, the `bundledDev`
// devDependencies, and everything those depend on. Peer dependencies are the
// consumer's to install and are not followed. Needs `pnpm install` first.
export function shippedPackages(projectDir, bundledDev = []) {
  const manifest = readManifest(projectDir);
  for (const name of bundledDev) {
    if (!Object.hasOwn(manifest.devDependencies ?? {}, name)) {
      throw new Error(
        `${name} is listed in BUNDLED_DEV_DEPENDENCIES but is not a devDependency of ${projectDir}`
      );
    }
  }

  const shipped = new Set();
  const visited = new Set();

  function visitDependencies(dir, pkg) {
    const optional = Object.keys(pkg.optionalDependencies ?? {});
    for (const name of Object.keys(pkg.dependencies ?? {})) {
      visit(dir, name, optional.includes(name));
    }
    for (const name of optional) visit(dir, name, true);
  }

  function visit(from, name, optional) {
    const dir = resolvePackageDir(from, name);
    if (dir === null) {
      if (optional) return;
      throw new Error(`Cannot find ${name} from ${from}. Run pnpm install.`);
    }
    if (visited.has(dir)) return;
    visited.add(dir);
    const pkg = readManifest(dir);
    shipped.add(`${pkg.name}@${pkg.version}`);
    visitDependencies(dir, pkg);
  }

  visitDependencies(projectDir, manifest);
  for (const name of bundledDev) visit(projectDir, name, false);
  return shipped;
}

// `pnpm audit --json` lists each vulnerable version once, with a single
// representative path taken from whichever workspace project reaches it first
// (for example "apps__demo>next>@swc/helpers>tslib" even when packages/core
// ships the same tslib). So a finding is gated when its package version ships
// with a published package, whatever path pnpm happened to print.
export function collectFindings(report, shipped) {
  if (
    !report ||
    typeof report !== "object" ||
    report.error ||
    !report.advisories ||
    typeof report.advisories !== "object"
  ) {
    throw new Error(
      `Unexpected pnpm audit output: ${JSON.stringify(report).slice(0, 500)}`
    );
  }

  const findings = [];
  for (const advisory of Object.values(report.advisories)) {
    for (const finding of advisory.findings ?? []) {
      for (const path of finding.paths ?? []) {
        findings.push({
          path,
          module: advisory.module_name,
          version: finding.version,
          severity: advisory.severity,
          id: advisory.github_advisory_id ?? String(advisory.id),
          title: advisory.title,
          gated: shipped.has(`${advisory.module_name}@${finding.version}`),
        });
      }
    }
  }
  return findings;
}

const severityRank = (severity) => {
  const rank = SEVERITY_ORDER.indexOf(severity);
  return rank === -1 ? SEVERITY_ORDER.length : rank;
};

export function sortFindings(findings) {
  return [...findings].sort(
    (a, b) =>
      severityRank(a.severity) - severityRank(b.severity) ||
      a.module.localeCompare(b.module) ||
      a.id.localeCompare(b.id) ||
      a.path.localeCompare(b.path)
  );
}
```

```sh
node --test scripts/audit-gate-lib.test.mjs
```

預期輸出：

```
✔ the gate covers the published packages (…ms)
✔ shippedPackages follows dependencies through pnpm symlinks (…ms)
✔ shippedPackages adds the devDependencies that the build bundles (…ms)
✔ shippedPackages rejects a bundled entry that is not a devDependency (…ms)
✔ shippedPackages fails when a dependency is not installed (…ms)
✔ collectFindings emits one finding per path (…ms)
✔ collectFindings gates by package version, not by the reported path (…ms)
✔ collectFindings accepts a clean report (…ms)
✔ collectFindings rejects output that is not an audit report (…ms)
✔ sortFindings orders by severity, then module, then advisory (…ms)
ℹ tests 10
ℹ suites 0
ℹ pass 10
ℹ fail 0
```

- [ ] **Step 32: 新增 gate 執行檔與 scripts**

`scripts/audit-gate.mjs`（新檔）：

```js
// Supply-chain gate. Runs `pnpm audit --json`, prints every advisory and exits
// 1 only when a vulnerable package version ships with a published package
// (GATED_IMPORTERS, including the devDependencies their build bundles). Exits 2
// when the dependency graph or the audit cannot be read, so a registry outage
// never passes silently.
import { spawnSync } from "node:child_process";
import { join } from "node:path";

import {
  BUNDLED_DEV_DEPENDENCIES,
  collectFindings,
  GATED_IMPORTERS,
  shippedPackages,
  sortFindings,
} from "./audit-gate-lib.mjs";

const rootDir = join(import.meta.dirname, "..");
const gatedList = GATED_IMPORTERS.join(", ");

const shipped = new Set();
try {
  for (const importer of GATED_IMPORTERS) {
    const bundledDev = BUNDLED_DEV_DEPENDENCIES[importer] ?? [];
    for (const id of shippedPackages(join(rootDir, importer), bundledDev)) {
      shipped.add(id);
    }
  }
} catch (error) {
  console.error(`audit:gate could not list what ships with ${gatedList}.`);
  console.error(String(error?.message ?? error));
  process.exit(2);
}

const audit = spawnSync("pnpm", ["audit", "--json"], {
  cwd: rootDir,
  encoding: "utf8",
  maxBuffer: 64 * 1024 * 1024,
});

let report;
let findings;
try {
  if (audit.error) throw audit.error;
  report = JSON.parse(audit.stdout);
  findings = collectFindings(report, shipped);
} catch (error) {
  console.error("audit:gate could not read `pnpm audit --json` output.");
  console.error(String(error?.message ?? error));
  if (audit.stderr) console.error(audit.stderr.trim());
  process.exit(2);
}

const blocking = sortFindings(findings.filter((f) => f.gated));
const reported = sortFindings(findings.filter((f) => !f.gated));

console.log(
  `pnpm audit: ${Object.keys(report.advisories).length} advisories, ` +
    `${findings.length} finding path(s). ` +
    `${shipped.size} package versions ship with ${gatedList}.`
);

const print = (heading, list) => {
  console.log(`\n${heading}: ${list.length} finding(s)`);
  for (const f of list) {
    console.log(
      `  ${f.severity.padEnd(8)} ${f.module}@${f.version}  ${f.id}  ${f.title}`
    );
    console.log(`           via ${f.path}`);
  }
};

print("GATED (ships with a published package)", blocking);
print("Reported only (demo and dev tooling)", reported);

console.log("");
if (blocking.length > 0) {
  console.error(
    `audit:gate FAILED: ${blocking.length} finding(s) ship with ${gatedList}.`
  );
  process.exit(1);
}
console.log(
  `audit:gate passed: no advisories affect ${gatedList} ` +
    `(${reported.length} finding path(s) elsewhere are listed above).`
);
```

根目錄 `package.json`：

原始片段：

```json
    "test": "turbo run test",
    "typecheck": "pnpm --filter ./packages/core typecheck"
  },
```

替換為：

```json
    "test": "turbo run test && node --test scripts/audit-gate-lib.test.mjs",
    "typecheck": "pnpm --filter ./packages/core typecheck",
    "audit:gate": "node scripts/audit-gate.mjs"
  },
```

確認格式（三個 `.mjs` 之後也會由 `pnpm format:check` 檢查；`package.json` 不在 `format:check` 的 glob 內，所以在這裡一起檢查）：

```sh
pnpm exec prettier --check scripts/audit-gate.mjs scripts/audit-gate-lib.mjs scripts/audit-gate-lib.test.mjs package.json
```

預期：

```
Checking formatting...
All matched files use Prettier code style!
```

- [ ] **Step 33: 執行 gate，確認它抓到 core 的漏洞而失敗**

```sh
pnpm audit:gate
echo "exit=$?"
```

預期：`exit=1`，約 3 秒（需要網路）。輸出的開頭、GATED 區塊與結尾如下。advisory 資料庫會更新，所以 `advisories`、`finding path(s)` 的數字與 `Reported only` 的內容可能不同，但 GATED 區塊必須正好是這 3 筆：

```
pnpm audit: 72 advisories, 74 finding path(s). 105 package versions ship with packages/core, packages/plugin-heading-analyzer.

GATED (ships with a published package): 3 finding(s)
  high     @tiptap/core@3.23.4  GHSA-j95f-988m-3j2f  Tiptap: Quadratic ReDoS in block and inline Markdown attribute parsing
           via packages__core>@tiptap/core
  high     prosemirror-view@1.41.8  GHSA-c8x8-7fp4-3x9w  ProseMirror has a XSS vulnerability in prosemirror-view's paste handling
           via packages__core>@tiptap/pm>prosemirror-view
  moderate @tiptap/core@3.23.4  GHSA-cp6q-959q-f8rh  Tiptap: mergeAttributes() turns an own __proto__ key into inherited executable DOM attributes
           via packages__core>@tiptap/core

Reported only (demo and dev tooling): 71 finding(s)
  critical handlebars@4.7.9  GHSA-8r5x-fm3f-whwj  Handlebars: JavaScript Injection via AST Type Confusion in compile (bypass of CVE-2026-33937)
           via packages__core>ts-jest>handlebars
...

audit:gate FAILED: 3 finding(s) ship with packages/core, packages/plugin-heading-analyzer.
exit=1
```

`Reported only` 包含 `apps/demo`（`next`、`postcss` 等）、jest／ts-jest、eslint、puppeteer 等開發工具的 advisory。它們不會隨套件發佈，所以只列出、不阻擋。

- [ ] **Step 34:（約 70 秒）確認 audit 本身失敗時 gate 不會放行**

```sh
npm_config_registry=http://127.0.0.1:9/ node scripts/audit-gate.mjs
echo "exit=$?"
```

預期輸出（pnpm 會重試約 70 秒）：

```
audit:gate could not read `pnpm audit --json` output.
Unexpected pnpm audit output: {"error":{"code":"ECONNREFUSED","message":"request to http://127.0.0.1:9/-/npm/v1/security/audits failed, reason: connect ECONNREFUSED 127.0.0.1:9"}}
exit=2
```

- [ ] **Step 35: Commit**

```sh
git add package.json scripts/audit-gate.mjs scripts/audit-gate-lib.mjs scripts/audit-gate-lib.test.mjs
git commit -m "build: add audit gate for published packages" -m "audit:gate runs pnpm audit, prints every advisory and fails only when a vulnerable package version ships with packages/core or packages/plugin-heading-analyzer, including the devDependencies that their build bundles. It matches findings by package version because pnpm audit prints only one path per vulnerable version."
```

預期：`4 files changed, 477 insertions(+), 2 deletions(-)`。

- [ ] **Step 36: 升級 tiptap 並釘成精確版本，修掉 core 的三個 advisory**

不能用 override 只拉高 `@tiptap/core`：tiptap 各套件彼此以「精確版本」宣告 peer（例如 `@tiptap/extension-bold@3.23.4` 要求 `@tiptap/core` 正好是 `3.23.4`；`@tiptap/core@3.30.5` 要求 `@tiptap/pm` 正好是 `3.30.5`），所以所有 `@tiptap/*` 必須一起升。版本**必須是 3.31.4**：這是共同介面與後續 task（Task 5–9 的 `@tiptap/static-renderer`、輸出比對、bundle 檢查）驗證時使用的版本。寫成不帶 `^` 的精確版本，與 tiptap 自己的精確 peer 政策一致，也能避免日後執行 `pnpm install` 時解析到更新的 3.x。`@tiptap/pm@3.31.4` 要求 `prosemirror-view ^1.42.3`，所以 GHSA-c8x8-7fp4-3x9w 不需要另外的 override。

`packages/core/package.json` 原始片段：

```json
    "@tiptap/core": "^3.11.1",
    "@tiptap/extension-blockquote": "^3.11.1",
    "@tiptap/extension-bold": "^3.11.1",
    "@tiptap/extension-code": "^3.11.1",
    "@tiptap/extension-code-block": "^3.11.1",
    "@tiptap/extension-document": "^3.11.1",
    "@tiptap/extension-hard-break": "^3.11.1",
    "@tiptap/extension-heading": "^3.11.1",
    "@tiptap/extension-horizontal-rule": "^3.11.1",
    "@tiptap/extension-italic": "^3.11.1",
    "@tiptap/extension-link": "^3.11.1",
    "@tiptap/extension-list": "^3.11.1",
    "@tiptap/extension-paragraph": "^3.11.1",
    "@tiptap/extension-strike": "^3.11.1",
    "@tiptap/extension-text": "^3.11.1",
    "@tiptap/extension-text-align": "^3.11.1",
    "@tiptap/extension-underline": "^3.11.1",
    "@tiptap/html": "^3.11.1",
    "@tiptap/pm": "^3.11.1",
    "@tiptap/react": "^3.11.1",
```

替換為：

```json
    "@tiptap/core": "3.31.4",
    "@tiptap/extension-blockquote": "3.31.4",
    "@tiptap/extension-bold": "3.31.4",
    "@tiptap/extension-code": "3.31.4",
    "@tiptap/extension-code-block": "3.31.4",
    "@tiptap/extension-document": "3.31.4",
    "@tiptap/extension-hard-break": "3.31.4",
    "@tiptap/extension-heading": "3.31.4",
    "@tiptap/extension-horizontal-rule": "3.31.4",
    "@tiptap/extension-italic": "3.31.4",
    "@tiptap/extension-link": "3.31.4",
    "@tiptap/extension-list": "3.31.4",
    "@tiptap/extension-paragraph": "3.31.4",
    "@tiptap/extension-strike": "3.31.4",
    "@tiptap/extension-text": "3.31.4",
    "@tiptap/extension-text-align": "3.31.4",
    "@tiptap/extension-underline": "3.31.4",
    "@tiptap/html": "3.31.4",
    "@tiptap/pm": "3.31.4",
    "@tiptap/react": "3.31.4",
```

```sh
pnpm install
```

預期輸出包含 `Packages: +25 -24`（Step 12 產生長寫法時）或 `Packages: +26 -25`（短寫法時），以及 `packages/core prepare$ pnpm build`、`Done in …s using pnpm v10.26.1`。中間的 `WARN deprecated …` 與 react-from-json 的 peer 警告都是原有的，不影響結果。

確認所有 tiptap 套件都是 3.31.4，且 prosemirror-view 已修補：

```sh
grep -E "^  '@tiptap/[a-z-]+@[0-9.]+':$" pnpm-lock.yaml | sed -E "s/^  '@tiptap\/[a-z-]+@([0-9.]+)':$/\1/" | sort | uniq -c
grep -c "^  '@tiptap/core@3.31.4':$" pnpm-lock.yaml
grep -E "^  prosemirror-view@" pnpm-lock.yaml | sort -u
git diff pnpm-lock.yaml | grep -E "^[-+]  [^ ]" | grep -v "@tiptap/" | LC_ALL=C sort -u
```

預期輸出（長寫法）：

```
  23 3.31.4
1
  prosemirror-view@1.42.6:
+  prosemirror-inputrules@1.5.1:
+  prosemirror-model@1.25.12:
+  prosemirror-view@1.42.6:
-  prosemirror-model@1.25.6:
-  prosemirror-view@1.41.8:
```

若 Step 12 產生的是短寫法，第四個指令會多出下面兩行（`eslint-plugin-import` 改成長寫法，版本不變）：

```
+  eslint-plugin-import@2.32.0(@typescript-eslint/parser@8.59.3(eslint@9.39.4)(typescript@5.9.3))(eslint-import-resolver-typescript@3.10.1(eslint-plugin-import@2.32.0(@typescript-eslint/parser@8.59.3(eslint@9.39.4)(typescript@5.9.3))(eslint@9.39.4))(eslint@9.39.4))(eslint@9.39.4):
-  eslint-plugin-import@2.32.0(@typescript-eslint/parser@8.59.3(eslint@9.39.4)(typescript@5.9.3))(eslint-import-resolver-typescript@3.10.1)(eslint@9.39.4):
```

判斷標準：
- 第一個指令**只能有一行** `23 3.31.4`，第二個指令必須是 `1`。否則表示有 `@tiptap/*` 沒有解析成 3.31.4，先停下來檢查 `packages/core/package.json` 的 20 行是否都已改成 `"3.31.4"`。
- 第三個指令的版本必須 ≥ 1.42.3。驗證時是 1.42.6；若 registry 已發佈更新的 patch，pnpm 會解析到較新的 `prosemirror-*`，版本號可以不同。
- 第四個指令說明 lockfile 中，除了 tiptap 之外只動到 prosemirror 的三個套件，以及 `eslint-plugin-import` 的 peer 寫法（短寫法時）。

- [ ] **Step 37: 確認測試、型別、建置與 gate 都通過**

```sh
pnpm test 2>&1 | grep -E "Test Suites:|Tests:|Snapshots:|ℹ (pass|fail)"
pnpm typecheck > /dev/null; echo "typecheck=$?"
pnpm build 2>&1 | grep -E "Tasks:"
pnpm audit:gate > "${TMPDIR:-/tmp}/tceditor-audit-gate.log" 2>&1; echo "audit:gate exit=$?"
grep -E "^pnpm audit:|^GATED|^audit:gate" "${TMPDIR:-/tmp}/tceditor-audit-gate.log"
```

預期：

```
@puckeditor/core:test: Test Suites: 50 passed, 50 total
@puckeditor/core:test: Tests:       267 passed, 267 total
@puckeditor/core:test: Snapshots:   19 passed, 19 total
ℹ pass 10
ℹ fail 0
typecheck=0
 Tasks:    3 successful, 3 total
audit:gate exit=0
pnpm audit: 69 advisories, 71 finding path(s). 106 package versions ship with packages/core, packages/plugin-heading-analyzer.
GATED (ships with a published package): 0 finding(s)
audit:gate passed: no advisories affect packages/core, packages/plugin-heading-analyzer (71 finding path(s) elsewhere are listed above).
```

（advisory 數字可能因資料庫更新而不同；`audit:gate exit=0` 與 `GATED … 0 finding(s)` 必須相同。`106 package versions` 比 Step 33 多 1，是新增的 `prosemirror-inputrules`。）

- [ ] **Step 38: Commit**

```sh
git add packages/core/package.json pnpm-lock.yaml
git commit -m "fix(deps): upgrade tiptap to 3.31.4" -m "Fixes the advisories that audit:gate reports for packages/core:
- GHSA-j95f-988m-3j2f (@tiptap/core < 3.30.5)
- GHSA-cp6q-959q-f8rh (@tiptap/core < 3.30.4)
- GHSA-c8x8-7fp4-3x9w (prosemirror-view < 1.42.3, via @tiptap/pm)" -m "Tiptap packages declare exact peer versions of each other, so all @tiptap/* dependencies move together and are pinned to the exact version instead of using an override."
```

預期：`2 files changed, 217 insertions(+), 206 deletions(-)`（長寫法）或 `2 files changed, 220 insertions(+), 209 deletions(-)`（短寫法）。

- [ ] **Step 39: 新增 `verify` script**

根目錄 `package.json`：

原始片段：

```json
    "audit:gate": "node scripts/audit-gate.mjs"
  },
```

替換為：

```json
    "audit:gate": "node scripts/audit-gate.mjs",
    "verify": "pnpm test && pnpm typecheck && pnpm lint && pnpm format:check && pnpm build && pnpm audit:gate"
  },
```

完成後根目錄 `package.json` 應與下列內容完全相同：

```json
{
  "private": true,
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev --filter=demo",
    "lint": "turbo run lint",
    "format:check": "prettier --check \"**/*.{ts,tsx,mjs,md,mdx,css}\"",
    "format": "prettier --write \"**/*.{ts,tsx,mjs,md,mdx,css}\"",
    "smoke": "node scripts/e2e/smoke.mjs",
    "test": "turbo run test && node --test scripts/audit-gate-lib.test.mjs",
    "typecheck": "pnpm --filter ./packages/core typecheck",
    "audit:gate": "node scripts/audit-gate.mjs",
    "verify": "pnpm test && pnpm typecheck && pnpm lint && pnpm format:check && pnpm build && pnpm audit:gate"
  },
  "devDependencies": {
    "asciichart": "^1.5.25",
    "eslint": "^9.0.0",
    "eslint-config-custom": "workspace:*",
    "prettier": "^2.5.1",
    "puppeteer": "^24.8.2",
    "turbo": "^2.5.8"
  },
  "name": "puck-repo",
  "packageManager": "pnpm@10.26.1",
  "version": "0.23.0",
  "engines": {
    "node": ">=24.0.0"
  }
}
```

- [ ] **Step 40: 從乾淨狀態跑一次 `pnpm verify`**

清掉建置產物與 turbo 快取，確保每一步都真的執行：

```sh
rm -rf .turbo packages/core/dist packages/plugin-heading-analyzer/dist apps/demo/.next
pnpm verify
echo "exit=$?"
```

預期：約 1 分鐘（另加 audit 的網路時間），`exit=0`。輸出中依序包含下列各行（其餘輸出省略）：

```
@puckeditor/core:test: Test Suites: 50 passed, 50 total
@puckeditor/core:test: Tests:       267 passed, 267 total
@puckeditor/core:test: Snapshots:   19 passed, 19 total
ℹ tests 10
ℹ pass 10
ℹ fail 0
> tsc -p tsconfig.typecheck.json
demo:lint: ✖ 8 problems (0 errors, 8 warnings)
@puckeditor/core:lint: ✖ 4 problems (0 errors, 4 warnings)
 Tasks:    3 successful, 3 total
All matched files use Prettier code style!
 Tasks:    3 successful, 3 total
audit:gate passed: no advisories affect packages/core, packages/plugin-heading-analyzer (71 finding path(s) elsewhere are listed above).
exit=0
```

（`71` 這個數字會隨 advisory 資料庫更新而改變；`audit:gate passed` 與 `exit=0` 必須相同。）

- [ ] **Step 41: 確認 lockfile 與安裝一致**

```sh
pnpm install --frozen-lockfile
git status --short
```

預期：

```
Lockfile is up to date, resolution step is skipped
Already up to date
...
Done in …s using pnpm v10.26.1
```

`git status --short` 只有 `M package.json` 與 `?? CLAUDE.md`。

- [ ] **Step 42: Commit**

```sh
git add package.json
git commit -m "build: add verify script" -m "pnpm verify runs test, typecheck, lint, format:check, build and audit:gate in that order."
git log --oneline v0.23.0..HEAD
git status --short
```

預期 `git log`（最上面 8 筆，hash 不同）：

```
<hash> build: add verify script
<hash> fix(deps): upgrade tiptap to 3.31.4
<hash> build: add audit gate for published packages
<hash> build: add typecheck script for core
<hash> chore(demo): bind dev and start servers to 127.0.0.1
<hash> build: migrate from yarn 1 to pnpm
<hash> chore(demo): remove Plausible analytics
<hash> chore: remove upstream recipes, scaffolder, unused packages and release tooling
284c74ba docs: add tceditor roadmap and S1 fork baseline design
```

`git status --short` 只剩 `?? CLAUDE.md`。

### Task 2: 改名為 tceditor 與授權

目的：把兩個要發佈的套件改名為 `@tzuchi/tceditor`、`@tzuchi/tceditor-plugin-heading-analyzer`，版本從 `0.1.0` 重新起算，標成 `private` 以免誤發佈，並更新 repo 內所有引用（規格 §3.1）。新增根目錄 `NOTICE`，讓兩個套件的 tarball 都帶有 `LICENSE` 與 `NOTICE`（規格 §3.4，修正評估報告 sec-supply-15）。最後在 `CHANGELOG.md` 頂端加入 tceditor 0.1.0 段落。共 3 個 commit。

**執行位置**：主工作目錄 `/Users/kaellim/Desktop/projects/puck`，分支 `tzuchi/main`，接在 Task 1 的最後一個 commit（`build: add verify script`）之後。Task 1 已經執行過 `pnpm install`，`node_modules` 與 `packages/*/dist` 都在。commit 時一律**明確列出路徑**，不要用 `git add -A`，因為根目錄有未追蹤、不屬於本 task 的 `CLAUDE.md`。

**設計決定**：
- `LICENSE`、`NOTICE` 以「檔案副本」的形式提交到兩個套件目錄，不用 `prepack` 複製。副本對任何打包工具都有效，也不會在打包失敗時留下未追蹤的檔案。新的 jest 測試 `package-files.spec.ts` 會確認副本與根目錄的檔案逐位元組相同，日後若修改根目錄的 `LICENSE` 或 `NOTICE`，測試會提醒同步更新。
- 這個測試會讀 core 目錄以外的檔案（根目錄的 `LICENSE`、`NOTICE`，以及 plugin 的 `package.json`、`LICENSE`、`NOTICE`），但 turbo 計算 `@tzuchi/tceditor#test` 的快取 hash 時，預設只看 core 目錄內的檔案。若不處理，快取熱的時候改了這些檔案，`pnpm test`／`pnpm verify` 仍會重播舊的通過結果，這道檢查等於失效。所以 Step 14 在 `turbo.json` 為 `@tzuchi/tceditor#test` 加上 `inputs`，Step 18 再實際驗證快取會失效。
- 兩個套件的 `"private": false` 改為 `"private": true`。規格 §3.1 寫明 S1 不發佈到任何 registry；依 npm 與 pnpm 文件，`private: true` 的套件會被 `npm publish`／`pnpm publish` 拒絕，`pnpm publish -r` 則直接略過，避免一次誤操作就把套件推到公開 npm。`pnpm pack` 不受影響（Step 16 驗證）。S2 決定 tzuchi-uikit 如何取得這個套件時，再依發佈方式調整。注意：`pnpm publish --dry-run` 不會檢查 `private`，不能用它確認這項保護。
- `repository`、`bugs`、`homepage` 三個欄位直接移除，因為我方遠端尚未決定（規格 §2），不能自行編造網址。
- `README.md` 與 `CONTRIBUTING.md` 只修改含有 `@puckeditor` 的 4 行，整份改寫留給 Task 14。安裝指令改用 `pnpm add … --workspace`：套件沒有發佈到 registry，寫成 `npm i @tzuchi/tceditor` 會讓人從公開 npm 安裝別人註冊的同名套件，正是改名想避免的 dependency confusion。
- 對外 API 識別名（`<Puck>`、`usePuck`、`Config`、CSS class 前綴、`data-puck-*`）一律不改。
- 指向上游的網址（例如 `README.md` 的 badge、`CONTRIBUTING.md` 的 discussion 連結、plugin UI 中連到上游 README 的連結、demo 初始資料中的 GitHub 連結、DropZone 棄用訊息中的文件連結）含有 `puckeditor` 但沒有 `@puckeditor`，本 task 不處理。

**Files:**
- Create:
  - `NOTICE`
  - `packages/core/LICENSE`、`packages/core/NOTICE`（根目錄檔案的副本）
  - `packages/plugin-heading-analyzer/LICENSE`、`packages/plugin-heading-analyzer/NOTICE`（根目錄檔案的副本）
- Modify:
  - `package.json`（根目錄）、`pnpm-lock.yaml`、`turbo.json`
  - `packages/core/package.json`、`packages/core/store/index.ts`（只改註解）
  - `packages/plugin-heading-analyzer/package.json`、`packages/plugin-heading-analyzer/README.md`、`packages/plugin-heading-analyzer/src/HeadingAnalyzer.tsx`
  - `packages/tsup-config/index.ts`
  - `apps/demo/package.json`、`apps/demo/tsconfig.json`、`apps/demo/next.config.js`
  - `README.md`、`CONTRIBUTING.md`、`CHANGELOG.md`
- Test:
  - `packages/core/__tests__/package-files.spec.ts`（新增，6 個測試）

**Interfaces:**
- Consumes（Task 1）：
  - 根目錄 scripts，包括 `verify`（`pnpm test && pnpm typecheck && pnpm lint && pnpm format:check && pnpm build && pnpm audit:gate`）與 `typecheck`（`pnpm --filter ./packages/core typecheck`，以路徑 filter，不受改名影響）。
  - 內部依賴一律 `workspace:*`；`packages/core` 的 `prepare` 是 `pnpm build`。
  - `scripts/audit-gate-lib.mjs` 的 `GATED_IMPORTERS` 以目錄判斷（`packages/core`、`packages/plugin-heading-analyzer`），與套件名無關，不需修改。
  - 測試基準：50 suites／267 tests／19 snapshots。
- Produces（後續 task 依賴）：
  - 套件名：`@tzuchi/tceditor`（`packages/core`）、`@tzuchi/tceditor-plugin-heading-analyzer`（`packages/plugin-heading-analyzer`），版本都是 `0.1.0`，`author` 是 `"Tzu Chi"`，`"private": true`，沒有 `repository`／`bugs`／`homepage`。根目錄 `name` 是 `tceditor-repo`，`version` 是 `0.1.0`。
  - 根目錄 `node_modules` 有 `@tzuchi/tceditor`、`@tzuchi/tceditor-plugin-heading-analyzer` 兩個連結；根目錄與各 workspace 套件的 `node_modules` 都已沒有 `@puckeditor`，誤用舊套件名的 import 會立即解析失敗（例如從 `apps/demo` `require.resolve("@puckeditor/core/package.json")` 得到 `MODULE_NOT_FOUND`），和乾淨 clone 的行為相同。
  - 指令用法：`pnpm --filter @tzuchi/tceditor <script>`；turbo 輸出的前綴從 `@puckeditor/core:` 變成 `@tzuchi/tceditor:`（例如 `@tzuchi/tceditor:test: Tests: …`）。
  - `turbo.json` 新增 `@tzuchi/tceditor#test` 任務設定，`inputs` 為 `$TURBO_DEFAULT$` 加上 `$TURBO_ROOT$/LICENSE`、`$TURBO_ROOT$/NOTICE`、`$TURBO_ROOT$/packages/plugin-heading-analyzer/package.json`、`…/LICENSE`、`…/NOTICE`。core 的測試若要讀 core 目錄以外的檔案，必須把該路徑（以 `$TURBO_ROOT$/` 開頭）加進這個 `inputs`，否則 turbo 快取會在檔案改變後重播舊結果。
  - `apps/demo/tsconfig.json` 的 paths 有 `"@tzuchi/tceditor": ["../../packages/core/index.ts"]`；`apps/demo/next.config.js` 的 `transpilePackages` 是 `["@tzuchi/tceditor", "lucide-react"]`；plugin 原始碼以 `import { createUsePuck } from "@tzuchi/tceditor"` 引用 core。
  - `packages/tsup-config/index.ts` 的 `external` 含 `"@tzuchi/tceditor"`。
  - 兩個套件的 `files` 都是 `["dist", "LICENSE", "NOTICE"]`。`packages/core/__tests__/package-files.spec.ts` 斷言這個陣列**完全相等**；後續 task 若修改任一套件的 `files`，必須同步更新這個測試。修改根目錄 `LICENSE` 或 `NOTICE` 時，要把同一份檔案複製到兩個套件目錄（turbo 快取會因上述 `inputs` 而失效，測試會實際重跑）。
  - `CHANGELOG.md` 頂端有 `## tceditor 0.1.0 (unreleased)` 段落，其中的 `### Changes from Puck v0.23.0` 是條列清單。後續 task 若有對使用者可見的變更，在清單最後加一行（`* ` 開頭、小寫動詞起頭的英文）。`CHANGELOG.md` 在 `.prettierignore` 中，不受 `format:check` 檢查。
  - 測試基準：51 suites／273 tests／19 snapshots。

- [ ] **Step 1: 確認起點**

```sh
cd /Users/kaellim/Desktop/projects/puck
git branch --show-current
git status --short
git log --oneline -1
node -p "['packages/core', 'packages/plugin-heading-analyzer'].map((dir) => { const m = require('./' + dir + '/package.json'); return m.name + '@' + m.version; }).join(' ')"
```

預期輸出（hash 不同）：

```
tzuchi/main
?? CLAUDE.md
<hash> build: add verify script
@puckeditor/core@0.23.0 @puckeditor/plugin-heading-analyzer@0.23.0
```

若最後一個 commit 不是 Task 1 的 `build: add verify script`，或有其他未 commit 的修改，先停下來確認。

- [ ] **Step 2: 盤點 `@puckeditor` 的引用（唯讀）**

```sh
git grep -n "@puckeditor" -- . ':!apps/docs' ':!docs/superpowers' ':!CHANGELOG.md'
```

預期輸出（正好 21 行）：

```
CONTRIBUTING.md:99:- Class names must follow the [SUIT CSS](https://suitcss.github.io) methodology. This is a tooling-angostic convention used at [@puckeditor](https://github.com/puckeditor) for all CSS work.
README.md:37:npm i @puckeditor/core --save # or npx create-puck-app my-app
README.md:44:import { Puck } from "@puckeditor/core";
README.md:78:import { Render } from "@puckeditor/core";
apps/demo/next.config.js:3:  transpilePackages: ["@puckeditor/core", "lucide-react"],
apps/demo/package.json:20:    "@puckeditor/core": "workspace:*",
apps/demo/tsconfig.json:10:      "@puckeditor/core": ["../../packages/core/index.ts"],
packages/core/package.json:2:  "name": "@puckeditor/core",
packages/core/package.json:5:  "author": "Chris Villa <chris@puckeditor.com>",
packages/core/store/index.ts:365:// Created lazily instead of at module scope so that importing @puckeditor/core has no side effects that might
packages/plugin-heading-analyzer/README.md:10:npm i @puckeditor/plugin-heading-analyzer
packages/plugin-heading-analyzer/README.md:14:import { Puck } from "@puckeditor/core";
packages/plugin-heading-analyzer/README.md:15:import headingAnalyzer from "@puckeditor/plugin-heading-analyzer";
packages/plugin-heading-analyzer/README.md:16:import "@puckeditor/plugin-heading-analyzer/dist/index.css";
packages/plugin-heading-analyzer/package.json:2:  "name": "@puckeditor/plugin-heading-analyzer",
packages/plugin-heading-analyzer/package.json:4:  "author": "Chris Villa <chris@puckeditor.com>",
packages/plugin-heading-analyzer/package.json:28:    "@puckeditor/core": "workspace:*",
packages/plugin-heading-analyzer/src/HeadingAnalyzer.tsx:5:import { createUsePuck } from "@puckeditor/core";
packages/tsup-config/index.ts:11:    "@puckeditor/core",
pnpm-lock.yaml:54:      '@puckeditor/core':
pnpm-lock.yaml:293:      '@puckeditor/core':
```

`apps/docs`（不在 workspace，只當參考）、`docs/superpowers`（規格與計畫）與 `CHANGELOG.md`（上游歷史）刻意排除。`pnpm-lock.yaml` 的兩行會在 Step 7 由 `pnpm install` 更新，不要手動修改。若清單多出其他檔案，Step 3–6 也要一併處理。

- [ ] **Step 3: 改寫兩個套件的 metadata**

`packages/core/package.json` 原始片段（檔案開頭）：

```json
  "name": "@puckeditor/core",
  "version": "0.23.0",
  "description": "The open-source visual editor for React",
  "author": "Chris Villa <chris@puckeditor.com>",
  "repository": "puckeditor/puck",
  "bugs": "https://github.com/puckeditor/puck/issues",
  "homepage": "https://puckeditor.com",
  "keywords": [
    "puck",
```

替換為（`keywords` 只把 `"puck"` 換成 `"tceditor"`，其餘關鍵字不變）：

```json
  "name": "@tzuchi/tceditor",
  "version": "0.1.0",
  "description": "Visual page editor for React, forked from Puck v0.23.0",
  "author": "Tzu Chi",
  "keywords": [
    "tceditor",
```

`packages/plugin-heading-analyzer/package.json` 原始片段（檔案開頭）：

```json
  "name": "@puckeditor/plugin-heading-analyzer",
  "version": "0.23.0",
  "author": "Chris Villa <chris@puckeditor.com>",
  "repository": "puckeditor/puck",
  "bugs": "https://github.com/puckeditor/puck/issues",
  "homepage": "https://puckeditor.com",
```

替換為：

```json
  "name": "@tzuchi/tceditor-plugin-heading-analyzer",
  "version": "0.1.0",
  "description": "tceditor plugin that shows the heading outline and flags missing heading levels",
  "author": "Tzu Chi",
```

最後，兩個檔案（`packages/core/package.json` 第 27 行、`packages/plugin-heading-analyzer/package.json` 第 8 行，行號為修改前）都把下面這一行（每個檔案中只出現一次）：

```json
  "private": false,
```

整行替換為：

```json
  "private": true,
```

理由見本 task 開頭的「設計決定」：S1 不發佈到任何 registry，`private` 讓 `npm publish`／`pnpm publish` 拒絕發佈；`pnpm pack` 照常可用。

- [ ] **Step 4: 更新引用 core 套件名的程式與設定**

下列每一行在各自的檔案中都只出現一次，逐一整行替換：

| 檔案 | 原始（逐字） | 替換為 |
|---|---|---|
| `package.json` | `  "name": "puck-repo",` | `  "name": "tceditor-repo",` |
| `package.json` | `  "version": "0.23.0",` | `  "version": "0.1.0",` |
| `packages/plugin-heading-analyzer/package.json` | `    "@puckeditor/core": "workspace:*",` | `    "@tzuchi/tceditor": "workspace:*",` |
| `apps/demo/package.json` | `    "@puckeditor/core": "workspace:*",` | `    "@tzuchi/tceditor": "workspace:*",` |
| `apps/demo/tsconfig.json` | `      "@puckeditor/core": ["../../packages/core/index.ts"],` | `      "@tzuchi/tceditor": ["../../packages/core/index.ts"],` |
| `apps/demo/next.config.js` | `  transpilePackages: ["@puckeditor/core", "lucide-react"],` | `  transpilePackages: ["@tzuchi/tceditor", "lucide-react"],` |
| `packages/tsup-config/index.ts` | `    "@puckeditor/core",` | `    "@tzuchi/tceditor",` |
| `packages/plugin-heading-analyzer/src/HeadingAnalyzer.tsx` | `import { createUsePuck } from "@puckeditor/core";` | `import { createUsePuck } from "@tzuchi/tceditor";` |

`packages/core/store/index.ts` 第 365 行的註解：

原始（逐字）：

```ts
// Created lazily instead of at module scope so that importing @puckeditor/core has no side effects that might
```

替換為：

```ts
// Created lazily instead of at module scope so that importing @tzuchi/tceditor has no side effects that might
```

`apps/demo/package.json` 中，這一行原本排在 `devDependencies` 的第一個，改名後字母順序在 `@types/*` 之後。不需要手動重排，Step 7 的 `pnpm install` 不會改動 `package.json` 的順序，lockfile 會自行排序。

- [ ] **Step 5: 更新根目錄 `README.md` 與 `CONTRIBUTING.md` 的 4 行**

`README.md`（每一行在檔案中只出現一次）：

| 原始（逐字） | 替換為 |
|---|---|
| `npm i @puckeditor/core --save # or npx create-puck-app my-app` | `pnpm add @tzuchi/tceditor --workspace # not published to a registry; use it from this monorepo` |
| `import { Puck } from "@puckeditor/core";` | `import { Puck } from "@tzuchi/tceditor";` |
| `import { Render } from "@puckeditor/core";` | `import { Render } from "@tzuchi/tceditor";` |

`CONTRIBUTING.md` 第 99 行，原始（逐字）：

```md
- Class names must follow the [SUIT CSS](https://suitcss.github.io) methodology. This is a tooling-angostic convention used at [@puckeditor](https://github.com/puckeditor) for all CSS work.
```

替換為（順便修正 `angostic` 拼字）：

```md
- Class names must follow the [SUIT CSS](https://suitcss.github.io) methodology. This is a tooling-agnostic convention used for all CSS work in this repository.
```

`pnpm add <套件> --workspace` 只會從 workspace 中尋找套件，找不到就失敗，不會去 registry 下載（2026-10-09 以 pnpm 10.26.1 實測，寫入的版本範圍是 `workspace:*`）。

- [ ] **Step 6: 改寫 plugin 的 README**

`packages/plugin-heading-analyzer/README.md` 整個改成：

````markdown
# plugin-heading-analyzer

Visualise your heading outline structure and identify missing heading levels. Respects WCAG 2.

<img src="https://i.imgur.com/POqtgHu.jpg" alt="example" width="156px" />

## Quick start

This package is not published to a registry. Add it to an app in this monorepo as a workspace dependency:

```sh
pnpm add @tzuchi/tceditor-plugin-heading-analyzer --workspace
```

```jsx
import { Puck } from "@tzuchi/tceditor";
import headingAnalyzer from "@tzuchi/tceditor-plugin-heading-analyzer";
import "@tzuchi/tceditor-plugin-heading-analyzer/dist/index.css";

...

// Render Puck
export function Page() {
  return <Puck
    config={config}
    data={data}
    plugins={[
        headingAnalyzer
    ]}
  />;
}
```

## License

MIT © [The Puck Contributors](https://github.com/puckeditor/puck/graphs/contributors). See `LICENSE` and `NOTICE`.
````

（`LICENSE`、`NOTICE` 會在 Step 13 放進 plugin 目錄。）

確認改過的檔案符合 Prettier：

```sh
pnpm exec prettier --check README.md CONTRIBUTING.md packages/plugin-heading-analyzer/README.md packages/core/store/index.ts packages/tsup-config/index.ts packages/plugin-heading-analyzer/src/HeadingAnalyzer.tsx
```

預期輸出：

```
Checking formatting...
All matched files use Prettier code style!
```

- [ ] **Step 7: 更新 lockfile 與根目錄的 workspace 連結**

Task 1 的全新安裝在 `shamefullyHoist` 下，把兩個 workspace 套件以舊名連結到根目錄的 `node_modules/@puckeditor/core`、`node_modules/@puckeditor/plugin-heading-analyzer`。改名後 `pnpm install` 不會刪掉這兩個舊連結；留著的話，之後若有程式碼誤用 `@puckeditor/core`，在本機仍能從根目錄解析成功，在乾淨 clone 上卻會失敗。所以先刪除舊連結，再安裝兩次：

```sh
rm -rf node_modules/@puckeditor
pnpm install
pnpm install --frozen-lockfile
git diff --numstat pnpm-lock.yaml
git diff -U0 pnpm-lock.yaml | grep -E '^[-+] '
node -e 'const fs = require("fs"); for (const scope of ["@tzuchi", "@puckeditor"]) { const dir = "node_modules/" + scope; console.log(dir + ": " + (fs.existsSync(dir) ? fs.readdirSync(dir).join(" ") : "(none)")); }'
```

第一次 `pnpm install` 預期：`Scope: all 7 workspace projects`、`Already up to date`（沒有新增或移除任何外部套件），過程中 `packages/core prepare$ pnpm build` 與 `packages/plugin-heading-analyzer prepare$ pnpm build` 會重新建置 `dist`，最後是 `Done in …s using pnpm v10.26.1`（中間的 `deprecated` 與 react-from-json 的 peer 警告是既有的）。這一次會更新 lockfile，但**不會**把改名後的套件連結到根目錄的 `node_modules/@tzuchi/`（2026-10-09 以 pnpm 10.26.1 在兩個獨立 worktree 實測皆如此）。

第二次 `pnpm install --frozen-lockfile` 預期：`Lockfile is up to date, resolution step is skipped`、`Already up to date`，`prepare` 再建置一次，最後是 `Done in …s`。這一次會把所有 workspace 套件以新名連結到根目錄（同樣經過實測），和乾淨 clone 的結果相同；`--frozen-lockfile` 也順便確認 lockfile 與各 `package.json` 一致。

`git diff` 與最後一行 `node -e` 的預期輸出：

```
6	6	pnpm-lock.yaml
-      '@puckeditor/core':
-        specifier: workspace:*
-        version: link:../../packages/core
+      '@tzuchi/tceditor':
+        specifier: workspace:*
+        version: link:../../packages/core
-      '@puckeditor/core':
-        specifier: workspace:*
-        version: link:../core
+      '@tzuchi/tceditor':
+        specifier: workspace:*
+        version: link:../core
node_modules/@tzuchi: tceditor tceditor-plugin-heading-analyzer
node_modules/@puckeditor: (none)
```

只有 `apps/demo` 與 `packages/plugin-heading-analyzer` 兩個 importer 的套件名改變，沒有任何版本變動。若 diff 中出現其他行，表示 lockfile 被重新解析了，先停下來確認。若 `node_modules/@tzuchi` 顯示 `(none)`，表示第二次安裝沒有執行或失敗，重跑 `pnpm install --frozen-lockfile` 後再檢查一次。

- [ ] **Step 8: 確認 `@puckeditor` 已全部改完**

```sh
git grep -n "@puckeditor" -- . ':!apps/docs' ':!docs/superpowers' ':!CHANGELOG.md'
echo "exit=$?"
```

預期輸出：只有一行

```
exit=1
```

（`git grep` 沒有找到任何結果時，exit code 是 1。）

- [ ] **Step 9: 確認測試、型別與建置**

```sh
pnpm test 2>&1 | grep -E "Test Suites:|Tests:|Snapshots:|ℹ (pass|fail)"
pnpm typecheck > /dev/null; echo "typecheck=$?"
pnpm build 2>&1 | grep -E "Tasks:"
```

預期輸出：

```
@tzuchi/tceditor:test: Test Suites: 50 passed, 50 total
@tzuchi/tceditor:test: Tests:       267 passed, 267 total
@tzuchi/tceditor:test: Snapshots:   19 passed, 19 total
ℹ pass 10
ℹ fail 0
typecheck=0
 Tasks:    3 successful, 3 total
```

turbo 的輸出前綴已經變成 `@tzuchi/tceditor:`。`pnpm build` 包含 `apps/demo` 的 `next build`，可以確認 demo 的 tsconfig paths 與 `transpilePackages` 都改對了。plugin 的 DTS 階段仍會印出 `"Context" is not exported by "node_modules/@types/react/index.d.ts"`，這是 v0.23.0 原有的警告。

- [ ] **Step 10: Commit**

```sh
git add package.json pnpm-lock.yaml README.md CONTRIBUTING.md \
  apps/demo/package.json apps/demo/tsconfig.json apps/demo/next.config.js \
  packages/core/package.json packages/core/store/index.ts \
  packages/plugin-heading-analyzer/package.json packages/plugin-heading-analyzer/README.md \
  packages/plugin-heading-analyzer/src/HeadingAnalyzer.tsx packages/tsup-config/index.ts
git status --short
git commit -m "build: rename packages to @tzuchi/tceditor" -m "Rename @puckeditor/core to @tzuchi/tceditor and @puckeditor/plugin-heading-analyzer to @tzuchi/tceditor-plugin-heading-analyzer, restart both at 0.1.0 and update every reference in the workspace. Mark both packages private, since S1 does not publish to any registry. Public API names such as <Puck>, usePuck and Config are unchanged."
```

`git status --short` 預期（commit 前）：

```
M  CONTRIBUTING.md
M  README.md
M  apps/demo/next.config.js
M  apps/demo/package.json
M  apps/demo/tsconfig.json
M  package.json
M  packages/core/package.json
M  packages/core/store/index.ts
M  packages/plugin-heading-analyzer/README.md
M  packages/plugin-heading-analyzer/package.json
M  packages/plugin-heading-analyzer/src/HeadingAnalyzer.tsx
M  packages/tsup-config/index.ts
M  pnpm-lock.yaml
?? CLAUDE.md
```

預期 commit 結果：`13 files changed, 37 insertions(+), 40 deletions(-)`。

- [ ] **Step 11: 寫 `LICENSE`／`NOTICE` 的失敗測試**

`packages/core/__tests__/package-files.spec.ts`（新檔）：

```ts
/** Tests that the published packages ship the license and attribution files */
import fs from "fs";
import path from "path";

const repoRoot = path.resolve(__dirname, "../../..");

const readFile = (...segments: string[]) =>
  fs.readFileSync(path.join(repoRoot, ...segments), "utf8");

// The plugin has no test runner of its own, so its package is checked here too.
describe.each(["packages/core", "packages/plugin-heading-analyzer"])(
  "%s",
  (packageDir) => {
    it("lists LICENSE and NOTICE in files", () => {
      const manifest = JSON.parse(readFile(packageDir, "package.json"));

      expect(manifest.files).toEqual(["dist", "LICENSE", "NOTICE"]);
    });

    it.each(["LICENSE", "NOTICE"])("has a copy of the root %s", (fileName) => {
      expect(readFile(packageDir, fileName)).toBe(readFile(fileName));
    });
  }
);
```

npm 打包時一定會帶上套件根目錄的 `LICENSE`，但 `NOTICE` 必須列在 `files` 裡才會被打包。兩個檔案都要放在**套件目錄**中：根目錄的檔案不會進入套件的 tarball。

- [ ] **Step 12: 執行測試，確認失敗**

```sh
(cd packages/core && pnpm test __tests__/package-files.spec.ts) 2>&1 | grep -E "^  ●|^Tests:|ENOENT|ELIFECYCLE"
```

預期輸出（`ENOENT` 行中的絕對路徑依工作目錄而不同）：

```
  ● packages/core › lists LICENSE and NOTICE in files
  ● packages/core › has a copy of the root LICENSE
    ENOENT: no such file or directory, open '/Users/kaellim/Desktop/projects/puck/packages/core/LICENSE'
  ● packages/core › has a copy of the root NOTICE
    ENOENT: no such file or directory, open '/Users/kaellim/Desktop/projects/puck/packages/core/NOTICE'
  ● packages/plugin-heading-analyzer › lists LICENSE and NOTICE in files
  ● packages/plugin-heading-analyzer › has a copy of the root LICENSE
    ENOENT: no such file or directory, open '/Users/kaellim/Desktop/projects/puck/packages/plugin-heading-analyzer/LICENSE'
  ● packages/plugin-heading-analyzer › has a copy of the root NOTICE
    ENOENT: no such file or directory, open '/Users/kaellim/Desktop/projects/puck/packages/plugin-heading-analyzer/NOTICE'
Tests:       6 failed, 6 total
 ELIFECYCLE  Test failed. See above for more details.
```

兩個 `lists LICENSE and NOTICE in files` 的失敗內容是 `files` 只有 `"dist"`（少了 `"LICENSE"`、`"NOTICE"`）。

- [ ] **Step 13: 新增 `NOTICE`、放入副本、更新 `files`**

建立根目錄 `NOTICE`（用 heredoc 確保內容與結尾換行完全一致），再把根目錄原有的 `LICENSE` 與新的 `NOTICE` 複製到兩個套件目錄。根目錄的 `LICENSE` 維持原狀，不修改：

```sh
cat > NOTICE <<'EOF'
tceditor

tceditor is a modified version of Puck, the open-source visual editor for
React (https://github.com/puckeditor/puck). It was forked from Puck release
v0.23.0 (git tag v0.23.0, commit b4204f09).

Puck is distributed under the MIT License:

    Copyright (c) The Puck Contributors.

The full text of that license is in the LICENSE file that accompanies this
notice. It covers the Puck source code and the changes made in tceditor,
which are distributed under the same MIT License.
EOF
cp LICENSE NOTICE packages/core/
cp LICENSE NOTICE packages/plugin-heading-analyzer/
head -3 LICENSE
```

預期 `head -3 LICENSE` 輸出：

```
MIT License

Copyright (c) The Puck Contributors.
```

`packages/core/package.json` 與 `packages/plugin-heading-analyzer/package.json` 都做同一個替換（每個檔案中只出現一次）：

原始片段：

```json
  "files": [
    "dist"
  ],
```

替換為：

```json
  "files": [
    "dist",
    "LICENSE",
    "NOTICE"
  ],
```

- [ ] **Step 14: 把測試讀到的 core 以外檔案加進 turbo 的 `inputs`**

`package-files.spec.ts` 位於 core，卻會讀根目錄與 plugin 目錄的檔案。turbo 計算 `@tzuchi/tceditor#test` 的快取 hash 時預設只看 core 目錄（`$TURBO_DEFAULT$`），所以要明確列出這些檔案，否則它們改變時 `pnpm test` 會直接重播快取中的通過結果。

`turbo.json` 原始片段（逐字，檔案中只出現一次）：

```json
    "test": {},
    "dev": {
```

替換為：

```json
    "test": {},
    "@tzuchi/tceditor#test": {
      "inputs": [
        "$TURBO_DEFAULT$",
        "$TURBO_ROOT$/LICENSE",
        "$TURBO_ROOT$/NOTICE",
        "$TURBO_ROOT$/packages/plugin-heading-analyzer/package.json",
        "$TURBO_ROOT$/packages/plugin-heading-analyzer/LICENSE",
        "$TURBO_ROOT$/packages/plugin-heading-analyzer/NOTICE"
      ]
    },
    "dev": {
```

`@tzuchi/tceditor#test` 只套用在 core 的 `test` 任務，其他套件仍使用通用的 `"test": {}`。`$TURBO_DEFAULT$` 保留 core 目錄內原本的輸入，`$TURBO_ROOT$` 是 repo 根目錄（turbo 2.9.14 支援）。確認 turbo 讀到了這些輸入：

```sh
pnpm exec turbo run test --dry=json 2>/dev/null | node -e 'let s = ""; process.stdin.on("data", (d) => (s += d)).on("end", () => { const task = JSON.parse(s).tasks.find((t) => t.taskId === "@tzuchi/tceditor#test"); console.log(Object.keys(task.inputs).filter((f) => f.startsWith("..")).join("\n")); })'
pnpm exec prettier --check turbo.json
```

預期輸出：

```
../../LICENSE
../../NOTICE
../plugin-heading-analyzer/LICENSE
../plugin-heading-analyzer/NOTICE
../plugin-heading-analyzer/package.json
Checking formatting...
All matched files use Prettier code style!
```

`--dry=json` 只列出執行計畫，不會真的跑測試。`inputs` 中的路徑是相對於 core 目錄；這 5 個檔案都在，表示 `$TURBO_ROOT$` 解析正確。（`turbo.json` 不在 `format:check` 的副檔名清單中，這裡另外確認它符合 Prettier。）

- [ ] **Step 15: 執行測試，確認通過**

```sh
(cd packages/core && pnpm test __tests__/package-files.spec.ts) 2>&1 | grep -E "✓|✕|^Tests:"
```

預期輸出（毫秒數可能不同）：

```
    ✓ lists LICENSE and NOTICE in files (1 ms)
    ✓ has a copy of the root LICENSE (2 ms)
    ✓ has a copy of the root NOTICE (1 ms)
    ✓ lists LICENSE and NOTICE in files
    ✓ has a copy of the root LICENSE (1 ms)
    ✓ has a copy of the root NOTICE
Tests:       6 passed, 6 total
```

- [ ] **Step 16: 確認 `pnpm pack` 的 tarball 帶有 `LICENSE` 與 `NOTICE`**

`pnpm pack` 會先執行套件的 `prepare`（也就是 `pnpm build`），所以 tarball 一定是最新的建置結果。下面的腳本把兩個套件打包到暫存目錄，列出 `dist/` 以外的檔案，並比對 tarball 中的 `LICENSE`、`NOTICE` 是否與根目錄相同，最後刪除暫存目錄：

```sh
bash -s <<'EOF'
PACK_DIR=$(mktemp -d "${TMPDIR:-/tmp}/tceditor-pack.XXXXXX")
pnpm --filter @tzuchi/tceditor --filter @tzuchi/tceditor-plugin-heading-analyzer pack --pack-destination "$PACK_DIR" > /dev/null 2>&1
for t in "$PACK_DIR"/*.tgz; do
  echo "== $(basename "$t")"
  tar -tzf "$t" | grep -v "^package/dist/" | LC_ALL=C sort
  for f in LICENSE NOTICE; do
    tar -xzOf "$t" "package/$f" | cmp -s - "$f" && echo "$f matches the root $f"
  done
done
rm -rf "$PACK_DIR"
EOF
```

預期輸出：

```
== tzuchi-tceditor-0.1.0.tgz
package/LICENSE
package/NOTICE
package/package.json
LICENSE matches the root LICENSE
NOTICE matches the root NOTICE
== tzuchi-tceditor-plugin-heading-analyzer-0.1.0.tgz
package/LICENSE
package/NOTICE
package/README.md
package/package.json
LICENSE matches the root LICENSE
NOTICE matches the root NOTICE
```

tarball 的檔名已經是新的套件名與版本。兩個套件雖然已是 `"private": true`，`pnpm pack` 照常打包。core 沒有 `README.md`，這是 Task 1 移除 `prepare` 中複製 README 步驟的結果，本 task 不處理。

- [ ] **Step 17: Commit**

```sh
git add NOTICE packages/core/LICENSE packages/core/NOTICE \
  packages/plugin-heading-analyzer/LICENSE packages/plugin-heading-analyzer/NOTICE \
  packages/core/package.json packages/plugin-heading-analyzer/package.json \
  packages/core/__tests__/package-files.spec.ts turbo.json
git commit -m "build: ship LICENSE and NOTICE with the published packages" -m "Add a NOTICE that records the fork from Puck v0.23.0 under the MIT License, and include copies of LICENSE and NOTICE in the files of @tzuchi/tceditor and @tzuchi/tceditor-plugin-heading-analyzer. A test keeps the copies identical to the root files, and turbo.json lists those files as inputs of the core test task so a cached result is not replayed after they change."
git status --short
```

預期：`9 files changed, 121 insertions(+), 2 deletions(-)`；`git status --short` 只剩 `?? CLAUDE.md`。

- [ ] **Step 18: 確認改了根目錄 `NOTICE` 後，turbo 快取會失效**

這一步驗證 Step 14 的 `inputs` 確實生效：先跑一次讓快取變熱，再故意改壞根目錄的 `NOTICE`，確認 turbo 沒有重播快取、測試真的失敗，最後還原。

```sh
pnpm test 2>&1 | grep -E "cache (hit|miss)|Tests:"
echo "x" >> NOTICE
pnpm test 2>&1 | grep -E "cache (hit|miss)|Tests:"
git checkout -- NOTICE
pnpm test 2>&1 | grep -E "cache (hit|miss)|Tests:"
git status --short
```

預期輸出（hash 不同；依 git 版本與設定，`git checkout` 可能另外印出一行 `Updated 1 path from the index`）：

```
@tzuchi/tceditor:test: cache miss, executing <hash A>
@tzuchi/tceditor:test: Tests:       273 passed, 273 total
@tzuchi/tceditor:test: cache miss, executing <hash B>
@tzuchi/tceditor:test: Tests:       2 failed, 271 passed, 273 total
@tzuchi/tceditor:test: cache hit, replaying logs <hash A>
@tzuchi/tceditor:test: Tests:       273 passed, 273 total
?? CLAUDE.md
```

- 第 1 次：本 task 新增了檔案，快取中沒有對應結果，所以是 `cache miss`（若重跑本步驟，這一行會是 `cache hit, replaying logs <hash A>`，結果相同）。
- 第 2 次：`NOTICE` 改變使 hash 不同，turbo 實際執行 jest，兩個 `has a copy of the root NOTICE` 失敗。若這一行是 `cache hit` 且 `273 passed`，表示 Step 14 的 `inputs` 沒有生效，回頭檢查 `turbo.json`。
- 第 3 次：還原後 hash 回到 `<hash A>`，重播第 1 次的快取。
- `git status --short` 只剩 `?? CLAUDE.md`，確認 `NOTICE` 已還原。

- [ ] **Step 19: 在 `CHANGELOG.md` 頂端加入 tceditor 0.1.0 段落**

`CHANGELOG.md` 原始片段（檔案開頭）：

```markdown
# CHANGELOG

<!--__CHANGELOG_ENTRY__-->

## [0.23.0](/compare/v0.22.4...v0.23.0) (2026-08-07)
```

替換為：

```markdown
# CHANGELOG

## tceditor 0.1.0 (unreleased)

tceditor is a fork of [Puck](https://github.com/puckeditor/puck) v0.23.0 (git tag `v0.23.0`, commit `b4204f09`), and its versions restart at 0.1.0. Everything from the `0.23.0` section down is Puck's upstream changelog, kept unchanged for reference.

### Changes from Puck v0.23.0

* rename the packages to `@tzuchi/tceditor` and `@tzuchi/tceditor-plugin-heading-analyzer` so they cannot be confused with Puck's npm packages, and mark both `private` because they are not published to a registry yet; public API names such as `<Puck>`, `usePuck` and `Config` are unchanged
* add a `NOTICE` file and ship `LICENSE` and `NOTICE` in both packages
* switch the monorepo from yarn 1 to pnpm and add `pnpm verify`
* remove the upstream recipes, `create-puck-app`, `field-contentful`, `plugin-emotion-cache`, the GitHub workflows and the npm release tooling
* remove the Plausible analytics from the demo
* upgrade the tiptap packages to 3.31.4 (GHSA-j95f-988m-3j2f, GHSA-cp6q-959q-f8rh, GHSA-c8x8-7fp4-3x9w)

## [0.23.0](/compare/v0.22.4...v0.23.0) (2026-08-07)
```

`<!--__CHANGELOG_ENTRY__-->` 是上游 `scripts/create-changelog.js` 插入新版本用的標記，該腳本已在 Task 1 刪除，所以一併移除。`## [0.23.0]` 以下的上游歷史一個字都不改。

確認：

```sh
git diff --numstat CHANGELOG.md
git diff -U0 CHANGELOG.md | grep -E '^-[^-]'
sed -n '1,/^## \[0\.23\.0\]/p' CHANGELOG.md | grep -c "@puckeditor"
```

預期輸出：

```
12	1	CHANGELOG.md
-<!--__CHANGELOG_ENTRY__-->
0
```

唯一刪除的是那行標記；新段落（`## [0.23.0]` 之前）不含 `@puckeditor`。上游歷史段落中仍有 `@puckeditor`（例如 `@puckeditor/plugin-ai`），屬於保留的歷史。

- [ ] **Step 20: 從乾淨狀態跑一次 `pnpm verify`**

```sh
rm -rf .turbo packages/core/dist packages/plugin-heading-analyzer/dist apps/demo/.next
pnpm verify > "${TMPDIR:-/tmp}/tceditor-verify-task02.log" 2>&1
echo "exit=$?"
grep -E "Test Suites:|Tests:|Snapshots:|ℹ (tests|pass|fail)|> tsc|✖|Tasks:|All matched|^pnpm audit:|^GATED|^audit:gate (passed|FAILED)" "${TMPDIR:-/tmp}/tceditor-verify-task02.log"
```

預期：約 1–2 分鐘（另加 audit 的網路時間）。輸出：

```
exit=0
@tzuchi/tceditor:test: Test Suites: 51 passed, 51 total
@tzuchi/tceditor:test: Tests:       273 passed, 273 total
@tzuchi/tceditor:test: Snapshots:   19 passed, 19 total
 Tasks:    1 successful, 1 total
ℹ tests 10
ℹ pass 10
ℹ fail 0
> tsc -p tsconfig.typecheck.json
demo:lint: ✖ 8 problems (0 errors, 8 warnings)
@tzuchi/tceditor:lint: ✖ 4 problems (0 errors, 4 warnings)
 Tasks:    3 successful, 3 total
All matched files use Prettier code style!
 Tasks:    3 successful, 3 total
pnpm audit: 69 advisories, 71 finding path(s). 106 package versions ship with packages/core, packages/plugin-heading-analyzer.
GATED (ships with a published package): 0 finding(s)
audit:gate passed: no advisories affect packages/core, packages/plugin-heading-analyzer (71 finding path(s) elsewhere are listed above).
```

測試比 Task 1 多 1 個 suite、6 個測試（`package-files.spec.ts`）。`69 advisories`、`71 finding path(s)` 會隨 advisory 資料庫更新而改變；`exit=0`、`106 package versions`、`GATED … 0 finding(s)` 與 `audit:gate passed` 必須相同。若失敗，看 log 檔找出是哪一步，修正後再跑一次。

- [ ] **Step 21: Commit**

```sh
git add CHANGELOG.md
git commit -m "docs: start the tceditor changelog" -m "Add a tceditor 0.1.0 section above Puck's upstream history that records the fork point (v0.23.0, b4204f09) and the changes made so far."
git log --oneline -3
git status --short
```

預期 `git log`（hash 不同）：

```
<hash> docs: start the tceditor changelog
<hash> build: ship LICENSE and NOTICE with the published packages
<hash> build: rename packages to @tzuchi/tceditor
```

commit 結果為 `1 file changed, 12 insertions(+), 1 deletion(-)`；`git status --short` 只剩 `?? CLAUDE.md`。

### Task 3: CSS 與依賴整理（F6、F7）

目的：
- **F6**（規格 §6 F6、§3.1）：預設 CSS 不再從 `rsms.me` 載入 Inter 字型，套件只匯出一個樣式表 `./tceditor.css`。原本的 `no-external` 入口在移除外部字型後與主入口完全相同，所以一併刪除。demo 自己的樣式表也不再從 `rsms.me` 載入字型（依規格 §3.2「不送資料給第三方」）。
- **F7**（規格 §6 F7）：移除宣告了卻沒有使用的 `deep-diff`、`@types/deep-diff`、`react-hotkeys-hook`、`@dnd-kit/helpers`，並把實際有 import、卻沒有宣告的 `classnames` 補進 `dependencies`。

共 3 個 commit。

**執行位置**：主工作目錄 `/Users/kaellim/Desktop/projects/puck`，分支 `tzuchi/main`，接在 Task 2 之後。commit 時一律明確列出路徑。

**設計決定與說明**：
- `"./dist/index.css"` 這個 export 也一併移除，只留 `"./tceditor.css": "./dist/index.css"`。理由：
  - tsup 的 `runtimeCssPlugin` 是用 esbuild 直接讀原始碼 `bundle/index.ts`（再經由它 import 的 `index.css`）產生 runtime CSS 字串，不經過 package exports。
  - workspace 內沒有任何地方 import core 的 `dist/index.css`：demo 用的是 `@/core/styles.css`（原始碼），`runtime-css-debug` 頁用的 `@/core-dist` 是 tsconfig 路徑別名，也不經過 exports。
  - plugin 自己的 `"./dist/index.css"` export 是 plugin 本身的樣式，與此無關，保留不動。
- `apps/demo/app/styles.css` 第 1 行也是 `@import url("https://rsms.me/inter/inter.css")`，本 task 一併刪除（Step 4）。規格 F6 只涵蓋函式庫的預設 CSS，但 demo 頁面每次載入都會向 rsms.me 送出請求，帶著使用者的 IP 與 Referer；AutoFrame（`components/AutoFrame/index.tsx` 的 `CopyHostStyles`）還會把宿主頁面的樣式鏡像進預覽 iframe。規格 §3.2 以「不送資料給第三方」為由移除 demo 的分析服務，同一原則也適用於字型。
  - demo 的 `font-family` 仍以 `Inter`／`InterVariable` 開頭：本機有安裝 Inter 時照用，沒有就落到其後的系統字型，不會壞版，只是外觀可能和上游 demo 不同。
  - 第 2 行是空行，必須一起刪掉：CSS 檔開頭留空行時 `prettier --check` 會失敗（已實測）。
  - 若日後要讓 demo 固定使用 Inter，應把字型檔放進 repo 或以 npm 套件自行提供，不要再從第三方網域載入。
- core 的 `--puck-font-family` 是 `Inter, var(--puck-fallback-font-stack)`。宿主沒有提供 Inter 時，會改用系統字型，不會壞版。
- F7 沒有新增 jest 測試：這是一次性的 manifest 整理。改用 `git grep` 確認 import 狀況，再檢查 `dist`：`classnames` 從「被打包進 bundle」變成「外部 `require("classnames")`」。
- `classnames` 版本取 lockfile 目前解析的 `2.5.1`，寫成 `^2.5.1`，與其他依賴的寫法一致。補進 `dependencies` 之後，`classnames@2.5.1` 也會納入 `audit:gate` 的出貨套件集合。原本它被打包進 `dist`，卻沒有任何宣告，所以 Task 1 的 gate 看不到它。

**Files:**
- Modify:
  - `packages/core/bundle/index.css`
  - `packages/core/package.json`（`exports`、`scripts.build`、`dependencies`、`devDependencies`）
  - `apps/demo/app/styles.css`（刪除前 2 行）
  - `pnpm-lock.yaml`、`CHANGELOG.md`
- Delete:
  - `packages/core/bundle/no-external.ts`、`packages/core/bundle/no-external.css`
- Test:
  - `packages/core/__tests__/css-imports.spec.ts`（新增，2 個測試）

**Interfaces:**
- Consumes（Task 1、2）：
  - 套件名 `@tzuchi/tceditor`（`pnpm --filter @tzuchi/tceditor build`）；`apps/demo` 以 `workspace:*` 依賴它。
  - `packages/core/__tests__/package-files.spec.ts`：本 task 不修改 `files`。
  - `CHANGELOG.md` 的 `### Changes from Puck v0.23.0` 清單。
  - `packages/core/tsup.config.ts` 的 `runtimeCssPlugin`（讀 `bundle/index.ts` 與 `bundle/iframe-styles.ts`），本 task 不修改。
- Produces（後續 task 依賴）：
  - `packages/core/package.json` 的 `exports` 只剩 `"."`、`"./rsc"`、`"./internal"`、`"./tceditor.css": "./dist/index.css"`、`"./package.json"`。Task 8 新增 `"./richtext-migrate"` 不受影響。
  - `packages/core/package.json` 的 `scripts.build` 是 `"rm -rf dist && tsup bundle/index.ts bundle/rsc.tsx bundle/internal.ts"`。Task 8 新增入口時，把 `bundle/richtext-migrate.ts` 加在這串之中。
  - `bundle/index.css` 的內容只剩 `@import "./core.css";`；`dist/` 中不再有 `no-external.*`，也不含 `rsms.me`。
  - `apps/demo/app/styles.css` 不再載入外部字型；repo 中（排除 `apps/docs`、`CHANGELOG.md`、`docs/superpowers`）已沒有 `rsms.me`，demo 的建置結果 `apps/demo/.next/static` 也沒有。後續 task 不可在 demo 加入第三方網域的字型、樣式或腳本。
  - `packages/core/__tests__/css-imports.spec.ts` 有兩個斷言：
    - `packages/core` 底下任何 `.css`（排除 `node_modules`、`dist`）不得以 `url(…)` 或 `@import` 引用遠端網址（`http://`、`https://`、`//`）。後續 task 不可加入外部字型或外部圖片。
    - `exports` 中以 `.css` 結尾的 key 只能是 `["./tceditor.css"]`。新增其他 CSS export 時必須同步修改這個測試。
    - 這個測試只讀 core 目錄內的檔案，所以不需要加進 Task 2 Step 14 的 `@tzuchi/tceditor#test` `inputs`。
  - core 的 `dependencies` 新增 `"classnames": "^2.5.1"`，移除 `@dnd-kit/helpers`、`deep-diff`、`react-hotkeys-hook`；`devDependencies` 移除 `@types/deep-diff`。主入口與 rsc 入口都改以外部模組引用 `classnames`：`dist/index.js`、`dist/rsc.js` 中是 `require("classnames")`，ESM 則由一個共用 `.mjs` chunk `from "classnames"`。Task 8 的 `check-bundle-imports.mjs` 若以白名單檢查外部 import，必須允許 `classnames`。
  - `audit:gate` 的出貨套件數從 106 變成 104：少了 `deep-diff`、`react-hotkeys-hook`、`@dnd-kit/helpers`，多了 `classnames`。
  - 測試基準：52 suites／275 tests／19 snapshots。
  - 觀察到但不在本 task 範圍（不修改）：
    - core 的程式碼 import 了 `@dnd-kit/collision`（3 處），卻沒有宣告。它是 `@dnd-kit/dom@0.4.0` 的依賴，所以 `audit:gate` 仍然涵蓋，但會被打包進 `dist`。
    - core 也 import 了 `react-dom`，卻沒有宣告為 peer。它在 tsup-config 的 `external` 中，不會被打包。

- [ ] **Step 1: 確認起點，以及目前的 `dist` 含有 `rsms.me`**

Task 2 Step 20 的 `pnpm verify` 已經建置過 `dist`。

```sh
git log --oneline -1
git status --short
grep -r -l "rsms.me" packages/core/dist | sort
grep -o 'defaultUiStyles = `.\{0,60\}' packages/core/dist/index.js
```

預期輸出（hash 不同；chunk 檔名中的 hash 也可能不同）：

```
<hash> docs: start the tceditor changelog
?? CLAUDE.md
packages/core/dist/chunk-<hash>.mjs
packages/core/dist/index.css
packages/core/dist/index.js
packages/core/dist/no-external.js
defaultUiStyles = `@import "https://rsms.me/inter/inter.css";
```

連 `no-external.js` 都含有 `rsms.me`：`runtimeCssPlugin` 把 `bundle/index.ts` 的 CSS（含外部字型的 `@import`）做成 runtime 字串，注入到主文件與 iframe，而兩個入口共用這段 runtime CSS。`defaultUiStyles` 的第一行就是外部字型的 `@import`。

- [ ] **Step 2: 寫「CSS 不得引用遠端網址」的失敗測試**

`packages/core/__tests__/css-imports.spec.ts`（新檔）：

```ts
/** Tests that the package's CSS never makes the browser fetch from another origin */
import fs from "fs";
import path from "path";

const packageRoot = path.resolve(__dirname, "..");

const collectCssFiles = (dir: string): string[] => {
  const files: string[] = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === "dist") {
      continue;
    }

    const entryPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectCssFiles(entryPath));
    } else if (entry.name.endsWith(".css")) {
      files.push(entryPath);
    }
  }

  return files;
};

// Matches url(https://…), url("//…"), @import "https://…" and
// @import url(https://…). data: URLs and comments do not match.
const remoteReference = /(?:url\(\s*|@import\s+)["']?(?:https?:)?\/\//i;

describe("package CSS", () => {
  it("does not reference remote URLs", () => {
    const offenders = collectCssFiles(packageRoot)
      .filter((file) => remoteReference.test(fs.readFileSync(file, "utf8")))
      .map((file) => path.relative(packageRoot, file));

    expect(offenders).toEqual([]);
  });
});
```

說明：
- 測試直接掃描原始碼中的 CSS，不依賴 `dist`，因為 `pnpm verify` 是先跑 test 才 build。
- 只比對 `url(` 或 `@import` 後面緊接著的網址，所以註解中的 `https://…`、`ViewportControls` 中 `data:image/svg+xml` 內含的 `http://www.w3.org/2000/svg` 都不會誤判。
- 寫法刻意避開 `Array.prototype.flatMap`、`includes`：core 的 tsconfig `lib` 是 `ES2015`，ts-jest 會對它們報型別錯誤。

- [ ] **Step 3: 執行測試，確認失敗**

```sh
(cd packages/core && pnpm test __tests__/css-imports.spec.ts) 2>&1 | grep -E "^  ●|^Tests:|^    [-+] |ELIFECYCLE"
```

預期輸出：

```
  ● package CSS › does not reference remote URLs
    - Expected  - 1
    + Received  + 3
    - Array []
    + Array [
    +   "bundle/index.css",
    + ]
Tests:       1 failed, 1 total
 ELIFECYCLE  Test failed. See above for more details.
```

- [ ] **Step 4: 移除外部字型的 `@import`**

`packages/core/bundle/index.css` 原本是：

```css
@import url("https://rsms.me/inter/inter.css");
@import "./core.css";
```

整個改成：

```css
@import "./core.css";
```

`apps/demo/app/styles.css` 原始片段（檔案開頭，逐字）：

```css
@import url("https://rsms.me/inter/inter.css");

body {
```

替換為（連同第 2 行的空行一起刪除）：

```css
body {
```

確認兩個檔案都符合 Prettier：

```sh
pnpm exec prettier --check packages/core/bundle/index.css apps/demo/app/styles.css
```

預期輸出：

```
Checking formatting...
All matched files use Prettier code style!
```

- [ ] **Step 5: 執行測試，確認通過**

```sh
(cd packages/core && pnpm test __tests__/css-imports.spec.ts) 2>&1 | grep -E "✓|✕|^Tests:"
```

預期輸出（毫秒數可能不同）：

```
    ✓ does not reference remote URLs (11 ms)
Tests:       1 passed, 1 total
```

- [ ] **Step 6: 重新建置 core，確認 `dist` 與 runtime CSS 都不含 `rsms.me`**

```sh
pnpm --filter @tzuchi/tceditor build > /dev/null 2>&1; echo "build=$?"
grep -r -l "rsms.me" packages/core/dist || echo "no rsms.me in packages/core/dist"
grep -o 'defaultUiStyles = `.\{0,60\}' packages/core/dist/index.js
```

預期輸出：

```
build=0
no rsms.me in packages/core/dist
defaultUiStyles = `/* styles/color.css */
```

`defaultUiStyles` 仍然存在，而且現在從 `styles/color.css` 開始，表示 `runtimeCssPlugin` 照常把 CSS 打包成 runtime 字串，只是少了外部字型的 `@import`。

- [ ] **Step 7: 更新 CHANGELOG 並 commit**

`CHANGELOG.md` 原始片段（`### Changes from Puck v0.23.0` 清單的最後一行）：

```markdown
* upgrade the tiptap packages to 3.31.4 (GHSA-j95f-988m-3j2f, GHSA-cp6q-959q-f8rh, GHSA-c8x8-7fp4-3x9w)
```

替換為：

```markdown
* upgrade the tiptap packages to 3.31.4 (GHSA-j95f-988m-3j2f, GHSA-cp6q-959q-f8rh, GHSA-c8x8-7fp4-3x9w)
* stop loading the Inter font from rsms.me in the default stylesheet and in the demo; the editor uses Inter only when the host app provides it and otherwise falls back to the system font stack
```

```sh
git add packages/core/bundle/index.css packages/core/__tests__/css-imports.spec.ts apps/demo/app/styles.css CHANGELOG.md
git status --short
git commit -m "fix(css): stop loading the Inter font from rsms.me" -m "The default stylesheet imported https://rsms.me/inter/inter.css, so every editor load made a request to a third-party origin, and the runtime CSS injected into the iframe carried the same import. Host apps now provide the font; --puck-font-family falls back to the system font stack when Inter is not available. The demo drops the same import so it does not send requests to a third party either."
```

`git status --short` 預期（commit 前）：

```
M  CHANGELOG.md
M  apps/demo/app/styles.css
A  packages/core/__tests__/css-imports.spec.ts
M  packages/core/bundle/index.css
?? CLAUDE.md
```

預期 commit 結果：`4 files changed, 40 insertions(+), 3 deletions(-)`。

- [ ] **Step 8: 盤點要移除的 CSS 入口（唯讀）**

```sh
git grep -n -E "no-external|puck\.css|tceditor/dist/index\.css" -- . ':!apps/docs' ':!CHANGELOG.md' ':!docs/superpowers'
```

預期輸出：

```
packages/core/bundle/no-external.ts:1:import "./no-external.css";
packages/core/package.json:50:    "./puck.css": "./dist/index.css",
packages/core/package.json:51:    "./no-external.css": "./dist/no-external.css",
packages/core/package.json:68:    "build": "rm -rf dist && tsup bundle/index.ts bundle/rsc.tsx bundle/no-external.ts bundle/internal.ts",
```

除了入口本身與 `package.json`，workspace 中沒有任何地方 import `puck.css`、`no-external.css` 或 core 的 `dist/index.css`。`apps/docs` 仍在用舊的路徑，但它不在 workspace 中，只當參考。

- [ ] **Step 9: 寫「只匯出一個樣式表」的失敗測試**

`packages/core/__tests__/css-imports.spec.ts` 原始片段（檔案結尾）：

```ts
    expect(offenders).toEqual([]);
  });
});
```

替換為：

```ts
    expect(offenders).toEqual([]);
  });

  it("exports a single stylesheet, ./tceditor.css", () => {
    const { exports } = JSON.parse(
      fs.readFileSync(path.join(packageRoot, "package.json"), "utf8")
    );
    const cssExports = Object.keys(exports).filter((key) =>
      key.endsWith(".css")
    );

    expect(cssExports).toEqual(["./tceditor.css"]);
    expect(exports["./tceditor.css"]).toBe("./dist/index.css");
  });
});
```

- [ ] **Step 10: 執行測試，確認失敗**

```sh
(cd packages/core && pnpm test __tests__/css-imports.spec.ts) 2>&1 | grep -E "✓|✕|^  ●|^Tests:|^    [-+] |ELIFECYCLE"
```

預期輸出（毫秒數可能不同）：

```
    ✓ does not reference remote URLs (12 ms)
    ✕ exports a single stylesheet, ./tceditor.css (1 ms)
  ● package CSS › exports a single stylesheet, ./tceditor.css
    - Expected  - 1
    + Received  + 3
    -   "./tceditor.css",
    +   "./puck.css",
    +   "./no-external.css",
    +   "./dist/index.css",
Tests:       1 failed, 1 passed, 2 total
 ELIFECYCLE  Test failed. See above for more details.
```

- [ ] **Step 11: 改 exports 與 build script，刪除 `no-external` 入口**

`packages/core/package.json` 的 `exports`，原始片段：

```json
    "./puck.css": "./dist/index.css",
    "./no-external.css": "./dist/no-external.css",
    "./dist/index.css": "./dist/index.css",
```

替換為：

```json
    "./tceditor.css": "./dist/index.css",
```

同一個檔案的 `scripts.build`，原始（逐字）：

```json
    "build": "rm -rf dist && tsup bundle/index.ts bundle/rsc.tsx bundle/no-external.ts bundle/internal.ts",
```

替換為：

```json
    "build": "rm -rf dist && tsup bundle/index.ts bundle/rsc.tsx bundle/internal.ts",
```

刪除入口檔：

```sh
git rm -q packages/core/bundle/no-external.ts packages/core/bundle/no-external.css
```

- [ ] **Step 12: 執行測試，確認通過**

```sh
(cd packages/core && pnpm test __tests__/css-imports.spec.ts) 2>&1 | grep -E "✓|✕|^Tests:"
```

預期輸出（毫秒數可能不同）：

```
    ✓ does not reference remote URLs (12 ms)
    ✓ exports a single stylesheet, ./tceditor.css (1 ms)
Tests:       2 passed, 2 total
```

- [ ] **Step 13: 重新建置，確認入口與 export 的解析結果**

```sh
pnpm --filter @tzuchi/tceditor build 2>&1 | grep "Building entry"
ls packages/core/dist | grep -c no-external
(cd apps/demo && node -e '
const path = require("path");
for (const spec of ["@tzuchi/tceditor/tceditor.css", "@tzuchi/tceditor/puck.css", "@tzuchi/tceditor/no-external.css", "@tzuchi/tceditor/dist/index.css"]) {
  try {
    console.log(spec, "->", path.relative(path.resolve("../.."), require.resolve(spec)));
  } catch (error) {
    console.log(spec, "->", error.code);
  }
}')
```

預期輸出：

```
CLI Building entry: bundle/index.ts, bundle/internal.ts, bundle/rsc.tsx
0
@tzuchi/tceditor/tceditor.css -> packages/core/dist/index.css
@tzuchi/tceditor/puck.css -> ERR_PACKAGE_PATH_NOT_EXPORTED
@tzuchi/tceditor/no-external.css -> ERR_PACKAGE_PATH_NOT_EXPORTED
@tzuchi/tceditor/dist/index.css -> ERR_PACKAGE_PATH_NOT_EXPORTED
```

`grep -c` 輸出 `0`（exit code 1，屬正常），表示 `dist` 中已沒有 `no-external.*`。解析測試從 `apps/demo` 出發，走的是 demo 的 `node_modules/@tzuchi/tceditor` 連結，和使用端安裝後的情況相同。

- [ ] **Step 14: 更新 CHANGELOG 並 commit**

`CHANGELOG.md` 原始片段（Step 7 加入的那一行）：

```markdown
* stop loading the Inter font from rsms.me in the default stylesheet and in the demo; the editor uses Inter only when the host app provides it and otherwise falls back to the system font stack
```

替換為：

```markdown
* stop loading the Inter font from rsms.me in the default stylesheet and in the demo; the editor uses Inter only when the host app provides it and otherwise falls back to the system font stack
* export a single stylesheet, `@tzuchi/tceditor/tceditor.css`; the `puck.css`, `no-external.css` and `dist/index.css` exports and the `no-external` entry point are removed
```

```sh
git add packages/core/package.json packages/core/__tests__/css-imports.spec.ts CHANGELOG.md
git status --short
git commit -m "build: export a single tceditor.css stylesheet" -m "Without the remote font import, the no-external entry point is identical to the main one. Remove it and replace the puck.css, no-external.css and dist/index.css exports with ./tceditor.css."
```

`git status --short` 預期（commit 前）：

```
M  CHANGELOG.md
M  packages/core/__tests__/css-imports.spec.ts
D  packages/core/bundle/no-external.css
D  packages/core/bundle/no-external.ts
M  packages/core/package.json
?? CLAUDE.md
```

預期 commit 結果：`5 files changed, 15 insertions(+), 8 deletions(-)`。

- [ ] **Step 15: 盤點 F7 的依賴（唯讀）**

先確認四個要移除的套件確實沒有被 import，`classnames` 則有被使用。下面的迴圈只比對引號中的模組名稱（含子路徑），並排除各個 `package.json`：

```sh
for dep in deep-diff @types/deep-diff react-hotkeys-hook @dnd-kit/helpers classnames; do
  printf '%s:' "$dep"
  git grep -l -E "['\"]$dep(/[^'\"]*)?['\"]" -- packages apps/demo scripts ':!**/package.json' | sed 's/^/ /' | tr -d '\n'
  echo
done
grep -c "node_modules/.pnpm/classnames@" packages/core/dist/index.js
grep -c 'require("classnames")' packages/core/dist/index.js
```

預期輸出：

```
deep-diff:
@types/deep-diff:
react-hotkeys-hook:
@dnd-kit/helpers:
classnames: packages/core/lib/get-class-name-factory.ts
2
0
```

最後兩行說明：目前 `classnames` 沒有宣告，tsup 不會把它視為外部依賴，所以整份原始碼被打包進 `dist/index.js`，檔案中有 2 行帶著它的 pnpm 實體路徑，也沒有任何 `require("classnames")`。打包進去的版本，取決於 workspace 剛好 hoist 了哪一版（目前是 demo 依賴的 `classnames@2.5.1`）。第二個 `grep -c` 的 exit code 是 1，屬正常。

確認 lockfile 解析出的 `classnames` 版本：

```sh
grep -n -A2 "^      classnames:$" pnpm-lock.yaml
```

預期輸出：

```
35:      classnames:
36-        specifier: ^2.3.2
37-        version: 2.5.1
```

（`$` 只比對 importers 區的寫法，排除 snapshots 區的 `classnames: 2.5.1`。目前只有 `apps/demo` 這個 importer 宣告它，core 要宣告的版本範圍取 `^2.5.1`。）

- [ ] **Step 16: 修改 core 的依賴宣告**

`packages/core/package.json` 中做下列 4 處修改，每個原始片段在檔案中都只出現一次：

1. `devDependencies` 刪除這一行：

```json
    "@types/deep-diff": "^1.0.3",
```

2. `dependencies` 刪除這一行：

```json
    "@dnd-kit/helpers": "0.4.0",
```

3. `dependencies` 原始片段：

```json
    "@tiptap/react": "3.31.4",
    "deep-diff": "^1.0.2",
```

替換為（`classnames` 依字母順序剛好接在 `@tiptap/react` 之後，也就是原本 `deep-diff` 的位置）：

```json
    "@tiptap/react": "3.31.4",
    "classnames": "^2.5.1",
```

4. `dependencies` 刪除這一行：

```json
    "react-hotkeys-hook": "^4.6.1",
```

確認：

```sh
git diff packages/core/package.json
```

預期輸出：

```diff
diff --git a/packages/core/package.json b/packages/core/package.json
index 158add8f..e0dab7a7 100644
--- a/packages/core/package.json
+++ b/packages/core/package.json
@@ -78,7 +78,6 @@
     "@testing-library/dom": "^10.4.0",
     "@testing-library/jest-dom": "^6.6.3",
     "@testing-library/react": "^16.1.0",
-    "@types/deep-diff": "^1.0.3",
     "@types/flat": "^5.0.5",
     "@types/jest": "^29.5.14",
     "@types/object-hash": "^3.0.6",
@@ -106,7 +105,6 @@
     "@dnd-kit/abstract": "0.4.0",
     "@dnd-kit/dom": "0.4.0",
     "@dnd-kit/geometry": "0.4.0",
-    "@dnd-kit/helpers": "0.4.0",
     "@dnd-kit/react": "0.4.0",
     "@dnd-kit/state": "0.4.0",
     "@radix-ui/react-popover": "^1.1.15",
@@ -131,12 +129,11 @@
     "@tiptap/html": "3.31.4",
     "@tiptap/pm": "3.31.4",
     "@tiptap/react": "3.31.4",
-    "deep-diff": "^1.0.2",
+    "classnames": "^2.5.1",
     "fast-equals": "5.2.2",
     "flat": "^5.0.2",
     "happy-dom": "^20.0.10",
     "object-hash": "^3.0.0",
-    "react-hotkeys-hook": "^4.6.1",
     "use-debounce": "^9.0.4",
     "zustand": "^5.0.3"
   },
```

（`index` 行的 blob hash 可能不同。）

- [ ] **Step 17: 更新 lockfile**

```sh
pnpm install
git diff --numstat pnpm-lock.yaml
git diff -U0 pnpm-lock.yaml | grep -E '^\+ |^-  [^ ]'
```

`pnpm install` 的輸出中應有 `Packages: -4`，原本的 `WARN  deprecated deep-diff@1.0.2` 不再出現。`prepare` 會重新建置 core 與 plugin 的 `dist`。

`git diff` 預期輸出：

```
3	42	pnpm-lock.yaml
+      classnames:
+        specifier: ^2.5.1
+        version: 2.5.1
-  '@dnd-kit/helpers@0.4.0':
-  '@types/deep-diff@1.0.5':
-  deep-diff@1.0.2:
-  react-hotkeys-hook@4.6.2:
-  '@dnd-kit/helpers@0.4.0':
-  '@types/deep-diff@1.0.5': {}
-  deep-diff@1.0.2: {}
-  react-hotkeys-hook@4.6.2(react-dom@19.2.6(react@19.2.6))(react@19.2.6):
```

新增的 3 行是 core 這個 importer 的 `classnames`，解析為已經在 lockfile 中的 `2.5.1`，沒有下載新套件。被移除的四個套件，在 `packages:` 與 `snapshots:` 兩區各刪除一次。若出現其他版本變動，先停下來確認。

- [ ] **Step 18: 確認 `classnames` 改為外部依賴**

Step 17 的 `prepare` 已經重新建置 `dist`。

```sh
grep -c "node_modules/.pnpm/classnames@" packages/core/dist/index.js
grep -c 'require("classnames")' packages/core/dist/index.js
grep -c 'require("classnames")' packages/core/dist/rsc.js
grep -l 'from "classnames"' packages/core/dist/*.mjs | wc -l | tr -d ' '
```

預期輸出：

```
0
1
1
1
```

`classnames` 不再被打包進 `dist`。CJS 的 `index.js`、`rsc.js` 都改成 `require("classnames")`，ESM 則由一個共用 chunk `import … from "classnames"`，全部改從使用端安裝的 `classnames` 引入。第一個 `grep -c` 的 exit code 是 1，屬正常。

- [ ] **Step 19: 更新 CHANGELOG**

`CHANGELOG.md` 原始片段（Step 14 加入的那一行）：

```markdown
* export a single stylesheet, `@tzuchi/tceditor/tceditor.css`; the `puck.css`, `no-external.css` and `dist/index.css` exports and the `no-external` entry point are removed
```

替換為：

```markdown
* export a single stylesheet, `@tzuchi/tceditor/tceditor.css`; the `puck.css`, `no-external.css` and `dist/index.css` exports and the `no-external` entry point are removed
* remove the unused `deep-diff`, `@types/deep-diff`, `react-hotkeys-hook` and `@dnd-kit/helpers` dependencies, and declare `classnames`, which core imports but did not list
```

完成後，`CHANGELOG.md` 的開頭（到 `## [0.23.0]` 為止）應該與下列內容完全相同：

```markdown
# CHANGELOG

## tceditor 0.1.0 (unreleased)

tceditor is a fork of [Puck](https://github.com/puckeditor/puck) v0.23.0 (git tag `v0.23.0`, commit `b4204f09`), and its versions restart at 0.1.0. Everything from the `0.23.0` section down is Puck's upstream changelog, kept unchanged for reference.

### Changes from Puck v0.23.0

* rename the packages to `@tzuchi/tceditor` and `@tzuchi/tceditor-plugin-heading-analyzer` so they cannot be confused with Puck's npm packages, and mark both `private` because they are not published to a registry yet; public API names such as `<Puck>`, `usePuck` and `Config` are unchanged
* add a `NOTICE` file and ship `LICENSE` and `NOTICE` in both packages
* switch the monorepo from yarn 1 to pnpm and add `pnpm verify`
* remove the upstream recipes, `create-puck-app`, `field-contentful`, `plugin-emotion-cache`, the GitHub workflows and the npm release tooling
* remove the Plausible analytics from the demo
* upgrade the tiptap packages to 3.31.4 (GHSA-j95f-988m-3j2f, GHSA-cp6q-959q-f8rh, GHSA-c8x8-7fp4-3x9w)
* stop loading the Inter font from rsms.me in the default stylesheet and in the demo; the editor uses Inter only when the host app provides it and otherwise falls back to the system font stack
* export a single stylesheet, `@tzuchi/tceditor/tceditor.css`; the `puck.css`, `no-external.css` and `dist/index.css` exports and the `no-external` entry point are removed
* remove the unused `deep-diff`, `@types/deep-diff`, `react-hotkeys-hook` and `@dnd-kit/helpers` dependencies, and declare `classnames`, which core imports but did not list

## [0.23.0](/compare/v0.22.4...v0.23.0) (2026-08-07)
```

- [ ] **Step 20: 從乾淨狀態跑一次 `pnpm verify`**

```sh
rm -rf .turbo packages/core/dist packages/plugin-heading-analyzer/dist apps/demo/.next
pnpm verify > "${TMPDIR:-/tmp}/tceditor-verify-task03.log" 2>&1
echo "exit=$?"
grep -E "Test Suites:|Tests:|Snapshots:|ℹ (tests|pass|fail)|> tsc|✖|Tasks:|All matched|^pnpm audit:|^GATED|^audit:gate (passed|FAILED)" "${TMPDIR:-/tmp}/tceditor-verify-task03.log"
```

預期輸出：

```
exit=0
@tzuchi/tceditor:test: Test Suites: 52 passed, 52 total
@tzuchi/tceditor:test: Tests:       275 passed, 275 total
@tzuchi/tceditor:test: Snapshots:   19 passed, 19 total
 Tasks:    1 successful, 1 total
ℹ tests 10
ℹ pass 10
ℹ fail 0
> tsc -p tsconfig.typecheck.json
demo:lint: ✖ 8 problems (0 errors, 8 warnings)
@tzuchi/tceditor:lint: ✖ 4 problems (0 errors, 4 warnings)
 Tasks:    3 successful, 3 total
All matched files use Prettier code style!
 Tasks:    3 successful, 3 total
pnpm audit: 69 advisories, 71 finding path(s). 104 package versions ship with packages/core, packages/plugin-heading-analyzer.
GATED (ships with a published package): 0 finding(s)
audit:gate passed: no advisories affect packages/core, packages/plugin-heading-analyzer (71 finding path(s) elsewhere are listed above).
```

`104 package versions` 比 Task 2 少 2：少了 `deep-diff`、`react-hotkeys-hook`、`@dnd-kit/helpers`，多了 `classnames`。advisory 的總數會隨資料庫更新而改變；`exit=0`、`104 package versions`、`GATED … 0 finding(s)` 與 `audit:gate passed` 必須相同。

- [ ] **Step 21: 最後檢查建置結果與 lockfile**

```sh
grep -r -l "rsms.me" packages/core/dist apps/demo/.next/static || echo "no rsms.me in packages/core/dist or apps/demo/.next/static"
ls packages/core/dist | grep -c no-external
grep -c 'require("classnames")' packages/core/dist/index.js
git grep -n -E "no-external|puck\.css|rsms\.me" -- . ':!apps/docs' ':!CHANGELOG.md' ':!docs/superpowers'
echo "git grep exit=$?"
pnpm install --frozen-lockfile 2>&1 | grep -E "Lockfile is up to date|Already up to date"
```

預期輸出：

```
no rsms.me in packages/core/dist or apps/demo/.next/static
0
1
git grep exit=1
Lockfile is up to date, resolution step is skipped
Already up to date
```

- `apps/demo/.next/static` 是 Step 20 `pnpm verify` 中 `next build` 的產物。Step 4 之前，demo 建置出的 CSS chunk（`apps/demo/.next/static/chunks/*.css`）含有 `rsms.me` 的 `@import`（2026-10-09 實測），現在已經沒有，表示 demo 不會再向 rsms.me 發出請求。
- `git grep` 沒有任何輸出、exit code 是 1：除了刻意排除的 `apps/docs`、`CHANGELOG.md`、`docs/superpowers`，repo 中已沒有 `no-external`、`puck.css` 與 `rsms.me`。

- [ ] **Step 22: Commit**

```sh
git add packages/core/package.json pnpm-lock.yaml CHANGELOG.md
git status --short
git commit -m "build(deps): remove unused dependencies and declare classnames" -m "Core declared deep-diff, @types/deep-diff, react-hotkeys-hook and @dnd-kit/helpers but never imported them. It imports classnames without declaring it, so the build bundled whatever version the workspace hoisted. Declare classnames ^2.5.1, the version the lockfile already resolves, so it is installed with the package and covered by audit:gate."
git log --oneline -6
git status --short
```

`git status --short` 預期（commit 前）：

```
M  CHANGELOG.md
M  packages/core/package.json
M  pnpm-lock.yaml
?? CLAUDE.md
```

預期 commit 結果：`3 files changed, 5 insertions(+), 46 deletions(-)`。`git log`（hash 不同）：

```
<hash> build(deps): remove unused dependencies and declare classnames
<hash> build: export a single tceditor.css stylesheet
<hash> fix(css): stop loading the Inter font from rsms.me
<hash> docs: start the tceditor changelog
<hash> build: ship LICENSE and NOTICE with the published packages
<hash> build: rename packages to @tzuchi/tceditor
```

commit 後 `git status --short` 只剩 `?? CLAUDE.md`。

### Task 4: 移植上游修正

目的：用 `git cherry-pick -x` 把上游三個 bug 修正移植進來（規格 §5），`-x` 會在 commit 訊息尾端自動加上 `(cherry picked from commit …)` 記錄來源。接著依 Task 2/3 建立的慣例，在 `CHANGELOG.md` 的 `### Changes from Puck v0.23.0` 清單加一行。共 4 個 commit（3 個 cherry-pick 加 1 個 CHANGELOG），不寫新程式碼。

**執行位置**：主工作目錄 `/Users/kaellim/Desktop/projects/puck`，分支 `tzuchi/main`，接在 Task 3 的最後一個 commit（`build(deps): remove unused dependencies and declare classnames`）之後。三個 cherry-pick 已在 Task 3 的結果上實際驗證過，全部乾淨套用，沒有衝突，也不含任何 `@puckeditor` 舊名稱（三者只動 `use-hotkey`、AutoFrame、DraggableComponent、Puck Layout/Preview、InlineTextField CSS 與測試，皆為相對路徑 import）。

**注意**：
- 保留原作者（Author）；committer 會是執行者本人，這是預期行為。因為作者與 committer 不同，`git cherry-pick` 的輸出會多兩行 ` Author: …` 與 ` Date: …`（原作者與原 commit 時間）。
- cherry-pick 會沿用原 commit 訊息（`fix: …`，已符合 conventional commits），不要改寫，也不要用 `--no-commit` 合併成一個 commit。
- 若某個 cherry-pick 在你的環境出現衝突（基準與驗證時不同）：執行 `git status` 確認衝突檔案，對照 `git show <hash>` 的 diff 手動套用同樣的修改，`git add <檔案>`，`git cherry-pick --continue`；仍保留 `-x` 的來源記錄（`--continue` 不會移除）。若衝突無法簡單解決，`git cherry-pick --abort` 後回報，不要硬改。
- commit 時一律明確列出路徑，不要用 `git add -A`，因為根目錄有未追蹤、不屬於本 task 的 `CLAUDE.md`。

**Files:**
- Create:
  - `packages/core/lib/__tests__/use-hotkey.spec.tsx`（隨 6a396a5d 帶入）
- Modify:
  - `packages/core/lib/use-hotkey.ts`
  - `packages/core/components/AutoFrame/index.tsx`
  - `packages/core/components/DraggableComponent/index.tsx`
  - `packages/core/components/Puck/components/Layout/index.tsx`
  - `packages/core/components/Puck/components/Preview/index.tsx`
  - `packages/core/components/InlineTextField/styles.module.css`
  - `CHANGELOG.md`（Step 9）
- Test:
  - `packages/core/lib/__tests__/use-hotkey.spec.tsx`（新增，6 個測試）
  - `packages/core/components/Puck/__tests__/index.tsx`（新增 2 個測試）

**Interfaces:**
- Consumes：
  - Task 2 之後的套件名稱 `@tzuchi/tceditor`（測試以相對路徑 import，不受影響）。
  - Task 1 的 `pnpm verify`。
  - Task 3 Step 19 之後 `CHANGELOG.md` 清單的最後一行：`` * remove the unused `deep-diff`, `@types/deep-diff`, `react-hotkeys-hook` and `@dnd-kit/helpers` dependencies, and declare `classnames`, which core imports but did not list ``。
- Produces：
  - `packages/core/lib/use-hotkey.ts` 新增 export `useHotkeyStore`（測試用來重置狀態；不在 `bundle/core.ts`，也不會出現在 `dist` 的 `.d.ts`，不是公開 API）。
  - `CHANGELOG.md` 清單的最後一行變成 Step 9 加入的 `* port three fixes from upstream Puck: …`。後續 task 若要在清單加一行，以這一行作為原始片段。

- [ ] **Step 1: 確認起點**

```bash
cd /Users/kaellim/Desktop/projects/puck
git branch --show-current
git status --short
git log --oneline -1
```

預期輸出（hash 在你的環境會不同）：

```
tzuchi/main
?? CLAUDE.md
<hash> build(deps): remove unused dependencies and declare classnames
```

三項任何一項不符就停下來：分支不是 `tzuchi/main`、有 `?? CLAUDE.md` 以外的變更，或最新 commit 不是 Task 3 的最後一個 commit。

- [ ] **Step 2: 套用 6a396a5d（卡住的修飾鍵不誤觸快捷鍵）**

```bash
git cherry-pick -x 6a396a5d
```

預期輸出（hash 在你的環境會不同）：

```
[tzuchi/main <hash>] fix: don't trigger hotkeys from stuck modifier keys after switching windows
 Author: Federico Jorge Bonel Tozzi <bonelfederico@gmail.com>
 Date: Thu Aug 13 16:06:05 2026 +0900
 2 files changed, 150 insertions(+), 1 deletion(-)
 create mode 100644 packages/core/lib/__tests__/use-hotkey.spec.tsx
```

沒有 `CONFLICT`。若第一行是 `[detached HEAD <hash>]` 而不是 `[tzuchi/main <hash>]`，表示目前不在 `tzuchi/main` 上：停下來回報，不要繼續後續步驟。

- [ ] **Step 3: 執行受影響的測試**

```bash
cd packages/core
pnpm test lib/__tests__/use-hotkey.spec.tsx
```

預期（括號內的毫秒數會不同）：

```
PASS lib/__tests__/use-hotkey.spec.tsx
  monitorHotkeys
    ✓ reports modifier state on jsdom KeyboardEvents
    ✓ triggers a meta combo when both keys are held
    ✓ triggers a ctrl combo when both keys are held (Windows)
    ✓ does not fire a meta combo when 'i' is pressed alone after meta was left stuck
    ✓ does not fire a ctrl combo when 'i' is pressed alone after ctrl was left stuck
    ✓ fires a meta combo when the modifier is genuinely still held after returning to the window

Test Suites: 1 passed, 1 total
Tests:       6 passed, 6 total
Snapshots:   0 total
```

- [ ] **Step 4: 反向驗證新測試確實能抓到這個 bug，然後還原**

修正前的 `lib/use-hotkey.ts` 沒有 export `useHotkeyStore`，而新測試用它重置狀態。直接換回舊檔，測試會在 `beforeEach` 就因 `TypeError` 全部失敗，無法證明測試抓得到行為上的錯誤。所以先用 `sed` 在舊檔補上 `export`，讓測試跑到行為斷言。仍在 `packages/core` 下執行：

```bash
git show HEAD~1:packages/core/lib/use-hotkey.ts | sed 's/^const useHotkeyStore = create/export const useHotkeyStore = create/' > lib/use-hotkey.ts
git diff --stat
pnpm test lib/__tests__/use-hotkey.spec.tsx
```

`git diff --stat` 預期：

```
 packages/core/lib/use-hotkey.ts | 30 ------------------------------
 1 file changed, 30 deletions(-)
```

也就是說，修正版與「舊檔加上 export」只差修正本身的 30 行。

`pnpm test` 預期失敗（exit code 非 0，最後有 `ELIFECYCLE  Test failed.`）。重點輸出如下；實際輸出在每個失敗訊息後還有 `1: {"isTrusted": false}`（第 1、2 個）與原始碼片段、stack trace，這裡省略：

```
FAIL lib/__tests__/use-hotkey.spec.tsx
  monitorHotkeys
    ✓ reports modifier state on jsdom KeyboardEvents
    ✓ triggers a meta combo when both keys are held
    ✓ triggers a ctrl combo when both keys are held (Windows)
    ✕ does not fire a meta combo when 'i' is pressed alone after meta was left stuck
    ✕ does not fire a ctrl combo when 'i' is pressed alone after ctrl was left stuck
    ✕ fires a meta combo when the modifier is genuinely still held after returning to the window

  ● monitorHotkeys › does not fire a meta combo when 'i' is pressed alone after meta was left stuck

    expect(jest.fn()).not.toHaveBeenCalled()

    Expected number of calls: 0
    Received number of calls: 1

  ● monitorHotkeys › does not fire a ctrl combo when 'i' is pressed alone after ctrl was left stuck

    expect(jest.fn()).not.toHaveBeenCalled()

    Expected number of calls: 0
    Received number of calls: 1

  ● monitorHotkeys › fires a meta combo when the modifier is genuinely still held after returning to the window

    expect(jest.fn()).toHaveBeenCalledTimes(expected)

    Expected number of calls: 1
    Received number of calls: 0

Test Suites: 1 failed, 1 total
Tests:       3 failed, 3 passed, 6 total
```

前兩個失敗是 bug 本身（修飾鍵卡住後單按 `i` 誤觸快捷鍵），第三個是修正必須保留的行為（回到視窗時修飾鍵仍按著，快捷鍵要能觸發）。結果若不同（例如 6 個全部失敗並出現 `TypeError`），表示 `sed` 沒有替換成功，先檢查 `git diff` 再重跑。

確認後還原：

```bash
git checkout -- lib/use-hotkey.ts
git status --short
```

`git status --short` 預期只有一行（路徑相對於 `packages/core`）：

```
?? ../../CLAUDE.md
```

若還看到 `M lib/use-hotkey.ts`，表示還原沒有成功，重做 `git checkout -- lib/use-hotkey.ts`。

- [ ] **Step 5: 套用 90665dfb（Chrome 翻譯造成當機）**

```bash
cd /Users/kaellim/Desktop/projects/puck
git cherry-pick -x 90665dfb
```

預期輸出（hash 在你的環境會不同）：

```
[tzuchi/main <hash>] fix: Chrome translate causes crash
 Author: Xavier Mirabelli-Montan <xavier@whiteskyweb.com>
 Date: Thu Sep 17 09:48:03 2026 +0100
 5 files changed, 48 insertions(+), 5 deletions(-)
```

沒有 `CONFLICT`。

- [ ] **Step 6: 執行受影響的測試**

```bash
cd packages/core
pnpm test components/Puck/__tests__/index.tsx
```

預期（括號內的毫秒數會不同）：

```
PASS components/Puck/__tests__/index.tsx
  Puck
    ✓ root renders
    ✓ should generate the correct state on mount
    ✓ creates a new store every time it is mounted
    ✓ applies min-content height to a plugin selected on mount
    ✓ should index slots on mount
    ✓ injects the default ui styles once per document
    ✓ marks puck-owned styles as non-mirrorable
    ✓ injects iframe interaction styles into a target document
    ✓ exposes the preview mode on the canvas entry element
    ✓ marks the canvas entry as non-translatable so browser translation can't break drag-and-drop
    ✓ marks the editor chrome root as non-translatable so browser translation can't break chrome re-renders

Test Suites: 1 passed, 1 total
Tests:       11 passed, 11 total
Snapshots:   2 passed, 2 total
```

最後兩個是這個 commit 新增的測試。Snapshots 仍為 2 個且通過，表示 `translate="no"` 與 `notranslate` 沒有改到既有 snapshot。

- [ ] **Step 7: 套用 9e917a39（inline text hover 版面位移，純 CSS）**

```bash
cd /Users/kaellim/Desktop/projects/puck
git cherry-pick -x 9e917a39
```

預期輸出（hash 在你的環境會不同）：

```
[tzuchi/main <hash>] fix: prevent inline text fields from shifting layout on hover
 Author: Federico Jorge Bonel Tozzi <bonelfederico@gmail.com>
 Date: Mon Aug 17 10:31:51 2026 +0900
 1 file changed, 4 insertions(+)
```

沒有 `CONFLICT`。這個 commit 沒有測試（jsdom 無法驗證 CSS 版面），改在 Step 10 的 build 後確認輸出。

- [ ] **Step 8: 確認三個 commit 與來源記錄**

```bash
git log -3 --format='%h %an | %s'
git log -3 --format=%B | grep "cherry picked"
```

預期（hash 在你的環境會不同，作者與標題相同；來源 hash 需完全一致）：

```
<hash> Federico Jorge Bonel Tozzi | fix: prevent inline text fields from shifting layout on hover
<hash> Xavier Mirabelli-Montan | fix: Chrome translate causes crash
<hash> Federico Jorge Bonel Tozzi | fix: don't trigger hotkeys from stuck modifier keys after switching windows
(cherry picked from commit 9e917a398afa982b18101566303134830b25e7ab)
(cherry picked from commit 90665dfbe201398fe9fbe54cfac31e3d08391b90)
(cherry picked from commit 6a396a5dfd8e7a0c26f1a00f49a8d69a4b493e63)
```

- [ ] **Step 9: 在 CHANGELOG 記錄這三項修正並 commit**

cherry-pick 不會更新 `CHANGELOG.md`，所以依 Task 2/3 的慣例手動加一行。

`CHANGELOG.md` 原始片段（`### Changes from Puck v0.23.0` 清單的最後一行，Task 3 Step 19 加入）：

```markdown
* remove the unused `deep-diff`, `@types/deep-diff`, `react-hotkeys-hook` and `@dnd-kit/helpers` dependencies, and declare `classnames`, which core imports but did not list
```

替換為（原行不變，下方新增一行）：

```markdown
* remove the unused `deep-diff`, `@types/deep-diff`, `react-hotkeys-hook` and `@dnd-kit/helpers` dependencies, and declare `classnames`, which core imports but did not list
* port three fixes from upstream Puck: hotkeys no longer fire from a modifier key left stuck after switching windows ([6a396a5](https://github.com/puckeditor/puck/commit/6a396a5dfd8e7a0c26f1a00f49a8d69a4b493e63)), browser translation no longer crashes the editor ([90665df](https://github.com/puckeditor/puck/commit/90665dfbe201398fe9fbe54cfac31e3d08391b90)), and inline text fields no longer shift the layout on hover ([9e917a3](https://github.com/puckeditor/puck/commit/9e917a398afa982b18101566303134830b25e7ab))
```

確認變更範圍：

```bash
git diff --numstat CHANGELOG.md
git diff -U0 CHANGELOG.md | grep -E '^[-+][^-+]' | cut -c1-39
```

預期：

```
1	0	CHANGELOG.md
+* port three fixes from upstream Puck:
```

只新增一行、沒有刪除任何一行。`CHANGELOG.md` 在 `.prettierignore` 中，不受 `format:check` 檢查。

Commit：

```bash
git add CHANGELOG.md
git status --short
git commit -m "docs: record the ported upstream fixes in the changelog"
```

`git status --short` 預期：

```
M  CHANGELOG.md
?? CLAUDE.md
```

`git commit` 預期（hash 在你的環境會不同）：

```
[tzuchi/main <hash>] docs: record the ported upstream fixes in the changelog
 1 file changed, 1 insertion(+)
```

- [ ] **Step 10: 完整驗證**

```bash
cd /Users/kaellim/Desktop/projects/puck
pnpm verify > "${TMPDIR:-/tmp}/tceditor-verify-task04.log" 2>&1
echo "exit=$?"
grep -E "Test Suites:|Tests:|Snapshots:|ℹ (tests|pass|fail)|> tsc|✖|Tasks:|All matched|^pnpm audit:|^GATED|^audit:gate (passed|FAILED)" "${TMPDIR:-/tmp}/tceditor-verify-task04.log"
```

預期輸出：

```
exit=0
@tzuchi/tceditor:test: Test Suites: 53 passed, 53 total
@tzuchi/tceditor:test: Tests:       283 passed, 283 total
@tzuchi/tceditor:test: Snapshots:   19 passed, 19 total
 Tasks:    1 successful, 1 total
ℹ tests 10
ℹ pass 10
ℹ fail 0
> tsc -p tsconfig.typecheck.json
demo:lint: ✖ 8 problems (0 errors, 8 warnings)
@tzuchi/tceditor:lint: ✖ 4 problems (0 errors, 4 warnings)
 Tasks:    3 successful, 3 total
All matched files use Prettier code style!
 Tasks:    3 successful, 3 total
pnpm audit: 69 advisories, 71 finding path(s). 104 package versions ship with packages/core, packages/plugin-heading-analyzer.
GATED (ships with a published package): 0 finding(s)
audit:gate passed: no advisories affect packages/core, packages/plugin-heading-analyzer (71 finding path(s) elsewhere are listed above).
```

與 Task 3 Step 20 相比，jest 多了 1 個 suite（`use-hotkey.spec.tsx`）與 8 個測試（6 + 2），從 52 個 suite、275 個測試變成 53 個 suite、283 個測試；snapshot 數不變。advisory 的總數會隨資料庫更新而改變；`exit=0`、`104 package versions`、`GATED … 0 finding(s)` 與 `audit:gate passed` 必須相同。

build 完成後確認 CSS 修正有進入輸出：

```bash
grep -c "overflow-wrap:inherit\|overflow-wrap: inherit" packages/core/dist/index.css
```

預期輸出 `1`（大於 0 即可）。

- [ ] **Step 11: 確認 commit 與工作目錄**

```bash
git log --oneline -5
git status --short
```

預期（hash 在你的環境會不同）：

```
<hash> docs: record the ported upstream fixes in the changelog
<hash> fix: prevent inline text fields from shifting layout on hover
<hash> fix: Chrome translate causes crash
<hash> fix: don't trigger hotkeys from stuck modifier keys after switching windows
<hash> build(deps): remove unused dependencies and declare classnames
?? CLAUDE.md
```

本 task 的 4 個 commit 都已完成，不需要另外 commit。`dist/`、`node_modules/` 與 `.turbo/` 已被 gitignore，不會出現在 `git status`。

### Task 5: richtext 核心模組

目的：建立 `packages/core/lib/richtext/`，作為 richtext 唯一的「正規化＋渲染」實作（規格 §6 F1、F2）。`normalizeRichText` 把任何輸入（tiptap JSON、舊的 HTML 字串、竄改過的資料）變成只含 PuckRichText 預設 schema 的文件；`renderRichText` 把它交給 `@tiptap/static-renderer` 的 `json/react` 轉成 React 元素；`RichTextContent` 是外層加上 `.RichTextEditor` / `.rich-text` class 的元件。本 task 只建立模組與測試，還沒有任何畫面使用它（Task 6 接線），所以既有行為完全不變。

這同時是規格 §9 第 2 項的 spike：
- **API 等價**：Step 10–11 的一致性測試以 tiptap `generateHTML` 為 oracle，逐一比對各種典型內容的 DOM，全部相同。
- **打包增量**：Task 6 Step 2 與 Step 13 量測，主入口的公開頁初始 chunk 只增加約 2 KB gzip（目標 ≤ 10 KB）。
- **不需要 DOM**：渲染器只 import React；Task 6 的 `<Render>` 測試在 happy-dom 與 `@tiptap/html` 被禁止載入的情況下通過，Task 8 的 `check:bundle` 確認主入口與 RSC 入口不會帶到它們。

結論：採用 `@tiptap/static-renderer`，不需要自建渲染器。

**執行位置**：主工作目錄 `/Users/kaellim/Desktop/projects/puck`，分支 `tzuchi/main`，接在 Task 4 的最後一個 commit（`docs: record the ported upstream fixes in the changelog`）之後。指令一律在 repo 根目錄執行，需要進入 `packages/core` 時用 `( cd … && … )` 子 shell，執行完仍回到根目錄。

**設計重點（實作時不要「簡化」掉）**：
- `normalizeRichText` 的輸出刻意與 `editor.getJSON()` 的格式一致：補齊 tiptap 的預設屬性（例如 link 的 `target: "_blank"`、`rel: "noopener noreferrer nofollow"`），marks 依 schema 順序排序並去重（順序為 `link, bold, code, italic, strike, underline`，link 的 priority 是 1000）。因此對編輯器產生的合法內容，`normalizeRichText` 是恆等函式（測試 `returns … unchanged` 驗證）。Task 7 的編輯器同步依賴這個性質。
- 結構也一併正規化：段落／標題裡只能有 `text` 與 `hardBreak`；`doc`、`blockquote`、`listItem` 裡只能有區塊；清單裡只能有 `listItem`；`codeBlock` 裡只有無 mark 的文字。不合的節點（包含未知節點、型別不是字串、`constructor`/`__proto__` 等）都只保留文字，放回合法的位置。
- link 的 `class` 一律清成 `null`：若允許任意 class，竄改的資料就能借用宿主頁面（例如 Tailwind）的 `fixed inset-0` 之類的 class 覆蓋版面，與 `textAlign` CSS 注入是同一類問題。這是本 fork 刻意的差異；編輯器預設產生的 link 本來就是 `class: null`。
- link 的 `rel` 會去掉 `opener` 這個連結類型（`linkRel`）：竄改的資料若寫 `target: "_blank"` 加 `rel: "opener"`，新分頁就能經由 `window.opener` 把原頁面導到釣魚網址（reverse tabnabbing）。其餘類型（`noopener`、`noreferrer`、`nofollow` 等）只描述連結，照樣保留；去掉後沒有剩下任何類型時 `rel` 為 `null`，瀏覽器對 `target="_blank"` 預設就是 noopener。編輯器預設的 `noopener noreferrer nofollow` 不受影響，所以「對編輯器輸出是恆等函式」仍然成立。這一條由全域審查補上（計畫開頭 Review Focus 第 4 項）。
- 深度：根節點 `doc` 為第 0 層，深度超過 `RICHTEXT_MAX_DEPTH`（100）的節點只輸出文字。文字擷取 `extractText` 用明確的 stack，不遞迴，所以任何深度都不會 stack overflow。也用 ancestors 集合擋掉循環參照。
- `renderRichText` 在交給 static-renderer 前，先把行內節點的 marks 依 ProseMirror `DOMSerializer` 的規則提升為 `markGroup` 節點：相鄰節點共有的 marks 保持開啟，所以 `**a _b_**` 輸出 `<strong>a <em>b</em></strong>`，與 tiptap 相同（static-renderer 本身會把每個 text 各自包一層，DOM 就不同了）。
- static-renderer 用 `nodeMapping[type]` 查表，所以兩個 mapping 都是 `Object.create(null)` 的物件；normalize 已保證 `type` 是字串。`unhandledNode` 只輸出文字、`unhandledMark` 只輸出 children，正規化後理論上不會用到。
- `renderRichText` 每次呼叫都建立新的 renderer：static-renderer 的 React key 是 renderer 內的遞增計數器，共用一個 renderer 會讓 key 每次 render 都不同，React 就會整棵重新掛載。
- core 的 `tsconfig` 是 `"moduleResolution": "node"`，看不到套件 `exports` 裡的子路徑，所以 `@tiptap/static-renderer/json/react` 要在 `paths` 指到型別檔。路徑**不寫副檔名**：TypeScript 會找到 `index.d.ts`，而會讀 `paths` 的打包工具（Task 6 的 Next.js demo）會找到 `index.js`。若寫成 `index.d.ts`，Next 會把它當成執行期模組，`renderJSONContentToReactElement` 變成 `undefined`。
- core 的 TypeScript `lib` 是 `ES2015`，`Object.hasOwn` 會 typecheck 失敗（TS2550），所以查表用 `Set` 與 `switch`，Task 8 用 `Object.prototype.hasOwnProperty.call`。測試檔與 `__helpers__` 不在 typecheck 範圍內。

**Files:**
- Create:
  - `packages/core/lib/richtext/types.ts`
  - `packages/core/lib/richtext/is-safe-href.ts`
  - `packages/core/lib/richtext/text-to-richtext.ts`
  - `packages/core/lib/richtext/normalize.ts`
  - `packages/core/lib/richtext/render.tsx`
  - `packages/core/lib/richtext/index.ts`
  - `packages/core/components/RichTextEditor/components/RichTextContent.tsx`
  - `packages/core/lib/richtext/__helpers__/fixtures.ts`、`packages/core/lib/richtext/__helpers__/dom.ts`、`packages/core/lib/richtext/__helpers__/xss-payloads.ts`（測試共用；`__helpers__` 不會被 jest 當成測試，也不在 typecheck 範圍）
- Modify:
  - `packages/core/package.json`、`pnpm-lock.yaml`（新增依賴）
  - `packages/core/tsconfig.json`（`paths`）
- Test（新增）:
  - `packages/core/lib/richtext/__tests__/is-safe-href.spec.ts`
  - `packages/core/lib/richtext/__tests__/text-to-richtext.spec.ts`
  - `packages/core/lib/richtext/__tests__/normalize.spec.ts`
  - `packages/core/lib/richtext/__tests__/render.spec.tsx`（一致性、F2 深度、RichTextContent）
  - `packages/core/lib/richtext/__tests__/xss.spec.tsx`（XSS 回歸）

**Interfaces:**
- Consumes：
  - Task 1 的 `pnpm verify`、`packages/core/tsconfig.typecheck.json`（extends `tsconfig.json`，所以 `paths` 會一起生效）。
  - Task 1 已把 tiptap 全部釘在 `3.31.4`。
  - `packages/core/components/RichTextEditor/extension.ts` 的 `PuckRichText`（只在測試中當 oracle）。
- Produces（Task 6–9 與 S2–S4 依賴）：
  - `lib/richtext/types.ts`：`export type RichTextMark = { type: string; attrs?: Record<string, unknown> }`；`export type RichTextNode = { type: string; attrs?: Record<string, unknown>; content?: RichTextNode[]; marks?: RichTextMark[]; text?: string }`；`export type RichTextDoc = RichTextNode & { type: "doc" }`。
  - `lib/richtext/is-safe-href.ts`：`export function isSafeHref(href: unknown): href is string`。
  - `lib/richtext/normalize.ts`：`export const RICHTEXT_MAX_DEPTH = 100`；`export function normalizeRichText(value: unknown, options?: { maxDepth?: number }): RichTextDoc`；內部共用（不進 barrel）：`export function extractText(value: unknown): string`、`export const isTextAlign: (value: unknown) => value is string`。
  - `lib/richtext/text-to-richtext.ts`：`export function textToRichText(text: string): RichTextDoc`（單一段落；空字串回傳 `{ type: "doc", content: [] }`；不拆行、不解析 HTML）。
  - `lib/richtext/render.tsx`：`export function renderRichText(value: unknown): ReactNode`；測試用：`export const nodeMapping`、`export const markMapping`（皆無 prototype）。
  - `lib/richtext/index.ts`（barrel）：`RichTextDoc`、`RichTextMark`、`RichTextNode`、`isSafeHref`、`normalizeRichText`、`RICHTEXT_MAX_DEPTH`、`textToRichText`、`renderRichText`。
  - `components/RichTextEditor/components/RichTextContent.tsx`：`export function RichTextContent({ content }: { content: unknown })`，輸出 `<div className={getClassName()}><div className="rich-text">…</div></div>`，不使用 hooks。
  - 測試輔助：`lib/richtext/__helpers__/fixtures.ts`（`doc`、`typicalContent`、`allTypicalContent`、`deepBlockquotes`）、`lib/richtext/__helpers__/dom.ts`（`tiptapHtml`、`canonicalize`、`parseHtml`、`isSameDom`），Task 7、Task 8 的測試會用到；`lib/richtext/__helpers__/xss-payloads.ts`（`expectSafe(root: ParentNode)`、`linkDoc`、`tamperedJson`、`legacyHtml`、`xssPayloads: [string, unknown][]`），Task 6 的 `<Render>` 測試與 Task 7 的 `EditorFallback` 測試會用同一組 payload。
  - `packages/core/tsconfig.json` 的 `compilerOptions.paths`（Task 8 再加一筆）。

- [ ] **Step 1: 確認起點**

```bash
cd /Users/kaellim/Desktop/projects/puck
git branch --show-current
git status --short
git log --oneline -1
```

預期輸出（hash 在你的環境會不同）：

```
tzuchi/main
?? CLAUDE.md
<hash> docs: record the ported upstream fixes in the changelog
```

三項任何一項不符就停下來回報。

- [ ] **Step 2: 加入 `@tiptap/static-renderer`，版本與 lockfile 的 `@tiptap/core` 相同**

```bash
grep -E "^  '@tiptap/core@[0-9.]+':" pnpm-lock.yaml
pnpm --filter @tzuchi/tceditor add --save-exact @tiptap/static-renderer@3.31.4 > "${TMPDIR:-/tmp}/tceditor-add-static-renderer.log" 2>&1; echo "exit=$?"
grep -E "^  '@tiptap/(core|static-renderer)@[0-9.]+':" pnpm-lock.yaml
grep -E '"@tiptap/(core|static-renderer)"' packages/core/package.json
git diff --stat
```

預期輸出：

```
  '@tiptap/core@3.31.4':
exit=0
  '@tiptap/core@3.31.4':
  '@tiptap/static-renderer@3.31.4':
    "@tiptap/core": "3.31.4",
    "@tiptap/static-renderer": "3.31.4",
 packages/core/package.json |  1 +
 pnpm-lock.yaml             | 24 +++++++++++++++++++++---
 2 files changed, 22 insertions(+), 3 deletions(-)
```

第一行是加入前 lockfile 解析出的 `@tiptap/core` 版本；`@tiptap/static-renderer` 必須是同一個版本（它的 `peerDependencies` 精確要求同版本的 `@tiptap/core` 與 `@tiptap/pm`）。若第一行不是 `3.31.4`，把指令中的 `3.31.4` 換成該版本再執行，並停下來回報（之後的預期輸出都以 3.31.4 為準）。

`pnpm-lock.yaml` 除了新增 `@tiptap/static-renderer` 的三段，還會把 `eslint-plugin-import` 的 peer 字串簡化成 `eslint-import-resolver-typescript@3.10.1`（pnpm 重新計算 peer 後的正常結果，3 行），所以是 21 行新增、3 行刪除。安裝時會照常重建 core 與外掛（`prepare`），log 在 `$TMPDIR/tceditor-add-static-renderer.log`。

Commit：

```bash
git add packages/core/package.json pnpm-lock.yaml
git commit -m "build(deps): add @tiptap/static-renderer 3.31.4" -m "The shared richtext renderer uses its json/react renderer. It is pinned to the @tiptap/core version in the lockfile because its peerDependencies require the exact same version."
```

預期（hash 會不同）：

```
[tzuchi/main <hash>] build(deps): add @tiptap/static-renderer 3.31.4
 2 files changed, 22 insertions(+), 3 deletions(-)
```

- [ ] **Step 3: 寫 `isSafeHref` 的失敗測試（並建立型別檔）**

建立 `packages/core/lib/richtext/types.ts`：

```ts
/**
 * Rich text is stored as Tiptap (ProseMirror) JSON. These types describe the
 * shape only; use normalizeRichText to turn untrusted input into a document
 * that contains nothing but the supported nodes, marks and attributes.
 */
export type RichTextMark = {
  type: string;
  attrs?: Record<string, unknown>;
};

export type RichTextNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: RichTextNode[];
  marks?: RichTextMark[];
  text?: string;
};

export type RichTextDoc = RichTextNode & { type: "doc" };
```

建立 `packages/core/lib/richtext/__tests__/is-safe-href.spec.ts`：

```ts
import { isSafeHref } from "../is-safe-href";

describe("isSafeHref", () => {
  it.each([
    "https://example.com",
    "http://example.com/path?q=1&page=2#top",
    "HTTPS://EXAMPLE.COM",
    "mailto:someone@example.com",
    "tel:+886-2-1234-5678",
    "/relative/path",
    "relative/path",
    "./page",
    "../page",
    "#section",
    "?query=1",
    "//cdn.example.com/file",
    "/path/with:colon",
  ])("allows %j", (href) => {
    expect(isSafeHref(href)).toBe(true);
  });

  it.each([
    "javascript:alert(1)",
    "JAVASCRIPT:alert(1)",
    "JaVaScRiPt:alert(1)",
    " javascript:alert(1)",
    "\tjavascript:alert(1)",
    "\u0001javascript:alert(1)",
    "java\tscript:alert(1)",
    "java\nscript:alert(1)",
    "java script:alert(1)",
    "​javascript:alert(1)",
    "&#106;avascript:alert(1)",
    "&#x6A;avascript:alert(1)",
    "&#106avascript:alert(1)",
    "javascript&colon;alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "DATA:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==",
    "vbscript:msgbox(1)",
    "file:///etc/passwd",
    "ftp://example.com",
    "",
    "   ",
  ])("rejects %j", (href) => {
    expect(isSafeHref(href)).toBe(false);
  });

  it.each([undefined, null, 1, {}, [], true])(
    "rejects non-strings (%p)",
    (href) => {
      expect(isSafeHref(href)).toBe(false);
    }
  );
});
```

```bash
(cd packages/core && pnpm test lib/richtext/__tests__/is-safe-href.spec.ts) 2>&1 | grep -E "^(PASS|FAIL)|Cannot find module|^Tests:"
```

預期失敗：

```
FAIL lib/richtext/__tests__/is-safe-href.spec.ts
    Cannot find module '../is-safe-href' from 'lib/richtext/__tests__/is-safe-href.spec.ts'
Tests:       0 total
```

- [ ] **Step 4: 實作 `isSafeHref`**

規則：只允許 `http`、`https`、`mailto`、`tel` 與相對路徑。先 `trim()`；含 C0/C1 控制字元或 HTML 字元參照（`&#…`、`&name;`）一律拒絕；scheme 判斷前再去掉所有空白，所以 `java script:`、`\tjavascript:` 都會被當成 `javascript:`。第一個 `:` 若出現在任何 `/`、`?`、`#` 之前就視為 scheme，必須在允許清單內（不分大小寫），因此 `&#106;avascript:`、`\u200Bjavascript:` 這類變形也會被拒絕。副作用：查詢字串裡若有 `&amp;` 之類的字元參照也會被拒絕，這是可接受的誤判。

建立 `packages/core/lib/richtext/is-safe-href.ts`：

```ts
const ALLOWED_SCHEMES = ["http", "https", "mailto", "tel"];

// C0 controls, DEL and C1 controls. Browsers drop some of these while parsing
// a URL, so "java\tscript:" would still run as javascript:.
const CONTROL_CHARACTERS = /[\u0000-\u001F\u007F-\u009F]/;

// Numeric (&#106; &#x6A; &#106) and named (&colon;) character references.
// React escapes "&", so they never decode in our own output, but they would in
// any other HTML serializer that receives this value.
const CHARACTER_REFERENCE = /&(#|[a-z][a-z0-9]*;)/i;

// Everything before the first ":" that comes before any "/", "?" or "#".
const SCHEME = /^([^/?#]*):/;

/**
 * Returns true for http, https, mailto and tel URLs and for relative URLs.
 * Anything else, including javascript:, data: and vbscript: in any spelling,
 * returns false.
 */
export function isSafeHref(href: unknown): href is string {
  if (typeof href !== "string") return false;

  const trimmed = href.trim();

  if (trimmed === "") return false;

  if (CONTROL_CHARACTERS.test(trimmed) || CHARACTER_REFERENCE.test(trimmed)) {
    return false;
  }

  const scheme = SCHEME.exec(trimmed.replace(/\s/g, ""));

  if (!scheme) return true;

  return ALLOWED_SCHEMES.indexOf(scheme[1].toLowerCase()) !== -1;
}
```

```bash
(cd packages/core && pnpm test lib/richtext/__tests__/is-safe-href.spec.ts) 2>&1 | grep -E "^(PASS|FAIL)|✕|^Tests:"
```

預期輸出：

```
PASS lib/richtext/__tests__/is-safe-href.spec.ts
Tests:       40 passed, 40 total
```

- [ ] **Step 5: 寫 `textToRichText` 的失敗測試**

建立 `packages/core/lib/richtext/__tests__/text-to-richtext.spec.ts`：

```ts
import { textToRichText } from "../text-to-richtext";

describe("textToRichText", () => {
  it("wraps text in a single paragraph", () => {
    expect(textToRichText("Hello world")).toEqual({
      type: "doc",
      content: [
        {
          type: "paragraph",
          attrs: { textAlign: null },
          content: [{ type: "text", text: "Hello world" }],
        },
      ],
    });
  });

  it("keeps HTML as literal text", () => {
    const html = '<p>Hi</p><img src=x onerror="alert(1)">';

    expect(textToRichText(html).content?.[0].content).toEqual([
      { type: "text", text: html },
    ]);
  });

  it("keeps line breaks inside the text", () => {
    expect(textToRichText("a\nb").content?.[0].content).toEqual([
      { type: "text", text: "a\nb" },
    ]);
  });

  it("returns an empty document for an empty string", () => {
    expect(textToRichText("")).toEqual({ type: "doc", content: [] });
  });
});
```

```bash
(cd packages/core && pnpm test lib/richtext/__tests__/text-to-richtext.spec.ts) 2>&1 | grep -E "^(PASS|FAIL)|Cannot find module|^Tests:"
```

預期失敗：

```
FAIL lib/richtext/__tests__/text-to-richtext.spec.ts
    Cannot find module '../text-to-richtext' from 'lib/richtext/__tests__/text-to-richtext.spec.ts'
Tests:       0 total
```

- [ ] **Step 6: 實作 `textToRichText` 並 commit**

字串整段放進一個段落、不拆行（換行字元保留在文字裡，`.rich-text *` 的 `white-space: pre-wrap` 會顯示成換行），與 v0.23.0 對非 HTML 字串的處理相同；空字串回傳空文件。

建立 `packages/core/lib/richtext/text-to-richtext.ts`：

```ts
import type { RichTextDoc } from "./types";

/**
 * Wraps plain text in a document with a single paragraph. The text is never
 * parsed, so HTML tags stay literal text. An empty string gives an empty
 * document.
 */
export function textToRichText(text: string): RichTextDoc {
  if (text === "") return { type: "doc", content: [] };

  return {
    type: "doc",
    content: [
      {
        type: "paragraph",
        attrs: { textAlign: null },
        content: [{ type: "text", text }],
      },
    ],
  };
}
```

```bash
(cd packages/core && pnpm test lib/richtext/__tests__/text-to-richtext.spec.ts) 2>&1 | grep -E "^(PASS|FAIL)|✓|✕|^Tests:"
git add packages/core/lib/richtext/types.ts packages/core/lib/richtext/is-safe-href.ts packages/core/lib/richtext/text-to-richtext.ts packages/core/lib/richtext/__tests__/is-safe-href.spec.ts packages/core/lib/richtext/__tests__/text-to-richtext.spec.ts
git commit -m "feat(richtext): add isSafeHref and textToRichText" -m "isSafeHref allows http, https, mailto, tel and relative URLs and rejects every other scheme, including javascript:, data: and vbscript: hidden behind case, whitespace, control characters or character references. textToRichText wraps a string in a plain text paragraph without parsing it."
```

預期（毫秒數與 hash 會不同）：

```
PASS lib/richtext/__tests__/text-to-richtext.spec.ts
    ✓ wraps text in a single paragraph
    ✓ keeps HTML as literal text
    ✓ keeps line breaks inside the text
    ✓ returns an empty document for an empty string
Tests:       4 passed, 4 total
[tzuchi/main <hash>] feat(richtext): add isSafeHref and textToRichText
 5 files changed, 164 insertions(+)
 create mode 100644 packages/core/lib/richtext/__tests__/is-safe-href.spec.ts
 create mode 100644 packages/core/lib/richtext/__tests__/text-to-richtext.spec.ts
 create mode 100644 packages/core/lib/richtext/is-safe-href.ts
 create mode 100644 packages/core/lib/richtext/text-to-richtext.ts
 create mode 100644 packages/core/lib/richtext/types.ts
```

- [ ] **Step 7: 建立測試共用的 fixtures 與 DOM 比對工具**

`fixtures.ts` 的 `typicalContent` 是 PuckRichText 編輯器會產生的典型內容，形狀與 `editor.getJSON()` 完全相同（所有屬性都在、marks 依 schema 排序），涵蓋：h1–h6、四種段落對齊與置中標題、粗斜底線刪除線與行內 code、巢狀與相鄰 marks、連結（含 `target`/`rel`/`title`、相對路徑、mailto、跨越粗體的連結）、含 language 與不含 language 的 code block、引言、有序清單（含 `start` 與 `type`）、巢狀清單、hard break（含帶 mark 的 hard break）、水平線、空段落、特殊字元。

`dom.ts` 的 `isSameDom` 把兩段 HTML 各自解析成 DOM，把每個 `style` 屬性改寫成 `el.style.cssText`（所以 `text-align:center` 與 `text-align: center;` 相同），合併相鄰文字節點，再用 `isEqualNode` 比較；`isEqualNode` 不看屬性順序。`tiptapHtml` 用 `@tiptap/html`（jsdom 測試環境會用它的瀏覽器版）的 `generateHTML(json, [PuckRichText])`，也就是一致性測試的 oracle；`canonicalize` 是 `Node.fromJSON(schema, json).toJSON()`，用來確認 fixture 確實是編輯器的標準格式。

建立 `packages/core/lib/richtext/__helpers__/fixtures.ts`：

```ts
import type { RichTextDoc, RichTextNode } from "../types";

const text = (value: string, marks?: RichTextNode["marks"]): RichTextNode =>
  marks ? { type: "text", marks, text: value } : { type: "text", text: value };

const paragraph = (
  content: RichTextNode[],
  textAlign: string | null = null
): RichTextNode =>
  content.length
    ? { type: "paragraph", attrs: { textAlign }, content }
    : { type: "paragraph", attrs: { textAlign } };

const heading = (
  level: number,
  content: RichTextNode[],
  textAlign: string | null = null
): RichTextNode => ({ type: "heading", attrs: { textAlign, level }, content });

const listItem = (...content: RichTextNode[]): RichTextNode => ({
  type: "listItem",
  content,
});

const link = (
  href: string,
  target: string | null = "_blank",
  rel: string | null = "noopener noreferrer nofollow",
  title: string | null = null
) => ({ type: "link", attrs: { href, target, rel, class: null, title } });

export const doc = (...content: RichTextNode[]): RichTextDoc => ({
  type: "doc",
  content,
});

/**
 * Content the PuckRichText editor produces, in the canonical shape of
 * editor.getJSON() (every attribute present, marks in schema order).
 */
export const typicalContent: Record<string, RichTextDoc> = {
  headings: doc(
    heading(1, [text("Heading 1")]),
    heading(2, [text("Heading 2")]),
    heading(3, [text("Heading 3")]),
    heading(4, [text("Heading 4")]),
    heading(5, [text("Heading 5")]),
    heading(6, [text("Heading 6")])
  ),
  alignment: doc(
    paragraph([text("left")], "left"),
    paragraph([text("center")], "center"),
    paragraph([text("right")], "right"),
    paragraph([text("justify")], "justify"),
    heading(2, [text("centered heading")], "center")
  ),
  marks: doc(
    paragraph([
      text("plain "),
      text("bold", [{ type: "bold" }]),
      text(" "),
      text("italic", [{ type: "italic" }]),
      text(" "),
      text("underline", [{ type: "underline" }]),
      text(" "),
      text("strike", [{ type: "strike" }]),
      text(" "),
      text("code", [{ type: "code" }]),
    ])
  ),
  nestedMarks: doc(
    paragraph([
      text("bold ", [{ type: "bold" }]),
      text("bold italic", [{ type: "bold" }, { type: "italic" }]),
      text(" bold", [{ type: "bold" }]),
      text(" "),
      text("all", [
        { type: "bold" },
        { type: "italic" },
        { type: "strike" },
        { type: "underline" },
      ]),
    ])
  ),
  links: doc(
    paragraph([
      text("Visit "),
      text("example", [link("https://example.com")]),
      text(", "),
      text("relative", [link("/about", null, null)]),
      text(", "),
      text("mail", [link("mailto:someone@example.com", "_self", "noopener")]),
      text(" and "),
      text("titled", [link("https://example.com/t", "_blank", null, "Title")]),
    ]),
    paragraph([
      text("link ", [link("https://example.com/a")]),
      text("with bold", [link("https://example.com/a"), { type: "bold" }]),
    ])
  ),
  codeBlocks: doc(
    {
      type: "codeBlock",
      attrs: { language: "js" },
      content: [text('const a = "<b>";\nconsole.log(a);')],
    },
    {
      type: "codeBlock",
      attrs: { language: null },
      content: [text("plain code")],
    }
  ),
  blockquote: doc({
    type: "blockquote",
    content: [paragraph([text("Quoted")]), paragraph([text("Second line")])],
  }),
  orderedLists: doc(
    {
      type: "orderedList",
      attrs: { start: 1, type: null },
      content: [listItem(paragraph([text("one")]))],
    },
    {
      type: "orderedList",
      attrs: { start: 3, type: "a" },
      content: [
        listItem(paragraph([text("three")])),
        listItem(paragraph([text("four")])),
      ],
    }
  ),
  nestedLists: doc({
    type: "bulletList",
    content: [
      listItem(paragraph([text("parent")]), {
        type: "orderedList",
        attrs: { start: 1, type: null },
        content: [
          listItem(paragraph([text("child")]), {
            type: "bulletList",
            content: [listItem(paragraph([text("grandchild")]))],
          }),
        ],
      }),
      listItem(paragraph([text("sibling")])),
    ],
  }),
  hardBreaks: doc(
    paragraph([text("line 1"), { type: "hardBreak" }, text("line 2")]),
    paragraph([
      text("bold", [{ type: "bold" }]),
      { type: "hardBreak", marks: [{ type: "bold" }] },
      text("still bold", [{ type: "bold" }]),
    ])
  ),
  horizontalRule: doc(
    paragraph([text("above")]),
    { type: "horizontalRule" },
    paragraph([text("below")])
  ),
  emptyParagraphs: doc(
    paragraph([]),
    paragraph([text("between")]),
    paragraph([])
  ),
  specialCharacters: doc(
    paragraph([text('<script>alert("x")</script> & "double" \'single\'')])
  ),
};

export const allTypicalContent: RichTextDoc = doc(
  ...Object.values(typicalContent).flatMap((value) => value.content ?? [])
);

/** A chain of `depth` nested blockquotes around a paragraph, built without recursion. */
export const deepBlockquotes = (depth: number, value = "deep"): RichTextDoc => {
  let node: RichTextNode = paragraph([text(value)]);

  for (let i = 0; i < depth; i++) {
    node = { type: "blockquote", content: [node] };
  }

  return doc(node);
};
```

建立 `packages/core/lib/richtext/__helpers__/dom.ts`：

```ts
import { getSchema } from "@tiptap/core";
import { generateHTML } from "@tiptap/html";
import { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { PuckRichText } from "../../../components/RichTextEditor/extension";
import type { RichTextDoc } from "../types";

const extensions = [PuckRichText];

/** What Tiptap renders for this JSON (the browser build of @tiptap/html). */
export const tiptapHtml = (value: RichTextDoc) =>
  generateHTML(value, extensions);

/** The shape editor.getJSON() would give for this JSON. */
export const canonicalize = (value: RichTextDoc) =>
  ProseMirrorNode.fromJSON(getSchema(extensions), value).toJSON();

/**
 * Parses HTML into a DOM fragment and rewrites every style attribute through
 * CSSStyleDeclaration, so `text-align:center` and `text-align: center;` match.
 */
export const parseHtml = (html: string) => {
  const template = document.createElement("template");
  template.innerHTML = html;

  template.content.querySelectorAll<HTMLElement>("[style]").forEach((el) => {
    el.setAttribute("style", el.style.cssText);
  });
  template.content.normalize();

  return template.content;
};

export const isSameDom = (a: string, b: string) =>
  parseHtml(a).isEqualNode(parseHtml(b));
```

- [ ] **Step 8: 寫 `normalizeRichText` 的失敗測試**

建立 `packages/core/lib/richtext/__tests__/normalize.spec.ts`：

```ts
import { normalizeRichText, RICHTEXT_MAX_DEPTH } from "../normalize";
import {
  allTypicalContent,
  deepBlockquotes,
  doc,
  typicalContent,
} from "../__helpers__/fixtures";
import { canonicalize } from "../__helpers__/dom";
import type { RichTextNode } from "../types";

const p = (...content: RichTextNode[]): RichTextNode =>
  content.length
    ? { type: "paragraph", attrs: { textAlign: null }, content }
    : { type: "paragraph", attrs: { textAlign: null } };

const t = (text: string): RichTextNode => ({ type: "text", text });

describe("normalizeRichText", () => {
  describe("valid editor output", () => {
    it("fixtures are in the canonical editor.getJSON() shape", () => {
      expect(canonicalize(allTypicalContent)).toEqual(allTypicalContent);
    });

    it.each(Object.keys(typicalContent))("returns %s unchanged", (name) => {
      const value = typicalContent[name];

      expect(normalizeRichText(value)).toEqual(value);
    });

    it("fills in the default attributes Tiptap would add", () => {
      expect(
        normalizeRichText({
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "x",
                  marks: [{ type: "link", attrs: { href: "https://a.test" } }],
                },
              ],
            },
            { type: "heading", content: [t("h")] },
            { type: "orderedList", content: [{ type: "listItem" }] },
            { type: "codeBlock", content: [t("c")] },
          ],
        })
      ).toEqual({
        type: "doc",
        content: [
          {
            type: "paragraph",
            attrs: { textAlign: null },
            content: [
              {
                type: "text",
                text: "x",
                marks: [
                  {
                    type: "link",
                    attrs: {
                      href: "https://a.test",
                      target: "_blank",
                      rel: "noopener noreferrer nofollow",
                      class: null,
                      title: null,
                    },
                  },
                ],
              },
            ],
          },
          {
            type: "heading",
            attrs: { textAlign: null, level: 1 },
            content: [t("h")],
          },
          {
            type: "orderedList",
            attrs: { start: 1, type: null },
            content: [{ type: "listItem" }],
          },
          { type: "codeBlock", attrs: { language: null }, content: [t("c")] },
        ],
      });
    });

    it("sorts marks into schema order and drops duplicates", () => {
      expect(
        normalizeRichText(
          doc({
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "x",
                marks: [
                  { type: "italic" },
                  { type: "bold" },
                  { type: "italic" },
                  { type: "underline" },
                ],
              },
            ],
          })
        ).content?.[0].content?.[0].marks
      ).toEqual([{ type: "bold" }, { type: "italic" }, { type: "underline" }]);
    });
  });

  describe("non-document input", () => {
    it("treats a string as plain text", () => {
      expect(normalizeRichText("<p>Hello</p>")).toEqual(
        doc(p(t("<p>Hello</p>")))
      );
    });

    it.each([undefined, null, 1, true, [], ""])(
      "returns an empty document for %p",
      (value) => {
        expect(normalizeRichText(value)).toEqual({ type: "doc", content: [] });
      }
    );

    it("wraps a lone block node in a document", () => {
      expect(
        normalizeRichText({ type: "paragraph", content: [t("x")] })
      ).toEqual(doc(p(t("x"))));
    });
  });

  describe("unknown and misplaced content", () => {
    it("keeps only the text of unknown nodes", () => {
      expect(
        normalizeRichText(
          doc(
            {
              type: "image",
              attrs: { src: "x", onerror: "alert(1)" },
              content: [t("caption")],
            },
            p(t("a "), { type: "mention", content: [t("@b")] })
          )
        )
      ).toEqual(doc(p(t("caption")), p(t("a "), t("@b"))));
    });

    it.each(["constructor", "__proto__", "toString", "hasOwnProperty"])(
      "treats the type %j as unknown",
      (type) => {
        expect(normalizeRichText(doc({ type, content: [t("x")] }))).toEqual(
          doc(p(t("x")))
        );
      }
    );

    it.each([1, null, {}, ["paragraph"]])(
      "treats a non-string type (%p) as unknown",
      (type) => {
        expect(
          normalizeRichText({
            type: "doc",
            content: [{ type, content: [t("x")] }],
          })
        ).toEqual(doc(p(t("x"))));
      }
    );

    it("drops nodes that have no text", () => {
      expect(
        normalizeRichText(doc({ type: "video" } as RichTextNode, p()))
      ).toEqual(doc(p()));
    });

    it("drops unknown marks and keeps the text", () => {
      expect(
        normalizeRichText(
          doc({
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "x",
                marks: [
                  { type: "textStyle", attrs: { color: "red" } },
                  { type: "__proto__" },
                  { type: "bold" },
                ],
              },
            ],
          })
        )
      ).toEqual(doc(p({ type: "text", text: "x", marks: [{ type: "bold" }] })));
    });

    it("flattens block nodes inside a paragraph to text", () => {
      expect(
        normalizeRichText(doc(p(t("a"), p(t("b")) as RichTextNode)))
      ).toEqual(doc(p(t("a"), t("b"))));
    });

    it("wraps text that sits directly in a block container", () => {
      expect(normalizeRichText(doc(t("loose")))).toEqual(doc(p(t("loose"))));
    });

    it("wraps list children that are not list items", () => {
      expect(
        normalizeRichText(doc({ type: "bulletList", content: [p(t("x"))] }))
      ).toEqual(
        doc({
          type: "bulletList",
          content: [{ type: "listItem", content: [p(t("x"))] }],
        })
      );
    });

    it("strips marks and nodes other than text from code blocks", () => {
      expect(
        normalizeRichText(
          doc({
            type: "codeBlock",
            attrs: { language: "ts" },
            content: [
              { type: "text", text: "a", marks: [{ type: "bold" }] },
              { type: "hardBreak" },
              t("b"),
            ],
          })
        )
      ).toEqual(
        doc({
          type: "codeBlock",
          attrs: { language: "ts" },
          content: [t("a"), t("\n"), t("b")],
        })
      );
    });

    it("drops empty and non-string text", () => {
      expect(
        normalizeRichText(
          doc(
            p(
              t(""),
              { type: "text" },
              { type: "text", text: 1 } as unknown as RichTextNode,
              t("ok")
            )
          )
        )
      ).toEqual(doc(p(t("ok"))));
    });
  });

  describe("attributes", () => {
    it("drops attributes that are not part of the schema", () => {
      expect(
        normalizeRichText(
          doc({
            type: "paragraph",
            attrs: {
              textAlign: "center",
              style: "color:red",
              onclick: "alert(1)",
              class: "x",
            },
            content: [t("x")],
          })
        )
      ).toEqual(doc({ ...p(t("x")), attrs: { textAlign: "center" } }));
    });

    it.each([
      "center; background:url(//evil.example)",
      "CENTER",
      "start",
      1,
      {},
    ])("rejects textAlign %p", (textAlign) => {
      expect(
        normalizeRichText(
          doc({ type: "paragraph", attrs: { textAlign }, content: [t("x")] })
        )
      ).toEqual(doc(p(t("x"))));
    });

    it.each([0, 7, 2.5, "2", null])(
      "falls back to level 1 for heading level %p",
      (level) => {
        expect(
          normalizeRichText(
            doc({ type: "heading", attrs: { level }, content: [t("x")] })
          ).content?.[0].attrs
        ).toEqual({ textAlign: null, level: 1 });
      }
    );

    it("validates ordered list start and type", () => {
      const attrsFor = (attrs: Record<string, unknown>) =>
        normalizeRichText(doc({ type: "orderedList", attrs })).content?.[0]
          .attrs;

      expect(attrsFor({ start: 5, type: "I" })).toEqual({
        start: 5,
        type: "I",
      });
      expect(attrsFor({ start: "5", type: "disc" })).toEqual({
        start: 1,
        type: null,
      });
      expect(attrsFor({ start: 1.5, type: "1" })).toEqual({
        start: 1,
        type: "1",
      });
    });

    it.each(["js onclick=alert(1)", 'a"b', "x".repeat(65), 1])(
      "rejects code block language %p",
      (language) => {
        expect(
          normalizeRichText(
            doc({ type: "codeBlock", attrs: { language }, content: [t("x")] })
          ).content?.[0].attrs
        ).toEqual({ language: null });
      }
    );

    describe("links", () => {
      const linkOf = (attrs: Record<string, unknown>) =>
        normalizeRichText(
          doc({
            type: "paragraph",
            content: [
              { type: "text", text: "x", marks: [{ type: "link", attrs }] },
            ],
          })
        ).content?.[0].content?.[0];

      it.each([
        "javascript:alert(1)",
        "JAVASCRIPT:alert(1)",
        " javascript:alert(1)",
        "\u0001javascript:alert(1)",
        "&#106;avascript:alert(1)",
        "data:text/html,<script>alert(1)</script>",
        "vbscript:msgbox(1)",
        undefined,
        42,
      ])("removes the link when href is %p and keeps the text", (href) => {
        expect(linkOf({ href })).toEqual(t("x"));
      });

      it("keeps only valid link attributes", () => {
        expect(
          linkOf({
            href: "https://example.com",
            target: "evil-frame",
            rel: 'noopener" onclick="alert(1)',
            class: "fixed inset-0",
            title: "Example",
            onclick: "alert(1)",
            style: "position:fixed",
          })?.marks
        ).toEqual([
          {
            type: "link",
            attrs: {
              href: "https://example.com",
              target: null,
              rel: null,
              class: null,
              title: "Example",
            },
          },
        ]);
      });

      it("drops rel opener, so a page opened in a new tab cannot reach this one", () => {
        const relOf = (rel: string) =>
          linkOf({ href: "https://example.com", target: "_blank", rel })
            ?.marks?.[0].attrs?.rel;

        expect(
          ["opener", "OPENER", "noopener opener", "opener noreferrer"].map(
            relOf
          )
        ).toEqual([null, null, "noopener", "noreferrer"]);
      });
    });
  });

  describe("depth limit", () => {
    it("keeps nodes up to maxDepth and turns deeper ones into text", () => {
      expect(normalizeRichText(deepBlockquotes(5), { maxDepth: 3 })).toEqual(
        doc({
          type: "blockquote",
          content: [
            {
              type: "blockquote",
              content: [{ type: "blockquote", content: [p(t("deep"))] }],
            },
          ],
        })
      );
    });

    it("defaults to RICHTEXT_MAX_DEPTH (100)", () => {
      expect(RICHTEXT_MAX_DEPTH).toBe(100);

      let node: RichTextNode | undefined = normalizeRichText(
        deepBlockquotes(5000)
      );
      let blockquotes = 0;

      while (node?.content?.[0]?.type === "blockquote") {
        blockquotes++;
        node = node.content[0];
      }

      expect(blockquotes).toBe(RICHTEXT_MAX_DEPTH);
      expect(node?.content).toEqual([p(t("deep"))]);
    });

    it("extracts the text of a very deep subtree without recursion", () => {
      expect(
        normalizeRichText(deepBlockquotes(100_000, "bottom"), { maxDepth: 0 })
      ).toEqual(doc(p(t("bottom"))));
    });

    it("stops at cycles", () => {
      const node: RichTextNode = { type: "blockquote", content: [] };
      node.content!.push(node, p(t("x")));

      expect(normalizeRichText(doc(node))).toEqual(
        doc({ type: "blockquote", content: [p(t("x"))] })
      );
    });
  });
});
```

```bash
(cd packages/core && pnpm test lib/richtext/__tests__/normalize.spec.ts) 2>&1 | grep -E "^(PASS|FAIL)|Cannot find module|^Tests:"
```

預期失敗：

```
FAIL lib/richtext/__tests__/normalize.spec.ts
    Cannot find module '../normalize' from 'lib/richtext/__tests__/normalize.spec.ts'
Tests:       0 total
```

- [ ] **Step 9: 實作 `normalizeRichText` 並 commit**

建立 `packages/core/lib/richtext/normalize.ts`：

```ts
import { isSafeHref } from "./is-safe-href";
import { textToRichText } from "./text-to-richtext";
import type { RichTextDoc, RichTextMark, RichTextNode } from "./types";

/** Nodes nested deeper than this are reduced to their text. */
export const RICHTEXT_MAX_DEPTH = 100;

type UnknownRecord = Record<string, unknown>;

/** Which children a parent node accepts. */
type Context = "block" | "list" | "inline" | "code";

const BLOCK_TYPES = new Set([
  "paragraph",
  "heading",
  "blockquote",
  "bulletList",
  "orderedList",
  "codeBlock",
  "horizontalRule",
]);

// ProseMirror keeps the marks of a node sorted by schema rank. This is the
// rank order of the PuckRichText schema (link has priority 1000).
const MARK_ORDER = ["link", "bold", "code", "italic", "strike", "underline"];

const TEXT_ALIGNS = new Set(["left", "center", "right", "justify"]);
const ORDERED_LIST_TYPES = new Set(["1", "a", "A", "i", "I"]);
const LINK_TARGETS = new Set(["_blank", "_self", "_parent", "_top"]);
const LINK_REL = /^[a-z]+( [a-z]+)*$/i;
const CODE_LANGUAGE = /^[A-Za-z0-9_+#.-]{1,64}$/;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const attrsOf = (value: UnknownRecord): UnknownRecord =>
  isRecord(value.attrs) ? value.attrs : {};

export const isTextAlign = (value: unknown): value is string =>
  typeof value === "string" && TEXT_ALIGNS.has(value);

// rel="opener" gives a page that the link opens in a new tab access to this
// page through window.opener (reverse tabnabbing), so that link type is
// dropped. Every other link type only describes the link.
const linkRel = (rel: unknown): string | null => {
  if (typeof rel !== "string" || !LINK_REL.test(rel)) return null;

  const types = rel
    .split(" ")
    .filter((type) => type.toLowerCase() !== "opener");

  return types.length > 0 ? types.join(" ") : null;
};

/**
 * Collects the text of a subtree. Uses an explicit stack instead of recursion
 * so that it works for any depth.
 */
export function extractText(value: unknown): string {
  const parts: string[] = [];
  const stack: unknown[] = [value];
  const seen = new Set<unknown>();

  while (stack.length > 0) {
    const node = stack.pop();

    if (!isRecord(node) || seen.has(node)) continue;

    seen.add(node);

    if (node.type === "text") {
      if (typeof node.text === "string") parts.push(node.text);
    } else if (node.type === "hardBreak") {
      parts.push("\n");
    } else if (Array.isArray(node.content)) {
      for (let i = node.content.length - 1; i >= 0; i--) {
        stack.push(node.content[i]);
      }
    }
  }

  return parts.join("");
}

const paragraph = (content: RichTextNode[]): RichTextNode => ({
  type: "paragraph",
  attrs: { textAlign: null },
  content,
});

/** Wraps text so that it fits where the original node was. */
const textFallback = (text: string, context: Context): RichTextNode | null => {
  if (text === "") return null;

  const node: RichTextNode = { type: "text", text };

  if (context === "block") return paragraph([node]);
  if (context === "list")
    return { type: "listItem", content: [paragraph([node])] };

  return node;
};

const fits = (type: string, context: Context) => {
  if (context === "block") return BLOCK_TYPES.has(type);
  if (context === "list") return type === "listItem";
  if (context === "inline") return type === "text" || type === "hardBreak";

  return type === "text";
};

const withContent = (node: RichTextNode, content: RichTextNode[]) =>
  content.length > 0 ? { ...node, content } : node;

const normalizeMark = (
  type: string,
  attrs: UnknownRecord
): RichTextMark | null => {
  switch (type) {
    case "bold":
    case "code":
    case "italic":
    case "strike":
    case "underline":
      return { type };
    case "link": {
      if (!isSafeHref(attrs.href)) return null;

      const { target, rel, title } = attrs;

      return {
        type,
        attrs: {
          href: attrs.href,
          target:
            target === undefined
              ? "_blank"
              : typeof target === "string" && LINK_TARGETS.has(target)
              ? target
              : null,
          rel:
            rel === undefined ? "noopener noreferrer nofollow" : linkRel(rel),
          // Classes are dropped: they could pull in the host page's styles
          class: null,
          title: typeof title === "string" ? title : null,
        },
      };
    }
    default:
      return null;
  }
};

const normalizeMarks = (value: unknown): RichTextMark[] => {
  if (!Array.isArray(value)) return [];

  const byType = new Map<string, RichTextMark>();

  for (const mark of value) {
    if (!isRecord(mark) || typeof mark.type !== "string") continue;
    if (byType.has(mark.type)) continue;

    const normalized = normalizeMark(mark.type, attrsOf(mark));

    if (normalized) byType.set(mark.type, normalized);
  }

  const marks: RichTextMark[] = [];

  for (const type of MARK_ORDER) {
    const mark = byType.get(type);

    if (mark) marks.push(mark);
  }

  return marks;
};

type Walk = {
  maxDepth: number;
  ancestors: Set<unknown>;
};

function normalizeChildren(
  value: unknown,
  context: Context,
  depth: number,
  walk: Walk
): RichTextNode[] {
  if (!Array.isArray(value)) return [];

  const children: RichTextNode[] = [];

  for (const child of value) {
    const node = normalizeNode(child, context, depth, walk);

    if (node) children.push(node);
  }

  return children;
}

function normalizeNode(
  value: unknown,
  context: Context,
  depth: number,
  walk: Walk
): RichTextNode | null {
  if (!isRecord(value) || walk.ancestors.has(value)) return null;

  const type = typeof value.type === "string" ? value.type : "";

  if (depth > walk.maxDepth || !fits(type, context)) {
    return textFallback(extractText(value), context);
  }

  walk.ancestors.add(value);

  try {
    return normalizeKnownNode(type, value, context, depth, walk);
  } finally {
    walk.ancestors.delete(value);
  }
}

function normalizeKnownNode(
  type: string,
  value: UnknownRecord,
  context: Context,
  depth: number,
  walk: Walk
): RichTextNode | null {
  const attrs = attrsOf(value);
  const children = (childContext: Context) =>
    normalizeChildren(value.content, childContext, depth + 1, walk);

  switch (type) {
    case "text": {
      if (typeof value.text !== "string" || value.text === "") return null;

      const marks = context === "code" ? [] : normalizeMarks(value.marks);

      return marks.length > 0
        ? { type, marks, text: value.text }
        : { type, text: value.text };
    }
    case "hardBreak": {
      const marks = normalizeMarks(value.marks);

      return marks.length > 0 ? { type, marks } : { type };
    }
    case "horizontalRule":
      return { type };
    case "paragraph":
      return withContent(
        {
          type,
          attrs: {
            textAlign: isTextAlign(attrs.textAlign) ? attrs.textAlign : null,
          },
        },
        children("inline")
      );
    case "heading": {
      const { level } = attrs;

      return withContent(
        {
          type,
          attrs: {
            textAlign: isTextAlign(attrs.textAlign) ? attrs.textAlign : null,
            level:
              typeof level === "number" &&
              Number.isInteger(level) &&
              level >= 1 &&
              level <= 6
                ? level
                : 1,
          },
        },
        children("inline")
      );
    }
    case "blockquote":
    case "listItem":
      return withContent({ type }, children("block"));
    case "bulletList":
      return withContent({ type }, children("list"));
    case "orderedList": {
      const { start, type: listType } = attrs;

      return withContent(
        {
          type,
          attrs: {
            start:
              typeof start === "number" && Number.isSafeInteger(start)
                ? start
                : 1,
            type:
              typeof listType === "string" && ORDERED_LIST_TYPES.has(listType)
                ? listType
                : null,
          },
        },
        children("list")
      );
    }
    case "codeBlock": {
      const { language } = attrs;

      return withContent(
        {
          type,
          attrs: {
            language:
              typeof language === "string" && CODE_LANGUAGE.test(language)
                ? language
                : null,
          },
        },
        children("code")
      );
    }
    default:
      return null;
  }
}

/**
 * Turns any value into a rich text document that contains only the nodes,
 * marks and attributes of the PuckRichText schema:
 *
 * - A string becomes a plain text paragraph. HTML is never parsed.
 * - Unknown or misplaced nodes and marks are reduced to their text.
 * - Attributes are checked one by one; invalid values fall back to defaults,
 *   and links with an unsafe href are removed.
 * - Nodes nested deeper than `maxDepth` are reduced to their text.
 *
 * Valid editor output (editor.getJSON()) is returned unchanged.
 */
export function normalizeRichText(
  value: unknown,
  options: { maxDepth?: number } = {}
): RichTextDoc {
  if (typeof value === "string") return textToRichText(value);

  if (!isRecord(value)) return { type: "doc", content: [] };

  const isDoc = value.type === "doc";
  const walk: Walk = {
    maxDepth: options.maxDepth ?? RICHTEXT_MAX_DEPTH,
    ancestors: new Set(isDoc ? [value] : []),
  };
  const content = isDoc ? value.content : [value];

  return {
    type: "doc",
    content: normalizeChildren(content, "block", 1, walk),
  };
}
```

```bash
(cd packages/core && pnpm test lib/richtext/__tests__/normalize.spec.ts) 2>&1 | grep -E "^(PASS|FAIL)|✕|^Tests:"
```

預期（「extracts the text of a very deep subtree」建構 10 萬層的物件，整個檔案約 1 秒）：

```
PASS lib/richtext/__tests__/normalize.spec.ts
Tests:       71 passed, 71 total
```

```bash
git add packages/core/lib/richtext/normalize.ts packages/core/lib/richtext/__helpers__ packages/core/lib/richtext/__tests__/normalize.spec.ts
git commit -m "feat(richtext): normalize rich text to the PuckRichText schema" -m "normalizeRichText turns any value into a document that only contains the nodes, marks and attributes of the default PuckRichText schema. Strings become plain text, unknown or misplaced nodes keep only their text, attributes are validated one by one, links with an unsafe href are removed and nodes nested deeper than RICHTEXT_MAX_DEPTH (100) are reduced to text without recursion. Valid editor.getJSON() output is returned unchanged."
```

預期（hash 會不同）：

```
[tzuchi/main <hash>] feat(richtext): normalize rich text to the PuckRichText schema
 4 files changed, 1020 insertions(+)
 create mode 100644 packages/core/lib/richtext/__helpers__/dom.ts
 create mode 100644 packages/core/lib/richtext/__helpers__/fixtures.ts
 create mode 100644 packages/core/lib/richtext/__tests__/normalize.spec.ts
 create mode 100644 packages/core/lib/richtext/normalize.ts
```

- [ ] **Step 10: 寫渲染器的一致性、深度與 XSS 失敗測試**

`render.spec.tsx`：
- `matches the HTML Tiptap generates`：對 `typicalContent` 的每一項與全部合併的文件，比較 `renderToStaticMarkup(<>{renderRichText(json)}</>)` 與 `generateHTML(json, [PuckRichText])` 的 DOM。
- `depth limit (F2)`：5,000 層 blockquote 在伺服器端（`renderToStaticMarkup`）與 client 端（`@testing-library/react` 的 `render`）都不拋錯，只保留 100 層；5,000 層清單只保留 50 層 `<ul>`（每層清單佔兩個節點深度）。
- `RichTextContent`：外層 class 正確；直接當函式呼叫不會拋錯，證明沒有使用 hooks，可以在 RSC 中執行。

`xss.spec.tsx`（惡意輸入與檢查函式 `expectSafe` 放在 `__helpers__/xss-payloads.ts`，Task 6 的 `<Render>`／`ServerRender` 測試與 Task 7 的 `EditorFallback`／編輯器測試用同一組 payload，對應規格 §9 第 3 項「送進共用渲染器、編輯器畫布與 `<Render>`」）：每個案例都以 `react-dom/server` 的 `renderToString` 與 `@testing-library/react` 的 `render` 各渲染一次，兩邊都檢查：只出現 mapping 內的元素，每個元素只有允許的屬性，沒有 `on*` 屬性，沒有 `javascript:`/`data:`/`vbscript:` URL，`style` 只有合法的 `text-align`，code 的 class 只有 `language-*`；伺服器端輸出沒有 `<script`。
- 竄改的 JSON：`javascript:`、`JAVASCRIPT:`、前置空白、前置控制字元、內嵌 tab、十進位與十六進位實體編碼、`data:`、`vbscript:` 的 href；`textAlign` CSS 注入（段落與標題）；未知 node（script、iframe srcdoc、image onerror、svg onload）；未知 mark；各種節點與 link 上的 `on*`、`style`、`class` 屬性；`constructor`、`__proto__`、`toString`、`valueOf` 等型別；非字串型別。
- 舊格式 HTML 字串：評估報告 gap-v0230-sec 的 12 種 payload（P01–P12，含 `img onerror`、`svg onload`、`iframe srcdoc`、`details ontoggle`、mXSS、CSS 覆蓋、form、實體編碼與控制字元的 `javascript:`、5,000 層 `<b>`）、一段正常 HTML（P13）與 `<script>`。每個都必須輸出成**唯一一個沒有子元素的 `<p>`，`textContent` 與原字串完全相同**。

建立 `packages/core/lib/richtext/__tests__/render.spec.tsx`：

```tsx
import { render } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server.node";
import { RichTextContent } from "../../../components/RichTextEditor/components/RichTextContent";
import { RICHTEXT_MAX_DEPTH } from "../normalize";
import { markMapping, nodeMapping, renderRichText } from "../render";
import {
  allTypicalContent,
  deepBlockquotes,
  typicalContent,
} from "../__helpers__/fixtures";
import { isSameDom, tiptapHtml } from "../__helpers__/dom";
import type { RichTextNode } from "../types";

const markupOf = (value: unknown) =>
  renderToStaticMarkup(<>{renderRichText(value)}</>);

const expectSameDom = (actual: string, expected: string) => {
  // Printing both strings makes a failure readable
  expect({ same: isSameDom(actual, expected), actual, expected }).toEqual({
    same: true,
    actual,
    expected,
  });
};

describe("isSameDom", () => {
  it("ignores attribute order and style formatting", () => {
    expect(
      isSameDom(
        '<p style="text-align:center"><a href="/a" rel="r">x</a></p>',
        '<p style="text-align: center;"><a rel="r" href="/a">x</a></p>'
      )
    ).toBe(true);
  });

  it("detects marks that are not merged", () => {
    expect(
      isSameDom(
        "<strong>a</strong><strong><em>b</em></strong>",
        "<strong>a<em>b</em></strong>"
      )
    ).toBe(false);
  });
});

describe("renderRichText", () => {
  describe("matches the HTML Tiptap generates", () => {
    it.each(Object.keys(typicalContent))("for %s", (name) => {
      const value = typicalContent[name];

      expectSameDom(markupOf(value), tiptapHtml(value));
    });

    it("for all typical content in one document", () => {
      expectSameDom(markupOf(allTypicalContent), tiptapHtml(allTypicalContent));
    });
  });

  it("merges adjacent marks the way ProseMirror does", () => {
    expect(markupOf(typicalContent.nestedMarks)).toBe(
      "<p><strong>bold <em>bold italic</em> bold</strong> <strong><em><s><u>all</u></s></em></strong></p>"
    );
  });

  it("renders a string as one escaped text paragraph", () => {
    expect(markupOf("<p>Hello</p>")).toBe("<p>&lt;p&gt;Hello&lt;/p&gt;</p>");
  });

  it.each([undefined, null, "", 1, {}])("renders nothing for %p", (value) => {
    expect(markupOf(value)).toBe("");
  });

  it("uses mappings without a prototype", () => {
    expect(Object.getPrototypeOf(nodeMapping)).toBeNull();
    expect(Object.getPrototypeOf(markMapping)).toBeNull();
  });

  describe("depth limit (F2)", () => {
    it("renders a 5,000-level document on the server, keeping 100 levels", () => {
      const html = markupOf(deepBlockquotes(5000));

      expect(html.match(/<blockquote>/g)).toHaveLength(RICHTEXT_MAX_DEPTH);
      expect(html).toContain("<p>deep</p>");
    });

    it("renders a 5,000-level document on the client", () => {
      const { container } = render(
        <>{renderRichText(deepBlockquotes(5000))}</>
      );

      expect(container.querySelectorAll("blockquote")).toHaveLength(
        RICHTEXT_MAX_DEPTH
      );
      expect(container.textContent).toBe("deep");
    });

    it("renders a 5,000-level list", () => {
      let node: RichTextNode = {
        type: "paragraph",
        content: [{ type: "text", text: "item" }],
      };

      for (let i = 0; i < 5000; i++) {
        node = {
          type: "bulletList",
          content: [{ type: "listItem", content: [node] }],
        };
      }

      const html = markupOf({ type: "doc", content: [node] });

      expect(html.match(/<ul>/g)).toHaveLength(RICHTEXT_MAX_DEPTH / 2);
      expect(html).toContain("item");
    });
  });
});

describe("RichTextContent", () => {
  it("wraps the content in the rich text classes", () => {
    expect(
      renderToStaticMarkup(<RichTextContent content={typicalContent.marks} />)
    ).toBe(
      `<div class="RichTextEditor"><div class="rich-text">${markupOf(
        typicalContent.marks
      )}</div></div>`
    );
  });

  it("does not use hooks, so it can run as a server component", () => {
    expect(() => RichTextContent({ content: allTypicalContent })).not.toThrow();
  });
});
```

建立 `packages/core/lib/richtext/__helpers__/xss-payloads.ts`（`expectSafe` 會呼叫 jest 的 `expect`，只能在測試中使用）：

```ts
import { isSafeHref } from "../is-safe-href";
import type { RichTextDoc, RichTextNode } from "../types";

/** Elements the renderer may output, with the attributes each may carry. */
const ALLOWED: Record<string, string[]> = {
  div: ["class"],
  p: ["style"],
  h1: ["style"],
  h2: ["style"],
  h3: ["style"],
  h4: ["style"],
  h5: ["style"],
  h6: ["style"],
  strong: [],
  em: [],
  u: [],
  s: [],
  code: ["class"],
  pre: [],
  a: ["href", "target", "rel", "title"],
  ul: [],
  ol: ["start", "type"],
  li: [],
  blockquote: [],
  br: [],
  hr: [],
};

const DANGEROUS_URL = /^(javascript|data|vbscript):/i;

/**
 * Checks every element below `root`: only elements and attributes the
 * renderer may output, no on* attributes, no script URLs, only valid
 * text-align styles and only language-* classes on code.
 */
export const expectSafe = (root: ParentNode) => {
  for (const el of Array.from(root.querySelectorAll("*"))) {
    const tag = el.tagName.toLowerCase();

    expect(Object.keys(ALLOWED)).toContain(tag);

    for (const { name, value } of Array.from(el.attributes)) {
      expect(ALLOWED[tag]).toContain(name);
      expect(name).not.toMatch(/^on/i);
      expect(value.replace(/[\u0000- ]/g, "")).not.toMatch(DANGEROUS_URL);

      if (name === "href") expect(isSafeHref(value)).toBe(true);
      if (name === "style") {
        expect(value).toMatch(/^text-align: ?(left|center|right|justify);?$/);
      }
      if (name === "class" && tag === "code") {
        expect(value).toMatch(/^language-[A-Za-z0-9_+#.-]+$/);
      }
      if (name === "class" && tag === "div") {
        expect(["RichTextEditor", "rich-text"]).toContain(value);
      }
    }
  }
};

export const linkDoc = (href: unknown): RichTextDoc => ({
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "click",
          marks: [{ type: "link", attrs: { href } }],
        },
      ],
    },
  ],
});

const docWith = (...content: RichTextNode[]): RichTextDoc => ({
  type: "doc",
  content,
});

const text = (value: string): RichTextNode => ({ type: "text", text: value });

/** Tampered JSON documents. Each must render with expectSafe passing. */
export const tamperedJson: Record<string, unknown> = {
  "javascript: href": linkDoc("javascript:alert(1)"),
  "uppercase JAVASCRIPT: href": linkDoc("JAVASCRIPT:alert(1)"),
  "href with leading whitespace": linkDoc("  javascript:alert(1)"),
  "href with a leading control character": linkDoc("\u0001javascript:alert(1)"),
  "href with an embedded tab": linkDoc("java\tscript:alert(1)"),
  "entity-encoded javascript: href": linkDoc("&#106;avascript:alert(1)"),
  "hex entity-encoded javascript: href": linkDoc("&#x6A;avascript:alert(1)"),
  "data: href": linkDoc("data:text/html,<script>alert(1)</script>"),
  "vbscript: href": linkDoc("vbscript:msgbox(1)"),
  "CSS injection through textAlign": docWith(
    {
      type: "paragraph",
      attrs: { textAlign: "center; background:url(//evil.example/x)" },
      content: [text("p")],
    },
    {
      type: "heading",
      attrs: { level: 2, textAlign: "left;position:fixed;inset:0" },
      content: [text("h")],
    }
  ),
  "unknown nodes": docWith(
    { type: "script", content: [text("alert(1)")] },
    { type: "iframe", attrs: { srcdoc: "<script>alert(1)</script>" } },
    { type: "image", attrs: { src: "x", onerror: "alert(1)" } },
    {
      type: "paragraph",
      content: [
        { type: "svg", attrs: { onload: "alert(1)" }, content: [text("s")] },
      ],
    }
  ),
  "unknown marks": docWith({
    type: "paragraph",
    content: [
      {
        type: "text",
        text: "x",
        marks: [
          { type: "span", attrs: { onclick: "alert(1)" } },
          { type: "textStyle", attrs: { style: "position:fixed;inset:0" } },
        ],
      },
    ],
  }),
  "on* and style attributes": docWith(
    {
      type: "paragraph",
      attrs: { onclick: "alert(1)", style: "position:fixed" },
      content: [
        {
          type: "text",
          text: "x",
          marks: [
            {
              type: "link",
              attrs: {
                href: "https://example.com",
                onmouseover: "alert(1)",
                style: "position:fixed",
                class: "fixed inset-0",
              },
            },
          ],
        },
      ],
    },
    {
      type: "orderedList",
      attrs: { start: 2, onclick: "alert(1)", type: "1 onclick=alert(1)" },
      content: [
        {
          type: "listItem",
          content: [{ type: "paragraph", content: [text("li")] }],
        },
      ],
    },
    {
      type: "codeBlock",
      attrs: { language: 'x" onmouseover="alert(1)', onclick: "alert(1)" },
      content: [text("code")],
    },
    {
      type: "heading",
      attrs: { level: "1 onclick=alert(1)", onclick: "alert(1)" },
      content: [text("h")],
    }
  ),
  "prototype member types": docWith(
    { type: "constructor", content: [text("a")] } as RichTextNode,
    { type: "__proto__", content: [text("b")] } as RichTextNode,
    { type: "toString", content: [text("c")] } as RichTextNode,
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "d",
          marks: [
            { type: "constructor" },
            { type: "__proto__" },
            { type: "valueOf" },
          ],
        },
      ],
    }
  ),
  "non-string types": {
    type: "doc",
    content: [
      { type: 1, content: [text("a")] },
      { type: null, content: [text("b")] },
      { type: { name: "paragraph" }, content: [text("c")] },
      { type: ["paragraph"], content: [text("d")] },
      { content: [text("e")] },
    ],
  },
};

/**
 * The legacy HTML payloads from the v0.23.0 security review (gap-v0230-sec),
 * plus a legitimate document. As strings, all of them must stay plain text.
 */
export const legacyHtml: Record<string, string> = {
  P01_img_onerror: `<p>hi</p><img src=x onerror="alert(1)">`,
  P02_svg_onload: `<svg><svg onload=alert(1)>`,
  P03_a_javascript: `<a href="javascript:alert(1)">x</a>`,
  P04_iframe_srcdoc: `<iframe srcdoc="<script>alert(1)</script>"></iframe>`,
  P05_details_ontoggle: `<details open ontoggle=alert(1)>`,
  P06_mxss_math_style: `<math><mtext><table><mglyph><style><img src=x onerror=alert(1)>`,
  P07_css_overlay: `<p style="position:fixed;inset:0;z-index:99999;background:url(https://evil.example/b)">x</p>`,
  P08_form_input: `<form action="https://evil.example"><input name=pw></form>`,
  P09_entity_js: `<a href="&#x6A;avascript:alert(1)">e</a>`,
  P10_deep_b5000: `<img src=x onerror="alert(1)">` + "<b>".repeat(5000) + "x",
  P11_noscript_mxss: `<noscript><p title="</noscript><img src=x onerror=alert(1)>"></noscript>`,
  P12_ctrl_js: `<a href="\u0001javascript:alert(1)">c</a>`,
  P13_legit: `<h2 style="text-align: center">Title</h2><p><strong>bold</strong> <a href="https://example.com">link</a></p>`,
  script_tag: `<script>alert(1)</script>`,
};

/** Every payload above as [description, value] pairs, for it.each. */
export const xssPayloads: [string, unknown][] = [
  ...Object.keys(tamperedJson).map((name): [string, unknown] => [
    `tampered JSON: ${name}`,
    tamperedJson[name],
  ]),
  ...Object.keys(legacyHtml).map((name): [string, unknown] => [
    `legacy HTML string: ${name}`,
    legacyHtml[name],
  ]),
];
```

建立 `packages/core/lib/richtext/__tests__/xss.spec.tsx`：

```tsx
import { cleanup, render } from "@testing-library/react";
import { renderToString } from "react-dom/server.node";
import { RichTextContent } from "../../../components/RichTextEditor/components/RichTextContent";
import { parseHtml } from "../__helpers__/dom";
import {
  expectSafe,
  legacyHtml,
  linkDoc,
  tamperedJson,
} from "../__helpers__/xss-payloads";

const renderBothWays = (content: unknown) => {
  const serverHtml = renderToString(<RichTextContent content={content} />);
  const { container } = render(<RichTextContent content={content} />);

  return { serverHtml, server: parseHtml(serverHtml), client: container };
};

describe("rich text XSS regression", () => {
  afterEach(cleanup);

  describe.each(Object.keys(tamperedJson))("tampered JSON: %s", (name) => {
    it("renders only allowed elements and attributes", () => {
      const { serverHtml, server, client } = renderBothWays(tamperedJson[name]);

      expect(serverHtml).not.toMatch(/<script/i);
      expectSafe(server);
      expectSafe(client);
    });
  });

  describe.each(Object.keys(legacyHtml))("legacy HTML string: %s", (name) => {
    it("renders the string as plain text", () => {
      const payload = legacyHtml[name];
      const { serverHtml, server, client } = renderBothWays(payload);

      expect(serverHtml).not.toMatch(/<script/i);

      for (const root of [server, client]) {
        expectSafe(root);

        const paragraphs = root.querySelectorAll(".rich-text > p");

        expect(paragraphs).toHaveLength(1);
        expect(paragraphs[0].children).toHaveLength(0);
        expect(paragraphs[0].textContent).toBe(payload);
      }
    });
  });

  it("keeps the text of removed links", () => {
    const { client } = renderBothWays(linkDoc("javascript:alert(1)"));

    expect(client.querySelector("a")).toBeNull();
    expect(client.textContent).toBe("click");
  });

  it("keeps safe links", () => {
    const { client } = renderBothWays(linkDoc("https://example.com"));

    expect(client.querySelector("a")?.getAttribute("href")).toBe(
      "https://example.com"
    );
  });
});
```

```bash
(cd packages/core && pnpm test lib/richtext/__tests__/render.spec.tsx lib/richtext/__tests__/xss.spec.tsx) 2>&1 | grep -E "^(PASS|FAIL)|Cannot find module|^Tests:"
```

預期失敗（檔案順序可能不同）：

```
FAIL lib/richtext/__tests__/xss.spec.tsx
    Cannot find module '../../../components/RichTextEditor/components/RichTextContent' from 'lib/richtext/__tests__/xss.spec.tsx'
FAIL lib/richtext/__tests__/render.spec.tsx
    Cannot find module '../../../components/RichTextEditor/components/RichTextContent' from 'lib/richtext/__tests__/render.spec.tsx'
Tests:       0 total
```

- [ ] **Step 11: 實作 `renderRichText`、`RichTextContent` 與 barrel**

建立 `packages/core/lib/richtext/render.tsx`：

```tsx
import {
  renderJSONContentToReactElement,
  type MarkProps,
  type NodeProps,
} from "@tiptap/static-renderer/json/react";
import { createElement, type ReactNode } from "react";
import { isSafeHref } from "./is-safe-href";
import { extractText, isTextAlign, normalizeRichText } from "./normalize";
import type { RichTextMark, RichTextNode } from "./types";

type NodeRenderer = (
  props: NodeProps<RichTextNode, ReactNode | ReactNode[]>
) => ReactNode;

type MarkRenderer = (
  props: MarkProps<RichTextMark, ReactNode | ReactNode[], RichTextNode>
) => ReactNode;

// Holds one mark around a run of inline nodes. Created by groupMarks after
// normalization, so stored content can never contain it.
const MARK_GROUP = "markGroup";

const HEADING_TAGS = ["h1", "h2", "h3", "h4", "h5", "h6"];

const stringAttr = (value: unknown) =>
  typeof value === "string" ? value : undefined;

const alignStyle = (node: RichTextNode) => {
  const textAlign = node.attrs?.textAlign;

  return isTextAlign(textAlign)
    ? { textAlign: textAlign as "left" | "center" | "right" | "justify" }
    : undefined;
};

const ORDERED_LIST_TYPES = new Set(["a", "A", "i", "I"]);

/**
 * Renderers for the PuckRichText schema. The objects have no prototype, so a
 * type such as "constructor" can never resolve to an inherited member.
 */
export const nodeMapping: Record<string, NodeRenderer> = Object.assign(
  Object.create(null),
  {
    doc: ({ children }) => <>{children}</>,
    [MARK_GROUP]: ({ children }) => <>{children}</>,
    text: ({ node }) => node.text ?? null,
    paragraph: ({ node, children }) => (
      <p style={alignStyle(node)}>{children}</p>
    ),
    heading: ({ node, children }) => {
      const level = node.attrs?.level;
      const tag =
        typeof level === "number" ? HEADING_TAGS[level - 1] ?? "h1" : "h1";

      return createElement(tag, { style: alignStyle(node) }, children);
    },
    blockquote: ({ children }) => <blockquote>{children}</blockquote>,
    bulletList: ({ children }) => <ul>{children}</ul>,
    orderedList: ({ node, children }) => {
      const { start, type } = node.attrs ?? {};

      return (
        <ol
          start={typeof start === "number" && start !== 1 ? start : undefined}
          type={
            typeof type === "string" && ORDERED_LIST_TYPES.has(type)
              ? (type as "a" | "A" | "i" | "I")
              : undefined
          }
        >
          {children}
        </ol>
      );
    },
    listItem: ({ children }) => <li>{children}</li>,
    codeBlock: ({ node, children }) => {
      const language = stringAttr(node.attrs?.language);

      return (
        <pre>
          <code className={language ? `language-${language}` : undefined}>
            {children}
          </code>
        </pre>
      );
    },
    hardBreak: () => <br />,
    horizontalRule: () => <hr />,
  } satisfies Record<string, NodeRenderer>
);

export const markMapping: Record<string, MarkRenderer> = Object.assign(
  Object.create(null),
  {
    bold: ({ children }) => <strong>{children}</strong>,
    italic: ({ children }) => <em>{children}</em>,
    underline: ({ children }) => <u>{children}</u>,
    strike: ({ children }) => <s>{children}</s>,
    code: ({ children }) => <code>{children}</code>,
    link: ({ mark, children }) => {
      const attrs = mark.attrs ?? {};

      // normalizeRichText already removed unsafe links; check again here
      if (!isSafeHref(attrs.href)) return <>{children}</>;

      return (
        <a
          href={attrs.href}
          target={stringAttr(attrs.target)}
          rel={stringAttr(attrs.rel)}
          title={stringAttr(attrs.title)}
        >
          {children}
        </a>
      );
    },
  } satisfies Record<string, MarkRenderer>
);

// Never reached after normalization; output text only, just in case
const unhandledNode: NodeRenderer = ({ node }) => extractText(node);
const unhandledMark: MarkRenderer = ({ children }) => <>{children}</>;

const sameMark = (a: RichTextMark, b: RichTextMark) => {
  if (a.type !== b.type) return false;

  const aAttrs = a.attrs ?? {};
  const bAttrs = b.attrs ?? {};
  const keys = Object.keys(aAttrs);

  return (
    keys.length === Object.keys(bAttrs).length &&
    keys.every((key) => aAttrs[key] === bAttrs[key])
  );
};

/**
 * Lifts the marks of inline nodes into MARK_GROUP nodes the same way
 * ProseMirror's DOMSerializer does: marks that adjacent nodes share stay open,
 * so "**a _b_**" renders as <strong>a <em>b</em></strong> and not as two
 * separate <strong> elements.
 */
const groupMarks = (content: RichTextNode[]): RichTextNode[] => {
  const root: RichTextNode[] = [];
  const open: { mark: RichTextMark; content: RichTextNode[] }[] = [];

  for (const node of content) {
    const { marks = [], ...rest } = node;
    let keep = 0;

    while (
      keep < open.length &&
      keep < marks.length &&
      sameMark(open[keep].mark, marks[keep])
    ) {
      keep++;
    }

    open.length = keep;

    for (const mark of marks.slice(keep)) {
      const group: RichTextNode = {
        type: MARK_GROUP,
        marks: [mark],
        content: [],
      };

      (open.length ? open[open.length - 1].content : root).push(group);
      open.push({ mark, content: group.content! });
    }

    (open.length ? open[open.length - 1].content : root).push(rest);
  }

  return root;
};

const toRenderTree = (node: RichTextNode): RichTextNode => {
  if (!node.content) return node;

  return {
    ...node,
    content:
      node.type === "paragraph" || node.type === "heading"
        ? groupMarks(node.content)
        : node.content.map(toRenderTree),
  };
};

/**
 * Renders rich text (Tiptap JSON, or a legacy string shown as plain text) to
 * React elements. The value is normalized first, so only the PuckRichText
 * schema can reach the output. Uses no hooks and no DOM, so it runs in React
 * Server Components, during SSR and on the client alike.
 */
export function renderRichText(value: unknown): ReactNode {
  const render = renderJSONContentToReactElement<RichTextMark, RichTextNode>({
    nodeMapping,
    markMapping,
    unhandledNode,
    unhandledMark,
  });

  return render({ content: toRenderTree(normalizeRichText(value)) });
}
```

建立 `packages/core/components/RichTextEditor/components/RichTextContent.tsx`：

```tsx
import getClassNameFactory from "../../../lib/get-class-name-factory";
import { renderRichText } from "../../../lib/richtext/render";
import styles from "../styles.module.css";

const getClassName = getClassNameFactory("RichTextEditor", styles);

/**
 * Displays rich text with the shared renderer. Uses no hooks, so it can be
 * rendered by React Server Components.
 */
export function RichTextContent({ content }: { content: unknown }) {
  return (
    <div className={getClassName()}>
      <div className="rich-text">{renderRichText(content)}</div>
    </div>
  );
}
```

建立 `packages/core/lib/richtext/index.ts`：

```ts
export type { RichTextDoc, RichTextMark, RichTextNode } from "./types";
export { isSafeHref } from "./is-safe-href";
export { normalizeRichText, RICHTEXT_MAX_DEPTH } from "./normalize";
export { textToRichText } from "./text-to-richtext";
export { renderRichText } from "./render";
```

```bash
(cd packages/core && pnpm test lib/richtext) 2>&1 | grep -E "^(PASS|FAIL)|✕|^Tests:"
```

預期（檔案順序可能不同）：

```
PASS lib/richtext/__tests__/normalize.spec.ts
PASS lib/richtext/__tests__/is-safe-href.spec.ts
PASS lib/richtext/__tests__/text-to-richtext.spec.ts
PASS lib/richtext/__tests__/xss.spec.tsx
PASS lib/richtext/__tests__/render.spec.tsx
Tests:       175 passed, 175 total
```

若一致性測試失敗，錯誤訊息會印出 `actual`（我們的輸出）與 `expected`（tiptap 的輸出），依差異調整 `render.tsx` 的 mapping，直到全部相同。

- [ ] **Step 12: 讓 typecheck 解析 `@tiptap/static-renderer/json/react`**

```bash
pnpm typecheck 2>&1 | grep -E "error TS" | sed 's/^ *//' | cut -c1-120
```

預期失敗（`moduleResolution: node` 看不到子路徑 exports）：

```
lib/richtext/render.tsx(5,8): error TS2307: Cannot find module '@tiptap/static-renderer/json/react' or its corresponding
```

`packages/core/tsconfig.json` 原始片段（逐字）：

```json
    "types": ["node", "jest", "@testing-library/jest-dom"]
  }
```

替換為：

```json
    "types": ["node", "jest", "@testing-library/jest-dom"],
    "paths": {
      "@tiptap/static-renderer/json/react": [
        "./node_modules/@tiptap/static-renderer/dist/json/react/index"
      ]
    }
  }
```

```bash
pnpm typecheck > /dev/null 2>&1; echo "typecheck=$?"
(cd packages/core && pnpm lint) 2>&1 | grep -E "✖|error"
pnpm exec prettier --check packages/core/lib/richtext packages/core/components/RichTextEditor
```

預期輸出：

```
typecheck=0
✖ 4 problems (0 errors, 4 warnings)
  0 errors and 4 warnings potentially fixable with the `--fix` option.
Checking formatting...
All matched files use Prettier code style!
```

lint 的 4 個 warning 是 Task 1 就存在的「Unused eslint-disable directive」，與本 task 無關；不可以出現 error。

- [ ] **Step 13: Commit**

```bash
git add packages/core/lib/richtext/render.tsx packages/core/lib/richtext/index.ts packages/core/components/RichTextEditor/components/RichTextContent.tsx packages/core/lib/richtext/__helpers__/xss-payloads.ts packages/core/lib/richtext/__tests__/render.spec.tsx packages/core/lib/richtext/__tests__/xss.spec.tsx packages/core/tsconfig.json
git status --short
git commit -m "feat(richtext): render rich text JSON with @tiptap/static-renderer" -m "renderRichText normalizes a value and renders it with the json/react static renderer, using prototype-free node and mark mappings for the PuckRichText schema. Inline marks are grouped the way ProseMirror's DOMSerializer groups them, so the output matches Tiptap's generateHTML. RichTextContent wraps the result in the rich text classes and uses no hooks, so it also renders in React Server Components. tsconfig paths point @tiptap/static-renderer/json/react at its types because moduleResolution node does not read package exports."
```

預期（commit 前的 `git status --short` 與 commit 結果；hash 會不同）：

```
A  packages/core/components/RichTextEditor/components/RichTextContent.tsx
A  packages/core/lib/richtext/__helpers__/xss-payloads.ts
A  packages/core/lib/richtext/__tests__/render.spec.tsx
A  packages/core/lib/richtext/__tests__/xss.spec.tsx
A  packages/core/lib/richtext/index.ts
A  packages/core/lib/richtext/render.tsx
M  packages/core/tsconfig.json
?? CLAUDE.md
[tzuchi/main <hash>] feat(richtext): render rich text JSON with @tiptap/static-renderer
 7 files changed, 667 insertions(+), 1 deletion(-)
 create mode 100644 packages/core/components/RichTextEditor/components/RichTextContent.tsx
 create mode 100644 packages/core/lib/richtext/__helpers__/xss-payloads.ts
 create mode 100644 packages/core/lib/richtext/__tests__/render.spec.tsx
 create mode 100644 packages/core/lib/richtext/__tests__/xss.spec.tsx
 create mode 100644 packages/core/lib/richtext/index.ts
 create mode 100644 packages/core/lib/richtext/render.tsx
```

- [ ] **Step 14: 反向驗證 XSS 測試確實抓得到漏洞，然後還原**

暫時讓 normalize 與 link mapping 接受任何字串 href，並讓 normalize 與渲染層的 `alignStyle` 都接受任何字串 `textAlign`（兩層都要關掉，否則另一層仍會擋下，textAlign 的測試就驗不到）：

```bash
perl -pi -e 's/if \(!isSafeHref\(attrs\.href\)\) return null;/if (typeof attrs.href !== "string") return null;/; s/textAlign: isTextAlign\(attrs\.textAlign\) \? attrs\.textAlign : null,/textAlign: attrs.textAlign ?? null,/' packages/core/lib/richtext/normalize.ts
perl -pi -e 's/if \(!isSafeHref\(attrs\.href\)\) return <>\{children\}<\/>;/if (typeof attrs.href !== "string") return <>{children}<\/>;/; s/return isTextAlign\(textAlign\)/return typeof textAlign === "string"/' packages/core/lib/richtext/render.tsx
git diff --stat
(cd packages/core && pnpm test lib/richtext/__tests__/xss.spec.tsx) 2>&1 | grep -E "^Tests:"
```

預期（11 個測試失敗：9 種惡意 href、「CSS injection through textAlign」、「keeps the text of removed links」）：

```
 packages/core/lib/richtext/normalize.ts | 6 +++---
 packages/core/lib/richtext/render.tsx   | 4 ++--
 2 files changed, 5 insertions(+), 5 deletions(-)
Tests:       11 failed, 20 passed, 31 total
```

若 `git diff --stat` 不是 `normalize.ts` 改 3 行（href 與兩處 textAlign）、`render.tsx` 改 2 行（link 的 href 與 `alignStyle`），表示 `perl` 沒有替換成功（例如貼上指令時跳脫字元被改掉），先檢查 `git diff` 再重跑。確認後還原：

```bash
git checkout -- packages/core/lib/richtext/normalize.ts packages/core/lib/richtext/render.tsx
git status --short
(cd packages/core && pnpm test lib/richtext/__tests__/xss.spec.tsx) 2>&1 | grep -E "^Tests:"
```

預期輸出：

```
?? CLAUDE.md
Tests:       31 passed, 31 total
```

- [ ] **Step 15: 完整驗證**

```bash
pnpm verify > "${TMPDIR:-/tmp}/tceditor-verify-task05.log" 2>&1
echo "exit=$?"
grep -E "Test Suites:|Tests:|Snapshots:|ℹ (tests|pass|fail)|> tsc|✖|Tasks:|All matched|^pnpm audit:|^GATED|^audit:gate (passed|FAILED)" "${TMPDIR:-/tmp}/tceditor-verify-task05.log"
```

預期輸出：

```
exit=0
@tzuchi/tceditor:test: Test Suites: 58 passed, 58 total
@tzuchi/tceditor:test: Tests:       458 passed, 458 total
@tzuchi/tceditor:test: Snapshots:   19 passed, 19 total
 Tasks:    1 successful, 1 total
ℹ tests 10
ℹ pass 10
ℹ fail 0
> tsc -p tsconfig.typecheck.json
demo:lint: ✖ 8 problems (0 errors, 8 warnings)
@tzuchi/tceditor:lint: ✖ 4 problems (0 errors, 4 warnings)
 Tasks:    3 successful, 3 total
All matched files use Prettier code style!
 Tasks:    3 successful, 3 total
pnpm audit: 69 advisories, 71 finding path(s). 105 package versions ship with packages/core, packages/plugin-heading-analyzer.
GATED (ships with a published package): 0 finding(s)
audit:gate passed: no advisories affect packages/core, packages/plugin-heading-analyzer (71 finding path(s) elsewhere are listed above).
```

`demo:lint` 與 `@tzuchi/tceditor:lint` 由 turbo 平行執行，兩行的順序可能互換（之後各 task 的 `pnpm verify` 相同）。與 Task 4 Step 10 相比：jest 多了 5 個 suite、175 個測試（53 → 58 個 suite，283 → 458 個測試），snapshot 數不變；隨套件出貨的套件版本從 104 變成 105（新增的 `@tiptap/static-renderer`），`GATED … 0 finding(s)` 不變。advisory 總數會隨資料庫更新而改變；`exit=0`、`105 package versions`、`GATED … 0 finding(s)` 與 `audit:gate passed` 必須相同。

### Task 6: 渲染路徑改用共用渲染器

目的：所有「顯示」richtext 的地方都改用 Task 5 的 `RichTextContent`（同步、無 hooks、無 `dangerouslySetInnerHTML`），移除 lazy 載入的 `RichTextRender`（`@tiptap/html` 的 `generateJSON`/`generateHTML`，伺服器端靠 happy-dom）與它不安全的 Suspense fallback `RichTextRenderFallback`。涵蓋：
- `components/RichTextEditor/lib/use-richtext-props.tsx`：公開頁的 `<Render>`（client）、`components/ServerRender`（RSC）、`components/SlotRender/server.tsx`、編輯器裡的 `DropZone` 與 Preview 的 root（`editor-page.tsx`）都透過它，改一處全部生效。
- `lib/field-transforms/default-transforms/rich-text-transform.tsx`：編輯器畫布的非編輯路徑（`contentEditable: false`、唯讀，以及 `contentEditable` 未設定時 `InlineEditorWrapper` 的提早 return）。

完成後，字串型的舊資料一律以純文字段落顯示（React escape，渲染期不解析 HTML）。demo 的資料目前仍是 HTML 字串，所以在 Task 9 轉成 JSON 之前，demo 會把 `<p>` 之類的標籤當文字顯示；這是預期的過渡狀態。編輯器的 inline 編輯與欄位面板（`EditorFallback`）在 Task 7 處理。

另外把 richtext API 從主入口（`bundle/core.ts`）與 RSC 入口（`bundle/rsc.tsx`）匯出，並量測公開頁的打包大小。

**執行位置**：主工作目錄，接在 Task 5 的最後一個 commit（`feat(richtext): render rich text JSON with @tiptap/static-renderer`）之後。

**注意**：
- `apps/demo` 透過 tsconfig `paths` 直接編譯 core 原始碼，Next 的型別檢查用 demo 自己的 tsconfig（同樣是 `"moduleResolution": "node"`），所以 demo 也要加上 `@tiptap/static-renderer/json/react` 的 `paths`（Step 8）。路徑同樣**不寫副檔名**：Next（Turbopack）也會讀 `paths`，指到 `.d.ts` 會讓 RSC 頁面在 prerender 時出現 `TypeError: (void 0) is not a function`；指到 `.js` 則型別檢查會因 `allowJs` 而報 implicit any。
- 既有測試 `components/Puck/__tests__/richtext.spec.tsx` 與 `components/ServerRender/__tests__/index.spec.tsx` 使用 HTML 字串，而且依賴舊行為（ServerRender 測試的 `<p>Hello world</p>` 其實是 `renderToString` 遇到 lazy 元件時走了不安全的 fallback 才得到的），全部改寫成 JSON，並新增「HTML 字串以純文字呈現」的測試。
- 刪除 `Render.tsx` 後，`@tiptap/html` 只剩測試在用；它與 `happy-dom` 留在 `dependencies`，Task 8 的轉換入口會用到。

**Files:**
- Modify:
  - `packages/core/components/RichTextEditor/lib/use-richtext-props.tsx`（整檔改寫）
  - `packages/core/lib/field-transforms/default-transforms/rich-text-transform.tsx`
  - `packages/core/bundle/core.ts`、`packages/core/bundle/rsc.tsx`
  - `apps/demo/tsconfig.json`
  - `CHANGELOG.md`
- Delete:
  - `packages/core/components/RichTextEditor/components/Render.tsx`
  - `packages/core/components/RichTextEditor/components/RenderFallback.tsx`
- Test:
  - `packages/core/components/Puck/__tests__/richtext.spec.tsx`（整檔改寫：JSON 資料，新增舊 HTML 字串測試；Task 7 會在檔尾再加一組）
  - `packages/core/components/ServerRender/__tests__/index.spec.tsx`（整檔改寫）
  - `packages/core/components/Render/__tests__/index.spec.tsx`（新增：client `Render` 與 `ServerRender` 的 `renderToString`，並禁止載入 happy-dom 與 `@tiptap/html`，對應規格 §9 第 7 項；Task 5 的 29 組 XSS payload 以 `renderToString` 送進兩者、以 client render 送進 `Render`，對應規格 §9 第 3 項；另有全域審查補上的「array／object 欄位中的 richtext」與「伺服器端輸出經 `hydrateRoot` 接手時沒有 mismatch」，見計畫開頭 Review Focus 第 1、2 項）
  - `packages/core/__tests__/richtext-exports.spec.ts`（新增）

**Interfaces:**
- Consumes（Task 5）：`RichTextContent({ content }: { content: unknown })`、`renderRichText`、`normalizeRichText`、`isSafeHref`、`textToRichText`、`RICHTEXT_MAX_DEPTH`、型別 `RichTextDoc`/`RichTextNode`/`RichTextMark`（經 `lib/richtext/index.ts`）；測試輔助 `lib/richtext/__helpers__/xss-payloads.ts` 的 `expectSafe`、`xssPayloads`。
- Produces：
  - `useRichtextProps(fields, props)` 簽名不變，richtext 欄位改為同步輸出 `<RichTextContent key={path.join(".")} content={value} />`（Task 7 不再修改它）。
  - 公開 API（`@tzuchi/tceditor` 與 `@tzuchi/tceditor/rsc`）：`normalizeRichText`、`isSafeHref`、`textToRichText`、`renderRichText`、`RichTextContent`、`RICHTEXT_MAX_DEPTH`、型別 `RichTextDoc`、`RichTextNode`、`RichTextMark`。Task 9 的 demo 用 `textToRichText`。
  - `apps/demo/tsconfig.json` 的 `paths` 新增 `@tiptap/static-renderer/json/react`。
  - `CHANGELOG.md` 清單最後一行變成本 task Step 14 加入的那一行，Task 7 以它為原始片段。
  - 打包量測腳本 `${TMPDIR:-/tmp}/measure-public-bundle.mjs`（暫存檔，不 commit；Task 9 再用一次）與改動前的基準數字。

- [ ] **Step 1: 確認起點**

```bash
cd /Users/kaellim/Desktop/projects/puck
git status --short
git log --oneline -1
```

預期（hash 會不同）：

```
?? CLAUDE.md
<hash> feat(richtext): render rich text JSON with @tiptap/static-renderer
```

- [ ] **Step 2: 量測改動前公開頁的打包大小（基準）**

量測方式：用 esbuild 以瀏覽器設定打包「只 import 主入口的 `Render`」的進入點（等同 client 端公開頁），React 設為 external、啟用 code splitting，分別計算初始 chunk（靜態 import 可達）與包含 lazy chunk 的總和的 gzip 大小。腳本是暫存檔，不 commit。

```bash
cat > "${TMPDIR:-/tmp}/measure-public-bundle.mjs" <<'EOF'
// Usage: node measure-public-bundle.mjs <packages/core directory>
// Bundles `export { Render }` from the built main entry the way a client-side
// public page would, and prints the gzip size of the initial and lazy chunks.
import { createRequire } from "node:module";
import { gzipSync } from "node:zlib";
import { join, resolve } from "node:path";

const coreDir = resolve(process.argv[2] ?? ".");
const { build } = createRequire(join(coreDir, "package.json"))("esbuild");
const result = await build({
  stdin: {
    contents: `export { Render } from "./dist/index.mjs";`,
    resolveDir: coreDir,
    loader: "js",
  },
  absWorkingDir: coreDir,
  bundle: true,
  minify: true,
  format: "esm",
  splitting: true,
  platform: "browser",
  outdir: "out",
  write: false,
  metafile: true,
  logLevel: "silent",
  external: ["react", "react-dom", "react/jsx-runtime"],
});

const outputs = result.metafile.outputs;
const sizes = new Map(
  result.outputFiles.map((file) => [
    file.path.slice(join(coreDir, "out").length + 1),
    gzipSync(file.contents).length,
  ])
);
const entry = Object.keys(outputs).find((key) => outputs[key].entryPoint);
const initial = new Set();
const visit = (key) => {
  if (initial.has(key)) return;
  initial.add(key);
  for (const dep of outputs[key].imports) {
    if (dep.kind === "import-statement" && !dep.external) visit(dep.path);
  }
};
visit(entry);
const kb = (bytes) => (bytes / 1024).toFixed(1);
let initialBytes = 0;
let totalBytes = 0;
for (const key of Object.keys(outputs)) {
  if (!key.endsWith(".js")) continue;
  const gz = sizes.get(key.slice("out/".length)) ?? 0;
  totalBytes += gz;
  if (initial.has(key)) initialBytes += gz;
}
console.log(`initial: ${kb(initialBytes)} KB gzip`);
console.log(`total (with lazy chunks): ${kb(totalBytes)} KB gzip`);
EOF
pnpm --filter @tzuchi/tceditor build > /dev/null 2>&1; echo "build=$?"
node "${TMPDIR:-/tmp}/measure-public-bundle.mjs" packages/core
```

預期（記下這兩個數字，Step 13 比較；小數點後一位可能略有不同）：

```
build=0
initial: 167.4 KB gzip
total (with lazy chunks): 291.5 KB gzip
```

- [ ] **Step 3: 改寫 `Puck` 的 richtext 測試為 JSON**

整檔改寫 `packages/core/components/Puck/__tests__/richtext.spec.tsx`。與原檔相比：新增 `richText(text)` 輔助函式，所有 HTML 字串改成 JSON；最後一個測試改名為 `updates richtext when value is set to a plain string`；新增 `shows a legacy HTML string as plain text instead of parsing it`。其餘 mock 與 `dispatchReplace` 不變。

`packages/core/components/Puck/__tests__/richtext.spec.tsx` 的完整新內容：

```tsx
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { Config, Data } from "../../../types";
import "@testing-library/jest-dom";

jest.mock("../styles.module.css");

jest.mock("@dnd-kit/react", () => {
  const original = jest.requireActual("@dnd-kit/react");
  return {
    ...original,
    DragDropProvider: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ),
    useDroppable: () => ({
      ref: () => undefined,
      setNodeRef: () => undefined,
      isOver: false,
    }),
    useDraggable: () => ({
      attributes: {},
      listeners: {},
      setNodeRef: () => undefined,
      isDragging: false,
    }),
  };
});

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }),
});

class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(global as any).ResizeObserver = ResizeObserver;

const originalConsoleError = console.error;
jest.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
  if (
    args.some((arg) => String(arg).includes("Could not parse CSS stylesheet"))
  ) {
    return;
  }
  originalConsoleError(...(args as Parameters<typeof console.error>));
});

jest.spyOn(console, "warn").mockImplementation(() => {});

import { Puck } from "../index";
import { AppStoreApi } from "../../../store";

type PuckInternal = {
  appStore: AppStoreApi;
};

const getInternal = () => {
  return (window as any).__PUCK_INTERNAL_DO_NOT_USE as PuckInternal;
};

const flush = () => act(async () => {});

const dispatchReplace = (
  appStore: AppStoreApi,
  componentId: string,
  data: any
) => {
  const node = appStore.getState().state.indexes.nodes[componentId];
  const zoneCompound = `${node.parentId}:${node.zone}`;
  const index = appStore
    .getState()
    .state.indexes.zones[zoneCompound].contentIds.indexOf(componentId);

  appStore.getState().dispatch({
    type: "replace",
    data,
    destinationIndex: index,
    destinationZone: zoneCompound,
  });
};

const richText = (text: string) => ({
  type: "doc",
  content: [
    {
      type: "paragraph",
      attrs: { textAlign: null },
      content: [{ type: "text", text }],
    },
  ],
});

describe("Puck - richtext programmatic updates", () => {
  afterEach(() => {
    cleanup();
  });

  it("updates the preview when a richtext field is changed via dispatch", async () => {
    const config: Config = {
      components: {
        RichTextBlock: {
          fields: {
            body: { type: "richtext", contentEditable: false },
          },
          render: ({ body }) => <div data-testid="richtext-output">{body}</div>,
        },
      },
    };

    const data: Data = {
      root: { props: {} },
      content: [
        {
          type: "RichTextBlock",
          props: { id: "block-1", body: richText("Hello world") },
        },
      ],
    };

    render(<Puck config={config} data={data} iframe={{ enabled: false }} />);
    await flush();

    await waitFor(() => {
      expect(screen.getByText("Hello world")).toBeInTheDocument();
    });

    const { appStore } = getInternal();

    act(() => {
      dispatchReplace(appStore, "block-1", {
        type: "RichTextBlock",
        props: { id: "block-1", body: richText("Updated content") },
      });
    });
    await flush();

    await waitFor(() => {
      expect(screen.getByText("Updated content")).toBeInTheDocument();
    });
    expect(screen.queryByText("Hello world")).not.toBeInTheDocument();
  });

  it("updates the preview when a contentEditable richtext field is changed via dispatch", async () => {
    const config: Config = {
      components: {
        RichTextBlock: {
          fields: {
            body: { type: "richtext" },
          },
          render: ({ body }) => <div data-testid="richtext-output">{body}</div>,
        },
      },
    };

    const data: Data = {
      root: { props: {} },
      content: [
        {
          type: "RichTextBlock",
          props: { id: "block-1", body: richText("Hello world") },
        },
      ],
    };

    render(<Puck config={config} data={data} iframe={{ enabled: false }} />);
    await flush();

    await waitFor(() => {
      expect(screen.getByText("Hello world")).toBeInTheDocument();
    });

    const { appStore } = getInternal();

    act(() => {
      dispatchReplace(appStore, "block-1", {
        type: "RichTextBlock",
        props: { id: "block-1", body: richText("Updated content") },
      });
    });
    await flush();

    await waitFor(() => {
      expect(screen.getByText("Updated content")).toBeInTheDocument();
    });
    expect(screen.queryByText("Hello world")).not.toBeInTheDocument();
  });

  it("updates richtext when value transitions from empty string to content", async () => {
    const config: Config = {
      components: {
        Block: {
          fields: {
            body: { type: "richtext", contentEditable: false },
          },
          render: ({ body }) => <div data-testid="output">{body}</div>,
        },
      },
    };

    const data: Data = {
      root: { props: {} },
      content: [
        {
          type: "Block",
          props: { id: "block-1", body: "" },
        },
      ],
    };

    render(<Puck config={config} data={data} iframe={{ enabled: false }} />);
    await flush();

    const { appStore } = getInternal();

    act(() => {
      dispatchReplace(appStore, "block-1", {
        type: "Block",
        props: { id: "block-1", body: richText("No longer empty") },
      });
    });
    await flush();

    await waitFor(() => {
      expect(screen.getByText("No longer empty")).toBeInTheDocument();
    });
  });

  it("updates richtext when value is set to a plain string", async () => {
    const config: Config = {
      components: {
        Block: {
          fields: {
            body: { type: "richtext", contentEditable: false },
          },
          render: ({ body }) => <div data-testid="output">{body}</div>,
        },
      },
    };

    const data: Data = {
      root: { props: {} },
      content: [
        {
          type: "Block",
          props: { id: "block-1", body: richText("JSON content") },
        },
      ],
    };

    render(<Puck config={config} data={data} iframe={{ enabled: false }} />);
    await flush();

    await waitFor(() => {
      expect(screen.getByText("JSON content")).toBeInTheDocument();
    });

    const { appStore } = getInternal();

    act(() => {
      dispatchReplace(appStore, "block-1", {
        type: "Block",
        props: { id: "block-1", body: "Plain text value" },
      });
    });
    await flush();

    await waitFor(() => {
      expect(screen.getByText("Plain text value")).toBeInTheDocument();
    });
  });

  it("shows a legacy HTML string as plain text instead of parsing it", async () => {
    const payload = '<p>Hello</p><img src=x onerror="alert(1)">';
    const config: Config = {
      components: {
        Block: {
          fields: {
            body: { type: "richtext", contentEditable: false },
          },
          render: ({ body }) => <div data-testid="output">{body}</div>,
        },
      },
    };

    const data: Data = {
      root: { props: {} },
      content: [{ type: "Block", props: { id: "block-1", body: payload } }],
    };

    render(<Puck config={config} data={data} iframe={{ enabled: false }} />);
    await flush();

    const output = await screen.findByTestId("output");

    expect(output.querySelector("img")).toBeNull();
    expect(output.textContent).toBe(payload);
  });
});
```

- [ ] **Step 4: 改寫 `ServerRender` 測試、新增 `Render` 測試**

`packages/core/components/ServerRender/__tests__/index.spec.tsx` 的完整新內容：

```tsx
import { renderToString } from "react-dom/server.node";
import { Config, Data } from "../../../types";
import { Render } from "../index";

const richText = (...content: object[]) => ({
  type: "doc",
  content: [{ type: "paragraph", attrs: { textAlign: null }, content }],
});

describe("ServerRender", () => {
  it("renders richtext content in dropzones as HTML in RSC mode", () => {
    const config: Config = {
      components: {
        Section: {
          fields: {},
          render: ({ puck }) => (
            <div>{puck.renderDropZone({ zone: "content" })}</div>
          ),
        },
        RichText: {
          fields: {
            content: { type: "richtext" },
          },
          render: ({ content }) => <div>{content}</div>,
        },
      },
    };

    const data: Data = {
      root: { props: {} },
      content: [{ type: "Section", props: { id: "section-1" } }],
      zones: {
        "section-1:content": [
          {
            type: "RichText",
            props: {
              id: "richtext-1",
              content: richText({ type: "text", text: "Hello world" }),
            },
          },
        ],
      },
    };

    const html = renderToString(<Render config={config} data={data} />);

    expect(html).toContain(
      '<div class="RichTextEditor"><div class="rich-text"><p>Hello world</p></div></div>'
    );
  });

  it("renders richtext and slot content when server config keeps render fields", () => {
    const config: Config = {
      components: {
        Hero: {
          fields: {
            description: { type: "richtext" },
            image: {
              type: "object",
              objectFields: {
                content: { type: "slot" },
              },
            },
          },
          render: ({ description, image }) => (
            <section>
              <div>{description}</div>
              {image?.content ? <image.content /> : null}
            </section>
          ),
        },
        Heading: {
          fields: {
            title: { type: "text" },
          },
          render: ({ title }) => <h2>{title}</h2>,
        },
      },
    };

    const data: Data = {
      root: { props: {} },
      content: [
        {
          type: "Hero",
          props: {
            id: "hero-1",
            description: richText(
              { type: "text", text: "Hello " },
              { type: "text", text: "world", marks: [{ type: "bold" }] }
            ),
            image: {
              content: [
                {
                  type: "Heading",
                  props: {
                    id: "heading-1",
                    title: "Nested heading",
                  },
                },
              ],
            },
          },
        },
      ],
    };

    const html = renderToString(<Render config={config} data={data} />);

    expect(html).toContain("<p>Hello <strong>world</strong></p>");
    expect(html).toContain("<h2>Nested heading</h2>");
  });

  it("renders a legacy HTML string as escaped text", () => {
    const config: Config = {
      components: {
        RichText: {
          fields: {
            content: { type: "richtext" },
          },
          render: ({ content }) => <div>{content}</div>,
        },
      },
    };

    const data: Data = {
      root: { props: {} },
      content: [
        {
          type: "RichText",
          props: {
            id: "richtext-1",
            content: '<p>Hello</p><img src=x onerror="alert(1)">',
          },
        },
      ],
    };

    const html = renderToString(<Render config={config} data={data} />);

    expect(html).toContain(
      "<p>&lt;p&gt;Hello&lt;/p&gt;&lt;img src=x onerror=&quot;alert(1)&quot;&gt;</p>"
    );
    expect(html).not.toContain("<img");
  });
});
```

建立 `packages/core/components/Render/__tests__/index.spec.tsx`（`jest.mock` 的工廠會被提升到檔案最上方；`ResizeObserver` 必須在 import `Render` 之前定義，因為 `@dnd-kit/dom` 載入時就會讀取它；本檔禁止載入 `@tiptap/html`，所以不 import 會載入它的 `__helpers__/dom.ts`，改用 `<template>` 解析伺服器端輸出；`__helpers__/fixtures.ts` 只 import 型別，可以使用）。除了 richtext 基本案例與 29 組 payload，本檔另有全域審查補上的兩種情況（計畫開頭 Review Focus 第 1、2 項）：`Cards` 元件把 richtext 放在 `array` 與 `object` 欄位裡，`Render` 與 `ServerRender` 都要對每個巢狀值輸出共用渲染器的結果；`hydrates the server-rendered page without a mismatch` 把 `renderToString` 的輸出放進 DOM，再以 `hydrateRoot` 接手，不得出現任何 recoverable error 或 `console.error`，hydrate 前後的 DOM 也必須完全相同：

```tsx
import { act, cleanup, render } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server.node";
import { Config, Data } from "../../../types";
import { allTypicalContent } from "../../../lib/richtext/__helpers__/fixtures";
import {
  expectSafe,
  xssPayloads,
} from "../../../lib/richtext/__helpers__/xss-payloads";

// Rendering rich text must not need a DOM implementation or Tiptap's HTML
// utilities, so these modules throw if anything loads them.
jest.mock("happy-dom", () => {
  throw new Error("happy-dom must not be loaded while rendering");
});
jest.mock("@tiptap/html", () => {
  throw new Error("@tiptap/html must not be loaded while rendering");
});

// @dnd-kit/dom reads ResizeObserver when it is imported
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(global as any).ResizeObserver = ResizeObserver;

import { Render } from "../index";
import { Render as ServerRender } from "../../ServerRender";

const richText = (text: string) => ({
  type: "doc",
  content: [
    {
      type: "paragraph",
      attrs: { textAlign: "center" },
      content: [{ type: "text", text }],
    },
  ],
});

const config: Config = {
  root: {
    fields: { intro: { type: "richtext" } },
    render: ({ intro, children }) => (
      <main>
        <header>{intro}</header>
        {children}
      </main>
    ),
  },
  components: {
    RichText: {
      fields: { body: { type: "richtext" } },
      render: ({ body }) => <article>{body}</article>,
    },
    Cards: {
      fields: {
        cards: { type: "array", arrayFields: { body: { type: "richtext" } } },
        footer: {
          type: "object",
          objectFields: { note: { type: "richtext" } },
        },
      },
      render: ({ cards, footer }) => (
        <section>
          {cards.map(({ body }: { body: unknown }, index: number) => (
            <div key={index}>{body as React.ReactNode}</div>
          ))}
          <footer>{footer.note}</footer>
        </section>
      ),
    },
  },
};

const data = (body: unknown): Data => ({
  root: { props: { intro: richText("Intro") } },
  content: [{ type: "RichText", props: { id: "richtext-1", body } }],
});

const parse = (html: string) => {
  const template = document.createElement("template");
  template.innerHTML = html;

  return template.content;
};

/**
 * Checks the rich text in a page rendered from data(body): it passes
 * expectSafe, a legacy string is one plain text paragraph, and a tampered
 * document still shows its text.
 */
const expectSafePage = (root: ParentNode, body: unknown) => {
  for (const richText of Array.from(root.querySelectorAll(".RichTextEditor"))) {
    expectSafe(richText);
  }

  const blocks = root.querySelectorAll("article .rich-text > *");

  if (typeof body === "string") {
    expect(blocks).toHaveLength(1);
    expect(blocks[0].tagName).toBe("P");
    expect(blocks[0].children).toHaveLength(0);
    expect(blocks[0].textContent).toBe(body);
  } else {
    expect(blocks.length).toBeGreaterThan(0);
  }
};

describe.each([
  ["Render", Render],
  ["ServerRender", ServerRender],
])("%s on the server", (_, Component) => {
  it("renders richtext JSON in components and in the root", () => {
    const html = renderToString(
      <Component config={config} data={data(richText("Body"))} />
    );

    expect(html).toContain(
      '<header><div class="RichTextEditor"><div class="rich-text"><p style="text-align:center">Intro</p></div></div></header>'
    );
    expect(html).toContain(
      '<article><div class="RichTextEditor"><div class="rich-text"><p style="text-align:center">Body</p></div></div></article>'
    );
  });

  it("renders a legacy HTML string as plain text", () => {
    const html = renderToString(
      <Component
        config={config}
        data={data('<p>Hi</p><img src=x onerror="alert(1)">')}
      />
    );

    expect(html).toContain(
      "<p>&lt;p&gt;Hi&lt;/p&gt;&lt;img src=x onerror=&quot;alert(1)&quot;&gt;</p>"
    );
    expect(html).not.toContain("<img");
  });

  it("renders richtext inside array and object fields", () => {
    const html = renderToString(
      <Component
        config={config}
        data={{
          root: { props: {} },
          content: [
            {
              type: "Cards",
              props: {
                id: "cards-1",
                cards: [{ body: richText("First") }, { body: "<b>Second</b>" }],
                footer: { note: richText("Note") },
              },
            },
          ],
        }}
      />
    );

    expect(html).toContain(
      '<div><div class="RichTextEditor"><div class="rich-text"><p style="text-align:center">First</p></div></div></div>'
    );
    expect(html).toContain(
      '<div><div class="RichTextEditor"><div class="rich-text"><p>&lt;b&gt;Second&lt;/b&gt;</p></div></div></div>'
    );
    expect(html).toContain(
      '<footer><div class="RichTextEditor"><div class="rich-text"><p style="text-align:center">Note</p></div></div></footer>'
    );
  });

  it.each(xssPayloads)("renders %s safely", (_, body) => {
    const html = renderToString(
      <Component config={config} data={data(body)} />
    );

    expect(html).not.toMatch(/<script/i);
    expectSafePage(parse(html), body);
  });
});

describe("Render on the client", () => {
  afterEach(cleanup);

  it("hydrates the server-rendered page without a mismatch", async () => {
    const page = <Render config={config} data={data(allTypicalContent)} />;
    const container = document.createElement("div");

    container.innerHTML = renderToString(page);
    document.body.appendChild(container);

    const serverDom = container.innerHTML;
    const errors: unknown[] = [];
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation((...args) => errors.push(args));

    const root = await act(async () =>
      hydrateRoot(container, page, {
        onRecoverableError: (error) => errors.push(error),
      })
    );

    consoleError.mockRestore();

    expect(errors).toEqual([]);
    expect(container.innerHTML).toBe(serverDom);

    act(() => root.unmount());
    container.remove();
  });

  it.each(xssPayloads)("renders %s safely", (_, body) => {
    const { container } = render(<Render config={config} data={data(body)} />);

    expectSafePage(container, body);
  });
});
```

- [ ] **Step 5: 執行，確認新測試在舊實作下失敗**

`Render` 測試的 87 個 payload 測試（29 組 × 伺服器端 `Render`、伺服器端 `ServerRender`、client 端 `Render`）只依類別列出通過／失敗的個數，其餘測試逐一列出：

```bash
(cd packages/core && pnpm test --verbose components/Puck/__tests__/richtext.spec.tsx components/ServerRender components/Render/__tests__) > "${TMPDIR:-/tmp}/tceditor-task06-tests.log" 2>&1
grep -E "^(PASS|FAIL)|✓|✕|^Tests:" "${TMPDIR:-/tmp}/tceditor-task06-tests.log" | grep -v -E "renders (tampered JSON|legacy HTML string): .* safely" | sed -E 's/ \([0-9]+ ms\)//; s/ \([0-9.]+ s\)//'
grep -E "^ +[✓✕] renders (tampered JSON|legacy HTML string): .* safely" "${TMPDIR:-/tmp}/tceditor-task06-tests.log" | sed -E 's/^ *([✓✕]) renders (tampered JSON|legacy HTML string): .*/\1 \2/' | sort | uniq -c
```

預期失敗（測試順序可能不同）：

```
FAIL components/ServerRender/__tests__/index.spec.tsx
    ✕ renders richtext content in dropzones as HTML in RSC mode
    ✓ renders richtext and slot content when server config keeps render fields
    ✕ renders a legacy HTML string as escaped text
FAIL components/Puck/__tests__/richtext.spec.tsx
    ✓ updates the preview when a richtext field is changed via dispatch
    ✓ updates the preview when a contentEditable richtext field is changed via dispatch
    ✓ updates richtext when value transitions from empty string to content
    ✓ updates richtext when value is set to a plain string
    ✕ shows a legacy HTML string as plain text instead of parsing it
FAIL components/Render/__tests__/index.spec.tsx
    ✕ renders richtext JSON in components and in the root
    ✕ renders a legacy HTML string as plain text
    ✕ renders richtext inside array and object fields
    ✕ renders richtext JSON in components and in the root
    ✕ renders a legacy HTML string as plain text
    ✕ renders richtext inside array and object fields
    ✕ hydrates the server-rendered page without a mismatch
Tests:       97 failed, 5 passed, 102 total
  42 ✕ legacy HTML string
  45 ✕ tampered JSON
```

失敗原因：舊實作把 HTML 字串交給 tiptap 解析（或在伺服器端走 `dangerouslySetInnerHTML` 的 fallback），所以「當作純文字」的測試都失敗；`renderToString` 遇到還沒載入的 lazy `RichTextRender` 只會輸出 fallback，而 fallback 把 JSON 物件當 HTML 輸出成 `[object Object]`，所以伺服器端的 JSON 測試也失敗。`Render` 的 87 個 payload 測試全部失敗：最後兩行是依類別統計的個數（14 組舊 HTML 字串 × 3 = 42、15 組竄改 JSON × 3 = 45）。舊 HTML 字串經 fallback 原樣進入 DOM（`img onerror` 等元素直接出現）；竄改的 JSON 被輸出成 `[object Object]`，`article .rich-text` 裡沒有任何區塊。兩種情況在舊實作下會通過，屬正常：`Puck` 測試中的 JSON 案例（client 端最後會載入 lazy 元件），以及 `ServerRender` 的第二個測試（同一個檔案的第一個測試已觸發 lazy 載入，之後就能同步渲染）。全域審查補上的兩個測試（Review Focus 第 1、2 項）同樣失敗：`renders richtext inside array and object fields` 在伺服器端只拿到 fallback；`hydrates the server-rendered page without a mismatch` 在 client 端 hydrate 時要載入 lazy `RichTextRender`，而本檔禁止載入 `@tiptap/html`。

- [ ] **Step 6: 改寫 `useRichtextProps`、`rich-text-transform`，刪除舊的渲染器**

`use-richtext-props.tsx` 不再需要 `field`（共用渲染器不讀欄位設定），所以只收集路徑。整檔改寫：

`packages/core/components/RichTextEditor/lib/use-richtext-props.tsx` 的完整新內容：

```tsx
import { useMemo } from "react";
import { BaseField, Fields, WithPuckProps } from "../../../types";
import { RichTextContent } from "../components/RichTextContent";
import { mapDeep } from "./mapDeep";

export function useRichtextProps(
  fields:
    | Fields<any, {}>
    | Fields<any, { type: string } & BaseField>
    | undefined,
  props: WithPuckProps<{
    [x: string]: any;
  }>
) {
  const findAllRichtextPaths = (
    fields:
      | Fields<any, {}>
      | Fields<any, { type: string } & BaseField>
      | undefined,
    path: string[] = []
  ): string[][] => {
    if (!fields) return [];

    const result: string[][] = [];

    for (const [key, field] of Object.entries(fields)) {
      const currentPath = [...path, key];

      if (field.type === "richtext") {
        result.push(currentPath);
      }

      if (field.type === "array" && "arrayFields" in field) {
        result.push(...findAllRichtextPaths(field.arrayFields, currentPath));
      }

      if (field.type === "object" && "objectFields" in field) {
        result.push(...findAllRichtextPaths(field.objectFields, currentPath));
      }
    }

    return result;
  };

  const richtextPaths = useMemo(() => findAllRichtextPaths(fields), [fields]);

  const richtextProps = useMemo(() => {
    if (!richtextPaths?.length) return {};

    let result = { ...props };

    for (const path of richtextPaths) {
      result = mapDeep(result, path, (content) => (
        // Deterministic key to avoid hydration mismatch. No array index needed
        // because mapDeep places each element in a separate array object, not as siblings.
        <RichTextContent key={path.join(".")} content={content} />
      ));
    }

    return result;
  }, [richtextPaths, props]);

  return richtextProps;
}
```

`packages/core/lib/field-transforms/default-transforms/rich-text-transform.tsx` 第 1 處（import），原始片段（逐字）：

```tsx
import { EditorFallback } from "../../../components/RichTextEditor/components/EditorFallback";
import { RichTextRenderFallback } from "../../../components/RichTextEditor/components/RenderFallback";
```

替換為：

```tsx
import { EditorFallback } from "../../../components/RichTextEditor/components/EditorFallback";
import { RichTextContent } from "../../../components/RichTextEditor/components/RichTextContent";
```

第 2 處（刪除 lazy 的 `RichTextRender`；`lazy` 與 `Suspense` 仍供 `Editor` 使用，import 不動），原始片段（逐字）：

```tsx
const RichTextRender = lazy(() =>
  import("../../../components/RichTextEditor/components/Render").then((m) => ({
    default: m.RichTextRender,
  }))
);

const InlineEditorWrapper = memo(
```

替換為：

```tsx
const InlineEditorWrapper = memo(
```

第 3 處（`InlineEditorWrapper` 的非編輯路徑），原始片段（逐字）：

```tsx
    if (!field.contentEditable)
      return (
        <Suspense fallback={<RichTextRenderFallback content={value} />}>
          <RichTextRender content={value} field={field} />
        </Suspense>
      );
```

替換為：

```tsx
    if (!field.contentEditable) return <RichTextContent content={value} />;
```

第 4 處（`getRichTextTransform` 的唯讀路徑），原始片段（逐字）：

```tsx
      return <RichTextRender content={value} field={field} />;
```

替換為：

```tsx
      return <RichTextContent content={value} />;
```

```bash
git rm -q packages/core/components/RichTextEditor/components/Render.tsx packages/core/components/RichTextEditor/components/RenderFallback.tsx
git grep -n -e "RichTextRender" -e "RenderFallback" -- packages/core || echo "no references left"
pnpm exec prettier --check packages/core/components packages/core/lib
```

預期輸出：

```
no references left
Checking formatting...
All matched files use Prettier code style!
```

- [ ] **Step 7: 執行測試，確認通過；確認 richtext 渲染路徑已不使用 `dangerouslySetInnerHTML`**

```bash
(cd packages/core && pnpm test --verbose components/Puck/__tests__/richtext.spec.tsx components/ServerRender components/Render/__tests__) 2>&1 | grep -E "^(PASS|FAIL)|✕|^Tests:"
git grep -n "dangerouslySetInnerHTML" -- packages/core ':!*.spec.*' ':!*.md'
```

預期輸出：

```
PASS components/ServerRender/__tests__/index.spec.tsx
PASS components/Render/__tests__/index.spec.tsx
PASS components/Puck/__tests__/richtext.spec.tsx
Tests:       102 passed, 102 total
packages/core/components/DropZone/index.tsx:89:      <div dangerouslySetInnerHTML={{ __html: element.outerHTML }} />
packages/core/components/RichTextEditor/components/EditorFallback.tsx:24:        dangerouslySetInnerHTML={{ __html: props.content }}
```

剩下兩處：`DropZone/index.tsx` 是把既有 DOM 元素的 `outerHTML` 複製一份（與 richtext 無關，不在本 task 範圍）；`EditorFallback.tsx` 是編輯器載入前的暫時畫面，Task 7 改掉，並加上防止回歸的測試。

- [ ] **Step 8: 讓 demo 的型別檢查找得到 static-renderer**

```bash
pnpm --filter demo build > "${TMPDIR:-/tmp}/tceditor-demo-build.log" 2>&1; echo "exit=$?"
grep -E "Type error|Cannot find module" "${TMPDIR:-/tmp}/tceditor-demo-build.log" | cut -c1-110
```

預期失敗：

```
exit=1
Type error: Cannot find module '@tiptap/static-renderer/json/react' or its corresponding type declarations.
```

`apps/demo/tsconfig.json` 原始片段（逐字）：

```json
      "@/plugin-heading-analyzer/*": [
        "../../packages/plugin-heading-analyzer/*"
      ]
    }
```

替換為：

```json
      "@/plugin-heading-analyzer/*": [
        "../../packages/plugin-heading-analyzer/*"
      ],
      "@tiptap/static-renderer/json/react": [
        "../../packages/core/node_modules/@tiptap/static-renderer/dist/json/react/index"
      ]
    }
```

```bash
pnpm --filter demo build > "${TMPDIR:-/tmp}/tceditor-demo-build.log" 2>&1; echo "exit=$?"
grep -E "Finished TypeScript|Generating static pages.*\(4/4\)|/rsc" "${TMPDIR:-/tmp}/tceditor-demo-build.log" | sed -E 's/ in [0-9.]+m?s//'
```

預期輸出：

```
exit=0
  Finished TypeScript ...
✓ Generating static pages using 9 workers (4/4)
├ ○ /rsc
```

- [ ] **Step 9: Commit 渲染路徑的修改**

```bash
git add packages/core/components/RichTextEditor/lib/use-richtext-props.tsx packages/core/lib/field-transforms/default-transforms/rich-text-transform.tsx packages/core/components/Puck/__tests__/richtext.spec.tsx packages/core/components/ServerRender/__tests__/index.spec.tsx packages/core/components/Render/__tests__/index.spec.tsx apps/demo/tsconfig.json
git status --short
git commit -m "fix(richtext): render richtext through the shared static renderer" -m "Every place that displays richtext now renders it synchronously with RichTextContent: Render, the RSC Render, slots, DropZone, the preview root and the read-only canvas. The lazy RichTextRender (generateJSON/generateHTML, happy-dom on the server) and its RichTextRenderFallback, which passed the stored HTML to dangerouslySetInnerHTML, are removed. Legacy HTML strings are now shown as plain text and never parsed. The demo tsconfig maps @tiptap/static-renderer/json/react for its type check." -m "Fixes the stored XSS through the richtext render fallback (sec-render-01, sec-data-01) and the deep-nesting fallback (sec-render-02)."
```

`git status --short` 預期（commit 前；`D` 是 Step 6 的 `git rm`），以及 commit 結果（hash 會不同）：

```
M  apps/demo/tsconfig.json
M  packages/core/components/Puck/__tests__/richtext.spec.tsx
A  packages/core/components/Render/__tests__/index.spec.tsx
D  packages/core/components/RichTextEditor/components/Render.tsx
D  packages/core/components/RichTextEditor/components/RenderFallback.tsx
M  packages/core/components/RichTextEditor/lib/use-richtext-props.tsx
M  packages/core/components/ServerRender/__tests__/index.spec.tsx
M  packages/core/lib/field-transforms/default-transforms/rich-text-transform.tsx
?? CLAUDE.md
[tzuchi/main <hash>] fix(richtext): render richtext through the shared static renderer
 8 files changed, 333 insertions(+), 146 deletions(-)
 create mode 100644 packages/core/components/Render/__tests__/index.spec.tsx
 delete mode 100644 packages/core/components/RichTextEditor/components/Render.tsx
 delete mode 100644 packages/core/components/RichTextEditor/components/RenderFallback.tsx
```

- [ ] **Step 10: 寫主入口與 RSC 入口匯出 richtext API 的失敗測試**

建立 `packages/core/__tests__/richtext-exports.spec.ts`：

```ts
/** Tests that the richtext API is public in the main and the RSC entry */
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as any).ResizeObserver = ResizeObserverMock;

import * as core from "../bundle/core";
import * as rsc from "../bundle/rsc";

describe.each([
  ["main", core],
  ["rsc", rsc],
])("%s entry", (_, entry) => {
  it("exports the richtext API", () => {
    expect({
      isSafeHref: typeof entry.isSafeHref,
      normalizeRichText: typeof entry.normalizeRichText,
      renderRichText: typeof entry.renderRichText,
      textToRichText: typeof entry.textToRichText,
      RichTextContent: typeof entry.RichTextContent,
      RICHTEXT_MAX_DEPTH: entry.RICHTEXT_MAX_DEPTH,
    }).toEqual({
      isSafeHref: "function",
      normalizeRichText: "function",
      renderRichText: "function",
      textToRichText: "function",
      RichTextContent: "function",
      RICHTEXT_MAX_DEPTH: 100,
    });
  });
});
```

```bash
(cd packages/core && pnpm test __tests__/richtext-exports.spec.ts) 2>&1 | grep -E "^(PASS|FAIL)|✕|^Tests:" | sed -E 's/ \([0-9]+ ms\)//'
```

預期失敗：

```
FAIL __tests__/richtext-exports.spec.ts
    ✕ exports the richtext API
    ✕ exports the richtext API
Tests:       2 failed, 2 total
```

- [ ] **Step 11: 從兩個入口匯出**

`packages/core/bundle/core.ts` 原始片段（逐字）：

```ts
export { RichTextMenu } from "../components/RichTextMenu/inner";
```

替換為：

```ts
export { RichTextMenu } from "../components/RichTextMenu/inner";
export { RichTextContent } from "../components/RichTextEditor/components/RichTextContent";
export * from "../lib/richtext";
```

`packages/core/bundle/rsc.tsx` 原始片段（逐字）：

```tsx
export { Render } from "../components/ServerRender";
```

替換為：

```tsx
export { Render } from "../components/ServerRender";
export { RichTextContent } from "../components/RichTextEditor/components/RichTextContent";
export * from "../lib/richtext";
```

```bash
(cd packages/core && pnpm test --verbose __tests__/richtext-exports.spec.ts) 2>&1 | grep -E "^(PASS|FAIL)|✓|✕|^Tests:" | sed -E 's/ \([0-9]+ ms\)//'
```

預期輸出：

```
PASS __tests__/richtext-exports.spec.ts
    ✓ exports the richtext API
    ✓ exports the richtext API
Tests:       2 passed, 2 total
```

- [ ] **Step 12: 確認 build 結果不再引用 `@tiptap/html` 與 happy-dom，並看型別宣告**

```bash
pnpm --filter @tzuchi/tceditor build > /dev/null 2>&1; echo "build=$?"
grep -l -E "@tiptap/html|happy-dom" packages/core/dist/*.js packages/core/dist/*.mjs || echo "no @tiptap/html or happy-dom in dist"
grep -c "@tiptap/static-renderer/json/react" packages/core/dist/index.js packages/core/dist/rsc.js
for f in index rsc; do grep -q "renderRichText" "packages/core/dist/$f.d.ts" && echo "$f.d.ts exports renderRichText"; done
```

預期輸出：

```
build=0
no @tiptap/html or happy-dom in dist
packages/core/dist/index.js:1
packages/core/dist/rsc.js:1
index.d.ts exports renderRichText
rsc.d.ts exports renderRichText
```

- [ ] **Step 13: 量測改動後的打包大小**

```bash
node "${TMPDIR:-/tmp}/measure-public-bundle.mjs" packages/core
```

預期（與 Step 2 相比：初始 chunk 約 +2.0 KB gzip，總和約 +0.6 KB，都在規格要求的 10 KB 以內；小數點後一位可能略有不同）：

```
initial: 169.4 KB gzip
total (with lazy chunks): 292.1 KB gzip
```

初始 chunk 增加的是 `@tiptap/static-renderer/json/react`（約 2.7 KB 未壓縮）與 normalize/render；總和幾乎不變，因為被移除的 lazy `RichTextRender` chunk 主要內容（tiptap/prosemirror）仍由編輯器的 lazy chunk 使用，`@tiptap/html` 本身很小。若初始 chunk 增加超過 10 KB，停下來回報。

- [ ] **Step 14: 更新 CHANGELOG 並 commit**

`CHANGELOG.md`（`### Changes from Puck v0.23.0` 清單的最後一行，Task 4 Step 9 加入） 原始片段（逐字）：

```markdown
* port three fixes from upstream Puck: hotkeys no longer fire from a modifier key left stuck after switching windows ([6a396a5](https://github.com/puckeditor/puck/commit/6a396a5dfd8e7a0c26f1a00f49a8d69a4b493e63)), browser translation no longer crashes the editor ([90665df](https://github.com/puckeditor/puck/commit/90665dfbe201398fe9fbe54cfac31e3d08391b90)), and inline text fields no longer shift the layout on hover ([9e917a3](https://github.com/puckeditor/puck/commit/9e917a398afa982b18101566303134830b25e7ab))
```

替換為：

```markdown
* port three fixes from upstream Puck: hotkeys no longer fire from a modifier key left stuck after switching windows ([6a396a5](https://github.com/puckeditor/puck/commit/6a396a5dfd8e7a0c26f1a00f49a8d69a4b493e63)), browser translation no longer crashes the editor ([90665df](https://github.com/puckeditor/puck/commit/90665dfbe201398fe9fbe54cfac31e3d08391b90)), and inline text fields no longer shift the layout on hover ([9e917a3](https://github.com/puckeditor/puck/commit/9e917a398afa982b18101566303134830b25e7ab))
* render richtext everywhere it is displayed with one shared renderer built on `@tiptap/static-renderer`, exported as `renderRichText` and `RichTextContent` together with `normalizeRichText`, `isSafeHref` and `textToRichText`; a legacy HTML string is shown as plain text and never parsed, content nested deeper than 100 levels is reduced to text, and the lazy `@tiptap/html` renderer with its `dangerouslySetInnerHTML` fallback is removed
```

```bash
git diff --numstat CHANGELOG.md
git add packages/core/bundle/core.ts packages/core/bundle/rsc.tsx packages/core/__tests__/richtext-exports.spec.ts CHANGELOG.md
git status --short
git commit -m "feat(richtext): export the shared renderer from the main and RSC entries" -m "Export normalizeRichText, isSafeHref, textToRichText, renderRichText, RICHTEXT_MAX_DEPTH, RichTextContent and the RichTextDoc, RichTextNode and RichTextMark types from @tzuchi/tceditor and @tzuchi/tceditor/rsc."
```

預期（hash 會不同）：

```
1	0	CHANGELOG.md
M  CHANGELOG.md
A  packages/core/__tests__/richtext-exports.spec.ts
M  packages/core/bundle/core.ts
M  packages/core/bundle/rsc.tsx
?? CLAUDE.md
[tzuchi/main <hash>] feat(richtext): export the shared renderer from the main and RSC entries
 4 files changed, 38 insertions(+)
 create mode 100644 packages/core/__tests__/richtext-exports.spec.ts
```

- [ ] **Step 15: 完整驗證**

```bash
pnpm verify > "${TMPDIR:-/tmp}/tceditor-verify-task06.log" 2>&1
echo "exit=$?"
grep -E "Test Suites:|Tests:|Snapshots:|ℹ (tests|pass|fail)|> tsc|✖|Tasks:|All matched|^pnpm audit:|^GATED|^audit:gate (passed|FAILED)" "${TMPDIR:-/tmp}/tceditor-verify-task06.log"
```

預期輸出：

```
exit=0
@tzuchi/tceditor:test: Test Suites: 60 passed, 60 total
@tzuchi/tceditor:test: Tests:       556 passed, 556 total
@tzuchi/tceditor:test: Snapshots:   19 passed, 19 total
 Tasks:    1 successful, 1 total
ℹ tests 10
ℹ pass 10
ℹ fail 0
> tsc -p tsconfig.typecheck.json
demo:lint: ✖ 8 problems (0 errors, 8 warnings)
@tzuchi/tceditor:lint: ✖ 4 problems (0 errors, 4 warnings)
 Tasks:    3 successful, 3 total
All matched files use Prettier code style!
 Tasks:    3 successful, 3 total
pnpm audit: 69 advisories, 71 finding path(s). 105 package versions ship with packages/core, packages/plugin-heading-analyzer.
GATED (ships with a published package): 0 finding(s)
audit:gate passed: no advisories affect packages/core, packages/plugin-heading-analyzer (71 finding path(s) elsewhere are listed above).
```

與 Task 5 相比：jest 多了 2 個 suite（`components/Render/__tests__/index.spec.tsx`、`__tests__/richtext-exports.spec.ts`）與 98 個測試（Puck richtext +1、ServerRender +1、Render +94（7 個基本測試加 87 個 payload 測試）、exports +2），58 → 60 個 suite，458 → 556 個測試；其他數字不變。

### Task 7: 編輯器改存 JSON

目的：richtext 編輯器（欄位面板的 `RichtextField` 與畫布上的 inline 編輯）改為以 `editor.getJSON()` 儲存，載入前的暫時畫面 `EditorFallback` 改用共用渲染器，移除 richtext 路徑中最後一個 `dangerouslySetInnerHTML`（規格 §6 F1 第 1、3 點）。

**行為設計**：
- 編輯器顯示的內容一律先經過 `normalizeRichText`（`toEditorDoc`），與公開頁走同一套正規化，所以「載入前（`EditorFallback`）」「載入後（tiptap）」「公開頁」三者顯示相同；舊的 HTML 字串在編輯器裡也是純文字，不會被 tiptap 當 HTML 解析。空文件會補一個空段落，否則 tiptap 無法放游標。
- 正規化之後再用 `fitToSchema` 配合**這個欄位編輯器實際的 schema**：欄位可以用 `options` 關掉 PuckRichText 的一部分（官方文件的範例是 `options: { bold: false }`），而 tiptap 載入含有 schema 沒有的 node 或 mark 的 JSON 時，會丟出 `[tiptap warn]: Invalid content.` 並改載入空文件；使用者接著輸入任何字，整個欄位就會被覆蓋。`fitToSchema` 比照 tiptap 解析 HTML 的方式保留文字：移除 schema 沒有的 mark；沒有的標題或程式碼區塊變成段落；沒有的引言或清單換成其中的區塊；沒有的 hard break 變成文字中的換行；沒有的水平線移除；相鄰且 marks 相同的文字會合併，結果與 tiptap 載入後 `getJSON()` 的形狀相同。schema 由 `getSchema(extensions)` 在第一次 render 時算一次：`useEditor` 沒有 dependencies，編輯器建立後就不會因 extensions 改變而重建，schema 也不會變。
- 公開頁一律只渲染 PuckRichText 預設 schema（規格 F1：新增 extension 要同時擴充 mapping）。所以 `field.tiptap.extensions` 加入的 node 或 mark，公開頁只顯示文字，重新開啟編輯器時也會被正規化移除；同一個 session 內編輯器自己剛送出的內容不受影響（見下一點的比較）。開發模式下，編輯器的 schema 一出現 renderer 不支援的型別，就以 `console.warn` 列出型別名稱（每個型別只警告一次）。`options` 只影響編輯器，不影響公開頁的渲染；是否讓渲染器也依 `options` 過濾，列在本片段最後的差異清單，請使用者決定。
- link 的規則與渲染器一致：`PuckRichText` 的 Link 設定 `isAllowedUri`，只允許 `isSafeHref` 接受的 href（再交給使用者自訂的 `isAllowedUri` 或 tiptap 的預設檢查）。tiptap 預設允許 `ftp:`、`sms:`、`callto:` 等協定，若不限制，使用者建立的這類連結會存進資料、在編輯器裡顯示，公開頁卻把連結移除。`setLink`、自動連結、貼上與解析 HTML 都會套用這個規則。
- 外部內容同步（undo/redo、programmatic dispatch、`resolveData`）用排序過 key 的 JSON 序列化（`stableStringify`）比較：編輯器目前的 `getJSON()` 若等於「儲存的值」或「`toEditorDoc` 的結果（正規化並 `fitToSchema` 之後）」就略過。前者涵蓋編輯器自己剛送出的內容（同一個 session 內，連自訂 extension 產生、尚未經過正規化的節點也不會被重設），後者涵蓋舊字串、缺少預設屬性的手寫 JSON，以及被 `fitToSchema` 調整過的內容，所以載入舊資料或從 Postgres `jsonb`（會重排 key）讀回的資料都不會被不必要地重設。
- 這與 orchestrator 的提示（「字串型舊內容與編輯器 `getHTML` 比較」）不同：比較 `getHTML` 的前提是讓 tiptap 解析 HTML，那會讓編輯器與公開頁對舊資料顯示不同。改為兩邊都當純文字，舊資料請用 Task 8 的轉換工具處理。見本片段最後的「Task 5–9 與規格、orchestrator 指示的差異」第 1 點。
- `EditorFallback` 不用 `RichTextContent`，而是直接呼叫 `renderRichText`：`EditorInner` 外層已經有 `.RichTextEditor` 容器，`RichTextContent` 會再包一層 `.RichTextEditor`，`.rich-text` 就不再是 flex 子元素（`flex-grow` 失效）。輸出內容完全相同。
- 公開型別 `RichText`（`string | ReactNode`）在 Task 9 才改，否則 demo 的 `Hero` 會在本 task 就無法通過型別檢查。

**執行位置**：主工作目錄，接在 Task 6 的最後一個 commit（`feat(richtext): export the shared renderer from the main and RSC entries`）之後。

**Files:**
- Create:
  - `packages/core/components/RichTextEditor/lib/stable-stringify.ts`
  - `packages/core/components/RichTextEditor/lib/fit-to-schema.ts`
- Modify:
  - `packages/core/components/RichTextEditor/lib/use-synced-editor.ts`（整檔改寫）
  - `packages/core/components/RichTextEditor/extension.ts`（Link 的 `isAllowedUri`）
  - `packages/core/components/RichTextEditor/types.ts`
  - `packages/core/components/RichTextEditor/components/EditorFallback.tsx`
  - `packages/core/lib/field-transforms/default-transforms/rich-text-transform.tsx`
  - `CHANGELOG.md`
- Test:
  - `packages/core/components/RichTextEditor/lib/__tests__/stable-stringify.spec.ts`（新增）
  - `packages/core/components/RichTextEditor/lib/__tests__/fit-to-schema.spec.ts`（新增）
  - `packages/core/components/RichTextEditor/__tests__/editor.spec.tsx`（新增：`options` 關掉的內容、自訂 extension 的警告、link 規則）
  - `packages/core/components/Puck/__tests__/richtext.spec.tsx`（檔尾新增 `Puck - inline richtext editor`）
  - `packages/core/components/RichTextEditor/__tests__/editor-fallback.spec.tsx`（新增；含 Task 5 的 29 組 XSS payload：`EditorFallback` 的伺服器端與 client 輸出都檢查，並與載入後的編輯器 DOM 比對）
  - `packages/core/__tests__/richtext-no-inner-html.spec.ts`（新增，防止回歸）

**Interfaces:**
- Consumes：Task 5 的 `normalizeRichText`、`renderRichText`、`nodeMapping`、`markMapping`、`isSafeHref`、`RichTextDoc`/`RichTextNode`/`RichTextMark`，以及測試輔助 `doc`、`typicalContent`、`allTypicalContent`、`isSameDom`、`parseHtml`、`expectSafe`、`xssPayloads`；Task 6 改寫後的 `richtext.spec.tsx`（本 task 在其檔尾追加）與 CHANGELOG 最後一行。
- Produces：
  - `components/RichTextEditor/lib/stable-stringify.ts`：`export const stableStringify: (value: unknown) => string`。
  - `components/RichTextEditor/lib/fit-to-schema.ts`：`export function fitToSchema(doc: RichTextDoc, schema: Schema): RichTextDoc`（輸入須已正規化）；`export const findUnrenderableTypes: (schema: Schema) => string[]`（`Schema` 是 `@tiptap/pm/model` 的型別）。
  - `PuckRichText` 的 Link 只接受 `isSafeHref` 允許的 href（`isAllowedUri`），使用者的 `options.link.isAllowedUri` 只能再加嚴。Task 8 的轉換工具解析 HTML 時也套用同一規則。
  - `EditorProps`：`content: RichTextDoc | string`；`onChange: (content: RichTextDoc, uiState?: Partial<UiState>) => void`。
  - `useSyncedEditor({ content, onChange, … })`：`content: RichTextDoc | string`，`onChange` 收到 `RichTextDoc`。
  - 儲存格式：richtext 欄位的值是 tiptap JSON（`RichTextDoc`）。Task 8 的轉換工具、Task 9 的 demo 資料依此格式。
  - `CHANGELOG.md` 清單最後一行變成 Step 11 加入的那一行。

- [ ] **Step 1: 確認起點**

```bash
cd /Users/kaellim/Desktop/projects/puck
git status --short
git log --oneline -1
```

預期（hash 會不同）：

```
?? CLAUDE.md
<hash> feat(richtext): export the shared renderer from the main and RSC entries
```

- [ ] **Step 2: 寫 `stableStringify` 的失敗測試**

建立 `packages/core/components/RichTextEditor/lib/__tests__/stable-stringify.spec.ts`：

```ts
import { stableStringify } from "../stable-stringify";

describe("stableStringify", () => {
  it("ignores key order at every level", () => {
    expect(stableStringify({ b: 1, a: { d: [{ y: 1, x: 2 }], c: null } })).toBe(
      stableStringify({ a: { c: null, d: [{ x: 2, y: 1 }] }, b: 1 })
    );
  });

  it("keeps array order", () => {
    expect(stableStringify([1, 2])).not.toBe(stableStringify([2, 1]));
  });

  it("keeps a __proto__ key", () => {
    expect(stableStringify(JSON.parse('{"__proto__": {"a": 1}}'))).toBe(
      '{"__proto__":{"a":1}}'
    );
  });

  it("serializes strings and undefined", () => {
    expect(stableStringify("<p>x</p>")).toBe('"<p>x</p>"');
    expect(stableStringify(undefined)).toBe("");
  });
});
```

```bash
(cd packages/core && pnpm test components/RichTextEditor/lib/__tests__/stable-stringify.spec.ts) 2>&1 | grep -E "^(PASS|FAIL)|Cannot find module|^Tests:"
```

預期失敗：

```
FAIL components/RichTextEditor/lib/__tests__/stable-stringify.spec.ts
    Cannot find module '../stable-stringify' from 'components/RichTextEditor/lib/__tests__/stable-stringify.spec.ts'
Tests:       0 total
```

- [ ] **Step 3: 實作 `stableStringify`**

用 `JSON.stringify` 的 replacer 排序 key，遞迴由原生的 `JSON.stringify` 負責；暫存物件沒有 prototype，所以 `__proto__` key 會照常輸出。

建立 `packages/core/components/RichTextEditor/lib/stable-stringify.ts`：

```ts
/**
 * JSON.stringify with object keys sorted, so documents that differ only in key
 * order (for example after a round trip through Postgres jsonb) compare equal.
 */
export const stableStringify = (value: unknown): string =>
  JSON.stringify(value, (_key, item: unknown) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return item;

    const record = item as Record<string, unknown>;
    // No prototype, so a "__proto__" key is copied like any other key
    const sorted: Record<string, unknown> = Object.create(null);

    for (const key of Object.keys(record).sort()) {
      sorted[key] = record[key];
    }

    return sorted;
  }) ?? "";
```

```bash
(cd packages/core && pnpm test components/RichTextEditor/lib/__tests__/stable-stringify.spec.ts) 2>&1 | grep -E "^(PASS|FAIL)|✓|✕|^Tests:" | sed -E 's/ \([0-9]+ ms\)//'
```

預期輸出：

```
PASS components/RichTextEditor/lib/__tests__/stable-stringify.spec.ts
    ✓ ignores key order at every level
    ✓ keeps array order
    ✓ keeps a __proto__ key
    ✓ serializes strings and undefined
Tests:       4 passed, 4 total
```

- [ ] **Step 4: 寫 `fitToSchema` 的失敗測試**

測試以 `getSchema([PuckRichText.configure(options)])` 建立「欄位關掉部分功能」的 schema。每個結果都另外用 `ProseMirrorNode.fromJSON(schema, result).toJSON()` 確認編輯器會原樣載入（schema 有缺型別時 `fromJSON` 會丟錯；相鄰文字沒有合併時 `toJSON()` 會不同），這是 Step 7 略過重設內容的前提。

建立 `packages/core/components/RichTextEditor/lib/__tests__/fit-to-schema.spec.ts`：

```ts
import { getSchema, Mark, Node } from "@tiptap/core";
import type { Schema } from "@tiptap/pm/model";
import { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { PuckRichText, PuckRichTextOptions } from "../../extension";
import {
  findUnrenderableTypes,
  fitToSchema as fitToSchemaUnchecked,
} from "../fit-to-schema";
import {
  allTypicalContent,
  doc,
  typicalContent,
} from "../../../../lib/richtext/__helpers__/fixtures";
import type {
  RichTextDoc,
  RichTextMark,
  RichTextNode,
} from "../../../../lib/richtext/types";

/** Also checks that the editor would load the result exactly as it is. */
const fitToSchema = (value: RichTextDoc, schema: Schema) => {
  const result = fitToSchemaUnchecked(value, schema);

  expect(ProseMirrorNode.fromJSON(schema, result).toJSON()).toEqual(result);

  return result;
};

const schemaWith = (options: Partial<PuckRichTextOptions>) =>
  getSchema([PuckRichText.configure(options)]);

const p = (...content: RichTextNode[]): RichTextNode => ({
  type: "paragraph",
  attrs: { textAlign: null },
  content,
});

const t = (text: string, marks?: RichTextMark[]): RichTextNode =>
  marks ? { type: "text", marks, text } : { type: "text", text };

describe("fitToSchema", () => {
  it("returns content the schema supports unchanged", () => {
    expect(fitToSchema(allTypicalContent, getSchema([PuckRichText]))).toEqual(
      allTypicalContent
    );
  });

  it("removes marks the schema lacks and merges the text", () => {
    expect(
      fitToSchema(
        typicalContent.marks,
        schemaWith({ bold: false, code: false })
      )
    ).toEqual(
      doc(
        p(
          t("plain bold "),
          t("italic", [{ type: "italic" }]),
          t(" "),
          t("underline", [{ type: "underline" }]),
          t(" "),
          t("strike", [{ type: "strike" }]),
          t(" code")
        )
      )
    );
  });

  it("removes links when the schema has no link mark", () => {
    expect(
      fitToSchema(typicalContent.links, schemaWith({ link: false }))
    ).toEqual(
      doc(
        p(t("Visit example, relative, mail and titled")),
        p(t("link "), t("with bold", [{ type: "bold" }]))
      )
    );
  });

  it("turns headings and code blocks into paragraphs", () => {
    expect(
      fitToSchema(
        doc(
          {
            type: "heading",
            attrs: { textAlign: "center", level: 2 },
            content: [t("Title", [{ type: "italic" }])],
          },
          {
            type: "codeBlock",
            attrs: { language: "js" },
            content: [t("a"), t("\n"), t("b")],
          }
        ),
        schemaWith({ heading: false, codeBlock: false })
      )
    ).toEqual(
      doc(
        {
          type: "paragraph",
          attrs: { textAlign: "center" },
          content: [t("Title", [{ type: "italic" }])],
        },
        p(t("a\nb"))
      )
    );
  });

  it("keeps the blocks inside blockquotes and lists the schema lacks", () => {
    const schema = schemaWith({ blockquote: false, bulletList: false });

    expect(fitToSchema(typicalContent.blockquote, schema)).toEqual(
      doc(p(t("Quoted")), p(t("Second line")))
    );
    expect(fitToSchema(typicalContent.nestedLists, schema)).toEqual(
      doc(
        p(t("parent")),
        {
          type: "orderedList",
          attrs: { start: 1, type: null },
          content: [
            { type: "listItem", content: [p(t("child")), p(t("grandchild"))] },
          ],
        },
        p(t("sibling"))
      )
    );
  });

  it("turns hard breaks into line breaks and drops horizontal rules", () => {
    const schema = schemaWith({ hardBreak: false, horizontalRule: false });

    expect(fitToSchema(typicalContent.hardBreaks, schema)).toEqual(
      doc(p(t("line 1\nline 2")), p(t("bold\nstill bold", [{ type: "bold" }])))
    );
    expect(fitToSchema(typicalContent.horizontalRule, schema)).toEqual(
      doc(p(t("above")), p(t("below")))
    );
  });
});

describe("findUnrenderableTypes", () => {
  it("finds nothing in the default schema", () => {
    expect(findUnrenderableTypes(getSchema([PuckRichText]))).toEqual([]);
  });

  it("finds the node and mark types that extensions add", () => {
    const Callout = Node.create({
      name: "callout",
      group: "block",
      content: "inline*",
    });
    const Highlight = Mark.create({ name: "highlight" });

    expect(
      findUnrenderableTypes(getSchema([PuckRichText, Callout, Highlight]))
    ).toEqual(["callout", "highlight"]);
  });
});
```

```bash
(cd packages/core && pnpm test components/RichTextEditor/lib/__tests__/fit-to-schema.spec.ts) 2>&1 | grep -E "^(PASS|FAIL)|Cannot find module|^Tests:"
```

預期失敗：

```
FAIL components/RichTextEditor/lib/__tests__/fit-to-schema.spec.ts
    Cannot find module '../fit-to-schema' from 'components/RichTextEditor/lib/__tests__/fit-to-schema.spec.ts'
Tests:       0 total
```

- [ ] **Step 5: 實作 `fitToSchema`**

`fitToSchema` 只看 schema 裡有沒有某個 node 或 mark 型別（`schema.nodes`、`schema.marks` 都是沒有 prototype 的物件），所以只會移除或改寫型別，不會新增 normalize 不允許的東西。`findUnrenderableTypes` 以渲染器的 `nodeMapping`／`markMapping` 為準，列出 schema 中渲染器不認得的型別，Step 7 用它發出開發模式的警告。

建立 `packages/core/components/RichTextEditor/lib/fit-to-schema.ts`：

```ts
import type { Schema } from "@tiptap/pm/model";
import { markMapping, nodeMapping } from "../../../lib/richtext/render";
import type {
  RichTextDoc,
  RichTextMark,
  RichTextNode,
} from "../../../lib/richtext/types";
import { stableStringify } from "./stable-stringify";

/** Which children a parent node accepts. */
type Context = "block" | "list" | "inline";

const withContent = (
  node: RichTextNode,
  content: RichTextNode[]
): RichTextNode => {
  const result: RichTextNode = { type: node.type };

  if (node.attrs) result.attrs = node.attrs;
  if (content.length > 0) result.content = content;

  return result;
};

/** Adds text, merging it into the previous text node when the marks match. */
const pushText = (out: RichTextNode[], text: string, marks: RichTextMark[]) => {
  if (text === "") return;

  const last = out[out.length - 1];

  if (
    last?.type === "text" &&
    stableStringify(last.marks ?? []) === stableStringify(marks)
  ) {
    out[out.length - 1] = { ...last, text: `${last.text ?? ""}${text}` };
  } else {
    out.push(
      marks.length > 0 ? { type: "text", marks, text } : { type: "text", text }
    );
  }
};

function fitNode(
  node: RichTextNode,
  context: Context,
  schema: Schema,
  out: RichTextNode[]
) {
  const supported = Boolean(schema.nodes[node.type]);

  if (context === "inline") {
    const marks = (node.marks ?? []).filter((mark) =>
      Boolean(schema.marks[mark.type])
    );

    if (node.type === "hardBreak" && supported) {
      out.push(
        marks.length > 0 ? { type: node.type, marks } : { type: node.type }
      );
    } else {
      // Text, or a hard break the editor lacks
      pushText(out, node.type === "hardBreak" ? "\n" : node.text ?? "", marks);
    }

    return;
  }

  const fitChildren = (childContext: Context) => {
    const children: RichTextNode[] = [];

    for (const child of node.content ?? []) {
      fitNode(child, childContext, schema, children);
    }

    return children;
  };

  switch (node.type) {
    case "paragraph":
    case "heading":
    case "codeBlock": {
      const content = fitChildren("inline");

      if (supported) {
        out.push(withContent(node, content));
      } else if (schema.nodes.paragraph) {
        // A text block the editor lacks becomes a paragraph
        out.push(
          withContent(
            {
              type: "paragraph",
              attrs: { textAlign: node.attrs?.textAlign ?? null },
            },
            content
          )
        );
      }

      return;
    }
    case "horizontalRule":
      if (supported) out.push(node);

      return;
    case "listItem":
      if (context === "list") {
        out.push(withContent(node, fitChildren("block")));

        return;
      }

      break;
    case "blockquote":
      if (supported) {
        out.push(withContent(node, fitChildren("block")));

        return;
      }

      break;
    case "bulletList":
    case "orderedList":
      if (supported && schema.nodes.listItem) {
        out.push(withContent(node, fitChildren("list")));

        return;
      }

      break;
  }

  // A container the editor lacks: keep the blocks inside it
  for (const child of node.content ?? []) {
    fitNode(child, "block", schema, out);
  }
}

/**
 * Fits a normalized document (see normalizeRichText) to the schema of a
 * richtext field's editor. A field can turn parts of the PuckRichText schema
 * off, for example `options: { bold: false }`, and Tiptap replaces a document
 * that contains a node or mark type its schema lacks with an empty one, so the
 * next edit would overwrite the stored value. Like Tiptap's HTML parser, this
 * keeps the text instead:
 *
 * - marks the schema lacks are removed;
 * - a heading or code block becomes a paragraph;
 * - a blockquote or list is replaced by the blocks inside it;
 * - a hard break becomes a line break in the text, and a horizontal rule is
 *   dropped.
 */
export function fitToSchema(doc: RichTextDoc, schema: Schema): RichTextDoc {
  const content: RichTextNode[] = [];

  for (const node of doc.content ?? []) {
    fitNode(node, "block", schema, content);
  }

  return { type: "doc", content };
}

/**
 * Node and mark types in an editor's schema that the shared renderer does
 * not render, usually added through `field.tiptap.extensions`.
 */
export const findUnrenderableTypes = (schema: Schema): string[] => [
  ...Object.keys(schema.nodes).filter((type) => !(type in nodeMapping)),
  ...Object.keys(schema.marks).filter((type) => !(type in markMapping)),
];
```

```bash
(cd packages/core && pnpm test --verbose components/RichTextEditor/lib/__tests__/fit-to-schema.spec.ts) 2>&1 | grep -E "^(PASS|FAIL)|✓|✕|^Tests:" | sed -E 's/ \([0-9]+ ms\)//'
```

預期輸出：

```
PASS components/RichTextEditor/lib/__tests__/fit-to-schema.spec.ts
    ✓ returns content the schema supports unchanged
    ✓ removes marks the schema lacks and merges the text
    ✓ removes links when the schema has no link mark
    ✓ turns headings and code blocks into paragraphs
    ✓ keeps the blocks inside blockquotes and lists the schema lacks
    ✓ turns hard breaks into line breaks and drops horizontal rules
    ✓ finds nothing in the default schema
    ✓ finds the node and mark types that extensions add
Tests:       8 passed, 8 total
```

- [ ] **Step 6: 寫編輯器的失敗測試**

在 `packages/core/components/Puck/__tests__/richtext.spec.tsx` 加入兩處。測試直接用 tiptap 掛在 DOM 上的 `editor` 實例（`.ProseMirror` 元素的 `editor` 屬性）下指令；編輯器只在自己的欄位取得焦點時才回報變更（`ui.field.focus === "<propPath>::inline"`），所以先用 `setUi` 設定焦點。

第 1 處（import），原始片段（逐字）：

```tsx
import { Puck } from "../index";
import { AppStoreApi } from "../../../store";
```

替換為：

```tsx
import type { Editor as TiptapEditor } from "@tiptap/core";
import { Puck } from "../index";
import { AppStoreApi } from "../../../store";
```

第 2 處（檔尾，也就是 Task 6 新增的最後一個測試的結尾；在其後追加一個 describe），原始片段（逐字）：

```tsx
    expect(output.textContent).toBe(payload);
  });
});
```

替換為：

```tsx
    expect(output.textContent).toBe(payload);
  });
});

describe("Puck - inline richtext editor", () => {
  afterEach(() => {
    cleanup();
  });

  const config: Config = {
    components: {
      Block: {
        fields: {
          body: { type: "richtext", contentEditable: true },
        },
        render: ({ body }) => <div data-testid="output">{body}</div>,
      },
    },
  };

  const renderPuck = async (body: unknown) => {
    const data: Data = {
      root: { props: {} },
      content: [{ type: "Block", props: { id: "block-1", body } }],
    };

    render(<Puck config={config} data={data} iframe={{ enabled: false }} />);
    await flush();

    const output = await screen.findByTestId("output");

    await waitFor(() => {
      expect(output.querySelector(".ProseMirror")).not.toBeNull();
    });

    return output.querySelector(".ProseMirror") as HTMLElement & {
      editor: TiptapEditor;
    };
  };

  it("loads JSON into the editor and follows programmatic updates", async () => {
    const editorDom = await renderPuck(richText("Hello world"));

    expect(editorDom.textContent).toBe("Hello world");

    act(() => {
      dispatchReplace(getInternal().appStore, "block-1", {
        type: "Block",
        props: { id: "block-1", body: richText("Updated content") },
      });
    });
    await flush();

    await waitFor(() => {
      expect(editorDom.textContent).toBe("Updated content");
    });
  });

  it("stores edits as JSON", async () => {
    const editorDom = await renderPuck(richText("Hello"));
    const { appStore } = getInternal();

    act(() => {
      // The editor only reports changes while its field has focus
      appStore.getState().setUi({
        field: { ...appStore.getState().state.ui.field, focus: "body::inline" },
      });
    });

    act(() => {
      editorDom.editor.commands.insertContentAt(
        editorDom.editor.state.doc.content.size - 1,
        " world"
      );
    });

    await waitFor(() => {
      expect(
        appStore.getState().state.indexes.nodes["block-1"].data.props.body
      ).toEqual(richText("Hello world"));
    });
  });

  it("shows a legacy HTML string as plain text", async () => {
    const payload = '<p>Hello</p><img src=x onerror="alert(1)">';
    const editorDom = await renderPuck(payload);

    expect(editorDom.querySelector("img")).toBeNull();
    expect(editorDom.textContent).toBe(payload);
  });
});
```

新增 `EditorFallback` 一致性測試。載入後的編輯器在空段落裡會多一個 `<br class="ProseMirror-trailingBreak">`（ProseMirror 讓游標能放進空段落的輔助元素），比較前先移除；fallback 的空段落由 CSS `.rich-text p:empty::before` 撐出相同高度。Task 5 的 29 組 XSS payload 也逐一送進來：`EditorFallback` 的伺服器端（`renderToString`）與 client 輸出都要通過 `expectSafe`，而且與載入後的編輯器 DOM 相同，所以編輯器畫布的輸出同樣安全（規格 §9 第 3 項）。

建立 `packages/core/components/RichTextEditor/__tests__/editor-fallback.spec.tsx`：

```tsx
import { cleanup, render, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server.node";
import { appStoreContext, createAppStore } from "../../../store";
import { Editor } from "../components/Editor";
import { EditorFallback } from "../components/EditorFallback";
import { EditorProps } from "../types";
import { allTypicalContent } from "../../../lib/richtext/__helpers__/fixtures";
import { isSameDom, parseHtml } from "../../../lib/richtext/__helpers__/dom";
import {
  expectSafe,
  xssPayloads,
} from "../../../lib/richtext/__helpers__/xss-payloads";

const renderWithStore = (ui: React.ReactNode) =>
  render(
    <appStoreContext.Provider value={createAppStore()}>
      {ui}
    </appStoreContext.Provider>
  );

const props = (content: EditorProps["content"]): EditorProps => ({
  content,
  onChange: () => {},
  field: { type: "richtext" },
  id: "richtext-1",
  name: "body",
});

/** The content DOM of the loaded editor, without ProseMirror's editing aids. */
const editorContent = async (content: EditorProps["content"]) => {
  const { container } = renderWithStore(<Editor {...props(content)} />);

  await waitFor(() => {
    expect(container.querySelector(".ProseMirror")).not.toBeNull();
  });

  const editorDom = container.querySelector(".ProseMirror")!.cloneNode(true);

  (editorDom as Element)
    .querySelectorAll("br.ProseMirror-trailingBreak")
    .forEach((br) => br.remove());

  return (editorDom as Element).innerHTML;
};

const fallbackContent = (content: EditorProps["content"]) => {
  const { container } = renderWithStore(<EditorFallback {...props(content)} />);

  return container.querySelector(".rich-text")!.innerHTML;
};

describe("EditorFallback", () => {
  afterEach(cleanup);

  it("shows the same content the editor shows once it has loaded", async () => {
    const fallback = fallbackContent(allTypicalContent);
    const editor = await editorContent(allTypicalContent);

    expect({ same: isSameDom(fallback, editor), fallback, editor }).toEqual({
      same: true,
      fallback,
      editor,
    });
  });

  it("shows a legacy HTML string as the same plain text as the editor", async () => {
    const payload = '<p>Hi</p><img src=x onerror="alert(1)">';

    expect(
      isSameDom(fallbackContent(payload), await editorContent(payload))
    ).toBe(true);
  });

  it("is not editable before the editor loads", () => {
    const { container } = renderWithStore(
      <EditorFallback {...props(allTypicalContent)} />
    );

    expect(container.querySelector("[contenteditable]")).toBeNull();
  });

  it.each(xssPayloads)(
    "shows %s safely, the same as the loaded editor",
    async (_, payload) => {
      const content = payload as EditorProps["content"];
      const serverHtml = renderToString(
        <appStoreContext.Provider value={createAppStore()}>
          <EditorFallback {...props(content)} />
        </appStoreContext.Provider>
      );
      const fallback = fallbackContent(content);

      expect(serverHtml).not.toMatch(/<script/i);
      expectSafe(parseHtml(serverHtml).querySelector(".rich-text")!);
      expectSafe(parseHtml(fallback));
      expect(isSameDom(fallback, await editorContent(content))).toBe(true);
    }
  );
});
```

新增 `Editor` 的測試（直接渲染 `Editor`，用 `.ProseMirror` 元素上的 `editor` 下指令）：
- `keeps the text of content the field turned off`：欄位設 `options: { bold: false, codeBlock: false, heading: false, link: false }`，內容含標題、粗體、連結與程式碼區塊；載入後每段文字都在，而且沒有 `Invalid content` 警告。
- `warns about types from tiptap.extensions and shows only their text`：自訂的 `highlight` mark 在編輯器重新載入時被移除（只留文字），並以 `console.warn` 警告一次。
- `keeps its document when the same content comes back with reordered keys`：Postgres `jsonb` 會依「key 長度、再依位元組」重排物件的 key，所以同一份內容存進資料庫再讀回來時 key 順序會變。以 `rerender` 傳入重排過 key 的同一份內容，編輯器的 `state.doc` 必須仍是同一個物件，也就是沒有被 `setContent` 重設（重設會讓正在編輯的游標與選取跳掉）。
- `only creates the links that published pages keep`：`setLink` 對 `sms:`、`ftp:`、`javascript:` 回傳 `false`，對 `https:` 回傳 `true`。

建立 `packages/core/components/RichTextEditor/__tests__/editor.spec.tsx`：

```tsx
import { act, cleanup, render, waitFor } from "@testing-library/react";
import { Mark, type Editor as TiptapEditor } from "@tiptap/core";
import { appStoreContext, createAppStore } from "../../../store";
import { RichtextField } from "../../../types";
import { Editor } from "../components/Editor";
import { EditorProps } from "../types";
import { doc } from "../../../lib/richtext/__helpers__/fixtures";
import type { RichTextNode } from "../../../lib/richtext/types";

const p = (...content: RichTextNode[]): RichTextNode => ({
  type: "paragraph",
  attrs: { textAlign: null },
  content,
});

const t = (text: string, marks?: RichTextNode["marks"]): RichTextNode =>
  marks ? { type: "text", marks, text } : { type: "text", text };

/** Renders the editor and waits for Tiptap to load. */
const renderEditor = async (
  content: EditorProps["content"],
  field: RichtextField = { type: "richtext" }
) => {
  const { container } = render(
    <appStoreContext.Provider value={createAppStore()}>
      <Editor
        content={content}
        onChange={() => {}}
        field={field}
        id="richtext-1"
        name="body"
      />
    </appStoreContext.Provider>
  );

  await waitFor(() => {
    expect(container.querySelector(".ProseMirror")).not.toBeNull();
  });

  return container.querySelector(".ProseMirror") as HTMLElement & {
    editor: TiptapEditor;
  };
};

describe("Editor", () => {
  let warn: jest.SpyInstance;

  beforeEach(() => {
    warn = jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    warn.mockRestore();
  });

  const warnings = () => warn.mock.calls.map(([message]) => String(message));

  it("keeps the text of content the field turned off", async () => {
    const editorDom = await renderEditor(
      doc(
        {
          type: "heading",
          attrs: { textAlign: null, level: 2 },
          content: [t("Title")],
        },
        p(
          t("bold", [{ type: "bold" }]),
          t(" and "),
          t("link", [
            {
              type: "link",
              attrs: {
                href: "https://example.com",
                target: "_blank",
                rel: "noopener noreferrer nofollow",
                class: null,
                title: null,
              },
            },
          ])
        ),
        { type: "codeBlock", attrs: { language: null }, content: [t("code")] }
      ),
      {
        type: "richtext",
        options: { bold: false, codeBlock: false, heading: false, link: false },
      }
    );

    expect(
      Array.from(editorDom.querySelectorAll("p")).map((el) => el.textContent)
    ).toEqual(["Title", "bold and link", "code"]);
    expect(editorDom.querySelector("h2, strong, a, pre")).toBeNull();
    expect(warnings()).not.toContainEqual(
      expect.stringContaining("Invalid content")
    );
  });

  it("warns about types from tiptap.extensions and shows only their text", async () => {
    const Highlight = Mark.create({
      name: "highlight",
      parseHTML: () => [{ tag: "mark" }],
      renderHTML: ({ HTMLAttributes }) => ["mark", HTMLAttributes, 0],
    });

    const editorDom = await renderEditor(
      doc(p(t("marked", [{ type: "highlight" }]))),
      { type: "richtext", tiptap: { extensions: [Highlight] } }
    );

    expect(editorDom.querySelector("mark")).toBeNull();
    expect(editorDom.textContent).toBe("marked");
    expect(warnings()).toEqual([
      expect.stringContaining(
        "the richtext types highlight come from tiptap.extensions"
      ),
    ]);
  });

  it("keeps its document when the same content comes back with reordered keys", async () => {
    const store = createAppStore();
    const editorFor = (content: EditorProps["content"]) => (
      <appStoreContext.Provider value={store}>
        <Editor
          content={content}
          onChange={() => {}}
          field={{ type: "richtext" }}
          id="richtext-1"
          name="body"
        />
      </appStoreContext.Provider>
    );
    const { container, rerender } = render(editorFor(doc(p(t("Hello world")))));

    await waitFor(() => {
      expect(container.querySelector(".ProseMirror")).not.toBeNull();
    });

    const { editor } = container.querySelector(
      ".ProseMirror"
    ) as HTMLElement & {
      editor: TiptapEditor;
    };
    const shownDoc = editor.state.doc;

    // Postgres jsonb returns object keys ordered by length, then bytewise
    rerender(
      editorFor(
        JSON.parse(
          '{"type":"doc","content":[{"type":"paragraph","attrs":{"textAlign":null},"content":[{"text":"Hello world","type":"text"}]}]}'
        )
      )
    );
    await act(async () => {});

    // A boolean, because jest cannot report a failed toBe on ProseMirror nodes
    expect(editor.state.doc === shownDoc).toBe(true);
  });

  it("only creates the links that published pages keep", async () => {
    const { editor } = await renderEditor(doc(p(t("link"))));

    editor.commands.selectAll();

    for (const href of [
      "sms:+886212345678",
      "ftp://example.com",
      "javascript:alert(1)",
    ]) {
      expect(editor.commands.setLink({ href })).toBe(false);
    }

    expect(editor.isActive("link")).toBe(false);
    expect(editor.commands.setLink({ href: "https://example.com" })).toBe(true);
    expect(editor.isActive("link")).toBe(true);
  });
});
```

建立 `packages/core/__tests__/richtext-no-inner-html.spec.ts`（規格 §9 第 3 項的 `git grep dangerouslySetInnerHTML` 檢查，改寫成每次 `pnpm test` 都會執行的測試）：

```ts
/** Tests that no rich text code path writes raw HTML into the DOM */
import fs from "fs";
import path from "path";

const packageRoot = path.resolve(__dirname, "..");

const richTextSources = [
  "components/RichTextEditor",
  "components/AutoField/fields/RichtextField",
  "lib/richtext",
  "lib/field-transforms",
];

const collectSources = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(dir, entry.name);

    if (entry.isDirectory()) return collectSources(entryPath);

    return /\.tsx?$/.test(entry.name) && !/\.spec\.tsx?$/.test(entry.name)
      ? [entryPath]
      : [];
  });

describe("rich text sources", () => {
  it("never use dangerouslySetInnerHTML", () => {
    const offenders = richTextSources
      .flatMap((dir) => collectSources(path.join(packageRoot, dir)))
      .filter((file) =>
        fs.readFileSync(file, "utf8").includes("dangerouslySetInnerHTML")
      )
      .map((file) => path.relative(packageRoot, file));

    expect(offenders).toEqual([]);
  });
});
```

`editor-fallback.spec.tsx` 的 29 個 payload 測試只列出通過／失敗的個數，其餘測試逐一列出：

```bash
(cd packages/core && pnpm test --verbose components/Puck/__tests__/richtext.spec.tsx components/RichTextEditor/__tests__ __tests__/richtext-no-inner-html.spec.ts) > "${TMPDIR:-/tmp}/tceditor-task07-tests.log" 2>&1
grep -E "^(PASS|FAIL)|✓|✕|^Tests:" "${TMPDIR:-/tmp}/tceditor-task07-tests.log" | grep -v "safely, the same as the loaded editor" | sed -E 's/ \([0-9]+ ms\)//; s/ \([0-9.]+ s\)//'
grep -E "^ +[✓✕] shows .* safely, the same as the loaded editor" "${TMPDIR:-/tmp}/tceditor-task07-tests.log" | grep -o -E "^ +[✓✕]" | sed 's/^ *//' | sort | uniq -c
```

預期失敗（測試順序可能不同）：

```
FAIL components/RichTextEditor/__tests__/editor.spec.tsx
    ✕ keeps the text of content the field turned off
    ✕ warns about types from tiptap.extensions and shows only their text
    ✕ keeps its document when the same content comes back with reordered keys
    ✕ only creates the links that published pages keep
FAIL components/RichTextEditor/__tests__/editor-fallback.spec.tsx
    ✕ shows the same content the editor shows once it has loaded
    ✕ shows a legacy HTML string as the same plain text as the editor
    ✕ is not editable before the editor loads
FAIL __tests__/richtext-no-inner-html.spec.ts
    ✕ never use dangerouslySetInnerHTML
FAIL components/Puck/__tests__/richtext.spec.tsx
    ✓ updates the preview when a richtext field is changed via dispatch
    ✓ updates the preview when a contentEditable richtext field is changed via dispatch
    ✓ updates richtext when value transitions from empty string to content
    ✓ updates richtext when value is set to a plain string
    ✓ shows a legacy HTML string as plain text instead of parsing it
    ✓ loads JSON into the editor and follows programmatic updates
    ✕ stores edits as JSON
    ✕ shows a legacy HTML string as plain text
Tests:       39 failed, 6 passed, 45 total
  29 ✕
```

最後一行是 `editor-fallback.spec.tsx` 的 29 個 payload 測試：全部失敗，因為舊的 `EditorFallback` 把內容交給 `dangerouslySetInnerHTML`（字串原樣進入 DOM，JSON 變成 `[object Object]`，與載入後的編輯器不同）。`editor.spec.tsx` 的四個測試在舊實作下分別失敗於：編輯器改載入空文件（`Invalid content`）、`highlight` 照樣顯示且沒有警告、舊的比較 `getHTML() === content` 對 JSON 永遠不相等而呼叫 `setContent` 換掉了文件（全域審查補上的 Review Focus 第 3 項）、`setLink` 對 `sms:` 等協定回傳 `true`。

`loads JSON into the editor and follows programmatic updates` 在舊實作也會通過（舊的比較 `getHTML() === content` 對 JSON 永遠不相等，所以每次都 `setContent`），保留它是為了防止回歸。

- [ ] **Step 7: 改寫 `useSyncedEditor`**

與 v0.23.0 相比：`onUpdate` 改送 `getJSON()`；顯示的內容是 `toEditorDoc(content, schema)`（`normalizeRichText` 之後再 `fitToSchema`）；schema 以 `useState(() => getSchema(extensions))` 只算一次（欄位沒有設定 `tiptap.extensions` 時，`Editor` 每次 render 都會產生新的 `extensions` 陣列，若放進 `useMemo` 的 dependencies，`editorDoc` 每次 render 都會變，外部同步的 effect 也會每次都跑）；開發模式下以 `findUnrenderableTypes` 警告；外部同步改用 `stableStringify` 比較。

`packages/core/components/RichTextEditor/lib/use-synced-editor.ts` 的完整新內容：

```ts
import { getSchema, useEditor } from "@tiptap/react";
import type { Extensions, Editor } from "@tiptap/react";
import type { Schema } from "@tiptap/pm/model";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDebounce } from "use-debounce";
import { UiState } from "../../../types";
import { useAppStoreApi } from "../../../store";
import { normalizeRichText } from "../../../lib/richtext/normalize";
import type { RichTextDoc } from "../../../lib/richtext/types";
import { findUnrenderableTypes, fitToSchema } from "./fit-to-schema";
import { stableStringify } from "./stable-stringify";

// Tiptap needs at least one block to place the cursor in
const EMPTY_EDITOR_DOC: RichTextDoc = {
  type: "doc",
  content: [{ type: "paragraph", attrs: { textAlign: null } }],
};

/**
 * The document the editor shows for a stored value. It goes through the same
 * normalization as the renderer, so the editor and the rendered page agree,
 * and legacy HTML strings appear as plain text. It is then fitted to the
 * editor's schema, because Tiptap would show an empty document instead of
 * content with a node or mark type the field turned off.
 */
const toEditorDoc = (content: unknown, schema: Schema): RichTextDoc => {
  const doc = fitToSchema(normalizeRichText(content), schema);

  return doc.content?.length ? doc : EMPTY_EDITOR_DOC;
};

// Types already reported, so each one is reported once
const reportedTypes = new Set<string>();

export function useSyncedEditor({
  content,
  onChange,
  extensions,
  editable = true,
  onFocusChange,
  name,
}: {
  content: RichTextDoc | string;
  onChange: (content: RichTextDoc, uiState?: Partial<UiState>) => void;
  extensions: Extensions;
  editable?: boolean;
  onFocusChange?: (editor: Editor | null) => void;
  name: string | undefined;
}) {
  const [debouncedState, setDebouncedState] = useDebounce<{
    from: number;
    to: number;
    json: RichTextDoc;
  } | null>(null, 50, {
    leading: true,
    maxWait: 200,
  });

  const syncingRef = useRef(false);
  const lastSyncedRef = useRef("");
  const editTimer = useRef<NodeJS.Timeout>(null);
  const isPending = !!editTimer.current;

  // useEditor creates the editor once and keeps its schema even when the
  // extensions change later, so the schema is computed once as well
  const [schema] = useState(() => getSchema(extensions));

  const editorDoc = useMemo(
    () => toEditorDoc(content, schema),
    [content, schema]
  );

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;

    const types = findUnrenderableTypes(schema).filter(
      (type) => !reportedTypes.has(type)
    );

    if (types.length === 0) return;

    types.forEach((type) => reportedTypes.add(type));

    console.warn(
      `tceditor: the richtext types ${types.join(
        ", "
      )} come from tiptap.extensions and are not supported by the shared renderer. Published pages show only their text, and the editor removes them when it loads saved content.`
    );
  }, [schema]);

  const resetTimer = (clearOn: string) => {
    if (editTimer.current) {
      clearTimeout(editTimer.current);
    }

    editTimer.current = setTimeout(() => {
      if (lastSyncedRef.current === clearOn) {
        editTimer.current = null;
      }
    }, 200);
  };

  const appStoreApi = useAppStoreApi();

  const editor = useEditor({
    extensions,
    content: editorDoc,
    editable,
    immediatelyRender: false,
    parseOptions: { preserveWhitespace: "full" },
    onUpdate: ({ editor }) => {
      const isFocused = appStoreApi.getState().state.ui.field.focus === name;

      // This can trigger during undo/redo history loads
      if (syncingRef.current || !isFocused) {
        return;
      }

      const json = editor.getJSON() as RichTextDoc;
      const serialized = stableStringify(json);

      const { from, to } = editor.state.selection;

      setDebouncedState({ from, to, json });
      resetTimer(serialized);

      lastSyncedRef.current = serialized;
    },
  });

  useEffect(() => {
    if (!editor) return;

    const handleFocus = () => {
      onFocusChange?.(editor);
    };

    editor.on("focus", handleFocus);
    return () => {
      editor.off("focus", handleFocus);
    };
  }, [editor, onFocusChange]);

  // Push debounced changes up to parent
  useEffect(() => {
    if (debouncedState) {
      const { ui } = appStoreApi.getState().state;

      onChange(debouncedState.json, {
        field: {
          ...ui.field,
          metadata: { from: debouncedState.from, to: debouncedState.to },
        },
      });
    }
  }, [editor, debouncedState, onChange, appStoreApi, name]);

  useEffect(() => {
    editor?.setEditable(editable);
  }, [editor, editable]);

  // Bring in external content changes without causing flicker on blur
  useEffect(() => {
    if (!editor) return;

    // If the editor currently has pending changes, don't stomp what the user is typing
    if (isPending) {
      return;
    }

    // Skip when the editor already shows this content: either it produced the
    // stored JSON itself, or it shows the stored value in normalized form.
    // Compared with sorted keys, so key order does not matter.
    const current = stableStringify(editor.getJSON());

    if (
      current === stableStringify(content) ||
      current === stableStringify(editorDoc)
    ) {
      return;
    }

    syncingRef.current = true;

    editor.commands.setContent(editorDoc, { emitUpdate: false });

    const { ui } = appStoreApi.getState().state;

    if (typeof ui.field.metadata?.from !== "undefined") {
      editor.commands.setTextSelection({
        from: ui.field.metadata.from,
        to: ui.field.metadata.to,
      });
    }

    syncingRef.current = false;
  }, [content, editorDoc, editor, appStoreApi]);

  return editor;
}
```

- [ ] **Step 8: 讓編輯器只建立公開頁會保留的連結**

`packages/core/components/RichTextEditor/extension.ts` 第 1 處（import），原始片段（逐字）：

```ts
import { Underline } from "@tiptap/extension-underline";
```

替換為：

```ts
import { Underline } from "@tiptap/extension-underline";
import { isSafeHref } from "../../lib/richtext/is-safe-href";
```

第 2 處，原始片段（逐字）：

```ts
    if (options.link !== false) {
      extensions.push(Link.configure(options?.link));
    }
```

替換為：

```ts
    if (options.link !== false) {
      const linkOptions = options.link ?? {};

      extensions.push(
        Link.configure({
          ...linkOptions,
          // Published pages only keep links that pass isSafeHref, so the
          // editor must not create any other link (typed, pasted or parsed)
          isAllowedUri: (url, context) =>
            isSafeHref(url) &&
            (linkOptions.isAllowedUri
              ? linkOptions.isAllowedUri(url, context)
              : context.defaultValidate(url)),
        })
      );
    }
```

使用者若在 `options.link.isAllowedUri` 自訂規則，仍會被呼叫，但只能在 `isSafeHref` 之上再加嚴。

- [ ] **Step 9: 更新 `EditorProps`、`EditorFallback` 與 inline 編輯路徑的型別**

`packages/core/components/RichTextEditor/types.ts` 第 1 處，原始片段（逐字）：

```ts
import type { Editor, EditorStateSnapshot, JSONContent } from "@tiptap/react";
import { useSyncedEditor } from "./lib/use-synced-editor";
import { defaultEditorState } from "./selector";
import { RichtextField, UiState } from "../../types";
```

替換為：

```ts
import type { Editor, EditorStateSnapshot } from "@tiptap/react";
import { useSyncedEditor } from "./lib/use-synced-editor";
import { defaultEditorState } from "./selector";
import { RichtextField, UiState } from "../../types";
import type { RichTextDoc } from "../../lib/richtext/types";
```

第 2 處，原始片段（逐字）：

```ts
  onChange: (content: string | JSONContent, uiState?: Partial<UiState>) => void;
  content: string;
```

替換為：

```ts
  onChange: (content: RichTextDoc, uiState?: Partial<UiState>) => void;
  /** Tiptap JSON. A legacy HTML string is shown as plain text. */
  content: RichTextDoc | string;
```

`packages/core/components/RichTextEditor/components/EditorFallback.tsx` 第 1 處，原始片段（逐字）：

```tsx
import { EditorInner } from "./EditorInner";
```

替換為：

```tsx
import { EditorInner } from "./EditorInner";
import { renderRichText } from "../../../lib/richtext/render";
```

第 2 處，原始片段（逐字）：

```tsx
      <div
        className="rich-text"
        dangerouslySetInnerHTML={{ __html: props.content }}
        contentEditable
      />
```

替換為：

```tsx
      {/* Same renderer as the published page, so nothing shifts when the
          editor finishes loading */}
      <div className="rich-text">{renderRichText(props.content)}</div>
```

`packages/core/lib/field-transforms/default-transforms/rich-text-transform.tsx` 第 1 處，原始片段（逐字）：

```tsx
import type { Editor as TipTapEditor, JSONContent } from "@tiptap/react";
```

替換為：

```tsx
import type { Editor as TipTapEditor } from "@tiptap/react";
```

第 2 處，原始片段（逐字）：

```tsx
import { RichtextField, UiState } from "../../../types";
```

替換為：

```tsx
import { RichtextField, UiState } from "../../../types";
import type { RichTextDoc } from "../../richtext/types";
```

第 3 處，原始片段（逐字）：

```tsx
    value: string;
    componentId: string;
```

替換為：

```tsx
    value: RichTextDoc | string;
    componentId: string;
```

第 4 處，原始片段（逐字）：

```tsx
      async (content: string | JSONContent, ui?: Partial<UiState>) => {
```

替換為：

```tsx
      async (content: RichTextDoc, ui?: Partial<UiState>) => {
```

`RichtextField`（欄位面板）不需要修改：它把 `useDeepField(name)` 的值原樣傳給 `Editor`，`onChange` 也原樣傳回欄位。

- [ ] **Step 10: 執行測試、typecheck、lint**

```bash
(cd packages/core && pnpm test components/Puck/__tests__/richtext.spec.tsx components/RichTextEditor __tests__/richtext-no-inner-html.spec.ts) 2>&1 | grep -E "^(PASS|FAIL)|✕|^Tests:"
pnpm typecheck > /dev/null 2>&1; echo "typecheck=$?"
(cd packages/core && pnpm lint) 2>&1 | grep -E "✖|error"
pnpm exec prettier --check packages/core/components packages/core/lib packages/core/__tests__
git grep -n "dangerouslySetInnerHTML" -- packages/core ':!*.spec.*' ':!*.md'
```

預期（檔案順序可能不同）：

```
PASS __tests__/richtext-no-inner-html.spec.ts
PASS components/RichTextEditor/lib/__tests__/stable-stringify.spec.ts
PASS components/RichTextEditor/lib/__tests__/fit-to-schema.spec.ts
PASS components/RichTextEditor/__tests__/editor.spec.tsx
PASS components/Puck/__tests__/richtext.spec.tsx
PASS components/RichTextEditor/__tests__/editor-fallback.spec.tsx
Tests:       57 passed, 57 total
typecheck=0
✖ 4 problems (0 errors, 4 warnings)
  0 errors and 4 warnings potentially fixable with the `--fix` option.
Checking formatting...
All matched files use Prettier code style!
packages/core/components/DropZone/index.tsx:89:      <div dangerouslySetInnerHTML={{ __html: element.outerHTML }} />
```

`dangerouslySetInnerHTML` 只剩與 richtext 無關的 `DropZone`。

- [ ] **Step 11: 更新 CHANGELOG 並 commit**

`CHANGELOG.md`（清單最後一行，Task 6 Step 14 加入） 原始片段（逐字）：

```markdown
* render richtext everywhere it is displayed with one shared renderer built on `@tiptap/static-renderer`, exported as `renderRichText` and `RichTextContent` together with `normalizeRichText`, `isSafeHref` and `textToRichText`; a legacy HTML string is shown as plain text and never parsed, content nested deeper than 100 levels is reduced to text, and the lazy `@tiptap/html` renderer with its `dangerouslySetInnerHTML` fallback is removed
```

替換為：

```markdown
* render richtext everywhere it is displayed with one shared renderer built on `@tiptap/static-renderer`, exported as `renderRichText` and `RichTextContent` together with `normalizeRichText`, `isSafeHref` and `textToRichText`; a legacy HTML string is shown as plain text and never parsed, content nested deeper than 100 levels is reduced to text, and the lazy `@tiptap/html` renderer with its `dangerouslySetInnerHTML` fallback is removed
* **breaking:** the richtext editor stores Tiptap JSON (`editor.getJSON()`) instead of HTML, shows a legacy HTML string as plain text, and renders its loading placeholder with the shared renderer instead of `dangerouslySetInnerHTML`; a richtext field's `options` and `tiptap.extensions` no longer affect rendering, so node and mark types added by `tiptap.extensions` are shown as plain text on published pages and removed when the editor reopens the content (with a warning in development), content that `options` turns off opens in the editor as plain text instead of an empty editor, and the editor only creates links that `isSafeHref` allows
```

```bash
git add packages/core/components/RichTextEditor/lib/stable-stringify.ts packages/core/components/RichTextEditor/lib/__tests__/stable-stringify.spec.ts packages/core/components/RichTextEditor/lib/fit-to-schema.ts packages/core/components/RichTextEditor/lib/__tests__/fit-to-schema.spec.ts packages/core/components/RichTextEditor/lib/use-synced-editor.ts packages/core/components/RichTextEditor/extension.ts packages/core/components/RichTextEditor/types.ts packages/core/components/RichTextEditor/components/EditorFallback.tsx packages/core/lib/field-transforms/default-transforms/rich-text-transform.tsx packages/core/components/Puck/__tests__/richtext.spec.tsx packages/core/components/RichTextEditor/__tests__/editor-fallback.spec.tsx packages/core/components/RichTextEditor/__tests__/editor.spec.tsx packages/core/__tests__/richtext-no-inner-html.spec.ts CHANGELOG.md
git status --short
git commit -m "feat(richtext): store richtext as Tiptap JSON" -m "The editor reports editor.getJSON() instead of editor.getHTML(). The content it shows goes through normalizeRichText, so the editor, its loading placeholder and the published page show the same thing, and a legacy HTML string is plain text everywhere. fitToSchema then fits it to the field's editor schema, so content with a node or mark type the field's options turned off keeps its text instead of loading as an empty document that the next edit would save. External changes are compared as JSON with sorted keys, so content the editor produced itself, or whose normalized form it already shows, is not set again. EditorFallback renders with renderRichText instead of passing the stored HTML to dangerouslySetInnerHTML, and a test keeps dangerouslySetInnerHTML out of the richtext sources. The Link extension only allows hrefs that isSafeHref allows, the same rule the renderer applies, and the editor warns in development about types from tiptap.extensions that the renderer does not support." -m "BREAKING CHANGE: richtext field values are Tiptap JSON (RichTextDoc). Existing HTML strings are shown as plain text until they are converted (see the richtext-migrate entry). Node and mark types added through tiptap.extensions are not rendered and are removed when the editor reopens the content."
```

預期（hash 會不同）：

```
M  CHANGELOG.md
A  packages/core/__tests__/richtext-no-inner-html.spec.ts
M  packages/core/components/Puck/__tests__/richtext.spec.tsx
A  packages/core/components/RichTextEditor/__tests__/editor-fallback.spec.tsx
A  packages/core/components/RichTextEditor/__tests__/editor.spec.tsx
M  packages/core/components/RichTextEditor/components/EditorFallback.tsx
M  packages/core/components/RichTextEditor/extension.ts
A  packages/core/components/RichTextEditor/lib/__tests__/fit-to-schema.spec.ts
A  packages/core/components/RichTextEditor/lib/__tests__/stable-stringify.spec.ts
A  packages/core/components/RichTextEditor/lib/fit-to-schema.ts
A  packages/core/components/RichTextEditor/lib/stable-stringify.ts
M  packages/core/components/RichTextEditor/lib/use-synced-editor.ts
M  packages/core/components/RichTextEditor/types.ts
M  packages/core/lib/field-transforms/default-transforms/rich-text-transform.tsx
?? CLAUDE.md
[tzuchi/main <hash>] feat(richtext): store richtext as Tiptap JSON
 14 files changed, 880 insertions(+), 29 deletions(-)
 create mode 100644 packages/core/__tests__/richtext-no-inner-html.spec.ts
 create mode 100644 packages/core/components/RichTextEditor/__tests__/editor-fallback.spec.tsx
 create mode 100644 packages/core/components/RichTextEditor/__tests__/editor.spec.tsx
 create mode 100644 packages/core/components/RichTextEditor/lib/__tests__/fit-to-schema.spec.ts
 create mode 100644 packages/core/components/RichTextEditor/lib/__tests__/stable-stringify.spec.ts
 create mode 100644 packages/core/components/RichTextEditor/lib/fit-to-schema.ts
 create mode 100644 packages/core/components/RichTextEditor/lib/stable-stringify.ts
```

- [ ] **Step 12: 完整驗證**

```bash
pnpm verify > "${TMPDIR:-/tmp}/tceditor-verify-task07.log" 2>&1
echo "exit=$?"
grep -E "Test Suites:|Tests:|Snapshots:|ℹ (tests|pass|fail)|> tsc|✖|Tasks:|All matched|^pnpm audit:|^GATED|^audit:gate (passed|FAILED)" "${TMPDIR:-/tmp}/tceditor-verify-task07.log"
```

預期輸出：

```
exit=0
@tzuchi/tceditor:test: Test Suites: 65 passed, 65 total
@tzuchi/tceditor:test: Tests:       608 passed, 608 total
@tzuchi/tceditor:test: Snapshots:   19 passed, 19 total
 Tasks:    1 successful, 1 total
ℹ tests 10
ℹ pass 10
ℹ fail 0
> tsc -p tsconfig.typecheck.json
demo:lint: ✖ 8 problems (0 errors, 8 warnings)
@tzuchi/tceditor:lint: ✖ 4 problems (0 errors, 4 warnings)
 Tasks:    3 successful, 3 total
All matched files use Prettier code style!
 Tasks:    3 successful, 3 total
pnpm audit: 69 advisories, 71 finding path(s). 105 package versions ship with packages/core, packages/plugin-heading-analyzer.
GATED (ships with a published package): 0 finding(s)
audit:gate passed: no advisories affect packages/core, packages/plugin-heading-analyzer (71 finding path(s) elsewhere are listed above).
```

與 Task 6 相比：jest 多了 5 個 suite（stable-stringify、fit-to-schema、editor、editor-fallback、richtext-no-inner-html）與 52 個測試（4 + 8 + 4 + 32 + 1，加上 Puck richtext 的 3 個），60 → 65 個 suite，556 → 608 個測試；其他數字不變。

### Task 8: HTML→JSON 轉換入口與打包檢查

目的：提供一次性轉換舊 HTML richtext 的工具（規格 §6 F1 第 5 點、§9 第 5 項），並保證它需要的 `@tiptap/html` 與 `happy-dom` 不會進入主入口與 RSC 入口。

- `lib/richtext/html-to-json.ts`：`richTextHtmlToJson(html)` 重現 v0.23.0 的「正常渲染路徑」：字串看起來像 HTML（同一個 regex `/<\/?[a-z][\s\S]*>/i`）就用 `@tiptap/html/server` 的 `generateJSON(html, [PuckRichText])`（happy-dom）解析，否則當純文字段落；結果再經 `normalizeRichText`。內部函式 `parseRichTextHtml(html, extensions)` 做同樣的事，但用指定欄位的 extensions 解析。
- `lib/richtext/migrate-data.ts`：`migrateRichTextInData(data, config)` 依 `config` 找出所有 richtext 欄位（含 array/object 欄位內、slot 內、root、legacy `zones`），只轉換其中的**字串**值；其他欄位、已是 JSON 的值、config 中沒有的元件都不動；不新增原本不存在的 prop；回傳新物件，不修改輸入。每個欄位都以 `[PuckRichText.configure(field.options), ...(field.tiptap?.extensions ?? [])]` 解析，與 v0.23.0 的 `RichTextRender` 相同：欄位關掉的標記（例如 `options: { bold: false }` 的粗體）在轉換時就丟掉、只留文字，轉換結果才不會含有該欄位編輯器沒有的型別。`zones` 以 `Object.fromEntries` 建立，名為 `__proto__` 的 zone 也會照常複製（`reduce` 加上 `acc[key] = …` 會改到原型而讓該 zone 消失，與 F4 是同一類問題）。
- 新入口 `@tzuchi/tceditor/richtext-migrate`（`bundle/richtext-migrate.ts`）。
- `packages/core/scripts/check-bundle-imports.mjs`：從 `dist/index.mjs`、`dist/rsc.mjs`、`dist/index.js`、`dist/rsc.js` 出發，沿著相對路徑的 `import`/`import()`/`require` 走訪所有可達的 chunk，任何一個檔案含 `happy-dom` 或 `@tiptap/html` 字樣就失敗。根目錄 `pnpm check:bundle`，並加進 `pnpm verify`（`build` 之後、`audit:gate` 之前）。

**偏離 orchestrator 指示與規格之處**：
- `migrate-data.ts` 沒有使用 `mapFields`/`walkTree`，而是一個專用的走訪函式（約 90 行）：`mapFields` 會補上預設 slot（`defaultSlots`）、對缺少的欄位加上值為 `undefined` 的 key，遞迴進 slot 時遇到 config 中沒有的元件會丟錯，而且其中的 reduce + spread 有 O(n²) 問題（F3，Task 10 才修）。這些都不符合「只改 richtext 欄位、不動其他」的要求。
- 規格寫的是 `scripts/richtext-html-to-json`，依共同介面改為套件入口 `richtext-migrate`，S3 的寫入 API 或一次性腳本都可以 import 它。規格說 `happy-dom` 降為 devDependency；依共同介面，`@tiptap/html` 與 `happy-dom` 留在 `dependencies`（轉換入口在執行期需要它們），以 `check:bundle` 保證它們只被這個入口使用。

**注意**：
- `@tiptap/html/server` 一樣是子路徑 export，core 的 tsconfig 要加一筆 `paths`（不寫副檔名）。demo 不 import 這個入口，不需要修改。
- `happy-dom` 20 只有 ESM。jest 預設不轉譯 `node_modules`，所以 `jest.config.ts` 的 `transformIgnorePatterns` 白名單要加上 `happy-dom`；用到真正 happy-dom 的測試檔標註 `/** @jest-environment node */`（在 jsdom 環境中載入 happy-dom 會失敗）。第一次執行會轉譯 happy-dom，多花幾秒，之後由 jest 快取。
- 「與 tiptap 正常路徑等價」的測試（`html-to-json.spec.tsx`）在 jsdom 環境中執行，用 `jest.mock` 把 `@tiptap/html/server` 換成瀏覽器版，才能用 Task 5 的 `isSameDom` 比較 DOM；`html-to-json.server.spec.ts` 則在 node 環境用真正的 happy-dom，驗證 tiptap 自己產生的 HTML 能轉回完全相同的 JSON。
- 轉換入口的 CJS 版（`dist/richtext-migrate.js`）透過 `@tiptap/html/server` 的 CJS 版 `require("happy-dom")`，而 happy-dom 只有 ESM，所以需要支援 `require(esm)` 的 Node（22.12 以上；本機 Node 26 可以）。Node 20 請用 ESM `import`。這是 tiptap 上游的限制。

**執行位置**：主工作目錄，接在 Task 7 的 commit（`feat(richtext): store richtext as Tiptap JSON`）之後。

**Files:**
- Create:
  - `packages/core/lib/richtext/html-to-json.ts`
  - `packages/core/lib/richtext/migrate-data.ts`
  - `packages/core/bundle/richtext-migrate.ts`
  - `packages/core/scripts/check-bundle-imports.mjs`
- Modify:
  - `packages/core/tsconfig.json`（`paths`）
  - `packages/core/jest.config.ts`（`transformIgnorePatterns`）
  - `packages/core/package.json`（`exports`、`typesVersions`、`build`）
  - `package.json`（根目錄：`test`、`check:bundle`、`verify`）
  - `CHANGELOG.md`
- Test（新增）:
  - `packages/core/lib/richtext/__tests__/html-to-json.spec.tsx`（jsdom，與 v0.23.0 正常路徑的輸出比較）
  - `packages/core/lib/richtext/__tests__/html-to-json.server.spec.ts`（node 環境，真正的 happy-dom）
  - `packages/core/lib/richtext/__tests__/migrate-data.spec.ts`（node 環境）
  - `packages/core/scripts/check-bundle-imports.test.mjs`（`node:test`，由根目錄 `pnpm test` 執行）

**Interfaces:**
- Consumes：Task 5 的 `normalizeRichText`、`textToRichText`、`renderRichText`、`RichTextDoc`、測試輔助（`allTypicalContent`、`typicalContent`、`doc`、`tiptapHtml`、`isSameDom`）；`PuckRichText`；Task 1 的根目錄 `test`/`verify` script（原始片段見 Step 10）；Task 7 的 CHANGELOG 最後一行。
- Produces：
  - `lib/richtext/html-to-json.ts`：`export function richTextHtmlToJson(html: string): RichTextDoc`；內部（不進入口）：`export function parseRichTextHtml(html: string, extensions: Extensions): RichTextDoc`。
  - `lib/richtext/migrate-data.ts`：`export function migrateRichTextInData<T extends Data>(data: T, config: Config): T`。
  - 套件入口 `@tzuchi/tceditor/richtext-migrate`（`dist/richtext-migrate.{mjs,js,d.ts}`），匯出上面兩個函式。
  - `packages/core/scripts/check-bundle-imports.mjs`：`export const ENTRIES`、`export const FORBIDDEN`、`export function collectFiles(distDir, entry): string[]`、`export function findForbidden(distDir, entries?, forbidden?): { entry, file, name }[]`；直接執行時是 CLI。
  - 根目錄 script：`"check:bundle": "node packages/core/scripts/check-bundle-imports.mjs"`；`verify` 變成 `pnpm test && pnpm typecheck && pnpm lint && pnpm format:check && pnpm build && pnpm check:bundle && pnpm audit:gate`；`test` 也執行 `packages/core/scripts/check-bundle-imports.test.mjs`。之後的 task 若要修改這三個 script，以 Step 10 的替換後片段為原始片段。
  - `CHANGELOG.md` 清單最後一行變成 Step 11 加入的那一行。

- [ ] **Step 1: 確認起點**

```bash
cd /Users/kaellim/Desktop/projects/puck
git status --short
git log --oneline -1
```

預期（hash 會不同）：

```
?? CLAUDE.md
<hash> feat(richtext): store richtext as Tiptap JSON
```

- [ ] **Step 2: 寫轉換工具的失敗測試**

建立 `packages/core/lib/richtext/__tests__/html-to-json.spec.tsx`（`legacyRender` 是 v0.23.0 `RichTextRender` 的邏輯，作為「正常路徑」的 oracle）：

```tsx
import { generateHTML, generateJSON } from "@tiptap/html";
import { renderToStaticMarkup } from "react-dom/server.node";
import { PuckRichText } from "../../../components/RichTextEditor/extension";
import { richTextHtmlToJson } from "../html-to-json";
import { renderRichText } from "../render";
import { allTypicalContent } from "../__helpers__/fixtures";
import { isSameDom, tiptapHtml } from "../__helpers__/dom";

// Parse with jsdom here (the browser build); html-to-json.server.spec.ts runs
// the real server build with happy-dom.
jest.mock("@tiptap/html/server", () => jest.requireActual("@tiptap/html"));

/** What v0.23.0's RichTextRender showed for a stored string. */
const legacyRender = (content: string) => {
  if (!content) return "";

  const extensions = [PuckRichText];
  const json = /<\/?[a-z][\s\S]*>/i.test(content)
    ? generateJSON(content, extensions)
    : {
        type: "doc",
        content: [
          { type: "paragraph", content: [{ type: "text", text: content }] },
        ],
      };

  return generateHTML(json, extensions);
};

const legacyContent: Record<string, string> = {
  "editor output": tiptapHtml(allTypicalContent),
  "demo default": "<h2>Heading</h2><p>Body</p>",
  "styled markup": `<h2 style="text-align: center">Title</h2><p><strong>bold</strong> <em>it</em> <u>u</u> <a href="https://example.com" target="_blank" rel="noopener noreferrer nofollow">link</a></p><ul><li><p>item</p></li></ul><blockquote><p>q</p></blockquote>`,
  "markup outside the schema": `<p>hi</p><img src=x onerror="alert(1)"><table><tr><td>cell</td></tr></table>`,
  "unsafe link": `<p><a href="javascript:alert(1)">x</a></p>`,
  "CSS injection": `<p style="text-align: center; background: url(//evil.example)">x</p>`,
  "plain text": "Plain text & more",
  empty: "",
};

describe("richTextHtmlToJson", () => {
  it.each(Object.keys(legacyContent))(
    "renders %s the way v0.23.0 did",
    (name) => {
      const html = legacyContent[name];
      const actual = renderToStaticMarkup(
        <>{renderRichText(richTextHtmlToJson(html))}</>
      );
      const expected = legacyRender(html);

      expect({ same: isSameDom(actual, expected), actual, expected }).toEqual({
        same: true,
        actual,
        expected,
      });
    }
  );
});
```

建立 `packages/core/lib/richtext/__tests__/html-to-json.server.spec.ts`（連結的案例另外測：HTML 裡沒有 `target`/`rel` 時，tiptap 解析會補上預設值，所以 `typicalContent.links` 不會原樣轉回）：

```ts
/** @jest-environment node */
import { generateHTML } from "@tiptap/html/server";
import { PuckRichText } from "../../../components/RichTextEditor/extension";
import { richTextHtmlToJson } from "../html-to-json";
import { doc, typicalContent } from "../__helpers__/fixtures";

const paragraph = (...content: object[]) => ({
  type: "paragraph",
  attrs: { textAlign: null },
  content,
});

describe("richTextHtmlToJson on the server (happy-dom)", () => {
  it.each(Object.keys(typicalContent).filter((name) => name !== "links"))(
    "turns Tiptap's HTML for %s back into the same JSON",
    (name) => {
      const value = typicalContent[name];

      expect(richTextHtmlToJson(generateHTML(value, [PuckRichText]))).toEqual(
        value
      );
    }
  );

  it("gives links without target or rel Tiptap's defaults", () => {
    expect(richTextHtmlToJson('<p><a href="/about">about</a></p>')).toEqual(
      doc(
        paragraph({
          type: "text",
          text: "about",
          marks: [
            {
              type: "link",
              attrs: {
                href: "/about",
                target: "_blank",
                rel: "noopener noreferrer nofollow",
                class: null,
                title: null,
              },
            },
          ],
        })
      )
    );
  });

  it("drops markup outside the schema", () => {
    expect(
      richTextHtmlToJson(
        `<p>hi</p><img src=x onerror="alert(1)"><script>alert(1)</script>`
      )
    ).toEqual(doc(paragraph({ type: "text", text: "hi" })));
  });

  it("keeps a string without tags as plain text", () => {
    expect(richTextHtmlToJson("a & b")).toEqual(
      doc(paragraph({ type: "text", text: "a & b" }))
    );
  });
});
```

建立 `packages/core/lib/richtext/__tests__/migrate-data.spec.ts`：

```ts
/** @jest-environment node */
import type { Config, Data } from "../../../types";
import { migrateRichTextInData } from "../migrate-data";

const json = (text: string, tag: "p" | "h2" = "p") => ({
  type: "doc",
  content: [
    tag === "p"
      ? {
          type: "paragraph",
          attrs: { textAlign: null },
          content: [{ type: "text", text }],
        }
      : {
          type: "heading",
          attrs: { textAlign: null, level: 2 },
          content: [{ type: "text", text }],
        },
  ],
});

const config: Config = {
  root: {
    fields: { intro: { type: "richtext" }, title: { type: "text" } },
  },
  components: {
    Card: {
      fields: {
        body: { type: "richtext" },
        caption: { type: "text" },
        items: {
          type: "array",
          arrayFields: { text: { type: "richtext" }, label: { type: "text" } },
        },
        meta: {
          type: "object",
          objectFields: { note: { type: "richtext" } },
        },
        children: { type: "slot" },
      },
      render: () => null,
    },
    Plain: {
      fields: { html: { type: "textarea" } },
      render: () => null,
    },
    Limited: {
      fields: {
        body: { type: "richtext", options: { bold: false, heading: false } },
      },
      render: () => null,
    },
  },
};

const data: Data = {
  root: { props: { intro: "<h2>Intro</h2>", title: "<p>not richtext</p>" } },
  content: [
    {
      type: "Card",
      props: {
        id: "card-1",
        body: "<p>Body</p>",
        caption: "<p>caption stays</p>",
        items: [{ text: "<p>Item</p>", label: "<p>label stays</p>" }],
        meta: { note: "<p>Note</p>" },
        children: [
          {
            type: "Card",
            props: { id: "card-2", body: "<p>Nested</p>" },
          },
        ],
      },
    },
    { type: "Plain", props: { id: "plain-1", html: "<p>textarea stays</p>" } },
    {
      type: "Unknown",
      props: { id: "unknown-1", body: "<p>unknown stays</p>" },
    },
    { type: "constructor", props: { id: "proto-1", body: "<p>stays</p>" } },
  ],
  zones: {
    "card-1:legacy": [
      { type: "Card", props: { id: "card-3", body: "<p>In a zone</p>" } },
    ],
  },
};

describe("migrateRichTextInData", () => {
  it("converts richtext fields everywhere and leaves everything else alone", () => {
    expect(migrateRichTextInData(data, config)).toEqual({
      root: {
        props: { intro: json("Intro", "h2"), title: "<p>not richtext</p>" },
      },
      content: [
        {
          type: "Card",
          props: {
            id: "card-1",
            body: json("Body"),
            caption: "<p>caption stays</p>",
            items: [{ text: json("Item"), label: "<p>label stays</p>" }],
            meta: { note: json("Note") },
            children: [
              { type: "Card", props: { id: "card-2", body: json("Nested") } },
            ],
          },
        },
        {
          type: "Plain",
          props: { id: "plain-1", html: "<p>textarea stays</p>" },
        },
        {
          type: "Unknown",
          props: { id: "unknown-1", body: "<p>unknown stays</p>" },
        },
        { type: "constructor", props: { id: "proto-1", body: "<p>stays</p>" } },
      ],
      zones: {
        "card-1:legacy": [
          { type: "Card", props: { id: "card-3", body: json("In a zone") } },
        ],
      },
    });
  });

  it("does not modify its input", () => {
    const before = JSON.stringify(data);

    migrateRichTextInData(data, config);

    expect(JSON.stringify(data)).toBe(before);
  });

  it("leaves JSON values as they are", () => {
    const migrated = migrateRichTextInData(
      {
        root: { props: {} },
        content: [{ type: "Card", props: { id: "card-1", body: json("x") } }],
      },
      config
    );

    expect(migrated.content[0].props.body).toEqual(json("x"));
  });

  it("parses each field with its own options", () => {
    const migrated = migrateRichTextInData(
      {
        root: { props: {} },
        content: [
          {
            type: "Limited",
            props: {
              id: "limited-1",
              body: "<h2>Title</h2><p><strong>bold</strong> text</p>",
            },
          },
        ],
      },
      config
    );

    expect(migrated.content[0].props.body).toEqual({
      type: "doc",
      content: [json("Title").content[0], json("bold text").content[0]],
    });
  });

  it("keeps a zone named __proto__", () => {
    const migrated = migrateRichTextInData(
      {
        root: { props: {} },
        content: [],
        zones: JSON.parse(
          '{"__proto__": [{"type": "Card", "props": {"id": "card-4", "body": "<p>Proto</p>"}}]}'
        ),
      },
      config
    );

    expect(Object.keys(migrated.zones ?? {})).toEqual(["__proto__"]);
    expect(
      Object.getOwnPropertyDescriptor(migrated.zones, "__proto__")?.value
    ).toEqual([{ type: "Card", props: { id: "card-4", body: json("Proto") } }]);
  });

  it("does not add props that were missing", () => {
    const migrated = migrateRichTextInData(
      { root: {}, content: [{ type: "Card", props: { id: "card-1" } }] },
      config
    );

    expect(migrated.content[0].props).toStrictEqual({ id: "card-1" });
    expect(migrated.root).toStrictEqual({});
    expect(migrated).not.toHaveProperty("zones");
  });
});
```

```bash
(cd packages/core && pnpm test lib/richtext/__tests__/html-to-json lib/richtext/__tests__/migrate-data) 2>&1 | grep -E "^(PASS|FAIL)|Cannot find module|^Tests:"
```

預期失敗（檔案順序可能不同）：

```
FAIL lib/richtext/__tests__/migrate-data.spec.ts
    Cannot find module '../migrate-data' from 'lib/richtext/__tests__/migrate-data.spec.ts'
FAIL lib/richtext/__tests__/html-to-json.server.spec.ts
FAIL lib/richtext/__tests__/html-to-json.spec.tsx
    Cannot find module '../html-to-json' from 'lib/richtext/__tests__/html-to-json.spec.tsx'
Tests:       0 total
```

`html-to-json.server.spec.ts` 沒有印出 `Cannot find module`：它先 import `@tiptap/html/server`，在載入 happy-dom 時就失敗了（Step 3、4 處理）。

- [ ] **Step 3: 實作 `richTextHtmlToJson` 與 `migrateRichTextInData`**

建立 `packages/core/lib/richtext/html-to-json.ts`：

```ts
import type { Extensions } from "@tiptap/core";
import { generateJSON } from "@tiptap/html/server";
import { PuckRichText } from "../../components/RichTextEditor/extension";
import { normalizeRichText } from "./normalize";
import { textToRichText } from "./text-to-richtext";
import type { RichTextDoc } from "./types";

// The test v0.23.0's renderer used to decide whether a string was HTML
const LOOKS_LIKE_HTML = /<\/?[a-z][\s\S]*>/i;

/**
 * Converts a legacy richtext HTML string to JSON, the way v0.23.0 rendered
 * it: HTML is parsed with Tiptap's schema (so anything outside the schema is
 * dropped), any other string becomes a plain text paragraph.
 *
 * Runs on the server only, because parsing needs happy-dom. Not part of the
 * main entry; import it from "@tzuchi/tceditor/richtext-migrate".
 */
export function richTextHtmlToJson(html: string): RichTextDoc {
  return parseRichTextHtml(html, [PuckRichText]);
}

/**
 * richTextHtmlToJson with the extensions of one richtext field, so markup the
 * field's editor cannot show (for example bold with `options: { bold: false }`)
 * is dropped the way v0.23.0 dropped it. Used by migrateRichTextInData.
 */
export function parseRichTextHtml(
  html: string,
  extensions: Extensions
): RichTextDoc {
  if (!LOOKS_LIKE_HTML.test(html)) return textToRichText(html);

  return normalizeRichText(generateJSON(html, extensions));
}
```

建立 `packages/core/lib/richtext/migrate-data.ts`：

```ts
import type {
  ComponentData,
  Config,
  Content,
  Data,
  Field,
  Fields,
} from "../../types";
import { PuckRichText } from "../../components/RichTextEditor/extension";
import { parseRichTextHtml } from "./html-to-json";

type Props = Record<string, unknown>;

const isRecord = (value: unknown): value is Props =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const hasOwn = (object: object, key: string) =>
  Object.prototype.hasOwnProperty.call(object, key);

function migrateValue(value: unknown, field: Field, config: Config): unknown {
  switch (field.type) {
    case "richtext":
      // Parse with the field's own extensions, like v0.23.0's renderer, so
      // the result only uses what the field's editor can show
      return typeof value === "string"
        ? parseRichTextHtml(value, [
            PuckRichText.configure(field.options),
            ...(field.tiptap?.extensions ?? []),
          ])
        : value;
    case "array":
      return Array.isArray(value)
        ? value.map((item) =>
            isRecord(item)
              ? migrateProps(item, field.arrayFields, config)
              : item
          )
        : value;
    case "object":
      return isRecord(value)
        ? migrateProps(value, field.objectFields, config)
        : value;
    case "slot":
      return Array.isArray(value) ? migrateContent(value, config) : value;
    default:
      return value;
  }
}

function migrateProps(props: Props, fields: Fields, config: Config): Props {
  const result: Props = { ...props };

  for (const key of Object.keys(fields)) {
    if (hasOwn(props, key)) {
      result[key] = migrateValue(props[key], fields[key], config);
    }
  }

  return result;
}

function migrateComponent(item: ComponentData, config: Config): ComponentData {
  const componentConfig = hasOwn(config.components, item.type)
    ? config.components[item.type]
    : undefined;

  if (!componentConfig?.fields || !isRecord(item.props)) return item;

  return {
    ...item,
    props: migrateProps(
      item.props,
      componentConfig.fields,
      config
    ) as ComponentData["props"],
  };
}

function migrateContent(content: Content, config: Config): Content {
  return content.map((item) =>
    isRecord(item) ? migrateComponent(item, config) : item
  );
}

/**
 * Converts every legacy HTML string in a richtext field to JSON (see
 * richTextHtmlToJson), parsed with that field's `options` and
 * `tiptap.extensions`. Fields are found through `config`, including richtext
 * inside array and object fields, slots, the root and legacy DropZone zones.
 * Other values are left as they are. Returns a new object; `data` is not
 * modified.
 */
export function migrateRichTextInData<T extends Data>(
  data: T,
  config: Config
): T {
  const rootFields = config.root?.fields;
  const root =
    rootFields && isRecord(data.root.props)
      ? {
          ...data.root,
          props: migrateProps(data.root.props, rootFields, config),
        }
      : data.root;

  // Object.fromEntries creates own properties, so even a zone named
  // "__proto__" is copied like any other
  const zones = data.zones
    ? Object.fromEntries(
        Object.keys(data.zones).map((key) => [
          key,
          migrateContent(data.zones![key], config),
        ])
      )
    : undefined;

  return {
    ...data,
    root,
    content: migrateContent(data.content, config),
    ...(zones ? { zones } : {}),
  };
}
```

```bash
(cd packages/core && pnpm test lib/richtext/__tests__/html-to-json lib/richtext/__tests__/migrate-data) 2>&1 | grep -E "^(PASS|FAIL)|Jest encountered an unexpected token|happy-dom/lib/index.js|^Tests:" | sed 's#^.*/node_modules/#    …/node_modules/#'
```

預期：jsdom 的等價測試通過，兩個 node 環境的測試檔因 happy-dom 是 ESM 而無法載入（檔案順序可能不同）：

```
FAIL lib/richtext/__tests__/html-to-json.server.spec.ts
    Jest encountered an unexpected token
    …/node_modules/happy-dom/lib/index.js:1
FAIL lib/richtext/__tests__/migrate-data.spec.ts
    Jest encountered an unexpected token
    …/node_modules/happy-dom/lib/index.js:1
PASS lib/richtext/__tests__/html-to-json.spec.tsx
Tests:       8 passed, 8 total
```

- [ ] **Step 4: 讓 jest 轉譯 happy-dom**

`packages/core/jest.config.ts` 原始片段（逐字）：

```ts
  // Re-enable transform *inside* selected node_modules
  transformIgnorePatterns: [
    "/node_modules/(?!(?:\\.pnpm|@preact/signals-core|@preact/signals-react|@dnd-kit)/)",
  ],
```

替換為：

```ts
  // Re-enable transform *inside* selected node_modules. happy-dom is ESM-only;
  // the richtext-migrate tests load it through @tiptap/html/server.
  transformIgnorePatterns: [
    "/node_modules/(?!(?:\\.pnpm|@preact/signals-core|@preact/signals-react|@dnd-kit|happy-dom)/)",
  ],
```

```bash
(cd packages/core && pnpm test --verbose lib/richtext/__tests__/html-to-json lib/richtext/__tests__/migrate-data) 2>&1 | grep -E "^(PASS|FAIL)|✓|✕|^Tests:" | sed -E 's/ \([0-9]+ ms\)//'
```

預期（檔案順序可能不同；第一次會花幾秒轉譯 happy-dom）：

```
PASS lib/richtext/__tests__/html-to-json.spec.tsx
    ✓ renders editor output the way v0.23.0 did
    ✓ renders demo default the way v0.23.0 did
    ✓ renders styled markup the way v0.23.0 did
    ✓ renders markup outside the schema the way v0.23.0 did
    ✓ renders unsafe link the way v0.23.0 did
    ✓ renders CSS injection the way v0.23.0 did
    ✓ renders plain text the way v0.23.0 did
    ✓ renders empty the way v0.23.0 did
PASS lib/richtext/__tests__/migrate-data.spec.ts
    ✓ converts richtext fields everywhere and leaves everything else alone
    ✓ does not modify its input
    ✓ leaves JSON values as they are
    ✓ parses each field with its own options
    ✓ keeps a zone named __proto__
    ✓ does not add props that were missing
PASS lib/richtext/__tests__/html-to-json.server.spec.ts
    ✓ turns Tiptap's HTML for headings back into the same JSON
    ✓ turns Tiptap's HTML for alignment back into the same JSON
    ✓ turns Tiptap's HTML for marks back into the same JSON
    ✓ turns Tiptap's HTML for nestedMarks back into the same JSON
    ✓ turns Tiptap's HTML for codeBlocks back into the same JSON
    ✓ turns Tiptap's HTML for blockquote back into the same JSON
    ✓ turns Tiptap's HTML for orderedLists back into the same JSON
    ✓ turns Tiptap's HTML for nestedLists back into the same JSON
    ✓ turns Tiptap's HTML for hardBreaks back into the same JSON
    ✓ turns Tiptap's HTML for horizontalRule back into the same JSON
    ✓ turns Tiptap's HTML for emptyParagraphs back into the same JSON
    ✓ turns Tiptap's HTML for specialCharacters back into the same JSON
    ✓ gives links without target or rel Tiptap's defaults
    ✓ drops markup outside the schema
    ✓ keeps a string without tags as plain text
Tests:       29 passed, 29 total
```

- [ ] **Step 5: 讓 typecheck 解析 `@tiptap/html/server`**

```bash
pnpm typecheck 2>&1 | grep -E "error TS" | sed 's/^ *//' | cut -c1-110
```

預期失敗：

```
lib/richtext/html-to-json.ts(2,30): error TS2307: Cannot find module '@tiptap/html/server' or its correspondin
```

`packages/core/tsconfig.json` 原始片段（逐字）：

```json
    "paths": {
      "@tiptap/static-renderer/json/react": [
```

替換為：

```json
    "paths": {
      "@tiptap/html/server": ["./node_modules/@tiptap/html/dist/server/index"],
      "@tiptap/static-renderer/json/react": [
```

```bash
pnpm typecheck > /dev/null 2>&1; echo "typecheck=$?"
(cd packages/core && pnpm lint) 2>&1 | grep -E "✖|error"
pnpm exec prettier --check packages/core/lib/richtext packages/core/jest.config.ts
```

預期輸出：

```
typecheck=0
✖ 4 problems (0 errors, 4 warnings)
  0 errors and 4 warnings potentially fixable with the `--fix` option.
Checking formatting...
All matched files use Prettier code style!
```

- [ ] **Step 6: Commit 轉換工具**

```bash
git add packages/core/lib/richtext/html-to-json.ts packages/core/lib/richtext/migrate-data.ts packages/core/lib/richtext/__tests__/html-to-json.spec.tsx packages/core/lib/richtext/__tests__/html-to-json.server.spec.ts packages/core/lib/richtext/__tests__/migrate-data.spec.ts packages/core/jest.config.ts packages/core/tsconfig.json
git status --short
git commit -m "feat(richtext): convert legacy HTML richtext to JSON" -m "richTextHtmlToJson converts a stored HTML string the way v0.23.0 rendered it: HTML is parsed with Tiptap's schema through @tiptap/html/server (happy-dom) and plain strings become a text paragraph. migrateRichTextInData converts every richtext string that config describes, including richtext in array and object fields, slots, the root and legacy zones, and leaves everything else untouched. Each field is parsed with its own options and tiptap.extensions, so the result only contains what the field's editor can show, and a zone named __proto__ is copied like any other. Jest now transforms happy-dom, which is ESM-only."
```

預期（hash 會不同）：

```
M  packages/core/jest.config.ts
A  packages/core/lib/richtext/__tests__/html-to-json.server.spec.ts
A  packages/core/lib/richtext/__tests__/html-to-json.spec.tsx
A  packages/core/lib/richtext/__tests__/migrate-data.spec.ts
A  packages/core/lib/richtext/html-to-json.ts
A  packages/core/lib/richtext/migrate-data.ts
M  packages/core/tsconfig.json
?? CLAUDE.md
[tzuchi/main <hash>] feat(richtext): convert legacy HTML richtext to JSON
 7 files changed, 479 insertions(+), 2 deletions(-)
 create mode 100644 packages/core/lib/richtext/__tests__/html-to-json.server.spec.ts
 create mode 100644 packages/core/lib/richtext/__tests__/html-to-json.spec.tsx
 create mode 100644 packages/core/lib/richtext/__tests__/migrate-data.spec.ts
 create mode 100644 packages/core/lib/richtext/html-to-json.ts
 create mode 100644 packages/core/lib/richtext/migrate-data.ts
```

- [ ] **Step 7: 新增 `richtext-migrate` 入口並確認可以從 ESM 與 CJS 載入**

建立 `packages/core/bundle/richtext-migrate.ts`：

```ts
// Server-only tools for converting legacy HTML richtext to JSON. Kept out of
// the main and RSC entries because they need @tiptap/html and happy-dom.
export { richTextHtmlToJson } from "../lib/richtext/html-to-json";
export { migrateRichTextInData } from "../lib/richtext/migrate-data";
```

`packages/core/package.json` 第 1 處（`exports`），原始片段（逐字）：

```json
    "./internal": {
      "types": "./dist/internal.d.ts",
      "import": "./dist/internal.mjs",
      "require": "./dist/internal.js"
    },
```

替換為：

```json
    "./internal": {
      "types": "./dist/internal.d.ts",
      "import": "./dist/internal.mjs",
      "require": "./dist/internal.js"
    },
    "./richtext-migrate": {
      "types": "./dist/richtext-migrate.d.ts",
      "import": "./dist/richtext-migrate.mjs",
      "require": "./dist/richtext-migrate.js"
    },
```

第 2 處（`typesVersions`，讓 `moduleResolution: node` 的使用端也找得到型別），原始片段（逐字）：

```json
      "rsc": [
        "./dist/rsc.js"
      ]
```

替換為：

```json
      "rsc": [
        "./dist/rsc.js"
      ],
      "richtext-migrate": [
        "./dist/richtext-migrate.js"
      ]
```

第 3 處（`scripts.build`），原始片段（逐字）：

```json
    "build": "rm -rf dist && tsup bundle/index.ts bundle/rsc.tsx bundle/internal.ts",
```

替換為：

```json
    "build": "rm -rf dist && tsup bundle/index.ts bundle/rsc.tsx bundle/internal.ts bundle/richtext-migrate.ts",
```

```bash
pnpm --filter @tzuchi/tceditor build > /dev/null 2>&1; echo "build=$?"
ls packages/core/dist | grep richtext-migrate
grep -l -E "@tiptap/html|happy-dom" packages/core/dist/*.js packages/core/dist/*.mjs
(cd packages/core && node --input-type=module -e 'import { richTextHtmlToJson } from "@tzuchi/tceditor/richtext-migrate"; console.log(JSON.stringify(richTextHtmlToJson("<p>Hi <b>there</b></p>")));')
(cd packages/core && node -e 'const { migrateRichTextInData } = require("@tzuchi/tceditor/richtext-migrate"); console.log(JSON.stringify(migrateRichTextInData({ root: {}, content: [{ type: "T", props: { id: "t", body: "<h2>Hi</h2>" } }] }, { components: { T: { fields: { body: { type: "richtext" } }, render: () => null } } }).content[0].props.body));')
```

預期：

```
build=0
richtext-migrate.d.mts
richtext-migrate.d.ts
richtext-migrate.js
richtext-migrate.mjs
packages/core/dist/richtext-migrate.js
packages/core/dist/richtext-migrate.mjs
{"type":"doc","content":[{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Hi "},{"type":"text","marks":[{"type":"bold"}],"text":"there"}]}]}
{"type":"doc","content":[{"type":"heading","attrs":{"textAlign":null,"level":2},"content":[{"type":"text","text":"Hi"}]}]}
```

`@tiptap/html` 只出現在新入口的兩個檔案。`node` 從 `packages/core` 目錄以套件名稱自我引用（self-reference）載入 `exports` 中的新入口，ESM 與 CJS 都能轉換。

```bash
git add packages/core/bundle/richtext-migrate.ts packages/core/package.json
git commit -m "feat(richtext): add the richtext-migrate entry" -m "@tzuchi/tceditor/richtext-migrate exports richTextHtmlToJson and migrateRichTextInData for server-side conversion of legacy HTML richtext. It is the only entry that loads @tiptap/html and happy-dom."
```

預期（hash 會不同）：

```
[tzuchi/main <hash>] feat(richtext): add the richtext-migrate entry
 2 files changed, 13 insertions(+), 1 deletion(-)
 create mode 100644 packages/core/bundle/richtext-migrate.ts
```

- [ ] **Step 8: 寫打包檢查的失敗測試**

測試在暫存目錄建立假的 `dist`：`index.mjs` → 靜態 import → 動態 import 到含 `@tiptap/html` 的 chunk；`index.js` → `require` 到含 `happy-dom` 的 chunk；`rsc.mjs` 只有 side-effect import；`migrate.mjs` 含 `happy-dom` 但沒有任何入口引用它。

建立 `packages/core/scripts/check-bundle-imports.test.mjs`：

```js
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";

import { collectFiles, findForbidden } from "./check-bundle-imports.mjs";

const dist = mkdtempSync(join(tmpdir(), "check-bundle-imports-"));
after(() => rmSync(dist, { recursive: true, force: true }));

const write = (name, source) => writeFileSync(join(dist, name), source);

// index.mjs -> shared.mjs (static) -> lazy.mjs (dynamic)
// index.js  -> cjs-chunk.js (require)
// rsc.mjs   -> side-effect.mjs (bare import)
// migrate.mjs is not reachable from any entry
write("index.mjs", 'import { a } from "./shared.mjs";\nexport { a };\n');
write("shared.mjs", 'export const a = () => import("./lazy.mjs");\n');
write("lazy.mjs", 'import { generateJSON } from "@tiptap/html";\n');
write("index.js", 'const chunk = require("./cjs-chunk.js");\n');
write("cjs-chunk.js", 'module.exports = require("happy-dom");\n');
write("rsc.mjs", 'import "./side-effect.mjs";\nimport React from "react";\n');
write("side-effect.mjs", "globalThis.x = 1;\n");
write("rsc.js", 'require("react");\n');
write("migrate.mjs", 'import "happy-dom";\n');

test("collectFiles follows static, dynamic, bare and require imports", () => {
  assert.deepEqual(collectFiles(dist, "index.mjs").sort(), [
    "index.mjs",
    "lazy.mjs",
    "shared.mjs",
  ]);
  assert.deepEqual(collectFiles(dist, "index.js").sort(), [
    "cjs-chunk.js",
    "index.js",
  ]);
  assert.deepEqual(collectFiles(dist, "rsc.mjs").sort(), [
    "rsc.mjs",
    "side-effect.mjs",
  ]);
});

test("findForbidden reports reachable files that mention a forbidden package", () => {
  assert.deepEqual(findForbidden(dist), [
    { entry: "index.mjs", file: "lazy.mjs", name: "@tiptap/html" },
    { entry: "index.js", file: "cjs-chunk.js", name: "happy-dom" },
  ]);
});

test("findForbidden ignores files no entry reaches", () => {
  assert.deepEqual(findForbidden(dist, ["rsc.mjs", "rsc.js"]), []);
});
```

```bash
node --test packages/core/scripts/check-bundle-imports.test.mjs 2>&1 | grep -E "^ℹ (tests|pass|fail)"
node --test packages/core/scripts/check-bundle-imports.test.mjs 2>&1 | grep -o "Cannot find module '[^']*/check-bundle-imports.mjs'" | head -1 | sed "s#'.*/packages/#'…/packages/#"
```

預期失敗（模組還不存在）：

```
ℹ tests 1
ℹ pass 0
ℹ fail 1
Cannot find module '…/packages/core/scripts/check-bundle-imports.mjs'
```

- [ ] **Step 9: 實作 `check-bundle-imports.mjs`，並在真正的 `dist` 上做正反兩面驗證**

建立 `packages/core/scripts/check-bundle-imports.mjs`：

```js
// Checks that the main and RSC entries of the built package cannot reach
// happy-dom or @tiptap/html. Those two are only for the richtext-migrate entry
// (server-side conversion of legacy HTML), and must never ship to public pages.
//
// Usage: node packages/core/scripts/check-bundle-imports.mjs (after pnpm build)
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const ENTRIES = ["index.mjs", "rsc.mjs", "index.js", "rsc.js"];
export const FORBIDDEN = ["happy-dom", "@tiptap/html"];

// from "./x.mjs", import("./x.mjs"), import "./x.mjs", require("./x.js")
const RELATIVE_IMPORT =
  /(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+|\brequire\s*\(\s*)(["'])(\.{1,2}\/[^"']+\.[cm]?js)\1/g;

/** Every file reachable from `entry` through relative imports, relative to `distDir`. */
export function collectFiles(distDir, entry) {
  const seen = new Set();
  const queue = [resolve(distDir, entry)];

  while (queue.length > 0) {
    const file = queue.pop();

    if (seen.has(file)) continue;

    seen.add(file);

    for (const match of readFileSync(file, "utf8").matchAll(RELATIVE_IMPORT)) {
      queue.push(resolve(dirname(file), match[2]));
    }
  }

  return [...seen].map((file) => relative(distDir, file));
}

/** Lists each reachable file that mentions a forbidden package. */
export function findForbidden(
  distDir,
  entries = ENTRIES,
  forbidden = FORBIDDEN
) {
  const problems = [];

  for (const entry of entries) {
    for (const file of collectFiles(distDir, entry).sort()) {
      const source = readFileSync(join(distDir, file), "utf8");

      for (const name of forbidden) {
        if (source.includes(name)) problems.push({ entry, file, name });
      }
    }
  }

  return problems;
}

const isMain =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  const distDir = resolve(dirname(fileURLToPath(import.meta.url)), "../dist");
  const missing = ENTRIES.filter((entry) => !existsSync(join(distDir, entry)));

  if (missing.length > 0) {
    console.error(
      `check:bundle: ${missing.join(
        ", "
      )} not found in ${distDir}. Run pnpm build first.`
    );
    process.exit(1);
  }

  const problems = findForbidden(distDir);

  if (problems.length > 0) {
    for (const { entry, file, name } of problems) {
      console.error(`${entry} reaches ${file}, which mentions ${name}`);
    }

    console.error(
      `check:bundle FAILED: ${FORBIDDEN.join(
        " and "
      )} must only be used by the richtext-migrate entry.`
    );
    process.exit(1);
  }

  const fileCount = new Set(
    ENTRIES.flatMap((entry) => collectFiles(distDir, entry))
  ).size;

  console.log(
    `check:bundle passed: ${fileCount} files reachable from ${ENTRIES.join(
      ", "
    )} do not mention ${FORBIDDEN.join(" or ")}.`
  );
}
```

```bash
node --test packages/core/scripts/check-bundle-imports.test.mjs 2>&1 | grep -E "^✔|^✖|^ℹ (tests|pass|fail)" | sed -E 's/ \([0-9.]+ms\)//'
node packages/core/scripts/check-bundle-imports.mjs; echo "exit=$?"
```

預期：

```
✔ collectFiles follows static, dynamic, bare and require imports
✔ findForbidden reports reachable files that mention a forbidden package
✔ findForbidden ignores files no entry reaches
ℹ tests 3
ℹ pass 3
ℹ fail 0
check:bundle passed: 23 files reachable from index.mjs, rsc.mjs, index.js, rsc.js do not mention happy-dom or @tiptap/html.
exit=0
```

反向驗證：讓主入口引用轉換入口，檢查必須失敗；之後重新 build 還原 `dist`（`dist` 不在版控中）：

```bash
echo 'import "./richtext-migrate.mjs";' >> packages/core/dist/index.mjs
node packages/core/scripts/check-bundle-imports.mjs; echo "exit=$?"
pnpm --filter @tzuchi/tceditor build > /dev/null 2>&1; echo "build=$?"
node packages/core/scripts/check-bundle-imports.mjs; echo "exit=$?"
```

預期：

```
index.mjs reaches richtext-migrate.mjs, which mentions @tiptap/html
check:bundle FAILED: happy-dom and @tiptap/html must only be used by the richtext-migrate entry.
exit=1
build=0
check:bundle passed: 23 files reachable from index.mjs, rsc.mjs, index.js, rsc.js do not mention happy-dom or @tiptap/html.
exit=0
```

- [ ] **Step 10: 接進根目錄的 `test`、`check:bundle` 與 `verify`**

根目錄 `package.json`（Task 1 建立的 scripts） 原始片段（逐字）：

```json
    "test": "turbo run test && node --test scripts/audit-gate-lib.test.mjs",
    "typecheck": "pnpm --filter ./packages/core typecheck",
    "audit:gate": "node scripts/audit-gate.mjs",
    "verify": "pnpm test && pnpm typecheck && pnpm lint && pnpm format:check && pnpm build && pnpm audit:gate"
```

替換為：

```json
    "test": "turbo run test && node --test scripts/audit-gate-lib.test.mjs packages/core/scripts/check-bundle-imports.test.mjs",
    "typecheck": "pnpm --filter ./packages/core typecheck",
    "audit:gate": "node scripts/audit-gate.mjs",
    "check:bundle": "node packages/core/scripts/check-bundle-imports.mjs",
    "verify": "pnpm test && pnpm typecheck && pnpm lint && pnpm format:check && pnpm build && pnpm check:bundle && pnpm audit:gate"
```

```bash
pnpm check:bundle 2>&1 | tail -1
pnpm exec prettier --check packages/core/scripts package.json 2>&1 | tail -1
```

預期：

```
check:bundle passed: 23 files reachable from index.mjs, rsc.mjs, index.js, rsc.js do not mention happy-dom or @tiptap/html.
All matched files use Prettier code style!
```

- [ ] **Step 11: 更新 CHANGELOG 並 commit**

`CHANGELOG.md`（清單最後一行，Task 7 Step 11 加入） 原始片段（逐字）：

```markdown
* **breaking:** the richtext editor stores Tiptap JSON (`editor.getJSON()`) instead of HTML, shows a legacy HTML string as plain text, and renders its loading placeholder with the shared renderer instead of `dangerouslySetInnerHTML`; a richtext field's `options` and `tiptap.extensions` no longer affect rendering, so node and mark types added by `tiptap.extensions` are shown as plain text on published pages and removed when the editor reopens the content (with a warning in development), content that `options` turns off opens in the editor as plain text instead of an empty editor, and the editor only creates links that `isSafeHref` allows
```

替換為：

```markdown
* **breaking:** the richtext editor stores Tiptap JSON (`editor.getJSON()`) instead of HTML, shows a legacy HTML string as plain text, and renders its loading placeholder with the shared renderer instead of `dangerouslySetInnerHTML`; a richtext field's `options` and `tiptap.extensions` no longer affect rendering, so node and mark types added by `tiptap.extensions` are shown as plain text on published pages and removed when the editor reopens the content (with a warning in development), content that `options` turns off opens in the editor as plain text instead of an empty editor, and the editor only creates links that `isSafeHref` allows
* add the `@tzuchi/tceditor/richtext-migrate` entry (`richTextHtmlToJson`, `migrateRichTextInData`) to convert legacy HTML richtext to JSON on the server, and `pnpm check:bundle` (part of `pnpm verify`), which fails when the main or RSC entry can reach `@tiptap/html` or `happy-dom`
```

```bash
git add packages/core/scripts/check-bundle-imports.mjs packages/core/scripts/check-bundle-imports.test.mjs package.json CHANGELOG.md
git status --short
git commit -m "build: keep @tiptap/html and happy-dom out of the main and RSC entries" -m "check:bundle follows the relative imports, dynamic imports and requires from dist/index.mjs, dist/rsc.mjs, dist/index.js and dist/rsc.js and fails if any reachable file mentions @tiptap/html or happy-dom. pnpm verify runs it after the build, and pnpm test runs its node:test suite."
```

預期（hash 會不同）：

```
M  CHANGELOG.md
M  package.json
A  packages/core/scripts/check-bundle-imports.mjs
A  packages/core/scripts/check-bundle-imports.test.mjs
?? CLAUDE.md
[tzuchi/main <hash>] build: keep @tiptap/html and happy-dom out of the main and RSC entries
 4 files changed, 155 insertions(+), 2 deletions(-)
 create mode 100644 packages/core/scripts/check-bundle-imports.mjs
 create mode 100644 packages/core/scripts/check-bundle-imports.test.mjs
```

- [ ] **Step 12: 完整驗證**

```bash
pnpm verify > "${TMPDIR:-/tmp}/tceditor-verify-task08.log" 2>&1
echo "exit=$?"
grep -E "Test Suites:|Tests:|Snapshots:|ℹ (tests|pass|fail)|> tsc|✖|Tasks:|All matched|^check:bundle|^pnpm audit:|^GATED|^audit:gate (passed|FAILED)" "${TMPDIR:-/tmp}/tceditor-verify-task08.log"
```

預期輸出：

```
exit=0
@tzuchi/tceditor:test: Test Suites: 68 passed, 68 total
@tzuchi/tceditor:test: Tests:       637 passed, 637 total
@tzuchi/tceditor:test: Snapshots:   19 passed, 19 total
 Tasks:    1 successful, 1 total
ℹ tests 13
ℹ pass 13
ℹ fail 0
> tsc -p tsconfig.typecheck.json
demo:lint: ✖ 8 problems (0 errors, 8 warnings)
@tzuchi/tceditor:lint: ✖ 4 problems (0 errors, 4 warnings)
 Tasks:    3 successful, 3 total
All matched files use Prettier code style!
 Tasks:    3 successful, 3 total
check:bundle passed: 23 files reachable from index.mjs, rsc.mjs, index.js, rsc.js do not mention happy-dom or @tiptap/html.
pnpm audit: 69 advisories, 71 finding path(s). 105 package versions ship with packages/core, packages/plugin-heading-analyzer.
GATED (ships with a published package): 0 finding(s)
audit:gate passed: no advisories affect packages/core, packages/plugin-heading-analyzer (71 finding path(s) elsewhere are listed above).
```

與 Task 7 相比：jest 多了 3 個 suite（html-to-json、html-to-json.server、migrate-data）與 29 個測試，65 → 68 個 suite，608 → 637 個測試；`node:test` 從 10 個變成 13 個（多了 check-bundle-imports 的 3 個）；新增 `check:bundle passed` 一行。

### Task 9: demo 資料改為 JSON

目的：把 `apps/demo` 裡所有 richtext 的值改成 tiptap JSON（RichText 區塊與 Hero 的 `defaultProps`、Hero 的 `resolveData`、`config/initial-data.ts`），並把公開型別 `RichText` 從 `string | ReactNode` 改為 `RichTextDoc | string | ReactNode`（規格 §9 第 11 項的前置作業）。完成後以 `next start` 啟動 demo，用 curl 確認頁面正常，且 RSC 頁面輸出的 richtext 是正常的 `<p>` 而不是被 escape 的 `&lt;p&gt;`。

**注意**：
- 首頁 `/` 與 `/edit` 是 client component（`useEffect` 之後才渲染內容），伺服器回應的 HTML 不含頁面內容，所以 curl 只檢查 200；內容檢查用 `/rsc`，它在伺服器端以 RSC `Render` 渲染 `initialData["/"]`。
- `RichText` 型別同時描述資料（JSON 或舊字串）與 `render` 收到的值（Puck 已把 richtext 欄位換成 React 元素）。`RichTextDoc` 不是合法的 `ReactNode`，所以在 JSX 中使用時要寫 `{description as ReactNode}`；demo 的兩個元件照此修改。
- demo 以 `127.0.0.1:3917` 啟動（任意未被佔用的 port 都可以，先用 `lsof` 確認）。只能用 `kill "$DEMO_PID"` 停止自己啟動的程序，不要用 `pkill`/`killall` 或依名稱比對。`./node_modules/.bin/next` 是 `exec node …` 的 shim，所以 `$!` 就是 next 伺服器本身的 PID。
- 瀏覽器中的手動驗證（規格 §9 第 11 項：拖放、編輯 richtext）不在本 task 的自動步驟中，留給 Task 14 的最終驗證。

**執行位置**：主工作目錄，接在 Task 8 的最後一個 commit（`build: keep @tiptap/html and happy-dom out of the main and RSC entries`）之後。

**Files:**
- Modify:
  - `packages/core/types/API/index.ts`（`RichText` 型別）
  - `apps/demo/config/blocks/RichText/index.tsx`（整檔改寫）
  - `apps/demo/config/blocks/Hero/Hero.tsx`
  - `apps/demo/config/blocks/Hero/client.tsx`
  - `apps/demo/config/initial-data.ts`
  - `CHANGELOG.md`
- Test：沒有新的 jest 測試；以 `next build`、`next start` 與 curl 驗證（Step 2 為改動前的紅燈）。

**Interfaces:**
- Consumes：Task 6 匯出的 `textToRichText`（`@/core` 對應 `packages/core/index.ts`）；Task 5 的 `RichTextDoc`；Task 6 的 demo tsconfig `paths`；Task 6 的 `${TMPDIR:-/tmp}/measure-public-bundle.mjs` 與基準數字；Task 8 的 CHANGELOG 最後一行與 `pnpm verify`。
- Produces：
  - `packages/core/types/API/index.ts`：`export type RichText = RichTextDoc | string | ReactNode;`。
  - demo 的 richtext 資料全部是 JSON；`apps/demo/config/blocks/RichText/index.tsx` 的 `RichTextProps` 為 `WithLayout<{ richtext?: RichTextValue }>`（`RichTextValue` 是 `RichText` 型別的別名，避免與元件名稱衝突）。
  - `CHANGELOG.md` 清單最後一行變成 Step 6 加入的那一行，Task 10 以後若要加一行，以它為原始片段。

- [ ] **Step 1: 確認起點**

```bash
cd /Users/kaellim/Desktop/projects/puck
git status --short
git log --oneline -1
```

預期（hash 會不同）：

```
?? CLAUDE.md
<hash> build: keep @tiptap/html and happy-dom out of the main and RSC entries
```

- [ ] **Step 2: 紅燈：改動前，RSC 頁面把 demo 的 HTML 字串當成文字輸出**

`pnpm build` 會 build core、外掛與 demo；接著啟動 demo，抓 `/rsc` 的 HTML：

```bash
pnpm build > "${TMPDIR:-/tmp}/tceditor-build-task09.log" 2>&1; echo "build=$?"
lsof -nP -iTCP:3917 -sTCP:LISTEN || echo "port 3917 is free"
(cd apps/demo && exec ./node_modules/.bin/next start -H 127.0.0.1 -p 3917) > "${TMPDIR:-/tmp}/tceditor-demo-start.log" 2>&1 &
DEMO_PID=$!
for i in $(seq 1 60); do curl -s -o /dev/null http://127.0.0.1:3917/ && break; sleep 1; done
curl -s http://127.0.0.1:3917/rsc | grep -o "&lt;p&gt;Puck is the self-hosted visual editor"
kill "$DEMO_PID"
```

預期（`&lt;p&gt;` 表示 Task 6 之後字串被當成純文字，畫面上會看到 `<p>` 標籤）：

```
build=0
port 3917 is free
&lt;p&gt;Puck is the self-hosted visual editor
```

`(cd … && exec …) &` 讓子 shell 直接換成 next 伺服器，所以 `$!` 就是伺服器的 PID，`kill "$DEMO_PID"` 只停止它。若 `lsof` 顯示 3917 已被佔用，把本步驟與 Step 5 中所有的 `3917` 換成同一個未使用的 port。

- [ ] **Step 3: 把公開型別 `RichText` 改為包含 JSON**

`packages/core/types/API/index.ts` 第 1 處，原始片段（逐字）：

```ts
import { Config, DefaultComponents } from "../Config";
```

替換為：

```ts
import { Config, DefaultComponents } from "../Config";
import type { RichTextDoc } from "../../lib/richtext/types";
```

第 2 處，原始片段（逐字）：

```ts
export type RichText = string | ReactNode;
```

替換為：

```ts
/**
 * A richtext prop: Tiptap JSON (or a legacy string) in data, a ReactNode in
 * `render`.
 */
export type RichText = RichTextDoc | string | ReactNode;
```

- [ ] **Step 4: 把 demo 的 richtext 改為 JSON**

RichText 區塊保留原本「h2 標題＋段落」的結構，手寫 JSON；Hero 的單一段落用 `textToRichText`；`initial-data.ts` 會被 RSC 頁面 import，為了不讓它載入整個編輯器模組，手寫 JSON。

`apps/demo/config/blocks/RichText/index.tsx` 的完整新內容：

```tsx
import React, { ReactNode } from "react";
import { ComponentConfig, RichText as RichTextValue } from "@/core/types";
import { WithLayout, withLayout } from "../../components/Layout";
import { Section } from "../../components/Section";

export type RichTextProps = WithLayout<{
  richtext?: RichTextValue;
}>;

const RichTextInner: ComponentConfig<RichTextProps> = {
  fields: {
    richtext: {
      type: "richtext",
    },
  },
  render: ({ richtext }) => {
    // Puck passes richtext fields to render as rendered elements
    return <Section>{richtext as ReactNode}</Section>;
  },
  defaultProps: {
    richtext: {
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { textAlign: null, level: 2 },
          content: [{ type: "text", text: "Heading" }],
        },
        {
          type: "paragraph",
          attrs: { textAlign: null },
          content: [{ type: "text", text: "Body" }],
        },
      ],
    },
  },
};

export const RichText = withLayout(RichTextInner);
```

`apps/demo/config/blocks/Hero/Hero.tsx`（檔案開頭已有 `import React, { ReactNode } from "react";`） 原始片段（逐字）：

```tsx
          <div className={getClassName("subtitle")}>{description}</div>
```

替換為：

```tsx
          <div className={getClassName("subtitle")}>
            {/* Puck passes richtext fields to render as rendered elements */}
            {description as ReactNode}
          </div>
```

`apps/demo/config/blocks/Hero/client.tsx` 第 1 處，原始片段（逐字）：

```tsx
import { AutoField, FieldLabel, RichTextMenu } from "@/core";
```

替換為：

```tsx
import { AutoField, FieldLabel, RichTextMenu, textToRichText } from "@/core";
```

第 2 處（`defaultProps`），原始片段（逐字）：

```tsx
    description: "<p>Description</p>",
```

替換為：

```tsx
    description: textToRichText("Description"),
```

第 3 處（`resolveData`），原始片段（逐字）：

```tsx
        description: `<p>${quotes[props.quote.index].content}</p>`,
```

替換為：

```tsx
        description: textToRichText(quotes[props.quote.index].content),
```

`apps/demo/config/initial-data.ts`（`"/"` 頁面 Hero 的 `description`；檔案中其他的 `description` 屬於 Card 與 Stats 的 text 欄位，不是 richtext，不要改） 原始片段（逐字）：

```ts
          description:
            "<p>Puck is the self-hosted visual editor for React. Bring your own components and make site changes instantly, without a deploy.</p>",
```

替換為：

```ts
          description: {
            type: "doc",
            content: [
              {
                type: "paragraph",
                attrs: { textAlign: null },
                content: [
                  {
                    type: "text",
                    text: "Puck is the self-hosted visual editor for React. Bring your own components and make site changes instantly, without a deploy.",
                  },
                ],
              },
            ],
          },
```

```bash
git grep -n '"richtext"' -- apps/demo
git grep -n -E '"<p>|`<p>|"<h[1-6]>' -- apps/demo/config || echo "no HTML strings left in apps/demo/config"
pnpm exec prettier --check apps/demo/config packages/core/types
```

預期：

```
apps/demo/config/blocks/Hero/render-fields.ts:6:    type: "richtext",
apps/demo/config/blocks/RichText/index.tsx:13:      type: "richtext",
no HTML strings left in apps/demo/config
Checking formatting...
All matched files use Prettier code style!
```

demo 只有這兩個 richtext 欄位（Hero 的 `description` 經 `heroRenderFields` 宣告），兩者的值都已改成 JSON。

- [ ] **Step 5: build，並啟動 demo 確認頁面**

```bash
pnpm typecheck > /dev/null 2>&1; echo "typecheck=$?"
pnpm build > "${TMPDIR:-/tmp}/tceditor-build-task09.log" 2>&1; echo "build=$?"
grep -E "demo:build: .*(Finished TypeScript|/rsc)" "${TMPDIR:-/tmp}/tceditor-build-task09.log" | sed -E 's/ in [0-9.]+m?s//'
lsof -nP -iTCP:3917 -sTCP:LISTEN || echo "port 3917 is free"
(cd apps/demo && exec ./node_modules/.bin/next start -H 127.0.0.1 -p 3917) > "${TMPDIR:-/tmp}/tceditor-demo-start.log" 2>&1 &
DEMO_PID=$!
for i in $(seq 1 60); do curl -s -o /dev/null http://127.0.0.1:3917/ && break; sleep 1; done
for p in / /edit /rsc; do echo "$p $(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:3917$p")"; done
curl -s http://127.0.0.1:3917/rsc > "${TMPDIR:-/tmp}/tceditor-rsc.html"
grep -o '<div class="rich-text"><p>Puck is the self-hosted visual editor[^<]*</p></div>' "${TMPDIR:-/tmp}/tceditor-rsc.html"
grep -c "&lt;p&gt;" "${TMPDIR:-/tmp}/tceditor-rsc.html"
kill "$DEMO_PID"
sleep 1
lsof -nP -iTCP:3917 -sTCP:LISTEN || echo "demo stopped"
```

預期：

```
typecheck=0
build=0
demo:build:   Finished TypeScript ...
demo:build: ├ ○ /rsc
port 3917 is free
/ 200
/edit 200
/rsc 200
<div class="rich-text"><p>Puck is the self-hosted visual editor for React. Bring your own components and make site changes instantly, without a deploy.</p></div>
0
demo stopped
```

`/rsc` 的 Hero 說明由共用渲染器輸出為 `<div class="rich-text"><p>…</p></div>`，`&lt;p&gt;` 出現 0 次（`grep -c` 找不到時 exit code 為 1，屬正常）。

- [ ] **Step 6: 更新 CHANGELOG 並 commit**

`CHANGELOG.md`（清單最後一行，Task 8 Step 11 加入） 原始片段（逐字）：

```markdown
* add the `@tzuchi/tceditor/richtext-migrate` entry (`richTextHtmlToJson`, `migrateRichTextInData`) to convert legacy HTML richtext to JSON on the server, and `pnpm check:bundle` (part of `pnpm verify`), which fails when the main or RSC entry can reach `@tiptap/html` or `happy-dom`
```

替換為：

```markdown
* add the `@tzuchi/tceditor/richtext-migrate` entry (`richTextHtmlToJson`, `migrateRichTextInData`) to convert legacy HTML richtext to JSON on the server, and `pnpm check:bundle` (part of `pnpm verify`), which fails when the main or RSC entry can reach `@tiptap/html` or `happy-dom`
* the `RichText` type is now `RichTextDoc | string | ReactNode`, and the demo stores its richtext as JSON
```

```bash
git add packages/core/types/API/index.ts apps/demo/config/blocks/RichText/index.tsx apps/demo/config/blocks/Hero/Hero.tsx apps/demo/config/blocks/Hero/client.tsx apps/demo/config/initial-data.ts CHANGELOG.md
git status --short
git commit -m "feat(richtext): type richtext data as JSON and convert the demo" -m "The RichText type now includes RichTextDoc, since richtext fields store Tiptap JSON. The demo's RichText and Hero blocks, Hero's resolveData and the initial page data use JSON instead of HTML strings, so the demo renders them as rich text again."
```

預期（hash 會不同）：

```
M  CHANGELOG.md
M  apps/demo/config/blocks/Hero/Hero.tsx
M  apps/demo/config/blocks/Hero/client.tsx
M  apps/demo/config/blocks/RichText/index.tsx
M  apps/demo/config/initial-data.ts
M  packages/core/types/API/index.ts
?? CLAUDE.md
[tzuchi/main <hash>] feat(richtext): type richtext data as JSON and convert the demo
 6 files changed, 49 insertions(+), 12 deletions(-)
```

- [ ] **Step 7: 完整驗證與最終打包大小**

```bash
pnpm verify > "${TMPDIR:-/tmp}/tceditor-verify-task09.log" 2>&1
echo "exit=$?"
grep -E "Test Suites:|Tests:|Snapshots:|ℹ (tests|pass|fail)|> tsc|✖|Tasks:|All matched|^check:bundle|^pnpm audit:|^GATED|^audit:gate (passed|FAILED)" "${TMPDIR:-/tmp}/tceditor-verify-task09.log"
MEASURE="${TMPDIR:-/tmp}/measure-public-bundle.mjs"
if [ -f "$MEASURE" ]; then node "$MEASURE" packages/core; else echo "missing $MEASURE: re-create it with the heredoc in Task 6 Step 2"; fi
```

量測腳本是 Task 6 Step 2 建立的暫存檔（不 commit）。若換了 session、重新開機或 `$TMPDIR` 被清掉，最後一行會印出 `missing …`：這時把 Task 6 Step 2 中 `cat > "${TMPDIR:-/tmp}/measure-public-bundle.mjs" <<'EOF'` 到 `EOF` 那一段重新貼上執行（只需要建立檔案；`pnpm verify` 剛 build 過，`dist` 是最新的），再執行 `node "${TMPDIR:-/tmp}/measure-public-bundle.mjs" packages/core`。

預期輸出：

```
exit=0
@tzuchi/tceditor:test: Test Suites: 68 passed, 68 total
@tzuchi/tceditor:test: Tests:       637 passed, 637 total
@tzuchi/tceditor:test: Snapshots:   19 passed, 19 total
 Tasks:    1 successful, 1 total
ℹ tests 13
ℹ pass 13
ℹ fail 0
> tsc -p tsconfig.typecheck.json
demo:lint: ✖ 8 problems (0 errors, 8 warnings)
@tzuchi/tceditor:lint: ✖ 4 problems (0 errors, 4 warnings)
 Tasks:    3 successful, 3 total
All matched files use Prettier code style!
 Tasks:    3 successful, 3 total
check:bundle passed: 23 files reachable from index.mjs, rsc.mjs, index.js, rsc.js do not mention happy-dom or @tiptap/html.
pnpm audit: 69 advisories, 71 finding path(s). 105 package versions ship with packages/core, packages/plugin-heading-analyzer.
GATED (ships with a published package): 0 finding(s)
audit:gate passed: no advisories affect packages/core, packages/plugin-heading-analyzer (71 finding path(s) elsewhere are listed above).
initial: 169.5 KB gzip
total (with lazy chunks): 292.9 KB gzip
```

最後兩行與 Task 6 Step 2 的基準相比：公開頁初始 chunk 約 +2.1 KB gzip（目標 ≤ 10 KB），含 lazy chunk 的總和約 +1.4 KB（Task 7 的 `fitToSchema` 在編輯器的 lazy chunk 中）。

- [ ] **Step 8: 確認 commit 紀錄**

```bash
git log --format=%s -12
git status --short
```

預期（Task 5–9 共 11 個 commit，最新的在最上面；最後一行是 Task 4 的最後一個 commit）：

```
feat(richtext): type richtext data as JSON and convert the demo
build: keep @tiptap/html and happy-dom out of the main and RSC entries
feat(richtext): add the richtext-migrate entry
feat(richtext): convert legacy HTML richtext to JSON
feat(richtext): store richtext as Tiptap JSON
feat(richtext): export the shared renderer from the main and RSC entries
fix(richtext): render richtext through the shared static renderer
feat(richtext): render rich text JSON with @tiptap/static-renderer
feat(richtext): normalize rich text to the PuckRichText schema
feat(richtext): add isSafeHref and textToRichText
build(deps): add @tiptap/static-renderer 3.31.4
docs: record the ported upstream fixes in the changelog
?? CLAUDE.md
```

#### 附註：Task 5–9 與規格、orchestrator 指示的差異（已彙整到計畫開頭的「與規格的差異」，其中標示「需使用者確認」的項目在執行前確認）

1. **編輯器對舊 HTML 字串也當純文字**（Task 7）。orchestrator 的提示是「字串型舊內容與編輯器 `getHTML` 比較」，那需要讓 tiptap 把字串當 HTML 解析，結果編輯器顯示格式化內容、公開頁顯示純文字，違反規格「預覽與正式頁面完全一致」。改為編輯器顯示 `normalizeRichText` 的結果（與公開頁相同），以排序 key 的 JSON 比較避免重設。代價：轉換前就在編輯器裡修改舊資料，會把標籤文字存成內容；所以上線前要先跑 Task 8 的轉換工具（規格 §11 已列此風險）。
2. **`EditorFallback` 直接呼叫 `renderRichText`，沒有用 `RichTextContent`**（Task 7）：避免在 `EditorInner` 內多包一層 `.RichTextEditor`（會破壞 flex 版面）。渲染器相同，輸出相同。
3. **`migrateRichTextInData` 不用 `mapFields`/`walkTree`**（Task 8）：原因見 Task 8 開頭（會補預設 slot、加入 `undefined` key、遇到未知元件丟錯、O(n²)）。
4. **轉換工具是套件入口 `@tzuchi/tceditor/richtext-migrate`**，不是規格寫的 `scripts/richtext-html-to-json`；`@tiptap/html`、`happy-dom` 依共同介面留在 `dependencies`（規格寫降為 devDependency），以 `check:bundle` 保證只有這個入口使用。CJS 版需要 Node ≥ 22.12（`require(esm)`），Node 20 請用 ESM。
5. **link 的 `class` 一律清成 `null`**（Task 5）：規格沒有提到；為了防止借用宿主頁面 class 覆蓋版面而刻意加嚴。若 S2 需要讓 link 帶 class，要改成白名單。
6. **`isSafeHref` 拒絕含字元參照（`&#…`、`&name;`）的 href**：為了擋下實體編碼的 `javascript:`；副作用是 `?a=1&amp;b=2` 這種 href 會被移除連結（保留文字）。
7. **公開型別 `RichText` 改為 `RichTextDoc | string | ReactNode`**（Task 9，不在 Task 7）：使用者在 `render` 中要寫 `{value as ReactNode}`。
8. **core 與 demo 的 tsconfig 新增 `paths`**、**jest 的 `transformIgnorePatterns` 加上 `happy-dom`**、**根目錄 `test` 也執行 `check-bundle-imports.test.mjs`**：都是 `moduleResolution: "node"` 與 happy-dom 只有 ESM 造成的必要調整，說明見各 task。
9. **`textToRichText` 不拆行**：整段放進一個段落（換行保留在文字中），與 v0.23.0 對非 HTML 字串的渲染相同。
10. **規格 §9 第 4 項「與 `getHTML()` 比較」改用 `generateHTML(json, [PuckRichText])`**：兩者都是 ProseMirror `DOMSerializer` 的輸出；另外以 `EditorFallback` 對照載入後編輯器的 DOM（移除 ProseMirror 的 `trailingBreak` 後相同）。
11. **欄位的 `options` 只影響編輯器，渲染器不依 `options` 過濾**（Task 7，請使用者決定）。現狀：公開頁一律依 PuckRichText 預設 schema 渲染；編輯器載入時以 `fitToSchema` 把欄位關掉的內容改成文字（例如 `options: { bold: false }` 時粗體顯示成一般文字），不會再變成空白編輯器而覆蓋資料。代價是在使用者編輯該欄位之前，公開頁仍顯示粗體、編輯器顯示一般文字；一旦編輯並儲存，粗體就從資料中消失。另一個選擇是讓 `useRichtextProps`（拿得到 `field`）把 `options` 傳給渲染器一起過濾：公開頁與編輯器完全一致，但修改 config 的 `options` 會立刻改變所有已發布頁面的外觀。
12. **`tiptap.extensions` 新增的 node 與 mark 不會渲染，重新開啟編輯器時也會被移除**（Task 7，請使用者確認）。這符合規格 F1「新增 extension 時要同時在 mapping 加上渲染與屬性驗證」，CHANGELOG 已列為 breaking；開發模式下編輯器會以 `console.warn` 列出這些型別。不新增 node／mark 的 extension（例如 placeholder、快捷鍵）不受影響。若希望在補上 mapping 之前先保留這類資料，可改為讓 `toEditorDoc` 保留「編輯器 schema 有、預設 mapping 沒有」的型別：資料不會遺失，但編輯器與公開頁的顯示會不同。
13. **編輯器的連結規則收緊為 `isSafeHref`**（Task 7）：tiptap 預設允許的 `ftp:`、`ftps:`、`sms:`、`callto:`、`cid:`、`xmpp:`，以及 `options.link.protocols` 加入的協定，在編輯器中都不能再建立連結（`setLink`、自動連結、貼上、解析 HTML 皆同），`options.link.isAllowedUri` 只能再加嚴。目的是不讓編輯器存下公開頁會移除的連結。
14. **轉換工具依欄位的 `options` 與 `tiptap.extensions` 解析 HTML**（Task 8）：與 v0.23.0 的渲染相同，欄位關掉的標記在轉換時就丟掉、只留文字。若打算放寬某個欄位的 `options`，要先改 config 再轉換。
15. **XSS 回歸測試的範圍**（規格 §9 第 3 項）：29 組 payload 送進共用渲染器（`RichTextContent`，伺服器端與 client）、`<Render>`（伺服器端與 client）、RSC 的 `ServerRender`（伺服器端），以及編輯器畫布：`EditorFallback` 檢查伺服器端與 client 的輸出，載入後的 tiptap 編輯器則在 jsdom 中檢查其 DOM 與 fallback 相同（tiptap 編輯器不在伺服器端渲染）。
16. **link 的 `rel` 去掉 `opener`**（Task 5，全域審查補上）：規格 F1 第 4 點只點名 `href` 與 `textAlign`；`rel: "opener"` 搭配 `target: "_blank"` 會造成 reverse tabnabbing，屬於同一類「屬性在 mapping 層驗證」的缺口，所以一併去掉。其餘連結類型照樣保留。
17. **全域審查補上的測試**：Task 5 `normalize.spec.ts` 1 個（rel opener）、Task 6 `components/Render/__tests__/index.spec.tsx` 3 個（array／object 欄位 ×2、hydration ×1）、Task 7 `editor.spec.tsx` 1 個（jsonb 重排 key）。本片段的預期輸出與測試數都已含這 5 個測試，並在暫存 worktree 從 `refs/tceditor-plan/task04` 依本片段重播驗證過（含紅燈）。

**給後續 task（Task 10–14）的基準數字**（Task 10–12 的計畫片段若以 `refs/tceditor-plan/task04` 為基準撰寫，預期輸出要加上這些差異）：Task 9 結束時 `pnpm verify` 為 jest 68 個 suite／637 個測試／19 個 snapshot，`node:test` 13 個，`105 package versions`，多一行 `check:bundle passed: 23 files reachable …`；`CHANGELOG.md` 清單最後一行是 Task 9 Step 6 加入的那一行（說明 `RichText` 型別與 demo 改用 JSON）。`migrate-data.ts` 以 `Object.prototype.hasOwnProperty.call` 查元件設定，Task 11 的 `lookupComponentConfig` 完成後可以改用它（非必要）。另外，core 的 TypeScript `lib` 是 `ES2015`，在 core 原始碼中直接呼叫 `Object.hasOwn` 會讓 `pnpm typecheck` 報 TS2550（本 worktree 實測），Task 11 已改用 `Object.prototype.hasOwnProperty.call`（全域審查確認）。


### Task 10: F3 — mapFields／walkTree／getChanged 的 O(n²) 合併

目的：修正評估報告 sec-data-02（規格 §6 F3）。`mapFields` 的 `flatten`、`walkTree` 的 `zones`、`getChanged` 三處都用「`reduce` 每一步把累加物件整個 spread 一次」來合併結果，n 個 key 要複製約 n²/2 次。在 Task 4 的結果上實測：10,000 個 key 的 props 經 `mapFields` 約 7,900 ms，10,000 個 zone 經 `walkTree` 約 7,800 ms，10,000 個 props 經 `getChanged` 約 8,100 ms。改為 `Object.fromEntries` 一次建好結果後，三者都在 15 ms 內。

**為什麼用 `Object.fromEntries`，而不是規格 F3 寫的「`Object.assign` 或直接賦值」**：資料裡的 key 來自使用者。對一般物件做 `acc["__proto__"] = v` 或 `Object.assign({}, { ["__proto__"]: v })` 會呼叫 `__proto__` setter，把結果物件的原型換掉，那個 key 也就不見了。`Object.fromEntries` 以 CreateDataProperty 定義每個 key，`"__proto__"` 會成為一般的自有屬性。

**新測試在舊實作下為什麼也會在 `__proto__` 那一條失敗**：`packages/tsconfig/react-library.json` 的 `target` 是 `es6`，ts-jest 會把物件 spread（`{ ...acc, ...item }`）編譯成 `Object.assign(...)`，所以在 jest 裡舊實作遇到 `"__proto__"` key 會改到結果的原型，`hasOwnProperty` 檢查得到 `false`。（tsup／esbuild 輸出的 `dist` 用另一種 helper，沒有這個問題，但不能依賴編譯器的差異。）各測試檔的效能測試與 `__proto__` 測試在舊實作下都會失敗，符合先紅後綠。

**執行位置**：主工作目錄 `/Users/kaellim/Desktop/projects/puck`，分支 `tzuchi/main`，接在 Task 9 的最後一個 commit 之後。本 task 的程式碼與預期輸出都在 Task 4 的結果（`754e723f`）上以暫存 worktree 逐步驗證過。Task 5–9 預期不會改到本 task 動的三個原始檔；若某段原始片段找不到，先用 `git grep -n` 搜尋片段中最有辨識度的一行：若只是周圍多了別的程式碼，照樣替換那幾行；若片段本身已被改寫，停下來回報，不要猜。

**注意**：
- 對外行為不變：三個函式的簽名與回傳內容（key 的集合、順序、值）都相同；唯一差別是資料中的 `"__proto__"` key 一律成為結果的自有屬性。
- 效能測試用 `performance.now()` 量測，門檻 200 ms。新實作在本機約 6–13 ms，留有很大餘裕；舊實作約 8,000 ms。
- commit 時一律明確列出路徑，不要用 `git add -A`，因為根目錄有未追蹤、不屬於本 task 的 `CLAUDE.md`。
- 預期輸出中省略了 jest 的堆疊行（以 `at ` 開頭的行）；括號內的毫秒數與 `Time:` 每次都會不同。

**Files:**
- Create:
  - `packages/core/lib/data/__tests__/map-fields-merge.spec.tsx`
  - `packages/core/lib/data/__tests__/walk-tree-merge.spec.tsx`
  - `packages/core/lib/__tests__/get-changed.spec.ts`
- Modify:
  - `packages/core/lib/data/map-fields.ts`（`flatten`）
  - `packages/core/lib/data/walk-tree.ts`（回傳值的 `zones`）
  - `packages/core/lib/get-changed.ts`（整個檔案）
  - `CHANGELOG.md`（Step 17）
- Test:
  - 上面三個新測試檔（共 7 個測試）
  - 既有的 `packages/core/lib/data/__tests__/*`、`lib/__tests__/resolve-component-data.spec.tsx`、`store/slices/__tests__/permissions.spec.tsx`、`store/slices/__tests__/fields.spec.tsx`（`getChanged` 的呼叫端）

**Interfaces:**
- Consumes：
  - Task 1 的 `pnpm verify` 與 `packages/core` 的 `pnpm test <路徑>`（jest，`testEnvironment: "jsdom"`）、`pnpm typecheck`。
  - Task 2 的套件名稱 `@tzuchi/tceditor`（測試以相對路徑 import，不受影響）。
  - Task 2–4 的 `CHANGELOG.md` 慣例：`### Changes from Puck v0.23.0` 條列清單之後緊接空行與 `## [0.23.0](/compare/v0.22.4...v0.23.0) (2026-08-07)`。Task 5–9 可能已在清單尾端加了幾行，所以 Step 17 插在空行與 `## [0.23.0]` 之前，不以「最後一行」作為原始片段。
- Produces：
  - `mapFields(item, mappers, config, recurseSlots?, shouldDefaultSlots?, fieldsToMap?)`、`walkTree(data, config, callbackFn)`、`getChanged(newItem, oldItem)` 簽名不變；`getChanged` 推論出的回傳型別由 `{}` 變成 `{ [k: string]: boolean }`（呼叫端不需修改，Step 15 的 typecheck 驗證）。
  - 慣例（Task 14 寫進 `CLAUDE.md` 時可引用）：以使用者資料為 key 合併物件時，用 `Object.fromEntries`，不要在一般物件上 spread 累加或用 `acc[k] = v`。
  - `packages/core/lib/data/map-fields.ts` 在 Task 11 還會再改：Task 11 的原始片段以本 task 完成後的內容為準。
  - `CHANGELOG.md` 清單最後一行變成 Step 17 加入的 `` * build the results of `mapFields`, `walkTree` and `getChanged` in one pass; … ``。

- [ ] **Step 1: 確認起點**

```bash
cd /Users/kaellim/Desktop/projects/puck
git branch --show-current
git status --short
git log --oneline -1
```

預期輸出（hash 會不同；最後一行是 Task 9 的最後一個 commit）：

```
tzuchi/main
?? CLAUDE.md
<hash> feat(richtext): type richtext data as JSON and convert the demo
```

分支不是 `tzuchi/main`、有 `?? CLAUDE.md` 以外的變更，或最新 commit 不是 Task 9 的最後一個 commit，就停下來。

- [ ] **Step 2: 寫 `mapFields` 的失敗測試**

建立 `packages/core/lib/data/__tests__/map-fields-merge.spec.tsx`，完整內容：

```tsx
import { Config } from "../../../types";
import { mapFields } from "../map-fields";

const config: Config = {
  components: {
    Comp: {
      fields: {
        title: { type: "text" },
      },
      render: () => <div />,
    },
  },
};

const makeProps = (count: number) => {
  const props: Record<string, string> = { id: "comp-1" };

  for (let i = 0; i < count; i++) {
    props[`key${i}`] = `value${i}`;
  }

  return props;
};

describe("mapFields merging", () => {
  it("maps 10,000 props in under 200 ms", () => {
    const item = { type: "Comp", props: makeProps(10_000) };

    const start = performance.now();
    const result = mapFields(item, {}, config);
    const elapsed = performance.now() - start;

    expect(Object.keys(result.props)).toHaveLength(10_001);
    expect(result.props.key9999).toBe("value9999");
    expect(elapsed).toBeLessThan(200);
  });

  it("keeps a __proto__ prop as an own property without touching any prototype", () => {
    const props = JSON.parse(
      '{"id":"comp-1","__proto__":{"polluted":"yes"},"title":"Hello"}'
    );

    const result = mapFields({ type: "Comp", props }, {}, config);

    expect(
      Object.prototype.hasOwnProperty.call(result.props, "__proto__")
    ).toBe(true);
    expect(Object.getPrototypeOf(result.props)).toBe(Object.prototype);
    expect(result.props.title).toBe("Hello");
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });
});
```

- [ ] **Step 3: 執行，確認在舊實作下失敗**

```bash
cd /Users/kaellim/Desktop/projects/puck/packages/core
pnpm test lib/data/__tests__/map-fields-merge.spec.tsx
```

預期（指令以非 0 結束；毫秒數會不同，約 8,000，遠大於 200）：

```
FAIL lib/data/__tests__/map-fields-merge.spec.tsx (7.987 s)
  mapFields merging
    ✕ maps 10,000 props in under 200 ms (7892 ms)
    ✕ keeps a __proto__ prop as an own property without touching any prototype (1 ms)

  ● mapFields merging › maps 10,000 props in under 200 ms

    expect(received).toBeLessThan(expected)

    Expected: < 200
    Received:   7887.502834

  ● mapFields merging › keeps a __proto__ prop as an own property without touching any prototype

    expect(received).toBe(expected) // Object.is equality

    Expected: true
    Received: false

Test Suites: 1 failed, 1 total
Tests:       2 failed, 2 total
```

第一個失敗證明 O(n²)；第二個失敗是舊的 spread 合併在 jest（ts-jest 編譯成 `Object.assign`）裡把 `"__proto__"` 當成 setter。若第一個測試的 `Received` 小於 200，表示 `flatten` 已經被改過，停下來檢查。

- [ ] **Step 4: 把 `flatten` 改為一次建好**

編輯 `packages/core/lib/data/map-fields.ts`，原始片段（逐字）：

```ts
const flatten = (values: Record<string, any>[]) =>
  values.reduce((acc, item) => ({ ...acc, ...item }), {});
```

替換為：

```ts
// Object.fromEntries builds the result in one pass (spreading the accumulator
// on every step was O(n²)) and defines "__proto__" as an own property instead
// of calling the prototype setter.
const flatten = (values: Record<string, any>[]) =>
  Object.fromEntries(values.flatMap((item) => Object.entries(item)));
```

`walkObject` 產生的每個元素都是 `{ [k]: value }`（computed key 本身就會建立自有屬性），`Object.entries` 會把 `"__proto__"` 一起取出。重複的 key 仍是後者覆蓋前者、保留第一次出現的位置，與舊的 spread 相同。

- [ ] **Step 5: 執行新測試與 `lib/data` 既有測試，確認通過**

```bash
cd /Users/kaellim/Desktop/projects/puck/packages/core
pnpm exec prettier --check lib/data/map-fields.ts lib/data/__tests__/map-fields-merge.spec.tsx
pnpm test lib/data/__tests__/map-fields-merge.spec.tsx
pnpm test lib/data
```

`prettier --check` 預期：

```
Checking formatting...
All matched files use Prettier code style!
```

第一個 `pnpm test` 預期：

```
PASS lib/data/__tests__/map-fields-merge.spec.tsx
  mapFields merging
    ✓ maps 10,000 props in under 200 ms (12 ms)
    ✓ keeps a __proto__ prop as an own property without touching any prototype

Test Suites: 1 passed, 1 total
Tests:       2 passed, 2 total
```

`pnpm test lib/data` 預期每個 suite 都是 `PASS`，沒有 `FAIL`。在 Task 4 的結果上驗證時，摘要是：

```
Test Suites: 11 passed, 11 total
Tests:       62 passed, 62 total
Snapshots:   4 passed, 4 total
```

（若 Task 5–9 在 `lib/data` 加了測試，數字會更多；重點是 0 個 failed。）

- [ ] **Step 6: Commit**

```bash
cd /Users/kaellim/Desktop/projects/puck
git add packages/core/lib/data/map-fields.ts packages/core/lib/data/__tests__/map-fields-merge.spec.tsx
git status --short
git commit -m "fix: build mapFields results in one pass and keep __proto__ props as own keys"
```

`git status --short` 預期：

```
A  packages/core/lib/data/__tests__/map-fields-merge.spec.tsx
M  packages/core/lib/data/map-fields.ts
?? CLAUDE.md
```

`git commit` 預期（hash 會不同）：

```
[tzuchi/main <hash>] fix: build mapFields results in one pass and keep __proto__ props as own keys
 2 files changed, 56 insertions(+), 1 deletion(-)
 create mode 100644 packages/core/lib/data/__tests__/map-fields-merge.spec.tsx
```

- [ ] **Step 7: 寫 `walkTree` 的失敗測試**

建立 `packages/core/lib/data/__tests__/walk-tree-merge.spec.tsx`，完整內容：

```tsx
import { Config, Content, Data } from "../../../types";
import { walkTree } from "../walk-tree";

const config: Config = {
  components: {
    Comp: {
      fields: {},
      render: () => <div />,
    },
  },
};

describe("walkTree merging", () => {
  it("walks 10,000 zones in under 200 ms", () => {
    const zones: Record<string, Content> = {};

    for (let i = 0; i < 10_000; i++) {
      zones[`comp-${i}:content`] = [];
    }

    const data: Data = { root: { props: {} }, content: [], zones };

    const start = performance.now();
    const result = walkTree(data, config, (content) => content);
    const elapsed = performance.now() - start;

    expect(Object.keys(result.zones ?? {})).toHaveLength(10_000);
    expect(elapsed).toBeLessThan(200);
  });

  it("keeps a __proto__ zone as an own property without touching any prototype", () => {
    const zones = JSON.parse(
      '{"__proto__":[{"type":"Comp","props":{"id":"comp-1"}}]}'
    );

    const data: Data = { root: { props: {} }, content: [], zones };

    const result = walkTree(data, config, (content) => content);

    expect(
      Object.prototype.hasOwnProperty.call(result.zones, "__proto__")
    ).toBe(true);
    expect(Object.getPrototypeOf(result.zones)).toBe(Object.prototype);
    expect(result.zones?.["__proto__"]).toEqual([
      { type: "Comp", props: { id: "comp-1" } },
    ]);
  });
});
```

- [ ] **Step 8: 執行，確認在舊實作下失敗**

```bash
cd /Users/kaellim/Desktop/projects/puck/packages/core
pnpm test lib/data/__tests__/walk-tree-merge.spec.tsx
```

預期（指令以非 0 結束；毫秒數會不同）：

```
FAIL lib/data/__tests__/walk-tree-merge.spec.tsx (7.902 s)
  walkTree merging
    ✕ walks 10,000 zones in under 200 ms (7802 ms)
    ✕ keeps a __proto__ zone as an own property without touching any prototype (1 ms)

  ● walkTree merging › walks 10,000 zones in under 200 ms

    expect(received).toBeLessThan(expected)

    Expected: < 200
    Received:   7797.373500000001

  ● walkTree merging › keeps a __proto__ zone as an own property without touching any prototype

    expect(received).toBe(expected) // Object.is equality

    Expected: true
    Received: false

Test Suites: 1 failed, 1 total
Tests:       2 failed, 2 total
```

Step 4 已經修好 `mapFields`，這裡的時間全部花在 `walkTree` 自己的 `zones` 合併。

- [ ] **Step 9: 把 `walkTree` 的 `zones` 改為一次建好**

編輯 `packages/core/lib/data/walk-tree.ts`，原始片段（逐字）：

```ts
    zones: Object.keys(zones).reduce(
      (acc, zoneCompound) => ({
        ...acc,
        [zoneCompound]: zones[zoneCompound].map(walkItem),
      }),
      {}
    ),
```

替換為：

```ts
    // One pass, and "__proto__" stays an own key (see flatten in map-fields.ts)
    zones: Object.fromEntries(
      Object.keys(zones).map((zoneCompound) => [
        zoneCompound,
        zones[zoneCompound].map(walkItem),
      ])
    ),
```

- [ ] **Step 10: 執行，確認通過**

```bash
cd /Users/kaellim/Desktop/projects/puck/packages/core
pnpm exec prettier --check lib/data/walk-tree.ts lib/data/__tests__/walk-tree-merge.spec.tsx
pnpm test lib/data/__tests__/walk-tree-merge.spec.tsx lib/data/__tests__/walk-tree.spec.tsx
```

`prettier --check` 預期 `All matched files use Prettier code style!`。`pnpm test` 預期：

```
PASS lib/data/__tests__/walk-tree.spec.tsx
PASS lib/data/__tests__/walk-tree-merge.spec.tsx

Test Suites: 2 passed, 2 total
Tests:       8 passed, 8 total
Snapshots:   2 passed, 2 total
```

（兩行 `PASS` 的順序可能相反。）

- [ ] **Step 11: Commit**

```bash
cd /Users/kaellim/Desktop/projects/puck
git add packages/core/lib/data/walk-tree.ts packages/core/lib/data/__tests__/walk-tree-merge.spec.tsx
git status --short
git commit -m "fix: build walkTree zones in one pass and keep a __proto__ zone as an own key"
```

`git status --short` 預期：

```
A  packages/core/lib/data/__tests__/walk-tree-merge.spec.tsx
M  packages/core/lib/data/walk-tree.ts
?? CLAUDE.md
```

`git commit` 預期（hash 會不同）：

```
[tzuchi/main <hash>] fix: build walkTree zones in one pass and keep a __proto__ zone as an own key
 2 files changed, 54 insertions(+), 6 deletions(-)
 create mode 100644 packages/core/lib/data/__tests__/walk-tree-merge.spec.tsx
```

- [ ] **Step 12: 寫 `getChanged` 的失敗測試**

`getChanged` 原本沒有單元測試。建立 `packages/core/lib/__tests__/get-changed.spec.ts`，完整內容：

```ts
import { getChanged } from "../get-changed";

describe("getChanged", () => {
  it("flags the props that differ from the previous item", () => {
    const changed = getChanged(
      { props: { id: "comp-1", title: "New", body: "Same" } },
      { props: { id: "comp-1", title: "Old", body: "Same" } }
    );

    expect(changed).toEqual({ id: false, title: true, body: false });
  });

  it("compares 10,000 props in under 200 ms", () => {
    const props: Record<string, string> = { id: "comp-1" };

    for (let i = 0; i < 10_000; i++) {
      props[`key${i}`] = `value${i}`;
    }

    const start = performance.now();
    const changed = getChanged({ props }, { props: { id: "comp-1" } });
    const elapsed = performance.now() - start;

    expect(Object.keys(changed)).toHaveLength(10_001);
    expect(elapsed).toBeLessThan(200);
  });

  it("keeps a __proto__ prop as an own property without touching any prototype", () => {
    const props = JSON.parse('{"id":"comp-1","__proto__":{"polluted":"yes"}}');

    const changed = getChanged({ props }, null);

    expect(Object.prototype.hasOwnProperty.call(changed, "__proto__")).toBe(
      true
    );
    expect(Object.getPrototypeOf(changed)).toBe(Object.prototype);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });
});
```

第一個測試鎖住既有行為（舊實作也會通過），後兩個是本 task 要修的問題。

- [ ] **Step 13: 執行，確認在舊實作下失敗**

```bash
cd /Users/kaellim/Desktop/projects/puck/packages/core
pnpm test lib/__tests__/get-changed.spec.ts
```

預期（指令以非 0 結束；毫秒數會不同）：

```
FAIL lib/__tests__/get-changed.spec.ts (8.24 s)
  getChanged
    ✓ flags the props that differ from the previous item (1 ms)
    ✕ compares 10,000 props in under 200 ms (8130 ms)
    ✕ keeps a __proto__ prop as an own property without touching any prototype

  ● getChanged › compares 10,000 props in under 200 ms

    expect(received).toBeLessThan(expected)

    Expected: < 200
    Received:   8125.683542

  ● getChanged › keeps a __proto__ prop as an own property without touching any prototype

    expect(received).toBe(expected) // Object.is equality

    Expected: true
    Received: false

Test Suites: 1 failed, 1 total
Tests:       2 failed, 1 passed, 3 total
```

- [ ] **Step 14: 改寫 `getChanged`**

`packages/core/lib/get-changed.ts` 的原始內容（整個檔案，逐字）：

```ts
import { ComponentData } from "../types";
import { deepEqual } from "fast-equals";

export const getChanged = (
  newItem: Omit<Partial<ComponentData<any>>, "type"> | undefined,
  oldItem: Omit<Partial<ComponentData<any>>, "type"> | null | undefined
) => {
  return newItem
    ? Object.keys(newItem.props || {}).reduce((acc, item) => {
        const newItemProps = newItem?.props || {};
        const oldItemProps = oldItem?.props || {};

        return {
          ...acc,
          [item]: !deepEqual(oldItemProps[item], newItemProps[item]),
        };
      }, {})
    : {};
};
```

整個檔案替換為：

```ts
import { ComponentData } from "../types";
import { deepEqual } from "fast-equals";

export const getChanged = (
  newItem: Omit<Partial<ComponentData<any>>, "type"> | undefined,
  oldItem: Omit<Partial<ComponentData<any>>, "type"> | null | undefined
) => {
  if (!newItem) {
    return {};
  }

  const newItemProps = newItem.props || {};
  const oldItemProps = oldItem?.props || {};

  // One pass, and "__proto__" stays an own key (see flatten in map-fields.ts)
  return Object.fromEntries(
    Object.keys(newItemProps).map((item): [string, boolean] => [
      item,
      !deepEqual(oldItemProps[item], newItemProps[item]),
    ])
  );
};
```

tuple 型別 `[string, boolean]` 讓 `Object.fromEntries` 推論出 `{ [k: string]: boolean }`，而不是 `any`。

- [ ] **Step 15: 執行 `getChanged` 與其呼叫端的測試，並做型別檢查**

```bash
cd /Users/kaellim/Desktop/projects/puck/packages/core
pnpm exec prettier --check lib/get-changed.ts lib/__tests__/get-changed.spec.ts
pnpm test lib/__tests__/get-changed.spec.ts lib/__tests__/resolve-component-data.spec.tsx store/slices/__tests__/permissions.spec.tsx store/slices/__tests__/fields.spec.tsx
pnpm typecheck
```

`prettier --check` 預期 `All matched files use Prettier code style!`。`pnpm test` 預期四個 suite 都是 `PASS`（順序可能不同）：

```
PASS lib/__tests__/get-changed.spec.ts
PASS lib/__tests__/resolve-component-data.spec.tsx
PASS store/slices/__tests__/permissions.spec.tsx
PASS store/slices/__tests__/fields.spec.tsx

Test Suites: 4 passed, 4 total
Tests:       32 passed, 32 total
Snapshots:   0 total
```

（若 Task 5–9 在這些檔案加了測試，`Tests:` 會更多，但必須 0 個 failed。）`pnpm typecheck` 預期只印出

```
> @tzuchi/tceditor@0.1.0 typecheck /Users/kaellim/Desktop/projects/puck/packages/core
> tsc -p tsconfig.typecheck.json
```

沒有任何 `error TS`，結束碼為 0。

- [ ] **Step 16: Commit**

```bash
cd /Users/kaellim/Desktop/projects/puck
git add packages/core/lib/get-changed.ts packages/core/lib/__tests__/get-changed.spec.ts
git status --short
git commit -m "fix: build getChanged results in one pass and keep a __proto__ prop as an own key"
```

`git status --short` 預期：

```
A  packages/core/lib/__tests__/get-changed.spec.ts
M  packages/core/lib/get-changed.ts
?? CLAUDE.md
```

`git commit` 預期（hash 會不同）：

```
[tzuchi/main <hash>] fix: build getChanged results in one pass and keep a __proto__ prop as an own key
 2 files changed, 52 insertions(+), 10 deletions(-)
 create mode 100644 packages/core/lib/__tests__/get-changed.spec.ts
```

- [ ] **Step 17: 在 CHANGELOG 記錄並 commit**

先確認插入點只有一個：

```bash
cd /Users/kaellim/Desktop/projects/puck
grep -c '^## \[0\.23\.0\]' CHANGELOG.md
```

預期輸出 `1`。插入一行（成為 `### Changes from Puck v0.23.0` 清單的最後一項）：

```bash
perl -0pi -e 's/\n\n## \[0\.23\.0\]/\n* build the results of `mapFields`, `walkTree` and `getChanged` in one pass; re-spreading the accumulator for every key took about 8 seconds for 10,000 props or zones, and a `__proto__` key in the data is now kept as an own key instead of replacing the prototype of the result\n\n## [0.23.0]/' CHANGELOG.md
git diff --numstat CHANGELOG.md
git diff -U0 CHANGELOG.md | grep -E '^[-+][^-+]' | cut -c1-40
grep -n -A2 '^\* build the results of `mapFields`' CHANGELOG.md | cut -c1-60
```

預期（行號會依 Task 5–9 加的行數而不同）：

```
1	0	CHANGELOG.md
+* build the results of `mapFields`, `wa
<n>:* build the results of `mapFields`, `walkTree` and `getCha
<n+1>-
<n+2>-## [0.23.0](/compare/v0.22.4...v0.23.0) (2026-08-07)
```

只新增一行、沒有刪除任何一行。`CHANGELOG.md` 在 `.prettierignore` 中，不受 `format:check` 檢查。Commit：

```bash
git add CHANGELOG.md
git status --short
git commit -m "docs: record the one-pass merge fix in the changelog"
```

`git status --short` 預期：

```
M  CHANGELOG.md
?? CLAUDE.md
```

`git commit` 預期（hash 會不同）：

```
[tzuchi/main <hash>] docs: record the one-pass merge fix in the changelog
 1 file changed, 1 insertion(+)
```

- [ ] **Step 18: 完整驗證**

```bash
cd /Users/kaellim/Desktop/projects/puck
pnpm verify > "${TMPDIR:-/tmp}/tceditor-verify-task10.log" 2>&1
echo "exit=$?"
grep -E "Test Suites:|Tests:|Snapshots:|ℹ (tests|pass|fail)|> tsc|✖|Tasks:|All matched|^pnpm audit:|^GATED|^audit:gate (passed|FAILED)" "${TMPDIR:-/tmp}/tceditor-verify-task10.log"
```

判斷標準：

- `exit=0`。
- `@tzuchi/tceditor:test:` 的 `Test Suites:` 比 Task 9 最後一次 `pnpm verify` 多 3 個、`Tests:` 多 7 個，全部 passed；`Snapshots:` 數不變。依序執行完 Task 1–10 時應為 `Test Suites: 71 passed, 71 total`、`Tests:       644 passed, 644 total`、`Snapshots:   19 passed, 19 total`，`ℹ tests 13`，`105 package versions`（全域審查從 `refs/tceditor-plan/task04` 依 Task 5–10 的計畫重播得到）。
- `ℹ fail 0`；`> tsc -p tsconfig.typecheck.json` 之後沒有 `error TS`。
- 兩行 `✖ … problems (0 errors, … warnings)` 的數字與 Task 9 結束時相同（本 task 不新增 warning）。
- `All matched files use Prettier code style!`。
- Task 8 加入的 `check:bundle` 通過，輸出與 Task 9 結束時相同。
- `GATED (ships with a published package): 0 finding(s)` 與 `audit:gate passed`（advisory 總數會隨資料庫更新而變）。

在 Task 4 的結果上驗證時（尚無 Task 5–9 與 `check:bundle`），對應輸出是：

```
exit=0
@tzuchi/tceditor:test: Test Suites: 56 passed, 56 total
@tzuchi/tceditor:test: Tests:       290 passed, 290 total
@tzuchi/tceditor:test: Snapshots:   19 passed, 19 total
 Tasks:    1 successful, 1 total
ℹ tests 10
ℹ pass 10
ℹ fail 0
> tsc -p tsconfig.typecheck.json
demo:lint: ✖ 8 problems (0 errors, 8 warnings)
@tzuchi/tceditor:lint: ✖ 4 problems (0 errors, 4 warnings)
 Tasks:    3 successful, 3 total
All matched files use Prettier code style!
 Tasks:    3 successful, 3 total
pnpm audit: 69 advisories, 71 finding path(s). 104 package versions ship with packages/core, packages/plugin-heading-analyzer.
GATED (ships with a published package): 0 finding(s)
audit:gate passed: no advisories affect packages/core, packages/plugin-heading-analyzer (71 finding path(s) elsewhere are listed above).
```

（與 Task 4 Step 10 的 53 個 suite、283 個測試相比，多了 3 個 suite、7 個測試。）

- [ ] **Step 19: 確認 commit 與工作目錄**

```bash
cd /Users/kaellim/Desktop/projects/puck
git log --oneline -4
git status --short
```

預期（hash 會不同）：

```
<hash> docs: record the one-pass merge fix in the changelog
<hash> fix: build getChanged results in one pass and keep a __proto__ prop as an own key
<hash> fix: build walkTree zones in one pass and keep a __proto__ zone as an own key
<hash> fix: build mapFields results in one pass and keep __proto__ props as own keys
?? CLAUDE.md
```

本 task 的 4 個 commit 都已完成。

---

### Task 11: F4 — 原型成員名稱造成崩潰

目的：修正評估報告 sec-data-05（規格 §6 F4）。v0.23.0 以 `config.components[type]` 查元件設定、以一般物件 `{}` 當 id 索引。資料中的元件 type 或 id 若是 `Object.prototype` 的成員名稱（`constructor`、`__proto__`、`toString`、`hasOwnProperty`…），就會查到繼承來的成員：

- `config.components["constructor"]` 是 `Object` 函式，`config.components["__proto__"]` 是 `Object.prototype`，兩者都是 truthy，接著 `<Component.render>` 拿到 `undefined`，`<Render>`、`ServerRender` 與編輯器畫布都會拋出 `Element type is invalid`。
- `walkAppState` 的 `newNodeIndex["__proto__"] = …` 會呼叫 setter，id 為 `__proto__` 的節點不會出現在 `state.indexes.nodes`。
- `groupZonesByComponent`、圖層樹的 `getZonesByParent`、`migrate` 的累加物件，遇到 `__proto__`／`constructor` 會對繼承來的成員呼叫 `.push`，或把值寫進 `Object.prototype`（`migrate` 的 `migrateDynamicZonesForComponent` 路徑會真的汙染全域原型）。
- 以元件 type 查使用者提供的 callback 物件時也一樣：`migrate` 的 `migrateDynamicZonesForComponent?.[child.type]` 遇到 type `constructor` 會把 `Object` 當成遷移函式，zone 內容被靜默刪除；`toString` 讓 props 變成字串 `"[object Undefined]"`；`__proto__` 拋出 `migrateFn is not a function`。公開 API `transformProps` 的 `propTransforms[item.type]` 遇到 `__proto__` 拋出 `propTransforms[item.type] is not a function`，遇到 `toString` 把 props 變成 `{"0":"[","1":"o",…}`（評估報告 sec-data-05 的表格列有 `transformProps`）。

作法分四組，各自先寫失敗測試再修：
1. 新增 `lookupComponentConfig(config, type)`，只認 `config.components` 的自有 key。
2. 渲染路徑（`ServerRender`、`SlotRender/server`、`DropZone` 的 render 模式）改用它，找不到時照舊略過該元件。
3. 編輯器：`walkAppState` 的索引改為 null-prototype 物件；圖層樹的累加器改為 `Object.create(null)`；其餘讀取點（`DropZone` 編輯模式、store、permissions、insert、`getSlotField`、field transforms、`resolveComponentData`、`mapFields`）改用 `lookupComponentConfig`，找不到時沿用既有的 "No configuration for {type}" 行為。
4. `groupZonesByComponent` 與 `migrate` 的累加器改為 `Object.create(null)`，`migrate` 的讀取點改用 `lookupComponentConfig`；`migrate` 的 `migrateDynamicZonesForComponent` 與 `transformProps` 的 `propTransforms` 改為先用 `Object.prototype.hasOwnProperty.call` 確認是自有 key 才取用。

**與規格或共同介面不同之處**（已在 worktree 驗證，理由如下）：
- 規格 F4 舉例用 `Object.hasOwn`，共同介面也這樣寫，但這裡改用語意相同的 `Object.prototype.hasOwnProperty.call`。原因如下：`packages/tsconfig/react-library.json` 的 `lib` 是 `["ES2015", "DOM"]`。`packages/core/tsconfig*.json` 的 `types: ["node"]` 會載入根目錄的 `@types/node@17.0.45`，它來自 `apps/demo`，經 `shamefullyHoist` 提升到根目錄。這個套件的 `index.d.ts` 帶有 `/// <reference lib="es2020" />`，所以實際生效的 lib 是 ES2015 再加上 ES2020。Task 10 用的 `Object.fromEntries`（ES2019）因此可以編譯；`Object.hasOwn` 屬於 ES2022，仍會得到 `error TS2550: Property 'hasOwn' does not exist on type 'ObjectConstructor'. Do you need to change your target library? Try changing the 'lib' compiler option to 'es2022' or later.`（已在 worktree 用 `tsc -p tsconfig.typecheck.json` 驗證）。修改 `lib` 超出本 task 範圍。之後的 task（含 Task 14 寫進 `CLAUDE.md` 的資安規則）也請一律寫 `Object.prototype.hasOwnProperty.call`，不要寫 `Object.hasOwn`。
- 共同介面寫的回傳型別是 `ComponentConfig | undefined`。實際使用 `Config["components"][string] | undefined`，也就是原本 `config.components[type]` 的元素型別：改用預設泛型的 `ComponentConfig` 會在 `DropZone/index.tsx`（`useFieldTransformsTracked` 的參數）與 `resolve-component-data.ts`（`resolveData` 的參數）各產生一個型別錯誤。這個型別可以指派給 `ComponentConfig | undefined`（已用 tsc 驗證），所以依共同介面撰寫的呼叫端不受影響。
- 除了指定的讀取點，另外修了幾處由測試抓到的同類問題：`components/LayerTree/lib/build-layer-tree.ts` 的 `getZonesByParent`（id 為 `constructor` 的元件有 slot 時，圖層面板會因 `.push is not a function` 讓整個編輯器崩潰）、`migrate` 裡的 `updatedItems` 與 `unmigratedZonesGrouped` 兩個累加器，以及以 type 查使用者 callback 的兩處：`migrate` 的 `migrateDynamicZonesForComponent` 和 `lib/transform-props.ts` 的 `propTransforms`。
- `walkAppState` 最後合併索引時不用 spread，改用 `createIndex`（`Object.assign` 到 null-prototype 物件）。在 jest 裡 spread 會被編譯成 `Object.assign({}, …)`，對一般物件寫入 `"__proto__"` 會呼叫 setter，所以「只把 `newNodeIndex` 改成 `Object.create(null)`、保留 spread 合併」行不通。null-prototype 物件沒有 `__proto__` setter，`Object.assign` 對它是安全的。

**行為變化**（皆為「找不到設定」的既有語意，測試全數通過）：
- 資料中 type 為原型成員名稱的元件，在 `<Render>`／`ServerRender` 被略過，在編輯器顯示 `No configuration for constructor` 之類的提示。
- `dispatch({ type: "insert", componentType })` 遇到沒有設定的 type 時，原本會因讀取 `undefined.defaultProps` 拋出 TypeError，現在會插入只帶 `id` 的元件，畫面顯示上述提示。
- `walkTree`（以及用它的 `transformProps`）遇到 slot 內 type 為原型成員名稱的元件，現在與其他未知 type 一樣拋出 `Could not find component config for constructor`，不再當成已知元件繼續處理。
- `transformProps` 遇到 type 為原型成員名稱的元件時原樣保留（除非 `propTransforms` 真的以那個名稱定義了自有 key），和其他沒有 transform 的 type 相同。
- `migrate` 搭配 `migrateDynamicZonesForComponent` 時，type 為原型成員名稱的元件不會呼叫任何遷移函式。它的 dynamic zone 和其他沒有遷移函式的 zone 一樣，最後會拋出 `Could not migrate DropZone "<id>:<zone>" to slot field. …`，不再靜默刪除或毀損資料。

**與 Task 5–9（richtext）、Task 12 的重疊**：
- Task 5–9 可能改過 `components/ServerRender/index.tsx`、`components/SlotRender/server.tsx`、`components/DropZone/index.tsx` 中 `useRichtextProps` 的附近。下面的原始片段刻意只包含 `config.components[...]` 讀取與 import 那一行，以 Task 4 的結果逐字驗證過。若某段找不到，先用 `git grep -n` 搜尋片段中最有辨識度的一行：若只是周圍多了別的程式碼，照樣替換那幾行；若片段本身已被改寫，停下來回報，不要猜。
- 新增 import 的位置：每一處都指定「接在某一行之後」。若那一行被 Task 5–9 改過或移除，就把新的 import 放在該檔 import 區塊的最後一行之後（prettier 不會重排 import，放哪一行都能通過 `format:check`）。
- `ServerRender` 的 `Component` 型別會從「一定有值」變成 `… | undefined`（原本的程式碼已用 `Component?.fields` 與 `if (!Component) return null` 處理）。若 Task 6 在這個 guard 之前加了 `Component.xxx` 的讀取，Step 12 的 typecheck 會報 `'Component' is possibly 'undefined'`；把那一處改為 `Component?.xxx` 即可。`SlotRender/server.tsx` 與 `DropZone/index.tsx` 的兩個子元件用非空斷言 `!`，型別不變，不受影響。
- Task 12 在 `store/index.ts` 修改的是 `AppStore` 型別（`dnd?: DndConfig;` 附近），與本 task 的 import 行及 `getComponentConfig` 不重疊。
- `lib/migrate.ts`、`lib/transform-props.ts`、`lib/group-zones-by-component.ts` 不在 Task 5–9 的修改範圍內。已把 Task 10、11 的全部 commit cherry-pick 到 Task 5–9 的草稿實作上：沒有衝突，`packages/core` 共 73 個 suite、532 個測試全數通過，`pnpm typecheck` 沒有錯誤。

**其他注意**：
- commit 時一律明確列出路徑，不要用 `git add -A`。
- 預期輸出中省略了 jest 的堆疊行（以 `at ` 開頭的行）；括號內的毫秒數與 `Time:` 每次都會不同。
- `Object.create(null)` 建立的物件沒有 `hasOwnProperty` 等方法。之後讀 `state.indexes.nodes`／`zones` 或 `groupZonesByComponent` 的結果時，用 `in`、`Object.keys` 或 `Object.prototype.hasOwnProperty.call(obj, key)`，不要呼叫 `obj.hasOwnProperty(key)`。修改前已用 `git grep` 確認 repo 內沒有這種呼叫，jest snapshot 也不受影響（jest 對 null-prototype 物件同樣印成 `{`）。

**Files:**
- Create:
  - `packages/core/lib/lookup-component-config.ts`
  - `packages/core/lib/__tests__/lookup-component-config.spec.ts`
  - `packages/core/components/Render/__tests__/prototype-types.spec.tsx`
  - `packages/core/components/Puck/__tests__/prototype-ids.spec.tsx`
  - `packages/core/lib/__tests__/prototype-zone-ids.spec.tsx`
- Modify:
  - `packages/core/components/ServerRender/index.tsx`（import＋1 處）
  - `packages/core/components/SlotRender/server.tsx`（import＋2 處）
  - `packages/core/components/DropZone/index.tsx`（import＋3 處：render 模式 2 處在 Step 11，編輯模式 1 處在 Step 18）
  - `packages/core/lib/data/walk-app-state.ts`（`createIndex`、`newZoneIndex`／`newNodeIndex`、最後的索引合併）
  - `packages/core/components/LayerTree/lib/build-layer-tree.ts`（`getZonesByParent` 的累加器）
  - `packages/core/store/index.ts`（import＋`getComponentConfig` 2 處）
  - `packages/core/store/slices/permissions.ts`（import＋3 處）
  - `packages/core/reducer/actions/insert.ts`（import＋1 處）
  - `packages/core/lib/data/get-slot-field.ts`（import＋1 處）
  - `packages/core/lib/field-transforms/use-field-transforms-tracked.tsx`（import＋1 處）
  - `packages/core/lib/resolve-component-data.ts`（import＋1 處）
  - `packages/core/lib/data/map-fields.ts`（import＋2 處；`flatten` 已在 Task 10 改過）
  - `packages/core/lib/group-zones-by-component.ts`（整個檔案）
  - `packages/core/lib/migrate.ts`（import＋4 處）
  - `packages/core/lib/transform-props.ts`（`mapItem` 1 處）
  - `CHANGELOG.md`（Step 32）
- Test:
  - 上面四個新測試檔（8＋2＋2＋10＝22 個測試）
  - 既有的 `components/ServerRender/__tests__/*`、`components/Puck/__tests__/*`、`lib/data/__tests__/*`、`store/**/__tests__/*`、`reducer/**/__tests__/*`、`components/LayerTree/**/__tests__/*`、`lib/field-transforms/__tests__/*`、`lib/__tests__/*`

**Interfaces:**
- Consumes：
  - Task 10 完成後的 `packages/core/lib/data/map-fields.ts`（`flatten` 已改用 `Object.fromEntries`；本 task 的原始片段不含 `flatten`）。
  - Task 10 Step 17 之後的 `CHANGELOG.md`（插入點仍是空行與 `## [0.23.0]` 之前）。
  - Task 1 的 `pnpm verify`、`pnpm typecheck`，`packages/core` 的 `pnpm test <路徑>`。
- Produces：
  - `packages/core/lib/lookup-component-config.ts`：`export function lookupComponentConfig(config: Config, type: string | undefined | null): Config["components"][string] | undefined`，以 `Object.prototype.hasOwnProperty.call` 實作（不用 `Object.hasOwn`，理由見上方「與規格或共同介面不同之處」）。只回傳 `config.components` 的自有 key；`type` 不是字串、`config.components` 不存在、或 key 不是自有屬性時回傳 `undefined`。回傳型別可以指派給共同介面寫的 `ComponentConfig | undefined`。不從 `bundle/core.ts` 匯出，不是公開 API。若其他地方的共同介面仍寫 `ComponentConfig | undefined` 或 `Object.hasOwn`，以這一條為準；Task 14 寫 `CLAUDE.md` 時也引用這裡的說法。
  - `walkAppState` 回傳的 `state.indexes.nodes` 與 `state.indexes.zones` 是 null-prototype 物件（`lib/data/walk-app-state.ts` 內部的 `createIndex`，不匯出）；`groupZonesByComponent` 的回傳值也是 null-prototype 物件。
  - 慣例（Task 14 寫進 `CLAUDE.md` 的資安規則時可引用）：查元件設定一律用 `lookupComponentConfig(config, type)`，不要直接寫 `config.components[type]`。以資料中的 type 查使用者提供的其他物件時（例如 `migrateDynamicZonesForComponent`、`transformProps` 的 `propTransforms`），先用 `Object.prototype.hasOwnProperty.call(obj, type)` 確認是自有 key 再取用。以使用者資料（id、zone compound）為 key 的查表或累加物件，用 `Object.create(null)` 建立。
  - `CHANGELOG.md` 清單最後一行變成 Step 32 加入的 `` * look up component configs, `migrateDynamicZonesForComponent` callbacks and `transformProps` transforms by own key only, … ``。

- [ ] **Step 1: 確認起點**

```bash
cd /Users/kaellim/Desktop/projects/puck
git branch --show-current
git status --short
git log --oneline -1
```

預期（hash 會不同）：

```
tzuchi/main
?? CLAUDE.md
<hash> docs: record the one-pass merge fix in the changelog
```

三項任何一項不符就停下來。

- [ ] **Step 2: 寫 `lookupComponentConfig` 的失敗測試**

建立 `packages/core/lib/__tests__/lookup-component-config.spec.ts`，完整內容：

```ts
import { Config } from "../../types";
import { lookupComponentConfig } from "../lookup-component-config";

const render = () => null;

const config: Config = {
  components: {
    Heading: { render },
  },
};

describe("lookupComponentConfig", () => {
  it("returns the config for a defined component type", () => {
    expect(lookupComponentConfig(config, "Heading")).toBe(
      config.components.Heading
    );
  });

  it("returns undefined for an unknown component type", () => {
    expect(lookupComponentConfig(config, "Missing")).toBeUndefined();
  });

  it.each(["constructor", "__proto__", "toString", "hasOwnProperty"])(
    "returns undefined for the inherited member %s",
    (type) => {
      expect(lookupComponentConfig(config, type)).toBeUndefined();
    }
  );

  it("returns undefined when the type is missing", () => {
    expect(lookupComponentConfig(config, undefined)).toBeUndefined();
    expect(lookupComponentConfig(config, null)).toBeUndefined();
  });

  it("returns a component that is really named after an inherited member", () => {
    const ownConstructor = { render };
    const configWithConstructor: Config = {
      components: { constructor: ownConstructor },
    };

    expect(lookupComponentConfig(configWithConstructor, "constructor")).toBe(
      ownConstructor
    );
  });
});
```

- [ ] **Step 3: 執行，確認失敗**

```bash
cd /Users/kaellim/Desktop/projects/puck/packages/core
pnpm test lib/__tests__/lookup-component-config.spec.ts
```

預期（指令以非 0 結束）：

```
FAIL lib/__tests__/lookup-component-config.spec.ts
  ● Test suite failed to run

    Cannot find module '../lookup-component-config' from 'lib/__tests__/lookup-component-config.spec.ts'

Test Suites: 1 failed, 1 total
Tests:       0 total
```

- [ ] **Step 4: 建立 `lookupComponentConfig`**

建立 `packages/core/lib/lookup-component-config.ts`，完整內容：

```ts
import { Config } from "../types";

/**
 * Looks up the config for a component type.
 *
 * Only own keys of `config.components` count. A plain
 * `config.components[type]` returns inherited members such as
 * `Object.prototype` for "__proto__" or `Object` for "constructor", which
 * then crash rendering. Unknown types return `undefined`, so callers keep
 * their existing "no configuration" behaviour.
 *
 * Uses `hasOwnProperty.call` because `Object.hasOwn` (ES2022) is outside the
 * ES2015 lib plus the ES2020 lib that @types/node adds (error TS2550).
 */
export function lookupComponentConfig(
  config: Config,
  type: string | undefined | null
): Config["components"][string] | undefined {
  const components = config.components;

  if (typeof type !== "string" || !components) {
    return undefined;
  }

  return Object.prototype.hasOwnProperty.call(components, type)
    ? components[type]
    : undefined;
}
```

- [ ] **Step 5: 執行，確認通過並做型別檢查**

```bash
cd /Users/kaellim/Desktop/projects/puck/packages/core
pnpm exec prettier --check lib/lookup-component-config.ts lib/__tests__/lookup-component-config.spec.ts
pnpm test lib/__tests__/lookup-component-config.spec.ts
pnpm typecheck
```

`prettier --check` 預期 `All matched files use Prettier code style!`。`pnpm test` 預期：

```
PASS lib/__tests__/lookup-component-config.spec.ts
  lookupComponentConfig
    ✓ returns the config for a defined component type (1 ms)
    ✓ returns undefined for an unknown component type
    ✓ returns undefined for the inherited member constructor
    ✓ returns undefined for the inherited member __proto__
    ✓ returns undefined for the inherited member toString
    ✓ returns undefined for the inherited member hasOwnProperty
    ✓ returns undefined when the type is missing
    ✓ returns a component that is really named after an inherited member

Test Suites: 1 passed, 1 total
Tests:       8 passed, 8 total
```

`pnpm typecheck` 預期沒有 `error TS`，結束碼為 0。

- [ ] **Step 6: Commit**

```bash
cd /Users/kaellim/Desktop/projects/puck
git add packages/core/lib/lookup-component-config.ts packages/core/lib/__tests__/lookup-component-config.spec.ts
git commit -m "refactor: add lookupComponentConfig for own-key component config lookups"
```

預期（hash 會不同）：

```
[tzuchi/main <hash>] refactor: add lookupComponentConfig for own-key component config lookups
 2 files changed, 73 insertions(+)
 create mode 100644 packages/core/lib/__tests__/lookup-component-config.spec.ts
 create mode 100644 packages/core/lib/lookup-component-config.ts
```

- [ ] **Step 7: 寫渲染路徑的失敗測試**

同一份資料分別交給 client 的 `<Render>`（`components/Render`，經由 `DropZone` 的 render 模式與 `SlotRender`）與 `ServerRender`（RSC 入口用的那個），以 `renderToString` 輸出。資料在根層、slot 內、legacy DropZone 內各放三個 type 為 `constructor`、`__proto__`、`toString` 的元件。

在 Task 4 的結果上，`components/Render/__tests__/` 目錄還不存在（Task 6 可能已建立）。先確保目錄存在（已存在時這個指令不做任何事、也不輸出）：

```bash
mkdir -p /Users/kaellim/Desktop/projects/puck/packages/core/components/Render/__tests__
```

再建立 `packages/core/components/Render/__tests__/prototype-types.spec.tsx`，完整內容：

```tsx
import { renderToString } from "react-dom/server.node";
import { Config, Data } from "../../../types";

// @dnd-kit/dom (imported through DropZone) needs ResizeObserver at import time
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(global as any).ResizeObserver = ResizeObserver;

import { Render as ClientRender } from "../index";
import { Render as ServerRender } from "../../ServerRender";

const config: Config = {
  components: {
    Heading: {
      fields: { title: { type: "text" } },
      render: ({ title }) => <h2>{title}</h2>,
    },
    Section: {
      fields: { items: { type: "slot" } },
      render: ({ items: Items, puck }) => (
        <section>
          <Items />
          {puck.renderDropZone({ zone: "legacy" })}
        </section>
      ),
    },
  },
};

const prototypeTypes = ["constructor", "__proto__", "toString"];

const badItems = (prefix: string) =>
  prototypeTypes.map((type, i) => ({
    type,
    props: { id: `${prefix}-${i}`, title: "Should not render" },
  }));

const data: Data = {
  root: { props: {} },
  content: [
    { type: "Heading", props: { id: "heading-1", title: "Before" } },
    ...badItems("content"),
    {
      type: "Section",
      props: {
        id: "section-1",
        items: [
          ...badItems("slot"),
          { type: "Heading", props: { id: "heading-2", title: "In slot" } },
        ],
      },
    },
    { type: "Heading", props: { id: "heading-3", title: "After" } },
  ],
  zones: {
    "section-1:legacy": [
      ...badItems("zone"),
      { type: "Heading", props: { id: "heading-4", title: "In zone" } },
    ],
  },
};

describe.each([
  ["client", ClientRender],
  ["server", ServerRender],
])(
  "%s <Render> with component types named after Object.prototype members",
  (_, Render) => {
    it("skips those components and renders the rest", () => {
      const html = renderToString(<Render config={config} data={data} />);

      expect(html).toContain("<h2>Before</h2>");
      expect(html).toContain("<h2>In slot</h2>");
      expect(html).toContain("<h2>In zone</h2>");
      expect(html).toContain("<h2>After</h2>");
      expect(html).not.toContain("Should not render");
    });
  }
);
```

`ResizeObserver` 的 stub 必須寫在 import `../index` 之前（`@dnd-kit/dom` 在 import 時就會用到），這與 `components/Puck/__tests__/*` 的既有寫法相同；ts-jest 輸出 CommonJS 時保留 import 的先後順序。

- [ ] **Step 8: 執行，確認失敗**

```bash
cd /Users/kaellim/Desktop/projects/puck/packages/core
pnpm test components/Render/__tests__/prototype-types.spec.tsx
```

預期（指令以非 0 結束）：

```
FAIL components/Render/__tests__/prototype-types.spec.tsx
  client <Render> with component types named after Object.prototype members
    ✕ skips those components and renders the rest (9 ms)
  server <Render> with component types named after Object.prototype members
    ✕ skips those components and renders the rest (1 ms)

  ● client <Render> with component types named after Object.prototype members › skips those components and renders the rest

    Element type is invalid: expected a string (for built-in components) or a class/function (for composite components) but got: undefined. You likely forgot to export your component from the file it's defined in, or you might have mixed up default and named imports.

  ● server <Render> with component types named after Object.prototype members › skips those components and renders the rest

    Element type is invalid: expected a string (for built-in components) or a class/function (for composite components) but got: undefined. You likely forgot to export your component from the file it's defined in, or you might have mixed up default and named imports.

Test Suites: 1 failed, 1 total
Tests:       2 failed, 2 total
```

兩個測試都必須是因為渲染原型成員而拋錯；若 Task 6 改過渲染路徑而使錯誤訊息文字不同，只要兩個都失敗、且堆疊指向 `renderToString` 即可。

- [ ] **Step 9: 修改 `ServerRender`**

編輯 `packages/core/components/ServerRender/index.tsx`。

(a) 新增 import。原始片段：

```tsx
import { setupZone } from "../../lib/data/setup-zone";
```

替換為：

```tsx
import { setupZone } from "../../lib/data/setup-zone";
import { lookupComponentConfig } from "../../lib/lookup-component-config";
```

(b) `DropZoneRenderItem` 開頭（整個檔案只有這一處）。原始片段：

```tsx
  const Component = config.components[item.type];
```

替換為：

```tsx
  const Component = lookupComponentConfig(config, item.type);
```

既有的 `Component?.fields` 與 `if (!Component) { return null; }` 會處理找不到的情況，不需要再改。

- [ ] **Step 10: 修改 `SlotRender/server.tsx`**

編輯 `packages/core/components/SlotRender/server.tsx`。

(a) 新增 import。原始片段：

```tsx
import { forwardRef } from "react";
```

替換為：

```tsx
import { forwardRef } from "react";
import { lookupComponentConfig } from "../../lib/lookup-component-config";
```

(b) `Item` 開頭。原始片段：

```tsx
  const Component = config.components[item.type];
```

替換為：

```tsx
  // SlotRender only renders an Item once its type has a config
  const Component = lookupComponentConfig(config, item.type)!;
```

(c) `SlotRender` 的迴圈。原始片段：

```tsx
          if (!config.components[item.type]) {
```

替換為：

```tsx
          if (!lookupComponentConfig(config, item.type)) {
```

`Item` 只在 (c) 的檢查通過後才會被渲染，兩處用的是同一個查找，所以 (b) 的非空斷言成立，`Item` 裡其餘使用 `Component` 的程式碼不必改。

- [ ] **Step 11: 修改 `DropZone` 的 render 模式**

編輯 `packages/core/components/DropZone/index.tsx`（本步驟 3 處；編輯模式的第 4 處在 Step 18）。

(a) 新增 import。原始片段：

```tsx
import { setupZone } from "../../lib/data/setup-zone";
```

替換為：

```tsx
import { setupZone } from "../../lib/data/setup-zone";
import { lookupComponentConfig } from "../../lib/lookup-component-config";
```

(b) `DropZoneRenderItem` 開頭。原始片段：

```tsx
  const Component = config.components[item.type];

  const props = useSlots(config, item, (slotProps) => (
```

替換為：

```tsx
  // DropZoneRender only renders this item once its type has a config
  const Component = lookupComponentConfig(config, item.type)!;

  const props = useSlots(config, item, (slotProps) => (
```

(c) `DropZoneRender` 的迴圈。原始片段：

```tsx
          const Component = config.components[item.type];
          if (Component) {
```

替換為：

```tsx
          const Component = lookupComponentConfig(config, item.type);
          if (Component) {
```

- [ ] **Step 12: 執行，確認通過並做型別檢查**

```bash
cd /Users/kaellim/Desktop/projects/puck/packages/core
pnpm exec prettier --check components/ServerRender/index.tsx components/SlotRender/server.tsx components/DropZone/index.tsx components/Render/__tests__/prototype-types.spec.tsx
pnpm test components/Render/__tests__/prototype-types.spec.tsx
pnpm test components/Render components/ServerRender components/SlotRender
pnpm typecheck
```

`prettier --check` 預期 `All matched files use Prettier code style!`。第一個 `pnpm test` 預期：

```
PASS components/Render/__tests__/prototype-types.spec.tsx
  client <Render> with component types named after Object.prototype members
    ✓ skips those components and renders the rest (5 ms)
  server <Render> with component types named after Object.prototype members
    ✓ skips those components and renders the rest (2 ms)

Test Suites: 1 passed, 1 total
Tests:       2 passed, 2 total
```

第二個 `pnpm test` 預期每個 suite 都是 `PASS`、0 個 failed（在 Task 4 的結果上是 2 個 suite、4 個測試；Task 6 在這些資料夾加的測試會讓數字更多）。`pnpm typecheck` 預期沒有 `error TS`。

- [ ] **Step 13: Commit**

```bash
cd /Users/kaellim/Desktop/projects/puck
git add packages/core/components/ServerRender/index.tsx packages/core/components/SlotRender/server.tsx packages/core/components/DropZone/index.tsx packages/core/components/Render/__tests__/prototype-types.spec.tsx
git status --short
git commit -m "fix: skip component types named after Object.prototype members when rendering"
```

`git status --short` 預期：

```
M  packages/core/components/DropZone/index.tsx
A  packages/core/components/Render/__tests__/prototype-types.spec.tsx
M  packages/core/components/ServerRender/index.tsx
M  packages/core/components/SlotRender/server.tsx
?? CLAUDE.md
```

`git commit` 預期（hash 會不同）：

```
[tzuchi/main <hash>] fix: skip component types named after Object.prototype members when rendering
 4 files changed, 92 insertions(+), 5 deletions(-)
 create mode 100644 packages/core/components/Render/__tests__/prototype-types.spec.tsx
```

- [ ] **Step 14: 寫編輯器的失敗測試**

第一個測試載入 id 為 `__proto__`、`constructor`（帶 slot）、`toString`（在 slot 內）的元件，檢查畫面、`state.indexes.nodes` 與選取；第二個測試載入 type 為原型成員名稱的元件，檢查「No configuration」提示與 `getComponentConfig`。建立 `packages/core/components/Puck/__tests__/prototype-ids.spec.tsx`，完整內容：

```tsx
import { act, cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Config, Data } from "../../../types";

jest.mock("../styles.module.css");

jest.mock("@dnd-kit/react", () => {
  const original = jest.requireActual("@dnd-kit/react");
  return {
    ...original,
    DragDropProvider: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ),
    useDroppable: () => ({
      ref: () => undefined,
      setNodeRef: () => undefined,
      isOver: false,
    }),
    useDraggable: () => ({
      attributes: {},
      listeners: {},
      setNodeRef: () => undefined,
      isDragging: false,
    }),
  };
});

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }),
});

// jsdom has no layout, so selecting a component logs a NaN overlay position
const originalConsoleError = console.error;
jest.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
  if (args.some((arg) => String(arg).includes("is an invalid value for the"))) {
    return;
  }

  originalConsoleError(...(args as Parameters<typeof console.error>));
});

class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(global as any).ResizeObserver = ResizeObserver;

import { Puck } from "../index";
import { AppStoreApi } from "../../../store";

const getAppStore = () =>
  (window as any).__PUCK_INTERNAL_DO_NOT_USE.appStore as AppStoreApi;

const flush = () => act(async () => {});

const config: Config = {
  components: {
    Card: {
      fields: { title: { type: "text" } },
      render: ({ title }) => <p>{title}</p>,
    },
    Section: {
      fields: { items: { type: "slot" } },
      render: ({ items: Items }) => <Items />,
    },
  },
};

const data: Data = {
  root: { props: {} },
  content: [
    { type: "Card", props: { id: "__proto__", title: "Proto card" } },
    {
      type: "Section",
      props: {
        id: "constructor",
        items: [
          { type: "Card", props: { id: "toString", title: "Slot card" } },
        ],
      },
    },
  ],
};

describe("Puck with ids and types named after Object.prototype members", () => {
  afterEach(() => {
    cleanup();
  });

  it("loads, indexes and selects those components", async () => {
    render(<Puck config={config} data={data} iframe={{ enabled: false }} />);

    await flush();

    expect(screen.getByText("Proto card")).toBeInTheDocument();
    expect(screen.getByText("Slot card")).toBeInTheDocument();

    const appStore = getAppStore();
    const { nodes } = appStore.getState().state.indexes;

    for (const id of ["__proto__", "constructor", "toString"]) {
      expect(Object.prototype.hasOwnProperty.call(nodes, id)).toBe(true);
      expect(nodes[id].data.props.id).toBe(id);
    }

    act(() => {
      appStore.getState().dispatch({
        type: "setUi",
        ui: { itemSelector: { index: 0, zone: "root:default-zone" } },
      });
    });

    expect(appStore.getState().selectedItem?.props.id).toBe("__proto__");

    act(() => {
      appStore.getState().dispatch({
        type: "setUi",
        ui: { itemSelector: { index: 0, zone: "constructor:items" } },
      });
    });

    expect(appStore.getState().selectedItem?.props.id).toBe("toString");

    await flush();

    expect(({} as Record<string, unknown>).data).toBeUndefined();
    expect(({} as Record<string, unknown>).flatData).toBeUndefined();
  });

  it("shows the no-configuration placeholder for those component types", async () => {
    const dataWithTypes: Data = {
      root: { props: {} },
      content: ["constructor", "__proto__", "toString"].map((type, i) => ({
        type,
        props: { id: `item-${i}` },
      })),
    };

    render(
      <Puck config={config} data={dataWithTypes} iframe={{ enabled: false }} />
    );

    await flush();

    expect(
      screen.getByText("No configuration for constructor")
    ).toBeInTheDocument();
    expect(
      screen.getByText("No configuration for __proto__")
    ).toBeInTheDocument();
    expect(
      screen.getByText("No configuration for toString")
    ).toBeInTheDocument();

    const appStore = getAppStore();

    expect(appStore.getState().getComponentConfig("Card")).toBe(
      config.components.Card
    );

    for (const type of ["constructor", "__proto__", "toString"]) {
      expect(appStore.getState().getComponentConfig(type)).toBeUndefined();
    }

    act(() => {
      appStore.getState().dispatch({
        type: "setUi",
        ui: { itemSelector: { index: 0, zone: "root:default-zone" } },
      });
    });

    await flush();

    expect(appStore.getState().selectedItem?.type).toBe("constructor");
    expect(appStore.getState().getComponentConfig()).toBeUndefined();
  });
});
```

`console.error` 的過濾只擋掉 jsdom 沒有版面、選取框位置算出 `NaN` 的警告（`` `NaN` is an invalid value for the `top` css style property. ``）。這個警告與本 task 無關：把測試中的 id 換成一般字串也一樣會出現。

- [ ] **Step 15: 執行，確認失敗**

```bash
cd /Users/kaellim/Desktop/projects/puck/packages/core
pnpm test components/Puck/__tests__/prototype-ids.spec.tsx
```

預期（指令以非 0 結束）：

```
FAIL components/Puck/__tests__/prototype-ids.spec.tsx
  Puck with ids and types named after Object.prototype members
    ✕ loads, indexes and selects those components (70 ms)
    ✕ shows the no-configuration placeholder for those component types (67 ms)

  ● Puck with ids and types named after Object.prototype members › loads, indexes and selects those components

    TypeError: result[parentId].push is not a function

    > 16 |     result[parentId].push(zone);

  ● Puck with ids and types named after Object.prototype members › shows the no-configuration placeholder for those component types

    Element type is invalid: expected a string (for built-in components) or a class/function (for composite components) but got: undefined. You likely forgot to export your component from the file it's defined in, or you might have mixed up default and named imports.

    Check the render method of `RenderComponent`.

Test Suites: 1 failed, 1 total
Tests:       2 failed, 2 total
```

第一個失敗發生在圖層面板（`build-layer-tree.ts` 的 `getZonesByParent`，`result["constructor"]` 是 `Object` 函式，Step 17 修）。只修這一處時，會改在同檔的 `nodes["__proto__"]` 讀到 `Object.prototype`，拋出 `Cannot read properties of undefined (reading 'type')`，因為 `__proto__` 節點不在索引裡（Step 16 修）。第二個失敗是編輯模式的 `DropZone` 把 `Object` 當成元件設定（Step 18 修）。

- [ ] **Step 16: `walkAppState` 改用 null-prototype 索引**

編輯 `packages/core/lib/data/walk-app-state.ts`，共 3 處。

(a) 在函式之前加上 `createIndex`。原始片段：

```ts
import { toComponent } from "./to-component";

/**
 * Walk the Puck state, generate indexes and make modifications to nodes.
```

替換為：

```ts
import { toComponent } from "./to-component";

/**
 * Indexes are keyed by component ids and zone compounds from user data. A
 * null-prototype object keeps ids such as "__proto__" or "constructor" as
 * own keys, and a missing id never resolves to an Object.prototype member.
 * Object.assign is safe here because a null-prototype target has no
 * __proto__ setter. Spreading into {} is not: compiled for ES2015, as
 * ts-jest does for this package, it becomes Object.assign onto {}.
 */
const createIndex = <T extends object>(...sources: T[]): T =>
  Object.assign(Object.create(null), ...sources);

/**
 * Walk the Puck state, generate indexes and make modifications to nodes.
```

(b) 原始片段：

```ts
  const newZoneIndex: ZoneIndex = {};
  const newNodeIndex: NodeIndex = {};
```

替換為：

```ts
  const newZoneIndex: ZoneIndex = createIndex();
  const newNodeIndex: NodeIndex = createIndex();
```

(c) 回傳值的索引合併。原始片段：

```ts
      nodes: { ...state.indexes.nodes, ...newNodeIndex },
      zones: { ...state.indexes.zones, ...newZoneIndex },
```

替換為：

```ts
      nodes: createIndex(state.indexes.nodes, newNodeIndex),
      zones: createIndex(state.indexes.zones, newZoneIndex),
```

合併順序不變（後者覆蓋前者），只是結果改為 null-prototype 物件。

- [ ] **Step 17: 圖層樹的累加器改為 null-prototype**

編輯 `packages/core/components/LayerTree/lib/build-layer-tree.ts`。原始片段：

```ts
  const result: Record<string, string[]> = {};
```

替換為：

```ts
  // Null prototype: a parent id such as "constructor" must not find
  // Object.prototype members (see createIndex in walk-app-state.ts)
  const result: Record<string, string[]> = Object.create(null);
```

同檔 `buildLayerNode` 的 `zonesByParent[itemId] || []` 讀的就是這個物件，所以 id 為 `toString` 等、沒有子 zone 的元件也一併修好。

- [ ] **Step 18: `DropZone` 編輯模式改用 `lookupComponentConfig`**

編輯 `packages/core/components/DropZone/index.tsx`（Step 11 已加過 import）。原始片段：

```tsx
  const componentConfig = useAppStore((s) =>
    item?.type ? s.config.components[item.type] : null
  );
```

替換為：

```tsx
  const componentConfig = useAppStore((s) =>
    lookupComponentConfig(s.config, item?.type)
  );
```

找不到時回傳 `undefined`（原本是 `null`）；後續只用 `componentConfig ? … : …` 與 `componentConfig?.xxx`，行為相同，會顯示 `canvas-noconfig` 的 "No configuration for {type}"。

- [ ] **Step 19: store 的 `getComponentConfig` 改用 `lookupComponentConfig`**

編輯 `packages/core/store/index.ts`。

(a) 新增 import。原始片段：

```ts
import { getItem } from "../lib/data/get-item";
```

替換為：

```ts
import { getItem } from "../lib/data/get-item";
import { lookupComponentConfig } from "../lib/lookup-component-config";
```

(b) 原始片段：

```ts
          ? config.components[type]
          : selectedItem
          ? config.components[selectedItem.type]
```

替換為：

```ts
          ? lookupComponentConfig(config, type)
          : selectedItem
          ? lookupComponentConfig(config, selectedItem.type)
```

- [ ] **Step 20: permissions slice 改用 `lookupComponentConfig`**

編輯 `packages/core/store/slices/permissions.ts`，共 4 處。

(a) 新增 import。原始片段：

```ts
import { flattenData } from "../../lib/data/flatten-data";
```

替換為：

```ts
import { flattenData } from "../../lib/data/flatten-data";
import { lookupComponentConfig } from "../../lib/lookup-component-config";
```

(b) `resolvePermissionsForItem` 內。原始片段：

```ts
        item.type === "root" ? config.root : config.components[item.type];
```

替換為：

```ts
        item.type === "root"
          ? config.root
          : lookupComponentConfig(config, item.type);
```

(c) `getPermissions` 的 `item` 分支。原始片段：

```ts
        const componentConfig = config.components[item.type];
```

替換為：

```ts
        const componentConfig = lookupComponentConfig(config, item.type);
```

(d) `getPermissions` 的 `type` 分支。原始片段：

```ts
        const componentConfig = config.components[type];
```

替換為：

```ts
        const componentConfig = lookupComponentConfig(config, type);
```

- [ ] **Step 21: `insert` action 改用 `lookupComponentConfig`**

編輯 `packages/core/reducer/actions/insert.ts`。

(a) 新增 import。原始片段：

```ts
import { populateIds } from "../../lib/data/populate-ids";
```

替換為：

```ts
import { populateIds } from "../../lib/data/populate-ids";
import { lookupComponentConfig } from "../../lib/lookup-component-config";
```

(b) 原始片段：

```ts
        ...(appStore.config.components[action.componentType].defaultProps ||
          {}),
```

替換為：

```ts
        ...(lookupComponentConfig(appStore.config, action.componentType)
          ?.defaultProps || {}),
```

- [ ] **Step 22: `getSlotField`、field transforms、`resolveComponentData` 改用 `lookupComponentConfig`**

(a) 編輯 `packages/core/lib/data/get-slot-field.ts`。import 原始片段：

```ts
import { getFieldByPath } from "./get-field-by-path";
```

替換為：

```ts
import { getFieldByPath } from "./get-field-by-path";
import { lookupComponentConfig } from "../lookup-component-config";
```

讀取點原始片段：

```ts
      ? config.components[componentType]
```

替換為：

```ts
      ? lookupComponentConfig(config, componentType)
```

(b) 編輯 `packages/core/lib/field-transforms/use-field-transforms-tracked.tsx`。import 原始片段：

```tsx
import { buildMappers } from "./build-mappers";
```

替換為：

```tsx
import { buildMappers } from "./build-mappers";
import { lookupComponentConfig } from "../lookup-component-config";
```

讀取點原始片段：

```tsx
      item.type === "root" ? config.root : config.components?.[item.type];
```

替換為：

```tsx
      item.type === "root"
        ? config.root
        : lookupComponentConfig(config, item.type);
```

(c) 編輯 `packages/core/lib/resolve-component-data.ts`。import 原始片段：

```ts
import { getChanged } from "./get-changed";
```

替換為：

```ts
import { getChanged } from "./get-changed";
import { lookupComponentConfig } from "./lookup-component-config";
```

讀取點原始片段：

```ts
      ? config.components[item.type]
```

替換為：

```ts
      ? lookupComponentConfig(config, item.type)
```

- [ ] **Step 23: `mapFields` 改用 `lookupComponentConfig`**

編輯 `packages/core/lib/data/map-fields.ts`（`flatten` 已在 Task 10 改過，這裡不動），共 3 處。

(a) import。原始片段：

```ts
import { defaultSlots } from "./default-slots";
```

替換為：

```ts
import { defaultSlots } from "./default-slots";
import { lookupComponentConfig } from "../lookup-component-config";
```

(b) `walkField` 的 slot 分支。原始片段：

```ts
          if (!config.components[el.type]) {
```

替換為：

```ts
          if (!lookupComponentConfig(config, el.type)) {
```

(c) `mapFields` 本體。原始片段：

```ts
    itemType === "root" ? config.root : config.components?.[itemType];
```

替換為：

```ts
    itemType === "root" ? config.root : lookupComponentConfig(config, itemType);
```

- [ ] **Step 24: 執行，確認通過並做型別檢查**

```bash
cd /Users/kaellim/Desktop/projects/puck/packages/core
pnpm exec prettier --check lib/data/walk-app-state.ts components/LayerTree/lib/build-layer-tree.ts components/DropZone/index.tsx store/index.ts store/slices/permissions.ts reducer/actions/insert.ts lib/data/get-slot-field.ts lib/field-transforms/use-field-transforms-tracked.tsx lib/resolve-component-data.ts lib/data/map-fields.ts components/Puck/__tests__/prototype-ids.spec.tsx
pnpm test components/Puck/__tests__/prototype-ids.spec.tsx
pnpm test components/Puck lib/data store reducer components/LayerTree lib/field-transforms lib/__tests__/resolve-component-data.spec.tsx
pnpm typecheck
```

`prettier --check` 預期 `All matched files use Prettier code style!`。第一個 `pnpm test` 預期（沒有任何 `console.error` 輸出）：

```
PASS components/Puck/__tests__/prototype-ids.spec.tsx
  Puck with ids and types named after Object.prototype members
    ✓ loads, indexes and selects those components (105 ms)
    ✓ shows the no-configuration placeholder for those component types (42 ms)

Test Suites: 1 passed, 1 total
Tests:       2 passed, 2 total
```

第二個 `pnpm test` 預期每個 suite 都是 `PASS`、0 個 failed，既有的 snapshot 全部 passed（null-prototype 索引在 snapshot 中同樣印成 `{`）。在 Task 4 加 Task 10 的結果上驗證時，摘要是：

```
Test Suites: 34 passed, 34 total
Tests:       200 passed, 200 total
Snapshots:   14 passed, 14 total
```

（Task 5–9 在這些資料夾加的測試會讓數字更多。）`pnpm typecheck` 預期沒有 `error TS`。

- [ ] **Step 25: Commit**

```bash
cd /Users/kaellim/Desktop/projects/puck
git add packages/core/components/Puck/__tests__/prototype-ids.spec.tsx packages/core/lib/data/walk-app-state.ts packages/core/components/LayerTree/lib/build-layer-tree.ts packages/core/components/DropZone/index.tsx packages/core/store/index.ts packages/core/store/slices/permissions.ts packages/core/reducer/actions/insert.ts packages/core/lib/data/get-slot-field.ts packages/core/lib/field-transforms/use-field-transforms-tracked.tsx packages/core/lib/resolve-component-data.ts packages/core/lib/data/map-fields.ts
git status --short
git commit -m "fix: support component ids and types named after Object.prototype members in the editor"
```

`git status --short` 預期：

```
M  packages/core/components/DropZone/index.tsx
M  packages/core/components/LayerTree/lib/build-layer-tree.ts
A  packages/core/components/Puck/__tests__/prototype-ids.spec.tsx
M  packages/core/lib/data/get-slot-field.ts
M  packages/core/lib/data/map-fields.ts
M  packages/core/lib/data/walk-app-state.ts
M  packages/core/lib/field-transforms/use-field-transforms-tracked.tsx
M  packages/core/lib/resolve-component-data.ts
M  packages/core/reducer/actions/insert.ts
M  packages/core/store/index.ts
M  packages/core/store/slices/permissions.ts
?? CLAUDE.md
```

`git commit` 預期（hash 會不同）：

```
[tzuchi/main <hash>] fix: support component ids and types named after Object.prototype members in the editor
 11 files changed, 230 insertions(+), 18 deletions(-)
 create mode 100644 packages/core/components/Puck/__tests__/prototype-ids.spec.tsx
```

- [ ] **Step 26: 寫 `groupZonesByComponent`／`resolveAllData`／`migrate`／`transformProps` 的失敗測試**

第一個 `describe` 測 id：zone compound 的 parent 為 `__proto__`、`constructor`，另有 id 為 `toString` 與 `type` 的元件（`type` 用來抓 `migrate` 的 `updatedItems` 在原型被換掉後讀到錯誤值）。第二個 `describe` 測 type：`migrate` 的 `migrateDynamicZonesForComponent` 與 `transformProps` 的 `propTransforms` 都以元件 type 查使用者提供的物件，type 為 `constructor`、`toString`、`__proto__` 時不得取到 `Object.prototype` 的成員。建立 `packages/core/lib/__tests__/prototype-zone-ids.spec.tsx`，完整內容：

```tsx
import { Config, Data } from "../../types";
import { groupZonesByComponent } from "../group-zones-by-component";
import { migrate } from "../migrate";
import { resolveAllData } from "../resolve-all-data";
import { transformProps } from "../transform-props";

jest.spyOn(console, "log").mockImplementation(() => {});

const config: Config = {
  components: {
    Section: {
      fields: { content: { type: "slot" } },
      render: () => <div />,
    },
    Columns: {
      fields: {
        columns: {
          type: "array",
          arrayFields: { items: { type: "slot" } },
        },
      },
      render: () => <div />,
    },
    Card: {
      render: () => <div />,
    },
  },
};

const card = (id: string) => ({ type: "Card", props: { id } });

describe("component ids named after Object.prototype members", () => {
  it("groupZonesByComponent groups zones whose parent is __proto__ or constructor", () => {
    const data: Data = {
      root: { props: {} },
      content: [],
      zones: {
        "__proto__:content": [card("card-1")],
        "constructor:content": [card("card-2")],
      },
    };

    const grouped = groupZonesByComponent(data);

    expect(Object.keys(grouped)).toEqual(["__proto__", "constructor"]);
    expect(grouped["__proto__"]).toEqual([
      { zoneCompound: "__proto__:content", content: [card("card-1")] },
    ]);
    expect(grouped["toString"]).toBeUndefined();
  });

  it("resolveAllData resolves components with those ids", async () => {
    const data: Data = {
      root: { props: {} },
      content: [
        { type: "Section", props: { id: "__proto__" } },
        card("toString"),
      ],
      zones: { "__proto__:content": [card("card-1")] },
    };

    const resolved = await resolveAllData(data, config);

    expect(resolved.content.map((item) => item.props.id)).toEqual([
      "__proto__",
      "toString",
    ]);
    expect(resolved.zones?.["__proto__:content"]).toEqual([card("card-1")]);
  });

  it("migrate moves a DropZone under __proto__ into its slot", () => {
    const data: Data = {
      root: { props: {} },
      content: [{ type: "Section", props: { id: "__proto__" } }, card("type")],
      zones: { "__proto__:content": [card("card-1")] },
    };

    const migrated = migrate(data, config);

    expect(migrated.content).toEqual([
      {
        type: "Section",
        props: { id: "__proto__", content: [card("card-1")] },
      },
      card("type"),
    ]);
    expect(migrated.zones).toBeUndefined();
  });

  it("migrate moves dynamic zones under __proto__ without touching Object.prototype", () => {
    const data: Data = {
      root: { props: {} },
      content: [{ type: "Columns", props: { id: "__proto__" } }],
      zones: {
        "__proto__:column-0": [card("card-1")],
        "__proto__:column-1": [card("card-2")],
      },
    };

    const migrated = migrate(data, config, {
      migrateDynamicZonesForComponent: {
        Columns: (props, zones) => ({
          ...props,
          columns: Object.values(zones).map((items) => ({ items })),
        }),
      },
    });

    expect(migrated.content[0].props.columns).toEqual([
      { items: [card("card-1")] },
      { items: [card("card-2")] },
    ]);
    expect(migrated.zones).toBeUndefined();
    expect(({} as Record<string, unknown>)["column-0"]).toBeUndefined();
  });
});

describe("component types named after Object.prototype members", () => {
  it.each(["constructor", "toString", "__proto__"])(
    "migrate does not call the inherited member %s of migrateDynamicZonesForComponent",
    (type) => {
      const data: Data = {
        root: { props: {} },
        content: [{ type, props: { id: "x" } }],
        zones: { "x:column-0": [card("card-1")] },
      };

      expect(() =>
        migrate(data, config, {
          migrateDynamicZonesForComponent: {
            Columns: (props, zones) => ({ ...props, zones }),
          },
        })
      ).toThrow('Could not migrate DropZone "x:column-0" to slot field');
    }
  );

  it.each(["constructor", "toString", "__proto__"])(
    "transformProps leaves a component of type %s unchanged",
    (type) => {
      const result = transformProps(
        { root: { props: {} }, content: [{ type, props: { id: "x" } }] },
        { Card: (props: any) => props }
      );

      expect(result.content).toEqual([{ type, props: { id: "x" } }]);
    }
  );
});
```

- [ ] **Step 27: 執行，確認失敗**

```bash
cd /Users/kaellim/Desktop/projects/puck/packages/core
pnpm test lib/__tests__/prototype-zone-ids.spec.tsx
```

預期（指令以非 0 結束）：

```
FAIL lib/__tests__/prototype-zone-ids.spec.tsx
  component ids named after Object.prototype members
    ✕ groupZonesByComponent groups zones whose parent is __proto__ or constructor
    ✕ resolveAllData resolves components with those ids
    ✕ migrate moves a DropZone under __proto__ into its slot (1 ms)
    ✕ migrate moves dynamic zones under __proto__ without touching Object.prototype
  component types named after Object.prototype members
    ✕ migrate does not call the inherited member constructor of migrateDynamicZonesForComponent (1 ms)
    ✕ migrate does not call the inherited member toString of migrateDynamicZonesForComponent (1 ms)
    ✕ migrate does not call the inherited member __proto__ of migrateDynamicZonesForComponent (7 ms)
    ✓ transformProps leaves a component of type constructor unchanged
    ✕ transformProps leaves a component of type toString unchanged (2 ms)
    ✕ transformProps leaves a component of type __proto__ unchanged

  ● component ids named after Object.prototype members › groupZonesByComponent groups zones whose parent is __proto__ or constructor

    TypeError: acc[componentId].push is not a function

  ● component ids named after Object.prototype members › resolveAllData resolves components with those ids

    TypeError: acc[componentId].push is not a function

  ● component ids named after Object.prototype members › migrate moves a DropZone under __proto__ into its slot

    TypeError: Cannot read properties of undefined (reading 'id')

    > 117 |     const id = mappedItem.props.id;

  ● component ids named after Object.prototype members › migrate moves dynamic zones under __proto__ without touching Object.prototype

    TypeError: Cannot read properties of undefined (reading 'id')

    > 117 |     const id = mappedItem.props.id;

  ● component types named after Object.prototype members › migrate does not call the inherited member constructor of migrateDynamicZonesForComponent

    expect(received).toThrow(expected)

    Expected substring: "Could not migrate DropZone \"x:column-0\" to slot field"

    Received function did not throw

  ● component types named after Object.prototype members › migrate does not call the inherited member toString of migrateDynamicZonesForComponent

    expect(received).toThrow(expected)

    Expected substring: "Could not migrate DropZone \"x:column-0\" to slot field"

    Received function did not throw

  ● component types named after Object.prototype members › migrate does not call the inherited member __proto__ of migrateDynamicZonesForComponent

    expect(received).toThrow(expected)

    Expected substring: "Could not migrate DropZone \"x:column-0\" to slot field"
    Received message:   "migrateFn is not a function"

  ● component types named after Object.prototype members › transformProps leaves a component of type toString unchanged

    expect(received).toEqual(expected) // deep equality

    - Expected  -  0
    + Received  + 15

  ● component types named after Object.prototype members › transformProps leaves a component of type __proto__ unchanged

    TypeError: propTransforms[item.type] is not a function

Test Suites: 1 failed, 1 total
Tests:       9 failed, 1 passed, 10 total
```

（上面省略了 jest 印出的程式碼摘錄與 diff 內容，只保留錯誤訊息；`toString` 那一條的 diff 會列出 `"0": "["`、`"1": "o"` … `"14": "]"` 共 15 個多出來的 key。）

各失敗的原因：
- 第 1、2 個：`groupZonesByComponent` 的累加物件 `acc["__proto__"]`／`acc["constructor"]` 讀到繼承來的成員，`.push` 不存在。
- 第 3、4 個：`migrate` 的 `updatedItems[item.props.id] ?? item`。`updatedItems["__proto__"]` 讀到 `Object.prototype`；原型被換成已遷移的元件後，`updatedItems["type"]` 又讀到字串 `"Section"`。交給 `walkAppState` 時這些值沒有 `props`（`> 117` 是 `walk-app-state.ts` 加上 `createIndex` 之後的行號）。只修 `updatedItems` 時，第 4 個測試會改為拋出 `Could not migrate DropZone "__proto__:column-0" to slot field`，同時 `Object.prototype["column-0"]` 被寫入。這是 `unmigratedZonesGrouped` 的問題，Step 28 會一併修。
- 第 5–7 個：`migrateDynamicZonesForComponent?.[child.type]` 取到繼承成員。`constructor` 取到 `Object`，`Object(props)` 被當成遷移結果，zone 被刪掉卻沒有寫進任何 slot，資料遺失且不拋錯。`toString` 讓 props 變成字串。`__proto__` 取到 `Object.prototype`，呼叫時拋錯。修好後這三種 type 都不會有遷移函式，zone 留在 `zones` 裡，最後由既有的檢查拋出 `Could not migrate DropZone "x:column-0" to slot field. …`。
- 第 9、10 個：`transformProps` 的 `propTransforms[item.type]`。`toString` 把 `"[object Object]"` 展開成字元索引；`__proto__` 取到 `Object.prototype`，呼叫時拋錯。
- 第 8 個（`transformProps` 遇到 `constructor`）在舊實作下就會通過：`propTransforms["constructor"]` 是 `Object`，而 `Object(props)` 回傳 props 本身，結果剛好不變。保留這個 case 是為了防止日後退化。

- [ ] **Step 28: 修改 `groupZonesByComponent`、`migrate` 與 `transformProps`**

(a) `packages/core/lib/group-zones-by-component.ts` 的原始內容（整個檔案，逐字）：

```ts
import { getZoneId } from "./get-zone-id";
import { Data, Content } from "../types";

export const groupZonesByComponent = (data: Data) => {
  const zoneEntries = Object.entries(data.zones ?? {});

  return zoneEntries.reduce<
    Record<string, { zoneCompound: string; content: Content }[]>
  >((acc, [zoneCompound, zoneContent]) => {
    const [componentId, zoneName] = getZoneId(zoneCompound);

    if (!componentId.length || !zoneName.length) return acc;

    if (!acc[componentId]) {
      acc[componentId] = [];
    }

    acc[componentId].push({ zoneCompound, content: zoneContent });

    return acc;
  }, {});
};
```

整個檔案替換為：

```ts
import { getZoneId } from "./get-zone-id";
import { Data, Content } from "../types";

export const groupZonesByComponent = (data: Data) => {
  const zoneEntries = Object.entries(data.zones ?? {});

  // Null prototype: a component id such as "__proto__" or "constructor" must
  // not find Object.prototype members
  return zoneEntries.reduce<
    Record<string, { zoneCompound: string; content: Content }[]>
  >((acc, [zoneCompound, zoneContent]) => {
    const [componentId, zoneName] = getZoneId(zoneCompound);

    if (!componentId.length || !zoneName.length) return acc;

    if (!acc[componentId]) {
      acc[componentId] = [];
    }

    acc[componentId].push({ zoneCompound, content: zoneContent });

    return acc;
  }, Object.create(null));
};
```

`resolveAllData` 以 `zonesByComponent[resolvedAsComponent.props.id]` 讀這個結果，所以 id 為 `toString` 等、沒有 zone 的元件也一併修好。

(b) 編輯 `packages/core/lib/migrate.ts`，共 5 處。

import 原始片段：

```ts
import { walkTree } from "./data/walk-tree";
```

替換為：

```ts
import { walkTree } from "./data/walk-tree";
import { lookupComponentConfig } from "./lookup-component-config";
```

`updatedItems` 原始片段：

```ts
    const updatedItems: Record<string, ComponentData> = {};
```

替換為：

```ts
    // Keyed by component id. Null prototype, so an id such as "__proto__" is
    // an own key and other ids never find Object.prototype members.
    const updatedItems: Record<string, ComponentData> = Object.create(null);
```

讀取點原始片段：

```ts
          id === "root" ? config.root : config.components[componentType];
```

替換為：

```ts
          id === "root"
            ? config.root
            : lookupComponentConfig(config, componentType);
```

`unmigratedZonesGrouped` 原始片段：

```ts
      const unmigratedZonesGrouped: Record<
        string,
        Record<string, Content>
      > = {};
```

替換為：

```ts
      // Keyed by component id, so null prototype as for updatedItems
      const unmigratedZonesGrouped: Record<
        string,
        Record<string, Content>
      > = Object.create(null);
```

內層的 `unmigratedZonesGrouped[componentId] = {};` 保持一般物件：它會原封不動傳給使用者的 `migrateDynamicZonesForComponent` callback，不改變 callback 收到的物件型態。

`migrateFn` 的查找原始片段：

```ts
            const migrateFn =
              migrationOptions?.migrateDynamicZonesForComponent?.[child.type];
```

替換為：

```ts
            // Own keys only: a type such as "constructor" must not call an
            // Object.prototype member
            const migrateFns =
              migrationOptions?.migrateDynamicZonesForComponent;
            const migrateFn =
              migrateFns &&
              Object.prototype.hasOwnProperty.call(migrateFns, child.type)
                ? migrateFns[child.type]
                : undefined;
```

`migrateFns &&` 不能省略：這段程式碼位於 `if (migrationOptions?.migrateDynamicZonesForComponent)` 之內，但它在 `walkTree` 的 callback 裡，TypeScript 不會把外層的窄化帶進 callback，少了這個檢查 `pnpm typecheck` 會報 `error TS18048: 'migrateFns' is possibly 'undefined'.`。之後的 `if (!migrateFn) { return child; }` 不變。

(c) 編輯 `packages/core/lib/transform-props.ts`。`mapItem` 的原始片段：

```ts
  const mapItem = (item: any) => {
    if (propTransforms[item.type]) {
      return {
        ...item,
        props: {
          id: item.props.id,
          ...propTransforms[item.type]!(item.props as any),
        },
      };
    }
```

替換為：

```ts
  const mapItem = (item: any) => {
    // Own keys only: a type such as "__proto__" or "toString" must not call an
    // Object.prototype member
    const transform = Object.prototype.hasOwnProperty.call(
      propTransforms,
      item.type
    )
      ? propTransforms[item.type]
      : undefined;

    if (transform) {
      return {
        ...item,
        props: {
          id: item.props.id,
          ...transform(item.props as any),
        },
      };
    }
```

同一檔案後面的 `propTransforms["root"]` 是固定的 key，不是來自資料，保持不變。

- [ ] **Step 29: 執行，確認通過並做型別檢查**

```bash
cd /Users/kaellim/Desktop/projects/puck/packages/core
pnpm exec prettier --check lib/group-zones-by-component.ts lib/migrate.ts lib/transform-props.ts lib/__tests__/prototype-zone-ids.spec.tsx
pnpm test lib/__tests__/prototype-zone-ids.spec.tsx
pnpm test lib/__tests__
pnpm typecheck
```

`prettier --check` 預期 `All matched files use Prettier code style!`。第一個 `pnpm test` 預期：

```
PASS lib/__tests__/prototype-zone-ids.spec.tsx
  component ids named after Object.prototype members
    ✓ groupZonesByComponent groups zones whose parent is __proto__ or constructor (1 ms)
    ✓ resolveAllData resolves components with those ids (1 ms)
    ✓ migrate moves a DropZone under __proto__ into its slot (1 ms)
    ✓ migrate moves dynamic zones under __proto__ without touching Object.prototype
  component types named after Object.prototype members
    ✓ migrate does not call the inherited member constructor of migrateDynamicZonesForComponent (3 ms)
    ✓ migrate does not call the inherited member toString of migrateDynamicZonesForComponent
    ✓ migrate does not call the inherited member __proto__ of migrateDynamicZonesForComponent (1 ms)
    ✓ transformProps leaves a component of type constructor unchanged
    ✓ transformProps leaves a component of type toString unchanged
    ✓ transformProps leaves a component of type __proto__ unchanged

Test Suites: 1 passed, 1 total
Tests:       10 passed, 10 total
```

`pnpm test lib/__tests__` 也會比對到 `components/LayerTree/lib/__tests__`，預期每個 suite 都是 `PASS`、0 個 failed（既有的 `migrate.spec.tsx` 會照常印出 `console.log` 的 "Migrating DropZones to slots..." 等訊息，屬正常）。既有的 `transform-props.spec.tsx` 也在其中，用來確認 `transformProps` 的既有行為不變。在 Task 4 加 Task 10 的結果上驗證時，摘要是：

```
Test Suites: 16 passed, 16 total
Tests:       90 passed, 90 total
Snapshots:   5 passed, 5 total
```

`pnpm typecheck` 預期沒有 `error TS`。

- [ ] **Step 30: Commit**

```bash
cd /Users/kaellim/Desktop/projects/puck
git add packages/core/lib/group-zones-by-component.ts packages/core/lib/migrate.ts packages/core/lib/transform-props.ts packages/core/lib/__tests__/prototype-zone-ids.spec.tsx
git status --short
git commit -m "fix: handle ids and types named after Object.prototype members in zone grouping, migrate and transformProps"
```

`git status --short` 預期：

```
A  packages/core/lib/__tests__/prototype-zone-ids.spec.tsx
M  packages/core/lib/group-zones-by-component.ts
M  packages/core/lib/migrate.ts
M  packages/core/lib/transform-props.ts
?? CLAUDE.md
```

`git commit` 預期（hash 會不同）：

```
[tzuchi/main <hash>] fix: handle ids and types named after Object.prototype members in zone grouping, migrate and transformProps
 4 files changed, 180 insertions(+), 7 deletions(-)
 create mode 100644 packages/core/lib/__tests__/prototype-zone-ids.spec.tsx
```

- [ ] **Step 31: 確認剩下的直接讀取都不會崩潰**

第一個 grep 找直接讀 `config.components[...]` 的地方，第二個找以資料中元件的 `.type` 查其他物件的地方（例如 `migrateDynamicZonesForComponent`、`propTransforms`）：

```bash
cd /Users/kaellim/Desktop/projects/puck
git grep -nE "components(\?\.)?\[" -- 'packages/core/*.ts' 'packages/core/*.tsx' ':!**/__tests__/**'
echo ---
git grep -nE "\[(item|child|el|node\.data|selectedItem)\.type\]" -- 'packages/core/*.ts' 'packages/core/*.tsx' ':!**/__tests__/**'
```

依序執行完 Task 1–11（含 Task 5–9）時，輸出如下（`---` 之前 10 行、之後 5 行；全域審查以計畫重播驗證）：

```
packages/core/components/ComponentList/index.tsx:102:                    config.components[componentKey]["label"] ?? componentKey
packages/core/components/LayerTree/lib/build-layer-tree.ts:65:  const label = config.components[componentType]?.label ?? componentType;
packages/core/components/Puck/components/Layout/index.tsx:48:      ? s.config.components[s.selectedItem.type]?.["label"] ??
packages/core/lib/lookup-component-config.ts:7: * `config.components[type]` returns inherited members such as
packages/core/lib/lookup-component-config.ts:26:    ? components[type]
packages/core/lib/richtext/migrate-data.ts:64:    ? config.components[item.type]
packages/core/lib/use-breadcrumbs.ts:40:          ? config.components[node.data.type]?.label ?? node.data.type
packages/core/lib/use-component-list.tsx:45:                const componentConf = config.components[componentName] || {};
packages/core/lib/use-component-list.tsx:77:              const componentConf = config.components[componentName] || {};
packages/core/plugins/fields/index.tsx:19:      ? s.config.components[selectedItem.type]?.label ?? selectedItem.type
---
packages/core/lib/migrate.ts:154:                ? migrateFns[child.type]
packages/core/lib/richtext/migrate-data.ts:64:    ? config.components[item.type]
packages/core/lib/transform-props.ts:37:      ? propTransforms[item.type]
packages/core/lib/use-breadcrumbs.ts:40:          ? config.components[node.data.type]?.label ?? node.data.type
packages/core/plugins/fields/index.tsx:19:      ? s.config.components[selectedItem.type]?.label ?? selectedItem.type
```

（只套用 Task 4、10、11、沒有 Task 5–9 時，兩段都少了 `lib/richtext/migrate-data.ts:64` 那一行。）

行號可能因 Task 5–9 的改動而不同。上面這些都刻意保留：
- `ComponentList` 與 `use-component-list` 的 key 來自設定本身（`Object.keys(config.components)` 或 `categories`），不是資料。
- `lib/richtext/migrate-data.ts:64` 是 Task 8 的轉換工具，前一行已用 `hasOwn(config.components, item.type)`（`Object.prototype.hasOwnProperty.call` 的包裝）檢查過，不需要另做 commit。
- `lookup-component-config.ts` 是 helper 本身（第 7 行是註解）。
- `migrate.ts:154` 與 `transform-props.ts:37` 是 Step 28 改過的讀取，前一行已經用 `Object.prototype.hasOwnProperty.call` 檢查過。
- 其餘只讀 `.label`。原型成員上沒有 `label`，所以會退回 type 名稱，不會崩潰。

若輸出多出 Task 5–9 新增的行（例如 `packages/core/lib/richtext/` 下），依下面的規則判斷：
- 只讀 `?.fields`、`?.label` 這類屬性且有預設值的，可以保留（原型成員上沒有這些屬性）。
- 在同一個運算式或前一行已用 `hasOwn(...)`、`Object.prototype.hasOwnProperty.call(...)` 確認是自有 key 的，可以保留，也可以為了一致改用 `lookupComponentConfig`。例如 Task 5–9 草稿實作的 `packages/core/lib/richtext/migrate-data.ts` 的 `hasOwn(config.components, item.type) ? config.components[item.type] : undefined`，在兩個 grep 中都會出現一行 `? config.components[item.type]`。
- 其他情況，例如會呼叫 `.render`、把結果當陣列或函式使用、或在 `?.` 之外直接讀屬性：如果是 `config.components[x]`，就換成 `lookupComponentConfig(config, x)`，並在該檔加上 `import { lookupComponentConfig } from "<相對路徑>/lookup-component-config";`；如果是其他物件，比照 Step 28 (b) 的 `migrateFn` 寫法，先用 `Object.prototype.hasOwnProperty.call(obj, key)` 檢查。改完後重跑該檔的測試與 `pnpm typecheck`，並在 Step 30 之後另做一個 commit：`git commit -m "fix: look up component configs by own key in <檔名>"`。

- [ ] **Step 32: 在 CHANGELOG 記錄並 commit**

```bash
cd /Users/kaellim/Desktop/projects/puck
grep -c '^## \[0\.23\.0\]' CHANGELOG.md
```

預期輸出 `1`。插入一行：

```bash
perl -0pi -e 's/\n\n## \[0\.23\.0\]/\n* look up component configs, `migrateDynamicZonesForComponent` callbacks and `transformProps` transforms by own key only, and keep the node and zone indexes free of `Object.prototype`, so component types or ids such as `constructor`, `__proto__` or `toString` no longer crash or corrupt data in `<Render>`, the editor, `resolveAllData`, `migrate` or `transformProps`; such types render like any other type without a configuration\n\n## [0.23.0]/' CHANGELOG.md
git diff --numstat CHANGELOG.md
git diff -U0 CHANGELOG.md | grep -E '^[-+][^-+]' | cut -c1-40
grep -n -B1 -A2 '^\* look up component configs' CHANGELOG.md | cut -c1-60
```

在 Task 4 加 Task 10 的結果上，預期輸出如下。在你的環境，行號會不同（Task 5–9 會在清單中加行），而且 `cut -c1-60` 會把行號前綴一起算進 60 個字元，所以行號位數不同時，行尾會多或少一兩個字元：

```
1	0	CHANGELOG.md
+* look up component configs, `migrateDy
19-* build the results of `mapFields`, `walkTree` and `getCh
20:* look up component configs, `migrateDynamicZonesForCompo
21-
22-## [0.23.0](/compare/v0.22.4...v0.23.0) (2026-08-07)
```

新行緊接在 Task 10 那一行之後、空行與 `## [0.23.0]` 之前。Commit：

```bash
git add CHANGELOG.md
git status --short
git commit -m "docs: record the Object.prototype member name fix in the changelog"
```

`git status --short` 預期：

```
M  CHANGELOG.md
?? CLAUDE.md
```

`git commit` 預期（hash 會不同）：

```
[tzuchi/main <hash>] docs: record the Object.prototype member name fix in the changelog
 1 file changed, 1 insertion(+)
```

- [ ] **Step 33: 完整驗證**

```bash
cd /Users/kaellim/Desktop/projects/puck
pnpm verify > "${TMPDIR:-/tmp}/tceditor-verify-task11.log" 2>&1
echo "exit=$?"
grep -E "Test Suites:|Tests:|Snapshots:|ℹ (tests|pass|fail)|> tsc|✖|Tasks:|All matched|^pnpm audit:|^GATED|^audit:gate (passed|FAILED)" "${TMPDIR:-/tmp}/tceditor-verify-task11.log"
grep -c "function lookupComponentConfig" packages/core/dist/index.js packages/core/dist/rsc.js
```

判斷標準：

- `exit=0`。
- `@tzuchi/tceditor:test:` 的 `Test Suites:` 比 Task 10 Step 18 多 4 個、`Tests:` 多 22 個（8＋2＋2＋10），全部 passed；`Snapshots:` 數不變。依序執行完 Task 1–11 時應為 `Test Suites: 75 passed, 75 total`、`Tests:       666 passed, 666 total`、`Snapshots:   19 passed, 19 total`（全域審查以計畫重播驗證）。
- `ℹ fail 0`；`> tsc -p tsconfig.typecheck.json` 之後沒有 `error TS`。
- 兩行 `✖ … problems (0 errors, … warnings)` 的數字與 Task 10 Step 18 相同。
- `All matched files use Prettier code style!`；`check:bundle` 通過；`GATED … 0 finding(s)` 與 `audit:gate passed`。
- 最後的 `grep -c` 輸出 `packages/core/dist/index.js:1` 與 `packages/core/dist/rsc.js:1`：主入口與 RSC 入口的打包結果都包含這個 helper。

在 Task 4 加 Task 10、11 的結果上驗證時（尚無 Task 5–9 與 `check:bundle`），對應輸出是：

```
exit=0
@tzuchi/tceditor:test: Test Suites: 60 passed, 60 total
@tzuchi/tceditor:test: Tests:       312 passed, 312 total
@tzuchi/tceditor:test: Snapshots:   19 passed, 19 total
 Tasks:    1 successful, 1 total
ℹ tests 10
ℹ pass 10
ℹ fail 0
> tsc -p tsconfig.typecheck.json
demo:lint: ✖ 8 problems (0 errors, 8 warnings)
@tzuchi/tceditor:lint: ✖ 4 problems (0 errors, 4 warnings)
 Tasks:    3 successful, 3 total
All matched files use Prettier code style!
 Tasks:    3 successful, 3 total
pnpm audit: 69 advisories, 71 finding path(s). 104 package versions ship with packages/core, packages/plugin-heading-analyzer.
GATED (ships with a published package): 0 finding(s)
audit:gate passed: no advisories affect packages/core, packages/plugin-heading-analyzer (71 finding path(s) elsewhere are listed above).
packages/core/dist/index.js:1
packages/core/dist/rsc.js:1
```

- [ ] **Step 34: 確認 commit 與工作目錄**

```bash
cd /Users/kaellim/Desktop/projects/puck
git log --oneline -6
git status --short
```

預期（hash 會不同；若 Step 31 多了一個 commit，它會出現在 `docs:` 那一行之下，請改用 `git log --oneline -7` 看完整 6 個 commit）：

```
<hash> docs: record the Object.prototype member name fix in the changelog
<hash> fix: handle ids and types named after Object.prototype members in zone grouping, migrate and transformProps
<hash> fix: support component ids and types named after Object.prototype members in the editor
<hash> fix: skip component types named after Object.prototype members when rendering
<hash> refactor: add lookupComponentConfig for own-key component config lookups
<hash> docs: record the one-pass merge fix in the changelog
?? CLAUDE.md
```

本 task 的 5 個 commit（Step 31 有補 commit 時為 6 個）都已完成；最後一行 `docs: record the one-pass merge fix in the changelog` 是 Task 10 的最後一個 commit。

### Task 12: F5 CSP nonce 支援

目的：讓 `<Puck>` 接受選用的 `nonce` prop，並把它設定在 tceditor 執行期注入的 `<style>` 上（規格 §6 F5、§9 第 10 項；評估報告 sec-supply-11）。沒有傳入 `nonce` 時，DOM 輸出與現在完全相同。共 6 個 commit。

資料流：

```
<Puck nonce>  →  PuckProvider 的 generateAppStore  →  AppStore.nonce
  ├─ Layout:  useInjectUiCss(nonce)                   → 主文件的 ui-default <style>
  ├─ Preview: <AutoFrame nonce> → CopyHostStyles
  │     ├─ useInjectIframeCss(doc, nonce)             → iframe 的 iframe-styles <style>
  │     └─ mirrorEl：el.nonce === nonce 時
  │          applyNonce(mirror, nonce)                → 鏡像進 iframe 的 <style>／<link>
  ├─ DragDropContext
  │     ├─ StyleInjector.configure({ nonce })         → dnd-kit 拖曳時注入的 <style>
  │     └─ useDropAnimation → runTargetDropAnimation  → 放下動畫的 hide <style>
  └─ RichTextEditor: useSyncedEditor
        └─ useEditor({ injectNonce })                 → tiptap 的 <style data-tiptap-style>
```

設計說明（執行前請讀完）：

1. **只用 `setAttribute("nonce", …)`**。依 HTML 規範，設定 `nonce` content attribute 會同時更新元素內部的 nonce（CSP 實際比對的值）。瀏覽器套用 header 送出的 CSP 時，會把 attribute 清成空字串（nonce hiding），但內部值保留，`el.nonce` 讀到的是內部值。jsdom 26 不做 nonce hiding，`el.nonce` 直接反映 attribute（已在 jsdom 26.1.0 實測：`setAttribute` 後 `el.nonce` 相同，`cloneNode` 也會帶過去），所以測試同時檢查 `getAttribute("nonce")` 與 `el.nonce`。dnd-kit 與 tiptap 自己設定 nonce 時也是用 `setAttribute`。
2. **nonce 必須在元素接上文件之前設定**：瀏覽器在 `<style>` 接上文件時做 CSP 檢查，事後補 nonce 無效。所有改動都在 `append`／`prepend` 之前設定；Step 2 的測試會攔截 `append` 來驗證這點。
3. **鏡像的主文件樣式只沿用本來就有的 nonce，不補蓋**。`CopyHostStyles` 的 `collectStyles` 會掃描整份主文件（head 與 body），`MutationObserver` 也監看 head 的整個子樹。如果鏡像一律蓋上受信任的 nonce，被主文件 CSP 擋下的注入樣式在 iframe 內就會生效；`<link>` 帶 nonce 時還會略過 `style-src` 的來源白名單，等於把 nonce 洗給沒有授權的樣式。所以 `mirrorEl` 只在 `el.nonce === nonce`（主文件的原樣式本來就帶同一個 nonce）時才設定。比較的是 `el.nonce` 而不是 `getAttribute("nonce")`，因為 nonce hiding 之後 attribute 是空字串。依規範 `cloneNode` 本來就會複製內部 nonce，這裡再明確設定一次，讓鏡像在 jsdom 與瀏覽器中都看得到 attribute。以 `'self'` 或 hash 放行、本身不帶 nonce 的主文件樣式，鏡像進 srcdoc iframe 後會由同一份 CSP 以同樣方式放行，不需要補 nonce。Step 7 的測試用 `Object.defineProperty` 模擬 nonce hiding。
4. **範圍比規格字面多三處**：規格 F5 只點名 `use-inject-css`，但 §9 第 10 項要求「傳入 nonce 時，注入的 `<style>` 都帶有該值」。以下三種也是執行期注入，所以一併處理：
   - dnd-kit 的 `StyleInjector`（拖曳時注入定位用的 `<style>`）與放下動畫的 hide `<style>`（Step 19–26）。不帶 nonce 的話，在 nonce-based CSP 下，拖曳中的元素會失去 `position: fixed` 等定位樣式。dnd-kit 0.4.0 的 `DragDropManager` 一律以 `[ScrollListener, Scroller, StyleInjector, ...plugins]` 註冊 plugin，清單中重複的 plugin 以後面的 options 為準，所以在 Puck 的清單加上 `StyleInjector.configure({ nonce })`，就會把 nonce 設到唯一的 `StyleInjector` 實例上。Step 19 的測試用真的 `DragDropManager` 驗證這個行為。
   - tiptap 注入主文件的 `<style data-tiptap-style>`（ProseMirror 基本樣式，Step 27–31）。`useEditor` 的 `injectCSS` 預設為 `true`，而 tiptap 的 `createStyleTag` 只在拿到 `injectNonce` 時才設定 nonce，所以在 `components/RichTextEditor/lib/use-synced-editor.ts` 的 `useEditor({ … })` 傳入 `injectNonce: appStoreApi.getState().nonce`。同一份文件中 tiptap 只建立一個這樣的 `<style>`，後來的編輯器沿用它，與 `useInjectStyleSheet` 的 registry 行為相同。該檔已被 Task 7 改寫；本 task 只在 `    immediatelyRender: false,` 後面加一行，這一行在 Task 4 與 Task 7 的結果中都只出現一次，而且兩者在 `useEditor` 之前都已宣告 `appStoreApi`。
5. **沒有傳入 `nonce` 時**：不設定任何 attribute，dnd-kit 的 plugin 清單也不變，tiptap 收到的 `injectNonce` 是 `undefined`（與預設值相同）。唯一差異是 store 多一個值為 `undefined` 的 `nonce` key，所以 `components/Puck/__tests__/__snapshots__/index.tsx.snap` 要加一行（Step 17）。
6. `PuckProps.nonce` 是**公開 API 的新增**（`bundle/core.ts` 匯出 `Puck`，型別會出現在 `dist/index.d.ts`）。其餘新名稱（`applyNonce` 等）都不在 `bundle/core.ts`，不是公開 API。

**執行位置**：主工作目錄 `/Users/kaellim/Desktop/projects/puck`，分支 `tzuchi/main`，接在 Task 11 的最後一個 commit 之後。本 task 的程式碼已在 Task 4 的結果（`refs/tceditor-plan/task04`）上實際驗證：各步驟的測試、`pnpm typecheck`、`pnpm lint`、`pnpm format:check`、`pnpm build` 與 `pnpm verify` 都通過。另外也在「Task 10–11 的結果，再加上 Task 5–9 的草稿實作」上套用整份計畫：所有原始片段都恰好匹配一次，core 測試全數通過，`pnpm verify`（含 Task 8 的 `check:bundle`）也通過。

**注意**：
- commit 時一律明確列出路徑，不要用 `git add -A`，因為根目錄有未追蹤、不屬於本 task 的 `CLAUDE.md`。
- 本 repo 的 tsconfig 開了 `isolatedModules`，ts-jest 只轉譯、不做型別檢查。所以「確認失敗」的步驟看到的是執行期錯誤（例如 `applyNonce is not a function`、值不符），不是 TypeScript 錯誤。`pnpm typecheck` 排除測試檔，Step 33 會另外用完整 tsconfig 檢查本 task 新增的測試。
- Task 5–11 可能改過本 task 會碰到的檔案（例如 `store/index.ts`、`components/Puck/__tests__/index.tsx`）。下面的「原始片段」都很短，並以 Task 4 的結果逐字驗證過。若某段找不到，先用 `git grep -n` 搜尋片段中最有辨識度的一行：若只是周圍多了別的程式碼，照樣替換那幾行；若片段本身已被改寫，停下來回報，不要猜。
- 測試輸出中的毫秒數會不同；若前面的 task 在同一個測試檔加了測試，行號與測試總數也會不同。

**Files:**
- Create:
  - `packages/core/lib/__tests__/use-inject-css.spec.tsx`
  - `packages/core/components/AutoFrame/__tests__/index.spec.tsx`
  - `packages/core/components/DragDropContext/__tests__/index.spec.tsx`
  - `packages/core/components/DragDropContext/__tests__/use-drop-animation.spec.tsx`
  - `packages/core/components/RichTextEditor/lib/__tests__/use-synced-editor-nonce.spec.tsx`
- Modify:
  - `packages/core/lib/use-inject-css.ts`
  - `packages/core/components/AutoFrame/index.tsx`
  - `packages/core/store/index.ts`
  - `packages/core/components/Puck/index.tsx`
  - `packages/core/components/Puck/components/Layout/index.tsx`
  - `packages/core/components/Puck/components/Preview/index.tsx`
  - `packages/core/components/DragDropContext/index.tsx`
  - `packages/core/components/DragDropContext/use-drop-animation.ts`
  - `packages/core/lib/dnd/drop-animation.ts`
  - `packages/core/components/RichTextEditor/lib/use-synced-editor.ts`
  - `CHANGELOG.md`
- Test:
  - `packages/core/lib/__tests__/use-inject-css.spec.tsx`（新增，8 個測試）
  - `packages/core/components/AutoFrame/__tests__/index.spec.tsx`（新增，6 個測試）
  - `packages/core/components/Puck/__tests__/index.tsx`（新增 3 個測試）
  - `packages/core/components/Puck/__tests__/__snapshots__/index.tsx.snap`（加一行 `"nonce": undefined,`）
  - `packages/core/components/DragDropContext/__tests__/index.spec.tsx`（新增，2 個測試）
  - `packages/core/components/DragDropContext/__tests__/use-drop-animation.spec.tsx`（新增，2 個測試）
  - `packages/core/lib/dnd/__tests__/drop-animation.spec.ts`（新增 2 個測試）
  - `packages/core/components/RichTextEditor/lib/__tests__/use-synced-editor-nonce.spec.tsx`（新增，2 個測試）

**Interfaces:**
- Consumes：
  - Task 2 的套件名稱 `@tzuchi/tceditor`（`pnpm --filter @tzuchi/tceditor test`）。
  - Task 1 的 `pnpm typecheck`（`packages/core/tsconfig.typecheck.json`）與 `pnpm verify`；Task 8 起 `verify` 也包含 `check:bundle`。本 task 不新增任何 import 到 `@tiptap/html` 或 `happy-dom`，`check:bundle` 不受影響。
  - Task 2–4 建立的 `CHANGELOG.md` 慣例：`## tceditor 0.1.0 (unreleased)` 下的 `### Changes from Puck v0.23.0` 條列清單，清單之後緊接空行與 `## [0.23.0](/compare/v0.22.4...v0.23.0) (2026-08-07)`。
  - Task 7 改寫後的 `components/RichTextEditor/lib/use-synced-editor.ts`：`useSyncedEditor({ content, onChange, extensions, editable?, onFocusChange?, name })`，`content` 接受字串（v0.23.0 為 `JSONContent | string`，Task 7 之後為 `RichTextDoc | string`）。本 task 只依賴它在 `useEditor` 之前宣告 `const appStoreApi = useAppStoreApi();`，以及 `useEditor({ … })` 內有一行 `    immediatelyRender: false,`；兩者 v0.23.0 就有，Task 7 保留。
  - 除此之外，不依賴 Task 5–11 的任何新名稱。
- Produces：
  - `PuckProps.nonce?: string`（`components/Puck/index.tsx`，公開 API）。
  - `AppStore.nonce?: string`（`store/index.ts`；`createAppStore` 不設預設值，未傳入時為 `undefined`）。
  - `lib/use-inject-css.ts`：
    - `export const applyNonce = (el: Element, nonce?: string) => void`：`nonce` 為空字串或 `undefined` 時不動元素。
    - `InjectStyleSheetOptions.nonce?: string`（`useInjectStyleSheet` 的參數）。
    - `export const useInjectUiCss = (nonce?: string) => void`
    - `export const useInjectIframeCss = (targetDocument?: Document, nonce?: string) => void`
  - `AutoFrameProps.nonce?: string`（`components/AutoFrame/index.tsx`；不會轉傳到 `<iframe>` 元素上；鏡像的主文件樣式只在本來就帶同一個 nonce 時才設定）。
  - `lib/dnd/drop-animation.ts`：`runTargetDropAnimation({ feedbackElement, itemId?, targetZone, getExpectedOrder, nonce? })`，以及 `runDropAnimation` 的 `target` 參數型別多了 `nonce?: string`。
  - `useSyncedEditor` 建立的 tiptap 編輯器帶 `injectNonce: appStoreApi.getState().nonce`（簽名不變）。
  - `CHANGELOG.md` 清單最後一行變成 Step 32 加入的 `` * add an optional `nonce` prop to `<Puck>`; … ``。Task 14 更新 `README.md`／`CLAUDE.md` 時可引用這個 prop。

- [ ] **Step 1: 確認起點**

```bash
cd /Users/kaellim/Desktop/projects/puck
git branch --show-current
git status --short
git log --oneline -1
```

預期輸出（hash 會不同；最後一行是 Task 11 的最後一個 commit。若 Task 11 Step 31 補了 commit，順序以 Task 11 Step 34 為準）：

```
tzuchi/main
?? CLAUDE.md
<hash> docs: record the Object.prototype member name fix in the changelog
```

三項任何一項不符就停下來：分支不是 `tzuchi/main`、有 `?? CLAUDE.md` 以外的變更，或最新 commit 不是 Task 11 的最後一個 commit。

- [ ] **Step 2: 寫 `use-inject-css` 的失敗測試**

新增 `packages/core/lib/__tests__/use-inject-css.spec.tsx`，完整內容：

```tsx
import { cleanup, renderHook } from "@testing-library/react";
import {
  applyNonce,
  PUCK_STYLE_ID_ATTRIBUTE,
  PUCK_STYLE_IDS,
  PuckStyleId,
  useInjectIframeCss,
  useInjectStyleSheet,
  useInjectUiCss,
} from "../use-inject-css";

const getStyle = (doc: Document, id: PuckStyleId) =>
  doc.head.querySelector<HTMLStyleElement>(
    `style[${PUCK_STYLE_ID_ATTRIBUTE}="${id}"]`
  );

afterEach(() => {
  cleanup();
});

describe("applyNonce", () => {
  it("sets the nonce attribute and property", () => {
    const el = document.createElement("style");

    applyNonce(el, "abc");

    expect(el.getAttribute("nonce")).toBe("abc");
    expect(el.nonce).toBe("abc");
  });

  it("leaves the element unchanged without a nonce", () => {
    const el = document.createElement("style");

    applyNonce(el);
    applyNonce(el, "");

    expect(el.hasAttribute("nonce")).toBe(false);
  });
});

describe("useInjectStyleSheet", () => {
  it("sets the nonce before attaching the style element", () => {
    const doc = document.implementation.createHTMLDocument("target");
    const attached: { nonce: string | null; cssText: string | null }[] = [];
    const append = doc.head.append.bind(doc.head);

    doc.head.append = (...nodes: (Node | string)[]) => {
      nodes.forEach((node) => {
        if (node instanceof HTMLStyleElement) {
          attached.push({
            nonce: node.getAttribute("nonce"),
            cssText: node.textContent,
          });
        }
      });

      append(...nodes);
    };

    renderHook(() =>
      useInjectStyleSheet({
        cssText: ".a { color: red; }",
        document: doc,
        id: PUCK_STYLE_IDS.iframeInteractions,
        nonce: "abc",
      })
    );

    expect(attached).toEqual([{ nonce: "abc", cssText: ".a { color: red; }" }]);
    expect(getStyle(doc, PUCK_STYLE_IDS.iframeInteractions)?.nonce).toBe("abc");
  });

  it("does not add a nonce attribute when no nonce is given", () => {
    const doc = document.implementation.createHTMLDocument("target");

    renderHook(() =>
      useInjectStyleSheet({
        cssText: ".a { color: red; }",
        document: doc,
        id: PUCK_STYLE_IDS.iframeInteractions,
      })
    );

    const style = getStyle(doc, PUCK_STYLE_IDS.iframeInteractions);

    expect(style).not.toBeNull();
    expect(style?.hasAttribute("nonce")).toBe(false);
  });
});

describe("useInjectUiCss", () => {
  it("sets the nonce on the ui style in the host document", () => {
    const { unmount } = renderHook(() => useInjectUiCss("abc"));

    expect(getStyle(document, PUCK_STYLE_IDS.uiDefault)?.nonce).toBe("abc");

    unmount();

    expect(getStyle(document, PUCK_STYLE_IDS.uiDefault)).toBeNull();
  });

  it("does not add a nonce attribute by default", () => {
    renderHook(() => useInjectUiCss());

    const style = getStyle(document, PUCK_STYLE_IDS.uiDefault);

    expect(style).not.toBeNull();
    expect(style?.hasAttribute("nonce")).toBe(false);
  });
});

describe("useInjectIframeCss", () => {
  it("sets the nonce on the interaction style in the target document", () => {
    const doc = document.implementation.createHTMLDocument("iframe");

    renderHook(() => useInjectIframeCss(doc, "abc"));

    expect(getStyle(doc, PUCK_STYLE_IDS.iframeInteractions)?.nonce).toBe("abc");
  });

  it("does not add a nonce attribute by default", () => {
    const doc = document.implementation.createHTMLDocument("iframe");

    renderHook(() => useInjectIframeCss(doc));

    const style = getStyle(doc, PUCK_STYLE_IDS.iframeInteractions);

    expect(style).not.toBeNull();
    expect(style?.hasAttribute("nonce")).toBe(false);
  });
});
```

`useInjectStyleSheet` 只在 `prepend` 為 `false` 時呼叫 `head.append`，所以第三個測試攔截 `append`，記下元素接上文件那一刻的 nonce 與內容。

- [ ] **Step 3: 執行測試，確認失敗**

```bash
cd /Users/kaellim/Desktop/projects/puck/packages/core
pnpm test lib/__tests__/use-inject-css.spec.tsx
```

預期失敗（節錄；程式碼框與毫秒數省略）：

```
FAIL lib/__tests__/use-inject-css.spec.tsx
  applyNonce
    ✕ sets the nonce attribute and property
    ✕ leaves the element unchanged without a nonce
  useInjectStyleSheet
    ✕ sets the nonce before attaching the style element
    ✓ does not add a nonce attribute when no nonce is given
  useInjectUiCss
    ✕ sets the nonce on the ui style in the host document
    ✓ does not add a nonce attribute by default
  useInjectIframeCss
    ✕ sets the nonce on the interaction style in the target document
    ✓ does not add a nonce attribute by default
  ● applyNonce › sets the nonce attribute and property
    TypeError: (0 , use_inject_css_1.applyNonce) is not a function
  ● applyNonce › leaves the element unchanged without a nonce
    TypeError: (0 , use_inject_css_1.applyNonce) is not a function
  ● useInjectStyleSheet › sets the nonce before attaching the style element
    expect(received).toEqual(expected) // deep equality
    -     "nonce": "abc",
    +     "nonce": null,
  ● useInjectUiCss › sets the nonce on the ui style in the host document
    Expected: "abc"
    Received: ""
  ● useInjectIframeCss › sets the nonce on the interaction style in the target document
    Expected: "abc"
    Received: ""
Test Suites: 1 failed, 1 total
Tests:       5 failed, 3 passed, 8 total
```

3 個「沒有 nonce」的測試已經通過；它們保護「未傳 nonce 時行為不變」，實作後也必須維持通過。

- [ ] **Step 4: 實作 `use-inject-css.ts`**

編輯 `packages/core/lib/use-inject-css.ts`，共 6 處。

(a) 原始片段：

```ts
type InjectStyleSheetOptions = {
  cssText: string;
  document?: Document;
  id: PuckStyleId;
  prepend?: boolean;
};
```

替換為：

```ts
type InjectStyleSheetOptions = {
  cssText: string;
  document?: Document;
  id: PuckStyleId;
  nonce?: string;
  prepend?: boolean;
};
```

(b) 原始片段：

```ts
const createStyleElement = (
  target: Document,
  id: PuckStyleId,
  cssText: string,
  prepend = false
) => {
  const el = target.createElement("style");

  el.setAttribute(PUCK_STYLE_SOURCE_ATTRIBUTE, PUCK_STYLE_SOURCE_VALUE);
  el.setAttribute(PUCK_STYLE_ID_ATTRIBUTE, id);
  el.textContent = cssText;
```

替換為：

```ts
/**
 * Sets a CSP nonce on an element before it is attached. Setting the content
 * attribute also updates the element's internal nonce, which is what the
 * browser checks against the Content Security Policy. Without a nonce the
 * element is left unchanged.
 */
export const applyNonce = (el: Element, nonce?: string) => {
  if (nonce) {
    el.setAttribute("nonce", nonce);
  }
};

const createStyleElement = (
  target: Document,
  id: PuckStyleId,
  cssText: string,
  prepend = false,
  nonce?: string
) => {
  const el = target.createElement("style");

  el.setAttribute(PUCK_STYLE_SOURCE_ATTRIBUTE, PUCK_STYLE_SOURCE_VALUE);
  el.setAttribute(PUCK_STYLE_ID_ATTRIBUTE, id);
  applyNonce(el, nonce);
  el.textContent = cssText;
```

(c) 原始片段（`useInjectStyleSheet` 內）：

```ts
      const el = createStyleElement(
        targetDocument,
        options.id,
        options.cssText,
        options.prepend
      );
```

替換為：

```ts
      const el = createStyleElement(
        targetDocument,
        options.id,
        options.cssText,
        options.prepend,
        options.nonce
      );
```

(d) 原始片段（`useInsertionEffect` 的依賴陣列）：

```ts
    options?.cssText,
    options?.id,
    options?.prepend,
```

替換為：

```ts
    options?.cssText,
    options?.id,
    options?.nonce,
    options?.prepend,
```

(e) 原始片段：

```ts
export const useInjectUiCss = () => {
  const skip = hasStaticPuckCss();

  useInjectStyleSheet(
    skip
      ? null
      : {
          cssText: defaultUiStyles,
          id: PUCK_STYLE_IDS.uiDefault,
          prepend: true,
        }
  );
```

替換為：

```ts
export const useInjectUiCss = (nonce?: string) => {
  const skip = hasStaticPuckCss();

  useInjectStyleSheet(
    skip
      ? null
      : {
          cssText: defaultUiStyles,
          id: PUCK_STYLE_IDS.uiDefault,
          nonce,
          prepend: true,
        }
  );
```

(f) 原始片段（檔案結尾）：

```ts
export const useInjectIframeCss = (targetDocument?: Document) => {
  useInjectStyleSheet(
    targetDocument
      ? {
          cssText: iframeInteractionStyles,
          document: targetDocument,
          id: PUCK_STYLE_IDS.iframeInteractions,
        }
      : null
  );
};
```

替換為：

```ts
export const useInjectIframeCss = (
  targetDocument?: Document,
  nonce?: string
) => {
  useInjectStyleSheet(
    targetDocument
      ? {
          cssText: iframeInteractionStyles,
          document: targetDocument,
          id: PUCK_STYLE_IDS.iframeInteractions,
          nonce,
        }
      : null
  );
};
```

`registry` 中已存在的元素（同一份文件裡第二個 `<Puck>`）沿用第一次建立時的 nonce；同一頁的 CSP nonce 只有一個，這是預期行為。nonce 改變時，依賴陣列裡的 `options?.nonce` 會讓 effect 先移除舊元素再以新 nonce 重建。

- [ ] **Step 5: 執行測試，確認通過，並檢查格式**

```bash
cd /Users/kaellim/Desktop/projects/puck/packages/core
pnpm test lib/__tests__/use-inject-css.spec.tsx
```

預期輸出：

```
PASS lib/__tests__/use-inject-css.spec.tsx
  applyNonce
    ✓ sets the nonce attribute and property
    ✓ leaves the element unchanged without a nonce
  useInjectStyleSheet
    ✓ sets the nonce before attaching the style element
    ✓ does not add a nonce attribute when no nonce is given
  useInjectUiCss
    ✓ sets the nonce on the ui style in the host document
    ✓ does not add a nonce attribute by default
  useInjectIframeCss
    ✓ sets the nonce on the interaction style in the target document
    ✓ does not add a nonce attribute by default

Test Suites: 1 passed, 1 total
Tests:       8 passed, 8 total
Snapshots:   0 total
```

```bash
cd /Users/kaellim/Desktop/projects/puck
pnpm exec prettier --check packages/core/lib/use-inject-css.ts packages/core/lib/__tests__/use-inject-css.spec.tsx
```

預期最後一行：`All matched files use Prettier code style!`。若列出檔案，執行 `pnpm exec prettier --write <該檔>` 後，確認內容與本計畫相同（只差在空白），再繼續。

- [ ] **Step 6: Commit**

```bash
cd /Users/kaellim/Desktop/projects/puck
git add packages/core/lib/use-inject-css.ts packages/core/lib/__tests__/use-inject-css.spec.tsx
git status --short
git commit -m "feat: set a CSP nonce on the styles injected by use-inject-css"
```

`git status --short` 預期：

```
A  packages/core/lib/__tests__/use-inject-css.spec.tsx
M  packages/core/lib/use-inject-css.ts
?? CLAUDE.md
```

`git commit` 預期（hash 在你的環境會不同）：

```
[tzuchi/main <hash>] feat: set a CSP nonce on the styles injected by use-inject-css
 2 files changed, 157 insertions(+), 4 deletions(-)
 create mode 100644 packages/core/lib/__tests__/use-inject-css.spec.tsx
```

- [ ] **Step 7: 寫 AutoFrame 的失敗測試**

jsdom 不支援 `srcDoc`，iframe 只會載入空白文件，所以 `AutoFrame` 找不到 `#frame-root`、不會掛載 `CopyHostStyles`。實測發現：在 `render` 之後、iframe 的 load 事件觸發之前，手動在 `contentDocument` 補上 `<div id="frame-root">`，`AutoFrame` 就會照常完成載入、鏡像主文件的樣式並呼叫 `onReady`。所以不需要把鏡像邏輯抽成小函式，可以直接測整個元件。

先建立目錄：

```bash
mkdir -p /Users/kaellim/Desktop/projects/puck/packages/core/components/AutoFrame/__tests__
```

新增 `packages/core/components/AutoFrame/__tests__/index.spec.tsx`，完整內容：

```tsx
import { cleanup, render, waitFor } from "@testing-library/react";
import { createRef } from "react";
import AutoFrame from "../index";
import {
  PUCK_STYLE_ID_ATTRIBUTE,
  PUCK_STYLE_IDS,
} from "../../../lib/use-inject-css";

const mirrorSelector = '[data-puck-style-mirror="true"]';
const interactionSelector = `[${PUCK_STYLE_ID_ATTRIBUTE}="${PUCK_STYLE_IDS.iframeInteractions}"]`;

// Under a header-delivered CSP, browsers hide the nonce attribute: it reads as
// an empty string while the nonce property keeps the value. jsdom does not do
// this, so simulate it.
const hideNonce = (el: HTMLElement, nonce: string) => {
  el.setAttribute("nonce", "");
  Object.defineProperty(el, "nonce", { value: nonce });
};

const renderFrame = async (nonce?: string) => {
  const frameRef = createRef<HTMLIFrameElement>();
  const onReady = jest.fn();

  render(
    <AutoFrame
      className="frame"
      frameRef={frameRef}
      nonce={nonce}
      onReady={onReady}
    >
      <div>Frame content</div>
    </AutoFrame>
  );

  const frame = frameRef.current!;
  const frameDoc = frame.contentDocument!;

  // jsdom ignores srcDoc, so create the mount node AutoFrame looks for before
  // the frame's load event fires.
  const root = frameDoc.createElement("div");
  root.id = "frame-root";
  frameDoc.body.append(root);

  await waitFor(() => expect(onReady).toHaveBeenCalled());

  return { frame, frameDoc };
};

describe("AutoFrame", () => {
  let hostStyle: HTMLStyleElement;

  beforeEach(() => {
    hostStyle = document.createElement("style");
    hostStyle.setAttribute("nonce", "abc");
    hostStyle.textContent = ".host { color: red; }";
    document.head.append(hostStyle);
  });

  afterEach(() => {
    cleanup();
    document.head.innerHTML = "";
  });

  it("sets the nonce on the interaction styles and mirrored host styles", async () => {
    const { frameDoc } = await renderFrame("abc");

    const mirror = frameDoc.head.querySelector(mirrorSelector);

    expect(mirror?.textContent).toBe(".host { color: red; }");
    expect(mirror?.getAttribute("nonce")).toBe("abc");
    expect(
      frameDoc.head.querySelector(interactionSelector)?.getAttribute("nonce")
    ).toBe("abc");
  });

  it("sets the nonce on mirrors of host styles whose nonce attribute is hidden", async () => {
    hideNonce(hostStyle, "abc");

    const { frameDoc } = await renderFrame("abc");

    const mirror = frameDoc.head.querySelector(mirrorSelector);

    expect(mirror?.textContent).toBe(".host { color: red; }");
    expect(mirror?.getAttribute("nonce")).toBe("abc");
  });

  it("sets the nonce on host styles added after the frame loads", async () => {
    const { frameDoc } = await renderFrame("abc");

    const lateStyle = document.createElement("style");
    hideNonce(lateStyle, "abc");
    lateStyle.textContent = ".late { color: blue; }";
    document.head.append(lateStyle);

    await waitFor(() =>
      expect(frameDoc.head.querySelectorAll(mirrorSelector)).toHaveLength(2)
    );

    const mirrors = Array.from(frameDoc.head.querySelectorAll(mirrorSelector));

    expect(mirrors.map((el) => el.getAttribute("nonce"))).toEqual([
      "abc",
      "abc",
    ]);
  });

  it("does not add the nonce to host styles that lack it", async () => {
    hostStyle.removeAttribute("nonce");

    const { frameDoc } = await renderFrame("abc");

    const mirror = frameDoc.head.querySelector(mirrorSelector);

    expect(mirror?.textContent).toBe(".host { color: red; }");
    expect(mirror?.hasAttribute("nonce")).toBe(false);
  });

  it("does not add a nonce without the nonce prop", async () => {
    hostStyle.removeAttribute("nonce");

    const { frameDoc } = await renderFrame();

    expect(frameDoc.head.querySelector(mirrorSelector)).not.toBeNull();
    expect(frameDoc.head.querySelector(interactionSelector)).not.toBeNull();
    expect(frameDoc.head.querySelectorAll("[nonce]")).toHaveLength(0);
  });

  it("does not forward the nonce to the iframe element", async () => {
    const { frame } = await renderFrame("abc");

    expect(frame.hasAttribute("nonce")).toBe(false);
  });
});
```

各測試涵蓋的情況：

- 第一個測試：主文件樣式帶 `nonce="abc"`（例如以 `<meta>` 送出 CSP，attribute 不會被隱藏），走初次載入的 `Promise.all` → `mirrorEl` 路徑。
- 第二個測試：用 `hideNonce` 模擬 header CSP 的 nonce hiding（attribute 是空字串，`nonce` property 仍是 `abc`）。jsdom 的 `cloneNode` 只會複製空字串 attribute，所以只有 `mirrorEl` 依 `el.nonce` 明確設定時，鏡像才會帶 `abc`。
- 第三個測試：同樣是 nonce hiding，但走 `MutationObserver` → `addEl` → `mirrorEl` 路徑。
- 第四個測試：主文件樣式沒有 nonce（可能是被主文件 CSP 擋下的注入樣式），鏡像不得帶 nonce。它現在就會通過；若 `mirrorEl` 不檢查 `el.nonce` 就一律補 nonce，它會失敗（設計說明第 3 點）。
- 第五個測試：沒傳 `nonce` prop 時，iframe 內完全沒有 `nonce` attribute。
- 第六個測試：`nonce` 不會經由 `...props` 被轉傳到 `<iframe>` 上。

- [ ] **Step 8: 執行測試，確認失敗**

```bash
cd /Users/kaellim/Desktop/projects/puck/packages/core
pnpm test components/AutoFrame/__tests__/index.spec.tsx
```

預期失敗（節錄）：

```
FAIL components/AutoFrame/__tests__/index.spec.tsx
  AutoFrame
    ✕ sets the nonce on the interaction styles and mirrored host styles
    ✕ sets the nonce on mirrors of host styles whose nonce attribute is hidden
    ✕ sets the nonce on host styles added after the frame loads
    ✓ does not add the nonce to host styles that lack it
    ✓ does not add a nonce without the nonce prop
    ✕ does not forward the nonce to the iframe element
  ● AutoFrame › sets the nonce on the interaction styles and mirrored host styles
    Expected: "abc"
    Received: null
  ● AutoFrame › sets the nonce on mirrors of host styles whose nonce attribute is hidden
    Expected: "abc"
    Received: ""
  ● AutoFrame › sets the nonce on host styles added after the frame loads
      Array [
        "abc",
    -   "abc",
    +   "",
      ]
  ● AutoFrame › does not forward the nonce to the iframe element
    Expected: false
    Received: true
Test Suites: 1 failed, 1 total
Tests:       4 failed, 2 passed, 6 total
```

第一項失敗的是 iframe 的 interaction `<style>`（鏡像本身已由 `cloneNode` 帶上 `abc`）。第二、三項是 nonce hiding 下的鏡像。最後一項代表目前的 `nonce` 會經由 `...props` 落到 `<iframe>` 上，Step 9 會把它從 props 中取出。

- [ ] **Step 9: 實作 AutoFrame 的 nonce**

編輯 `packages/core/components/AutoFrame/index.tsx`，共 7 處。

(a) 原始片段：

```tsx
import {
  isPuckStyleElement,
  useInjectIframeCss,
} from "../../lib/use-inject-css";
```

替換為：

```tsx
import {
  applyNonce,
  isPuckStyleElement,
  useInjectIframeCss,
} from "../../lib/use-inject-css";
```

(b) 原始片段：

```tsx
const CopyHostStyles = ({
  children,
  debug = false,
  onStylesLoaded = () => null,
  syncHostStyles = true,
}: {
  children: ReactNode;
  debug?: boolean;
  onStylesLoaded?: () => void;
  syncHostStyles?: boolean;
}) => {
  const { document: doc, window: win } = useFrame();

  useInjectIframeCss(doc);
```

替換為：

```tsx
const CopyHostStyles = ({
  children,
  debug = false,
  nonce,
  onStylesLoaded = () => null,
  syncHostStyles = true,
}: {
  children: ReactNode;
  debug?: boolean;
  nonce?: string;
  onStylesLoaded?: () => void;
  syncHostStyles?: boolean;
}) => {
  const { document: doc, window: win } = useFrame();

  useInjectIframeCss(doc, nonce);
```

(c) 原始片段（`mirrorEl` 的結尾；不論是新建 `<style>` 還是 `cloneNode` 都會走到這裡，且此時尚未接上 iframe 文件；`el` 是主文件中的原樣式）：

```tsx
      mirror.setAttribute(mirroredStyleAttribute, "true");

      return mirror;
```

替換為：

```tsx
      mirror.setAttribute(mirroredStyleAttribute, "true");

      // Only carry the nonce over from host styles that already have it, so a
      // style the host CSP blocked is not allowed inside the iframe.
      if (el.nonce === nonce) {
        applyNonce(mirror, nonce);
      }

      return mirror;
```

（`nonce` 為 `undefined` 時 `applyNonce` 不動元素，所以沒傳 prop 時行為不變。`el` 的型別是 `HTMLElement`，`el.nonce` 為 `string | undefined`，型別檢查會通過。）

(d) 原始片段（`CopyHostStyles` 的 `useEffect` 依賴陣列）：

```tsx
  }, [syncHostStyles]);

  return <>{children}</>;
```

替換為：

```tsx
  }, [syncHostStyles, nonce]);

  return <>{children}</>;
```

（nonce 改變時，effect 的 cleanup 會移除所有鏡像，再以新 nonce 重新鏡像。）

(e) 原始片段（`AutoFrameProps`）：

```tsx
  frameRef: RefObject<HTMLIFrameElement | null>;
  syncHostStyles?: boolean;
};
```

替換為：

```tsx
  frameRef: RefObject<HTMLIFrameElement | null>;
  nonce?: string;
  syncHostStyles?: boolean;
};
```

(f) 原始片段（`AutoFrame` 的參數解構；必須取出 `nonce`，否則它會留在 `...props` 裡被放到 `<iframe>` 上）：

```tsx
  frameRef,
  syncHostStyles = true,
  ...props
}: AutoFrameProps) {
```

替換為：

```tsx
  frameRef,
  nonce,
  syncHostStyles = true,
  ...props
}: AutoFrameProps) {
```

(g) 原始片段：

```tsx
          <CopyHostStyles
            debug={debug}
            onStylesLoaded={() => setStylesLoaded(true)}
```

替換為：

```tsx
          <CopyHostStyles
            debug={debug}
            nonce={nonce}
            onStylesLoaded={() => setStylesLoaded(true)}
```

- [ ] **Step 10: 執行測試，確認通過，並檢查格式**

```bash
cd /Users/kaellim/Desktop/projects/puck/packages/core
pnpm test components/AutoFrame/__tests__/index.spec.tsx
```

預期輸出：

```
PASS components/AutoFrame/__tests__/index.spec.tsx
  AutoFrame
    ✓ sets the nonce on the interaction styles and mirrored host styles
    ✓ sets the nonce on mirrors of host styles whose nonce attribute is hidden
    ✓ sets the nonce on host styles added after the frame loads
    ✓ does not add the nonce to host styles that lack it
    ✓ does not add a nonce without the nonce prop
    ✓ does not forward the nonce to the iframe element

Test Suites: 1 passed, 1 total
Tests:       6 passed, 6 total
Snapshots:   0 total
```

```bash
cd /Users/kaellim/Desktop/projects/puck
pnpm exec prettier --check packages/core/components/AutoFrame/index.tsx packages/core/components/AutoFrame/__tests__/index.spec.tsx
```

預期最後一行：`All matched files use Prettier code style!`。

- [ ] **Step 11: Commit**

```bash
cd /Users/kaellim/Desktop/projects/puck
git add packages/core/components/AutoFrame/index.tsx packages/core/components/AutoFrame/__tests__/index.spec.tsx
git status --short
git commit -m "feat: set the CSP nonce on styles AutoFrame injects and mirrors"
```

`git status --short` 預期：

```
A  packages/core/components/AutoFrame/__tests__/index.spec.tsx
M  packages/core/components/AutoFrame/index.tsx
?? CLAUDE.md
```

`git commit` 預期：

```
[tzuchi/main <hash>] feat: set the CSP nonce on styles AutoFrame injects and mirrors
 2 files changed, 147 insertions(+), 2 deletions(-)
 create mode 100644 packages/core/components/AutoFrame/__tests__/index.spec.tsx
```

- [ ] **Step 12: 在 Puck 的測試加入 nonce 測試**

編輯 `packages/core/components/Puck/__tests__/index.tsx`，共 2 處。

(a) 原始片段（第 1 行）：

```tsx
import { act, cleanup, render, screen } from "@testing-library/react";
```

替換為：

```tsx
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
```

(b) 原始片段：

```tsx
  it("exposes the preview mode on the canvas entry element", async () => {
```

替換為（在它前面插入三個測試，原行保留）：

```tsx
  it("sets the nonce prop on the styles it injects into the document", async () => {
    render(
      <Puck config={config} data={{}} iframe={{ enabled: false }} nonce="abc" />
    );

    await flush();

    const { appStore } = getInternal();

    expect(appStore.getState().nonce).toBe("abc");

    const injected = Array.from(
      document.head.querySelectorAll(
        `style[${PUCK_STYLE_SOURCE_ATTRIBUTE}="${PUCK_STYLE_SOURCE_VALUE}"]`
      )
    );

    expect(injected).toHaveLength(1);
    expect(injected.map((el) => el.getAttribute("nonce"))).toEqual(["abc"]);
  });

  it("does not add a nonce to injected styles without the nonce prop", async () => {
    render(<Puck config={config} data={{}} iframe={{ enabled: false }} />);

    await flush();

    const injected = document.head.querySelectorAll(
      `style[${PUCK_STYLE_SOURCE_ATTRIBUTE}="${PUCK_STYLE_SOURCE_VALUE}"]`
    );

    expect(injected).toHaveLength(1);
    expect(document.head.querySelectorAll("[nonce]")).toHaveLength(0);
  });

  it("passes the nonce prop to the preview iframe", async () => {
    const hostStyle = document.createElement("style");
    hostStyle.setAttribute("data-test-style", "");
    hostStyle.setAttribute("nonce", "abc");
    hostStyle.textContent = ".host { color: red; }";
    document.head.append(hostStyle);

    render(<Puck config={config} data={{}} nonce="abc" />);

    const frame = document.querySelector<HTMLIFrameElement>("#preview-frame");
    const frameDoc = frame!.contentDocument!;

    // jsdom ignores srcDoc, so create the mount node AutoFrame looks for
    // before the frame's load event fires.
    const root = frameDoc.createElement("div");
    root.id = "frame-root";
    frameDoc.body.append(root);

    await waitFor(() =>
      expect(getInternal().appStore.getState().status).toBe("READY")
    );

    expect(
      frameDoc.head.querySelector(
        `[${PUCK_STYLE_ID_ATTRIBUTE}="${PUCK_STYLE_IDS.iframeInteractions}"]`
      )
    ).not.toBeNull();
    expect(
      frameDoc.head.querySelector('[data-puck-style-mirror="true"]')
        ?.textContent
    ).toBe(".host { color: red; }");

    const frameStyles = Array.from(frameDoc.head.querySelectorAll("style"));

    expect(frameStyles.map((el) => el.getAttribute("nonce"))).toEqual(
      frameStyles.map(() => "abc")
    );
  });

  it("exposes the preview mode on the canvas entry element", async () => {
```

這個檔案已經有 `PUCK_STYLE_ID_ATTRIBUTE`、`PUCK_STYLE_IDS`、`PUCK_STYLE_SOURCE_ATTRIBUTE`、`PUCK_STYLE_SOURCE_VALUE` 的 import 與 `flush`、`getInternal`；既有的 `afterEach` 會移除主文件中 Puck 的 `<style>` 與 `[data-test-style]`。第三個測試不傳 `iframe`，所以 Preview 會渲染 `AutoFrame`，從 `<Puck>` 一路驗證到 iframe 內的樣式。它的主文件樣式帶同一個 nonce，代表主文件 CSP 放行的合法樣式；不帶 nonce 的主文件樣式不會被補上 nonce，這由 Step 7 的 AutoFrame 測試涵蓋。

- [ ] **Step 13: 執行測試，確認失敗**

```bash
cd /Users/kaellim/Desktop/projects/puck/packages/core
pnpm test components/Puck/__tests__/index.tsx
```

預期失敗（節錄）：

```
FAIL components/Puck/__tests__/index.tsx
  Puck
    ✓ root renders
    ✓ should generate the correct state on mount
    ...
    ✕ sets the nonce prop on the styles it injects into the document
    ✓ does not add a nonce to injected styles without the nonce prop
    ✕ passes the nonce prop to the preview iframe
    ...
  ● Puck › sets the nonce prop on the styles it injects into the document
    expect(received).toBe(expected) // Object.is equality
    Expected: "abc"
    Received: undefined
  ● Puck › passes the nonce prop to the preview iframe
    expect(received).toEqual(expected) // deep equality
      Array [
    -   "abc",
    +   null,
        "abc",
      ]
Test Suites: 1 failed, 1 total
Tests:       2 failed, 12 passed, 14 total
Snapshots:   2 passed, 2 total
```

第二個失敗中，第一個元素是 iframe 的 interaction `<style>`：`<Puck>` 還沒把 nonce 傳給 `AutoFrame`，所以是 `null`。第二個元素是鏡像，`cloneNode` 複製了主文件樣式的 `nonce` attribute，所以已經是 `abc`。（若 Task 5–11 在這個檔案加了測試，`passed` 與 `total` 會更多，但必須只有這 2 個失敗。）

- [ ] **Step 14: 在 store 與 `<Puck>` 加上 `nonce`**

編輯 `packages/core/store/index.ts`（`AppStore` 型別），原始片段：

```ts
  dictionary: Dictionary;
  dnd?: DndConfig;
  fields: FieldsSlice;
```

替換為：

```ts
  dictionary: Dictionary;
  dnd?: DndConfig;
  nonce?: string;
  fields: FieldsSlice;
```

`createAppStore` 的預設值不需要改：未傳入時就是 `undefined`。

編輯 `packages/core/components/Puck/index.tsx`，共 4 處。

(a) 原始片段（`PuckProps` 結尾）：

```tsx
  height?: CSSProperties["height"];
  _experimentalFullScreenCanvas?: boolean;
  _experimentalVirtualization?: boolean;
};
```

替換為：

```tsx
  height?: CSSProperties["height"];
  /**
   * CSP nonce set on the `<style>` elements the editor injects (its own
   * styles, the preview iframe's styles, the drag-and-drop styles and the
   * rich text editor's base styles), so it can run under a nonce-based
   * `style-src` policy. Host styles mirrored into the preview iframe get it
   * only if they already carry the same nonce.
   */
  nonce?: string;
  _experimentalFullScreenCanvas?: boolean;
  _experimentalVirtualization?: boolean;
};
```

（註解提到的 drag-and-drop 樣式在 Step 23–24 完成，rich text 編輯器的基本樣式在 Step 29 完成。）

(b) 原始片段（`PuckProvider` 解構 props）：

```tsx
    onAction,
    fieldTransforms,
    _experimentalFullScreenCanvas,
    _experimentalVirtualization,
  } = usePropsContext();
```

替換為：

```tsx
    onAction,
    fieldTransforms,
    nonce,
    _experimentalFullScreenCanvas,
    _experimentalVirtualization,
  } = usePropsContext();
```

(c) 原始片段（`generateAppStore` 的回傳值結尾）：

```tsx
        dnd,
        fieldTransforms: loadedFieldTransforms,
      };
    },
```

替換為：

```tsx
        dnd,
        fieldTransforms: loadedFieldTransforms,
        nonce,
      };
    },
```

(d) 原始片段（`generateAppStore` 的依賴陣列結尾）：

```tsx
      dnd,
      loadedFieldTransforms,
    ]
  );
```

替換為：

```tsx
      dnd,
      loadedFieldTransforms,
      nonce,
    ]
  );
```

`nonce` 一律寫進回傳物件（未傳入時為 `undefined`），而不是只在有值時展開。原因：`appStore.setState` 是淺合併，若 `nonce` 從有值變成沒傳，key 缺席會讓舊值殘留。

- [ ] **Step 15: Layout 與 Preview 從 store 讀取 nonce**

編輯 `packages/core/components/Puck/components/Layout/index.tsx`，原始片段：

```tsx
  useInjectUiCss();
```

替換為：

```tsx
  const nonce = useAppStore((s) => s.nonce);

  useInjectUiCss(nonce);
```

編輯 `packages/core/components/Puck/components/Preview/index.tsx`，共 2 處。

(a) 原始片段：

```tsx
  const metadata = useAppStore((s) => s.metadata);
  const renderData = useAppStore((s) =>
```

替換為：

```tsx
  const metadata = useAppStore((s) => s.metadata);
  const nonce = useAppStore((s) => s.nonce);
  const renderData = useAppStore((s) =>
```

(b) 原始片段（`<AutoFrame>` 的 props）：

```tsx
          syncHostStyles={iframe.syncHostStyles}
          onReady={() => {
```

替換為：

```tsx
          syncHostStyles={iframe.syncHostStyles}
          nonce={nonce}
          onReady={() => {
```

- [ ] **Step 16: 執行測試，確認新測試通過、snapshot 失敗**

```bash
cd /Users/kaellim/Desktop/projects/puck/packages/core
pnpm test components/Puck/__tests__/index.tsx
```

預期（節錄）：3 個新測試都通過，只剩 store snapshot 多了一行 `nonce`：

```
FAIL components/Puck/__tests__/index.tsx
  Puck
    ✓ root renders
    ✕ should generate the correct state on mount
    ...
    ✓ sets the nonce prop on the styles it injects into the document
    ✓ does not add a nonce to injected styles without the nonce prop
    ✓ passes the nonce prop to the preview iframe
    ...
  ● Puck › should generate the correct state on mount
    expect(received).toMatchSnapshot()
    Snapshot name: `Puck should generate the correct state on mount 1`
    - Snapshot  - 0
    + Received  + 1
          "unregisterNode": [Function],
        },
    +   "nonce": undefined,
        "onAction": undefined,
        "overrides": {},
 › 1 snapshot failed.
Tests:       1 failed, 13 passed, 14 total
Snapshots:   1 failed, 1 passed, 2 total
```

這是 Step 14 預期中的唯一差異：store 多了值為 `undefined` 的 `nonce` key。diff 若還有其他行，停下來檢查，不要更新 snapshot。

- [ ] **Step 17: 更新 snapshot**

不要用 `-u`（避免順手改到其他 snapshot），直接編輯 `packages/core/components/Puck/__tests__/__snapshots__/index.tsx.snap`。原始片段：

```
    "unregisterNode": [Function],
  },
  "onAction": undefined,
```

替換為：

```
    "unregisterNode": [Function],
  },
  "nonce": undefined,
  "onAction": undefined,
```

（pretty-format 依 key 字母排序，`nodes` < `nonce` < `onAction`。）

```bash
cd /Users/kaellim/Desktop/projects/puck/packages/core
pnpm test components/Puck/__tests__/index.tsx
```

預期輸出：

```
PASS components/Puck/__tests__/index.tsx
  Puck
    ✓ root renders
    ✓ should generate the correct state on mount
    ✓ creates a new store every time it is mounted
    ✓ applies min-content height to a plugin selected on mount
    ✓ should index slots on mount
    ✓ injects the default ui styles once per document
    ✓ marks puck-owned styles as non-mirrorable
    ✓ injects iframe interaction styles into a target document
    ✓ sets the nonce prop on the styles it injects into the document
    ✓ does not add a nonce to injected styles without the nonce prop
    ✓ passes the nonce prop to the preview iframe
    ✓ exposes the preview mode on the canvas entry element
    ✓ marks the canvas entry as non-translatable so browser translation can't break drag-and-drop
    ✓ marks the editor chrome root as non-translatable so browser translation can't break chrome re-renders

Test Suites: 1 passed, 1 total
Tests:       14 passed, 14 total
Snapshots:   2 passed, 2 total
```

- [ ] **Step 18: 檢查格式並 commit**

```bash
cd /Users/kaellim/Desktop/projects/puck
pnpm exec prettier --check packages/core/store/index.ts packages/core/components/Puck/index.tsx packages/core/components/Puck/components/Layout/index.tsx packages/core/components/Puck/components/Preview/index.tsx packages/core/components/Puck/__tests__/index.tsx
git add packages/core/store/index.ts packages/core/components/Puck/index.tsx packages/core/components/Puck/components/Layout/index.tsx packages/core/components/Puck/components/Preview/index.tsx packages/core/components/Puck/__tests__/index.tsx packages/core/components/Puck/__tests__/__snapshots__/index.tsx.snap
git status --short
git commit -m "feat: add a nonce prop to Puck for nonce-based CSP"
```

prettier 預期最後一行：`All matched files use Prettier code style!`。

`git status --short` 預期：

```
M  packages/core/components/Puck/__tests__/__snapshots__/index.tsx.snap
M  packages/core/components/Puck/__tests__/index.tsx
M  packages/core/components/Puck/components/Layout/index.tsx
M  packages/core/components/Puck/components/Preview/index.tsx
M  packages/core/components/Puck/index.tsx
M  packages/core/store/index.ts
?? CLAUDE.md
```

`git commit` 預期：

```
[tzuchi/main <hash>] feat: add a nonce prop to Puck for nonce-based CSP
 6 files changed, 92 insertions(+), 2 deletions(-)
```

- [ ] **Step 19: 寫 dnd-kit `StyleInjector` 的失敗測試**

Step 19–21 各寫一個拖放樣式的失敗測試，Step 22 一起執行。先建立目錄：

```bash
mkdir -p /Users/kaellim/Desktop/projects/puck/packages/core/components/DragDropContext/__tests__
```

新增 `packages/core/components/DragDropContext/__tests__/index.spec.tsx`，完整內容。`DragDropProvider` 被替換成記錄 `plugins` 的空殼，再用記下的清單建立真的 `DragDropManager`，確認 dnd-kit 實際套用到 `StyleInjector` 的 options：

```tsx
// @dnd-kit/dom reads ResizeObserver when it is imported, so define it first.
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver =
  ResizeObserverMock as unknown as typeof ResizeObserver;

import { cleanup, render } from "@testing-library/react";
import type { ReactNode } from "react";
import { DragDropManager, StyleInjector } from "@dnd-kit/dom";
import { appStoreContext, createAppStore } from "../../../store";
import { DragDropContext } from "../index";

type ManagerPlugins = NonNullable<
  ConstructorParameters<typeof DragDropManager>[0]
>["plugins"];

const mockProviderPlugins: unknown[] = [];

jest.mock("@dnd-kit/react", () => {
  const original = jest.requireActual("@dnd-kit/react");

  return {
    ...original,
    DragDropProvider: ({
      children,
      plugins,
    }: {
      children: ReactNode;
      plugins: unknown;
    }) => {
      mockProviderPlugins.push(plugins);

      return <>{children}</>;
    },
  };
});

const getStyleInjectorOptions = (nonce?: string) => {
  const appStore = createAppStore({ nonce, status: "READY" });

  render(
    <appStoreContext.Provider value={appStore}>
      <DragDropContext>
        <div />
      </DragDropContext>
    </appStoreContext.Provider>
  );

  const plugins = mockProviderPlugins[mockProviderPlugins.length - 1];
  const manager = new DragDropManager({
    plugins: plugins as ManagerPlugins,
  });
  const options = manager.registry.plugins.get(StyleInjector)?.options;

  manager.destroy();

  return options;
};

describe("DragDropContext", () => {
  afterEach(() => {
    cleanup();
    mockProviderPlugins.length = 0;
  });

  it("passes the nonce to dnd-kit's style injector", () => {
    expect(getStyleInjectorOptions("abc")).toEqual({ nonce: "abc" });
  });

  it("leaves dnd-kit's style injector unconfigured without a nonce", () => {
    expect(getStyleInjectorOptions()).toBeUndefined();
  });
});
```

（`status: "READY"` 是因為 `DragDropContext` 在 `LOADING` 時不會渲染 `DragDropProvider`。jest 允許 `jest.mock` 的 factory 引用以 `mock` 開頭的變數。）

- [ ] **Step 20: 寫 `useDropAnimation` 的失敗測試**

新增 `packages/core/components/DragDropContext/__tests__/use-drop-animation.spec.tsx`，完整內容：

```tsx
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import type { DropAnimationFunction } from "@dnd-kit/dom";
import { createStore } from "zustand";
import { appStoreContext, createAppStore } from "../../../store";
import type { ZoneStore } from "../../DropZone/context";
import { runDropAnimation } from "../../../lib/dnd/drop-animation";
import { useDropAnimation } from "../use-drop-animation";

jest.mock("../../../lib/dnd/drop-animation", () => ({
  runDropAnimation: jest.fn(),
}));

type DropAnimationContext = Parameters<DropAnimationFunction>[0];

const createZoneStore = () =>
  createStore<ZoneStore>(() => ({
    zoneDepthIndex: {},
    nextZoneDepthIndex: {},
    areaDepthIndex: {},
    nextAreaDepthIndex: {},
    draggedItem: null,
    previewIndex: {
      "root:default-zone": {
        componentType: "componentA",
        index: 0,
        zone: "root:default-zone",
        props: { id: "new-item" },
        type: "insert",
        element: undefined,
      },
    },
    enabledIndex: {},
    hoveringComponent: null,
    registerRootVirtualizer: () => {},
    unregisterRootVirtualizer: () => {},
    scrollToComponent: () => {},
  }));

const runWithNonce = (nonce?: string) => {
  const appStore = createAppStore({ nonce });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <appStoreContext.Provider value={appStore}>
      {children}
    </appStoreContext.Provider>
  );

  const { result } = renderHook(() => useDropAnimation(createZoneStore()), {
    wrapper,
  });

  const context = {} as DropAnimationContext;

  result.current(context);

  return jest.mocked(runDropAnimation).mock.calls[0];
};

describe("useDropAnimation", () => {
  afterEach(() => {
    jest.mocked(runDropAnimation).mockClear();
  });

  it("passes the store nonce to the drop animation", () => {
    const [, target] = runWithNonce("abc");

    expect(target).toMatchObject({
      targetZone: "root:default-zone",
      nonce: "abc",
    });
  });

  it("passes no nonce when the store has none", () => {
    const [, target] = runWithNonce();

    expect(target).toMatchObject({ targetZone: "root:default-zone" });
    expect(target?.nonce).toBeUndefined();
  });
});
```

- [ ] **Step 21: 寫放下動畫 hide `<style>` 的失敗測試**

編輯既有的 `packages/core/lib/dnd/__tests__/drop-animation.spec.ts`。原始片段（檔案結尾，既有測試的最後幾行）：

```ts
      { duration: 250, easing: "ease", fill: "forwards" }
    );
  });
});
```

替換為：

```ts
      { duration: 250, easing: "ease", fill: "forwards" }
    );
  });

  const getHideStyleNonces = (nonce?: string) => {
    const zone = document.createElement("div");
    const feedback = document.createElement("div");

    zone.setAttribute("data-puck-dropzone", "root:slot");
    document.body.append(zone, feedback);
    document.head.innerHTML = "";
    feedback.getBoundingClientRect = () => rect(300);

    runTargetDropAnimation({
      feedbackElement: feedback,
      targetZone: "root:slot",
      getExpectedOrder: () => [],
      nonce,
    });

    return Array.from(document.head.querySelectorAll("style")).map((el) =>
      el.getAttribute("nonce")
    );
  };

  it("sets the nonce on the style that hides the dropped item", () => {
    expect(getHideStyleNonces("abc")).toEqual(["abc"]);
  });

  it("does not add a nonce to the hide style without a nonce", () => {
    expect(getHideStyleNonces()).toEqual([null]);
  });
});
```

（該檔已 mock `getFrame` 回傳 `document`，並在 `beforeEach` 準備 `matchMedia`、`requestAnimationFrame` 與 `animate`；`runTargetDropAnimation` 會同步把 hide `<style>` 接到 `document.head`。）

- [ ] **Step 22: 執行 Step 19–21 的測試，確認失敗**

```bash
cd /Users/kaellim/Desktop/projects/puck/packages/core
pnpm test components/DragDropContext lib/dnd/__tests__/drop-animation.spec.ts
```

預期失敗（節錄；同時跑多個檔案時 jest 不列出逐項測試）：

```
FAIL components/DragDropContext/__tests__/index.spec.tsx
  ● DragDropContext › passes the nonce to dnd-kit's style injector
    Expected: {"nonce": "abc"}
    Received: undefined
FAIL components/DragDropContext/__tests__/use-drop-animation.spec.tsx
  ● useDropAnimation › passes the store nonce to the drop animation
    -   "nonce": "abc",
        "targetZone": "root:default-zone",
FAIL lib/dnd/__tests__/drop-animation.spec.ts
  ● runTargetDropAnimation › sets the nonce on the style that hides the dropped item
    -   "abc",
    +   null,
Test Suites: 3 failed, 3 total
Tests:       3 failed, 4 passed, 7 total
```

（檔案順序可能不同。3 個「沒有 nonce」的測試與既有的 drop animation 測試已經通過。）

- [ ] **Step 23: 放下動畫的 hide `<style>` 帶上 nonce**

編輯 `packages/core/lib/dnd/drop-animation.ts`，共 4 處。

(a) 原始片段：

```ts
import { getComponentSelector } from "../dom-selectors";
```

替換為：

```ts
import { getComponentSelector } from "../dom-selectors";
import { applyNonce } from "../use-inject-css";
```

(b) 原始片段：

```ts
type TargetDrop = {
  itemId?: string;
  targetZone: string;
  getExpectedOrder: () => string[];
};
```

替換為：

```ts
type TargetDrop = {
  itemId?: string;
  targetZone: string;
  getExpectedOrder: () => string[];
  nonce?: string;
};
```

(c) 原始片段（`runTargetDropAnimation` 的參數）：

```ts
  targetZone,
  getExpectedOrder,
}: {
  feedbackElement: HTMLElement;
  itemId?: string;
  targetZone: string;
  getExpectedOrder: () => string[];
}) => {
```

替換為：

```ts
  targetZone,
  getExpectedOrder,
  nonce,
}: {
  feedbackElement: HTMLElement;
  itemId?: string;
  targetZone: string;
  getExpectedOrder: () => string[];
  nonce?: string;
}) => {
```

(d) 原始片段：

```ts
  const hideStyle = targetDoc.createElement("style");
  hideStyle.textContent = `
```

替換為：

```ts
  const hideStyle = targetDoc.createElement("style");
  applyNonce(hideStyle, nonce);
  hideStyle.textContent = `
```

`runDropAnimation` 以 `{ ...target, feedbackElement }` 呼叫 `runTargetDropAnimation`，所以 `TargetDrop` 多了 `nonce` 之後會自動傳下去，不必改 `runDropAnimation` 本身。

編輯 `packages/core/components/DragDropContext/use-drop-animation.ts`，原始片段：

```ts
              getExpectedOrder: () =>
                getZoneContentIds(appStore.getState().state, preview.zone),
            }
```

替換為：

```ts
              getExpectedOrder: () =>
                getZoneContentIds(appStore.getState().state, preview.zone),
              nonce: appStore.getState().nonce,
            }
```

- [ ] **Step 24: dnd-kit 的 StyleInjector 帶上 nonce**

編輯 `packages/core/components/DragDropContext/index.tsx`，共 3 處。

(a) 原始片段：

```tsx
import { AutoScroller, defaultPreset, DragDropManager } from "@dnd-kit/dom";
```

替換為：

```tsx
import {
  AutoScroller,
  defaultPreset,
  DragDropManager,
  StyleInjector,
} from "@dnd-kit/dom";
```

(b) 原始片段（`DragDropContextClient` 開頭）：

```tsx
  const instanceId = useAppStore((s) => s.instanceId);
  const appStore = useAppStoreApi();
```

替換為：

```tsx
  const instanceId = useAppStore((s) => s.instanceId);
  const nonce = useAppStore((s) => s.nonce);
  const appStore = useAppStoreApi();
```

(c) 原始片段（`const [plugins] = useState(() => [` 之內）：

```tsx
      : defaultPreset.plugins),
    createNestedDroppablePlugin(
```

替換為：

```tsx
      : defaultPreset.plugins),
    // dnd-kit always registers its StyleInjector. Listing it again with
    // options only sets the CSP nonce on that instance.
    ...(nonce ? [StyleInjector.configure({ nonce })] : []),
    createNestedDroppablePlugin(
```

plugin 清單只在第一次渲染時建立（`useState` 的 initializer），之後 nonce 改變不會更新 dnd-kit；同一頁面的 nonce 不會改變，這是可接受的限制。

- [ ] **Step 25: 執行測試，確認通過，並檢查格式**

```bash
cd /Users/kaellim/Desktop/projects/puck/packages/core
pnpm test components/DragDropContext lib/dnd/__tests__/drop-animation.spec.ts
```

預期輸出（檔案順序可能不同）：

```
PASS components/DragDropContext/__tests__/index.spec.tsx
PASS components/DragDropContext/__tests__/use-drop-animation.spec.tsx
PASS lib/dnd/__tests__/drop-animation.spec.ts

Test Suites: 3 passed, 3 total
Tests:       7 passed, 7 total
Snapshots:   0 total
```

```bash
cd /Users/kaellim/Desktop/projects/puck
pnpm exec prettier --check packages/core/lib/dnd/drop-animation.ts packages/core/lib/dnd/__tests__/drop-animation.spec.ts packages/core/components/DragDropContext/index.tsx packages/core/components/DragDropContext/use-drop-animation.ts packages/core/components/DragDropContext/__tests__/index.spec.tsx packages/core/components/DragDropContext/__tests__/use-drop-animation.spec.tsx
```

預期最後一行：`All matched files use Prettier code style!`。

- [ ] **Step 26: Commit**

```bash
cd /Users/kaellim/Desktop/projects/puck
git add packages/core/lib/dnd/drop-animation.ts packages/core/lib/dnd/__tests__/drop-animation.spec.ts packages/core/components/DragDropContext/index.tsx packages/core/components/DragDropContext/use-drop-animation.ts packages/core/components/DragDropContext/__tests__/index.spec.tsx packages/core/components/DragDropContext/__tests__/use-drop-animation.spec.tsx
git status --short
git commit -m "feat: set the CSP nonce on drag-and-drop styles"
```

`git status --short` 預期：

```
A  packages/core/components/DragDropContext/__tests__/index.spec.tsx
A  packages/core/components/DragDropContext/__tests__/use-drop-animation.spec.tsx
M  packages/core/components/DragDropContext/index.tsx
M  packages/core/components/DragDropContext/use-drop-animation.ts
M  packages/core/lib/dnd/__tests__/drop-animation.spec.ts
M  packages/core/lib/dnd/drop-animation.ts
?? CLAUDE.md
```

`git commit` 預期：

```
[tzuchi/main <hash>] feat: set the CSP nonce on drag-and-drop styles
 6 files changed, 200 insertions(+), 1 deletion(-)
 create mode 100644 packages/core/components/DragDropContext/__tests__/index.spec.tsx
 create mode 100644 packages/core/components/DragDropContext/__tests__/use-drop-animation.spec.tsx
```

- [ ] **Step 27: 寫 tiptap 基本樣式的失敗測試**

tiptap 的 `useEditor` 預設 `injectCSS: true`，會在主文件 `<head>` 注入一個 `<style data-tiptap-style>`（ProseMirror 基本樣式），而且只在拿到 `injectNonce` 時才設定 nonce（設計說明第 4 點）。Task 7 已在這個目錄新增 `stable-stringify.spec.ts`；`mkdir -p` 在目錄已存在時不做任何事：

```bash
mkdir -p /Users/kaellim/Desktop/projects/puck/packages/core/components/RichTextEditor/lib/__tests__
```

新增 `packages/core/components/RichTextEditor/lib/__tests__/use-synced-editor-nonce.spec.tsx`，完整內容：

```tsx
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { Document } from "@tiptap/extension-document";
import { Paragraph } from "@tiptap/extension-paragraph";
import { Text } from "@tiptap/extension-text";
import { appStoreContext, createAppStore } from "../../../../store";
import { useSyncedEditor } from "../use-synced-editor";

const tiptapStyleSelector = "style[data-tiptap-style]";

const renderEditor = async (nonce?: string) => {
  const appStore = createAppStore({ nonce });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <appStoreContext.Provider value={appStore}>
      {children}
    </appStoreContext.Provider>
  );

  const { result } = renderHook(
    () =>
      useSyncedEditor({
        content: "",
        onChange: () => {},
        extensions: [Document, Paragraph, Text],
        name: "text",
      }),
    { wrapper }
  );

  // immediatelyRender is false, so the editor is created in an effect
  await waitFor(() => expect(result.current).not.toBeNull());

  return document.head.querySelector<HTMLStyleElement>(tiptapStyleSelector);
};

describe("useSyncedEditor", () => {
  afterEach(() => {
    cleanup();

    // tiptap reuses an existing style tag, so remove it between tests
    document.head.querySelectorAll(tiptapStyleSelector).forEach((el) => {
      el.remove();
    });
  });

  it("sets the store nonce on the style tiptap injects", async () => {
    const style = await renderEditor("abc");

    expect(style?.getAttribute("nonce")).toBe("abc");
    expect(style?.nonce).toBe("abc");
  });

  it("does not add a nonce to the tiptap style without a store nonce", async () => {
    const style = await renderEditor();

    expect(style).not.toBeNull();
    expect(style?.hasAttribute("nonce")).toBe(false);
  });
});
```

`content: ""` 在 Task 7 之前與之後的 `useSyncedEditor` 都是合法輸入（Task 7 之後會正規化成空段落）。tiptap 在同一份文件只建立一個 `<style data-tiptap-style>`，後來的編輯器沿用它，所以 `afterEach` 先卸載編輯器，再移除這個 `<style>`，讓第二個測試看到的是自己建立的那一個。

- [ ] **Step 28: 執行測試，確認失敗**

```bash
cd /Users/kaellim/Desktop/projects/puck/packages/core
pnpm test components/RichTextEditor/lib/__tests__/use-synced-editor-nonce.spec.tsx
```

預期失敗（節錄）：

```
FAIL components/RichTextEditor/lib/__tests__/use-synced-editor-nonce.spec.tsx
  useSyncedEditor
    ✕ sets the store nonce on the style tiptap injects
    ✓ does not add a nonce to the tiptap style without a store nonce
  ● useSyncedEditor › sets the store nonce on the style tiptap injects
    expect(received).toBe(expected) // Object.is equality
    Expected: "abc"
    Received: null
Test Suites: 1 failed, 1 total
Tests:       1 failed, 1 passed, 2 total
```

「沒有 nonce」的測試已經通過，實作後也必須維持通過。

- [ ] **Step 29: 把 store 的 nonce 交給 tiptap**

編輯 `packages/core/components/RichTextEditor/lib/use-synced-editor.ts`，原始片段（`useEditor({ … })` 的選項之一；整個檔案只有這一行）：

```ts
    immediatelyRender: false,
```

替換為：

```ts
    immediatelyRender: false,
    injectNonce: appStoreApi.getState().nonce,
```

`appStoreApi`（`const appStoreApi = useAppStoreApi();`）在 `useEditor` 之前就已宣告。若 `git grep -n "immediatelyRender: false," packages/core/components/RichTextEditor/lib/use-synced-editor.ts` 不是恰好一行，或 `appStoreApi` 的宣告不在 `useEditor` 之前，停下來回報。tiptap 只在建立編輯器時讀取 `injectNonce`，與 dnd-kit 的 plugin 清單一樣，nonce 在頁面存續期間不會改變。

- [ ] **Step 30: 執行測試，確認通過，並檢查格式**

```bash
cd /Users/kaellim/Desktop/projects/puck/packages/core
pnpm test components/RichTextEditor/lib/__tests__/use-synced-editor-nonce.spec.tsx
```

預期輸出：

```
PASS components/RichTextEditor/lib/__tests__/use-synced-editor-nonce.spec.tsx
  useSyncedEditor
    ✓ sets the store nonce on the style tiptap injects
    ✓ does not add a nonce to the tiptap style without a store nonce

Test Suites: 1 passed, 1 total
Tests:       2 passed, 2 total
Snapshots:   0 total
```

```bash
cd /Users/kaellim/Desktop/projects/puck
pnpm exec prettier --check packages/core/components/RichTextEditor/lib/use-synced-editor.ts packages/core/components/RichTextEditor/lib/__tests__/use-synced-editor-nonce.spec.tsx
```

預期最後一行：`All matched files use Prettier code style!`。

- [ ] **Step 31: Commit**

```bash
cd /Users/kaellim/Desktop/projects/puck
git add packages/core/components/RichTextEditor/lib/use-synced-editor.ts packages/core/components/RichTextEditor/lib/__tests__/use-synced-editor-nonce.spec.tsx
git status --short
git commit -m "feat: set the CSP nonce on the rich text editor's base styles"
```

`git status --short` 預期：

```
A  packages/core/components/RichTextEditor/lib/__tests__/use-synced-editor-nonce.spec.tsx
M  packages/core/components/RichTextEditor/lib/use-synced-editor.ts
?? CLAUDE.md
```

`git commit` 預期：

```
[tzuchi/main <hash>] feat: set the CSP nonce on the rich text editor's base styles
 2 files changed, 60 insertions(+)
 create mode 100644 packages/core/components/RichTextEditor/lib/__tests__/use-synced-editor-nonce.spec.tsx
```

- [ ] **Step 32: 在 CHANGELOG 記錄並 commit**

Task 5–11 可能已在清單尾端加了幾行，所以不以「最後一行」作為原始片段，而是插在清單後的空行與 `## [0.23.0]` 標題之前。先確認標題只出現一次：

```bash
cd /Users/kaellim/Desktop/projects/puck
grep -c '^## \[0\.23\.0\]' CHANGELOG.md
```

預期輸出 `1`。插入一行：

```bash
perl -0pi -e 's/\n\n## \[0\.23\.0\]/\n* add an optional `nonce` prop to `<Puck>`; it is set on the editor UI styles, the iframe interaction styles, the drag-and-drop styles, the base styles of the rich text editor and the host styles that already carry the nonce when they are mirrored into the preview iframe, so the editor can run under a nonce-based `style-src` Content Security Policy\n\n## [0.23.0]/' CHANGELOG.md
git diff --numstat CHANGELOG.md
git diff -U0 CHANGELOG.md | grep -E '^[-+][^-+]' | cut -c1-45
```

預期：

```
1	0	CHANGELOG.md
+* add an optional `nonce` prop to `<Puck>`; 
```

只新增一行、沒有刪除任何一行。再確認新行緊接在清單最後、空行與 `## [0.23.0]` 之前：

```bash
grep -n -A2 '^\* add an optional `nonce` prop' CHANGELOG.md | cut -c1-60
```

預期（行號會依 Task 5–11 加的行數而不同）：

```
<n>:* add an optional `nonce` prop to `<Puck>`; it is set on 
<n+1>-
<n+2>-## [0.23.0](/compare/v0.22.4...v0.23.0) (2026-08-07)
```

`CHANGELOG.md` 在 `.prettierignore` 中，不受 `format:check` 檢查。Commit：

```bash
git add CHANGELOG.md
git status --short
git commit -m "docs: record the nonce prop in the changelog"
```

`git status --short` 預期：

```
M  CHANGELOG.md
?? CLAUDE.md
```

`git commit` 預期：

```
[tzuchi/main <hash>] docs: record the nonce prop in the changelog
 1 file changed, 1 insertion(+)
```

- [ ] **Step 33: 跑 core 全部測試，並檢查新測試檔的型別**

```bash
cd /Users/kaellim/Desktop/projects/puck
pnpm --filter @tzuchi/tceditor test 2>&1 | grep -E "Test Suites:|Tests:|Snapshots:"
```

預期：全部通過、0 個失敗。與 Task 11 結束時相比，多 5 個 suite、25 個測試（8 + 6 + 3 + 2 + 2 + 2 + 2），snapshot 數不變。依序執行完 Task 1–12 時是 `Test Suites: 80 passed, 80 total`、`Tests:       691 passed, 691 total`、`Snapshots:   19 passed, 19 total`（全域審查以計畫重播驗證）。在 Task 4 的結果上驗證時是：

```
Test Suites: 58 passed, 58 total
Tests:       308 passed, 308 total
Snapshots:   19 passed, 19 total
```

`pnpm typecheck` 不檢查測試檔，所以另外用完整 tsconfig 檢查本 task 碰到的測試檔（該 tsconfig 對其他既有測試與 `tsup.config.ts` 有既存的錯誤，這裡只計算本 task 的檔案）：

```bash
cd /Users/kaellim/Desktop/projects/puck/packages/core
pnpm exec tsc --noEmit -p tsconfig.json 2>&1 | grep -cE "use-inject-css\.spec|AutoFrame/__tests__|DragDropContext/__tests__|drop-animation\.spec|Puck/__tests__/index\.tsx|use-synced-editor" || true
```

預期輸出 `0`，費時數秒到數十秒。沒有匹配時 `grep -c` 會印出 `0` 並以 exit code 1 結束，結尾的 `|| true` 讓整行以 0 結束；判斷成功只看印出的數字是不是 `0`。

- [ ] **Step 34: 完整驗證**

```bash
cd /Users/kaellim/Desktop/projects/puck
pnpm verify > "${TMPDIR:-/tmp}/tceditor-verify-task12.log" 2>&1
echo "exit=$?"
grep -E "Test Suites:|Tests:|Snapshots:|ℹ (tests|pass|fail)|> tsc|✖|Tasks:|All matched|^pnpm audit:|^GATED|^audit:gate (passed|FAILED)" "${TMPDIR:-/tmp}/tceditor-verify-task12.log"
```

在 Task 4 的結果上驗證時的輸出（當時 `verify` 還沒有 Task 8 的 `check:bundle`）：

```
exit=0
@tzuchi/tceditor:test: Test Suites: 58 passed, 58 total
@tzuchi/tceditor:test: Tests:       308 passed, 308 total
@tzuchi/tceditor:test: Snapshots:   19 passed, 19 total
 Tasks:    1 successful, 1 total
ℹ tests 10
ℹ pass 10
ℹ fail 0
> tsc -p tsconfig.typecheck.json
demo:lint: ✖ 8 problems (0 errors, 8 warnings)
@tzuchi/tceditor:lint: ✖ 4 problems (0 errors, 4 warnings)
 Tasks:    3 successful, 3 total
All matched files use Prettier code style!
 Tasks:    3 successful, 3 total
pnpm audit: 69 advisories, 71 finding path(s). 104 package versions ship with packages/core, packages/plugin-heading-analyzer.
GATED (ships with a published package): 0 finding(s)
audit:gate passed: no advisories affect packages/core, packages/plugin-heading-analyzer (71 finding path(s) elsewhere are listed above).
```

依序執行完 Task 1–12 時，jest 為 80 個 suite／691 個測試／19 個 snapshot，`ℹ tests 13`，多一行 `check:bundle passed: 23 files reachable …`，`105 package versions`（全域審查以計畫重播驗證）。在你的環境，advisory 數會隨資料庫更新而不同。必須成立的是：`exit=0`；jest 比 Task 11 結束時多 5 個 suite、25 個測試且 0 個失敗；lint 為 `0 errors`，警告數與 Task 11 結束時相同（本 task 不新增警告）；`GATED … 0 finding(s)` 與 `audit:gate passed`；Task 8 的 `check:bundle` 照該 task 所列通過。

確認 `nonce` 有進入公開型別與打包結果：

```bash
grep -c "nonce?: string;" packages/core/dist/index.d.ts
grep -c 'setAttribute("nonce"' packages/core/dist/*.mjs | grep -v ':0$'
grep -c "injectNonce: appStoreApi" packages/core/dist/*.mjs | grep -v ':0$'
```

在 Task 4 的結果上驗證時的輸出：

```
1
packages/core/dist/index.mjs:1
packages/core/dist/Editor-KNL7TYEL.mjs:1
```

第一行是 `PuckProps.nonce`。第二個指令列出含有 `applyNonce` 實作的 ESM 檔：其他呼叫處都經由 `applyNonce`，所以必須恰好一行、計數為 `1`（dnd-kit 與 tiptap 是外部依賴，不會打包進來）。第三個指令列出含有 `useSyncedEditor` 的 ESM 檔，必須恰好一行、計數為 `1`；rich text 編輯器是延遲載入的，所以在 `Editor-<hash>.mjs`。tsup 產生的檔名 hash 會隨內容改變，Task 8 新增入口後共用程式碼也可能被拆進 `chunk-*.mjs`，檔名不同沒有關係。若第一個指令大於 1，表示 Task 5–11 也在公開型別中加了同名欄位，用 `grep -n -B8 "nonce?: string;" packages/core/dist/index.d.ts` 確認其中一處緊接在 `height?: CSSProperties["height"];` 與本 task 的註解之後即可。

- [ ] **Step 35: 確認 commit 與工作目錄**

```bash
cd /Users/kaellim/Desktop/projects/puck
git log --oneline -7
git status --short
```

預期（hash 在你的環境會不同；最後一行是 Task 11 的最後一個 commit）：

```
<hash> docs: record the nonce prop in the changelog
<hash> feat: set the CSP nonce on the rich text editor's base styles
<hash> feat: set the CSP nonce on drag-and-drop styles
<hash> feat: add a nonce prop to Puck for nonce-based CSP
<hash> feat: set the CSP nonce on styles AutoFrame injects and mirrors
<hash> feat: set a CSP nonce on the styles injected by use-inject-css
<hash> docs: record the Object.prototype member name fix in the changelog
?? CLAUDE.md
```

本 task 的 6 個 commit 都已完成，不需要另外 commit。`dist/`、`node_modules/` 與 `.turbo/` 已被 gitignore，不會出現在 `git status`。

### Task 13: 自架 Supabase 開發環境

目的：在 `infra/supabase/` 建立 tceditor 專用的自架 Supabase（規格 §7、§9 第 12 項）。基底是官方 `supabase/supabase` repo 在 ref `a4be1674911d863d55d351d245fba8e83b62dc76` 的 `docker/` 目錄（與 tciam 同一個 ref，映像檔本機都已存在），以一個 compose override 改成 `tceditor` 專案、`tceditor-*` container 名稱、只綁 `127.0.0.1` 的 port，不含 logs 子系統。另外提供 `setup-env.sh`、`up.sh`、`down.sh`、`reset.sh` 四個腳本與一份 README。本 task 不改任何套件程式碼，共 6 個 commit。

**執行位置與安全規則**：

- 在主工作目錄 `/Users/kaellim/Desktop/projects/puck`（分支 `tzuchi/main`）執行。每個指令區塊開頭都有 `cd` 與需要的變數，可以在新的 shell 中單獨執行。
- 本機另有其他 Supabase stack，**一律不得操作**：tciam（running(17)，佔用 `127.0.0.1` 的 3100、3300、5433、6544、8100、8101、9100）、tcdata（可能在執行，佔用 `0.0.0.0` 的 8000、5432、6543）、weekly（已停止，但留有 `supabase-*` 與 `realtime-dev.supabase-realtime` 這些 container 名稱）、en、odoo。因為 weekly 佔用了官方預設的 container 名稱，override 必須替每個服務明確指定 `container_name`。
- 只能用本 task 的腳本或 `docker compose -p tceditor ...` 操作 `tceditor` 專案。不要執行 `infra/supabase/docker/` 裡官方的 `reset.sh`（它會以專案名 `supabase` 操作，並重設 `.env`）。
- 不要 kill 自己沒有啟動的程序；Step 16 的佔位程序只能以 `$!` 記下的 PID 結束。
- commit 時一律明確列出路徑，不要用 `git add -A`（根目錄有不屬於本 task 的未追蹤 `CLAUDE.md`）。

**規格偏離（請 orchestrator 向使用者說明）：**

1. 規格 §7 的 port 表寫 API gateway 綁 `8200、8201`（比照 tciam 的 8100、8101）。官方 base 的 Envoy 只有一個 listener（容器 8000），API 與 Studio 都由它提供，Studio 走 `/` 並以 dashboard 帳密做 basic auth。tciam 的第二個 port 來自它自訂的 `lds.tciam.template.yaml`（公網白名單 listener），tceditor 沒有這個需求，所以只綁 `127.0.0.1:8200`，不使用 8201。
2. 規格 §9 第 12 項寫「以 anon key 呼叫 `http://127.0.0.1:8200/rest/v1/` 回應正常」。官方 Envoy 設定只允許 `SERVICE_ROLE_KEY` 讀 `/rest/v1/` 根路徑（OpenAPI 描述），anon key 會得到 `403 RBAC: access denied`，這是官方的安全設定。驗證改為：不帶 key 得到 401、anon key 讀根路徑得到 403、service_role key 讀根路徑得到 200，以及 anon key 讀一個暫時建立的資料表 `/rest/v1/tceditor_smoke` 得到 200 `[]`（驗完即刪表）。另外以 anon key 呼叫 `/auth/v1/settings` 得到 200，並以 email 註冊確認自動確認已生效。
3. `API_EXTERNAL_URL` 依官方語意設為 `http://127.0.0.1:8200/auth/v1`（含 `/auth/v1`，與 tciam 相同）；`SUPABASE_PUBLIC_URL` 與 `SITE_URL` 為 `http://127.0.0.1:8200`。`SITE_URL` 之後串接前端時要改成前端網址（已寫進 README）。
4. 官方的 `docker/.gitignore` 忽略 `.supabase-version`。本 repo 以 `git add -f` 提交它，因為 vendored 目錄的基準版本對所有 clone 都相同，之後官方 `update.sh` 做三方合併時需要它。官方 repo 中位在被忽略目錄裡的 `volumes/storage/.gitkeep`、`volumes/snippets/.gitkeep` 不進版控；這兩個目錄由 Docker 在啟動時自動建立（已驗證）。
5. 規格以外新增的檔案：`infra/supabase/setup-env.sh`、`infra/supabase/lib.sh`（三個腳本共用的函式）、`infra/supabase/.gitignore`、`infra/supabase/README.md`、`infra/supabase/LICENSE`，以及 `.prettierignore` 加入 `infra/supabase/docker/`。不加這一行的話，`pnpm format:check` 會因為 5 個官方檔案而失敗。`LICENSE` 是官方 repo 根目錄在同一個 ref 的 Apache License 2.0 全文（逐字複製）：vendored 的官方檔案以 Apache-2.0 授權，依 §4(a) 必須附上授權全文，而 Task 2 根目錄 `NOTICE` 所說的 MIT 授權不涵蓋這些檔案。官方 repo 根目錄沒有 `NOTICE` 檔，所以不需要另外附。授權檔放在 `docker/` 外面，vendored 目錄因此仍與官方逐字相同。根目錄 `NOTICE` 不改，因為 Task 2 的測試要求兩個套件內的副本與根目錄逐位元組相同。
6. Port 變數：gateway 用官方的 `API_GW_HTTP_PORT=8200`；transaction pooler 用官方的 `POOLER_PROXY_PORT_TRANSACTION=6545`（官方語意本來就是 host port）；session 模式新增 `POSTGRES_HOST_PORT=5434`，因為官方的 `POSTGRES_PORT` 同時是容器內部的 port，必須維持 5432。`POOLER_TENANT_ID=tceditor`，所以經 Supavisor 連線的使用者是 `postgres.tceditor`。
7. `reset.sh` 刪除 `tceditor` 專案的 container、named volume，以及 `docker/volumes/db/data`、`docker/volumes/storage`（與官方 reset 清的資料目錄相同），保留 `docker/.env` 與 Studio 的 `volumes/snippets`。
8. 只用官方 `utils/generate-keys.sh` 產生傳統的 HS256 金鑰；沒有執行 `utils/add-new-auth-keys.sh`（ES256 與 `sb_` 開頭的新式 API key），Envoy 以 legacy API key 模式運作。S3 再決定是否啟用。
9. Task 13 結束時 stack 為停止狀態（資料保留），以免在 4 CPU／16 GB 的機器上和 tciam、tcdata 長時間搶資源；需要時執行 `infra/supabase/up.sh`。實測 tceditor 的 11 個 container 約佔 1.1 GiB 記憶體。

**Files:**

- Create:
  - `infra/supabase/docker/`：官方 `docker/` 目錄逐字複製（64 個檔案，其中 62 個進版控）
  - `infra/supabase/docker/.supabase-version`（以 `git add -f` 進版控）
  - `infra/supabase/LICENSE`：官方 repo 根目錄 `LICENSE`（Apache License 2.0）逐字複製
  - `infra/supabase/docker/docker-compose.tceditor.yml`
  - `infra/supabase/.gitignore`
  - `infra/supabase/setup-env.sh`、`infra/supabase/lib.sh`、`infra/supabase/up.sh`、`infra/supabase/down.sh`、`infra/supabase/reset.sh`
  - `infra/supabase/README.md`
- Modify: `.prettierignore`
- 執行時產生、不進版控：`infra/supabase/docker/.env`（權限 600）、`infra/supabase/docker/volumes/db/data/`、`infra/supabase/docker/volumes/storage/`、`infra/supabase/docker/volumes/snippets/`
- Test：沒有 jest 測試，以 shell 指令驗證。每個產出都先跑一個會失敗的檢查，再建立檔案確認通過：`format:check`（Step 5→6）、`.env`（Step 9→10）、compose 合併結果（Step 12→13）、shell 中 export 的變數不得蓋過 `.env`（Step 15，先以裸 `docker compose` 重現問題，再確認經 `lib.sh` 時不受影響）、port 被佔用時拒絕啟動（Step 16→17）、`reset.sh` 未確認時不刪除（Step 27→28）。規格 §9 第 12 項的驗證在 Step 19–25、28。所有指令都已在暫存 worktree 中以 zsh 實際執行過（實際啟動時專案名臨時改為 `tceditor-plancheck`；`lib.sh` 修正後再以 `tceditor-fixcheck` 在 shell 中 export 錯誤的 `SITE_URL`、`POSTGRES_PASSWORD`、`JWT_SECRET`、`COMPOSE_PROJECT_NAME` 完整跑過 up、REST、Auth、兩個 Postgres port、down、reset，container 內的值都來自 `.env`；驗證後已完全移除）。

**Interfaces:**

- Consumes（Task 1）：
  - 根目錄 script `"format:check": "prettier --check \"**/*.{ts,tsx,mjs,md,mdx,css}\""`。
  - `.prettierignore` 中的段落 `# Design specs and implementation plans are working documents, not shipped docs` / `docs/superpowers/`（Step 6 在它後面插入新段落）。
  - 不依賴 Task 2–12 的任何程式碼或名稱。
- Produces（Task 14 與 S3 依賴）：
  - 指令：`infra/supabase/setup-env.sh`、`infra/supabase/up.sh`、`infra/supabase/down.sh`、`infra/supabase/reset.sh [--yes]`。可以從任何目錄執行。
  - compose 專案 `tceditor`；11 個 container：`tceditor-api-gw`、`tceditor-auth`、`tceditor-db`、`tceditor-functions`、`tceditor-imgproxy`、`tceditor-meta`、`tceditor-realtime`、`tceditor-rest`、`tceditor-storage`、`tceditor-studio`、`tceditor-supavisor`；volume `tceditor_db-config`、`tceditor_deno-cache`；網路 `tceditor_default`（Realtime 在網路內的別名是 `realtime-dev.supabase-realtime`）。
  - 端點：`http://127.0.0.1:8200`（API gateway，同時提供 Studio）、`127.0.0.1:5434`（Postgres，Supavisor session 模式）、`127.0.0.1:6545`（Postgres，transaction 模式）；資料庫使用者 `postgres.tceditor`。
  - `infra/supabase/docker/.env` 的鍵：`ANON_KEY`、`SERVICE_ROLE_KEY`、`JWT_SECRET`、`POSTGRES_PASSWORD`、`DASHBOARD_USERNAME`（`supabase`）、`DASHBOARD_PASSWORD`、`SUPABASE_PUBLIC_URL=http://127.0.0.1:8200`、`API_EXTERNAL_URL=http://127.0.0.1:8200/auth/v1`、`SITE_URL=http://127.0.0.1:8200`、`ENABLE_EMAIL_AUTOCONFIRM=true`。讀取方式：`sed -n 's/^ANON_KEY=//p' infra/supabase/docker/.env`。
  - `infra/supabase/README.md`：Task 14 的根目錄 `README.md`、`CLAUDE.md` 在「如何啟動 Supabase」處連到這份文件。
  - `infra/supabase/LICENSE`：`infra/supabase/docker/` 官方檔案的 Apache-2.0 授權。Task 14 若在文件中說明 repo 的授權，要註明 `infra/supabase/docker/` 不在根目錄 MIT 授權範圍內。
  - 結束狀態：stack 已停止、資料保留、`.env` 存在。

- [ ] **Step 1: 前置檢查（唯讀）**

```sh
cd /Users/kaellim/Desktop/projects/puck
git status --short
docker info --format '{{.ServerVersion}}'
docker compose version --short
for t in jq expect lsof nc openssl python3; do command -v "$t" >/dev/null 2>&1 && echo "$t ok" || echo "$t MISSING"; done
docker compose ls
for p in 8200 5434 6545; do lsof -nP -iTCP:$p -sTCP:LISTEN >/dev/null 2>&1 && echo "port $p BUSY" || echo "port $p free"; done
docker ps -a --format '{{.Names}}' | grep '^tceditor-' || echo "no tceditor containers"
test ! -e infra && echo "infra/ does not exist yet"
```

預期（版本號可能不同）：

```
?? CLAUDE.md
29.0.1
2.40.3-desktop.1
jq ok
expect ok
lsof ok
nc ok
openssl ok
python3 ok
NAME                STATUS              CONFIG FILES
tcdata              running(12)         ...
tciam               running(17)         /Users/kaellim/Desktop/projects/LDAP/deploy/supabase/docker/docker-compose.yml,...
port 8200 free
port 5434 free
port 6545 free
no tceditor containers
infra/ does not exist yet
```

判斷條件：

- `docker compose version` 必須 ≥ 2.24.4（override 用到 `!override`）；工具檢查的 6 行都必須是 `ok`（`command -v` 對 shell alias 也算找到，例如 `alias python3=python3.11`），只要出現 `MISSING` 就停下來回報。
- 記下 `tciam` 那一行的 STATUS（規格預期 `running(17)`）。Step 24 與 Step 31 要確認它完全沒變。tcdata、weekly 等其他 stack 是什麼狀態都可以，不要去動。
- 三個 port 必須都是 `free`。若有 `BUSY`，用 `lsof -nP -iTCP:<port> -sTCP:LISTEN` 與 `docker ps --filter publish=<port>` 找出佔用者，回報使用者，不要自行停止任何服務。
- 若已有 `tceditor-*` container 或 `infra/`，表示之前執行過，先停下來確認。

- [ ] **Step 2: 以 sparse clone 取得官方 `docker/` 目錄**

```sh
cd /Users/kaellim/Desktop/projects/puck
SUPABASE_SRC="${TMPDIR:-/tmp}/tceditor-supabase-a4be167"
rm -rf "$SUPABASE_SRC" # 只清除這個步驟自己使用的暫存目錄
git -C "$(dirname "$SUPABASE_SRC")" init -q "$(basename "$SUPABASE_SRC")"
git -C "$SUPABASE_SRC" remote add origin https://github.com/supabase/supabase.git
git -C "$SUPABASE_SRC" sparse-checkout set docker
git -C "$SUPABASE_SRC" fetch -q --depth 1 --filter=blob:none origin a4be1674911d863d55d351d245fba8e83b62dc76
git -C "$SUPABASE_SRC" -c advice.detachedHead=false checkout -q FETCH_HEAD
git -C "$SUPABASE_SRC" rev-parse HEAD
git -C "$SUPABASE_SRC" ls-files docker | wc -l
```

預期輸出：

```
a4be1674911d863d55d351d245fba8e83b62dc76
      64
```

只下載 `docker/` 目錄與 repo 根目錄的檔案（cone 模式的 sparse checkout 一律包含根目錄，Step 3 要用其中的 `LICENSE`），約數秒完成。

- [ ] **Step 3: 複製到 `infra/supabase/docker/` 並確認逐字相同，附上官方授權檔**

```sh
cd /Users/kaellim/Desktop/projects/puck
SUPABASE_SRC="${TMPDIR:-/tmp}/tceditor-supabase-a4be167"
mkdir -p infra/supabase
cp -R "$SUPABASE_SRC/docker" infra/supabase/docker
diff -r "$SUPABASE_SRC/docker" infra/supabase/docker && echo IDENTICAL
find infra/supabase/docker -type f | wc -l
cp "$SUPABASE_SRC/LICENSE" infra/supabase/LICENSE
head -2 infra/supabase/LICENSE
git hash-object infra/supabase/LICENSE
```

預期輸出：

```
IDENTICAL
      64
                                 Apache License
                           Version 2.0, January 2004
49ea124025275674563eeff03af0f653ca49fdc0
```

`LICENSE` 是官方 repo 根目錄的 Apache License 2.0 全文（sparse checkout 一定會帶出根目錄的檔案）。必須在 Step 8 刪除暫存 clone 之前複製，之後就拿不到同一個 ref 的版本。它放在 `docker/` 外面，所以 `docker/` 仍與官方逐字相同（見規格偏離第 5 項）。

- [ ] **Step 4: 建立 `.supabase-version` 與 `infra/supabase/.gitignore`**

建立 `infra/supabase/docker/.supabase-version`，格式與官方 `setup.sh`／`update.sh` 相同（`update.sh` 只讀 `ref=` 這一行）：

```
# Supabase self-hosted version stamp, in the format setup.sh / update.sh use.
# tceditor vendors docker/ from supabase/supabase at this ref and commits this
# file on purpose (git add -f: the vendored .gitignore ignores it).
ref=a4be1674911d863d55d351d245fba8e83b62dc76
```

建立 `infra/supabase/.gitignore`。`.env` 與資料目錄已由官方的 `docker/.gitignore` 忽略（`.env`、`volumes/db/data`、`volumes/storage`、`volumes/snippets`、`volumes/functions/**` 除了範例函式、`.supabase-version`、`docker-compose.override.yml`、`backups`、`test.http`），這裡只補 `setup-env.sh` 執行過程中的兩個暫存檔：

```
# Secrets and data are ignored by docker/.gitignore (vendored from upstream):
# docker/.env, docker/volumes/db/data, docker/volumes/storage, ...
# Backups of docker/.env written by utils/generate-keys.sh and setup-env.sh
docker/.env.old
docker/.env.tmp
```

注意：不要用 `.env.*` 這種萬用字元，否則會連 `docker/.env.example` 一起忽略。

```sh
cd /Users/kaellim/Desktop/projects/puck
git hash-object infra/supabase/docker/.supabase-version infra/supabase/.gitignore
```

預期輸出：

```
ea5fa6a73656494eaf9cd019b55e12b0cb20447a
32dfdea7817ab2afee2c78d424abbb537bb47ad1
```

- [ ] **Step 5: 確認 `format:check` 會因官方檔案而失敗**

```sh
cd /Users/kaellim/Desktop/projects/puck
pnpm format:check 2>&1 | grep infra/
```

預期輸出（`pnpm format:check` 本身以非 0 結束）：

```
[warn] infra/supabase/docker/CONFIG.md
[warn] infra/supabase/docker/README.md
[warn] infra/supabase/docker/versions.md
[warn] infra/supabase/docker/volumes/functions/hello/index.ts
[warn] infra/supabase/docker/volumes/functions/main/index.ts
```

官方的 `CHANGELOG.md` 已被 `.prettierignore` 的 `CHANGELOG.md` 規則略過。官方檔案必須維持逐字相同（之後 `update.sh` 要合併），所以不能用 Prettier 改寫它們。

- [ ] **Step 6: `.prettierignore` 略過 vendored 目錄**

修改 `.prettierignore`。原始片段（逐字）：

```
# Design specs and implementation plans are working documents, not shipped docs
docs/superpowers/
```

替換為：

```
# Design specs and implementation plans are working documents, not shipped docs
docs/superpowers/

# Vendored upstream Supabase self-hosting files (see infra/supabase/README.md);
# kept byte-identical to upstream so update.sh can merge future versions
infra/supabase/docker/
```

```sh
cd /Users/kaellim/Desktop/projects/puck
pnpm format:check 2>&1 | grep infra/ || echo "no infra/ warnings"
pnpm format:check
```

預期：第一個指令印出 `no infra/ warnings`；`pnpm format:check` 以 `All matched files use Prettier code style!` 結束（結束碼 0）。

- [ ] **Step 7: 加入暫存區，並與官方 repo 的受版控檔案比對**

```sh
cd /Users/kaellim/Desktop/projects/puck
SUPABASE_SRC="${TMPDIR:-/tmp}/tceditor-supabase-a4be167"
git add .prettierignore infra/supabase
git add -f infra/supabase/docker/.supabase-version
git diff --cached --stat | tail -1
git status --short --ignored infra/supabase | grep '^!!'
diff <(git -C "$SUPABASE_SRC" ls-files -s docker | awk '{sub(/^docker\//, "", $4); print $1, $2, $4}') <(git ls-files -s infra/supabase/docker | awk '{sub(/^infra\/supabase\/docker\//, "", $4); print $1, $2, $4}')
```

預期輸出：

```
 66 files changed, 12822 insertions(+)
!! infra/supabase/docker/volumes/snippets/
!! infra/supabase/docker/volumes/storage/
3a4
> 100644 ea5fa6a73656494eaf9cd019b55e12b0cb20447a .supabase-version
63,64d63
< 100644 e69de29bb2d1d6434b8b29ae775ad8c2e48c5391 volumes/snippets/.gitkeep
< 100644 e69de29bb2d1d6434b8b29ae775ad8c2e48c5391 volumes/storage/.gitkeep
```

66 個檔案是 62 個官方檔案、`.supabase-version`、`infra/supabase/LICENSE`、`infra/supabase/.gitignore` 與 `.prettierignore`。`diff` 比對的是 `docker/` 底下的檔案模式（含執行權限）與 blob hash：除了新增的 `.supabase-version`，以及位在官方 `.gitignore` 忽略目錄裡、不進版控的兩個空 `.gitkeep`，其餘 62 個檔案與官方完全相同。

- [ ] **Step 8: Commit，並刪除暫存 clone**

```sh
cd /Users/kaellim/Desktop/projects/puck
git commit -m "chore(infra): vendor supabase self-hosted docker setup at a4be167" -m "Copy docker/ from supabase/supabase@a4be1674911d863d55d351d245fba8e83b62dc76 unchanged into infra/supabase/docker, record the ref in .supabase-version, and keep upstream's Apache-2.0 LICENSE next to it as infra/supabase/LICENSE. Prettier skips the vendored directory."
rm -rf "${TMPDIR:-/tmp}/tceditor-supabase-a4be167"
git status --short
```

預期：commit 成功（66 files changed, 12822 insertions），`git status --short` 只剩 `?? CLAUDE.md`。

- [ ] **Step 9: 先確認 `.env` 不存在，再建立 `setup-env.sh`**

```sh
cd /Users/kaellim/Desktop/projects/puck
ls -l infra/supabase/docker/.env
```

預期失敗：`ls: infra/supabase/docker/.env: No such file or directory`。

建立 `infra/supabase/setup-env.sh`（完整內容）：

```sh
#!/bin/sh
#
# Create infra/supabase/docker/.env for the tceditor Supabase dev stack.
#
# Copies the upstream .env.example, fills every secret with the official
# utils/generate-keys.sh, then applies the tceditor settings (project files,
# 127.0.0.1 URLs and ports, email auto-confirm). Secrets are written to
# docker/.env only (mode 600) and never printed.
#
# Usage: infra/supabase/setup-env.sh
#
set -eu

cd "$(dirname "$0")/docker"

if [ -e .env ] || [ -L .env ]; then
    echo "setup-env: docker/.env already exists; refusing to overwrite it." >&2
    echo "setup-env: to regenerate secrets: run reset.sh (an existing database keeps the old" >&2
    echo "setup-env: passwords), delete docker/.env, then run this script again." >&2
    exit 1
fi

if ! command -v openssl >/dev/null 2>&1; then
    echo "setup-env: openssl is required." >&2
    exit 1
fi

# Value of KEY in FILE (last assignment wins, like docker compose).
env_get() {
    sed -n "s/^$1=//p" "$2" | tail -n 1
}

# Replace KEY=... in .env, or append it when the key is missing.
set_env() {
    if grep -q "^$1=" .env; then
        awk -v k="$1" -v v="$2" 'index($0, k "=") == 1 { print k "=" v; next } { print }' .env >.env.tmp
    else
        cp .env .env.tmp
        printf '%s=%s\n' "$1" "$2" >>.env.tmp
    fi
    mv .env.tmp .env
}

umask 077
env_ready=0
# On any failure, leave no half-written docker/.env behind.
trap 'rm -f .env.tmp .env.old; [ "$env_ready" = 1 ] || rm -f .env' EXIT

cp .env.example .env
# Writes JWT_SECRET, ANON_KEY, SERVICE_ROLE_KEY, POSTGRES_PASSWORD,
# DASHBOARD_PASSWORD and the other secrets into .env (backup in .env.old).
sh utils/generate-keys.sh --update-env >/dev/null

set_env COMPOSE_FILE docker-compose.yml:docker-compose.tceditor.yml
set_env SUPABASE_PUBLIC_URL http://127.0.0.1:8200
set_env API_EXTERNAL_URL http://127.0.0.1:8200/auth/v1
set_env SITE_URL http://127.0.0.1:8200
set_env ENABLE_EMAIL_AUTOCONFIRM true
set_env POOLER_TENANT_ID tceditor
set_env API_GW_HTTP_PORT 8200
set_env POSTGRES_HOST_PORT 5434
set_env POOLER_PROXY_PORT_TRANSACTION 6545
chmod 600 .env

for key in POSTGRES_PASSWORD JWT_SECRET ANON_KEY SERVICE_ROLE_KEY DASHBOARD_PASSWORD \
    SECRET_KEY_BASE REALTIME_DB_ENC_KEY VAULT_ENC_KEY PG_META_CRYPTO_KEY \
    S3_PROTOCOL_ACCESS_KEY_ID S3_PROTOCOL_ACCESS_KEY_SECRET; do
    value=$(env_get "$key" .env)
    if [ -z "$value" ] || [ "$value" = "$(env_get "$key" .env.example)" ]; then
        echo "setup-env: $key was not generated; removed docker/.env." >&2
        exit 1
    fi
done
env_ready=1

echo "setup-env: wrote infra/supabase/docker/.env (mode 600, git-ignored)."
echo "setup-env: Studio login is DASHBOARD_USERNAME / DASHBOARD_PASSWORD in that file."
echo "setup-env: next, run infra/supabase/up.sh"
```

```sh
cd /Users/kaellim/Desktop/projects/puck
chmod +x infra/supabase/setup-env.sh
sh -n infra/supabase/setup-env.sh && echo "syntax ok"
git hash-object infra/supabase/setup-env.sh
```

預期輸出：

```
syntax ok
42f136aa465827fe20666bbe53ab00ba3b53bc67
```

- [ ] **Step 10: 產生 `.env` 並檢查內容**

```sh
cd /Users/kaellim/Desktop/projects/puck
infra/supabase/setup-env.sh; echo "exit=$?"
ENV_FILE=infra/supabase/docker/.env
ls -l "$ENV_FILE" | awk '{print $1}'
grep -E '^(COMPOSE_FILE|SUPABASE_PUBLIC_URL|API_EXTERNAL_URL|SITE_URL|ENABLE_EMAIL_AUTOCONFIRM|POOLER_TENANT_ID|API_GW_HTTP_PORT|POSTGRES_HOST_PORT|POOLER_PROXY_PORT_TRANSACTION)=' "$ENV_FILE"
for k in POSTGRES_PASSWORD JWT_SECRET ANON_KEY SERVICE_ROLE_KEY DASHBOARD_PASSWORD; do
  if [ "$(sed -n "s/^$k=//p" "$ENV_FILE")" != "$(sed -n "s/^$k=//p" infra/supabase/docker/.env.example)" ]; then echo "$k generated"; else echo "$k STILL DEFAULT"; fi
done
git status --short --ignored infra/supabase/docker/.env
ls -a infra/supabase/docker | grep '^\.env'
infra/supabase/setup-env.sh; echo "exit=$?"
```

預期輸出：

```
setup-env: wrote infra/supabase/docker/.env (mode 600, git-ignored).
setup-env: Studio login is DASHBOARD_USERNAME / DASHBOARD_PASSWORD in that file.
setup-env: next, run infra/supabase/up.sh
exit=0
-rw-------
COMPOSE_FILE=docker-compose.yml:docker-compose.tceditor.yml
SUPABASE_PUBLIC_URL=http://127.0.0.1:8200
API_EXTERNAL_URL=http://127.0.0.1:8200/auth/v1
POOLER_PROXY_PORT_TRANSACTION=6545
POOLER_TENANT_ID=tceditor
SITE_URL=http://127.0.0.1:8200
ENABLE_EMAIL_AUTOCONFIRM=true
API_GW_HTTP_PORT=8200
POSTGRES_HOST_PORT=5434
POSTGRES_PASSWORD generated
JWT_SECRET generated
ANON_KEY generated
SERVICE_ROLE_KEY generated
DASHBOARD_PASSWORD generated
!! infra/supabase/docker/.env
.env
.env.example
setup-env: docker/.env already exists; refusing to overwrite it.
setup-env: to regenerate secrets: run reset.sh (an existing database keeps the old
setup-env: passwords), delete docker/.env, then run this script again.
exit=1
```

不要把 `.env` 的內容貼到任何地方；腳本本身不會印出祕密。`.env.old`、`.env.tmp` 不應存在。

- [ ] **Step 11: Commit**

```sh
cd /Users/kaellim/Desktop/projects/puck
git add infra/supabase/setup-env.sh
git commit -m "chore(infra): add setup-env script for the supabase dev stack" -m "Generate docker/.env from .env.example with the official generate-keys.sh, point the URLs and host ports at 127.0.0.1:8200/5434/6545, enable email auto-confirm, and refuse to overwrite an existing .env."
git ls-files -s infra/supabase/setup-env.sh
```

預期：commit 成功；最後一行以 `100755 42f136aa465827fe20666bbe53ab00ba3b53bc67 0` 開頭（執行權限已進版控）。

- [ ] **Step 12: 先確認 compose 設定還讀不到 override**

```sh
cd /Users/kaellim/Desktop/projects/puck/infra/supabase/docker
docker compose config --format json | jq -r '"name=\(.name)", (.services | to_entries[] | "\(.key)\t\(.value.container_name)\t\([.value.ports[]? | "\(.host_ip):\(.published)->\(.target)"] | join(" "))")'
```

預期失敗（`.env` 的 `COMPOSE_FILE` 已指向還不存在的 override）：

```
stat /Users/kaellim/Desktop/projects/puck/infra/supabase/docker/docker-compose.tceditor.yml: no such file or directory
```

- [ ] **Step 13: 建立 `docker-compose.tceditor.yml` 並確認合併結果**

建立 `infra/supabase/docker/docker-compose.tceditor.yml`（完整內容）：

```yaml
# tceditor: compose override for the local Supabase dev stack (S1 spec §7).
#
# Layered on the vendored upstream docker-compose.yml (ref in .supabase-version):
#   1. Compose project name "tceditor"; every service gets a tceditor-* container
#      name, so nothing collides with the other Supabase stacks on this machine
#      (tciam-*, tcdata-*, and the upstream default supabase-* names).
#   2. Host ports bind to 127.0.0.1 only: API gateway (Envoy, also serves Studio)
#      8200, Postgres through Supavisor (session mode) 5434, transaction pooler 6545.
#   3. docker-compose.logs.yml (Logflare, Vector) is deliberately not used.
#
# Enabled by COMPOSE_FILE=docker-compose.yml:docker-compose.tceditor.yml in .env.
# Operate the stack with infra/supabase/up.sh, down.sh and reset.sh.
# Merge rule: compose merges environment/volumes key by key; `ports` needs
# `!override` (Compose >= 2.24.4) to replace the base list instead of extending it.

name: tceditor

services:
  studio:
    container_name: tceditor-studio

  api-gw:
    container_name: tceditor-api-gw
    ports: !override
      - 127.0.0.1:${API_GW_HTTP_PORT:-8200}:8000/tcp

  auth:
    container_name: tceditor-auth

  rest:
    container_name: tceditor-rest

  realtime:
    container_name: tceditor-realtime
    # Upstream names this container realtime-dev.supabase-realtime because Envoy
    # (volumes/api/envoy/cds.yaml) connects to that host name and Realtime derives
    # the tenant id from it. Keep the name reachable as a network alias; aliases
    # only resolve inside tceditor_default, so they cannot clash with other stacks.
    networks:
      default:
        aliases:
          - realtime-dev.supabase-realtime

  storage:
    container_name: tceditor-storage

  imgproxy:
    container_name: tceditor-imgproxy

  meta:
    container_name: tceditor-meta

  functions:
    container_name: tceditor-functions

  db:
    container_name: tceditor-db

  supavisor:
    container_name: tceditor-supavisor
    # POSTGRES_PORT stays 5432: the containers use it internally, so the host
    # port for session mode gets its own variable (POSTGRES_HOST_PORT).
    ports: !override
      - 127.0.0.1:${POSTGRES_HOST_PORT:-5434}:5432
      - 127.0.0.1:${POOLER_PROXY_PORT_TRANSACTION:-6545}:6543
```

再執行 Step 12 的指令，並檢查 Realtime 的別名與 gateway 原有的別名：

```sh
cd /Users/kaellim/Desktop/projects/puck/infra/supabase/docker
docker compose config --format json | jq -r '"name=\(.name)", (.services | to_entries[] | "\(.key)\t\(.value.container_name)\t\([.value.ports[]? | "\(.host_ip):\(.published)->\(.target)"] | join(" "))")'
docker compose config --format json | jq -c '.services.realtime.networks, .services["api-gw"].networks, (.volumes | keys)'
git hash-object docker-compose.tceditor.yml
```

預期輸出（欄位以 tab 分隔）：

```
name=tceditor
api-gw	tceditor-api-gw	127.0.0.1:8200->8000
auth	tceditor-auth	
db	tceditor-db	
functions	tceditor-functions	
imgproxy	tceditor-imgproxy	
meta	tceditor-meta	
realtime	tceditor-realtime	
rest	tceditor-rest	
storage	tceditor-storage	
studio	tceditor-studio	
supavisor	tceditor-supavisor	127.0.0.1:5434->5432 127.0.0.1:6545->6543
{"default":{"aliases":["realtime-dev.supabase-realtime"]}}
{"default":{"aliases":["envoy","kong"]}}
["db-config","deno-cache"]
c5abc7561ce058f2a5d9614702587a1f5ac12d1b
```

判斷條件：恰好 11 個服務（沒有 `analytics`、`vector`），每個都是 `tceditor-*`，對外 port 只有三個且都綁 `127.0.0.1`。

- [ ] **Step 14: Commit**

```sh
cd /Users/kaellim/Desktop/projects/puck
git add infra/supabase/docker/docker-compose.tceditor.yml
git commit -m "chore(infra): add tceditor compose override for supabase" -m "Name the compose project tceditor, give every service a tceditor-* container name, keep realtime reachable through its upstream host name alias, and bind the gateway and Supavisor ports to 127.0.0.1 only."
```

預期：commit 成功（1 file changed, 65 insertions）。

- [ ] **Step 15: 建立 `lib.sh`、`up.sh`、`down.sh`**

建立 `infra/supabase/lib.sh`（完整內容；由其他腳本 source，不需要執行權限）：

```sh
# Shared helpers for infra/supabase/up.sh, down.sh and reset.sh.
# Source it from those scripts; do not run it directly.
#
# Every docker compose call goes through compose(), which pins the project name
# and both compose files, so these scripts only ever act on the tceditor
# project, whatever COMPOSE_* variables the calling shell exports.

TCEDITOR_PROJECT=tceditor
SUPABASE_DOCKER_DIR=$(cd "$(dirname "$0")/docker" && pwd -P)

case "$SUPABASE_DOCKER_DIR" in
    */infra/supabase/docker) ;;
    *)
        echo "$0: unexpected stack directory: $SUPABASE_DOCKER_DIR" >&2
        exit 1
        ;;
esac
if [ ! -f "$SUPABASE_DOCKER_DIR/docker-compose.tceditor.yml" ]; then
    echo "$0: missing $SUPABASE_DOCKER_DIR/docker-compose.tceditor.yml" >&2
    exit 1
fi

# docker/.env is the only configuration source.
unset COMPOSE_PROJECT_NAME COMPOSE_FILE COMPOSE_PROFILES COMPOSE_ENV_FILES \
    API_GW_HTTP_PORT POSTGRES_HOST_PORT POOLER_PROXY_PORT_TRANSACTION

if [ -f "$SUPABASE_DOCKER_DIR/.env" ]; then
    SUPABASE_ENV_FILE=$SUPABASE_DOCKER_DIR/.env
else
    # Lets down.sh and reset.sh run before setup-env.sh has created .env.
    SUPABASE_ENV_FILE=$SUPABASE_DOCKER_DIR/.env.example
fi

# docker compose lets exported shell variables override --env-file values, so
# drop every key the env file sets: a stray `export POSTGRES_PASSWORD=...` (or a
# shell that sourced another stack's .env) must not leak into this stack.
# Keys match [A-Za-z_][A-Za-z0-9_]*, so splitting the list on whitespace is safe.
# shellcheck disable=SC2013
for env_key in $(sed -n 's/^\([A-Za-z_][A-Za-z0-9_]*\)=.*/\1/p' "$SUPABASE_ENV_FILE"); do
    unset "$env_key"
done

# docker compose with the tceditor files but without a forced project name.
compose_files() {
    docker compose --project-directory "$SUPABASE_DOCKER_DIR" --env-file "$SUPABASE_ENV_FILE" \
        -f "$SUPABASE_DOCKER_DIR/docker-compose.yml" \
        -f "$SUPABASE_DOCKER_DIR/docker-compose.tceditor.yml" "$@"
}

compose() {
    compose_files -p "$TCEDITOR_PROJECT" "$@"
}

require_docker() {
    if ! docker info >/dev/null 2>&1; then
        echo "$0: cannot reach the Docker daemon; start Docker Desktop first." >&2
        exit 1
    fi
}

# Refuse to continue unless the compose files on their own resolve to the
# tceditor project, so that a plain `docker compose` run in docker/ and these
# scripts always address the same containers and volumes.
require_tceditor_project() {
    resolved=$(compose_files config 2>/dev/null | sed -n 's/^name: //p' | head -n 1)
    if [ "$resolved" != "$TCEDITOR_PROJECT" ]; then
        echo "$0: compose project resolves to '$resolved', expected '$TCEDITOR_PROJECT'; refusing to continue." >&2
        exit 1
    fi
}
```

建立 `infra/supabase/up.sh`（完整內容）：

```sh
#!/bin/sh
#
# Start the tceditor Supabase dev stack and wait until every service is healthy.
# Refuses to start when a host port it needs is taken by anything else.
#
# Usage: infra/supabase/up.sh
#
set -eu
. "$(dirname "$0")/lib.sh"

if [ ! -f "$SUPABASE_DOCKER_DIR/.env" ]; then
    echo "up: infra/supabase/docker/.env not found; run infra/supabase/setup-env.sh first." >&2
    exit 1
fi

require_docker
require_tceditor_project

config=$(compose config)

# Every published port must be bound to 127.0.0.1 (no host_ip means 0.0.0.0).
published_count=$(printf '%s\n' "$config" | grep -c '^ *published: ' || true)
loopback_count=$(printf '%s\n' "$config" | grep -c '^ *host_ip: 127\.0\.0\.1$' || true)
if [ "$published_count" != "$loopback_count" ]; then
    echo "up: some published ports are not bound to 127.0.0.1; check docker-compose.tceditor.yml." >&2
    exit 1
fi

# A port is fine when it is free, or already published by this stack (up.sh run twice).
ports=$(printf '%s\n' "$config" | sed -n 's/^ *published: "\{0,1\}\([0-9][0-9]*\)"\{0,1\}$/\1/p')
for port in $ports; do
    if [ -n "$(docker ps -q --filter "label=com.docker.compose.project=$TCEDITOR_PROJECT" --filter "publish=$port")" ]; then
        continue
    fi
    if lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1 || nc -z 127.0.0.1 "$port" >/dev/null 2>&1; then
        echo "up: port $port is already in use; not starting the stack." >&2
        lsof -nP -iTCP:"$port" -sTCP:LISTEN >&2 || true
        docker ps --filter "publish=$port" --format '  container {{.Names}}: {{.Ports}}' >&2
        echo "up: free port $port (or stop whatever owns it), then run up.sh again." >&2
        exit 1
    fi
done

if ! compose up -d --wait --wait-timeout 300; then
    compose ps -a --format 'table {{.Name}}\t{{.Status}}' >&2
    echo "up: the stack did not become healthy. Inspect a service with" >&2
    echo "up:   docker compose -p $TCEDITOR_PROJECT logs <service>" >&2
    echo "up: then run infra/supabase/down.sh before trying again." >&2
    exit 1
fi
compose ps --format 'table {{.Name}}\t{{.Status}}'

echo ""
echo "up: tceditor Supabase is running."
echo "  API gateway + Studio:  http://127.0.0.1:8200  (Studio login: DASHBOARD_USERNAME / DASHBOARD_PASSWORD)"
echo "  Postgres, session:     127.0.0.1:5434  user postgres.tceditor  (POSTGRES_PASSWORD)"
echo "  Postgres, transaction: 127.0.0.1:6545  user postgres.tceditor"
echo "  Keys and passwords are in infra/supabase/docker/.env (ANON_KEY, SERVICE_ROLE_KEY, ...)."
```

建立 `infra/supabase/down.sh`（完整內容）：

```sh
#!/bin/sh
#
# Stop the tceditor Supabase dev stack: removes its containers and network.
# Data is kept (named volumes and docker/volumes/db/data, docker/volumes/storage);
# reset.sh is the only script that deletes it.
#
# Usage: infra/supabase/down.sh
#
set -eu
. "$(dirname "$0")/lib.sh"

require_docker
require_tceditor_project

compose down --remove-orphans
echo "down: tceditor Supabase stopped; data is kept."
```

```sh
cd /Users/kaellim/Desktop/projects/puck
chmod +x infra/supabase/up.sh infra/supabase/down.sh
for f in lib.sh up.sh down.sh; do sh -n "infra/supabase/$f" && echo "$f syntax ok"; done
git hash-object infra/supabase/lib.sh infra/supabase/up.sh infra/supabase/down.sh
```

預期輸出：

```
lib.sh syntax ok
up.sh syntax ok
down.sh syntax ok
fbed5ae8d2dade5c8148fb5cf762f8661a31a134
d867e25ab25fc4c92821f56a3db66652dd53f2c2
982b8cecfea250cfe67c14e434f214462c0f0a74
```

接著確認 shell 中 export 的變數不會蓋過 `.env`。docker compose 的規則是 shell 環境變數優先於 `--env-file`，所以先以裸 `docker compose` 重現問題（第一行），再經 `lib.sh` 的 `compose()` 執行同一個查詢（第二行）。`sh -c '...' ../lib.sh` 的最後一個參數會成為 `$0`，讓 `lib.sh` 找到 `docker/`。變數只以前綴方式傳給單一指令，不會留在目前的 shell；jq 只印出比較結果，不印祕密：

```sh
cd /Users/kaellim/Desktop/projects/puck/infra/supabase/docker
probe='.services.auth.environment.GOTRUE_SITE_URL + " autoconfirm=" + .services.auth.environment.GOTRUE_MAILER_AUTOCONFIRM + " leaked_db_password=" + (.services.db.environment.POSTGRES_PASSWORD == "leaked" | tostring)'
SITE_URL=http://evil.example ENABLE_EMAIL_AUTOCONFIRM=false POSTGRES_PASSWORD=leaked docker compose config --format json | jq -r "$probe"
SITE_URL=http://evil.example ENABLE_EMAIL_AUTOCONFIRM=false POSTGRES_PASSWORD=leaked sh -c '. ../lib.sh; compose config --format json' ../lib.sh | jq -r "$probe"
```

預期輸出：

```
http://evil.example autoconfirm=false leaked_db_password=true
http://127.0.0.1:8200 autoconfirm=true leaked_db_password=false
```

第一行是問題本身（例如先前為 tciam 或 tcdata 執行過 `set -a; . .env` 的 shell，會讓資料庫以別的 stack 的密碼初始化）；第二行表示 `up.sh`、`down.sh`、`reset.sh` 一律只用 `docker/.env` 的值。若第二行不是這個結果，檢查 `lib.sh` 是否與上面逐字相同（hash `fbed5ae8…`）。

- [ ] **Step 16: 確認 port 被佔用時 `up.sh` 拒絕啟動**

以一個只綁 `127.0.0.1:8200`、服務空目錄的暫時程序佔住 port，執行 `up.sh`，然後只結束這個程序：

```sh
cd /Users/kaellim/Desktop/projects/puck
python3 -I -m http.server 8200 --bind 127.0.0.1 --directory "$(mktemp -d)" >/dev/null 2>&1 &
BLOCKER_PID=$!
n=0; until lsof -nP -iTCP:8200 -sTCP:LISTEN >/dev/null 2>&1 || [ $n -ge 50 ]; do sleep 0.2; n=$((n+1)); done
infra/supabase/up.sh; echo "exit=$?"
kill "$BLOCKER_PID"
docker ps -a --filter "label=com.docker.compose.project=tceditor" --format '{{.Names}}' | wc -l
```

預期輸出（PID 與 DEVICE 不同）：

```
up: port 8200 is already in use; not starting the stack.
COMMAND   PID    USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME
Python  63435 kaellim    3u  IPv4 0x8adad955c611447c      0t0  TCP 127.0.0.1:8200 (LISTEN)
up: free port 8200 (or stop whatever owns it), then run up.sh again.
exit=1
       0
```

最後的計數為 `0`，表示沒有建立任何 tceditor container（`docker ps -a` 連 created、exited 狀態的 container 也會列出，`docker compose ls` 不加 `-a` 則只列執行中的專案，證明不了這點）。等待迴圈不可省略：佔位程序還沒開始 listen 時，`up.sh` 的檢查會放行，改由 Docker 在綁 port 時報 `ports are not available`，留下啟動到一半的 stack（遇到時執行 `infra/supabase/down.sh` 收拾）。

- [ ] **Step 17: 啟動 stack**

```sh
cd /Users/kaellim/Desktop/projects/puck
lsof -nP -iTCP:8200 -sTCP:LISTEN || echo "8200 free"
infra/supabase/up.sh; echo "exit=$?"
```

預期：`8200 free`；接著 compose 依序建立網路 `tceditor_default`、volume `tceditor_db-config`、`tceditor_deno-cache` 與 11 個 container，等待到全部 `Healthy`（映像檔已在本機，實測約 25 秒），最後輸出：

```
NAME                 STATUS
tceditor-api-gw      Up 16 seconds (healthy)
tceditor-auth        Up 16 seconds (healthy)
tceditor-db          Up 22 seconds (healthy)
tceditor-functions   Up 5 seconds (healthy)
tceditor-imgproxy    Up 22 seconds (healthy)
tceditor-meta        Up 16 seconds (healthy)
tceditor-realtime    Up 16 seconds (healthy)
tceditor-rest        Up 16 seconds (healthy)
tceditor-storage     Up 15 seconds (healthy)
tceditor-studio      Up 22 seconds (healthy)
tceditor-supavisor   Up 16 seconds (healthy)

up: tceditor Supabase is running.
  API gateway + Studio:  http://127.0.0.1:8200  (Studio login: DASHBOARD_USERNAME / DASHBOARD_PASSWORD)
  Postgres, session:     127.0.0.1:5434  user postgres.tceditor  (POSTGRES_PASSWORD)
  Postgres, transaction: 127.0.0.1:6545  user postgres.tceditor
  Keys and passwords are in infra/supabase/docker/.env (ANON_KEY, SERVICE_ROLE_KEY, ...).
exit=0
```

秒數會不同；11 行都必須是 `(healthy)`。失敗時的處理：

- `up.sh` 印出 `the stack did not become healthy`：用 `docker compose -p tceditor logs <service>` 看是哪個服務；再看 `docker stats --no-stream` 是否記憶體不足（本機 4 CPU／16 GB，tciam 與 tcdata 執行中時合計約 6.5 GiB）。記憶體不足時回報使用者，由使用者決定是否暫停其他 stack，不要自行停止它們。之後執行 `infra/supabase/down.sh` 再重試。
- `Error response from daemon: ports are not available`：有程式在檢查之後才佔用 port。執行 `infra/supabase/down.sh`，回到 Step 1 的 port 檢查。
- 映像檔不存在時 compose 會自動 pull（需要網路）；版本與 tciam 相同，正常情況下不必下載。

- [ ] **Step 18: Commit**

```sh
cd /Users/kaellim/Desktop/projects/puck
git add infra/supabase/lib.sh infra/supabase/up.sh infra/supabase/down.sh
git commit -m "chore(infra): add up and down scripts for the supabase dev stack" -m "up.sh refuses to start when a published port is not bound to 127.0.0.1 or is already taken, then waits until every service is healthy. Both scripts pin the compose project to tceditor and ignore shell variables that would override docker/.env."
git status --short
```

預期：commit 成功（3 files changed, 144 insertions），`git status --short` 只剩 `?? CLAUDE.md`（`.env` 與資料目錄已被忽略）。

- [ ] **Step 19: 驗證健康狀態與 port 綁定**

```sh
cd /Users/kaellim/Desktop/projects/puck
docker compose -p tceditor ps --format '{{.Name}}\t{{.Health}}'
docker compose -p tceditor ps --format '{{.Health}}' | sort | uniq -c
docker ps --filter "label=com.docker.compose.project=tceditor" --format '{{.Names}}\t{{.Ports}}' | grep -- '->'
for p in 8200 5434 6545; do lsof -nP -iTCP:$p -sTCP:LISTEN | awk 'NR > 1 {print $9}'; done
```

預期輸出（前兩段的順序可能不同）：

```
tceditor-api-gw	healthy
tceditor-auth	healthy
tceditor-db	healthy
tceditor-functions	healthy
tceditor-imgproxy	healthy
tceditor-meta	healthy
tceditor-realtime	healthy
tceditor-rest	healthy
tceditor-storage	healthy
tceditor-studio	healthy
tceditor-supavisor	healthy
  11 healthy
tceditor-supavisor	127.0.0.1:5434->5432/tcp, 127.0.0.1:6545->6543/tcp
tceditor-api-gw	127.0.0.1:8200->8000/tcp
127.0.0.1:8200
127.0.0.1:5434
127.0.0.1:6545
```

只有兩個 container 對外開 port，而且都只綁 `127.0.0.1`。

接著在 stack 執行中**再執行一次 `up.sh`**（全域審查補上，計畫開頭 Review Focus 第 5 項）。Docker Desktop 重開後，這 11 個 container 會依 `restart: unless-stopped` 自動恢復，使用者這時再執行 `up.sh` 很常見。`up.sh` 不能把 stack 自己佔用的 8200、5434、6545 當成「被別人佔用」而拒絕，也不應重建或重啟任何 container：

```sh
cd /Users/kaellim/Desktop/projects/puck
started() {
  docker ps -q --no-trunc --filter "label=com.docker.compose.project=tceditor" | xargs docker inspect -f '{{.Id}} {{.State.StartedAt}}' | sort
}
before=$(started)
infra/supabase/up.sh > "${TMPDIR:-/tmp}/tceditor-up-again.log" 2>&1; echo "exit=$?"
grep -E "already in use|is running" "${TMPDIR:-/tmp}/tceditor-up-again.log"
after=$(started)
echo "containers: $(printf '%s\n' "$after" | wc -l | tr -d ' ')"
[ "$before" = "$after" ] && echo "none recreated or restarted"
```

預期輸出：

```
exit=0
up: tceditor Supabase is running.
containers: 11
none recreated or restarted
```

- `grep` 只印出 `is running` 那一行，沒有 `already in use`：`up.sh` 以 `docker ps --filter publish=<port>` 認出這三個 port 屬於 tceditor 自己的 container，所以略過佔用檢查。
- 最後一行表示 11 個 container 的 ID 與 `StartedAt` 都沒變，`docker compose up -d --wait` 對已在執行的服務不做任何事。若出現 `already in use` 或 `exit=1`，表示 `up.sh` 的 port 檢查認不出自己的 stack，停下來回報。

- [ ] **Step 20: 驗證 REST API（PostgREST 經 gateway）**

```sh
cd /Users/kaellim/Desktop/projects/puck
ENV_FILE=infra/supabase/docker/.env
ANON_KEY=$(sed -n 's/^ANON_KEY=//p' "$ENV_FILE")
SERVICE_ROLE_KEY=$(sed -n 's/^SERVICE_ROLE_KEY=//p' "$ENV_FILE")
curl -sS -o /dev/null -w 'no key:             %{http_code}\n' http://127.0.0.1:8200/rest/v1/
curl -sS -o /dev/null -w 'anon, root:         %{http_code}\n' -H "apikey: ${ANON_KEY}" http://127.0.0.1:8200/rest/v1/
curl -sS -o /dev/null -w 'service_role, root: %{http_code}\n' -H "apikey: ${SERVICE_ROLE_KEY}" http://127.0.0.1:8200/rest/v1/
docker exec tceditor-db psql -U postgres -d postgres -v ON_ERROR_STOP=1 -c 'create table public.tceditor_smoke (id int primary key)'
for i in 1 2 3 4 5 6 7 8 9 10; do
  code=$(curl -sS -o /dev/null -w '%{http_code}' -H "apikey: ${ANON_KEY}" 'http://127.0.0.1:8200/rest/v1/tceditor_smoke?select=id')
  [ "$code" = 200 ] && break
  sleep 1
done
echo "anon, table:        $code"
curl -sS -H "apikey: ${ANON_KEY}" 'http://127.0.0.1:8200/rest/v1/tceditor_smoke?select=id'; echo
docker exec tceditor-db psql -U postgres -d postgres -v ON_ERROR_STOP=1 -c 'drop table public.tceditor_smoke'
```

預期輸出：

```
no key:             401
anon, root:         403
service_role, root: 200
CREATE TABLE
anon, table:        200
[]
DROP TABLE
```

`anon, root` 的 403（回應內容 `RBAC: access denied`）是官方 Envoy 只讓 service_role 讀 OpenAPI 根路徑的設定，見本 task 的規格偏離第 2 項。PostgREST 透過 event trigger 重新載入 schema，建表後通常要一兩秒才查得到，所以用重試迴圈；若 10 次後仍是 404（`PGRST205`），看 `docker compose -p tceditor logs rest`。

- [ ] **Step 21: 驗證 Auth 與 email 自動確認**

```sh
cd /Users/kaellim/Desktop/projects/puck
ANON_KEY=$(sed -n 's/^ANON_KEY=//p' infra/supabase/docker/.env)
curl -sS -H "apikey: ${ANON_KEY}" http://127.0.0.1:8200/auth/v1/settings | jq -c '{mailer_autoconfirm, email: .external.email}'
curl -sS -X POST http://127.0.0.1:8200/auth/v1/signup -H "apikey: ${ANON_KEY}" -H 'Content-Type: application/json' -d '{"email":"smoke@tceditor.test","password":"smoke-password-1234"}' | jq -c '{access_token: (.access_token != null), email_confirmed: (.user.email_confirmed_at != null)}'
```

預期輸出：

```
{"mailer_autoconfirm":true,"email":true}
{"access_token":true,"email_confirmed":true}
```

註冊後立即拿到 access token、email 已確認，表示沒有寄信也能登入。這個測試帳號在 Step 25 刪除。

- [ ] **Step 22: 驗證 Studio 可經 gateway 以 dashboard 帳密開啟**

Studio 的帳密在 `.env` 的 `DASHBOARD_USERNAME`（預設 `supabase`）與 `DASHBOARD_PASSWORD`（`setup-env.sh` 產生的 32 個 hex 字元）。以下指令只印 HTTP 狀態碼，不印密碼；注意 zsh 中要寫成 `${DASHBOARD_USERNAME}:${DASHBOARD_PASSWORD}`（不加大括號時 `$X:w` 會被 zsh 當成修飾字）：

```sh
cd /Users/kaellim/Desktop/projects/puck
ENV_FILE=infra/supabase/docker/.env
DASHBOARD_USERNAME=$(sed -n 's/^DASHBOARD_USERNAME=//p' "$ENV_FILE")
DASHBOARD_PASSWORD=$(sed -n 's/^DASHBOARD_PASSWORD=//p' "$ENV_FILE")
echo "user: ${DASHBOARD_USERNAME}"
curl -sS -o /dev/null -w 'no credentials:   %{http_code}\n' http://127.0.0.1:8200/
curl -sS -o /dev/null -w 'with credentials: %{http_code}\n' -u "${DASHBOARD_USERNAME}:${DASHBOARD_PASSWORD}" http://127.0.0.1:8200/project/default
curl -sS -u "${DASHBOARD_USERNAME}:${DASHBOARD_PASSWORD}" http://127.0.0.1:8200/project/default | grep -o '<title[^>]*>Supabase'
```

預期輸出：

```
user: supabase
no credentials:   401
with credentials: 200
<title data-next-head="">Supabase
```

人工確認（有瀏覽器時）：開 `http://127.0.0.1:8200`，在瀏覽器的帳密視窗輸入上面的帳號與 `sed -n 's/^DASHBOARD_PASSWORD=//p' infra/supabase/docker/.env` 印出的密碼，應進入 Studio 的「Default Project」。不要用 `curl -w '%{redirect_url}'` 之類會把帳密嵌在 URL 中印出的寫法。

- [ ] **Step 23: 驗證 Postgres 的兩個 host port（經 Supavisor）**

本機沒有 `psql`，借用 `tceditor-db` container 內的 `psql`，經 `host.docker.internal` 連回主機的 `127.0.0.1:5434`、`127.0.0.1:6545`：

```sh
cd /Users/kaellim/Desktop/projects/puck
POSTGRES_PASSWORD=$(sed -n 's/^POSTGRES_PASSWORD=//p' infra/supabase/docker/.env)
for port in 5434 6545; do
  docker exec -e PGPASSWORD="${POSTGRES_PASSWORD}" tceditor-db psql -h host.docker.internal -p "$port" -U postgres.tceditor -d postgres -tAc "select 'port $port: ' || count(*) || ' user(s)' from auth.users"
done
```

預期輸出：

```
port 5434: 1 user(s)
port 6545: 1 user(s)
```

`1 user(s)` 是 Step 21 註冊的測試帳號。

- [ ] **Step 24: 確認 tciam 沒有受影響**

```sh
docker compose ls
```

預期：`tciam` 那一行與 Step 1 記下的完全相同（`running(17)`，CONFIG FILES 不變）；另有一行 `tceditor  running(11)  /Users/kaellim/Desktop/projects/puck/infra/supabase/docker/docker-compose.yml,/Users/kaellim/Desktop/projects/puck/infra/supabase/docker/docker-compose.tceditor.yml`。其他 stack 的狀態與 Step 1 相同。

- [ ] **Step 25: 停止後重新啟動，資料保留，然後刪除測試帳號**

```sh
cd /Users/kaellim/Desktop/projects/puck
infra/supabase/down.sh; echo "exit=$?"
docker ps -a --filter "label=com.docker.compose.project=tceditor" --format '{{.Names}}' | wc -l
docker volume ls --filter "label=com.docker.compose.project=tceditor" --format '{{.Name}}'
infra/supabase/up.sh >/dev/null; echo "exit=$?"
docker compose -p tceditor ps --format '{{.Health}}' | sort | uniq -c
SERVICE_ROLE_KEY=$(sed -n 's/^SERVICE_ROLE_KEY=//p' infra/supabase/docker/.env)
USER_ID=$(docker exec tceditor-db psql -U postgres -d postgres -tAc "select id from auth.users where email = 'smoke@tceditor.test'")
echo "user id length: ${#USER_ID}"
curl -sS -o /dev/null -w 'delete smoke user: %{http_code}\n' -X DELETE -H "apikey: ${SERVICE_ROLE_KEY}" -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" "http://127.0.0.1:8200/auth/v1/admin/users/${USER_ID}"
docker exec tceditor-db psql -U postgres -d postgres -tAc "select count(*) from auth.users where email = 'smoke@tceditor.test'"
```

預期輸出（`down.sh` 與 `up.sh` 的 compose 進度訊息省略）：

```
down: tceditor Supabase stopped; data is kept.
exit=0
       0
tceditor_db-config
tceditor_deno-cache
exit=0
  11 healthy
user id length: 36
delete smoke user: 200
0
```

`down.sh` 後沒有任何 tceditor container，但兩個 volume 還在；重新啟動後 Step 21 的帳號仍存在（資料保留），刪除後計數為 0。

- [ ] **Step 26: 建立 `reset.sh`**

建立 `infra/supabase/reset.sh`（完整內容）：

```sh
#!/bin/sh
#
# Delete ALL data of the tceditor Supabase dev stack: its containers, its named
# volumes (<project>_db-config, <project>_deno-cache) and the bind-mounted data
# directories docker/volumes/db/data and docker/volumes/storage.
# docker/.env is kept, so the next up.sh starts an empty database with the same
# secrets. Nothing outside the tceditor compose project is touched.
#
# Usage: infra/supabase/reset.sh [--yes]
#
set -eu
. "$(dirname "$0")/lib.sh"

assume_yes=0
case "${1:-}" in
    "") ;;
    -y | --yes) assume_yes=1 ;;
    *)
        echo "usage: $0 [--yes]" >&2
        exit 2
        ;;
esac

require_docker
require_tceditor_project

db_data_dir=$SUPABASE_DOCKER_DIR/volumes/db/data
storage_dir=$SUPABASE_DOCKER_DIR/volumes/storage

echo "reset: this permanently deletes the data of compose project '$TCEDITOR_PROJECT':"
echo "  containers:"
docker ps -a --filter "label=com.docker.compose.project=$TCEDITOR_PROJECT" --format '{{.Names}}' | sed 's/^/    /'
echo "  volumes:"
docker volume ls --filter "label=com.docker.compose.project=$TCEDITOR_PROJECT" --format '{{.Name}}' | sed 's/^/    /'
echo "  directories:"
echo "    $db_data_dir"
echo "    $storage_dir"

if [ "$assume_yes" != 1 ]; then
    if [ ! -t 0 ]; then
        echo "reset: stdin is not a terminal; pass --yes to confirm." >&2
        exit 1
    fi
    printf "Type the project name (%s) to confirm: " "$TCEDITOR_PROJECT"
    read -r answer || answer=
    if [ "$answer" != "$TCEDITOR_PROJECT" ]; then
        echo "reset: cancelled; nothing was deleted."
        exit 1
    fi
fi

# down -v removes only the volumes that belong to this compose project.
compose down -v --remove-orphans
rm -rf "$db_data_dir" "$storage_dir"
echo "reset: done. Run infra/supabase/up.sh to start with an empty database."
```

```sh
cd /Users/kaellim/Desktop/projects/puck
chmod +x infra/supabase/reset.sh
sh -n infra/supabase/reset.sh && echo "syntax ok"
git hash-object infra/supabase/reset.sh
infra/supabase/reset.sh --bogus; echo "exit=$?"
```

預期輸出：

```
syntax ok
479ee319e25310f7ac256c15bfce4765858e28b5
usage: infra/supabase/reset.sh [--yes]
exit=2
```

刪除前的安全檢查：`lib.sh` 確認腳本所在目錄是 `*/infra/supabase/docker` 且有 override 檔；`require_tceditor_project` 確認 compose 檔本身解析出的專案名是 `tceditor`（例如有人把 override 的 `name:` 改掉，或在 `.env` 加了 `COMPOSE_PROJECT_NAME`，就拒絕執行）；`docker compose -p tceditor down -v` 只會刪除 label 為 `com.docker.compose.project=tceditor` 的 volume。

- [ ] **Step 27: 確認 `reset.sh` 在未確認時不刪任何東西**

stack 此時仍在執行。先以非終端機的 stdin 執行，再以 `expect` 模擬在終端機輸入錯誤的專案名稱：

```sh
cd /Users/kaellim/Desktop/projects/puck
infra/supabase/reset.sh < /dev/null; echo "exit=$?"
expect -c 'spawn infra/supabase/reset.sh; expect "to confirm: "; send "nope\r"; expect eof; lassign [wait] pid id oserr code; exit $code'; echo "exit=$?"
docker compose ls --filter name=tceditor
test -f infra/supabase/docker/volumes/db/data/PG_VERSION && echo "db data kept"
```

預期：兩次都先列出將被刪除的項目（11 個 `tceditor-*` container、`tceditor_db-config`、`tceditor_deno-cache`、兩個資料目錄的絕對路徑），然後：

```
reset: stdin is not a terminal; pass --yes to confirm.
exit=1
...
Type the project name (tceditor) to confirm: nope
reset: cancelled; nothing was deleted.
exit=1
NAME                STATUS              CONFIG FILES
tceditor            running(11)         /Users/kaellim/Desktop/projects/puck/infra/supabase/docker/docker-compose.yml,/Users/kaellim/Desktop/projects/puck/infra/supabase/docker/docker-compose.tceditor.yml
db data kept
```

stack 仍是 `running(11)`、資料目錄仍在。

- [ ] **Step 28: 以 `--yes` 清除資料，並從空資料庫重新啟動**

```sh
cd /Users/kaellim/Desktop/projects/puck
infra/supabase/reset.sh --yes; echo "exit=$?"
docker ps -a --filter "label=com.docker.compose.project=tceditor" --format '{{.Names}}' | wc -l
docker volume ls --filter "label=com.docker.compose.project=tceditor" --format '{{.Name}}' | wc -l
docker network ls --filter "label=com.docker.compose.project=tceditor" --format '{{.Name}}' | wc -l
ls -d infra/supabase/docker/volumes/db/data infra/supabase/docker/volumes/storage
ls -l infra/supabase/docker/.env | awk '{print $1}'
infra/supabase/up.sh >/dev/null; echo "exit=$?"
docker compose -p tceditor ps --format '{{.Health}}' | sort | uniq -c
docker exec tceditor-db psql -U postgres -d postgres -tAc "select count(*) from auth.users"
docker compose ls --filter name=tciam
```

預期輸出（compose 的移除進度訊息省略）：

```
reset: done. Run infra/supabase/up.sh to start with an empty database.
exit=0
       0
       0
       0
ls: infra/supabase/docker/volumes/db/data: No such file or directory
ls: infra/supabase/docker/volumes/storage: No such file or directory
-rw-------
exit=0
  11 healthy
0
NAME                STATUS              CONFIG FILES
tciam               running(17)         /Users/kaellim/Desktop/projects/LDAP/deploy/supabase/docker/docker-compose.yml,/Users/kaellim/Desktop/projects/LDAP/deploy/supabase/docker/docker-compose.logs.yml,/Users/kaellim/Desktop/projects/LDAP/deploy/supabase/docker/docker-compose.tciam.yml
```

`reset.sh` 只刪除 tceditor 的 container、volume、網路與兩個資料目錄，`.env` 保留；重新啟動時 Docker 自動建立資料目錄，資料庫從空的開始（0 個使用者）。tciam 不受影響。

- [ ] **Step 29: Commit**

```sh
cd /Users/kaellim/Desktop/projects/puck
git add infra/supabase/reset.sh
git commit -m "chore(infra): add reset script for the supabase dev stack" -m "Delete only the tceditor compose project's containers, volumes and data directories after checking the project name, and require typing the project name or passing --yes."
```

預期：commit 成功（1 file changed, 55 insertions）。

- [ ] **Step 30: 撰寫 `infra/supabase/README.md`**

建立 `infra/supabase/README.md`（完整內容，已是 Prettier 格式）：

````markdown
# tceditor 自架 Supabase（本機開發）

tceditor 本機開發用的自架 Supabase，與本機其他 Supabase stack（tciam、tcdata 等）互不干擾。設計見 `docs/superpowers/specs/2026-10-08-s1-fork-baseline-design.md` §7。

## 組成

| 路徑                                 | 內容                                                                                                                                                               |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `docker/`                            | 官方 [supabase/supabase](https://github.com/supabase/supabase) 的 `docker/` 目錄，ref 記在 `docker/.supabase-version`。官方檔案一律不改，Prettier 也略過整個目錄。 |
| `LICENSE`                            | `docker/` 內官方檔案的授權（Apache License 2.0，取自同一個 ref）。根目錄的 MIT 授權不涵蓋這些檔案。                                                                |
| `docker/docker-compose.tceditor.yml` | tceditor 的 override：compose 專案名 `tceditor`、container 名稱 `tceditor-*`、host port 只綁 `127.0.0.1`、Realtime 的網路別名。                                    |
| `setup-env.sh`                       | 產生 `docker/.env`（祕密由官方 `utils/generate-keys.sh` 產生）。`.env` 已存在時拒絕覆蓋。                                                                          |
| `up.sh` / `down.sh` / `reset.sh`     | 啟動、停止、清除資料。三者共用 `lib.sh`，只會操作 `tceditor` 這個 compose 專案。                                                                                   |

不含 logs 子系統（Logflare、Vector），也不含寄信服務：Auth 設為 email 自動確認。

## Port

| 服務                                   | host port        |
| -------------------------------------- | ---------------- |
| API gateway（Envoy，同時提供 Studio）  | `127.0.0.1:8200` |
| Postgres（Supavisor session 模式）     | `127.0.0.1:5434` |
| Postgres（Supavisor transaction 模式） | `127.0.0.1:6545` |

`up.sh` 啟動前會用 `lsof` 與 `nc` 檢查這些 port；被其他程式佔用就停止，不會啟動。

## 需求

- Docker Desktop，Compose v2.24.4 以上（override 用到 `!override`）。
- `openssl`、`lsof`、`nc`（macOS 內建）。

## 第一次使用

```sh
infra/supabase/setup-env.sh
infra/supabase/up.sh
```

## 日常操作

| 指令                      | 作用                                                                                                                                               |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `infra/supabase/up.sh`    | 啟動，並等到所有服務都是 healthy。                                                                                                                 |
| `infra/supabase/down.sh`  | 停止並移除 container；資料保留。                                                                                                                   |
| `infra/supabase/reset.sh` | 刪除 `tceditor` 的 container、volume 與 `docker/volumes/db/data`、`docker/volumes/storage`。要輸入專案名稱確認，或加 `--yes`。`docker/.env` 保留。 |

在 `docker/` 目錄裡直接執行 `docker compose ...` 也可以：`.env` 的 `COMPOSE_FILE` 會疊上 `docker-compose.tceditor.yml`，專案名同樣是 `tceditor`。但 docker compose 會讓 shell 中 export 的同名變數（例如為其他 stack 設過的 `POSTGRES_PASSWORD`）蓋過 `.env`；三個腳本會先清掉這些變數，所以啟動與清除資料請用腳本。

## 帳密與金鑰

全部在 `infra/supabase/docker/.env`（不進版控，權限 600）：

| 用途                                            | `.env` 的鍵                                |
| ----------------------------------------------- | ------------------------------------------ |
| Studio 登入（瀏覽器開 `http://127.0.0.1:8200`） | `DASHBOARD_USERNAME`、`DASHBOARD_PASSWORD` |
| API key                                         | `ANON_KEY`、`SERVICE_ROLE_KEY`             |
| Postgres（使用者 `postgres.tceditor`）          | `POSTGRES_PASSWORD`                        |

```sh
sed -n 's/^DASHBOARD_USERNAME=//p; s/^DASHBOARD_PASSWORD=//p' infra/supabase/docker/.env
```

## 快速檢查

```sh
ANON_KEY=$(sed -n 's/^ANON_KEY=//p' infra/supabase/docker/.env)
curl -sS -o /dev/null -w '%{http_code}\n' -H "apikey: ${ANON_KEY}" http://127.0.0.1:8200/auth/v1/settings
```

預期輸出 `200`。注意：官方 gateway 只允許 `SERVICE_ROLE_KEY` 讀取 `/rest/v1/` 根路徑（OpenAPI 描述），用 anon key 會得到 `403 RBAC: access denied`，這是官方設定，不是故障；anon key 查詢資料表（`/rest/v1/<table>`）則正常。

## 注意事項

- 不要執行 `docker/reset.sh`（官方版本）。它以 `docker-compose.yml` 加 `dev/docker-compose.dev.yml` 操作，專案名會變成 `supabase`，並會重設 `.env`。清除資料一律用 `infra/supabase/reset.sh`。
- 更換祕密：`reset.sh` → 刪除 `docker/.env` → `setup-env.sh` → `up.sh`。資料庫初始化後就固定使用當時的密碼，只換 `.env` 會讓服務連不上資料庫。
- `SITE_URL` 目前指向 gateway（`http://127.0.0.1:8200`）。之後串接前端時，改成前端網址並重新啟動。
- 升級官方版本屬於另一項工作：官方的 `docker/update.sh` 會以 `.supabase-version` 為基準做三方合併，升級後要重新跑一次上面的檢查。
````

```sh
cd /Users/kaellim/Desktop/projects/puck
pnpm exec prettier --check infra/supabase/README.md
git hash-object infra/supabase/README.md
ANON_KEY=$(sed -n 's/^ANON_KEY=//p' infra/supabase/docker/.env)
curl -sS -o /dev/null -w '%{http_code}\n' -H "apikey: ${ANON_KEY}" http://127.0.0.1:8200/auth/v1/settings
```

預期輸出：

```
Checking formatting...
All matched files use Prettier code style!
d4ecc90472b1c53b4687993ec0ecbc88bcaf1f2a
200
```

若 Prettier 報告格式問題，執行 `pnpm exec prettier --write infra/supabase/README.md` 後再比對 hash；README 中的快速檢查指令同時在這裡實際執行一次。

```sh
cd /Users/kaellim/Desktop/projects/puck
git add infra/supabase/README.md
git commit -m "docs(infra): document the tceditor supabase dev stack"
```

預期：commit 成功（1 file changed, 77 insertions）。

- [ ] **Step 31: 收尾與最終檢查**

```sh
cd /Users/kaellim/Desktop/projects/puck
infra/supabase/down.sh >/dev/null; echo "exit=$?"
docker compose ls
docker ps -a --format '{{.Names}}' | grep -c '^tceditor-'
git hash-object infra/supabase/.gitignore infra/supabase/LICENSE infra/supabase/docker/.supabase-version infra/supabase/docker/docker-compose.tceditor.yml infra/supabase/setup-env.sh infra/supabase/lib.sh infra/supabase/up.sh infra/supabase/down.sh infra/supabase/reset.sh infra/supabase/README.md
git ls-files infra/supabase | wc -l
git ls-files infra/supabase | grep -c '\.env$'
pnpm format:check 2>&1 | grep infra/ || echo "no infra/ warnings"
git status --short
git log --oneline -6
```

預期輸出：

```
exit=0
NAME                STATUS              CONFIG FILES
...（沒有 tceditor；tciam 那一行與 Step 1 完全相同，其他 stack 與 Step 1 相同）
0
32dfdea7817ab2afee2c78d424abbb537bb47ad1
49ea124025275674563eeff03af0f653ca49fdc0
ea5fa6a73656494eaf9cd019b55e12b0cb20447a
c5abc7561ce058f2a5d9614702587a1f5ac12d1b
42f136aa465827fe20666bbe53ab00ba3b53bc67
fbed5ae8d2dade5c8148fb5cf762f8661a31a134
d867e25ab25fc4c92821f56a3db66652dd53f2c2
982b8cecfea250cfe67c14e434f214462c0f0a74
479ee319e25310f7ac256c15bfce4765858e28b5
d4ecc90472b1c53b4687993ec0ecbc88bcaf1f2a
      72
0
no infra/ warnings
?? CLAUDE.md
<hash> docs(infra): document the tceditor supabase dev stack
<hash> chore(infra): add reset script for the supabase dev stack
<hash> chore(infra): add up and down scripts for the supabase dev stack
<hash> chore(infra): add tceditor compose override for supabase
<hash> chore(infra): add setup-env script for the supabase dev stack
<hash> chore(infra): vendor supabase self-hosted docker setup at a4be167
```

判斷條件：

- 沒有任何 `tceditor-*` container 在執行或殘留（`down.sh` 只移除 container 與網路，volume 與 `docker/volumes/db/data` 保留，下次 `up.sh` 沿用）。
- 10 個 blob hash 與上面逐一相同，代表檔案與驗證過的版本逐字一致（`LICENSE` 與官方同一個 ref 的檔案相同）。
- `infra/supabase` 下有 72 個受版控檔案（62 個官方檔案、`.supabase-version`、override、`LICENSE`、`.gitignore`、5 個腳本、README），其中沒有 `.env`。
- `git status --short` 只剩 `?? CLAUDE.md`（若 Task 1 之後該檔已有其他處置，以 Task 1 的結果為準）。
- 本 task 只改動 `.prettierignore` 與 `infra/`，`pnpm test`、`typecheck`、`lint`、`build`、`audit:gate` 的結果不受影響；完整的 `pnpm verify` 在 Task 14 執行。

### Task 14: 文件與最終驗證

目的：把 repo 的說明文件改成 tceditor 的版本（規格 §8），再對 `tzuchi/main` 做最終驗證，逐項確認規格 §10 的驗收標準。具體內容：

- 改寫 `CLAUDE.md`（英文），並且**開始納入版控**。
- 改寫 `README.md`（繁體中文）。
- 改寫 `CONTRIBUTING.md` 與 `apps/demo/README.md`，移除 `CODE_OF_CONDUCT.md`。
- 在 `CHANGELOG.md` 記錄這些文件變更。
- 最終驗證：主工作目錄與乾淨 clone 各跑一次 `pnpm install --frozen-lockfile` 與 `pnpm verify`；檢查 `pnpm pack` 的內容；以瀏覽器自動化實際拖放並編輯 richtext；啟停 Supabase；最後逐項執行驗收檢查。

共 3 個 commit，最終驗證不產生 commit。

**執行位置**：主工作目錄 `/Users/kaellim/Desktop/projects/puck`，分支 `tzuchi/main`，接在 Task 13 的最後一個 commit（`docs(infra): document the tceditor supabase dev stack`）之後。每個指令區塊開頭都有 `cd`，可以在新的 shell 中單獨執行。除了 Step 20 之外，下列指令都在 macOS 的 zsh 中實際執行過。迴圈變數不要取名為 `path` 或 `status`：zsh 的 `path` 與 `PATH` 綁在一起，`status` 是唯讀變數。

**驗證方式**：撰寫本 task 時，先在 `refs/tceditor-plan/task04` 的暫存 worktree 上套用 Task 5–13 的計畫產出（Task 5–12 的 commit 與 Task 13 中 vendored 目錄以外的檔案），得到與執行完 Task 13 相同的程式碼。接著在這份程式碼上依序實際執行本 task 的 Step 1–11（文件內容與指令都直接取自本片段），並在由它 clone 出來的乾淨 repo 中執行 Step 12–15 與 Step 16–19 的檢查指令。下面的預期輸出都來自這些實際執行的結果，但有三處例外：Step 16 的分支、remote 與 `main` 的 hash 取自主工作目錄的現況與 Task 1；Step 17 的 `infra/supabase/LICENSE` hash 取自 Task 13；Step 20（Supabase）的指令與輸出沿用 Task 13 已驗證的版本。

審查後的修正（備份位置、iframe 模式的端對端檢查、乾淨 clone 的快取隔離、文件措辭與 §9 測試清單）也以同樣方式重新驗證：在重建的 Task 13 狀態上重跑 Step 1–13、15、19、21，這次 Task 13 的官方 vendored 檔案也已補上。Step 2 與 Step 21 的備份指令另外在一份獨立 clone 中執行，因為在 linked worktree 中，`git rev-parse --git-common-dir` 會指向主 repo 的 `.git`。Step 15 連續執行 3 次都通過。

**設計決定**：

- **`CLAUDE.md` 改為受版控檔案**。之前它是使用者未追蹤的檔案，內容描述上游 main 的結構，例如 `lib/props/*`、`@puckeditor/core`、pnpm 11 的 `allowBuilds`，這些在 tceditor 都不存在。Task 1–13 都刻意不 commit 它。本 task 依規格 §8 改寫成 fork 版並 commit，讓每個 clone 都有同一份指引：
  - Step 2 先把原檔備份到 `.git/tceditor-backup/CLAUDE.md.pre-task14`，之後不刪除，由使用者決定如何處理。不放在 `$TMPDIR`：macOS 會自動清掉 `$TMPDIR` 中 3 天沒有存取的檔案。`.git` 內的檔案不會被追蹤，也不會被 `git clean` 或 `git gc` 刪除。備份已存在時不覆蓋，所以重跑本 task 也不會用改寫後的內容蓋掉原檔。
  - 內容以 v0.23.0 加上 Task 1–13 的結果為準。例如 props 管線在 `lib/use-slots.tsx` 與 `lib/field-transforms/*`；`lookupComponentConfig` 依 Task 11 的實作使用 `Object.prototype.hasOwnProperty.call`，並禁止使用 `Object.hasOwn`（core 的 TypeScript lib 不含它，會得到 TS2550）。
  - 以英文撰寫，與程式碼註解一致；開頭保留 Claude Code 的標準前言。
- **`README.md` 以繁體中文改寫**，內容包括：來源與授權（含 `infra/supabase/docker/` 的 Apache-2.0）、與上游的差異、使用方式、安裝與驗證、啟動 demo 與 Supabase。範例程式在 Step 8 以 demo 的 TypeScript 設定實際做型別檢查。
- **`CONTRIBUTING.md` 改寫為繁體中文的內部開發流程**。上游版的內容都只適用於 Puck 社群：GitHub issue 與 label 流程、Discord、canary 發佈、yarn。新版保留仍然適用的規範（TypeScript、SUIT CSS、conventional commits、公開 API 審慎），加上 tceditor 的流程，包括 `pnpm verify`、CHANGELOG、資安規則摘要、移植上游修正與發佈現況。
- **刪除 `CODE_OF_CONDUCT.md`**。它是 Puck 社群的 Contributor Covenant，唯一的通報管道是 Puck 的 Discord（第 62 行）。tceditor 是內部專案，沒有外部社群，也沒有指定的通報窗口，保留一份無法執行的行為準則反而會誤導人。日後若開放外部貢獻，再依組織規範重新制定。repo 中（`apps/docs` 以外）沒有其他檔案連結到它。
- **`apps/demo/README.md` 也一併改寫**。它原本是上游 `next` recipe 的說明，內容是 `npx create-puck-app` 與 `yarn dev`。Task 1 已註明這部分留給 Task 14。
- **新文件不出現 `@puckeditor` 字樣**。`CLAUDE.md` 納入版控後，Task 2 Step 8 的 `git grep "@puckeditor"`（排除 `apps/docs`、`docs/superpowers`、`CHANGELOG.md`）也會搜尋到它，所以這項檢查仍然必須是 exit 1。
- **文件的檢查方式**（取代 TDD 的「失敗測試」）。以下檢查都先在舊文件上確認失敗（Step 3），改寫後再確認通過（Step 11）：
  1. `tceditor-check-doc-paths.mjs` 列出文件中以反引號標出、但實際不存在的 repo 路徑，用來抓出舊結構，例如 `lib/props/*`。
  2. 一個 `git grep` 抓上游專屬的操作指示，包括 yarn 指令、`npx`、Discord、`@puckeditor`、`puckeditor.com`、`lib/props`、`allowBuilds`、`.github/` 與 canary。
  3. `prettier --check`。
  4. 以 `git hash-object` 比對檔案，確認與驗證過的版本逐位元組相同。
- **最終驗證不只在主工作目錄跑**。主工作目錄可能有 gitignored 的殘留物，例如舊的 `dist` 或 `node_modules`，可能掩蓋問題，所以 Step 13 另外從 `tzuchi/main` clone 一份乾淨的 repo，在裡面安裝並跑 `pnpm verify`。

**規格偏離（請 orchestrator 向使用者說明）**：

1. `CLAUDE.md` 從未追蹤改為受版控（見設計決定）。原檔備份在 `.git/tceditor-backup/CLAUDE.md.pre-task14`。
2. `CODE_OF_CONDUCT.md` 直接刪除，不改寫（理由見設計決定）。規格 §3.2 的移除清單不包含這個檔案，所以**執行前必須先取得使用者同意**。若使用者不同意，要先修改本計畫再執行，受影響的地方有：
   - Step 10 的 `git rm -q CODE_OF_CONDUCT.md`，以及 CHANGELOG 那一行中關於 code of conduct 的片段。
   - Step 11 的 `test -e CODE_OF_CONDUCT.md`、commit 標題與內文，以及 commit 統計。
   - Step 17 移除清單中的 `CODE_OF_CONDUCT.md`。
   - Step 21 的 `git log -- … CODE_OF_CONDUCT.md` 與第三個 commit 的標題。

   這條替代路徑沒有實際驗證過。
3. 規格 §8 只點名 `CLAUDE.md` 與 `README.md`。本 task 另外改寫 `CONTRIBUTING.md` 與 `apps/demo/README.md`（繁體中文），並在 `CHANGELOG.md` 加一行。
4. 規格 §9 第 11 項寫的是「手動拖放與編輯 richtext」。計畫的執行者可能是沒有瀏覽器的代理，所以 Step 15 改用 puppeteer 腳本自動執行同樣的操作：從左側拖入 RichText、在欄位面板輸入粗體與連結、Publish、開啟公開頁並比對輸出。puppeteer 已隨 `pnpm smoke` 安裝。腳本使用編輯器預設的 iframe 模式，也就是使用者實際使用的模式，並在 `#preview-frame` 中讀取畫布，所以也涵蓋了 Task 12 改過的 AutoFrame 樣式鏡像。需要時，人工在瀏覽器中的檢查步驟也列在同一步。
5. Supabase 的驗收指令（Step 20）沿用 Task 13 Step 17–25 已實際驗證過的指令與輸出。撰寫本 task 時沒有再啟動一次 stack，原因有二：worktree 中沒有 vendored 的官方檔案，而且不想在已有 tciam、tcdata 執行的機器上再多開 11 個 container。
6. 規格與共同介面寫的 `@tiptap/*` 版本是 3.23.4，實際上 Task 1 已升級到 3.31.4。文件中一律寫 3.31.4。

**跨片段發現（全域審查已處理）**：

- **Task 5–9**：Task 9 Step 5 原本的 `for path in / /edit /rsc; do …; done` 在 zsh 中會把 `PATH` 改成 `/`。全域審查已改成 `for p in …`。
- **Task 1**：Task 1 Step 18 原本把使用者的 `CLAUDE.md` 備份到 `$TMPDIR`。全域審查已比照本 task 的 Step 2，改放在 `"$(git rev-parse --git-common-dir)/tceditor-backup/CLAUDE.md.pre-task01"`，備份已存在時不覆蓋。所以 `.git/tceditor-backup/` 之下會有兩份備份：`CLAUDE.md.pre-task01` 是使用者最原始的檔案，`CLAUDE.md.pre-task14` 是 Task 1 補過兩個空行之後的版本。

**Files:**

- Create：`CLAUDE.md`（覆蓋未追蹤的舊檔，並納入版控）
- Modify：`README.md`、`CONTRIBUTING.md`、`apps/demo/README.md`、`CHANGELOG.md`
- Delete：`CODE_OF_CONDUCT.md`
- 暫存檔（不 commit）：
  - `.git/tceditor-backup/CLAUDE.md.pre-task14`（原檔備份，保留；位於 `.git` 內，不會被追蹤）
  - `${TMPDIR:-/tmp}/tceditor-check-doc-paths.mjs`、`${TMPDIR:-/tmp}/tceditor-editor-check.mjs`（Step 21 刪除）
  - `apps/demo/readme-examples.tsx`（Step 8 建立後，在同一步刪除）
- Test：沒有新的 jest 測試。以文件檢查（Step 3、5、9、11）、`pnpm verify`（Step 12、13）、puppeteer 端對端檢查（Step 15）與驗收指令（Step 16–21）驗證。

**Interfaces:**

- Consumes（Task 1–13 完成後的最終狀態；文件內容逐一引用，名稱必須一致）：
  - 根目錄 scripts：`build`、`dev`、`lint`、`format`、`format:check`、`test`、`typecheck`、`audit:gate`、`check:bundle`、`smoke`，以及 `verify` = `pnpm test && pnpm typecheck && pnpm lint && pnpm format:check && pnpm build && pnpm check:bundle && pnpm audit:gate`（Task 1、8）。
  - 套件 `@tzuchi/tceditor`、`@tzuchi/tceditor-plugin-heading-analyzer`，版本 `0.1.0`、`private`。`exports` 為 `.`（含 `react-server` 條件）、`./rsc`、`./internal`、`./richtext-migrate`、`./tceditor.css`、`./package.json`（Task 2、3、8）。
  - richtext API：`normalizeRichText`、`RICHTEXT_MAX_DEPTH`、`isSafeHref`、`textToRichText`、`renderRichText`、`RichTextContent`、`RichTextDoc`；轉換入口提供 `richTextHtmlToJson`、`migrateRichTextInData`；另有 `fitToSchema` 與 Link 的 `isAllowedUri`（Task 5–9）。
  - `lookupComponentConfig(config, type): Config["components"][string] | undefined`，以 `Object.prototype.hasOwnProperty.call` 實作；索引改為 null-prototype；合併物件用 `Object.fromEntries`（Task 10、11）。
  - `<Puck nonce>`、`AppStore.nonce`、`applyNonce`，以及 dnd-kit 的 `StyleInjector.configure({ nonce })` 與 tiptap 的 `injectNonce`（Task 12）。
  - `infra/supabase/{setup-env,up,down,reset}.sh`，port `127.0.0.1:8200`、`5434`、`6545`，使用者 `postgres.tceditor`，以及 `infra/supabase/README.md` 與 `infra/supabase/LICENSE`（Task 13）。
  - `CHANGELOG.md` 的 `### Changes from Puck v0.23.0` 清單，以及「插在空行與 `## [0.23.0]` 之前」的慣例（Task 10–12）。
  - Task 12 結束時 `pnpm verify` 的基準：jest 80 個 suite／691 個測試／19 個 snapshot、`node:test` 13 個、`check:bundle` 23 個檔案、`105 package versions`。
- Produces：
  - 受版控的 `CLAUDE.md`：之後 S2–S6 的開發指引，尤其是其中的 Security rules。
  - `README.md`、`CONTRIBUTING.md`、`apps/demo/README.md`。
  - S1 完成時的基準數字（同上），供 S2 以後比對。

- [ ] **Step 1: 確認起點**

```sh
cd /Users/kaellim/Desktop/projects/puck
git branch --show-current
git status --short
git log --oneline -1
git ls-files --error-unmatch CLAUDE.md; echo "exit=$?"
```

預期（hash 會不同）：

```
tzuchi/main
?? CLAUDE.md
<hash> docs(infra): document the tceditor supabase dev stack
error: pathspec 'CLAUDE.md' did not match any file(s) known to git
Did you forget to 'git add'?
exit=1
```

`CLAUDE.md` 目前是未追蹤的檔案。分支不對、有 `?? CLAUDE.md` 以外的變更，或最新 commit 不是 Task 13 的最後一個 commit 時，先停下來回報。

- [ ] **Step 2: 備份 `CLAUDE.md`，建立文件路徑檢查工具**

```sh
cd /Users/kaellim/Desktop/projects/puck
BACKUP="$(git rev-parse --git-common-dir)/tceditor-backup/CLAUDE.md.pre-task14"
mkdir -p "$(dirname "$BACKUP")"
test -e "$BACKUP" && echo "backup exists, kept" || cp CLAUDE.md "$BACKUP"
cmp CLAUDE.md "$BACKUP" && echo "backup ok: $BACKUP"
git status --short
```

預期輸出（第一次執行）：

```
backup ok: .git/tceditor-backup/CLAUDE.md.pre-task14
?? CLAUDE.md
```

- 備份放在 `.git` 內：不會被追蹤，`git status` 看不到，也不會被系統的暫存檔清理刪除。這份備份是使用者原本的檔案，本 task 結束後也不要刪除。
- 重跑本步驟時，已存在的備份**不會被覆蓋**：會先印出 `backup exists, kept`；只要 `CLAUDE.md` 沒有變，接著仍然印出 `backup ok: …`。
- 若印出 `backup exists, kept` 之後接著是 `CLAUDE.md .git/tceditor-backup/CLAUDE.md.pre-task14 differ: char …, line …`，沒有 `backup ok`，表示之前執行到一半，`CLAUDE.md` 已被 Step 4 改寫但還沒 commit。只有在這種情況下，才執行下列指令還原：只有在目前內容正是 Step 4 的內容（hash 等於 Step 5 的預期值）時才會還原，並印出 `restored from .git/tceditor-backup/CLAUDE.md.pre-task14`。還原後重跑本步驟，應該印出 `backup exists, kept` 與 `backup ok: …`。若沒有印出 `restored`，表示 `CLAUDE.md` 被改成別的內容，停下來回報，不要覆蓋任何一份。

```sh
cd /Users/kaellim/Desktop/projects/puck
BACKUP="$(git rev-parse --git-common-dir)/tceditor-backup/CLAUDE.md.pre-task14"
test "$(git hash-object CLAUDE.md)" = 55f546496ae250af437d50811c6fa98eef8a9fcf && cp "$BACKUP" CLAUDE.md && echo "restored from $BACKUP"
```

建立 `${TMPDIR:-/tmp}/tceditor-check-doc-paths.mjs`（完整內容）：

```sh
cat > "${TMPDIR:-/tmp}/tceditor-check-doc-paths.mjs" <<'EOF'
// Prints every repo path quoted in `backticks` in the given Markdown files
// that does not exist. Paths under bundle/, components/, lib/, plugins/,
// reducer/, store/ or types/ are resolved in packages/core. Generated .env
// files are skipped.
import { existsSync, readFileSync } from "node:fs";

const coreDirs = /^(bundle|components|lib|plugins|reducer|store|types)\//;
const rootDirs = /^(apps|docs|infra|packages|scripts)\//;
let missing = 0;

for (const file of process.argv.slice(2)) {
  const text = readFileSync(file, "utf8");
  for (const [, token] of text.matchAll(/`([^`\s]+)`/g)) {
    const path = token.replace(/\/\*+$/, "").replace(/\/$/, "");
    if (/[<>{}$:@*]/.test(path) || /(^|\/)\.env$/.test(path)) continue;
    const resolved = coreDirs.test(path)
      ? `packages/core/${path}`
      : rootDirs.test(path)
      ? path
      : null;
    if (resolved && !existsSync(resolved)) {
      console.log(`${file}: ${token}`);
      missing++;
    }
  }
}
console.log(`${missing} missing path(s)`);
process.exitCode = missing ? 1 : 0;
EOF
```

這個工具列出 Markdown 中以反引號標出、但不存在的 repo 路徑，並以 exit 1 結束：
- 以 `apps/`、`docs/`、`infra/`、`packages/`、`scripts/` 開頭的路徑，從 repo 根目錄解析。
- 以 `bundle/`、`components/`、`lib/`、`plugins/`、`reducer/`、`store/`、`types/` 開頭的路徑，在 `packages/core` 底下解析。
- 含 `<`、`{`、`$`、`:`、`@`、`*` 的寫法（樣板、套件名、網址）與產生的 `.env` 不檢查。

- [ ] **Step 3: 紅燈：舊文件的檢查結果**

```sh
cd /Users/kaellim/Desktop/projects/puck
node "${TMPDIR:-/tmp}/tceditor-check-doc-paths.mjs" CLAUDE.md README.md CONTRIBUTING.md apps/demo/README.md; echo "exit=$?"
git grep --untracked -n -i -E "yarn (dev|build|install)|^yarn$|npx |npm i |discord|@puckeditor|puckeditor\.com|lib/props|allowBuilds|pnpm >= 11|\.github/|canary" -- CLAUDE.md README.md CONTRIBUTING.md CODE_OF_CONDUCT.md apps/demo/README.md packages/plugin-heading-analyzer/README.md | cut -d: -f1 | LC_ALL=C sort | uniq -c
```

預期輸出：

```
CLAUDE.md: packages/field-contentful
CLAUDE.md: packages/create-puck-app
CLAUDE.md: bundle/no-external.ts
CLAUDE.md: lib/props/render/*
CLAUDE.md: lib/props/editor/use-editor-props.tsx
CLAUDE.md: lib/props/render/use-render-props.tsx
6 missing path(s)
exit=1
   8 CLAUDE.md
   1 CODE_OF_CONDUCT.md
   5 CONTRIBUTING.md
   6 README.md
   2 apps/demo/README.md
```

- 第一個指令顯示舊 `CLAUDE.md` 引用了 6 個不存在的路徑：已移除的套件、`no-external` 入口，以及上游 main 才有的 `lib/props/*`。
- 第二個指令依檔案統計上游專屬的操作指示，`git grep --untracked` 讓未追蹤的 `CLAUDE.md` 也納入搜尋。
- `CLAUDE.md` 的兩組數字以撰寫計畫時主工作目錄的檔案為準（Task 1 Step 18 已用 Prettier 補過空行）。若使用者之後改過這個檔案，數字可能不同，但不會是 0。
- 其他 4 個檔案的數字必須相同。`packages/plugin-heading-analyzer/README.md` 已在 Task 2 改寫過，所以沒有出現。

- [ ] **Step 4: 改寫 `CLAUDE.md`**

把 `CLAUDE.md` 整個改成下列內容（已符合 Prettier 格式）：

````markdown
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

tceditor is Tzu Chi's visual page editor for React. It is a hard fork of [Puck](https://github.com/puckeditor/puck) v0.23.0 (git tag `v0.23.0`, commit `b4204f09`) under the MIT License (see `LICENSE` and `NOTICE`). This is a pnpm + Turborepo monorepo (Node >= 24, pnpm 10.26.1 pinned in `packageManager`):

- `packages/core` — the library, packaged as `@tzuchi/tceditor`. Nearly all real work happens here.
- `packages/plugin-heading-analyzer` — `@tzuchi/tceditor-plugin-heading-analyzer`, built with tsup like core.
- `packages/tsconfig`, `packages/tsup-config`, `packages/eslint-config-custom` — shared build and lint configuration.
- `apps/demo` — Next.js App Router playground used for development and the e2e smoke test.
- `scripts/` — the supply-chain gate (`audit-gate.mjs`, `audit-gate-lib.mjs`) and the puppeteer smoke test (`e2e/`).
- `infra/supabase/` — self-hosted Supabase for local development (see "Supabase dev stack").
- `apps/docs` — Puck's upstream documentation site, kept only as reference. It is not part of the pnpm workspace, is never installed or built, and still uses the upstream package names.
- `docs/superpowers/specs/` — the tceditor roadmap and the design specs of its sub-projects.

Both packages are at version `0.1.0` and marked `private`: they are not published to any registry, and apps in this monorepo depend on them with `workspace:*`.

Public API names are deliberately unchanged from Puck: `<Puck>`, `<Render>`, `usePuck`, the `Config` type, CSS class names, `--puck-*` CSS variables and `data-puck-*` attributes. Puck's v0.23 documentation in `apps/docs` still describes most of the API; this file and `CHANGELOG.md` say where tceditor differs.

## Fork, branches and remotes

- `tzuchi/main` is the fork's main line, branched from `v0.23.0`. Work on it or on branches from it.
- `main` is an unmodified mirror of upstream Puck, kept for comparing with upstream. Never commit to it.
- The `upstream` remote points to Puck's GitHub repository for reference only; its push URL is `no_push`. Our own remote will be added as `origin` once the hosting platform is decided.
- There is no upstream sync. To take an upstream bug fix, run `git fetch upstream` and `git cherry-pick -x <sha>` onto `tzuchi/main` (if it conflicts badly, redo the change by hand and cite the source commit), then add a line to `CHANGELOG.md`.

## Commands

From the repo root:

```sh
pnpm install        # also builds core and the plugin through their `prepare` scripts
pnpm dev            # runs only apps/demo on http://localhost:3000 (bound to 127.0.0.1); editor at /edit or any /<path>/edit
pnpm build          # turbo build of core, the plugin and the demo
pnpm test           # core's jest suites, then the node:test suites of the audit gate and check:bundle
pnpm typecheck      # tsc over core's production sources (packages/core/tsconfig.typecheck.json)
pnpm lint
pnpm format:check   # prettier over ts, tsx, mjs, md, mdx and css files; use `pnpm format` to fix
pnpm check:bundle   # after a build: fails if the main or RSC entry can reach @tiptap/html or happy-dom
pnpm audit:gate     # pnpm audit; fails only on advisories in versions that ship with core or the plugin
pnpm verify         # test, typecheck, lint, format:check, build, check:bundle, audit:gate (in that order)
pnpm smoke          # puppeteer drag-and-drop smoke test; needs the demo running on :3000
```

There is no CI yet, so `pnpm verify` is the gate: work is not done until it passes. `audit:gate` needs network access.

Running a single test:

```sh
pnpm --filter @tzuchi/tceditor test lib/richtext/__tests__/normalize.spec.ts   # one jest file
pnpm --filter @tzuchi/tceditor test -t "name of test"                          # jest, by test name
node --test scripts/audit-gate-lib.test.mjs                                     # one node:test file
```

Core tests use Jest with ts-jest and jsdom. They are `*.spec.ts(x)` files inside `__tests__/` folders next to the code they cover; shared test helpers live in `__helpers__/`. Neither is checked by `pnpm typecheck`. Tests that need the real happy-dom start with `/** @jest-environment node */`.

- `apps/demo/tsconfig.json` maps `@tzuchi/tceditor` to `packages/core/index.ts`, so the demo runs core from source and you don't need to build core while developing.
- `pnpm-lock.yaml` is authoritative. Install with `pnpm install --frozen-lockfile`, and commit lockfile changes together with the `package.json` change that caused them.
- In a linked git worktree, run `export TURBO_CACHE_DIR="$PWD/.turbo/cache"` before turbo-backed commands (`test`, `lint`, `build`, `verify`); otherwise turbo writes its cache into the main checkout.

## Core architecture (`packages/core`)

### Entry points

`bundle/` defines the published entry points, and `package.json` `exports` maps them:

- `bundle/core.ts` is the **public API surface** (`@tzuchi/tceditor`). Anything exported here is public API, and changes to it get extra review.
- `bundle/index.ts` is core plus `index.css`. The built `dist/index.css` is the only stylesheet export, `@tzuchi/tceditor/tceditor.css`. By default the editor injects its CSS at runtime, so importing the stylesheet is optional.
- `bundle/rsc.tsx` is served under the `react-server` export condition and as `@tzuchi/tceditor/rsc`. It exposes `Render` from `components/ServerRender`, the data helpers and the richtext renderer. Code it reaches must not import client-only code (zustand store, context, effects).
- `bundle/internal.ts` (`@tzuchi/tceditor/internal`) exposes internals such as `createReducer`.
- `bundle/richtext-migrate.ts` (`@tzuchi/tceditor/richtext-migrate`) is the server-only converter from legacy HTML richtext to JSON. It is the only entry allowed to reach `@tiptap/html` and `happy-dom`. Its CJS build needs Node >= 22.12 (`require(esm)`); on Node 20 use the ESM build.

Importing the package must have no side effects, so it can run in edge runtimes. For example, the fallback store in `store/index.ts` is created lazily so `crypto.randomUUID` isn't called at import time. `__tests__/edge-runtime.spec.ts` enforces this.

### State: one zustand store per `<Puck>`

`store/index.ts` `createAppStore` builds the store. `components/Puck` creates one and provides it through `appStoreContext`. The store is composed of slices in `store/slices/`: `history`, `nodes`, `permissions` and `fields`. Components read from it with `useAppStore(selector)` or `useAppStoreApi()`. The public `usePuck` / `useGetPuck` / `createUsePuck` API (`lib/use-puck.ts`) is a separate store synced from the app store.

- `state` is a `PrivateAppState`: the public `AppState` (`{ data, ui }`) plus `indexes: { nodes, zones }`. `nodes` is keyed by component id and holds the data, flat data, `parentId`, `zone` and path. `zones` is keyed by the compound id `"<parentId>:<zoneName>"`, and the root content zone is `"root:default-zone"`. Both indexes are null-prototype objects. `lib/data/make-state-public.ts` strips the indexes before state reaches user callbacks such as `onAction`, `onChange` and `usePuck`.
- All data mutations go through `dispatch(action)` → `reducer/index.ts` `createReducer`, which delegates to `reducer/actions/*`. Actions rebuild the indexes with `lib/data/walk-app-state.ts`, so new actions should do the same rather than editing `data` by hand. History is recorded for every action except `registerZone`, `unregisterZone`, `setData`, `setUi` and `set`, unless the action passes `recordHistory`.

### Data model: slots vs. legacy DropZones

`Data` is `{ root, content, zones }`. Nesting is done with **slot fields** (`type: "slot"`), which store child content inline in props. `<DropZone>` together with the top-level `zones` map is deprecated but still supported. Tree utilities in `lib/data/`, such as `walkTree`, `walkAppState`, `mapFields` and `forRelatedZones`, handle both forms. `lib/migrate.ts` converts the legacy format to slots.

### Props pipeline: field transforms

A component's stored props are turned into the props its `render` receives by `lib/data/map-fields.ts`, driven by `FieldTransforms` (a map from field type to transform function, `types/API/FieldTransforms.ts`). `lib/field-transforms/use-field-transforms.tsx` and `use-field-transforms-tracked.tsx` apply them through `build-mappers.ts`; the built-in transforms are in `lib/field-transforms/default-transforms/` (slot, inline text, richtext).

- Editor: `components/DropZone` combines the built-in slot, inline text and richtext transforms, then each plugin's `fieldTransforms`, then the user's `fieldTransforms` prop, in that order, and applies them with `useFieldTransformsTracked`. The root (`components/Puck/components/Preview/components/editor-page.tsx`) applies only the slot transform and then `useRichtextProps`.
- Render: `lib/use-slots.tsx` applies only the slot transform. It is used by `components/Render` (client), `components/ServerRender` (RSC) and `components/SlotRender/server.tsx`, which then pass richtext fields through `useRichtextProps` (`components/RichTextEditor/lib/use-richtext-props.tsx`). This path must stay RSC-safe.

Async `resolveData` / `resolveFields` / `resolvePermissions` on component configs run through `lib/resolve-component-data.ts`, the store's `resolveComponentData`, and `lib/resolve-all-data.ts` for server-side use.

### Richtext: Tiptap JSON and one shared renderer

Richtext field values are stored as Tiptap JSON (`RichTextDoc`, `editor.getJSON()`), never as HTML. `lib/richtext/` is the single implementation, exported from the main and RSC entries:

- `normalize.ts` — `normalizeRichText(value)` reduces any input (editor JSON, tampered JSON, legacy HTML strings) to the default PuckRichText schema: nodes `doc`, `paragraph`, `heading` (1–6), `bulletList`, `orderedList`, `listItem`, `blockquote`, `codeBlock`, `horizontalRule`, `hardBreak`, `text`; marks `link`, `bold`, `italic`, `underline`, `strike`, `code`. Unknown nodes and marks keep only their text, every attribute is validated (`textAlign` must be `left`, `center`, `right` or `justify`; link `class` is always `null`), and nodes deeper than `RICHTEXT_MAX_DEPTH` (100) become text. A string is always one plain-text paragraph; HTML is never parsed at render time.
- `is-safe-href.ts` — `isSafeHref(href)` allows only `http:`, `https:`, `mailto:`, `tel:` and relative URLs. The renderer, the editor's Link extension (`isAllowedUri` in `components/RichTextEditor/extension.ts`) and the converter all use it.
- `render.tsx` — `renderRichText(value)` normalizes, then renders with `@tiptap/static-renderer` (`json/react`) through null-prototype `nodeMapping` and `markMapping`. `components/RichTextEditor/components/RichTextContent.tsx` wraps it without hooks, so it works in RSC.
- `text-to-richtext.ts` — `textToRichText(text)` builds a one-paragraph document.

The editor (`components/RichTextEditor`) lazy-loads Tiptap. Before it loads, `EditorFallback` shows the same `renderRichText` output, so the canvas, the preview and the published page always match. `components/RichTextEditor/lib/use-synced-editor.ts` stores `editor.getJSON()` and fits the content to the field editor's schema with `components/RichTextEditor/lib/fit-to-schema.ts`. `lib/richtext/html-to-json.ts` (`richTextHtmlToJson`) and `migrate-data.ts` (`migrateRichTextInData`) convert legacy HTML on the server through the `richtext-migrate` entry.

All `@tiptap/*` packages are pinned to the same exact version (3.31.4); `@tiptap/static-renderer` must always equal the `@tiptap/core` version in the lockfile, so upgrade them together. Core's tsconfig uses `"moduleResolution": "node"`, so subpath exports such as `@tiptap/static-renderer/json/react` and `@tiptap/html/server` need `paths` entries (without a file extension) in `packages/core/tsconfig.json`, and in `apps/demo/tsconfig.json` when the demo reaches them.

### Editor UI composition

`components/Puck` assembles the layout from `components/Puck/components/*`. The left-hand panels (`plugins/blocks`, `plugins/fields`, `plugins/outline`, `plugins/legacy-side-bar`) are themselves plugins. Users customize the UI through `overrides` (`types/API/Overrides.ts`, merged in `lib/load-overrides.ts`) and through plugins, which can contribute overrides, panels and field transforms.

The preview renders inside an iframe (`components/AutoFrame`). The editor's own CSS is injected at runtime by `lib/use-inject-css.ts` from `lib/generated/runtime-css.ts`. That file is an empty stub in source and tests, and `packages/core/tsup.config.ts` replaces it at build time with the bundled CSS strings. Drag-and-drop uses `@dnd-kit` pinned to exact `0.4.0` versions, with custom collision and drop logic in `lib/dnd/`.

### UI strings

Every user-visible string in the editor is a key in `lib/dictionary.ts` (`defaultDictionary`, keys such as `header-publish` or `action-duplicate`). Components must read strings with `useMessage(key, params)` so the `dictionary` prop can override them. Don't hard-code UI text.

## Security rules

These rules come from the adoption audit of Puck v0.23.0 and the S1 fixes. Follow them in every change.

- **Never add `dangerouslySetInnerHTML`.** The only remaining use is Puck's `InsertPreview` in `components/DropZone/index.tsx`, which copies the `outerHTML` of an element the editor already rendered; don't copy that pattern. `__tests__/richtext-no-inner-html.spec.ts` keeps it out of the richtext sources.
- **Richtext is stored only as Tiptap JSON and displayed only through the shared renderer** (`renderRichText` / `RichTextContent`). Don't render richtext with `generateHTML`, `editor.getHTML()` or by parsing HTML, and don't store HTML. Convert legacy HTML on the server with `@tzuchi/tceditor/richtext-migrate`.
- **A new Tiptap extension that adds a node, a mark or an attribute must land together with its renderer mapping and attribute validation:** the extension in `components/RichTextEditor/extension.ts`, the allowed types, structure rules and attribute checks in `lib/richtext/normalize.ts`, the `nodeMapping` / `markMapping` entry in `lib/richtext/render.tsx`, and tests (consistency with Tiptap's output in `lib/richtext/__tests__/render.spec.tsx`, malicious attributes in `xss.spec.tsx`). Until then the renderer shows such content as plain text and the editor drops it when the content is reopened (it warns in development).
- **`isSafeHref` is the only rule for link hrefs.** Change it, never a copy of it, so the renderer, the editor and the converter stay in agreement.
- **In new code, look up component configs with `lookupComponentConfig(config, type)`** (`lib/lookup-component-config.ts`), never `config.components[type]`: data can contain types such as `constructor` or `__proto__`. The few direct reads left in the editor UI only fetch a component's `label` and predate this rule. For other user-supplied objects keyed by data, such as `propTransforms` or `migrateDynamicZonesForComponent`, check `Object.prototype.hasOwnProperty.call(obj, key)` first. Core's TypeScript lib does not include `Object.hasOwn` (TS2550), so don't use it.
- **Objects keyed by user data** (component ids, zone compounds, prop names): create lookup tables and accumulators with `Object.create(null)`, and build merged objects with `Object.fromEntries`. Don't spread an accumulator inside `reduce` or assign `acc[key] = value` on a plain object: it is O(n²) and a `__proto__` key replaces the prototype. The null-prototype indexes have no `hasOwnProperty` method, so use `in`, `Object.keys` or `Object.prototype.hasOwnProperty.call`.
- **Every `<style>` (or `<link>`) injected at runtime carries the CSP nonce, set before the element is attached.** The nonce comes from `<Puck nonce>` via `AppStore.nonce`; use `applyNonce(el, nonce)` from `lib/use-inject-css.ts`, and pass it to third-party injectors (dnd-kit's `StyleInjector.configure({ nonce })`, Tiptap's `injectNonce`). Host styles mirrored into the preview iframe keep only a nonce they already carry; never stamp the trusted nonce onto them.
- **No third-party requests from the library or the demo:** no external fonts, remote `url()` or `@import` in CSS (`__tests__/css-imports.spec.ts`), analytics or CDN scripts.
- **The demo's `dev` and `start` servers bind to `127.0.0.1`**, because the demo's `next` version has unpatched critical advisories. Don't expose them on the network.
- **Dependencies:** `onlyBuiltDependencies` in `pnpm-workspace.yaml` allowlists dependency lifecycle scripts, and `overrides` pins vulnerable transitive dependencies. Keep both lists minimal and comment every entry (with its GHSA id for overrides). When core or plugin production code starts importing a devDependency, tsup bundles it into `dist`, so add it to `BUNDLED_DEV_DEPENDENCIES` in `scripts/audit-gate-lib.mjs` and to the test that asserts that constant. `@tiptap/html` and `happy-dom` may only be imported from the `richtext-migrate` code.
- **Secrets:** `infra/supabase/docker/.env` holds generated keys and passwords and must never be committed.

## Supabase dev stack

`infra/supabase/` runs a self-hosted Supabase for local development as the compose project `tceditor` (11 containers named `tceditor-*`), isolated from the other Supabase stacks on the machine. `infra/supabase/README.md` has the details.

```sh
infra/supabase/setup-env.sh   # first time only: writes docker/.env with generated secrets
infra/supabase/up.sh          # start and wait until every service is healthy
infra/supabase/down.sh        # stop; data is kept
infra/supabase/reset.sh       # delete tceditor's containers, volumes and data (asks for confirmation, or pass --yes)
```

- Endpoints: API gateway and Studio on `http://127.0.0.1:8200`, Postgres through Supavisor on `127.0.0.1:5434` (session) and `127.0.0.1:6545` (transaction) as user `postgres.tceditor`. Keys and passwords are in `infra/supabase/docker/.env`.
- `infra/supabase/docker/` is a byte-identical copy of the official `supabase/supabase` `docker/` directory (ref in `docker/.supabase-version`, licensed Apache-2.0, see `infra/supabase/LICENSE`). Don't edit it; tceditor's changes live in `docker/docker-compose.tceditor.yml`. Prettier ignores the directory.
- Use only these scripts or `docker compose -p tceditor …`. Never run the official `docker/reset.sh`, and never stop or modify other compose projects (tciam, tcdata and others).

## Conventions

- **CSS**: use CSS Modules with [SUIT CSS](https://suitcss.github.io) naming, applied through `getClassNameFactory("ComponentName", styles)` (`lib/get-class-name-factory.ts`). Calling it with a string gives a descendant class (`ComponentName-child`) and with an object gives modifiers (`ComponentName--modifier`). Never rely on global styles, because tceditor is embedded in pages whose CSS is out of our control.
- **TypeScript**: avoid `any`.
- **Commits**: use Angular-style conventional commits in English (`feat:`, `fix:`, `docs:`, `build:`, …). Record every user-visible change as a line in `CHANGELOG.md`, in the `### Changes from Puck v0.23.0` list under `## tceditor 0.1.0 (unreleased)`; everything below that is Puck's history and stays unchanged. Stage files by path; don't commit untracked files you didn't create.
- **Package files**: `packages/core` and `packages/plugin-heading-analyzer` ship copies of the root `LICENSE` and `NOTICE`, and `__tests__/package-files.spec.ts` requires them to stay byte-identical. A core test that reads files outside `packages/core` must list them in the `inputs` of `@tzuchi/tceditor#test` in `turbo.json`, or turbo replays stale cached results.
- **Formatting and lint**: Prettier 2 with default settings. `CHANGELOG.md`, `docs/superpowers/` and `infra/supabase/docker/` are excluded (`.prettierignore`). ESLint uses `eslint-config-next`; don't add new warnings.
````

- [ ] **Step 5: 檢查 `CLAUDE.md` 並 commit**

```sh
cd /Users/kaellim/Desktop/projects/puck
git hash-object CLAUDE.md
pnpm exec prettier --check CLAUDE.md
node "${TMPDIR:-/tmp}/tceditor-check-doc-paths.mjs" CLAUDE.md; echo "exit=$?"
git grep --untracked -n -i -E "yarn (dev|build|install)|^yarn$|npx |npm i |discord|@puckeditor|puckeditor\.com|lib/props|allowBuilds|pnpm >= 11|\.github/|canary" -- CLAUDE.md; echo "exit=$?"
```

預期輸出：

```
55f546496ae250af437d50811c6fa98eef8a9fcf
Checking formatting...
All matched files use Prettier code style!
0 missing path(s)
exit=0
exit=1
```

hash 不同，表示內容與驗證過的版本不一致。常見原因是複製時漏了最後的換行，或某一行被編輯器自動折行。路徑檢查必須在 Task 13 完成後執行，因為 `infra/supabase/LICENSE` 由 Task 13 建立。

```sh
cd /Users/kaellim/Desktop/projects/puck
git add CLAUDE.md
git commit -m "docs: add CLAUDE.md for tceditor" -m "Describe the fork, its commands, the v0.23.0 architecture as it stands after the S1 changes (props pipeline in lib/use-slots.tsx and lib/field-transforms, richtext stored as Tiptap JSON and rendered by one shared renderer), the security rules for future changes and the Supabase dev stack."
git status --short
```

預期（hash 會不同）：

```
[tzuchi/main <hash>] docs: add CLAUDE.md for tceditor
 1 file changed, 157 insertions(+)
 create mode 100644 CLAUDE.md
```

`git status --short` 沒有輸出。

- [ ] **Step 6: 改寫 `README.md`**

把 `README.md` 整個改成下列內容（已符合 Prettier 格式）：

````markdown
# tceditor

tceditor 是慈濟自行維護的 React 視覺化頁面編輯器，衍生自開源專案 [Puck](https://github.com/puckeditor/puck) 的 v0.23.0。只使用 Puck 的前端能力，不依賴 Puck 官方的 npm 套件、雲端服務與 Puck AI；後端將以自架的 Supabase 支撐。

## 來源與授權

- 來源：Puck v0.23.0（git tag `v0.23.0`，commit `b4204f09`），MIT 授權，著作權屬於 The Puck Contributors。授權全文在 `LICENSE`，衍生關係記錄在 `NOTICE`；兩個套件打包時都會附上這兩個檔案。
- tceditor 的修改同樣以 MIT 授權釋出。
- `infra/supabase/docker/` 是官方 Supabase self-hosting 設定的原樣副本，以 Apache License 2.0 授權（見 `infra/supabase/LICENSE`），不在 MIT 授權範圍內。
- 這是 hard fork：不再同步上游。上游的 bug 修正以 `git cherry-pick -x` 個別移植，並記錄在 `CHANGELOG.md`。分支 `tzuchi/main` 是主線；`main` 保留上游原樣，只供比對；remote `upstream` 只用於參考，無法推送。

## 套件

| 目錄                               | 套件名稱                                   | 版本    |
| ---------------------------------- | ------------------------------------------ | ------- |
| `packages/core`                    | `@tzuchi/tceditor`                         | `0.1.0` |
| `packages/plugin-heading-analyzer` | `@tzuchi/tceditor-plugin-heading-analyzer` | `0.1.0` |

兩個套件都標為 `private`，目前沒有發佈到任何 registry，請以 workspace 依賴使用（`pnpm add @tzuchi/tceditor --workspace`）。不要用 `npm i` 安裝同名套件：registry 上的同名套件不是本專案。

對外 API 的名稱維持 Puck 原名，例如 `<Puck>`、`<Render>`、`usePuck`、`Config` 型別、CSS class 名稱與 `data-puck-*` 屬性，所以 Puck v0.23 的文件（`apps/docs`）大部分仍然適用，差異見下一節與 `CHANGELOG.md`。

## 與上游 Puck v0.23.0 的主要差異

- **richtext 改存 JSON（不相容變更）**：richtext 欄位的值改為 Tiptap JSON（`RichTextDoc`），不再是 HTML 字串。編輯器、編輯器載入前的暫時畫面、預覽與公開頁都使用同一個靜態渲染器（`@tiptap/static-renderer`），輸出必然一致，也不再使用 `dangerouslySetInnerHTML`。渲染時一律正規化：只輸出預設 schema 內的節點與標記，逐一驗證屬性（連結只允許 `http`、`https`、`mailto`、`tel` 與相對路徑），超過 100 層的巢狀只輸出文字，舊的 HTML 字串一律當純文字顯示。
  - 渲染器的評估結論（S1 spike）：`@tiptap/static-renderer` 與 Tiptap 的輸出等價，各種典型內容渲染出的 DOM 都與 Tiptap 的 `generateHTML` 相同（`packages/core/lib/richtext/__tests__/render.spec.tsx`）；渲染時不需要 DOM；公開頁的初始 JS chunk 只增加約 2 KB gzip（上限 10 KB）。因此直接採用，不自建渲染器。
- **舊資料轉換**：伺服器端以 `@tzuchi/tceditor/richtext-migrate`（`richTextHtmlToJson`、`migrateRichTextInData`）把舊的 HTML richtext 轉成 JSON。主入口與 RSC 入口不會帶到 `@tiptap/html` 與 `happy-dom`，伺服器端渲染不再需要 happy-dom。
- **函式庫資安修補**：`mapFields`、`walkTree`、`getChanged` 的 O(n²) 合併改為一次建好；元件 type 或 id 為 `constructor`、`__proto__` 等原型成員名稱時不再崩潰或汙染資料；`<Puck>` 新增選用的 `nonce` prop，編輯器在執行期注入的 `<style>` 都會帶上它，可在 nonce-based CSP 下運作。
- **樣式**：預設樣式不再從外部網站載入 Inter 字型，字型由宿主應用提供；只剩一個樣式表 export `@tzuchi/tceditor/tceditor.css`（取代上游的 `puck.css` 與 `no-external.css`）。
- **依賴**：tiptap 全部升級並釘在 3.31.4（修補 3 筆 advisory）；移除沒有使用的依賴，補上實際使用的 `classnames`。
- **移植的上游修正**：切換視窗後卡住的修飾鍵不再誤觸快捷鍵、瀏覽器翻譯不再讓編輯器當機、inline 文字欄位 hover 時不再位移。
- **工具鏈**：yarn 1 改為 pnpm；新增 `pnpm verify`、供應鏈檢查 `pnpm audit:gate`，以及打包檢查 `pnpm check:bundle`。
- **移除**：上游的範例 app（recipes）與產生它們的 scaffolder、`field-contentful`、`plugin-emotion-cache`、GitHub workflows 與 npm 發佈流程、demo 的第三方分析。`apps/docs` 只保留作參考，不在 workspace 中，也不再建置。
- **demo**：開發伺服器只綁 `127.0.0.1`。

完整清單見 `CHANGELOG.md` 最上方的 `tceditor 0.1.0` 段落。

## 使用方式

在本 monorepo 的應用中加入依賴：

```sh
pnpm add @tzuchi/tceditor --workspace
```

編輯器（client component）：

```tsx
import { Puck, type Config, type Data } from "@tzuchi/tceditor";

const config: Config = {
  components: {
    Article: {
      fields: {
        title: { type: "text" },
        body: { type: "richtext" },
      },
      render: ({ title, body }) => (
        <article>
          <h1>{title}</h1>
          {body}
        </article>
      ),
    },
  },
};

export function Editor({ data, nonce }: { data: Data; nonce?: string }) {
  return (
    <Puck
      config={config}
      data={data}
      nonce={nonce} // 選用：頁面使用 nonce-based CSP 時傳入
      onPublish={async (data) => {
        // richtext 欄位的值是 Tiptap JSON，可直接存成 jsonb
      }}
    />
  );
}
```

公開頁：

```tsx
import { Render, type Data } from "@tzuchi/tceditor";

export function Page({ data }: { data: Data }) {
  return <Render config={config} data={data} />;
}
```

- React Server Components 會依 `react-server` 條件自動取得 RSC 版的 `Render`，也可以明確寫 `@tzuchi/tceditor/rsc`。
- 編輯器預設在執行期注入樣式。若要避免 FOUC，在樣式表中加入 `@import "@tzuchi/tceditor/tceditor.css";`。
- 單獨顯示一段 richtext 時使用 `RichTextContent`（`<RichTextContent content={value} />`），不要自行把 JSON 轉成 HTML。
- 轉換舊資料（只能在伺服器端執行）：

  ```ts
  import { migrateRichTextInData } from "@tzuchi/tceditor/richtext-migrate";

  const converted = migrateRichTextInData(data, config);
  ```

## 開發環境

需求：

- Node.js 24 以上（`.nvmrc`）。
- pnpm 10.26.1（版本記在 `package.json` 的 `packageManager`）。
- 啟動 Supabase 時需要 Docker Desktop，Compose v2.24.4 以上。

安裝與驗證：

```sh
pnpm install --frozen-lockfile
pnpm verify
```

`pnpm verify` 依序執行 test、typecheck、lint、format:check、build、check:bundle、audit:gate，全部通過才算完成。目前沒有 CI，提交前請在本機執行一次。`audit:gate` 需要連網。

| 指令                | 作用                                                                                       |
| ------------------- | ------------------------------------------------------------------------------------------ |
| `pnpm test`         | core 的 jest 測試，以及 audit gate、check:bundle 的 `node:test` 測試                       |
| `pnpm typecheck`    | 以 `packages/core/tsconfig.typecheck.json` 檢查 core 的型別（不含測試檔）                  |
| `pnpm lint`         | ESLint                                                                                     |
| `pnpm format:check` | Prettier 檢查；`pnpm format` 會直接修正                                                    |
| `pnpm build`        | 建置 core、外掛與 demo                                                                     |
| `pnpm check:bundle` | 確認主入口與 RSC 入口不會引用 `@tiptap/html`、`happy-dom`（需先 build）                    |
| `pnpm audit:gate`   | 執行 `pnpm audit`，只有隨套件出貨的依賴有 advisory 時才失敗，其餘（demo 與開發工具）只列出 |
| `pnpm smoke`        | puppeteer 拖放 smoke test，需先以 `pnpm dev` 在 3000 port 啟動 demo                        |

只跑一個測試檔或一個測試：

```sh
pnpm --filter @tzuchi/tceditor test lib/richtext/__tests__/normalize.spec.ts
pnpm --filter @tzuchi/tceditor test -t "name of test"
```

## 啟動 demo

```sh
pnpm dev
```

開啟 http://localhost:3000 看頁面，http://localhost:3000/edit 進入編輯器；任何路徑後面加 `/edit` 都可以編輯該路徑的頁面。demo 把資料存在瀏覽器的 localStorage，沒有登入驗證，伺服器只綁 `127.0.0.1`，只供本機開發。其他頁面與說明見 `apps/demo/README.md`。

## 啟動 Supabase（本機開發）

`infra/supabase/` 是 tceditor 專用的自架 Supabase，compose 專案名為 `tceditor`，所有 container 以 `tceditor-` 開頭，與本機其他 Supabase stack（例如 tciam）互不干擾。

```sh
infra/supabase/setup-env.sh   # 第一次使用：產生 infra/supabase/docker/.env（祕密，不進版控）
infra/supabase/up.sh          # 啟動，等到所有服務都是 healthy
infra/supabase/down.sh        # 停止；資料保留
infra/supabase/reset.sh       # 清除 tceditor 的資料（需確認，或加 --yes）
```

| 服務                                   | 位址                    |
| -------------------------------------- | ----------------------- |
| API gateway 與 Studio                  | `http://127.0.0.1:8200` |
| Postgres（Supavisor session 模式）     | `127.0.0.1:5434`        |
| Postgres（Supavisor transaction 模式） | `127.0.0.1:6545`        |

Studio 帳密、API key 與資料庫密碼都在 `infra/supabase/docker/.env`。詳細說明與注意事項見 `infra/supabase/README.md`。

## 目錄結構

| 路徑                     | 內容                                              |
| ------------------------ | ------------------------------------------------- |
| `packages/core`          | 編輯器函式庫 `@tzuchi/tceditor`                   |
| `packages/plugin-*`      | 官方外掛                                          |
| `packages/tsconfig` 等   | 共用的 TypeScript、tsup、ESLint 設定              |
| `apps/demo`              | Next.js 開發用 playground，也是 smoke test 的目標 |
| `apps/docs`              | Puck 上游文件，只供參考，不在 workspace 中        |
| `infra/supabase`         | 本機開發用的自架 Supabase                         |
| `scripts`                | audit gate 與 e2e smoke test                      |
| `docs/superpowers/specs` | 路線圖與各子專案的設計規格                        |

## 文件

- `CLAUDE.md`：架構重點、開發指令與資安規則。給 Claude Code 使用，也是人工開發者的參考。
- `CONTRIBUTING.md`：開發流程與規範。
- `CHANGELOG.md`：tceditor 的變更紀錄，以及保留的 Puck 上游歷史。
- `docs/superpowers/specs/`：路線圖（`2026-10-08-tzuchi-puck-roadmap.md`）與 S1 設計規格（`2026-10-08-s1-fork-baseline-design.md`）。
````

- [ ] **Step 7: 改寫 `apps/demo/README.md`**

把 `apps/demo/README.md` 整個改成下列內容（已符合 Prettier 格式）：

````markdown
# demo

tceditor 的開發用 playground（Next.js App Router），也是 `pnpm smoke` 的測試目標。它透過 `tsconfig.json` 的 `paths` 直接編譯 `packages/core` 的原始碼，修改 core 後不需要重新建置。

## 啟動

在 repo 根目錄執行：

```sh
pnpm dev
```

伺服器只綁 `127.0.0.1`，請用 http://localhost:3000 開啟。

## 頁面

| 路徑                     | 內容                                                                                     |
| ------------------------ | ---------------------------------------------------------------------------------------- |
| `/`、`/<path>`           | 以 `<Render>` 顯示頁面                                                                   |
| `/edit`、`/<path>/edit`  | 以 `<Puck>` 編輯該路徑的頁面，**即使頁面還不存在**也可以建立                             |
| `/custom-ui/<path>/edit` | 以 `overrides` 與 `<Puck.Preview>` 等組合元件自訂編輯器介面的範例                        |
| `/rsc`                   | 以 React Server Components 的 `Render` 在伺服器端渲染首頁的初始資料                      |
| `/runtime-css-debug`     | 從建置後的 `packages/core/dist` 載入 `<Puck>`，檢查執行期注入的 CSS（需先 `pnpm build`） |

## 資料

- 按下 Publish 後，資料存在瀏覽器的 localStorage（key 為 `puck-demo:<元件組合>:<path>`），沒有後端。
- 初始資料在 `config/initial-data.ts`，元件設定在 `config/`。richtext 欄位的值是 Tiptap JSON。
- 若 localStorage 留有舊版 demo 存下的 HTML 字串，richtext 會以純文字顯示這些標籤。這是預期行為；在瀏覽器開發者工具中刪除 `puck-demo:` 開頭的 key 即可回到初始資料。

## 注意

demo 沒有任何登入驗證，`next` 也有尚未修補的 advisory，只能在本機開發使用，不要部署或對外開放。
````

- [ ] **Step 8: 確認 README 的範例程式能通過型別檢查**

把 README 的三段 TypeScript 範例合成一個暫存檔，放進 demo，用 demo 的 tsconfig 檢查型別：
- 兩段 import 合併，因為兩段都 import `Data`，分開寫會重複宣告。
- 轉換的範例包成函式。

`@tzuchi/tceditor/richtext-migrate` 的型別來自 `packages/core/dist`，所以先確認 `dist` 存在。`--incremental false` 讓 tsc 不留下 `tsconfig.tsbuildinfo`。最後故意加一行錯誤，確認 tsc 真的有檢查這個檔案，再刪除暫存檔：

```sh
cd /Users/kaellim/Desktop/projects/puck
test -f packages/core/dist/richtext-migrate.d.ts || pnpm --filter @tzuchi/tceditor build
cat > apps/demo/readme-examples.tsx <<'EOF'
// Temporary: type-checks the TypeScript examples in the root README.md.
import { Puck, Render, type Config, type Data } from "@tzuchi/tceditor";
import { migrateRichTextInData } from "@tzuchi/tceditor/richtext-migrate";

const config: Config = {
  components: {
    Article: {
      fields: {
        title: { type: "text" },
        body: { type: "richtext" },
      },
      render: ({ title, body }) => (
        <article>
          <h1>{title}</h1>
          {body}
        </article>
      ),
    },
  },
};

export function Editor({ data, nonce }: { data: Data; nonce?: string }) {
  return (
    <Puck
      config={config}
      data={data}
      nonce={nonce} // 選用：頁面使用 nonce-based CSP 時傳入
      onPublish={async (data) => {
        // richtext 欄位的值是 Tiptap JSON，可直接存成 jsonb
      }}
    />
  );
}

export function Page({ data }: { data: Data }) {
  return <Render config={config} data={data} />;
}

export function migrate(data: Data) {
  const converted = migrateRichTextInData(data, config);

  return converted;
}
EOF
(cd apps/demo && pnpm exec tsc --noEmit --incremental false -p tsconfig.json; echo "tsc exit=$?")
echo 'export const bad: number = "a";' >> apps/demo/readme-examples.tsx
(cd apps/demo && pnpm exec tsc --noEmit --incremental false -p tsconfig.json; echo "tsc exit=$?")
rm apps/demo/readme-examples.tsx
git status --short
```

預期輸出（`dist` 已存在時，第一行不會印出任何東西）：

```
tsc exit=0
readme-examples.tsx(44,14): error TS2322: Type 'string' is not assignable to type 'number'.
tsc exit=2
 M README.md
 M apps/demo/README.md
```

第一次 `tsc exit=0` 表示 README 的範例型別正確；第二次在第 44 行報錯，證明這個檔案確實有被檢查。最後的 `git status` 只剩兩份 README，沒有暫存檔，也沒有 `tsconfig.tsbuildinfo`。

- [ ] **Step 9: 檢查兩份 README 並 commit**

```sh
cd /Users/kaellim/Desktop/projects/puck
git hash-object README.md apps/demo/README.md
pnpm exec prettier --check README.md apps/demo/README.md
node "${TMPDIR:-/tmp}/tceditor-check-doc-paths.mjs" README.md apps/demo/README.md; echo "exit=$?"
```

預期輸出：

```
0839631d69810be1b905d942c4fb82ecd9bbdd96
5b782d62aae69613e36b6835fbcca0d22bc2878c
Checking formatting...
All matched files use Prettier code style!
0 missing path(s)
exit=0
```

```sh
cd /Users/kaellim/Desktop/projects/puck
git add README.md apps/demo/README.md
git commit -m "docs: rewrite the README and the demo README for tceditor" -m "The README now describes tceditor in Traditional Chinese: its origin and licenses, how it differs from Puck v0.23.0, how to use the packages, how to install and verify the repo, and how to start the demo and the Supabase dev stack. The demo README replaces the upstream recipe instructions (create-puck-app, yarn) with the demo's routes, data storage and limits."
```

預期（hash 會不同）：

```
[tzuchi/main <hash>] docs: rewrite the README and the demo README for tceditor
 2 files changed, 157 insertions(+), 91 deletions(-)
```

README 的 richtext 項目下記錄了 F1 spike 的結論（規格 §9 第 2 項、§10「F1 的 spike 已有結論」），讓這項驗收可以從 repo 本身確認，Step 19 會再檢查一次。

- [ ] **Step 10: 改寫 `CONTRIBUTING.md`、刪除 `CODE_OF_CONDUCT.md`、更新 CHANGELOG**

把 `CONTRIBUTING.md` 整個改成下列內容（已符合 Prettier 格式）：

````markdown
# 參與 tceditor 開發

tceditor 是慈濟內部維護的專案，衍生自 Puck v0.23.0。遠端 repo、issue 追蹤與 CI 平台尚未決定（見 `docs/superpowers/specs/2026-10-08-tzuchi-puck-roadmap.md`），在那之前，需求與問題直接與專案負責人討論，規格寫在 `docs/superpowers/specs/`。

架構說明、完整指令與資安規則在 `CLAUDE.md`，動手前請先讀過。

## 開發環境

- Node.js 24 以上、pnpm 10.26.1。
- TypeScript、CSS Modules、Turborepo；套件以 tsup 建置，demo 是 Next.js。

```sh
pnpm install --frozen-lockfile
pnpm dev
```

`pnpm dev` 只啟動 `apps/demo`（http://localhost:3000，編輯器在 `/edit`）。demo 直接編譯 `packages/core` 的原始碼，開發時不需要先建置 core。

## 流程

1. 從 `tzuchi/main` 開分支。`main` 是上游 Puck 的原樣鏡像，不要在上面 commit。
2. 修改程式時先寫測試。core 的測試放在程式旁邊的 `__tests__/`，檔名為 `*.spec.ts(x)`。
3. 對使用者可見的變更，在 `CHANGELOG.md` 的 `### Changes from Puck v0.23.0` 清單最後加一行。
4. 執行 `pnpm verify`，全部通過才提交。目前沒有 CI，這是唯一的關卡。
5. 一個分支只處理一件事。

## 規範

### TypeScript

- 避免使用 `any`。
- 新程式查元件設定一律用 `lookupComponentConfig(config, type)`；以使用者資料為 key 的物件用 `Object.create(null)` 建立，合併時用 `Object.fromEntries`。原因見 `CLAUDE.md` 的 Security rules。

### CSS

- class 名稱遵循 [SUIT CSS](https://suitcss.github.io)，透過 `getClassNameFactory` 套用。
- 不依賴全域樣式：tceditor 會嵌入宿主頁面，我們無法控制頁面上的其他 CSS。
- 不從外部網站載入字型、圖片或樣式。

### UI 文字

編輯器中所有使用者看得到的文字都是 `lib/dictionary.ts` 的 key，以 `useMessage` 讀取，讓 `dictionary` prop 可以覆寫。不要寫死文字。

### 資安

`CLAUDE.md` 的 Security rules 是必守規則，重點如下：

- 不新增 `dangerouslySetInnerHTML`。
- richtext 只以 Tiptap JSON 儲存，只透過共用渲染器（`renderRichText`、`RichTextContent`）輸出。
- 新增 Tiptap extension 時，同一個變更中要加上渲染 mapping 與屬性驗證。
- 執行期注入的 `<style>` 都要帶 CSP nonce。

### Commit

- 使用 [Angular 風格的 conventional commits](https://github.com/angular/angular.js/blob/master/DEVELOPERS.md#-git-commit-guidelines)，訊息用英文，例如 `fix(richtext): …`、`feat: …`、`docs: …`。
- `git add` 時明確列出路徑，不要把不相關的檔案一起提交。

### 公開 API

`packages/core/bundle/core.ts` 匯出的一切都是公開 API。新增或修改公開 API 要特別審慎，並在 `CHANGELOG.md` 註明；不相容的變更標成 `**breaking:**`。

### 依賴

- 新增或升級依賴後，一併提交 `pnpm-lock.yaml`，並以 `pnpm install --frozen-lockfile` 確認一致。
- `@tiptap/*` 全部釘在同一個精確版本，要升級就一起升。
- `pnpm-workspace.yaml` 的 `onlyBuiltDependencies` 與 `overrides` 保持最少，每一項都要註解原因；override 要註明 GHSA 編號。

## 移植上游的修正

tceditor 不再同步上游。上游的 bug 修正若值得移植：

```sh
git fetch upstream
git cherry-pick -x <commit>
```

`-x` 會在 commit 訊息記錄來源。衝突太大時改為手動重做，並在 commit 訊息註明來源 commit。完成後在 `CHANGELOG.md` 記錄。remote `upstream` 只用於讀取，無法推送。

## 發佈

S1 階段不發佈到任何 registry，兩個套件都標為 `private`。發佈方式（workspace link 或私有 registry）在 S2 決定。
````

刪除上游的行為準則，並在 CHANGELOG 清單最後（空行與 `## [0.23.0]` 之前）加一行：

```sh
cd /Users/kaellim/Desktop/projects/puck
git rm -q CODE_OF_CONDUCT.md
grep -c '^## \[0\.23\.0\]' CHANGELOG.md
perl -0pi -e 's/\n\n## \[0\.23\.0\]/\n* replace the upstream README, contributing guide and demo README with tceditor documentation, add `CLAUDE.md` with the architecture notes and security rules, and remove the upstream code of conduct, whose only enforcement channel was the Puck Discord server\n\n## [0.23.0]/' CHANGELOG.md
git diff --numstat CHANGELOG.md
git diff -U0 CHANGELOG.md | grep -E '^[-+][^-+]' | cut -c1-45
grep -n -A2 '^\* replace the upstream README' CHANGELOG.md | cut -c1-60
```

預期（行號會依 Task 5–12 加的行數而不同；撰寫計畫時是 26）：

```
1
1	0	CHANGELOG.md
+* replace the upstream README, contributing 
<n>:* replace the upstream README, contributing guide and dem
<n+1>-
<n+2>-## [0.23.0](/compare/v0.22.4...v0.23.0) (2026-08-07)
```

只新增一行，沒有刪除任何一行。新行緊接在 Task 12 那一行（以 ``* add an optional `nonce` prop to `<Puck>`;`` 開頭）之後。

- [ ] **Step 11: 綠燈：所有文件的檢查，然後 commit**

```sh
cd /Users/kaellim/Desktop/projects/puck
git hash-object CONTRIBUTING.md
pnpm exec prettier --check CLAUDE.md README.md CONTRIBUTING.md apps/demo/README.md
node "${TMPDIR:-/tmp}/tceditor-check-doc-paths.mjs" CLAUDE.md README.md CONTRIBUTING.md apps/demo/README.md; echo "exit=$?"
git grep --untracked -n -i -E "yarn (dev|build|install)|^yarn$|npx |npm i |discord|@puckeditor|puckeditor\.com|lib/props|allowBuilds|pnpm >= 11|\.github/|canary" -- CLAUDE.md README.md CONTRIBUTING.md CODE_OF_CONDUCT.md apps/demo/README.md packages/plugin-heading-analyzer/README.md; echo "exit=$?"
git grep -n "@puckeditor" -- . ':!apps/docs' ':!docs/superpowers' ':!CHANGELOG.md'; echo "exit=$?"
test -e CODE_OF_CONDUCT.md || echo "CODE_OF_CONDUCT.md removed"
```

預期輸出：

```
77a25b97b0c823eeac32b73623bae04118dc48bc
Checking formatting...
All matched files use Prettier code style!
0 missing path(s)
exit=0
exit=1
exit=1
CODE_OF_CONDUCT.md removed
```

與 Step 3 對照：沒有失效路徑，也沒有上游專屬的操作指示。`CLAUDE.md` 已納入版控，`@puckeditor` 仍然一處都沒有。

```sh
cd /Users/kaellim/Desktop/projects/puck
git add CONTRIBUTING.md CHANGELOG.md
git status --short
git commit -m "docs: rewrite the contributing guide and remove the upstream code of conduct" -m "CONTRIBUTING.md now describes the internal workflow in Traditional Chinese: pnpm verify as the only gate until CI exists, changelog entries, the security rules, porting upstream fixes with cherry-pick -x and the current release status. The upstream issue labels, Discord channels, canary releases and yarn setup no longer apply. CODE_OF_CONDUCT.md is removed: it was Puck's community code of conduct and its only enforcement channel was the Puck Discord server."
```

`git status --short` 預期（commit 前）：

```
M  CHANGELOG.md
D  CODE_OF_CONDUCT.md
M  CONTRIBUTING.md
```

`git commit` 預期（hash 會不同）：

```
[tzuchi/main <hash>] docs: rewrite the contributing guide and remove the upstream code of conduct
 3 files changed, 50 insertions(+), 217 deletions(-)
 delete mode 100644 CODE_OF_CONDUCT.md
```

- [ ] **Step 12: 最終驗證（一）：主工作目錄從乾淨的建置狀態跑 `pnpm verify`**

```sh
cd /Users/kaellim/Desktop/projects/puck
rm -rf .turbo packages/core/dist packages/plugin-heading-analyzer/dist apps/demo/.next
pnpm install --frozen-lockfile > "${TMPDIR:-/tmp}/tceditor-install-task14.log" 2>&1; echo "install exit=$?"
grep -E "^Scope:|^Lockfile is up to date|^Already up to date|^Done in" "${TMPDIR:-/tmp}/tceditor-install-task14.log" | sed -E 's/ in [0-9.]+s/ in …s/'
pnpm verify > "${TMPDIR:-/tmp}/tceditor-verify-task14.log" 2>&1; echo "exit=$?"
grep -E "Test Suites:|Tests:|Snapshots:|ℹ (tests|pass|fail)|> tsc|✖|Tasks:|All matched|^check:bundle|^pnpm audit:|^GATED|^audit:gate (passed|FAILED)" "${TMPDIR:-/tmp}/tceditor-verify-task14.log"
git status --short
```

預期輸出（約 2 分鐘；`audit:gate` 需要連網）：

```
install exit=0
Scope: all 7 workspace projects
Lockfile is up to date, resolution step is skipped
Already up to date
Done in …s using pnpm v10.26.1
exit=0
@tzuchi/tceditor:test: Test Suites: 80 passed, 80 total
@tzuchi/tceditor:test: Tests:       691 passed, 691 total
@tzuchi/tceditor:test: Snapshots:   19 passed, 19 total
 Tasks:    1 successful, 1 total
ℹ tests 13
ℹ pass 13
ℹ fail 0
> tsc -p tsconfig.typecheck.json
demo:lint: ✖ 8 problems (0 errors, 8 warnings)
@tzuchi/tceditor:lint: ✖ 4 problems (0 errors, 4 warnings)
 Tasks:    3 successful, 3 total
All matched files use Prettier code style!
 Tasks:    3 successful, 3 total
check:bundle passed: 23 files reachable from index.mjs, rsc.mjs, index.js, rsc.js do not mention happy-dom or @tiptap/html.
pnpm audit: 69 advisories, 71 finding path(s). 105 package versions ship with packages/core, packages/plugin-heading-analyzer.
GATED (ships with a published package): 0 finding(s)
audit:gate passed: no advisories affect packages/core, packages/plugin-heading-analyzer (71 finding path(s) elsewhere are listed above).
```

判斷標準：
- `install exit=0` 與 `Lockfile is up to date`：lockfile 與各 `package.json` 一致。安裝時 `prepare` 會重新建置 core 與外掛。
- `exit=0`。
- jest 80 個 suite、691 個測試、19 個 snapshot，全部 passed。
- `node:test` 13 個全部 pass。
- lint 為 `0 errors`，警告數與 Task 12 結束時相同（demo 8、core 4）。`demo:lint` 與 `@tzuchi/tceditor:lint` 兩行的順序可能互換。
- `All matched files use Prettier code style!` 涵蓋本 task 的 4 份文件。
- `check:bundle passed`。
- `GATED … 0 finding(s)` 與 `audit:gate passed`。advisory 與 finding path 的數字會隨資料庫更新而改變，`105 package versions` 必須相同。
- 最後的 `git status --short` 沒有輸出：工作目錄乾淨，`CLAUDE.md` 已受版控。

若失敗，到 log 檔找出是哪一步，修正後重跑。修正若需要改程式，另外 commit，不要併入文件的 commit。

- [ ] **Step 13: 最終驗證（二）：在乾淨的 clone 重跑，並檢查 `pnpm pack` 的內容**

主工作目錄可能有 gitignored 的殘留物（`node_modules`、`dist`、`.turbo`），它們可能讓沒有 commit 的東西看起來能用。從 `tzuchi/main` clone 一份到暫存目錄，在裡面從零安裝並跑 `pnpm verify`。接著在同一個 clone 打包兩個套件，檢查 tarball 的內容（`pnpm pack` 會先執行 `prepare`，也就是 `pnpm build`），最後刪除 clone。整段放在同一個區塊中執行：

```sh
cd /Users/kaellim/Desktop/projects/puck
bash -s <<'EOF'
unset TURBO_CACHE_DIR
CLONE=$(mktemp -d "${TMPDIR:-/tmp}/tceditor-clone.XXXXXX")
git clone --quiet --branch tzuchi/main /Users/kaellim/Desktop/projects/puck "$CLONE/repo"
cd "$CLONE/repo" || exit 1
git log --oneline -1
pnpm install --frozen-lockfile > "$CLONE/install.log" 2>&1; echo "install exit=$?"
grep -E "^Scope:|^Lockfile is up to date|^Packages:|^Done in" "$CLONE/install.log" | sed -E 's/ in [0-9.]+s/ in …s/'
pnpm verify > "$CLONE/verify.log" 2>&1; echo "verify exit=$?"
grep -E "Test Suites:|Tests:|Snapshots:|ℹ (pass|fail)|^check:bundle|^GATED|^audit:gate (passed|FAILED)" "$CLONE/verify.log"
grep -E "Cached:" "$CLONE/verify.log"
PACK_DIR="$CLONE/pack"
mkdir "$PACK_DIR"
pnpm --filter @tzuchi/tceditor --filter @tzuchi/tceditor-plugin-heading-analyzer pack --pack-destination "$PACK_DIR" > /dev/null 2>&1
for t in "$PACK_DIR"/*.tgz; do
  echo "== $(basename "$t")"
  tar -tzf "$t" | grep -v "^package/dist/" | LC_ALL=C sort
  for f in LICENSE NOTICE; do
    tar -xzOf "$t" "package/$f" | cmp -s - "$f" && echo "$f matches the root $f"
  done
  tar -tzf "$t" | grep -E "^package/dist/(index|rsc|internal|richtext-migrate)\.(mjs|js|d\.ts|css)$" | LC_ALL=C sort
  tar -tzf "$t" | grep -c -E "no-external|__tests__|\.spec\." | sed 's/^/unexpected files: /'
  tar -xzOf "$t" package/package.json | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const p=JSON.parse(s);console.log(p.name+"@"+p.version+" private="+p.private+" exports="+Object.keys(p.exports||{}).join(","))})'
done
cd /
rm -rf "$CLONE"
test -e "$CLONE" || echo "clone removed"
EOF
```

預期輸出（hash 會不同；約 2–3 分鐘，`audit:gate` 需要連網）：

```
<hash> docs: rewrite the contributing guide and remove the upstream code of conduct
install exit=0
Scope: all 7 workspace projects
Lockfile is up to date, resolution step is skipped
Packages: +869
Done in …s using pnpm v10.26.1
verify exit=0
@tzuchi/tceditor:test: Test Suites: 80 passed, 80 total
@tzuchi/tceditor:test: Tests:       691 passed, 691 total
@tzuchi/tceditor:test: Snapshots:   19 passed, 19 total
ℹ pass 13
ℹ fail 0
check:bundle passed: 23 files reachable from index.mjs, rsc.mjs, index.js, rsc.js do not mention happy-dom or @tiptap/html.
GATED (ships with a published package): 0 finding(s)
audit:gate passed: no advisories affect packages/core, packages/plugin-heading-analyzer (71 finding path(s) elsewhere are listed above).
Cached:    0 cached, 1 total
Cached:    0 cached, 3 total
Cached:    0 cached, 3 total
== tzuchi-tceditor-0.1.0.tgz
package/LICENSE
package/NOTICE
package/package.json
LICENSE matches the root LICENSE
NOTICE matches the root NOTICE
package/dist/index.css
package/dist/index.d.ts
package/dist/index.js
package/dist/index.mjs
package/dist/internal.d.ts
package/dist/internal.js
package/dist/internal.mjs
package/dist/richtext-migrate.d.ts
package/dist/richtext-migrate.js
package/dist/richtext-migrate.mjs
package/dist/rsc.css
package/dist/rsc.d.ts
package/dist/rsc.js
package/dist/rsc.mjs
unexpected files: 0
@tzuchi/tceditor@0.1.0 private=true exports=.,./rsc,./internal,./richtext-migrate,./tceditor.css,./package.json
== tzuchi-tceditor-plugin-heading-analyzer-0.1.0.tgz
package/LICENSE
package/NOTICE
package/README.md
package/package.json
LICENSE matches the root LICENSE
NOTICE matches the root NOTICE
package/dist/index.css
package/dist/index.d.ts
package/dist/index.js
package/dist/index.mjs
unexpected files: 0
@tzuchi/tceditor-plugin-heading-analyzer@0.1.0 private=true exports=.,./dist/index.css
clone removed
```

- clone 從零安裝後，`pnpm verify` 的結果與 Step 12 相同，表示 commit 的內容就足以通過驗證，不依賴主工作目錄的殘留物。
- 三行 `Cached:    0 cached` 分別對應 test、lint、build 三次 turbo 執行，表示每個 task 都真的重跑，沒有重播任何快取。區塊開頭的 `unset TURBO_CACHE_DIR` 就是為了這一點：`CLAUDE.md` 要求在 worktree 中 export 這個變數，若執行者的 shell 帶著它，clone 中的 turbo 會直接重播別處的快取，「從零驗證」就不成立。若這三行出現非 0 的 cached，表示 turbo 讀到了別處的快取，停下來回報。
- `cd "$CLONE/repo" || exit 1`：clone 失敗時立刻結束，不會改在主工作目錄執行 install、verify 與 pack。
- 兩個 tarball 都帶有與根目錄相同的 `LICENSE`、`NOTICE`（規格 §3.4）。
- core 有 `index`、`rsc`、`internal`、`richtext-migrate` 四個入口與 `index.css`。
- 兩個套件都沒有 `no-external` 或測試檔。
- 版本都是 `0.1.0`、`private=true`。
- core 的 tarball 沒有 `README.md`：Task 1 移除了 `prepare` 中複製根目錄 README 的步驟，而套件不發佈，所以本 task 不補。

- [ ] **Step 14: 最終驗證（三）：demo 的頁面與 RSC 輸出**

使用 Step 12 建置好的 `.next`，以 `next start` 在 `127.0.0.1:3917` 啟動 demo；任何沒被佔用的 port 都可以，啟動前先用 `lsof` 確認。結束時只用 `kill "$DEMO_PID"` 停止自己啟動的程序，不要用 `pkill`、`killall` 或以名稱比對的方式：

```sh
cd /Users/kaellim/Desktop/projects/puck
lsof -nP -iTCP:3917 -sTCP:LISTEN || echo "port 3917 is free"
(cd apps/demo && exec ./node_modules/.bin/next start -H 127.0.0.1 -p 3917) > "${TMPDIR:-/tmp}/tceditor-demo-start.log" 2>&1 &
DEMO_PID=$!
for i in $(seq 1 60); do curl -s -o /dev/null http://127.0.0.1:3917/ && break; sleep 1; done
for p in / /edit /custom-ui/edit /rsc /runtime-css-debug; do echo "$p $(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:3917$p")"; done
lsof -nP -iTCP:3917 -sTCP:LISTEN | awk 'NR > 1 { print "listen", $9 }' | sort -u
curl -s http://127.0.0.1:3917/rsc > "${TMPDIR:-/tmp}/tceditor-rsc.html"
grep -c '<div class="rich-text"><p>' "${TMPDIR:-/tmp}/tceditor-rsc.html"
grep -c "&lt;p&gt;" "${TMPDIR:-/tmp}/tceditor-rsc.html"
grep -c -i -E "rsms\.me|plausible" "${TMPDIR:-/tmp}/tceditor-rsc.html"
kill "$DEMO_PID"
sleep 1
lsof -nP -iTCP:3917 -sTCP:LISTEN || echo "demo stopped"
```

預期輸出：

```
port 3917 is free
/ 200
/edit 200
/custom-ui/edit 200
/rsc 200
/runtime-css-debug 200
listen 127.0.0.1:3917
1
0
0
demo stopped
```

- 5 個頁面都回應 200，伺服器只監聽 loopback。
- `/rsc` 由伺服器端的共用渲染器輸出 `<div class="rich-text"><p>…`（至少 1 行）。
- 沒有被 escape 的 `&lt;p&gt;`，也沒有第三方字型或分析服務。
- `grep -c` 計數為 0 時 exit code 是 1，屬正常。

- [ ] **Step 15: 最終驗證（四）：拖放並編輯 richtext，發佈後比對公開頁（規格 §9 第 11 項）**

建立 `${TMPDIR:-/tmp}/tceditor-editor-check.mjs`（完整內容）。它沿用 `scripts/e2e/utils` 的 puppeteer 工具（`pnpm smoke` 用的同一套）。執行時工作目錄必須是 repo 根目錄，腳本以絕對路徑載入這些工具：

```sh
cat > "${TMPDIR:-/tmp}/tceditor-editor-check.mjs" <<'EOF'
// End-to-end check for spec §9.11 against a running demo: drag a RichText
// block onto a new page, edit it in the fields panel, publish, then open the
// published page. The canvas is read inside the preview iframe
// (#preview-frame). Run from the repo root: node <this file> <demo base URL>
import { pathToFileURL } from "node:url";

const repo = (path) => pathToFileURL(`${process.cwd()}/${path}`).href;
const { setup } = await import(repo("scripts/e2e/utils/setup.mjs"));
const { dragAndDrop } = await import(
  repo("scripts/e2e/utils/drag-and-drop.mjs")
);
const { pause } = await import(repo("scripts/e2e/utils/pause.mjs"));

const base = process.argv[2];
const path = "/tceditor-final-check";
const { browser, page } = await setup(`${base}${path}/edit`);

const withMeta = async (key) => {
  await page.keyboard.down("Meta");
  await page.keyboard.press(key);
  await page.keyboard.up("Meta");
};

try {
  await page.setViewport({ width: 1600, height: 1000 });
  await page.waitForSelector("#preview-frame");
  const frame = await (await page.$("#preview-frame")).contentFrame();
  await frame.waitForSelector('[data-testid="dropzone:root:default-zone"]');
  await pause(500);
  await dragAndDrop(
    page,
    '[data-testid="drawer-item:RichText"]',
    '[data-testid="dropzone:root:default-zone"]'
  );

  const blocks = await frame.$$("[data-puck-component] .rich-text");
  console.log(`dropped RichText blocks: ${blocks.length}`);
  await blocks[0].click();
  await pause(1000);

  const editors = await page.$$(".ProseMirror");
  await editors[editors.length - 1].click();
  await withMeta("a");
  await page.keyboard.type("Hello ");
  await withMeta("b");
  await page.keyboard.type("bold");
  await withMeta("b");
  await page.keyboard.type(" see https://example.com and javascript:alert(1) ");
  await pause(1500);
  const canvas = await frame.$eval(
    "[data-puck-component] .rich-text",
    (el) => el.innerHTML
  );
  console.log(`canvas:    ${canvas}`);

  const publish = await page.evaluate(() => {
    const matches = [...document.querySelectorAll("header *")].filter(
      (el) => el.innerText?.trim() === "Publish"
    );
    const rect = matches[matches.length - 1].getBoundingClientRect();
    return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
  });
  await page.mouse.click(publish.x, publish.y);
  await pause(1500);
  const stored = await page.evaluate((path) => {
    const key = Object.keys(localStorage).find(
      (k) => k.startsWith("puck-demo:") && k.endsWith(`:${path}`)
    );
    return JSON.parse(localStorage.getItem(key));
  }, path);
  const value = stored.content.find((item) => item.type === "RichText").props
    .richtext;
  console.log(`stored:    ${typeof value} with type "${value.type}"`);

  await page.goto(`${base}${path}`);
  await page.waitForSelector(".rich-text");
  const published = await page.$eval(".rich-text", (el) => el.innerHTML);
  console.log(`published: ${published}`);
  console.log(
    canvas === published ? "canvas and published page match" : "MISMATCH"
  );
  if (canvas !== published) process.exitCode = 1;
} finally {
  await browser.close();
}
EOF
```

腳本以編輯器預設的 iframe 模式，在新的頁面 `/tceditor-final-check` 依序執行：
1. 從左側把 `RichText` 拖進預覽 iframe（`#preview-frame`）中的頁面，點選它。
2. 在右側欄位面板的 richtext 編輯器中全選，輸入 `Hello `，以 ⌘B 輸入粗體的 `bold`，再輸入一個 https 網址與一段 `javascript:` 文字。
3. 讀取 iframe 中畫布的輸出，按下 Publish，從 localStorage 讀出存下的值。
4. 開啟公開頁 `/tceditor-final-check`，比對公開頁與畫布的輸出。兩者不同時印出 `MISMATCH`，並以 exit 1 結束。

拖放、欄位面板與 Publish 都在主文件中操作；只有畫布上的元件在 iframe 中。快捷鍵使用 macOS 的 Meta（⌘）鍵。

```sh
cd /Users/kaellim/Desktop/projects/puck
lsof -nP -iTCP:3917 -sTCP:LISTEN || echo "port 3917 is free"
(cd apps/demo && exec ./node_modules/.bin/next start -H 127.0.0.1 -p 3917) > "${TMPDIR:-/tmp}/tceditor-demo-start.log" 2>&1 &
DEMO_PID=$!
for i in $(seq 1 60); do curl -s -o /dev/null http://127.0.0.1:3917/ && break; sleep 1; done
node "${TMPDIR:-/tmp}/tceditor-editor-check.mjs" http://127.0.0.1:3917; echo "check exit=$?"
kill "$DEMO_PID"
sleep 1
lsof -nP -iTCP:3917 -sTCP:LISTEN || echo "demo stopped"
```

預期輸出（約 15 秒）：

```
port 3917 is free
dropped RichText blocks: 1
canvas:    <p>Hello <strong>bold</strong> see <a href="https://example.com" target="_blank" rel="noopener noreferrer nofollow">https://example.com</a> and javascript:alert(1) </p>
stored:    object with type "doc"
published: <p>Hello <strong>bold</strong> see <a href="https://example.com" target="_blank" rel="noopener noreferrer nofollow">https://example.com</a> and javascript:alert(1) </p>
canvas and published page match
check exit=0
demo stopped
```

- 拖放成功，iframe 中的畫布上有 1 個 RichText。
- 編輯器以 ⌘B 產生粗體，輸入的 https 網址自動成為連結，`javascript:alert(1)` 沒有被自動連結成 `<a>`。這一點只說明 autolink 不把它當成網址，並不能證明 `isSafeHref` 擋下了它。`javascript:` 連結的阻擋由下列測試涵蓋（路徑在 `packages/core` 底下），都在 Step 19 執行：
  - 渲染器：`lib/richtext/__tests__/is-safe-href.spec.ts`、`xss.spec.tsx`。
  - 編輯器：`components/RichTextEditor/__tests__/editor.spec.tsx`，驗證 `setLink` 拒絕 `javascript:` 等 href。
- 存進 localStorage 的值是 Tiptap JSON 物件（`type` 為 `"doc"`），不是 HTML 字串。
- 公開頁的輸出與畫布逐字相同，也就是預覽與正式頁面一致。

puppeteer 每次啟動都使用新的暫存瀏覽器設定檔，localStorage 一開始是空的，所以可以重跑（撰寫時連續執行 3 次，輸出都與上面相同）。若出現 `TimeoutError`，或印出 `MISMATCH` 且 `check exit=1`，先看 `${TMPDIR:-/tmp}/tceditor-demo-start.log`，再改用下面的人工步驟確認。

人工步驟（有瀏覽器時可補做，或在腳本失敗時用來定位問題）：
1. `pnpm dev`，開啟 http://localhost:3000/tceditor-manual/edit。若這個瀏覽器曾開過上游 demo，先在開發者工具的 Application → Local Storage 刪除 `puck-demo:` 開頭的 key。
2. 拖入 Heading 與 RichText，確認可以拖放、排序與選取。
3. 點選 RichText，在右側欄位面板輸入文字、加粗體、輸入 https 網址後加空白（自動成為連結）。畫布應即時更新。
4. 按 Publish，開啟 http://localhost:3000/tceditor-manual，內容應與畫布相同。
5. 在終端機按 Ctrl-C 停止 `pnpm dev`。

- [ ] **Step 16: 驗收 §10 第 1 項：分支、remote、`main` 與 commit 格式**

```sh
cd /Users/kaellim/Desktop/projects/puck
git branch --show-current
git merge-base --is-ancestor v0.23.0 tzuchi/main && echo "tzuchi/main contains v0.23.0"
git rev-parse 'v0.23.0^{commit}'
git remote -v
git config branch.main.remote
git rev-parse main
git log --format=%s v0.23.0..tzuchi/main | grep -v -E '^(build|chore|ci|docs|feat|fix|perf|refactor|revert|style|test)(\([a-z0-9-]+\))?!?: ' || echo "all commit subjects are conventional"
```

預期輸出：

```
tzuchi/main
tzuchi/main contains v0.23.0
b4204f09fde3f4b286294567fce53fafa7136858
upstream	https://github.com/puckeditor/puck.git (fetch)
upstream	no_push (push)
upstream
49b529b49759f6874ebd7a23dd367d1412e31320
all commit subjects are conventional
```

- `tzuchi/main` 建立在 `v0.23.0`（`b4204f09`）之上。
- 只有 `upstream` 這個 remote，push URL 是 `no_push`（Task 1 Step 2）。
- `main` 仍指向撰寫計畫時的上游 commit `49b529b4`（`Refactor edit/render field tranforms (#1796)`），沒有被修改。若 hash 不同，查 `git reflog main` 了解原因並回報。
- `v0.23.0..tzuchi/main` 的每個 commit 標題都符合 Angular conventional commits；不符合的標題會被列出來。

- [ ] **Step 17: 驗收 §10 第 2 項：改名、移除項目、授權**

```sh
cd /Users/kaellim/Desktop/projects/puck
node -p "['packages/core', 'packages/plugin-heading-analyzer'].map((dir) => { const m = require('./' + dir + '/package.json'); return m.name + '@' + m.version + (m.private ? ' (private)' : ''); }).join('\n')"
for p in recipes packages/create-puck-app packages/field-contentful packages/plugin-emotion-cache .github lerna.json .npmrc .yarnrc yarn.lock scripts/publish.sh scripts/create-changelog.js scripts/get-unstable-version.js packages/core/bundle/no-external.ts packages/core/bundle/no-external.css CODE_OF_CONDUCT.md; do test -e "$p" && echo "still exists: $p"; done; echo "removal checked"
git grep -n "@puckeditor" -- . ':!apps/docs' ':!docs/superpowers' ':!CHANGELOG.md'; echo "exit=$?"
git grep -n -i -E "rsms\.me|plausible" -- . ':!apps/docs' ':!docs/superpowers' ':!CHANGELOG.md'; echo "exit=$?"
head -3 LICENSE
head -1 NOTICE
for d in packages/core packages/plugin-heading-analyzer; do cmp -s LICENSE $d/LICENSE && cmp -s NOTICE $d/NOTICE && echo "$d: LICENSE and NOTICE match the root"; done
git hash-object infra/supabase/LICENSE
```

預期輸出：

```
@tzuchi/tceditor@0.1.0 (private)
@tzuchi/tceditor-plugin-heading-analyzer@0.1.0 (private)
removal checked
exit=1
exit=1
MIT License

Copyright (c) The Puck Contributors.
tceditor
packages/core: LICENSE and NOTICE match the root
packages/plugin-heading-analyzer: LICENSE and NOTICE match the root
49ea124025275674563eeff03af0f653ca49fdc0
```

- 套件名與版本正確，兩個套件都是 `private`。
- 規格 §3.2 的項目、yarn 檔案、`no-external` 入口與上游行為準則都不存在。
- repo 中（排除 `apps/docs`、規格文件與上游 changelog）沒有 `@puckeditor`、`rsms.me` 或 Plausible。
- 根目錄 `LICENSE` 是原本的 MIT 授權，`NOTICE` 就位，兩個套件中的副本與根目錄相同。
- `infra/supabase/LICENSE` 與 Task 13 Step 31 的 hash 相同（官方的 Apache-2.0 全文）。

- [ ] **Step 18: 驗收 §10 第 3、4 項：pnpm 與上游修正**

```sh
cd /Users/kaellim/Desktop/projects/puck
node -p "require('./package.json').packageManager"
test ! -e yarn.lock && test ! -e .yarnrc && test -f pnpm-lock.yaml && test -f pnpm-workspace.yaml && echo "pnpm only"
git log --format=%B v0.23.0..tzuchi/main | grep "cherry picked from commit" | LC_ALL=C sort
```

預期輸出：

```
pnpm@10.26.1
pnpm only
(cherry picked from commit 6a396a5dfd8e7a0c26f1a00f49a8d69a4b493e63)
(cherry picked from commit 90665dfbe201398fe9fbe54cfac31e3d08391b90)
(cherry picked from commit 9e917a398afa982b18101566303134830b25e7ab)
```

`pnpm verify` 全綠已在 Step 12、13 確認。三個上游修正都以 `cherry-pick -x` 移植，來源 commit 記錄在訊息中（Task 4）。

- [ ] **Step 19: 驗收 §10 第 5 項：F1–F7 與規格 §9 的測試**

先確認打包結果與依賴宣告（需要 Step 12 的建置結果）：

```sh
cd /Users/kaellim/Desktop/projects/puck
git grep -n "dangerouslySetInnerHTML" -- packages apps/demo ':!**/__tests__/**'
grep -c "nonce?: string;" packages/core/dist/index.d.ts
grep -c "function lookupComponentConfig" packages/core/dist/index.js packages/core/dist/rsc.js
grep -r -l "rsms.me" packages/core/dist apps/demo/.next/static | wc -l
node -e 'const p = require("./packages/core/package.json"); const all = { ...p.dependencies, ...p.devDependencies }; for (const n of ["deep-diff", "@types/deep-diff", "react-hotkeys-hook", "@dnd-kit/helpers", "classnames", "@tiptap/static-renderer"]) console.log(n + ": " + (all[n] ?? "(none)")); console.log("css exports: " + Object.keys(p.exports).filter((k) => k.endsWith(".css")).join(","))'
grep -E "^  '@tiptap/(core|static-renderer)@[0-9.]+':" pnpm-lock.yaml
grep -c "S1 spike" README.md
```

預期輸出：

```
packages/core/components/DropZone/index.tsx:90:      <div dangerouslySetInnerHTML={{ __html: element.outerHTML }} />
1
packages/core/dist/index.js:1
packages/core/dist/rsc.js:1
       0
deep-diff: (none)
@types/deep-diff: (none)
react-hotkeys-hook: (none)
@dnd-kit/helpers: (none)
classnames: ^2.5.1
@tiptap/static-renderer: 3.31.4
css exports: ./tceditor.css
  '@tiptap/core@3.31.4':
  '@tiptap/static-renderer@3.31.4':
1
```

- **F1**：production 程式中唯一的 `dangerouslySetInnerHTML` 是上游 `DropZone` 的 `InsertPreview`，與 richtext 無關；richtext 路徑一處都沒有。`@tiptap/static-renderer` 與 lockfile 的 `@tiptap/core` 同為 3.31.4。spike 的結論是採用 static-renderer（Task 5），公開頁初始 chunk 增加約 2 KB gzip（Task 9 Step 7），`check:bundle` 確認主入口與 RSC 入口不會帶到 `@tiptap/html`、happy-dom。這個結論記錄在 README 的 richtext 項目下（Step 6），最後一行的 `1` 確認它在受版控的 README 中。
- **F4**：`lookupComponentConfig` 在主入口與 RSC 入口的打包結果中各出現一次。
- **F5**：公開型別中有 `nonce?: string;`（`PuckProps.nonce`）。
- **F6**：`dist` 與 demo 的建置結果都沒有 `rsms.me`（`wc -l` 的空白寬度可能不同），只有一個 CSS export。
- **F7**：沒用到的依賴已移除，`classnames` 已宣告。

再把對應規格 §9 各項的測試檔一起執行一次（它們也包含在 Step 12 的 691 個測試中）：

| 規格 §9 | 測試檔（`packages/core` 底下） |
|---|---|
| 3 XSS 回歸 | `lib/richtext/__tests__/xss.spec.tsx`、`lib/richtext/__tests__/is-safe-href.spec.ts`、`components/RichTextEditor/__tests__/editor.spec.tsx`（編輯器拒絕建立 `javascript:` 等連結）、`components/Render/__tests__/index.spec.tsx`、`components/RichTextEditor/__tests__/editor-fallback.spec.tsx`、`__tests__/richtext-no-inner-html.spec.ts` |
| 4 一致性 | `lib/richtext/__tests__/render.spec.tsx`、`components/RichTextEditor/__tests__/editor-fallback.spec.tsx` |
| 5 轉換工具 | `lib/richtext/__tests__/html-to-json.spec.tsx`、`html-to-json.server.spec.ts`、`migrate-data.spec.ts` |
| 6 F2 深度 | `lib/richtext/__tests__/render.spec.tsx`、`normalize.spec.ts` |
| 7 SSR 不需 happy-dom | `components/Render/__tests__/index.spec.tsx`（禁止載入 happy-dom 與 `@tiptap/html`） |
| 8 F3 | `lib/data/__tests__/map-fields-merge.spec.tsx`、`walk-tree-merge.spec.tsx`、`lib/__tests__/get-changed.spec.ts` |
| 9 F4 | `lib/__tests__/lookup-component-config.spec.ts`、`components/Render/__tests__/prototype-types.spec.tsx`、`components/Puck/__tests__/prototype-ids.spec.tsx`、`lib/__tests__/prototype-zone-ids.spec.tsx` |
| 10 F5 | `lib/__tests__/use-inject-css.spec.tsx`、`components/AutoFrame/__tests__/index.spec.tsx`、`components/DragDropContext/__tests__/index.spec.tsx`、`use-drop-animation.spec.tsx`、`lib/dnd/__tests__/drop-animation.spec.ts`、`components/RichTextEditor/lib/__tests__/use-synced-editor-nonce.spec.tsx` |
| F6、授權、移植的修正 | `__tests__/css-imports.spec.ts`、`__tests__/package-files.spec.ts`、`lib/__tests__/use-hotkey.spec.tsx` |

```sh
cd /Users/kaellim/Desktop/projects/puck/packages/core
pnpm exec jest lib/richtext/__tests__/xss.spec.tsx lib/richtext/__tests__/is-safe-href.spec.ts components/RichTextEditor/__tests__/editor.spec.tsx components/Render/__tests__/index.spec.tsx components/RichTextEditor/__tests__/editor-fallback.spec.tsx __tests__/richtext-no-inner-html.spec.ts lib/richtext/__tests__/render.spec.tsx lib/richtext/__tests__/normalize.spec.ts lib/richtext/__tests__/html-to-json.spec.tsx lib/richtext/__tests__/html-to-json.server.spec.ts lib/richtext/__tests__/migrate-data.spec.ts lib/data/__tests__/map-fields-merge.spec.tsx lib/data/__tests__/walk-tree-merge.spec.tsx lib/__tests__/get-changed.spec.ts lib/__tests__/lookup-component-config.spec.ts components/Render/__tests__/prototype-types.spec.tsx components/Puck/__tests__/prototype-ids.spec.tsx lib/__tests__/prototype-zone-ids.spec.tsx lib/__tests__/use-inject-css.spec.tsx components/AutoFrame/__tests__/index.spec.tsx components/DragDropContext/__tests__/index.spec.tsx components/DragDropContext/__tests__/use-drop-animation.spec.tsx components/RichTextEditor/lib/__tests__/use-synced-editor-nonce.spec.tsx lib/dnd/__tests__/drop-animation.spec.ts __tests__/css-imports.spec.ts __tests__/package-files.spec.ts lib/__tests__/use-hotkey.spec.tsx 2>&1 | grep -E "^(PASS|FAIL)|^Tests:|^Test Suites:" | LC_ALL=C sort
```

預期輸出：

```
PASS __tests__/css-imports.spec.ts
PASS __tests__/package-files.spec.ts
PASS __tests__/richtext-no-inner-html.spec.ts
PASS components/AutoFrame/__tests__/index.spec.tsx
PASS components/DragDropContext/__tests__/index.spec.tsx
PASS components/DragDropContext/__tests__/use-drop-animation.spec.tsx
PASS components/Puck/__tests__/prototype-ids.spec.tsx
PASS components/Render/__tests__/index.spec.tsx
PASS components/Render/__tests__/prototype-types.spec.tsx
PASS components/RichTextEditor/__tests__/editor-fallback.spec.tsx
PASS components/RichTextEditor/__tests__/editor.spec.tsx
PASS components/RichTextEditor/lib/__tests__/use-synced-editor-nonce.spec.tsx
PASS lib/__tests__/get-changed.spec.ts
PASS lib/__tests__/lookup-component-config.spec.ts
PASS lib/__tests__/prototype-zone-ids.spec.tsx
PASS lib/__tests__/use-hotkey.spec.tsx
PASS lib/__tests__/use-inject-css.spec.tsx
PASS lib/data/__tests__/map-fields-merge.spec.tsx
PASS lib/data/__tests__/walk-tree-merge.spec.tsx
PASS lib/dnd/__tests__/drop-animation.spec.ts
PASS lib/richtext/__tests__/html-to-json.server.spec.ts
PASS lib/richtext/__tests__/html-to-json.spec.tsx
PASS lib/richtext/__tests__/is-safe-href.spec.ts
PASS lib/richtext/__tests__/migrate-data.spec.ts
PASS lib/richtext/__tests__/normalize.spec.ts
PASS lib/richtext/__tests__/render.spec.tsx
PASS lib/richtext/__tests__/xss.spec.tsx
Test Suites: 27 passed, 27 total
Tests:       397 passed, 397 total
```

27 個測試檔、397 個測試全部 `PASS`，沒有 `FAIL`。§9 第 1、2、11、12 項分別由 Step 12（既有測試全數通過）、Task 5／9 的 spike 量測（結論記錄在 README，見上方 F1）、Step 14–15（demo）與 Step 20（Supabase）涵蓋。

- [ ] **Step 20: 驗收 §10 第 6 項：Supabase 可以啟動與停止，不影響 tciam**

指令與輸出沿用 Task 13 Step 17–25 已驗證的版本。只操作 `tceditor` 專案；其他 stack（tciam、tcdata 等）是什麼狀態都不要去動。先確認 `.env` 存在、未進版控，並記下目前的 compose 狀態：

```sh
cd /Users/kaellim/Desktop/projects/puck
test -f infra/supabase/docker/.env && echo ".env present"
git check-ignore -q infra/supabase/docker/.env && echo ".env is ignored"
git ls-files infra/supabase | grep -c '\.env$'
for p in 8200 5434 6545; do lsof -nP -iTCP:$p -sTCP:LISTEN >/dev/null 2>&1 && echo "port $p BUSY" || echo "port $p free"; done
docker compose ls | grep -E '^(tciam|tceditor) ' | tee "${TMPDIR:-/tmp}/tceditor-compose-before.txt"
```

預期：

```
.env present
.env is ignored
0
port 8200 free
port 5434 free
port 6545 free
tciam               running(17)         /Users/kaellim/Desktop/projects/LDAP/deploy/supabase/docker/docker-compose.yml,…
```

- `tciam` 那一行照實記錄即可，規格預期是 `running(17)`。
- 不應有 `tceditor` 那一行，因為 Task 13 結束時 stack 已停止。
- 若有 port 是 `BUSY`，停下來回報，不要停止任何服務。

啟動並檢查：

```sh
cd /Users/kaellim/Desktop/projects/puck
infra/supabase/up.sh > "${TMPDIR:-/tmp}/tceditor-supabase-up.log" 2>&1; echo "up exit=$?"
docker compose -p tceditor ps --format '{{.Health}}' | sort | uniq -c
docker ps --filter "label=com.docker.compose.project=tceditor" --format '{{.Names}}\t{{.Ports}}' | grep -- '->' | LC_ALL=C sort
ENV_FILE=infra/supabase/docker/.env
ANON_KEY=$(sed -n 's/^ANON_KEY=//p' "$ENV_FILE")
SERVICE_ROLE_KEY=$(sed -n 's/^SERVICE_ROLE_KEY=//p' "$ENV_FILE")
DASHBOARD_USERNAME=$(sed -n 's/^DASHBOARD_USERNAME=//p' "$ENV_FILE")
DASHBOARD_PASSWORD=$(sed -n 's/^DASHBOARD_PASSWORD=//p' "$ENV_FILE")
curl -sS -o /dev/null -w 'auth settings (anon):     %{http_code}\n' -H "apikey: ${ANON_KEY}" http://127.0.0.1:8200/auth/v1/settings
curl -sS -o /dev/null -w 'rest root (no key):       %{http_code}\n' http://127.0.0.1:8200/rest/v1/
curl -sS -o /dev/null -w 'rest root (anon):         %{http_code}\n' -H "apikey: ${ANON_KEY}" http://127.0.0.1:8200/rest/v1/
curl -sS -o /dev/null -w 'rest root (service_role): %{http_code}\n' -H "apikey: ${SERVICE_ROLE_KEY}" http://127.0.0.1:8200/rest/v1/
curl -sS -o /dev/null -w 'studio (no credentials):  %{http_code}\n' http://127.0.0.1:8200/
curl -sS -o /dev/null -w 'studio (dashboard login): %{http_code}\n' -u "${DASHBOARD_USERNAME}:${DASHBOARD_PASSWORD}" http://127.0.0.1:8200/project/default
docker compose ls | grep -E '^(tciam|tceditor) ' | awk '{ print $1, $2 }'
```

預期輸出（映像檔已在本機時約 30 秒）：

```
up exit=0
  11 healthy
tceditor-api-gw	127.0.0.1:8200->8000/tcp
tceditor-supavisor	127.0.0.1:5434->5432/tcp, 127.0.0.1:6545->6543/tcp
auth settings (anon):     200
rest root (no key):       401
rest root (anon):         403
rest root (service_role): 200
studio (no credentials):  401
studio (dashboard login): 200
tceditor running(11)
tciam running(17)
```

- 11 個 container 都是 healthy，只有兩個對外開 port，而且都只綁 `127.0.0.1`。
- Auth 與 PostgREST 經 gateway 正常回應。`rest root (anon)` 的 403 是官方 Envoy 只讓 service_role 讀 OpenAPI 根路徑的設定，見 Task 13 規格偏離第 2 項。
- Studio 需要 dashboard 帳密。
- zsh 中帳密要寫成 `${DASHBOARD_USERNAME}:${DASHBOARD_PASSWORD}`，加大括號，否則 `:w` 會被 zsh 當成修飾字。
- 若 `up exit` 不是 0，依 Task 13 Step 17 的說明處理。

停止並確認其他 stack 不受影響：

```sh
cd /Users/kaellim/Desktop/projects/puck
infra/supabase/down.sh > "${TMPDIR:-/tmp}/tceditor-supabase-down.log" 2>&1; echo "down exit=$?"
tail -1 "${TMPDIR:-/tmp}/tceditor-supabase-down.log"
docker ps -a --filter "label=com.docker.compose.project=tceditor" --format '{{.Names}}' | wc -l
docker compose ls | grep -E '^(tciam|tceditor) ' | diff "${TMPDIR:-/tmp}/tceditor-compose-before.txt" - && echo "compose stacks unchanged"
```

預期輸出：

```
down exit=0
down: tceditor Supabase stopped; data is kept.
       0
compose stacks unchanged
```

`down.sh` 之後沒有任何 `tceditor-*` container（volume 與資料保留）。`tciam` 那一行與啟動前逐字相同，表示 tciam 沒有受到影響。

- [ ] **Step 21: 驗收 §10 第 7 項：文件；收尾**

```sh
cd /Users/kaellim/Desktop/projects/puck
git log --format=%s -3 -- CLAUDE.md README.md CONTRIBUTING.md apps/demo/README.md CODE_OF_CONDUCT.md
git hash-object CLAUDE.md README.md CONTRIBUTING.md apps/demo/README.md
rm -f "${TMPDIR:-/tmp}/tceditor-check-doc-paths.mjs" "${TMPDIR:-/tmp}/tceditor-editor-check.mjs"
ls "$(git rev-parse --git-common-dir)/tceditor-backup/CLAUDE.md.pre-task14"
git status --short
git log --oneline -4
```

預期輸出（最後 4 行的 hash 會不同）：

```
docs: rewrite the contributing guide and remove the upstream code of conduct
docs: rewrite the README and the demo README for tceditor
docs: add CLAUDE.md for tceditor
55f546496ae250af437d50811c6fa98eef8a9fcf
0839631d69810be1b905d942c4fb82ecd9bbdd96
77a25b97b0c823eeac32b73623bae04118dc48bc
5b782d62aae69613e36b6835fbcca0d22bc2878c
.git/tceditor-backup/CLAUDE.md.pre-task14
<hash> docs: rewrite the contributing guide and remove the upstream code of conduct
<hash> docs: rewrite the README and the demo README for tceditor
<hash> docs: add CLAUDE.md for tceditor
<hash> docs(infra): document the tceditor supabase dev stack
```

`git status --short` 沒有輸出。原本的 `CLAUDE.md` 備份保留在 `.git/tceditor-backup/CLAUDE.md.pre-task14`，交給使用者決定是否刪除：它不會被追蹤，也不會被系統自動清除。

驗收結果彙整（全部步驟都符合預期時，規格 §10 的每一項都已滿足）：

| 規格 §10 驗收標準 | 依據 |
|---|---|
| `tzuchi/main` 從 `v0.23.0` 建立；`upstream` remote 設定完成；`main` 未被修改 | Step 16 |
| 套件改名為 `@tzuchi/tceditor`、版本 `0.1.0`；§3.2 的項目已移除；`LICENSE` 與 `NOTICE` 就位 | Step 13（tarball）、Step 17 |
| 已改用 pnpm，`pnpm verify` 全綠 | Step 12、13、18 |
| 三個上游修正已移植並記錄來源 | Step 18 |
| F1 spike 有結論（記錄在 README）；F1–F7 完成；§9 測試全部通過；richtext 渲染路徑沒有 `dangerouslySetInnerHTML` | Step 6、12、14、15、19 |
| `tceditor` Supabase 可以啟動與停止，不影響 tciam | Step 20 |
| `CLAUDE.md` 與 `README.md` 已更新 | Step 4–11、21 |

