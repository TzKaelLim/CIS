# Unit "menus" — Menu family + list sections + TagGroup

Targets: `menu.css`, `menu-item.css`, `menu-section.css`, `list-box-section.css`, `header.css`,
`tag-group.css`.

**Files written** (destination `heroui/styles/themes/tzuchi/components/<name>.css`):
`menu.css`, `menu-item.css`, `header.css`, `tag-group.css`.
**No file**: `menu-section.css`, `list-box-section.css`.

Everything is read-only against both repositories; nothing in `CISwebsite` or
`CISwebsite-heroui-spike` was created, edited or deleted.

## 0. Resolved scale used throughout

`--spacing: 0.25rem` (`themes/default/variables.css:18`) → `1` = 4px, `1.5` = 6px, `2` = 8px,
`3` = 12px, `7` = 28px, `9` = 36px. `--radius: 8px` (`themes/tzuchi/variables.css:19`) →
`--radius-2xl` = 16px. Tailwind type steps are not overridden: `text-xs` = 12px/16px,
`text-sm` = 14px/20px, `font-medium` = 500.

Tokens referenced, all confirmed present and mode-independent in
`packages/tokens/dist/tokens.css` (`:root` only — none appear in the `[data-theme="dark"]` block):
`--tc-space-8` 8px (`:39`), `--tc-space-32` 32px (`:44`), `--tc-font-size-16` 16px (`:85`),
`--tc-line-height-normal` 1.5 (`:93`), `--tc-font-weight-bold` 700 (`:84`),
`--tc-font-weight-regular` 400 (`:82`). **No colour, no shadow, no `--tc-color-*`, no literal
colour, no `!important`, no physical `left`/`right` in any of the four files.**

---

## 1. `menu.css` — the standalone Menu column

`.menu` is rendered only by the exported `<Menu>` (`menu.styles.ts:6`). Dropdown renders
`.dropdown__menu` instead (`dropdown.styles.ts:7`), which pass-1 `dropdown.css:81-85` already
re-boxed; pass-2 `list-box.css:41-51` did the same for `.list-box`. `.menu` was the one column in
the family still un-themed.

| property | HeroUI base (file:line → resolved) | now (declaration → resolved) | spec rule |
|---|---|---|---|
| padding-block | `menu.css:6` `p-1` → **4px** | `padding-block: var(--tc-space-8, 8px)` → **8px** | §3.5 **R58** (list box: 8px block) |
| padding-inline | `menu.css:6` `p-1` → **4px** | `padding-inline: 0` → **0px** | §3.5 **R58** + §2 "rounding a container never rounds its rows" — rows run edge-to-edge |
| row gap | `menu.css:6` `gap-1` → **4px** | `gap: 0` → **0px** | §3.5 **R58** (tc stacks `<li>` rows with no gap); same value `dropdown.css:84` gives `[data-slot="dropdown-menu"]` |

Cascade: `[data-theme^="tzuchi"] .menu` = (0,2,0) vs base `.menu` (0,1,0) — wins outright.

### Left as HeroUI's (and why)

| kept | why |
|---|---|
| `relative`, `w-full`, `flex-col`, `overflow-clip` | Structural / the Virtualizer-style layout concerns §10 **D15**, **D32** |
| `[data-slot="separator"] { ms-[3%] w-[94%] }` | §10 **D24**/**D15** — separator spacing belongs to the consumer, tc ships no separator, and `.dropdown__menu` keeps the identical rule. Narrowing is HeroUI's own look |
| section-header inset | Not restated here on purpose: `header.css` sets it on `.header` itself, once, for every column |
| row geometry / type | Lives in `menu-item.css` |

---

## 2. `menu-item.css` — the global option row

Pass 1 scoped every menu-row rule to `.dropdown__popover` (`dropdown.css:97-160`). Pass 2
deliberately put the ListBox row geometry **global** (`list-box-item.css:50-79`, header
`:12-17`: *"putting the row GEOMETRY here is what makes an option look the same wherever it is
rendered"*). This file applies that same rule set to `.menu-item`, so a Menu row outside a
Dropdown is the same row as a ListBox row.

| property | HeroUI base (file:line → resolved) | now (declaration → resolved) | spec rule |
|---|---|---|---|
| border-radius | `menu-item.css:6` `rounded-2xl` = `--radius-2xl` → **16px** | `border-radius: 0` → **0px** | §2 **R57** / the "rounding a container never rounds its rows" note; matches `list-box-item.css:55` |
| padding-block | `menu-item.css:6` `py-1.5` → **6px** | `padding-block: var(--tc-space-8, 8px)` → **8px** | §3.5 **R57** |
| padding-inline | `menu-item.css:6` `px-2` → **8px** (10px inside a Dropdown via `dropdown.css:120` `px-2.5`) | `padding-inline: var(--tc-space-32, 32px)` → **32px** | §3.5 **R57**; §9 **R146** makes the header agree with it |
| font-size | no declaration on the row; `label.css:4` `text-sm` → **14px** | `font-size: var(--tc-font-size-16, 16px)` → **16px** | §1.1 **R4** (option row) |
| line-height | `text-sm` → **20px** | `line-height: var(--tc-line-height-normal, 1.5)` → **24px** | §1.1 **R4**; §1.2 "1.5 for controls" |
| font-weight (row) | inherited **400** | `font-weight: var(--tc-font-weight-bold, 700)` → **700** | §1.1 **R4**; matches `list-box-item.css:65` (this is the one thing `dropdown.css` set only on the label) |
| `[data-slot="label"]` size / line-height / weight | `label.css:4` `text-sm font-medium` → **14px / 20px / 500** | `font-size: inherit; line-height: inherit; font-weight: var(--tc-font-weight-bold, 700)` → **16px / 24px / 700** | §1.1 **R4** ("plus the same three on `[data-slot="label"]` because `label.css:4` re-asserts `text-sm font-medium`") |
| `[data-slot="description"]` weight | `description.css:2-4` sets none → would now inherit **700** | `font-weight: var(--tc-font-weight-regular, 400)` → **400** | §1.1 **R4** consequence; identical to `list-box-item.css:76-78` |
| padding-inline on a submenu row | `menu-item.css:39-41` `&[data-has-submenu="true"]:has(.menu-item__indicator) { ps-2 pe-7 }` → **8px / 28px** | `padding-inline: var(--tc-space-32, 32px)` → **32px / 32px** | §3.5 **R57** applied to the one compound that out-ranks the block rule |
| row height (consequence) | 20px line + 12px padding, floored by `min-h-9` → **36px** | 24px line + 16px padding → **40px** | §1.1 **R4** ("row content 24 + 16 padding = 40px") |

### Cascade, hand-derived

| this file's selector | spec. | must beat | spec. | result |
|---|---|---|---|---|
| `[data-theme^="tzuchi"] .menu-item` | (0,2,0) | `.menu-item` | (0,1,0) | wins outright |
| same | (0,2,0) | `.menu-item:has(.menu-item__indicator)` `ps-7` | (0,2,0) | tie → theme loads later in the same `components` layer |
| same | (0,2,0) | `.dropdown__popover [data-slot="menu-item"]` `px-2.5` | (0,2,0) | tie → later; and `dropdown.css:97` restates 32px at (0,3,0) anyway |
| same | (0,2,0) | `.menu-item[data-has-submenu="true"]:has(.menu-item__indicator)` | (0,3,0) | **loses** → second rule below |
| `[data-theme^="tzuchi"] .menu-item[data-has-submenu="true"]:has(.menu-item__indicator)` | (0,4,0) | the (0,3,0) base rule | (0,3,0) | wins outright |
| `[data-theme^="tzuchi"] .menu-item [data-slot="label"]` | (0,3,0) | `.label` | (0,1,0) | wins; `.menu-item--danger [data-slot="label"]` (0,2,0) only sets `color`, which this file never sets, so danger labels survive |
| `[data-theme^="tzuchi"] .menu-item [data-slot="description"]` | (0,3,0) | `.description` | (0,1,0) | wins |

The submenu compound is **not** a corner case: the submenu chevron itself carries the
`.menu-item__indicator` class (`menu-item.styles.ts:12`), so `:has(.menu-item__indicator)` matches
every submenu row. With 32px inline padding the absolutely positioned indicator (16px box at
`start-2`/`end-2`, i.e. 8→24px from the edge) still clears the text — the same clearance argument
`dropdown.css:98-103` and `list-box-item.css:51-54` make.

### Relationship to `dropdown.css` (no contradiction)

Every declaration here that also reaches a row inside `.dropdown__popover` carries the value
`dropdown.css` already gives it there: radius 0 (`:104`), 8px/32px padding (`:105-106`), 16px/1.5
type (`:111-112`), label weight 700 (`:117-121`). Two declarations are **additive inside a
Dropdown**, and both are the ones `list-box-item.css` makes and `dropdown.css` did not:
`font-weight: 700` on the row itself, and the 400 reset on `[data-slot="description"]` that the row
weight then makes necessary. Net effect in a Dropdown: a description row keeps 400 (unchanged), an
unlabelled text node in a row becomes 700 (it was 400) — which is the tc option type, and what a
ListBox row already does.

### Left as HeroUI's (and why)

| kept | why |
|---|---|
| hover fill `bg-default` under `@media (hover: hover)` | §5 **R88** ① — a neutral `--default` the theme already maps to a Tzu Chi grey. tc's brand tint is the *tinted panel's* signature and stays in `dropdown.css`/`select.css`, exactly as `list-box-item.css:19-25` reasons |
| all colour | Same reason. Nothing in this file is mode-dependent, so nothing can invert under `tzuchi-dark` |
| `min-h-9` (36px) | §10 **D16** — never binds at 40px, but keeps the floor for label-less rows |
| `gap-3` (12px icon↔label) | §10 **D16** — no tc equivalent; the WithIcons / WithKeyboardShortcuts stories need it |
| `.menu-item__indicator` (absolute, `size-4`, `start-2`/`end-2`, `text-muted`, checkmark `size-2.5`, dot `size-2`, scale/opacity states and their 250/300ms transitions) | §10 **D16**/**D12** — tc has no selection indicator |
| `.menu-item__indicator--submenu` chevron (`size-3`) | §10 **D12** — tc's only icon is the trigger chevron, a different element |
| pressed `scale(0.98)` + `will-change-transform` | §10 **D16** |
| focus ring (`status-focused`) and `--ring-offset-width` | §4 **R70**, §10 **D3** — already 2px/2px/`--focus` theme-wide |
| `status-disabled` | §5 **R85**, §10 **D2** — `--disabled-opacity` is already 0.38 |
| `transition: transform 250ms …, box-shadow 150ms …` and every `motion-reduce:transition-none` | §8 **R136**/**R140** — no `transition-property` or `animation-name` touched, so both reduced-motion guards keep winning; tc's option has no background transition (`gap-audit/dropdown.md` §2b) |
| `.menu-item--danger` label + indicator `--danger` | §10 **D12** — no tc equivalent; the bold-16 type still applies to it, only colour is left |
| `Kbd` inside a row | Out of this unit's ownership (§1.1 **R21** marks `kbd` NO EVIDENCE); `list-box-item.css` left it too |
| `cursor: var(--cursor-interactive)`, `no-highlight`, `outline-none`, flex layout | Structural |

---

## 3. `header.css` — the section header inset

`.header` is the React Aria `<Header>` inside a collection Section (`header.tsx:15`). It is
imported by exactly five story files — Dropdown, ListBox, Select, ComboBox, Autocomplete — and by
no component: it is only ever the label above a column of option rows.

| property | HeroUI base (file:line → resolved) | now (declaration → resolved) | spec rule |
|---|---|---|---|
| padding-inline | `header.css:6` `px-2` → **8px** | `padding-inline: var(--tc-space-32, 32px)` → **32px** | §1.1 **R8** + §9 **R146** ("section header in a list — flush with the option text") |

Cascade: `[data-theme^="tzuchi"] .header` = (0,2,0) beats base `.header` (0,1,0). It is out-ranked
by `dropdown.css:89-91` `.dropdown__popover .header` and `list-box.css:56-58` `.list-box .header`,
both (0,3,0) — and both set the same 32px, so the resolved value is 32px in every host. Those two
rules are **not contradicted**; this file generalises them to the one column neither reaches, the
standalone `<Menu>`.

### Left as HeroUI's (and why)

| kept | why |
|---|---|
| `text-xs` = **12px/16px** | §1.3, explicit: *"It is a structural label above 16/700 rows. Raising it would make it compete with the rows it introduces. Only its inset moves."* This is one of the four places the spec keeps a smaller size |
| `font-medium` (500), `text-muted` | §1.3 / R8 move the inset only. `--muted` is a theme variable and already mode-correct |
| `pt-1.5 pb-1` (6px / 4px) block padding | §9 **R146**: *"block padding stays HeroUI's"* |
| `w-full`, `text-start` | Structural |

---

## 4. `tag-group.css` — the inline pill row

| property | HeroUI base (file:line → resolved) | now (declaration → resolved) | spec rule |
|---|---|---|---|
| `.tag-group__list` gap | `tag-group.css:7` `gap-1.5` → **6px** (row and column) | `gap: var(--tc-space-8, 8px)` → **8px** | §9 **R153** (inline list gap — breadcrumbs, chips, tags) |

Cascade: `[data-theme^="tzuchi"] .tag-group__list` = (0,2,0) beats `.tag-group__list` (0,1,0).
No other theme file targets this class — `tag.css` styles `.tag`, `.tag svg` and
`.tag__remove-button` only, so nothing is duplicated or contradicted at the declaration level.

`tag.css:136-141`'s tolerance argument survives and improves: the 20px remove button keeps its 24px
`touch-target` `::after`, overhanging 2px per side — now inside an 8px gap rather than a 6px one.

### Left as HeroUI's (and why)

| kept | why |
|---|---|
| `.tag-group` `gap-1` = 4px (label→list, list→description/error) | §9 **R141** "already correct theme-wide, do not restate" and **R142** (4px) |
| `.tag-group [data-slot="description"] / [data-slot="error-message"]` `p-1` = 4px | Spec is silent on this padding; `gap-audit/tag-group.md` also notes it is shared with the Field components |
| description / error **type** (R6 / R7, 16px/1.6) | Ownership: `.description` and `.error-message` are their own components with their own base files. Applying R6/R7 from here would theme them for TagGroup only and pre-empt those files. Listed as a spec gap below |
| `flex-wrap`, `relative`, `flex`, `flex-col` | Structural; R153's `flex-wrap: wrap` is already satisfied |
| everything about the Tag pill | `tag.css` (pass 2) owns it — §10 **D29** |

---

## 5. Targets that need no file

| target | why |
|---|---|
| `menu-section.css` | Base is `menu-section.css:6` `flex flex-col items-start gap-0`. The spec's only rule for a section is **R146**, which is about the header's inset — now handled in `header.css`. The section's own gap is already 0, which is what §3.5 **R58** wants (rows stacked with no gap); `items-start` does not break full-bleed rows because `.menu-item` is `w-full`; and there is no radius, border, fill or type on it to correct. §10 **D12** also lists menu sections as "no tc equivalent". Restraint (rule 6): nothing to change |
| `list-box-section.css` | Identical base (`list-box-section.css:6`) and identical reasoning; `.list-box-item` is likewise `w-full`. `list-box.css` (pass 2) already handles the column's padding and the header inset for this host |

---

## 6. Spec gaps and flags

1. **R153 vs `gap-audit/tag-group.md`.** Pass 2's "TagGroup: why no file" table explicitly *kept*
   the 6px list gap, on the grounds that tc ships no chip-group component to port a decision from.
   The design-language spec now supplies the rule from the nearest role that does have evidence —
   the breadcrumb list (**R153**, `breadcrumbs.css:63-76`) — and 6px is the only gap in this family
   off the Tzu Chi 4px rhythm. **This pass overrides that one pass-2 note.** It contradicts no
   declaration in any shipped override file. If the owner prefers the pass-2 reading, delete
   `tag-group.css` — it is a single declaration.
2. **R6 / R7 (helper / error type, 16px/1.6) have no owner in this unit.** `.tag-group` reaches
   `[data-slot="description"]` and `[data-slot="error-message"]` in its base file, so reaching them
   is within ownership — but the rule is global to `.description` / `.error-message`, and applying
   it here would theme those two slots inside TagGroup only. Left to whichever unit owns
   `description.css` / `error-message.css` / `field-error.css`.
3. **`.menu` has no Storybook story.** `menuVariants` is exported but no component in the library
   renders it (Dropdown uses `.dropdown__menu`), so `menu.css` cannot be asserted in a headless
   browser from `storybook-static/index.json`. It is verified by reading only. If the owner wants
   coverage, a `Menu`-in-`Popover` story is the cheapest way to get it.
4. **`dropdown.css` sets the option weight on the label, `list-box-item.css` sets it on the row.**
   Not a contradiction (both end at 700 on the label) but a second small instance of §11's
   "inconsistencies between the existing override files" family. This file follows
   `list-box-item.css`, per the brief. Consequence, recorded: a bare text node inside a Dropdown row
   (not wrapped in `<Label>`) now renders 700 where it rendered 400.
5. **`.menu-item__indicator`'s `text-muted` on the tinted Dropdown panel** is the contrast issue
   pass 1 already logged (`gap-audit/dropdown.md` §2c). Unchanged here, and not a new problem.
6. **Nothing in §10 was touched.** No theme variable, no disabled treatment, no focus ring, no
   separator, no badge/chip/tag colour, no `--tc-elevation-*`, no shadow.
