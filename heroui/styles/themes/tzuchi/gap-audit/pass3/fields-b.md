# Unit `fields-b` — DateField · TimeField · DateInputGroup · InputOTP · ColorField · ColorInputGroup

Targets in brief order. Three shipped files, three "no file needed".
All paths are relative to `heroui/`.
Resolved values are for `[data-theme="tzuchi"]` / `[data-theme="tzuchi-dark"]`; where the two
modes differ, both are given.

**Composition fact that shapes the whole unit** (verified in
`react/src/components/date-field/index.ts:3-25`, `time-field/index.ts:3-25`,
`color-field/index.ts:3-21`): `DateField`, `TimeField` and `ColorField` are *field stacks only* —
label + group + description. Their shells are `DateInputGroup` (shared by DateField **and**
TimeField) and `ColorInputGroup`. So the three `*-field.css` targets carry no shell CSS at all,
and the two `*-input-group.css` files theme the actual fields.

---

## 1. `date-field.css` — NO FILE NEEDED

`styles/components/date-field.css` is 20 lines and contains exactly three things.

| property | HeroUI base (file:line + resolved value) | now | spec rule |
|---|---|---|---|
| `gap` (label ↔ group ↔ description) | `date-field.css:3` `@apply flex flex-col gap-1` → **4px** | unchanged | **R141 / R142** — 4px, *"already correct theme-wide, do not restate"* |
| `[data-slot="label"] { width }` | `date-field.css:12-14` `w-fit` | unchanged | structural (D32) |
| `[data-invalid] [data-slot="description"]` | `date-field.css:5-10` `hidden` | unchanged | behaviour (D32) |
| `.date-field--full-width` | `date-field.css:18-20` `w-full` | unchanged | opt-in width, no rule |

Precedent: passes 1–2 shipped **no** `textfield.css` override although `.textfield`
(`styles/components/textfield.css:3-12`) is the identical 4px stack used by the themed Input and
Textarea. Same shape, same outcome. The description/error *type* (R6/R7) belongs to
`description.css` / `field-error.css`, which are not this unit's files.

## 2. `time-field.css` — NO FILE NEEDED

`styles/components/time-field.css:1-20` is byte-for-byte the same file as `date-field.css` with the
class renamed. Identical reasoning; and its shell is `DateInputGroup`, which §4 themes.

## 3. `color-field.css` — NO FILE NEEDED

`styles/components/color-field.css:6-24` — same three things again (`gap-1`, `w-fit` label,
hidden description when invalid, `--full-width`). The hex *value* type (R21 → R2) is set on
`.color-input-group__input` in §6, where the text actually lives.

---

## 4. `date-input-group.css` — the DateField **and** TimeField shell

| property | HeroUI base (file:line + resolved value) | now (declaration + resolved value) | spec rule |
|---|---|---|---|
| shell height | `date-input-group.css:3` `h-9` → **36px** flat | `block-size: auto` + `min-block-size: calc(16px * 1.6 + 2*8px + 2*1px)` → **43.6px** | **R41 / R49**, applied in the `search-field.css:98-105` form |
| shell font-size | `date-input-group.css:3` `text-sm` → **14px** | `font-size: var(--tc-font-size-16, 16px)` → **16px** | **§1** (no 14px step) |
| shell line-height | `date-input-group.css:3` `text-sm` → **20px** | `line-height: var(--tc-line-height-relaxed, 1.6)` → **25.6px** | **R2** (field value, prose voice 1.6) |
| `__input` font-size | `date-input-group.css:61` `text-base sm:text-sm` → 16px < 40rem, **14px** ≥ 40rem | `font-size: var(--tc-font-size-16, 16px)` → **16px at every width** | **R2**, as `input.css:55` |
| `__input` line-height | `:61` `text-base`/`sm:text-sm` → 24px / **20px** | `line-height: var(--tc-line-height-relaxed, 1.6)` → **25.6px** | **R2**, as `input.css:56` |
| `__input` padding-inline | `:61` `px-3` → **12px** | `padding-inline: var(--tc-space-20, 20px)` → **20px** (8px beside an affix, via the base `ps-2`/`pe-2` rules at (0,3,0)) | **R50 / R53**, as `input.css:51`, `search-field.css:154` |
| `__segment` border-radius | `:97` `rounded-md` = `calc(var(--radius) * 0.75)` → **6px** | `border-radius: var(--tc-radius-sm, 4px)` → **4px** | **R34** — the corner is only ever visible as the focused fill's shape; 6px is not on the Tzu Chi scale (0/4/8/16/9999) |
| `__prefix` margin-inline-start | `:134` `ms-3` → **12px** | `margin-inline-start: var(--tc-space-20, 20px)` → **20px** | **R53**, as `search-field.css:191` |
| `__suffix` margin-inline-end | `:139` `me-3` → **12px** | `margin-inline-end: var(--tc-space-20, 20px)` → **20px** | **R53**, as `search-field.css:200` |
| border-color, focused | `:27-44` applies `status-focused-field` only → edge stays `--field-border` (**gray-300 / gray-750**) | `&:is(:focus-within, [data-focus-within="true"]):not(:where(:has(<picker-trigger>)))  { border-color: var(--field-border-focus) }` → **blue-500 / blue-300** | **R67** — "needed only where the base file forgot it" |
| border-color, invalid | `:50` `border-color: var(--color-field-border-invalid)` → **undefined variable** ⇒ invalid at computed-value time ⇒ `currentColor` | `&[data-invalid="true"] { border-color: var(--danger) }` → **red-500 / red-300** | **R68**, as `input.css:65`, `search-field.css:128` |
| border-color, invalid **+ hovered** | `:18-24` base hover (0,3,0) repaints `--field-border-hover` | mirrored hover pair under `[data-invalid]` → (0,5,0), stays `--danger` | **R69** (the hover-vs-invalid trap) |

**Cascade, hand-derived.** `:is(:focus-within, [data-focus-within="true"])` takes its most specific
argument, so both focus branches are **(0,3,0)**; `:not(:where(:has(…)))` contributes **0**. The
invalid rule is also **(0,3,0)** and is declared **after** it — later wins, so a focused invalid
field keeps the danger edge (`search-field.css:123-127`). The mirrored hover pair is **(0,5,0)**
against the base's **(0,3,0)**. The density/type rules are **(0,2,0)** against base **(0,1,0)**,
including the `sm:` step-down, which compiles to a nested `@media` on the same (0,1,0) selector.
`.date-input-group--secondary[data-invalid="true"]` (`:168-172`) is **(0,2,0)** — the danger edge
reaches the secondary variant too.

**Variants / sizes / states after the change** — `--primary`, `--secondary`, `--full-width`,
hover, focus-within, invalid, disabled, per-segment `data-type="literal"`, `data-placeholder`,
`data-focused`, `data-invalid`, `data-disabled`, and the DateRangePicker `slot="start"|"end"` rules
all still apply; none is hidden or flattened. The range-separator rules are (0,4,0) and still
outrank the 20px inset, so a range field keeps its joined layout.

### Left as HeroUI's (and why)

| left alone | why |
|---|---|
| focused-segment fill `bg-accent-soft` + `text-accent-soft-foreground` (`:110-113`) | Already **R78** expressed in HeroUI's own variables — a cursor on a *neutral* surface takes `--accent-soft` (R79's `--accent-soft-hover` is for a row inside an already-tinted panel). `--accent-soft` resolves to blue-100 / blue-900 here. Nothing to change. |
| invalid-segment `text-danger` + `bg-danger-soft` (`:121-129`) | **R86**, already the theme's danger channel. |
| segment `px-0.5` (2px), `text-end`, `text-nowrap`, `inline-block` | Spec silent; widening the inset would change the field's intrinsic width and push the segments apart. Rule 6 (restraint). |
| segment `[data-disabled] { opacity-50 }` (`:116-118`) | **D2** — disabled is not re-litigated per component. It already compounds with the group's `status-disabled` (0.38 here, 0.5 stock); changing 0.5→0.38 would only darken the compound. |
| prefix/suffix colour (`text-field-placeholder`) and any icon size | In every stock story the affix content is author-supplied with `size-4 text-muted` — utilities-layer classes that outrank a components-layer override by design (D10). R54's accent magnifier is SearchField's own mark. |
| the 2px `--focus` ring | **D21 / §11 I1** — Input, SearchField and Select all keep the ring; no `box-shadow` is re-declared (R74). |
| `overflow-hidden`, `gap-px`, `items-center`, the input-container's `overflow-x: auto` + `scrollbar-none` | Structural. |
| the three 150ms base transitions | **R136** — they are written as the `transition` shorthand with `motion-reduce:transition-none` after them; touching them would require restating both reduced-motion guards (R137) for no design gain. HeroUI's 150ms already equals `--tc-motion-duration-fast`. |
| `--secondary`'s `--default` fill | **D13 / R88**. |
| `--full-width`, the DatePicker/DateRangePicker trigger slots | Other units / structural. |

---

## 5. `input-otp.css`

| property | HeroUI base (file:line + resolved value) | now (declaration + resolved value) | spec rule |
|---|---|---|---|
| `__slot` height | `input-otp.css:17` `h-10` → **40px** flat | `block-size: auto` + `min-block-size: calc(16px * 1.6 + 2*8px + 2*1px)` → **43.6px** | **R41 / R49** + **§3.4**, which names InputOTP among the components that "follow R49–R54 — the Input shape" |
| `__slot` font-size | `:19` `text-sm` → **14px** | `font-size: var(--tc-font-size-16, 16px)` → **16px** | **§1** + **R21 → R1** |
| `__slot` font-weight | `:19` `font-semibold` → **600** | `font-weight: var(--tc-font-weight-bold, 700)` → **700** | **R1** (the Tzu Chi scale is 400/500/700; 600 does not exist) |
| `__slot` line-height | `:19` `text-sm` → **20px** | `line-height: var(--tc-line-height-normal, 1.5)` → **24px** | **§1.2** (a control's own content = the subtitle voice, 1.5) |
| `__slot-value` font-size | `:67` `text-lg` → **18px** | `font-size: var(--tc-font-size-16, 16px)` → **16px** | **R21** — all three roles it offers for an OTP digit are 16px; 18px is not on the type scale |
| `__slot-value` line-height | `:67` `leading-6` → **24px** | **unchanged** | already exactly 16 × 1.5 — restating it would be duplication (N5) |
| `__slot` border-color, active | `:44-46` sets `bg-field-focus` + the ring, **never** `border-color` → edge stays `--field-border` (**gray-300 / gray-750**) | `&[data-active="true"] { border-color: var(--field-border-focus) }` → **blue-500 / blue-300** | **R67** (`.input` paints the edge on focus, `input.css:29`) |
| `__slot` border-color, invalid | `:59-62` sets a background + the 1px danger outline, **never** `border-color` → neutral edge | `&[data-invalid="true"] { border-color: var(--danger) }` → **red-500 / red-300** | **R68** |

**Cascade, hand-derived.** `[data-theme^="tzuchi"] .input-otp__slot` is **(0,2,0)** against base
**(0,1,0)**; it ties with `.input-otp--secondary .input-otp__slot` (`:93`, also (0,2,0)) but that
rule only sets backgrounds — no contradiction. The two state rules are **(0,3,0)**, which beats the
base hover rule (`:35-41`, **(0,2,0)**) outright; unlike `.input`, the base hover here has **no**
`:not(:focus)` guard, so without the extra specificity an active or invalid cell would be repainted
`--field-border-hover` under the pointer. Invalid is declared **after** active, so an invalid cell
being edited keeps the danger edge.

**Geometry check.** The cell has no padding; its content is the value div at a 24px line box, so
`block-size: auto` alone would give 26px — the 43.6px floor is what sets the height. Width
(`w-9.5` = 38px with `flex-1`) is untouched, so a 6-cell row inside the story's `w-[280px]`
container still distributes exactly as before.

**Variants / sizes / states after the change** — `--primary`, `--secondary`, hover, `data-active`,
`data-filled`, `data-invalid`, `data-disabled`, the caret, the separator and the slot-value
entrance animation all still apply.

### Left as HeroUI's (and why)

| left alone | why |
|---|---|
| cell width `w-9.5` + `flex-1`, and R50's 20px inset | Layout geometry the spec is silent on; a 20px text inset is meaningless for a centred single glyph. Rule 6. |
| `rounded-field` (→ 8px) , `border-width-field` (→1px), `bg-field`, `shadow-field` | Already the Tzu Chi values through `variables.css` — N5/D1 forbid restating them. |
| the 2px `--focus` ring and the 1px danger outline | **D21 / R68** — the outline survives forced-colors and is what thickens into the ring. |
| `bg-field-focus` on active/filled, `--secondary`'s `--default` fill | **R88 / D13**. |
| caret (`h-4 w-[2px] rounded-sm bg-field-placeholder` + `animate-caret-blink`), separator dash (`h-[2px] w-[6px] rounded-sm bg-separator`) | Spec silent; `rounded-sm` already resolves to 4px = `--tc-radius-sm`. |
| `tracking-[-0.27px]` on the digit | Letter-spacing is not part of any Tzu Chi typography token; a single-glyph nicety, not a scale value. |
| `slot-value-in` 250ms entrance animation | **R140** — no new choreography, and R136 forbids touching `animation-name`. |
| root `[data-disabled] { opacity-50 }` (`:5-7`) | **D2**. Note it *compounds* with the slot's own `status-disabled`: 0.5 × 0.38 = **0.19** under this theme (0.5 × 0.5 = 0.25 stock). An upstream double-dip, present in HeroUI's own themes; lowering 0.5 to 0.38 would make it worse. Flagged, not changed. |
| `.input-otp` / `__group` `gap-2` → 8px | Already on the Tzu Chi rhythm (`--tc-space-8`). |

---

## 6. `color-input-group.css` — the ColorField shell

Same six changes as §4 minus the segment rule (a ColorInputGroup holds a plain `<input>`).

| property | HeroUI base (file:line + resolved value) | now (declaration + resolved value) | spec rule |
|---|---|---|---|
| shell height | `color-input-group.css:7` `h-9` → **36px** flat | `block-size: auto` + `min-block-size: calc(16px * 1.6 + 2*8px + 2*1px)` → **43.6px** | **R41 / R49** |
| shell font-size / line-height | `:7` `text-sm` → **14px / 20px** | `16px` / `1.6` → **16px / 25.6px** | **§1 / R2** |
| `__input` font-size | `:55` `text-base sm:text-sm` → 16px < 40rem, **14px** ≥ 40rem | `font-size: var(--tc-font-size-16, 16px)` → **16px at every width** | **R2**, and **R21** for the hex readout |
| `__input` line-height | `:55` → 24px / **20px** | `line-height: var(--tc-line-height-relaxed, 1.6)` → **25.6px** | **R2** |
| `__input` padding-inline | `:55` `px-3` → **12px** | `padding-inline: var(--tc-space-20, 20px)` → **20px** (8px beside an affix, base `ps-2`/`pe-2` at (0,3,0)) | **R50 / R53** |
| `__prefix` margin-inline-start | `:81` `ms-3` → **12px** | `margin-inline-start: var(--tc-space-20, 20px)` → **20px** | **R53** |
| `__suffix` margin-inline-end | `:86` `me-3` → **12px** | `margin-inline-end: var(--tc-space-20, 20px)` → **20px** | **R53** |
| border-color, focused | `:31-34` `status-focused-field` only → edge stays `--field-border` | `&:is(:focus-within, [data-focus-within="true"]) { border-color: var(--field-border-focus) }` → **blue-500 / blue-300** | **R67** |
| border-color, invalid | `:40` `var(--color-field-border-invalid)` → **undefined** ⇒ `currentColor` | `&[data-invalid="true"] { border-color: var(--danger) }` → **red-500 / red-300** | **R68** |
| border-color, invalid **+ hovered** | `:22-28` base hover (0,3,0) repaints `--field-border-hover` | mirrored hover pair under `[data-invalid]` → (0,5,0) | **R69** |

**Cascade** — identical to §4: focus **(0,3,0)** via `:is()`, invalid **(0,3,0)** declared after it,
the hover mirror **(0,5,0)**, everything else **(0,2,0)** vs **(0,1,0)**.
`.color-input-group--secondary[data-invalid="true"]` (`:118-122`) is **(0,2,0)**, so the secondary
variant gets the danger edge too.

**Geometry note.** `.color-input-group__input` keeps its `h-full`; with the shell content-driven,
`height: 100%` resolves against an auto-height containing block and falls back to `auto`, so the
input is 8 + 25.6 + 8 = 41.6px and the shell 43.6px — the floor is met exactly, not exceeded.

### Left as HeroUI's (and why)

Same list as §4, minus the segment entries, plus: the prefix/suffix `text-field-placeholder`
colour (the stock prefix is a `ColorSwatch`, which paints itself), and the input's `::placeholder`
rule (`:58-60`), which already uses `--field-placeholder` — unlike SearchField, this base file did
not forget it.

---

## Spec gaps

1. **`.date-input-group__segment` radius (R34 borrowed).** The spec has no rule for a date segment.
   HeroUI's `rounded-md` resolves to **6px**, a step the Tzu Chi radius scale does not contain.
   Closest role: R34 ("focus-shape on an inline element — only ever visible as the ring's shape"),
   which is `--tc-radius-sm` = 4px. Chosen as the most conservative on-scale value. If the owner
   would rather a date segment kept a chunkier highlight, `var(--tc-radius-md, 8px)` is the only
   other on-scale candidate.
2. **OTP digit type (R21 is NO EVIDENCE).** R21 lists "OTP digits" and offers three derivations —
   R1 (16/700/1.5), R5 (16/400/1.6), R16 (16/400/1.6) — all **16px**. I took **R1**, because the
   digit is the cell's own content and HeroUI already sets it bold (`font-semibold`). Consequence
   worth the owner's eye: HeroUI deliberately makes the digit *larger* than its field text
   (18px vs 14px, a 1.29× step up); on the Tzu Chi scale both collapse to 16px and the emphasis is
   carried by weight alone. If the step-up is wanted, `--tc-font-size-20` (20px, the chip/tab size)
   is the only on-scale way to express it — but nothing in the spec authorises it.
3. **OTP cell height 43.6px.** §3.4 names InputOTP in the field family, so R49 applies; but the
   formula is a *padding* sum (line box + 2×8px + 2×1px) and an OTP cell has no padding — it
   centres one glyph. Applied as a height floor so an OTP row lines up with an Input in the same
   form. The alternative reading is "a square-ish cell, like the pagination item (R33/R59)", which
   would keep 40px and take a 4px radius. Recorded, not taken.
4. **OTP disabled double-dip (upstream, not a theme gap).** `input-otp.css:5-7` puts `opacity-50` on
   the root while `:54-56` puts `status-disabled` (0.38 under this theme) on every slot — a
   disabled OTP row renders at **0.19**, against 0.38 for every other disabled control. D2 says not
   to re-litigate disabled per component, and the fix belongs upstream (drop one of the two).
5. **Letter-spacing has no token.** `tracking-[-0.27px]` on the OTP digit is the only typographic
   property in this unit with no Tzu Chi equivalent at all — `--tc-typography-*` encodes
   weight/size/line-height/family only. Left as-is.
6. **`--color-field-border-invalid` is referenced and never declared** — six base files
   (`search-field`, `input-group`, `color-input-group`, `number-field`, `date-input-group`, and
   their `--secondary` blocks) reference it; `grep -rn -- "--color-field-border-invalid"
   heroui/styles/` returns only references. Every themed field therefore has to restate
   `border-color: var(--danger)` (R68). Worth one upstream line instead of six overrides; the same
   observation is already in `search-field.css:56-58`.
7. **No `tc-*` counterpart exists for any component in this unit** (§12 Q8 already lists InputOTP
   and the colour components). Everything above is internally consistent with the spec but not
   traceable to a Figma decision.

---

## Checklist (§13)

1. Every rule, every `&` branch, is inside a single `[data-theme^="tzuchi"] { … }` block. ✔
2. `grep -n -- "--tc-color-\|#\|rgb(\|hsl(\|oklch(\|!important\| left\| right"` over the three
   files returns **only prose hits** ("left alone", "left in place", "left untouched") inside
   comments — the same wording `search-field.css:199` ships. No literal colour, no `!important`,
   no physical property. ✔
3. Tokens used — `--tc-font-size-16` (85), `--tc-line-height-relaxed` (94),
   `--tc-line-height-normal` (93), `--tc-font-weight-bold` (84), `--tc-space-8` (39),
   `--tc-space-20` (42), `--tc-radius-sm` (49) — all verified present in
   `packages/tokens/dist/tokens.css` at the given lines, all mode-independent, all with fallbacks. ✔
4. Colours come only from `--field-border-focus` and `--danger`, both HeroUI theme variables the
   Tzu Chi theme maps per mode (`variables.css:61,50` light / `:104,93` dark). No new `--tzuchi-*`
   is needed. ✔
5. Specificity hand-derived per rule — see the cascade paragraphs above. ✔
6. No `transition-property`, no `animation-name`, no `transition`/`animation` shorthand anywhere in
   the three files, so both reduced-motion guards keep winning untouched (R136). ✔
7. No variant, size or state hidden or flattened — enumerated per file above. ✔
8. Header comments record the variant mapping, what changed, what was kept and the cascade notes;
   comment/brace balance machine-checked (15/15, 13/13, 8/8 comment delimiters; braces balanced),
   and no `*` is followed by `/` except to close a comment (rule 8). ✔
9. Nothing in §10 was touched. ✔
