import { test, expect } from '@playwright/test';
import { SELECTORS } from '../helpers/selectors';
import { loginAsAdmin } from '../helpers/auth';

test.describe('Admin End-to-End Workflows', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('Approve Pending Vendor', async ({ page }) => {
    // Navigate to Verifications page
    await page.click('text=Verifications');
    await expect(page).toHaveURL(/\/admin\/verifications/);

    // Verify pending vendor is visible
    const vendorRow = page.locator('div.bg-surface-container-low:has-text("Kashmiri Looms")');
    await expect(vendorRow).toBeVisible();
    await expect(vendorRow).toContainText('Artisan Handloom Weaver');
    await expect(vendorRow).toContainText('Faisal Mir');

    // Approve the merchant
    const approveBtn = vendorRow.locator('button:has-text("Approve Merchant")');
    await approveBtn.click();

    // Check that Kashmiri Looms is no longer in pending list (or success is shown)
    await expect(vendorRow).not.toBeVisible();
  });

  test('Moderate Pending Review', async ({ page }) => {
    // Navigate to Review Moderation page
    await page.click('text=Reviews');
    await expect(page).toHaveURL(/\/admin\/reviews/);

    // Verify pending review is visible (Linen Summer Blazer is the seeded pending review)
    const reviewCard = page.locator('div.bg-surface-container-low:has-text("Linen Summer Blazer")');
    await expect(reviewCard).toBeVisible();
    await expect(reviewCard).toContainText('Stunning design!');

    // Approve the review
    const approveBtn = reviewCard.locator('button:has-text("Approve")');
    await approveBtn.click();

    // Verify the review card is removed from pending reviews list
    await expect(reviewCard).not.toBeVisible();
  });

  test('Approve Advertisement Campaign', async ({ page }) => {
    // Navigate to Ads & Promos page
    await page.click('text=Ads & Promos');
    await expect(page).toHaveURL(/\/admin\/ads/);

    // Click Banner Ads tab since "Artisan Suits Spotlight" is a homepage carousel ad
    await page.click('text=Banner Ads');

    // Locate the row by the vendor name as the ad title is not rendered directly in the table
    const adRow = page.locator('tr:has-text("Raja Tailors")').first();
    await expect(adRow).toBeVisible();

    // Click "Review" to open modal
    await adRow.locator('button:has-text("Review")').click();

    // Modal should be visible
    const modal = page.locator('div.fixed:has-text("Review Ad Campaign")');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('Artisan Suits Spotlight');

    // Click Approve
    await modal.locator('button:has-text("Approve")').click();

    // Verify modal closed and row status updated or reviewed
    await expect(modal).not.toBeVisible();
    await expect(adRow.locator('text=Reviewed')).toBeVisible();
  });

  test('Resolve Support Ticket', async ({ page }) => {
    // Navigate to Support page
    await page.click('text=Support');
    await expect(page).toHaveURL(/\/admin\/support/);

    // Find the ticket: Measurement Guidance Needed
    const ticketRow = page.locator('div.bg-surface-container-low:has-text("Measurement Guidance Needed")');
    await expect(ticketRow).toBeVisible();

    // Open ticket details modal
    await ticketRow.click();

    const drawer = page.locator('div.fixed:has-text("Ticket #")');
    await expect(drawer).toBeVisible();
    await expect(drawer).toContainText('Measurement Guidance Needed');

    // Change status select to resolved
    const statusSelect = drawer.locator('select').first();
    await statusSelect.selectOption('resolved');

    // Verify badge status updates inside the details drawer
    await expect(drawer.locator('span:has-text("Resolved")')).toBeVisible();

    // Close the details modal/drawer
    await drawer.locator('button:has-text("Close View")').click();
    await expect(drawer).not.toBeVisible();
  });
});
