// 頁首「主題」選單的狀態與顯示規則。
//
// 手冊是靜態網站，所以「跟著主題變」的內容在建置時就把每個主題各畫一份，
// 再用 <html data-site="…"> 和這裡產生的 CSS 只顯示目前選擇的那一份。
// 這些規則和 <head> 裡的小段 script 都由 SITE_THEMES 產生：新增主題不必手寫任何規則。
// astro.config.mjs 透過 Starlight 的 head 選項把它們放進每一頁的 <head>。
import { DEFAULT_SITE, SITE_THEMES, sitePageUrl } from './site-themes';

/** localStorage 的 key，記住讀者選的主題（key 名稱沿用舊的 site）。 */
export const SITE_STORAGE_KEY = 'tc-handbook-site';
/** 網址參數：?site=<id> 會蓋過記住的選擇，並且被記住。 */
export const SITE_URL_PARAM = 'site';

/**
 * 「目前選擇的主題是 id」時要套用的選擇器。對每個主題各產生一條；
 * <html> 沒有 data-site（沒有 JavaScript）或值不在名單裡時，視為選了預設主題。
 */
export function selectedSiteSelectors(target: (id: string) => string): string[] {
  const noKnownSite = `:root${SITE_THEMES.map((s) => `:not([data-site="${s.id}"])`).join('')}`;
  return [
    ...SITE_THEMES.map((s) => `:root[data-site="${s.id}"] ${target(s.id)}`),
    `${noKnownSite} ${target(DEFAULT_SITE.id)}`,
  ];
}

/**
 * 全站共用的顯示規則：
 * - `.site-only[data-site-only="id"]`：只在選了這個主題時顯示（SiteOnly.astro、PerSite.astro 用）。
 * - `[data-site-card="id"]`：選了這個主題時加上左側色條和淡品牌底色（總覽頁的主題卡片用）。
 *   刻意不用外框，才不會和鍵盤焦點框混在一起。
 */
export function siteSelectionCss(): string {
  const shown = selectedSiteSelectors((id) => `.site-only[data-site-only="${id}"]`);
  const current = selectedSiteSelectors((id) => `[data-site-card="${id}"]`);
  return [
    '.site-only{display:none}',
    // revert：div 回到 block、span 回到 inline，前後段落的間距照 Starlight 原本的規則。
    `${shown.join(',')}{display:revert}`,
    `${current.join(',')}{border-color:var(--sl-color-accent);box-shadow:inset 4px 0 0 var(--sl-color-accent);background-color:var(--sl-color-accent-low)}`,
  ].join('\n');
}

/**
 * 在第一次繪製前設定 <html data-site>。順序：網址 ?site= → localStorage → 預設主題。
 * 網址上不認得的 id 當作網址沒有這個參數（改讀 localStorage，和範本畫面頁相同）；
 * localStorage 裡不認得的 id 也略過，改用預設主題。localStorage 不能用（私密視窗、封鎖）時直接略過。
 * 所以改名前留下的舊 id（例如 ?site=eco 的舊連結，或 localStorage 裡的 eco）會安靜地退回
 * 預設主題，不會報錯；舊值留在 localStorage 裡無害，讀者下次改選時就會被蓋掉。
 */
export function siteInitScript(): string {
  const ids = JSON.stringify(SITE_THEMES.map((s) => s.id));
  const fallback = JSON.stringify(DEFAULT_SITE.id);
  const key = JSON.stringify(SITE_STORAGE_KEY);
  const param = JSON.stringify(SITE_URL_PARAM);
  return `(function(){var ids=${ids},site=${fallback},key=${key};var fromUrl=null;try{fromUrl=new URLSearchParams(location.search).get(${param})}catch(e){}if(fromUrl!==null&&ids.indexOf(fromUrl)>=0){site=fromUrl;try{localStorage.setItem(key,site)}catch(e){}}else{try{var saved=localStorage.getItem(key);if(saved&&ids.indexOf(saved)>=0)site=saved}catch(e){}}document.documentElement.setAttribute('data-site',site)})();`;
}

/** Starlight `head` 選項用的兩個標籤。 */
export function siteHeadTags(): { tag: 'script' | 'style'; content: string }[] {
  return [
    { tag: 'script', content: siteInitScript() },
    { tag: 'style', content: siteSelectionCss() },
  ];
}

/** 側欄「主題」→「各主題」的連結，一個主題一項。 */
export function siteSidebarItems(): {
  label: string;
  link: string;
  badge?: { text: string; variant: 'note' | 'caution' };
}[] {
  return SITE_THEMES.map((s) => ({
    label: s.名稱,
    link: sitePageUrl(s),
    ...(s.isDefault
      ? { badge: { text: '預設', variant: 'note' as const } }
      : s.isDemo
        ? { badge: { text: '示意', variant: 'caution' as const } }
        : {}),
  }));
}
