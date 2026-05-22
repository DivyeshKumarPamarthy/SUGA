import { test, expect } from '@playwright/test';
import { SELECTORS } from '../helpers/selectors';
import { loginAsCustomer, loginAsVendor, loginAsAdmin, logout } from '../helpers/auth';

test.describe('Authentication and Registration Flow', () => {
  test('Customer Registration and Login', async ({ page }) => {
    const testUsername = `priya_customer_${Date.now()}`;
    const testEmail = `${testUsername}@example.com`;

    await page.goto('/register');
    await page.click(SELECTORS.register.customerToggle);
    await page.fill(SELECTORS.register.firstName, 'Test');
    await page.fill(SELECTORS.register.lastName, 'Customer');
    await page.fill(SELECTORS.register.username, testUsername);
    await page.fill(SELECTORS.register.email, testEmail);
    await page.fill(SELECTORS.register.phone, '9876543299');
    await page.fill(SELECTORS.register.password, 'TestPass123!');
    await page.fill(SELECTORS.register.confirmPassword, 'TestPass123!');
    
    await page.click(SELECTORS.register.submit);
    await expect(page.locator(SELECTORS.register.successMessage)).toBeVisible();

    // Verify we can login with the new credentials
    await page.waitForURL('/login');
    await page.fill(SELECTORS.login.username, testUsername);
    await page.fill(SELECTORS.login.password, 'TestPass123!');
    await page.click(SELECTORS.login.submit);
    await expect(page).toHaveURL('/');
  });

  test('Vendor Registration and Login', async ({ page }) => {
    const testUsername = `test_vendor_${Date.now()}`;
    const testEmail = `${testUsername}@example.com`;

    await page.goto('/register');
    await page.click(SELECTORS.register.vendorToggle);
    await page.fill(SELECTORS.register.firstName, 'Test');
    await page.fill(SELECTORS.register.lastName, 'Vendor');
    await page.fill(SELECTORS.register.username, testUsername);
    await page.fill(SELECTORS.register.email, testEmail);
    await page.fill(SELECTORS.register.phone, '9876543288');
    await page.fill(SELECTORS.register.password, 'TestPass123!');
    await page.fill(SELECTORS.register.confirmPassword, 'TestPass123!');
    
    // Vendor specific fields
    await page.fill(SELECTORS.register.shopName, 'Test Artisan Shop');
    await page.selectOption(SELECTORS.register.vendorType, 'handloom_weaver');
    await page.fill(SELECTORS.register.location, 'Jaipur, Rajasthan');

    await page.click(SELECTORS.register.submit);
    await expect(page.locator(SELECTORS.register.successMessage)).toBeVisible();

    // Verify login leads to vendor dashboard
    await page.waitForURL('/login');
    await page.fill(SELECTORS.login.username, testUsername);
    await page.fill(SELECTORS.login.password, 'TestPass123!');
    await page.click(SELECTORS.login.submit);
    await expect(page).toHaveURL(/\/vendor\/dashboard/);
  });

  test('Admin Login', async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page.locator('text=Welcome back, Admin')).toBeVisible();
  });

  test('Logout Functionality', async ({ page }) => {
    await loginAsCustomer(page);
    await logout(page);
    await expect(page).toHaveURL('/');
    await expect(page.locator('text=Log In').first()).toBeVisible();
  });

  test('Protected Routes Redirect to Login', async ({ page }) => {
    // Attempting to access vendor dashboard without credentials
    await page.goto('/vendor/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });
});
