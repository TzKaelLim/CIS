# Unit `fields-a` — InputGroup · TextField · NumberField

**Targets:** `input-group.css`, `textfield.css`, `number-field.css`
**Files written:** `css/input-group.css`, `css/number-field.css` · **no file:** `textfield.css`
**Mission:** end up with the same shell as the themed Input / SearchField — R41 height, R50
padding-inline, R2 type, R65–R69 border / hover / focus / invalid — without breaking InputGroup's
prefixes and suffixes or NumberField's steppers, and without touching either `--secondary` variant.

Everything is measured against the *themed* baseline: `themes/tzuchi/variables.css` already supplies
`--field-radius` 8px, `--field-border-width` 1px, `--field-shadow` none, `--disabled-opacity` 0.38,
`--ring-offset-width` 2px, `--font-sans` and every colour (N5 / D1), so none of that appears in
either file.

Shared resolved numbers used below:

```
field height (R41/R49)   16px * 1.6 + 2*8px + 2*1px            = 43.6px
field value type (R2)    16px / 400 / 1.6                      = 25.6px line box
textarea box (R55)       --tc-textarea-min-height 96px
HeroUI text-sm           14px / 20px      HeroUI text-base 16px / 24px
```

---

## 1. InputGroup — `css/input-group.css`

Base: `styles/components/input-group.css`. Model: `tc-input.styles.ts` `.control` (`:24-35`,
`:47-57`, `:95-101`) — gap-audit/input.md:38 and :87-88 explicitly hand the prefix/suffix slots and
their 8px gap to this component; gap-audit/README.md:135 lists it as unaligned.

| property | HeroUI base (file:line + resolved) | now (declaration + resolved) | spec rule |
|---|---|---|---|
| shell min-height | `input-group.css:3` `min-h-9` → **36px** | `.input-group { min-block-size: calc(var(--tc-font-size-16,16px) * var(--tc-line-height-relaxed,1.6) + 2*var(--tc-space-8,8px) + 2*var(--field-border-width,1px)) }` → **43.6px** | §3.1 **R41**, §3.4 **R49**; same expression as `search-field.css:102-105` |
| value padding-inline | `input-group.css:70` `px-3` → **12px** | `.input-group__input { padding-inline: var(--tc-space-20,20px) }` → **20px** (per side, where no affix) | §3.4 **R50**; §11 **I3** (20px, not the Select's 32px) |
| value padding-block | `input-group.css:70` `py-2` → 8px | *unchanged* | **R51** ("already matches — do not restate") |
| value font-size | `input-group.css:70` `text-base` → 16px, `sm:text-sm` → **14px ≥40rem** | `font-size: var(--tc-font-size-16,16px)` → **16px at every width** | §1 (no 14px step), **R2** |
| value line-height | `text-base` 24px → `sm:text-sm` **20px** | `line-height: var(--tc-line-height-relaxed,1.6)` → **25.6px** | **R2** (prose voice, 1.6) |
| textarea-slot min-height | `input-group.css:110` `min-height: 38px` | `.input-group__input[data-slot="input-group-textarea"] { min-block-size: calc(var(--tc-textarea-min-height,96px) + 2*var(--tc-space-8,8px)) }` → **112px** (+ the group's 2×1px border = the themed Textarea's **114px**) | **R55**, re-derived: here the border lives on the group, not on the textarea |
| affix font-size | `input-group.css:3` shell `text-sm`, inherited → **14px** | `.input-group__prefix, .input-group__suffix { font-size: var(--tc-font-size-16,16px) }` → **16px** | §1 mechanical rule; **R2**; **R19**'s "give its row-mate the same metrics so they share a baseline" |
| affix line-height | inherited 20px | `line-height: var(--tc-line-height-relaxed,1.6)` → **25.6px** | **R2** |
| prefix padding-inline | `input-group.css:115` `px-3` → **12px / 12px** | `padding-inline: var(--tc-space-20,20px) var(--tc-space-8,8px)` → **20px start / 8px end** | **R53** + **R50**; tc `.control` `padding: 8px 20px; gap: 8px` (`tc-input.styles.ts:27,31`) |
| suffix padding-inline | `input-group.css:141` `px-3` → **12px / 12px** | `padding-inline: var(--tc-space-8,8px) var(--tc-space-20,20px)` → **8px start / 20px end** | same, mirrored |
| invalid border | `input-group.css:44` `border-color: var(--color-field-border-invalid)` — **variable defined nowhere in `styles/`** ⇒ invalid at computed-value time ⇒ **currentColor** | `.input-group[data-invalid="true"] { border-color: var(--danger) }` → red-500 / red-300 | **R68**; the bug is the one gap-audit/search-field.md:141-146 records |
| invalid border, hovered | `input-group.css:25-29` (0,3,0) repaints `--field-border-hover` over the (0,2,0) invalid rule | nested `@media (hover: hover)` mirror of **both** base hover forms, (0,5,0) → stays `--danger` | **R69** (the hover-vs-invalid trap), same fix as `input.css:74-82` |

### Left as HeroUI's (and why) — InputGroup

| kept | why |
|---|---|
| focus **ring** (`status-focused-field`, 2px `--focus`) | §11 **I1** / **D21** — follow Input, not Textarea's 3px halo, so Input / SearchField / InputGroup focus identically |
| focus **border** (`input-group.css:36` `--field-border-focus`) | **R67** applies only where the base forgot it (SearchField did; InputGroup did not) |
| radius, border width, field shadow, background, text + placeholder colour, hover border, disabled | **N5 / D1 / D2 / R85** — already the Tzu Chi values through `variables.css` |
| the prefix/suffix **hairline divider** (`:119`, `:145`) and their `--field-placeholder` colour | tc draws no divider, but the spec gives no rule for one (rule 6, restraint). The colour already equals tc's `::slotted([slot="prefix"]) { color: text-muted }` (`tc-input.styles.ts:100`) |
| `ps-0` / `pe-0` next to an affix (`:73-80`) | deliberately left more specific (0,3,0) than the 20px rule (0,2,0) — it is what makes R53's "20 to the edge, 8 to the text" come out right |
| `items-center`, `:has(textarea)` start-alignment + its `padding-top`, `height: auto` | layout choreography the spec is silent on |
| autofill handling (`:53-66`, `:95-105`) | structural, and colour-correct already |
| 150ms `--ease-smooth` transitions | already R131's duration; touching `transition` would force restating both reduced-motion guards (R137) for no gain |
| `--secondary`'s `--default` fill (`:171-202`) | **D13** — every Tzu Chi field is bordered, and the neutral is already mapped |
| `--full-width` | **D32** — opt-in full width is strictly more flexible than tc's always-block host |

---

## 2. NumberField — `css/number-field.css`

Base: `styles/components/number-field.css`. No `tc-number-field`; §3.4 says new field-family members
follow the **Input** shape (R49–R54). gap-audit/README.md:135 lists it as unaligned.

| property | HeroUI base (file:line + resolved) | now (declaration + resolved) | spec rule |
|---|---|---|---|
| shell height | `number-field.css:18` `h-9` → **fixed 36px** (with `overflow: hidden`) | `.number-field__group { block-size: auto; min-block-size: calc(… same expression …) }` → **43.6px floor, content-driven** | **R41 / R49**; the auto+min form is prescribed by §3.1 and shipped in `search-field.css:101-105` |
| value padding-inline | `number-field.css:92` `px-3` → **12px** | `.number-field__input { padding-inline: var(--tc-space-20,20px) }` → **20px** | **R50**, **I3** |
| value padding-block | `:92` `py-2` → 8px | *unchanged* | **R51** |
| value font-size | `:92` `text-base` → 16px, `sm:text-sm` → **14px ≥40rem** | `font-size: var(--tc-font-size-16,16px)` → **16px at every width** | §1, **R2** |
| value line-height | 24px → **20px ≥40rem** | `line-height: var(--tc-line-height-relaxed,1.6)` → **25.6px** | **R2** |
| invalid border | `number-field.css:66` `var(--color-field-border-invalid)` — undefined ⇒ **currentColor** | `.number-field__group[data-invalid="true"] { border-color: var(--danger) }` | **R68** |
| invalid border, hovered | `:47-51` (0,3,0) beats the (0,2,0) invalid rule | nested hover mirror, (0,5,0) | **R69** |
| stepper block-size | `:132` `h-full` — resolved against the **definite** `h-9` row | `align-self: stretch` added, `h-full` untouched → still full-height (43.6px − 2px border = 41.6px) | consequence guard for R41, not a restyle — see below |

### Why `align-self: stretch` on the steppers

Changing the shell from a fixed `height` to `block-size: auto` + `min-block-size` makes the grid row
content-sized. A percentage block-size on a grid item is treated as `auto` while the track is being
sized, and the base pins `items-center` (`:18`), so a stepper could end up 16px tall (its glyph)
floating in a 43.6px shell — a shrunken hit area and a stub divider. `stretch` only applies to an
`auto` block-size, so it is a **no-op** wherever the percentage does resolve. Either way the stepper
is full height, and rule 5 (no state, size or variant lost) holds. This is the one declaration in
this unit that answers a question the spec does not ask — logged in "spec gaps" below.

### Left as HeroUI's (and why) — NumberField

| kept | why |
|---|---|
| stepper **box** (40px grid columns, `w-10`), **glyph** (`size-4` = 16px), transparent fill, pressed `scale(0.97)`, cursor, disabled, the faint inner divider | no tc counterpart and no spec rule for an in-field stepper (rule 6). **R46/R47**'s 48/64px icon-button boxes are for standalone Buttons and cannot fit a 43.6px field; **R48** says a joined group re-points at the shell height, which `h-full` already does. §1.3 is the precedent for leaving a shared 16px glyph alone |
| `tabular-nums` | set via `font-variant-numeric`; the longhand type rules do not disturb it |
| focus ring and focus border (`:57-59`) | **I1 / D21**, and **R67** does not apply (the base already repaints the edge) |
| `overflow: hidden`, the three grid templates, `items-center`, autofill handling | structural |
| 150ms transitions, disabled, radius, border width, colours | **R131** already / **D1 / D2 / R85** |
| `--secondary` (`:183-213`), `--full-width`, `.number-field__group--full-width` | **D13 / D32** |
| the `.number-field` stack's `gap-1` (4px) and `[data-slot="label"] { w-fit }` | **R141 / R142** — already the Tzu Chi 4px rhythm |

---

## 3. TextField — **no file needed**

`styles/components/textfield.css` is 23 lines and contains no shape, colour or type decision:

| declaration | resolved | verdict |
|---|---|---|
| `textfield.css:4` `flex flex-col gap-1` | **4px** stack gap | **already correct.** R141 ("label ↔ control 4px — already correct theme-wide, **do not restate**") and R142 ("HeroUI's `.textfield { gap-1 }` is already 4px"). Independently confirmed by gap-audit/textarea.md:38 — *"`.field` gap 4px … which is HeroUI's TextField (`components/textfield.css:4` `gap-1` = 4px, already identical)"* — and tc-input.styles.ts:8-12 |
| `:6-11` `[data-invalid] [data-slot="description"] { hidden }` | — | behaviour, **D32** |
| `:15-23` `--full-width` → `w-full` on itself and on `[data-slot="input"]` / `[data-slot="textarea"]` | — | layout opt-in, **D32** |

Everything a TextField *shows* — the Label, the Description, the FieldError — is a separate HeroUI
component (`label.css`, `description.css`, `field-error.css`) owned by another unit (rule 7). Writing
an empty file would only add an import. **Nothing to change.**

---

## 4. Spec gaps

1. **R53 is written for a bare icon, not a padded affix box.** SearchField's magnifier takes
   `margin-inline-start: 20px` and HeroUI's `ps-2` supplies the 8px gap. InputGroup's prefix/suffix
   is a padded, bordered box and the input is `ps-0`/`pe-0` beside it, so the slot must carry **both**
   insets. `padding-inline: 20px 8px` is a transposition of R53 + R50 + tc `.control`'s
   `padding: 8px 20px; gap: 8px`, not a quoted rule. Most conservative reading of the closest role.
2. **The prefix/suffix hairline divider has no verdict.** `tc-input`'s slots sit inside the same
   bordered `.control` with no divider between slot and value; HeroUI draws a 1px `--field-border`
   between them. Kept (restraint), but an owner may want it removed for the "one Tzu Chi field" read.
3. **No rule for an in-field stepper.** NumberField's 40px columns and 16px glyphs are HeroUI's own;
   the spec's only icon-in-a-control numbers (R45–R48, R54) are for Buttons and for the SearchField
   magnifier. Left alone. If the owner wants the steppers on the Tzu Chi icon scale,
   `--tc-size-icon-sm` (20px) in a `calc()`-derived column is the shape it would take (**I6**).
4. **R55 assumes the textarea owns its border.** `textarea.css:61-64` adds back padding *and* border
   because the standalone `.textarea` carries both. Inside an InputGroup the border is on the group,
   so the figure was re-derived as `96 + 2*8 = 112px`; the composed shell is still 114px. No
   precedent exists for this split — flagged rather than assumed.
5. **§3.1 has no precedent for a grid-based field shell.** Every themed field so far is flex or a
   bare element; `block-size: auto` on NumberField's grid is what made the `align-self: stretch`
   guard necessary. Worth a browser confirmation that the steppers are still 41.6px tall.
6. **I2 propagates.** These two shells are 43.6px while the themed Select trigger is 42px, so an
   InputGroup or NumberField beside a Select in one row is 1.6px taller. Inherited, not introduced.
7. **I1 propagates.** Both follow Input's 2px ring; the themed Textarea's 3px `--accent-soft-hover`
   halo remains the odd one out (Q2).
8. **Affix text colour and weight are unruled.** The prefix/suffix keeps `--field-placeholder` at
   weight 400. That matches tc's slotted rule, but the spec never states whether an affix is a
   "control label" (R1, 700) or prose (R2, 400). Read as prose because it shares the value's baseline.

## 5. Checklist (§13)

1. Every rule sits inside one `[data-theme^="tzuchi"] { … }` block; every `&` and every comma branch
   resolves under it. ✔
2. Grepped both files for `--tc-color-`, `#`, `rgb(`, `hsl(`, `oklch(`, `!important` and physical
   `left`/`right` — clean (only the English words "left on top" / "left in place" in comments). ✔
3. Tokens used — `--tc-font-size-16`, `--tc-line-height-relaxed`, `--tc-space-8`, `--tc-space-20`,
   `--tc-textarea-min-height` — all exist in `packages/tokens/dist/tokens.css` (lines 85, 94, 39, 42,
   110), all outside both dark blocks, all dimension/number valued, all given fallbacks. ✔
4. Colours: `--danger` and `--field-border-width` only; both HeroUI theme variables. No new
   `--tzuchi-*` needed. ✔
5. Specificity hand-derived against every base rule replaced, including the `sm:` twins and the
   `:has()` compounds — see the cascade notes in each file header. ✔
6. No `transition-property`, no `animation-name`, no `transition`/`animation` shorthand → both
   reduced-motion guards keep winning untouched (R136). ✔
7. Variants and states: `--primary`, `--secondary`, `--full-width`, `__group--full-width`, hover,
   focus-within, invalid, disabled, pressed (steppers), autofill, `:has(textarea)`, prefix-only,
   suffix-only and prefix+suffix all enumerated above; none hidden or flattened. ✔
8. Header comments record variant mapping, what changed, what was kept and the cascade notes. ✔
9. Nothing in §10 touched. ✔
