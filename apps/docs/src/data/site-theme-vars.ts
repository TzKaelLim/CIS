// 讓手冊裡「真正的 <tc-*> 元件」跟著頁首的「主題」選單變色。
//
// tokens.css 在 :root 宣告預設主題（Default）的語意色，並在 [data-theme='dark'] 換成深色。
// 這裡替每個「非預設」主題產生兩條規則，只寫和 Default 不同的語意色：
//
//   html[data-site="green-natural"] { --tc-color-brand-primary: #…; … }
//   html[data-site="green-natural"][data-theme="dark"] { … }
//
// data-site 是不認得的值（例如改名前的舊值 eco）時，沒有一條規則符合，元件就用 tokens.css
// 的預設值，也就是 Default。
//
// 規則寫在 <html>（也就是 :root）上，所以 tokens.css 裡參照語意色的元件 token
// （例如 --tc-link-fg: var(--tc-color-brand-primary-hover)）會在 :root 重新計算，元件不用改。
// 選擇器比 tokens.css 的 :root 和 [data-theme='dark'] 更具體，載入順序也排在 tokens.css 之後。
// Starlight 一定會在 <html> 設好 data-theme（light 或 dark），所以色彩模式也跟得上。
//
// 只影響 --tc-*（元件的顏色），不影響手冊本身的 --sl-* 外觀。
import { MODES, SITE_THEMES, varName, type SiteTheme } from './site-themes';

/** 虛擬 CSS 模組的名稱；astro.config.mjs 的 customCss 用它載入。 */
export const SITE_THEME_VARS_MODULE = 'virtual:tc-site-theme-vars.css';

function declarations(site: SiteTheme, mode: 'light' | 'dark', tokens: readonly string[]): string {
  return tokens.map((token) => `  ${varName(token)}: ${site[mode][token]};`).join('\n');
}

export function siteThemeVarsCss(): string {
  const blocks: string[] = [
    '/* 由 src/data/site-theme-vars.ts 依 site-themes.ts 產生，請勿手動修改。預設以外的主題都是示意值（非正式）；data-site 屬性名稱是提案（Q4）。 */',
  ];
  for (const site of SITE_THEMES) {
    if (site.isDefault) continue;
    const changedIn = Object.fromEntries(
      MODES.map((mode) => [mode, site.diff.filter((d) => d.mode === mode).map((d) => d.token)]),
    ) as Record<'light' | 'dark', string[]>;
    if (changedIn.light.length > 0) {
      blocks.push(
        `html[data-site="${site.id}"] {\n${declarations(site, 'light', changedIn.light)}\n}`,
      );
    }
    // 深色要把「淺色改過的」也一起寫：否則上一條（比 tokens.css 的深色規則更具體）
    // 會讓淺色的值留在深色模式裡。
    if (site.changed.length > 0) {
      blocks.push(
        `html[data-site="${site.id}"][data-theme="dark"] {\n${declarations(site, 'dark', site.changed)}\n}`,
      );
    }
  }
  return `${blocks.join('\n\n')}\n`;
}
