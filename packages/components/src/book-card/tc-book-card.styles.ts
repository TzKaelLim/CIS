import { css } from 'lit';

export const bookCardStyles = css`
  :host {
    display: block;
    position: relative;
    inline-size: var(--tc-book-card-width, auto);
    border-radius: var(--tc-book-card-radius, var(--tc-radius-lg, 16px));
    background: var(--tc-book-card-bg, var(--tc-color-surface-default, #fff));
    color: var(--tc-color-text-default, #212121);
  }

  .card {
    display: flex;
    flex-direction: column;
    position: relative;
    border-radius: inherit;
    background: inherit;
    /* overflow clips the cover image to the card's top rounded corners */
    overflow: hidden;
    box-shadow: var(--tc-book-card-elevation, var(--tc-elevation-1, 0px 1px 2px 0px #0000001a));
    transition: box-shadow var(--tc-motion-duration-fast, 150ms)
      var(--tc-motion-easing-standard, ease);
  }

  /* hover lift on interactive / link cards (and keyboard focus-within) */
  :host([interactive]:hover) .card,
  :host([href]:hover) .card,
  .card:focus-within {
    box-shadow: var(
      --tc-book-card-elevation-hover,
      var(--tc-elevation-3, 0px 6px 16px 0px #0000001f)
    );
  }

  /* cover: top image area, fixed aspect, clipped to top rounded corners */
  .cover {
    display: block;
    width: 100%;
    aspect-ratio: 3 / 4;
    overflow: hidden;
    background: var(--tc-color-surface-subtle, #f5f5f5);
  }
  :host([ratio='square']) .cover {
    aspect-ratio: 1 / 1;
  }
  ::slotted([slot='cover']) {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .body {
    display: flex;
    flex-direction: column;
    gap: var(--tc-space-8, 8px);
    padding: var(--tc-book-card-padding, var(--tc-space-16, 16px));
    /* keep body below the stretched link but above nothing else */
    position: relative;
  }

  .title {
    font: var(--tc-typography-subtitle, 700 16px/1.5 'Noto Sans TC', sans-serif);
    font-weight: var(--tc-font-weight-bold, 700);
    color: var(--tc-book-card-title-fg, var(--tc-color-brand-primary, #1b2d58));
    margin: 0;
    /* clamp to ~2 lines */
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    overflow: hidden;
  }

  .subtitle {
    font: var(--tc-typography-body, 400 16px/1.6 'Noto Sans TC', sans-serif);
    color: var(--tc-book-card-subtitle-fg, var(--tc-color-text-muted, #616161));
    margin: 0;
    /* clamp to ~1 line */
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
    line-clamp: 1;
    overflow: hidden;
  }

  .footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--tc-space-8, 8px);
    margin-top: var(--tc-space-4, 4px);
    /* footer controls must sit above the stretched link */
    position: relative;
    z-index: 1;
  }

  /* hide empty slot wrappers (data-empty set on slotchange) so they
     don't contribute padding/gap */
  .cover[data-empty],
  .title[data-empty],
  .subtitle[data-empty],
  .footer[data-empty] {
    display: none;
  }

  /* stretched-link pattern: the <a> covers the whole card,
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
      var(--tc-book-card-focus-ring-color, var(--tc-color-border-focus, #4f7bbe));
    outline-offset: var(--tc-focus-ring-offset, 2px);
  }
  :host([interactive]:focus-visible) {
    border-radius: var(--tc-book-card-radius, var(--tc-radius-lg, 16px));
  }

  /* title emphasis on hover for interactive / link cards */
  :host([interactive]:hover) .title,
  :host([href]:hover) .title {
    color: var(--tc-book-card-title-fg-hover, var(--tc-color-brand-primary-hover, #30559f));
  }
`;
