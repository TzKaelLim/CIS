import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
// 網站主題的資料。側欄的「各網站」、頁首選單的初始化 script
// 和顯示規則都由它產生，所以新增網站時不必改這個檔案。
import { siteHeadTags, siteSidebarItems } from './src/data/site-selection.ts';
// 讓真正的 <tc-*> 元件跟著頁首的「網站主題」變色的樣式表（由網站主題資料產生）。
import { SITE_THEME_VARS_MODULE, siteThemeVarsCss } from './src/data/site-theme-vars.ts';
// 手冊的五個區域（首頁、文件、元件、範本、網站主題）與元件目錄。
import { getSection } from './src/data/sections.ts';
import { COMPONENTS, componentSidebarItems } from './src/data/component-catalog.ts';
import { TEMPLATES } from './src/data/template-catalog.ts';

const DATA_FILES = [
  'site-themes.ts',
  'site-selection.ts',
  'site-theme-vars.ts',
  'sections.ts',
  'component-catalog.ts',
  'template-catalog.ts',
];

/** 改了網站主題、區域或元件目錄的資料時重新載入設定，側欄和 <head> 才會跟著更新。 */
const watchHandbookData = {
  name: 'tc-watch-handbook-data',
  hooks: {
    'astro:config:setup': ({ addWatchFile }) => {
      for (const file of DATA_FILES) {
        addWatchFile(new URL(`./src/data/${file}`, import.meta.url));
      }
    },
  },
};

/**
 * 以虛擬 CSS 模組提供網站主題的 --tc-* 變數，customCss 把它排在 tokens.css 之後。
 * 解析成專案裡的一個路徑（檔案本身不存在，內容由 load 產生），Astro 收集頁面 CSS 時才會帶上它。
 */
const RESOLVED_SITE_THEME_VARS = fileURLToPath(
  new URL('./src/data/site-theme-vars.generated.css', import.meta.url),
);
const siteThemeVarsPlugin = {
  name: 'tc-site-theme-vars',
  resolveId(id) {
    if (id === SITE_THEME_VARS_MODULE) return RESOLVED_SITE_THEME_VARS;
    // 檔案不存在，所以瀏覽器或 Astro 用網址（可能帶 ?inline）再要一次時，也要由這裡解析。
    const [path, query] = id.split('?');
    if (path.endsWith('/src/data/site-theme-vars.generated.css')) {
      return query ? `${RESOLVED_SITE_THEME_VARS}?${query}` : RESOLVED_SITE_THEME_VARS;
    }
    return undefined;
  },
  // 開發模式下 Astro 會用 `?inline` 再讀一次，所以比對時去掉查詢字串。
  load: (id) => (id.split('?')[0] === RESOLVED_SITE_THEME_VARS ? siteThemeVarsCss() : undefined),
};

// 元件目錄和元件頁面必須一一對應：頁面沒有目錄資料就不會出現在側欄和總覽頁。
const componentPages = readdirSync(new URL('./src/content/docs/components/', import.meta.url))
  .filter((file) => file.endsWith('.mdx') && file !== 'index.mdx')
  .map((file) => file.replace(/\.mdx$/, ''));
const catalogIds = COMPONENTS.map((c) => c.id);
const missingInCatalog = componentPages.filter((id) => !catalogIds.includes(id));
const missingPages = catalogIds.filter((id) => !componentPages.includes(id));
if (missingInCatalog.length > 0 || missingPages.length > 0) {
  throw new Error(
    `元件目錄（src/data/component-catalog.ts）和元件頁面不一致。` +
      ` 沒有目錄資料的頁面：${missingInCatalog.join('、') || '無'}；` +
      ` 沒有頁面的目錄資料：${missingPages.join('、') || '無'}`,
  );
}

// 範本目錄和範本元件也必須一一對應：畫面頁 /templates/frame/<id>/ 和舊網址的轉址頁
// /templates/<id>/ 都依目錄產生，畫面來自 <id>.astro。
const templateFiles = readdirSync(new URL('./src/components/templates/', import.meta.url))
  .filter((file) => file.endsWith('.astro'))
  .map((file) => file.replace(/\.astro$/, ''));
const templateIds = TEMPLATES.map((t) => t.id);
const templatesWithoutFile = templateIds.filter((id) => !templateFiles.includes(id));
const filesWithoutTemplate = templateFiles.filter((id) => !templateIds.includes(id));
if (templatesWithoutFile.length > 0 || filesWithoutTemplate.length > 0) {
  throw new Error(
    `範本目錄（src/data/template-catalog.ts）和範本元件（src/components/templates/）不一致。` +
      ` 沒有元件檔的範本：${templatesWithoutFile.join('、') || '無'}；` +
      ` 沒有目錄資料的元件檔：${filesWithoutTemplate.join('、') || '無'}`,
  );
}

// https://starlight.astro.build/
export default defineConfig({
  vite: { plugins: [siteThemeVarsPlugin] },
  integrations: [
    watchHandbookData,
    starlight({
      title: '慈濟 CIS UIKit',
      description: '一套設計規則和元件，給每一個慈濟網站使用。',
      // 介面文字（搜尋、色彩模式選單、上一頁／下一頁）用繁體中文。
      defaultLocale: 'root',
      locales: { root: { label: '繁體中文', lang: 'zh-TW' } },
      // tokens.css 讓手冊裡的 <tc-*> 範例和 Foundations 頁面用真正的設計 token；
      // 接著是網站主題的變數、手冊的文字大小（type-scale.css，手冊字級的唯一來源），
      // 最後是手冊本身的外觀。
      customCss: [
        '../../packages/tokens/dist/tokens.css',
        SITE_THEME_VARS_MODULE,
        './src/styles/type-scale.css',
        './src/styles/handbook.css',
      ],
      components: {
        // 頁首：網站名稱、區域導覽（文件／元件／範本／網站主題／Storybook）、
        // 圖示按鈕（搜尋、色彩模式、網站主題、GitHub）和「開始使用」。
        Header: './src/components/starlight/Header.astro',
        // 側欄只顯示目前區域；元件區域上方有「搜尋元件…」篩選框。
        Sidebar: './src/components/starlight/Sidebar.astro',
        // 手機選單裡的「網站主題」下拉選單，取代 Starlight 的淺色／深色／自動選單
        // （色彩模式改由頁首的圓形按鈕切換）。
        ThemeSelect: './src/components/starlight/ThemeSelect.astro',
      },
      // 決定目前在哪個區域：側欄只留這個區域、上一頁／下一頁不跨區域、首頁不顯示側欄。
      routeMiddleware: './src/route-data.ts',
      // 在第一次繪製前套用記住的網站主題，並載入「只顯示目前網站」的規則。
      head: siteHeadTags(),
      // 最上層的每個群組是一個區域，名稱要和 src/data/sections.ts 的 label 相同。
      // 「範本」區域沒有側欄（只有一頁總覽，預覽在對話框裡打開），所以這裡沒有它的群組。
      sidebar: [
        {
          label: getSection('docs').label,
          items: [
            { label: '開始使用', link: '/docs/' },
            { label: '如何參與修改', link: '/docs/contributing/' },
            { label: '用詞', link: '/docs/glossary/' },
            { label: '基礎 Foundations', autogenerate: { directory: 'foundations' } },
          ],
        },
        { label: getSection('components').label, items: componentSidebarItems() },
        // 總覽在前，各網站收在可展開的子群組裡，網站再多側欄也不會被塞滿。
        {
          label: getSection('themes').label,
          items: [
            { label: '總覽', link: '/themes/' },
            { label: '各網站', collapsed: true, items: siteSidebarItems() },
          ],
        },
      ],
    }),
  ],
});
