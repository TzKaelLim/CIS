import { createStaticAssetSource, type Asset } from "./asset-source";

/**
 * The 6 demo pictures (spec §10.4): SVG drawn in this repo, in
 * apps/showcase/public/demo-assets/. Storybook serves the same folder through
 * staticDirs, so `src` is a root-relative path in both.
 */
export const DEMO_ASSETS: readonly Asset[] = Object.freeze([
  {
    id: "demo-1",
    src: "/demo-assets/demo-1.svg",
    width: 1600,
    height: 900,
    label: "山丘與太陽（橫式 16:9）",
  },
  {
    id: "demo-2",
    src: "/demo-assets/demo-2.svg",
    width: 1200,
    height: 900,
    label: "海面與夕陽（橫式 4:3）",
  },
  {
    id: "demo-3",
    src: "/demo-assets/demo-3.svg",
    width: 1200,
    height: 1200,
    label: "同心圓（正方形）",
  },
  {
    id: "demo-4",
    src: "/demo-assets/demo-4.svg",
    width: 900,
    height: 1200,
    label: "樹與小徑（直式 3:4）",
  },
  {
    id: "demo-5",
    src: "/demo-assets/demo-5.svg",
    width: 1600,
    height: 1000,
    label: "幾何拼貼（橫式 16:10）",
  },
  {
    id: "demo-6",
    src: "/demo-assets/demo-6.svg",
    width: 800,
    height: 1200,
    label: "波浪與月亮（直式 2:3）",
  },
]);

export const demoAssetSource = createStaticAssetSource(DEMO_ASSETS);
