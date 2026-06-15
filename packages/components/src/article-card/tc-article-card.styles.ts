import { css } from 'lit';

export const articleCardStyles = css`
  :host {
    display: block;
    position: relative;
    inline-size: var(--tc-article-card-width, auto);
    border-radius: var(--tc-article-card-radius, var(--tc-radius-lg, 16px));
    background: var(--tc-article-card-bg, var(--tc-color-surface-default, #fff));
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
    box-shadow: var(--tc-article-card-elevation, var(--tc-elevation-1, 0px 1px 2px 0px #0000001a));
    transition: box-shadow var(--tc-motion-duration-fast, 150ms)
      var(--tc-motion-easing-standard, ease);
  }

  /* raise elevation only for interactive / linked cards on hover or focus-within */
  :host([interactive]:hover) .card,
  :host([href]:hover) .card,
  :host([interactive]) .card:focus-within,
  :host([href]) .card:focus-within {
    box-shadow: var(
      --tc-article-card-elevation-hover,
      var(--tc-elevation-3, 0px 6px 16px 0px #0000001f)
    );
  }

  /* ---- horizontal orientation: media on inline-start (~40%) ---- */
  :host([orientation='horizontal']) .card {
    flex-direction: row;
    align-items: stretch;
  }
  :host([orientation='horizontal']) .media {
    flex: 0 0 40%;
    max-width: 40%;
  }
  :host([orientation='horizontal']) .body {
    flex: 1 1 auto;
    min-width: 0;
  }

  /* ---- media region ---- */
  .media {
    position: relative;
    display: block;
    width: 100%;
  }
  ::slotted([slot='media']) {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  /* video play affordance: circular semi-transparent button centered on media */
  .play {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    inline-size: var(--tc-size-control-lg, 48px);
    block-size: var(--tc-size-control-lg, 48px);
    border-radius: var(--tc-radius-full, 9999px);
    background: var(--tc-article-card-overlay-bg, rgba(0, 0, 0, 0.55));
    color: var(--tc-color-white, #fff);
    /* sit above the stretched link so the play glyph is always visible */
    z-index: 1;
    pointer-events: none;
  }

  /* ---- body / text content ---- */
  .body {
    display: flex;
    flex-direction: column;
    gap: var(--tc-space-8, 8px);
    padding: var(--tc-space-16, 16px);
  }

  .badge {
    display: flex;
    align-items: center;
    gap: var(--tc-space-8, 8px);
    /* keep interactive badge contents above the stretched link */
    position: relative;
    z-index: 1;
  }

  .headline {
    font: var(--tc-typography-heading-4, 700 20px/1.4 'Noto Sans TC', sans-serif);
    color: var(--tc-article-card-headline-fg, var(--tc-color-brand-primary, #1b2d58));
    margin: 0;
    /* clamp to ~2 lines */
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  /* featured: larger headline */
  :host([featured]) .headline {
    font: var(--tc-typography-heading-3, 700 26px/1.4 'Noto Sans TC', sans-serif);
  }

  .excerpt {
    font: var(--tc-typography-body, 400 16px/1.6 'Noto Sans TC', sans-serif);
    color: var(--tc-article-card-excerpt-fg, var(--tc-color-text-default, #212121));
    margin: 0;
    /* clamp to ~3 lines */
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .meta {
    font: var(--tc-typography-tab-sm, 400 14px/1.5 'Noto Sans TC', sans-serif);
    color: var(--tc-article-card-meta-fg, var(--tc-color-text-muted, #616161));
    margin: 0;
  }

  .actions {
    display: flex;
    align-items: center;
    gap: var(--tc-space-12, 12px);
    margin-top: var(--tc-space-4, 4px);
    /* action controls must sit above the stretched link */
    position: relative;
    z-index: 1;
  }

  /* hide empty slot wrappers (data-empty set on slotchange) so they
     don't contribute padding/gap */
  .media[data-empty],
  .badge[data-empty],
  .headline[data-empty],
  .excerpt[data-empty],
  .meta[data-empty],
  .actions[data-empty] {
    display: none;
  }

  /* stretched-link pattern: the <a> covers the whole card,
     leaving badge/action controls (z-index:1) independently clickable */
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
      var(--tc-article-card-focus-ring-color, var(--tc-color-border-focus, #4f7bbe));
    outline-offset: var(--tc-focus-ring-offset, 2px);
  }
  :host([interactive]:focus-visible) {
    border-radius: var(--tc-article-card-radius, var(--tc-radius-lg, 16px));
  }

  /* hover text emphasis for interactive / linked cards */
  :host([interactive]:hover) .headline,
  :host([href]:hover) .headline {
    color: var(--tc-article-card-headline-fg-hover, var(--tc-color-brand-primary-hover, #30559f));
  }
`;
