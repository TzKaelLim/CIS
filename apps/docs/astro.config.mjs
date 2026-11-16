import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://starlight.astro.build/
export default defineConfig({
  integrations: [
    starlight({
      title: '慈濟 CIS UIKit',
      description: '慈濟 CIS 設計系統手冊 — Foundations、元件、用法',
      // tokens.css is loaded globally so live <tc-*> examples + foundations
      // pages render with the real design tokens.
      customCss: ['../../packages/tokens/dist/tokens.css'],
      sidebar: [
        { label: '基礎 Foundations', autogenerate: { directory: 'foundations' } },
        // 設計示範（prototype）：每個網站一份主題，頁面順序由各頁的 sidebar.order 決定。
        { label: '網站主題', autogenerate: { directory: 'themes' } },
        { label: '元件 Components', autogenerate: { directory: 'components' } },
      ],
    }),
  ],
});
