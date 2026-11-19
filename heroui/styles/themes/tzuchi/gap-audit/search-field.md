# SearchField — Tzu Chi vs HeroUI gap inventory

**tc-search-bar** (Lit, `packages/components/src/search-bar/tc-search-bar.styles.ts`,
tokens `packages/tokens/src/component/search-bar.tokens.json`) ↔ **HeroUI `SearchField`**
(`heroui/styles/components/search-field.css`,
`heroui/react/src/components/search-field/search-field.tsx`).

Override file: `heroui/styles/themes/tzuchi/components/search-field.css`
(draft at `scratchpad/atoms2/css/search-field.css`).

> `tc-search-bar` is a **composite**: category `<select>` + text field + submit `<button>`.
> Only the text-field half — the `.bar` shell and `.input` — is in scope here. The two
> composite wings are listed under "Not transferable" for a later composites layer.
>
> HeroUI's `SearchField` does **not** use `input-group.css`; the two files are siblings that
> share a shape but no selector. Nothing in the InputGroup override applies here.

**Verdict: minor gaps.** Colour, radius, border width, field shadow, disabled treatment and
the 4px label→field gap already land correctly through `themes/tzuchi/variables.css`. What was
still HeroUI's: a fixed 36px shell height, the `sm:` type step-down, a 12px inline inset, a
16px grey magnifier, a placeholder that never got its token, a focus edge that stays grey, and
an invalid edge that resolves to `currentColor`. **9 declarations across 5 selectors;
16 properties kept.**

## Variant mapping

| Tzu Chi | HeroUI | note |
|---|---|---|
| `tc-search-bar` — one single look (bordered bar on surface) | `.search-field` / `.search-field--primary` | 1:1 |
| — none — | `.search-field--secondary` (neutral `--default` fill, `shadow-none`) | kept; inherits every rule below, since they all hang off the shared BEM classes. `--default` is now mapped (#F2F2F2 light / #333333 dark), so this variant is finally on-brand. It also carries the theme-wide 1px `--field-border` — correct for Tzu Chi, where every field is bordered |
| `:host { display: block }` — always full width | `.search-field--full-width` + `.search-field__group--full-width` | kept; HeroUI's opt-in is strictly more flexible |

## Gap table

Resolved light / dark where they differ. HeroUI values are resolved **under
`data-theme="tzuchi"` / `"tzuchi-dark"`** (i.e. after `themes/tzuchi/variables.css`), with the
stock HeroUI value in parentheses when the theme already changed it. Short file names:
`tc` = `tc-search-bar.styles.ts`, `tci` = `tc-input.styles.ts`, `sf` = `search-field.css`,
`var` = `themes/tzuchi/variables.css`, `util` = `styles/utilities/index.css`,
`th` = `themes/shared/theme.css`, `def` = `themes/default/variables.css`.

| property | Tzu Chi | HeroUI | action |
|---|---|---|---|
| **radius (shell)** | `tc:19` `--tc-search-bar-radius` → `--tc-radius-md` = **8px** (both modes) | `sf:24` `rounded-field` → `th:55` `--radius-field` → `var:20` `--field-radius` = **8px** (stock `calc(0.5rem × 1.5)` = 12px) | kept — theme already resolves to 8px |
| **height (shell)** | `tc:12-24` `.bar` declares none; derived from `.input` = 1 + 8 + 25.6 + 8 + 1 = **43.6px** | `sf:24` `h-9` = a **fixed 36px**. Its own input is 36px only at ≥40rem (`sm:text-sm`); below that the input is 40px and is **clipped** by the shell's `overflow-hidden` — an upstream bug | **changed → `block-size: auto` + `min-block-size: calc(16px × 1.6 + 2×8px + 2×1px)` = 43.6px** — content-driven like `.bar`, floored at the themed Input's height |
| **height (input)** | `tc:100,103` 8 + 25.6 + 8 = **41.6px** | `sf:83` `py-2` + `text-base sm:text-sm` = **40px** below 40rem, **36px** above | follows from the type change → **41.6px** at every width |
| **min-size (affixes)** | magnifier **20px** (`tc:148-149`) | icon `size-4` = 16px; clear button `size-5` = 20px (`sf:131,134`) | icon **changed → 20px**; clear button kept (no tc counterpart) |
| **padding-block (input)** | `tc:100` `var(--tc-space-8)` = **8px** | `sf:83` `py-2` = **8px** | kept — identical |
| **padding-inline (input)** | `tc:100` `var(--tc-space-20)` = **20px** | `sf:83` `px-3` = **12px**; the more specific `sf:93-100` rules override to `ps-2` / `pe-2` = **8px** next to the icon / clear button | **changed → `padding-inline: var(--tc-space-20, 20px)`** (0,2,0). HeroUI's `ps-2` / `pe-2` (0,3,0) deliberately still win next to an affix — 8px is exactly tc's `.control` gap |
| **inline inset — leading** | `tc:100` text starts **20px** from the edge (tc draws no leading icon) | `sf:131,95` `ms-3`(12) + icon(16) + `ps-2`(8) = **36px** | **changed → 20 + 20 + 8 = 48px**, i.e. affix at the tc 20px inset, 8px gap to the text |
| **inline inset — trailing** | `tc:100` **20px** (submit button is full-bleed, not an inset affix) | `sf:99,133` `pe-2`(8) + clear(20) + `me-2`(8) = **36px** | **changed → `margin-inline-end: 20px`** on the clear button → 8 + 20 + 20 = **48px**, symmetrical with the leading side |
| **gap (affix ↔ text)** | `tci:27` `.control { gap: var(--tc-space-8) }` = **8px** (tc-search-bar has no affix of its own) | `sf:95,99` `ps-2` / `pe-2` = **8px** | kept — identical, and it is why the `padding-inline` change above is scoped to the affix-less case |
| **gap (field stack)** | `tci:11` `.field { gap: var(--tc-space-4) }` = **4px** | `sf:3` `.search-field { gap-1 }` = **4px** | kept — identical |
| **border-width** | `tc:18` **1px** | `sf:25` `var(--border-width-field)` → `th:56` → `var:21` `--field-border-width` = **1px** (stock 0px) | kept — theme already 1px |
| **border-style** | `solid` | `solid` (Tailwind preflight) | kept |
| **border-colour (rest)** | `tc:18` `--tc-search-bar-border` → `color.border.default` = **#bdbdbd** / **#6b6b6e** | `sf:26` `var(--field-border)`; `var:58` / `var:100` = **#bdbdbd** / **#6b6b6e** | kept — identical |
| **background (shell)** | `tc:17` `--tc-search-bar-bg` → `color.surface.default` = **#ffffff** / **#1c1c1e** | `sf:24` `bg-field` → `var:55` / `var:97` `--field-background` = **#ffffff** / **#1c1c1e** | kept — identical |
| **background (input)** | `tc:102` `transparent` | `sf:83` `bg-transparent` | kept — identical |
| **text colour** | `tc:104` `--tc-search-bar-text` → `color.text.default` = **#333333** / **#f2f2f2** | `sf:24` `text-field-foreground` → `var:56` / `var:98` = **#333333** / **#f2f2f2** | kept — identical |
| **placeholder colour** | `tc:108-111` `--tc-search-bar-placeholder` → `color.text.muted` = **#828282** / **#b3b3b3**, `opacity: 1` | **`sf:83` never applies `placeholder:text-field-placeholder`** the way `input.css:2` and `input-group.css:70` do (verified in the compiled bundle: `.input::placeholder` exists, `.search-field__input::placeholder` does not). The hint therefore falls through to Tailwind preflight, `color-mix(in oklab, currentcolor 50%, transparent)` = the field foreground at half alpha ≈ **#999999** on white / **#878788** on #1c1c1e | **changed → `&::placeholder { color: var(--field-placeholder) }`** = #828282 / #b3b3b3. Preflight already pins `opacity: 1`, so that is not repeated |
| **font-family** | `tc:103` `--tc-typography-body` → `'Noto Sans TC', system-ui, -apple-system, 'PingFang TC', 'Microsoft JhengHei', sans-serif` | preflight `font: inherit` → `html, body { font-family: var(--font-sans) }`; `var:25` `--font-sans` = the same stack | kept — identical |
| **font-size** | `tc:103` **16px** at every width | `sf:83` `text-base sm:text-sm` = **16px** below 40rem, **14px** from 40rem up. (The shell's `text-sm` at `sf:24` is inert — the input re-declares its own.) | **changed → `var(--tc-font-size-16, 16px)`**, killing the `sm:` step-down |
| **font-weight** | `tc:103` `--tc-typography-body` = **400** | not set → inherited `normal` = **400** | kept — identical |
| **line-height** | `tc:103` **1.6** → 25.6px | `text-base` = 1.5 (24px); `sm:text-sm` = 1.4286 (**20px**) | **changed → `var(--tc-line-height-relaxed, 1.6)`** → 25.6px |
| **icon size** | `tc:148-149` `var(--tc-size-icon-sm)` = **20px** (the CSS fallback literal says 18px — see follow-up 5) | `sf:131` `size-4` = **16px** | **changed → `inline-size`/`block-size: var(--tc-size-icon-sm, 20px)`** |
| **icon colour** | `tc:122` `--tc-search-bar-icon-fg` → `color.brand.primary` = **#1b2d58** / **#a9c2ea** | `sf:129` `text-field-placeholder` = **#828282** / **#b3b3b3** | **changed → `color: var(--accent)`**, which resolves to `color.brand.primary` in both Tzu Chi modes by construction (`var:30` / `var:72`) |
| **clear-button size / glyph** | no counterpart | `sf:134,138` `size-5` = 20px, glyph `size-3` = 12px, `rounded-xl` = 12px, `bg-default` / `text-muted` | kept — nothing to copy; only its inline inset was moved |
| **hover — border** | `tc:26-28` `--tc-search-bar-border-hover` → `color.border.focus` = **#4f7bbe** / **#a9c2ea** | `sf:42-44` `var(--field-border-hover)`; `var:59` / `var:101` = **#4f7bbe** / **#a9c2ea** | kept — identical |
| **hover — background** | unchanged | `sf:42` `bg-field-hover` → `def:135` `--field-hover` = `color-mix(field-background 90%, field-foreground 2%)` ≈ a **2%** tint | kept — below the noticing threshold; removing it needs a colour declaration for no gain (same call as pass-1 `input.md`) |
| **focus — border** | `tc:31-32` `--tc-search-bar-border-focus` → `color.border.focus` = **#4f7bbe** / **#a9c2ea** | `sf:48-51` applies **only** `status-focused-field`; the edge stays at `--field-border` **#bdbdbd** / **#6b6b6e**. `input.css:29` and `input-group.css:36` both *do* repaint it — `sf` is the odd one out upstream | **changed → `border-color: var(--field-border-focus)`** on `:focus-within` / `[data-focus-within="true"]` |
| **focus — ring** | `tc:33-34` `box-shadow: 0 0 0 3px` in `--tc-search-bar-focus-ring` → `color.brand.surface-hover` = **#d1deff** (blue-200) / **#30559f** (blue-700) | `sf:50` `status-focused-field` → `util:53` → `focus-field-ring` = `ring-2 ring-focus`, `--tw-ring-offset-width: 0px` → **2px solid `--focus`** = **#4f7bbe** / **#a9c2ea** (`var:47` / `var:89`) | **kept, deliberate** — same call pass 1 made for Input (`gap-audit/input.md`): overriding means re-declaring `box-shadow`, which fights Tailwind's `--tw-ring-shadow` composition and the `shadow-field` stack. Cosmetic delta: 2px solid vs 3px pale halo. **See follow-up 1** — pass-1 `textarea.css` went the other way |
| **focus — background** | unchanged | not set by `sf` (unlike `input.css:30`, and `--field-focus` = `--field-background` anyway) | kept — no-op either way |
| **focus (inner controls)** | `tc:57-61, 137-141` 2px inset outline in `color.border.focus` on the select / submit | the clear button uses `status-focused` (`close-button.css:22-25`) = 2px `--focus` ring, offset `var:24` = 2px | kept — composite-only on the tc side; HeroUI's is equivalent machinery |
| **invalid — border** | none on `tc`; the Tzu Chi field rule is `tci:65-69` → `color.feedback.error` = **#d4494f** / **#f08a8e**, and it survives hover *and* focus | `sf:54-58` `border-color: var(--color-field-border-invalid)` — **a variable nothing in `heroui/styles/` ever defines**, so the declaration is IACVT and the edge falls back to `currentColor` (the field foreground). Plus `status-invalid-field` = 1px `--danger` outline | **changed → `border-color: var(--danger)`** on `[data-invalid="true"]`, declared after the focus rule so focus cannot outrank it, **plus** a mirrored `@media (hover: hover)` rule (0,4,0 / 0,5,0) so the base hover rule (0,3,0) cannot repaint it — the same cascade fix pass 1 applied to Input and Textarea |
| **invalid — ring** | `tci:71-73` `0 0 0 3px` in the error colour when focused | `util:20-27` `ring-2 ring-danger`, offset 0 | kept — same intent, 2px vs 3px |
| **invalid — background** | unchanged | `sf:56` `var(--field-focus)` = `var(--field-background)` → no-op | kept |
| **invalid — description** | n/a | `sf:5-10` hides `[data-slot="description"]` when invalid | kept — HeroUI-only composition rule |
| **disabled** | `tc:152-160` `opacity: var(--tc-search-bar-disabled-opacity)` = **0.38** (`var:23` matches) + `cursor: not-allowed` on the inner controls | `sf:61-64` `status-disabled` → `util:61-65` `opacity: var(--disabled-opacity)` = **0.38**, `cursor: var(--cursor-disabled)` = **not-allowed** (`def:30`), plus `pointer-events: none` | kept — identical; HeroUI's extra `pointer-events: none` is strictly better |
| **empty state** | n/a | `sf:16-20` `[data-empty="true"]` → clear button `opacity-0 pointer-events-none` (keeps its box, so the inset above still holds) | kept — HeroUI-only |
| **elevation** | none on `.bar` | `sf:24` `shadow-field` → `var:22` `--field-shadow` = **`0 0 0 0 transparent`** (stock: a 3-layer field shadow); `--secondary` adds `shadow-none` | kept — theme already flattened it |
| **overflow** | `tc:20` `overflow: hidden` | `sf:24` `overflow-hidden` | kept — identical |
| **alignment** | `tc:14` `align-items: stretch` | `sf:24` `items-center` | kept — tc stretches only so the full-bleed select/submit reach the edges; see "Not transferable" |
| **motion** | `tc:21-23` `border-color` + `box-shadow`, **150ms** `cubic-bezier(0.2, 0, 0, 1)` (`--tc-motion-duration-fast` / `--tc-motion-easing-standard`) | `sf:32-36` `background-color 150ms var(--ease-smooth)` (= `ease`, `th:114`), `border-color 150ms`, `box-shadow 150ms var(--ease-out)`, then `motion-reduce:transition-none` | kept — same 150ms; only the curve differs, imperceptible on a 150ms colour fade, and re-declaring the shorthand would fork upstream's property list and sit ahead of the `motion-reduce` guard (same call as every pass-1 file) |
| **autofill** | n/a | `sf:75-79, 115-125` lifts the UA autofill paint onto the shell | kept — HeroUI-only, and strictly better |
| **variant `--secondary`** | no tc equivalent | `sf:147-177` `--search-field-group-bg: var(--default)` + `-hover` / `-focus`, `shadow-none` | kept — inherits the new density/type. One tie worth knowing: `.search-field--secondary .search-field__group[data-invalid="true"]` (`sf:168`) is also (0,3,0), so the danger border above wins on **import order**, which `components/index.css` guarantees |
| **variant `--full-width`** | host-level block display | `sf:180-186` `w-full` on base + group | kept — equivalent |

## Extra theme variables

**None.** Every colour the Tzu Chi design asks for was already a HeroUI theme variable in both
modes: `--accent` **is** `color.brand.primary` by construction (`var:30` / `var:72`),
`--field-border-focus` **is** `color.border.focus`, and `--danger` **is**
`color.feedback.error`. No `--tzuchi-search-field-*` was invented.

## Not transferable

- **Category `<select>` + chevron** (`tc:38-93`) — `700 16px/1.5` subtitle type,
  `8px 12px` padding, `max-inline-size: 9rem`, `surface.subtle` fill, a 1px inline-end
  divider, `appearance: none` and a 20px chevron glyph. HeroUI expresses this as a separate
  **Select** next to the field. Composite layer.
- **Submit `<button>`** (`tc:114-150`) — `8px 16px` padding, `surface.subtle` fill,
  `brand.surface-hover` on hover, a 1px inline-start divider, a 20px magnifier and its own
  2px inset `:focus-visible` outline. HeroUI's SearchField has **no submit affordance** at
  all (Enter submits, or a sibling `Button` does, as in the `FormExample` story). Only the
  magnifier's **colour and size** were lifted onto HeroUI's leading `SearchIcon`; the button
  chrome was not. Composite layer.
- **`align-items: stretch` on `.bar`** (`tc:14`) — exists only so those two full-bleed wings
  reach the shell's edges. For an icon + input + clear layout `items-center` is correct.
- **`role="search"` `<form>`, Enter-to-search, the `tc-search` / `tc-input` /
  `tc-category-change` events, `value` / `category` attribute reflection, `delegatesFocus`**
  (`tc-search-bar.ts:42-194`) — behaviour. `react-aria-components`' `SearchField` covers the
  equivalents (`onChange`, `onSubmit`, `onClear`, Escape-to-clear, `aria-label` wiring).
- **`:host(:focus-within)` plumbing** — tc puts focus on the wrapper via `delegatesFocus`;
  HeroUI uses `:focus-within` / `[data-focus-within="true"]` on the react-aria `Group`.
  Same states, different plumbing.
- **The clear button itself** — `data-empty` collapse, `CloseButton` chrome (`bg-default`,
  `rounded-xl`, press `scale(0.93)`), 12px glyph. HeroUI-only; Tzu Chi has no clear
  affordance to copy, so only its inline inset was aligned.
- **Label / Description / FieldError** — HeroUI splits them into `label.css`,
  `description.css`, `field-error.css`. `tc-search-bar` renders none of them (its
  `placeholder` doubles as the `aria-label`).
- **The `sm:` breakpoint step-down** — HeroUI-only idea; Tzu Chi has one body size. Killed
  rather than transferred.
- **`--search-field-group-bg` / `-hover` / `-focus`** (`sf:151-153`) — a HeroUI-only knob on
  the secondary variant, no tc counterpart.
- **`--tc-search-bar-*` colour tokens** (`bg`, `border`, `border-hover`, `border-focus`,
  `focus-ring`, `focus-ring-color`, `text`, `placeholder`, `icon-fg`, `submit-bg`,
  `submit-bg-hover`, `category-bg`, `category-fg`, `divider`) — all forbidden by the colour
  rule, and all already expressed by `--field-*`, `--accent`, `--focus` and `--danger`.
  `--tc-search-bar-radius` and `--tc-search-bar-disabled-opacity` are mode-independent and
  *would* be usable, but both already resolve to the same value the theme produces, so
  referencing them would add noise, not correctness.

## Follow-ups (not fixed here)

1. **Focus-ring inconsistency inside pass 1.** `input.css` kept HeroUI's 2px `--focus` ring;
   `textarea.css` replaced it with tc's 3px `--accent-soft-hover` halo. This file follows
   **Input**, because the brief asks SearchField to match the themed Input. One of the two
   should be made canonical for all three fields (and, if the halo wins, for `Select` and
   `InputGroup` too).
2. **`--color-field-border-invalid` is defined nowhere.** Referenced by `input-group.css`,
   `color-input-group.css`, `number-field.css`, `date-input-group.css` and `search-field.css`
   (10 sites). Every one of them is IACVT today, so the invalid border of all five components
   falls back to `currentColor` in **stock HeroUI too**. Worth a one-line base fix
   (`--color-field-border-invalid: var(--danger)` in `themes/shared/theme.css`) rather than
   five theme overrides.
3. **`.search-field__input` never gets `placeholder:text-field-placeholder`**, unlike
   `input.css:2` and `input-group.css:70`. Patched in the override for the Tzu Chi themes, but
   the base-CSS gap remains for stock `light` / `dark`: one `@apply` word in
   `styles/components/search-field.css:83` fixes it for everyone.
4. **`h-9` vs a 40px input below `sm:`** — stock HeroUI clips its own search input at narrow
   viewports (`overflow-hidden` on a fixed 36px shell). The override removes the symptom for
   Tzu Chi; upstream still has it.
5. **`--tc-size-icon-sm` is 20px but `tc-search-bar.styles.ts:148-149` and `:81` fall back to
   `18px`.** Same class of source inconsistency the pass-1 README flagged for
   checkbox/radio (24 vs 32px). The override follows the **token** (20px). Worth a Figma
   check.
6. **`tc-search-bar` has no invalid state** in its own CSS or tokens, so the invalid rule here
   is borrowed from `tc-input`. If SearchBar is meant to never be invalid, the HeroUI
   `Invalid` story simply has no Tzu Chi reference.

## Machine-checkable expectations

Story `components-forms-searchfield--default`, viewport ≥ 40rem, initial state (no reveal
step; the clear button is `opacity: 0` but still boxed, so its margin is measurable).

| selector | property | expected | was (HeroUI base, themed) |
|---|---|---|---|
| `.search-field__group` | `min-height` | `43.6px` | `0px` (only `height: 36px`) |
| `.search-field__input` | `font-size` | `16px` | `14px` |
| `.search-field__input` | `line-height` | `25.6px` | `20px` |
| `.search-field__search-icon` | `width` | `20px` | `16px` |
| `.search-field__search-icon` | `height` | `20px` | `16px` |
| `.search-field__search-icon` | `margin-inline-start` | `20px` | `12px` |
| `.search-field__clear-button` | `margin-inline-end` | `20px` | `8px` |

Not asserted, on purpose: the shell's used `height` (43.6px lands on a sub-pixel LayoutUnit
boundary and is reported fractionally), `border-top-left-radius` (8px) and `border-top-width`
(1px) — the last two already come from `themes/tzuchi/variables.css`, not from this file.
Also unasserted: `.search-field__input` `padding-inline-start` / `-end`, which stay at the
base `8px` in this story by design — the 20px only applies when the matching affix is absent.
