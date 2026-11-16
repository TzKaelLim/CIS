// 讀者選的網站主題：頁首的「網站主題」選單（SiteMenu.astro）和手機選單裡的下拉選單
// （SiteSelect.astro）共用這段程式，兩個控制項才會一直顯示同一個網站。
//
// 狀態放在 <html data-site="…">，第一次繪製前由 <head> 裡的 script 設好
// （src/data/site-selection.ts 的 siteInitScript）。這裡只負責讀者改選時更新屬性、記住選擇、
// 更新網址上的 ?site=，再通知所有控制項重新顯示。
//
// 設定（localStorage 的 key、網址參數、網站 id 清單）寫在控制項的 data-* 屬性上，
// 這樣瀏覽器不必載入網站主題的整份資料。

/** 網站主題改變時在 document 上發出的事件。 */
export const SITE_CHANGE_EVENT = 'tc-site-change';

interface SiteConfig {
  storageKey: string;
  urlParam: string;
  ids: string[];
}

function readConfig(): SiteConfig | null {
  const el = document.querySelector<HTMLElement>('[data-site-ids]');
  if (!el) return null;
  return {
    storageKey: el.dataset.storageKey ?? '',
    urlParam: el.dataset.urlParam ?? '',
    ids: (el.dataset.siteIds ?? '').split(',').filter((id) => id !== ''),
  };
}

/** 目前選的網站 id（沒有 JavaScript 時 <html> 沒有 data-site）。 */
export const currentSite = (): string | undefined => document.documentElement.dataset.site;

const notify = (): void => {
  document.dispatchEvent(new CustomEvent(SITE_CHANGE_EVENT));
};

/** 網站主題改變時（這一頁、別的分頁或從「上一頁」回來）呼叫 callback。 */
export function onSiteChange(callback: () => void): void {
  document.addEventListener(SITE_CHANGE_EVENT, callback);
}

/** 套用讀者選的網站：更新 <html data-site>、記住選擇、更新網址上的 ?site=。 */
export function applySite(id: string): void {
  const config = readConfig();
  if (!config || !config.ids.includes(id)) return;
  document.documentElement.dataset.site = id;
  try {
    if (config.storageKey) localStorage.setItem(config.storageKey, id);
  } catch {
    // 私密視窗或封鎖網站資料時不能記住，但這一頁照樣切換。
  }
  // 網址上有 ?site= 時一併更新，否則重新整理會回到網址上的舊值。
  if (config.urlParam) {
    const url = new URL(location.href);
    if (url.searchParams.has(config.urlParam)) {
      url.searchParams.set(config.urlParam, id);
      history.replaceState(history.state, '', url);
    }
  }
  notify();
}

/** 從「上一頁」回來（bfcache）或在別的分頁改選時，改用記住的選擇（網址上有認得的 ?site= 時以網址為準）。 */
function restoreFromStorage(): void {
  const config = readConfig();
  if (!config || !config.storageKey) return;
  try {
    const saved = localStorage.getItem(config.storageKey);
    const fromUrl = config.urlParam
      ? new URLSearchParams(location.search).get(config.urlParam)
      : null;
    const urlKnown = fromUrl !== null && config.ids.includes(fromUrl);
    if (!urlKnown && saved && config.ids.includes(saved)) {
      document.documentElement.dataset.site = saved;
    }
  } catch {
    // 讀不到就維持目前的值。
  }
  notify();
}

window.addEventListener('pageshow', (event) => {
  if (event.persisted) restoreFromStorage();
});
window.addEventListener('storage', (event) => {
  if (event.key === readConfig()?.storageKey) restoreFromStorage();
});
