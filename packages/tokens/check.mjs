import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('./dist/tokens.css', import.meta.url), 'utf8');

function fail(msg, extra) {
  console.error(msg);
  if (extra !== undefined) console.error('  →', extra);
  process.exit(1);
}

const required = [
  '--tc-color-blue-900', // primitive
  '--tc-color-brand-primary', // semantic
  '--tc-button-filled-bg', // component
  '--tc-typography-body', // typography composite
  '--tc-space-16', // scale
  // dark-mode primitives (added for the dark theme)
  '--tc-color-gray-950',
  '--tc-color-gray-980',
  '--tc-color-blue-300',
  '--tc-color-blue-250',
  '--tc-color-red-300',
  '--tc-color-green-400',
];

const missing = required.filter((name) => !css.includes(name));
if (missing.length) fail(`Missing CSS variables: ${missing.join(', ')}`);

// outputReferences: semantic brand-primary must reference the blue-900 primitive (light).
const brand = css.match(/--tc-color-brand-primary:\s*([^;]+);/);
if (!brand || !brand[1].includes('var(--tc-color-blue-900)')) {
  fail(
    'outputReferences not applied: --tc-color-brand-primary did not reference --tc-color-blue-900',
    brand ? brand[1].trim() : '(absent)',
  );
}

// ---- Dark theme -----------------------------------------------------------

// Isolate the dark block (everything from the [data-theme="dark"] selector on).
const darkStart = css.indexOf('[data-theme="dark"]');
if (darkStart === -1) fail('Dark theme missing: no [data-theme="dark"] selector in tokens.css');
const darkBlock = css.slice(darkStart);

// System auto opt-in must be present and scoped so an explicit light choice wins.
if (!darkBlock.includes('@media (prefers-color-scheme: dark)')) {
  fail('Dark theme missing the prefers-color-scheme media query');
}
if (!darkBlock.includes(':root:not([data-theme="light"])')) {
  fail('Dark media query is not scoped with :root:not([data-theme="light"])');
}

// Dark re-maps must be var() chains (so the component cascade re-themes), not
// inlined hex — and must NOT redefine any primitive inside the dark scope.
const darkColorDecls = darkBlock.match(/--tc-color-[\w-]+:\s*[^;]+;/g) ?? [];
if (darkColorDecls.length < 15) {
  fail(`Dark theme has too few colour overrides (${darkColorDecls.length}, expected ≥15)`);
}
for (const decl of darkColorDecls) {
  if (!decl.includes('var(--tc-color-')) {
    fail('Dark colour override is not a var() chain (would break the cascade)', decl.trim());
  }
}
// A primitive definition would look like `--tc-color-blue-300: #...;`. None of
// the dark colour declarations may be a raw hex (those belong only in :root).
const redefinedPrimitive = darkColorDecls.find((d) => /:\s*#[0-9a-fA-F]/.test(d));
if (redefinedPrimitive) {
  fail('Dark scope redefines a primitive with a literal colour', redefinedPrimitive.trim());
}

// Key dark re-mappings (the Material-3 inversion: brand lightens, on-brand darkens).
const expectDark = {
  '--tc-color-surface-default': 'var(--tc-color-gray-950)',
  '--tc-color-text-default': 'var(--tc-color-gray-100)',
  '--tc-color-brand-primary': 'var(--tc-color-blue-300)',
  '--tc-color-text-on-brand': 'var(--tc-color-blue-900)',
};
for (const [name, ref] of Object.entries(expectDark)) {
  const m = darkBlock.match(new RegExp(`${name}:\\s*([^;]+);`));
  if (!m || m[1].trim() !== ref) {
    fail(`Dark ${name} should be ${ref}`, m ? m[1].trim() : '(absent)');
  }
}

// Elevation must be strengthened in dark (black shadows vanish otherwise).
if (!/--tc-elevation-1:\s*0px 1px 2px 0px #00000059/.test(darkBlock)) {
  fail('Dark theme did not strengthen --tc-elevation-1');
}

console.log('tokens check OK (light + dark)');
