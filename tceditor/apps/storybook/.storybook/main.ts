import type { StorybookConfig } from "@storybook/react-vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import type { ChannelLike } from "storybook/internal/channels";
import {
  REQUEST_WHATS_NEW_DATA,
  RESULT_WHATS_NEW_DATA,
} from "storybook/internal/core-events";

// experimental_serverChannel is a preset hook that StorybookConfig does not
// declare; main.ts is itself the last preset, so it runs after Storybook's own.
type Config = StorybookConfig & {
  experimental_serverChannel(channel: ChannelLike): Promise<ChannelLike>;
};

const config: Config = {
  // Paths here are relative to this .storybook directory, so the repo root is
  // three levels up. A wrong glob still builds, with no stories (the smoke
  // check catches that).
  stories: ["../../../packages/blocks/src/**/*.stories.tsx"],
  // The demo images live in the showcase's public folder; serve the same files
  // at the same URL (/demo-assets/demo-<n>.svg) as the showcase does.
  staticDirs: [
    { from: "../../showcase/public/demo-assets", to: "/demo-assets" },
  ],
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y"],
  framework: { name: "@storybook/react-vite", options: {} },
  // argTypes come from the block specs; docgen cannot read their labels.
  typescript: { reactDocgen: false },
  core: {
    disableTelemetry: true,
    disableWhatsNewNotifications: true,
    enableCrashReports: false,
  },
  // In dev, opening the Storybook UI makes the server fetch
  // https://storybook.js.org/whats-new/v1 even with
  // disableWhatsNewNotifications. Answer that request locally instead.
  async experimental_serverChannel(channel) {
    channel.removeAllListeners(REQUEST_WHATS_NEW_DATA);
    channel.on(REQUEST_WHATS_NEW_DATA, () => {
      channel.emit(RESULT_WHATS_NEW_DATA, { data: { status: "ERROR" } });
    });
    return channel;
  },
  async viteFinal(viteConfig) {
    // @storybook/react-vite does not add the React plugin: without it the
    // stories in packages/blocks compile to classic JSX and fail with
    // "React is not defined". @tailwindcss/vite builds the blocks stylesheet.
    viteConfig.plugins = [
      ...(viteConfig.plugins ?? []),
      react(),
      tailwindcss(),
    ];
    return viteConfig;
  },
};

export default config;
