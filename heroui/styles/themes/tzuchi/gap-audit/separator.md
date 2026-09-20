# separator — tc-divider ↔ HeroUI Separator

**Verdict: already matches.** Thickness, colour and both orientations are identical once
`--separator` points at Tzu Chi's `border.default`. The override file carries exactly two rules,
both for HeroUI variants Tzu Chi does not have (`secondary`, `tertiary`).

Sources read

| side | files |
|---|---|
| Tzu Chi | `/Users/kaellim/Desktop/Personal/CISwebsite/packages/components/src/divider/tc-divider.styles.ts`, `tc-divider.ts`, `/Users/kaellim/Desktop/Personal/CISwebsite/packages/tokens/src/component/divider.tokens.json` |
| resolved values | `/Users/kaellim/Desktop/Personal/CISwebsite-heroui-spike/packages/tokens/dist/tokens.css` (L14–27, 40–41, 49–50, 85, 101, 119, 124, 173–175, 281–282, 420–425) |
| HeroUI | `heroui/styles/components/separator.css`, `heroui/styles/src/components/separator/separator.styles.ts`, `heroui/react/src/components/separator/separator.tsx` + `separator.stories.tsx`, `heroui/styles/themes/default/variables.css` (L115, 172–173, 251, 313–314), `heroui/styles/themes/shared/theme.css` (L27, 96–97, 104–105) |
| consumers of `.separator` | `styles/components/toolbar.css` L9–16, `menu.css` L8–11, `dropdown.css` L127–130, `list-box.css` L21–24 |

Resolved Tzu Chi values used below (from `tokens.css`): `divider.color` = `border.default` =
gray-300 `#bdbdbd` (light) / gray-750 `#6b6b6e` (dark); `divider.thickness` 1px;
`divider.spacing` 16px; `divider.label-gap` 12px; `divider.font-size` 16px;
`divider.label-fg` = `text.muted` = gray-700 `#828282` / gray-400 `#b3b3b3`.

## Gap table

| property | Tzu Chi | HeroUI | action |
|---|---|---|---|
| line colour (default variant) | `tc-divider.styles.ts:26` `--tc-divider-color` → `border.default` = `#bdbdbd` / `#6b6b6e` | `separator.css:5,21` `bg-separator` → `--separator`; `themes/tzuchi/variables.css:46,88` maps it to gray-300 / gray-750 | **kept — byte-identical mapping already in the generated theme.** |
| thickness — horizontal | `tc-divider.styles.ts:24` `block-size: 1px` | `separator.css:8,13` `h-px` = 1px | kept — same. |
| thickness — vertical | `tc-divider.styles.ts:32` `inline-size: 1px` | `separator.css:17` `w-px` = 1px | kept — same. |
| width — horizontal | `tc-divider.styles.ts:25` `inline-size: 100%` | `separator.css:8,13` `w-full` = 100% | kept — same. |
| height — vertical | `tc-divider.styles.ts:33` `block-size: 100%` of the host | `separator.css:17` `h-auto` + `self-stretch` (fills the flex line) | kept — different mechanism, same result; HeroUI's is the more composable of the two. |
| min-size — vertical | `tc-divider.styles.ts:34` `min-block-size: 1em` (= 16px at the 16px base) | `separator.css:17` `min-h-2` = 8px | **kept.** `divider.tokens.json` has no min-size token, so 1em is a Lit implementation detail, not a Figma decision. Raising the floor would also collide with `toolbar.css:9–11`, which sizes vertical separators at `height: 50%`. |
| border-radius | none (square ends) — no radius rule in `tc-divider.styles.ts` | `separator.css:5` `rounded-sm` = `calc(var(--radius) * 0.5)`; under Tzu Chi `--radius` = `--tc-radius-md` 8px → **4px specified** | **kept — invisible.** On a 1px-thin box the used radius is clamped to 0.5px, so the line renders square either way. Changing it would only alter a computed value nobody sees. |
| border width / style | `tc-divider.styles.ts:27` `border: 0` — the line is a painted background, not a border | `separator.css:5` `border-t-0 border-b-0`, line is `background-color` | kept — same technique, same result (0 borders). |
| padding | none | none | kept — same. |
| gap | n/a (single element) | n/a | kept — same. |
| outer spacing | `tc-divider.styles.ts:6,14` `margin-block: var(--tc-divider-spacing)` = **16px** horizontal, `margin-inline: 16px` vertical | none; the consumer adds it (`separator.stories.tsx:31,86` `className="my-4"` = 16px) | **kept — not transferable, see below.** The token value and HeroUI's story convention agree at 16px, so the rhythm is reachable without baking it in. |
| typography (label) | `tc-divider.styles.ts:49–57` `.label`: font-family base, 16px, line-height 1.5, `padding-inline: 12px`, colour `text.muted` | HeroUI Separator renders no children (`separator.tsx:22–32`, react-aria `Separator`); the "With Content" story is content *between* separators, not inside one | **not transferable — no element to style.** Were it added, `--muted` is the exact colour match (gray-700 / gray-400). |
| icon sizes | none | none | n/a. |
| focus ring | none (not focusable, `role="separator"`) | none (not focusable) | kept — same. |
| disabled | no disabled state | no disabled state | kept — same. |
| variant `default` | the only divider Tzu Chi has | `separator.css:21–23` `bg-separator` | **mapped 1:1 — no rule needed.** |
| variant `secondary` | — | `separator.css:25–27` → `--separator-secondary` = `color-mix(--surface 85%, --surface-foreground 15%)` → `#dddddd` (L 89.8%) light / `#373739` (L 33.8%) dark | **changed.** Re-anchored on `--separator`: `color-mix(in oklab, var(--separator) 85%, var(--foreground) 15%)` → `#a7a7a7` (72.8%) / `#7e7e81` (59.4%). |
| variant `tertiary` | — | `separator.css:29–31` → `--separator-tertiary` = `color-mix(--surface 81%, --surface-foreground 19%)` → `#d4d4d4` (87.0%) / `#3f3f40` (36.8%) | **changed.** Same treatment with upstream's 19% step: `#a1a1a1` (70.9%) / `#838386` (61.1%). |
| variant ladder (why) | n/a | upstream light 92% → 88.2% → 85.0% oklab L, dark 25% → 32.8% → 35.9% — each variant a step *stronger* than the last | Tzu Chi's bolder `border.default` inverted that (light 79.8% vs 89.8%/87.0%; dark 52.9% vs 33.8%/36.8%), leaving the two extra variants nearly invisible. The override restores a monotonic ladder in both modes while keeping all three lines Tzu Chi greys. |
| states (hover / pressed / selected / invalid) | none | none — a separator has no interactive state | kept — nothing to map. |
| elevation | none | none | kept — same. |
| motion | none | none | kept — same. Tzu Chi's `--tc-motion-*` tokens are irrelevant here. |

## Deliberate non-changes worth flagging

- **Menu / dropdown / list-box inset.** `menu.css:8–11`, `dropdown.css:127–130` and
  `list-box.css:21–24` inset the separator to `margin-inline-start: 3%; width: 94%`. Pass 1's
  `themes/tzuchi/components/accordion.css:117–124` made the *accordion's* equivalent hairline
  full-bleed, so there is a Tzu Chi precedent for full-bleed separators — but those selectors are
  `.dropdown__menu [data-slot="separator"]` etc., i.e. the dropdown/menu files' territory, and
  `themes/tzuchi/components/dropdown.css` (pass 1) deliberately left them alone. Not duplicated
  here; raise it as a cross-component decision if the inset is unwanted.
- **`--separator-secondary` / `--separator-tertiary` variables themselves** are left untouched.
  They also feed `link.css:3` (`decoration-separator-tertiary`) and `table.css:88,266`
  (`border-separator-tertiary/50`); rebinding them belongs in the generated `variables.css`, not in
  a component override.
- **No new `--tzuchi-*` variable was needed.** Both new colours are `color-mix` of two existing
  HeroUI theme variables, so they resolve per mode automatically.

## notTransferable

1. **Labelled divider.** `tc-divider` renders `line | label | line` when its default slot has text
   (`tc-divider.ts:52–63`), with `divider.label-fg`, `divider.label-gap` 12px and
   `divider.font-size` 16px. HeroUI's Separator is a react-aria `Separator` with no children and no
   slots; its "With Content" story only places plain separators between content rows. Giving
   HeroUI a labelled separator would need new markup, i.e. a structural change this pass forbids.
   If it is ever added: label colour `--muted`, `padding-inline: var(--tc-divider-label-gap, 12px)`,
   `font-size: var(--tc-divider-font-size, 16px)`, the two lines `flex: 1 1 0`.
2. **Baked-in 16px spacing.** `divider.spacing` is a real token, but in HeroUI the separator's
   surroundings own its spacing: `.menu` / `.dropdown__menu` space children with `gap` (4px / 2px),
   `.toolbar` with a grid `gap-2`, and `list-box` with `& > * + * { margin-top: 4px }`. A
   `margin-block: 16px` on `.separator--horizontal` would beat none of those — it would *add* to
   them, blowing every menu apart. App-level guidance instead: use `my-4` / `mx-4` (16px), which is
   what HeroUI's own stories already do.
3. **`orientation` reflected as a host attribute** (`tc-divider.ts:25,38`, `aria-orientation`).
   HeroUI already emits `data-orientation` and `aria-orientation` from react-aria; nothing to do,
   listed only because the Lit selectors `:host([orientation='vertical'])` have no CSS equivalent —
   `.separator--vertical` plays that role.
4. **`min-block-size: 1em` on the vertical line** — kept as HeroUI's 8px, see the gap table.
