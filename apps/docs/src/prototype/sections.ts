// 設計示範：手冊的五個區域（首頁、文件、元件、範本、網站主題）。
//
// 頁首的區域導覽、側欄「只顯示目前區域」、上一頁／下一頁不跨區域，全部由這個清單決定。
// astro.config.mjs 的側欄設定也用這裡的 label 當最上層群組名稱，兩邊才對得起來。

export type SectionId = 'home' | 'docs' | 'components' | 'templates' | 'themes';

export interface Section {
  id: SectionId;
  /** 頁首和側欄群組上的名稱。 */
  label: string;
  /** 區域的入口頁。 */
  href: string;
  /** 網址以這些開頭的頁面屬於這個區域。首頁沒有前綴，只比對 `/`。 */
  prefixes: readonly string[];
}

export const HOME: Section = { id: 'home', label: '首頁', href: '/', prefixes: [] };

/** 頁首導覽依這個順序排列（首頁由網站名稱連結代表，不在這裡）。 */
export const SECTIONS: readonly Section[] = [
  // /foundations/* 保留原本的網址，但屬於「文件」。
  { id: 'docs', label: '文件', href: '/docs/', prefixes: ['/docs/', '/foundations/'] },
  { id: 'components', label: '元件', href: '/components/', prefixes: ['/components/'] },
  { id: 'templates', label: '範本', href: '/templates/', prefixes: ['/templates/'] },
  { id: 'themes', label: '網站主題', href: '/themes/', prefixes: ['/themes/'] },
];

/** 補上結尾斜線，`/components` 和 `/components/` 視為同一頁。 */
const normalize = (pathname: string): string =>
  pathname.endsWith('/') ? pathname : `${pathname}/`;

/** 這個網址屬於哪個區域；找不到時（例如 404 頁）回傳首頁。 */
export function sectionForPath(pathname: string): Section {
  const path = normalize(pathname);
  return SECTIONS.find((s) => s.prefixes.some((prefix) => path.startsWith(prefix))) ?? HOME;
}

/** 這個網址是不是區域的入口頁本身。 */
export const isSectionHome = (section: Section, pathname: string): boolean =>
  normalize(pathname) === section.href;

export function getSection(id: SectionId): Section {
  if (id === 'home') return HOME;
  const section = SECTIONS.find((s) => s.id === id);
  if (!section) throw new Error(`沒有 id 為 ${id} 的區域`);
  return section;
}
