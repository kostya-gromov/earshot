import { expect, test } from '@playwright/test';

const url = '/patterns/input-with-chips/';

test('an address that is not public https is explained, and focus returns to it', async ({
  page,
}) => {
  await page.goto(url);
  const field = page.getByRole('textbox', { name: 'Storybook story URL' });
  await field.fill('localhost:6006');
  await page.getByRole('button', { name: 'Check the link' }).click();
  await expect(field).toBeFocused();
  await expect(field).toHaveAttribute('aria-invalid', 'true');
  await expect(field).toHaveAccessibleDescription(
    /Enter a full public URL that starts with https:\/\//,
  );
});

test('a valid request says honestly that nothing was sent', async ({ page }) => {
  await page.goto(url);
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page
    .getByRole('textbox', { name: 'Storybook story URL' })
    .fill('https://storybook.example.com/?path=/story/chips');
  await page.getByRole('button', { name: 'Check the link' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Nothing was sent' })).toBeVisible();
  expect(requests.filter((address) => address.includes('example.com'))).toEqual([]);
});

test('asks for no email until stories can actually run', async ({ page }) => {
  await page.goto('/patterns/input-with-chips/');
  const section = page.getByRole('region', { name: 'Run it on your component' });
  await expect(section.getByRole('textbox')).toHaveCount(1);
  await expect(section).toContainText('play function');
});
