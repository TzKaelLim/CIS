import { html } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components-vite';
import '@tzuchi/components/theme-toggle';

interface ThemeToggleArgs {
  showLabel: boolean;
}

const meta: Meta<ThemeToggleArgs> = {
  title: 'Components/ThemeToggle',
  component: 'tc-theme-toggle',
  argTypes: {
    showLabel: { control: 'boolean' },
  },
  args: {
    showLabel: false,
  },
  parameters: {
    docs: {
      description: {
        component:
          '切換 `<html data-theme>`。深色色票由 `@tzuchi/tokens` 的 `[data-theme="dark"]` 區塊提供，所有元件自動跟隨。亦可用上方工具列的 Theme 全域切換預覽各元件深色樣式。',
      },
    },
  },
  render: (a) => html`<tc-theme-toggle ?show-label=${a.showLabel}></tc-theme-toggle>`,
};
export default meta;

type Story = StoryObj<ThemeToggleArgs>;

export const Default: Story = {};

export const WithLabel: Story = { args: { showLabel: true } };
