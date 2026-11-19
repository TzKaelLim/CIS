# 慈濟 CIS UIKit 元件路線圖

這份文件列出慈濟 CIS UIKit 在 HeroUI 現有元件之外，日後要「優化」或「新增」的元件，並把它們分成第一批、第二批和待辦清單。所有慈濟網站共用同一套元件庫，這裡列的每個元件做好之後，每個網站都能用。

同一份資料也存成 `docs/component-roadmap.json`（一個物件一個元件），之後的工具和手冊會讀它。**兩個檔案在同一個 PR 裡一起修改，內容必須一致**；請 Claude Code 修改時，它會兩個一起改。

最後更新：2026-11-16。

「元件庫」「kit」在這份文件裡都指慈濟 CIS UIKit。

## 1. 怎麼讀這份文件

- **每一列是一個元件**，共 73 列。編號（R-001 到 R-073）固定不變：元件換到別的階段，編號也不改。
- 第 7 到 9 節是三張表：第一批、第二批、待辦。每張表再依分類分成小表。
- 欄位：

| 欄位 | 意思 |
|---|---|
| 編號 | R- 開頭的固定編號 |
| 元件 | 英文名（沿用比對清單裡的名稱，只作識別）和中文名 |
| 一句說明 | 這個元件是做什麼的 |
| 動作 | 「優化」：HeroUI 有一部分，在它上面補；「新增」：HeroUI 完全沒有，要自己做 |
| 要做的事 | 優化：寫出以哪個 HeroUI 元件為底、要補哪些部分；新增：寫出新元件的範圍 |
| 理由（判斷） | 為什麼放在這一批，以內容網站（入口網、新聞、電子書、年報、環保網）用不用得到來判斷 |
| 可參考的既有東西 | HeroUI 現有的零件、凍結的舊 Lit 元件（`tc-*`，只參考不修改）、Tailwind 工具類別 |
| 元件 token | `packages/tokens/src/component/` 裡已有的檔案，或「待新增」；很薄、只用 Tailwind 實作的寫「不需要（判斷）」 |
| 狀態 | 未開始、設計中、實作中、已完成；目前全部是「未開始」 |

- **標「判斷」的是人的判斷，不是查證過的事實**：「理由」欄、各列的「階段」，以及「要做的事」裡以「判斷：」開頭的句子都是判斷，可以討論、可以改。「動作」不是判斷，它直接來自比對結果（見第 2 節）。
- 「重複」：有兩列是同一個元件的另一個名字，保留下來只為了讓清單完整，見第 3 節。
- 新加的項目從 R-074 往後編，不重用編號；現有的列一列都不刪（`docs/rules/03-component-rules.md` R-C-02）。

## 2. 原則：接近的就優化、沒有就添加、用不到的也列入但先放待辦

這份清單來自 Astryx（Meta 的元件庫）和我們採用的 HeroUI v3 的逐項比對。**我們不採用 Astryx**；它的元件清單只用來檢查我們的元件庫可能還缺什麼。Astryx 有 116 個元件家族：

- HeroUI 有對應的 43 個：不在這份路線圖裡。它們已經是 HeroUI 元件，套用慈濟主題（`heroui/styles/themes/tzuchi/`）就能用。
- HeroUI **只有部分對應**的 24 個 → 動作是 **「優化」**：以最接近的 HeroUI 元件為底，補上缺的部分。
- HeroUI **完全沒有**的 49 個 → 動作是 **「新增」**：在我們的元件庫裡新增元件。
- 內容網站大多用不到的（偏應用程式、AI 對話、開發工具的）**也列進來，但放在待辦清單**，不放進正在進行的第一批、第二批。需要時再提前。

## 3. 數量

依動作：

| 動作 | 數量 |
|---|---|
| 優化（HeroUI 只有部分對應） | 24 |
| 新增（HeroUI 完全沒有） | 49 |
| 合計 | 73 |

依階段：

| 階段 | 優化 | 新增 | 合計 |
|---|---|---|---|
| 第一批 | 4 | 14 | 18 |
| 第二批 | 13 | 7 | 20 |
| 待辦 | 7 | 28 | 35 |
| 合計 | 24 | 49 | 73 |

重複的有 2 列：R-035 InfoTip (lab) 與 R-034 是同一個元件；R-068 Chart (lab, legacy) 與 R-067 是同一個元件。扣掉重複，實際要做的是優化 23 項、新增 48 項。

## 4. 第一批怎麼選的（判斷）

第一批是「內容網站最先需要的」，共 18 項，規模以一個小團隊做得完為準。挑選方式：

1. 先想一個典型的內容網站頁面（入口網首頁、一則新聞、一本電子書、年報的一章），列出畫面上一定會出現、而 HeroUI 沒有的東西。
2. 依這個順序收進來：
   - 頁面骨架與導覽：R-001 AppShell、R-006 TopNav、R-007 SideNav、R-008 MobileNav、R-009 Outline。
   - 圖片：R-004 AspectRatio、R-010 PageControl、R-011 Carousel、R-018 Lightbox。
   - 文章內容：R-013 Blockquote、R-014 Citation、R-015 Timestamp、R-017 MetadataList。
   - 版面與卡片：R-002 Section、R-003 Grid、R-005 LineClamp、R-012 Card。
   - 上面這些都要用到的圖示：R-016 Icon。
3. 會一起用的放同一批，避免各做一套：Carousel 和 PageControl、TopNav 和 MobileNav、AppShell 和它的零件。
4. 其中 R-003 Grid、R-004 AspectRatio、R-005 LineClamp 內部可以直接用 Tailwind 實作（見第 10 節），仍然各做成一個很薄的 kit 元件；工作量主要是把規則（比例、欄數、行數）定下來、寫進手冊。
5. 差一點就進第一批的是 R-029 Overlay（圖上壓字）和 R-022 Stat（年報的數字）：如果第一批的輪播、卡片或年報網需要，可以提前。

## 5. 狀態怎麼改變、誰來改

每個元件依序經過四個狀態：

| 狀態 | 意思 | 怎麼進到這個狀態 |
|---|---|---|
| 未開始 | 還沒有人動手 | 所有項目的起點 |
| 設計中 | 美編（設計）正在做這個元件的視覺設計 | 美編開始設計時 |
| 實作中 | 視覺設計已由美編核可，工程或廠商正在實作 | 美編核可設計後 |
| 已完成 | 實作的 PR 已合併進 `main` | 由人合併 PR 時 |

- **新元件的視覺設計一律先由美編（設計）提供，核可之後才開始實作。** 優化項目如果會改變外觀，也一樣。
- **狀態、階段和內容的修改，都和其他修改一樣，透過 PR 進行，由人請 Claude Code 來改**，沒有人直接手改這兩個檔案。步驟：
  1. 用口語告訴 Claude Code 要改什麼，例如「R-010 分頁圓點改成設計中」「把 Overlay 提前到第一批」。
  2. Claude Code 從最新的 `main` 開一條新分支，同時改 `component-roadmap.md` 和 `component-roadmap.json`。
  3. Claude Code 在本機跑檢查，告訴你要看哪幾行。
  4. 你確認後，Claude Code commit、推分支，開一個用白話寫的 PR（改了什麼、為什麼）。
  5. 由負責的角色核可，再由人合併。**Claude Code 不合併、不推 `main`。**
- 「實作中 → 已完成」通常不必另開 PR：在實作這個元件的 PR 裡一起把狀態改成「已完成」，PR 合併時就完成了。
- 核可（已決定）：元件 token 的名稱和值、命名規則、手冊的設計內容由美編（設計）核可；建置、CI 和工具由工程核可。
- 核可（暫定，待決定）：元件的視覺設計由美編（設計）核可、元件程式碼由工程核可、哪一列放第一批、第二批或待辦由專案負責人核可。完整的分工表在 `docs/rules/01-co-editing-sop.md` 第 1 節；要不要用 CODEOWNERS 強制，見第 12 節。
- 要開始做待辦清單上的一項，先開一個 PR 把那一列移到第一批或第二批（`docs/rules/03-component-rules.md` R-C-04）。移動一列時，一起更新第 3 節的數量表、各節標題的項目數和 `.json` 的 `counts`。
- 目前 GitHub Actions 的 CI 還沒有建好，合併前的檢查是 Claude Code 在本機跑的。

「已完成」的條件是規則，不是建議：見 `docs/rules/03-component-rules.md` 第 5 節（R-C-30 到 R-C-42）。重點是程式和 Storybook 範例、元件 token 只定義一次、手冊的元件頁、無障礙（對比至少 4.5:1、鍵盤、標籤）、繁體中文介面文字、不從外部載入任何東西。

## 6. 每個元件動手前要先回答的事

這些規則適用於路線圖裡的每一個元件。Claude Code 在設計或實作時會先問清楚，並把答案寫進 PR。

- **各網站要不一樣時，依序考慮三個層級：**
  1. 只有 CSS 的值不同（顏色、圓角、陰影、邊框、字級、間距）：網站選用（或新增）一個主題，由主題覆寫語意色；還不夠時，才覆寫這個元件的元件 token。所以每個新元件要把「網站可能想改的值」都做成元件 token。
  2. 內容相同、結構或排版不同（例如圖在上或圖在左）：做成同一個元件的「變體 variant」，再由網站設定檔設定這個網站的預設變體。
  3. 資料或行為不同，也就是別的網站沒有的東西：新元件。通用的直接放進元件庫；只屬於某個網站業務的，先留在那個網站自己的專案，等第二個網站也需要時再移進元件庫。
  - 絕不為了某個網站複製一份元件。網站不用某個元件，就什麼都不必做。
  - 主題的檔案（`packages/tokens/src/sites/<id>/`）是**提案，尚未實作**；目前只有預設主題 Default 和它的深色模式（手冊裡的 Green Natural 主題只是示意）。
- **變體 variant 以用途命名**（例如「精選」，不是「大紅框」）。名稱一旦用了就不改名、不刪除，只能新增；每個選項大約 4–5 個值為限，更多通常表示其實是另一個元件。原因：網站和頁面編輯器會把這些名稱存進頁面資料。HeroUI 元件現有的 variant 名稱也一樣不可改。
- **token 不改名、不刪除**：改名保護（先棄用、後移除，由程式檢查）做好之前，誰都不改 token 名稱、不刪 token；新增 token 和修改值可以。美編的命名規範之後會一次套用。
- **用詞**：「基礎 Foundations」是所有網站共用的基礎級距（只新增、不修改）；「語意色」；「元件 token」；「主題」指一組有名字的外觀設定（預設是 Default；Green Natural 是示意），一個網站選用一個主題；「色彩模式」指淺色／深色，不叫主題；「版本」只用整數（v1、v2），只在不相容的重新設計時才升。
- **新套件**：先用 workspace 和 lockfile 裡已有的套件；需要新的外部套件時先問工程，版本要發布滿 14 天，寫精確版本；不加會從外部載入資源的套件（`docs/rules/03-component-rules.md` R-C-20）。

## 7. 第一批（18 項）

內容網站最先需要的元件。

### 版面 Layout（5）

| 編號 | 元件 | 一句說明 | 動作 | 要做的事 | 理由（判斷） | 可參考的既有東西 | 元件 token | 狀態 |
|---|---|---|---|---|---|---|---|---|
| R-001 | **AppShell**<br>整頁外框 | 整頁的固定骨架：「跳到主要內容」連結、頁首、主內容區、頁尾，手機版的導覽抽屜。 | 新增 | 新增一個外框元件，把 TopNav（R-006）、MobileNav（R-008）、頁尾和主內容區組在一起；第一個可聚焦的元素是「跳到主要內容」連結。 | 每個慈濟網站（入口網、新聞、電子書、年報、環保網）都要同一套頁面骨架，先做好，其他元件才有地方放。<br>備註：與 Layout（R-019）的五區版面有重疊，設計時一起決定分工。 | HeroUI：Drawer（手機抽屜）、Surface<br>舊 Lit：tc-navbar、tc-footer、tc-container（零件，沒有整合外框）<br>Tailwind：`min-h-dvh`、`grid`、`sticky` | 待新增（零件可沿用 `navbar.tokens.json`、`footer.tokens.json`、`container.tokens.json`） | 未開始 |
| R-002 | **Section**<br>頁面區段 | 頁面上的一段區塊：背景色、上下分隔線、可分別調整的上下內距。 | 優化 | **優化對象：HeroUI Surface**<br>補上：依 space token 分級的上下內距、上／下分隔線、內容寬度（接 container 的寬度規則）、背景色選項（以用途命名，例如「強調」「淡底」）。 | 首頁、年報、環保網的頁面都是一段一段的區塊堆起來的，每段的間距和底色要一致。<br>備註：查證時由「完全沒有」改判為「部分對應」（Surface 的對應很薄，接近沒有）。 | HeroUI：Surface（只有背景色）、Separator<br>舊 Lit：tc-container（只管寬度與左右內距）<br>Tailwind：`py-*`、`border-t`、`border-b`、`max-w-*` | 待新增（寬度與左右內距可參考 `container.tokens.json`） | 未開始 |
| R-003 | **Grid**<br>格線版面 | CSS 格線版面，欄數依螢幕寬度調整。 | 新增 | 新增一個 kit 元件 Grid（很薄的一層，內部用 Tailwind grid 實作）：提供兩種固定模式「固定欄數＋手機欄數」和「依最小欄寬自動排滿」（都是 tc-grid 已有的做法），間距只接受 space token 的級距。 | 新聞清單、電子書書櫃、卡片牆都靠它排版；先把欄數和間距的規則定下來，各站才會一致。 | 舊 Lit：tc-grid（columns、mobile-columns、min-col-width、gap）<br>Tailwind：`grid`、`grid-cols-*`、`gap-*`、`grid-cols-[repeat(auto-fit,minmax(240px,1fr))]` | `grid.tokens.json` | 未開始 |
| R-004 | **AspectRatio**<br>固定長寬比 | 固定長寬比的框，內容可裁切、置中。 | 新增 | 新增一個 kit 元件 AspectRatio（很薄的一層，內部用 Tailwind aspect-* 實作），只接受網站用的幾種比例（建議 16:9 主圖、4:3 卡片圖、1:1 頭像、3:4 書封，由美編確定），寫進手冊；Carousel、Card、Lightbox 都用它，比例才會一致。 | 內容網站的圖片很多，比例不統一畫面會很亂；這件事工作量小，但要先於輪播和卡片定好。 | Tailwind：`aspect-video`、`aspect-square`、`aspect-[4/3]`、`object-cover` | 不需要（判斷）；若美編希望各主題能改比例，再新增 | 未開始 |
| R-005 | **LineClamp**<br>多行截斷 | 文字超過 N 行就以「…」截斷，被截斷時才提供完整文字。 | 優化 | **優化對象：HeroUI Typography**<br>在 HeroUI Typography 的單行截斷（truncate）之外，補上「行數」選項（例如 1、2、3 行）與「被截斷時才顯示完整文字」的提示。內部用 Tailwind line-clamp-* 實作；做成選項的價值是統一各卡片的行數與提示做法。 | 新聞卡片的標題和摘要、書卡的書名都需要截斷，舊 Lit 卡片已經用了 2、3 行截斷。<br>備註：查證時由「完全沒有」改判為「部分對應」。 | HeroUI：Typography（只能截成一行）<br>舊 Lit：tc-article-card（標題 2 行、摘要 3 行）、tc-book-card（1、2 行）<br>Tailwind：`line-clamp-1～line-clamp-6`、`truncate` | 不需要（判斷） | 未開始 |

### 導覽 Navigation（5）

| 編號 | 元件 | 一句說明 | 動作 | 要做的事 | 理由（判斷） | 可參考的既有東西 | 元件 token | 狀態 |
|---|---|---|---|---|---|---|---|---|
| R-006 | **TopNav**<br>頂部導覽列 | 網站頂部的導覽列：左（站名標誌）中（主要導覽）右（搜尋、語言等），可有下拉選單與大型選單，手機版收成抽屜。 | 新增 | 新增元件（HeroUI v3 已沒有 Navbar）。以 tc-navbar 的版面為起點，補上下拉選單、大型選單（mega menu）、目前頁面的標示；手機版交給 MobileNav（R-008）。 | 每個網站的第一眼；入口網的選單項目多，需要下拉與大型選單。 | HeroUI：Dropdown、Link、Drawer<br>舊 Lit：tc-navbar（brand／actions 區、brand／light 變體、sticky、手機抽屜）<br>Tailwind：`sticky`、`flex` | `navbar.tokens.json` | 未開始 |
| R-007 | **SideNav**<br>側邊導覽 | 可收合的直式側邊導覽，支援巢狀項目。 | 新增 | 新增元件：直式連結清單、可展開的子項目、目前頁面的標示、可整個收合。 | 文件型頁面、電子書目錄、年報的章節都需要側邊導覽。 | HeroUI：Disclosure、Accordion（巢狀收合）、Link<br>舊 Lit：無（tc-navbar 只在手機版收成直式）<br>Tailwind：`sticky`、`overflow-y-auto` | 待新增 | 未開始 |
| R-008 | **MobileNav**<br>手機版導覽 | 手機版全螢幕導覽抽屜和開關按鈕。 | 優化 | **優化對象：HeroUI Drawer**<br>補上：開關按鈕（有無障礙標籤與展開狀態）、依螢幕寬度自動切換成抽屜、抽屜內的導覽項目排版；導覽項目資料與 TopNav（R-006）共用。 | 內容網站大部分讀者用手機看，導覽在手機上一定要好用。 | HeroUI：Drawer（NavigationDrawer 範例）、Button（純圖示）<br>舊 Lit：tc-navbar 的手機抽屜<br>Tailwind：`md:hidden`、`hidden md:flex` | `navbar.tokens.json`（已有 drawer-bg、drawer-elevation、toggle-bg-hover） | 未開始 |
| R-009 | **Outline**<br>本頁目錄 | 同一頁各標題的連結清單，捲動時標出目前讀到的段落。 | 新增 | 新增元件：從頁面標題產生目錄、點選跳到該段、捲動時標出目前段落。 | 長篇報導、年報、電子書章節都很長，讀者需要知道自己讀到哪裡、能跳到想看的段落。 | HeroUI：Link<br>Tailwind：`sticky`、`top-*` | 待新增 | 未開始 |
| R-010 | **PageControl**<br>分頁圓點 | 輪播下方表示目前第幾張的小圓點。 | 新增 | 新增元件，和 Carousel（R-011）一起做：圓點代表張數、目前張數的標示、可點選跳張、有無障礙標籤。 | 輪播少不了它；和 Carousel 同一批做才不會各做一套。 | 舊 Lit：無（tc-pagination 是數字分頁） | 待新增（可參考 `pagination.tokens.json` 的選取色與焦點外框） | 未開始 |

### 容器 Container（2）

| 編號 | 元件 | 一句說明 | 動作 | 要做的事 | 理由（判斷） | 可參考的既有東西 | 元件 token | 狀態 |
|---|---|---|---|---|---|---|---|---|
| R-011 | **Carousel**<br>輪播 | 一排可橫向捲動的項目，有吸附、上一張／下一張按鈕，可循環。 | 新增 | 新增元件：橫向捲動與吸附、上一張／下一張按鈕、搭配 PageControl（R-010）。預設不自動播放（無障礙）；判斷：若網站堅持自動播放，必須有暫停鈕。 | 入口網首頁的主視覺、活動與專題推薦都用輪播，是內容網站最常見的元件之一。 | HeroUI：ScrollShadow（捲動邊緣淡出）、Button<br>Tailwind：`overflow-x-auto`、`snap-x`、`snap-mandatory`、`snap-start` | 待新增 | 未開始 |
| R-012 | **Card**<br>卡片 | 卡片容器；另有可點擊卡片（ClickableCard）和可勾選卡片（SelectableCard）。 | 優化 | **優化對象：HeroUI Card**<br>在 HeroUI Card 上補「可點擊卡片」：整張卡片是一個連結、滑鼠移到上面時陰影加深、鍵盤焦點外框。「可勾選卡片」併入 SelectableCardGroup（R-038，第二批）。HeroUI Card 現有的變體名稱不改。 | 新聞卡、書卡、活動卡幾乎都是「點整張卡片進入內頁」。 | HeroUI：Card（default、secondary、tertiary、transparent 四種變體）<br>舊 Lit：tc-card（interactive 與 href 兩種可點擊模式）、tc-article-card、tc-book-card | `card.tokens.json`（已有 elevation-hover、focus-ring-color） | 未開始 |

### 內容 Content（4）

| 編號 | 元件 | 一句說明 | 動作 | 要做的事 | 理由（判斷） | 可參考的既有東西 | 元件 token | 狀態 |
|---|---|---|---|---|---|---|---|---|
| R-013 | **Blockquote**<br>引言 | 引言區塊，可附出處。 | 新增 | 新增元件：引文本身加上出處（人名、書名或場合）；HeroUI 目前只替 typography-prose 內的原生 `<blockquote>` 套文章樣式。 | 新聞與專題文章常引述法語或受訪者的話，需要統一的引言樣式。 | HeroUI：Typography（typography-prose 內的 blockquote 樣式）<br>Tailwind：`border-s-4`、`ps-*` | 待新增 | 未開始 |
| R-014 | **Citation**<br>出處標記 | 行內的出處標記（文字或編號），連到資料來源或註腳。 | 新增 | 新增元件：行內編號或短文字，點選可到註腳或外部來源；外部連結要能看出是外部網站。 | 年報、專題報導需要標示資料來源與註腳。 | HeroUI：Link、Chip<br>舊 Lit：tc-link<br>Tailwind：`align-super`、`text-xs` | 待新增 | 未開始 |
| R-015 | **Timestamp**<br>日期時間 | 用統一格式顯示日期與時間，可選時區。 | 新增 | 新增元件：輸入一個日期時間，依固定的幾種格式顯示，輸出 `<time datetime="…">`。用哪幾種格式（例如是否用民國年）由美編和內容單位決定。判斷：「即時更新」「滑鼠移到上面可複製」不是內容網站必要，第一版不做。 | 每則新聞的發布日期、每場活動的時間都要顯示，格式要全站一致。<br>備註：格式化用瀏覽器內建的 Intl.DateTimeFormat，不必加套件。 | HeroUI：無（TimeField 是輸入欄位） | 待新增 | 未開始 |
| R-016 | **Icon**<br>圖示 | 用名稱取用圖示，統一尺寸，顏色跟著文字。 | 新增 | 新增圖示元件與圖示清單：用名稱取用、尺寸綁 icon token、顏色跟著文字色、純裝飾時對螢幕報讀器隱藏。圖示的來源（自己畫或選一套開源圖示）由美編決定；圖示要隨程式一起提供，不從 CDN 載入。 | 第一批的導覽、輪播、看大圖都要用圖示（選單、上一張、關閉），要先有一套。<br>備註：低階的 SVGIcon（R-052）放在待辦，做 Icon 時一起評估。 | HeroUI：icons.tsx（只有約 10–15 個元件內部用的 SVG，沒有公開的圖示系統）<br>舊 Lit：tc-icon（內建圖示清單：search、close、menu、chevron-* 等）<br>Tailwind：`size-*` | `icon.tokens.json`（目前只有 size） | 未開始 |

### 表格與清單 Table & List（1）

| 編號 | 元件 | 一句說明 | 動作 | 要做的事 | 理由（判斷） | 可參考的既有東西 | 元件 token | 狀態 |
|---|---|---|---|---|---|---|---|---|
| R-017 | **MetadataList**<br>資訊清單 | 「標籤：值」的資訊清單，例如活動時間、地點、主辦單位。 | 新增 | 新增元件：以 `<dl>` 呈現的標籤與值，可橫排（標籤在左）或直排（手機）。 | 活動頁、電子書的出版資訊、年報的基本資料都需要它。 | Tailwind：`grid`、`grid-cols-[auto_1fr]`、`gap-*` | 待新增 | 未開始 |

### 彈出層 Overlay（1）

| 編號 | 元件 | 一句說明 | 動作 | 要做的事 | 理由（判斷） | 可參考的既有東西 | 元件 token | 狀態 |
|---|---|---|---|---|---|---|---|---|
| R-018 | **Lightbox**<br>看大圖 | 全螢幕看圖片或影片，可上一張／下一張、顯示張數與圖說、縮放。 | 新增 | 新增元件：以 HeroUI Modal 的遮罩與焦點鎖定為底，加上上一張／下一張、張數、圖說、縮放、Esc 關閉。 | 新聞相簿、活動照片、年報圖表都需要點開看大圖。 | HeroUI：Modal（遮罩、焦點鎖定）、CloseButton<br>Tailwind：`object-contain` | 待新增（遮罩可沿用 `modal.tokens.json` 的 scrim） | 未開始 |

## 8. 第二批（20 項）

偶爾用得到的元件：表單、浮動說明、選單，以及清單、樹狀清單、表格的改進。

### 版面 Layout（2）

| 編號 | 元件 | 一句說明 | 動作 | 要做的事 | 理由（判斷） | 可參考的既有東西 | 元件 token | 狀態 |
|---|---|---|---|---|---|---|---|---|
| R-019 | **Layout**<br>五區版面 | 頁面五區版面（頁首、左側、內容、右側、頁尾），側欄可固定寬度、可捲動。 | 新增 | 新增元件；判斷：第一版不做「可拉寬」側欄。 | 文件型頁面、電子書閱讀頁偶爾需要左右側欄；一般內容頁用 AppShell（R-001）加 Section 就夠。<br>備註：查證時由「部分對應」改判為「完全沒有」。與 AppShell 有重疊。 | HeroUI：無（Card、Modal 的 Header／Body／Footer 只是單一容器的分區）<br>Tailwind：`grid`、`grid-cols-[240px_1fr_240px]` | 待新增 | 未開始 |
| R-020 | **FormLayout**<br>表單排版 | 表單欄位的排版：直排、橫排、標籤在左。 | 優化 | **優化對象：HeroUI Form、Fieldset**<br>在 HeroUI Form 與 Fieldset（已有分組與驗證）上補欄位排版：直排、橫排、標籤在左，以及欄位之間的固定間距。 | 報名表、聯絡表單偶爾用到；內容網站的表單通常不多。 | HeroUI：Form、Fieldset（Legend、Group、Actions）、TextField<br>Tailwind：`grid`、`gap-*` | 待新增 | 未開始 |

### 導覽 Navigation（1）

| 編號 | 元件 | 一句說明 | 動作 | 要做的事 | 理由（判斷） | 可參考的既有東西 | 元件 token | 狀態 |
|---|---|---|---|---|---|---|---|---|
| R-021 | **Stepper**<br>步驟指示 | 顯示目前在第幾步（報名、捐款等流程），橫向或直向。 | 新增 | 新增元件：步驟名稱、目前步驟、已完成步驟的標示；手機版改直向。 | 多步驟的報名或捐款流程會用到，但不是每個網站都有。 | 無 | 待新增 | 未開始 |

### 內容 Content（2）

| 編號 | 元件 | 一句說明 | 動作 | 要做的事 | 理由（判斷） | 可參考的既有東西 | 元件 token | 狀態 |
|---|---|---|---|---|---|---|---|---|
| R-022 | **Stat**<br>數據卡 | 指標名稱、大數字，可加漲跌幅。 | 新增 | 新增元件（可用 Card 加 Typography 組成）：指標名稱、大數字、單位、說明或漲跌幅。判斷：漲跌顏色不能是唯一的提示，要有文字或符號。 | 年報網、環保網常用「數字說故事」（例如回收量、受助人數）。 | HeroUI：Card、Typography<br>Tailwind：`tabular-nums` | 待新增 | 未開始 |
| R-023 | **Thumbnail**<br>上傳檔案縮圖 | 上傳檔案的方形預覽縮圖，含載入中、上傳中、移除鈕。 | 新增 | 新增元件，和 FileInput（R-037）一起做。注意它不是一般的圖片元件。 | 只有在網站有上傳功能（報名附件）時才需要。 | HeroUI：Skeleton、Spinner、CloseButton<br>Tailwind：`object-cover`、`size-16` | 待新增 | 未開始 |

### 表格與清單 Table & List（5）

| 編號 | 元件 | 一句說明 | 動作 | 要做的事 | 理由（判斷） | 可參考的既有東西 | 元件 token | 狀態 |
|---|---|---|---|---|---|---|---|---|
| R-024 | **OverflowList**<br>收合清單 | 放不下時只顯示前幾個，其餘收成「+N」。 | 新增 | 新增元件：依寬度或指定數量收合，「+N」可展開或列出其餘項目。 | 卡片上的多個標籤偶爾放不下時用。 | HeroUI：AvatarGroup（只有大頭貼的 +N）、TagGroup、Chip<br>舊 Lit：tc-chip | 待新增 | 未開始 |
| R-025 | **Item**<br>資料列 | 通用的一列：左邊圖片或圖示、標題、說明、右側內容。 | 優化 | **優化對象：HeroUI ListBoxItem、MenuItem**<br>HeroUI 的列只能在 ListBox／Menu 裡用；補一個可單獨使用的資料列（左圖、標題、說明、右側內容），可當連結。 | 下載清單、相關文章清單偶爾會用到。 | HeroUI：ListBoxItem、MenuItem<br>舊 Lit：tc-list-panel（是整個面板，不是單列）<br>Tailwind：`flex`、`gap-*` | 待新增（可參考 `list-panel.tokens.json`） | 未開始 |
| R-026 | **List**<br>清單 | 一般清單（預設不能選取），可拖拉排序。 | 優化 | **優化對象：HeroUI ListBox**<br>HeroUI ListBox 是「可選取」的清單；補上不可選取的豐富清單（用 Item 組成）。判斷：拖拉排序是後台功能，第一版不做。 | 和 Item 一起做；內容網站偶爾需要。 | HeroUI：ListBox<br>舊 Lit：tc-list-panel（不能排序）<br>Tailwind：`divide-y` | 待新增（可參考 `list-panel.tokens.json`） | 未開始 |
| R-027 | **Table**<br>資料表格 | 資料表格。 | 優化 | **優化對象：HeroUI Table**<br>HeroUI Table 已有排序、拉欄寬、勾選、載入更多、虛擬捲動、可展開列；判斷：內容網站要補的是「手機上可橫向捲動或固定第一欄」和「數字欄靠右對齊」。篩選、分組列、欄位設定、批次操作列屬於後台功能，不做。 | 年報、統計頁偶爾會有資料表。 | HeroUI：Table、Pagination<br>Tailwind：`overflow-x-auto`、`sticky`、`tabular-nums` | 待新增 | 未開始 |
| R-028 | **TreeList**<br>樹狀清單 | 樹狀清單（例如多層分類、章節）。 | 優化 | **優化對象：HeroUI Table（ExpandableRows 範例）**<br>HeroUI 只能用表格的可展開列模擬；補一個樹狀清單元件（React Aria 有 Tree，HeroUI 沒有包裝）。 | 電子書的多層章節、多層分類偶爾需要；SideNav（R-007）能涵蓋的話可延後。 | HeroUI：Table 的可展開列、Disclosure | 待新增 | 未開始 |

### 彈出層 Overlay（3）

| 編號 | 元件 | 一句說明 | 動作 | 要做的事 | 理由（判斷） | 可參考的既有東西 | 元件 token | 狀態 |
|---|---|---|---|---|---|---|---|---|
| R-029 | **Overlay**<br>圖上文字層 | 疊在圖片或卡片上的文字或按鈕層，可加暗色遮罩、滑鼠移到上面才出現。 | 新增 | 新增元件：圖片上的文字層與漸層或暗色遮罩，確保文字對比至少 4.5:1。 | 判斷：主視覺上壓字、圖片卡片上壓標題在入口網很常見，若第一批的 Carousel 或 Card 需要，可提前到第一批。<br>備註：查證時由「部分對應」改判為「完全沒有」。 | HeroUI：無（Modal 的背景遮罩用途不同）<br>舊 Lit：tc-article-card（有圖上遮罩色 overlay-bg）<br>Tailwind：`absolute`、`inset-0`、`bg-gradient-to-t` | 待新增（可參考 `article-card.tokens.json` 的 overlay-bg） | 未開始 |
| R-030 | **HoverCard**<br>懸停資訊卡 | 滑鼠移到上面或鍵盤聚焦時出現、可放互動內容的浮動卡片（例如人物或連結預覽）。 | 優化 | **優化對象：HeroUI Popover、Tooltip**<br>HeroUI Popover 要點擊才開，Tooltip 滑鼠移到上面會開但只適合短文字；補一個滑鼠移到上面與鍵盤聚焦都能開、內容可互動的浮動卡片，手機上改成點擊。 | 名詞解釋、人物介紹偶爾會用；手機上沒有「滑鼠移到上面」這個動作，不能放關鍵資訊。 | HeroUI：Popover、Tooltip | 待新增（可參考 `tooltip.tokens.json`） | 未開始 |
| R-031 | **DialogHeroHeader**<br>對話框圖片標頭 | 對話框頂部的滿版圖片，標題在圖下、關閉鈕疊在圖上。 | 優化 | **優化對象：HeroUI Modal**<br>在 HeroUI Modal.Header 上補「圖片標頭」：滿版圖片、標題在圖下、關閉鈕疊在圖上且對比足夠。 | 活動介紹的彈出視窗偶爾會用。 | HeroUI：Modal（Header、CloseTrigger）<br>Tailwind：`aspect-video`、`object-cover` | 待新增（可參考 `modal.tokens.json`） | 未開始 |

### 動作 Action（2）

| 編號 | 元件 | 一句說明 | 動作 | 要做的事 | 理由（判斷） | 可參考的既有東西 | 元件 token | 狀態 |
|---|---|---|---|---|---|---|---|---|
| R-032 | **ContextMenu**<br>右鍵選單 | 按右鍵、鍵盤選單鍵或長按叫出的選單。 | 優化 | **優化對象：HeroUI Dropdown、Menu**<br>HeroUI 的選單只能按一下或長按開啟；補上右鍵與鍵盤選單鍵的開啟方式，選單內容沿用 Menu。 | 內容網站很少用右鍵選單；電子書閱讀器之類的功能可能需要。 | HeroUI：Dropdown、Menu、MenuItem<br>舊 Lit：tc-dropdown | `dropdown.tokens.json` | 未開始 |
| R-033 | **MoreMenu**<br>更多操作選單 | 現成的「⋯」按鈕加選單。 | 優化 | **優化對象：HeroUI Dropdown、Button（純圖示）**<br>把 HeroUI Dropdown 和純圖示 Button 組成現成元件：預設「⋯」圖示、預設無障礙標籤「更多操作」，手機上可改用底部面板。 | 分享、收藏、下載等次要操作偶爾會用。 | HeroUI：Dropdown、Button（isIconOnly）<br>舊 Lit：tc-dropdown、tc-icon-button | `dropdown.tokens.json`、`icon-button.tokens.json` | 未開始 |

### 回饋與狀態 Feedback & Status（3）

| 編號 | 元件 | 一句說明 | 動作 | 要做的事 | 理由（判斷） | 可參考的既有東西 | 元件 token | 狀態 |
|---|---|---|---|---|---|---|---|---|
| R-034 | **InfoTip**<br>說明提示 | 「ⓘ」說明按鈕，滑鼠移到上面或點擊時顯示解釋，支援觸控。 | 優化 | **優化對象：HeroUI Tooltip、Button（純圖示）**<br>把 HeroUI Tooltip、純圖示 Button 和資訊圖示組成現成元件：預設無障礙標籤、觸控時點一下固定顯示、再點一下關閉。 | 表單欄位或數據的補充說明偶爾需要。 | HeroUI：Tooltip、Button、icons.tsx 的 InfoIcon | `tooltip.tokens.json` | 未開始 |
| R-035 | **InfoTip (lab)**<br>說明提示（舊匯出）<br>（重複，見 R-034） | 重複：與 InfoTip 是同一個元件（Astryx lab 套件裡已棄用的舊匯出），不另外做。 | 優化 | **優化對象：HeroUI Tooltip、Button（純圖示）**<br>不另外做；隨 InfoTip 一起完成，狀態跟著 InfoTip 走。 | 保留這一列只是為了讓 73 項清單完整。 | HeroUI：同 InfoTip | `tooltip.tokens.json` | 未開始 |
| R-036 | **StatusDot**<br>狀態圓點 | 可以單獨放的小狀態圓點（例如「報名中」），必須附文字標籤。 | 優化 | **優化對象：HeroUI Badge**<br>HeroUI Badge 的圓點只能掛在別的元素角落；補一個可單獨放在文字前的圓點，顏色不能是唯一提示，一定要附文字或無障礙標籤。 | 活動狀態（報名中、已額滿）偶爾需要。 | HeroUI：Badge（圓點樣式）、Chip<br>舊 Lit：tc-badge（有前置狀態圓點 dot）<br>Tailwind：`size-2`、`rounded-full` | `badge.tokens.json`（已有 dot-size、dot-color） | 未開始 |

### 表單控制項 Form Controls（2）

| 編號 | 元件 | 一句說明 | 動作 | 要做的事 | 理由（判斷） | 可參考的既有東西 | 元件 token | 狀態 |
|---|---|---|---|---|---|---|---|---|
| R-037 | **FileInput**<br>選擇檔案 | 選擇檔案的欄位，有精簡輸入框和拖放區兩種樣式。 | 新增 | 新增元件：React Aria 已有 FileTrigger 與 DropZone，但 HeroUI 沒有包裝；補上兩種樣式、檔案類型與大小限制的說明文字、錯誤訊息，搭配 Thumbnail（R-023）。 | 報名附件、投稿上傳會用到，但不是每個網站都有上傳。 | HeroUI：無（Button、Description、FieldError 可當零件）<br>Tailwind：`border-dashed` | 待新增（可參考 `input.tokens.json`） | 未開始 |
| R-038 | **SelectableCardGroup**<br>可選卡片組 | 一組可以單選或多選的卡片（例如選擇捐款方案）。 | 優化 | **優化對象：HeroUI RadioGroup、CheckboxGroup**<br>補上卡片樣式與選取外框；也涵蓋 Card（R-012）的「可勾選卡片」。 | 捐款方案、報名場次的選擇偶爾會用。 | HeroUI：RadioGroup、CheckboxGroup（DeliveryAndPaymentExample 範例把選項排成卡片）<br>舊 Lit：tc-radio（沒有卡片樣式） | 待新增（可參考 `radio.tokens.json`、`checkbox.tokens.json`、`card.tokens.json`） | 未開始 |

## 9. 待辦清單（35 項）

偏應用程式、AI 對話、開發工具的元件，以及頁面編輯器已經涵蓋的富文字。先列著，需要時再提前，提前一樣走 PR。

### 版面 Layout（3）

| 編號 | 元件 | 一句說明 | 動作 | 要做的事 | 理由（判斷） | 可參考的既有東西 | 元件 token | 狀態 |
|---|---|---|---|---|---|---|---|---|
| R-039 | **Stack**<br>排列 | 把子元素橫向或直向排列並設間距。 | 新增 | 新增一個 kit 元件 Stack（很薄的一層，內部用 Tailwind flex 與 gap 實作），間距只接受 space token 的級距。 | 判斷：Tailwind 已經能做到，做成元件的好處是統一間距級距，但不急，所以放待辦。 | Tailwind：`flex`、`flex-col`、`gap-*` | 不需要（判斷） | 未開始 |
| R-040 | **Center**<br>置中 | 置中容器（雙軸或單軸）。 | 新增 | 新增一個 kit 元件 Center（很薄的一層，內部用 Tailwind 實作），提供雙軸置中和水平置中。 | 判斷：Tailwind 已經能做到，不急，所以放待辦。 | 舊 Lit：tc-container（只有水平置中）<br>Tailwind：`grid place-items-center`、`mx-auto`、`flex items-center justify-center` | 不需要（判斷） | 未開始 |
| R-041 | **Resizable**<br>可調整大小的面板 | 讓面板可以拖拉調整大小（含鍵盤操作）。 | 優化 | **優化對象：HeroUI Table（ColumnResizer）**<br>HeroUI 只有表格欄寬可拖拉；要補的是一般面板的拖拉把手、鍵盤操作與記憶寬度。 | 工具型介面才需要，內容網站用不到。 | HeroUI：Table.ColumnResizer、Table.ResizableContainer | 待新增 | 未開始 |

### 導覽 Navigation（3）

| 編號 | 元件 | 一句說明 | 動作 | 要做的事 | 理由（判斷） | 可參考的既有東西 | 元件 token | 狀態 |
|---|---|---|---|---|---|---|---|---|
| R-042 | **NavIcon / NavHeadingMenu**<br>導覽圖示框／導覽標題選單 | 導覽用的圓形圖示框，以及附在導覽標題上的操作選單。 | 新增 | 新增元件；選單部分可用 Dropdown 組。 | 偏應用程式的側欄導覽才需要。 | HeroUI：Dropdown（選單部分） | 待新增 | 未開始 |
| R-043 | **NavigationStack**<br>逐層進入的畫面導覽 | 手機 App 式的逐層進入畫面，有返回鈕和滑動返回。 | 新增 | 新增元件。 | 手機 App 的導覽方式，網站用不到。 | 無 | 待新增 | 未開始 |
| R-044 | **TabBar**<br>底部分頁列 | 手機 App 式的底部分頁列。 | 新增 | 新增元件。 | 手機 App 的導覽方式，網站用不到。 | HeroUI：無（Tabs 是上方分頁）<br>舊 Lit：無（tc-tabs 是上方分頁）<br>Tailwind：`fixed`、`bottom-0` | 待新增（可參考 `tabs.tokens.json`） | 未開始 |

### 內容 Content（8）

| 編號 | 元件 | 一句說明 | 動作 | 要做的事 | 理由（判斷） | 可參考的既有東西 | 元件 token | 狀態 |
|---|---|---|---|---|---|---|---|---|
| R-045 | **CodeBlock**<br>程式碼區塊 | 多行程式碼區塊，含語法上色與行號。 | 新增 | 新增元件。 | 開發者文件才需要；手冊本身的程式碼由 Starlight 處理。 | HeroUI：Kbd、Typography（code，只有行內） | 待新增 | 未開始 |
| R-046 | **Markdown**<br>Markdown 呈現 | 把 Markdown 文字呈現成元件庫的樣式。 | 新增 | 新增元件。 | 網站內容來自頁面編輯器或內容系統，不是 Markdown。 | HeroUI：Typography（typography-prose） | 待新增 | 未開始 |
| R-047 | **Timer**<br>計時顯示 | 顯示經過時間或時鐘，自動更新。 | 新增 | 新增元件。 | 判斷：活動倒數之類的需求出現時再做。 | HeroUI：無（TimeField 是輸入欄位）<br>Tailwind：`tabular-nums` | 待新增 | 未開始 |
| R-048 | **DiffViewer**<br>差異檢視 | 程式碼差異檢視（單欄或左右對照）。 | 新增 | 新增元件。 | 開發工具才需要。 | 無 | 待新增 | 未開始 |
| R-049 | **LogStream**<br>紀錄檢視 | 捲動式紀錄（log）檢視器，可跟隨最新一行。 | 新增 | 新增元件。 | 開發工具才需要。 | HeroUI：ScrollShadow | 待新增 | 未開始 |
| R-050 | **RichTextView**<br>富文字顯示 | 唯讀顯示富文字編輯器存下的內容。 | 新增 | 新增元件；判斷：頁面編輯器（tceditor）已有自己的富文字呈現，本套件不另做。 | 頁面編輯器已經涵蓋；它和本套件的整合已延後。 | 無 | 待新增 | 未開始 |
| R-051 | **Schedule**<br>活動行事曆 | 活動行事曆：月、週、日、清單檢視。 | 優化 | **優化對象：HeroUI Calendar**<br>HeroUI Calendar 只是選日期的格子；要補的是活動資料、時間軸和月／週／日／清單檢視。 | 判斷：活動多半以清單呈現；若入口網要做活動月曆，再提前到第二批。<br>備註：查證時由「完全沒有」改判為「部分對應」。 | HeroUI：Calendar、RangeCalendar | 待新增 | 未開始 |
| R-052 | **SVGIcon**<br>圖示底層 | 圖示系統的底層：用 CSS 變數控制線條與粗細。 | 優化 | **優化對象：HeroUI icons.tsx**<br>HeroUI 只有元件內部用的少量 SVG；這一層隨 Icon（R-016）的做法一起決定，若 Icon 已涵蓋就不另做。 | 屬於 Icon 的內部零件，Icon 先做。<br>備註：查證時由「完全沒有」改判為「部分對應」。 | HeroUI：icons.tsx<br>舊 Lit：tc-icon<br>Tailwind：`stroke-*` | `icon.tokens.json` | 未開始 |

### 彈出層 Overlay（1）

| 編號 | 元件 | 一句說明 | 動作 | 要做的事 | 理由（判斷） | 可參考的既有東西 | 元件 token | 狀態 |
|---|---|---|---|---|---|---|---|---|
| R-053 | **CommandPalette**<br>指令面板 | 按 Cmd-K 叫出的指令面板：搜尋、分組指令、空狀態。 | 優化 | **優化對象：HeroUI Modal、Autocomplete、ListBox、Kbd**<br>要補的是快捷鍵啟動與指令分組。 | 工具型介面才需要；網站搜尋用 SearchField 即可。 | HeroUI：Modal、Autocomplete、ListBox、Kbd | 待新增 | 未開始 |

### 回饋與狀態 Feedback & Status（1）

| 編號 | 元件 | 一句說明 | 動作 | 要做的事 | 理由（判斷） | 可參考的既有東西 | 元件 token | 狀態 |
|---|---|---|---|---|---|---|---|---|
| R-054 | **Tour**<br>操作導覽 | 一步步指著畫面元素說明，可上一步、下一步、略過。 | 新增 | 新增元件。 | 應用程式的新手引導才需要。 | HeroUI：Popover | 待新增 | 未開始 |

### 表單控制項 Form Controls（8）

| 編號 | 元件 | 一句說明 | 動作 | 要做的事 | 理由（判斷） | 可參考的既有東西 | 元件 token | 狀態 |
|---|---|---|---|---|---|---|---|---|
| R-055 | **PowerSearch**<br>條件篩選搜尋列 | 用「欄位＋條件＋值」組出篩選標籤的搜尋列。 | 新增 | 新增元件。 | 後台工具才需要；網站搜尋用 SearchField（慈濟主題已套用 tc-search-bar 的樣式）即可。 | HeroUI：SearchField、TagGroup<br>舊 Lit：tc-search-bar（一般搜尋列） | 待新增（可參考 `search-bar.tokens.json`） | 未開始 |
| R-056 | **CodeEditor**<br>程式碼編輯器 | 可編輯的程式碼輸入框，含語法上色與行號。 | 新增 | 新增元件。 | 開發工具才需要。 | HeroUI：TextArea | 待新增 | 未開始 |
| R-057 | **EmojiPicker**<br>表情符號選擇 | 表情符號選擇面板，可搜尋、常用優先。 | 新增 | 新增元件。 | 對話與留言功能才需要。 | HeroUI：Popover | 待新增 | 未開始 |
| R-058 | **ListInput**<br>清單輸入 | 可新增、刪除、排序資料列的清單輸入。 | 新增 | 新增元件。 | 後台表單才需要。 | HeroUI：InputGroup、Button | 待新增 | 未開始 |
| R-059 | **TransferList**<br>左右搬移選擇器 | 左右兩欄互相搬移項目的選擇器。 | 新增 | 新增元件。 | 後台工具才需要。 | HeroUI：ListBox | 待新增 | 未開始 |
| R-060 | **RichTextEditor**<br>富文字編輯器 | 富文字編輯器，含工具列、表格、程式碼區塊。 | 新增 | 新增元件；判斷：頁面編輯器（tceditor）已有自己的富文字編輯，本套件不另做。 | 頁面編輯器已經涵蓋；它和本套件的整合已延後。 | HeroUI：Toolbar | 待新增 | 未開始 |
| R-061 | **Tokenizer**<br>標籤輸入 | 在輸入框裡建立、編輯一串可刪除的標籤（例如收件人）。 | 優化 | **優化對象：HeroUI ComboBox、Autocomplete、TagGroup**<br>HeroUI 的範例組得出「多選加標籤」；要補的是專用元件、標籤之間的游標移動和手機面板。 | 後台或寄信功能才需要。 | HeroUI：ComboBox、Autocomplete（EmailRecipients 範例）、TagGroup | 待新增 | 未開始 |
| R-062 | **CircleCheckIndicator**<br>圓形勾選記號 | iOS 風格的圓形勾選記號。 | 優化 | **優化對象：HeroUI Checkbox、Radio（Indicator）**<br>HeroUI 的 Indicator 可以換成自訂記號；要補的是圓形勾選的樣式。 | 判斷：做 SelectableCardGroup（R-038）時若需要圓形勾選，再一起做。 | HeroUI：Checkbox.Indicator、Radio.Indicator | 待新增（可參考 `checkbox.tokens.json`） | 未開始 |

### 對話 Chat（4）

| 編號 | 元件 | 一句說明 | 動作 | 要做的事 | 理由（判斷） | 可參考的既有東西 | 元件 token | 狀態 |
|---|---|---|---|---|---|---|---|---|
| R-063 | **Chat**<br>對話介面 | 一整組 AI／聊天介面：對話版面、訊息泡泡、輸入框、送出與語音輸入鈕。 | 新增 | 新增元件組。 | AI 對話與客服功能才需要，內容網站目前沒有。 | HeroUI：TextArea、Button、Avatar（只有零件） | 待新增 | 未開始 |
| R-064 | **Chat extras (lab)**<br>對話附加零件 | 表情回應列、「對方輸入中」提示、未讀分隔線、長串訊息的虛擬捲動。 | 新增 | 新增元件；隨 Chat（R-063）一起評估。 | 依附在 Chat 上。 | 無 | 待新增 | 未開始 |
| R-065 | **Comments**<br>留言串 | 留言串面板：一層回覆、表情回應、編輯紀錄、留言輸入框。 | 新增 | 新增元件。 | 判斷：網站開放讀者留言時才需要。 | HeroUI：TextArea、Avatar | 待新增 | 未開始 |
| R-066 | **ChatReasoning**<br>AI 思考過程摺疊 | AI「思考中」的一行摺疊顯示，含耗時與串流效果。 | 優化 | **優化對象：HeroUI Disclosure**<br>HeroUI Disclosure 只有一般展開收合；要補的是一行摘要、耗時與串流效果。 | AI 對話功能才需要。<br>備註：查證時由「完全沒有」改判為「部分對應」。 | HeroUI：Disclosure | 待新增（可參考 `accordion.tokens.json`） | 未開始 |

### 資料視覺化 Data Visualization（6）

| 編號 | 元件 | 一句說明 | 動作 | 要做的事 | 理由（判斷） | 可參考的既有東西 | 元件 token | 狀態 |
|---|---|---|---|---|---|---|---|---|
| R-067 | **Chart (charts)**<br>圖表 | 圖表：折線、面積、長條、熱度圖等，含座標軸、圖例、提示框。 | 新增 | 新增元件；判斷：先評估年報用靜態 SVG 或圖片是否就夠，再決定要不要做互動圖表。圖表套件不得從 CDN 載入。 | 判斷：年報網可能需要簡單圖表；需求確定時再提前。 | HeroUI：無（開源版 v3 沒有圖表） | 待新增 | 未開始 |
| R-068 | **Chart (lab, legacy)**<br>圖表（舊版）<br>（重複，見 R-067） | 重複：與 Chart (charts) 是同一功能的新舊兩代，不另外做。 | 新增 | 不另外做；狀態跟著 Chart (charts) 走。 | 保留這一列只是為了讓 73 項清單完整。 | 無 | 待新增 | 未開始 |
| R-069 | **RadialChart**<br>圓形圖表 | 極座標／圓形圖表。 | 新增 | 新增元件；隨 Chart 一起評估。 | 同 Chart。 | HeroUI：ProgressCircle、Meter（只顯示單一數值） | 待新增 | 未開始 |
| R-070 | **SankeyChart**<br>流向圖 | 桑基圖（流向圖）。 | 新增 | 新增元件；隨 Chart 一起評估。 | 判斷：年報的經費流向可能用得到，但很少見。 | 無 | 待新增 | 未開始 |
| R-071 | **ThreeD**<br>3D 圖表 | 3D 圖表（長條、散點、曲面）。 | 新增 | 新增元件。 | 內容網站用不到。 | 無 | 待新增 | 未開始 |
| R-072 | **VegaChart**<br>Vega 規格圖表 | 用 Vega／Vega-Lite 規格畫圖。 | 新增 | 新增元件；隨 Chart 一起評估。 | 資料分析工具才需要。 | 無 | 待新增 | 未開始 |

### 工具 Utility（1）

| 編號 | 元件 | 一句說明 | 動作 | 要做的事 | 理由（判斷） | 可參考的既有東西 | 元件 token | 狀態 |
|---|---|---|---|---|---|---|---|---|
| R-073 | **VisuallyHidden**<br>視覺隱藏文字 | 畫面上看不到、但螢幕報讀器讀得到的文字。 | 新增 | 新增一個 kit 元件 VisuallyHidden（很薄的一層，內部用 Tailwind sr-only 實作）；手冊在無障礙說明裡寫用法。 | 判斷：Tailwind 已經能做到，不急，所以放待辦。 | Tailwind：`sr-only`、`not-sr-only` | 不需要（判斷） | 未開始 |

## 10. 內部可以直接用 Tailwind 實作的項目（判斷）

這些項目用 Tailwind 的工具類別就能做到。依專案負責人「沒有就添加」的決定，它們**仍然各做成一個很薄的 kit 元件**（統一比例、欄數、間距級距等規則），Tailwind 是實作方式，不是取代元件。

| 編號 | 項目 | 階段 | Tailwind | 要做的事 |
|---|---|---|---|---|
| R-003 | Grid（格線版面） | 第一批 | `grid`、`grid-cols-*`、`gap-*`、`grid-cols-[repeat(auto-fit,minmax(240px,1fr))]` | 新增一個 kit 元件 Grid（很薄的一層，內部用 Tailwind grid 實作）：提供兩種固定模式「固定欄數＋手機欄數」和「依最小欄寬自動排滿」（都是 tc-grid 已有的做法），間距只接受 space token 的級距。 |
| R-004 | AspectRatio（固定長寬比） | 第一批 | `aspect-video`、`aspect-square`、`aspect-[4/3]`、`object-cover` | 新增一個 kit 元件 AspectRatio（很薄的一層，內部用 Tailwind aspect-* 實作），只接受網站用的幾種比例（建議 16:9 主圖、4:3 卡片圖、1:1 頭像、3:4 書封，由美編確定），寫進手冊；Carousel、Card、Lightbox 都用它，比例才會一致。 |
| R-005 | LineClamp（多行截斷） | 第一批 | `line-clamp-1～line-clamp-6`、`truncate` | 在 HeroUI Typography 的單行截斷（truncate）之外，補上「行數」選項（例如 1、2、3 行）與「被截斷時才顯示完整文字」的提示。內部用 Tailwind line-clamp-* 實作；做成選項的價值是統一各卡片的行數與提示做法。 |
| R-039 | Stack（排列） | 待辦 | `flex`、`flex-col`、`gap-*` | 新增一個 kit 元件 Stack（很薄的一層，內部用 Tailwind flex 與 gap 實作），間距只接受 space token 的級距。 |
| R-040 | Center（置中） | 待辦 | `grid place-items-center`、`mx-auto`、`flex items-center justify-center` | 新增一個 kit 元件 Center（很薄的一層，內部用 Tailwind 實作），提供雙軸置中和水平置中。 |
| R-073 | VisuallyHidden（視覺隱藏文字） | 待辦 | `sr-only`、`not-sr-only` | 新增一個 kit 元件 VisuallyHidden（很薄的一層，內部用 Tailwind sr-only 實作）；手冊在無障礙說明裡寫用法。 |

## 11. 新元件放在哪裡（提案，待工程確認）

目前 repo 裡沒有放自家新元件的地方。以下是提案，**尚未實作**，要工程確認後才動手。

### 為什麼不放進 `heroui/`

- `heroui/` 是 HeroUI v3.2.6 原始碼的一次性匯入（`heroui/NOTICE.md`）。依 Apache-2.0 §4，所有對 HeroUI 檔案的修改都要在原處標 `LOCAL CHANGE` 並列進 `heroui/NOTICE.md`。如果把自家元件放進去，這份清單會越來越長，也分不清哪些是 HeroUI 的程式、哪些是我們自己的。
- 上游 HeroUI 的修正是人工挑選套用的（`heroui/MAINTAINING.md`）。`heroui/` 和上游越接近，越容易套用。
- `packages/components`、`packages/react`（`@tzuchi/react`）是凍結的舊 Lit 元件，只能參考，不能放新東西。

### (a) 新增的元件

- 新增一個 workspace 套件 `packages/ui`（套件名暫定 `@tzuchi/ui`，`"private": true`；名稱待工程確認）。`pnpm-workspace.yaml` 已經包含 `packages/*`，不用改。
- 每個元件一個資料夾，參考 HeroUI 的元件資料夾慣例（HeroUI 本身把 React 元件放在 `heroui/react`、樣式放在 `heroui/styles`，分成兩個套件；本提案放在同一個套件）：`packages/ui/src/components/<元件名>/` 裡有 `<元件名>.tsx`、`<元件名>.styles.ts`（tailwind-variants 的 `tv`）、`<元件名>.stories.tsx` 和 `index.ts`；樣式表放 `packages/ui/styles/components/<元件名>.css`。資料夾和檔名用小寫加連字號（`carousel`、`metadata-list`）。
- 以 `@heroui/react` 的元件和 `react-aria-components` 為底，先用 workspace 與 lockfile 裡已有的精確版本；需要新的外部套件時先問工程（`docs/rules/03-component-rules.md` R-C-20）。
- 顏色的規則和慈濟主題相同（`heroui/styles/themes/tzuchi/components/index.css` 開頭的規則）：顏色只用 HeroUI 的主題變數（`--accent`、`--surface` 等）或 `generate.mjs` 產生的 `--tzuchi-*` 變數；尺寸、間距、圓角、字級直接用 `--tc-*` token。原因：`tokens.css` 的顏色只在 `data-theme="dark"`（或作業系統是深色、且沒有設 `light`）時切換，和慈濟主題的 `tzuchi`／`tzuchi-dark` 對不上，直接讀 `--tc-color-*` 會在深色模式拿到淺色的值。新元件若需要新的顏色 token，要在 `generate.mjs` 加上對應的 `--tzuchi-*` 變數。
- 元件 token 放 `packages/tokens/src/component/<元件名>.tokens.json`，每個 token 只定義一次。顏色類的元件 token 引用語意色（例如 `{color.surface.default}`），深色模式由 `packages/tokens/src/themes/dark/` 改寫語意色，元件 token 就跟著變，不必另寫深色值。
- 只用一個元件展示頁（Storybook，`heroui/storybook`），要改兩處，都是 `LOCAL CHANGE`、都要列進 `heroui/NOTICE.md`：
  1. `heroui/storybook/.storybook/main.ts` 的 `getStories()` 加上 `packages/ui/src/**/*.stories.tsx`。
  2. `heroui/storybook/styles/globals.css` 加上 `@source` 指向 `packages/ui/src`（今天它只掃 `heroui/react/src/components`，否則 `packages/ui` 用到的 Tailwind class 不會被編譯），並 `@import` `packages/ui/styles` 的 CSS。
  範例的標題放在獨立的分組（例如「慈濟元件／Carousel」），和 HeroUI 的元件分開。
- 使用這套 kit 的網站，也要在自己的 Tailwind 設定裡對 `@tzuchi/ui` 加 `@source`，並載入它的 CSS。

### (b) 優化 HeroUI 的元件

- **預設在 `packages/ui` 包一層**：以 HeroUI 元件為底組合出新元件，加上自己的屬性和變體。例如「可點擊卡片」以 HeroUI Card 為底，MobileNav 以 Drawer 為底。HeroUI 的原元件和它的 variant 名稱都不動。
- **只有包一層做不到時才改 `heroui/`**：例如 HeroUI 內部有錯誤，或少了一個從外面接不上的掛勾（右鍵開啟選單可能需要改 Dropdown 內部）。改的地方標 `LOCAL CHANGE`、列進 `heroui/NOTICE.md`，PR 說明寫清楚為什麼包一層做不到。原則上不在 `heroui/` 裡新增 variant。
- 只調整 HeroUI 元件在慈濟主題下的外觀、不加新行為的，照現在的做法改 `heroui/styles/themes/tzuchi/components/<元件名>.css`，不算這份路線圖的「優化」。

## 12. 待決定

以下事項還沒有決定。最右欄是建議（判斷），不是決定。

| 事項 | 和路線圖的關係 | 建議（判斷） |
|---|---|---|
| 新元件的位置與套件名 | 第一批開工前要定 | 照第 11 節的提案：`packages/ui`，優化以包一層為主 |
| 各網站自己的程式放在這個 repo，還是各自的專案 | 決定「只屬於某網站的元件」先放哪裡 | 放各自的專案；這個 repo 只放共用的元件庫和手冊 |
| 誰核可、要不要用 CODEOWNERS 強制 | 決定狀態與階段的修改由誰核可 | 用 CODEOWNERS 加上 GitHub「需要 Code Owners 核可」：token 與手冊內容指給美編團隊，程式與建置指給工程團隊，路線圖的階段調整指給專案負責人（整體規格 Q2） |
| 主題和色彩模式在程式裡的屬性名 | 新元件怎麼跟著主題與色彩模式變 | 目前色彩模式是 `data-theme`（HeroUI 用 `tzuchi`／`tzuchi-dark`，`tokens.css` 用 `dark`），主題有 `data-site` 的提案。新元件只讀 CSS 變數、不直接讀這些屬性，之後怎麼定都不用改元件 |
| 次要文字色 `#828282` 在白底只有 3.84:1 | 幾乎每個新元件的說明文字、日期、出處都會用到 | 請美編在第一批開始設計前修正，讓對比至少 4.5:1 |
| 部署目標 | 已完成的元件何時出現在公開的手冊與元件展示頁（Storybook） | 還沒決定；路線圖的進度不受影響 |
| 頁面編輯器（tceditor）的整合 | 已延後 | 變體名稱現在就以用途命名、不改名，日後整合時才不用搬資料 |
| 第一批由工程或廠商做哪幾項 | 分工 | 由專案負責人和工程、廠商討論後寫進對應的 PR |

## 13. 資料來源與限制

- 來源是 2026-11-16 的 Astryx 與 HeroUI v3 元件缺口比對（Astryx 的 `main` 分支，含 core、lab、charts、richtext、vega 五個套件；HeroUI 是我們 vendored 的 v3.2.6 加上上游 v3.2.7）。73 項缺口都經過第二輪獨立查證，其中 7 項改判（已寫在各列的備註）。比對報告本身不在這個 repo；本文件已收錄需要的欄位。
- 「HeroUI 有沒有這個元件」是對照原始碼查過的；「有對應／部分對應／完全沒有」的判定本身是人工判斷。HeroUI 付費的 Pro 版沒有查。
- 「可參考的既有東西」裡的舊 Lit 元件（`packages/components/src`）已凍結，只當參考：`tc-card` 的可點擊模式、`tc-badge` 的狀態圓點、`tc-icon` 的內建圖示清單、`tc-grid` 的欄數設定、`tc-article-card` 的多行截斷，這次有讀過原始碼確認；其餘只看了檔名與說明。
