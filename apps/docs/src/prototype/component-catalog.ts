// 設計示範：元件目錄。元件總覽頁（/components/）的卡片、側欄「元件」的清單和
// 元件頁上方的「分類 · 英文名」都由這份資料產生。新增一個元件 = 在 COMPONENTS 加一筆，
// 並在 src/content/docs/components/ 放同名的 .mdx 頁面（astro.config.mjs 會檢查兩邊一致）。
//
// preview 是卡片上的小預覽：用真正的 <tc-*> 元件寫成的 HTML，會跟著頁首的網站主題和
// 色彩模式變色。不要放外部圖片或網址；需要圖片的地方用 PLACEHOLDER_MEDIA 這類色塊代替。

export type CategoryId = 'action' | 'form' | 'content' | 'navigation' | 'layout' | 'other';

export interface Category {
  id: CategoryId;
  名稱: string;
  /** 一句話說明這一類元件做什麼，顯示在總覽頁的分類標題下。 */
  說明: string;
}

/** 總覽頁和側欄依這個順序排列分類。 */
export const CATEGORIES: readonly Category[] = [
  { id: 'action', 名稱: '動作', 說明: '讓讀者按下去做一件事，或前往另一個地方。' },
  { id: 'form', 名稱: '表單', 說明: '讓讀者輸入文字、搜尋或做選擇。' },
  { id: 'content', 名稱: '內容', 說明: '把文章、書籍、消息等內容整理成一塊一塊。' },
  { id: 'navigation', 名稱: '導覽', 說明: '幫讀者知道自己在哪裡、接下來可以去哪裡。' },
  { id: 'layout', 名稱: '版面', 說明: '決定內容的寬度與排列，本身看不見。' },
  { id: 'other', 名稱: '其他', 說明: '圖示與色彩模式切換等輔助元件。' },
];

export interface ComponentPreview {
  /** 卡片預覽的 HTML（真正的 <tc-*> 元件，或版面元件的示意圖）。 */
  html: string;
  /**
   * 縮放比例（0–1）。比較大的元件（導覽列、頁尾、卡片）先用比較寬的版面排好，
   * 再整塊縮小放進預覽格，不會超出邊界。預設 1。
   */
  scale?: number;
  /** true = 示意圖，不是真正的元件（版面元件本身看不見）。 */
  schematic?: boolean;
}

export interface ComponentEntry {
  /** 和 src/content/docs/components/<id>.mdx 的檔名相同。 */
  id: string;
  中文名: string;
  英文名: string;
  category: CategoryId;
  /** 一句話用途，寫給設計和內容同仁看。 */
  用途: string;
  preview: ComponentPreview;
}

/** 代替圖片的色塊：跟著網站主題的品牌底色走，不需要載入外部圖片。 */
const PLACEHOLDER_MEDIA = (slot: string, ratio = '16/10'): string =>
  `<div slot="${slot}" style="aspect-ratio:${ratio};background:linear-gradient(135deg,var(--tc-color-brand-surface-hover),var(--tc-color-brand-surface))"></div>`;

const CHEVRON_LEFT =
  '<svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor" aria-hidden="true"><path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>';
const CHEVRON_DOWN =
  '<svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor" aria-hidden="true"><path d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z"/></svg>';

/** 版面元件的示意圖用的小方塊。 */
const BOX = (text: string, extra = ''): string =>
  `<div style="display:grid;place-items:center;min-block-size:44px;border-radius:8px;background:var(--tc-color-brand-surface);color:var(--tc-color-brand-primary);font:600 14px/1.2 var(--tc-font-family-base);${extra}">${text}</div>`;

export const COMPONENTS: readonly ComponentEntry[] = [
  // ── 動作 ────────────────────────────────────────────────────────────
  {
    id: 'button',
    中文名: '按鈕',
    英文名: 'Button',
    category: 'action',
    用途: '送出、確認、下一步等最主要的動作。',
    preview: {
      html: '<tc-button variant="filled">送出</tc-button><tc-button variant="outlined">取消</tc-button><tc-button variant="tonal">更多</tc-button>',
      scale: 0.8,
    },
  },
  {
    id: 'icon-button',
    中文名: '圖示按鈕',
    英文名: 'Icon Button',
    category: 'action',
    用途: '只有圖示、沒有文字的圓形按鈕，例如返回、展開。',
    preview: {
      html: `<tc-icon-button variant="tonal" label="返回">${CHEVRON_LEFT}</tc-icon-button><tc-icon-button variant="filled" label="展開">${CHEVRON_DOWN}</tc-icon-button>`,
      scale: 0.8,
    },
  },
  {
    id: 'link',
    中文名: '連結',
    英文名: 'Link',
    category: 'action',
    用途: '在文字中帶讀者前往另一個頁面。',
    preview: {
      html: '<tc-link href="#">詳細了解我們所做的</tc-link><tc-link variant="subtle" href="#">隱性連結</tc-link>',
    },
  },
  {
    id: 'chip',
    中文名: '膠囊標籤',
    英文名: 'Chip',
    category: 'action',
    用途: '可以點選、切換或移除的小標籤，常用在篩選。',
    preview: {
      html: '<tc-chip>全部</tc-chip><tc-chip selected>慈善</tc-chip><tc-chip>醫療</tc-chip><tc-chip removable>教育</tc-chip>',
      scale: 0.85,
    },
  },
  // ── 表單 ────────────────────────────────────────────────────────────
  {
    id: 'input',
    中文名: '輸入框',
    英文名: 'Input',
    category: 'form',
    用途: '讓讀者輸入一行文字，例如姓名、信箱。',
    preview: {
      html: '<tc-input label="信箱" placeholder="name@example.com" helper-text="我們不會公開您的信箱" style="inline-size:320px"></tc-input>',
      scale: 0.75,
    },
  },
  {
    id: 'search-bar',
    中文名: '搜尋列',
    英文名: 'Search Bar',
    category: 'form',
    用途: '讓讀者輸入關鍵字搜尋網站內容。',
    preview: {
      html: '<tc-search-bar placeholder="搜尋" style="inline-size:360px"></tc-search-bar>',
      scale: 0.7,
    },
  },
  {
    id: 'dropdown',
    中文名: '下拉選單',
    英文名: 'Dropdown',
    category: 'form',
    用途: '從一串選項裡選一個，例如地區。',
    preview: {
      html: '<tc-dropdown placeholder="請選擇地區" value="tw" options=\'[{"value":"tw","label":"台灣"},{"value":"jp","label":"日本"}]\' style="inline-size:200px"></tc-dropdown>',
      scale: 0.85,
    },
  },
  {
    id: 'radio',
    中文名: '單選鈕',
    英文名: 'Radio',
    category: 'form',
    用途: '在幾個互斥的選項中選一個。',
    preview: {
      html: '<div style="display:flex;flex-direction:column;gap:8px"><tc-radio name="catalog-radio" value="a" checked>每月定期捐款</tc-radio><tc-radio name="catalog-radio" value="b">單次捐款</tc-radio></div>',
      scale: 0.85,
    },
  },
  // ── 內容 ────────────────────────────────────────────────────────────
  {
    id: 'card',
    中文名: '卡片',
    英文名: 'Card',
    category: 'content',
    用途: '把圖片、標題和動作收成一塊，方便並排瀏覽。',
    preview: {
      html: `<tc-card variant="outlined" width="300px">${PLACEHOLDER_MEDIA('media')}<span slot="headline">專案名稱</span><p style="margin:0;color:var(--tc-color-text-muted)">2026-03-21 ｜ 慈善新聞</p></tc-card>`,
      scale: 0.5,
    },
  },
  {
    id: 'article-card',
    中文名: '文章卡片',
    英文名: 'Article Card',
    category: 'content',
    用途: '新聞、文章列表中的一則，含分類、標題與摘要。',
    preview: {
      html: `<tc-article-card width="320px">${PLACEHOLDER_MEDIA('media')}<tc-chip slot="badge">慈善</tc-chip><span slot="headline">志工寒冬送暖，關懷獨居長者</span><span slot="meta">2026-03-21 ｜ 慈善新聞</span></tc-article-card>`,
      scale: 0.45,
    },
  },
  {
    id: 'book-card',
    中文名: '書籍卡片',
    英文名: 'Book Card',
    category: 'content',
    用途: '以封面為主的直式卡片，用在書籍、出版品。',
    preview: {
      html: `<tc-book-card ratio="portrait" width="180px">${PLACEHOLDER_MEDIA('cover', '3/4')}<span slot="title">每日一叮嚀</span><span slot="subtitle">世間祥和在於心</span></tc-book-card><tc-book-card ratio="portrait" width="180px">${PLACEHOLDER_MEDIA('cover', '3/4')}<span slot="title">靜思語選輯</span><span slot="subtitle">心寬念純</span></tc-book-card>`,
      scale: 0.45,
    },
  },
  {
    id: 'list-panel',
    中文名: '清單面板',
    英文名: 'List Panel',
    category: 'content',
    用途: '有色彩標題列的條列清單，常放在首頁側欄。',
    preview: {
      html: '<tc-list-panel label="最新消息" width="320px"><article><strong style="color:var(--tc-color-text-default)">慈濟志工關懷行動</strong><p style="margin:4px 0 0;color:var(--tc-color-text-muted)">2026-06-15</p></article><article><strong style="color:var(--tc-color-text-default)">環保站開放參訪</strong><p style="margin:4px 0 0;color:var(--tc-color-text-muted)">2026-06-12</p></article></tc-list-panel>',
      scale: 0.5,
    },
  },
  {
    id: 'badge',
    中文名: '徽章',
    英文名: 'Badge',
    category: 'content',
    用途: '標示狀態、分類或數量的小標記。',
    preview: {
      html: '<tc-badge>標籤</tc-badge><tc-badge tone="brand">兒少</tc-badge><tc-badge tone="success" dot>上線</tc-badge><tc-badge tone="error">錯誤</tc-badge>',
    },
  },
  // ── 導覽 ────────────────────────────────────────────────────────────
  {
    id: 'navbar',
    中文名: '導覽列',
    英文名: 'Navbar',
    category: 'navigation',
    用途: '網站最上方的一列：網站名稱、主要選單和搜尋。',
    preview: {
      html: '<tc-navbar variant="light" style="inline-size:100%"><strong slot="brand">慈濟</strong><tc-link href="#">全球消息</tc-link><tc-link href="#">活動訊息</tc-link><tc-link href="#">前往捐款</tc-link><tc-icon-button slot="actions" label="搜尋"><tc-icon name="search"></tc-icon></tc-icon-button></tc-navbar>',
      scale: 0.55,
    },
  },
  {
    id: 'tabs',
    中文名: '頁籤',
    英文名: 'Tabs',
    category: 'navigation',
    用途: '在同一頁的幾組內容之間切換。',
    preview: {
      html: '<tc-tabs value="overview"><tc-tab value="overview">總覽</tc-tab><tc-tab value="news">最新消息</tc-tab><tc-tab value="donate">前往捐款</tc-tab></tc-tabs>',
      scale: 0.7,
    },
  },
  {
    id: 'pagination',
    中文名: '分頁',
    英文名: 'Pagination',
    category: 'navigation',
    用途: '內容分成很多頁時，切換第幾頁。',
    preview: { html: '<tc-pagination total="8" page="2"></tc-pagination>', scale: 0.7 },
  },
  {
    id: 'footer',
    中文名: '頁尾',
    英文名: 'Footer',
    category: 'navigation',
    用途: '網站最下方：聯絡資訊、分類連結與版權聲明。',
    preview: {
      html: '<tc-footer copyright="Copyright © Tzu Chi Foundation." style="inline-size:100%"><div slot="brand"><strong style="display:block;font-size:18px;margin-bottom:8px">花蓮本會</strong><tc-button variant="filled">聯絡我們</tc-button></div><tc-footer-column label="公益慈善"><tc-link variant="subtle" href="#">國際賑災</tc-link><tc-link variant="subtle" href="#">環保推廣</tc-link></tc-footer-column><tc-footer-column label="醫療志業"><tc-link variant="subtle" href="#">慈濟醫院</tc-link><tc-link variant="subtle" href="#">骨髓中心</tc-link></tc-footer-column><tc-footer-column label="教育志業"><tc-link variant="subtle" href="#">慈濟大學</tc-link><tc-link variant="subtle" href="#">慈大附中</tc-link></tc-footer-column></tc-footer>',
      scale: 0.36,
    },
  },
  {
    id: 'ebook-toolbar',
    中文名: '電子書工具列',
    英文名: 'Ebook Toolbar',
    category: 'navigation',
    用途: '電子書閱讀畫面最上方：返回、書名與閱讀工具。',
    preview: {
      html: '<tc-ebook-toolbar book-title="書籍名稱" style="inline-size:100%"><tc-icon-button label="搜尋"><tc-icon name="search"></tc-icon></tc-icon-button><tc-icon-button label="書籤"><tc-icon name="check"></tc-icon></tc-icon-button><tc-icon-button label="選單"><tc-icon name="menu"></tc-icon></tc-icon-button></tc-ebook-toolbar>',
      scale: 0.45,
    },
  },
  // ── 版面 ────────────────────────────────────────────────────────────
  {
    id: 'container',
    中文名: '版心容器',
    英文名: 'Container',
    category: 'layout',
    用途: '把內容限制在固定的最大寬度並置中。',
    preview: {
      html: `<div style="inline-size:100%;padding:16px 0;background:var(--tc-color-neutral-surface);border-radius:8px">${BOX('版心', 'inline-size:60%;margin-inline:auto;min-block-size:96px;border:1px dashed var(--tc-color-brand-primary)')}</div>`,
      scale: 0.7,
      schematic: true,
    },
  },
  {
    id: 'grid',
    中文名: '格線',
    英文名: 'Grid',
    category: 'layout',
    用途: '把內容排成整齊的幾欄，螢幕變窄時自動換行。',
    preview: {
      html: `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;inline-size:100%">${['1', '2', '3', '4', '5', '6'].map((n) => BOX(n)).join('')}</div>`,
      scale: 0.7,
      schematic: true,
    },
  },
  // ── 其他 ────────────────────────────────────────────────────────────
  {
    id: 'icon',
    中文名: '圖示',
    英文名: 'Icon',
    category: 'other',
    用途: '小圖形，搭配文字或按鈕使用，顏色跟著文字。',
    preview: {
      html: '<div style="display:flex;gap:20px;font-size:28px;color:var(--tc-color-text-default)"><tc-icon name="search" size="lg"></tc-icon><tc-icon name="menu" size="lg"></tc-icon><tc-icon name="calendar" size="lg"></tc-icon><tc-icon name="mail" size="lg"></tc-icon><tc-icon name="check" size="lg"></tc-icon></div>',
    },
  },
  {
    id: 'theme-toggle',
    中文名: '色彩模式切換',
    英文名: 'Theme Toggle',
    category: 'other',
    用途: '讓讀者切換淺色或深色。',
    preview: {
      html: '<tc-theme-toggle></tc-theme-toggle><tc-theme-toggle show-label></tc-theme-toggle>',
      scale: 0.85,
    },
  },
];

for (const [i, entry] of COMPONENTS.entries()) {
  if (COMPONENTS.findIndex((c) => c.id === entry.id) !== i)
    throw new Error(`元件目錄的 id 重複：${entry.id}`);
  if (!CATEGORIES.some((c) => c.id === entry.category))
    throw new Error(`元件 ${entry.id} 的分類 ${entry.category} 不存在`);
}

export const componentUrl = (entry: ComponentEntry): string => `/components/${entry.id}/`;

export function getComponent(id: string): ComponentEntry {
  const entry = COMPONENTS.find((c) => c.id === id);
  if (!entry) throw new Error(`元件目錄裡沒有 ${id}`);
  return entry;
}

export function getCategory(id: CategoryId): Category {
  const category = CATEGORIES.find((c) => c.id === id);
  if (!category) throw new Error(`沒有 id 為 ${id} 的分類`);
  return category;
}

/** 依分類分組，只回傳有元件的分類，順序照 CATEGORIES。 */
export function componentsByCategory(): { category: Category; items: ComponentEntry[] }[] {
  return CATEGORIES.map((category) => ({
    category,
    items: COMPONENTS.filter((c) => c.category === category.id),
  })).filter((group) => group.items.length > 0);
}

/** 側欄「元件」的項目：總覽在前，接著每個分類一個群組。 */
export function componentSidebarItems(): (
  | { label: string; link: string }
  | { label: string; items: { label: string; link: string }[] }
)[] {
  return [
    { label: '總覽', link: '/components/' },
    ...componentsByCategory().map(({ category, items }) => ({
      label: category.名稱,
      items: items.map((c) => ({ label: `${c.中文名} ${c.英文名}`, link: componentUrl(c) })),
    })),
  ];
}
