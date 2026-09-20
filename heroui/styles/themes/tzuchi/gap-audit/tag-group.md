# tag-group / tag — Tzu Chi ↔ HeroUI gap inventory

**Override file:** `heroui/styles/themes/tzuchi/components/tag.css`
(drafted at `scratchpad/atoms2/css/tag.css`)
**No `tag-group.css`** — see "TagGroup: why no file" below.

**Closeness: major gaps.** Same verdict, and mostly the same rows, as pass 1's `chip.md`: the two
agree on `font-weight: 500`, `gap: 4px`, `cursor: pointer` and `user-select: none`, and nothing
else about the box. Tag is HeroUI's *interactive* half of what Tzu Chi ships as a single
`tc-chip`, so on top of the shape work this pass also has to place `selected`, the remove button
and the states — the rows `chip.md` had to file under "not transferable".

Sizes after the override: **sm 34px · md 40px · lg 48px** (was 20 / 24 / 32) — byte-identical to
the three steps `chip.css` produced, so a Chip and a Tag of the same size are the same pill.

---

## Variant / size mapping

| tc | HeroUI | note |
|---|---|---|
| `tc-chip` (resting tonal pill) | `<Tag>` unselected | **shape transferred, colour deliberately not** — see "The one colour decision" below |
| `tc-chip[selected]` (`tc:46-49`) | `.tag[data-selected="true"]` (`hero tag:46-55`) | fill kept (HeroUI's `--accent-soft` **is** tc's resting `brand.surface`), tc's border affordance added |
| `tc-chip[removable]` → `.remove` (`tc:85-121`) | `.tag__remove-button` (`hero tag:94-108`), a `CloseButton` | size / hit area / glyph / rest colour transferred |
| `tc-chip[disabled]` (`tc:62-65`) | `.tag[data-disabled="true"]` (`hero tag:32-34`) | already identical |
| `tc-chip:focus-visible` (`tc:52-60`) | `.tag:is(:focus-visible,[data-focus-visible])` (`hero tag:37-39`) | already identical |
| `tc-chip` (one size) | `.tag--md` — HeroUI's default | anchored here: `tagVariants.defaultVariants` is `size: "md", variant: "default"` |
| — | `.tag--sm` | no tc counterpart → one step down the same Tzu Chi type scale (`--tc-font-size-16`), exactly as `chip--sm` |
| — | `.tag--lg` | no tc counterpart → one density step up (`--tc-space-8` / `--tc-space-16`), exactly as `chip--lg`; lands on 48px = `--tc-size-control-md` |
| `tc-chip variant="assist" / "filter"` | — | tc's two variants are visually identical (`tc-chip.ts:27`; the styles file has no `[variant]` selector). "filter" only adds the `selected` behaviour |
| — | `variant="default"` / `variant="surface"` | no tc counterpart — both inherit the new shape, both keep their own colours |

---

## Gap table

`tc` = `packages/components/src/chip/tc-chip.styles.ts`, values resolved through
`packages/tokens/dist/tokens.css`.
`hero tag` / `hero close` / `hero tg` = `heroui/styles/components/{tag,close-button,tag-group}.css`,
resolved with this theme's `--radius: 8px` (`themes/tzuchi/variables.css:19`), `--spacing: 0.25rem`
(`themes/default/variables.css:18`) and a 16px root; verified against the built Storybook CSS
(`storybook-static/assets/iframe-BlNYcVg2.css`).

### Box, density, type

| property | Tzu Chi | HeroUI | action |
|---|---|---|---|
| **border-radius** | `tc:27` `--tc-chip-radius` → `--tc-radius-full` → **9999px** (`tokens.css:171`, `:52`) | `hero tag:5` `rounded-xl` = `--radius * 1.5` = **12px** (`--lg` `rounded-2xl` = 16px) | **changed** → `var(--tc-chip-radius, 9999px)` on the base, which also outranks `.tag--lg` |
| **border width / style / colour** | `tc:26` **1px solid transparent**; `selected` flips the colour | none (**0px**) | **changed** → `border: 1px solid transparent`. Part of tc's box (2 of the 40px) and the hook `selected` needs. Same decision and same value as `chip.css:52` |
| **height (rendered, md)** | 1+1 border + 4+4 padding + 30px line box = **40px** | 4+4 padding + 16px line box = **24px** | **changed** as a consequence of border + padding + type |
| **height — sm / lg** | — | **20px** / **32px** | **changed** → **34px** / **48px**, identical to `chip.css`'s sm/lg |
| **min-block-size** | `tc:21` `31px` — *non-binding*, the comment predates the 20px type | none | **kept** — `chip.md` made the same call; copying a dead 31px floor would be noise |
| **padding-block** | `tc:22` `--tc-space-4` = **4px** | `hero tag:8` `py-1` = **4px**; `--sm` `py-0.5` = 2px; `--lg` `py-1.5` = 6px | **base kept** (already 4px, restated only because the base rule must out-specify `.tag--sm`'s 2px); `--lg` **changed** → `var(--tc-space-8, 8px)` |
| **padding-inline** | `tc:22` `--tc-space-12` = **12px** | `hero tag:8` `px-2` = **8px**; `--sm` 8px; `--lg` `px-2.5` = 10px | **changed** → base `var(--tc-space-12, 12px)`, `--sm` `var(--tc-space-8, 8px)`, `--lg` `var(--tc-space-16, 16px)` — the same three values as `chip.css` |
| **gap** | `tc:19` `--tc-space-4` = **4px** | `hero tag:5` `gap-1` = **4px** | **kept — already matches.** (Chip needed a rule here; Tag does not. It is also what gives tc's `margin-inline-start: 4px` on the remove button for free.) |
| **font-family** | `tc:23` `--tc-typography-tab-sm` → `'Noto Sans TC', system-ui, …` (`tokens.css:142`) | inherits `--font-sans` | **kept** — `variables.css:25` already routes `--font-sans` to `--tc-font-family-base`, same stack |
| **font-size** | **20px** (`tab-sm`) | `hero tag:8` `text-xs` = **12px**; `--sm` 12px; `--lg` `text-sm` = 14px | **changed** → base/md **20px**, `--sm` **16px** (`--tc-font-size-16`); `--lg` inherits the base 20px, exactly as `chip--lg` does |
| **font-weight** | **500** | `hero tag:5` `font-medium` = **500** | **kept — already matches.** Unlike `.chip--lg`, no Tag size modifier re-applies a weight, so there is nothing to restate |
| **line-height** | `1.5` → **30px** at 20px | `hero tag:8` `--text-xs--line-height` = **16px**; `--lg` 20px | **changed** → `var(--tc-line-height-normal, 1.5)` |
| **white-space** | `tc:30` `nowrap` | not set (normal) | **kept** — `chip.md` left this to HeroUI too; adding it on Tag alone would make Chip and Tag differ. Flag it for a follow-up pass that changes both |
| **justify-content** | `tc:18` `center` | not set | **kept** — no effect on a shrink-to-fit `inline-flex` box |
| **user-select** | `tc:29` `none` | `hero tag:5` `select-none` | **kept — identical** |
| **cursor** | `tc:28` `pointer` | `hero tag:23` `var(--cursor-interactive)` = **pointer** (`themes/default/variables.css:29`) | **kept — identical** |
| **leading-icon size** | `tc:74-77` `--tc-size-icon-sm` = **20px** (`tokens.css:53`) | `hero tag:27` `size-3` = **12px**, fixed at every size | **changed** → `inline-size/block-size: 1em`, i.e. **20px** at md (= `--tc-size-icon-sm` exactly) and 16px at `--sm`. `chip.css` gets this behaviour for free from Iconify's own `1em` default; HeroUI's fixed `size-3` here would have pinned the icon at 12px against 20px text |
| **elevation** | none | none | **kept** |

### Variants and states

| property | Tzu Chi | HeroUI | action |
|---|---|---|---|
| **resting fill — tonal** | `tc:25` `--tc-chip-bg` → `color.brand.surface` = **#e8eefe** light / **#1b2d58** dark (`tokens.css:115`, `:416`) | `.tag--default` (`hero tag:72`) → `--default` = **#f2f2f2** / **#333333**; `.tag--surface` (`hero tag:83`) → `--surface` = **#ffffff** / **#1c1c1e** | **kept — deliberate.** See "The one colour decision" |
| **resting label** | `tc:24` `--tc-chip-fg` → `color.brand.primary` = **#1b2d58** / **#a9c2ea** | `--default-foreground` = **#333333** / **#f2f2f2**; `--surface-foreground` = same pair | **kept — deliberate**, same reason |
| **hover (unselected)** | `tc:41-43` bg → `brand.surface-hover` = **#d1deff** / **#30559f** | `hero tag:76` `--default-hover` = `color-mix(--default 96%, --default-foreground 4%)`; `hero tag:87` `--surface-hover` = `color-mix(--surface 92%, --surface-foreground 8%)` | **kept** — structurally the same move (one tonal step on the resting fill), expressed in HeroUI's own variant colours |
| **selected — fill** | `tc:46-47` bg → `--tc-chip-bg-hover` = `brand.surface-hover` = **#d1deff** / **#30559f** | `hero tag:47` `--accent-soft` = **#e8eefe** / **#1b2d58** (`themes/tzuchi/variables.css:33`, `:75`) | **kept.** tc's selected fill is one tonal step *past* its resting fill; HeroUI reserves exactly that step for **selected + hover** (`hero tag:50-54` → `--accent-soft-hover` = #d1deff / #30559f, the identical value). Pushing selected down to it would collapse the two and lose the hover feedback. Note the upside: HeroUI's `--accent-soft` + `--accent-soft-foreground` pair *is* tc-chip's resting palette, so a selected Tag reads exactly like a resting tc-chip |
| **selected — label** | `tc:24` unchanged (`brand.primary`) | `hero tag:47` `--accent-soft-foreground` = **#1b2d58** / **#a9c2ea** | **kept — identical** to `brand.primary` in both modes |
| **selected — border** | `tc:48` `border-color: --tc-chip-fg` (`brand.primary`) — tc's actual "selected" signal | none; HeroUI signals selection by fill alone | **changed** → `border-color: currentColor` on `[data-selected="true"], [aria-selected="true"]`. `currentColor` resolves to `--accent-soft-foreground` in **both** Tag variants, because HeroUI's own selected rule (specificity 0,2,0) repaints the label over `.tag--default` / `.tag--surface` (0,1,0) |
| **pressed** | none | `hero tag:42-43` — rule present, **empty** | **kept** — nothing on either side |
| **focus-visible** | `tc:56-60` `outline: --tc-focus-ring-width (2px) solid --tc-chip-focus-ring-color`, `outline-offset: --tc-focus-ring-offset` (2px). Note `--tc-focus-ring-color` stays `blue-500` **#4f7bbe** in dark (`tokens.css:130`) | `hero tag:38` → `status-focused` → `focus-ring` (`utilities/index.css:2-6`): 2px ring in `--focus`, `--tw-ring-offset-width: var(--ring-offset-width)` | **kept — already matches.** `variables.css:24` routes `--ring-offset-width` from `--tc-focus-ring-offset` (2px) and `:47` / `:89` set `--focus` to blue-500 / blue-300. HeroUI's offset paints `--background` in the 2px gap where tc leaves it transparent — invisible on the page background |
| **disabled** | `tc:62-65` `opacity: --tc-chip-disabled-opacity` = **0.38** (`tokens.css:172`, `:58`), `cursor: not-allowed` | `hero tag:33` → `status-disabled` (`utilities:61-65`): `opacity: var(--disabled-opacity)`, `cursor: var(--cursor-disabled)`, `pointer-events: none` | **kept — already matches.** `variables.css:23` maps `--disabled-opacity` to `--tc-opacity-disabled` = 0.38 and `--cursor-disabled` is `not-allowed`. HeroUI adds `pointer-events: none` (which, strictly, means the `not-allowed` cursor never shows) — upstream's call, unchanged |
| **motion** | `tc:31-33` `background-color, border-color` over `--tc-motion-duration-fast` **150ms** `--tc-motion-easing-standard` `cubic-bezier(0.2,0,0,1)` (`tokens.css:62`, `:64`) | `hero tag:14-19` `color, scale, opacity, background-color` 100ms `--ease-smooth` (= `ease`) + `box-shadow` 100ms `--ease-out` | **changed** → the same five properties **plus `border-color`**, at 150ms / `motion.easing.standard`. Without `border-color` the new selected border would snap in while the fill fades. Guarded by `@media (prefers-reduced-motion: no-preference)` **and** `:not(:is([data-reduce-motion="true"], [data-reduce-motion="true"] *))`, because the rule is (0,2,0) — the same specificity as HeroUI's `motion-reduce:transition-none` — and sits later in the layer, so it would otherwise beat both reduced-motion switches (`styles/variants/index.css:23`, `:34`). Note: pass 1's `accordion.css:67-73` guards only the media query; that file has the `data-reduce-motion` hole, this one does not |

### Remove button

Classes on the element are `close-button close-button--default tag__remove-button`
(`tag.tsx:95-108` → `CloseButtonRoot` composes its own two onto the passed one; `cx` from
`tailwind-variants` concatenates, it does not tailwind-merge). `tag.css` is imported after
`close-button.css` (`components/index.css:18`, `:55`), so at equal specificity the `tag__*` rules
already win upstream.

| property | Tzu Chi | HeroUI | action |
|---|---|---|---|
| **box size** | `tc:93-94` `--tc-size-icon-sm` = **20px** | `hero close:5` `h-6 w-6` = 24px, beaten by `hero tag:102` `size-3` = **12px** | **changed** → `var(--tc-size-icon-sm, 20px)` |
| **padding** | `tc:92` **0** | `hero close:5` `p-1` = **4px** (leaving a 4px content box inside the 12px button, with the glyph overflowing) | **changed** → `0` |
| **border-radius** | `tc:98` `--tc-radius-full` = **9999px** | `hero close:5` `rounded-xl` = **12px** | **changed** → `var(--tc-radius-full, 9999px)` |
| **glyph size** | `tc:118-121` `100%` → **20px** (the drawn X spans 12 of the 24 viewBox units ≈ 10px) | `hero tag:106` `size-[inherit]` → **12px**, plus `hero close:42` `-mx-0.5 my-0.5` = −2px inline / +2px block | **changed** → `100%` (= 20px) and `margin: 0`. HeroUI's `CloseIcon` X spans 9 of its 16 viewBox units, so at 20px it draws ≈11px — within a pixel of tc's. The optical margins were sized for a 16px glyph in a padded 24px button and are wrong at 20px/0 |
| **hit area** | none (the 20px box is the target) | `hero tag:102` `touch-target` → 24px centred `::after` (`utilities:41-46`) | **kept.** It now overhangs the visible button by 2px instead of 6px, comfortably inside `.tag-group__list`'s 6px gap — upstream's own worry (`hero tag:95-101`) is resolved by the bigger button |
| **spacing from the label** | `tc:91` `margin-inline-start: --tc-space-4` = **4px** | none — the `.tag`'s own `gap: 4px` | **kept — identical result.** No margin rule needed |
| **fill at rest** | `tc:96` `transparent` | `hero close:48` `--default` = **#f2f2f2** / **#333333** — a permanent grey chip | **changed** → `transparent`, using the exact `:not(:hover, [data-hovered="true"], :active, [data-pressed="true"])` guard `modal.css:110-118` already uses for the dialog's close trigger, so the rule goes inert the moment any of those states is active |
| **fill on hover** | `tc:104-106` `brand.surface` = **#e8eefe** / **#1b2d58** | `hero close:57` `--default-hover` | **kept — handed back to upstream** by the `:not()` guard above. tc's value is "the chip's own resting tone", which only reads as feedback because a tc chip is always tonal; on a neutral Tag `--default-hover` is the equivalent move in HeroUI's palette |
| **pressed** | none | `hero close:63` `transform: scale(.93)` | **kept** — none of the rules here touch `transform` |
| **focus-visible** | `tc:112-116` 2px outline, 2px offset | `hero close:22-25` → `status-focused` | **kept — matches** (same ring, same theme variables as the tag's own) |
| **disabled** | `tc:108-110` `cursor: not-allowed` | `hero close:28-31` → `status-disabled` (0.38 + not-allowed + pointer-events none) | **kept** — `status-*` never sets `background-color`, so the transparent-at-rest rule cannot interfere |
| **pending** | no counterpart | `hero close:34-36` `status-pending` | **kept** — untouched |
| **colour** | `tc:95` `inherit` | `hero close:48` `text-muted`, beaten by `hero tag:102` `text-inherit` | **kept — already matches** |
| **motion** | `tc:100-101` `background-color` 150ms standard | `hero close:14-18` transform 250ms / colour 150ms / background 100ms / shadow 150ms | **kept** — retiming a shared `CloseButton` from inside the Tag override would either leak (if scoped to `.close-button`) or fork the two close buttons this theme styles; the 50ms difference on one background fade is not worth that |

---

## The one colour decision

`chip.md` could say "colours need zero work" because `<Chip color="accent" variant="soft">` lands
on `--accent-soft` / `--accent-soft-foreground`, which the Tzu Chi theme maps straight to
`brand.surface` / `brand.primary` — tc-chip's palette exactly.

Tag has no such variant. Its two variants are `default` (neutral `--default` fill) and `surface`,
and HeroUI reserves the accent-soft tonal pair for the **selected** state. So an unselected Tag is
grey where a resting tc-chip is blue.

Forcing `--accent-soft` onto the resting Tag was rejected:

1. it would erase the `default` ↔ `surface` distinction — both variants would paint the same,
   which is exactly what rule 5 forbids;
2. it would erase the selected ↔ unselected distinction, since selected is *also* `--accent-soft`,
   and there is nothing left to promote it to (`--accent-soft-hover` is already taken by
   selected + hover);
3. it is not a shape gap. tc-chip is a *filter pill* that is always tonal; HeroUI's Tag is a
   selectable list item that earns colour. Both are coherent designs, and the interactive tc-chip
   is reproduced faithfully by the *selected* Tag.

Result: shape, density, type, icon, the selected border, the remove button and motion transfer;
the resting palette stays HeroUI's, per variant. **Consumers who want a row of resting tc-chips
should render `<Chip color="accent" variant="soft">`** — that is what pass 1 tuned, and after this
pass it is the same pill as a Tag, to the pixel.

---

## TagGroup: why no file

| property | Tzu Chi | HeroUI | action |
|---|---|---|---|
| list gap | — | `hero tg:7` `gap-1.5` = **6px** | **kept** — tc ships no chip-group component (`tc-chip` is used loose; the only container that arranges chips, `tc-article-card`'s badge slot, takes one). With no Figma decision to port, 6px is not a gap, it is upstream's default |
| group gap (label → list) | — | `hero tg:3` `gap-1` = **4px** | **kept** — same reason |
| description / error padding | — | `hero tg:10-15` `p-1` = **4px** | **kept** — same reason; also shared with the Field components, which are out of scope here |
| wrapping | — | `hero tg:7` `flex-wrap` | **kept** |

---

## Cascade check

`themes/tzuchi/components/index.css` is imported `layer(components)` after
`styles/components/index.css` (`themes/tzuchi/index.css:15`, `styles/index.css:14`) — same layer,
later. Specificities:

| rule | spec. | must beat | spec. |
|---|---|---|---|
| `[data-theme^="tzuchi"] .tag` | (0,2,0) | `.tag`, `.tag--sm`, `.tag--md`, `.tag--lg` | (0,1,0) |
| `[data-theme^="tzuchi"] .tag--sm` / `--lg` | (0,2,0) | the base override at (0,2,0), later in file | (0,2,0) |
| `[data-theme^="tzuchi"] .tag svg` | (0,2,1) | `.tag svg`, `.close-button svg`, `.tag__remove-button svg` | (0,1,1) |
| `…:is([data-selected="true"], [aria-selected="true"])` | (0,3,0) | the base override's `border: … transparent` | (0,2,0) |
| `[data-theme^="tzuchi"] .tag__remove-button` | (0,2,0) | `.tag__remove-button`, `.close-button` | (0,1,0) |
| `….tag__remove-button.close-button--default:not(…)` | (0,4,0) | `.close-button--default:hover` | (0,2,0) |
| `[data-theme^="tzuchi"] .tag__remove-button svg` | (0,2,1) | the `.tag svg` override at (0,2,1) — **hence its position last in the file** | (0,2,1) |

No `!important` anywhere. Two ordering constraints are load-bearing and are commented in the file:
the `--sm` / `--lg` restatements must follow the base rule, and the remove-button `svg` rule must
follow the `.tag svg` rule.

Checked mechanically on the drafted file: 8 comment blocks, every one closing where intended (rule
8 — no `*` immediately followed by `/` inside a comment); brace balance 0; zero `--tc-color-*`
references, zero component-colour tokens, zero hex / rgb / hsl / oklch literals (only `transparent`
and `currentColor`); zero physical `left` / `right` properties. Every `--tc-*` token referenced is
dimension- or number-valued and mode-independent: `--tc-chip-radius` → `--tc-radius-full` = 9999px
(`tokens.css:171`, `:52`), `--tc-space-4/8/12/16` = 4/8/12/16px (`:38-41`), `--tc-font-size-16/20`
= 16/20px (`:85-86`), `--tc-line-height-normal` = 1.5 (`:93`), `--tc-size-icon-sm` = 20px (`:53`),
`--tc-radius-full` = 9999px (`:52`), `--tc-motion-duration-fast` = 150ms (`:62`),
`--tc-motion-easing-standard` = `cubic-bezier(0.2, 0, 0, 1)` (`:64`).

**No new theme variables are needed** — `extraThemeVars` is empty.

---

## Verification targets

Story `components-collections-taggroup--default` (`tag-group.stories.tsx:25-48`) renders a
`TagGroup` with `selectionMode="single"` and four `<Tag>`s carrying an Iconify icon. With no
`size` / `variant` on the group, `tagVariants.defaultVariants` gives every tag
`class="tag tag--md tag--default"`. React Aria renders the tag as the `role="row"` div that carries
those classes, with a `display: contents` gridcell inside, so the tag's flex layout applies
directly to the icon and the label (`react-aria-components/dist/private/TagGroup.mjs:212-228`).
Nothing is selected or focused initially.

| story | selector | property | expected |
|---|---|---|---|
| `…taggroup--default` | `.tag` | `border-top-left-radius` | `9999px` |
| `…taggroup--default` | `.tag` | `height` | `40px` (1+1 border + 4+4 padding + 30px line box) |
| `…taggroup--default` | `.tag` | `padding-inline-start` | `12px` |
| `…taggroup--default` | `.tag` | `font-size` | `20px` |
| `…taggroup--default` | `.tag` | `line-height` | `30px` |
| `…taggroup--default` | `.tag` | `border-top-width` | `1px` |
| `…taggroup--with-remove-button` | `.tag__remove-button` | `width` | `20px` |
| `…taggroup--with-remove-button` | `.tag__remove-button` | `border-top-left-radius` | `9999px` |

The remove-button assertions use `components-collections-taggroup--with-remove-button`
(`tag-group.stories.tsx:291-384`): its first `TagGroup` passes `onRemove`, so `allowsRemoving` is
true and the default `<Tag.RemoveButton>` renders immediately, with HeroUI's inline
`<CloseIcon>` — no network fetch, unlike the Iconify icons in the Default story, whose size is
therefore not asserted.

---

## notTransferable

- **tc-chip's resting tonal palette** — `brand.surface` fill + `brand.primary` label on an
  *unselected* Tag. HeroUI spends that exact pair on `[data-selected]` and needs the neutral
  resting fill to keep `variant="default"` and `variant="surface"` apart. Reproduced by
  `<Chip color="accent" variant="soft">` (pass 1) or by a *selected* Tag.
- **tc's one-step-darker selected fill** (`brand.surface-hover`) — HeroUI already uses that value
  for selected + hover; taking it for plain selected would collapse the two states.
- **tc-chip's own `hover` fill** on the unselected pill — same reason; HeroUI's per-variant
  `--default-hover` / `--surface-hover` is the equivalent move in the variant's own colour.
- **The remove button's hover fill** (`brand.surface`) — it only reads as feedback against tc's
  permanently tonal chip. Handed back to `close-button.css`'s `--default-hover`.
- **`white-space: nowrap`** (`tc:30`) — a real difference, but pass 1 left it off Chip; it should
  be added to both files or neither, in a pass that owns both.
- **`min-block-size: 31px`** (`tc:21`) — dead in tc itself (the 20px type already makes the pill
  40px). Not copied, same call as `chip.md`.
- **tc's remove-button hover / focus geometry inside a `delegatesFocus` shadow root**
  (`tc-chip.ts:139` `tabindex="-1"` on the button, focus living on the host) — behavioural, and
  HeroUI's remove button is a real focusable `<button>` in the tag's roving-tabindex row.
- **HeroUI-only surface with no tc counterpart, left untouched:** `variant="surface"`, the
  `pending` state on the remove button, `TagGroup`'s label / description / error-message slots and
  its `renderEmptyState`, and `data-selection-mode` / `data-allows-removing`.
