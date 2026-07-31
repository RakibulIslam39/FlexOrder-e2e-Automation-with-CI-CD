# FlexOrder E2E Automation Testing

> Comprehensive end-to-end testing suite for FlexOrder WordPress plugin with WooCommerce and Google Sheets integration.

[![CI/CD Pipeline](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-blue)](https://github.com/wppool/flexorder-e2e-automation)
[![Playwright](https://img.shields.io/badge/Playwright-v1.56-green)](https://playwright.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Environment Configuration](#environment-configuration)
- [Running Tests](#running-tests)
- [CI/CD Pipeline](#cicd-pipeline)
- [Repository Dispatch Setup](#repository-dispatch-setup)
- [Test Architecture](#test-architecture)
- [Beginner-Friendly Execution Guide (Bangla)](docs/BEGINNER_AUTOMATION_EXECUTION_GUIDE_BN.md)
- [Handover Video Script (Bangla)](docs/HANDOVER_VIDEO_SCRIPT_BN.md)
- [Repository Analysis & Doc Improvements (Bangla)](docs/REPOSITORY_ANALYSIS_AND_DOC_IMPROVEMENTS_BN.md)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

---

## 🎯 Overview

This is a **CI/CD workflow repository** that provides automated end-to-end testing for the **FlexOrder** WordPress plugin ecosystem. Tests are automatically triggered when code is pushed to plugin repositories, ensuring quality across:

- WooCommerce order management
- Google Sheets synchronization
- WordPress admin functionality
- Pro/Ultimate features

The test suite runs on self-hosted GitHub Actions runners with Docker-based WordPress installations, providing a fresh testing environment for each run.

**Key Integration**: This CI repository listens for `repository_dispatch` events from the `flexorder` and `flexorder-ultimate` plugin repositories, automatically running comprehensive E2E tests whenever changes are pushed to those repositories.

---

## ✨ Features

- ✅ **Automated WordPress Setup** - Docker-based fresh WordPress environment
- ✅ **WooCommerce Integration** - API testing and order management
- ✅ **Google Sheets Sync** - Bi-directional order synchronization tests
- ✅ **Repository Dispatch** - Automatic test triggering from plugin repositories
- ✅ **Page Object Model** - Maintainable and reusable test code
- ✅ **CI/CD Ready** - GitHub Actions with self-hosted runners
- ✅ **Flaky Test Detection** - Automatic identification of unstable tests
- ✅ **Comprehensive Reporting** - HTML, JUnit, and JSON test reports
- ✅ **Email Notifications** - Success/failure reports via SMTP
- ✅ **TypeScript** - Type-safe test development

---

## 📦 Prerequisites

### Required Software

- **Node.js**: >= 18.0.0
- **npm**: >= 8.0.0
- **Docker**: >= 20.10.0 (for local WordPress environment)
- **Docker Compose**: >= 2.0.0

### Optional for Google Sheets Tests

- Google Cloud Service Account with Sheets API access
- Google Sheets API enabled in your GCP project

---

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/wppool/flexorder-e2e-automation.git
cd flexorder-e2e-automation
```

### 2. Install Dependencies

```bash
npm ci
```

### 3. Install Playwright Browsers

```bash
npx playwright install --with-deps chromium
```

### 4. Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your configuration
nano .env
```

**Minimum required variables:**

```bash
SITE_URL=http://localhost:8080
USER_NAME=admin
PASSWORD=admin123
FLEXORDER_PRO_LICENSE_KEY=your-license-key-here
```

### 5. Start WordPress Environment

```bash
# Start WordPress, MySQL, and supporting services
docker compose -f docker-compose.fresh-wordpress.yml up -d

# Wait for services to be ready (approximately 2 minutes)
docker compose -f docker-compose.fresh-wordpress.yml ps
```

### 6. Provision Test Environment

```bash
# This script will:
# - Install WordPress
# - Install WooCommerce
# - Generate API keys
# - Create test products and orders
npm run setup:ci
```

### 7. Run Tests

```bash
# Run all tests
npm test

# Run in headed mode (see browser)
npm run test:headed

# Run in UI mode (interactive)
npm run test:ui
```

### 8. Verify Repository Dispatch Setup (Optional)

If setting up repository dispatch integration:

```bash
# Verify configuration is correct
npm run verify:dispatch
```

---

## 📁 Project Structure

```
flexorder-ci-workflow/
├── .github/
│   ├── flexorder_workflow/          # Template workflows for plugin repos
│   │   ├── flexorder.yml            # Trigger workflow for flexorder repo
│   │   └── flexorder-ultimate.yml   # Trigger workflow for flexorder-ultimate repo
│   └── workflows/
│       └── ci-workflow.yml          # Main CI/CD pipeline
├── src/
│   ├── config/
│   │   ├── environment.ts           # Environment configuration
│   │   └── flaky-tests-reporter.ts  # Custom Playwright reporter
│   ├── interfaces/
│   │   ├── order.ts                 # TypeScript interfaces
│   │   └── google-sheets.ts
│   ├── pages/                       # Page Object Models (UI-only)
│   │   ├── login.ts
│   │   ├── flexorder-setup.ts
│   │   └── ultimateSettings.ts
│   ├── services/                    # Non-UI integrations
│   │   ├── google-sheet-api.ts      # Google Sheets integration
│   │   └── order-status-updater.ts  # Sheets ↔ WooCommerce sync service
│   └── utils/
│       └── googleSheetHelper.ts     # Test helpers
├── tests/
│   ├── auth.setup.ts                # Logs in once, saves storage state
│   ├── specs/                       # Test specifications
│   │   ├── flexorder-setup.spec.ts  # Plugin onboarding (setup project)
│   │   ├── woocommerceAPI.spec.ts   # REST API smoke tests
│   │   ├── ultimateSettings.spec.ts # E2E UI tests
│   │   └── update-order-status.spec.ts
│   ├── fixtures/                    # Test fixtures
│   │   ├── test-fixtures.ts         # Shared POM/service fixtures
│   │   ├── .auth/user.json          # Persisted login state (gitignored)
│   │   ├── api-keys.json            # Auto-generated WooCommerce API keys
│   │   └── upload_key.json          # Google service account key
│   ├── data/
│   │   └── productdata.json         # Test product data (no credentials)
│   ├── global-setup.ts              # Global test setup
│   └── global-teardown.ts           # Global test teardown
├── scripts/
│   ├── setup-ci-environment.ts      # Environment provisioning script
│   └── verify-dispatch-config.ts    # Repository dispatch verification
├── docs/
│   ├── ci-workflow-diagram.md       # CI workflow documentation
│   ├── self-hosted-runner-setup.md  # Runner setup guide
│   ├── BEGINNER_AUTOMATION_EXECUTION_GUIDE_BN.md # Beginner-friendly run guide (Bangla)
│   ├── REPOSITORY_ANALYSIS_AND_DOC_IMPROVEMENTS_BN.md # Analysis + documentation gap report (Bangla)
│   └── WOOCOMMERCE_API_CREDENTIALS_GUIDE.md
├── docker-compose.fresh-wordpress.yml
├── playwright.config.ts             # Playwright configuration
├── package.json
├── tsconfig.json
└── README.md
```

---

## ⚙️ Environment Configuration

### Environment Variables

Create a `.env` file based on `.env.example`:

| Variable                      | Required | Description                      | Default                            |
| ----------------------------- | -------- | -------------------------------- | ---------------------------------- |
| `SITE_URL`                    | ✅       | WordPress site URL               | `http://localhost:8080`            |
| `ADMIN_PANEL_URL`             | ✅       | WordPress admin URL              | `{SITE_URL}/wp-admin/`             |
| `USER_NAME`                   | ✅       | WordPress admin username         | `admin`                            |
| `PASSWORD`                    | ✅       | WordPress admin password         | `admin123`                         |
| `WOOCOMMERCE_CONSUMER_KEY`    | ⚠️       | WooCommerce API consumer key     | Auto-generated                     |
| `WOOCOMMERCE_CONSUMER_SECRET` | ⚠️       | WooCommerce API consumer secret  | Auto-generated                     |
| `GOOGLE_SHEET_URL`            | ❌       | Google Sheets URL for sync tests | -                                  |
| `SHEET_NAME`                  | ❌       | Sheet name/tab                   | `Orders`                           |
| `SERVICE_ACCOUNT_UPLOAD_FILE` | ❌       | Path to service account JSON     | `./tests/fixtures/upload_key.json` |
| `FLEXORDER_PRO_LICENSE_KEY`   | ✅       | FlexOrder Pro license key        | -                                  |

⚠️ = Auto-generated by `npm run setup:ci`  
❌ = Optional (required only for Google Sheets tests)

### Google Sheets Setup (Optional)

If you want to test Google Sheets integration:

1. **Create a Google Cloud Project**
2. **Enable Google Sheets API**
3. **Create a Service Account**
4. **Download Service Account JSON key**
5. **Place the JSON file** at `tests/fixtures/upload_key.json`
6. **Share your Google Sheet** with the service account email (found in the JSON)
7. **Set environment variables:**
   ```bash
   GOOGLE_SHEET_URL=https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit
   SHEET_NAME=Orders
   SERVICE_ACCOUNT_UPLOAD_FILE=./tests/fixtures/upload_key.json
   ```

---

## 🧪 Running Tests

### Local Development

```bash
# Run all tests
npm test

# Run specific test file
npx playwright test tests/specs/createNewOrder.spec.ts

# Run tests in headed mode (see browser)
npm run test:headed

# Run tests in UI mode (interactive debugging)
npm run test:ui

# Run tests in debug mode
npm run test:debug

# Run only tests matching a pattern
npx playwright test --grep "activate FlexOrder"
```

### View Test Reports

```bash
# Open HTML report
npm run test:report

# Reports are automatically opened on failure in local development
```

### Available NPM Scripts

| Command                   | Description                                    |
| ------------------------- | ---------------------------------------------- |
| `npm test`                | Run all E2E tests                              |
| `npm run test:headed`     | Run tests in headed mode (see browser)         |
| `npm run test:ui`         | Run tests in UI mode (interactive debugging)   |
| `npm run test:debug`      | Run tests in debug mode                        |
| `npm run test:report`     | Open HTML test report                          |
| `npm run test:ci:full`    | Run full test suite (CI mode)                  |
| `npm run setup:ci`        | Provision test environment (WordPress + data)  |
| `npm run verify:dispatch` | Verify repository dispatch configuration       |
| `npm run lint`            | Run ESLint                                     |
| `npm run format`          | Format code with Prettier                      |
| `npm run type-check`      | Run TypeScript type checking                   |
| `npm run validate`        | Run all quality checks (lint + format + types) |

### CI Environment

The CI pipeline automatically runs tests when:

- **Plugin Updates**: Code pushed to `flexorder` or `flexorder-ultimate` repositories (via `repository_dispatch`)
- **CI Updates**: Code pushed to `main` or `qa` branches of this repository
- **Manual Trigger**: Via GitHub Actions UI (`workflow_dispatch`)
- **Scheduled**: Daily at 2 AM UTC (optional)

**Most Common**: Tests run automatically via `repository_dispatch` when developers push to plugin repositories.

---

## 🔄 CI/CD Pipeline

### Workflow Triggers

The CI pipeline automatically runs in these scenarios:

- **Push to CI Repository**: `main`, `qa` branches
- **Repository Dispatch**: Triggered from plugin repositories when code is pushed to `flexorder` or `flexorder-ultimate`
- **Manual Trigger**: `workflow_dispatch` via GitHub Actions UI
- **Scheduled**: Daily at 2 AM UTC (optional, commented out by default)

### How Repository Dispatch Works

When developers push code to the plugin repositories, tests run automatically:

```
Developer pushes to flexorder/main
         ↓
flexorder/.github/workflows/trigger-e2e.yml runs
         ↓
Sends repository_dispatch event to flexorder-ci-workflow
         ↓
flexorder-ci-workflow/.github/workflows/ci-workflow.yml runs
         ↓
Tests the exact commit that was pushed
```

**Benefits:**

- ✅ Automatic E2E testing on every plugin commit
- ✅ Tests the exact version that was pushed
- ✅ Separate plugin and CI repositories
- ✅ No manual intervention needed

### Pipeline Stages

1. **Setup** - Checkout code, setup Node.js, install dependencies
2. **Docker Environment** - Start WordPress, MySQL, phpMyAdmin, MailHog
3. **WordPress Installation** - Install WordPress core and WooCommerce
4. **Plugin Deployment** - Download and install FlexOrder plugins from GitHub (using the pushed commit SHA)
5. **Test Data Provisioning** - Create products, orders, and API keys
6. **Test Execution** - Run full E2E test suite
7. **Reporting** - Generate and upload test reports, send email notifications
8. **Cleanup** - Clean up Docker resources

### GitHub Secrets Required

#### In CI Repository (flexorder-ci-workflow)

| Secret                      | Description                                    | Required |
| --------------------------- | ---------------------------------------------- | -------- |
| `APP_ID`                    | GitHub App ID for plugin access                | ✅       |
| `APP_PRIVATE_KEY`           | GitHub App private key (PEM format)            | ✅       |
| `GOOGLE_SHEET_URL`          | Google Sheets URL (if testing Sheets)          | ❌       |
| `SHEET_NAME`                | Sheet name/tab (if testing Sheets)             | ❌       |
| `FLEXORDER_PRO_LICENSE_KEY` | FlexOrder Pro license key                      | ✅       |
| `SMTP_SERVER`               | SMTP server for email notifications (optional) | ❌       |
| `SMTP_USERNAME`             | SMTP username (optional)                       | ❌       |
| `SMTP_PASSWORD`             | SMTP password (optional)                       | ❌       |
| `EMAIL_TO`                  | Email recipient for test reports (optional)    | ❌       |

#### In Plugin Repositories (flexorder, flexorder-ultimate)

| Secret            | Description                         | Required |
| ----------------- | ----------------------------------- | -------- |
| `APP_ID`          | Same GitHub App ID as CI repository | ✅       |
| `APP_PRIVATE_KEY` | Same GitHub App private key         | ✅       |

### Self-Hosted Runner Setup

The CI pipeline runs on self-hosted Windows runners. See `docs/self-hosted-runner-setup.md` for detailed setup instructions.

---

## 🔗 Repository Dispatch Setup

### Overview

This project uses **GitHub's repository_dispatch** feature to automatically trigger E2E tests when code is pushed to plugin repositories (`flexorder` or `flexorder-ultimate`).

### Architecture

```
┌─────────────────────────────────────────┐
│  flexorder / flexorder-ultimate         │
│  Plugin Repositories                     │
└─────────────────────────────────────────┘
                 ↓
         Push to main/develop
                 ↓
    ┌────────────────────────────┐
    │  trigger-e2e.yml           │
    │  (in plugin repo)          │
    └────────────────────────────┘
                 ↓
      Generate GitHub App Token
                 ↓
    Send repository_dispatch event
                 ↓
┌─────────────────────────────────────────┐
│  flexorder-ci-workflow                  │
│  CI Repository                          │
└─────────────────────────────────────────┘
                 ↓
    ┌────────────────────────────┐
    │  ci-workflow.yml           │
    │  (in CI repo)              │
    └────────────────────────────┘
                 ↓
      Run E2E tests on pushed commit
```

### Setup Instructions

#### Step 1: Configure GitHub App Permissions

1. Go to your GitHub App settings (Organization → Settings → GitHub Apps)
2. Navigate to **Permissions & events** → **Repository permissions**
3. Set **Actions** permission to **Read and write**
4. Save changes and approve permission update

#### Step 2: Verify App Installation

Ensure your GitHub App is installed on all three repositories:

- `WPPOOL/flexorder`
- `WPPOOL/flexorder-ultimate`
- `WPPOOL/flexorder-ci-workflow`

#### Step 3: Add Secrets to Plugin Repositories

For **both** plugin repositories (`flexorder` and `flexorder-ultimate`):

1. Go to repository **Settings** → **Secrets and variables** → **Actions**
2. Add two secrets (use the same values as in `flexorder-ci-workflow`):
   - `APP_ID`: Your GitHub App ID
   - `APP_PRIVATE_KEY`: Your GitHub App private key (full PEM format)

#### Step 4: Deploy Trigger Workflows

**For flexorder repository:**

```bash
# Copy trigger workflow template
cp .github/flexorder_workflow/flexorder.yml \
   /path/to/flexorder/.github/workflows/trigger-e2e.yml

# Commit and push
cd /path/to/flexorder
git add .github/workflows/trigger-e2e.yml
git commit -m "Add E2E test trigger workflow"
git push origin main
```

**For flexorder-ultimate repository:**

```bash
# Copy trigger workflow template
cp .github/flexorder_workflow/flexorder-ultimate.yml \
   /path/to/flexorder-ultimate/.github/workflows/trigger-e2e.yml

# Commit and push
cd /path/to/flexorder-ultimate
git add .github/workflows/trigger-e2e.yml
git commit -m "Add E2E test trigger workflow"
git push origin main
```

#### Step 5: Verify Configuration

Run the verification script to ensure everything is configured correctly:

```bash
npm run verify:dispatch
```

Expected output:

```
✅ All checks passed! Configuration is ready for deployment.
✅ CI workflow configured with event types: flexorder, flexorder-ultimate
✅ GitHub App token generation step found
✅ GitHub App credentials: secrets.APP_ID + secrets.APP_PRIVATE_KEY
```

#### Step 6: Test the Setup

1. Make a test commit to `flexorder/main` or `flexorder/develop`
2. Check the workflow runs:
   - Plugin repo: https://github.com/WPPOOL/flexorder/actions
   - CI repo: https://github.com/WPPOOL/flexorder-ci-workflow/actions
3. Verify the CI workflow shows `repository_dispatch` trigger in its logs

### Trigger Workflow Details

The trigger workflows in plugin repositories:

- Listen for pushes to `main` and `develop` branches
- Generate a GitHub App token using `APP_ID` and `APP_PRIVATE_KEY`
- Send a `repository_dispatch` event to `flexorder-ci-workflow`
- Include metadata: repository name, branch, commit SHA, pusher, commit message

The CI workflow receives the event and:

- Detects it's a `repository_dispatch` trigger
- Extracts the plugin branch from the event payload
- Downloads the exact commit SHA that triggered the event
- Runs full E2E tests against that specific version

### Troubleshooting Repository Dispatch

**Issue: "Resource not accessible by integration"**

- GitHub App needs "Actions: Write" permission
- Go to App settings and update permissions
- Organization admin must approve the change

**Issue: "Bad credentials"**

- Verify `APP_ID` and `APP_PRIVATE_KEY` secrets are correct
- Ensure `APP_PRIVATE_KEY` includes the full PEM format:
  ```
  -----BEGIN RSA PRIVATE KEY-----
  [key content]
  -----END RSA PRIVATE KEY-----
  ```

**Issue: CI workflow not triggered**

- Check if GitHub App is installed on `flexorder-ci-workflow`
- Verify the `event-type` matches in both trigger and CI workflows
- Check GitHub Actions logs in both repositories

---

## 🏗️ Test Architecture

### Test Organization

Tests follow a **sequential execution pattern** with naming conventions:

- `a-*.spec.ts` - Setup and configuration tests (run first)
- Other `*.spec.ts` - Feature tests (run after setup)

**Execution Order:**

1. `a-flexorder-setup.spec.ts` - Initial plugin setup
2. `a-activateProVersion.spec.ts` - License activation
3. `a-woocommerceAPI.spec.ts` - API connectivity validation
4. All other tests - Feature-specific tests

### Page Object Model

Tests use the **Page Object Model** pattern for maintainability:

```typescript
// Example: Using LoginPage
import { LoginPage } from '../../src/pages/login';

test('my test', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.navigate();
  await loginPage.login();
  // ... rest of test
});
```

### Test Fixtures

Custom fixtures provide reusable test utilities:

```typescript
import { test, expect } from '../fixtures/orderFixtures';

test('create order', async ({ createOrderInstance }) => {
  const order = await createOrderInstance.createOrder(orderData);
  expect(order.id).toBeDefined();
});
```

---

## 🐛 Troubleshooting

### WordPress Not Accessible

```bash
# Check Docker services
docker compose -f docker-compose.fresh-wordpress.yml ps

# View WordPress logs
docker logs flexorder-wordpress

# Restart services
docker compose -f docker-compose.fresh-wordpress.yml restart
```

### API Keys Not Generated

```bash
# Manually run setup script
npm run setup:ci

# Check generated keys
cat tests/utilities/api-keys.json
```

### Tests Timing Out

- Increase timeouts in `playwright.config.ts`
- Check Docker resource allocation
- Ensure WordPress is fully loaded before running tests

### Google Sheets Tests Failing

- Verify service account has **Editor** access to the sheet
- Check `SERVICE_ACCOUNT_UPLOAD_FILE` path is correct
- Ensure Google Sheets API is enabled in GCP

### Flaky Tests

Flaky tests are automatically detected and saved to `flaky-tests/` directory. Review these files to identify unstable tests.

### Repository Dispatch Not Triggering CI

**Symptoms:** Push to plugin repo doesn't trigger CI workflow

**Checks:**

1. Verify trigger workflow exists in plugin repo at `.github/workflows/trigger-e2e.yml`
2. Check GitHub Actions logs in plugin repository for workflow execution
3. Ensure `APP_ID` and `APP_PRIVATE_KEY` secrets are set in plugin repository
4. Verify GitHub App has "Actions: Write" permission
5. Confirm GitHub App is installed on `flexorder-ci-workflow` repository

**Debug:**

```bash
# Check CI workflow logs
# Look for "repository_dispatch" event in "Display Workflow Information" step

# Verify configuration
npm run verify:dispatch
```

### IDE Showing Errors in ci-workflow.yml

If your IDE shows "Unable to resolve action" errors for GitHub Actions (like `actions/checkout@v4`), these are **false positives**. The actions are valid and the workflow will run correctly.

**Solutions:**

1. **Install recommended VS Code extensions:**
   - Open VS Code Command Palette (Cmd/Ctrl + Shift + P)
   - Type: "Extensions: Show Recommended Extensions"
   - Install "GitHub Actions" extension

2. **Reload VS Code:** The `.vscode/settings.json` file configures YAML schema validation

3. **If errors persist:** These are cosmetic only and can be safely ignored. Your CI/CD will work perfectly.

---

## 🤝 Contributing

### Development Workflow

1. **Create a feature branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Write tests** following existing patterns

3. **Run linter and formatter**

   ```bash
   npm run lint
   npm run format
   npm run type-check
   ```

4. **Run tests locally**

   ```bash
   npm test
   ```

5. **Commit changes** with descriptive messages

6. **Push and create PR**

### Code Quality

- **ESLint**: `npm run lint`
- **Prettier**: `npm run format`
- **TypeScript**: `npm run type-check`
- **Validation**: `npm run validate` (runs all checks)

### Adding New Tests

1. Create test file in `tests/specs/`
2. Follow existing naming conventions
3. Use Page Object Models from `src/pages/`
4. Add appropriate assertions
5. Document test purpose and requirements

---

## 📄 License

This project is proprietary software owned by WPPOOL.

---

## 📞 Support

For issues and questions:

- **GitHub Issues**: [Report a bug](https://github.com/wppool/flexorder-e2e-automation/issues)
- **Internal Team**: Contact the QA team

---

## 📚 Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [WordPress CLI](https://wp-cli.org/)
- [WooCommerce REST API](https://woocommerce.github.io/woocommerce-rest-api-docs/)
- [Google Sheets API](https://developers.google.com/sheets/api)

---

**Made with ❤️ by WPPOOL QA Team**
