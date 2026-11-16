<!-- 規則：docs/rules/01-co-editing-sop.md。用白話寫，人員只寫職稱；不附預覽截圖。 -->

## 改了什麼

## 哪些畫面會變

## 請看哪幾頁

<!-- 本機網址，以及要選的網站主題和色彩模式（淺色／深色）。 -->

## 屬於哪一級

- [ ] 第一級：只有 CSS 的值不同（網站主題覆寫）
- [ ] 第二級：內容一樣、排列不同（同一個元件的變體）
- [ ] 第三級：別的網站沒有的資料或行為（新元件）
- [ ] 不適用

理由：

## 檢查結果

- [ ] `pnpm --filter @tzuchi/tokens test`
- [ ] `pnpm run heroui:theme` 後 `variables.css` 沒有差異
- [ ] `pnpm run test:scripts`
- [ ] `pnpm lint`
- [ ] 改到 `heroui/`：`pnpm run heroui:storybook:build`

需要核可：<!-- 美編（設計）／工程／專案負責人 -->
