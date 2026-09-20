# `color.neutral.surface` → HeroUI `--default`: impact audit

Audit of the theme-level change that maps HeroUI's neutral fill family to
`@tzuchi/tokens`. Read-only pass; no file in either repository was modified.

**Verdict: keep the mapping. Add exactly one token — `color.neutral.surface-hover`
(`{color.gray.200}` light / `{color.gray.800}` dark) mapped to `--default-hover`.
Leave `--segment`, `--surface-secondary`, `--surface-tertiary` unmapped.**

All contrast numbers below are real WCAG 2.x ratios computed from the resolved
values (oklch → sRGB where HeroUI uses oklch, `color-mix(in oklab, …)` evaluated
in oklab, alpha composited over the stated backdrop). Scripts:
`(session-temporary helper scripts, not kept)`.

---

## 1. What actually changed

| variable | tzuchi BEFORE | tzuchi AFTER | tzuchi-dark BEFORE | tzuchi-dark AFTER |
|---|---|---|---|---|
| `--default` | `#ebebec` (HeroUI `oklch(94% .001 286.375)`) | **`#f2f2f2`** gray-100 | `#27272a` (HeroUI `oklch(27.4% .006 286.033)`) | **`#333333`** gray-900 |
| `--default-foreground` | `#18181b` (`--eclipse`) | **`#333333`** gray-900 | `#fcfcfc` (`--snow`) | **`#f2f2f2`** gray-100 |
| `--default-hover` | `#e1e1e2` | `#eaeaea` | `#2e2e31` | `#3a3a3a` |
| `--default-soft` / `-soft-hover` | `--default` @ 50 % / 60 % | unchanged formula, new base | — | — |

`--default-hover`, `--default-soft`, `--default-soft-foreground`,
`--default-soft-hover` keep HeroUI's `color-mix()` derivations
(`themes/default/variables.css:129, 152-154, 270, 293-295`) and re-derive from the
two mapped values — verified they are *not* redeclared anywhere in
`themes/tzuchi/`.

`--field-hover` / `--field-focus` reference `var(--field-background, var(--default))`;
`--field-background` **is** mapped, so the `--default` fallback is never reached.
No consumer uses `--default` as a border, ring, outline or focus colour.

---

## 2. Consumers

**38 distinct files** consume the neutral fill family, all of them in
`heroui/styles/components/`. Plus two infrastructure files:
`themes/shared/theme.css:31-32, 50, 63, 75-77` (the Tailwind `*-default*` utility
aliases) and `themes/default/variables.css` (the derivations). **Zero** non-story
`react/src/**/*.tsx` files reference a `*-default*` colour utility or `var(--default)`
— every hit in `react/src` is in a `*.stories.tsx`. `styles/base/`,
`styles/utilities/` and `styles/variants/` contain no consumer.

### (a) Fill behind text or an icon

| file:line | selector / hook | notes |
|---|---|---|
| `avatar.css:3, 8` | `.avatar`, `.avatar__fallback` `bg-default` | initials sit on it |
| `avatar.css:87, 54` | `--soft` fallback `bg-default-soft text-default-soft-foreground` | |
| `badge.css:13-14, 56, 121-122, 150-151` | `--badge-bg/-fg` ← `--default`, `--default-foreground`, `--default-soft*` | `.badge--default`, `.badge--secondary` |
| `chip.css:6, 27, 110-111` | `--chip-bg`, `--chip-fg`, soft pair | `.chip` base + `.chip--default.chip--soft` |
| `tag.css:72` | `bg-default text-default-foreground` | |
| `kbd.css:3` | `bg-default … text-muted` | **`--muted` text on the fill** |
| `close-button.css:48` | `bg-default text-muted` | icon on the fill |
| `typography.css:38, 66, 118` | `code`, `pre`, `.typography--code` `bg-default text-foreground` | |
| `alert-dialog.css:244` | `.alert-dialog__icon--default` `bg-default text-foreground` | |
| `button.css:104-106, 111-113, 119-121, 126` | `--button-bg*` for `--secondary` / `--tertiary` / `--ghost` | `--ghost` also `color-mix(--default 60%, transparent)` |
| `toggle-button.css:23-25, 123-125, 130-132` | `--toggle-button-bg*` | |
| `pagination.css:43-45, 79-81` | `--pagination-link-*` | **replaced by the pass-1 override** |
| `list-box-item.css:77` | `text-default-foreground` on the check indicator | |
| `calendar-year-picker.css:139` | hover `bg-default text-default-foreground` | |

### (b) Track / indicator that must be perceivable against its surface

| file:line | element |
|---|---|
| `slider.css:24` | `.slider__track` |
| `progress-bar.css:29` / `:119` | track / `.progress-bar--default` fill = `--default-foreground` |
| `meter.css:29` / `:95` | track / `.meter--default` fill |
| `progress-circle.css:11` / `:88` | track stroke / `--default` variant stroke |
| `tabs.css:17` | `.tabs__list-container` = the segmented ("primary") track; the pill on it is `--segment` (`tabs.css:228`) |
| `switch.css:9` | off-track — **replaced by the pass-1 override** |
| `switch.css:25` | disabled thumb `bg-default-foreground/20` |
| `checkbox.css:218`, `radio-group.css:26-27` | `--secondary` control fill (no tc counterpart) |

### (c) Hover / pressed state layer

`menu-item.css:67`, `list-box-item.css:57`, `calendar.css:104, 226, 238, 248`,
`range-calendar.css:104, 295`, `calendar-year-picker.css:139`, `toast.css:231, 247`,
`accordion.css:133` *(overridden)*, `autocomplete.css:276`, `select.css:160`,
`close-button.css:57`, `tag.css:77`, `table.css:94` (`bg-default/50` row hover),
plus every `*-bg-hover` in the field family: `input.css:56-58`,
`textarea.css:58-60`, `search-field.css:151-153`, `number-field.css:187-189`,
`input-group.css:175-177`, `input-otp.css:97-99`, `date-input-group.css:151-153`,
`color-input-group.css:101-103`, `select.css:87-89`, `autocomplete.css:76-78`.

### (d) Decorative

`range-calendar.css:309` (`bg-default/20` outside-month), `color-slider.css:100`
(disabled), `toast.css:231` (the mobile close chip), `avatar.css:87` (soft).

### `--segment` / `--surface-secondary` / `--surface-tertiary`

* `--segment`: **one** consumer — `tabs.css:228` (`.tabs__indicator`, `bg-segment shadow-surface`).
* `--surface-secondary`: `card.css:46`, `surface.css:18`, `table.css:26, 41, 115`.
* `--surface-tertiary`: `card.css:50`, `surface.css:22`, `skeleton.css:2` (`/70`) and `:10` (shimmer `via-`).

---

## 3. Numbers, by role

`stock` = upstream HeroUI on its own surfaces. `BEFORE` = the Tzu Chi surfaces with
HeroUI's unmapped `--default`. `AFTER` = as shipped. `alt` = the alternatives from §6.

| role | stock light | stock dark | tzuchi BEFORE | **tzuchi AFTER** | alt g-200 | tzuchi-dark BEFORE | **tzuchi-dark AFTER** | alt g-800 |
|---|---|---|---|---|---|---|---|---|
| (b) track on **page** | 1.09 | 1.36 | 1.12 | **1.05** | 1.24 | 1.21 | **1.43** | 2.21 |
| (b) track/fill on **card** | 1.19 | 1.19 | 1.19 | **1.12** | 1.32 | 1.14 | **1.35** | 2.08 |
| (b) tabs pill `--segment` vs track | 1.19 | 1.59 | 1.19 | **1.12** | 1.32 | 1.59 | **1.35** | 1.14 |
| (b) progress/meter fill vs track | 14.86 | 14.52 | 14.86 | **11.29** | 9.57 | 14.52 | **11.29** | 7.32 |
| (a) `--default-fg` text on fill | 14.86 | 14.52 | 14.86 | **11.29** | 9.57 | 14.52 | **11.29** | 7.32 |
| (a) `--foreground` text on fill | 14.86 | 14.52 | 10.59 | **11.29** | 9.57 | 13.30 | **11.29** | 7.32 |
| (a) `--muted` text on fill (kbd, close) | 4.05 | 5.66 | 3.22 | **3.43** | 2.91 | 7.10 | **6.03** | 3.91 |
| (c) hover fill on card/overlay | 1.19 | 1.19 | 1.19 | **1.12** | 1.32 | 1.14 | **1.35** | 2.08 |
| (c) hover step `--default-hover` vs `--default` | 1.09 | 1.10 | 1.09 | **1.08** | 1.08 | 1.10 | **1.10** | 1.10 |
| (c) `--default-hover` vs card | 1.30 | 1.31 | 1.30 | **1.21** | 1.42 | 1.26 | **1.49** | 2.28 |
| (d) soft 50 % over card | 1.09 | 1.08 | 1.09 | **1.06** | 1.14 | 1.07 | **1.15** | 1.40 |
| (d) soft-hover 60 % vs soft 50 % | 1.02 | 1.02 | 1.02 | **1.01** | 1.03 | 1.01 | **1.03** | 1.08 |
| (d) `bg-default/20` over card | 1.03 | 1.03 | 1.03 | **1.02** | 1.05 | 1.02 | **1.05** | 1.13 |
| (a) `--default-fg` on soft-50 over card | 16.25 | 15.93 | 16.25 | **11.95** | 11.04 | 15.57 | **13.24** | 10.86 |

Surfaces used: light page `--background` `#f8f8f8`, light card `--surface` / `--overlay`
`#ffffff`; dark page `#161618`, dark card `#1c1c1e`.

**The one-line summary of the table:** dark got better almost everywhere
(+18 % on a card, +18 % on the page); light got ~6 % worse everywhere, and on the
page specifically it fell to 1.05:1, i.e. a 6-value step between `#f2f2f2` and
`#f8f8f8`.

**Calibration against the token this deliberately mirrors** — `brand.surface`
(blue-100 `#e8eefe` / blue-900 `#1b2d58`):

| | on white card | on gray-50 page | dark, on gray-950 card | hover step |
|---|---|---|---|---|
| `brand.surface` | 1.16 | 1.09 | 1.27 | 1.16 light / 1.87 dark (via `brand.surface-hover`) |
| `neutral.surface` (as shipped) | **1.12** | **1.05** | **1.35** | **1.08 light / 1.10 dark** |

The *fill* is calibrated correctly — the neutral twin sits within a few percent of
the brand twin in both modes, which is exactly the intent. The **hover twin is the
part that is missing**, and that is the whole of the defect.

---

## 4. Regressions relative to stock HeroUI

**R1 — Light neutral tracks are now below stock. Severity: medium.**
`slider.css:24`, `meter.css:29`, `progress-bar.css:29`, `progress-circle.css:11`,
`tabs.css:17`. On the page: **1.05:1** (was 1.12, stock 1.09). On a white card:
**1.12:1** (was/stock 1.19). WCAG 1.4.11 asks 3:1 for a graphical object you need
in order to read the control; nothing reaches that in *any* theme — but `#f2f2f2`
on `#f8f8f8` is effectively invisible on a page background. Mitigating: all five
are HeroUI-only shapes with no Tzu Chi counterpart except ProgressBar, and
`progress.tokens.json` exists, so a per-component override in this same pass owns
`--progress-bar-track`. Tzu Chi's own answer for a track is *fainter* still
(`--tc-progress-track-bg` → `color.surface.subtle`, i.e. gray-50 on white = 1.06),
so this is a component decision, not a token defect.

**R2 — Dark segmented Tabs: the selected pill lost a third of its separation. Severity: medium.**
`--segment` `#46464c` against the track fell from **1.59:1 → 1.35:1** because the
track lightened from `#27272a` to `#333333`. Compounding it: `tabs.css:228` pairs
the pill with `shadow-surface`, and `themes/tzuchi/variables.css:103` emits
`--surface-shadow: 0px 1px 2px 0px #00000059` in the **dark** theme — a black drop
shadow on a near-black page, invisible. Stock dark sets it to
`0 0 0 0 transparent inset` (`themes/default/variables.css:259`), i.e. it also has
no shadow, but it has 1.59 of luminance separation to carry the state. Under
`tzuchi-dark` the selected segment now has neither.

**R3 — Light hover layers that paint `bg-default` on a white surface. Severity: low–medium.**
1.19 → **1.12**. `menu-item.css:67`, `list-box-item.css:57`, `calendar.css:238, 248`,
`range-calendar.css:295`, `calendar-year-picker.css:139`, `toast.css:247`, and
`button.css:119-120` (`.button--ghost` hovers *to* `--default` from transparent).
Not affected: `accordion.css:133` and Dropdown's `menu-item` hover — both replaced
in pass 1 (see §5). A Menu/ListBox used outside `Dropdown` still gets the weak tint.

**R4 — `--default-soft` layers thinned in light. Severity: low.**
`avatar.css:87` soft fallback and `table.css:94` row hover (`bg-default/50`):
1.09 → **1.06**. `range-calendar.css:309` (`/20`): 1.03 → **1.02**.

**R5 — `--default-foreground` fell from 14.86/14.52 to 11.29 as text-on-fill and as
the `--default` progress/meter fill. Severity: low (informational).** Still 3–4×
above AA everywhere. In light it is actually a *gain* for `--foreground` on the fill
(10.59 → 11.29), because `--default` lightened.

**Not a regression — the hover step never worked.** `--default-hover` is
`color-mix(--default 96%, --default-foreground 4%)`; the step over the resting fill
is **1.08–1.10 in every theme, stock included**. The change neither caused nor
worsened it. It is the thing §6 recommends fixing.

**Improvements worth recording (dark):** fill/track on a card 1.14 → **1.35**;
on the page 1.21 → **1.43**; the modal close-trigger hover 1.26 → **1.49**;
soft-50 over a card 1.07 → **1.15**. Light also improved for `--muted` on the fill
(3.22 → **3.43**) — `kbd.css:3` and `close-button.css:48` are the consumers, both
still below AA 4.5, which is the pre-existing `--muted` issue NOTICE.md already
flags, not a new one.

---

## 5. Interplay with the 18 pass-1 override files

### Already neutralised — unaffected by the change

| override | what it replaces |
|---|---|
| `switch.css:73` | `--switch-control-bg` → `var(--tzuchi-switch-track-bg, var(--muted))` |
| `pagination.css:107-108, 121-124` | every `--pagination-link-bg*` → `--accent-soft` / `--accent` / `--accent-hover` |
| `dropdown.css:138-141, 148-151` | Dropdown's `menu-item` hover/focus/selected → `--accent-soft-hover` |
| `accordion.css:110` | trigger hover → `var(--tzuchi-accordion-trigger-hover-bg, var(--surface-hover))` |
| `modal.css:111-117` | modal close trigger resting fill → `transparent` (hover left on `--default-hover`) |
| `button.css:145-147, 156-160` | `.button--secondary` → `--accent-soft`; `.button--outline` → `--accent` |

`.button--tertiary` and `.button--ghost` (`button.css:111-126` in the base) are
deliberately left on `--default` (`themes/tzuchi/components/button.css:38-40` says
so, correctly).

### Now-dead rule

`themes/tzuchi/components/pagination.css:103`

```css
--pagination-link-fg: var(--foreground);
```

`--default-foreground` and `--foreground` now resolve to the *same* primitive in
both modes (`themes/tzuchi/variables.css:37` + `:39`, and `:79` + `:81`), so this
override is a no-op. Harmless; the rule can stay, but its justification is false.

### Stale comments (quote-level)

1. `themes/tzuchi/components/pagination.css:100-102` — *"(`--default-foreground` is one
   of the variables the Tzu Chi theme leaves unmapped, so it still resolves to
   HeroUI's `--eclipse` / `--snow`.)"* — no longer true; it is mapped to
   `color.text.default`.
2. `themes/tzuchi/components/pagination.css:23` — *"…rather than `--default-foreground`,
   which the Tzu Chi theme does not map."*
3. `themes/tzuchi/components/chip.css:19` — *"keeps the **unmapped** `--default`
   background from the base rule"*. The grey is now a Tzu Chi token; the
   grey-bg / blue-text mismatch it describes is still real, but the cause is no
   longer "unmapped".
4. `themes/tzuchi/components/chip.css:45` — the same claim restated in the
   "Reviewed" paragraph.
5. `themes/tzuchi/components/dropdown.css:134-135` — *"(HeroUI uses the neutral
   `--default`, which the Tzu Chi theme does not map)"*.
6. `themes/tzuchi/components/switch.css:69` — *"HeroUI's `--default` is a near-white
   neutral here"*. True in light (gray-100), false in dark (gray-900). The decision
   it justifies is still right — `color.border.strong` remains the better off-track.
7. `themes/tzuchi/variables.css:13` **and its source `generate.mjs:124`** —
   *"`--segment` (HeroUI's white / `oklch(39.6%)` already sit on the neutral track
   like Tzu Chi's white / gray-800)"*. The neutral track is now gray-**900**, not
   gray-800, and the resulting separation is 1.35:1, not the parity the comment
   claims. This is the comment that R2 invalidates.

Already correct, no action: `themes/tzuchi/components/button.css:38-40` and
`themes/tzuchi/components/textarea.css:13-14` both already describe the
neutral-surface mapping.

Gap-audit records that assert "unmapped" and are now historical rather than
current: `gap-audit/accordion.md:85`, `dropdown.md:78`, `modal.md:89, 91`,
`pagination.md:46, 53`, `switch.md:30`, `tabs.md:47, 73`, `input.md:60`. They are an
audit trail of pass 1, so a dated note at the top of `gap-audit/README.md` is
enough — rewriting them would falsify the record.

**No double-handling found.** No override file declares a `--default`-derived
property that another override or the base already sets for the same selector.

---

## 6. Alternatives, and the recommendation

### Light `gray.200` (#E0E0E0) instead of gray-100 — **rejected**

It fixes R1 and R3 handsomely (track on page 1.24, on card 1.32 — both better than
stock) but it costs three things:

* `--muted` on the fill drops **3.43 → 2.91** — `kbd.css:3` is real 14 px text and
  `close-button.css:48` is an icon; 2.91 fails both AA 4.5 and the 3:1 non-text
  threshold, where 3.43 at least fails only the former.
* `--default-foreground` on the fill drops 11.29 → 9.57 (still fine).
* It breaks the pair this token was created to mirror: the **neutral** tonal fill
  (1.32 on white) would become visibly *louder* than the **brand** tonal fill
  (`brand.surface` blue-100 = 1.16 on white). A grey chip shouting over a blue one
  is the wrong hierarchy, and it would desynchronise `accent-soft` and
  `default-soft` everywhere they appear side by side (Badge, Chip, Avatar, Button).

### Dark `gray.800` (#4F4F4F) instead of gray-900 — **rejected**

Track on a card would jump to 2.08 and on the page to 2.21 — genuinely more
perceivable — but `--default-foreground` on the fill falls to **7.32** and `--muted`
on it to **3.91**, and, decisively, it *inverts* R2: `--segment` `#46464c` against a
`#4f4f4f` track becomes **1.14:1**, i.e. the selected tab pill disappears entirely.
It would also put the neutral fill (2.08 on a dark card) far above `brand.surface`
(1.27), the same hierarchy inversion as above.

### Add `color.neutral.surface-hover` → `--default-hover` — **adopt**

`{color.gray.200}` light / `{color.gray.800}` dark, mirroring
`color.brand.surface-hover` = `{color.blue.200}` / `{color.blue.700}` exactly.

| | resting → hover step | hover vs white/dark card | `--default-fg` on hover | `--muted` on hover |
|---|---|---|---|---|
| today (HeroUI's 4 % mix) | 1.08 light / 1.10 dark | 1.21 / 1.49 | 11.29 / 11.29 | 3.18 / 5.46 |
| **with the token** | **1.18 light / 1.54 dark** | **1.32 / 2.08** | 9.57 / 7.32 | 2.91 / 3.91 |
| `brand.surface-hover`, for calibration | 1.16 light / 1.87 dark | — | — | — |

That lands the neutral hover on precisely the rhythm the brand pair already uses,
and it is the single change that reaches the most consumers: `button.css:105, 112`
(tertiary), `toggle-button.css:24, 124`, `tag.css:77`, `close-button.css:57`,
`select.css:160`, `autocomplete.css:276`, `radio-group.css:27`, and all nine
`*-bg-hover` hooks in the field family. Cost: `--muted` on the hover fill 3.18 → 2.91
for the one icon in `close-button.css:48` (its resting state is `transparent` under
the modal override anyway, and at rest `--muted` on white is 3.84).

It does **not** reach R3's consumers, which paint `bg-default` (not
`bg-default-hover`) as their hover. That is correct: those are Menu/ListBox/Calendar
rows, and the Tzu Chi answer for them is the brand tint that `dropdown.css` already
applies — the remaining ones belong in their own component overrides, not in a token.

### `--segment` — **leave unmapped**, and fix the comment

No existing `@tzuchi/tokens` pair works. The pill must be *lighter* than the
gray-900 track in dark and white-ish in light; `surface.default` is white / gray-950
(darker than the track — inverts), `border.default` is gray-300 / gray-750 (a dark
pill on a light track in light mode). Mapping it therefore needs a **new** token,
which is out of proportion for one rule (`tabs.css:228`) belonging to a HeroUI-only
variant that Tzu Chi never specified. For the record, if the tabs owner does want to
close R2 without a token, `gray-750` would give 2.38:1 against the gray-900 track
with 4.74:1 for the label on it — the strongest of the candidates. Either way,
`generate.mjs:124` / `variables.css:13` must stop claiming the Tzu Chi track is
gray-800.

### `--surface-secondary` / `--surface-tertiary` — **leave unmapped**

`tokens.css` has exactly two surface steps (`surface.default`, `surface.subtle`) and
no third or fourth, so any mapping would have to reuse `neutral.surface`, and that
breaks the hierarchy in both directions:

* Dark: HeroUI's values are `#232325` and `#262728` — 1.08 and 1.14 above
  `--surface` `#1c1c1e`, chroma 0.0037 / 0.0024 (perceptually neutral, no clash with
  the Tzu Chi grey ramp). The resulting ramp
  `surface #1c1c1e < secondary #232325 < tertiary #262728 < default #333333 < segment #46464c`
  is monotonic and correct. Mapping secondary → gray-900 would make it **1.35** above
  `--surface`, i.e. a "secondary" Card louder than a default chip.
* Light: `#efeff0` / `#eaeaeb` are 1.15 / 1.20 over white, which brackets
  `neutral.surface` (1.12) — already the right neighbourhood.
* `skeleton.css:2` uses `bg-surface-tertiary/70`; mapping tertiary would take the
  skeleton from 1.14 over the card to 1.32 (light gray-200) or **2.08** (dark
  gray-800) — a loud grey block where HeroUI wants a placeholder.

### Recommendation (one)

> **Keep `color.neutral.surface` = gray-100 / gray-900 and the `--default` /
> `--default-foreground` mapping exactly as shipped.** Add
> `color.neutral.surface-hover` = `{color.gray.200}` / `{color.gray.800}` to
> `packages/tokens/src/semantic/color.tokens.json` and
> `src/themes/dark/color.tokens.json`, and add
> `"--default-hover": "--tc-color-neutral-surface-hover"` to `THEMED` in
> `styles/themes/tzuchi/generate.mjs:37`. Leave `--segment`,
> `--surface-secondary`, `--surface-tertiary` and `--backdrop` unmapped. Then fix
> the seven stale comments in §5 and hand R1 and R2 to the Slider / Meter /
> ProgressCircle / Tabs component overrides, where Tzu Chi's own track decisions
> (`--tc-progress-track-bg` → `surface.subtle`, `--tc-spinner-track-color` →
> `border.default`, `--tc-switch-track-bg` → `border.strong`) already show that
> "the neutral track" is a per-component choice, not one token.
