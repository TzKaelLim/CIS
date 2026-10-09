# demo

tceditor 的開發用 playground（Next.js App Router），也是 `pnpm smoke` 的測試目標。它透過 `tsconfig.json` 的 `paths` 直接編譯 `packages/core` 的原始碼，修改 core 後不需要重新建置。

## 啟動

在 repo 根目錄執行：

```sh
pnpm dev
```

伺服器只綁 `127.0.0.1`，請用 http://localhost:3000 開啟。

## 頁面

| 路徑                     | 內容                                                                                     |
| ------------------------ | ---------------------------------------------------------------------------------------- |
| `/`、`/<path>`           | 以 `<Render>` 顯示頁面                                                                   |
| `/edit`、`/<path>/edit`  | 以 `<Puck>` 編輯該路徑的頁面，**即使頁面還不存在**也可以建立                             |
| `/custom-ui/<path>/edit` | 以 `overrides` 與 `<Puck.Preview>` 等組合元件自訂編輯器介面的範例                        |
| `/rsc`                   | 以 React Server Components 的 `Render` 在伺服器端渲染首頁的初始資料                      |
| `/runtime-css-debug`     | 從建置後的 `packages/core/dist` 載入 `<Puck>`，檢查執行期注入的 CSS（需先 `pnpm build`） |

## 資料

- 按下 Publish 後，資料存在瀏覽器的 localStorage（key 為 `puck-demo:<元件組合>:<path>`），沒有後端。
- 初始資料在 `config/initial-data.ts`，元件設定在 `config/`。richtext 欄位的值是 Tiptap JSON。
- 若 localStorage 留有舊版 demo 存下的 HTML 字串，richtext 會以純文字顯示這些標籤。這是預期行為；在瀏覽器開發者工具中刪除 `puck-demo:` 開頭的 key 即可回到初始資料。

## 注意

demo 沒有任何登入驗證，`next` 也有尚未修補的 advisory，只能在本機開發使用，不要部署或對外開放。
