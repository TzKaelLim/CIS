# CLAUDE.md

這份是 Claude Code 在這個 repo 的規則。共編者的電腦上沒有其他設定，所以這裡寫的就是全部的規則。回應共編者一律用繁體中文。

## 1. 地圖與常用指令

這是慈濟的 UIKit：design tokens 的唯一來源，加上 HeroUI v3 的慈濟主題。pnpm 10.26.1 + turbo 的 monorepo，Node 22.22 以上。

| 目錄                                                                        | 內容                                                                                                                                                     |
| --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/tokens`                                                           | **tokens 的唯一來源**。`src/**/*.tokens.json`（DTCG 格式）由 Style Dictionary（`build.mjs`）產生 `dist/tokens.css` 等檔案；`check.mjs` 檢查產物          |
| `heroui/`                                                                   | vendored 的 HeroUI v3 原始碼和慈濟主題（`heroui/styles/themes/tzuchi`，`variables.css` 由 `generate.mjs` 從 tokens 產生）。修改規則見 `heroui/NOTICE.md` |
| `heroui/storybook`                                                          | HeroUI 元件樣品室（Storybook）                                                                                                                           |
| `apps/docs`                                                                 | 設計理念手冊（Astro Starlight）                                                                                                                          |
| `scripts/ci`                                                                | CI 用的腳本                                                                                                                                              |
| `scripts/dev`                                                               | 本機預覽的啟動腳本（只綁 127.0.0.1）                                                                                                                     |
| `packages/components`、`packages/react`、`apps/storybook`、`apps/demo-html` | 舊的 Lit Web Components，**已凍結，不修改**                                                                                                              |

常用指令（在 repo 根目錄執行）：

```sh
pnpm install                       # 第一次和 lockfile 變更之後
pnpm build                         # 建置 tokens（packages/tokens/dist）
pnpm --filter @tzuchi/tokens test  # tokens 的建置和 check.mjs
pnpm run heroui:theme              # 從 tokens 重新產生慈濟主題的 variables.css
pnpm run heroui:storybook          # 元件樣品室 http://127.0.0.1:6007
pnpm run docs:dev                  # 手冊 http://127.0.0.1:4321
pnpm run heroui:storybook:build    # 建置元件樣品室
pnpm run test:scripts              # scripts/ 的 node:test 測試
pnpm lint                          # eslint 和 prettier --check
```

Astro 的指令一律經過 `scripts/dev/astro.mjs` 或 `scripts/dev/docs.mjs`，它們會關掉 Astro 的遙測和更新檢查。

## 2. 修改流程

1. 先 `git fetch origin`，從最新的 `origin/main` 開分支：改 token 用 `tokens/<主題>`，改手冊用 `docs/<主題>`。
2. 修改，必要時一起更新使用端（例如主題對照表、手冊）。
3. 跑「推之前必跑的檢查」（第 4 節），用啟動腳本開預覽，告訴共編者要看哪幾頁。
4. 共編者確認後 commit（英文 conventional commits，例如 `feat(tokens): …`），再推分支並開 MR：

   ```sh
   git push -u origin <branch> -o merge_request.create -o merge_request.target=main -o merge_request.title="<標題>"
   ```

5. MR 說明照範本，用白話寫「改了什麼、哪些畫面會變、要看哪幾頁」。預覽截圖只給共編者看，不附在 MR 上。

- **絕不 push 到 `main`，絕不合併 MR。** 合併由有權限的人做。
- 合併之前，分支要先 rebase 到最新的 `main`。
- commit 訊息和 MR 標題**不用 publish 這個字**：`.claude/settings.json` 的 deny 規則會擋下整個指令。

## 3. 絕對不做的事

- 從 shell 執行 `wrangler`（任何寫法都不行）。部署只由 CI 做，見 `docs/superpowers/specs/2026-09-22-gitlab-ci-cloudflare-staging-design.md`。
- `changeset publish`、`npm publish`、`pnpm publish`。
- 讀取、印出或 commit 任何 `.env`、CI 變數、金鑰或登入資訊。
- 碰這個 repo 以外的目錄。

`.claude/settings.json` 的 deny 規則只是防止手滑，不是安全邊界；換個寫法繞過它，一樣違反這裡的規則。

## 4. 推之前必跑的檢查

```sh
pnpm --filter @tzuchi/tokens test
pnpm run heroui:theme && git diff --exit-code -- heroui/styles/themes/tzuchi/variables.css
pnpm run test:scripts
pnpm lint
```

- 改到 `heroui/` 時，加跑 `pnpm run heroui:storybook:build`。
- 不要跑 `@heroui/react`、`@heroui/styles`、`@heroui/storybook` 的 `lint`：`heroui/standard` 的 ESLint 設定要的套件沒有安裝，一定會以 `ERR_MODULE_NOT_FOUND` 失敗（見 `heroui/NOTICE.md` 的「Known state inherited from upstream」）。不要自行補裝這些套件；要檢查這三個套件就跑它們的 `typecheck`（`pnpm --filter @heroui/react typecheck` 等）。
- 全部通過才推。有失敗就先修好，或向共編者說明原因。

本機預覽：

- 只用 `pnpm run heroui:storybook`（6007）和 `pnpm run docs:dev`（4321）。它們只綁 127.0.0.1，埠被占用時會直接停止，不會換埠。
- 開之前先檢查埠有沒有被占用。
- 記下自己開的程序的 PID，結束時只用 `kill <PID>` 停掉它；不用 `pkill`、`killall`，不停別人的程序。
- 不碰 3000 埠和它上面的程序。

## 5. 不刪除、不改名 token

改名保護（先棄用、後移除）完成之前，不改任何 token 的名稱，也不刪除 token。有需要時先問使用者或宇軒。新增 token、修改值可以照流程做。

## 6. HeroUI 的 `tv` variant 名稱不可改

HeroUI 元件的 `tv` variant 名稱（例如 Button 的 `primary`、`secondary`、`outline`）會存進 tceditor 的頁面資料。不可改名或移除。

## 7. 主題只能設在 `<html>`

`data-theme`（例如 `tzuchi`、`tzuchi-dark`）只設在 `<html>` 上，不設在其他元素。

## 8. 第三方請求

- 手冊零第三方請求：不載入外部字型、腳本、圖片或樣式。
- 元件樣品室不可新增任何外部資源。

## 9. vendored HeroUI

照 `heroui/NOTICE.md`：`heroui/` 裡的每一處修改都標 `LOCAL CHANGE`，並列入 `heroui/NOTICE.md` 的清單。JSON 不能加註解，只記在清單裡。

`heroui/NOTICE.md` 會隨元件樣品室公開，只寫授權和修改清單。維護筆記（怎麼看上游的變更、主題稽核留下的待辦）寫在不公開的 `heroui/MAINTAINING.md`。

## 10. 演練分支不可 push

`drill/*` 分支只在本機使用，不可 push。

## 凍結的 Lit

`packages/components`、`packages/react`、`apps/storybook`、`apps/demo-html` 已凍結：程式留在 repo，不修改，root 的 `build`、`test` 不包含它們。
