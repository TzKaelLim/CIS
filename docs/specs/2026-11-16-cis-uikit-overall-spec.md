# 慈濟 CIS UIKit 整體規格

- 日期：2026-11-16
- 狀態：草稿，待專案負責人審閱
- 範圍：本 repository 的全部內容（design tokens、HeroUI 與慈濟主題、手冊、Storybook、共編流程）
- 依據：專案負責人 2026-11-16 的決定（2026-11-17 另有一條用詞決定，見第 2 節），以及本 repository 在 commit `2f88f353` 的檔案，加上和本文同一批的修改（`CLAUDE.md`、`CONTRIBUTING.md`、`docs/rules/`、PR 範本等）。兩者不一致時，以專案負責人的決定為準，並在第 14 節列出現有檔案要改的地方。第 12 節的現況對照表反映這一批修改合併之後的狀態。
- 引用方式：本文每一條規定都有編號（S-1、S-2……）。SOP 規則文件和 PR 說明引用規定時，寫編號即可。

### 標記的意思

每條規定後面都有一個標記，說明它今天的狀態：

| 標記 | 意思 |
| --- | --- |
| 〔現行〕 | repo 裡已經這樣做，第 12 節列出證明的檔案 |
| 〔部分〕 | 已經做了一部分，第 12 節說明缺什麼 |
| 〔目標〕 | 已經決定，但還沒做；實作時必須符合 |
| 〔提案，尚未實作〕 | 本文提出的做法，等專案負責人或負責的角色確認，repo 裡還沒有 |
| 〔提案，待工程確認〕 | 同上，但要由工程確認技術上可行 |

---

## 0. 結論

- **一套 kit，給所有慈濟網站用**：名稱是「慈濟 CIS UIKit」。慈濟的各個網站（例如新聞、電子書、年報網）共用同一套，不會一個網站一套（S-1）。
- **唯一來源是 tokens**：顏色、字級、間距、圓角、陰影都寫在 `packages/tokens/src/` 的 JSON 檔裡。CSS 變數、HeroUI 的慈濟主題、手冊、Storybook 都由程式從它產生，不在任何地方手抄數值（S-3 到 S-5；手冊今天還有一部分沒做到）。
- **元件以 HeroUI v3 為基礎**：HeroUI 的原始碼放在 `heroui/`，只能以記錄過的 `LOCAL CHANGE` 修改。我們自己的元件不放進 `heroui/`，本文提議另開一個自己的套件（第 8.5 節，待工程確認）。
- **大家都透過 Claude Code 改**：美編（設計）、工程、廠商都用口語告訴 Claude Code 要改什麼，沒有人手改 JSON。一次修改五個步驟，最後一定是開 PR、由負責的角色核可、由人合併。Claude Code 不合併、不部署、不推 `main`、不推 tag（S-10 到 S-20）。
- **網站之間的差異分三級處理**：只有 CSS 值不同 → 主題；內容相同、排列不同 → 同一個元件的變體；資料或行為不同 → 新元件。不可以為某個網站複製一份元件（S-50 到 S-55）。
- **「主題」和「色彩模式」是兩件事**：主題是一組有名字的外觀設定（今天有 Default；Green Natural 是示意），一個網站選用一個主題；色彩模式是「淺色或深色」。兩者可以自由組合。「主題」這個詞只用來指這種有名字的外觀（S-40）。
- **今天已經有的**：預設主題 Default 的淺色與深色 tokens、HeroUI 的慈濟主題（68 個元件覆寫檔）、Storybook、新版手冊（五個區域、頁首的主題選單和色彩模式按鈕；元件頁介紹的仍是凍結的 Lit 元件）、本機預覽腳本、14 天的套件版本冷卻期。
- **今天還沒有的**：Default 以外各個主題的檔案（`sites/<id>/`；手冊裡的 Green Natural 主題只是示意）、改名保護、我們自己的元件套件、GitHub Actions 的 CI、部署目標。這些在本文都標成〔目標〕或〔提案〕。
- **元件缺口**：和 Astryx 的 116 個元件家族比對，HeroUI 部分對應 24 項、完全沒有 49 項，共 73 項。部分對應的「優化」，沒有的「新增」；內容網站大多用不到的也收進來，但放在待辦清單（S-70 到 S-74）。
- **要專案負責人回答的**在第 13 節，每一項都附了建議。

---

## 1. 目的與讀者

這份文件把慈濟 CIS UIKit 的規則寫在一個地方，讓參與的人都照同一套做事。

讀者：

- **美編（設計）**：看第 2、5、6、7、8.2、8.3、9 節，知道一個設計需求屬於哪一級、要改哪裡、要看哪些頁。
- **廠商**：和美編一樣，加上第 8 節（做元件時的規則）。
- **工程**：全部，特別是第 3、8.5、10、11、12 節。
- **專案負責人**：第 0、4、13 節。
- **Claude Code**：全部。SOP 規則文件會引用本文的編號；每次修改，Claude Code 都要遵守本文和 SOP。

本文不是使用手冊，也不取代 `heroui/NOTICE.md`（授權和修改清單）或 `heroui/styles/themes/tzuchi/DESIGN-LANGUAGE.md`（元件外觀的細部規則）。

---

## 2. 名詞

下表的用詞是固定的。文件、PR 說明、手冊和 Claude Code 的回覆都照這張表用詞（S-2）〔目標〕。

| 名詞 | 意思 | 不要和什麼混用 |
| --- | --- | --- |
| 慈濟 CIS UIKit | 本 repository 提供的整套東西：tokens、元件、手冊、Storybook。所有慈濟網站共用一套 | 不在名稱前面加單一網站的名字（不說「某某網 UIKit」） |
| 基礎 Foundations | 所有網站共用的基本色階和數值刻度，例如 `color.blue.900`、`space.16`、`radius.md`。放在 `packages/tokens/src/primitive/`。只能新增，不能修改 | 程式裡叫 primitive |
| 語意色 | 說明用途的顏色，例如「品牌主色」`color.brand.primary`、「次要文字」`color.text.muted`。指向某個基礎色。放在 `packages/tokens/src/semantic/` | 程式裡叫 semantic |
| 元件 token | 某個元件專用的值，例如按鈕的圓角 `button.radius`。每個元件 token 只在 `packages/tokens/src/component/` 定義一次 | — |
| 主題 | 一組有名字的外觀設定。今天有 Default（預設）和 Green Natural（示意）。一個網站選用一個主題；Default 以外的主題只寫和 Default 不同的值 | 「主題」這個詞**只**用在這裡；主題的名稱不用網站的名稱 |
| 預設主題 | Default。今天 `packages/tokens/src/` 的值就是它；網站沒有指定主題時就用它 | 不是 HeroUI 原廠的 `default` 主題（`heroui/styles/themes/default/`，Storybook 工具列的 Light／Dark） |
| 色彩模式 | 淺色或深色 | **不可**叫「主題」「深色主題」 |
| 變體 variant | 同一個元件的幾種設計或選項，例如卡片的「一般」「精選」 | 不是新元件，也不是版本 |
| 版本 | 元件不相容的重新設計，只用整數：v1、v2 | 設計上沒有 v1.2.3；套件的發行號碼是工程的事，目前沒有使用 |
| 第一級、第二級、第三級 | 網站之間差異的三級判斷（第 8.2 節） | — |
| 優化 | HeroUI 已經「部分對應」的元件，在它的基礎上補齊或延伸 | — |
| 新增 | HeroUI 完全沒有的元件，加進 kit | — |
| 待辦清單 | 決定要做、但不排進目前批次的項目 | — |
| 網站設定檔 | 一個網站的名稱和各元件的預設變體，檔名 `site.json`（提案，第 6.5 節） | — |
| 手冊 | 給一般讀者看的設計手冊，Astro + Starlight，在 `apps/docs` | — |
| Storybook | 給工程師看的元件展示，在 `heroui/storybook`。也叫「元件展示頁」 | — |
| 慈濟主題 | HeroUI 裡 Default 主題的實作，程式名 `tzuchi`（淺色）／`tzuchi-dark`（深色），在 `heroui/styles/themes/tzuchi/`。它把主題和色彩模式併在一個名稱裡（第 7 節） | 這是 HeroUI 的名詞，也是「主題」一詞唯一允許的程式名例外；文件裡寫「HeroUI 慈濟主題」 |
| 主題變數 | HeroUI 的 CSS 變數（例如 `--accent`、`--surface`），由慈濟主題設定值 | 不是 Default、Green Natural 這種主題 |
| 唯一來源 | `packages/tokens/src/**/*.tokens.json`。其他地方的值都由它產生 | — |
| `LOCAL CHANGE` | 對 `heroui/` 裡 HeroUI 原始檔的修改。每一處都要加註解，並列入 `heroui/NOTICE.md` | — |
| PR | GitHub 的 pull request：一次修改的審查與合併單位 | 不再說 MR |
| 核可 | 負責的角色看過 PR 並同意 | 核可不等於合併 |
| 合併 | 把 PR 併進 `main`。只由人做，用 merge commit | — |
| 本機預覽 | 在自己電腦上開手冊或 Storybook，只有自己看得到（127.0.0.1） | — |

用詞決定（2026-11-17，專案負責人）：「網站主題」一律改叫「主題」。主題是一組有名字的外觀，主題的名稱不用網站的名稱：原本的預設主題叫 **Default**，另一個示意的主題叫 **Green Natural**（仍是示意）。一個網站選用一個主題，沒有指定時用 Default。程式裡的 id 是 `default`、`green-natural`。淺色、深色仍然叫「色彩模式」。

---

## 3. 架構

```
   美編（設計）／工程／廠商 ──用口語請 Claude Code 修改──┐
                                                        ▼
┌──────────────────────── 慈濟 CIS UIKit（本 repository）────────────────────────┐
│                                                                                │
│  唯一來源：packages/tokens/src/                                                 │
│    primitive/        基礎 Foundations（色階、刻度、字型）                       │
│    semantic/         語意色、語意字級                                           │
│    component/        元件 token（每個只定義一次）                               │
│    themes/dark/      Default 主題的深色模式                                     │
│    sites/<id>/       各主題的值與設定檔              ← 提案，尚未實作            │
│          │                                                                     │
│          │ build.mjs（Style Dictionary）                                        │
│          ▼                                                                     │
│  產物：packages/tokens/dist/tokens.css（--tc-* CSS 變數，淺色＋深色）           │
│        packages/tokens/dist/tokens.js、tokens.d.ts                             │
│          │                                                                     │
│          │ heroui/styles/themes/tzuchi/generate.mjs                            │
│          ▼                                                                     │
│  HeroUI 的慈濟主題：heroui/styles/themes/tzuchi/                               │
│        variables.css（產生的，不手改）＋ components/*.css（68 個元件覆寫）        │
│          │                                                                     │
│          ├──► heroui/react ＋ heroui/styles：HeroUI v3 元件（vendored）          │
│          ├──► 我們自己的元件套件                      ← 提案，待工程確認（8.5）   │
│          │                                                                     │
│          ├──► 手冊 apps/docs（Astro + Starlight）：給一般讀者                  │
│          └──► Storybook heroui/storybook：給工程師                             │
│                                                                                │
└────────────────────────────────────────────────────────────────────────────────┘
          │
          ▼  各網站使用（安裝方式、網站程式碼放哪裡：待決定，第 13 節）
   慈濟的各個網站 ……（每個網站選用一個主題）
```

- S-1　慈濟 CIS UIKit 是一套，給所有慈濟網站共用。不為單一網站另做一套 kit，也不在 repo 裡為某個網站複製一份元件。〔目標〕
- S-3　資料只往一個方向流：tokens 原始檔 → 產物 → HeroUI 慈濟主題、元件、手冊、Storybook。下游不回頭改上游；要改值就改 tokens 原始檔。〔現行〕
- S-4　`heroui/styles/themes/tzuchi/variables.css` 是產生的檔案，不手改。改完 tokens 要重新產生，並確認它和 tokens 同步。〔現行〕
- S-5　手冊和 Storybook 顯示的值都由 tokens 產生，不在頁面裡手抄色碼或數值。〔部分〕

今天的連接方式（事實）：

- 產物 `tokens.css` 用前綴 `--tc-`，淺色值放在 `:root`，深色值放在 `[data-theme="dark"]` 和「作業系統是深色、而且沒有設 `data-theme="light"`」兩處。
- HeroUI 的慈濟主題用 `data-theme="tzuchi"`（淺色）和 `data-theme="tzuchi-dark"`（深色）。因為這兩個名稱對不上 `tokens.css` 的深色規則，`generate.mjs` 會把每個值往下解析到基礎色，直接寫進 `variables.css`。
- 慈濟主題的元件覆寫檔，顏色只能讀 HeroUI 的主題變數或 `generate.mjs` 產生的 `--tzuchi-*` 變數，不能直接讀 `--tc-color-*` 或顏色類的元件 token（否則在 `tzuchi-dark` 下會拿到淺色值）。這條規則寫在 `heroui/styles/themes/tzuchi/components/index.css` 的開頭。
- 套件都設成 `private`，沒有發布到任何套件庫。今天沒有網站實際安裝這套 kit。

---

## 4. 角色與核可

| 角色 | 核可什麼（已決定） | 核可什麼（暫定，待決定 Q2） |
| --- | --- | --- |
| 美編（設計） | token 的名稱和值、命名規則、手冊的設計內容 | 元件的視覺設計和外觀 |
| 工程 | 建置、CI、工具 | 元件程式碼、相依套件、`heroui/` 原始檔的修改 |
| 廠商 | — | 用同一套流程參與共編；要不要核可、核可什麼，由專案負責人另訂 |
| 專案負責人 | — | 規則（`docs/rules/`）和本文的修改、路線圖的批次調整；本文第 13 節的決定、誰有合併權限 |
| Claude Code | 不核可、不合併 | — |

Claude Code 的工作是修改檔案、在本機跑檢查和預覽、commit、推功能分支、開 PR。「暫定」那一欄是決定之前的做法，同一張表也在 `docs/rules/01-co-editing-sop.md` 第 1 節。

- S-6　文件、PR 和 repo 裡的任何檔案，只寫角色（美編（設計）、工程、廠商、專案負責人），不寫個人姓名。〔目標〕
- S-7　token 的名稱與值、命名規則、手冊的設計內容，由美編（設計）核可。〔部分：只是約定，沒有機器強制〕
- S-8　建置、CI 和工具的修改，由工程核可。〔部分：只是約定，沒有機器強制〕
- S-9　一個 PR 同時改到兩類內容時，兩個角色都要核可。上表「暫定」那一欄（元件外觀、元件程式碼、相依套件、`heroui/`、規則、路線圖批次）和要不要用 CODEOWNERS 強制，待決定（第 13 節 Q2）。〔部分：Claude 在 PR 說明寫出需要的角色；沒有 CODEOWNERS〕
- S-10　每個修改都經過 PR。`main` 受保護：只能經由 PR 修改，只能用 merge commit 合併（關閉 squash 和 rebase 合併），由人按合併。〔目標〕
- S-11　Claude Code 不合併 PR、不部署、不推 `main`、不推 tag。〔部分〕

說明：本 repository 今天的遠端仍是自架 GitLab；只有舊的 `.gitlab/merge_request_templates/Default.md` 和 `.gitlab-ci.yml` 還用 MR 的流程。依專案負責人的決定，repository 的家改成公開的 GitHub repository；上面的保護設定要在 GitHub 上設好，才算完成。GitHub repository 建好、網址寫進 `CLAUDE.md` 之前，Claude 只在本機 commit，不推分支（`docs/rules/01-co-editing-sop.md` R-S-44）。

---

## 5. 一次修改的流程

一次修改有五個步驟：

1. **說要改什麼**：共編者在 repo 目錄開 Claude Code，用口語說要改什麼。例如「把次要文字色調深一點」「Green Natural 主題的按鈕圓角要更圓」「卡片要有一種『精選』樣式」。
2. **Claude 修改**：Claude 從最新的 `main` 開一條新分支，修改，並一起更新所有用到它的地方（HeroUI 慈濟主題、手冊、Storybook）。
3. **Claude 檢查並開預覽**：Claude 跑檢查，開本機預覽，告訴共編者要看哪幾頁、切到哪個主題和色彩模式。
4. **確認後開 PR**：共編者確認後，Claude commit、推分支、開 PR。PR 用白話寫：改了什麼、哪些畫面會變、要看哪幾頁。
5. **核可與合併**：負責的角色核可，由人合併。

規定：

- S-12　開始修改前，Claude 先抓遠端最新的 `main`，從它開新分支；不在 `main` 上修改，也不沿用別人的分支。〔現行〕
- S-13　分支名稱用「類別/英文簡稱」：`tokens/<簡稱>`（tokens）、`docs/<簡稱>`（手冊、文件、路線圖；規則本身用 `docs/rules-<簡稱>`）、`components/<簡稱>`（元件）、`theme/<主題 id>-<簡稱>`（某個主題）、`build/<簡稱>`（建置與工具，工程同意後才開）；看別人的 PR 用 `review/<PR 編號>`，不推。「簡稱」是這次修改的英文簡稱，不是主題的 id。〔現行（規則）：`docs/rules/01-co-editing-sop.md` R-S-08〕
- S-14　設計需求（外觀、排列、新功能）在動手前，Claude 先問共編者這是第幾級（第 8.2 節），並把答案和理由寫進 PR 說明。〔現行（規則）：R-D-30、PR 範本〕
- S-15　Claude 修改時一起更新所有用到它的地方；任何一處沒改到而會壞掉，就不算完成。〔現行〕
- S-16　推分支前，Claude 必須跑完並通過下列檢查；有失敗就先修好，或向共編者說明原因，不推失敗的分支。〔現行〕

  ```sh
  pnpm --filter @tzuchi/tokens test
  pnpm run heroui:theme
  pnpm run test:scripts
  pnpm run docs:build
  pnpm lint
  # git add 之後（比的是已加入的版本，重新產生後不應再變）：
  pnpm run heroui:theme && git diff --exit-code -- heroui/styles/themes/tzuchi/variables.css
  ```

  改到 `heroui/` 時加跑 `pnpm run heroui:storybook:build`；`pnpm run docs:build` 先建 tokens 再建手冊（經過 `scripts/dev/astro.mjs`）；第一次建手冊前先 `pnpm --filter @tzuchi/components build`，因為今天的手冊頁還載入凍結的 Lit 元件（細節見 R-S-11）。不要跑 `@heroui/react`、`@heroui/styles`、`@heroui/storybook` 的 `lint`（一定會因缺少套件而失敗，見 `heroui/NOTICE.md` 的「Known state inherited from upstream」），改跑它們的 `typecheck`。
- S-17　Claude 告訴共編者要看哪幾頁時，同時說要切到哪個主題、哪個色彩模式。改到主題或色彩相關的值時，淺色和深色都要看。〔現行（規則）：R-S-13〕
- S-18　共編者沒確認，Claude 不 commit、不推分支。推之前 Claude Code 會再問一次，共編者確認後才允許。〔現行〕
- S-19　commit 訊息用英文 conventional commits（例如 `feat(tokens): …`）；commit 訊息和 PR 標題不用 `publish` 這個字（`.claude/settings.json` 的規則會擋下整個指令）。〔現行〕
- S-20　PR 說明用白話，固定五段：「改了什麼」「哪些畫面會變」「請看哪幾頁（含主題與色彩模式）」「屬於哪一級（第一級／第二級／第三級／不適用）、為什麼」「檢查結果」。預覽截圖只給共編者在自己電腦上看，不附在 PR 上（能不能附只截頁面內容的截圖，待決定 Q11）。PR 範本在 `.github/pull_request_template.md`。核可人在自己電腦上用 Claude Code 開 PR 的預覽（`docs/rules/01-co-editing-sop.md` R-S-43）。〔現行（規則）〕
- S-21　Claude 用共編者自己的帳號推分支和開 PR〔現行（規則）〕。開 PR 的工具（例如 GitHub CLI `gh`）要不要在每台電腦安裝，由工程決定〔提案，待工程確認〕。
- S-22　CI 還沒有。GitHub Actions 的 CI 建好之前，S-16 的本機檢查就是唯一的關卡；CI 建好後，CI 沒通過的 PR 不能合併。〔目標〕
- S-23　`drill/*` 分支只在本機演練用，不推。〔現行〕

---

## 6. token 規則

### 6.1 三層

| 層 | 放哪裡 | 例子 | 怎麼改 |
| --- | --- | --- | --- |
| 基礎 Foundations | `packages/tokens/src/primitive/`（color、elevation、scale、typography） | `color.blue.900` = `#1B2D58`、`space.16`、`radius.md` | 只新增，不修改既有的值 |
| 語意色（含語意字級） | `packages/tokens/src/semantic/` | `color.brand.primary` → `{color.blue.900}` | 可以改成指向另一個基礎值 |
| 元件 token | `packages/tokens/src/component/`（今天 33 個檔） | `button.radius` → `{radius.md}` | 可以改值；新增時每個只定義一次 |

- S-24　基礎 Foundations 是所有網站共用的刻度，只新增，不修改既有的值。要換顏色，就新增一個基礎色（需要的話），再讓語意色或元件 token 指向它。〔目標〕
- S-25　語意色和元件 token 都用參照指向下一層（`{color.blue.900}`），不寫死色碼。〔部分〕
- S-26　每個元件 token 只在 `packages/tokens/src/component/` 定義一次；主題和色彩模式只覆寫既有的名稱，不另外定義。〔部分〕
- S-27　新增 token、修改值，照第 5 節的流程做即可。〔現行〕

說明：今天 `src/component/` 的 33 個檔案是照舊的 Lit `tc-*` 元件命名的（例如 `breadcrumb`、`divider`、`progress`），和 HeroUI 的元件名（`breadcrumbs`、`separator`、`progress-bar`）不完全一樣；對照寫在 `heroui/NOTICE.md`。在改名保護完成前（S-31）不改這些名稱。

### 6.2 色彩模式的 token

- S-28　Default 主題的深色模式只覆寫語意色和陰影（`packages/tokens/src/themes/dark/`），不重新定義基礎值；深色的顏色值必須是指向基礎色的參照，不寫死色碼。這由 `packages/tokens/check.mjs` 檢查。〔現行〕
- S-29　淺色與深色的值同時在一份 `tokens.css` 裡，由同一次建置產生。〔現行〕

### 6.3 命名

- S-30　CSS 變數一律用 `--tc-` 前綴，層級用 `-` 連接，例如 `--tc-color-brand-primary`、`--tc-space-16`。色階用 `color.<色名>.<階>`。〔現行〕
- S-31　改名保護（先棄用、後移除，由機器檢查）完成之前，**沒有人**改 token 的名稱，也不刪除 token。有需要時先問美編（設計）和工程。〔現行〕
- S-32　美編（設計）的命名規範，等改名保護完成後，以一次規劃好的改名套用，不零星改名。〔目標〕

### 6.4 改名保護

- S-33　改名保護要做到：一份 commit 進 repo 的名稱登記；改名時舊名先留成別名並標「棄用」；過了約定的期限、確認沒有人使用後才移除；任何地方讀到已移除或不存在的名稱，檢查就失敗。〔提案，尚未實作〕

說明：這個做法來自頁面編輯器（tceditor）repository 裡 2026-10-21 的共編機制設計（名稱登記 `token-names.json`），本 repo 還沒有任何一部分。

### 6.5 主題的檔案（提案，尚未實作）

今天 repo 裡只有 Default 主題和它的深色模式。其他主題的檔案照下面的規則加（資料夾 `sites/<id>/` 是提案時定的路徑，保留不改；`packages/tokens/src/themes/` 已經用在深色模式，`<id>` 是主題的 id）：

```
packages/tokens/src/sites/<id>/
  theme.light.json    淺色模式下，和預設不同的值
  theme.dark.json     深色模式下，和預設不同的值
  site.json           主題名稱，以及各元件的預設變體
```

`site.json` 的形狀（示意）：

```json
{
  "id": "green-natural",
  "name": "Green Natural",
  "defaultVariants": { "card": "featured" }
}
```

- S-34　主題的檔案只寫和預設不同的值；沒寫到的，一律退回預設。〔提案，尚未實作〕
- S-35　主題只能覆寫已經存在的 token 名稱，不能新增名稱。建置時發現不存在的名稱，就失敗。〔提案，尚未實作〕
- S-36　主題先覆寫語意色；只有某個元件仍然需要不同時，才覆寫那個元件的元件 token。主題不覆寫基礎 Foundations。〔目標：順序是專案負責人的決定；檔案的位置是提案，尚未實作〕
- S-37　主題的值也用參照指向基礎 Foundations。需要一個基礎裡沒有的顏色或數值時，先把它加進基礎（S-24，由美編（設計）核可），再在主題裡指向它。〔提案，尚未實作〕
- S-38　主題在淺色模式改了一個顏色，就必須在 `theme.dark.json` 寫出這個顏色在深色模式的值，由機器檢查兩邊的名稱一致。否則深色模式會退回 Default 主題的顏色。〔提案，尚未實作〕
- S-39　`<id>` 用小寫英文和連字號（例如 `green-natural`、`annual-report`），定了就不改，因為網站的程式碼會用它來選主題。〔提案，尚未實作〕

---

## 7. 主題與色彩模式

- S-40　「主題」只用來指一組有名字的外觀設定（今天有 Default；Green Natural 是示意）；一個網站選用一個主題。主題的名稱不用網站的名稱。淺色、深色叫「色彩模式」，不叫「主題」「深色主題」。〔目標〕
- S-41　主題和色彩模式互相獨立，可以自由組合：任何一個主題都有淺色和深色。〔目標〕
- S-42　預設主題是 Default，網站沒有指定主題時就用它。〔現行〕
- S-43　主題和色彩模式都只設在 `<html>` 上，不設在頁面裡的其他元素。〔現行〕
- S-44　在程式碼裡用哪兩個屬性名稱表示主題和色彩模式，待決定（第 13 節 Q4）。〔提案，待工程確認〕
- S-45　主題要能影響 HeroUI 元件，`generate.mjs` 必須為每個主題、每個色彩模式產生一組 HeroUI 主題變數；元件覆寫檔仍然只讀主題變數（第 3 節的限制）。〔提案，待工程確認〕
- S-46　一頁一次只套一個主題；同一頁不混用兩個主題的外觀。〔目標〕

今天的情況（事實）：

| 地方 | 用的屬性 | 問題 |
| --- | --- | --- |
| `packages/tokens/dist/tokens.css` | `data-theme="dark"`、`data-theme="light"`，沒設時跟隨作業系統 | 只有色彩模式，沒有主題 |
| HeroUI 慈濟主題 `variables.css` | `data-theme="tzuchi"`、`data-theme="tzuchi-dark"` | 把主題和色彩模式併在一個值裡；不跟隨作業系統 |
| Storybook 的工具列 | 一個 Theme 選單：慈濟、慈濟 Dark、Light、Dark | 把色彩模式叫 Theme；還混著 HeroUI 原廠的兩種外觀 |
| 手冊 `apps/docs` | 色彩模式用 Starlight 的 `data-theme="light"`／`"dark"`；主題用 `data-site="<id>"`（照 Q4 的建議，只是提案）；兩個都設在 `<html>` | 主題的屬性名稱還沒決定（Q4）；今天只有 Default 主題是正式的，另一個（Green Natural）是示意 |

---

## 8. 元件規則

### 8.1 元件的來源

- S-47　kit 的元件以 HeroUI v3 為基礎。`heroui/` 是 HeroUI v3.2.6 的原始碼（Apache-2.0），只能以 `LOCAL CHANGE` 修改：每一處加註解，並列入 `heroui/NOTICE.md` 的清單；JSON 檔不能加註解，只記在清單裡。〔現行〕
- S-48　HeroUI 元件的外觀，用慈濟主題的覆寫檔調整（`heroui/styles/themes/tzuchi/components/`）：不改 HeroUI 的結構、屬性、class 名稱和基礎 CSS；每條規則都限定在慈濟主題之下；顏色只用主題變數。〔現行〕
- S-49　`packages/components`、`packages/react`、`apps/storybook`、`apps/demo-html`（舊的 Lit Web Components）已凍結，不修改，也不放新東西。〔現行〕

不採用 Astryx（Meta）。它的手冊版面只當作閱讀方式的參考，它的元件清單只當作「我們可能需要哪些元件」的參考。

### 8.2 三級判斷：網站之間可以怎麼不同

一個網站想和別的網站不一樣時，依序判斷，用最低的那一級解決：

| 級 | 情況 | 例子 | 怎麼做 |
| --- | --- | --- | --- |
| 第一級 | 只有 CSS 的值不同：顏色、圓角、陰影、邊框、字級、間距 | 某個網站想要綠色的主色、更圓的按鈕 | 主題：網站選用（或新增）一個主題，先覆寫語意色；只有某個元件仍然需要不同時，才覆寫它的元件 token |
| 第二級 | 內容一樣，結構或排列不同 | 圖在上 vs 圖在左；只有文字 vs 圖示加文字 | 共用元件的一個變體，並在網站設定檔設這個網站的預設變體 |
| 第三級 | 資料或行為不同，也就是別的網站沒有的東西 | 年報網的「年度數據比較」 | 新元件：通用的直接進 kit；綁定單一網站業務的，留在那個網站自己的專案，等第二個網站也需要時再移進 kit |

- S-50　設計需求依第一級、第二級、第三級的順序判斷，能用低一級解決就不用高一級。〔目標〕
- S-51　Claude 必須問共編者這個需求是第幾級，並把結論寫進 PR 說明（S-14）。共編者不確定時，Claude 依上表說明理由並建議一級，由共編者決定。〔現行（規則）：R-D-30〕
- S-52　不可以為某個網站複製一份元件（例如「某個網站專用的按鈕」）。需要不同，就用第一級或第二級；真的是新東西，才是第三級。〔目標〕
- S-53　某個網站不用某個元件時，什麼都不用做：不必在主題裡為這個元件寫值，也不必設預設變體。〔目標〕
- S-54　第三級的新元件，通用的（第二個網站可能也會用）直接進 kit；只屬於一個網站業務的，留在那個網站的專案裡，不進 kit。等第二個網站需要時，再移進 kit，移進時依 kit 的規則（變體、token、手冊）整理。〔目標〕
- S-55　網站自己的專案放在哪裡（本 repo 或另外的 repo），待決定（第 13 節 Q1）。〔提案，尚未實作〕

### 8.3 變體

- S-56　變體依用途命名，不依外觀命名：叫「精選」，不叫「大紅框」。程式裡的值用英文（例如 `featured`），手冊和介面顯示中文名。〔目標〕
- S-57　變體名稱一旦被使用，就不改名、不刪除，只能新增。網站和頁面編輯器會把變體名稱存在頁面資料裡。〔現行〕
- S-58　HeroUI 元件既有的 `tv` variant 名稱（例如 Button 的 `primary`、`secondary`、`outline`）照 S-57 不改名、不移除；它們依外觀命名是 HeroUI 原本的設計，保留不動。我們新增的變體才依 S-56 命名。〔現行〕
- S-59　我們新增的每個選項保持 4 到 5 個值以內；超過 5 個值時，Claude 停下來請美編（設計）確認是不是其實是另一個元件（回到第 8.2 節重新判斷）。〔目標〕
- S-60　每個網站可以在網站設定檔指定各元件的預設變體（S-34 到 S-39）。〔提案，尚未實作〕

### 8.4 版本

- S-61　版本只用整數（v1、v2），只在不相容的重新設計時才出新版本。設計上沒有 v1.x.x。〔目標〕
- S-62　出了 v2 之後，v1 繼續可以用，直到沒有網站和頁面資料使用它；何時移除 v1 由美編（設計）和工程一起決定。〔提案，尚未實作〕
- S-63　套件的發行號碼（例如 1.2.3）是工程的事，和設計上的版本無關；目前沒有使用。〔現行〕

### 8.5 元件放哪裡（提案，待工程確認）

`heroui/` 是 vendored 的上游原始碼，不能變成我們自己元件的家。`packages/react` 這個名稱已經被凍結的 Lit React wrapper（`@tzuchi/react`）占用，`packages/components` 也是凍結的 Lit 元件。所以提議：

- S-64　**新增的元件**放在一個新的套件 `packages/ui`（套件名稱暫定 `@tzuchi/ui`，`private`）。結構參考 HeroUI 的元件資料夾慣例，讓工程一看就懂（HeroUI 本身把 React 元件放在 `heroui/react`、樣式放在 `heroui/styles`，分成兩個套件；本提案放在同一個套件）：〔提案，待工程確認〕

  ```
  packages/ui/
    src/components/<元件名>/
      <元件名>.tsx          React 元件，用 react-aria-components 或組合 @heroui/react 的元件
      <元件名>.styles.ts    tailwind-variants 的 tv()，定義變體
      <元件名>.stories.tsx  Storybook 的 stories
      index.ts
    styles/components/<元件名>.css   元件的 CSS
  ```

  建造規則：
  - 元件名用 kebab-case 英文；class 名稱加我們自己的前綴（例如 `tc-ui-carousel`），不和 HeroUI 的 class 撞名。
  - 顏色只讀 HeroUI 的主題變數或 `--tzuchi-*` 變數（和 S-48 同一條規則）；和色彩模式無關的值（間距、圓角、字級、動態）可以直接讀 `--tc-*`，並給後備值。
  - 這個元件需要自己的 token 時，加在 `packages/tokens/src/component/<元件名>.tokens.json`，再由 `generate.mjs` 對應成主題變數。
  - 相依套件 `@heroui/react`、`@heroui/styles`、`@tzuchi/tokens` 用 `workspace:*`，新增的外部套件遵守第 11.1 節。
  - Storybook 用同一個（`heroui/storybook`），要改兩處，都是 `heroui/` 裡的 `LOCAL CHANGE`，都要記入 `heroui/NOTICE.md`：`.storybook/main.ts` 的 stories 加上 `packages/ui` 的路徑；`heroui/storybook/styles/globals.css` 加上指向 `packages/ui/src` 的 `@source`（今天它只掃 `heroui/react/src/components`），並 `@import` `packages/ui/styles` 的 CSS。
  - 使用 kit 的網站也要在自己的 Tailwind 設定對 `@tzuchi/ui` 加 `@source`，並載入它的 CSS。
- S-65　**優化 HeroUI 的元件**（加變體、加零件或加行為）。只調整外觀的不算優化，照 S-48 在慈濟主題的覆寫檔裡改。優化依序選第一個做得到的方法：〔提案，待工程確認〕
  1. 在 `packages/ui` 做一個包裝或延伸的元件，裡面組合 HeroUI 的元件（例如用 HeroUI 的 Card 加 RadioGroup 做「可勾選卡片」），用我們自己的名稱匯出。HeroUI 原本的元件和變體保持不動。
  2. 只有在外面真的做不到時（例如 HeroUI 的錯誤、HeroUI 沒有開放的介面），才在 `heroui/` 裡改，標 `LOCAL CHANGE` 並列入 `heroui/NOTICE.md`；這類 PR 一定要工程核可。
- S-66　理由：`heroui/` 保持接近上游，日後才能照 `heroui/MAINTAINING.md` 的方法比對上游、手動挑選修正；我們的元件集中在一個地方，授權（我們的程式和 Apache-2.0 的 HeroUI）也分得清楚。〔提案，待工程確認〕

### 8.6 「優化」與「新增」

- S-67　**優化**：HeroUI 已經部分對應的元件，在它的基礎上補齊或延伸（照 S-65 的順序）。HeroUI 原本的屬性和變體名稱一律保留。〔提案，尚未實作〕
- S-68　**新增**：HeroUI 完全沒有的元件，加進 kit（照 S-64）。〔提案，尚未實作〕
- S-69　一個優化或新增的元件，要全部符合下列條件才算完成：〔目標〕
  1. PR 寫明第幾級（第三級才是新元件）和理由。
  2. 程式放在第 8.5 節的位置；改到 `heroui/` 的地方都有 `LOCAL CHANGE` 和清單記錄。
  3. 顏色只來自主題變數；需要的元件 token 在 `packages/tokens/src/component/` 定義一次。
  4. 變體依用途命名，每個選項 4 到 5 個值以內。
  5. 在 Default 主題和每一個已有的主題下，淺色和深色都正常。
  6. 無障礙：文字對比至少 4.5:1、鍵盤可以操作並看得到焦點、互動元素都有可讀的名稱（第 11.4 節）。
  7. 介面文字用繁體中文；不發出任何第三方請求。
  8. Storybook 有 stories，涵蓋每個變體和主要狀態（停用、錯誤、載入中等適用的狀態）。
  9. 手冊有元件頁，照第 9.5 節的結構。
  10. 第 5 節的檢查全部通過。
  11. 優化的元件另外確認：HeroUI 原本的用法不受影響。
  12. 照第 4 節核可（暫定：外觀由美編（設計），程式由工程；待決定 Q2）。

### 8.7 路線圖與待辦清單

依 2026-11-16 的缺口比對（Astryx 的 116 個元件家族：HeroUI 有對應 43、部分對應 24、完全沒有 49），有 73 項要處理。

- S-70　部分對應的 24 項，做「優化」；完全沒有的 49 項，做「新增」。〔目標〕
- S-71　內容網站大多用不到的項目（例如聊天、程式碼編輯、圖表、後台工具類）也收進來，但放在待辦清單，不排進目前的批次。〔目標〕
- S-72　73 項在路線圖裡各佔一列，一項都不能省略；重複的項目（例如舊版匯出的 InfoTip、新舊兩代的 Chart）也各佔一列，並註明和哪一列重複。〔目標〕
- S-73　每一項動工前，仍要做第 8.2 節的判斷。依專案負責人「沒有就添加」的決定，路線圖上的每一項都做成 kit 的元件；內部可以直接用 Tailwind 工具類別實作的（路線圖第 10 節），做成很薄的一層元件，Tailwind 是實作方式，不是取代元件。某一項想改成「不做元件」，要由專案負責人決定。〔目標〕
- S-74　路線圖是和本文同一批提出的另一份文件：`docs/component-roadmap.md`（同內容的資料檔 `docs/component-roadmap.json`）。路線圖的排序和批次由專案負責人決定；本文只定分類規則。〔目標〕

---

## 9. 手冊規格

### 9.1 現況（事實）

- `apps/docs` 是 Astro 5.18.2 + Starlight 0.34.8。手冊分成首頁、文件、元件、範本、主題五個區域：3 個基礎頁、22 個元件頁、範本總覽（4 個範本，每個在對話框裡預覽，第 9.8 節）和 2 個主題頁。
- 頁首（`apps/docs/src/components/starlight/Header.astro`）有「主題」選單（`apps/docs/src/components/handbook/SiteMenu.astro`；手機選單裡是 `SiteSelect.astro` 的下拉選單）和「色彩模式」按鈕（`ColorModeToggle.astro`，淺色和深色兩者切換）。主題的資料在 `apps/docs/src/data/site-themes.ts`：只有 Default 主題是正式的，Green Natural 主題是示意（顏色寫在手冊裡，不在 `packages/tokens`）。
- 元件頁照第 9.5 節的六段排列，但介紹的仍是凍結的 Lit `tc-*` 元件；Storybook 還沒有這些元件的頁面。
- 手冊頁面不載入第三方資源（`scripts/docs/handbook.test.mjs` 檢查原始檔）。
- `pnpm run docs:build` 建置 tokens 和手冊；它是推之前的檢查之一（S-16）。

本節的規定標了各自的狀態；標〔部分〕或〔目標〕的，修改手冊時仍然必須做到。

### 9.2 五個區域

- S-75　手冊分五個區域：**首頁**、**文件**、**元件**、**範本**、**主題**。頁首有這五個區域的導覽；側欄只顯示目前所在區域的頁面。〔現行；範本區域沒有側欄（S-113）〕

| 區域 | 內容 |
| --- | --- |
| 首頁 | 這套 kit 是什麼、從哪裡開始讀 |
| 文件 | 基礎 Foundations、語意色、字級、間距等設計原則；用詞說明 |
| 元件 | 元件總覽和每個元件一頁（第 9.5 節） |
| 範本 | 用元件組成的頁面範例：一頁總覽，每個範本在對話框裡預覽（第 9.8 節） |
| 主題 | 主題總覽，以及每個主題一頁：名稱、和預設不同的地方、各元件的預設變體 |

### 9.3 頁首的選單

- S-76　頁首有「主題」選單和「色彩模式」按鈕；頁首的排列見手冊規則 R-H-02。〔現行〕
- S-77　「主題」選單列出所有主題，預設是 Default，按鈕的名稱（給螢幕閱讀器）是「主題：<目前的主題名稱>」；「色彩模式」按鈕在淺色和深色之間切換，讀者按過之前跟隨作業系統。兩者互相獨立。〔現行；這是專案負責人指定的做法，Q12 的「跟隨系統」只在讀者按過之前有效〕
- S-78　選單和按鈕的用詞照第 2 節：叫「主題」和「色彩模式」，不叫「Theme」「網站主題」或「外觀」。〔現行〕

### 9.4 一次只看一個主題

- S-79　每一頁都只顯示頁首選定的那一個主題。〔現行〕
- S-80　假設未來有 10 到 20 個主題：內容不可以排成每個主題一個分頁、一欄或一個框。要看別的主題，就在頁首切換。〔現行〕
- S-81　「主題」區域的總覽可以列出所有主題（清單或表格，一個主題一列），每個主題各有自己的一頁；這是目錄，不是並排比較。〔現行〕

### 9.5 元件頁的結構

- S-82　給一般讀者的元件頁，依序有這六段：〔部分：22 個元件頁都有這六段；第 5 段各網站的預設變體要等網站設定檔，淺色、深色並排的範例只有按鈕頁有；第 6 段沒有 Storybook 連結，因為 Storybook 還沒有這些元件的頁面；「該做與不該做」是草稿，待美編（設計）確認〕
  1. **預覽**：真的元件，不是截圖，用目前選定的主題和色彩模式顯示。
  2. **用法**：什麼時候用、什麼時候不用。
  3. **組成**：元件由哪些部分組成。
  4. **該做與不該做**。
  5. **在目前主題下的樣子**：這個主題的預設變體和與預設不同的地方。
  6. **給工程師**：屬性、程式範例、連到 Storybook 的對應頁。

### 9.6 字級

- S-83　手冊的字級用以下這組精簡的刻度：〔現行：`apps/docs/src/styles/type-scale.css`〕

| 用途 | 字級 | 行高 |
| --- | --- | --- |
| 內文、表格 | 14px | 22px |
| 側欄、頁首、卡片的標籤 | 14px（子項目 13px） | — |
| 小標籤 | 12px | — |
| 頁面標題 | 32px | — |
| h2 | 22px（總覽頁的分類標題 18px） | — |
| h3 | 17px | — |
| 首頁主標題 | 48px | — |
| 副標題 | 16px | — |
| 程式碼 | 13px | — |

這組字級只用於手冊本身的版面；元件本身的字級由 tokens 和 `DESIGN-LANGUAGE.md` 決定。

### 9.7 內容規則

- S-84　手冊對外公開，只放設計內容。共編流程、電腦準備放在 repo 的 `CONTRIBUTING.md`。〔部分：電腦準備只在 `CONTRIBUTING.md`；手冊的「如何參與修改」頁有角色、五個步驟和三級判斷的摘要，要不要保留這一頁待專案負責人決定〕
- S-85　手冊顯示的色票和數值由 tokens 產生（S-5），淺色和深色的值都要看得到。〔部分：Default 主題的色票從 tokens 的原始 JSON 算出來，淺色和深色都看得到，但還不是讀建置產物；示意的 Green Natural 主題用手冊裡自訂的綠色〕
- S-86　手冊頁面不發出任何第三方請求（S-98）；範例圖片放在 repo 裡。〔現行〕
- S-87　手冊的本機預覽只用 `pnpm run docs:dev`（127.0.0.1:4321）。〔現行〕

### 9.8 範本區域

- S-113　範本區域只有一頁總覽，沒有側欄：標題、分類篩選、範本卡片格線。卡片的縮圖是範本本身；滑鼠移上或用鍵盤選到時疊上名稱、兩行說明和「預覽」。按卡片打開預覽對話框：名稱、分類、「示意」、寬度切換（桌機 1280／平板 768／手機 390 px）、主題選單和色彩模式按鈕、上一個／下一個、關閉，下方列出使用的元件。範本在 iframe 裡用選的寬度排版，跟著頁首的主題和色彩模式變。打開時網址加上 `?t=<id>`，可以分享，「上一頁」會關閉；舊網址 `/templates/<id>/` 轉到這裡。細節見手冊規則 R-H-17 到 R-H-19。〔現行〕

---

## 10. Storybook

- S-88　Storybook 是給工程師的元件展示，放在 `heroui/storybook`；本機預覽只用 `pnpm run heroui:storybook`（127.0.0.1:6007）。〔現行〕
- 今天的 Storybook：
  - 收錄 HeroUI 的全部 stories，預設開在慈濟主題（淺色）。
  - 已關掉遙測、新功能通知和錯誤回報；HeroUI 的標誌、外部連結、React Scan 和 Google Fonts 都已移除（記錄在 `heroui/NOTICE.md`）。
  - 有無障礙檢查外掛（`@storybook/addon-a11y`），但沒有設成必須通過的關卡。
  - `heroui/react/src` 裡 16 個 story 檔和 `heroui/storybook/.storybook` 裡 4 個展示檔，仍從 HeroUI 的圖片主機（`heroui-assets.nyc3.cdn.digitaloceanspaces.com`、`img.heroui.chat`）載入圖片（上游原本就有）。
- S-89　Storybook 的工具列要改成兩個獨立的選單：「主題」和「色彩模式」，和手冊一致。HeroUI 原廠的淺色／深色外觀可以留給工程比對，但要和我們的主題（今天只有 Default）分開標示。〔提案，待工程確認〕
- S-90　我們自己的元件（第 8.5 節）也放進同一個 Storybook，每個變體和主要狀態各有 story。〔提案，待工程確認〕
- S-91　Storybook 不新增任何外部資源；既有從第三方載入的圖片，改成 repo 裡的圖片（待辦）。〔部分〕
- S-92　Storybook 和手冊什麼時候、部署到哪裡，待決定（第 13 節 Q3）。在那之前，只有本機預覽。〔目標〕

---

## 11. 工程守則

### 11.1 供應鏈

- S-93　新版本的套件要發布滿 14 天才會被選用（`pnpm-workspace.yaml` 的 `minimumReleaseAge: 20160`）。安全修正不滿 14 天時，用 `minimumReleaseAgeExclude` 指定精確版本，由工程核可並註明 GHSA 編號。〔現行〕
- S-94　新增和升級的相依套件一律寫精確版本（不寫 `^`、`~`）。今天 root、`packages/tokens` 和 `apps/docs` 的 `package.json` 還有 `^` 範圍（實際版本由 `pnpm-lock.yaml` 決定），要逐步改成精確版本。〔部分〕
- S-95　`pnpm-lock.yaml` 是實際版本的依據：CI 和檢查用 `pnpm install --frozen-lockfile`，lockfile 的變更和造成它的 `package.json` 變更放在同一個 commit；審 PR 時要看 lockfile 的 diff。〔現行〕
- S-96　允許執行安裝腳本的相依套件只列在 `onlyBuiltDependencies`，清單保持最小。〔現行〕
- S-97　Claude Code 不自行安裝新的相依套件或補裝缺少的套件；需要時先說明理由，由工程決定。工程同意後用 `pnpm add`／`pnpm update`，不手改 lockfile。〔現行（規則）：R-S-26〕

說明：頁面編輯器 repository 的舊共編設計記錄，Style Dictionary 4.4.0（本 repo 目前鎖定的版本）有一則 high 等級的安全公告（GHSA-vj5c-m527-mpff），4.x 沒有修正版。本文沒有重新查證；升級列為工程的待辦。

### 11.2 第三方請求

- S-98　交付的頁面（網站、手冊、Storybook）和開發工具都不發出第三方請求：不載入外部字型、分析、CDN 腳本、外部圖片，也不送遙測。〔部分〕
- S-99　開發工具的遙測和更新檢查一律關掉：Astro 經由 `scripts/dev/astro.mjs`、`scripts/dev/docs.mjs` 執行；Storybook 經由 `scripts/dev/storybook.mjs` 執行，並在 `.storybook/main.ts` 關掉遙測。〔現行〕

### 11.3 本機預覽與程序

- S-100　本機預覽只綁 127.0.0.1，而且只用 repo 的啟動腳本；不直接跑 `heroui/storybook` 或 `apps/docs` 的 `dev` 指令（它們不檢查埠，也不關遙測）。〔現行〕
- S-101　埠被占用時，啟動腳本直接停止並說明，不換埠，也不接管別人的程序。開之前先確認埠沒有被占用。〔現行〕
- S-102　Claude 記下自己開的程序的 PID，結束時只用 `kill <PID>` 停掉它；不用 `pkill`、`killall` 或依名稱結束程序，不停別人的程序。〔現行〕
- S-103　Claude Code 不從 shell 執行 `wrangler` 或任何部署指令，不執行 `changeset publish`、`npm publish`、`pnpm publish`。〔現行〕

### 11.4 無障礙

- S-104　文字和背景的對比至少 4.5:1。Claude 算出這次改到的組合的對比，寫進 PR（`docs/rules/02-design-rules.md` R-D-14）。〔部分〕
- S-105　所有互動元素都能用鍵盤操作，而且看得到焦點。〔部分〕
- S-106　所有互動元素和表單欄位都有可讀的名稱或標籤；只有圖示的按鈕要有文字標籤給螢幕閱讀器。〔部分〕

說明：今天已知不符合的地方（記在 `heroui/MAINTAINING.md`）：次要文字色 `color.text.muted`（`#828282`）在白底只有 3.84:1，在淺灰底 3.62:1；白字在錯誤色上 4.32:1、在成功色上 4.37:1。這些是美編（設計）的決定，見第 13 節 Q6。

### 11.5 介面文字

- S-107　我們做的介面文字（手冊、我們的元件、Storybook 的工具列和說明）一律用繁體中文（台灣用語）。程式碼、指令和專有名詞維持原文。HeroUI 上游的 stories 內容維持原樣。〔部分〕

### 11.6 公開的 repository

- S-108　這個 repository 是公開的。repo 裡不放任何祕密（金鑰、`.env`、CI 變數、登入資訊），Claude Code 也不讀取、不印出、不 commit 它們。〔現行〕
- S-109　repo 裡不寫個人姓名、電子郵件、內部主機名稱、本機路徑（例如某台電腦上的使用者目錄路徑）或其他個人資料；人員只寫角色（S-6）。〔目標〕
- S-110　repo 裡沒有「不公開」的檔案：放進 repo 的每個檔案，任何人都看得到。〔目標〕

### 11.7 vendored HeroUI

- S-111　`heroui/NOTICE.md` 只寫授權和修改清單，會隨 Storybook 一起提供；維護筆記寫在 `heroui/MAINTAINING.md`。〔現行〕
- S-112　`heroui/` 的修改依 S-47；從上游取修正時手動挑選，不整個覆蓋這個目錄（`heroui/MAINTAINING.md`）。〔現行〕

---

## 12. 現況對照表

「證明」欄是可以打開看的檔案。沒有檔案可以證明的，就是尚未實作。本表反映本批修改（本文、路線圖、`docs/rules/`、`CLAUDE.md`、`CONTRIBUTING.md`、PR 範本等）合併之後的狀態；「已實作（規則）」表示規則已經寫下，但沒有機器檢查。

| 規定 | 狀態 | 證明或缺什麼 |
| --- | --- | --- |
| S-1 一套 kit | 尚未實作 | 今天只有 Default 主題；沒有其他正式的主題，也沒有防止複製的檢查 |
| S-2 固定用詞 | 部分 | 規則：`docs/rules/02-design-rules.md` R-D-01 到 R-D-03；手冊照這套用詞（`apps/docs/src/content/docs/docs/glossary.mdx`）；但 Storybook 工具列叫 Theme；舊的 `.gitlab/` 範本和 `.gitlab-ci.yml` 用 MR |
| S-3 單向資料流 | 已實作 | `packages/tokens/build.mjs`、`heroui/styles/themes/tzuchi/generate.mjs` |
| S-4 variables.css 不手改 | 已實作 | `generate.mjs`；SOP R-S-10、R-S-11 和步驟 4 的同步檢查；`.gitlab-ci.yml` 的 build job |
| S-5 手冊與 Storybook 不手抄值 | 部分 | Storybook 讀 `tokens.css` 和產生的 HeroUI 慈濟主題；手冊的 `ColorSwatches.astro` 等元件讀原始 JSON 自己組變數名，不是讀 tokens 的產物 |
| S-6 只寫角色 | 部分 | 檔案裡的姓名已在本批改成職稱（`CONTRIBUTING.md`、`.gitlab/merge_request_templates/Default.md`、`pnpm-workspace.yaml`）；**git 歷史裡仍有**姓名、電子郵件和內部主機名稱（待決定 Q10） |
| S-7、S-8 核可分工 | 部分 | `docs/rules/01-co-editing-sop.md` 第 1 節、`CONTRIBUTING.md` 的角色表；只是約定，沒有機器強制 |
| S-9 兩類都要核可、CODEOWNERS | 部分 | PR 範本有「需要核可」；沒有 CODEOWNERS |
| S-10 main 受保護、只用 merge commit | 尚未實作 | repo 還在自架 GitLab；GitHub 的保護設定尚未建立 |
| S-11 Claude 不合併、不部署、不推 main 和 tag | 部分 | SOP R-S-20 到 R-S-22；`.claude/settings.json` 擋 `wrangler`、含 `publish` 的指令、`gh pr merge`、`gh pr review --approve`、`gh release`、推到 `main`、推 tag 和 force push，其他 `git push` 要詢問（防止手滑，不是安全邊界）；GitHub 的分支保護尚未設定 |
| S-12 從最新 main 開分支 | 已實作（規則） | SOP R-S-07 |
| S-13 分支名稱 | 已實作（規則） | SOP R-S-08 |
| S-14、S-51 問第幾級並寫進 PR | 已實作（規則） | `docs/rules/02-design-rules.md` R-D-30 和第 7 節的問題；PR 範本的「屬於哪一級」 |
| S-15 一起更新用到的地方 | 已實作（規則） | SOP R-S-09、R-S-45 |
| S-16 推之前的檢查 | 已實作 | SOP R-S-11；`packages/tokens/check.mjs`；`scripts/dev/lib.test.mjs`；`scripts/docs/handbook.test.mjs`；root `package.json` 的 `docs:build` |
| S-17 說明要看的主題與色彩模式 | 已實作（規則） | SOP R-S-13；PR 範本的「請看哪幾頁」 |
| S-18 確認後才 commit、推之前再問 | 已實作 | SOP R-S-14；`.claude/settings.json` 的 `ask: git push*` |
| S-19 commit 訊息 | 已實作 | SOP R-S-15；`.claude/settings.json` 的 `Bash(* publish*)` |
| S-20 PR 範本 | 已實作 | `.github/pull_request_template.md`（舊的 `.gitlab/` 範本留著，不再引用） |
| S-21 用共編者帳號開 PR | 已實作（規則） | SOP R-S-16（`gh pr create` 或瀏覽器）；GitHub repository 尚未建立，`origin` 仍指向舊的 GitLab（R-S-44） |
| S-22 CI | 尚未實作 | GitHub Actions 沒有；`.gitlab-ci.yml` 是舊的自架 GitLab 流程，不是今後的做法 |
| S-23 drill 分支不推 | 已實作（規則） | SOP R-S-31 |
| S-24 基礎只新增 | 已實作（規則） | `docs/rules/02-design-rules.md` R-D-06；沒有機器檢查 |
| S-25 用參照 | 部分 | 語意色與元件 token 都用參照；深色由 `check.mjs` 檢查；淺色和元件層沒有機器檢查 |
| S-26 元件 token 只定義一次 | 部分 | `packages/tokens/src/component/` 33 個檔，沒有重複的元件名（2026-11-16 查過）；沒有機器檢查 |
| S-27 新增、改值照流程 | 已實作（規則） | R-D-10 |
| S-28 深色只覆寫語意與陰影 | 已實作 | `packages/tokens/src/themes/dark/`、`style-dictionary.dark.config.mjs`、`check.mjs` |
| S-29 一份 tokens.css | 已實作 | `packages/tokens/build.mjs` |
| S-30 命名 | 已實作 | `style-dictionary.config.mjs`（`prefix: 'tc'`）；`check.mjs` 的必備變數 |
| S-31 不改名、不刪除 | 已實作（規則） | R-D-09、R-S-23；沒有機器檢查 |
| S-32 一次套用命名規範 | 尚未實作 | 命名規範尚未提出 |
| S-33 改名保護 | 尚未實作 | 沒有名稱登記檔，也沒有檢查 |
| S-34 到 S-39 主題的檔案 | 尚未實作 | 沒有 `packages/tokens/src/sites/` |
| S-40 主題只指有名字的外觀 | 部分 | 見 S-2 |
| S-41 自由組合 | 尚未實作 | 今天只有 `tzuchi`／`tzuchi-dark` 一組 |
| S-42 預設是 Default | 已實作 | `packages/tokens/src/` 的值；Storybook 預設開在 `tzuchi`（`heroui/storybook/.storybook/addons/theme/constants.ts`） |
| S-43 只設在 `<html>` | 已實作（規則） | R-D-16；`heroui/styles/themes/tzuchi/index.css` 的說明 |
| S-44 屬性名稱 | 尚未實作 | 待決定（Q4） |
| S-45 每個主題產生主題變數 | 尚未實作 | `generate.mjs` 只產生 `tzuchi`、`tzuchi-dark` |
| S-46 一次一個主題 | 部分 | 手冊一次只顯示頁首選的那一個主題（`apps/docs/src/components/handbook/SiteOnly.astro`、`apps/docs/src/data/site-selection.ts`）；還沒有網站實際選用主題 |
| S-47 LOCAL CHANGE | 已實作 | `heroui/NOTICE.md` 的修改清單 |
| S-48 外觀用覆寫檔 | 已實作 | `heroui/styles/themes/tzuchi/components/index.css`（68 個覆寫檔） |
| S-49 Lit 凍結 | 已實作 | SOP R-S-30；root `package.json` 的 `build`、`test` 只跑 `@tzuchi/tokens` |
| S-50 到 S-54 三級判斷 | 已實作（規則） | `docs/rules/02-design-rules.md` 第 7 節；沒有機器檢查 |
| S-55 網站專案放哪裡 | 尚未實作 | 待決定（Q1） |
| S-56 變體依用途命名 | 尚未實作 | 還沒有我們自己新增的變體 |
| S-57、S-58 變體名稱不改 | 已實作（規則） | R-D-21、R-S-24 |
| S-59 4 到 5 個值 | 尚未實作 | — |
| S-60 主題的預設變體 | 尚未實作 | 沒有 `site.json` |
| S-61、S-62 版本 | 尚未實作 | — |
| S-63 發行號碼未使用 | 已實作 | 所有套件都是 `private`；`@tzuchi/tokens` 是 `0.0.0` |
| S-64 到 S-66 元件放哪裡 | 尚未實作 | 沒有 `packages/ui` |
| S-67 到 S-69 優化、新增、完成條件 | 尚未實作 | — |
| S-70 到 S-74 路線圖 | 已實作 | `docs/component-roadmap.md`、`docs/component-roadmap.json`（73 列；兩檔一致只靠人工檢查） |
| S-75 到 S-83 手冊結構、選單、元件頁、字級 | 部分 | 五個區域：`apps/docs/astro.config.mjs`、`apps/docs/src/data/sections.ts`、`apps/docs/src/route-data.ts`；選單：`apps/docs/src/components/starlight/ThemeSelect.astro`、`apps/docs/src/components/handbook/SiteSelect.astro`；元件頁的六段：`scripts/docs/handbook.test.mjs` 檢查標題順序；字級：`apps/docs/src/styles/type-scale.css`。缺：元件頁的預設變體（沒有網站設定檔）、Storybook 的對應頁；主題的屬性 `data-site` 是提案（Q4） |
| S-84 手冊只放設計內容 | 部分 | 電腦準備和完整的共編流程在 `CONTRIBUTING.md` 和 `docs/rules/`；手冊的 `apps/docs/src/content/docs/docs/contributing.mdx` 是流程的摘要，要不要保留待專案負責人決定 |
| S-85 色票由 tokens 產生 | 部分 | `apps/docs/src/components/ColorSwatches.astro`、`ThemeSwatches.astro` 讀原始 JSON |
| S-86 手冊零第三方請求 | 已實作 | 範例圖片改成色塊；`scripts/docs/handbook.test.mjs` 擋下 `apps/docs/src` 裡允許清單以外的外部網址；建置後的 `apps/docs/dist` 沒有外部請求（人工檢查） |
| S-87 手冊預覽 | 已實作 | `scripts/dev/docs.mjs` |
| S-88 Storybook 預覽 | 已實作 | `scripts/dev/storybook.mjs` |
| S-89 兩個選單 | 尚未實作 | `constants.ts` 只有一個 Theme 選單 |
| S-90 我們的元件進 Storybook | 尚未實作 | — |
| S-91 Storybook 不載外部資源 | 部分 | 沒有新增；但 16 個 story 檔和 4 個展示檔（例如 `heroui/storybook/.storybook/components/colors-demo/component-showcase.tsx`）仍載入第三方圖片 |
| S-92 部署 | 尚未實作 | 待決定（Q3） |
| S-93 14 天冷卻期 | 已實作 | `pnpm-workspace.yaml` 的 `minimumReleaseAge: 20160` |
| S-94 精確版本 | 部分 | `heroui/*/package.json` 是精確版本；root、`packages/tokens`、`apps/docs` 有 `^` |
| S-95 lockfile | 已實作 | `.gitlab-ci.yml` 用 `--frozen-lockfile`；`pnpm-workspace.yaml` 的說明 |
| S-96 安裝腳本白名單 | 已實作 | `pnpm-workspace.yaml` 的 `onlyBuiltDependencies` |
| S-97 不自行安裝相依套件 | 已實作（規則） | SOP R-S-26 |
| S-98 不發第三方請求 | 部分 | 手冊已做到（S-86）；Storybook 還沒有（S-91） |
| S-99 關掉遙測 | 已實作 | `scripts/dev/astro.mjs`、`docs.mjs`、`storybook.mjs`；`heroui/storybook/.storybook/main.ts` |
| S-100、S-101 127.0.0.1、不換埠 | 已實作 | `scripts/dev/lib.mjs`（`HOST`、`checkPortFree`、`launch`） |
| S-102 只用 PID 停程序 | 已實作 | SOP R-S-12；`.claude/settings.json` 擋 `pkill`、`killall` |
| S-103 不部署、不發布 | 已實作 | SOP R-S-21；`.claude/settings.json` |
| S-104 到 S-106 無障礙 | 部分 | Storybook 有 `@storybook/addon-a11y`；慈濟主題做過焦點與對比的檢查（`heroui/styles/themes/tzuchi/gap-audit/`）；已知對比不足見 `heroui/MAINTAINING.md`；沒有必須通過的自動檢查 |
| S-107 繁體中文 | 部分 | `CLAUDE.md` 開頭；Storybook 歡迎頁是中文，工具列的 Light、Dark 是英文 |
| S-108 不放祕密 | 已實作 | SOP R-S-28；`.gitignore` 排除 `.claude/settings.local.json` |
| S-109 不寫個人資料 | 部分 | 檔案裡的姓名、內部主機名稱（`.gitlab-ci.yml` 開頭）和 `gap-audit/` 13 個報告的本機路徑已在本批移除；SOP R-S-47 要求 commit 前看 `git diff --cached`；git 歷史仍有（Q10） |
| S-110 沒有不公開的檔案 | 已實作 | `heroui/MAINTAINING.md` 開頭已改成「不隨 Storybook 提供，但一樣公開」；SOP R-S-28 |
| S-111 NOTICE 與 MAINTAINING 分工 | 已實作 | `heroui/NOTICE.md`、`heroui/MAINTAINING.md` |
| S-112 手動挑選上游修正 | 已實作 | `heroui/MAINTAINING.md`「Looking at upstream later」 |
| S-113 範本區域 | 已實作 | `apps/docs/src/components/handbook/TemplateGallery.astro`（卡片和預覽對話框）、`apps/docs/src/pages/templates/frame/[id].astro`（畫面頁）、`apps/docs/src/pages/templates/[id].astro`（舊網址的轉址頁）；`scripts/docs/handbook.test.mjs` 檢查範本目錄、範本元件和兩個網址一致；互動是 puppeteer 人工檢查 |

---

## 13. 待決定事項

以下由專案負責人回答，每一項附上建議。

**Q1　網站自己的程式碼放哪裡？**
選項：放進本 repository；或每個網站一個自己的專案。
建議：**每個網站各自一個專案**，本 repository 只放共用的 kit 和各個主題的檔案（S-34）。理由：kit 是公開的，網站的業務程式和設定不一定能公開；各網站的上線時程不同；第三級中只屬於一個網站的元件本來就留在網站專案裡（S-54）。

**Q2　誰核可？要不要用 CODEOWNERS 強制？**
已決定的只有兩條：token 名稱與值、命名規則、手冊設計內容由美編（設計）核可；建置、CI、工具由工程核可。第 4 節表格「暫定」那一欄（元件外觀、元件程式碼、相依套件、`heroui/`、規則與本文、路線圖批次）要專案負責人確認。
建議：**照暫定那一欄定下來**，並**用 CODEOWNERS，加上 GitHub 的「需要 Code Owners 核可」分支保護**，負責人寫 GitHub 的團隊（以角色命名，例如美編團隊、工程團隊），不寫個人帳號。分法：`packages/tokens/src/**`、`apps/docs/src/content/**` → 美編團隊；`package.json`、`pnpm-lock.yaml`、`pnpm-workspace.yaml`、`scripts/**`、CI 設定、`heroui/**`、`packages/ui/**`（若採用）→ 工程團隊。元件的外觀另由美編團隊核可。合併權限只給專案負責人指定的人。GitHub 的公開 repository 可以使用分支保護和 CODEOWNERS。

**Q3　部署到哪裡？**
建議：**先建 GitHub Actions 的 CI（只做檢查，不部署），部署目標之後再定**。部署時手冊和 Storybook 放在同一個網站（Storybook 在 `/storybook/` 之下），同一個 commit 一起建置，避免一新一舊。部署用的金鑰只給 `main` 的部署工作使用。在那之前只有本機預覽。`.gitlab-ci.yml` 和它的部署流程，等 GitHub 的 CI 建好後移除。

**Q4　程式碼裡主題和色彩模式的屬性名稱？**
今天：`tokens.css` 用 `data-theme="dark"`／`"light"`（沒設時跟隨作業系統）；HeroUI 慈濟主題用 `data-theme="tzuchi"`／`"tzuchi-dark"`，把主題和色彩模式併在一起。
建議：**主題用 `data-site="<id>"`，色彩模式繼續用 `data-theme="light"`／`"dark"`**（沒設時跟隨作業系統），兩個都只設在 `<html>`。理由：`tokens.css` 和 HeroUI 上游都已經把 `data-theme="dark"` 當成深色，改動最少；主題和色彩模式分成兩個屬性，才能自由組合（S-41）。代價：慈濟主題的選擇器、Storybook 工具列和頁面編輯器（tceditor）都要跟著改，工程要先確認 HeroUI 原廠外觀（`heroui/styles/themes/default/`，HeroUI 自己的 default 主題，不是我們的 Default）的選擇器不會蓋過慈濟主題。

**Q5　我們自己的元件放在 repo 的哪裡？**
建議：照第 8.5 節，**新增 `packages/ui`**，優化 HeroUI 元件時依 S-65 的順序，`heroui/` 只在外面做不到時才改。待工程確認。

**Q6　次要文字色對比不足**
`color.text.muted` 指向 `color.gray.700`（`#828282`），白底 3.84:1，低於 4.5:1；它也用在所有欄位的提示文字。白字在錯誤色（`#D4494F`）上 4.32:1、在成功色（`#168967`）上 4.37:1，也略低於 4.5:1。
建議：由美編（設計）決定。一個不必改基礎值的做法：讓 `color.text.muted` 改指向已有的 `color.gray.750`（`#6B6B6E`，白底 5.31:1、淺灰底 5.00:1），這只是改語意色的值，照 S-24 和 S-27 可以做。錯誤色和成功色是品牌色的決定，需要新增較深的基礎色（S-24），不修改既有的值。

**Q7　頁面編輯器（tceditor）何時整合？**
專案負責人已決定整合延後。建議：**維持延後**；在那之前照 S-57、S-58 不改任何變體名稱，頁面編輯器自己同步 kit 的快照。整合時再訂同步方式和頁面資料裡存的名稱。

**Q8　基礎值抄錯時怎麼更正？**
S-24 規定基礎只新增、不修改。但如果某個基礎值當初就抄錯（和設計稿不符），新增一個再全部改指過去會很繞。
建議：**允許「更正」作為例外**：PR 要寫明原本的設計稿值、受影響的語意色和元件、所有主題下的畫面，由美編（設計）核可。除了更正，一律照 S-24。

**Q9　舊版 v1 什麼時候可以移除？**
建議：照 S-62，**確認沒有網站和頁面資料使用後才移除**；改名保護（S-33）建好後，用同一套「先棄用、後移除」的檢查。

**Q10　git 歷史裡的個人資料怎麼處理？**
本批已把檔案裡的姓名、內部主機名稱和本機路徑移除，但 git 歷史（舊版的 `CONTRIBUTING.md`、`CLAUDE.md`，以及每一筆 commit 的作者電子郵件）仍然有。直接把這個 repository 推上公開的 GitHub，這些都會公開。
建議：**從一份清理過的快照開始新的歷史**（一個新的初始 commit，作者用不含個人電子郵件的帳號），舊的歷史只留在內部。這要在推上 GitHub 之前決定。

**Q11　PR 能不能附預覽截圖？**
今天的規則是不附（S-20）。核可人可以在自己電腦上開預覽（R-S-43），但要先裝好環境。
建議：**可以附只截頁面內容的截圖**（不含瀏覽器網址列、桌面和其他分頁）；kit 本身的畫面公開沒有問題。

**Q12　色彩模式要不要有「跟隨系統」？**
今天 `tokens.css` 沒有設定時跟隨作業系統，HeroUI 慈濟主題不跟隨。手冊規則 R-H-03 只寫了淺色和深色。
建議：**要，而且設為預設**；選單有「跟隨系統」「淺色」「深色」三個選項。

**Q13　廠商用 fork 還是直接推分支？**
建議：**給廠商寫入權限，搭配 `main` 的保護**（只能經由 PR、由人合併），流程和其他人一樣；由工程決定。

---

## 14. 與舊文件的關係

### 14.1 本文取代的部分

| 文件 | 本文取代的部分 | 仍然有效的部分 |
| --- | --- | --- |
| `docs/superpowers/specs/2026-06-15-tzuchi-uikit-design-system-design.md` | 以 Lit Web Components 為單一來源的段落（2026-10-21 已加註）；§5.10 主題化（舊文件的用語，由本文第 6、7 節取代）；§9 Storybook（改為 `heroui/storybook`）；§14 治理中 Changesets 發布、`access: public`、npm 發布、PR 流程的段落（由第 4、5 節取代；套件目前不發布） | §5.1 到 §5.3 對 tokens 格式、三層和命名的說明，作為今天 tokens 的背景 |
| `docs/superpowers/plans/2026-06-15-tzuchi-uikit-m1a.md` | 全部（已完成的 Lit 第一階段計畫，只留作紀錄） | — |
| `docs/superpowers/specs/2026-09-22-gitlab-ci-cloudflare-staging-design.md` | 全部：自架 GitLab 的 CI 和部署不是今後的做法。GitHub Actions 的 CI 尚未建立，部署目標待決定（Q3） | 檔案留作紀錄，等新 CI 建好後再決定是否移除 |
| 頁面編輯器（tceditor）repository 裡 2026-10-21 的共編機制設計（不在本 repo） | 角色表（改成只寫角色）、MR 與自架 GitLab 的流程、部署設計 | 改名保護的做法（S-33 的來源）；手冊數值從 tokens 產物產生的原則（S-5） |

不受影響、繼續有效的文件：`heroui/NOTICE.md`（授權與修改清單）、`heroui/MAINTAINING.md`（維護筆記）、`heroui/styles/themes/tzuchi/DESIGN-LANGUAGE.md`（元件外觀的細部規則）、`heroui/styles/themes/tzuchi/gap-audit/`（慈濟主題稽核紀錄）。

### 14.2 現有檔案要改的地方

下列檔案已經在本批（和本文、路線圖、`docs/rules/` 同一批）處理：`CLAUDE.md`、`CONTRIBUTING.md`、新增的 `.github/pull_request_template.md`、`.gitlab/merge_request_templates/Default.md`（姓名改成職稱；檔案留著，不再引用）、`pnpm-workspace.yaml`（姓名改成「工程」、「審 MR」改成「審 PR」）、`.claude/settings.json`（加上擋下合併、核可、推 `main`、推 tag、force push 的規則）、`heroui/MAINTAINING.md`（開頭改成「不隨 Storybook 提供，但一樣公開」）、`heroui/styles/themes/tzuchi/gap-audit/` 的 13 個報告（移除本機路徑）、`.gitlab-ci.yml` 第一行（移除內部主機名稱）。

**推上公開的 GitHub 之前必須完成**：Q10（git 歷史）。`.gitlab-ci.yml` 還寫著舊 GitLab 的群組編號和部署設定，不是祕密，但和今後的做法無關，建議在 GitHub 的 CI 建好時一起移除。

其餘列出來供後續的 PR 處理：

| 檔案 | 要改什麼 | 依據 |
| --- | --- | --- |
| `.gitlab-ci.yml` | GitHub Actions 的 CI 建好後移除；移除前不再修改它的部署流程 | S-22、Q3 |
| `apps/docs/src/content/docs/index.mdx` | 刪掉「以 Lit Web Components 為單一來源」的說法 | S-3 |
| `apps/docs/src/content/docs/foundations/theming.mdx` | 「淺色與深色兩套主題」改成「色彩模式」 | S-40 |
| `apps/docs/src/content/docs/components/*.mdx`（5 頁） | 範例圖片改成 repo 裡的圖片〔已完成：改成色塊〕 | S-86 |
| `heroui/storybook/.storybook/addons/theme/constants.ts` | 工具列拆成主題和色彩模式（`LOCAL CHANGE`） | S-89 |
| `packages/tokens/package.json`、`apps/docs/package.json`、root `package.json` | `^` 範圍改成精確版本 | S-94 |
