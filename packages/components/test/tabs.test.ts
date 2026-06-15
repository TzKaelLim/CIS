import { expect, fixture, html, oneEvent } from '@open-wc/testing';
import '../dist/tabs/tc-tabs-define.js';
import type { TcTabs } from '../dist/tabs/tc-tabs.js';
import type { TcTab } from '../dist/tabs/tc-tab.js';

const twoTabs = () => html`
  <tc-tabs>
    <tc-tab value="a">第一</tc-tab>
    <tc-tab value="b">第二</tc-tab>
  </tc-tabs>
`;

it('renders default web variant and tablist role', async () => {
  const el = await fixture<TcTabs>(twoTabs());
  expect(el.variant).to.equal('web');
  expect(el.getAttribute('role')).to.equal('tablist');
  expect(el.getAttribute('aria-orientation')).to.equal('horizontal');
});

it('selects the first tab by default', async () => {
  const el = await fixture<TcTabs>(twoTabs());
  await el.updateComplete;
  expect(el.value).to.equal('a');
  const tabs = el.querySelectorAll('tc-tab');
  expect((tabs[0] as TcTab).selected).to.be.true;
  expect(tabs[0].getAttribute('aria-selected')).to.equal('true');
  expect((tabs[1] as TcTab).selected).to.be.false;
});

it('reflects variant attribute', async () => {
  const el = await fixture<TcTabs>(html`<tc-tabs variant="mobile"></tc-tabs>`);
  expect(el.getAttribute('variant')).to.equal('mobile');
});

it('moves selection with ArrowRight and emits tc-tab-change', async () => {
  const el = await fixture<TcTabs>(twoTabs());
  await el.updateComplete;
  const first = el.querySelector('tc-tab') as TcTab;
  first.focus();

  setTimeout(() =>
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })),
  );
  const ev = await oneEvent(el, 'tc-tab-change');
  expect(ev.detail.value).to.equal('b');
  expect(el.value).to.equal('b');
  const tabs = el.querySelectorAll('tc-tab');
  expect((tabs[1] as TcTab).selected).to.be.true;
});

it('ArrowLeft wraps to the last tab', async () => {
  const el = await fixture<TcTabs>(twoTabs());
  await el.updateComplete;
  const first = el.querySelector('tc-tab') as TcTab;
  first.focus();
  el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
  await el.updateComplete;
  expect(el.value).to.equal('b');
});

it('Home and End jump to first / last tab', async () => {
  const el = await fixture<TcTabs>(twoTabs());
  await el.updateComplete;
  el.value = 'a';
  await el.updateComplete;
  const second = el.querySelectorAll('tc-tab')[1] as TcTab;
  second.focus();
  el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
  await el.updateComplete;
  expect(el.value).to.equal('a');
  el.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
  await el.updateComplete;
  expect(el.value).to.equal('b');
});

it('skips disabled tabs during keyboard navigation', async () => {
  const el = await fixture<TcTabs>(html`
    <tc-tabs>
      <tc-tab value="a">一</tc-tab>
      <tc-tab value="b" disabled>二</tc-tab>
      <tc-tab value="c">三</tc-tab>
    </tc-tabs>
  `);
  await el.updateComplete;
  const first = el.querySelector('tc-tab') as TcTab;
  first.focus();
  el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  await el.updateComplete;
  expect(el.value).to.equal('c');
});

it('selects a tab on click and reflects aria-disabled', async () => {
  const el = await fixture<TcTabs>(html`
    <tc-tabs>
      <tc-tab value="a">一</tc-tab>
      <tc-tab value="b" disabled>二</tc-tab>
    </tc-tabs>
  `);
  await el.updateComplete;
  const tabs = el.querySelectorAll('tc-tab');
  expect(tabs[1].getAttribute('aria-disabled')).to.equal('true');
  (tabs[1] as TcTab).click();
  await el.updateComplete;
  // disabled tab cannot be selected
  expect(el.value).to.equal('a');
});
