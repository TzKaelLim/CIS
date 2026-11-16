/**
 * uikit options that the block specs deliberately do not offer, with the
 * reason (spec §4.5, §5.5 #3). Keys are `${component}.${key}` as passed to
 * style(); each value maps an option to why it is left out.
 *
 * uikit-whitelist.spec.ts fails when a key used by a spec gets a uikit option
 * that is neither offered nor listed here, when an entry here is offered after
 * all, and when an entry no longer exists in uikit. button.size has no entry:
 * the Button offers all of uikit's sizes.
 *
 * Offering an option later is a compatible change (bump the spec's version and
 * delete the entry here); withdrawing one is not (spec §4.6), so start small.
 */
export const STYLE_DECISIONS: Readonly<
  Record<string, Readonly<Record<string, string>>>
> = {
  "button.variant": {
    danger: "用於刪除等危險操作；區塊按鈕只用來導覽，不需要警示色。",
    "danger-soft": "同 danger，是危險操作的淡色版本，導覽按鈕用不到。",
    ghost:
      "沒有底色也沒有外框，放在有背景的區段上看不出是按鈕；慈濟主題也沒有對應的設計。",
    tertiary:
      "慈濟主題只設計了實心（primary）、淡色（secondary）、外框（outline）三種按鈕，tertiary 沒有對應的設計。",
  },
  "typography.type": {
    body: "內文由段落區塊負責；標題區塊只放標題層級。",
    "body-sm": "內文的小字樣式由段落區塊負責，不放在標題區塊。",
    "body-xs": "內文的小字樣式由段落區塊負責，不放在標題區塊。",
    code: "程式碼樣式不適合當標題，活動頁也用不到。",
    h5: "活動頁的標題最多用到第 4 層；更深的層級讓文件結構難以閱讀，也不利於螢幕報讀。",
    h6: "活動頁的標題最多用到第 4 層；更深的層級讓文件結構難以閱讀，也不利於螢幕報讀。",
  },
  "typography.align": {
    justify: "左右對齊會拉開中文的字距，混排英數字時更明顯，降低可讀性。",
  },
  "card.variant": {
    tertiary:
      "卡片先提供預設與次要兩種層次；第三種層次等設計師在 Storybook 檢查後再決定。",
    transparent:
      "沒有背景與邊框時看不出卡片的範圍；需要無框排版時，用區段與多欄組合。",
  },
  "chip.color": {
    danger: "標籤列用來標示活動分類，不表示錯誤或危險狀態。",
    warning: "標籤列用來標示活動分類，不表示警告狀態。",
  },
  "chip.variant": {
    primary: "實心底色太搶眼，會和主要按鈕競爭視覺焦點。",
    tertiary: "標籤先提供兩種外觀；第三種等設計師在 Storybook 檢查後再決定。",
  },
  "surface.variant": {
    tertiary:
      "區段先提供無背景、預設、次要三種背景；第三層等設計師在 Storybook 檢查後再決定（慈濟主題目前沒有對應 --surface-tertiary，會顯示 HeroUI 的預設色）。",
  },
};
