import {
  ComponentData,
  Config,
  Content,
  RootData,
  UserGenerics,
} from "../../types";
import { mapFields } from "./map-fields";

type WalkTreeOptions = {
  parentId: string;
  propName: string;
};

export function walkTree<
  T extends ComponentData | RootData | G["UserData"],
  UserConfig extends Config = Config,
  G extends UserGenerics<UserConfig> = UserGenerics<UserConfig>
>(
  data: T,
  config: UserConfig,
  callbackFn: (data: Content, options: WalkTreeOptions) => Content | null | void
): T {
  const walkItem = <
    ItemType extends
      | G["UserComponentData"]
      | G["UserData"]["root"]
      | G["UserData"]
  >(
    item: ItemType
  ): ItemType => {
    return mapFields(
      item as ComponentData,
      {
        slot: ({ value, parentId, propName }) => {
          const content = value as Content;

          return callbackFn(content, { parentId, propName }) ?? content;
        },
      },
      config,
      true
    ) as ItemType;
  };

  if ("props" in data) {
    return walkItem(data as any) as T;
  }

  const _data = data as G["UserData"];
  const zones = _data.zones ?? {};

  const mappedContent = _data.content.map(walkItem) as ComponentData[];

  return {
    root: walkItem(_data.root),
    content:
      callbackFn(mappedContent, {
        parentId: "root",
        propName: "default-zone",
      }) ?? mappedContent,
    // One pass, and "__proto__" stays an own key (see flatten in map-fields.ts)
    zones: Object.fromEntries(
      Object.keys(zones).map((zoneCompound) => [
        zoneCompound,
        zones[zoneCompound].map(walkItem),
      ])
    ),
  } as T;
}
