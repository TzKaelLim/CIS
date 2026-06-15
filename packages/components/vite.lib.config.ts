import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// Library build: Lit is external (consumer dedupes a single instance),
// explicit named entries with stable filenames for the exports map.
export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        'base/tc-element': resolve(__dirname, 'src/base/tc-element.ts'),
        'base/define-element': resolve(__dirname, 'src/base/define-element.ts'),
        'button/tc-button': resolve(__dirname, 'src/button/tc-button.ts'),
        'button/tc-button-define': resolve(__dirname, 'src/button/tc-button-define.ts'),
        'icon/tc-icon': resolve(__dirname, 'src/icon/tc-icon.ts'),
        'icon/tc-icon-define': resolve(__dirname, 'src/icon/tc-icon-define.ts'),
        'icon-button/tc-icon-button': resolve(__dirname, 'src/icon-button/tc-icon-button.ts'),
        'icon-button/tc-icon-button-define': resolve(
          __dirname,
          'src/icon-button/tc-icon-button-define.ts',
        ),
        'input/tc-input': resolve(__dirname, 'src/input/tc-input.ts'),
        'input/tc-input-define': resolve(__dirname, 'src/input/tc-input-define.ts'),
        'card/tc-card': resolve(__dirname, 'src/card/tc-card.ts'),
        'card/tc-card-define': resolve(__dirname, 'src/card/tc-card-define.ts'),
        'tabs/tc-tabs': resolve(__dirname, 'src/tabs/tc-tabs.ts'),
        'tabs/tc-tab': resolve(__dirname, 'src/tabs/tc-tab.ts'),
        'tabs/tc-tabs-define': resolve(__dirname, 'src/tabs/tc-tabs-define.ts'),
        'radio/tc-radio': resolve(__dirname, 'src/radio/tc-radio.ts'),
        'radio/tc-radio-define': resolve(__dirname, 'src/radio/tc-radio-define.ts'),
        'chip/tc-chip': resolve(__dirname, 'src/chip/tc-chip.ts'),
        'chip/tc-chip-define': resolve(__dirname, 'src/chip/tc-chip-define.ts'),
        'link/tc-link': resolve(__dirname, 'src/link/tc-link.ts'),
        'link/tc-link-define': resolve(__dirname, 'src/link/tc-link-define.ts'),
        'pagination/tc-pagination': resolve(__dirname, 'src/pagination/tc-pagination.ts'),
        'pagination/tc-pagination-define': resolve(
          __dirname,
          'src/pagination/tc-pagination-define.ts',
        ),
        'dropdown/tc-dropdown': resolve(__dirname, 'src/dropdown/tc-dropdown.ts'),
        'dropdown/tc-dropdown-define': resolve(__dirname, 'src/dropdown/tc-dropdown-define.ts'),
        'article-card/tc-article-card': resolve(__dirname, 'src/article-card/tc-article-card.ts'),
        'article-card/tc-article-card-define': resolve(
          __dirname,
          'src/article-card/tc-article-card-define.ts',
        ),
        'book-card/tc-book-card': resolve(__dirname, 'src/book-card/tc-book-card.ts'),
        'book-card/tc-book-card-define': resolve(__dirname, 'src/book-card/tc-book-card-define.ts'),
        'list-panel/tc-list-panel': resolve(__dirname, 'src/list-panel/tc-list-panel.ts'),
        'list-panel/tc-list-panel-define': resolve(
          __dirname,
          'src/list-panel/tc-list-panel-define.ts',
        ),
        'badge/tc-badge': resolve(__dirname, 'src/badge/tc-badge.ts'),
        'badge/tc-badge-define': resolve(__dirname, 'src/badge/tc-badge-define.ts'),
        'search-bar/tc-search-bar': resolve(__dirname, 'src/search-bar/tc-search-bar.ts'),
        'search-bar/tc-search-bar-define': resolve(
          __dirname,
          'src/search-bar/tc-search-bar-define.ts',
        ),
        'navbar/tc-navbar': resolve(__dirname, 'src/navbar/tc-navbar.ts'),
        'navbar/tc-navbar-define': resolve(__dirname, 'src/navbar/tc-navbar-define.ts'),
        'footer/tc-footer': resolve(__dirname, 'src/footer/tc-footer.ts'),
        'footer/tc-footer-column': resolve(__dirname, 'src/footer/tc-footer-column.ts'),
        'footer/tc-footer-define': resolve(__dirname, 'src/footer/tc-footer-define.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: [/^lit/, /^@tzuchi\/tokens/],
      output: { entryFileNames: '[name].js', chunkFileNames: 'shared/[name].js' },
    },
  },
});
