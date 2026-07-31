# Playwright Best Practices Skill — Memory & Reference (Bengali Learner Edition)

> এই ডকুমেন্ট টা **learner-friendly** ভাবে লেখা — Bengali ব্যাখ্যা সঙ্গে English technical term। এর English version আছে [`playwright-best-practice-memory.md`](playwright-best-practice-memory.md) ফাইলে। দুটোই same source repo (`currents-dev/playwright-best-practices-skill`) এর উপর তৈরি।

---

## 0. শুরুতেই কয়েকটা কথা (Disclaimer)

- **Source repo:** <https://github.com/currents-dev/playwright-best-practices-skill>
- **আমরা যে commit এ analyze করেছি:** `ef329e7e65149918e1ff0eed2cf7d2e6e6f9eb5b` (2026-03-13, "fix: disable agnix rule AS-017")
- **License:** MIT (অর্থাৎ free, modify করা যাবে)
- **Author:** [currents.dev](https://currents.dev)
- **Skill version:** `1.1` (`SKILL.md` এর YAML frontmatter এ লেখা)

### এই repo টা আসলে কী?

এটা একটা **AI Skill** — মানে AI agent (যেমন Cursor, Claude) যাতে Playwright এর কাজ করার সময় best-practice follow করতে পারে, সেজন্য বানানো একটা **knowledge pack**। ভেতরে আছে:

- ১টা `SKILL.md` (router এর মতো কাজ করে — কোন কাজে কোন file পড়তে হবে সেটা বলে দেয়)
- ৫৭টা reference markdown file, ৮টা topic folder এ সাজানো
- ১টা GitHub Actions workflow (skill এর metadata validate করে)

### কী **নয়** এই repo টা?

> **খুব গুরুত্বপূর্ণ:** এই repo কিন্তু একটা runnable Playwright project **না**।
>
> - এখানে কোনো `playwright.config.ts` নাই
> - কোনো `package.json` নাই
> - কোনো `tests/` folder নাই
> - কোনো actual fixture, page object, বা executable code নাই
>
> যা আছে — সবই **markdown file এর ভেতরে code snippet** হিসেবে আছে। মানে এগুলো reference material, real code না।

### Validation source

এই memory file টা [Playwright official docs](https://playwright.dev/docs/intro) এর সাথে cross-check করে লেখা হয়েছে।

---

## 1. Project Overview — এক নজরে কী জিনিস

**Playwright Best Practices Skill** হলো একটা "activity-based" knowledge pack। মানে — আপনি যখন AI কে কোনো Playwright-related কাজ দেবেন (যেমন: "এই flaky test টা fix করো", "OAuth login mock করো", "iframe test লেখো"), তখন `SKILL.md` সেই কাজের সাথে match করে — কোন কোন reference file পড়তে হবে — সেটা decide করে।

### Key characteristics (এক নজরে)

| Aspect            | Value                                                                                                                                                                |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Domain            | Playwright (TypeScript) test development, debugging, CI/CD                                                                                                           |
| Entry point       | `SKILL.md` (router এর মতো — Activity → Reference table আর Decision Tree রাখে)                                                                                        |
| Trigger model     | Activity inference — আপনি manual ভাবে call করবেন না; AI আপনার intent বুঝে auto-activate করবে                                                                          |
| Coverage          | E2E, Component, API, Visual, Accessibility, Security, Performance, i18n, Electron, Browser Extensions, Auth, Mobile, Network, CI/CD, Debug                          |
| Code language     | TypeScript-first; সব snippet `@playwright/test` দিয়ে লেখা                                                                                                            |
| Validation        | `agent-sh/agnix` lint প্রতি push/PR এ run হয় (`.github/workflows/validate-skill.yml`)। Rule `AS-017` disable করা আছে `.agnix.toml` এ।                                |
| Installation      | `npx skills add https://github.com/currents-dev/playwright-best-practices-skill`                                                                                     |
| Usage philosophy  | ছোট, focused reference লোড করো প্রয়োজন মতো; সাথে "Test Validation Loop" follow করো (run → fix → re-run → important test হলে repeat)                                  |

> **Learner tip:** "Activity-based" মানে — আপনার বলতে হবে না "playwright best practice দেখাও"। আপনি যখন বলবেন "এই login test ঠিক করো", AI নিজেই বুঝে যাবে এটা auth-related কাজ এবং `advanced/authentication.md` লোড করবে।

---

## 2. Repository Structure — কী কোথায় আছে

```
playwright-best-practices-skill/
├── .agnix.toml                          # agnix lint config (rule AS-017 disable করা)
├── .github/
│   └── workflows/
│       └── validate-skill.yml           # CI: push/PR এ agent-sh/agnix lint run করায়
├── LICENSE.md                           # MIT
├── README.md                            # Human-facing overview, install, category tables
├── SKILL.md                             # Skill manifest + activity router + decision tree
│
├── advanced/                            # ৮টা deep-topic guide
│   ├── authentication.md                # বড় auth guide — storage state, multi-role, troubleshooting
│   ├── authentication-flows.md          # MFA, password reset, session timeout, remember-me
│   ├── clock-mocking.md                 # date/time mock — page.clock API
│   ├── mobile-testing.md                # device emulation, touch gesture, viewport
│   ├── multi-context.md                 # popup, new tab, OAuth popup
│   ├── multi-user.md                    # multiple user / RBAC / collaboration
│   ├── network-advanced.md              # page.route, HAR, GraphQL mock, throttling
│   └── third-party.md                   # OAuth, Stripe, PayPal, email/SMS mock
│
├── architecture/                        # ৩টা decision-making guide
│   ├── pom-vs-fixtures.md               # POM vs Fixture vs Helper — কোনটা কখন
│   ├── test-architecture.md             # E2E / Component / API ratio (test pyramid)
│   └── when-to-mock.md                  # mock করব না real service — decision matrix
│
├── browser-apis/                        # ৪টা browser API guide
│   ├── browser-apis.md                  # geolocation, permission, clipboard, camera/mic
│   ├── iframes.md                       # frameLocator, cross-origin iframe
│   ├── service-workers.md               # PWA, cache, offline, push notification
│   └── websockets.md                    # WebSocket, SSE, real-time test
│
├── core/                                # ১১টা foundational guide
│   ├── annotations.md                   # skip, fixme, slow, test.step
│   ├── assertions-waiting.md            # web-first assertion, expect.poll, expect.toPass
│   ├── configuration.md                 # production-ready playwright.config.ts
│   ├── fixtures-hooks.md                # built-in / custom / worker-scoped fixture
│   ├── global-setup.md                  # globalSetup vs setup project vs worker fixture
│   ├── locators.md                      # locator priority — getByRole সবসময় best
│   ├── page-object-model.md             # POM pattern, component object, composition
│   ├── projects-dependencies.md         # multi-browser, dependency, setup project
│   ├── test-data.md                     # factory, Faker, data-driven test
│   ├── test-suite-structure.md          # নতুন project কীভাবে structure করব
│   └── test-tags.md                     # @smoke, @critical tag, --grep filter
│
├── debugging/                           # ৪টা debugging guide
│   ├── console-errors.md                # browser console error capture & gate
│   ├── debugging.md                     # Inspector, UI mode, trace viewer — master guide
│   ├── error-testing.md                 # network failure, offline, error boundary test
│   └── flaky-tests.md                   # flaky test fix strategy by type
│
├── frameworks/                          # ৪টা framework-specific guide
│   ├── angular.md                       # Reactive Forms, Signals, Zone.js, SSR
│   ├── nextjs.md                        # App Router, Pages Router, NextAuth
│   ├── react.md                         # Context, RR, RHF/Formik, Portal, Error Boundary
│   └── vue.md                           # Vite/Nuxt, Pinia, Composition API, Teleport
│
├── infrastructure-ci-cd/                # ৯টা CI/CD/infra guide
│   ├── ci-cd.md                         # generic CI overview
│   ├── docker.md                        # official image, custom Dockerfile, compose
│   ├── github-actions.md                # GH Actions — সবচেয়ে detailed
│   ├── gitlab.md                        # GitLab CI patterns
│   ├── other-providers.md               # Jenkins, CircleCI, Azure DevOps
│   ├── parallel-sharding.md             # --shard, merge-reports, worker fixture
│   ├── performance.md                   # parallel/serial, optimization, isolation
│   ├── reporting.md                     # reporter type, trace, artifact upload
│   └── test-coverage.md                 # V8 vs Istanbul coverage
│
└── testing-patterns/                    # ১৫টা specialised pattern guide
    ├── accessibility.md                 # axe-core, keyboard nav, ARIA
    ├── api-testing.md                   # request fixture, CRUD, Zod schema (longest!)
    ├── browser-extensions.md            # MV2/MV3 extension test
    ├── canvas-webgl.md                  # canvas, WebGL, Three.js, Chart.js
    ├── component-testing.md             # @playwright/experimental-ct-* setup
    ├── drag-drop.md                     # Kanban, sortable, file drop, touch drag
    ├── electron.md                      # _electron.launch, IPC, native dialog
    ├── file-operations.md               # basic up/download
    ├── file-upload-download.md          # advanced — progress, cancel, retry, validation
    ├── forms-validation.md              # form fill, validation, multi-step
    ├── graphql-testing.md               # query, mutation, mock by operationName
    ├── i18n.md                          # locale, RTL, date/number format
    ├── performance-testing.md           # Web Vitals, Lighthouse, budget
    ├── security-testing.md              # XSS, CSRF, SQL injection, headers
    └── visual-regression.md             # toHaveScreenshot, mask, threshold
```

> **মোট 57টা reference file** আছে। README এ "Core" এ 10টা বলা হলেও আসলে `test-tags.md` সহ 11টা।

---

## 3. Root Files Summary — শুরুর ৫টা ফাইল

| File                                  | কাজ কী                                                                                                                                                              | মূল take-away                                                                                                                       |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `README.md`                           | Human entry point — ASCII banner, install command, সব 57 reference এর categorised table, license।                                                                   | "What's Inside" section টা সবচেয়ে কাজে লাগে — কোন folder কোন topic এর সেটা এক জায়গায় পাওয়া যায়।                                       |
| `SKILL.md`                            | Machine entry point। YAML frontmatter (name, description, license, version) + activity table + decision tree + "Test Validation Loop"।                              | `description:` field টা AI activation এর জন্য ব্যবহৃত হয়। Activity → Reference টেবিলগুলো canonical lookup।                            |
| `LICENSE.md`                          | MIT license এর text।                                                                                                                                                | Permissive — pattern গুলো নিজের project এ ব্যবহার করতে পারবেন, কোনো বাধা নেই।                                                          |
| `.agnix.toml`                         | মাত্র দুই লাইন — `[rules]` এর নিচে `disabled_rules = ["AS-017"]`।                                                                                                   | একটা agent-skill linter rule deliberately disable করা।                                                                              |
| `.github/workflows/validate-skill.yml`| Single-job GitHub Actions workflow। `Validate AI Skill` → checkout → `agent-sh/agnix@12a1917...` lint চালায়। Trigger: push/PR to `main`। Runs on `ubuntu-latest`। | এটাই একমাত্র CI gate — কোনো Playwright test এখানে run হয় না, শুধু skill metadata valid কিনা সেটা check হয়।                            |

---

## 4. Skill কখন Auto-Activate হয়? (Trigger List)

`SKILL.md` এর YAML frontmatter এর `description:` field টা hubub-by-hub দেখলে — AI নিচের যেকোনো intent detect করলে এই skill load করে নেয়:

> Playwright test লেখা, flaky test fix, debug, POM implement, CI/CD config, performance optimize, API mock, authentication/OAuth handle, accessibility test (axe-core), file upload/download, date/time mock, WebSocket, geolocation, permission, multi-tab/popup flow, mobile/responsive layout, touch gesture, GraphQL, error handling, offline mode, multi-user collaboration, third-party services (payment, email verification), console error monitoring, global setup/teardown, test annotations (skip, fixme, slow), test tags (`@smoke`, `@fast`, `@critical`, `--grep` filter), project dependency, security testing (XSS, CSRF, auth), performance budget (Web Vitals, Lighthouse), iframe, component testing, canvas/WebGL, service worker/PWA, test coverage, i18n/localization, Electron app, browser extension testing।

> **Learner tip:** আপনার intent এই list এ না থাকলে skill auto-activate **হবে না**। তখন আপনি manually reference file open করে দেখতে পারেন।

---

## 5. Activity → Reference Map (Quick Decision Tree)

`SKILL.md` থেকে সংক্ষেপে। নতুন কাজ শুরু করার সময় প্রথমেই এই table টা দেখুন।

| আপনি যদি…                                | প্রথমে এগুলো পড়ুন                                                                                                       |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| নতুন **E2E** test লিখছেন                  | `core/test-suite-structure.md`, `core/locators.md`, `core/assertions-waiting.md`                                        |
| নতুন **Component** test লিখছেন            | `testing-patterns/component-testing.md`, `core/test-suite-structure.md`                                                 |
| নতুন **API** test লিখছেন                  | `testing-patterns/api-testing.md`, `core/test-suite-structure.md`                                                       |
| **GraphQL** test লিখছেন                   | `testing-patterns/graphql-testing.md`, `testing-patterns/api-testing.md`                                                |
| **Visual regression** test                | `testing-patterns/visual-regression.md`, `testing-patterns/canvas-webgl.md`                                             |
| **POM** দিয়ে structure করছেন              | `core/page-object-model.md`, `core/test-suite-structure.md`, `architecture/pom-vs-fixtures.md`                          |
| **Fixture / hook** setup করছেন            | `core/fixtures-hooks.md`, `core/test-data.md`                                                                           |
| **Authentication / login** handle করছেন   | `advanced/authentication.md`, `advanced/authentication-flows.md`                                                        |
| **Date / time** feature test              | `advanced/clock-mocking.md`                                                                                             |
| **File upload / download** test           | `testing-patterns/file-operations.md`, `testing-patterns/file-upload-download.md`                                       |
| **Form / validation** test                | `testing-patterns/forms-validation.md`                                                                                  |
| **Drag and drop** test                    | `testing-patterns/drag-drop.md`                                                                                         |
| **Accessibility** test                    | `testing-patterns/accessibility.md`                                                                                     |
| **Security** test (XSS / CSRF)            | `testing-patterns/security-testing.md`                                                                                  |
| **Performance** budget / Web Vitals       | `testing-patterns/performance-testing.md`                                                                               |
| **i18n** / locale / RTL                   | `testing-patterns/i18n.md`                                                                                              |
| **Electron** app                          | `testing-patterns/electron.md`                                                                                          |
| **Browser extension**                     | `testing-patterns/browser-extensions.md`                                                                                |
| **iframe**                                | `browser-apis/iframes.md`                                                                                               |
| **Canvas / WebGL / chart**                | `testing-patterns/canvas-webgl.md`                                                                                      |
| **WebSocket / real-time**                 | `browser-apis/websockets.md`                                                                                            |
| **Geolocation / permission / clipboard**  | `browser-apis/browser-apis.md`                                                                                          |
| **Service worker / PWA / offline**        | `browser-apis/service-workers.md`                                                                                       |
| **Multi-tab / popup / OAuth popup**       | `advanced/multi-context.md`, `advanced/third-party.md`                                                                  |
| **Multi-user / RBAC / collaboration**     | `advanced/multi-user.md`                                                                                                |
| **Mobile / touch / responsive**           | `advanced/mobile-testing.md`                                                                                            |
| **Network interception / HAR**            | `advanced/network-advanced.md`                                                                                          |
| **Third-party** (Stripe / OAuth / SMS)    | `advanced/third-party.md`                                                                                               |
| Test **flaky** হচ্ছে                      | `debugging/flaky-tests.md` → তারপর `core/assertions-waiting.md`                                                         |
| Test fail / element না পাওয়া / timeout    | `debugging/debugging.md`, `core/locators.md`, `core/assertions-waiting.md`                                              |
| Multiple worker চালালে fail হয়            | `debugging/flaky-tests.md`, `infrastructure-ci-cd/performance.md`, `core/fixtures-hooks.md`                             |
| Console / JS error                        | `debugging/console-errors.md`, `debugging/debugging.md`                                                                 |
| Error state / offline / loading           | `debugging/error-testing.md`                                                                                            |
| **POM vs fixture** decide করতে চান         | `architecture/pom-vs-fixtures.md`                                                                                       |
| **Test type** choose (API/CT/E2E)         | `architecture/test-architecture.md`                                                                                     |
| **Mock vs real service** decide           | `architecture/when-to-mock.md`                                                                                          |
| **React / Angular / Vue / Next.js** app   | `frameworks/react.md` / `angular.md` / `vue.md` / `nextjs.md`                                                           |
| **CI/CD** setup                           | `infrastructure-ci-cd/ci-cd.md` → তারপর provider-specific (`github-actions.md`, `gitlab.md`, …)                         |
| **Docker** / container                    | `infrastructure-ci-cd/docker.md`                                                                                        |
| **Sharding / parallel** run               | `infrastructure-ci-cd/parallel-sharding.md`, `infrastructure-ci-cd/performance.md`                                      |
| **Reporting** / artifact / trace          | `infrastructure-ci-cd/reporting.md`                                                                                     |
| **Code coverage**                         | `infrastructure-ci-cd/test-coverage.md`                                                                                 |
| **Annotation** (skip/fixme/slow/step)     | `core/annotations.md`                                                                                                   |
| **Tag** (`@smoke`, `--grep`)              | `core/test-tags.md`                                                                                                     |
| **Global setup / teardown**               | `core/global-setup.md`                                                                                                  |
| **Multi-project / dependency**            | `core/projects-dependencies.md`                                                                                         |
| **Test data factory / Faker**             | `core/test-data.md`                                                                                                     |
| **Playwright config** লিখছেন              | `core/configuration.md`                                                                                                 |

---

## 6. Knowledge Domains — Folder ধরে detail breakdown

প্রতিটা file এর জন্য: **কাজ কী** · **মূল API/built-in** · **কী কী pattern শেখায়** · **আর কোন file এর সাথে related**।

### 6.1 `core/` — Foundational Guides (১১টা file)

#### `core/configuration.md` (452 lines)

- **কাজ:** "Production-ready" `playwright.config.ts` এর template + environment-specific pattern।
- **মূল API:** `defineConfig`, `devices`, `use`, `projects`, `webServer`, `expect.timeout`, `retries`, `workers`, `reporter`, `forbidOnly`, `fullyParallel`, `trace`, `screenshot`, `video`, `locale`, `timezoneId`, `actionTimeout`, `navigationTimeout`, `baseURL`, `storageState`।
- **কী শেখায়:** production config; per-`TEST_ENV` (`local|staging|prod`) config via `dotenv`; setup project + dependencies; build step সহ `webServer`; tag-based filtering; artifact collection strategy।
- **এছাড়াও আছে:** CLI quick reference, Decision Guide (timeout selection, server management, single vs multi-project, `globalSetup` vs setup-project vs fixture), Anti-Patterns, Troubleshooting (`baseURL` কাজ না করা, `webServer` connection refused, CI timeout, "Target page closed")।
- **Related:** `projects-dependencies.md`, `global-setup.md`, `test-tags.md`, `fixtures-hooks.md`।

> **Learner note:** নতুন project এ এই file টাই প্রথমে copy-paste করার জন্য — production-ready হওয়ার মানে সব essential setting (CI mode, retry, trace, video, screenshot, multi-browser project) একসাথে আছে।

#### `core/locators.md` (242 lines)

- **কাজ:** কোন selector কখন use করতে হবে — সবচেয়ে important reference।
- **Priority order (এটা মুখস্থ রাখুন):**
  1. `getByRole` — সবচেয়ে robust (accessibility tree থেকে আসে)
  2. `getByLabel` / `getByPlaceholder` — form element এর জন্য
  3. `getByText` / `getByTitle` — visible text দিয়ে
  4. `getByTestId` — যখন semantic locator possible না
  5. `locator('css=...')` / `locator('xpath=...')` — last resort
- **মূল API:** উপরেরগুলো + `locator`, `filter`, `nth`, `first`, `last`, `frameLocator`, Shadow DOM piercing, `testIdAttribute` config।
- **কী শেখায়:** `hasText`/`hasNotText`/child locator দিয়ে filter; chaining; dynamic list handle; iframe via `frameLocator`; Shadow DOM auto piercing; locator debugging।
- **Related:** `assertions-waiting.md`, `debugging/debugging.md`, `browser-apis/iframes.md`।

> **Learner tip:** প্রথমেই CSS selector / XPath ব্যবহার করতে যাবেন না। `getByRole('button', { name: 'Submit' })` ৯০% case এ কাজ করবে এবং UI change এও সহজে break করবে না।

#### `core/assertions-waiting.md` (361 lines)

- **কাজ:** Web-first assertion আর সঠিক ভাবে wait করা।
- **মূল API:**
  - `expect(locator).toBeVisible/toHaveText/toHaveValue/toBeChecked/toBeEnabled/toHaveAttribute/toHaveCount`
  - `expect(page).toHaveURL/toHaveTitle`
  - `expect(response).toBeOK`
  - `expect.poll`, `expect.toPass` — polling এর জন্য
  - `expect.soft` — soft assertion
  - `page.waitForURL`, `waitForResponse`, `waitForLoadState`, `waitForFunction`
  - `expect.extend` — custom matcher
- **কী শেখায়:** locator/page/response assertion; soft assertion early exit সহ; default auto-waiting; polling/retrying; custom matcher; per-test/per-action timeout configure।
- **Related:** `locators.md`, `debugging/flaky-tests.md`।

> **Learner tip:** কখনোই `await page.waitForTimeout(2000)` লিখবেন না। এটা hard wait — flaky test এর প্রধান কারণ। `await expect(locator).toBeVisible()` use করুন — এটা auto-wait করবে।

#### `core/fixtures-hooks.md` (417 lines)

- **কাজ:** Built-in fixture, custom typed fixture, scope, hook, auth fixture, DB fixture।
- **মূল API:** `test.extend`, fixture type `<Fixtures>` & `<Options & Fixtures>`, `{ scope: 'worker' }`, `{ option: true }`, `{ auto: true }`; `test.beforeEach/afterEach/beforeAll/afterAll`; `test.describe.configure`; `request`, `page`, `context`, `browser`, `browserName`।
- **কী শেখায়:** basic typed fixture; option-driven fixture (default user); automatic fixture; worker-scoped fixture; worker এর মধ্যে data isolate করা; `globalSetup` storage-state pattern; multiple auth-state fixture; transaction-rollback DB fixture।
- **Related:** `page-object-model.md`, `architecture/pom-vs-fixtures.md`, `advanced/authentication.md`, `core/global-setup.md`।

> **Learner tip:** Fixture এর pattern সবসময় এক:
> ```ts
> myFixture: async ({ deps }, use) => {
>   // setup
>   await use(value); // test এই value ব্যবহার করবে
>   // teardown
> }
> ```

#### `core/page-object-model.md` (315 lines)

- **কাজ:** Page এর interaction encapsulate করা।
- **কী শেখায়:**
  - `LoginPage` class — `readonly` locator, `goto`, action method, assertion helper
  - Component object (`NavbarComponent`, `ModalComponent`)
  - Composition (page-with-components)
  - Page navigation pattern
  - Factory function
  - "Do" / "Don't" list
  - Recommended directory structure (`pages/`, `components/`)
  - Custom fixture এর সাথে POM use
- **Related:** `fixtures-hooks.md`, `architecture/pom-vs-fixtures.md`।

#### `core/test-data.md` (492 lines)

- **কাজ:** Factory, Faker, data-driven test, DB seeding।
- **মূল dep:** `@faker-js/faker` (`npm install -D @faker-js/faker`)
- **কী শেখায়:** basic factory, factory with traits, factory with relationships; Faker সহ seeded determinism (`faker.seed(testInfo.workerIndex)`); Faker fixture; CSV/JSON data source; API-based seeding; transaction rollback।
- **Related:** `fixtures-hooks.md`, `testing-patterns/api-testing.md`।

#### `core/test-suite-structure.md` (361 lines)

- **কাজ:** নতুন project এর কঙ্কাল — কীভাবে E2E / Component / API / Visual test arrange করবেন।
- **কী শেখায়:** `npm init playwright@latest`; minimal `playwright.config.ts`; `tests/e2e/checkout.spec.ts` example; config বা test এর ভেতরে API mocking pattern; visual test basics (`toHaveScreenshot`); recommended directory; `--grep @smoke` দিয়ে tagging/filtering।
- **Related:** `configuration.md`, `locators.md`, `assertions-waiting.md`, `test-tags.md`।

#### `core/test-tags.md` (298 lines)

- **কাজ:** Standard tag (`@smoke`, `@fast`, `@critical`, `@e2e`, `@api`, `@slow`)।
- **মূল API:**
  - `test('name', { tag: ['@smoke'] }, ...)` — recommended way
  - `test.describe('name', { tag: [...] }, ...)`
  - `--grep` / `--grep-invert`
  - `playwright.config.ts` এ `grep` / `grepInvert`
  - project-specific tag
- **কী শেখায়:** detail object দিয়ে tag (recommended) vs title দিয়ে tag (not recommended); describe-level tagging; `--grep` এ logical OR/AND; environment-based filtering; PR vs nightly strategy; common tag taxonomy।
- **Related:** `annotations.md`, `infrastructure-ci-cd/ci-cd.md`।

#### `core/annotations.md` (424 lines)

- **কাজ:** `test.skip`, `test.fixme`, `test.fail`, `test.slow`, `test.step`, custom annotation।
- **মূল API:** `test.skip()`, `test.skip(condition, reason)`, `test.fixme`, `test.fail`, `test.slow`, `test.step('name', async () => {})`, `testInfo.annotations`।
- **কী শেখায়:** conditional skip; platform skip; describe-level skip; skip vs fixme vs fail এর difference; nested step; step এ return value; POM এর ভেতরে step; custom annotation fixture; custom reporter এ annotation read।
- **Related:** `test-tags.md`, `infrastructure-ci-cd/reporting.md`।

#### `core/global-setup.md` (434 lines)

- **কাজ:** `globalSetup`/`globalTeardown` কখন use করবেন — কখন setup project — কখন worker-scoped fixture — সেই decision।
- **মূল API:** `globalSetup`/`globalTeardown` config key; setup project (`testMatch: /.*\.setup\.ts/` + `dependencies: ['setup']`); worker-scoped fixture।
- **কী শেখায়:** return value সহ global-setup; `FullConfig` access; conditional teardown; DB migration & snapshot; per-worker test DB; service start; Docker Compose orchestration; environment variable provisioning; comparison table; parallel execution caveats।
- **Related:** `projects-dependencies.md`, `fixtures-hooks.md`, `configuration.md`।

> **Learner tip:** `globalSetup` use করার আগে চিন্তা করুন — সাধারণত **setup project** বেশি ভাল (কারণ retry/sharding এ অংশ নেয়, parallel-friendly)।

#### `core/projects-dependencies.md` (453 lines)

- **কাজ:** Multi-browser, multi-environment, dependency-chained project।
- **মূল API:** `projects: [...]`, `dependencies: ['setup']`, `teardown: 'cleanup'`, `testMatch`, `testIgnore`, `metadata`, `--project=name`, `--grep`।
- **কী শেখায়:** basic multi-browser; environment-based project; test-type project (e2e / api / component); chained dependency (multiple setup); auth-setup / data-seeding / cleanup setup project; conditional project; project metadata; teardown project; spread দিয়ে base config share।
- **Related:** `configuration.md`, `global-setup.md`, `advanced/authentication.md`।

---

### 6.2 `debugging/` — ৪টা file

#### `debugging/debugging.md` (504 lines)

- **কাজ:** Master debugging reference।
- **মূল API:** `npx playwright test --debug`, `--ui`, `--headed`, `PWDEBUG=1`, Playwright Inspector, `page.pause()`, `expect.configure({ timeout })`, trace viewer (`trace: 'on-first-retry'`, `npx playwright show-trace`), `context.tracing.start/stop`, `page.on('console'|'request'|'response'|'requestfailed')`, `page.waitForResponse`, `testInfo.attach`।
- **কী শেখায়:** Inspector, headed mode, UI mode, in-code debugging; trace viewer (enable/view/programmatic); flaky test identify; network debugging (monitor / wait / slow); CI-specific debug; auth debug; screenshot diff; common-issue taxonomy (element not found / timeout / selector / frame); console capture; custom test attachment; troubleshooting checklist symptom-by-symptom এবং step-by-step।
- **Related:** `flaky-tests.md`, `console-errors.md`, `core/locators.md`, `core/assertions-waiting.md`।

> **Learner tip:** Debug শুরু করার সময় প্রথমে `npx playwright test --ui` চালান। UI mode এ time-travel debugging পাবেন — failure এর exact point দেখতে পারবেন।

#### `debugging/flaky-tests.md` (496 lines)

- **কাজ:** Flakiness type চেনা আর fix করা।
- **Categories (এই 4টা টাইপ চিনে রাখুন):**
  1. **UI-driven** — element not found, click missed (missing wait, animation)
  2. **Environment-driven** — শুধু CI তে fail (slower CPU, memory limit, cold browser)
  3. **Data/parallelism-driven** — multiple worker চালালে fail (shared backend data, account reuse)
  4. **Test-suite-driven** — অন্য test এর সাথে চালালে fail (state leak, shared fixture, order dependency)
- **মূল API:** `--repeat-each=N`, `--workers=1`, `CI=true`, `trace: 'on-first-retry'`, `video: 'retain-on-failure'`, `screenshot: 'only-on-failure'`, `test.info().retry`, `test.fixme(condition, reason)`।
- **কী শেখায়:** flakiness confirm; reproduction strategy; race condition এর জন্য event logging; trace analysis; UI/async/data/state-leak flake fix; CI-specific cause; consistent viewport/scale; quarantine pattern; annotation-based quarantine; test burn-in checklist; isolation checklist; defensive assertion; retry budget।
- **Related:** `debugging.md`, `core/assertions-waiting.md`, `core/fixtures-hooks.md`, `infrastructure-ci-cd/performance.md`।

#### `debugging/error-testing.md` (360 lines)

- **কাজ:** Negative path test — error boundary, network failure, offline, loading state, validation।
- **মূল API:** `page.route('**/api/...', route => route.abort('failed'))`, `route.fulfill({ status: 500, body })`, `route.continue()`, `context.setOffline(true)`, `page.on('pageerror')`।
- **কী শেখায়:** component error boundary; recovery; JS error capture; API error; timeout; connection reset; mid-request failure; offline session + recovery; skeleton/loading/empty state; client / format / server-side validation।
- **Related:** `console-errors.md`, `advanced/network-advanced.md`, `browser-apis/service-workers.md`।

#### `debugging/console-errors.md` (420 lines)

- **কাজ:** Browser console / JS error capture আর সেগুলোর উপর gate বসানো।
- **মূল API:** `page.on('console', msg => …)`, `page.on('pageerror')`, `msg.type()` filter, `msg.location()` দিয়ে stack trace।
- **কী শেখায়:** basic capture; type-by-type capture; stack trace সহ; কোনো error থাকলে test fail; allow-list exception; auto-fail fixture; uncaught exception detection; deprecation/React-dev warning capture; comprehensive console fixture; report এ console output attach।
- **Related:** `debugging.md`, `error-testing.md`।

---

### 6.3 `testing-patterns/` — ১৫টা file

#### `testing-patterns/accessibility.md` (359 lines)

- **Dep:** `@axe-core/playwright` (`npm install -D @axe-core/playwright`)।
- **মূল API:** `new AxeBuilder({ page }).analyze()`, `.include(...)`, `.exclude(...)`, `.disableRules(...)`, `page.keyboard.press('Tab')`, `page.keyboard.press('Escape')`, role assertion, focus assertion, `prefers-reduced-motion`, `forced-colors` emulation।
- **কী শেখায়:** basic a11y test; scoped analysis; a11y fixture; detailed violation reporting; tab-order test; keyboard-only flow; skip-link verify; Escape handling; ARIA role/state verify; live region; focus-trap test; focus restoration; high-contrast & reduced-motion media-query test; CI a11y gate।

#### `testing-patterns/api-testing.md` (719 lines — `testing-patterns/` এ সবচেয়ে বড়)

- **মূল API:** `request` fixture, `request.newContext({ baseURL, extraHTTPHeaders, storageState })`, `request.get/post/put/patch/delete`, `expect(response).toBeOK()`, `response.json()`, `response.headers()`, `response.status()`, multipart upload via `multipart`, schema validation via Zod।
- **কী শেখায়:** authenticated request fixture; CRUD; dedicated API project (browser ছাড়া); response assertion; API data seeding; error-response test; API দিয়ে file upload; chained API call; Zod schema validation। Decision Guide / Anti-Patterns / Troubleshooting (`ECONNREFUSED`, invalid JSON, 401, CI-only failure)।

> **Learner tip:** API test browser ছাড়া চলে — অনেক faster। UI test এর data seed করার জন্য বা backend logic verify করার জন্য use করুন।

#### `testing-patterns/component-testing.md` (500 lines)

- **Dep:** `@playwright/experimental-ct-react` / `-ct-vue` / `-ct-svelte` / `-ct-solid`।
- **মূল API:** `mount(<Component prop=... />)`, `update`, `unmount`, custom wrapper/provider।
- **কী শেখায়:** framework-wise install; CT config; project structure; mount with prop/wrapper; prop variation & update test; controlled vs internal state; click/event payload/form-submission/keyboard test; slot test (incl. Vue named slot); render-props; mock import/API/hook; framework-specific snippet (React, Vue, Svelte)।

#### `testing-patterns/visual-regression.md` (634 lines — folder এর সবচেয়ে বড়)

- **মূল API:** `expect(page).toHaveScreenshot('name.png', { mask, maxDiffPixelRatio, threshold, animations: 'disabled', caret: 'hide', clip, fullPage })`, `--update-snapshots` (`-u`), `expect.configure`, buffer এর জন্য `toMatchSnapshot`।
- **কী শেখায়:** volatile content mask; animation/font loading disable; threshold tuning; CI configuration; full-page vs element screenshot; responsive visual; component visual; snapshot update; cross-browser visual; troubleshooting (first-CI-run diff, X-pixel diff, local-vs-CI, animation flake, naming conflict, snapshot bloat)।

#### `testing-patterns/file-operations.md` (377 lines) এবং `file-upload-download.md` (562 lines)

- **মূল API:** `page.waitForEvent('download')`, `download.saveAs(...)`, `download.path()`, `download.failure()`, `setInputFiles(filePath | filePaths | { name, mimeType, buffer })`, `page.waitForEvent('filechooser')`, `page.dispatchEvent('drop', ...)`।
- **কী শেখায়:** basic up/download; custom path; download content verify (PDF / Excel / JSON); multiple download; path/buffer থেকে upload; clear & re-upload; drag-and-drop upload; file-chooser dialog; upload progress/cancel/retry; file-type/size/count/dimension validation; image preview; authenticated download।

#### `testing-patterns/forms-validation.md` (561 lines)

- **মূল API:** `fill`, `type`, `selectOption`, `setInputFiles`, `check`/`uncheck`, `pressSequentially`, `expect(input).toHaveValue/toHaveAttribute('aria-invalid','true')`, `getByRole('alert')`।
- **কী শেখায়:** auto-complete/typeahead; conditional field; multi-step wizard; submission & response handling; basic field fill; date/time input; required/format validation; reset test। Troubleshooting (`fill` clears but doesn't type; date picker; non-`<select>` এ `selectOption`; missing validation message)।

#### `testing-patterns/drag-drop.md` (576 lines)

- **মূল API:** `dragTo`, `mouse.move/down/up`, `dispatchEvent('dragstart'|'drop')`, touch event।
- **কী শেখায়:** Kanban (cross-column); sortable list; custom library এর জন্য incremental mouse movement; native HTML5 DnD; file drop zone; canvas coordinate dragging; custom drag preview; keyboard reorder; cross-frame drag; touch drag।

#### `testing-patterns/graphql-testing.md` (331 lines)

- **মূল API:** `request.post('/graphql', { data: { query, variables } })`, `operationName` দিয়ে mock এর জন্য `page.route('**/graphql', …)`।
- **কী শেখায়:** variable সহ basic query; mutation; validation/authorization error; authenticated GraphQL fixture; reusable helper। Troubleshooting (`200 + null data`, schema error, variable ignored)।

#### `testing-patterns/i18n.md` (508 lines)

- **মূল API:** `use: { locale, timezoneId }`, `extraHTTPHeaders: { 'Accept-Language': 'fr-FR' }`, `page.evaluate(() => Intl.…)`, `expect(page.locator('html')).toHaveAttribute('dir','rtl')`।
- **কী শেখায়:** browser locale config; per-test override; parameterised locale test; locale-switching flow; RTL layout & visual; bidirectional text; date/number/currency format; missing translation detection; text overflow detection; locale-specific snapshot; font loading।

#### `testing-patterns/electron.md` (509 lines)

- **Dep:** `@playwright/test`, `electron`।
- **মূল API:** `_electron.launch({ args: ['./main.js'] })`, `electronApp.firstWindow()`, `electronApp.windows()`, `electronApp.evaluate(…)`, `electronApp.on('window')`।
- **কী শেখায়:** install/config; Electron fixture; launch options; dev vs packaged; multi-window; main-process eval; renderer এ Node API access; context-isolation; IPC test; IPC handler mock; native dialog/menu/notification/clipboard; packaged app test।

#### `testing-patterns/browser-extensions.md` (506 lines)

- **মূল API:** `chromium.launchPersistentContext(userDataDir, { args: ['--disable-extensions-except=…','--load-extension=…'] })`, `context.serviceWorkers()`, `context.backgroundPages()`, `chrome.storage`, `chrome.tabs`, `chrome.contextMenus`, `chrome.permissions`।
- **কী শেখায়:** prerequisite; basic CT-style config; extension fixture; Manifest V3 service-worker vs V2 background page; multiple extension; popup test; popup state persistence; popup ↔ background messaging; alarm/timer; content-script injection & messaging; Storage / Tabs / ContextMenus / Permissions API।

#### `testing-patterns/canvas-webgl.md` (493 lines)

- **মূল API:** `locator.boundingBox()`, `page.mouse.click(x,y)`, `locator.evaluate((c) => (c as HTMLCanvasElement).toDataURL())`, `expect(locator).toHaveScreenshot()`, `WebGLRenderingContext` check।
- **কী শেখায়:** canvas locate; canvas screenshot; pixel data extract; visual comparison & threshold; canvas এ click/draw; canvas এ drag/touch; WebGL support detect; Three.js; Chart.js / D3 / ECharts; frame-by-frame; game-state test।

#### `testing-patterns/security-testing.md` (430 lines)

- **মূল API:** `request.post`, `page.evaluate(() => document.cookie)`, `response.headers()['content-security-policy']`, `page.on('pageerror')`।
- **কী শেখায়:** reflected/stored XSS; XSS execution monitoring; CSRF token presence/validation/with-valid-token; session expiry; concurrent session; password-reset security; unauthorized access; IDOR; SQL injection prevention; input length limit; security header; CSP violation detection।

#### `testing-patterns/performance-testing.md` (476 lines)

- **Dep:** `playwright-lighthouse`, `lighthouse`, `web-vitals`।
- **মূল API:** `page.evaluate(() => performance.getEntriesByType(...))`, `PerformanceObserver`, `playwright-lighthouse` integration, custom budget fixture।
- **কী শেখায়:** inline `web-vitals` দিয়ে LCP/FID/CLS measure; navigation/resource/memory timing; budget definition + assertion fixture; config সহ Lighthouse; CI tracking; regression detection।

---

### 6.4 `advanced/` — ৮টা file

#### `advanced/authentication.md` (871 lines — পুরো skill এ সবচেয়ে বড়!)

- **মূল API:** `storageState`, `context.storageState({ path })`, project `dependencies`, setup project (`*.setup.ts`), API login এর জন্য `request.newContext({ baseURL })`, multi-role storage path (`playwright/.auth/admin.json` ইত্যাদি), `auth` fixture pattern, `page.route` দিয়ে MFA mocking।
- **কী শেখায়:** storage-state reuse; global-setup auth; per-worker auth; multi-role; OAuth/SSO mock; MFA handle; session refresh; `LoginPage` POM; API-based login; unauthenticated test। Decision Guide (UI vs API vs storage state) + Anti-Patterns + Troubleshooting (setup এ target-closed, কিছুক্ষণ পর 401, empty `storageState`, browser-specific cookie, parallel session interference, OAuth এখনো real provider এ যাচ্ছে)।
- **Related:** `authentication-flows.md`, `core/projects-dependencies.md`, `core/fixtures-hooks.md`, `advanced/multi-context.md`।

> **Learner tip:** Auth এর default pattern — একবার login করো, `storageState` save করো, সব test এ reuse করো। প্রতি test এ login করবেন না!

#### `advanced/authentication-flows.md` (360 lines)

- **কী শেখায়:** email-verification (token capture / fully mocked); password reset (complete flow / expired token / strength validation); session timeout (detection / extension warning / extension action); remember-me persistent vs session-only; logout (standard + all-devices)।

#### `advanced/clock-mocking.md` (364 lines)

- **মূল API:** `page.clock.install({ time })`, `page.clock.fastForward('30:00')`, `page.clock.runFor(1000)`, `page.clock.pauseAt`, `page.clock.resume`, `page.clock.runPendingTimers`, `page.clock.setSystemTime`।
- **কী শেখায়:** navigation এর আগে install; clock fixture; date-dependent feature; relative-time display; date boundary; advance time / pause-resume / pending timer; timezone test & fixture; `setInterval`/`setTimeout`/animation frame mock; ISO-string convention।

#### `advanced/mobile-testing.md` (409 lines)

- **মূল API:** `devices['iPhone 14']`, custom `viewport`/`deviceScaleFactor`/`isMobile`/`hasTouch`/`userAgent`, `page.touchscreen.tap`, `mouse.down/move/up` বা touch event দিয়ে swipe, `setViewportSize`।
- **কী শেখায়:** built-in vs custom device; multi-device matrix; tap/swipe (reusable swipe fixture সহ); long-press; pinch-zoom; viewport test; dynamic viewport change; hamburger menu; bottom sheet; pull-to-refresh; breakpoint এ visual regression।

#### `advanced/multi-context.md` (288 lines)

- **মূল API:** `context.waitForEvent('page')`, `page.waitForEvent('popup')`, `browser.newContext({ storageState })`, multiple `Page` instance।
- **কী শেখায়:** basic popup; auth সহ popup; blocked popup; link দিয়ে new tab; new tab intercept; mock recommendation সহ Google OAuth popup; OAuth fixture; user-wise multi-window; tab switching; close-all-but-one।

#### `advanced/multi-user.md` (393 lines)

- **মূল API:** এক test এ multiple `BrowserContext`, role-wise distinct `storageState`, parallel action এর জন্য `Promise.all`।
- **কী শেখায়:** এক test এ দুই user; multiple user with auth state; multi-user fixture; collaborative document; cursor presence; RBAC role test; permission escalation; race-condition test; optimistic locking; real-time chat।

#### `advanced/network-advanced.md` (452 lines)

- **মূল API:** `page.route(url, handler)`, `route.continue({ headers, postData })`, `route.fulfill({ status, body, contentType })`, `route.fallback`, `routeFromHAR`, `context.setOffline`, `context.routeFromHAR(file, { update, notFound })`।
- **কী শেখায়:** request header/body modify; response transform; operation name দিয়ে GraphQL mock; reusable GraphQL mock fixture; mutation mocking; HAR record/playback (fallback সহ); request body দিয়ে conditional mocking; Nth request mock; delay সহ mock; throttle (slow 3G); offline mode; throttling fixture।

#### `advanced/third-party.md` (464 lines)

- **কী শেখায়:** Google OAuth mock & fixture; SAML SSO; Stripe / PayPal payment mock + fixture; email verification mock + Mailinator/temp-mail; SMS API mocking; analytics blocking + verification mocking।

---

### 6.5 `browser-apis/` — ৪টা file

#### `browser-apis/browser-apis.md` (391 lines)

- **মূল API:** `context.grantPermissions(['geolocation','clipboard-read',…])`, `context.setGeolocation`, `use: { geolocation, permissions }`, `addInitScript` দিয়ে `navigator.permissions.query` mock, `getUserMedia` mock।
- **কী শেখায়:** geolocation mock + fixture; permission denied; permission API mocking; clipboard copy/paste + fixture; Notification API mock & click; camera/microphone mock; media-device selection & error।

#### `browser-apis/iframes.md` (403 lines)

- **মূল API:** `frameLocator`, `frame()`, `page.frames()`, `page.waitForEvent('frameattached'|'framenavigated')`।
- **কী শেখায়:** `frameLocator` vs `Frame`; cross-origin iframe (Stripe / PayPal / OAuth); nested frame; dynamic iframe (runtime / changing src / lazy-loaded); iframe এর ভেতরে navigate; iframe fixture; debugging; iframe content mock।

#### `browser-apis/service-workers.md` (504 lines)

- **মূল API:** `context.serviceWorkers()`, `context.on('serviceworker')`, `context.setOffline(true)`, `context.routeFromHAR`, `caches` API check।
- **কী শেখায়:** SW registration এর জন্য wait; SW state; SW update flow; install test; unregister; cache verification & strategy; cache update; offline simulate & fallback; offline form submission queue; push subscription mock; push handler test; notification click; background sync register/event।

#### `browser-apis/websockets.md` (403 lines)

- **মূল API:** `page.on('websocket')`, `ws.on('framesent'|'framereceived'|'close')`, `page.evaluate(() => new WebSocket(...))`, SSE এর জন্য EventSource।
- **কী শেখায়:** WS connection এর জন্য wait; in/out frame monitor; `page.evaluate` দিয়ে message mock; route handler দিয়ে WS mock; reusable WS-mock fixture; live notification; live data; collaborative editing; SSE update; multi-event SSE; reconnection test।

---

### 6.6 `architecture/` — ৩টা decision guide

#### `architecture/pom-vs-fixtures.md` (363 lines)

- Comparison matrix: Page Objects vs Custom Fixtures vs Helper Functions — purpose, lifecycle, composability, "best for"।
- Selection flowchart with decision rule:
  - "৫+ interaction, ৩+ file এ use" → POM
  - "Setup AND teardown দরকার" → Fixture
  - "Stateless utility" → Helper
- Page Object example (`BookingPage`), Custom Fixture, Helper Function, Combined project structure, Anti-pattern (page object resource manage করছে, locator-only PO, monolithic fixture, helper এর side effect, simple operation এ over-abstract)।

#### `architecture/test-architecture.md` (369 lines)

- "Playwright এর জন্য test pyramid": API (60%) / Component (30%) / E2E (10%)।
- প্রতিটা test type এর decision matrix (speed, reliability, scope, maintenance cost)।
- Layering, execution profile, common mistake ("সবকিছু E2E দিয়ে test", coverage duplicate ইত্যাদি)।

#### `architecture/when-to-mock.md` (383 lines)

- "Mock vs real services" decision matrix + flowchart।
- Technique: unwanted request block; full mock (`route.fulfill`); partial mock (response modify); record/replay (HAR)।
- Real strategy: local dev server; staging; test container।
- Hybrid approach (fixture-controlled mock toggle); environment-based test project; mock accuracy validation; anti-pattern।

---

### 6.7 `frameworks/` — ৪টা framework guide

| File          | কী শেখায়                                                                                                                                                                                                                                                                                                       |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `react.md`    | Context/global-state, React Router, hook test through UI, RHF/Formik pattern, Portal (modal/tooltip), Error Boundary, experimental CT, Vite vs CRA config, StrictMode double-effect, Suspense/Lazy, memory-leak detection, anti-pattern।                                                                       |
| `angular.md`  | Reactive Forms, Material component, Router, lazy-loaded module, Signals & Observables, Zone.js / change detection, SSR test, Protractor migration reference, build config, CDK overlay container, anti-pattern।                                                                                                  |
| `vue.md`      | Vue+Vite & Nuxt 3 config, experimental CT (`@playwright/experimental-ct-vue`), Pinia store test through UI, Vue Router, `<Teleport>`, transition/animation, Composition API, Nuxt-specific pattern, v-model, Vue warning capture, anti-pattern।                                                                  |
| `nextjs.md`   | `webServer` config, env-var (`.env.test`, `.env.test.local`), App Router vs Pages Router pattern, dynamic route, API route (direct + through UI), middleware (auth redirect, security header, locale rewrite), hydration error detection, `next/image`, NextAuth setup project, dev vs production build, Turbopack, multiple webServer। |

---

### 6.8 `infrastructure-ci-cd/` — ৯টা file

#### `infrastructure-ci-cd/ci-cd.md` (468 lines)

- **কাজ:** Generic CI integration overview।
- **কী শেখায়:** GitHub Actions basic / sharded / containerised; Dockerfile + docker-compose; reporter config; CI-specific reporter (sharding এর জন্য `['blob']`); `--shard` + `npx playwright merge-reports` দিয়ে sharding; env management & secret; browser cache (`~/.cache/ms-playwright`) & node_modules cache; PR vs nightly এর জন্য tag-based filtering; project-based filtering।

#### `infrastructure-ci-cd/github-actions.md` (546 lines)

- **Workflow:** basic; sharded; container-based; staging environment with secret; scheduled nightly; reusable workflow।
- **Scenario guide + common mistake + troubleshooting** ("Missing dependencies", local-vs-CI timeout, incomplete sharded report, port conflict, PR annotation missing)।

#### `infrastructure-ci-cd/gitlab.md` (397 lines)

- `.gitlab-ci.yml` pattern: basic, sharded, env var/secret, multi-browser matrix, services (Postgres/Redis), nightly schedule।
- Troubleshooting: launch failure, navigation timeout, MR-only trigger, services unreachable, empty merged report।

#### `infrastructure-ci-cd/other-providers.md` (521 lines)

- **Jenkins:** declarative pipeline, parallel shard।
- **CircleCI:** basic, orb সহ।
- **Azure DevOps:** basic, sharding সহ।
- JUnit reporter config; platform comparison table; per-provider troubleshooting।

#### `infrastructure-ci-cd/docker.md` (283 lines)

- Official `mcr.microsoft.com/playwright` image; custom Dockerfile; docker-compose stack (app + db + tests); CI container job; dev container।
- Troubleshooting: "Executable doesn't exist", `ERR_CONNECTION_REFUSED`, mounted-volume permission, slow macOS/Windows container।

#### `infrastructure-ci-cd/parallel-sharding.md` (371 lines)

- CLI: `--workers`, `--shard=k/N`, `npx playwright merge-reports`।
- Pattern: worker config; CI machine wise sharding; shard report merge (HTML / multi-format / custom path); worker-scoped fixture; parallelism এর জন্য isolation; dynamic shard count।
- Troubleshooting: solo-passes-but-not-together, "no tests found", missing merged result, broken worker fixture, more-workers-slower।

#### `infrastructure-ci-cd/performance.md` (453 lines)

- Pattern: parallel execution config; serial execution when needed (`test.describe.serial`); parallel project; sharding; reuse-auth; reuse-page-state (isolation trade-off সহ); lazy navigation; skip-unnecessary-setup; mock API; resource type block; cache response; isolation pattern; resource management (context / memory / timeout); benchmarking; Lighthouse integration; performance checklist।

#### `infrastructure-ci-cd/reporting.md` (424 lines)

- CLI: `npx playwright show-report`, `--reporter=`, `npx playwright merge-reports --reporter=html ./blob-reports`।
- Reporter: `list`, `line`, `dot`, `html`, `json`, `junit`, `blob`, `github`, custom।
- Custom reporter implementation; trace config & viewing (`https://trace.playwright.dev`); screenshot/video option; artifact directory layout; CI artifact upload; troubleshooting (empty HTML report, traces too large, JUnit not recognised, empty merged report, missing screenshot)।

#### `infrastructure-ci-cd/test-coverage.md` (497 lines)

- V8 coverage (built-in) vs Istanbul (`nyc`, `@istanbuljs/nyc-config-typescript`)।
- Coverage fixture; per-test coverage; per-file coverage; CSS coverage; V8→Istanbul conversion; `nyc` দিয়ে HTML report; custom coverage reporter; threshold (overall + per-directory); cross-shard merging; incremental coverage; CI integration।

---

## 7. আপনার Original Required Section (এই Skill এর Context এ)

### 7.1 Test Framework Architecture (skill এর শেখানো অনুযায়ী)

- **Layered test pyramid** (`architecture/test-architecture.md`): API ≈ 60%, Component ≈ 30%, E2E ≈ 10%।
- **Reusable code organisation** (`architecture/pom-vs-fixtures.md`):
  - **Page Object** — যখন ৫+ interaction, ৩+ file এ use হবে।
  - **Custom Fixture** — যখন setup AND teardown lifecycle আছে।
  - **Helper function** — stateless utility এর জন্য।
- **Recommended directory** (`core/page-object-model.md`, `core/test-suite-structure.md`):
  ```
  e2e/
    *.spec.ts
    *.setup.ts
  pages/                # Page Objects
  components/           # Component Objects
  fixtures/             # Custom typed fixtures
  helpers/              # Stateless utilities
  data/                 # Factory / test data
  playwright/.auth/     # storageState file (.gitkeep ছাড়া gitignored)
  ```

### 7.2 Playwright Setup and Configuration (`core/configuration.md` + `core/test-suite-structure.md` থেকে)

- Bootstrap: `npm init playwright@latest`।
- Production-ready `playwright.config.ts` template এ থাকে:
  - `testDir`, `testMatch`, `fullyParallel: true`, `forbidOnly: !!process.env.CI`, `retries: process.env.CI ? 2 : 0`, `workers: process.env.CI ? '50%' : undefined`।
  - `reporter`: CI তে HTML (`open: 'never'`) + `github` reporter; locally `html` (`open: 'on-failure'`)।
  - `timeout: 30_000`, `expect.timeout: 5_000`, `actionTimeout: 10_000`, `navigationTimeout: 15_000`।
  - `use`: `baseURL`, `trace: 'on-first-retry'`, `screenshot: 'only-on-failure'`, `video: 'retain-on-failure'`, `locale`, `timezoneId`।
  - `projects`: কমপক্ষে `chromium`/`firefox`/`webkit` + `mobile-chrome`/`mobile-safari` (via `devices`)।
  - `webServer`: `command`, `url`, `reuseExistingServer: !process.env.CI`, `timeout: 120_000`।
- `dotenv` + `process.env.TEST_ENV` (`local|staging|prod`) দিয়ে environment switching।
- `webServer` build step সহ হতে পারে।

### 7.3 Fixtures and Hooks (`core/fixtures-hooks.md` থেকে)

- Built-in fixture: `page`, `context`, `browser`, `browserName`, `request`।
- Custom fixture `test.extend<MyFixtures>({ ... })` দিয়ে; pattern: `async ({ deps }, use) => { setup; await use(value); teardown; }`।
- **Scope:** `test` (default) আর `worker` (`{ scope: 'worker' }`)।
- **Option:** `[default, { option: true }]` দিয়ে fixture কে `playwright.config.ts` এর `use:` দিয়ে override করা যায়।
- **Automatic fixture:** `[fn, { auto: true }]` — request না করলেও চলে।
- **Hook:** `test.beforeEach/afterEach/beforeAll/afterAll`, `test.describe.configure({ mode: 'serial' | 'parallel' })`।
- **Authentication fixture pattern:** per-test login এর চেয়ে `storageState` + setup project + project `dependencies` better।
- **DB fixture:** isolation এর জন্য transaction-rollback; parallelism এর জন্য per-worker DB বা schema।

### 7.4 Page Objects / Utilities / Helpers

- **POM principle:**
  - `readonly page: Page` + `readonly <name>: Locator` property — constructor এ initialise।
  - Action method (`login(email, password)`), navigation method (`goto`), assertion helper (`expectError(msg)`)।
  - **Do:** constructor এ locate; action expose; `test.step` দিয়ে group; method এর শেষে assert।
  - **Don't:** logic ছাড়া pure locator getter; deep inheritance; external resource manage (এর জন্য fixture use করুন)।
- **Component Object:** reusable UI fragment এর mirror (`NavbarComponent`, `ModalComponent`)।
- **Composition:** page-with-component — page তার sub-component construct ও expose করে।
- **Helper:** stateless utility (`randomEmail()`, `formatPrice()`, `buildUrl()`)।

### 7.5 Test Data Management (`core/test-data.md` থেকে)

- **Factory function** use করুন — sensible default + override argument সহ একটা entity produce করে।
- Variant compose করার জন্য **trait** use করুন (`adminUser()`, `bannedUser()`)।
- Realistic data এর জন্য **`@faker-js/faker`**; reproducibility এর জন্য **seed** করুন (`faker.seed(testInfo.workerIndex)`)।
- Factory কে fixture এ wrap করুন — যাতে প্রতিটা test নিজস্ব instance পায়।
- Data-driven test এর জন্য: array iterate + `test('case ' + i, …)` (Playwright এ `test.each` নাই, plain loop use করুন)।
- DB seeding: direct DB write এর চেয়ে **API-based seeding** preferable (public surface use করে); DB integration test এ **transaction rollback**।

### 7.6 Authentication / Login Flow

- **Default pattern:** setup project `*.setup.ts` একবার login করে → `storageState` save করে `playwright/.auth/<role>.json` এ → অন্য project গুলো `setup` এর উপর dependency রাখে এবং `use: { storageState }` দেয়।
- **Per-worker auth** worker-scoped fixture দিয়ে — parallel-safe state এর জন্য।
- **Multiple role:** প্রতি role এর জন্য আলাদা storage file (`admin.json`, `user.json`, `guest.json`)।
- **API login** > UI login (যখন possible — faster, more reliable)।
- **OAuth/SSO:** real provider এ না গিয়ে `page.route` দিয়ে IdP mock করুন; real OAuth লাগলে `advanced/multi-context.md` দেখুন।
- **MFA:** OTP endpoint intercept করে known code inject করুন বা verification endpoint mock করুন।
- **Complex flow:** email verification (mock email API থেকে token capture), password reset (complete + expired token), session timeout (extension warning + action), remember-me persistent vs session-only, logout (standard + all-devices)।

### 7.7 API / Network Handling

- **`request` fixture** API client (`request.get/post/put/patch/delete`); parallel-safe API test এর জন্য `request.newContext({ baseURL, extraHTTPHeaders, storageState })` দিয়ে context বানান।
- **Schema validation:** Zod (`schema.parse(await response.json())`)।
- **Network interception:** `page.route(pattern, handler)` with `route.continue` / `route.fulfill` / `route.abort` / `route.fallback`।
- **HAR:** `context.routeFromHAR(file, { update, notFound: 'fallback' })` — record/replay এর জন্য।
- **GraphQL:** `request.postDataJSON()` থেকে `operationName` parse করে mock।
- **Throttling/offline:** `context.setOffline(true)`; slow 3G এর জন্য intercept করে `await new Promise(r => setTimeout(r, ...))` add করুন।
- **Error response:** 4xx/5xx test করুন; UI fallback / retry behaviour assert করুন।

### 7.8 Environment / Config Notes

- `.env` strategy: `.env.example` commit; `.env.local`, `.env.staging`, `.env.production` gitignore।
- `globalSetup` test এ pass করার মতো object return করে (sparingly use করুন — setup project preferred)।
- Setup project: `testMatch: /.*\.setup\.ts/` + `dependencies: ['setup']` সাধারণত better (retry/sharding এ অংশ নেয়)।
- Dependency chain হতে পারে (`['auth-setup', 'data-seed']`), আর `teardown:` project dependent এর পরে চলে।

### 7.9 Reporting and Debugging

- **Reporter:** `list` (default local), CI noise এর জন্য `line`/`dot`, `html` (CI তে `open: 'never'`), `json`, `junit`, `blob` (sharding এর জন্য), `github` (PR annotation), custom (`Reporter` interface)।
- **Trace viewer:** `npx playwright show-trace <path>` বা <https://trace.playwright.dev>; default policy `trace: 'on-first-retry'`।
- **Sharded merge:** প্রতি shard এ `blob` report save → `npx playwright merge-reports --reporter=html ./blob-reports`।
- **Debug tool:** Playwright Inspector (`PWDEBUG=1` বা `--debug`), UI mode (`--ui`), `--headed`, `page.pause()`, `npx playwright codegen`।
- **Flakiness reproduction:** local এ `--repeat-each=N`, `--workers=1`, `CI=true`; flaky pass log করার জন্য `testInfo.retry` check।
- **Debugging checklist:** symptom-by-symptom (element not found → locator/wait), step-by-step process, network monitoring (`page.on('request')`), CI-specific difference, screenshot/visual diff comparison।

### 7.10 Commands to Run Tests

```bash
# Run / target
npx playwright test                              # সব test
npx playwright test tests/checkout.spec.ts       # single file
npx playwright test --project=chromium           # specific project
npx playwright test --grep @smoke                # tag দিয়ে
npx playwright test --grep-invert @slow          # tag বাদ দিয়ে
npx playwright test --workers=1                  # serialise
npx playwright test --repeat-each=20             # stability confirm
npx playwright test --shard=1/4                  # CI এর জন্য split

# Mode
npx playwright test --headed                     # visible browser
npx playwright test --debug                      # Inspector
npx playwright test --ui                         # UI mode
PWDEBUG=1 npx playwright test                    # alt inspector trigger
CI=true npx playwright test                      # CI mode local এ

# Snapshot, trace, report
npx playwright test --update-snapshots           # visual snapshot update
npx playwright show-trace path/to/trace.zip
npx playwright show-report
npx playwright merge-reports --reporter=html ./blob-reports

# Tooling
npx playwright codegen https://example.com
npx playwright install
npx playwright install --with-deps
```

### 7.11 Important Dependencies (skill এ যেগুলো mention আছে)

| Package                                          | কোথায় use                                       | কাজ                                            |
| ------------------------------------------------ | ----------------------------------------------- | ----------------------------------------------- |
| `@playwright/test`                               | সব জায়গায়                                       | Core test runner                                |
| `@playwright/experimental-ct-react`              | `frameworks/react.md`, `component-testing.md`   | React component testing                         |
| `@playwright/experimental-ct-vue`                | `frameworks/vue.md`                             | Vue/Nuxt component testing                      |
| `@playwright/experimental-ct-svelte`             | `component-testing.md`                          | Svelte CT                                       |
| `@playwright/experimental-ct-solid`              | `component-testing.md`                          | Solid CT                                        |
| `electron`                                       | `testing-patterns/electron.md`                  | Electron app under test                         |
| `@axe-core/playwright`                           | `accessibility.md`                              | Axe-core a11y scanner                           |
| `@faker-js/faker`                                | `core/test-data.md`                             | Realistic test data                             |
| `playwright-lighthouse`, `lighthouse`            | `performance-testing.md`                        | Lighthouse audit                                |
| `dotenv`                                         | `core/configuration.md`                         | `.env*` file load                               |
| `nyc`, `@istanbuljs/nyc-config-typescript`       | `infrastructure-ci-cd/test-coverage.md`         | Istanbul-based coverage report                  |
| `web-vitals` (inline script এ)                   | `performance-testing.md`                        | LCP/FID/CLS measurement                         |
| `zod` (Schema Validation এ)                      | `testing-patterns/api-testing.md`               | API response এর runtime schema validation       |

> এই skill নিজে কোনো `package.json` ship করে না। উপরের list গুলো actual project এ install করতে হবে — pattern এর উপর ভিত্তি করে।

---

## 8. Coding Conventions (এই skill এ যেগুলো follow করা হয়েছে)

- **TypeScript-first.** সব snippet এ `import { test, expect } from '@playwright/test'`।
- **Web-first assertion only.** Primary pattern এ `await page.waitForTimeout()` নেই; `expect(locator).toBe...` use করা হয়।
- **No hard wait.** `expect.poll`, `expect.toPass`, `waitForLoadState`, `waitForResponse`, `waitForFunction` use করুন।
- **Locator priority:** `getByRole` > `getByLabel`/`getByPlaceholder` > `getByText`/`getByTitle` > `getByTestId` > raw CSS/XPath।
- **`test.describe`** দিয়ে grouping; `test.step` দিয়ে sub-step reporting।
- **Tag via detail object:** `test('name', { tag: ['@smoke','@critical'] }, async ({ page }) => {...})`।
- **POM constructor এ locator wire করা হয়**, প্রতি call এ re-query করে এমন method না (locator এমনিই lazy)।
- Parallel-friendly auth এর জন্য **setup project** preferred (over `globalSetup`)।
- **Fixture lifecycle owner** (setup + teardown); helper stateless থাকে।
- প্রতি config এ **CI flag:** `forbidOnly: !!process.env.CI`, `retries: process.env.CI ? 2 : 0`।
- **First retry এ artifact:** `trace: 'on-first-retry'`, `screenshot: 'only-on-failure'`, `video: 'retain-on-failure'`।
- **Boundary তে mock** (`page.route` / `request`), page এর ভেতরে না।
- প্রতিটা guide শেষে **Anti-Patterns** + (প্রায়ই) **Troubleshooting** section আছে — implement এর আগে পড়ুন।

---

## 9. কীভাবে এই Skill নতুন Automation Task এর জন্য Use করবেন

(আপনার original "How to add new test cases / page objects / reuse components" এর জায়গায় — কারণ এই repo তে add করার মতো codebase নেই।)

1. **কাজের type identify করুন** — §4 (Skill Activation Triggers) দেখুন।
2. **Activity → Reference map** (§5) থেকে ১-৩টা reference file খুঁজে বের করুন।
3. **সেই `.md` file গুলো পড়ুন** code লেখার আগে; বিশেষ করে `Anti-Patterns` আর `Troubleshooting` section টা অবশ্যই পড়ুন।
4. **Pattern mirror করুন** আপনার actual project এ। Selector, URL, data নিজের app অনুযায়ী adapt করুন।
5. **Test Validation Loop** (`SKILL.md` থেকে):
   1. `npx playwright test --reporter=list`
   2. Fail হলে: trace দেখুন (`npx playwright show-trace`), locator/wait/assertion fix করুন, re-run।
   3. সব pass হলেই এগোন।
   4. Critical path এর জন্য multiple বার চালান: `npx playwright test --repeat-each=5`।
6. **Test tag করুন** properly (`@smoke`, `@critical`, `@slow`, …) — যাতে CI filtering কাজ করে।
7. **Flaky হলে:** `debugging/flaky-tests.md` এ যান, decision tree follow করুন।

---

## 10. Risk / Gap / Missing Area (এই Skill এ যা **নেই**)

- **No BDD / Cucumber layer.** Skill Playwright Test runner assume করে; `@cucumber/cucumber`, `playwright-bdd` ইত্যাদি cover না।
- **No SaaS dashboard guidance.** Skill টা Currents.dev publish করেছে, কিন্তু Currents-specific reference নেই; `currents.dev`, `@currents/playwright`, বা অন্য test orchestration platform এর integration documented না।
- **No Playwright MCP guidance.** Skill টা Playwright MCP mention করে না (যদিও official site এ MCP এখন "Getting Started" এ আছে)।
- **CI provider covered:** GitHub Actions (deepest), GitLab, Jenkins, CircleCI, Azure DevOps, Docker। **Not covered:** Buildkite, Bitbucket Pipelines, TeamCity, Drone, Bamboo, AWS CodeBuild (generic Docker এর বাইরে)।
- **Cloud runner:** কোনো vendor-specific guidance নেই (BrowserStack, Sauce Labs, LambdaTest, Microsoft Playwright Testing service)।
- **Reporter:** Third-party reporter (Allure, Currents, ReportPortal, Slack) এর first-class section নেই।
- **Disabled lint rule:** `.agnix.toml` `AS-017` disable করে; এই rule এর meaning repo তে documented না।
- **Version pinning:** snippet specific Playwright version এ pin করা না; নতুন API (`page.clock`, `expect.configure`) এর জন্য current docs দেখতে হবে।
- **Limited Mobile Safari touch coverage** — skill নিজেই বলেছে real iOS testing এর তুলনায় Playwright এর touch emulation এ limit আছে।
- **No accessibility-snapshot API** (নতুন `aria-snapshot` family) mention নেই।
- `architecture/when-to-mock.md` আর `architecture/test-architecture.md` opinionated decision framework — different testing pyramid wala team কে adapt করতে হবে।

---

## 11. Recommendation (Playwright Official Doc এর সাথে validate করা)

> নিচের প্রতিটা item একটা **suggested improvement** — যেকোনো team এর জন্য যারা এই skill নিজের codebase এ adopt করবে। *upstream repo তে এগুলো এখনো নেই।*

- **Recommendation:** একটা ছোট `mcp.md` add করুন (বা `core/configuration.md` এ section), যেখানে Playwright MCP আর `npx @playwright/mcp@latest` cover করুন — কারণ MCP এখন official docs এর primary workflow।
- **Recommendation:** `core/configuration.md` মিরর করার সময় `@playwright/test` কে latest LTS Node-supported version এ pin করুন (Node 20.x / 22.x / 24.x — official system requirement অনুযায়ী), আর CI তে `npx playwright install --with-deps` চালান।
- **Recommendation:** Slow বা animated page এর target এর সময় action এর আগে অবশ্যই **`expect(locator).toBeVisible()`** দিন — skill auto-waiting শেখায় (যেটা কাজ করে), কিন্তু explicit pre-assertion failure earlier surface করে।
- **Recommendation:** CI তে **`html` reporter `open: 'never'`** + `github` reporter use করুন, আর প্রতিটা run এ `playwright-report/` artifact upload করুন।
- **Recommendation:** `console.log` দিয়ে debug করার চেয়ে — `trace: 'on-first-retry'` + locally `--ui` mode pair করুন (Playwright এর recommended interactive workflow)।
- **Recommendation:** Visual regression এর জন্য — Playwright recommend করে **CI এর same OS এ snapshot generate** করতে (locally Docker দিয়ে)। এটা না করলে skill এর `visual-regression.md` এ flag করা platform-diff problem হবে।
- **Recommendation:** TS project এ skill adopt করার সময় **strict TypeScript** (`tsconfig.json` এ `"strict": true`) enable করুন — skill এর snippet strict typing assume করে।
- **Recommendation:** `@axe-core/playwright` এর সাথে নতুন **`aria-snapshot`** assertion (newer Playwright) pair করুন — শুধু axe এর চেয়ে richer a11y coverage হবে।
- **Recommendation:** **trace.playwright.dev** কে team bookmark বানান — PR review তে failure trace share করা সহজ।
- **Recommendation:** Slow-but-deterministic flow এর জন্য global `expect.timeout` না বাড়িয়ে **explicit `expect.configure({ timeout })`** use করুন (default tight রাখুন)।
- **Recommendation:** Currents.dev বা similar dashboard এর সাথে use করলে **`@currents/playwright`** (বা vendor equivalent) additional reporter হিসেবে add করুন — cross-run analytics এর জন্য। Skill এটা cover করে না।

---

## 12. Quick Start Guide (নতুন Automation Task এর জন্য)

৭ ধাপের checklist — যেকোনো Playwright task শুরু করার সময় follow করুন:

1. **Task classify করুন** — §4 trigger এর সাথে user intent match করান।
2. **Right reference open করুন** — §5 Activity → Reference map।
3. File এর **TOC + Anti-Patterns + Troubleshooting** skim করুন code লেখার আগে।
4. **Implement করুন** — closest snippet copy, নিজের selector/data দিয়ে adapt।
5. Test **tag** করুন (`@smoke` / `@critical` / `@slow`)।
6. **Validation Loop run** — `npx playwright test --reporter=list`; flake হলে `--repeat-each=5`।
7. যেকোনো failure এর জন্য **trace inspect** (`npx playwright show-trace`)।

---

## 13. Appendix A — সব 57টা File এর Index (Alphabetical)

| Path                                             | Lines | এক লাইনের summary                                                                                                |
| ------------------------------------------------ | ----- | ----------------------------------------------------------------------------------------------------------------- |
| `.agnix.toml`                                    | 2     | agnix lint rule `AS-017` disable করে।                                                                             |
| `.github/workflows/validate-skill.yml`           | 18    | Single CI job; push/PR (main) এ `agent-sh/agnix` lint run।                                                       |
| `LICENSE.md`                                     | —     | MIT license।                                                                                                      |
| `README.md`                                      | 147   | Human entry point: install + সব 57 reference এর categorised table।                                                |
| `SKILL.md`                                       | 304   | Machine entry point: frontmatter + Activity → Reference table + decision tree + Test Validation Loop।             |
| `advanced/authentication.md`                     | 871   | Storage-state, multi-role, per-worker auth, OAuth/SSO mock, MFA, troubleshooting।                                  |
| `advanced/authentication-flows.md`               | 360   | Email verification, password reset, session timeout, remember-me, logout pattern।                                  |
| `advanced/clock-mocking.md`                      | 364   | `page.clock` API, fixed time, advance/pause, timezone, timer/interval/animation-frame mock।                       |
| `advanced/mobile-testing.md`                     | 409   | `devices`, custom mobile profile, tap/swipe/pinch, viewport test, mobile UI pattern।                              |
| `advanced/multi-context.md`                      | 288   | Popup, new tab, OAuth popup, multi-window, tab switching/coordination।                                             |
| `advanced/multi-user.md`                         | 393   | এক test এ multiple context, RBAC, real-time collaboration, race condition, optimistic locking।                     |
| `advanced/network-advanced.md`                   | 452   | `page.route` modify/transform, GraphQL mock, HAR record/replay, throttling, conditional/Nth-request mock।          |
| `advanced/third-party.md`                        | 464   | Google OAuth, SAML, Stripe, PayPal, email verification, SMS, analytics mocking।                                    |
| `architecture/pom-vs-fixtures.md`                | 363   | কখন Page Object vs Custom Fixture vs Helper Function।                                                              |
| `architecture/test-architecture.md`              | 369   | Test pyramid: 60% API / 30% Component / 10% E2E।                                                                  |
| `architecture/when-to-mock.md`                   | 383   | Mock vs real services decision matrix; HAR; hybrid fixture-controlled mocking।                                     |
| `browser-apis/browser-apis.md`                   | 391   | Geolocation, permission, clipboard, notification, camera/microphone mock।                                          |
| `browser-apis/iframes.md`                        | 403   | `frameLocator`, cross-origin, nested, dynamic, navigation, iframe fixture।                                         |
| `browser-apis/service-workers.md`                | 504   | SW registration, lifecycle, cache, offline, push notification, background sync।                                    |
| `browser-apis/websockets.md`                     | 403   | WS connect/monitor, `page.evaluate` বা route দিয়ে mock, SSE, reconnection।                                         |
| `core/annotations.md`                            | 424   | `test.skip/fixme/fail/slow`, `test.step`, custom annotation & reporter integration।                                |
| `core/assertions-waiting.md`                     | 361   | Web-first assertion, `expect.poll`, `expect.toPass`, soft, custom matcher, timeout।                                |
| `core/configuration.md`                          | 452   | Production-ready `playwright.config.ts`, env-based config, troubleshooting।                                         |
| `core/fixtures-hooks.md`                         | 417   | Built-in / custom / option / automatic / worker-scoped fixture, hook, auth + DB pattern।                            |
| `core/global-setup.md`                           | 434   | `globalSetup`/teardown vs setup-project vs worker fixture; DB & service orchestration।                              |
| `core/locators.md`                               | 242   | Locator priority, filter/chain, dynamic, Shadow DOM, iframe, debugging।                                              |
| `core/page-object-model.md`                      | 315   | POM basics, component object, composition, factory, do/don't, directory structure।                                   |
| `core/projects-dependencies.md`                  | 453   | Multi-browser project, dependency, setup/teardown project, env-based, conditional।                                    |
| `core/test-data.md`                              | 492   | Factory, trait, relationship, Faker (incl. seeded), data-driven, DB seeding & rollback।                                |
| `core/test-suite-structure.md`                   | 361   | Project bootstrap, essential config, E2E/Component/API/Visual example, directory।                                       |
| `core/test-tags.md`                              | 298   | Detail object দিয়ে `@tag`, group tagging, OR/AND filter, env-based filter, taxonomy।                                  |
| `debugging/console-errors.md`                    | 420   | Console message capture/filter, error এ fail, allow-list, comprehensive console fixture।                                |
| `debugging/debugging.md`                         | 504   | Inspector, UI mode, headed, trace viewer, network debug, CI debug, common-issue taxonomy।                                |
| `debugging/error-testing.md`                     | 360   | Error boundary, network failure, offline, loading/empty state, validation testing।                                        |
| `debugging/flaky-tests.md`                       | 496   | Flakiness taxonomy, reproduction, type-wise fix, CI cause, quarantine, prevention।                                          |
| `frameworks/angular.md`                          | 530   | Angular config, locator strategy, Reactive Form, Material, Router, Signals, Zone.js, SSR।                                    |
| `frameworks/nextjs.md`                           | 469   | Next config (`webServer`), App vs Pages Router, dynamic route, API route, middleware, NextAuth।                              |
| `frameworks/react.md`                            | 531   | Context/state, RR, hook, RHF/Formik, Portal, Error Boundary, CT, Strict Mode, Suspense।                                       |
| `frameworks/vue.md`                              | 574   | Vue+Vite & Nuxt 3, CT, Pinia, Vue Router, Teleport, transition, Composition API, v-model।                                      |
| `infrastructure-ci-cd/ci-cd.md`                  | 468   | Generic CI overview: GH Actions / Docker / reporting / sharding / env / caching / tag-based filter।                              |
| `infrastructure-ci-cd/docker.md`                 | 283   | Official image, custom Dockerfile, docker-compose, CI container job, dev container, troubleshooting।                              |
| `infrastructure-ci-cd/github-actions.md`         | 546   | Basic / sharded / containerised / scheduled / reusable workflow + scenario guide + troubleshooting।                                 |
| `infrastructure-ci-cd/gitlab.md`                 | 397   | `.gitlab-ci.yml`: basic, sharded, env, multi-browser matrix, services, nightly, troubleshooting।                                     |
| `infrastructure-ci-cd/other-providers.md`        | 521   | Jenkins (declarative + parallel shard), CircleCI (basic + orb), Azure DevOps (basic + sharding)।                                       |
| `infrastructure-ci-cd/parallel-sharding.md`      | 371   | Worker config, machine wise sharding, merge-reports, worker-scoped fixture, dynamic shard count।                                          |
| `infrastructure-ci-cd/performance.md`             | 453   | Parallel/serial, sharding, reuse-auth/page-state, network optimization, isolation, benchmarking, Lighthouse।                                |
| `infrastructure-ci-cd/reporting.md`               | 424   | Reporter, custom reporter, trace config & viewing, screenshot/video, artifact upload, troubleshooting।                                       |
| `infrastructure-ci-cd/test-coverage.md`           | 497   | V8 vs Istanbul coverage, fixture, per-file/CSS, conversion, HTML report, threshold, shard merge, CI।                                            |
| `testing-patterns/accessibility.md`               | 359   | `@axe-core/playwright`, scoped scan, a11y fixture, keyboard/ARIA/focus, color/contrast, CI gate।                                                  |
| `testing-patterns/api-testing.md`                 | 719   | Authenticated `request` fixture, CRUD, dedicated API project, response/error/file-upload/chained call, Zod।                                        |
| `testing-patterns/browser-extensions.md`           | 506   | `--load-extension` সহ `launchPersistentContext`, MV2 vs MV3, popup/background/content script, Storage/Tabs API।                                      |
| `testing-patterns/canvas-webgl.md`                 | 493   | Canvas locate, screenshot/data extract, WebGL, Three.js, Chart.js, D3/ECharts, frame-by-frame, game state।                                            |
| `testing-patterns/component-testing.md`            | 500   | Framework wise CT install, mounting, prop/state, event/slot, mock, framework-specific pattern।                                                          |
| `testing-patterns/drag-drop.md`                   | 576   | Kanban, sortable list, native HTML5 DnD, file drop, canvas drag, keyboard, cross-frame, touch।                                                            |
| `testing-patterns/electron.md`                    | 509   | `_electron.launch`, multi-window, main/renderer, IPC, native dialog/menu/notification/clipboard, packaged app।                                              |
| `testing-patterns/file-operations.md`              | 377   | Basic up/download, custom path, content verify (PDF/XLSX/JSON), buffer upload, drag-and-drop।                                                                |
| `testing-patterns/file-upload-download.md`         | 562   | Deeper upload/download: progress/cancel/retry, type/size/count/dimension validation, image preview, auth download।                                            |
| `testing-patterns/forms-validation.md`             | 561   | Auto-complete, conditional field, multi-step wizard, submission, date, validation, reset, troubleshooting।                                                      |
| `testing-patterns/graphql-testing.md`              | 331   | Query/mutation, validation/auth error, authenticated GraphQL fixture, helper, troubleshooting।                                                                    |
| `testing-patterns/i18n.md`                        | 508   | Locale config, RTL, date/number/currency format, missing translation, text overflow, locale-specific snapshot, font।                                                |
| `testing-patterns/performance-testing.md`          | 476   | Web Vitals (LCP/FID/CLS), navigation/resource/memory timing, budget, `playwright-lighthouse` দিয়ে Lighthouse, CI tracking।                                            |
| `testing-patterns/security-testing.md`             | 430   | Reflected/stored XSS, CSRF token, session expiry, RBAC/IDOR, SQLi, input limit, security header, CSP।                                                                  |
| `testing-patterns/visual-regression.md`            | 634   | `toHaveScreenshot`, mask, animation disable, threshold, full-page vs element, responsive, component, troubleshooting।                                                  |

> 57টা guide এর মোট reference line ≈ **26,051**।

---

## 14. Maintenance Notes

- এই memory upstream repo এর commit **`ef329e7`** snapshot এ লেখা। Upstream update হলে — re-clone করে `SKILL.md`, activity table, আর নতুন কোনো file এর diff দেখুন stale content এর উপর rely করার আগে।
- Upstream linter (`agnix`) skill metadata violation block করে; fork করলে fork এ same workflow চালান।
- Team internally mirror করলে — original folder name (`core/`, `advanced/` ইত্যাদি) রাখুন, যাতে এই memory এর cross-reference valid থাকে।

---

## ⭐ Bonus: Learner এর জন্য কিছু Extra Tips

### টপ ৫ "মুখস্থ রাখার মতো" জিনিস

1. **Locator hierarchy:** `getByRole` → `getByLabel` → `getByText` → `getByTestId` → CSS/XPath (last resort)।
2. **Auto-wait আছে — hard wait দেবেন না:** `expect(locator).toBeVisible()` use করুন, `waitForTimeout(2000)` না।
3. **Auth pattern:** একবার login → `storageState` save → সব test এ reuse। প্রতি test এ login = waste।
4. **Test pyramid:** API 60% / Component 30% / E2E 10%। সবকিছু E2E দিয়ে test করবেন না।
5. **Trace on first retry:** `trace: 'on-first-retry'` সবচেয়ে balanced setting (CI এ overhead কম, fail হলে full info)।

### "এই কাজে কোন file পড়ব?" — ছোট cheat sheet

| আপনার কাজ                       | প্রথমে যান                                            |
| --------------------------------- | --------------------------------------------------- |
| নতুন test লিখব                    | `core/test-suite-structure.md`                      |
| Selector ঠিক হচ্ছে না              | `core/locators.md`                                  |
| Test flaky                        | `debugging/flaky-tests.md`                          |
| Login automate করতে চাই            | `advanced/authentication.md`                        |
| API mock করব                      | `advanced/network-advanced.md`                      |
| Form fill / validation             | `testing-patterns/forms-validation.md`              |
| Visual regression                  | `testing-patterns/visual-regression.md`             |
| GitHub Actions setup               | `infrastructure-ci-cd/github-actions.md`            |
| Sharding / parallel                | `infrastructure-ci-cd/parallel-sharding.md`         |
| Trace দেখব                        | `infrastructure-ci-cd/reporting.md` + Trace viewer  |
| POM না Fixture decide              | `architecture/pom-vs-fixtures.md`                   |

### সবচেয়ে useful CLI command (মুখস্থ)

```bash
# Daily use
npx playwright test --ui                    # interactive, time-travel debugging
npx playwright test --headed --debug        # browser visible + Inspector
npx playwright test --grep @smoke           # smoke test শুধু
npx playwright show-trace trace.zip         # failure trace দেখুন
npx playwright codegen https://example.com  # selector generate

# Flaky debug
npx playwright test --repeat-each=10 --workers=1   # stability check
CI=true npx playwright test                          # CI environment simulate
```

---

*শেষ। শুভকামনা — Playwright এ মজা পাবেন ☺*
