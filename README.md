# FlexOrder E2E Automation with CI/CD

> End-to-end test automation framework for the **FlexOrder** WordPress plugin (WooCommerce → Google Sheets order sync), built with **Playwright + TypeScript**, a **Dockerized WordPress** environment, and a **GitHub Actions** CI/CD pipeline.

[![CI/CD Pipeline](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-blue)](https://github.com/RakibulIslam39/FlexOrder-e2e-Automation-with-CI-CD/actions)
[![Playwright](https://img.shields.io/badge/Playwright-1.56-2EAD33?logo=playwright)](https://playwright.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-WordPress-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Tech Stack](#-tech-stack)
- [Features](#-features)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [Environment Configuration](#-environment-configuration)
- [Running Tests](#-running-tests)
- [Test Architecture](#-test-architecture)
- [CI/CD Pipeline](#-cicd-pipeline)
- [Repository Dispatch Setup](#-repository-dispatch-setup)
- [Documentation](#-documentation)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)

---

## 🎯 Overview

This repository is an **automated end-to-end (E2E) testing suite** for the
**FlexOrder** WordPress plugin ecosystem — a plugin that synchronizes
WooCommerce orders with Google Sheets.

The suite spins up a **fresh, disposable WordPress + WooCommerce environment in
Docker**, installs the FlexOrder plugins, provisions test data and API keys, and
then drives the browser and REST APIs with **Playwright** to validate:

- WooCommerce order management via the REST API
- Google Sheets ↔ WooCommerce order-status synchronization
- The FlexOrder setup wizard (credentials + Google Sheet connection)
- FlexOrder Ultimate (Pro) display/formatting/filtering settings

In CI, the pipeline is designed to run on a **self-hosted GitHub Actions runner**
and can be triggered automatically from the plugin repositories via
`repository_dispatch`, so every plugin commit is validated against the exact
pushed version.

---

## 🧰 Tech Stack

| Area | Technology |
|------|-----------|
| Test runner | [Playwright](https://playwright.dev/) (`@playwright/test`) |
| Language | TypeScript (strict), Node.js ≥ 18 |
| App under test | WordPress + WooCommerce + FlexOrder (Free & Ultimate) |
| Environment | Docker Compose (WordPress, MySQL, phpMyAdmin, MailHog) |
| Integrations | WooCommerce REST API, Google Sheets API (`googleapis`, `google-spreadsheet`) |
| CI/CD | GitHub Actions (self-hosted runner), `repository_dispatch` |
| Reporting | HTML, JUnit, JSON, GitHub reporter, custom flaky-test reporter |
| Quality | ESLint, Prettier, `tsc --noEmit`, Husky + lint-staged |

---

## ✨ Features

- ✅ **Disposable WordPress environment** — fresh Docker stack per run
- ✅ **Project pipeline** — auth → plugin setup → E2E, enforced via Playwright `dependencies`
- ✅ **One-shot authentication** — logs in once, reuses stored session state
- ✅ **WooCommerce REST API** — auto-generated consumer keys for API tests
- ✅ **Google Sheets sync** — bi-directional order-status validation
- ✅ **Page Object Model + service classes** — maintainable, reusable code
- ✅ **Repository dispatch** — automatic testing on plugin commits
- ✅ **Flaky-test detection** — custom reporter flags unstable tests
- ✅ **Rich reporting** — HTML / JUnit / JSON artifacts, plus optional Email & Slack notifications
- ✅ **Type-safe** — end-to-end TypeScript with linting/formatting gates

---

## 📦 Prerequisites

| Software | Version |
|----------|---------|
| Node.js | ≥ 18.0.0 |
| npm | ≥ 8.0.0 |
| Docker | ≥ 20.10 (for the local WordPress stack) |
| Docker Compose | ≥ 2.0 |

**Optional (for Google Sheets tests):** a Google Cloud service account with the
Google Sheets API enabled and Editor access to your target sheet.

---

## 🚀 Quick Start

### 1. Clone & install

```bash
git clone https://github.com/RakibulIslam39/FlexOrder-e2e-Automation-with-CI-CD.git
cd FlexOrder-e2e-Automation-with-CI-CD
npm ci
npx playwright install --with-deps chromium
```

### 2. Configure environment

```bash
cp .env.example .env
# then edit .env
```

Minimum required values (see [Environment Configuration](#-environment-configuration)):

```bash
SITE_URL=http://localhost:8080
USER_NAME=admin
PASSWORD=admin123
```

### 3. Start the WordPress stack

```bash
docker compose -f docker-compose.fresh-wordpress.yml up -d
docker compose -f docker-compose.fresh-wordpress.yml ps   # wait until healthy (~2 min)
```

### 4. Provision the test environment

Installs WordPress core + WooCommerce, activates the FlexOrder plugins, and
generates WooCommerce API keys into `tests/fixtures/api-keys.json`:

```bash
npm run setup:ci
```

### 5. Run the tests

```bash
npm test              # headless
npm run test:headed   # watch the browser
npm run test:ui       # interactive UI mode
```

---

## 📁 Project Structure

```
FlexOrder-e2e-Automation-with-CI-CD/
├── .github/
│   ├── ISSUE_TEMPLATE/               # Bug report / feature request templates
│   ├── flexorder_workflow/           # Trigger-workflow templates for plugin repos
│   │   ├── flexorder.yml
│   │   └── flexorder-ultimate.yml
│   └── workflows/
│       └── ci-workflow.yml           # Main CI/CD pipeline (self-hosted)
├── src/
│   ├── config/
│   │   ├── environment.ts            # Centralized env loading + validation
│   │   └── flaky-tests-reporter.ts   # Custom Playwright reporter
│   ├── interfaces/                   # TypeScript interfaces (order, google-sheets)
│   ├── pages/                        # Page Object Models (UI)
│   │   ├── login.ts
│   │   ├── flexorder-setup.ts
│   │   └── ultimateSettings.ts
│   ├── services/                     # Non-UI integrations
│   │   ├── google-sheet-api.ts
│   │   └── order-status-updater.ts   # Sheets ↔ WooCommerce sync service
│   └── utils/
│       └── googleSheetHelper.ts
├── tests/
│   ├── auth.setup.ts                 # Logs in once, saves storage state
│   ├── global-setup.ts / global-teardown.ts
│   ├── specs/
│   │   ├── flexorder-setup.spec.ts   # Setup wizard (plugin-setup project)
│   │   ├── ultimateSettings.spec.ts  # Ultimate settings validations (e2e project)
│   │   ├── update-order-status.spec.ts # Sheets → WooCommerce sync (e2e project)
│   │   ├── woocommerceAPI.spec.ts     # REST API smoke tests (scaffold)
│   │   └── a-active-ultimate.spec.ts  # License activation (scaffold)
│   ├── fixtures/
│   │   ├── test-fixtures.ts          # Shared POM + service fixtures
│   │   ├── .auth/                    # Persisted login state (git-ignored)
│   │   ├── api-keys.json             # Auto-generated WC keys (git-ignored)
│   │   └── upload_key.json           # Google service-account key (git-ignored)
│   └── data/
│       └── productdata.json          # Test data (no credentials)
├── scripts/
│   ├── setup-ci-environment.ts       # Provision WordPress + data + API keys
│   ├── verify-dispatch-config.ts     # Validate repository_dispatch wiring
│   ├── setup-github-secrets.sh       # Template to push repo secrets/variables via gh
│   └── *.ps1                         # Self-hosted (Windows) runner helpers
├── docs/                             # Guides & reference docs (see Documentation)
├── mysql-config/ · mysql-init/       # MySQL tuning & init scripts
├── docker-compose.fresh-wordpress.yml
├── playwright.config.ts
├── package.json · tsconfig.json · uploads.ini
├── .env.example · .eslintrc.js · .prettierrc
└── README.md
```

---

## ⚙️ Environment Configuration

All variables are read through `src/config/environment.ts`. Locally they come
from `.env`; in CI they are injected from GitHub Secrets by the workflow.
Copy `.env.example` to `.env` and fill in the values.

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `SITE_URL` | ✅ | WordPress site URL | `http://localhost:8080` |
| `USER_NAME` | ✅ | WordPress admin username | — |
| `PASSWORD` | ✅ | WordPress admin password | — |
| `ADMIN_PANEL_URL` | ➖ | WP admin URL | `${SITE_URL}/wp-admin/` |
| `WOOCOMMERCE_CONSUMER_KEY` | ⚙️ | WooCommerce API key | auto-generated by `setup:ci` |
| `WOOCOMMERCE_CONSUMER_SECRET` | ⚙️ | WooCommerce API secret | auto-generated by `setup:ci` |
| `GOOGLE_SHEET_URL` | ➖ | Google Sheet URL for sync tests | — |
| `SHEET_NAME` | ➖ | Worksheet / tab name | `Orders` |
| `SERVICE_ACCOUNT_UPLOAD_FILE` | ➖ | Path to Google service-account JSON | `./tests/fixtures/upload_key.json` |
| `FLEXORDER_PRO_LICENSE_KEY` | ➖ | FlexOrder Pro license key | — |
| `DB_HOST` / `DB_NAME` / `DB_USER` / `DB_PASSWORD` | ➖ | Local Docker DB settings | Docker defaults |
| `NON_HEADLESS` / `SLOWMO` / `TIMEOUT_SECONDS` / `MAX_RETRIES` / `PARALLEL_WORKERS` | ➖ | Playwright debug/tuning | — |

**Legend:** ✅ required · ⚙️ auto-generated by `npm run setup:ci` · ➖ optional
(only needed for specific features such as Google Sheets tests).

> **Secrets are never committed.** `.env`, `tests/fixtures/upload_key.json`, and
> `tests/fixtures/api-keys.json` are all git-ignored. For the full CI secret &
> variable reference, see [`docs/CI_SECRETS_AND_VARIABLES.md`](docs/CI_SECRETS_AND_VARIABLES.md).

### Google Sheets setup (optional)

1. Create a Google Cloud project and **enable the Google Sheets API**.
2. Create a **service account** and download its JSON key.
3. Save the key at `tests/fixtures/upload_key.json` (git-ignored).
4. **Share your Google Sheet** with the service-account email (Editor access).
5. Set `GOOGLE_SHEET_URL` and `SHEET_NAME` in `.env`.

---

## 🧪 Running Tests

### Common commands

```bash
npm test                                   # run all tests (headless)
npm run test:headed                        # run with a visible browser
npm run test:ui                            # interactive UI mode
npm run test:debug                         # Playwright inspector
npm run test:report                        # open the last HTML report
npx playwright test tests/specs/update-order-status.spec.ts   # a single file
npx playwright test --grep "Ultimate Settings"                # by title
```

### All npm scripts

| Command | Description |
|---------|-------------|
| `npm test` | Run the full E2E suite |
| `npm run test:headed` | Run with a visible browser |
| `npm run test:ui` | Interactive UI mode |
| `npm run test:debug` | Debug mode (inspector) |
| `npm run test:report` | Open the HTML report |
| `npm run test:ci:full` | Run the suite with `CI=true` |
| `npm run setup:ci` | Provision WordPress + test data + API keys |
| `npm run verify:dispatch` | Validate repository-dispatch configuration |
| `npm run lint` / `npm run lint:fix` | ESLint (check / auto-fix) |
| `npm run format` / `npm run format:check` | Prettier (write / check) |
| `npm run type-check` | `tsc --noEmit` type check |
| `npm run validate` | `type-check` + `lint` + `format:check` |
| `npm run clean` | Remove `test-results`, `playwright-report`, caches |

---

## 🏗️ Test Architecture

### Execution pipeline (Playwright projects)

Ordering is enforced with Playwright **project `dependencies`** (defined in
[`playwright.config.ts`](playwright.config.ts)), replacing the old
alphabetical `a-`-prefix convention:

```
auth-setup                 → tests/auth.setup.ts (log in once → save storage state)
      │
      ├── plugin-setup      → specs/flexorder-setup.spec.ts   (setup wizard)
      │        │
      │        └── e2e      → specs/ultimateSettings.spec.ts
      │                        specs/update-order-status.spec.ts
      │
      └── woocommerce-api   → specs/woocommerceAPI.spec.ts    (REST API, no browser)
```

Tests run **sequentially** (`fullyParallel: false`, `workers: 1`) to keep the
shared database and Google Sheet state deterministic — for example, the
order-status sync spec intentionally chains state across its tests.

### Active test suites

| Spec | Project | What it validates |
|------|---------|-------------------|
| `flexorder-setup.spec.ts` | `plugin-setup` | Completes the FlexOrder credentials + Google Sheet setup wizard |
| `update-order-status.spec.ts` | `e2e` | Fetch, update, verify, and bulk-update WooCommerce order statuses, synced through Google Sheets |
| `ultimateSettings.spec.ts` | `e2e` | Ultimate display settings: billing/shipping address, product columns/rows, name separators, custom fields, sorting, and filtering on Google Sheets |

> `woocommerceAPI.spec.ts` and `a-active-ultimate.spec.ts` are present as
> scaffolds (their bodies are currently commented out).

### Page Object Model + fixtures

UI interactions live in `src/pages/` (Page Objects); non-UI integrations live in
`src/services/`. Shared fixtures are provided by
[`tests/fixtures/test-fixtures.ts`](tests/fixtures/test-fixtures.ts):

| Fixture | Scope | Purpose |
|---------|-------|---------|
| `loginPage` | test | WordPress login Page Object |
| `setupPage` | test | FlexOrder setup-wizard Page Object |
| `settingsPage` | test | Ultimate order-sync settings Page Object |
| `orderStatusUpdater` | worker | Sheets ↔ WooCommerce status-sync service |
| `googleSheetAPI` | worker | Google Sheets API client |
| `sheetHelper` | worker | Google Sheets test helpers |

```typescript
import { test, expect } from '../fixtures/test-fixtures';

test('sync order status', async ({ orderStatusUpdater }) => {
  const status = await orderStatusUpdater.getCurrentStatus(orderId);
  expect(status).toBeDefined();
});
```

---

## 🔄 CI/CD Pipeline

The pipeline is defined in
[`.github/workflows/ci-workflow.yml`](.github/workflows/ci-workflow.yml).

### Triggers

- **Push** to `main` or `qa`
- **`repository_dispatch`** events (`flexorder`, `flexorder-ultimate`) from the plugin repos
- **Manual** via `workflow_dispatch`
- **Scheduled** daily run (available, commented out by default)

### Stages

1. **Setup** — checkout, Node.js, npm install, Playwright browsers, caching
2. **Docker** — start WordPress + MySQL (phpMyAdmin/MailHog via `dev` profile)
3. **WordPress install** — WP core + WooCommerce via WP-CLI
4. **Plugin deploy** — download FlexOrder Free & Ultimate (GitHub App token) for the pushed SHA
5. **Provision** — `setup-ci-environment.ts` creates data and API keys
6. **Test** — run the full Playwright suite
7. **Report** — upload HTML/JUnit/screenshots/videos; optional Email & Slack notifications
8. **Cleanup** — tear down project-scoped Docker resources

### Required secrets & variables

Configured under **Settings → Secrets and variables → Actions**. Full table,
descriptions, and a scripted setup helper are in
[`docs/CI_SECRETS_AND_VARIABLES.md`](docs/CI_SECRETS_AND_VARIABLES.md).

| Secret | Required | Purpose |
|--------|----------|---------|
| `APP_ID`, `APP_PRIVATE_KEY` | ✅ (for CI) | GitHub App token to download the private FlexOrder plugins |
| `GOOGLE_SHEET_URL`, `SHEET_NAME` | ➖ | Google Sheets tests |
| `FLEXORDER_PRO_LICENSE_KEY` | ➖ | Pro-gated specs |
| `SMTP_SERVER`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `EMAIL_TO` | ➖ | Email report notifications |
| `SLACK_WEBHOOK_URL` | ➖ | Slack notifications |

WordPress admin/URL values (`WORDPRESS_URL`, `WORDPRESS_ADMIN_USER`, etc.) are
throwaway defaults hard-coded in the workflow's `env:` block for the ephemeral CI
container.

### Self-hosted runner

The pipeline uses `runs-on: self-hosted`. See
[`docs/self-hosted-runner-setup.md`](docs/self-hosted-runner-setup.md) and the
PowerShell helpers in `scripts/` for registering a Windows runner.

> **Running on a personal fork?** The workflow expects a self-hosted runner and
> access to the private `WPPOOL/flexorder` and `WPPOOL/flexorder-ultimate` repos,
> so it won't run as-is on a public fork without your own runner and plugin
> access (or adapting it to `ubuntu-latest` with public/mock plugins).

---

## 🔗 Repository Dispatch Setup

The plugin repositories trigger this CI repo automatically when code is pushed:

```
Push to flexorder (main/develop)
        ↓
trigger-e2e.yml (in plugin repo) → generates GitHub App token
        ↓
Sends repository_dispatch → this repo
        ↓
ci-workflow.yml runs E2E tests against the pushed commit
```

**Setup summary** (details in each plugin repo):

1. Give the GitHub App **Actions: Read & write** permission and install it on all repos.
2. Add `APP_ID` and `APP_PRIVATE_KEY` secrets to the plugin repos.
3. Copy the trigger template into each plugin repo:
   ```bash
   cp .github/flexorder_workflow/flexorder.yml \
      /path/to/flexorder/.github/workflows/trigger-e2e.yml
   ```
4. Verify the wiring:
   ```bash
   npm run verify:dispatch
   ```

---

## 📚 Documentation

| Doc | Description |
|-----|-------------|
| [`docs/EXECUTION_GUIDE.md`](docs/EXECUTION_GUIDE.md) | Step-by-step execution guide |
| [`docs/CI_SECRETS_AND_VARIABLES.md`](docs/CI_SECRETS_AND_VARIABLES.md) | All CI secrets & variables (+ `gh` setup script) |
| [`docs/self-hosted-runner-setup.md`](docs/self-hosted-runner-setup.md) | Self-hosted runner setup |
| [`docs/ci-workflow-diagram.md`](docs/ci-workflow-diagram.md) | CI workflow diagram |
| [`docs/WOOCOMMERCE_API_CREDENTIALS_GUIDE.md`](docs/WOOCOMMERCE_API_CREDENTIALS_GUIDE.md) | How WooCommerce API keys are generated & loaded |
| [`docs/FILE_MAPPING.md`](docs/FILE_MAPPING.md) | File/responsibility map |
| [`docs/REFACTORING_NOTES.md`](docs/REFACTORING_NOTES.md) | Refactoring notes |
| [`docs/playwright-best-practice-memory.md`](docs/playwright-best-practice-memory.md) | Playwright best practices |
| [`docs/BEGINNER_AUTOMATION_EXECUTION_GUIDE_BN.md`](docs/BEGINNER_AUTOMATION_EXECUTION_GUIDE_BN.md) | Beginner execution guide (Bangla) |
| [`docs/HANDOVER_SCRIPT_BN.md`](docs/HANDOVER_SCRIPT_BN.md) | Handover script (Bangla) |

---

## 🐛 Troubleshooting

**WordPress not accessible**
```bash
docker compose -f docker-compose.fresh-wordpress.yml ps
docker logs flexorder-wordpress
docker compose -f docker-compose.fresh-wordpress.yml restart
```

**API keys not generated**
```bash
npm run setup:ci
cat tests/fixtures/api-keys.json
```

**Tests timing out** — increase `TIMEOUT_SECONDS`, check Docker resource limits, and ensure WordPress is fully healthy before running.

**Google Sheets tests failing** — confirm the service account has **Editor**
access, `SERVICE_ACCOUNT_UPLOAD_FILE` points to a valid key, and the Sheets API
is enabled.

**Flaky tests** — the custom reporter records unstable tests under `flaky-tests/`
for review.

**Repository dispatch not triggering** — verify the trigger workflow exists in
the plugin repo, the `APP_ID`/`APP_PRIVATE_KEY` secrets are set, and the GitHub
App has *Actions: Write* and is installed on this repo. Then re-run
`npm run verify:dispatch`.

---

## 🤝 Contributing

```bash
git checkout -b feature/your-feature
# make changes, then:
npm run validate    # type-check + lint + format:check
npm test
```

- Add new specs under `tests/specs/` and wire them into the appropriate project in `playwright.config.ts`.
- Reuse Page Objects (`src/pages/`) and services (`src/services/`) rather than duplicating selectors/logic.
- Keep secrets out of the repo — use `.env` locally and GitHub Secrets in CI.

---

## 📝 About & License

This is a **QA automation portfolio project** demonstrating a production-style
Playwright + TypeScript E2E framework with a full Docker + GitHub Actions CI/CD
pipeline. **FlexOrder** is a commercial WordPress plugin by
[WPPOOL](https://wppool.dev/); this repository contains only the automated
testing framework.

Maintained by **Rakibul Islam**. Issues and questions:
[GitHub Issues](https://github.com/RakibulIslam39/FlexOrder-e2e-Automation-with-CI-CD/issues).

### Useful references

- [Playwright](https://playwright.dev/) · [WP-CLI](https://wp-cli.org/) · [WooCommerce REST API](https://woocommerce.github.io/woocommerce-rest-api-docs/) · [Google Sheets API](https://developers.google.com/sheets/api)
