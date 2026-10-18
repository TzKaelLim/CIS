/**
 * Compile-time checks, run by `pnpm typecheck` (Jest does not check types).
 * This file has no runtime code and no entry point imports it.
 */
import type { RichtextField } from "../../types";
import type { RichTextFeatureOptions } from "./features";

type FieldOptions = NonNullable<RichtextField["options"]>;

/** Compiles only when T is assignable to U. */
type Assignable<T extends U, U> = T;

/** The options richTextFeaturesToOptions builds are valid field `options`. */
export type FeatureOptionsAreFieldOptions = Assignable<
  RichTextFeatureOptions,
  FieldOptions
>;

// @ts-expect-error A value that is not a field option fails the check above
export type NotFieldOptions = Assignable<{ bold: "yes" }, FieldOptions>;
