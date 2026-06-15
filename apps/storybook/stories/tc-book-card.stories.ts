import { html } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components-vite';
import '@tzuchi/components/book-card';
import '@tzuchi/components/link';

interface BookCardArgs {
  ratio: 'portrait' | 'square';
  interactive: boolean;
  href: string;
  width: string;
}

const meta: Meta<BookCardArgs> = {
  title: 'Components/BookCard',
  component: 'tc-book-card',
  argTypes: {
    ratio: { control: 'inline-radio', options: ['portrait', 'square'] },
    interactive: { control: 'boolean' },
    href: { control: 'text' },
    width: { control: 'text' },
  },
  args: { ratio: 'portrait', interactive: false, href: '', width: '240px' },
  render: (a) => html`
    <tc-book-card
      ratio=${a.ratio}
      ?interactive=${a.interactive}
      href=${a.href || ''}
      width=${a.width || ''}
    >
      <img slot="cover" src="https://picsum.photos/seed/tzuchibook/300/400" alt="書籍封面" />
      <span slot="title">證嚴上人 每日一叮嚀</span>
      <span slot="subtitle">世間祥和在於心……</span>
      <tc-link slot="footer" href="#more">更多</tc-link>
    </tc-book-card>
  `,
};
export default meta;

type Story = StoryObj<BookCardArgs>;

export const Portrait: Story = {};
export const Square: Story = { args: { ratio: 'square' } };
export const Interactive: Story = { args: { interactive: true } };
export const AsLink: Story = { args: { href: '#book' } };
