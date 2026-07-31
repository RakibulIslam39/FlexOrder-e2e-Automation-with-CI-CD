import { defineConfig, devices } from '@playwright/test';
// Importing the centralised env module also loads `.env` for local runs and
// performs fail-fast validation before Playwright discovers any tests.
import env, { isCI } from './src/config/environment';

/**
 * FlexOrder E2E Test Configuration
 *
 * Projects are wired as a pipeline:
 *   auth-setup      → logs in once, writes storage state
 *   plugin-setup    → runs FlexOrder onboarding (depends on auth-setup)
 *   e2e             → full suite (depends on plugin-setup, reuses storage state)
 *
 * This replaces the legacy `a-` filename-prefix hack that relied on alphabetical
 * test discovery to enforce order.
 *
 * Credentials:
 *   Local  → `.env` file  (loaded by `src/config/environment.ts`)
 *   CI     → GitHub Secrets injected by `.github/workflows/ci-workflow.yml`
 */

const STORAGE_STATE = 'tests/fixtures/.auth/user.json';

function resolveBaseURL(): string {
    // env.SITE_URL is already validated and normalised inside environment.ts.
    // Allow PLAYWRIGHT_BASE_URL to override (rare, e.g. parallel CI shards).
    const baseURL = process.env.PLAYWRIGHT_BASE_URL || env.SITE_URL;

    if (isCI) {
        console.log(`🎯 Using base URL for CI: ${baseURL}`);
    }

    return baseURL;
}

export default defineConfig({
    testDir: './tests',
    outputDir: './test-results',

    globalSetup: './tests/global-setup.ts',
    globalTeardown: './tests/global-teardown.ts',

    globalTimeout: isCI ? 60 * 60 * 1000 : 20 * 60 * 1000,
    timeout: parseInt(process.env.TIMEOUT_SECONDS || (isCI ? '120' : '90')) * 1000,

    maxFailures: isCI ? 10 : 5,

    expect: {
        timeout: isCI ? 20 * 1000 : 15 * 1000,
        toHaveScreenshot: {
            maxDiffPixelRatio: 0.2,
            maxDiffPixels: 500,
            threshold: 0.5,
        },
        toMatchSnapshot: {
            maxDiffPixelRatio: 0.1,
            threshold: 0.3,
        },
    },

    preserveOutput: 'always',
    // Sequential within a project preserves DB/sheet determinism, but projects
    // themselves still chain via `dependencies` so auth/setup run first.
    fullyParallel: false,
    forbidOnly: !!isCI,
    repeatEach: 1,
    retries: parseInt(process.env.MAX_RETRIES || (isCI ? '2' : '1')),
    workers: parseInt(process.env.PARALLEL_WORKERS || '1'),
    reportSlowTests: { max: 3, threshold: 25 },

    reporter: isCI
        ? [
              ['github'],
              ['html', { open: 'never', outputFolder: 'playwright-report' }],
              ['junit', { outputFile: 'test-results/e2e-junit-results.xml' }],
              ['list', { printSteps: true }],
              ['json', { outputFile: 'test-results/results.json' }],
              ['./src/config/flaky-tests-reporter.ts'],
          ]
        : [
              ['html', { open: 'on-failure', outputFolder: 'playwright-report' }],
              ['list', { printSteps: true }],
              ['json', { outputFile: 'test-results/results.json' }],
              ['./src/config/flaky-tests-reporter.ts'],
          ],

    use: {
        ...devices['Desktop Chrome'],

        acceptDownloads: true,

        actionTimeout: isCI ? 30 * 1000 : 25 * 1000,
        navigationTimeout: isCI ? 60 * 1000 : 30 * 1000,

        baseURL: resolveBaseURL(),

        bypassCSP: true,
        ignoreHTTPSErrors: true,

        headless: isCI ? true : !process.env.NON_HEADLESS,
        viewport: { width: 1420, height: 900 },

        trace: isCI ? 'retain-on-failure' : 'on-first-retry',
        screenshot: {
            mode: 'only-on-failure',
            fullPage: true,
        },
        video: isCI ? 'retain-on-failure' : 'on-first-retry',

        launchOptions: {
            slowMo: process.env.SLOWMO ? Number(process.env.SLOWMO) * 1000 : 0,
            args: isCI
                ? [
                      '--no-sandbox',
                      '--disable-setuid-sandbox',
                      '--disable-dev-shm-usage',
                      '--disable-features=VizDisplayCompositor',
                      '--no-first-run',
                      '--disable-default-apps',
                  ]
                : [],
        },

        extraHTTPHeaders: {
            Accept: '*/*',
            'User-Agent': `FlexOrder-E2E-Tests/1.0 (${isCI ? 'CI' : 'Local'})`,
        },

        permissions: ['clipboard-read', 'clipboard-write'],
    },

    projects: [
        {
            name: 'auth-setup',
            testMatch: /auth\.setup\.ts$/,
        },
        {
            name: 'plugin-setup',
            testMatch: /specs\/flexorder-setup\.spec\.ts$/,
            dependencies: ['auth-setup'],
            use: { storageState: STORAGE_STATE },
        },
        {
            name: 'woocommerce-api',
            testMatch: /specs\/woocommerceAPI\.spec\.ts$/,
            // WC API tests don't need the browser/storage state — only the
            // REST credentials — so they can start as soon as auth is ready.
            dependencies: ['auth-setup'],
            use: { storageState: STORAGE_STATE },
        },
        {
            name: 'e2e',
            testMatch: /specs\/(ultimateSettings|update-order-status)\.spec\.ts$/,
            dependencies: ['plugin-setup'],
            use: { storageState: STORAGE_STATE },
        },
    ],
});
