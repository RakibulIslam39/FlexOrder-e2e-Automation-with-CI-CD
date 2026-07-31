import { test as base } from '@playwright/test';
import { LoginPage } from '../../src/pages/login';
import { OrderSyncSettingsPage } from '../../src/pages/ultimateSettings';
import { SetupAddCredentialsPage } from '../../src/pages/flexorder-setup';
import { OrderStatusUpdater } from '../../src/services/order-status-updater';
import { GoogleSheetAPI } from '../../src/services/google-sheet-api';
import { GoogleSheetHelper } from '../../src/utils/googleSheetHelper';
import env from '../../src/config/environment';

type FlexOrderFixtures = {
    loginPage: LoginPage;
    setupPage: SetupAddCredentialsPage;
    settingsPage: OrderSyncSettingsPage;
};

type FlexOrderWorkerFixtures = {
    /**
     * Service for sync between Google Sheets and WooCommerce.
     *
     * Scoped to the **worker** (not the test) because the
     * `update-order-status.spec.ts` describe block intentionally chains
     * state across tests — Test N writes to `updatedOrders`, Test N+1
     * reads from it. A per-test fixture would wipe this state between
     * tests and break the chain.
     *
     * Parallel safety: tests inside a describe run in the same worker
     * when `fullyParallel: false` (our default), so cross-test sharing
     * stays scoped to a single logical scenario. If a test needs a clean
     * slate it calls `orderStatusUpdater.resetUpdatedOrders()`.
     */
    orderStatusUpdater: OrderStatusUpdater;
    googleSheetAPI: GoogleSheetAPI;
    sheetHelper: GoogleSheetHelper;
};

/**
 * Shared test fixtures for the FlexOrder suite.
 *
 * Page-object fixtures are per-test (they depend on `page`). Google Sheets
 * / WooCommerce service fixtures are per-worker — they hold no browser
 * state and allow dependent tests in a describe block to share the
 * accumulated `updatedOrders` array without resurrecting module-level
 * globals.
 */
export const test = base.extend<FlexOrderFixtures, FlexOrderWorkerFixtures>({
    loginPage: async ({ page }, use) => {
        await use(new LoginPage(page));
    },
    setupPage: async ({ page }, use) => {
        await use(new SetupAddCredentialsPage(page));
    },
    settingsPage: async ({ page }, use) => {
        await use(new OrderSyncSettingsPage(page));
    },
    orderStatusUpdater: [
        async ({}, use) => {
            const updater = new OrderStatusUpdater(env.SERVICE_ACCOUNT_UPLOAD_FILE);
            await use(updater);
        },
        { scope: 'worker' },
    ],
    googleSheetAPI: [
        async ({}, use) => {
            await use(new GoogleSheetAPI(env.SERVICE_ACCOUNT_UPLOAD_FILE));
        },
        { scope: 'worker' },
    ],
    sheetHelper: [
        async ({}, use) => {
            await use(new GoogleSheetHelper(env.SERVICE_ACCOUNT_UPLOAD_FILE));
        },
        { scope: 'worker' },
    ],
});

export { expect } from '@playwright/test';
