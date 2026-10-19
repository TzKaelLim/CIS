import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest/presets/js-with-ts-esm",
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts", ".tsx"],
  transform: {
    "^.+\\.[tj]sx?$": ["ts-jest", { useESM: true }],
  },
  // .next holds Next's build output: keep it out of jest's module map and tests.
  modulePathIgnorePatterns: ["<rootDir>/.next/"],
  testPathIgnorePatterns: ["/node_modules/", "<rootDir>/.next/"],
};

export default config;
