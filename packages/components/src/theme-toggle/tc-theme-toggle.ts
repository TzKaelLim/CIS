import { html, nothing, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { TcElement } from '../base/tc-element.js';
import { themeToggleStyles } from './tc-theme-toggle.styles.js';

export type TcTheme = 'light' | 'dark';

/** localStorage key holding the user's explicit theme choice. */
const STORAGE_KEY = 'tc-theme';

const isTheme = (v: unknown): v is TcTheme => v === 'light' || v === 'dark';

/**
 * 深色／淺色主題切換鈕。
 *
 * 切換 `<html data-theme="dark|light">`，由 `@tzuchi/tokens` 的 `[data-theme="dark"]`
 * 區塊重新對應語意色票，所有元件透過 CSS 變數串接自動跟隨。使用者選擇會寫入
 * `localStorage["tc-theme"]`；未選擇前跟隨系統 `prefers-color-scheme`。透過
 * MutationObserver 同步外部對 `data-theme` 的變更（例如 docs 既有的主題切換）。
 *
 * @summary 切換 `data-theme` 的無障礙主題切換鈕（含記憶與系統跟隨）。
 * @csspart button - 內部 `<button>`
 * @cssprop [--tc-theme-toggle-size] - 按鈕方形邊長
 * @cssprop [--tc-theme-toggle-icon-size] - 圖示尺寸
 * @cssprop [--tc-theme-toggle-bg] - 背景色
 * @cssprop [--tc-theme-toggle-bg-hover] - hover 背景色
 * @cssprop [--tc-theme-toggle-fg] - 圖示／文字色
 * @cssprop [--tc-theme-toggle-border] - 邊框色
 * @cssprop [--tc-theme-toggle-border-hover] - hover 邊框色
 * @cssprop [--tc-theme-toggle-focus-ring-color] - 焦點環顏色
 * @event {CustomEvent<{ theme: 'light' | 'dark' }>} tc-theme-change - 套用主題改變時觸發（含使用者點擊與系統跟隨）。
 */
export class TcThemeToggle extends TcElement {
  static styles = themeToggleStyles;

  /** 目前套用的主題。會反映到屬性以供樣式與檢視使用（唯讀，請用點擊切換）。 */
  @property({ reflect: true }) theme: TcTheme = 'light';

  /** 是否在圖示旁顯示動作文字（例如「切換至深色模式」）。 */
  @property({ type: Boolean, reflect: true, attribute: 'show-label' }) showLabel = false;

  /** 是否跟隨系統色彩（尚未有使用者選擇時為 true）。 */
  @state() private following = true;

  #mql: MediaQueryList | null = null;
  #observer: MutationObserver | null = null;

  connectedCallback(): void {
    super.connectedCallback();
    this.#init();

    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      this.#mql = window.matchMedia('(prefers-color-scheme: dark)');
      this.#mql.addEventListener('change', this.#onSystemChange);
    }
    // Keep in sync with external writers of <html data-theme> (e.g. an inline
    // anti-FOUC script, the docs theme switcher, or a second toggle).
    if (typeof document !== 'undefined' && typeof MutationObserver !== 'undefined') {
      this.#observer = new MutationObserver(this.#onAttrChange);
      this.#observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme'],
      });
    }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#mql?.removeEventListener('change', this.#onSystemChange);
    this.#mql = null;
    this.#observer?.disconnect();
    this.#observer = null;
  }

  /** Resolve the initial theme: an already-applied attribute wins, then the
   *  stored choice, then the system preference. Never persists on init. */
  #init(): void {
    const stored = this.#read();
    this.following = !isTheme(stored);

    const applied =
      typeof document !== 'undefined' ? document.documentElement.getAttribute('data-theme') : null;

    let theme: TcTheme;
    if (isTheme(applied)) theme = applied;
    else if (isTheme(stored)) theme = stored;
    else theme = this.#systemPrefersDark() ? 'dark' : 'light';

    this.#apply(theme, { persist: false, emit: false });
  }

  #systemPrefersDark(): boolean {
    return !!this.#mql?.matches || !!window?.matchMedia?.('(prefers-color-scheme: dark)').matches;
  }

  #read(): string | null {
    try {
      return typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    } catch {
      return null; // privacy mode / disabled storage
    }
  }

  #write(theme: TcTheme): void {
    try {
      localStorage?.setItem(STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
  }

  /** Apply a theme to <html> and (optionally) persist + announce it. */
  #apply(theme: TcTheme, opts: { persist: boolean; emit: boolean }): void {
    this.theme = theme;
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
    if (opts.persist) {
      this.following = false;
      this.#write(theme);
    }
    if (opts.emit) {
      this.dispatchEvent(
        new CustomEvent<{ theme: TcTheme }>('tc-theme-change', {
          detail: { theme },
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  /** User toggled — this becomes an explicit, persisted choice. */
  #toggle = (): void => {
    this.#apply(this.theme === 'dark' ? 'light' : 'dark', { persist: true, emit: true });
  };

  /** System preference changed while still following it. */
  #onSystemChange = (e: MediaQueryListEvent): void => {
    if (!this.following) return;
    this.#apply(e.matches ? 'dark' : 'light', { persist: false, emit: true });
  };

  /** Some other code changed <html data-theme>; mirror it without re-applying. */
  #onAttrChange = (): void => {
    const applied = document.documentElement.getAttribute('data-theme');
    if (isTheme(applied) && applied !== this.theme) this.theme = applied;
  };

  #moon(): TemplateResult {
    return html`<svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </svg>`;
  }

  #sun(): TemplateResult {
    return html`<svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path
        d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
      />
    </svg>`;
  }

  render() {
    const dark = this.theme === 'dark';
    // The icon previews the TARGET (what a click switches to).
    const targetLabel = dark ? '切換至淺色模式' : '切換至深色模式';
    return html`<button
      part="button"
      class="toggle"
      type="button"
      role="switch"
      aria-checked=${dark ? 'true' : 'false'}
      aria-label=${targetLabel}
      title=${targetLabel}
      @click=${this.#toggle}
    >
      <span class="icon">${dark ? this.#sun() : this.#moon()}</span>
      ${this.showLabel ? html`<span class="label">${targetLabel}</span>` : nothing}
    </button>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'tc-theme-toggle': TcThemeToggle;
  }
}
