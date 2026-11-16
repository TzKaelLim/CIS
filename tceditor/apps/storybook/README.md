# storybook

`@tzuchi/tceditor-storybook`：tceditor 區塊的 Storybook。stories 由區塊規格產生，設計師在這裡檢查中文標籤、選項順序與預設值。版本與 uikit 的 Storybook 相同：`storybook`、`@storybook/react-vite`、`@storybook/addon-docs`、`@storybook/addon-a11y` 都是 10.6.0，Vite 7.3.5，Tailwind 4.3.3。

## 啟動

在 repo 根目錄執行：

```sh
pnpm storybook
```

開發伺服器只綁 `127.0.0.1:6010`：http://127.0.0.1:6010。uikit 的 Storybook 用 6006 與 6007，所以兩者可以同時開。

建置靜態版：在根目錄執行 `pnpm build`（turbo 會一併建置），或只建 Storybook 的 `pnpm storybook:build`。產物在 `apps/storybook/storybook-static/`（不進版控）。

## 隔離的 HOME

Storybook CLI 會寫入使用者目錄的 `~/.storybook/settings.json`。本 app 的 `dev` 與 `build` 都經由 `scripts/storybook.mjs` 執行 CLI：它只對 CLI 這個子程序把 `HOME` 指向 `apps/storybook/.home`（不進版控），並設 `STORYBOOK_DISABLE_TELEMETRY=1`；6010 已被佔用時直接結束，不會改用別的 port。所以不要直接執行 `storybook` 指令，一律透過 `pnpm storybook`、`pnpm storybook:build` 或本 app 的 scripts。設定也關閉了 telemetry、當機回報、版本檢查與「新功能」資料的請求，不會連到 storybook.js.org。

## stories

- stories 是 `packages/blocks/src/**/*.stories.tsx`，由 `pnpm gen:blocks` 依規格產生，不可手改。`.storybook/main.ts` 的 glob 以 `.storybook/` 目錄為基準，所以寫成 `../../../packages/blocks/src/**/*.stories.tsx`。
- 每個區塊的 `title` 是 `區塊/<中文名稱>`，並指定 ASCII 的 `id`：`blocks-` 加上類型的 kebab-case，例如 `blocks-tag-list`。story 的 export 名稱是 `Default`、`Example1`…，網址因此穩定，掛進 uikit 時也沒有編碼問題。
- 每個區塊有一個 `Default` story（規格的預設值），加上規格的每個範例各一個 story，並開啟 autodocs 文件頁。`args` 與帶中文標籤的 `argTypes` 在產生時由規格算好，直接寫在 story 檔裡，規格改變時從 diff 就看得到控制項的變化；`typescript.reactDocgen` 關閉。
- story 用 `@tzuchi/tceditor/rsc` 的 `<Render>` 渲染只有這個區塊的頁面，輸出的 HTML 與示範站的公開頁相同；放置區的子區塊由範例帶入。頁面先經過驗證器補齊預設值；不合格的值（例如還沒填網址的按鈕）照原樣顯示，讓設計師也看得到未完成的區塊。
- 工具列可以切換慈濟與慈濟深色主題，預設是慈濟主題，設定在 `<html data-theme>`。
- 示範圖片以 `staticDirs` 取自 `apps/showcase/public/demo-assets`。
- 不從第三方網域載入字型或腳本。字型用 tokens 的 `--tc-font-family-base`，沒有安裝 Noto Sans TC 時改用系統字型。

## 逐一開啟 story 的檢查

```sh
pnpm build
pnpm storybook:smoke
```

`scripts/storybook-smoke.mjs` 在 `127.0.0.1:6008` 提供 `storybook-static`，先拿 `index.json` 和 `packages/blocks/generated/catalog.json` 比對，確認每個區塊都有文件頁、`Default` story 與每個範例的 story，再用 puppeteer 逐一開啟每個 story 與文件頁。出現頁面錯誤、console error、Storybook 的錯誤畫面、缺少的區塊或 story、不是慈濟主題，或對其他網域的請求時，以非 0 結束；通過時最後一行是 `storybook:smoke OK`。它是 `pnpm verify` 的一部分。puppeteer 使用真正的 `HOME`，才找得到 `~/.cache/puppeteer` 裡的 Chrome。

## 掛進 uikit 的 Storybook

S2 不修改 uikit。要在 uikit 的 Storybook 看到這裡的區塊時，在 uikit 的 `heroui/storybook/.storybook/main.ts` 的設定加上：

```ts
const config: StorybookConfig = {
  // …uikit 既有的設定
  refs: {
    tceditor: {
      title: "tceditor 區塊",
      url: "http://127.0.0.1:6010", // 本機開發用；區塊 Storybook 部署後改成正式網址
    },
  },
};
```

區塊 Storybook 部署到 Cloudflare Pages 這類靜態主機時，要允許 uikit 的網域跨域讀取 `index.json` 與 `iframe.html`（CORS）。部署位置等 repo 與 CI 平台決定後再處理。
