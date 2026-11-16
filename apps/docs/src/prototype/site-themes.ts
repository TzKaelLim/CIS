// 設計示範（prototype）：「一套 UIKit、多個網站主題」的資料。
//
// 每個網站一筆 SiteTheme。預設主題（慈濟入口網）的值在建置時直接從真正的 token
// 原始檔（primitive + 淺色語意 + 深色覆寫）解析成色碼；其他網站只寫「要改哪些語意色」，
// 其餘全部沿用預設主題。新增第三個網站 = 在 SITE_THEMES 裡多加一筆 defineSite(...)。
//
// 這裡不修改 packages/tokens：示範主題需要的額外綠色階寫在 DEMO_PRIMITIVES，
// 只存在這個檔案裡，標明為示意值（非正式）。
import primitiveJson from '../../../../packages/tokens/src/primitive/color.tokens.json';
import lightJson from '../../../../packages/tokens/src/semantic/color.tokens.json';
import darkJson from '../../../../packages/tokens/src/themes/dark/color.tokens.json';

export type Mode = 'light' | 'dark';
export const MODES: readonly Mode[] = ['light', 'dark'];
export const MODE_LABEL: Record<Mode, string> = { light: '淺色', dark: '深色' };

/** 語意 token 名稱（不含 `color.` 前綴），例如 `brand.primary`。 */
export type TokenName = string;
/** 一個模式（淺色或深色）下，每個語意 token 對應的實際色碼。 */
export type SemanticMap = Readonly<Record<TokenName, string>>;

export interface TokenDiff {
  token: TokenName;
  mode: Mode;
  預設值: string;
  本主題值: string;
}

export interface SiteTheme {
  id: string;
  名稱: string;
  /** 側欄與標籤用的短名稱，例如「入口網」。 */
  簡稱: string;
  /** 一句話描述主色，例如「藍色系」。 */
  色系: string;
  說明: string;
  /** 一句話介紹，用在總覽頁的網站主題卡片上。 */
  摘要: string;
  /** 哪些網站或單位使用這個主題。 */
  使用對象: string;
  /** true = 示範用的假設主題，顏色不是正式值。 */
  isDemo: boolean;
  /** 只有預設主題為 true。 */
  isDefault: boolean;
  light: SemanticMap;
  dark: SemanticMap;
  /** 與預設主題解析後色碼不同的 token（淺色、深色分開列）。 */
  diff: readonly TokenDiff[];
  /** 改過的 token（淺色、深色合併、不重複），順序依照原始檔。 */
  changed: readonly TokenName[];
  /** 用到、但不在正式基礎色票裡的示意色碼（DEMO_PRIMITIVES）。 */
  示意色: readonly string[];
}

/** 每個語意 token 的中文用途，給非工程背景的讀者看。 */
export const TOKEN_LABEL: Record<TokenName, string> = {
  'brand.primary': '主色',
  'brand.primary-hover': '主色（滑鼠移上時；連結文字也用它）',
  'brand.surface': '品牌底色（襯在內容後的品牌色塊）',
  'brand.surface-hover': '品牌底色（滑鼠移上時）',
  'neutral.surface': '中性底色',
  'neutral.surface-hover': '中性底色（滑鼠移上時）',
  'text.default': '文字',
  'text.muted': '次要文字',
  'text.disabled': '停用文字',
  'text.on-brand': '主色上的文字',
  'surface.default': '背景',
  'surface.subtle': '淡背景',
  'border.default': '邊框',
  'border.strong': '強調邊框',
  'border.focus': '焦點框（用鍵盤選到時的外框）',
  'feedback.error': '錯誤提示',
  'feedback.success': '成功提示',
  'feedback.warning': '警告提示',
  'feedback.info': '資訊提示',
};

export const tokenLabel = (token: TokenName): string => TOKEN_LABEL[token] ?? token;
export const varName = (token: TokenName): string => `--tc-color-${token.replace(/\./g, '-')}`;

// ---------------------------------------------------------------------------
// 讀取真正的 token 原始檔
// ---------------------------------------------------------------------------

type JsonTree = { [key: string]: unknown };

/** 把巢狀的 DTCG token 樹攤平成「路徑 → $value」。 */
function flatten(tree: JsonTree, prefix = '', out: Record<string, string> = {}) {
  for (const [key, node] of Object.entries(tree)) {
    if (key.startsWith('$') || node === null || typeof node !== 'object') continue;
    const value = (node as { $value?: unknown }).$value;
    if (typeof value === 'string') out[`${prefix}${key}`] = value;
    else flatten(node as JsonTree, `${prefix}${key}.`, out);
  }
  return out;
}

const REAL_PRIMITIVES = flatten(primitiveJson as JsonTree);

/**
 * 示意值（非正式）：環保網示範主題要用的綠色階。正式 primitive 只有 green.600 與
 * green.400，所以其他色階暫時定義在這裡；它們不會進入 packages/tokens。
 */
export const DEMO_PRIMITIVES: Readonly<Record<string, string>> = {
  'color.green.900': '#0F4A37',
  'color.green.700': '#16704F',
  'color.green.500': '#2E9E74',
  'color.green.300': '#8FD8B5',
  'color.green.250': '#ACE3C8',
  'color.green.200': '#CDEBDB',
  'color.green.100': '#E6F4EC',
};

for (const key of Object.keys(DEMO_PRIMITIVES)) {
  if (key in REAL_PRIMITIVES) throw new Error(`示意色階 ${key} 與正式 primitive 重名`);
}

const PRIMITIVES: Readonly<Record<string, string>> = { ...REAL_PRIMITIVES, ...DEMO_PRIMITIVES };

/** 語意 token 的原始參照（例如 `{color.blue.900}`），去掉 `color.` 前綴。 */
function semanticRefs(tree: JsonTree): Record<TokenName, string> {
  const flat = flatten(tree);
  return Object.fromEntries(
    Object.entries(flat).map(([path, ref]) => [path.replace(/^color\./, ''), ref]),
  );
}

const DEFAULT_REFS: Record<Mode, Record<TokenName, string>> = {
  light: semanticRefs(lightJson as JsonTree),
  // 深色只覆寫一部分；沒寫到的（例如 feedback.info）沿用淺色的參照，
  // 但參照會在深色的語意表裡重新解析，所以 info 仍會跟著深色主色走。
  dark: { ...semanticRefs(lightJson as JsonTree), ...semanticRefs(darkJson as JsonTree) },
};

/** 全部語意 token，順序依照淺色原始檔。 */
export const SEMANTIC_TOKENS: readonly TokenName[] = Object.keys(DEFAULT_REFS.light);

/** 把一個模式的參照表解析成色碼。參照可以指向 primitive，也可以指向另一個語意 token。 */
function resolveMode(refs: Record<TokenName, string>): SemanticMap {
  const resolve = (value: string, seen: readonly string[]): string => {
    if (!value.startsWith('{')) return value.toUpperCase();
    const path = value.slice(1, -1);
    if (path in PRIMITIVES) return PRIMITIVES[path].toUpperCase();
    const semantic = path.replace(/^color\./, '');
    if (semantic in refs) {
      if (seen.includes(semantic)) throw new Error(`語意 token 循環參照：${seen.join(' → ')}`);
      return resolve(refs[semantic], [...seen, semantic]);
    }
    throw new Error(`找不到 token 參照 ${value}`);
  };
  return Object.fromEntries(
    Object.keys(refs).map((token) => [token, resolve(refs[token], [token])]),
  );
}

// ---------------------------------------------------------------------------
// 網站主題
// ---------------------------------------------------------------------------

interface SiteInput {
  id: string;
  名稱: string;
  簡稱: string;
  色系: string;
  說明: string;
  摘要: string;
  使用對象: string;
  isDemo: boolean;
  /** 只寫要改的語意 token；值是 `{color.…}` 參照或色碼。省略 = 沿用預設主題。 */
  overrides?: Partial<Record<Mode, Record<TokenName, string>>>;
}

const DEFAULT_RESOLVED: Record<Mode, SemanticMap> = {
  light: resolveMode(DEFAULT_REFS.light),
  dark: resolveMode(DEFAULT_REFS.dark),
};

/** 網站主題的 id 會出現在網址（?site=…）、HTML 屬性和產生的 CSS 裡，所以只允許小寫英數和連字號。 */
const SITE_ID_PATTERN = /^[a-z][a-z0-9-]{0,31}$/;

function defineSite(input: SiteInput, isDefault = false): SiteTheme {
  if (!SITE_ID_PATTERN.test(input.id))
    throw new Error(`網站主題 id「${input.id}」只能用小寫英數和連字號`);
  const resolved = {} as Record<Mode, SemanticMap>;
  const diff: TokenDiff[] = [];
  const demoHexes = new Set<string>();
  for (const mode of MODES) {
    const overrides = input.overrides?.[mode] ?? {};
    for (const [token, ref] of Object.entries(overrides)) {
      if (!(token in DEFAULT_REFS[mode])) throw new Error(`${input.id}：沒有語意 token ${token}`);
      const path = ref.slice(1, -1);
      if (path in DEMO_PRIMITIVES) demoHexes.add(DEMO_PRIMITIVES[path].toUpperCase());
    }
    resolved[mode] = resolveMode({ ...DEFAULT_REFS[mode], ...overrides });
    for (const token of SEMANTIC_TOKENS) {
      const before = DEFAULT_RESOLVED[mode][token];
      const after = resolved[mode][token];
      if (before !== after) diff.push({ token, mode, 預設值: before, 本主題值: after });
    }
  }
  const changedSet = new Set(diff.map((d) => d.token));
  return {
    id: input.id,
    名稱: input.名稱,
    簡稱: input.簡稱,
    色系: input.色系,
    說明: input.說明,
    摘要: input.摘要,
    使用對象: input.使用對象,
    isDemo: input.isDemo,
    isDefault,
    light: resolved.light,
    dark: resolved.dark,
    diff,
    changed: SEMANTIC_TOKENS.filter((token) => changedSet.has(token)),
    示意色: [...demoHexes],
  };
}

export const SITE_THEMES: readonly SiteTheme[] = [
  defineSite(
    {
      id: 'portal',
      名稱: '慈濟入口網',
      簡稱: '入口網',
      色系: '藍色系',
      說明: '預設網站主題。顏色直接取自 UIKit 正式的色彩設定（設計數值，token：每個有名字的顏色、字級、間距）；其他網站沒有特別指定的顏色，都沿用這一套。',
      摘要: '預設網站主題，藍色系。顏色取自 UIKit 正式的色彩設定。',
      使用對象: '（示意）慈濟基金會官方入口網站，以及還沒有自己網站主題的網站。名稱待核定。',
      isDemo: false,
    },
    true,
  ),
  defineSite({
    id: 'eco',
    名稱: '慈濟環保網',
    簡稱: '環保網',
    色系: '綠色系',
    說明: '示意網站主題：把主色換成綠色系，用來說明「同一套元件，換一組語意色」的效果。顏色是示意值（非正式）。',
    摘要: '綠色系的示意網站主題，只換了品牌相關的顏色。',
    使用對象: '（示意）慈濟環保推廣相關網站。實際名稱與是否採用待核定。',
    isDemo: true,
    overrides: {
      light: {
        'brand.primary': '{color.green.900}',
        'brand.primary-hover': '{color.green.700}',
        'brand.surface': '{color.green.100}',
        'brand.surface-hover': '{color.green.200}',
        'border.focus': '{color.green.500}',
        // feedback.info 原本就指向 brand.primary，不用改也會跟著變綠。
      },
      dark: {
        'brand.primary': '{color.green.300}',
        'brand.primary-hover': '{color.green.250}',
        'brand.surface': '{color.green.900}',
        'brand.surface-hover': '{color.green.700}',
        'border.focus': '{color.green.300}',
        // 深色模式的「主色上的文字」在預設主題是深藍，換成深綠才和綠色主色搭配。
        'text.on-brand': '{color.green.900}',
      },
    },
  }),
];

for (const [i, site] of SITE_THEMES.entries()) {
  if (SITE_THEMES.findIndex((s) => s.id === site.id) !== i)
    throw new Error(`網站主題 id 重複：${site.id}`);
}

export const DEFAULT_SITE: SiteTheme = SITE_THEMES.find((s) => s.isDefault) ?? SITE_THEMES[0];

/** 選單、卡片用的名稱；示意主題加註「（示意）」。 */
export const siteLabel = (site: SiteTheme): string =>
  site.isDemo ? `${site.名稱}（示意）` : site.名稱;

/** 這個網站主題在手冊裡的說明頁。 */
export const sitePageUrl = (site: SiteTheme): string => `/themes/${site.id}/`;

export function getSite(id: string): SiteTheme {
  const site = SITE_THEMES.find((s) => s.id === id);
  if (!site) throw new Error(`沒有 id 為 ${id} 的網站主題`);
  return site;
}

// ---------------------------------------------------------------------------
// 範例畫面用的 CSS 變數與對比檢查
// ---------------------------------------------------------------------------

/**
 * 範例畫面只用這些「固定色碼」的 CSS 變數（--p-*），寫在範例外框的 style 上，
 * 所以不受手冊本身的亮暗模式或全域 --tc-* 變數影響。
 */
export function sampleVars(site: SiteTheme, mode: Mode): string {
  const map = site[mode];
  const pick = (token: TokenName) => map[token] ?? '#FF00FF';
  const vars: Record<string, string> = {
    '--p-brand': pick('brand.primary'),
    '--p-brand-hover': pick('brand.primary-hover'),
    '--p-brand-surface': pick('brand.surface'),
    '--p-brand-surface-hover': pick('brand.surface-hover'),
    '--p-on-brand': pick('text.on-brand'),
    '--p-text': pick('text.default'),
    '--p-text-muted': pick('text.muted'),
    '--p-surface': pick('surface.default'),
    '--p-surface-subtle': pick('surface.subtle'),
    '--p-border': pick('border.default'),
    '--p-focus': pick('border.focus'),
    '--p-success': pick('feedback.success'),
    '--p-info': pick('feedback.info'),
  };
  return Object.entries(vars)
    .map(([k, v]) => `${k}:${v}`)
    .join(';');
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 對比值，例如 4.5 代表 4.5:1。 */
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
}

export interface ContrastCheck {
  說明: string;
  mode: Mode;
  前景: string;
  背景: string;
  ratio: number;
  通過: boolean;
}

/** 文字和底色的對比檢查（一般文字要 4.5:1 以上）。 */
export function contrastChecks(site: SiteTheme): ContrastCheck[] {
  const pairs: [string, TokenName, TokenName][] = [
    ['主色按鈕上的文字', 'text.on-brand', 'brand.primary'],
    ['背景上的主色文字', 'brand.primary', 'surface.default'],
    // 次要文字是所有網站共用的正式 token，不是主題造成的；照實列出，避免讓人以為整頁都合格。
    ['背景上的次要文字（所有網站共用）', 'text.muted', 'surface.default'],
  ];
  return MODES.flatMap((mode) =>
    pairs.map(([說明, fg, bg]) => {
      const ratio = contrast(site[mode][fg], site[mode][bg]);
      return { 說明, mode, 前景: site[mode][fg], 背景: site[mode][bg], ratio, 通過: ratio >= 4.5 };
    }),
  );
}
