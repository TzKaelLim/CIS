import type {Preview} from "@storybook/react";

import {withInternationalization} from "./addons/i18n/decorator";
import {i18nGlobalType} from "./addons/i18n/preview";
import {withReduceMotion} from "./addons/reduce-motion/decorator";
import {reduceMotionGlobalType} from "./addons/reduce-motion/preview";
import {withReactStrictMode} from "./addons/strict-mode/decorator";
import {strictModeGlobalType} from "./addons/strict-mode/preview";
import {DEFAULT_THEME, THEME_GLOBAL_TYPE_ID} from "./addons/theme/constants";
import {withTheme} from "./addons/theme/decorator";
import {themeGlobalType} from "./addons/theme/preview";
import {DocsContainer} from "./components/docs-container";

import "./globals.css";

const parameters: Preview["parameters"] = {
  layout: "fullscreen",
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
  options: {
    storySort: {
      method: "alphabetical",
      order: ["Welcome", "Color System", "Components Demo", "Colors Demo"],
    },
  },
  docs: {
    container: DocsContainer,
  },
};

const decorators: Preview["decorators"] = [
  withReactStrictMode,
  withTheme,
  withInternationalization,
  withReduceMotion,
];

const globalTypes = {
  ...i18nGlobalType,
  ...themeGlobalType,
  ...reduceMotionGlobalType,
  ...strictModeGlobalType,
};

const preview: Preview = {
  decorators,
  parameters,
  globalTypes,
  // LOCAL CHANGE: react-scan removed (it forced itself on in production and loaded
  // /react-scan/* from an absolute path); the initial global is now the theme, so the
  // gallery opens in the Tzu Chi theme.
  initialGlobals: {
    [THEME_GLOBAL_TYPE_ID]: DEFAULT_THEME,
  },
  tags: ["autodocs"],
};

export default preview;
