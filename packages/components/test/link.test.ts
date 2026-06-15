import { expect, fixture, html } from '@open-wc/testing';
import '../dist/link/tc-link-define.js';
import type { TcLink } from '../dist/link/tc-link.js';

it('renders an inner native <a> with the href and slotted label', async () => {
  const el = await fixture<TcLink>(html`<tc-link href="/about">了解更多</tc-link>`);
  const a = el.shadowRoot!.querySelector('a');
  expect(a).to.exist;
  expect(a!.getAttribute('href')).to.equal('/about');
  expect(a!.getAttribute('part')).to.equal('link');
  expect(el.textContent).to.contain('了解更多');
});

it('defaults to the default variant', async () => {
  const el = await fixture<TcLink>(html`<tc-link href="#">x</tc-link>`);
  expect(el.variant).to.equal('default');
});

it('reflects the variant attribute', async () => {
  const el = await fixture<TcLink>(html`<tc-link variant="subtle" href="#">x</tc-link>`);
  expect(el.getAttribute('variant')).to.equal('subtle');
});

it('passes target through and adds rel=noopener noreferrer for _blank', async () => {
  const el = await fixture<TcLink>(
    html`<tc-link href="https://tzuchi.org" target="_blank">外部</tc-link>`,
  );
  const a = el.shadowRoot!.querySelector('a')!;
  expect(a.getAttribute('target')).to.equal('_blank');
  expect(a.getAttribute('rel')).to.equal('noopener noreferrer');
});

it('honours an explicit rel over the _blank default', async () => {
  const el = await fixture<TcLink>(
    html`<tc-link href="#" target="_blank" rel="external">x</tc-link>`,
  );
  expect(el.shadowRoot!.querySelector('a')!.getAttribute('rel')).to.equal('external');
});

it('renders a <span> with aria-disabled when disabled (no <a>)', async () => {
  const el = await fixture<TcLink>(html`<tc-link disabled href="/about">停用</tc-link>`);
  expect(el.shadowRoot!.querySelector('a')).to.not.exist;
  const span = el.shadowRoot!.querySelector('span')!;
  expect(span).to.exist;
  expect(span.getAttribute('aria-disabled')).to.equal('true');
  expect(span.getAttribute('part')).to.equal('link');
});

it('does not navigate or propagate click when disabled', async () => {
  const el = await fixture<TcLink>(html`<tc-link disabled href="/about">停用</tc-link>`);
  let clicked = false;
  el.addEventListener('click', () => (clicked = true));
  const ev = new MouseEvent('click', { bubbles: true, composed: true, cancelable: true });
  el.shadowRoot!.querySelector('span')!.dispatchEvent(ev);
  expect(clicked).to.be.false;
  expect(ev.defaultPrevented).to.be.true;
});

it('omits the href attribute when href is empty', async () => {
  const el = await fixture<TcLink>(html`<tc-link>無連結</tc-link>`);
  const a = el.shadowRoot!.querySelector('a')!;
  expect(a.hasAttribute('href')).to.be.false;
});
