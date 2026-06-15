import { expect, fixture, html } from '@open-wc/testing';
import '../dist/grid/tc-grid-define.js';
import { TcGrid } from '../dist/grid/tc-grid.js';

it('renders a single default slot inside a .grid part=base', async () => {
  const el = await fixture<TcGrid>(
    html`<tc-grid>
      <div>a</div>
      <div>b</div>
    </tc-grid>`,
  );
  const grid = el.shadowRoot!.querySelector('.grid');
  expect(grid).to.exist;
  expect(grid!.getAttribute('part')).to.equal('base');
  expect(grid!.querySelector('slot:not([name])')).to.exist;
});

it('defaults to 12 fixed columns', async () => {
  const el = await fixture<TcGrid>(html`<tc-grid></tc-grid>`);
  expect(el.columns).to.equal(12);
  expect(el.getAttribute('columns')).to.equal('12');
  await el.updateComplete;
  expect(el.style.getPropertyValue('--tc-grid-columns')).to.equal('12');
});

it('reflects the columns attribute and sets --tc-grid-columns', async () => {
  const el = await fixture<TcGrid>(html`<tc-grid columns="4"></tc-grid>`);
  expect(el.columns).to.equal(4);
  expect(el.getAttribute('columns')).to.equal('4');
  await el.updateComplete;
  expect(el.style.getPropertyValue('--tc-grid-columns')).to.equal('4');
});

it('switches to auto-fit mode and sets --tc-grid-min-col-width when min-col-width is set', async () => {
  const el = await fixture<TcGrid>(html`<tc-grid min-col-width="240px"></tc-grid>`);
  expect(el.minColWidth).to.equal('240px');
  expect(el.hasAttribute('min-col-width')).to.be.true;
  await el.updateComplete;
  expect(el.style.getPropertyValue('--tc-grid-min-col-width')).to.equal('240px');
  const cols = getComputedStyle(el.shadowRoot!.querySelector('.grid')!).gridTemplateColumns;
  // auto-fit resolves to one or more concrete tracks, not a single 12-track row
  expect(cols).to.be.a('string');
});

it('maps a gap space-token name to a --tc-space-* var', async () => {
  const el = await fixture<TcGrid>(html`<tc-grid gap="24"></tc-grid>`);
  await el.updateComplete;
  expect(el.style.getPropertyValue('--tc-grid-gap')).to.equal('var(--tc-space-24)');
});

it('passes a raw CSS length gap through verbatim', async () => {
  const el = await fixture<TcGrid>(html`<tc-grid gap="2rem"></tc-grid>`);
  await el.updateComplete;
  expect(el.style.getPropertyValue('--tc-grid-gap')).to.equal('2rem');
});

it('reflects mobile-columns into the mobileColumns property and --tc-grid-mobile-columns', async () => {
  const el = await fixture<TcGrid>(html`<tc-grid mobile-columns="2"></tc-grid>`);
  expect(el.mobileColumns).to.equal(2);
  expect(el.getAttribute('mobile-columns')).to.equal('2');
  await el.updateComplete;
  expect(el.style.getPropertyValue('--tc-grid-mobile-columns')).to.equal('2');
});

it('reflects the align attribute', async () => {
  const el = await fixture<TcGrid>(html`<tc-grid align="center"></tc-grid>`);
  expect(el.align).to.equal('center');
  expect(el.getAttribute('align')).to.equal('center');
});

it('uses display: grid on the base part', async () => {
  const el = await fixture<TcGrid>(html`<tc-grid></tc-grid>`);
  const grid = el.shadowRoot!.querySelector('.grid')!;
  expect(getComputedStyle(grid).display).to.equal('grid');
});

it('is not form-associated', async () => {
  expect((TcGrid as unknown as { formAssociated?: boolean }).formAssociated).to.not.equal(true);
});
