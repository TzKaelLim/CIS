# Unit `form-scaffold` — Tzu Chi overrides for HeroUI's form scaffolding

Targets: `label`, `description`, `error-message`, `field-error`, `fieldset`,
`checkbox-group`, `radio-group`, `switch-group`.

**Result: 5 files, 9 declarations in total.** Three targets need nothing.

| target | file | declarations |
|---|---|---|
| Label | `css/label.css` | 3 |
| Description | `css/description.css` | 2 |
| ErrorMessage | `css/error-message.css` | 2 |
| FieldError | `css/field-error.css` | 2 |
| Fieldset | `css/fieldset.css` | 1 |
| CheckboxGroup | — | none needed |
| RadioGroup | — | none needed |
| SwitchGroup | — | none needed |

These four primitives are *shared*: `Label`, `Description`, `ErrorMessage` and
`FieldError` are rendered by every field family member, by every field group,
by the selection controls and by the option rows. Theming them here is what
closes `input.css:32-34`'s explicitly deferred item ("NOT HERE — tc-input also
renders its `<label>`, its required marker, its helper/error `<p>` … In HeroUI
those are separate components: label.css, description.css, field-error.css"),
and `gap-audit/input.md:80-86`'s "Not transferable" list.

Tailwind steps used below resolve as: `text-xs` = 12px / 16px,
`text-sm` = 14px / 20px, `text-base` = 16px / 24px, `font-medium` = 500.

---

## 1. Label — `css/label.css`

Base: `heroui/styles/components/label.css`

| property | HeroUI base (file:line → resolved) | now (declaration → resolved) | spec rule |
|---|---|---|---|
| `font-size` | `label.css:4` `text-sm` → **14px** | `font-size: var(--tc-font-size-16, 16px)` → **16px** | §1 R1 (control label); §1 "no 14px step" |
| `font-weight` | `label.css:4` `font-medium` → **500** | `font-weight: var(--tc-font-weight-bold, 700)` → **700** | §1 R1; §1.2 "is the control → subtitle" |
| `line-height` | `label.css:4` `text-sm` → **20px** (1.4286) | `line-height: var(--tc-line-height-normal, 1.5)` → **24px** | §1 R1; §1.2 "1.5 for controls" |

Direct Tzu Chi evidence: `tc-input.styles.ts:14-17` and
`tc-textarea.styles.ts:14-17` are both
`.label { font: var(--tc-typography-subtitle, 700 16px/1.5) }`;
`gap-audit/input.md:80-82` records the same three numbers.

### Who this reaches

TextField / Input, Textarea, SearchField, Select, ComboBox, Autocomplete,
NumberField, DateField, TimeField, DatePicker, ColorField, ColorPicker,
InputGroup, InputOTP, CheckboxGroup, RadioGroup, ToggleButtonGroup labels,
standalone ListBox / Menu labels, and the ProgressCircle story's sibling
`<Label>`. All of them were on the 14px step that Tzu Chi does not have.

### Exclusion list — and why each entry exists

`:not(:where(…))` contributes **0** specificity, so the rule stays at (0,2,0)
and the exclusion is purely declarative.

| excluded ancestor | spec role there | who already implements it |
|---|---|---|
| `.checkbox__content`, `.radio__content`, `.switch__content` | R5 / §1.2 — a selection control's label is **prose**, 400 16px/1.6 | `checkbox.css:129-134`, `radio.css:156-161`, `switch.css:118-123` set it on the **content container** and rely on inheritance, which any direct declaration would beat regardless of specificity |
| `.progress-bar` | R19 — the label is the **row-mate of a numeric readout**: 16px / 1.6, weight left at HeroUI's so the pair shares a baseline | `progress-bar.css:126-131` (shipped, and its comment says the weight stays HeroUI's) |
| `.slider`, `.meter`, `.color-slider` | same R19 role | this pass's `slider.css:147-150`, `meter.css:90-93`, `color-slider.css:110-113` — all three set only `font-size` + `line-height` at (0,3,0), so a 700 from here would have landed on them |

`.progress-circle` is **not** excluded: it has no `[data-slot="label"]` rule of
its own and its story renders the `<Label>` as a sibling outside the component
(`progress-circle.stories.tsx:127-133`), i.e. a standalone label → R1.

### Cascade

(0,2,0). Beats base `label.css:4` (0,1,0) outright. Ties — and wins on source
order, since the whole base component layer precedes this theme's
`components/index.css` in the same unlayered `components` layer — with every
per-host `[data-slot="label"]` rule at (0,2,0): `select.css:12-14`,
`date-field.css:12-14`, `time-field.css:12-14`, `color-field.css:16-18`,
`combo-box.css:12`, `number-field.css:12`, `search-field.css:12`,
`color-picker.css:29`, `list-box-item.css:21-23`, `menu-item.css:21-23`
(none of which declare type except the R19 family above).
Deliberately **loses** to the (0,3,0)+ theme rules that own their own label
metrics: `list-box-item.css:68-72`, `dropdown.css:117-128`,
`select.css:267-274` — all of which already land on the same 16 / 700 / 1.5
(R4 / R94), so nothing is duplicated or contradicted.

### Left as HeroUI's (and why)

- **Colour, every state.** `text-foreground` → `--foreground` is already
  tc `color.text.default`, the exact token `tc-input`'s label uses (N5 / D1).
  `.label--invalid` / `[data-invalid="true"] .label` → `text-danger`
  (`--danger`, R86) and `.label--disabled` → `status-disabled`
  (`--disabled-opacity` 0.38, D2 / R85) both keep working.
- **The required marker.** `label.css:12-17` `after:ms-0.5 after:text-danger
  after:content-['*']` — 2px inset. tc uses 4px
  (`tc-input.styles.ts:19-22`). §9 has no rule for a required-marker gap, and
  the base rule's third branch
  `[data-required="true"]:not([role="group"]):not([role="radiogroup"]):not([role="checkboxgroup"]) > .label`
  is (0,5,0): three mirrored high-specificity selectors to move an asterisk
  2px is not a trade Rule 6 supports. Listed under spec gaps.
- **Geometry.** `w-fit`, `select-none`, `cursor`, `grid-area`,
  `pointer-events-none` — layout, not design language.
- **The 4px label→control gap** (R141): already theme-wide via each field's
  `gap-1`. "Do not restate."

---

## 2. Description — `css/description.css`

Base: `heroui/styles/components/description.css`

| property | HeroUI base (file:line → resolved) | now (declaration → resolved) | spec rule |
|---|---|---|---|
| `font-size` | `description.css:3` `text-xs` → **12px** | `font-size: var(--tc-font-size-16, 16px)` → **16px** | §1 R6 |
| `line-height` | `description.css:3` `text-xs` → **16px** (1.3333) | `line-height: var(--tc-line-height-relaxed, 1.6)` → **25.6px** | §1 R6; §1.2 "1.6 for prose" |

R6's own evidence line is `tc-input.styles.ts:84-89` /
`tc-textarea.styles.ts:91-96` — `.helper { font: typography-body;
font-size: 16px; color: text-muted }`. §1.3's four deliberate 12px survivors
(`.header`, `.badge__label`, the breadcrumb separator, the close-button glyph)
do not include `.description`.

Colour is **not** restated — `text-muted` → `--muted` is already tc
`color.text.muted` (N5 / D1). Weight is **not** restated: 400 is the inherited
default, and `list-box-item.css:76-78` deliberately re-asserts 400 inside an
option row (whose row text is 700); that (0,3,0) rule is untouched.

### Cascade

(0,2,0). Beats base (0,1,0). **Ties, and wins on source order** with the two
base rules that re-assert `text-xs` through the slot attribute:
`checkbox.css:11-14` (`.checkbox > [data-slot="description"]`) and
`radio.css:27-30` — both (0,2,0), both in the base layer, which is imported in
full before this theme's `components/index.css`. `switch.css:30-32` and
`switch.css:235` set only padding / cursor. No rule in this theme declares a
description font-size or line-height, so there is no intra-theme tie.

### Left as HeroUI's (and why)

- **The 4px control→description gap** (R142): every host is already `gap-1`
  = 4px — `.textfield:4`, `.checkbox:6`, `.radio:14`, `.switch:3`,
  `.select:3`. R142's value, already correct, not restated.
- **The indent under a selection control** (R144): `checkbox.css:137-141`
  (40px), `radio.css:164-167` (40px), `switch.css:128-131` (52/44/60px) own
  `padding-inline-start` at (0,3,0). This file touches no box property.
- **`[data-invalid] [data-slot="description"] { hidden }`** in textfield,
  select, date-field, time-field, color-field, combo-box, number-field,
  search-field — display untouched.
- **`.tag-group [data-slot="description"] { p-1 }`** (`tag-group.css:10-15`)
  — padding only; D29 leaves TagGroup spacing alone.
- **Option-row descriptions** keep `pointer-events-none` / `text-wrap` /
  `select-none` and `list-box-item.css:76-78`'s weight-400 re-assert. Their
  *size* was still 12px after pass 1 (only the row moved to 16px); they now
  join the 16px scale, which §1 requires and §1.3 does not exempt.

---

## 3. ErrorMessage — `css/error-message.css`

Base: `heroui/styles/components/error-message.css`

| property | HeroUI base (file:line → resolved) | now (declaration → resolved) | spec rule |
|---|---|---|---|
| `font-size` | `error-message.css:3` `text-xs` → **12px** | `font-size: var(--tc-font-size-16, 16px)` → **16px** | §1 R7 |
| `line-height` | `error-message.css:3` `text-xs` → **16px** | `line-height: var(--tc-line-height-relaxed, 1.6)` → **25.6px** | §1 R7 (= R6 metrics) |

R7's evidence is `tc-input.styles.ts:91-93` / `tc-textarea.styles.ts:98-100`:
`.helper.error` is the helper rule with **only the colour changed**, so under
Tzu Chi the helper line and the error line are by construction the same type.

Colour **not** restated — `text-danger` → `--danger` (N5 / D1 / R86).

### Cascade

(0,2,0) against (0,1,0). Nothing else in either layer declares a font-size or
line-height reaching `.error-message`
(`tag-group.css:12-14` sets `p-1` only).

### Left as HeroUI's (and why)

- **Motion.** `error-message.css:9-12`
  `transition: opacity 150ms var(--ease-out), height 350ms var(--ease-smooth)`
  + `motion-reduce:transition-none`. §8 gives no rule for a validation reveal;
  R140 forbids new choreography; R136 warns that the `transition` shorthand
  rewrites `transition-property`, which would out-specify HeroUI's
  reduced-motion guard and force both guards to be restated (R137) for no
  design gain.
- `h-auto`, `wrap-break-word`, and the whole box model.

---

## 4. FieldError — `css/field-error.css`

Base: `heroui/styles/components/field-error.css`

| property | HeroUI base (file:line → resolved) | now (declaration → resolved) | spec rule |
|---|---|---|---|
| `font-size` | `field-error.css:3` `text-xs` → **12px** | `font-size: var(--tc-font-size-16, 16px)` → **16px** | §1 R7 |
| `line-height` | `field-error.css:3` `text-xs` → **16px** | `line-height: var(--tc-line-height-relaxed, 1.6)` → **25.6px** | §1 R7 (= R6 metrics) |

Same evidence as §3. Keeping it byte-identical to `description.css` also means
a field does not resize its help row when validation flips.

Colour **not** restated. Under a checkbox / radio / switch the base
deliberately repaints it `text-muted` (`field-error.css:19-27`); that stays,
and it now shares `description.css`'s metrics there too — exactly the stated
intent of that base rule ("stack below the label like description").

### Cascade

(0,2,0). Beats base (0,1,0). **Ties, and wins on source order** with the three
base rules that re-assert `text-xs` through the slot attribute:
`checkbox.css:11-14`, `radio.css:27-30`, `switch.css:34-36` — all (0,2,0), all
in the base layer. The per-size switch rules `switch.css:38-52` are (0,3,0) but
set `ps-*` only. No intra-theme tie.

### Left as HeroUI's (and why)

- **The collapse mechanism.** `h-0` / `opacity-0` /
  `data-visible:h-auto` / `data-visible:opacity-100`. Nothing here touches
  height or opacity, so a hidden FieldError still contributes no block size —
  its taller line box is clipped by `h-0` exactly as the 12px one was.
- **Motion** — as §3. The 350ms height leg is also what makes the taller
  25.6px line box animate in smoothly.
- **`px-1`** (4px inline inset). §9 has no rule for it; see spec gaps.
- **The toggle-field re-layout** `field-error.css:19-27`
  (`m-0 h-auto min-h-0 p-0 text-muted opacity-100; transition: none` for
  `.checkbox > …`, `.switch > …`, `.radio > …`) — untouched; the shipped
  overrides re-add the indent at (0,3,0) and still win.

---

## 5. Fieldset — `css/fieldset.css`

Base: `heroui/styles/components/fieldset.css`

| property | HeroUI base (file:line → resolved) | now (declaration → resolved) | spec rule |
|---|---|---|---|
| `.fieldset__legend` `font-weight` | `fieldset.css:9` `font-medium` → **500** | `font-weight: var(--tc-font-weight-bold, 700)` → **700** | §1 R1 (R1's "Replaces" column names `text-base` + `font-medium`), applied in R11's shape |
| `.fieldset__legend` `font-size` | `fieldset.css:9` `text-base` → **16px** | *(unchanged)* | already the R1 size — N5, do not restate |
| `.fieldset__legend` `line-height` | `fieldset.css:9` `text-base` → **24px** (1.5) | *(unchanged)* | already the R1 line box — N5 |

Exactly the treatment R11 prescribes for an overlay heading
(`modal.css:81-83`: "font-weight 700 only — HeroUI's `text-base` is already
16/1.5"). The legend therefore lands on the same 16 / 700 / 1.5 as a field's
Label; §1 has no larger group-heading role, so this is the conservative choice
from the closest role (see spec gaps).

### Cascade

(0,2,0) against (0,1,0). `.fieldset__legend` never carries `.label`, so
`label.css`'s rule cannot reach it and there is no tie.

### Left as HeroUI's (and why) — every gap in this component is already correct

| base | value | rule |
|---|---|---|
| `.fieldset { gap-6 }` (`fieldset.css:3`) | 24px between legend / description / field-group / actions | R145 "leave `Fieldset`/`SwitchGroup`'s `gap-6` (24px) between *sections*" |
| `.fieldset__field-group { space-y-4 }` (`:13`) | 16px between fields | R145 — already on the 4px rhythm |
| `.fieldset__actions { gap-2 }` (`:17`) | 8px | R150 action-row gap, already `--tc-space-8` |
| `.fieldset__actions { pt-1 }` (`:17`) | 4px | R154 micro gap, already `--tc-space-4` |
| `shrink grow basis-0` (`:5`), `w-full` (`:13`), `flex items-center` (`:17`) | — | structure (D32) |
| `data-disabled` mirroring + React Aria context forwarding (`fieldset.tsx:48-90`) | — | behaviour (D32); the look it drives is `status-disabled` / 0.38, already right (D2 / R85) |
| `.fieldset__description` slot (`fieldset.styles.ts:9`) | no base rule exists | the stock story uses the shared `<Description>`, already themed in §2; nothing invented |

---

## 6. CheckboxGroup — no file needed

Base `checkbox-group.css` is four declarations:
`.checkbox-group { flex flex-col }` and `[data-slot="checkbox"] { mt-4 }`
(16px).

R145 decides this outright: *"HeroUI's bases today are `mt-4` (16px,
checkbox/radio) and `gap-6` (24px, switch/fieldset) — both are already on the
Tzu Chi 4px rhythm, so **the safe move is to change nothing** and only align an
outlier if one appears."* 16px = `--tc-space-16`. No outlier.

The group's own `<Label>` and `<Description>` (`checkbox-group.stories.tsx:28-29`)
are direct children, i.e. outside `.checkbox__content`, so they take R1 and R6
from `label.css` / `description.css` — which is the whole point of doing those
centrally.

Nothing else in the file: no colour, no radius, no border, no type.

## 7. RadioGroup — no file needed

Base `radio-group.css` is: `flex flex-col`; vertical
`[data-slot="radio"] { mt-4 }` (16px); horizontal
`flex-row flex-wrap gap-4` (16px); and the `--secondary` variant block
(`radio-group.css:22-48`).

- **Gaps** — R145, as above. 16px is `--tc-space-16`; change nothing.
- **`.radio-group--secondary`** — a neutral `--default` / `--default-hover`
  control fill with no tc counterpart. R88 case ①: *"HeroUI-only neutral
  variants with no tc counterpart … leave it alone."* D13 says the same for
  every field's `--secondary`. It is also already settled upstream:
  `radio.css:53-56` records that the theme's radio hover rule ties
  `radio-group--secondary`'s and wins on source order, bringing its hover ring
  to `--accent` — a decision made in pass 1 that this unit must not
  re-litigate (Rule 7).
- **Secondary still works** under the themed radio: unselected keeps the
  `--default` control fill and `--default`-filled indicator, selected takes
  `radio.css:106-113`'s `--field-background` + accent ring + accent dot, hover
  takes `--accent`. Orientation, per-radio invalid and the custom-indicator
  story are untouched.

## 8. SwitchGroup — no file needed

Base `switch-group.css` is: `.switch-group { flex flex-col gap-6 }` (24px
between the group's own sections), `.switch-group__items { flex gap-4 }`
(16px between switches), and the two orientation modifiers.

R145 names this file explicitly and concludes "change nothing": `gap-6` is the
between-sections value it says to leave, and 16px is on the 4px rhythm.
`D27` additionally lists **SwitchGroup** among the things pass 1 left
untouched on purpose.

---

## Spec gaps

1. **R6 and R7 are marked "No override precedent" by the spec itself.** The
   26 shipped files only ever *re-indent* `[data-slot="description"]` /
   `[data-slot="field-error"]`; none ever set a font-size on them
   (verified in the spec's own fact-check log, §14 item 8). `description.css`,
   `error-message.css` and `field-error.css` in this unit are the **first**
   implementation of those two rules. Their only source is
   `tc-input.styles.ts:84-93`, which is a Lit component, not a Figma frame.
2. **Field label line-height vs field line-height.** R1 puts the label on 1.5
   (24px) while R2 puts the field value and R6 the helper on 1.6 (25.6px), so a
   themed TextField now stacks 24 / 43.6 / 25.6. That is faithful to
   `tc-input.styles.ts` (subtitle label, body input, body helper) and is the
   same 1.5-vs-1.6 seam §11 I2 already records for Select-vs-Input heights.
   Recorded, not resolved.
3. **`.field-error`'s `px-1`.** A field's error line is inset 4px while its
   description line is inset 0, so the two help rows do not left-align under
   the same field. §9 gives no rule for it, so it was left exactly as HeroUI
   ships it. Someone with the Figma should confirm.
4. **The required marker's inset.** HeroUI `after:ms-0.5` = 2px;
   `tc-input.styles.ts:19-22` says 4px. §9 R154's "micro gap" covers 4px but
   names no required-marker role, and beating the base's (0,5,0) selector
   chain would cost three mirrored selectors. Left at 2px.
5. **Fieldset legend has no Tzu Chi counterpart** and §1 has no group-heading
   role distinct from R1 / R11, so a legend and the field labels beneath it are
   now the same 16 / 700 / 1.5, distinguished only by position and the 24px gap.
   If a legend is meant to outrank its fields, that needs a new role in §1,
   not a component override. (Q8 class: "components with no Tzu Chi counterpart
   at all".)
6. **Group gaps (R145) are themselves "NO EVIDENCE — derive".** The
   change-nothing outcome for CheckboxGroup / RadioGroup / SwitchGroup /
   Fieldset is the spec's own recommendation, but it is a derivation, not a
   traceable Figma decision.
7. **No rule for a validation-line reveal.** §8's three tokens cover trigger
   colour fades (R131), travelling indicators (R132) and overlay entry (R133);
   an error line expanding from `h-0` fits none of them, so
   `opacity 150ms` + `height 350ms` were left untouched (also the safe answer
   under R136 / R137).

## Cross-unit note (not a gap — a coupling to keep in sync)

`label.css`'s exclusion list encodes **who else owns a `[data-slot="label"]`**.
Two families are in it: the selection controls (R5 prose label, set on the
content container by `checkbox.css` / `radio.css` / `switch.css`) and the R19
readout row (`progress-bar.css` shipped; `slider.css`, `meter.css`,
`color-slider.css` added in this pass, each setting `font-size` +
`line-height` only and leaving the weight to HeroUI). **If a future component
takes the R19 role, it must either be added to that `:where()` list or declare
its own weight**, or `label.css` will make its label 700 and break the shared
baseline with the numeric output.

## Checklist (spec §13)

1. Every rule, every branch, under `[data-theme^="tzuchi"]` — verified
   mechanically across all five files.
2. Grepped clean for `--tc-color-`, `#`, `rgb(`, `hsl(`, `oklch(`,
   `!important`, physical `left:` / `right:`.
3. Every `--tc-*` used — `--tc-font-size-16` (tokens.css:85),
   `--tc-font-weight-bold` (:84), `--tc-line-height-normal` (:93),
   `--tc-line-height-relaxed` (:94) — exists, carries a fallback, and appears
   in **neither** dark block of `tokens.css` (`[data-theme="dark"]` or the
   `prefers-color-scheme` block), so all four are genuinely mode-independent.
4. **No colour is declared at all** in this unit — not one property. Every
   colour these four primitives use (`--foreground`, `--muted`, `--danger`)
   already arrives through the theme.
5. Specificity hand-derived per file; see each Cascade section.
6. No `transition-property`, no `animation-name`, no `transition` shorthand
   anywhere (R136), so no reduced-motion guard needed restating (R137).
7. No HeroUI variant, size or state hidden: required / invalid / disabled
   label states, the FieldError collapse + its `data-visible` toggle, the
   toggle-field re-layout, `radio-group--secondary`, both SwitchGroup
   orientations, both RadioGroup orientations and all three switch sizes all
   still resolve — only the type changed.
8. Header comments record variant mapping, what changed, what was kept and
   the cascade math.
9. Nothing in §10 touched. D1 (theme variables), D2 (disabled), D3 (focus
   ring), D13 (`--secondary` fields), D27 (SwitchGroup), D29 (TagGroup
   spacing) and D32 (behaviour) are all explicitly honoured above.
