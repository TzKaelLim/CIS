# textarea — tc-textarea ↔ HeroUI `.textarea`

**Closeness: minor gaps.** The generated Tzu Chi theme already carries radius, border
width, every colour, the field shadow, the disabled opacity and the font family. What
was left was density (inline padding), the 96px text box, one body type size at all
widths, the focus halo and the invalid border. Six declarations plus two state blocks.

**Override file:** `scratchpad/atoms/css/textarea.css` → destined for
`heroui/styles/themes/tzuchi/components/textarea.css`.

## Variant mapping

| Tzu Chi | HeroUI | Note |
|---|---|---|
| `tc-textarea` (the only shape Tzu Chi ships) | `.textarea` / `.textarea--primary` | 1:1 |
| — | `.textarea--secondary` | No Tzu Chi counterpart. Keeps HeroUI's neutral `--default` fill (`themes/tzuchi/variables.css:13` records `--default` as unmapped on purpose) and inherits all six shape/type/state changes, because every rule hangs off `.textarea`. |
| `:host { display: block }` (always full width) | `.textarea--full-width` | HeroUI makes it opt-in; left untouched. |

Structural difference behind most of the numbers: HeroUI's `.textarea` **is** the
`<textarea>` — border, radius, padding and `min-height` all sit on it. `tc-textarea`
wraps a borderless, padding-less `<textarea>` in a `.control` div that carries the
border, radius and padding. So tc's `min-height: 96px` is the *text box*, while
HeroUI's `min-height` is the *whole bordered box*.

## Gap table

Values are resolved for the Tzu Chi themes (light / dark where they differ).
`tc` = `packages/components/src/textarea/tc-textarea.styles.ts`,
`hui` = `heroui/styles/components/textarea.css`,
`thm` = `heroui/styles/themes/tzuchi/variables.css`.

| Property | Tzu Chi | HeroUI (under `data-theme="tzuchi*"`) | Action |
|---|---|---|---|
| border-radius | `tc:28` `--tc-textarea-radius` → `--tc-radius-md` = **8px** | `hui:3` `rounded-field` → `--field-radius` (`thm:20` = `--tc-radius-md`) = **8px** | kept — the theme already resolves it |
| min-height | `tc:49` **96px** on the inner `<textarea>`; total box = 96 + 2×8 padding + 2×1 border = **114px** | `hui:6` **38px** on the bordered box | **changed** → `calc(--tc-textarea-min-height + 2×--tc-space-8 + 2×--field-border-width)` = **114px** |
| padding-block | `tc:29` `--tc-space-8` = **8px** | `hui:3` `py-2` = **8px** | kept — identical |
| padding-inline | `tc:29` `--tc-space-20` = **20px** | `hui:3` `px-3` = **12px** | **changed** → `var(--tc-space-20, 20px)` |
| gap | `tc:11` `.field` gap 4px — that is the label/control/helper stack, which is HeroUI's **TextField** (`components/textfield.css:4` `gap-1` = 4px, already identical), not the textarea | — | n/a for this component |
| border-width | `tc:27` **1px** | `hui:7` `--border-width-field` → `--field-border-width` (`thm:21`) = **1px** | kept |
| border-style | solid | solid | kept |
| border-color (rest) | `tc:27` `color.border.default` = **#bdbdbd / #6b6b6e** | `hui:8` `--field-border` (`thm:56`/`thm:91`) = **#bdbdbd / #6b6b6e** | kept — exact |
| border-color (hover) | `tc:36` `color.border.strong` = **#828282 / #95969b** | `hui:24` `--field-border-hover` (`thm:57`/`thm:92`) = **#4f7bbe / #a9c2ea** (blue) | **kept — theme-owner decision.** `generate.mjs:63` maps `--field-border-hover` → `color.border.focus` on purpose, matching `--tc-input-border-hover` and `--tc-search-bar-*`. Tzu Chi itself is inconsistent here: every other field hovers to blue, only `tc-textarea` hovers to grey. Overriding it per-component would re-litigate the theme and split textarea from input. Flagged for the token owners. |
| border-color (focus) | `tc:41` `color.border.focus` = **#4f7bbe / #a9c2ea** | `hui:32` `--field-border-focus` (`thm:58`/`thm:93`) = **#4f7bbe / #a9c2ea** | kept — exact |
| border-color (invalid) | `tc:75` `color.feedback.error` = **#d4494f / #f08a8e** | `hui:37` keeps `--field-border` grey and adds a 1px `--danger` outline (`utilities/index.css:16`) | **changed** → `border-color: var(--danger)` on `[data-invalid="true"]`. HeroUI's 1px danger outline is left on top (it survives forced-colors mode); the result reads as one ~2px danger edge instead of tc's 1px. |
| background (rest) | `tc:26` `color.surface.default` = **#ffffff / #1c1c1e** | `hui:3` `bg-field` → `--field-background` (`thm:53`/`thm:88`) = **#ffffff / #1c1c1e** | kept — exact |
| background (hover) | none (unchanged) | `hui:21-22` `bg-field-hover` = `color-mix(field-bg 90%, field-fg 2%)` ≈ **#fafafa / #1e1e20** | kept — a ~2% tint, imperceptible; not worth a rule |
| background (focus/invalid) | none | `hui:33,38` `--field-focus` = `--field-background` → no change | kept — resolves to a no-op |
| color | `tc:55` `color.text.default` = **#333333 / #f2f2f2** | `hui:3` `text-field-foreground` → `--field-foreground` (`thm:54`/`thm:89`) = **#333333 / #f2f2f2** | kept — exact |
| placeholder colour | `tc:67` `color.text.muted` = **#828282 / #b3b3b3**, `opacity: 1` | `hui:3` `placeholder:text-field-placeholder` → `--field-placeholder` (`thm:55`/`thm:90`) = **#828282 / #b3b3b3** | kept — exact. (NOTICE.md already flags #828282 as 3.84:1 on white; that is a token-owner item, identical on both sides.) |
| font-family | `tc:54` `--tc-font-family-base` = Noto Sans TC, … | inherited `--font-sans` (`thm:25` = `--tc-font-family-base`); Tailwind preflight gives form controls `font: inherit` | kept — exact |
| font-size | `tc:54` **16px** at every width | `hui:3` `text-base` = 16px, `sm:text-sm` = **14px at ≥40rem** | **changed** → `var(--tc-font-size-16, 16px)`, flat |
| line-height | `tc:54` **1.6** → 25.6px | `hui:3` `--text-base--line-height` 1.5 → 24px; at ≥40rem `--text-sm--line-height` ≈ 1.4286 → **20px** | **changed** → `var(--tc-line-height-relaxed, 1.6)` = 25.6px |
| font-weight | `tc:54` **400** | not set; inherits 400 | kept — identical |
| icon sizes | none — `tc-textarea` has no icons | none | n/a |
| focus ring | `tc:42` `box-shadow: 0 0 0 3px` `color.brand.surface.hover` = **#d1deff / #30559f** (pale halo), outline none | `hui:31` `status-focused-field` → `ring-2 ring-focus`, offset 0 → **2px solid `--focus`** (#4f7bbe / #a9c2ea) | **changed** → `box-shadow: 0 0 0 3px var(--accent-soft-hover)`. `--accent-soft-hover` is exactly `color.brand.surface.hover` in both modes (`thm:34` blue-200, `thm:69` blue-700), so no new variable. ⚠️ This is a *weaker* indicator than upstream's: the 3px halo is ~1.2:1 on white, leaving the #bdbdbd→#4f7bbe border change (~2.2:1) as the real signal, under WCAG 2.2 §2.4.13's 3:1. It is the Tzu Chi system decision (`--tc-input-focus-ring` and `--tc-search-bar-focus-ring` use the same tint) — flagged, not silently deviated from. |
| focus ring offset | — | `--ring-offset-width` (`thm:24`) = `--tc-focus-ring-offset` = 2px, but `focus-field-ring` forces 0 | n/a — the halo sits flush, as in tc |
| focus ring (invalid) | `tc:79` `0 0 0 3px` `feedback.error` (solid) | `hui:37` → `invalid-field-ring` focused branch: `ring-2 ring-danger` | **changed** → `box-shadow: 0 0 0 3px var(--danger)`. Needed explicitly: base `.textarea[data-invalid=true]:focus` is (0,3,0), the same specificity as my `:focus` rule, so without a (0,4,0) rule the pale halo would have won on an invalid focused field. |
| disabled | `tc:83-88` opacity `--tc-opacity-disabled` = **0.38**, `cursor: not-allowed` | `hui:45` `status-disabled` → `--disabled-opacity` (`thm:23` = `--tc-opacity-disabled`) = **0.38**, `--cursor-disabled` = not-allowed, plus `pointer-events: none` | kept — `pointer-events: none` is extra but harmless on a natively disabled control |
| elevation / shadow | `tc:24-33` none on `.control` | `hui:3` `shadow-field` → `--field-shadow` (`thm:22`) = `0 0 0 0 transparent` | kept — the theme already flattens it |
| motion | `tc:30-32` border-color + box-shadow **150ms** `cubic-bezier(0.2, 0, 0, 1)` | `hui:14-17` background-color/border-color 150ms `--ease-smooth` (= `ease`), box-shadow 150ms `--ease-out` | kept — same 150ms; the easing difference is imperceptible at that duration and re-declaring the shorthand would fork upstream's property list |
| reduced motion | `tc:102-106` transition none | `hui:18` `motion-reduce:transition-none` | kept — identical |
| resize | `tc:57` **vertical** (`tc:61` `none` when `auto-resize`) | not set → browser default **both** | **changed** → `resize: vertical`. The `auto-resize` variant has no HeroUI counterpart (see below). |

## Not transferable

- **Label, required mark, helper/error text** (`tc:14-22`, `tc:91-100`) — in HeroUI these
  belong to `TextField` (`Label`, `Description`, `FieldError`), not to `TextArea`.
  `tc`'s subtitle label (700 16px/1.5) and 16px helper text should be handled in the
  `textfield` override, not here. The `.field` 4px stack gap already matches
  `components/textfield.css:4` (`gap-1`).
- **`auto-resize`** (`tc:61-64`, `tc-textarea.ts:93-98`) — a JS-driven height sync with
  `resize: none; overflow: hidden`. HeroUI has no equivalent prop; it would need a React
  change, which is out of scope for a theme file.
- **`.textarea--secondary`** — Tzu Chi has no second textarea fill. It keeps HeroUI's
  `--default` neutral, which `themes/tzuchi/variables.css:13` lists as an unmapped
  variable (no `@tzuchi/tokens` equivalent yet). Nothing to transfer until a token exists.
- **Form-association / validity plumbing** (`tc-textarea.ts:30-98`) — behaviour, covered
  by `react-aria-components` on the HeroUI side.
- **`--tc-textarea-*` colour tokens** (`bg`, `border`, `border-hover`, `border-focused`,
  `border-invalid`, `text`, `placeholder`, `focus-ring-color`) — all forbidden by the
  colour rule and all already expressed by the generated `--field-*` theme variables.

## Extra theme variables

None. Every colour the Tzu Chi design asks for was already available as a HeroUI theme
variable in both modes — notably the focus halo, where `--accent-soft-hover` resolves to
`--tc-color-brand-surface-hover` (blue-200 light, blue-700 dark) by construction.

## Follow-ups for the token owners

1. `tc-textarea`'s hover border is `color.border.strong` (grey) while `tc-input` and
   `tc-search-bar` use `color.border.focus` (blue). The theme picked blue. One of the two
   Figma decisions should be corrected upstream.
2. The Tzu Chi field focus halo (3px `brand.surface.hover`) is below WCAG 2.2 §2.4.13 on
   its own. If that is not intentional, raising it is a design-system change affecting
   input, search-bar and textarea together, not a per-component tweak.

## Machine-checkable expectations

Story `components-forms-textarea--default` (`<TextArea placeholder="Describe your product" />`
→ `<textarea data-slot="textarea" class="textarea textarea--primary">`), viewport ≥ 640px:

| selector | property | expected | was (HeroUI base) |
|---|---|---|---|
| `textarea[data-slot="textarea"]` | `min-height` | `114px` | `38px` |
| `textarea[data-slot="textarea"]` | `height` | `114px` | ~`54px` (2 rows @ 20px + 16 + 2) |
| `textarea[data-slot="textarea"]` | `padding-inline-start` | `20px` | `12px` |
| `textarea[data-slot="textarea"]` | `font-size` | `16px` | `14px` |
| `textarea[data-slot="textarea"]` | `line-height` | `25.6px` | `20px` |
