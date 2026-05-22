import { Page, expect } from '@playwright/test';
import { SELECTORS } from './selectors';

export async function login(page: Page, username: string, password: string) {
  await page.goto('/login');
  await page.fill(SELECTORS.login.username, username);
  await page.fill(SELECTORS.login.password, password);
  await page.click(SELECTORS.login.submit);
}

export async function loginAsCustomer(page: Page) {
  await login(page, 'priya', 'customer123');
  await expect(page).toHaveURL('/');
}

export async function loginAsVendor(page: Page) {
  await login(page, 'raja_tailors', 'vendor123');
  await expect(page).toHaveURL(/\/vendor\/dashboard/);
}

export async function loginAsAdmin(page: Page) {
  await login(page, 'admin', 'admin123');
  await expect(page).toHaveURL(/\/admin\/dashboard/);
}

export async function logout(page: Page) {
  // If we are in admin/vendor, there is usually a sidebar or a header button.
  // In customer, we hover or click the profile menu, then select Log Out.
  const profileMenu = page.locator(SELECTORS.nav.profileMenu);
  if (await profileMenu.isVisible()) {
    const groupElement = page.locator('.relative.group');
    if (await groupElement.isVisible()) {
      await groupElement.hover();
      await page.waitForTimeout(300);
      const logoutBtn = page.locator(SELECTORS.nav.logout);
      if (!(await logoutBtn.isVisible())) {
        await groupElement.locator('button').first().click();
        await page.waitForTimeout(300);
      }
      await expect(logoutBtn).toBeVisible({ timeout: 5000 });
      await logoutBtn.click();
    } else {
      await profileMenu.click();
      await page.waitForTimeout(300);
      await page.click(SELECTORS.nav.logout);
    }
  } else {
    // If not visible directly, we can try to go directly to /logout or clear localStorage
    await page.evaluate(() => {
      localStorage.clear();
      window.location.href = '/login';
    });
  }
}
