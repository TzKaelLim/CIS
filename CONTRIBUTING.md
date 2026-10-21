# 共編指南

這份指南寫給一起修改慈濟 UIKit 的人：怎麼準備電腦，怎麼透過 Claude Code 改 token 和手冊，改完怎麼讓大家看過再合併。

## 角色與核可

| 角色         | 負責                                                | 核可                  |
| ------------ | --------------------------------------------------- | --------------------- |
| 子鈞（美編） | token 的名稱和值、命名規範、手冊的設計理念內容      | token 的修改          |
| 宇軒（工程） | 建置、CI、工具                                      | 建置、CI 和工具的修改 |
| 致遠（廠商） | 用同一套流程參與共編，分工另訂                      | —                     |
| Claude Code  | 修改檔案、在本機跑檢查和預覽、commit、推分支、開 MR | 不核可，**不合併**    |

- 每個修改都經過 MR，由核可人看過，再由有合併權限的人合併。
- CI 沒通過的 MR 不能合併。

## 電腦準備

第一次可以請 Claude Code 協助安裝。

1. 能登入 tcgitlab（`tcgitlab.tzuchi-org.tw`）的帳號，並能存取 `tzuchi/tzuchi-uikit`。
2. Node 22.22 以上。目前建議 Node 24；2026-10-28 之後也可以用 Node 26。
3. 用 corepack 安裝 pnpm：`corepack enable pnpm`。版本由 `package.json` 的 `packageManager` 決定，corepack 會檢查它的雜湊。Node 25 起不再內建 corepack，用 Node 26 時先執行 `npm install -g corepack`。
4. 安裝 Claude Code。

clone 之後，在 repo 根目錄執行：

```sh
pnpm install
pnpm --filter @tzuchi/tokens build
```

第二行先建一次 tokens：產物在 git 忽略的 `packages/tokens/dist/`，手冊要讀它。

## 一次修改的流程

1. 在 uikit 目錄開 Claude Code，用口語說要改什麼。例如：「把慈濟藍 900 改成 #1A2C56」「新增一個『成功』語意色」。
2. Claude 先抓最新的 `main`，開一條新分支（改 token 用 `tokens/<主題>`，改手冊用 `docs/<主題>`），照 `CLAUDE.md` 修改，必要時一起更新用到它的地方。
3. Claude 在你的電腦上跑檢查：tokens 的建置和檢查、主題同步、測試和格式。
4. Claude 開本機預覽，告訴你要看哪幾頁。你確認，或請 Claude 再改。
5. 你確認後，Claude commit、推分支並開 MR。推之前 Claude Code 會問你一次，請確認後再允許。MR 說明用白話寫「改了什麼、哪些畫面會變、要看哪幾頁」。
6. CI 在 MR 上跑完整的建置和檢查，MR 頁面會顯示結果。
7. 核可人看過後，由有合併權限的人合併。合併後 `main` 的 pipeline 會更新正式網站。
8. 合併的人通知 tceditor 的維護者同步 tceditor（MR 範本裡有這一項）。

## 本機預覽

```sh
pnpm run docs:dev           # 手冊：http://127.0.0.1:4321
pnpm run heroui:storybook   # 元件樣品室：http://127.0.0.1:6007
```

- 兩者分開跑，所以本機手冊上連到 `/storybook/` 的連結會失效；元件樣品室請直接開 http://127.0.0.1:6007。
- 只在自己的電腦上開（127.0.0.1），別人連不進來。
- 埠已經被占用時，腳本會直接停止並說明，不會換到別的埠。先停掉占用它的程序（如果是你開的），再重跑一次。
- 按 Ctrl+C 停止。

Windows 也用同樣的指令。
