# storybook

`@tzuchi/tceditor-storybook`：tceditor 區塊的 Storybook。`packages/blocks` 的每個區塊都有控制項、文件頁與範例，套用慈濟主題，工具列可以切換深色主題。stories 由 `pnpm gen:blocks` 依區塊規格產生。

在 repo 根目錄執行：

```sh
pnpm storybook        # 開發伺服器：http://127.0.0.1:6010
pnpm storybook:build  # 只建置 apps/storybook/storybook-static
pnpm build            # turbo 也會一併建置 storybook-static
pnpm storybook:smoke  # build 之後：用 Chrome 逐一開啟每個 story 與文件頁
```

Storybook CLI 一律經由 `scripts/storybook.mjs` 執行，`HOME` 指向 `apps/storybook/.home`（不進版控），所以不會寫入你自己的 `~/.storybook`。
