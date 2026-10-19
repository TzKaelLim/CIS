# showcase

`@tzuchi/tceditor-showcase`：tceditor 區塊的示範站（Next.js 16 App Router）。在編輯器用 8 個示範區塊拼出活動頁、發布，再看伺服器產生的公開頁，用來展示 tceditor 能做到哪裡。發布 API 模擬 S3 的存檔 API。

## 啟動

在 repo 根目錄執行：

```sh
pnpm dev:showcase
```

伺服器只綁 `127.0.0.1:3010`：編輯器在 http://127.0.0.1:3010/activity/edit，公開頁在 http://127.0.0.1:3010/activity。要用建置後的版本時，先在根目錄執行 `pnpm build`，再執行 `pnpm --filter @tzuchi/tceditor-showcase start`（同樣綁 `127.0.0.1:3010`）。

示範站經由 `workspace:*` 使用 core 建置後的 `dist`，修改 core 之後要先 `pnpm --filter @tzuchi/tceditor build`。

## 頁面與 API

| 路徑                 | 說明                                                                                                                                                                |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/activity/edit`     | 編輯器。開啟時載入已發布的頁面，還沒有時載入範例活動頁 `content/activity.preset.json`                                                                               |
| `/activity`          | 公開頁。顯示已發布的頁面（還沒有時顯示範例活動頁），伺服器端以 `@tzuchi/tceditor/rsc` 的 `<Render>` 產生 HTML，`<title>` 與說明取自頁面根節點，不載入任何編輯器程式 |
| `GET /api/activity`  | 回傳目前的頁面資料（已發布的頁面或範例活動頁）                                                                                                                      |
| `POST /api/activity` | 發布：先跑整頁驗證器，通過才存檔                                                                                                                                    |

- 公開頁與編輯器在 `app/(public)` 與 `app/(editor)` 各有自己的根 layout。公開頁是 `<html lang="zh-Hant" data-theme="tzuchi">`；編輯器的 `<html>` 不設 `data-theme`（設了會蓋掉預覽 iframe 的主題），由 `overrides.iframe` 在預覽 iframe 的 `<html>` 設定慈濟主題。
- 樣式只 import `@tzuchi/tceditor-blocks/styles.css`。
- 公開頁的檔案（`app/(public)/**`）不得 import `@tzuchi/tceditor` 主入口的執行期值或區塊的編輯器設定（ESLint 檢查），`pnpm check:public-bundle` 會在 build 之後掃描 `/activity` 的瀏覽器端程式確認這一點。

## 發布 API

- 只接受 `Content-Type: application/json`（可帶 `; charset=…`）與同源請求：`Origin` 必須等於 `http://` 加上請求的 `Host`，而且 `Host` 的主機名稱必須是 `127.0.0.1` 或 `localhost`，以防其他網站從瀏覽器對本機送出請求，或用 DNS rebinding 繞過同源檢查。
- 讀取請求內容時以位元組計算，超過 2 MB 就停止並回 413。
- 檢查順序是來源（403）→ Content-Type（415）→ 大小（413）→ 驗證（422）。驗證失敗回 422 與 `{ errors }`（格式見 `packages/spec/README.md`）。其他拒絕回 `{ error, message }`，`message` 是中文說明，`error` 依序是 `forbidden_origin`（403）、`unsupported_media_type`（415）、`too_large`（413），寫檔失敗則是 500 的 `write_failed`。
- 成功回 200 與 `{ notices }`，並把補齊預設值、清理過富文字的資料寫入 `apps/showcase/.data/activity.json`（不進版控）。寫入時先寫暫存檔再改名，不會留下寫到一半的檔案；寫檔失敗時保留原本的檔案。
- 設定 `SHOWCASE_DATA_DIR` 可以把資料目錄改到別處（相對路徑以 `apps/showcase` 為準），例如測試時。
- 要還原成範例活動頁，刪除資料目錄裡的 `activity.json` 即可。
- S3 會把這個 API 換成 Supabase 的 Edge Function，沿用同一個驗證器與 422 的錯誤格式。

用 curl 發布一份頁面資料（要帶同源的 `Origin`）：

```sh
curl -s -X POST http://127.0.0.1:3010/api/activity \
  -H "Content-Type: application/json" \
  -H "Origin: http://127.0.0.1:3010" \
  --data-binary @apps/showcase/content/activity.preset.json
```

## 編輯器

- `/activity/edit?blank=1` 從空白頁開始（冒煙測試使用）。
- 「發布檢查」面板（Puck plugin）顯示發布的狀態與驗證器回傳的每一筆錯誤：區塊名稱、路徑與中文說明。發布完成時面板會自動切到前景。點一筆錯誤會選取出錯的區塊，右側面板跳到那個區塊的欄位。區塊是依當初送出的資料裡的 id 找的，所以發布後移動過的區塊仍然找得到；區塊已刪除時不動作；頁面根節點的錯誤會選取頁面本身。
- 面板的根元素是 `[data-testid="publish-check"]`，`data-status` 是 `idle`、`publishing`、`published`、`invalid` 或 `failed`，測試以它判斷發布結果。
- header 的發布按鈕維持 Puck 的英文「Publish」，中文介面是 S7 的範圍。
- 圖片欄位用自訂的挑選介面，從 `@tzuchi/tceditor-blocks/demo-assets` 的 6 張示範圖中選擇。
- 預覽寬度提供手機、平板、桌面三種，對應 tokens 的斷點 375、768、1024 px。
- 編輯器也載入標題大綱外掛 `@tzuchi/tceditor-plugin-heading-analyzer`。

## 示範內容

- 範例活動頁 `content/activity.preset.json` 用上全部 8 個區塊，包括區段裡的多欄、多欄裡的卡片、卡片裡的按鈕與標籤列。測試確認它通過驗證、已是驗證器存檔後的樣子，而且正好用上這 8 個區塊（新增區塊不必加進範例頁）。
- 6 張示範圖是在 repo 內繪製的 SVG（`public/demo-assets/`），涵蓋橫式、直式與正方形；清單（編號、尺寸、說明）在 `packages/blocks/src/demo-assets.ts`，區塊 Storybook 也用同一個資料夾。

## 檢查

```sh
pnpm --filter @tzuchi/tceditor-showcase test   # 發布 API 的各種回應、發布結果與錯誤定位，以及範例頁通過驗證
pnpm check:public-bundle                        # 需先 pnpm build
pnpm smoke                                      # 需先啟動 demo（3000）與示範站（3010）
```

- 發布 API 的測試涵蓋 200 與寫檔、422、413（含 2 MB 的中文內容）、415、403（含 DNS rebinding），以及寫檔失敗時保留原本的檔案。
- `pnpm check:public-bundle` 確認 `/activity` 的瀏覽器端程式不含編輯器（`header-toggle-leftsidebar`）、圖片挑選器（`tcb-picker-option`）與 zod（`__zod_globalConfig`），並以 `/activity/edit` 當對照組（三個字串都必須出現在那裡）。
- `pnpm check:public-bundle` 也會在開頭印出 `/activity` 載入的 JS 與 CSS 大小（原始與 gzip -9），只作紀錄，不是門檻。S2 的實測值：JS 5 個檔、約 502 KB（gzip 後約 142 KB，不含只給舊瀏覽器的 polyfill），全部是 Next.js 與 React 的執行環境，區塊畫面是伺服器元件，不送 JS；CSS 1 個檔、約 532 KB（gzip 後約 51 KB），包含 tokens、`@heroui/styles`、慈濟主題與區塊樣式。CSS 依元件拆分留待日後。
- `pnpm smoke` 的第二段是 `scripts/e2e/showcase-smoke.mjs`：從 `/activity/edit?blank=1` 的空白頁開始，把 8 個區塊各拖一個進頁面、填好必填欄位、發布，再確認 `/activity` 的 HTML 含有這些內容。失敗時以非 0 結束。結束時（含失敗）會把已發布的頁面還原成測試前的狀態；示範站不在 `http://127.0.0.1:3010` 時用 `SHOWCASE_URL` 指定。

## 注意

示範站沒有任何登入驗證，只能在本機開發使用，不要部署或對外開放。scripts 設定了 `NEXT_TELEMETRY_DISABLED=1`，頁面不從第三方網域載入字型、樣式、腳本或圖片。
