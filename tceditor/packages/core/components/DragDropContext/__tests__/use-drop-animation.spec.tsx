import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import type { DropAnimationFunction } from "@dnd-kit/dom";
import { createStore } from "zustand";
import { appStoreContext, createAppStore } from "../../../store";
import type { ZoneStore } from "../../DropZone/context";
import { runDropAnimation } from "../../../lib/dnd/drop-animation";
import { useDropAnimation } from "../use-drop-animation";

jest.mock("../../../lib/dnd/drop-animation", () => ({
  runDropAnimation: jest.fn(),
}));

type DropAnimationContext = Parameters<DropAnimationFunction>[0];

const createZoneStore = () =>
  createStore<ZoneStore>(() => ({
    zoneDepthIndex: {},
    nextZoneDepthIndex: {},
    areaDepthIndex: {},
    nextAreaDepthIndex: {},
    draggedItem: null,
    previewIndex: {
      "root:default-zone": {
        componentType: "componentA",
        index: 0,
        zone: "root:default-zone",
        props: { id: "new-item" },
        type: "insert",
        element: undefined,
      },
    },
    enabledIndex: {},
    hoveringComponent: null,
    registerRootVirtualizer: () => {},
    unregisterRootVirtualizer: () => {},
    scrollToComponent: () => {},
  }));

const runWithNonce = (nonce?: string) => {
  const appStore = createAppStore({ nonce });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <appStoreContext.Provider value={appStore}>
      {children}
    </appStoreContext.Provider>
  );

  const { result } = renderHook(() => useDropAnimation(createZoneStore()), {
    wrapper,
  });

  const context = {} as DropAnimationContext;

  result.current(context);

  return jest.mocked(runDropAnimation).mock.calls[0];
};

describe("useDropAnimation", () => {
  afterEach(() => {
    jest.mocked(runDropAnimation).mockClear();
  });

  it("passes the store nonce to the drop animation", () => {
    const [, target] = runWithNonce("abc");

    expect(target).toMatchObject({
      targetZone: "root:default-zone",
      nonce: "abc",
    });
  });

  it("passes no nonce when the store has none", () => {
    const [, target] = runWithNonce();

    expect(target).toMatchObject({ targetZone: "root:default-zone" });
    expect(target?.nonce).toBeUndefined();
  });
});
