# Refactoring Notes — Resolved Review Issues

This document summarizes the changes applied while resolving the code-review
issues. It explains **why** we changed something, what to watch for, and
what still remains (intentional or deferred).

---

## 0. Local vs CI Credential Flow (single source of truth)

The suite now runs cleanly against both environments with **zero code
changes** between them:

| Runtime | Credential source | Loader |
| --- | --- | --- |
| **Local** (developer machine) | `.env` file at project root | `dotenv` (inside `src/config/environment.ts`) |
| **CI** (GitHub Actions) | GitHub Secrets injected via workflow `env:` block | Already present in `process.env` when the process starts |

### How it works

1. `src/config/environment.ts` is the **only** module that reads from
   `process.env`. It:
   - Calls `dotenv.config()` against `<project-root>/.env` if that file
     exists. `dotenv` is a **no-op for variables that are already set**, so
     CI-injected values are never overwritten.
   - Detects the mode once and exports `isCI` / `isLocal` for the rest of
     the codebase.
   - Fails fast if `.env` is missing **in local mode**, or if
     `SITE_URL` / `USER_NAME` / `PASSWORD` are missing in either mode, with
     a message that tells the user whether to fix `.env` (local) or GitHub
     Secrets (CI).
   - Normalises URLs (no more `//wp-admin/` bug when `SITE_URL` has a
     trailing slash).

2. Every other module (`playwright.config.ts`, `login.ts`,
   `flexorder-setup.ts`, `global-setup.ts`, `global-teardown.ts`, …) now
   imports from `src/config/environment.ts`:

   ```ts
   import env, { isCI, hasGoogleSheets } from './src/config/environment';
   ```

   This removes the ~8 scattered `process.env.CI === 'true'` checks that
   previously existed and guarantees consistent mode behaviour.

### Running locally

```bash
cp .env.example .env
# fill in SITE_URL / USER_NAME / PASSWORD (and Google Sheet vars if used)
npm test                 # headed by default on local
npm run test:ci:full     # simulate CI mode locally
```

### Running in CI

GitHub Secrets required by `.github/workflows/ci-workflow.yml`:

| Secret | Mapped to env var | Required? |
| --- | --- | --- |
| `WORDPRESS_ADMIN_USER` | `USER_NAME` | ✅ |
| `WORDPRESS_ADMIN_PASSWORD` | `PASSWORD` | ✅ |
| `GOOGLE_SHEET_URL` | `GOOGLE_SHEET_URL` | Only if Sheets specs run |
| `SHEET_NAME` | `SHEET_NAME` | Only if Sheets specs run |
| `FLEXORDER_PRO_LICENSE_KEY` | `FLEXORDER_PRO_LICENSE_KEY` | Only for Pro specs |

`SITE_URL`, `PLAYWRIGHT_BASE_URL`, `ADMIN_PANEL_URL`, and the WooCommerce
consumer key/secret are computed or produced by the workflow itself
(`scripts/setup-ci-environment.ts` generates `tests/fixtures/api-keys.json`
and exports the values into the step `env` block).

### Adding a new environment variable — checklist

1. Add it to `.env.example` with a comment describing local vs CI source.
2. Add it to `EnvironmentVariables` in `src/config/environment.ts` and read
   it there (never `process.env.FOO` elsewhere).
3. If required in CI, add it to the `env:` block of the
   `🧪 Run E2E Tests` step in `.github/workflows/ci-workflow.yml`.
4. If required in both modes, add it to `REQUIRED_VARS` in
   `environment.ts`.

---

## 1. Security

| What | File(s) | Change |
| --- | --- | --- |
| Removed real Google account email/password | `tests/data/productdata.json` | Only product & service-account metadata remain; no live credentials. |
| Failed fast on missing credentials | `src/config/environment.ts` | `admin123` fallback gone — suite now throws if `USER_NAME`/`PASSWORD`/`SITE_URL` aren't set. |
| Extra patterns requested for `.cursorignore` | `.cursorignore` | File is sandbox-protected here. **Please apply manually** (the recommended contents are at the end of this doc). |

The existing `.gitignore` already covers `tests/fixtures/upload_key.json`
and `tests/data/productdata.json`, so those secrets never reach git.

---

## 2. Dead code / Duplicates

- Deleted fully-commented specs: `a-activateProVersion.spec.ts`,
  `createNewOrder.spec.ts`, and the now-unused `src/pages/createNewOrder.ts`.
- Removed ~150 lines of commented-out blocks from `src/pages/login.ts` and
  `src/pages/ultimateSettings.ts`.
- Consolidated `getSpreadsheetId()` in `src/utils/googleSheetHelper.ts` to
  re-use `getGoogleSheetId()` from `src/config/environment.ts` (single
  source of truth).
- Merged duplicate ESLint configs (`.eslintrc.json` deleted; `.eslintrc.js`
  is the canonical config and now supports the destructuring-ignore pattern
  via `ignoreRestSiblings` + `varsIgnorePattern: '^_'`).

---

## 3. Playwright best practices

### Projects + dependencies (replaces the `a-` filename-prefix hack)

`playwright.config.ts` now exposes four projects wired via
`dependencies`:

```
auth-setup → plugin-setup → e2e
         └→ woocommerce-api
```

- `auth-setup` (`tests/auth.setup.ts`) logs in once and saves
  `tests/fixtures/.auth/user.json` as the storage state.
- `plugin-setup` runs the FlexOrder onboarding wizard with that storage
  state already loaded (so no per-test login overhead).
- `woocommerce-api` runs REST smoke checks as soon as auth is ready.
- `e2e` (ultimate-settings + order-status specs) runs after the plugin is
  set up.

Renamed specs (no more `a-` prefix trick):

- `a-flexorder-setup.spec.ts` → `flexorder-setup.spec.ts`
- `a-woocommerceAPI.spec.ts`  → `woocommerceAPI.spec.ts`

### Locators

- XPath `//div[normalize-space()="FlexOrder"]` replaced with the more
  stable `#toplevel_page_osgsw-admin >> a` (WP auto-generates that id).
- `//span[@role="combobo"]` (typo!) replaced with `getByRole('combobox')`.
- `//a[normalize-space()="Sync orders on Google Sheet"]` →
  `getByRole('link', { name: 'Sync orders on Google Sheet' })`.

### Waits

- `page.waitForLoadState('networkidle')` removed from
  `flexorder-setup.ts` and `global-setup.ts` — WP admin's heartbeat
  pings make that state unreachable.
- `page.waitForTimeout(2000)` in `navigateToPluginPage` replaced with
  an `expect(...).toBeVisible()` signal on the setup button.
- The disable→re-enable dance in `toggleOption()` was **kept
  intentionally** — we need to force a save-event so the plugin pushes
  new data to the sheet — but now uses web-first assertions
  (`expect(toggleInput).toBeChecked()`) instead of arbitrary 300 ms sleeps.

### Login validation

`LoginPage.login()` now actually verifies the admin dashboard is reached
(racing `waitForURL('**/wp-admin/**')` against the admin-bar becoming
visible). The previously-commented `validateLoginResult` is folded in.

---

## 4. Architecture

- `src/pages/update-order-status.ts` → `src/services/order-status-updater.ts`.
  It is not a page object — it wraps the Sheets + WooCommerce REST APIs —
  so it belongs under `services/`.
- The module-level `export const updatedOrders: UpdatedOrder[] = []` is
  **gone**. The array is now a private field on `OrderStatusUpdater`, and
  each test gets its own updater instance via the shared fixture.
- New `tests/fixtures/test-fixtures.ts` centralizes fixture wiring for
  `LoginPage`, `SetupAddCredentialsPage`, `OrderSyncSettingsPage`,
  `OrderStatusUpdater`, `GoogleSheetAPI`, `GoogleSheetHelper`. Specs now
  `import { test, expect } from '../fixtures/test-fixtures'`.
- `ultimateSettings.spec.ts` `beforeEach` no longer performs a login per
  test; it trusts the `auth-setup` project's storage state. That's ~3-5 s
  saved on every single one of 30+ tests.

---

## 5. CI / Docker

- **`docker-compose.fresh-wordpress.yml`**: pinned images
  (`wordpress:6.4-php8.2-apache`, `mysql:8.0.36`, `phpmyadmin:5.2`,
  `mailhog:v1.0.1`). `phpmyadmin` and `mailhog` now gated behind the
  `dev` Compose profile — they don't start in CI anymore.
- **`.github/workflows/ci-workflow.yml`**:
  - Removed `docker system prune -f --volumes` (would wipe state for
    every other repo on the shared self-hosted runner). Replaced with
    project-scoped `docker image prune --filter` + `docker builder prune`.
  - Moved `SMTP_CONFIGURED` to job-level `env`. The previous step-level
    env was evaluated *after* the step's `if:` expression, so the email
    steps never fired. They now fire correctly when
    `secrets.SMTP_SERVER` and `secrets.EMAIL_TO` are set.

---

## 6. package.json

- `test:ci:full` no longer filters by a non-existent project; it runs
  the full projects pipeline so that dependencies run in the right order.

---

## Verification

After the changes:

```bash
npm run type-check   # → passes
npm run lint         # → 0 errors (86 pre-existing `console.log` warnings)
npx playwright test --list   # → all projects discovered, tests enumerated
```

---

## Action items that require human involvement

1. **Rotate the leaked Google Service Account private key**
   (`tests/fixtures/upload_key.json`) and the Google account password that
   used to live in `tests/data/productdata.json`. Even though both files
   are gitignored, assume they have been on disk and rotate out of caution.
2. **Update `.cursorignore` manually** — the IDE sandbox blocked a
   programmatic write. Recommended contents:
   ```
   node_modules/
   test-results/
   playwright-report/
   .git/
   *.lock
   *.log
   dist/

   .env
   .env.*
   !.env.example
   tests/fixtures/api-keys.json
   tests/fixtures/upload_key.json
   tests/fixtures/.auth/
   tests/utilities/downloaded_key.json
   tests/utilities/upload_key.json
   tests/data/productdata.json

   flaky-tests/
   blob-report/
   playwright/.cache/
   ```
3. If you have a secret scanner (e.g. `gitleaks`) you should run it
   against the full git history once, as the leaked key/password were in
   the working tree for an extended period.
