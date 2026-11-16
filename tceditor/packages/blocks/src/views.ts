import { ButtonView } from "./button/view";
import { CardView } from "./card/view";
import { ColumnsView } from "./columns/view";
import { HeadingView } from "./heading/view";
import { ImageView } from "./image/view";
import { ParagraphView } from "./paragraph/view";
import type { BlockViews } from "./render-config";
import { SectionView } from "./section/view";
import type { blockSpecs } from "./specs";
import { TagListView } from "./tag-list/view";

/**
 * The view of every block in blockSpecs, by type (spec §3.3, §7.1). A new
 * block adds one line here. TypeScript fails while a registered block has no
 * view, while a view's props do not match its spec (ViewProps), or for a type
 * that is not registered. Server-safe: views are server components.
 */
export const views = {
  Heading: HeadingView,
  Paragraph: ParagraphView,
  Button: ButtonView,
  Card: CardView,
  TagList: TagListView,
  Section: SectionView,
  Columns: ColumnsView,
  Image: ImageView,
} satisfies BlockViews<typeof blockSpecs>;
