import { act, cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Config, Data } from "../../../types";

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

// jsdom has no layout, so selecting a component logs a NaN overlay position
const originalConsoleError = console.error;
jest.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
  if (args.some((arg) => String(arg).includes("is an invalid value for the"))) {
    return;
  }

  originalConsoleError(...(args as Parameters<typeof console.error>));
});

class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(global as any).ResizeObserver = ResizeObserver;

import { Puck } from "../index";
import { AppStoreApi } from "../../../store";

const getAppStore = () =>
  (window as any).__PUCK_INTERNAL_DO_NOT_USE.appStore as AppStoreApi;

const flush = () => act(async () => {});

const config: Config = {
  components: {
    Card: {
      fields: { title: { type: "text" } },
      render: ({ title }) => <p>{title}</p>,
    },
    Section: {
      fields: { items: { type: "slot" } },
      render: ({ items: Items }) => <Items />,
    },
  },
};

const data: Data = {
  root: { props: {} },
  content: [
    { type: "Card", props: { id: "__proto__", title: "Proto card" } },
    {
      type: "Section",
      props: {
        id: "constructor",
        items: [
          { type: "Card", props: { id: "toString", title: "Slot card" } },
        ],
      },
    },
  ],
};

describe("Puck with ids and types named after Object.prototype members", () => {
  afterEach(() => {
    cleanup();
  });

  it("loads, indexes and selects those components", async () => {
    render(<Puck config={config} data={data} iframe={{ enabled: false }} />);

    await flush();

    expect(screen.getByText("Proto card")).toBeInTheDocument();
    expect(screen.getByText("Slot card")).toBeInTheDocument();

    const appStore = getAppStore();
    const { nodes } = appStore.getState().state.indexes;

    for (const id of ["__proto__", "constructor", "toString"]) {
      expect(Object.prototype.hasOwnProperty.call(nodes, id)).toBe(true);
      expect(nodes[id].data.props.id).toBe(id);
    }

    act(() => {
      appStore.getState().dispatch({
        type: "setUi",
        ui: { itemSelector: { index: 0, zone: "root:default-zone" } },
      });
    });

    expect(appStore.getState().selectedItem?.props.id).toBe("__proto__");

    act(() => {
      appStore.getState().dispatch({
        type: "setUi",
        ui: { itemSelector: { index: 0, zone: "constructor:items" } },
      });
    });

    expect(appStore.getState().selectedItem?.props.id).toBe("toString");

    await flush();

    expect(({} as Record<string, unknown>).data).toBeUndefined();
    expect(({} as Record<string, unknown>).flatData).toBeUndefined();
  });

  it("shows the no-configuration placeholder for those component types", async () => {
    const dataWithTypes: Data = {
      root: { props: {} },
      content: ["constructor", "__proto__", "toString"].map((type, i) => ({
        type,
        props: { id: `item-${i}` },
      })),
    };

    render(
      <Puck config={config} data={dataWithTypes} iframe={{ enabled: false }} />
    );

    await flush();

    expect(
      screen.getByText("No configuration for constructor")
    ).toBeInTheDocument();
    expect(
      screen.getByText("No configuration for __proto__")
    ).toBeInTheDocument();
    expect(
      screen.getByText("No configuration for toString")
    ).toBeInTheDocument();

    const appStore = getAppStore();

    expect(appStore.getState().getComponentConfig("Card")).toBe(
      config.components.Card
    );

    for (const type of ["constructor", "__proto__", "toString"]) {
      expect(appStore.getState().getComponentConfig(type)).toBeUndefined();
    }

    act(() => {
      appStore.getState().dispatch({
        type: "setUi",
        ui: { itemSelector: { index: 0, zone: "root:default-zone" } },
      });
    });

    await flush();

    expect(appStore.getState().selectedItem?.type).toBe("constructor");
    expect(appStore.getState().getComponentConfig()).toBeUndefined();
  });
});
