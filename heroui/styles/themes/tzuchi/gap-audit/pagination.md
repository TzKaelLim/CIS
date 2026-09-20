# Pagination — Tzu Chi vs HeroUI gap inventory

- **Tzu Chi source**: `packages/components/src/pagination/tc-pagination.styles.ts` (+ `tc-pagination.ts` for structure), tokens `packages/tokens/src/component/pagination.tokens.json`, resolved in `packages/tokens/dist/tokens.css`.
- **HeroUI source**: `heroui/styles/components/pagination.css`, `heroui/styles/src/components/pagination/pagination.styles.ts`, `heroui/react/src/components/pagination/pagination.tsx`, `heroui/styles/themes/default/variables.css`, `heroui/styles/utilities/index.css`.
- **Override written to**: `…/scratchpad/atoms/css/pagination.css` → `heroui/styles/themes/tzuchi/components/pagination.css`.
- **Closeness**: major gaps. Radius, box size, type scale and the current-page colour all differ; gap / focus / disabled / cursor already line up.

## Part mapping

| Tzu Chi (shadow DOM part) | HeroUI class |
|---|---|
| `.nav` (`part="nav"`) | `.pagination__content` (HeroUI's `.pagination` root is a wrapper that also holds `.pagination__summary` — no tc counterpart) |
| `.item` (`part="page"`) | `.pagination__link` |
| `.item[aria-current="page"]` | `.pagination__link[data-active="true"]` |
| `.item.nav-button` (`part="prev"` / `part="next"`) | `.pagination__link.pagination__link--nav` |
| `.ellipsis` (`part="ellipsis"`) | `.pagination__ellipsis` |
| — (tc has exactly one size) | `.pagination--md` |
| — | `.pagination--sm` / `.pagination--lg` / `.pagination__summary` / `.pagination__item` (`li`) |

`--tc-size-icon-lg` is **40px** (`tokens.css:55`), not the stale `32px` inline fallback written in `tc-pagination.styles.ts:20`; the resolved token wins at runtime. Same for `--tc-size-icon-md` = **32px** (`tokens.css:54`) vs the `24px` fallback at `tc-pagination.styles.ts:63`, and for `--tc-typography-body`, whose real line-height is **1.6** (`tokens.css:139`), not the `1.5` in the fallback string at `tc-pagination.styles.ts:28`.

## Gap table

| Property | Tzu Chi | HeroUI | Action |
|---|---|---|---|
| **Radius** (item) | `tc-pagination.styles.ts:25` `--tc-pagination-radius` → `--tc-radius-sm` → **4px** (`tokens.css:198, 49`); same both modes | `pagination.css:27` `rounded-3xl` = `calc(var(--radius) * 3)` (`themes/shared/theme.css:110`); `--radius` = `--tc-radius-md` = 8px under tzuchi (`themes/tzuchi/variables.css:19`) → **24px** | **Changed** → `border-radius: var(--tc-pagination-radius, var(--radius-sm))` on `.pagination__link`. Biggest single visual difference (pill → square-ish). |
| **Radius** (ellipsis) | n/a (no background) | n/a | Kept — ellipsis paints no background in either. |
| **Box size** (md) | `:20-21` `min-width`/`height` = `--tc-size-icon-lg` = **40px** | `:27` `size-9` = **36px**, `md:size-8` (≥768px) = **32px** | **Changed** → `block-size: 40px`, and for non-nav links `inline-size: auto; min-inline-size: 40px` (tc grows past the box for long page numbers; HeroUI hard-squares it). Drops HeroUI's responsive 36→32px step, which has no tc equivalent. |
| **Box size** (sm / lg) | n/a — tc ships one size | `:105,119` `size-8` / `md:size-7` (32/28px); `:133,146` `size-10` / `md:size-9` (40/36px) | **Changed** → re-pitched onto the tc scale so the ladder stays distinct once md moves to 40px: sm = `--tc-size-icon-md` (32px), lg = `--tc-size-control-md` (48px). |
| **Padding** (number) | `:22` `padding: 0 var(--tc-space-4)` → inline **4px**, block **0** | `:27` none (0px) — fixed square | **Changed** → `padding-inline: var(--tc-space-4, 4px)` on `.pagination__link:not(.pagination__link--nav)`. Only shows for ≥4-digit pages, but it is the tc spec. |
| **Padding** (prev/next) | `:22` inline **4px** (tc nav button is icon-only) | `:92` `px-2.5` = **10px**; sm `px-2` = 8px (`:115`); lg `px-3` = 12px (`:142`) | **Kept** — HeroUI's nav button carries a text label (`pagination.stories.tsx:35-37`); tc's is a bare chevron, so its 4px is not transferable. The `:not(.pagination__link--nav)` guard in the override exists for exactly this. |
| **Gap** (between items) | `:12` `--tc-space-4` = **4px** | `:17` `gap-1` = **4px** | **Kept — already identical.** |
| **Gap** (icon ↔ label in nav) | n/a (icon-only) | `:92` `gap-1.5` = 6px | Kept — no tc counterpart. |
| **Gap** (summary ↔ content) | n/a | `:7` `gap-4` = 16px | Kept — no tc summary. |
| **Border width / style** | `:24` `1px solid transparent` | none (preflight `border: 0 solid`) | **Kept — no visual difference.** tc uses `box-sizing: border-box` (`:19`) and the border is transparent with `background-clip: border-box`, so it neither insets the fill nor changes the 40px outer box. Encoding it would be noise. |
| **Border colour** | transparent in every state (tc never paints an item border) | n/a | Kept. |
| **Font family** | `:28` `--tc-typography-body` → `'Noto Sans TC', system-ui, …` | inherits `--font-sans` | **Kept — already correct.** `themes/tzuchi/variables.css:25` maps `--font-sans` to `--tc-font-family-base`, and Tailwind preflight gives `button { font: inherit }`. |
| **Font size** (number) | `:28` **16px** (`--tc-typography-body`, `tokens.css:139`). The tc scale has **no step below 16px** (`--tc-font-size-16` is the smallest, `tokens.css:85`). | `:27` `text-sm` = **14px** | **Changed** → `font-size: var(--tc-font-size-16, 16px)`. |
| **Font size** (sm / lg) | n/a | `:106` `text-xs` = 12px; `:133` `text-base` = 16px | **Changed** → sm stays 16px (nothing smaller exists in the tc scale; it differs from md by box size only), lg = `--tc-font-size-20` = 20px. |
| **Font weight** (resting) | `:28` **400** (`--tc-font-weight-regular`) | `:27` `font-medium` = **500** | **Changed** → `font-weight: var(--tc-font-weight-regular, 400)`. |
| **Font weight** (current page) | `:53` **700** (`--tc-typography-subtitle`) | `:78-82` unchanged — stays 500 | **Changed** → `font-weight: var(--tc-font-weight-bold, 700)` under `[data-active="true"]`. |
| **Line height** | `:28` **1.6** → 25.6px at 16px; current page `:53` is 1.5 → 24px | `text-sm` → `--text-sm--line-height` = **20px** | **Changed** → `line-height: var(--tc-line-height-relaxed, 1.6)`. tc's 1.5-for-current-page is **not** encoded: in a centred `inline-flex` box the 1.6px difference is invisible and a per-state line-height would only risk a reflow on selection. |
| **Icon size** (prev/next chevron) | `:63-64` `--tc-size-icon-md` = **32px** | `react/src/components/icons.tsx:45-54` `IconChevronLeft` ships `width`/`height` = **16** | **Kept.** tc's 32px chevron *is* the whole 40px button; HeroUI pairs a chevron with a 16px text label, where a 32px glyph would be grotesque. 16px next to the new 16px label reads correctly. Listed as not transferable. |
| **Focus ring** | `:39-41` `outline: 2px solid var(--tc-focus-ring-color)` (= `--tc-color-blue-500` `#4f7bbe`, `tokens.css:129`, **not flipped in dark** — same blue in both modes), `outline-offset: 2px` | `:51-54` `status-focused` → `focus-ring` (`utilities/index.css:2-6`) = `ring-2` + `ring-focus` + `--tw-ring-offset-width: var(--ring-offset-width)`; under tzuchi `--ring-offset-width` = `--tc-focus-ring-offset` = **2px** (`themes/tzuchi/variables.css:24`) and `--focus` = blue-500 light / blue-300 dark (`variables.css:45, 80`) | **Kept — already matches**, and HeroUI is strictly better in dark (tc reuses the light blue-500 there). The box-shadow ring follows the new 4px radius automatically. |
| **Disabled** | `:44-47` `opacity: var(--tc-opacity-disabled)` = **0.38**; `cursor: not-allowed` | `:57-60` `status-disabled` (`utilities/index.css:61-65`) = `opacity: var(--disabled-opacity)` → `--tc-opacity-disabled` = **0.38** (`themes/tzuchi/variables.css:23`); `cursor: var(--cursor-disabled)` = **not-allowed** (`themes/default/variables.css:30`); plus `pointer-events: none` | **Kept — already matches.** HeroUI's extra `pointer-events: none` is an improvement over tc, which relies on the `disabled` attribute. |
| **Resting fg** (number) | `:27` `--tc-pagination-item-fg` → `color.text.default` → light `gray-900` **#333333** / dark `gray-100` **#f2f2f2** (`tokens.css:117` + dark block) | `:45` `--pagination-link-fg: var(--default-foreground)` → **unmapped by the tzuchi theme** (`themes/tzuchi/variables.css:14` NOT-MAPPED list), so HeroUI's `--eclipse` `oklch(0.2103 …)` ≈ #1f1f23 / `--snow` ≈ #fcfcfc shows through | **Changed** → `--pagination-link-fg: var(--foreground)`. `--foreground` *is* mapped (gray-900 / gray-100), so this lands exactly on `color.text.default` in both modes. |
| **Resting bg** | `:26` `transparent` | `:42` `--pagination-link-bg: transparent` | **Kept — identical.** |
| **Hover bg** | `:35` `--tc-pagination-item-bg-hover` → `color.brand.surface` → light `blue-100` **#e8eefe** / dark `blue-900` **#1b2d58** | `:43` `--default-hover` = `color-mix(oklab, --default 96%, --default-foreground 4%)` (`themes/default/variables.css:129`) → a neutral grey ≈ #eaeaec light / ≈ #434349 dark | **Changed** → `--pagination-link-bg-hover: var(--accent-soft)`, which the tzuchi theme resolves to exactly blue-100 / blue-900 (`themes/tzuchi/variables.css:33, 68`). |
| **Hover fg** | unchanged (stays `text.default`) | unchanged | Kept. |
| **Hover on current page** | `:34` explicitly **excluded** (`:not([aria-current='page'])`) — no hover treatment | `:80` `--pagination-link-bg-hover: var(--default-hover)` | **Changed to `--accent-hover`** (light `blue-700` #30559f / dark `blue-250` #c2d4f2) rather than removed: HeroUI must keep a hover state (it is a real button), and `--accent-hover` is precisely what tc's own `color.brand.primary-hover` resolves to. |
| **Pressed bg** | no pressed treatment in tc | `:44` `--pagination-link-bg-pressed: var(--default-hover)` (same as hover); `:81` same for the active item | **Changed to match hover** (`--accent-soft`, and `--accent-hover` when active) — preserves HeroUI's "pressed == hover" behaviour with the tc palette instead of inventing a step tc never specified. |
| **Pressed transform** | none | `:74` `scale(0.97)`; sm `0.98` (`:110`), lg `0.96` (`:137`) | **Kept** — a HeroUI interaction affordance, not a colour/shape decision; removing it would delete a state (hard rule 5). |
| **Current page bg** | `:51` `--tc-pagination-item-bg-selected` → `color.brand.primary` → light `blue-900` **#1b2d58** / dark `blue-300` **#a9c2ea** | `:79` `--pagination-link-bg: var(--default)` → neutral `oklch(94% …)` ≈ **#efeff1** light / `oklch(27.4% …)` ≈ **#3f3f46** dark ("tertiary button style", `pagination.css:77`) | **Changed** → `--pagination-link-bg: var(--accent)`. `--accent` is blue-900 / blue-300 in the tzuchi theme (`variables.css:30, 65`) — a 1:1 match with `color.brand.primary`. |
| **Current page fg** | `:52` `--tc-pagination-item-fg-selected` → `color.text.on-brand` → light `white` **#ffffff** / dark `blue-900` **#1b2d58** | inherits `--default-foreground` | **Changed** → `--pagination-link-fg: var(--accent-foreground)` — again a 1:1 match (`variables.css:31, 66`). |
| **Ellipsis colour** | `:74` `--tc-pagination-item-fg` → `color.text.default` (#333333 / #f2f2f2) — tc does **not** mute it | `:87` `text-muted` → `--muted` = `gray-700` **#828282** light / `gray-400` **#b3b3b3** dark (`themes/tzuchi/variables.css:42, 77`) | **Changed** → `color: var(--foreground)`. Also fixes the AA note in `NOTICE.md` for this glyph (gray-700 is 3.84:1 on white). |
| **Ellipsis box / type** | `:72-73` min-width/height **40px**; inherits nothing (no `font` set → 16px UA default in the shadow root, `:host` inherits the page font) | `:87` `size-9`/`md:size-8` (36/32px), `text-sm` (14px) | **Changed** → same `--pagination-item-size` / `--pagination-item-font-size` as the links, so the ellipsis stays optically aligned with the numbers. |
| **Summary** | no counterpart | `:12` `text-sm text-muted`, `gap-2`, `self-start sm:self-center` | **Type only changed** → 16px / 1.6 (and 20px under `--lg`), because the tc scale has no 14px step and a 14px summary beside 16px numbers reads as a mistake. Colour (`--muted`), layout and alignment untouched. |
| **Elevation / shadow** | none anywhere in `tc-pagination.styles.ts` | none — `box-shadow` only appears in the focus ring | **Kept — neither component has elevation.** (Component shadow tokens are emitted as light-mode literals and were not used.) |
| **Motion** | `:30-31` `background-color 150ms cubic-bezier(0.2, 0, 0, 1)` (`--tc-motion-duration-fast`, `--tc-motion-easing-standard`) | `:35-39` `transform 250ms var(--ease-smooth)`, `background-color 100ms var(--ease-out)`, `box-shadow 100ms`, + `motion-reduce:transition-none` | **Kept.** The only overlapping channel is background-color, 100ms vs 150ms — imperceptible, and re-declaring the shorthand would mean re-stating HeroUI's transform/box-shadow channels and its `motion-reduce` override. Not worth the risk (hard rule 6). |
| **`cursor`** | `:29` `pointer` | `:29` `var(--cursor-interactive)` = `pointer` | **Kept — identical.** |
| **`user-select`** | `:75` `none` on ellipsis only | `:27` `select-none` on the link, `:87` on the ellipsis | Kept — HeroUI is a superset. |
| **RTL** | tc hard-codes `padding: 0 4px` (symmetric) and does not flip the chevrons | `:94-97` `rtl:rotate-180` on the nav icons | Kept — HeroUI is better; the override uses logical properties throughout. |

## Colour-rule audit

No `--tc-color-*` semantic token, no component token that resolves to a colour, and no hex/rgb literal appears in the override. Every colour goes through a HeroUI theme variable the generated `themes/tzuchi/variables.css` already resolves per mode:

| tc token | resolves to (light / dark) | HeroUI variable used | resolves to (light / dark) |
|---|---|---|---|
| `pagination.item-fg` → `color.text.default` | `#333333` / `#f2f2f2` | `--foreground` | `gray-900` / `gray-100` — identical |
| `pagination.item-bg-selected` → `color.brand.primary` | `#1b2d58` / `#a9c2ea` | `--accent` | `blue-900` / `blue-300` — identical |
| `pagination.item-fg-selected` → `color.text.on-brand` | `#ffffff` / `#1b2d58` | `--accent-foreground` | `white` / `blue-900` — identical |
| `pagination.item-bg-hover` → `color.brand.surface` | `#e8eefe` / `#1b2d58` | `--accent-soft` | `blue-100` / `blue-900` — identical |
| (`color.brand.primary-hover`, used for the active-page hover HeroUI needs and tc omits) | `#30559f` / `#c2d4f2` | `--accent-hover` | `blue-700` / `blue-250` — identical |

Mode-independent tokens referenced directly (each with a fallback): `--tc-pagination-radius` (→ `--tc-radius-sm`, 4px), `--tc-size-icon-lg` (40px), `--tc-size-icon-md` (32px), `--tc-size-control-md` (48px), `--tc-space-4` (4px), `--tc-font-size-16` / `-20`, `--tc-font-weight-regular` / `-bold`, `--tc-line-height-relaxed`. None of their value chains ends in a colour or an elevation.

**No extra theme variables are needed** — every colour the Tzu Chi pagination specifies is already expressible with an existing HeroUI theme variable.

## Not transferable

1. **`.pagination__summary`** ("1 to 5 of 10 invoices") — tc-pagination has no summary slot at all. Only its type scale was aligned; the muted colour and the `self-start sm:self-center` layout are HeroUI's own decision.
2. **Labelled prev/next buttons** — tc's `part="prev"` / `part="next"` are icon-only 40px squares with a 32px chevron. HeroUI's carry a text label, so its `px-2.5` / `gap-1.5` / 16px icon were kept; tc's 4px padding and 32px icon would break the labelled layout.
3. **`.pagination--sm` / `.pagination--lg`** — tc ships exactly one size. Both were re-pitched onto tc dimension/type tokens rather than derived from a tc spec that does not exist.
4. **`.pagination__item`** (`<li>` wrapper) — tc renders buttons directly inside `<nav>`, with no list semantics. Nothing to port; HeroUI's `inline-flex` is left alone.
5. **The responsive `md:` size step** (36→32px at ≥768px) — tc has no breakpoint behaviour; the override flattens it to a single 40px box.
6. **The `1px solid transparent` border on tc `.item`** — provably zero visual effect under `box-sizing: border-box`; deliberately not encoded.
7. **tc's 1.5 line-height on the current page** — invisible inside a centred flex box, and a per-state line-height invites reflow on selection.

## Verification notes for the browser check

Story: `components-navigation-pagination--default` (`react/src/components/pagination/pagination.stories.tsx:59`), rendered with `size` unset → `.pagination.pagination--md`. The story marks page **1** as active (`isActive` at `:40`), so `.pagination__link[data-active="true"]` exists and is a non-nav link. `Previous`/`Next` carry `.pagination__link.pagination__link--nav`.

`getComputedStyle().height` returns the content box; the link has no block padding and no border, so it should read the full `40px`.
