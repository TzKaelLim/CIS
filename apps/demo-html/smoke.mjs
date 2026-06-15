import { readFile } from 'node:fs/promises';

// No-build assertion: the CDN bundle must self-register the element with no
// bare 'lit' specifier escaping (which would 404 in a plain browser).
const cdn = await readFile(
  new URL('../../packages/components/dist/cdn/tc-components.js', import.meta.url),
  'utf8',
);

if (/from\s*['"]lit['"]/.test(cdn)) {
  console.error('FAIL: bare "lit" import escaped the CDN bundle');
  process.exit(1);
}
// Assert the registration side effect actually survived bundling (a string
// match on the tag name alone passes even when the define() is tree-shaken).
if (!cdn.includes('customElements.define')) {
  console.error(
    'FAIL: CDN bundle contains no customElements.define — registration was tree-shaken',
  );
  process.exit(1);
}
if (!cdn.includes('tc-button')) {
  console.error('FAIL: tc-button not present in the CDN bundle');
  process.exit(1);
}
if (!cdn.includes('tc-theme-toggle')) {
  console.error('FAIL: tc-theme-toggle not present in the CDN bundle');
  process.exit(1);
}

// The tokens stylesheet must ship both themes so the HTML demo can switch.
const tokensCss = await readFile(
  new URL('../../packages/tokens/dist/tokens.css', import.meta.url),
  'utf8',
);
if (!tokensCss.includes('[data-theme="dark"]')) {
  console.error('FAIL: tokens.css has no [data-theme="dark"] block');
  process.exit(1);
}
if (!tokensCss.includes('@media (prefers-color-scheme: dark)')) {
  console.error('FAIL: tokens.css has no prefers-color-scheme dark fallback');
  process.exit(1);
}
console.log('CDN smoke OK');
