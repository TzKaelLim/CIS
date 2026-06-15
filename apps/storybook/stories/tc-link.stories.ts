import { html } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components-vite';
import '@tzuchi/components/link';

interface LinkArgs {
  variant: 'default' | 'subtle';
  href: string;
  target: string;
  rel: string;
  disabled: boolean;
  label: string;
}

const meta: Meta<LinkArgs> = {
  title: 'Components/Link',
  component: 'tc-link',
  argTypes: {
    variant: { control: 'inline-radio', options: ['default', 'subtle'] },
    href: { control: 'text' },
    target: { control: 'text' },
    rel: { control: 'text' },
    disabled: { control: 'boolean' },
    label: { control: 'text' },
  },
  args: {
    variant: 'default',
    href: '#',
    target: '',
    rel: '',
    disabled: false,
    label: '詳細了解我們所做的',
  },
  render: (a) =>
    html`<tc-link
      variant=${a.variant}
      href=${a.href}
      target=${a.target}
      rel=${a.rel}
      ?disabled=${a.disabled}
      >${a.label}</tc-link
    >`,
};
export default meta;

type Story = StoryObj<LinkArgs>;

export const Default: Story = {};
export const Subtle: Story = { args: { variant: 'subtle' } };
export const Disabled: Story = { args: { disabled: true } };

export const Inline: Story = {
  render: (a) =>
    html`<p style="font: var(--tc-typography-body, 400 16px/1.6 sans-serif); max-width: 32rem;">
      慈濟基金會在全球推動慈善志業，歡迎您
      <tc-link variant=${a.variant} href=${a.href}>${a.label}</tc-link>
      ，一起成就善的循環。
    </p>`,
};
