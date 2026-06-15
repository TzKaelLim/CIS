import { html, svg, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { TcElement } from '../base/tc-element.js';
import { chipStyles } from './tc-chip.styles.js';

/**
 * 標籤籌碼（Chip）。
 * @summary Tzu Chi tonal chip — a compact pill for labels, filters and removable tags.
 * @slot - 籌碼標籤文字
 * @slot leading - 前置圖示
 * @csspart base - 內部籌碼容器
 * @csspart label - 標籤文字容器
 * @csspart remove - 移除按鈕（removable 時）
 * @cssprop [--tc-chip-bg] - 籌碼底色
 * @cssprop [--tc-chip-bg-hover] - hover / selected 底色
 * @cssprop [--tc-chip-fg] - 文字與圖示顏色
 * @cssprop [--tc-chip-radius] - 圓角（預設膠囊形）
 * @cssprop [--tc-chip-disabled-opacity] - 停用透明度
 * @cssprop [--tc-chip-focus-ring-color] - 焦點環顏色
 * @event {CustomEvent<{ selected: boolean }>} tc-select - 切換選取狀態時派發（composed, bubbles）。
 * @event {CustomEvent<Record<string, never>>} tc-remove - 點擊移除鈕或按 Delete/Backspace 時派發（composed, bubbles）。
 */
export class TcChip extends TcElement {
  static styles = chipStyles;

  /** 變體：`assist`（預設動作型）或 `filter`（篩選型）。視覺皆為單一 tonal 樣式。 */
  @property({ reflect: true }) variant: 'assist' | 'filter' = 'assist';

  /** 停用：以 `aria-disabled` 表示，不可點擊、切換或移除。 */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** 選取狀態（可切換）。Enter / Space 或點擊會切換。 */
  @property({ type: Boolean, reflect: true }) selected = false;

  /** 可移除：顯示後置關閉鈕，點擊或按 Delete / Backspace 會派發 `tc-remove`。 */
  @property({ type: Boolean, reflect: true }) removable = false;

  connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute('role')) this.setAttribute('role', 'button');
    this.#syncA11y();
    this.addEventListener('click', this.#onClick);
    this.addEventListener('keydown', this.#onKeydown);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('click', this.#onClick);
    this.removeEventListener('keydown', this.#onKeydown);
  }

  updated(changed: Map<string, unknown>): void {
    if (changed.has('disabled') || changed.has('selected')) this.#syncA11y();
  }

  /** Keep host ARIA + roving tabindex in sync with state. */
  #syncA11y(): void {
    this.setAttribute('aria-disabled', String(this.disabled));
    this.setAttribute('aria-pressed', String(this.selected));
    if (this.disabled) {
      this.setAttribute('tabindex', '-1');
    } else if (!this.hasAttribute('tabindex') || this.getAttribute('tabindex') === '-1') {
      this.setAttribute('tabindex', '0');
    }
  }

  /** Toggle selection and emit `tc-select`. */
  #toggle(): void {
    if (this.disabled) return;
    this.selected = !this.selected;
    this.dispatchEvent(
      new CustomEvent('tc-select', {
        detail: { selected: this.selected },
        bubbles: true,
        composed: true,
      }),
    );
  }

  /** Emit `tc-remove`. Does NOT toggle selection. */
  #remove(): void {
    if (this.disabled || !this.removable) return;
    this.dispatchEvent(
      new CustomEvent('tc-remove', {
        detail: {},
        bubbles: true,
        composed: true,
      }),
    );
  }

  #onClick = (e: MouseEvent): void => {
    if (this.disabled) {
      e.stopImmediatePropagation();
      e.preventDefault();
      return;
    }
    // A click landing on the remove button removes; never toggles selection.
    const path = e.composedPath();
    const onRemove = path.some((n) => n instanceof HTMLElement && n.classList?.contains('remove'));
    if (onRemove) {
      this.#remove();
      return;
    }
    this.#toggle();
  };

  #onKeydown = (e: KeyboardEvent): void => {
    if (this.disabled) return;
    switch (e.key) {
      case 'Enter':
      case ' ':
      case 'Spacebar':
        e.preventDefault();
        this.#toggle();
        break;
      case 'Delete':
      case 'Backspace':
        if (this.removable) {
          e.preventDefault();
          this.#remove();
        }
        break;
      default:
        break;
    }
  };

  render() {
    return html`
      <div part="base" class="chip">
        <slot name="leading" class="leading"></slot>
        <span part="label" class="label"><slot></slot></span>
        ${this.removable
          ? html`<button
              part="remove"
              class="remove"
              type="button"
              tabindex="-1"
              aria-label="移除"
              ?disabled=${this.disabled}
            >
              ${svg`<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="m6 6 12 12M18 6 6 18" /></svg>`}
            </button>`
          : nothing}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'tc-chip': TcChip;
  }
}
