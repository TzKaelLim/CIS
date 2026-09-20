# Unit report — `date-pickers` (DatePicker, DateRangePicker)

Pass 3, base layer. Neither component has a `tc-*` counterpart, so every value below is derived
from `DESIGN-LANGUAGE.md` and from the shipped overrides it cites (`select.css`,
`search-field.css`, `card.css`, `dropdown.css`).

Targets written:

- `heroui/styles/themes/tzuchi/components/date-picker.css` (3 rules, 5 declarations)
- `heroui/styles/themes/tzuchi/components/date-range-picker.css` (4 rules, 7 declarations)

Resolution constants under `[data-theme^="tzuchi"]`: `--radius` = `--tc-radius-md` = **8px**
(`themes/tzuchi/variables.css:19`), therefore `--radius-2xl` = 16px and `--radius-3xl` = 24px
(`themes/shared/theme.css:109-110`); `--field-radius` = 8px (`variables.css:20`);
`--tc-card-radius` = `--tc-radius-lg` = 16px (`tokens.css:165,51`); `--tc-size-icon-sm` = 20px
(`tokens.css:53`); `--tc-font-size-16` = 16px, `--tc-font-weight-bold` = 700,
`--tc-line-height-normal` = 1.5, `--tc-line-height-relaxed` = 1.6 (`tokens.css:84,85,93,94`).
None of those five `--tc-*` tokens is redeclared in `tokens.css`'s `[data-theme="dark"]` block
(verified by isolating everything from line 410 down), so all are mode-independent — N3 clean.

---

## DatePicker — `date-picker.css`

| property | HeroUI base (file:line + resolved value) | now (declaration + resolved value) | spec rule |
|---|---|---|---|
| `font-size` on `.date-picker__trigger` | `styles/components/date-picker.css:15` `@apply … text-sm` → **14px** | `font-size: var(--tc-font-size-16, 16px)` → **16px** | §1 R1 (control label); §1's mechanical "every 14px role moves to 16px" |
| `font-weight` on `.date-picker__trigger` | not set; inherits **400** from `body` | `font-weight: var(--tc-font-weight-bold, 700)` → **700** | §1 R1 / §1.2 ("is the control" → subtitle voice) |
| `line-height` on `.date-picker__trigger` | `date-picker.css:15` `text-sm` → `1.25rem` = **20px** | `line-height: var(--tc-line-height-normal, 1.5)` → **24px** | §1 R1 (1.5 is the control line-height, §1.2) |
| `width` / `height` on `.date-picker__trigger-indicator` | `date-picker.css:39` `@apply … size-4` → **16px** × 16px | `inline-size` / `block-size: var(--tc-size-icon-sm, 20px)` → **20px** × 20px | §1.3 (16px survives only for `.close-button` svg and the toast spinner); R54 / `search-field.css:179-180`; `select.css:192-195` |
| `border-radius` on `.date-picker__popover` | `date-picker.css:47` `min(32px, calc(var(--radius) * 2.5))` → min(32px, 20px) = **20px** | `border-radius: var(--tc-card-radius, var(--radius-2xl))` → **16px** | §6(b) R98 / §2 R30 — content popover takes the Card/Modal surface radius |

Derived trigger box after the change: 20px glyph + 2 × `p-1` (4px) = **28px** square (was 24px).

## DateRangePicker — `date-range-picker.css`

| property | HeroUI base (file:line + resolved value) | now (declaration + resolved value) | spec rule |
|---|---|---|---|
| `font-size` on `.date-range-picker__trigger` | `styles/components/date-range-picker.css:15` `text-sm` → **14px** | `font-size: var(--tc-font-size-16, 16px)` → **16px** | §1 R1 |
| `font-weight` on `.date-range-picker__trigger` | not set; inherits **400** | `font-weight: var(--tc-font-weight-bold, 700)` → **700** | §1 R1 / §1.2 |
| `line-height` on `.date-range-picker__trigger` | `date-range-picker.css:15` `text-sm` → **20px** | `line-height: var(--tc-line-height-normal, 1.5)` → **24px** | §1 R1 |
| `width` / `height` on `.date-range-picker__trigger-indicator` | `date-range-picker.css:39` `size-4` → **16px** × 16px | `inline-size` / `block-size: var(--tc-size-icon-sm, 20px)` → **20px** × 20px | §1.3; R54; `select.css:192-195` |
| `font-size` on `.date-range-picker__range-separator` | `date-range-picker.css:43` sets none; inherits `.date-input-group`'s `text-sm` (`styles/components/date-input-group.css:3`) → **14px** | `font-size: var(--tc-font-size-16, 16px)` → **16px** | §1 R2 (field value — it reads on the value line with the two date inputs) |
| `line-height` on `.date-range-picker__range-separator` | inherited **20px** | `line-height: var(--tc-line-height-relaxed, 1.6)` → **25.6px** | §1 R2 / §1.2 (1.6 is the prose line-height) |
| `border-radius` on `.date-range-picker__popover` | `date-range-picker.css:51` `min(32px, calc(var(--radius) * 2.5))` → **20px** | `border-radius: var(--tc-card-radius, var(--radius-2xl))` → **16px** | §6(b) R98 / §2 R30 |

---

## Left as HeroUI's (and why)

| what | why |
|---|---|
| Popover background `bg-overlay` | §6(b) R99. Explicitly "do not tint": `--accent-soft` is `tc-dropdown`'s **listbox** signature; on a calendar it would make a DatePicker read as a Select menu and would put day cells on a panel they were never contrast-checked against. |
| Popover `box-shadow: var(--overlay-shadow)` | §6(b) R100 + §6 shadow table. `--tc-elevation-*` are light-only literals (N2/N6). The dark-mode inset hairline is intentional (§6 "Dark mode keeps HeroUI's inset hairline for overlays — do not fix it per component"). |
| Popover padding `p-3` (12px) | §6(b) R102 — "leave HeroUI's; if the popover has none, use 16px". It has some. |
| Popover enter/exit animation, 150ms/100ms durations, `ease-smooth`, the four `[data-placement]` slide-ins, `origin-(--trigger-anchor-point)`, `overflow-y-auto`, `overscroll-contain`, `scrollbar-none`, `w-fit` | R140 (no choreography) and precedent: `dropdown.css` and `select.css`, the two popovers the 26 already theme, leave popover motion untouched. R133's enter retune has one precedent only (`modal.css:120-129`) and is a modal-family rule. |
| Trigger `rounded-field` | Already `--field-radius` = `--tc-radius-md` = 8px = R22. N5 / D1 forbid restating a theme variable. |
| Trigger `p-1`, `w-full`, `no-highlight`, `cursor: var(--cursor-interactive)`, `transition: box-shadow 150ms var(--ease-out)` + the `motion-reduce` guard after it | Spec is silent on this affix button's geometry. The resulting 28px box still clears WCAG 2.5.8's 24px minimum, and R136/R137 make touching a `transition` shorthand expensive for no gain. |
| Trigger `status-focused` ring and `status-disabled` | D2 / D3 / R70 / R85 — 2px `--focus` at `--ring-offset-width` 2px and `--disabled-opacity` 0.38 are already theme-wide. |
| Trigger ring **offset colour** (`--background`) | R71 only re-points the offset colour on a *tinted* panel. Here the trigger sits on `--field-background`, which differs from `--background` by 1.05:1 in light (white vs `gray-50`) and about the same in dark. Below the threshold that justified `dropdown.css:153-160`, and D3 says the ring is settled. Listed as a gap. |
| Indicator **colour** `text-field-placeholder` | The nearest Tzu Chi disclosure affordance is the Select chevron, which `select.css:180` points at `inherit` — resolving to `--field-placeholder` at rest. The SearchField magnifier's `--accent` (R54) comes from `--tc-search-bar-icon-fg`, a tc token with no DatePicker counterpart. Listed as a gap. |
| Trigger hover treatment | HeroUI gives this button none at all. R78/R80 describe hover fills for rows and container triggers, not for a field affix; adding one would be an invention. |
| `.date-picker` / `.date-range-picker` root `gap-1` (4px) and `inline-flex flex-col` | Already R141 (label ↔ control) and R142 (control ↔ description/error). "Do not restate." |
| The separator's `px-1` (4px) and `select-none` | 4px is already R154's micro gap. |
| The base rules that reach into `.date-input-group__suffix` / `__prefix` (`pointer-events-auto`) | Structural; D32. |
| **Everything on `.date-input-group`** — the shell height (`h-9`), border, background, hover/focus/invalid edges, its `text-sm`, the `__suffix`'s `me-3` (12px) inset, the `__input` padding, the `__segment` chrome | Rule 7 ownership: that is the **date-input-group unit**'s file. §3.4 R49-R54 and the §3.4 note ("New field-family components … DateField/DateInputGroup … follow R49-R54") are its rules to apply, including R53's 20px affix inset, which would otherwise collide here. |
| The Calendar / RangeCalendar inside the popover, including the two `__popover .<x>-calendar__nav-button-icon { rotate-0 }` rules | Owned by the calendar / range-calendar unit. |

## Cascade / specificity worksheet

| base declaration | base selector specificity | override selector | override specificity | result |
|---|---|---|---|---|
| `.date-picker__trigger { font-size; line-height }` (via `text-sm`) | (0,1,0) | `[data-theme^="tzuchi"] .date-picker__trigger` | (0,2,0) | wins; not order-dependent |
| `.date-picker__trigger-indicator { width; height }` (via `size-4`) | (0,1,0) | `[data-theme^="tzuchi"] .date-picker__trigger-indicator` | (0,2,0) | wins. `inline-size`/`block-size` and `width`/`height` map to the same used value and are resolved against each other by the ordinary cascade; the same pairing already ships at `search-field.css:179-180` against this identical base utility |
| `.date-picker__popover { border-radius }` | (0,1,0) | `[data-theme^="tzuchi"] .date-picker__popover` | (0,2,0) | wins |
| `.date-range-picker__range-separator` — no `font-size` at all | inherited from `.date-input-group` | `[data-theme^="tzuchi"] .date-range-picker__range-separator` | (0,2,0) | any declaration beats an inherited value; no conflict with the peer unit either, since both land on 16px |

No `!important` anywhere in either base file, so none is needed. No `@media`, `:has()`, `sm:`/`md:`
variant or per-size rule exists on any selector this unit touches — checked both base files end to
end. Neither override file duplicates or contradicts a declaration in any of the 26 shipped
override files (none of them mentions `date-picker`, `date-range-picker` or `date-input-group` —
verified by grep over `themes/tzuchi/components/`).

## Variants, sizes and states — nothing hidden

DatePicker and DateRangePicker ship **no** size scale and **no** colour variants (their
`*.styles.ts` are slot-only `tv()` maps with no `variants` key). Every state on the two base files
survives untouched:

- `.<x>__trigger:focus-visible:not([data-focused])` / `[data-focus-visible="true"]` → still `status-focused`.
- `.<x>__trigger:disabled` / `[data-disabled="true"]` / `[aria-disabled="true"]` → still `status-disabled` (0.38 + cursor + `pointer-events: none`).
- `.<x>__popover[data-entering="true"]` with its four `[data-placement^=…]` slide-ins, `[data-exiting="true"]`, and the shared `transition-[opacity,transform]` rule → untouched.
- `.<x>__popover:focus-visible` / `[data-focus-visible="true"] { outline-none }` → untouched.
- The `WithCustomIndicator` story (a consumer-supplied `size-4` Iconify glyph as the indicator's
  child) still renders at its own 16px — the override sizes the indicator **box**, not `svg`, so no
  custom icon is resized. The box simply centres it (`inline-flex items-center justify-center`).
- The invalid path (`WithValidation`, `FormExample`) lives entirely on `.date-input-group`
  (`status-invalid-field`) and on `FieldError`; nothing here touches it.

## Spec gaps (spec silent or NO EVIDENCE → most conservative choice taken)

1. **Trigger-indicator colour.** §1/§4/§5 give no rule for a disclosure glyph inside a field's own
   trailing button. R54 paints the SearchField's *leading* magnifier `--accent`, but that value is
   `tc-search-bar`'s own token; `select.css:180` leaves the chevron at `inherit` → `--field-placeholder`.
   Kept HeroUI's `text-field-placeholder`. If the owner wants the calendar glyph to read as the
   DatePicker's identity mark the way the magnifier does for SearchField, the one-line change is
   `color: var(--accent)` on `.date-picker__trigger-indicator`.
2. **Trigger-indicator size has no Figma source.** 20px is chosen because 16px is not on the Tzu Chi
   icon scale (20/32/40) and §1.3 lists the only two 16px glyphs the theme keeps. Both themed field
   affixes are 20px. But this is derivation, not evidence — Q8 territory.
3. **Cross-unit dependency: focus-ring clearance.** `.date-input-group` is `overflow-hidden`
   (`date-input-group.css:3`), so the trigger's ring (2px offset + 2px width = 4px) is clipped by the
   shell. With the 20px glyph the trigger is 28px tall: inside R41/R49's 43.6px shell there is 6.8px
   of clearance per side (fine), but inside HeroUI's un-themed `h-9` 36px shell there is only 3px, so
   1px of the ring would be cut. **This unit assumes the date-input-group unit applies R49 (`block-size:
   auto; min-block-size: 43.6px`).** If that unit ships nothing, the conservative fix is to leave the
   indicator at 16px rather than to add an inset ring (R73), since D3 says the ring is settled.
4. **Ring offset colour on a field affix.** R71 covers a *tinted* panel only. The trigger's 2px ring
   gap paints `--background` on top of `--field-background` (1.05:1 apart in light). Left alone; a
   `--tw-ring-offset-color: var(--field-background)` analogue would be the faithful reading if the
   owner wants it.
5. **Trigger box geometry.** No spec rule covers a field affix *button*: R45-R48 are the icon-only
   `Button` scale (36/48/64px boxes), which would be absurd inside a 43.6px field. HeroUI's `p-1`
   kept unchanged; the 28px result clears WCAG 2.5.8's 24px but not the 44px target §3.6 discusses
   for standalone controls.
6. **§6(b) R98 itself is unratified** — Q7 in the spec ("content-popover radius 16px vs 8px … sign-off
   wanted"). Both popover files land on 16px per the spec as written; if Q7 resolves the other way,
   the fix is one token swap per file (`--tc-dropdown-radius, var(--radius)`).
7. **Trigger type is invisible in every stock story.** R1's 16/700/1.5 is applied for correctness
   when a consumer labels the trigger; no story exercises it, so it is untested by eye.

## Checklist (§13)

1. Every rule is inside a single `[data-theme^="tzuchi"] { … }` block — no comma branches, no bare `&`. ✓
2. `grep -nE -- '--tc-color-|#[0-9a-f]{3}|rgb\(|hsl\(|oklch\(|!important'` and a physical-property grep on both files: **no matches**. ✓
3. `--tc-font-size-16`, `--tc-font-weight-bold`, `--tc-line-height-normal`, `--tc-line-height-relaxed`, `--tc-size-icon-sm`, `--tc-card-radius` all exist in `packages/tokens/dist/tokens.css`, all carry a fallback, none resolves to a colour or a shadow, none is redeclared in the dark block. ✓
4. Colours: **none declared**. The only theme variable referenced is `--radius-2xl`, as a fallback for a radius. ✓
5. Specificity hand-derived per declaration (table above), including a check that no `@media`, `:has()` or breakpoint rule competes. ✓
6. No `transition-property`, no `animation-name`, no `transition`/`animation` shorthand — R136 needs no restated guard. ✓
7. No variant, size or state hidden or flattened (section above). ✓
8. Header comments record the model (none), what changed, what was kept and why, and the cascade notes. ✓
9. Nothing from §10 touched: no theme variable restated (D1), no disabled treatment (D2), no focus ring width/offset/colour (D3), no `.close-button` (D8), no behaviour/structure (D32). ✓

Comment safety (rule 8): both files were parsed with a block-comment stripper; the surviving CSS is
exactly the 3 + 4 intended rules, so no comment closes early and nothing was swallowed.
