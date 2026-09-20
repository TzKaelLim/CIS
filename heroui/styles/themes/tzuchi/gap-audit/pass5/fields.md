# Pass 5 — fix unit "fields"

Files replaced (full, at `heroui/styles/themes/tzuchi/components/`):

- `input-group.css` — items 1, 2, 3, 4
- `description.css` — item 5
- `search-field.css` — item 6
- `color-input-group.css` — item 7

Everything below was reproduced first, fixed, injected with `css:` in **both**
`tzuchi` and `tzuchi-dark`, and looked at. Screenshots are under
`(session screenshot, not kept) shots/fields/`
(`before-*` / `after-*` are the candidate; `final-*` and `assert-*` were taken
with the finished replacement file injected, not the candidate snippet).

---

## 1. [HIGH] InputGroup text suffix overflows the shell — FIXED

**Reproduction.** `components-forms-inputgroup--with-icon-prefix-and-text-suffix`,
theme `tzuchi`, no interaction.
`before-ipts-tz.png` — ".com" sits on the 1px border and its last glyph runs
into the rounded corner. Probed: group 280px, prefix 45px, input **187px**,
suffix 66px = 298px of content in a 280px box, 18px over, which eats the
suffix's entire 20px inset. `before-all-tz.png` (6th row) shows it in context.

**Root cause.** `heroui/styles/components/input-group.css:70` gives
`.input-group__input` `flex-1` and no `min-w-0`. A flex item's automatic
minimum size is its min-content width, and at Tzu Chi's 16px value type
(`themes/tzuchi/components/input-group.css:216-217`) that is 187px. The theme's
affixes are 20px+8px wide on each side (same file, :251, :256) instead of
HeroUI's 12/12, so the line no longer fits and overflows instead of shrinking.
Upstream fits at 40 + 183.3 + 56.7 = 280 exactly.

**Fix.** `.input-group__input { min-inline-size: 0 }` — the logical form of
Tailwind's `min-w-0`, which is what the base should have had.

**Specificity.** `[data-theme^="tzuchi"] .input-group__input` = (0,2,0). No
other rule declares a minimum inline size on it, and it does not disturb the
(0,3,0) `ps-0` / `pe-0` rules this file deliberately loses to.

**After.** `after-ipts-tz.png`, `final-all-tz.png`, `after-all-tzd.png`.
Input 187 -> **167px**; 45 + 167 + 66 = 278 = the 280px shell minus its two
borders. ".com" keeps its full 20px inset.
`--with-text-prefix` (the same bug, 9.7px, reported as less visible) is fixed by
the same declaration — see row 4 of `final-all-tz.png`.

---

## 2. [MEDIUM] Affix divider is a different length in every group — FIXED

**Reproduction.** `components-forms-inputgroup--all-variations`, `tzuchi`.
`before-all-tz.png` — five hairlines at five heights inside 43.6px fields.
Probed heights: icon prefix 16px, `⌘K` 24px, `$`/`USD`/`.com` 25.59px, icon
button 36px, badge 40px.

**Root cause.** `heroui/styles/components/input-group.css:115` and `:141` ask
for the full height with `h-full`, but `.input-group` only ever has a
`min-height` — `min-h-9` in the base (:3) and `min-block-size: …43.6px` in
`themes/tzuchi/components/input-group.css:146-149` — so `height: 100%` never
resolves and each affix is only as tall as its own content. Upstream has the
identical layout bug but `--border-width-field: 0`, so nothing is drawn.

**Fix.** `align-self: stretch` **plus `block-size: auto`** on
`.input-group__prefix, .input-group__suffix`.
The brief's decision is `align-self: stretch`; on its own it is inert here,
because stretch only applies when the cross size property computes to `auto`
and the base pins it to `100%`. Measured: with `align-self: stretch` alone the
affixes were still 16px / 25.59px (`t2.png` run without `block-size`); with
`block-size: auto` added they are 41.59px, the shell's inner height. Releasing
the base's `h-full` is the smallest change that makes the stated decision take
effect, so that is what was written.

Scoped `.input-group:not(:has([data-slot="input-group-textarea"]))`: in the
TextArea composer the group is a **column**, so stretching would set the prefix
to the full row width and re-centre its "Add Context" button. Item 3 removes
that layout's hairlines anyway, so nothing is lost by excluding it.

**Specificity.** (0,4,0) — theme attribute + `.input-group` + `:not(:has())`
(most specific argument is one attribute selector) + the affix class — against
the base's (0,1,0) `h-full`.

**After.** `final-all-tz.png`, `after-all-tzd.png`, `after-badge-tz.png`,
`after-pw-tz.png`. Every divider is 41.5938px, in both themes, for text, icon,
Kbd, button and badge affixes. Badge and icon-button affixes stay vertically
centred (`items-center` is untouched).

---

## 3. [MEDIUM] TextArea composer: two orphan hairlines — FIXED

**Reproduction.** `components-forms-inputgroup--with-text-area`, both themes.
`before-ta-tz.png` — a vertical tick right of "Add Context", and a ~50px tick
pinned inside the composer's left border next to the `+` button.

**Root cause.** The same `border-inline-end` / `border-inline-start` as item 2
(`heroui/styles/components/input-group.css:119`, `:145`), drawn because Tzu Chi
sets `--border-width-field: 1px`. The story stacks prefix -> textarea -> suffix
in a column (`className="flex flex-col"` in
`react/src/components/input-group/input-group.stories.tsx:387`), so each
hairline ends up dividing nothing.

**Fix.** Inside `.input-group:has([data-slot="input-group-textarea"])`, the
prefix gets `border-inline-end-width: 0` and the suffix
`border-inline-start-width: 0` — the one edge each affix actually draws; every
other side is already `none` in the base.

**Specificity.** (0,4,0) against the base's own textarea branch (0,3,0)
(`input-group.css:125-128`, `:151-154`), which only re-aligns the affixes.

**After.** `after-ta-tz.png`, `final-ta-tzd.png`. Both marks gone; "Add
Context" still left-aligned, toolbar row and 114px text box unchanged.

---

## 4. [LOW] Affix divider stays grey when the shell turns blue or red — FIXED

**Reproduction.** `components-forms-inputgroup--invalid` (`before-inv-tz.png`)
— a red-bordered field with two grey hairlines inside it. Focus:
`components-forms-inputgroup--with-text-suffix` + `focus:.input-group__input`
(`before-focus-tz.png`) — blue shell, grey hairline.

**Root cause.** The shell repaints on focus
(`heroui/styles/components/input-group.css:36`, `--field-border-focus`) and on
invalid (`themes/tzuchi/components/input-group.css:178`, `--danger`), but the
affixes keep `border-color: var(--field-border)` from
`heroui/styles/components/input-group.css:117-119` and `:143-145`.

**Fix.** Two rules keyed to exactly those two states, using the logical
longhand for the single edge that is drawn:
`border-inline-end-color` on the prefix, `border-inline-start-color` on the
suffix — `var(--field-border-focus)` under a literal mirror of the base's two
`:has()` focus forms, `var(--danger)` under `[data-invalid="true"]`.
Hover is deliberately not included (out of scope for this pass; a hovered,
unfocused field still has a grey hairline against a `--field-border-hover`
edge).

**Specificity, and why the third rule exists.** The focus rule is (0,5,0)
(theme + `.input-group` + `:has()` argument (0,2,0) + affix class); the plain
invalid rule is only (0,4,0), so a **focused invalid** group would have taken
the blue hairline while its shell stayed red. The danger colour is therefore
repeated behind the same `:has()` mirror at (0,6,0), so the outcome rests on
specificity rather than import order — the same trap R69 documents for the
shell border.

**After.** `after-inv-tz.png` (red hairlines), `after-focus-tz.png` (blue),
`final-invfocus-tz.png` / `after-invfocus-tzd.png` (invalid **and** focused =
red in both themes).

---

## 5. [MEDIUM] Disabled field / group leaves its Description at full opacity — FIXED

**Reproduction.** `components-forms-textfield--disabled`
(`before-tf-disabled-tz.png`): probed `.label` opacity **0.38**, `.description`
opacity **1**. `components-forms-radiogroup--disabled`
(`before-rg-disabled-tz.png`): `.radio-group > .description` 1 while the group
label and every option are 0.38 — the helper is the loudest text in a control
nobody can use. Same in `--checkboxgroup--disabled`, `--numberfield--disabled`.

**Root cause.** `heroui/styles/components/label.css:20-22` dims the label via
`[data-disabled="true"] .label`, and each control dims itself with
`status-disabled` (`utilities/index.css:61-65` = `opacity: var(--disabled-opacity)`),
but no rule anywhere reaches a **field- or group-level** description:
`heroui/styles/components/description.css` has no disabled rule, and
`textfield.css`, `radio-group.css`, `checkbox-group.css` and
`switch-group.css` have no disabled block at all. Upstream has the same hole
but hides it (0.5 opacity, near-black label, 12px hint); Tzu Chi's
`--disabled-opacity: 0.38` (`themes/tzuchi/variables.css:23`) and 16px helper
turn it into an inverted hierarchy.

**Fix** (`description.css`), `opacity: var(--disabled-opacity)` through two
hooks, both probe-confirmed on the live DOM:

- `:is([data-disabled="true"], fieldset:disabled):not(…) > .description` — the
  real hook. The disabled flag sits on the **field or group root**, the same
  element `label.css` keys off, and the description is its direct child
  (confirmed: `.textfield[data-disabled="true"] > .description`,
  `.radio-group[…]`, `.checkbox-group[…]`, `.number-field[…]` all match).
  `fieldset:disabled` only adds cover for a hand-written `<fieldset disabled>`:
  HeroUI's own Fieldset already mirrors `disabled` to `data-disabled`
  (`react/src/components/fieldset/fieldset.tsx:48-59`).
- `.label--disabled ~ .description` — for a hand-composed field with no root.
  `components-forms-inputotp--disabled` is exactly that (stories.tsx:121-141):
  a plain `<div>` with `<Label isDisabled>`, `<Description>` and
  `<InputOTP isDisabled>`, where the only `[data-disabled]` in the story is the
  OTP *slot*, so the first hook cannot reach it. `<Label isDisabled>` is the
  only occurrence in the whole story set (grepped), so this branch cannot
  collide with a component-driven disabled state.

**No double-dimming.** Opacity multiplies down the tree, so the `:not()`
excludes every host that already dims its own description or its whole row:
`.checkbox` (`checkbox.css:25-31`), `.radio` (`radio.css:34-42`), `.switch`
(`switch.css:16-26`), `.list-box-item` (`:68`), `.menu-item` (`:94`), `.tag`
(`tag.css:32-33`). Verified after the change: the **group** description moved
1 -> 0.38 while `.checkbox[data-disabled] > .description` and
`.radio[data-disabled] > .description` stayed at exactly 0.38, and
`.list-box-item[data-disabled] .description` stayed at 1 beneath its already
dimmed row.

**Specificity.** (0,4,1). Nothing in the base or the theme declares `opacity`
on a description, so the rule only has to sit under the theme attribute.

**After.** `after-tf-disabled-tz.png`, `after-tf-disabled-tzd.png`,
`final-rg-disabled-tz.png`, `after-cbg-disabled-tz.png` /
`after-cbg-disabled-tzd.png`, `after-otp-dis-tz.png` /
`final-otp-dis-tzd.png`. Checked unchanged: `chk-cb-dis-tz.png` (disabled
Checkbox item), `chk-listbox-tz.png` (disabled option rows),
`after-tf-desc-enabled-tz.png` (enabled description still opacity 1).

**Could not verify: SwitchGroup.** There is no disabled SwitchGroup anywhere —
`react/src/components/switch-group/switch-group.tsx` has no `isDisabled` prop
and no `Description` sub-component, and its three stories use neither. The
generic hook covers it the moment a consumer puts `data-disabled="true"` on the
group (the component spreads DOM props) or wraps it in a disabled Fieldset, but
there is no story to photograph.

---

## 6. [LOW] SearchField: 20px brand magnifier vs a 12px pale clear glyph — FIXED

**Reproduction.** `components-forms-searchfield--default` +
`focus:.search-field__input` + `type:heroui` → `before-sf-clear-tz.png`,
close-up `before-sf-clearzoom-tz.png`. Probed: magnifier 20px `rgb(27,45,88)`,
clear glyph 12px `rgb(130,130,130)` on a 20px pill.

**Root cause.** `themes/tzuchi/components/search-field.css:220-234` (pass 1)
took the magnifier to `--tc-size-icon-sm` in `--accent`, while
`heroui/styles/components/search-field.css:136-139` still shrinks the clear
glyph to `size-3`. That `size-3` is the only place in the library that shrinks
a close-button glyph; everywhere else it is `size-4`
(`heroui/styles/components/close-button.css:39-43`).

**Fix.** `.search-field__clear-button [data-slot="close-button-icon"]` gets
`inline-size` / `block-size: var(--tc-space-16, 16px)` — HeroUI's own default,
and the 16px the theme's `close-button.css:46-47` note already treats as the
Tzu Chi glyph size. Colour, fill, pill size and therefore hit area untouched,
as the decision asks.

**Specificity.** (0,3,0) against the base's (0,2,0).

**Geometry check.** The pill is 20px with 4px padding and the base gives the
svg `-mx-0.5 my-0.5`, so a 16px glyph still occupies a 12px inline box:
nothing reflows and nothing is clipped, and `shrink-0` stops flexbox squeezing
it back.

**After.** `final-sf-clear-tz.png`, `after-sf-clear-tzd.png` (close-up — the ✕
is fully inside the pill in dark too).

---

## 7. [LOW] ColorField channel fields: 20px padding in a 72px box — FIXED

**Reproduction.** `components-colors-colorpicker--width-fields`, `tzuchi`,
`key:Tab key:Enter` → `before-cp-fields-tz.png`. The three channel fields are
72px wide; with `padding-inline: 20px` the content box is ~30px, so "220°"
(16px, ~40px wide) runs to within ~9px of the border while "90%" / "50%" keep
15-19px — three fields reading as three different paddings.

**Root cause.** `themes/tzuchi/components/color-input-group.css:181`
(`padding-inline: var(--tc-space-20, 20px)`, R50) applied to every colour
input however narrow. The row itself is the story's plain
`<div className="grid w-full grid-cols-3 …">`
(`color-picker.stories.tsx:245`) inside a `max-w-62` popover.

**Fix.** `.color-picker__popover .color-input-group__input { padding-inline:
var(--tc-space-8, 8px) }`.

**Why that selector.** `.color-picker` cannot be used: React Aria **portals**
the popover out of the trigger, and `.color-picker .color-input-group__input`
probes as `NO MATCH`. The channel row carries no class of its own, so
`.color-picker__popover` is the nearest real hook — and the right one, since a
ColorField only ever appears there as a channel field.

**Specificity.** (0,3,0) — clears this file's own (0,2,0) 20px rule, and ties
the base's `ps-2` / `pe-2` affix rules (0,3,0,
`heroui/styles/components/color-input-group.css:62-69`), a tie source order
settles in this file's favour with no visible consequence because those rules
set the same 8px.

**After.** `final-cp-fields-tz.png`, `after-cp-fields-tzd.png` — all three
values start at the same 8px inset with 22px or more of trailing room.
Blast radius checked: `chk-cp-default-tz.png` and `chk-cp-sliders-tz.png` hold
no ColorField, and `chk-cf-all-tz.png` (`colorfield--all-variations`) still
probes `padding-right: 20px`, i.e. ColorField outside a ColorPicker is
untouched.

---

## Anything not verified

- **SwitchGroup disabled** (item 5): covered by the generic hook, but no story
  and no component support exists to photograph it. See item 5 above.
- **Item 4 hover**: a hovered, unfocused, valid group still shows a grey
  hairline inside a `--field-border-hover` edge. The decision named focus and
  invalid only, so hover was left alone.
- The `css:` harness can only add or change declarations, never remove one, so
  every fix above is expressed as an added/overriding declaration —
  `min-inline-size: 0`, `block-size: auto`, `border-inline-*-width: 0` — which
  is also how the replacement files are written. All final measurements in this
  report were taken with the finished replacement file injected, not the
  candidate snippet.
