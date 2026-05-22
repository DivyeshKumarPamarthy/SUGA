import { test, expect } from '@playwright/test';

test.describe('UI/UX Layout and Responsiveness', () => {
  test('Desktop Layout (1440x900)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    // Verify header branding
    await expect(page.locator('text=SUGA').first()).toBeVisible();

    // Verify desktop navigation is visible
    await expect(page.locator('text=Explore Products').first()).toBeVisible();
    await expect(page.locator('text=Find Ateliers').first()).toBeVisible();
    await expect(page.locator('text=Support').first()).toBeVisible();

    // Verify mobile menu button is hidden on desktop
    const mobileMenuBtn = page.locator('header button:has(span.material-symbols-outlined:has-text("menu"))');
    await expect(mobileMenuBtn).not.toBeVisible();
  });

  test('Mobile Responsive Menu (375x812)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');

    // Desktop nav links should not be visible direct
    // In mobile, they are hidden under the drawer. Let's look at the desktop nav wrapper
    // The desktop menu has class "hidden md:flex". At 375px it is hidden.
    const desktopNav = page.locator('nav.hidden.md\\:flex');
    await expect(desktopNav).not.toBeVisible();

    // Mobile menu button should be visible
    const mobileMenuBtn = page.locator('header button:has(span.material-symbols-outlined:has-text("menu"))');
    await expect(mobileMenuBtn).toBeVisible();

    // Click to open mobile menu drawer
    await mobileMenuBtn.click();

    // Verify mobile drawer navigation is open
    const drawerLinks = page.locator('div.md\\:hidden a');
    await expect(drawerLinks.locator('text=Explore Products')).toBeVisible();
    await expect(drawerLinks.locator('text=Find Ateliers')).toBeVisible();

    // Click close menu button (the icon changes to "close")
    const mobileCloseBtn = page.locator('header button:has(span.material-symbols-outlined:has-text("close"))');
    await expect(mobileCloseBtn).toBeVisible();
    await mobileCloseBtn.click();

    // Drawer links should be hidden
    await expect(drawerLinks.locator('text=Explore Products')).not.toBeVisible();
  });

  test('Loading States and Animations', async ({ page }) => {
    // Go to catalog search page directly
    await page.goto('/products');

    // Confirm that the products grid loaded and spinner is not visible
    const spinner = page.locator('.animate-spin');
    await expect(spinner).not.toBeVisible();

    // Verify some product cards exist
    const cards = page.locator('.bg-surface-container-lowest, .border-outline-variant');
    await expect(cards.first()).toBeVisible();
  });
});
