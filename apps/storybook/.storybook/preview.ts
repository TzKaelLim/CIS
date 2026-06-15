import type { Preview } from '@storybook/web-components-vite';
import { setCustomElementsManifest } from '@storybook/web-components-vite';
import customElements from '@tzuchi/components/custom-elements.json';
import '@tzuchi/tokens/tokens.css';

setCustomElementsManifest(customElements);

/** Drive the design-system theme from the toolbar by setting <html data-theme>
 *  (the same attribute the tokens.css dark block keys off) and reflecting the
 *  surface/text tokens onto the preview canvas so contrast is visible. */
function applyTheme(theme: 'light' | 'dark'): void {
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  document.body.style.background = 'var(--tc-color-surface-default)';
  document.body.style.color = 'var(--tc-color-text-default)';
}

const preview: Preview = {
  parameters: { a11y: { test: 'error' } },
  tags: ['autodocs'],
  initialGlobals: { theme: 'light' },
  globalTypes: {
    theme: {
      description: '設計系統主題（淺色 / 深色）',
      toolbar: {
        title: 'Theme',
        icon: 'contrast',
        items: [
          { value: 'light', title: '淺色 Light', icon: 'sun' },
          { value: 'dark', title: '深色 Dark', icon: 'moon' },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (story, context) => {
      applyTheme(context.globals.theme === 'dark' ? 'dark' : 'light');
      return story();
    },
  ],
};

export default preview;
