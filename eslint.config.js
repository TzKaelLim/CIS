import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: [
      '**/dist/**',
      '**/storybook-static/**',
      '**/*.config.*',
      '**/.storybook/**',
      '**/.astro/**',
      '**/*.astro',
      '**/custom-elements.json',
      '**/coverage/**',
      // Vendored HeroUI source keeps upstream's own lint/format config.
      'heroui/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-undef': 'off',
    },
  },
  {
    // chai-style assertions (expect(x).to.exist) read as unused expressions
    files: ['**/test/**/*.ts', '**/*.test.ts'],
    rules: { '@typescript-eslint/no-unused-expressions': 'off' },
  },
];
