import type { Decorator, Preview } from "@storybook/react-vite";
import "@tzuchi/tceditor-blocks/styles.css";

const DEFAULT_THEME = "tzuchi";

// Runs during render, so the first paint already has the theme; switching the
// toolbar re-renders the story and runs it again.
const withDocumentSettings: Decorator = (Story, context) => {
  const theme =
    typeof context.globals.theme === "string"
      ? context.globals.theme
      : DEFAULT_THEME;
  document.documentElement.dataset.theme = theme;
  document.documentElement.lang = "zh-Hant";
  return <Story />;
};

const preview: Preview = {
  decorators: [withDocumentSettings],
  globalTypes: {
    theme: {
      description: "主題",
      toolbar: {
        title: "主題",
        icon: "paintbrush",
        items: [
          { value: "tzuchi", title: "慈濟" },
          { value: "tzuchi-dark", title: "慈濟深色" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: DEFAULT_THEME },
  tags: ["autodocs"],
};

export default preview;
