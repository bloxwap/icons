import { test, expect } from '@playwright/test';
import usage from '../../../packages/icons/usage.json' with { type: 'json' };

test('browse, customize, copy, and download the catalog', async ({ page, context }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('./');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('One library.Every interface.');
  await expect(page.locator('.icon-tile')).toHaveCount(60);
  while (await page.getByRole('button', { name: /^Show more icons/ }).count()) {
    await page.getByRole('button', { name: /^Show more icons/ }).click();
  }
  await expect(page.locator('.icon-tile')).toHaveCount(usage.icons.length);
  await expect(page.getByRole('button', { name: 'Select ScanLine', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Finance', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Select Wallet', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Select Archive', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'All icons', exact: true }).click();
  const search = page.getByRole('searchbox', { name: 'Search icons' });
  await search.fill('wallet');
  await expect(page.locator('.icon-tile')).toHaveCount(1);
  await page.getByRole('button', { name: 'Select Wallet', exact: true }).click();
  await page.getByRole('slider', { name: 'Icon size' }).fill('32');
  await page.getByRole('slider', { name: 'Stroke width' }).fill('1.5');
  await page.getByRole('button', { name: 'Green icons' }).click();
  await expect(page.locator('.icon-tile svg')).toHaveAttribute('width', '32');
  await expect(page.locator('.icon-code')).toContainText('size={32}');
  await expect(page.locator('.icon-code')).toContainText('strokeWidth={1.5}');
  await page.getByRole('button', { name: 'React Native', exact: true }).click();
  await expect(page.locator('.icon-code')).toContainText('@bloxwap/icons/native/wallet');
  await page.locator('.icon-inspector').getByRole('button', { name: 'Copy code', exact: true }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('@bloxwap/icons/native/wallet');
  await expect(page.locator('.icon-inspector .copy-status')).toHaveText('Copied');
  await page.getByRole('button', { name: 'SVG', exact: true }).click();
  await expect(page.locator('.icon-code')).toContainText('stroke="#00ff3f"');
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('link', { name: 'Download SVG' }).click()]);
  expect(download.suggestedFilename()).toBe('wallet.svg');
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(chunk);
  const svg = Buffer.concat(chunks).toString();
  expect(svg).toContain('width="32"');
  expect(svg).toContain('stroke-width="1.5"');
  await search.fill('no-such-icon');
  await expect(page.getByRole('heading', { name: 'No icons found' })).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await search.fill('AlertTriangle');
  await expect(page.getByRole('button', { name: 'Select TriangleAlert' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('documentation and static search work under the Pages prefix', async ({ page }) => {
  const failed: string[] = [];
  page.on('response', response => { if (response.status() >= 400 && response.url().startsWith('http://127.0.0.1')) failed.push(response.url()); });
  await page.goto('./');
  await page.getByRole('link', { name: 'Start building' }).click();
  await expect(page.getByRole('heading', { name: 'Getting started', exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/docs\/getting-started\//);
  await page.locator('button[data-search-full]').click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('combobox').fill('Expo');
  await expect(dialog.getByRole('option').filter({ hasText: /^Documentation\s*React Native$/ })).toBeVisible();
  await dialog.getByRole('option').filter({ hasText: /^Documentation\s*React Native$/ }).click();
  await expect(page).toHaveURL(/\/docs\/react-native\//);
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'React Native', exact: true })).toBeVisible();
  expect(failed).toEqual([]);
  const missing = await page.goto('./missing-page/');
  expect(missing?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'This icon is off the grid.' })).toBeVisible();
});

test('mobile layout, touch selection, and keyboard controls', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: 'test-results/mobile.png' });
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.getByRole('searchbox', { name: 'Search icons' }).fill('check');
  const tile = page.getByRole('button', { name: 'Select Check', exact: true });
  await tile.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.icon-inspector h3')).toHaveText('Check');
  await expect(page.locator('.icon-inspector')).toBeInViewport();
  await page.getByRole('button', { name: 'Back to icons' }).click();
  await expect(tile).toBeInViewport();
  await page.screenshot({ path: 'test-results/mobile-gallery.png' });
  await page.goto('./docs/react/');
  await expect(page.getByRole('heading', { name: 'React', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('desktop visual capture and clipboard failure feedback', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./');
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: 'test-results/desktop.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.evaluate(() => { Object.defineProperty(navigator.clipboard, 'writeText', { value: () => Promise.reject(new Error('Denied')) }); });
  await page.locator('.icon-inspector').getByRole('button', { name: 'Copy code', exact: true }).click();
  await expect(page.locator('.icon-inspector .copy-status')).toContainText('Select the code to copy it manually');
});

test('Bloxwap and Pro chart collections match audited usage and preserve chart geometry', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: /^Bloxwap \d/ }).click();
  await expect(page.locator('.result-count')).toHaveText(`${usage.icons.filter(icon => icon.collections.includes('bloxwap')).length} icons`);
  await expect(page.getByRole('button', { name: 'Select ProFib', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: /^Pro chart \d/ }).click();
  await expect(page.locator('.result-count')).toHaveText(`${usage.icons.filter(icon => icon.collections.includes('pro-chart')).length} icons`);
  await page.getByRole('searchbox', { name: 'Search icons' }).fill('pro-fib');
  await page.getByRole('button', { name: 'Select ProFib', exact: true }).click();
  await expect(page.getByRole('slider', { name: 'Stroke width' })).toHaveValue('1.5');
  await expect(page.locator('.icon-inspector svg')).toHaveAttribute('stroke-width', '1.5');
  await expect(page.locator('.icon-code')).toContainText("@bloxwap/icons/react/pro-fib");
  await expect(page.getByRole('link', { name: 'Pro chart artwork' })).toHaveAttribute('href', /bloxwap\/chart\/blob\/.*\/fib.svg$/);
  await page.getByRole('button', { name: 'SVG', exact: true }).click();
  await expect(page.locator('.icon-code')).toContainText('stroke-width="1.5"');
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
