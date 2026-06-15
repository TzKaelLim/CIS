import { expect, fixture, html, oneEvent } from '@open-wc/testing';
import '../dist/input/tc-input-define.js';
import type { TcInput } from '../dist/input/tc-input.js';

it('renders default text type with an inner input', async () => {
  const el = await fixture<TcInput>(html`<tc-input></tc-input>`);
  expect(el.type).to.equal('text');
  const input = el.shadowRoot!.querySelector('input');
  expect(input).to.exist;
  expect(input!.type).to.equal('text');
});

it('reflects the type attribute and renders a label wired to the input', async () => {
  const el = await fixture<TcInput>(html`<tc-input type="email" label="信箱"></tc-input>`);
  expect(el.getAttribute('type')).to.equal('email');
  const label = el.shadowRoot!.querySelector('label')!;
  const input = el.shadowRoot!.querySelector('input')!;
  expect(label.getAttribute('for')).to.equal(input.id);
  expect(label.textContent).to.contain('信箱');
});

it('fires tc-input on every keystroke with the new value', async () => {
  const el = await fixture<TcInput>(html`<tc-input></tc-input>`);
  const input = el.shadowRoot!.querySelector('input')!;
  setTimeout(() => {
    input.value = '慈';
    input.dispatchEvent(new Event('input'));
  });
  const ev = await oneEvent(el, 'tc-input');
  expect(ev.detail.value).to.equal('慈');
  expect(el.value).to.equal('慈');
});

it('fires tc-change on native change', async () => {
  const el = await fixture<TcInput>(html`<tc-input></tc-input>`);
  const input = el.shadowRoot!.querySelector('input')!;
  setTimeout(() => {
    input.value = 'done';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('change'));
  });
  const ev = await oneEvent(el, 'tc-change');
  expect(ev.detail.value).to.equal('done');
});

it('participates in form submission via setFormValue', async () => {
  const form = await fixture<HTMLFormElement>(
    html`<form><tc-input name="keyword" value="蓮花"></tc-input></form>`,
  );
  const data = new FormData(form);
  expect(data.get('keyword')).to.equal('蓮花');
});

it('is invalid when required and empty', async () => {
  const el = await fixture<TcInput>(html`<tc-input required></tc-input>`);
  await el.updateComplete;
  expect(el.validity.valueMissing).to.be.true;
});

it('sets aria-invalid and shows error text when invalid', async () => {
  const el = await fixture<TcInput>(html`<tc-input invalid error-text="格式錯誤"></tc-input>`);
  const input = el.shadowRoot!.querySelector('input')!;
  expect(input.getAttribute('aria-invalid')).to.equal('true');
  const helper = el.shadowRoot!.querySelector('.helper')!;
  expect(helper.textContent).to.contain('格式錯誤');
  expect(input.getAttribute('aria-describedby')).to.equal(helper.id);
});
