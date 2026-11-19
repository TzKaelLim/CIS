# select — Tzu Chi ↔ HeroUI gap inventory

**Override files**

| written to | destined for | mode |
|---|---|---|
| `…/scratchpad/atoms2/css/select.css` | `heroui/styles/themes/tzuchi/components/select.css` | new file |
| `…/scratchpad/atoms2/css/list-box-item.css` | `heroui/styles/themes/tzuchi/components/list-box-item.css` | new file |
| `…/scratchpad/atoms2/css/list-box.css` | `heroui/styles/themes/tzuchi/components/list-box.css` | new file |

All three need an `@import` adding to `heroui/styles/themes/tzuchi/components/index.css`
(upstream groups Select under *Pickers* and ListBox under *Collections*; the
`list-box*` imports must come **before** `select.css` is not required — see §5 on
specificity — but keeping upstream's grouping order is enough).

---

## 0. Why three files

`tc-dropdown` is a **form SELECT**: `role="combobox"` trigger + `role="listbox"`
popup, single value, `formAssociated`, emits `tc-change`
(`tc-dropdown.ts:37,239-241`). HeroUI's `Select` is its true counterpart.

Pass 1 (`components/dropdown.css`, report `gap-audit/dropdown.md`) transferred
the tc **listbox half** onto HeroUI's action `Dropdown` menu and deliberately left
the trigger alone. This pass does the other half and repeats the panel treatment
on `Select`'s popover, so a Select and a Dropdown read as the same component.

The **option row geometry** is not Select's alone: `.list-box-item` / `.list-box`
are shared by `Select`, `ComboBox`, `Autocomplete` and the standalone `ListBox`.
The tc `.option` shape (square full-bleed rows, `8px 32px`, 700 16px/1.5) is what
makes a picker's option list look Tzu Chi wherever it is rendered, so it lives in
`list-box-item.css` / `list-box.css` — **geometry and type only, zero colour**.
tc's option *colours* (brand-surface panel, brand-primary text, brand-surface-hover
fill) only make sense on tc's tinted panel, which in HeroUI is the Select popover,
so they stay in `select.css` scoped to `.select__popover`. A standalone ListBox
therefore keeps HeroUI's surface and its neutral `--default` hover, which the theme
already maps to a Tzu Chi grey (gray-100 light / gray-900 dark) — nothing to fix.

Side effect, deliberate and desirable: `ComboBox` and `Autocomplete` popovers pick
up the same 32px / 700-16px rows (their own `[data-slot="list-box-item"] { px-… }`
rules are 0,2,0 and lose to these files on source order). Their popover surfaces
stay HeroUI's `--overlay`; theming those two components is a separate pass.

## 1. Resolved-token cheat sheet

| tc token | light | dark | HeroUI theme var that already equals it |
|---|---|---|---|
| `--tc-dropdown-bg` → `color.surface.default` | `#ffffff` | gray-950 `#1c1c1e` | **`--field-background`** (tzuchi/variables.css:55,97) |
| `--tc-dropdown-border` → `color.border.default` | gray-300 `#bdbdbd` | gray-750 `#6b6b6e` | **`--field-border`** (…:58,100) |
| `--tc-dropdown-trigger-fg` → `color.text.muted` | gray-700 `#828282` | gray-400 `#b3b3b3` | **`--field-placeholder`** (= `--muted`) (…:57,99) |
| `--tc-dropdown-value-fg` / `-border-open` / `-option-fg` → `color.brand.primary` | blue-900 `#1b2d58` | blue-300 `#a9c2ea` | **`--accent`** (…:30,72) — identical to `--accent-soft-foreground`, which pass 1 used for the same primitive |
| `--tc-dropdown-bg-open` / `-option-bg-hover` / `-option-bg-selected` → `color.brand.surface-hover` | blue-200 `#d1deff` | blue-700 `#30559f` | **`--accent-soft-hover`** (…:34,76) |
| `--tc-dropdown-listbox-bg` → `color.brand.surface` | blue-100 `#e8eefe` | blue-900 `#1b2d58` | **`--accent-soft`** (…:33,75) |
| `--tc-dropdown-radius` → `radius.md` | 8px | same | (mode-independent, used directly; also `--field-radius`) |
| `--tc-dropdown-disabled-opacity` → `opacity.disabled` | 0.38 | same | **`--disabled-opacity`** (…:23) |
| `--tc-icon-size-sm` | 20px | same | (mode-independent, used directly) |

Every colour mapping is **exact in both modes**, so no `--tzuchi-*` escape variable
was needed. Verified against `packages/tokens/dist/tokens.css`: its dark block
(lines 409-431) flips only `--tc-color-*` and `--tc-elevation-*`, so every
dimension/type token used below is mode-independent.

Tailwind scale: `--spacing: 0.25rem` → `1` = 4px. `text-sm` = 14px/20px,
`text-base` = 16px/24px, `text-xs` = 12px/16px. `--radius` = 8px in both themes,
so `--radius-2xl` = 16px, `--radius-3xl` = 24px. `--radius-field` =
`--field-radius` = `--tc-radius-md` = **8px**; `--border-width-field` =
`--field-border-width` = **1px** (themes/shared/theme.css:55-56).

---

## 2. Gap table

### 2a. Trigger — tc `.trigger` ↔ `.select__trigger`

| property | Tzu Chi | HeroUI | action |
|---|---|---|---|
| radius | `tc-dropdown.styles.ts:23` `--tc-dropdown-radius` = **8px** | `select.css:18` `rounded-field` → `--radius-field` = **8px** | **kept — already matches** (the theme maps `--field-radius` to `--tc-radius-md`) |
| border width | `:22` `1px solid` | `select.css:33` `var(--border-width-field)` = **1px** | **kept — already matches** |
| border colour (rest) | `:22` `--tc-dropdown-border` = **#bdbdbd / #6b6b6e** | `:34` `var(--field-border)` = **same** | **kept — already matches** |
| background (rest) | `:21` `--tc-dropdown-bg` = **#fff / #1c1c1e** | `:18` `bg-field` → `--field-background` = **same** | **kept — already matches** |
| box-shadow | none | `:18` `shadow-field` → `--field-shadow` = `0 0 0 0 transparent` in this theme | **kept — already matches** |
| padding-block | `:24` `--tc-space-8` = **8px** | `:18` `py-2` = **8px** | **kept — already matches** |
| padding-inline-start | `:24` `--tc-space-32` = **32px** | `:18` `px-3` = **12px** | **changed** → `padding-inline: 32px` |
| padding-inline-end | `:24` 32px, plus the in-flow 20px chevron and the `:14` `gap: 8px` → text stops **60px** short of the end | `:37-39` `:has(.select__indicator) { pe-7 }` = **28px** | **changed** → `calc(32px + 20px + 8px)` = **60px**, on a 0,3,0 selector so it beats `pe-7` outright. A Select composed without `Select.Indicator` keeps the symmetric 32px |
| min-height | none | `:18` `min-h-9` = **36px** | **kept** — never binds once the row is 42px; it stays as the floor for a value-less trigger |
| height (computed) | 1+8+**24**+8+1 = **42px** | 1+8+**20**+6·0+8+1 = **38px** (`text-sm` line box) | consequence of the type change → **42px** |
| font-family | `:18` `--tc-typography-subtitle` → `'Noto Sans TC', system-ui, …` | `--font-sans` | **kept — already matches**: the theme sets `--font-sans: var(--tc-font-family-base)` (variables.css:25) |
| font-size | `:18` **16px** | `:18` `text-sm` = **14px**; `.select__value` (`:115`) `text-base sm:text-sm` → **16px below 640px, 14px above** | **changed** → 16px on both `.select__trigger` and `.select__value`, at every width (same decision as pass-1 `input.css`) |
| font-weight | `:18` **700** | none (inherits 400); `.select__value` sets none | **changed** → `--tc-font-weight-bold` on the trigger; the value inherits |
| line-height | `:18` **1.5** → 24px | `text-sm` → **20px** | **changed** → `--tc-line-height-normal` = 1.5 → 24px |
| text-align | `:19` `start` | `:115` `text-start` on the value | **kept — already matches** |
| text colour, no value | `:20` `--tc-dropdown-trigger-fg` = **#828282 / #b3b3b3** | `:18` `text-field-foreground` on the trigger, `:117-119` `text-field-placeholder` on the value = **#828282 / #b3b3b3** | **changed** → trigger `color: var(--field-placeholder)` so the *chevron* inherits it too (the value alone already matched) |
| text colour, has value | `:32-34` `.trigger.has-value` = brand-primary **#1b2d58 / #a9c2ea** | `--field-foreground` = **#333 / #f2f2f2** | **changed** → `.select__trigger:has(.select__value:not([data-placeholder="true"])) { color: var(--accent) }` |
| layout | `:11-17` `inline-flex`, `align-items:center`, `justify-content:space-between`, `gap:8px`, `width:100%` | `:18` `inline-flex`; value is `flex-1`, indicator is absolute; width from `fullWidth` / the story's `w-[256px]` | **kept** — different mechanism, same result; `fullWidth` is HeroUI's equivalent of tc's host-level width |
| cursor | `:25` `pointer` | `:31` `var(--cursor-interactive)` = pointer | **kept — already matches** |
| transition | `:26-28` bg + border 150ms `cubic-bezier(.2,0,0,1)` | `:24-27` bg + border 150ms `var(--ease-smooth)` (= `ease`) + box-shadow 150ms `ease-out` | **kept** — same properties and duration; re-declaring the shorthand to swap `ease` for tc's curve would drop HeroUI's box-shadow leg for an imperceptible 150ms difference |
| hover | none (tc's trigger does not react to hover) | `:42-48` `bg-field-hover` + `border-color: var(--field-border-hover)` (= blue-500 / blue-300) | **kept** — the themed Input takes exactly the same HeroUI behaviour (pass-1 `input.css` header), and the colours come from the theme |
| focus ring | `:36-40` `outline: 2px solid --tc-focus-ring-color` (#4f7bbe), `outline-offset: 2px` | `:52` `status-focused` → `focus-ring`: `ring-2 ring-focus`, `--tw-ring-offset-width: var(--ring-offset-width)` = 2px, offset colour `--background` | **kept — already matches**: the theme sets `--ring-offset-width: --tc-focus-ring-offset` = 2px and `--focus` = blue-500 / blue-300 |
| focus border / background | unchanged by tc | `:53-55` `border-color: var(--field-border-focus)`, `background-color: var(--field-focus)` | **kept** — same reasoning as hover; identical to the themed Input |
| open / expanded — text | `:48-49` brand-primary | — (HeroUI has no trigger open state) | **added** → `.select[data-open="true"] .select__trigger { color: var(--accent) }` |
| open — background | `:50` brand-surface-hover **#d1deff / #30559f** | — | **added** → `background-color: var(--accent-soft-hover)` |
| open — border | `:51` brand-primary | — | **added** → `border-color: var(--accent)` |
| open — placeholder text | tc colours the label brand-primary whether or not a value is set (`.label` has no colour of its own) | `.select__value[data-placeholder="true"]` stays `--field-placeholder` (0,2,0) | **added** → `color: inherit` at 0,5,0 |
| invalid | tc-dropdown has **no** invalid state | `:64-68` `status-invalid-field` = 1px `--danger` outline (2px danger ring when focused) + `bg: var(--field-focus)`; the border stays neutral | **changed** → border also `var(--danger)`, mirroring what pass-1 `input.css` did for the Input, plus the `[data-open]` compounds (0,5,0) and the `@media (hover: hover)` guard (0,5,0) so the danger edge survives both the open state and HeroUI's own 0,4,0 hover rule. HeroUI's outline is kept |
| disabled | `:42-45` `opacity: --tc-opacity-disabled` = **0.38**, `cursor: not-allowed`; tc deliberately disables the native button rather than using `pointer-events:none` | `:71-75` `status-disabled` → `opacity: var(--disabled-opacity)` = **0.38**, `cursor: var(--cursor-disabled)` = not-allowed, `pointer-events: none` | **kept — already matches** on both visible properties; `pointer-events:none` is HeroUI's state and rule 5 keeps it |

### 2b. Chevron — tc `.chevron` ↔ `.select__indicator`

| property | Tzu Chi | HeroUI | action |
|---|---|---|---|
| size | `:56-57` `--tc-icon-size-sm` = **20px** | `select.css:177-179` `[data-slot="select-default-indicator"] { size-4 }` = **16px** | **changed** → 20px, scoped to the *default* indicator so the `CustomIndicator` story keeps its own icon size |
| colour | `tc-dropdown.ts:225` `stroke="currentColor"` → follows the trigger (muted → brand-primary) | `select.css:171` `text-field-placeholder`, fixed | **changed** → `color: inherit` |
| position | in-flow flex item at the content edge → **33px** from the border-box end | `:171` `absolute inset-y-0 end-2` = **8px** from the padding box | **changed** → `inset-inline-end: 32px` (= 33px from the border box, exactly tc) |
| vertical centring | flex `align-items: center` | `:171` `inset-y-0 my-auto` | **kept — equivalent** |
| open rotation | `:62-64` `rotate(180deg)` | `:174-176` `[data-open="true"] { rotate-180 }` | **kept — already matches** |
| transition | `:58-59` `transform 150ms` | `:171` `transition duration-150` | **kept — already matches** |

### 2c. Popover — tc `.listbox` ↔ `.select__popover`

Identical treatment to pass-1 `dropdown.css`, so the two panels are the same object.

| property | Tzu Chi | HeroUI | action |
|---|---|---|---|
| radius | `:78` **8px** | `select.css:185` `min(32px, var(--radius-3xl))` = **24px** | **changed** → `var(--tc-dropdown-radius, var(--radius))` |
| background | `:77` `--tc-dropdown-listbox-bg` = **#e8eefe / #1b2d58** | `:184` `bg-overlay` = **#fff / #1c1c1e** | **changed** → `var(--accent-soft)` |
| text colour | `:89` brand-primary **#1b2d58 / #a9c2ea** | inherited `--foreground` | **changed** → `color: var(--accent-soft-foreground)` on the popover; rows inherit |
| arrow fill | — | `:230` `fill: var(--overlay)` | **changed** → `var(--accent-soft)`, consequence of the surface change |
| elevation | `:79` `--tc-elevation-2` = `0 2px 6px 0 #0000001a` / `#00000066` | `:186` `var(--overlay-shadow)` = `0 6px 16px 0 #0000001f` (tzuchi light); dark inherits HeroUI's `0 0 1px 0 rgba(255,255,255,.3) inset` | **kept** — rule 3: component shadow tokens are emitted as light-only literals; `--overlay-shadow` is the mode-aware equivalent |
| padding | `:75` `8px 0` | `:248` `[data-slot="list-box"] { p-1.5 }` = **6px all round** (`.list-box`'s own `p-1` = 4px is overridden by it) | **changed** → `padding-block: 8px; padding-inline: 0` — declared in **both** `list-box.css` and, at 0,3,0, inside `.select__popover`, because HeroUI's own popover rule (0,2,0) ties with the `list-box.css` override |
| row gap | none (`<li>` stacked) | `list-box.css:17-19` `> * + * { mt-1 }` = **4px** | **changed** (in `list-box.css`) → `margin-block-start: 0` |
| min-width | `:72` `min-width: 100%` of the trigger | `:184` `min-w-(--trigger-width)` | **kept — equivalent mechanism** |
| max-width / scroll | — | `:184` `scroll-py-1 scrollbar overflow-y-auto overscroll-contain` | **kept** — HeroUI capability, tc has none |
| offset from trigger | `:70` `calc(100% + 4px)` | RAC `offset` prop | **kept** — JS-side, not CSS |
| z-index | `:71` `--tc-z-dropdown` 1000 | RAC portal stacking | **kept** |
| entry / exit motion | none on the listbox (`:26-28` is the trigger's) | `:195-226` `animate-in duration-150 ease-smooth fade-in-0 zoom-in-95` / `animate-out duration-100` | **kept** — rule 5; HeroUI adds an entrance tc never specified |

### 2d. Option row — tc `.option` ↔ `[data-slot="list-box-item"]`

Geometry and type in **`list-box-item.css`** (shared); colours in `select.css`,
scoped to `.select__popover`.

| property | Tzu Chi | HeroUI | action |
|---|---|---|---|
| radius | `:82-93` none = **0** | `list-box-item.css:6` `rounded-2xl` = **16px** | **changed** → `border-radius: 0` (list-box-item.css) |
| padding-block | `:87` **8px** | `:6` `py-1.5` = **6px** | **changed** → 8px (list-box-item.css) |
| padding-inline | `:87` **32px** | `:6` `px-2` = 8px, raised to `px-2.5` = **10px** inside the Select popover (`select.css:252`) | **changed** → 32px in list-box-item.css, re-asserted at 0,3,0 inside `.select__popover` because `select.css:252` (0,2,0) would otherwise tie and win |
| `pe` when an indicator is present | — | `:30-32` `:has(.list-box-item__indicator) { pe-7 }` = **28px** | **overridden** by the 32px `padding-inline` (0,2,0, later source) — the absolutely positioned indicator occupies 8…24px from the end, so the 32px text inset still clears it |
| min-height | none (content-derived **40px**) | `:6` `min-h-9` = **36px** | **kept** — after the change the content box is 40px, so it never binds; it stays as the floor for label-less rows |
| height (computed) | **40px** | 20 + 6·2 = 32 → **36px** (min-h floor) | consequence → **40px** |
| gap (icon ↔ label) | — (tc rows have no icon slot) | `:6` `gap-3` = **12px** | **kept** — no tc equivalent; several stories need it |
| font-family | `:88` `'Noto Sans TC', …` | `--font-sans` | **kept — already matches** |
| font-size | `:88` **16px** | `select.css:184` `text-sm` on the popover → **14px**; `.label` re-asserts `text-sm` | **changed** → 16px on the item, `font-size: inherit` on `[data-slot="label"]` |
| font-weight | `:88` **700** | inherited 400 on a bare text row; `.label` (`label.css:4`) `font-medium` = **500** | **changed** → 700 on the item *and* on `[data-slot="label"]` (the Default story renders bare text nodes, `WithDescription`-style stories render a `.label`) |
| line-height | `:88` **1.5** → 24px | `text-sm` → **20px** | **changed** → 1.5 |
| description weight | — | `.description` (`description.css:3`) sets `text-xs text-muted` but **no weight**, so it would inherit the new 700 | **added** → `font-weight: 400` on `[data-slot="description"]`, i.e. restoring what HeroUI had |
| text colour | `:89` brand-primary | `--foreground` on the item; `.label` `text-foreground` | **changed, popover only** → the popover's `--accent-soft-foreground` is inherited; `[data-slot="label"]` gets `color: inherit`, `:not(.list-box-item--danger)` so the danger label keeps `text-danger` |
| hover fill | `:96-98` brand-surface-hover **#d1deff / #30559f** | `:54-59` `bg-default` = `--default` (gray-100 / gray-900 — the theme *does* map this now) | **changed, popover only** → `var(--accent-soft-hover)` inside the same `@media (hover: hover)` upstream uses. A standalone ListBox keeps `--default`, which is already a Tzu Chi grey |
| keyboard-cursor fill | `:97` `.option.active` = same fill | none (`:42-45` is an empty `:focus` block) | **added, popover only** → `[data-focused="true"]` |
| selected fill | `:102-104` same fill | none — selection shows only via the checkmark | **added, popover only** → `[data-selected="true"], [aria-selected="true"]` |
| focus ring | `:36-40` 2px @ 2px offset | `:37-40` `status-focused` | **kept — already matches** (theme-supplied width/offset/colour) |
| focus-ring **offset colour** | tc's 2px gap shows the tinted listbox | `--tw-ring-offset-color: var(--background)` — a grey halo on a tinted panel | **changed, popover only** → `var(--accent-soft)` on focus-visible only |
| disabled | `--tc-opacity-disabled` 0.38 | `:67-69` `status-disabled` → `var(--disabled-opacity)` = 0.38 | **kept — already matches** |
| pressed | none | `:48-51` `scale(0.98)` | **kept** — HeroUI state, rule 5 |
| cursor | `:91` pointer | `:19` `var(--cursor-interactive)` | **kept — already matches** |
| item transition | `:26-28` is the trigger's, not the option's | `:12-14` `transform 250ms`, `box-shadow 150ms` | **kept** |

### 2e. Things HeroUI has and tc does not (all left alone)

| element | HeroUI | why kept |
|---|---|---|
| `.select--secondary` | `select.css:83-112`, neutral `--default` fill via `--select-trigger-bg` | No tc equivalent — tc-dropdown has a single look, which maps to `primary`. The theme already maps `--default` to a Tzu Chi grey, so the fill is on-brand; the variant inherits every density/type/open/invalid rule. Rule 4: its own `--select-trigger-bg*` custom properties are left untouched. Note the open-state rule (0,4,0) does repaint it with the brand fill, which is the intended, consistent behaviour |
| `.select__clear-button` | `:128-168`, 20px box, `text-muted`, `scale(0.93)` when pressed | No tc equivalent. It is an in-flow flex item, so the 60px end padding parks it 8px inside the chevron — no overlap |
| `.list-box-item__indicator` | `list-box-item.css:76-103`, absolute `end-2`, 16px box, 10px checkmark, `text-default-foreground` | tc shows no selection indicator (it fills the row instead, which this pass adds). Kept as HeroUI ships it; `--default-foreground` (gray-900 / gray-100) is legible on the blue-100 / blue-900 panel |
| `.list-box-item--danger` | `:110-118`, label + indicator in `--danger` | No tc equivalent. Explicitly excluded from the `color: inherit` rule so it survives; it still picks up the 700/16px type |
| `.header` (section header) | `header.css:6` `px-2 pt-1.5 pb-1 text-xs font-medium text-muted` | No tc equivalent — but `padding-inline` is raised to **32px** in `list-box.css` so it stays flush with the option text. Same decision pass 1 made in `dropdown.css` |
| `.list-box-section`, `Separator`, `.description` | `list-box-section.css`, `separator.css`, `description.css` | No tc equivalents. `--separator` (gray-300 / gray-750) still reads on the tinted panel |
| multi-select chips, async loading, `Virtualizer` | `select.stories.tsx` | Behaviour / composition, no tc equivalent |
| `.select` root, `.select--full-width` | `select.css:2-15,265-271` `flex flex-col gap-1`, `w-full` | Field layout (label + trigger + description stack) that tc-dropdown does not render at all — tc has no label, no description, no error slot |

---

## 3. Not transferable

* **`.empty`** (`tc-dropdown.styles.ts:106-110`, an em-dash row in body type) —
  HeroUI uses `renderEmptyState` on `ListBox`, a prop, not a class.
* **Form semantics** — `formAssociated`, `setFormValue`, the `tc-change` event,
  `value` reflection (`tc-dropdown.ts:37,115-117,133-150`). Behaviour, not CSS.
* **`min-width: 100%`** (`:72`) — RAC sizes the popover from `--trigger-width`; a
  percentage min-width on a portalled element means something else entirely.
* **`--tc-z-dropdown: 1000`** (`:71`) and `top: calc(100% + 4px)` (`:70`) — RAC
  portals the popover and positions it with a JS `offset` prop.
* **tc's disabled semantics** — tc disables the native `<button>` and explicitly
  avoids `pointer-events: none`; HeroUI's `status-disabled` sets it. Kept
  HeroUI's (rule 5).
* **tc's easing curve** `cubic-bezier(0.2, 0, 0, 1)` on the trigger — same
  duration and properties as HeroUI's `ease`; not worth re-declaring the
  transition shorthand and dropping HeroUI's `box-shadow` leg.
* **`--tc-elevation-2`** on the panel — a light-only literal (rule 3);
  `--overlay-shadow` is the mode-aware stand-in.

## 4. Extra theme variables

**None.** Every colour the Tzu Chi dropdown specifies already has an exact,
per-mode HeroUI theme variable in `themes/tzuchi/variables.css` — see §1. No
`--tc-color-*`, no colour-valued `--tc-<component>-*`, no literals; `inherit`,
`currentColor` and `transparent` only.

## 5. Cascade notes (checked against the compiled Storybook CSS)

Three base rules needed more than the default `[data-theme^="tzuchi"] .class`
(0,2,0) to beat, because they are 0,2,0 or higher themselves:

| base rule | specificity | override selector | specificity |
|---|---|---|---|
| `.select__trigger:has(.select__indicator) { padding-inline-end: 28px }` | 0,2,0 | `[data-theme^="tzuchi"] .select__trigger:has(.select__indicator)` | 0,3,0 |
| `.select__popover [data-slot="list-box"] { padding: 6px }` | 0,2,0 | `[data-theme^="tzuchi"] .select__popover [data-slot="list-box"]` | 0,3,0 |
| `.select__popover [data-slot="list-box-item"] { padding-inline: 10px }` | 0,2,0 | `[data-theme^="tzuchi"] .select__popover [data-slot="list-box-item"]` | 0,3,0 |

and two state rules:

* `.select__trigger:hover:not(:has(.select__clear-button:hover))` is **0,4,0**
  (the `:not(:has(…))` contributes its most specific argument). The plain invalid
  override is also 0,4,0 and would only win on source order, so — exactly as
  pass-1 `input.css` had to — there is an explicit `@media (hover: hover)` block
  at 0,5,0 keeping the danger border through hover.
* `.select[data-open="true"] .select__trigger` (0,4,0) would otherwise repaint an
  invalid, open trigger's border with `--accent`, so the invalid rule also lists
  the `[data-invalid][data-open]` / `[aria-invalid][data-open]` compounds (0,5,0).

Attribute forms verified in `react-aria-components@1.21.1`:
`data-open` is set on the **`.select` root div**, not the trigger
(`dist/private/Select.mjs:212`); `data-placeholder` on `.select__value` (`:293`);
`data-focused` / `data-selected` / `data-hovered` on list-box items
(`dist/private/ListBox.mjs:239,385,387,388`). All use RAC's `value || undefined`
pattern, which React renders as the string `"true"` — the same form HeroUI's own
base CSS matches.

No rule in these three files duplicates or contradicts a pass-1 override:
`dropdown.css` only ever touches `.dropdown__popover` and `[data-slot="menu-item"]`,
`input.css` only `.input`. The one intentional repetition is the popover
`list-box` padding, which is stated in both `list-box.css` and `select.css` for
the specificity reason above.

## 6. Verifying in a browser

The popover only mounts while open, and no Select story starts open
(`ControlledOpenState` begins at `false`; there is no `defaultOpen`). A headless
run must click the trigger — on `components-pickers-select--default` the trigger
is the first `<button>` inside `#storybook-root`:

```js
document.querySelector('#storybook-root button').click();
// then wait for [data-slot="select-popover"] and let [data-entering] clear
```

The entering animation is `zoom-in-95`; `getComputedStyle` reports untransformed
layout values, so radius / padding / height readings are safe either way, but
read after `[data-entering]` clears if you also compare screenshots.

Expected computed values, identical under `data-theme="tzuchi"` **and**
`data-theme="tzuchi-dark"` (every changed dimension is mode-independent):

| selector | property | expected | reveal |
|---|---|---|---|
| `.select__trigger` | `height` | `42px` | none |
| `.select__trigger` | `padding-inline-start` | `32px` | none |
| `.select__trigger` | `padding-inline-end` | `60px` | none |
| `.select__value` | `font-size` | `16px` | none |
| `.select__value` | `line-height` | `24px` | none |
| `.select__trigger` | `font-weight` | `700` | none |
| `[data-slot="select-default-indicator"]` | `width` | `20px` | none |
| `.select__popover` | `border-top-left-radius` | `8px` | click |
| `.select__popover [data-slot="list-box"]` | `padding-block-start` | `8px` | click |
| `.select__popover [data-slot="list-box"]` | `padding-inline-start` | `0px` | click |
| `.select__popover [data-slot="list-box-item"]` | `padding-inline-start` | `32px` | click |
| `.select__popover [data-slot="list-box-item"]` | `border-top-left-radius` | `0px` | click |
| `.select__popover [data-slot="list-box-item"]` | `font-size` | `16px` | click |
| `.select__popover [data-slot="list-box-item"]` | `height` | `40px` | click |

## 7. Closeness verdict

**Major gaps.** The trigger differed on inline density (12 → 32px), on type
(14px/400 → 16px/700), on height (38 → 42px), on its chevron (16px, fixed muted,
8px from the edge → 20px, `currentColor`, 32px from the edge), on the
value colour, and it had no open/expanded state at all — which is the single most
recognisable thing about the Tzu Chi dropdown. The popover repeats pass 1's
listbox gaps in full (24 → 8px radius, `--overlay` → brand panel, 10 → 32px rows,
16px pills → square full-bleed rows, 14/500 → 16/700). What was already right —
radius, border width, both field colours, the shadowless field, the focus ring,
the disabled opacity, the font family — came straight from
`themes/tzuchi/variables.css` and is left untouched. No `!important`, no colour
literals, no `--tzuchi-*` additions.
