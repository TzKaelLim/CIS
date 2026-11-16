import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
// 設計示範（prototype）：網站主題的資料。側欄的「各網站」、頁首選單的初始化 script
// 和顯示規則都由它產生，所以新增網站時不必改這個檔案。
import { siteHeadTags, siteSidebarItems } from './src/prototype/site-selection.ts';

/** 改了網站主題的資料時重新載入設定，側欄和 <head> 才會跟著更新。 */
const watchSiteThemes = {
  name: 'tc-watch-site-themes',
  hooks: {
    'astro:config:setup': ({ addWatchFile }) => {
      addWatchFile(new URL('./src/prototype/site-themes.ts', import.meta.url));
      addWatchFile(new URL('./src/prototype/site-selection.ts', import.meta.url));
    },
  },
};

// https://starlight.astro.build/
export default defineConfig({
  integrations: [
    watchSiteThemes,
    starlight({
      title: '慈濟 CIS UIKit',
      description: '慈濟 CIS 設計系統手冊 — Foundations、元件、用法',
      // tokens.css is loaded globally so live <tc-*> examples + foundations
      // pages render with the real design tokens.
      customCss: ['../../packages/tokens/dist/tokens.css'],
      // 頁首的淺色／深色選單旁加上「網站主題」選單（手機選單裡也會出現）。
      components: { ThemeSelect: './src/components/starlight/ThemeSelect.astro' },
      // 在第一次繪製前套用記住的網站主題，並載入「只顯示目前網站」的規則。
      head: siteHeadTags(),
      sidebar: [
        { label: '基礎 Foundations', autogenerate: { directory: 'foundations' } },
        // 設計示範（prototype）：總覽在前，各網站收在可展開的子群組裡，網站再多側欄也不會被塞滿。
        {
          label: '網站主題',
          items: [
            { label: '總覽', link: '/themes/' },
            { label: '各網站', collapsed: true, items: siteSidebarItems() },
          ],
        },
        { label: '元件 Components', autogenerate: { directory: 'components' } },
      ],
    }),
  ],
});
