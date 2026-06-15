import { css } from 'lit';

export const containerStyles = css`
  :host {
    display: block;
    /* the container itself spans the full inline size of its parent;
       the inner .inner applies the max-width / centering / gutter. */
    inline-size: 100%;
    box-sizing: border-box;
  }

  :host([hidden]) {
    display: none;
  }

  /* the constrained, centered content box */
  .inner {
    box-sizing: border-box;
    inline-size: 100%;
    /* default size = xl; size variants below override --tc-container-max */
    max-inline-size: var(--tc-container-max, var(--tc-container-xl, 1280px));
    /* mobile-first gutter: grows at the tablet/desktop breakpoints below */
    padding-inline: var(--tc-container-padding-inline-mobile, var(--tc-space-16, 16px));
  }

  /* centered (default): horizontally center within the parent */
  :host([centered]) .inner {
    margin-inline: auto;
  }

  /* gutter disabled: no inline padding */
  :host(:not([gutter])) .inner {
    padding-inline: 0;
  }

  /* ===== size variants → max-inline-size from --tc-container-* primitives ===== */
  :host([size='sm']) .inner {
    max-inline-size: var(--tc-container-max, var(--tc-container-sm, 375px));
  }
  :host([size='md']) .inner {
    max-inline-size: var(--tc-container-max, var(--tc-container-md, 768px));
  }
  :host([size='lg']) .inner {
    max-inline-size: var(--tc-container-max, var(--tc-container-lg, 1024px));
  }
  :host([size='xl']) .inner {
    max-inline-size: var(--tc-container-max, var(--tc-container-xl, 1280px));
  }
  :host([size='full']) .inner {
    max-inline-size: var(--tc-container-max, var(--tc-container-full, 1920px));
  }

  /* ===== Gutter grows with the viewport ===== */
  /* tablet (≥768px): medium gutter */
  @media (min-width: 768px) {
    :host([gutter]) .inner {
      padding-inline: var(--tc-container-padding-inline-tablet, var(--tc-space-24, 24px));
    }
  }

  /* desktop (≥1024px): full gutter */
  @media (min-width: 1024px) {
    :host([gutter]) .inner {
      padding-inline: var(--tc-container-padding-inline, var(--tc-space-32, 32px));
    }
  }
`;
