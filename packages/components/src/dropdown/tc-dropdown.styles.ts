import { css } from 'lit';

export const dropdownStyles = css`
  :host {
    display: inline-block;
    position: relative;
  }

  /* Outlined trigger button (collapsed default appearance). */
  .trigger {
    display: inline-flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--tc-space-8, 8px);
    width: 100%;
    box-sizing: border-box;
    margin: 0;
    font: var(--tc-typography-subtitle, 700 16px/1.5 sans-serif);
    text-align: start;
    color: var(--tc-dropdown-trigger-fg, var(--tc-color-text-muted, #4c5364));
    background: var(--tc-dropdown-bg, var(--tc-color-surface-default, #fff));
    border: 1px solid var(--tc-dropdown-border, var(--tc-color-border-default, #bdbdbd));
    border-radius: var(--tc-dropdown-radius, var(--tc-radius-md, 8px));
    padding: var(--tc-space-8, 8px) var(--tc-space-32, 32px);
    cursor: pointer;
    transition:
      background-color var(--tc-motion-duration-fast, 150ms) var(--tc-motion-easing-standard, ease),
      border-color var(--tc-motion-duration-fast, 150ms) var(--tc-motion-easing-standard, ease);
  }

  /* Show the selected label in the strong text colour, keep placeholder muted. */
  .trigger.has-value {
    color: var(--tc-dropdown-value-fg, var(--tc-color-brand-primary, #1b2d58));
  }

  .trigger:focus-visible {
    outline: var(--tc-focus-ring-width, 2px) solid
      var(--tc-dropdown-focus-ring-color, var(--tc-focus-ring-color, #4f7bbe));
    outline-offset: var(--tc-focus-ring-offset, 2px);
  }

  .trigger:disabled {
    opacity: var(--tc-dropdown-disabled-opacity, var(--tc-opacity-disabled, 0.38));
    cursor: not-allowed;
  }

  /* Open state: filled trigger matching Figma Expanded=True. */
  :host([open]) .trigger {
    color: var(--tc-dropdown-value-fg, var(--tc-color-brand-primary, #1b2d58));
    background: var(--tc-dropdown-bg-open, var(--tc-color-brand-surface-hover, #d1deff));
    border-color: var(--tc-dropdown-border-open, var(--tc-color-brand-primary, #1b2d58));
  }

  .chevron {
    flex: 0 0 auto;
    width: var(--tc-icon-size-sm, 20px);
    height: var(--tc-icon-size-sm, 20px);
    transition: transform var(--tc-motion-duration-fast, 150ms)
      var(--tc-motion-easing-standard, ease);
  }

  :host([open]) .chevron {
    transform: rotate(180deg);
  }

  /* Popover listbox positioned below the trigger. */
  .listbox {
    position: absolute;
    inset-inline-start: 0;
    inset-block-start: calc(100% + var(--tc-space-4, 4px));
    z-index: var(--tc-z-dropdown, 1000);
    min-width: 100%;
    box-sizing: border-box;
    margin: 0;
    padding: var(--tc-space-8, 8px) 0;
    list-style: none;
    background: var(--tc-dropdown-listbox-bg, var(--tc-color-brand-surface, #e8eefe));
    border-radius: var(--tc-dropdown-radius, var(--tc-radius-md, 8px));
    box-shadow: var(--tc-elevation-2, 0 4px 2px rgba(0, 0, 0, 0.13), 0 0 7px rgba(0, 0, 0, 0.13));
  }

  .option {
    display: flex;
    align-items: center;
    box-sizing: border-box;
    width: 100%;
    padding: var(--tc-space-8, 8px) var(--tc-space-32, 32px);
    font: var(--tc-typography-subtitle, 700 16px/1.5 sans-serif);
    color: var(--tc-dropdown-option-fg, var(--tc-color-brand-primary, #1b2d58));
    background: transparent;
    cursor: pointer;
    user-select: none;
  }

  /* Hover / keyboard-active option. */
  .option:hover,
  .option.active {
    background: var(--tc-dropdown-option-bg-hover, var(--tc-color-brand-surface-hover, #d1deff));
  }

  /* Currently selected option. */
  .option[aria-selected='true'] {
    background: var(--tc-dropdown-option-bg-selected, var(--tc-color-brand-surface-hover, #d1deff));
  }

  .empty {
    padding: var(--tc-space-8, 8px) var(--tc-space-32, 32px);
    font: var(--tc-typography-body, 400 16px/1.6 sans-serif);
    color: var(--tc-dropdown-trigger-fg, var(--tc-color-text-muted, #4c5364));
  }
`;
