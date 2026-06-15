import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { TcElement } from '../base/tc-element.js';
import { linkStyles } from './tc-link.styles.js';

/**
 * 文字連結。
 * @summary Tzu Chi inline text link wrapping a native `<a>`.
 * @slot - 連結文字標籤
 * @csspart link - 內部原生 <a>（停用時為 <span>）
 * @cssprop [--tc-link-fg] - 連結文字色
 * @cssprop [--tc-link-fg-hover] - hover 文字色
 * @cssprop [--tc-link-subtle-fg] - subtle 變體靜止文字色
 * @cssprop [--tc-link-disabled-fg] - 停用文字色
 * @cssprop [--tc-link-focus-ring-color] - 焦點環顏色
 * @event {MouseEvent} click - 原生點擊事件（停用時被攔截，不會冒泡）。
 */
export class TcLink extends TcElement {
  static styles = linkStyles;

  /** 連結目標網址。 */
  @property() href = '';

  /** `<a target>`，例如 `_blank`。 */
  @property() target = '';

  /** `<a rel>`。`target="_blank"` 時自動補上 `noopener noreferrer`。 */
  @property() rel = '';

  /** 視覺變體：`default`（品牌色）或 `subtle`（內文色，hover 變品牌色）。 */
  @property({ reflect: true }) variant: 'default' | 'subtle' = 'default';

  /** 停用：改以 `<span aria-disabled>` 呈現，無法點擊或導覽。 */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** Block navigation + propagation while disabled. */
  #onClick = (e: MouseEvent): void => {
    if (this.disabled) {
      e.stopImmediatePropagation();
      e.preventDefault();
    }
  };

  render() {
    if (this.disabled) {
      return html`<span part="link" class="link" aria-disabled="true" @click=${this.#onClick}
        ><slot></slot
      ></span>`;
    }

    // Hardening: external targets get noopener/noreferrer by default.
    const rel = this.rel || (this.target === '_blank' ? 'noopener noreferrer' : '');

    return html`<a
      part="link"
      class="link"
      href=${this.href || nothing}
      target=${this.target || nothing}
      rel=${rel || nothing}
      @click=${this.#onClick}
      ><slot></slot
    ></a>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'tc-link': TcLink;
  }
}
