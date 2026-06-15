import { expect, fixture, html, oneEvent } from '@open-wc/testing';
import '../dist/dropdown/tc-dropdown-define.js';
import { TcDropdown } from '../dist/dropdown/tc-dropdown.js';

const opts = [
  { value: 'a', label: '第一' },
  { value: 'b', label: '第二' },
  { value: 'c', label: '第三' },
];

const withOptions = async () => {
  const el = await fixture<TcDropdown>(html`<tc-dropdown placeholder="請選擇"></tc-dropdown>`);
  el.options = opts;
  await el.updateComplete;
  return el;
};

it('is form-associated', () => {
  expect(TcDropdown.formAssociated).to.be.true;
});

it('renders a closed trigger with combobox a11y wiring', async () => {
  const el = await withOptions();
  const trigger = el.shadowRoot!.querySelector('.trigger')!;
  expect(trigger.getAttribute('aria-haspopup')).to.equal('listbox');
  expect(trigger.getAttribute('aria-expanded')).to.equal('false');
  expect(trigger.getAttribute('aria-controls')).to.exist;
  // closed: no listbox in the DOM
  expect(el.shadowRoot!.querySelector('.listbox')).to.not.exist;
});

it('shows the placeholder when no value is selected', async () => {
  const el = await withOptions();
  expect(el.shadowRoot!.querySelector('.label')!.textContent).to.contain('請選擇');
});

it('opens on trigger click and renders a listbox with options', async () => {
  const el = await withOptions();
  (el.shadowRoot!.querySelector('.trigger') as HTMLButtonElement).click();
  await el.updateComplete;
  expect(el.open).to.be.true;
  const listbox = el.shadowRoot!.querySelector('.listbox')!;
  expect(listbox.getAttribute('role')).to.equal('listbox');
  const options = el.shadowRoot!.querySelectorAll('[role="option"]');
  expect(options.length).to.equal(3);
});

it('selects an option on click, sets value, closes and fires tc-change', async () => {
  const el = await withOptions();
  el.open = true;
  await el.updateComplete;
  const second = el.shadowRoot!.querySelectorAll('[role="option"]')[1] as HTMLElement;
  setTimeout(() => second.click());
  const ev = await oneEvent(el, 'tc-change');
  expect(ev.detail.value).to.equal('b');
  expect(el.value).to.equal('b');
  expect(el.open).to.be.false;
  await el.updateComplete;
  expect(el.shadowRoot!.querySelector('.label')!.textContent).to.contain('第二');
});

it('marks the selected option with aria-selected', async () => {
  const el = await withOptions();
  el.value = 'c';
  el.open = true;
  await el.updateComplete;
  const options = el.shadowRoot!.querySelectorAll('[role="option"]');
  expect(options[2].getAttribute('aria-selected')).to.equal('true');
  expect(options[0].getAttribute('aria-selected')).to.equal('false');
});

it('reflects value and open attributes', async () => {
  const el = await withOptions();
  el.value = 'a';
  el.open = true;
  await el.updateComplete;
  expect(el.getAttribute('value')).to.equal('a');
  expect(el.hasAttribute('open')).to.be.true;
});

it('closes on Escape', async () => {
  const el = await withOptions();
  el.open = true;
  await el.updateComplete;
  el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  await el.updateComplete;
  expect(el.open).to.be.false;
});

it('opens with ArrowDown when closed', async () => {
  const el = await withOptions();
  el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
  await el.updateComplete;
  expect(el.open).to.be.true;
});

it('ArrowDown / ArrowUp move the active option and Enter selects it', async () => {
  const el = await withOptions();
  el.open = true;
  await el.updateComplete;
  // opening starts active on first option (index 0)
  el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
  await el.updateComplete;
  // now index 1
  setTimeout(() => el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })));
  const ev = await oneEvent(el, 'tc-change');
  expect(ev.detail.value).to.equal('b');
  expect(el.value).to.equal('b');
});

it('Home and End jump active option to first / last', async () => {
  const el = await withOptions();
  el.open = true;
  await el.updateComplete;
  el.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
  await el.updateComplete;
  let active = el.shadowRoot!.querySelector('.option.active') as HTMLElement;
  expect(active.textContent).to.contain('第三');
  el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
  await el.updateComplete;
  active = el.shadowRoot!.querySelector('.option.active') as HTMLElement;
  expect(active.textContent).to.contain('第一');
});

it('closes when a pointerdown occurs outside the component', async () => {
  const el = await withOptions();
  el.open = true;
  await el.updateComplete;
  document.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
  await el.updateComplete;
  expect(el.open).to.be.false;
});

it('parses options from a JSON string attribute', async () => {
  const json = JSON.stringify(opts);
  const el = await fixture<TcDropdown>(html`<tc-dropdown options=${json}></tc-dropdown>`);
  await el.updateComplete;
  expect(el.options.length).to.equal(3);
  el.open = true;
  await el.updateComplete;
  expect(el.shadowRoot!.querySelectorAll('[role="option"]').length).to.equal(3);
});

it('participates in form submission via setFormValue', async () => {
  const form = await fixture<HTMLFormElement>(
    html`<form><tc-dropdown name="pick" value="b"></tc-dropdown></form>`,
  );
  const data = new FormData(form);
  expect(data.get('pick')).to.equal('b');
});

it('does not open when disabled', async () => {
  const el = await withOptions();
  el.disabled = true;
  await el.updateComplete;
  (el.shadowRoot!.querySelector('.trigger') as HTMLButtonElement).click();
  await el.updateComplete;
  expect(el.open).to.be.false;
  expect(el.shadowRoot!.querySelector('button')!.disabled).to.be.true;
});
