# Breadcrumbs — Tzu Chi ↔ HeroUI gap report

**Tzu Chi:** `tc-breadcrumb` + `tc-breadcrumb-item`
(`packages/components/src/breadcrumb/tc-breadcrumb.styles.ts`, `tc-breadcrumb-item.styles.ts`,
`packages/tokens/src/component/breadcrumb.tokens.json`)
**HeroUI:** `Breadcrumbs` (`heroui/styles/components/breadcrumbs.css`,
`heroui/react/src/components/breadcrumbs/breadcrumbs.tsx`)
**Output:** `heroui/styles/themes/tzuchi/components/breadcrumbs.css` (new file)
**Closeness:** minor gaps — colours already line up (both sides are "muted link, default-coloured
current"); what differs is density (gaps), type size/weight, and the current-crumb colour. The one
big item is not a Tzu Chi ↔ HeroUI gap at all but a collision with pass 1's `link.css`.

---

## DOM / structure (the part that decides every selector below)

`BreadcrumbsItem` renders each crumb through HeroUI's `<Link>`
(`breadcrumbs.tsx:97`), so the crumb element carries **both** class names:
`class="link breadcrumbs__link"` (`link.tsx:38` → `composeTwRenderProps` →
`cx("link", "breadcrumbs__link")`, `utils/compose.ts:9-19`).

react-aria (`react-aria-components/dist/private/Breadcrumbs.mjs:62-90`) makes the **last** crumb
`isCurrent`, which means `isDisabled: true` as well. `Link.mjs:28` then swaps the element type to
`<span>` and `useLink.mjs:50` adds `aria-disabled="true"`; `Link.mjs:62-63` adds
`data-current="true"` and `data-disabled="true"`. So the current crumb is
`<span role="link" aria-current="page" aria-disabled="true" data-current="true"
class="link breadcrumbs__link">` — full opacity (upstream's `[data-current="true"] { opacity-100 }`
at (0,3,0) beats `status-disabled`'s opacity at (0,2,0)) but `pointer-events: none`, hence
unhoverable.

**Collision with pass 1.** `themes/tzuchi/components/link.css:32` matches
`[data-theme^="tzuchi"] .link:not(.button)` — specificity (0,3,0) — which already beats upstream's
`.breadcrumbs .breadcrumbs__link` (0,2,0). Under `tzuchi` today, before this file exists, every
crumb renders **bold 700** in **`--accent-hover`** (brand blue) and hovers to **`--focus`**, not
grey. This file therefore has to reclaim `color` and `font-weight`; it does so by naming `.link` in
the selector → (0,4,0) for the resting clause and (0,5,0) for the nested hover clause (link.css's
own hover clause is (0,4,0)). Specificity, not import order, so the fix holds wherever the import
is placed in `components/index.css`.

---

## Gap table

| property | Tzu Chi (file:line → resolved) | HeroUI (file:line → resolved) | action |
|---|---|---|---|
| **container: display / align** | `tc-breadcrumb.styles.ts:15,17` `display:flex; align-items:center` | `breadcrumbs.css:3` `flex items-center` | **kept — identical** |
| **container: gap** | `tc-breadcrumb.styles.ts:18` `--tc-breadcrumb-gap` = `{space.8}` = **8px** (mode-independent) | `breadcrumbs.css:3` `gap-1.5` = **6px** | **changed** → `gap: var(--tc-breadcrumb-gap, var(--tc-space-8, 8px))` |
| **container: flex-wrap** | `tc-breadcrumb.styles.ts:16` `flex-wrap: wrap` | `breadcrumbs.css:3` — none → `nowrap` (items are `shrink-0`, so a long trail overflows) | **changed** → `flex-wrap: wrap`. Judgement call, flagged: purely additive, breaks no variant or state; row-gap becomes the same 8px. |
| **container: padding / margin / list-style** | `tc-breadcrumb.styles.ts:19-21` `margin:0; padding:0; list-style:none` | HeroUI's `<ol>` gets these from the Tailwind preflight reset | **kept — same end state** |
| **item: display / align / shrink** | `tc-breadcrumb-item.styles.ts:5-6` `inline-flex; align-items:center` (+ `tc-breadcrumb.styles.ts:25-26`) | `breadcrumbs.css:21` `flex shrink-0 items-center justify-center` | **kept — `flex` vs `inline-flex` is invisible inside a flex container; `shrink-0` and `justify-center` are upstream refinements with no tc counterpart** |
| **item: gap (text ↔ separator)** | `tc-breadcrumb-item.styles.ts:7` `--tc-breadcrumb-item-gap` → fallback `--tc-space-8` = **8px** | `breadcrumbs.css:21` `gap-1` = **4px** | **changed** → `gap: var(--tc-space-8, 8px)`. (`--tc-breadcrumb-item-gap` is only a public CSS property of the Lit element, not a token in `tokens.css`, so the space token is referenced directly.) |
| **separator placement** | `tc-breadcrumb-item.ts:48-58` — separator **before** the text, for `position > 0` | `breadcrumbs.tsx:100` — separator **after** the link, when `!isCurrent` | **kept — markup, not themeable.** Net rhythm is identical anyway: tc gives text→sep 8px (ol gap) and sep→text 8px (item gap); HeroUI now gives link→sep 8px (item gap) and sep→link 8px (container gap). |
| **link: font-family** | `tc-breadcrumb.styles.ts:6` `--tc-typography-body` → `'Noto Sans TC', system-ui, …` | inherited from `--font-sans` | **kept — `themes/tzuchi/variables.css:25` already sets `--font-sans: var(--tc-font-family-base)`** |
| **link: font-size** | `tc-breadcrumb.styles.ts:7` `--tc-breadcrumb-font-size` = `{font.size.16}` = **16px** | `breadcrumbs.css:7` `text-sm` = **14px** | **changed** → `font-size: var(--tc-breadcrumb-font-size, var(--tc-font-size-16, 16px))` |
| **link: line-height** | `tc-breadcrumb.styles.ts:6` `--tc-typography-body` = `400 16px / 1.6` → **25.6px** | `breadcrumbs.css:7` `leading-5` = **20px** (1.25 at 14px) | **changed** → `line-height: var(--tc-line-height-relaxed, 1.6)` = 25.6px. `--tc-line-height-relaxed: 1.6` (`tokens.css:94`) is a unitless number — mode-independent, value chain never reaches a colour. |
| **link: font-weight** | `tc-breadcrumb-item.styles.ts:16-21` `.link` declares none → inherits `--tc-typography-body`'s **400** | `breadcrumbs.css:7` `font-medium` = **500**; *and* `link.css:39` (pass 1) forces **700** | **changed** → `font-weight: var(--tc-font-weight-regular, 400)` |
| **link: colour (rest)** | `tc-breadcrumb-item.styles.ts:17` `--tc-breadcrumb-link-fg` = `{color.text.muted}` → light **#828282**, dark **#b3b3b3** | `breadcrumbs.css:7` `text-muted` = `--muted` — **the same value**; but `link.css:37` (pass 1) overrides it to `--accent-hover` (light #30559f, dark blue-250) | **changed** → `color: var(--muted)`. Not a Tzu Chi ↔ HeroUI gap: this only takes the colour back from our own pass-1 `link.css`. |
| **link: colour (hover)** | `tc-breadcrumb-item.styles.ts:24` `--tc-breadcrumb-link-fg-hover` = `{color.text.default}` → light **#333333**, dark **#f2f2f2** | `breadcrumbs.css:10-12` — colour unchanged on hover; `link.css:49` (pass 1) sets `--focus` (light #4f7bbe, dark #a9c2ea) | **changed** → nested `@media (hover: hover) { &:hover, &[data-hovered="true"] { color: var(--foreground) } }` |
| **link: underline (hover)** | `tc-breadcrumb-item.styles.ts:26` `text-decoration: underline`, default (currentColor) | `breadcrumbs.css:11` + `link.css:23` `underline`; pass-1 `link.css:50` already sets `text-decoration-color: currentColor` | **kept — already matches** |
| **link: underline thickness / offset** | tc: browser default (`auto`, ≈1px at 16px, default offset) | `link.css:3` `decoration-[1.5px] underline-offset-4`, narrowed to `0.15em` (≈2.4px) by pass-1 `link.css:41` | **kept — consistency with pass 1 (rule 7); sub-pixel detail** |
| **link: text-decoration (rest)** | `tc-breadcrumb-item.styles.ts:18` `none` | `breadcrumbs.css:7` `no-underline` | **kept — identical** |
| **link: border-radius** | `tc-breadcrumb-item.styles.ts:19` `--tc-radius-sm` = **4px** (only visible under the focus ring) | `link.css:3` `rounded-xl` = 12px, **already corrected to 4px** by pass-1 `link.css:40` | **kept — pass-1 `link.css` already lands this on the crumbs per-property; re-declaring it here would duplicate an existing override (rule 7)** |
| **link: colour (pressed)** | tc has no pressed state | `link.css:33-38` `underline decoration-muted`; pass-1 `link.css:56-57` `text-decoration-color: currentColor` | **kept — upstream state with no tc counterpart; text colour falls through to this file's `--muted`** |
| **current: colour** | `tc-breadcrumb-item.styles.ts:35` `--tc-breadcrumb-current-fg` = `{color.text.default}` → light **#333333**, dark **#f2f2f2** | `breadcrumbs.css:15` `text-link` = `--link` → light **#1b2d58**, dark **#a9c2ea** (brand blue) | **changed** → `&[data-current="true"] { color: var(--foreground) }`, declared after the hover clause so it also wins at equal (0,5,0) specificity |
| **current: font-weight** | `tc-breadcrumb-item.styles.ts:36` `--tc-font-weight-medium` = **500** | inherits `.breadcrumbs__link`'s 500 (no dedicated rule) | **changed** → `font-weight: var(--tc-font-weight-medium, 500)`. Only needed because this file drops the resting weight to 400; the current crumb keeps 500, as in tc. |
| **current: opacity** | tc has none (plain `<span>`) | `breadcrumbs.css:7,15` explicit `opacity-100` (0,3,0) neutralises `link.css:52-54` `status-disabled` (0,2,0) | **kept — already full opacity** |
| **separator: colour** | `tc-breadcrumb-item.styles.ts:11` `--tc-breadcrumb-separator-fg` = `{color.text.muted}` → `--muted` | `breadcrumbs.css:26` `text-muted` = `--muted` | **kept — identical** |
| **separator: size** | tc: a `›` **text glyph** at the 16px body size; its ink is ≈8–9px tall in Noto Sans TC | `breadcrumbs.css:26` `size-3` = **12×12px** chevron SVG | **kept — not comparable (glyph vs icon), and the 12px chevron already reads at least as strongly as tc's glyph. See notTransferable.** |
| **separator: RTL / user-select** | `tc-breadcrumb-item.styles.ts:13-14` `user-select: none` | `breadcrumbs.css:26` `rtl:rotate-180` | **kept — upstream's RTL flip is strictly better; tc's `user-select:none` is a glyph-only concern that does not apply to an SVG** |
| **focus ring: width** | `tc-breadcrumb-item.styles.ts:29` `--tc-focus-ring-width` = **2px** | `link.css:43` `status-focused` → `focus-ring` (`utilities/index.css:2-6`) `ring-2` = **2px** | **kept — identical** |
| **focus ring: offset** | `tc-breadcrumb-item.styles.ts:31` `--tc-focus-ring-offset` = **2px** | `utilities/index.css:5` `--tw-ring-offset-width: var(--ring-offset-width)`, and `themes/tzuchi/variables.css:24` sets `--ring-offset-width: var(--tc-focus-ring-offset)` = **2px** | **kept — the theme already pins it** |
| **focus ring: colour** | `tc-breadcrumb-item.styles.ts:30` `--tc-breadcrumb-focus-ring-color` = `{focus-ring.color}` = `blue-500` (`tokens.css:130`) | `ring-focus` = `--focus` = `{color.border.focus}` = `blue-500` light / `blue-300` dark (`generate.mjs:52`) | **kept — same primitive in light; dark gets the correct dark-mode value, which tc's own token chain also does** |
| **focus ring: mechanism** | `outline` + `outline-offset` | `box-shadow`-based Tailwind ring | **kept — visually equivalent; mechanism is upstream's** |
| **height / min-height / min-size** | neither side declares one — row height = line-height | same | **n/a; the row grows 20px → 25.6px purely as a consequence of the line-height change** |
| **padding (container, item, link)** | none on any of the three | none on any of the three | **kept — identical (the Tailwind reset already zeroes the `<ol>`)** |
| **border (width / colour / style)** | none anywhere | none anywhere | **kept — n/a** |
| **elevation / shadow** | none | none | **kept — n/a** |
| **motion** | `tc-breadcrumb-item.styles.ts:20` `color 150ms cubic-bezier(.2,0,0,1)`; `:39-43` `prefers-reduced-motion` → `none` | `link.css:9-14` `color 100ms var(--ease-smooth)` (= `ease`, `themes/shared/theme.css:114`) + `motion-reduce:transition-none` | **kept — 50ms and an easing curve apart; pass-1 `link.css` deliberately left transitions alone, so changing them here would contradict it (rule 7)** |
| **disabled** | tc has no disabled state | `<Breadcrumbs isDisabled>` → `link.css:52-54` `status-disabled` = `opacity: var(--disabled-opacity)` = `--tc-opacity-disabled` = **0.38** (`themes/tzuchi/variables.css:23`), `cursor`, `pointer-events:none` | **kept — upstream state, already carrying the Tzu Chi disabled opacity via the theme variable** |
| **cursor** | tc: browser default for `<a href>` | `link.css:17` `var(--cursor-interactive)` | **kept** |

---

## What is NOT in the file, and why

- **`border-radius: 4px`** and **`text-underline-offset: 0.15em`** — pass-1 `link.css` already puts
  exactly these on every `.link`, and the cascade resolves per property, so they reach the crumbs
  without being repeated (rule 7).
- **`.breadcrumbs__separator`** — colour already matches; size is not comparable (see below).
- **focus / disabled / pressed / RTL** — already correct or intentionally upstream's.

## notTransferable

1. **Separator glyph vs icon.** tc draws a `›` **character** (`tc-breadcrumb-item.ts:49`), scaling
   with the text and colourable as text; HeroUI draws an `IconChevronRight` **SVG** at a fixed 12px
   (`breadcrumbs.tsx:66`). Swapping one for the other is a markup change, which is out of scope.
   Sizing the icon to "match" the glyph is guesswork, so `size-3` is left alone — tc's glyph draws
   *less* ink at 16px than a 12px chevron, so upstream is not undersized.
2. **Separator position.** tc puts it before each non-first item, HeroUI after each non-last item.
   Markup. Neutralised in practice by making the container gap and the item gap both 8px.
3. **The `current` element type.** tc renders a plain `<span>` with no interactive behaviour;
   HeroUI renders `<span role="link" aria-disabled="true">` through react-aria, which drags
   `status-disabled` (`pointer-events:none`, `cursor`) along. Behaviourally equivalent, but the
   mechanism is not something a theme can restyle away — and upstream already patches the visible
   part (`opacity-100`).
4. **tc's `<nav aria-label="Breadcrumb">` wrapper** (`tc-breadcrumb.ts:51`) has no HeroUI
   counterpart — `BreadcrumbsPrimitive` renders the `<ol>` alone. Markup / a11y structure, not
   themeable, and not a visual difference.
5. **tc's `--tc-breadcrumb-item-gap`** is a public CSS custom property of the Lit element with no
   entry in `tokens.css`; only its fallback (`--tc-space-8`) can be referenced from the theme.
6. **`prefers-reduced-motion`** — both sides handle it, by different mechanisms
   (`motion-reduce:transition-none` vs a media query). Nothing to port.
7. **tc's `user-select: none` on the separator** — meaningless on an SVG, which is not selectable
   text to begin with.
