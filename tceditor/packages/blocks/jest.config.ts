import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest/presets/js-with-ts-esm",
  testEnvironment: "node",
  // Only the spec files in __tests__: jest's default pattern would also run
  // every block's spec.ts as a test file
  testMatch: ["<rootDir>/src/**/__tests__/**/*.spec.ts?(x)"],
  extensionsToTreatAsEsm: [".ts", ".tsx"],
  transform: {
    "^.+\\.[tj]sx?$": ["ts-jest", { useESM: true }],
  },
};

export default config;
