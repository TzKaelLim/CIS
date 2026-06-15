import { html } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components-vite';
import '@tzuchi/components/navbar';
import '@tzuchi/components/link';
import '@tzuchi/components/icon';
import '@tzuchi/components/icon-button';

interface NavbarArgs {
  variant: 'brand' | 'light';
  sticky: boolean;
  open: boolean;
}

const meta: Meta<NavbarArgs> = {
  title: 'Components/Navbar',
  component: 'tc-navbar',
  parameters: { layout: 'fullscreen' },
  argTypes: {
    variant: { control: 'inline-radio', options: ['light', 'brand'] },
    sticky: { control: 'boolean' },
    open: { control: 'boolean' },
  },
  args: { variant: 'light', sticky: false, open: false },
  render: (a) => html`
    <tc-navbar variant=${a.variant} ?sticky=${a.sticky} ?open=${a.open}>
      <strong slot="brand" style="font:var(--tc-typography-subtitle,700 16px/1.5 sans-serif)"
        >慈濟</strong
      >
      <tc-link href="#news">全球消息</tc-link>
      <tc-link href="#events">活動訊息</tc-link>
      <tc-link href="#donate">前往捐款</tc-link>
      <tc-link href="#about">關於我們</tc-link>
      <tc-icon-button slot="actions" label="搜尋">
        <tc-icon name="search"></tc-icon>
      </tc-icon-button>
    </tc-navbar>
    <p style="padding:var(--tc-space-24,24px);margin:0;color:var(--tc-color-text-muted,#616161)">
      將視窗縮小至 768px 以下即可看到漢堡選單與抽屜。
    </p>
  `,
};
export default meta;

type Story = StoryObj<NavbarArgs>;

export const Light: Story = {};
export const Brand: Story = { args: { variant: 'brand' } };
export const Sticky: Story = { args: { sticky: true } };
export const DrawerOpen: Story = { args: { open: true } };
