# 共編指南

這份指南寫給一起修改慈濟 CIS UIKit 的人：怎麼準備電腦，怎麼透過 Claude Code 修改 token、元件和手冊，改完怎麼讓負責的人看過再合併。

**必須遵守的共編規則在 [`docs/rules/`](docs/rules/README.md)。** Claude Code 每次開始工作都會自動讀到它們（`CLAUDE.md` 匯入了這些檔案），所以你不必記規則，用口語說要改什麼就好；但請先讀一次 [`docs/rules/01-co-editing-sop.md`](docs/rules/01-co-editing-sop.md)，知道 Claude 會怎麼做、什麼事它會先停下來問你。

要做哪些元件、目前做到哪裡，看 [`docs/component-roadmap.md`](docs/component-roadmap.md)。

## 角色與核可

| 角色         | 負責                                                   | 核可                                                 |
| ------------ | ------------------------------------------------------ | ---------------------------------------------------- |
| 美編（設計） | token 的名稱和值、命名規則、元件的外觀、手冊的設計內容 | token 的名稱與值、命名規則、元件的外觀、手冊設計內容 |
| 工程         | 建置、CI、工具、依賴套件、元件程式碼                   | 建置、CI、工具、依賴套件、元件程式碼                 |
| 廠商         | 用同一套流程參與共編，分工由專案負責人另訂             | —                                                    |
| 專案負責人   | 待決定事項、角色分工、合併權限、路線圖的批次           | 共編規則和整體規格的修改、路線圖的批次調整           |
| Claude Code  | 修改檔案、在本機跑檢查和預覽、commit、推分支、開 PR    | 不核可，**不合併**                                   |

- 每個修改都經過 GitHub 的 PR（pull request），由負責的角色核可，再由有合併權限的人用 merge commit 合併。`main` 不能直接修改。
- 一個 PR 同時改到兩類內容時，兩個角色都要核可。
- GitHub Actions 的 CI 還沒有建立。在那之前，Claude Code 在你電腦上跑的檢查就是合併前唯一的關卡。

## 電腦準備

第一次可以請 Claude Code 協助安裝。

1. 一個 GitHub 帳號，並能推分支到本 repository、開 PR（repository 的網址和權限請問工程）。
2. Node 22.22 以上。目前建議 Node 24，也可以用 Node 26。
3. 用 corepack 安裝 pnpm：`corepack enable pnpm`。版本由 `package.json` 的 `packageManager` 決定，corepack 會檢查它的雜湊。Node 25 起不再內建 corepack，用 Node 26 時先執行 `npm install -g corepack`。
4. 安裝 Claude Code。
5. GitHub CLI（`gh`）可以讓 Claude Code 直接開 PR；每台電腦要不要裝，由工程決定。沒有裝的話，Claude Code 會給你網址，在瀏覽器裡開 PR。

clone 之後，在 repo 根目錄執行：

```sh
pnpm install
pnpm --filter @tzuchi/tokens build
```

第二行先建一次 tokens：產物在 git 忽略的 `packages/tokens/dist/`，手冊要讀它。

## 一次修改的流程

1. **說要改什麼**：在 repo 目錄開 Claude Code，用口語說要改什麼。例如：「次要文字的灰色太淺了，調深一點」「卡片要多一種『精選』樣式」「把路線圖的 R-010 改成設計中」。設計需求，Claude 會先問你這屬於第幾級（只有顏色等數值不同、同一個元件換排列、還是別的網站沒有的新東西）。
2. **Claude 修改**：Claude 先抓最新的 `main`，開一條新分支（`tokens/…`、`docs/…`、`components/…`、`theme/<網站>-…`），照 `docs/rules/` 修改，並一起更新所有用到它的地方。
3. **Claude 檢查並開預覽**：Claude 在你的電腦上跑檢查（tokens 的建置和檢查、主題同步、測試和格式），開本機預覽，告訴你要看哪幾頁、要選哪個網站主題和色彩模式。你確認，或請 Claude 再改。
4. **確認後開 PR**：你確認後，Claude commit、推分支並開 PR。推之前 Claude Code 會問你一次，請確認後再允許。PR 說明用白話寫：改了什麼、哪些畫面會變、請看哪幾頁、屬於哪一級、檢查結果。
5. **核可與合併**：負責的角色在 GitHub 上看過並核可，再由有合併權限的人合併。Claude Code 不合併、不部署、不推 `main`、不推 tag。

- 合併後，如果改到 token 或 HeroUI 的樣式，合併的人告訴頁面編輯器（tceditor）的維護者，由他們同步。
- 部署目標還沒決定；合併後目前不會自動更新任何網站。
- 你的要求和規則衝突時，Claude 會說明是哪一條規則，請你找專案負責人決定。規則本身也可以改：照同樣的流程開 PR，由專案負責人核可。

更多「可以這樣跟 Claude 說」的例子，見 [`docs/rules/01-co-editing-sop.md`](docs/rules/01-co-editing-sop.md) 第 5 節。

## 本機預覽

```sh
pnpm run docs:dev           # 手冊：http://127.0.0.1:4321
pnpm run heroui:storybook   # Storybook（元件樣品室）：http://127.0.0.1:6007
```

- 兩者分開跑，所以本機手冊上連到 `/storybook/` 的連結會失效；Storybook 請直接開 http://127.0.0.1:6007。
- 只在自己的電腦上開（127.0.0.1），別人連不進來。
- 埠已經被占用時，腳本會直接停止並說明，不會換到別的埠。先停掉占用它的程序（如果是你開的），再重跑一次。
- 按 Ctrl+C 停止。

Windows 也用同樣的指令。
