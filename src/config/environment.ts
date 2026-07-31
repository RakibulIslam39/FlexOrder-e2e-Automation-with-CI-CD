import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

/**
 * FlexOrder E2E — Centralised Environment Configuration
 * ──────────────────────────────────────────────────────
 *
 * Single source of truth for environment variables.
 *
 * Execution modes:
 *
 *   Local  (CI unset / CI=false)
 *     - `.env` at project root is loaded by `dotenv.config()` below.
 *     - If `.env` is missing, we throw a helpful error with a pointer to
 *       `.env.example`.
 *
 *   CI     (CI=true, set automatically by GitHub Actions)
 *     - Variables are already present in `process.env`, injected by the
 *       workflow from GitHub Secrets (see `.github/workflows/ci-workflow.yml`).
 *     - `dotenv.config()` is a no-op for already-set variables, so CI values
 *       are never overwritten even if a `.env` file is accidentally present
 *       on the runner.
 *
 * Consumers should import the default `env` export for values and the named
 * helpers (`isCI`, `isLocal`, `hasGoogleSheets`, etc.) for mode checks. No
 * other file should read `process.env.CI` directly — keep the detection
 * centralised so behaviour stays consistent.
 */

// ── Load .env (local) ────────────────────────────────────────────────
// Resolve from the project root so the loader works regardless of cwd
// (ts-node, Playwright, standalone scripts).
const ENV_FILE_PATH = path.resolve(process.cwd(), '.env');
const envFileExists = fs.existsSync(ENV_FILE_PATH);

if (envFileExists) {
    dotenv.config({ path: ENV_FILE_PATH });
}

// ── Mode detection ───────────────────────────────────────────────────
export const isCI: boolean = process.env.CI === 'true';
export const isLocal: boolean = !isCI;

// In local mode, a missing .env is almost always a misconfiguration.
// Fail fast with a pointer to the example file instead of letting the
// downstream validation produce a cryptic “missing USER_NAME” error.
if (isLocal && !envFileExists) {
    const message = [
        '❌ No `.env` file found at project root.',
        '',
        '🔧 Fix:',
        '   cp .env.example .env',
        '   # then fill in the required values',
        '',
        'ℹ️ On CI this file is not needed — GitHub Actions injects the values from Secrets.',
    ].join('\n');
    console.error(message);
    throw new Error('Missing .env file for local execution');
}

// ── Helpers ──────────────────────────────────────────────────────────
/**
 * Join a base URL and a path without producing a double slash, regardless
 * of whether the base URL has a trailing slash.
 */
function joinUrl(base: string, segment: string): string {
    const cleanBase = base.replace(/\/+$/, '');
    const cleanSegment = segment.replace(/^\/+/, '');
    return `${cleanBase}/${cleanSegment}`;
}

function firstDefined(...values: Array<string | undefined>): string | undefined {
    return values.find((value) => typeof value === 'string' && value.length > 0);
}

// ── Environment interface ────────────────────────────────────────────
export interface EnvironmentVariables {
    // Core URLs
    SITE_URL: string;
    ADMIN_PANEL_URL: string;

    // Admin Credentials
    USER_NAME: string;
    PASSWORD: string;

    // Google Sheets (optional)
    GOOGLE_SHEET_URL: string;
    SHEET_NAME: string;
    SERVICE_ACCOUNT_UPLOAD_FILE: string;
    GOOGLE_SHEET_SCOPES: string;
    SHEET_RANGE: string;

    // WooCommerce API (optional — may be loaded from api-keys.json in CI)
    WOOCOMMERCE_CONSUMER_KEY: string;
    WOOCOMMERCE_CONSUMER_SECRET: string;
}

const resolvedSiteUrl =
    firstDefined(process.env.SITE_URL, process.env.URL, process.env.PLAYWRIGHT_BASE_URL) ||
    'http://localhost:8080';

const env: EnvironmentVariables = {
    SITE_URL: resolvedSiteUrl,
    ADMIN_PANEL_URL:
        firstDefined(process.env.ADMIN_PANEL_URL) || joinUrl(resolvedSiteUrl, 'wp-admin/'),

    USER_NAME: firstDefined(process.env.USER_NAME, process.env.ADMIN_USERNAME) || '',
    PASSWORD: firstDefined(process.env.PASSWORD, process.env.ADMIN_PASSWORD) || '',

    GOOGLE_SHEET_URL: process.env.GOOGLE_SHEET_URL || '',
    SHEET_NAME: process.env.SHEET_NAME || 'Orders',
    SERVICE_ACCOUNT_UPLOAD_FILE:
        process.env.SERVICE_ACCOUNT_UPLOAD_FILE || './tests/fixtures/upload_key.json',
    GOOGLE_SHEET_SCOPES:
        process.env.GOOGLE_SHEET_SCOPES || 'https://www.googleapis.com/auth/spreadsheets',
    SHEET_RANGE: process.env.SHEET_RANGE || 'Orders!A1:Z1000',

    WOOCOMMERCE_CONSUMER_KEY: process.env.WOOCOMMERCE_CONSUMER_KEY || '',
    WOOCOMMERCE_CONSUMER_SECRET: process.env.WOOCOMMERCE_CONSUMER_SECRET || '',
};

// ── Required-variable validation ─────────────────────────────────────
// These three must always be present for the WordPress login to work,
// whether tests run locally or in CI.
const REQUIRED_VARS: Array<keyof EnvironmentVariables> = ['SITE_URL', 'USER_NAME', 'PASSWORD'];

const missingVars = REQUIRED_VARS.filter((name) => !env[name]);

if (missingVars.length > 0) {
    const source = isCI ? 'GitHub Secrets / workflow env' : '.env file';
    const hint = isCI
        ? 'Check the `env:` block in .github/workflows/ci-workflow.yml and your repository Secrets.'
        : 'Copy .env.example to .env and fill in the required values.';

    const message = [
        `❌ Missing required environment variables: ${missingVars.join(', ')}`,
        `   Source expected: ${source}`,
        `   ${hint}`,
    ].join('\n');

    console.error(message);
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

console.log(
    `🔧 Environment initialized for ${isCI ? 'CI (GitHub Actions)' : 'Local Development'} ` +
        `(credentials from ${isCI ? 'GitHub Secrets' : '.env file'})`,
);

// ── Capability checks ────────────────────────────────────────────────
/** WooCommerce REST credentials available directly via env. */
export function hasWooCommerceCredentials(): boolean {
    return !!(env.WOOCOMMERCE_CONSUMER_KEY && env.WOOCOMMERCE_CONSUMER_SECRET);
}

/** Google Sheets URL and sheet name configured. */
export function hasGoogleSheets(): boolean {
    return !!(env.GOOGLE_SHEET_URL && env.SHEET_NAME);
}

/** Google Service Account JSON file is present on disk. */
export function hasServiceAccount(): boolean {
    return !!(
        env.SERVICE_ACCOUNT_UPLOAD_FILE &&
        fs.existsSync(path.resolve(process.cwd(), env.SERVICE_ACCOUNT_UPLOAD_FILE))
    );
}

/**
 * Extract Google Sheet ID from the configured Google Sheets URL.
 */
export function getGoogleSheetId(): string {
    if (!env.GOOGLE_SHEET_URL) {
        throw new Error('GOOGLE_SHEET_URL is not configured');
    }
    const match = env.GOOGLE_SHEET_URL.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!match || !match[1]) {
        throw new Error(`Invalid Google Sheet URL format: ${env.GOOGLE_SHEET_URL}`);
    }
    return match[1];
}

/**
 * Shape of the generated api-keys.json produced by scripts/setup-ci-environment.ts.
 */
export interface ApiKeysData {
    consumer_key: string;
    consumer_secret: string;
    site_url: string;
    created_at: string;
}

/**
 * Load WooCommerce credentials.
 *
 * Priority:
 *   1. `tests/fixtures/api-keys.json` (generated in CI by setup-ci-environment.ts)
 *   2. `WOOCOMMERCE_CONSUMER_KEY` / `WOOCOMMERCE_CONSUMER_SECRET` environment
 *      variables (local `.env` or CI workflow env).
 */
export function loadWooCommerceCredentials(): ApiKeysData {
    const apiKeysPath = path.join(process.cwd(), 'tests/fixtures/api-keys.json');

    if (fs.existsSync(apiKeysPath)) {
        try {
            const apiKeys = JSON.parse(fs.readFileSync(apiKeysPath, 'utf8')) as ApiKeysData;
            if (apiKeys.consumer_key && apiKeys.consumer_secret) {
                console.log('🔑 Loaded WooCommerce credentials from api-keys.json');
                return apiKeys;
            }
            console.warn('⚠️ api-keys.json present but missing consumer_key/secret, falling back to env');
        } catch {
            console.warn('⚠️ Failed to parse api-keys.json, falling back to environment variables');
        }
    }

    if (hasWooCommerceCredentials()) {
        console.log(
            `🔑 Using WooCommerce credentials from ${isCI ? 'GitHub Secrets' : '.env'}`,
        );
        return {
            consumer_key: env.WOOCOMMERCE_CONSUMER_KEY,
            consumer_secret: env.WOOCOMMERCE_CONSUMER_SECRET,
            site_url: env.SITE_URL,
            created_at: new Date().toISOString(),
        };
    }

    const hint = isCI
        ? 'Expected api-keys.json (produced by setup-ci-environment.ts) or secrets WOOCOMMERCE_CONSUMER_KEY/SECRET.'
        : 'Add WOOCOMMERCE_CONSUMER_KEY and WOOCOMMERCE_CONSUMER_SECRET to your .env file.';

    throw new Error(`WooCommerce credentials not found. ${hint}`);
}

export default env;
