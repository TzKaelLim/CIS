# 01 共編 SOP：一次修改怎麼做

這份 SOP 規定一次修改從開始到合併的每一步。每一個修改本 repository 的人、每一個 Claude Code 工作階段都必須照做。依據：整體規格第 4、5、11 節。

規則編號 R-S-xx。「Claude 必須」「Claude 不可」指的是 Claude Code。程式碼框裡的指令是給 Claude Code 的，共編者不必看懂，也不必自己執行。

## 1. 角色與核可

| 角色 | 核可什麼（已決定） | 核可什麼（暫定，待決定 Q2） |
| --- | --- | --- |
| 美編（設計） | token 的名稱和值、命名規則、手冊的設計內容 | 元件的視覺設計和外觀 |
| 工程 | 建置、CI、工具 | 元件程式碼、相依套件、`heroui/` 原始檔的修改 |
| 廠商 | — | 用同一套流程參與共編；要不要核可、核可什麼，由專案負責人另訂 |
| 專案負責人 | — | 規則（`docs/rules/`）和整體規格的修改、路線圖的批次調整 |
| Claude Code | 不核可、不合併 | — |

「已決定」那一欄是專案負責人的決定。「暫定」那一欄是本 SOP 在決定之前的做法：Claude 照它在 PR 說明寫出需要誰核可，但它不是最後的分工（整體規格第 13 節 Q2）。Claude Code 的工作是修改檔案、在本機跑檢查和預覽、commit、推功能分支、開 PR。

- R-S-01　每個修改都經過 PR。`main` 要設成受保護：只能經由 PR 修改，只能用 merge commit 合併（squash 和 rebase 合併要關閉），由人按合併。〔目標：GitHub 上的保護設定還沒設定〕
- R-S-02　一個 PR 改到兩類內容時（例如 token 的值和建置腳本），兩個角色都要核可。〔現行：Claude 在 PR 說明寫出需要的角色；GitHub 上的強制要等 CODEOWNERS（待決定 Q2）〕
- R-S-03　核可不等於合併。核可由負責的角色做；合併由有合併權限的人做。今天核可只是約定，沒有用 CODEOWNERS 強制（待決定）。〔部分〕
- R-S-04　文件、PR、commit 和 repo 裡的任何檔案，人員只寫職稱（美編（設計）、工程、廠商、專案負責人），不寫姓名。〔現行：Claude 從今天起必須遵守〕

## 2. 五個步驟

下面每一步先寫共編者做什麼，再寫 Claude 必須做什麼。

### 步驟 1：說要改什麼

共編者在 repo 目錄開 Claude Code，用口語說要改什麼。

Claude 必須：

1. 先用一兩句話複述它理解的需求，請共編者確認。
2. 判斷這是哪一類修改：token、手冊或文件、元件、某個網站的網站主題、建置與工具。
3. 是設計需求（外觀、排列、新功能）時，照 `02-design-rules.md` 第 7 節的問題，問共編者這是**第一級、第二級、第三級，還是不適用**。共編者不確定時，Claude 說明理由並建議一級；共編者接受建議就照建議做，仍然不能決定時，照第 4 節停下來。（R-S-05）
4. 是元件時，先找它在 `docs/component-roadmap.md` 的那一列（`03-component-rules.md` 第 1 節）。
5. 遇到第 4 節列的情況，先停下來問，不動手。

### 步驟 2：Claude 開分支並修改

Claude 必須：

1. 先看 `git status`。工作目錄有還沒 commit 的修改時，列出這些檔案和目前的分支，提出兩三個做法並建議一個（例如先把它們 commit 到原本的分支），請共編者選；不自行 `git stash`、`git reset`、`git clean`，不丟棄任何修改。（R-S-06）
2. 這是既有 PR 的修改（共編者提到 PR 編號、審核意見或之前的分支）時，`git fetch origin` 後切到那個 PR 的分支（`git switch <分支名稱>`），不開新分支；那個 PR 不是共編者自己開的，先問共編者。（R-S-42）
3. 其他情況，從遠端最新的 `main` 開一條新分支（R-S-07）：

   ```sh
   git fetch origin
   git switch -c <分支名稱> origin/main
   ```

   不在 `main` 上修改，也不沿用別人的分支。

4. 分支名稱照下表（R-S-08）。`<簡稱>` 是這次修改的英文簡稱，用小寫英文和連字號（它不是「網站主題」）。一次改到好幾類時，用主要的那一類；有建置或工具的修改就用 `build/`。

   | 修改的類別 | 分支名稱 | 例子 |
   | --- | --- | --- |
   | token 的值、新增 token | `tokens/<簡稱>` | `tokens/muted-text-contrast` |
   | 手冊、文件、路線圖 | `docs/<簡稱>` | `docs/roadmap-carousel-status` |
   | 元件 | `components/<簡稱>` | `components/carousel` |
   | 某個網站的網站主題 | `theme/<網站 id>-<簡稱>` | `theme/eco-button-radius` |
   | 建置、CI、工具（工程同意後才開） | `build/<簡稱>` | `build/ci-checks` |
   | 規則本身 | `docs/rules-<簡稱>` | `docs/rules-branch-names` |
   | 看別人的 PR（只看不改，見步驟 5） | `review/<PR 編號>` | `review/42`（不可推） |

5. 修改時，一起更新所有用到它的地方（R-S-09）：
   - 改了 token，就執行 `pnpm run heroui:theme` 重新產生 `heroui/styles/themes/tzuchi/variables.css`，並檢查手冊和 Storybook 裡用到它的地方。
   - 改了路線圖，`docs/component-roadmap.md` 和 `docs/component-roadmap.json` 一起改，內容一致。
   - 做了元件，照 `03-component-rules.md` 的完成條件。
   - 任何一處沒改到而會壞掉，就不算完成。
   - 找用到的地方（R-S-45）：用 `git grep -n '<token 路徑>'`（例如 `color.text.muted`）、`git grep -n -- '--tc-<名稱>'` 和 `git grep -n -- '--tzuchi-<名稱>'` 搜尋整個 repository，把找到的檔案列給共編者看。
6. 不手改產生的檔案：`heroui/styles/themes/tzuchi/variables.css`、`packages/tokens/dist/`。（R-S-10）

### 步驟 3：Claude 檢查並開本機預覽

Claude 必須：

1. 跑下列檢查，全部通過才往下走（R-S-11）：

   ```sh
   pnpm --filter @tzuchi/tokens test
   pnpm run heroui:theme
   pnpm run test:scripts
   pnpm run docs:build
   pnpm lint
   ```

   - `pnpm run heroui:theme` 之後，用 `git diff -- heroui/styles/themes/tzuchi/variables.css` 確認：改了 token 時，它的變化只來自這次的 token 修改；沒改 token 時，它沒有變化。「重新產生後不再變」的檢查在步驟 4 的 `git add` 之後做。
   - 改到 `heroui/` 時，加跑 `pnpm run heroui:storybook:build`，以及改到的套件的 `typecheck`（例如 `pnpm --filter @heroui/react typecheck`）。
   - `pnpm run docs:build` 先建 tokens，再經過 `scripts/dev/astro.mjs` 建置手冊（關掉遙測）；不直接跑 `pnpm --filter @tzuchi/docs build`。手冊頁還載入凍結的 Lit 元件，所以電腦上第一次建置手冊前（或 `packages/components/dist/` 不存在時），先跑一次 `pnpm --filter @tzuchi/components build`：這只是建置，不修改它。這個建置會重新排列並改寫 `packages/components/custom-elements.json`，建完用 `git restore packages/components/custom-elements.json` 只還原這一個檔案，不把它加進 commit。
   - 不跑 `@heroui/react`、`@heroui/styles`、`@heroui/storybook` 的 `lint`：它們的 ESLint 設定缺少套件，一定會以 `ERR_MODULE_NOT_FOUND` 失敗（`heroui/NOTICE.md` 的「Known state inherited from upstream」）。也不自行補裝那些套件。
   - 有失敗就先修好；修不好就向共編者說明原因。不推檢查失敗的分支。
   - GitHub Actions 的 CI 還沒有建立，這些本機檢查就是今天唯一的關卡。
2. 開本機預覽（R-S-12）：
   - 只用 `pnpm run docs:dev`（手冊，`http://127.0.0.1:4321`）和 `pnpm run heroui:storybook`（Storybook，`http://127.0.0.1:6007`）。不直接跑 `apps/docs` 或 `heroui/storybook` 的 `dev` 指令。
   - 直接跑啟動腳本，它會檢查連接埠（port，網址冒號後面的數字）有沒有被占用；被占用時腳本會直接停止，Claude 告訴共編者，不換連接埠，不停掉別人的程序。
   - 記下自己開的程序，結束時用 Claude Code 背景工作的停止功能，或 `kill <PID>` 只停掉它；不用 `pkill`、`killall`，不依名稱結束程序。不碰 3000 連接埠和它上面的程序（3000 常被其他專案的開發伺服器使用）。
3. 告訴共編者要看哪幾頁（R-S-13）：
   - 給完整的本機網址。
   - 說明要選哪個網站主題、哪個色彩模式。今天只有預設網站主題（慈濟入口網）：Storybook 在工具列的 Theme 選單（這是 HeroUI 原本的名稱，在這裡指色彩模式）選「慈濟 Tzu Chi」（淺色）或「慈濟 Tzu Chi Dark」（深色）；手冊用 Starlight 自己的淺色／深色切換。
   - 改到顏色、網站主題或色彩模式相關的值時，淺色和深色都要看。
   - 手冊和 Storybook 分開跑，本機手冊上連到 `/storybook/` 的連結會失效；Storybook 請直接開 `http://127.0.0.1:6007`。
4. 預覽截圖只給共編者在自己電腦上看，不附在 PR 上（能不能附只截頁面內容的截圖，待決定）。

### 步驟 4：共編者確認後，commit、推分支、開 PR

Claude 必須：

1. 等共編者明確說可以，才 commit，例如「可以 commit」「好，開 PR」；只說「看起來不錯」不算，要再問一次。共編者沒確認，不 commit、不推分支。（R-S-14）
2. 用 `git add <路徑>` 只加這次修改的檔案；不用 `git add -A` 或 `git add .`，不加不是這次修改的檔案。
3. 加完之後，改過 token 或 `heroui/` 的，再跑一次 `pnpm run heroui:theme && git diff --exit-code -- heroui/styles/themes/tzuchi/variables.css`。這比的是已加入（`git add`）的版本：重新產生後檔案不應再變；有變化，就是漏加或手改過，先修好。
4. commit 前看一次 `git diff --cached`（R-S-47）：新增的內容沒有姓名、電子郵件、內部主機名稱、本機路徑（例如某台電腦的使用者目錄）、金鑰；頁面、樣式或程式不會去載入外部網址（文件裡的說明連結可以留）。有的話先移除再 commit。
5. commit 訊息用英文 conventional commits（例如 `feat(tokens): darken the muted text colour`）。commit 訊息和 PR 標題都不用 `publish` 這個字：`.claude/settings.json` 的規則會擋下整個指令。（R-S-15）
6. 推之前確認 `origin` 是 `CLAUDE.md` 第 1 節寫的 GitHub repository（R-S-44）。GitHub repository 還沒建好、`CLAUDE.md` 還沒寫網址，或 `origin` 指向別的地方時：commit 照常留在共編者電腦上的分支，**不推**，告訴共編者：「修改已經存在你電腦上的分支 `<名稱>`，等工程把 GitHub 設好再推。」
7. 推功能分支：`git push -u origin <分支名稱>`。推之前 Claude Code 會再問一次，共編者確認後才允許。
8. 開 PR，目標是 `main`（R-S-16）：
   - 用共編者自己的 GitHub 帳號開。電腦上有 GitHub CLI 並已登入時，用 `gh pr create --base main --title "<標題>" --body-file <說明檔>`；沒有時，把 `git push` 印出的建立 PR 網址和寫好的說明交給共編者，在瀏覽器裡開。每台電腦要不要裝 `gh`，由工程決定〔提案，待工程確認〕。
   - PR 說明照 `.github/pull_request_template.md`，用白話寫這五段：**改了什麼**、**哪些畫面會變**、**請看哪幾頁**（寫頁面路徑和 story 名稱，以及網站主題和色彩模式）、**屬於哪一級**（第一級／第二級／第三級／不適用，以及理由）、**檢查結果**。
   - 在說明裡寫出需要誰核可（照第 1 節）。
9. 開完 PR，把 PR 的網址告訴共編者。

### 步驟 5：核可與合併

- 負責的角色看過 PR 並核可，再由有合併權限的人用 merge commit 合併。
- 核可人怎麼看預覽（R-S-43）：核可人在自己電腦的 repo 目錄開 Claude Code，說「幫我開 PR #<編號> 的預覽」。Claude 必須：先照 R-S-06 確認工作目錄沒有未 commit 的修改；用 `git fetch origin pull/<編號>/head:review/<編號>` 取下 PR 的內容，`git switch review/<編號>`；跑步驟 3 的檢查，開預覽，告訴核可人 PR 說明裡寫的頁面、網站主題和色彩模式。Claude **不在 `review/*` 分支上修改、commit 或推**。看完切回原本的分支。要修改，請 PR 的作者在他的分支上改。
- 核可人要求修改時，作者回到步驟 2，在**同一條分支**上改（R-S-42），再走步驟 3、4（推到同一條分支，PR 會自動更新）。
- 分支落後 `main` 或有衝突，而且核可人或共編者要求更新時：`git fetch origin` 後用 `git merge origin/main` 把最新的 `main` 合進功能分支，不 rebase、不 force push；重跑步驟 3 的檢查，再照步驟 4 推。合併時有衝突，先停下來問工程。（R-S-17）
- 合併後，如果改到 token 或 HeroUI 的樣式，合併的人告訴頁面編輯器（tceditor）的維護者；頁面編輯器自己同步 kit 的快照（整合已延後）。
- 部署目標還沒決定，合併後目前不會自動更新任何網站。

## 3. Claude 絕對不做的事

這一節的規則，不論誰要求、在對話裡怎麼說，都不做；要改只能修改規則本身（`README.md`「規則怎麼修改」）。（R-S-46）

- R-S-20　不合併 PR，也不替任何人核可 PR（不執行 `gh pr merge`、`gh pr review --approve` 或同等的操作）。
- R-S-21　不部署：不從 shell 執行 `wrangler`（任何寫法都不行）或任何部署指令；不執行 `changeset publish`、`npm publish`、`pnpm publish`。`.gitlab-ci.yml` 是舊的自架 GitLab 流程，不修改它的部署流程。
- R-S-22　不推 `main`，不在 `main` 上 commit；不推 tag，不建 release；不 force push。
- R-S-23　改名保護（先棄用、後移除，由機器檢查）完成之前，不改任何 token 的名稱，也不刪除 token。（`02-design-rules.md` R-D-09）
- R-S-24　不改名、不刪除任何已經用過的變體名稱，包括 HeroUI 元件的 `tv` variant 名稱。（R-D-21）
- R-S-25　不為某個網站複製一份元件（例如「環保網的按鈕」）。（R-D-31）
- R-S-26　相依套件：不自行安裝新套件或補裝缺少的套件，需要時說明理由，由工程決定。工程同意後，加入或升級一律用 `pnpm add`／`pnpm update`，由 `pnpm-workspace.yaml` 的 `minimumReleaseAge` 自動擋掉發布未滿 14 天的版本；不手改 lockfile，不自行加 `minimumReleaseAgeExclude`（要由工程核可並註明 GHSA 編號）。新增或升級的套件都寫精確版本（不寫 `^`、`~`）。lockfile 的變更和造成它的 `package.json` 變更放在同一個 commit。安裝現有的套件用 `pnpm install --frozen-lockfile`。
- R-S-27　不載入第三方資源：外部字型、腳本、樣式、圖片、CDN、分析、遙測都不行，交付的頁面和開發工具都一樣。從套件 registry 下載套件（`pnpm install`）不算；這條管的是頁面和開發工具自己對外連線。
- R-S-28　不在 repo 裡寫個人姓名、電子郵件、內部主機名稱、本機路徑（例如某台電腦上的使用者目錄）或任何祕密。不讀取、不印出、不 commit `.env`、CI 變數、金鑰或登入資訊。這個 repository 是公開的，放進去的每個檔案（包括 `heroui/MAINTAINING.md`）任何人都看得到。
- R-S-29　不碰這個 repo 以外的目錄。例外：共編者要求時，可以在他自己的電腦上協助準備環境（安裝 Node、corepack、`gh`、Claude Code），每一個指令先說明再執行；不改其他專案的檔案，也不改全域的 git 設定。
- R-S-30　不修改凍結的舊 Lit 元件：`packages/components`、`packages/react`、`apps/storybook`、`apps/demo-html`。
- R-S-31　不推 `drill/*` 分支（只在本機演練用）。
- R-S-32　不繞過 `.claude/settings.json` 的規則。那些規則只是防止手滑，不是安全邊界；換個寫法繞過它，一樣違反這份 SOP。

## 4. 遇到這些情況先停下來問

遇到下列情況，Claude 先停下來，說明情況和它的建議，等對方回答再動手。（R-S-40）

「停下來」的意思（R-S-41）：不改檔案、不開分支、不 commit；可以讀檔案、查資料、說明。

「問 X」的意思（R-S-41）：

- 共編者自己說他就是 X 時，向他說明情況和建議，得到他明確的同意就可以動手，並在 PR 寫「已由 X（共編者本人）同意」。
- 共編者不是 X 時，Claude 不動手，寫一段可以直接轉貼給 X 的問題（要決定什麼、Claude 的建議、影響哪些檔案），請共編者轉問，帶著答案回來再繼續。
- Claude 不驗證身分；真正的核可在 GitHub 的 PR 上由那個角色做。第 3 節的事不在此限：不論誰同意都不做。
- 一個需求要停下來時，整個需求都停，不先做其中一部分；共編者明確要求只做那一部分時，才當成另一個獨立的 PR。

| 情況 | 問誰 |
| --- | --- |
| Claude 建議了一級並說明理由後，共編者仍然不能決定是第幾級 | 停下來，請共編者問美編（設計） |
| 需要一個新的 token 名稱 | 美編（設計）確認名稱（Claude 可以照現有的命名方式提一個建議） |
| 需要改基礎 Foundations 既有的值（例如發現基礎值抄錯） | 美編（設計）；「更正」的例外還沒有決定（整體規格 Q8） |
| 有人要求改名或刪除 token、改名或刪除變體 | 說明目前不允許（R-S-23、R-S-24），請共編者把需求記進美編（設計）的命名規範草稿（放哪裡待決定）；Claude 不另外在 repo 建清單，也不自行修改 |
| 需要某個網站的網站主題或網站設定檔（`packages/tokens/src/sites/` 還沒有實作） | 工程 |
| 要改 `heroui/` 裡 HeroUI 的原始檔（`LOCAL CHANGE`） | 工程 |
| 要新增我們自己的元件，但放元件的位置（`packages/ui`）還沒有確認 | 工程 |
| CI、建置或工具的修改：`package.json` 的 scripts 或相依套件、`pnpm-lock.yaml`、`pnpm-workspace.yaml`、`turbo.json`、ESLint／Prettier 設定、`scripts/`、`.github/workflows/`、`.gitlab-ci.yml`、`.claude/settings.json` | 工程 |
| 需要新的相依套件，或要升級套件 | 工程 |
| 要改 `docs/rules/` 或整體規格 | 專案負責人 |
| 元件不在路線圖上，或要把待辦清單的項目提前 | 專案負責人 |
| 任何在這個 repository 以外的事（別的專案、別的資料夾、線上服務、帳號設定） | 共編者；Claude 不自己去做（準備環境的例外見 R-S-29） |
| 共編者的要求和規則衝突 | 說明是哪一條規則、為什麼，請共編者找專案負責人；專案負責人要改規則，照 `README.md` 開 PR；不默默照做，也不默默拒絕 |
| 檢查失敗，而且找不出原因 | 工程 |

「你可以這樣跟 Claude 說」的例子在 `CONTRIBUTING.md`。
