// 範本目錄。範本總覽頁（/templates/）的卡片和預覽對話框、只有範本的畫面頁
// （/templates/frame/<id>/，縮圖和預覽用 iframe 載入它）、舊網址的轉址頁（/templates/<id>/）
// 和首頁的範本預覽都由這份資料產生。
//
// 新增一個範本 = 在 TEMPLATES 加一筆，並在 src/components/templates/ 放一個 <id>.astro
// （用真正的 <tc-*> 元件組成的整頁畫面）。astro.config.mjs 和 scripts/docs/handbook.test.mjs
// 會檢查兩邊一致。
//
// 範本裡不要放外部圖片或網址；需要照片的地方用 CSS 漸層色塊代替。
import { COMPONENTS } from './component-catalog';

export type TemplateCategoryId = 'home' | 'list' | 'content' | 'publication';

export interface TemplateCategory {
  id: TemplateCategoryId;
  名稱: string;
}

/** 範本總覽頁的篩選標籤依這個順序排列。 */
export const TEMPLATE_CATEGORIES: readonly TemplateCategory[] = [
  { id: 'home', 名稱: '入口頁' },
  { id: 'list', 名稱: '列表' },
  { id: 'content', 名稱: '內容頁' },
  { id: 'publication', 名稱: '出版品' },
];

export interface TemplateEntry {
  /** 網址和範本元件的檔名（src/components/templates/<id>.astro）。 */
  id: string;
  名稱: string;
  分類: TemplateCategoryId;
  /** 一句話說明這個範本適合用在哪裡。 */
  說明: string;
  /** 這個範本用到的元件，填元件目錄（component-catalog.ts）的 id。 */
  使用的元件: readonly string[];
}

/** 畫面頁網址裡的固定段落：/templates/frame/<id>/。 */
export const FRAME_SEGMENT = 'frame';

/** 範本總覽頁上打開預覽的網址參數：/templates/?t=<id>。 */
export const TEMPLATE_PREVIEW_PARAM = 't';

/** 預覽對話框的三種寬度（px）。畫面頁在 iframe 裡用這個寬度排版，所以導覽列、頁尾會換成那個寬度的版面。 */
export const PREVIEW_WIDTHS = [
  { id: 'desktop', 名稱: '桌機', px: 1280 },
  { id: 'tablet', 名稱: '平板', px: 768 },
  { id: 'phone', 名稱: '手機', px: 390 },
] as const;

/** 縮圖用多寬排版（px）：縮圖一律是桌機版面，再整塊縮小。 */
export const THUMB_LAYOUT_WIDTH = 1280;

export const TEMPLATES: readonly TemplateEntry[] = [
  {
    id: 'portal-home',
    名稱: '入口首頁',
    分類: 'home',
    說明: '網站的第一頁：大標題、搜尋、最新消息和活動訊息，一頁看到網站的重點。',
    使用的元件: [
      'navbar',
      'button',
      'icon-button',
      'search-bar',
      'chip',
      'badge',
      'article-card',
      'list-panel',
      'link',
      'footer',
    ],
  },
  {
    id: 'article-list',
    名稱: '文章列表',
    分類: 'list',
    說明: '新聞或文章的列表頁：依分類篩選、逐則瀏覽，內容多時分頁。',
    使用的元件: [
      'navbar',
      'search-bar',
      'chip',
      'badge',
      'article-card',
      'list-panel',
      'pagination',
      'link',
      'footer',
    ],
  },
  {
    id: 'article-detail',
    名稱: '文章內頁',
    分類: 'content',
    說明: '一篇文章的完整內容：標題、日期、內文，最後推薦相關文章。',
    使用的元件: ['navbar', 'badge', 'link', 'button', 'article-card', 'footer'],
  },
  {
    id: 'ebook-library',
    名稱: '電子書庫',
    分類: 'publication',
    說明: '書籍與出版品的書架：依類別瀏覽封面，接著閱讀上次看到的那一本。',
    使用的元件: [
      'navbar',
      'search-bar',
      'tabs',
      'book-card',
      'ebook-toolbar',
      'button',
      'pagination',
      'footer',
    ],
  },
];

for (const [i, entry] of TEMPLATES.entries()) {
  if (TEMPLATES.findIndex((t) => t.id === entry.id) !== i)
    throw new Error(`範本目錄的 id 重複：${entry.id}`);
  if (!/^[a-z][a-z0-9-]{0,47}$/.test(entry.id))
    throw new Error(`範本 id「${entry.id}」只能用小寫英數和連字號`);
  if (entry.id === FRAME_SEGMENT)
    throw new Error(
      `範本 id 不可以是「${FRAME_SEGMENT}」：/templates/${FRAME_SEGMENT}/ 是畫面頁的網址`,
    );
  if (!TEMPLATE_CATEGORIES.some((c) => c.id === entry.分類))
    throw new Error(`範本 ${entry.id} 的分類 ${entry.分類} 不存在`);
  for (const id of entry.使用的元件) {
    if (!COMPONENTS.some((c) => c.id === id))
      throw new Error(`範本 ${entry.id} 用到的元件 ${id} 不在元件目錄裡`);
  }
}

/** 範本的網址：範本總覽頁，並直接打開這個範本的預覽。 */
export const templateUrl = (entry: TemplateEntry): string =>
  `/templates/?${TEMPLATE_PREVIEW_PARAM}=${entry.id}`;

/** 只有範本本身的畫面頁（沒有手冊的頁首和側欄），縮圖和預覽對話框用 iframe 載入它。 */
export const templateFrameUrl = (entry: TemplateEntry): string =>
  `/templates/${FRAME_SEGMENT}/${entry.id}/`;

export function getTemplate(id: string): TemplateEntry {
  const entry = TEMPLATES.find((t) => t.id === id);
  if (!entry) throw new Error(`範本目錄裡沒有 ${id}`);
  return entry;
}

export function getTemplateCategory(id: TemplateCategoryId): TemplateCategory {
  const category = TEMPLATE_CATEGORIES.find((c) => c.id === id);
  if (!category) throw new Error(`沒有 id 為 ${id} 的範本分類`);
  return category;
}

/** 有範本的分類（篩選標籤只列這些），順序照 TEMPLATE_CATEGORIES。 */
export const usedTemplateCategories = (): TemplateCategory[] =>
  TEMPLATE_CATEGORIES.filter((c) => TEMPLATES.some((t) => t.分類 === c.id));
