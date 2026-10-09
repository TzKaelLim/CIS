# tceditor 路線圖（Puck v0.23.0 的 hard fork）

- 日期：2026-10-08
- 狀態：草案，待審閱
- 依據：`puck-audit/REPORT.md`（2026-10-08 採用評估）與 2026-10-08 的討論

## 1. 目標

以 `@puckeditor/core@0.23.0` 為基礎，建立慈濟自己維護的視覺化頁面編輯器 **tceditor**（套件 `@tzuchi/tceditor`；名稱不使用 puck）。只使用 Puck 的前端能力，不依賴 Puck 官方的套件、雲端服務與 Puck AI。後端以自架的 Supabase 支撐，並提供 API 與 MCP，讓本地工具與 LLM 代理可以串接。

## 2. 已定案的決策

| # | 決策 | 理由 |
|---|---|---|
| D1 | **Hard fork**，基線是 tag `v0.23.0`（b4204f09）。之後不再同步上游，也不依賴 `@puckeditor/*` 套件 | 要做大幅調整；上游 0.x 的每個 minor 都可能有破壞性變更 |
| D2 | fork 就是本機 clone（`/Users/kaellim/Desktop/projects/puck`），不需要在 GitHub 上建 fork | 使用者決定 |
| D3 | **不使用 Puck AI**。移除 AI recipes 與一切和 Puck Cloud 相關的程式 | 評估報告：AI 套件有 2 項 High、閉源、授權不明 |
| D4 | 後端採用**自架 Supabase（Docker）**，與現有的 tciam stack 完全隔離 | 使用者決定；Auth、RLS、Storage、Realtime 可以直接對應需求 |
| D5 | 對外介面：**HTTP API + MCP server**，供本地串接 | 使用者決定 |
| D6 | 元件規格以「程式碼中唯一的 schema」為準，Puck fields、Storybook argTypes、伺服器端驗證、MCP 元件目錄都從它產生 | 討論結論；tzuchi-uikit 的 PoC 已經在走這條路 |
| D7 | 上游 `v0.23.0..main` 的 42 個 commit 不整批合併。只挑**修 bug 的 commit 個別移植**，新功能等有需要時再評估 | hard fork；main 含 0.24 的渲染重構 |
| D8 | **richtext 改存結構化 JSON**，編輯器、預覽、公開頁都使用同一個靜態渲染器 | 預覽與正式頁面必然一致；從資料格式上根除 XSS；不再需要 happy-dom |

## 3. 子專案拆解與順序

每個子專案都獨立走「規格 → 實作計畫 → 實作」。

| # | 子專案 | 範圍 | 依賴 | 狀態 |
|---|---|---|---|---|
| S1 | Fork 基線與開發基礎設施 | 建立 fork 分支、改名為 tceditor、yarn 改 pnpm、移除不需要的套件、函式庫層資安修補（含 richtext 改為 JSON 與共用渲染器）、自架 Supabase 開發環境 | — | 規格見 `2026-10-08-s1-fork-baseline-design.md` |
| S2 | 元件規格（唯一 schema） | 從 schema 產生 Puck fields、Storybook argTypes、JSON Schema 或 zod 驗證器、MCP 元件目錄 | S1 | 待 brainstorm |
| S3 | Supabase 後端 | 驗證與授權、RLS、頁面與版本、草稿、審核狀態機、媒體庫、寫入 API（伺服器端以 schema 驗證） | S1、S2 | 待 brainstorm |
| S4 | MCP server | 以 S3 的 API 與 S2 的 schema 為基礎；LLM 只能建立草稿，發佈必須經過人工 | S2、S3 | 待 brainstorm |
| S5 | 編輯器效能 | 權限 slice 的全樹走訪、增量索引、history 改存 patch、虛擬化正式化。目標規模待定 | S1，可與 S3 並行 | 待 brainstorm |
| S6 | 大型依賴替換 | `@dnd-kit` 0.4→0.5+、jest 改 vitest（`happy-dom` 的替換已提前在 S1 的 F1 完成） | S1，要先有 E2E 測試保護 | 待 brainstorm |

## 4. 各子專案待回答的問題（到該子專案時再問）

- **S2**：schema 放在 tzuchi-uikit 還是 fork repo？React 層用 HeroUI 元件，還是用 `tc-*` Web Components 的 React wrapper？
- **S3**：
  - 誰會使用編輯器：A 少數內部專職人員；B 多單位、多站台、需要審核；C 志工或外部投稿者。
  - 是否以 tciam 作為 SSO？
  - 審核需要幾個關卡？
- **S4**：MCP 的使用端是誰（Claude Code、Claude Desktop、其他代理）？需要哪些工具？要不要預覽截圖？
- **S5**：實際頁面規模的上限，以及效能目標（例如 5,000 個節點時開啟編輯器 < 2 s）。
- **共通**：fork 的遠端與 CI 要放在哪裡（GitLab？）？版本如何發佈給 tzuchi-uikit 使用（workspace link 或私有 registry）？
