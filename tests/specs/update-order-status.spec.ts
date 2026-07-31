import { test, expect } from '../fixtures/test-fixtures';
import { orderStatuses, type OrderStatus } from '../../src/services/order-status-updater';

test.describe('Google Sheets to WooCommerce Order Status Sync', () => {
    let originalStatus: string;
    let orderId: string;

    test('should fetch and verify current order status', async ({ orderStatusUpdater }) => {
        const firstOrder = await orderStatusUpdater.fetchFirstOrder('Orders!A2:Z2');
        expect.soft(firstOrder).not.toBeNull();
        expect.soft(firstOrder!.length).toBeGreaterThan(2);
        [orderId, , originalStatus] = firstOrder!;
        expect.soft(orderStatuses).toContain(originalStatus as OrderStatus);

        console.log(`Current Status of Order ID ${orderId}: ${originalStatus}`);
    });

    test('should update order status to a new valid status', async ({ orderStatusUpdater }) => {
        const availableStatuses = orderStatuses.filter((status) => status !== originalStatus);
        expect.soft(availableStatuses.length).toBeGreaterThan(0);

        const newStatus = availableStatuses[Math.floor(Math.random() * availableStatuses.length)];
        await orderStatusUpdater.updateOrderStatusInSheet(orderId, newStatus);

        const storedOrder = orderStatusUpdater.updatedOrders.find((order) => order.id === orderId);
        expect.soft(storedOrder).toBeDefined();
        expect.soft(storedOrder!.status).toBe(newStatus);
        expect.soft(storedOrder!.status).not.toBe(originalStatus);

        console.log(`Updated status from ${originalStatus} to ${newStatus}`);
    });

    test('should validate status update in WooCommerce', async ({ orderStatusUpdater }) => {
        const storedOrder = orderStatusUpdater.updatedOrders[0];
        expect(storedOrder, 'No previously updated order found').toBeDefined();

        const expectedWooStatus = storedOrder.status.replace('wc-', '');
        const wooOrder = await orderStatusUpdater.fetchOrderWithExpectedStatus(
            storedOrder.id,
            expectedWooStatus,
        );

        expect.soft(wooOrder.id).toBe(Number(storedOrder.id));
        expect.soft(wooOrder.status).toBe(expectedWooStatus);
        expect.soft(wooOrder.status).not.toBe(originalStatus.replace('wc-', ''));

        console.log(`Verified WooCommerce status for Order ID ${storedOrder.id}: ${wooOrder.status}`);
    });

    test('should bulk update and verify status for first 10 orders', async ({ orderStatusUpdater }) => {
        test.setTimeout(180_000);
        orderStatusUpdater.resetUpdatedOrders();

        const orders = await orderStatusUpdater.fetchOrders('Orders!A2:C11');
        expect(orders.length).toBeGreaterThan(0);

        const orderIds = orders.map((order) => order[0]);
        const originalStatuses = orders.map((order) => order[2]);

        const newStatuses = orders.map((order) => {
            const currentStatus = order[2];
            const available = orderStatuses.filter((status) => status !== currentStatus);
            return available[Math.floor(Math.random() * available.length)];
        });

        for (let i = 0; i < orders.length; i++) {
            const id = orderIds[i];
            const newStatus = newStatuses[i];
            const rowIndex = i + 2;

            console.log(`Updating order ${id} from ${originalStatuses[i]} to ${newStatus}`);
            await orderStatusUpdater.updateOrderStatusInSheet(id, newStatus, rowIndex);

            const stored = orderStatusUpdater.updatedOrders.find((order) => order.id === id);
            expect(stored, `Order ${id} not found in updatedOrders`).toBeDefined();
            expect(stored!.status, `Status mismatch for order ${id}`).toBe(newStatus);

            // Rate-limit backoff between writes so we don't overwhelm
            // Google Sheets or the WooCommerce REST API.
            if (i < orders.length - 1) {
                await new Promise((resolve) => setTimeout(resolve, 3000));
            }
        }

        // `fetchOrderWithExpectedStatus` polls with exponential backoff so
        // WooCommerce write→read propagation lag (object cache / CDN /
        // replication) can never surface as a false negative here.
        for (let i = 0; i < orderIds.length; i++) {
            const id = orderIds[i];
            const expectedStatus = newStatuses[i].replace('wc-', '');

            const wooOrder = await orderStatusUpdater.fetchOrderWithExpectedStatus(
                id,
                expectedStatus,
            );
            expect.soft(wooOrder.id, `Order ID mismatch for ${id}`).toBe(Number(id));
            expect.soft(
                wooOrder.status,
                `Status mismatch in WooCommerce for order ${id}`,
            ).toBe(expectedStatus);

            console.log(`Verified update for Order ${id}: ${wooOrder.status}`);
        }

        console.log(`Successfully updated and verified ${orderIds.length} orders`);
    });
});
