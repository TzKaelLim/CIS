// 手冊頁面和範本畫面頁（/templates/frame/<id>/，在 iframe 裡）之間傳的訊息。
//
// 兩邊在同一個網域，所以收訊息時一律檢查 event.origin === location.origin，
// 畫面頁另外檢查訊息來自它的上一層視窗；格式不對的訊息直接略過。
//
// - 畫面頁載入後送 READY 給上一層；上一層回一則 LOOK（目前的主題和色彩模式）。
// - 讀者在頁首切換主題或色彩模式時，上一層送 LOOK 給頁面上每一個範本 iframe。
// - 焦點在 iframe 裡時按 Esc，畫面頁送 ESCAPE，讓上一層關掉預覽對話框。

export const FRAME_READY = 'tc-template-frame:ready';
export const FRAME_LOOK = 'tc-template-frame:look';
export const FRAME_ESCAPE = 'tc-template-frame:escape';

export type FrameMode = 'light' | 'dark';

export interface FrameLook {
  type: typeof FRAME_LOOK;
  site: string;
  mode: FrameMode;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export function isFrameLook(value: unknown): value is FrameLook {
  return (
    isRecord(value) &&
    value.type === FRAME_LOOK &&
    typeof value.site === 'string' &&
    (value.mode === 'light' || value.mode === 'dark')
  );
}

export const isFrameMessage = (value: unknown, type: string): boolean =>
  isRecord(value) && value.type === type;
