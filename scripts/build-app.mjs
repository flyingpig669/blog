import { build } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { resourcePath } = require("./generated-path");
await build({
  configFile: false,
  plugins: [vue()],
  define: {
    "process.env.NODE_ENV": '"production"',
    __VUE_OPTIONS_API__: false,
    __VUE_PROD_DEVTOOLS__: false,
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
  },
  build: {
    outDir: resourcePath("js/vue"),
    emptyOutDir: true,
    lib: {
      entry: path.resolve("src/main.js"),
      formats: ["es"],
      fileName: () => "app.js",
    },
    minify: true,
    sourcemap: false,
  },
});
