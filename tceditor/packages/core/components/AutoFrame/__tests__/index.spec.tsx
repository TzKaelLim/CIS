import { cleanup, render, waitFor } from "@testing-library/react";
import { createRef } from "react";
import AutoFrame from "../index";
import {
  PUCK_STYLE_ID_ATTRIBUTE,
  PUCK_STYLE_IDS,
} from "../../../lib/use-inject-css";

const mirrorSelector = '[data-puck-style-mirror="true"]';
const interactionSelector = `[${PUCK_STYLE_ID_ATTRIBUTE}="${PUCK_STYLE_IDS.iframeInteractions}"]`;

// Under a header-delivered CSP, browsers hide the nonce attribute: it reads as
// an empty string while the nonce property keeps the value. jsdom does not do
// this, so simulate it.
const hideNonce = (el: HTMLElement, nonce: string) => {
  el.setAttribute("nonce", "");
  Object.defineProperty(el, "nonce", { value: nonce });
};

const renderFrame = async (nonce?: string) => {
  const frameRef = createRef<HTMLIFrameElement>();
  const onReady = jest.fn();

  render(
    <AutoFrame
      className="frame"
      frameRef={frameRef}
      nonce={nonce}
      onReady={onReady}
    >
      <div>Frame content</div>
    </AutoFrame>
  );

  const frame = frameRef.current!;
  const frameDoc = frame.contentDocument!;

  // jsdom ignores srcDoc, so create the mount node AutoFrame looks for before
  // the frame's load event fires.
  const root = frameDoc.createElement("div");
  root.id = "frame-root";
  frameDoc.body.append(root);

  await waitFor(() => expect(onReady).toHaveBeenCalled());

  return { frame, frameDoc };
};

describe("AutoFrame", () => {
  let hostStyle: HTMLStyleElement;

  beforeEach(() => {
    hostStyle = document.createElement("style");
    hostStyle.setAttribute("nonce", "abc");
    hostStyle.textContent = ".host { color: red; }";
    document.head.append(hostStyle);
  });

  afterEach(() => {
    cleanup();
    document.head.innerHTML = "";
  });

  it("sets the nonce on the interaction styles and mirrored host styles", async () => {
    const { frameDoc } = await renderFrame("abc");

    const mirror = frameDoc.head.querySelector(mirrorSelector);

    expect(mirror?.textContent).toBe(".host { color: red; }");
    expect(mirror?.getAttribute("nonce")).toBe("abc");
    expect(
      frameDoc.head.querySelector(interactionSelector)?.getAttribute("nonce")
    ).toBe("abc");
  });

  it("sets the nonce on mirrors of host styles whose nonce attribute is hidden", async () => {
    hideNonce(hostStyle, "abc");

    const { frameDoc } = await renderFrame("abc");

    const mirror = frameDoc.head.querySelector(mirrorSelector);

    expect(mirror?.textContent).toBe(".host { color: red; }");
    expect(mirror?.getAttribute("nonce")).toBe("abc");
  });

  it("sets the nonce on host styles added after the frame loads", async () => {
    const { frameDoc } = await renderFrame("abc");

    const lateStyle = document.createElement("style");
    hideNonce(lateStyle, "abc");
    lateStyle.textContent = ".late { color: blue; }";
    document.head.append(lateStyle);

    await waitFor(() =>
      expect(frameDoc.head.querySelectorAll(mirrorSelector)).toHaveLength(2)
    );

    const mirrors = Array.from(frameDoc.head.querySelectorAll(mirrorSelector));

    expect(mirrors.map((el) => el.getAttribute("nonce"))).toEqual([
      "abc",
      "abc",
    ]);
  });

  it("does not add the nonce to host styles that lack it", async () => {
    hostStyle.removeAttribute("nonce");

    const { frameDoc } = await renderFrame("abc");

    const mirror = frameDoc.head.querySelector(mirrorSelector);

    expect(mirror?.textContent).toBe(".host { color: red; }");
    expect(mirror?.hasAttribute("nonce")).toBe(false);
  });

  it("does not add a nonce without the nonce prop", async () => {
    hostStyle.removeAttribute("nonce");

    const { frameDoc } = await renderFrame();

    expect(frameDoc.head.querySelector(mirrorSelector)).not.toBeNull();
    expect(frameDoc.head.querySelector(interactionSelector)).not.toBeNull();
    expect(frameDoc.head.querySelectorAll("[nonce]")).toHaveLength(0);
  });

  it("does not forward the nonce to the iframe element", async () => {
    const { frame } = await renderFrame("abc");

    expect(frame.hasAttribute("nonce")).toBe(false);
  });
});
