import { css } from 'lit';

export const navbarStyles = css`
  :host {
    display: block;
    /* navbar fills its container's inline size by default */
    inline-size: 100%;
    box-sizing: border-box;
    background: var(--tc-navbar-bg, var(--tc-color-surface-default, #fff));
    color: var(--tc-navbar-fg, var(--tc-color-text-default, #212121));
    border-block-end: 1px solid var(--tc-navbar-border, var(--tc-color-border-default, #bdbdbd));
  }

  :host([hidden]) {
    display: none;
  }

  /* sticky: pin to the top of the scroll container above page content */
  :host([sticky]) {
    position: sticky;
    inset-block-start: 0;
    z-index: var(--tc-z-sticky, 1100);
  }

  /* brand variant: navy bar with on-brand text/links */
  :host([variant='brand']) {
    background: var(--tc-navbar-bg, var(--tc-color-brand-primary, #1b2d58));
    color: var(--tc-navbar-fg, var(--tc-color-text-on-brand, #fff));
    border-block-end-color: var(--tc-navbar-border, var(--tc-color-brand-primary-hover, #30559f));
  }

  /* the top bar row */
  .base {
    display: flex;
    align-items: center;
    gap: var(--tc-space-16, 16px);
    box-sizing: border-box;
    inline-size: 100%;
    min-block-size: var(--tc-navbar-height, var(--tc-size-control-lg, 64px));
    padding-block: var(--tc-space-8, 8px);
    padding-inline: var(--tc-navbar-padding-inline, var(--tc-space-24, 24px));
    background: inherit;
    color: inherit;
  }

  /* brand / logo region pinned to the inline-start */
  .brand {
    display: inline-flex;
    align-items: center;
    gap: var(--tc-space-8, 8px);
    flex: 0 0 auto;
    color: inherit;
  }

  /* primary nav — horizontal row on desktop, grows to fill the middle.
     On mobile this same <nav> is repositioned below the bar as a drawer. */
  .nav {
    display: flex;
    align-items: center;
    flex: 1 1 auto;
    min-inline-size: 0;
    gap: var(--tc-navbar-item-gap, var(--tc-space-24, 24px));
  }

  /* actions region pinned to the inline-end (search / language / login) */
  .actions {
    display: inline-flex;
    align-items: center;
    gap: var(--tc-space-8, 8px);
    flex: 0 0 auto;
    color: inherit;
  }

  /* hide empty slot wrappers (data-empty set on slotchange) */
  .brand[data-empty],
  .actions[data-empty] {
    display: none;
  }

  /* slotted nav items inherit the bar's text color */
  .nav ::slotted(*) {
    color: inherit;
  }

  /* hamburger toggle — hidden on desktop, shown at/below the tablet breakpoint */
  .toggle {
    display: none;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    inline-size: var(--tc-size-control-md, 48px);
    block-size: var(--tc-size-control-md, 48px);
    margin: 0;
    padding: 0;
    color: inherit;
    background: transparent;
    border: 0;
    border-radius: var(--tc-radius-full, 9999px);
    cursor: pointer;
    transition: background-color var(--tc-motion-duration-fast, 150ms)
      var(--tc-motion-easing-standard, ease);
  }

  .toggle:hover {
    background: var(--tc-navbar-toggle-bg-hover, var(--tc-color-brand-surface, #eaf0ff));
  }

  :host([variant='brand']) .toggle:hover {
    background: var(--tc-navbar-toggle-bg-hover, var(--tc-color-brand-primary-hover, #30559f));
  }

  .toggle:focus-visible {
    outline: var(--tc-focus-ring-width, 2px) solid
      var(--tc-navbar-focus-ring-color, var(--tc-color-border-focus, #4f7bbe));
    outline-offset: calc(-1 * var(--tc-focus-ring-width, 2px));
  }

  .toggle svg {
    inline-size: var(--tc-size-icon-md, 24px);
    block-size: var(--tc-size-icon-md, 24px);
  }

  /* ===== Responsive: at / below the tablet breakpoint (768px) ===== */
  @media (max-width: 767.98px) {
    /* hamburger becomes visible */
    .toggle {
      display: inline-flex;
    }

    /* the primary <nav> moves out of the bar row and becomes a full-width
       drawer panel rendered below the bar. */
    .nav {
      order: 99;
      flex-basis: 100%;
      flex-direction: column;
      align-items: stretch;
      gap: var(--tc-space-4, 4px);
      box-sizing: border-box;
      padding-block: var(--tc-space-8, 8px);
      margin-inline: calc(-1 * var(--tc-navbar-padding-inline, var(--tc-space-24, 24px)));
      padding-inline: var(--tc-navbar-padding-inline, var(--tc-space-24, 24px));
      margin-block-start: var(--tc-space-8, 8px);
      background: var(--tc-navbar-drawer-bg, var(--tc-color-surface-default, #fff));
      border-block-start: 1px solid var(--tc-navbar-border, var(--tc-color-border-default, #bdbdbd));
      box-shadow: var(--tc-navbar-drawer-elevation, var(--tc-elevation-2, 0 2px 6px 0 #0000001a));
    }

    :host([variant='brand']) .nav {
      background: var(--tc-navbar-drawer-bg, var(--tc-color-brand-primary, #1b2d58));
      border-block-start-color: var(
        --tc-navbar-border,
        var(--tc-color-brand-primary-hover, #30559f)
      );
    }

    /* closed: the drawer collapses entirely */
    :host(:not([open])) .nav {
      display: none;
    }

    /* slotted nav items become full-width stacked rows in the drawer */
    .nav ::slotted(*) {
      display: block;
      inline-size: 100%;
      padding-block: var(--tc-space-12, 12px);
    }
  }
`;
