import { html } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components-vite';
import '@tzuchi/components/button';

interface ButtonArgs {
  variant: 'filled' | 'outlined' | 'tonal';
  disabled: boolean;
  fullWidth: boolean;
}

const meta: Meta<ButtonArgs> = {
  title: 'Components/Button',
  component: 'tc-button',
  argTypes: {
    variant: { control: 'inline-radio', options: ['filled', 'outlined', 'tonal'] },
    disabled: { control: 'boolean' },
    fullWidth: { control: 'boolean', name: 'full-width' },
  },
  args: { variant: 'filled', disabled: false, fullWidth: false },
  render: (a) =>
    html`<tc-button
      variant=${a.variant}
      ?disabled=${a.disabled}
      ?full-width=${a.fullWidth}
      >送出</tc-button
    >`,
};
export default meta;

type Story = StoryObj<ButtonArgs>;

export const Filled: Story = {};
export const Outlined: Story = { args: { variant: 'outlined' } };
export const Tonal: Story = { args: { variant: 'tonal' } };
