import { defineConfig } from 'vitest/config';

// Keep extension build plugins out of the Vitest process. In particular, the
// CRX plugin expects a Vite dev-server watch configuration that is not present
// when Vitest is started by the VS Code extension.
export default defineConfig({});
