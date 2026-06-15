import { html } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components-vite';
import '@tzuchi/components/pagination';

interface PaginationArgs {
  total: number;
  page: number;
  siblingCount: number;
}

const meta: Meta<PaginationArgs> = {
  title: 'Components/Pagination',
  component: 'tc-pagination',
  argTypes: {
    total: { control: { type: 'number', min: 1 } },
    page: { control: { type: 'number', min: 1 } },
    siblingCount: { control: { type: 'number', min: 0 }, name: 'sibling-count' },
  },
  args: { total: 8, page: 1, siblingCount: 1 },
  render: (a) =>
    html`<tc-pagination
      total=${a.total}
      page=${a.page}
      sibling-count=${a.siblingCount}
      @tc-page-change=${(e: CustomEvent<{ page: number }>) =>
        console.log('tc-page-change', e.detail.page)}
    ></tc-pagination>`,
};
export default meta;

type Story = StoryObj<PaginationArgs>;

export const Default: Story = {};
export const FewPages: Story = { args: { total: 5, page: 3 } };
export const ManyPages: Story = { args: { total: 20, page: 10 } };
export const WiderWindow: Story = { args: { total: 20, page: 10, siblingCount: 2 } };
export const LastPage: Story = { args: { total: 8, page: 8 } };
