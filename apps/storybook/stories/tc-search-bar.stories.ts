import { html } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components-vite';
import '@tzuchi/components/search-bar';

interface SearchBarArgs {
  value: string;
  placeholder: string;
  name: string;
  disabled: boolean;
  withCategory: boolean;
  category: string;
}

const categories = [
  { value: 'all', label: '全部' },
  { value: 'book', label: '跨書搜尋' },
  { value: 'article', label: '文章' },
];

const meta: Meta<SearchBarArgs> = {
  title: 'Components/SearchBar',
  component: 'tc-search-bar',
  argTypes: {
    value: { control: 'text' },
    placeholder: { control: 'text' },
    name: { control: 'text' },
    disabled: { control: 'boolean' },
    withCategory: { control: 'boolean' },
    category: { control: 'text' },
  },
  args: {
    value: '',
    placeholder: '搜尋',
    name: 'q',
    disabled: false,
    withCategory: false,
    category: '',
  },
  render: (a) =>
    html`<tc-search-bar
      value=${a.value}
      placeholder=${a.placeholder}
      name=${a.name}
      category=${a.category}
      ?disabled=${a.disabled}
      ?with-category=${a.withCategory}
      .categories=${a.withCategory ? categories : []}
    ></tc-search-bar>`,
};
export default meta;

type Story = StoryObj<SearchBarArgs>;

export const Default: Story = {};

export const WithValue: Story = { args: { value: '蓮花' } };

export const Disabled: Story = { args: { disabled: true, value: '停用' } };

export const WithCategory: Story = {
  args: { withCategory: true, category: 'book' },
};
