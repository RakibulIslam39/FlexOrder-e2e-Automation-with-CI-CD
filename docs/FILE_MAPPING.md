# File Mapping

## CI/CD
- `.github/workflows/ci-workflow.yml` → Main GitHub Actions pipeline. Triggers: push to `main`/`qa`, `workflow_dispatch`, `repository_dispatch`.
- `.github/flexorder_workflow/flexorder.yml` → Dispatch template to trigger E2E from FlexOrder repository pushes.
- `.github/flexorder_workflow/flexorder-ultimate.yml` → Dispatch template to trigger E2E from Ultimate repository pushes.

## Config
- `package.json` → NPM scripts, dependencies, engine versions, and validation commands.
- `playwright.config.ts` → Playwright projects, reporters, timeouts, browser settings, and hooks.
- `tsconfig.json` → TypeScript compiler rules for the automation codebase.
- `.env.example` → Sample environment values for WordPress, API, Sheets, and license setup.
- `.eslintrc.json` → JSON-based linting rules for the project.
- `.eslintrc.js` → JavaScript-based linting configuration variant.
- `.prettierrc` → Formatting rules for consistent code style.
- `docker-compose.fresh-wordpress.yml` → Local WordPress, MySQL, phpMyAdmin, and MailHog Docker stack.
- `mysql-config/custom.cnf` → Custom MySQL settings for the test database container.
- `uploads.ini` → PHP upload size limits for the WordPress container.
- `.vscode/extensions.json` → Recommended editor extensions for contributors.
- `src/config/environment.ts` → Central environment variable parsing and runtime settings.
- `src/config/flaky-tests-reporter.ts` → Custom reporter for tracking flaky test behavior.

## Page Objects
- `src/pages/login.ts` → Login actions for WordPress admin authentication.
- `src/pages/flexorder-setup.ts` → FlexOrder setup wizard interactions and validations.
- `src/pages/createNewOrder.ts` → UI steps for creating a new order.
- `src/pages/update-order-status.ts` → UI steps for changing WooCommerce order status.
- `src/pages/ultimateSettings.ts` → UI automation for FlexOrder Ultimate settings.

## Tests
- `tests/specs/a-flexorder-setup.spec.ts` → Verifies initial FlexOrder setup flow before feature tests.
- `tests/specs/a-activateProVersion.spec.ts` → Checks Pro license activation behavior.
- `tests/specs/a-woocommerceAPI.spec.ts` → Validates WooCommerce API connectivity and responses.
- `tests/specs/createNewOrder.spec.ts` → Tests creating orders through the application UI.
- `tests/specs/update-order-status.spec.ts` → Tests updating existing order statuses.
- `tests/specs/ultimateSettings.spec.ts` → Tests settings changes in Ultimate features.
- `tests/global-setup.ts` → Prepares folders, validates environment, and checks site availability.
- `tests/global-teardown.ts` → Runs cleanup logic after all tests finish.

## Helpers/Utils
- `src/utils/googleSheetHelper.ts` → Helper methods for Google Sheets test operations.
- `src/services/google-sheet-api.ts` → Google Sheets API service wrapper used by tests.
- `src/interfaces/order.ts` → Shared TypeScript types for order data.
- `src/interfaces/google-sheets.ts` → Shared TypeScript types for Google Sheets structures.

## Scripts
- `scripts/setup-ci-environment.ts` → Creates products, orders, permalinks, and WooCommerce API keys. Who runs this? [CI only]
- `scripts/verify-dispatch-config.ts` → Checks repository dispatch workflow consistency. Who runs this? [Developer]
- `scripts/setup-prerequisites.ps1` → Installs required tools for Windows runner setup. Who runs this? [DevOps once]
- `scripts/register-runner.ps1` → Registers a self-hosted GitHub Actions runner. Who runs this? [DevOps once]
- `scripts/manage-service.ps1` → Manages Windows services for runner operations. Who runs this? [DevOps once]
- `scripts/maintenance.ps1` → Runs maintenance tasks for the runner machine. Who runs this? [DevOps once]
- `scripts/performance-monitor.ps1` → Monitors resource usage on the runner. Who runs this? [DevOps once]
- `scripts/quick-setup.ps1` → Shortcut script for faster Windows setup. Who runs this? [Developer]

## Fixtures
- `tests/fixtures/upload_key.json` → Service account JSON fixture for Google Sheets tests.
- `tests/data/productdata.json` → Static product data used in test scenarios.

## Data Flow
- Setup starts with `.env`, `docker-compose.fresh-wordpress.yml`, and `playwright.config.ts`.
- `scripts/setup-ci-environment.ts` installs data, configures permalinks, and generates API keys.
- `tests/global-setup.ts` validates folders, credentials, and WordPress availability.
- Spec files run through page objects and helpers using Playwright.
- Results go to `test-results/`, `playwright-report/`, and GitHub Actions artifacts.
