// React-free rules shared by the editor, page validators and server code
// (@tzuchi/tceditor/rules). Built by tsup.rules.config.ts without the React
// import that the other entries get. Import every module by its own path:
// lib/richtext/index.ts also exports renderRichText, which needs React.
export type {
  RichTextDoc,
  RichTextMark,
  RichTextNode,
} from "../lib/richtext/types";
export { isSafeHref } from "../lib/richtext/is-safe-href";
export {
  normalizeRichText,
  RICHTEXT_MAX_DEPTH,
} from "../lib/richtext/normalize";
export { textToRichText } from "../lib/richtext/text-to-richtext";
export { stableStringify } from "../lib/richtext/stable-stringify";
export { fitRichTextToTypes } from "../lib/richtext/fit-to-types";
export type { RichTextTypes } from "../lib/richtext/fit-to-types";
export {
  RICHTEXT_FEATURES,
  isRichTextFeature,
  richTextFeaturesToOptions,
  richTextFeaturesToTypes,
} from "../lib/richtext/features";
export type {
  RichTextFeature,
  RichTextFeatureOptions,
} from "../lib/richtext/features";
export { isComponentAllowed } from "../lib/data/is-component-allowed";
export type { ComponentAllowRules } from "../lib/data/is-component-allowed";
