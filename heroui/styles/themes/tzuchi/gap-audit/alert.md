# Alert — Tzu Chi ↔ HeroUI gap inventory

- **Tzu Chi side**: `packages/components/src/alert/tc-alert.styles.ts`, `tc-alert.ts`, `packages/tokens/src/component/alert.tokens.json`
- **HeroUI side**: `heroui/styles/components/alert.css`, `heroui/styles/src/components/alert/alert.styles.ts`, `heroui/react/src/components/alert/alert.tsx`
- **Override written to**: `heroui/styles/themes/tzuchi/components/alert.css`
- **Closeness**: major gaps — the two components share a layout (icon + content row) but nothing else. tc-alert is a flat tinted callout with a 4px tone stripe and body-size type; HeroUI's Alert is a raised white card with 14px type and tonal titles.

## Variant mapping

| tc `tone` | HeroUI `status` | note |
|---|---|---|
| `info` (default) | `accent` | tc `--tc-alert-accent-info` → `{color.feedback.info}` → `{color.brand.primary}` (blue-900 light / blue-300 dark) = exactly HeroUI's `--accent` under tzuchi. Clean 1:1. |
| `success` | `success` | 1:1 |
| `warning` | `warning` | 1:1 |
| `danger` | `danger` | 1:1 |
| — | `default` | No tc counterpart. Keeps HeroUI's `--surface` background and `--foreground` indicator/title; gains the tc shape plus a neutral `--muted` stripe so it stays consistent with the toned four. |

HeroUI's `status` **defaults to `default`**, tc's `tone` defaults to `info`. Left alone — changing a default prop would be a React change, not a theme change.

Both components resolve `--radius` = `--tc-radius-md` = **8px** under tzuchi, so `--radius-3xl` = `calc(8px * 3)` = **24px**; Tailwind `--spacing` is upstream's `0.25rem` and no `--text-*` scale is overridden, so `text-sm` = 14px / 20px line-height.

## Gap table

| property | Tzu Chi (file:line → resolved) | HeroUI (file:line → resolved) | action |
|---|---|---|---|
| **radius** | `tc-alert.styles.ts:37` `--tc-alert-radius` → `--tc-radius-md` → **8px** (both modes) | `alert.css:6` `min(32px, var(--radius-3xl))` → min(32px, 24px) = **24px** | **changed** → `border-radius: var(--tc-alert-radius, 0.5rem)` |
| **height / min-size** | none — content-driven | none — content-driven | kept — both intrinsic |
| **padding** | `tc-alert.styles.ts:38` `--tc-alert-padding` → `--tc-space-16` → **16px** all sides | `alert.css:5` `px-4 py-3` → **16px inline / 12px block** | **changed** → `padding-block`/`padding-inline: var(--tc-alert-padding, 1rem)`. Inline was already 16px; declared anyway so the file is self-contained. |
| **gap (icon ↔ content)** | `tc-alert.styles.ts:33` `--tc-alert-gap` → `--tc-space-12` → **12px**, indicator has no padding | `alert.css:5,15` `gap-4` = **16px** + `.alert__indicator` `p-1` = 4px → effective **20px** | **changed** → `gap: var(--tc-alert-gap, 0.75rem)` and `.alert__indicator { padding: 0 }` → effective 12px, matching tc exactly |
| **gap (title ↔ description)** | `tc-alert.styles.ts:68` `.content { gap: var(--tc-space-4) }` → **4px** | `alert.css:11` `.alert__content` flex-col, **no gap** | **changed** → `gap: var(--tc-space-4, 0.25rem)` |
| **border width/colour/style** | `tc-alert.styles.ts:36` `border-inline-start: 4px solid var(--_accent)`; no other edges | `alert.css:4-7` **no border at all** | **changed** → `border-inline-start: 4px solid var(--alert-accent)`. `box-sizing: border-box` (preflight) keeps the inline-start inset at 4 + 16 = 20px, identical to tc. The 4px has no token on either side; kept as a literal dimension (allowed — only colour literals are banned). |
| **background — tone tint** | `tc-alert.styles.ts:35` `color-mix(in srgb, var(--_accent) 12%, var(--tc-color-surface-default))` → light: 12% tone over `#ffffff`; dark: 12% tone over `#1c1c1e` | `alert.css:5` `bg-surface` → `--surface` = **`#ffffff`** light / **`#1c1c1e`** dark, identical for every status | **changed** → per-status `--alert-surface: var(--accent-soft / --success-soft / --warning-soft / --danger-soft)`. These are upstream's own translucent tone washes (`color-mix(in oklab, <tone> 15%, transparent)` light, 12% dark — `themes/default/variables.css:156,160,164,168` and `:297,301,305,309`), i.e. the same 12–15% tint tc asks for, and the pairing HeroUI itself uses for `.alert-dialog__icon--*` (`alert-dialog.css:251`). Chosen over hand-rolled `color-mix` so the value stays one hop from the theme. `default` keeps `--surface`. |
| **tone accent — info** | `alert.tokens.json:3` → `{color.feedback.info}` → `{color.brand.primary}` → **`#1b2d58`** light / **`#a9c2ea`** dark | n/a (HeroUI has no "info"; `accent` is the informational status) | mapped to `--accent`, which resolves to the very same primitives under tzuchi (`themes/tzuchi/variables.css:30,65`) |
| **tone accent — success** | `alert.tokens.json:4` → `{color.feedback.success}` → **`#168967`** light / **`#3fbf8f`** dark | n/a | `--success` → same primitives (`variables.css:49,84`) |
| **tone accent — warning** | `alert.tokens.json:5` → `{color.feedback.warning}` → **`#b45309`** light / **`#fbbf24`** dark | n/a | `--warning` → same primitives (`variables.css:51,86`) |
| **tone accent — danger** | `alert.tokens.json:6` → `{color.feedback.error}` → **`#d4494f`** light / **`#f08a8e`** dark | n/a | `--danger` → same primitives (`variables.css:47,82`) |
| **icon colour** | `tc-alert.styles.ts:46` `color: var(--_accent)` — the **raw** tone, every tone | `alert.css:31-68` per status: `--foreground` (default), `--accent-soft-foreground`, `--success-soft-foreground`, `--warning-soft-foreground`, `--danger-soft-foreground` | **changed for the four toned statuses only** → `color: var(--alert-accent)`. HeroUI's `*-soft-foreground` is a softened mix (light `--warning-soft-foreground` ≈ 53% amber + 47% `--foreground`, a brown), which diverges visibly from the stripe. `.alert--default` is left on `--foreground`. Contrast on the new tints: danger ≈ 3.9:1, success ≈ 4.3:1, warning ≈ 4.9:1, accent > 10:1 — all clear of the 3:1 non-text bar. |
| **icon size** | `tc-alert.styles.ts:47-48` `--tc-alert-icon-size` → `--tc-size-icon-sm` → **20 × 20px**, no padding, `margin-block-start: 1px` | `alert.css:14-19` `.alert__indicator` `p-1` (4px) + `[data-slot="alert-default-icon"]` `box-content size-4` → **16 × 16px** glyph in a **24 × 24px** box | **changed** → icon 20px, indicator padding 0, `margin-block-start: 1px`. Only `[data-slot="alert-default-icon"]` is resized, so the custom-indicator story (`<Spinner size="sm">`) keeps its own size. |
| **typography — family** | `tc-alert.styles.ts:73` `--tc-typography-body` shorthand → `'Noto Sans TC', …` | inherits `--font-sans` | kept — `themes/tzuchi/variables.css:25` already sets `--font-sans: var(--tc-font-family-base)`, so it is the same stack. No need to re-declare (and re-declaring via the `font` shorthand would also reset unrelated font properties). |
| **typography — title** | `tc-alert.styles.ts:73-74` `400 16px/1.6` then `--tc-font-weight-bold` → **16px / 25.6px / 700** | `alert.css:23` `text-sm leading-6 font-medium` → **14px / 24px / 500** | **changed** → `font-size: var(--tc-font-size-16)`, `line-height: var(--tc-line-height-relaxed)` (1.6), `font-weight: var(--tc-font-weight-bold)` |
| **typography — description** | `tc-alert.styles.ts:83` `--tc-typography-body` → **16px / 25.6px / 400** | `alert.css:27` `text-sm` → **14px / 20px / 400** | **changed** → 16px / 1.6. Weight already 400. |
| **title colour** | `tc-alert.styles.ts:75` `--tc-alert-title-fg` → `{color.text.default}` → **`#333333`** light / **`#f2f2f2`** dark — the **same in all four tones** | `alert.css:35-68` per status: `--foreground`, `--accent-soft-foreground`, `--success-soft-foreground`, `--warning-soft-foreground`, `--danger-soft-foreground` | **changed** → `color: var(--foreground)` for every status (resolves to gray-900 / gray-100, i.e. `{color.text.default}`). This is the core tc decision: the tone lives in the stripe and the icon, never in the words. Beats the per-status rules by specificity (0,2,0 + later source order vs 0,2,0). |
| **description colour** | `tc-alert.styles.ts:84` `--tc-alert-text-fg` → `{color.text.default}` → **`#333333`** / **`#f2f2f2`** | `alert.css:27` `text-muted` → `--muted` → **`#828282`** light / **`#b3b3b3`** dark | **changed** → `var(--foreground)`. Also fixes the sub-AA light-mode `--muted` (3.84:1) flagged in `MAINTAINING.md`. |
| **elevation** | none anywhere in `tc-alert.styles.ts` | `alert.css:5` `shadow-surface` → `--surface-shadow` = `0px 1px 2px 0px #0000001a` light / `…#00000059` dark (`themes/tzuchi/variables.css:59,94`) | **changed** → `box-shadow: none`. A tinted callout with a stripe reads as inset, not raised; keeping both would double the separation cues. |
| **focus ring** | `tc-alert.styles.ts:119-123` — on the **dismiss button only**: `outline: 2px solid var(--tc-color-border-focus)`, offset `--tc-focus-ring-offset` | HeroUI's Alert has no focusable part; the story composes a separate `<CloseButton />` | kept — nothing to override. See "Not transferable". |
| **disabled treatment** | none — tc-alert has no disabled state | none — HeroUI's Alert has no disabled state | kept — N/A on both sides |
| **hover / pressed / selected / invalid / pending** | none | none — `alert.css` declares no state selectors and `alert.tsx` emits no `data-*` state attributes | kept — the component is non-interactive on both sides |
| **motion** | `tc-alert.styles.ts:104-108` `transition: color 150ms` — dismiss button only, inside `prefers-reduced-motion: no-preference` | none | kept — the dismiss button is not part of HeroUI's Alert |
| **layout (direction, alignment)** | `tc-alert.styles.ts:31-32` `display:flex; align-items:flex-start` | `alert.css:5` `flex flex-row items-start justify-start w-full` | kept — already identical |
| **content column** | `tc-alert.styles.ts:64-67` `flex:1 1 auto; min-inline-size:0; flex-direction:column` | `alert.css:11` `flex h-full grow flex-col items-start` | kept — equivalent |

## Not transferable

- **Dismiss button** — tc-alert owns a `dismissible` × button (20px box, 4px radius, `--tc-color-text-muted` → text-default on hover, 2px focus outline at 2px offset, 150ms colour transition) and fires `tc-dismiss`. HeroUI's Alert has no close slot at all; the story composes the standalone `<CloseButton />` component as a sibling. Its styling belongs in a `close-button.css` override, not here.
- **`role` switching** — tc-alert sets `role="alert"` for danger/warning and `role="status"` for info/success (`tc-alert.ts:68-70`). HeroUI's `AlertRoot` renders a bare `<div>` with `data-slot="alert-root"` and no role. Behaviour, not CSS — a React change if it is ever wanted.
- **`heading` / title-slot auto-hide** — tc hides `.title` when neither `heading` nor the `title` slot has content; HeroUI expects the consumer to simply omit `<Alert.Title>`. No CSS equivalent needed.
- **HeroUI's `default` status** — no tc tone exists for it (tc's default tone is `info`). Given the neutral treatment described above rather than left as an orphan.
- **HeroUI's per-status `*-soft-foreground` title scale** — deliberately dropped, not ported: tc never tints title text.
- **`SurfaceContext`** (`alert.tsx:51`) — tells nested Buttons which surface they sit on. React context, unaffected by this file, but note that nested `secondary` buttons now sit on a tone tint rather than plain `--surface`.

## Extra theme variables needed

None. Every colour resolves from variables the generated theme already emits: `--muted`, `--surface`, `--foreground`, `--accent`, `--success`, `--warning`, `--danger` and the inherited `--*-soft` washes.

`--alert-accent` and `--alert-surface` are **local** custom properties declared and consumed inside this file (HeroUI's `alert.css` exposes none of its own, so rule 4 has nothing to hook into); they follow HeroUI's own `--badge-bg` / `--button-bg` naming and do not exist upstream.

## Verification notes

- Story: `components-feedback-alert--default` (`Components/Feedback/Alert` → `Default`), the only Alert story. It renders eight alerts; the first is `.alert.alert--default`, so `document.querySelector('.alert')` hits it.
- `.alert__title` line-height resolves to `25.6px` (16 × 1.6) — not asserted, kept under the 6-assertion cap.
- Specificity check: every rule here is `[data-theme^="tzuchi"] .x` = (0,2,0) or (0,3,0) vs upstream's (0,1,0)/(0,2,0), and the file loads later in the same `components` layer, so no `!important` is needed anywhere.
- `.alert-dialog__*` shares the "alert" prefix but not the `.alert` class, so none of these selectors reach it.
