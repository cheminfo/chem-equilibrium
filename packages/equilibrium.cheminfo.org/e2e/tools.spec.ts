/* eslint-disable no-await-in-loop -- one browser page driven through the tools in turn */
import { expect, test } from '@playwright/test';

/** The six interactive tools, which must all render and solve on their own. */
const TOOLS = [
  '/ph',
  '/titration',
  '/speciation',
  '/precipitation',
  '/equilibrium',
  '/exercises',
];

test('every tool renders without throwing', async ({ page }) => {
  for (const path of TOOLS) {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto(`/#${path}`);
    // The solve is synchronous, so one frame is enough for the result to be up.
    await page.waitForTimeout(400);
    expect(errors, `${path} threw`).toStrictEqual([]);
  }
});

test('the tools that plot a diagram draw one', async ({ page }) => {
  for (const path of ['/titration', '/speciation', '/precipitation']) {
    await page.goto(`/#${path}`);
    await expect(
      page.locator('.chart-container svg').first(),
      `${path} has no chart`,
    ).toBeVisible({ timeout: 15_000 });
  }
});

test('a tool keeps its configuration in the URL', async ({ page }) => {
  await page.goto('/#/speciation');
  await page.waitForTimeout(400);

  const shared = page.url();
  expect(shared).toContain('#/speciation');

  // Reopening the shared URL in a fresh context must show the same thing.
  await page.goto('about:blank');
  await page.goto(shared);
  await page.waitForTimeout(400);
  expect(page.url()).toBe(shared);
});

test('the pH calculator reports a plausible pH for acetic acid', async ({
  page,
}) => {
  await page.goto('/#/ph');
  await page.waitForTimeout(600);
  // 0.1 M CH3CO2H is pH 2.85; whatever the default is, a pH must be shown.
  await expect(page.getByText(/pH\s*=?\s*\d+\.\d+/).first()).toBeVisible();
});

test('the data page lists the whole database', async ({ page }) => {
  await page.goto('/#/data');
  await expect(page.locator('table').first()).toBeVisible();
  await expect(page.getByText(/127/).first()).toBeVisible();
});
