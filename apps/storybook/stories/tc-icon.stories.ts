import { html } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components-vite';
import '@tzuchi/components/icon';

const NAMES = [
  'search',
  'close',
  'menu',
  'plus',
  'check',
  'chevron-down',
  'chevron-up',
  'chevron-left',
  'chevron-right',
  'calendar',
  'mail',
] as const;

interface IconArgs {
  name: (typeof NAMES)[number];
  size: 'sm' | 'md' | 'lg';
  label: string;
}

const meta: Meta<IconArgs> = {
  title: 'Components/Icon',
  component: 'tc-icon',
  argTypes: {
    name: { control: 'select', options: NAMES },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    label: { control: 'text' },
  },
  args: { name: 'search', size: 'md', label: '' },
  render: (a) => html`<tc-icon name=${a.name} size=${a.size} label=${a.label}></tc-icon>`,
};
export default meta;

type Story = StoryObj<IconArgs>;

export const Default: Story = {};

export const Sizes: Story = {
  render: () => html`
    <div style="display:flex; align-items:center; gap:1rem;">
      <tc-icon name="calendar" size="sm"></tc-icon>
      <tc-icon name="calendar" size="md"></tc-icon>
      <tc-icon name="calendar" size="lg"></tc-icon>
    </div>
  `,
};

export const Gallery: Story = {
  render: () => html`
    <div style="display:flex; flex-wrap:wrap; gap:1.25rem; color:var(--tc-color-brand-primary);">
      ${NAMES.map((n) => html`<tc-icon name=${n} size="md" label=${n}></tc-icon>`)}
    </div>
  `,
};

export const InheritsColor: Story = {
  render: () => html`
    <div style="display:flex; align-items:center; gap:.5rem; color:var(--tc-color-feedback-error);">
      <tc-icon name="close" size="md"></tc-icon>
      <span>currentColor 繼承文字色</span>
    </div>
  `,
};
