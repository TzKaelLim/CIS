# Unit `media-typography` — Avatar · AvatarGroup · Kbd · Typography · ScrollShadow

Targets: `avatar.css`, `avatar-group.css`, `kbd.css`, `typography.css`, `scroll-shadow.css`.
Written: **3** files (`avatar.css`, `kbd.css`, `typography.css`).
No file needed: **2** (`avatar-group.css`, `scroll-shadow.css`).

All five components are on DESIGN-LANGUAGE.md's **§12 Q8** list — "components with no Tzu Chi
counterpart at all … every rule for them here is marked NO EVIDENCE — derive". So every value below
cites a numbered spec rule, and every derivation is also listed under **Spec gaps**.

Resolved values assume the shipped theme: `--radius` 8px, so `--radius-sm` 4px, `--radius-md` 6px,
`--radius-lg` 8px, `--radius-xl` 12px, `--radius-2xl` 16px, `--radius-3xl` 24px; Tailwind
`text-xs` 12px/1.3333, `text-sm` 14px/1.4286, `text-base` 16px/1.5, `text-lg` 18px/1.5556,
`text-xl` 20px/1.4, `text-2xl` 24px/1.3333, `text-3xl` 30px/1.2, `text-4xl` 36px/1.1111;
`--spacing` 0.25rem. Base declarations were read from the source files and cross-checked against
the compiled `storybook/storybook-static/assets/iframe-DpN8oW_m.css`.

---

## 1. Avatar — `avatar.css` (1 rule, 3 declarations)

| property | HeroUI base (file:line → resolved) | now (declaration → resolved) | spec rule |
|---|---|---|---|
| `font-size` (fallback, **md**) | `avatar.css:8` `text-sm` → **14px** | `font-size: var(--tc-font-size-16, 16px)` → **16px** | §1 preamble (no 14px step) + R1 |
| `font-size` (fallback, **sm**) | `avatar.css:28` `.avatar--sm .avatar__fallback { text-xs }` → **12px** | same rule → **16px** | §1 preamble (no 12px step) + R1; §3.2 (type does not change with size) |
| `font-size` (fallback, **lg**) | `avatar.css:44` `text-base` → **16px** | same rule → **16px** (unchanged value, now stated once) | R1 |
| `font-weight` (fallback) | `avatar.css:8` `font-medium` → **500** | `font-weight: var(--tc-font-weight-bold, 700)` → **700** | R1 via §1.2 ("is the control" → subtitle 700) |
| `line-height` (fallback) | `avatar.css:8` `text-sm` → **1.4286 (20px)**; sm `:28` → 1.3333 (16px); lg `:44` → 1.5 (24px) | `line-height: var(--tc-line-height-normal, 1.5)` → **1.5 (24px)** | R1 (subtitle = 1.5); §1.2 "1.5 for controls" |

**Cascade.** The base nests the per-size type inside the size modifier, emitting
`.avatar--sm .avatar__fallback` and `.avatar--lg .avatar__fallback` at (0,2,0). The override uses
`[data-theme^="tzuchi"] .avatar .avatar__fallback` = **(0,3,0)**, an outright win rather than an
N7 source-order tie. The extra `.avatar` always matches: `AvatarFallback` is only ever rendered
inside `AvatarRoot`, including the AvatarGroup count bubble (`avatar-group.tsx:42-51` renders a
full `<Avatar>`).

**Knock-on:** an icon fallback (`<Icon>` from Iconify) is sized `1em`, so it moves 12/14/16px →
**16px** at every avatar size. The 16px/700 pair of initials measures ≈23px, inside a 32px `sm`
circle (≈29px clear once AvatarGroup's `padding-inline-end` clip nudge of 2.8px applies) — no clip.

### Left as HeroUI's (and why)

| kept | why |
|---|---|
| Box sizes **32 / 40 / 48px** (`:25`, `:3`, `:41`) | No spec rule reaches them, and `themes/tzuchi/components/badge.css:6-13` already anchors the Tzu Chi badge ramp (16/20/24px) to exactly these three numbers — moving them would silently de-calibrate Badge. |
| **Radius** `rounded-2xl` (16px on 32px) / `rounded-3xl` (24px on 40px and 48px) | All three exceed half the box, so CSS scales them to a **true circle** already. Same "already a pill at every size, do not touch" reading as §10 D5 / `badge.css:18-19`. |
| Every **colour**: `bg-default` on root and fallback, the five `--accent/--success/--warning/--danger/--default -soft-foreground` fallbacks, the `--soft` variant's `bg-*-soft` | §5 **R88 case ①** — HeroUI-only neutral with no tc counterpart; the rest already resolve through theme variables per mode. |
| **No ring / no border** | §4 R65-R70 give a border only to fields and a ring only to focus. An Avatar has neither. (The brief's "ring per spec" resolves to: the spec prescribes none.) |
| Image slot (absolute fill, `aspect-square`, 250ms opacity fade) | Structure + motion the spec is silent on; §8 R140 forbids *adding* choreography, not keeping HeroUI's. |

---

## 2. AvatarGroup — **no file**

| property | HeroUI base (file:line → resolved) | verdict |
|---|---|---|
| `--avatar-group-overlap` | `avatar-group.css:6` `0.5rem` → **8px** | Already `--tc-space-8`. §9 rhythm satisfied. |
| grid `gap` | `avatar-group.css:14` `gap-3` → **12px** | Already `--tc-space-12`. |
| `--avatar-group-seam` + ring | `:7` `2px`; `:32` `box-shadow: 0 0 0 2px var(--background)` | A seam, not elevation (§6 shadow table does not reach it); the colour is already a theme variable that flips per mode. No spec rule for the width. |
| clip mask geometry, RTL flip, `padding-inline-end` nudge | `:40-67` | Layout-specific geometry — HARD RULE 6 says leave it. |
| count bubble type | `.avatar-group__count` is a full `<Avatar>` | Inherits `avatar.css`'s fallback rule automatically — writing anything here would duplicate it (HARD RULE 7). |

Everything AvatarGroup owns is either already on a Tzu Chi space step, already a theme variable, or
pure geometry. **"Already consistent — no file."**

---

## 3. Kbd — `kbd.css` (2 rules)

| property | HeroUI base (file:line → resolved) | now (declaration → resolved) | spec rule |
|---|---|---|---|
| `font-size` | `kbd.css:3` `text-sm` → **14px** | `var(--tc-font-size-16, 16px)` → **16px** | §1 **R21** → **R1** (R21 names `kbd` explicitly) |
| `font-weight` | `kbd.css:3` `font-medium` → **500** | `var(--tc-font-weight-bold, 700)` → **700** | R1 via §1.2 (a key legend *is* the label) |
| `line-height` | `kbd.css:3` `text-sm` → **1.4286 (20px)** | `var(--tc-line-height-normal, 1.5)` → **1.5 (24px)** | R1; fits `h-6`'s 24px box exactly |
| `border-radius` | `kbd.css:3` `rounded-lg` = `calc(var(--radius) * 1)` → **8px** | `var(--tc-radius-sm, 4px)` → **4px** | §2 **R33** (small square-ish cell), corroborated by R25 (32px checkbox = 4px), R31 (tooltip = 4px), R34 |
| `color` | `kbd.css:3` `text-muted` → `--muted`; **3.43:1** on `--default` light, 6.03:1 dark (`neutral-token-impact.md:117`) | `var(--default-foreground)` → **11.29:1 in both modes** (same source) | §5 **tint ladder** — the `--default` row names `--default-foreground` as "text on it" |
| internal gap | `kbd.css:3` `space-x-0.5` → **2px** `margin-inline-end` on `:not(:last-child)`, with an `rtl:space-x-reverse` flip | `column-gap: var(--tc-space-4, 4px)` + `margin-inline: 0` on `:not(:last-child)` → **4px**, both directions | §9 **R154** (micro gap); identical move to `badge.css:14` (2px → 4px) |

**Why 4px and not 8px for the corner.** Every 8px radius in this system belongs to something
34-50px tall — button/field/trigger (R22), option popover (R29), alert (R35), accordion (R36).
Every small object is 4px or a pill — pagination cell 32-48px (R33), checkbox 32px (R25), tooltip
(R31), inline focus shape (R34). A 24px key cap is the smallest member of that family. This also
puts Kbd and Typography's inline `code` — the same object rendered by two components — on one
corner.

**Cascade.** `[data-theme^="tzuchi"] .kbd` is (0,2,0) vs base `.kbd` (0,1,0) — wins on specificity
alone. The base's spacing rule is `:where(.kbd > :not(:last-child))`, flattened by `:where()` to
**(0,0,0)**; the override's `[data-theme^="tzuchi"] .kbd > :not(:last-child)` is **(0,3,0)**. The
RTL companion only sets `--tw-space-x-reverse: 1`, which feeds the `calc()`s that are now zeroed,
so it becomes inert rather than conflicting. Nothing here touches a Tailwind ring/shadow stack, so
§4 R74 does not apply.

**Net visual effect, stated plainly:** the cap goes from a quiet grey 14px/500 chip to a
16px/700 cap in full foreground. That is the sum of two separately-mandated moves (§1 R21→R1 and
the §5 tint ladder) and is deliberate.

### Left as HeroUI's (and why)

| kept | why |
|---|---|
| `h-6` (**24px**) and `px-2` (**8px**) | The spec gives no Kbd metric. R40/R41's 42 / 43.6px are for things you click; a key cap sits inside a 25.6px prose line (`InlineUsage` story). 24px with a 24px line box is the restrained reading, and 8px is already a Tzu Chi space step. |
| `bg-default`, and `.kbd--light`'s `bg-transparent` (`:26`) | §5 R88 case ①. Both variants move together, so the fill stays the only variant tell — exactly as upstream has it. |
| `word-spacing: -0.25rem` (`:4`), `text-center`, `white-space: nowrap`, `font-sans` | Optics/structure, not design language. |
| `.kbd__abbr` / `.kbd__content` full-bleed flex boxes (`:8-22`) | Structure. |

---

## 4. Typography — `typography.css` (14 rules)

This is the one component where the type scale **is** the design, so the file is a mapping table.

### 4.1 Heading ramp — HeroUI's six steps onto Tzu Chi's six, one for one

| class | HeroUI base (file:line → resolved) | now → resolved | spec rule |
|---|---|---|---|
| `--h1`, `prose h1` | `typography.css:82`, `:10` `text-4xl font-semibold` → **36px / 600 / 1.1111 (40px)** | `--tc-font-size-46` + `bold` + `tight` → **46px / 700 / 1.3 (59.8px)** | `--tc-typography-heading-1`; §1 R12's form (`card.css:56-60`) |
| `--h2`, `prose h2` | `:86`, `:14` `text-3xl` → **30px / 600 / 1.2 (36px)** | → **34px / 700 / 1.3 (44.2px)** | `--tc-typography-heading-2` |
| `--h3`, `prose h3` | `:90`, `:18` `text-2xl` → **24px / 600 / 1.3333 (32px)** | → **26px / 700 / 1.4 (36.4px)** | `--tc-typography-heading-3` (= R12's card-title metric) |
| `--h4`, `prose h4` | `:94`, `:22` `text-xl` → **20px / 600 / 1.4 (28px)** | → **24px / 700 / 1.4 (33.6px)** | `--tc-typography-heading-4` |
| `--h5`, `prose h5` | `:98`, `:26` `text-lg` → **18px / 600 / 1.5556 (28px)** | → **20px / 700 / 1.5 (30px)** | `--tc-typography-title` |
| `--h6`, `prose h6` | `:102`, `:30` `text-base font-semibold` → **16px / 600 / 1.5 (24px)** | **font-weight only** → 16px / **700** / 1.5 | `--tc-typography-subtitle`; size + leading already resolve to the token's values, so restating them would be duplication (§0 N5's spirit) |

The ramp stays strictly monotonic and every step is a real token. Tzu Chi has exactly six heading
steps and HeroUI exactly six levels, so the mapping is forced, not chosen.

### 4.2 Body, code and the prose block elements

| selector | HeroUI base (file:line → resolved) | now → resolved | spec rule |
|---|---|---|---|
| `--body`, `prose p`, `prose li` | `:106`, `:34`, `:58` `text-base leading-7` → 16px / **1.75 (28px)** | `line-height: --tc-line-height-relaxed` → 16px / **1.6 (25.6px)** | §1 **R5** (`--tc-typography-body` = 400 16px/1.6) |
| `--body-sm` | `:110` `text-sm leading-6` → **14px / 1.714 (24px)** | `--tc-font-size-16` + `--tc-line-height-normal` → **16px / 1.5 (24px)** | §1 preamble (no 14px step) + **R15**'s shipped 400 16px/1.5 (`tooltip.css:64-66`) |
| `--body-xs` | `:114` `text-xs leading-5` → **12px / 1.667 (20px)** | **unchanged** | §1 **R8** + §1.3 — caption/overline keeps 12px |
| `--code`, `prose code` | `:118`, `:38` `rounded-md` → **6px**; `text-sm` → **14px / 1.4286** | `--tc-radius-sm` → **4px**; `--tc-font-size-16` → **16px**; `--tc-line-height-relaxed` → **1.6 (25.6px)** | §2 **R33** (same cell as Kbd); §1 preamble; R5's prose leading |
| `prose pre` | `:66` `rounded-xl` → **12px**; `text-sm` → 14px; `leading-relaxed` → 1.625 | `--tc-card-radius` → **16px**; **16px**; **1.6** | §2 **R27** (a resting panel of content in the flow); 12px is off this scale entirely (0/4/8/16) |
| `prose img` | `:78` `rounded-xl` → **12px** | `--tc-card-radius` → **16px** | §2 **R27**; corroborated by tc's own media: `tc-article-card.styles.ts:17` / `tc-book-card.styles.ts:17` give the picture `border-radius: inherit` from a 16px card |
| `prose a` | `:42` `font-medium` → **500**; `underline-offset-4` → **4px** | `--tc-font-weight-bold` → **700**; `text-underline-offset: 0.15em` → scales with size | §1 **R18** (`link.css:32-41`), both of its declarations, exactly |
| `prose strong` | `:70` `font-semibold` → **600** | `--tc-font-weight-bold` → **700** | §0 token list: the scale has 400 / 500 / 700 only |

### 4.3 Weight modifiers — restated, not changed

| class | base → resolved | restated as | why |
|---|---|---|---|
| `--weight-normal` | `:150` `font-normal` → 400 | `var(--tc-font-weight-regular, 400)` → **400** | must out-rank the (0,2,0) heading rules above |
| `--weight-medium` | `:154` → 500 | `var(--tc-font-weight-medium, 500)` → **500** | same |
| `--weight-semibold` | `:158` → 600 | `var(--font-weight-semibold, 600)` → **600** | same; 600 has **no** Tzu Chi step, so it is kept verbatim via HeroUI's own theme variable (§5 R88 case ①) |
| `--weight-bold` | `:162` → 700 | `var(--tc-font-weight-bold, 700)` → **700** | same |

**Why longhands, never `font:`.** The `font` shorthand (R12's form in `card.css`) also resets
`font-family` and `font-weight`, and at (0,2,0) it would out-rank `.typography--weight-*` (0,1,0),
silently killing the `weight` prop on every heading. Longhands + a restatement of the four weight
classes at matching specificity, later in source, keeps every variant alive. This is the same
"restated, not changed" pattern as `badge.css:69-74`.

**Cascade.** `.typography--*` rules: (0,2,0) vs base (0,1,0). `.typography-prose <el>` rules:
(0,2,1) vs base (0,1,1). Every rule wins on specificity alone — no import-order dependency.

### 4.4 The one real decision: the two sub-16px variants

Tzu Chi has no 14px and no 12px step. §1's mechanical rule sends both to 16px — but Typography's
entire public API **is** its size ramp, and collapsing `body-sm` and `body-xs` onto `body` would
leave two props that render identically, which HARD RULE 5 forbids. So each took the nearest rule
that already exists instead of the mechanical one:

* **`body-sm` → 16px / 1.5.** The variant survives on the line-height ladder rather than a size
  step Tzu Chi does not have. 400 16px/1.5 is not invented: it is R15's shipped tooltip metric
  (`tooltip.css:64-66`, from `tc-tooltip`). Result: `body` 25.6px line box, `body-sm` 24px.
* **`body-xs` → unchanged at 12px.** In every story it is the overline/caption above other copy
  ("BODY — SMALL", "START (DEFAULT)"), which is R8's role — the one place §1.3 deliberately keeps
  12px, "a structural label above 16/700 rows … raising it would make it compete with the rows it
  introduces".

### Left as HeroUI's (and why)

| kept | why |
|---|---|
| `tracking-tight` (-0.025em) on all six headings | Tzu Chi's tokens carry **no** letter-spacing and no `tc-*` component sets one, so there is no value to move it to. Flagged as a gap (negative tracking on CJK deserves an owner decision, not a guess). |
| `font-mono` on `code` / `pre` | No Tzu Chi mono token; §10-style "no counterpart, leave it". |
| inline `code`'s `px-1.5` / `py-0.5` (6 / 2px) | Sub-token optical values on a tiny inline chip — the same call §10 D5 made for `.badge__label` padding. |
| `blockquote` `mt-4` / `border-s-4` / `ps-4` / `text-muted` / italic (`:46`) | 16 / 4 / 16px are already Tzu Chi space steps; colours are already theme variables. |
| `ul` / `ol` `my-4 space-y-2 ps-6` (`:50`, `:54`), `hr` `my-8` (`:62`) | 16 / 8 / 24 / 32px — all Tzu Chi space steps. |
| prose `a`'s **colour** (`text-link`) | R18's declaration column lists only the weight and the underline offset. `link.css` re-anchors `.link` to `--accent-hover`, but that is not part of R18, so a prose `<a>` keeps `--link`. |
| `.typography` / `.typography-prose` roots; `align`, `color`, `truncate` modifiers | Nothing the spec reaches. |

---

## 5. ScrollShadow — **no file**

ScrollShadow renders **no chrome at all**: it is a `mask-image` built from `linear-gradient`s,
driven either by `data-*-scroll` attributes or by a scroll timeline. Checked property by property:

| what | base | verdict |
|---|---|---|
| `--scroll-shadow-size` | `scroll-shadow.css:4` `40px` | Already `--tc-space-40`. |
| `--scroll-shadow-scrollbar-size` | `:5` `10px` | A scrollbar *measurement*, not a design value — changing it would misalign the mask from the real scrollbar. |
| `#000` inside the gradients | `:62`, `:81`, `:103`, … | Mask **alpha** channels, not visible colour. Nothing is painted, so §0 N2/N4's colour rules have no target here; replacing them would break the mask. |
| radius / border / type / state / track | — | None exist. |
| `@keyframes` + `animation-timeline` (`:23-39`, `:164-198`) | scroll-driven fade | §8 R140: no new choreography, keep HeroUI's. The `animation` shorthand is load-bearing (its own comment at `:158-163` explains that an `animate-*` utility would pin both fades at 0px) — touching it is the one thing that would actually break the component. |

**"Almost certainly nothing to change" — confirmed: nothing to change.**

---

## Spec gaps (derived, not traceable to Figma — owner sign-off wanted)

1. **Avatar fallback voice.** No `tc-avatar` exists (§12 Q8). 700 16px/1.5 is R1 via §1.2 (the
   initials are the text the avatar *is*), and holding one size across sm/md/lg follows §3.2's
   button precedent. A reviewer could instead read the initials as a *glyph* like `.badge__label`,
   which §1.3 keeps at 12px. The visible consequence: `sm` initials grow 12 → 16px.
2. **Avatar box sizes and radius were not touched** on the argument that `badge.css:6-13` already
   depends on 32/40/48 and that HeroUI's radii already clamp to a circle. If Figma ever specifies an
   avatar ramp, Badge must move with it.
3. **Avatar icon fallbacks** are sized `1em`, so they are now 16px at every avatar size (was
   12/14/16). A 16px glyph in a 48px `lg` circle is small; §3.3's icon ramp (20/32/40px) is written
   for icon-**buttons**, so it was not borrowed. Worth a look.
4. **Kbd radius 8px → 4px** is R33 by analogy (pagination cell / checkbox / tooltip), not by
   citation. The competing reading is "it is already `--radius`, leave it".
5. **Kbd height/padding left at 24 / 8px** — the spec has no Kbd metric, and R40/R41's control
   heights are for things you click. A 16px/700 legend in a 24px cap is snug by design.
6. **Kbd foreground** moves `--muted` → `--default-foreground` for **both** variants, including
   `--light` (which has no fill). Justified because the colour was never the variant tell and
   because `--default-foreground` ≡ `--foreground` in this theme (§11 I7), so an unboxed cap simply
   reads as bold body text.
7. **`typography--body-sm` → 16px/1.5.** The most consequential derivation in this unit: a public
   `size` variant kept alive on the line-height ladder because Tzu Chi has no sub-16px size. Needs
   sign-off — the alternatives are "collapse it into `body`" (dead prop) or "leave it at 14px"
   (off-scale).
8. **`typography--body-xs` kept at 12px** under R8 rather than raised under R6. If the owner reads
   it as a helper line rather than an overline, it should go to 16px/1.6 — and then it collapses
   into `body`, per gap 7.
9. **`prose pre` and `prose img` → 16px (R27)** rather than 8px (R35/R36). Both are off-scale at
   HeroUI's 12px so something had to move; 16px was chosen because neither is an interactive
   container, and tc's own media inherits a 16px card radius.
10. **`tracking-tight` left in place** on all six headings. Tzu Chi has no letter-spacing token at
    all; -0.025em on `Noto Sans TC` (i.e. on CJK text) is an owner decision, not an override.
11. **`weight="semibold"` (600) kept, but `<strong>` moved to 700.** Deliberate split: the prop
    names a HeroUI weight step explicitly (R88 case ① — keep it), while `<strong>` is semantic
    emphasis in prose and should be the system's only bold.
12. **Inline `code` at 16px** now matches the surrounding paragraph's size; because `font-mono`'s
    glyphs are wider, it will *read* slightly larger than the prose around it. HeroUI stepped it
    down to 14px precisely to avoid that, but 14px does not exist in this scale.
