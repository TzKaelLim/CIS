# tceditor

tceditor 是慈濟自行維護的 React 視覺化頁面編輯器，衍生自開源專案 [Puck](https://github.com/puckeditor/puck) 的 v0.23.0。只使用 Puck 的前端能力，不依賴 Puck 官方的 npm 套件、雲端服務與 Puck AI；後端將以自架的 Supabase 支撐。

## 來源與授權

- 來源：Puck v0.23.0（git tag `v0.23.0`，commit `b4204f09`），MIT 授權，著作權屬於 The Puck Contributors。授權全文在 `LICENSE`，衍生關係記錄在 `NOTICE`；兩個套件打包時都會附上這兩個檔案。
- tceditor 的修改同樣以 MIT 授權釋出。
- `infra/supabase/docker/` 是官方 Supabase self-hosting 設定的原樣副本，以 Apache License 2.0 授權（見 `infra/supabase/LICENSE`），不在 MIT 授權範圍內。
- 這是 hard fork：不再同步上游。上游的 bug 修正以 `git cherry-pick -x` 個別移植，並記錄在 `CHANGELOG.md`。分支 `tzuchi/main` 是主線；`main` 保留上游原樣，只供比對；remote `upstream` 只用於參考，無法推送。

## 套件

| 目錄                               | 套件名稱                                   | 版本    |
| ---------------------------------- | ------------------------------------------ | ------- |
| `packages/core`                    | `@tzuchi/tceditor`                         | `0.1.0` |
| `packages/plugin-heading-analyzer` | `@tzuchi/tceditor-plugin-heading-analyzer` | `0.1.0` |

兩個套件都標為 `private`，目前沒有發佈到任何 registry，請以 workspace 依賴使用（`pnpm add @tzuchi/tceditor --workspace`）。不要用 `npm i` 安裝同名套件：registry 上的同名套件不是本專案。

對外 API 的名稱維持 Puck 原名，例如 `<Puck>`、`<Render>`、`usePuck`、`Config` 型別、CSS class 名稱與 `data-puck-*` 屬性，所以 Puck v0.23 的文件（`apps/docs`）大部分仍然適用，差異見下一節與 `CHANGELOG.md`。

## 與上游 Puck v0.23.0 的主要差異

- **richtext 改存 JSON（不相容變更）**：richtext 欄位的值改為 Tiptap JSON（`RichTextDoc`），不再是 HTML 字串。編輯器、編輯器載入前的暫時畫面、預覽與公開頁都使用同一個靜態渲染器（`@tiptap/static-renderer`），輸出必然一致，也不再使用 `dangerouslySetInnerHTML`。渲染時一律正規化：只輸出預設 schema 內的節點與標記，逐一驗證屬性（連結只允許 `http`、`https`、`mailto`、`tel` 與相對路徑），超過 100 層的巢狀只輸出文字，舊的 HTML 字串一律當純文字顯示。
  - 渲染器的評估結論（S1 spike）：`@tiptap/static-renderer` 與 Tiptap 的輸出等價，各種典型內容渲染出的 DOM 都與 Tiptap 的 `generateHTML` 相同（`packages/core/lib/richtext/__tests__/render.spec.tsx`）；渲染時不需要 DOM；公開頁的初始 JS chunk 只增加約 2 KB gzip（上限 10 KB）。因此直接採用，不自建渲染器。
- **舊資料轉換**：伺服器端以 `@tzuchi/tceditor/richtext-migrate`（`richTextHtmlToJson`、`migrateRichTextInData`）把舊的 HTML richtext 轉成 JSON。主入口與 RSC 入口不會帶到 `@tiptap/html` 與 `happy-dom`，伺服器端渲染不再需要 happy-dom。
- **函式庫資安修補**：`mapFields`、`walkTree`、`getChanged` 的 O(n²) 合併改為一次建好；元件 type 或 id 為 `constructor`、`__proto__` 等原型成員名稱時不再崩潰或汙染資料；`<Puck>` 新增選用的 `nonce` prop，編輯器在執行期注入的 `<style>` 都會帶上它，可在 nonce-based CSP 下運作。
- **樣式**：預設樣式不再從外部網站載入 Inter 字型，字型由宿主應用提供；只剩一個樣式表 export `@tzuchi/tceditor/tceditor.css`（取代上游的 `puck.css` 與 `no-external.css`）。
- **依賴**：tiptap 全部升級並釘在 3.31.4（修補 3 筆 advisory）；移除沒有使用的依賴，補上實際使用的 `classnames`。
- **移植的上游修正**：切換視窗後卡住的修飾鍵不再誤觸快捷鍵、瀏覽器翻譯不再讓編輯器當機、inline 文字欄位 hover 時不再位移。
- **工具鏈**：yarn 1 改為 pnpm；新增 `pnpm verify`、供應鏈檢查 `pnpm audit:gate`，以及打包檢查 `pnpm check:bundle`。
- **移除**：上游的範例 app（recipes）與產生它們的 scaffolder、`field-contentful`、`plugin-emotion-cache`、GitHub workflows 與 npm 發佈流程、demo 的第三方分析。`apps/docs` 只保留作參考，不在 workspace 中，也不再建置。
- **demo**：開發伺服器只綁 `127.0.0.1`。

完整清單見 `CHANGELOG.md` 最上方的 `tceditor 0.1.0` 段落。

## 使用方式

在本 monorepo 的應用中加入依賴：

```sh
pnpm add @tzuchi/tceditor --workspace
```

編輯器（client component）：

```tsx
import { Puck, type Config, type Data } from "@tzuchi/tceditor";

const config: Config = {
  components: {
    Article: {
      fields: {
        title: { type: "text" },
        body: { type: "richtext" },
      },
      render: ({ title, body }) => (
        <article>
          <h1>{title}</h1>
          {body}
        </article>
      ),
    },
  },
};

export function Editor({ data, nonce }: { data: Data; nonce?: string }) {
  return (
    <Puck
      config={config}
      data={data}
      nonce={nonce} // 選用：頁面使用 nonce-based CSP 時傳入
      onPublish={async (data) => {
        // richtext 欄位的值是 Tiptap JSON，可直接存成 jsonb
      }}
    />
  );
}
```

公開頁：

```tsx
import { Render, type Data } from "@tzuchi/tceditor";

export function Page({ data }: { data: Data }) {
  return <Render config={config} data={data} />;
}
```

- React Server Components 會依 `react-server` 條件自動取得 RSC 版的 `Render`，也可以明確寫 `@tzuchi/tceditor/rsc`。
- 編輯器預設在執行期注入樣式。若要避免 FOUC，在樣式表中加入 `@import "@tzuchi/tceditor/tceditor.css";`。
- 單獨顯示一段 richtext 時使用 `RichTextContent`（`<RichTextContent content={value} />`），不要自行把 JSON 轉成 HTML。
- 轉換舊資料（只能在伺服器端執行）：

  ```ts
  import { migrateRichTextInData } from "@tzuchi/tceditor/richtext-migrate";

  const converted = migrateRichTextInData(data, config);
  ```

  只由 `resolveFields` 加入的 richtext 欄位不在 `config` 的靜態 `fields` 裡，預設會略過。要轉換這些欄位，傳入第三個參數 `{ getFields }`：一個同步函式，對 root（`isRoot: true`）與每個元件（`isRoot: false`）各呼叫一次，回傳該項目的欄位；回傳 `undefined` 則沿用 `config` 的 `fields`。`getFields` 不能是非同步函式（回傳 Promise 會拋錯），也會收到 `config` 沒登記的類型，查設定時要用 own-key 檢查。

## 開發環境

需求：

- Node.js 24 以上（`.nvmrc`）。
- pnpm 10.26.1（版本記在 `package.json` 的 `packageManager`）。
- 啟動 Supabase 時需要 Docker Desktop，Compose v2.24.4 以上。

安裝與驗證：

```sh
pnpm install --frozen-lockfile
pnpm verify
```

`pnpm verify` 依序執行 test、typecheck、lint、format:check、build、check:bundle、audit:gate，全部通過才算完成。目前沒有 CI，提交前請在本機執行一次。`audit:gate` 需要連網。

| 指令                | 作用                                                                                       |
| ------------------- | ------------------------------------------------------------------------------------------ |
| `pnpm test`         | core 的 jest 測試，以及 audit gate、check:bundle 的 `node:test` 測試                       |
| `pnpm typecheck`    | 以 `packages/core/tsconfig.typecheck.json` 檢查 core 的型別（不含測試檔）                  |
| `pnpm lint`         | ESLint                                                                                     |
| `pnpm format:check` | Prettier 檢查；`pnpm format` 會直接修正                                                    |
| `pnpm build`        | 建置 core、外掛與 demo                                                                     |
| `pnpm check:bundle` | 確認主入口與 RSC 入口不會引用 `@tiptap/html`、`happy-dom`（需先 build）                    |
| `pnpm audit:gate`   | 執行 `pnpm audit`，只有隨套件出貨的依賴有 advisory 時才失敗，其餘（demo 與開發工具）只列出 |
| `pnpm smoke`        | puppeteer 拖放 smoke test，需先以 `pnpm dev` 在 3000 port 啟動 demo                        |

只跑一個測試檔或一個測試：

```sh
pnpm --filter @tzuchi/tceditor test lib/richtext/__tests__/normalize.spec.ts
pnpm --filter @tzuchi/tceditor test -t "name of test"
```

## 啟動 demo

```sh
pnpm dev
```

開啟 http://localhost:3000 看頁面，http://localhost:3000/edit 進入編輯器；任何路徑後面加 `/edit` 都可以編輯該路徑的頁面。demo 把資料存在瀏覽器的 localStorage，沒有登入驗證，伺服器只綁 `127.0.0.1`，只供本機開發。其他頁面與說明見 `apps/demo/README.md`。

## 啟動 Supabase（本機開發）

`infra/supabase/` 是 tceditor 專用的自架 Supabase，compose 專案名為 `tceditor`，所有 container 以 `tceditor-` 開頭，與本機其他 Supabase stack（例如 tciam）互不干擾。

```sh
infra/supabase/setup-env.sh   # 第一次使用：產生 infra/supabase/docker/.env（祕密，不進版控）
infra/supabase/up.sh          # 啟動，等到所有服務都是 healthy
infra/supabase/down.sh        # 停止；資料保留
infra/supabase/reset.sh       # 清除 tceditor 的資料（需確認，或加 --yes）
```

| 服務                                   | 位址                    |
| -------------------------------------- | ----------------------- |
| API gateway 與 Studio                  | `http://127.0.0.1:8200` |
| Postgres（Supavisor session 模式）     | `127.0.0.1:5434`        |
| Postgres（Supavisor transaction 模式） | `127.0.0.1:6545`        |

Studio 帳密、API key 與資料庫密碼都在 `infra/supabase/docker/.env`。詳細說明與注意事項見 `infra/supabase/README.md`。

## 目錄結構

| 路徑                     | 內容                                              |
| ------------------------ | ------------------------------------------------- |
| `packages/core`          | 編輯器函式庫 `@tzuchi/tceditor`                   |
| `packages/plugin-*`      | 官方外掛                                          |
| `packages/tsconfig` 等   | 共用的 TypeScript、tsup、ESLint 設定              |
| `apps/demo`              | Next.js 開發用 playground，也是 smoke test 的目標 |
| `apps/docs`              | Puck 上游文件，只供參考，不在 workspace 中        |
| `infra/supabase`         | 本機開發用的自架 Supabase                         |
| `scripts`                | audit gate 與 e2e smoke test                      |
| `docs/superpowers/specs` | 路線圖與各子專案的設計規格                        |

## 文件

- `CLAUDE.md`：架構重點、開發指令與資安規則。給 Claude Code 使用，也是人工開發者的參考。
- `CONTRIBUTING.md`：開發流程與規範。
- `CHANGELOG.md`：tceditor 的變更紀錄，以及保留的 Puck 上游歷史。
- `docs/superpowers/specs/`：路線圖（`2026-10-08-tzuchi-puck-roadmap.md`）與 S1 設計規格（`2026-10-08-s1-fork-baseline-design.md`）。
