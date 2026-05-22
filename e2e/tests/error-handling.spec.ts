import { test, expect } from '@playwright/test';
import { SELECTORS } from '../helpers/selectors';
import { loginAsCustomer, logout } from '../helpers/auth';

test.describe('Error Handling and Edge Cases', () => {
  test('Invalid Login Credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill(SELECTORS.login.username, 'non_existent_user');
    await page.fill(SELECTORS.login.password, 'wrongpassword123');
    await page.click(SELECTORS.login.submit);

    // Expect login failure error message
    const errorMsg = page.locator(SELECTORS.login.errorMessage);
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toContainText('No active account found with the given credentials');
  });

  test('Registration Password Mismatch', async ({ page }) => {
    await page.goto('/register');
    await page.click(SELECTORS.register.customerToggle);
    await page.fill(SELECTORS.register.firstName, 'Priya');
    await page.fill(SELECTORS.register.lastName, 'Sharma');
    await page.fill(SELECTORS.register.username, 'priya_mismatch');
    await page.fill(SELECTORS.register.email, 'priya_mismatch@example.com');
    await page.fill(SELECTORS.register.phone, '9876543200');
    await page.fill(SELECTORS.register.password, 'Password123!');
    await page.fill(SELECTORS.register.confirmPassword, 'DifferentPassword456!');
    await page.click(SELECTORS.register.submit);

    // Expect standard validation password mismatch message
    await expect(page.locator('text=Passwords do not match.')).toBeVisible();
  });

  test('Accessing Admin Dashboard as Customer Redirects to Home', async ({ page }) => {
    // Log in as customer
    await loginAsCustomer(page);

    // Attempt to access admin dashboard directly
    await page.goto('/admin/dashboard');

    // Should redirect to customer home page due to role protection guard
    await expect(page).toHaveURL('/');
  });

  test('Empty Search Results View', async ({ page }) => {
    await page.goto('/products');
    await page.fill(SELECTORS.products.searchInput, 'ZxyzNonExistentProduct');
    await page.press(SELECTORS.products.searchInput, 'Enter');

    // Expect empty search state
    await expect(page.locator('text=No couture items found')).toBeVisible();
    await expect(page.locator('text=Reset Search')).toBeVisible();
  });
});
