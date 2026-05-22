import { test, expect } from '@playwright/test';
import { SELECTORS } from '../helpers/selectors';
import { loginAsVendor } from '../helpers/auth';

test.describe('Vendor End-to-End Workflows', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsVendor(page);
  });

  test('Create Product, Edit Product, Accept Order, and Create Promotion', async ({ page }) => {
    // 1. Add Product
    await page.click(SELECTORS.vendor.sidebar.products);
    await expect(page.locator('text=Loading studio inventory...')).not.toBeVisible();
    await page.click(SELECTORS.vendor.sidebar.addProduct);
    await expect(page).toHaveURL(/\/vendor\/products\/add/);

    await page.fill('input[placeholder="e.g. Pure Banarasi Silk Saree - Ruby Red"]', 'E2E Banarasi Silk Saree');
    await page.selectOption('select:has(option:has-text("Select a category"))', { label: 'Ethnic Wear' });
    await page.selectOption('select:has(option:has-text("Draft"))', 'active');
    await page.fill('input[placeholder="e.g. 8500.00"]', '12500.00');
    await page.fill('label:has-text("Stock Qty") + input', '15');
    await page.fill('input[placeholder="e.g. WEAVE-SLK-001"]', 'E2E-SLK-101');
    await page.fill('textarea[placeholder*="Detail the handloom certificate"]', 'This is an authentic hand-woven Banarasi silk saree generated for E2E tests.');

    await page.click('button[type="submit"]:has-text("Save Product")');
    await expect(page).toHaveURL(/\/vendor\/products$/);
    await expect(page.locator('text=Loading studio inventory...')).not.toBeVisible();
    await expect(page.locator('text=E2E Banarasi Silk Saree')).toBeVisible();

    // 2. Edit Product
    const editBtn = page.locator('tr:has-text("E2E Banarasi Silk Saree") button:has(span.material-symbols-outlined:has-text("edit")), a:has(span.material-symbols-outlined:has-text("edit"))').first();
    await editBtn.click();
    await expect(page).toHaveURL(/\/vendor\/products\/\d+\/edit/);
    await expect(page.locator('text=Loading product data...')).not.toBeVisible();
    
    await page.fill('label:has-text("Stock Qty") + input', '20');
    await page.click('button[type="submit"]:has-text("Save Product")');
    await expect(page).toHaveURL(/\/vendor\/products$/);
    await expect(page.locator('text=Loading studio inventory...')).not.toBeVisible();
    await expect(page.locator('tr:has-text("E2E Banarasi Silk Saree")')).toBeVisible();

    // 3. Accept Order Item on Dashboard
    await page.goto('/vendor/dashboard');
    
    // Handle the browser confirm popup for updating order status
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    const acceptBtn = page.locator('button:has-text("Accept"):has-text("Order")').first();
    if (await acceptBtn.isVisible()) {
      await acceptBtn.click();
      await expect(page.locator('text=accepted').first()).toBeVisible();
    }

    // 4. Create Promotion
    await page.click(SELECTORS.vendor.sidebar.promotions);
    await expect(page).toHaveURL(/\/vendor\/promotions/);
    await page.click('button:has-text("New Campaign")');

    await page.selectOption('select[name="ad_type"]', 'homepage_carousel');
    await page.fill('input[name="title"]', 'E2E Saree Showcase');
    await page.fill('input[name="target_url"]', 'http://localhost:5173/products/premium-wool-3-piece-navy-suit');
    await page.fill('input[name="keywords"]', 'saree, handloom, e2e');
    
    // Date ranges
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split('T')[0];
    await page.fill('input[name="start_date"]', today);
    await page.fill('input[name="end_date"]', nextWeekStr);
    await page.fill('input[name="daily_rate"]', '300.00');

    await page.click('button:has-text("Submit Campaign")');
    await expect(page.locator('text=E2E Saree Showcase')).toBeVisible();
  });
});
