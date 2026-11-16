/** @jest-environment node */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createStaticAssetSource, type Asset } from "../asset-source";
import { DEMO_ASSETS, demoAssetSource } from "../demo-assets";

const publicDir = join(
  __dirname,
  "..",
  "..",
  "..",
  "..",
  "apps/showcase/public"
);
const SVG_NAMESPACE = 'xmlns="http://www.w3.org/2000/svg"';

const assetCases = DEMO_ASSETS.map((asset) => [asset.id, asset] as const);

function readSvg(asset: Asset): string {
  return readFileSync(join(publicDir, asset.src), "utf8");
}

describe("demo assets", () => {
  it("lists the 6 pictures of spec §10.4", () => {
    expect(
      DEMO_ASSETS.map((asset) => [asset.id, asset.width, asset.height])
    ).toEqual([
      ["demo-1", 1600, 900],
      ["demo-2", 1200, 900],
      ["demo-3", 1200, 1200],
      ["demo-4", 900, 1200],
      ["demo-5", 1600, 1000],
      ["demo-6", 800, 1200],
    ]);
  });

  it.each(assetCases)(
    "%s: the file exists and its size matches",
    (id, asset) => {
      expect(asset.src).toBe(`/demo-assets/${id}.svg`);
      expect(existsSync(join(publicDir, asset.src))).toBe(true);
      const root = /^<svg\b[^>]*>/.exec(readSvg(asset))?.[0] ?? "";
      expect(root).toContain(`width="${asset.width}"`);
      expect(root).toContain(`height="${asset.height}"`);
      expect(root).toContain(`viewBox="0 0 ${asset.width} ${asset.height}"`);
    }
  );

  it.each(assetCases)(
    "%s: refers to nothing outside the file",
    (_id, asset) => {
      const svg = readSvg(asset);
      expect(svg.split(SVG_NAMESPACE)).toHaveLength(2);
      // The namespace is an identifier, not a request; nothing else may name a URL.
      expect(svg.replace(SVG_NAMESPACE, "")).not.toMatch(
        /http|\/\/|href|url\(|@import|<image|<script|<text|<foreignObject|font/i
      );
      expect(Buffer.byteLength(svg)).toBeLessThan(4096);
    }
  );
});

describe("createStaticAssetSource", () => {
  it("looks ids up without the prototype chain", () => {
    expect(demoAssetSource.get("demo-2")).toEqual(DEMO_ASSETS[1]);
    expect(demoAssetSource.get("demo-9")).toBeUndefined();
    expect(demoAssetSource.get("constructor")).toBeUndefined();
    expect(demoAssetSource.get("__proto__")).toBeUndefined();
  });

  it("lists a copy of every asset, in order", async () => {
    const listed = await demoAssetSource.list();
    expect(listed).toEqual(DEMO_ASSETS);
    listed.pop();
    expect(await demoAssetSource.list()).toHaveLength(6);
  });

  it("rejects duplicate or malformed assets", () => {
    const asset: Asset = {
      id: "a",
      src: "/a.svg",
      width: 1,
      height: 1,
      label: "A",
    };
    expect(() => createStaticAssetSource([asset, asset])).toThrow(TypeError);
    expect(() => createStaticAssetSource([{ ...asset, id: "a b" }])).toThrow(
      TypeError
    );
    expect(() => createStaticAssetSource([{ ...asset, width: 0 }])).toThrow(
      TypeError
    );
    expect(() => createStaticAssetSource([{ ...asset, src: "" }])).toThrow(
      TypeError
    );
    expect(() => createStaticAssetSource([{ ...asset, label: "" }])).toThrow(
      TypeError
    );
  });
});
