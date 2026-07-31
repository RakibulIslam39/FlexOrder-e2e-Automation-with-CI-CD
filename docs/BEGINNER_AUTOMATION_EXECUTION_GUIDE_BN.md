# FlexOrder / FlexOrder Ultimate Automation Execution Guide (Beginner-Friendly)

এই গাইডটি এমনভাবে লেখা হয়েছে যাতে **non-technical / beginner** মানুষও ধাপে ধাপে follow করে automation run করতে পারেন।

---

## 0) এই ডকুমেন্ট কার জন্য

- QA team-এর নতুন member
- non-technical stakeholder (যারা run process বুঝতে চান)
- future maintainer (যারা structure + workflow দ্রুত বুঝতে চান)

### 0.1) Project Overview (১ মিনিটে বুঝুন)

এই repository-র কাজ:

- fresh WordPress + WooCommerce test environment তৈরি করা
- FlexOrder এবং FlexOrder Ultimate plugin flow test করা
- Playwright E2E test run করে report/artifact তৈরি করা

সহজভাবে: **“environment দাঁড় করাও → setup করো → automation run করো → report দেখো”**

---

## 1) Step-by-Step Run Guide (সহজ ভাষায়)

### Step 1: Minimum Prerequisites

নিচের জিনিসগুলো install থাকতে হবে:

- Node.js `18+`
- npm `8+`
- Docker Desktop (চালু থাকতে হবে)
- Git
- `.env` file (template: `<project-root>/.env.example`)

---

### Step 2: Project প্রস্তুত করুন

Project root path:
`<project-root>`

Command:

```bash
cd <project-root>
npm ci
npx playwright install --with-deps chromium
```

---

### Step 3: Environment configure করুন

`.env.example` থেকে `.env` তৈরি করুন:

```bash
cp <project-root>/.env.example <project-root>/.env
```

`.env` এ minimum value দিন:

```env
SITE_URL=http://localhost:8080
ADMIN_PANEL_URL=http://localhost:8080/wp-admin/
USER_NAME=admin
PASSWORD=admin123
FLEXORDER_PRO_LICENSE_KEY=your-license-key
```

> `ADMIN_PANEL_URL` এই project-এ by default trailing slash (`/wp-admin/`) সহ ব্যবহার করা হয়। একই format রাখুন।

> নোট: Google Sheet test চালাতে চাইলে `GOOGLE_SHEET_URL`, `SHEET_NAME`, `SERVICE_ACCOUNT_UPLOAD_FILE` লাগবে।

---

### Step 4: Fresh WordPress environment চালু করুন

```bash
docker compose -f <project-root>/docker-compose.fresh-wordpress.yml up -d
```

Service status check:

```bash
docker compose -f <project-root>/docker-compose.fresh-wordpress.yml ps
```

---

### Step 5: Auto setup (WordPress + WooCommerce + test data)

```bash
cd <project-root>
npm run setup:ci
```

এই step সাধারণত করে:

- WordPress provisioning
- WooCommerce setup
- API key generation
- sample products/orders seed

---

### Step 6: Automation run করুন

সব test run:

```bash
cd <project-root>
npm test
```

Report দেখুন:

```bash
cd <project-root>
npm run test:report
```

---

## 2) Automation Run Process (Local + CI)

### A) Local run (নিজের machine-এ)

1. dependency + browser install
2. `.env` configure
3. Docker environment start
4. `npm run setup:ci` দিয়ে WordPress provisioning + seed data
5. `npm test`
6. `npm run test:report`

### B) CI run (GitHub Actions)

CI trigger হলে workflow নিজে এই কাজগুলো করে:

- dependency install
- Docker clean + start
- plugin zip download/install
- `setup-ci-environment.ts` run
- Playwright tests run
- artifact upload + notification + cleanup

### C) Manual CI run (non-technical friendly)

1. GitHub Repository → **Actions**
2. **FlexOrder CI/CD Pipeline** workflow open করুন
3. **Run workflow** ক্লিক করুন
4. branch select করে run দিন
5. Run শেষে **Artifacts** থেকে report download করুন

---

## 3) Workflow Mapping (Text Diagram + CI Overview)

### End-to-End Flow (Text Diagram)

`Trigger (manual / push / repository_dispatch)`  
→ `Self-hosted runner starts`  
→ `npm install + Playwright browser install`  
→ `Docker cleanup + fresh WordPress start`  
→ `FlexOrder/FlexOrder Ultimate plugin zip download`  
→ `WordPress + WooCommerce + plugin install/activate`  
→ `setup-ci script runs (API keys + seed data)`  
→ `Playwright tests run (POM based)`  
→ `Artifacts upload (report/screenshot/video)`  
→ `Email/Slack notification`  
→ `Cleanup job removes Docker resources`

### CI workflow key file

- Main workflow:
  `<project-root>/.github/workflows/ci-workflow.yml`

### CI trigger types

- `workflow_dispatch` (manual run)
- `push` (`main`, `qa`)
- `repository_dispatch` (`flexorder`, `flexorder-ultimate`)

### CI behavior summary

- প্রতিবার clean Docker environment
- নতুন WordPress site build + plugin deploy
- তারপর Playwright test execution
- শেষে `cleanup` job সবসময় run করে

---

## 4) Playwright POM + Key Files Breakdown

### POM structure

- `tests/specs/*.spec.ts` → scenario/test case
- `src/pages/*.ts` → UI action methods (reusable page objects)
- `playwright.config.ts` → timeout/retry/reporter/settings
- `tests/global-setup.ts` → run-এর আগে global setup
- `tests/global-teardown.ts` → run শেষে summary/cleanup helper কাজ

### Key files (কোনটা কী করে)

- `<project-root>/playwright.config.ts`
  - Playwright runtime config, retries, reporters, base URL
- `<project-root>/tests/global-setup.ts`
  - env validation, folder preparation, site accessibility check
- `<project-root>/tests/global-teardown.ts`
  - artifacts summary, temp file cleanup
- `<project-root>/scripts/setup-ci-environment.ts`
  - WordPress provisioning + WooCommerce API key generation + seed data
- `<project-root>/src/config/environment.ts`
  - centralized env configuration loader
- `<project-root>/src/pages/login.ts`
  - WP admin login flow
- `<project-root>/src/pages/flexorder-setup.ts`
  - plugin setup credential flow
- `<project-root>/src/pages/ultimateSettings.ts`
  - Ultimate settings toggle/sync behavior
- `<project-root>/src/utils/googleSheetHelper.ts`
  এবং
  `<project-root>/src/services/google-sheet-api.ts`
  - Google Sheet read/write/sync helper logic

---

## 5) Project Structure Explanation (Folder-wise)

- `.github/workflows/` → CI pipeline workflow YAML
- `tests/specs/` → main automated test files
- `tests/data/` → static test data
- `tests/fixtures/` → API keys/service account/auth related files
- `src/pages/` → Page Object Model layer
- `src/services/` → service/API integration
- `src/utils/` → helper utilities
- `src/config/` → env + config + reporters
- `scripts/` → CI/local provisioning scripts
- `docs/` → project documentation

### Naming convention (simple)

- `*.spec.ts` → test file
- `a-*.spec.ts` → setup/priority tests (উদাহরণ: `a-flexorder-setup.spec.ts`)
- Page classes → feature-based নাম (যেমন `LoginPage`, `OrderSyncSettingsPage`)
- Env keys → uppercase snake case (`SITE_URL`, `PASSWORD`)

> `a-` naming একটি deliberate sequence hint, কারণ alphabetical ordering-এ এই ফাইলগুলো আগে আসে। প্রয়োজনে `b-`, `c-` pattern ব্যবহার করা যায়; তবে critical dependency কম রাখতে test design করা ভালো practice।

---

## 6) File & Function Mapping (Quick)

| File                               | কী কাজ করে                                           |
| ---------------------------------- | ---------------------------------------------------- |
| `playwright.config.ts`             | timeout/retry/reporter/browser project define করে    |
| `tests/global-setup.ts`            | test run-এর আগে env, folder, site readiness check    |
| `tests/global-teardown.ts`         | run শেষে cleanup + summary output                    |
| `scripts/setup-ci-environment.ts`  | seed products/orders + WooCommerce API key generate  |
| `src/config/environment.ts`        | env load/validation + `loadWooCommerceCredentials()` |
| `src/pages/login.ts`               | WordPress admin login                                |
| `src/pages/flexorder-setup.ts`     | FlexOrder setup credential flow                      |
| `src/pages/ultimateSettings.ts`    | ultimate settings behavior automation                |
| `src/pages/update-order-status.ts` | Google Sheet status update + WooCommerce sync        |

---

## 7) Maintenance Guide

### A) নতুন test add করবেন যেভাবে

1. `tests/specs/` এ নতুন `feature-name.spec.ts` যোগ করুন
2. দরকার হলে `src/pages/` এ new page method যোগ করুন
3. repeated selector/spec logic না লিখে page object reuse করুন
4. local run করুন: `npm test`

### B) Existing test modify করার rule

1. আগে page object method update করুন
2. তারপর spec expectation update করুন
3. run + report check করুন
4. flaky behavior থাকলে existing retry/wait helper pattern follow করুন

### C) CI update basic guide

1. `.github/workflows/ci-workflow.yml` এ targeted step edit করুন
2. trigger/secret/artifact path মিল আছে কিনা check করুন
3. docker setup → provision → test → cleanup flow না ভেঙে change করুন
4. change validate করতে run/log check করুন

---

## 8) Troubleshooting (Quick)

- **Docker উঠছে না**
  - Docker Desktop open আছে কিনা দেখুন
- **SITE_URL open হচ্ছে না**
  - `docker compose ... ps` দিয়ে status check করুন
- **Login fail**
  - `.env` এ `USER_NAME`/`PASSWORD` ঠিক আছে কিনা দেখুন
- **Admin URL নিয়ে issue**
  - `ADMIN_PANEL_URL`-এ trailing slash (`/wp-admin/`) আছে কিনা দেখুন; না থাকলে redirect বা navigation mismatch হতে পারে
- **License activation fail**
  - `FLEXORDER_PRO_LICENSE_KEY` set আছে কিনা দেখুন
- **Google Sheet test fail**
  - `upload_key.json`, `GOOGLE_SHEET_URL`, `SHEET_NAME` verify করুন
- **CI-তে plugin download fail**
  - GitHub App secrets: `APP_ID`, `APP_PRIVATE_KEY` verify করুন

---

## 9) Real Example (Very Simple)

নতুন teammate run করবে:

1. project folder open
2. `npm ci`
3. `npx playwright install --with-deps chromium`
4. `.env` fill
5. `docker compose -f <project-root>/docker-compose.fresh-wordpress.yml up -d`
6. `npm run setup:ci`
7. `npm test`
8. `npm run test:report`

এতেই full flow execute করা যাবে।
