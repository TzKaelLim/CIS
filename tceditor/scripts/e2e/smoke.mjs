// Demo smoke test: drags nested Grids and a Heading into the demo editor
// over and over for 3 minutes per run and fails when a run throws or the
// page's JS heap passes 300 MB. Exits with 1 on any failure.
//
// Needs the demo running on http://localhost:3000 (pnpm dev, or pnpm build,
// then pnpm --filter demo start). Set DEMO_URL to test another address, for
// example a `next start -p 3020` of the built demo at http://127.0.0.1:3020.
import { smoke } from "./smoke-framework.mjs";
import { dragAndDrop } from "./utils/drag-and-drop.mjs";

const BASE = (process.env.DEMO_URL ?? "http://localhost:3000").replace(
  /\/+$/,
  ""
);

const runs = {
  oneLevel: async (page) => {
    await dragAndDrop(
      page,
      '[data-testid="drawer-item:Heading"]',
      '[data-testid="dropzone:root:default-zone"]'
    );
  },
  twoLevels: async (page) => {
    await dragAndDrop(
      page,
      '[data-testid="drawer-item:Grid"]',
      '[data-testid="dropzone:root:default-zone"]',
      "top"
    );

    await dragAndDrop(
      page,
      '[data-testid="drawer-item:Heading"]',
      '[data-testid="dropzone:root:default-zone"] [data-puck-dropzone]'
    );
  },
  threeLevels: async (page) => {
    await dragAndDrop(
      page,
      '[data-testid="drawer-item:Grid"]',
      '[data-testid="dropzone:root:default-zone"]',
      "top"
    );

    await dragAndDrop(
      page,
      '[data-testid="drawer-item:Grid"]',
      '[data-testid="dropzone:root:default-zone"] [data-puck-dropzone]'
    );

    await dragAndDrop(
      page,
      '[data-testid="drawer-item:Heading"]',
      '[data-testid="dropzone:root:default-zone"] [data-puck-dropzone] [data-puck-dropzone]'
    );
  },
  sixLevels: async (page) => {
    await dragAndDrop(
      page,
      '[data-testid="drawer-item:Grid"]',
      '[data-testid="dropzone:root:default-zone"]',
      "top"
    );

    await dragAndDrop(
      page,
      '[data-testid="drawer-item:Grid"]',
      '[data-testid="dropzone:root:default-zone"] [data-puck-dropzone]'
    );

    await dragAndDrop(
      page,
      '[data-testid="drawer-item:Grid"]',
      '[data-testid="dropzone:root:default-zone"] [data-puck-dropzone] [data-puck-dropzone]'
    );

    await dragAndDrop(
      page,
      '[data-testid="drawer-item:Grid"]',
      '[data-testid="dropzone:root:default-zone"] [data-puck-dropzone] [data-puck-dropzone] [data-puck-dropzone]'
    );

    await dragAndDrop(
      page,
      '[data-testid="drawer-item:Grid"]',
      '[data-testid="dropzone:root:default-zone"] [data-puck-dropzone] [data-puck-dropzone] [data-puck-dropzone] [data-puck-dropzone]'
    );

    await dragAndDrop(
      page,
      '[data-testid="drawer-item:Heading"]',
      '[data-testid="dropzone:root:default-zone"] [data-puck-dropzone] [data-puck-dropzone] [data-puck-dropzone] [data-puck-dropzone] [data-puck-dropzone]'
    );
  },
};

const tests = [
  {
    label: "iframe, 2 levels",
    url: `${BASE}/test/edit?disableIframe=false`,
    run: runs.twoLevels,
  },
  {
    label: "iframe, 6 levels",
    url: `${BASE}/test/edit?disableIframe=false`,
    run: runs.sixLevels,
  },
  {
    label: "no iframe, 2 levels",
    url: `${BASE}/test/edit?disableIframe=true`,
    run: runs.twoLevels,
  },
  {
    label: "no iframe, 6 levels",
    url: `${BASE}/test/edit?disableIframe=true`,
    run: runs.sixLevels,
  },
];

(async () => {
  await smoke(tests, {
    chart: true,
    duration: 180,
    threshold: 300,
    puppeteerOptions: { headless: true },
  });
})();
