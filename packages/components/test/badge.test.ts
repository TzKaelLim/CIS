import { expect, fixture, html } from '@open-wc/testing';
import '../dist/badge/tc-badge-define.js';
import type { TcBadge } from '../dist/badge/tc-badge.js';

it('renders default soft / neutral / md badge with a slotted label', async () => {
  const el = await fixture<TcBadge>(html`<tc-badge>新</tc-badge>`);
  expect(el.tone).to.equal('neutral');
  expect(el.variant).to.equal('soft');
  expect(el.size).to.equal('md');
  expect(el.dot).to.be.false;
  expect(el.pill).to.be.false;
  expect(el.shadowRoot!.querySelector('.badge')).to.exist;
  expect(el.textContent).to.contain('新');
});

it('is presentational by default', async () => {
  const el = await fixture<TcBadge>(html`<tc-badge>標籤</tc-badge>`);
  expect(el.getAttribute('role')).to.equal('presentation');
});

it('does not override an author-supplied role', async () => {
  const el = await fixture<TcBadge>(html`<tc-badge role="status">3</tc-badge>`);
  expect(el.getAttribute('role')).to.equal('status');
});

it('reflects tone, variant and size attributes', async () => {
  const el = await fixture<TcBadge>(
    html`<tc-badge tone="success" variant="filled" size="sm">完成</tc-badge>`,
  );
  expect(el.getAttribute('tone')).to.equal('success');
  expect(el.getAttribute('variant')).to.equal('filled');
  expect(el.getAttribute('size')).to.equal('sm');
});

it('reflects the dot boolean and renders a leading dot only when set', async () => {
  const plain = await fixture<TcBadge>(html`<tc-badge>離線</tc-badge>`);
  expect(plain.shadowRoot!.querySelector('.dot')).to.not.exist;

  const el = await fixture<TcBadge>(html`<tc-badge dot tone="success">上線</tc-badge>`);
  expect(el.dot).to.be.true;
  expect(el.hasAttribute('dot')).to.be.true;
  const dotEl = el.shadowRoot!.querySelector('.dot');
  expect(dotEl).to.exist;
  expect(dotEl!.getAttribute('aria-hidden')).to.equal('true');
});

it('reflects the pill boolean', async () => {
  const el = await fixture<TcBadge>(html`<tc-badge pill>99+</tc-badge>`);
  expect(el.pill).to.be.true;
  expect(el.hasAttribute('pill')).to.be.true;
});

it('exposes base, dot and label parts', async () => {
  const el = await fixture<TcBadge>(html`<tc-badge dot>標籤</tc-badge>`);
  expect(el.shadowRoot!.querySelector('[part="base"]')).to.exist;
  expect(el.shadowRoot!.querySelector('[part="dot"]')).to.exist;
  expect(el.shadowRoot!.querySelector('[part="label"]')).to.exist;
});

it('adds a visually-hidden status label for status tones', async () => {
  const el = await fixture<TcBadge>(html`<tc-badge tone="error">表單錯誤</tc-badge>`);
  const vh = el.shadowRoot!.querySelector('.vh');
  expect(vh).to.exist;
  expect(vh!.textContent).to.contain('錯誤');
});

it('omits the visually-hidden status label for neutral and brand tones', async () => {
  const neutral = await fixture<TcBadge>(html`<tc-badge>標籤</tc-badge>`);
  expect(neutral.shadowRoot!.querySelector('.vh')).to.not.exist;

  const brand = await fixture<TcBadge>(html`<tc-badge tone="brand">兒少</tc-badge>`);
  expect(brand.shadowRoot!.querySelector('.vh')).to.not.exist;
});

it('renders count-style content', async () => {
  const el = await fixture<TcBadge>(html`<tc-badge tone="brand" pill>12</tc-badge>`);
  expect(el.textContent).to.contain('12');
});
