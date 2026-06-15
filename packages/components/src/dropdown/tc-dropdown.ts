import { html, nothing, svg } from 'lit';
import { property, state } from 'lit/decorators.js';
import { TcElement } from '../base/tc-element.js';
import { dropdownStyles } from './tc-dropdown.styles.js';

let dropdownUid = 0;

/** One selectable option. */
export interface TcDropdownOption {
  value: string;
  label: string;
}

/**
 * 單選下拉選單（combobox / listbox）。
 * @summary Tzu Chi single-select outlined dropdown (combobox/listbox).
 * @csspart trigger - 外框觸發按鈕
 * @csspart label - 觸發按鈕內顯示的文字
 * @csspart chevron - 下拉箭頭圖示
 * @csspart listbox - 展開的選項清單容器（role=listbox）
 * @csspart option - 單一選項（role=option）
 * @cssprop [--tc-dropdown-bg] - 觸發按鈕底色（收合）
 * @cssprop [--tc-dropdown-bg-open] - 觸發按鈕底色（展開）
 * @cssprop [--tc-dropdown-border] - 預設邊框色
 * @cssprop [--tc-dropdown-border-open] - 展開時邊框色
 * @cssprop [--tc-dropdown-radius] - 圓角
 * @cssprop [--tc-dropdown-trigger-fg] - placeholder / 觸發文字色
 * @cssprop [--tc-dropdown-value-fg] - 已選取值文字色
 * @cssprop [--tc-dropdown-listbox-bg] - 選單底色
 * @cssprop [--tc-dropdown-option-fg] - 選項文字色
 * @cssprop [--tc-dropdown-option-bg-hover] - 選項 hover / active 底色
 * @cssprop [--tc-dropdown-option-bg-selected] - 已選取選項底色
 * @cssprop [--tc-dropdown-focus-ring-color] - 焦點環顏色
 * @event {CustomEvent<{ value: string }>} tc-change - 選取值改變時派發（composed, bubbles）。
 */
export class TcDropdown extends TcElement {
  static formAssociated = true;
  static styles = dropdownStyles;

  /** 目前選取選項的 value（反映為屬性）。 */
  @property({ reflect: true }) value = '';

  /** 未選取時顯示的提示文字。 */
  @property() placeholder = '';

  /** 停用：停用內部原生按鈕（非 pointer-events:none）。 */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** 選單是否展開（反映為屬性）。 */
  @property({ type: Boolean, reflect: true }) open = false;

  /** 表單欄位名稱。 */
  @property({ reflect: true }) name = '';

  /**
   * 選項清單。可由 property 設定物件陣列，或由 HTML/React 以 JSON 字串屬性提供。
   */
  @property({
    attribute: 'options',
    converter: {
      fromAttribute: (raw: string | null): TcDropdownOption[] => {
        if (!raw) return [];
        try {
          const parsed = JSON.parse(raw);
          return Array.isArray(parsed) ? (parsed as TcDropdownOption[]) : [];
        } catch {
          return [];
        }
      },
      toAttribute: (value: TcDropdownOption[]) => JSON.stringify(value ?? []),
    },
  })
  options: TcDropdownOption[] = [];

  /** Index of the keyboard-active option while the listbox is open (-1 = none). */
  @state() private _activeIndex = -1;

  #internals = this.attachInternals();
  #uid = `tc-dropdown-${++dropdownUid}`;
  #listboxId = `${this.#uid}-listbox`;

  get form(): HTMLFormElement | null {
    return this.#internals.form;
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.#syncFormState();
    // Listen at the host so keydowns work whether they originate from the inner
    // trigger (bubbling up) or are dispatched on the element directly.
    this.addEventListener('keydown', this.#onKeydown);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('pointerdown', this.#onDocumentPointerDown, true);
    this.removeEventListener('keydown', this.#onKeydown);
  }

  updated(changed: Map<string, unknown>): void {
    if (changed.has('value')) this.#syncFormState();
    if (changed.has('open')) {
      if (this.open) {
        document.addEventListener('pointerdown', this.#onDocumentPointerDown, true);
        // Start the keyboard cursor on the selected option, else the first.
        const selected = this.options.findIndex((o) => o.value === this.value);
        this._activeIndex = selected >= 0 ? selected : this.options.length ? 0 : -1;
      } else {
        document.removeEventListener('pointerdown', this.#onDocumentPointerDown, true);
        this._activeIndex = -1;
      }
    }
  }

  #syncFormState(): void {
    this.#internals.setFormValue(this.value);
  }

  /** Currently selected option, if any. */
  get #selectedOption(): TcDropdownOption | undefined {
    return this.options.find((o) => o.value === this.value);
  }

  #toggle(): void {
    if (this.disabled) return;
    this.open = !this.open;
  }

  #close(): void {
    if (this.open) this.open = false;
  }

  #selectIndex(index: number): void {
    const option = this.options[index];
    if (!option) return;
    const changed = option.value !== this.value;
    this.value = option.value;
    this.open = false;
    if (changed) {
      this.dispatchEvent(
        new CustomEvent('tc-change', {
          detail: { value: this.value },
          bubbles: true,
          composed: true,
        }),
      );
    }
    // Return focus to the trigger after selecting with the pointer.
    this.#focusTrigger();
  }

  #focusTrigger(): void {
    this.shadowRoot?.querySelector<HTMLButtonElement>('.trigger')?.focus();
  }

  #onDocumentPointerDown = (e: Event): void => {
    if (e.composedPath().includes(this)) return;
    this.#close();
  };

  #onTriggerClick = (): void => {
    this.#toggle();
  };

  #onOptionClick = (index: number): void => {
    this.#selectIndex(index);
  };

  #onKeydown = (e: KeyboardEvent): void => {
    if (this.disabled) return;
    const n = this.options.length;

    switch (e.key) {
      case 'Escape':
        if (this.open) {
          e.preventDefault();
          this.#close();
          this.#focusTrigger();
        }
        return;
      case 'ArrowDown':
        e.preventDefault();
        if (!this.open) {
          this.open = true;
          return;
        }
        if (n) this._activeIndex = (this._activeIndex + 1 + n) % n;
        return;
      case 'ArrowUp':
        e.preventDefault();
        if (!this.open) {
          this.open = true;
          return;
        }
        if (n) this._activeIndex = (this._activeIndex - 1 + n) % n;
        return;
      case 'Home':
        if (this.open && n) {
          e.preventDefault();
          this._activeIndex = 0;
        }
        return;
      case 'End':
        if (this.open && n) {
          e.preventDefault();
          this._activeIndex = n - 1;
        }
        return;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (!this.open) {
          this.open = true;
        } else if (this._activeIndex >= 0) {
          this.#selectIndex(this._activeIndex);
        }
        return;
      default:
        return;
    }
  };

  #chevron() {
    return svg`<svg class="chevron" part="chevron" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M5 7.5 10 12.5 15 7.5" stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round" />
    </svg>`;
  }

  render() {
    const selected = this.#selectedOption;
    const labelText = selected ? selected.label : this.placeholder;

    return html`
      <button
        part="trigger"
        class="trigger ${selected ? 'has-value' : ''}"
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded=${this.open ? 'true' : 'false'}
        aria-controls=${this.#listboxId}
        ?disabled=${this.disabled}
        @click=${this.#onTriggerClick}
      >
        <span part="label" class="label">${labelText}</span>
        ${this.#chevron()}
      </button>
      ${this.open
        ? html`
            <ul
              part="listbox"
              class="listbox"
              id=${this.#listboxId}
              role="listbox"
              aria-label=${this.placeholder || nothing}
            >
              ${this.options.length
                ? this.options.map(
                    (option, i) => html`
                      <li
                        part="option"
                        class="option ${i === this._activeIndex ? 'active' : ''}"
                        role="option"
                        aria-selected=${option.value === this.value ? 'true' : 'false'}
                        @click=${() => this.#onOptionClick(i)}
                      >
                        ${option.label}
                      </li>
                    `,
                  )
                : html`<li class="empty" role="presentation">—</li>`}
            </ul>
          `
        : nothing}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'tc-dropdown': TcDropdown;
  }
}
