# Unit `pickers-listbox` — ComboBox + Autocomplete

Targets: `combo-box.css`, `autocomplete.css` → destined for
`heroui/styles/themes/tzuchi/components/`.

Both are the half `README.md:134` / `DESIGN-LANGUAGE.md §11 I9` records as unreached by pass 2:
their option rows already get Tzu Chi geometry from `list-box-item.css` + `list-box.css`, but their
popover shells and triggers were still stock HeroUI — a 24px-radius white `--overlay` panel with a
neutral `--default` hover, hung off a 12px-inset 14px trigger. This pass closes both.

**Resolved token values used below** (`packages/tokens/dist/tokens.css`, all mode-independent —
none of them is redeclared in the file's `[data-theme="dark"]` block, checked):
`--tc-space-8` 8px · `--tc-space-20` 20px · `--tc-space-32` 32px · `--tc-size-icon-sm` 20px ·
`--tc-font-size-16` 16px · `--tc-line-height-normal` 1.5 · `--tc-line-height-relaxed` 1.6 ·
`--tc-font-weight-bold` 700 · `--tc-dropdown-radius` → `--tc-radius-md` = 8px.

**Colour variables used**: `--accent`, `--accent-soft`, `--accent-soft-hover`,
`--accent-soft-foreground`, `--danger`, `--field-placeholder`, plus `inherit` / `currentColor`.
All are HeroUI theme variables resolved per mode by `themes/tzuchi/variables.css`. No
`--tc-color-` token, no colour literal, no shadow token, no new `--tzuchi-` variable.

---

## 1. ComboBox — `combo-box.css`

**Role mapping.** ComboBox has no `tc-*` counterpart, so it is assembled from two roles the spec
already settles. Its trigger is a real text field you type into → §3.4 ("New field-family
components … **ComboBox input** … follow R49–R54 — the Input shape, not the Select shape") and
§11 I3 ("**→ FOLLOW 20px**"), which pass-1 `input.css` already delivers through the shared `.input`
class. Its popover is an option-list popover → §6(a) R89–R97, the treatment `select.css` gives
`.select__popover`.

| property | HeroUI base (file:line + resolved) | now (declaration + resolved) | spec rule |
|---|---|---|---|
| Input shell `padding-inline-start`, height, type, border, invalid edge | `components/input.css:2` `px-3` = 12px, `text-base sm:text-sm` = 16→14px | **unchanged by this file** — `input.css` (theme) already gives 20px / 16px/1.6 / 43.6px / `--danger` | §3.4 R49–R52, R68, §11 I3 |
| Input `padding-inline-end` when a trigger follows | `components/combo-box.css:21` `pe-7` = **28px** (and at (0,3,0) it outranks `input.css`'s 20px) | `padding-inline-end: calc(var(--tc-space-20,20px) + var(--tc-size-icon-sm,20px) + var(--tc-space-8,8px))` = **48px** | R53 (20px affix inset + 8px gap to text), mirroring `select.css:135-139` with the Input's 20px |
| `.combo-box__trigger` `padding-inline-end` | `combo-box.css:59` `pe-2` = **8px** | `var(--tc-space-20, 20px)` = **20px** | R53; mirror of `search-field.css:194-201`'s clear-button inset |
| default chevron `width` / `height` | `combo-box.css:91` `size-4` = **16px** | `var(--tc-size-icon-sm, 20px)` = **20px** | R54; mirror of `select.css:192-195` |
| `.combo-box__value` `font-size` / `line-height` | `combo-box.css:46` `text-sm` = **14px / 20px** | `var(--tc-font-size-16,16px)` / `var(--tc-line-height-relaxed,1.6)` = **16px / 25.6px** | §1 mechanical rule (no 14px step) + §1.2 prose voice → R2/R5 |
| `.combo-box__popover` `border-radius` | `combo-box.css:103` `min(32px, var(--radius-3xl))` = **24px** | `var(--tc-dropdown-radius, var(--radius))` = **8px** | R29 / R89 |
| `.combo-box__popover` `background-color` | `combo-box.css:102` `bg-overlay` = white / `#1c1c1e` | `var(--accent-soft)` = blue-100 / blue-900 | R90 |
| `.combo-box__popover` `color` | inherited `--foreground` | `var(--accent-soft-foreground)` = blue-900 / blue-300 | R90 |
| popover arrow `fill` | `combo-box.css:148` `var(--overlay)` | `var(--accent-soft)` | R91 |
| `[data-slot="list-box"]` padding | `combo-box.css:166` `p-1.5` = **6px all round** (0,2,0 — ties with `list-box.css`) | `padding-block: var(--tc-space-8,8px); padding-inline: 0` at (0,3,0) | R58 / R92 |
| `[data-slot="list-box-item"]` `padding-inline` | `combo-box.css:170` `px-2.5` = **10px** (0,2,0 — ties with `list-box-item.css`) | `var(--tc-space-32, 32px)` = **32px** at (0,3,0) | R57 / R93 |
| row `[data-slot="label"]` `color` | `components/label.css:4` `text-foreground` | `inherit` (danger rows excluded) | R94 |
| row hover fill | `list-box-item.css:57` `bg-default` (neutral) | `var(--accent-soft-hover)` | R79 / R96 |
| row `[data-focused]` / `[data-selected]` / `[aria-selected]` fill | `list-box-item.css:62-64` — **empty rule**, indicator only | `var(--accent-soft-hover)` (additive; indicator untouched) | R79 / R82 |
| row focus `--tw-ring-offset-color` | `utilities/index.css:3` `ring-offset-background` = page grey | `var(--accent-soft)` | R71 |

### Left as HeroUI's (and why) — ComboBox

* **The chevron's colours.** `--field-placeholder` at rest is already exactly what the themed
  Select trigger's chevron resolves to at rest (`select.css:126` + `:180`), so the two pickers
  already agree. tc-dropdown's "value present / expanded turns the whole trigger brand-primary" is
  a *Select-trigger* rule (`select.css:141-162`); a ComboBox shell is an Input you type into, and
  filling or recolouring it while open would fight the text being entered. §6 RESTRAINT: the spec
  gives no rule for an open text-field shell, so nothing was invented. Consequence: a ComboBox and
  a Select sitting side by side match at rest and differ while open — by design.
* **Everything the Input already owns**: 20px inline inset, 43.6px content-driven height, 1px
  `--field-border`, hover/focus edges, the 2px `--focus` ring (D21, §11 I1 → FOLLOW Input),
  `--danger` on invalid + the hover-vs-invalid fix (R69) — all in `input.css`, not repeated (N5/D1).
* Root `gap-1` = 4px — already R141/R142.
* Trigger button's own `rounded` focus shape (4px = `--tc-radius-sm`, already R34), 150ms
  transition, pressed opacity, disabled (D2), 180° open rotation.
* Popover `text-sm` root size, `scroll-py-1`, `overscroll-contain`, `min-w-(--trigger-width)`,
  enter/exit choreography, placement arrow rotation, `--overlay-shadow` (R97, R140) — exactly the
  set `select.css` leaves alone on `.select__popover`.
* Section headers — `list-box.css`'s `[data-theme^="tzuchi"] .list-box .header` (0,3,0) already
  insets them 32px (R8/R95) and no base rule in `combo-box.css` competes.
* Row geometry/type (40px rows, 700 16px/1.5) — owned by `list-box-item.css` (R57); only the
  popover-scoped inline padding is restated, for the (0,2,0) tie R93 names.
* `list-box-item--danger` colours, the item indicator, `min-h-9`, `gap-3`, `scale(0.98)` pressed
  (D16).

### Measured detail worth recording

The chevron's 20px is measured from the Input's **border box** (`.combo-box__trigger` is
`end-0`/absolute), while the SearchField's 20px magnifier inset is measured from **inside** the 1px
border. The two therefore differ by 1px in the true edge gap (19px vs 21px of inner space), and the
value-to-chevron gap lands at 9px rather than 8px. Not worth a `calc(... - var(--field-border-width))`;
recorded so nobody "fixes" it later.

---

## 2. Autocomplete — `autocomplete.css`

**Role mapping.** Autocomplete's root **is** react-aria's Select (`autocomplete.tsx:81`
`SelectPrimitive`, `:164` `SelectValuePrimitive`), and `components/autocomplete.css:7-129` is a
line-for-line sibling of `select.css`'s trigger / value / indicator / secondary variant / clear
button. So the trigger takes the Select-trigger rules: R56 (32px inset, 60px with an indicator),
R1/R40 (subtitle 700 16px/1.5 → 42px), R3 (value 16px/1.5), R68/R69 (danger edge that survives
hover). §11 I3's carve-out applies directly — "FOLLOW 20px **except** a control whose popover rows
are inset 32px", and these rows are.

| property | HeroUI base (file:line + resolved) | now (declaration + resolved) | spec rule |
|---|---|---|---|
| `.autocomplete__trigger` `padding-inline` | `autocomplete.css:7` `px-3` = **12px** | `var(--tc-space-32, 32px)` = **32px** | R56, §11 I3 |
| `.autocomplete__trigger` `padding-inline-end` with an indicator | `autocomplete.css:27` `pe-7` = **28px** | `calc(var(--tc-space-32,32px) + var(--tc-size-icon-sm,20px) + var(--tc-space-8,8px))` = **60px** | R56 (`select.css:135-139`) |
| `.autocomplete__trigger` type / height | `autocomplete.css:7` `text-sm` = 14px/20px, `min-h-9` = 36px → **38px** box | `16px` / `1.5` / `700` → 24 + 16 + 2 = **42px** | R1, R40, R56 |
| `.autocomplete__trigger` `color` | `autocomplete.css:7` `text-field-foreground` | `var(--field-placeholder)` at rest | `select.css:126` (tc-dropdown.styles.ts:20) |
| trigger `color` with a value, or while open | — (no such state) | `var(--accent)` | `select.css:141-148` (tc `.trigger.has-value`, `:host([open])`) |
| trigger open fill / edge | — (HeroUI shows no open state) | `background-color: var(--accent-soft-hover); border-color: var(--accent)` | R77/R79 via `select.css:150-156` (tc Figma "Expanded=True") |
| open placeholder `color` | `autocomplete.css:107` `text-field-placeholder` (0,2,0) | `inherit` at (0,5,0) | `select.css:160-162` |
| `.autocomplete__value` `font-size` / `line-height` | `autocomplete.css:104` `text-base sm:text-sm` = **16px → 14px from 40rem** | `16px` / `1.5` at every width | R3 |
| `.autocomplete__indicator` `color` | `autocomplete.css:117` `text-field-placeholder` (pinned) | `inherit` (tracks the trigger) | `select.css:176-180` |
| `.autocomplete__indicator` `inset-inline-end` | `autocomplete.css:117` `end-2` = **8px** | `var(--tc-space-32, 32px)` = **32px** | R56 (`select.css:185`) |
| default indicator `width` / `height` | `autocomplete.css:127` `size-4` = **16px** | `var(--tc-size-icon-sm, 20px)` = **20px** | R54 (`select.css:192-195`) |
| invalid trigger `border-color` | `autocomplete.css:55` `status-invalid-field` = neutral border + 1px `--danger` **outline** | outline kept **plus** `border-color: var(--danger)`, including the `[data-open]` and hover compounds | R68, R69 |
| `.autocomplete__popover` `border-radius` | `autocomplete.css:134` `min(32px, var(--radius-3xl))` = **24px** | `var(--tc-dropdown-radius, var(--radius))` = **8px** | R29 / R89 |
| `.autocomplete__popover` `background-color` / `color` | `autocomplete.css:133` `bg-overlay`, inherited `--foreground` | `var(--accent-soft)` / `var(--accent-soft-foreground)` | R90 |
| popover arrow `fill` | `autocomplete.css:179` `var(--overlay)` | `var(--accent-soft)` | R91 |
| `[data-slot="list-box"]` padding | `autocomplete.css:201` `p-1.5` = **6px** (0,2,0 tie) | `padding-block: 8px; padding-inline: 0` at (0,3,0) | R58 / R92 |
| `[data-slot="list-box-item"]` `padding-inline` | `autocomplete.css:205` `px-2.5` = **10px** (0,2,0 tie) | `var(--tc-space-32, 32px)` = **32px** at (0,3,0) | R57 / R93 |
| virtualized row `inline-size` | `autocomplete.css:214` `calc(100% - var(--spacing) * 3)` = **100% − 12px** | `100%` | R58 — the 12px it subtracts *was* the list-box inline padding R92 removes; leaving it strands a 12px strip where the hover fill stops short |
| row `[data-slot="label"]` `color` | `label.css:4` `text-foreground` | `inherit` (danger rows excluded) | R94 |
| row hover / `[data-focused]` / `[data-selected]` / `[aria-selected]` fill | `list-box-item.css:57` `bg-default`; selected rule empty | `var(--accent-soft-hover)` | R79 / R82 / R96 |
| row focus `--tw-ring-offset-color` | `ring-offset-background` = page grey | `var(--accent-soft)` | R71 |

### The search field inside the popover — nothing written, on purpose

The brief asked that it stay legible on the tinted panel. Under this theme it already is, and every
one of its properties is owned by `search-field.css`:

* HeroUI insets it `px-3 py-1` (`autocomplete.css:227`); the stories use `variant="secondary"`.
* `search-field.css` gives it the Tzu Chi field geometry — 43.6px floor, 20px inner inset, 20px
  `--accent` magnifier, 16px/1.6 text, `--field-placeholder` hint. Its **text column** therefore
  starts 12 (popover inset) + 1 (border) + 20 (icon inset) = **33px** from the panel edge, flush
  with the 32px option text below it. No re-inseting needed.
* Its fill is `--default` (gray-100 / gray-900) against the `--accent-soft` panel (blue-100 /
  blue-900): low contrast as a *fill*, but every Tzu Chi field is drawn by its 1px `--field-border`
  (D13), which is what defines the box in both modes.
* Its text is `--field-foreground` and its hint `--field-placeholder`, both set at (0,1,0)–(0,2,0)
  on `.search-field__group` / `.search-field__input`, so the panel's inherited
  `--accent-soft-foreground` never reaches them.
* Its focus treatment is `status-focused-field` → `focus-field-ring`, whose
  `--tw-ring-offset-width` is **0** (`utilities/index.css:8-12`) — so R71's ring-offset-on-a-tint
  problem does not arise here at all.

Writing anything for `[data-slot="search-field"]` would duplicate `search-field.css` against
selectors it already owns (ownership rule 7), and the spec gives no rule for a field nested in a
popover.

### Left as HeroUI's (and why) — Autocomplete

* `.autocomplete__clear-button` — the exact counterpart of `.select__clear-button`, which
  `select.css` leaves alone (D22/D23); Tzu Chi has no clear affordance to copy. With the chevron at
  the 32px inset and 60px reserved, the in-flow clear button sits 8px clear of it, the same
  arithmetic `select.css` relies on.
* `.autocomplete--secondary`'s neutral `--default` fill (D13, R88) — it inherits every
  density/type/open/invalid rule and keeps its own fill.
* `[data-slot="empty-state"]`'s `text-center text-sm text-overlay-foreground/60` — see spec gaps.
* Popover `text-sm` root size, `pt-2`, `w-(--trigger-width)`, `overflow-hidden`, the 320px list cap
  with `min-h-0`, enter/exit choreography, placement arrow rotation, the single-select indicator
  transition kill, `--overlay-shadow` (R97, R140).
* Root `gap-1` = 4px (R141/R142); the 150ms trigger transition (R138 — the positional list is not
  touched); the focus ring (D3, D21); disabled (D2, R85); the 180° open rotation.
* Section headers (handled by `list-box.css`, R8/R95); row geometry and type (owned by
  `list-box-item.css`, R57); `list-box-item--danger`, the item indicator, `min-h-9`, `gap-3`,
  pressed `scale(0.98)` (D16).

---

## 3. Cascade ledger (hand-derived, both files)

| base rule | base specificity | override | override specificity |
|---|---|---|---|
| `.combo-box [data-slot="input"]:has(+ .combo-box__trigger)` `pe-7` | (0,3,0) | same + `[data-theme^]` | (0,4,0) |
| `.combo-box__trigger` `pe-2` | (0,1,0) | `[data-theme^] .combo-box__trigger` | (0,2,0) |
| `.combo-box__trigger [data-slot="…default-icon"]` `size-4` | (0,2,0) | nested `&` under the above | (0,3,0) |
| `.combo-box__popover` / `.autocomplete__popover` radius + `bg-overlay` | (0,1,0) | `[data-theme^] .<x>__popover` | (0,2,0) |
| `.<x>__popover [data-slot="list-box"]` `p-1.5` — **ties `[data-theme^] .list-box` (0,2,0)** | (0,2,0) | nested `&` inside the popover scope | (0,3,0) |
| `.<x>__popover [data-slot="list-box-item"]` `px-2.5` — **ties `[data-theme^] .list-box-item` (0,2,0)** | (0,2,0) | nested `&` inside the popover scope | (0,3,0) |
| `.autocomplete__popover [role="presentation"] > [data-slot="list-box-item"]` | (0,3,0) | same + `[data-theme^]` | (0,4,0) |
| `.list-box-item:hover` / `[data-hovered]` `bg-default` | (0,2,0) | `[data-theme^] .<x>__popover [data-slot="list-box-item"]:hover` | (0,4,0) |
| `label.css` `.label` `text-foreground` | (0,1,0) | `[data-theme^] .<x>__popover [data-slot="list-box-item"]:not(.list-box-item--danger) [data-slot="label"]` | (0,5,0) |
| `.autocomplete__trigger:has(.autocomplete__indicator)` `pe-7` | (0,2,0) | same + `[data-theme^]` | (0,3,0) |
| `.autocomplete__trigger:hover:not(:has(.autocomplete__clear-button:hover))` | (0,4,0) | open-state rule (tie → theme loads later, wins) | (0,4,0) |
| `.autocomplete__trigger:focus-visible:not([data-focused])` bg/border | (0,3,0) | open-state rule | (0,4,0) |
| `.autocomplete[data-invalid] .autocomplete__trigger` needs to beat the (0,4,0) hover | — | invalid+hover mirrors (R69) | (0,5,0) |
| `.autocomplete__indicator[data-slot="autocomplete-default-indicator"]` `size-4` | (0,2,0) | nested `&` | (0,3,0) |

### Known inconsistency, inherited from `select.css` — not re-litigated

For the **secondary** variant only, the base hover rule
`.autocomplete--secondary .autocomplete__trigger:hover:not(:has(.autocomplete__clear-button:hover))`
is **(0,5,0)**, which outranks the (0,4,0) open-state fill. So hovering an **open** secondary
Autocomplete repaints `--default-hover` instead of `--accent-soft-hover`.
`select.css:150-156` has the identical gap for `.select--secondary`. Kept identical on purpose —
diverging from the sibling file would be worse than the 1-state mismatch. If the owner wants it
closed it should be closed in both files at once, with a (0,6,0) mirror.

---

## 4. Spec gaps

1. **`[data-slot="empty-state"]` inside the Autocomplete popover** —
   `autocomplete.css:232` paints it `text-sm text-overlay-foreground/60`. §1 R21 sends
   "empty-state copy" to R5 (16px/400/1.6), and §1's mechanical rule kills the 14px step, but the
   **colour** has no rule: the spec has no token for "muted prose on a tinted panel"
   (`--accent-soft-foreground` is the full-strength panel text; `--muted` is calibrated against
   `--surface`/`--background`, not `--accent-soft`). EmptyState is also its own unit in this pass,
   and a `[data-theme^="tzuchi"] .empty-state` rule (0,2,0) ties with HeroUI's popover-scoped rule
   and wins on source order — so the type fix belongs there, not here. **Nothing written.** Owner
   decision needed on the colour.
2. **Open state for a ComboBox (text-field) trigger.** §6 and §5 give an open treatment only for a
   *Select-shaped* trigger (`select.css:150-162`, tc "Expanded=True"). Nothing in the spec says what
   an Input-shaped picker shell should do while its panel is open, and filling it would fight the
   text being typed. The most conservative choice — change nothing — was taken, which leaves
   ComboBox and Select matching at rest and differing while open.
3. **Two field insets inside one picker family (§11 I3, unresolved upstream).** The themed ComboBox
   is a 20px-inset field whose popover rows are inset 32px; the themed Autocomplete/Select trigger
   is 32px so the label does not jump. Placed side by side, a ComboBox's value starts 12px to the
   left of an Autocomplete's. This is I3 playing out, not a new decision — flagged, not resolved.
4. **Two field heights inside one picker family (§11 I2, unresolved upstream).** ComboBox = 43.6px
   (body 1.6, from `input.css`), Autocomplete = 42px (subtitle 1.5, from the Select trigger rules).
   1.6px apart in the same row.
5. **Search field nested in a tinted popover.** No rule exists for its inset relative to the option
   rows; it only *happens* to land flush (33px vs 32px) because 12px popover inset + 1px border +
   20px icon inset ≈ 32px. Recorded so a future change to either number is understood to break the
   alignment.
6. **`--tc-icon-size-sm` vs `--tc-size-icon-sm`.** `select.css:137/193` references
   `--tc-icon-size-sm`; §0 of the spec and `search-field.css:179-180` use `--tc-size-icon-sm`.
   Both exist in `tokens.css` (line 186 aliases one to the other) so both resolve to 20px; these two
   files use the §0 spelling. Cosmetic, but the two spellings should be unified eventually.

---

## 5. Variant / size / state sweep (nothing hidden or flattened)

**ComboBox** — `fullWidth` (untouched), `menuTrigger` focus|input|manual (untouched), single and
multiple selection (rows get the `--accent-soft-hover` fill; the checkmark indicator is untouched),
sections + headers (32px inset via `list-box.css`), descriptions (400 weight kept by
`list-box-item.css`), disabled options (`--disabled-opacity` 0.38), async loading + load-more rows,
`CustomIndicator` (its own `size-3` glyph survives — the 20px rule is scoped to
`[data-slot="combo-box-trigger-default-icon"]`), `allowsCustomValue`, controlled input value,
danger rows, and every hover / press / focus-visible / invalid / disabled state.

**Autocomplete** — `primary` and `secondary` (secondary keeps its `--default` fill and inherits all
density/type/open/invalid rules), `fullWidth`, single and multiple selection, sections, descriptions,
disabled options, asynchronous filtering, **virtualization** (rows now run full-bleed, which is the
point of the `inline-size: 100%` rule), the clear button, `CustomIndicator` (carries
`data-slot="autocomplete-indicator"`, so the 20px rule does not reach it), the item indicator, the
danger row variant, empty state, and every hover / press / focus-visible / open / invalid /
disabled state.

## 6. Checklist (§13)

1. Every rule, every comma branch, every nested `&` is under `[data-theme^="tzuchi"]` — verified by
   listing every column-0 line in both files.
2. `grep` for `--tc-color-`, `#`, `rgb(`, `hsl(`, `oklch(`, `!important`, physical `left`/`right`
   properties — clean (the only matches are the two header comments that *name* the forbidden
   things).
3. Every `--tc-` token used exists in `packages/tokens/dist/tokens.css`, is mode-independent, and
   carries a fallback.
4. Every colour is a HeroUI theme variable; no new `--tzuchi-` variable is needed.
5. Specificity hand-derived against every base rule replaced — see §3, including the `sm:` type
   step-downs, the `:has()` compounds and the per-variant rules.
6. No `transition-property`, no `animation-name`, no `transition`/`animation` shorthand — R136 holds
   with no reduced-motion restatement needed (R137 not triggered).
7. No variant, size or state hidden — see §5.
8. Header comments record the variant mapping, what changed, what was kept and why, and the cascade
   notes; comment bodies were machine-checked for balanced `/* … */` (18/18 and 27/27) and for the
   glob-then-slash early-close bug from pass 1.
9. Nothing in §10 (D1–D32) was touched.
