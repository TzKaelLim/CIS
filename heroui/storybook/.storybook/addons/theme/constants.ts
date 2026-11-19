export const THEME_ADDON_ID = "heroui-theme-addon";
export const THEME_GLOBAL_TYPE_ID = "heroui-theme";
export const THEME_PARAM_KEY = "heroui-theme";
export const THEME_EVENT_NAME = "heroui-theme-changed";

// LOCAL CHANGE: Tzu Chi themes first; the gallery opens in "tzuchi"
// (DEFAULT_THEME is THEME_VALUES[0]). "tzuchi" / "tzuchi-dark" come from
// styles/themes/tzuchi; custom dark themes follow HeroUI's "<name>-dark" naming.
export const THEME_VALUES = ["tzuchi", "tzuchi-dark", "light", "dark"] as const;
export type ThemeKey = (typeof THEME_VALUES)[number];

export const DEFAULT_THEME: ThemeKey = THEME_VALUES[0];

export interface ThemeOption {
  value: string;
  title: string;
  description?: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    value: THEME_VALUES[0],
    title: "慈濟 Tzu Chi",
    description: "Tzu Chi theme (light), generated from @tzuchi/tokens",
  },
  {
    value: THEME_VALUES[1],
    title: "慈濟 Tzu Chi Dark",
    description: "Tzu Chi theme (dark), generated from @tzuchi/tokens",
  },
  {
    value: THEME_VALUES[2],
    title: "Light",
    description: "Light theme",
  },
  {
    value: THEME_VALUES[3],
    title: "Dark",
    description: "Dark theme",
  },
];

export const isThemeKey = (value: string | undefined | null): value is ThemeKey =>
  !!value && THEME_VALUES.includes(value as ThemeKey);

export const ensureThemeKey = (value: string | undefined | null): ThemeKey =>
  isThemeKey(value) ? value : DEFAULT_THEME;

/** Whether a theme is a dark one ("dark" or any "<name>-dark"). */
export const isDarkTheme = (value: string): boolean => value === "dark" || value.endsWith("-dark");
