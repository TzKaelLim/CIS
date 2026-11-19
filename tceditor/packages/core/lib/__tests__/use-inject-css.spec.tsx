import { cleanup, renderHook } from "@testing-library/react";
import {
  applyNonce,
  PUCK_STYLE_ID_ATTRIBUTE,
  PUCK_STYLE_IDS,
  PuckStyleId,
  useInjectIframeCss,
  useInjectStyleSheet,
  useInjectUiCss,
} from "../use-inject-css";

const getStyle = (doc: Document, id: PuckStyleId) =>
  doc.head.querySelector<HTMLStyleElement>(
    `style[${PUCK_STYLE_ID_ATTRIBUTE}="${id}"]`
  );

afterEach(() => {
  cleanup();
});

describe("applyNonce", () => {
  it("sets the nonce attribute and property", () => {
    const el = document.createElement("style");

    applyNonce(el, "abc");

    expect(el.getAttribute("nonce")).toBe("abc");
    expect(el.nonce).toBe("abc");
  });

  it("leaves the element unchanged without a nonce", () => {
    const el = document.createElement("style");

    applyNonce(el);
    applyNonce(el, "");

    expect(el.hasAttribute("nonce")).toBe(false);
  });
});

describe("useInjectStyleSheet", () => {
  it("sets the nonce before attaching the style element", () => {
    const doc = document.implementation.createHTMLDocument("target");
    const attached: { nonce: string | null; cssText: string | null }[] = [];
    const append = doc.head.append.bind(doc.head);

    doc.head.append = (...nodes: (Node | string)[]) => {
      nodes.forEach((node) => {
        if (node instanceof HTMLStyleElement) {
          attached.push({
            nonce: node.getAttribute("nonce"),
            cssText: node.textContent,
          });
        }
      });

      append(...nodes);
    };

    renderHook(() =>
      useInjectStyleSheet({
        cssText: ".a { color: red; }",
        document: doc,
        id: PUCK_STYLE_IDS.iframeInteractions,
        nonce: "abc",
      })
    );

    expect(attached).toEqual([{ nonce: "abc", cssText: ".a { color: red; }" }]);
    expect(getStyle(doc, PUCK_STYLE_IDS.iframeInteractions)?.nonce).toBe("abc");
  });

  it("does not add a nonce attribute when no nonce is given", () => {
    const doc = document.implementation.createHTMLDocument("target");

    renderHook(() =>
      useInjectStyleSheet({
        cssText: ".a { color: red; }",
        document: doc,
        id: PUCK_STYLE_IDS.iframeInteractions,
      })
    );

    const style = getStyle(doc, PUCK_STYLE_IDS.iframeInteractions);

    expect(style).not.toBeNull();
    expect(style?.hasAttribute("nonce")).toBe(false);
  });
});

describe("useInjectUiCss", () => {
  it("sets the nonce on the ui style in the host document", () => {
    const { unmount } = renderHook(() => useInjectUiCss("abc"));

    expect(getStyle(document, PUCK_STYLE_IDS.uiDefault)?.nonce).toBe("abc");

    unmount();

    expect(getStyle(document, PUCK_STYLE_IDS.uiDefault)).toBeNull();
  });

  it("does not add a nonce attribute by default", () => {
    renderHook(() => useInjectUiCss());

    const style = getStyle(document, PUCK_STYLE_IDS.uiDefault);

    expect(style).not.toBeNull();
    expect(style?.hasAttribute("nonce")).toBe(false);
  });
});

describe("useInjectIframeCss", () => {
  it("sets the nonce on the interaction style in the target document", () => {
    const doc = document.implementation.createHTMLDocument("iframe");

    renderHook(() => useInjectIframeCss(doc, "abc"));

    expect(getStyle(doc, PUCK_STYLE_IDS.iframeInteractions)?.nonce).toBe("abc");
  });

  it("does not add a nonce attribute by default", () => {
    const doc = document.implementation.createHTMLDocument("iframe");

    renderHook(() => useInjectIframeCss(doc));

    const style = getStyle(doc, PUCK_STYLE_IDS.iframeInteractions);

    expect(style).not.toBeNull();
    expect(style?.hasAttribute("nonce")).toBe(false);
  });
});
