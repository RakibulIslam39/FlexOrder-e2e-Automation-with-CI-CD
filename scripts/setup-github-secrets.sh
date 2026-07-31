#!/usr/bin/env bash
#
# setup-github-secrets.sh
# ─────────────────────────────────────────────────────────────────────────────
# Configure GitHub Actions secrets & variables for the FlexOrder E2E pipeline.
#
# This is a TEMPLATE: every value below is a PLACEHOLDER. Replace the ones you
# need, then run the script. Optional entries can be left as-is or removed.
#
# Prerequisites:
#   1. Install the GitHub CLI:   brew install gh   (macOS)
#   2. Authenticate:             gh auth login
#
# Usage:
#   bash scripts/setup-github-secrets.sh
#
# Full reference: docs/CI_SECRETS_AND_VARIABLES.md
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# Target repository (owner/name). Override by exporting REPO before running.
REPO="${REPO:-RakibulIslam39/FlexOrder-e2e-Automation-with-CI-CD}"

echo "==> Target repository: ${REPO}"

# Fail early if gh is missing or not authenticated.
if ! command -v gh >/dev/null 2>&1; then
  echo "ERROR: GitHub CLI (gh) is not installed. Run: brew install gh" >&2
  exit 1
fi
if ! gh auth status >/dev/null 2>&1; then
  echo "ERROR: Not authenticated. Run: gh auth login" >&2
  exit 1
fi

# ─────────────────────────────────────────────────────────────────────────────
# SECRETS  (Settings → Secrets and variables → Actions → Secrets)
# Replace placeholder values with real ones. Comment out any you don't need.
# ─────────────────────────────────────────────────────────────────────────────

set_secret() {
  local name="$1" value="$2"
  if [[ -z "${value}" || "${value}" == PLACEHOLDER_* ]]; then
    echo "  - skip  ${name} (placeholder not filled in)"
    return
  fi
  printf '%s' "${value}" | gh secret set "${name}" --repo "${REPO}" --body -
  echo "  - set   ${name}"
}

echo "==> Setting secrets..."

# --- Required to run the full CI pipeline (GitHub App for private plugins) ---
set_secret "APP_ID"                    "PLACEHOLDER_APP_ID"
set_secret "APP_PRIVATE_KEY"           "PLACEHOLDER_APP_PRIVATE_KEY_PEM"

# --- Optional: Google Sheets integration ---
set_secret "GOOGLE_SHEET_URL"          "PLACEHOLDER_GOOGLE_SHEET_URL"
set_secret "SHEET_NAME"                "PLACEHOLDER_SHEET_NAME"   # e.g. Orders

# --- Optional: FlexOrder Pro license ---
set_secret "FLEXORDER_PRO_LICENSE_KEY" "PLACEHOLDER_LICENSE_KEY"

# --- Optional: Email (SMTP) report notifications ---
set_secret "SMTP_SERVER"               "PLACEHOLDER_SMTP_SERVER"  # e.g. smtp.gmail.com
set_secret "SMTP_PORT"                 "PLACEHOLDER_SMTP_PORT"    # e.g. 587
set_secret "SMTP_USERNAME"             "PLACEHOLDER_SMTP_USERNAME"
set_secret "SMTP_PASSWORD"             "PLACEHOLDER_SMTP_PASSWORD"
set_secret "EMAIL_TO"                  "PLACEHOLDER_EMAIL_TO"

# --- Optional: Slack notifications ---
set_secret "SLACK_WEBHOOK_URL"         "PLACEHOLDER_SLACK_WEBHOOK_URL"

# ─────────────────────────────────────────────────────────────────────────────
# VARIABLES  (Settings → Secrets and variables → Actions → Variables)
# These currently have safe hard-coded defaults in ci-workflow.yml. Only set
# them here if you want to manage them from the UI via ${{ vars.NAME }}.
# ─────────────────────────────────────────────────────────────────────────────

set_var() {
  local name="$1" value="$2"
  if [[ -z "${value}" || "${value}" == PLACEHOLDER_* ]]; then
    echo "  - skip  ${name} (placeholder not filled in)"
    return
  fi
  gh variable set "${name}" --repo "${REPO}" --body "${value}"
  echo "  - set   ${name}"
}

echo "==> Setting variables..."

set_var "NODE_VERSION"            "18"
set_var "WORDPRESS_URL"           "http://localhost:8080"
set_var "WORDPRESS_ADMIN_USER"    "admin"
set_var "WORDPRESS_ADMIN_PASSWORD" "admin123"
set_var "WORDPRESS_ADMIN_EMAIL"   "admin@example.com"

echo "==> Done. Review with:"
echo "    gh secret list   --repo ${REPO}"
echo "    gh variable list --repo ${REPO}"
