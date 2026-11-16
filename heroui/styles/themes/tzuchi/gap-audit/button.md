# Button — Tzu Chi ↔ HeroUI gap report

- **Tzu Chi source**: `packages/components/src/button/tc-button.styles.ts`,
  `tc-button.ts`, `packages/tokens/src/component/button.tokens.json`
- **Resolved token values**: `packages/tokens/dist/tokens.css`
- **HeroUI source**: `heroui/styles/components/button.css`, `heroui/styles/components/button-group.css`,
  `heroui/styles/src/components/button/button.styles.ts`, `heroui/react/src/components/button/button.tsx`,
  `heroui/styles/utilities/index.css`, `heroui/styles/themes/default/variables.css`,
  `heroui/styles/themes/shared/theme.css`
- **Override written to**: `button.css` (a scratch copy at the time; the result lives in `heroui/styles/themes/tzuchi/components/button.css`)
- **Closeness**: minor gaps. Colours were already right (the theme generator maps
  `brand.primary` / `primary-hover` / `brand.surface` / `surface-hover` / `text.on-brand`
  onto `--accent*`, so `primary` = tc `filled` with no work). What differed was shape,
  density, type, and which HeroUI variant tc's `tonal` / `outlined` should point at.

## Variant mapping

| tc-button variant | HeroUI variant | Basis |
|---|---|---|
| `filled` (default) | `.button--primary` | both accent fill + on-accent label; already identical |
| `tonal` | `.button--secondary` | tc tonal = `brand.surface` fill + `brand.primary` label = the `--accent-soft` trio |
| `outlined` | `.button--outline` | 1px border, transparent fill, `brand.surface` hover |
| — | `.button--tertiary`, `--ghost` | no tc counterpart; neutral `--default` fill |
| — | `.button--danger`, `--danger-soft` | no tc counterpart; `--danger*` is already themed |
| single size | `md` | tc has no size axis; `sm` / `lg` given a Tzu Chi rhythm |

## Gap table

| property | Tzu Chi | HeroUI | action |
|---|---|---|---|
| border-radius | `tc-button.styles.ts:19` `--tc-button-radius` → `--tc-radius-md` = **8px** (both modes) | `button.css:5` `rounded-3xl` = `calc(var(--radius) * 3)`; under tzuchi `--radius` = 8px → **24px** | **changed** — `border-radius: var(--tc-button-radius, var(--radius))`. Moved out of `themes/tzuchi/components/index.css` into this file so it is self-contained. |
| height | no fixed height; `styles.ts:18,20,21` padding-block 8px + 24px line box + 2 × 1px border = **42px**, identical at every viewport | `button.css:5` `h-10` = **40px**, `md:h-9` = **36px** at ≥768px | **changed** — one `height` of 42px at every width, via `--tzuchi-button-block-size`. HeroUI's desktop densification has no tc equivalent. |
| height (sm) | — (tc has no sm) | `button.css:70` `h-9` 36px / `md:h-8` 32px | **changed** — 34px (same 24px line box, padding-block `--tc-space-4`). Must be restated anyway: the base rule above out-specifies `.button--sm`. |
| height (lg) | — (tc has no lg) | `button.css:87` `h-11` 44px / `md:h-10` 40px | **changed** — 50px (padding-block `--tc-space-12`), keeping the 4 / 8 / 12 rhythm. |
| padding-inline | `styles.ts:20` `var(--tc-space-24)` = **24px** | `button.css:5` `px-4` = **16px** | **changed** — `var(--tc-space-24, 24px)`. |
| padding-inline (sm / lg) | — | `button.css:70` `px-3` 12px; lg inherits 16px | **changed** — 16px / 32px (`--tc-space-16` / `--tc-space-32`), again mandatory because the base rule out-specifies them. |
| padding-block | `styles.ts:20` 8px | not set (fixed height + `items-center`) | **kept** — with `box-sizing: border-box` and a fixed 42px height the label centres identically; adding padding-block would be dead weight. |
| gap | `styles.ts:17` `--tc-space-8` = **8px** | `button.css:5` `gap-2` = **8px** | **kept — already matches.** |
| font-family | `--tc-typography-subtitle` → `'Noto Sans TC', system-ui, …` | `--font-sans`, which `themes/tzuchi/variables.css:25` already sets to `--tc-font-family-base` | **kept — already matches** (Tailwind preflight gives `button` `font: inherit`). |
| font-size | `styles.ts:18` **16px** | `button.css:5` `text-sm` = **14px** (lg `text-base` = 16px) | **changed** — `var(--tc-font-size-16, 16px)` on `.button`; `sm` and `lg` then inherit 16px, matching tc's single type size. |
| font-weight | `styles.ts:18` **700** (`--tc-font-weight-bold`) | `button.css:5` `font-medium` = **500** | **changed** — `var(--tc-font-weight-bold, 700)`. |
| line-height | `styles.ts:18` **1.5** → 24px at 16px | `text-sm` default `calc(1.25 / 0.875)` = **1.4286** → 20px | **changed** — `var(--tc-line-height-normal, 1.5)` → computes to 24px. |
| border-width | `styles.ts:21` **1px** on every variant (`solid transparent`) | none on the base; `button.css:125` `.button--outline` `border` = **1px** | **kept** — tc's transparent border exists only to stop a size jump between variants; HeroUI already uses `border-box` + a fixed height, so filled and outlined measure the same without it. Outline's 1px matches tc exactly. |
| border-colour (outline) | `styles.ts:47` `--tc-button-outlined-border` → `brand.primary` = **#1b2d58** light / **#a9c2ea** dark | `button.css:125` `border-border` → `--border` = **#bdbdbd** light / **#6b6b6e** dark | **changed** — `border-color: var(--accent)` (resolves to exactly those two values per mode). |
| icon size | not specified — slotted icons keep their own size | `button.css:63-65` `size-5` 20px, `sm:size-4` 16px at ≥640px; `.button--sm` 16px | **kept** — no tc decision to transfer. (Incidentally `--tc-size-icon-sm` is also 20px.) |
| focus ring width | `styles.ts:27` `--tc-focus-ring-width` = **2px** | `utilities/index.css:2-6` `focus-ring` → `ring-2` = **2px** | **kept — already matches.** |
| focus ring offset | `styles.ts:29` `--tc-focus-ring-offset` = **2px** | `--ring-offset-width`, which `themes/tzuchi/variables.css:24` already sets to `--tc-focus-ring-offset` = **2px** | **kept — already matches.** |
| focus ring colour | `styles.ts:28` `--tc-focus-ring-color` → `border.focus` = **#4f7bbe** light / **#a9c2ea** dark | `ring-focus` → `--focus`, which `variables.css:45,80` already sets to blue-500 / blue-300 = **the same two values** | **kept — already matches.** tc paints an `outline`, HeroUI a ring (box-shadow); visually equivalent and the ring is the HeroUI architecture. |
| disabled opacity | `styles.ts:32` `--tc-opacity-disabled` = **0.38** | `status-disabled` → `--disabled-opacity`, set to `--tc-opacity-disabled` by `variables.css:23` = **0.38** | **kept — already matches.** |
| disabled cursor | `styles.ts:33` `not-allowed` | `--cursor-disabled` = `not-allowed` (`themes/default/variables.css:30`) | **kept — already matches.** HeroUI additionally sets `pointer-events: none`, a strictly better version of tc's guard clause in `tc-button.ts:29-33`. |
| primary / filled colours | `filled.bg` `brand.primary` **#1b2d58 / #a9c2ea**, `bg-hover` `brand.primary-hover` **#30559f / #c2d4f2**, `fg` `text.on-brand` **#ffffff / #1b2d58** | `button.css:96-101` `--accent` / `--accent-hover` / `--accent-foreground` = **identical values** per `variables.css:30-35,65-70` | **kept — already matches**, nothing restyled. |
| secondary / tonal colours | `tonal.bg` `brand.surface` **#e8eefe / #1b2d58**, `bg-hover` `brand.surface-hover` **#d1deff / #30559f**, `fg` `brand.primary` **#1b2d58 / #a9c2ea** | `button.css:103-108` bg `--default` (**unmapped** → HeroUI's `oklch(94% 0.001 286.375)` light / `oklch(27.4% …)` dark), fg `--accent-soft-foreground` (**already right**) | **changed (bg only)** — `--button-bg: var(--accent-soft)`, hover/pressed `--accent-soft-hover`. `--button-fg` left alone because it already resolves to `brand.primary`. |
| outline / outlined colours | transparent fill, fg `brand.primary` **#1b2d58 / #a9c2ea**, hover bg `brand.surface` **#e8eefe / #1b2d58** | `button.css:116-127` fg `--default-foreground` (unmapped, near-black / near-white), hover `color-mix(in srgb, var(--default) 60%, transparent)` | **changed** — `--button-fg: var(--accent)`, `--button-bg-hover: var(--accent-soft)`, `--button-bg-pressed: var(--accent-soft-hover)`. Fill stays transparent. |
| tertiary / ghost colours | no counterpart | `button.css:110-122` `--default` / `--default-hover` / `--default-foreground` | **kept** — `--default*` has no `@tzuchi/tokens` equivalent, so HeroUI's neutral grey shows through. This is a theme-level gap already listed in `themes/tzuchi/variables.css:13-14`; fixing it belongs in `generate.mjs`, not in a per-component override. |
| danger / danger-soft colours | no counterpart (tc has `feedback.error` but no danger button) | `button.css:129-141` `--danger` / `--danger-hover` / `--danger-foreground` / `--danger-soft*` | **kept** — `--danger` is already generated from `feedback.error` (#d4494f / #f08a8e) and `--danger-soft` derives from it by `color-mix`, so both modes are correct. |
| pressed state | none — tc has no pressed treatment at all | `button.css:47-52` `transform: scale(0.97)` (`sm` 0.98, `lg` 0.96) + `--button-bg-pressed` | **kept** — a HeroUI interaction signature that tc neither specifies nor contradicts; removing it would flatten press feedback on every button. tc's variant colours do supply the pressed fills via `--accent-soft-hover`. |
| motion | `styles.ts:23-24` `background-color 150ms cubic-bezier(0.2, 0, 0, 1)` | `button.css:11-14` `transform 250ms ease, background-color 100ms var(--ease-out), box-shadow 100ms var(--ease-out)` | **kept** — a 50 ms / easing difference on a colour fade is imperceptible, and overriding it means re-declaring the whole shorthand (including the transform and box-shadow legs that carry the press and focus-ring animation). Not worth the upstream drift. |
| elevation | none | none (only the focus ring travels through `box-shadow`) | **kept — already matches.** |
| full-width | `tc-button.ts:24` `full-width` → `width: 100%` | `button.css:157` `.button--full-width` `w-full` | **kept — already matches.** The icon-only width override is written as `:not(.button--full-width)` so HeroUI's precedence for a button that is both survives. |
| icon-only | no counterpart (tc has no icon-only mode) | `button.css:144-154` `w-10 p-0`, `md:w-9`; sm 36/32, lg 44/40 | **changed for consistency only** — `padding-inline: 0` and `width: var(--tzuchi-button-block-size)` restate HeroUI's intent (square, no padding) against the higher-specificity base rule above. Without them icon-only buttons would inherit 24px inline padding. |

## Collateral: ButtonGroup

`button-group.css:23-55` neutralises the radius (`.button-group .button { rounded-none }`)
and re-rounds only the outer corners. That selector is `(0,2,0)` — exactly the same
specificity as `[data-theme^="tzuchi"] .button`, and the Tzu Chi component file is
imported **later** in the `components` layer. So the radius rule (already present today
in `themes/tzuchi/components/index.css`) silently wins and every button in a group gets
8px corners, i.e. the group stops reading as one joined control.

The override therefore restates the group's corner logic at `(0,3,0)` / `(0,4,0)` /
`(0,5,0)` with the Tzu Chi radius. Nothing else about ButtonGroup changes — the
separator, the `transform: none` on press and the outline border-collapsing rules are
untouched. **This is a pre-existing bug in the current `index.css`, not one introduced
here.**

## Not transferable

1. **tc has no size axis.** `sm` and `lg` are HeroUI-only; their heights and padding are
   an extrapolation on Tzu Chi's 4/8/12px spacing rhythm, not a Figma decision.
2. **tc has no icon-only, ghost, tertiary, danger or danger-soft variant**, and no
   ButtonGroup. Those keep HeroUI's own treatment.
3. **`--default` / `--default-foreground` are unmapped** in the Tzu Chi theme, so
   `tertiary` and `ghost` still render HeroUI's neutral grey. Theme-level, fix in
   `generate.mjs`.
4. **tc's `border: 1px solid transparent` on every variant** is a layout-shift guard that
   HeroUI does not need (border-box + fixed height).
5. **tc's `outline`-based focus ring** vs HeroUI's `box-shadow` ring: same width, offset
   and colour, different mechanism. Left as HeroUI's.
6. **tc's responsive behaviour** — there is none; HeroUI's `md:` height/width
   densification is dropped for the heights (one value at every width) but kept in the
   icon `sm:size-4` rule, which tc says nothing about.

## Extra theme variables needed

None. Every colour in the override comes from an existing HeroUI theme variable
(`--accent`, `--accent-soft`, `--accent-soft-hover`), each of which the generated
Tzu Chi theme already resolves to the correct value in both modes.
`--tzuchi-button-block-size` is a local `calc()` helper built from mode-independent
`--tc-*` dimension tokens, not a colour, so it is deliberately not a theme variable.

## Machine-checkable expectations

Story `components-buttons-button--default`, `<html data-theme="tzuchi">` (values are
mode-independent, so `tzuchi-dark` gives the same numbers), selector `.button--primary`:

| property | expected |
|---|---|
| `border-top-left-radius` | `8px` |
| `height` | `42px` |
| `padding-inline-start` | `24px` |
| `font-size` | `16px` |
| `font-weight` | `700` |
| `line-height` | `24px` |
