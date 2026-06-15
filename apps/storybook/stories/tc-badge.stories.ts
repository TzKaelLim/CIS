import { html } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components-vite';
import '@tzuchi/components/badge';

interface BadgeArgs {
  tone: 'neutral' | 'brand' | 'success' | 'error' | 'warning' | 'info';
  variant: 'filled' | 'soft' | 'outline';
  size: 'sm' | 'md';
  dot: boolean;
  pill: boolean;
  label: string;
}

const meta: Meta<BadgeArgs> = {
  title: 'Components/Badge',
  component: 'tc-badge',
  argTypes: {
    tone: {
      control: 'inline-radio',
      options: ['neutral', 'brand', 'success', 'error', 'warning', 'info'],
    },
    variant: { control: 'inline-radio', options: ['filled', 'soft', 'outline'] },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
    dot: { control: 'boolean' },
    pill: { control: 'boolean' },
    label: { control: 'text' },
  },
  args: {
    tone: 'neutral',
    variant: 'soft',
    size: 'md',
    dot: false,
    pill: false,
    label: '標籤',
  },
  render: (a) =>
    html`<tc-badge tone=${a.tone} variant=${a.variant} size=${a.size} ?dot=${a.dot} ?pill=${a.pill}
      >${a.label}</tc-badge
    >`,
};
export default meta;

type Story = StoryObj<BadgeArgs>;

export const Default: Story = {};

export const Brand: Story = { args: { tone: 'brand', label: '兒少' } };

export const Tones: Story = {
  render: () => html`
    <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
      <tc-badge tone="neutral">neutral</tc-badge>
      <tc-badge tone="brand">brand</tc-badge>
      <tc-badge tone="success">success</tc-badge>
      <tc-badge tone="error">error</tc-badge>
      <tc-badge tone="warning">warning</tc-badge>
      <tc-badge tone="info">info</tc-badge>
    </div>
  `,
};

export const Variants: Story = {
  render: () => html`
    <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
      <tc-badge tone="brand" variant="soft">soft</tc-badge>
      <tc-badge tone="brand" variant="filled">filled</tc-badge>
      <tc-badge tone="brand" variant="outline">outline</tc-badge>
    </div>
  `,
};

export const Sizes: Story = {
  render: () => html`
    <div style="display:flex; gap:8px; align-items:center;">
      <tc-badge tone="brand" size="md">Medium</tc-badge>
      <tc-badge tone="brand" size="sm">Small</tc-badge>
    </div>
  `,
};

export const WithStatusDot: Story = {
  render: () => html`
    <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
      <tc-badge tone="success" dot>上線</tc-badge>
      <tc-badge tone="error" dot>離線</tc-badge>
      <tc-badge tone="warning" dot>待處理</tc-badge>
    </div>
  `,
};

export const Pill: Story = {
  render: () => html`
    <div style="display:flex; gap:8px; align-items:center;">
      <tc-badge tone="brand" pill>99+</tc-badge>
      <tc-badge tone="error" variant="filled" pill>12</tc-badge>
    </div>
  `,
};
