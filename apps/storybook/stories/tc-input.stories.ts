import { html } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components-vite';
import '@tzuchi/components/input';

interface InputArgs {
  type: 'text' | 'email' | 'password' | 'number' | 'search' | 'tel';
  label: string;
  placeholder: string;
  value: string;
  helperText: string;
  errorText: string;
  disabled: boolean;
  readonly: boolean;
  required: boolean;
  invalid: boolean;
}

const meta: Meta<InputArgs> = {
  title: 'Components/Input',
  component: 'tc-input',
  argTypes: {
    type: {
      control: 'inline-radio',
      options: ['text', 'email', 'password', 'number', 'search', 'tel'],
    },
    label: { control: 'text' },
    placeholder: { control: 'text' },
    value: { control: 'text' },
    helperText: { control: 'text', name: 'helper-text' },
    errorText: { control: 'text', name: 'error-text' },
    disabled: { control: 'boolean' },
    readonly: { control: 'boolean' },
    required: { control: 'boolean' },
    invalid: { control: 'boolean' },
  },
  args: {
    type: 'text',
    label: '',
    placeholder: '請輸入關鍵字',
    value: '',
    helperText: '',
    errorText: '',
    disabled: false,
    readonly: false,
    required: false,
    invalid: false,
  },
  render: (a) =>
    html`<tc-input
      type=${a.type}
      label=${a.label}
      placeholder=${a.placeholder}
      .value=${a.value}
      helper-text=${a.helperText}
      error-text=${a.errorText}
      ?disabled=${a.disabled}
      ?readonly=${a.readonly}
      ?required=${a.required}
      ?invalid=${a.invalid}
      style="width:478px;"
    ></tc-input>`,
};
export default meta;

type Story = StoryObj<InputArgs>;

export const Enabled: Story = {};
export const WithLabel: Story = {
  args: { label: '關鍵字', helperText: '輸入後按 Enter 搜尋' },
};
export const Filled: Story = { args: { value: '輸入關鍵字後' } };
export const Invalid: Story = {
  args: { label: '信箱', value: 'not-an-email', invalid: true, errorText: '信箱格式錯誤' },
};
export const Disabled: Story = { args: { value: '無法編輯', disabled: true } };
