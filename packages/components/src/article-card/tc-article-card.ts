import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { TcElement } from '../base/tc-element.js';
import { articleCardStyles } from './tc-article-card.styles.js';

/**
 * 文稿卡片，涵蓋焦點文稿／一般文稿／互動式文稿／公告／影片／志工早會／週報等版式，
 * 以方向（vertical／horizontal）、尺寸（featured）與插槽組合區分。支援影片播放遮罩、
 * 可互動與整張卡片連結（stretched link）模式。
 * @summary Tzu Chi article/content card with media, badge, headline, excerpt, meta and actions.
 * @slot media - 媒體區（圖片或影片縮圖）；vertical 置頂、horizontal 置於 inline-start
 * @slot badge - 標題上方的分類／標籤 pill（可放 <tc-chip> 或文字）
 * @slot headline - 主標題（粗體、品牌色、約 2 行截斷）
 * @slot excerpt - 內文摘要（次要色、約 2–3 行截斷）
 * @slot meta - 日期／作者列（小字、次要色）
 * @slot actions - 動作區（如讚／分享按鈕，於連結模式下仍可獨立點擊）
 * @csspart base - 卡片外層容器
 * @csspart media - 媒體區包裝
 * @csspart play - 影片模式的圓形播放鈕遮罩
 * @csspart body - 文字內容區
 * @csspart link - href 模式下覆蓋整張卡片的 <a>（stretched link）
 * @cssprop [--tc-article-card-bg] - 卡片底色
 * @cssprop [--tc-article-card-radius] - 圓角
 * @cssprop [--tc-article-card-elevation] - 靜止陰影
 * @cssprop [--tc-article-card-elevation-hover] - 互動／連結時的提升陰影
 * @cssprop [--tc-article-card-headline-fg] - 標題文字色
 * @cssprop [--tc-article-card-headline-fg-hover] - 互動 hover 時的標題色
 * @cssprop [--tc-article-card-excerpt-fg] - 內文摘要文字色
 * @cssprop [--tc-article-card-meta-fg] - meta（日期／作者）文字色
 * @cssprop [--tc-article-card-overlay-bg] - 影片播放鈕遮罩底色
 * @cssprop [--tc-article-card-width] - 卡片寬度（亦可用 width 屬性設定）
 * @event tc-card-click - 可互動卡片（無 href）以鍵盤 Enter／Space 或點擊觸發
 */
export class TcArticleCard extends TcElement {
  static styles = articleCardStyles;

  /** 版面方向：vertical（媒體置頂）或 horizontal（媒體置於 inline-start）。 */
  @property({ reflect: true }) orientation: 'vertical' | 'horizontal' = 'vertical';

  /** 焦點文稿：放大標題並使用較大的主視覺媒體。 */
  @property({ type: Boolean, reflect: true }) featured = false;

  /** 影片卡片：在媒體上方疊加置中的圓形播放鈕。 */
  @property({ type: Boolean, reflect: true }) video = false;

  /** 連結目標。設定後整張卡片以 stretched-link 方式變成連結。 */
  @property({ reflect: true }) href = '';

  /** 是否可互動（無 href 時：host 可聚焦並回應 Enter／Space）。 */
  @property({ type: Boolean, reflect: true }) interactive = false;

  /** 卡片寬度（CSS 長度，如 `320px` 或 `100%`）。未設定時由內容／容器決定。 */
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
      if (this.width) this.style.setProperty('--tc-article-card-width', this.width);
      else this.style.removeProperty('--tc-article-card-width');
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
          ? html`<a part="link" class="link" href=${this.href} aria-label="article link"></a>`
          : nothing}
        <div part="media" class="media" data-empty>
          <slot name="media" @slotchange=${this.#onSlotChange}></slot>
          ${this.video
            ? html`<span part="play" class="play" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="40%" height="40%" focusable="false">
                  <path d="M8 5v14l11-7z" fill="currentColor"></path>
                </svg>
              </span>`
            : nothing}
        </div>
        <div part="body" class="body">
          <div class="badge" data-empty>
            <slot name="badge" @slotchange=${this.#onSlotChange}></slot>
          </div>
          <div class="headline" data-empty>
            <slot name="headline" @slotchange=${this.#onSlotChange}></slot>
          </div>
          <div class="excerpt" data-empty>
            <slot name="excerpt" @slotchange=${this.#onSlotChange}></slot>
          </div>
          <div class="meta" data-empty>
            <slot name="meta" @slotchange=${this.#onSlotChange}></slot>
          </div>
          <div class="actions" data-empty>
            <slot name="actions" @slotchange=${this.#onSlotChange}></slot>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'tc-article-card': TcArticleCard;
  }
}
