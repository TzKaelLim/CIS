import type { Preview } from '@storybook/web-components-vite';
import { setCustomElementsManifest } from '@storybook/web-components-vite';
import customElements from '@tzuchi/components/custom-elements.json';
import '@tzuchi/tokens/tokens.css';

setCustomElementsManifest(customElements);

const preview: Preview = {
  parameters: { a11y: { test: 'error' } },
  tags: ['autodocs'],
};

export default preview;
