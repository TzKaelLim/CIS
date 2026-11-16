// @dnd-kit/dom reads ResizeObserver when it is imported, so define it first.
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver =
  ResizeObserverMock as unknown as typeof ResizeObserver;

import { cleanup, render } from "@testing-library/react";
import type { ReactNode } from "react";
import { DragDropManager, StyleInjector } from "@dnd-kit/dom";
import { appStoreContext, createAppStore } from "../../../store";
import { DragDropContext } from "../index";

type ManagerPlugins = NonNullable<
  ConstructorParameters<typeof DragDropManager>[0]
>["plugins"];

const mockProviderPlugins: unknown[] = [];

jest.mock("@dnd-kit/react", () => {
  const original = jest.requireActual("@dnd-kit/react");

  return {
    ...original,
    DragDropProvider: ({
      children,
      plugins,
    }: {
      children: ReactNode;
      plugins: unknown;
    }) => {
      mockProviderPlugins.push(plugins);

      return <>{children}</>;
    },
  };
});

const getStyleInjectorOptions = (nonce?: string) => {
  const appStore = createAppStore({ nonce, status: "READY" });

  render(
    <appStoreContext.Provider value={appStore}>
      <DragDropContext>
        <div />
      </DragDropContext>
    </appStoreContext.Provider>
  );

  const plugins = mockProviderPlugins[mockProviderPlugins.length - 1];
  const manager = new DragDropManager({
    plugins: plugins as ManagerPlugins,
  });
  const options = manager.registry.plugins.get(StyleInjector)?.options;

  manager.destroy();

  return options;
};

describe("DragDropContext", () => {
  afterEach(() => {
    cleanup();
    mockProviderPlugins.length = 0;
  });

  it("passes the nonce to dnd-kit's style injector", () => {
    expect(getStyleInjectorOptions("abc")).toEqual({ nonce: "abc" });
  });

  it("leaves dnd-kit's style injector unconfigured without a nonce", () => {
    expect(getStyleInjectorOptions()).toBeUndefined();
  });
});
