import { defineConfig } from "tsup";

// Builds the React-free @tzuchi/tceditor/rules entry (bundle/rules.ts). It
// cannot use packages/tsup-config: that config's `inject` adds
// `import React from "react"` to every output file. Running tsup a second
// time also keeps rules.mjs from sharing chunks with the other entries.
export default defineConfig({
  entry: { rules: "bundle/rules.ts" },
  dts: true,
  format: ["cjs", "esm"],
  external: ["react", "react-dom"],
});
