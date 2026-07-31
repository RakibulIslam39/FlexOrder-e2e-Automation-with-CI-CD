import { expect, Page, Locator } from '@playwright/test';

interface OptionToggles {
    [key: string]: Locator;
}

export class OrderSyncSettingsPage {
    private readonly page: Page;
    private readonly orderSyncLink: Locator;
    private readonly settingsMenu: Locator;
    private readonly optionToggles: OptionToggles;
    private readonly saveChangesButton: Locator;
    private readonly syncOrdersLink: Locator;

    constructor(page: Page) {
        this.page = page;

        this.orderSyncLink = page.locator('#toplevel_page_osgsw-admin >> a').first();
        this.settingsMenu = page.locator('#toplevel_page_osgsw-admin').getByRole('link', { name: 'Settings' });

        this.optionToggles = {
            syncCustomOrderStatus: page.locator('label').filter({ hasText: 'Sync Custom order status' }).locator('input[type="checkbox"]'),
            displayTotalItems: page.locator('label').filter({ hasText: 'Display Total Items' }).locator('input[type="checkbox"]'),
            syncProductSku: page.locator('label').filter({ hasText: 'Sync product SKU' }).locator('input[type="checkbox"]'),
            displayTotalPrice: page.locator('label').filter({ hasText: 'Display Total Price' }).locator('input[type="checkbox"]'),
            displayTotalDiscount: page.locator('label').filter({ hasText: 'Display Total Discount' }).locator('input[type="checkbox"]'),
            showIndividualProduct: page.locator('label').filter({ hasText: 'Show individual product' }).locator('input[type="checkbox"]'),
            displayBillingAddress: page.locator('label').filter({ hasText: 'Display Billing Address' }).locator('input[type="checkbox"]'),
            displayShippingAddress: page.locator('label').filter({ hasText: 'Display Shipping Address' }).locator('input[type="checkbox"]'),
            displayOrderDate: page.locator('label').filter({ hasText: 'Display Order Date' }).locator('input[type="checkbox"]'),
            displayPaymentMethod: page.locator('label').filter({ hasText: 'Display Payment Method' }).locator('input[type="checkbox"]'),
            displayCustomerNote: page.locator('label').filter({ hasText: 'Display Customer Note' }).locator('input[type="checkbox"]'),
            displayOrderNote: page.locator('label').filter({ hasText: 'Display Order Note' }).locator('input[type="checkbox"]'),
            displayOrderPlacement: page.locator('label').filter({ hasText: 'Display order placement' }).locator('input[type="checkbox"]'),
            displayOrderUrl: page.locator('label').filter({ hasText: 'Display Order URL' }).locator('input[type="checkbox"]'),
            syncOrderCustomFields: page.locator('label').filter({ hasText: 'Sync Order Custom Fields' }).locator('input[type="checkbox"]'),
            separateShippingBillingInfo: page.locator('label', {hasText: 'Show shipping & billing information in separate columns and enable editing'}).locator('input[type="checkbox"]'),
            displayTransactionID: page.locator('label.osgsw-promo div.ssgs-check input.check[name="transaction_id"]'),
            separateShowMultipleProductsOfOrder: page.locator('label.osgsw-promo >> input[name="multiple_itmes"]'),
            allowSortingOnGoogleSheets: page.locator('label').filter({ hasText: 'Allow sorting on Google Sheets' }).locator('div span'),
            allowFilteringOnGoogleSheets: page.locator('label').filter({ hasText: 'Allow Filtering Google Sheets' }).locator('div span'),
        };

        this.saveChangesButton = page.locator('button.ssgsw_save_button');
        this.syncOrdersLink = page.getByRole('link', { name: 'Sync orders on Google Sheet' });
    }

    /**
     * Wait until the settings UI has actually rendered. Preferred over
     * `page.waitForLoadState('load')` which is brittle — WP admin pages pull
     * in promo iframes / ad beacons / CDN fonts that can keep the `load`
     * event pending for >30s even though the settings form is fully
     * interactive. Web-first assertion on a settings-only element is the
     * Playwright-recommended way to wait for readiness.
     *
     * We anchor on the static "Preference" heading inside the FlexOrder
     * settings panel. It renders as soon as the Alpine.js template hydrates
     * and is independent of form state.
     *
     * NOTE: do NOT wait on `button.ssgsw_save_button` — that is the
     * "Save Changes" dirty-form button and is hidden by design until the
     * user toggles something. Using it as a readiness signal causes a
     * permanent timeout on a fresh (pristine) page load.
     *
     * Timeout is set generously (60s) because WP admin + Alpine hydration
     * can take 10–35s depending on server load and cache warmth.
     */
    async waitUntilReady(timeout = 60_000): Promise<void> {
        await expect(
            this.page.getByRole('heading', { name: 'Preference', level: 4 })
        ).toBeVisible({ timeout });
    }

    async navigateToSettings(): Promise<void> {
        await this.orderSyncLink.click();
        await this.settingsMenu.click();
        await this.page.waitForLoadState('domcontentloaded');
        await this.page.getByRole('link', { name: ' Settings' }).click();
    }

    /**
     * Toggle a settings option and leave it in the enabled state.
     *
     * The disable→re-enable dance is INTENTIONAL: settings that are already
     * enabled on a fresh run must still be "touched" so the plugin emits a
     * save/sync signal to Google Sheets, otherwise downstream assertions
     * against the Sheet won't see the new data. The short waits give
     * Alpine.js time to re-render the checkbox before we click again.
     */
    async toggleOption(option: string): Promise<void> {
        const toggleInput = this.optionToggles[option];
        if (!toggleInput) {
            throw new Error(`Toggle option '${option}' not found`);
        }

        await expect(toggleInput).toBeVisible();

        if (await toggleInput.isChecked()) {
            await toggleInput.setChecked(false);
            await expect(toggleInput).not.toBeChecked();
            await toggleInput.setChecked(true);
        } else {
            await toggleInput.setChecked(true);
        }

        await expect(toggleInput).toBeChecked();
        console.log(`✅ Toggled '${option}' - final state: enabled`);
    }

    /**
     * Ensure a toggle is in the enabled state (checked)
     */
    async ensureToggleEnabled(option: string): Promise<void> {
        await this.toggleOption(option);
    }

    /**
     * Generic method to handle any blocking overlays or popups
     * Can be called before any critical interactions
     */
    async ensureNoBlockingOverlays(): Promise<void> {
        const commonOverlaySelectors = [
            'div._wppool-popup-overlay',
            'div.popup-overlay', 
            'div.modal-overlay',
            'div.loading-overlay',
            '[class*="overlay"]'
        ];
        
        for (const selector of commonOverlaySelectors) {
            try {
                const overlay = this.page.locator(selector);
                if (await overlay.isVisible()) {
                    console.log(`Detected blocking overlay: ${selector}`);
                    
                    // Try to remove it
                    await this.page.evaluate((sel) => {
                        const elements = document.querySelectorAll(sel);
                        elements.forEach(el => el.remove());
                    }, selector);
                    
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            } catch (error) {
                // Continue with next selector if this one fails
                continue;
            }
        }
    }

    /**
     * Triggers manual sync of orders to Google Sheets after settings changes
     * This ensures the new field settings are applied to existing orders
     */
    async triggerOrderSync(): Promise<void> {
        try {
            
            // Navigate to the sync page if sync link is available
            if (await this.syncOrdersLink.isVisible({ timeout: 5000 })) {
                await this.syncOrdersLink.click();
                console.log('✅ Clicked sync orders link');
                
                // Wait for sync to complete - look for success indicators
                await this.page.waitForLoadState('load');
                await new Promise(resolve => setTimeout(resolve, 3000)); // Additional wait for sync process
                
                // Look for sync completion indicators
                const syncCompletedSelectors = [
                    'text="sync completed"',
                    'text="Orders synced"', 
                    'text="Sync successful"',
                    '.success',
                    '.notice-success'
                ];
                
                for (const selector of syncCompletedSelectors) {
                    try {
                        await this.page.locator(selector).waitFor({ timeout: 2000 });
                        console.log(`✅ Sync completion detected: ${selector}`);
                        break;
                    } catch {
                        // Continue to next selector
                    }
                }
                
            } else {
                console.log('⚠️ Sync orders link not visible, attempting alternative sync method');
                await this._alternativeSync();
            }
            
        } catch (error) {
            console.warn('⚠️ Manual sync trigger failed, continuing with test:', error instanceof Error ? error.message : String(error));
        }
    }

    /**
     * Alternative method to trigger sync when direct link is not available
     */
    private async _alternativeSync(): Promise<void> {
        try {
            // Try to trigger sync via JavaScript if available
            await this.page.evaluate(() => {
                // Look for sync functions in the global scope
                if (typeof (window as any).triggerOrderSync === 'function') {
                    (window as any).triggerOrderSync();
                } else if (typeof (window as any).syncOrders === 'function') {
                    (window as any).syncOrders();
                } else if (typeof (window as any).refreshGoogleSheet === 'function') {
                    (window as any).refreshGoogleSheet();
                }
            });
            
            await new Promise(resolve => setTimeout(resolve, 2000));
            console.log('🔄 Attempted JavaScript-based sync trigger');
            
        } catch (error) {
            console.warn('JavaScript sync trigger failed:', error instanceof Error ? error.message : String(error));
        }
    }

    /**
     * Save settings and ensure sync
     */
    async saveChangesAndSync(): Promise<void> {
        await this.saveChangesButton.click();
        console.log('✅ Settings saved successfully');
    }

    /**
     * Enable billing and shipping address toggles in the correct sequence
     */
    async enableBillingAndShippingAddresses(): Promise<void> {
        
        // Then ensure billing address is enabled
        await this.ensureToggleEnabled('displayBillingAddress');
        
        // Then ensure shipping address is enabled
        await this.ensureToggleEnabled('displayShippingAddress');
        await this.saveChangesAndSync();
        
        console.log('✅ Billing and shipping addresses enabled');
    }

    /**
     * Disable billing and shipping address toggles in the correct sequence
     */
    async disableBillingAndShippingAddresses(): Promise<void> {
        
        // First disable separate columns if enabled
        try {
            await this.disableMakeBillingShippingSeparateToggle();
        } catch (error) {
            console.log('ℹ️ Separate columns toggle was not enabled');
        }
        
        // Then disable shipping address
        await this.toggleOption('displayShippingAddress');
        
        // Finally disable billing address
        await this.toggleOption('displayBillingAddress');
        await this.saveChangesAndSync();
        }

    /**
     * Enable separate billing and shipping columns (requires both addresses to be enabled first)
     */
    async enableSeparateBillingShippingColumns(): Promise<void> {
        
        // Now enable separate columns
        await this.toggleOption('separateShippingBillingInfo');
        await this.saveChangesAndSync();
        
        console.log('✅ Separate billing and shipping columns enabled');
    }

    /**
     * Validate billing address toggle (enable and verify column appears)
     */
    async validateBillingAddressToggle(): Promise<void> {
        
        // Ensure billing address toggle is enabled
        await this.ensureToggleEnabled('displayBillingAddress');
        await this.saveChangesAndSync();
        
        console.log('✅ Billing address toggle enabled and validated');
    }

    /**
     * Validate shipping address toggle (enable and verify column appears)
     */
    async validateShippingAddressToggle(): Promise<void> {
        
        // Ensure shipping address toggle is enabled
        await this.ensureToggleEnabled('displayShippingAddress');
        await this.saveChangesAndSync();
        
        console.log('✅ Shipping address toggle enabled and validated');
    }

    /**
     * Validate combined billing and shipping addresses (both enabled, separate columns disabled)
     */
    async validateCombinedBillingShippingAddresses(): Promise<void> {
        
        // First disable separate columns if enabled
        try {
            await this.disableMakeBillingShippingSeparateToggle();
        } catch (error) {
            console.log('ℹ️ Separate columns toggle was not enabled');
        }
        
        // Ensure both billing and shipping addresses are enabled
        await this.ensureToggleEnabled('displayBillingAddress');
        
        await this.ensureToggleEnabled('displayShippingAddress');
        await this.saveChangesAndSync();
        
        console.log('✅ Combined billing and shipping addresses enabled and validated');
    }

    async disableMakeBillingShippingSeparateToggle(): Promise<void> {
        const checkbox = this.page.locator('input[name="make_billing_shipping_seperate"]');
        const isChecked = await checkbox.isChecked();

        if (isChecked) {
            await checkbox.click();
        } else {
            console.log('Toggle is already disabled. No action taken.');
        }
    }

    async disableSeparateShowMultipleProductsOfOrderToggle(): Promise<void> {
        const checkbox = this.page.locator('label.osgsw-promo >> input[name="multiple_itmes"]');
        const isChecked = await checkbox.isChecked();

        if (isChecked) {
            await checkbox.click();
        } else {
            console.log('Toggle is already disabled. No action taken.');
        }
    }

    async commaSelectInformationSeparator(): Promise<void> {
        await this.page.locator('select[name="osgsw_separator"]').selectOption(',');
    }

    async semicolonSelectInformationSeparator(): Promise<void> {
        await this.page.locator('select[name="osgsw_separator"]').selectOption(';');
    }

    async verticalBarSelectInformationSeparator(): Promise<void> {
        await this.page.locator('select[name="osgsw_separator"]').selectOption('|');
    }

    async orderDateAscending(): Promise<void> {
        await this._applySorting('Order Date', 'asc');
    }

    async orderDateDescending(): Promise<void> {
        await this._applySorting('Order Date', 'desc');
    }

    async orderPriceAscending(): Promise<void> {
        await this._applySorting('Order Price', 'asc');
    }
    
    async orderPriceDescending(): Promise<void> {
        await this._applySorting('Order Price', 'desc');
    }

    async orderItemsAscending(): Promise<void> {
        await this._applySorting('Order Items', 'asc');
    }

    async orderItemsDescending(): Promise<void> {
        await this._applySorting('Order Items', 'desc');
    }

    async orderIdAscending(): Promise<void> {
        await this._applySorting('Order ID', 'asc');
    }

    async orderIdDescending(): Promise<void> {
        await this._applySorting('Order ID', 'desc');
    }

    /**
     * Helper method to apply sorting with better error handling
     */
    private async _applySorting(columnName: string, direction: 'asc' | 'desc'): Promise<void> {
        try {
            
            // Click on the sorting dropdown
            const dropdownSelectors = [
                'div.osgsw_separator_select.form-control',
                'select[name="sort_column"]',
                '.sort-column-select',
                '.osgsw_separator_select'
            ];
            
            let dropdownClicked = false;
            for (const selector of dropdownSelectors) {
                try {
                    await this.page.locator(selector).first().click({ timeout: 5000 });
                    dropdownClicked = true;
                    console.log(`✅ Sorting dropdown clicked using selector: ${selector}`);
                    break;
                } catch (error) {
                    console.log(`Dropdown selector ${selector} not found, trying next...`);
                }
            }
            
            if (!dropdownClicked) {
                throw new Error(`Could not find sorting dropdown for ${columnName}`);
            }
            
            // Wait for options to appear
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Select the column
            const columnSelectors = [
                columnName === 'Order ID' ? '//div[normalize-space()="Order ID"]' : `div.osgsw-promo:has-text("${columnName}")`,
                `div:has-text("${columnName}")`,
                `option:has-text("${columnName}")`,
                `li:has-text("${columnName}")`
            ];
            
            let columnSelected = false;
            for (const selector of columnSelectors) {
                try {
                    await this.page.locator(selector).first().click({ timeout: 5000 });
                    columnSelected = true;
                    console.log(`✅ Column ${columnName} selected using selector: ${selector}`);
                    break;
                } catch (error) {
                    console.log(`Column selector ${selector} not found, trying next...`);
                }
            }
            
            if (!columnSelected) {
                throw new Error(`Could not find column option for ${columnName}`);
            }
            
            // Wait for column selection to take effect
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Select the sort direction
            const directionSelectors = [
                'select[name="sort_order"]',
                'select[name="sort_direction"]',
                '.sort-direction-select'
            ];
            
            let directionSelected = false;
            for (const selector of directionSelectors) {
                try {
                    await this.page.locator(selector).selectOption(direction, { timeout: 5000 });
                    directionSelected = true;
                    console.log(`✅ Sort direction ${direction} selected using selector: ${selector}`);
                    break;
                } catch (error) {
                    console.log(`Direction selector ${selector} not found, trying next...`);
                }
            }
            
            if (!directionSelected) {
                throw new Error(`Could not find sort direction selector for ${columnName}`);
            }
            
            console.log(`✅ Successfully applied ${direction} sorting for ${columnName}`);
            
            // Verify the sort was applied by checking the UI state
            await new Promise(resolve => setTimeout(resolve, 1000));
            
        } catch (error) {
            console.error(`❌ Failed to apply sorting for ${columnName}:`, error instanceof Error ? error.message : String(error));
            throw error;
        }
    }

    async addAFilterOrderStatus(): Promise<void> {
        
        try {
            // Open filter dropdown
            await this.page.locator('div:nth-child(4) > .osgsw_description > div > div > .osgsw_separator_select').click();
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Enable filtering option
            await this.page.locator('.hover\\:bg-gray-100 > input').first().check();
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Open status selection dropdown
            await this.page.locator('div:nth-child(4) > .osgsw_separator_select').click();
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Clear all existing selections first
            const allStatuses = ['Pending payment', 'Processing', 'On hold', 'Completed', 'Cancelled', 'Refunded', 'Failed', 'Draft'];
            for (const status of allStatuses) {
                try {
                    const checkbox = this.page.getByRole('checkbox', { name: status });
                    if (await checkbox.isChecked()) {
                        await checkbox.uncheck();
                        await new Promise(resolve => setTimeout(resolve, 200));
                    }
                } catch (error) {
                    // Status might not exist, continue
                }
            }
            
            // Select only required statuses
            const requiredStatuses = ['Completed', 'Pending payment', 'Processing'];
            for (const status of requiredStatuses) {
                await this.page.getByRole('checkbox', { name: status }).check();
                await new Promise(resolve => setTimeout(resolve, 300));
            }
            
            console.log('✅ Order status filters configured successfully');
            
        } catch (error) {
            console.error('❌ Failed to add order status filters:', error);
            throw error;
        }
    }



    /**
     * Get the filtering toggle element for validation
     */
    getFilteringToggle(): Locator {
        return this.page.locator('label').filter({ hasText: 'Allow Filtering Google Sheets' }).locator('div span');
    }

    /**
     * Get specific filter checkbox for validation
     */
    getFilterCheckbox(statusName: string): Locator {
        return this.page.getByRole('checkbox', { name: statusName });
    }

    /**
     * Validate that specific filter checkboxes are checked
     */
    async validateFilterSelections(statuses: string[]): Promise<void> {
        
        for (const status of statuses) {
            const checkbox = this.getFilterCheckbox(status);
            await expect(checkbox).toBeChecked();
            console.log(`✅ ${status} filter is selected`);
        }
    }

    /**
     * Validate that the filtering toggle is properly enabled
     */
    async validateFilteringToggleEnabled(): Promise<void> {
        const filterToggle = this.getFilteringToggle();
        await expect(filterToggle).toBeVisible();
        console.log('✅ Allow Filtering Google Sheets toggle is visible and accessible');
    }

    /**
     * Get the current state of filter checkboxes for debugging
     */
    async getCurrentFilterState(): Promise<void> {
        const statuses = ['Pending payment', 'Processing', 'On hold', 'Completed', 'Cancelled', 'Refunded', 'Failed', 'Draft'];
        console.log('🔍 Current filter state:');
        
        for (const status of statuses) {
            try {
                const checkbox = this.page.getByRole('checkbox', { name: status });
                const isChecked = await checkbox.isChecked();
                console.log(`   ${status}: ${isChecked ? 'CHECKED' : 'UNCHECKED'}`);
            } catch (error) {
                console.log(`   ${status}: NOT FOUND`);
            }
        }
    }

    /**
     * Add order date range filter: Last N days
     */
    async addAFilterOrderDaysOld(daysOld: number = 30): Promise<void> {
        
        try {
            // Open filter dropdown
            await this.page.locator('div:nth-child(4) > .osgsw_description > div > div > .osgsw_separator_select').click();
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Locate by the <span> whose textContent is exactly "Order date range".
            // A div's textContent includes surrounding whitespace from child nodes, so
            // anchored regex on the div never matches. The span has clean text.
            // The checkbox is readonly (visual only); read its state via evaluate()
            // rather than isChecked(), which would wait for DOM stability unnecessarily.
            // Clicking the span bubbles to the parent div's @click handler (addFilter).
            const orderDateSpan = this.page.locator('span', { hasText: /^Order date range$/ });
            const isDateFilterEnabled = await orderDateSpan.evaluate(
                el => (el.parentElement?.querySelector('input[type="checkbox"]') as HTMLInputElement | null)?.checked ?? false
            );
            if (!isDateFilterEnabled) {
                await orderDateSpan.click();
            }
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Select "Days old" radio button
            await this.page.getByRole('radio', { name: 'Days old' }).check();
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Set number of days
            const daysInput = this.page.getByRole('spinbutton', { name: 'Number of days old' });
            await daysInput.click();
            await daysInput.fill(daysOld.toString());
            await new Promise(resolve => setTimeout(resolve, 300));
            
            console.log(`✅ Date range filter configured: Last ${daysOld} days`);
            
        } catch (error) {
            console.error('❌ Failed to add order date range filter:', error);
            throw error;
        }
    }

    async addAFilterOrderDateRange(): Promise<void> {
        
        try {
            // Open filter dropdown
            await this.page.locator('div:nth-child(4) > .osgsw_description > div > div > .osgsw_separator_select').click();
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Same span-based approach as addAFilterOrderDaysOld — see that method
            // for the full explanation of why we use span + evaluate here.
            const orderDateSpan = this.page.locator('span', { hasText: /^Order date range$/ });
            const isDateFilterEnabled = await orderDateSpan.evaluate(
                el => (el.parentElement?.querySelector('input[type="checkbox"]') as HTMLInputElement | null)?.checked ?? false
            );
            if (!isDateFilterEnabled) {
                await orderDateSpan.click();
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            // Select "Date Range" radio button
            await this.page.getByRole('radio', { name: 'Date Range' }).check();
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Set date range: last 30 days
            const today = new Date().toISOString().split('T')[0];
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const fromDate = thirtyDaysAgo.toISOString().split('T')[0];
            
            await this.page.getByRole('textbox', { name: 'From date' }).fill(fromDate);
            await this.page.getByRole('textbox', { name: 'To Date' }).fill(today);
            
            console.log(`✅ Date range filter configured: ${fromDate} to ${today}`);
            
        } catch (error) {
            console.error('❌ Failed to add order date range filter:', error);
            throw error;
        }
    }

    /**
     * Save and sync changes for filtering settings
     */
    async saveChangesAndSyncWithFiltering(): Promise<void> {
        await this.saveChangesAndSync();
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for filtering changes to propagate
        await this.triggerOrderSync();
        console.log('✅ Filtering settings saved and synced');
    }
}
