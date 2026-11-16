# 參與 tceditor 開發

tceditor 是慈濟內部維護的專案，衍生自 Puck v0.23.0。遠端 repo、issue 追蹤與 CI 平台尚未決定（見 `docs/superpowers/specs/2026-10-08-tzuchi-puck-roadmap.md`），在那之前，需求與問題直接與專案負責人討論，規格寫在 `docs/superpowers/specs/`。

架構說明、完整指令與資安規則在 `CLAUDE.md`，動手前請先讀過。

## 開發環境

- Node.js 24 以上、pnpm 10.26.1。
- TypeScript、CSS Modules、Turborepo；core 與外掛以 tsup 建置，`packages/spec` 與 `packages/blocks` 直接提供原始碼；demo 與示範站是 Next.js，區塊 Storybook 是 Storybook 10（Vite）。

```sh
pnpm install --frozen-lockfile
pnpm dev
```

`pnpm dev` 只啟動 `apps/demo`（http://localhost:3000，編輯器在 `/edit`）。demo 直接編譯 `packages/core` 的原始碼，開發時不需要先建置 core。

開發區塊時用 `pnpm dev:showcase`（示範站，http://127.0.0.1:3010/activity/edit）與 `pnpm storybook`（區塊 Storybook，http://127.0.0.1:6010）。這兩個 app 以及 `packages/spec`、`packages/blocks` 使用 core 建置後的 `dist`，修改 core 之後要先執行 `pnpm --filter @tzuchi/tceditor build`。

## 流程

1. 從 `tzuchi/main` 開分支。`main` 是上游 Puck 的原樣鏡像，不要在上面 commit。
2. 修改程式時先寫測試。測試放在程式旁邊的 `__tests__/`，檔名為 `*.spec.ts(x)`（core、spec、blocks 與示範站都一樣）。
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

### 區塊

- 新增或修改區塊前，先讀 `CLAUDE.md` 的 Blocks and specs 一節與 `packages/blocks/README.md`。
- 規格只允許相容修改。新增有預設值的欄位、放寬上下限、新增選項這類修改要把 `version` 加 1；只改標籤、說明、範例不必。不相容的修改改成新增區塊類型，舊類型設為 `deprecated: true`。
- 改完規格後執行 `pnpm gen:blocks`，產生的 stories 與 `packages/blocks/generated/` 要一起 commit。
- `vendor/uikit` 不得手改，只能用 `pnpm sync:uikit` 更新。

### UI 文字

編輯器中所有使用者看得到的文字都是 `lib/dictionary.ts` 的 key，以 `useMessage` 讀取，讓 `dictionary` prop 可以覆寫。不要寫死文字。

### 資安

`CLAUDE.md` 的 Security rules 是必守規則，重點如下：

- 不新增 `dangerouslySetInnerHTML`。
- richtext 只以 Tiptap JSON 儲存，只透過共用渲染器（`renderRichText`、`RichTextContent`）輸出。
- 新增 Tiptap extension 時，同一個變更中要加上渲染 mapping 與屬性驗證。
- 執行期注入的 `<style>` 都要帶 CSP nonce。
- 頁面資料存檔前一律經過整頁驗證器（`@tzuchi/tceditor-blocks/validator`）；公開頁不得載入編輯器程式。

### Commit

- 使用 [Angular 風格的 conventional commits](https://github.com/angular/angular.js/blob/master/DEVELOPERS.md#-git-commit-guidelines)，訊息用英文，例如 `fix(richtext): …`、`feat: …`、`docs: …`。
- `git add` 時明確列出路徑，不要把不相關的檔案一起提交。

### 公開 API

`packages/core/bundle/core.ts` 匯出的一切都是公開 API。新增或修改公開 API 要特別審慎，並在 `CHANGELOG.md` 註明；不相容的變更標成 `**breaking:**`。

### 依賴

- 新增或升級依賴後，一併提交 `pnpm-lock.yaml`，並以 `pnpm install --frozen-lockfile` 確認一致。
- `@tiptap/*` 全部釘在同一個精確版本，要升級就一起升。
- S2 起新增的依賴一律寫精確版本（不加 `^`）；zod 鎖在 4.6.5。
- `pnpm-workspace.yaml` 的 `onlyBuiltDependencies`、`ignoredBuiltDependencies` 與 `overrides` 保持最少，每一項都要註解原因；為了修補漏洞而加的 override 要註明 GHSA 編號（例如 `yaml`），其他原因的 override 寫明原因即可（例如鎖定單一版本的 `zod`）。

## 移植上游的修正

tceditor 不再同步上游。上游的 bug 修正若值得移植：

```sh
git fetch upstream
git cherry-pick -x <commit>
```

`-x` 會在 commit 訊息記錄來源。衝突太大時改為手動重做，並在 commit 訊息註明來源 commit。完成後在 `CHANGELOG.md` 記錄。remote `upstream` 只用於讀取，無法推送。

## 發佈

目前所有套件與 app 都標為 `private`，不發佈到任何 registry，monorepo 內以 `workspace:*` 取用。發佈方式等 repo 與 CI 平台決定後再定；uikit 的套件在 S3 部署前改從 GitLab Package Registry 安裝。
