# CI Secrets & Variables Reference

This document lists every **GitHub Actions secret** and **variable** used by the
FlexOrder E2E automation pipeline, plus the **local `.env`** values needed to run
the tests on your own machine.

> **Where these are read**
> - CI/CD: `.github/workflows/ci-workflow.yml` (and the dispatch triggers under
>   `.github/flexorder_workflow/`).
> - Local: `src/config/environment.ts` loads `.env` at the project root.
>
> Nothing in this file contains real credentials — all values are **placeholders**.
> Fill in the real values in GitHub (Settings → Secrets and variables → Actions)
> or in your local `.env` (which is git-ignored).

---

## 1. GitHub Actions Secrets

Set these under **Repo → Settings → Secrets and variables → Actions → Secrets**.

| Secret | Required? | Used for | Example / format |
|--------|-----------|----------|------------------|
| `APP_ID` | Required to run CI | GitHub App ID used to mint a token that downloads the private FlexOrder plugins | `123456` |
| `APP_PRIVATE_KEY` | Required to run CI | GitHub App private key (full PEM, including header/footer) | `-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----` |
| `GOOGLE_SHEET_URL` | Optional | Google Sheets sync tests | `https://docs.google.com/spreadsheets/d/<sheet_id>/edit` |
| `SHEET_NAME` | Optional | Worksheet/tab name for Sheets tests | `Orders` |
| `FLEXORDER_PRO_LICENSE_KEY` | Optional | Pro-gated specs (none wired in currently) | `xxxx-xxxx-xxxx-xxxx` |
| `SMTP_SERVER` | Optional | Email report host (enables the email steps) | `smtp.gmail.com` |
| `SMTP_PORT` | Optional | Email report port (defaults to `587`) | `587` |
| `SMTP_USERNAME` | Optional | SMTP auth user | `ci@example.com` |
| `SMTP_PASSWORD` | Optional | SMTP auth password / app password | `********` |
| `EMAIL_TO` | Optional | Report recipient(s) — enables email steps | `you@example.com` |
| `SLACK_WEBHOOK_URL` | Optional | Slack notifications (enables the Slack steps) | `https://hooks.slack.com/services/T000/B000/xxxx` |

**Notes**
- Email steps only fire when **both** `SMTP_SERVER` and `EMAIL_TO` are set
  (`SMTP_CONFIGURED` gate).
- Slack steps only fire when `SLACK_WEBHOOK_URL` is set (`SLACK_CONFIGURED` gate).
- `APP_ID` / `APP_PRIVATE_KEY` belong to a GitHub App that has access to the
  private `WPPOOL/flexorder` and `WPPOOL/flexorder-ultimate` repos. On a personal
  fork you would need your own App (and access to those plugins) for the full
  pipeline to run — see the caveat at the bottom.

---

## 2. GitHub Actions Variables

These are currently **hard-coded** in the `env:` block of
`.github/workflows/ci-workflow.yml`. They point at the ephemeral Docker WordPress
that only exists during a CI run, so they are safe as defaults. If you prefer to
manage them from the UI, move them to **Settings → Secrets and variables →
Actions → Variables** and reference them as `${{ vars.NAME }}`.

| Variable | Default | Meaning |
|----------|---------|---------|
| `NODE_VERSION` | `18` | Node.js version for the runner |
| `WORDPRESS_URL` | `http://localhost:8080` | Base URL of the CI WordPress container |
| `WORDPRESS_ADMIN_USER` | `admin` | Throwaway CI admin username |
| `WORDPRESS_ADMIN_PASSWORD` | `admin123` | Throwaway CI admin password |
| `WORDPRESS_ADMIN_EMAIL` | `admin@example.com` | Throwaway CI admin email |

> These are **not** secrets — the WordPress instance is created fresh and torn
> down within the same run.

---

## 3. Local `.env` (for running tests on your machine)

Copy the template and fill in values:

```bash
cp .env.example .env
```

`src/config/environment.ts` validates these. Only three are strictly **required**:

| Variable | Required? | Default | Notes |
|----------|-----------|---------|-------|
| `SITE_URL` | **Required** | `http://localhost:8080` | Your test WordPress URL |
| `USER_NAME` | **Required** | — | WP admin username |
| `PASSWORD` | **Required** | — | WP admin password |
| `ADMIN_PANEL_URL` | Optional | `${SITE_URL}/wp-admin/` | Computed if omitted |
| `WOOCOMMERCE_CONSUMER_KEY` | Optional | — | Auto-generated in CI; set manually for local API tests |
| `WOOCOMMERCE_CONSUMER_SECRET` | Optional | — | Same as above |
| `GOOGLE_SHEET_URL` | Optional | — | Needed for Google Sheets specs |
| `SHEET_NAME` | Optional | `Orders` | Worksheet/tab name |
| `SERVICE_ACCOUNT_UPLOAD_FILE` | Optional | `./tests/fixtures/upload_key.json` | Path to Google service-account JSON (git-ignored) |
| `GOOGLE_SHEET_SCOPES` | Optional | `https://www.googleapis.com/auth/spreadsheets` | Rarely changed |
| `SHEET_RANGE` | Optional | `Orders!A1:Z1000` | Rarely changed |
| `DB_HOST` / `DB_NAME` / `DB_USER` / `DB_PASSWORD` | Optional | Docker defaults | Only for local Docker runs |
| `NON_HEADLESS` / `SLOWMO` / `TIMEOUT_SECONDS` / `MAX_RETRIES` / `PARALLEL_WORKERS` | Optional | — | Playwright debug/tuning controls |

> `.env`, `tests/fixtures/upload_key.json`, and `tests/fixtures/api-keys.json`
> are all git-ignored and must **never** be committed.

---

## 4. How to set the secrets & variables

### Option A — GitHub web UI
1. Go to your repo → **Settings** → **Secrets and variables** → **Actions**.
2. **Secrets** tab → **New repository secret** → add each secret from section 1.
3. **Variables** tab → **New repository variable** → add any from section 2 you
   want to externalize.

### Option B — GitHub CLI (scripted)
A ready-to-edit helper lives at [`scripts/setup-github-secrets.sh`](../scripts/setup-github-secrets.sh).
Fill in the placeholder values, then run it. It uses `gh secret set` /
`gh variable set` against `RakibulIslam39/FlexOrder-e2e-Automation-with-CI-CD`.

```bash
# Requires: gh (GitHub CLI) installed + `gh auth login`
bash scripts/setup-github-secrets.sh
```

---

## 5. Caveat: running the full pipeline on a personal repo

`ci-workflow.yml` is written for WPPOOL's infrastructure:

- **`runs-on: self-hosted`** — it needs a self-hosted runner you control. On a
  personal repo, either register your own runner or switch the jobs to
  `runs-on: ubuntu-latest`.
- **Private plugin downloads** — it pulls `WPPOOL/flexorder` and
  `WPPOOL/flexorder-ultimate` via a GitHub App token. Without access to those
  private repos, the "Download Plugin" steps will fail.

For a **portfolio/resume** repo, this is fine to leave documented as-is: it shows
the design of a real CI/CD pipeline. If you want a version that actually runs on
GitHub-hosted runners with public plugins, that's a separate change — ask and it
can be adapted.
