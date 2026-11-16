// 設計示範：依網址決定目前在手冊的哪個區域（src/prototype/sections.ts），再調整 Starlight 的頁面資料。
//
// - 側欄：astro.config.mjs 的最上層群組就是各個區域；這裡只留下目前區域的內容，攤平成一層。
// - 上一頁／下一頁：只連到同一個區域的頁面。
// - 首頁：桌機版不顯示側欄，也沒有右側的「本頁內容」。手機版的選單（同樣是側欄）仍然保留，裡面有區域導覽和偏好設定。
import { defineRouteMiddleware } from '@astrojs/starlight/route-data';
import { sectionForPath } from './prototype/sections';

/**
 * 首頁在桌機寬度隱藏側欄，內容從最左邊開始、比較寬。選擇器要比 Starlight 寫在頁面裡的
 * `[data-has-sidebar]` 更具體，因為這段 <style> 排在它前面。
 */
const HOME_LAYOUT_CSS =
  '@media (min-width: 50rem){:root[data-has-sidebar]{--sl-content-inline-start:0rem;--sl-content-width:72rem}#starlight__sidebar{display:none}}';

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

  if (section.id === 'home') {
    // 首頁是寬版的入口頁，不需要右側的「本頁內容」。
    route.toc = undefined;
    route.head.push({ tag: 'style', attrs: {}, content: HOME_LAYOUT_CSS });
  }
});
