# Link — gap report (tc-link ↔ HeroUI `.link`)

**Closeness: minor-gaps.** Both are an inline text link that inherits its font and
carries no chrome. Five real differences: weight, radius, underline offset, resting
colour shade, underline colour. Everything else already lands on the same value
because the generated Tzu Chi theme variables (`--focus`, `--disabled-opacity`,
`--ring-offset-width`, `--font-sans`, `--cursor-disabled`) already feed HeroUI's base.

Override written to `/private/tmp/claude-501/-Users-kaellim-Desktop-Personal-CISwebsite/1c74be25-055e-47fb-a92f-f47cfe608bb0/scratchpad/atoms/css/link.css`.

## Variant / structure mapping

| tc-link | HeroUI | note |
|---|---|---|
| `variant="default"` | `.link` | the only shape HeroUI ships; all overrides target it |
| `variant="subtle"` | — | no counterpart; **not ported** (see "Not transferable") |
| `[disabled]` → renders `<span class="link">` | `.link[aria-disabled="true"]` (`status-disabled`) | different mechanism, equivalent result; kept |
| — | `.link__icon` (`<Link.Icon>`, external-link glyph) | tc has no icon slot; left as upstream |
| — | `.link.button` (Link wearing Button classes) | excluded from every override via `:not(.button)` |

Class names are confirmed literal: `heroui/styles/src/components/link/link.styles.ts:6-9`
→ `base: "link"`, `icon: "link__icon"`.

## Gap table

Paths are abbreviated: **tc-s** = `/Users/kaellim/Desktop/Personal/CISwebsite/packages/components/src/link/tc-link.styles.ts`,
**tc-t** = `/Users/kaellim/Desktop/Personal/CISwebsite/packages/tokens/src/component/link.tokens.json`,
**tok** = `/Users/kaellim/Desktop/Personal/CISwebsite-heroui-spike/packages/tokens/dist/tokens.css`,
**h-css** = `/Users/kaellim/Desktop/Personal/CISwebsite-heroui-spike/heroui/styles/components/link.css`,
**h-util** = `…/heroui/styles/utilities/index.css`,
**h-theme** = `…/heroui/styles/themes/shared/theme.css`,
**h-def** = `…/heroui/styles/themes/default/variables.css`,
**tz** = `…/heroui/styles/themes/tzuchi/variables.css`.

| property | Tzu Chi | HeroUI (under `data-theme="tzuchi*"`) | action |
|---|---|---|---|
| **display** | `inline` — tc-s:5,9 | `inline-flex` + `items-center` + `position:relative` — h-css:3 | **kept** — inline-flex is load-bearing HeroUI structure (`.link__icon` alignment, `touch-target`/`relative` contract). Changing it would break the icon slot, which is exactly the architecture the spike is keeping. |
| **height / min-size** | none (inline box) — tc-s:8-18 | `h-fit w-fit` → `height/width: fit-content` — h-css:3 | **kept** — no tc equivalent to contradict it; it is inert on an inline-flex link. |
| **padding** | none | none | **kept** — identical. |
| **gap** | n/a (no icon) | no `gap` on `.link`; default icon uses `ms-1` = `margin-inline-start:4px` — h-css:71-73 | **kept** — HeroUI-only structure. |
| **border width / colour / style** | none | none (`.link.button` inherits the Button's border) | **kept** — identical. |
| **border-radius** | `var(--tc-radius-sm)` = **4px** — tc-s:16, tok:49 | `rounded-xl` = `calc(var(--radius) * 1.5)`; tz:19 sets `--radius: var(--tc-radius-md)` = 8px → **12px** — h-css:3, h-theme:108, tz:19 | **changed → `var(--tc-radius-sm, 4px)`**. Only visible through the `ring`-based focus indicator (box-shadow follows `border-radius`). |
| **font-family** | `font: inherit` — tc-s:11 | inherits; `--font-sans` already `var(--tc-font-family-base)` — tz:25 | **kept** — already Tzu Chi. |
| **font-size / line-height** | inherited (`font: inherit`) — tc-s:11 | not set → inherited | **kept** — identical. |
| **font-weight** | `var(--tc-font-weight-bold)` = **700** — tc-s:12, tok:84 | `font-medium` → `var(--font-weight-medium)` = **500** — h-css:3 | **changed → `var(--tc-font-weight-bold, 700)`**. Real Figma decision: tc links read bold inside body copy. |
| **text-decoration (rest)** | `none` — tc-s:13 | `no-underline` — h-css:3 | **kept** — identical. |
| **text-underline-offset** | `0.15em` (≈2.4px at 16px body) — tc-s:14 | `underline-offset-4` = **4px** — h-css:3 | **changed → `0.15em`**, so the offset tracks the inherited font-size the way tc does. The `UnderlineVariants` story's `underline-offset-1…4` utilities still win (utilities layer). |
| **text-decoration-thickness** | not specified (`auto`) | `decoration-[1.5px]` — h-css:3 | **kept** — tc states nothing, so nothing to transfer. |
| **colour — default, rest** | `--tc-link-fg` → `{color.brand.primary-hover}`: light **#30559f** (blue-700), dark **#c2d4f2** (blue-250) — tc-s:10, tc-t:3, tok:325/114, tok:414 | `text-link` → `var(--link)` → `{color.brand.primary}`: light **#1b2d58** (blue-900), dark **#a9c2ea** (blue-300) — h-css:3, tz:46/81, generate.mjs:47 | **changed → `color: var(--accent-hover)`**. `generate.mjs:29` maps `--accent-hover ← --tc-color-brand-primary-hover`, i.e. the *exact* token `--tc-link-fg` resolves to, in both modes. Light mode was visibly too dark before (blue-900 vs blue-700). |
| **colour — default, hover** | `--tc-link-fg-hover` → `{color.border.focus}`: light **#4f7bbe** (blue-500), dark **#a9c2ea** (blue-300) — tc-s:29, tc-t:4, tok:326/125, tok:425 | colour unchanged on hover — h-css:20-29 | **changed → `color: var(--focus)`** inside `@media (hover:hover)`, matching upstream's own hover guard. `generate.mjs:46` maps `--focus ← --tc-color-border-focus`, again the exact token, per mode. |
| **text-decoration on hover** | `underline`, colour = currentColor, thickness auto — tc-s:30 | `underline` with `decoration-muted/50` = `color-mix(in oklab, var(--muted) 50%, transparent)`: light gray-700 #828282@50%, dark gray-400 #b3b3b3@50%, 1.5px — h-css:23 | **changed → `text-decoration-color: currentColor`** (thickness left at upstream's 1.5px). The underline now matches the link colour, as in the tc design. |
| **colour / decoration — pressed** | tc has no `:active` rule → stays at the hover/rest colour | `underline` + `decoration-muted` (fully opaque) — h-css:32-39 | **changed → `text-decoration-color: currentColor`** only, so pressed reads as a firmer version of hover instead of switching to grey. Colour and the `underline` itself untouched. |
| **colour — subtle variant, rest/hover** | `--tc-link-subtle-fg` → `{color.text.default}`: light **#333333** (gray-900), dark **#f2f2f2** (gray-100); hover → `{color.border.focus}` — tc-s:34-39, tc-t:5, tok:327 | no counterpart | **not ported** — HeroUI has a single link shape and no variant prop to hang it on. An app wanting it can write `<Link className="text-foreground hover:text-focus">`; inventing a `.link--subtle` class would be new HeroUI API, not a theme override. |
| **focus ring** | `outline: var(--tc-focus-ring-width) solid var(--tc-focus-ring-color)` = **2px solid #4f7bbe**, `outline-offset: var(--tc-focus-ring-offset)` = **2px**; note tc does *not* flip the ring colour in dark (still blue-500) — tc-s:22-26, tok:60-61/129 | `status-focused` → `focus-ring` = `ring-2 ring-focus` + `--tw-ring-offset-width: var(--ring-offset-width)`; tz:24 sets that to `var(--tc-focus-ring-offset)` = **2px**; `--focus` = light **#4f7bbe**, dark **#a9c2ea** — h-css:42-49, h-util:2-6/49-51, tz:24/45/80 | **kept** — width, offset and the light-mode colour already match token-for-token, and HeroUI's dark ring (blue-300) is the better of the two. Only the radius it traces needed fixing (above). |
| **disabled treatment** | `color: --tc-link-disabled-fg` → `{color.text.disabled}`: light **#b3b3b3** (gray-400), dark **#828282** (gray-700); `cursor: not-allowed`; `text-decoration: none`; pointer events deliberately **left on**; renders `<span>` — tc-s:43-48, tc-t:6, tok:328/119, tok:419 | `status-disabled` → `opacity: var(--disabled-opacity)` = `var(--tc-opacity-disabled)` = **0.38**; `cursor: var(--cursor-disabled)` = `not-allowed`; `pointer-events: none` — h-css:52-54, h-util:61-65, tz:23, tok:58 | **kept** — the opacity is already the Tzu Chi token and the cursor already matches. Swapping opacity for a flat grey would fight `.link.button` (a disabled link-as-button needs its fill dimmed, not recoloured). `pointer-events:none` is HeroUI's architecture; react-aria still exposes `aria-disabled`, so the AT concern behind tc's choice is covered. |
| **icon size / opacity** | n/a | `.link__icon` `size-[0.75em]`, `opacity .6` → `1` on hover/press/focus, default icon `ms-1 pb-1.5` — h-css:56-73 | **kept** — no tc counterpart exists to transfer from. |
| **elevation / shadow** | none | none | **kept** — identical. |
| **motion** | `transition: color var(--tc-motion-duration-fast) var(--tc-motion-easing-standard)` = **150ms cubic-bezier(0.2,0,0,1)** — tc-s:17, tok:62/64 | `color 100ms var(--ease-smooth)` (= `ease`) + background-color 150ms + box-shadow 150ms + opacity 100ms; `motion-reduce:transition-none` — h-css:9-14, h-theme:114 | **kept** — a 50 ms / easing-curve delta on a colour fade is below the noticeable threshold, and re-declaring the shorthand would silently pin the other three channels to today's upstream list. Noted rather than changed. |
| **cursor** | `pointer` — tc-s:15 | `var(--cursor-interactive)` = `pointer` — h-css:17 | **kept** — identical. |

## Notes on the colour rule

No `--tc-color-*` semantic token, no component token that resolves to a colour and no
literal appears in the override — `tokens.css` only flips those under
`[data-theme="dark"]`, which never matches `tzuchi-dark`. Both colours come from
HeroUI theme variables that the generator already derives from the *same* Tzu Chi
primitives, so they are exact in both modes:

| tc token | primitive (light / dark) | HeroUI theme variable used | mapping source |
|---|---|---|---|
| `--tc-link-fg` = `{color.brand.primary-hover}` | blue-700 `#30559f` / blue-250 `#c2d4f2` | `--accent-hover` | `themes/tzuchi/generate.mjs:29` |
| `--tc-link-fg-hover` = `{color.border.focus}` | blue-500 `#4f7bbe` / blue-300 `#a9c2ea` | `--focus` | `themes/tzuchi/generate.mjs:46` |

Consequently **no `--tzuchi-*` variable had to be invented** for this component.
Only mode-independent tokens are referenced directly, each with a fallback:
`--tc-font-weight-bold` (700) and `--tc-radius-sm` (4px).

## Not transferable

- `variant="subtle"` — HeroUI Link has no variant axis; adding one is API, not theming.
- tc's `<span>`-instead-of-`<a>` disabled rendering and its "no `pointer-events:none`"
  rule — markup/behaviour, owned by `react-aria-components`.
- `display:inline` (tc) vs `inline-flex` (HeroUI) — HeroUI's icon slot depends on it.
- `.link__icon` sizing/fade and the external-link default glyph — HeroUI-only feature.
- tc's `::slotted(*) { color: inherit }` — shadow-DOM-only concern.

## Verification hooks

Story `components-navigation-link--default` renders three links; the third wears the
Button classes, so both assertions use `a.link:not(.button)`.

| selector | property | expected |
|---|---|---|
| `a.link:not(.button)` | `border-top-left-radius` | `4px` (was 12px) |
| `a.link:not(.button)` | `font-weight` | `700` (was 500) |
