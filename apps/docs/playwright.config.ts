import { defineConfig } from '@playwright/test';
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '/icons';
export default defineConfig({
  testDir: './tests',
  testIgnore: '**/dev.spec.ts',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  use: { baseURL: `http://127.0.0.1:3918${basePath}/`, browserName: 'chromium', trace: 'retain-on-failure' },
  webServer: {
    command: 'node scripts/preview.mjs',
    env: { NEXT_PUBLIC_BASE_PATH: basePath, PORT: '3918' },
    url: `http://127.0.0.1:3918${basePath}/`,
    reuseExistingServer: !process.env.CI,
  },
});
