# 慈濟 CIS UIKit

所有慈濟網站共用的一套 UIKit：顏色、字級、間距這些設計數值（design tokens）的唯一來源，加上 HeroUI v3 的慈濟主題、元件展示頁和給一般讀者看的手冊。

美編（設計）、工程和廠商都透過 Claude Code 修改這個 repository：用口語說要改什麼，由 Claude Code 照 [`docs/rules/`](docs/rules/README.md) 的規則修改、檢查、開預覽、開 PR。合併由人來做。

## 線上預覽

| 網站                                     | 給誰看                                    |
| ---------------------------------------- | ----------------------------------------- |
| <https://cis-uikit.pages.dev>            | 手冊：給一般讀者看的設計說明              |
| <https://cis-uikit.pages.dev/storybook/> | Storybook：給工程師看的 HeroUI 元件展示頁 |

這個網站是手動上傳的預覽，內容可能比 `main` 舊。正式的部署方式還沒有決定。

## 從哪裡開始

| 你想做的事                          | 先看這裡                                                                                                                         |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 了解這套 UIKit 有什麼、怎麼用       | 手冊（上面的網址，或在自己的電腦上開本機預覽）                                                                                   |
| 修改顏色、文字、元件或手冊          | [`CONTRIBUTING.md`](CONTRIBUTING.md)：電腦怎麼準備、一次修改的流程、可以怎麼跟 Claude Code 說                                    |
| 知道必須遵守哪些規則                | [`docs/rules/`](docs/rules/README.md)：共編流程、設計規則、元件規則、手冊規則                                                    |
| 知道整體的設計和還沒決定的事        | [`docs/specs/2026-11-16-cis-uikit-overall-spec.md`](docs/specs/2026-11-16-cis-uikit-overall-spec.md)                             |
| 知道要做哪些元件、做到哪裡          | [`docs/component-roadmap.md`](docs/component-roadmap.md)                                                                         |
| 讓 Claude 替你開 PR、讀核可人的意見 | 手冊的「在 Claude Desktop 連接 GitHub」（[原始檔](apps/docs/src/content/docs/docs/claude-desktop-github.mdx)）：十分鐘的設定教學 |
| 用 Claude Code 在這裡工作           | [`CLAUDE.md`](CLAUDE.md)：Claude Code 每次開始工作都會自動讀它                                                                   |

## 目錄

| 目錄                                                                        | 內容                                                                                            |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `packages/tokens`                                                           | **tokens 的唯一來源**：`src/**/*.tokens.json`（DTCG 格式），建置後產生 `dist/tokens.css` 等檔案 |
| `heroui/`                                                                   | 直接放進來的 HeroUI v3 原始碼，以及慈濟主題（`heroui/styles/themes/tzuchi`，由 tokens 產生）    |
| `heroui/storybook`                                                          | 給工程師看的元件展示頁（Storybook）                                                             |
| `apps/docs`                                                                 | 給一般讀者看的手冊（Astro Starlight）：首頁、文件、元件、範本、主題                             |
| `docs/rules`、`docs/specs`、`docs/component-roadmap.md`                     | 共編規則、整體規格、元件路線圖                                                                  |
| `scripts/dev`                                                               | 本機預覽的啟動腳本（只綁 `127.0.0.1`，並關掉遙測）                                              |
| `packages/components`、`packages/react`、`apps/storybook`、`apps/demo-html` | 舊的 Lit Web Components，**已凍結，不修改**；手冊的預覽和範本仍然用它們                         |
| `tceditor/`                                                                 | 頁面編輯器，連同修改歷史從另一個 repository 匯入；和這套 UIKit 的整合還沒有開始                 |

## 在自己的電腦上執行

需要 Node 22.22 以上，以及 pnpm（版本由 `package.json` 的 `packageManager` 決定，用 `corepack enable pnpm` 安裝）。完整的準備步驟在 [`CONTRIBUTING.md`](CONTRIBUTING.md) 的「電腦準備」。

```sh
pnpm install --frozen-lockfile        # 第一次，以及 lockfile 變更之後
pnpm --filter @tzuchi/tokens build    # 建置 tokens，手冊要讀它的產物
pnpm --filter @tzuchi/components build && git restore packages/components/custom-elements.json
                                      # 第一次才需要：手冊會載入凍結的 Lit 元件
pnpm run docs:dev                     # 手冊，http://127.0.0.1:4321
pnpm run heroui:storybook             # Storybook，http://127.0.0.1:6007
```

本機預覽只有自己的電腦打得開。

## 檢查

GitHub Actions 的自動檢查還沒有建立，所以推分支之前要在自己的電腦上跑完下面這些，全部通過才推：

```sh
pnpm --filter @tzuchi/tokens test     # tokens 的建置和檢查
pnpm run heroui:theme                 # 從 tokens 重新產生慈濟主題的 variables.css
pnpm run test:scripts                 # scripts/ 的測試
pnpm run docs:build                   # 建置 tokens 和手冊
pnpm lint                             # eslint 和 prettier --check
```

細節（例如改到 `heroui/` 時要加跑什麼）在 [`docs/rules/01-co-editing-sop.md`](docs/rules/01-co-editing-sop.md)。

## 怎麼參與修改

1. 從最新的 `main` 開一個新分支，不直接改 `main`。
2. 跟 Claude Code 說要改什麼；它會先問這個需求屬於哪一級（只改數值、多一個變體，還是新元件）。
3. Claude Code 修改、跑檢查、開本機預覽，告訴你要看哪幾頁。
4. 你確認之後，Claude Code 才存成 commit、推分支、開 PR。
5. 負責的角色核可，再由有權限的人合併。Claude Code 不合併、不核可、不部署。

手冊（`apps/docs`）的內容，美編（設計）、工程和廠商都可以修改，流程相同。

完整的說明在 [`CONTRIBUTING.md`](CONTRIBUTING.md)。這個 repository 是公開的：不寫姓名、電子郵件、內部主機名稱、本機路徑或任何祕密。

## 用詞

- **主題**：一組有名字的外觀設定。今天有 Default（預設）；Green Natural 是手冊裡的示意。一個網站選用一個主題，沒有指定就用 Default。
- **色彩模式**：淺色和深色。它和主題互相獨立，每個主題都有淺色和深色。
- **變體**：同一個元件的幾種設計。依用途命名，名稱用了就不改。
- **基礎 Foundations**：所有主題共用的顏色、字級、間距等基本值。

完整的用詞在手冊的「用詞」頁和 [`docs/rules/02-design-rules.md`](docs/rules/02-design-rules.md)。

## 目前狀態

已經有的：

- tokens 的原始檔、建置和檢查（`packages/tokens`）。
- HeroUI v3 的慈濟主題（淺色和深色）和 Storybook。
- 手冊：22 個元件頁、4 個示意範本、主題頁，以及頁首的主題選單和色彩模式按鈕。
- 共編規則、整體規格，以及 73 項的元件路線圖。

還沒有的：

- GitHub Actions 的自動檢查，以及正式的部署流程。
- Default 以外的主題的正式檔案（Green Natural 的顏色只寫在手冊裡，是示意值）。
- token 的改名保護。在它完成之前，token 不改名、不刪除。
- 路線圖上的新元件：要先有美編（設計）的設計才動工。
- `tceditor/` 和這套 UIKit 的整合。

## 授權

- `heroui/` 是 HeroUI 的原始碼，採用 Apache-2.0，見 [`heroui/LICENSE`](heroui/LICENSE) 和 [`heroui/NOTICE.md`](heroui/NOTICE.md)。我們對它的每一處修改都列在 `heroui/NOTICE.md`。
- `tceditor/` 是 Puck v0.23.0 的分支，採用 MIT，見該目錄裡的 `LICENSE` 和 `NOTICE`。
- 其餘的檔案還沒有附上授權條款。
