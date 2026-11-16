// 設計示範：依網址決定目前在手冊的哪個區域（src/prototype/sections.ts），再調整 Starlight 的頁面資料。
//
// - 側欄：astro.config.mjs 的最上層群組就是各個區域；這裡只留下目前區域的內容，攤平成一層。
// - 上一頁／下一頁：只連到同一個區域的頁面；元件、範本、網站主題的總覽頁不放。
// - 首頁和網站主題總覽：桌機版不顯示側欄，也沒有右側的「本頁內容」。手機版的選單（同樣是側欄）
//   仍然保留，裡面有區域導覽和偏好設定。網站主題總覽自己有一欄網站清單，所以不需要側欄。
import { defineRouteMiddleware } from '@astrojs/starlight/route-data';
import { getSection, isSectionHome, sectionForPath } from './prototype/sections';

/**
 * 寬版頁面在桌機寬度隱藏側欄，內容從最左邊開始。內容寬度沿用 handbook.css 給「沒有右側目錄」
 * 頁面的 76rem。選擇器要比 Starlight 寫在頁面裡的 `[data-has-sidebar]` 更具體，
 * 因為這段 <style> 排在它前面。
 */
const WIDE_LAYOUT_CSS =
  '@media (min-width: 50rem){:root[data-has-sidebar]{--sl-content-inline-start:0rem}#starlight__sidebar{display:none}}';

export const onRequest = defineRouteMiddleware((context) => {
  const route = context.locals.starlightRoute;
  const section = sectionForPath(context.url.pathname);

  const group = route.sidebar.find(
    (entry) => entry.type === 'group' && entry.label === section.label,
  );
  route.sidebar = group && group.type === 'group' ? group.entries : [];

  const sameSection = (href: string): boolean => sectionForPath(href).id === section.id;
  if (route.pagination.prev && !sameSection(route.pagination.prev.href)) {
    route.pagination.prev = undefined;
  }
  if (route.pagination.next && !sameSection(route.pagination.next.href)) {
    route.pagination.next = undefined;
  }

  // 元件、範本、網站主題的總覽是圖庫，不是文章：底部不放「上一頁／下一頁」。
  const isGallery =
    section.id !== 'home' && section.id !== 'docs' && isSectionHome(section, context.url.pathname);
  if (isGallery) {
    route.pagination.prev = undefined;
    route.pagination.next = undefined;
  }

  const isWide = section.id === 'home' || isSectionHome(getSection('themes'), context.url.pathname);
  if (isWide) {
    // 寬版的入口頁，不需要右側的「本頁內容」。
    route.toc = undefined;
    route.head.push({ tag: 'style', attrs: {}, content: WIDE_LAYOUT_CSS });
  }
});
