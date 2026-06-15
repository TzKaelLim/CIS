import { formattedVariables } from 'style-dictionary/utils';

/**
 * Dark theme build.
 *
 * Sources the immutable primitives (needed to resolve references) plus the
 * dark overlay under src/themes/dark/**. Only the OVERLAY tokens are written —
 * the primitives are filtered out (they already live in :root from the base
 * build). With outputReferences the semantic overrides emit `var()` chains
 * (e.g. `--tc-color-brand-primary: var(--tc-color-blue-300)`), so they
 * re-resolve against the primitives in :root and the whole component cascade
 * re-themes automatically.
 *
 * Emits a single block applied two ways:
 *   [data-theme="dark"]                        → explicit manual opt-in
 *   @media (prefers-color-scheme: dark)
 *     :root:not([data-theme="light"])          → system auto, unless overridden
 */

const outputReferences = (token) => token.$type !== 'typography' && token.$type !== 'shadow';

/** Build the `--name: value;` declaration lines for the dark overlay tokens. */
function darkDeclarations(dictionary) {
  const darkTokens = dictionary.allTokens.filter((t) =>
    (t.filePath || '').replace(/\\/g, '/').includes('/themes/dark/'),
  );
  const sub = { ...dictionary, allTokens: darkTokens };
  // formattedVariables yields one `  --var: value;` per line. usesDtcg makes it
  // read the transformed `$value` (these are DTCG tokens) rather than `.value`.
  return formattedVariables({
    format: 'css',
    dictionary: sub,
    outputReferences,
    usesDtcg: true,
  })
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}

const darkThemeFormat = ({ dictionary }) => {
  const decls = darkDeclarations(dictionary);
  const attr = decls.map((d) => `  ${d}`).join('\n');
  const media = decls.map((d) => `    ${d}`).join('\n');
  return [
    '/**',
    ' * Dark theme — re-maps semantic colour + elevation tokens.',
    ' * Auto-generated; do not edit directly.',
    ' */',
    '[data-theme="dark"] {',
    attr,
    '}',
    '',
    '@media (prefers-color-scheme: dark) {',
    '  :root:not([data-theme="light"]) {',
    media,
    '  }',
    '}',
    '',
  ].join('\n');
};

/** @type {import('style-dictionary/types').Config} */
export default {
  source: ['src/primitive/**/*.tokens.json', 'src/themes/dark/**/*.tokens.json'],
  hooks: {
    formats: {
      'css/dark-theme': darkThemeFormat,
    },
  },
  platforms: {
    css: {
      transformGroup: 'css',
      prefix: 'tc',
      buildPath: 'dist/',
      files: [{ destination: '_dark.css', format: 'css/dark-theme' }],
    },
  },
};
