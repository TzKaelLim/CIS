import type { Editor, EditorStateSnapshot } from "@tiptap/react";
import { useSyncedEditor } from "./lib/use-synced-editor";
import { defaultEditorState } from "./selector";
import { RichtextField, UiState } from "../../types";
import type { RichTextDoc } from "../../lib/richtext/types";

export type RichTextSelector = (
  ctx: EditorStateSnapshot,
  readOnly: boolean
) => Partial<Record<string, boolean>>;

export type DefaultEditorState = ReturnType<typeof defaultEditorState>;

export type EditorState<Selector extends RichTextSelector = RichTextSelector> =
  DefaultEditorState &
    ReturnType<Selector> &
    Record<string, boolean | undefined>;

export type EditorProps = {
  onChange: (content: RichTextDoc, uiState?: Partial<UiState>) => void;
  /** Tiptap JSON. A legacy HTML string is shown as plain text. */
  content: RichTextDoc | string;
  readOnly?: boolean;
  inline?: boolean;
  field: RichtextField;
  onFocus?: (editor: Editor) => void;
  id: string;
  name?: string;
};

export type RichTextEditor = NonNullable<ReturnType<typeof useSyncedEditor>>;
