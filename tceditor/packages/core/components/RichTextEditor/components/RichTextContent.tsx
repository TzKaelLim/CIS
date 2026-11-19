import getClassNameFactory from "../../../lib/get-class-name-factory";
import { renderRichText } from "../../../lib/richtext/render";
import styles from "../styles.module.css";

const getClassName = getClassNameFactory("RichTextEditor", styles);

/**
 * Displays rich text with the shared renderer. Uses no hooks, so it can be
 * rendered by React Server Components.
 */
export function RichTextContent({ content }: { content: unknown }) {
  return (
    <div className={getClassName()}>
      <div className="rich-text">{renderRichText(content)}</div>
    </div>
  );
}
