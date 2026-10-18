import type { EditorStateSnapshot } from "@tiptap/react";

export const defaultEditorState = (
  ctx: EditorStateSnapshot,
  readOnly: boolean
) => {
  const editor = ctx.editor;
  if (!editor || editor.isDestroyed) return {};

  const canChain = () => editor.can().chain();

  // A command can throw instead of returning false when the schema lacks a
  // type it needs: toggleCodeBlock toggles back to a paragraph, which a field
  // with `paragraph: false` does not have
  const can = (check: () => boolean | undefined) => {
    if (readOnly) return false;

    try {
      return Boolean(check());
    } catch {
      return false;
    }
  };

  return {
    isAlignLeft: editor.isActive({ textAlign: "left" }),
    canAlignLeft: can(() => canChain().setTextAlign?.("left").run()),

    isAlignCenter: editor.isActive({ textAlign: "center" }),
    canAlignCenter: can(() => canChain().setTextAlign?.("center").run()),

    isAlignRight: editor.isActive({ textAlign: "right" }),
    canAlignRight: can(() => canChain().setTextAlign?.("right").run()),

    isAlignJustify: editor.isActive({ textAlign: "justify" }),
    canAlignJustify: can(() => canChain().setTextAlign?.("justify").run()),

    isBold: editor.isActive("bold"),
    canBold: can(() => canChain().toggleBold?.().run()),

    isItalic: editor.isActive("italic"),
    canItalic: can(() => canChain().toggleItalic?.().run()),

    isUnderline: editor.isActive("underline"),
    canUnderline: can(() => canChain().toggleUnderline?.().run()),

    isStrike: editor.isActive("strike"),
    canStrike: can(() => canChain().toggleStrike?.().run()),

    isInlineCode: editor.isActive("code"),
    canInlineCode: can(() => canChain().toggleCode?.().run()),

    isBulletList: editor.isActive("bulletList"),
    canBulletList: can(() => canChain().toggleBulletList?.().run()),

    isOrderedList: editor.isActive("orderedList"),
    canOrderedList: can(() => canChain().toggleOrderedList?.().run()),

    isCodeBlock: editor.isActive("codeBlock"),
    canCodeBlock: can(() => canChain().toggleCodeBlock?.().run()),

    isBlockquote: editor.isActive("blockquote"),
    canBlockquote: can(() => canChain().toggleBlockquote?.().run()),

    canHorizontalRule: can(() => canChain().setHorizontalRule?.().run()),
  };
};
