/**
 * 型別測試，只由 `pnpm --filter @tzuchi/tceditor-spec typecheck` 檢查，不會執行。
 * 規格 §5.2：toPuckFields 的結果可以 satisfies Fields<Props>；欄位名稱拼錯，
 * 或少了必填欄位時（與規格的差異 #4），編譯失敗。
 */
import type { Field, Fields } from "@tzuchi/tceditor";
import type { BlockProps } from "../define";
import { kitchenSinkSpec } from "../__fixtures__/test-specs";
import { toPuckFields } from "../convert/puck-fields";

declare const imageField: Field;
const image = () => imageField;

type KitchenSinkProps = BlockProps<typeof kitchenSinkSpec>;

export const kitchenSinkFields = toPuckFields(kitchenSinkSpec, {
  image,
}) satisfies Fields<KitchenSinkProps>;

export const withPicker = {
  ...toPuckFields(kitchenSinkSpec, { image }),
  picture: imageField,
} satisfies Fields<KitchenSinkProps>;

export const misspelled = {
  ...toPuckFields(kitchenSinkSpec, { image }),
  // @ts-expect-error -- KitchenSink 沒有 hreff 這個欄位
  hreff: { type: "text" },
} satisfies Fields<KitchenSinkProps>;

const { href: _href, ...withoutHref } = toPuckFields(kitchenSinkSpec, {
  image,
});
// @ts-expect-error -- href 是必填欄位，少了它的欄位表不能 satisfies
export const missingHref = withoutHref satisfies Fields<KitchenSinkProps>;
