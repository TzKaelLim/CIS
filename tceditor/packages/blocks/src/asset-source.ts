import { ASSET_ID_PATTERN } from "@tzuchi/tceditor-spec";

/** One picture the image field can point to (spec §7.3). */
export type Asset = {
  id: string;
  src: string;
  width: number;
  height: number;
  label: string;
};

/**
 * Where pictures come from. S2 uses a fixed list; S3 replaces it with the
 * media library. `get` is synchronous because the public page looks pictures
 * up while rendering.
 */
export type AssetSource = {
  list(): Promise<Asset[]>;
  get(id: string): Asset | undefined;
};

function assertAsset(asset: Asset): void {
  if (!ASSET_ID_PATTERN.test(asset.id)) {
    throw new TypeError(
      `asset id "${asset.id}" must match ${ASSET_ID_PATTERN}`
    );
  }
  for (const key of ["width", "height"] as const) {
    if (!Number.isInteger(asset[key]) || asset[key] <= 0) {
      throw new TypeError(
        `asset "${asset.id}": ${key} must be a positive integer`
      );
    }
  }
  if (asset.src === "" || asset.label === "") {
    throw new TypeError(`asset "${asset.id}": src and label must not be empty`);
  }
}

/** An AssetSource over a fixed list. Looks ids up in a null-prototype table. */
export function createStaticAssetSource(assets: readonly Asset[]): AssetSource {
  const byId: Record<string, Asset> = Object.create(null);
  const ordered: Asset[] = [];
  for (const asset of assets) {
    assertAsset(asset);
    if (asset.id in byId) {
      throw new TypeError(`duplicate asset id "${asset.id}"`);
    }
    const copy = Object.freeze({ ...asset });
    byId[copy.id] = copy;
    ordered.push(copy);
  }
  return {
    list: () => Promise.resolve(ordered.slice()),
    get: (id) => (typeof id === "string" && id in byId ? byId[id] : undefined),
  };
}
