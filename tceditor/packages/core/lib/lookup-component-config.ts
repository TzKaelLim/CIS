import { Config } from "../types";

/**
 * Looks up the config for a component type.
 *
 * Only own keys of `config.components` count. A plain
 * `config.components[type]` returns inherited members such as
 * `Object.prototype` for "__proto__" or `Object` for "constructor", which
 * then crash rendering. Unknown types return `undefined`, so callers keep
 * their existing "no configuration" behaviour.
 *
 * Uses `hasOwnProperty.call` because `Object.hasOwn` (ES2022) is outside the
 * ES2015 lib plus the ES2020 lib that @types/node adds (error TS2550).
 */
export function lookupComponentConfig(
  config: Config,
  type: string | undefined | null
): Config["components"][string] | undefined {
  const components = config.components;

  if (typeof type !== "string" || !components) {
    return undefined;
  }

  return Object.prototype.hasOwnProperty.call(components, type)
    ? components[type]
    : undefined;
}
