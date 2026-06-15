import { defineElementPlugin } from './cem-plugin-define-element.mjs';

export default {
  globs: ['src/**/*.ts'],
  exclude: ['src/**/*.styles.ts', 'src/**/*.test.ts'],
  litelement: true,
  outdir: '.',
  plugins: [defineElementPlugin()],
};
