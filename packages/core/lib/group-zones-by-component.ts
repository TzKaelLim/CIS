import { getZoneId } from "./get-zone-id";
import { Data, Content } from "../types";

export const groupZonesByComponent = (data: Data) => {
  const zoneEntries = Object.entries(data.zones ?? {});

  // Null prototype: a component id such as "__proto__" or "constructor" must
  // not find Object.prototype members
  return zoneEntries.reduce<
    Record<string, { zoneCompound: string; content: Content }[]>
  >((acc, [zoneCompound, zoneContent]) => {
    const [componentId, zoneName] = getZoneId(zoneCompound);

    if (!componentId.length || !zoneName.length) return acc;

    if (!acc[componentId]) {
      acc[componentId] = [];
    }

    acc[componentId].push({ zoneCompound, content: zoneContent });

    return acc;
  }, Object.create(null));
};
