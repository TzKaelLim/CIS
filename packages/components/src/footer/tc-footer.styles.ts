import { css } from 'lit';

export const footerStyles = css`
  :host {
    display: block;
    box-sizing: border-box;
    /* light variant defaults */
    --_tc-footer-bg: var(--tc-footer-bg, var(--tc-color-surface-subtle, #f5f5f5));
    --_tc-footer-fg: var(--tc-footer-fg, var(--tc-color-text-default, #212121));
    --_tc-footer-muted-fg: var(--tc-footer-muted-fg, var(--tc-color-text-muted, #616161));
    --_tc-footer-heading-fg: var(--tc-footer-heading-fg, var(--tc-color-brand-primary, #1b2d58));
    --_tc-footer-border: var(--tc-footer-border, var(--tc-color-border-default, #e0e0e0));
    --_tc-footer-divider: var(--tc-footer-divider, var(--tc-color-border-default, #e0e0e0));
    --_tc-footer-copyright-bg: var(
      --tc-footer-copyright-bg,
      var(--tc-color-brand-primary, #1b2d58)
    );
    --_tc-footer-copyright-fg: var(--tc-footer-copyright-fg, var(--tc-color-text-on-brand, #fff));

    background: var(--_tc-footer-bg);
    color: var(--_tc-footer-fg);
    /* Pass resolved tokens down to slotted <tc-footer-column> children. */
    --tc-footer-heading-fg: var(--_tc-footer-heading-fg);
    --tc-footer-link-fg: var(--_tc-footer-muted-fg);
    --tc-footer-link-fg-hover: var(--_tc-footer-heading-fg);
    --tc-footer-divider: var(--_tc-footer-divider);
  }

  /* Brand variant: dark brand surface, light text. */
  :host([variant='brand']) {
    --_tc-footer-bg: var(--tc-footer-bg, var(--tc-color-brand-primary, #1b2d58));
    --_tc-footer-fg: var(--tc-footer-fg, var(--tc-color-text-on-brand, #fff));
    --_tc-footer-muted-fg: var(--tc-footer-muted-fg, var(--tc-color-brand-surface, #e8eefe));
    --_tc-footer-heading-fg: var(--tc-footer-heading-fg, var(--tc-color-text-on-brand, #fff));
    --_tc-footer-border: var(--tc-footer-border, var(--tc-color-brand-primary-hover, #30559f));
    --_tc-footer-divider: var(--tc-footer-divider, var(--tc-color-brand-primary-hover, #30559f));
    --_tc-footer-copyright-bg: var(
      --tc-footer-copyright-bg,
      var(--tc-color-brand-primary-hover, #30559f)
    );
  }

  .footer {
    display: block;
    background: inherit;
    color: inherit;
  }

  /* ----- Top area ----- */
  .top {
    display: grid;
    gap: var(--tc-space-24, 24px);
    max-inline-size: var(--tc-footer-max-width, 1200px);
    margin-inline: auto;
    padding: var(--tc-space-40, 40px) var(--tc-space-24, 24px);
  }

  /* Toolbar row: social (start) + back-to-top (end). */
  .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--tc-space-16, 16px);
    flex-wrap: wrap;
  }

  .social {
    display: flex;
    align-items: center;
    gap: var(--tc-space-12, 12px);
  }
  .social[data-empty] {
    display: none;
  }
  ::slotted([slot='social']) {
    display: inline-flex;
    color: var(--_tc-footer-heading-fg);
  }

  .top-end {
    display: inline-flex;
    align-items: center;
    margin-inline-start: auto;
  }

  /* Built-in back-to-top control (used when nothing slotted into back-to-top). */
  .back-to-top {
    display: inline-flex;
    align-items: center;
    gap: var(--tc-space-8, 8px);
    padding: var(--tc-space-8, 8px) var(--tc-space-12, 12px);
    border: 0;
    background: transparent;
    color: var(--_tc-footer-heading-fg);
    font: var(--tc-typography-body, 400 16px/1.6 'Noto Sans TC', sans-serif);
    cursor: pointer;
    border-radius: var(--tc-radius-sm, 4px);
  }
  .back-to-top:hover {
    text-decoration: underline;
  }
  .back-to-top:focus-visible {
    outline: var(--tc-focus-ring-width, 2px) solid
      var(--tc-footer-focus-ring-color, var(--tc-color-border-focus, #4f7bbe));
    outline-offset: var(--tc-focus-ring-offset, 2px);
  }
  .back-to-top svg {
    inline-size: var(--tc-size-icon-sm, 20px);
    block-size: var(--tc-size-icon-sm, 20px);
  }
  /* When a custom back-to-top is slotted, hide the built-in one. */
  .top-end[data-has-slot] .back-to-top {
    display: none;
  }

  /* Main content: brand block (start) + column grid. */
  .main {
    display: grid;
    grid-template-columns: minmax(220px, 1fr) 3fr;
    gap: var(--tc-space-40, 40px);
    align-items: start;
  }

  .brand {
    display: flex;
    flex-direction: column;
    gap: var(--tc-space-16, 16px);
    color: var(--_tc-footer-muted-fg);
    font: var(--tc-typography-body, 400 16px/1.6 'Noto Sans TC', sans-serif);
  }
  .brand[data-empty] {
    display: none;
  }

  /* Responsive column grid: ~4-6 desktop, auto-fit/minmax handles the rest. */
  .columns {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: var(--tc-space-32, 32px) var(--tc-space-24, 24px);
    align-items: start;
  }

  /* ----- Copyright bar ----- */
  .copyright {
    background: var(--_tc-footer-copyright-bg);
    color: var(--_tc-footer-copyright-fg);
  }
  .copyright[data-empty] {
    display: none;
  }
  .copyright-inner {
    max-inline-size: var(--tc-footer-max-width, 1200px);
    margin-inline: auto;
    padding: var(--tc-space-16, 16px) var(--tc-space-24, 24px);
    text-align: center;
    font: var(--tc-typography-body, 400 16px/1.6 'Noto Sans TC', sans-serif);
    font-size: var(--tc-font-size-16, 16px);
  }
  ::slotted([slot='copyright']) {
    color: inherit;
  }

  /* ----- Tablet: 2-up columns, stack brand above ----- */
  @media (max-width: 1024px) {
    .main {
      grid-template-columns: 1fr;
      gap: var(--tc-space-32, 32px);
    }
    .columns {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  /* ----- Mobile: single column accordion ----- */
  @media (max-width: 768px) {
    .top {
      padding: var(--tc-space-24, 24px) var(--tc-space-16, 16px);
      gap: var(--tc-space-16, 16px);
    }
    .columns {
      grid-template-columns: 1fr;
      gap: 0;
      border-block-start: 1px solid var(--_tc-footer-divider);
    }
    .copyright-inner {
      padding-inline: var(--tc-space-16, 16px);
    }
  }
`;
