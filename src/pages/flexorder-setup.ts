import { expect, Page, Locator } from '@playwright/test';
import env, { isCI } from '../config/environment';

/**
 * FlexOrder onboarding (setup wizard) Page Object.
 *
 * Prefers role-based and accessible locators over XPath/CSS where possible
 * so tests survive cosmetic DOM changes. Falls back to stable attribute
 * selectors when a role-based handle is unavailable.
 */
export class SetupAddCredentialsPage {
    private readonly page: Page;
    private readonly orderSyncLink: Locator;
    private readonly setupButton: Locator;
    private readonly changeSetupButton: Locator;
    private readonly setCredentialsLink: Locator;
    private readonly fileInput: Locator;
    private readonly apiEnabledCheckbox: Locator;
    private readonly nextButton: Locator;
    private readonly sheetUrlInput: Locator;
    private readonly sheetNameInput: Locator;
    private readonly copyButton: Locator;
    private readonly editorAccessCheckbox: Locator;
    private readonly appScriptCheckbox: Locator;
    private readonly triggerCheckbox: Locator;
    private readonly syncLink: Locator;
    private readonly dashboardLink: Locator;

    constructor(page: Page) {
        this.page = page;

        // FlexOrder entry-point in the WP admin sidebar. WordPress auto-generates
        // the id #toplevel_page_{plugin-slug} for every top-level menu, so it is
        // the most stable handle we have for this link.
        this.orderSyncLink = page.locator('#toplevel_page_osgsw-admin >> a').first();
        this.setupButton = page.getByRole('button', { name: 'Start setup' });
        this.changeSetupButton = page.getByRole('button', { name: 'Change setup' });
        this.setCredentialsLink = page.getByRole('link', { name: 'Set Credentials' });

        // Credential upload form.
        this.fileInput = page.getByLabel('Drag and drop the credential.');
        this.apiEnabledCheckbox = page.getByRole('checkbox', { name: 'I’ve enabled Google Sheet API' });
        this.nextButton = page.getByRole('button', { name: 'Next' });

        // Google Sheet connection form.
        this.sheetUrlInput = page.getByPlaceholder('Enter your google sheet URL');
        this.sheetNameInput = page.getByPlaceholder('Enter your google sheet Name');
        this.copyButton = page.getByRole('button', { name: 'Copy' });
        this.editorAccessCheckbox = page.getByRole('checkbox', { name: 'I\'ve given Editor access to' });
        this.appScriptCheckbox = page.getByRole('checkbox', { name: 'I\'ve placed the code and' });
        this.triggerCheckbox = page.getByRole('checkbox', { name: 'I’ve added the trigger and' });

        // Final wizard steps.
        this.syncLink = page.getByRole('link', { name: 'Sync orders on Google Sheet' });
        this.dashboardLink = page.getByRole('link', { name: 'Go to Dashboard' });
    }

    async navigateToPluginPage(): Promise<void> {
        await this.orderSyncLink.click();
        // Wait for the setup entry button to appear — this is a deterministic
        // signal that the plugin page finished rendering. We avoid
        // waitForLoadState('networkidle') which is brittle in WordPress admin
        // (heartbeat/WP-Cron keeps the network continuously active).
        // await expect(this.setupButton.or(this.changeSetupButton)).toBeVisible({ timeout: 15_000 });

        try {
            if (await this.setupButton.isVisible()) {
                await this.setupButton.click();
            } else {
                await this.changeSetupButton.click();
            }

            await this.setCredentialsLink.click();
            await expect(this.fileInput).toBeVisible({ timeout: 15_000 });
        } catch (error: any) {
            console.error('Error during navigation:', error);
            throw new Error(`Failed to navigate to plugin page: ${error?.message || 'Unknown error'}`);
        }
    }

    async uploadFile(): Promise<void> {
        const serviceAccountFile = process.env.SERVICE_ACCOUNT_UPLOAD_FILE;

        if (!serviceAccountFile || serviceAccountFile.trim() === '') {
            console.warn('⚠️ SERVICE_ACCOUNT_UPLOAD_FILE not configured, skipping file upload');
            return;
        }

        try {
            await this.fileInput.setInputFiles(serviceAccountFile);
            console.log('✅ Service account file uploaded successfully');
        } catch (error) {
            console.warn('⚠️ Failed to upload service account file:', error);
            throw new Error(`Failed to upload service account file: ${error}`);
        }
    }

    async completeSetup(): Promise<void> {
        await this.uploadFile();

        await expect(this.apiEnabledCheckbox).toBeVisible();
        if (!await this.apiEnabledCheckbox.isChecked()) {
            await this.apiEnabledCheckbox.check();
            console.log('✅ Enable API checkbox checked');
        }

        await this.nextButton.click();

        const sheetUrl = env.GOOGLE_SHEET_URL;
        const sheetName = env.SHEET_NAME;
        if (!sheetUrl || !sheetName) {
            const source = isCI ? 'GitHub Secrets (GOOGLE_SHEET_URL, SHEET_NAME)' : '.env file';
            throw new Error(`GOOGLE_SHEET_URL and SHEET_NAME must be set in ${source}`);
        }

        await expect(this.sheetUrlInput).toBeVisible();
        await this.sheetUrlInput.fill(sheetUrl);
        await this.sheetNameInput.fill(sheetName);
        console.log('✅ Sheet URL and Sheet Name filled successfully');

        await this.nextButton.click();

        if (!await this.editorAccessCheckbox.isChecked()) {
            await this.editorAccessCheckbox.check();
            console.log('✅ Editor access confirmation checked');
        }

        await this.nextButton.click();

        if (!await this.appScriptCheckbox.isChecked()) {
            await this.appScriptCheckbox.check();
            console.log('✅ App script confirmation checked');
        }

        await this.nextButton.click();

        await expect(this.triggerCheckbox).toBeVisible();
        if (!await this.triggerCheckbox.isChecked()) {
            await this.triggerCheckbox.check();
        }

        await this.nextButton.click();
    }

    async finalizeSetup(): Promise<void> {
        await this.syncLink.click();
        console.log('✅ Sync link clicked successfully');

        await expect(this.dashboardLink).toBeVisible({ timeout: 60_000 });
        await this.dashboardLink.click();
        console.log('✅ Dashboard link clicked successfully');
        await expect(this.page.getByRole('heading', { name: 'Congratulations' })).toBeVisible();
        console.log('✅ Setup completed');
    }
}
