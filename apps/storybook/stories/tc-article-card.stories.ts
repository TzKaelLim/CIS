import { html } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components-vite';
import '@tzuchi/components/article-card';
import '@tzuchi/components/chip';
import '@tzuchi/components/icon-button';

interface ArticleCardArgs {
  orientation: 'vertical' | 'horizontal';
  featured: boolean;
  video: boolean;
  interactive: boolean;
  href: string;
  width: string;
}

const meta: Meta<ArticleCardArgs> = {
  title: 'Components/ArticleCard',
  component: 'tc-article-card',
  argTypes: {
    orientation: { control: 'inline-radio', options: ['vertical', 'horizontal'] },
    featured: { control: 'boolean' },
    video: { control: 'boolean' },
    interactive: { control: 'boolean' },
    href: { control: 'text' },
    width: { control: 'text' },
  },
  args: {
    orientation: 'vertical',
    featured: false,
    video: false,
    interactive: false,
    href: '',
    width: '360px',
  },
  render: (a) => html`
    <tc-article-card
      orientation=${a.orientation}
      ?featured=${a.featured}
      ?video=${a.video}
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
      <tc-chip slot="badge">慈善</tc-chip>
      <span slot="headline">慈濟志工於寒冬中送暖，關懷獨居長者與弱勢家庭</span>
      <p slot="excerpt">
        志工們走入社區，為長者送上熱食與生活物資，並協助清掃居家環境，傳遞關懷與溫暖。
      </p>
      <span slot="meta">2022-03-21 ｜ TCnews 慈善新聞網</span>
    </tc-article-card>
  `,
};
export default meta;

type Story = StoryObj<ArticleCardArgs>;

export const Vertical: Story = {};

export const Featured: Story = {
  args: { featured: true, width: '480px' },
};

export const Horizontal: Story = {
  args: { orientation: 'horizontal', width: '560px' },
};

export const Video: Story = {
  args: { video: true },
};

export const Interactive: Story = {
  args: { interactive: true },
};

export const AsLink: Story = {
  args: { href: '#article' },
};

export const WithActions: Story = {
  render: (a) => html`
    <tc-article-card orientation=${a.orientation} href="#article" width=${a.width || '360px'}>
      <img
        slot="media"
        src="https://picsum.photos/seed/tzuchi-actions/720/420"
        alt="示意圖片"
        style="display:block;width:100%;aspect-ratio:16/10;object-fit:cover"
      />
      <tc-chip slot="badge">志工早會</tc-chip>
      <span slot="headline">點整張卡片即可前往，動作區仍可獨立點擊</span>
      <span slot="meta">2022-03-21</span>
      <tc-icon-button slot="actions" variant="tonal" label="讚">♥</tc-icon-button>
      <tc-icon-button slot="actions" variant="tonal" label="分享">↗</tc-icon-button>
    </tc-article-card>
  `,
};
