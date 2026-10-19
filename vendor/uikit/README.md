# vendor/uikit

慈濟 uikit（`puck-tzuchi-poc` repo，分支 `spike/heroui-v3`）在固定 commit 的部分快照，由 `packages/blocks` 以 `link:` 使用。來源 commit 記在 `SOURCE.json` 的 `commit`（目前是 `2b5a6781f4a4180346550f7b5255126dafb8be85`）。

| 路徑 | 套件 | 內容 |
|---|---|---|
| `heroui/styles` | `@heroui/styles` | HeroUI v3 的樣式函式（tailwind-variants）與 CSS，含慈濟主題 `themes/tzuchi` |
| `packages/tokens` | `@tzuchi/tokens` | 慈濟設計 token；`dist/` 是同步時用 style-dictionary 4.4.0 建出來的 |
| `heroui/LICENSE`、`heroui/NOTICE.md` | — | HeroUI 原始碼的授權與 uikit 的修改說明 |

## 授權

HeroUI 原始碼採用 Apache License 2.0（`heroui/LICENSE`）。`@heroui/*` 的 `package.json` 寫的是 MIT，以 LICENSE 檔為準。依 Apache-2.0 第 4 條：

- `heroui/LICENSE` 與 `heroui/NOTICE.md` 必須和程式碼一起保留；
- uikit 對上游的修改記在 `heroui/NOTICE.md`；
- 同步時移除的檔案列在 `SOURCE.json` 的 `removed`，移除規則與理由在 `scripts/uikit/sync-uikit.mjs` 的 `REMOVE_RULES`。

## 不要手動修改

這個目錄只能由同步腳本改寫。`pnpm test` 會比對每個檔案與 `SOURCE.json` 記錄的 sha256。要換成 uikit 的另一個 commit 時，執行：

```sh
pnpm sync:uikit -- --dir ../puck-tzuchi-poc --commit <sha>
```

腳本只用 `git archive` 讀取 uikit repo 的指定 commit，不修改 uikit，也不會帶入尚未 commit 的修改。它依序做這些事：

1. 確認這個目錄只有 `heroui`、`packages`、`README.md` 與 `SOURCE.json`，有其他檔案就拒絕執行（否則它們會被當成快照記進 `SOURCE.json`）；
2. 在暫存目錄 `vendor/.sync-uikit-*` 取出 `heroui/styles`、`heroui/LICENSE`、`heroui/NOTICE.md` 與 `packages/tokens`；
3. 移除 `REMOVE_RULES` 列的檔案；
4. 建出 tokens 並檢查；
5. 確認沒有檔案會被 `.gitignore` 忽略，否則 clone 下來的 repo 會少檔案；
6. 刪除整個 `heroui` 與 `packages`，換成暫存目錄的內容；
7. 重寫 `SOURCE.json`（含 `--branch` 指定的分支）；
8. 重新產生 `packages/blocks/generated/uikit-options.json`。

前五步失敗時，這個目錄不會被改動，暫存目錄也會刪掉。同步完成後，檢查 `git diff`，再把 `vendor/uikit` 與 `uikit-options.json` 一起 commit。

`style-dictionary` 固定在 uikit 使用的 4.4.0。它有 GHSA-vj5c-m527-mpff（high，`convertTokenData` 的 prototype pollution），但只在 `pnpm sync:uikit` 時讀這個固定 commit 的 token JSON，不會出貨，所以 `pnpm audit:gate` 只列出、不擋。uikit 升級 style-dictionary 時，這裡一起升。

`pnpm audit` 不檢查 `link:` 進來的套件，所以 `@heroui/styles` 與 `@tzuchi/tokens` 本身不在 `pnpm audit:gate` 的稽核範圍內。pnpm 也不會替 `link:` 套件安裝依賴，`@heroui/styles` 的執行期依賴（`tailwind-variants`、`tw-animate-css`）因此由 `packages/blocks` 自己宣告，照常稽核（`scripts/audit-gate-lib.test.mjs` 會檢查兩邊的版本一致）；`@tzuchi/tokens` 沒有執行期依賴。HeroUI 本身的 advisory 要人工追蹤，直到 S3 改從 registry 安裝。

## 之後

S3 部署前改從 GitLab Package Registry 安裝 uikit 的套件，屆時刪除這個目錄。
