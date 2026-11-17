import { test, expect } from '@playwright/test';
import usage from '../../../packages/icons/usage.json' with { type: 'json' };

test('dev HTTP and HMR use the Icons server without repeated navigation or fetching', async ({ page }) => {
  let documents = 0;
  let searchFetches = 0;
  const socketOrigins: string[] = [];
  const errors: string[] = [];
  page.on('request', request => {
    if (request.isNavigationRequest() && request.frame() === page.mainFrame()) documents++;
    if (new URL(request.url()).pathname === '/search.json') searchFetches++;
  });
  page.on('websocket', socket => socketOrigins.push(new URL(socket.url()).host));
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('./');
  await expect(page).toHaveTitle(/Bloxwap Icons/);
  await expect(page.locator('.collection-filters')).toHaveCSS('display', 'flex');
  await page.getByRole('button', { name: /^Pro chart \d/ }).click();
  await expect(page.locator('.result-count')).toHaveText(`${usage.icons.filter(icon => icon.collections.includes('pro-chart')).length} icons`);
  await expect(page.locator('.icon-inspector svg')).toHaveAttribute('stroke-width', '1.5');
  await page.getByRole('button', { name: /^Bloxwap \d/ }).click();
  await page.getByRole('searchbox', { name: 'Search icons' }).fill('wallet');
  await expect(page.locator('.icon-tile')).toHaveCount(1);
  // A fresh dev server compiles the search route on its first request.
  const searchResponse = page.waitForResponse(response => new URL(response.url()).pathname === '/search.json', { timeout: 30_000 });
  await page.locator('button[data-search-full]').click();
  await page.getByRole('combobox').fill('Expo');
  expect((await searchResponse).ok()).toBe(true);
  await expect(page.getByRole('option').filter({ hasText: /^Documentation\s*React Native$/ })).toBeVisible();
  await page.keyboard.press('Escape');
  // This observation window is the regression assertion: idle dev must not reload.
  await page.waitForTimeout(10_000);
  expect(documents).toBe(1);
  expect(searchFetches).toBe(1);
  expect(socketOrigins.length).toBeGreaterThan(0);
  expect(socketOrigins.every(host => host === '127.0.0.1:3909')).toBe(true);
  expect(errors).toEqual([]);
});
