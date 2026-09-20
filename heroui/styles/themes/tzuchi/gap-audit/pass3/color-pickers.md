# Unit "color-pickers" — ColorSwatch · ColorSwatchPicker · ColorPicker

Targets written (all three needed changes):

| target | file |
|---|---|
| ColorSwatch | `heroui/styles/themes/tzuchi/components/color-swatch.css` |
| ColorSwatchPicker | `heroui/styles/themes/tzuchi/components/color-swatch-picker.css` |
| ColorPicker | `heroui/styles/themes/tzuchi/components/color-picker.css` |

None of the three has a Tzu Chi counterpart (`tc-*` element, component token file, or
gap-audit report) — spec §12 Q8 lists ColorArea / ColorSlider / ColorSwatch(Picker) among the
components with **no** Figma decision behind them. Every value below is therefore derived from a
named spec role, and the derivation is cited rather than asserted.

Resolved-value baseline for this theme: `--radius: var(--tc-radius-md)` = **8px**
(`themes/tzuchi/variables.css:19`), so `themes/shared/theme.css:104-111` gives
`--radius-sm` 4px · `--radius-md` **6px** · `--radius-lg` 8px · `--radius-xl` **12px** ·
`--radius-2xl` 16px · `--radius-3xl` 24px. Tailwind `text-sm` = 14px/20px.

---

## 1. ColorSwatch — `color-swatch.css`

| property | HeroUI base (file:line → resolved) | now (declaration → resolved) | spec rule |
|---|---|---|---|
| `border-radius`, `shape="square"` | `styles/components/color-swatch.css:20` `@apply rounded-md` → **6px** | `[data-theme^="tzuchi"] .color-swatch--square { border-radius: var(--tc-radius-sm, 4px) }` → **4px** | §2 **R25** (checkbox control = `--tc-radius-sm`) + §2 **R33** (square-ish cell = `--radius-sm`); §0 ladder has no 6px step |

Applies at every size, because the base file declares the square radius exactly once and never
per size — the same shape R33 gives the pagination cell, which holds 4px from a 32px cell to a
48px one.

### Left as HeroUI's (and why)

| what | why |
|---|---|
| `shape="circle"`, all five sizes (`:16`, `:28`, `:36`, `:48`, `:56`) | Under `--radius: 8px` every one of those radii reaches or exceeds half its box — xs `rounded-lg` 8px on a 16px box, sm `rounded-xl` 12px on 24px, md `rounded-2xl` 16px on 32px, lg/xl `rounded-3xl` 24px on 36px/40px. Already a true circle: §2 **R26** with nothing to restate (§0 **N5**). |
| Size scale xs 16 / sm 24 / md 32 / lg 36 / xl 40px (`:24`, `:32`, `:44`, `:52`) | §3 gives no metric for a colour sample. md and xl already land on `--tc-size-icon-md` (32px) and `--tc-size-icon-lg` (40px). |
| `box-shadow: inset 0 0 0 1px …` hairline (`:11`) and the checkerboard `repeating-conic-gradient` (`:6-8`) | Part of how the swatch renders its own colour (the brief's "never touch swatch colour backgrounds"); §4 has no border rule for a colour sample, and its literals are in HeroUI's file, not in the override. |
| `--color-swatch-current` (React sets it inline, `color-swatch.tsx:27`) | The swatch fill. |

---

## 2. ColorSwatchPicker — `color-swatch-picker.css`

Structurally a row of 32px, 2px-bordered selection cells whose selected state is a border in the
item's own colour: the Checkbox box model (§3.6 **R62**) driving the Tag/chip selection grammar
(§5 **R83**).

| property | HeroUI base (file:line → resolved) | now (declaration → resolved) | spec rule |
|---|---|---|---|
| item `border-radius`, `variant="square"` md | `color-swatch-picker.css:164` `rounded-xl` → **12px** | `.color-swatch-picker--square .color-swatch-picker__item { border-radius: var(--tc-radius-sm, 4px) }` → **4px** | §2 **R25** + **R33** |
| …same, `xs` | `:179` `rounded-md` → **6px** | same rule → **4px** | §2 R25/R33 |
| …same, `sm` | `:194` `rounded-lg` → **8px** | same rule → **4px** | §2 R25/R33 |
| …same, `lg` / `xl` | `:214`, `:229` `rounded-xl` → **12px** | same rule → **4px** | §2 R25/R33 |
| swatch `border-radius`, square md | `:166` / selected `:170` `rounded-lg` → **8px** | `calc(var(--tc-radius-sm, 4px) - var(--tzuchi-swatch-border-width, 2px))` → **2px** | §2 **R39** (inner fill = control radius − border width), the form `checkbox.css:78-79` uses |
| …same, square `xs` (1px border, `:124`) | `:181` / `:185` `rounded-md` → **6px** | helper = 1px → **3px** | §2 R39 |
| …same, square `sm` (2px border, `:130`) | `:196` `rounded-lg` 8px / selected `:200` `rounded-md` 6px | helper = 2px → **2px** | §2 R39 |
| …same, square `lg`/`xl` (3px border, `:142`, `:148`) | `:216`/`:220`, `:231`/`:235` `rounded-lg` → **8px** | helper = 3px → **1px** | §2 R39 |
| item `transition-duration` | `:24-26` `border-color 100ms var(--ease-out), box-shadow 100ms var(--ease-out)` → **100ms / `--ease-out`** | `transition-duration: var(--tc-motion-duration-fast, 150ms); transition-timing-function: var(--tc-motion-easing-standard, ease)` → **150ms / cubic-bezier(0.2, 0, 0, 1)** | §8 **R131** (colour fade on a control — hover fill, **border**, checkbox fill), longhands only per **R136** |

`--tzuchi-swatch-border-width` is a **local calc helper**, not a theme variable: it resolves only
to mode-independent px lengths (1/2/3px), the same device as `--tzuchi-button-block-size` in
`button.css:95-100`. `generate.mjs` is not involved, so the brief's "do not invent new
`--tzuchi-*` theme variables" is respected.

### Cascade, hand-derived (§0 N7)

| declaration | mine | strongest base rule it must beat | result |
|---|---|---|---|
| item radius | `[data-theme^="tzuchi"] .--square .__item` = **(0,3,0)** | `.--square.--xs .__item` = (0,3,0) (`:178`) | tie → source order: this file loads after `@heroui/styles` in the same `components` layer |
| item radius | same | `.--square .__item` = (0,2,0); `.--xs .__item` = (0,2,0) | wins on specificity |
| swatch radius, branch 1 | `… .--square .__item .__swatch` = **(0,4,0)** | `.--square.--xs .__item .__swatch` = (0,4,0) (`:180`) | tie → source order |
| swatch radius, branch 2 | `… .--square .__item[data-selected="true"] .__swatch` = **(0,5,0)** | `.--square.--xs .__item[data-selected="true"] .__swatch` = (0,5,0) (`:183-187`) | tie → source order |
| helper per size | `[data-theme^="tzuchi"] .--square.--xs .__item` = **(0,4,0)** | — (custom property, only set here) | — |
| motion longhands | `[data-theme^="tzuchi"] .__item` = **(0,2,0)** | `.color-swatch-picker__item` = (0,1,0) (`:14`) | wins; `transition-property` untouched, so `motion-reduce:transition-none` (`:27`) still wins in its media query |

### Left as HeroUI's (and why)

| what | why |
|---|---|
| **The selected indicator** (`:41-48`) — `border-color: var(--color-swatch-current)` + swatch `scale(0.77)` | This IS §5 **R83** ("selected = BORDER in the item's own colour, fill unchanged"), the rule that names colour-swatch explicitly. `--color-swatch-current` is a strictly better channel than R83's literal `currentColor`, which on this element would pick up the inherited *text* colour, not the swatch's. Nothing to change. |
| `box-shadow: var(--field-shadow)` on the selected item (`:43`) | `--field-shadow: 0 0 0 0 transparent` theme-wide (`themes/tzuchi/variables.css:22`) — flat by theme decision, §10 **D1**. Not a component call. See spec gap 4. |
| `variant="circle"` at all five sizes (`:15`, `:124`, `:130`, `:142`, `:148`) | Every radius reaches or exceeds half its box → already a true circle (§2 **R26**); the swatch's `border-radius: inherit` (`:59`) then tracks it. |
| Indicator checkmark: `size-1/3`, `text-white` / `text-black` by luminance (`:78-103`, `color-swatch-picker.tsx:132-153`) | Its contrast target is an arbitrary user colour that no theme variable can track; React chooses the side. The spec has no rule. See spec gap 7. |
| Swatch hover `scale(1.1)` and the 100ms `transform` transitions on swatch and indicator (`:64`, `:69`, `:91`) | §8 **R140** — no choreography. R132's 200ms is for a *value travelling*; applied to a hover scale it would drag. |
| Container `gap-2` + `flex-wrap` (`:7`) | Already §9 **R153** exactly (8px + wrap) — do not restate. |
| Layout variants grid / stack (`:110-116`), focus ring (`:30-33`), disabled (`:36-38`), the size scale, every colour | §5 **R85**/§10 **D2** (disabled), §4 **R70**/§10 **D3** (ring), §6 restraint (sizes/layout). |

---

## 3. ColorPicker — `color-picker.css`

A chromeless trigger (swatch + label, no fill, no padding, no border) opening a **content**
popover — spec §6(b), the Card/Modal surface, not the option-list panel.

| property | HeroUI base (file:line → resolved) | now (declaration → resolved) | spec rule |
|---|---|---|---|
| trigger `font-size` | `color-picker.css:15` `text-sm` → **14px** | `font-size: var(--tc-font-size-16, 16px)` → **16px** | §1 **R1** (control label — "the text a button/**trigger**/tab/row IS"); §1's mechanical no-14px rule |
| trigger `font-weight` | inherited 400 (`.label` supplies 500) | `font-weight: var(--tc-font-weight-bold, 700)` → **700** | §1 R1 / §1.2 (a control ⇒ subtitle voice) |
| trigger `line-height` | `:15` `text-sm` → **20px** | `line-height: var(--tc-line-height-normal, 1.5)` → **24px** | §1 R1 / §1.2 ("1.5 for controls") |
| trigger label `font-size` / `line-height` | `styles/components/label.css:4` `text-sm` → **14px / 20px** | `font-size: inherit; line-height: inherit` → **16px / 24px** | §1 **R4** form, as `dropdown.css:115-121` and `list-box-item.css:63-72` use it |
| trigger label `font-weight` | `label.css:4` `font-medium` → **500** | `font-weight: var(--tc-font-weight-bold, 700)` → **700** | §1 R1/R4 |
| popover `border-radius` | `color-picker.css:54` `min(32px, calc(var(--radius) * 2.5))` → **20px** | `border-radius: var(--tc-card-radius, var(--radius-2xl))` → **16px** | §6(b) **R98** / §2 **R30** — a content popover takes the surface radius |

Reaching `[data-slot="label"]` inside `.color-picker__trigger` is exactly how HeroUI's own base
file for this component reaches it (`color-picker.css:29-31`), so ownership rule 7 holds.

### Cascade, hand-derived

| declaration | mine | base rule it must beat | result |
|---|---|---|---|
| trigger type | `[data-theme^="tzuchi"] .color-picker__trigger` = **(0,2,0)** | `.color-picker__trigger` = (0,1,0) (`:14`) | wins; `text-sm` sets font-size *and* line-height, both replaced |
| trigger label | `[data-theme^="tzuchi"] .color-picker__trigger [data-slot="label"]` = **(0,3,0)** | `.label` = (0,1,0); `[data-disabled="true"] .label` / `[data-invalid="true"] .label` = (0,2,0) | wins; the state rules set colour/opacity only, so none of theirs is displaced |
| popover radius | `[data-theme^="tzuchi"] .color-picker__popover` = **(0,2,0)** | `.color-picker__popover` = (0,1,0) (`:51`) | wins. `.color-picker__popover` is the popover's **only** class — `color-picker.tsx:102` composes no `.popover` base — so nothing else competes |

### Left as HeroUI's (and why)

| what | why |
|---|---|
| Popover `bg-overlay` (`:52`) and `box-shadow: var(--overlay-shadow)` (`:53`) | Already §6(b) **R99** / **R100** verbatim. The `--accent-soft` tint is tc-dropdown's *listbox* signature; §6(b) rules it out for a content popover, so body copy is never stranded on a panel it was not contrast-checked against. |
| Popover padding `px-2 pt-2 pb-3` and `gap-3` (`:52`, `:56`) | §6(b) **R102** — leave HeroUI's padding where it has some. 8/8/12/12px all sit on the Tzu Chi 4px rhythm. |
| `min-w-62`, `origin-(--trigger-anchor-point)`, overflow/overscroll, the entering/exiting animations (`:52`, `:65-96`) | §8 **R140** (no choreography) and precedent: every shipped popover override (select, dropdown, tooltip) leaves the entering animation to HeroUI. Only `modal.css:125-129` retunes one, for reasons local to the Modal. |
| Trigger `rounded-sm` (`:15`) → 4px | Already §2 **R34** — the focus-shape radius for an element whose corner is only ever visible as the ring's shape (the trigger has no fill, border or padding). Nothing to restate (§0 **N5**). |
| Trigger `gap-3` = 12px between preview swatch and label (`:15`) | §9 **R147** prices an *icon* against a label at 8px; the `size="lg"` ColorSwatch here is a 36px preview, not an icon, and 12px is already `--tc-space-12`. See spec gap 5. |
| Trigger transition `background-color 150ms var(--ease-smooth), box-shadow 150ms var(--ease-out)` (`:24-26`) | Dead: the trigger never paints a background or a shadow under this theme. Retuning an invisible fade would be noise (§6 restraint); the duration is already 150ms. |
| Trigger focus ring (`:34-37`), disabled (`:40-44`), `cursor: var(--cursor-interactive)` | §4 **R70**/§10 **D3**; §5 **R85**/§10 **D2**; behaviour (§10 **D32**). |
| Everything *inside* the popover — ColorArea, ColorSlider, ColorField, Select, their labels and outputs | Other components' classes; they belong to their own override files (ownership rule 7). §6(b) **R101**'s body/title typing has no `.color-picker__*` element to land on. |
| Trigger label colour (`.label` → `text-foreground`) | Correct off a tinted panel; §6(a) **R94**'s colour lift applies only *inside* one. |

---

## Spec gaps

1. **No Tzu Chi counterpart at all** for ColorSwatch, ColorSwatchPicker or ColorPicker — no `tc-*`
   element, no `packages/tokens/src/component/*.tokens.json`, no `gap-audit/` report. Spec §12
   **Q8** already lists them. Every value in this unit is derived from a named role; none is
   traceable to a Figma decision.
2. **§2 has no role for a colour *sample*'s square corner.** 4px is derived from the two nearest
   roles (R25 checkbox control, R33 pagination cell) plus the fact that HeroUI's 6px/8px/12px are
   off the Tzu Chi ladder. A reviewer who thinks a colour chip should stay softer (8px,
   `--tc-radius-md`) would have an arguable case; the conservative choice was the one with two
   converging precedents.
3. **§2 gives no rule for whether a square cell's radius should scale with its box.** HeroUI steps
   it 6 → 8 → 12px across xs…xl. One radius for all sizes was chosen on R33's precedent
   (pagination holds 4px from a 32px cell to a 48px one). Not independently evidenced.
4. **`--field-shadow` is flat under this theme** (`themes/tzuchi/variables.css:22`,
   `0 0 0 0 transparent`), so the selected swatch loses the ring HeroUI's default theme draws
   around it (`color-swatch-picker.css:43`). What remains is the coloured border plus the
   `scale(0.77)` gap — still a two-signal indicator, and the flat `--field-shadow` is a settled
   theme decision (§10 D1) — but no spec rule covers "selection indicator that depended on
   `--field-shadow`". Worth the owner's eye.
5. **§9 R147 covers "icon ↔ label", not "preview ↔ label".** The ColorPicker trigger pairs a 36px
   colour preview with its label at 12px. Left alone; if the owner wants one gap for both cases,
   this is the file to change.
6. **§6(b) R101** types a content popover's body and title, but `.color-picker__popover` has
   neither — its content is ColorArea / ColorSlider / ColorField / Select, owned by other units.
   R101 lands on nothing here; whoever themes those components carries it.
7. **The indicator checkmark's `text-white` / `text-black` switch cannot be themed.** Its contrast
   target is an arbitrary user colour, chosen in JS by luminance
   (`color-swatch-picker.tsx:132-153`). Correct as engineered, but it means two literal colours
   survive inside a Tzu Chi surface, and the spec never addresses it.
8. **§8's applicability to a selection *cell*.** R131 cites accordion / checkbox / tag for a
   border-colour fade; the swatch item's fade was retuned on that basis. Rule 6's restraint list
   does not name motion explicitly, so this is the one change in the unit that a stricter reading
   of "change only what the spec gives a rule for" could drop. It is two longhands and cannot
   break either reduced-motion guard.

---

## Checklist (§13)

1. Every rule, every comma branch, is under `[data-theme^="tzuchi"]` — verified mechanically
   (script over the comment-stripped source).
2. Clean of `--tc-color-`, `#`, `rgb(`, `hsl(`, `oklch(`, `!important`, physical `left`/`right` —
   verified mechanically.
3. Tokens used, all with fallbacks and all present in `packages/tokens/dist/tokens.css`:
   `--tc-radius-sm` (4px, `:49`), `--tc-card-radius` (→ `--tc-radius-lg` = 16px, `:165`/`:51`),
   `--tc-font-size-16` (`:85`), `--tc-font-weight-bold` (`:84`), `--tc-line-height-normal`
   (`:93`), `--tc-motion-duration-fast` (`:62`), `--tc-motion-easing-standard` (`:64`). None
   resolves to a colour or a shadow.
4. Colours: **none written.** No theme variable is restated either — `--overlay`,
   `--overlay-shadow`, `--color-swatch-current`, `--field-shadow`, `--focus` are all left where
   HeroUI and the theme already put them. No new `--tzuchi-*` theme variable; the one
   `--tzuchi-swatch-border-width` is a local calc helper over px lengths.
5. Specificity derived by hand for all nine declarations — tables above.
6. `transition-property` / `animation-name` never set (R136), so both reduced-motion guards
   survive untouched.
7. Variants and states preserved: circle/square shape, xs–xl sizes, grid/stack layout,
   hover / focus-visible / disabled / selected, the checkmark indicator and its custom-indicator
   form, the trigger's focus and disabled states, the popover's entering/exiting states,
   `data-light-color`. Square cells are now crisp 4px; nothing is hidden or flattened.
8. Header comments in all three files record the variant mapping ("no tc counterpart"), what
   changed, what was kept and why, and the cascade notes.
9. Nothing in §10 touched (D1 theme variables, D2 disabled, D3 focus ring, D32 behaviour).
10. Comment safety (brief rule 8): no `*` immediately followed by `/` anywhere except the three
    comment terminators — verified by counting comment spans against declaration counts
    (1 / 7 / 7, matching the rules written).
