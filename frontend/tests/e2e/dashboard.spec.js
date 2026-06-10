import { test, expect } from '@playwright/test';

test.describe('Dashboard Visual Regression', () => {
  test('should display dashboard correctly', async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:5173/login');
    
    // Login as Admin
    await page.fill('input[type="email"]', 'admin@system.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard
    await page.waitForURL('http://localhost:5173/');

    // Wait for the dashboard to load its stats and charts
    await page.waitForSelector('.recharts-wrapper', { state: 'visible' });

    // Ensure animations are somewhat settled
    await page.waitForTimeout(1000);

    // Take screenshot and compare
    await expect(page).toHaveScreenshot('dashboard.png', {
      maxDiffPixelRatio: 0.1, // Allow 10% diff due to dynamic data like dates or charts
    });
  });
});
