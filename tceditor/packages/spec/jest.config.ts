import type { Config } from "jest";

// Same setup as packages/core. Jest runs without --experimental-vm-modules, so
// ts-jest emits CommonJS and packages load through their "require" condition
// (zod's index.cjs, @tzuchi/tceditor/rules' dist/rules.js).
const config: Config = {
  preset: "ts-jest/presets/js-with-ts-esm",
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts", ".tsx"],
  transform: {
    "^.+\\.[tj]sx?$": ["ts-jest", { useESM: true }],
  },
};

export default config;
