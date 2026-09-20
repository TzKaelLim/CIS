# Fix unit: `field-focus`

**Brief.** Unify the focus treatment of every Tzu Chi field shell on the Tzu Chi
source, not on HeroUI's. Before this pass, Textarea alone showed the Tzu Chi
focus (focus border + a soft 3px halo); every other field showed HeroUI's 2px
solid `--focus` ring. DESIGN-LANGUAGE §11 I1 / §12 Q2 records that the split was
mechanical (R74: "do not re-declare `box-shadow` to restyle a field's ring"),
not a design decision. The owner has settled it: all fields follow the Tzu Chi
sources.

**Source of truth.**
`packages/components/src/input/tc-input.styles.ts:42-44` —
`:host(:focus-within) .control { border-color: color.border.focus;
box-shadow: 0 0 0 3px color.brand.surface-hover }`; `:71-73` —
`:host([invalid]:focus-within) .control { box-shadow: 0 0 0 3px
color.feedback.error }`. `tc-textarea.styles.ts:42`, `tc-search-bar.styles.ts:
31-35` say the same. `tc-dropdown.styles.ts:36-40` styles only its own
`.trigger:focus-visible` outline, which has no HeroUI counterpart on a field
shell, so the Select/Autocomplete triggers follow the field rule like the rest
of the family (§3.4 and the owner's call).

**Theme variables used.** `--accent-soft-hover` is exactly
`color.brand.surface-hover` in both modes (`variables.css:34` blue-200 light,
`:78` blue-700 dark). `--danger` is `color.feedback.error`
(`variables.css:50` red-500 / `:94` red-300). No `--tc-color-*`, no literal,
no new variable.

---

## The mechanism (one defect, eleven files)

### Root cause

`styles/utilities/index.css:8-12`

```
@utility focus-field-ring {
  @apply ring-2 ring-focus ring-offset-0 outline-none;
  --tw-ring-offset-width: 0px;
}
```

and `:2-6` (`focus-ring`, the Select/Autocomplete variant, whose
`--tw-ring-offset-width` is `var(--ring-offset-width)` = 2px here).

Compiled (`storybook-static/assets/iframe-Bk2qYh3O.css`), every field's focus
rule expands to:

```
--tw-ring-shadow: var(--tw-ring-inset,) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color,currentcolor);
box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
--tw-ring-color: var(--focus);
```

`box-shadow` is **composed** from five layer variables. That is why R74 was
right that re-declaring `box-shadow` is destructive — it throws away
`shadow-field` and the inset layers — and why it is no longer an obstacle:
overriding **only `--tw-ring-shadow`** swaps the ring layer and leaves the other
four intact. Injection-verified on Input before anything was written:
`[data-theme^="tzuchi"] .input:focus { --tw-ring-shadow: 0 0 0 3px
var(--accent-soft-hover) }` produced
`… rgb(255,255,255) 0 0 0 0, rgb(209,222,255) 0 0 0 3px, rgba(0,0,0,0) 0 0 0 0`.

For the two shells that use `focus-ring` rather than `focus-field-ring`
(Select trigger, Autocomplete trigger) the ring also sits 2px out, behind an
opaque `--background` offset band. Those two additionally set
`--tw-ring-offset-width: 0px` — the same value `focus-field-ring` uses on every
text field ("ring sits directly against the element"). At width 0 the offset
layer draws `0 0 0 0`, exactly the border box, and is invisible.

### Reproduction (before)

`shots/field-focus/before-*.png`, theme `tzuchi`, keyboard focus (`key:Tab`).
Probed `box-shadow` on the focused shell:

| field | story | probed focused `box-shadow` (ring layer) |
|---|---|---|
| Input | `components-forms-input--default` | `rgb(79,123,190) 0 0 0 2px` |
| **Textarea** | `components-forms-textarea--default` | **`rgb(209,222,255) 0 0 0 3px`** (the only correct one) |
| SearchField | `components-forms-searchfield--default` | `rgb(79,123,190) 0 0 0 2px` |
| InputGroup | `components-forms-inputgroup--default` | `rgb(79,123,190) 0 0 0 2px` |
| NumberField | `components-forms-numberfield--default` | `rgb(79,123,190) 0 0 0 2px` |
| DateInputGroup | `components-date-and-time-datefield--default` | `rgb(79,123,190) 0 0 0 2px` |
| ColorInputGroup | `components-colors-colorfield--default` | `rgb(79,123,190) 0 0 0 2px` |
| InputOTP slot | `components-forms-inputotp--default` | `rgb(79,123,190) 0 0 0 2px` |
| Select trigger | `components-pickers-select--default` | `rgb(248,248,248) 0 0 0 2px, rgb(79,123,190) 0 0 0 4px` |
| ComboBox input | `components-pickers-combobox--default` | `rgb(79,123,190) 0 0 0 2px` |
| Autocomplete trigger | `components-pickers-autocomplete--default` | `rgb(248,248,248) 0 0 0 2px, rgb(79,123,190) 0 0 0 4px` |

### After

`shots/field-focus/after-*.png` (candidate) and `final-*.png` (the delivered
files, injected verbatim). Every field, both themes:

* light `rgb(209,222,255) 0 0 0 3px` (`--accent-soft-hover` = blue-200)
* dark `rgb(48,85,159) 0 0 0 3px` (blue-700)
* invalid + focused, light `rgb(212,73,79) 0 0 0 3px` (`--danger` = red-500),
  dark `rgb(240,138,142) 0 0 0 3px` (red-300)
* Select / Autocomplete: the offset band collapses to `… 0 0 0 0` and the halo
  hugs the border.

---

## Per file

Each rule below is scoped by `[data-theme^="tzuchi"]` (or nested in one), lives
in the same `components` layer, uses no `!important` and no physical property.
The focused **border** is nowhere restated: the base (or an existing override)
already sets `--field-border-focus`, and that border is the accessible
indicator — blue-500 on white is 3.96:1, clearing WCAG 1.4.11's 3:1. The halo
is emphasis on top of it.

### 1. `input.css`

* base: `styles/components/input.css:26-31` (`.input:focus`,
  `.input[data-focused="true"]`) → (0,2,0); invalid branch of
  `invalid-field-ring` → `.input[data-invalid="true"]:focus` (0,3,0).
* fix: `[data-theme^="tzuchi"] .input:focus, …[data-focused="true"]` (0,3,0)
  `{ --tw-ring-shadow: 0 0 0 3px var(--accent-soft-hover) }`, plus
  `…[data-invalid="true"]:focus / :focus-visible / [data-focused] /
  [data-focus-visible]` (0,4,0) with `var(--danger)`.
* why that specificity: (0,3,0) clears the base focus rule; the invalid rule
  must also clear the **pale** rule, which ties with the base's (0,3,0) invalid
  branch — hence (0,4,0), so the danger halo never loses on source order.
* before `before-input-tzuchi.png` → after `after-input-tzuchi.png`,
  `after-input-dark.png`, `final-input-tzuchi.png`,
  `after-input-secondary-tzuchi.png` (`.input--secondary`).

### 2. `textarea.css` — converted, not restyled

* the file already drew the halo, but with `box-shadow: 0 0 0 3px …` — the one
  exception R74 records. That declaration discards the whole composition,
  including `shadow-field`.
* fix: the same two rules now set `--tw-ring-shadow` instead. Selectors and
  specificity unchanged ((0,3,0) / (0,4,0)).
* **not injection-testable** (a removal cannot be injected) — see
  "Not verified by injection" below.
* `before-textarea-tzuchi.png` → `after-textarea-tzuchi.png`,
  `after-textarea-dark.png`.

### 3. `search-field.css`

* base: `styles/components/search-field.css:47-51`
  (`&[data-focus-within="true"], &:focus-within`, `status-focused-field`)
  (0,2,0); invalid branch `…[data-invalid="true"]:focus-within` (0,3,0).
* fix: the halo is added **inside the existing focus-border rule**
  (`&:focus-within, &[data-focus-within="true"]`, (0,3,0)) so the two halves of
  tc's single declaration stay together; the danger halo goes inside the
  existing `&[data-invalid="true"]` block as `&:focus-within,
  &[data-focus-within="true"]` (0,4,0).
* the header paragraph that read "KEPT DELIBERATELY — the focus ring" is
  rewritten as item 8; its stated reason (re-declaring `box-shadow`) no longer
  applies.
* `before-searchfield-tzuchi.png` → `after-searchfield-tzuchi.png`,
  `after-searchfield-dark.png`, `final-searchfield-tzuchi.png`;
  invalid `after-searchfield-invalid-tzuchi.png`,
  `final-searchfield-invalid-tzuchi.png`.

### 4. `input-group.css`

* base: `styles/components/input-group.css:33-38` —
  `.input-group:has([data-slot="input-group-input"]:focus)` and the
  `…-textarea` twin. `:has()` takes its most specific argument
  (`[data-slot][:focus]` = (0,2,0)), so the base is (0,3,0).
* fix: both `:has()` forms mirrored under the theme attribute → (0,4,0). Kept
  as two selectors rather than one `:has(a, b)` so the override is a literal
  mirror of the base. Invalid: `&:focus-within, &[data-focus-within="true"]`
  inside the existing invalid block (0,4,0), declared after the halo rule.
* `before-inputgroup-tzuchi.png` → `after-inputgroup-tzuchi.png`,
  `final-inputgroup-tzuchi.png`; the TextArea slot
  `after-inputgroup-textarea-tzuchi.png`; invalid
  `after-inputgroup-invalid-tzuchi.png`, `final-inputgroup-invalid-tzuchi.png`.

### 5. `number-field.css`

* base: `styles/components/number-field.css:55-60` (0,2,0); invalid branch
  (0,3,0). The shell is a grid wrapper and is never focusable itself, so
  `:focus-within` / `[data-focus-within]` are the matching states — the pair
  the base uses.
* fix: (0,3,0) halo beside the existing rules; (0,4,0) danger halo inside the
  invalid block. The stepper buttons are non-field controls and are untouched.
* `before-numberfield-tzuchi.png` → `after-numberfield-tzuchi.png`,
  `after-numberfield-dark.png`, `final-numberfield-dark.png`; invalid
  `after-numberfield-invalid-tzuchi.png`,
  `final-numberfield-invalid-tzuchi.png`.

### 6. `date-input-group.css` — the one selector that needed care

* base: `styles/components/date-input-group.css:27-44` is
  `&[data-focus-within="true"]:not(:has([data-slot="date-picker-trigger"]:focus,
  …[data-focused="true"], [data-slot="date-range-picker-trigger"]…))`.
  Specificity: class (0,1,0) + attribute (0,1,0) + `:not(:has(…))`, which takes
  its most specific argument `[data-slot=…][data-focused="true"]` (0,2,0)
  = **(0,4,0)**.
* the existing override's **border** rule deliberately uses
  `:not(:where(:has(…)))` at (0,3,0), which is enough because it only has to
  beat a (0,1,0) declaration. The halo has to beat the base focus rule itself,
  so it uses a plain `:has()` → **(0,5,0)**. The exclusion list is copied
  verbatim so the two cannot drift apart.
* invalid: the same selector plus `[data-invalid="true"]` → (0,6,0), clearing
  the base invalid branch (0,3,0), the base focus rule (0,4,0) and this file's
  own halo (0,5,0).
* the exclusion behaviour is preserved and was checked in the browser:
  focusing the calendar button (`components-date-and-time-datepicker--default`,
  4 × Tab) leaves the shell with an all-transparent `box-shadow` while
  `.date-picker__trigger` keeps HeroUI's `rgb(248,248,248) 0 0 0 2px,
  rgb(79,123,190) 0 0 0 4px`; focusing a segment (1 × Tab) lights the shell with
  the halo and leaves the trigger at `none`.
  `after-datepicker-trigger-tzuchi.png`, `after-datepicker-field-tzuchi.png`,
  `final-datepicker-trigger-tzuchi.png`.
* `before-datefield-tzuchi.png` → `after-datefield-tzuchi.png`,
  `after-datefield-dark.png`, `final-datefield-tzuchi.png`; invalid
  `after-datefield-invalid-dark.png`, `final-datefield-invalid-tzuchi.png`.

### 7. `color-input-group.css`

* base: `styles/components/color-input-group.css:30-34` (0,2,0); invalid branch
  (0,3,0). No trigger slot exists in this component
  (`react/src/components/color-input-group/color-input-group.tsx`), so no
  `:has()` guard is needed — unlike DateInputGroup.
* fix: halo added inside the existing `&:is(:focus-within,
  [data-focus-within="true"])` border rule (0,3,0); danger halo added inside the
  invalid block with the same `:is()` (0,4,0).
* `before-colorfield-tzuchi.png` → `after-colorfield-tzuchi.png`,
  `after-colorfield-dark.png`, `final-colorfield-dark.png`; invalid
  `after-colorfield-invalid-tzuchi.png`,
  `final-colorfield-invalid-tzuchi.png`.

### 8. `input-otp.css` — plus a second, smaller defect

* base: `styles/components/input-otp.css:44-46`
  (`.input-otp__slot[data-active="true"]`, (0,2,0)). The cell's focus state is
  `[data-active]`, not `:focus`.
* fix: (0,3,0) halo added to the existing `&[data-active="true"]` rule.
* **second defect.** `invalid-field-ring`'s *unfocused* branch
  (`utilities/index.css:14-17`) sets `--tw-ring-offset-width: 3px` on
  `.input-otp__slot[data-invalid="true"]`, and every one of that utility's
  focused branches keys off `:focus` / `[data-focused]` / `:focus-within` —
  none of which an OTP cell ever carries. So nothing resets it: compiled,
  `[data-invalid]` (line 58) comes after `[data-active]` (line 44) at equal
  (0,2,0) specificity and wins, leaving the active cell of an invalid row with a
  3px opaque offset band under its ring. The danger-halo rule therefore also
  sets `--tw-ring-offset-width: 0px`, at (0,4,0).
* `before-inputotp-tzuchi.png` → `after-inputotp-tzuchi.png`,
  `after-inputotp-dark.png`, `after-inputotp-secondary-tzuchi.png`,
  `final-inputotp-tzuchi.png`.

### 9. `select.css` (trigger only) — new section 7

* started from `css-reviewed/select.css` (the option-rows unit's reviewed
  output); nothing outside the new section 7 was touched, and the option-row
  inset ring was re-probed afterwards and is unchanged
  (`rgb(79,123,190) 0 0 0 2px inset`, `components-pickers-select--with-sections`).
* base: `styles/components/select.css:51-56` —
  `.select__trigger:focus-visible:not([data-focused])` (0,3,0) and
  `.select__trigger[data-focus-visible="true"]` (0,2,0); it applies
  `status-focused` (`focus-ring`), so `--tw-ring-offset-width` is
  `var(--ring-offset-width)` = 2px.
* fix: both forms mirrored under the theme attribute → (0,4,0) / (0,3,0), each
  setting `--tw-ring-offset-width: 0px` and the halo. Invalid:
  `.select:is([data-invalid="true"], [aria-invalid="true"])
  .select__trigger:is(:focus-visible, [data-focus-visible="true"])` = (0,5,0),
  over the base's (0,4,0) invalid branch and over the pale halo.
* §1's open-state rule sets only `background-color` / `border-color` and does
  not compete.
* `before-select-tzuchi.png` → `after-select-tzuchi.png`,
  `after-select-dark.png`, `final-select-dark.png`,
  `after-select-secondary-dark.png` (`.select--secondary`).

### 10. `combo-box.css` — new section 6

* started from `css-reviewed/combo-box.css`; only section 6 is new.
* base: `styles/components/combo-box.css:24-30` re-applies
  `status-focused-field` to `.combo-box [data-slot="input"]:focus` /
  `[data-focus]` at (0,3,0) — a **tie** with `input.css`'s themed
  `[data-theme^="tzuchi"] .input:focus` (0,3,0) that only the import order of
  two theme files would settle. That is exactly the fragility R69/N7 warn about,
  so the halo is stated here at (0,4,0), in the file that owns the selector.
* invalid: `[data-slot="input"][data-invalid="true"]:is(:focus, :focus-visible,
  [data-focused], [data-focus-visible])` = (0,5,0), over `input.css`'s base
  invalid branch (0,3,0), the base combo-box focus rule (0,3,0) and the halo
  (0,4,0).
* the disclosure button `.combo-box__trigger` is a non-field control and keeps
  HeroUI's 2px ring at 2px offset — untouched, and probed as `none` while the
  input is focused.
* `before-combobox-tzuchi.png` → `after-combobox-tzuchi.png`,
  `after-combobox-dark.png`, `final-combobox-tzuchi.png`.

### 11. `autocomplete.css` — new section 7

* started from `css-reviewed/autocomplete.css`; only section 7 is new.
* base `styles/components/autocomplete.css:40-44` is a line-for-line copy of
  select.css:51-56, so the fix is the same shape and the same specificities.
* `before-autocomplete-tzuchi.png` → `after-autocomplete-tzuchi.png`,
  `after-autocomplete-dark.png`, `final-autocomplete-dark.png`,
  `after-autocomplete-secondary-tzuchi.png` (`.autocomplete--secondary`).

### Not changed: `date-picker.css`, `date-range-picker.css`

`.date-picker__trigger` / `.date-range-picker__trigger` do have their own focus
rule (`status-focused`, `date-picker.css:26-28`), but they are `<button>`s
rendered inside the DateInputGroup's suffix slot
(`date-picker.tsx:120-127`, `date-picker.stories.tsx:53-66`), not field shells.
The brief keeps HeroUI's focus ring on non-field controls, and the base's own
`:not(:has([data-slot="date-picker-trigger"]:focus …))` guard — mirrored on the
new halo rule — already says the shell and the button are two different focus
targets. Verified in the browser (above): the button still shows HeroUI's ring.

---

## Not verified by injection

1. **Textarea's `box-shadow` removal.** `css:` can only ADD declarations; the
   build's existing `[data-theme^="tzuchi"] .textarea:focus { box-shadow: 0 0 0
   3px var(--accent-soft-hover) }` (a longhand at (0,3,0)) keeps winning over
   the base's composed `box-shadow` (0,2,0) no matter what is injected, so an
   injection of the delivered file still reports the old single-layer value.
   Proxy test instead: a rule that sets the new `--tw-ring-shadow` **and**
   re-declares the base composition verbatim
   (`box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow),
   var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)`)
   produced `… rgb(209,222,255) 0 0 0 3px …` (light) and
   `… rgb(48,85,159) 0 0 0 3px …` (dark) — which is what the composition will
   yield once the longhand is gone. Reasoning for the surviving layers: under
   this theme `--field-shadow` is `none`, and the inset layers are unset, so all
   four non-ring layers compute to `rgba(0,0,0,0) 0 0 0 0` — confirmed on Input,
   whose base rule set is identical (`shadow-field` + `focus-field-ring`).
   Risk: none beyond the colour/width, which match the old value exactly.
2. **Invalid + focused for ComboBox, Select, Autocomplete and InputOTP.** The
   static Storybook build has no invalid story for any of the four
   (`index.json`: combobox has `required` but no `invalid`; select and
   autocomplete have neither; `inputotp--with-validation` only flips
   `data-invalid` after a real form submit). Their danger rules were derived
   from the compiled base CSS and mirror the five shells where the danger halo
   *was* verified end to end (SearchField, NumberField, InputGroup,
   ColorInputGroup, DateInputGroup — all four screenshotted).
3. **InputOTP's `--tw-ring-offset-width: 0px`.** Same reason; derived from the
   compiled rule pair quoted in §8. If the integrator wants it seen, the
   `inputotp--with-validation` story needs a submit before the probe.
4. **Textarea invalid.** No invalid Textarea story exists; that rule pre-dates
   this pass and only changed mechanism, not selector, colour or width.
5. **Real pointer hover.** Untouched by this unit; the `@media (hover: hover)`
   invalid-border mirrors in these files were not modified.

## Machine-checkable assertions

None. Every change in this unit is a `box-shadow` / ring-layer change, and the
brief rules `box-shadow` and `color` out as assertion properties; nothing here
has a dimension-like computed effect (no size, padding, border-width, radius or
type metric moves — deliberately, so the halo cannot shift any layout). The
integrator should re-run the visual checks: `key:Tab` on each story in the
before/after table and probe the focused shell's `box-shadow` for a 3px layer in
`rgb(209,222,255)` (light) / `rgb(48,85,159)` (dark).
