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
