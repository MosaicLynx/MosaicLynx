import { crx } from "@crxjs/vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        approval: "src/approval/index.html",
      },
    },
  },
  plugins: [
    react(),
    crx({
      manifest: {
        manifest_version: 3,
        name: "MosaicLynx",
        version: "0.1.0",
        description: "A signer for Symbol and NEM dApps.",
        action: {},
        side_panel: { default_path: "src/popup/index.html" },
        background: {
          service_worker: "src/background/service-worker.ts",
          type: "module",
        },
        permissions: ["storage", "sidePanel"],
        content_security_policy: {
          extension_pages: "script-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
        },
        host_permissions: ["<all_urls>"],
        content_scripts: [
          {
            matches: ["<all_urls>"],
            js: ["src/content/index.ts"],
            run_at: "document_start",
          },
          {
            matches: ["<all_urls>"],
            js: ["src/inpage/index.ts"],
            run_at: "document_start",
            world: "MAIN",
          },
        ],
      },
    }),
  ],
});
