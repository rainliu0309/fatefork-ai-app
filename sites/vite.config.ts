import { cloudflare } from "@cloudflare/vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import path from "node:path";

process.env.WRANGLER_WRITE_LOGS ??= "false";
process.env.WRANGLER_LOG_PATH ??= path.resolve(
  __dirname,
  "../.wrangler/sites-build.log",
);
process.env.MINIFLARE_REGISTRY_PATH ??= path.resolve(
  __dirname,
  "../.wrangler/registry",
);

/**
 * A separate Cloudflare-compatible build powers the optional Sites preview.
 * The primary production target remains the Express service described in
 * render.yaml; keeping the configs separate avoids weakening that boundary.
 */
export default defineConfig({
  root: path.resolve(__dirname, "../client"),
  publicDir: path.resolve(__dirname, "../client/public"),
  plugins: [
    react(),
    cloudflare({
      configPath: path.resolve(__dirname, "wrangler.jsonc"),
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "../client/src"),
    },
  },
  build: {
    outDir: path.resolve(__dirname, "../dist"),
    emptyOutDir: true,
    sourcemap: true,
  },
});
