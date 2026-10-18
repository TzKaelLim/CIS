# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

tceditor is Tzu Chi's visual page editor for React. It is a hard fork of [Puck](https://github.com/puckeditor/puck) v0.23.0 (git tag `v0.23.0`, commit `b4204f09`) under the MIT License (see `LICENSE` and `NOTICE`). This is a pnpm + Turborepo monorepo (Node >= 24, pnpm 10.26.1 pinned in `packageManager`):

- `packages/core` — the library, packaged as `@tzuchi/tceditor`. Nearly all real work happens here.
- `packages/plugin-heading-analyzer` — `@tzuchi/tceditor-plugin-heading-analyzer`, built with tsup like core.
- `packages/tsconfig`, `packages/tsup-config`, `packages/eslint-config-custom` — shared build and lint configuration.
- `apps/demo` — Next.js App Router playground used for development and the e2e smoke test.
- `scripts/` — the supply-chain gate (`audit-gate.mjs`, `audit-gate-lib.mjs`) and the puppeteer smoke test (`e2e/`).
- `infra/supabase/` — self-hosted Supabase for local development (see "Supabase dev stack").
- `vendor/uikit` — snapshot of the Tzu Chi uikit's `@heroui/styles` (HeroUI, Apache-2.0, kept with `heroui/LICENSE` and `heroui/NOTICE.md`) and `@tzuchi/tokens` at a pinned commit. Only `pnpm sync:uikit -- --commit <sha>` writes it; `pnpm test` checks every file against `vendor/uikit/SOURCE.json`, so never edit it by hand.
- `apps/docs` — Puck's upstream documentation site, kept only as reference. It is not part of the pnpm workspace, is never installed or built, and still uses the upstream package names.
- `docs/superpowers/specs/` — the tceditor roadmap and the design specs of its sub-projects.

Both packages are at version `0.1.0` and marked `private`: they are not published to any registry, and apps in this monorepo depend on them with `workspace:*`.

Public API names are deliberately unchanged from Puck: `<Puck>`, `<Render>`, `usePuck`, the `Config` type, CSS class names, `--puck-*` CSS variables and `data-puck-*` attributes. Puck's v0.23 documentation in `apps/docs` still describes most of the API; this file and `CHANGELOG.md` say where tceditor differs.

## Fork, branches and remotes

- `tzuchi/main` is the fork's main line, branched from `v0.23.0`. Work on it or on branches from it.
- `main` is an unmodified mirror of upstream Puck, kept for comparing with upstream. Never commit to it.
- The `upstream` remote points to Puck's GitHub repository for reference only; its push URL is `no_push`. Our own remote will be added as `origin` once the hosting platform is decided.
- There is no upstream sync. To take an upstream bug fix, run `git fetch upstream` and `git cherry-pick -x <sha>` onto `tzuchi/main` (if it conflicts badly, redo the change by hand and cite the source commit), then add a line to `CHANGELOG.md`.

## Commands

From the repo root:

```sh
pnpm install        # also builds core and the plugin through their `prepare` scripts
pnpm dev            # runs only apps/demo on http://localhost:3000 (bound to 127.0.0.1); editor at /edit or any /<path>/edit
pnpm build          # turbo build of core, the plugin and the demo
pnpm test           # core's jest suites, then the node:test suites of the audit gate, check:bundle, the vendored uikit snapshot and the single-React check
pnpm typecheck      # tsc over core's production sources (packages/core/tsconfig.typecheck.json)
pnpm lint
pnpm format:check   # prettier over ts, tsx, mjs, md, mdx and css files; use `pnpm format` to fix
pnpm check:bundle   # after a build: fails if the main, RSC or rules entry can reach @tiptap/html or happy-dom, or the rules entry reaches React, Tiptap or node:*
pnpm audit:gate     # pnpm audit; fails only on advisories in versions that ship with core, the plugin or packages/blocks
pnpm verify         # test, typecheck, lint, format:check, build, check:bundle, audit:gate (in that order)
pnpm smoke          # puppeteer drag-and-drop smoke test; needs the demo running on :3000
pnpm sync:uikit     # rewrites vendor/uikit from a uikit commit: pnpm sync:uikit -- --commit <sha>
```

There is no CI yet, so `pnpm verify` is the gate: work is not done until it passes. `audit:gate` needs network access.

Running a single test:

```sh
pnpm --filter @tzuchi/tceditor test lib/richtext/__tests__/normalize.spec.ts   # one jest file
pnpm --filter @tzuchi/tceditor test -t "name of test"                          # jest, by test name
node --test scripts/audit-gate-lib.test.mjs                                     # one node:test file
```

Core tests use Jest with ts-jest and jsdom. They are `*.spec.ts(x)` files inside `__tests__/` folders next to the code they cover; shared test helpers live in `__helpers__/`. Neither is checked by `pnpm typecheck`. Tests that need the real happy-dom start with `/** @jest-environment node */`.

- `apps/demo/tsconfig.json` maps `@tzuchi/tceditor` to `packages/core/index.ts`, so the demo runs core from source and you don't need to build core while developing.
- `pnpm-lock.yaml` is authoritative. Install with `pnpm install --frozen-lockfile`, and commit lockfile changes together with the `package.json` change that caused them.
- In a linked git worktree, run `export TURBO_CACHE_DIR="$PWD/.turbo/cache"` before turbo-backed commands (`test`, `lint`, `build`, `verify`); otherwise turbo writes its cache into the main checkout.

## Core architecture (`packages/core`)

### Entry points

`bundle/` defines the published entry points, and `package.json` `exports` maps them:

- `bundle/core.ts` is the **public API surface** (`@tzuchi/tceditor`). Anything exported here is public API, and changes to it get extra review.
- `bundle/index.ts` is core plus `index.css`. The built `dist/index.css` is the only stylesheet export, `@tzuchi/tceditor/tceditor.css`. By default the editor injects its CSS at runtime, so importing the stylesheet is optional.
- `bundle/rsc.tsx` is served under the `react-server` export condition and as `@tzuchi/tceditor/rsc`. It exposes `Render` from `components/ServerRender`, the data helpers and the richtext renderer. Code it reaches must not import client-only code (zustand store, context, effects).
- `bundle/internal.ts` (`@tzuchi/tceditor/internal`) exposes internals such as `createReducer`.
- `bundle/richtext-migrate.ts` (`@tzuchi/tceditor/richtext-migrate`) is the server-only converter from legacy HTML richtext to JSON. It is the only entry allowed to reach `@tiptap/html` and `happy-dom`. Its CJS build needs Node >= 22.12 (`require(esm)`); on Node 20 use the ESM build.
- `bundle/rules.ts` (`@tzuchi/tceditor/rules`) holds the React-free rules that validators and server code share with the editor: `normalizeRichText`, `isSafeHref`, `textToRichText`, `fitRichTextToTypes`, the richtext feature helpers (`RICHTEXT_FEATURES`, `richTextFeaturesToOptions`, `richTextFeaturesToTypes`), `stableStringify` and `isComponentAllowed`. It is built by a second tsup run with its own config, `tsup.rules.config.ts`, because the shared config in `packages/tsup-config` injects `import React from "react"` into every output file. It imports each module by path, never `lib/richtext/index.ts` (which also exports the React renderer), and `pnpm check:bundle` fails if `dist/rules.*` mention `react`, `react-dom` or `@tiptap/`, or import a `node:` module.

Importing the package must have no side effects, so it can run in edge runtimes. For example, the fallback store in `store/index.ts` is created lazily so `crypto.randomUUID` isn't called at import time. `__tests__/edge-runtime.spec.ts` enforces this.

### State: one zustand store per `<Puck>`

`store/index.ts` `createAppStore` builds the store. `components/Puck` creates one and provides it through `appStoreContext`. The store is composed of slices in `store/slices/`: `history`, `nodes`, `permissions` and `fields`. Components read from it with `useAppStore(selector)` or `useAppStoreApi()`. The public `usePuck` / `useGetPuck` / `createUsePuck` API (`lib/use-puck.ts`) is a separate store synced from the app store.

- `state` is a `PrivateAppState`: the public `AppState` (`{ data, ui }`) plus `indexes: { nodes, zones }`. `nodes` is keyed by component id and holds the data, flat data, `parentId`, `zone` and path. `zones` is keyed by the compound id `"<parentId>:<zoneName>"`, and the root content zone is `"root:default-zone"`. Both indexes are null-prototype objects. `lib/data/make-state-public.ts` strips the indexes before state reaches user callbacks such as `onAction`, `onChange` and `usePuck`.
- All data mutations go through `dispatch(action)` → `reducer/index.ts` `createReducer`, which delegates to `reducer/actions/*`. Actions rebuild the indexes with `lib/data/walk-app-state.ts`, so new actions should do the same rather than editing `data` by hand. History is recorded for every action except `registerZone`, `unregisterZone`, `setData`, `setUi` and `set`, unless the action passes `recordHistory`.

### Data model: slots vs. legacy DropZones

`Data` is `{ root, content, zones }`. Nesting is done with **slot fields** (`type: "slot"`), which store child content inline in props. `<DropZone>` together with the top-level `zones` map is deprecated but still supported. Tree utilities in `lib/data/`, such as `walkTree`, `walkAppState`, `mapFields` and `forRelatedZones`, handle both forms. `lib/migrate.ts` converts the legacy format to slots.

### Props pipeline: field transforms

A component's stored props are turned into the props its `render` receives by `lib/data/map-fields.ts`, driven by `FieldTransforms` (a map from field type to transform function, `types/API/FieldTransforms.ts`). `lib/field-transforms/use-field-transforms.tsx` and `use-field-transforms-tracked.tsx` apply them through `build-mappers.ts`; the built-in transforms are in `lib/field-transforms/default-transforms/` (slot, inline text, richtext).

- Editor: `components/DropZone` combines the built-in slot, inline text and richtext transforms, then each plugin's `fieldTransforms`, then the user's `fieldTransforms` prop, in that order, and applies them with `useFieldTransformsTracked`. The root (`components/Puck/components/Preview/components/editor-page.tsx`) applies only the slot transform and then `useRichtextProps`.
- Render: `lib/use-slots.tsx` applies only the slot transform. It is used by `components/Render` (client), `components/ServerRender` (RSC) and `components/SlotRender/server.tsx`, which then pass richtext fields through `useRichtextProps` (`components/RichTextEditor/lib/use-richtext-props.tsx`). This path must stay RSC-safe.

Async `resolveData` / `resolveFields` / `resolvePermissions` on component configs run through `lib/resolve-component-data.ts`, the store's `resolveComponentData`, and `lib/resolve-all-data.ts` for server-side use.

### Richtext: Tiptap JSON and one shared renderer

Richtext field values are stored as Tiptap JSON (`RichTextDoc`, `editor.getJSON()`), never as HTML. `lib/richtext/` is the single implementation, exported from the main and RSC entries:

- `normalize.ts` — `normalizeRichText(value)` reduces any input (editor JSON, tampered JSON, legacy HTML strings) to the default PuckRichText schema: nodes `doc`, `paragraph`, `heading` (1–6), `bulletList`, `orderedList`, `listItem`, `blockquote`, `codeBlock`, `horizontalRule`, `hardBreak`, `text`; marks `link`, `bold`, `italic`, `underline`, `strike`, `code`. Unknown nodes and marks keep only their text, every attribute is validated (`textAlign` must be `left`, `center`, `right` or `justify`; link `class` is always `null`), and nodes deeper than `RICHTEXT_MAX_DEPTH` (100) become text; `options.maxDepth` can only lower that limit (invalid values fall back to it). A string is always one plain-text paragraph; HTML is never parsed at render time.
- `is-safe-href.ts` — `isSafeHref(href)` allows only `http:`, `https:`, `mailto:`, `tel:` and relative URLs. The renderer, the editor's Link extension (`isAllowedUri` in `components/RichTextEditor/extension.ts`) and the converter all use it.
- `render.tsx` — `renderRichText(value)` normalizes, then renders with `@tiptap/static-renderer` (`json/react`) through null-prototype `nodeMapping` and `markMapping`. `components/RichTextEditor/components/RichTextContent.tsx` wraps it without hooks, so it works in RSC.
- `text-to-richtext.ts` — `textToRichText(text)` builds a one-paragraph document.

The editor (`components/RichTextEditor`) lazy-loads Tiptap. Before it loads, `EditorFallback` shows the same `renderRichText` output, so the canvas, the preview and the published page always match. `components/RichTextEditor/lib/use-synced-editor.ts` stores `editor.getJSON()` and fits the content to the field editor's schema with `components/RichTextEditor/lib/fit-to-schema.ts`. `lib/richtext/html-to-json.ts` (`richTextHtmlToJson`) and `migrate-data.ts` (`migrateRichTextInData`) convert legacy HTML on the server through the `richtext-migrate` entry.

All `@tiptap/*` packages are pinned to the same exact version (3.31.4); `@tiptap/static-renderer` must always equal the `@tiptap/core` version in the lockfile, so upgrade them together. Core's tsconfig uses `"moduleResolution": "node"`, so subpath exports such as `@tiptap/static-renderer/json/react` and `@tiptap/html/server` need `paths` entries (without a file extension) in `packages/core/tsconfig.json`, and in `apps/demo/tsconfig.json` when the demo reaches them.

### Editor UI composition

`components/Puck` assembles the layout from `components/Puck/components/*`. The left-hand panels (`plugins/blocks`, `plugins/fields`, `plugins/outline`, `plugins/legacy-side-bar`) are themselves plugins. Users customize the UI through `overrides` (`types/API/Overrides.ts`, merged in `lib/load-overrides.ts`) and through plugins, which can contribute overrides, panels and field transforms.

The preview renders inside an iframe (`components/AutoFrame`). The editor's own CSS is injected at runtime by `lib/use-inject-css.ts` from `lib/generated/runtime-css.ts`. That file is an empty stub in source and tests, and `packages/core/tsup.config.ts` replaces it at build time with the bundled CSS strings. Drag-and-drop uses `@dnd-kit` pinned to exact `0.4.0` versions, with custom collision and drop logic in `lib/dnd/`.

### UI strings

Every user-visible string in the editor is a key in `lib/dictionary.ts` (`defaultDictionary`, keys such as `header-publish` or `action-duplicate`). Components must read strings with `useMessage(key, params)` so the `dictionary` prop can override them. Don't hard-code UI text.

## Security rules

These rules come from the adoption audit of Puck v0.23.0 and the S1 fixes. Follow them in every change.

- **Never add `dangerouslySetInnerHTML`.** The only remaining use is Puck's `InsertPreview` in `components/DropZone/index.tsx`, which copies the `outerHTML` of an element the editor already rendered; don't copy that pattern. `__tests__/richtext-no-inner-html.spec.ts` keeps it out of the richtext sources.
- **Richtext is stored only as Tiptap JSON and displayed only through the shared renderer** (`renderRichText` / `RichTextContent`). Don't render richtext with `generateHTML`, `editor.getHTML()` or by parsing HTML, and don't store HTML. Convert legacy HTML on the server with `@tzuchi/tceditor/richtext-migrate`.
- **A new Tiptap extension that adds a node, a mark or an attribute must land together with its renderer mapping and attribute validation:** the extension in `components/RichTextEditor/extension.ts`, the allowed types, structure rules and attribute checks in `lib/richtext/normalize.ts`, the `nodeMapping` / `markMapping` entry in `lib/richtext/render.tsx`, and tests (consistency with Tiptap's output in `lib/richtext/__tests__/render.spec.tsx`, malicious attributes in `xss.spec.tsx`). Until then the renderer shows such content as plain text and the editor drops it when the content is reopened (it warns in development).
- **`isSafeHref` is the only rule for link hrefs.** Change it, never a copy of it, so the renderer, the editor and the converter stay in agreement.
- **In new code, look up component configs with `lookupComponentConfig(config, type)`** (`lib/lookup-component-config.ts`), never `config.components[type]`: data can contain types such as `constructor` or `__proto__`. The few direct reads left in the editor UI only fetch a component's `label` and predate this rule. For other user-supplied objects keyed by data, such as `propTransforms` or `migrateDynamicZonesForComponent`, check `Object.prototype.hasOwnProperty.call(obj, key)` first. Core's TypeScript lib does not include `Object.hasOwn` (TS2550), so don't use it.
- **Objects keyed by user data** (component ids, zone compounds, prop names): create lookup tables and accumulators with `Object.create(null)`, and build merged objects with `Object.fromEntries`. Don't spread an accumulator inside `reduce` or assign `acc[key] = value` on a plain object: it is O(n²) and a `__proto__` key replaces the prototype. The null-prototype indexes have no `hasOwnProperty` method, so use `in`, `Object.keys` or `Object.prototype.hasOwnProperty.call`.
- **Every `<style>` (or `<link>`) injected at runtime carries the CSP nonce, set before the element is attached.** The nonce comes from `<Puck nonce>` via `AppStore.nonce`; use `applyNonce(el, nonce)` from `lib/use-inject-css.ts`, and pass it to third-party injectors (dnd-kit's `StyleInjector.configure({ nonce })`, Tiptap's `injectNonce`). Host styles mirrored into the preview iframe keep only a nonce they already carry; never stamp the trusted nonce onto them.
- **No third-party requests from the library or the demo:** no external fonts, remote `url()` or `@import` in CSS (`__tests__/css-imports.spec.ts`), analytics or CDN scripts.
- **The demo's `dev` and `start` servers bind to `127.0.0.1`**, because the demo's `next` version has unpatched critical advisories. Don't expose them on the network.
- **Dependencies:** `onlyBuiltDependencies` in `pnpm-workspace.yaml` allowlists dependency lifecycle scripts, and `overrides` pins vulnerable transitive dependencies. Keep both lists minimal and comment every entry (with its GHSA id for overrides). When core or plugin production code starts importing a devDependency, tsup bundles it into `dist`, so add it to `BUNDLED_DEV_DEPENDENCIES` in `scripts/audit-gate-lib.mjs` and to the test that asserts that constant. `@tiptap/html` and `happy-dom` may only be imported from the `richtext-migrate` code.
- **Secrets:** `infra/supabase/docker/.env` holds generated keys and passwords and must never be committed.

## Supabase dev stack

`infra/supabase/` runs a self-hosted Supabase for local development as the compose project `tceditor` (11 containers named `tceditor-*`), isolated from the other Supabase stacks on the machine. `infra/supabase/README.md` has the details.

```sh
infra/supabase/setup-env.sh   # first time only: writes docker/.env with generated secrets
infra/supabase/up.sh          # start and wait until every service is healthy
infra/supabase/down.sh        # stop; data is kept
infra/supabase/reset.sh       # delete tceditor's containers, volumes and data (asks for confirmation, or pass --yes)
```

- Endpoints: API gateway and Studio on `http://127.0.0.1:8200`, Postgres through Supavisor on `127.0.0.1:5434` (session) and `127.0.0.1:6545` (transaction) as user `postgres.tceditor`. Keys and passwords are in `infra/supabase/docker/.env`.
- `infra/supabase/docker/` is a byte-identical copy of the official `supabase/supabase` `docker/` directory (ref in `docker/.supabase-version`, licensed Apache-2.0, see `infra/supabase/LICENSE`). Don't edit it; tceditor's changes live in `docker/docker-compose.tceditor.yml`. Prettier ignores the directory.
- Use only these scripts or `docker compose -p tceditor …`. Never run the official `docker/reset.sh`, and never stop or modify other compose projects (tciam, tcdata and others).

## Conventions

- **CSS**: use CSS Modules with [SUIT CSS](https://suitcss.github.io) naming, applied through `getClassNameFactory("ComponentName", styles)` (`lib/get-class-name-factory.ts`). Calling it with a string gives a descendant class (`ComponentName-child`) and with an object gives modifiers (`ComponentName--modifier`). Never rely on global styles, because tceditor is embedded in pages whose CSS is out of our control.
- **TypeScript**: avoid `any`.
- **Commits**: use Angular-style conventional commits in English (`feat:`, `fix:`, `docs:`, `build:`, …). Record every user-visible change as a line in `CHANGELOG.md`, in the `### Changes from Puck v0.23.0` list under `## tceditor 0.1.0 (unreleased)`; everything below that is Puck's history and stays unchanged. Stage files by path; don't commit untracked files you didn't create.
- **Package files**: `packages/core` and `packages/plugin-heading-analyzer` ship copies of the root `LICENSE` and `NOTICE`, and `__tests__/package-files.spec.ts` requires them to stay byte-identical. A core test that reads files outside `packages/core` must list them in the `inputs` of `@tzuchi/tceditor#test` in `turbo.json`, or turbo replays stale cached results.
- **Formatting and lint**: Prettier 2 with default settings. `CHANGELOG.md`, `docs/superpowers/`, `infra/supabase/docker/` and `vendor/` are excluded (`.prettierignore`). ESLint uses `eslint-config-next`; don't add new warnings.
