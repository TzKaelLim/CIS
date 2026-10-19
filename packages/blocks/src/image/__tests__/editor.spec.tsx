/** @jest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react";
import type { ImageValue } from "@tzuchi/tceditor-spec";
import { createStaticAssetSource, type AssetSource } from "../../asset-source";
import { createImagePickerField } from "../editor";

const assets = createStaticAssetSource([
  { id: "beach", src: "/beach.svg", width: 1600, height: 900, label: "海灘" },
  { id: "team", src: "/team.svg", width: 1200, height: 1200, label: "志工" },
]);

function renderPicker(
  value: ImageValue,
  options: { readOnly?: boolean; source?: AssetSource } = {}
) {
  const field = createImagePickerField(options.source ?? assets)({
    name: "image",
    label: "圖片",
  });
  if (field.type !== "custom") throw new Error("expected a custom field");
  const onChange = jest.fn();
  const Field = field.render;
  render(
    <Field
      field={field}
      name="image"
      id="image"
      value={value}
      onChange={onChange}
      readOnly={options.readOnly}
    />
  );
  return { field, onChange };
}

/** Waits until list() has resolved, so no state update lands after the test. */
async function listed() {
  return screen.findByRole("list", { name: "可選的圖片" });
}

describe("createImagePickerField", () => {
  it("returns a custom field labelled with the spec title", () => {
    const { field } = renderPicker({ assetId: "", alt: "", decorative: false });
    expect(field.type).toBe("custom");
    expect(field.label).toBe("圖片");
    expect(screen.getByRole("group", { name: "圖片" })).toBeTruthy();
    return listed();
  });

  it("shows a loading state, then the assets as toggle buttons", async () => {
    renderPicker({ assetId: "team", alt: "志工合照", decorative: false });
    expect(screen.getByRole("status").textContent).toBe("正在載入圖片…");
    await listed();
    expect(screen.queryByRole("status")).toBeNull();
    const beach = screen.getByRole("button", { name: "海灘" });
    const team = screen.getByRole("button", { name: "志工" });
    expect(beach.getAttribute("aria-pressed")).toBe("false");
    expect(team.getAttribute("aria-pressed")).toBe("true");
  });

  it("emits the whole value when a picture is selected", async () => {
    const { onChange } = renderPicker({
      assetId: "",
      alt: "海邊",
      decorative: false,
    });
    await listed();
    fireEvent.click(screen.getByRole("button", { name: "志工" }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({
      assetId: "team",
      alt: "海邊",
      decorative: false,
    });
  });

  it("edits the alt text, up to 200 characters", async () => {
    const { onChange } = renderPicker({
      assetId: "beach",
      alt: "",
      decorative: false,
    });
    await listed();
    const input = screen.getByLabelText("替代文字") as HTMLInputElement;
    expect(input.maxLength).toBe(200);
    fireEvent.change(input, { target: { value: "志工在海灘撿垃圾" } });
    expect(onChange).toHaveBeenLastCalledWith({
      assetId: "beach",
      alt: "志工在海灘撿垃圾",
      decorative: false,
    });
  });

  it("marks the picture decorative", async () => {
    const { onChange } = renderPicker({
      assetId: "beach",
      alt: "海灘",
      decorative: false,
    });
    await listed();
    const checkbox = screen.getByRole("checkbox", {
      name: "純裝飾（不需要替代文字）",
    }) as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
    fireEvent.click(checkbox);
    expect(onChange).toHaveBeenLastCalledWith({
      assetId: "beach",
      alt: "海灘",
      decorative: true,
    });
  });

  it("disables the alt text while decorative, and unchecks it", async () => {
    const { onChange } = renderPicker({
      assetId: "beach",
      alt: "海灘",
      decorative: true,
    });
    await listed();
    const checkbox = screen.getByRole("checkbox", {
      name: "純裝飾（不需要替代文字）",
    }) as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
    expect(
      (screen.getByLabelText("替代文字") as HTMLInputElement).disabled
    ).toBe(true);
    fireEvent.click(checkbox);
    expect(onChange).toHaveBeenLastCalledWith({
      assetId: "beach",
      alt: "海灘",
      decorative: false,
    });
  });

  it("changes nothing when read-only", async () => {
    const { onChange } = renderPicker(
      { assetId: "beach", alt: "海灘", decorative: false },
      { readOnly: true }
    );
    await listed();
    const group = screen.getByRole("group", {
      name: "圖片",
    }) as HTMLFieldSetElement;
    expect(group.disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "志工" }));
    fireEvent.change(screen.getByLabelText("替代文字"), {
      target: { value: "改不了" },
    });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("says so when the selected picture no longer exists", async () => {
    renderPicker({ assetId: "removed", alt: "舊圖", decorative: false });
    await listed();
    expect(screen.getByRole("alert").textContent).toBe(
      "目前選的圖片已不存在，請重新選擇。"
    );
  });

  it("says so when the list cannot be loaded", async () => {
    const failing: AssetSource = {
      list: () => Promise.reject(new Error("offline")),
      get: () => undefined,
    };
    renderPicker(
      { assetId: "", alt: "", decorative: false },
      { source: failing }
    );
    expect((await screen.findByRole("alert")).textContent).toBe(
      "無法載入圖片清單，請重新整理頁面。"
    );
  });
});
