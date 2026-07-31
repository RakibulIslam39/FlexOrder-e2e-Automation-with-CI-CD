# WooCommerce API Credentials Guide

## Overview

This guide explains how WooCommerce REST API credentials (Consumer Key & Consumer Secret) are automatically generated, stored, and accessed across the FlexOrder automation test suite.

---

## 🔄 How It Works

### 1. **Automatic Generation (CI/CD & Local)**

**When:** During test environment setup
**Where:** `scripts/setup-ci-environment.ts`
**Permissions:** `read_write` (full admin access)

```typescript
// ApiKeyManager generates keys automatically
class ApiKeyManager {
  async generate(): Promise<ApiKeys> {
    // Creates keys in WordPress database with admin permissions
    // User ID: 1 (admin)
    // Permissions: read_write (full access)
    return {
      consumer_key: "ck_xxxxx...",
      consumer_secret: "cs_yyyyy...",
      site_url: "http://localhost:8080",
      created_at: "2025-01-05T..."
    }
  }
}
```

### 2. **Storage Locations**

**Primary:** `tests/utilities/api-keys.json` (auto-generated, gitignored)
```json
{
  "consumer_key": "ck_abc123...",
  "consumer_secret": "cs_def456...",
  "site_url": "http://localhost:8080",
  "created_at": "2025-01-05T12:34:56.789Z"
}
```

**Secondary:** Environment variables (fallback)
```bash
WOOCOMMERCE_CONSUMER_KEY=ck_abc123...
WOOCOMMERCE_CONSUMER_SECRET=cs_def456...
```

### 3. **Loading Mechanism**

**Function:** `loadWooCommerceCredentials()` in `src/config/environment.ts`

**Priority:**
1. ✅ First tries: `tests/utilities/api-keys.json`
2. ✅ Then fallback to: Environment variables
3. ❌ Throws error if neither exists

```typescript
import { loadWooCommerceCredentials } from '../../src/config/environment';

const credentials = loadWooCommerceCredentials();
// Returns: { consumer_key, consumer_secret, site_url, created_at }
```

---

## 📁 Files Using WooCommerce API Credentials

### ✅ **Already Properly Configured**

| File | Purpose | Status |
|------|---------|--------|
| `src/pages/createWcOrder.ts` | Create WooCommerce orders via API | ✅ Using `loadWooCommerceCredentials()` |
| `src/pages/update-order-status.ts` | Update order statuses | ✅ Using `loadWooCommerceCredentials()` |
| `tests/specs/a-woocommerceAPI.spec.ts` | Validate WooCommerce API | ✅ Using `loadWooCommerceCredentials()` |
| `tests/specs/update-order-status.spec.ts` | Test order status sync | ✅ Using OrderStatusUpdater class |
| `tests/specs/createNewOrder.spec.ts` | Test order creation | ✅ Using CreateOrder class |

### 📝 Implementation Examples

#### **Example 1: createWcOrder.ts (Lines 14-22)**
```typescript
constructor(authConfigPath: string) {
    // Load WooCommerce credentials from generated API keys file
    const apiKeys = loadWooCommerceCredentials();
    
    this.api = new WooCommerceRestApi({
        url: apiKeys.site_url || env.SITE_URL,
        consumerKey: apiKeys.consumer_key,
        consumerSecret: apiKeys.consumer_secret,
        version: "wc/v3",
    });
}
```

#### **Example 2: update-order-status.ts (Lines 39-48)**
```typescript
constructor(authConfigPath: string) {
    console.log('🔑 Loading WooCommerce API credentials...');
    const apiKeys = loadWooCommerceCredentials();
    console.log(`✅ WooCommerce API initialized with site: ${apiKeys.site_url}`);
    
    this.api = new WooCommerceRestApi({
        url: apiKeys.site_url || env.SITE_URL,
        consumerKey: apiKeys.consumer_key,
        consumerSecret: apiKeys.consumer_secret,
        version: 'wc/v3'
    });
}
```

#### **Example 3: a-woocommerceAPI.spec.ts (Lines 15-26)**
```typescript
test.beforeAll(async () => {
    // Load WooCommerce API credentials
    const credentials = loadWooCommerceCredentials();
    
    // Initialize WooCommerce REST API client
    api = new WooCommerceRestApi({
        url: credentials.site_url,
        consumerKey: credentials.consumer_key,
        consumerSecret: credentials.consumer_secret,
        version: 'wc/v3',
        queryStringAuth: true
    });
});
```

---

## 🚀 Usage in Your Tests

### **Creating a New Test File**

If you need to create a new test that interacts with WooCommerce API:

```typescript
import { test, expect } from '@playwright/test';
import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';
import { loadWooCommerceCredentials } from '../../src/config/environment';

test.describe('My WooCommerce Test', () => {
    let api: WooCommerceRestApi;

    test.beforeAll(async () => {
        // Load auto-generated credentials
        const credentials = loadWooCommerceCredentials();
        
        // Initialize API client
        api = new WooCommerceRestApi({
            url: credentials.site_url,
            consumerKey: credentials.consumer_key,
            consumerSecret: credentials.consumer_secret,
            version: 'wc/v3'
        });
    });

    test('should validate order details', async () => {
        const orderId = 123;
        const response = await api.get(`orders/${orderId}`);
        
        expect(response.status).toBe(200);
        expect(response.data.id).toBe(orderId);
        // Your validations here
    });
});
```

### **Using Existing Classes**

For more complex operations, use the existing helper classes:

```typescript
import { CreateOrder } from '../../src/pages/createWcOrder';
import { OrderStatusUpdater } from '../../src/pages/update-order-status';
import env from '../../src/config/environment';

// Create orders
const orderCreator = new CreateOrder(env.SERVICE_ACCOUNT_UPLOAD_FILE);
const order = await orderCreator.createOrder();

// Update order status
const statusUpdater = new OrderStatusUpdater(env.SERVICE_ACCOUNT_UPLOAD_FILE);
await statusUpdater.updateOrderStatusInSheet(order.id, 'wc-completed');
```

---

## 🔄 Complete Workflow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. CI/CD Workflow Starts or Local npm run setup:ci         │
└─────────────┬───────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. setup-ci-environment.ts Runs                             │
│    └─ ApiKeyManager.generate()                              │
│       ├─ Verifies WooCommerce is active                     │
│       ├─ Creates API keys in WordPress database             │
│       │  (User ID: 1, Permissions: read_write)              │
│       └─ Returns: { consumer_key, consumer_secret, ... }    │
└─────────────┬───────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Keys Saved to Multiple Locations                         │
│    ├─ tests/utilities/api-keys.json (primary)               │
│    └─ Environment variables (secondary/backup)              │
└─────────────┬───────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Tests Run                                                 │
│    └─ Each test/class calls loadWooCommerceCredentials()    │
│       ├─ Reads from tests/utilities/api-keys.json           │
│       ├─ Or fallback to environment variables               │
│       └─ Returns credentials to initialize WooCommerce API  │
└─────────────┬───────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Tests Execute API Operations                             │
│    ├─ Create orders                                          │
│    ├─ Update order statuses                                 │
│    ├─ Fetch order details                                   │
│    └─ Validate data synchronization                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Troubleshooting

### **Error: "WooCommerce credentials not found"**

**Cause:** API keys file doesn't exist and environment variables aren't set

**Solution:**
```bash
# Run the setup script
npm run setup:ci

# Or manually check if file exists
ls -la tests/utilities/api-keys.json
```

### **Error: "WooCommerce plugin is not active"**

**Cause:** WooCommerce isn't installed or activated

**Solution:** Run full environment setup:
```bash
docker compose -f docker-compose.fresh-wordpress.yml up -d
npm run setup:ci
```

### **Error: "API keys file contains invalid data"**

**Cause:** Corrupted or malformed api-keys.json file

**Solution:** Delete and regenerate:
```bash
rm tests/utilities/api-keys.json
npm run setup:ci
```

### **Error: "401 Unauthorized" from WooCommerce API**

**Possible Causes:**
1. Keys were regenerated but old keys are cached
2. WordPress database was reset
3. Keys have incorrect permissions

**Solution:** Regenerate keys:
```bash
npm run setup:ci
```

---

## 🔒 Security Notes

### **What's Safe**

✅ `tests/utilities/api-keys.json` is in `.gitignore` (never committed)
✅ Keys are generated fresh for each CI run
✅ Keys have proper `read_write` admin permissions
✅ Keys are stored locally and never exposed

### **What's NOT Safe**

❌ DO NOT commit `api-keys.json` to version control
❌ DO NOT hardcode credentials in test files
❌ DO NOT share credentials across different environments
❌ DO NOT manually modify the generated api-keys.json

---

## 📊 Summary

| Aspect | Implementation |
|--------|----------------|
| **Generation** | Automatic via `setup-ci-environment.ts` |
| **Storage** | `tests/utilities/api-keys.json` + env vars |
| **Loading** | `loadWooCommerceCredentials()` function |
| **Permissions** | `read_write` (full admin access) |
| **User** | WordPress admin (User ID: 1) |
| **Version** | WooCommerce REST API v3 |
| **Format** | Standard WooCommerce ck_ and cs_ format |

---

## ✅ Best Practices

1. **Always use `loadWooCommerceCredentials()`** - Never hardcode credentials
2. **Let setup script generate keys** - Don't manually create them
3. **Don't modify api-keys.json** - It's auto-generated
4. **Run setup:ci after WordPress reset** - Ensures fresh keys
5. **Use existing classes** - `CreateOrder`, `OrderStatusUpdater` are pre-configured

---

## 📚 Related Files

- `src/config/environment.ts` - Credential loading logic
- `scripts/setup-ci-environment.ts` - Key generation
- `src/pages/createWcOrder.ts` - Order creation with API
- `src/pages/update-order-status.ts` - Order status updates with API
- `tests/specs/a-woocommerceAPI.spec.ts` - API validation tests

---

**All files are already properly configured!** 🎉

No changes needed - your test suite is already using the auto-generated WooCommerce API credentials correctly.

