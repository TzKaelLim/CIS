import { css } from 'lit';

export const inputStyles = css`
  :host {
    display: block;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: var(--tc-space-4, 4px);
  }

  .label {
    font: var(--tc-typography-subtitle, 700 16px/1.5 sans-serif);
    color: var(--tc-input-text, var(--tc-color-text-default, #333));
  }

  .required-mark {
    color: var(--tc-input-border-invalid, var(--tc-color-feedback-error, #d32f2f));
    margin-inline-start: var(--tc-space-4, 4px);
  }

  .control {
    display: flex;
    align-items: center;
    gap: var(--tc-space-8, 8px);
    background: var(--tc-input-bg, var(--tc-color-surface-default, #fff));
    border: 1px solid var(--tc-input-border, var(--tc-color-border-default, #bdbdbd));
    border-radius: var(--tc-input-radius, var(--tc-radius-md, 8px));
    padding: var(--tc-space-8, 8px) var(--tc-space-20, 20px);
    transition:
      border-color var(--tc-motion-duration-fast, 150ms) var(--tc-motion-easing-standard, ease),
      box-shadow var(--tc-motion-duration-fast, 150ms) var(--tc-motion-easing-standard, ease);
  }

  .control:hover {
    border-color: var(--tc-input-border-hover, var(--tc-color-border-focus, #30559f));
  }

  /* delegatesFocus puts :focus-within on the host when the inner input is focused */
  :host(:focus-within) .control {
    border-color: var(--tc-input-border-focused, var(--tc-color-border-focus, #30559f));
    box-shadow: 0 0 0 3px var(--tc-input-focus-ring, var(--tc-color-brand-surface-hover, #d1deff));
  }

  input {
    flex: 1 1 auto;
    min-width: 0;
    margin: 0;
    border: 0;
    padding: 0;
    background: transparent;
    font: var(--tc-typography-body, 400 16px/1.6 sans-serif);
    color: var(--tc-input-text, var(--tc-color-text-default, #333));
    outline: none;
  }

  input::placeholder {
    color: var(--tc-input-placeholder, var(--tc-color-text-muted, #95969b));
    opacity: 1;
  }

  /* invalid overrides hover/focus border */
  :host([invalid]) .control,
  :host([invalid]:focus-within) .control,
  :host([invalid]) .control:hover {
    border-color: var(--tc-input-border-invalid, var(--tc-color-feedback-error, #d32f2f));
  }

  :host([invalid]:focus-within) .control {
    box-shadow: 0 0 0 3px var(--tc-input-border-invalid, var(--tc-color-feedback-error, #d32f2f));
  }

  :host([disabled]) .control {
    opacity: var(--tc-input-disabled-opacity, var(--tc-opacity-disabled, 0.38));
    cursor: not-allowed;
  }

  :host([disabled]) input {
    cursor: not-allowed;
  }

  .helper {
    margin: 0;
    font: var(--tc-typography-body, 400 16px/1.6 sans-serif);
    font-size: var(--tc-font-size-16, 16px);
    color: var(--tc-input-placeholder, var(--tc-color-text-muted, #95969b));
  }

  .helper.error {
    color: var(--tc-input-border-invalid, var(--tc-color-feedback-error, #d32f2f));
  }

  ::slotted([slot='prefix']),
  ::slotted([slot='suffix']) {
    display: inline-flex;
    align-items: center;
    flex: 0 0 auto;
    color: var(--tc-input-placeholder, var(--tc-color-text-muted, #95969b));
  }
`;
