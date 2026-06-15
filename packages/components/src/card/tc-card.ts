import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { TcElement } from '../base/tc-element.js';
import { cardStyles } from './tc-card.styles.js';

/**
 * 卡片容器，含媒體、標題、內文與動作區，支援 elevated / outlined 變體與可互動／連結模式。
 * @summary Tzu Chi card surface with media, headline, body and footer.
 * @slot media - 頂部圖片／媒體區（建議放置 <img>）
 * @slot headline - 卡片主標題
 * @slot - 卡片內文（預設插槽）
 * @slot footer - 動作區（按鈕等，於連結模式下仍可獨立點擊）
 * @csspart base - 卡片外層容器
 * @csspart link - href 模式下覆蓋整張卡片的 <a>（stretched link）
 * @cssprop [--tc-card-bg] - 卡片底色
 * @cssprop [--tc-card-radius] - 圓角
 * @cssprop [--tc-card-padding] - 內文區內距
 * @cssprop [--tc-card-border] - outlined 變體邊框色
 * @cssprop [--tc-card-elevation] - elevated 變體靜止陰影
 * @cssprop [--tc-card-elevation-hover] - 互動時的提升陰影
 * @cssprop [--tc-card-headline-fg] - 標題文字色
 * @cssprop [--tc-card-headline-fg-hover] - 互動 hover 時的標題色
 * @event tc-card-click - 可互動卡片（無 href）以鍵盤 Enter／Space 或點擊觸發
 */
export class TcCard extends TcElement {
  static styles = cardStyles;

  /** 視覺變體：elevated（陰影）或 outlined（邊框）。 */
  @property({ reflect: true }) variant: 'elevated' | 'outlined' = 'elevated';

  /** 是否可互動（無 href 時：host 可聚焦並回應 Enter／Space）。 */
  @property({ type: Boolean, reflect: true }) interactive = false;

  /** 連結目標。設定後整張卡片以 stretched-link 方式變成連結。 */
  @property({ reflect: true }) href = '';

  override connectedCallback(): void {
    super.connectedCallback();
    this.#syncInteractivity();
    this.addEventListener('keydown', this.#onKeydown);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('keydown', this.#onKeydown);
  }

  override updated(changed: Map<string, unknown>): void {
    if (changed.has('interactive') || changed.has('href')) this.#syncInteractivity();
  }

  /** Make the host focusable + announce a role when interactive without an href.
   * (With an href the inner <a> is the real focus/interaction target.) */
  #syncInteractivity(): void {
    const hostInteractive = this.interactive && !this.href;
    if (hostInteractive) {
      if (!this.hasAttribute('tabindex')) this.setAttribute('tabindex', '0');
      if (!this.hasAttribute('role')) this.setAttribute('role', 'button');
    } else {
      if (this.getAttribute('tabindex') === '0') this.removeAttribute('tabindex');
      if (this.getAttribute('role') === 'button') this.removeAttribute('role');
    }
  }

  #onKeydown = (e: KeyboardEvent) => {
    if (this.href || !this.interactive) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.dispatchEvent(new CustomEvent('tc-card-click', { composed: true, bubbles: true }));
      this.click();
    }
  };

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
      <div part="base" class="card">
        ${this.href
          ? html`<a part="link" class="link" href=${this.href} aria-label="card link"></a>`
          : nothing}
        <div class="media" data-empty>
          <slot name="media" @slotchange=${this.#onSlotChange}></slot>
        </div>
        <div class="body">
          <div class="headline" data-empty>
            <slot name="headline" @slotchange=${this.#onSlotChange}></slot>
          </div>
          <slot></slot>
          <div class="footer" data-empty>
            <slot name="footer" @slotchange=${this.#onSlotChange}></slot>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'tc-card': TcCard;
  }
}
