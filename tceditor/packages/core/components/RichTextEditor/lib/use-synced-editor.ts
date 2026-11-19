import { getSchema, useEditor } from "@tiptap/react";
import type { Extensions, Editor } from "@tiptap/react";
import type { Schema } from "@tiptap/pm/model";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDebounce } from "use-debounce";
import { UiState } from "../../../types";
import { useAppStoreApi } from "../../../store";
import { normalizeRichText } from "../../../lib/richtext/normalize";
import { stableStringify } from "../../../lib/richtext/stable-stringify";
import type { RichTextDoc, RichTextNode } from "../../../lib/richtext/types";
import {
  defaultTextblock,
  findUnrenderableTypes,
  fitToSchema,
} from "./fit-to-schema";

/**
 * Tiptap needs at least one block to place the cursor in. The block is an
 * empty defaultTextblock, the same text block fitToSchema uses, so a field
 * without paragraphs does not get a paragraph its schema lacks. ProseMirror
 * creates it, so it has exactly the attributes of the schema.
 */
const emptyEditorDoc = (schema: Schema): RichTextDoc => {
  const block = defaultTextblock(schema)?.createAndFill();

  return {
    type: "doc",
    content: block ? [block.toJSON() as RichTextNode] : [],
  };
};

/**
 * The document the editor shows for a stored value. It goes through the same
 * normalization as the renderer, so the editor and the rendered page agree,
 * and legacy HTML strings appear as plain text. It is then fitted to the
 * editor's schema, because Tiptap would show an empty document instead of
 * content with a node or mark type the field turned off.
 */
const toEditorDoc = (content: unknown, schema: Schema): RichTextDoc => {
  const doc = fitToSchema(normalizeRichText(content), schema);

  return doc.content?.length ? doc : emptyEditorDoc(schema);
};

// Types already reported, so each one is reported once
const reportedTypes = new Set<string>();

export function useSyncedEditor({
  content,
  onChange,
  extensions,
  editable = true,
  onFocusChange,
  name,
}: {
  content: RichTextDoc | string;
  onChange: (content: RichTextDoc, uiState?: Partial<UiState>) => void;
  extensions: Extensions;
  editable?: boolean;
  onFocusChange?: (editor: Editor | null) => void;
  name: string | undefined;
}) {
  const [debouncedState, setDebouncedState] = useDebounce<{
    from: number;
    to: number;
    json: RichTextDoc;
  } | null>(null, 50, {
    leading: true,
    maxWait: 200,
  });

  const syncingRef = useRef(false);
  const lastSyncedRef = useRef("");
  const editTimer = useRef<NodeJS.Timeout>(null);
  const isPending = !!editTimer.current;

  // useEditor creates the editor once and keeps its schema even when the
  // extensions change later, so the schema is computed once as well
  const [schema] = useState(() => getSchema(extensions));

  const editorDoc = useMemo(
    () => toEditorDoc(content, schema),
    [content, schema]
  );

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;

    const types = findUnrenderableTypes(schema).filter(
      (type) => !reportedTypes.has(type)
    );

    if (types.length === 0) return;

    types.forEach((type) => reportedTypes.add(type));

    console.warn(
      `tceditor: the richtext types ${types.join(
        ", "
      )} come from tiptap.extensions and are not supported by the shared renderer. Published pages show only their text, and the editor removes them when it loads saved content.`
    );
  }, [schema]);

  const resetTimer = (clearOn: string) => {
    if (editTimer.current) {
      clearTimeout(editTimer.current);
    }

    editTimer.current = setTimeout(() => {
      if (lastSyncedRef.current === clearOn) {
        editTimer.current = null;
      }
    }, 200);
  };

  const appStoreApi = useAppStoreApi();

  const editor = useEditor({
    extensions,
    content: editorDoc,
    editable,
    immediatelyRender: false,
    injectNonce: appStoreApi.getState().nonce,
    parseOptions: { preserveWhitespace: "full" },
    onUpdate: ({ editor }) => {
      const isFocused = appStoreApi.getState().state.ui.field.focus === name;

      // This can trigger during undo/redo history loads
      if (syncingRef.current || !isFocused) {
        return;
      }

      const json = editor.getJSON() as RichTextDoc;
      const serialized = stableStringify(json);

      const { from, to } = editor.state.selection;

      setDebouncedState({ from, to, json });
      resetTimer(serialized);

      lastSyncedRef.current = serialized;
    },
  });

  useEffect(() => {
    if (!editor) return;

    const handleFocus = () => {
      onFocusChange?.(editor);
    };

    editor.on("focus", handleFocus);
    return () => {
      editor.off("focus", handleFocus);
    };
  }, [editor, onFocusChange]);

  // Push debounced changes up to parent
  useEffect(() => {
    if (debouncedState) {
      const { ui } = appStoreApi.getState().state;

      onChange(debouncedState.json, {
        field: {
          ...ui.field,
          metadata: { from: debouncedState.from, to: debouncedState.to },
        },
      });
    }
  }, [editor, debouncedState, onChange, appStoreApi, name]);

  useEffect(() => {
    editor?.setEditable(editable);
  }, [editor, editable]);

  // Bring in external content changes without causing flicker on blur
  useEffect(() => {
    if (!editor) return;

    // If the editor currently has pending changes, don't stomp what the user is typing
    if (isPending) {
      return;
    }

    // Skip when the editor already shows this content: either it produced the
    // stored JSON itself, or it shows the stored value in normalized form.
    // Compared with sorted keys, so key order does not matter.
    const current = stableStringify(editor.getJSON());

    if (
      current === stableStringify(content) ||
      current === stableStringify(editorDoc)
    ) {
      return;
    }

    syncingRef.current = true;

    editor.commands.setContent(editorDoc, { emitUpdate: false });

    const { ui } = appStoreApi.getState().state;

    if (typeof ui.field.metadata?.from !== "undefined") {
      editor.commands.setTextSelection({
        from: ui.field.metadata.from,
        to: ui.field.metadata.to,
      });
    }

    syncingRef.current = false;
  }, [content, editorDoc, editor, appStoreApi]);

  return editor;
}
