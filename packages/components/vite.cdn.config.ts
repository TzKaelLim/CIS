import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// CDN build: Lit bundled in, single self-contained ESM file for no-build HTML.
export default defineConfig({
  build: {
    outDir: 'dist/cdn',
    emptyOutDir: true,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      fileName: () => 'tc-components.js',
      formats: ['es'],
    },
    // CDN bundle must register every element — never tree-shake the
    // customElements.define() side effects out of the barrel.
    rollupOptions: { external: [], treeshake: { moduleSideEffects: true } },
  },
});
