import { test, expect } from '@playwright/test';

test('all views render, time changes, and edited data survives reload', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByText('regions, 2 branches, one story.', { exact: false })).toBeVisible();
  const views = [
    ['Family Tree', 'Family Tree'], ['Timeline', 'Timeline'],
    ['Map', 'Migration Map'], ['People', 'People'],
    ['Documents', 'Documents & Media'], ['Manage Data', 'Manage Family Data'],
  ];
  for (const [nav, heading] of views) {
    await page.locator('nav').getByRole('button', { name: nav, exact: true }).click();
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
  }
  for (const tab of ['Locations', 'Events', 'Migrations', 'Documents', 'Branches', 'Relationships', 'People']) {
    await page.locator('.fa-content').getByRole('button', { name: new RegExp(`^${tab}`) }).first().click();
  }
  await page.getByRole('button', { name: 'Add person', exact: true }).click();
  await page.getByLabel('First name').fill('Test');
  await page.getByLabel('Last name').fill('Relative');
  await page.getByLabel('Birth year').fill('1990');
  await page.locator('.fa-modal').getByRole('button', { name: /Save/ }).click();
  await page.reload();
  await page.locator('nav').getByRole('button', { name: 'People', exact: true }).click();
  await expect(page.getByText('Test Relative', { exact: true })).toBeVisible();
  await page.locator('input[type="range"]').fill('2026');
  await expect(page.getByText('members · ages shown for 2026.', { exact: false })).toBeVisible();
  expect(errors).toEqual([]);
});
