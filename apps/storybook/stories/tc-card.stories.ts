import { html } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components-vite';
import '@tzuchi/components/card';
import '@tzuchi/components/button';

interface CardArgs {
  variant: 'elevated' | 'outlined';
  interactive: boolean;
  href: string;
  width: string;
}

const meta: Meta<CardArgs> = {
  title: 'Components/Card',
  component: 'tc-card',
  argTypes: {
    variant: { control: 'inline-radio', options: ['elevated', 'outlined'] },
    interactive: { control: 'boolean' },
    href: { control: 'text' },
    width: { control: 'text' },
  },
  args: { variant: 'elevated', interactive: false, href: '', width: '360px' },
  render: (a) => html`
    <tc-card
      variant=${a.variant}
      ?interactive=${a.interactive}
      href=${a.href || ''}
      width=${a.width || ''}
    >
      <img
        slot="media"
        src="https://picsum.photos/seed/tzuchi/720/420"
        alt="示意圖片"
        style="display:block;width:100%;aspect-ratio:16/10;object-fit:cover"
      />
      <span slot="headline">專案名稱</span>
      <p style="margin:0;color:var(--tc-color-text-muted,#616161)">
        2022-03-21 ｜ TCnews 慈善新聞網
      </p>
      <tc-button slot="footer" variant="filled">捐款</tc-button>
    </tc-card>
  `,
};
export default meta;

type Story = StoryObj<CardArgs>;

export const Elevated: Story = {};
export const Outlined: Story = { args: { variant: 'outlined' } };
export const Interactive: Story = { args: { interactive: true } };
export const AsLink: Story = { args: { href: '#article' } };
