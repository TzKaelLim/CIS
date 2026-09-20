# Tzu Chi × HeroUI — Design-Language Spec (base layer, pass 3)

> **Integrator's note (2026-09-20).** Two items below were already settled when this spec was written; the agents read an older record.
> - **Q4 / R130 (dark segmented-tabs pill)** — closed in pass 2: `generate.mjs` emits `--segment: var(--tc-color-gray-800)` in the dark theme only, restoring 1.54:1 against the gray-900 track (stock HeroUI 1.59:1). Ignore the "1.35:1 known regression" wording.
> - **Q3 / I4 (`--tzuchi-modal-shadow` absent in dark)** — intentional: `DARK_OMIT` in `generate.mjs` leaves it out so modal-like overlays keep HeroUI's inset hairline, the only visible edge on a near-black page. `modal.css`'s header comment, which claimed the opposite, has been corrected.

Reference document for the 16 agents theming the remaining **58** HeroUI base components.
Every rule below is derived from the **26 override files already shipped** in
`heroui/styles/themes/tzuchi/components/` and from the `tc-*` Lit sources that are the record
of the Figma decisions. **Nothing here is invented without being labelled so.**

**Read this whole file before writing a line of CSS.** You write overrides only; HeroUI's React,
markup, props, BEM class names and base CSS stay untouched.

## 0. Non-negotiables (from `components/index.css:8-17`)

| # | Rule |
|---|---|
| N1 | Every rule is scoped by `[data-theme^="tzuchi"]`. Every comma-separated branch, every nested `&`. |
| N2 | **Colours** come only from a HeroUI theme variable (`--accent`, `--border`, `--surface`, `--danger`, …) or a `--tzuchi-*` variable emitted by `generate.mjs`. **Never** `--tc-color-*` and never a colour-valued `--tc-<component>-*` token — `tokens.css` flips those under `[data-theme="dark"]`, which never matches `tzuchi-dark`, so they resolve to **light** values in dark mode. |
| N3 | Mode-independent tokens (`--tc-radius-*`, `--tc-space-*`, `--tc-size-*`, `--tc-typography-*`, `--tc-font-*`, `--tc-line-height-*`, `--tc-motion-*`, `--tc-focus-ring-*`, `--tc-opacity-*`, and dimension-valued `--tc-<component>-*`) are referenced directly, **always with a fallback**. |
| N4 | No `!important`, no hex/rgb/hsl/oklch literal (`transparent` and `currentColor` are allowed), no physical `left`/`right` — logical properties only. |
| N5 | Never restate what `themes/tzuchi/variables.css` already sets: `--radius` 8px, `--field-radius` 8px, `--field-border-width` 1px, `--field-shadow` none, `--disabled-opacity` 0.38, `--ring-offset-width` 2px, `--font-sans`, and every colour. Evidence: `input.css:9-14`, `select.css:43-47`. |
| N6 | Never introduce a shadow token. Only `--surface-shadow` and `--overlay-shadow` (see §6). |
| N7 | Work out the cascade by hand. Your selector must have **≥** the specificity of every base declaration it replaces; ties are resolved by source order only because the theme's `components/index.css` loads after `@heroui/styles` in the same `components` layer. |

### Token values you will use (from `packages/tokens/dist/tokens.css`)

```
--tc-space-4/8/12/16/20/24/32/40/48/64      4 8 12 16 20 24 32 40 48 64 px
--tc-radius-none/sm/md/lg/full              0 · 4px · 8px · 16px · 9999px
--tc-size-icon-sm/md/lg                     20px · 32px · 40px
--tc-size-control-md/lg                     48px · 64px
--tc-font-size-16/20/24/26/34/46            (no 14px, no 12px step)
--tc-font-weight-regular/medium/bold        400 · 500 · 700
--tc-line-height-tight/snug/normal/relaxed  1.3 · 1.4 · 1.5 · 1.6
--tc-typography-subtitle                    700 16px/1.5
--tc-typography-body                        400 16px/1.6
--tc-typography-title                       700 20px/1.5
--tc-typography-heading-3/-4                700 26px/1.4 · 700 24px/1.4
--tc-typography-tab-sm/-lg                  500 20px/1.5 · 500 34px/1.5
--tc-motion-duration-fast/base              150ms · 200ms
--tc-motion-easing-standard                 cubic-bezier(0.2, 0, 0, 1)
--tc-focus-ring-width / -offset             2px · 2px
--tc-opacity-disabled                       0.38
```

HeroUI's own scale under this theme (`themes/shared/theme.css:103-111`, `--radius: 8px`):
`--radius-xs` 2px · `--radius-sm` **4px** · `--radius-md` 6px · `--radius-lg` **8px** ·
`--radius-xl` 12px · `--radius-2xl` **16px** · `--radius-3xl` 24px · `--radius-4xl` 32px.
Tailwind type steps: `text-xs` 12px/16px · `text-sm` 14px/20px · `text-base` 16px/24px ·
`sm:text-sm` = step down to 14px/20px at ≥40rem.

---

## 1. Type scale

Tzu Chi has **no 14px and no 12px step**. The rule is therefore mechanical:

> **Every 14px (`text-sm`, `sm:text-sm`) and every 12px (`text-xs`) role moves to 16px**, and the
> weight/line-height is decided by *which of the two 16px roles* it is —
> **subtitle 700 16px/1.5** (a control's own label) or **body 400 16px/1.6** (prose).
> The four exceptions where a smaller size survives are listed in §1.3.

### 1.1 Roles → declarations

| # | ROLE | Declaration(s) | Resolves to | EVIDENCE | Replaces (HeroUI) |
|---|---|---|---|---|---|
| R1 | **Control label** — the text a button/trigger/tab/row *is* | `font-size: var(--tc-font-size-16, 16px); font-weight: var(--tc-font-weight-bold, 700); line-height: var(--tc-line-height-normal, 1.5);` | 16px / 700 / 24px | `button.css:83-85`; `select.css:120-122`; `list-box-item.css:63-65`; `dropdown.css:111-112` + `:120`; `accordion.css:53-55` (`font: var(--tc-typography-subtitle, …)`) · tc: `tc-button.styles.ts:18`, `tc-dropdown.styles.ts:18,88`, `tc-accordion-item.styles.ts:36` | `text-sm font-medium`, `text-sm sm:text-sm`, `text-base` + `font-medium` |
| R2 | **Field value** — text typed into a text field | `font-size: var(--tc-font-size-16, 16px); line-height: var(--tc-line-height-relaxed, 1.6);` (weight inherits 400) | 16px / 400 / 25.6px | `input.css:55-56`; `textarea.css:69-70`; `search-field.css:160-161` · tc: `tc-input.styles.ts:54` | `text-base sm:text-sm` |
| R3 | **Select/trigger value** — the value shown *inside a control label* | `font-size: var(--tc-font-size-16, 16px); line-height: var(--tc-line-height-normal, 1.5);` (weight inherits 700 from the trigger) | 16px / 700 / 24px | `select.css:171-174` · tc: `tc-dropdown.styles.ts:18` | `text-base sm:text-sm` on `.select__value` |
| R4 | **Option row** (menu item, list-box item) | `font-size: var(--tc-font-size-16, 16px); line-height: var(--tc-line-height-normal, 1.5); font-weight: var(--tc-font-weight-bold, 700);` **plus** the same three on `[data-slot="label"]` (`font-size/line-height: inherit`, weight 700) because `label.css:4` re-asserts `text-sm font-medium` | 16px / 700 / 24px → row content 24 + 16 padding = **40px** | `list-box-item.css:63-72`; `dropdown.css:111-121` · tc: `tc-dropdown.styles.ts:82-93` | `text-sm`, `.label`'s `text-sm font-medium` |
| R5 | **Body copy** — card description, accordion panel, modal body, alert description, checkbox/radio/switch label | `font: var(--tc-typography-body, 400 16px/1.6 sans-serif);` *or*, where a `font` shorthand would clobber the inherited family, the three longhands | 16px / 400 / 25.6px | `card.css:64-66`; `accordion.css:87-90`; `modal.css:86-89`; `alert.css:97-101`; `checkbox.css:129-134`; `radio.css:156-161`; `switch.css:118-123` | `text-sm text-muted`, `text-sm/1.43` |
| R6 | **Helper / description** (`.description`, `text-xs`) | `font-size: var(--tc-font-size-16, 16px); line-height: var(--tc-line-height-relaxed, 1.6);` — keep `--muted` | 16px / 400 / 25.6px | **No override precedent** — the 26 files only ever *re-indent* `[data-slot="description"]` (`checkbox.css:137-141`, `radio.css:164-167`, `switch.css:128-131`). tc evidence: `tc-input.styles.ts:84-89` `.helper { font: typography-body; font-size: 16px; color: text-muted }` | `text-xs` |
| R7 | **Error text** (`.field-error`, `.error-message`, `text-xs`) | same as R6; keep `text-danger` | 16px / 400 / 25.6px | **No override precedent.** tc: `tc-input.styles.ts:91-93` `.helper.error` — identical metrics, error colour only | `text-xs` |
| R8 | **Caption / overline / section header** (`.header`) | **KEEP 12px.** Only re-inset it: `padding-inline: var(--tc-space-32, 32px);` | 12px / 500 / 16px | `dropdown.css:87-91`; `list-box.css:53-58` — *"Section headers have no tc equivalent, but must stay flush with the 32px option text"* | `px-2` only |
| R9 | **Table header cell** | `font-size: var(--tc-font-size-16, 16px); font-weight: var(--tc-font-weight-bold, 700); line-height: var(--tc-line-height-normal, 1.5);` | 16px / 700 / 24px | **NO EVIDENCE — derive from R4** (option row: the nearest "row of structured data with a label") | `text-sm` |
| R10 | **Table body cell** | `font-size: var(--tc-font-size-16, 16px); line-height: var(--tc-line-height-relaxed, 1.6);` | 16px / 400 / 25.6px | **NO EVIDENCE — derive from R5** (body copy) | `text-sm` |
| R11 | **Heading inside an overlay** (modal / drawer / alert-dialog / popover title) | `font-weight: var(--tc-font-weight-bold, 700);` only — HeroUI's `text-base` is already 16/1.5 | 16px / 700 / 24px | `modal.css:81-83` · tc: `tc-modal.styles.ts:107` `font: var(--tc-typography-subtitle)` | `font-medium` |
| R12 | **Card title** (a *card*, not an overlay) | `font: var(--tc-typography-heading-3, 700 26px/1.4 var(--font-sans)); color: var(--accent);` | 26px / 700 / 36.4px, brand blue | `card.css:56-60` · tc: `tc-card.styles.ts:63`, `--tc-card-headline-fg = brand.primary` | `text-sm font-medium text-foreground` |
| R13 | **Tab label** | `font: var(--tc-typography-tab-sm, 500 20px/1.5 var(--font-sans));` + selected `font-weight: var(--tc-font-weight-bold, 700);` | 20px / 500 / 30px; selected 700 | `tabs.css:67-75`, `:77-79` · tc: `tc-tab.styles.ts` | `text-sm font-medium` |
| R14 | **Chip / Tag label** | `font-size: var(--tc-font-size-20, 20px); line-height: var(--tc-line-height-normal, 1.5);` (weight 500 already matches); `--sm` steps to `var(--tc-font-size-16, 16px)` | md 20px/500/30px · sm 16px | `chip.css:57-59`, `:67-70`; `tag.css:77-78`, `:81-84` · tc: `tc-chip` = `--tc-typography-tab-sm` | `text-xs`, `text-sm` |
| R15 | **Tooltip text** | `font-size: var(--tc-tooltip-font-size, var(--tc-font-size-16, 16px)); line-height: var(--tc-line-height-normal, 1.5);` | 16px / 400 / 24px | `tooltip.css:64-66` · tc: `tc-tooltip.styles.ts:19` | `text-xs` |
| R16 | **Pagination number / ellipsis / summary** | `font-size: var(--tc-font-size-16, 16px); font-weight: var(--tc-font-weight-regular, 400); line-height: var(--tc-line-height-relaxed, 1.6);` + current page `font-weight: 700` | 16px / 400 / 25.6px; current 700 | `pagination.css:96-98`, `:126`, `:139-141`, `:150-151` | `text-sm font-medium`, `text-xs` |
| R17 | **Breadcrumb crumb** | `font-size: var(--tc-breadcrumb-font-size, var(--tc-font-size-16, 16px)); line-height: var(--tc-line-height-relaxed, 1.6); font-weight: var(--tc-font-weight-regular, 400);` + current `font-weight: var(--tc-font-weight-medium, 500)` | 16px / 400 / 25.6px; current 500 | `breadcrumbs.css:78-81`, `:104-107` | `text-sm font-medium` |
| R18 | **Inline link inside body copy** | `font-weight: var(--tc-font-weight-bold, 700); text-underline-offset: 0.15em;` (size inherits) | 700, offset scales with size | `link.css:32-41` · tc: `tc-link` | `font-medium`, `underline-offset-4` |
| R19 | **Numeric readout / meter output** | `font-size: var(--tc-font-size-16, 16px); font-weight: var(--tc-font-weight-regular, 400); line-height: var(--tc-line-height-relaxed, 1.6); color: var(--muted);` and give its row-mate **the same metrics** so they share a baseline | 16px / 400 / 25.6px, muted | `progress-bar.css:126-138` (`[data-slot="label"]` + `__output`) · tc: `tc-progress.styles.ts` `.value` | `text-sm font-medium` |
| R20 | **Alert / callout title** | `font-size: var(--tc-font-size-16, 16px); font-weight: var(--tc-font-weight-bold, 700); line-height: var(--tc-line-height-relaxed, 1.6); color: var(--foreground);` | 16px / 700 / **25.6px** — the one bold-16 role at 1.6, see §11 I5 | `alert.css:90-95` · tc: `tc-alert.styles.ts:73-74` | `text-sm/24px font-medium` + per-status colours |
| R21 | **`kbd`, calendar day cells, colour-field hex, OTP digits, empty-state copy** | — | — | **NO EVIDENCE — derive**: a *label inside a control* → R1; *prose* → R5; a *dense numeric grid* (calendar) → R16's 16/400/1.6 | `text-sm` / `text-xs` |

### 1.2 The two 16px voices — how to pick

| If the text… | use | weight/line-height |
|---|---|---|
| **is** the control (button label, trigger label, option row, overlay heading, table header) | **subtitle** | 700 / 1.5 |
| is read **as prose** (description, body, helper, error, label of a checkbox, table cell, field value) | **body** | 400 / 1.6 |

Line-height is the tell: **1.5 for controls, 1.6 for prose.** A 24px line box stacks into a
42px control; a 25.6px line box stacks into a 43.6px field (see §3).

### 1.3 Where a smaller size is deliberately kept

| Element | Size kept | Why | EVIDENCE |
|---|---|---|---|
| `.header` (list/menu section header) | 12px | It is a structural label *above* 16/700 rows. Raising it would make it compete with the rows it introduces. Only its inset moves (to 32px). | `dropdown.css:87-91`; `list-box.css:53-58` |
| `.badge__label` | 12px (`--tc-badge-font-size`) | tc-badge's own token is 12px; the badge is a count dot anchored to another element, not a label. | `badge.css:18-21` |
| `.breadcrumbs__separator` | 12px chevron | tc's separator is a "›" glyph, which draws *less* ink at 16px than a 12px chevron does. | `breadcrumbs.css:110-113` |
| `.close-button svg` | 16px | tc's 20px glyph on a 32px box = 0.63; HeroUI's 16px on 24px = 0.67 — proportionally equivalent, and `.close-button` is shared by drawer/toast/popover/alert-dialog. | `gap-audit/modal.md:59` |
| `.toast__indicator .spinner` | 16px | Must stay level with its sibling toast icons; the theme's spinner rule is guarded so it cannot grow it. | `spinner.css:106-113` |

---

## 2. Radius by role

| # | ROLE | Declaration | Resolves to | EVIDENCE | Replaces |
|---|---|---|---|---|---|
| R22 | **Control — button, toggle-button, field shell, trigger** | `border-radius: var(--tc-button-radius, var(--radius));` — or nothing at all for a *field*, which already gets it from `--field-radius` | **8px** | `button.css:79-80`; `variables.css:19-20` | `rounded-3xl` (24px), `rounded-(--radius-field)` |
| R23 | **Pill — chip, tag, badge** | `border-radius: var(--tc-chip-radius, 9999px);` | **9999px** | `chip.css:53`; `tag.css:74`; Badge already pills at every size (`badge.css:18-19` — do not touch) | `rounded-2xl`/`rounded-xl` |
| R24 | **Icon-only button** | `border-radius: var(--tc-icon-button-radius, var(--tc-radius-full, 9999px));` | **9999px** | `button.css:305-311` · tc: `tc-icon-button.styles.ts:15` | `rounded-3xl` |
| R25 | **Checkbox control** | `border-radius: var(--tc-checkbox-radius, var(--tc-radius-sm, 4px));` **and** its `::before` fill at `calc(<same> - 2px)` | **4px** / inner **2px** | `checkbox.css:69`, `:79` | `rounded-md` (6px) |
| R26 | **Radio control, switch track, switch thumb, radio dot, remove button, tabs-secondary indicator, progress track+fill** | `border-radius: var(--tc-radius-full, 9999px);` | **9999px** | `radio.css:80`, `:92`; `switch.css:90`, `:100`; `tag.css:146`; `tabs.css:129`; `progress-bar.css:121` | `rounded-lg`/`rounded-xl`/`rounded-sm` |
| R27 | **Card / surface / resting panel** | `border-radius: var(--tc-card-radius, var(--radius-2xl));` | **16px** | `card.css:45-46` · tc: `tc-card.styles.ts:8` | `min(32px, --radius-3xl)` = 24px |
| R28 | **Modal-like overlay — Modal, AlertDialog, Drawer (non-docked edges)** | `border-radius: var(--tc-modal-radius, var(--tc-radius-lg, 16px));` on a `:not(…--full)` selector | **16px** | `modal.css:75-77` · tc: `tc-modal.styles.ts:21` | `min(32px, --radius-3xl)` |
| R29 | **Option-list popover — Select, Dropdown, ComboBox, Autocomplete** | `border-radius: var(--tc-dropdown-radius, var(--radius));` | **8px** | `dropdown.css:64-66`; `select.css:231-233` · tc: `tc-dropdown.styles.ts:78` | `min(32px, --radius-3xl)` |
| R30 | **Content popover — Popover, DatePicker/ColorPicker shells** | `border-radius: var(--tc-card-radius, var(--radius-2xl));` | **16px** — **DECIDED**, see §6(b) | derived: `card.css:46` + `modal.css:76` both land on `--tc-radius-lg` | `min(32px, --radius-3xl)` |
| R31 | **Tooltip** | `border-radius: var(--tc-tooltip-radius, var(--tc-radius-sm, 4px));` | **4px** | `tooltip.css:59` · tc: `tc-tooltip.styles.ts:23` | `min(32px, --radius-xl)` = 12px |
| R32 | **Track — progress, meter, slider, progress-circle** | `border-radius: var(--tc-progress-radius, var(--tc-radius-full, 9999px));` on **track AND fill**, set on the **root** scope so it beats the per-size `rounded-xs`/`rounded-md` rules | **9999px** | `progress-bar.css:116-122` · tc: `tc-progress.styles.ts:14` | `rounded-sm`/`rounded-xs`/`rounded-md`/`rounded-xl` |
| R33 | **Square-ish cell — pagination item** | `border-radius: var(--tc-pagination-radius, var(--radius-sm));` | **4px** | `pagination.css:92-93` | `rounded-3xl` |
| R34 | **Focus-shape on an inline element (link)** | `border-radius: var(--tc-radius-sm, 4px);` — only ever visible as the ring's shape | **4px** | `link.css:40` | `rounded-xl` |
| R35 | **Flat callout — alert, banner** | `border-radius: var(--tc-alert-radius, 0.5rem);` | **8px** | `alert.css:63` | `min(32px, --radius-3xl)` |
| R36 | **Bordered container — accordion surface variant** | `border-radius: var(--tc-accordion-radius, var(--radius));` and re-point the first/last-child corner rules at the same value | **8px** | `accordion.css:100-102`, `:126-135` | `rounded-3xl` |
| R37 | **Table / container shell** | `border-radius: var(--tc-card-radius, var(--radius-2xl));` | **16px** | **NO EVIDENCE — derive from R27** (a Table is a surface holding content, like a Card) | `min(32px, calc(--radius * 2.5))` = 20px |
| R38 | **Inner item concentric with a padded container** | `border-radius: calc(<inner role radius> + <container inset>);` on the **container** | e.g. `calc(var(--tc-radius-md, 8px) + var(--tc-space-4, 4px))` = **12px** | `tabs.css:103-106` (segmented list-container over 8px tabs with a 4px inset) | `rounded-2xl` |
| R39 | **Inner fill inside a bordered control** | `border-radius: calc(<control radius> - <border-width>);` | `calc(4px - 2px)` = **2px** | `checkbox.css:78-79` | — |

**Rounding a container never rounds its rows.** An option-list popover's rows go
`border-radius: 0` and run edge-to-edge; the panel's own 8px corners are cleared by the list's
8px block padding, not by rounding the rows (`dropdown.css:79-81`, `list-box-item.css:50-57`).

---

## 3. Control metrics

### 3.1 The two height formulas

| # | Family | Formula | Resolves to |
|---|---|---|---|
| R40 | **Control** (button, select trigger, tab) — subtitle type, 1.5 | `calc(var(--tc-font-size-16, 16px) * var(--tc-line-height-normal, 1.5) + var(--tc-space-8, 8px) * 2 + 2px)` | **42px** (24 + 16 + 2) |
| R41 | **Field** (input, textarea, search-field, and every field-family shell) — body type, 1.6 | `calc(var(--tc-font-size-16, 16px) * var(--tc-line-height-relaxed, 1.6) + 2 * var(--tc-space-8, 8px) + 2 * var(--field-border-width, 1px))` | **43.6px** (25.6 + 16 + 2) |

Apply R41 as `block-size: auto; min-block-size: <calc>` so the shell stays content-driven but
cannot collapse (`search-field.css:95-105`). Apply R40 as a local custom property
(`--tzuchi-button-block-size`) then `height: var(…)`, so size modifiers retune it in one place
(`button.css:95-100`). **These are local calc helpers, not theme variables — they never need
`generate.mjs`.**

### 3.2 Buttons

| # | Size | `padding-inline` | `padding-block` in the formula | Height | EVIDENCE |
|---|---|---|---|---|---|
| R42 | `sm` | `var(--tc-space-16, 16px)` | `var(--tc-space-4, 4px)` | **34px** | `button.css:103-109` |
| R43 | `md` (default) | `var(--tc-space-24, 24px)` | `var(--tc-space-8, 8px)` | **42px** | `button.css:87-100` · tc: `tc-button.styles.ts:20` |
| R44 | `lg` | `var(--tc-space-32, 32px)` | `var(--tc-space-12, 12px)` | **50px** | `button.css:112-118` |

Type does **not** change with size — 16/700/1.5 at every step (`button.css:83-85`).
Height is one value at every viewport: HeroUI's `md:h-9` breakpoint step-down is overridden away
(`button.css:92-94`).

### 3.3 Icon-only

| # | Size | Box | Icon | EVIDENCE |
|---|---|---|---|---|
| R45 | `sm` | `calc(var(--tc-size-icon-sm, 20px) + var(--tc-space-8, 8px) * 2)` = **36px** | `var(--tc-size-icon-sm, 20px)` = 20px | `button.css:313-322` (no tc counterpart; keeps md's 8px ring) |
| R46 | `md` | `var(--tc-size-control-md, 48px)` | `var(--tc-size-icon-md, 32px)` | `button.css:300-311` · tc: `tc-icon-button.styles.ts:11-12,23-25` |
| R47 | `lg` | `var(--tc-size-control-lg, 64px)` | `var(--tc-size-icon-lg, 40px)` | `button.css:323-327` · tc: `tc-icon-button.styles.ts:37-44` |
| R48 | **inside a joined group** | re-point at `var(--tzuchi-button-block-size)` → 34/42/50px; icon back to `var(--tc-size-icon-sm, 20px)` | | `button.css:329-339` — a 48px cell next to a 42px one tears the group apart |

The icon rule must mirror HeroUI's own exclusion list so Spinner/link icons keep their sizes:
`svg:not([data-slot="spinner"] svg, [data-slot="link-icon"] svg)` (`button.css:367-372`).
Keep the `:not(.button--full-width)` guard on the width rule (`button.css:355-357`).

### 3.4 Fields

| # | Property | Value | EVIDENCE |
|---|---|---|---|
| R49 | shell height | R41 → **43.6px** | `search-field.css:95-105`; `input.css` (content-driven, same result) |
| R50 | `padding-inline` | `var(--tc-space-20, 20px)` | `input.css:48-51`; `textarea.css:56-57`; `search-field.css:147-154` · tc: `tc-input.styles.ts:31` |
| R51 | `padding-block` | **8px — already matches** HeroUI's `py-2`. Do not restate. | `input.css:49-50` |
| R52 | border | **1px `--field-border`, already set theme-wide.** Do not restate. | `variables.css:21`, `input.css:9-14` |
| R53 | affix inset | icon/button sits `margin-inline-start|end: var(--tc-space-20, 20px)` from the shell edge; HeroUI's own `ps-2`/`pe-2` (8px) rules keep the gap to the text | `search-field.css:176-201` · tc: `.control` pads 20px, gaps 8px |
| R54 | leading icon | `var(--tc-size-icon-sm, 20px)` square, `color: var(--accent)` | `search-field.css:176-186` |
| R55 | textarea min-height | `calc(var(--tc-textarea-min-height, 96px) + 2 * var(--tc-space-8, 8px) + 2 * var(--field-border-width, 1px))` = **114px** | `textarea.css:59-64` · tc: `tc-textarea.styles.ts:49` |
| R56 | **Select trigger** (diverges) | `padding-inline: var(--tc-space-32, 32px)`; with an indicator, `padding-inline-end: calc(var(--tc-space-32, 32px) + var(--tc-icon-size-sm, 20px) + var(--tc-space-8, 8px))` = **60px**; height **42px** (R40, because the trigger is typed subtitle) | `select.css:108-139` · tc: `tc-dropdown.styles.ts:24` — **see §11 I2/I3** |

**New field-family components (InputGroup, NumberField, DateField/DateInputGroup, ComboBox input,
ColorField/ColorInputGroup, TimeField, InputOTP) follow R49–R54 — the Input shape, not the Select
shape.** README.md:135 lists this as the open item pass 2 left.

### 3.5 Option rows and cells

| # | ROLE | Declaration | Resolves to | EVIDENCE |
|---|---|---|---|---|
| R57 | option row | `border-radius: 0; padding-block: var(--tc-space-8, 8px); padding-inline: var(--tc-space-32, 32px);` | content 24 + 16 = **40px**; HeroUI's `min-h-9` (36px) stays as a floor for label-less rows | `list-box-item.css:50-57`; `dropdown.css:97-106` |
| R58 | list box | `padding-block: var(--tc-space-8, 8px); padding-inline: 0;` and `& > * + * { margin-block-start: 0 }` | rows edge-to-edge, 8px clear of the corner | `list-box.css:41-51`; `dropdown.css:81-85` |
| R59 | pagination cell | `--pagination-item-size`: `var(--tc-size-icon-md, 32px)` / `var(--tc-size-icon-lg, 40px)` / `var(--tc-size-control-md, 48px)` for sm/md/lg; number cells `inline-size: auto; min-inline-size: var(--pagination-item-size); padding-inline: var(--tc-space-4, 4px)` so long numbers grow; nav buttons keep HeroUI's `w-auto` | **32 / 40 / 48px** | `pagination.css:83-86`, `:110-116`, `:160-168` |
| R60 | tab | `block-size: auto; padding-block: var(--tc-space-12, 12px);` (inline 16px already matches) | 30 + 24 = **54px** | `tabs.css:67-75` |
| R61 | chip / tag | md: `padding-block: var(--tc-space-4, 4px); padding-inline: var(--tc-space-12, 12px)` → **40px**; sm: `padding-inline: var(--tc-space-8, 8px)` + 16px type → **34px**; lg: `padding-block: var(--tc-space-8, 8px); padding-inline: var(--tc-space-16, 16px)` → **48px**. Add `border: 1px solid transparent` — it is part of the box model and the hook `selected` flips. | 34 / 40 / 48px | `chip.css:51-75`; `tag.css:72-89` |

### 3.6 Selection controls

| # | Control | Declarations | EVIDENCE |
|---|---|---|---|
| R62 | checkbox | `inline-size / block-size: var(--tc-checkbox-size, var(--tc-size-icon-md, 32px)); border-width: 2px;` indicator `75%`, default check/dash SVGs `100%` | `checkbox.css:65-69`, `:116-125` |
| R63 | radio | `inline-size / block-size: var(--tc-radio-size, 32px); border-width: 2px;` dot = `scale: 0.5` of the 28px inner box (14px), pressed `scale: 0.6429` (18px) | `radio.css:77-82`, `:115-123`, `:140-151` |
| R64 | switch | md `--switch-control-width: var(--tc-switch-width, 44px)`, `--switch-control-height: var(--tc-switch-height, 24px)`, `--switch-thumb-size: var(--tc-switch-thumb-size, 18px)`, `--switch-thumb-inset: 3px`; **sm 36×20/14, lg 52×28/22** (literals); travel = `calc(100% - var(--switch-thumb-size) - var(--switch-thumb-inset))` | `switch.css:61-85`, `:112-116` |

**Touch targets.** Never delete a `touch-target` `::after` HeroUI ships — shrink the visual box and
let the pseudo-element keep the hit area (`tag.css:139-141`: a 20px remove button keeps its 24px
`::after`, overhanging 2px, inside the list's 6px gap). The 32px checkbox/radio and the 44×24
switch are below 44px on their own; that is how tc ships them, and the label + 8px gap is part of
the same click target (`tc-checkbox.styles.ts:7`).

---

## 4. Borders & focus

| # | ROLE | Declaration | EVIDENCE |
|---|---|---|---|
| R65 | field border, rest | **nothing** — `--field-border` + `--field-border-width: 1px` are theme-wide | `variables.css:21,59`; `input.css:9-14` |
| R66 | field border, hover | **nothing** — `--field-border-hover` is theme-wide | `variables.css:60` |
| R67 | field border, focus | `&:focus-within, &[data-focus-within="true"] { border-color: var(--field-border-focus); }` — needed only where the base file forgot it (SearchField did) | `search-field.css:107-116` |
| R68 | field border, invalid | `&[data-invalid="true"] { border-color: var(--danger); }` — **keep** HeroUI's 1px danger outline on top (it survives forced-colors and is what thickens into the ring) | `input.css:59-66`; `textarea.css:85-89`; `select.css:202-212`; `search-field.css:118-129` |
| R69 | **the hover-vs-invalid trap** | see below | `input.css:68-81`; `select.css:214-226`; `textarea.css:91-101`; `search-field.css:130-143` |
| R70 | focus ring | **nothing** — width 2px, offset 2px (`--ring-offset-width` ← `--tc-focus-ring-offset`), colour `--focus` are theme-wide | `variables.css:24`; `breadcrumbs.css:114-116` |
| R71 | ring **offset colour** on a tinted panel | `--tw-ring-offset-color: var(--accent-soft);` on the focusable row | `dropdown.css:153-160`; `select.css:295-302` |
| R72 | **flush ring** where the 2px gap would spill past a container border | `--ring-offset-width: 0px;` | `accordion.css:58-61`; `radio.css:85-86` |
| R73 | **inset ring** where overflow-clipping would cut the ring off | `outline: var(--tc-focus-ring-width, 2px) solid var(--focus); outline-offset: calc(-1 * var(--tc-focus-ring-offset, 2px)); box-shadow: none;` | `tabs.css:92-100` |
| R74 | **do not** re-declare `box-shadow` to restyle a *field's* ring | it fights Tailwind's `--tw-ring-shadow` composition and the `shadow-field` stack | `search-field.css:63-70` (the one exception, Textarea, is §11 I1) |

### R69 — the hover-vs-invalid specificity trap (read this before touching any field)

HeroUI's base hover rule is **(0,4,0)**:

```css
.input:hover:not(:focus):not(:focus-visible)                      /* and */
.input[data-hovered="true"]:not([data-focused="true"]):not([data-focus-visible="true"])
```

A plain `[data-theme^="tzuchi"] .input[data-invalid="true"]` is only **(0,3,0)**, so hovering an
invalid, unfocused field silently repainted the border `--field-border-hover`. The fix — used
identically in four files — is to **mirror both forms of the base selector with
`[data-invalid="true"]` appended**, inside `@media (hover: hover)`:

```css
@media (hover: hover) {
  [data-theme^="tzuchi"] .input:hover:not(:focus):not(:focus-visible)[data-invalid="true"],
  [data-theme^="tzuchi"] .input[data-hovered="true"]:not([data-focused="true"]):not([data-focus-visible="true"])[data-invalid="true"] {
    border-color: var(--danger);
  }
}
```

`select.css:214-226` is the same pattern against `.select__trigger:hover:not(:has(.select__clear-button:hover))`
(0,4,0 → 0,5,0), plus `[data-invalid][data-open]` compounds so the invalid edge also outranks the
open-state border (`select.css:207-210`). `search-field.css:130-143` nests it under
`&[data-invalid="true"]` to reach (0,4,0)/(0,5,0). **Declare the invalid rule *after* the focus
rule** so a focused invalid field keeps the danger edge (`search-field.css:123-127`).

---

## 5. State colour grammar

| # | STATE / INTENT | Declarations | EVIDENCE | Where it applies |
|---|---|---|---|---|
| R75 | **primary action** | nothing — `--accent` / `--accent-hover` / `--accent-foreground` already are `brand.primary` / `-hover` / `text.on-brand` | `button.css:26-31` | `.button--primary`, filled icon-button |
| R76 | **tonal** | `--button-bg: var(--accent-soft); --button-bg-hover: var(--accent-soft-hover); --button-bg-pressed: var(--accent-soft-hover);` | `button.css:139-149` · tc `button.tokens.json:16-20` | `.button--secondary`, tonal icon-button, any "secondary action" |
| R77 | **outlined** | `border-color: var(--accent); --button-fg: var(--accent); --button-bg-hover: var(--accent-soft); --button-bg-pressed: var(--accent-soft-hover);` | `button.css:150-160` · tc `button.tokens.json:11-15` | `.button--outline`, ToggleButton's outline variant |
| R78 | **hover, on a neutral/transparent surface** | `background-color: var(--accent-soft);` and, if the base faded opacity, `opacity: 1` | `tabs.css:82-90`; `pagination.css:105-108` | tabs, pagination links, any row *outside* a tinted panel |
| R79 | **hover/keyboard-cursor/selected, inside a tinted option panel** | `background-color: var(--accent-soft-hover);` — the same fill for `:hover` / `[data-hovered]`, `[data-focused]`, `[data-selected]`, `[aria-selected]`/`[aria-checked]`. Wrap the hover pair in `@media (hover: hover)`. | `dropdown.css:137-151`; `select.css:279-293` · tc `tc-dropdown.styles.ts:96-104` | Select/Dropdown/ComboBox/Autocomplete rows |
| R80 | **hover, on a surface-filled container** | `background-color: var(--tzuchi-accordion-trigger-hover-bg, var(--surface-hover));` | `accordion.css:104-113` | accordion trigger, disclosure trigger |
| R81 | **selected = accent FILL** | `--pagination-link-bg: var(--accent); --pagination-link-bg-hover: var(--accent-hover); --pagination-link-fg: var(--accent-foreground); font-weight: 700;` | `pagination.css:118-127` | pagination current page; **use when the selected item is one of a set of equal cells and selection is the only state that matters** |
| R82 | **selected = accent-soft-hover FILL** | R79 | `dropdown.css:147-151` | **use inside a tinted panel**, where a solid accent fill would fight the panel |
| R83 | **selected = BORDER currentColor** | `border-color: currentColor;` on `:is([data-selected="true"], [aria-selected="true"])`, fill unchanged | `tag.css:101-109` · tc `tc-chip[selected]` | Tag, filter chips, ToggleButton, colour-swatch — **use when the item already carries a tonal fill at rest** |
| R84 | **selected = LABEL colour + indicator** | `color: var(--accent);` on the selected tab; indicator/underline already `--accent` | `tabs.css:120-123` | underline tabs, breadcrumb-like current markers |
| R85 | **disabled** | **nothing.** `--disabled-opacity` is already 0.38 and `status-disabled` also sets `cursor`. | `variables.css:23`; every override's "KEPT" section | everywhere |
| R86 | **danger / invalid** | `border-color: var(--danger)` for field edges (R68); `--danger-soft` for the tinted callout wash; `--danger` for a tone stripe or an icon | `alert.css:123-135`; `input.css:64-66` | fields, alerts, danger menu items (left alone) |
| R87 | **tone wash (info/success/warning/danger callout)** | set two local channels on the root, then flip them per status: `--alert-accent: var(--accent|--success|--warning|--danger); --alert-surface: var(--accent-soft|--success-soft|--warning-soft|--danger-soft);` and paint the **icon** with `--alert-accent`, never a `-soft-foreground` mix | `alert.css:55-58`, `:103-135` | Alert, Toast tones, inline banners |
| R88 | **neutral `--default` is the right answer** | leave it alone | `button.css:37-41`; `progress-bar.css:37-43`; `input.css:26-29`; `checkbox.css:36-38`; `textarea.css:12-15`; `select.css:61-64` | ① HeroUI-only *neutral* variants with no tc counterpart (`--tertiary`, `--ghost`, every `--secondary` field/control, `.chip` default variant) ② **passive tracks** (§7) ③ anything where a brand tint would falsely read as "selected" |

**The tint ladder, for calibration** (computed; light page `#f8f8f8`, light card `#ffffff`,
dark page `#161618`, dark card `#1c1c1e`):

| fill | on card (L / D) | on page (L / D) | text on it |
|---|---|---|---|
| `--accent-soft` (`#e8eefe` / `#1b2d58`) | 1.16 / 1.27 | 1.09 / — | `--accent-soft-foreground` 11.58 / 7.42 |
| `--default` (`#f2f2f2` / `#333333`) | 1.12 / 1.35 | 1.05 / 1.43 | `--default-foreground` 11.29 / 11.29 |

The neutral fill is deliberately calibrated to the *same volume* as the brand tonal fill — a grey
chip must never shout over a blue one (`neutral-token-impact.md:134-144`, `:273-295`).

---

## 6. Overlay shells

### (a) Option-list popover — Select, Dropdown, **and (new) ComboBox, Autocomplete, ColorSwatchPicker, any `Popover` whose body is an option column**

| # | Declaration | EVIDENCE |
|---|---|---|
| R89 | `border-radius: var(--tc-dropdown-radius, var(--radius));` → 8px | `dropdown.css:66`; `select.css:233` |
| R90 | `background-color: var(--accent-soft); color: var(--accent-soft-foreground);` | `dropdown.css:71-72`; `select.css:239-240` · tc `tc-dropdown.styles.ts:77,89` |
| R91 | `& [data-slot="popover-overlay-arrow"] { fill: var(--accent-soft); }` | `dropdown.css:75-77`; `select.css:242-244` |
| R92 | list box: `padding-block: var(--tc-space-8, 8px); padding-inline: 0; gap: 0;` — **restate it inside your own popover scope**, because HeroUI's `.<x>__popover [data-slot="list-box"] { p-1.5 }` is (0,2,0) and ties with `list-box.css` | `select.css:246-254`; `list-box.css:16-21` |
| R93 | rows: R57 geometry + `padding-inline: var(--tc-space-32, 32px)` **restated in the popover scope** for the same tie reason | `select.css:256-260` |
| R94 | row label: `[data-slot="list-box-item"]:not(.<x>--danger) [data-slot="label"] { color: inherit; }` — `label.css:4` hard-codes `text-foreground` | `select.css:267-274`; `dropdown.css:117-128` |
| R95 | `.header` inside it: `padding-inline: var(--tc-space-32, 32px);` (size stays 12px, R8) | `dropdown.css:87-91`; `list-box.css:53-58` |
| R96 | states: R79; ring offset: R71 | `select.css:279-302` |
| R97 | shadow: **keep HeroUI's `--overlay-shadow`.** tc's `--tc-elevation-2` is a light-only literal. | `select.css:237-238` |

Closing README.md:134 — ComboBox and Autocomplete popovers are the half pass 2 did not reach.

### (b) Content popover — Popover, DatePicker / DateRangePicker / ColorPicker shells, Calendar/RangeCalendar containers — **DECISION**

**Follow the Card/Modal surface, not the option panel.**

| # | Declaration | Resolves to |
|---|---|---|
| R98 | `border-radius: var(--tc-card-radius, var(--radius-2xl));` | **16px** |
| R99 | background: **leave `--overlay`** (do not tint) | white / `#1c1c1e` |
| R100 | `box-shadow`: **leave `--overlay-shadow`** | — |
| R101 | body type: R5 (16/400/1.6); title: R11 (16/700/1.5) | — |
| R102 | padding: leave HeroUI's; if the popover has none, use `var(--tc-space-16, 16px)` (the card/alert/accordion-panel inset) | 16px |

**Why.** There is no `tc-popover`. The two nearest Tzu Chi shells both land on the same shape:
`tc-card.styles.ts:8` and `tc-modal.styles.ts:21` are both `--tc-radius-lg` (16px) on
`surface.default`. The 8px radius of the option panel is *earned* by its rows running edge-to-edge —
`dropdown.css:79-81` says the 8px block padding exists precisely "to keep them clear of the 8px
corner radius". A content popover pads its content, so that argument does not apply and it takes
the surface radius instead. The `--accent-soft` tint is `tc-dropdown`'s **listbox** signature
(`--tc-dropdown-listbox-bg`); applying it to arbitrary content would put body copy on a panel it
was never contrast-checked against and would make a Popover indistinguishable from a Select menu.

### (c) Modal-like — Modal, **AlertDialog**, **Drawer**

| # | Declaration | EVIDENCE |
|---|---|---|
| R103 | `border-radius: var(--tc-modal-radius, var(--tc-radius-lg, 16px));` on `:not(…--full)` — Drawer's edge-docked sides keep `rounded-none` (`drawer.css:171,176`) | `modal.css:75-77` |
| R104 | `--tw-shadow: var(--tzuchi-modal-shadow, var(--overlay-shadow));` — set `--tw-shadow`, **not** `box-shadow`, so Tailwind's inset/ring composition survives. **See §11 I4 before copying the "real drop shadow in dark" claim.** | `modal.css:72-78` |
| R105 | heading `font-weight: var(--tc-font-weight-bold, 700);` (R11) | `modal.css:81-83` |
| R106 | body: R5 + `color: var(--overlay-foreground);` (not `--muted`) | `modal.css:86-90` |
| R107 | region rhythm: `header + body { margin-block-start: var(--tc-space-16, 16px) }`; `header + footer, body + footer { margin-block-start: var(--tc-space-24, 24px) }` | `modal.css:93-100` |
| R108 | footer `flex-wrap: wrap;` | `modal.css:103-105` |
| R109 | close trigger transparent at rest, with the guard: `.<x>__close-trigger.close-button--default:not(:hover, [data-hovered="true"], :active, [data-pressed="true"]) { background-color: transparent; }` | `modal.css:107-118` (same pattern `tag.css:153-161`) |
| R110 | enter motion: `--tw-animation-duration: var(--tc-motion-duration-base, 200ms); --tw-ease: var(--tc-motion-easing-standard, …);` on `[data-entering="true"]` only — exits stay HeroUI's | `modal.css:120-129` |
| R111 | **keep** HeroUI's: dialog padding (24px), close-trigger position, backdrop colour, focus ring, size scale | `modal.css:19-22` |

### (d) Tooltip-like — Tooltip; **and what Toast follows**

**Tooltip = inverted bubble.**

| # | Declaration | Resolves to | EVIDENCE |
|---|---|---|---|
| R112 | `background-color: var(--foreground); color: var(--surface);` | `#333`/`#fff` light, `#f2f2f2`/`#1c1c1e` dark — 12.63:1 / 15.20:1 against the card | `tooltip.css:53-56` · tc `tooltip.tokens.json` bg = `text.default`, fg = `surface.default` |
| R113 | `border-radius: var(--tc-tooltip-radius, var(--tc-radius-sm, 4px)); max-inline-size: var(--tc-tooltip-max-width, 240px); padding-block: var(--tc-tooltip-padding-block, 4px); padding-inline: var(--tc-tooltip-padding-inline, var(--tc-space-8, 8px));` | 4px, 240px, 4/8 | `tooltip.css:58-62` |
| R114 | `word-break: normal; overflow-wrap: anywhere;` | — | `tooltip.css:68-74` |
| R115 | arrow: `fill: var(--foreground); stroke: var(--foreground);` (fold the hairline into the fill) | — | `tooltip.css:76-80` |
| R116 | **keep** elevation, enter/exit motion, delay, arrow geometry, placement rotation, trigger ring | — | `tooltip.css:26-29` |

**Toast — DECISION: Toast follows (c)/surface, NOT the tooltip inversion.**

| # | Declaration | Resolves to |
|---|---|---|
| R117 | `border-radius: var(--tc-card-radius, var(--radius-2xl));` | **16px** |
| R118 | background: **leave `bg-surface`**; shadow: **leave `shadow-overlay`** | — |
| R119 | title R1/R11 (16/700/1.5); description R5 (16/400/1.6) in `--foreground`, **not `--muted`** | — |
| R120 | leading icon `var(--tc-size-icon-sm, 20px)` square, painted in the tone (R87), not a `-soft-foreground` mix | 20px |
| R121 | if Toast has tone variants, use R87's two-channel pattern; otherwise leave it neutral | — |
| R122 | **do not break** `spinner.css:106-113` — the toast indicator stays 16px | — |

**Why.** A Toast is a persistent, dismissible, multi-line message with actions and a close
button — structurally `tc-alert` / `tc-card`, not a ≤240px hint bubble. HeroUI already treats it
that way: `toast.css:57` paints `bg-surface … shadow-overlay` while `tooltip.css` paints
`bg-overlay`, and `toast.css:47` uses the *card/modal* radius expression. Inverting it would make
every toast read as a giant tooltip and would strand the tone washes (R87) on a dark fill they were
never mixed against. **There is no `tc-toast`** — flag this to the owner (§12 Q6).

### Shadows — the whole rule

| Use | Token | EVIDENCE |
|---|---|---|
| resting elevation (card, switch thumb) | `var(--surface-shadow)` | `switch.css:103`, `:115`; `card.css:14-16` |
| floating overlay (popover, dropdown, toast, tooltip, drawer, alert-dialog) | `var(--overlay-shadow)` | `select.css:237-238`; `tooltip.css:27` |
| modal only | `--tw-shadow: var(--tzuchi-modal-shadow, var(--overlay-shadow))` | `modal.css:77` |
| flat by design | `box-shadow: none` | `alert.css:69-70` |
| **never** | `--tc-elevation-*`, `--tc-card-elevation`, `--tc-modal-shadow`, `--tc-tooltip-shadow` — light-only literals in `tokens.css` that only flip under `[data-theme="dark"]` | `gap-audit/README.md:73` |

**Dark mode keeps HeroUI's inset hairline for overlays.** `themes/tzuchi/variables.css`'s dark
block never redeclares `--overlay-shadow`, so it falls through to
`themes/default/variables.css`'s `[data-theme$="-dark"]` block (a 1px inset white hairline instead
of a drop shadow). That is intentional — a black drop shadow on a near-black page is invisible.
**Do not "fix" it per component.** (`modal.css:63-68`)

---

## 7. Tracks & indicators

### 7.1 The evidence — Tzu Chi has three different track answers

| Track | Colour token | Resolves to | Why | EVIDENCE |
|---|---|---|---|---|
| progress (**passive**) | `--default` | `#f2f2f2` / `#333333` | tc paints it `surface.subtle`, but this theme maps that onto `--background` — *the page colour* — in both modes, so a `--background` track would be invisible on a themed page. `--default` is one ramp step from tc's intent in light and the only one of the two readable in dark. | `progress-bar.css:37-43` |
| spinner (**indicator moving over it**) | `--border` | `#bdbdbd` / `#6b6b6e` | tc-spinner draws a full neutral ring *under* the arc, stroked `color.border.default`. | `spinner.css:58-61` · `--tc-spinner-track-color` |
| switch off-track (**you operate it**) | `--tzuchi-switch-track-bg` (`border.strong`) | `#828282` / `#95969b` | `--default` is near-white in light and left the off state almost invisible. | `switch.css:69-73` |

### 7.2 Contrast (computed; light page `#f8f8f8` / card `#ffffff`, dark page `#161618` / card `#1c1c1e`)

| candidate | track vs card (L/D) | track vs page (L/D) | `--accent` fill vs track (L/D) |
|---|---|---|---|
| `--default` `#f2f2f2`/`#333333` | 1.12 / 1.35 | **1.05** / 1.43 | 12.00 / 6.97 |
| `--border` `#bdbdbd`/`#6b6b6e` | **1.88** / **3.20** | **1.77** / **3.40** | 7.15 / **2.93** |
| `border.strong` `#828282`/`#95969b` | 3.84 / 5.76 | 3.62 / 6.12 | 3.50 / **1.63** ✗ |

### 7.3 The rules

| # | ROLE | Declaration | Justification |
|---|---|---|---|
| R123 | **Passive track** — ProgressBar, Meter, ProgressCircle (the track is scenery; you read the *fill*) | leave `bg-default`; only R32's pill radius and R19's readout type change | `--default`'s track-vs-page 1.05:1 is weak, but the **fill-vs-track ratio is 12.00 : 1 light / 6.97 : 1 dark** — the bar is unmistakable even when the track is not. `neutral-token-impact.md:150-160` (R1) records this explicitly as a *component* decision, and notes Tzu Chi's own answer (`surface.subtle`, 1.06 on white) is fainter still. |
| R124 | **Interactive track** — Slider, ColorSlider (you must *locate and grab* it) | `background-color: var(--border);` on the track | WCAG 1.4.11 asks 3:1 for a graphical object you must operate. `--border` is the only neutral already in the theme that gets there in dark (**3.20 card / 3.40 page**) and it nearly doubles light (**1.88 / 1.77** vs `--default`'s 1.12 / 1.05). It is also the exact token Tzu Chi itself uses for the one track it draws under a moving indicator (`spinner.css:58-61`). `border.strong` is **rejected**: it clears 3:1 on both counts but the `--accent` fill collapses to **1.63:1** against it in dark — the filled portion would vanish. **Residual, recorded:** light still misses 3:1 (1.88), and dark fill-vs-track is 2.93 — closing either needs a new token, not a component override (§12 Q5). |
| R125 | **Slider fill + thumb** | fill `--accent` (already); track/fill/thumb `border-radius: var(--tc-radius-full, 9999px)` (R32/R26); thumb keeps `shadow-field` | derive from `progress-bar.css:116-122` (pill) + `radio.css:80` (round handle) |
| R126 | **Track thickness** | ProgressBar md is **8px = `--tc-progress-height`, already identical — do not restate.** sm 4px / lg 12px have no tc counterpart: keep HeroUI's. Slider/Meter/ProgressCircle: **NO EVIDENCE — keep HeroUI's thicknesses**, change only colour + radius. | `progress-bar.css:32-35` |
| R127 | **Spinner** | sizes `var(--tc-spinner-size-sm/-md/-lg)` = 20/32/40px (`md` is the default and must land on the **root** `.spinner` class); `xl` = `calc(40px + var(--tc-space-8, 8px))` = 48px; `animation-duration: var(--tc-spinner-duration, 0.8s)`; track band `--spinner-track: var(--border)` drawn as `radial-gradient(circle closest-side, transparent 62%, var(--spinner-track) 63% 87%, transparent 88%)` | `spinner.css:56-98` |
| R128 | **Spinner on a filled surface** (`--current`) | `--spinner-track: color-mix(in oklab, currentColor 20%, transparent);` | `spinner.css:100-104` — a neutral grey track on an accent-filled button would be wrong |
| R129 | **Skeleton** | **NO CHANGE.** HeroUI's `rounded-sm` already resolves to 4px = `--tc-radius-sm` under this theme, and `bg-surface-tertiary/70` is deliberately left unmapped — mapping it would turn a placeholder into a loud grey block (2.08:1 in dark). | `neutral-token-impact.md:334-350` |
| R130 | **Segmented-tabs track / pill** | track = `--default`; pill = `--segment`, **deliberately unmapped**. Do not invent a value. Dark separation is 1.35:1 — a known regression (§12 Q4). | `neutral-token-impact.md:321-332` |

---

## 8. Motion

Three tokens. Nothing else.

```
--tc-motion-duration-fast    150ms
--tc-motion-duration-base    200ms
--tc-motion-easing-standard  cubic-bezier(0.2, 0, 0, 1)
```

| # | Where it was applied | Declaration | EVIDENCE |
|---|---|---|---|
| R131 | colour fades on a trigger/control (hover fill, border, checkbox fill) | `transition-duration: var(--tc-motion-duration-fast, 150ms); transition-timing-function: var(--tc-motion-easing-standard, ease);` | `accordion.css:67-73`; `checkbox.css:72-82`; `tag.css:124-134` |
| R132 | a value/indicator travelling (progress width, switch thumb + track, chevron rotation) | same two longhands at `var(--tc-motion-duration-base, 200ms)` | `progress-bar.css:140-146`; `switch.css:91-107`; `accordion.css:76-84` |
| R133 | overlay **enter** | `--tw-animation-duration: var(--tc-motion-duration-base, 200ms); --tw-ease: var(--tc-motion-easing-standard, …);` on `[data-entering="true"]` | `modal.css:120-129` |
| R134 | a continuous glide | `animation-timing-function: linear;` (never an ease) | `progress-bar.css:148-153` |
| R135 | spin | `animation-duration: var(--tc-spinner-duration, 0.8s);` | `spinner.css:66-69` |

### Hard rules

| # | Rule | Why | EVIDENCE |
|---|---|---|---|
| R136 | **Longhands only.** Set `transition-duration` / `transition-timing-function` / `animation-duration` / `animation-timing-function`. **Never** `transition-property` or `animation-name`. | `motion-reduce:transition-none` compiles to `transition-property: none` and `motion-reduce:animate-none` to the `animation` shorthand — leaving those alone keeps both reduced-motion guards winning without any restatement. | `accordion.css:80-81`; `checkbox.css:72-73`; `progress-bar.css:77-84`; `spinner.css:66-68` |
| R137 | If you **must** set `transition-property` (to add a property HeroUI does not transition) or the `transition` shorthand, **restate the reduced-motion guard yourself, on BOTH switches**: the `[data-reduce-motion="true"]` attribute *and* `@media (prefers-reduced-motion: reduce)`. | Your rule out-specifies HeroUI's guard. | `switch.css:134-154`; `tag.css:124-125` |
| R138 | Adding a property to a positional `transition-*` list: **repeat the whole list** and change only your own entries; leave everyone else's original duration/easing verbatim. | `transition-duration`/`-timing-function` are positional lists matched to `transition-property`. | `tag.css:111-133` — only `background-color` and `border-color` move to 150ms; `color`/`scale`/`opacity`/`box-shadow` keep HeroUI's 100ms + `--ease-smooth`/`--ease-out` |
| R139 | Alternatively, nest the whole rule in `@media (prefers-reduced-motion: no-preference)` so HeroUI's lower-specificity guard still wins. | | `accordion.css:64-73`; `tag.css:124-125` |
| R140 | **No choreography.** No new `@keyframes`, no enter/exit sequences, no stagger, no transform animations. Exit animations keep HeroUI's 100–150ms. Durations that differ for a good reason stay (`progress-bar.css:148-150`: HeroUI's indeterminate keyframes travel 450% vs tc's 350%, so HeroUI's 1.5s already reproduces tc's velocity to within 3%). | | |

---

## 9. Spacing

| # | GAP | Value | EVIDENCE |
|---|---|---|---|
| R141 | **label ↔ control** (field stack) | `var(--tc-space-4, 4px)` — **already correct theme-wide, do not restate** | `search-field.css:33-36` (*"…the 4px label-to-field gap and the font family already resolve to the Tzu Chi values"*); tc `tc-input.styles.ts:8-12` `.field { gap: 4px }` |
| R142 | **control ↔ description / error** | `var(--tc-space-4, 4px)` | **No override precedent** — tc's `.field` uses one 4px gap for all three rows (`tc-input.styles.ts:8-12`); HeroUI's `.textfield { gap-1 }` is already 4px |
| R143 | **selection control ↔ its label** | `gap: var(--tc-space-8, 8px);` on the content slot | `checkbox.css:129-130`; `radio.css:156-157`; `switch.css:67` · tc: `tc-checkbox/radio/switch.styles.ts:7` |
| R144 | **description/error indent under a selection control** | `padding-inline-start: calc(<control size> + <content gap>);` — derive it, never hard-code | checkbox 32+8=**40px** `checkbox.css:136-141`; radio 32+8=**40px** `radio.css:163-167`; switch 44+8=**52px** / sm 44 / lg 60 `switch.css:125-131` |
| R145 | **group gap** (CheckboxGroup, RadioGroup, SwitchGroup, Fieldset) | **NO EVIDENCE — derive from R143**: use `var(--tc-space-8, 8px)` between rows in a dense group, and leave `Fieldset`/`SwitchGroup`'s `gap-6` (24px = `--tc-space-24`) between *sections*. HeroUI's bases today are `mt-4` (16px, checkbox/radio) and `gap-6` (24px, switch/fieldset) — both are already on the Tzu Chi 4px rhythm, so **the safe move is to change nothing** and only align an outlier if one appears. | `checkbox-group.css:4-6`; `radio-group.css:6-10`; `switch-group.css:2-8`; `fieldset.css:3` |
| R146 | **section header in a list** | `padding-inline: var(--tc-space-32, 32px);` — flush with the option text; block padding stays HeroUI's `pt-1.5 pb-1` | `dropdown.css:87-91`; `list-box.css:53-58` |
| R147 | **icon ↔ label inside a control** | `gap: var(--tc-space-8, 8px);` | `accordion.css:56`; `tabs.css:71-72` |
| R148 | **title ↔ description pair** | `gap: var(--tc-space-8, 8px)` in a card header; `var(--tc-space-4, 4px)` in a callout | `card.css:50-54`; `alert.css:73-75` |
| R149 | **container body gap** | `gap: var(--tc-space-16, 16px);` | `card.css:44-48` · tc `tc-card.styles.ts:58` |
| R150 | **action row gap** | `gap: var(--tc-space-8, 8px);` (footer) | `card.css:69-72`; modal footer already 8px |
| R151 | **callout gap / padding** | `gap: var(--tc-alert-gap, 0.75rem)` = 12px; `padding: var(--tc-alert-padding, 1rem)` = 16px on all sides | `alert.css:60-63` |
| R152 | **panel padding** | `var(--tc-space-16, 16px)` on all sides, including the block-start HeroUI zeroes out | `accordion.css:92-97` |
| R153 | **inline list gap** (breadcrumbs, chips, tags) | `gap: var(--tc-space-8, 8px)` on the container **and** on the item; add `flex-wrap: wrap` | `breadcrumbs.css:63-76` |
| R154 | **micro gap** (chip/tag/badge internals, tab underline inset, pagination cells) | `var(--tc-space-4, 4px)` | `chip.css:56`; `badge.css:65`; `tabs.css:116-118`; pagination gap already 4px |

---

## 10. Do NOT touch — settled in passes 1–2, do not re-litigate

| # | What | Reason | EVIDENCE |
|---|---|---|---|
| D1 | **Every theme variable** — `--radius`, `--field-radius`, `--field-border-width`, `--field-shadow`, `--disabled-opacity`, `--ring-offset-width`, `--font-sans`, and every colour | Already correct via `variables.css`. Restating them is duplication that will drift. | `input.css:9-14`; `select.css:43-47` |
| D2 | **Disabled** treatment anywhere | `--disabled-opacity` = 0.38 = `opacity.disabled`; `status-disabled` also sets the cursor | `variables.css:23` |
| D3 | **Focus ring width / offset / colour** | Already 2px / 2px / `--focus` theme-wide; the theme's `--focus` is *better* than tc's fixed blue-500 because it has a dark value | `gap-audit/README.md:72`; `breadcrumbs.css:114-116` |
| D4 | Accordion **`variant="default"`** stays unboxed (no border, no radius, no fill) | Keeps HeroUI's two variants visually distinct; only `surface` has a tc counterpart | `accordion.css:26-30` |
| D5 | Badge **radius, 12px font, 500 weight, the 1px `--badge-border` cut-out ring, placement offsets, `.badge__label` padding** | HeroUI's `rounded-3xl/2xl/xl` already pill at every size; tc's 8px label padding would stop a single digit rendering as a circle | `badge.css:18-25` |
| D6 | `.breadcrumbs__separator` size and colour; disabled, pressed, RTL, transitions, decoration thickness | tc's "›" glyph draws less ink at 16px than a 12px chevron | `breadcrumbs.css:110-117` |
| D7 | Button **`--tertiary`, `--ghost`, `--danger`, `--danger-soft`** colours | No tc counterpart; `--default` and `--danger*` are already Tzu Chi tokens | `button.css:37-41`; `neutral-token-impact.md:215-217` |
| D8 | **`.close-button`** — it is a separate component shared by drawer/toast/popover/alert-dialog | Restyling it regresses every host | `button.css:245-248`; `gap-audit/modal.md:123` |
| D9 | Card padding (16px already matches); HeroUI's `secondary`/`tertiary`/`transparent` card variants | Already `--tc-card-padding`; no tc counterpart | `card.css:19`, `:44` |
| D10 | Checkbox `--secondary` colours; invalid-unselected and pressed states; per-story `size-*` utilities | No tc counterpart; the utilities layer beats the components layer by design | `checkbox.css:36-40`, `:55-58` |
| D11 | **Chip's entire colour axis** | tc-chip's palette is reproduced only by `<Chip color="accent" variant="soft">`; the grey-bg/blue-text default is a HeroUI mapping quirk shape overrides cannot fix | `chip.css:12-24` |
| D12 | `.dropdown__trigger`; `.menu-item--danger`, sections, descriptions, kbd, submenus, indicators | In every stock story the trigger is a plain `<Button>`; the rest has no tc equivalent | `dropdown.css:32-42` |
| D13 | Every field's **`--secondary`** variant fill | It keeps HeroUI's `--default`, which the theme already maps to a Tzu Chi grey, and it correctly also carries the 1px `--field-border` — every Tzu Chi field is bordered | `input.css:26-29`; `textarea.css:12-15`; `select.css:61-64`; `search-field.css:23-27` |
| D14 | `.link__icon`; the `:not(.button)` guard on `.link` | HeroUI lets a Link borrow Button classes; without the guard those links lose the Button shape | `link.css:17`, `:26-29` |
| D15 | ListBox `overflow-clip`, the Virtualizer's positioning, the separator's `ms-[3%] w-[94%]` | Structural / HeroUI's own look | `list-box.css:23-25` |
| D16 | ListBoxItem `min-h-9`, `gap-3`, the absolute 16px indicator, `scale(0.98)` pressed, the focus ring, danger colours | No tc equivalent for any of them | `list-box-item.css:27-32` |
| D17 | Modal padding (24px), close-trigger position, backdrop colour, header gap / icon slot, the size scale, and `--full`'s `rounded-none`/`shadow-none` | Both designs land on the same optical centre; `--full` is deliberately unchromed | `modal.css:19-22`, `:32-33` |
| D18 | Pagination gap, focus ring, disabled, press-scale, nav-button padding/gap and its 16px chevrons | Already 4px / 2px / 0.38; tc's nav button is icon-only with no labelled counterpart | `pagination.css:27-32` |
| D19 | ProgressBar track **height** (8px already matches), sm/lg heights, row gap, fill colour, disabled, grid layout, indeterminate keyframes + 1.5s | Identical or structural | `progress-bar.css:32-45`, `:148-150` |
| D20 | Radio label/foreground colours, disabled, shadow, invalid, motion | Already correct under the theme | `radio.css:26-28` |
| D21 | **The field focus RING** — keep HeroUI's 2px `--focus`, do not swap in tc's 3px halo | Overriding it means re-declaring `box-shadow`, which fights Tailwind's `--tw-ring-shadow` composition and the `shadow-field` stack | `search-field.css:63-70`; `gap-audit/input.md` — **but see §11 I1** |
| D22 | SearchField clear-button size (20px) and glyph (12px) | Tzu Chi has no clear affordance to copy | `search-field.css:198-200` |
| D23 | Select `.select__clear-button`, multi-select chips, sections, headers, descriptions, the item indicator, async loading, and CustomIndicator's own icon size | No tc equivalent | `select.css:65-68`, `:188-189` |
| D24 | Separator end caps, the 8px vertical min-height, and **no baked-in margin** | Spacing around a separator belongs to the consumer (`.menu` and `.dropdown__menu` space theirs with flex gap, `.toolbar` with its grid) — baking a margin in would double up inside every menu | `separator.css:28-31` |
| D25 | The `--separator-secondary` / `--separator-tertiary` **variables** | They are also used by table borders and link underlines; only the component's own variant classes are re-anchored | `separator.css:25-26` |
| D26 | Spinner stroke thickness, the 90/150 dash gap, round line caps, the reduced-motion dash swap | They live inside tc's stroked `<circle>`s; HeroUI's mark is two gradient-filled `<path>`s | `spinner.css:35-38` |
| D27 | Switch checked/hover/pressed/focus-visible/disabled/invalid **colours**, the Icon slot, SwitchGroup | Only geometry, the off-track fill, the thumb shadow and motion changed | `switch.css:25-26` |
| D28 | Tabs divider/underline **colours**, disabled, the 150ms transitions, separators, scroll chevrons, panels | `--border` / `--accent` already resolve to tc's `border.default` / `brand.primary` | `tabs.css:30-32` |
| D29 | Tag gap (4px), cursor, `select-none`, focus ring, disabled, the empty pressed state, both variants' own colours, and the `touch-target` `::after` | Already matching or no counterpart | `tag.css:45-48`, `:139-141` |
| D30 | Tooltip elevation, enter/exit motion, open/close delay, arrow geometry + placement rotation, `.tooltip__trigger` focus ring, transform-origin / anchor positioning | Positioning and z-index are React Aria portal concerns CSS cannot reach | `tooltip.css:26-29`; `gap-audit/README.md:81` |
| D31 | `--surface-secondary`, `--surface-tertiary`, `--backdrop`, `--segment` — **deliberately unmapped** | The tokens have only two surface steps, and HeroUI's values already sit correctly between `--surface` and `--default` in both modes; `--segment` would need a brand-new token for one rule | `variables.css:12-14`; `neutral-token-impact.md:321-350` |
| D32 | **Behaviour, structure and i18n** — form association, events, keyboard models, ARIA wiring, Shadow-DOM slots/parts, `data-empty` collapse, stretched card links, placement, z-index, hard-coded English `aria-label`s | React Aria / the React layer owns all of it | `gap-audit/README.md:75-83` |

---

## 11. Known inconsistencies between the existing override files

**Listed, not resolved.** Where a new component must pick a side, the recommendation is marked
**→ FOLLOW**; anything else needs the owner (§12).

### I1 — Field focus treatment is not uniform

- `textarea.css:80-83`: `&:focus, &[data-focused="true"] { box-shadow: 0 0 0 3px var(--accent-soft-hover); }` — replaces HeroUI's ring with tc's 3px pale halo; invalid+focused gets `box-shadow: 0 0 0 3px var(--danger)` (`textarea.css:103-108`).
- `input.css` — **no ring rule at all**; keeps HeroUI's 2px `--focus` ring.
- `search-field.css:63-70` states it outright: *"Pass 1 kept the ring for Input on purpose… Same call here, so the themed SearchField and the themed Input focus identically. Note that pass-1 textarea.css went the other way; that inconsistency is upstream of this file and is flagged in the report, not re-litigated here."*
- `select.css:43-47` also keeps the ring.

So three fields ring and one haloes. **→ FOLLOW Input** (keep HeroUI's ring) for every new field
family member, per D21.

### I2 — Field height: 43.6px for text fields, 42px for the Select trigger

- `search-field.css:98-105`: *"a 16px/1.6 line box + 2×8px block padding + 2×1px border = 43.6px, the same number input.css and tc's `.control` land on."*
- `select.css:117-119`: *"Content 24px + 16px padding + 2px border = 42px, above HeroUI's min-h-9."*

Cause: the trigger is typed **subtitle (1.5)**, the input **body (1.6)**. A Select sitting next to
an Input in the same row is **1.6px shorter**. Not resolved.

### I3 — Field inline padding: 20px for text fields, 32px for the Select trigger

- `input.css:51`, `textarea.css:57`, `search-field.css:154` → 20px.
- `select.css:113-114` → 32px, justified at `select.css:110-112`: *"32px is wider than the themed Input's 20px on purpose: it is tc-dropdown's own Figma value, and it is the same inset pass 1 gave the option rows, so the label does not jump when the panel opens."*

Deliberate, but the field family now has two insets. **→ FOLLOW 20px** for everything except a
control whose popover rows are inset 32px.

### I4 — `--tzuchi-modal-shadow` is declared in **light only**

- `variables.css:68` declares `--tzuchi-modal-shadow: 0px 12px 28px 0px #00000029;` inside the `[data-theme="tzuchi"]` block.
- The `[data-theme="tzuchi-dark"]` block (`variables.css:71-113`) does **not** declare it, and does not declare `--overlay-shadow` either.
- `modal.css:77` is `--tw-shadow: var(--tzuchi-modal-shadow, var(--overlay-shadow));`

⇒ under `tzuchi-dark` the fallback fires and the Modal gets exactly HeroUI's 1px inset hairline —
while `modal.css:6-9` claims *"it also keeps a real drop shadow in dark mode, where HeroUI's
`--overlay-shadow` degrades to a 1px inset white hairline."* **Do not copy that claim into
AlertDialog or Drawer.** Needs the theme owner (§12 Q3).

### I5 — One bold-16 role uses line-height 1.6 instead of 1.5

- `alert.css:90-95`: title = 16px / 700 / `--tc-line-height-relaxed` (**1.6**).
- Every other bold-16 role is **1.5**: `button.css:85`, `select.css:121`, `list-box-item.css:64`, `dropdown.css:112`, `accordion.css:55` (`--tc-typography-subtitle`), `modal.css:81-83` (keeps HeroUI's `text-base` = 1.5).

Faithful to tc (`tc-alert.styles.ts:73-74` sets `font: typography-body` then overrides the weight),
but a Toast/Banner author copying "bold 16" from the wrong neighbour will be 1.6px off per line.

### I6 — Two files hard-code extrapolated sizes as literals

- `badge.css:71-80`: `min-block-size: 16px` / `24px`.
- `switch.css:75-85`: `36px / 20px / 14px` and `52px / 28px / 22px`.

Every other file expresses even invented values as a `calc()` over `--tc-*` tokens
(`button.css:105-108`, `spinner.css:95-98`, chip/tag via padding steps). Both conventions are in
the codebase. **→ FOLLOW the calc-over-tokens form** for anything new.

### I7 — A now-dead rule with a false justification

`pagination.css:103` `--pagination-link-fg: var(--foreground);` — `--default-foreground` and
`--foreground` now resolve to the same primitive in both modes, so this is a no-op, and its comment
(`pagination.css:100-102`) still says the theme leaves `--default-foreground` unmapped.
Recorded in `neutral-token-impact.md:219-229`.

### I8 — Two different answers for "stop the focus ring spilling"

- `--ring-offset-width: 0px` — keeps HeroUI's ring mechanism (`accordion.css:58-61`, `radio.css:85-86`).
- `outline` + negative `outline-offset` + `box-shadow: none` — replaces it (`tabs.css:92-100`).

Both are justified in their own file (the tabs one also survives the ScrollShadow's overflow
clipping). **→ FOLLOW R72 by default, R73 only when the ring would be clipped by an ancestor.**

### I9 — The shared option-row geometry has no shared panel

`list-box.css:11-21` and `list-box-item.css:12-25` deliberately ship **geometry only**, with the
tint scoped to `.select__popover` in `select.css`. README.md:134 records the consequence:
ComboBox, Autocomplete and the standalone ListBox get 32px/16px/700 rows on HeroUI's untinted
`--overlay` panel with a neutral `--default` hover. Half-themed today; **§6(a) R89–R97 is the rule
that closes it** — this is listed so nobody reads the current state as a decision.

### I10 — Six stale "unmapped `--default`" comments

`pagination.css:23` and `:100-102`; `chip.css:19` and `:45`; `dropdown.css:134-135`;
`switch.css:69`; plus `variables.css:13` / `generate.mjs:124`. All enumerated in
`neutral-token-impact.md:231-254`. The **decisions** they justify are still correct; only the
stated reason is out of date. Do not copy the wording.

---

## 12. Open questions — could not be settled from the evidence

| # | Question | What is known |
|---|---|---|
| Q1 | **Checkbox / radio: 24px or 32px?** | `tc-checkbox` / `tc-radio`'s prose and CSS fallbacks say **24px**; the tokens `--tc-checkbox-size` / `--tc-radio-size` point at `size.icon.md` = **32px**. The overrides follow the token. Owner must check Figma. (`gap-audit/README.md:63-64`) |
| Q2 | **Textarea's 3px halo vs the 2px ring** (I1) — which is the Tzu Chi field focus? | tc-input, tc-textarea and tc-search-bar all specify the 3px halo (`tc-input.styles.ts:44`); the overrides shipped the ring for 3 of 4 fields for a mechanical reason, not a design one. |
| Q3 | **Is `--tzuchi-modal-shadow` meant to exist in dark?** (I4) | If yes, `generate.mjs` must emit it in the dark block; if no, `modal.css:6-9` should be corrected. |
| Q4 | **Dark segmented-tabs pill** — `--segment` vs track is **1.35:1** (was 1.59 stock). | `neutral-token-impact.md:162-170`, `:321-332`. Closing it needs a new token; `gray-750` would give 2.38:1 with 4.74:1 for the label. Out of scope for a component override. |
| Q5 | **Interactive tracks still miss WCAG 1.4.11.** With `--border` (R124): light 1.88:1 track-vs-card; dark fill-vs-track 2.93:1. | No neutral in the theme clears 3:1 on *both* counts (`border.strong` inverts the fill to 1.63:1 in dark). Needs a dedicated track token. |
| Q6 | **Toast** (R117–R122) has no `tc-toast`. The surface reading is derived from `toast.css:47,57` + `tc-alert` + `tc-card`. | Needs owner sign-off before 16 agents build on it. |
| Q7 | **Content-popover radius 16px vs 8px** (R98). | Derived from `card.css:46` + `modal.css:76`; the competing reading is "every floating panel is 8px like the dropdown". Sign-off wanted. |
| Q8 | **Components with no Tzu Chi counterpart at all** — Calendar/RangeCalendar/CalendarYearPicker, Table, Kbd, InputOTP, ColorArea/ColorSlider/ColorSwatch(Picker), EmptyState, ScrollShadow, Toolbar, Typography, Avatar(Group). | Every rule for them here is marked **NO EVIDENCE — derive**. They will be internally consistent with this spec but are not traceable to a Figma decision. |
| Q9 | **Meter** is structurally identical to ProgressBar — `README.md:136` says the same override applies with the class prefix swapped. Confirm before duplicating by hand. | |

---

## 13. Checklist before you ship an override file

1. Every rule (and every comma branch, and every nested `&`) is under `[data-theme^="tzuchi"]`.
2. `grep` your file for `--tc-color-`, `#`, `rgb(`, `hsl(`, `oklch(`, `!important`, ` left`, ` right` — all must be clean.
3. Every `--tc-*` you used exists in `packages/tokens/dist/tokens.css` and carries a fallback.
4. Every colour is a HeroUI theme variable or a `--tzuchi-*`. If you need a new `--tzuchi-*`, say so — you cannot add it yourself.
5. You hand-derived the specificity of every declaration against the base rule it must beat, **including** breakpoint variants (`sm:`/`md:`), `:has()` compounds and per-size rules.
6. You did not set `transition-property` or `animation-name` (R136), or you restated both reduced-motion guards (R137).
7. No HeroUI variant, size or state is hidden or flattened — list each one and say what it now looks like.
8. Header comment records: variant mapping (tc ↔ HeroUI), what changed, what was kept and why, and the cascade notes.
9. Nothing in §10 was touched.

---

## 14. Fact-check log

An adversarial pass verified every rule class in this document against the live sources
(`heroui/styles/themes/tzuchi/components/*.css`, `heroui/styles/themes/tzuchi/variables.css`,
`heroui/styles/themes/default/variables.css`, `heroui/styles/shared/theme.css`,
`heroui/styles/components/*.css` for "Replaces" claims, `packages/tokens/dist/tokens.css`,
`packages/tokens/src/component/*.tokens.json`'s Lit `tc-*.styles.ts` sources, and
`gap-audit/README.md` / `gap-audit/neutral-token-impact.md`). Method and result for each check
class:

1. **Foundational token block (§0 "Token values you will use")** — every `--tc-space-*`,
   `--tc-radius-*`, `--tc-size-*`, `--tc-font-size-*`, `--tc-font-weight-*`, `--tc-line-height-*`,
   `--tc-typography-*`, `--tc-motion-*`, `--tc-focus-ring-*`, `--tc-opacity-disabled` was grepped
   directly out of `packages/tokens/dist/tokens.css`. **All values matched exactly**, including the
   `--tc-typography-*` shorthand strings' weight/size/line-height/family. **No correction.**
2. **Mode-independence (N3)** — confirmed by isolating both `tokens.css` dark blocks
   (`[data-theme="dark"]` at line 410 and `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) }`
   at line 435) and grepping them for every mode-independent family: none appear. Only
   `--tc-color-*` and `--tc-elevation-*` are redefined there, confirming N2's warning is real (spot
   checked `--tc-elevation-2`: `#0000001a` light → `#00000066` under the dark block, and
   `--tc-switch-thumb-bg`/`--tc-card-elevation`/`--tc-modal-shadow`/`--tc-tooltip-shadow` exist as
   exactly the colour/shadow-valued `--tc-<component>-*` traps N2 describes — the spec never
   prescribes any of them). **No correction.**
3. **The `--tzuchi-modal-shadow` dark-mode gap (I4)** — read `themes/tzuchi/variables.css` in full:
   `--tzuchi-modal-shadow` is declared only inside `[data-theme="tzuchi"]` (line 68), the
   `[data-theme="tzuchi-dark"]` block (71–113) does not redeclare it or `--overlay-shadow`, and
   `themes/default/variables.css`'s `[data-theme$="-dark"]` block (which does match `tzuchi-dark`)
   sets `--overlay-shadow: 0 0 1px 0 rgba(255,255,255,.3) inset` (line 260) — the inset hairline the
   spec describes. `modal.css`'s own header comment independently states the identical reasoning.
   **Confirmed accurate, no correction.**
4. **WCAG contrast figures (§5 tint ladder, §7.2 track table, the fill-vs-track ratios in R123/R124)**
   — recomputed all fourteen pairs from the raw hex primitives (`--tc-color-blue-900/300/100`,
   `--tc-color-gray-50/100/300/700/750/900/950/980`, resolving `--accent`, `--accent-soft`,
   `--default`, `--border`, `border.strong` per `themes/tzuchi/variables.css`) with an independent
   WCAG relative-luminance script. Every figure — `1.16/1.27`, `1.12/1.35`, `1.05/1.43`,
   `1.88/3.20`, `1.77/3.40`, `3.84/5.76`, `3.62/6.12`, `11.58/7.42`, `11.29/11.29`,
   `12.00/6.97`, `7.15/2.93`, `3.50/1.63` — matched the document to the stated two decimal places.
   **No correction.**
5. **CSS override citations** — for every rule sampled across button, select, input, textarea,
   search-field, card, checkbox, radio, switch, alert, modal, dropdown, spinner-adjacent and
   toast(base) files, the cited line range was opened and diffed against the declaration and
   evidence the rule claims (e.g. `button.css:79–118`, `button.css:329–372`, `select.css:108–139`,
   `select.css:202–226`, `select.css:279–302`, `input.css:55–81`, `search-field.css:107–143`,
   `card.css:44–72`, `checkbox.css:125–142`, `radio.css:155–167`, `switch.css:115–132`,
   `alert.css:55–135`, `modal.css:60–129`, `dropdown.css:137–160`). **Every citation's line numbers
   and quoted content matched the file exactly.** No correction.
6. **"Replaces (HeroUI)" column** — spot-checked against the un-themed base CSS
   (`heroui/styles/components/*.css`): button `rounded-3xl` (button.css:5), dropdown/select popover
   `min(32px, var(--radius-3xl))` (dropdown.css:53, select.css:185), tooltip
   `min(32px, var(--radius-xl))` (tooltip.css:6), toast `min(32px, var(--radius-3xl))` at
   `toast.css:47` and `bg-surface … shadow-overlay` at `toast.css:57` (confirming the §6(d) Toast
   DECISION's textual claim). **All matched. No correction.**
7. **Derived calc() arithmetic** (R40–R61 heights) — re-derived every formula by hand, including
   the ones that looked off at first pass (chip/tag §3.5 R61: 20px/1.5 line box = 30px + 2×4px
   padding-block + the rule's own `border: 1px solid transparent` × 2 = 40px for `md`, 34px for
   `sm`, 48px for `lg` — the border contribution is easy to miss but is exactly what the rule text
   flags). Every resolved px figure in §2–§3 checked out. **No correction.**
8. **"NO EVIDENCE" honesty (R6, R7, R9, R10, R21, R37, R126, R145, Q8)** — confirmed for R6/R7 that
   `checkbox.css`, `radio.css`, `switch.css` only ever apply a `padding-inline-start` re-indent to
   `[data-slot="description"]`/`[data-slot="field-error"]` (exact lines 136–142, 163–167, 128–132)
   and never a font-size declaration reaching that slot, so "no override precedent" is truthful, not
   a hedge hiding a real one. **No correction.**
9. **Rule-numbering integrity** — every `R1`…`R154` appears exactly once as a table-row definition,
   with no gaps or duplicates (mechanically verified). **Rule count: 154. No correction.**
10. **Cross-rule contradictions** — checked the roles most likely to collide (R79/R81/R82/R83/R84
    "selected" family; R72/R73 ring-offset family; I1–I10 in §11). Each applies to a distinct,
    named role or is already listed — not silently applied — as an unresolved inconsistency in §11
    rather than presented as settled. **No contradiction found that the document does not already
    disclose.**

**Net result: zero factual corrections were required.** The document's own citations, recomputed
figures and "no evidence" disclaimers all held up against the live sources. This log exists so the
16 implementing agents (and the owner) know the spec was adversarially checked, not merely
authored — not because anything was found broken.

---

## 13. Amendments from passes 4–5 (2026-09-20)

Passes 4–5 were a completeness sweep (every story × both themes, flagging sub-16px text, off-ladder
radii and low-contrast text) and a screenshot-based visual QA of all ten component families
(1,523 screenshots incl. keyboard focus, hover, open, invalid and disabled states). The owner
delegated the design calls below to the integrator; each follows the design of a same-name Tzu Chi
component where one exists. **Where an amendment contradicts an earlier rule, the amendment wins.**

### 13.1 New rules

| # | Rule | Declaration / value | Evidence | Supersedes |
|---|---|---|---|---|
| A1 | **Text on a FILL never uses `--muted`** — it uses that fill's own foreground; hierarchy is carried by weight. On a plain surface / page `--muted` stays. | tinted option panels → `--accent-soft-foreground`; `--surface-secondary` table header band → `--foreground`; `--default` segmented-tabs track → `--default-foreground`; Kbd on `--default` → `--default-foreground` | tc-dropdown option text on `brand.surface` is `brand.primary`; tc-search-bar's category label on `surface.subtle` is `text.default` — no tc component puts muted text on a fill. Measured before: 3.31:1 on the tinted panel, 2.86:1 on its hover fill, 3.34:1 on the table header | — |
| A2 | **Edge-to-edge rows draw their focus ring INSIDE the row** | `--tw-ring-inset: inset; --tw-ring-offset-width: 0px` on the row's focus-visible state (2px `--focus`) | an outset ring on a full-bleed row is clipped left and right by the popover's overflow, leaving two horizontal lines | R71 inside the tinted popovers (no offset → nothing to colour) |
| A3 | **Every field shell focuses the Tzu Chi way**: focus border colour + a 3px halo; invalid + focused = 3px `--danger` halo | override ONLY the ring layer: `--tw-ring-shadow: 0 0 0 3px var(--accent-soft-hover)` (never re-declare `box-shadow` — it would drop Tailwind's other shadow layers) | tc-input / tc-textarea / tc-search-bar / tc-dropdown all specify `border-color: border.focus` + `box-shadow: 0 0 0 3px brand.surface-hover`. The focused border (blue-500, 3.96:1) is the WCAG 1.4.11 indicator; the halo is emphasis | §11 I1, R74; closes §12 Q2 |
| A4 | **Interactive track (Slider)** resolves per mode | `--tzuchi-slider-track-bg`: light = `color.border.strong` (3.62:1 on the page, fill 3.54:1 against it), dark = `--border` (3.4:1 on the page, fill 2.93:1). No single token works in both: border.strong in dark leaves the fill 1.63:1 | tc-switch's off-track is `color.border.strong` — the one Tzu Chi control whose track the user must find | R124; closes §12 Q5 for light |
| A5 | **Thumbs / handles are a constant white in every state and both modes** (Switch, Slider); only the wrapper's opacity says "disabled" | `background-color: var(--white)` | tc-switch.styles.ts:29-38 — "a constant white reads on both track colours" | R125's "thumb keeps HeroUI's fill" |
| A6 | **Option-row inset follows the text it lines up with** | bare ListBox / Menu rows and headers: `20px` (the field inset). Inside a popover the rows align with their trigger's text: Select / Autocomplete / Dropdown `32px` (tc-dropdown), ComboBox `20px` (its query is typed in an Input shell). Row descriptions get `overflow-wrap: anywhere` | a bare ListBox is width-constrained by its consumer: 32px clipped descriptions mid-glyph and wrapped every row | R57's single 32px value |
| A7 | **Option-row state fills**: bare rows hover `--accent-soft`, pressed / selected `--accent-soft-hover`; inside the tinted panels hover / cursor / selected all take `--accent-soft-hover` (tc-dropdown does exactly this) and are told apart by the inset ring (cursor) and the selection mark (selected), which takes `--accent-soft-foreground` | — | tc-dropdown.styles.ts `.option:hover`, `.option.active`, `[aria-selected]` share one fill | — |
| A8 | **Table rows**: hover is NEUTRAL (`--default`); selected = `--accent-soft`; selected + hovered = `--accent-soft-hover` | — | in dark the brand tints are opaque navy: hovering recoloured every row and swallowed the row-action buttons' fills | R78 / R82 for tables only |
| A9 | **Today** in both calendars carries an inset 1px `--accent` ring in addition to its fill | — | the range band and today were both `--accent-soft` 4px rectangles; today vanished inside a range | — |
| A10 | **Pending ≠ disabled**: a pending Button keeps `opacity: 1` (the spinner says "working"); a disabled one still dims | `[data-pending="true"]:not([data-disabled="true"])` | tc `opacity.disabled` is 0.38 (HeroUI 0.5): a pending label fell to ~2.3:1 in dark and read as broken | — |
| A11 | **A disabled field dims its Description too** | `opacity: var(--disabled-opacity)` keyed off the disabled field / group root, excluding hosts HeroUI already dims (no double-dimming) | at 0.38 the label and control faded while the hint stayed full strength — the hierarchy inverted | — |
| A12 | **Affix dividers** (InputGroup): span the shell's full inner height, follow the shell's border colour on focus / invalid, disappear in the column (textarea) layout, and the value keeps an 8px gutter on the side facing an affix | `align-self: stretch; block-size: auto` (stretch alone is inert against the base's `h-full`) | upstream's divider is transparent (`--field-border`), so none of this showed there | — |
| A13 | **Status foregrounds in dark are neutral**, not brand ink | `--danger-foreground` / `--success-foreground` / `--warning-foreground` = gray-980 (7.8:1 / 7.9:1 / 10.9:1) — dark only, in `generate.mjs` `DARK_EXTRA` | text.on-brand is blue-900 in dark: a destructive button read navy-on-salmon | — |
| A14 | **No text below 16px remains** except: Badge's indicator count (10–14px — it is a 16–20px dot), Typography's explicit `xs` size, and text a STORY sizes with its own utility classes | calendar weekday headers and list section headers went 12px → 16px | `--tc-font-size-16` is the smallest step in tokens.css | R8's "KEEP 12px" |

### 13.2 Questions now closed

| Q | Outcome |
|---|---|
| Q1 checkbox / radio 24px vs 32px | **32px stays.** tc-checkbox / tc-radio read `var(--tc-checkbox-size, 24px)` and the token resolves to 32px, so the shipped Lit components already render at 32px; 24px is an unused fallback. (Still worth a glance from design: 32px is heavy inside a Table.) |
| Q2 field focus halo vs ring | A3 — halo, everywhere. |
| Q3 `--tzuchi-modal-shadow` absent in dark | Intentional (`DARK_OMIT`); modal.css's comment corrected. |
| Q4 dark segmented-tabs pill | `--segment: gray-800` in dark (1.54:1 vs the track). Residual: a HOVERED segmented tab is `--default-hover`, also gray-800 in dark, so hover and selected differ only by the pill's weight — acceptable for a HeroUI-only variant. |
| Q5 interactive track contrast | A4 — clears 3:1 against every surface in both modes; dark fill-vs-track 2.93:1 remains. |
| Q9 Meter ≡ ProgressBar | Confirmed by diffing the two base files; meter.css mirrors progress-bar.css. |

### 13.3 Known limits (not fixable in CSS — document for consumers)

- **Virtualized lists must be given the themed row height.** `ListLayout`'s `rowHeight` is a JS number the consumer passes: under this theme a label-only row is **40px**, label + description **66px**, **92px** if the description wraps (HeroUI: 36 / 48). The upstream stories pin `rowHeight: 50`, so their two-line rows overlap under the Tzu Chi theme. Use `estimatedRowHeight`, or pass the values above.
- **Tzu Chi's larger type needs more room**: tables want ~25% more column width than HeroUI's defaults; a horizontal RadioGroup with descriptions ~1.3×; chip rows should be allowed to wrap (`flex-wrap`) — the 20px `md` chip is ~40% wider than HeroUI's.
- **Custom Radio indicators**: the Tzu Chi radio is ring + dot on a field-coloured control (tc-radio), not HeroUI's accent-filled disc. A custom `Radio.Indicator` glyph must use `text-accent`, not a knocked-out `text-background`.
- **No EmptyState story exists** in the vendored Storybook, so `empty-state.css` has never been rendered on its own.

### 13.4 Still open — token-level, for the design owner

These are properties of `@tzuchi/tokens` itself (the Lit components share them); no component override can or should fix them.

| Issue | Measured | One-line fix |
|---|---|---|
| `color.text.muted` (gray.700 `#828282`) — every description, placeholder, date segment, weekday header, readout in the LIGHT theme | 3.84:1 on white, 3.62:1 on the page (~950 occurrences in the sweep) — AA needs 4.5:1 | → gray.750 `#6B6B6E`: 5.30 / 4.99 / 4.74 / 4.61:1 on white / page / neutral fill / header band |
| dark: `brand.primary` (blue-300) on `brand.surface-hover` (blue-700) — hovered / selected option rows, pressed tonal button, open Select | 3.96:1 for 16px / 700 text | a darker dark `surface-hover` step |
| `feedback.error` (red-500) as TEXT on light surfaces; white on `feedback.error` / `feedback.success` fills | 4.06–4.32:1; 4.32 / 4.37:1 | a text-strength red; darker fills |
| dark `surface.default` (gray-950) vs the page `surface.subtle` (gray-980) | 1.06:1 — cards, tags and popovers barely separate from the page; HeroUI's own dark keeps a 21% vs 12% lightness step | lift the dark surface one step |
| Modal / Drawer / AlertDialog title = field label (both 16px / 700, per tc-modal and tc-input) | the dialog title does not outrank the labels inside it | a larger title step (tc `typography.title`, 20px) |
