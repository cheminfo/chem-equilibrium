/* eslint-disable no-await-in-loop -- one browser page driven through the routes in turn */
import { expect, test } from '@playwright/test';

/** Every page of the site, matching `src/routes.ts`. */
const ROUTES = [
  { path: '/', label: 'Home' },
  { path: '/ph', label: 'pH calculator' },
  { path: '/titration', label: 'Titration' },
  { path: '/speciation', label: 'Acid/base speciation' },
  { path: '/precipitation', label: 'Precipitation' },
  { path: '/equilibrium', label: 'Any equilibrium' },
  { path: '/exercises', label: 'Exercises' },
  { path: '/how-it-works', label: 'How it works' },
  { path: '/data', label: 'Data' },
  { path: '/about', label: 'About' },
];

test('the shell renders with every tab', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('/');
  await expect(
    page.getByRole('heading', {
      name: 'equilibrium.cheminfo.org',
      exact: true,
      level: 1,
    }),
  ).toBeVisible();

  for (const route of ROUTES) {
    await expect(
      page.getByRole('tab', { name: route.label, exact: true }),
    ).toBeVisible();
  }
  expect(errors).toStrictEqual([]);
});

test('every page opens directly from its own URL', async ({ page }) => {
  for (const route of ROUTES) {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto(`/#${route.path}`);
    await expect(
      page.getByRole('tab', { name: route.label, exact: true }),
    ).toHaveAttribute('aria-selected', 'true');
    expect(errors, `${route.path} threw`).toStrictEqual([]);
  }
});

test('clicking a tab changes the hash, and the back button returns', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('tab', { name: 'Data', exact: true }).click();
  await expect(page).toHaveURL(/#\/data/);

  await page.getByRole('tab', { name: 'About', exact: true }).click();
  await expect(page).toHaveURL(/#\/about/);

  await page.goBack();
  await expect(page).toHaveURL(/#\/data/);
});

test('an unknown route falls back to the home page', async ({ page }) => {
  await page.goto('/#/does-not-exist');
  await expect(
    page.getByRole('tab', { name: 'Home', exact: true }),
  ).toHaveAttribute('aria-selected', 'true');
});

test('the About page credits the authors and shows the EPFL logo', async ({
  page,
}) => {
  await page.goto('/#/about');
  for (const name of ['Daniel Kostro', 'Michaël Zasso', 'Luc Patiny']) {
    await expect(page.getByText(name, { exact: false })).toBeVisible();
  }
  await expect(page.locator('img[src*="epfl-logo"]')).toBeVisible();
});
