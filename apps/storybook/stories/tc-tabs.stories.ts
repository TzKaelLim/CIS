import { html } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components-vite';
import '@tzuchi/components/tabs';

interface TabsArgs {
  variant: 'web' | 'mobile';
  value: string;
}

const meta: Meta<TabsArgs> = {
  title: 'Components/Tabs',
  component: 'tc-tabs',
  argTypes: {
    variant: { control: 'inline-radio', options: ['web', 'mobile'] },
    value: { control: 'text' },
  },
  args: { variant: 'web', value: 'overview' },
  render: (a) =>
    html`<tc-tabs variant=${a.variant} value=${a.value}>
      <tc-tab value="overview">總覽</tc-tab>
      <tc-tab value="news">最新消息</tc-tab>
      <tc-tab value="donate">前往捐款</tc-tab>
      <tc-tab value="contact" disabled>聯絡我們</tc-tab>
    </tc-tabs>`,
};
export default meta;

type Story = StoryObj<TabsArgs>;

export const Web: Story = {};
export const Mobile: Story = { args: { variant: 'mobile' } };
export const SecondSelected: Story = { args: { value: 'news' } };
