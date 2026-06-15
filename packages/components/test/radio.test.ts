import { expect, fixture, html, oneEvent } from '@open-wc/testing';
import '../dist/radio/tc-radio-define.js';
import { TcRadio } from '../dist/radio/tc-radio.js';

const group = () => html`
  <div>
    <tc-radio name="color" value="red">紅</tc-radio>
    <tc-radio name="color" value="blue">藍</tc-radio>
    <tc-radio name="color" value="green">綠</tc-radio>
  </div>
`;

it('is form-associated', () => {
  expect(TcRadio.formAssociated).to.be.true;
});

it('renders the radio role, an outer ring and an inner dot', async () => {
  const el = await fixture<TcRadio>(html`<tc-radio value="a">甲</tc-radio>`);
  expect(el.getAttribute('role')).to.equal('radio');
  expect(el.shadowRoot!.querySelector('.control')).to.exist;
  expect(el.shadowRoot!.querySelector('.dot')).to.exist;
  expect(el.textContent).to.contain('甲');
});

it('reflects checked, name and disabled attributes', async () => {
  const el = await fixture<TcRadio>(
    html`<tc-radio name="g" value="v" checked disabled></tc-radio>`,
  );
  expect(el.checked).to.be.true;
  expect(el.getAttribute('name')).to.equal('g');
  expect(el.hasAttribute('checked')).to.be.true;
  expect(el.hasAttribute('disabled')).to.be.true;
});

it('syncs aria-checked when toggled', async () => {
  const el = await fixture<TcRadio>(html`<tc-radio value="a"></tc-radio>`);
  expect(el.getAttribute('aria-checked')).to.equal('false');
  el.checked = true;
  await el.updateComplete;
  expect(el.getAttribute('aria-checked')).to.equal('true');
});

it('checks on click and emits tc-change with detail', async () => {
  const el = await fixture<TcRadio>(html`<tc-radio value="a">甲</tc-radio>`);
  setTimeout(() => el.click());
  const ev = await oneEvent(el, 'tc-change');
  expect(ev.detail.checked).to.be.true;
  expect(ev.detail.value).to.equal('a');
  expect(el.checked).to.be.true;
});

it('checks on Space key', async () => {
  const el = await fixture<TcRadio>(html`<tc-radio value="a"></tc-radio>`);
  el.focus();
  el.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
  await el.updateComplete;
  expect(el.checked).to.be.true;
});

it('unchecks other radios in the same name group on selection', async () => {
  const wrap = await fixture(group());
  const radios = wrap.querySelectorAll<TcRadio>('tc-radio');
  radios[0].click();
  await radios[0].updateComplete;
  expect(radios[0].checked).to.be.true;
  radios[2].click();
  await radios[2].updateComplete;
  expect(radios[2].checked).to.be.true;
  expect(radios[0].checked).to.be.false;
  expect(radios[1].checked).to.be.false;
});

it('moves selection within the group with ArrowDown', async () => {
  const wrap = await fixture(group());
  const radios = wrap.querySelectorAll<TcRadio>('tc-radio');
  radios[0].click();
  await radios[0].updateComplete;
  radios[0].focus();
  radios[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
  await radios[1].updateComplete;
  expect(radios[1].checked).to.be.true;
  expect(radios[0].checked).to.be.false;
});

it('ArrowUp wraps to the last radio', async () => {
  const wrap = await fixture(group());
  const radios = wrap.querySelectorAll<TcRadio>('tc-radio');
  radios[0].click();
  await radios[0].updateComplete;
  radios[0].focus();
  radios[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
  await radios[2].updateComplete;
  expect(radios[2].checked).to.be.true;
});

it('does not check or emit when disabled', async () => {
  const el = await fixture<TcRadio>(html`<tc-radio value="a" disabled></tc-radio>`);
  let fired = false;
  el.addEventListener('tc-change', () => (fired = true));
  el.click();
  await el.updateComplete;
  expect(el.checked).to.be.false;
  expect(fired).to.be.false;
});

it('is not focusable when disabled', async () => {
  const el = await fixture<TcRadio>(html`<tc-radio value="a" disabled></tc-radio>`);
  expect(el.tabIndex).to.equal(-1);
});

it('uses roving tabindex: only one radio is in the tab order', async () => {
  const wrap = await fixture(group());
  const radios = wrap.querySelectorAll<TcRadio>('tc-radio');
  await Promise.all([...radios].map((r) => r.updateComplete));
  // none checked yet → first enabled radio is reachable
  expect(radios[0].tabIndex).to.equal(0);
  expect(radios[1].tabIndex).to.equal(-1);
  radios[1].click();
  await radios[1].updateComplete;
  expect(radios[1].tabIndex).to.equal(0);
  expect(radios[0].tabIndex).to.equal(-1);
});

it('submits the selected value via setFormValue', async () => {
  const form = await fixture<HTMLFormElement>(html`
    <form>
      <tc-radio name="color" value="red">紅</tc-radio>
      <tc-radio name="color" value="blue">藍</tc-radio>
    </form>
  `);
  const radios = form.querySelectorAll<TcRadio>('tc-radio');
  radios[1].click();
  await radios[1].updateComplete;
  const data = new FormData(form);
  expect(data.get('color')).to.equal('blue');
});

it('contributes no form value when nothing is checked', async () => {
  const form = await fixture<HTMLFormElement>(html`
    <form><tc-radio name="color" value="red">紅</tc-radio></form>
  `);
  const data = new FormData(form);
  expect(data.get('color')).to.equal(null);
});

it('is invalid when required and the group has no selection', async () => {
  const el = await fixture<TcRadio>(html`<tc-radio name="g" value="a" required></tc-radio>`);
  await el.updateComplete;
  expect(el.validity.valueMissing).to.be.true;
  el.click();
  await el.updateComplete;
  expect(el.validity.valueMissing).to.be.false;
});
