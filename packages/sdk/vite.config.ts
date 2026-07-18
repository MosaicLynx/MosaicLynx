import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    alias: {
      // Unit tests run before workspace packages are built, so resolve the
      // contract package to its TypeScript source instead of its dist export.
      '@mosaiclynx/provider-api': new URL('../provider-api/src/index.ts', import.meta.url).pathname,
    },
  },
  build: {
    emptyOutDir: false,
    sourcemap: true,
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: () => 'index.js',
    },
    rollupOptions: {
      // The browser artifact pins and bundles the Provider contract and symbol-sdk.
      external: [],
    },
  },
});
