import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('app shell renders', async ({ page }) => {
  await expect(page.getByRole('link', { name: 'Create Puzzle', exact: true })).toBeVisible()
})

test('navigation drawer links are present', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.getByRole('button', { name: 'Open navigation' }).click()
  const drawerLibraryLink = page.locator('div[role="presentation"] a[href="/library"]')
  const drawerSettingsLink = page.locator('div[role="presentation"] a[href="/settings"]')
  await expect(drawerLibraryLink).toBeVisible()
  await expect(drawerSettingsLink).toBeVisible()
})
