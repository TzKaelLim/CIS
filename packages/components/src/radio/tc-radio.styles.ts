import { css } from 'lit';

export const radioStyles = css`
  :host {
    display: inline-flex;
    align-items: center;
    gap: var(--tc-space-8, 8px);
    cursor: pointer;
    /* Elevation1 drop shadow from Figma, applied to the visual control. */
    vertical-align: middle;
  }

  :host([disabled]) {
    cursor: not-allowed;
  }

  .control {
    position: relative;
    box-sizing: border-box;
    inline-size: var(--tc-radio-size, var(--tc-size-icon-md, 24px));
    block-size: var(--tc-radio-size, var(--tc-size-icon-md, 24px));
    flex: 0 0 auto;
    border-radius: var(--tc-radius-full, 9999px);
    /* outer ring */
    border: 2px solid var(--tc-radio-ring, var(--tc-color-border-strong, #bdbdbd));
    background: var(--tc-radio-bg, var(--tc-color-surface-default, #fff));
    transition:
      border-color var(--tc-motion-duration-fast, 150ms) var(--tc-motion-easing-standard, ease),
      box-shadow var(--tc-motion-duration-fast, 150ms) var(--tc-motion-easing-standard, ease);
  }

  /* inner dot — hidden until checked */
  .dot {
    position: absolute;
    inset: 0;
    margin: auto;
    inline-size: 50%;
    block-size: 50%;
    border-radius: var(--tc-radius-full, 9999px);
    background: var(--tc-radio-dot, var(--tc-color-brand-primary, #1b2d58));
    transform: scale(0);
    transition: transform var(--tc-motion-duration-fast, 150ms)
      var(--tc-motion-easing-standard, ease);
  }

  :host([checked]) .control {
    border-color: var(--tc-radio-ring-checked, var(--tc-color-brand-primary, #1b2d58));
  }

  :host([checked]) .dot {
    transform: scale(1);
  }

  :host(:not([disabled]):hover) .control {
    border-color: var(--tc-radio-ring-checked, var(--tc-color-brand-primary, #1b2d58));
  }

  /* delegatesFocus moves :focus-within to the host when the inner input focuses */
  :host(:focus-within) .control {
    box-shadow: 0 0 0 var(--tc-focus-ring-width, 2px)
      var(--tc-radio-focus-ring-color, var(--tc-focus-ring-color, #30559f));
  }

  :host([disabled]) {
    opacity: var(--tc-radio-disabled-opacity, var(--tc-opacity-disabled, 0.38));
  }

  .label {
    font: var(--tc-typography-body, 400 16px/1.6 sans-serif);
    color: var(--tc-radio-label, var(--tc-color-text-default, #333));
  }

  /* The native input is visually hidden but kept in the layout for focus
     delegation and form semantics — never pointer-events:none / display:none. */
  input {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    margin: -1px;
    padding: 0;
    border: 0;
    overflow: hidden;
    clip: rect(0 0 0 0);
    clip-path: inset(50%);
    white-space: nowrap;
  }
`;
