# 慈濟主題 × HeroUI 基礎元件落差盤點（Atoms）

日期：2026-09-19　套用主題：`data-theme="tzuchi"`（淺色）與 `data-theme="tzuchi-dark"`（深色）

- **第一輪**：與 HeroUI **名稱完全一致**的 18 個基礎元件（本文件前半）。
- **第二輪**：名稱不同的 5 個基礎元件，加上 Select、TagGroup，以及新增的「中性底色」token（見文末〈第二輪〉）。
- **第三輪**：其餘 58 個**沒有慈濟對應**的基礎元件，依 `../DESIGN-LANGUAGE.md` 推導（見文末〈第三輪〉）。至此 HeroUI 的基礎元件層全部處理完畢。

> 第一輪的逐元件報告裡，凡是寫「`--default` 尚未對應」的段落都是當時的紀錄；第二輪已補上該 token，報告保留原文不改寫。

每個元件一份詳細報告（同目錄 `<元件>.md`）：逐項列出「屬性｜慈濟（來源檔:行號＋實際值）｜HeroUI（來源檔:行號＋實際值）｜處理方式」。
對應的覆寫檔在 `../components/<元件>.css`。

## 做法：保持 HeroUI 結構

- **不動** HeroUI 的 React 元件、markup、props、BEM class 名稱、基礎 CSS。
- 只在 HeroUI 官方預留的主題擴充層 `themes/tzuchi/components/` 覆寫，且每條規則都以 `[data-theme^="tzuchi"]` 限定範圍。
- 慈濟這邊的依據是現有 `tc-*` Lit 元件的樣式與元件 token（它們記錄了 Figma 的決策）。

### 顏色規則（最重要）

| 類型 | 來源 | 原因 |
|---|---|---|
| 顏色 | **只能**用 HeroUI 主題變數（`--accent`、`--border`、`--surface`…）或 `generate.mjs` 產生的 `--tzuchi-*` | `--tc-color-*` 與所有「值為顏色」的元件 token 只在 `data-theme="dark"` 時切深色；在 `tzuchi-dark` 下會拿到**淺色值** |
| 形狀、間距、尺寸、字級、動態 | 可直接引用 `--tc-radius-*`、`--tc-space-*`、`--tc-size-*`、`--tc-typography-*`、`--tc-motion-*` 與值為尺寸的 `--tc-<元件>-*`（一律帶 fallback） | 這些不分明暗 |

## 總覽

| 元件 | 落差程度 | 調整 / 保留 | 主要調整 |
|---|---|---|---|
| accordion | 小 | 14 / 10 | `surface` 變體加 1px 邊框、圓角 24→8px、全寬分隔線；標題 16px 粗體；箭頭 16→20px |
| alert | **大** | 13 / 6 | 圓角卡片 → 平面色塊＋左側 4px 強調色條；粗體標題、16px 內文 |
| badge | 小 | 4 / 6 | 僅密度與行高（兩邊概念不同，見下） |
| button | 小 | 12 / 13 | 圓角 24→8px、16px 粗體、單一高度；`secondary`→tonal、`outline`→outlined；修正 ButtonGroup 內側圓角 |
| card | 小 | 10 / 10 | 圓角→16px、標題／內文字級 |
| checkbox | **大** | 13 / 7 | 控件 16→32px、圓角 4px、邊框 1→2px、未勾選用「強邊框」色 |
| chip | **大** | 16 / 7 | 圓角、內距、字級 |
| dropdown | **大** | 11 / 13 | 選單圓角 8px、項目內距與 16px 字級、hover／選取用 accent-soft |
| input | 小 | 4 / 13 | 左右內距 12→20px、16px/1.6；修正 hover 邊框的層疊問題 |
| link | 小 | 7 / 7 | 字重、顏色、底線位移 |
| modal | 小 | 10 / 10 | 圓角 16px、淺色用 elevation-4、標題字級 |
| pagination | **大** | 18 / 13 | 40px 方形項目、圓角、16px 字級、取消 md 斷點縮小 |
| radio | **大** | 13 / 9 | 控件 32px、「強邊框」色環 |
| spinner | 小 | 11 / 11 | sm／md／lg 尺寸對齊慈濟 |
| switch | **大** | 11 / 6 | 軌道 44×24、滑塊 18px、關閉時用「強邊框」色 |
| tabs | 小 | 11 / 10 | 圓角、粗體、對應 web／mobile 兩種版型 |
| textarea | 小 | 8 / 12 | 最小高度、內距、16px 字級 |
| tooltip | **大** | 7 / 5 | 圓角 4px、16px 字級、4×8 內距 |

合計調整 **193** 個屬性。「保留」代表兩邊本來就一致，或 HeroUI 的做法更好（報告中逐項寫明理由）。

## 驗證（皆以真實瀏覽器量測）

1. **上游主題零波及**：18 個元件在 HeroUI 原版 `light`／`dark` 下，整合前後 402 個元素 × 31 種樣式屬性**完全相同**。
2. **斷言**：審查時為每個元件列出預期的實際像素值，兩個慈濟主題共 **188/188 通過**。
3. **淺色與深色對稱**：兩個慈濟主題改變的元素與屬性完全相同（各 182 個元素）——形狀一致，顏色各走主題變數。
4. **獨立規則檢查**：18 個檔案無顏色 token 違規、無顏色字面值、每條規則皆有限定範圍。

## 需要決定的事

### 1. 補一個語意 token，可以一次解決很多元件 — ✅ 第二輪已完成
HeroUI 的 `--default`／`--default-foreground`（**中性底色**）原本在 `@tzuchi/tokens` 沒有對應，所以 button 的 `tertiary`／`ghost`、checkbox／radio／switch／textarea 的 `secondary` 變體、tabs 的分段（primary）樣式都還是 HeroUI 的灰。已新增 `color.neutral.surface`（＋hover），詳見文末〈第二輪〉。

### 2. 你原始碼裡的不一致：checkbox／radio 是 24px 還是 32px？
`tc-checkbox` 與 `tc-radio` 的說明文字與 CSS 備援值都寫 **24px**，但 token `--tc-checkbox-size`／`--tc-radio-size` 指向 `size.icon.md` = **32px**。目前覆寫跟隨 token（32px）。請對照 Figma 確認哪個才對。

### 3. 三個「同名不同義」的元件
- **dropdown**：你的是表單單選（combobox）；HeroUI 的 Dropdown 是動作選單。已把**選單外觀**對齊；觸發按鈕那一半（外框、佔位字、展開態、箭頭旋轉）套到 HeroUI 的 **Select** — ✅ 第二輪已完成。
- **badge**：你的是標籤藥丸；HeroUI 的是錨定在別的元素上的計數點。只轉移了密度。標籤用途請用 **Chip**。
- **chip**：你的含篩選／可移除／選取狀態；HeroUI 的 Chip 是靜態標籤。互動部分屬於 **TagGroup** — ✅ 第二輪已完成。

### 4. 慈濟 token 本身的小問題（順帶發現）
- 各元件的 `--tc-*-focus-ring-color` 固定為 blue-500，**沒有深色值**。覆寫改用主題的 `--focus`（深色下為 blue-300），效果較好。
- 元件陰影 token 是淺色字面值，不跟隨深色——覆寫一律改用 `--surface-shadow`／`--overlay-shadow`。

## 無法轉移的東西（共通類型）

各報告的「notTransferable」段落有完整清單，類型大致是：
- **行為**：表單關聯、事件（`tc-change`…）、鍵盤模型、ARIA 連結——React Aria 已各自提供。
- **結構**：Shadow DOM 的 slot／part、`data-empty` 收合、卡片的整塊連結——HeroUI 用複合子元件（`Card.Header`…）表達。
- **HeroUI 才有的**：尺寸軸（sm／lg）、額外變體、Description／FieldError、placement——保留 HeroUI 的處理，僅讓數值與慈濟 token 一致。
- **定位與層級**：tooltip／dropdown／modal 的位移與 z-index 由 React Aria 的 portal 管理，CSS 碰不到。
- **i18n**：HeroUI 的 Spinner 把 `aria-label="Loading"` 寫死；你的是「載入中…」。這是 React 層的事。

---

# 第二輪（2026-09-19）

## A. 中性底色 token

新增到 `@tzuchi/tokens`（淺色在 `semantic/color.tokens.json`，深色在 `themes/dark/color.tokens.json`），刻意與既有的品牌淺底成對：

| token | 淺色 | 深色 | 對應的 HeroUI 變數 | 成對的品牌 token |
|---|---|---|---|---|
| `color.neutral.surface` | gray.100 `#F2F2F2` | gray.900 `#333333` | `--default` | `color.brand.surface`（blue.100／blue.900） |
| `color.neutral.surface-hover` | gray.200 `#E0E0E0` | gray.800 `#4F4F4F` | `--default-hover` | `color.brand.surface-hover`（blue.200／blue.700） |

`--default-foreground` 對應既有的 `color.text.default`。`--default-soft*` 沿用 HeroUI 的 `color-mix()` 公式。

**為什麼是這組值**（完整數據在 `neutral-token-impact.md`，共盤點 38 個使用 `--default` 的 HeroUI 樣式檔）：
- 底色在白色卡片上的對比 1.12（品牌淺底 1.16）、深色卡片上 1.35（品牌 1.27）——中性與品牌兩種淺底的「音量」相當。
- 淺色改用 gray.200 會讓中性底色比品牌淺底更搶眼，且 `--muted` 文字在其上只剩 2.91:1；深色改用 gray.800 會讓分段 Tabs 的選取狀態消失（1.14:1）。兩者皆否決。
- hover 若沿用 HeroUI 的 4% 混色，靜止→hover 只有 1.08:1（HeroUI 原版也一樣看不出來）；改成明確的 token 後是 1.18（淺）／1.54（深），與品牌 hover 的節奏一致。
- 深色 `--segment`（分段 Tabs 的選取滑塊）改為 gray.800：軌道變亮後原值只剩 1.35:1，改後 1.54:1（HeroUI 原版 1.59:1）。
- `--surface-secondary`／`--surface-tertiary` 刻意不對應：tokens 只有兩階 surface，HeroUI 的值在兩個模式下都剛好落在 `--surface` 與 `--default` 之間。

**已知取捨**：淺色中性底色放在頁面底色（gray.50）上只有 1.05:1，`tertiary` 按鈕、Slider／Meter 軌道直接放在頁面上時很淡（HeroUI 原版 1.09 也淡）。這是各元件的軌道決策（你的 `tc-progress` 軌道用 `surface.subtle`，更淡），不是 token 的問題。

## B. 7 個元件

| HeroUI 元件 | 慈濟來源 | 落差程度 | 調整 / 保留 | 主要調整 |
|---|---|---|---|---|
| Breadcrumbs | `tc-breadcrumb` | 小 | 10 / 7 | 16px／1.6 字級、間距 8px、可換行；連結 muted → hover／當前頁為 foreground |
| Separator | `tc-divider` | 幾乎一致 | 2 / 6 | default 本來就等於 `border.default`；修正 secondary／tertiary 在慈濟色下反而比 default 淡的問題 |
| ProgressBar | `tc-progress` | 小 | 6 / 9 | 軌道與填色改為全圓角、讀數 16px muted、動態時間與曲線 |
| SearchField | `tc-search-bar` 的輸入框部分 | 小 | 10 / 6 | 與 Input 同高（43.6px）、20px 內距、16px 字級、搜尋圖示 20px 品牌色、focus／invalid 邊框 |
| Button（icon-only） | `tc-icon-button` | 小 | 9 / 18 | 全圓、48／64px（sm 36px）、圖示 32／40／20px；ButtonGroup 內維持群組高度。附加在 `button.css` 末段 |
| Select | `tc-dropdown`（觸發框＋選單） | **大** | 15 / 4 | 觸發框 32px 內距、16px 粗體、有值／展開轉品牌色、展開態底色、箭頭 20px；選單與第一輪的 Dropdown 同一套外觀 |
| TagGroup／Tag | `tc-chip` 的互動部分 | **大** | 14 / 13 | 與 Chip 同形（全圓角、40／34／48px、20px 字級）、選取時描邊、移除鈕 20px 且靜止時無底色 |

合計調整 **66** 個屬性；新增 8 個覆寫檔（`breadcrumbs`、`separator`、`progress-bar`、`search-field`、`select`、`list-box`、`list-box-item`、`tag`），`button.css` 增加一段。不需要新的 `--tzuchi-*` 變數。

**更正第一輪的一項紀錄**：`button.md` 寫「icon-only 無對應（tc 沒有 icon-only 模式）」是錯的——慈濟有獨立元件 `tc-icon-button`，第二輪已補上。

## C. 驗證

1. **上游主題零波及**：38 個 Storybook 頁面（第一輪 18 個＋第二輪 7 個＋其他使用中性底色的元件）在 HeroUI 原版 `light`／`dark` 下，整合前後 **完全相同**。
2. **斷言**：第二輪 **90/90** 通過；第一輪 188 條重跑 **188/188**，沒有退步。
3. **慈濟兩主題的差異全數有解釋**：除了 7 個元件本身，其餘變動都是中性底色 token（`oklch(94%…)` → `#F2F2F2` 等）與 icon-only 按鈕；深色比淺色多 2 個元素，正是 `--segment`。
4. **規則檢查**：26 個覆寫檔無顏色 token 違規、無顏色字面值、皆有限定範圍；註解提前結束的掃描為 0（掃描器另以刻意寫壞的對照檔確認抓得到）。
5. 既有 pipeline：lint、build 5/5、test、typecheck 全過。

## D. 尚未處理（第二輪發現）

- ✅ **`list-box` 是共用的**：ComboBox／Autocomplete 的彈出層外殼 — 第三輪已補上，與 Select 同一套處理。
- ✅ **其他欄位家族**（InputGroup、NumberField、DateField、ComboBox 的輸入框）— 第三輪已對齊 Input 的 43.6px 高度與 20px 內距。
- ✅ **Meter** — 第三輪已套用與 ProgressBar 相同的覆寫。
- **無法轉移**（第二輪元件）：`tc-divider` 的帶文字分隔線（HeroUI Separator 只是一條線，沒有放文字的元素；要做得在 React 層組合）、`tc-breadcrumb` 的「›」文字分隔符（HeroUI 用 SVG 圖示）、`tc-search-bar` 的分類選單與送出按鈕（屬於複合元件層）、`tc-progress` 的讀數位置（慈濟在軌道下方，HeroUI 在右上）。

---

# 第三輪（2026-09-20）：把基礎元件層做完

## A. 做法

剩下的 58 個 HeroUI 基礎元件**沒有慈濟對應元件**，所以不是「比對落差」，而是「讓它們說同一種設計語言」：

1. 先從已完成的 26 個覆寫檔歸納出 **`../DESIGN-LANGUAGE.md`**（154 條規則：字級、各角色的圓角、控件高度與內距、邊框與 focus、狀態用色、彈出層外觀、軌道、動態、間距、刻意不動的清單）。每條規則都附出處（覆寫檔行號＋慈濟原始碼），並由另一個 agent 逐條查核 token 是否存在、數值是否正確、是否不分明暗。沒有依據的角色誠實標為「NO EVIDENCE — 由最接近的角色推導」。
2. 16 組審查員**只依規格**調整；規格沒講的一律不動（版面幾何、動畫編排都保留 HeroUI 原樣）。每組配一個複核員。
3. 最後一個 agent 做跨元件一致性檢查（同一角色是否同一數值、兩個檔案是否搶同一個選擇器）。

**這份規格是第三輪最重要的產出**：之後做複合元件（Composites）、或設計師要新增元件時，都以它為準。

## B. 結果：42 個新覆寫檔，16 個元件不需要覆寫

| 家族 | 覆寫檔 | 主要調整 |
|---|---|---|
| 選單式選擇器 | combo-box、autocomplete | 彈出面板與 Select 完全同一套（品牌淺底、8px 圓角、32px 列內距、hover／選取色）；輸入框對齊 Input |
| 欄位 A | input-group、number-field | 43.6px 高、20px 內距、16px 字級；invalid 邊框（順帶修掉 HeroUI 指向不存在變數 `--color-field-border-invalid` 的上游 bug） |
| 欄位 B | date-input-group、input-otp、color-input-group | 同一個欄位外殼；日期區段與 OTP 格的字級與 focus |
| 日期選擇器 | date-picker、date-range-picker | 觸發框同欄位；彈出層是「內容型」→ 16px 圓角（同 Card／Modal） |
| 月曆 | calendar、range-calendar、calendar-year-picker | 日期格比照分頁：4px 圓角、16px 數字、選取＝品牌實心、區間＝品牌淺底 |
| 選單 | menu、menu-item、header、tag-group | 全域的選單列與 list-box 列同形（Dropdown 以外使用的 Menu 也一致） |
| 表單骨架 | label、description、error-message、field-error、fieldset | Label 16px 粗體；說明與錯誤文字 16px（出處：`tc-input` 的 `.helper`） |
| 按鈕家族 | toggle-button、toggle-button-group、toolbar、close-button | ToggleButton＝有選取狀態的 Button：同圓角、字級、高度階梯；icon-only 全圓 |
| 對話框 | alert-dialog、drawer | 與 Modal 同一個外殼：16px 圓角、標題粗體、內文 16px、間距節奏 |
| Popover／Toast | popover、toast | 16px 圓角、16px 字級；Toast 比照 Alert／Card 的表面，不比照 Tooltip |
| 進度與軌道 | meter、progress-circle、empty-state | Meter＝ProgressBar 換前綴；ProgressCircle 只調動態 |
| 滑桿 | slider、color-slider | **軌道改用 `--border`**（互動式軌道必須看得見：淺色 1.05:1 → 1.88:1）；補回把手陰影（主題把 `--field-shadow` 設為透明，把手原本完全沒陰影，與第一輪 switch 同一個陷阱） |
| 色彩 | color-swatch、color-swatch-picker、color-picker | 方形色票 4px 圓角、內外同心；絕不動色票本身的顏色 |
| 表格 | table | 外殼 16px 圓角、表頭 16px 粗體、儲存格 16px、列 hover／選取用品牌淺底 |
| 媒體與排版 | avatar、kbd、typography | Typography 的標題／內文對應到慈濟字級 token；Kbd 文字改用 `--default-foreground`（原本 `--muted` 在中性底色上只有 3.43:1） |
| 表面 | disclosure | 與 Accordion 同：觸發列 16px 粗體、20px 箭頭、hover 底色 |

**不需要覆寫（16 個）**：textfield、date-field、time-field、color-field（只是「標籤＋欄位＋說明」的堆疊，4px 間距本來就對）、menu-section、list-box-section、checkbox-group、radio-group、switch-group、button-group（第一輪的 `button.css` 已處理）、skeleton、color-area、avatar-group、scroll-shadow、surface、disclosure-group。

合計 228 項調整。至此 **84 個 HeroUI 元件樣式檔：68 個有慈濟覆寫、16 個確認不需要**。

## C. 一致性檢查抓到的問題（都已處理）

- **高**：3 個檔案（slider、color-slider、date-picker）整份失效——複核員在「已掃描，沒有提前結束的註解」那句話裡，自己把 `*` `/` 連著寫了出來，註解在那裡提前結束，後面整個區塊被吃掉。這是第一輪就出過的 bug；三個複核員都宣稱檢查過。已修正，並由獨立掃描器確認 68 個檔案皆無此問題。
- **中**：Disclosure 與 **第一輪的 Accordion** 的 hover 淡入，只防了「系統的減少動態偏好」，沒防 HeroUI 另一條路徑（`data-reduce-motion="true"` 屬性，Storybook 工具列的開關就是用它）。兩個檔案都已補上。
- **低**（8 項，不影響顯示）：同值但拼法不同的 token 別名、同值的重複宣告等，詳見 `pass3/_consistency.md`。
- **規格本身該修的一處**：三個月曆檔都沒照規格用品牌淺底當 hover——因為在月曆裡品牌淺底已經是「今天」與「區間」的標記，再拿來當 hover 會分不清。檔案是對的，規格該補上這個例外。

## D. 驗證

1. **上游主題零波及**：77 個 story（全部元件頁）在 HeroUI 原版 `light`／`dark` 下，整合前後**完全相同**（快照時鐘固定在同一天；不固定的話月曆的「今天」標記會因跨日而移動一格——那是 HeroUI 自己的值在兩格之間對調，不是覆寫外洩）。
2. **斷言**：第三輪 **254/254**；第一輪 188/188、第二輪 90/90 重跑無退步。三輪合計 **532 條**。
3. **規則檢查**：68 個覆寫檔無顏色 token 違規、無顏色字面值、皆有限定範圍、無提前結束的註解。
4. 既有 pipeline：lint、build 5/5、test、typecheck 全過。

## E. 需要設計師拍板的事（規格的未決問題）

這一輪沒有 Figma 可依，以下是「推導出來、但應該有人確認」的決定：

1. **內容型彈出層的圓角 16px**（Popover、日期／色彩選擇器；比照 Card／Modal）。另一個合理選項是 8px（比照下拉選單）。
2. **Toast 比照 Alert／Card**（16px 圓角的表面），而不是比照 Tooltip（4px 的小標籤）。
3. **互動式軌道（Slider）用 `--border`**：比原本看得見很多，但仍未達 WCAG 1.4.11 的 3:1（淺色 1.88:1）。要達標需要一個專用的軌道 token。
4. **欄位的 focus 樣式不一致**：你的 `tc-input`／`tc-textarea`／`tc-search-bar` 原始碼都指定「3px 品牌淺色光暈」，但目前只有 Textarea 做了；Input、SearchField、Select 因為層疊順序的技術原因保留了 HeroUI 的 2px focus ring。要統一成哪一種？
5. **checkbox／radio 24px 還是 32px**（第一輪遺留）——現在 Table 的勾選欄就能看出 32px 在表格裡偏大。
6. **沒有任何慈濟依據的元件**（月曆、Table、Kbd、InputOTP、色彩系列、Typography、Avatar…）：數值全部是從最接近的角色推導，報告裡逐條列為「spec gap」，請設計師過目 `pass3/` 下各家族報告的該段落。
