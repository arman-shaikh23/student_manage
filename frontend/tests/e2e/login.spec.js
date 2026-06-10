import { test, expect } from '@playwright/test';

test('login page has correct title and elements', async ({ page }) => {
  await page.goto('/login');
  
  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Student Management System/i);

  // Expect elements to be visible
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  await expect(page.getByPlaceholder('admin@system.com')).toBeVisible();
  await expect(page.getByPlaceholder('••••••••')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
});

test('login attempt with invalid credentials shows error', async ({ page }) => {
  await page.goto('/login');

  await page.getByPlaceholder('admin@system.com').fill('wrong@example.com');
  await page.getByPlaceholder('••••••••').fill('wrongpassword');
  await page.getByRole('button', { name: 'Sign in' }).click();

  // We check for the toast error message. Since react-hot-toast creates a div with the message.
  await expect(page.locator('text=Invalid credentials')).toBeVisible({ timeout: 5000 });
});
