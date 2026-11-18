// Checks on the design handbook (apps/docs) that need no build: the component catalog
// matches the component pages, and no source file can make the handbook request a
// third-party URL (R-H-15, R-S-27). Run with `pnpm run test:scripts`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../..', import.meta.url));
const docs = join(root, 'apps/docs');
const pagesDir = join(docs, 'src/content/docs/components');

test('the component catalog and the component pages list the same components', async () => {
  // component-catalog.ts imports nothing, so Node can load it by stripping its types.
  const { COMPONENTS } = await import(join(docs, 'src/data/component-catalog.ts'));
  const catalog = COMPONENTS.map((c) => c.id).sort();
  const pages = readdirSync(pagesDir)
    .filter((file) => file.endsWith('.mdx') && file !== 'index.mdx')
    .map((file) => file.replace(/\.mdx$/, ''))
    .sort();
  assert.equal(new Set(catalog).size, catalog.length, 'the catalog lists a component twice');
  assert.deepEqual(
    catalog,
    pages,
    'apps/docs/src/data/component-catalog.ts and apps/docs/src/content/docs/components/*.mdx disagree',
  );
});

test('every component page has the six sections of R-H-08 in order', () => {
  const sections = ['用法', '組成', '該做與不該做', '在目前主題下的樣子', '給工程師'];
  for (const file of readdirSync(pagesDir).filter((f) => f.endsWith('.mdx') && f !== 'index.mdx')) {
    const text = readFileSync(join(pagesDir, file), 'utf8');
    const headings = [...text.matchAll(/^## (.+)$/gm)].map((m) => m[1].trim());
    assert.deepEqual(headings, sections, `${file}: the h2 headings are not the six sections`);
    // The first section, the preview, is the hero tile above the first heading.
    const beforeFirst = text.slice(0, text.indexOf('\n## '));
    assert.match(beforeFirst, /<PreviewTile[^>]*size="hero"/, `${file}: no hero preview`);
  }
});

/**
 * Hero previews that may be drawn smaller than 0.75, and why. Everything else is
 * drawn at 0.75 or larger, so the text inside stays readable (R-H-08, section 1).
 */
const SMALL_HERO_SCALE = {
  // Shows the four content widths next to each other; its labels are drawn at 26px,
  // so they still read at 13px.
  container: 0.5,
};

test('every hero preview is drawn at a readable size', () => {
  for (const file of readdirSync(pagesDir).filter((f) => f.endsWith('.mdx') && f !== 'index.mdx')) {
    const id = file.replace(/\.mdx$/, '');
    const text = readFileSync(join(pagesDir, file), 'utf8');
    const tag = text.match(/<PreviewTile[^>]*size="hero"[^>]*>/)?.[0] ?? '';
    const scale = Number(tag.match(/scale=\{([0-9.]+)\}/)?.[1] ?? 1);
    const minimum = SMALL_HERO_SCALE[id] ?? 0.75;
    assert.ok(
      scale >= minimum,
      `${file}: the hero preview is scaled to ${scale}, below ${minimum}`,
    );
  }
});

/**
 * URLs a source file may contain because the handbook never requests them.
 * Everything else that starts with http:// or https:// fails the test.
 */
const ALLOWED = [
  {
    // RFC 2606 reserves these names for examples; they never point at a real third party.
    // Used as placeholder text (name@example.com) and in code samples.
    pattern: /^https?:\/\/([a-z0-9-]+\.)*example\.(com|org|net)(\/|$)/,
    reason: 'reserved example domain',
  },
  {
    // An XML namespace (xmlns="http://www.w3.org/2000/svg") is an identifier, not a request.
    pattern: /^http:\/\/www\.w3\.org\/(2000\/svg|1999\/xlink|1999\/xhtml)$/,
    reason: 'XML namespace',
  },
  {
    // The header's "GitHub repository" link (apps/docs/src/data/repository.ts). It is a
    // navigation link the reader may follow in a new tab; the handbook never loads anything from it.
    pattern: /^https:\/\/github\.com\/tzuchi-digital\/CIS$/,
    reason: 'navigation link to this repository',
  },
  {
    // The download link in the "connect GitHub in Claude Desktop" tutorial
    // (apps/docs/src/content/docs/docs/claude-desktop-github.mdx). A navigation link the
    // reader follows on purpose; the handbook never loads anything from it.
    pattern: /^https:\/\/claude\.com\/download$/,
    reason: 'navigation link to the Claude Desktop download page',
  },
  {
    // The GitHub CLI download link in the same tutorial; also a navigation link only.
    pattern: /^https:\/\/cli\.github\.com$/,
    reason: 'navigation link to the GitHub CLI download page',
  },
];

/** Files whose text ends up in the handbook's pages, styles or scripts. */
const SCANNED = new Set(['.astro', '.mdx', '.md', '.ts', '.mjs', '.js', '.css', '.json', '.svg']);

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* walk(path);
    else if (SCANNED.has(extname(name))) yield path;
  }
}

/**
 * Returns the external URLs of one file that the allow-list does not cover.
 * Text inside a fenced code block of a Markdown page is shown as code and never
 * requested, so it is skipped (the footer sample links to a social site, for example).
 */
export function disallowedUrls(text, isMarkdown) {
  const found = [];
  let inFence = false;
  for (const [index, line] of text.split('\n').entries()) {
    if (isMarkdown && /^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    for (const match of line.matchAll(/https?:\/\/[^\s"'`<>)\\]+/g)) {
      const url = match[0].replace(/[.,;:]+$/, '');
      if (!ALLOWED.some((entry) => entry.pattern.test(url))) found.push(`${index + 1}: ${url}`);
    }
  }
  return found;
}

test('no handbook source contains an external URL outside the allow-list', () => {
  const problems = [];
  for (const path of walk(join(docs, 'src'))) {
    const ext = extname(path);
    const urls = disallowedUrls(readFileSync(path, 'utf8'), ext === '.mdx' || ext === '.md');
    for (const url of urls) problems.push(`${relative(root, path)}:${url}`);
  }
  assert.deepEqual(problems, [], 'external URLs found; use a local file or an example domain');
});

test('the URL check ignores code fences and example domains but catches the rest', () => {
  assert.deepEqual(disallowedUrls('<img src="https://picsum.photos/200" />', true), [
    '1: https://picsum.photos/200',
  ]);
  assert.deepEqual(disallowedUrls('```html\n<a href="https://facebook.com">FB</a>\n```', true), []);
  assert.deepEqual(disallowedUrls('```html\n<a href="https://facebook.com">FB</a>\n```', false), [
    '2: https://facebook.com',
  ]);
  assert.deepEqual(
    disallowedUrls("placeholder='name@example.com' href='https://example.org'", false),
    [],
  );
  assert.deepEqual(disallowedUrls('@import url(https://fonts.googleapis.com/css2);', false), [
    '1: https://fonts.googleapis.com/css2',
  ]);
});

/**
 * Template ids and the components each template uses, read from the source of
 * template-catalog.ts (it imports component-catalog without an extension, so Node
 * cannot load it directly).
 */
function readTemplateCatalog() {
  const text = readFileSync(join(docs, 'src/data/template-catalog.ts'), 'utf8');
  const start = text.indexOf('export const TEMPLATES');
  const block = text.slice(start, text.indexOf('\n];', start));
  return [...block.matchAll(/\n {4}id: '([^']+)',[\s\S]*?使用的元件: \[([^\]]*)\]/g)].map((m) => ({
    id: m[1],
    components: [...m[2].matchAll(/'([^']+)'/g)].map((c) => c[1]),
  }));
}

test('the templates catalog, the template components and the template routes agree', async () => {
  const templates = readTemplateCatalog();
  const ids = templates.map((t) => t.id).sort();
  assert.ok(ids.length > 0, 'no templates found in template-catalog.ts');
  assert.equal(new Set(ids).size, ids.length, 'the templates catalog lists a template twice');
  assert.ok(!ids.includes('frame'), '"frame" is the path of the frame pages, not a template id');
  const files = readdirSync(join(docs, 'src/components/templates'))
    .filter((file) => file.endsWith('.astro'))
    .map((file) => file.replace(/\.astro$/, ''))
    .sort();
  assert.deepEqual(ids, files, 'template-catalog.ts and src/components/templates/*.astro disagree');

  const { COMPONENTS } = await import(join(docs, 'src/data/component-catalog.ts'));
  const componentIds = new Set(COMPONENTS.map((c) => c.id));
  for (const t of templates) {
    for (const id of t.components) {
      assert.ok(
        componentIds.has(id),
        `template ${t.id} uses ${id}, which is not in the component catalog`,
      );
    }
  }

  // The template area has exactly two routes, and both are generated from the catalog:
  // the frame page that thumbnails and the preview dialog load, and the old address
  // that forwards to /templates/?t=<id>. Neither is a Starlight page.
  const routesDir = join(docs, 'src/pages/templates');
  const routes = [...walk(routesDir)].map((p) => relative(routesDir, p)).sort();
  assert.deepEqual(routes, ['[id].astro', 'frame/[id].astro']);
  const frame = readFileSync(join(routesDir, 'frame/[id].astro'), 'utf8');
  const forward = readFileSync(join(routesDir, '[id].astro'), 'utf8');
  for (const [name, text] of [
    ['frame/[id].astro', frame],
    ['[id].astro', forward],
  ]) {
    assert.match(
      text,
      /getStaticPaths\(\) \{\s*return TEMPLATES\.map\(/,
      `${name}: not generated from TEMPLATES`,
    );
    assert.match(text, /<meta name="robots" content="noindex/, `${name}: missing noindex`);
    assert.doesNotMatch(text, /StarlightPage/, `${name}: must not be a Starlight page`);
  }
  assert.match(
    frame,
    /data-pagefind-ignore="all"/,
    'the frame page must stay out of the search index',
  );
  assert.match(forward, /http-equiv="refresh"/, 'the old address must forward');
  assert.match(forward, /templateUrl\(entry\)/, 'the old address must forward to templateUrl()');
  const catalog = readFileSync(join(docs, 'src/data/template-catalog.ts'), 'utf8');
  assert.match(
    catalog,
    /templateUrl = [^;]*`\/templates\/\?\$\{TEMPLATE_PREVIEW_PARAM\}=\$\{entry\.id\}`/,
  );
  assert.match(
    catalog,
    /templateFrameUrl = [^;]*`\/templates\/\$\{FRAME_SEGMENT\}\/\$\{entry\.id\}\/`/,
  );
});

test('no handbook source links to an old per-template page', () => {
  const ids = new Set(readTemplateCatalog().map((t) => t.id));
  const problems = [];
  for (const path of walk(join(docs, 'src'))) {
    for (const [index, line] of readFileSync(path, 'utf8').split('\n').entries()) {
      for (const match of line.matchAll(/\/templates\/([a-z][a-z0-9-]*)\//g)) {
        if (ids.has(match[1])) problems.push(`${relative(root, path)}:${index + 1}: ${match[0]}`);
      }
    }
  }
  assert.deepEqual(problems, [], 'link to /templates/?t=<id> (templateUrl) instead');
});
