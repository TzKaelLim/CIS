# CLAUDE.md

這份是 Claude Code 在這個 repo 的規則。共編者的電腦上沒有其他設定，所以這裡寫的（加上下面匯入的 `docs/rules/`）就是全部的規則。回應共編者一律用繁體中文（台灣用語）；程式碼、指令和專有名詞維持原文。

## 共編規則（每次修改前必讀，必須遵守）

美編（設計）、工程、廠商都透過 Claude Code 修改這個 repo。完整的共編規則在 `docs/rules/`，下面幾行會把它們自動載入每一個 Claude Code 工作階段：

- @docs/rules/README.md
- @docs/rules/01-co-editing-sop.md
- @docs/rules/02-design-rules.md
- @docs/rules/03-component-rules.md
- @docs/rules/04-handbook-rules.md

整體規格在 `docs/specs/2026-11-16-cis-uikit-overall-spec.md`，元件路線圖在 `docs/component-roadmap.md`。文件之間不一致時，以 `docs/rules/` 為準（順序見 `docs/rules/README.md`）。

最重要的規則（完整版在 `docs/rules/`）：

1. **必須**從遠端最新的 `main` 開新分支再改：`tokens/<題目>`、`docs/<題目>`、`components/<題目>`、`theme/<網站 id>-<題目>`；不在 `main` 上改。
2. **必須**在動手前問設計需求屬於第一級、第二級、第三級還是不適用，並寫進 PR（`docs/rules/02-design-rules.md` 第 7 節）。
3. **必須**一起更新所有用到它的地方，跑完第 4 節的檢查，開本機預覽，並說出要看的頁面、網站主題和色彩模式。
4. **必須**等共編者明確確認才 commit；推功能分支、開 PR，PR 照 `.github/pull_request_template.md` 用白話寫五段。
5. **必須**照固定用詞：「主題」只指網站主題；淺色／深色叫色彩模式；人員只寫職稱。
6. **必須**做到無障礙：文字對比至少 4.5:1、鍵盤操作看得到焦點、互動元素有標籤；介面文字用繁體中文。
7. **不可**合併或核可 PR、部署、推 `main`、推 tag。
8. **不可**在改名保護完成前改名或刪除 token；**不可**改名或刪除用過的變體名稱；**不可**為某個網站複製一份元件。
9. **不可**加發布未滿 14 天的套件版本，不自行安裝依賴；新增的依賴寫精確版本。
10. **不可**載入第三方資源（外部字型、腳本、圖片、CDN、分析、遙測）。
11. **不可**在 repo 裡寫姓名、電子郵件、內部主機名稱、本機路徑或祕密；不讀取、不印出、不 commit `.env`、金鑰或登入資訊。這個 repo 是公開的。
12. **先停下來問**：分不清第幾級、需要新的 token 名稱、改到 `heroui/` 的原始檔、CI 或工具的修改、任何 repo 以外的事（`docs/rules/01-co-editing-sop.md` 第 4 節）。

共編者的要求和規則衝突時：說明是哪一條規則、為什麼有這條規則，請他找專案負責人決定。不默默照做，也不默默拒絕。

## 1. 地圖與常用指令

這是慈濟 CIS UIKit：所有慈濟網站共用的一套 kit，包含 design tokens 的唯一來源，加上 HeroUI v3 的慈濟主題。pnpm 10.26.1 + turbo 的 monorepo，Node 22.22 以上。

| 目錄                                                                        | 內容                                                                                                                                                     |
| --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/tokens`                                                           | **tokens 的唯一來源**。`src/**/*.tokens.json`（DTCG 格式）由 Style Dictionary（`build.mjs`）產生 `dist/tokens.css` 等檔案；`check.mjs` 檢查產物          |
| `heroui/`                                                                   | vendored 的 HeroUI v3 原始碼和慈濟主題（`heroui/styles/themes/tzuchi`，`variables.css` 由 `generate.mjs` 從 tokens 產生）。修改規則見 `heroui/NOTICE.md` |
| `heroui/storybook`                                                          | 給工程師看的 Storybook（元件樣品室）                                                                                                                     |
| `apps/docs`                                                                 | 給一般讀者看的手冊（Astro Starlight）。新版手冊的目標見 `docs/rules/04-handbook-rules.md`                                                                |
| `docs/rules`                                                                | 共編規則（上面已匯入）                                                                                                                                   |
| `scripts/ci`                                                                | 舊的自架 GitLab CI 用的腳本                                                                                                                              |
| `scripts/dev`                                                               | 本機預覽的啟動腳本（只綁 127.0.0.1）                                                                                                                     |
| `packages/components`、`packages/react`、`apps/storybook`、`apps/demo-html` | 舊的 Lit Web Components，**已凍結，不修改**                                                                                                              |

常用指令（在 repo 根目錄執行）：

```sh
pnpm install                       # 第一次和 lockfile 變更之後
pnpm build                         # 建置 tokens（packages/tokens/dist）
pnpm --filter @tzuchi/tokens test  # tokens 的建置和 check.mjs
pnpm run heroui:theme              # 從 tokens 重新產生慈濟主題的 variables.css
pnpm run heroui:storybook          # Storybook http://127.0.0.1:6007
pnpm run docs:dev                  # 手冊 http://127.0.0.1:4321
pnpm run heroui:storybook:build    # 建置 Storybook
pnpm run test:scripts              # scripts/ 的 node:test 測試
pnpm lint                          # eslint 和 prettier --check
```

Astro 的指令一律經過 `scripts/dev/astro.mjs` 或 `scripts/dev/docs.mjs`，它們會關掉 Astro 的遙測和更新檢查。

## 2. 修改流程

完整的五個步驟在 `docs/rules/01-co-editing-sop.md`。重點：

1. 先 `git fetch origin`，從最新的 `origin/main` 開分支（名稱見上面第 1 條；建置與工具用 `build/<題目>`，工程同意後才開）。`<題目>` 是這次修改的題目，不是網站主題。
2. 修改，並一起更新使用端（例如主題對照表、手冊、Storybook、路線圖的 `.md` 和 `.json`）。
3. 跑第 4 節的檢查，用啟動腳本開預覽，告訴共編者要看哪幾頁、選哪個網站主題和色彩模式。
4. 共編者確認後 commit（英文 conventional commits，例如 `feat(tokens): …`），用 `git add <路徑>` 只加這次的檔案，再推分支並開 PR：

   ```sh
   git push -u origin <branch>
   gh pr create --base main --title "<標題>" --body-file <說明檔>   # 有 GitHub CLI 且已登入時
   ```

   沒有 `gh` 時，把 `git push` 印出的建立 PR 網址和寫好的說明交給共編者，在瀏覽器裡開。`origin` 不是本 repo 在 GitHub 上的位置時，先問工程。

5. PR 說明照 `.github/pull_request_template.md`，用白話寫「改了什麼、哪些畫面會變、請看哪幾頁、屬於哪一級、檢查結果」。預覽截圖只給共編者看，不附在 PR 上。

- **絕不 push 到 `main`，絕不合併或核可 PR，絕不推 tag。** 合併由有權限的人用 merge commit 做。
- 合併之前，分支要先 rebase 到最新的 `main` 並重跑檢查；rebase 後只用 `git push --force-with-lease` 推回同一條功能分支，先問共編者。
- commit 訊息和 PR 標題**不用 publish 這個字**：`.claude/settings.json` 的 deny 規則會擋下整個指令。
- GitHub Actions 的 CI 還沒有建立，第 4 節的本機檢查是今天唯一的關卡。

## 3. 絕對不做的事

- 從 shell 執行 `wrangler`（任何寫法都不行）或任何部署指令。部署目標還沒決定；`.gitlab-ci.yml` 是舊的自架 GitLab 流程，不修改它的部署流程。
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
- 記下自己開的程序的 PID，結束時只用 `kill <PID>` 停掉它；不用 `pkill`、`killall`，不依名稱結束程序，不停別人的程序。
- 不碰 3000 埠和它上面的程序。

## 5. 不刪除、不改名 token

改名保護（先棄用、後移除，由機器檢查）完成之前，不改任何 token 的名稱，也不刪除 token。有需要時先問美編（設計）和工程。新增 token、修改值可以照流程做；新的 token 名稱由美編（設計）確認。基礎 Foundations（`packages/tokens/src/primitive/`）只新增，不修改既有的值。

## 6. 變體名稱不可改

HeroUI 元件的 `tv` variant 名稱（例如 Button 的 `primary`、`secondary`、`outline`），以及我們日後新增的變體名稱，會存進網站和頁面編輯器（tceditor）的頁面資料。用過就不可改名或移除，只能新增。新增的變體依用途命名（「精選」，不是「大紅框」）。

## 7. 網站主題與色彩模式只設在 `<html>`

表示網站主題和色彩模式的屬性只設在 `<html>` 上，不設在其他元素。今天只有預設網站主題（慈濟入口網），HeroUI 慈濟主題用 `data-theme="tzuchi"`（淺色）和 `data-theme="tzuchi-dark"`（深色），把網站和色彩模式併在一個值裡；以後要用哪些屬性名稱，待決定。

## 8. 第三方請求

- 手冊零第三方請求：不載入外部字型、腳本、圖片或樣式。
- Storybook 不可新增任何外部資源。

## 9. vendored HeroUI

照 `heroui/NOTICE.md`：`heroui/` 裡的每一處修改都標 `LOCAL CHANGE`，並列入 `heroui/NOTICE.md` 的清單。JSON 不能加註解，只記在清單裡。改 HeroUI 的原始檔之前先問工程；我們自己的新元件不放進 `heroui/`（`docs/rules/03-component-rules.md` 第 3 節）。

`heroui/NOTICE.md` 會隨 Storybook 一起提供，只寫授權和修改清單。維護筆記（怎麼看上游的變更、主題稽核留下的待辦）寫在 `heroui/MAINTAINING.md`；它不隨 Storybook 提供，但這個 repo 是公開的，所以它一樣公開，不寫任何不能公開的內容。

## 10. 演練分支不可 push

`drill/*` 分支只在本機使用，不可 push。

## 凍結的 Lit

`packages/components`、`packages/react`、`apps/storybook`、`apps/demo-html` 已凍結：程式留在 repo，不修改，root 的 `build`、`test` 不包含它們。
