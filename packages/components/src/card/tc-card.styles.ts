import { css } from 'lit';

export const cardStyles = css`
  :host {
    display: block;
    position: relative;
    inline-size: var(--tc-card-width, auto);
    border-radius: var(--tc-card-radius, var(--tc-radius-lg, 16px));
    background: var(--tc-card-bg, var(--tc-color-surface-default, #fff));
    color: var(--tc-color-text-default, #212121);
  }

  .card {
    display: flex;
    flex-direction: column;
    position: relative;
    border-radius: inherit;
    background: inherit;
    /* overflow clips the media to the card's rounded corners */
    overflow: hidden;
    transition: box-shadow var(--tc-motion-duration-fast, 150ms)
      var(--tc-motion-easing-standard, ease);
  }

  /* elevated variant: resting + raised elevation tokens */
  :host([variant='elevated']) .card {
    box-shadow: var(--tc-card-elevation, var(--tc-elevation-1, 0px 1px 2px 0px #0000001a));
  }
  :host([variant='elevated'][interactive]:hover) .card,
  :host([variant='elevated'][href]:hover) .card,
  :host([variant='elevated']) .card:focus-within {
    box-shadow: var(--tc-card-elevation-hover, var(--tc-elevation-3, 0px 6px 16px 0px #0000001f));
  }

  /* outlined variant: 1px border, no resting elevation */
  :host([variant='outlined']) .card {
    border: 1px solid var(--tc-card-border, var(--tc-color-border-default, #bdbdbd));
  }
  :host([variant='outlined'][interactive]:hover) .card,
  :host([variant='outlined'][href]:hover) .card,
  :host([variant='outlined']) .card:focus-within {
    box-shadow: var(--tc-card-elevation-hover, var(--tc-elevation-3, 0px 6px 16px 0px #0000001f));
  }

  /* media: top image area, fills width and clips to top corners */
  .media {
    display: block;
    width: 100%;
  }
  ::slotted([slot='media']) {
    display: block;
    width: 100%;
  }

  .body {
    display: flex;
    flex-direction: column;
    gap: var(--tc-space-16, 16px);
    padding: var(--tc-card-padding, var(--tc-space-16, 16px));
  }

  .headline {
    font: var(--tc-typography-heading-3, 700 26px/1.4 'Noto Sans TC', sans-serif);
    color: var(--tc-card-headline-fg, var(--tc-color-brand-primary, #1b2d58));
    margin: 0;
  }

  .footer {
    display: flex;
    align-items: center;
    gap: var(--tc-space-8, 8px);
    /* footer controls must sit above the stretched link */
    position: relative;
    z-index: 1;
  }

  /* hide empty slot wrappers (data-empty set on slotchange) so they
     don't contribute padding/gap */
  .media[data-empty],
  .headline[data-empty],
  .footer[data-empty] {
    display: none;
  }

  /* stretched-link pattern: the <a> covers the whole card via ::after,
     leaving footer controls (z-index:1) independently clickable */
  .link {
    position: absolute;
    inset: 0;
    color: inherit;
    text-decoration: none;
    border-radius: inherit;
    z-index: 0;
  }
  .link::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
  }

  /* interactive affordances */
  :host([interactive]),
  :host([href]) {
    cursor: pointer;
  }

  /* focus ring on the host for keyboard users (delegatesFocus forwards to <a>) */
  :host([interactive]:focus-visible),
  .link:focus-visible {
    outline: var(--tc-focus-ring-width, 2px) solid
      var(--tc-card-focus-ring-color, var(--tc-color-border-focus, #4f7bbe));
    outline-offset: var(--tc-focus-ring-offset, 2px);
  }
  :host([interactive]:focus-visible) {
    border-radius: var(--tc-card-radius, var(--tc-radius-lg, 16px));
  }

  /* hover text emphasis matches Figma (#30559F) for interactive cards */
  :host([interactive]:hover) .headline,
  :host([href]:hover) .headline {
    color: var(--tc-card-headline-fg-hover, var(--tc-color-brand-primary-hover, #30559f));
  }
`;
