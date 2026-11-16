# 01 共編 SOP：一次修改怎麼做

這份 SOP 規定一次修改從開始到合併的每一步。每一個修改本 repository 的人、每一個 Claude Code 工作階段都必須照做。依據：整體規格第 4、5、11 節。

規則編號 R-S-xx。「Claude 必須」「Claude 不可」指的是 Claude Code。

## 1. 角色與核可

| 角色 | 負責 | 核可什麼 |
| --- | --- | --- |
| 美編（設計） | token 的名稱和值、命名規則、元件的外觀、手冊的設計內容 | token 的名稱與值、命名規則、元件的外觀、手冊的設計內容 |
| 工程 | 建置、CI、工具、依賴套件、元件程式碼 | 建置、CI、工具、依賴套件、元件程式碼、`heroui/` 原始檔的修改 |
| 廠商 | 用同一套流程參與共編；分工由專案負責人另訂 | 無（除非專案負責人另外指定） |
| 專案負責人 | 待決定事項、角色分工、誰有合併權限、路線圖的批次與排序 | 規則（`docs/rules/`）和整體規格的修改、路線圖的批次調整 |
| Claude Code | 修改檔案、在本機跑檢查和預覽、commit、推功能分支、開 PR | 不核可、不合併 |

- R-S-01　每個修改都經過 PR。`main` 受保護：只能經由 PR 修改，只能用 merge commit 合併（squash 和 rebase 合併已關閉），由人按合併。〔目標：GitHub 上的保護設定要設好才算完成〕
- R-S-02　一個 PR 改到兩類內容時（例如 token 的值和建置腳本），兩個角色都要核可。〔目標〕
- R-S-03　核可不等於合併。核可由負責的角色做；合併由有合併權限的人做。今天核可只是約定，沒有用 CODEOWNERS 強制（待決定）。〔部分〕
- R-S-04　文件、PR、commit 和 repo 裡的任何檔案，人員只寫職稱（美編（設計）、工程、廠商、專案負責人），不寫姓名。〔目標〕

## 2. 五個步驟

下面每一步先寫共編者做什麼，再寫 Claude 必須做什麼。

### 步驟 1：說要改什麼

共編者在 repo 目錄開 Claude Code，用口語說要改什麼。

Claude 必須：

1. 先用一兩句話複述它理解的需求，請共編者確認。
2. 判斷這是哪一類修改：token、手冊或文件、元件、某個網站的網站主題、建置與工具。
3. 是設計需求（外觀、排列、新功能）時，照 `02-design-rules.md` 第 7 節的問題，問共編者這是**第一級、第二級、第三級，還是不適用**。共編者不確定時，Claude 說明理由並建議一級，由共編者決定。（R-S-05）
4. 是元件時，先找它在 `docs/component-roadmap.md` 的那一列（`03-component-rules.md` 第 1 節）。
5. 遇到第 4 節列的情況，先停下來問，不動手。

### 步驟 2：Claude 開分支並修改

Claude 必須：

1. 先看 `git status`。工作目錄有還沒 commit 的修改時，問共編者怎麼處理；不自行 `git stash`、`git reset`、`git clean` 或丟棄任何修改。（R-S-06）
2. 確認 `origin` 是本 repository 在 GitHub 上的位置；不是的話，先停下來問工程。
3. 從遠端最新的 `main` 開一條新分支（R-S-07）：

   ```sh
   git fetch origin
   git switch -c <分支名稱> origin/main
   ```

   不在 `main` 上修改，也不沿用別人的分支。

4. 分支名稱照下表（R-S-08）。`<題目>` 用小寫英文和連字號，簡短說明這次改什麼；這裡的「題目」不是「網站主題」。

   | 修改的類別 | 分支名稱 | 例子 |
   | --- | --- | --- |
   | token 的值、新增 token | `tokens/<題目>` | `tokens/muted-text-contrast` |
   | 手冊、文件、路線圖、規則 | `docs/<題目>` | `docs/roadmap-carousel-status` |
   | 元件 | `components/<題目>` | `components/carousel` |
   | 某個網站的網站主題 | `theme/<網站 id>-<題目>` | `theme/eco-button-radius` |
   | 建置、CI、工具（工程同意後才開） | `build/<題目>` | `build/ci-checks` |
   | 規則本身 | `docs/rules-<題目>` | `docs/rules-branch-names` |

5. 修改時，一起更新所有用到它的地方（R-S-09）：
   - 改了 token，就執行 `pnpm run heroui:theme` 重新產生 `heroui/styles/themes/tzuchi/variables.css`，並檢查手冊和 Storybook 裡用到它的地方。
   - 改了路線圖，`docs/component-roadmap.md` 和 `docs/component-roadmap.json` 一起改，內容一致。
   - 做了元件，照 `03-component-rules.md` 的完成條件。
   - 任何一處沒改到而會壞掉，就不算完成。
6. 不手改產生的檔案：`heroui/styles/themes/tzuchi/variables.css`、`packages/tokens/dist/`。（R-S-10）

### 步驟 3：Claude 檢查並開本機預覽

Claude 必須：

1. 跑下列檢查，全部通過才往下走（R-S-11）：

   ```sh
   pnpm --filter @tzuchi/tokens test
   pnpm run heroui:theme && git diff --exit-code -- heroui/styles/themes/tzuchi/variables.css
   pnpm run test:scripts
   pnpm lint
   ```

   - 改到 `heroui/` 時，加跑 `pnpm run heroui:storybook:build`，以及改到的套件的 `typecheck`（例如 `pnpm --filter @heroui/react typecheck`）。
   - 不跑 `@heroui/react`、`@heroui/styles`、`@heroui/storybook` 的 `lint`：它們的 ESLint 設定缺少套件，一定會以 `ERR_MODULE_NOT_FOUND` 失敗（`heroui/NOTICE.md` 的「Known state inherited from upstream」）。也不自行補裝那些套件。
   - 有失敗就先修好；修不好就向共編者說明原因。不推檢查失敗的分支。
   - GitHub Actions 的 CI 還沒有建立，這些本機檢查就是今天唯一的關卡。
2. 開本機預覽（R-S-12）：
   - 只用 `pnpm run docs:dev`（手冊，`http://127.0.0.1:4321`）和 `pnpm run heroui:storybook`（Storybook，`http://127.0.0.1:6007`）。不直接跑 `apps/docs` 或 `heroui/storybook` 的 `dev` 指令。
   - 開之前先確認埠沒有被占用。被占用時啟動腳本會直接停止；Claude 告訴共編者，不換埠，不停掉別人的程序。
   - 記下自己開的程序的 PID，結束時只用 `kill <PID>` 停掉它；不用 `pkill`、`killall`，不依名稱結束程序。不碰 3000 埠和它上面的程序。
3. 告訴共編者要看哪幾頁（R-S-13）：
   - 給完整的本機網址。
   - 說明要選哪個網站主題、哪個色彩模式。今天只有預設網站主題（慈濟入口網）：Storybook 在工具列的 Theme 選單選「慈濟 Tzu Chi」（淺色）或「慈濟 Tzu Chi Dark」（深色）；手冊用 Starlight 自己的淺色／深色切換。
   - 改到顏色、網站主題或色彩模式相關的值時，淺色和深色都要看。
   - 手冊和 Storybook 分開跑，本機手冊上連到 `/storybook/` 的連結會失效；Storybook 請直接開 `http://127.0.0.1:6007`。
4. 預覽截圖只給共編者在自己電腦上看，不附在 PR 上。

### 步驟 4：共編者確認後，commit、推分支、開 PR

Claude 必須：

1. 等共編者明確說可以，才 commit。共編者沒確認，不 commit、不推分支。（R-S-14）
2. 用 `git add <路徑>` 只加這次修改的檔案；不用 `git add -A` 或 `git add .`，不加不是這次修改的檔案。
3. commit 訊息用英文 conventional commits（例如 `feat(tokens): darken the muted text colour`）。commit 訊息和 PR 標題都不用 `publish` 這個字：`.claude/settings.json` 的規則會擋下整個指令。（R-S-15）
4. 推功能分支：`git push -u origin <分支名稱>`。推之前 Claude Code 會再問一次，共編者確認後才允許。
5. 開 PR，目標是 `main`（R-S-16）：
   - 用共編者自己的 GitHub 帳號開。電腦上有 GitHub CLI 並已登入時，用 `gh pr create --base main --title "<標題>" --body-file <說明檔>`；沒有時，把 `git push` 印出的建立 PR 網址和寫好的說明交給共編者，在瀏覽器裡開。每台電腦要不要裝 `gh`，由工程決定〔提案，待工程確認〕。
   - PR 說明照 `.github/pull_request_template.md`，用白話寫這五段：**改了什麼**、**哪些畫面會變**、**請看哪幾頁**（含網站主題和色彩模式）、**屬於哪一級**（第一級／第二級／第三級／不適用，以及理由）、**檢查結果**。
   - 在說明裡寫出需要誰核可（美編（設計）、工程，或兩者）。
6. 開完 PR，把 PR 的網址告訴共編者。

### 步驟 5：核可與合併

- 負責的角色看過 PR 並核可，再由有合併權限的人用 merge commit 合併。
- 核可人要求修改時，回到步驟 2，在**同一條分支**上改，再走步驟 3、4（推到同一條分支，PR 會自動更新）。
- 合併之前，分支要先更新到最新的 `main`（`git fetch origin` 後 `git rebase origin/main`），並重跑步驟 3 的檢查。rebase 後的推送只用 `git push --force-with-lease`，而且只推到這條功能分支；要先得到共編者同意。（R-S-17）
- 合併後，如果改到 token 或 HeroUI 的樣式，合併的人告訴頁面編輯器（tceditor）的維護者；頁面編輯器自己同步 kit 的快照（整合已延後）。
- 部署目標還沒決定，合併後目前不會自動更新任何網站。

## 3. Claude 絕對不做的事

- R-S-20　不合併 PR，也不替任何人核可 PR（不執行 `gh pr merge`、`gh pr review --approve` 或同等的操作）。
- R-S-21　不部署：不從 shell 執行 `wrangler`（任何寫法都不行）或任何部署指令；不執行 `changeset publish`、`npm publish`、`pnpm publish`。`.gitlab-ci.yml` 是舊的自架 GitLab 流程，不修改它的部署流程。
- R-S-22　不推 `main`，不在 `main` 上 commit；不推 tag，不建 release。
- R-S-23　改名保護（先棄用、後移除，由機器檢查）完成之前，不改任何 token 的名稱，也不刪除 token。（`02-design-rules.md` R-D-09）
- R-S-24　不改名、不刪除任何已經用過的變體名稱，包括 HeroUI 元件的 `tv` variant 名稱。（R-D-21）
- R-S-25　不為某個網站複製一份元件（例如「環保網的按鈕」）。（R-D-31）
- R-S-26　不加發布未滿 14 天的套件版本；不自行安裝新依賴或補裝缺少的套件，需要時說明理由，由工程決定；新增的依賴寫精確版本（不寫 `^`、`~`）。lockfile 的變更和造成它的 `package.json` 變更放在同一個 commit。
- R-S-27　不載入第三方資源：外部字型、腳本、樣式、圖片、CDN、分析、遙測都不行，交付的頁面和開發工具都一樣。
- R-S-28　不在 repo 裡寫個人姓名、電子郵件、內部主機名稱、本機路徑（例如某台電腦上的使用者目錄）或任何祕密。不讀取、不印出、不 commit `.env`、CI 變數、金鑰或登入資訊。這個 repository 是公開的，放進去的每個檔案任何人都看得到。
- R-S-29　不碰這個 repo 以外的目錄。
- R-S-30　不修改凍結的舊 Lit 元件：`packages/components`、`packages/react`、`apps/storybook`、`apps/demo-html`。
- R-S-31　不推 `drill/*` 分支（只在本機演練用）。
- R-S-32　不繞過 `.claude/settings.json` 的規則。那些規則只是防止手滑，不是安全邊界；換個寫法繞過它，一樣違反這份 SOP。

## 4. 遇到這些情況先停下來問

遇到下列情況，Claude 先停下來，說明情況和它的建議，等對方回答再動手。（R-S-40）

| 情況 | 問誰 |
| --- | --- |
| 分不清是第一級、第二級、第三級還是不適用，共編者也不確定 | 共編者；共編者仍不確定時，請他問美編（設計） |
| 需要一個新的 token 名稱 | 美編（設計）確認名稱（Claude 可以照現有的命名方式提一個建議） |
| 需要改基礎 Foundations 既有的值（例如發現基礎值抄錯） | 美編（設計）；「更正」的例外還沒有決定（整體規格 Q8） |
| 有人要求改名或刪除 token、改名或刪除變體 | 說明目前不允許（R-S-23、R-S-24），建議把需求交給美編（設計）列入日後的命名規範；不自行修改 |
| 需要某個網站的網站主題或網站設定檔（`packages/tokens/src/sites/` 還沒有實作） | 工程 |
| 要改 `heroui/` 裡 HeroUI 的原始檔（`LOCAL CHANGE`） | 工程 |
| 要新增我們自己的元件，但放元件的位置（`packages/ui`）還沒有確認 | 工程 |
| CI、建置或工具的修改：`package.json` 的 scripts 或依賴、`pnpm-lock.yaml`、`pnpm-workspace.yaml`、`turbo.json`、ESLint／Prettier 設定、`scripts/`、`.github/workflows/`、`.gitlab-ci.yml`、`.claude/settings.json` | 工程 |
| 需要新的依賴套件，或要升級套件 | 工程 |
| 要改 `docs/rules/` 或整體規格 | 專案負責人 |
| 元件不在路線圖上，或要把待辦清單的項目提前 | 專案負責人 |
| 任何在這個 repository 以外的事（別的專案、別的資料夾、線上服務、帳號設定） | 共編者；Claude 不自己去做 |
| 共編者的要求和規則衝突 | 說明是哪一條規則、為什麼，請共編者找專案負責人決定；不默默照做，也不默默拒絕 |
| 檢查失敗，而且找不出原因 | 工程 |

## 5. 你可以這樣跟 Claude 說

不必記指令，用口語說就好。下面是一些例子，以及 Claude 會怎麼回應。

**美編（設計）**

- 「次要文字的灰色太淺了，幫我調深一點，白底對比要到 4.5:1。先給我看預覽。」
  → Claude 開 `tokens/muted-text-contrast`，建議讓 `color.text.muted` 改指向已有的較深灰色（改語意色，不改基礎值），跑檢查、開預覽，告訴你要看哪幾頁的淺色和深色。
- 「卡片要多一種『精選』樣式，用在首頁最上面那一則。」
  → Claude 問你這是第二級（同一個元件的變體）嗎，確認名稱依用途命名（「精選」`featured`），再看路線圖的 Card 那一列。
- 「環保網的按鈕要比入口網更圓。」
  → Claude 判斷是第一級（只有 CSS 值不同），並告訴你：網站主題的檔案還沒有實作，要先請工程確認做法。

**工程**

- 「幫我把所有推之前的檢查跑一遍，告訴我哪裡沒過。」
- 「Storybook 的 Theme 選單要拆成『網站主題』和『色彩模式』兩個。」
  → Claude 說明這要改 `heroui/` 的原始檔（`LOCAL CHANGE`），確認你同意後，開 `build/storybook-site-and-mode-toolbars`，改完把修改記進 `heroui/NOTICE.md`。
- 「想把 Style Dictionary 升級，先幫我查新版本發布滿 14 天沒有，列出要改哪些檔案，先不要動。」

**廠商**

- 「我要開始做路線圖上的 R-011 Carousel，告訴我開工前要準備什麼。」
  → Claude 列出路線圖那一列、要先有美編的設計、元件放哪裡還待工程確認，以及完成條件。
- 「把 R-010 PageControl 的狀態改成『設計中』。」
  → Claude 開 `docs/roadmap-page-control-status`，同時改 `component-roadmap.md` 和 `.json`。
- 「這個按鈕的英文 variant 名稱不好懂，幫我改成中文。」
  → Claude 說明變體名稱用過就不能改（R-S-24），中文名只顯示在手冊和介面上，請你找美編（設計）或專案負責人討論。
