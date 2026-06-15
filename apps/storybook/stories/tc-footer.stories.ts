import { html } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components-vite';
import '@tzuchi/components/footer';
import '@tzuchi/components/button';
import '@tzuchi/components/link';

interface FooterArgs {
  variant: 'light' | 'brand';
  copyright: string;
}

const socialLink = (label: string, seed: string) => html`
  <a
    slot="social"
    href="#"
    aria-label=${label}
    style="display:inline-flex;width:32px;height:32px;border-radius:6px;overflow:hidden"
  >
    <img
      src="https://picsum.photos/seed/${seed}/32/32"
      alt=""
      style="width:100%;height:100%;object-fit:cover"
    />
  </a>
`;

const columns = () => html`
  <tc-footer-column label="公益慈善">
    <tc-link variant="subtle" href="#">國際賑災</tc-link>
    <tc-link variant="subtle" href="#">全球志工服務</tc-link>
    <tc-link variant="subtle" href="#">環保推廣</tc-link>
  </tc-footer-column>
  <tc-footer-column label="醫療志業">
    <tc-link variant="subtle" href="#">慈濟醫療基金會</tc-link>
    <tc-link variant="subtle" href="#">花蓮慈濟醫院</tc-link>
    <tc-link variant="subtle" href="#">骨髓幹細胞中心</tc-link>
    <tc-link variant="subtle" href="#">人醫會</tc-link>
  </tc-footer-column>
  <tc-footer-column label="教育志業">
    <tc-link variant="subtle" href="#">慈濟大學</tc-link>
    <tc-link variant="subtle" href="#">慈濟科技大學</tc-link>
    <tc-link variant="subtle" href="#">慈大附中</tc-link>
  </tc-footer-column>
  <tc-footer-column label="人文志業">
    <tc-link variant="subtle" href="#">大愛電視台</tc-link>
    <tc-link variant="subtle" href="#">經典雜誌</tc-link>
    <tc-link variant="subtle" href="#">慈濟人文志業中心</tc-link>
  </tc-footer-column>
`;

const meta: Meta<FooterArgs> = {
  title: 'Components/Footer',
  component: 'tc-footer',
  parameters: { layout: 'fullscreen' },
  argTypes: {
    variant: { control: 'inline-radio', options: ['light', 'brand'] },
    copyright: { control: 'text' },
  },
  args: {
    variant: 'light',
    copyright: 'Copyright © 2020 Open Source Matters. 版權所有, Copyright, Tzu Chi Foundation.',
  },
  render: (a) => html`
    <tc-footer variant=${a.variant} copyright=${a.copyright}>
      ${socialLink('Facebook', 'fb')} ${socialLink('Instagram', 'ig')}
      ${socialLink('YouTube', 'yt')} ${socialLink('TikTok', 'tt')}
      <div slot="brand">
        <strong style="display:block;font-size:18px;margin-bottom:8px">花蓮本會</strong>
        <p style="margin:0 0 12px">花蓮縣花蓮市國強里 11 鄰中央路三段 703 號<br />03 856 6779</p>
        <tc-button variant="filled">聯絡我們</tc-button>
      </div>
      ${columns()}
    </tc-footer>
  `,
};
export default meta;

type Story = StoryObj<FooterArgs>;

export const Light: Story = {};
export const Brand: Story = { args: { variant: 'brand' } };
