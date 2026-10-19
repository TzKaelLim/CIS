"use client";

import type { CustomField, CustomFieldRender } from "@tzuchi/tceditor";
import { IMAGE_ALT_MAX_LENGTH } from "@tzuchi/tceditor-spec";
import type { FieldFactories, ImageValue } from "@tzuchi/tceditor-spec";
import { useEffect, useId, useState } from "react";
import type { Asset, AssetSource } from "../asset-source";

type AssetList =
  | { status: "loading" }
  | { status: "ready"; assets: readonly Asset[] }
  | { status: "error" };

/** Whatever the data holds, the picker edits a complete ImageValue. */
function toImageValue(value: unknown): ImageValue {
  const record: Partial<Record<keyof ImageValue, unknown>> =
    typeof value === "object" && value !== null ? value : {};
  return {
    assetId: typeof record.assetId === "string" ? record.assetId : "",
    alt: typeof record.alt === "string" ? record.alt : "",
    decorative: record.decorative === true,
  };
}

function ImagePicker({
  id,
  label,
  assets,
  value,
  onChange,
  readOnly,
}: {
  id: string;
  label: string;
  assets: AssetSource;
  value: unknown;
  onChange: (value: ImageValue) => void;
  readOnly: boolean;
}) {
  const [list, setList] = useState<AssetList>({ status: "loading" });
  const group = useId();

  useEffect(() => {
    let active = true;
    setList({ status: "loading" });
    assets.list().then(
      (items) => {
        if (active) setList({ status: "ready", assets: items });
      },
      () => {
        if (active) setList({ status: "error" });
      }
    );
    return () => {
      active = false;
    };
  }, [assets]);

  const current = toImageValue(value);
  const update = (patch: Partial<ImageValue>) => {
    if (!readOnly) onChange({ ...current, ...patch });
  };
  const altId = `${id}-alt`;
  const hintId = `${id}-alt-hint`;
  const gone =
    list.status === "ready" &&
    current.assetId !== "" &&
    !list.assets.some((asset) => asset.id === current.assetId);

  return (
    <fieldset className="tcb-picker" disabled={readOnly}>
      <legend className="tcb-picker-legend">{label}</legend>
      <div className="tcb-picker-body">
        {list.status === "loading" ? (
          <p className="tcb-picker-status" role="status">
            正在載入圖片…
          </p>
        ) : null}
        {list.status === "error" ? (
          <p className="tcb-picker-alert" role="alert">
            無法載入圖片清單，請重新整理頁面。
          </p>
        ) : null}
        {list.status === "ready" && list.assets.length === 0 ? (
          <p className="tcb-picker-status">目前沒有可選的圖片。</p>
        ) : null}
        {list.status === "ready" && list.assets.length > 0 ? (
          // One picture at most: native radio buttons with one name, so the
          // arrow keys move the choice and the group is a single Tab stop
          <div
            className="tcb-picker-grid"
            role="radiogroup"
            aria-label="可選的圖片"
          >
            {list.assets.map((asset) => (
              <label key={asset.id} className="tcb-picker-option">
                <input
                  className="tcb-picker-radio"
                  type="radio"
                  name={group}
                  value={asset.id}
                  checked={asset.id === current.assetId}
                  onChange={() => update({ assetId: asset.id })}
                />
                {/* eslint-disable-next-line @next/next/no-img-element -- a thumbnail in the editor panel, not page content */}
                <img
                  className="tcb-picker-thumb"
                  src={asset.src}
                  width={asset.width}
                  height={asset.height}
                  alt=""
                  loading="lazy"
                />
                <span className="tcb-picker-name">{asset.label}</span>
              </label>
            ))}
          </div>
        ) : null}
        {gone ? (
          <p className="tcb-picker-alert" role="alert">
            目前選的圖片已不存在，請重新選擇。
          </p>
        ) : null}
        <label className="tcb-picker-label" htmlFor={altId}>
          替代文字
        </label>
        <input
          id={altId}
          className="tcb-picker-input"
          type="text"
          maxLength={IMAGE_ALT_MAX_LENGTH}
          value={current.alt}
          disabled={current.decorative}
          aria-describedby={hintId}
          onChange={(event) => update({ alt: event.currentTarget.value })}
        />
        <p id={hintId} className="tcb-picker-hint">
          {`說明圖片的內容，給看不到圖片的讀者使用，最多 ${IMAGE_ALT_MAX_LENGTH} 字。`}
        </p>
        <label className="tcb-picker-check">
          <input
            type="checkbox"
            checked={current.decorative}
            onChange={(event) =>
              update({ decorative: event.currentTarget.checked })
            }
          />
          純裝飾（不需要替代文字）
        </label>
      </div>
    </fieldset>
  );
}

/**
 * The image field's editor widget (spec §7.3): pick a picture from `assets`,
 * edit its alt text, or mark it decorative. Every change emits the whole
 * ImageValue. Puck memoises a custom field by [type, key, render] (gaps #35),
 * so each call returns a field whose `render` never changes.
 */
export function createImagePickerField(
  assets: AssetSource
): NonNullable<FieldFactories["image"]> {
  return ({ label }) => {
    const render: CustomFieldRender<ImageValue> = ({
      id,
      value,
      onChange,
      readOnly,
    }) => (
      <ImagePicker
        id={id}
        label={label}
        assets={assets}
        value={value}
        onChange={onChange}
        readOnly={readOnly === true}
      />
    );
    const field: CustomField<ImageValue> = { type: "custom", label, render };
    return field;
  };
}
