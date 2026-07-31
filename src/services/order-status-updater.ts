import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';
import type { sheets_v4 } from 'googleapis';
import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';
import env, { getGoogleSheetId, loadWooCommerceCredentials } from '../config/environment';

export interface UpdatedOrder {
    id: string;
    status: string;
}

export const orderStatuses = [
    'wc-pending',
    'wc-processing',
    'wc-on-hold',
    'wc-completed',
    'wc-cancelled',
    'wc-refunded',
    'wc-failed',
    'wc-checkout-draft',
] as const;

export type OrderStatus = typeof orderStatuses[number];

// Internal timeout wrapper so a stalled Sheets/WC call can never hang the suite.
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, operation: string): Promise<T> {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) =>
            setTimeout(() => reject(new Error(`${operation} timed out after ${timeoutMs}ms`)), timeoutMs)
        ),
    ]);
}

/**
 * Service that synchronizes order statuses between a Google Sheet and WooCommerce.
 *
 * The list of previously-updated orders is stored on the instance (not in a
 * module-level array) so each test/fixture gets an isolated, mutable history
 * and there is no cross-test state leakage when tests run in parallel.
 */
export class OrderStatusUpdater {
    private readonly authConfigPath: string;
    private readonly auth: GoogleAuth;
    private readonly api: WooCommerceRestApi;
    private readonly _updatedOrders: UpdatedOrder[] = [];

    constructor(authConfigPath: string) {
        this.authConfigPath = authConfigPath;
        this.auth = new google.auth.GoogleAuth({
            keyFile: this.authConfigPath,
            scopes: [env.GOOGLE_SHEET_SCOPES],
        });

        const apiKeys = loadWooCommerceCredentials();
        this.api = new WooCommerceRestApi({
            url: apiKeys.site_url || env.SITE_URL,
            consumerKey: apiKeys.consumer_key,
            consumerSecret: apiKeys.consumer_secret,
            version: 'wc/v3',
        });
    }

    /** Snapshot of orders this updater has modified (safe to mutate by caller). */
    get updatedOrders(): UpdatedOrder[] {
        return this._updatedOrders;
    }

    resetUpdatedOrders(): void {
        this._updatedOrders.length = 0;
    }

    async initializeSheets(): Promise<sheets_v4.Sheets> {
        const client = await this.auth.getClient();
        return google.sheets({ version: 'v4', auth: client as any });
    }

    async fetchFirstOrder(range: string): Promise<any[] | null> {
        const sheets = await this.initializeSheets();
        const spreadsheetId = getGoogleSheetId();
        try {
            const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
            return response.data.values ? response.data.values[0] : null;
        } catch (error: any) {
            console.error('Error fetching first order:', error.message);
            throw error;
        }
    }

    async fetchOrders(range: string = env.SHEET_RANGE): Promise<any[][]> {
        const sheets = await this.initializeSheets();
        const spreadsheetId = getGoogleSheetId();
        try {
            const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
            return response.data.values || [];
        } catch (error: any) {
            console.error('Error fetching orders:', error.message);
            throw error;
        }
    }

    async updateOrderStatusInSheet(orderId: string, newStatus: string, rowIndex?: number): Promise<void> {
        if (!orderStatuses.includes(newStatus as OrderStatus)) {
            throw new Error(`Invalid status: ${newStatus}`);
        }

        const sheets = await this.initializeSheets();
        const spreadsheetId = getGoogleSheetId();
        const range = rowIndex ? `${env.SHEET_NAME}!C${rowIndex}` : `${env.SHEET_NAME}!C2`;

        try {
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range,
                valueInputOption: 'USER_ENTERED',
                requestBody: { values: [[newStatus]] },
            });

            // Upsert: if this orderId was already recorded (e.g. it appears in
            // multiple sheet rows), overwrite it so the latest status is the
            // one we find again.
            const existingIndex = this._updatedOrders.findIndex((order) => order.id === orderId);
            if (existingIndex !== -1) {
                this._updatedOrders[existingIndex].status = newStatus;
            } else {
                this._updatedOrders.push({ id: orderId, status: newStatus });
            }
            console.log(`Order ID ${orderId} status updated to "${newStatus}" in Google Sheets`);

            await this.updateWooCommerceStatus(orderId, newStatus);
        } catch (error: any) {
            console.error('Error updating order status in sheet:', error.message);
            throw error;
        }
    }

    async updateWooCommerceStatus(orderId: string, newStatus: string): Promise<any> {
        try {
            const status = newStatus.replace('wc-', '');
            const apiCall = this.api.put(`orders/${orderId}`, { status });
            const response = await withTimeout(apiCall, 60_000, `WooCommerce API PUT orders/${orderId}`);
            const body = response?.data;

            // Verify the server actually acknowledged the update rather than
            // logging success for an empty / error body. This guard caught a
            // real prod-like failure where WP pretty-permalinks were disabled
            // and `/wp-json/*` silently returned the homepage HTML with 200.
            if (!body || typeof body !== 'object' || body.status !== status) {
                throw new Error(
                    `WooCommerce PUT /orders/${orderId} did not confirm status="${status}". ` +
                        `got status=${response?.status ?? 'n/a'} ` +
                        `body=${JSON.stringify(body).slice(0, 500)}`,
                );
            }

            console.log(`Order ${orderId} status updated in WooCommerce to ${status}`);
            return body;
        } catch (error: any) {
            console.error(`Error updating WooCommerce status for order ${orderId}:`, error.message);
            throw error;
        }
    }

    async updateDropdownOptions(): Promise<any> {
        const sheets = await this.initializeSheets();
        const spreadsheetId = getGoogleSheetId();

        const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
        const targetSheet = spreadsheet.data.sheets?.find(
            (sheet) => sheet.properties?.title === env.SHEET_NAME,
        );
        if (!targetSheet || !targetSheet.properties) {
            throw new Error('Target sheet not found');
        }

        const dataValidationRule = {
            requests: [
                {
                    setDataValidation: {
                        range: {
                            sheetId: targetSheet.properties.sheetId,
                            startRowIndex: 1,
                            endRowIndex: 1000,
                            startColumnIndex: 2,
                            endColumnIndex: 3,
                        },
                        rule: {
                            condition: {
                                type: 'ONE_OF_LIST',
                                values: orderStatuses.map((status) => ({ userEnteredValue: status })),
                            },
                            strict: true,
                            showCustomUi: true,
                        },
                    },
                },
            ],
        };

        const response = await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: dataValidationRule,
        });
        console.log('Dropdown options updated successfully');
        return response.data;
    }

    async fetchOrderFromWooCommerce(orderId: string): Promise<any> {
        try {
            const apiCall = this.api.get(`orders/${orderId}`);
            const response = await withTimeout(apiCall, 60_000, `WooCommerce API GET orders/${orderId}`);
            const body = response?.data;

            // Defensive: WC should return a flat order object `{ id, status, ... }`.
            // If an object-cache / CDN / auth proxy interferes we may get an empty
            // body or an error envelope. Fail loudly with the real payload so the
            // root cause is visible in the test output.
            if (!body || typeof body !== 'object' || body.id === undefined) {
                throw new Error(
                    `Unexpected WooCommerce GET /orders/${orderId} response. ` +
                        `status=${response?.status ?? 'n/a'} ` +
                        `body=${JSON.stringify(body).slice(0, 500)}`,
                );
            }

            return body;
        } catch (error: any) {
            console.error(`Error fetching order ${orderId} from WooCommerce:`, error.message);
            throw error;
        }
    }

    /**
     * Fetch an order with bounded polling to absorb WooCommerce write→read
     * propagation lag (object cache, CDN, DB replication). Retries until the
     * order is returned with the expected status, or the attempts budget runs
     * out.
     */
    async fetchOrderWithExpectedStatus(
        orderId: string,
        expectedStatus: string,
        {
            attempts = 5,
            initialDelayMs = 1_000,
        }: { attempts?: number; initialDelayMs?: number } = {},
    ): Promise<any> {
        let lastError: unknown;
        let delay = initialDelayMs;

        for (let attempt = 1; attempt <= attempts; attempt++) {
            try {
                const order = await this.fetchOrderFromWooCommerce(orderId);
                if (order.status === expectedStatus) return order;
                lastError = new Error(
                    `Order ${orderId} status is "${order.status}", expected "${expectedStatus}" ` +
                        `(attempt ${attempt}/${attempts})`,
                );
            } catch (error) {
                lastError = error;
            }

            if (attempt < attempts) {
                await new Promise((resolve) => setTimeout(resolve, delay));
                delay = Math.min(delay * 2, 8_000);
            }
        }

        throw lastError instanceof Error ? lastError : new Error(String(lastError));
    }

    getRandomStatus(): OrderStatus {
        return orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
    }
}
