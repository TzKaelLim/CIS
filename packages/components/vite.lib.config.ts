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
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: [/^lit/, /^@tzuchi\/tokens/],
      output: { entryFileNames: '[name].js', chunkFileNames: 'shared/[name].js' },
    },
  },
});
