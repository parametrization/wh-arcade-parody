import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
 testDir: './tests/e2e', timeout: 30000, fullyParallel: false,
 use: { baseURL: 'http://localhost:8643', channel: 'chrome', trace: 'retain-on-failure' },
 webServer: { command: 'npm run dev', url: 'http://localhost:8643', reuseExistingServer: !process.env.CI, timeout: 30000 },
 projects: [{name:'desktop',use:{...devices['Desktop Chrome'],channel:'chrome'}}, {name:'mobile',use:{...devices['Pixel 7'],defaultBrowserType:'chromium',channel:'chrome'}}]
});
