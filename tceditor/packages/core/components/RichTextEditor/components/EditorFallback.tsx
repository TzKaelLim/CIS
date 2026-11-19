/**
 * Fallback component. Should not import the Tiptap editor (@tiptap/react,
 * @tiptap/core) except for types; it renders with the shared static renderer.
 */

import { memo } from "react";
import { EditorProps } from "../types";
import { LoadedRichTextMenuInner } from "../../RichTextMenu/inner";
import { EditorInner } from "./EditorInner";
import { renderRichText } from "../../../lib/richtext/render";

export const EditorFallback = memo((props: EditorProps) => {
  return (
    <EditorInner
      {...props}
      editor={null}
      menu={
        <LoadedRichTextMenuInner
          field={props.field}
          editor={null}
          editorState={null}
          readOnly={props.readOnly ?? false}
        />
      }
    >
      {/* Same renderer as the published page, so nothing shifts when the
          editor finishes loading */}
      <div className="rich-text">{renderRichText(props.content)}</div>
    </EditorInner>
  );
});

EditorFallback.displayName = "EditorFallback";
