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
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: [/^lit/, /^@tzuchi\/tokens/],
      output: { entryFileNames: '[name].js', chunkFileNames: 'shared/[name].js' },
    },
  },
});
