import { defineConfig } from 'vitest/config';
export default defineConfig({
 server: { host: 'localhost', port: 8643, strictPort: true },
 preview: { host: 'localhost', port: 8643, strictPort: true },
 test: { include: ['src/**/*.test.ts'], environment: 'node' }
});
