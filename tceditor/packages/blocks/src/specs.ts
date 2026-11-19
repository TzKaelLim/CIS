import { buttonSpec } from "./button/spec";
import { cardSpec } from "./card/spec";
import { columnsSpec } from "./columns/spec";
import { headingSpec } from "./heading/spec";
import { imageSpec } from "./image/spec";
import { paragraphSpec } from "./paragraph/spec";
import { sectionSpec } from "./section/spec";
import { tagListSpec } from "./tag-list/spec";

/** The registered blocks, in the order the editor lists them. */
export const blockSpecs = [
  headingSpec,
  paragraphSpec,
  buttonSpec,
  cardSpec,
  tagListSpec,
  sectionSpec,
  columnsSpec,
  imageSpec,
] as const;

export { pageRootSpec } from "./root/spec";

export type BlockType = (typeof blockSpecs)[number]["type"];

/**
 * Editor categories, in display order. `title` equals the `category` of the
 * specs it holds. createEditorConfig adds a hidden "deprecated" category.
 */
export const CATEGORIES = [
  { key: "text", title: "文字" },
  { key: "interactive", title: "互動" },
  { key: "content", title: "內容" },
  { key: "layout", title: "版面" },
] as const;

export type { ButtonProps } from "./button/spec";
export type { CardProps } from "./card/spec";
export type { ColumnsProps } from "./columns/spec";
export type { HeadingProps } from "./heading/spec";
export type { ImageProps } from "./image/spec";
export type { ParagraphProps } from "./paragraph/spec";
export type { PageRootProps } from "./root/spec";
export type { SectionProps } from "./section/spec";
export type { TagListProps } from "./tag-list/spec";
