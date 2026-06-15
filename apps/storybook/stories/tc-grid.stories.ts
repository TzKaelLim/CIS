import { html } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components-vite';
import '@tzuchi/components/grid';
import '@tzuchi/components/card';

interface GridArgs {
  columns: number;
  mobileColumns: number;
  minColWidth: string;
  gap: string;
  align: 'stretch' | 'start' | 'center' | 'end';
}

const cell = (n: number) => html`
  <div
    style="background:var(--tc-color-brand-surface,#eaf0ff);color:var(--tc-color-brand-primary,#1b2d58);border-radius:var(--tc-radius-md,8px);padding:var(--tc-space-16,16px);text-align:center;font:var(--tc-typography-body,400 16px/1.6 sans-serif)"
  >
    ${n}
  </div>
`;

const cells = (count: number) => Array.from({ length: count }, (_, i) => cell(i + 1));

const meta: Meta<GridArgs> = {
  title: 'Components/Grid',
  component: 'tc-grid',
  parameters: { layout: 'padded' },
  argTypes: {
    columns: { control: { type: 'number', min: 1, max: 12 } },
    mobileColumns: { control: { type: 'number', min: 1, max: 4 } },
    minColWidth: { control: 'text' },
    gap: { control: 'text' },
    align: { control: 'inline-radio', options: ['stretch', 'start', 'center', 'end'] },
  },
  args: { columns: 3, mobileColumns: 1, minColWidth: '', gap: '16', align: 'stretch' },
  render: (a) => html`
    <tc-grid
      columns=${a.columns}
      mobile-columns=${a.mobileColumns}
      min-col-width=${a.minColWidth || ''}
      gap=${a.gap || ''}
      align=${a.align}
    >
      ${cells(9)}
    </tc-grid>
  `,
};
export default meta;

type Story = StoryObj<GridArgs>;

export const FixedColumns: Story = {};

export const TwelveColumn: Story = { args: { columns: 12 } };

export const AutoFit: Story = {
  args: { minColWidth: '240px' },
  render: (a) => html`
    <tc-grid min-col-width=${a.minColWidth || '240px'} gap=${a.gap || '16'}> ${cells(8)} </tc-grid>
  `,
};

export const WithCards: Story = {
  args: { columns: 3, gap: '24' },
  render: (a) => html`
    <tc-grid columns=${a.columns} gap=${a.gap || '24'} mobile-columns="1">
      ${Array.from(
        { length: 6 },
        (_, i) => html`
          <tc-card variant="outlined">
            <span slot="headline">卡片 ${i + 1}</span>
            <p style="margin:0;color:var(--tc-color-text-muted,#616161)">grid 自動排版</p>
          </tc-card>
        `,
      )}
    </tc-grid>
  `,
};
