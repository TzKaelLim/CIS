import { html } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components-vite';
import '@tzuchi/components/icon-button';

interface IconButtonArgs {
  variant: 'tonal' | 'filled';
  size: 'md' | 'lg';
  disabled: boolean;
  label: string;
}

const arrow = html`<svg
  viewBox="0 0 24 24"
  width="100%"
  height="100%"
  fill="currentColor"
  aria-hidden="true"
>
  <path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
</svg>`;

const meta: Meta<IconButtonArgs> = {
  title: 'Components/IconButton',
  component: 'tc-icon-button',
  argTypes: {
    variant: { control: 'inline-radio', options: ['tonal', 'filled'] },
    size: { control: 'inline-radio', options: ['md', 'lg'] },
    disabled: { control: 'boolean' },
    label: { control: 'text' },
  },
  args: { variant: 'tonal', size: 'md', disabled: false, label: '返回' },
  render: (a) =>
    html`<tc-icon-button
      variant=${a.variant}
      size=${a.size}
      label=${a.label}
      ?disabled=${a.disabled}
      >${arrow}</tc-icon-button
    >`,
};
export default meta;

type Story = StoryObj<IconButtonArgs>;

export const Tonal: Story = {};
export const Filled: Story = { args: { variant: 'filled' } };
export const Large: Story = { args: { variant: 'filled', size: 'lg' } };
export const Disabled: Story = { args: { disabled: true } };
