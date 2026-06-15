import { html } from 'lit';
import { property, queryAssignedElements } from 'lit/decorators.js';
import { TcElement } from '../base/tc-element.js';
import { tabsStyles } from './tc-tabs.styles.js';
import { TcTab } from './tc-tab.js';

/**
 * 頁籤容器：管理選取狀態、roving tabindex 與鍵盤瀏覽。
 * @summary Tzu Chi tabs container managing selection and keyboard navigation.
 * @slot - `<tc-tab>` 子元素
 * @csspart base - 內部 tablist 容器
 * @cssprop [--tc-tabs-divider] - 底部分隔線顏色
 * @cssprop [--tc-tabs-indicator] - 選取指示線顏色
 * @event {CustomEvent<{ value: string }>} tc-tab-change - 選取的頁籤改變時派發（composed, bubbles）。
 */
export class TcTabs extends TcElement {
  static styles = tabsStyles;

  /** 版面變體：`web`（水平、桌機）或 `mobile`（等寬、行動）。 */
  @property({ reflect: true }) variant: 'web' | 'mobile' = 'web';

  /** 目前選取頁籤的 value。設定時會同步更新子頁籤的選取狀態。 */
  @property({ reflect: true }) value = '';

  @queryAssignedElements({ selector: 'tc-tab' })
  private _tabs!: TcTab[];

  connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute('role')) this.setAttribute('role', 'tablist');
    this.setAttribute('aria-orientation', 'horizontal');
    this.addEventListener('keydown', this.#onKeydown);
    this.addEventListener('click', this.#onClick);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('keydown', this.#onKeydown);
    this.removeEventListener('click', this.#onClick);
  }

  updated(changed: Map<string, unknown>): void {
    if (changed.has('value')) this.#syncTabs();
  }

  /** Called once children are assigned to the default slot. */
  #onSlotChange = (): void => {
    // Default selection: the `value` prop, else the first non-disabled tab.
    if (!this.value) {
      const first = this._tabs.find((t) => !t.disabled);
      if (first) this.value = first.value;
    }
    this.#syncTabs();
  };

  /** Reflect the current `value` onto children (selected + roving tabindex). */
  #syncTabs(): void {
    const tabs = this._tabs ?? [];
    let hasFocusable = false;
    for (const tab of tabs) {
      const isSelected = tab.value === this.value;
      tab.selected = isSelected;
      // Roving tabindex: only the selected tab is in the tab order.
      if (isSelected) {
        tab.tabIndex = 0;
        hasFocusable = true;
      } else {
        tab.tabIndex = -1;
      }
    }
    // Ensure at least one tab is reachable via Tab even if value matched none.
    if (!hasFocusable && tabs.length) tabs[0].tabIndex = 0;
  }

  #select(tab: TcTab): void {
    if (tab.disabled || tab.value === this.value) return;
    this.value = tab.value;
    this.dispatchEvent(
      new CustomEvent('tc-tab-change', {
        detail: { value: tab.value },
        bubbles: true,
        composed: true,
      }),
    );
  }

  #onClick = (e: Event): void => {
    const tab = (e.target as HTMLElement).closest('tc-tab') as TcTab | null;
    if (tab && this._tabs.includes(tab)) this.#select(tab);
  };

  #onKeydown = (e: KeyboardEvent): void => {
    const tabs = this._tabs;
    if (!tabs.length) return;

    // Anchor navigation on the originating tab, else the focused tab, else the
    // currently-selected tab (robust regardless of where the key event is fired).
    const targetTab = (e.target as HTMLElement).closest('tc-tab') as TcTab | null;
    let currentIndex = targetTab ? tabs.indexOf(targetTab) : -1;
    if (currentIndex < 0) {
      const focused = tabs.findIndex((t) => t === document.activeElement);
      currentIndex = focused >= 0 ? focused : tabs.findIndex((t) => t.value === this.value);
    }
    let nextIndex = -1;

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        nextIndex = this.#nextEnabled(currentIndex, 1);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        nextIndex = this.#nextEnabled(currentIndex, -1);
        break;
      case 'Home':
        nextIndex = this.#nextEnabled(-1, 1);
        break;
      case 'End':
        nextIndex = this.#nextEnabled(tabs.length, -1);
        break;
      default:
        return;
    }

    if (nextIndex < 0) return;
    e.preventDefault();
    const next = tabs[nextIndex];
    next.focus();
    this.#select(next);
  };

  /** Find the next non-disabled tab from `from` moving by `dir` (wraps). */
  #nextEnabled(from: number, dir: 1 | -1): number {
    const tabs = this._tabs;
    const n = tabs.length;
    for (let i = 1; i <= n; i++) {
      const idx = (((from + dir * i) % n) + n) % n;
      if (!tabs[idx].disabled) return idx;
    }
    return -1;
  }

  render() {
    return html`<slot part="base" @slotchange=${this.#onSlotChange}></slot>`;
  }
}

// Re-export the sibling element so `@tzuchi/components/tabs/class` exposes both.
export { TcTab } from './tc-tab.js';

declare global {
  interface HTMLElementTagNameMap {
    'tc-tabs': TcTabs;
  }
}
