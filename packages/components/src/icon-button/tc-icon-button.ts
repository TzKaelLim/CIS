import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { TcElement } from '../base/tc-element.js';
import { iconButtonStyles } from './tc-icon-button.styles.js';

/**
 * 圖示按鈕：以圓形容器包裹單一圖示的按鈕。
 * @summary Tzu Chi circular icon button wrapping a single icon.
 * @slot - 圖示內容（例如 <tc-icon>）
 * @csspart base - 內部原生 <button>
 * @cssprop [--tc-icon-button-radius] - 圓角（預設為全圓）
 * @cssprop [--tc-icon-button-disabled-opacity] - 停用透明度
 * @cssprop [--tc-icon-button-focus-ring-color] - 焦點環顏色
 * @cssprop [--tc-icon-button-tonal-bg] - tonal 變體底色
 * @cssprop [--tc-icon-button-tonal-bg-hover] - tonal 變體 hover 底色
 * @cssprop [--tc-icon-button-tonal-fg] - tonal 變體圖示色
 * @cssprop [--tc-icon-button-filled-bg] - filled 變體底色
 * @cssprop [--tc-icon-button-filled-bg-hover] - filled 變體 hover 底色
 * @cssprop [--tc-icon-button-filled-fg] - filled 變體圖示色
 */
export class TcIconButton extends TcElement {
  static styles = iconButtonStyles;

  @property({ reflect: true }) variant: 'tonal' | 'filled' = 'tonal';
  @property({ reflect: true }) size: 'md' | 'lg' = 'md';
  @property({ type: Boolean, reflect: true }) disabled = false;
  /** 無障礙標籤，套用至內部 <button> 的 aria-label（必填）。 */
  @property() label = '';

  #onClick = (e: MouseEvent) => {
    if (this.disabled) {
      e.stopImmediatePropagation();
      e.preventDefault();
    }
  };

  render() {
    return html`
      <button
        part="base"
        class="btn"
        type="button"
        aria-label=${this.label}
        ?disabled=${this.disabled}
        @click=${this.#onClick}
      >
        <slot></slot>
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'tc-icon-button': TcIconButton;
  }
}
