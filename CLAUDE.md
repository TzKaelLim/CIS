# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

tceditor is Tzu Chi's visual page editor for React. It is a hard fork of [Puck](https://github.com/puckeditor/puck) v0.23.0 (git tag `v0.23.0`, commit `b4204f09`) under the MIT License (see `LICENSE` and `NOTICE`). This is a pnpm + Turborepo monorepo (Node >= 24, pnpm 10.26.1 pinned in `packageManager`):

- `packages/core` — the editor library, packaged as `@tzuchi/tceditor`. Nearly all editor work happens here.
- `packages/plugin-heading-analyzer` — `@tzuchi/tceditor-plugin-heading-analyzer`, built with tsup like core.
- `packages/spec` — `@tzuchi/tceditor-spec`: the tools for writing block specs in zod, the converters that turn a spec into Puck fields, Storybook argTypes, the MCP catalog, the database page-shell schema and data contracts, and the page validator. Plain TypeScript without React; its runtime imports are only `zod` and `@tzuchi/tceditor/rules`.
- `packages/blocks` — `@tzuchi/tceditor-blocks`: the 8 demo blocks and the page root (specs, views, editor and render configs, `styles.css`), the files generated from the specs, and the page validator bound to the 8 blocks, also built as the single file `dist/validator.edge.mjs`.
- `packages/tsconfig`, `packages/tsup-config`, `packages/eslint-config-custom` — shared build and lint configuration.
- `apps/demo` — Next.js App Router playground used for core development and the original e2e smoke test. It does not use the blocks.
- `apps/showcase` — `@tzuchi/tceditor-showcase`, the Next.js demo site for the blocks: an editor, a publish API and a server-rendered public page.
- `apps/storybook` — `@tzuchi/tceditor-storybook`, the block Storybook; its stories are generated from the specs.
- `vendor/uikit` — a snapshot of uikit's HeroUI styles and design tokens at a pinned commit (see "Vendored uikit").
- `scripts/` — the supply-chain gate (`audit-gate.mjs`, `audit-gate-lib.mjs`), the uikit sync (`uikit/`), the single-React test, the post-build checks (`check-edge.mjs`, `check-public-bundle.mjs`, `storybook-smoke.mjs`) and the puppeteer smoke tests (`e2e/`).
- `infra/supabase/` — self-hosted Supabase for local development (see "Supabase dev stack").
- `apps/docs` — Puck's upstream documentation site, kept only as reference. It is not part of the pnpm workspace, is never installed or built, and still uses the upstream package names.
- `docs/superpowers/specs/` — the tceditor roadmap and the design specs of its sub-projects; `docs/superpowers/plans/` holds their implementation plans.

All `@tzuchi/*` packages and apps are at version `0.1.0` and marked `private`: they are not published to any registry, and apps in this monorepo depend on them with `workspace:*`. `packages/spec` and `packages/blocks` ship TypeScript source (their `exports` point at `.ts` files) and have no build step, except the edge validator.

Public API names are deliberately unchanged from Puck: `<Puck>`, `<Render>`, `usePuck`, the `Config` type, CSS class names, `--puck-*` CSS variables and `data-puck-*` attributes. Puck's v0.23 documentation in `apps/docs` still describes most of the API; this file and `CHANGELOG.md` say where tceditor differs.

## Fork, branches and remotes

- `tzuchi/main` is the fork's main line, branched from `v0.23.0`. Work on it or on branches from it.
- `main` is an unmodified mirror of upstream Puck, kept for comparing with upstream. Never commit to it.
- The `upstream` remote points to Puck's GitHub repository for reference only; its push URL is `no_push`. Our own remote will be added as `origin` once the hosting platform is decided.
- There is no upstream sync. To take an upstream bug fix, run `git fetch upstream` and `git cherry-pick -x <sha>` onto `tzuchi/main` (if it conflicts badly, redo the change by hand and cite the source commit), then add a line to `CHANGELOG.md`.

## Commands

From the repo root:

```sh
pnpm install              # also builds core and the plugin through their `prepare` scripts
pnpm dev                  # runs only apps/demo on http://localhost:3000 (bound to 127.0.0.1); editor at /edit or any /<path>/edit
pnpm dev:showcase         # the showcase on http://127.0.0.1:3010: editor at /activity/edit, public page at /activity
pnpm storybook            # the block Storybook on http://127.0.0.1:6010
pnpm gen:blocks           # regenerate the stories and packages/blocks/generated/** from the specs; commit the result
pnpm sync:uikit -- --dir ../puck-tzuchi-poc --commit <sha>   # refresh vendor/uikit and generated/uikit-options.json
pnpm build                # turbo build: core, the plugin, the edge validator, the demo, the showcase and storybook-static
pnpm storybook:build      # only apps/storybook/storybook-static (pnpm build builds it too)
pnpm test                 # turbo test (the jest suites of core, spec, blocks and the showcase), then the node:test suites of the scripts
pnpm typecheck            # turbo typecheck: core's production sources, spec, blocks, the showcase and the Storybook
pnpm lint
pnpm format:check         # prettier over ts, tsx, mjs, md, mdx and css files; use `pnpm format` to fix
pnpm check:bundle         # after a build: fails if the main, RSC or rules entry can reach @tiptap/html or happy-dom, or the rules entry reaches React, Tiptap or a Node built-in (node:fs or fs)
pnpm check:edge           # after a build: checks packages/blocks/dist/validator.edge.mjs
pnpm check:public-bundle  # after a build: the showcase's public page ships no editor code, no image picker and no zod
pnpm storybook:smoke      # after a build: opens every story and docs page of storybook-static with puppeteer
pnpm audit:gate           # pnpm audit; fails only on advisories in versions that ship with core, the plugin, spec or blocks
pnpm verify               # the gate, see below
pnpm smoke                # puppeteer smoke tests; need the demo on :3000 and the showcase on :3010
```

`pnpm verify` runs `test`, `typecheck`, `lint`, `format:check`, `build`, `check:bundle`, `check:edge`, `check:public-bundle`, `storybook:smoke` and `audit:gate`, in that order. There is no CI yet, so it is the gate: work is not done until it passes. `audit:gate` needs network access. `pnpm smoke` is not part of it: it runs `scripts/e2e/smoke.mjs` (a drag-and-drop memory test on the demo that takes about 12 minutes and only prints how many runs passed) and then `scripts/e2e/showcase-smoke.mjs` (drags all 8 blocks into an empty page at `/activity/edit?blank=1`, publishes and checks the HTML of `/activity`; exits non-zero on failure and always puts the previously published page back; `SHOWCASE_URL` points it at a showcase that is not on `http://127.0.0.1:3010`).

Running a single test:

```sh
pnpm --filter @tzuchi/tceditor test lib/richtext/__tests__/normalize.spec.ts   # one jest file
pnpm --filter @tzuchi/tceditor test -t "name of test"                          # jest, by test name
pnpm --filter @tzuchi/tceditor-spec test src/validator/__tests__/validator.spec.ts
pnpm --filter @tzuchi/tceditor-blocks test src/__tests__/validator.spec.ts
node --test scripts/audit-gate-lib.test.mjs                                     # one node:test file
```

Core tests use Jest with ts-jest and jsdom. They are `*.spec.ts(x)` files inside `__tests__/` folders next to the code they cover; shared test helpers live in `__helpers__/`. Neither is checked by `pnpm typecheck`. Tests that need the real happy-dom start with `/** @jest-environment node */`. `packages/spec`, `packages/blocks` and `apps/showcase` use the same layout with Jest and ts-jest, in the node environment unless a test file sets another one, and their `typecheck` covers the tests too.

- `apps/demo/tsconfig.json` maps `@tzuchi/tceditor` to `packages/core/index.ts`, so the demo runs core from source and you don't need to build core while developing it.
- Everything else (spec, blocks, the showcase, the Storybook, their jest and tsc runs) uses core's built `dist` through `workspace:*`. turbo's `build`, `test` and `typecheck` depend on `^build`, so the root commands rebuild core first; after changing core, run `pnpm --filter @tzuchi/tceditor build` before running one package's jest or tsc directly.
- `pnpm-lock.yaml` is authoritative. Install with `pnpm install --frozen-lockfile`, and commit lockfile changes together with the `package.json` change that caused them.
- In a linked git worktree, run `export TURBO_CACHE_DIR="$PWD/.turbo/cache"` before turbo-backed commands (`test`, `lint`, `build`, `verify`); otherwise turbo writes its cache into the main checkout.

### Local servers

Every dev and preview server binds to `127.0.0.1`: the demo on 3000, the showcase on 3010, the block Storybook on 6010 and the static server of `storybook:smoke` on 6008. Don't use tciam's ports (3100, 3300, 5433, 6544, 8100, 8101, 9100) or the common development ports 5190–5191 and 6006–6007 (uikit's Storybook uses 6006 and 6007). Check a port with `lsof -nP -iTCP:<port> -sTCP:LISTEN` before starting a server, and stop only the processes you started, by their PID; never use `pkill`, `killall` or matching by name.

The Storybook CLI writes `~/.storybook/settings.json`, so the `dev` and `build` scripts of `apps/storybook` run it through `apps/storybook/scripts/storybook.mjs`, which sets `HOME` to `apps/storybook/.home` (gitignored) and `STORYBOOK_DISABLE_TELEMETRY=1` for the CLI only and refuses to start when port 6010 is taken. Run Storybook only through those scripts (`pnpm storybook`, `pnpm storybook:build`, `pnpm build`). puppeteer, in contrast, needs the real `HOME` to find Chrome in `~/.cache/puppeteer`, so `storybook:smoke` and `pnpm smoke` run without the wrapper.

## Core architecture (`packages/core`)

### Entry points

`bundle/` defines the published entry points, and `package.json` `exports` maps them:

- `bundle/core.ts` is the **public API surface** (`@tzuchi/tceditor`). Anything exported here is public API, and changes to it get extra review.
- `bundle/index.ts` is core plus `index.css`. The built `dist/index.css` is the only stylesheet export, `@tzuchi/tceditor/tceditor.css`. By default the editor injects its CSS at runtime, so importing the stylesheet is optional.
- `bundle/rsc.tsx` is served under the `react-server` export condition and as `@tzuchi/tceditor/rsc`. It exposes `Render` from `components/ServerRender`, the data helpers and the richtext renderer. Code it reaches must not import client-only code (zustand store, context, effects).
- `bundle/internal.ts` (`@tzuchi/tceditor/internal`) exposes internals such as `createReducer`.
- `bundle/richtext-migrate.ts` (`@tzuchi/tceditor/richtext-migrate`) is the server-only converter from legacy HTML richtext to JSON. It is the only entry allowed to reach `@tiptap/html` and `happy-dom`. Its CJS build needs Node >= 22.12 (`require(esm)`); on Node 20 use the ESM build.
- `bundle/rules.ts` (`@tzuchi/tceditor/rules`) holds the React-free rules that validators and server code share with the editor. It exports `normalizeRichText`, `RICHTEXT_MAX_DEPTH`, `isSafeHref`, `textToRichText`, `fitRichTextToTypes`, the richtext feature helpers (`RICHTEXT_FEATURES`, `isRichTextFeature`, `richTextFeaturesToOptions`, `richTextFeaturesToTypes`), `stableStringify` and `isComponentAllowed`, and the types `RichTextDoc`, `RichTextNode`, `RichTextMark`, `RichTextTypes`, `RichTextFeature`, `RichTextFeatureOptions` and `ComponentAllowRules`. It is built by a second tsup run with its own config, `tsup.rules.config.ts`, because the shared config in `packages/tsup-config` injects `import React from "react"` into every output file. It imports each module by path, never `lib/richtext/index.ts` (which also exports the React renderer), and `pnpm check:bundle` fails if `dist/rules.*` mention `react`, `react-dom` or `@tiptap/`, or import a Node built-in module, with or without the `node:` prefix (`node:fs`, `fs`, `crypto`; the list is `builtinModules` of the Node that runs the check). `packages/spec`, the edge validator and, later, the backend (S3) and the MCP server (S4) use it.

Importing the package must have no side effects, so it can run in edge runtimes. For example, the fallback store in `store/index.ts` is created lazily so `crypto.randomUUID` isn't called at import time. `__tests__/edge-runtime.spec.ts` enforces this.

### State: one zustand store per `<Puck>`

`store/index.ts` `createAppStore` builds the store. `components/Puck` creates one and provides it through `appStoreContext`. The store is composed of slices in `store/slices/`: `history`, `nodes`, `permissions` and `fields`. Components read from it with `useAppStore(selector)` or `useAppStoreApi()`. The public `usePuck` / `useGetPuck` / `createUsePuck` API (`lib/use-puck.ts`) is a separate store synced from the app store.

- `state` is a `PrivateAppState`: the public `AppState` (`{ data, ui }`) plus `indexes: { nodes, zones }`. `nodes` is keyed by component id and holds the data, flat data, `parentId`, `zone` and path. `zones` is keyed by the compound id `"<parentId>:<zoneName>"`, and the root content zone is `"root:default-zone"`. Both indexes are null-prototype objects. `lib/data/make-state-public.ts` strips the indexes before state reaches user callbacks such as `onAction`, `onChange` and `usePuck`.
- All data mutations go through `dispatch(action)` → `reducer/index.ts` `createReducer`, which delegates to `reducer/actions/*`. Actions rebuild the indexes with `lib/data/walk-app-state.ts`, so new actions should do the same rather than editing `data` by hand. History is recorded for every action except `registerZone`, `unregisterZone`, `setData`, `setUi` and `set`, unless the action passes `recordHistory`.

### Data model: slots vs. legacy DropZones

`Data` is `{ root, content, zones }`. Nesting is done with **slot fields** (`type: "slot"`), which store child content inline in props. `<DropZone>` together with the top-level `zones` map is deprecated but still supported. Tree utilities in `lib/data/`, such as `walkTree`, `walkAppState`, `mapFields` and `forRelatedZones`, handle both forms. `lib/migrate.ts` converts the legacy format to slots. The page validator of `packages/spec` accepts only slots (`zones` must be absent or empty).

### Props pipeline: field transforms

A component's stored props are turned into the props its `render` receives by `lib/data/map-fields.ts`, driven by `FieldTransforms` (a map from field type to transform function, `types/API/FieldTransforms.ts`). `lib/field-transforms/use-field-transforms.tsx` and `use-field-transforms-tracked.tsx` apply them through `build-mappers.ts`; the built-in transforms are in `lib/field-transforms/default-transforms/` (slot, inline text, richtext).

- Editor: `components/DropZone` combines the built-in slot, inline text and richtext transforms, then each plugin's `fieldTransforms`, then the user's `fieldTransforms` prop, in that order, and applies them with `useFieldTransformsTracked`. The root (`components/Puck/components/Preview/components/editor-page.tsx`) applies only the slot transform and then `useRichtextProps`.
- Render: `lib/use-slots.tsx` applies only the slot transform. It is used by `components/Render` (client), `components/ServerRender` (RSC) and `components/SlotRender/server.tsx`, which then pass richtext fields through `useRichtextProps` (`components/RichTextEditor/lib/use-richtext-props.tsx`). This path must stay RSC-safe. Both look up slot and richtext fields in the component config's `fields`, so a render-only config still needs them.
- A richtext field is edited on the canvas only when it sets `contentEditable: true`; the default is `false`, as Puck's documentation says.

Async `resolveData` / `resolveFields` / `resolvePermissions` on component configs run through `lib/resolve-component-data.ts`, the store's `resolveComponentData`, and `lib/resolve-all-data.ts` for server-side use.

### Richtext: Tiptap JSON and one shared renderer

Richtext field values are stored as Tiptap JSON (`RichTextDoc`, `editor.getJSON()`), never as HTML. `lib/richtext/` is the single implementation. The main and RSC entries export its types, `normalizeRichText`, `RICHTEXT_MAX_DEPTH`, `isSafeHref`, `textToRichText` and `renderRichText` (through `lib/richtext/index.ts`). The rules entry exports every module below except `render.tsx`, and `fit-to-types.ts`, `features.ts` and `stable-stringify.ts` are only there, so server code imports from `@tzuchi/tceditor/rules` and never pulls React in. `html-to-json.ts` and `migrate-data.ts` are only in the `richtext-migrate` entry (see below).

- `normalize.ts` — `normalizeRichText(value)` reduces any input (editor JSON, tampered JSON, legacy HTML strings) to the default PuckRichText schema: nodes `doc`, `paragraph`, `heading` (1–6), `bulletList`, `orderedList`, `listItem`, `blockquote`, `codeBlock`, `horizontalRule`, `hardBreak`, `text`; marks `link`, `bold`, `italic`, `underline`, `strike`, `code`. Unknown nodes and marks keep only their text (the texts of separate blocks are joined with a line break), every attribute is validated (`textAlign` must be `left`, `center`, `right` or `justify`; link `class` is always `null`), and nodes deeper than `RICHTEXT_MAX_DEPTH` (100) become text; `options.maxDepth` can only lower that limit (invalid values fall back to it, and `options` may be `null`). A string is always one plain-text paragraph; HTML is never parsed at render time.
- `is-safe-href.ts` — `isSafeHref(href)` allows only `http:`, `https:`, `mailto:`, `tel:` and relative URLs. The renderer, the editor's Link extension (`isAllowedUri` in `components/RichTextEditor/extension.ts`), the converter and the `link()` spec helper all use it.
- `render.tsx` — `renderRichText(value)` normalizes, then renders with `@tiptap/static-renderer` (`json/react`) through null-prototype `nodeMapping` and `markMapping`. `components/RichTextEditor/components/RichTextContent.tsx` wraps it without hooks, so it works in RSC.
- `text-to-richtext.ts` — `textToRichText(text)` builds a one-paragraph document.
- `fit-to-types.ts` — `fitRichTextToTypes(doc, types)` keeps only the allowed node and mark types without losing text: content of a disallowed block moves into the allowed blocks or into `types.textblock`, disallowed marks are dropped, and `textAlign: false` removes the alignment. Its output keeps the structure Tiptap's schema requires (tests run the schema's `check()`): a blockquote, list or list item with nothing left in it is dropped, a list item whose first block is not a paragraph gets an empty one, and lists need the paragraph type; only the document itself can end up empty (the editor fills it). It is a pure function without React or Tiptap, and `fitNode` has a branch per node type.
- `features.ts` — `RICHTEXT_FEATURES` and the mappings from a spec's feature list to the editor's `options` (`richTextFeaturesToOptions`) and to the allowed types (`richTextFeaturesToTypes`); tests check them against the schema Tiptap builds from the same options.
- `stable-stringify.ts` — `stableStringify(value)`, JSON with sorted keys, used to compare documents.

The editor (`components/RichTextEditor`) lazy-loads Tiptap. Before it loads, `EditorFallback` shows the same `renderRichText` output, so the canvas, the preview and the published page always match. `components/RichTextEditor/lib/use-synced-editor.ts` stores `editor.getJSON()` and fits the content to the field editor's schema with `components/RichTextEditor/lib/fit-to-schema.ts`, which calls `fitRichTextToTypes` with the schema's type lists and its default text block (`defaultTextblock`: the paragraph, else ProseMirror's `defaultBlockAt`), so the editor and the page validator filter with the same code. `lib/richtext/html-to-json.ts` (`richTextHtmlToJson`) and `migrate-data.ts` (`migrateRichTextInData(data, config, options?)`) convert legacy HTML on the server through the `richtext-migrate` entry; `options.getFields` (synchronous) supplies fields that only `resolveFields` adds.

All `@tiptap/*` packages are pinned to the same exact version (3.31.4); `@tiptap/static-renderer` must always equal the `@tiptap/core` version in the lockfile, so upgrade them together. Core's tsconfig uses `"moduleResolution": "node"`, so subpath exports such as `@tiptap/static-renderer/json/react` and `@tiptap/html/server` need `paths` entries (without a file extension) in `packages/core/tsconfig.json`, and in `apps/demo/tsconfig.json` when the demo reaches them.

### Editor UI composition

`components/Puck` assembles the layout from `components/Puck/components/*`. The left-hand panels (`plugins/blocks`, `plugins/fields`, `plugins/outline`, `plugins/legacy-side-bar`) are themselves plugins. Users customize the UI through `overrides` (`types/API/Overrides.ts`, merged in `lib/load-overrides.ts`) and through plugins, which can contribute overrides, panels and field transforms.

The preview renders inside an iframe (`components/AutoFrame`). The editor's own CSS is injected at runtime by `lib/use-inject-css.ts` from `lib/generated/runtime-css.ts`. That file is an empty stub in source and tests, and `packages/core/tsup.config.ts` replaces it at build time with the bundled CSS strings. Drag-and-drop uses `@dnd-kit` pinned to exact `0.4.0` versions, with custom collision and drop logic in `lib/dnd/`.

### UI strings

Every user-visible string in the editor is a key in `lib/dictionary.ts` (`defaultDictionary`, keys such as `header-publish` or `action-duplicate`). Components must read strings with `useMessage(key, params)` so the `dictionary` prop can override them. Don't hard-code UI text.

## Blocks and specs (`packages/spec`, `packages/blocks`)

Each block has exactly one spec, written in zod 4.6.5; the editor fields, the Storybook stories, the MCP catalog and the page validator are derived from it. The converters read only the JSON Schema that zod emits (2020-12, `io: "input"`) plus the `x-*` meta keys. Design spec: `docs/superpowers/specs/2026-10-12-s2-block-spec-design.md` (its §18 corrections override the earlier text). `packages/spec/README.md` documents the helpers, the converters and the issue codes; `packages/blocks/README.md` documents the blocks.

```
packages/blocks/src/<block>/
  spec.ts               the spec; no react, react-dom, @heroui/* or core main-entry imports
  view.tsx              the view: a server component that receives only the spec's fields
  editor.tsx            optional editor-only UI (today only image/editor.tsx, the image picker)
  <Block>.stories.tsx   generated by `pnpm gen:blocks`; never edit by hand
```

- `src/specs.ts` registers the 8 blocks (`Heading`, `Paragraph`, `Button`, `Card`, `TagList`, `Section`, `Columns`, `Image`) in `blockSpecs`, plus `pageRootSpec` (`src/root/`), `BlockType` and the editor `CATEGORIES` (文字, 互動, 內容, 版面; deprecated blocks go to a hidden category).
- `src/render-config.tsx` `buildRenderConfig({ blocks, views, assets })` builds the server-safe Puck config from the specs alone: each block gets its `label`, its `fields` (from `toPuckFields`; `Render` needs them to find slots and richtext) and a `render` that passes only the spec's fields to the block's view (never Puck's whole props, which contain functions), turning slots into `<Slot />`, richtext into React and images into a `ResolvedImage` with `assets.get`. `src/views.ts` maps every block type to its view; TypeScript fails while a block in `blockSpecs` has no view or a view's props don't match its spec. `createRenderConfig({ assets })` is `buildRenderConfig` over `blockSpecs` and `views`, for the public page and the stories. `src/editor-config.tsx` (`'use client'`) `createEditorConfig({ assets })` adds `fields` with the image picker, `defaultProps` (`toDefaultProps`), the categories (`editorCategories`) and the root fields. Create each config once and reuse it.
- `AssetSource` (`src/asset-source.ts`): `list()` is async and `get(id)` synchronous, because the public page looks images up while rendering. The showcase and the Storybook use the 6 images of `src/demo-assets.ts`; S3's media library will implement the same interface.
- `styles.css` is the only stylesheet apps import: the tokens, then `@heroui/styles` (itself the Tailwind entry, so never import `tailwindcss` again), then the Tzu Chi theme and `src/blocks.css`. The theme is `data-theme="tzuchi"` on `<html>`.

To add a block:

1. Write `src/<block>/spec.ts` with `defineBlockSpec({ type, label, category, description, version: 1, props, examples })`, using one of the `CATEGORIES` titles as `category`, and `src/<block>/view.tsx`.
2. Add the spec to `blockSpecs` in `src/specs.ts` and the view to `views` in `src/views.ts`, one line each. `buildRenderConfig`, `createEditorConfig`, the categories and the tests of `packages/blocks` follow `blockSpecs` by themselves.
3. If the spec uses `style()`, give each uikit option you leave out a reason in `src/style-decisions.ts`; a new `token()` value needs its `tcb-*` class in `src/blocks.css`.
4. Run `pnpm gen:blocks` and commit the stories and the `generated/` files. The `generated.spec.ts` test of `packages/blocks` fails when they are stale, and other tests run every example through the validator.
5. The editor field snapshot `src/__tests__/__snapshots__/editor-fields.spec.ts.snap` records the `fields` and `defaultProps` of every block. The blocks tests run with `jest --ci`, which never writes a snapshot: a new block fails the test until its snapshot is written, and a changed field until you have checked the diff, both with `pnpm --filter @tzuchi/tceditor-blocks test -u src/__tests__/editor-fields.spec.ts`. Commit the `.snap` file too.

### Spec rules

`checkSpecRules` (`packages/spec/src/spec-rules.ts`), the tests and ESLint enforce these, and `createPageValidator` throws on specs that break them.

- `type` matches `^[A-Z][A-Za-z0-9]{0,26}$` (editor ids are `<type>-<uuid>` and at most 64 characters) and is not `Root`. `label`, `category` and `description` (at most 4,096 characters) are Chinese, `version` starts at 1, and there is at least one example; every example must pass the validator.
- `props` and every nested object are `z.strictObject`. Arrays hold strict objects only, because Puck's array field can't hold strings: tags are `[{ label: "志工" }]`. Every list has a `.max(n)` (rule `object-arrays`): the page validator checks a list only up to one item past its maximum, so its work is bounded by the limits, not by the length of the page's list fields (richtext documents are bounded by the 2 MB page limit). Each field has a single JSON type: `.nullable()`, unions and string formats such as `z.email()` are rejected.
- `.meta()` comes last in the chain, once per schema, with only `title`, `description`, `examples`, `deprecated` and the `x-*` keys that specs write, and JSON values. Never give the root object a meta `id` (it becomes a `$ref`). `checkSpecRules` rejects any other key in the emitted JSON Schema (`GlobalMeta` has an index signature, so a misspelled key compiles), a `.meta()` that adds or overrides a JSON Schema keyword such as `type` or `additionalProperties`, and the helper-only `x-*` keys unless their helper wrote them (`GlobalMeta` types those as `never`).
- Every field has a Chinese `title`. Field names match `^[A-Za-z][A-Za-z0-9_-]{0,63}$` and are not `id`, `puck`, `editMode`, `children` or an `Object.prototype` member such as `constructor` or `toString` (a missing prop would read the inherited function). Specs never declare `id`; the validator checks `props.id` separately.
- A slot field name means the same structure in every block (`content` is always a slot, `columns` always a list of `{ content }` slots), because the page-shell schema finds slots by name.
- `spec.ts` never calls `.refine`, `.superRefine`, `.overwrite`, `.transform`, `.trim`, `.check`, `.pipe`, `z.preprocess`, `.catch`, `.toLowerCase`, `.toUpperCase` or `.normalize`, which JSON Schema can't express or which change values silently, and calls nothing after `.meta()` (ESLint). Such logic goes into a `packages/spec` helper that lists it in `x-lost-checks`.
- Object and array defaults are functions (`.default(() => [...])`), because zod's `.default()` neither validates nor copies deeply. The required `link()` and `image()` use `.prefault()`, so their deliberately incomplete defaults fail validation until the editor fills them in.
- Stored values are token names for shared design concepts (`"32"`) and uikit values for component styles (`"primary"`); Chinese names live only in `x-labels`.

### Field kinds and helpers

There are 11 field kinds: short text (`z.string()`, `"x-inline": true` to edit it on the canvas), long text (`"x-field": "textarea"`), number (`z.number().int().min().max()`), choice (`choice()`, `style()` or `token()`; `radio` up to 4 options, else `select`), yes/no (`z.boolean()`, a 是／否 `radio`, because the fork has no checkbox field), link (`link()` or `link({ optional: true })`), richtext (`richText({ features })`), list (`z.array(z.strictObject({...}))` with `x-item-label`), group (`z.strictObject({...})`), slot (`slot({ allow })` or `slot({ disallow })`) and image (`image()`, a `custom` field filled by the editor's image picker). `packages/spec/README.md` has the full table.

- `link()`: at most 2,048 characters and `isSafeHref`; the optional form uses `""` for no link.
- `richText({ features })`: features come from `RICHTEXT_FEATURES`; `doc`, `paragraph` and `text` are always allowed and text alignment never is. The value is normalized and then filtered to the features. A string is rejected: convert legacy HTML with `@tzuchi/tceditor/richtext-migrate` first.
- `image()`: `{ assetId, alt, decorative }`; `alt` is required unless `decorative`. Only the format of `assetId` is checked, not whether the asset exists.
- `style(component, key, values)` values must exist in `packages/blocks/generated/uikit-options.json`. `token(group, values)` values are `@tzuchi/tokens` names (`token("space", ["16", "32"])` means `--tc-space-16` and `--tc-space-32`) that views turn into `tcb-*` classes with `tokenClass()`.
- Of the `x-*` keys (`X_KEYS` in `packages/spec/src/meta.ts`), specs write `x-labels` (`{ value: "中文" }`), `x-inline`, `x-field` and `x-item-label` (a template: `{<field>}` inserts that field of the item, `{n}` its 1-based index). The helpers write `x-style`, `x-token`, `x-slot`, `x-richtext`, `x-image`, `x-link` and `x-lost-checks` (`safe-href`, `alt-required`, `richtext-normalize`: checks that only the zod validator runs).

### Versions

- Compatible changes raise `version` by 1: a new field with a default, a looser limit, a new option, a new type in `allow`. Labels, descriptions, examples and the order of options need no new version.
- Incompatible changes are forbidden: removing or renaming a field or option, changing a type, tightening a limit, a new required field without a default, removing a type from `allow`. Add a new block type instead (for example `ButtonV2`) and set `deprecated: true` on the old one, which then leaves the editor menu but still renders and edits.
- `generated/schemas/<Type>.v<version>.json` keeps the data contract of every version. `pnpm gen:blocks` writes a snapshot only for a new version and writes nothing at all when a contract changed without a new version or when two versions differ incompatibly (`diffContracts`); the tests fail in the same cases. Page data has no version number.

### Page validator

`createPageValidator({ blocks, root, limits? })` comes from `@tzuchi/tceditor-spec/validator`; `@tzuchi/tceditor-blocks/validator` exports `validatePage`, `validatePageJson` and `blockTypes` bound to the 8 blocks.

- Limits (`DEFAULT_LIMITS`): 2,097,152 bytes of UTF-8, measured before `JSON.parse`; 32 levels (a top-level block is level 1, a block in a slot of a level-n block is level n+1); 5,000 blocks; 100 reported issues. Ids match `NODE_ID_PATTERN` (`^[A-Za-z0-9_-]{1,64}$`), are not `root` and are unique. Only `validatePageJson` measures the size, so code that receives a request body must use it.
- Nothing in the validator recurses on the depth of the page, because 2 MB of JSON holds about 40,000 levels: it walks the blocks with an explicit stack, does not enter a block past level 32 and never copies the whole page (no `structuredClone`). The test `stops at level 33 of a 30,000-level page without overflowing the stack` in `packages/spec/src/validator/__tests__/validator.spec.ts` fails otherwise.
- It checks in the order of the design spec §6.2 and collects every issue: legacy `zones`, unknown keys, types and props (own keys only, so `__proto__` and `constructor` fail), invalid values, unsafe links, missing alt text and children a slot doesn't allow. It returns `{ ok: false, errors }`, or `{ ok: true, data, notices }` where `data` has the defaults filled in (the public `<Render>` doesn't fill them), `readOnly` and empty `zones` removed, and richtext cleaned. Cleaning richtext is the only repair; a field whose content changed adds a `richtext_cleaned` notice. The comparison ignores `null` attributes and empty `attrs`, `content` and `marks`, so the editor's own output and `textToRichText` never produce one.
- An issue is `{ path, pathText, blockType?, code, message }`. `code` and `path` are the stable part; `ISSUE_CODES` are `too_large`, `invalid_json`, `invalid_shape`, `legacy_zones`, `unknown_type`, `invalid_id`, `duplicate_id`, `too_deep`, `too_many_blocks`, `unknown_prop`, `invalid_value`, `unsafe_href`, `alt_required`, `not_allowed_here` and `richtext_cleaned`. `message` is Chinese and names the block label, the field titles and the allowed values, for example 「按鈕的『連結網址』只接受 http、https、mailto、tel 或站內路徑。」. The messages are passed per call; never change zod's global configuration.
- Paths point at the offending place: `<node>.type` for `unknown_type`, the child node itself for `not_allowed_here`, `<node>.props.id` for `invalid_id` and `duplicate_id` (the second occurrence), `zones` for `legacy_zones`, and the richtext field itself for problems inside a richtext document. Each path reports at most one issue, so an image field left at its default reports two: `<field>.assetId` (`invalid_value`) and `<field>.alt` (`alt_required`).

### Hand-offs to S3 and S4

- `packages/blocks/dist/validator.edge.mjs`, built by `pnpm build`: one ESM file with zod, the rules entry and the 8 specs. `pnpm check:edge` requires that it imports nothing (in particular no `node:` module), never mentions `react` or `@tiptap`, is at most 60 KB gzipped and gives the same results as the source on `src/__fixtures__/validator-cases.json`.
- `packages/blocks/generated/page-shell.draft07.json`: a structural draft-07 schema for pg_jsonschema, without `oneOf`, `anyOf`, `allOf` or per-block props. S3 must make the column `NOT NULL` (pg_jsonschema passes a `NULL`), add tightened checks as `NOT VALID` and validate existing rows separately, and test it on Postgres only in a memory-limited throwaway container.
- `packages/blocks/generated/catalog.json`: the MCP catalog (`catalogVersion` 1, `nodeIdPattern`, `limits`, and per block the props schema, the expanded slot types and the examples, plus the root props). Its `required` lists also name the required `link()` and `image()` fields, whose defaults deliberately fail validation.
- The `AssetSource` interface for the media library, and the limits, which the API layer enforces before the database.

## Vendored uikit (`vendor/uikit`)

- `vendor/uikit` holds `heroui/styles`, `heroui/LICENSE`, `heroui/NOTICE.md` and `packages/tokens` (with its built `dist/`, kept by a `.gitignore` negation) from uikit's `spike/heroui-v3` branch. `vendor/uikit/SOURCE.json` records the repository, the commit, the sha256 of every file and the files the sync removed; tests compare the hashes. `heroui/react` is not vendored: the blocks draw plain HTML with `@heroui/styles`.
- Never edit it by hand. `pnpm sync:uikit -- --dir <uikit checkout> --commit <sha>` (`--dir` defaults to `../puck-tzuchi-poc`; optionally `--branch`, default `spike/heroui-v3`) refreshes it with `git archive` (read-only), removes the files listed in `REMOVE_RULES` of `scripts/uikit/sync-uikit.mjs`, rebuilds the tokens with style-dictionary 4.4.0 and regenerates `packages/blocks/generated/uikit-options.json`. `vendor/uikit/README.md` explains the snapshot.
- HeroUI is licensed under Apache-2.0 (`vendor/uikit/heroui/LICENSE` and `NOTICE.md`), not under the root MIT license. Keep both files and list local modifications in `SOURCE.json` (Apache-2.0 §4).
- `packages/blocks` depends on `@heroui/styles` and `@tzuchi/tokens` with `link:` to these folders; their bare imports resolve through the root `node_modules` (`shamefullyHoist`). Prettier and ESLint skip `vendor/`.
- Before S3 deploys anything, the snapshot is replaced by the uikit packages from the GitLab Package Registry.

## Security rules

These rules come from the adoption audit of Puck v0.23.0, the S1 fixes and the S2 block design. Follow them in every change.

- **Never add `dangerouslySetInnerHTML`.** The only remaining use is Puck's `InsertPreview` in `components/DropZone/index.tsx`, which copies the `outerHTML` of an element the editor already rendered; don't copy that pattern. `__tests__/richtext-no-inner-html.spec.ts` keeps it out of the richtext sources.
- **Richtext is stored only as Tiptap JSON and displayed only through the shared renderer** (`renderRichText` / `RichTextContent`). Don't render richtext with `generateHTML`, `editor.getHTML()` or by parsing HTML, and don't store HTML. Convert legacy HTML on the server with `@tzuchi/tceditor/richtext-migrate`.
- **A new Tiptap extension that adds a node, a mark or an attribute must land together with its renderer mapping and attribute validation:** the extension in `components/RichTextEditor/extension.ts`, the allowed types, structure rules and attribute checks in `lib/richtext/normalize.ts`, the `nodeMapping` / `markMapping` entry in `lib/richtext/render.tsx`, a branch in `fitNode` in `lib/richtext/fit-to-types.ts` for a new node (without one, a block node is unwrapped and an inline node is reduced to its text, so the editor and the page validator remove it), the new content in `typicalContent` of `lib/richtext/__helpers__/fixtures.ts` (the consistency test in `lib/richtext/__tests__/features.spec.ts` fits those documents for every feature set and checks the result with Tiptap's schema), and tests (consistency with Tiptap's output in `lib/richtext/__tests__/render.spec.tsx`, malicious attributes in `xss.spec.tsx`). A new richtext feature for specs also needs its entry in `lib/richtext/features.ts`. Until then the renderer shows such content as plain text and the editor drops it when the content is reopened (it warns in development).
- **`isSafeHref` is the only rule for link hrefs.** Change it, never a copy of it, so the renderer, the editor, the converter and the page validator stay in agreement.
- **In new code, look up component configs with `lookupComponentConfig(config, type)`** (`lib/lookup-component-config.ts`), never `config.components[type]`: data can contain types such as `constructor` or `__proto__`. The few direct reads left in the editor UI only fetch a component's `label` and predate this rule. For other user-supplied objects keyed by data, such as `propTransforms` or `migrateDynamicZonesForComponent`, check `Object.prototype.hasOwnProperty.call(obj, key)` first. Core's TypeScript lib does not include `Object.hasOwn` (TS2550), so don't use it; the new packages don't use it either.
- **Objects keyed by user data** (component ids, zone compounds, prop names, block types): create lookup tables and accumulators with `Object.create(null)`, and build merged objects with `Object.fromEntries`. Don't spread an accumulator inside `reduce` or assign `acc[key] = value` on a plain object: it is O(n²) and a `__proto__` key replaces the prototype. The null-prototype indexes have no `hasOwnProperty` method, so use `in`, `Object.keys` or `Object.prototype.hasOwnProperty.call`.
- **Every `<style>` (or `<link>`) injected at runtime carries the CSP nonce, set before the element is attached.** The nonce comes from `<Puck nonce>` via `AppStore.nonce`; use `applyNonce(el, nonce)` from `lib/use-inject-css.ts`, and pass it to third-party injectors (dnd-kit's `StyleInjector.configure({ nonce })`, Tiptap's `injectNonce`). Host styles mirrored into the preview iframe keep only a nonce they already carry; never stamp the trusted nonce onto them.
- **No third-party requests from the library, the demo, the showcase or the block Storybook:** no external fonts, remote `url()` or `@import` in CSS (`__tests__/css-imports.spec.ts`), analytics or CDN scripts. The Storybook config disables telemetry, what's-new requests, version checks and crash reports, and the app scripts set `NEXT_TELEMETRY_DISABLED=1` and `STORYBOOK_DISABLE_TELEMETRY=1`.
- **Dev and preview servers bind to `127.0.0.1`** (see "Local servers"), because the apps have no authentication and the demo's `next` version has unpatched critical advisories. Don't expose them on the network.
- **The page validator is the only gatekeeper for page data.** Every write (the showcase's publish API today, S3's save API and S4's MCP tools later) runs `validatePageJson` / `validatePage` from `@tzuchi/tceditor-blocks/validator` (or `dist/validator.edge.mjs`) and stores only the `data` it returns. Limits in the editor can be bypassed, and JSON Schema validators (Ajv, pg_jsonschema, the MCP SDK) accept `javascript:` links and can't clean richtext.
- **Public pages never load the editor.** `apps/showcase/app/(public)/**`, `packages/blocks/src/**/view.tsx`, `packages/blocks/src/views.ts` and `packages/blocks/src/render-config.tsx` may import from core only `@tzuchi/tceditor/rsc` and `@tzuchi/tceditor/rules` (`import type` from the main entry is fine) and never the blocks' editor config. ESLint enforces it, and `pnpm check:public-bundle` scans the browser chunks of the built `/activity` page for the editor-only string `header-toggle-leftsidebar`, the image picker's class `tcb-picker-option` and zod's `__zod_globalConfig`, with `/activity/edit` as the control that must contain all three.
- **Block views are server components** without `'use client'`: they render plain HTML with the `@heroui/styles` tv functions and `tokenClass()`. A file that imports `@heroui/react` must start with `'use client'` (ESLint).
- **No inline styles in blocks**, so public pages can use a strict CSP: token values map to `tcb-*` classes, and richtext fields never allow text alignment (the validator strips `textAlign`). Block CSS colours use HeroUI theme variables (`var(--surface)`) or base colour tokens (`--tc-color-blue-900`), never the semantic `--tc-color-*` tokens, which flip in the operating system's dark mode.
- **zod:** always `import * as z from "zod"` (ESLint). `import { z }` and the default import make esbuild bundle every locale and push the edge validator past 60 KB. Never import `zod/v4/locales/*` and never call `z.config`: the zod copies share that configuration through `globalThis`.
- **The showcase's publish API** accepts only same-origin requests (`Origin` must equal `http://` + `Host`, and the `Host` name must be `127.0.0.1` or `localhost`, which stops DNS rebinding) with `Content-Type: application/json`, stops reading the body after 2 MB (413), answers 422 with `{ errors }` and its other refusals with `{ error, message }`, and writes `apps/showcase/.data/activity.json` (or `$SHOWCASE_DATA_DIR/activity.json`) through a temporary file and a rename. Keep these properties when S3 replaces it.
- **Dependencies:** `onlyBuiltDependencies` in `pnpm-workspace.yaml` allowlists dependency lifecycle scripts, `ignoredBuiltDependencies` lists the ones we skip, and `overrides` pins vulnerable transitive dependencies and zod (`"zod@^4": "4.6.5"`; unscoped, it would also replace the zod 3 of puppeteer's chromium-bidi). Keep these lists minimal and comment every entry (with its GHSA id for security overrides). New dependencies use exact versions, and the lockfile has a single `react` and `react-dom` (`scripts/single-react.test.mjs`). `audit:gate` treats the runtime dependencies of core, the plugin, spec and blocks as shipped (`GATED_IMPORTERS` in `scripts/audit-gate-lib.mjs`). When core or plugin production code starts importing a devDependency, tsup bundles it into `dist`, so add it to `BUNDLED_DEV_DEPENDENCIES` in `scripts/audit-gate-lib.mjs` and to the test that asserts that constant. `@tiptap/html` and `happy-dom` may only be imported from the `richtext-migrate` code.
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

- **CSS**: use CSS Modules with [SUIT CSS](https://suitcss.github.io) naming, applied through `getClassNameFactory("ComponentName", styles)` (`lib/get-class-name-factory.ts`). Calling it with a string gives a descendant class (`ComponentName-child`) and with an object gives modifiers (`ComponentName--modifier`). Never rely on global styles, because tceditor is embedded in pages whose CSS is out of our control. The blocks are the exception: they are styled by the HeroUI classes and the `tcb-*` classes of `packages/blocks/src/blocks.css` on pages that load `@tzuchi/tceditor-blocks/styles.css`.
- **TypeScript**: avoid `any`.
- **Commits**: use Angular-style conventional commits in English (`feat:`, `fix:`, `docs:`, `build:`, …). Record every user-visible change as a line in `CHANGELOG.md`, in the `### Changes from Puck v0.23.0` list under `## tceditor 0.1.0 (unreleased)`; everything below that is Puck's history and stays unchanged. Stage files by path; don't commit untracked files you didn't create.
- **Package files**: `packages/core` and `packages/plugin-heading-analyzer` ship copies of the root `LICENSE` and `NOTICE`, and `__tests__/package-files.spec.ts` requires them to stay byte-identical. A task that reads files outside its package (a test, or the build and typecheck of an app that uses the blocks' source) must list them in the `inputs` of its `<package>#<task>` entry in `turbo.json` (`@tzuchi/tceditor#test`, `@tzuchi/tceditor-blocks#test`, `@tzuchi/tceditor-showcase#build`, `#test` and `#typecheck`, `@tzuchi/tceditor-storybook#build`), or turbo replays stale cached results. Such an entry replaces the generic task instead of extending it, so it must repeat `"dependsOn": ["^build"]` (only core's, which depends on no built package, leaves it out) and, for `build`, the `outputs`. The showcase's `#build` also depends on its own `typecheck`, because `next build` empties `.next` while `next typegen` writes `.next/types`. List inputs such as `packages/blocks/src/**` rather than `packages/blocks/**`: an explicit input glob ignores `.gitignore`, so it would hash `node_modules` and `dist` too.
- **Formatting and lint**: Prettier 2 with default settings. `CHANGELOG.md`, `docs/superpowers/`, `infra/supabase/docker/`, `vendor/` and `storybook-static/` are excluded (`.prettierignore`). ESLint uses `eslint-config-next`; the root `eslint.config.mjs` adds the S2 rules (the zod import style, `packages/spec` importing only `zod` and `@tzuchi/tceditor/rules` at run time, the `spec.ts` restrictions, no editor code in public pages and views, `'use client'` for `@heroui/react`) and ignores `apps/showcase/.next/**` (`eslint-config-next` ignores `.next/**` only next to the config file). Don't add new warnings.
