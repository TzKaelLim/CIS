import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { Config, Data } from "../../../types";
import "@testing-library/jest-dom";

jest.mock("../styles.module.css");

jest.mock("@dnd-kit/react", () => {
  const original = jest.requireActual("@dnd-kit/react");
  return {
    ...original,
    DragDropProvider: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ),
    useDroppable: () => ({
      ref: () => undefined,
      setNodeRef: () => undefined,
      isOver: false,
    }),
    useDraggable: () => ({
      attributes: {},
      listeners: {},
      setNodeRef: () => undefined,
      isDragging: false,
    }),
  };
});

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }),
});

class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(global as any).ResizeObserver = ResizeObserver;

const originalConsoleError = console.error;
jest.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
  if (
    args.some((arg) => String(arg).includes("Could not parse CSS stylesheet"))
  ) {
    return;
  }
  originalConsoleError(...(args as Parameters<typeof console.error>));
});

jest.spyOn(console, "warn").mockImplementation(() => {});

import type { Editor as TiptapEditor } from "@tiptap/core";
import { Puck } from "../index";
import { AppStoreApi } from "../../../store";

type PuckInternal = {
  appStore: AppStoreApi;
};

const getInternal = () => {
  return (window as any).__PUCK_INTERNAL_DO_NOT_USE as PuckInternal;
};

const flush = () => act(async () => {});

const dispatchReplace = (
  appStore: AppStoreApi,
  componentId: string,
  data: any
) => {
  const node = appStore.getState().state.indexes.nodes[componentId];
  const zoneCompound = `${node.parentId}:${node.zone}`;
  const index = appStore
    .getState()
    .state.indexes.zones[zoneCompound].contentIds.indexOf(componentId);

  appStore.getState().dispatch({
    type: "replace",
    data,
    destinationIndex: index,
    destinationZone: zoneCompound,
  });
};

const richText = (text: string) => ({
  type: "doc",
  content: [
    {
      type: "paragraph",
      attrs: { textAlign: null },
      content: [{ type: "text", text }],
    },
  ],
});

describe("Puck - richtext programmatic updates", () => {
  afterEach(() => {
    cleanup();
  });

  it("updates the preview when a richtext field is changed via dispatch", async () => {
    const config: Config = {
      components: {
        RichTextBlock: {
          fields: {
            body: { type: "richtext", contentEditable: false },
          },
          render: ({ body }) => <div data-testid="richtext-output">{body}</div>,
        },
      },
    };

    const data: Data = {
      root: { props: {} },
      content: [
        {
          type: "RichTextBlock",
          props: { id: "block-1", body: richText("Hello world") },
        },
      ],
    };

    render(<Puck config={config} data={data} iframe={{ enabled: false }} />);
    await flush();

    await waitFor(() => {
      expect(screen.getByText("Hello world")).toBeInTheDocument();
    });

    const { appStore } = getInternal();

    act(() => {
      dispatchReplace(appStore, "block-1", {
        type: "RichTextBlock",
        props: { id: "block-1", body: richText("Updated content") },
      });
    });
    await flush();

    await waitFor(() => {
      expect(screen.getByText("Updated content")).toBeInTheDocument();
    });
    expect(screen.queryByText("Hello world")).not.toBeInTheDocument();
  });

  it("updates the preview when a contentEditable richtext field is changed via dispatch", async () => {
    const config: Config = {
      components: {
        RichTextBlock: {
          fields: {
            body: { type: "richtext" },
          },
          render: ({ body }) => <div data-testid="richtext-output">{body}</div>,
        },
      },
    };

    const data: Data = {
      root: { props: {} },
      content: [
        {
          type: "RichTextBlock",
          props: { id: "block-1", body: richText("Hello world") },
        },
      ],
    };

    render(<Puck config={config} data={data} iframe={{ enabled: false }} />);
    await flush();

    await waitFor(() => {
      expect(screen.getByText("Hello world")).toBeInTheDocument();
    });

    const { appStore } = getInternal();

    act(() => {
      dispatchReplace(appStore, "block-1", {
        type: "RichTextBlock",
        props: { id: "block-1", body: richText("Updated content") },
      });
    });
    await flush();

    await waitFor(() => {
      expect(screen.getByText("Updated content")).toBeInTheDocument();
    });
    expect(screen.queryByText("Hello world")).not.toBeInTheDocument();
  });

  it("updates richtext when value transitions from empty string to content", async () => {
    const config: Config = {
      components: {
        Block: {
          fields: {
            body: { type: "richtext", contentEditable: false },
          },
          render: ({ body }) => <div data-testid="output">{body}</div>,
        },
      },
    };

    const data: Data = {
      root: { props: {} },
      content: [
        {
          type: "Block",
          props: { id: "block-1", body: "" },
        },
      ],
    };

    render(<Puck config={config} data={data} iframe={{ enabled: false }} />);
    await flush();

    const { appStore } = getInternal();

    act(() => {
      dispatchReplace(appStore, "block-1", {
        type: "Block",
        props: { id: "block-1", body: richText("No longer empty") },
      });
    });
    await flush();

    await waitFor(() => {
      expect(screen.getByText("No longer empty")).toBeInTheDocument();
    });
  });

  it("updates richtext when value is set to a plain string", async () => {
    const config: Config = {
      components: {
        Block: {
          fields: {
            body: { type: "richtext", contentEditable: false },
          },
          render: ({ body }) => <div data-testid="output">{body}</div>,
        },
      },
    };

    const data: Data = {
      root: { props: {} },
      content: [
        {
          type: "Block",
          props: { id: "block-1", body: richText("JSON content") },
        },
      ],
    };

    render(<Puck config={config} data={data} iframe={{ enabled: false }} />);
    await flush();

    await waitFor(() => {
      expect(screen.getByText("JSON content")).toBeInTheDocument();
    });

    const { appStore } = getInternal();

    act(() => {
      dispatchReplace(appStore, "block-1", {
        type: "Block",
        props: { id: "block-1", body: "Plain text value" },
      });
    });
    await flush();

    await waitFor(() => {
      expect(screen.getByText("Plain text value")).toBeInTheDocument();
    });
  });

  it("shows a legacy HTML string as plain text instead of parsing it", async () => {
    const payload = '<p>Hello</p><img src=x onerror="alert(1)">';
    const config: Config = {
      components: {
        Block: {
          fields: {
            body: { type: "richtext", contentEditable: false },
          },
          render: ({ body }) => <div data-testid="output">{body}</div>,
        },
      },
    };

    const data: Data = {
      root: { props: {} },
      content: [{ type: "Block", props: { id: "block-1", body: payload } }],
    };

    render(<Puck config={config} data={data} iframe={{ enabled: false }} />);
    await flush();

    const output = await screen.findByTestId("output");

    expect(output.querySelector("img")).toBeNull();
    expect(output.textContent).toBe(payload);
  });
});

describe("Puck - inline richtext editor", () => {
  afterEach(() => {
    cleanup();
  });

  const config: Config = {
    components: {
      Block: {
        fields: {
          body: { type: "richtext", contentEditable: true },
        },
        render: ({ body }) => <div data-testid="output">{body}</div>,
      },
    },
  };

  const renderPuck = async (body: unknown) => {
    const data: Data = {
      root: { props: {} },
      content: [{ type: "Block", props: { id: "block-1", body } }],
    };

    render(<Puck config={config} data={data} iframe={{ enabled: false }} />);
    await flush();

    const output = await screen.findByTestId("output");

    await waitFor(() => {
      expect(output.querySelector(".ProseMirror")).not.toBeNull();
    });

    return output.querySelector(".ProseMirror") as HTMLElement & {
      editor: TiptapEditor;
    };
  };

  it("loads JSON into the editor and follows programmatic updates", async () => {
    const editorDom = await renderPuck(richText("Hello world"));

    expect(editorDom.textContent).toBe("Hello world");

    act(() => {
      dispatchReplace(getInternal().appStore, "block-1", {
        type: "Block",
        props: { id: "block-1", body: richText("Updated content") },
      });
    });
    await flush();

    await waitFor(() => {
      expect(editorDom.textContent).toBe("Updated content");
    });
  });

  it("stores edits as JSON", async () => {
    const editorDom = await renderPuck(richText("Hello"));
    const { appStore } = getInternal();

    act(() => {
      // The editor only reports changes while its field has focus
      appStore.getState().setUi({
        field: { ...appStore.getState().state.ui.field, focus: "body::inline" },
      });
    });

    act(() => {
      editorDom.editor.commands.insertContentAt(
        editorDom.editor.state.doc.content.size - 1,
        " world"
      );
    });

    await waitFor(() => {
      expect(
        appStore.getState().state.indexes.nodes["block-1"].data.props.body
      ).toEqual(richText("Hello world"));
    });
  });

  it("shows a legacy HTML string as plain text", async () => {
    const payload = '<p>Hello</p><img src=x onerror="alert(1)">';
    const editorDom = await renderPuck(payload);

    expect(editorDom.querySelector("img")).toBeNull();
    expect(editorDom.textContent).toBe(payload);
  });
});
