import { slotLocations } from "../slots";
import {
  boxSpec,
  kitchenSinkSpec,
  leafSpec,
  pairSpec,
} from "../__fixtures__/test-specs";

describe("slotLocations", () => {
  it("finds a slot inside array items", () => {
    expect(slotLocations(pairSpec)).toEqual([
      {
        path: ["columns", "[]", "content"],
        key: "columns[].content",
        rule: { disallow: ["Pair"] },
      },
    ]);
  });

  it("finds top-level slots", () => {
    expect(slotLocations(kitchenSinkSpec)).toEqual([
      { path: ["content"], key: "content", rule: { allow: ["Leaf"] } },
    ]);
    expect(slotLocations(boxSpec)).toEqual([
      { path: ["content"], key: "content", rule: { allow: ["Box", "Leaf"] } },
    ]);
  });

  it("returns an empty list for a block without slots", () => {
    expect(slotLocations(leafSpec)).toEqual([]);
  });
});
