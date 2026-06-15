import { expect, fixture, html } from '@open-wc/testing';
import '../dist/icon/tc-icon-define.js';
import type { TcIcon } from '../dist/icon/tc-icon.js';

it('renders an svg for the given name at the default md size', async () => {
  const el = await fixture<TcIcon>(html`<tc-icon name="search"></tc-icon>`);
  expect(el.size).to.equal('md');
  const svg = el.shadowRoot!.querySelector('svg');
  expect(svg).to.exist;
  expect(svg!.querySelector('path')).to.exist;
});

it('reflects the size attribute', async () => {
  const el = await fixture<TcIcon>(html`<tc-icon name="menu" size="lg"></tc-icon>`);
  expect(el.getAttribute('size')).to.equal('lg');
});

it('is decorative (aria-hidden) when no label is set', async () => {
  const el = await fixture<TcIcon>(html`<tc-icon name="close"></tc-icon>`);
  const svg = el.shadowRoot!.querySelector('svg')!;
  expect(svg.getAttribute('aria-hidden')).to.equal('true');
  expect(svg.hasAttribute('role')).to.be.false;
});

it('exposes role=img and aria-label when label is set', async () => {
  const el = await fixture<TcIcon>(html`<tc-icon name="mail" label="收件匣"></tc-icon>`);
  const svg = el.shadowRoot!.querySelector('svg')!;
  expect(svg.getAttribute('role')).to.equal('img');
  expect(svg.getAttribute('aria-label')).to.equal('收件匣');
  expect(svg.hasAttribute('aria-hidden')).to.be.false;
  expect(svg.querySelector('title')!.textContent).to.equal('收件匣');
});

it('renders an empty svg for an unknown name without throwing', async () => {
  const el = await fixture<TcIcon>(html`<tc-icon name="does-not-exist"></tc-icon>`);
  const svg = el.shadowRoot!.querySelector('svg')!;
  expect(svg).to.exist;
  expect(svg.querySelector('path')).to.be.null;
});
