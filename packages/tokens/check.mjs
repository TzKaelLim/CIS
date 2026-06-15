import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('./dist/tokens.css', import.meta.url), 'utf8');

const required = [
  '--tc-color-blue-900', // primitive
  '--tc-color-brand-primary', // semantic
  '--tc-button-filled-bg', // component
  '--tc-typography-body', // typography composite
  '--tc-space-16', // scale
];

const missing = required.filter((name) => !css.includes(name));
if (missing.length) {
  console.error('Missing CSS variables:', missing.join(', '));
  process.exit(1);
}

// outputReferences: semantic brand-primary must reference the blue-900 primitive.
const brand = css.match(/--tc-color-brand-primary:\s*([^;]+);/);
if (!brand || !brand[1].includes('var(--tc-color-blue-900)')) {
  console.error('outputReferences not applied: --tc-color-brand-primary did not reference --tc-color-blue-900');
  console.error('actual:', brand ? brand[1].trim() : '(absent)');
  process.exit(1);
}

console.log('tokens check OK');
