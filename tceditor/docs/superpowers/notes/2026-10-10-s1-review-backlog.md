# S1 審查遺留事項

- 日期：2026-10-10
- 分支：tzuchi/main（S1 完成於 a958b3bc）
- 來源：S1 SDD 每個 task 的審查與整個分支總審。這些項目經判定不阻擋 S1，延到之後處理。

說明：「來源」欄的 `L###` 是 S1 SDD ledger（`progress.md`）的行號，`總審` 指整個分支總審（`final-review.md`）。SDD 工作目錄會被刪除，所以這份文件是唯一保存處。行號以 HEAD a958b3bc 為準；與原文不同者已更新，未能核對者標註「（行號為 Task N 時點）」。子專案範圍見 `docs/superpowers/specs/2026-10-08-tzuchi-puck-roadmap.md` §3。

## 1. 建議優先處理

1. **C-01**：UI 層權限可被特製的元件 id 繞過（`constructor`、`toString`、`__proto__`），元件 config 的 `delete: false` 會被忽略。S3 依賴 permissions 之前要修。
2. **C-02**：`nonce` 的穩定性前提沒有寫進 JSDoc 與 README，Next.js App Router client 導覽換 nonce 時，重建的樣式會被 CSP 擋掉。S3 串 CSP 前必寫。
3. **G-03**（連同 G-02）：audit gate 在 `node_modules` 與 `pnpm-lock.yaml` 不同步時 fail-open，資安閘門會放行有漏洞的出貨版本。
4. **B-01**：`options.paragraph: false` 時舊內容被丟掉、載入空文件，下一次編輯會覆蓋原值（可能遺失資料）。S2 定義欄位前必修。
5. **A-11**：`migrateRichTextInData` 會略過只由 `resolveFields` 加入的 richtext 欄位，切換後公開頁把舊 HTML 以字面標籤顯示。S2 之前處理。
6. **A-19**：`normalizeRichText(value, null)` 會拋 `TypeError`；S3 寫入驗證與 S4 MCP 會重用這個函式並收到不可信的選項。
7. **G-07**：多個 checkout／worktree 共用專案名 `tceditor`，`reset.sh` 會刪掉別人的共用 volume，`down.sh` 會停掉別人的 stack（可能遺失開發資料；CLAUDE.md 推薦用 worktree）。

## 2. 依子專案分類

### S1 後續修補（fork 本身的小修）

**A-01｜編輯器載入完成的那一刻有一個空白 frame**
- 位置：`packages/core/components/RichTextEditor/components/Editor.tsx:80`
- 問題：`immediatelyRender: false` 讓 Tiptap 在 passive `useEffect` 裡才建立 editor，`if (!editor) return null;` 讓 Suspense 換掉 fallback 後先提交一個空的畫面，inline 畫布或欄位塌成 0 高，下一個 frame 才出現編輯器。這是 v0.23.0 原有行為，但規格 §9.4 寫「載入前、載入後的 DOM 相同，沒有閃動」，現有測試只比對前後兩個結束狀態。
- 建議修法：editor 為 null 時輸出和 `EditorFallback` 相同的靜態內容，例如 `if (!editor) return <EditorFallback {...props} />;`，並補測試斷言 Suspense 解析後的第一次 commit 仍有 `.rich-text` 內容。
- 來源：總審 Minor 1。建議 S2 之前處理，可與 A-02 一起修。

**A-02｜fallback 遇到空內容不輸出任何東西**
- 位置：`packages/core/components/RichTextEditor/components/EditorFallback.tsx:28`；`packages/core/components/RichTextEditor/lib/use-synced-editor.ts` 的 `EMPTY_EDITOR_DOC`；`packages/core/components/RichTextEditor/__tests__/editor-fallback.spec.tsx`
- 問題：內容為 `""`、`undefined`、空 doc 時，fallback 不輸出任何東西，載入後的編輯器卻顯示 `EMPTY_EDITOR_DOC` 的空段落，inline 畫布載入時會跳一行（v0.23.0 既有行為）；`editor-fallback.spec.tsx` 也沒有涵蓋。
- 建議修法：fallback 遇到空文件時輸出空的 `<p>`（判斷規則與 `toEditorDoc` 共用一個不依賴 tiptap 的 helper），並對這三種空值補上 `isSameDom` 斷言。
- 來源：Task 7 審查（L242）；總審判定可與 A-01 一起修。

**A-03｜`fit-to-schema` 原樣保留 schema 沒有的 attrs**
- 位置：`packages/core/components/RichTextEditor/lib/fit-to-schema.ts:19,92`；`packages/core/components/RichTextEditor/lib/use-synced-editor.ts:179`（`editorDoc` 比較）
- 問題：`options.textAlign: false` 或 `textAlign.types` 只含 heading 時，仍輸出 `attrs.textAlign`，結果和編輯器的 `getJSON()` 不同，`use-synced-editor.ts` 的 `editorDoc` 比較永遠不成立，第一次編輯前遇到等值的外部內容就會多做一次 `setContent`，並用其他欄位的 metadata 呼叫 `setTextSelection`。總審評估：只造成一次多餘的 `setContent`，選取位置會被 clamp，不會壞。
- 建議修法：在 `withContent` 與段落轉換只保留 `schema.nodes[type].attrs` 宣告的 key，並補 `schemaWith({ textAlign: false })` 的測試。
- 來源：Task 7 審查（L239）。

**A-04｜`is-safe-href.ts` 註解與實作不符**
- 位置：`packages/core/lib/richtext/is-safe-href.ts:12`
- 問題：註解寫「第一個 `":"`」，但貪婪的 `/^([^/?#]*):/` 會抓到 `/?#` 之前的最後一個 `":"`（只會更嚴，安全無虞）。
- 建議修法：修正註解，並在 rejects 測試加入 `"https:javascript:alert(1)"`。
- 來源：Task 5 審查（L219）；總審建議順手修。

**A-05｜兩個同名的 `ORDERED_LIST_TYPES` 內容不同**
- 位置：`packages/core/lib/richtext/render.tsx:36`、`packages/core/lib/richtext/normalize.ts:28`
- 問題：render 版刻意少 `"1"` 以配合 tiptap，normalize 版含 `"1"`，同名容易誤用。
- 建議修法：把 render 的改名並加註，fixtures 補一個 `type "1"` 的清單。
- 來源：Task 5 審查（L220）。

**A-06｜normalize 不保證 content expression**
- 位置：`packages/core/lib/richtext/normalize.ts:112`、`:293` 附近的 `listItem` 分支（原文為 285-287，Task 5 時點）；`normalize.spec.ts:46,83`（Task 5 時點）
- 問題：空的 listItem、清單、引言，或開頭不是 paragraph 的 listItem 會原樣輸出（`normalize.spec.ts` 也這樣斷言）。Task 7 的編輯器會載入無法通過 `node.check()` 的文件。總審：只影響竄改的資料。
- 建議修法：至少在 docstring 註明並告知 S3（寫入驗證），或補齊必要內容。
- 來源：Task 5 審查（L221）。

**A-07｜上游移植的註解重複用字**
- 位置：`packages/core/components/AutoFrame/index.tsx:456`、`packages/core/components/Puck/components/Layout/index.tsx:304`、`packages/core/components/Puck/components/Preview/index.tsx:159`（`DraggableComponent` 的那一處目前已搜不到）
- 問題：`Opt out the ... out of` 重複用字。為保持與 cherry-pick 一致而未改。
- 建議修法：不需要處理，除非之後不再追蹤上游。
- 來源：Task 4 審查（L214）。

**A-08｜`LOOKS_LIKE_HTML` 在大量 `<a` 時是平方時間**
- 位置：`packages/core/lib/richtext/html-to-json.ts:9`
- 問題：`/<\/?[a-z][\s\S]*>/i` 遇到大量 `<a` 而沒有 `>` 時是平方時間（40 KB 約 233 ms）。總審：只在伺服器端轉換時使用，資料是我方的。
- 建議修法：改為語意相同的線性判斷，先 `exec(/<\/?[a-z]/i)`，再對該位置之後做 `indexOf(">")`。
- 來源：Task 8 審查（L250）。

**A-09｜CJS 版的 `require(esm)` 需求沒寫進入口註解與 CHANGELOG**
- 位置：`packages/core/bundle/richtext-migrate.ts:1-2`、`CHANGELOG.md`（只有 `CLAUDE.md:73` 有寫）；README 的 richtext-migrate 說明
- 問題：CJS `require` 這個入口需要預設啟用 `require(esm)` 的 Node（20.19+／22.12+，因為 happy-dom 只有 ESM），而 core 的 engines 是 `>=20`。Task 14 的 CHANGELOG 同樣沒有註記。
- 建議修法：在入口註解與 CHANGELOG 加註，並建議較舊的 Node 用 ESM import。
- 來源：Task 8 審查（L252）、Task 14 審查（L297）。

**A-10｜轉換工具沒處理 v0.15 以前的扁平 root**
- 位置：`packages/core/lib/richtext/migrate-data.ts:97-104`（目前的 root 處理在檔案後半段，只讀 `data.root.props`）；`packages/core/lib/migrate.ts:29-35`
- 問題：`migrateRichTextInData` 只處理 `root.props`，`lib/migrate.ts` 仍支援的 v0.15 前扁平 root 中的 richtext 會被靜默略過。
- 建議修法：在 JSDoc 註明先跑 `migrate()`，或在沒有 `props` 時以 `data.root` 作為 root props 轉換。
- 來源：Task 8 審查（L253）。

**A-11｜轉換工具會略過只由 `resolveFields` 加入的 richtext 欄位**
- 位置：`packages/core/lib/richtext/migrate-data.ts:62-67,85-92`（目前的 `hasOwn` 與 JSDoc 在 17-18、63、88 附近）
- 問題：`migrateRichTextInData` 只從靜態的 `config.components[type].fields` 與 `config.root.fields` 找欄位。只由 `resolveFields` 動態加入的 richtext 欄位會被默默略過，切換後公開頁會把這些舊 HTML 以字面標籤顯示。目前 JSDoc 沒有提到這個限制。
- 建議修法：在 JSDoc 與 README 註明限制；或加選用參數 `getFields?(item) => Fields`，並補測試。
- 來源：總審 Minor 3。建議 S2 之前處理。

**A-12｜d.ts 引用 `NodeJS.Timeout`**
- 位置：`packages/core/lib/on-scroll-end.ts:5`、`packages/core/lib/dnd/collision/collision-debug.ts:10`、`packages/core/components/RichTextEditor/lib/use-synced-editor.ts:61`
- 問題：主入口 `dist/index-*.d.ts` 引用 `NodeJS.Timeout`（`pendingLoadTimeouts`），使用端未安裝 `@types/node` 時 `tsc` 報 `Cannot find namespace 'NodeJS'`。上游承襲，非 S1 引入。
- 建議修法：改用 `ReturnType<typeof setTimeout>`。
- 來源：Task 8 審查（L261）。

**A-13｜CHANGELOG 對 `__proto__` 的說法誇大**
- 位置：`CHANGELOG.md:23`
- 問題：「a `__proto__` key … is now kept as an own key instead of replacing the prototype of the result」（計畫 Step 17 逐字要求）暗示已發佈的版本有原型被換掉的問題，但出貨的 dist 以 esbuild 的 `__spreadValues`／`__defNormalProp`（`dist/index.js:12-16`，key 已存在時用 `defineProperty`）或原生 spread 合併，本來就保留自有 key；只有 ts-jest（target es6 → `Object.assign`）才會換掉原型。沒有低估問題，只是誇大。
- 建議修法：改寫為「合併不再依賴 object spread 的編譯方式，即使 spread 被降級成 `Object.assign`，`__proto__` 仍是自有 key」，或刪掉這半句。
- 來源：Task 10 審查（L267）。

**A-14｜`default-slots.ts` 仍以 spread 累加**
- 位置：`packages/core/lib/data/default-slots.ts:4-8`；`packages/core/lib/data/map-fields.ts:257-258`；`packages/core/lib/data/__tests__/map-fields-merge.spec.tsx:38-51`
- 問題：在 mapFields 管線中仍以 `reduce` 搭配 `{ [fieldName]: [], ...acc }` 累加使用者 props，字面上違反全域規則 26。在 ts-jest（`Object.assign`）中，有 slot 欄位的元件的 `__proto__` prop 會被丟掉並換掉原型，而 `map-fields-merge.spec.tsx` 沒有涵蓋 slot 欄位。dist 不受影響，成本為 O(slot 數 × n)。
- 建議修法：改為 `Object.fromEntries([...slotNames.reverse().map((n) => [n, []]), ...Object.entries(value)])`（沒有 slot 時回傳原物件），並在 `__proto__` 測試加入帶 slot 欄位的元件。
- 來源：Task 10 審查（L268）。

**A-15｜`migrate.ts` 的內層累加器以 zone 名稱為 key**
- 位置：`packages/core/lib/migrate.ts:132`（讀取在 :135，錯誤訊息在 :183）
- 問題：`unmigratedZonesGrouped[componentId] = {}` 以 zone 名稱為 key，zone 名稱為 `constructor`／`toString`／`__proto__` 時 :135 讀到繼承成員而略過，該 zone 不會交給 `migrateFn`，最後拋出誤導的「No slot exists」。目前無害，只導致錯誤訊息誤導。
- 建議修法：改用 `Object.create(null)` 搭配 `hasOwnProperty.call`（或 `defineProperty`）並補測試。
- 來源：Task 11 審查（L275）。

**A-16｜`lastChange[id]` 與 `componentState` 以一般物件承接使用者 id**
- 位置：`packages/core/lib/resolve-component-data.ts:20`（寫入在 :129）、`packages/core/lib/resolve-all-data.ts:38`、`packages/core/store/index.ts:121`（`componentState`，更新在 197-218）
- 問題：`cacheStore.lastChange[id] = …` 在 id 為 `__proto__` 時（es2020 打包也一樣）會換掉模組層級 `cache.lastChange` 的原型。目前無害，但屬全域規則禁止的寫法。
- 建議修法：把 `lastChange` 與 `componentState` 改為 `Object.create(null)`，可與 C-01 合併處理。
- 來源：Task 11 審查（L276）。

**A-17｜`register-zone` 用 spread 重建 `indexes.zones`，與文件宣稱的不變條件不符**
- 位置：`packages/core/reducer/actions/register-zone.ts:27-37` 與 `:49,65-68`；`CLAUDE.md:81,129`；`packages/core/lib/data/walk-app-state.ts:20-29`（`createIndex`）
- 問題：每次 `unregisterZone`（以及從 cache 重新註冊時）都把 `indexes.zones` 重建成一般物件，破壞 `walk-app-state.ts` 與 CHANGELOG 所說的「索引不帶 `Object.prototype`」不變條件。`CLAUDE.md` 說兩個索引「是」null-prototype 並建議用 `in` 判斷，在一般物件上會命中 `constructor` 等繼承成員。因 zone compound 必含 `:`，目前無實際危害，但這份資安規則文件的不變式與建議是錯的。
- 建議修法：`register-zone.ts` 改用與 `createIndex` 相同的 `Object.assign(Object.create(null), …)`，或把 `CLAUDE.md` 改為「只用 `Object.prototype.hasOwnProperty.call`」。
- 來源：Task 11 審查（L277）、總審 Minor 4。

**A-18｜`migrate-data.ts` 自行實作元件設定查找**
- 位置：`packages/core/lib/richtext/migrate-data.ts:17-18,63-65`；`packages/core/lib/migrate.ts:147-155`、`packages/core/lib/transform-props.ts:33-38`
- 問題：自帶 `hasOwn` 重寫一次元件設定查找，`migrate.ts` 與 `transform-props.ts` 也各自 inline 同一個自有 key 取值寫法。行為等價。
- 建議修法：讓 `migrate-data.ts` 改用 `lookupComponentConfig`，並考慮抽出 `getOwn(obj, key)` 共用。
- 來源：Task 11 審查（L278）。

**A-19｜`normalizeRichText(value, null)` 會拋 `TypeError`**
- 位置：`packages/core/lib/richtext/normalize.ts:355`（`options: { maxDepth?: number } = {}`，讀取在 :363 的 `options.maxDepth`）
- 問題：既有行為，型別標為非 null，但呼叫端傳 `null` 時讀 `options.maxDepth` 會拋 `TypeError`。S3 寫入驗證與 S4 MCP 會重用這個函式並可能傳入不可信的選項。
- 建議修法：呼叫端不要傳 `null`，或以 `options ?? {}` 當預設。
- 來源：Final 行（L305）。

### S2 元件規格

**B-01｜`options.paragraph: false` 時舊內容被丟掉並載入空文件**
- 位置：`packages/core/components/RichTextEditor/lib/fit-to-schema.ts:86`；`packages/core/components/RichTextEditor/lib/use-synced-editor.ts:14`（`EMPTY_EDITOR_DOC`，Task 7 時點）
- 問題：schema 沒有 paragraph（`options.paragraph: false`）時，段落、舊字串與轉換後的段落連同文字直接被丟掉；`EMPTY_EDITOR_DOC` 也是段落，結果是 `Invalid content` 並載入空文件，下一次編輯會覆蓋原值。要特定欄位設定才會發生。
- 建議修法：改用 schema 的預設 textblock（`topNodeType.contentMatch.defaultType`），空文件改用 `topNodeType.createAndFill()`，補 `schemaWith({ paragraph: false })` 的測試，同時修正 CHANGELOG 對這點的說法。
- 來源：Task 7 審查（L240）；總審：S2 定義欄位前必修。

**B-02｜`extractText` 把不同區塊的文字直接相接**
- 位置：`packages/core/lib/richtext/normalize.ts:59-83`
- 問題：未知節點或超深 blockquote 內的 `p("a")`、`p("b")` 變成 `"ab"`。只影響未知節點或過深內容。
- 建議修法：在區塊之間插入 `"\n"` 或每個區塊各輸出一段，並補測試。
- 來源：Task 5 審查（L218）；總審：建議 S2／S4 前修。

### S3 Supabase 後端

**C-01｜permissions 以一般物件依 id 查表**
- 位置：`packages/core/store/slices/permissions.ts:188`（及 :63 的 `cache[item.props.id]`；:210 的 `resolvedPermissions["root"]` 同型）
- 問題：id 為 `constructor`、`toString`、`__proto__` 時讀到繼承成員，`getPermissions({item})` 只回傳 `globalPermissions`，元件 config 的靜態 permissions（如 `delete: false`）被忽略，UI 層權限可被特製 id 繞過。要竄改資料才觸發，且只影響 UI 層。
- 建議修法：改為只讀自有 key（ts-jest 下的 `__proto__` 案例需把 :105-121 的寫入改成 `Object.assign(Object.create(null), …)`）並補 store 測試；可與 A-16 合併。
- 來源：Task 11 審查（L274）；總審：S3 依賴 permissions 之前要修。

**C-02｜`nonce` 的穩定性前提沒有文件**
- 位置：`packages/core/components/Puck/index.tsx:93-99`（`PuckProps.nonce` JSDoc）；`README.md`（nonce 範例，約 :73）；`packages/core/lib/use-inject-css.ts:179`、`packages/core/components/AutoFrame/index.tsx:380`、`packages/core/components/DragDropContext/index.tsx:264,133`、`packages/core/components/RichTextEditor/lib/use-synced-editor.ts:110`（行號為 Task 12 時點，僅部分核對）
- 問題：JSDoc 與 README 沒有寫出「必須是目前文件 CSP 的 nonce、頁面存續期間不得改變」。nonce 改變時 `use-inject-css.ts`／`AutoFrame` 會以新值重建樣式，`DragDropContext`／`use-synced-editor.ts` 則沿用舊值。Next.js App Router client 導覽可能傳入新的 per-request nonce，導致重建的 ui-default／iframe-styles 被原 CSP 擋下。README 也未註明 style attribute 不受 nonce 管制（hash 由 brief 固定）。
- 建議修法：在 JSDoc 與 README 註明此前提與 style attribute 的限制；可把 `DragDropContext/index.tsx:133` 改為在 initializer 內讀 `appStore.getState().nonce`。
- 來源：Task 12 審查（L284）、Task 14 審查（L296）；總審：S3 串 CSP 前必寫。

### S4 MCP server

（無）

### S5 編輯器效能

（無）

### S6 大型依賴替換

（無）

### infra／開發環境

**G-01｜core 依賴 demo hoist 上來的 `@types/node@17`**
- 位置：`packages/core/tsconfig.typecheck.json:5`（`types: ["node"]`，繼承自 `packages/core/tsconfig.json:6`）；`packages/core/package.json`（目前沒有宣告 `@types/node`）
- 問題：型別檢查依賴未宣告的 `@types/node`，由 `shamefullyHoist` 從 `apps/demo` 提升（17.0.45）。lockfile 固定時可以重現。
- 建議修法：在 core 的 devDependencies 補宣告 `@types/node`（例如 `^20`），注意不要改變有效的 TS lib。
- 來源：Task 1 審查（L195）。

**G-02｜finding 沒有 paths 時 `gated` 不會被設定**
- 位置：`scripts/audit-gate-lib.mjs:105`（`gated` 在 :113 的 `finding.paths ?? []` 迴圈內設定）
- 問題：一個出貨的有漏洞版本，若其 finding 沒有回報 paths，會靜默通過。總審：pnpm 對每個存在於 lockfile 的版本至少輸出一條路徑，實務上不易觸發。
- 建議修法：為它輸出 placeholder-path finding，或以 exit 2 拒絕該報告；建議與 G-03 一起處理。
- 來源：Task 1 審查（L198）。

**G-03｜audit gate 在安裝過期時可能 fail-open**
- 位置：`scripts/audit-gate-lib.mjs:45-82`、`scripts/audit-gate.mjs:20-38`
- 問題：shipped 集合是從 `node_modules` 解析的，`pnpm audit` 卻讀 `pnpm-lock.yaml`。`git pull` 改了 lockfile 但還沒重新安裝時，兩邊版本不一致，lockfile 中出貨的漏洞版本不會被判為 GATED。目前沒有比對 `node_modules/.pnpm/lock.yaml` 的程式碼。
- 建議修法：在 `audit-gate.mjs` 開頭比對 `node_modules/.pnpm/lock.yaml` 與 `pnpm-lock.yaml`，不同就 exit 2（訊息提示先跑 `pnpm install --frozen-lockfile`），並補 node:test。
- 來源：總審 Minor 2（與 Task 14 的 node_modules／lockfile 落差有關，見 §4）。

**G-04｜`check:bundle` 沒有涵蓋 `internal` 入口**
- 位置：`packages/core/scripts/check-bundle-imports.mjs:10`（`ENTRIES`）
- 問題：沒有公開 subpath `./internal` 的 `internal.{mjs,js}`（目前實測 0 個問題）。
- 建議修法：加入 `internal`，或從 `package.json` `exports` 推導出除了 `richtext-migrate` 以外的所有 JS 入口。
- 來源：Task 8 審查（L251）。

**G-05｜`require_tceditor_project` 吞掉 compose config 的 stderr**
- 位置：`infra/supabase/lib.sh:65`
- 問題：把 `compose config` 的 stderr 丟進 `/dev/null`，Compose < 2.24.4 或 `.env` 格式錯時只印「resolves to ''」，看不出原因。
- 建議修法：改為 `out=$(compose_files config 2>&1)`，失敗時印出 `$out` 再 exit。
- 來源：Task 13 審查（L288）。

**G-06｜`cd` 在 `CDPATH` 含 `.` 時路徑錯誤**
- 位置：`infra/supabase/lib.sh:9`、`infra/supabase/setup-env.sh:14`
- 問題：以相對路徑 `cd`，使用者 export 含 `.` 的 `CDPATH` 時 `cd` 會印出目錄，`SUPABASE_DOCKER_DIR` 變兩行，所有腳本以誤導的「missing …」結束（已重現）。罕見環境。
- 建議修法：改為 `CDPATH= cd -- "$(dirname -- "$0")/docker"`。
- 來源：Task 13 審查（L289）。

**G-07｜多個 checkout／worktree 共用專案名 `tceditor`**
- 位置：`infra/supabase/up.sh:32`、`infra/supabase/down.sh`、`infra/supabase/reset.sh:53`、`infra/supabase/lib.sh`
- 問題：專案名在所有 checkout 固定為 `tceditor`，從第二個 checkout／worktree 執行時，`up.sh` 會把別人的 container 當自己的而略過 port 檢查並以本 checkout 的 bind mount 重建，`down.sh` 會停掉別人的 stack，`reset.sh` 會刪掉共用的 `tceditor_db-config`。目前沒有 `working_dir` 的 guard。
- 建議修法：在 `lib.sh` 加 guard，比對 `com.docker.compose.project.working_dir` label 與 `$SUPABASE_DOCKER_DIR`，不同就拒絕；並在 README 註明一台機器只能由一個 checkout 執行。
- 來源：Task 13 審查（L290）；總審建議處理（CLAUDE.md 推薦用 worktree）。

**G-08｜port 寫死在訊息與文件中**
- 位置：`infra/supabase/up.sh:55-57`、`infra/supabase/README.md:21-23`、`infra/supabase/setup-env.sh:55-57`
- 問題：寫死 8200／5434／6545，但 port 由 `.env` 的 `API_GW_HTTP_PORT` 等變數決定，改了 `.env` 會不一致。
- 建議修法：由 `up.sh` 從 `compose config` 印出實際 port，或在 README 與 `setup-env.sh` 註明 port 固定、要改須同時改三個 URL。
- 來源：Task 13 審查（L291）。

**G-09｜`package-files.spec.ts` 以完全相等斷言 `files` 陣列**
- 位置：`packages/core/__tests__/package-files.spec.ts`
- 問題：後續改 `files` 須同步更新測試。brief 已載明的取捨。
- 建議修法：無需處理，除非這個斷言造成維護負擔。
- 來源：Task 2 審查（L207）。

**G-10｜LICENSE／NOTICE 有三份副本**
- 位置：根目錄與兩個套件（`packages/core`、`packages/plugin-heading-analyzer`）
- 問題：靠測試同步而非單一來源。brief 明定的取捨。
- 建議修法：無需處理，除非副本數增加。
- 來源：Task 2 審查（L208）。

### 測試缺口

**H-01｜`BUNDLED_DEV_DEPENDENCIES` 的測試只比對字面值**
- 位置：`scripts/audit-gate-lib.test.mjs:96-104`（目前在 :101-103）
- 問題：只檢查 `BUNDLED_DEV_DEPENDENCIES` 等於一個字面值，永遠抓不到 production 程式碼 import 了新的 devDependency。
- 建議修法：加一個 node:test，執行 Step 29 的 `git grep` 掃描並斷言結果等於該常數。
- 來源：Task 1 審查（L196）。

**H-02｜`audit-gate.mjs` 的 0／1／2 結束碼沒有自動化測試**
- 位置：`scripts/audit-gate.mjs:20-85`
- 問題：結束碼的決策沒有自動化測試（已手動驗證過三種結束碼）。
- 建議修法：抽出可測試的決策函式，或在 PATH 放 stub `pnpm`（印出 fixture JSON）後 spawn 該腳本。
- 來源：Task 1 審查（L197）。

**H-03｜css-imports 測試的 remote-URL regex 與型別**
- 位置：`packages/core/__tests__/css-imports.spec.ts:41`
- 問題：remote-URL regex 不涵蓋 `image-set()` 等少見寫法，且 `package.json` 以 `JSON.parse` 取得 `any` 型別。
- 建議修法：補 `image-set()` 寫法並替 `JSON.parse` 的結果加型別。
- 來源：Task 3 審查（L211）。

**H-04｜「does not use hooks」只執行 `RichTextContent` 本身**
- 位置：`packages/core/lib/richtext/__tests__/render.spec.tsx:129-130`
- 問題：mapping 元件若加了 hook 抓不到。
- 建議修法：對每個 `nodeMapping`／`markMapping` 函式在 render 外直接呼叫一次並斷言不拋錯。
- 來源：Task 5 審查（L222）。

**H-05｜「keeps the text of removed links」只檢查 client**
- 位置：`packages/core/lib/richtext/__tests__/xss.spec.tsx:51-56`
- 建議修法：改成 `for (const root of [server, client])` 兩邊都斷言。
- 來源：Task 5 審查（L223）。

**H-06｜`expectSafePage` 的斷言與 JSDoc 不符**
- 位置：`packages/core/components/Render/__tests__/index.spec.tsx:107`（JSDoc 在 :89-93 附近）
- 問題：對竄改的 JSON 只斷言 `blocks.length > 0`，與 JSDoc 宣稱的「still shows its text」不符。
- 建議修法：在 else 分支斷言 `article .rich-text` 的 `textContent` 非空（15 組 tampered payload 都有文字），或修正 JSDoc。
- 來源：Task 6 審查（L230）。

**H-07｜richtext 唯讀路徑沒有測試**
- 位置：`packages/core/lib/field-transforms/default-transforms/rich-text-transform.tsx:140-141`（`isReadOnly`，來自資料的 `readOnly` map 或 `forceReadOnly`）
- 問題：唯讀路徑改為 `RichTextContent` 後沒有任何測試（目前 Puck 測試中搜不到 `readOnly`）；demo 的 Hero 會用到。
- 建議修法：在 Puck `richtext.spec.tsx` 以 `{ type: "richtext" }` 加上 `readOnly: { body: true }` 渲染 JSON 與舊 HTML 字串，斷言 `.rich-text > p` 的文字且沒有 `<img>`。
- 來源：Task 6 審查（L231）；總審建議補測。

**H-08｜richtext 公開型別的匯出沒有測試把關**
- 位置：`packages/core/__tests__/richtext-exports.spec.ts:16`
- 問題：只檢查執行期的值，公開型別 `RichTextDoc`／`RichTextNode`／`RichTextMark` 沒有測試把關。
- 建議修法：以 `import type` 從 `../bundle/core` 與 `../bundle/rsc` 引入，並加一行型別斷言（例如 `const doc: RichTextDoc = entry.textToRichText("x")`），讓缺少匯出時 ts-jest 失敗。
- 來源：Task 6 審查（L232）。

**H-09｜`isAllowedUri` 只能再加嚴的行為沒有測試**
- 位置：`packages/core/components/RichTextEditor/__tests__/editor.spec.tsx:161-177`（目前相關測試在 :160-250；搜不到 `isAllowedUri` 的測試）
- 問題：只測預設 `isAllowedUri` 下的 `setLink`，沒有測「使用者的 `options.link.isAllowedUri` 只能再加嚴」（例如 `() => true` 時 `sms:` 仍回 false，拒絕一切的規則讓 https 回 false），也沒有測 `setContent` 解析 `<a href="ftp://x">` 時會移除連結。
- 建議修法：補這三個斷言。
- 來源：Task 7 審查（L241）。

**H-10｜`tiptap.extensions` 分支沒測**
- 位置：`packages/core/lib/richtext/migrate-data.ts:28`；`packages/core/lib/richtext/__tests__/migrate-data.spec.ts`
- 建議修法：補一個帶自訂 extension 的欄位案例，斷言結果符合 `normalizeRichText` 規則（未知 mark 只留文字）且不拋錯。
- 來源：Task 8 審查（L254）。

**H-11｜`__proto__` 測試沒有斷言值**
- 位置：`packages/core/lib/data/__tests__/map-fields-merge.spec.tsx:45-50`、`packages/core/lib/__tests__/get-changed.spec.ts:33-37`
- 問題：只斷言 `__proto__` 是自有 key、原型沒被換掉，沒有斷言值（`walk-tree-merge.spec.tsx:44-46` 有），而 `({}).polluted` 那條斷言在新舊實作下都必定通過。
- 建議修法：補 `expect(result.props["__proto__"]).toEqual({ polluted: "yes" })` 與 `expect(changed["__proto__"]).toBe(true)`。
- 來源：Task 10 審查（L269）。

**H-12｜`richtext.spec` 在極端滿載下逾時**
- 位置：`packages/core/components/Puck/__tests__/richtext.spec.tsx` 的 `loads JSON into the editor and follows programmatic updates`
- 問題：極端滿載下會撞 jest 5 秒逾時（另有一次 worker SIGSEGV）。環境問題，非 Task 10 範圍。
- 建議修法：若再出現，替該測試加 timeout 或查 SIGSEGV；S6 換 vitest 時一併確認。
- 來源：Task 10 審查（L272）。

**H-13｜`insert` 與索引重建的測試缺口**
- 位置：`packages/core/reducer/actions/insert.ts:22-23`；`packages/core/components/Puck/__tests__/prototype-ids.spec.tsx`；`packages/core/reducer/actions/__tests__/insert.spec.ts`；`packages/core/lib/data/walk-app-state.ts:230-231`（Task 11 時點）
- 問題：`insert` 對沒有 config 的 `componentType` 改為插入只帶 id 的元件（原本拋 `TypeError`）沒有測試；索引已含自有 `__proto__` 時再經過一次 `walkAppState` 合併的路徑也沒有涵蓋。
- 建議修法：在 `reducer/actions/__tests__/insert.spec.ts` 補 unconfigured type 案例，並在 prototype-ids 測試加一次會重建索引的 dispatch，重新斷言三個 id 仍是 `nodes` 的自有 key。
- 來源：Task 11 審查（L279）。

## 3. 總審婉拒、不打算修正的項目

1. **`components/DropZone/index.tsx:90` 的 `InsertPreview` 仍使用 `dangerouslySetInnerHTML`**
   - 婉拒理由：上游既有、非 richtext 的路徑，複製的是編輯器自己渲染出來的 `outerHTML`；`CLAUDE.md:124` 已記錄。
   - 何時重新檢視：改動 DropZone 預覽、或預覽內容可能含使用者輸入時（S2、S5）。
2. **公開頁的 `textAlign` 以 SSR 的 `style="…"` 屬性輸出**
   - 婉拒理由：嚴格 CSP（沒有 `'unsafe-inline'` 的 `style-src`／`style-src-attr`）會擋掉它。F5 只涵蓋編輯器注入的 `<style>`，公開頁的 CSP 屬於 S3。
   - 何時重新檢視：S3 定義公開頁 CSP 時；若要在嚴格 CSP 下生效，改為輸出 class。
3. **`plugin-heading-analyzer` 沒宣告就使用 `lucide-react`，並經 `@/core` 引入 classnames**
   - 婉拒理由：上游結構，F7 只點名 core；audit gate 以聯集涵蓋。
   - 何時重新檢視：這個 plugin 要獨立發佈、或整理 plugin 依賴時。
4. **`normalizeRichText` 遇到共用參考的 DAG 會指數成長**（實測 19 層約 171 ms）
   - 婉拒理由：`JSON.parse`／jsonb 產生不出共用參考，只有程式自行組出物件圖才會遇到。
   - 何時重新檢視：S3 寫入驗證或 S4 MCP 開始接受非 JSON 解析來源的物件圖時。
5. **`isSafeHref` 允許 `//host`、`\\host` 這類協定相對網址**
   - 婉拒理由：屬 open-redirect 類型，不是 XSS；規格明文允許相對路徑。
   - 何時重新檢視：S3 制定連結或轉址政策、需要防 open redirect 時。
6. **`reset.sh` 在 Linux 上可能刪不掉以容器 uid 擁有的 bind mount 資料目錄**
   - 婉拒理由：規格的環境是 macOS 的 Docker Desktop。
   - 何時重新檢視：開發環境或 CI 改在 Linux 上跑 Supabase stack 時。
7. **`mapDeep` 遇到空字串等 falsy 的 richtext 值時回傳 `null`**
   - 婉拒理由：上游行為，S1 沒有改動。
   - 何時重新檢視：S2 為 richtext 欄位定義預設值或空值語意時。
8. **`insert` 遇到沒有設定的型別不再拋錯；`walkTree` 遇到 slot 中原型成員名稱的型別會拋錯**
   - 婉拒理由：計畫差異第 21 項，已核准。
   - 何時重新檢視：S3 做伺服器端元件型別驗證時（與 H-13 相關）。
9. **demo 的 `next@16.2.6` 有 critical advisory**
   - 婉拒理由：已核准的偏離（第 1、4 項），以只綁 loopback 緩解。
   - 何時重新檢視：demo 要對外網路開放、或升級 Next.js 時。
10. **自訂 `tiptap.extensions` 調整 mark priority 時，`MARK_ORDER` 與 schema 的排序可能不同，造成多一次 `setContent`**
    - 婉拒理由：屬已核准偏離第 17 項的範圍（自訂型別不支援）。
    - 何時重新檢視：S2 允許元件 schema 自訂 tiptap extensions 時。
11. **`CLAUDE.md:148` 稱 vendored 目錄為「byte-identical copy」，但有兩個空 `.gitkeep` 刻意不進版控**
    - 婉拒理由：計畫明訂，Docker 會自動建立，沒有功能影響。
    - 何時重新檢視：下一次用 `update.sh` 更新 vendored Supabase 檔案時，順便修正措辭。

## 4. 已在 S1 修正

- **Task 5 `normalize.ts` 不驗證 `options.maxDepth`**（L217；總審「必修」T5-1）
  - 修正 commit：a958b3bc `fix(richtext): only let maxDepth lower the normalize depth limit`。
  - 證據：`normalize.ts` 的 `normalizeRichText` docstring（約 :340-352） 寫明「只能調低；非負整數以外的值被忽略，較大的值夾到 `RICHTEXT_MAX_DEPTH`」，`maxDepth` 經 `toMaxDepth(options.maxDepth)` 處理。
- **Task 1 `.prettierignore` 中 `.superpowers/` 的位置**（L194）
  - 修正 commit：5903b954 `build: move .superpowers/ into its own .prettierignore block`。
  - 證據：`.prettierignore` 目前 `.superpowers/` 在「# Local agent workspace」自成一段，`docs/superpowers/` 另在「Design specs and implementation plans」段。
- **Task 9 `RichTextDoc` 沒有從公開入口匯出**（L263）
  - 判定：此項不成立（總審 T9-1）。
  - 證據：`packages/core/bundle/core.ts:21` 與 `bundle/rsc.tsx:3` 的 `export * from "../lib/richtext"` 連型別一起匯出（`lib/richtext/index.ts:1` 匯出 `RichTextDoc`、`RichTextMark`、`RichTextNode`）；總審實測 `dist/index.d.ts:2` 有 `ac as RichTextDoc`。
- **Task 14 主工作目錄 `node_modules` 與 lockfile 的落差**（L299）
  - 證據：HEAD 上 `cmp node_modules/.pnpm/lock.yaml pnpm-lock.yaml` 結果相同（總審也確認過）。落差已消失，但「安裝過期時閘門 fail-open」的風險仍在，見 G-03。

### 已排除的流程行（不是程式碼發現）

- L204 ruling C1 需由 controller 修訂：已由 5903b954 落實。
- L205 Task 2 Step 1 預期的 `git log -1`：Task 2 派發前的流程提醒。
- L248 Task 7 fix round 新增 2 個 editor.spec 測試，後續 jest 總數預期差 2：只是計數備忘。
- L298 Task 14 最終 `pnpm verify` 在 Node v26.7.0 上執行：已解決，controller 在 HEAD a958b3bc、Node v24.21.0 重跑 `pnpm verify`，exit 0。

### 核對

ledger 含 `minor (deferred)` 的行共 53 行，加上 `Final:` 那一行已包含在內：待辦 45 行（合併後為 43 個項目，其中 L252 與 L297、L284 與 L296 各合併為一項）+ 已修正或不成立 4 行 + 排除的流程行 4 行 = 53。另有總審新增的 Minor 1、2、3 共 3 個項目（A-01、G-03、A-11），Minor 4 併入 A-17。待辦合計 46 項：A 19、B 2、C 2、G 10、H 13。
