import { test, expect } from '@playwright/test';
import { LoginPage } from '../src/pages/login';
import { join } from 'path';

/**
 * One-shot authentication project.
 *
 * Runs exactly once before any dependent project and persists the logged-in
 * browser storage state to disk. All subsequent tests reuse that storage
 * state and skip the login flow entirely, which shaves ~3-5s off every test
 * and removes the login form as a shared source of flakiness.
 */
export const STORAGE_STATE_PATH = join(__dirname, 'fixtures/.auth/user.json');

test('authenticate as WordPress admin', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.navigate();
    await loginPage.login();

    await expect(page.locator('#wpadminbar')).toBeVisible({ timeout: 30_000 });
    await page.context().storageState({ path: STORAGE_STATE_PATH });
    console.log(`🔐 Auth state persisted to ${STORAGE_STATE_PATH}`);
});
