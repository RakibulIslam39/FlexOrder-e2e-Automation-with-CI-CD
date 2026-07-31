# Playwright Best Practices Skill — Memory & Reference

> Single-source-of-truth memory for the external **`currents-dev/playwright-best-practices-skill`** repository. Use this to look up *what the skill teaches and where* without re-cloning or re-reading the upstream guides.

---

## 0. Header & Disclaimer

- **Source repo:** <https://github.com/currents-dev/playwright-best-practices-skill>
- **Pinned commit at time of analysis:** `ef329e7e65149918e1ff0eed2cf7d2e6e6f9eb5b` (2026-03-13, "fix: disable agnix rule AS-017")
- **License:** MIT
- **Author:** [currents.dev](https://currents.dev)
- **Skill version:** `1.1` (from `SKILL.md` frontmatter)
- **What this repo IS:** an *AI Skill* — a curated bundle of 57 Markdown reference documents plus a `SKILL.md` activity router, installable via `npx skills add ...`, that an AI agent loads on demand when it detects Playwright-related work.
- **What this repo is NOT:**
  - It is **not** a runnable Playwright test project. There is **no** `playwright.config.ts`, **no** `package.json`, **no** `tests/` folder, **no** fixture code, and **no** Page Object class file in this repo.
  - All TypeScript/YAML code in the repo lives only as **snippets inside the markdown guides** — it is reference material, not executable.
- **Implication for this memory:** classic "Test Framework / Setup / Fixtures / POM" sections describe the *guidance the skill provides*, not implementation that exists in the repo.
- **Validated against:** Playwright official docs — <https://playwright.dev/docs/intro>.

---

## 1. Project Overview

The **Playwright Best Practices Skill** is an "activity-based" knowledge pack for AI coding assistants. When the agent infers that the user is doing something Playwright-related (writing E2E tests, debugging flakiness, configuring CI, mocking OAuth, testing iframes, etc.), the skill's `SKILL.md` directs the agent to a small, focused subset of its 57 reference documents.

Key characteristics:

| Aspect            | Value                                                                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Domain            | Playwright (TypeScript) test development, debugging, CI/CD                                                                                  |
| Entry point       | `SKILL.md` (acts as a router via Activity → Reference tables and a Quick Decision Tree)                                                     |
| Trigger model     | Activity inference (no manual invocation; the agent matches the user's intent against the `description:` frontmatter)                       |
| Coverage          | E2E, Component, API, Visual, Accessibility, Security, Performance, i18n, Electron, Browser Extensions, Auth, Mobile, Network, CI/CD, Debug |
| Code language     | TypeScript-first; all snippets target `@playwright/test`                                                                                    |
| Validation        | `agent-sh/agnix` lint runs on every push/PR via `.github/workflows/validate-skill.yml` (rule `AS-017` is disabled in `.agnix.toml`)         |
| Installation      | `npx skills add https://github.com/currents-dev/playwright-best-practices-skill`                                                            |
| Usage philosophy  | Load focused references on demand; the skill pairs with a "Test Validation Loop" (run → fix → re-run → repeat for critical tests)           |

---

## 2. Repository Structure

```
playwright-best-practices-skill/
├── .agnix.toml                          # agnix lint config (disables rule AS-017)
├── .github/
│   └── workflows/
│       └── validate-skill.yml           # CI: runs agent-sh/agnix lint on push/PR to main
├── LICENSE.md                           # MIT
├── README.md                            # Human-facing overview, install, category tables
├── SKILL.md                             # Skill manifest (frontmatter) + activity router + decision tree
├── advanced/                            # 8 deeper-topic guides
│   ├── authentication.md
│   ├── authentication-flows.md
│   ├── clock-mocking.md
│   ├── mobile-testing.md
│   ├── multi-context.md
│   ├── multi-user.md
│   ├── network-advanced.md
│   └── third-party.md
├── architecture/                        # 3 architectural-decision guides
│   ├── pom-vs-fixtures.md
│   ├── test-architecture.md
│   └── when-to-mock.md
├── browser-apis/                        # 4 browser-API guides
│   ├── browser-apis.md
│   ├── iframes.md
│   ├── service-workers.md
│   └── websockets.md
├── core/                                # 10 foundational guides
│   ├── annotations.md
│   ├── assertions-waiting.md
│   ├── configuration.md
│   ├── fixtures-hooks.md
│   ├── global-setup.md
│   ├── locators.md
│   ├── page-object-model.md
│   ├── projects-dependencies.md
│   ├── test-data.md
│   ├── test-suite-structure.md
│   └── test-tags.md                     # (note: 11 files — README counts test-tags as 10th)
├── debugging/                           # 4 debugging guides
│   ├── console-errors.md
│   ├── debugging.md
│   ├── error-testing.md
│   └── flaky-tests.md
├── frameworks/                          # 4 framework-specific guides
│   ├── angular.md
│   ├── nextjs.md
│   ├── react.md
│   └── vue.md
├── infrastructure-ci-cd/                # 9 CI/CD/infra guides
│   ├── ci-cd.md
│   ├── docker.md
│   ├── github-actions.md
│   ├── gitlab.md
│   ├── other-providers.md
│   ├── parallel-sharding.md
│   ├── performance.md
│   ├── reporting.md
│   └── test-coverage.md
└── testing-patterns/                    # 15 specialised pattern guides
    ├── accessibility.md
    ├── api-testing.md
    ├── browser-extensions.md
    ├── canvas-webgl.md
    ├── component-testing.md
    ├── drag-drop.md
    ├── electron.md
    ├── file-operations.md
    ├── file-upload-download.md
    ├── forms-validation.md
    ├── graphql-testing.md
    ├── i18n.md
    ├── performance-testing.md
    ├── security-testing.md
    └── visual-regression.md
```

> `core/` actually contains **11** `.md` files (`test-tags.md` is grouped with core); `README.md`'s "Core" table lists 10 because `test-tags.md` is documented separately. Total reference files **= 57**.

---

## 3. Root Files Summary

| File                                  | Purpose                                                                                                                                              | Key takeaway                                                                                                                                              |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `README.md`                           | Human entry point: ASCII banner, install command, categorised tables of all 57 references, license.                                                  | The "What's Inside" section is the most concise lookup of which folder owns which topic.                                                                   |
| `SKILL.md`                            | Machine entry point. YAML frontmatter (`name`, `description`, `license`, `metadata.author`, `metadata.version: "1.1"`) + activity tables + decision tree + "Test Validation Loop". | Contains the `description:` string used for activity inference and the canonical `Activity → Reference` tables (E2E, Mobile, Browser APIs, Debugging, Errors, Multi-User, Architecture, Frameworks, Refactoring, Infra, Advanced). |
| `LICENSE.md`                          | MIT licence text.                                                                                                                                    | Permissive; safe to study and adapt patterns.                                                                                                              |
| `.agnix.toml`                         | `[rules]` `disabled_rules = ["AS-017"]` — disables one agnix lint rule.                                                                              | Acknowledges a known intentional deviation from the agent-skill linter ruleset.                                                                            |
| `.github/workflows/validate-skill.yml`| Single-job GitHub Actions workflow `Validate AI Skill` → checkout → run `agent-sh/agnix@12a1917…` on push/PR to `main` (`runs-on: ubuntu-latest`).   | Only CI gate; ensures skill metadata stays valid. No Playwright tests are run here.                                                                        |

---

## 4. Skill Activation Triggers (verbatim from `SKILL.md` frontmatter)

The skill auto-activates when the agent detects intents related to:

> writing Playwright tests, fixing flaky tests, debugging failures, implementing Page Object Model, configuring CI/CD, optimizing performance, mocking APIs, handling authentication or OAuth, testing accessibility (axe-core), file uploads/downloads, date/time mocking, WebSockets, geolocation, permissions, multi-tab/popup flows, mobile/responsive layouts, touch gestures, GraphQL, error handling, offline mode, multi-user collaboration, third-party services (payments, email verification), console error monitoring, global setup/teardown, test annotations (skip, fixme, slow), test tags (`@smoke`, `@fast`, `@critical`, filtering with `--grep`), project dependencies, security testing (XSS, CSRF, auth), performance budgets (Web Vitals, Lighthouse), iframes, component testing, canvas/WebGL, service workers/PWA, test coverage, i18n/localization, Electron apps, or browser extension testing. Covers E2E, component, API, visual, accessibility, security, Electron, and extension testing.

This is the **single source the host agent matches user intents against**; if your task isn't in this list, the skill won't auto-activate.

---

## 5. Activity → Reference Map (Quick Decision Tree)

Condensed from `SKILL.md`. Use this whenever you start a Playwright-related task.

| If you are…                                | Read first                                                                                                  |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| Writing a new **E2E** test                 | `core/test-suite-structure.md`, `core/locators.md`, `core/assertions-waiting.md`                            |
| Writing a new **component** test           | `testing-patterns/component-testing.md`, `core/test-suite-structure.md`                                     |
| Writing a new **API** test                 | `testing-patterns/api-testing.md`, `core/test-suite-structure.md`                                           |
| Writing a **GraphQL** test                 | `testing-patterns/graphql-testing.md`, `testing-patterns/api-testing.md`                                    |
| Writing a **visual regression** test       | `testing-patterns/visual-regression.md`, `testing-patterns/canvas-webgl.md`                                 |
| Structuring with **POM**                   | `core/page-object-model.md`, `core/test-suite-structure.md`, `architecture/pom-vs-fixtures.md`              |
| Setting up **fixtures / hooks**            | `core/fixtures-hooks.md`, `core/test-data.md`                                                               |
| Handling **authentication / login**        | `advanced/authentication.md`, `advanced/authentication-flows.md`                                            |
| **Date / time** features                   | `advanced/clock-mocking.md`                                                                                 |
| **File upload / download**                 | `testing-patterns/file-operations.md`, `testing-patterns/file-upload-download.md`                           |
| **Forms / validation**                     | `testing-patterns/forms-validation.md`                                                                      |
| **Drag and drop**                          | `testing-patterns/drag-drop.md`                                                                             |
| **Accessibility**                          | `testing-patterns/accessibility.md`                                                                         |
| **Security** (XSS / CSRF / authz)          | `testing-patterns/security-testing.md`                                                                      |
| **Performance** budgets / Web Vitals       | `testing-patterns/performance-testing.md`                                                                   |
| **i18n** / locales / RTL                   | `testing-patterns/i18n.md`                                                                                  |
| **Electron** apps                          | `testing-patterns/electron.md`                                                                              |
| **Browser extensions**                     | `testing-patterns/browser-extensions.md`                                                                    |
| **iframes**                                | `browser-apis/iframes.md`                                                                                   |
| **Canvas / WebGL / charts**                | `testing-patterns/canvas-webgl.md`                                                                          |
| **WebSocket / real-time**                  | `browser-apis/websockets.md`                                                                                |
| **Geolocation / permissions / clipboard**  | `browser-apis/browser-apis.md`                                                                              |
| **Service workers / PWA / offline**        | `browser-apis/service-workers.md`                                                                           |
| **Multi-tab / popup / OAuth popup**        | `advanced/multi-context.md`, `advanced/third-party.md`                                                      |
| **Multi-user / RBAC / collaboration**      | `advanced/multi-user.md`                                                                                    |
| **Mobile / touch / responsive**            | `advanced/mobile-testing.md`                                                                                |
| **Network interception / HAR**             | `advanced/network-advanced.md`                                                                              |
| **Third-party** (Stripe / OAuth / SMS)     | `advanced/third-party.md`                                                                                   |
| Test is **flaky**                          | `debugging/flaky-tests.md`, then `core/assertions-waiting.md`                                               |
| Test fails / element not found / timeout   | `debugging/debugging.md`, `core/locators.md`, `core/assertions-waiting.md`                                  |
| Test fails only with multiple workers      | `debugging/flaky-tests.md`, `infrastructure-ci-cd/performance.md`, `core/fixtures-hooks.md`                 |
| Console / JS errors                        | `debugging/console-errors.md`, `debugging/debugging.md`                                                     |
| Error states / offline / loading           | `debugging/error-testing.md`                                                                                |
| Choosing **POM vs fixtures**               | `architecture/pom-vs-fixtures.md`                                                                           |
| Choosing **test type** (API/CT/E2E)        | `architecture/test-architecture.md`                                                                         |
| Deciding to **mock vs use real services**  | `architecture/when-to-mock.md`                                                                              |
| **React / Angular / Vue / Next.js** apps   | `frameworks/react.md` / `angular.md` / `vue.md` / `nextjs.md`                                               |
| Configuring **CI/CD**                      | `infrastructure-ci-cd/ci-cd.md`, then provider-specific (`github-actions.md`, `gitlab.md`, …)               |
| **Docker** / containers                    | `infrastructure-ci-cd/docker.md`                                                                            |
| **Sharding / parallel** runs               | `infrastructure-ci-cd/parallel-sharding.md`, `infrastructure-ci-cd/performance.md`                          |
| **Reporting** / artifacts / traces         | `infrastructure-ci-cd/reporting.md`                                                                         |
| **Code coverage**                          | `infrastructure-ci-cd/test-coverage.md`                                                                     |
| **Annotations** (skip/fixme/slow/steps)    | `core/annotations.md`                                                                                       |
| **Tags** (`@smoke`, `@critical`, `--grep`) | `core/test-tags.md`                                                                                         |
| **Global setup / teardown**                | `core/global-setup.md`                                                                                      |
| **Multi-project / dependencies**           | `core/projects-dependencies.md`                                                                             |
| **Test data factories / Faker**            | `core/test-data.md`                                                                                         |
| Writing **Playwright config**              | `core/configuration.md`                                                                                     |

---

## 6. Knowledge Domains — Folder-by-Folder Breakdown

For each file: **Purpose** · **Key Playwright APIs covered** · **Key patterns/snippets** · **Cross-refs**.

### 6.1 `core/` — Foundational guides (11 files)

#### `core/configuration.md` (452 lines)

- **Purpose:** A "production-ready" `playwright.config.ts` template plus environment-specific patterns.
- **Key APIs:** `defineConfig`, `devices`, `use`, `projects`, `webServer`, `expect.timeout`, `retries`, `workers`, `reporter`, `forbidOnly`, `fullyParallel`, `trace`, `screenshot`, `video`, `locale`, `timezoneId`, `actionTimeout`, `navigationTimeout`, `baseURL`, `storageState`.
- **Patterns:** production config; per-`TEST_ENV` (`local|staging|prod`) configs via `dotenv`; setup project + dependencies; `webServer` with build step; tag-based filtering; artifact collection strategy.
- **CLI quick reference** + **Decision Guide** (timeout selection, server management, single vs multi-project, `globalSetup` vs setup-projects vs fixtures) + **Anti-Patterns** + **Troubleshooting** (`baseURL` not working, `webServer` connection refused, CI timeouts, "Target page closed").
- **Cross-refs:** `projects-dependencies.md`, `global-setup.md`, `test-tags.md`, `fixtures-hooks.md`.

#### `core/locators.md` (242 lines)

- **Purpose:** How to pick the most robust selector.
- **Priority order:** `getByRole` → `getByLabel`/`getByPlaceholder` → `getByText`/`getByTitle` → `getByTestId` → `locator('css=…')` / `locator('xpath=…')` (last resort).
- **Key APIs:** `page.getByRole`, `getByLabel`, `getByPlaceholder`, `getByText`, `getByTestId`, `locator`, `filter`, `nth`, `first`, `last`, `frameLocator`, Shadow DOM piercing, `testIdAttribute` config.
- **Patterns:** filter by `hasText`/`hasNotText`/child locator; chaining; dynamic lists; iframes via `frameLocator`; Shadow DOM via Playwright's automatic piercing; debugging locators.
- **Cross-refs:** `assertions-waiting.md`, `debugging/debugging.md`, `browser-apis/iframes.md`.

#### `core/assertions-waiting.md` (361 lines)

- **Purpose:** Web-first assertions and the right way to wait.
- **Key APIs:** `expect(locator).toBeVisible/toHaveText/toHaveValue/toBeChecked/toBeEnabled/toHaveAttribute/toHaveCount`; `expect(page).toHaveURL/toHaveTitle`; `expect(response).toBeOK`; `expect.poll`, `expect.toPass`; `expect.soft`; `page.waitForURL`, `waitForResponse`, `waitForLoadState`, `waitForFunction`; `expect.extend` for custom matchers; per-test/per-action timeouts.
- **Patterns:** locator/page/response assertions; soft assertions with early exit; auto-waiting (default); polling/retrying; custom matchers; configuring timeouts globally/per-test.
- **Cross-refs:** `locators.md`, `debugging/flaky-tests.md`.

#### `core/fixtures-hooks.md` (417 lines)

- **Purpose:** Built-ins, custom typed fixtures, scopes, hooks, auth fixtures, DB fixtures.
- **Key APIs:** `test.extend`, fixture types `<Fixtures>` & `<Options & Fixtures>`, `{ scope: 'worker' }`, `{ option: true }`, `{ auto: true }`; `test.beforeEach/afterEach/beforeAll/afterAll`; `test.describe.configure`; `request`, `page`, `context`, `browser`, `browserName`.
- **Patterns:** basic typed fixture; option-driven fixture (default user); automatic fixture; worker-scoped fixture; isolating data between workers; `globalSetup` storage-state pattern; multiple auth-state fixtures; transaction-rollback DB fixture.
- **Cross-refs:** `page-object-model.md`, `architecture/pom-vs-fixtures.md`, `advanced/authentication.md`, `core/global-setup.md`.

#### `core/page-object-model.md` (315 lines)

- **Purpose:** Encapsulate page interactions.
- **Patterns:** `LoginPage` class with `readonly` locators, `goto`, action methods, assertion helpers; component objects (`NavbarComponent`, `ModalComponent`); composition (page-with-components); page navigation patterns; factory functions; "Do" / "Don't" lists; recommended directory structure (`pages/`, `components/`); using POM with custom fixtures.
- **Cross-refs:** `fixtures-hooks.md`, `architecture/pom-vs-fixtures.md`.

#### `core/test-data.md` (492 lines)

- **Purpose:** Factories, Faker, data-driven testing, DB seeding.
- **Key APIs / deps:** `@faker-js/faker` (`npm install -D @faker-js/faker`), `test.each`-style parametrisation, fixtures wrapping factories, transaction-rollback seeding.
- **Patterns:** basic factory, factory with traits, factory with relationships; Faker with seeded determinism; Faker fixture; CSV/JSON data sources; API-based seeding; transaction rollback.
- **Cross-refs:** `fixtures-hooks.md`, `testing-patterns/api-testing.md`.

#### `core/test-suite-structure.md` (361 lines)

- **Purpose:** Skeleton for a new project: how to lay out E2E / Component / API / Visual tests.
- **Patterns:** `npm init playwright@latest`; minimal `playwright.config.ts`; `tests/e2e/checkout.spec.ts` example; API mocking patterns inside config/test; visual test basics (`toHaveScreenshot`); recommended directory structure; tagging & filtering with `--grep @smoke` etc.
- **Cross-refs:** `configuration.md`, `locators.md`, `assertions-waiting.md`, `test-tags.md`.

#### `core/test-tags.md` (298 lines)

- **Purpose:** Standardised test tags (`@smoke`, `@fast`, `@critical`, `@e2e`, `@api`, `@slow`).
- **Key APIs:** `test('name', { tag: ['@smoke'] }, ...)`, `test.describe('name', { tag: [...] }, ...)`, `--grep`, `--grep-invert`, `playwright.config.ts` `grep` / `grepInvert`, project-specific tagging.
- **Patterns:** tag via details object (recommended) vs via title (not recommended); tagging describe blocks; logical OR/AND in `--grep`; environment-based filtering; PR vs nightly strategy; common tag taxonomy.
- **Cross-refs:** `annotations.md`, `infrastructure-ci-cd/ci-cd.md`.

#### `core/annotations.md` (424 lines)

- **Purpose:** `test.skip`, `test.fixme`, `test.fail`, `test.slow`, `test.step`, custom annotations.
- **Key APIs:** `test.skip()`, `test.skip(condition, reason)`, `test.fixme`, `test.fail`, `test.slow`, `test.step('name', async () => {})`, `testInfo.annotations`, `test.info().annotations.push(...)`.
- **Patterns:** conditional skip; platform skip; describe-level skip; semantic difference between skip / fixme / fail; nested steps; steps with return values; steps inside POMs; custom annotation fixture; reading annotations in custom reporter.
- **Cross-refs:** `test-tags.md`, `infrastructure-ci-cd/reporting.md`.

#### `core/global-setup.md` (434 lines)

- **Purpose:** When (and when not) to use `globalSetup`/`globalTeardown` vs setup-projects vs worker-scoped fixtures.
- **Key APIs:** `globalSetup`/`globalTeardown` config keys; setup project (`testMatch: /.*\.setup\.ts/` + `dependencies: ['setup']`); worker-scoped fixtures.
- **Patterns:** global-setup with return value; access `FullConfig`; conditional teardown; DB migrations & snapshot pattern; per-worker test DB; starting services; Docker Compose orchestration; environment-variable provisioning; comparison table (when to use each); parallel-execution caveats.
- **Cross-refs:** `projects-dependencies.md`, `fixtures-hooks.md`, `configuration.md`.

#### `core/projects-dependencies.md` (453 lines)

- **Purpose:** Multi-browser, multi-environment, dependency-chained projects.
- **Key APIs:** `projects: [...]`, `dependencies: ['setup']`, `teardown: 'cleanup'`, `testMatch`, `testIgnore`, `metadata`, `--project=name`, `--grep`.
- **Patterns:** basic multi-browser; environment-based projects; test-type projects (e2e / api / component); chained dependencies (multiple setups); auth-setup / data-seeding / cleanup setup projects; conditional projects; project metadata; teardown projects; sharing base config via spread.
- **Cross-refs:** `configuration.md`, `global-setup.md`, `advanced/authentication.md`.

---

### 6.2 `debugging/` — 4 files

#### `debugging/debugging.md` (504 lines)

- **Purpose:** Master debugging reference.
- **Key APIs:** `npx playwright test --debug`, `--ui`, `--headed`, `PWDEBUG=1`, Playwright Inspector, `page.pause()`, `expect.configure({ timeout })`, trace viewer (`trace: 'on-first-retry'`, `npx playwright show-trace`), `context.tracing.start/stop`, `page.on('console'|'request'|'response'|'requestfailed')`, `page.waitForResponse`, `testInfo.attach`.
- **Patterns:** Inspector, headed mode, UI mode, in-code debugging; trace viewer (enabling, viewing, programmatic); identifying flaky tests; debugging network (monitor / wait / slow); CI-specific debugging; auth debugging; screenshot diffing; common-issues taxonomy (element not found / timeout / selector / frame); console capture; custom test attachments; troubleshooting checklist by symptom + step-by-step process.
- **Cross-refs:** `flaky-tests.md`, `console-errors.md`, `core/locators.md`, `core/assertions-waiting.md`.

#### `debugging/flaky-tests.md` (496 lines)

- **Purpose:** Flakiness taxonomy and remediation.
- **Categories:** UI-driven, environment-driven, data/parallelism-driven, test-suite-driven (state leak).
- **Key APIs:** `--repeat-each=N`, `--workers=1`, `CI=true`, `trace: 'on-first-retry'`, `video: 'retain-on-failure'`, `screenshot: 'only-on-failure'`, `test.info().retry`, `test.fixme(condition, reason)`.
- **Patterns:** confirming flakiness; reproduction strategies; event logging for races; trace analysis; fixing UI/async/data/state-leak flakes; CI-specific causes; consistent viewport/scale; quarantine pattern; annotation-based quarantine; test burn-in checklist; isolation checklist; defensive assertions; retry budget.
- **Cross-refs:** `debugging.md`, `core/assertions-waiting.md`, `core/fixtures-hooks.md`, `infrastructure-ci-cd/performance.md`.

#### `debugging/error-testing.md` (360 lines)

- **Purpose:** Negative paths — error boundaries, network failures, offline, loading states, validation.
- **Key APIs:** `page.route('**/api/...', route => route.abort('failed'))`, `route.fulfill({ status: 500, body })`, `route.continue()`, `context.setOffline(true)`, `page.on('pageerror')`.
- **Patterns:** component error boundaries; recovery; JS-error capture; API errors; timeouts; connection reset; mid-request failure; offline session + recovery; skeleton/loading/empty states; client / format / server-side validation.
- **Cross-refs:** `console-errors.md`, `advanced/network-advanced.md`, `browser-apis/service-workers.md`.

#### `debugging/console-errors.md` (420 lines)

- **Purpose:** Capture and gate on browser-console / JS errors.
- **Key APIs:** `page.on('console', msg => …)`, `page.on('pageerror')`, `msg.type()` filter, stack-trace via `msg.location()`.
- **Patterns:** basic capture; capture by type; capture with stack trace; fail test on any error; allow-list exceptions; auto-fail fixture; uncaught-exception detection; deprecation/React-dev warning capture; comprehensive console fixture; attaching console output to the report.
- **Cross-refs:** `debugging.md`, `error-testing.md`.

---

### 6.3 `testing-patterns/` — 15 files

#### `testing-patterns/accessibility.md` (359 lines)

- **Deps:** `@axe-core/playwright` (`npm install -D @axe-core/playwright`).
- **Key APIs:** `new AxeBuilder({ page }).analyze()`, `.include(...)`, `.exclude(...)`, `.disableRules(...)`, `page.keyboard.press('Tab')`, `page.keyboard.press('Escape')`, role assertions, focus assertions, `prefers-reduced-motion`, `forced-colors` emulation.
- **Patterns:** basic a11y test; scoped analysis; a11y fixture; detailed violation reporting; tab-order testing; keyboard-only flows; skip-link verification; Escape handling; ARIA role/state verification; live regions; focus-trap testing; focus restoration; high-contrast & reduced-motion media-query tests; CI a11y gate.

#### `testing-patterns/api-testing.md` (719 lines, longest in `testing-patterns/`)

- **Key APIs:** `request` fixture, `request.newContext({ baseURL, extraHTTPHeaders, storageState })`, `request.get/post/put/patch/delete`, `expect(response).toBeOK()`, `response.json()`, `response.headers()`, `response.status()`, multipart upload via `multipart`, schema validation via Zod.
- **Patterns:** authenticated request fixture; CRUD; dedicated API project (no browser); response assertions; API data seeding; error-response testing; file upload via API; chained API calls; Zod schema validation. Decision Guide / Anti-Patterns / Troubleshooting (`ECONNREFUSED`, invalid JSON, 401, CI-only failures).

#### `testing-patterns/component-testing.md` (500 lines)

- **Deps:** `@playwright/experimental-ct-react` / `-ct-vue` / `-ct-svelte` / `-ct-solid`.
- **Key APIs:** `mount(<Component prop=... />)`, `update`, `unmount`, custom wrappers/providers.
- **Patterns:** install per framework; CT config; project structure; mount with props/wrapper; testing prop variations & updates; controlled vs internal state; click/event payload/form-submission/keyboard tests; slot testing (incl. Vue named slots); render-props; mocking imports/API/hooks; framework-specific snippets (React, Vue, Svelte).

#### `testing-patterns/visual-regression.md` (634 lines, longest in folder)

- **Key APIs:** `expect(page).toHaveScreenshot('name.png', { mask, maxDiffPixelRatio, threshold, animations: 'disabled', caret: 'hide', clip, fullPage })`, `--update-snapshots` (`-u`), `expect.configure`, `toMatchSnapshot` for buffers.
- **Patterns:** masking volatile content; disabling animations/font loading; threshold tuning; CI configuration; full-page vs element screenshots; responsive visual testing; component visual testing; updating snapshots; cross-browser visual; troubleshooting (first-CI-run diff, X-pixel diffs, local-vs-CI, animation flakes, naming conflicts, snapshot bloat).

#### `testing-patterns/file-operations.md` (377 lines) & `testing-patterns/file-upload-download.md` (562 lines)

- **Key APIs:** `page.waitForEvent('download')`, `download.saveAs(...)`, `download.path()`, `download.failure()`, `setInputFiles(filePath | filePaths | { name, mimeType, buffer })`, `page.waitForEvent('filechooser')`, `page.dispatchEvent('drop', ...)`.
- **Patterns:** basic up/download; custom path; download content verification (PDF / Excel / JSON); multiple downloads; upload from path/buffer; clear & re-upload; drag-and-drop upload; file-chooser dialog; upload progress/cancellation/retry; file-type/size/count/dimension validation; image preview; authenticated downloads.

#### `testing-patterns/forms-validation.md` (561 lines)

- **Key APIs:** `fill`, `type`, `selectOption`, `setInputFiles`, `check`/`uncheck`, `pressSequentially`, `expect(input).toHaveValue/toHaveAttribute('aria-invalid','true')`, `getByRole('alert')`.
- **Patterns:** auto-complete/typeahead; conditional fields; multi-step wizards; submission & response handling; basic field filling; date/time inputs; required/format validation; reset testing. Troubleshooting (`fill` clears but doesn't type; date pickers; `selectOption` on non-`<select>`; missing validation messages).

#### `testing-patterns/drag-drop.md` (576 lines)

- **Key APIs:** `dragTo`, `mouse.move/down/up`, `dispatchEvent('dragstart'|'drop')`, touch events.
- **Patterns:** Kanban (cross-column); sortable lists; incremental mouse movement for custom libs; native HTML5 DnD; file drop zones; canvas coordinate dragging; custom drag preview; keyboard reorder; cross-frame drag; touch drag.

#### `testing-patterns/graphql-testing.md` (331 lines)

- **Key APIs:** `request.post('/graphql', { data: { query, variables } })`, `page.route('**/graphql', …)` for mocking by `operationName`.
- **Patterns:** basic query w/ variables; mutations; validation/authorization errors; authenticated GraphQL fixture; reusable helper. Troubleshooting (`200 + null data`, schema errors, variables ignored).

#### `testing-patterns/i18n.md` (508 lines)

- **Key APIs:** `use: { locale, timezoneId }`, `extraHTTPHeaders: { 'Accept-Language': 'fr-FR' }`, `page.evaluate(() => Intl.…)`, `expect(page.locator('html')).toHaveAttribute('dir','rtl')`.
- **Patterns:** browser locale config; per-test override; parameterised locale tests; locale-switching flow; RTL layout & visual; bidirectional text; date/number/currency format; missing-translation detection; text-overflow detection; locale-specific snapshots; font-loading.

#### `testing-patterns/electron.md` (509 lines)

- **Deps:** `@playwright/test`, `electron`.
- **Key APIs:** `_electron.launch({ args: ['./main.js'] })`, `electronApp.firstWindow()`, `electronApp.windows()`, `electronApp.evaluate(…)`, `electronApp.on('window')`.
- **Patterns:** install/config; Electron fixture; launch options; dev vs packaged; multi-window; main-process eval; access Node APIs in renderer; context-isolation; IPC testing; mocking IPC handlers; native dialogs/menus/notifications/clipboard; testing packaged apps.

#### `testing-patterns/browser-extensions.md` (506 lines)

- **Key APIs:** `chromium.launchPersistentContext(userDataDir, { args: ['--disable-extensions-except=…','--load-extension=…'] })`, `context.serviceWorkers()`, `context.backgroundPages()`, `chrome.storage`, `chrome.tabs`, `chrome.contextMenus`, `chrome.permissions`.
- **Patterns:** prerequisites; basic CT-style config; extension fixture; Manifest V3 service-worker vs V2 background page; multiple extensions; popup testing; popup state persistence; popup ↔ background messaging; alarms/timers; content-script injection & messaging; Storage / Tabs / ContextMenus / Permissions APIs.

#### `testing-patterns/canvas-webgl.md` (493 lines)

- **Key APIs:** `locator.boundingBox()`, `page.mouse.click(x,y)`, `locator.evaluate((c) => (c as HTMLCanvasElement).toDataURL())`, `expect(locator).toHaveScreenshot()`, `WebGLRenderingContext` checks.
- **Patterns:** locating canvas; canvas screenshot; extracting pixel data; visual comparison & threshold; click/draw on canvas; drag/touch on canvas; WebGL support detection; Three.js; Chart.js / D3 / ECharts; frame-by-frame; game-state testing.

#### `testing-patterns/security-testing.md` (430 lines)

- **Key APIs:** `request.post`, `page.evaluate(() => document.cookie)`, `response.headers()['content-security-policy']`, `page.on('pageerror')`.
- **Patterns:** reflected/stored XSS; XSS execution monitoring; CSRF token presence/validation/with-valid-token; session expiry; concurrent sessions; password-reset security; unauthorized access; IDOR; SQL-injection prevention; input length limits; security headers; CSP violation detection.

#### `testing-patterns/performance-testing.md` (476 lines)

- **Deps:** `playwright-lighthouse`, `lighthouse`, `web-vitals`.
- **Key APIs:** `page.evaluate(() => performance.getEntriesByType(...))`, `PerformanceObserver`, `playwright-lighthouse` integration, custom budget fixture.
- **Patterns:** measure LCP/FID/CLS via inline `web-vitals`; navigation/resource/memory timing; budget definition + assertion fixture; Lighthouse with config; CI tracking; regression detection.

#### `testing-patterns/api-testing.md`, `graphql-testing.md`, `accessibility.md`, `visual-regression.md` — see above.

---

### 6.4 `advanced/` — 8 files

#### `advanced/authentication.md` (871 lines, longest reference in the skill)

- **Key APIs:** `storageState`, `context.storageState({ path })`, project `dependencies`, setup project (`*.setup.ts`), `request.newContext({ baseURL })` for API login, multi-role storage paths (`playwright/.auth/admin.json`, etc.), `auth` fixture pattern, `MFA mocking` via `page.route`.
- **Patterns:** storage-state reuse; global-setup auth; per-worker auth; multi-role; OAuth/SSO mocking; MFA handling; session refresh; `LoginPage` POM; API-based login; unauthenticated tests. Decision Guide (UI vs API vs storage state) + Anti-Patterns + Troubleshooting (target-closed in setup, 401 after a while, empty `storageState`, browser-specific cookies, parallel session interference, OAuth still hits real provider).
- **Cross-refs:** `authentication-flows.md`, `core/projects-dependencies.md`, `core/fixtures-hooks.md`, `advanced/multi-context.md`.

#### `advanced/authentication-flows.md` (360 lines)

- **Patterns:** email-verification (capture token / fully mocked); password reset (complete flow / expired token / strength validation); session timeout (detection / extension warning / extension action); remember-me persistent session vs session-only; logout (standard + all-devices).

#### `advanced/clock-mocking.md` (364 lines)

- **Key APIs:** `page.clock.install({ time })`, `page.clock.fastForward('30:00')`, `page.clock.runFor(1000)`, `page.clock.pauseAt`, `page.clock.resume`, `page.clock.runPendingTimers`, `page.clock.setSystemTime`.
- **Patterns:** install before navigation; clock fixture; date-dependent features; relative-time display; date boundaries; advance time / pause-resume / run pending timers; timezone testing & fixture; mock `setInterval`/`setTimeout`/animation frames; ISO-string convention.

#### `advanced/mobile-testing.md` (409 lines)

- **Key APIs:** `devices['iPhone 14']`, custom `viewport`/`deviceScaleFactor`/`isMobile`/`hasTouch`/`userAgent`, `page.touchscreen.tap`, swipe via `mouse.down/move/up` or touch events, `setViewportSize`.
- **Patterns:** built-in vs custom device; multi-device matrix; tap/swipe (with reusable swipe fixture); long-press; pinch-zoom; viewport tests; dynamic viewport changes; hamburger menu; bottom sheet; pull-to-refresh; visual regression at breakpoints.

#### `advanced/multi-context.md` (288 lines)

- **Key APIs:** `context.waitForEvent('page')`, `page.waitForEvent('popup')`, `browser.newContext({ storageState })`, multiple `Page` instances.
- **Patterns:** basic popup; popup with auth; blocked popups; new tab via link; intercept new tab; OAuth popup (Google) with mock recommendation; OAuth fixture; multi-window across users; tab switching; close-all-but-one.

#### `advanced/multi-user.md` (393 lines)

- **Key APIs:** multiple `BrowserContext`s in one test, distinct `storageState` per role, `Promise.all` for parallel actions.
- **Patterns:** two users in one test; multiple users with auth states; multi-user fixture; collaborative document; cursor presence; RBAC role tests; permission escalation; race-condition testing; optimistic locking; real-time chat.

#### `advanced/network-advanced.md` (452 lines)

- **Key APIs:** `page.route(url, handler)`, `route.continue({ headers, postData })`, `route.fulfill({ status, body, contentType })`, `route.fallback`, `routeFromHAR`, `context.setOffline`, `context.routeFromHAR(file, { update, notFound })`.
- **Patterns:** modify request headers/body; transform response; mock GraphQL by operation name; reusable GraphQL mock fixture; mutation mocking; HAR record/playback (with fallback); conditional mocking by request body; mock Nth request; mock with delay; throttle (slow 3G); offline mode; throttling fixture.

#### `advanced/third-party.md` (464 lines)

- **Patterns:** Google OAuth mock & fixture; SAML SSO; Stripe / PayPal payment mocking + fixture; email verification mock + Mailinator/temp-mail; SMS API mocking; analytics blocking + verification mocking.

---

### 6.5 `browser-apis/` — 4 files

#### `browser-apis/browser-apis.md` (391 lines)

- **Key APIs:** `context.grantPermissions(['geolocation','clipboard-read',…])`, `context.setGeolocation`, `use: { geolocation, permissions }`, `navigator.permissions.query` mocking via `addInitScript`, `getUserMedia` mocking.
- **Patterns:** mock geolocation + fixture; permission denied; permissions API mocking; clipboard copy/paste + fixture; Notification API mock & click; camera/microphone mock; media-device selection & errors.

#### `browser-apis/iframes.md` (403 lines)

- **Key APIs:** `frameLocator`, `frame()`, `page.frames()`, `page.waitForEvent('frameattached'|'framenavigated')`.
- **Patterns:** `frameLocator` vs `Frame`; cross-origin iframes (Stripe / PayPal / OAuth); nested frames; dynamic iframes (runtime / changing src / lazy-loaded); navigating within an iframe; iframe fixture; debugging; mocking iframe content.

#### `browser-apis/service-workers.md` (504 lines)

- **Key APIs:** `context.serviceWorkers()`, `context.on('serviceworker')`, `context.setOffline(true)`, `context.routeFromHAR`, `caches` API checks.
- **Patterns:** wait for SW registration; SW state; SW update flow; install testing; unregistering; cache verification & strategies; cache updates; offline simulation & fallback; offline form submission queue; mocking push subscription; testing push handler; notification click; background sync register/event.

#### `browser-apis/websockets.md` (403 lines)

- **Key APIs:** `page.on('websocket')`, `ws.on('framesent'|'framereceived'|'close')`, `page.evaluate(() => new WebSocket(...))`, EventSource for SSE.
- **Patterns:** wait for WS connection; monitor in/out frames; mock messages via `page.evaluate`; mock WS via route handler; reusable WS-mock fixture; live notifications; live data; collaborative editing; SSE updates; multi-event SSE; reconnection testing.

---

### 6.6 `architecture/` — 3 decision guides

#### `architecture/pom-vs-fixtures.md` (363 lines)

- Comparison matrix (Page Objects vs Custom Fixtures vs Helper Functions): purpose, lifecycle, composability, "best for".
- Selection flowchart with decision rules ("5+ interactions in 3+ files → POM", "needs setup AND teardown → fixture", "stateless utility → helper").
- Page Objects (with `BookingPage` example), Custom Fixtures, Helper Functions, Combined project structure, Anti-patterns (page object managing resources, locator-only POs, monolithic fixtures, helpers with side effects, over-abstracting).

#### `architecture/test-architecture.md` (369 lines)

- "Test pyramid for Playwright": API (60%) / Component (30%) / E2E (10%).
- Decision matrix per test type (speed, reliability, scope, maintenance cost).
- Layering, execution profile, common mistakes ("E2E for everything", duplicating coverage, etc.).

#### `architecture/when-to-mock.md` (383 lines)

- "Mock vs real services" decision matrix and flowchart.
- Techniques: blocking unwanted requests, full mock (`route.fulfill`), partial mock (modify response), record/replay (HAR).
- Real strategies: local dev server, staging, test containers.
- Hybrid approach (fixture-controlled mock toggle); environment-based test projects; validating mock accuracy; anti-patterns.

---

### 6.7 `frameworks/` — 4 framework guides

| File          | Purpose                                                                                                                                                                                                                                                                                                                                          |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `react.md`    | Context/global-state, React Router, hook testing through UI, RHF/Formik patterns, Portals (modals/tooltips), Error Boundaries, experimental CT, Vite vs CRA configs, StrictMode double-effects, Suspense/Lazy, memory-leak detection, anti-patterns.                                                                                              |
| `angular.md`  | Reactive Forms, Material components, Router, lazy-loaded modules, Signals & Observables, Zone.js / change detection, SSR testing, Protractor migration reference, build configurations, CDK overlay container, anti-patterns.                                                                                                                    |
| `vue.md`      | Vue+Vite & Nuxt 3 configs, experimental CT (`@playwright/experimental-ct-vue`), Pinia store testing through UI, Vue Router, `<Teleport>`, transitions/animations, Composition API, Nuxt-specific patterns, v-model, capturing Vue warnings, anti-patterns.                                                                                       |
| `nextjs.md`   | `webServer` config, env-vars (`.env.test`, `.env.test.local`), App Router vs Pages Router patterns, dynamic routes, API routes (direct + through UI), middleware (auth redirects, security headers, locale rewrites), hydration error detection, `next/image`, NextAuth setup project, dev vs production build, Turbopack, multiple webServers. |

---

### 6.8 `infrastructure-ci-cd/` — 9 files

#### `infrastructure-ci-cd/ci-cd.md` (468 lines)

- **Purpose:** Generic CI integration overview.
- **Patterns:** GitHub Actions basic / sharded / containerised; Dockerfile + docker-compose; reporter config; CI-specific reporter (`['blob']` for sharding); sharding via `--shard` + `npx playwright merge-reports`; env management & secrets; caching browsers (`~/.cache/ms-playwright`) & node_modules; tag-based filtering for PR vs nightly; project-based filtering.

#### `infrastructure-ci-cd/github-actions.md` (546 lines)

- **Workflows:** basic; sharded; container-based; environment-based (staging) with secrets; scheduled nightly; reusable workflow.
- **Scenario guide + common mistakes + troubleshooting** ("Missing dependencies", local-vs-CI timeouts, incomplete sharded reports, port conflicts, missing PR annotations).

#### `infrastructure-ci-cd/gitlab.md` (397 lines)

- `.gitlab-ci.yml` patterns: basic, sharded, env vars/secrets, multi-browser matrix, services (Postgres/Redis), nightly schedule.
- Troubleshooting: launch failures, navigation timeouts, MR-only triggers, services not reachable, empty merged report.

#### `infrastructure-ci-cd/other-providers.md` (521 lines)

- **Jenkins:** declarative pipeline, parallel shards.
- **CircleCI:** basic, with orbs.
- **Azure DevOps:** basic, with sharding.
- JUnit reporter config; platform comparison table; troubleshooting per provider.

#### `infrastructure-ci-cd/docker.md` (283 lines)

- Official `mcr.microsoft.com/playwright` image usage; custom Dockerfile; docker-compose stack (app + db + tests); CI container jobs; dev container.
- Troubleshooting: "Executable doesn't exist", `ERR_CONNECTION_REFUSED`, mounted-volume permissions, slow macOS/Windows containers.

#### `infrastructure-ci-cd/parallel-sharding.md` (371 lines)

- CLI: `--workers`, `--shard=k/N`, `npx playwright merge-reports`.
- Patterns: worker config; sharding across CI machines; merging shard reports (HTML / multi-format / custom path); worker-scoped fixtures; isolation for parallelism; dynamic shard count.
- Troubleshooting: solo-passes-but-not-together, "no tests found", missing merged results, broken worker fixture, more-workers-slower.

#### `infrastructure-ci-cd/performance.md` (453 lines)

- Patterns: parallel execution config; serial execution when needed (`test.describe.serial`); parallel projects; sharding; reuse-auth; reuse-page-state (with isolation trade-off); lazy navigation; skip-unnecessary-setup; mock APIs; block resource types; cache responses; isolation patterns; resource management (contexts / memory / timeouts); benchmarking; Lighthouse integration; performance checklist.

#### `infrastructure-ci-cd/reporting.md` (424 lines)

- CLI: `npx playwright show-report`, `--reporter=`, `npx playwright merge-reports --reporter=html ./blob-reports`.
- Reporters: `list`, `line`, `dot`, `html`, `json`, `junit`, `blob`, `github`, custom.
- Custom reporter implementation; trace config & viewing (`https://trace.playwright.dev`); screenshot/video options; artifact directory layout; CI artifact upload; troubleshooting (empty HTML report, traces too large, JUnit not recognised, empty merged report, missing screenshots).

#### `infrastructure-ci-cd/test-coverage.md` (497 lines)

- V8 coverage (built-in) vs Istanbul (`nyc`, `@istanbuljs/nyc-config-typescript`).
- Coverage fixture; per-test coverage; per-file coverage; CSS coverage; converting V8→Istanbul; HTML report via `nyc`; custom coverage reporter; thresholds (overall + per-directory); merging across shards; incremental coverage; CI integration.

---

## 7. Mapped Sections (your original required sections, applied to this skill repo)

### 7.1 Test Framework Architecture *(as taught by the skill)*

- **Layered test pyramid** (`architecture/test-architecture.md`): API ≈ 60%, Component ≈ 30%, E2E ≈ 10%.
- **Reusable code organisation** (`architecture/pom-vs-fixtures.md`):
  - **Page Object** when ≥5 interactions and used in ≥3 files.
  - **Custom Fixture** when there is a setup AND teardown lifecycle.
  - **Helper function** for stateless utilities.
- **Recommended directory** (`core/page-object-model.md`, `core/test-suite-structure.md`):
  ```
  e2e/
    *.spec.ts
    *.setup.ts
  pages/                # Page Objects
  components/           # Component Objects
  fixtures/             # Custom typed fixtures
  helpers/              # Stateless utilities
  data/                 # Factories / test data
  playwright/.auth/     # storageState files (gitignored except .gitkeep)
  ```

### 7.2 Playwright Setup and Configuration *(distilled from `core/configuration.md` + `core/test-suite-structure.md`)*

- Bootstrap: `npm init playwright@latest`.
- Production-ready `playwright.config.ts` template includes:
  - `testDir`, `testMatch`, `fullyParallel: true`, `forbidOnly: !!process.env.CI`, `retries: process.env.CI ? 2 : 0`, `workers: process.env.CI ? '50%' : undefined`.
  - `reporter`: HTML (`open: 'never'` in CI) + `github` reporter in CI; `html` (`open: 'on-failure'`) locally.
  - `timeout: 30_000`, `expect.timeout: 5_000`, `actionTimeout: 10_000`, `navigationTimeout: 15_000`.
  - `use`: `baseURL`, `trace: 'on-first-retry'`, `screenshot: 'only-on-failure'`, `video: 'retain-on-failure'`, `locale`, `timezoneId`.
  - `projects`: at minimum `chromium`/`firefox`/`webkit` + `mobile-chrome`/`mobile-safari` via `devices`.
  - `webServer`: `command`, `url`, `reuseExistingServer: !process.env.CI`, `timeout: 120_000`.
- Environment switching via `dotenv` and `process.env.TEST_ENV` (`local|staging|prod`).
- `webServer` may include a build step.

### 7.3 Fixtures and Hooks *(distilled from `core/fixtures-hooks.md`)*

- Built-in fixtures: `page`, `context`, `browser`, `browserName`, `request`.
- Custom fixtures via `test.extend<MyFixtures>({ ... })`; pattern is `async ({ deps }, use) => { setup; await use(value); teardown; }`.
- **Scopes:** `test` (default) and `worker` (`{ scope: 'worker' }`).
- **Options:** `[default, { option: true }]` makes a fixture overridable in `playwright.config.ts` `use:`.
- **Automatic fixtures:** `[fn, { auto: true }]` runs without being requested.
- **Hooks:** `test.beforeEach/afterEach/beforeAll/afterAll`, `test.describe.configure({ mode: 'serial' | 'parallel' })`.
- **Authentication fixture pattern:** prefer `storageState` + setup project + project `dependencies` over per-test login.
- **DB fixtures:** transaction-rollback for isolation; per-worker DB or schema for parallelism.

### 7.4 Page Objects / Utilities / Helpers *(distilled from `core/page-object-model.md` + `architecture/pom-vs-fixtures.md`)*

- **POM principles:**
  - `readonly page: Page` + `readonly <name>: Locator` properties initialised in constructor.
  - Action methods (`login(email, password)`), navigation methods (`goto`), assertion helpers (`expectError(msg)`).
  - **Do:** locate in constructor; expose actions; group with `test.step`; assert at the end of methods.
  - **Don't:** put pure locator getters with no logic; inherit deeply; manage external resources (use a fixture instead).
- **Component Objects:** mirror reusable UI fragments (`NavbarComponent`, `ModalComponent`).
- **Composition:** page-with-components — page constructs and exposes its sub-components.
- **Helpers:** stateless utilities (`randomEmail()`, `formatPrice()`, `buildUrl()`).

### 7.5 Test Data Management *(distilled from `core/test-data.md`)*

- Use **factory functions** that produce one entity with sensible defaults + an overrides arg.
- Use **traits** to compose variants (`adminUser()`, `bannedUser()`).
- Use **`@faker-js/faker`** for realistic data; **seed** Faker for reproducibility (`faker.seed(testInfo.workerIndex)`).
- Wrap factories in fixtures so each test gets its own instance.
- For data-driven tests: iterate arrays + `test('case ' + i, …)` (no `test.each` in Playwright; use plain loops).
- DB seeding: prefer **API-based seeding** (uses public surface) over direct DB writes; use **transaction rollback** for DB integration tests.

### 7.6 Authentication / Login Flow *(distilled from `advanced/authentication.md` + `advanced/authentication-flows.md`)*

- **Default pattern:** setup project `*.setup.ts` logs in once → saves `storageState` to `playwright/.auth/<role>.json` → other projects depend on `setup` and `use: { storageState }`.
- **Per-worker auth** via worker-scoped fixture for parallel-safe state.
- **Multiple roles:** one storage file per role (`admin.json`, `user.json`, `guest.json`).
- **API login** > UI login when feasible (faster, more reliable).
- **OAuth/SSO:** mock the IdP via `page.route` rather than driving the real provider; if real OAuth is required, see `advanced/multi-context.md` for popup handling.
- **MFA:** intercept the OTP endpoint and inject a known code OR mock the verification endpoint.
- **Complex flows:** email verification (capture token from mock email API), password reset (complete + expired token), session timeout (extension warning + action), remember-me persistent vs session-only, logout (standard + all-devices).

### 7.7 API / Network Handling *(distilled from `testing-patterns/api-testing.md`, `graphql-testing.md`, `advanced/network-advanced.md`)*

- **`request` fixture** is the API client (`request.get/post/put/patch/delete`); for parallel-safe API tests create a context with `request.newContext({ baseURL, extraHTTPHeaders, storageState })`.
- **Schema validation:** Zod (`schema.parse(await response.json())`).
- **Network interception:** `page.route(pattern, handler)` with `route.continue` / `route.fulfill` / `route.abort` / `route.fallback`.
- **HAR:** `context.routeFromHAR(file, { update, notFound: 'fallback' })` for record/replay.
- **GraphQL:** mock by `operationName` parsed from `request.postDataJSON()`.
- **Throttling/offline:** `context.setOffline(true)`; for slow 3G, intercept and add `await new Promise(r => setTimeout(r, ...))`.
- **Error responses:** test 4xx/5xx; assert UI fallback / retry behaviour.

### 7.8 Environment / Config Notes *(distilled from `core/configuration.md`, `core/projects-dependencies.md`, `core/global-setup.md`)*

- `.env` strategy: commit `.env.example`; gitignore `.env.local`, `.env.staging`, `.env.production`.
- `globalSetup` returns an object passed to tests (use sparingly — prefer setup projects).
- Setup projects via `testMatch: /.*\.setup\.ts/` + `dependencies: ['setup']` are usually preferable because they participate in retries/sharding.
- Dependencies can chain (`['auth-setup', 'data-seed']`), and a `teardown:` project can run after dependents.

### 7.9 Reporting and Debugging *(distilled from `infrastructure-ci-cd/reporting.md` + `debugging/*`)*

- **Reporters:** `list` (default local), `line`/`dot` for CI noise, `html` (with `open: 'never'` in CI), `json`, `junit`, `blob` (for sharding), `github` (PR annotations), custom (`Reporter` interface).
- **Trace viewer:** `npx playwright show-trace <path>` or <https://trace.playwright.dev>; default policy `trace: 'on-first-retry'`.
- **Sharded merge:** save `blob` reports per shard, then `npx playwright merge-reports --reporter=html ./blob-reports`.
- **Debug tools:** Playwright Inspector (`PWDEBUG=1` or `--debug`), UI mode (`--ui`), `--headed`, `page.pause()`, `npx playwright codegen`.
- **Flakiness reproduction:** `--repeat-each=N`, `--workers=1`, `CI=true` locally; check `testInfo.retry` to log flaky passes.
- **Debugging checklist (from `debugging/debugging.md`):** by symptom (element not found → locator/wait), step-by-step process, network monitoring (`page.on('request')`), CI-specific differences, screenshot/visual diff comparison.

### 7.10 Commands to Run Tests *(commands the skill consistently uses)*

```bash
# Run / target
npx playwright test                              # all tests
npx playwright test tests/checkout.spec.ts       # single file
npx playwright test --project=chromium           # specific project
npx playwright test --grep @smoke                # by tag
npx playwright test --grep-invert @slow          # exclude tag
npx playwright test --workers=1                  # serialise
npx playwright test --repeat-each=20             # confirm stability
npx playwright test --shard=1/4                  # split for CI

# Modes
npx playwright test --headed                     # visible browser
npx playwright test --debug                      # Inspector
npx playwright test --ui                         # UI mode
PWDEBUG=1 npx playwright test                    # alt inspector trigger
CI=true npx playwright test                      # CI mode locally

# Snapshots & traces & reports
npx playwright test --update-snapshots           # update visual snapshots
npx playwright show-trace path/to/trace.zip
npx playwright show-report
npx playwright merge-reports --reporter=html ./blob-reports

# Tooling
npx playwright codegen https://example.com
npx playwright install
npx playwright install --with-deps
```

### 7.11 Important Dependencies (mentioned across the skill)

| Package                             | Used in                                       | Purpose                                                |
| ----------------------------------- | --------------------------------------------- | ------------------------------------------------------ |
| `@playwright/test`                  | Everywhere                                    | Core test runner                                       |
| `@playwright/experimental-ct-react` | `frameworks/react.md`, `component-testing.md` | React component testing                                |
| `@playwright/experimental-ct-vue`   | `frameworks/vue.md`                           | Vue/Nuxt component testing                             |
| `@playwright/experimental-ct-svelte`| `component-testing.md`                        | Svelte CT                                              |
| `@playwright/experimental-ct-solid` | `component-testing.md`                        | Solid CT                                               |
| `electron`                          | `testing-patterns/electron.md`                | Electron app under test                                |
| `@axe-core/playwright`              | `accessibility.md`                            | Axe-core a11y scanner                                  |
| `@faker-js/faker`                   | `core/test-data.md`                           | Realistic test data                                    |
| `playwright-lighthouse`, `lighthouse` | `performance-testing.md`                    | Lighthouse audits                                      |
| `dotenv`                            | `core/configuration.md`                       | Loading `.env*` files                                  |
| `nyc`, `@istanbuljs/nyc-config-typescript` | `infrastructure-ci-cd/test-coverage.md` | Istanbul-based coverage reporting                      |
| `web-vitals` (referenced inline)    | `performance-testing.md`                      | LCP/FID/CLS measurement script in the page             |
| `zod` (implied via "Schema Validation with Zod") | `testing-patterns/api-testing.md`  | Runtime schema validation of API responses             |

> The skill does **not** ship a `package.json`; these are the libraries an actual project would install based on the patterns shown.

---

## 8. Coding Conventions Used in the Skill

- **TypeScript-first.** All snippets use `import { test, expect } from '@playwright/test'`.
- **Web-first assertions only.** No `await page.waitForTimeout()` in primary patterns; `expect(locator).toBe...` instead.
- **No hard waits.** Use `expect.poll`, `expect.toPass`, `waitForLoadState`, `waitForResponse`, `waitForFunction`.
- **Locator priority:** `getByRole` > `getByLabel`/`getByPlaceholder` > `getByText`/`getByTitle` > `getByTestId` > raw CSS/XPath.
- **`test.describe`** for grouping; `test.step` for sub-step reporting.
- **Tags via details object:** `test('name', { tag: ['@smoke','@critical'] }, async ({ page }) => {...})`.
- **POM constructor wires locators**, never methods that re-query on each call (locators are lazy already).
- **Setup projects** preferred over `globalSetup` for parallel-friendly auth.
- **Fixtures own lifecycle** (setup + teardown); helpers stay stateless.
- **CI flags every config:** `forbidOnly: !!process.env.CI`, `retries: process.env.CI ? 2 : 0`.
- **Artifacts on first retry:** `trace: 'on-first-retry'`, `screenshot: 'only-on-failure'`, `video: 'retain-on-failure'`.
- **Mock at the boundary** (`page.route` / `request`), not inside the page.
- Each guide ends with **Anti-Patterns** + (often) **Troubleshooting** sections — read them before implementing.

---

## 9. How to Use This Skill for New Automation Tasks

(Replaces the original "How to add new test cases / page objects / reuse components" sections — those don't apply because this repo has no codebase to add to.)

1. **Identify the activity** from §4 (Skill Activation Triggers).
2. **Use the Activity → Reference map** (§5) to find the 1–3 reference files that apply.
3. **Read the matching `.md` file(s)** before writing any code; pay particular attention to the file's `Anti-Patterns` and `Troubleshooting` sections.
4. **Mirror the pattern** in your project's actual repo. Adapt selectors, URLs, and data to your app.
5. **Run the Test Validation Loop** from `SKILL.md`:
   1. `npx playwright test --reporter=list`
   2. On failure: review trace (`npx playwright show-trace`), fix locators / waits / assertions, re-run.
   3. Only proceed when all tests pass.
   4. For critical paths, run multiple times: `npx playwright test --repeat-each=5`.
6. **Tag the test** appropriately (`@smoke`, `@critical`, `@slow`, …) so CI filtering works.
7. **If flaky:** jump to `debugging/flaky-tests.md` and walk the decision tree.

---

## 10. Risks / Gaps / Missing Areas

- **No BDD / Cucumber layer.** The skill assumes Playwright Test as the runner; `@cucumber/cucumber`, `playwright-bdd`, etc. are not covered.
- **No SaaS dashboard guidance.** The skill is published by Currents.dev but does not contain a Currents-specific reference; integration with `currents.dev`, `@currents/playwright`, or other test orchestration platforms is not documented.
- **No Playwright MCP guidance.** The skill predates / does not mention Playwright MCP (`https://playwright.dev/docs/intro` lists MCP under "Getting Started"), even though MCP is now a first-class workflow.
- **CI providers covered:** GitHub Actions (deepest), GitLab, Jenkins, CircleCI, Azure DevOps, Docker. **Not covered:** Buildkite, Bitbucket Pipelines, TeamCity, Drone, Bamboo, AWS CodeBuild beyond generic Docker.
- **Cloud runners:** No vendor-specific guidance (BrowserStack, Sauce Labs, LambdaTest, Microsoft Playwright Testing service).
- **Reporters:** No first-class section on third-party reporters (Allure, Currents, ReportPortal, Slack).
- **Disabled lint rule:** `.agnix.toml` disables `AS-017`; the meaning of that rule is not documented in the repo.
- **Version pinning:** snippets do not pin a specific Playwright version; readers must rely on current docs for new APIs (e.g., `page.clock`, `expect.configure`).
- **Limited Mobile Safari touch coverage** — the skill notes Playwright's touch emulation has limits compared to real iOS testing.
- **No accessibility-snapshot APIs** (the new `aria-snapshot` family) are mentioned.
- **Parts of `architecture/when-to-mock.md` and `architecture/test-architecture.md`** are opinionated decision frameworks; teams with different testing pyramids may need to adapt.

---

## 11. Recommendations (validated against <https://playwright.dev/docs/intro>)

> Each item below is a **suggested improvement** for any team adopting this skill in their own codebase — *not* something already implemented in the upstream repo.

- **Recommendation:** Add a short `mcp.md` (or section in `core/configuration.md`) covering Playwright MCP and `npx @playwright/mcp@latest`, since MCP is now a primary workflow on the official docs.
- **Recommendation:** When mirroring `core/configuration.md` into your project, also pin `@playwright/test` to the latest LTS Node-supported version (Node 20.x / 22.x / 24.x per official system requirements) and run `npx playwright install --with-deps` in CI.
- **Recommendation:** Adopt the official **`expect(locator).toBeVisible()` first** pattern before any action when targeting slow or animated pages — the skill teaches auto-waiting (which works) but explicit pre-assertions surface failures earlier in traces.
- **Recommendation:** Use the **`html` reporter with `open: 'never'`** plus the `github` reporter in CI (matches `core/configuration.md`) and upload `playwright-report/` as an artifact for every run.
- **Recommendation:** Combine `trace: 'on-first-retry'` with `--ui` mode locally (Playwright's recommended interactive workflow) instead of `console.log` debugging.
- **Recommendation:** For visual regression, follow Playwright's recommendation to **always run snapshot generation in the same OS as CI** (Docker locally) to avoid the platform-diff problem the skill flags in `visual-regression.md` Troubleshooting.
- **Recommendation:** When you adopt the skill in a TS project, also enable **strict TypeScript** (`"strict": true` in `tsconfig.json`) — the skill's snippets assume strict typing.
- **Recommendation:** Pair `@axe-core/playwright` with the official **`aria-snapshot`** assertions (newer Playwright) for richer a11y coverage than axe-only.
- **Recommendation:** Adopt **trace.playwright.dev** as a team bookmark; it makes sharing failure traces in PR reviews effortless.
- **Recommendation:** Add an **explicit `expect.configure({ timeout })`** for slow-but-deterministic flows instead of bumping global `expect.timeout` (keeps default tight).
- **Recommendation:** When using the skill alongside Currents.dev or a similar dashboard, add `@currents/playwright` (or vendor equivalent) as an additional reporter to capture cross-run analytics — the skill does not cover this.

---

## 12. Quick Start Guide for New Automation Tasks

A 7-step checklist to apply whenever you start a new Playwright task in a project that uses this skill:

1. **Classify the task** — match the user intent against §4 triggers.
2. **Open the right reference** — use §5 Activity → Reference map.
3. **Skim the file's TOC + Anti-Patterns + Troubleshooting** before writing code.
4. **Implement** — copy the closest snippet, adapt to your selectors/data.
5. **Tag** the test (`@smoke` / `@critical` / `@slow`).
6. **Run the Validation Loop** — `npx playwright test --reporter=list`; on flake, `--repeat-each=5`.
7. **Inspect the trace** (`npx playwright show-trace`) for any failure before fixing.

---

## 13. Appendix A — Full File Index (alphabetised)

| Path                                             | Lines | One-line summary                                                                                                |
| ------------------------------------------------ | ----- | --------------------------------------------------------------------------------------------------------------- |
| `.agnix.toml`                                    | 2     | Disables agnix lint rule `AS-017`.                                                                              |
| `.github/workflows/validate-skill.yml`           | 18    | Single CI job; runs `agent-sh/agnix` lint on push/PR to `main`.                                                 |
| `LICENSE.md`                                     | —     | MIT licence.                                                                                                    |
| `README.md`                                      | 147   | Human entry point: install + categorised tables of all 57 references.                                           |
| `SKILL.md`                                       | 304   | Machine entry point: frontmatter + Activity → Reference tables + decision tree + Test Validation Loop.          |
| `advanced/authentication.md`                     | 871   | Storage-state, multi-role, per-worker auth, OAuth/SSO mocking, MFA, troubleshooting.                            |
| `advanced/authentication-flows.md`               | 360   | Email verification, password reset, session timeout, remember-me, logout patterns.                              |
| `advanced/clock-mocking.md`                      | 364   | `page.clock` API, fixed time, advance/pause, timezone, timer/interval/animation-frame mocking.                  |
| `advanced/mobile-testing.md`                     | 409   | `devices`, custom mobile profile, tap/swipe/pinch, viewport tests, mobile UI patterns.                          |
| `advanced/multi-context.md`                      | 288   | Popups, new tabs, OAuth popups, multi-window, tab switching/coordination.                                       |
| `advanced/multi-user.md`                         | 393   | Multiple contexts in one test, RBAC, real-time collaboration, race conditions, optimistic locking.              |
| `advanced/network-advanced.md`                   | 452   | `page.route` modify/transform, GraphQL mocks, HAR record/replay, throttling, conditional/Nth-request mocking.   |
| `advanced/third-party.md`                        | 464   | Mocking Google OAuth, SAML, Stripe, PayPal, email verification, SMS, analytics.                                  |
| `architecture/pom-vs-fixtures.md`                | 363   | When to use Page Objects vs Custom Fixtures vs Helper Functions.                                                 |
| `architecture/test-architecture.md`              | 369   | Test pyramid: 60% API / 30% Component / 10% E2E.                                                                |
| `architecture/when-to-mock.md`                   | 383   | Mock vs real services decision matrix; HAR; hybrid fixture-controlled mocking.                                   |
| `browser-apis/browser-apis.md`                   | 391   | Geolocation, permissions, clipboard, notifications, camera/microphone mocking.                                   |
| `browser-apis/iframes.md`                        | 403   | `frameLocator`, cross-origin, nested, dynamic, navigation, iframe fixtures.                                      |
| `browser-apis/service-workers.md`                | 504   | SW registration, lifecycle, cache, offline, push notifications, background sync.                                 |
| `browser-apis/websockets.md`                     | 403   | WS connect/monitor, mocking via `page.evaluate` or routes, SSE, reconnection.                                    |
| `core/annotations.md`                            | 424   | `test.skip/fixme/fail/slow`, `test.step`, custom annotations & reporter integration.                             |
| `core/assertions-waiting.md`                     | 361   | Web-first assertions, `expect.poll`, `expect.toPass`, soft, custom matchers, timeouts.                           |
| `core/configuration.md`                          | 452   | Production-ready `playwright.config.ts`, env-based config, troubleshooting.                                       |
| `core/fixtures-hooks.md`                         | 417   | Built-in / custom / option / automatic / worker-scoped fixtures, hooks, auth + DB patterns.                       |
| `core/global-setup.md`                           | 434   | `globalSetup`/teardown vs setup-projects vs worker fixtures; DB & service orchestration.                          |
| `core/locators.md`                               | 242   | Locator priority order, filter/chain, dynamic, Shadow DOM, iframes, debugging.                                    |
| `core/page-object-model.md`                      | 315   | POM basics, component objects, composition, factories, do/don't, directory structure.                              |
| `core/projects-dependencies.md`                  | 453   | Multi-browser projects, dependencies, setup/teardown projects, env-based projects, conditional.                    |
| `core/test-data.md`                              | 492   | Factories, traits, relationships, Faker (incl. seeded), data-driven, DB seeding & rollback.                        |
| `core/test-suite-structure.md`                   | 361   | Project bootstrap, essential config, E2E/Component/API/Visual examples, directory.                                  |
| `core/test-tags.md`                              | 298   | `@tag` via details object, group tagging, OR/AND filters, env-based filtering, taxonomy.                            |
| `debugging/console-errors.md`                    | 420   | Capture/filter console messages, fail on errors, allow-lists, comprehensive console fixture.                       |
| `debugging/debugging.md`                         | 504   | Inspector, UI mode, headed, trace viewer, network debug, CI debug, common-issues taxonomy.                          |
| `debugging/error-testing.md`                     | 360   | Error boundaries, network failures, offline, loading/empty states, validation testing.                              |
| `debugging/flaky-tests.md`                       | 496   | Flakiness taxonomy, reproduction, fixes per type, CI causes, quarantine, prevention.                                |
| `frameworks/angular.md`                          | 530   | Angular config, locator strategies, Reactive Forms, Material, Router, Signals, Zone.js, SSR.                         |
| `frameworks/nextjs.md`                           | 469   | Next config (`webServer`), App vs Pages Router, dynamic routes, API routes, middleware, NextAuth.                     |
| `frameworks/react.md`                            | 531   | Context/state, RR, hooks, RHF/Formik, Portals, Error Boundaries, CT, Strict Mode, Suspense.                            |
| `frameworks/vue.md`                              | 574   | Vue+Vite & Nuxt 3, CT, Pinia, Vue Router, Teleport, transitions, Composition API, v-model.                              |
| `infrastructure-ci-cd/ci-cd.md`                  | 468   | Generic CI overview: GH Actions / Docker / reporting / sharding / env / caching / tag-based filtering.                  |
| `infrastructure-ci-cd/docker.md`                 | 283   | Official image, custom Dockerfile, docker-compose, CI container jobs, dev container, troubleshooting.                    |
| `infrastructure-ci-cd/github-actions.md`         | 546   | Basic / sharded / containerised / scheduled / reusable workflows + scenario guide + troubleshooting.                       |
| `infrastructure-ci-cd/gitlab.md`                 | 397   | `.gitlab-ci.yml`: basic, sharded, env, multi-browser matrix, services, nightly, troubleshooting.                            |
| `infrastructure-ci-cd/other-providers.md`        | 521   | Jenkins (declarative + parallel shards), CircleCI (basic + orbs), Azure DevOps (basic + sharding).                          |
| `infrastructure-ci-cd/parallel-sharding.md`      | 371   | Worker config, sharding across machines, merge-reports, worker-scoped fixtures, dynamic shard count.                          |
| `infrastructure-ci-cd/performance.md`             | 453   | Parallel/serial, sharding, reuse-auth/page-state, network optimisation, isolation, benchmarking, Lighthouse.                  |
| `infrastructure-ci-cd/reporting.md`               | 424   | Reporters, custom reporter, trace config & viewing, screenshots/videos, artifact upload, troubleshooting.                      |
| `infrastructure-ci-cd/test-coverage.md`           | 497   | V8 vs Istanbul coverage, fixture, per-file/CSS, conversion, HTML report, thresholds, shard merge, CI.                            |
| `testing-patterns/accessibility.md`               | 359   | `@axe-core/playwright`, scoped scans, a11y fixture, keyboard/ARIA/focus, color/contrast, CI gate.                                  |
| `testing-patterns/api-testing.md`                 | 719   | Authenticated `request` fixture, CRUD, dedicated API project, response/error/file-upload/chained calls, Zod.                        |
| `testing-patterns/browser-extensions.md`           | 506   | `launchPersistentContext` with `--load-extension`, MV2 vs MV3, popup/background/content scripts, Storage/Tabs APIs.                  |
| `testing-patterns/canvas-webgl.md`                 | 493   | Locating canvas, screenshot/extracting data, WebGL, Three.js, Chart.js, D3/ECharts, frame-by-frame, game state.                       |
| `testing-patterns/component-testing.md`            | 500   | CT install per framework, mounting, props/state, events/slots, mocks, framework-specific patterns.                                     |
| `testing-patterns/drag-drop.md`                   | 576   | Kanban, sortable lists, native HTML5 DnD, file drop, canvas dragging, keyboard, cross-frame, touch.                                     |
| `testing-patterns/electron.md`                    | 509   | `_electron.launch`, multi-window, main/renderer, IPC, native dialogs/menus/notifications/clipboard, packaged apps.                       |
| `testing-patterns/file-operations.md`              | 377   | Basic up/download, custom path, content verification (PDF/XLSX/JSON), buffer upload, drag-and-drop.                                       |
| `testing-patterns/file-upload-download.md`         | 562   | Deeper upload/download: progress/cancel/retry, type/size/count/dimension validation, image preview, auth downloads.                        |
| `testing-patterns/forms-validation.md`             | 561   | Auto-complete, conditional fields, multi-step wizards, submission, dates, validation, reset, troubleshooting.                                |
| `testing-patterns/graphql-testing.md`              | 331   | Query/mutation patterns, validation/auth errors, authenticated GraphQL fixture, helper, troubleshooting.                                      |
| `testing-patterns/i18n.md`                        | 508   | Locale config, RTL, date/number/currency formats, missing translation, text overflow, locale-specific snapshots, fonts.                        |
| `testing-patterns/performance-testing.md`          | 476   | Web Vitals (LCP/FID/CLS), navigation/resource/memory timing, budgets, Lighthouse via `playwright-lighthouse`, CI tracking.                       |
| `testing-patterns/security-testing.md`             | 430   | Reflected/stored XSS, CSRF tokens, session expiry, RBAC/IDOR, SQLi, input limits, security headers, CSP.                                          |
| `testing-patterns/visual-regression.md`            | 634   | `toHaveScreenshot`, masking, animation disable, thresholds, full-page vs element, responsive, components, troubleshooting.                          |

> Total reference lines across the 57 guides ≈ **26,051**.

---

## 14. Maintenance Notes

- This memory captures the upstream repo as of commit **`ef329e7`**. When the upstream skill updates, re-clone and diff `SKILL.md`, the activity tables, and any newly added file before relying on stale content here.
- The upstream linter (`agnix`) will block PRs that violate skill metadata; if you fork, run the same workflow in your fork.
- If your team mirrors the skill internally, prefer keeping the original folder names (`core/`, `advanced/`, etc.) so cross-references in this memory remain valid.

---
*End of memory document.*
