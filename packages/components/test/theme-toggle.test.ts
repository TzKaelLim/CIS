import { expect, fixture, html, oneEvent } from '@open-wc/testing';
import '../dist/theme-toggle/tc-theme-toggle-define.js';
import type { TcThemeToggle } from '../dist/theme-toggle/tc-theme-toggle.js';

const root = document.documentElement;

function reset(): void {
  try {
    localStorage.removeItem('tc-theme');
  } catch {
    /* ignore */
  }
  root.removeAttribute('data-theme');
}

beforeEach(reset);
afterEach(reset);

it('renders an accessible switch and applies an initial theme to <html>', async () => {
  const el = await fixture<TcThemeToggle>(html`<tc-theme-toggle></tc-theme-toggle>`);
  const btn = el.shadowRoot!.querySelector('button')!;
  expect(btn.getAttribute('role')).to.equal('switch');
  expect(btn.hasAttribute('aria-label')).to.be.true;
  // Initial resolution always lands on a concrete theme on the root element.
  expect(['light', 'dark']).to.include(root.getAttribute('data-theme'));
  expect(el.theme).to.equal(root.getAttribute('data-theme'));
});

it('respects an already-applied data-theme on init (no override)', async () => {
  root.setAttribute('data-theme', 'dark');
  const el = await fixture<TcThemeToggle>(html`<tc-theme-toggle></tc-theme-toggle>`);
  expect(el.theme).to.equal('dark');
  expect(el.shadowRoot!.querySelector('button')!.getAttribute('aria-checked')).to.equal('true');
});

it('toggles the theme on click, reflects it, persists, and emits tc-theme-change', async () => {
  root.setAttribute('data-theme', 'light');
  const el = await fixture<TcThemeToggle>(html`<tc-theme-toggle></tc-theme-toggle>`);
  const btn = el.shadowRoot!.querySelector('button')!;

  setTimeout(() => btn.click());
  const ev = await oneEvent(el, 'tc-theme-change');
  expect(ev.detail.theme).to.equal('dark');
  expect(root.getAttribute('data-theme')).to.equal('dark');
  expect(el.getAttribute('theme')).to.equal('dark');
  expect(localStorage.getItem('tc-theme')).to.equal('dark');
  expect(btn.getAttribute('aria-checked')).to.equal('true');
});

it('restores a stored choice on init over the system default', async () => {
  localStorage.setItem('tc-theme', 'dark');
  const el = await fixture<TcThemeToggle>(html`<tc-theme-toggle></tc-theme-toggle>`);
  expect(el.theme).to.equal('dark');
  expect(root.getAttribute('data-theme')).to.equal('dark');
});

it('mirrors external changes to <html data-theme> without re-emitting', async () => {
  root.setAttribute('data-theme', 'light');
  const el = await fixture<TcThemeToggle>(html`<tc-theme-toggle></tc-theme-toggle>`);
  let emitted = false;
  el.addEventListener('tc-theme-change', () => (emitted = true));

  root.setAttribute('data-theme', 'dark'); // e.g. the docs theme switcher
  await new Promise((r) => requestAnimationFrame(() => r(null))); // let MutationObserver flush
  expect(el.theme).to.equal('dark');
  expect(emitted).to.be.false;
});

it('renders the action label when show-label is set', async () => {
  root.setAttribute('data-theme', 'light');
  const el = await fixture<TcThemeToggle>(html`<tc-theme-toggle show-label></tc-theme-toggle>`);
  const label = el.shadowRoot!.querySelector('.label');
  expect(label).to.exist;
  expect(label!.textContent).to.contain('深色');
});
