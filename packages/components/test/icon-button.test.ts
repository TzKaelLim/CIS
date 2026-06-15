import { expect, fixture, html } from '@open-wc/testing';
import '../dist/icon-button/tc-icon-button-define.js';
import type { TcIconButton } from '../dist/icon-button/tc-icon-button.js';

it('renders default tonal/md variant and an inner button', async () => {
  const el = await fixture<TcIconButton>(
    html`<tc-icon-button label="返回"><span>x</span></tc-icon-button>`,
  );
  expect(el.variant).to.equal('tonal');
  expect(el.size).to.equal('md');
  expect(el.shadowRoot!.querySelector('button')).to.exist;
});

it('reflects variant and size attributes', async () => {
  const el = await fixture<TcIconButton>(
    html`<tc-icon-button variant="filled" size="lg" label="展開"></tc-icon-button>`,
  );
  expect(el.getAttribute('variant')).to.equal('filled');
  expect(el.getAttribute('size')).to.equal('lg');
});

it('applies label as aria-label on the inner button', async () => {
  const el = await fixture<TcIconButton>(html`<tc-icon-button label="返回"></tc-icon-button>`);
  expect(el.shadowRoot!.querySelector('button')!.getAttribute('aria-label')).to.equal('返回');
});

it('does not fire click when disabled', async () => {
  const el = await fixture<TcIconButton>(
    html`<tc-icon-button disabled label="返回"></tc-icon-button>`,
  );
  let clicked = false;
  el.addEventListener('click', () => (clicked = true));
  el.shadowRoot!.querySelector('button')!.click();
  expect(clicked).to.be.false;
});
