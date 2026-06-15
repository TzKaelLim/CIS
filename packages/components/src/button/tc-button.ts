import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { TcElement } from '../base/tc-element.js';
import { buttonStyles } from './tc-button.styles.js';

/**
 * 主要按鈕。
 * @summary Tzu Chi primary button.
 * @slot - 按鈕標籤文字
 * @slot start - 前置圖示
 * @slot end - 後置圖示
 * @csspart base - 內部原生 <button>
 * @cssprop [--tc-button-radius] - 圓角
 * @cssprop [--tc-button-filled-bg] - filled 變體底色
 * @cssprop [--tc-button-filled-fg] - filled 變體文字色
 */
export class TcButton extends TcElement {
  static formAssociated = true;
  static styles = buttonStyles;

  @property({ reflect: true }) variant: 'filled' | 'outlined' | 'tonal' = 'filled';
  @property({ reflect: true }) type: 'button' | 'submit' | 'reset' = 'button';
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Boolean, reflect: true, attribute: 'full-width' }) fullWidth = false;

  #internals = this.attachInternals();

  #onClick = (e: MouseEvent) => {
    if (this.disabled) {
      e.stopImmediatePropagation();
      e.preventDefault();
      return;
    }
    if (this.type === 'submit') this.#internals.form?.requestSubmit();
    else if (this.type === 'reset') this.#internals.form?.reset();
  };

  render() {
    return html`
      <button
        part="base"
        class="btn"
        type="button"
        ?disabled=${this.disabled}
        @click=${this.#onClick}
      >
        <slot name="start"></slot>
        <slot></slot>
        <slot name="end"></slot>
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'tc-button': TcButton;
  }
}
