// 手冊頁面這一邊的範本 iframe：
//
// - startFrameSync()：讓頁面上每一個範本 iframe（[data-tc-template-frame]）跟著頁首的
//   網站主題（<html data-site>）和色彩模式（<html data-theme>）變。iframe 載入後會送 READY，
//   這裡回一則 LOOK；之後 <html> 的這兩個屬性一變，就送 LOOK 給全部的 iframe，不必重新載入。
// - fitThumbs()：縮圖（[data-tc-thumb="<排版寬度>"]）裡的 iframe 固定用那個寬度排版，
//   再依縮圖格子的寬度整塊縮小；iframe 的高度跟著放大，縮小後剛好填滿格子。
import { FRAME_LOOK, FRAME_READY, isFrameMessage, type FrameLook } from './template-frame-messages';

export const FRAME_SELECTOR = 'iframe[data-tc-template-frame]';

/** 目前頁首選的網站主題和色彩模式。 */
export function currentLook(): FrameLook {
  const root = document.documentElement;
  return {
    type: FRAME_LOOK,
    site: root.dataset.site ?? '',
    mode: root.dataset.theme === 'dark' ? 'dark' : 'light',
  };
}

export function postLook(frame: HTMLIFrameElement, look: FrameLook = currentLook()): void {
  frame.contentWindow?.postMessage(look, location.origin);
}

let syncing = false;

export function startFrameSync(): void {
  if (syncing) return;
  syncing = true;
  const frames = () => document.querySelectorAll<HTMLIFrameElement>(FRAME_SELECTOR);
  new MutationObserver(() => {
    const look = currentLook();
    frames().forEach((frame) => postLook(frame, look));
  }).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-site', 'data-theme'],
  });
  window.addEventListener('message', (event) => {
    if (event.origin !== location.origin || !isFrameMessage(event.data, FRAME_READY)) return;
    for (const frame of frames()) {
      if (frame.contentWindow === event.source) postLook(frame);
    }
  });
}

let thumbObserver: ResizeObserver | undefined;

function fitThumb(thumb: HTMLElement): void {
  const layoutWidth = Number(thumb.dataset.tcThumb);
  const frame = thumb.querySelector<HTMLIFrameElement>(FRAME_SELECTOR);
  const width = thumb.clientWidth;
  const height = thumb.clientHeight;
  if (!frame || !(layoutWidth > 0) || width === 0 || height === 0) return;
  const scale = width / layoutWidth;
  frame.style.transform = `scale(${scale})`;
  frame.style.blockSize = `${Math.ceil(height / scale)}px`;
}

/** 把頁面上所有縮圖縮放到格子的大小，格子變大變小時重新計算。 */
export function fitThumbs(): void {
  thumbObserver ??= new ResizeObserver((entries) => {
    for (const entry of entries) {
      if (entry.target instanceof HTMLElement) fitThumb(entry.target);
    }
  });
  document.querySelectorAll<HTMLElement>('[data-tc-thumb]').forEach((thumb) => {
    thumbObserver?.observe(thumb);
    fitThumb(thumb);
  });
}
