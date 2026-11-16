# dropdown — Tzu Chi ↔ HeroUI gap inventory

**Override file:** `dropdown.css` (a scratch copy at the time; the result lives in `heroui/styles/themes/tzuchi/components/dropdown.css`)
→ destined for `heroui/styles/themes/tzuchi/components/dropdown.css`

## 0. The name collision, resolved

`tc-dropdown` is a **form SELECT**: `role="combobox"` trigger + `role="listbox"`
popup, single value, `formAssociated`, emits `tc-change`
(`tc-dropdown.ts:37,239-241`). HeroUI `Dropdown` is an **action MENU**
(`MenuTrigger` + `Popover` + `Menu` + `MenuItem`, `dropdown.tsx:45,86,110`).

So only the **listbox half** transfers, and that is what the override styles.
The tc **trigger** — outlined 1px box, 8px radius, `8px 32px` padding, 700/16px
label, muted placeholder → brand-primary once a value exists, filled
`brand-surface-hover` + `brand-primary` border when expanded, 20px chevron that
rotates 180° — is the shape of **HeroUI `Select`**
(`heroui/styles/components/select.css`), not of `Dropdown`. It is deliberately
**not** applied here: in every stock Dropdown story the trigger is a plain
`<Button variant="secondary">` (`dropdown.stories.tsx:32,63,823`), and
`.dropdown__trigger` is only a bare `inline-block` wrapper used by the
`CustomTrigger` story (`dropdown.stories.tsx:851`). Styling it would have
restyled an avatar, not a combobox.

## 1. Resolved-token cheat sheet

| tc token | light | dark | HeroUI theme var that already equals it |
|---|---|---|---|
| `--tc-dropdown-listbox-bg` → `color.brand.surface` | `blue-100` `#e8eefe` | `blue-900` `#1b2d58` | **`--accent-soft`** (tzuchi/variables.css:36,64) |
| `--tc-dropdown-option-bg-hover` / `-selected` → `color.brand.surface-hover` | `blue-200` `#d1deff` | `blue-700` `#30559f` | **`--accent-soft-hover`** (…:37,65) |
| `--tc-dropdown-option-fg` → `color.brand.primary` | `blue-900` `#1b2d58` | `blue-300` `#a9c2ea` | **`--accent-soft-foreground`** (…:38,66) |
| `--tc-dropdown-radius` | 8px (`--tc-radius-md`, tokens.css:50,175) | same | — (mode-independent, used directly) |

The three colour mappings are **exact in both modes**, so no `--tzuchi-*` escape
variable was needed. Every colour in the override comes from a HeroUI theme
variable; no `--tc-color-*`, no literals.

Tailwind scale used below: `--spacing: 0.25rem` → `1` = 4px; `text-sm` = 14px/20px;
`--radius` = 8px in *both* the default theme (default/variables.css:33) and the
Tzu Chi theme (`--tc-radius-md`), so `--radius-2xl` = 16px and `--radius-3xl` = 24px
in both.

## 2. Gap table

### 2a. Popover / listbox shell — tc `.listbox`

| property | Tzu Chi | HeroUI | action |
|---|---|---|---|
| radius | `tc-dropdown.styles.ts:78` `var(--tc-dropdown-radius)` = **8px** (both modes) | `dropdown.css:53` `min(32px, var(--radius-3xl))` = **24px** | **changed** → `var(--tc-dropdown-radius, var(--radius))` |
| background | `:77` `--tc-dropdown-listbox-bg` = **#e8eefe / #1b2d58** | `:52` `bg-overlay` → `--overlay` = **#fff / gray-950 #1c1c1e** | **changed** → `var(--accent-soft)` |
| text colour | `:89` `--tc-dropdown-option-fg` = **#1b2d58 / #a9c2ea** | inherited `--foreground` = **gray-900 #333 / gray-100 #f2f2f2** | **changed** → `color: var(--accent-soft-foreground)` on the popover; items inherit |
| elevation | `:79` `--tc-elevation-2` = `0 2px 6px 0 #0000001a` | `:54` `var(--overlay-shadow)` = `0 6px 16px 0 #0000001f` (tzuchi light); dark inherits HeroUI's `0 0 1px 0 rgba(255,255,255,.3) inset` | **kept** — component shadow tokens are emitted as light literals only (rule 3); `--overlay-shadow` is the mode-aware equivalent and is within a hair of elevation-2 |
| border | none | none | kept |
| padding | `:75` `8px 0` | `:52` `p-0` on the popover, `:116` `[data-slot="dropdown-menu"] { p-1.5 }` = **6px all round** | **changed** → menu `padding-block: 8px; padding-inline: 0` (rows go edge-to-edge as in tc) |
| row gap | none (`li` stacked) | `dropdown.css:125` `.dropdown__menu { gap-0.5 }` = **2px** | **changed** → `gap: 0` |
| min-width | `:72` `min-width: 100%` (of the trigger) | `:52` `md:min-w-55` = **220px** | **kept** — different mechanism (RAC anchors width by `--trigger-width`, not by `%`); no tc equivalent to remove |
| max-width / scroll | — | `:52` `max-w-[48svw]`, `overflow-y-auto`, `scroll-py-1`, `overscroll-contain`, `scrollbar` | **kept** — HeroUI capability, tc has none |
| offset from trigger | `:70` `top: calc(100% + 4px)` | RAC `offset` prop (default 8px) | **kept** — JS-side, not CSS; out of scope for an override file |
| z-index | `:71` `--tc-z-dropdown` 1000 | portal + RAC overlay stacking | kept |
| entry/exit motion | `:26-28` 150ms `cubic-bezier(.2,0,0,1)` on bg/border only | `:64,86` `animate-in duration-150 ease-smooth` / `animate-out duration-100` + fade/zoom/slide | **kept** — same 150ms in, HeroUI adds a richer entrance tc never specified; rule 5 (don't remove states) |
| arrow fill | — | `:98` `fill: var(--overlay)` | **changed** → `var(--accent-soft)`, consequence of the surface change |

### 2b. Option row — tc `.option` ↔ `.menu-item` inside `.dropdown__popover`

| property | Tzu Chi | HeroUI | action |
|---|---|---|---|
| radius | `:82-93` none = **0** (full-bleed rows) | `menu-item.css:6` `rounded-2xl` = **16px** | **changed** → `border-radius: 0` |
| padding-inline | `:87` `var(--tc-space-32)` = **32px** | `menu-item.css:6` `px-2` = 8px, raised to `px-2.5` = **10px** inside the popover (`dropdown.css:120`) | **changed** → `padding-inline: 32px` |
| padding-block | `:87` `var(--tc-space-8)` = **8px** | `menu-item.css:6` `py-1.5` = **6px** | **changed** → `padding-block: 8px` |
| min-height | none (content-derived: 8+24+8 = **40px**) | `menu-item.css:6` `min-h-9` = **36px** | **kept** — after the type/padding change the content box is already 40px, so `min-h-9` never binds; leaving it preserves the floor for label-less rows |
| height (computed) | **40px** | 8+20+6·2 → **36px** (min-h floor) | consequence of the above |
| gap (icon↔label) | — (tc option has no icon slot) | `menu-item.css:6` `gap-3` = **12px** | **kept** — no tc equivalent; the `WithIcons`/`WithKeyboardShortcuts` stories need it |
| font-family | `:88` `--tc-typography-subtitle` → `'Noto Sans TC', system-ui, …` | `--font-sans` | **kept — already matches**: the theme sets `--font-sans: var(--tc-font-family-base)` (tzuchi/variables.css:26) |
| font-size | `:88` **16px** (`--tc-font-size-16`) | `dropdown.css:52` `text-sm` on the popover → **14px**; `.label` (`label.css:4`) re-asserts `text-sm` = **14px** | **changed** → 16px on the item, `font-size: inherit` on `[data-slot="label"]` |
| font-weight | `:88` **700** (`--tc-font-weight-bold`) | `.label` `font-medium` = **500** | **changed** → `var(--tc-font-weight-bold, 700)` on `[data-slot="label"]` |
| line-height | `:88` **1.5** → 24px | `text-sm` → **20px** | **changed** → `var(--tc-line-height-normal, 1.5)` = 24px |
| label colour | `:89` `--tc-dropdown-option-fg` = **#1b2d58 / #a9c2ea** | `.label` `text-foreground` = **#333 / #f2f2f2** | **changed** → `color: inherit` (from the popover's `--accent-soft-foreground`), scoped with `:not(.menu-item--danger)` so the danger label keeps `text-danger` |
| hover bg | `:96-98` `--tc-dropdown-option-bg-hover` = **#d1deff / #30559f** | `menu-item.css:64-69` `bg-default` = `--default`, **unmapped by the Tzu Chi theme** → HeroUI's neutral `oklch(94% …)` / `oklch(27.4% …)` | **changed** → `var(--accent-soft-hover)`, inside the same `@media (hover: hover)` guard upstream uses |
| keyboard-active bg | `:97` `.option.active` = same fill as hover | none (`menu-item.css:52-54` is an empty `:focus` block) | **added** → `[data-focused="true"]` gets `--accent-soft-hover`; RAC's virtual focus now reads like tc's `.active` |
| selected bg | `:102-104` `--tc-dropdown-option-bg-selected` = same fill as hover | none — selection is shown by the indicator only | **added** → `[data-selected="true"], [aria-checked="true"]` |
| focus ring width / offset / colour | `:36-40` 2px solid `--tc-focus-ring-color` (blue-500 #4f7bbe), offset 2px | `focus-ring` utility (`utilities/index.css:2-6`) `ring-2` + `--tw-ring-offset-width: var(--ring-offset-width)` | **kept — already matches**: the theme sets `--ring-offset-width: var(--tc-focus-ring-offset)` = 2px and `ring-focus` = `--focus` = blue-500 / blue-300 |
| focus ring **offset colour** | tc's 2px gap shows the listbox itself | `ring-offset-background` = `--background` (gray-50 / gray-980) — a grey halo once the panel is tinted | **changed** → `--tw-ring-offset-color: var(--accent-soft)` on focus-visible only |
| disabled | `:42-45` `opacity: var(--tc-opacity-disabled)` = **0.38**, `cursor: not-allowed` | `menu-item.css:93-95` `status-disabled` → `opacity: var(--disabled-opacity)`, `cursor: var(--cursor-disabled)`, `pointer-events: none` | **kept — already matches**: the theme sets `--disabled-opacity: var(--tc-opacity-disabled)` = 0.38 (tzuchi/variables.css:24) |
| pressed | none | `menu-item.css:57-61` `scale(0.98)` + `will-change` | **kept** — HeroUI state, rule 5 |
| item transition | `:26-28` 150ms on bg/border | `menu-item.css:12-14` `transform 250ms`, `box-shadow 150ms` (no background transition) | **kept** — tc's bg transition is on the *trigger*, not the option |
| cursor | `:91` `pointer` | `var(--cursor-interactive)` | kept |

### 2c. Things HeroUI has and tc does not (all left alone)

| element | HeroUI | why kept |
|---|---|---|
| `.menu-item--danger` | `menu-item.css:158-166` label + indicator in `--danger` | No tc equivalent. Explicitly excluded from the `color: inherit` rule so it survives. Bold 16px still applies (tc type, no colour change). |
| `.menu-item__indicator` (check / dot) | `menu-item.css:102-141`: `absolute start-2`, `size-4` (16px) box, checkmark `size-2.5` (10px), dot `size-2` (8px), `text-muted` | tc has no selection indicator. Kept as-is; the 32px text inset clears the 8+16 = 24px indicator box, so nothing overlaps. `text-muted` on the tinted panel is the `--muted` contrast issue already logged in MAINTAINING.md, not a new one. |
| `.menu-item__indicator--submenu` | chevron-right, `size-3` (12px) / `size-3.5` (14px) | tc's only icon is the trigger chevron (`--tc-icon-size-sm` = 20px), which is not this element. |
| `.header` (section header) | `header.css:6` `px-2 pt-1.5 pb-1 text-xs font-medium text-muted` | No tc equivalent — but **`padding-inline` was raised to 32px** so the header stays flush with the option text; everything else kept. |
| `.description`, `Kbd`, `Separator`, `.menu-section` | `description.css`, `separator.css`, `menu-section.css` | No tc equivalents. `--separator` (gray-300 / gray-750) still reads fine on the tinted panel. |
| submenus (`SubmenuTrigger`) | nested `.dropdown__popover` | Inherits every rule above automatically — nested popovers carry the same class. |
| `.dropdown` root (`gap-1`) | `dropdown.css:5-7` | **Never rendered**: `dropdownVariants.root` is defined (`dropdown.styles.ts:9`) but `DropdownRoot` returns a context-only `MenuTrigger` (`dropdown.tsx:43-47`), which emits no DOM. Nothing to override. |
| `.dropdown__trigger` | `dropdown.css:9-48` | Bare wrapper; the tc trigger belongs to `Select`. See §0. |

### 2d. Not transferable at all

* The **combobox trigger** (outlined box, `has-value` colour switch, filled open
  state, 20px chevron with a 180° rotation) — it is `Select`'s job.
* **`.empty`** (`tc-dropdown.styles.ts:106-110`, an em-dash row) — HeroUI uses
  `renderEmptyState` on `Menu`, a prop, not a class.
* **Single-select / form semantics** (`formAssociated`, `setFormValue`,
  `tc-change`, `value` reflection) — behaviour, not CSS.
* **`min-width: 100%`** — RAC sizes the popover from `--trigger-width`; a `%`
  min-width on a portalled element means something different.
* **`--tc-z-dropdown` 1000** — RAC portals and manages stacking itself.

## 3. Extra theme variables

**None.** `--accent-soft`, `--accent-soft-hover` and `--accent-soft-foreground`
are already declared opaque, per mode, in `themes/tzuchi/variables.css`
(lines 36-38 light, 64-66 dark) and resolve to exactly the primitives the tc
dropdown tokens point at. (In HeroUI's *default* theme those three are
semi-transparent `color-mix(… transparent)` values — irrelevant here because
every rule is scoped to `[data-theme^="tzuchi"]`.)

## 4. Verifying in a browser — read this before running the assertions

Every element this file touches lives in a **portalled popover that only mounts
while the menu is open**. No Dropdown story renders open: `ControlledOpenState`
(`dropdown.stories.tsx:815`) starts at `false`, and there is no `defaultOpen`
anywhere in the file. So a headless run must **click the trigger first**, e.g.
on `components-collections-dropdown--default`:

```js
document.querySelector('button[aria-label="Menu"]').click();
// then wait for [data-slot="dropdown-popover"] and the 150ms enter animation
```

Note the entering animation applies `zoom-in-90` — read computed styles only
after `[data-entering]` has cleared, or `height` / radius readings will be
transform-scaled.

Expected computed values once open, under `data-theme="tzuchi"` **and**
`data-theme="tzuchi-dark"` (every changed property is mode-independent):

| selector | property | expected |
|---|---|---|
| `.dropdown__popover` | `border-top-left-radius` | `8px` |
| `.dropdown__popover [data-slot="dropdown-menu"]` | `padding-block-start` | `8px` |
| `.dropdown__popover [data-slot="dropdown-menu"]` | `padding-inline-start` | `0px` |
| `.dropdown__popover [data-slot="menu-item"]` | `padding-inline-start` | `32px` |
| `.dropdown__popover [data-slot="menu-item"]` | `padding-block-start` | `8px` |
| `.dropdown__popover [data-slot="menu-item"]` | `border-top-left-radius` | `0px` |
| `.dropdown__popover [data-slot="menu-item"]` | `font-size` | `16px` |
| `.dropdown__popover [data-slot="menu-item"]` | `line-height` | `24px` |
| `.dropdown__popover [data-slot="menu-item"]` | `height` | `40px` |
| `.dropdown__popover [data-slot="menu-item"] [data-slot="label"]` | `font-weight` | `700` |

## 5. Closeness verdict

**Major gaps.** The listbox surface, its radius, its whole density scale
(32px vs 10px inline padding, full-bleed square rows vs 16px-rounded inset
pills) and its type (700/16px vs 500/14px) all differ, plus the hover fill
reaches for a neutral the Tzu Chi theme never maps. Eleven declarations'
worth of override, no `!important`, no colour literals.
