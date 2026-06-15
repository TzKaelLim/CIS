import { expect, fixture, html } from '@open-wc/testing';
import '../dist/button/tc-button-define.js';
import type { TcButton } from '../dist/button/tc-button.js';

it('renders default filled variant and slotted label', async () => {
  const el = await fixture<TcButton>(html`<tc-button>送出</tc-button>`);
  expect(el.variant).to.equal('filled');
  expect(el.shadowRoot!.querySelector('button')).to.exist;
  expect(el.textContent).to.contain('送出');
});

it('reflects variant attribute', async () => {
  const el = await fixture<TcButton>(html`<tc-button variant="tonal"></tc-button>`);
  expect(el.getAttribute('variant')).to.equal('tonal');
});

it('does not fire click when disabled', async () => {
  const el = await fixture<TcButton>(html`<tc-button disabled>x</tc-button>`);
  let clicked = false;
  el.addEventListener('click', () => (clicked = true));
  el.shadowRoot!.querySelector('button')!.click();
  expect(clicked).to.be.false;
});

it('submits the associated form when type=submit', async () => {
  const form = await fixture<HTMLFormElement>(html`<form><tc-button type="submit">go</tc-button></form>`);
  const el = form.querySelector('tc-button') as TcButton;
  let submitted = false;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    submitted = true;
  });
  el.shadowRoot!.querySelector('button')!.click();
  expect(submitted).to.be.true;
});
