// import { test, expect } from '@playwright/test';
// import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';
// import { loadWooCommerceCredentials } from '../../src/config/environment';

// /**
//  * WooCommerce REST API Test Suite
//  * 
//  * This test validates WooCommerce REST API connectivity and basic operations
//  * to ensure the API is properly configured for order management tests.
//  */

// test.describe('WooCommerce REST API Tests', () => {
//     let api: WooCommerceRestApi;

//     test.beforeAll(async () => {
//         // Load WooCommerce API credentials
//         const credentials = loadWooCommerceCredentials();
        
//         // Initialize WooCommerce REST API client
//         api = new WooCommerceRestApi({
//             url: credentials.site_url,
//             consumerKey: credentials.consumer_key,
//             consumerSecret: credentials.consumer_secret,
//             version: 'wc/v3',
//             queryStringAuth: true // Force Basic Authentication for local development
//         });

//         console.log('✅ WooCommerce REST API client initialized');
//     });

//     test('should successfully connect to WooCommerce API', async () => {
//         // Test API connectivity by fetching system status
//         const response = await api.get('system_status');
        
//         expect(response.status).toBe(200);
//         expect(response.data).toBeDefined();
//         console.log('✅ WooCommerce API connection successful');
//     });

//     test('should retrieve WooCommerce store information', async () => {
//         // Get store settings
//         const response = await api.get('settings/general');
        
//         expect(response.status).toBe(200);
//         expect(response.data).toBeInstanceOf(Array);
//         expect(response.data.length).toBeGreaterThan(0);
        
//         console.log('✅ Store information retrieved successfully');
//     });

//     test('should list existing products', async () => {
//         // Fetch products list
//         const response = await api.get('products', {
//             per_page: 10,
//             page: 1
//         });
        
//         expect(response.status).toBe(200);
//         expect(response.data).toBeInstanceOf(Array);
        
//         console.log(`✅ Found ${response.data.length} products`);
//     });

//     test('should list existing orders', async () => {
//         // Fetch orders list
//         const response = await api.get('orders', {
//             per_page: 10,
//             page: 1,
//             orderby: 'date',
//             order: 'desc'
//         });
        
//         expect(response.status).toBe(200);
//         expect(response.data).toBeInstanceOf(Array);
        
//         console.log(`✅ Found ${response.data.length} orders`);
        
//         // Log recent order statuses if any exist
//         if (response.data.length > 0) {
//             const statuses = response.data.map((order: any) => order.status);
//             console.log(`   Order statuses: ${statuses.join(', ')}`);
//         }
//     });

//     test('should validate API permissions', async () => {
//         // Test write permissions by creating and deleting a test product
//         const testProduct = {
//             name: 'API Test Product - Delete Me',
//             type: 'simple',
//             regular_price: '9.99',
//             description: 'Temporary product for API testing',
//             short_description: 'API Test',
//             sku: `TEST-API-${Date.now()}`
//         };

//         // Create product
//         const createResponse = await api.post('products', testProduct);
//         expect(createResponse.status).toBe(201);
//         expect(createResponse.data.id).toBeDefined();
        
//         const productId = createResponse.data.id;
//         console.log(`✅ Test product created with ID: ${productId}`);

//         // Delete product (cleanup)
//         const deleteResponse = await api.delete(`products/${productId}`, {
//             force: true // Permanently delete
//         });
//         expect(deleteResponse.status).toBe(200);
        
//         console.log('✅ Test product deleted - API write permissions validated');
//     });

//     test('should handle API errors gracefully', async () => {
//         // Try to fetch a non-existent product
//         try {
//             await api.get('products/999999999');
//             // If we reach here, the test should fail
//             expect(true).toBe(false);
//         } catch (error: any) {
//             // Expect a 404 error
//             expect(error.response?.status).toBe(404);
//             console.log('✅ API error handling works correctly');
//         }
//     });
// });

