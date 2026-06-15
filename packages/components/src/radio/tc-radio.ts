import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { TcElement } from '../base/tc-element.js';
import { radioStyles } from './tc-radio.styles.js';

let radioUid = 0;

/**
 * 單選圓鈕。
 * @summary Tzu Chi form-associated radio button (24×24 ring + dot).
 * @slot - 標籤文字
 * @csspart control - 外圈 ring 與內點的容器
 * @csspart dot - 選取時填滿的內點
 * @csspart label - 標籤文字容器
 * @cssprop [--tc-radio-size] - 控件尺寸（預設 24px）
 * @cssprop [--tc-radio-ring] - 未選取時的外圈顏色
 * @cssprop [--tc-radio-ring-checked] - 選取 / hover 時的外圈顏色
 * @cssprop [--tc-radio-dot] - 內點顏色
 * @cssprop [--tc-radio-bg] - 控件底色
 * @cssprop [--tc-radio-label] - 標籤文字色
 * @cssprop [--tc-radio-disabled-opacity] - 停用時透明度
 * @cssprop [--tc-radio-focus-ring-color] - 焦點環顏色
 * @event {CustomEvent<{ checked: boolean; value: string }>} tc-change - 選取狀態改變時派發（composed, bubbles）。
 */
export class TcRadio extends TcElement {
  static formAssociated = true;
  static styles = radioStyles;

  /** 是否選取（反映為屬性）。 */
  @property({ type: Boolean, reflect: true }) checked = false;

  /** 表單值，選取時提交。 */
  @property() value = '';

  /** 群組名稱（反映為屬性）。同名的 `<tc-radio>` 互斥。 */
  @property({ reflect: true }) name = '';

  /** 停用（反映為屬性）：無法選取且不可聚焦。 */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** 必填：群組內無任何選取時無效。 */
  @property({ type: Boolean, reflect: true }) required = false;

  #internals = this.attachInternals();
  #inputId = `tc-radio-${++radioUid}`;

  get form(): HTMLFormElement | null {
    return this.#internals.form;
  }

  get validity(): ValidityState {
    return this.#internals.validity;
  }

  get validationMessage(): string {
    return this.#internals.validationMessage;
  }

  connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute('role')) this.setAttribute('role', 'radio');
    this.addEventListener('click', this.#onClick);
    this.addEventListener('keydown', this.#onKeydown);
    this.#syncTabIndex();
    this.#syncFormState();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('click', this.#onClick);
    this.removeEventListener('keydown', this.#onKeydown);
  }

  updated(changed: Map<string, unknown>): void {
    if (changed.has('checked')) this.setAttribute('aria-checked', String(this.checked));
    if (changed.has('disabled')) this.setAttribute('aria-disabled', String(this.disabled));
    if (changed.has('checked') || changed.has('disabled')) this.#syncTabIndex();
    this.#syncFormState();
  }

  /** Roving tabindex within a group: the checked radio (or, if none checked,
   *  the first enabled radio) is the only one in the tab order. */
  #syncTabIndex(): void {
    if (this.disabled) {
      this.tabIndex = -1;
      return;
    }
    if (this.checked) {
      this.tabIndex = 0;
      return;
    }
    const group = this.#group();
    const anyChecked = group.some((r) => r.checked && !r.disabled);
    if (anyChecked) {
      this.tabIndex = -1;
    } else {
      const firstEnabled = group.find((r) => !r.disabled);
      this.tabIndex = firstEnabled === this ? 0 : -1;
    }
  }

  #syncFormState(): void {
    this.#internals.setFormValue(this.checked ? this.value : null);
    if (this.required && !this.#groupHasChecked()) {
      this.#internals.setValidity({ valueMissing: true }, '請選擇一個選項。');
    } else {
      this.#internals.setValidity({});
    }
  }

  /** All same-name radios within this element's root (form or shadow/document). */
  #group(): TcRadio[] {
    if (!this.name) return [this];
    const root = this.getRootNode() as Document | ShadowRoot;
    const scope: ParentNode = this.#internals.form ?? root;
    return Array.from(scope.querySelectorAll<TcRadio>(`tc-radio[name="${CSS.escape(this.name)}"]`));
  }

  #groupHasChecked(): boolean {
    return this.#group().some((r) => r.checked && !r.disabled);
  }

  /** Uncheck every other same-name radio in the group. */
  #uncheckSiblings(): void {
    for (const radio of this.#group()) {
      if (radio !== this && radio.checked) radio.checked = false;
    }
  }

  /** Select this radio (no-op if disabled or already checked). Emits tc-change. */
  #select(): void {
    if (this.disabled || this.checked) return;
    this.checked = true;
    this.#uncheckSiblings();
    // Re-sync roving tabindex across the whole group after selection moves.
    for (const r of this.#group()) r.tabIndex = r.checked && !r.disabled ? 0 : -1;
    this.dispatchEvent(
      new CustomEvent('tc-change', {
        detail: { checked: this.checked, value: this.value },
        bubbles: true,
        composed: true,
      }),
    );
  }

  #onClick = (e: MouseEvent): void => {
    if (this.disabled) {
      e.preventDefault();
      e.stopImmediatePropagation();
      return;
    }
    this.#select();
  };

  #onKeydown = (e: KeyboardEvent): void => {
    if (this.disabled) return;

    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      this.#select();
      return;
    }

    let dir: 1 | -1 | 0 = 0;
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        dir = 1;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        dir = -1;
        break;
      default:
        return;
    }

    const group = this.#group().filter((r) => !r.disabled);
    if (group.length < 2) return;
    e.preventDefault();
    const current = group.indexOf(this);
    const from = current >= 0 ? current : 0;
    const next = group[(((from + dir) % group.length) + group.length) % group.length];
    next.focus();
    next.#select();
  };

  render() {
    return html`
      <span class="control" part="control">
        <input
          id=${this.#inputId}
          type="radio"
          .checked=${this.checked}
          ?disabled=${this.disabled}
          tabindex="-1"
          aria-hidden="true"
        />
        <span class="dot" part="dot"></span>
      </span>
      <span class="label" part="label"><slot></slot></span>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'tc-radio': TcRadio;
  }
}
