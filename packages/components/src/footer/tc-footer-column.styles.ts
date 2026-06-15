import { css } from 'lit';

export const footerColumnStyles = css`
  :host {
    display: block;
    box-sizing: border-box;
    min-inline-size: 0;
  }

  .header {
    /* On desktop the header is a static heading: no button affordance. */
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--tc-space-8, 8px);
    inline-size: 100%;
    margin: 0;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--tc-footer-heading-fg, var(--tc-color-brand-primary, #1b2d58));
    font: var(--tc-typography-subtitle, 700 20px/1.4 'Noto Sans TC', sans-serif);
    text-align: start;
  }

  /* The toggle icon is only meaningful on mobile (accordion). */
  .toggle-icon {
    display: none;
    flex: 0 0 auto;
    inline-size: var(--tc-size-icon-sm, 20px);
    block-size: var(--tc-size-icon-sm, 20px);
    color: inherit;
    transition: transform var(--tc-motion-duration-fast, 150ms)
      var(--tc-motion-easing-standard, ease);
  }

  .label {
    min-inline-size: 0;
  }

  .body {
    display: flex;
    flex-direction: column;
    gap: var(--tc-space-8, 8px);
    margin-block-start: var(--tc-space-12, 12px);
  }

  /* Links inside the column: muted resting colour, brand on hover.
     Applies to both <tc-link> and plain <a>. */
  ::slotted(a),
  ::slotted(tc-link) {
    color: var(--tc-footer-link-fg, var(--tc-color-text-muted, #616161));
    font: var(--tc-typography-body, 400 16px/1.6 'Noto Sans TC', sans-serif);
    text-decoration: none;
  }
  ::slotted(a:hover),
  ::slotted(tc-link:hover) {
    color: var(--tc-footer-link-fg-hover, var(--tc-color-brand-primary, #1b2d58));
    text-decoration: underline;
  }

  /* ----- Mobile accordion (<= tablet breakpoint) ----- */
  @media (max-width: 768px) {
    :host {
      border-block-end: 1px solid var(--tc-footer-divider, var(--tc-color-border-default, #e0e0e0));
    }

    .header {
      /* Becomes a real <button> region toggle. */
      cursor: pointer;
      padding-block: var(--tc-space-12, 12px);
      font: var(--tc-typography-body, 600 16px/1.6 'Noto Sans TC', sans-serif);
      font-weight: var(--tc-font-weight-bold, 700);
    }

    .header:focus-visible {
      outline: var(--tc-focus-ring-width, 2px) solid
        var(--tc-footer-focus-ring-color, var(--tc-color-border-focus, #4f7bbe));
      outline-offset: calc(-1 * var(--tc-focus-ring-width, 2px));
    }

    .toggle-icon {
      display: inline-flex;
    }

    /* Collapsed body is hidden; open rotates the chevron. */
    .body {
      margin-block-start: 0;
      padding-block-end: var(--tc-space-12, 12px);
    }
    :host(:not([open])) .body {
      display: none;
    }
    :host([open]) .toggle-icon {
      transform: rotate(180deg);
    }
  }
`;
