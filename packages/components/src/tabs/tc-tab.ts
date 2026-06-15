import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { TcElement } from '../base/tc-element.js';
import { tabStyles } from './tc-tab.styles.js';

/**
 * 單一頁籤，置於 `<tc-tabs>` 內。
 * @summary Tzu Chi tab, used inside `<tc-tabs>`.
 * @slot - 頁籤標籤文字
 * @slot icon - 前置圖示
 * @csspart label - 標籤文字容器
 * @cssprop [--tc-tabs-tab-fg] - 未選取頁籤文字色
 * @cssprop [--tc-tabs-tab-fg-selected] - 選取頁籤文字色
 * @cssprop [--tc-tabs-tab-bg-hover] - 頁籤 hover 底色
 * @cssprop [--tc-tabs-indicator] - 選取指示線顏色
 */
export class TcTab extends TcElement {
  static styles = tabStyles;

  /** 頁籤值（必填），由 `<tc-tabs>` 用來判斷選取狀態。 */
  @property({ reflect: true }) value = '';

  /** 停用：以 `aria-disabled` 表示，仍可被鍵盤瀏覽（roving tabindex），但無法選取。 */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** 是否為目前選取的頁籤（由 `<tc-tabs>` 管理）。 */
  @property({ type: Boolean, reflect: true }) selected = false;

  connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute('role')) this.setAttribute('role', 'tab');
  }

  updated(changed: Map<string, unknown>): void {
    if (changed.has('selected')) {
      this.setAttribute('aria-selected', String(this.selected));
    }
    if (changed.has('disabled')) {
      this.setAttribute('aria-disabled', String(this.disabled));
    }
  }

  render() {
    return html`
      <slot name="icon" class="icon"></slot>
      <span part="label"><slot></slot></span>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'tc-tab': TcTab;
  }
}
