import { defineConfig } from 'vite';

export default defineConfig({
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
