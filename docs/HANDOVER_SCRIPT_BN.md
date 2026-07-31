# বাংলা ভিডিও হ্যান্ডওভার স্ক্রিপ্ট (FlexOrder E2E)

এই ডকটি **FlexOrder E2E** অটোমেশন রিপোজিটরির জন্য প্রায় **২০ মিনিট** দৈর্ঘ্যের হ্যান্ডওভার ভিডিও রেকর্ড করতে স্পিকার স্ক্রিপ্ট। রেকর্ডিংয়ের সময় IDE/টার্মিনালে সংশ্লিষ্ট ফাইল খুলে দেখান।

**দ্রষ্টব্য:** [FILE_MAPPING.md](./FILE_MAPPING.md)-এ কিছু স্পেক (যেমন `a-activateProVersion`, `createNewOrder`) এখন কোডে মূলত commented; নিচে বলা আছে কোনগুলো সক্রিয় টেস্ট।

---

## রেকর্ডিং চেকলিস্ট (প্রেজেন্টার)

রেকর্ড শুরুর আগে দ্রুত চেক:

- [ ] স্ক্রিন রেজোলিউশন ও মাইক পরিষ্কার আওয়াজ
- [ ] ট্যাবে খোলা: `README.md`, `playwright.config.ts`, `tests/global-setup.ts`, `tests/specs/` (ফোল্ডার), `src/pages/` (ফোল্ডার)
- [ ] (ঐচ্ছিক) টার্মিনালে `npm test` বা `npm run test:ui` এক লাইন দেখানোর জন্য প্রস্তুতি
- [ ] নিচের টাইম সেগমেন্ট অনুযায়ী কথা বলা—প্রয়োজনে পজ নিয়ে টাইমিং ধরে নিন

---

## সম্পূর্ণ ভিডিও স্ক্রিপ্ট (~২০ মিনিট)

### 0:00–2:00 — ইন্ট্রো ও প্রজেক্ট ওভারভিউ

হ্যালো, আজকের ভিডিওটা আমাদের **FlexOrder E2E অটোমেশন** প্রজেক্টের হ্যান্ডওভার walkthrough। লক্ষ্য একটাই—তুমি ভিডিও শেষে বুঝবে এই রিপো কী করে, ফোল্ডারগুলো কেন এভাবে সাজানো, টেস্ট কীভাবে চলে, আর নতুন টেস্ট যোগ করতে গেলে কোথায় হাত দিতে হবে।

এক লাইনে বললে: এটা **Playwright + TypeScript** দিয়ে লেখা একটি স্যুট, যা **FlexOrder** প্লাগইনের সাথে **WooCommerce** আর **Google Sheets** ইন্টিগ্রেশন যাচাই করে। আমরা **WordPress অ্যাডমিন UI**-তেও যাই, **WooCommerce REST API** দিয়েও ডেটা চেক করি, আর **শিট আপডেট** করে অর্ডার স্ট্যাটাস সিঙ্ক দেখি।

এই রিপোটা শুধু লোকাল টেস্ট নয়—এটা **CI/CD workflow রিপোজিটরি**: GitHub Actions এ **self-hosted** রানারে Docker দিয়ে ফ্রেশ WordPress উঠিয়ে টেস্ট চালানো হয়; আবার **repository_dispatch** দিয়ে প্লাগইন রিপো থেকে push হলে এখানে টেস্ট ট্রিগার হতে পারে।

(স্ক্রিনে রিপোর README খুলে দেখাও—`README.md` থেকে Overview সেকশন। এখানে ফোকাস দাও।)

ঠিক এখান থেকে আমরা ঢুকব রিপো স্ট্রাকচারে—যাতে মানচিত্রটা মাথায় বসে।

---

### 2:00–4:30 — রিপোজিটরি / ফোল্ডার স্ট্রাকচার ও রুট ফাইল

চলো ট্রি মানসিকভাবে ধরি। রুট লেভেলে যা বারবার লাগবে:

- **`package.json`** — `npm run test`, `test:headed`, `test:ui`, `test:debug`, `test:ci:full`, `validate` ইত্যাদি স্ক্রিপ্ট; ডিপেন্ডেন্সিতে `@playwright/test`, WooCommerce API ক্লায়েন্ট, Google API লাইব্রেরি।
- **`playwright.config.ts`** — টেস্ট ডিরেক্টরি, গ্লোবাল সেটআপ/টিয়ারডাউন, টাইমআউট, রিপোর্টার, worker সংখ্যা, `baseURL`—সব মূল কনফিগ।
- **`tsconfig.json`** — TypeScript কম্পাইল রুল।
- **`.env.example`** — লোকাল/CI ভেরিয়েবল টেমপ্লেট; নতুন ডেভ **এটা কপি করে `.env` বানায়**।
- **`docker-compose.fresh-wordpress.yml`** — লোকালে WordPress+MySQL স্ট্যাক।
- **`.github/workflows/ci-workflow.yml`** — মূল CI পাইপলাইন।
- **`.github/flexorder_workflow/`** — ডিসপ্যাচ-সম্পর্কিত YAML।
- **`docs/`** — এক্সিকিউশন গাইড, ফাইল ম্যাপিং, বাংলা বিগিনার গাইড ইত্যাদি।

মূল সোর্স কোড **`src/`**-এ: `pages` (Page Object), `config`, `services`, `utils`, `interfaces`।

টেস্ট **`tests/specs/`**-এ `*.spec.ts`।

(ফাইল এক্সপ্লোরারে রুট থেকে `src`, `tests`, `.github`, `docs` একসাথে দেখাও।)

---

### 4:30–7:00 — গুরুত্বপূর্ণ ফোল্ডার ও ফাইল (একটু গভীরে)

**`src/pages/`** — POM: `login.ts` ওয়ার্ডপ্রেস লগইন; `flexorder-setup.ts` সেটআপ উইজার্ড; `ultimateSettings.ts` বড় Ultimate সেটিংস UI; `createNewOrder.ts`, `update-order-status.ts` পেজ/হেল্পার লজিক—স্পেক অনুযায়ী ব্যবহৃত।

**`src/config/`** — `environment.ts` `.env` লোড, Woo ক্রেডেনশিয়াল `api-keys.json` বা env থেকে; `flaky-tests-reporter.ts` রিট্রাই পর ফ্লেকি ট্র্যাকিং।

**`src/services/`** — যেমন `google-sheet-api.ts` API র‍্যাপার।

**`src/utils/`** — `googleSheetHelper.ts` শিট-কাজের হেল্পার।

**`src/interfaces/`** — টাইপ শেয়ারিং (`order.ts`, `google-sheets.ts`)।

**`tests/`** — `global-setup.ts`: CI তে env ভ্যালিডেশন, ফোল্ডার তৈরি, সাইট রিচেবিলিটি, লোকালে placeholder auth; `global-teardown.ts` ক্লিনআপ; `fixtures/` এ `.auth/user.json`, সার্ভিস অ্যাকাউন্ট JSON ইত্যাদি।

**`scripts/`** — CI ডেটা প্রিপ: `setup-ci-environment.ts`; `verify-dispatch-config.ts`; Windows রানারের জন্য `.ps1` ফাইলগুলো।

**`flaky-tests/`** — কাস্টম রিপোর্টার আউটপুট।

(`global-setup.ts` এই ফাইলটা open করো—টেস্টের আগে কী কী চেক হয়, এক পলকে বলো।)

---

### 7:00–9:30 — গুরুত্বপূর্ণ টেস্ট কেস—কী পয়েন্ট

**সক্রিয় স্পেক (Playwright `testMatch` অনুযায়ী):**

1. **`tests/specs/a-flexorder-setup.spec.ts`** — `LoginPage` + `SetupAddCredentialsPage`: অ্যাডমিনে ঢুকে প্লাগইন সেটআপ ফ্লো, শেষে "Congratulations" হেডিং ভিজিবল—মানে বেস লাইন সেটআপ OK।

2. **`tests/specs/a-woocommerceAPI.spec.ts`** — ব্রাউজার কম কাজ; মূলত **WooCommerce REST API** কানেক্টিভিটি, সেটিংস, প্রোডাক্ট লিস্ট ইত্যাদি—`loadWooCommerceCredentials()` দিয়ে কী লোড হয় সেটা বোঝা জরুরি।

3. **`tests/specs/update-order-status.spec.ts`** — `OrderStatusUpdater`: শিট থেকে অর্ডার পড়া, স্ট্যাটাস চেঞ্জ, মেমরিতে ট্র্যাক, তারপর WooCommerce এ স্ট্যাটাস মিলিয়ে দেখা; বাল্ক আপডেট টেস্টে টাইমআউট বাড়ানো আছে।

4. **`tests/specs/ultimateSettings.spec.ts`** — বড় স্যুট: টগল, সর্টিং, সেপারেটর—`LoginPage`, `OrderSyncSettingsPage`, `GoogleSheetAPI`, `GoogleSheetHelper`; শিট URL/সার্ভিস অ্যাকাউন্ট env থেকে।

**রেফারেন্স/বর্তমানে নিষ্ক্রিয়:** `createNewOrder.spec.ts` ও `a-activateProVersion.spec.ts` মূলত commented—হ্যান্ডওভারে বলো "রিঅ্যাক্টিভেট করলে `.env.example` অনুযায়ী লাইসেন্স/শিট লাগবে।"

(প্রতিটি সক্রিয় স্পেক ফাইল একবার ট্যাবে বা ট্রিতে হাইলাইট করো।)

---

### 9:30–11:30 — ওভারঅল টেস্ট ওয়ার্কফ্লো (ধাপে ধাপে)

ধরো লোকালে চালাচ্ছ:

1. `.env.example` → `.env` কপি, `SITE_URL`, `ADMIN_PANEL_URL`, `USER_NAME`, `PASSWORD`, Woo কী, প্রয়োজনে Google শিট ভেরিয়েবল।
2. `docker compose -f docker-compose.fresh-wordpress.yml up -d` (README অনুযায়ী) — সাইট দাঁড়াক।
3. `npm ci` → `npx playwright install --with-deps chromium`।
4. `npm test` বা UI ডিবাগের জন্য `npm run test:ui`।

Playwright চালু হলে:

- **`playwright.config.ts`** `globalSetup` রান করে → `tests/global-setup.ts` ফোল্ডার/ক্রেডেনশিয়াল/সাইট চেক।
- তারপর `tests/specs` এর `*.spec.ts` **ক্রমানুসারে** চলে—কনফিগে `fullyParallel: false`, `workers` ডিফল্ট 1: **WordPress/DB স্টেবিলিটির জন্য সিকোয়েনশিয়াল**।
- শেষে `globalTeardown`।
- আর্টিফ্যাক্ট: `test-results/`, `playwright-report/`; CI তে JUnit/JSONও।

CI তে: workflow Node সেটআপ → `npm ci` → Playwright ব্রাউজার → Docker/সেটআপ স্ক্রিপ্ট (workflow অনুযায়ী) → `CI=true` সহ টেস্ট—env সিক্রেট ইনজেক্ট।

(টার্মিনালে `npm run test` এক লাইন দেখিয়ে কনফিগে `testDir` ও `globalSetup` পাথ দেখাও।)

---

### 11:30–13:30 — কনফিগারেশন (Playwright + এনভায়রনমেন্ট)

**Playwright হাইলাইট** (`playwright.config.ts`):

- `testDir: ./tests/specs`, `globalSetup` / `globalTeardown`।
- `baseURL`: `SITE_URL` / `PLAYWRIGHT_BASE_URL` / `ADMIN_PANEL_URL` থেকে রিজল্ভ।
- CI vs লোকাল: `globalTimeout`, per-test `timeout`, `retries`, `headless`, `trace`/`video` মোড, `forbidOnly` CI তে।
- `use.storageState`: **লোকালে** `tests/fixtures/.auth/user.json`, **CI তে** `undefined`—লগইন ফ্লো স্পেকে।
- রিপোর্টার লিস্টে কাস্টম `./src/config/flaky-tests-reporter.ts`।

**এনভায়রনমেন্ট** (`.env.example`, `src/config/environment.ts`):

- অ্যাডমিন URL এ **ট্রেইলিং স্ল্যাশ**—কমেন্টে বলা আছে নেভিগেশন মিসম্যাচ এড়াতে।
- Woo ক্রেড: CI তে প্রায়শই `tests/fixtures/api-keys.json` জেনারেট; লোকালে env।
- Google: `GOOGLE_SHEET_URL`, `SHEET_NAME`, `SERVICE_ACCOUNT_UPLOAD_FILE`।
- ডিবাগ: `NON_HEADLESS`, `SLOWMO`, `TIMEOUT_SECONDS`, `MAX_RETRIES`, `PARALLEL_WORKERS`।

(`playwright.config.ts` এ `use` ব্লক ও `projects` এক পলকে স্ক্রল করো।)

---

### 13:30–15:00 — অটোমেশন সেটআপ (ইনস্টল + কমান্ড)

সংক্ষেপে বলো:

- **Node 18+, npm 8+** (`package.json` `engines`)।
- `npm ci` — লকফাইল থেকে ক্লিন ইনস্টল।
- `npx playwright install --with-deps chromium`।
- `cp .env.example .env` ও ভ্যালু পূরণ।
- Docker স্ট্যাক চালু থাকলে `npm test`; ডিবাগে `npm run test:headed` বা `test:debug`।
- কোয়ালিটি গেট: `npm run validate` (type-check + lint + format check)।
- CI পারিটি: `npm run test:ci:full` (`cross-env CI=true` + প্রজেক্ট `flexorder-e2e`)।

---

### 15:00–16:30 — ফ্রেমওয়ার্ক আর্কিটেকচার

- **POM:** স্পেকগুলো সরাসরি সিলেক্টরে ভরা নয়—`src/pages` ক্লাসে মেথড (`navigate`, `login`, `completeSetup` ইত্যাদি)।
- **সার্ভিস লেয়ার:** Google Sheets API `src/services/google-sheet-api.ts`।
- **Utils:** `src/utils/googleSheetHelper.ts`।
- **Fixtures / স্টেট:** `tests/fixtures`, লোকাল auth JSON।
- **গ্লোবাল হুক:** সেটআপে ইনফ্রা ও সাইট প্রি-চেক—টেস্টকে শুধু বিজনেস লজিকে ফোকাস করতে দেয়।

ছোট ডায়াগ্রাম (মুখে বললেই চলবে): Spec → Page Object বা Service → WordPress UI বা REST API বা Google API।

---

### 16:30–17:30 — বেস্ট প্র্যাকটিস (এই প্রজেক্টে)

- **সিকোয়েনশিয়াল রান ও সিঙ্গেল worker**—ডাটাবেস রেস কমাতে।
- **ক্রেডেনশিয়াল:** `.env` কমিট নয়; সিক্রেট CI তে; `api-keys.json` gitignored ধরে নিয়ে কাজ।
- **স্টেবল লোকেটর:** রোল/হেডিং যেখানে সম্ভব—`a-flexorder-setup` এ `getByRole('heading', …)` উদাহরণ।
- **ফ্লেকি ট্র্যাকিং:** কাস্টম রিপোর্টার + `flaky-tests/`।
- **টাইপ সেফটি:** ইন্টারফেস শেয়ার—নতুন টেস্ট ডেটায় `src/interfaces` রিইউজ।
- **ডকুমেন্টেশন:** [BEGINNER_AUTOMATION_EXECUTION_GUIDE_BN.md](./BEGINNER_AUTOMATION_EXECUTION_GUIDE_BN.md), [EXECUTION_GUIDE.md](./EXECUTION_GUIDE.md)।

---

### 17:30–18:30 — নতুন টেস্ট যোগ করা ও কোড রিইউজ

1. `tests/specs/` এ নতুন `something.spec.ts`—নাম `*.spec.ts` রাখো।
2. যদি একই ফ্লো বারবার লাগে, নতুন মেথড **`src/pages`** এর উপযুক্ত ক্লাসে যোগ করো; ছোট হেল্পার **`src/utils`**।
3. API চাইলে **`loadWooCommerceCredentials()`** বা বিদ্যমান সার্ভিস ব্যবহার।
4. শিট-সম্পর্কিত হলে env + `GoogleSheetHelper`/`GoogleSheetAPI` প্যাটার্ন ফলো করো (`ultimateSettings.spec` রেফারেন্স)।
5. টেস্ট আইসোলেশন: শেয়ার্ড শিট ব্যবহার করলে ডেটা মিউটেশনের প্রভাব মাথায় রাখো—স্ট্যাটাস টেস্টগুলোই উদাহরণ।

(নতুন ফাইল তৈরির কিউ: `tests/specs` এ রাইট ক্লিক করে নতুন স্পেক যোগ করার কথা বলতে পারো।)

---

### 18:30–19:30 — কমন মিসটেক এড়ানো + কাজের টিপস

**মিসটেক:**

- `.env` ছাড়া বা ভুল `ADMIN_PANEL_URL` (স্ল্যাশ নিয়ে টানাটানি)।
- Docker/সাইট না চালু করে টেস্ট—`global-setup` ওয়ার্ন বা ফেইল।
- Google টেস্ট চালু কিন্তু সার্ভিস অ্যাকাউন্ট/শিট পারমিশন নেই।
- লোকালে `workers` বাড়িয়ে **ফ্লেকি** বানানো—প্রজেক্ট ডিফল্ট 1 এর কারণ বোঝা।
- commented স্পেক ধরে "টেস্ট নেই" ভাবা—সক্রিয় ফাইল grep/লিস্ট করে নিশ্চিত হওয়া।

**টিপস:**

- প্রথমে `npm run test:ui` দিয়ে ফ্লো দেখা।
- ফেইল হলে `playwright-report` ও `test-results` ট্রেস।
- `expect.soft` যেখানে আছে সেখানে একটা অ্যাসারশন ফেইল পুরো টেস্ট থামায় না—ইনটেনশন বুঝে ব্যবহার।
- বড় স্পেক (`ultimateSettings`) এ এডিটের আগে ছোট সাবসেট রান (`npx playwright test path/to/file`)।

---

### 19:30–20:00 — ক্লোজিং

সংক্ষেপে: এ রিপো **FlexOrder ইকোসিস্টেমের গুণমান** ধরে রাখে—লোকালে Docker, CI তে self-hosted, টেস্ট লেয়ারে POM + API + Sheets। তোমার নেক্সট স্টেপ: `.env` সেটআপ, একবার ফুল `npm test`, তারপর একটি ছোট চেঞ্জ করে PR ফ্লো দেখা।

কোন জায়গায় আটকে গেলে `docs` ফোল্ডার আর এই ভিডিওর টাইমকোডে সেকশন ম্যাপ করে ফিরে আসো। ধন্যবাদ।

---

## সম্পর্কিত ডক

- [FILE_MAPPING.md](./FILE_MAPPING.md)
- [EXECUTION_GUIDE.md](./EXECUTION_GUIDE.md)
- [BEGINNER_AUTOMATION_EXECUTION_GUIDE_BN.md](./BEGINNER_AUTOMATION_EXECUTION_GUIDE_BN.md)
