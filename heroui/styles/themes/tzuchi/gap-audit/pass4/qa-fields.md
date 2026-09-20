# Visual QA — family "fields" (Tzu Chi theme on vendored HeroUI v3.2.6)

Themes looked at: `tzuchi`, `tzuchi-dark`; every suspicion re-rendered in upstream `light` / `dark`
before it was written down. 128 screenshots in
`(session screenshot, not kept) shots/fields/`.

## Stories covered

**Input** `--variants`, `--on-surfaces` · **TextField** `--default`, `--with-description`, `--required`,
`--invalid`, `--disabled`, `--input-types`, `--with-validation`, `--full-width` ·
**Textarea** `--default`, `--variants`, `--full-width` · **InputGroup** `--default`, `--all-variations`,
`--with-prefix-icon`, `--with-suffix-icon`, `--with-prefix-and-suffix`, `--with-text-prefix`,
`--with-text-suffix`, `--with-icon-prefix-and-text-suffix`, `--with-copy-suffix`,
`--password-with-toggle`, `--with-loading-suffix`, `--with-keyboard-shortcut`, `--with-badge-suffix`,
`--with-text-area`, `--invalid`, `--disabled`, `--full-width` · **NumberField** `--default`,
`--with-chevrons`, `--custom-icons`, `--with-format-options`, `--invalid`, `--disabled`,
`--form-example` · **SearchField** `--default`, `--variants`, `--controlled`, `--custom-icons`,
`--with-keyboard-shortcut`, `--invalid`, `--disabled`, `--full-width`, `--form-example` ·
**InputOTP** `--default`, `--variants`, `--disabled`, `--with-validation`, `--form-example` ·
**Fieldset** `--default` (Label / Description / FieldError were exercised through all of the above).

States driven: keyboard focus (`key:Tab`), typing, hover, invalid, disabled, value-present
(clear button), in-field button focus, loading, long-value overflow.

---

## Findings

### 1. HIGH — InputGroup: a text suffix next to an icon prefix is pushed onto / past the field's right border

`components-forms-inputgroup--with-icon-prefix-and-text-suffix`, both themes.
Shots: `ig-ipts-tz.png`, `ig-ipts-tzd.png`, `ig-all-tz.png` (6th row), `ig-all-tzd2.png` (6th row).
Upstream: `ig-ipts-up.png` — fits with 12px to spare, so this is the theme's.

`.com` has no gap to the edge at all: the glyphs sit on the 1px border and the last one runs into
the rounded corner. Measured (`probe`): group `280px`, prefix `45px`, input `187px`, suffix `66px`
→ 298px of content in a 280px box, 18px of overflow, which eats the suffix's whole 20px inset.
Upstream is 40 + 183.3 + 56.7 = 280 exactly.

Cause: the 16px Tzu Chi body size raises the `<input>`'s automatic minimum size (`min-width:auto`
on a flex item = min-content) to 187px, while
`heroui/styles/themes/tzuchi/components/input-group.css:193-205` widens both affixes from `px-3`
(12/12) to 20/8 and 8/20. Nothing in the base
(`heroui/styles/components/input-group.css:69-70`, `flex-1` with no `min-w-0`) lets the input
shrink below min-content, so the line overflows instead. `--with-text-prefix` overflows the same
way by 9.7px (82.7 + 207 = 289.7 in 280, `ig-tp-long-tz.png` vs `ig-tp-long-up.png`); it is only
less obvious because the overflowing box is the transparent input.

### 2. MEDIUM — InputGroup: the affix divider is a different length in every input group and never reaches the field's edges

`ig-all-tz.png` / `ig-all-tzd2.png` show it best; close-ups `ig-pi-tz.png` (16px tick),
`ig-price-div-tz.png` (25.6px), `ig-kbd-tz.png` (24px), `ig-pw-tz.png` (36px), `ig-badge-tz.png` (40px).
Upstream has no divider at all (`ig-ipts-up.png`, `ig-inv-price-up.png`), so this is theme-only.

`.input-group__prefix` / `__suffix` are `h-full` + a 1px `border-inline-{end,start}`
(`heroui/styles/components/input-group.css:114-122` and `140-148`). `height:100%` never resolves,
because `.input-group` only ever has a `min-height` — `min-h-9` in the base and
`min-block-size: …43.6px` in `heroui/styles/themes/tzuchi/components/input-group.css:122-130` —
so each affix is only as tall as its own content. Probed heights inside the same 43.6px field:
icon prefix 16px, `⌘K` 24px, `$`/`USD`/`.com` 25.59px, icon button 36px, badge 40px. Upstream has
the identical layout bug but `--border-width-field: 0`, so nothing is drawn; Tzu Chi's
"every field is bordered" turns it into five different hairlines floating at five different
heights.

### 3. MEDIUM — InputGroup composer: two orphan hairlines, one beside "Add Context", one hugging the left edge of the toolbar row

`components-forms-inputgroup--with-text-area`, both themes.
Shots: `ig-ta-full-tz.png`, `ig-ta-tz.png` (close-up). Upstream: `ig-ta-full-up.png` — clean.

Same `border-inline-end` / `border-inline-start` on the prefix / suffix as finding 2, but this
story stacks prefix → textarea → suffix in a column, so the prefix's trailing hairline ends up
floating in the middle of the top row and the suffix's leading hairline ends up as a ~50px
vertical tick pinned to the inside of the composer's left border, next to the `+` button. Both
read as rendering artefacts. (The column layout comes from the story's own `flex flex-col`
class, but the lines themselves are drawn by component CSS and exist only because the theme sets
`--border-width-field: 1px`.)

### 4. MEDIUM — Disabled fields: the Description is the only thing left at full strength

`tf-disabled-tz.png`, `tf-disabled-tzd.png`, `nf-disabled-tz.png`, `otp-disabled-tz.png`.
Upstream: `tf-disabled-up.png` — label and description land on the same visual weight there.

In a disabled TextField the label drops to `opacity .38` (`heroui/styles/components/label.css`
`[data-disabled="true"] .label { status-disabled }`) and so does the control
(`.input` → `status-disabled`), but `.description` (`heroui/styles/components/description.css`)
has no disabled rule at all and keeps `color: #828282, opacity: 1` (probed). With
`--disabled-opacity: var(--tc-opacity-disabled)` = **0.38**
(`heroui/styles/themes/tzuchi/variables.css:23`, `packages/tokens/dist/tokens.css:58`) the label
renders at roughly #bebebe while the hint stays #828282 — the hint is now the most prominent text
in a control nobody can use, and the whole hierarchy reads upside down. Upstream has the same
missing rule but `--disabled-opacity: 0.5` and a near-black label
(`heroui/styles/themes/default/variables.css:23`), so the two lines stay level.

### 5. MEDIUM — Hover paints the same blue edge as focus, on every field in the family

`tf-hover-tz.png` vs `tf-focus-tz.png` / `tf-focus2-tz.png`; `in-hover-tz.png`, `in-hover-tzd.png`.
Upstream: `tf-hover-up.png` vs `tf-focus-up.png`.

`heroui/styles/themes/tzuchi/variables.css:60-61` (and `:104-105` for dark) set
`--field-border-hover` and `--field-border-focus` to the *same* token — `--tc-color-blue-500`
light, `--tc-color-blue-300` dark. Probed: hover border `rgb(79,123,190)`, focus border
`rgb(79,123,190)`. The only remaining difference is the 2px ring, which is that same blue sitting
2px further out, so a merely-hovered field is easy to read as the focused one — and in a form
where the pointer rests on one field while another holds focus, two fields wear the blue edge at
once. Upstream keeps hover at black/10% and focus at black/22% and puts the colour only in the
ring, so the two states never collide.

### 6. LOW — InputGroup: the affix divider keeps its neutral grey when the field turns red or blue

`ig-invalid-tz.png`, `ig-inv-price-tz.png` (focused + invalid), `ig-focus-tz.png`.
Upstream has no divider to mismatch (`ig-inv-price-up.png`).

The shell border switches to `--danger` / `--field-border-focus`
(`heroui/styles/themes/tzuchi/components/input-group.css:136-147`) but
`.input-group__prefix` / `__suffix` keep `border-color: var(--field-border)` from the base
(`heroui/styles/components/input-group.css:117-119`, `143-145`), so a red-bordered field has two
grey hairlines inside it. (NumberField shows the same grey-inside-red — `nf-inv-clip-tz.png` — but
upstream does too, `nf-inv-clip-up.png`, so that half is HeroUI's.)

### 7. LOW — SearchField: the two ends of the field are visually unbalanced

`sf-clear-tz.png`, `sf-clear-tzd.png`; upstream `sf-clear-up.png`.

The magnifier is 20px in brand navy `rgb(27,45,88)`
(`heroui/styles/themes/tzuchi/components/search-field.css:176-192`, deliberate per the file's own
comment), while the clear button on the other end was left at HeroUI's 20px grey pill with a 12px
`#828282` glyph (`search-field.css:194-201`). Result: a heavy, saturated icon on the left and a
faint, half-size one on the right of the same 43.6px box. Upstream has both at 16px in the same
grey, so it reads as a pair.

### 8. LOW — In-field suffix button: the focus ring spills over the field's border and breaks the outline

`ig-pwfocus-tz.png`, `ig-pwfocus2-tz.png`, `ig-pwfocus2-tzd.png`, `ig-copyfocus-tz.png`.
Upstream `ig-pwfocus2-up.png` — same geometry, invisible.

The icon button's ring is `0 0 0 2px <bg>, 0 0 0 4px <focus>` on a 36px button inside a field whose
content box ends ~2px away, so the ring crosses the field's 1px border; its 2px background-coloured
offset paints over the border, leaving a visible gap in the field outline exactly where the ring
passes. Upstream's InputGroup has no border, so there is nothing to interrupt.

### 9. LOW — InputOTP is the only field in the family that shows no invalid state on the control

`otp-val-tz.png`, `otp-val-tzd.png`; upstream `otp-val-up.png`.

`isInvalid` produces the red FieldError but the six slots keep their resting grey border and the
label stays black, while TextField / SearchField / InputGroup / NumberField all get a solid red
1px border **and** a red label in the same theme (`tf-invalid-tz.png`, `sf-invalid-tz.png`,
`ig-invalid-tz.png`). `heroui/styles/components/input-otp.css:59-60` does have
`&[data-invalid="true"] { status-invalid-field }`, but it never fires — upstream is identical, so
the bug is HeroUI's; the theme only widens the gap, because its other invalid fields are far
louder than upstream's.

---

## Checked and found FINE

- **Field geometry is consistent across the family.** Input, TextField, Textarea (line box),
  SearchField group, InputGroup and NumberField group all compute to exactly **43.5938px** tall,
  8px radius, 1px border, 16px/1.6 text, 20px inline padding. No stray 12px/14px text and no
  leftover 24px pill inside the family (`probe` on all six).
- **Input `--variants` / `--on-surfaces`** in both themes: primary (white/#1c1c1c) and secondary
  (#f2f2f2/#4f4f4f) both keep a visible 1px edge on default, secondary, tertiary and transparent
  surfaces — nothing vanishes in dark. `in-surfaces-tz.png`, `in-surfaces-tzd.png`.
- **Textarea**: 114px shell, resize grip visible in both themes (`ta-resize-tzd.png`), 3px pale
  focus halo renders cleanly and is not clipped (`ta-focus-tz.png`).
- **Invalid survives hover and focus** on TextField, SearchField, InputGroup and NumberField — the
  edge stays `--danger`, it does not flip to blue (`ig-inv-price-tz.png` after two Tabs).
- **Fieldset** in both themes: legend, description, three fields, bold labels with the red
  asterisk, button row — spacing and alignment all correct (`fieldset-tz.png`, `fieldset-tzd.png`).
- **InputOTP**: six slots, even 8.5px gaps, identical borders, separator bar centred; focused slot
  gets a clear blue border + 2px ring, typed digits animate in and the caret is visible
  (`otp-group-clip-tz.png`, `otp-focus-tz.png`, `otp-typed-tz.png`). Nothing clipped.
- **NumberField** `−`/`+` buttons: 40 × 41.6px, icons centred, full-height dividers, disabled `+`
  at max is clearly distinguishable from the enabled `−` (`nf-invalid-tz.png`). Chevron variant
  stacks correctly (`nf-chev-clip-tz.png`). Formats (EUR accounting, USD, %, decimal, 公斤) all fit
  without truncation (`nf-fmt-tz.png`).
- **InputGroup affix content**: copy button, password toggle, loading spinner, `⌘K` Kbd and the
  "Pro" badge are all vertically centred on the value's baseline and none of them is clipped
  (`ig-copy-tz.png`, `ig-pw-tz.png`, `ig-load-tz.png`, `ig-kbd-tz.png`, `ig-badge-tz.png`).
- **Labels do not wrap or truncate** at 16px/700 in any story, including the long
  "Currency (EUR - Accounting)" and "Decimal (2 decimal places)" (`nf-fmt-tz.png`).
- **Full-width variants** (`ig-fw-tz.png`, `sf-fw-tz.png`, `ta-fw-tz.png`) stretch cleanly; no
  scrollbars appear anywhere in the family.
- **Form examples** (SearchField, NumberField, InputOTP, Fieldset): label → field → description →
  button rhythm is even and the fields line up with the buttons below them.
- The native `input[type=number]` spinner that appears in `inputgroup--invalid` on focus is
  present in upstream too (`ig-inv-price-up.png`) — HeroUI's, not the theme's.
