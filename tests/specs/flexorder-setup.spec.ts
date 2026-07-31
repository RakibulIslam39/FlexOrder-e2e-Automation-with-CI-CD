import { test, expect } from '../fixtures/test-fixtures';

/**
 * FlexOrder onboarding — runs in the `plugin-setup` project.
 *
 * The `auth-setup` project has already logged in and saved the storage
 * state, so this spec starts with a fully authenticated WP admin session
 * and jumps straight into the plugin wizard.
 */
test('Complete FlexOrder credentials + Google Sheet setup wizard', async ({ page, setupPage }) => {
    await page.goto('/wp-admin/');

    await setupPage.navigateToPluginPage();
    await setupPage.completeSetup();
    await setupPage.finalizeSetup();

    await expect(page.getByRole('heading', { name: 'Congratulations' })).toBeVisible();
});
