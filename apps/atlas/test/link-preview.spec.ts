import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { openingText } from '../scripts/og-opening';

const altFile = join(import.meta.dirname, '..', 'src', 'app', 'opengraph-image.alt.txt');

// Red here means the home page's brand, question or line under it changed after the preview
// image was taken: build, serve the export and run scripts/og-image.ts again.
test('the link preview image shows what the home page opens with', async ({ page }) => {
  await page.goto('/');
  const recorded = readFileSync(altFile, 'utf8').trim();
  expect(await page.evaluate(openingText)).toBe(recorded);
});

test('the link preview image has the words it shows as its alt text', async ({ page }) => {
  await page.goto('/');
  const alt = page.locator('meta[property="og:image:alt"]');
  await expect(alt).toHaveAttribute('content', readFileSync(altFile, 'utf8'));
});
