import { html } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components-vite';
import '@tzuchi/components/dropdown';

interface DropdownArgs {
  placeholder: string;
  value: string;
  disabled: boolean;
  open: boolean;
}

const options = [
  { value: 'tw', label: '台灣' },
  { value: 'jp', label: '日本' },
  { value: 'us', label: '美國' },
];

const meta: Meta<DropdownArgs> = {
  title: 'Components/Dropdown',
  component: 'tc-dropdown',
  argTypes: {
    placeholder: { control: 'text' },
    value: { control: 'text' },
    disabled: { control: 'boolean' },
    open: { control: 'boolean' },
  },
  args: { placeholder: '請選擇地區', value: '', disabled: false, open: false },
  render: (a) =>
    html`<tc-dropdown
      .options=${options}
      placeholder=${a.placeholder}
      value=${a.value}
      ?disabled=${a.disabled}
      ?open=${a.open}
    ></tc-dropdown>`,
};
export default meta;

type Story = StoryObj<DropdownArgs>;

export const Default: Story = {};

export const WithValue: Story = { args: { value: 'jp' } };

export const Open: Story = { args: { open: true } };

export const Disabled: Story = { args: { disabled: true } };
