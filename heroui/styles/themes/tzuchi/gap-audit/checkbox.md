# checkbox — Tzu Chi ↔ HeroUI gap report

- **Tzu Chi**: `tc-checkbox` — `packages/components/src/checkbox/tc-checkbox.styles.ts`, `tc-checkbox.ts`, tokens `packages/tokens/src/component/checkbox.tokens.json`
- **HeroUI**: `heroui/styles/components/checkbox.css`, `heroui/react/src/components/checkbox/checkbox.tsx`, `heroui/styles/src/components/checkbox/checkbox.styles.ts`
- **Override written to**: `scratchpad/atoms/css/checkbox.css` → destination `heroui/styles/themes/tzuchi/components/checkbox.css`
- **Closeness**: major gaps. The control is 2× the size, half the corner radius, twice the border width, a different unselected border colour, and the label is a different size *and* weight. Colour semantics, on the other hand, already line up 1:1 with the generated theme.

## Variant mapping

| tc | HeroUI | note |
|---|---|---|
| `tc-checkbox` (no variants) | `.checkbox--primary` (default variant) | full mapping |
| — | `.checkbox--secondary` | no tc equivalent (grey `--default` control fill). Left with its own colour treatment; inherits every shape/density/type/motion change. `--default` is one of the variables `themes/tzuchi/variables.css` deliberately does not map (see its header), so it stays HeroUI grey in both modes. |
| `checked` | `[data-selected]` / `[aria-checked="true"]` | |
| `indeterminate` | `[data-indeterminate]` | |
| `disabled` | `[data-disabled]` | |
| `required` (`:invalid` via ElementInternals, no styling) | `[data-invalid]` / `[aria-invalid]` → `status-invalid-field` | HeroUI has a real invalid *look*; tc has none. Kept. |
| — | pressed (`[data-pressed]`), pending | no tc equivalent; kept (HeroUI's pressed rule is empty anyway) |

## Resolved-value reference

Under `data-theme="tzuchi"` the theme sets `--radius: var(--tc-radius-md)` = **8px**, so HeroUI's radius scale resolves `--radius-md` = `calc(8px * .75)` = **6px**, `--radius-sm` = 4px, `--radius-lg` = 8px. `--field-border-width` = **1px** (upstream default is 0px). `--field-shadow` = `0 0 0 0 transparent`. `--disabled-opacity` = 0.38. `--ring-offset-width` = 2px.

## Gap table

| property | Tzu Chi (file:line → resolved) | HeroUI (file:line → resolved) | action |
|---|---|---|---|
| **control size** | `tc-checkbox.styles.ts:20-21` `--tc-checkbox-size` → `--tc-size-icon-md` = **32 × 32px** (`tokens.css:54,167`; the `24px` inline fallback in the Lit file is stale — the built token wins) | `checkbox.css:85` `size-4` = **16 × 16px** | **changed** → `inline-size`/`block-size: var(--tc-checkbox-size, var(--tc-size-icon-md, 32px))` |
| **control radius** | `tc-checkbox.styles.ts:24` `--tc-checkbox-radius` → `--tc-radius-sm` = **4px** (`tokens.css:49,168`) | `checkbox.css:85` `rounded-md` = `--radius-md` = **6px** under tzuchi | **changed** → 4px |
| **fill (`::before`) radius** | n/a (tc fills the control's own background) | `checkbox.css:101` `rounded-md` = 6px | **changed** → `calc(4px − 2px)` = 2px, the inner radius behind a 2px border |
| **border width** | `tc-checkbox.styles.ts:25` `2px` (literal; no token) | `checkbox.css:85` `[border-width:var(--border-width-field)]` → `--field-border-width` = **1px** (`themes/tzuchi/variables.css:21`) | **changed** → `2px`. Scoped to the checkbox, not raised theme-wide, so inputs/textarea/select keep 1px. |
| **border style** | solid | solid (Tailwind preflight) | kept — identical |
| **border colour, unselected** | `tc-checkbox.styles.ts:25` `--tc-checkbox-border` → `color.border.strong` → light `#828282` (gray-700), dark `#95969b` (gray-500) (`tokens.css:124,269,424`) | `checkbox.css:85` `border-field-border` → `--field-border` → light `#bdbdbd` (gray-300), dark `#6b6b6e` (gray-750) | **changed** → `var(--tzuchi-checkbox-border, var(--muted))`. tc-input / tc-textarea / tc-dropdown all use `border.default`; only the checkbox (and tc-radio, `--tc-radio-ring`) uses `border.strong`, so this is a deliberate selection-control decision, not a global field change. `--muted` is an exact match in light (`#828282`) and close in dark (`#b3b3b3` vs `#95969b`) — hence the extra theme var to make dark exact. |
| **border colour, hover (unselected)** | `tc-checkbox.styles.ts:80-82` `--tc-checkbox-border-checked` → `brand.primary` → light `#1b2d58`, dark `#a9c2ea` | `checkbox.css:126` `border-field-border-hover` → `--field-border-hover` → light `#4f7bbe` (blue-500), dark `#a9c2ea` (blue-300) | **changed** → `var(--accent)`. Exact in both modes (light `#1b2d58`, dark `#a9c2ea`). |
| **border colour, selected / indeterminate** | `tc-checkbox.styles.ts:57,67` `brand.primary` = same as the fill | `checkbox.css:143,180` `border-transparent` (+ `bg-accent` on `::before`) | **changed** → `var(--accent)`. `::before` is `inset-0`, i.e. the *padding* box, so a transparent border lets `--field-background` show through; invisible at 1px, a clear 2px ring at the new width. |
| **border colour, invalid + selected/indeterminate** | n/a | `checkbox.css:180,191` `border-transparent` + `bg-danger` | **changed** → `var(--danger)`, same reason |
| **control background, unselected** | `tc-checkbox.styles.ts:26` `--tc-checkbox-bg` → `surface.default` → light `#ffffff`, dark `#1c1c1e` | `checkbox.css:85` `bg-field` → `--field-background` → light `#ffffff`, dark `#1c1c1e` | kept — already identical under the generated theme |
| **fill colour, selected / indeterminate** | `tc-checkbox.styles.ts:58,68` `brand.primary` → light `#1b2d58`, dark `#a9c2ea` | `checkbox.css:101,152` `bg-accent` → `--accent` → light `#1b2d58`, dark `#a9c2ea` | kept — identical |
| **fill colour, hover** | tc does not change the checked fill on hover | `checkbox.css:129` `bg-accent-hover` → light `#30559f` (blue-700), dark `#c2d4f2` (blue-250) | kept — HeroUI state tc does not have; the values it lands on are `brand.primary-hover`, so it is on-brand |
| **checkmark / dash colour** | `tc-checkbox.styles.ts:43` `--tc-checkbox-check` → `text.on-brand` → light `#ffffff`, dark `#1b2d58` | `checkbox.css:44` `text-accent-foreground` → `--accent-foreground` → light `#ffffff`, dark `#1b2d58` | kept — identical |
| **checkmark colour, invalid** | n/a | `checkbox.css:61,76` `text-danger-foreground` | kept |
| **indicator container size** | `tc-checkbox.styles.ts:35-39` `position:absolute; inset:0; 100%` → the padding box = **28 × 28px** | `checkbox.css:199` `size-3` = **12px** (75 % of the 16px control) | **changed** → `75% / 75%` = 21px of the 28px content box. Percentage rather than a fixed px so the per-story control sizes in *Full Rounded* (12/16/20/24px) and *Features And Add Ons* (20px) stay proportional instead of being clipped by `overflow:hidden`. |
| **checkmark SVG size / stroke** | viewBox `0 0 24 24` at 28px → scale 1.1667; glyph `M5 12.5 10 17.5 19 7` = **16.33 × 12.25px**, `stroke-width:2.5` → **2.92px** | `checkbox.css:44` `size-2.5` = 10px, `stroke-[2.5px]`, viewBox `0 0 17 18` → scale 0.556; glyph **7.8 × 5.6px**, stroke **1.39px** | **changed** → `100%` of the indicator = 21px → scale 21/18 = 1.1667, glyph **16.33 × 11.67px**, stroke **2.92px**. Width and stroke match tc exactly; height is 0.6px shorter because HeroUI's polyline is 10 units tall against tc's 10.5. |
| **indeterminate SVG size / stroke** | `tc-checkbox.ts:151` dash `M6 12 H18` = 12u at 1.1667 → **14px long**, stroke **2.92px** | `checkbox.css:67` `size-3` = 12px; `checkbox.tsx:158` line 18u, `strokeWidth 3` → **9px long**, stroke **1.5px** | **changed** → `100%` = 21px → line **15.75px**, stroke **2.63px**. Not exact (1.75px longer, 0.3px thinner than tc); kept as one proportional rule rather than a magic viewBox number. |
| **custom indicator children** | n/a | `checkbox.css:202` `.checkbox__indicator svg { size-full }` | kept — automatically tracks the new 21px indicator (*With Custom Indicator*, *Full Rounded*) |
| **control ↔ label gap** | `tc-checkbox.styles.ts:7` `--tc-space-8` = **8px** | `checkbox.css:230` `gap-3` = **12px** | **changed** → `var(--tc-space-8, 8px)` |
| **label font family** | `--tc-typography-body` → `'Noto Sans TC', system-ui, …` | inherits `--font-sans`, which `themes/tzuchi/variables.css:25` already sets to `--tc-font-family-base` | kept — already identical |
| **label font size** | `tc-checkbox.styles.ts:91` `--tc-typography-body` = **16px** (`tokens.css:139`) | `checkbox.css:230` `text-sm` = **14px** | **changed** → `var(--tc-font-size-16, 16px)` |
| **label font weight** | `--tc-typography-body` = **400** | `checkbox.css:230` `font-medium` = **500** | **changed** → `var(--tc-font-weight-regular, 400)` |
| **label line height** | `--tc-typography-body` = **1.6** (25.6px at 16px) | `checkbox.css:230` `text-sm` → **1.25rem = 20px** | **changed** → `var(--tc-line-height-relaxed, 1.6)` |
| **label colour** | `tc-checkbox.styles.ts:92` `--tc-checkbox-label` → `text.default` → light `#333333`, dark `#f2f2f2` | `checkbox.css:230` `text-foreground` → `--foreground` → light `#333333`, dark `#f2f2f2` | kept — identical |
| **description / field-error** | n/a (tc has no description slot) | `checkbox.css:13` `ps-7` = 28px, `text-xs` = 12px, `text-muted` | **changed indent only** → `calc(control + gap)` = **40px**, since the 28px was `16 + 12`. Size and colour kept — no tc decision to copy. |
| **root gap (content ↔ description)** | n/a | `checkbox.css:6` `gap-1` = 4px | kept |
| **focus ring width** | `tc-checkbox.styles.ts:86` `--tc-focus-ring-width` = **2px** | `utilities/index.css:3` `ring-2` = **2px** | kept — identical |
| **focus ring colour** | `--tc-checkbox-focus-ring-color` → `focus-ring.color` → light `#4f7bbe` (blue-500), dark `#a9c2ea` (blue-300) | `--focus` → `themes/tzuchi/variables.css:45,80` light `#4f7bbe`, dark `#a9c2ea` | kept — identical |
| **focus ring offset** | `0` — a plain `box-shadow` flush against the border box | `utilities/index.css:5` `--tw-ring-offset-width: var(--ring-offset-width)` = **2px** in `--background` (`themes/tzuchi/variables.css:24` ← `--tc-focus-ring-offset`) | **kept — reason**: the Tzu Chi theme itself declares a 2px ring offset as the system-wide default; the Lit checkbox's flush shadow is a component-local deviation. Matching the theme keeps the focus treatment uniform across every HeroUI control. Flag for the token owners if the flush ring is the real Figma decision. |
| **disabled opacity** | `tc-checkbox.styles.ts:14` `--tc-checkbox-disabled-opacity` → `opacity.disabled` = **0.38** | `utilities/index.css:62` `--disabled-opacity` = **0.38** (`themes/tzuchi/variables.css:23`) | kept — identical |
| **disabled cursor** | `tc-checkbox.styles.ts:13` `not-allowed` | `utilities/index.css:63` `--cursor-disabled` = `not-allowed` | kept — identical |
| **interactive cursor** | `tc-checkbox.styles.ts:8` `pointer` | `checkbox.css:8,97` `--cursor-interactive` = `pointer` | kept — identical |
| **elevation / shadow** | none | `checkbox.css:85` `shadow-field` → `--field-shadow` = `0 0 0 0 transparent` (`themes/tzuchi/variables.css:22`) | kept — the theme already flattens it; `.checkbox--secondary` additionally forces `shadow-none` |
| **transition duration** | `tc-checkbox.styles.ts:28-30` `--tc-motion-duration-fast` = **150ms** | `checkbox.css:92-94` **200ms** (border/background), 100ms (transform) | **changed** → `transition-duration` longhand on the control and `::before` |
| **transition easing** | `--tc-motion-easing-standard` = `cubic-bezier(0.2, 0, 0, 1)` | `--ease-out` = `cubic-bezier(0, 0, 0.2, 1)` (control), `linear` (`::before` scale/opacity) | **changed** → `transition-timing-function` longhand |
| **reduced motion** | `tc-checkbox.styles.ts:110-115` `transition: none` | `checkbox.css:95,111` `motion-reduce:transition-none` | kept — deliberately overrode only the *duration/timing* longhands, so HeroUI's `transition-property: none` under `prefers-reduced-motion` still wins despite the override's higher specificity |
| **checkmark draw animation** | tc fades `opacity` only | `checkbox.css:53` `stroke-dashoffset 150ms linear 15ms` + `strokeDasharray` in `checkbox.tsx:167-168` | kept — a HeroUI nicety with no tc counterpart, and it already runs at tc's 150ms |
| **invalid, unselected** | n/a | `utilities/index.css:14-29` `outline-1 outline-danger`, focused → `ring-2 ring-danger` | kept |
| **checkbox-group spacing** | n/a | `checkbox-group.css:5` `mt-4` per item | kept — out of scope for this component |

## Notes / things not transferable

1. **`.checkbox--secondary`** has no tc counterpart. It gets the tc shape but keeps HeroUI's `--default` grey fill, which `themes/tzuchi/variables.css` intentionally leaves unmapped.
2. **Description / FieldError** (`text-xs`, `text-muted`) and the **invalid** treatment are HeroUI-only surfaces — tc-checkbox is label-only and has no visual invalid state. Only the description's indent was re-derived.
3. **Focus offset** is the one place the override knowingly diverges from the Lit component (see the table row).
4. **`aria-checked="mixed"`** — tc reflects `aria-checked="mixed"` for indeterminate while HeroUI/React-Aria uses `data-indeterminate`. Both are covered; no styling depends on `mixed`.
5. The Lit file's inline fallbacks (`24px` size, `#bdbdbd` border) are **stale** relative to the built tokens; the override follows `tokens.css`, which is what actually renders.

## Assertion note

`getComputedStyle().height` resolves to the **content** box, so a 32px border-box control with a 2px border reports `28px`. That is the value the assertion expects — it is not a miss.
