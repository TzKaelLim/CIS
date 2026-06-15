import { css } from 'lit';

export const linkStyles = css`
  :host {
    display: inline;
  }

  .link {
    display: inline;
    color: var(--tc-link-fg, var(--tc-color-brand-primary-hover, #30559f));
    font: inherit;
    font-weight: var(--tc-font-weight-bold, 700);
    text-decoration: none;
    text-underline-offset: 0.15em;
    cursor: pointer;
    border-radius: var(--tc-radius-sm, 4px);
    transition: color var(--tc-motion-duration-fast, 150ms) var(--tc-motion-easing-standard, ease);
  }

  /* delegatesFocus surfaces inner focus on the host; the inner anchor still
     receives :focus-visible directly. */
  .link:focus-visible {
    outline: var(--tc-focus-ring-width, 2px) solid
      var(--tc-link-focus-ring-color, var(--tc-focus-ring-color, #4f7bbe));
    outline-offset: var(--tc-focus-ring-offset, 2px);
  }

  a.link:hover {
    color: var(--tc-link-fg-hover, var(--tc-color-border-focus, #4f7bbe));
    text-decoration: underline;
  }

  /* subtle variant: muted resting colour, brand on hover. */
  :host([variant='subtle']) .link {
    color: var(--tc-link-subtle-fg, var(--tc-color-text-default, #333333));
  }
  :host([variant='subtle']) a.link:hover {
    color: var(--tc-link-fg-hover, var(--tc-color-border-focus, #4f7bbe));
  }

  /* Disabled renders a <span> instead of <a>: muted, non-interactive, but
     never pointer-events:none so AT can still read it. */
  :host([disabled]) .link,
  span.link {
    color: var(--tc-link-disabled-fg, var(--tc-color-text-disabled, #b3b3b3));
    cursor: not-allowed;
    text-decoration: none;
  }

  ::slotted(*) {
    color: inherit;
  }
`;
