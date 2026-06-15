import { html } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components-vite';
import '@tzuchi/components/container';
import '@tzuchi/components/card';

interface ContainerArgs {
  size: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  gutter: boolean;
  centered: boolean;
}

const filler = (label: string) => html`
  <div
    style="
      background: var(--tc-color-brand-surface, #eaf0ff);
      border: 1px dashed var(--tc-color-brand-primary, #1b2d58);
      color: var(--tc-color-brand-primary, #1b2d58);
      padding: var(--tc-space-24, 24px);
      border-radius: var(--tc-radius-md, 12px);
      text-align: center;
      font: var(--tc-typography-body, 400 16px/1.6 'Noto Sans TC', sans-serif);
    "
  >
    ${label}
  </div>
`;

const meta: Meta<ContainerArgs> = {
  title: 'Components/Container',
  component: 'tc-container',
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg', 'xl', 'full'] },
    gutter: { control: 'boolean' },
    centered: { control: 'boolean' },
  },
  args: { size: 'xl', gutter: true, centered: true },
  // a tinted page backdrop so the centered max-width box is visible
  decorators: [
    (story) =>
      html`<div style="background: var(--tc-color-surface-subtle, #f5f5f5); padding-block: 24px;">
        ${story()}
      </div>`,
  ],
  render: (a) => html`
    <tc-container size=${a.size} ?gutter=${a.gutter} ?centered=${a.centered}>
      ${filler(`版心容器 size="${a.size}"（最大寬度 + 隨視窗增長的左右內距）`)}
    </tc-container>
  `,
};
export default meta;

type Story = StoryObj<ContainerArgs>;

export const Default: Story = {};
export const Small: Story = { args: { size: 'sm' } };
export const Medium: Story = { args: { size: 'md' } };
export const Large: Story = { args: { size: 'lg' } };
export const Full: Story = { args: { size: 'full' } };
export const NoGutter: Story = { args: { gutter: false } };
export const NotCentered: Story = { args: { centered: false } };

export const WithCards: Story = {
  render: (a) => html`
    <tc-container size=${a.size} ?gutter=${a.gutter} ?centered=${a.centered}>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:24px">
        <tc-card variant="elevated"><span slot="headline">卡片一</span></tc-card>
        <tc-card variant="elevated"><span slot="headline">卡片二</span></tc-card>
        <tc-card variant="elevated"><span slot="headline">卡片三</span></tc-card>
      </div>
    </tc-container>
  `,
};
