# 共編指南

這份指南寫給一起修改慈濟 CIS UIKit 的人：怎麼準備電腦，怎麼透過 Claude Code 修改 token、元件和手冊，改完怎麼讓負責的人看過再合併。

**必須遵守的共編規則在 [`docs/rules/`](docs/rules/README.md)。** Claude Code 每次開始工作都會自動讀到它們（`CLAUDE.md` 匯入了這些檔案），所以你不必記規則，用口語說要改什麼就好；但請先讀一次 [`docs/rules/01-co-editing-sop.md`](docs/rules/01-co-editing-sop.md)，知道 Claude 會怎麼做、什麼事它會先停下來問你。裡面程式碼框的指令是給 Claude Code 的，你不必看懂。

要做哪些元件、目前做到哪裡，看 [`docs/component-roadmap.md`](docs/component-roadmap.md)。

## 名詞說明

- **repository（儲存庫，也簡稱 repo）**：放這套 UIKit 所有檔案和修改紀錄的地方，放在 GitHub 上。你的電腦上有一份它的複本。
- **分支（branch）**：一份複本，用來做一次修改，不影響正式版本。正式版本叫 `main`。
- **commit**：把目前的修改存成一筆紀錄，附一句說明。
- **推（push）**：把你電腦上的分支傳上 GitHub，別人才看得到。
- **PR（pull request，合併請求）**：在 GitHub 上請大家看你的修改，核可後由有權限的人併進 `main`。
- **核可（approve）**：負責的角色在 PR 上表示「這樣可以」。
- **合併（merge）**：把 PR 的修改併進 `main`。只有人可以做，Claude Code 不做。
- **token**：設計的基本值（顏色、間距、圓角等），有名稱，例如 `color.brand.primary`。
- **本機預覽**：只在你自己電腦上打開的網頁，網址是 `http://127.0.0.1:…`，別人打不開。
- **連接埠（port）**：網址冒號後面的數字（例如 4321），一個數字同時只能給一個程式用。
- **Storybook**：給工程師看的元件展示頁；**手冊**：給一般讀者看的設計說明網站。
- **檢查**：Claude 在你電腦上跑的自動測試，確認修改沒有弄壞東西。
- **vendored**：直接放進本 repository 的一份外部程式碼（這裡是 HeroUI）；**`LOCAL CHANGE`**：我們對那份外部程式碼做的修改，每一處都要記錄。

## 角色與核可

| 角色         | 核可什麼（已決定）                         | 核可什麼（暫定，待決定）                                     |
| ------------ | ------------------------------------------ | ------------------------------------------------------------ |
| 美編（設計） | token 的名稱和值、命名規則、手冊的設計內容 | 元件的視覺設計和外觀                                         |
| 工程         | 建置、CI、工具                             | 元件程式碼、相依套件、`heroui/` 原始檔的修改                 |
| 廠商         | —                                          | 用同一套流程參與共編；要不要核可、核可什麼，由專案負責人另訂 |
| 專案負責人   | —                                          | 共編規則和整體規格的修改、路線圖的批次調整                   |
| Claude Code  | 不核可，**不合併**                         | —                                                            |

- 每個修改都經過 GitHub 的 PR（pull request），由負責的角色核可，再由有合併權限的人用 merge commit 合併。`main` 不能直接修改。
- 一個 PR 同時改到兩類內容時，兩個角色都要核可。
- 「暫定」那一欄還要專案負責人決定（整體規格第 13 節 Q2）。
- GitHub Actions 的 CI 還沒有建立。在那之前，Claude Code 在你電腦上跑的檢查就是合併前唯一的關卡。

## 電腦準備

第一次可以請 Claude Code 協助安裝（它會先說明每一個指令再執行）。

1. 一個 GitHub 帳號，並能推分支到本 repository、開 PR。repository 的網址和權限請問工程；沒有權限時，請工程把你加進 repository，或照工程的說明用 fork。
2. Node 22.22 以上。目前建議 Node 24，也可以用 Node 26。
3. 用 corepack 安裝 pnpm：`corepack enable pnpm`。版本由 `package.json` 的 `packageManager` 決定，corepack 會檢查它的雜湊。Node 25 起不再內建 corepack，用 Node 26 時先執行 `npm install -g corepack`。
4. 安裝 Claude Code。
5. GitHub CLI（`gh`）可以讓 Claude Code 直接開 PR；每台電腦要不要裝，由工程決定。沒有裝的話，Claude Code 會給你網址，在瀏覽器裡開 PR。

把 repository 複製到你的電腦（clone）可以請工程或 Claude Code 協助。之後在 repository 根目錄執行：

```sh
pnpm install --frozen-lockfile
pnpm --filter @tzuchi/tokens build
```

第二行先建一次 tokens：產物在 git 忽略的 `packages/tokens/dist/`，手冊要讀它。

## 一次修改的流程

1. **說要改什麼**：在 repository 目錄開 Claude Code，用口語說要改什麼。例如：「次要文字的灰色太淺了，調深一點」「卡片要多一種『精選』樣式」「把路線圖的 R-010 分頁圓點改成設計中」。設計需求，Claude 會先問你這屬於第幾級（只有顏色等數值不同、同一個元件換排列、還是別的網站沒有的新東西）。
2. **Claude 修改**：Claude 先抓最新的 `main`，開一條新分支（`tokens/…`、`docs/…`、`components/…`、`theme/<網站>-…`），照 `docs/rules/` 修改，並一起更新所有用到它的地方。
3. **Claude 檢查並開預覽**：Claude 在你的電腦上跑檢查（tokens 的建置和檢查、HeroUI 慈濟主題 `variables.css` 的同步、測試和格式），開本機預覽，告訴你要看哪幾頁、要選哪個網站主題和色彩模式。你確認，或請 Claude 再改。
4. **確認後開 PR**：你明確說「可以 commit」或「好，開 PR」後，Claude commit、推分支並開 PR。推之前 Claude Code 會問你一次，請確認後再允許。PR 說明用白話寫：改了什麼、哪些畫面會變、請看哪幾頁、屬於哪一級、檢查結果。
5. **核可與合併**：負責的角色在 GitHub 上看過並核可，再由有合併權限的人合併。Claude Code 不合併、不部署、不推 `main`、不推 tag。

- **要核可別人的 PR**：在你自己電腦的 repository 目錄開 Claude Code，說「幫我開 PR #<編號> 的預覽」。Claude 會取下那個 PR、跑檢查、開預覽，告訴你 PR 說明裡寫的頁面；它不會在那裡修改任何東西。
- 合併後，如果改到 token 或 HeroUI 的樣式，合併的人告訴頁面編輯器（tceditor）的維護者，由他們同步。
- 部署目標還沒決定；合併後目前不會自動更新任何網站。
- 你的要求和規則衝突時，Claude 會說明是哪一條規則，請你找專案負責人決定。規則本身也可以改：照同樣的流程開 PR，由專案負責人核可。

## 你可以這樣跟 Claude 說

不必記指令，用口語說就好。下面是一些例子，以及 Claude 會怎麼回應。

**美編（設計）**

- 「次要文字的灰色太淺了，幫我調深一點，白底對比要到 4.5:1。先給我看預覽。」
  → Claude 開 `tokens/muted-text-contrast`，建議讓 `color.text.muted` 改指向已有的較深灰色（改語意色，不改基礎值），算出新的對比、跑檢查、開預覽，告訴你要看哪幾頁的淺色和深色。
- 「卡片要多一種『精選』樣式，用在首頁最上面那一則。」
  → Claude 問你這是第二級（同一個元件的變體）嗎，確認名稱依用途命名（「精選」`featured`），再看路線圖的 Card 那一列。
- 「環保網的按鈕要比入口網更圓。」
  → Claude 判斷是第一級（只有 CSS 值不同），並告訴你：網站主題的檔案還沒有實作，要先請工程確認做法。

**工程**

- 「幫我把所有推之前的檢查跑一遍，告訴我哪裡沒過。」
- 「Storybook 的 Theme 選單要拆成『網站主題』和『色彩模式』兩個。」
  → 這要改 `heroui/` 的原始檔（`LOCAL CHANGE`）。你是工程，Claude 說明影響的檔案，得到你明確同意後，開 `build/storybook-site-and-mode-toolbars`，改完把修改記進 `heroui/NOTICE.md`。
- 「想把 Style Dictionary 升級，先幫我查新版本發布滿 14 天沒有，列出要改哪些檔案，先不要動。」

**廠商**

- 「我要開始做路線圖上的 R-011 Carousel，告訴我開工前要準備什麼。」
  → Claude 列出路線圖那一列、要先有美編的設計、元件放哪裡還待工程確認，以及完成條件。
- 「把 R-010 PageControl 的狀態改成『設計中』。」
  → Claude 開 `docs/roadmap-page-control-status`，同時改 `component-roadmap.md` 和 `.json`。
- 「這個按鈕的英文 variant 名稱不好懂，幫我改成中文。」
  → Claude 說明變體名稱用過就不能改（R-S-24），中文名只顯示在手冊和介面上，請你找美編（設計）或專案負責人討論。

## 本機預覽

```sh
pnpm run docs:dev           # 手冊：http://127.0.0.1:4321
pnpm run heroui:storybook   # Storybook（元件展示頁）：http://127.0.0.1:6007
```

- 兩者分開跑，所以本機手冊上連到 `/storybook/` 的連結會失效；Storybook 請直接開 http://127.0.0.1:6007。
- 只在自己的電腦上開（127.0.0.1），別人連不進來。
- 連接埠已經被占用時，腳本會直接停止並說明，不會換到別的連接埠。先停掉占用它的程序（如果是你開的），再重跑一次。
- 按 Ctrl+C 停止。

Windows 也用同樣的指令。
