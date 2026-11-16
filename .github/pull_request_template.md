<!-- 規則：docs/rules/01-co-editing-sop.md。用白話寫，人員只寫職稱；不附預覽截圖（待決定 Q11）。 -->

## 改了什麼

## 哪些畫面會變

## 請看哪幾頁

<!-- 寫頁面路徑，不寫網址：手冊例如 /components/button/，Storybook 寫 story 名稱（例如 Components/Button）。再寫要選的網站主題和色彩模式（淺色／深色）。核可人請照 docs/rules/01-co-editing-sop.md 步驟 5「核可人怎麼看預覽」。 -->

## 屬於哪一級

<!-- 怎麼選：docs/rules/02-design-rules.md 第 7 節「PR 的『屬於哪一級』怎麼寫」。 -->

- [ ] 第一級：只有 CSS 的值不同（網站主題覆寫）
- [ ] 第二級：內容一樣、排列不同（同一個元件的變體）
- [ ] 第三級：別的網站沒有的資料或行為（新元件；路線圖編號：）
- [ ] 不適用

理由：

## 檢查結果

- [ ] `pnpm --filter @tzuchi/tokens test`
- [ ] `pnpm run heroui:theme`；`git add` 之後重跑，`variables.css` 沒有再變（`git diff --exit-code`）
- [ ] `pnpm run test:scripts`
- [ ] `pnpm run docs:build`（手冊的建置）
- [ ] `pnpm lint`
- [ ] 改到 `heroui/`：`pnpm run heroui:storybook:build`，以及改到的套件的 `typecheck`
- [ ] 改到顏色：淺色和深色都看過；這次改到的文字和背景的對比：
- [ ] `git diff --cached` 看過：沒有姓名、電子郵件、主機名稱、本機路徑、金鑰，也沒有新的外部網址

需要核可：<!-- 照 docs/rules/01-co-editing-sop.md 第 1 節：美編（設計）／工程／專案負責人 -->

## 合併之後

- [ ] 改到 token 或 HeroUI 的樣式：合併的人告訴頁面編輯器（tceditor）的維護者
