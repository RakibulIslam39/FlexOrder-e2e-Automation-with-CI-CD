import { Page, Locator } from '@playwright/test';
import env, { isCI } from '../config/environment';

/**
 * WordPress Login Page Object Model
 *
 * Handles WordPress admin authentication for both CI and local environments
 * with industry best practices for security and reliability.
 *
 * Credentials (`USER_NAME` / `PASSWORD`) and admin URLs are always read
 * through the centralised `env` module — never from `process.env` directly —
 * so the same code path works for `.env` (local) and GitHub Secrets (CI).
 */
export class LoginPage {
    private readonly page: Page;
    private readonly isCI: boolean = isCI;

    // WordPress Login Form Selectors
    private readonly usernameInput: Locator;
    private readonly passwordInput: Locator;
    private readonly loginButton: Locator;
    private readonly rememberMeCheckbox: Locator;
    private readonly errorMessage: Locator;
    private readonly loginForm: Locator;

    // WordPress Admin Dashboard Indicators
    private readonly adminBar: Locator;
    private readonly dashboardHeading: Locator;
    private readonly welcomePanel: Locator;

    constructor(page: Page) {
        this.page = page;

        // Login form elements
        this.usernameInput = this.page.locator('#user_login');
        this.passwordInput = this.page.locator('#user_pass');
        this.loginButton = this.page.locator('#wp-submit');
        this.rememberMeCheckbox = this.page.locator('#rememberme');
        this.errorMessage = this.page.locator('#login_error, .error, .message.error');
        this.loginForm = this.page.locator('#loginform, .login-form');

        // Admin dashboard elements
        this.adminBar = this.page.locator('#wpadminbar, #wp-admin-bar-root');
        this.dashboardHeading = this.page.locator('h1:has-text("Dashboard"), .wrap h1');
        this.welcomePanel = this.page.locator('#welcome-panel, .welcome-panel');
    }

    /**
     * Navigates to the WordPress admin login page
     */
    async navigate(): Promise<void> {
        const adminUrl = this.resolveAdminURL();
        console.log(`🌐 Navigating to WordPress admin: ${adminUrl}`);

        try {
            await this.page.goto(adminUrl, {
                waitUntil: 'load',
                timeout: this.isCI ? 60000 : 30000
            });

            // Wait for page to be ready
            await this.page.waitForLoadState('domcontentloaded');
            
            // Check if we landed on login page or already authenticated
            const currentUrl = this.page.url();
            if (currentUrl.includes('/wp-admin/') && !currentUrl.includes('wp-login.php')) {
                console.log('✅ Already authenticated, redirected to admin dashboard');
            } else {
                console.log('🔐 Landed on login page, ready for authentication');
            }

        } catch (error) {
            const errorMessage = `Failed to navigate to admin URL: ${error instanceof Error ? error.message : String(error)}`;
            console.error(`❌ ${errorMessage}`);
            throw new Error(errorMessage);
        }
    }

    /**
     * Performs WordPress admin login using CI or environment credentials
     */
    async login(): Promise<void> {
        const credentials = this.getCredentials();
        
        console.log(`🔐 Attempting login with username: ${credentials.username}`);

        try {
            // Check if already authenticated
            if (await this.isAlreadyAuthenticated()) {
                console.log('✅ Already authenticated, skipping login');
                return;
            }

            // Wait for login form to be visible
            await this.waitForLoginForm();

            // Clear any existing values and fill credentials
            await this.usernameInput.clear();
            await this.usernameInput.fill(credentials.username);
            
            await this.passwordInput.clear();
            await this.passwordInput.fill(credentials.password);

            // Uncheck "Remember Me" for security in CI
            if (this.isCI && await this.rememberMeCheckbox.isVisible()) {
                await this.rememberMeCheckbox.uncheck();
            }

            console.log('🚀 Submitting login form...');
            await this.loginButton.click();

            // Verify we actually reached the admin dashboard. Racing a URL
            // match with an admin-bar visibility check handles both the
            // classic wp-admin redirect and single-page admin layouts.
            await Promise.race([
                this.page.waitForURL('**/wp-admin/**', { timeout: this.isCI ? 30000 : 15000 }),
                this.adminBar.waitFor({ state: 'visible', timeout: this.isCI ? 30000 : 15000 }),
            ]);

            console.log('✅ WordPress admin login successful');

        } catch (error) {
            const errorMessage = `Login failed: ${error instanceof Error ? error.message : String(error)}`;
            console.error(`❌ ${errorMessage}`);
            
            // Capture additional error context
            await this.captureLoginErrorContext();
            
            throw new Error(errorMessage);
        }
    }

    /**
     * Performs a complete login flow (navigate + authenticate)
     */
    async loginFlow(): Promise<void> {
        await this.navigate();
        await this.login();
    }

    /**
     * Checks if user is already authenticated in WordPress admin
     */
    async isAlreadyAuthenticated(): Promise<boolean> {
        const currentUrl = this.page.url();
        
        // Check URL patterns for admin area
        if (currentUrl.includes('/wp-admin/') && !currentUrl.includes('wp-login.php')) {
            return true;
        }

        // Check for admin bar presence
        const hasAdminBar = await this.adminBar.isVisible().catch(() => false);
        if (hasAdminBar) {
            return true;
        }

        // Check for login form absence
        const hasLoginForm = await this.loginForm.isVisible().catch(() => false);
        return !hasLoginForm;
    }

    /**
     * Logs out of WordPress admin
     */
    async logout(): Promise<void> {
        try {
            console.log('🔓 Logging out of WordPress admin...');

            // Navigate to logout URL
            const logoutUrl = `${this.resolveAdminURL()}?action=logout`;
            await this.page.goto(logoutUrl, { timeout: 30000 });

            // Confirm logout if prompted
            const logoutConfirm = this.page.locator('a:has-text("log out")');
            if (await logoutConfirm.isVisible()) {
                await logoutConfirm.click();
            }

            // Wait for redirect to login page
            await this.page.waitForURL('**/wp-login.php**', { timeout: 15000 });
            
            console.log('✅ Successfully logged out');

        } catch (error) {
            console.warn(`⚠️ Logout failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Admin URL, always resolved (and normalised) by the env module.
     */
    private resolveAdminURL(): string {
        return env.ADMIN_PANEL_URL;
    }

    /**
     * Admin credentials. The env module has already validated both are
     * present — this is just a local alias for readability.
     */
    private getCredentials(): { username: string; password: string } {
        return { username: env.USER_NAME, password: env.PASSWORD };
    }

    /**
     * Waits for login form to be ready for interaction
     */
    private async waitForLoginForm(): Promise<void> {
        try {
            await this.loginForm.waitFor({ 
                state: 'visible', 
                timeout: this.isCI ? 30000 : 15000 
            });
            
            // Ensure form inputs are ready
            await this.usernameInput.waitFor({ state: 'visible' });
            await this.passwordInput.waitFor({ state: 'visible' });
            await this.loginButton.waitFor({ state: 'visible' });

        } catch (error) {
            throw new Error(`Login form not found or not ready: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Captures error context for debugging failed logins
     */
    private async captureLoginErrorContext(): Promise<void> {
        try {
            const currentUrl = this.page.url();
            const errorText = await this.errorMessage.textContent().catch(() => 'No error message');
            const formVisible = await this.loginForm.isVisible().catch(() => false);

            console.error('🔍 Login Error Context:');
            console.error(`  Current URL: ${currentUrl}`);
            console.error(`  Error Message: ${errorText}`);
            console.error(`  Login Form Visible: ${formVisible}`);
            
            // Take screenshot for debugging (if not in CI to avoid clutter)
            if (!this.isCI) {
                await this.page.screenshot({ 
                    path: `test-results/login-error-${Date.now()}.png`,
                    fullPage: true 
                });
            }

        } catch (error) {
            console.warn('⚠️ Failed to capture login error context');
        }
    }
}