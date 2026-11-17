// 頁首圖示的線條路徑（24×24 的畫布，1.5px 線寬）。這些圖示是手冊自己畫的，不是圖示套件。

export type HeaderIconName =
  | 'search'
  | 'moon'
  | 'sun'
  | 'palette'
  | 'github'
  | 'check'
  | 'close'
  | 'chevron-left'
  | 'chevron-right';

export const HEADER_ICON_PATHS: Record<HeaderIconName, readonly string[]> = {
  // 放大鏡：圓圈加把手。
  search: ['M10.75 4.25a6.5 6.5 0 1 0 0 13a6.5 6.5 0 1 0 0-13Z', 'M15.5 15.5 19.75 19.75'],
  // 月亮：淺色時顯示，按下去切換到深色。
  moon: ['M19.75 14.4A8 8 0 0 1 9.6 4.25a8 8 0 1 0 10.15 10.15Z'],
  // 太陽：深色時顯示，按下去切換到淺色。
  sun: [
    'M12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8Z',
    'M12 2.75v1.5',
    'M12 19.75v1.5',
    'M2.75 12h1.5',
    'M19.75 12h1.5',
    'M5.46 5.46l1.06 1.06',
    'M17.48 17.48l1.06 1.06',
    'M5.46 18.54l1.06-1.06',
    'M17.48 6.52l1.06-1.06',
  ],
  // 調色盤：主題。
  palette: [
    'M12 3.5a8.5 8.5 0 0 0 0 17c.95 0 1.6-.7 1.6-1.6c0-.45-.17-.83-.45-1.13c-.27-.3-.44-.68-.44-1.12c0-.9.73-1.65 1.64-1.65h1.95a4.2 4.2 0 0 0 4.2-4.2C20.5 6.7 16.7 3.5 12 3.5Z',
    'M7.75 11.5a.75.75 0 1 0 0 1.5a.75.75 0 1 0 0-1.5Z',
    'M9.5 7.25a.75.75 0 1 0 0 1.5a.75.75 0 1 0 0-1.5Z',
    'M14.25 6.75a.75.75 0 1 0 0 1.5a.75.75 0 1 0 0-1.5Z',
  ],
  // GitHub 的貓：簡化的線條輪廓。
  github: [
    'M9 21v-3.1c0-.95.3-1.65.8-2.15c-2.9-.3-5.3-1.5-5.3-5.4c0-1.1.4-2.05 1.1-2.8c-.1-.35-.45-1.55.1-3c0 0 .9-.3 3 1.1a10.3 10.3 0 0 1 5.4 0c2.1-1.4 3-1.1 3-1.1c.55 1.45.2 2.65.1 3c.7.75 1.1 1.7 1.1 2.8c0 3.9-2.4 5.1-5.3 5.4c.5.5.8 1.3.8 2.3V21',
    'M9 18.25c-2.9.9-3.55-1.3-5-1.75',
  ],
  // 打勾：選單裡目前選擇的項目。
  check: ['M5 12.5 9.5 17 19 7.25'],
  // 叉叉：關閉對話框（範本預覽）。
  close: ['M6.5 6.5 17.5 17.5', 'M17.5 6.5 6.5 17.5'],
  // 左右箭頭：範本預覽的「上一個」「下一個」。
  'chevron-left': ['M14.5 6 8.5 12l6 6'],
  'chevron-right': ['M9.5 6l6 6-6 6'],
};

/** 把一個圖示畫成 CSS 的 data URL（給 mask-image 用；不是外部檔案）。 */
export function iconDataUrl(name: HeaderIconName): string {
  const paths = HEADER_ICON_PATHS[name].map((d) => `<path d='${d}'/>`).join('');
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'>${paths}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
