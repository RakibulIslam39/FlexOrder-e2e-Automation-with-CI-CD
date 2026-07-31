import { chromium, FullConfig } from '@playwright/test';
import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'fs';
import { join } from 'path';
import env, { isCI, hasGoogleSheets, hasServiceAccount } from '../src/config/environment';

/**
 * FlexOrder E2E Tests Global Setup
 *
 * This module handles the pre-test setup for both CI and local environments
 * following industry best practices for environment validation and initialization.
 *
 * Credential source:
 *   Local → `.env` (already loaded and validated by `src/config/environment.ts`)
 *   CI    → GitHub Secrets (injected by `.github/workflows/ci-workflow.yml`)
 */

/**
 * CI Environment Validator
 * Validates that all required CI environment variables are properly set
 */
class CIEnvironmentValidator {
  private static readonly REQUIRED_CI_VARS = [
    'SITE_URL',                    // Fresh WordPress site URL
    'ADMIN_PANEL_URL',             // WordPress admin URL  
    'USER_NAME',                   // Admin username
    'PASSWORD',                    // Admin password
    'WOOCOMMERCE_CONSUMER_KEY',    // API consumer key
    'WOOCOMMERCE_CONSUMER_SECRET'  // API consumer secret
  ];

  private static readonly OPTIONAL_CI_VARS = [
    'GOOGLE_SHEET_URL',            // Google Sheets integration
    'SHEET_NAME',                  // Sheet name for tests
    'SERVICE_ACCOUNT_UPLOAD_FILE', // Service account file
    'FLEXORDER_PRO_LICENSE_KEY'    // Pro plugin license
  ];

  /**
   * Validates all required CI environment variables
   */
  static validate(): void {
    console.log('🔍 Validating CI Environment Variables...');

    const missingVars = this.REQUIRED_CI_VARS.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      const errorMessage = [
        '❌ Missing required CI environment variables:',
        ...missingVars.map(varName => `  - ${varName}`),
        '',
        '🔧 Troubleshooting:',
        '  - Ensure setup-ci-environment.ts completed successfully',
        '  - Check GitHub Secrets configuration',
        '  - Verify CI workflow environment variable injection'
      ].join('\n');
      
      console.error(errorMessage);
      throw new Error(`Missing CI environment variables: ${missingVars.join(', ')}`);
    }
    
    console.log('✅ All required CI environment variables are set');
    this.logEnvironmentStatus();
  }

  /**
   * Logs environment status without exposing sensitive information
   */
  private static logEnvironmentStatus(): void {
    console.log('📊 CI Environment Status:');
    console.log(`  🌐 Site URL: ${env.SITE_URL}`);
    console.log(`  🔑 Admin Panel: ${env.ADMIN_PANEL_URL}`);
    console.log(`  👤 Username: ${env.USER_NAME}`);
    console.log(`  🔐 WooCommerce API: ${this.hasWooCommerceAPI() ? 'Configured' : 'Missing'}`);
    console.log(`  📊 Google Sheets: ${hasGoogleSheets() ? 'Configured' : 'Not configured'}`);
    console.log(`  🏗️ Service Account: ${hasServiceAccount() ? 'Available' : 'Not available'}`);
    console.log(`  🔧 Pro License: ${this.hasProLicense() ? 'Available' : 'Not available'}`);
  }

  private static hasWooCommerceAPI(): boolean {
    return !!(env.WOOCOMMERCE_CONSUMER_KEY && env.WOOCOMMERCE_CONSUMER_SECRET);
  }

  private static hasProLicense(): boolean {
    return !!process.env.FLEXORDER_PRO_LICENSE_KEY;
  }
}

/**
 * Test Infrastructure Manager
 * Handles file system setup and validation for test execution
 */
class TestInfrastructureManager {
  private static readonly REQUIRED_DIRECTORIES = [
    'test-results',
    'playwright-report', 
    'flaky-tests',
    'tests/fixtures/.auth',
    'tests/utilities'
  ];

  /**
   * Creates all required directories for test execution
   */
  static createDirectories(): void {
    console.log('📁 Setting up test directories...');

    for (const dir of this.REQUIRED_DIRECTORIES) {
      const dirPath = join(process.cwd(), dir);
      if (!existsSync(dirPath)) {
        mkdirSync(dirPath, { recursive: true });
        console.log(`  ✅ Created: ${dir}`);
      }
    }
  }

  /**
   * Validates API keys file exists and is readable
   */
  static validateAPIKeys(): void {
    const apiKeysPath = join(process.cwd(), 'tests/fixtures/api-keys.json');
    
    if (existsSync(apiKeysPath)) {
      try {
        const apiKeys = JSON.parse(readFileSync(apiKeysPath, 'utf8'));
        const hasKeys = !!(apiKeys.consumer_key && apiKeys.consumer_secret);
        console.log(`  🔑 API keys file: ${hasKeys ? 'Valid' : 'Invalid format'}`);
      } catch (error) {
        console.warn(`  ⚠️ API keys file: Malformed JSON`);
      }
    } else {
      console.log('  ⚠️ API keys file: Not found (using environment variables)');
    }
  }

  /**
   * Validates service account file for Google Sheets integration
   */
  static validateServiceAccount(): void {
    const serviceAccountPath = env.SERVICE_ACCOUNT_UPLOAD_FILE;

    if (serviceAccountPath) {
      if (existsSync(serviceAccountPath)) {
        try {
          JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
          console.log('  ✅ Service account: Valid JSON file');
        } catch {
          console.warn('  ⚠️ Service account: Invalid JSON format');
        }
      } else {
        console.warn(`  ⚠️ Service account: File not found at ${serviceAccountPath}`);
      }
    } else {
      console.log('  ℹ️ Service account: Not configured (Google Sheets tests may be skipped)');
    }
  }

  /**
   * Creates placeholder auth state for local development.
   * In CI the auth-setup project always produces a fresh storage state, so
   * no placeholder is needed.
   */
  static createAuthState(): void {
    if (isCI) return;

    const authStatePath = join(process.cwd(), 'tests/fixtures/.auth/user.json');
    if (!existsSync(authStatePath)) {
      const authState = {
        cookies: [],
        origins: []
      };
      writeFileSync(authStatePath, JSON.stringify(authState, null, 2));
      console.log('  📄 Created placeholder auth state for local development');
    }
  }
}

async function globalSetup(_config: FullConfig) {
  console.log('🚀 Starting Global Setup for FlexOrder E2E Tests');
  console.log(`Environment: ${isCI ? 'CI (GitHub Actions)' : 'Local Development'}`);

  if (isCI) {
    CIEnvironmentValidator.validate();
  }

  TestInfrastructureManager.createDirectories();
  TestInfrastructureManager.validateAPIKeys();
  TestInfrastructureManager.validateServiceAccount();
  TestInfrastructureManager.createAuthState();

  await validateWordPressSite();

  console.log('✅ Global Setup completed successfully');
  console.log(`🎯 Ready to run tests in ${isCI ? 'CI' : 'local'} environment`);
}

/**
 * WordPress Site Validator
 * Validates that the WordPress site is accessible and ready for testing
 */
async function validateWordPressSite(): Promise<void> {
  console.log('🔍 Validating WordPress Site Accessibility...');

  try {
    const browser = await chromium.launch({
      headless: true,
      args: isCI ? [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ] : []
    });

    const page = await browser.newPage();

    const siteUrl = env.SITE_URL;
    console.log(`  🌐 Checking site accessibility at: ${siteUrl}`);
    
    // `networkidle` is unreliable on WP admin (heartbeat, WP-Cron keep the
    // network busy). A `load` wait is sufficient for accessibility probing
    // and avoids needless retries.
    await page.goto(siteUrl, {
      waitUntil: 'load',
      timeout: isCI ? 60000 : 30000,
    });
    
    // Verify WordPress installation
    const wordPressDetection = await detectWordPress(page);
    if (wordPressDetection.isWordPress) {
      console.log(`  ✅ WordPress detected: ${wordPressDetection.reason}`);
    } else {
      console.warn('  ⚠️ WordPress not clearly detected, but site is accessible');
    }
    
    // Test admin authentication in CI environment
    if (isCI) {
      await testAdminAuthentication(page);
    }
    
    await browser.close();
    console.log('  ✅ Site validation completed successfully');
    
  } catch (error) {
    const errorMessage = `Site accessibility validation failed: ${error instanceof Error ? error.message : String(error)}`;
    console.error(`  ❌ ${errorMessage}`);
    
    if (isCI) {
      throw new Error(`CI environment site validation failed: ${errorMessage}`);
    } else {
      console.warn('  ⚠️ Site validation failed, but continuing in local environment');
    }
  }
}

/**
 * Detects if the current page is a WordPress site
 */
async function detectWordPress(page: any): Promise<{ isWordPress: boolean; reason: string }> {
  const detectionMethods = [
    {
      check: () => document.body.classList.contains('wp-admin'),
      reason: 'wp-admin body class found'
    },
    {
      check: () => document.body.classList.contains('login'),
      reason: 'login body class found'
    },
    {
      check: () => document.querySelector('meta[name="generator"]')?.getAttribute('content')?.includes('WordPress'),
      reason: 'WordPress generator meta tag found'
    },
    {
      check: () => document.title.includes('WordPress'),
      reason: 'WordPress in page title'
    },
    {
      check: () => document.querySelector('link[href*="wp-"]') !== null,
      reason: 'WordPress assets detected'
    },
    {
      check: () => document.querySelector('#wp-admin-bar-root') !== null,
      reason: 'WordPress admin bar found'
    }
  ];

  for (const method of detectionMethods) {
    try {
      const isDetected = await page.evaluate(method.check);
      if (isDetected) {
        return { isWordPress: true, reason: method.reason };
      }
    } catch (error) {
      // Continue to next detection method
    }
  }

  return { isWordPress: false, reason: 'No WordPress indicators found' };
}

/**
 * Tests admin authentication in CI environment
 */
async function testAdminAuthentication(page: any): Promise<void> {
  // env.ADMIN_PANEL_URL / USER_NAME / PASSWORD are validated at module load;
  // this guard is belt-and-braces for partial configurations.
  if (!env.ADMIN_PANEL_URL || !env.USER_NAME || !env.PASSWORD) {
    console.log('  ℹ️ Admin credentials not available, skipping authentication test');
    return;
  }

  console.log('  🔐 Testing admin authentication...');

  try {
    await page.goto(env.ADMIN_PANEL_URL, { timeout: 30000 });

    const loginFormVisible = await page.locator('#loginform, .login-form, #user_login').isVisible().catch(() => false);

    if (loginFormVisible) {
      await page.locator('#user_login').fill(env.USER_NAME);
      await page.locator('#user_pass').fill(env.PASSWORD);
      await page.locator('#wp-submit').click();

      await page.waitForURL('**/wp-admin/**', { timeout: 15000 });
      console.log('  ✅ Admin authentication successful');
    } else {
      // Check if already in admin area
      const isInAdmin = await page.url().includes('/wp-admin/');
      if (isInAdmin) {
        console.log('  ✅ Already authenticated in WordPress admin');
      } else {
        console.warn('  ⚠️ Unable to detect login form or admin area');
      }
    }
  } catch (error) {
    console.warn(`  ⚠️ Admin authentication test failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export default globalSetup; 