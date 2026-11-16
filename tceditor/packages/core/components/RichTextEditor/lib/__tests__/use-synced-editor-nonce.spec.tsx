import { cleanup, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { Document } from "@tiptap/extension-document";
import { Paragraph } from "@tiptap/extension-paragraph";
import { Text } from "@tiptap/extension-text";
import { appStoreContext, createAppStore } from "../../../../store";
import { useSyncedEditor } from "../use-synced-editor";

const tiptapStyleSelector = "style[data-tiptap-style]";

const renderEditor = async (nonce?: string) => {
  const appStore = createAppStore({ nonce });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <appStoreContext.Provider value={appStore}>
      {children}
    </appStoreContext.Provider>
  );

  const { result } = renderHook(
    () =>
      useSyncedEditor({
        content: "",
        onChange: () => {},
        extensions: [Document, Paragraph, Text],
        name: "text",
      }),
    { wrapper }
  );

  // immediatelyRender is false, so the editor is created in an effect
  await waitFor(() => expect(result.current).not.toBeNull());

  return document.head.querySelector<HTMLStyleElement>(tiptapStyleSelector);
};

describe("useSyncedEditor", () => {
  afterEach(() => {
    cleanup();

    // tiptap reuses an existing style tag, so remove it between tests
    document.head.querySelectorAll(tiptapStyleSelector).forEach((el) => {
      el.remove();
    });
  });

  it("sets the store nonce on the style tiptap injects", async () => {
    const style = await renderEditor("abc");

    expect(style?.getAttribute("nonce")).toBe("abc");
    expect(style?.nonce).toBe("abc");
  });

  it("does not add a nonce to the tiptap style without a store nonce", async () => {
    const style = await renderEditor();

    expect(style).not.toBeNull();
    expect(style?.hasAttribute("nonce")).toBe(false);
  });
});
