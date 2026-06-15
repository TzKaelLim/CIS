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
if (!cdn.includes('tc-button')) {
  console.error('FAIL: tc-button not registered in the CDN bundle');
  process.exit(1);
}
console.log('CDN smoke OK');
