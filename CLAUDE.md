# CLAUDE.md

這份是 Claude Code 在這個 repository 的規則，加上下面匯入的 `docs/rules/`。如果你電腦上的其他 Claude Code 設定和這裡衝突，在這個 repository 裡以這裡為準。回應共編者一律用繁體中文（台灣用語）；程式碼、指令和專有名詞維持原文。

## 共編規則（每次修改前必讀，必須遵守）

美編（設計）、工程、廠商都透過 Claude Code 修改這個 repository。完整的共編規則在 `docs/rules/`，下面幾行會把它們自動載入每一個 Claude Code 工作階段：

- @docs/rules/README.md
- @docs/rules/01-co-editing-sop.md
- @docs/rules/02-design-rules.md
- @docs/rules/03-component-rules.md
- @docs/rules/04-handbook-rules.md

整體規格在 `docs/specs/2026-11-16-cis-uikit-overall-spec.md`，元件路線圖在 `docs/component-roadmap.md`。文件之間不一致時，以 `docs/rules/` 為準（順序見 `docs/rules/README.md`）。

最重要的規則（完整版在 `docs/rules/`）：

1. **必須**從遠端最新的 `main` 開新分支再改：`tokens/<簡稱>`、`docs/<簡稱>`、`components/<簡稱>`、`theme/<主題 id>-<簡稱>`；不在 `main` 上改（R-S-07、R-S-08）。
2. **必須**在動手前問設計需求屬於第一級、第二級、第三級還是不適用，並寫進 PR（R-D-30）。
3. **必須**一起更新所有用到它的地方，跑完檢查，開本機預覽，並說出要看的頁面、主題和色彩模式（R-S-09 到 R-S-13）。
4. **必須**等共編者明確確認才 commit；推功能分支、開 PR，PR 照 `.github/pull_request_template.md` 用白話寫五段（R-S-14 到 R-S-16）。
5. **必須**照固定用詞：「主題」只指 Default、Green Natural 這種有名字的外觀設定（一個網站選用一個主題）；淺色／深色叫色彩模式；人員只寫職稱，唯一的例外是手冊裡用廠商的公司名稱「致遠」（專案負責人的決定）（R-D-01 到 R-D-03、R-D-34）。
6. **必須**做到無障礙：文字對比至少 4.5:1、鍵盤操作看得到焦點、互動元素有標籤；介面文字用繁體中文（R-D-14、R-C-14 到 R-C-18）。
7. **不可**合併或核可 PR、部署、推 `main`、推 tag、force push；不論誰要求都不做（R-S-20 到 R-S-22、R-S-46）。
8. **不可**在改名保護完成前改名或刪除 token；**不可**改名或刪除用過的變體名稱；**不可**為某個網站複製一份元件（R-S-23 到 R-S-25）。
9. **不可**自行安裝相依套件；工程同意後用 `pnpm add`／`pnpm update`，版本發布滿 14 天、寫精確版本（R-S-26）。
10. **不可**載入第三方資源（外部字型、腳本、圖片、CDN、分析、遙測）（R-S-27）。
11. **不可**在 repository 裡寫姓名、電子郵件、內部主機名稱、本機路徑或祕密；不讀取、不印出、不 commit `.env`、金鑰或登入資訊。這個 repository 是公開的（R-S-28、R-S-47）。
12. **先停下來問**：分不清第幾級、需要新的 token 名稱、改到 `heroui/` 的原始檔、CI 或工具的修改、任何 repository 以外的事（`docs/rules/01-co-editing-sop.md` 第 4 節）。

共編者的要求和規則衝突時：說明是哪一條規則、為什麼有這條規則，請他找專案負責人決定。不默默照做，也不默默拒絕；專案負責人的決定要寫成規則的修改、經 PR 合併後才生效。

## 1. 地圖與常用指令

這是慈濟 CIS UIKit：所有慈濟網站共用的一套 kit，包含 design tokens 的唯一來源，加上 HeroUI v3 的慈濟主題。pnpm 10.26.1 + turbo 的 monorepo，Node 22.22 以上。

GitHub repository：`https://github.com/tzuchi-digital/CIS`（公開）。`origin` 不是這個網址時，Claude 不推分支，先問工程（R-S-44）。

| 目錄                                                                        | 內容                                                                                                                                                                                                                         |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/tokens`                                                           | **tokens 的唯一來源**。`src/**/*.tokens.json`（DTCG 格式）由 Style Dictionary（`build.mjs`）產生 `dist/tokens.css` 等檔案；`check.mjs` 檢查產物                                                                              |
| `heroui/`                                                                   | vendored 的 HeroUI v3 原始碼和慈濟主題（`heroui/styles/themes/tzuchi`，`variables.css` 由 `generate.mjs` 從 tokens 產生）。修改規則見 `heroui/NOTICE.md`                                                                     |
| `heroui/storybook`                                                          | 給工程師看的元件展示頁（Storybook）                                                                                                                                                                                          |
| `apps/docs`                                                                 | 給一般讀者看的手冊（Astro Starlight）：首頁、文件、元件、範本、主題五個區域，頁首有主題選單和色彩模式按鈕。手冊的資料在 `src/data/`，手冊用的元件在 `src/components/handbook/`；做到哪裡見 `docs/rules/04-handbook-rules.md` |
| `docs/rules`                                                                | 共編規則（上面已匯入）                                                                                                                                                                                                       |
| `scripts/ci`                                                                | 舊的自架 GitLab CI 用的腳本                                                                                                                                                                                                  |
| `scripts/dev`                                                               | 本機預覽的啟動腳本（只綁 127.0.0.1）                                                                                                                                                                                         |
| `packages/components`、`packages/react`、`apps/storybook`、`apps/demo-html` | 舊的 Lit Web Components，**已凍結，不修改**；root 的 `build`、`test` 不包含它們                                                                                                                                              |

常用指令（在 repository 根目錄執行）：

```sh
pnpm install --frozen-lockfile     # 第一次和 lockfile 變更之後
pnpm build                         # 建置 tokens（packages/tokens/dist）
pnpm --filter @tzuchi/tokens test  # tokens 的建置和 check.mjs
pnpm run heroui:theme              # 從 tokens 重新產生慈濟主題的 variables.css
pnpm run heroui:storybook          # Storybook http://127.0.0.1:6007
pnpm run docs:dev                  # 手冊 http://127.0.0.1:4321
pnpm run heroui:storybook:build    # 建置 Storybook
pnpm run docs:build                # 建置 tokens 和手冊（經過 astro.mjs，關掉遙測）；第一次先建 Lit 元件，見 R-S-11
pnpm run test:scripts              # scripts/ 的 node:test 測試
pnpm lint                          # eslint 和 prettier --check
```

Astro 的指令一律經過 `scripts/dev/astro.mjs` 或 `scripts/dev/docs.mjs`，它們會關掉 Astro 的遙測和更新檢查。

## 2. 細節在哪裡

下面這些事的完整規則都在 `docs/rules/`，這裡只列位置：

| 事情                                                                                                                                       | 規則                                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| 五個步驟、分支名稱、推之前的檢查（含 `git add` 之後的 `variables.css` 同步檢查）、預覽和停掉自己開的程序                                   | `01-co-editing-sop.md` 第 2 節（R-S-05 到 R-S-17、R-S-42 到 R-S-47） |
| 不跑 `@heroui/*` 的 `lint`，改跑它們的 `typecheck`                                                                                         | R-S-11                                                               |
| 不部署、不執行 `wrangler` 或任何 `publish`；`.gitlab-ci.yml` 是舊的自架 GitLab 流程                                                        | R-S-21                                                               |
| 不刪除、不改名 token；基礎 Foundations 只新增                                                                                              | R-D-06、R-D-09 到 R-D-11                                             |
| 變體名稱不可改，新變體依用途命名                                                                                                           | R-D-21 到 R-D-23                                                     |
| 主題與色彩模式只設在 `<html>`（今天是 `data-theme="tzuchi"`／`"tzuchi-dark"`）                                                             | R-D-16                                                               |
| `heroui/` 的修改標 `LOCAL CHANGE` 並列入 `heroui/NOTICE.md`（JSON 不能加註解，只記在清單裡）；改之前先問工程；我們的新元件不放進 `heroui/` | `03-component-rules.md` 第 3 節                                      |
| `heroui/MAINTAINING.md` 不隨 Storybook 提供，但一樣公開                                                                                    | R-S-28                                                               |
| `drill/*` 分支不推                                                                                                                         | R-S-31                                                               |
| 凍結的 Lit 元件不修改                                                                                                                      | R-S-30                                                               |

`.claude/settings.json` 的 deny 規則只是防止手滑，不是安全邊界；換個寫法繞過它，一樣違反規則（R-S-32）。commit 訊息和 PR 標題不用 publish 這個字，否則整個指令會被擋下（R-S-15）。GitHub Actions 的 CI 還沒有建立，本機檢查是今天唯一的關卡。
