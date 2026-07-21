import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: { index: "src/core/index.ts" },
    format: ["esm"],
    dts: true,
    splitting: false,
    clean: true,
    target: "es2020",
  },
  {
    entry: { "react/index": "src/react/index.ts" },
    format: ["esm"],
    dts: true,
    splitting: false,
    clean: false,
    external: ["react", "react/jsx-runtime"],
    target: "es2020",
    // Next.js App Router: keep the directive on the published entry.
    banner: { js: '"use client";' },
  },
]);

