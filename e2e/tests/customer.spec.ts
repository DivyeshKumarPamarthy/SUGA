import { test, expect } from '@playwright/test';
import { SELECTORS } from '../helpers/selectors';
import { loginAsCustomer, logout } from '../helpers/auth';

test.describe('Customer End-to-End Workflows', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsCustomer(page);
  });

  test('Search, Add to Cart, Checkout, and Book Sizing Appointment', async ({ page }) => {
    // 1. Browse Products & Search
    await page.goto('/products');
    await expect(page.locator(SELECTORS.products.productCard).first()).toBeVisible();

    await page.fill(SELECTORS.products.searchInput, 'Navy Suit');
    await page.press(SELECTORS.products.searchInput, 'Enter');
    
    // Check that we see the navy suit product card
    const card = page.locator(SELECTORS.products.productCard).first();
    await expect(card).toContainText('Navy Suit');

    // 2. View Product Details
    await card.click();
    await expect(page).toHaveURL(/\/products\/premium-wool-3-piece-navy-suit/);
    await expect(page.locator('h1')).toContainText('Navy Suit');

    // Select Custom Measurement size
    await page.click('button:has-text("Custom Measurement")');

    // 3. Add to Shopping Bag
    await page.click('button:has-text("Add to Shopping Bag")');
    await expect(page.locator('text=Added to shopping bag')).toBeVisible();

    // 4. View Cart & Checkout (Single-Page View)
    await page.goto('/cart');
    await expect(page.locator('text=Premium Wool 3-Piece Navy Suit')).toBeVisible();

    // 5. Fill Checkout form
    await page.fill(SELECTORS.cart.name, 'Priya Sharma');
    await page.fill(SELECTORS.cart.address, 'Sector 62, Landmark building');
    await page.fill(SELECTORS.cart.city, 'Noida');
    await page.fill(SELECTORS.cart.state, 'Uttar Pradesh');
    await page.fill(SELECTORS.cart.pincode, '201301');
    await page.fill(SELECTORS.cart.phone, '9876543210');
    await page.click(SELECTORS.cart.placeOrder);

    // Click Simulate Card/UPI Success inside Mock Payment Modal
    await page.click('button:has-text("Simulate Card/UPI Success")');

    // Click Schedule Consultation on the success page to go to orders history
    await page.click('a:has-text("Schedule Consultation")');

    // 6. Redirect to Order History and book Sizing Call
    await expect(page).toHaveURL(/\/orders/);
    await expect(page.locator('text=Your Order Chronicles')).toBeVisible();

    // Click "Book Sizing Call" button
    const bookBtn = page.locator('button:has-text("Book Sizing Call")').first();
    await expect(bookBtn).toBeVisible();
    await bookBtn.click();

    // Fill appointment form
    await page.selectOption(SELECTORS.appointments.typeSelect, 'virtual');
    
    // Put a date a week from now
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const dateStr = nextWeek.toISOString().split('T')[0];
    await page.fill(SELECTORS.appointments.dateInput, dateStr);

    await page.selectOption(SELECTORS.appointments.timeInput, '03:30 PM - 04:00 PM');
    await page.fill(SELECTORS.appointments.notes, 'Please guide on shoulder measurement taking.');
    await page.click(SELECTORS.appointments.submit);

    // Wait for redirect to /appointments
    await expect(page).toHaveURL(/\/appointments/);
    await expect(page.locator('h1:has-text("Consultations")')).toBeVisible();
    await expect(page.locator('text=03:30 PM - 04:00 PM').first()).toBeVisible();
  });

  test('Submit Support Ticket', async ({ page }) => {
    await page.goto('/support');
    await expect(page.locator('text=SUGA Concierge & Support')).toBeVisible();

    await page.fill(SELECTORS.support.subject, 'Refund Query');
    await page.selectOption(SELECTORS.support.issueType, 'payment');
    await page.fill(SELECTORS.support.description, 'My previous order payment was processed twice.');
    await page.click(SELECTORS.support.submit);

    // Click My Inquiries tab to view ticket history
    await page.click('button:has-text("My Inquiries")');

    // Verify ticket is in the list
    await expect(page.locator('text=Refund Query').first()).toBeVisible();
  });
});
