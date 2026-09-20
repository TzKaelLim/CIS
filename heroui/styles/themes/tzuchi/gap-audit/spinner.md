# Spinner — Tzu Chi ↔ HeroUI gap inventory

**Component**: `tc-spinner` ↔ HeroUI `spinner`
**Override file**: `/private/tmp/claude-501/-Users-kaellim-Desktop-Personal-CISwebsite/1c74be25-055e-47fb-a92f-f47cfe608bb0/scratchpad/atoms/css/spinner.css`
**Destination**: `heroui/styles/themes/tzuchi/components/spinner.css`
**Closeness**: minor gaps — the colour is already an exact match; only the size scale, the missing track ring and a 50 ms duration differ.

## Sources read

| Side | Files |
|---|---|
| Tzu Chi | `CISwebsite/packages/components/src/spinner/tc-spinner.ts`, `tc-spinner.styles.ts`, `CISwebsite/packages/tokens/src/component/spinner.tokens.json`, `CISwebsite-heroui-spike/packages/tokens/dist/tokens.css` |
| HeroUI | `heroui/styles/components/spinner.css`, `heroui/styles/src/components/spinner/spinner.styles.ts`, `heroui/react/src/components/spinner/spinner.tsx`, `spinner.stories.tsx`, `heroui/styles/themes/shared/theme.css`, `heroui/styles/themes/default/variables.css`, `heroui/styles/themes/tzuchi/variables.css`, `heroui/styles/components/toast.css`, `heroui/styles/components/button.css` |

## Structural note — the two marks are built differently

| | Tzu Chi | HeroUI |
|---|---|---|
| Markup | `<svg viewBox="0 0 50 50">` + two **stroked** `<circle r="20">` — `.track` (full ring) and `.indicator` (dashed arc) — `tc-spinner.ts:41-44` | `<span class="spinner">` + `<svg viewBox="0 0 24 24">` with two **gradient-filled** `<path>`s, `spinner.tsx:23-59` |
| Rotation | on the `<svg>`, `animation: tc-spinner-spin …` (`tc-spinner.styles.ts:16`) | on the root `<span>`, `animate-spin-fast` (`spinner.css:3`) |
| Arc shape | constant 4-unit stroke, `stroke-linecap: round`, `stroke-dasharray: 90 150` → 71.6 % of the ring drawn, 28.4 % gap (`tc-spinner.styles.ts:42-44`) | full ring, opacity tailing 1.0 → 0.55 and 0 → 0.55 via two `linearGradient`s (`spinner.tsx:26-45`) |

Because HeroUI's ring is *filled path geometry*, its thickness, caps and sweep are not reachable from CSS. Everything in the "not transferable" rows below follows from that.

## Gap table

| Property | Tzu Chi (file:line → resolved) | HeroUI (file:line → resolved) | Action |
|---|---|---|---|
| **Size — sm** | `tc-spinner.styles.ts:19-22` → `--tc-spinner-size-sm` = `--tc-size-icon-sm` = **20px** (`tokens.css:206`, `:53`) | `spinner.css:7-9` `size-4` = `calc(0.25rem*4)` = **16px** (`--spacing: 0.25rem`, `themes/default/variables.css:18`) | **Changed** → `var(--tc-spinner-size-sm, 20px)` |
| **Size — md (default)** | `tc-spinner.styles.ts:13-14, 24-27` → `--tc-spinner-size-md` = `--tc-size-icon-md` = **32px** (`tokens.css:207`, `:54`) | `spinner.css:3` `size-6` = **24px**; `.spinner--md` has no declarations (`spinner.css:11-13`) | **Changed** → set on the root `.spinner` class (since `--md` carries nothing), `var(--tc-spinner-size-md, 32px)` |
| **Size — lg** | `tc-spinner.styles.ts:29-32` → `--tc-spinner-size-lg` = `--tc-size-icon-lg` = **40px** (`tokens.css:208`, `:55`) | `spinner.css:15-17` `size-8` = **32px** | **Changed** → `var(--tc-spinner-size-lg, 40px)` |
| **Size — xl** | no counterpart (tc has sm/md/lg only) | `spinner.css:19-21` `size-10` = **40px** | **Changed** → `calc(var(--tc-spinner-size-lg,40px) + var(--tc-space-8,8px))` = **48px**. Required: tc's `lg` already claims 40px, so leaving `xl` at 40px would collapse two HeroUI size variants into one. |
| **Toast indicator size** | n/a | `toast.css:198-200` pins `[data-slot="spinner"]` to `size-4` = **16px** (matching `[data-slot="toast-default-icon"]`, `toast.css:194-196`); `toast.tsx:858` renders `<Spinner color="current" size="sm" />` | **Guard added** — `.toast__indicator .spinner` restated at 1rem. Upstream's rule is `(0,2,0)` and this file is later in the same layer, so without it the toast's 16px indicator would have become 20px and desynced from its sibling icons. |
| **Track ring — presence** | `tc-spinner.ts:42` + `tc-spinner.styles.ts:34-37` — a full `.track` circle behind the arc | none | **Changed** — painted as `radial-gradient(circle closest-side, …)` on the root span. Stops 63 %→87 % of the half-box map onto HeroUI's own arc radii (r 7.5→10.5 of a 24-unit viewBox about (12,12) = 62.5 %→87.5 %), so track and arc read as one ring. Radially symmetric ⇒ the span's rotation does not disturb it. |
| **Track ring — colour** | `tc-spinner.styles.ts:35` → `--tc-spinner-track-color` = `color.border.default` = **#bdbdbd** light / **#6b6b6e** dark (`tokens.css:374`, `:123`, dark `:423`) | n/a | **Changed** → `var(--border)`. The Tzu Chi theme maps `--border` to `--tc-color-gray-300` (#bdbdbd) light and `--tc-color-gray-750` (#6b6b6e) dark (`themes/tzuchi/variables.css:43`, `:78`) — the identical primitives, resolved per mode. `--tc-spinner-track-color` itself is **forbidden**: it is declared only in `:root` and flips via `[data-theme="dark"]`, which `tzuchi-dark` never matches. |
| **Track ring — `current` variant** | n/a | `spinner.css:24-26` `color: inherit`; used by `button.stories.tsx:112` and `toast.tsx:858` on filled surfaces | **Changed** → `--spinner-track: color-mix(in oklab, currentColor 20%, transparent)`. A neutral grey track on an accent-filled button would be wrong; deriving it from the inherited colour keeps every surface coherent and stays mode-independent by construction. |
| **Indicator colour — default** | `tc-spinner.styles.ts:40` → `--tc-spinner-color` = `color.brand.primary` = **#1b2d58** light / **#a9c2ea** dark (`tokens.css:373`, `:113`, dark `:413`) | `spinner.css:28-30` `.spinner--accent { color: var(--accent) }`; it *is* the default (`spinner.styles.ts:8` `defaultVariants.color: "accent"`) → tzuchi `--accent` = `--tc-color-blue-900` (#1b2d58) light / `--tc-color-blue-300` (#a9c2ea) dark (`themes/tzuchi/variables.css:30`, `:65`) | **Kept — already identical** in both modes. Not restyled. |
| **Colour variants danger / success / warning** | no tc counterpart (tc-spinner has no colour variants) | `spinner.css:32-42` → `var(--danger)` / `var(--success)` / `var(--warning)`, which the Tzu Chi theme already maps to `feedback.error/success/warning` per mode (`themes/tzuchi/variables.css:47-52`, `:82-87`) | **Kept** — already fed by the Tzu Chi palette; nothing to transfer. |
| **Colour variant `current`** | no tc counterpart | `spinner.css:24-26` `color: inherit` | **Kept** (only its track var is set, above). |
| **Motion — duration** | `tc-spinner.styles.ts:16` → `--tc-spinner-duration` = **0.8s** (`tokens.css:106`) | `spinner.css:3` `animate-spin-fast` → `themes/shared/theme.css:145` `spin **0.75s** linear infinite` | **Changed** → `animation-duration: var(--tc-spinner-duration, 0.8s)`. Longhand only, so the `spin` keyframes survive. (6.7 % difference — marginal, but it is a one-line, token-fed fix of a real divergence.) |
| **Motion — timing / iteration** | `linear infinite` (`tc-spinner.styles.ts:16`) | `linear infinite` (`theme.css:145`) | **Kept — identical.** |
| **Motion — reduced motion** | `tc-spinner.styles.ts:54-62` — stops the rotation **and** swaps the dash to `100 26` (a calmer, near-full static arc) | `spinner.css:3` `motion-reduce:animate-none` — stops the rotation only | **Partially kept.** The stop matches; the dash swap is SVG-internal (see below). The added track ring does make the frozen HeroUI mark read as a complete ring, which is the same intent. The `animation-duration` longhand cannot revive the animation — `animate-none` is a shorthand and still sets `animation-name: none`. |
| **Stroke thickness** | `tc-spinner.styles.ts:36, 41` `stroke-width: var(--tc-spinner-thickness, 4px)` on a 50-unit viewBox = **8 % of the box** → 1.6px @ sm, 2.56px @ md, 3.2px @ lg | path band r 7.5→10.5 of a 24-unit viewBox = **12.5 % of the box** → 2.5px @ sm(20), 4px @ md(32), 5px @ lg(40) | **Not transferable — kept.** HeroUI's ring is `fill`ed path geometry, not a stroke; `--tc-spinner-thickness` has no CSS surface to act on. HeroUI's mark is ~56 % heavier in relative terms. |
| **Stroke line cap** | `tc-spinner.styles.ts:42` `stroke-linecap: round` | baked into the path outline | **Not transferable — kept.** |
| **Arc sweep / gap** | `tc-spinner.styles.ts:44` `stroke-dasharray: 90 150` → 71.6 % drawn of a 125.66-unit circumference | full ring with an opacity tail (`spinner.tsx:26-45`) | **Not transferable — kept.** The track ring restores the *visual* of "solid arc over a faint full ring", which is the part the gap actually reads as. |
| **Radius** | n/a — the mark is a circle; no box radius on `:host` or `.spinner` | n/a — `spinner.css` sets no `border-radius` | **N/A on both.** |
| **Height / min-size** | only the square size above | only the square size above | Covered by the size rows; no separate `min-height` on either side. |
| **Padding** | none (`tc-spinner.styles.ts:4-10`) | none (`spinner.css:2-4`) | **N/A on both.** |
| **Gap** | none (single child) | none (single child) | **N/A on both.** |
| **Border width / colour / style** | none — the ring is SVG stroke, not a CSS border | none | **N/A on both.** The track is a background, not a border, so nothing here changes. |
| **Typography** (family, size, weight, line-height) | `line-height: 0` on `:host` (`tc-spinner.styles.ts:9`), no text | no text; `.spinner` has no type declarations | **N/A on both** — the spinner renders no text. `--font-sans` is already themed globally (`themes/tzuchi/variables.css:25`). |
| **Icon size** | the SVG *is* the icon; it fills the host box (`tc-spinner.styles.ts:13-14`) | the SVG is a flex item stretching to the span; no global `svg` sizing rule exists in `base/` | Covered by the size rows — resizing the span resizes the mark. `[data-slot="spinner-icon"]` is only sized explicitly by `toast.css:202-204`, which the guard leaves intact. |
| **Focus ring** | none — decorative, `aria-hidden` SVG, `role="status"` (`tc-spinner.ts:32, 41`) | none — `role="status"`, `aria-label="Loading"`, not focusable (`spinner.tsx:84-86`) | **N/A on both.** `--ring-offset-width` is already themed globally. |
| **Disabled treatment** | no disabled state | no disabled state | **N/A on both.** `--disabled-opacity` is already themed globally (`themes/tzuchi/variables.css:23`). |
| **Other states** (hover / pressed / selected / invalid / pending) | none | none — `.spinner` has no `data-*` state rules; Button's `[data-pending="true"]` (`button.css:42-43`) styles the *button*, not the spinner | **N/A on both.** |
| **Elevation** | none | none | **N/A on both.** Component shadow tokens are light-only literals and were not needed. |
| **Box behaviour** | `:host { display:inline-flex; align-items:center; justify-content:center; vertical-align:middle; line-height:0 }` (`tc-spinner.styles.ts:4-10`) | `.spinner { inline-flex; shrink-0; pointer-events-none }` (`spinner.css:3`) | **Kept.** HeroUI's `shrink-0` / `pointer-events-none` are strictly better and tc has no equivalent. tc's `vertical-align: middle` only differs from HeroUI's baseline alignment inside an inline text run; changing it would shift every existing HeroUI layout, so it is left alone. |
| **A11y label** | `label = "載入中…"` → `aria-label` (`tc-spinner.ts:27, 36`) | hard-coded `aria-label="Loading"` (`spinner.tsx:84`) | **Not transferable** — a React prop/i18n concern, not CSS. Worth raising separately if the app ships Chinese UI. |

## Token-legality check (rule 2 / rule 3)

Every custom property referenced by the override, with why it is allowed:

| Token used | Kind | Where it resolves | Verdict |
|---|---|---|---|
| `--tc-spinner-size-sm/-md/-lg` | dimension | `tokens.css:206-208` → `--tc-size-icon-*` → 20/32/40px, `:root` only, **not** redeclared under `[data-theme="dark"]` | allowed (mode-independent) |
| `--tc-space-8` | dimension | `tokens.css:39` → 8px | allowed |
| `--tc-spinner-duration` | duration | `tokens.css:106` → 0.8s | allowed |
| `--border` | HeroUI theme variable | `themes/tzuchi/variables.css:43` / `:78` | allowed (resolves per mode) |
| `currentColor`, `transparent` | CSS keywords | — | allowed (no literal, no `--tc-color-*`) |

Explicitly **rejected**: `--tc-spinner-color` and `--tc-spinner-track-color` (`tokens.css:373-374`). Both chain to `--tc-color-brand-primary` / `--tc-color-border-default`, which `tokens.css` flips only under `[data-theme="dark"]` — a selector `data-theme="tzuchi-dark"` never matches — so both would silently yield light values in the dark theme. `--tc-spinner-thickness` is legal but has nothing to act on (see the thickness row).

**extraThemeVars: none needed.** Both colours the component wants are already expressible with existing HeroUI theme variables (`--accent` unchanged, `--border` for the track).

## Cascade / specificity notes

- Every rule is `[data-theme^="tzuchi"] .<class>` = `(0,2,0)`; the base rules in `styles/components/spinner.css` are `(0,1,0)`, so order does not matter against them.
- The three size-modifier rules are the *same* specificity as the root `.spinner` rule and are written after it, so `--sm` / `--lg` / `--xl` win by source order while `--md` (which declares nothing upstream) falls through to the root rule.
- `.spinner--current` is written after the root rule for the same reason, so its `--spinner-track` override lands.
- `toast.css:198` is also `(0,2,0)` and is imported *earlier* in the same `components` layer, hence the explicit guard rule at `(0,3,0)`.
- `inline-size` / `block-size` are used rather than `width` / `height`, per the logical-properties rule; the computed `width` / `height` are what the assertions below check.

## Suggested browser assertions

| Story | Selector | Property | Expected |
|---|---|---|---|
| `components-feedback-spinner--default` | `[data-slot="spinner"]` | `height` | `32px` |
| `components-feedback-spinner--default` | `[data-slot="spinner"]` | `width` | `32px` |
| `components-feedback-spinner--sizes` | `.spinner--sm` | `height` | `20px` |
| `components-feedback-spinner--sizes` | `.spinner--lg` | `height` | `40px` |
| `components-feedback-spinner--sizes` | `.spinner--xl` | `height` | `48px` |

Worth an eyeball rather than an assertion: (1) the track ring lines up seamlessly with the arc at all four sizes and in both modes; (2) the `With Spinner` button story (`components-buttons-button--with-spinner`) — the `current` track should tint with the button's label colour, and the spinner is now 20px inside the button; (3) the Toast promise indicator stays 16px and level with its sibling icons.
