import { html } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components-vite';
import '@tzuchi/components/chip';

interface ChipArgs {
  variant: 'assist' | 'filter';
  disabled: boolean;
  selected: boolean;
  removable: boolean;
  label: string;
}

const meta: Meta<ChipArgs> = {
  title: 'Components/Chip',
  component: 'tc-chip',
  argTypes: {
    variant: { control: 'inline-radio', options: ['assist', 'filter'] },
    disabled: { control: 'boolean' },
    selected: { control: 'boolean' },
    removable: { control: 'boolean' },
    label: { control: 'text' },
  },
  args: {
    variant: 'assist',
    disabled: false,
    selected: false,
    removable: false,
    label: '連結',
  },
  render: (a) =>
    html`<tc-chip
      variant=${a.variant}
      ?disabled=${a.disabled}
      ?selected=${a.selected}
      ?removable=${a.removable}
      >${a.label}</tc-chip
    >`,
};
export default meta;

type Story = StoryObj<ChipArgs>;

export const Default: Story = {};
export const Selected: Story = { args: { selected: true } };
export const Removable: Story = { args: { removable: true, label: '增加' } };
export const Disabled: Story = { args: { disabled: true, label: '停用' } };
export const Filter: Story = { args: { variant: 'filter', label: '篩選' } };

export const WithLeadingIcon: Story = {
  render: (a) =>
    html`<tc-chip ?selected=${a.selected} ?removable=${a.removable}>
      <span slot="leading" aria-hidden="true">★</span>${a.label}
    </tc-chip>`,
};
