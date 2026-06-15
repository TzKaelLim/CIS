import { html } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components-vite';
import '@tzuchi/components/list-panel';
import '@tzuchi/components/link';

interface ListPanelArgs {
  label: string;
  variant: 'brand' | 'plain';
  width: string;
}

const row = (title: string) => html`
  <article>
    <h3
      style="margin:0 0 4px;font:var(--tc-typography-subtitle,700 16px/1.5 sans-serif);color:var(--tc-color-brand-primary,#1b2d58)"
    >
      ${title}
    </h3>
    <p
      style="margin:0 0 4px;font:var(--tc-typography-body,400 16px/1.6 sans-serif);color:var(--tc-color-text-muted,#616161)"
    >
      2023-06-15
    </p>
    <p
      style="margin:0;display:flex;justify-content:space-between;color:var(--tc-color-text-muted,#616161)"
    >
      <span>顏博文 執行長</span>
      <span style="display:flex;gap:16px">
        <tc-link href="#like" variant="subtle">讚</tc-link>
        <tc-link href="#share" variant="subtle">分享</tc-link>
      </span>
    </p>
  </article>
`;

const meta: Meta<ListPanelArgs> = {
  title: 'Components/ListPanel',
  component: 'tc-list-panel',
  argTypes: {
    label: { control: 'text' },
    variant: { control: 'inline-radio', options: ['brand', 'plain'] },
    width: { control: 'text' },
  },
  args: { label: '內部觀點：領航慈濟', variant: 'brand', width: '360px' },
  render: (a) => html`
    <tc-list-panel label=${a.label} variant=${a.variant} width=${a.width || ''}>
      ${row('目前做的事情原因與做法做法')} ${row('目前做的事情原因與做法')}
      ${row('用願力與行動翻轉人生')}
    </tc-list-panel>
  `,
};
export default meta;

type Story = StoryObj<ListPanelArgs>;

export const Brand: Story = {};
export const Plain: Story = { args: { variant: 'plain' } };
export const CustomHeader: Story = {
  render: (a) => html`
    <tc-list-panel variant=${a.variant} width=${a.width || ''}>
      <h2
        slot="header"
        style="margin:0;display:flex;align-items:center;gap:8px;font:var(--tc-typography-heading-4,700 24px/1.4 sans-serif)"
      >
        <img
          src="https://picsum.photos/seed/tzuchi-lp/32/32"
          alt=""
          style="width:24px;height:24px;border-radius:50%"
        />
        內部觀點：領航慈濟
      </h2>
      ${row('目前做的事情原因與做法做法')} ${row('目前做的事情原因與做法')}
    </tc-list-panel>
  `,
};
