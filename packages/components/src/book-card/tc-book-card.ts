import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { TcElement } from '../base/tc-element.js';
import { bookCardStyles } from './tc-book-card.styles.js';

/**
 * 書籍封面卡片：以封面圖為主的直式卡片，適用書籍封面／證嚴上人每日一叮嚀。
 * 封面圖在上、下方為標題／副標與動作區（footer），支援可互動與整張連結模式。
 * @summary Tzu Chi cover-dominant vertical book card.
 * @slot cover - 封面圖（建議放置 <img>，依 ratio 裁切為直式或方形）
 * @slot title - 標題（粗體品牌色，約 1–2 行）
 * @slot subtitle - 副標（淡色，約 1 行）
 * @slot footer - 動作區（如「更多」連結，於連結模式下仍可獨立點擊）
 * @csspart base - 卡片外層容器
 * @csspart link - href 模式下覆蓋整張卡片的 <a>（stretched link）
 * @cssprop [--tc-book-card-bg] - 卡片底色
 * @cssprop [--tc-book-card-width] - 卡片寬度（亦可用 width 屬性設定）
 * @cssprop [--tc-book-card-radius] - 圓角
 * @cssprop [--tc-book-card-padding] - 內文區內距
 * @cssprop [--tc-book-card-elevation] - 靜止陰影
 * @cssprop [--tc-book-card-elevation-hover] - 互動時的提升陰影
 * @cssprop [--tc-book-card-title-fg] - 標題文字色
 * @cssprop [--tc-book-card-title-fg-hover] - 互動 hover 時的標題色
 * @cssprop [--tc-book-card-subtitle-fg] - 副標文字色
 * @event tc-book-card-click - 可互動卡片（無 href）以鍵盤 Enter／Space 或點擊觸發
 */
export class TcBookCard extends TcElement {
  static styles = bookCardStyles;

  /** 是否可互動（無 href 時：host 可聚焦並回應 Enter／Space）。 */
  @property({ type: Boolean, reflect: true }) interactive = false;

  /** 連結目標。設定後整張卡片以 stretched-link 方式變成連結。 */
  @property({ reflect: true }) href = '';

  /** 封面長寬比：portrait（直式 3/4）或 square（方形 1/1）。 */
  @property({ reflect: true }) ratio: 'portrait' | 'square' = 'portrait';

  /** 卡片寬度（CSS 長度，如 `240px` 或 `100%`）。未設定時由內容／容器決定。 */
  @property({ reflect: true }) width = '';

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
    if (changed.has('width')) {
      if (this.width) this.style.setProperty('--tc-book-card-width', this.width);
      else this.style.removeProperty('--tc-book-card-width');
    }
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
      this.dispatchEvent(new CustomEvent('tc-book-card-click', { composed: true, bubbles: true }));
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
          ? html`<a part="link" class="link" href=${this.href} aria-label="book card link"></a>`
          : nothing}
        <div class="cover" data-empty>
          <slot name="cover" @slotchange=${this.#onSlotChange}></slot>
        </div>
        <div class="body">
          <div class="title" data-empty>
            <slot name="title" @slotchange=${this.#onSlotChange}></slot>
          </div>
          <div class="subtitle" data-empty>
            <slot name="subtitle" @slotchange=${this.#onSlotChange}></slot>
          </div>
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
    'tc-book-card': TcBookCard;
  }
}
