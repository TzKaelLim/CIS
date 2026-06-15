import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { TcElement } from '../base/tc-element.js';
import { listPanelStyles } from './tc-list-panel.styles.js';

/**
 * 標題面板：彩色標題列加上一條垂直清單，項目間以細分隔線區隔
 * （首頁側欄「內部觀點：領航慈濟」樣式）。標題以 label 屬性設定，
 * 或以 `header` 插槽覆寫；清單內容由使用者透過預設插槽提供。
 * @summary Tzu Chi titled panel with a coloured header and a vertical divided list.
 * @slot - 清單項目（預設插槽，每個子元素為一列，列與列間自動加分隔線）
 * @slot header - 覆寫標題列內容（未提供時顯示 label 屬性文字）
 * @csspart base - 面板外層容器
 * @csspart header - 彩色標題列
 * @csspart body - 清單內容區
 * @cssprop [--tc-list-panel-header-bg] - 標題列底色（brand 變體為品牌主色）
 * @cssprop [--tc-list-panel-header-fg] - 標題列文字色
 * @cssprop [--tc-list-panel-bg] - 面板底色
 * @cssprop [--tc-list-panel-radius] - 圓角
 * @cssprop [--tc-list-panel-border] - 外框色
 * @cssprop [--tc-list-panel-divider] - 項目間分隔線色
 * @cssprop [--tc-list-panel-width] - 面板寬度（亦可用 width 屬性設定）
 */
export class TcListPanel extends TcElement {
  static styles = listPanelStyles;

  /** 標題列文字（亦可用 `header` 插槽覆寫）。 */
  @property({ reflect: true }) label = '';

  /** 視覺變體：`brand`（品牌主色標題列、白字）或 `plain`（淡色標題列、內文色）。 */
  @property({ reflect: true }) variant: 'brand' | 'plain' = 'brand';

  /** 面板寬度（CSS 長度，如 `320px` 或 `100%`）。未設定時由內容／容器決定。 */
  @property({ reflect: true }) width = '';

  override updated(changed: Map<string, unknown>): void {
    if (changed.has('width')) {
      if (this.width) this.style.setProperty('--tc-list-panel-width', this.width);
      else this.style.removeProperty('--tc-list-panel-width');
    }
  }

  /** Toggle a `data-empty` flag on the slot's wrapper so empty regions
   * (no assigned nodes) can be hidden via CSS without unreliable
   * `:has(::slotted())` selectors. */
  #onSlotChange = (e: Event) => {
    const slot = e.target as HTMLSlotElement;
    const wrapper = slot.parentElement;
    if (!wrapper) return;
    const empty = slot.assignedNodes({ flatten: true }).length === 0;
    wrapper.toggleAttribute('data-empty', empty);
  };

  render() {
    return html`
      <div part="base" class="panel">
        <h2 part="header" class="header">
          <slot name="header"><span class="label">${this.label}</span></slot>
        </h2>
        <div part="body" class="body" data-empty>
          <slot @slotchange=${this.#onSlotChange}></slot>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'tc-list-panel': TcListPanel;
  }
}
