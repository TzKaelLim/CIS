import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://starlight.astro.build/
export default defineConfig({
  integrations: [
    starlight({
      title: '慈濟入口網 UIKit',
      description: '慈濟入口網設計系統手冊 — Foundations、元件、用法',
      // tokens.css is loaded globally so live <tc-*> examples + foundations
      // pages render with the real design tokens.
      customCss: ['../../packages/tokens/dist/tokens.css'],
      sidebar: [
        { label: 'Foundations', autogenerate: { directory: 'foundations' } },
        { label: 'Components', autogenerate: { directory: 'components' } },
      ],
    }),
  ],
});
