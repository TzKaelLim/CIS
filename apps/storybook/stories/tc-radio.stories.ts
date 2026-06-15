import { html } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components-vite';
import '@tzuchi/components/radio';

interface RadioArgs {
  checked: boolean;
  disabled: boolean;
  value: string;
  name: string;
}

const meta: Meta<RadioArgs> = {
  title: 'Components/Radio',
  component: 'tc-radio',
  argTypes: {
    checked: { control: 'boolean' },
    disabled: { control: 'boolean' },
    value: { control: 'text' },
    name: { control: 'text' },
  },
  args: { checked: false, disabled: false, value: 'a', name: 'demo' },
  render: (a) =>
    html`<tc-radio name=${a.name} value=${a.value} ?checked=${a.checked} ?disabled=${a.disabled}
      >選項</tc-radio
    >`,
};
export default meta;

type Story = StoryObj<RadioArgs>;

export const Off: Story = {};
export const On: Story = { args: { checked: true } };
export const Disabled: Story = { args: { disabled: true } };

export const Group: Story = {
  render: () => html`
    <div style="display:flex; flex-direction:column; gap:.75rem;">
      <tc-radio name="fruit" value="apple" checked>蘋果</tc-radio>
      <tc-radio name="fruit" value="banana">香蕉</tc-radio>
      <tc-radio name="fruit" value="cherry">櫻桃</tc-radio>
      <tc-radio name="fruit" value="durian" disabled>榴槤（停用）</tc-radio>
    </div>
  `,
};
