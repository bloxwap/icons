import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  testMatch: 'dev.spec.ts',
  timeout: 60_000,
  use: { baseURL: 'http://127.0.0.1:3909/', browserName: 'chromium' },
  webServer: {
    command: 'pnpm dev',
    url: 'http://127.0.0.1:3909/',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
