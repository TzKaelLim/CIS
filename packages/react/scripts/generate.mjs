import { readFile, mkdir, writeFile, rm } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const cemPath = resolve(here, '../../components/custom-elements.json');
const cem = JSON.parse(await readFile(cemPath, 'utf8'));

const pascal = (s) => s.replace(/(^|-)([a-z])/g, (_, __, c) => c.toUpperCase());

// Collect custom elements, deriving the npm subpath from the source directory
// (src/<dir>/...) so multi-element components (e.g. tabs -> tc-tabs + tc-tab)
// resolve to the same subpath rather than tag-name-derived ones.
const decls = [];
for (const m of cem.modules) {
  for (const d of m.declarations ?? []) {
    if (!d.customElement || !d.tagName) continue;
    const dirMatch = (m.path || '').match(/src\/([^/]+)\//);
    const subpath = dirMatch ? dirMatch[1] : d.tagName.replace(/^tc-/, '');
    decls.push({ ...d, subpath });
  }
}
decls.sort((a, b) => a.tagName.localeCompare(b.tagName));

const genDir = resolve(here, '../src/generated');
await rm(genDir, { recursive: true, force: true });
await mkdir(genDir, { recursive: true });

const indexLines = [];
for (const d of decls) {
  const tag = d.tagName; // tc-button
  const cls = d.name; // TcButton
  const subpath = d.subpath; // component directory (e.g. button, tabs)
  const events = (d.events ?? []).map((e) => `    on${pascal(e.name)}: '${e.name}'`).join(',\n');
  const eventsBlock = events ? `\n${events}\n  ` : '';
  const out = `'use client';
import * as React from 'react';
import { createComponent } from '@lit/react';
import { ${cls} as ${cls}Element } from '@tzuchi/components/${subpath}/class';
import '@tzuchi/components/${subpath}';

export const ${cls} = createComponent({
  tagName: '${tag}',
  elementClass: ${cls}Element,
  react: React,
  events: {${eventsBlock}},
});
`;
  await writeFile(resolve(genDir, `${cls}.ts`), out);
  indexLines.push(`export { ${cls} } from './generated/${cls}.js';`);
}

await writeFile(resolve(here, '../src/index.ts'), `'use client';\n${indexLines.join('\n')}\n`);
console.log(`generated ${decls.length} wrapper(s)`);
