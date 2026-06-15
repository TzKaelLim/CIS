# Tzu Chi UIKit — Milestone 1a Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the pnpm monorepo and prove the full pipeline — DTCG design tokens → a Lit `tc-button` Web Component → CEM → a generated `@lit/react` wrapper → Storybook story → a no-build HTML demo → CI gates — end to end, so M1b can mass-produce the remaining components against a verified toolchain.

**Architecture:** pnpm workspace with three publishable ESM-only packages (`@tzuchi/tokens`, `@tzuchi/components`, `@tzuchi/react`) and two private apps (`storybook`, `demo-html`). Tokens are authored in W3C DTCG JSON and compiled by Style Dictionary v4 (`outputReferences: true`) to CSS variables + typed JS. Components are Lit 3 elements (Shadow DOM, CSS-custom-property theming, form-associated where needed). React consumption is via `@lit/react` wrappers generated from the Custom Elements Manifest. Build order is enforced by `tsc -b` project references + Turborepo.

**Tech Stack:** pnpm 10, Node 20+, TypeScript 5 (strict, `experimentalDecorators`, `useDefineForClassFields:false`), Lit 3, Style Dictionary v4, `@custom-elements-manifest/analyzer`, `@lit/react`, Storybook 9 (`web-components-vite`), `@web/test-runner` + `@open-wc/testing`, Changesets, `publint` + `@arethetypeswrong/cli`.

**Spec:** `docs/superpowers/specs/2026-06-15-tzuchi-uikit-design-system-design.md` (Milestone 1a = §12.1 first bullet).

---

## File Structure (created in this plan)

```
pnpm-workspace.yaml                      workspace globs
package.json                             root scripts + dev tooling
tsconfig.base.json                       shared TS (composite, Lit-required flags)
turbo.json                               build order + cache
.changeset/config.json                   release config
.prettierrc.json / eslint.config.js      lint/format

packages/tokens/
  package.json                           @tzuchi/tokens (exports tokens.css/.js/.tailwind)
  style-dictionary.config.mjs            SD v4 build (outputReferences)
  src/primitive/color.tokens.json        hue ramps (blue/gray/red/green + accents)
  src/primitive/typography.tokens.json   font family/weight/size/line-height
  src/primitive/scale.tokens.json        space/radius/size/opacity/focus/motion/z/breakpoint
  src/semantic/color.tokens.json         brand/text/surface/border/feedback aliases
  src/semantic/typography.tokens.json    typography composites (role-based)
  src/component/button.tokens.json       button component tokens
  build.mjs                              runs Style Dictionary

packages/components/
  package.json                           @tzuchi/components (exports map + sideEffects allowlist)
  tsconfig.json                          references tokens
  vite.lib.config.ts                     library build (lit external, named entries)
  vite.cdn.config.ts                     CDN build (lit bundled, single file)
  custom-elements-manifest.config.mjs    CEM analyzer config
  src/base/tc-element.ts                 TcElement base
  src/base/define-element.ts             duplicate-safe registration
  src/button/tc-button.ts                <tc-button> class (+ JSDoc tags)
  src/button/tc-button.styles.ts         token-only CSS
  src/button/tc-button-define.ts         side-effect registration entry
  src/button/index.ts                    re-exports
  src/index.ts                           barrel (registers all — CDN only)
  test/tc-button.test.ts                 @web/test-runner spec
  web-test-runner.config.mjs             test runner config

packages/react/
  package.json                           @tzuchi/react (peerDeps react/lit, 'use client')
  tsconfig.json                          references components
  scripts/generate.mjs                   CEM → wrapper generator
  src/generated/TcButton.ts              generated wrapper (committed)
  src/index.ts                           re-exports generated

apps/storybook/
  package.json / .storybook/main.ts / .storybook/preview.ts
  stories/tc-button.stories.ts

apps/demo-html/
  package.json / index.html / smoke.mjs
```

---

## Task 0: Monorepo bootstrap

**Files:**
- Create: `pnpm-workspace.yaml`, `package.json`, `tsconfig.base.json`, `turbo.json`, `.changeset/config.json`, `eslint.config.js`, `.prettierrc.json`

- [ ] **Step 1: Create workspace + root manifest + shared configs**

`pnpm-workspace.yaml`:
```yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

`package.json`:
```jsonc
{
  "name": "tzuchi-uikit",
  "private": true,
  "type": "module",
  "engines": { "node": ">=20", "pnpm": ">=9" },
  "scripts": {
    "build": "turbo run build",
    "typecheck": "tsc -b",
    "test": "turbo run test",
    "lint": "eslint . && prettier --check .",
    "format": "prettier --write .",
    "verify:pkg": "turbo run verify:pkg",
    "changeset": "changeset"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "turbo": "^2.3.0",
    "@changesets/cli": "^2.27.0",
    "eslint": "^9.13.0",
    "prettier": "^3.3.0",
    "publint": "^0.2.12",
    "@arethetypeswrong/cli": "^0.17.0"
  }
}
```

`tsconfig.base.json` (Lit-required flags pinned per spec §4 / monorepo-build review):
```jsonc
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "strict": true,
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "useDefineForClassFields": false,
    "experimentalDecorators": true,
    "skipLibCheck": true,
    "verbatimModuleSyntax": true
  }
}
```

`turbo.json`:
```jsonc
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**", "custom-elements.json", "src/generated/**"] },
    "test": { "dependsOn": ["^build"] },
    "verify:pkg": { "dependsOn": ["build"] }
  }
}
```

`.changeset/config.json`:
```jsonc
{
  "$schema": "https://unpkg.com/@changesets/config@3.0.0/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": ["@tzuchi/storybook", "@tzuchi/demo-html"]
}
```

`.prettierrc.json`:
```json
{ "singleQuote": true, "semi": true, "printWidth": 100 }
```

`eslint.config.js` (flat config, minimal + import-boundary placeholder):
```js
import js from '@eslint/js';
export default [
  js.configs.recommended,
  { ignores: ['**/dist/**', '**/storybook-static/**', '**/*.config.*'] },
];
```

- [ ] **Step 2: Install root tooling**

Run: `pnpm install`
Expected: lockfile created, root devDeps installed, no errors.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "chore: bootstrap pnpm monorepo + shared tooling"
```

---

## Task 1: `@tzuchi/tokens` package skeleton + Style Dictionary build

**Files:**
- Create: `packages/tokens/package.json`, `packages/tokens/style-dictionary.config.mjs`, `packages/tokens/build.mjs`

- [ ] **Step 1: Package manifest**

`packages/tokens/package.json`:
```jsonc
{
  "name": "@tzuchi/tokens",
  "version": "0.0.0",
  "type": "module",
  "exports": {
    "./tokens.css": "./dist/tokens.css",
    ".": { "types": "./dist/tokens.d.ts", "default": "./dist/tokens.js" }
  },
  "files": ["dist"],
  "scripts": {
    "build": "node build.mjs",
    "test": "node build.mjs && node -e \"const c=require('node:fs').readFileSync('dist/tokens.css','utf8'); if(!c.includes('--tc-color-brand-primary')) process.exit(1)\"",
    "verify:pkg": "publint"
  },
  "devDependencies": { "style-dictionary": "^4.3.0", "publint": "^0.2.12" }
}
```

- [ ] **Step 2: Style Dictionary config (DTCG + outputReferences)**

`packages/tokens/style-dictionary.config.mjs`:
```js
/** @type {import('style-dictionary/types').Config} */
export default {
  source: ['src/**/*.tokens.json'],
  platforms: {
    css: {
      transformGroup: 'css',
      prefix: 'tc',
      buildPath: 'dist/',
      files: [
        { destination: 'tokens.css', format: 'css/variables', options: { outputReferences: true } },
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
```

`packages/tokens/build.mjs`:
```js
import StyleDictionary from 'style-dictionary';
import config from './style-dictionary.config.mjs';
const sd = new StyleDictionary(config);
await sd.cleanAllPlatforms();
await sd.buildAllPlatforms();
console.log('tokens built');
```

- [ ] **Step 3: Install + verify config loads**

Run: `pnpm --filter @tzuchi/tokens install` then (after Task 2) `pnpm --filter @tzuchi/tokens build`.
Expected (after Task 2 token files exist): `dist/tokens.css`, `dist/tokens.js`, `dist/tokens.d.ts` written.

---

## Task 2: Token source files (DTCG)

**Files:**
- Create the six token JSON files under `packages/tokens/src/`.

- [ ] **Step 1: Primitive colors** — `src/primitive/color.tokens.json`
```jsonc
{
  "color": {
    "$type": "color",
    "blue":  { "900": { "$value": "#1B2D58" }, "700": { "$value": "#30559F" }, "500": { "$value": "#4F7BBE" }, "400": { "$value": "#587291" }, "200": { "$value": "#D1DEFF" }, "100": { "$value": "#E8EEFE" } },
    "gray":  { "900": { "$value": "#333333" }, "800": { "$value": "#4F4F4F" }, "700": { "$value": "#828282" }, "600": { "$value": "#8D8D8D" }, "500": { "$value": "#95969B" }, "400": { "$value": "#B3B3B3" }, "300": { "$value": "#BDBDBD" }, "200": { "$value": "#E0E0E0" }, "100": { "$value": "#F2F2F2" }, "50": { "$value": "#F8F8F8" } },
    "white": { "$value": "#FFFFFF" },
    "red":   { "500": { "$value": "#D4494F" } },
    "green": { "600": { "$value": "#168967" } }
  }
}
```

- [ ] **Step 2: Primitive typography** — `src/primitive/typography.tokens.json`
```jsonc
{
  "font": {
    "family": { "base": { "$type": "fontFamily", "$value": ["Noto Sans TC", "system-ui", "-apple-system", "PingFang TC", "Microsoft JhengHei", "sans-serif"] } },
    "weight": { "$type": "fontWeight", "regular": { "$value": 400 }, "medium": { "$value": 500 }, "bold": { "$value": 700 } },
    "size":   { "$type": "dimension", "46": { "$value": "46px" }, "34": { "$value": "34px" }, "26": { "$value": "26px" }, "24": { "$value": "24px" }, "20": { "$value": "20px" }, "16": { "$value": "16px" } }
  },
  "line-height": { "$type": "number", "tight": { "$value": 1.3 }, "snug": { "$value": 1.4 }, "normal": { "$value": 1.5 }, "relaxed": { "$value": 1.6 } }
}
```

- [ ] **Step 3: Primitive scales** — `src/primitive/scale.tokens.json`
```jsonc
{
  "space":  { "$type": "dimension", "4": { "$value": "4px" }, "8": { "$value": "8px" }, "12": { "$value": "12px" }, "16": { "$value": "16px" }, "20": { "$value": "20px" }, "24": { "$value": "24px" }, "32": { "$value": "32px" }, "40": { "$value": "40px" }, "48": { "$value": "48px" }, "64": { "$value": "64px" } },
  "radius": { "$type": "dimension", "none": { "$value": "0" }, "sm": { "$value": "4px" }, "md": { "$value": "8px" }, "lg": { "$value": "16px" }, "full": { "$value": "9999px" } },
  "size":   { "icon": { "$type": "dimension", "sm": { "$value": "20px" }, "md": { "$value": "32px" }, "lg": { "$value": "40px" } }, "control": { "$type": "dimension", "md": { "$value": "48px" }, "lg": { "$value": "64px" } } },
  "opacity": { "$type": "number", "disabled": { "$value": 0.38 }, "hover-overlay": { "$value": 0.08 } },
  "focus-ring": { "color": { "$type": "color", "$value": "{color.blue.500}" }, "width": { "$type": "dimension", "$value": "2px" }, "offset": { "$type": "dimension", "$value": "2px" } },
  "motion": { "duration": { "$type": "duration", "fast": { "$value": "150ms" }, "base": { "$value": "200ms" } }, "easing": { "standard": { "$type": "cubicBezier", "$value": [0.2, 0, 0, 1] } } },
  "z": { "$type": "number", "base": { "$value": 0 }, "dropdown": { "$value": 1000 }, "sticky": { "$value": 1100 }, "overlay": { "$value": 1200 }, "modal": { "$value": 1300 }, "popover": { "$value": 1400 }, "toast": { "$value": 1500 } },
  "breakpoint": { "$type": "dimension", "mobile": { "$value": "0px" }, "tablet": { "$value": "768px" }, "desktop": { "$value": "1024px" } }
}
```

- [ ] **Step 4: Semantic colors** — `src/semantic/color.tokens.json`
```jsonc
{
  "color": {
    "$type": "color",
    "brand": { "primary": { "$value": "{color.blue.900}" }, "primary-hover": { "$value": "{color.blue.700}" }, "surface": { "$value": "{color.blue.100}" }, "surface-hover": { "$value": "{color.blue.200}" } },
    "text": { "default": { "$value": "{color.gray.900}" }, "muted": { "$value": "{color.gray.700}" }, "disabled": { "$value": "{color.gray.400}" }, "on-brand": { "$value": "{color.white}" } },
    "surface": { "default": { "$value": "{color.white}" }, "subtle": { "$value": "{color.gray.50}" } },
    "border": { "default": { "$value": "{color.gray.300}" }, "strong": { "$value": "{color.gray.700}" }, "focus": { "$value": "{color.blue.500}" } },
    "feedback": { "error": { "$value": "{color.red.500}" }, "success": { "$value": "{color.green.600}" } }
  }
}
```

- [ ] **Step 5: Semantic typography composites** — `src/semantic/typography.tokens.json`
```jsonc
{
  "typography": {
    "$type": "typography",
    "heading-1": { "$value": { "fontFamily": "{font.family.base}", "fontSize": "{font.size.46}", "fontWeight": "{font.weight.bold}", "lineHeight": "{line-height.tight}" } },
    "heading-2": { "$value": { "fontFamily": "{font.family.base}", "fontSize": "{font.size.34}", "fontWeight": "{font.weight.bold}", "lineHeight": "{line-height.tight}" } },
    "heading-3": { "$value": { "fontFamily": "{font.family.base}", "fontSize": "{font.size.26}", "fontWeight": "{font.weight.bold}", "lineHeight": "{line-height.snug}" } },
    "heading-4": { "$value": { "fontFamily": "{font.family.base}", "fontSize": "{font.size.24}", "fontWeight": "{font.weight.bold}", "lineHeight": "{line-height.snug}" } },
    "title":     { "$value": { "fontFamily": "{font.family.base}", "fontSize": "{font.size.20}", "fontWeight": "{font.weight.bold}", "lineHeight": "{line-height.normal}" } },
    "subtitle":  { "$value": { "fontFamily": "{font.family.base}", "fontSize": "{font.size.16}", "fontWeight": "{font.weight.bold}", "lineHeight": "{line-height.normal}" } },
    "body":      { "$value": { "fontFamily": "{font.family.base}", "fontSize": "{font.size.16}", "fontWeight": "{font.weight.regular}", "lineHeight": "{line-height.relaxed}" } },
    "tab-lg":    { "$value": { "fontFamily": "{font.family.base}", "fontSize": "{font.size.34}", "fontWeight": "{font.weight.medium}", "lineHeight": "{line-height.normal}" } },
    "tab-sm":    { "$value": { "fontFamily": "{font.family.base}", "fontSize": "{font.size.20}", "fontWeight": "{font.weight.medium}", "lineHeight": "{line-height.normal}" } }
  }
}
```

- [ ] **Step 6: Component (button) tokens** — `src/component/button.tokens.json`
```jsonc
{
  "button": {
    "radius": { "$type": "dimension", "$value": "{radius.md}" },
    "disabled-opacity": { "$type": "number", "$value": "{opacity.disabled}" },
    "focus-ring-color": { "$type": "color", "$value": "{focus-ring.color}" },
    "filled":   { "bg": { "$type": "color", "$value": "{color.brand.primary}" }, "bg-hover": { "$type": "color", "$value": "{color.brand.primary-hover}" }, "fg": { "$type": "color", "$value": "{color.text.on-brand}" } },
    "outlined": { "bg-hover": { "$type": "color", "$value": "{color.brand.surface}" }, "border": { "$type": "color", "$value": "{color.brand.primary}" }, "fg": { "$type": "color", "$value": "{color.brand.primary}" } },
    "tonal":    { "bg": { "$type": "color", "$value": "{color.brand.surface}" }, "bg-hover": { "$type": "color", "$value": "{color.brand.surface-hover}" }, "fg": { "$type": "color", "$value": "{color.brand.primary}" } }
  }
}
```

- [ ] **Step 7: Build + assert**

Run: `pnpm --filter @tzuchi/tokens build`
Expected: prints `tokens built`; `dist/tokens.css` exists. Then:
Run: `grep -c 'var(--tc-color-blue-900)' packages/tokens/dist/tokens.css`
Expected: ≥1 (proves `outputReferences` emitted a reference for `--tc-color-brand-primary`).

> If Style Dictionary v4 errors on `$type`-at-group-level or composite handling, adjust: ensure `usesDtcg` is auto-detected (it is when `$value` present); for typography/shadow rely on the built-in `css` transform group shorthands (`typography/css/shorthand`, `shadow/css/shorthand`). No `expand` needed.

- [ ] **Step 8: Commit**
```bash
git add -A && git commit -m "feat(tokens): DTCG token sources + Style Dictionary build"
```

---

## Task 3: `@tzuchi/components` skeleton + build/CEM config

**Files:**
- Create: `packages/components/package.json`, `tsconfig.json`, `vite.lib.config.ts`, `vite.cdn.config.ts`, `custom-elements-manifest.config.mjs`, `web-test-runner.config.mjs`

- [ ] **Step 1: Package manifest (exports map + sideEffects allowlist)**

`packages/components/package.json`:
```jsonc
{
  "name": "@tzuchi/components",
  "version": "0.0.0",
  "type": "module",
  "sideEffects": ["**/*.css", "**/*-define.js", "./dist/index.js", "./dist/cdn/*"],
  "exports": {
    ".": { "types": "./dist/index.d.ts", "default": "./dist/index.js" },
    "./button": { "types": "./dist/button/tc-button-define.d.ts", "default": "./dist/button/tc-button-define.js" },
    "./button/class": { "types": "./dist/button/tc-button.d.ts", "default": "./dist/button/tc-button.js" },
    "./cdn": { "default": "./dist/cdn/tc-components.js" },
    "./custom-elements.json": "./custom-elements.json"
  },
  "files": ["dist", "custom-elements.json"],
  "dependencies": { "@tzuchi/tokens": "workspace:*", "lit": "^3.2.0" },
  "scripts": {
    "build": "tsc -b && vite build --config vite.lib.config.ts && vite build --config vite.cdn.config.ts && pnpm run cem",
    "cem": "cem analyze --config custom-elements-manifest.config.mjs",
    "test": "wtr --config web-test-runner.config.mjs",
    "verify:pkg": "publint && attw --pack ."
  },
  "devDependencies": {
    "vite": "^5.4.0", "typescript": "^5.6.0",
    "@custom-elements-manifest/analyzer": "^0.10.0",
    "@web/test-runner": "^0.19.0", "@open-wc/testing": "^4.0.0",
    "publint": "^0.2.12", "@arethetypeswrong/cli": "^0.17.0"
  }
}
```

- [ ] **Step 2: tsconfig with project reference to tokens**

`packages/components/tsconfig.json`:
```jsonc
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "outDir": "dist", "rootDir": "src", "experimentalDecorators": true, "useDefineForClassFields": false },
  "include": ["src"],
  "references": [{ "path": "../tokens" }]
}
```

> `@tzuchi/tokens` needs a minimal `tsconfig.json` (composite) for the reference; add `packages/tokens/tsconfig.json` extending base with `include: []` and `composite: true` so `tsc -b` is happy.

- [ ] **Step 3: Vite library config (Lit external, named entries, shared base chunk)**

`packages/components/vite.lib.config.ts`:
```ts
import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        'button/tc-button': resolve(__dirname, 'src/button/tc-button.ts'),
        'button/tc-button-define': resolve(__dirname, 'src/button/tc-button-define.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: [/^lit/, /^@tzuchi\/tokens/],
      output: { entryFileNames: '[name].js', chunkFileNames: 'shared/[name].js' },
    },
  },
});
```

- [ ] **Step 4: Vite CDN config (Lit bundled, single file)**

`packages/components/vite.cdn.config.ts`:
```ts
import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  build: {
    outDir: 'dist/cdn',
    emptyOutDir: true,
    lib: { entry: resolve(__dirname, 'src/index.ts'), fileName: () => 'tc-components.js', formats: ['es'] },
    rollupOptions: { external: [] }, // bundle Lit in
  },
});
```

- [ ] **Step 5: CEM analyzer config**

`packages/components/custom-elements-manifest.config.mjs`:
```js
export default {
  globs: ['src/**/*.ts'],
  exclude: ['src/**/*.styles.ts', 'src/**/*.test.ts'],
  litelement: true,
  outdir: '.',
};
```

- [ ] **Step 6: web-test-runner config**

`packages/components/web-test-runner.config.mjs`:
```js
export default {
  files: ['test/**/*.test.ts', '!**/node_modules/**'],
  nodeResolve: true,
  plugins: [],
  // esbuild plugin auto-handles TS via @web/dev-server-esbuild
};
```

> Install `@web/dev-server-esbuild` and add `import { esbuildPlugin } from '@web/dev-server-esbuild'` → `plugins: [esbuildPlugin({ ts: true, target: 'auto', tsconfig: './tsconfig.json' })]`. Decorators require esbuild `tsconfigRaw` with `experimentalDecorators:true`; pass it in the plugin options.

---

## Task 4: `TcElement` base + `defineElement` (TDD)

**Files:**
- Create: `packages/components/src/base/tc-element.ts`, `src/base/define-element.ts`, `test/define-element.test.ts`

- [ ] **Step 1: Write failing test** — `test/define-element.test.ts`
```ts
import { expect } from '@open-wc/testing';
import { defineElement } from '../src/base/define-element.js';

class FakeEl extends HTMLElement {}
class FakeEl2 extends HTMLElement {}

it('registers a tag once and is a no-op on repeat', () => {
  defineElement('tc-fake', FakeEl);
  defineElement('tc-fake', FakeEl2); // must not throw
  expect(customElements.get('tc-fake')).to.equal(FakeEl);
});
```

- [ ] **Step 2: Run, expect fail** — Run: `pnpm --filter @tzuchi/components test`
Expected: FAIL (`define-element.js` not found).

- [ ] **Step 3: Implement** — `src/base/define-element.ts`
```ts
export function defineElement(tag: string, ctor: CustomElementConstructor): void {
  if (!customElements.get(tag)) customElements.define(tag, ctor);
}
```
`src/base/tc-element.ts`:
```ts
import { LitElement } from 'lit';

/** Shared base for all `<tc-*>` components. */
export class TcElement extends LitElement {
  static shadowRootOptions: ShadowRootInit = { ...LitElement.shadowRootOptions, delegatesFocus: true };
}
```

- [ ] **Step 4: Run, expect pass** — Run: `pnpm --filter @tzuchi/components test`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add -A && git commit -m "feat(components): TcElement base + duplicate-safe defineElement"
```

---

## Task 5: `tc-button` styles (token-only)

**Files:**
- Create: `packages/components/src/button/tc-button.styles.ts`

- [ ] **Step 1: Implement styles** (every token has an inline fallback per spec §5.2)
```ts
import { css } from 'lit';

export const buttonStyles = css`
  :host { display: inline-block; }
  :host([full-width]) { display: block; }
  :host([full-width]) .btn { width: 100%; }
  .btn {
    display: inline-flex; align-items: center; justify-content: center; gap: var(--tc-space-8, 8px);
    font: var(--tc-typography-subtitle, 700 16px/1.5 sans-serif);
    border-radius: var(--tc-button-radius, var(--tc-radius-md, 8px));
    padding: var(--tc-space-8, 8px) var(--tc-space-24, 24px);
    border: 1px solid transparent; cursor: pointer;
    transition: background-color var(--tc-motion-duration-fast, 150ms) var(--tc-motion-easing-standard, ease);
  }
  .btn:focus-visible {
    outline: var(--tc-focus-ring-width, 2px) solid var(--tc-button-focus-ring-color, var(--tc-color-border-focus, #4F7BBE));
    outline-offset: var(--tc-focus-ring-offset, 2px);
  }
  .btn:disabled { opacity: var(--tc-button-disabled-opacity, var(--tc-opacity-disabled, 0.38)); cursor: not-allowed; }

  :host([variant='filled']) .btn { background: var(--tc-button-filled-bg, #1B2D58); color: var(--tc-button-filled-fg, #fff); }
  :host([variant='filled']) .btn:hover:not(:disabled) { background: var(--tc-button-filled-bg-hover, #30559F); }

  :host([variant='outlined']) .btn { background: transparent; color: var(--tc-button-outlined-fg, #1B2D58); border-color: var(--tc-button-outlined-border, #1B2D58); }
  :host([variant='outlined']) .btn:hover:not(:disabled) { background: var(--tc-button-outlined-bg-hover, #E8EEFE); }

  :host([variant='tonal']) .btn { background: var(--tc-button-tonal-bg, #E8EEFE); color: var(--tc-button-tonal-fg, #1B2D58); }
  :host([variant='tonal']) .btn:hover:not(:disabled) { background: var(--tc-button-tonal-bg-hover, #D1DEFF); }
`;
```

- [ ] **Step 2: Commit**
```bash
git add -A && git commit -m "feat(components): tc-button styles (token-driven)"
```

---

## Task 6: `tc-button` element (TDD)

**Files:**
- Create: `packages/components/src/button/tc-button.ts`, `tc-button-define.ts`, `button/index.ts`, `src/index.ts`, `test/tc-button.test.ts`

- [ ] **Step 1: Write failing tests** — `test/tc-button.test.ts`
```ts
import { expect, fixture, html } from '@open-wc/testing';
import '../src/button/tc-button-define.js';
import type { TcButton } from '../src/button/tc-button.js';

it('renders default filled variant and slotted label', async () => {
  const el = await fixture<TcButton>(html`<tc-button>送出</tc-button>`);
  expect(el.variant).to.equal('filled');
  expect(el.shadowRoot!.querySelector('button')).to.exist;
  expect(el.textContent).to.contain('送出');
});

it('reflects variant attribute', async () => {
  const el = await fixture<TcButton>(html`<tc-button variant="tonal"></tc-button>`);
  expect(el.getAttribute('variant')).to.equal('tonal');
});

it('does not fire click when disabled', async () => {
  const el = await fixture<TcButton>(html`<tc-button disabled>x</tc-button>`);
  let clicked = false;
  el.addEventListener('click', () => (clicked = true));
  el.shadowRoot!.querySelector('button')!.click();
  expect(clicked).to.be.false;
});

it('submits the associated form when type=submit', async () => {
  const form = await fixture<HTMLFormElement>(html`<form><tc-button type="submit">go</tc-button></form>`);
  const el = form.querySelector('tc-button') as TcButton;
  let submitted = false;
  form.addEventListener('submit', (e) => { e.preventDefault(); submitted = true; });
  el.shadowRoot!.querySelector('button')!.click();
  expect(submitted).to.be.true;
});
```

- [ ] **Step 2: Run, expect fail** — Run: `pnpm --filter @tzuchi/components test`
Expected: FAIL (`tc-button.js` not found).

- [ ] **Step 3: Implement element** — `src/button/tc-button.ts`
```ts
import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { TcElement } from '../base/tc-element.js';
import { buttonStyles } from './tc-button.styles.js';

/**
 * 主要按鈕。
 * @summary Tzu Chi primary button.
 * @slot - 按鈕標籤文字
 * @slot start - 前置圖示
 * @slot end - 後置圖示
 * @csspart base - 內部原生 <button>
 * @cssprop [--tc-button-radius] - 圓角
 * @cssprop [--tc-button-filled-bg] - filled 底色
 */
export class TcButton extends TcElement {
  static formAssociated = true;
  static styles = buttonStyles;

  @property({ reflect: true }) variant: 'filled' | 'outlined' | 'tonal' = 'filled';
  @property({ reflect: true }) type: 'button' | 'submit' | 'reset' = 'button';
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Boolean, reflect: true, attribute: 'full-width' }) fullWidth = false;

  #internals = this.attachInternals();

  #onClick = (e: MouseEvent) => {
    if (this.disabled) { e.stopImmediatePropagation(); e.preventDefault(); return; }
    if (this.type === 'submit') this.#internals.form?.requestSubmit();
    else if (this.type === 'reset') this.#internals.form?.reset();
  };

  render() {
    return html`
      <button part="base" class="btn" type="button" ?disabled=${this.disabled} @click=${this.#onClick}>
        <slot name="start"></slot>
        <slot></slot>
        <slot name="end"></slot>
      </button>
    `;
  }
}

declare global { interface HTMLElementTagNameMap { 'tc-button': TcButton } }
```
`src/button/tc-button-define.ts`:
```ts
import { defineElement } from '../base/define-element.js';
import { TcButton } from './tc-button.js';
defineElement('tc-button', TcButton);
```
`src/button/index.ts`:
```ts
export { TcButton } from './tc-button.js';
import './tc-button-define.js';
```
`src/index.ts` (barrel — registers all; CDN only):
```ts
export * from './button/index.js';
```

- [ ] **Step 4: Run, expect pass** — Run: `pnpm --filter @tzuchi/components test`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**
```bash
git add -A && git commit -m "feat(components): tc-button element (FACE submit, a11y, TDD)"
```

---

## Task 7: Build components + CEM + package verify

- [ ] **Step 1: Build tokens first** — Run: `pnpm --filter @tzuchi/tokens build`
- [ ] **Step 2: Build components** — Run: `pnpm --filter @tzuchi/components build`
Expected: `dist/button/tc-button.js`, `dist/button/tc-button-define.js`, `dist/index.js`, `dist/cdn/tc-components.js`, and `custom-elements.json` all written.
- [ ] **Step 3: Assert CEM captured JSDoc** — Run: `grep -c '"--tc-button-radius"' packages/components/custom-elements.json`
Expected: ≥1 (proves `@cssprop` tags landed in the manifest).
- [ ] **Step 4: Assert CDN bundle has no bare lit import** — Run: `! grep -E "from ['\"]lit" packages/components/dist/cdn/tc-components.js`
Expected: exit 0 (Lit was bundled, no bare specifier escaped).
- [ ] **Step 5: Package verify** — Run: `pnpm --filter @tzuchi/components verify:pkg`
Expected: publint clean; attw reports resolvable types for `.`, `./button`, `./button/class`.
- [ ] **Step 6: Commit**
```bash
git add -A && git commit -m "build(components): library + CDN builds, CEM, package verified"
```

---

## Task 8: `@tzuchi/react` wrapper generator (CEM → wrapper)

**Files:**
- Create: `packages/react/package.json`, `tsconfig.json`, `scripts/generate.mjs`, `src/generated/TcButton.ts` (generated), `src/index.ts`

- [ ] **Step 1: Package manifest**
```jsonc
{
  "name": "@tzuchi/react",
  "version": "0.0.0",
  "type": "module",
  "exports": { ".": { "types": "./dist/index.d.ts", "default": "./dist/index.js" } },
  "files": ["dist"],
  "scripts": {
    "generate": "node scripts/generate.mjs",
    "build": "node scripts/generate.mjs && tsc -b",
    "verify:pkg": "publint && attw --pack ."
  },
  "dependencies": { "@tzuchi/components": "workspace:*" },
  "peerDependencies": { "react": "^18 || ^19", "react-dom": "^18 || ^19", "lit": "^3.2.0", "@lit/react": "^1.0.0" },
  "devDependencies": { "react": "^19.0.0", "react-dom": "^19.0.0", "@lit/react": "^1.0.8", "@types/react": "^19.0.0", "typescript": "^5.6.0", "publint": "^0.2.12", "@arethetypeswrong/cli": "^0.17.0" }
}
```

- [ ] **Step 2: Generator** — `scripts/generate.mjs`
```js
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const cemPath = resolve(here, '../../components/custom-elements.json');
const cem = JSON.parse(await readFile(cemPath, 'utf8'));

const pascal = (s) => s.replace(/(^|-)([a-z])/g, (_, __, c) => c.toUpperCase());

const decls = cem.modules.flatMap((m) => m.declarations ?? []).filter((d) => d.customElement && d.tagName);
await mkdir(resolve(here, '../src/generated'), { recursive: true });

const indexLines = [];
for (const d of decls) {
  const tag = d.tagName;               // tc-button
  const cls = d.name;                  // TcButton
  const subpath = tag.replace(/^tc-/, '');
  const events = (d.events ?? []).map((e) => `    on${pascal(e.name)}: '${e.name}'`).join(',\n');
  const out = `'use client';
import * as React from 'react';
import { createComponent } from '@lit/react';
import { ${cls} as ${cls}Element } from '@tzuchi/components/${subpath}/class';
import '@tzuchi/components/${subpath}';

export const ${cls} = createComponent({
  tagName: '${tag}',
  elementClass: ${cls}Element,
  react: React,
  events: {
${events}
  },
});
`;
  await writeFile(resolve(here, `../src/generated/${cls}.ts`), out);
  indexLines.push(`export { ${cls} } from './generated/${cls}.js';`);
}
await writeFile(resolve(here, '../src/index.ts'), `'use client';\n${indexLines.join('\n')}\n`);
console.log(`generated ${decls.length} wrapper(s)`);
```

- [ ] **Step 3: tsconfig** — `packages/react/tsconfig.json`
```jsonc
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "outDir": "dist", "rootDir": "src", "jsx": "react-jsx", "lib": ["ES2022", "DOM", "DOM.Iterable"] },
  "include": ["src"],
  "references": [{ "path": "../components" }]
}
```

- [ ] **Step 4: Generate + typecheck**

Run: `pnpm --filter @tzuchi/react build`
Expected: prints `generated 1 wrapper(s)`; `src/generated/TcButton.ts` exists; `tsc -b` passes; `dist/index.js` emitted.

- [ ] **Step 5: Staleness guard check** — Run: `pnpm --filter @tzuchi/react generate && git diff --exit-code packages/react/src/generated`
Expected: exit 0 (committed generated output matches a fresh run).

- [ ] **Step 6: Commit**
```bash
git add -A && git commit -m "feat(react): CEM-driven wrapper generator + TcButton wrapper"
```

---

## Task 9: Storybook cookbook (button)

**Files:**
- Create: `apps/storybook/package.json`, `.storybook/main.ts`, `.storybook/preview.ts`, `stories/tc-button.stories.ts`

- [ ] **Step 1: Package + Storybook 9 deps**
```jsonc
{
  "name": "@tzuchi/storybook", "private": true, "type": "module",
  "scripts": { "dev": "storybook dev -p 6006", "build": "storybook build" },
  "dependencies": { "@tzuchi/components": "workspace:*", "@tzuchi/tokens": "workspace:*" },
  "devDependencies": {
    "storybook": "^9.0.0", "@storybook/web-components-vite": "^9.0.0",
    "@storybook/addon-a11y": "^9.0.0", "@storybook/addon-docs": "^9.0.0",
    "lit": "^3.2.0", "vite": "^5.4.0"
  }
}
```

- [ ] **Step 2: `.storybook/main.ts`**
```ts
import type { StorybookConfig } from '@storybook/web-components-vite';
const config: StorybookConfig = {
  stories: ['../stories/**/*.stories.ts'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  framework: { name: '@storybook/web-components-vite', options: {} },
};
export default config;
```

- [ ] **Step 3: `.storybook/preview.ts` (CEM + tokens.css)**
```ts
import type { Preview } from '@storybook/web-components-vite';
import { setCustomElementsManifest } from '@storybook/web-components-vite';
import customElements from '../../../packages/components/custom-elements.json';
import '@tzuchi/tokens/tokens.css';
setCustomElementsManifest(customElements);
const preview: Preview = {
  parameters: { a11y: { test: 'error' } },
  tags: ['autodocs'],
};
export default preview;
```

- [ ] **Step 4: `stories/tc-button.stories.ts` (explicit argTypes)**
```ts
import { html } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components-vite';
import '@tzuchi/components/button';

const meta: Meta = {
  title: 'Components/Button',
  component: 'tc-button',
  argTypes: {
    variant: { control: 'inline-radio', options: ['filled', 'outlined', 'tonal'] },
    disabled: { control: 'boolean' },
    fullWidth: { control: 'boolean', name: 'full-width' },
  },
  args: { variant: 'filled', disabled: false, fullWidth: false },
  render: (a) =>
    html`<tc-button variant=${a.variant} ?disabled=${a.disabled} ?full-width=${a.fullWidth}>送出</tc-button>`,
};
export default meta;
type Story = StoryObj;
export const Filled: Story = {};
export const Outlined: Story = { args: { variant: 'outlined' } };
export const Tonal: Story = { args: { variant: 'tonal' } };
```

- [ ] **Step 5: Build Storybook (smoke)** — Run: `pnpm --filter @tzuchi/storybook build`
Expected: `storybook-static/` produced without errors.
- [ ] **Step 6: Commit**
```bash
git add -A && git commit -m "feat(storybook): button stories + CEM autodocs + a11y preview"
```

---

## Task 10: Pure-HTML demo + CDN smoke test

**Files:**
- Create: `apps/demo-html/package.json`, `index.html`, `smoke.mjs`

- [ ] **Step 1: Demo page** — `apps/demo-html/index.html`
```html
<!doctype html>
<html lang="zh-Hant">
  <head>
    <meta charset="utf-8" />
    <title>Tzu Chi UIKit — HTML demo</title>
    <link rel="stylesheet" href="../../packages/tokens/dist/tokens.css" />
    <script type="module" src="../../packages/components/dist/cdn/tc-components.js"></script>
    <style>:not(:defined) { visibility: hidden; }</style>
  </head>
  <body>
    <form id="f">
      <tc-button variant="filled">送出</tc-button>
      <tc-button variant="outlined">取消</tc-button>
      <tc-button variant="tonal">更多</tc-button>
      <tc-button type="submit">提交表單</tc-button>
    </form>
  </body>
</html>
```

- [ ] **Step 2: Smoke test** — `apps/demo-html/smoke.mjs` (asserts CDN bundle defines the element without a bundler)
```js
import { readFile } from 'node:fs/promises';
const cdn = await readFile(new URL('../../packages/components/dist/cdn/tc-components.js', import.meta.url), 'utf8');
if (/from\s*['"]lit['"]/.test(cdn)) { console.error('bare lit import escaped CDN bundle'); process.exit(1); }
if (!cdn.includes('tc-button')) { console.error('tc-button not registered in CDN bundle'); process.exit(1); }
console.log('CDN smoke OK');
```
`apps/demo-html/package.json`:
```jsonc
{ "name": "@tzuchi/demo-html", "private": true, "type": "module",
  "scripts": { "test": "node smoke.mjs" },
  "dependencies": { "@tzuchi/components": "workspace:*", "@tzuchi/tokens": "workspace:*" } }
```

- [ ] **Step 3: Run smoke** — Run: `pnpm --filter @tzuchi/demo-html test`
Expected: prints `CDN smoke OK`.
- [ ] **Step 4: Commit**
```bash
git add -A && git commit -m "feat(demo-html): pure-HTML demo + CDN smoke test"
```

---

## Task 11: Full pipeline gate + changeset

- [ ] **Step 1: Clean build everything** — Run: `pnpm -w run build`
Expected: turbo runs tokens → components → react → storybook in dependency order, all green.
- [ ] **Step 2: Typecheck + lint** — Run: `pnpm -w run typecheck && pnpm -w run lint`
Expected: no errors.
- [ ] **Step 3: All tests** — Run: `pnpm -w run test`
Expected: components tests pass; demo smoke passes.
- [ ] **Step 4: Package verify** — Run: `pnpm -w run verify:pkg`
Expected: publint + attw clean for the three publishable packages.
- [ ] **Step 5: Add a changeset** — Run: `pnpm changeset` (minor for the three packages; summary: "M1a pipeline + tc-button").
- [ ] **Step 6: Commit**
```bash
git add -A && git commit -m "chore: M1a pipeline gates green + changeset"
```

---

## Self-Review notes (resolved)
- **Spec coverage:** tokens (§5) → Tasks 1–2; FACE (§6.3) → Task 6 submit test; CEM JSDoc contract (§6.6) → Task 6 tags + Task 7 grep; mandatory React wrapper + events map (§7) → Task 8; CDN/library split + sideEffects + exports (§4.2–4.3) → Task 3; Storybook 9 + CEM preview + a11y (§9) → Task 9; CI gates incl. publint/attw/CDN smoke (§10) → Tasks 7,10,11; pure-HTML (§8) → Task 10.
- **Deferred to M1b (separate plan):** tc-icon, tc-icon-button, tc-input (full FACE + focus delegation + label-in-shadow), tc-card, tc-tabs/tc-tab; RTL/CJK tests; §16 Figma exact-value extraction (elevation/line-height/radius/font) — pulled at M1b start before locking visuals.
- **Known exec risks:** Style Dictionary v4 composite/`outputReferences` edge cases (Task 2 note); web-test-runner browser launcher download (Task 3 note — may need `@web/test-runner-chrome`/playwright); Storybook 9 a11y-test config naming. Adjust at execution; behavior contracts above are stable.
```
