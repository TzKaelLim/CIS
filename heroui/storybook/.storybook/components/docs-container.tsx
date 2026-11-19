import type {Preview} from "@storybook/react";

import {DocsContainer as StorybookDocsContainer} from "@storybook/addon-docs/blocks";
import React, {useEffect, useLayoutEffect, useState} from "react";
import {GLOBALS_UPDATED, SET_GLOBALS} from "storybook/internal/core-events";
import {addons} from "storybook/preview-api";

import {
  THEME_EVENT_NAME,
  THEME_GLOBAL_TYPE_ID,
  ensureThemeKey,
  isDarkTheme,
} from "../addons/theme/constants";
import {updatePreviewTheme} from "../addons/theme/decorator";
import {themes} from "../styles/theme";

/**
 * LOCAL CHANGE: the theme currently selected in the toolbar, readable at ANY
 * mount — Storybook re-mounts this container whenever globals change.
 *
 * Upstream read `context.globals`, but DocsContextProps has no such member, so
 * that was always undefined and every docs page started as "light". Pages with
 * stories only recovered because the withTheme decorator then broadcast
 * THEME_EVENT_NAME; a docs-only MDX page (Welcome) has no story, so it never did.
 *
 * The channel caches the last payload of every event: GLOBALS_UPDATED after any
 * toolbar change, SET_GLOBALS from preview start-up (which already includes
 * globals passed in the iframe URL). The URL is only a last resort.
 */
const readCurrentTheme = (): string | undefined => {
  const channel = addons.getChannel();
  const last = (channel.last(GLOBALS_UPDATED) ?? channel.last(SET_GLOBALS))?.[0] as
    | {globals?: Record<string, unknown>}
    | undefined;
  const fromChannel = last?.globals?.[THEME_GLOBAL_TYPE_ID];

  if (typeof fromChannel === "string") return fromChannel;

  const prefix = `${THEME_GLOBAL_TYPE_ID}:`;

  return new URLSearchParams(window.location.search)
    .get("globals")
    ?.split(";")
    .find((pair) => pair.startsWith(prefix))
    ?.slice(prefix.length);
};

/**
 * Custom DocsContainer that synchronizes the documentation theme
 * with the global theme state selected in the toolbar.
 */
export const DocsContainer: NonNullable<Preview["parameters"]>["docs"]["container"] = ({
  children,
  context,
}) => {
  const [themeKey, setThemeKey] = useState<string>(() => ensureThemeKey(readCurrentTheme()));

  // Sync state when the toolbar changes the theme, and when a story's withTheme
  // decorator broadcasts it (ensures immediate update).
  useEffect(() => {
    const channel = addons.getChannel();
    const apply = (theme: string | undefined) => {
      const next = ensureThemeKey(theme);

      setThemeKey((prev) => (prev === next ? prev : next));
    };
    const handleThemeChange = (event: {theme: string}) => apply(event.theme);
    // LOCAL CHANGE: the core event works on every docs page, stories or not.
    const handleGlobalsUpdated = (payload: {globals?: Record<string, unknown>}) => {
      const theme = payload?.globals?.[THEME_GLOBAL_TYPE_ID];

      if (typeof theme === "string") apply(theme);
    };

    channel.on(THEME_EVENT_NAME, handleThemeChange);
    channel.on(GLOBALS_UPDATED, handleGlobalsUpdated);

    return () => {
      channel.off(THEME_EVENT_NAME, handleThemeChange);
      channel.off(GLOBALS_UPDATED, handleGlobalsUpdated);
    };
  }, []);

  // LOCAL CHANGE: apply data-theme from here as well. The withTheme decorator only
  // runs where a story renders, so a docs-only MDX page never got a data-theme and
  // stayed on the :root light palette under every theme. Layout effect, so the
  // page never paints once in the wrong palette.
  useLayoutEffect(() => {
    updatePreviewTheme(themeKey);
  }, [themeKey]);

  // LOCAL CHANGE: the docs chrome only has light/dark skins; custom themes pick by
  // darkness (a plain themes[themeKey] lookup fell back to light for "tzuchi-dark").
  const selectedTheme = isDarkTheme(themeKey) ? themes.dark : themes.light;

  return (
    <StorybookDocsContainer context={context} theme={selectedTheme}>
      {children}
    </StorybookDocsContainer>
  );
};
