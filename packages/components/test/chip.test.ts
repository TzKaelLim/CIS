import { expect, fixture, html, oneEvent } from '@open-wc/testing';
import '../dist/chip/tc-chip-define.js';
import type { TcChip } from '../dist/chip/tc-chip.js';

it('renders default assist variant with a slotted label and button role', async () => {
  const el = await fixture<TcChip>(html`<tc-chip>連結</tc-chip>`);
  expect(el.variant).to.equal('assist');
  expect(el.getAttribute('role')).to.equal('button');
  expect(el.getAttribute('tabindex')).to.equal('0');
  expect(el.shadowRoot!.querySelector('.chip')).to.exist;
  expect(el.textContent).to.contain('連結');
});

it('reflects the variant attribute', async () => {
  const el = await fixture<TcChip>(html`<tc-chip variant="filter">篩選</tc-chip>`);
  expect(el.getAttribute('variant')).to.equal('filter');
});

it('toggles selected on click and emits tc-select', async () => {
  const el = await fixture<TcChip>(html`<tc-chip>標籤</tc-chip>`);
  expect(el.selected).to.be.false;
  setTimeout(() => el.click());
  const ev = await oneEvent(el, 'tc-select');
  expect(ev.detail.selected).to.be.true;
  expect(el.selected).to.be.true;
  expect(el.getAttribute('aria-pressed')).to.equal('true');
});

it('toggles selected on Enter and Space', async () => {
  const el = await fixture<TcChip>(html`<tc-chip>標籤</tc-chip>`);
  el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  await el.updateComplete;
  expect(el.selected).to.be.true;
  el.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
  await el.updateComplete;
  expect(el.selected).to.be.false;
});

it('renders a trailing remove button only when removable', async () => {
  const plain = await fixture<TcChip>(html`<tc-chip>無</tc-chip>`);
  expect(plain.shadowRoot!.querySelector('.remove')).to.not.exist;

  const el = await fixture<TcChip>(html`<tc-chip removable>增加</tc-chip>`);
  const btn = el.shadowRoot!.querySelector('.remove');
  expect(btn).to.exist;
  expect(btn!.getAttribute('aria-label')).to.equal('移除');
});

it('emits tc-remove on remove-button click without toggling selection', async () => {
  const el = await fixture<TcChip>(html`<tc-chip removable>增加</tc-chip>`);
  const btn = el.shadowRoot!.querySelector('.remove') as HTMLButtonElement;
  setTimeout(() => btn.click());
  const ev = await oneEvent(el, 'tc-remove');
  expect(ev.detail).to.deep.equal({});
  expect(el.selected).to.be.false;
});

it('emits tc-remove on Delete and Backspace when removable', async () => {
  const el = await fixture<TcChip>(html`<tc-chip removable>增加</tc-chip>`);
  setTimeout(() =>
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true })),
  );
  const ev = await oneEvent(el, 'tc-remove');
  expect(ev.detail).to.deep.equal({});
  expect(el.selected).to.be.false;
});

it('does not emit tc-remove on Delete when not removable', async () => {
  const el = await fixture<TcChip>(html`<tc-chip>標籤</tc-chip>`);
  let removed = false;
  el.addEventListener('tc-remove', () => (removed = true));
  el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }));
  await el.updateComplete;
  expect(removed).to.be.false;
});

it('does not toggle, activate, or remove when disabled', async () => {
  const el = await fixture<TcChip>(html`<tc-chip disabled removable>停用</tc-chip>`);
  expect(el.getAttribute('aria-disabled')).to.equal('true');
  expect(el.getAttribute('tabindex')).to.equal('-1');

  let selected = false;
  let removed = false;
  el.addEventListener('tc-select', () => (selected = true));
  el.addEventListener('tc-remove', () => (removed = true));
  el.click();
  el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true }));
  await el.updateComplete;
  expect(el.selected).to.be.false;
  expect(selected).to.be.false;
  expect(removed).to.be.false;
});

it('renders a leading icon slot', async () => {
  const el = await fixture<TcChip>(html`<tc-chip><span slot="leading">★</span>標籤</tc-chip>`);
  const slot = el.shadowRoot!.querySelector('slot[name="leading"]') as HTMLSlotElement;
  expect(slot).to.exist;
  expect(slot.assignedElements().length).to.equal(1);
});
