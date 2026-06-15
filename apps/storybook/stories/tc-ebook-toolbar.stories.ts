import { html } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components-vite';
import '@tzuchi/components/ebook-toolbar';
import '@tzuchi/components/icon';
import '@tzuchi/components/icon-button';

interface EbookToolbarArgs {
  variant: 'brand' | 'light';
  bookTitle: string;
  backLabel: string;
}

const tools = () => html`
  <tc-icon-button label="搜尋"><tc-icon name="search"></tc-icon></tc-icon-button>
  <tc-icon-button label="書籤"><tc-icon name="check"></tc-icon></tc-icon-button>
  <tc-icon-button label="語音朗讀"><tc-icon name="mail"></tc-icon></tc-icon-button>
  <tc-icon-button label="筆記"><tc-icon name="calendar"></tc-icon></tc-icon-button>
  <tc-icon-button label="個人"><tc-icon name="menu"></tc-icon></tc-icon-button>
`;

const meta: Meta<EbookToolbarArgs> = {
  title: 'Components/EbookToolbar',
  component: 'tc-ebook-toolbar',
  parameters: { layout: 'fullscreen' },
  argTypes: {
    variant: { control: 'inline-radio', options: ['light', 'brand'] },
    bookTitle: { control: 'text' },
    backLabel: { control: 'text' },
  },
  args: { variant: 'light', bookTitle: '書籍名稱', backLabel: '返回' },
  render: (a) => html`
    <div style="padding:var(--tc-space-24,24px)">
      <tc-ebook-toolbar
        variant=${a.variant}
        book-title=${a.bookTitle}
        back-label=${a.backLabel}
        @tc-back=${() => console.log('tc-back')}
      >
        ${tools()}
      </tc-ebook-toolbar>
    </div>
    <p style="padding:0 var(--tc-space-24,24px);margin:0;color:var(--tc-color-text-muted,#616161)">
      將視窗縮小至 768px 以下，書名會由置中改為靠左貼近返回鍵。
    </p>
  `,
};
export default meta;

type Story = StoryObj<EbookToolbarArgs>;

export const Light: Story = {};
export const Brand: Story = { args: { variant: 'brand' } };
export const LongTitle: Story = {
  args: { bookTitle: '無量義經偈頌——德行品第一（精選導讀版）' },
};
export const TitleSlot: Story = {
  render: (a) => html`
    <div style="padding:var(--tc-space-24,24px)">
      <tc-ebook-toolbar variant=${a.variant} back-label=${a.backLabel}>
        <span slot="title" style="font:var(--tc-typography-title,700 20px/1.4 sans-serif)"
          >自訂書名（title 插槽）</span
        >
        ${tools()}
      </tc-ebook-toolbar>
    </div>
  `,
};
