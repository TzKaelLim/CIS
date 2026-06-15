/**
 * Style Dictionary v4 build config.
 * - DTCG ($value/$type) auto-detected.
 * - outputReferences kept for color + dimension tokens so semantic/component
 *   variables emit var() chains (theming cascades), but disabled for
 *   typography/shadow composites whose CSS shorthand transforms do not
 *   compose cleanly with references.
 * @type {import('style-dictionary/types').Config}
 */
export default {
  source: ['src/**/*.tokens.json'],
  platforms: {
    css: {
      transformGroup: 'css',
      prefix: 'tc',
      buildPath: 'dist/',
      files: [
        {
          destination: 'tokens.css',
          format: 'css/variables',
          options: {
            outputReferences: (token) => token.$type !== 'typography' && token.$type !== 'shadow',
          },
        },
      ],
    },
    js: {
      transformGroup: 'js',
      prefix: 'tc',
      buildPath: 'dist/',
      files: [
        { destination: 'tokens.js', format: 'javascript/es6' },
        { destination: 'tokens.d.ts', format: 'typescript/es6-declarations' },
      ],
    },
  },
};
