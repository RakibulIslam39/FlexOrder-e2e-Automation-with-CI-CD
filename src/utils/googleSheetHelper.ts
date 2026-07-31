import { GoogleSheetAPI } from '../services/google-sheet-api';
import { getGoogleSheetId } from '../config/environment';

export class GoogleSheetHelper {
    private googleSheetAPI: GoogleSheetAPI;
    private static RETRY_DELAY = 3000; // Increased for better sync timing
    private static MAX_RETRIES = 5; // Increased retries
    private headers: string[] | null = null;
    private columnMap: Map<string, number> | null = null;
    private lastHeadersHash: string | null = null;

    constructor(authConfigPath: string) {
        this.googleSheetAPI = new GoogleSheetAPI(authConfigPath);
    }

    private getSpreadsheetId(): string {
        return getGoogleSheetId();
    }

    /**
     * Convert a 0-based column index to A1-notation column letters.
     * Correctly handles columns beyond Z (26 → AA, 27 → AB, …, 701 → ZZ, 702 → AAA).
     *
     * The previous implementation used `String.fromCharCode(65 + columnIndex)` which
     * silently produced non-letter characters (`[`, `\`, `]`, `^`, `_`, `` ` ``, …)
     * for columnIndex ≥ 26, leading to "Unable to parse range: Orders!`2" style errors
     * in the Google Sheets API for sheets with more than 26 columns.
     */
    private columnIndexToA1Letter(columnIndex: number): string {
        if (!Number.isInteger(columnIndex) || columnIndex < 0) {
            throw new Error(`Column index must be a non-negative integer, got: ${columnIndex}`);
        }
        let result = '';
        let n = columnIndex + 1; // switch to 1-based (A=1)
        while (n > 0) {
            n--;
            result = String.fromCharCode(65 + (n % 26)) + result;
            n = Math.floor(n / 26);
        }
        return result;
    }

    /**
     * Check if Google Sheets integration is available
     */
    isAvailable(): boolean {
        return this.googleSheetAPI.isAvailable();
    }

    /**
     * Get credentials error if any
     */
    getCredentialsError(): string | null {
        return this.googleSheetAPI.getCredentialsError();
    }

    /**
     * Ensure Google Sheets is available before proceeding
     */
    ensureAvailable(): void {
        if (!this.isAvailable()) {
            const error = this.getCredentialsError();
            throw new Error(`Google Sheets not available: ${error || 'Unknown error'}`);
        }
    }

    /**
     * Gets order information from Google Sheet with retries
     */
    async getOrderInfoWithRetry(orderId: number): Promise<string[]> {
        const orderInfo = await this.waitForOrderSync(orderId);
        if (!orderInfo) {
            throw new Error(`Order ${orderId} not found in Google Sheet after ${GoogleSheetHelper.MAX_RETRIES} attempts`);
        }
        return orderInfo;
    }

    /**
     * Gets the column mapping for the sheet
     */
    async getColumnMap(): Promise<Map<string, number>> {
        if (this.columnMap) {
            return this.columnMap;
        }

        const headers = await this.waitForHeaders();
        this.columnMap = new Map();
        headers.forEach((header, index) => {
            this.columnMap!.set(header, index);
        });
        return this.columnMap;
    }

    /**
     * Gets the value of a field from the order data
     */
    getFieldValue(orderInfo: string[], field: string): string {
        if (!this.columnMap) {
            throw new Error('Column map not initialized. Call getColumnMap() first.');
        }

        const columnIndex = this.columnMap.get(field);
        if (columnIndex === undefined) {
            throw new Error(`Column ${field} not found in sheet`);
        }

        return orderInfo[columnIndex] || '';
    }

    async waitForHeaders(retryCount = GoogleSheetHelper.MAX_RETRIES): Promise<string[]> {
        this.ensureAvailable();
        
        for (let attempt = 1; attempt <= retryCount; attempt++) {
            try {
                console.log(`Attempting to fetch headers (attempt ${attempt}/${retryCount})`);
                // FIXED: Changed from A1:Z1 to A1:AZ1 to cover columns A through AZ (52 columns)
                const rows = await this.googleSheetAPI.readFromSheet(this.getSpreadsheetId(), "Orders!A1:AZ1");
                
                if (rows && rows.length > 0 && rows[0] && rows[0].length > 0) {
                    const headers = rows[0];
                    const headersHash = headers.join('|');
                    
                    // Check if headers have changed (indicating a sync occurred)
                    if (this.lastHeadersHash && this.lastHeadersHash !== headersHash) {
                        console.log('📊 Headers changed, indicating sync occurred');
                        this.headers = null; // Reset cached headers
                        this.columnMap = null; // Reset column map
                    }
                    
                    this.lastHeadersHash = headersHash;
                    this.headers = headers;
                    console.log(`Headers found (${headers.length} columns):`, headers);
                    return headers;
                }

                console.log('No headers found, waiting before retry...');
                if (attempt < retryCount) {
                    await new Promise(resolve => setTimeout(resolve, GoogleSheetHelper.RETRY_DELAY));
                }
            } catch (error) {
                console.error(`Error fetching headers (attempt ${attempt}):`, error);
                if (attempt === retryCount) {
                    throw error;
                }
                await new Promise(resolve => setTimeout(resolve, GoogleSheetHelper.RETRY_DELAY));
            }
        }
        throw new Error(`Failed to fetch headers after ${retryCount} attempts`);
    }

    async validateSheetStructure(): Promise<void> {
        this.ensureAvailable();
        const headers = await this.waitForHeaders();
        const requiredColumns = [
            'Order ID', 'Product Names', 'Order Status', 'Total Items',
            'Product SKU', 'Total Price', 'Billing Details', 'Shipping Details'
        ];

        const missingColumns = requiredColumns.filter(col => !headers.includes(col));
        if (missingColumns.length > 0) {
            throw new Error(`Missing required columns in Google Sheet: ${missingColumns.join(', ')}`);
        }
    }

    /**
     * Wait for a specific column to appear or disappear in the sheet
     */
    async waitForColumnChange(columnName: string, shouldExist: boolean, maxWaitTime = 60000): Promise<boolean> {
        this.ensureAvailable();
        const startTime = Date.now();
        
        while (Date.now() - startTime < maxWaitTime) {
            try {
                const headers = await this.waitForHeaders();
                const columnExists = headers.includes(columnName);
                
                if (columnExists === shouldExist) {
                    console.log(`✅ Column '${columnName}' ${shouldExist ? 'appeared' : 'disappeared'} as expected`);
                    return true;
                }
                
                console.log(`⏳ Waiting for column '${columnName}' to ${shouldExist ? 'appear' : 'disappear'}... Current headers: ${headers.join(', ')}`);
                await new Promise(resolve => setTimeout(resolve, GoogleSheetHelper.RETRY_DELAY));
                
            } catch (error) {
                console.warn(`Error checking for column change: ${error}`);
                await new Promise(resolve => setTimeout(resolve, GoogleSheetHelper.RETRY_DELAY));
            }
        }
        
        console.log(`⚠️ Timeout waiting for column '${columnName}' to ${shouldExist ? 'appear' : 'disappear'}`);
        return false;
    }

    /**
     * Get cell value for a specific header with intelligent retry logic and dynamic column handling
     */
    async getCellValueForHeader(headerName: string, rowIndex = 1, maxAttempts = 5): Promise<string | null> {
        this.ensureAvailable();
        
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                console.log(`🔍 Getting cell value for header "${headerName}" (max attempts: ${maxAttempts})`);
                console.log(`📊 Attempt ${attempt}/${maxAttempts} for "${headerName}"`);
                
                const headers = await this.waitForHeaders();
                
                // Handle dynamic column names and aliases
                const actualHeaderName = this.findActualHeaderName(headerName, headers);
                
                if (!actualHeaderName) {
                    console.log(`❌ Attempt ${attempt} failed for "${headerName}": Header "${headerName}" not found in sheet. Available headers: ${headers.join(', ')}`);
                    
                    if (attempt < maxAttempts) {
                        console.log(`⏳ Retrying in ${GoogleSheetHelper.RETRY_DELAY}ms... (${maxAttempts - attempt} attempts remaining)`);
                        await new Promise(resolve => setTimeout(resolve, GoogleSheetHelper.RETRY_DELAY));
                        continue;
                    } else {
                        throw new Error(`Header "${headerName}" not found in sheet after ${maxAttempts} attempts. Available headers: ${headers.join(', ')}`);
                    }
                }
                
                const columnIndex = headers.indexOf(actualHeaderName);
                const columnLetter = this.columnIndexToA1Letter(columnIndex);
                const cellAddress = `${columnLetter}${rowIndex + 1}`; // A2, B2, ..., AA2, AF2, etc.

                const rows = await this.googleSheetAPI.readFromSheet(this.getSpreadsheetId(), `Orders!${cellAddress}`);
                
                if (rows && rows.length > 0 && rows[0] && rows[0].length > 0) {
                    const value = rows[0][0] || '';
                    console.log(`📋 Found value for "${headerName}" at column ${columnLetter}: "${value}"`);
                    
                    if (value === '') {
                        console.log(`❌ Attempt ${attempt} failed for "${headerName}": No data found in cell ${cellAddress}`);
                        
                        if (attempt < maxAttempts) {
                            console.log(`⏳ Retrying in ${GoogleSheetHelper.RETRY_DELAY}ms... (${maxAttempts - attempt} attempts remaining)`);
                            await new Promise(resolve => setTimeout(resolve, GoogleSheetHelper.RETRY_DELAY));
                            continue;
                        } else {
                            // For final attempt, return empty string (allows tests to handle optional fields properly)
                            return '';
                        }
                    }
                    
                    return value;
                } else {
                    console.log(`❌ Attempt ${attempt} failed for "${headerName}": No data found in cell ${cellAddress}`);
                    
                    if (attempt < maxAttempts) {
                        console.log(`⏳ Retrying in ${GoogleSheetHelper.RETRY_DELAY}ms... (${maxAttempts - attempt} attempts remaining)`);
                        await new Promise(resolve => setTimeout(resolve, GoogleSheetHelper.RETRY_DELAY));
                        continue;
                    } else {
                        // Return empty string for cells with no data on final attempt
                        return '';
                    }
                }
                
            } catch (error) {
                console.error(`Error getting cell value for "${headerName}" (attempt ${attempt}):`, error);
                
                if (attempt === maxAttempts) {
                    throw error;
                }
                
                await new Promise(resolve => setTimeout(resolve, GoogleSheetHelper.RETRY_DELAY));
            }
        }
        
        return null;
    }

    /**
     * Find the actual header name in the sheet, handling aliases and dynamic naming
     */
    private findActualHeaderName(expectedHeader: string, headers: string[]): string | null {
        // Direct match first
        if (headers.includes(expectedHeader)) {
            return expectedHeader;
        }

        // Handle common aliases and variations
        const headerAliases: { [key: string]: string[] } = {
            'Billing Details': ['Billing Details', 'Billing Address', 'Billing Information', 'Billing'],
            'Shipping Details': ['Shipping Details', 'Shipping Address', 'Shipping Information', 'Shipping'],
            'Transaction ID': ['Transaction ID', 'Transaction', 'TXN ID', 'Payment Transaction ID'],
            'Order Date': ['Order Date', 'Date', 'Order Created', 'Created Date'],
            'Payment Method': ['Payment Method', 'Payment', 'Payment Type', 'Payment Gateway'],
            'Customer Note': ['Customer Note', 'Customer Notes', 'Notes', 'Order Notes'],
            'Order Note': ['Order Note', 'Order Notes', 'Admin Notes', 'Internal Notes'],
            'Order Placed by': ['Order Placed by', 'Placed by', 'Customer', 'Ordered by'],
            'Order URL': ['Order URL', 'Order Link', 'URL', 'Order Permalink']
        };

        const aliases = headerAliases[expectedHeader] || [expectedHeader];
        
        for (const alias of aliases) {
            if (headers.includes(alias)) {
                console.log(`🔄 Found header alias: "${expectedHeader}" → "${alias}"`);
                return alias;
            }
        }

        return null;
    }

    /**
     * Wait for Google Sheets to sync after settings changes
     */
    async waitForSyncCompletion(expectedColumns: string[] = [], maxWaitTime = 60000): Promise<void> {
        this.ensureAvailable();
        console.log(`⏳ Waiting for Google Sheets to sync with new settings...`);
        
        const startTime = Date.now();
        
        while (Date.now() - startTime < maxWaitTime) {
            try {
                const headers = await this.waitForHeaders();
                
                // Check if all expected columns are present
                if (expectedColumns.length > 0) {
                    const missingColumns = expectedColumns.filter(col => !headers.includes(col));
                    if (missingColumns.length === 0) {
                        console.log(`✅ All expected columns found: ${expectedColumns.join(', ')}`);
                        return;
                    }
                }
                
                // If no specific columns expected, just wait for headers to stabilize
                if (expectedColumns.length === 0) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    const newHeaders = await this.waitForHeaders();
                    if (JSON.stringify(headers) === JSON.stringify(newHeaders)) {
                        console.log(`✅ Headers stabilized, sync likely complete`);
                        return;
                    }
                }
                
                await new Promise(resolve => setTimeout(resolve, GoogleSheetHelper.RETRY_DELAY));
                
            } catch (error) {
                console.warn(`Error during sync wait: ${error}`);
                await new Promise(resolve => setTimeout(resolve, GoogleSheetHelper.RETRY_DELAY));
            }
        }
        
        console.log(`⚠️ Sync wait timeout after ${maxWaitTime}ms`);
    }

    /**
     * Wait for column structure to stabilize after toggle changes
     */
    async waitForColumnStructureToStabilize(maxWaitTime = 30000): Promise<void> {
        this.ensureAvailable();
        console.log(`⏳ Waiting for column structure to stabilize...`);
        
        const startTime = Date.now();
        let lastHeaders: string[] = [];
        let stableCount = 0;
        const requiredStableCount = 3; // Need 3 consecutive stable reads
        
        while (Date.now() - startTime < maxWaitTime) {
            try {
                const currentHeaders = await this.waitForHeaders();
                
                if (JSON.stringify(currentHeaders) === JSON.stringify(lastHeaders)) {
                    stableCount++;
                    console.log(`📊 Column structure stable (${stableCount}/${requiredStableCount})`);
                    
                    if (stableCount >= requiredStableCount) {
                        console.log(`✅ Column structure stabilized after ${stableCount} consecutive stable reads`);
                        return;
                    }
                } else {
                    stableCount = 0;
                    console.log(`📊 Column structure changed, resetting stability counter`);
                }
                
                lastHeaders = currentHeaders;
                await new Promise(resolve => setTimeout(resolve, 2000));
                
            } catch (error) {
                console.warn(`Error during column structure wait: ${error}`);
                await new Promise(resolve => setTimeout(resolve, GoogleSheetHelper.RETRY_DELAY));
            }
        }
        
        console.log(`⚠️ Column structure stabilization timeout after ${maxWaitTime}ms`);
    }

    async waitForOrderSync(orderId: number, retryCount = GoogleSheetHelper.MAX_RETRIES): Promise<string[] | undefined> {
        for (let attempt = 1; attempt <= retryCount; attempt++) {
            try {
                console.log(`Checking for order ${orderId} in sheet (attempt ${attempt}/${retryCount})`);
                // FIXED: Changed from A1:Z1000 to A1:AZ1000 to cover columns A through AZ
                const rows = await this.googleSheetAPI.readFromSheet(this.getSpreadsheetId(), "Orders!A1:AZ1000");
                
                if (!rows || rows.length < 2) {
                    console.log('No data found in sheet');
                    continue;
                }

                const headers = rows[0];
                if (!headers) {
                    console.log('No headers found in sheet');
                    continue;
                }
                
                const orderIdColumnIndex = headers.findIndex(header => header === 'Order ID');
                if (orderIdColumnIndex === -1) {
                    throw new Error('Order ID column not found in sheet');
                }

                const orderRow = rows.slice(1).find(row => {
                    const rowOrderId = Number(row[orderIdColumnIndex]);
                    return !isNaN(rowOrderId) && rowOrderId === orderId;
                });

                if (orderRow) {
                    console.log(`Order ${orderId} found in sheet`);
                    return orderRow;
                }

                console.log(`Order ${orderId} not found, waiting before retry...`);
                if (attempt < retryCount) {
                    await new Promise(resolve => setTimeout(resolve, GoogleSheetHelper.RETRY_DELAY));
                }
            } catch (error) {
                console.error(`Error checking for order sync (attempt ${attempt}):`, error);
                if (attempt === retryCount) {
                    throw error;
                }
                await new Promise(resolve => setTimeout(resolve, GoogleSheetHelper.RETRY_DELAY));
            }
        }
        return undefined;
    }
}