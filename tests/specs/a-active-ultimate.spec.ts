// import { test, expect } from '@playwright/test';
// import { LoginPage } from '../../src/pages/login';
// import env from '../../src/config/environment';

// test('activate FlexOrder license and verify Google Sheet sync', async ({ page }) => {
//     const loginPage = new LoginPage(page);
//     await loginPage.navigate();
//     await loginPage.login();

//     await page.getByRole('link', { name: 'FlexOrder' }).click();
//     await page.waitForLoadState('domcontentloaded');

//     await page.getByRole('link', { name: 'License', exact: true }).click();
//     await page.waitForLoadState('domcontentloaded');
 
//     // Get license key from environment variable
//     const licenseKey = process.env.FLEXORDER_PRO_LICENSE_KEY;
//     if (!licenseKey) {
//         throw new Error('FLEXORDER_PRO_LICENSE_KEY environment variable is not set. Please add it to your .env file or CI secrets.');
//     }

//     const licenseInput = page.getByRole('textbox', { name: 'Enter your license key to' });
//     await licenseInput.click();
//     await licenseInput.fill(licenseKey);

//     await page.getByRole('button', { name: 'Activate License' }).click();
//     await page.waitForLoadState('load');


//     const settingsUrl = `${env.SITE_URL}/wp-admin/admin.php?page=osgsw-admin#settings`;
//     await page.goto(settingsUrl);
//     await page.waitForLoadState('domcontentloaded');
    
//     // Verify we successfully navigated to settings page
//     expect(page.url()).toContain('osgsw-admin');
//   });