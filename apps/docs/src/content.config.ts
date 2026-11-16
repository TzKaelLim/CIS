import { defineCollection } from 'astro:content';
import { docsLoader, i18nLoader } from '@astrojs/starlight/loaders';
import { docsSchema, i18nSchema } from '@astrojs/starlight/schema';

export const collections = {
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
  // Starlight 0.34 只設一個繁體中文語系時，會用簡體中文的字串蓋過 zh-TW 內建翻譯
  // （例如「本页内容」「搜索」）。這裡放一份 Starlight 自己的 zh-TW 翻譯，使用者翻譯的
  // 優先順序最高，介面文字才會是繁體中文。只改了三條：淺色／深色選單的標籤叫「色彩模式」
  // （手冊裡「主題」專指網站主題），上一頁／下一頁用台灣常見的說法。
  i18n: defineCollection({ loader: i18nLoader(), schema: i18nSchema() }),
};
