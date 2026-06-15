import { esbuildPlugin } from '@web/dev-server-esbuild';

// Tests import the BUILT dist/*.js (real .js, valid browser ESM); the esbuild
// plugin only compiles the .test.ts files themselves.
export default {
  files: ['test/**/*.test.ts'],
  nodeResolve: true,
  plugins: [esbuildPlugin({ ts: true, target: 'es2022' })],
};
